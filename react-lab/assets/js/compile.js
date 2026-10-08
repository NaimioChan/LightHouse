/* compile.js — React 源码改写内核。全站只有这一份。
 *
 * 职责：把用户写的 React 源码文本，改写成沙箱里可以直接 `new Function` 执行的代码。
 * 它在两个地方被用到，跑的是同一个字符串：
 *   1. 浏览器：sandbox.js 把 RLLAB_COMPILE_SOURCE 贴进 iframe 的 srcdoc，在沙箱里改写（用户代码只进沙箱）。
 *   2. node：tools/verify-compile.mjs 用同一段源码。
 *
 * 与 vue-lab 的差别：那边要把 SFC 编译成组件工厂（parse → compileScript → compileStyle），
 * 这边不做编译，只做**模块导入改写**——把 `import ... from 'react'` 之类的语句换成
 * 从沙箱里预先求值的 React 产物上取。模板用 htm（零转译），不是 JSX，因此不需要 Babel。
 *
 * 三类改写：
 *   1. import 默认导入 / 命名导入 / 命名空间导入 → 从 RLLAB_REACT 对应字段解构或赋值
 *   2. export default → `return`；`export default function Foo(){}` 与 `export default class Foo {}`
 *      去掉 export/default 后还要把名字 return 出来（只删前缀的话函数声明不会把值交出去，
 *      沙箱里的 buildRoot 会拿到 undefined，错在「没有找到 export default」上，极难查）
 *   3. 模块名白名单：只认 react / react-dom / react-dom/client / htm，别的留着会语法错
 *
 * 这个函数用 RLLAB_COMPILE_FN.toString() 贴进沙箱，所以里面不许引用外部变量，
 * 也不许出现反引号（详见 AGENTS.md 铁律）。
 */
(function (root) {
  'use strict';

  function RLLAB_COMPILE_FN(src) {
    var code = String(src == null ? '' : src);

    /* import { a, b as c } from 'x' 里的名字拼成解构语法：本地名在右（a: c） */
    function toDestructure(names) {
      return names.split(',').map(function (raw) {
        var n = raw.trim();
        if (!n) return null;
        var m = /^(\S+)\s+as\s+(\S+)$/.exec(n);
        return m ? m[1] + ': ' + m[2] : n;
      }).filter(Boolean).join(', ');
    }

    /* 模块名 → 沙箱里的取值表达式。null 表示不认识这个模块。 */
    function moduleExpr(mod) {
      if (mod === 'react') return '__RLLAB_REACT.React';
      if (mod === 'react-dom') return '__RLLAB_REACT.ReactDOM';
      if (mod === 'react-dom/client') return '__RLLAB_REACT.ReactDOMClient';
      if (mod === 'react/jsx-runtime' || mod === 'react/jsx-dev-runtime') return '__RLLAB_REACT.React';
      if (mod === 'htm' || mod === 'htm/react') return '__RLLAB_REACT.htm';
      return null;
    }

    var unknown = null;
    function replacer(full, clause, mod) {
      var expr = moduleExpr(mod);
      if (!expr) { unknown = mod; return '/* 不支持的模块 ' + mod + ' */'; }
      clause = clause.trim();

      /* 命名空间：import * as React from 'x' */
      var ns = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(clause);
      if (ns) return 'const ' + ns[1] + ' = ' + expr + ';';

      /* 命名导入：import { a, b as c } from 'x' */
      var named = /^\{([\s\S]*)\}$/.exec(clause);
      if (named) return 'const { ' + toDestructure(named[1]) + ' } = ' + expr + ';';

      /* 默认导入：import htm from 'x'；也可能是 import React, { a } from 'x' */
      var withNamed = /^([A-Za-z_$][\w$]*)\s*,\s*\{([\s\S]*)\}$/.exec(clause);
      if (withNamed) {
        return 'const ' + withNamed[1] + ' = ' + expr + '; const { ' + toDestructure(withNamed[2]) + ' } = ' + expr + ';';
      }
      var def = /^([A-Za-z_$][\w$]*)$/.exec(clause);
      if (def) return 'const ' + def[1] + ' = ' + expr + ';';
      return '/* 看不懂的 import：' + clause + ' */';
    }

    /* 一整条 import 语句：import <clause> from '<mod>' */
    code = code.replace(
      /import\s+([\s\S]*?)\s+from\s*(?:'([^']+)'|"([^"]+)")/g,
      function (full, clause, m1, m2) { return replacer(full, clause, m1 || m2); }
    );

    /* 裸 import 'x'（副作用导入）直接删掉，本站没有模块副作用这回事 */
    code = code.replace(/import\s*(?:'[^']*'|"[^"]*")\s*;?/g, '');

    /* 模块化关键字：沙箱里没有模块。默认导出分三种形态：
       - export default function Foo(){} / export default class Foo{}：去掉 export default，
         函数声明不会把值交出去，所以记下名字，最后补一句 return Foo。
       - export default <表达式>（箭头函数、对象字面量、标识符）：直接换成 return。
       - 匿名 export default function (){}：同上，换成 return。 */
    var defaultNamed = null;
    code = code.replace(
      /export\s+default\s+(function|class)\s+([A-Za-z_$][\w$]*)/g,
      function (full, kind, name) { defaultNamed = name; return kind + ' ' + name; }
    );
    code = code.replace(/export\s+default\s+/g, 'return ');
    code = code.replace(/\bexport\s+(?=(?:async\s+)?function\b)/g, '');
    code = code.replace(/\bexport\s+(?=(?:const|let|var|class)\b)/g, '');
    if (defaultNamed) code = code + '\nreturn ' + defaultNamed + ';';

    return { code: code, unknown: unknown };
  }

  root.RLLAB_COMPILE_FN = RLLAB_COMPILE_FN;
  root.RLLAB_COMPILE_SOURCE = '(' + RLLAB_COMPILE_FN.toString() + '\n)';
  root.RLLAB_COMPILE = { compile: function (src) { return RLLAB_COMPILE_FN(src); }, source: root.RLLAB_COMPILE_SOURCE };
})(typeof window !== 'undefined' ? window : globalThis);
