/* runner.js — 把一次运行送进 sandbox iframe，并把结果以 Promise 交回。
 *
 * 每个容器只保留一个 iframe，重复运行 = 重设 srcdoc（新文档、全新全局，旧定时器随文档销毁）。
 * 既省进程开销，又保证每次运行互不污染。超时被强杀的帧会被丢掉，下次重建。
 * 消息按 runId 过滤，避免上一轮的迟到消息结算这一轮。
 */
(function (root) {

  var PREVIEW_CSS = [
    'html{background:#fff}',
    'body{margin:0;padding:10px;font:13px/1.6 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;color:#232019}',
    '#app{margin:0}',
    'body>*:first-child{margin-top:0}'
  ].join('');

  function buildDoc(job) {
    var json = JSON.stringify(job).replace(/</g, '\\u003c');
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>' + PREVIEW_CSS + '</style></head>'
      + '<body><div id="app"></div>'
      + '<script>window.JSLAB_JOB=' + json + ';function JSLAB_SEND(m){parent.postMessage(m,"*");}<\/script>'
      + '<script>' + root.JSLAB_HARNESS_SOURCE + '<\/script>'
      + '</body></html>';
  }

  var seq = 0;

  function frameFor(mount) {
    var frame = mount.__jslabFrame;
    if (frame && frame.parentNode === mount && frame.isConnected) return frame;
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    frame = document.createElement('iframe');
    frame.className = 'preview-frame';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', '运行结果');
    mount.appendChild(frame);
    mount.__jslabFrame = frame;
    return frame;
  }

  /**
   * run({ mount, code, tests, timeoutMs, onConsole, onTest, quietMs, maxSettleMs })
   *   mount : 预览容器元素（iframe 塞在这里）
   *   tests : 断言语句数组，空数组 = 只预览不检验
   * 返回 { ok, error, tests, logs, durationMs }
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
          resolve({ ok: false, error: err, tests: null, logs: logs, durationMs: 0 });
        } else {
          resolve({ ok: d.ok, error: d.error, tests: d.tests || [], logs: logs, durationMs: d.durationMs || 0 });
        }
      }

      window.addEventListener('message', onMessage);

      timer = setTimeout(function () {
        finish({
          name: 'TimeoutError',
          message: '运行超过 ' + Math.round(timeoutMs / 1000) + ' 秒，已强制停止。最常见的原因是循环的终止条件写错了（比如 while (true) 没有 break）。'
        }, null);
        // 丢掉这一帧（移除它等于终止其中的脚本），下次运行重建
        mount.__jslabFrame = null;
        while (mount.firstChild) mount.removeChild(mount.firstChild);
      }, timeoutMs);

      frame.srcdoc = buildDoc({
        runId: runId,
        code: opts.code || '',
        tests: tests,
        settleQuietMs: opts.quietMs,
        settleMaxMs: opts.maxSettleMs
      });
    });
  }

  root.JSLAB_RUN = run;
})(window);
