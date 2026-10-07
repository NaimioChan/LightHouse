/* 第 11 章 · strict 下的常见报错。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch11',
    title: '第 11 章 · strict 下的常见报错',
    goal: '看懂 strict 各子开关管的是什么，遇到 TS7006 / TS18048 / TS2564 / TS2322 这类报错时知道错在哪一行、该动哪一处。',
    sections: [
      { kind: 'prose', md: [
        '## `strict` 是一个开关，不是一层检查',
        '`tsconfig` 里写 `strict: true`（这个站默认就是开的），会一次性打开一整套子开关：`noImplicitAny`、`strictNullChecks`、',
        '`strictPropertyInitialization`、`strictFunctionTypes` 等等。它们各自管一摊，报的错码也不一样。',
        '',
        '把 `strict` 关掉，这些检查**全部失效**：代码能编过，运行时该崩还是崩。这一章逐个开关看——同一段代码，',
        '用 `{ strict: false }` 和默认各编一次，报错从无到有。有报错不是坏事，它指的就是运行时迟早要出的问题。'
      ].join('\n') },

      { kind: 'note', tone: 'tip', md: '读报错先抓三样：**错误码**（`TS7006`，稳定、能直接搜）、**行号**（往哪一行改）、**「期望 X，实际 Y」**。码后面缩进的几行是嵌套原因，别当成附带文字跳过。' },

      { kind: 'table', head: ['子开关', '管什么', '典型错误码'], rows: [
        ['`noImplicitAny`', '推不出类型又没写注解，就报错', '`TS7006`'],
        ['`strictNullChecks`', '`null` / `undefined` 不再混进其它类型', '`TS18048` / `TS2532`'],
        ['`strictPropertyInitialization`', '类字段必须有初始值', '`TS2564`'],
        ['`strictFunctionTypes`', '函数参数按逆变比较，更严', '`TS2322`'],
        ['`strict: false`', '上面这些一起关掉', '——']
      ] },

      { kind: 'prose', md: [
        '## `noImplicitAny`：没写注解又推不出来',
        '参数的注解可以省，前提是编译器能从上下文推出类型。推不出来又没写，它只能临时当作 `any`——这一步被 `noImplicitAny` 拦下来，报 `TS7006`。',
        '下面的 `double` 只在参数上加一个注解就能过。先看 `strict: false` 的样子。'
      ].join('\n') },

      { kind: 'demo', caption: 'strict: false —— 隐式 any 放行', tsconfig: { strict: false }, run: true, code: [
        'function double(n) {',
        '  return n * 2;',
        '}',
        '',
        'console.log(double(3));'
      ].join('\n'), checks: [
        'noErrors(\'strict:false 下 noImplicitAny 关掉了\')',
        'await run();',
        'eqLogs([\'6\'], \'能跑，但 n 其实没有类型\')'
      ] },

      { kind: 'demo', caption: '默认 strict —— 同一个函数报 TS7006', code: [
        'function double(n) {',
        '  return n * 2;',
        '}',
        '',
        'console.log(double(3));'
      ].join('\n'), checks: [
        'errorAt(1, 7006, \'第 1 行的参数 n 缺类型注解\')',
        'countErrors(1, \'这段代码只该有这一条错\')',
        'hasError(7006)'
      ] },

      { kind: 'exercise', id: 'ex11-1', title: '补上参数注解', task: [
        '`double` 的参数没有注解，`strict` 下报 `TS7006`。给参数补上正确的类型，让这段代码没有类型错误。',
        '',
        '要求：`double` 的类型是 `(n: number) => number`；没有类型错误；运行输出 `6`。'
      ].join('\n'), starter: [
        'function double(n) {',
        '  return n * 2;',
        '}',
        '',
        'console.log(double(3));'
      ].join('\n'), solution: [
        'function double(n: number) {',
        '  return n * 2;',
        '}',
        '',
        'console.log(double(3));'
      ].join('\n'), tests: [
        'eqType(\'double\', \'(n: number) => number\', \'double 的类型\')',
        'notError(7006, \'隐式 any 应该消失\')',
        'noErrorAt(1, \'参数注解补在声明这一行\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'6\'], \'运行输出\')'
      ], hints: [
        '`TS7006` 说的「隐式具有 any 类型」，就是参数没有注解、上下文也给不出类型。',
        '注解写在参数名后面：`function double(n: number)`。'
      ] },

      { kind: 'prose', md: [
        '## `strictNullChecks`：可能为 `undefined` 不能直接用',
        '这个开关打开时，`undefined` 与 `null` 是独立的类型，不会自动混进 `string`、`number`。',
        '一个类型是 `string | undefined` 的值，不先判断就点属性，会报 `TS18048`；判断过的那一支里它才被收窄成 `string`。',
        '关掉它，`string | undefined` 与 `string` 就没差别了，报错消失，风险留着。'
      ].join('\n') },

      { kind: 'demo', caption: 'strict: false —— 直接用可能为 undefined 的值', tsconfig: { strict: false }, code: [
        'function len(s: string | undefined): number {',
        '  return s.length;',
        '}'
      ].join('\n'), checks: [
        'noErrors(\'strict:false 下 strictNullChecks 关了\')',
        'eqType(\'len\', \'(s: string | undefined) => number\', \'签名没变，只是不检查了\')'
      ] },

      { kind: 'demo', caption: '默认 strict —— 同一行报 TS18048', code: [
        'function len(s: string | undefined): number {',
        '  return s.length;',
        '}'
      ].join('\n'), checks: [
        'errorAt(2, 18048, \'第 2 行直接用了可能为 undefined 的 s\')',
        'countErrors(1, \'只该有这一条\')',
        'hasError(18048)'
      ] },

      { kind: 'exercise', id: 'ex11-2', title: '先挡掉 undefined', task: [
        '`len` 接收 `string | undefined`，直接取 `length` 在 `strict` 下报 `TS18048`。',
        '改成：没有值时返回 `0`，有值时返回它的长度。',
        '',
        '要求：`len` 的类型仍是 `(s: string | undefined) => number`；没有类型错误；第 2 行不再报错。'
      ].join('\n'), starter: [
        'function len(s: string | undefined): number {',
        '  return s.length;',
        '}'
      ].join('\n'), solution: [
        'function len(s: string | undefined): number {',
        '  if (s === undefined) return 0;',
        '  return s.length;',
        '}'
      ].join('\n'), tests: [
        'eqType(\'len\', \'(s: string | undefined) => number\', \'len 的类型\')',
        'notError(18048, \'可能为 undefined 的报错应该消失\')',
        'noErrorAt(2, \'原来报错那一行现在要干净\')',
        'noErrors()'
      ], hints: [
        '先把「没有值」这一支处理掉并 `return`，后面的代码里编译器就知道 `s` 是 `string`。',
        '判断写 `s === undefined`（或 `!s`），不要把类型从签名里删掉。'
      ] },

      { kind: 'prose', md: [
        '## `strictPropertyInitialization`：类字段要有初始值',
        '类的字段声明了类型却没给初始值、构造函数里也没赋值，`strict` 下报 `TS2564`。',
        '它在提醒你：这个属性在运行时会是 `undefined`。给个默认值，或者在构造函数里明确赋值，两种都能修。'
      ].join('\n') },

      { kind: 'demo', caption: 'strict: false —— 字段可以先空着', tsconfig: { strict: false }, code: [
        'class Box {',
        '  size: number;',
        '}'
      ].join('\n'), checks: [
        'noErrors(\'strict:false 下不要求字段初始化\')',
        'exists(\'Box\', \'Box 还是声明出来了\')'
      ] },

      { kind: 'demo', caption: '默认 strict —— 同一个类报 TS2564', code: [
        'class Box {',
        '  size: number;',
        '}'
      ].join('\n'), checks: [
        'errorAt(2, 2564, \'第 2 行的字段没有初始化\')',
        'countErrors(1, \'只该有这一条\')',
        'hasError(2564)'
      ] },

      { kind: 'exercise', id: 'ex11-3', title: '给字段一个初始值', task: [
        '`Counter` 的 `count` 字段没有初始值，`strict` 下报 `TS2564`。在**不删字段声明**的前提下让它过编译。',
        '',
        '要求：`count` 仍是 `Counter` 的字段；没有类型错误；第 2 行不再报错。'
      ].join('\n'), starter: [
        'class Counter {',
        '  count: number;',
        '  inc(): void {',
        '    this.count = this.count + 1;',
        '  }',
        '}'
      ].join('\n'), solution: [
        'class Counter {',
        '  count = 0;',
        '  inc(): void {',
        '    this.count = this.count + 1;',
        '  }',
        '}'
      ].join('\n'), tests: [
        'notError(2564, \'字段初始化报错应该消失\')',
        'noErrorAt(2, \'字段声明这一行要干净\')',
        'noErrors()',
        'exists(\'Counter\')',
        'eq(memberNames(\'Counter\'), [\'count\', \'inc\'], \'count 仍是字段\')'
      ], hints: [
        '`TS2564` 说这个属性「没有初始化表达式，且未在构造函数中明确赋值」。这里没有构造函数。',
        '在字段名后面直接写 `= 0`，类型交给推断，声明里的 `: number` 可以留着也可以去掉。'
      ] },

      { kind: 'prose', md: [
        '## `strictFunctionTypes`：函数参数按逆变比',
        '函数类型之间的兼容，`strict` 下比 `strict: false` 更严。要看方向：把一个「只收窄参数」的函数赋给一个「承诺收宽参数」的类型时，',
        '接进来的值可能不满足窄参数的要求，编译器就报 `TS2322`。',
        '',
        '下面 `Sink` 承诺能接收任意 `Wide`，而赋给它的函数只接受更窄的 `Narrow`——`Wide` 里没有 `c`，方向不对。'
      ].join('\n') },

      { kind: 'demo', caption: 'strict: false —— 参数按双变比较，放行', tsconfig: { strict: false }, code: [
        'type Wide = { a: number; b: string };',
        'type Narrow = { a: number; b: string; c: boolean };',
        '',
        'type Sink = (x: Wide) => void;',
        'const sink: Sink = (x: Narrow): void => {',
        '  console.log(x.c);',
        '};'
      ].join('\n'), checks: [
        'noErrors(\'strictFunctionTypes 关掉后不报\')',
        'eqType(\'sink\', \'(x: { a: number; b: string }) => void\', \'sink 的类型\')'
      ] },

      { kind: 'demo', caption: '默认 strict —— 同一个赋值报 TS2322', code: [
        'type Wide = { a: number; b: string };',
        'type Narrow = { a: number; b: string; c: boolean };',
        '',
        'type Sink = (x: Wide) => void;',
        'const sink: Sink = (x: Narrow): void => {',
        '  console.log(x.c);',
        '};'
      ].join('\n'), checks: [
        'errorAt(5, 2322, \'第 5 行的实参类型比承诺的窄\')',
        'countErrors(1, \'只该有这一条\')',
        'hasError(2322)'
      ] },

      { kind: 'exercise', id: 'ex11-4', title: '把参数方向摆正', task: [
        '`Sink` 承诺能接收任意 `Wide`，但赋给它的函数只接受更窄的 `Narrow`，`strict` 下报 `TS2322`。',
        '把函数参数的类型改成和 `Sink` 一致，让它真的能接住任何 `Wide`。',
        '',
        '要求：`sink` 的类型是 `(x: { a: number; b: string }) => void`；没有类型错误；运行输出 `true`。'
      ].join('\n'), starter: [
        'type Wide = { a: number; b: string };',
        'type Narrow = { a: number; b: string; c: boolean };',
        '',
        'type Sink = (x: Wide) => void;',
        'const sink: Sink = (x: Narrow): void => {',
        '  console.log(x.c);',
        '};',
        '',
        'const sample: Narrow = { a: 1, b: \'x\', c: true };',
        'console.log(sample.c);'
      ].join('\n'), solution: [
        'type Wide = { a: number; b: string };',
        'type Narrow = { a: number; b: string; c: boolean };',
        '',
        'type Sink = (x: Wide) => void;',
        'const sink: Sink = (x: Wide): void => {',
        '  console.log(x.b);',
        '};',
        '',
        'const sample: Narrow = { a: 1, b: \'x\', c: true };',
        'console.log(sample.c);'
      ].join('\n'), tests: [
        'eqType(\'sink\', \'(x: { a: number; b: string }) => void\', \'sink 的类型\')',
        'notError(2322, \'方向不对的报错应该消失\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'true\'], \'运行输出\')'
      ], hints: [
        '报错说「参数不兼容」，问题在函数参数比 `Sink` 承诺的更窄：`Narrow` 有 `c`，`Wide` 没有。',
        '把参数改成 `Wide`，函数体里就只能访问 `Wide` 有的字段（`a`、`b`）。'
      ] },

      { kind: 'prose', md: [
        '## 另外两类高分错误码',
        '还有两种报错跟严格程度关系不大，但一样常遇到：',
        '',
        '- `TS2554`：实参个数对不上。函数要两个参数，调用只给了一个。',
        '- `TS2339`：属性不存在。类型上没有这个字段，多半是名字写错或类型写窄了。',
        '',
        '它们的修法都在调用点或访问点，编译器会把「期望几个」「有没有这个属性」直接写进报错里。'
      ].join('\n') },

      { kind: 'exercise', id: 'ex11-5', title: '参数个数对不上', task: [
        '`area` 需要两个参数，调用时只给了一个，报 `TS2554`。把调用补全。',
        '',
        '要求：没有类型错误；第 4 行不再报错；运行输出 `12`。'
      ].join('\n'), starter: [
        'function area(w: number, h: number): number {',
        '  return w * h;',
        '}',
        '',
        'console.log(area(3));'
      ].join('\n'), solution: [
        'function area(w: number, h: number): number {',
        '  return w * h;',
        '}',
        '',
        'console.log(area(3, 4));'
      ].join('\n'), tests: [
        'notError(2554, \'实参个数应该对上\')',
        'noErrorAt(5, \'调用这一行要干净\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'12\'], \'运行输出\')'
      ], hints: [
        '`TS2554` 的报错里会写清楚「应有 2 个参数，但获得 1 个」。',
        '`area` 算的是宽乘高，缺的是高。'
      ] },

      { kind: 'exercise', id: 'ex11-6', title: '属性不存在', task: [
        '`Point` 只有 `x`、`y` 两个字段，代码却去读 `p.z`，报 `TS2339`。改成读一个存在的字段。',
        '',
        '要求：没有类型错误；第 3 行不再报错；运行输出 `1`。'
      ].join('\n'), starter: [
        'type Point = { x: number; y: number };',
        'const p: Point = { x: 1, y: 2 };',
        'console.log(p.z);'
      ].join('\n'), solution: [
        'type Point = { x: number; y: number };',
        'const p: Point = { x: 1, y: 2 };',
        'console.log(p.x);'
      ].join('\n'), tests: [
        'notError(2339, \'不存在的属性报错应该消失\')',
        'noErrorAt(3, \'访问这一行要干净\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'1\'], \'运行输出\')'
      ], hints: [
        '`TS2339` 会直接写「类型 X 上不存在属性 z」。',
        '`Point` 上能读的只有 `x` 和 `y`；要打印 `x` 的值，输出就是 `1`。'
      ] },

      { kind: 'prose', md: [
        '## 这一章的手感',
        '`strict` 关掉能让报错消失，但问题没解决，只是推迟到运行时。遇到报错先看错误码和行号，',
        '再读「期望 / 实际」弄清两边的类型差在哪：`TS7006` 补注解，`TS18048` 先判 `undefined`，',
        '`TS2564` 给字段初始值，`TS2322` 检查赋值或参数方向，`TS2554`、`TS2339` 回到调用点改。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
