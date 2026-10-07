(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch06',
    title: '第 6 章 · 对象与解构',
    goal: '用键值对描述一件事物：会读写属性、理解引用语义、解构和展开用熟。',
    sections: [
      {
        kind: 'prose',
        md: [
          '对象把一堆相关的值挂在名字下面。点号 `obj.name` 读属性，方括号 `obj[key]` 在键是变量时用。',
          '',
          '属性不存在时读出 `undefined`（不会报错）；`delete obj.key` 删属性。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '读写属性',
        code: [
          'const user = { name: "小明", age: 18 };',
          'console.log(user.name, user["age"]);',
          '',
          'const key = "name";',
          'console.log(user[key]);        // 键是变量时必须用方括号',
          '',
          'user.city = "北京";             // 直接加新属性',
          'delete user.age;',
          'console.log(user, user.missing);'
        ].join('\n'),
        expect: "小明 18\n小明\n{ name: '小明', city: '北京' } undefined"
      },
      {
        kind: 'prose',
        md: [
          '对象是**引用类型**：变量存的是「指向那个对象」的地址，不是对象本身。',
          '',
          '- `const b = a` 之后，改 `b` 就是改 `a`，它们是同一个对象。',
          '- `a === b` 只有当两边指向同一个对象时才为真，长得一样也没用。',
          '- 想拿到一份独立的副本，得显式复制：`{ ...a }`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '引用语义',
        code: [
          'const a = { n: 1 };',
          'const b = a;',
          'b.n = 99;',
          'console.log(a.n);                        // a 也被改了',
          'console.log({ n: 1 } === { n: 1 });       // 长得一样但不是同一个',
          '',
          'const c = { ...a };                       // 浅拷贝',
          'c.n = 0;',
          'console.log(a.n, c.n);'
        ].join('\n'),
        expect: '99\nfalse\n99 0'
      },
      {
        kind: 'prose',
        md: [
          '**解构**把对象的属性直接拆进变量：`const { name, age } = user`。可以给默认值、可以改名（`{ name: who }`）、函数参数里也能用。',
          '',
          '**展开** `...` 用于浅拷贝和合并：`{ ...defaults, ...options }` 是配置合并的标准写法，后面的覆盖前面的。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '解构与展开',
        code: [
          'const user = { name: "小明", age: 18 };',
          'const { name, age } = user;',
          'const { name: who, city = "未知" } = user;',
          'console.log(name, age, who, city);',
          '',
          'console.log({ ...user, age: 19 });        // 覆盖一个属性',
          '',
          'const [first, second = "没有第二个"] = ["甲"];',
          'console.log(first, second);'
        ].join('\n'),
        expect: "小明 18 小明 未知\n{ name: '小明', age: 19 }\n甲 没有第二个"
      },
      {
        kind: 'prose',
        md: [
          '深层属性链上一旦有 `null` 或 `undefined`，直接读就会抛错。`?.`（可选链）遇到空值就整条表达式返回 `undefined`，不再往下走。',
          '',
          '`?.` 后面可以接属性、也可以接方法调用：`obj.fn?.()` 表示「有这个方法就调用」。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '可选链',
        code: [
          'const user = { name: "小明" };',
          'console.log(user.profile?.city);            // undefined，不报错',
          'console.log(user.profile?.city ?? "未知");  // 配合 ?? 给默认值',
          '',
          'try { console.log(user.profile.city); } catch (e) { console.log(e.name); }',
          '',
          'const api = { save: () => "已保存" };',
          'console.log(api.save?.(), api.remove?.());'
        ].join('\n'),
        expect: 'undefined\n未知\nTypeError\n已保存 undefined'
      },
      {
        kind: 'code',
        caption: '遍历对象',
        code: [
          'const scores = { 小明: 90, 小红: 85 };',
          'console.log(Object.keys(scores));',
          'console.log(Object.values(scores));',
          'console.log(Object.entries(scores));',
          '',
          'let total = 0;',
          'for (const [name, score] of Object.entries(scores)) total += score;',
          'console.log(total);'
        ].join('\n'),
        expect: "[ '小明', '小红' ]\n[ 90, 85 ]\n[ [ '小明', 90 ], [ '小红', 85 ] ]\n175"
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`{ ...a }` 只是**浅**拷贝：属性值本身还是对象时，两个副本共享同一个内层对象。要深拷贝得用 `structuredClone(a)`（浏览器和 Node 都有）。'
      },
      {
        kind: 'exercise',
        id: 'ex06-1',
        title: '挑出指定的键',
        task: [
          '补完 `pickProps(obj, keys)`：返回一个新对象，只包含 `keys` 里列出的、且 `obj` 里确实存在的属性。',
          '',
          '`pickProps({ a: 1, b: 2 }, ["a"])` 得到 `{ a: 1 }`。'
        ].join('\n'),
        starter: [
          'function pickProps(obj, keys) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function pickProps(obj, keys) {',
          '  const out = {};',
          '  for (const k of keys) {',
          '    if (k in obj) out[k] = obj[k];',
          '  }',
          '  return out;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(pickProps({ a: 1, b: 2 }, ['a']), { a: 1 });",
          "eq(pickProps({ a: 1 }, []), {});",
          "eq(pickProps({ a: 1 }, ['z']), {}, '不存在的键不能凭空造出 undefined 属性');",
          "eq(pickProps({ a: undefined }, ['a']), { a: undefined }, '值是 undefined 但键存在的，要保留');"
        ],
        hints: [
          '用 `k in obj` 判断键是否存在——`obj[k] !== undefined` 会把「值就是 undefined」的键也漏掉。',
          '结果对象的键要用方括号动态写入：`out[k] = obj[k]`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-2',
        title: '合并配置',
        task: [
          '补完 `mergeAll(...objs)`，把多个对象合并成一个新对象，**后面的覆盖前面的**。',
          '',
          '不要改动任何一个入参对象。'
        ].join('\n'),
        starter: [
          'function mergeAll(...objs) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function mergeAll(...objs) {',
          '  return Object.assign({}, ...objs);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(mergeAll({ a: 1 }, { b: 2 }), { a: 1, b: 2 });",
          "eq(mergeAll({ a: 1 }, { a: 3 }), { a: 3 }, '后面的覆盖前面的');",
          "eq(mergeAll(), {});",
          "(() => { const first = { a: 1 }; mergeAll(first, { a: 9 }); eq(first, { a: 1 }, '入参不能被改动'); })();"
        ],
        hints: [
          '`reduce` 也行：`objs.reduce((acc, o) => Object.assign(acc, o), {})`。',
          '注意别写 `Object.assign(objs[0], ...)`——那会直接改第一个入参。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-3',
        title: '安全取城市',
        task: [
          '补完 `cityOf(user)`：从 `user.profile.address.city` 取城市名，任何一层缺失就返回 `未知`。',
          '',
          '用可选链或 `??`，不要写一长串 `&&`。'
        ].join('\n'),
        starter: [
          'function cityOf(user) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function cityOf(user) {',
          '  return user?.profile?.address?.city ?? "未知";',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(cityOf({ profile: { address: { city: '北京' } } }), '北京');",
          "eq(cityOf({}), '未知');",
          "eq(cityOf({ profile: null }), '未知');",
          "eq(cityOf({ profile: { address: {} } }), '未知');"
        ],
        hints: [
          '每一层都可能空，所以写成 `user?.profile?.address?.city`。',
          '最后用 `?? "未知"` 兜底——`||` 可能碰巧也对，但键存在而值为空串时语义就错了。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-4',
        title: '拼成一行描述',
        task: [
          '补完 `describe(obj)`，把对象拼成 `键=值` 用 `, ` 连接的字符串。',
          '',
          '`describe({ name: "小明", age: 18 })` 得到 `"name=小明, age=18"`；空对象返回空字符串。'
        ].join('\n'),
        starter: [
          'function describe(obj) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function describe(obj) {',
          '  return Object.entries(obj)',
          '    .map(([k, v]) => `${k}=${v}`)',
          '    .join(", ");',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(describe({ name: '小明', age: 18 }), 'name=小明, age=18');",
          "eq(describe({}), '');",
          "eq(describe({ a: 1 }), 'a=1');"
        ],
        hints: [
          '`Object.entries(obj)` 得到 `[[键, 值], ...]`，解构成 `[k, v]` 再拼。',
          'map 出来之后 `join(", ")`，注意「逗号+空格」是两字符。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
