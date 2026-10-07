/* harness.js — 预览 iframe 里的内核：断言辅助、控制台截流、跑断言、回传结果。
 *
 * 全站只有这一份实现。preview.js 把 H5LAB_HARNESS_SOURCE（就是下面这个函数的源码）贴进预览 iframe，
 * 内容里的 tests / checks 是字符串，交给这里编译执行。禁止在别处再写一套 has/count/eq。
 *
 * 与 js-lab 的执行模型差别（为什么不一样）：那边整站跑的是 JS 控制台输出，用户代码和断言可以用
 * 同一个 eval 作用域；这里跑的是真实 HTML 渲染，用户 HTML 必须走浏览器解析器，用户 JS 必须是真正的
 * <script>（顶层 function 声明才会挂到 window 上，断言才取得到）。所以断言改为 new Function 编译，
 * 辅助函数作为形参注入。断言能看见什么、看不见什么，见 docs/01-content-schema.md。
 */
(function (root) {

  function H5LAB_HARNESS_FN() {
    var JOB = (typeof H5LAB_JOB !== 'undefined' && H5LAB_JOB) || {};
    var RAW_SEND = (typeof H5LAB_SEND === 'function') ? H5LAB_SEND
      : function (m) { try { parent.postMessage(m, '*'); } catch (e) {} };
    var SEND = function (m) { m.runId = JOB.runId; RAW_SEND(m); };
    var started = Date.now();
    var jsError = null;

    /* ---------- 值的格式化（控制台与断言信息共用） ---------- */
    function fmt(v, depth, inContainer) {
      depth = depth || 0;
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      var t = typeof v;
      if (t === 'string') {
        if (!inContainer) return v;
        return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
      }
      if (t === 'number') { if (v !== v) return 'NaN'; if (v === 0 && 1 / v < 0) return '-0'; return String(v); }
      if (t === 'boolean') return String(v);
      if (t === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
      if (depth > 3) return '…';
      if (v instanceof Error) return (v.name || 'Error') + ': ' + v.message;
      var i, out;
      if (Array.isArray(v)) {
        if (!v.length) return '[]';
        out = [];
        for (i = 0; i < v.length && i < 30; i++) out.push(fmt(v[i], depth + 1, true));
        if (v.length > 30) out.push('… ' + (v.length - 30) + ' more');
        return '[ ' + out.join(', ') + ' ]';
      }
      if (v.nodeType === 1 && v.tagName) return '<' + String(v.tagName).toLowerCase() + '>';
      if (v.nodeType === 9) return '#document';
      if (v.nodeType) return '#node(' + v.nodeType + ')';
      var keys = Object.keys(v);
      if (!keys.length) {
        var ctor = v.constructor && v.constructor.name;
        return (ctor && ctor !== 'Object') ? ctor + ' {}' : '{}';
      }
      out = [];
      for (i = 0; i < keys.length; i++) out.push(keys[i] + ': ' + fmt(v[keys[i]], depth + 1, true));
      return '{ ' + out.join(', ') + ' }';
    }

    /* ---------- 深比较 ---------- */
    function deepEqual(a, b, seen) {
      if (Object.is(a, b)) return true;
      if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      seen = seen || [];
      for (var s = 0; s < seen.length; s++) if (seen[s][0] === a && seen[s][1] === b) return true;
      seen.push([a, b]);
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i], seen)) return false;
        return true;
      }
      var ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (var j = 0; j < ka.length; j++) {
        if (!Object.prototype.hasOwnProperty.call(b, ka[j])) return false;
        if (!deepEqual(a[ka[j]], b[ka[j]], seen)) return false;
      }
      return true;
    }

    function withMsg(msg, core) { return (msg ? msg + ' ／ ' : '') + core; }

    /* ---------- 断言辅助（内容里的 tests / checks 用的就是这几个） ---------- */
    function $(sel, rootEl) { return (rootEl || document).querySelector(sel); }
    function $$(sel, rootEl) {
      return Array.prototype.slice.call((rootEl || document).querySelectorAll(sel));
    }
    function has(sel, msg) {
      if (!$(sel)) throw new Error(withMsg(msg, '期望页面里有 ' + sel + '，实际没找到'));
      return true;
    }
    function count(sel, n, msg) {
      var got = $$(sel).length;
      if (got !== n) throw new Error(withMsg(msg, '期望 ' + n + ' 个 ' + sel + '，实际 ' + got + ' 个'));
      return true;
    }
    function text(sel) { var e = $(sel); return e ? String(e.textContent).trim() : null; }
    function attr(sel, name) { var e = $(sel); return e ? e.getAttribute(name) : null; }
    function tag(sel) { var e = $(sel); return e ? String(e.tagName).toLowerCase() : null; }
    function style(sel, prop) {
      var e = $(sel);
      if (!e) return null;
      var p = String(prop).replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); });
      return getComputedStyle(e).getPropertyValue(p).trim();
    }
    function eq(actual, expected, msg) {
      if (deepEqual(actual, expected)) return true;
      throw new Error(withMsg(msg, '期望 ' + fmt(expected, 0, false) + '，实际 ' + fmt(actual, 0, false)));
    }
    function ok(cond, msg) {
      if (cond) return true;
      throw new Error(msg || '条件为假（这里期望它为真）');
    }
    function fn(name, msg) {
      var f = window[name];
      if (typeof f !== 'function') {
        var why = (f === undefined) ? '没有这个全局' : '它是个 ' + (typeof f);
        throw new Error(withMsg(msg, '期望页面里有全局函数 ' + name + '()（顶层写成 function ' + name + '(…){}），实际 ' + why));
      }
      return f;
    }

    /* ---------- 控制台截流（logs 就是这些输出） ---------- */
    var logs = [];
    function joinArgs(args) {
      var out = [];
      for (var i = 0; i < args.length; i++) out.push(fmt(args[i], 0, false));
      return out.join(' ');
    }
    function pushLog(level, t) {
      logs.push(t);
      SEND({ type: 'console', level: level, text: t });
    }
    if (typeof console !== 'undefined' && console) {
      var levels = ['log', 'info', 'warn', 'error'];
      for (var li = 0; li < levels.length; li++) {
        (function (level) {
          console[level] = function () { pushLog(level, joinArgs(arguments)); };
        })(levels[li]);
      }
    }

    /* ---------- 用户 JS 的报错：<script> 里的报错走 window.onerror ---------- */
    function noteJsError(text) {
      if (!jsError) jsError = { name: 'JavaScriptError', message: text };
      pushLog('error', text);
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('error', function (ev) {
        if (ev && ev.target && ev.target !== window && ev.target.tagName) return;   // 资源加载失败不管
        var e = ev && ev.error;
        noteJsError('脚本出错：' + ((e && e.message) || (ev && ev.message) || '未知错误'));
      });
      window.addEventListener('unhandledrejection', function (ev) {
        noteJsError('未处理的 Promise 拒绝：' + fmt(ev && ev.reason));
      });
    }

    /* ---------- 计时器记账：等异步尾巴跑完再收工 ---------- */
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
        if (k >= 0) {
          liveTimers.splice(k, 1);
          if (realClearTimeout) realClearTimeout(id);
        }
      };
    }

    function settle(quietMs, maxMs) {
      if (!realSetTimeout) return Promise.resolve();
      return new Promise(function (resolve) {
        var t0 = Date.now();
        var lastBusy = Date.now();
        (function tick() {
          if (liveTimers.length > 0) lastBusy = Date.now();
          var idle = Date.now() - lastBusy;
          if (liveTimers.length === 0 && idle >= quietMs) return resolve();
          if (Date.now() - t0 >= maxMs) return resolve();
          realSetTimeout(tick, 5);
        })();
      });
    }

    /* ---------- 断言编译与执行 ---------- */
    var KEYS = ['$', '$$', 'has', 'count', 'text', 'attr', 'tag', 'style', 'eq', 'ok', 'fn', 'logs'];
    function helperValues() { return [$, $$, has, count, text, attr, tag, style, eq, ok, fn, logs]; }

    function compileTest(src) {
      // eslint-disable-next-line no-new-func
      var f = new Function(KEYS.join(', '), 'return (async function () {\n' + src + '\n}).call(this);');
      return function () { return f.apply(null, helperValues()); };
    }

    var tests = JOB.tests || [];
    var results = tests.map(function (t, i) {
      return { i: i, pass: null, label: String(t).replace(/\s+/g, ' ').trim().slice(0, 160), message: '' };
    });

    function recordTest(i, err) {
      if (!results[i]) return;
      if (err) { results[i].pass = false; results[i].message = String((err && err.message) || err); }
      else { results[i].pass = true; }
      SEND({ type: 'test', i: i, pass: !err, message: results[i].message });
    }

    function finish(error) {
      var failed = 0;
      for (var i = 0; i < results.length; i++) if (results[i].pass === false) failed++;
      SEND({
        type: 'done',
        ok: !error && !jsError && failed === 0,
        error: error ? { name: (error.name || 'Error'), message: String((error && error.message) || error) } : null,
        jsError: jsError,
        tests: results,
        failed: failed,
        passed: results.length - failed,
        durationMs: Date.now() - started
      });
    }

    async function runAll() {
      try {
        for (var i = 0; i < tests.length; i++) {
          try {
            var p = compileTest(tests[i])();
            if (p && typeof p.then === 'function') await p;
            recordTest(i, null);
          } catch (e) {
            recordTest(i, e);
          }
        }
        await settle(JOB.settleQuietMs || 40, JOB.settleMaxMs || 1500);
        finish(null);
      } catch (e) {
        finish(e);
      }
    }

    window.__h5lab_run_tests = function () {
      runAll();
    };
  }

  root.H5LAB_HARNESS_FN = H5LAB_HARNESS_FN;
  root.H5LAB_HARNESS_SOURCE = '(' + H5LAB_HARNESS_FN.toString() + '\n)();';

})(typeof window !== 'undefined' ? window : globalThis);
