/* harness.js — 沙箱 iframe 里的内核：截流控制台、跑编译产物、把结果回传。
 *
 * 这里跑的是 **TypeScript 编译出来的 JS**，不是用户手写的 TS；类型判题在父页面（judge.js）。
 * 全站只有这一份运行内核：sandbox.js 把 TSLAB_HARNESS_SOURCE 贴进 iframe 的 srcdoc。
 * 值的格式化用注入进来的 TSLAB_fmt（来自 format.js），保证与 node 侧逐字一致。
 */
(function (root) {
  'use strict';

  function TSLAB_HARNESS_FN() {
    var JOB = (typeof TSLAB_JOB !== 'undefined' && TSLAB_JOB) || {};
    var SEND = (typeof TSLAB_SEND === 'function') ? TSLAB_SEND : function (m) { try { parent.postMessage(m, '*'); } catch (e) {} };
    var started = Date.now();
    var jsError = null;

    function fmt(v, d, c) { return TSLAB_fmt(v, d, c); }

    var logs = [];
    function pushLog(level, text) {
      logs.push(text);
      SEND({ type: 'console', runId: JOB.runId, level: level, text: text });
    }
    if (typeof console !== 'undefined' && console) {
      var levels = ['log', 'info', 'warn', 'error'];
      for (var li = 0; li < levels.length; li++) {
        (function (level) {
          console[level] = function () { pushLog(level, TSLAB_fmtArgs(arguments)); };
        })(levels[li]);
      }
    }

    function noteJsError(text) {
      if (!jsError) jsError = { name: 'JavaScriptError', message: text };
      pushLog('error', text);
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('error', function (ev) {
        var e = ev && ev.error;
        noteJsError('脚本出错：' + ((e && e.message) || (ev && ev.message) || '未知错误'));
      });
      window.addEventListener('unhandledrejection', function (ev) {
        noteJsError('未处理的 Promise 拒绝：' + fmt(ev && ev.reason));
      });
    }

    /* 异步尾巴：setTimeout 记账，安静 30ms 收工、最长 1.5 秒 */
    var realSetTimeout = (typeof setTimeout === 'function') ? setTimeout : null;
    var realClearTimeout = (typeof clearTimeout === 'function') ? clearTimeout : null;
    var liveTimers = [];
    if (realSetTimeout) {
      setTimeout = function (fn, ms) {
        var args = Array.prototype.slice.call(arguments, 2);
        var id = realSetTimeout(function () {
          var k = liveTimers.indexOf(id);
          if (k >= 0) liveTimers.splice(k, 1);
          if (typeof fn === 'function') fn.apply(null, args);
        }, ms);
        liveTimers.push(id);
        return id;
      };
      clearTimeout = function (id) {
        var k = liveTimers.indexOf(id);
        if (k >= 0) { liveTimers.splice(k, 1); if (realClearTimeout) realClearTimeout(id); }
      };
    }

    function settle(quietMs, maxMs) {
      if (!realSetTimeout) return Promise.resolve();
      return new Promise(function (resolve) {
        var t0 = Date.now(), lastBusy = Date.now();
        (function tick() {
          if (liveTimers.length > 0) lastBusy = Date.now();
          if (liveTimers.length === 0 && Date.now() - lastBusy >= quietMs) return resolve();
          if (Date.now() - t0 >= maxMs) return resolve();
          realSetTimeout(tick, 5);
        })();
      });
    }

    function finish() {
      SEND({
        type: 'done', runId: JOB.runId, ok: !jsError, jsError: jsError,
        logs: logs, durationMs: Date.now() - started
      });
    }

    /* 等用户脚本先执行完再开始记账：调用点是文档末尾的 TSLAB_START()（见 sandbox.js） */
    window.TSLAB_START = function () {
      settle(JOB.quietMs || 30, JOB.maxSettleMs || 1500).then(finish, finish);
    };
  }

  root.TSLAB_HARNESS_FN = TSLAB_HARNESS_FN;
  root.TSLAB_HARNESS_SOURCE = '(' + TSLAB_HARNESS_FN.toString() + '\n)();';
})(typeof window !== 'undefined' ? window : globalThis);
