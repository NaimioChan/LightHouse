/* 第 9 章 · 类型守卫与断言。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch09',
    title: '第 9 章 · 类型守卫与断言',
    goal: '会写类型谓词与断言函数把 unknown 收窄到具体类型，知道 as 与 ! 关掉了哪些检查，会用 satisfies 在保留推断类型的前提下做校验。',
    sections: [
      { kind: 'prose', md: [
        '## 外部数据先当 `unknown`',
        '从外面进来的值——接口返回、`JSON.parse` 的结果、别处传来的参数——编译器不知道它的形状。按第 1 章的做法先标成 `unknown`。可 `unknown` 用起来处处受限：不能点属性，也不能直接传给要求具体类型的函数。',
        '',
        '处理它固定三步：',
        '',
        '1. 收下时标成 `unknown`',
        '2. 用判断把形状确认下来',
        '3. 确认之后，在那一支里当成具体类型用',
        '',
        '`typeof`、`in` 这些内建判断能收窄一部分情况。条件复杂一点（比如「这个对象是不是我要的那一个」），就得自己写判断函数。这一章讲这些判断怎么写，以及写错会怎样。'
      ].join('\n') },

      { kind: 'demo', caption: '自己写一个类型谓词', code: [
        'type User = { name: string; age: number };',
        '',
        'function isUser(x: unknown): x is User {',
        '  if (typeof x !== \'object\' || x === null) return false;',
        '  return \'name\' in x && \'age\' in x',
        '    && typeof x.name === \'string\' && typeof x.age === \'number\';',
        '}',
        '',
        'const raw: unknown = { name: \'blue\', age: 3 };',
        'if (isUser(raw)) {',
        '  console.log(raw.name, raw.age);     // 这一支里 raw 已经是 User',
        '}'
      ].join('\n'), run: true, checks: [
        'eqType(\'isUser\', \'(x: unknown) => x is { name: string; age: number }\', \'isUser 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'blue 3\'], \'判断为真才进得来\')'
      ] },

      { kind: 'prose', md: [
        '## `x is T`：给判断函数盖章',
        '`isUser` 的返回类型写的是 `x is User`，这种写法叫**类型谓词**。它把一件事告诉编译器：这个函数返回 `true` 时，参数 `x` 就是 `User`。',
        '',
        '- 运行时它就是个普通函数，老老实实返回 `true` 或 `false`',
        '- `x is T` 本身不做任何检查，它只是一句**声明**。判断写漏了、类型写错了，编译器照样接受',
        '- 参数名要和函数第一个参数同名：写 `x is User`，不是 `y is User`'
      ].join('\n') },

      { kind: 'demo', caption: '谓词交给 filter，元素类型跟着收窄', code: [
        'function isString(x: unknown): x is string {',
        '  return typeof x === \'string\';',
        '}',
        '',
        'const mixed: unknown[] = [\'a\', 1, \'b\', true];',
        'const words = mixed.filter(isString);   // string[]',
        '',
        'console.log(words.join(\',\'));'
      ].join('\n'), run: true, checks: [
        'eqType(\'words\', \'string[]\', \'filter 用谓词过滤后元素类型变窄\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'a,b\'], \'运行输出\')'
      ] },

      { kind: 'note', tone: 'warn', md: '谓词是在向编译器担保。判断条件和 `x is T` 里的 `T` 对不上，编译器发现不了——错误拖到运行时。写谓词时，条件要真能排除掉不属于 `T` 的值。' },

      { kind: 'prose', md: [
        '## `asserts x is T`：不满足就抛错',
        '有些检查更适合「不合规就当场抛」，省得每个调用点都写一遍 `if`。把返回类型写成 `asserts x is T`，这个函数就成了**断言函数**：调用它之后，编译器认定参数是 `T`；不满足的情况由函数体自己 `throw`。',
        '',
        '返回类型里的 `asserts …` 必须显式写出来。如果断言函数存在一个**没有类型注解的变量**里（例如箭头函数直接赋给 `const`），调用处会报 `TS2775`。用 `function` 声明最省事。'
      ].join('\n') },

      { kind: 'demo', caption: '断言函数：过了就继续，不过就抛', code: [
        'type User = { name: string };',
        '',
        'function assertUser(x: unknown): asserts x is User {',
        '  if (typeof x !== \'object\' || x === null || !(\'name\' in x) || typeof x.name !== \'string\') {',
        '    throw new Error(\'不是 User\');',
        '  }',
        '}',
        '',
        'const raw: unknown = { name: \'blue\' };',
        'assertUser(raw);',
        'console.log(raw.name.toUpperCase());   // 这里 raw 已经是 User'
      ].join('\n'), run: true, checks: [
        'eqType(\'assertUser\', \'(x: unknown) => asserts x is { name: string }\', \'assertUser 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'BLUE\'], \'断言通过后正常往下走\')'
      ] },

      { kind: 'prose', md: [
        '## `as` 与 `!`：让编译器闭嘴，但不做检查',
        '`值 as T` 是**类型断言**：直接告诉编译器「把这个值当成 `T`」，合不合规都不管。`值!` 是**非空断言**：把 `null` 和 `undefined` 从类型里去掉，其余部分不变。',
        '',
        '两者都不产生运行时代码，也不做任何判断。判断错了，问题留到运行时才爆。',
        '',
        '`as` 的合理用途是「编译器信息不够，但我知道得更多」，比如把一个宽类型收窄到它确实属于的那一支。拿 `as` 去掩盖「数据可能不是这个形状」是另一回事，那正是谓词和断言函数要解决的。'
      ].join('\n') },

      { kind: 'demo', caption: 'as 只是声明，运行时什么都不管', code: [
        'type User = { name: string };',
        '',
        'const data: unknown = 42;',
        'const u = data as User;        // 编译器信了，运行时没有任何检查',
        '',
        'console.log(u.name);           // 类型说是 string，实际是 undefined'
      ].join('\n'), run: true, checks: [
        'eqType(\'u\', \'{ name: string }\', \'as 把类型改成了 User 的形状\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'undefined\'], \'类型骗过了编译器，值并没有\')'
      ] },

      { kind: 'demo', caption: '非空断言去掉 undefined，风险自己担', code: [
        'type Box = { label?: string };',
        '',
        'function labelOf(b: Box): string {',
        '  return b.label!.trim();      // ! 只是让编译器不再提 undefined',
        '}',
        '',
        'console.log(labelOf({ label: \'  hi  \' }));'
      ].join('\n'), run: true, checks: [
        'eqType(\'labelOf\', \'(b: { label?: string }) => string\', \'labelOf 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'hi\'], \'运行输出\')'
      ] },

      { kind: 'note', tone: 'warn', md: '换个调用 `labelOf({})`，编译一样通过，跑到 `b.label!` 时抛 `Cannot read properties of undefined`。`!` 不替你检查，能判断就判断，用 `??` 或 `if` 兜住。' },

      { kind: 'prose', md: [
        '## `satisfies`：检查，但不改我推断出来的类型',
        '`const x: T = 值` 会把 `x` 的类型**钉成注解 `T`**，值本来更具体的形状（具体的键、字面量）就丢了。`const x = 值 satisfies T` 只要求值满足 `T`，`x` 仍是自己推断出来的那个更具体的类型。',
        '',
        '想要充分检查、又不想牺牲 `keyof` 这类细节时，用 `satisfies`。'
      ].join('\n') },

      { kind: 'demo', caption: 'satisfies 保住了具体的键', code: [
        'const routes = {',
        '  home: \'/\',',
        '  about: \'/about\'',
        '} satisfies Record<string, string>;',
        '',
        'let k: keyof typeof routes = \'home\';   // \"home\" | \"about\"',
        '// k = \'nope\';                        // ✗ TS2322：不在键的联合里'
      ].join('\n'), checks: [
        'eqType(\'routes\', \'{ home: string; about: string }\', \'satisfies 没有把类型拓成 Record\')',
        'eqType(\'k\', \'"home" | "about"\', \'keyof typeof 仍是具体的键\')',
        'noErrors()'
      ] },

      { kind: 'demo', caption: 'satisfies 照样会报错', code: [
        'const ports = { http: 80, https: 443 } satisfies Record<string, number>;',
        'const bad = { ftp: \'21\' } satisfies Record<string, number>;   // ✗ TS2322'
      ].join('\n'), checks: [
        'noErrorAt(1, \'第 1 行符合要求\')',
        'errorAt(2, 2322, \'第 2 行的值不满足约束\')',
        'hasError(2322)'
      ] },

      { kind: 'table', head: ['写法', '运行时检查', '对类型做什么'], rows: [
        ['`x as T`', '没有', '把类型直接改成 `T`'],
        ['`x!`', '没有', '去掉 `null` / `undefined`，其余不变'],
        ['`x is T`（谓词返回值）', '你写的判断', '为真时把实参收窄成 `T`'],
        ['`asserts x is T`', '不满足就抛', '调用之后把实参收窄成 `T`'],
        ['`satisfies T`', '编译期检查', '值要满足 `T`，但保留推断出来的类型']
      ] },

      { kind: 'prose', md: [
        '## 该用哪一个',
        '有判断条件、能收进一个函数：写 `x is T` 或 `asserts x is T`，它们和 `typeof`、`in` 一样参与收窄。',
        '只想拦住不合规的值、不打算从函数里取回布尔值：用 `asserts`。',
        '确实比编译器知道得多、又拿得出理由时，才用 `as`；`!` 同理，能躲就躲。',
        '已经有完整的值、只想要一层额外校验：`satisfies`。'
      ].join('\n') },

      { kind: 'exercise', id: 'ex09-1', title: '写一个数组谓词', task: [
        '`isStringArray` 现在只判断「是不是数组」，返回 `boolean`——判断为真，编译器也不知道里面装的是不是字符串。',
        '把它改成类型谓词，让为真时元素类型是 `string`。',
        '',
        '要求：',
        '- 返回类型是 `x is string[]`',
        '- 先确认是数组，再确认每个元素都是字符串（用 `every`）'
      ].join('\n'), starter: [
        'function isStringArray(x: unknown): boolean {',
        '  return Array.isArray(x);',
        '}',
        '',
        'const raw: unknown = [\'a\', \'b\'];'
      ].join('\n'), solution: [
        'function isStringArray(x: unknown): x is string[] {',
        '  return Array.isArray(x) && x.every((v) => typeof v === \'string\');',
        '}',
        '',
        'const raw: unknown = [\'a\', \'b\'];'
      ].join('\n'), tests: [
        'eqType(\'isStringArray\', \'(x: unknown) => x is string[]\', \'isStringArray 应当是类型谓词\')',
        'eqType(\'raw\', \'unknown\')',
        'noErrors()'
      ], hints: [
        '返回类型写成 `x is T`，`T` 就是判断为真时参数的类型。',
        '`Array.isArray(x)` 收窄出数组但不知道元素类型，再补一句 `x.every((v) => typeof v === \'string\')`。'
      ] },

      { kind: 'exercise', id: 'ex09-2', title: '用 satisfies 守住键的联合', task: [
        '`theme` 用了 `: Record<string, string>` 注解，结果 `keyof typeof theme` 变成了 `string`，任何键都通得过。',
        '改成用 `satisfies` 校验，同时保留推断出来的具体键。',
        '',
        '要求：`theme` 的值不变、约束仍是 `Record<string, string>`；`active` 的类型是 `\"light\" | \"dark\"`；没有类型错误。'
      ].join('\n'), starter: [
        'const theme: Record<string, string> = { light: \'#fff\', dark: \'#000\' };',
        '',
        'let active: keyof typeof theme = \'light\';'
      ].join('\n'), solution: [
        'const theme = { light: \'#fff\', dark: \'#000\' } satisfies Record<string, string>;',
        '',
        'let active: keyof typeof theme = \'light\';'
      ].join('\n'), tests: [
        'noErrors(\'satisfies 不改变推断出来的类型\')',
        'eqType(\'active\', \'\"light\" | \"dark\"\', \'active 应当是两个字面量之一\')'
      ], hints: [
        '`const x: T = 值` 会把类型钉死成 `T`，`satisfies` 只做检查、不动 `x` 的类型。',
        '去掉冒号注解，在值后面接 `satisfies Record<string, string>`。'
      ] },

      { kind: 'exercise', id: 'ex09-3', title: '把 as 换成守卫', task: [
        '`raw` 标成了 `any`，又用 `as User` 硬转，整条链上没有一处检查。',
        '改成安全写法：`raw` 用 `unknown`，写一个 `isUser` 谓词判断，判断通过再当 `User` 用。',
        '',
        '要求：',
        '- `isUser(x: unknown): x is User`，判断 `name` 是 `string`、`age` 是 `number`',
        '- `raw` 是 `unknown`，值是 `{ name: \'blue\', age: 3 }`',
        '- `u` 的类型是 `User`，判断通过时取 `raw`，否则用一个兜底对象',
        '- 运行输出正好是 `blue 3`'
      ].join('\n'), starter: [
        'type User = { name: string; age: number };',
        '',
        'const raw: any = { name: \'blue\', age: 3 };',
        'const u = raw as User;',
        '',
        'console.log(u.name, u.age);'
      ].join('\n'), solution: [
        'type User = { name: string; age: number };',
        '',
        'function isUser(x: unknown): x is User {',
        '  if (typeof x !== \'object\' || x === null) return false;',
        '  return \'name\' in x && \'age\' in x',
        '    && typeof x.name === \'string\' && typeof x.age === \'number\';',
        '}',
        '',
        'const raw: unknown = { name: \'blue\', age: 3 };',
        'let u: User = { name: \'?\', age: 0 };',
        'if (isUser(raw)) {',
        '  u = raw;',
        '}',
        '',
        'console.log(u.name, u.age);'
      ].join('\n'), tests: [
        'exists(\'isUser\', \'要先写判断函数\')',
        'eqType(\'raw\', \'unknown\', \'外部数据用 unknown\')',
        'eqType(\'isUser\', \'(x: unknown) => x is { name: string; age: number }\')',
        'eqType(\'u\', \'{ name: string; age: number }\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'blue 3\'], \'运行输出\')'
      ], hints: [
        '`typeof x === \'object\'` 之后 `x` 是「对象」，还要排掉 `null`——`typeof null` 也是 `\'object\'`。',
        '用 `\'name\' in x` 确认字段在，再用 `typeof x.name === \'string\'` 确认类型，两个字段都过才算 `User`。'
      ] },

      { kind: 'exercise', id: 'ex09-4', title: '写成断言函数', task: [
        '`checkNumber` 返回布尔值，调用它并不会让编译器改变对 `raw` 的看法，下面 `raw * 2` 就报 `TS18046`。',
        '把它改成断言函数 `assertNumber`：不是数字就抛错，是数字就正常往下走。',
        '',
        '要求：`assertNumber(x: unknown): asserts x is number`；调用之后 `raw * 2` 不再报错；运行输出 `42`。'
      ].join('\n'), starter: [
        'function checkNumber(x: unknown): boolean {',
        '  return typeof x === \'number\';',
        '}',
        '',
        'const raw: unknown = 21;',
        'checkNumber(raw);',
        '',
        'console.log(raw * 2);            // ✗ TS18046：raw 是 unknown'
      ].join('\n'), solution: [
        'function assertNumber(x: unknown): asserts x is number {',
        '  if (typeof x !== \'number\') {',
        '    throw new Error(\'不是数字\');',
        '  }',
        '}',
        '',
        'const raw: unknown = 21;',
        'assertNumber(raw);',
        '',
        'console.log(raw * 2);'
      ].join('\n'), tests: [
        'eqType(\'assertNumber\', \'(x: unknown) => asserts x is number\', \'assertNumber 应当是断言函数\')',
        'noErrors(\'调用断言函数之后 raw 应当收窄成 number\')',
        'await run();',
        'eqLogs([\'42\'], \'运行输出\')'
      ], hints: [
        '返回类型写成 `asserts x is number`，函数体在不满足条件时 `throw`。',
        '断言函数调用之后，编译器就按 `x is number` 收窄，不用再写 `if`。'
      ] },

      { kind: 'exercise', id: 'ex09-5', title: '别用 ! 顶掉 undefined', task: [
        '`labelOf` 用 `b.label!` 去掉了 `undefined`，第一次调用没事，`{}` 一来就在运行时崩。',
        '改成安全写法：没给 `label` 就返回空串。',
        '',
        '要求：`labelOf` 的类型仍是 `(b: Box) => string`；运行输出两行，分别是 `hi` 和空行。'
      ].join('\n'), starter: [
        'type Box = { label?: string };',
        '',
        'function labelOf(b: Box): string {',
        '  return b.label!.trim();',
        '}',
        '',
        'console.log(labelOf({ label: \'  hi  \' }));',
        'console.log(labelOf({}));'
      ].join('\n'), solution: [
        'type Box = { label?: string };',
        '',
        'function labelOf(b: Box): string {',
        '  return (b.label ?? \'\').trim();',
        '}',
        '',
        'console.log(labelOf({ label: \'  hi  \' }));',
        'console.log(labelOf({}));'
      ].join('\n'), tests: [
        'eqType(\'labelOf\', \'(b: { label?: string }) => string\', \'labelOf 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'hi\', \'\'], \'没给 label 时也要有输出\')'
      ], hints: [
        '`?.` 和 `??` 是前面学过的手段，这里用 `b.label ?? \'\'` 兜一下再 `trim`。',
        '`!` 只是让编译器别提醒，换成真正处理 `undefined` 的写法。'
      ] },

      { kind: 'prose', md: [
        '## 这一章的手感',
        '谓词和断言函数都是「你担保，编译器相信」：担保写对了，收窄会一路用下去；写错了，编译器不会提醒，错误留到运行时。',
        '`as` 和 `!` 是关掉检查最快的办法，也是把问题往后推最快的办法。',
        '`satisfies` 是少数只加检查、不加损失的写法——值要满足约束，类型仍留在自己推断出来的样子上。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
