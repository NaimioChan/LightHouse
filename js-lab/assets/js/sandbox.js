/* sandbox.js — 沙箱内核。
 *
 * 唯一的执行入口。用户代码 + 断言被拼成一个 async 函数体，在同一个作用域里执行，
 * 所以用户的 const/let/function 对断言可见，断言里可以 await。
 *
 * 浏览器：runner.js 把下面这个函数的源码（toString）贴进 sandbox iframe 的 srcdoc 里执行。
 * node  ：tools/verify-content.mjs 用同一个字符串丢进 vm 执行，保证两边断言语义完全一致。
 * 禁止在别处再写一套 eq/ok/throws。
 */
(function (root) {

  function JSLAB_HARNESS_FN() {
    var JOB = (typeof JSLAB_JOB !== 'undefined' && JSLAB_JOB) || {};
    var RAW_SEND = (typeof JSLAB_SEND === 'function') ? JSLAB_SEND
      : function (m) { try { parent.postMessage(m, '*'); } catch (e) {} };
    var SEND = function (m) { m.runId = JOB.runId; RAW_SEND(m); };
    var HAS_DOM = (typeof document !== 'undefined') && !!document && !!document.body;
    var started = Date.now();

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
      if (t === 'bigint') return String(v) + 'n';
      if (t === 'symbol') return String(v);
      if (t === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
      if (depth > 3) return '…';
      if (v instanceof Date) return v.toISOString();
      if (v instanceof Error) return (v.name || 'Error') + ': ' + v.message;
      if (v instanceof RegExp) return String(v);
      var i, out;
      if (Array.isArray(v)) {
        if (!v.length) return '[]';
        out = [];
        for (i = 0; i < v.length && i < 50; i++) out.push(fmt(v[i], depth + 1, true));
        if (v.length > 50) out.push('… ' + (v.length - 50) + ' more');
        return '[ ' + out.join(', ') + ' ]';
      }
      if (v instanceof Set) {
        out = [];
        v.forEach(function (x) { out.push(fmt(x, depth + 1, true)); });
        return 'Set(' + v.size + ') { ' + out.join(', ') + ' }';
      }
      if (v instanceof Map) {
        out = [];
        v.forEach(function (val, key) { out.push(fmt(key, depth + 1, true) + ' => ' + fmt(val, depth + 1, true)); });
        return 'Map(' + v.size + ') { ' + out.join(', ') + ' }';
      }
      if (v.nodeType === 1 && v.tagName) return '<' + v.tagName.toLowerCase() + '>';
      var keys = Object.keys(v);
      if (!keys.length) {
        var ctor = v.constructor && v.constructor.name;
        return (ctor && ctor !== 'Object') ? ctor + ' {}' : '{}';
      }
      out = [];
      for (i = 0; i < keys.length; i++) {
        out.push(keys[i] + ': ' + fmt(v[keys[i]], depth + 1, true));
      }
      return '{ ' + out.join(', ') + ' }';
    }

    /* ---------- 深比较 ---------- */
    function deepEqual(a, b, seen) {
      if (Object.is(a, b)) return true;
      if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
      if (a instanceof Date || b instanceof Date) return (a instanceof Date && b instanceof Date) && a.getTime() === b.getTime();
      if (a instanceof RegExp || b instanceof RegExp) return String(a) === String(b);
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      seen = seen || [];
      for (var s = 0; s < seen.length; s++) if (seen[s][0] === a && seen[s][1] === b) return true;
      seen.push([a, b]);
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i], seen)) return false;
        return true;
      }
      if (a instanceof Set || b instanceof Set) {
        if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
        var aa = [], bb = [];
        a.forEach(function (x) { aa.push(x); });
        b.forEach(function (x) { bb.push(x); });
        return deepEqual(aa, bb, seen);
      }
      if (a instanceof Map || b instanceof Map) {
        if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
        var okMap = true;
        a.forEach(function (val, key) { if (!deepEqual(val, b.get(key), seen)) okMap = false; });
        return okMap;
      }
      var ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (var j = 0; j < ka.length; j++) {
        if (!Object.prototype.hasOwnProperty.call(b, ka[j])) return false;
        if (!deepEqual(a[ka[j]], b[ka[j]], seen)) return false;
      }
      return true;
    }

    /* ---------- 断言辅助（内容里的 tests 用的就是这几个） ---------- */
    function eq(actual, expected, msg) {
      if (deepEqual(actual, expected)) return true;
      throw new Error((msg ? msg + ' ／ ' : '') + '期望 ' + fmt(expected, 0, false) + '，实际 ' + fmt(actual, 0, false));
    }
    function ok(cond, msg) {
      if (cond) return true;
      throw new Error(msg || '断言失败：条件为假');
    }
    function throws(fn, msg) {
      var threw = false, err = null;
      try { fn(); } catch (e) { threw = true; err = e; }
      if (!threw) throw new Error((msg ? msg + ' ／ ' : '') + '期望抛错，实际正常返回');
      return err;
    }
    function near(actual, expected, eps, msg) {
      if (typeof eps === 'string' || eps === undefined) { msg = eps; eps = 1e-9; }
      if (typeof actual === 'number' && typeof expected === 'number' && Math.abs(actual - expected) <= eps) return true;
      throw new Error((msg ? msg + ' ／ ' : '') + '期望约等于 ' + fmt(expected, 0, false) + '（误差 ' + eps + '），实际 ' + fmt(actual, 0, false));
    }

    /* ---------- 计时器记账：等异步尾巴跑完再收工 ---------- */
    var realSetTimeout = (typeof setTimeout === 'function') ? setTimeout : null;
    var realClearTimeout = (typeof clearTimeout === 'function') ? clearTimeout : null;
    var realSetInterval = (typeof setInterval === 'function') ? setInterval : null;
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
      setInterval = function (fn, ms) {
        var args = Array.prototype.slice.call(arguments, 2);
        return realSetInterval(function () { if (typeof fn === 'function') fn.apply(null, args); }, ms);
      };
    }

    /* 让异步尾巴（定时器回调、微任务）有机会跑完，再回传结果 */
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

    /* ---------- 控制台截流 ---------- */
    var logs = [];
    function joinArgs(args) {
      var out = [];
      for (var i = 0; i < args.length; i++) out.push(fmt(args[i], 0, false));
      return out.join(' ');
    }
    if (typeof console !== 'undefined' && console) {
      var levels = ['log', 'info', 'warn', 'error'];
      for (var li = 0; li < levels.length; li++) {
        (function (level) {
          console[level] = function () {
            var text = joinArgs(arguments);
            logs.push(text);
            SEND({ type: 'console', level: level, text: text });
          };
        })(levels[li]);
      }
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('error', function (ev) {
        SEND({ type: 'console', level: 'error', text: '未捕获错误：' + ((ev.error && ev.error.message) || ev.message) });
      });
      window.addEventListener('unhandledrejection', function (ev) {
        SEND({ type: 'console', level: 'error', text: '未处理的 Promise 拒绝：' + fmt(ev.reason) });
      });
    }

    /* ---------- DOM 辅助 ---------- */
    var app = null, $ = null, $$ = null;
    if (HAS_DOM) {
      app = document.getElementById('app');
      $ = function (sel, rootEl) { return (rootEl || document).querySelector(sel); };
      $$ = function (sel, rootEl) {
        return Array.prototype.slice.call((rootEl || document).querySelectorAll(sel));
      };
    }

    /* ---------- 编译用户代码 + 断言 ---------- */
    var tests = JOB.tests || [];
    var results = tests.map(function (t) { return { i: 0, pass: null, label: String(t).replace(/\s+/g, ' ').trim().slice(0, 120), message: '' }; });
    for (var ri = 0; ri < results.length; ri++) results[ri].i = ri;

    // 名字带双下划线，避免和用户代码/断言里的变量撞名
    function __recordTest(i, err) {
      if (!results[i]) return;
      if (err) { results[i].pass = false; results[i].message = String((err && err.message) || err); }
      else { results[i].pass = true; }
      SEND({ type: 'test', i: i, pass: !err, message: results[i].message });
    }

    function buildSource() {
      var src = '(async function () {\n' + (JOB.code || '') + '\n;await (async function () {\n';
      for (var i = 0; i < tests.length; i++) {
        src += 'try { await (async function () { ' + tests[i] + '\n }).call(this); __recordTest(' + i + ', null); }\n'
             + 'catch (e) { __recordTest(' + i + ', e); }\n';
      }
      src += '}).call(this);\n})()';
      return src;
    }

    function finish(err) {
      var failed = 0;
      for (var i = 0; i < results.length; i++) if (results[i].pass === false) failed++;
      SEND({
        type: 'done',
        ok: !err && failed === 0,
        error: err ? { name: (err.name || 'Error'), message: String((err && err.message) || err), stack: String((err && err.stack) || '') } : null,
        tests: results,
        failed: failed,
        passed: results.length - failed,
        durationMs: Date.now() - started
      });
    }

    var src;
    try {
      src = buildSource();
    } catch (e) {
      finish(e);
      return;
    }

    var promise;
    try {
      // eslint-disable-next-line no-eval
      promise = eval(src);
    } catch (e) {
      finish(e);
      return;
    }

    Promise.resolve(promise).then(
      function () { return settle(JOB.settleQuietMs || 40, JOB.settleMaxMs || 1500).then(function () { finish(null); }, function () { finish(null); }); },
      function (e) { return settle(JOB.settleQuietMs || 40, JOB.settleMaxMs ? Math.min(JOB.settleMaxMs, 400) : 400).then(function () { finish(e); }, function () { finish(e); }); }
    );
  }

  root.JSLAB_HARNESS_FN = JSLAB_HARNESS_FN;
  root.JSLAB_HARNESS_SOURCE = '(' + JSLAB_HARNESS_FN.toString() + '\n)();';

})(typeof window !== 'undefined' ? window : globalThis);
