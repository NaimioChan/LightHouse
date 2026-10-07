/* harness.js — 沙箱 iframe 里的内核。
 *
 * 这段函数的 toString() 被 sandbox.js 贴进 iframe 的 srcdoc。里面：
 *   1. 求值粘贴进来的 Vue / VueSFC 源码（两个产物都要显式挂 window，见 vendor/README.md）
 *   2. 编译用户的 SFC（调用 VUELAB_COMPILE_FN，同一份编译内核）
 *   3. 挂载、等 nextTick、跑断言、把结果回传
 *
 * 铁律（踩过，别改）：
 *   - 这里不许出现反引号，整段在模板字符串里。
 *   - 断言在**同一个作用域**里跑，且必须能 await（所以是 async 函数）。
 *   - 每条断言单独 try/catch，一条挂了其余的照跑。
 *   - 用户代码抛错 = 整体红框（fatal），断言抛错 = 单条失败。
 */
(function (root) {
  'use strict';

  function VUELAB_HARNESS_FN() {
    var JOB = (typeof VUELAB_JOB !== 'undefined' && VUELAB_JOB) || {};
    var RUN_ID = JOB.runId;
    function SEND(m) { m.runId = RUN_ID; try { parent.postMessage(m, '*'); } catch (e) {} }

    var started = Date.now();
    var Vue = null;
    var VueSFC = null;
    var app = null;
    var runtimeErrors = [];
    var LAST_COMPILED = '';
    var STYLE_NODES = [];

    /* —— 值格式化：与 node 侧共用同一份 format.js —— */
    function fmt(v) { return VUELAB_fmt(v); }

    /* —— 断言辅助：与用户代码、模板同作用域 —— */
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
      count: function (sel, msg) {
        var n = document.querySelectorAll(sel).length;
        return n;
      },
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
      /* 点击：派发真实 MouseEvent，用户代码里的 @click 才会触发 */
      click: function (sel, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      },
      /* 输入：设 value 再派发 input，v-model 才会同步 */
      input: function (sel, value, msg) {
        var el = document.querySelector(sel);
        if (!el) throw new Error((msg ? msg + '：' : '') + '找不到元素 ' + sel);
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    /* installLib 会被串进 promise 链，必须返回一个 promise */
    function installLib() {
      return Promise.resolve().then(function () {
        if (Vue && VueSFC) return true;
        (0, eval)(JOB.vue + ';window.Vue = Vue;');       // 两个产物都要显式挂 window
        (0, eval)(JOB.sfc + ';window.VueSFC = VueSFC;');
        Vue = window.Vue;
        VueSFC = window.VueSFC;
        if (!Vue) throw new Error('Vue 运行时没挂上 window');
        if (!VueSFC) throw new Error('SFC 编译器没挂上 window');
        return true;
      });
    }

    function buildComponent(src, id) {
      var compileFn = (0, eval)('(' + JOB.compileSource + ')');
      var out = compileFn(src, { id: id, filename: 'App.vue' });
      if (out.css) {
        var styleEl = document.createElement('style');
        styleEl.setAttribute('data-vuelab-style', id);
        styleEl.textContent = out.css;
        document.head.appendChild(styleEl);
        STYLE_NODES.push(styleEl);
      }
      var factory = new Function('Vue', out.code);
      var comp = factory(Vue);
      comp.__isScriptSetup = true;     // 不加，setup 的返回值会被当成绑定对象而不是渲染函数 → 空渲染
      comp.__scopeId = id;             // 不加，scoped 样式不打 data-v-* → 样式全落空
      LAST_COMPILED = out.code;
      return comp;
    }

    /* 一份用例跑完要把它的痕迹清掉：挂载点、注入的 <style>。
       不清的话自测里上一份（往往是参考答案）的 scoped 样式会继续作用在下一份（起始代码）上，
       看起来像「起始代码居然全过了」——实测踩过，一个练习因此假绿。 */
    function resetDom() {
      var host = document.getElementById('app');
      if (host && host.parentNode) host.parentNode.removeChild(host);
      STYLE_NODES.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      STYLE_NODES.length = 0;
      app = null;
      runtimeErrors.length = 0;
    }

    /* 组件在 setup / 渲染里抛错时，Vue 默认只在控制台 warn，界面上是一个空注释节点，
       看起来和「没写对」一模一样。这里自己接住，变成一条能读的 fatal。 */
    function collectErrors(app, sink) {
      app.config.errorHandler = function (err, instance, info) {
        sink.push({ name: err && err.name || 'Error', message: String(err && err.message || err), info: info });
      };
      app.config.warnHandler = function () {};
    }

    function mountComponent(src) {
      var id = 'data-v-' + (JOB.scopeSeed || 'lab00000');
      var host = document.createElement('div');
      host.id = 'app';
      document.body.appendChild(host);
      var comp = buildComponent(src, id);
      app = Vue.createApp(comp);
      collectErrors(app, runtimeErrors);
      app.mount(host);
      return Vue.nextTick();
    }

    /* 断言列表：数组，每项是一段字符串，编译成 async 函数后逐条跑 */
    function runTests(tests) {
      var chain = Promise.resolve();
      (tests || []).forEach(function (body, i) {
        chain = chain.then(function () {
          var fn;
          try {
            fn = new Function(
              'helpers', 'await_nextTick', 'app',
              'return (async () => { var ok = helpers.ok, eq = helpers.eq, near = helpers.near,'
              + ' $ = helpers.$, $$ = helpers.$$, text = helpers.text, count = helpers.count,'
              + ' has = helpers.has, missing = helpers.missing, attr = helpers.attr,'
              + ' style = helpers.style, click = helpers.click, input = helpers.input;'
              + ' var tick = await_nextTick;'
              + ' ' + body + '\n })()'
            );
          } catch (e) {
            __record('断言 ' + (i + 1) + ' 语法错', e);
            return;
          }
          return fn(helpers, function () { return Vue.nextTick(); }, app)
            .then(function () { __record('断言 ' + (i + 1), null); },
              function (err) { __record('断言 ' + (i + 1), err); });
        });
      });
      return chain;
    }

    /* node 侧自测用：把参考答案整段跑一遍并回传结果明细 */
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
          var parts = Array.prototype.slice.call(arguments).map(fmt);
          var text = parts.join(' ');
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

    function snapshot() {
      var host = document.getElementById('app');
      return host ? host.innerHTML : '';
    }

    /* 入口：sandbox.js 在文档末尾调 VUELAB_START() */
    window.VUELAB_START = function () {
      var phase = Promise.resolve();
      phase = phase.then(installLib);
      if (JOB.src != null) {
        phase = phase.then(function () { resetDom(); return mountComponent(JOB.src); });
      }
      /* 连跑多份代码（自测用）：每份独立建栈，跑完清掉。
         每一份都要自己吞掉异常 —— 只在链尾挂 catch 的话，一份挂了后面全被跳过，
         看起来像「沙箱没有回传后面那几份用例」。 */
      if (JOB.cases && JOB.cases.length) {
        return phase.then(function () {
          var seq = Promise.resolve();
          JOB.cases.forEach(function (c) {
            seq = seq.then(function () {
              __results = [];
              resetDom();
              return installLib()
                .then(function () { return mountComponent(c.src); })
                .then(function () { return runTests(c.tests); })
                .then(function () {
                  SEND({ type: 'case', caseId: c.id, tests: __results, snapshot: snapshot() });
                }, function (err) {
                  /* 组件没挂上（编译失败、setup 抛错）也要回一条，否则这份用例在
                     报告里就是一个空号，看不出是挂了还是没跑 */
                  SEND({
                    type: 'case', caseId: c.id, tests: __results,
                    runtimeErrors: runtimeErrors.slice(),
                    fatal: String((err && err.message) || err)
                  });
                });
            }).then(null, function (err) {
              /* 兜底：连上面那条 catch 自己都挂了，也要让后面的用例继续跑 */
              SEND({ type: 'case', caseId: c.id, tests: [], fatal: '用例调度出错：' + String((err && err.message) || err) });
            });
          });
          return seq;
        }).then(function () { report({ logs: logs }); },
          function (err) { report({ fatal: String(err && err.message || err), logs: logs }); });
      }
      return phase
        .then(function () { return runTests(JOB.tests); })
        .then(function () { report({ logs: logs, snapshot: snapshot() }); },
          function (err) { report({ fatal: String(err && err.message || err), logs: logs }); });
    };
  }

  root.VUELAB_HARNESS_FN = VUELAB_HARNESS_FN;
  root.VUELAB_HARNESS_SOURCE = '(' + VUELAB_HARNESS_FN.toString() + '\n)();';

  /* 预览内核：与判题共用编译内核，但只挂载、不跑断言、不回传。
     单独一个小函数，免得把 600 行的判题内核也塞进预览文档。 */
  function VUELAB_PREVIEW_FN() {
    var JOB = window.VUELAB_PREVIEW || {};
    function show(msg) {
      var d = document.createElement('div');
      d.setAttribute('data-vuelab-error', '');
      d.style.cssText = 'font:13px/1.6 system-ui,sans-serif;color:#8a2b2b;background:#fbeeea;border:1px solid #e6c9bf;border-radius:6px;padding:8px 10px;white-space:pre-wrap';
      d.textContent = msg;
      document.body.appendChild(d);
    }
    try {
      (0, eval)(JOB.vue + ';window.Vue = Vue;');
      (0, eval)(JOB.sfc + ';window.VueSFC = VueSFC;');
      var Vue = window.Vue;
      var compileFn = (0, eval)('(' + JOB.compileSource + ')');
      var id = 'data-v-' + (JOB.scopeSeed || 'preview0');
      var out = compileFn(JOB.src, { id: id, filename: 'App.vue' });
      if (out.css) {
        var st = document.createElement('style');
        st.textContent = out.css;
        document.head.appendChild(st);
      }
      var comp = (new Function('Vue', out.code))(Vue);
      comp.__isScriptSetup = true;
      comp.__scopeId = id;
      var host = document.createElement('div');
      host.id = 'app';
      document.body.appendChild(host);
      var app = Vue.createApp(comp);
      app.config.errorHandler = function (err) { show('运行出错：' + String(err && err.message || err)); };
      app.mount(host);
    } catch (e) {
      show(String(e && e.message || e));
    }
  }

  root.VUELAB_PREVIEW_FN = VUELAB_PREVIEW_FN;
  root.VUELAB_PREVIEW_SOURCE = '(' + VUELAB_PREVIEW_FN.toString() + '\n)();';
})(typeof window !== 'undefined' ? window : globalThis);
