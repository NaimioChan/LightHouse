/* compile.js — SFC 编译内核。全站只有这一份。
 *
 * 职责：把一份 .vue 源码文本，编译成沙箱可以直接执行的「组件工厂」代码文本 + 一份 CSS。
 * 它在两个地方被用到，跑的是同一个字符串：
 *   1. 浏览器：sandbox.js 把 VUELAB_COMPILE_SOURCE 贴进 iframe 的 srcdoc，在沙箱里编译（用户代码只进沙箱）。
 *   2. node：tools/verify-compile.mjs 与 verify-browser.mjs 的自测用同一段源码。
 *
 * 它只依赖一个外部东西：全局的 VueSFC（@vue/compiler-sfc 的浏览器构建，见 vendor/）。
 * VueSFC 与 Vue 在沙箱里的求值方式见 vendor/README.md，这里不碰那件事。
 *
 * 三处必做的改写，少一处就是白屏或空渲染（都实测过，别删）：
 *   1. import { a, b as c } from 'vue'  ->  const { a, b: c } = Vue;
 *      - 分隔符两种都会出现：模板 helper 用双引号，用户自己写的用单引号。
 *      - 别名方向不能反：`import { a as b }` 绑的是 b，解构要写 `a: b`。写反了渲染函数里
 *        全是 undefined，页面渲染成一个空的注释节点，且不报错——最难查的一个。
 *   2. export default -> return
 *   3. comp.__isScriptSetup = true + comp.__scopeId = id
 */
(function (root) {
  'use strict';

  /* 一个函数，在目标环境里执行：把 SFC 源码编译成可执行的工厂代码。
   * 用 VUELAB_COMPILE_FN.toString() 贴进沙箱，所以里面不许引用外部变量
   * （toDestructure 必须内联进来，否则沙箱里 undefined），
   * 也不许出现反引号（它本身在模板字符串里，详见 AGENTS.md 铁律 7）。 */
  function VUELAB_COMPILE_FN(src, opts) {
    /* 把 import 解构出来的名字拼成解构语法。import { a as b } 的本地名是 b。 */
    function toDestructure(names) {
      return names.split(',').map(function (raw) {
        var n = raw.trim();
        if (!n) return null;
        var m = /^(\S+)\s+as\s+(\S+)$/.exec(n);
        return m ? m[1] + ': ' + m[2] : n;
      }).filter(Boolean).join(', ');
    }

    var S = (typeof VueSFC !== 'undefined' && VueSFC) || (typeof window !== 'undefined' && window.VueSFC);
    if (!S) throw new Error('VueSFC 没加载：编译器不在，无法编译 SFC');
    var options = opts || {};
    var id = options.id || 'data-v-sfc';
    var filename = options.filename || 'App.vue';

    var parsed = S.parse(String(src == null ? '' : src), { filename: filename });
    if (parsed.errors && parsed.errors.length) {
      var e0 = parsed.errors[0];
      var err = new Error(e0.message || String(e0));
      err.kind = 'parse';
      throw err;
    }
    var descriptor = parsed.descriptor;

    /* 只有 <template> 的 SFC（没有 <script> / <script setup>）也要能编译：
       compileScript 会直接抛「SFC contains no <script> tags.」，改走 compileTemplate。 */
    var hasScript = !!(descriptor.script || descriptor.scriptSetup);
    var code;
    if (hasScript) {
      code = S.compileScript(descriptor, { id: id, inlineTemplate: true }).content;
    } else {
      var tpl = S.compileTemplate({
        source: descriptor.template ? descriptor.template.content : '',
        filename: filename,
        id: id,
        scoped: !!(descriptor.styles && descriptor.styles[0] && descriptor.styles[0].scoped)
      });
      if (tpl.errors && tpl.errors.length) {
        var terr = new Error(tpl.errors[0].message || String(tpl.errors[0]));
        terr.kind = 'template';
        throw terr;
      }
      /* compileTemplate 产出的是 export function render(...) {...}，不是表达式，
         里面还有 const _hoisted_N = ... 这类提升的静态节点。构造成
         「函数体的最后一行 return 组件对象」，让提升与解构都排在前面。 */
      var body = String(tpl.code).replace(/export\s+function\s+render/, 'function render');
      var helpers = '';
      body = body.replace(/import\s*\{([\s\S]*?)\}\s*from\s*(?:'vue'|"vue")\s*;?/g, function (m, names) {
        helpers += 'const { ' + toDestructure(names) + ' } = Vue;\n';
        return '';
      });
      code = helpers + body + '\nreturn { render: render };';
    }

    code = code.replace(
      /import\s*\{([\s\S]*?)\}\s*from\s*(?:'vue'|"vue")\s*;?/g,
      function (m, names) { return 'const { ' + toDestructure(names) + ' } = Vue;'; }
    );
    code = code.replace(/export\s+default\s+/g, 'return ');

    var css = '';
    if (descriptor.styles && descriptor.styles.length) {
      var source = descriptor.styles.map(function (s) { return s.content; }).join('\n');
      var scoped = !!descriptor.styles[0].scoped;
      var st = S.compileStyle({ source: source, filename: filename, id: id, scoped: scoped });
      if (st.errors && st.errors.length) {
        var serr = new Error(st.errors[0].message || String(st.errors[0]));
        serr.kind = 'style';
        throw serr;
      }
      css = st.code;
    }

    return { code: code, css: css, id: id, hasSetup: !!descriptor.scriptSetup };
  }

  /* 同一段函数，在浏览器里直接调（给 node 侧的 verify-compile 用 vm 求值后再调）。 */
  function compile(src, opts) {
    return VUELAB_COMPILE_FN(src, opts);
  }

  root.VUELAB_COMPILE_FN = VUELAB_COMPILE_FN;
  root.VUELAB_COMPILE_SOURCE = '(' + VUELAB_COMPILE_FN.toString() + '\n)';
  root.VUELAB_COMPILE = { compile: compile, source: root.VUELAB_COMPILE_SOURCE };
})(typeof window !== 'undefined' ? window : globalThis);
