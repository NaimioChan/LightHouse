/* 第 5 章 · 接口与类型别名。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch05',
    title: '第 5 章 · 接口与类型别名',
    goal: '会用 interface 和 type 给类型起名字，知道何时选哪个，并看懂 TypeScript 为什么只看结构、不看名字。',
    sections: [
      { kind: 'prose', md: [
        'TypeScript 里给类型起名字有两样工具：`interface` 和 `type`。多数场合它们能表达同样的东西，',
        '挑哪个更多是习惯；但有几点差别会真的影响你能写什么。',
        '',
        '- `interface` 描述**对象的形状**，可以被 `extends` 继承，允许同名声明合并。',
        '- `type` 给**任何类型**起别名，联合、元组、交叉类型都能装进去，但同名会报错。'
      ].join('\n') },

      { kind: 'demo', caption: 'interface 描述对象，type 给联合起名字', code: [
        'interface User {',
        '  id: number;',
        '  name: string;',
        '}',
        '',
        'type Role = \'admin\' | \'member\';',
        '',
        'const u: User = { id: 1, name: \'ada\' };',
        'const r: Role = \'admin\';'
      ].join('\n'), checks: [
        'eqType(\'User\', \'{ id: number; name: string; }\', \'User 是一个对象类型\')',
        'eqType(\'u\', \'{ id: number; name: string; }\', \'u 的类型\')',
        'eqType(\'Role\', \'"admin" | "member"\', \'Role 是联合别名\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 什么时候用哪个',
        '',
        '`interface` 说的是「一个对象长什么样」，能继承、能合并。`type` 是给类型起别名，',
        '联合、元组、交叉这些非对象的类型它都能装，而 `interface` 写不出来。'
      ].join('\n') },

      { kind: 'table', head: ['场景', '选谁', '原因'], rows: [
        ['描述一个对象或类的形状', '`interface`', '可以 `extends` 继承，也能声明合并'],
        ['联合、元组、交叉的别名', '`type`', '`interface` 表达不了这些形状'],
        ['同名多次声明', '`interface`', '合并成一份；`type` 同名报 `TS2300`'],
        ['给基本类型起别名', '`type`', '如 `type ID = string | number`']
      ] },

      { kind: 'demo', caption: 'interface 用 extends 继承另一个接口', code: [
        'interface Base {',
        '  id: number;',
        '}',
        '',
        'interface User extends Base {',
        '  name: string;',
        '}',
        '',
        'const u: User = { id: 1, name: \'ada\' };'
      ].join('\n'), checks: [
        'eqType(\'User\', \'{ id: number; name: string; }\', \'extends 把父接口的字段接了进来\')',
        'eq(memberNames(\'User\'), [\'id\', \'name\'], \'User 的属性\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '`type` 组合两个类型用的是交叉类型 `&`：`A & B` 同时具备 `A` 和 `B` 的全部字段。',
        '对象场景下 `interface A extends B` 和 `type A = B & { … }` 结果一样，而 `type` 的写法还能跟联合混用。'
      ].join('\n') },

      { kind: 'demo', caption: '交叉类型把两份形状合起来', code: [
        'type Pos = { x: number };',
        'type Pos3 = Pos & { z: number };',
        '',
        'const p: Pos3 = { x: 1, z: 2 };'
      ].join('\n'), checks: [
        'eqType(\'Pos3\', \'{ x: number; } & { z: number; }\', \'Pos3 是交叉类型\')',
        'eqType(\'p\', \'{ x: number; z: number; }\', \'p 同时满足两份形状\')',
        'noErrors()'
      ] },

      { kind: 'note', tone: 'tip', md: '类型兼容看的是**结构**，不是名字。两个类型只要字段对得上就能互相赋值；字段多出来的那个也能赋给字段少的，多出的部分被忽略。' },

      { kind: 'demo', caption: '名字不同、结构相同就能互相赋值', code: [
        'interface Point { x: number; y: number; }',
        'interface Coord { y: number; x: number; }',
        '',
        'const a: Point = { x: 1, y: 2 };',
        'const b: Coord = a;',
        '',
        'const wide = { x: 1, y: 2, label: \'start\' };',
        'const c: Point = wide;'
      ].join('\n'), checks: [
        'assignableTo(\'a\', \'{ x: number; y: number; }\', \'Point 与 Coord 结构相同\')',
        'eqType(\'b\', \'{ x: number; y: number; }\', \'b 的类型\')',
        'assignableTo(\'wide\', \'{ x: number; y: number; }\', \'字段更多也能赋给它\')',
        'noErrors()'
      ] },

      { kind: 'note', tone: 'warn', md: '对象字面量**直接**写在带类型的位置上会多查一步，多余属性报 `TS2353`；先存进变量再传就不会。这条只针对字面量。' },

      { kind: 'prose', md: [
        '## 声明合并',
        '',
        '同名的 `interface` 会**合并**成一份，字段加起来。同名 `type` 做不到，第二次声明直接报 `TS2300`。',
        '库的类型声明常靠这招给已有接口补字段，代价是重名不会被编译器拦住。'
      ].join('\n') },

      { kind: 'demo', caption: '两份同名 interface 自动合并', code: [
        'interface Box {',
        '  width: number;',
        '}',
        '',
        'interface Box {',
        '  height: number;',
        '}',
        '',
        'const b: Box = { width: 1, height: 2 };'
      ].join('\n'), checks: [
        'eqType(\'Box\', \'{ width: number; height: number; }\', \'两份声明合成一份\')',
        'eq(memberNames(\'Box\'), [\'height\', \'width\'], \'两个属性都在\')',
        'noErrors()'
      ] },

      { kind: 'exercise', id: 'ex05-1', title: '用 extends 接上父接口', task: [
        '`User` 想同时拥有 `Base` 里的 `id` 和自己声明的 `name`，现在少了一半。',
        '',
        '要求：`User` 同时有 `id: number` 和 `name: string`，最下面那句赋值不报错。'
      ].join('\n'), starter: [
        'interface Base {',
        '  id: number;',
        '}',
        '',
        'interface User {',
        '  name: string;',
        '}',
        '',
        'const u: User = { id: 1, name: \'ada\' };'
      ].join('\n'), solution: [
        'interface Base {',
        '  id: number;',
        '}',
        '',
        'interface User extends Base {',
        '  name: string;',
        '}',
        '',
        'const u: User = { id: 1, name: \'ada\' };'
      ].join('\n'), tests: [
        'eqType(\'User\', \'{ id: number; name: string; }\', \'User 同时有 id 与 name\')',
        'eq(memberNames(\'User\'), [\'id\', \'name\'], \'User 的属性\')',
        'noErrors(\'继承之后字面量里两个字段都能被接受\')'
      ], hints: [
        '两个 `interface` 之间用 `extends` 连起来：`interface User extends Base { … }`。',
        '继承来的字段不用在子接口里再写一遍。'
      ] },

      { kind: 'exercise', id: 'ex05-2', title: 'type 描述联合与元组', task: [
        '两个类型现在都太宽了，把它们收窄：',
        '',
        '- `Status` 只允许 `\'idle\'` 和 `\'busy\'` 两个字面量',
        '- `Pair` 是「正好两个数字」的元组',
        '',
        '下面两个变量的声明别动。'
      ].join('\n'), starter: [
        'type Status = string;',
        'type Pair = number[];',
        '',
        'let st: Status = \'idle\';',
        'const coords: Pair = [1, 2];'
      ].join('\n'), solution: [
        'type Status = \'idle\' | \'busy\';',
        'type Pair = [number, number];',
        '',
        'let st: Status = \'idle\';',
        'const coords: Pair = [1, 2];'
      ].join('\n'), tests: [
        'eqType(\'Status\', \'"idle" | "busy"\', \'Status 是联合\')',
        'eqType(\'Pair\', \'[number, number]\', \'Pair 是定长元组\')',
        'eqType(\'coords\', \'[number, number]\', \'coords 的类型\')',
        'noErrors()'
      ], hints: [
        '联合用 `|` 把几个字面量连起来：`\'idle\' | \'busy\'`。',
        '定长元组写成 `[元素类型, 元素类型]`，和 `number[]` 不是一回事。'
      ] },

      { kind: 'exercise', id: 'ex05-3', title: '先存进变量，多余属性就放行', task: [
        '下面把带 `label` 的字面量直接交给了 `plot`，编译器在多余属性上拦了下来。',
        '',
        '要求：先把这个对象存进变量 `raw`，再传进 `plot`，让代码不报错。`Point` 和 `plot` 都不要改。'
      ].join('\n'), starter: [
        'interface Point { x: number; y: number; }',
        '',
        'function plot(p: Point): string {',
        '  return p.x + \',\' + p.y;',
        '}',
        '',
        'const line = plot({ x: 1, y: 2, label: \'start\' });'
      ].join('\n'), solution: [
        'interface Point { x: number; y: number; }',
        '',
        'function plot(p: Point): string {',
        '  return p.x + \',\' + p.y;',
        '}',
        '',
        'const raw = { x: 1, y: 2, label: \'start\' };',
        'const line = plot(raw);'
      ].join('\n'), tests: [
        'assignableTo(\'raw\', \'{ x: number; y: number; }\', \'raw 在结构上满足 Point\')',
        'eqType(\'line\', \'string\', \'line 的类型\')',
        'noErrors(\'多余属性检查只对直接写出的字面量生效\')'
      ], hints: [
        '对象字面量直接写在带类型的位置上会触发多余属性检查，报 `TS2353`。',
        '先赋给一个没有注解的变量，把字面量「洗」成普通对象，再传进去就只看结构了。'
      ] },

      { kind: 'exercise', id: 'ex05-4', title: '同名 interface 合并', task: [
        '下面想用两份声明描述同一个 `Box`：一份给 `width`，一份给 `height`。',
        '',
        '现在用的是 `type`，重名直接报错。改成 `interface`，让两份声明合并成一份。'
      ].join('\n'), starter: [
        'type Box = { width: number };',
        'type Box = { height: number };',
        '',
        'const b: Box = { width: 1, height: 2 };'
      ].join('\n'), solution: [
        'interface Box {',
        '  width: number;',
        '}',
        '',
        'interface Box {',
        '  height: number;',
        '}',
        '',
        'const b: Box = { width: 1, height: 2 };'
      ].join('\n'), tests: [
        'eqType(\'Box\', \'{ width: number; height: number; }\', \'两份声明合并成一份\')',
        'eq(memberNames(\'Box\'), [\'height\', \'width\'], \'两个属性都在\')',
        'noErrors(\'同名 type 会报 TS2300\')'
      ], hints: [
        '`type` 不能重名，第二次声明报 `TS2300`；同名 `interface` 会自动合并。',
        '把两处 `type Box = { … }` 改成 `interface Box { … }`，字段内容不动。'
      ] },

      { kind: 'exercise', id: 'ex05-5', title: '只读与可选属性', task: [
        '`Config` 里的 `name` 建好之后不该再改，`retries` 也不是每次都要填。',
        '',
        '要求：',
        '',
        '- `name` 是只读属性',
        '- `retries` 是可选属性',
        '- 代码里没有类型错误（`c.name` 那行该删就删）'
      ].join('\n'), starter: [
        'interface Config {',
        '  name: string;',
        '  retries: number;',
        '}',
        '',
        'const c: Config = { name: \'server\' };',
        'c.name = \'cache\';'
      ].join('\n'), solution: [
        'interface Config {',
        '  readonly name: string;',
        '  retries?: number;',
        '}',
        '',
        'const c: Config = { name: \'server\' };'
      ].join('\n'), tests: [
        'eq(memberNames(\'Config\'), [\'name\', \'retries\'], \'两个属性都还在\')',
        'eqType(\'c\', \'{ readonly name: string; retries?: number | undefined; }\', \'c 的类型\')',
        'noErrors(\'name 只读、retries 可不填\')'
      ], hints: [
        '只读属性在名字前加 `readonly`，可选属性在名字后加 `?`。',
        '`name` 变成只读之后，后面那句 `c.name = …` 会报 `TS2540`，得删掉。'
      ] },

      { kind: 'prose', md: [
        '## 小结',
        '',
        '`interface` 用来描述对象和继承，`type` 用来给联合、元组这种类型起别名，对象形状上两者基本等价。',
        '合并形状用 `&` 或 `extends`，同名 `interface` 还会自动叠加字段。兼容性只认结构，名字无关紧要。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
