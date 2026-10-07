/* 第 3 章 · 联合与收窄。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch03',
    title: '第 3 章 · 联合与收窄',
    goal: '会用 typeof、真值、in、instanceof、字面量相等把联合类型收到具体那一支，能用判别联合加 never 把漏掉的分支变成编译错误，并分清 ?. / ?? / || 的用法。',
    sections: [
      { kind: 'prose', md: [
        '## 联合类型：先确定「是哪一个」',
        '`string | number` 这样的联合，类型系统只知道「可能是其中之一」。想调用某一支特有的方法，得先让编译器确定就是那一支，这一步叫**收窄**。',
        '',
        '- 收窄靠的是运行时的判断：`typeof`、真值、`in`、`instanceof`、字面量相等',
        '- 收窄只在那一个分支里生效，出了分支又回到联合',
        '',
        '不判断就用，会得到 `TS2339`：`string | number` 上不存在 `toFixed`。下面这个函数用 `typeof` 把两种输入分开，各自用各自的方法。'
      ].join('\n') },

      { kind: 'demo', caption: 'typeof 把 string 与 number 分开', code: [
        'function pad(x: string | number): string {',
        '  if (typeof x === \'number\') {',
        '    return x.toFixed(2);        // 这一支里 x 是 number',
        '  }',
        '  return x.trim();              // 这一支里 x 是 string',
        '}',
        '',
        'console.log(pad(3.14159));',
        'console.log(pad(\'  hi  \'));'
      ].join('\n'), run: true, checks: [
        'eqType(\'pad\', \'(x: string | number) => string\', \'pad 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'3.14\', \'hi\'], \'运行输出\')'
      ] },

      { kind: 'note', tone: 'tip', md: '`typeof` 只对原始类型靠谱。`typeof null` 也是 `\'object\'`，对象之间怎么分要看 `in`、判别联合或 `instanceof`。' },

      { kind: 'prose', md: [
        '## 真值收窄',
        '`if (x)` 会把「假值」全排除掉：`false`、`0`、`0n`、`\'\'`、`null`、`undefined`、`NaN`。',
        '去掉 `null | undefined` 是最常见的用法，代价是 `0` 和空字符串也一起被排掉了——要保留它们就写 `x !== undefined`。'
      ].join('\n') },

      { kind: 'demo', caption: '真值判断顺手把 undefined 排掉', code: [
        'function shout(s: string | undefined): string {',
        '  if (s) {                      // 排掉 undefined 和 \'\'',
        '    return s.toUpperCase();',
        '  }',
        '  return \'(空)\';',
        '}',
        '',
        'console.log(shout(\'hi\'));',
        'console.log(shout(\'\'));',
        'console.log(shout(undefined));'
      ].join('\n'), run: true, checks: [
        'eqType(\'shout\', \'(s: string | undefined) => string\', \'shout 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'HI\', \'(空)\', \'(空)\'], \'运行输出\')'
      ] },

      { kind: 'prose', md: [
        '## 可选链 `?.`',
        '属性可能不存在时直接点会报错；`?.` 在中间是 `null` 或 `undefined` 时立刻停下、返回 `undefined`，不再往下取。',
        '取到的结果是「值或 `undefined`」，所以后面常常配一个 `??` 兜底。'
      ].join('\n') },

      { kind: 'demo', caption: '可选链取嵌套属性', code: [
        'type User = { name: string; pet?: { nick: string } };',
        '',
        'function petName(u: User): string {',
        '  return u.pet?.nick ?? \'(无)\';',
        '}',
        '',
        'const u: User = { name: \'阿蓝\' };',
        '// console.log(u.pet.nick);      // ✗ TS18048：u.pet 可能为 undefined',
        'console.log(petName(u));',
        'console.log(u.pet?.nick);'
      ].join('\n'), run: true, checks: [
        'eqType(\'petName\', \'(u: User) => string\', \'petName 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'(无)\', \'undefined\'], \'运行输出\')'
      ] },

      { kind: 'prose', md: [
        '## `??` 与 `||` 不是一回事',
        '`a || b`：`a` 是任何假值就用 `b`。`a ?? b`：只有 `a` 是 `null` 或 `undefined` 才用 `b`。',
        '默认值场景里两者的差别集中在 `0`、`\'\'`、`false`——它们本来就是合法值，不该被默认值顶掉。'
      ].join('\n') },

      { kind: 'demo', caption: '同一个 0，两个运算符给出两种结果', code: [
        'function pick(n: number | null): number {',
        '  return n ?? 9;              // 只有 null / undefined 才用 9',
        '}',
        '',
        'function pickOr(n: number | null): number {',
        '  return n || 9;              // 0 也被当成「空」，同样用 9',
        '}',
        '',
        'console.log(pick(0));',
        'console.log(pickOr(0));',
        'console.log(pick(null));'
      ].join('\n'), run: true, checks: [
        'eqType(\'pick\', \'(n: number | null) => number\', \'pick 的类型\')',
        'eqType(\'pickOr\', \'(n: number | null) => number\', \'pickOr 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'0\', \'9\', \'9\'], \'运行输出\')'
      ] },

      { kind: 'prose', md: [
        '## `in` 与 `instanceof`',
        '上面几种判断只看值本身。要在一个对象联合里挑出一支，还有两个手段：',
        '',
        '- `\'a\' in x`：判断 `x` 有没有 `a` 属性，从而收窄到带 `a` 的那一支',
        '- `x instanceof Date`：判断 `x` 是不是某个类的实例，收窄到那个类'
      ].join('\n') },

      { kind: 'demo', caption: 'in 按属性区分两种形状', code: [
        'type Point = { x: number; y: number };',
        'type Circle = { r: number };',
        '',
        'function draw(s: Point | Circle): string {',
        '  if (\'x\' in s) {',
        '    return \'点 \' + s.x + \',\' + s.y;   // 这一支：Point',
        '  }',
        '  return \'半径 \' + s.r;                // 这一支：Circle',
        '}',
        '',
        'console.log(draw({ x: 1, y: 2 }));',
        'console.log(draw({ r: 5 }));'
      ].join('\n'), run: true, checks: [
        'eqType(\'draw\', \'(s: Point | Circle) => string\', \'draw 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'点 1,2\', \'半径 5\'], \'运行输出\')'
      ] },

      { kind: 'demo', caption: 'instanceof 按类区分', code: [
        'function amount(v: Date | string): number {',
        '  if (v instanceof Date) {',
        '    return v.getTime();',
        '  }',
        '  return v.length;',
        '}',
        '',
        'console.log(amount(new Date(0)));',
        'console.log(amount(\'abc\'));'
      ].join('\n'), run: true, checks: [
        'eqType(\'amount\', \'(v: Date | string) => number\', \'amount 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'0\', \'3\'], \'运行输出\')'
      ] },

      { kind: 'prose', md: [
        '## 判别联合',
        '每个成员放一个同名字段，值各不相同，通常是几个字面量。约定把字段叫 `kind`（`type`、`tag` 也行）。',
        '`switch (x.kind)` 之后，每个 `case` 里编译器自动收窄到对应那一支，比 `in` 更省事，也是建模数据最常用的方式。'
      ].join('\n') },

      { kind: 'demo', caption: '判别联合 + never 兜底', code: [
        'type Shape =',
        '  | { kind: \'circle\'; r: number }',
        '  | { kind: \'square\'; side: number }',
        '  | { kind: \'rect\'; w: number; h: number };',
        '',
        'function assertNever(x: never): never {',
        '  throw new Error(\'未处理的分支\');',
        '}',
        '',
        'function area(s: Shape): number {',
        '  switch (s.kind) {',
        '    case \'circle\': return 3.14 * s.r * s.r;',
        '    case \'square\': return s.side * s.side;',
        '    case \'rect\': return s.w * s.h;',
        '    default: return assertNever(s);',
        '  }',
        '}',
        '',
        'console.log(area({ kind: \'rect\', w: 3, h: 4 }));'
      ].join('\n'), run: true, checks: [
        'eqType(\'area\', \'(s: Shape) => number\', \'area 的类型\')',
        'eqType(\'assertNever\', \'(x: never) => never\', \'assertNever 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'12\'], \'运行输出\')'
      ] },

      { kind: 'prose', md: [
        '## 用 `never` 兜住漏掉的分支',
        '判别联合的 `switch` 把所有 `case` 写全之后，`default` 里剩下的类型就是 `never`。',
        '把 `default` 交给一个只收 `never` 的函数：将来往联合里加了新成员、忘了处理，编译器会在那一行报 `TS2345`。错误从运行时的「没走到」提前到了编译期。'
      ].join('\n') },

      { kind: 'note', tone: 'tip', md: '不写 `default` 也行：给函数标上返回类型，漏掉一个分支会报 `TS2366`（函数缺少结束 return）。两种写法都能把遗漏变成编译错误，`never` 那种还能顺带处理「不可能的值」。' },

      { kind: 'prose', md: [
        '## `strict` 下的 undefined',
        '`strict` 打开时，`strictNullChecks` 也在管着：可能为 `undefined` 的值不判断就用，会被拦下来。',
        '',
        '- `TS18048`：值可能为 `undefined`。`s` 是 `string | undefined` 时直接用 `s.length` 就是它',
        '- `TS2532`：对象可能为 `undefined`。开着 `noUncheckedIndexedAccess` 时，`arr[0]` 的类型是「元素或 `undefined`」，再点属性就是它',
        '',
        '把 `strict` 关掉，`TS18048` 会消失，同一段代码也就失去了这层保护。'
      ].join('\n') },

      { kind: 'demo', caption: 'TS18048：可能为 undefined', code: [
        'function len(s: string | undefined): number {',
        '  return s.length;                 // ✗ TS18048：s 可能为 undefined',
        '}',
        '',
        'function safeLen(s: string | undefined): number {',
        '  if (s === undefined) return 0;',
        '  return s.length;                 // ✓ 这一支里 s 已经是 string',
        '}'
      ].join('\n'), checks: [
        'errorAt(2, 18048, \'第 2 行该报 TS18048\')',
        'hasError(18048)',
        'noErrorAt(7, \'判断之后这一行不该报错\')',
        'eqType(\'safeLen\', \'(s: string | undefined) => number\', \'safeLen 的类型\')'
      ] },

      { kind: 'demo', caption: 'TS2532：对象可能为 undefined', tsconfig: { noUncheckedIndexedAccess: true }, code: [
        '// 索引可能为 undefined 是第 4 章的话题，这里只看它带来的错误',
        'const rows: { n: number }[] = [{ n: 1 }];',
        '',
        'function firstN(): number {',
        '  return rows[0].n;                // ✗ TS2532：rows[0] 可能为 undefined',
        '}'
      ].join('\n'), checks: [
        'errorAt(5, 2532, \'第 5 行该报 TS2532\')',
        'hasError(2532)'
      ] },

      { kind: 'table', head: ['写法', '收窄成什么', '什么时候用'], rows: [
        ['`typeof x === \'string\'`', '`string`', '原始类型之间区分'],
        ['`if (x)`', '去掉 `undefined` / `null` / `\'\'` / `0`', '只关心「有没有值」'],
        ['`\'x\' in a`', '带 `x` 属性那一支', '对象联合，靠字段区分'],
        ['`a instanceof Date`', '`Date`', '类实例'],
        ['`a.kind === \'ok\'`', '`kind` 为 `\'ok\'` 的那一支', '判别联合'],
        ['`a?.b`', '整条取值链变 `值 | undefined`', '属性可能缺席时，别直接点']
      ] },

      { kind: 'exercise', id: 'ex03-1', title: '把松散对象改成判别联合', task: [
        '`Action` 现在是一个「所有字段都有」的对象：`kind` 是宽的 `string`，`x` 和 `code` 永远都在。',
        '把它改成两个成员组成的判别联合，让 `handle` 的 `switch` 真的能收窄。',
        '',
        '要求：',
        '- 成员一：`kind` 是 `\'click\'`，只有 `x: number`',
        '- 成员二：`kind` 是 `\'key\'`，只有 `code: string`',
        '- `assertNever` 不动；改完 `default` 里的 `a` 应当是 `never`（现在它还是 `Action`，报 `TS2345`）',
        '- 没有类型错误'
      ].join('\n'), starter: [
        'type Action = { kind: string; x: number; code: string };',
        '',
        'function assertNever(x: never): never {',
        '  throw new Error(\'unreachable\');',
        '}',
        '',
        'function handle(a: Action): string {',
        '  switch (a.kind) {',
        '    case \'click\': return \'x=\' + a.x;',
        '    case \'key\': return \'key \' + a.code.toUpperCase();',
        '    default: return assertNever(a);',
        '  }',
        '}'
      ].join('\n'), solution: [
        'type Action =',
        '  | { kind: \'click\'; x: number }',
        '  | { kind: \'key\'; code: string };',
        '',
        'function assertNever(x: never): never {',
        '  throw new Error(\'unreachable\');',
        '}',
        '',
        'function handle(a: Action): string {',
        '  switch (a.kind) {',
        '    case \'click\': return \'x=\' + a.x;',
        '    case \'key\': return \'key \' + a.code.toUpperCase();',
        '    default: return assertNever(a);',
        '  }',
        '}'
      ].join('\n'), tests: [
        'noErrors(\'两个成员各自只带自己那个字段，default 里才收得到 never\')',
        'eqType(\'handle\', \'(a: Action) => string\', \'handle 的类型\')'
      ], hints: [
        '用 `|` 把几个对象类型连起来，每个对象的 `kind` 写成一个不同的字面量，比如 `\'click\'`。',
        '`x` 只放在 `click` 那个成员里、`code` 只放在 `key` 那个成员里，`switch` 才收得干净。'
      ] },

      { kind: 'exercise', id: 'ex03-2', title: '先判 undefined 再取长度', task: [
        '`size` 接收一个可能为 `undefined` 的数组，直接取 `length` 在 `strict` 下会报 `TS18048`。',
        '改成：没有数组时返回 `0`，有数组时返回长度。',
        '',
        '要求：`size` 的类型仍是 `(items: string[] | undefined) => number`；没有类型错误；运行输出第一行 `0`、第二行 `2`。'
      ].join('\n'), starter: [
        'function size(items: string[] | undefined): number {',
        '  return items.length;',
        '}',
        '',
        'console.log(size(undefined));',
        'console.log(size([\'a\', \'b\']));'
      ].join('\n'), solution: [
        'function size(items: string[] | undefined): number {',
        '  if (items === undefined) return 0;',
        '  return items.length;',
        '}',
        '',
        'console.log(size(undefined));',
        'console.log(size([\'a\', \'b\']));'
      ].join('\n'), tests: [
        'eqType(\'size\', \'(items: string[] | undefined) => number\', \'size 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'0\', \'2\'], \'运行输出\')'
      ], hints: [
        '判断用 `items === undefined`。写成 `!items` 也行，但那时空数组也会走默认分支，含义不一样。',
        '先把「没有数组」这一支返回，后面剩下的代码里编译器就知道 `items` 是数组了。'
      ] },

      { kind: 'exercise', id: 'ex03-3', title: '给 switch 补一个 never 兜底', task: [
        '`weight` 现在用一个 `return 0;` 兜底，将来给 `Level` 加新成员，编译器不会提醒。',
        '改成穷尽写法：写一个 `assertNever(x: never): never`，把它放进 `switch` 的 `default` 分支，删掉那句 `return 0;`。',
        '',
        '要求：函数名就叫 `assertNever`，类型是 `(x: never) => never`；`weight` 仍是 `(l: Level) => number`；没有类型错误。'
      ].join('\n'), starter: [
        'type Level = \'low\' | \'mid\' | \'high\';',
        '',
        'function weight(l: Level): number {',
        '  switch (l) {',
        '    case \'low\': return 1;',
        '    case \'mid\': return 2;',
        '    case \'high\': return 4;',
        '  }',
        '  return 0;',
        '}'
      ].join('\n'), solution: [
        'type Level = \'low\' | \'mid\' | \'high\';',
        '',
        'function assertNever(x: never): never {',
        '  throw new Error(\'未处理的层级\');',
        '}',
        '',
        'function weight(l: Level): number {',
        '  switch (l) {',
        '    case \'low\': return 1;',
        '    case \'mid\': return 2;',
        '    case \'high\': return 4;',
        '    default: return assertNever(l);',
        '  }',
        '}'
      ].join('\n'), tests: [
        'noErrors()',
        'eqType(\'weight\', \'(l: Level) => number\', \'weight 的类型\')',
        'exists(\'assertNever\', \'requires assertNever\')',
        'eqType(\'assertNever\', \'(x: never) => never\', \'assertNever 的类型\')'
      ], hints: [
        '`assertNever` 参数类型写 `never`，函数体 `throw new Error(…)`，返回类型也写 `never`。',
        '三个 `case` 都写全之后，`default` 里的 `l` 已经是 `never`，正好当 `assertNever` 的实参。'
      ] },

      { kind: 'exercise', id: 'ex03-4', title: '默认值别用 ||', task: [
        '`greet` 用 `name || \'路人\'` 兜底，结果空字符串也被顶掉了。空字符串是合法名字，只有 `null` / `undefined` 才该用默认值。',
        '只改一个运算符。',
        '',
        '要求：`greet` 的类型是 `(name: string | null) => string`；没有类型错误；运行输出第一行 `你好，`（空名字）、第二行 `你好，路人`。'
      ].join('\n'), starter: [
        'function greet(name: string | null): string {',
        '  const who = name || \'路人\';',
        '  return \'你好，\' + who;',
        '}',
        '',
        'console.log(greet(\'\'));',
        'console.log(greet(null));'
      ].join('\n'), solution: [
        'function greet(name: string | null): string {',
        '  const who = name ?? \'路人\';',
        '  return \'你好，\' + who;',
        '}',
        '',
        'console.log(greet(\'\'));',
        'console.log(greet(null));'
      ].join('\n'), tests: [
        'eqType(\'greet\', \'(name: string | null) => string\', \'greet 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'你好，\', \'你好，路人\'], \'空名字要保住，null 才兜底\')'
      ], hints: [
        '`||` 在左边是假值时就走右边，`0` 和 `\'\'` 都算假值。',
        '只有 `null` / `undefined` 才算「没给值」，对应的运算符是 `??`。'
      ] },

      { kind: 'exercise', id: 'ex03-5', title: '用 instanceof 分开两种输入', task: [
        '`amount` 接收 `Date | string`：`Date` 返回毫秒数，`string` 返回长度。现在它对两者都取 `length`，编译器报 `TS2339`。',
        '先用 `instanceof` 挑出 `Date` 那一支。',
        '',
        '要求：`amount` 的类型是 `(v: Date | string) => number`；没有类型错误；运行输出第一行 `0`、第二行 `3`。'
      ].join('\n'), starter: [
        'function amount(v: Date | string): number {',
        '  return v.length;',
        '}',
        '',
        'console.log(amount(new Date(0)));',
        'console.log(amount(\'abc\'));'
      ].join('\n'), solution: [
        'function amount(v: Date | string): number {',
        '  if (v instanceof Date) return v.getTime();',
        '  return v.length;',
        '}',
        '',
        'console.log(amount(new Date(0)));',
        'console.log(amount(\'abc\'));'
      ].join('\n'), tests: [
        'eqType(\'amount\', \'(v: Date | string) => number\', \'amount 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'0\', \'3\'], \'运行输出\')'
      ], hints: [
        '`v instanceof Date` 只对类实例成立，判断之后 `v` 就收窄到 `Date`。',
        '剩下的分支里 `v` 是 `string`，这时 `length` 才合法。'
      ] },

      { kind: 'prose', md: [
        '## 这一章的手感',
        '联合描述「值有几种可能」，收窄负责让编译器相信此刻是哪一种。',
        '判断手段有 `typeof`、真值、`in`、`instanceof`、字面量相等；建模上最省心的是判别联合，配 `never` 兜底能把漏处理的分支变成编译错误。',
        '可能缺席的值用 `?.` 取值、用 `??` 兜底；默认值场景里的 `||` 要留意 `0` 和空字符串。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
