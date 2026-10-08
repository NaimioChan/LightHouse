/* harness.js — 沙箱 iframe 里的内核。
 *
 * 这段函数的 toString() 被 sandbox.js 贴进 iframe 的 srcdoc。里面：
 *   1. 求值粘贴进来的 React 产物（自建的单入口 IIFE，见 vendor/README.md）
 *   2. 改写用户源码（调用 RLLAB_COMPILE_FN，同一份改写内核）
 *   3. 用 htm 的 html 标签挂载、跑断言、把结果回传
 *
 * 铁律（踩过，别改）：
 *   - 这里不许出现反引号，整段在模板字符串里。
 *   - 断言在**同一个作用域**里跑，且必须能 await（所以是 async 函数）。
 *   - 每条断言单独 try/catch，一条挂了其余的照跑。
 *   - 用户代码抛错 = 整体红框（fatal），断言抛错 = 单条失败。
 *   - 用户代码只跑在这个 iframe 里（opaque origin），父页面读不到它的 DOM，只能 postMessage。
 */
(function (root) {
  'use strict';

  function RLLAB_HARNESS_FN() {
    var JOB = (typeof RLLAB_JOB !== 'undefined' && RLLAB_JOB) || {};
    var RUN_ID = JOB.runId;
    function SEND(m) { m.runId = RUN_ID; try { parent.postMessage(m, '*'); } catch (e) {} }

    var started = Date.now();
    var Bundle = null;
    var React = null;
    var html = null;
    var root = null;
    var runtimeErrors = [];
    var LAST_COMPILED = '';
    var STYLE_NODES = [];

    function fmt(v) { return RLLAB_fmt(v); }

    /* —— 断言辅助：与用户代码、htm 同作用域 —— */
    var __results = [];
    function __record(name, err) {
      __results.push({ name: name, pass: !err, message: err ? String(err.message || err) : '' });
    }
    var helpers = {
      ok: function (cond, msg) {
        if (!cond) throw new Error((msg || '条件应为真') + '，实际 ' + fmt(cond));
      },
      eq: function (actual, expected, msg) {
        var a = fmt(actual), b = fmt(expected);
        if (a !== b) throw new Error((msg ? msg + '：' : '') + '期望 ' + b + '，实际 ' + a);
      },
      near: function (a, b, tol, msg) {
        var t = tol == null ? 0.001 : tol;
        if (Math.abs(a - b) > t) throw new Error((msg ? msg + '：' : '') + '期望接近 ' + b + '（容差 ' + t + '），实际 ' + a);
      },
      /* DOM 辅助：断言直接摸真实渲染出来的 DOM */
      $: function (sel) { return document.querySelector(sel); },
      $$: function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); },
      text: function (sel, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        return el.textContent.trim();
      },
      count: function (sel) { return document.querySelectorAll(sel).length; },
      has: function (sel, msg) {
        if (!document.querySelector(sel)) throw new Error((msg ? msg + '：' : '') + '页面上找不到 ' + sel);
      },
      missing: function (sel, msg) {
        if (document.querySelector(sel)) throw new Error((msg ? msg + '：' : '') + '页面上不该出现 ' + sel);
      },
      attr: function (sel, name, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        return el.getAttribute(name);
      },
      style: function (sel, prop, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        return getComputedStyle(el)[prop];
      },
      /* 点击：派发真实 MouseEvent；React 的 onClick 才会触发 */
      click: function (sel, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      },
      /* 输入：设 value 再派发 input；React 的受控组件靠它同步 */
      input: function (sel, value, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      /* 勾选 / 单选框：设 checked 再派发 click（React 的 onChange 监听的是 click/change） */
      check: function (sel, value, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        el.checked = value == null ? true : !!value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      /* 键盘：派发 keydown，keyup.enter 之类的处理器才会触发 */
      key: function (sel, keyName, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        el.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key: keyName, bubbles: true }));
      }
    };

    /* 等一帧：React 的并发渲染、以及 useEffect 排的活，可能还没落到 DOM。
       这里**不能用 requestAnimationFrame**：沙箱 iframe 被放在离屏容器里（见 app.css），
       隐藏文档里 rAF 根本不会触发，tick() 会永远挂着（整批用例一起超时）。
       实测：macrotask 足够让 flushSync 之后的状态更新与 effect 落定，两轮更稳。 */
    function tick() {
      return new Promise(function (resolve) {
        setTimeout(function () { setTimeout(resolve, 0); }, 0);
      });
    }

    /* installLib 会被串进 promise 链，必须返回一个 promise */
    function installBundle() {
      return Promise.resolve().then(function () {
        if (Bundle) return true;
        (0, eval)('window.__RLLAB_REACT = RLLAB_REACT;');
        Bundle = window.__RLLAB_REACT;
        if (!Bundle || !Bundle.React) throw new Error('React 产物没挂上 window');
        React = Bundle.React;
        html = Bundle.htm.bind(React.createElement);
        return true;
      });
    }

    function compile(src) {
      var compileFn = (0, eval)('(' + JOB.compileSource + ')');
      return compileFn(src);
    }

    /* html / React 等注入成沙箱的全局，而不是 new Function 的形参：
       内容里用户代码常常自己写 const html = htm.bind(...)（把 htm 当普通库用），
       形参同名会直接 SyntaxError（Identifier 'html' has already been declared）。
       注入全局后，同名 const 只是遮蔽它，不报错。 */
    function injectGlobals() {
      window.html = html;
      window.React = React;
      window.ReactDOM = Bundle.ReactDOM;
      window.ReactDOMClient = Bundle.ReactDOMClient;
      window.htm = Bundle.htm;
    }

    function buildRoot(src) {
      var out = compile(src);
      LAST_COMPILED = out.code;
      injectGlobals();
      var factory = new Function('__RLLAB_REACT', out.code);
      var exported = factory(Bundle);
      if (exported == null) {
        throw new Error('没有找到 export default：把根组件 export default 出来（或写成 export default function App() {}）');
      }
      return exported;
    }

    /* 一份用例跑完要把痕迹清掉：卸载 React 根、删掉挂载点。
       不清的话上一份的 DOM 会留在页面上，断言会抓到别人的元素。 */
    function resetDom() {
      if (root) { try { root.unmount(); } catch (e) {} root = null; }
      var host = document.getElementById('app');
      if (host && host.parentNode) host.parentNode.removeChild(host);
      STYLE_NODES.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      STYLE_NODES.length = 0;
      runtimeErrors.length = 0;
    }

    function collectErrors(options) {
      options.onUncaughtError = function (err) {
        runtimeErrors.push({ name: (err && err.name) || 'Error', message: String((err && err.message) || err) });
      };
      options.onCaughtError = function (err) {
        runtimeErrors.push({ name: (err && err.name) || 'Error', message: String((err && err.message) || err) });
      };
    }

    function mountComponent(src) {
      var host = document.createElement('div');
      host.id = 'app';
      document.body.appendChild(host);
      var comp = buildRoot(src);
      var element = (typeof comp === 'function' || (comp && comp.$$typeof)) ? React.createElement(comp) : comp;
      var options = {};
      collectErrors(options);
      root = Bundle.ReactDOMClient.createRoot(host, options);
      Bundle.ReactDOM.flushSync(function () { root.render(element); });
      return Promise.resolve();
    }

    /* 断言列表：数组，每项是一段字符串，编译成 async 函数后逐条跑 */
    function runTests(tests) {
      var chain = Promise.resolve();
      (tests || []).forEach(function (body, i) {
        chain = chain.then(function () {
          var fn;
          try {
            fn = new Function(
              'helpers', 'await_tick',
              'return (async () => { var ok = helpers.ok, eq = helpers.eq, near = helpers.near,'
              + ' $ = helpers.$, $$ = helpers.$$, text = helpers.text, count = helpers.count,'
              + ' has = helpers.has, missing = helpers.missing, attr = helpers.attr,'
              + ' style = helpers.style, click = helpers.click, input = helpers.input,'
              + ' check = helpers.check, key = helpers.key;'
              + ' var tick = await_tick;'
              + ' ' + body + '\n })()'
            );
          } catch (e) {
            __record('断言 ' + (i + 1) + ' 语法错', e);
            return;
          }
          return fn(helpers, tick)
            .then(function () { __record('断言 ' + (i + 1), null); },
              function (err) { __record('断言 ' + (i + 1), err); });
        });
      });
      return chain;
    }

    function snapshot() {
      var host = document.getElementById('app');
      return host ? host.innerHTML : '';
    }

    function report(extra) {
      SEND({
        type: 'done', ok: !extra.fatal && !runtimeErrors.length, fatal: extra.fatal || null,
        runtimeErrors: runtimeErrors.slice(), tests: __results, logs: extra.logs || [],
        compiled: LAST_COMPILED || '',
        durationMs: Date.now() - started, snapshot: extra.snapshot || null
      });
    }

    var logs = [];
    if (typeof console !== 'undefined' && console) {
      ['log', 'info', 'warn', 'error'].forEach(function (level) {
        console[level] = function () {
          var text = Array.prototype.slice.call(arguments).map(fmt).join(' ');
          logs.push(text);
          SEND({ type: 'console', level: level, text: text });
        };
      });
    }

    window.addEventListener('error', function (ev) {
      var e = ev && ev.error;
      var msg = '脚本出错：' + ((e && e.message) || (ev && ev.message) || '未知错误');
      logs.push(msg);
      SEND({ type: 'console', level: 'error', text: msg });
    });
    window.addEventListener('unhandledrejection', function (ev) {
      logs.push('未处理的 Promise 拒绝：' + fmt(ev && ev.reason));
    });

    /* 入口：sandbox.js 在文档末尾调 RLLAB_START() */
    window.RLLAB_START = function () {
      var phase = Promise.resolve();
      phase = phase.then(installBundle);
      if (JOB.src != null) {
        phase = phase.then(function () { resetDom(); return mountComponent(JOB.src); });
      }
      /* 连跑多份代码（自测用）：每份独立建栈，跑完清掉。
         每一份都要自己吞掉异常 —— 只在链尾挂 catch 的话，一份挂了后面全被跳过。 */
      if (JOB.cases && JOB.cases.length) {
        return phase.then(function () {
          var seq = Promise.resolve();
          JOB.cases.forEach(function (c) {
            seq = seq.then(function () {
              __results = [];
              resetDom();
              return installBundle()
                .then(function () { return mountComponent(c.src); })
                .then(function () { return runTests(c.tests); })
                .then(function () {
                  SEND({ type: 'case', caseId: c.id, tests: __results, snapshot: snapshot() });
                }, function (err) {
                  SEND({
                    type: 'case', caseId: c.id, tests: __results,
                    runtimeErrors: runtimeErrors.slice(),
                    fatal: String((err && err.message) || err)
                  });
                });
            }).then(null, function (err) {
              SEND({ type: 'case', caseId: c.id, tests: [], fatal: '用例调度出错：' + String((err && err.message) || err) });
            });
          });
          return seq;
        }).then(function () { report({ logs: logs }); },
          function (err) { report({ fatal: String((err && err.message) || err), logs: logs }); });
      }
      return phase
        .then(function () { return runTests(JOB.tests); })
        .then(function () { report({ logs: logs, snapshot: snapshot() }); },
          function (err) { report({ fatal: String((err && err.message) || err), logs: logs }); });
    };
  }

  root.RLLAB_HARNESS_FN = RLLAB_HARNESS_FN;
  root.RLLAB_HARNESS_SOURCE = '(' + RLLAB_HARNESS_FN.toString() + '\n)();';

  /* 预览内核：与判题共用改写内核，但只挂载、不跑断言、不回传。 */
  function RLLAB_PREVIEW_FN() {
    var JOB = window.RLLAB_PREVIEW || {};
    function show(msg) {
      var d = document.createElement('div');
      d.setAttribute('data-rllab-error', '');
      d.style.cssText = 'font:13px/1.6 system-ui,sans-serif;color:#8a2b2b;background:#fbeeea;border:1px solid #e6c9bf;border-radius:6px;padding:8px 10px;white-space:pre-wrap';
      d.textContent = msg;
      document.body.appendChild(d);
    }
    try {
      (0, eval)('window.__RLLAB_REACT = RLLAB_REACT;');
      var Bundle = window.__RLLAB_REACT;
      var React = Bundle.React;
      var html = Bundle.htm.bind(React.createElement);
      var compileFn = (0, eval)('(' + JOB.compileSource + ')');
      var out = compileFn(JOB.src);
      window.html = html;
      window.React = React;
      window.ReactDOM = Bundle.ReactDOM;
      window.ReactDOMClient = Bundle.ReactDOMClient;
      window.htm = Bundle.htm;
      var factory = new Function('__RLLAB_REACT', out.code);
      var exported = factory(Bundle);
      if (exported == null) throw new Error('没有找到 export default（根组件没有导出）');
      var host = document.createElement('div');
      host.id = 'app';
      document.body.appendChild(host);
      var element = (typeof exported === 'function' || (exported && exported.$$typeof)) ? React.createElement(exported) : exported;
      var opts = {};
      opts.onUncaughtError = function (err) { show('运行出错：' + String((err && err.message) || err)); };
      opts.onCaughtError = function (err) { show('运行出错：' + String((err && err.message) || err)); };
      var root = Bundle.ReactDOMClient.createRoot(host, opts);
      Bundle.ReactDOM.flushSync(function () { root.render(element); });
    } catch (e) {
      show(String((e && e.message) || e));
    }
  }

  root.RLLAB_PREVIEW_FN = RLLAB_PREVIEW_FN;
  root.RLLAB_PREVIEW_SOURCE = '(' + RLLAB_PREVIEW_FN.toString() + '\n)();';
})(typeof window !== 'undefined' ? window : globalThis);
