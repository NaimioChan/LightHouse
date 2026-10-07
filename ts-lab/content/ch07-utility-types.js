/* 第 7 章 · 工具类型。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch07',
    title: '第 7 章 · 工具类型',
    goal: '学会用标准库的工具类型从已有类型派生新类型，看懂映射类型，并能自己写一个。',
    sections: [
      { kind: 'prose', md: [
        '同一个实体在不同场景下要的类型往往只差几个字段：服务端返回的完整 `User`、表单里还没填完的 `User`、',
        '对外展示时要去掉密码的 `User`。为每个场景各手抄一份对象类型，字段一多就会漏写、会不同步。',
        '',
        '**工具类型**是标准库里的一批泛型别名，作用是从一个已有的类型派生出新类型。',
        '它们不产生运行时代码，只改编译期看到的形状。这一章先过一遍常用的几个，再看它们底下的**映射类型**，最后自己写一个。'
      ].join('\n') },

      { kind: 'demo', caption: 'Partial 让字段可选，Required 让字段必填', code: [
        'interface User { name: string; age: number; }',
        '',
        'type Draft = Partial<User>;',
        'type Filled = Required<{ nickname?: string }>;',
        '',
        'const d: Draft = { name: \'ann\' };',
        'const f: Filled = { nickname: \'ann\' };'
      ].join('\n'), checks: [
        'eqType(\'Draft\', \'{ name?: string; age?: number }\', \'Partial 把每个属性都变成可选\')',
        'eqType(\'Filled\', \'{ nickname: string }\', \'Required 把可选属性变成必填\')',
        'eq(memberNames(\'Draft\'), [\'age\', \'name\'], \'属性名不变\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '`Partial<T>` 给 `T` 的每个属性加上 `?`，`Required<T>` 反过来去掉 `?`。两者都不增删属性，也不改属性的类型。',
        '',
        '- 表单草稿用 `Partial`：还没填的字段允许缺席，上面 `d` 少写 `age` 也不报错。',
        '- 配置合并完用 `Required`：默认值补齐之后每个字段都保证有值，`f` 少写 `nickname` 会报 `TS2741`。'
      ].join('\n') },

      { kind: 'demo', caption: 'Readonly 挡住赋值', code: [
        'interface Config { mode: string; }',
        '',
        'const cfg: Readonly<Config> = { mode: \'dark\' };',
        'cfg.mode = \'light\';'
      ].join('\n'), checks: [
        'eqType(\'cfg\', \'{ mode: string }\', \'eqType 看不见 readonly，形状和普通对象一样\')',
        'errorAt(4, 2540, \'给只读属性赋值要报 TS2540\')'
      ] },

      { kind: 'note', tone: 'tip', md: '`eqType` 判等价时不看 `readonly`，所以 `Readonly<Config>` 与 `{ mode: string }` 会被判成同一个类型。要断言只读，就给属性赋个值，再看 `TS2540` 有没有出现。' },

      { kind: 'prose', md: [
        '`Pick<T, K>` 只保留 `T` 里 `K` 列出的键，`Omit<T, K>` 反过来去掉这些键。`K` 是键名组成的联合，',
        '写成 `\'id\' | \'name\'` 这样。',
        '',
        '同一份 `User`：列表页只要 `id` 和 `name`（用 `Pick`），对外的接口要去掉 `email`（用 `Omit`）。',
        '两处都从 `User` 派生，以后 `User` 改了字段，派生出来的会自动跟上。'
      ].join('\n') },

      { kind: 'demo', caption: 'Pick 取子集，Omit 去字段', code: [
        'interface User { id: number; name: string; email: string; }',
        '',
        'type Card = Pick<User, \'id\' | \'name\'>;',
        'type Safe = Omit<User, \'id\'>;',
        '',
        'const c: Card = { id: 1, name: \'ann\' };',
        'const s: Safe = { name: \'ann\', email: \'ann@example.com\' };'
      ].join('\n'), checks: [
        'eqType(\'Card\', \'{ id: number; name: string }\', \'Pick 只留列出的键\')',
        'eqType(\'Safe\', \'{ name: string; email: string }\', \'Omit 去掉列出的键\')',
        'eq(memberNames(\'Safe\'), [\'email\', \'name\'], \'Safe 只剩两个键\')',
        'noErrors()'
      ] },

      { kind: 'table', head: ['工具类型', '把 T 变成', '常见用处'], rows: [
        ['`Partial<T>`', '所有属性可选', '更新用的补丁对象'],
        ['`Required<T>`', '所有属性必填', '填过默认值之后的配置'],
        ['`Readonly<T>`', '所有属性只读', '不希望被改的常量配置'],
        ['`Pick<T, K>`', '只留 K 这些键', '列表项、摘要卡片'],
        ['`Omit<T, K>`', '去掉 K 这些键', '对外暴露时抹掉敏感字段'],
        ['`Record<K, T>`', '一组 K 到 T 的映射', '字典、按 id 索引的表'],
        ['`Exclude<T, U>`', '从联合里去掉 U', '过滤掉某几个取值'],
        ['`Extract<T, U>`', '只留属于 U 的', '挑出某几个取值'],
        ['`NonNullable<T>`', '去掉 null 与 undefined', '收掉可空'],
        ['`ReturnType<F>`', '函数 F 的返回类型', '从实现里取回类型'],
        ['`Parameters<F>`', '参数组成的元组', '转发调用'],
        ['`Awaited<T>`', '拆掉 Promise 一层', '拿到 await 之后的类型']
      ] },

      { kind: 'prose', md: [
        '工具类型不是编译器里的魔法。它们几乎都是**映射类型**：拿 `keyof T` 遍历每个键，再决定那个键在新类型里长什么样。',
        '',
        '`{ [K in keyof T]: T[K] }` 是最朴素的映射，生成一个和 `T` 一模一样的形状。在映射里给键后面加 `?` 就是全可选，',
        '这正是 `Partial` 的写法；给键前面加 `readonly` 就是全只读，这是 `Readonly` 的写法。自己写一个并不比调用难多少。'
      ].join('\n') },

      { kind: 'demo', caption: '手写 Partial 与 Readonly', code: [
        'interface User { name: string; age: number; }',
        '',
        'type MyReadonly<T> = { readonly [K in keyof T]: T[K] };',
        'type MyPartial<T> = { [K in keyof T]?: T[K] };',
        '',
        'type Ro = MyReadonly<User>;',
        'type Pa = MyPartial<User>;',
        '',
        'const pa: Pa = { name: \'ann\' };',
        'const ro: Ro = { name: \'ann\', age: 1 };',
        'ro.name = \'bob\';'
      ].join('\n'), checks: [
        'eqType(\'Pa\', \'{ name?: string; age?: number }\', \'MyPartial 的形状和 Partial 一致\')',
        'eqType(\'Ro\', \'{ name: string; age: number }\', \'MyReadonly 形状原样，只读看不出来\')',
        'eqType(\'pa\', \'{ name?: string; age?: number }\', \'pa 的类型\')',
        'errorAt(11, 2540, \'手写的 readonly 一样能挡住赋值\')'
      ] },

      { kind: 'prose', md: [
        '有些类型藏在函数实现里，手抄一遍容易和实现脱节。`ReturnType<F>` 取函数类型 `F` 的返回值类型，',
        '`Parameters<F>` 取参数组成的元组。把函数本身交给它们时要写 `typeof`：`ReturnType<typeof makeUser>`——',
        '`makeUser` 是值，`typeof makeUser` 才是它的函数类型。',
        '',
        '`Awaited<T>` 拆掉 `Promise` 一层，`Awaited<Promise<string>>` 就是 `string`。'
      ].join('\n') },

      { kind: 'demo', caption: '从函数里取回类型', code: [
        'function makeUser(name: string, age: number) {',
        '  return { name, age };',
        '}',
        '',
        'type Made = ReturnType<typeof makeUser>;',
        'type Args = Parameters<typeof makeUser>;',
        'type Unwrap = Awaited<Promise<string>>;',
        '',
        'const u: Made = { name: \'ann\', age: 3 };',
        'const args: Args = [\'ann\', 3];',
        'const s: Unwrap = \'x\';'
      ].join('\n'), checks: [
        'eqType(\'Made\', \'{ name: string; age: number }\', \'ReturnType 取回返回类型\')',
        'eqType(\'Args\', \'[string, number]\', \'Parameters 是参数元组，参数名不影响比较\')',
        'eqType(\'Unwrap\', \'string\', \'Awaited 拆掉 Promise\')',
        'eqType(\'u\', \'{ name: string; age: number }\', \'u 的类型来自 makeUser\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '还有几个专门处理联合与字典的：`Exclude<T, U>` 从联合 `T` 里去掉能赋给 `U` 的成员，`Extract<T, U>` 只留能赋给 `U` 的。',
        '`NonNullable<T>` 去掉 `null` 与 `undefined`，等价于 `Exclude<T, null | undefined>`。',
        '`Record<K, T>` 造一个键来自 `K`、值都是 `T` 的对象，写字典或按 id 索引的表很方便。'
      ].join('\n') },

      { kind: 'demo', caption: '过滤联合与造字典', code: [
        'type Role = \'admin\' | \'editor\' | \'guest\';',
        '',
        'type GuestOnly = Exclude<Role, \'admin\' | \'editor\'>;',
        'type Staff = Extract<Role, \'admin\' | \'editor\'>;',
        'type Real = NonNullable<string | null>;',
        'type Scores = Record<string, number>;',
        '',
        'const g: GuestOnly = \'guest\';',
        'const sc: Scores = { math: 90 };'
      ].join('\n'), checks: [
        'eqType(\'GuestOnly\', \'"guest"\', \'Exclude 去掉两个成员，只剩一个\')',
        'eqType(\'Staff\', \'"admin" | "editor"\', \'Extract 只留给定的那几个\')',
        'eqType(\'Real\', \'string\', \'NonNullable 去掉 null\')',
        'eqType(\'sc\', \'{ [x: string]: number }\', \'Record 生成索引签名对象\')',
        'noErrors()'
      ] },

      { kind: 'exercise', id: 'ex07-1', title: '用 Partial 表达「只改一部分」', task: [
        '`applyPatch` 现在要求传入完整的 `User`，于是只改一个字段的调用被拒了。',
        '',
        '把 `patch` 参数改成「一部分字段」：类型是 `Partial<User>`。其余代码保留，包括最后一行的调用。'
      ].join('\n'), starter: [
        'interface User { name: string; age: number; }',
        '',
        'function applyPatch(base: User, patch: User): User {',
        '  return { ...base, ...patch };',
        '}',
        '',
        'const u = applyPatch({ name: \'ann\', age: 1 }, { age: 2 });'
      ].join('\n'), solution: [
        'interface User { name: string; age: number; }',
        '',
        'function applyPatch(base: User, patch: Partial<User>): User {',
        '  return { ...base, ...patch };',
        '}',
        '',
        'const u = applyPatch({ name: \'ann\', age: 1 }, { age: 2 });'
      ].join('\n'), tests: [
        'eqType(\'applyPatch\', \'(base: { name: string; age: number }, patch: { name?: string; age?: number }) => { name: string; age: number }\', \'patch 应该换成 Partial\')',
        'eqType(\'u\', \'{ name: string; age: number }\', \'u 仍然是完整的 User\')',
        'noErrors(\'补丁只传一部分字段时不该报错\')'
      ], hints: [
        '`Partial<User>` 把 `User` 的每个属性都变成可选，正好对应「补丁里可以有任意子集」。',
        '只改 `patch` 那一处注解；`{ ...base, ...patch }` 合并出来的结果仍然是完整的 `User`。'
      ] },

      { kind: 'exercise', id: 'ex07-2', title: '手写一个 MyPick', task: [
        '照着 `{ [K in keyof T]: T[K] }` 的思路，把 `MyPick<T, K>` 补成 `Pick` 那样：`K` 只能是 `T` 的键。',
        '',
        '现在 `K` 没有约束，映射和取值都会报错。改完之后 `p` 应该只剩 `name` 一个键。'
      ].join('\n'), starter: [
        'type MyPick<T, K> = { [P in K]: T[P] };',
        '',
        'interface User { name: string; age: number; }',
        '',
        'const p: MyPick<User, \'name\'> = { name: \'ann\' };'
      ].join('\n'), solution: [
        'type MyPick<T, K extends keyof T> = { [P in K]: T[P] };',
        '',
        'interface User { name: string; age: number; }',
        '',
        'const p: MyPick<User, \'name\'> = { name: \'ann\' };'
      ].join('\n'), tests: [
        'eqType(\'p\', \'{ name: string }\', \'MyPick 只留 name 键\')',
        'eq(memberNames(\'p\'), [\'name\'], \'p 只有一个键\')',
        'noErrors()'
      ], hints: [
        '`K` 要约束成 `T` 的键：写成 `K extends keyof T`。',
        '`[P in K]` 要求 `K` 的成员是 `string | number | symbol` 之一，`keyof T` 正好满足。'
      ] },

      { kind: 'exercise', id: 'ex07-3', title: '用 ReturnType 取返回类型', task: [
        '`Made` 现在标成 `any`，`u` 拿不到任何类型信息。',
        '',
        '把它改成 `ReturnType<typeof makeUser>`，让 `Made` 等于 `makeUser` 的返回类型。函数体不用动。'
      ].join('\n'), starter: [
        'function makeUser(name: string) {',
        '  return { name, active: true };',
        '}',
        '',
        'type Made = any;',
        '',
        'const u: Made = makeUser(\'ann\');'
      ].join('\n'), solution: [
        'function makeUser(name: string) {',
        '  return { name, active: true };',
        '}',
        '',
        'type Made = ReturnType<typeof makeUser>;',
        '',
        'const u: Made = makeUser(\'ann\');'
      ].join('\n'), tests: [
        'eqType(\'Made\', \'{ name: string; active: boolean }\', \'Made 应该是 makeUser 的返回类型\')',
        'eqType(\'u\', \'{ name: string; active: boolean }\', \'u 跟着 Made 走\')',
        'noErrors()'
      ], hints: [
        '取函数类型要用 `typeof`：`makeUser` 是值，`typeof makeUser` 才是它的类型。',
        '`ReturnType<F>` 里填的是函数类型 `F`，不是函数本身。'
      ] },

      { kind: 'exercise', id: 'ex07-4', title: '用 Required 表达「已经填全」', task: [
        '`withDefaults` 补完默认值之后，返回值里每个字段其实都有。',
        '',
        '把返回类型改成 `Required<Settings>`，让 `s` 的字段不再是可选。`?? 50` 那几行不用动。'
      ].join('\n'), starter: [
        'interface Settings { volume?: number; muted?: boolean; }',
        '',
        'function withDefaults(s: Settings): Settings {',
        '  return { volume: s.volume ?? 50, muted: s.muted ?? false };',
        '}',
        '',
        'const s = withDefaults({});'
      ].join('\n'), solution: [
        'interface Settings { volume?: number; muted?: boolean; }',
        '',
        'function withDefaults(s: Settings): Required<Settings> {',
        '  return { volume: s.volume ?? 50, muted: s.muted ?? false };',
        '}',
        '',
        'const s = withDefaults({});'
      ].join('\n'), tests: [
        'eqType(\'s\', \'{ volume: number; muted: boolean }\', \'s 的字段应该都是必填\')',
        'eqType(\'withDefaults\', \'(s: { volume?: number; muted?: boolean }) => { volume: number; muted: boolean }\', \'withDefaults 的返回类型\')',
        'noErrors()'
      ], hints: [
        '`Required<T>` 去掉 `T` 所有属性上的 `?`。',
        '只改返回类型那一处注解；`s.volume ?? 50` 得到的就是 `number`，满足 `Required`。'
      ] },

      { kind: 'exercise', id: 'ex07-5', title: '用 Omit 抹掉敏感字段', task: [
        '`PublicAccount` 现在就是 `Account`，把 `password` 一起暴露了。',
        '',
        '把它改成从 `Account` 里去掉 `password`，并让 `pub` 不再带这个字段。'
      ].join('\n'), starter: [
        'interface Account { id: number; name: string; password: string; }',
        '',
        'type PublicAccount = Account;',
        '',
        'const pub: PublicAccount = { id: 1, name: \'ann\', password: \'x\' };'
      ].join('\n'), solution: [
        'interface Account { id: number; name: string; password: string; }',
        '',
        'type PublicAccount = Omit<Account, \'password\'>;',
        '',
        'const pub: PublicAccount = { id: 1, name: \'ann\' };'
      ].join('\n'), tests: [
        'eqType(\'PublicAccount\', \'{ id: number; name: string }\', \'PublicAccount 应该没有 password\')',
        'eq(memberNames(\'PublicAccount\'), [\'id\', \'name\'], \'只剩两个键\')',
        'noErrors()'
      ], hints: [
        '`Omit<T, K>` 去掉 `K` 列出的键；去掉一个键写成 `Omit<Account, \'password\'>`。',
        '改完类型后，`pub` 那一行也要去掉 `password`，否则对象字面量会报 `TS2353`（多余属性）。'
      ] },

      { kind: 'prose', md: [
        '工具类型的价值是**从一处类型派生多处**：字段增删只改源头，派生出来的跟着变。',
        '',
        '先查标准库里有没有现成的：`Partial`、`Pick`、`Omit`、`ReturnType` 覆盖了大部分场景。',
        '覆盖不到时，用映射类型 `{ [K in keyof T]: … }` 自己写一个，比手抄一整份对象类型更难出错。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
