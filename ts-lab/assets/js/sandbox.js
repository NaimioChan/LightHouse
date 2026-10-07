/* sandbox.js — 把编译产物丢进沙箱 iframe 跑，回传控制台输出。只有浏览器需要这个文件。
 *
 * 沙箱 iframe 是 sandbox="allow-scripts"（没有 allow-same-origin）→ opaque origin，
 * 用户代码在里面拿不到父页面的任何东西，localStorage 会抛 SecurityError。
 * 父页面也读不到它的 DOM，只能 postMessage 收结果。
 *
 * 三个细节：
 *  1. iframe 必须真的插进文档（离屏容器里），否则某些浏览器下文档不加载、等到超时。
 *  2. 全站共用一个 iframe，重跑只是重设 srcdoc（新文档新全局，比新建省一个渲染进程）；
 *     消息按 runId 过滤，上一轮的迟到消息不会结算这一轮。
 *  3. 所有运行串行排队：并发重设 srcdoc 只会留下最后一次，输出就串了。
 */
(function (root) {
  'use strict';

  var HOST_ID = 'tslab-sandbox-host';
  var frame = null;
  var queue = Promise.resolve();
  var seq = 0;

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
    f.setAttribute('title', '代码运行沙箱（不可见）');
    h.appendChild(f);
    return f;
  }

  /* 用户代码里的 </script 会提前闭合脚本元素，代码被截断 */
  function guard(src) {
    return String(src == null ? '' : src).replace(/<\/script/gi, '<\\/script');
  }

  function buildDoc(job, js) {
    var json = JSON.stringify(job).replace(/</g, '\\u003c');
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><\/head><body>'
      + '<script>' + root.TSLAB_FMT_SOURCE + '<\/script>'
      + '<script>window.TSLAB_JOB=' + json + ';function TSLAB_SEND(m){parent.postMessage(m,"*");}<\/script>'
      + '<script>' + root.TSLAB_HARNESS_SOURCE + '<\/script>'
      + '<script>' + guard(js) + '<\/script>'
      + '<script>window.TSLAB_START();<\/script>'
      + '<\/body><\/html>';
  }

  function execOne(js, timeoutMs) {
    var runId = ++seq;
    var job = { runId: runId, quietMs: 30, maxSettleMs: 1500 };
    return new Promise(function (resolve) {
      if (!frame || !frame.isConnected) frame = freshFrame();
      var f = frame;
      var logs = [], settled = false, timer = null;

      function onMessage(ev) {
        if (!f.contentWindow || ev.source !== f.contentWindow) return;
        var data = ev.data || {};
        if (data.runId !== runId) return;
        if (data.type === 'console') {
          logs.push(data.text);
          if (job.onConsole) job.onConsole(data);
        } else if (data.type === 'done') {
          finish({ logs: logs, error: data.jsError || null, durationMs: data.durationMs });
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
        /* 摘掉这一帧 = 终止里面停不下来的循环；下次运行重建 */
        finish({
          logs: logs,
          error: {
            name: 'TimeoutError',
            message: '代码跑了超过 ' + Math.round(timeoutMs / 1000) + ' 秒还没结束，已强制停止。最常见的原因是循环没有终止条件。'
          }
        });
        if (f.parentNode) f.parentNode.removeChild(f);
        frame = null;
      }, timeoutMs);

      f.srcdoc = buildDoc(job, js);
    });
  }

  /** run(jsText, timeoutMs) -> Promise<{ logs, error }>，串行排队 */
  function run(jsText, timeoutMs) {
    var t = timeoutMs || 5000;
    var next = function () { return execOne(jsText, t); };
    var p = queue.then(next, next);
    queue = p.then(function () { return null; }, function () { return null; });
    return p;
  }

  root.TSLAB_SANDBOX = {
    run: run,
    isBusy: function () { return false; },
    reset: function () { if (frame && frame.parentNode) frame.parentNode.removeChild(frame); frame = null; }
  };
})(window);
