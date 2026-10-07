/* judge.js — TypeScript 判题内核：建 Program、收诊断、取类型、跑断言。
 *
 * 全站只有这一份判题实现：章节里的 tests / checks 是字符串，交给这里编译执行；
 * 浏览器（父页面主线程，编译器来自 vendor/）与 node 校验脚本（tools/verify-types.mjs）跑的是同一个文件。
 * 禁止在别处再写一套 eqType / hasError。
 *
 * 为什么断言跑在父页面而不是沙箱 iframe：类型信息只存在于编译器里，编译器必须跟断言同一边。
 * 用户代码本身从不 eval；需要真跑的时候，只把 **编译产物** 丢进 sandbox="allow-scripts" 的 iframe
 * （见 sandbox.js），那一步与类型判题无关。
 *
 * 依赖：format.js（值格式化，node 与浏览器必须一致）、vendor/ 三个文件。
 * 契约见 docs/01-content-schema.md 的「断言辅助」一节。
 */
(function (root) {
  'use strict';

  var fmt = root.TSLAB_fmt;
  if (typeof fmt !== 'function') throw new Error('judge.js 需要先引入 assets/js/format.js');

  var DEFAULT_LIB = 'lib.es2020.full.d.ts';
  var EXPECT_FILE = '__expect.ts';
  var MAIN_FILE = 'main.ts';

  var TS = null, LIBS = null, readyP = null;
  var libCache = Object.create(null);   // lib 的 SourceFile 跨 Program 复用（实测能省掉 ~40 个文件的重新解析）
  var lastProgram = null;               // 上一次的 Program，交给 createProgram 做增量

  /* 内容的 tsconfig 只允许覆盖这些键；写错名字会在校验期被抓出来（verify-content） */
  var BOOL_OPTS = ['strict', 'noImplicitAny', 'strictNullChecks', 'strictFunctionTypes', 'strictBindCallApply',
    'strictPropertyInitialization', 'noImplicitThis', 'alwaysStrict', 'exactOptionalPropertyTypes',
    'noUncheckedIndexedAccess', 'noImplicitReturns', 'noImplicitOverride', 'noFallthroughCasesInSwitch',
    'allowUnreachableCode', 'allowUnusedLabels', 'noUnusedLocals', 'noUnusedParameters', 'isolatedModules',
    'verbatimModuleSyntax', 'useDefineForClassFields', 'experimentalDecorators', 'emitDecoratorMetadata',
    'noPropertyAccessFromIndexSignature', 'allowSyntheticDefaultImports', 'esModuleInterop', 'resolveJsonModule',
    'declaration', 'allowJs', 'checkJs', 'removeComments', 'preserveConstEnums', 'noImplicitUseStrict'];
  var ENUM_OPTS = { target: 'ScriptTarget', module: 'ModuleKind', newLine: null, jsx: 'JsxEmit' };
  var DEFAULTS = {
    strict: true, target: 'ES2020', module: 'ESNext',
    noEmit: true, skipLibCheck: true, types: [], noErrorTruncation: true
  };

  /* ---------- 载入编译器 ---------- */

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('加载失败：' + src)); };
      document.head.appendChild(s);
    });
  }

  function adopt() {
    TS = root.ts;
    LIBS = root.TSLAB_LIB;
    if (!TS) throw new Error('vendor/typescript.js 没有挂上全局 ts');
    if (!LIBS) throw new Error('vendor/libs-embed.js 没有挂上 TSLAB_LIB');
    if (root.TSLAB_DIAG_ZH && TS.setLocalizedDiagnosticMessages) {
      try { TS.setLocalizedDiagnosticMessages(root.TSLAB_DIAG_ZH); } catch (e) { /* 中文诊断是加分项，失败不影响判题 */ }
    }
  }

  /** 把编译器加载进来。node 侧由调用方先把 ts 与 TSLAB_LIB 挂到 globalThis，这里直接采用。 */
  function ready() {
    if (TS && LIBS) return Promise.resolve();
    if (root.ts && root.TSLAB_LIB) { adopt(); return Promise.resolve(); }
    if (readyP) return readyP;
    readyP = loadScript('vendor/typescript.js')
      .then(function () { return loadScript('vendor/libs-embed.js'); })
      .then(function () { return loadScript('vendor/diag-zh.js').then(null, function () { return null; }); })
      .then(adopt);
    return readyP;
  }

  /* ---------- Program 构建 ---------- */

  function baseName(n) { return String(n).split(/[\\/]/).pop(); }

  function libSourceFile(name, lv) {
    if (libCache[name]) return libCache[name];
    var text = LIBS[name];
    if (text === undefined) return undefined;
    var sf = TS.createSourceFile(name, text, lv, true);
    libCache[name] = sf;
    return sf;
  }

  function makeHost(files) {
    return {
      getSourceFile: function (name, lv) {
        var b = baseName(name);
        if (files[b] !== undefined) {
          var sf = TS.createSourceFile(b, files[b], lv, true);
          sf.version = files[b];           // 内容变了必须让增量复用认出来
          return sf;
        }
        return libSourceFile(b, lv);
      },
      getDefaultLibFileName: function () { return DEFAULT_LIB; },
      writeFile: function () {},
      getCurrentDirectory: function () { return ''; },
      getDirectories: function () { return []; },
      fileExists: function (n) { return files[baseName(n)] !== undefined || LIBS[baseName(n)] !== undefined; },
      readFile: function (n) { var b = baseName(n); return files[b] !== undefined ? files[b] : LIBS[b]; },
      getCanonicalFileName: function (f) { return f; },
      useCaseSensitiveFileNames: function () { return true; },
      getNewLine: function () { return '\n'; }
    };
  }

  function enumValue(kind, name, where) {
    var table = TS[kind];
    var want = String(name);
    var hit = null;
    if (table[want] !== undefined) hit = table[want];
    else {
      var up = want.toUpperCase();
      Object.keys(table).forEach(function (k) {
        if (hit === null && typeof table[k] === 'number' && k.toUpperCase() === up) hit = table[k];
      });
    }
    if (hit === null || typeof hit !== 'number') {
      throw new Error('内容里的 tsconfig.' + where + ' 写错了：' + name + '（可选值是 TS 的 ' + kind + ' 名，如 ES2020 / ESNext）');
    }
    return hit;
  }

  function optionsFor(over) {
    over = over || {};
    var merged = {}, k;
    for (k in DEFAULTS) merged[k] = DEFAULTS[k];
    for (k in over) {
      if (BOOL_OPTS.indexOf(k) >= 0 || Object.prototype.hasOwnProperty.call(ENUM_OPTS, k)) merged[k] = over[k];
      else throw new Error('内容里的 tsconfig 有未知选项：' + k);
    }
    var out = {
      skipLibCheck: true, types: [], noErrorTruncation: true,
      target: enumValue('ScriptTarget', merged.target, 'target'),
      module: enumValue('ModuleKind', merged.module, 'module')
    };
    BOOL_OPTS.forEach(function (b) {
      if (merged[b] !== undefined) out[b] = !!merged[b];
    });
    if (merged.strict !== undefined) out.strict = !!merged.strict;
    return out;
  }

  function toDiag(d) {
    var line = 0, col = 0;
    if (d.file && d.start !== undefined && d.start !== null) {
      var lc = d.file.getLineAndCharacterOfPosition(d.start);
      line = lc.line + 1;
      col = lc.character + 1;
    }
    var msg = TS.flattenDiagnosticMessageText(d.messageText, ' ');
    return { code: d.code, line: line, col: col, msg: msg, text: 'TS' + d.code + (line ? '（第 ' + line + ' 行）' : '') + '：' + msg };
  }

  function diagsOf(program, sf) {
    return TS.getPreEmitDiagnostics(program, sf).map(toDiag);
  }

  /* ---------- 符号与类型 ---------- */

  function findDecl(sf, name) {
    var found = null;
    TS.forEachChild(sf, function (n) {
      if (found) return;
      if (TS.isVariableStatement(n)) {
        n.declarationList.declarations.forEach(function (d) {
          if (!found && d.name && d.name.text === name) found = d;
        });
        return;
      }
      if (!n.name || !n.name.text || n.name.text !== name) return;
      found = n;
    });
    return found;
  }

  function typeOfDecl(checker, decl) {
    if (!decl) return null;
    if (TS.isVariableDeclaration(decl)) return checker.getTypeAtLocation(decl.name);
    if (TS.isTypeAliasDeclaration(decl) || TS.isInterfaceDeclaration(decl)) {
      var sym = checker.getSymbolAtLocation(decl.name);
      return sym ? checker.getDeclaredTypeOfSymbol(sym) : null;
    }
    return checker.getTypeAtLocation(decl);
  }

  /* 名字支持点号路径：Box.size、p.a.b、Counter.total（静态成员走类的导出表）、fn（取函数类型） */
  function typeOfPath(checker, sf, path) {
    var parts = String(path).split('.');
    var decl = findDecl(sf, parts[0]);
    var t = typeOfDecl(checker, decl);
    for (var i = 1; i < parts.length && t; i++) {
      var prop = checker.getPropertyOfType(t, parts[i]);
      if (!prop && decl && TS.isClassDeclaration(decl) && decl.name) {
        /* 静态成员不在实例类型上，去类的符号表（导出）里找 */
        var clsSym = checker.getSymbolAtLocation(decl.name);
        var exports = clsSym ? checker.getExportsOfModule(clsSym) : null;
        if (exports) {
          for (var k = 0; k < exports.length; k++) {
            if (exports[k].name === parts[i]) { prop = exports[k]; break; }
          }
        }
      }
      if (!prop) return null;
      t = checker.getTypeOfSymbolAtLocation(prop, sf);
    }
    return t || null;
  }

  /* ---------- 分析一次代码 ---------- */

  function analyze(code, opts) {
    if (!TS) throw new Error('编译器还没加载：先 await TSLAB_JUDGE.ready()');
    opts = opts || {};
    var expects = opts.expects || [];
    var files = {};
    files[MAIN_FILE] = String(code == null ? '' : code);
    var i;
    if (expects.length) {
      var lines = [];
      for (i = 0; i < expects.length; i++) lines.push('type __E' + i + ' = (' + expects[i] + ');');
      files[EXPECT_FILE] = lines.join('\n');
    }

    var program = TS.createProgram(Object.keys(files), optionsFor(opts.tsconfig), makeHost(files), lastProgram || undefined);
    lastProgram = program;

    var checker = program.getTypeChecker();
    var sf = program.getSourceFile(MAIN_FILE);
    if (!sf) throw new Error('编译器没有产出 main.ts（环境异常）');
    var diags = diagsOf(program, sf);

    var expectTypes = [];
    if (expects.length) {
      var ef = program.getSourceFile(EXPECT_FILE);
      var eDiags = ef ? diagsOf(program, ef) : [{ text: '期望类型文件没被加载', line: 0, msg: '' }];
      if (eDiags.length) {
        throw new Error('内容里的期望类型写错了：' + eDiags[0].text + '　（' + (expects[eDiags[0].line - 1] || expects[0]) + '）');
      }
      for (i = 0; i < expects.length; i++) {
        var ed = findDecl(ef, '__E' + i);
        expectTypes.push(typeOfDecl(checker, ed));
      }
    }

    return {
      code: files[MAIN_FILE],
      checker: checker,
      program: program,
      sourceFile: sf,
      diags: diags,
      expects: expects,
      expectTypes: expectTypes,
      typeOf: function (name) { return typeOfPath(checker, sf, name); },
      expectOf: function (text) {
        var idx = expects.indexOf(String(text));
        if (idx < 0) throw new Error('这条断言需要的期望类型没有被登记（内容问题）：' + text);
        return expectTypes[idx];
      }
    };
  }

  /* ---------- 期望类型登记：从断言字符串里扫出 eqType('x', 'string[]') 的第二个实参 ---------- */

  var EXPECT_HELPERS = { eqType: 1, eqTypeExact: 1, assignableTo: 1, notAssignableTo: 1 };

  function collectExpects(tests) {
    if (!tests || !tests.length) return [];
    var src = tests.map(function (t, i) { return 'async function __t' + i + '() {\n' + t + '\n}'; }).join('\n');
    var sf = TS.createSourceFile('__tests.ts', src, TS.ScriptTarget.ESNext, true);
    var out = [];
    (function visit(node) {
      if (TS.isCallExpression(node) && TS.isIdentifier(node.expression)) {
        var idx = EXPECT_HELPERS[node.expression.text];
        if (idx !== undefined) {
          var arg = node.arguments[idx];
          if (arg && TS.isStringLiteralLike(arg)) {
            if (out.indexOf(arg.text) < 0) out.push(arg.text);
          } else {
            throw new Error('断言里的期望类型必须是单引号字符串字面量（内容问题）：' + node.expression.text + '(...)');
          }
        }
      }
      TS.forEachChild(node, visit);
    })(sf);
    return out;
  }

  /* ---------- 编译产物 ----------
   * 优先用 typecheck 那一次建好的 Program 来 emit：这样「编译产物」页签里就是这台编译器
   * 真会给你的东西（const enum 成员会被内联、`useDefineForClassFields` 随 target 走、
   * target 一改产物就变）。单文件 transpileModule 只当兜底（没有 Program 时，比如 node 探针）。 */
  function emitFromProgram(program, tsconfig) {
    var captured = null;
    try {
      program.emit(undefined, function (name, text) {
        if (!captured && /\.js$/.test(name)) captured = text;
      });
    } catch (e) {
      return null;
    }
    return captured;
  }

  function emitJs(code, tsconfig) {
    if (!TS) throw new Error('编译器还没加载：先 await TSLAB_JUDGE.ready()');
    var o = optionsFor(tsconfig);
    var out = TS.transpileModule(String(code == null ? '' : code), {
      compilerOptions: {
        target: o.target,
        module: TS.ModuleKind.ESNext,
        removeComments: false,
        useDefineForClassFields: o.useDefineForClassFields,
        experimentalDecorators: !!o.experimentalDecorators
      },
      reportDiagnostics: false
    });
    return out.outputText;
  }

  function hasModuleSyntax(js) { return /(^|\n)\s*(import|export)[\s{*]/.test(js); }

  /* ---------- 断言上下文 ---------- */

  function withMsg(msg, core) { return (msg ? msg + '　／　' : '') + core; }

  function pathHint(name) {
    return '（要断言的名字必须在这段代码里声明，可以是 Box.size 这样的路径）';
  }

  function widen(J, t, exact) {
    if (!t || exact) return t;
    var F = TS.TypeFlags, c = J.checker;
    if (t.flags & F.StringLiteral) return c.getStringType();
    if (t.flags & F.NumberLiteral) return c.getNumberType();
    if (t.flags & F.BooleanLiteral) return c.getBooleanType();
    if ((t.flags & F.BigIntLiteral) && c.getBigIntType) return c.getBigIntType();
    return t;
  }

  /* 类型里是不是藏着 any（any[]、Promise<any>、{ a: any }、(x: any) => void…）。
     为什么非查不可：any 与任何类型都互相可赋值，只按双向可赋值判等价时，
     any[] 与 string[]、{ a: any } 与 { a: string } 都会被判成同一个类型——
     而「别用 any」正是本站要抓的东西（写内容时实测踩到，见 docs/01-content-schema.md）。
     只认用户文件里写的任何一层：lib 内部到处都是 any（Promise.catch 的 onrejected 之类），
     顺着它们走会把 Promise<string> 也判成「带 any」。 */
  function inUserFile(node, fileName) {
    if (!node || !node.getSourceFile) return false;
    try { return node.getSourceFile().fileName === fileName; } catch (e) { return false; }
  }

  function typeHasAny(checker, type, fileName, depth, budget) {
    if (!type) return false;
    var F = TS.TypeFlags;
    if (type.flags & F.Any) return true;
    depth = depth || 0;
    budget = budget || { n: 0 };
    if (depth > 3 || budget.n > 60) return false;
    budget.n++;

    var i, args = null, sigs = null;
    if (type.types) {                                   // 联合 / 交叉
      for (i = 0; i < type.types.length; i++) {
        if (typeHasAny(checker, type.types[i], fileName, depth + 1, budget)) return true;
      }
    }
    try { args = checker.getTypeArguments(type); } catch (e) { args = null; }   // Array<any>、Promise<any>、元组…
    if (args && args.length) {
      for (i = 0; i < args.length; i++) {
        if (typeHasAny(checker, args[i], fileName, depth + 1, budget)) return true;
      }
    }
    try { sigs = checker.getSignaturesOfType(type, TS.SignatureKind.Call); } catch (e) { sigs = null; }
    if (sigs && sigs.length && inUserFile(sigs[0].getDeclaration && sigs[0].getDeclaration(), fileName)) {
      if (typeHasAny(checker, sigs[0].getReturnType(), fileName, depth + 1, budget)) return true;
      var ps = sigs[0].getParameters();
      for (i = 0; i < ps.length; i++) {
        if (typeHasAny(checker, checker.getTypeOfSymbolAtLocation(ps[i], ps[i].valueDeclaration || ps[i].declarations[0]), fileName, depth + 1, budget)) return true;
      }
    }
    if (type.flags & F.Object && !(type.flags & F.TypeParameter)) {
      var props = null;
      try { props = checker.getPropertiesOfType(type); } catch (e) { props = null; }
      if (props && props.length) {
        for (i = 0; i < props.length && i < 12; i++) {
          var p = props[i];
          var pDecl = p.valueDeclaration || (p.declarations && p.declarations[0]);
          if (!inUserFile(pDecl, fileName)) continue;   // lib 里的属性一律不管
          if (typeHasAny(checker, checker.getTypeOfSymbolAtLocation(p, pDecl), fileName, depth + 1, budget)) return true;
        }
      }
    }
    return false;
  }

  function equivalent(checker, a, b, location) {
    /* 双向可赋值 ≈ 等价，但有两处必须例外：
       1. any 与任何类型都互相可赋值，于是 any 与 unknown（或 string、any[] 与 string[]）会被判成等价——
          教学上正好是反的，单独拆开。
       2. readonly 不参与可赋值性，eqType 看不见只读修饰符（要断言只读就用 hasError(2540)，见契约文档）。 */
    var F = TS.TypeFlags;
    var file = location ? location.fileName : null;
    if (!!(a.flags & F.Any) !== !!(b.flags & F.Any)) return false;
    if (typeHasAny(checker, a, file) !== typeHasAny(checker, b, file)) return false;
    return checker.isTypeAssignableTo(a, b) && checker.isTypeAssignableTo(b, a);
  }

  function makeContext(J, options) {
    var checker = J.checker;
    var opts = options || {};
    var ctxBox = { lastRun: null };

    /* --- 诊断 --- */
    var d = J.diags;
    var codes = d.map(function (x) { return x.code; });

    function describe(list, limit) {
      var head = list.slice(0, limit || 3).map(function (x) { return x.text; }).join('；');
      return head + (list.length > (limit || 3) ? '（还有 ' + (list.length - (limit || 3)) + ' 条）' : '');
    }
    function noErrors(msg) {
      if (d.length === 0) return true;
      throw new Error(withMsg(msg, '期望没有类型错误，实际有 ' + d.length + ' 条：' + describe(d)));
    }
    function countErrors(n, msg) {
      if (d.length === n) return true;
      throw new Error(withMsg(msg, '期望 ' + n + ' 条类型错误，实际 ' + d.length + ' 条：' + describe(d)));
    }
    function normCode(code) {
      var s = String(code).toUpperCase().replace(/^TS/, '');
      if (!/^\d+$/.test(s)) throw new Error('错误码要写成 2322 或 TS2322，收到：' + code);
      return Number(s);
    }
    function hasError(code, msg) {
      var c = normCode(code);
      if (codes.indexOf(c) >= 0) return true;
      throw new Error(withMsg(msg, '期望出现错误 TS' + c + '，实际是：' + (d.length ? describe(d) : '没有任何错误')));
    }
    function notError(code, msg) {
      var c = normCode(code);
      if (codes.indexOf(c) < 0) return true;
      var hit = d.filter(function (x) { return x.code === c; })[0];
      throw new Error(withMsg(msg, '期望不再出现 TS' + c + '，实际还有：' + hit.text));
    }
    function pickMsg(a, b) {
      if (typeof a === 'string' && b === undefined) return a;
      return b;
    }
    function errorAt(line, code, msg) {
      msg = pickMsg(code, msg);
      var want = (code === undefined || typeof code === 'string') ? null : normCode(code);
      var at = d.filter(function (x) { return x.line === line && (want === null || x.code === want); });
      if (at.length) return true;
      throw new Error(withMsg(msg, '期望第 ' + line + ' 行有' + (want === null ? '类型错误' : ' TS' + want) +
        '，实际那里' + (d.some(function (x) { return x.line === line; }) ? '是别的错误：' + describe(d.filter(function (x) { return x.line === line; })) : '没有错误')));
    }
    function noErrorAt(line, msg) {
      var at = d.filter(function (x) { return x.line === line; });
      if (!at.length) return true;
      throw new Error(withMsg(msg, '期望第 ' + line + ' 行没有错误，实际有：' + describe(at)));
    }

    /* --- 类型 --- */
    function requireType(name) {
      var t = J.typeOf(name);
      if (!t) throw new Error('在代码里找不到名字 ' + name + pathHint());
      return t;
    }
    function type(name) { return checker.typeToString(requireType(name)); }
    function exists(name, msg) {
      var t = J.typeOf(name);
      if (t) return true;
      throw new Error(withMsg(msg, '期望代码里声明了 ' + name + '，实际找不到'));
    }
    function memberNames(name) {
      var t = requireType(name);
      /* 枚举类型走 getPropertiesOfType 会带出 Number/String 的原型方法（toFixed、charAt…），
         所以枚举成员直接从声明里取。 */
      var sym = t.symbol;
      if (sym && (sym.flags & TS.SymbolFlags.Enum) && sym.declarations && sym.declarations.length) {
        var dm = sym.declarations[0];
        if (dm.members) {
          return dm.members.map(function (m) {
            return m.name && m.name.text != null ? String(m.name.text) : String(m.name.getText());
          }).sort();
        }
      }
      return checker.getPropertiesOfType(t).map(function (s) { return s.name; }).sort();
    }
    function eqTypeImpl(name, expected, msg, exact) {
      var ta = requireType(name), te = J.expectOf(expected);
      if (equivalent(checker, widen(J, ta, exact), widen(J, te, exact), J.sourceFile)) return true;
      /* 报期望值时用内容里写的那串（别名类型 typeToString 会打成 __E0，读起来没意义） */
      throw new Error(withMsg(msg, '期望 ' + expected + '，实际 ' + checker.typeToString(ta)));
    }
    function eqType(name, expected, msg) { return eqTypeImpl(name, expected, msg, false); }
    function eqTypeExact(name, expected, msg) { return eqTypeImpl(name, expected, msg, true); }
    function assignImpl(name, expected, want, msg) {
      var ta = requireType(name), te = J.expectOf(expected);
      var ok = checker.isTypeAssignableTo(widen(J, ta, false), widen(J, te, false));
      if (ok === want) return true;
      throw new Error(withMsg(msg, '期望 ' + checker.typeToString(ta) + (want ? ' 能' : ' 不能') +
        '赋值给 ' + checker.typeToString(te) + '，实际情况相反'));
    }
    function assignableTo(name, expected, msg) { return assignImpl(name, expected, true, msg); }
    function notAssignableTo(name, expected, msg) { return assignImpl(name, expected, false, msg); }

    /* --- 运行（编译产物） --- */
    var logArr = [];
    var runP = null;
    function ensureRun() {
      if (!runP) {
        var js = J.jsText;
        if (hasModuleSyntax(js)) {
          runP = Promise.resolve({ logs: [], error: { name: 'ModuleError', message: '编译产物里有 import/export；运行时练习不能用模块语法。' } });
        } else if (typeof opts.exec !== 'function') {
          runP = Promise.resolve({ logs: [], error: { name: 'NoRunner', message: '这个环境没有接上运行器（node 侧校验请直接跑 tools/verify-types.mjs）。' } });
        } else {
          runP = Promise.resolve(opts.exec(js, opts.timeoutMs)).then(function (r) {
            return r || { logs: [], error: null };
          });
        }
      }
      return runP.then(function (r) {
        logArr.length = 0;
        if (r.logs) Array.prototype.push.apply(logArr, r.logs);
        ctxBox.lastRun = r;
        opts.ranOnce = true;
        return r;
      });
    }
    function run() { return ensureRun(); }
    function eqLogs(expected, msg) {
      if (!opts.ranOnce) throw new Error('比对输出之前要先 await run()（内容问题）');
      var got = logArr.map(String), want = expected.map(String);
      if (got.length === want.length && got.every(function (x, i) { return x === want[i]; })) return true;
      throw new Error(withMsg(msg, '期望输出 ' + JSON.stringify(want) + '，实际 ' + JSON.stringify(got)));
    }

    /* --- 编译产物本身（教「类型在运行时剩下什么」时要用） --- */
    function jsText() { return J.jsText == null ? '' : String(J.jsText); }
    function jsHas(sub, msg) {
      if (jsText().indexOf(String(sub)) >= 0) return true;
      throw new Error(withMsg(msg, '期望编译产物里有 ' + JSON.stringify(String(sub)) + '，实际产物是：\n' + jsText()));
    }
    function notJsHas(sub, msg) {
      if (jsText().indexOf(String(sub)) < 0) return true;
      throw new Error(withMsg(msg, '期望编译产物里不该出现 ' + JSON.stringify(String(sub)) + '，实际还有（产物里被它留下了）'));
    }

    /* --- 通用 --- */
    function eq(actual, expected, msg) {
      var a = fmt(actual, 0, false), b = fmt(expected, 0, false);
      if (a === b) return true;
      throw new Error(withMsg(msg, '期望 ' + b + '，实际 ' + a));
    }
    function ok(cond, msg) {
      if (cond) return true;
      throw new Error(msg || '条件为假（这里期望它为真）');
    }
    function near(a, b, tol, msg) {
      tol = tol == null ? 0.0001 : tol;
      if (Math.abs(a - b) <= tol) return true;
      throw new Error(withMsg(msg, '期望 ' + b + '（±' + tol + '），实际 ' + a));
    }

    ctxBox.values = [d, codes, noErrors, countErrors, hasError, notError, errorAt, noErrorAt,
      type, exists, memberNames, eqType, eqTypeExact, assignableTo, notAssignableTo,
      run, eqLogs, logArr, eq, ok, near, fmt, jsText, jsHas, notJsHas];
    ctxBox.logs = logArr;
    ctxBox.runFn = ensureRun;
    ctxBox.markRan = function () { opts.ranOnce = true; };
    return ctxBox;
  }

  var KEYS = ['d', 'codes', 'noErrors', 'countErrors', 'hasError', 'notError', 'errorAt', 'noErrorAt',
    'type', 'exists', 'memberNames', 'eqType', 'eqTypeExact', 'assignableTo', 'notAssignableTo',
    'run', 'eqLogs', 'logs', 'eq', 'ok', 'near', 'fmt', 'js', 'jsHas', 'notJsHas'];

  function compileTest(src) {
    /* eslint-disable-next-line no-new-func */
    var f = new Function(KEYS.join(', '), 'return (async function () {\n' + src + '\n}).call(this);');
    return function (ctx) { return f.apply(null, ctx.values); };
  }

  function label(src) { return String(src).replace(/\s+/g, ' ').trim().slice(0, 160); }

  /* ---------- 对外的 runCase ---------- */

  /**
   * runCase(code, { tests, tsconfig, exec, alwaysRun, onTest, timeoutMs })
   *   tests     : 断言字符串数组（可以为空 = 只看诊断与编译产物）
   *   exec      : function(jsText, timeoutMs) -> Promise<{logs, error}>；不给就只做类型判题
   *   alwaysRun : true = 不管有没有断言都先跑一遍产物（示例用来显示输出）
   * 返回 { results, diags, js, logs, error, durationMs, ok, failed }
   */
  function runCase(code, options) {
    options = options || {};
    var t0 = Date.now();
    return ready().then(function () {
      var tests = options.tests || [];
      var expects = collectExpects(tests);
      var J = analyze(code, { tsconfig: options.tsconfig, expects: expects });
      J.jsText = emitFromProgram(J.program, options.tsconfig);
      if (J.jsText === null || J.jsText === undefined) J.jsText = emitJs(code, options.tsconfig);

      var ctx = makeContext(J, {
        exec: options.exec || (root.TSLAB_SANDBOX && root.TSLAB_SANDBOX.run ? function (js, t) { return root.TSLAB_SANDBOX.run(js, t); } : null),
        timeoutMs: options.timeoutMs
      });

      var results = tests.map(function (t, i) { return { i: i, pass: null, label: label(t), message: '' }; });

      var chain = Promise.resolve();
      if (options.alwaysRun) {
        chain = chain.then(function () {
          return ctx.runFn().then(function () { ctx.markRan(); });
        });
      }
      tests.forEach(function (t, i) {
        chain = chain.then(function () {
          var p;
          try { p = compileTest(t)(ctx); } catch (e) { results[i].pass = false; results[i].message = String(e && e.message || e); return; }
          return Promise.resolve(p).then(function () {
            results[i].pass = true;
          }, function (e) {
            results[i].pass = false;
            results[i].message = String(e && e.message || e);
          });
        }).then(function () {
          if (options.onTest) options.onTest(results[i]);
        });
      });

      return chain.then(function () {
        var failed = results.filter(function (r) { return r.pass === false; }).length;
        return {
          results: results,
          diags: J.diags,
          js: J.jsText,
          logs: ctx.logs.slice(),
          ran: !!ctx.lastRun,
          runError: ctx.lastRun ? (ctx.lastRun.error || null) : null,
          error: null,
          ok: failed === 0 && results.length === tests.length,
          failed: failed,
          durationMs: Date.now() - t0
        };
      });
    }).then(null, function (e) {
      /* 内容写错（期望类型非法、tsconfig 选项非法…）也要以数据结构返回，不要变成未捕获的拒绝 */
      return {
        results: [], diags: [], js: '', logs: [],
        error: { name: (e && e.name) || 'Error', message: String((e && e.message) || e) },
        ok: false, failed: 0, durationMs: Date.now() - t0
      };
    });
  }

  root.TSLAB_JUDGE = {
    ready: ready,
    analyze: analyze,
    emitJs: emitJs,
    collectExpects: collectExpects,
    runCase: runCase,
    KEYS: KEYS,
    defaults: DEFAULTS,
    boolOpts: BOOL_OPTS,
    expectHelpers: EXPECT_HELPERS,
    libNames: function () { return LIBS ? Object.keys(LIBS) : []; },
    reset: function () { lastProgram = null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
