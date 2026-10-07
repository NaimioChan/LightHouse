/* preview.js — 组装预览 iframe、跑一次「用户代码 + 断言」，把结果以 Promise 交回。
 *
 * 每个容器只保留一个 iframe，重跑 = 重设 srcdoc（新文档、全新全局、旧定时器随文档销毁）。
 * 超时被强杀的帧会被丢掉，下次重建。消息按 runId 过滤，避免上一轮的迟到消息结算这一轮。
 *
 * 文档拼装顺序（契约 docs/01-content-schema.md 里写死了，断言的前提取自这里）：
 *   基础样式 → 用户 CSS → 用户 HTML → job 与 send → harness → 用户 JS → 触发跑断言
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
    var tail = '<script>window.H5LAB_JOB=' + json + ';function H5LAB_SEND(m){parent.postMessage(m,"*");}<\/script>'
      + '<script>' + root.H5LAB_HARNESS_SOURCE + '<\/script>'
      + '<script>' + guard(job.js, 'script') + '<\/script>'
      + '<script>window.__h5lab_run_tests();<\/script>';

    /* full 模式：html 栏里写的是整份文档（含 doctype），不再注入基础样式与包裹结构 */
    if (job.full) {
      return guard(job.html, 'body')
        + (job.css ? '<style>' + guard(job.css, 'style') + '</style>' : '')
        + tail;
    }

    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
      + '<style>' + BASE_CSS + '</style>'
      + '<style>' + guard(job.css, 'style') + '</style>'
      + '</head><body>'
      + guard(job.html, 'body')
      + tail
      + '</body></html>';
  }

  var seq = 0;

  function frameFor(mount) {
    var frame = mount.__h5labFrame;
    if (frame && frame.parentNode === mount && frame.isConnected) return frame;
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    frame = document.createElement('iframe');
    frame.className = 'preview-frame';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', '渲染结果');
    mount.appendChild(frame);
    mount.__h5labFrame = frame;
    return frame;
  }

  /**
   * run({ mount, html, css, js, tests, timeoutMs, onConsole, onTest, quietMs, maxSettleMs })
   *   mount : 预览容器元素（iframe 塞在这里）
   *   tests : 断言语句数组；空数组 = 只渲染不检验
   * 返回 { ok, error, jsError, tests, logs, durationMs }
   */
  function run(opts) {
    var mount = opts.mount;
    var timeoutMs = opts.timeoutMs || 5000;
    var tests = opts.tests || [];
    var runId = ++seq;

    return new Promise(function (resolve) {
      var frame = frameFor(mount);
      var logs = [], settled = false, timer = null;

      function onMessage(ev) {
        if (!frame.contentWindow || ev.source !== frame.contentWindow) return;
        var d = ev.data || {};
        if (d.runId !== runId) return;
        if (d.type === 'console') {
          logs.push(d);
          if (opts.onConsole) opts.onConsole(d);
        } else if (d.type === 'test') {
          if (opts.onTest) opts.onTest(d);
        } else if (d.type === 'done') {
          finish(null, d);
        }
      }

      function finish(err, d) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        if (err) {
          resolve({ ok: false, error: err, jsError: null, tests: null, logs: logs, durationMs: 0 });
        } else {
          resolve({ ok: d.ok, error: d.error, jsError: d.jsError || null, tests: d.tests || [], logs: logs, durationMs: d.durationMs || 0 });
        }
      }

      window.addEventListener('message', onMessage);

      timer = setTimeout(function () {
        finish({
          name: 'TimeoutError',
          message: '渲染超过 ' + Math.round(timeoutMs / 1000) + ' 秒，已强制停止。最常见的原因是脚本里有停不下来的循环，或者 setTimeout 写得太密。'
        }, null);
        // 丢掉这一帧（移除它等于终止其中的脚本），下次运行重建
        mount.__h5labFrame = null;
        while (mount.firstChild) mount.removeChild(mount.firstChild);
      }, timeoutMs);

      frame.srcdoc = buildDoc({
        runId: runId,
        html: opts.html || '',
        css: opts.css || '',
        js: opts.js || '',
        full: !!opts.full,
        tests: tests,
        settleQuietMs: opts.quietMs,
        settleMaxMs: opts.maxSettleMs
      });
    });
  }

  root.H5LAB_RUN = run;
  root.H5LAB_BASE_CSS = BASE_CSS;
})(window);
