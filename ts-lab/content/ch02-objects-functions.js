/* 第 2 章 · 对象与函数类型。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch02',
    title: '第 2 章 · 对象与函数类型',
    goal: '能给对象和函数写出类型：可选与只读属性、函数参数与返回值、void 与 never，并看懂多余属性检查为什么时松时紧。',
    sections: [
      { kind: 'prose', md: [
        '上一章的类型都是单个值：`string`、`number`。现实里的数据大多是**一坨**——一个对象有若干个字段，一个函数要接几个参数、吐一个结果。',
        '这一章给这两种东西写类型。',
        '',
        '## 对象类型字面量',
        '对象类型用一个花括号把属性列出来，每项写 `属性名: 类型`，项之间用 `;` 或 `,` 隔开。',
        '`type Point = { x: number; y: number };` 定义的就是「有一个 `number` 的 `x`、一个 `number` 的 `y`」这样一个形状。',
        '任何满足这个形状的值都能赋给它：属性名必须对得上，每个属性的类型也必须对得上。'
      ].join('\n') },

      { kind: 'demo', caption: '对象类型描述形状', code: [
        'type Point = { x: number; y: number };',
        '',
        'const p: Point = { x: 3, y: 4 };',
        '',
        'function dist(a: Point): number {',
        '  return Math.abs(a.x - a.y);',
        '}'
      ].join('\n'), checks: [
        'eqType(\'Point\', \'{ x: number; y: number }\', \'Point 的类型\')',
        'eqType(\'p\', \'{ x: number; y: number }\', \'p 的类型\')',
        'eqType(\'dist\', \'(a: Point) => number\', \'dist 的类型\')',
        'eq(memberNames(\'p\'), [\'x\', \'y\'], \'p 的属性名\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 可选属性与只读属性',
        '属性名后面加 `?`，表示这个属性**可以没有**：`type User = { name: string; age?: number };`。',
        '有了 `?`，`{ name: \'ley\' }` 和 `{ name: \'ley\', age: 30 }` 都合法。',
        '',
        '读一个可选属性时，类型里会自动多出一个 `| undefined`：`u.age` 的类型是 `number | undefined`，',
        '意思是「这里也可能是 `undefined`」。要用它之前得先判断——判断的写法在下一章。',
        '',
        '属性名前面加 `readonly`，表示这个属性**只能读、不能改**。给它赋值会报 `TS2540`。',
        '`readonly` 只在编译期管用，运行时那个字段照样能被改——它是一句「别动这个字段」的声明，不是运行时的锁。'
      ].join('\n') },

      { kind: 'demo', caption: '可选属性读出来带 undefined，只读属性拒绝赋值', code: [
        'type User = { name: string; readonly id: number; age?: number };',
        '',
        'const u: User = { name: \'ley\', id: 7 };',
        'const years = u.age;   // number | undefined',
        '',
        'u.id = 8;              // ✗ TS2540：id 是只读属性',
        '',
        'const anon: User = { name: \'bo\', id: 9 };   // age 整条可以省掉'
      ].join('\n'), checks: [
        'eqType(\'years\', \'number | undefined\', \'可选属性读出来带上 undefined\')',
        'eq(memberNames(\'u\'), [\'age\', \'id\', \'name\'], \'u 的属性名\')',
        'hasError(2540, \'给只读属性赋值要报错\')',
        'errorAt(6, 2540, \'报错落在赋值那一行\')'
      ] },

      { kind: 'table', head: ['写法', '含义', '越界的后果'], rows: [
        ['`x: number`', '必须有，类型是 `number`', '少了报 `TS2741`，类型不对报 `TS2322`'],
        ['`x?: number`', '可以有也可以没有', '读出来是 `number | undefined`'],
        ['`readonly x: number`', '能读不能写', '赋值报 `TS2540`']
      ] },

      { kind: 'prose', md: [
        '## 多余属性检查',
        '把对象字面量**直接**写进一个带类型的位置——赋给标注了类型的变量、或者当成实参传进去——编译器会多做一步检查：',
        '字面量里出现了目标类型没定义的属性，就报 `TS2353`。',
        '',
        '这条检查只在「字面量当场出现在那里」时生效。先把同一个对象存进一个变量，再把变量传过去，就不报了：',
        '那一刻编译器比的是两个已经定好型的形状，多出来的字段被结构类型忽略了。',
        '',
        '这是 TS 特有的一条时松时紧的规则，专门抓拼错字段名、或者旧字段没删干净的情况。'
      ].join('\n') },

      { kind: 'demo', caption: '直接传字面量会被拦，先存变量就放行', code: [
        'type Point = { x: number; y: number };',
        '',
        'function draw(p: Point): number { return p.x + p.y; }',
        '',
        'draw({ x: 1, y: 2, z: 3 });          // ✗ TS2353：z 不在 Point 里',
        '',
        'const raw = { x: 1, y: 2, z: 3 };   // 先存进一个变量',
        'draw(raw);                           // ✓ 多余的 z 被忽略了'
      ].join('\n'), checks: [
        'hasError(2353, \'多余的属性要报错\')',
        'countErrors(1, \'只报一处\')',
        'errorAt(5, 2353, \'报在直接传字面量的那一行\')',
        'noErrorAt(8, \'先存变量再传的那一行不报\')'
      ] },

      { kind: 'note', tone: 'warn', md: '`TS2353` 不是「类型不兼容」，而是「字面量里多了字段」。同一个对象，直接传报错、经变量传不报错——判断是否触发，看的是它出现的位置，不是它本身。' },

      { kind: 'prose', md: [
        '## 函数参数与返回值',
        '参数写在括号里，每个写成 `名字: 类型`；返回值类型写在参数列表后面、函数体前面：',
        '`function add(a: number, b: number): number { return a + b; }`。箭头函数同理：',
        '`const mul = (a: number, b: number): number => a * b;`。',
        '',
        '函数整体也能当成一个类型来用，写法是 `(参数) => 返回值`：`(a: number, b: number) => number`。',
        '对象里描述一个方法，可以写成简写 `{ add(a: number, b: number): number }`，',
        '它和写成属性 `add: (a: number, b: number) => number` 是一回事。'
      ].join('\n') },

      { kind: 'demo', caption: '函数类型：注解、箭头、对象里的方法简写', code: [
        'function add(a: number, b: number): number { return a + b; }',
        'const mul = (a: number, b: number): number => a * b;',
        '',
        'const calc: { add(a: number, b: number): number } = {',
        '  add(a, b) { return a + b; }',
        '};'
      ].join('\n'), checks: [
        'eqType(\'add\', \'(a: number, b: number) => number\', \'add 的类型\')',
        'eqType(\'mul\', \'(a: number, b: number) => number\', \'mul 的类型\')',
        'eqType(\'calc.add\', \'(a: number, b: number) => number\', \'方法简写的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## void、never 与可选参数',
        '`void` 表示函数**没有返回值**——它做事，但不产出值。`never` 表示函数**永远不返回**——',
        '要么抛错，要么永远循环，调用它的下一行根本执行不到。两者是一对反义词，不能混用。',
        '',
        '参数名后面加 `?` 就是可选参数，调用时可以不传：`function opt(name: string, age?: number)`。',
        '给参数写默认值也会让它变成可选：`function greet(name: string, greeting = \'hi\')`——',
        '不传第二个实参时 `greeting` 就是 `\'hi\'`，整个参数的类型是 `greeting?: string`。',
        '可选参数要排在必填参数后面。'
      ].join('\n') },

      { kind: 'demo', caption: 'void 是没有值，never 是回不来；可选参数与默认参数', code: [
        'function logIt(msg: string): void {',
        '  console.log(msg);',
        '}',
        '',
        'function fail(msg: string): never {',
        '  throw new Error(msg);',
        '}',
        '',
        'function greet(name: string, greeting = \'hi\'): string {',
        '  return greeting + \', \' + name;',
        '}',
        '',
        'logIt(greet(\'ley\'));'
      ].join('\n'), run: true, checks: [
        'eqType(\'logIt\', \'(msg: string) => void\', \'void 函数\')',
        'eqType(\'fail\', \'(msg: string) => never\', \'never 函数\')',
        'eqType(\'greet\', \'(name: string, greeting?: string) => string\', \'默认参数让参数变可选\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'hi, ley\'], \'运行输出\')'
      ] },

      { kind: 'exercise', id: 'ex02-1', title: '给对象补可选与只读', task: [
        '`User` 现在有毛病：`age` 是必填的，而 `id` 又能被随便改。改成：',
        '',
        '- `age` 是可选属性，`number` 类型',
        '- `id` 是只读属性，`number` 类型',
        '',
        '改完以后，最后那行给 `u.id` 赋值应该被编译器拦下（`TS2540`），其它地方不报错。'
      ].join('\n'), starter: [
        'type User = { name: string; id: number; age: number };',
        '',
        'const u: User = { name: \'ley\', id: 1 };',
        '',
        'u.id = 2;'
      ].join('\n'), solution: [
        'type User = { name: string; readonly id: number; age?: number };',
        '',
        'const u: User = { name: \'ley\', id: 1 };',
        '',
        'u.id = 2;'
      ].join('\n'), tests: [
        'eqType(\'User\', \'{ name: string; readonly id: number; age?: number }\', \'User 的类型\')',
        'hasError(2540, \'给只读属性赋值要报错\')',
        'errorAt(5, 2540, \'报在赋值那一行\')'
      ], hints: [
        '可选属性在名字后面加 `?`：`age?: number`。',
        '只读属性在名字前面加 `readonly`：`readonly id: number`。'
      ] },

      { kind: 'exercise', id: 'ex02-2', title: '修掉多余属性报错', task: [
        '`connect` 只认 `host` 和 `port`，但调用时多传了一个 `user`，编译器报了 `TS2353`。',
        '',
        '`user` 确实是配置的一部分，只是 `Config` 漏掉了它。把 `Config` 补成可选属性 `user?: string`，',
        '让这个调用合法。要求：没有类型错误，`Config` 依然是 `host`、`port` 必填，`user` 可选。'
      ].join('\n'), starter: [
        'type Config = { host: string; port: number };',
        '',
        'function connect(cfg: Config): string {',
        '  return cfg.host + \':\' + cfg.port;',
        '}',
        '',
        'connect({ host: \'db\', port: 5432, user: \'root\' });'
      ].join('\n'), solution: [
        'type Config = { host: string; port: number; user?: string };',
        '',
        'function connect(cfg: Config): string {',
        '  return cfg.host + \':\' + cfg.port;',
        '}',
        '',
        'connect({ host: \'db\', port: 5432, user: \'root\' });'
      ].join('\n'), tests: [
        'noErrors(\'补上可选属性后不该再有 TS2353\')',
        'eqType(\'Config\', \'{ host: string; port: number; user?: string }\', \'Config 的类型\')',
        'eqType(\'connect\', \'(cfg: Config) => string\', \'connect 的类型\')'
      ], hints: [
        '报错说 `user` 不在 `Config` 里——先想清楚 `user` 该是必填还是可选。',
        '可选属性写成 `user?: string`，加在 `port` 后面。'
      ] },

      { kind: 'exercise', id: 'ex02-3', title: '只打印，不返回值', task: [
        '`announce` 现在把拼好的字符串 `return` 出去了，但它只该打印、不该有返回值。',
        '',
        '改成返回类型是 `void` 的函数。要求：`announce` 的类型是 `(msg: string) => void`，',
        '运行只打印一行 `hello!`，没有类型错误。'
      ].join('\n'), starter: [
        'function announce(msg: string) {',
        '  const line = msg + \'!\';',
        '  console.log(line);',
        '  return line;',
        '}',
        '',
        'announce(\'hello\');'
      ].join('\n'), solution: [
        'function announce(msg: string): void {',
        '  console.log(msg + \'!\');',
        '}',
        '',
        'announce(\'hello\');'
      ].join('\n'), tests: [
        'eqType(\'announce\', \'(msg: string) => void\', \'announce 该返回 void\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'hello!\'], \'运行输出\')'
      ], hints: [
        '返回值类型写在参数列表之后、`{` 之前：`function announce(msg: string): void`。',
        '返回类型是 `void` 的函数不该写 `return 值;`——只留下打印那一句就行。'
      ] },

      { kind: 'exercise', id: 'ex02-4', title: '补参数与返回值类型', task: [
        '`area` 两个参数都没有类型，返回值也没标注。补成：',
        '',
        '- 参数 `w`、`h` 都是 `number`',
        '- 返回值是 `number`',
        '',
        '函数体不要动。'
      ].join('\n'), starter: [
        'function area(w, h) {',
        '  return w * h;',
        '}'
      ].join('\n'), solution: [
        'function area(w: number, h: number): number {',
        '  return w * h;',
        '}'
      ].join('\n'), tests: [
        'eqType(\'area\', \'(w: number, h: number) => number\', \'area 的类型\')',
        'noErrors(\'补完注解参数就不再隐式是 any\')'
      ], hints: [
        '每个参数写成 `名字: 类型`，用逗号隔开。',
        '返回值类型写在 `)` 和 `{` 之间：`: number`。'
      ] },

      { kind: 'exercise', id: 'ex02-5', title: '给参数一个默认值', task: [
        '`greet` 的第二个参数是必填的，可调用时只传了名字，报了 `TS2554`。',
        '',
        '给 `greeting` 一个默认值 `\'hi\'`，这样不传它也能调用，类型上它变成可选。',
        '要求：`greet` 的类型是 `(name: string, greeting?: string) => string`，运行输出是 `hi, ley`。'
      ].join('\n'), starter: [
        'function greet(name: string, greeting: string): string {',
        '  return greeting + \', \' + name;',
        '}',
        '',
        'console.log(greet(\'ley\'));'
      ].join('\n'), solution: [
        'function greet(name: string, greeting = \'hi\'): string {',
        '  return greeting + \', \' + name;',
        '}',
        '',
        'console.log(greet(\'ley\'));'
      ].join('\n'), tests: [
        'eqType(\'greet\', \'(name: string, greeting?: string) => string\', \'默认参数让 greeting 可选\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'hi, ley\'], \'运行输出\')'
      ], hints: [
        '默认值写在参数后面：`greeting = \'hi\'`，这时不用再写 `: string` 注解。',
        '有默认值的参数等于可选参数，调用时可以整个省掉。'
      ] },

      { kind: 'prose', md: [
        '对象类型描述形状，函数类型描述「吃什么、吐什么」。',
        '可选属性读出来带上 `| undefined`，`readonly` 拦住赋值；多余属性检查只在字面量当场出现时动手，先存变量就能绕开。',
        '函数那头，参数和返回值各标一处，`void` 是没有产出，`never` 是回不来，默认值和 `?` 都能让参数变成可选。',
        '下一章把这些形状拆成具体分支，教编译器怎么在分支里收窄类型。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
