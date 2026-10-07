/* 第 6 章 · 泛型。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch06',
    title: '第 6 章 · 泛型',
    goal: '学会用类型参数把「同一套逻辑、不同具体类型」写成一份代码，并知道怎么约束它。',
    sections: [
      { kind: 'prose', md: [
        '一个函数只做一件事，但要面对很多种类型。比如「原样返回传进来的值」：写死参数类型，它只服务一种；',
        '标成 `any`，返回值也成了 `any`，调用处后面的检查全部失效。',
        '',
        '## 类型参数',
        '泛型给函数加一个**类型参数**，写在函数名后面的尖括号里。它和函数参数是一回事，只是填进去的是类型：',
        '- `function identity<T>(value: T): T { return value; }`',
        '',
        '`T` 是占位符，到底是谁由调用决定：传字符串它就落在字符串那一支，传数字就落在数字那一支。',
        '从实参反推类型参数的过程叫**推断**，多数调用不用手写类型。'
      ].join('\n') },

      { kind: 'demo', caption: '一个函数，多种类型', code: [
        'function identity<T>(value: T): T {',
        '  return value;',
        '}',
        '',
        'const a = identity(\'x\');',
        'const b = identity(42);',
        'const c = identity(true);'
      ].join('\n'), checks: [
        'eqType(\'identity\', \'<T>(value: T) => T\', \'identity 的类型\')',
        'eqType(\'a\', \'string\', \'a 的类型，T 由实参推出来\')',
        'eqType(\'b\', \'number\', \'b 的类型\')',
        'eqType(\'c\', \'boolean\', \'c 的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 推断与显式指定',
        '类型参数可以有多个，按顺序对应。不想靠推断，或者推断不出想要的结果，就把类型实参写在尖括号里：',
        '- `pair<string, number>(\'1\', 2)`',
        '',
        '显式指定时要写全，或者一个都不写交给推断，不能只写前面的几个。'
      ].join('\n') },

      { kind: 'demo', caption: '显式类型实参', code: [
        'function pair<A, B>(a: A, b: B): [A, B] {',
        '  return [a, b];',
        '}',
        '',
        'const p1 = pair(1, \'x\');',
        'const p2 = pair<string, number>(\'1\', 2);'
      ].join('\n'), checks: [
        'eqType(\'pair\', \'<A, B>(a: A, b: B) => [A, B]\', \'pair 的类型\')',
        'eqType(\'p1\', \'[number, string]\', \'靠推断得到的元组\')',
        'eqType(\'p2\', \'[string, number]\', \'显式指定两个类型实参\')',
        'noErrors()'
      ] },

      { kind: 'table', head: ['写法', '含义'], rows: [
        ['`function id<T>(x: T): T`', '泛型函数，`T` 是调用时才定的类型参数'],
        ['`id<string>(\'x\')`', '显式给出类型实参，跳过推断'],
        ['`<T extends { id: number }>`', '约束：`T` 至少要有这些成员'],
        ['`<T = string>`', '默认类型参数，省略类型实参时用 `string`'],
        ['`keyof T`', '`T` 所有属性名组成的联合类型'],
        ['`T[K]`', '按键取值：`K` 是 `T` 的键时，`T[K]` 是那个属性的类型']
      ] },

      { kind: 'note', tone: 'tip', md: '类型参数叫什么名字不影响类型比较：`<T>(x: T) => T` 与 `<U>(x: U) => U` 是同一个类型。名字换得合适，读者更容易看懂 `T` 代表什么。' },

      { kind: 'prose', md: [
        '## 约束：限定类型参数的范围',
        '没有约束时 `T` 可以是任何类型，函数体里不能在 `T` 上读属性——编译器不知道它有没有那个属性。',
        '给类型参数加 `extends`，声明「至少要满足这些」：',
        '- `function idOf<T extends { id: number }>(item: T): number { return item.id; }`',
        '',
        '`T` 仍然可以比约束更具体，多几个字段都行，只要包含约束要求的成员。'
      ].join('\n') },

      { kind: 'demo', caption: '约束把「任何类型」收窄到「有 id 的类型」', code: [
        'function idOf<T extends { id: number }>(item: T): number {',
        '  return item.id;',
        '}',
        '',
        'const n = idOf({ id: 7, name: \'x\' });'
      ].join('\n'), checks: [
        'eqType(\'idOf\', \'<T extends { id: number }>(item: T) => number\', \'idOf 的类型\')',
        'eqType(\'n\', \'number\', \'n 的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## `keyof` 与索引访问',
        '`keyof T` 拿到 `T` 所有属性名组成的联合类型。`T[K]` 是按属性名取类型：`K` 是 `T` 的键时，`T[K]` 就是那个属性的类型。',
        '把两者一起用在约束里，取值函数就能同时保证键合法、返回类型准确：',
        '- `function prop<T, K extends keyof T>(obj: T, key: K) { return obj[key]; }`',
        '',
        '约束成 `K extends keyof T` 之后，`prop(user, \'oops\')` 会报 `TS2345`——`\'oops\'` 不在 `user` 的键里，',
        '而合法调用 `prop(user, \'name\')` 的返回类型会自动是 `name` 那个属性的类型。'
      ].join('\n') },

      { kind: 'demo', caption: '键与值的类型绑在一起', code: [
        'function prop<T, K extends keyof T>(obj: T, key: K) {',
        '  return obj[key];',
        '}',
        '',
        'const user = { name: \'ann\', age: 3 };',
        'const v1 = prop(user, \'name\');',
        'const v2 = prop(user, \'age\');'
      ].join('\n'), checks: [
        'eqType(\'prop\', \'<T, K extends keyof T>(obj: T, key: K) => T[K]\', \'prop 的类型\')',
        'eqType(\'v1\', \'string\', \'v1 的类型\')',
        'eqType(\'v2\', \'number\', \'v2 的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 数组方法上的推断',
        '标准库里的数组方法本身就是泛型的，`map`、`filter` 都一样。类型参数从元素类型和回调的返回值里推出来，',
        '所以链式调用不用手写类型，元素类型也会跟着变。'
      ].join('\n') },

      { kind: 'demo', caption: 'map 推出来的元素类型', code: [
        'const nums = [1, 2, 3];',
        '',
        'const doubled = nums.map((n) => n * 2);',
        'const labels = nums.map((n) => \'n\' + n);'
      ].join('\n'), checks: [
        'eqType(\'doubled\', \'number[]\', \'doubled 的类型\')',
        'eqType(\'labels\', \'string[]\', \'labels 的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 默认类型参数',
        '类型参数可以带默认值，写法是 `<T = string>`。省略类型实参时用默认的那个，写全了就覆盖默认，',
        '这比给同一个泛型类型写两个名字省事。'
      ].join('\n') },

      { kind: 'demo', caption: '省略类型实参就用默认值', code: [
        'interface Box<T = string> {',
        '  value: T;',
        '}',
        '',
        'const b: Box = { value: \'x\' };',
        'const bn: Box<number> = { value: 1 };'
      ].join('\n'), checks: [
        'eqType(\'b.value\', \'string\', \'省略类型实参时 value 是 string\')',
        'eqType(\'bn.value\', \'number\', \'显式指定时 value 是 number\')',
        'eq(memberNames(\'b\'), [\'value\'], \'b 只有一个属性\')',
        'noErrors()'
      ] },

      { kind: 'exercise', id: 'ex06-1', title: '写一个 first 泛型函数', task: [
        '把 `first` 从 `any` 版改成泛型版：',
        '',
        '- 参数 `arr` 是元素类型为 `T` 的数组',
        '- 返回值类型是 `T | undefined`',
        '',
        '保留 `const x = first([1, 2, 3]);` 这一行，只改函数声明。'
      ].join('\n'), starter: [
        'function first(arr: any[]): any {',
        '  return arr[0];',
        '}',
        '',
        'const x = first([1, 2, 3]);'
      ].join('\n'), solution: [
        'function first<T>(arr: T[]): T | undefined {',
        '  return arr[0];',
        '}',
        '',
        'const x = first([1, 2, 3]);'
      ].join('\n'), tests: [
        'eqType(\'first\', \'<T>(arr: T[]) => T | undefined\', \'first 应该带上类型参数和正确的返回类型\')',
        'eqType(\'x\', \'number | undefined\', \'x 的类型\')',
        'noErrors()'
      ], hints: [
        '类型参数写在函数名后面：`function first<T>(...)`。',
        '参数里的 `T[]` 表示「`T` 组成的数组」，返回 `T | undefined` 是因为数组可能是空的。'
      ] },

      { kind: 'exercise', id: 'ex06-2', title: '用 keyof 约束键参数', task: [
        '`prop` 现在的 `key` 是 `string`，`obj[key]` 索引不进去，编译器报 `TS7053`。',
        '',
        '把它改成：`obj` 是 `T`，`key` 只能是 `T` 的属性名，返回值是 `obj[key]` 的类型。保留最后一行的调用。'
      ].join('\n'), starter: [
        'function prop<T>(obj: T, key: string) {',
        '  return obj[key];',
        '}',
        '',
        'const v = prop({ name: \'ann\', age: 3 }, \'name\');'
      ].join('\n'), solution: [
        'function prop<T, K extends keyof T>(obj: T, key: K) {',
        '  return obj[key];',
        '}',
        '',
        'const v = prop({ name: \'ann\', age: 3 }, \'name\');'
      ].join('\n'), tests: [
        'eqType(\'prop\', \'<T, K extends keyof T>(obj: T, key: K) => T[K]\', \'prop 的类型\')',
        'eqType(\'v\', \'string\', \'v 应该是属性 name 的类型\')',
        'noErrors()'
      ], hints: [
        '第二个类型参数要约束成 `keyof T`：写成 `K extends keyof T`。',
        '返回类型不用写注解：`obj[key]` 会被推成 `T[K]`。'
      ] },

      { kind: 'exercise', id: 'ex06-3', title: '给类型参数一个默认值', task: [
        '`Box` 现在必须写类型实参，`const b: Box = …` 会报 `TS2314`。',
        '',
        '给 `T` 一个默认值 `string`，让不写类型实参时 `Box` 就是 `Box<string>`，同时 `Box<number>` 仍然可用。'
      ].join('\n'), starter: [
        'interface Box<T> {',
        '  value: T;',
        '}',
        '',
        'const b: Box = { value: \'x\' };',
        'const bn: Box<number> = { value: 1 };'
      ].join('\n'), solution: [
        'interface Box<T = string> {',
        '  value: T;',
        '}',
        '',
        'const b: Box = { value: \'x\' };',
        'const bn: Box<number> = { value: 1 };'
      ].join('\n'), tests: [
        'eqType(\'b.value\', \'string\', \'省略类型实参时 value 是 string\')',
        'eqType(\'bn.value\', \'number\', \'显式指定时 value 是 number\')',
        'notAssignableTo(\'b\', \'{ value: number }\', \'value 是 string，不能当 number 用\')',
        'noErrors()'
      ], hints: [
        '默认值写在类型参数后面：`<T = string>`。',
        '默认值只是省略时的备选，`Box<number>` 会覆盖它。'
      ] },

      { kind: 'exercise', id: 'ex06-4', title: '把 any 换成类型参数', task: [
        '`wrap` 现在参数和返回值都走 `any`，调用处拿不到类型。',
        '',
        '改成泛型：参数是 `T`，返回值是 `T[]`。保留 `const ws = wrap(\'x\');`。'
      ].join('\n'), starter: [
        'function wrap(value: any) {',
        '  return [value];',
        '}',
        '',
        'const ws = wrap(\'x\');'
      ].join('\n'), solution: [
        'function wrap<T>(value: T): T[] {',
        '  return [value];',
        '}',
        '',
        'const ws = wrap(\'x\');'
      ].join('\n'), tests: [
        'eqType(\'wrap\', \'<T>(value: T) => T[]\', \'wrap 的类型\')',
        'ok(type(\'wrap\').indexOf(\'any\') < 0, \'wrap 的类型里不该再有 any\')',
        'eqType(\'ws\', \'string[]\', \'ws 的类型\')'
      ], hints: [
        '把两处 `any` 换成类型参数 `T`，参数和返回类型都用它。',
        '`[value]` 会被推成 `T[]`，把返回类型写出来更清楚。'
      ] },

      { kind: 'exercise', id: 'ex06-5', title: '给对象参数加约束', task: [
        '`idOf` 直接读 `item.id`，但 `T` 没有约束，编译器报 `TS2339`。',
        '',
        '加一个约束，让 `T` 至少有一个 `number` 类型的 `id`。保留最后一行的调用。'
      ].join('\n'), starter: [
        'function idOf<T>(item: T): number {',
        '  return item.id;',
        '}',
        '',
        'const n = idOf({ id: 7, name: \'x\' });'
      ].join('\n'), solution: [
        'function idOf<T extends { id: number }>(item: T): number {',
        '  return item.id;',
        '}',
        '',
        'const n = idOf({ id: 7, name: \'x\' });'
      ].join('\n'), tests: [
        'eqType(\'idOf\', \'<T extends { id: number }>(item: T) => number\', \'idOf 的类型\')',
        'eqType(\'n\', \'number\', \'n 的类型\')',
        'noErrors()'
      ], hints: [
        '约束写在类型参数后面：`<T extends { id: number }>`。',
        '约束只是下限，实参可以多带字段，多出来的 `name` 不受影响。'
      ] },

      { kind: 'prose', md: [
        '## 小结',
        '泛型把「一套逻辑」和「具体类型」分开：类型参数在调用时定，推断不出来或想固定时就显式写。',
        '约束 `extends` 说清类型参数至少具备什么，`keyof T` 与 `T[K]` 让键和值的类型绑在一起，',
        '默认类型参数省掉常见用法里重复的类型实参。写出泛型函数之后，原先标 `any` 的地方通常就能收掉。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
