/* sandbox.js — 把用户 React 源码丢进沙箱 iframe 执行，回传断言结果与 DOM 快照。
 *
 * 只有浏览器需要这个文件。沙箱 iframe 是 sandbox="allow-scripts"（没有 allow-same-origin）
 * → opaque origin，用户代码在里面拿不到父页面的任何东西，localStorage 会抛 SecurityError。
 * 父页面也读不到它的 DOM，只能 postMessage 收结果。
 *
 * 三个细节（与 vue-lab 同源）：
 *  1. iframe 必须真的插进文档（离屏容器里），否则某些浏览器下文档不加载、等到超时。
 *  2. 全站共用一个 iframe，重跑只是重设 srcdoc（新文档新全局）。
 *  3. 所有运行串行排队：并发重设 srcdoc 只会留下最后一次。
 *
 * vendor 的 React 产物在首屏之后懒加载（约 220 KB），读出文本，postMessage 送进沙箱里 eval。
 */
(function (root) {
  'use strict';

  var HOST_ID = 'rllab-sandbox-host';
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
    f.setAttribute('title', 'React 运行沙箱（不可见）');
    h.appendChild(f);
    return f;
  }

  function guard(src) {
    return String(src == null ? '' : src).replace(/<\/script/gi, '<\\/script');
  }

  /* 产物源码字符串由 vendor/react19-src.js 提供（classic script）。
     fetch 只作为「万一全局没挂上」时的兜底（http 下可用）。 */
  var SRC_GLOBAL = 'RLLAB_REACT_SRC';
  var SRC_FILE = 'vendor/react19.iife.min.js';

  function readSrc() {
    var g = root[SRC_GLOBAL];
    if (typeof g === 'string' && g.length > 1000) return Promise.resolve(g);
    return fetch(SRC_FILE).then(function (r) {
      if (!r.ok) throw new Error(SRC_FILE + ' ' + r.status);
      return r.text();
    }).catch(function () {
      throw new Error('读不到 ' + SRC_FILE + '：vendor/react19-src.js 没有在 index.html 里引入（http 与 file:// 两条路都失败）');
    });
  }

  function loadLib() {
    if (libText) return Promise.resolve(libText);
    return readSrc().then(function (react) { libText = { react: react }; return libText; });
  }

  function jsonForScript(obj) {
    return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }

  function buildDoc(job) {
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><\/head><body>'
      + '<script>' + root.RLLAB_FMT_SOURCE + '<\/script>'
      + '<script>' + job.react + '<\/script>'
      + '<script>window.RLLAB_JOB=' + jsonForScript(job) + ';<\/script>'
      + '<script>' + root.RLLAB_COMPILE_SOURCE + '<\/script>'
      + '<script>' + root.RLLAB_HARNESS_SOURCE + '<\/script>'
      + '<script>window.RLLAB_START();<\/script>'
      + '<\/body><\/html>';
  }

  function buildPreviewDoc(job) {
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
      + '<style>html,body{margin:0}body{font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif;color:#232019;padding:10px 12px}'
      + 'button{font:inherit;padding:2px 10px;cursor:pointer}input,select{font:inherit;padding:2px 6px}'
      + 'p{margin:0 0 8px}ul,ol{margin:0 0 8px;padding-left:20px}</style>'
      + '<\/head><body>'
      + '<script>' + job.react + '<\/script>'
      + '<script>window.RLLAB_PREVIEW=' + jsonForScript(job) + ';<\/script>'
      + '<script>' + root.RLLAB_PREVIEW_SOURCE + '<\/script>'
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
          react: vendor.react,
          compileSource: root.RLLAB_COMPILE_SOURCE
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
            fatal: '运行超过 ' + Math.round(timeoutMs / 1000) + ' 秒还没结束，已强制停止。'
              + '常见原因：组件里有停不下来的循环，或渲染里改了会再次触发渲染的状态。',
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

  /** runPreview(src, frame)：把组件渲染进指定的可见 iframe。 */
  function runPreview(src, frame) {
    return loadLib().then(function (vendor) {
      var doc = buildPreviewDoc({ src: src, react: vendor.react, compileSource: root.RLLAB_COMPILE_SOURCE });
      frame.setAttribute('srcdoc', doc);
      return true;
    });
  }

  /** runDemo(src, tests, frame)：一次拿到改写产物、断言结果，并把源码渲进预览 frame。 */
  function runDemo(src, tests, frame) {
    var both = [run({ src: src, tests: tests || [] })];
    if (frame) both.push(runPreview(src, frame));
    return Promise.all(both).then(function (r) {
      var res = r[0];
      res.previewed = !!frame;
      return res;
    });
  }

  root.RLLAB_SANDBOX = {
    run: run,
    runPreview: runPreview,
    runDemo: runDemo,
    preload: loadLib,
    isLibReady: function () { return !!libText; },
    reset: function () { if (frame && frame.parentNode) frame.parentNode.removeChild(frame); frame = null; }
  };
})(window);
