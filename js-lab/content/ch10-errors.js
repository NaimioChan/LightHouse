(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch10',
    title: '第 10 章 · 错误处理与调试',
    goal: '出错时不让程序崩在半路：会抛、会接、会区分错误类型，也知道怎么找到出错的那一行。',
    sections: [
      {
        kind: 'prose',
        md: [
          '`throw` 抛出错误，`try` 包住可能出错的代码，`catch` 接住它，`finally` 无论如何都执行（用来收尾：关连接、清状态）。',
          '',
          '抛出的应该是一个 `Error` 实例：`throw new Error("说明")`。抛字符串会丢掉堆栈，调试时寸步难行。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'try / catch / finally 的执行顺序',
        code: [
          'function risky(n) {',
          '  try {',
          '    if (n < 0) throw new Error("不能是负数");',
          '    console.log("正常路径");',
          '    return "ok";',
          '  } catch (e) {',
          '    console.log("接住了:", e.message);',
          '    return "fallback";',
          '  } finally {',
          '    console.log("finally 一定会跑");',
          '  }',
          '}',
          '',
          'console.log(risky(1));',
          'console.log(risky(-1));',
          'try {',
          '  null.x;                       // 谁也没接，程序在这里就结束了',
          '} catch (e) {',
          '  console.log(e.name, "|", e.message.length > 0);',
          '}'
        ].join('\n'),
        expect: '正常路径\nfinally 一定会跑\nok\n接住了: 不能是负数\nfinally 一定会跑\nfallback\nTypeError | true'
      },
      {
        kind: 'prose',
        md: [
          '自定义错误类让你能**按类型分别处理**：继承 `Error`，在构造函数里设置 `name`，再把业务字段挂上去。',
          '',
          '判断类型用 `instanceof`（不是比较 `message` 文本——文案一改就崩）。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '自定义错误',
        code: [
          'class ValidationError extends Error {',
          '  constructor(field) {',
          '    super(`字段 ${field} 不合法`);',
          '    this.name = "ValidationError";',
          '    this.field = field;',
          '  }',
          '}',
          '',
          'function check(age) {',
          '  if (typeof age !== "number") throw new ValidationError("age");',
          '  return age;',
          '}',
          '',
          'try {',
          '  check("十八");',
          '} catch (e) {',
          '  if (e instanceof ValidationError) console.log("校验失败，问题字段:", e.field);',
          '  else throw e;                 // 不认识的错误继续往上抛',
          '}'
        ].join('\n'),
        expect: '校验失败，问题字段: age'
      },
      {
        kind: 'table',
        head: ['错误类型', '常见触发', '怎么办'],
        rows: [
          ['TypeError', '读 undefined / null 的属性，调用了不是函数的东西', '先检查值是否存在，用 ?. 或提前 return'],
          ['ReferenceError', '用了没声明的变量', '拼写？作用域？有没有先声明'],
          ['RangeError', '数组长度给负数、递归太深', '检查参数范围'],
          ['SyntaxError', '代码写坏了（括号、引号不配对）', '看报错指的行号，通常问题在上一行末尾'],
          ['自定义 Error', '业务规则', '按 instanceof 分别处理']
        ]
      },
      {
        kind: 'prose',
        md: [
          '调试图省事，手段有三层：',
          '',
          '1. `console.log` 打出关键中间值——本站的控制台就是干这个的。',
          '2. `console.table(数组)` 看结构化数据，`console.time` / `timeEnd` 量耗时。',
          '3. 浏览器里给某行加断点，或用 `debugger` 语句，逐行看变量怎么变。',
          '',
          '读报错的三步：**看错误类型 → 看消息里的具体值 → 看堆栈第一行的文件与行号**。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'console 家族',
        code: [
          'console.log("普通信息", 1, true);',
          'console.warn("警告");',
          'console.error("错误信息");',
          'console.log([{ name: "a", n: 1 }, { name: "b", n: 2 }]);'
        ].join('\n'),
        expect: '普通信息 1 true\n警告\n错误信息\n[ { name: \'a\', n: 1 }, { name: \'b\', n: 2 } ]'
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`catch (e) {}` 里什么都不做叫「吞异常」——出问题时你连日志都没有。至少要 `console.error(e)`，或者明确注释为什么可以忽略。'
      },
      {
        kind: 'exercise',
        id: 'ex10-1',
        title: '除法卫士',
        task: [
          '补完 `safeDivide(a, b)`：`b` 为 0 时 `throw new Error("不能除以 0")`，否则返回 `a / b`。'
        ].join('\n'),
        starter: [
          'function safeDivide(a, b) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function safeDivide(a, b) {',
          '  if (b === 0) throw new Error("不能除以 0");',
          '  return a / b;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(safeDivide(6, 3), 2);",
          "eq(throws(() => safeDivide(1, 0)).message, '不能除以 0');",
          "ok(throws(() => safeDivide(1, 0)) instanceof Error, '要抛 Error 实例，不要抛字符串');"
        ],
        hints: [
          '`throws(fn)` 断言会返回接到的那个错误，所以可以接着读 `.message`。',
          '注意 `-0` 也是 0，用 `b === 0` 就够了。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-2',
        title: '按类型抛不同的错',
        task: [
          '补完 `requirePositive(n)`：不是数字时 `throw new TypeError("需要数字")`；小于等于 0 时 `throw new RangeError("需要正数")`；否则返回 `n`。'
        ].join('\n'),
        starter: [
          'function requirePositive(n) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function requirePositive(n) {',
          '  if (typeof n !== "number" || Number.isNaN(n)) throw new TypeError("需要数字");',
          '  if (n <= 0) throw new RangeError("需要正数");',
          '  return n;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(requirePositive(3), 3);",
          "eq(throws(() => requirePositive('3')).name, 'TypeError');",
          "eq(throws(() => requirePositive(-1)).name, 'RangeError');",
          "eq(throws(() => requirePositive(0)).name, 'RangeError', '0 也不算正数');"
        ],
        hints: [
          '两个分支的顺序有讲究：先判断类型，再判断范围。',
          '`typeof NaN` 是 `"number"`，所以 NaN 要单独拦一下，否则它会走到范围判断里。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-3',
        title: '失败就给兜底',
        task: [
          '补完 `tryOr(fn, fallback)`：调用 `fn()` 并返回结果；如果它抛错，返回 `fallback`。',
          '',
          '注意 `fallback` 是 `0` 或 `""` 时也要原样返回。'
        ].join('\n'),
        starter: [
          'function tryOr(fn, fallback) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function tryOr(fn, fallback) {',
          '  try {',
          '    return fn();',
          '  } catch (e) {',
          '    return fallback;',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(tryOr(() => 1, 'x'), 1);",
          "eq(tryOr(() => { throw new Error('boom'); }, 'x'), 'x');",
          "eq(tryOr(() => { throw new Error('boom'); }, 0), 0, '兜底值是 0 也要原样返回');",
          "eq(tryOr(() => { throw new Error('boom'); }, undefined), undefined);"
        ],
        hints: [
          'try 里 `return fn()`，catch 里 `return fallback`。',
          '别在 catch 里判断 fallback 真假——`0` 是合法兜底值。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-4',
        title: '自定义校验错误',
        task: [
          '补完 `ValidationError` 类：接收字段名 `field`，`message` 是 `字段 xxx 不合法`，`name` 是 `ValidationError`，并把字段名存到 `this.field`。',
          '',
          '它必须也是 `Error` 的实例。'
        ].join('\n'),
        starter: [
          'class ValidationError extends Error {',
          '  constructor(field) {',
          '    // 你的代码',
          '  }',
          '}',
          ''
        ].join('\n'),
        solution: [
          'class ValidationError extends Error {',
          '  constructor(field) {',
          '    super(`字段 ${field} 不合法`);',
          '    this.name = "ValidationError";',
          '    this.field = field;',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { const e = new ValidationError('age'); eq(e.message, '字段 age 不合法'); eq(e.name, 'ValidationError'); eq(e.field, 'age'); })();",
          "ok(new ValidationError('x') instanceof Error, '自定义错误也要是 Error 的实例');",
          "(() => { const e = throws(() => { throw new ValidationError('name'); }); ok(e instanceof ValidationError, '抛出来还能用 instanceof 认出来'); })();"
        ],
        hints: [
          '构造函数第一句是 `super(...)`，把 message 交给父类。',
          '`name` 默认是 `"Error"`，要手动改成自己的名字，否则日志里认不出来。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
