/* sandbox.js — 把用户 SFC 丢进沙箱 iframe 编译加运行，回传断言结果与 DOM 快照。
 *
 * 只有浏览器需要这个文件。沙箱 iframe 是 sandbox="allow-scripts"（没有 allow-same-origin）
 * → opaque origin，用户代码在里面拿不到父页面的任何东西，localStorage 会抛 SecurityError。
 * 父页面也读不到它的 DOM，只能 postMessage 收结果。
 *
 * 三个细节（与 ts-lab 同源）：
 *  1. iframe 必须真的插进文档（离屏容器里），否则某些浏览器下文档不加载、等到超时。
 *  2. 全站共用一个 iframe，重跑只是重设 srcdoc（新文档新全局，比新建省一个渲染进程）；
 *     消息按 runId 过滤，上一轮的迟到消息不会结算这一轮。
 *  3. 所有运行串行排队：并发重设 srcdoc 只会留下最后一次，输出就串了。
 *
 * vendor 的两个产物在首屏之后懒加载（约 950 KB），读出文本，postMessage 送进沙箱里 eval。
 */
(function (root) {
  'use strict';

  var HOST_ID = 'vuelab-sandbox-host';
  var frame = null;
  var queue = Promise.resolve();
  var seq = 0;
  var libText = null;

  function hostEl() {
    var h = document.getElementById(HOST_ID);
    if (h && h.isConnected) return h;
    h = document.createElement('div');
    h.id = HOST_ID;
    h.setAttribute('aria-hidden', 'true');
    document.body.appendChild(h);
    return h;
  }

  function freshFrame() {
    var h = hostEl();
    while (h.firstChild) h.removeChild(h.firstChild);
    var f = document.createElement('iframe');
    f.className = 'sandbox-frame';
    f.setAttribute('sandbox', 'allow-scripts');
    f.setAttribute('title', 'Vue 运行沙箱（不可见）');
    h.appendChild(f);
    return f;
  }

  /* 用户 SFC 里的 </script 会提前闭合脚本元素，代码被截断 */
  function guard(src) {
    return String(src == null ? '' : src).replace(/<\/script/gi, '<\\/script');
  }

  /* 两个产物的源码字符串由 vendor/vue-global-src.js 与 vendor/vue-sfc-src.js 提供（classic script），
     这两条路（http 与 file://）都能加载。fetch 只作为「万一全局没挂上」时的兜底。 */
  var SRC_GLOBALS = { vue: 'VUELAB_VUE_SRC', sfc: 'VUELAB_SFC_SRC' };
  var SRC_FILES = { vue: 'vendor/vue.global.prod.js', sfc: 'vendor/vue-sfc-compiler.js' };

  function readSrc(which) {
    var g = root[SRC_GLOBALS[which]];
    if (typeof g === 'string' && g.length > 1000) return Promise.resolve(g);
    return fetch(SRC_FILES[which]).then(function (r) {
      if (!r.ok) throw new Error(SRC_FILES[which] + ' ' + r.status);
      return r.text();
    }).catch(function () {
      throw new Error('读不到 ' + SRC_FILES[which] + '：vendor/' + SRC_GLOBALS[which] + ' 对应的'
        + ' -src.js 没有在 index.html 里引入（http 与 file:// 两条路都失败）');
    });
  }

  function loadLib() {
    if (libText) return Promise.resolve(libText);
    return Promise.all([readSrc('vue'), readSrc('sfc')]).then(function (pair) {
      libText = { vue: pair[0], sfc: pair[1] };
      return libText;
    });
  }

  /* 用户 SFC 里的 </script 会提前闭合脚本元素；JSON 里再兜一层 */
  function jsonForScript(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }

  function buildDoc(job) {
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><\/head><body>'
      + '<script>' + root.VUELAB_FMT_SOURCE + '<\/script>'
      + '<script>window.VUELAB_JOB=' + jsonForScript(job) + ';<\/script>'
      + '<script>' + root.VUELAB_COMPILE_SOURCE + '<\/script>'
      + '<script>' + root.VUELAB_HARNESS_SOURCE + '<\/script>'
      + '<script>window.VUELAB_START();<\/script>'
      + '<\/body><\/html>';
  }

  /* 预览用的文档：同一套编译内核，但不跑断言、也不回传结果；
     只把组件挂到页面上，再带一点最低限度的阅读排版（预览里要有 body 边距与基本字号，
     否则用户写出来的 <p> 会顶到框边上，看起来像站点的样式坏了）。 */
  function buildPreviewDoc(job) {
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
      + '<style>html,body{margin:0}body{font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif;color:#232019;padding:10px 12px}'
      + 'button{font:inherit;padding:2px 10px;cursor:pointer}input,select{font:inherit;padding:2px 6px}'
      + 'p{margin:0 0 8px}ul,ol{margin:0 0 8px;padding-left:20px}</style>'
      + '<\/head><body>'
      + '<script>' + root.VUELAB_COMPILE_SOURCE + '<\/script>'
      + '<script>window.VUELAB_PREVIEW=' + jsonForScript(job) + ';<\/script>'
      + '<script>' + root.VUELAB_PREVIEW_SOURCE + '<\/script>'
      + '<\/body><\/html>';
  }

  function execOne(payload, opts) {
    opts = opts || {};
    var runId = ++seq;
    var timeoutMs = opts.timeoutMs || 6000;
    return new Promise(function (resolve, reject) {
      loadLib().then(function (vendor) {
        var job = {
          runId: runId,
          src: payload.src,
          tests: payload.tests || [],
          cases: payload.cases || null,
          scopeSeed: payload.scopeSeed || 'lab' + String(runId).padStart(5, '0'),
          vue: vendor.vue,
          sfc: vendor.sfc,
          compileSource: root.VUELAB_COMPILE_SOURCE
        };
        if (!frame || !frame.isConnected) frame = freshFrame();
        var f = frame;
        var settled = false;
        var timer = null;
        var cases = {};

        function onMessage(ev) {
          if (!f.contentWindow || ev.source !== f.contentWindow) return;
          var data = ev.data || {};
          if (data.runId !== runId) return;
          if (data.type === 'console') {
            if (opts.onConsole) opts.onConsole(data);
          } else if (data.type === 'case') {
            cases[data.caseId] = data;
          } else if (data.type === 'done') {
            finish({
              tests: data.tests || [],
              cases: cases,
              snapshot: data.snapshot || '',
              compiled: data.compiled || '',
              runtimeErrors: data.runtimeErrors || [],
              fatal: data.fatal || null,
              durationMs: data.durationMs
            });
          }
        }

        function finish(res) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          window.removeEventListener('message', onMessage);
          resolve(res);
        }

        window.addEventListener('message', onMessage);

        timer = setTimeout(function () {
          finish({
            tests: [],
            cases: cases,
            fatal: '编译或运行超过 ' + Math.round(timeoutMs / 1000) + ' 秒还没结束，已强制停止。'
              + '常见原因：组件里有停不下来的循环，或 watch 里互相触发。',
            durationMs: timeoutMs
          });
          if (f.parentNode) f.parentNode.removeChild(f);
          frame = null;
        }, timeoutMs);

        f.srcdoc = buildDoc(job);
      }, reject);
    });
  }

  /** run({src, tests, cases, timeoutMs}) -> Promise<{ tests, cases, snapshot, fatal, durationMs }>，串行排队 */
  function run(payload, opts) {
    var next = function () { return execOne(payload, opts); };
    var p = queue.then(next, next);
    queue = p.then(function () { return null; }, function () { return null; });
    return p;
  }

  /** runPreview(src, frame) -> Promise：把 SFC 渲染进指定的可见 iframe。
   *  与判题不同的只有一点：它挂在用户看得见的那个 iframe 上（判题用离屏的那个）。
   *  预览是「真实在跑的组件」，不是截图。 */
  function runPreview(src, frame) {
    return loadLib().then(function (vendor) {
      var doc = buildPreviewDoc({
        src: src,
        scopeSeed: frame.getAttribute('data-seed') || 'pv' + String(++seq).padStart(6, '0'),
        vue: vendor.vue,
        sfc: vendor.sfc,
        compileSource: root.VUELAB_COMPILE_SOURCE
      });
      frame.setAttribute('srcdoc', doc);
      return true;
    });
  }

  /** runDemo(src, frame) -> Promise：示例用。一次拿到编译产物、断言结果、以及把源码渲进预览 frame。 */
  function runDemo(src, tests, frame) {
    var both = [run({ src: src, tests: tests || [], scopeSeed: 'demo' + String(seq + 1).padStart(5, '0') })];
    if (frame) both.push(runPreview(src, frame));
    return Promise.all(both).then(function (r) {
      var res = r[0];
      res.previewed = !!frame;
      return res;
    });
  }

  root.VUELAB_SANDBOX = {
    run: run,
    runPreview: runPreview,
    runDemo: runDemo,
    preload: loadLib,
    isLibReady: function () { return !!libText; },
    reset: function () { if (frame && frame.parentNode) frame.parentNode.removeChild(frame); frame = null; }
  };
})(window);
