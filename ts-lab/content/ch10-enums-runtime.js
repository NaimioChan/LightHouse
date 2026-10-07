/* 第 10 章 · 枚举与运行时的类型。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch10',
    title: '第 10 章 · 枚举与运行时的类型',
    goal: '能读懂 enum 编译后留下的运行时代码，分清哪些声明会被彻底擦掉，并用 as const 对象配 keyof typeof 写出不依赖 enum 的等价写法。',
    sections: [
      { kind: 'prose', md: [
        '第 1 章说过类型只活在编译期。这一章把这句话落到实处：拿几个真实的声明去对编译产物，看哪一行进了运行时、哪一行原地消失。',
        '',
        '## enum 会留下真代码',
        '`interface`、`type`、类型注解，编译后一行都不剩。`enum` 不一样——它会被编成一个真实的 JavaScript 对象，运行时的代码能读它的成员。',
        '数字枚举的产物里还藏着一张**双向表**。'
      ].join('\n') },

      { kind: 'demo', caption: '数字枚举编成一张双向表', code: [
        'enum Dir { Up, Down, Left, Right }',
        '',
        'const start: Dir = Dir.Left;',
        'let next: Dir = Dir.Right;',
        '',
        'next = 9;   // ✗ TS2322：9 不是 Dir',
        '',
        'console.log(start, Dir[0], Dir[3]);'
      ].join('\n'), run: true, checks: [
        'hasError(2322, \'数字枚举不接受随便的数字\')',
        'errorAt(6, 2322, \'报在赋值那一行\')',
        'countErrors(1, \'只报这一处\')',
        'assignableTo(\'start\', \'number\', \'数字枚举成员能当数字用\')',
        'notAssignableTo(\'start\', \'string\', \'但它是数字，不是字符串\')',
        'await run();',
        'eqLogs([\'2 Up Right\'], \'反向映射也留下了\')'
      ] },

      { kind: 'prose', md: [
        '上面那段编译出来是这样：',
        '',
        '- 先 `var Dir;` 声明一个对象',
        '- 再一段立刻执行的函数往里写 `Dir[Dir["Up"] = 0] = "Up";`，每个成员写两遍',
        '',
        '写两遍是为了生成**反向映射**：正向 `Dir.Up` 是数字 `0`，反向 `Dir[0]` 是字符串 `"Up"`。正反两半在同一个对象里。',
        '所以 `Dir[0]` 打印出的是 `Up`，`Dir[3]` 是 `Right`——你给的不是下标查询，是一次真实的属性读取。',
        '',
        '还要留意 `next = 9` 那一行：类型层被 `TS2322` 拦下，可它在产物里是真代码，运行时照跑。**类型检查不通过，不代表这行不进产物**。'
      ].join('\n') },

      { kind: 'demo', caption: '字符串枚举没有反向映射', code: [
        'enum Color { Red = \'red\', Green = \'green\', Blue = \'blue\' }',
        '',
        'const pick: Color = Color.Green;',
        '',
        'console.log(pick);',
        'console.log(Color);'
      ].join('\n'), run: true, checks: [
        'notAssignableTo(\'pick\', \'number\', \'字符串枚举不是数字\')',
        'exists(\'Color\', \'Color 在类型层存在\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'green\', "{ Red: \'red\', Green: \'green\', Blue: \'blue\' }"], \'字符串枚举没有反向映射\')'
      ] },

      { kind: 'table', head: ['写法', '产物里是什么', '反向映射'], rows: [
        ['`enum D { Up }`', '一个对象，成员是数字 `0`', '有，`D[0]` 得到 `"Up"`'],
        ['`enum C { R = \'red\' }`', '一个对象，成员是字符串 `\'red\'`', '没有，反查不回来'],
        ['`const S = { A: 0 } as const`', '普通对象，`S` 本身就是它', '没有，也用不上']
      ] },

      { kind: 'note', tone: 'warn', md: '别把数字枚举当成 `number` 用。`Dir.Up` 能赋给 `number`，但把 `9` 赋给一个 `Dir` 变量会报 `TS2322`——枚举成员是有名字的常量，数字只是它挑的值。字符串枚举更稳：成员值就是可读的字符串，日志里一眼能认出来。' },

      { kind: 'prose', md: [
        '## 编译产物里还剩什么',
        '把几个声明混在一起编译一次，产物会自己交代：哪些东西活着进了运行时，哪些只是编译期的说法。'
      ].join('\n') },

      { kind: 'demo', caption: '接口和别名消失，变量、类、枚举留下', code: [
        'interface Point { x: number; y: number }',
        'type Flag = boolean;',
        '',
        'const label: string = \'ok\';',
        'class Box { size: number = 1; }',
        'enum Kind { A, B }',
        '',
        'console.log(label);',
        'console.log(typeof Box);',
        'console.log(typeof Kind);'
      ].join('\n'), run: true, checks: [
        'exists(\'Point\', \'接口只在类型层存在\')',
        'exists(\'Flag\', \'别名只在类型层存在\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'ok\', \'function\', \'object\'], \'运行时只剩值\')'
      ] },

      { kind: 'table', head: ['声明', '编译产物里还有吗'], rows: [
        ['`interface Point { … }`', '没有，整段删掉'],
        ['`type Flag = boolean`', '没有，整段删掉'],
        ['`const label: string = …`', '有；注解没了，只剩 `const label = …`'],
        ['`class Box { … }`', '有，类是实打实的代码'],
        ['`enum Kind { … }`', '有，编成一个对象'],
        ['`const enum Axis { … }`', '成员能当常量用，产物里照样留下一个对象']
      ] },

      { kind: 'prose', md: [
        '## const enum',
        '`const enum` 想表达的是「这些成员只是常量，取出来当字面量用就行」。类型层对它有一条硬规定：**整个枚举对象不能当值用**，只能取它的成员。',
        '`console.log(Port)` 会报 `TS2475`；而 `Port.Https` 是合法的，它就是常量 `443`。'
      ].join('\n') },

      { kind: 'demo', caption: 'const enum 的成员当常量用', code: [
        'const enum Axis { X = 1, Y = 2 }',
        '',
        'const total: number = Axis.X + Axis.Y;',
        'console.log(total);'
      ].join('\n'), run: true, checks: [
        'noErrors()',
        'await run();',
        'eqLogs([\'3\'], \'成员当成常量用\')',
        'notJsHas(\'var Axis\', \'默认不在产物里留枚举对象\')',
        'jsHas(\'1 /* Axis.X */\', \'成员被内联成常量\')'
      ] },

      { kind: 'note', tone: 'tip', md: '`preserveConstEnums` 管的是「要不要在产物里留下那段对象」。切到「编译产物」页签对比一下：默认时成员被**内联**成常量（`Axis.X` 变成 `1`），开了这个开关才会留下 `var Axis = …` 那段。' },

      { kind: 'demo', caption: 'preserveConstEnums：同一个 const enum，两种产物', code: [
        'const enum Axis { X = 1, Y = 2 }',
        '',
        'const total: number = Axis.X + Axis.Y;',
        'console.log(total);'
      ].join('\n'), tsconfig: { preserveConstEnums: true }, checks: [
        'noErrors()',
        'jsHas(\'var Axis;\', \'开了开关，产物里应当留下枚举对象\')',
        'jsHas(\'Axis[Axis["X"] = 1] = "X";\', \'反向映射那段也在\')'
      ] },

      { kind: 'prose', md: [
        '## 用 as const 对象替代 enum',
        '`enum` 是 TS 独有的语法。要一个「运行时就是个普通对象、类型又收得很紧」的东西，可以用 `as const` 对象配两把类型工具：',
        '',
        '- `typeof 值` 取这个值的类型',
        '- `keyof 类型` 取它所有键组成的联合',
        '',
        '`type Size = typeof Sizes[keyof typeof Sizes]` 取的是**取值**的联合（`\'s\' | \'m\' | \'l\'`）；`keyof typeof Sizes` 取的是**键**的联合（`\'S\' | \'M\' | \'L\'`）。一个拿来限制取值，一个拿来限制键名。'
      ].join('\n') },

      { kind: 'demo', caption: 'as const 对象 + typeof / keyof typeof', code: [
        'const Sizes = { S: \'s\', M: \'m\', L: \'l\' } as const;',
        'type Size = typeof Sizes[keyof typeof Sizes];',
        '',
        'const s: Size = Sizes.M;',
        'const key: keyof typeof Sizes = \'M\';',
        '',
        'console.log(Sizes.M, s);',
        'console.log(key);'
      ].join('\n'), run: true, checks: [
        'eqType(\'Size\', \'"s" | "m" | "l"\', \'取值的联合\')',
        'eqType(\'key\', \'"S" | "M" | "L"\', \'键的联合\')',
        'eq(memberNames(\'Sizes\'), [\'L\', \'M\', \'S\'], \'Sizes 的键\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'m m\', \'M\'], \'运行输出\')'
      ] },

      { kind: 'exercise', id: 'ex10-1', title: '让数组元素停在字面量上', task: [
        '`kinds` 用普通数组声明，元素类型被放宽成 `string`，于是 `Kind` 也跟着变成 `string`。让元素停在字面量上。',
        '',
        '要求：`Kind` 和 `kind` 的类型都是 `\'a\' | \'b\'`，运行输出正好是 `a`，代码里没有类型错误。'
      ].join('\n'), starter: [
        'const kinds = [\'a\', \'b\'];',
        'type Kind = typeof kinds[number];',
        'const kind: Kind = \'a\';',
        '',
        'console.log(kind);'
      ].join('\n'), solution: [
        'const kinds = [\'a\', \'b\'] as const;',
        'type Kind = typeof kinds[number];',
        'const kind: Kind = \'a\';',
        '',
        'console.log(kind);'
      ].join('\n'), tests: [
        'eqType(\'Kind\', \'"a" | "b"\', \'kinds 的元素联合\')',
        'eqType(\'kind\', \'"a" | "b"\', \'kind 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'a\'], \'运行输出\')'
      ], hints: [
        '`as const` 会把数组变成只读元组，元素类型也一起收成字面量。',
        '改完看 `kinds` 的类型：从 `string[]` 变成 `readonly ["a", "b"]`，再用 `[number]` 取出来才是 `\'a\' | \'b\'`。'
      ] },

      { kind: 'exercise', id: 'ex10-2', title: '把 enum 换成 as const 对象', task: [
        '`Dir` 现在是个字符串枚举。改成不依赖 `enum` 的写法：一个 `as const` 对象加一个由它派生的类型别名。',
        '',
        '要求：值对象叫 `DirMap`，类型别名仍叫 `Dir`，取值是 `\'up\' | \'down\'`，`d` 的类型也是它，运行输出 `up`。'
      ].join('\n'), starter: [
        'enum Dir { Up = \'up\', Down = \'down\' }',
        '',
        'const d: Dir = Dir.Up;',
        'console.log(d);'
      ].join('\n'), solution: [
        'const DirMap = { Up: \'up\', Down: \'down\' } as const;',
        'type Dir = typeof DirMap[keyof typeof DirMap];',
        '',
        'const d: Dir = DirMap.Up;',
        'console.log(d);'
      ].join('\n'), tests: [
        'eqType(\'Dir\', \'"up" | "down"\', \'Dir 的取值\')',
        'eqType(\'d\', \'"up" | "down"\', \'d 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'up\'], \'运行输出\')'
      ], hints: [
        '`as const` 对象里每个属性值都是字面量；配 `keyof typeof` 就能取出取值的联合。',
        '`Dir.Up` 换成 `DirMap.Up`，类型别名写成 `type Dir = typeof DirMap[keyof typeof DirMap];`。'
      ] },

      { kind: 'note', tone: 'tip', md: '用 `as const` 对象时，属性名（`Up`）和属性值（`\'up\'`）是两套名字。要限制「有哪些键」，用 `keyof typeof`；要限制「值是哪些」，用 `[keyof typeof]`。' },

      { kind: 'exercise', id: 'ex10-3', title: '用 keyof typeof 取键', task: [
        '`Config` 是 `as const` 对象，但 `Key` 现在写成了太宽的 `string`。把它收成配置的键。',
        '',
        '要求：`Key` 和 `k` 的类型都是 `\'host\' | \'port\'`，运行输出 `host`。'
      ].join('\n'), starter: [
        'const Config = { host: \'localhost\', port: 8080 } as const;',
        'type Key = string;',
        '',
        'const k: Key = \'host\';',
        'console.log(k);'
      ].join('\n'), solution: [
        'const Config = { host: \'localhost\', port: 8080 } as const;',
        'type Key = keyof typeof Config;',
        '',
        'const k: Key = \'host\';',
        'console.log(k);'
      ].join('\n'), tests: [
        'eqType(\'Key\', \'"host" | "port"\', \'Config 的键联合\')',
        'eqType(\'k\', \'"host" | "port"\', \'k 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'host\'], \'运行输出\')'
      ], hints: [
        '`keyof typeof Config` 会把 `Config` 所有键的名字取出来组成联合。',
        '键是属性名 `\'host\'`、`\'port\'`，不是值 `\'localhost\'`、`8080`——别和 `typeof Config[keyof typeof Config]` 搞混。'
      ] },

      { kind: 'exercise', id: 'ex10-4', title: '类型名不能当值用', task: [
        '`Point` 是个 `interface`，运行时不存在。现在代码把 `typeof Point` 当成值来打印，编译器报 `TS2693`。',
        '',
        '改成：用一个 `Point` 类型的变量接住数据，运行时打印它的 `x`。要求 `Point` 还留在类型层，没有类型错误，运行输出 `3`。'
      ].join('\n'), starter: [
        'interface Point { x: number; y: number }',
        '',
        'console.log(typeof Point);'
      ].join('\n'), solution: [
        'interface Point { x: number; y: number }',
        '',
        'const p: Point = { x: 3, y: 4 };',
        'console.log(p.x);'
      ].join('\n'), tests: [
        'exists(\'Point\', \'Point 还在类型层\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'3\'], \'运行输出\')'
      ], hints: [
        '`interface` 和 `type` 只描述形状，编译后什么都不剩，所以不能拿它当值。',
        '建一个 `const p: Point = { x: 3, y: 4 };`，然后打印 `p.x`。'
      ] },

      { kind: 'exercise', id: 'ex10-5', title: 'const enum 的成员当常量', task: [
        '`Port` 是 `const enum`。成员可以当常量取，但整个枚举对象不能当值用——`console.log(Port)` 会报 `TS2475`。',
        '',
        '改成：只用成员拼出地址，运行时只打印那一行 `https://x:443`，代码里没有类型错误。'
      ].join('\n'), starter: [
        'const enum Port { Http = 80, Https = 443 }',
        '',
        'console.log(Port.Http);',
        'console.log(Port);'
      ].join('\n'), solution: [
        'const enum Port { Http = 80, Https = 443 }',
        '',
        'const url = \'https://x:\' + Port.Https;',
        'console.log(url);'
      ].join('\n'), tests: [
        'noErrors()',
        'await run();',
        'eqLogs([\'https://x:443\'], \'运行输出\')'
      ], hints: [
        '`const enum` 的成员是常量，直接取 `Port.Https` 就能拼进字符串。',
        '把 `console.log(Port)` 那一行删掉，只留下拼好地址再打印的一行。'
      ] },

      { kind: 'prose', md: [
        '`enum` 是编译后留下真代码的类型：数字枚举带一张双向表，字符串枚举只有正向。`interface`、`type`、注解在产物里一行不留，`class` 和 `const` 都在。',
        '想绕开 `enum`，就用 `as const` 对象配 `typeof` 和 `keyof typeof`，运行时它只是个普通对象。',
        '下一章把镜头转向报错本身：`strict` 的每个开关各管什么，以及拿到一条错误怎么从码、行号、期望与实际三处读明白。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
