/* harness.js — 预览 iframe 里的内核：断言辅助、控制台截流、跑断言、回传结果。
 *
 * 全站只有这一份实现。preview.js 把 CSSLAB_HARNESS_SOURCE（就是下面这个函数的源码）贴进预览 iframe，
 * 内容里的 tests / checks 是字符串，交给这里编译执行。禁止在别处再写一套 has/count/eq。
 *
 * 与 js-lab 的执行模型差别（为什么不一样）：那边整站跑的是 JS 控制台输出，用户代码和断言可以用
 * 同一个 eval 作用域；这里跑的是真实 HTML 渲染，用户 HTML 必须走浏览器解析器，用户 JS 必须是真正的
 * <script>（顶层 function 声明才会挂到 window 上，断言才取得到）。所以断言改为 new Function 编译，
 * 辅助函数作为形参注入。断言能看见什么、看不见什么，见 docs/01-content-schema.md。
 */
(function (root) {

  function CSSLAB_HARNESS_FN() {
    var JOB = (typeof CSSLAB_JOB !== 'undefined' && CSSLAB_JOB) || {};
    var RAW_SEND = (typeof CSSLAB_SEND === 'function') ? CSSLAB_SEND
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
    /* 几何：取整后的 { x, y, w, h }（x/y 是相对视口左上角，布局章主要看 w/h 与相互关系） */
    function rect(sel, msg) {
      var e = $(sel);
      if (!e) throw new Error(withMsg(msg, '期望页面里有 ' + sel + '，实际没找到'));
      var b = e.getBoundingClientRect();
      return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) };
    }
    /* CSS 的 px 值取出来带单位，比较尺寸时用这个取数字 */
    function px(sel, prop) {
      var v = style(sel, prop);
      if (v === null) return null;
      var n = parseFloat(v);
      return isNaN(n) ? v : n;
    }
    /* 网格/多列算完之后的轨道尺寸列表，如 [200, 200, 200] */
    function tracks(sel, name) {
      var e = $(sel);
      if (!e) return null;
      var t = getComputedStyle(e).getPropertyValue(name || 'grid-template-columns').trim();
      if (!t || t === 'none') return [];
      return t.split(/\s+/).map(function (v) { return Math.round(parseFloat(v) * 100) / 100; });
    }
    function near(actual, expected, tol, msg) {
      var a = Number(actual), b = Number(expected), t = Number(tol == null ? 2 : tol);
      if (isNaN(a) || isNaN(b)) throw new Error(withMsg(msg, '期望 ' + fmt(expected, 0, false) + '，实际 ' + fmt(actual, 0, false) + '（数不出来，用 px() 取数值）'));
      if (Math.abs(a - b) <= t) return true;
      throw new Error(withMsg(msg, '期望 ' + b + '（容差 ' + t + '），实际 ' + a));
    }
    function atLeast(sel, n, msg) {
      var got = $$(sel).length;
      if (got < n) throw new Error(withMsg(msg, '期望至少 ' + n + ' 个 ' + sel + '，实际 ' + got + ' 个'));
      return true;
    }
    function atMost(sel, n, msg) {
      var got = $$(sel).length;
      if (got > n) throw new Error(withMsg(msg, '期望最多 ' + n + ' 个 ' + sel + '，实际 ' + got + ' 个'));
      return true;
    }

    /* ---------- 两阶段断言用：等页面里 __notify(name) 把状态回传过来 ----------
       第二阶段重载文档之后，页面 script 侧的东西（顶层 const、事件监听里的状态）
       父页面拿不到，只能在帧内自己 __notify 出来。等不到就报错，别把整轮拖到超时。 */
    var watchListeners = [];
    function addWatchListener(name, fn) { watchListeners.push({ name: name, fn: fn }); }
    function dispatchWatch(name, payload) {
      for (var i = 0; i < watchListeners.length; i++) {
        if (watchListeners[i].name === name) watchListeners[i].fn(payload);
      }
    }
    function watch(name, fn, timeoutMs) {
      return new Promise(function (resolve, reject) {
        var done = false;
        var t = realSetTimeout(function () {
          if (done) return;
          done = true;
          reject(new Error('没有等到页面里的 __notify("' + name + '")（' + (timeoutMs || 1200) + 'ms）。'
            + '检查那个 resize / ResizeObserver 回调里有没有调用它'));
        }, timeoutMs || 1200);
        addWatchListener(name, function (payload) {
          if (done) return;
          done = true;
          if (realClearTimeout) realClearTimeout(t);
          try {
            var r = fn ? fn(payload) : true;
            if (r && typeof r.then === 'function') { r.then(function () { resolve(true); }, reject); return; }
            resolve(true);
          } catch (e) { reject(e); }
        });
      }).then(function () { return true; });
    }
    /* 页面里在 resize 回调末尾调它，断言才看得到改宽度之后的样子 */
    function __notify(name, payload) {
      dispatchWatch(String(name), payload);
      SEND({ type: 'watch', name: String(name), payload: payload === undefined ? null : payload });
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
    var KEYS = ['$', '$$', 'has', 'count', 'text', 'attr', 'tag', 'style', 'rect', 'px', 'tracks', 'eq', 'ok', 'near', 'atLeast', 'atMost', 'fn', 'logs', 'watch', '__notify'];
    function helperValues() { return [$, $$, has, count, text, attr, tag, style, rect, px, tracks, eq, ok, near, atLeast, atMost, fn, logs, watch, __notify]; }

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
        stageBase: JOB.stageBase || 0,
        ok: !error && !jsError && failed === 0,
        error: error ? { name: (error.name || 'Error'), message: String((error && error.message) || error) } : null,
        jsError: jsError,
        tests: results,
        failed: failed,
        passed: results.length - failed,
        durationMs: Date.now() - started
      });
    }

    /* 两阶段的第二阶段收工时，剩下的 watch(...) 断言在等页面回传：
       等它们全部回来（或等满 1.5 秒）再结算，否则会把还在路上的正确结果判成失败。 */
    function waitWatches() {
      if (!watchListeners.length) return Promise.resolve();
      return new Promise(function (r) { realSetTimeout(r, 1500); });
    }

    async function runAll() {
      try {
        /* 等字体就绪再跑：几何断言比的是算完的盒子，字体晚一步会让宽度差几像素 */
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
          try { await document.fonts.ready; } catch (e) {}
        }
        /* 再让过两帧：容器查询与媒体查询的结果要等浏览器完成一次真正的布局/样式更新才算得出来，
           新文档刚建好时第一次 getComputedStyle 可能读到还没应用容器查询的值。
           注意 requestAnimationFrame 在后台标签页会被节流，所以必须和超时赛跑，不能干等。 */
        await Promise.race([
          new Promise(function (r) {
            if (typeof requestAnimationFrame !== 'function') return r();
            requestAnimationFrame(function () { requestAnimationFrame(function () { r(); }); });
          }),
          new Promise(function (r) { realSetTimeout(r, 200); })
        ]);
        /* 帧刚建好时视口与元素盒子都可能是 0（父文档还没给 iframe 排出版面，或者同页同时在加载
           好几个预览窗），这时所有盒子的宽高都是 0，几何断言会读出一片 0。
           等高到 body 真的有宽度再跑（最多 500ms），然后逼一次布局。 */
        var waited = 0;
        var ready = function () {
          try {
            return window.innerWidth > 0 && document.body && document.body.getBoundingClientRect().width > 0;
          } catch (e) { return false; }
        };
        /* 最多等 1 秒。一轮里很多卡片同时抢渲染，慢的那几张可能真的要等这么久。 */
        while (!ready() && waited < 1000) {
          await new Promise(function (r) { realSetTimeout(r, 16); });
          waited += 16;
        }
        try { if (document.body) { document.body.offsetHeight; } } catch (e) {}
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

    window.__csslab_run_tests = function () {
      runAll();
    };
  }

  root.CSSLAB_HARNESS_FN = CSSLAB_HARNESS_FN;
  root.CSSLAB_HARNESS_SOURCE = '(' + CSSLAB_HARNESS_FN.toString() + '\n)();';

})(typeof window !== 'undefined' ? window : globalThis);
