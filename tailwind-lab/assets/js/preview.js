/* preview.js — 组装预览 iframe、跑一次「用户代码 + 断言」，把结果以 Promise 交回。
 *
 * 每个容器只保留一个 iframe，重跑 = 重设 srcdoc（新文档、全新全局、旧定时器随文档销毁）。
 * 超时被强杀的帧会被丢掉，下次重建。消息按 runId 过滤，避免上一轮的迟到消息结算这一轮。
 *
 * 文档拼装顺序（契约 docs/01-content-schema.md 里写死了，断言的前提取自这里）：
 *   基础样式 → 用户 CSS → 用户 HTML → Tailwind 编译器 → job 与 send → harness → 用户 JS → 触发跑断言
 *
 * Tailwind 编译器：产物源码在父页面（vendor/tailwind.global.js 已 classic 载入）。
 *   沙箱 iframe 里外链 <script src> 一律 onerror，file:// 下父页面又读不到源码，
 *   所以直接把整份源码文本内联进文档。它自己扫描文档里的 class 生成样式（异步，harness 会等）。
 *
 * 两阶段（响应式判题）：
 *   断言写成 [[阶段1...], [阶段2...]] 就是两阶段。
 *   阶段1 跑完 → 把这一帧的宽度改成 widths[0]（默认 420）→ 帧内完成一次布局 → 再跑阶段2。
 *   阶段2 里可以写 watch('名字')，用帧内 __notify('名字') 把状态回传（判 JS 侧媒体查询分支用）。
 *   width 只改这一帧，不动别的卡片。
 */
(function (root) {

  var BASE_CSS = [
    'html{background:#fff}',
    'body{margin:0;padding:12px;font:14px/1.7 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;color:#232019}'
  ].join('');

  /* 用户代码里出现收尾标签会提前截断我们的文档结构。字符串里把它们写成带反斜杠的形式，
     JS/CSS 里 \/ 与原字符等价，语义不变。 */
  function guard(src, tag) {
    return String(src == null ? '' : src).replace(new RegExp('</' + tag, 'gi'), '<\\/' + tag);
  }

  function buildDoc(job) {
    var json = JSON.stringify(job).replace(/</g, '\\u003c');
    /* Tailwind 编译器：整份源码内联进文档，它自己扫描 class 生成样式 */
    var tw = root.TWLAB_TAILWIND_SRC
      ? '<script>' + guard(root.TWLAB_TAILWIND_SRC, 'script') + '<\/script>'
      : '';
    /* 用户 CSS 走 Tailwind 的源码块（type="text/tailwindcss"）：这样 @theme / @apply / dark: 变体才认。
       只引 theme + utilities，不引 preflight——本训练场沿用其余各站的「不重置元素默认样式」前提
       （h1 还是浏览器默认大小、ul 还有圆点），练习的初始条件才和别的站一致。
       没有注入编译器时（离线兜底）退回普通 <style>，纯 CSS 的练习照样能跑。 */
    var PREAMBLE = '@import "tailwindcss/theme.css";@import "tailwindcss/utilities.css";'
      + '@custom-variant dark (&:where(.dark, .dark *));\n';
    var cssBlock = tw
      ? '<style type="text/tailwindcss">' + PREAMBLE + guard(job.css, 'style') + '</style>'
      : (job.css ? '<style>' + guard(job.css, 'style') + '</style>' : '');
    var tail = '<script>window.TWLAB_JOB=' + json + ';function TWLAB_SEND(m){parent.postMessage(m,"*");}<\/script>'
      + '<script>' + root.TWLAB_HARNESS_SOURCE + '<\/script>'
      + '<script>' + guard(job.js, 'script') + '<\/script>'
      + '<script>window.__twlab_run_tests();<\/script>';

    /* full 模式：html 栏里写的是整份文档（含 doctype），不再注入基础样式与包裹结构 */
    if (job.full) {
      return guard(job.html, 'body')
        + cssBlock
        + tw
        + tail;
    }

    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
      + '<style>' + BASE_CSS + '</style>'
      + cssBlock
      + '</head><body>'
      + guard(job.html, 'body')
      + tw
      + tail
      + '</body></html>';
  }

  /* 断言组：一维数组 = 一组；二维数组（正好两个数组）= 两阶段 [阶段1, 阶段2] */
  function flatten(groups) {
    var out = [];
    (groups || []).forEach(function (g) {
      if (Array.isArray(g)) Array.prototype.push.apply(out, g);
      else out.push(g);
    });
    return out;
  }
  function isTwoStage(tests) {
    return Array.isArray(tests) && tests.length === 2 && tests.every(function (g) { return Array.isArray(g); });
  }
  /* 断言语句里 watch('x') 的名字，用来把阶段2 的测试结果对上编号 */
  function watchNameOf(src) {
    var m = /^\s*watch\(\s*['"]([^'"]+)['"]\s*\)/.exec(String(src));
    return m ? m[1] : null;
  }

  var seq = 0;

  function frameFor(mount) {
    var frame = mount.__twlabFrame;
    if (frame && frame.parentNode === mount && frame.isConnected) return frame;
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    frame = document.createElement('iframe');
    frame.className = 'preview-frame';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', '渲染结果');
    mount.appendChild(frame);
    mount.__twlabFrame = frame;
    return frame;
  }

  /* 等帧内真正重排过一次：改完宽度只是排了队，getComputedStyle 也是懒算的，
     读一次 clientWidth 逼它算，再让出两帧。 */
  function settleLayout(frame) {
    return new Promise(function (resolve) {
      var i = 0;
      function tick() {
        try { if (frame.contentDocument) frame.contentDocument.documentElement.clientWidth; } catch (e) {}
        if (++i >= 2) return resolve();
        requestAnimationFrame(tick);
      }
      setTimeout(tick, 60);
    });
  }

  /**
   * run({ mount, html, css, js, full, tw, tests, width, widths, timeoutMs, onConsole, onTest, quietMs, maxSettleMs })
   *   tests : 断言语句数组；[[阶段1],[阶段2]] 为两阶段；空数组 = 只渲染不检验
   *   width : 固定这一帧的宽度（px），不写就跟着容器走
   *   widths: 两阶段阶段2 用的宽度，[420]
   * 返回 { ok, error, jsError, tests, logs, durationMs, stageMs, twoStage, width }
   */
  function run(opts) {
    var mount = opts.mount;
    var timeoutMs = opts.timeoutMs || 5000;
    var twoStage = isTwoStage(opts.tests);
    var stage1 = twoStage ? opts.tests[0] : (opts.tests || []);
    var stage2 = twoStage ? opts.tests[1] : [];
    var width2 = (opts.widths && opts.widths[0]) || 420;
    var runId = ++seq;
    var tw = !!(root.TWLAB_TAILWIND_SRC && opts.tw !== false);

    return new Promise(function (resolve) {
      var frame = frameFor(mount);
      frame.style.width = opts.width ? opts.width + 'px' : '100%';
      frame.style.maxWidth = '100%';

      var logs = [], settled = false, timer = null, phase2 = false;
      var started = Date.now();
      var stageMs = 0;
      var stage2Names = stage2.map(watchNameOf);
      var results = flatten(opts.tests).map(function (t, i) {
        var name = i >= stage1.length ? stage2Names[i - stage1.length] : null;
        return {
          i: i, pass: null, stage: i < stage1.length ? 1 : 2,
          label: String(t).replace(/\s+/g, ' ').trim().slice(0, 160),
          message: '', watchName: name
        };
      });

      function onMessage(ev) {
        if (!frame.contentWindow || ev.source !== frame.contentWindow) return;
        var d = ev.data || {};
        if (d.runId !== runId) return;
        if (d.type === 'console') {
          logs.push(d);
          if (opts.onConsole) opts.onConsole(d);
        } else if (d.type === 'test') {
          if (opts.onTest) opts.onTest(d);
        } else if (d.type === 'watch') {
          var r = results.filter(function (x) { return x.stage === 2 && x.watchName === d.name; })[0];
          if (r) {
            if (d.error) { r.pass = false; r.message = String(d.error); }
            else { r.pass = true; }
            if (opts.onTest) opts.onTest({ i: r.i, pass: !d.error, message: r.message });
          }
        } else if (d.type === 'done') {
          done(d);
        }
      }

      function done(d) {
        if (!phase2) {
          merge(0, d);
          if (!twoStage) return finish(null, null);
          phase2 = true;
          stageMs = Date.now() - started;
          frame.style.width = width2 + 'px';
          settleLayout(frame).then(function () {
            if (settled) return;
            /* 重设 srcdoc 拿到的新文档继承窗口当前的视口宽度，页面里的 resize 会照常触发 */
            frame.srcdoc = buildDoc({
              runId: runId,
              html: opts.html || '', css: opts.css || '', js: opts.js || '', full: !!opts.full, tw: tw,
              tests: stage2, stageBase: stage1.length,
              settleQuietMs: opts.quietMs, settleMaxMs: opts.maxSettleMs
            });
          });
          return;
        }
        merge(stage1.length, d);
        finish(null, null);
      }

      /* 帧内回传的 tests 是「本阶段」的切片，按 base 放进总结果里。
         通过的也要通知 UI，否则界面上的断言清单只会出现 ✗、通过的永远停在「·」。 */
      function merge(base, d) {
        (d.tests || []).forEach(function (t, k) {
          var r = results[base + k];
          if (!r) return;
          r.pass = t.pass === true;
          if (r.pass === false) r.message = t.message || '';
          if (opts.onTest) opts.onTest({ i: base + k, pass: r.pass, message: r.message });
        });
        if (d.jsError) jsError = d.jsError;
        if (d.error) error = d.error;
      }

      var jsError = null, error = null;

      function finish(err, _unused) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        if (err) {
          resolve({ ok: false, error: err, jsError: jsError, tests: results, logs: logs, durationMs: Date.now() - started, stageMs: stageMs, twoStage: twoStage, width: width2 });
          return;
        }
        /* 阶段2 里没回传的 watch：说清是哪条、去哪儿找，别留一句「没通过」 */
        results.forEach(function (r) {
          if (r.pass === null && r.watchName) {
            r.pass = false;
            r.message = '没有等到页面里的 __notify("' + r.watchName + '")，检查那个 resize / ResizeObserver 回调末尾有没有调用它';
          }
        });
        var failed = 0;
        results.forEach(function (r) { if (r.pass === false) failed++; });
        resolve({
          ok: !error && !jsError && results.length > 0 && failed === 0,
          error: error, jsError: jsError, tests: results, failed: failed,
          logs: logs, durationMs: Date.now() - started, stageMs: stageMs,
          twoStage: twoStage, width: twoStage ? width2 : (opts.width || 0)
        });
      }

      window.addEventListener('message', onMessage);

      timer = setTimeout(function () {
        finish({
          name: 'TimeoutError',
          message: '渲染超过 ' + Math.round(timeoutMs / 1000) + ' 秒，已强制停止。最常见的原因是脚本里有停不下来的循环，或者 setTimeout 写得太密。'
        }, null);
        // 丢掉这一帧（移除它等于终止其中的脚本），下次运行重建
        mount.__twlabFrame = null;
        while (mount.firstChild) mount.removeChild(mount.firstChild);
      }, timeoutMs);

      frame.srcdoc = buildDoc({
        runId: runId,
        html: opts.html || '',
        css: opts.css || '',
        js: opts.js || '',
        full: !!opts.full,
        tw: tw,
        tests: stage1,
        stageBase: 0,
        settleQuietMs: opts.quietMs,
        settleMaxMs: opts.maxSettleMs
      });
      /* 逼父文档排一次版：帧没尺寸时里面的元素盒子全是 0，几何断言会读到一片 0 */
      try { frame.getBoundingClientRect(); } catch (e) {}
    });
  }

  root.TWLAB_RUN = run;
  root.TWLAB_BASE_CSS = BASE_CSS;
  root.TWLAB_isTwoStage = isTwoStage;
})(window);
