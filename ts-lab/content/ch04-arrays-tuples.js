/* 第 4 章 · 数组、元组与索引签名。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch04',
    title: '第 4 章 · 数组、元组与索引签名',
    goal: '给成组的、定长的、以及键不固定的数据各自挑对类型：数组、元组、索引签名与 Record。',
    sections: [
      { kind: 'prose', md: [
        '## 数组：元素类型的方括号',
        '数组类型写成「元素类型 + `[]`」。`number[]` 是一串数字，`string[]` 是一串字符串。',
        '`Array<number>` 是同一件事的另一种写法，两者完全等价：',
        '- `const a: number[] = [1, 2, 3];`',
        '- `const b: Array<string> = [\'x\', \'y\'];`',
        '',
        '元素类型本身是联合时，要拿括号把它圈起来：`(number | string)[]` 表示「数字或字符串组成的数组」，',
        '不写括号含义就变了。'
      ].join('\n') },

      { kind: 'demo', caption: '方括号写法与泛型写法是同一个类型', code: [
        'const a: number[] = [1, 2, 3];',
        'const b: Array<string> = [\'x\', \'y\'];',
        'const c: (number | string)[] = [1, \'x\'];'
      ].join('\n'), checks: [
        'eqType(\'a\', \'number[]\', \'a 的类型\')',
        'eqType(\'b\', \'string[]\', \'Array<string> 与 string[] 等价\')',
        'eqType(\'c\', \'(number | string)[]\', \'联合元素类型要加括号\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 只读数组',
        '在元素类型前面加 `readonly`，得到的就是**只读数组**：能读、能遍历，但不能改。',
        '`push`、`splice`、下标赋值这些会改动内容的方法通通不见了。',
        '`ReadonlyArray<string>` 与 `readonly string[]` 等价。',
        '',
        '只读数组常用来接「别人传进来、约定不改」的参数。它也让类型更难被无意破坏。'
      ].join('\n') },

      { kind: 'demo', caption: '只读数组能读不能改', code: [
        'const xs: readonly number[] = [1, 2, 3];',
        'const ys: ReadonlyArray<string> = [\'a\', \'b\'];',
        '// xs.push(4);   // ✗ TS2339：只读数组上没有 push',
        'const n: number = xs[0];'
      ].join('\n'), checks: [
        'eqType(\'xs\', \'readonly number[]\', \'xs 的类型\')',
        'eqType(\'ys\', \'readonly string[]\', \'ys 的类型\')',
        'eqType(\'n\', \'number\', \'读出来的元素还是 number\')',
        'noErrors()'
      ] },

      { kind: 'table', head: ['写法', '类型', '说明'], rows: [
        ['`number[]`', '`number[]`', '任意长度的数字序列'],
        ['`Array<number>`', '`number[]`', '等价的泛型写法'],
        ['`readonly number[]`', '`readonly number[]`', '不能 push、不能下标赋值'],
        ['`[number, string]`', '`[number, string]`', '元组：长度固定，每位类型固定'],
        ['`{ [k: string]: number }`', '`{ [k: string]: number }`', '任意字符串键都合法，值必须是数字']
      ] },

      { kind: 'prose', md: [
        '## 元组：长度与每位类型都固定',
        '数组说「每个元素都是 `T`」，不管长度。要是长度和每一位的类型都定死了，用**元组**：',
        '方括号里逐位写类型，逗号分隔。',
        '',
        '`[number, string]` 就是「第一位是数字、第二位是字符串、正好两位」。',
        '多一位、少一位、或者某位类型对不上，编译器都报错。'
      ].join('\n') },

      { kind: 'demo', caption: '元组逐位约束', code: [
        'const point: [number, number] = [3, 4];',
        'const entry: [string, number] = [\'age\', 30];',
        'const row: [string, number, boolean] = [\'ok\', 200, true];',
        '// const bad: [number, number] = [3, 4, 5];   // ✗ 长度对不上'
      ].join('\n'), checks: [
        'eqType(\'point\', \'[number, number]\', \'point 是二元数字元组\')',
        'eqType(\'entry\', \'[string, number]\', \'两位类型不同\')',
        'eqType(\'row\', \'[string, number, boolean]\', \'三位元组\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## `as const`：把数组字面量收成只读元组',
        '写 `const dirs = [\'north\', \'south\']` 时，编译器默认推出 `string[]`——元素类型被放宽成了 `string`。',
        '在字面量后面加 `as const`，它就会变成一个**只读元组**，每个位置停在自己的字面量上：',
        '`readonly [\'north\', \'south\']`。',
        '',
        '这样既锁住了长度，也保住了每个值到底是什么。它适合表示一组固定的取值。'
      ].join('\n') },

      { kind: 'demo', caption: 'as const 与不加 as const 的差别', code: [
        'const loose = [\'north\', \'south\'];          // string[]',
        'const fixed = [\'north\', \'south\'] as const;   // readonly ["north", "south"]',
        'const zero = [0, 0] as const;                    // readonly [0, 0]',
        '// fixed.push(\'west\');   // ✗ 只读元组上也没有 push'
      ].join('\n'), checks: [
        'eqType(\'loose\', \'string[]\', \'不加 as const 会放宽成 string[]\')',
        'eqTypeExact(\'fixed\', \'readonly [\"north\", \"south\"]\', \'as const 收成只读元组\')',
        'eqTypeExact(\'zero\', \'readonly [0, 0]\', \'数字也停在字面量上\')',
        'noErrors()'
      ] },

      { kind: 'note', tone: 'tip', md: '`as const` 加在字面量后面，不是加在变量上。`as const` 的对象会把每个属性都变成 `readonly`，数组则变成只读元组。' },

      { kind: 'prose', md: [
        '## 索引签名与 Record：键不固定',
        '有时候键事先不知道，但值的类型是统一的，比如一张分数表。这时用**索引签名**：',
        '`{ [name: string]: number }` 表示「随便什么字符串键，值都得是数字」。',
        '',
        '`Record<string, number>` 是同一个意思的别名写法，写字典更省事。'
      ].join('\n') },

      { kind: 'demo', caption: '索引签名与 Record', code: [
        'type Scores = { [name: string]: number };',
        '',
        'const scores: Scores = { alice: 90, bob: 75 };',
        'const cache: Record<string, number> = { a: 1, b: 2 };',
        'const alice: number = scores.alice;'
      ].join('\n'), checks: [
        'eqType(\'Scores\', \'{ [name: string]: number }\', \'索引签名类型\')',
        'eqType(\'scores\', \'{ [key: string]: number }\', \'scores 的类型\')',
        'eqType(\'cache\', \'{ [key: string]: number }\', \'Record 与索引签名等价\')',
        'eqType(\'alice\', \'number\', \'取值是 number\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 数组方法推出来的返回类型',
        '`map` / `filter` / `reduce` 的返回类型是从回调推出来的，不用手写：',
        '- `map` 看回调返回什么：返回 `string` 就得到 `string[]`',
        '- `filter` 不改元素类型，还是 `T[]`',
        '- `reduce` 的结果类型由初始值决定'
      ].join('\n') },

      { kind: 'demo', caption: '回调决定结果类型', code: [
        'const nums: number[] = [1, 2, 3];',
        'const doubled = nums.map((n) => n * 2);          // number[]',
        'const labels = nums.map((n) => \'n\' + n);        // string[]',
        'const evens = nums.filter((n) => n % 2 === 0);   // number[]',
        'const sum = nums.reduce((a, b) => a + b, 0);     // number'
      ].join('\n'), checks: [
        'eqType(\'doubled\', \'number[]\', \'map 回调返回 number\')',
        'eqType(\'labels\', \'string[]\', \'换回调返回类型，map 结果跟着变\')',
        'eqType(\'evens\', \'number[]\', \'filter 不改元素类型\')',
        'eqType(\'sum\', \'number\', \'reduce 的初始值决定结果类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 下标访问与 `noUncheckedIndexedAccess`',
        '默认情况下，`xs[0]` 的类型就是元素类型 `T`。编译器假装那个位置一定有元素——',
        '但运行时空数组取下标会得到 `undefined`。',
        '',
        '打开 `noUncheckedIndexedAccess`，下标访问的结果就变成 `T | undefined`，逼你先判断再使用。',
        '它不在 `strict` 里，要单独开。下面两个示例只差这一个开关。'
      ].join('\n') },

      { kind: 'demo', caption: '默认：下标访问直接给元素类型', code: [
        'const xs: number[] = [1, 2, 3];',
        'const first: number = xs[0];'
      ].join('\n'), checks: [
        'eqType(\'first\', \'number\', \'默认下 xs[0] 就是 number\')',
        'noErrors()'
      ] },

      { kind: 'demo', caption: '打开 noUncheckedIndexedAccess：下标带上 undefined', code: [
        'const xs: number[] = [1, 2, 3];',
        'const first: number = xs[0];   // ✗ TS2322：可能是 undefined'
      ].join('\n'), tsconfig: { noUncheckedIndexedAccess: true }, checks: [
        'hasError(2322, \'下标可能取到 undefined\')',
        'errorAt(2, 2322, \'错在赋值那一行\')',
        'eqType(\'first\', \'number\', \'first 仍然声明成 number\')'
      ] },

      { kind: 'note', tone: 'warn', md: '这两个示例的代码只差一行注解，结果却不同，差别全在 `tsconfig` 的 `noUncheckedIndexedAccess` 上。读别人的项目时先看这个开关。' },

      { kind: 'exercise', id: 'ex04-1', title: '把 any 数组收成具体元素类型', task: [
        '`tags` 与 `nums` 现在都标成 `any[]`，数组里怎么用都不报错，等于没写类型。',
        '',
        '要求：`tags` 的类型是 `string[]`，`nums` 的类型是 `number[]`。变量名与值都不要动。'
      ].join('\n'), starter: [
        'let tags: any[] = [\'ts\', \'js\'];',
        'let nums: any[] = [1, 2, 3];'
      ].join('\n'), solution: [
        'let tags: string[] = [\'ts\', \'js\'];',
        'let nums: number[] = [1, 2, 3];'
      ].join('\n'), tests: [
        'eq(type(\'tags\'), \'string[]\', \'tags 的元素类型\')',
        'eq(type(\'nums\'), \'number[]\', \'nums 的元素类型\')',
        'noErrors()'
      ], hints: [
        '把 `any[]` 里的 `any` 换成真正的元素类型，字符串数组是 `string[]`。',
        '`any` 与具体类型并不等价，`eqType` 在这里分得出来。'
      ] },

      { kind: 'exercise', id: 'ex04-2', title: '用元组表达定长数据', task: [
        '`point` 是一个平面坐标，`entry` 是「键 + 数量」。两者长度和每位类型都是定死的。',
        '',
        '要求：`point` 的类型是 `[number, number]`，`entry` 的类型是 `[string, number]`。值别动。'
      ].join('\n'), starter: [
        'const point: number[] = [3, 4];',
        'const entry: (string | number)[] = [\'age\', 30];'
      ].join('\n'), solution: [
        'const point: [number, number] = [3, 4];',
        'const entry: [string, number] = [\'age\', 30];'
      ].join('\n'), tests: [
        'eqType(\'point\', \'[number, number]\', \'point 是二元数字元组\')',
        'eqType(\'entry\', \'[string, number]\', \'entry 每位类型不同\')',
        'noErrors()'
      ], hints: [
        '定长、且每位类型不同时用元组：方括号里逐位写类型，逗号分隔。',
        '`number[]` 只表示「任意长度的数字」，说不出「正好两位」。'
      ] },

      { kind: 'exercise', id: 'ex04-3', title: 'as const 收成只读元组', task: [
        '`dirs` 想要的是一组固定的取值，长度锁死，元素类型停在字面量上。',
        '',
        '要求：`dirs` 的类型是 `readonly [\"north\", \"south\", \"east\"]`，并且它不能当可变的 `string[]` 用。'
      ].join('\n'), starter: [
        'const dirs: string[] = [\'north\', \'south\', \'east\'];'
      ].join('\n'), solution: [
        'const dirs = [\'north\', \'south\', \'east\'] as const;'
      ].join('\n'), tests: [
        'eqTypeExact(\'dirs\', \'readonly [\"north\", \"south\", \"east\"]\', \'dirs 的类型\')',
        'notAssignableTo(\'dirs\', \'string[]\', \'只读元组不能交给可变数组\')',
        'noErrors()'
      ], hints: [
        '在数组字面量后面加 `as const`，它会被当成只读元组，每个元素停在自己的字面量上。',
        '只读的东西不能赋给可变数组，`notAssignableTo` 认这一条。'
      ] },

      { kind: 'exercise', id: 'ex04-4', title: '给索引签名对象补类型', task: [
        '`scores` 的键是学生名字，事先不知道有哪些，值都是分数。',
        '',
        '要求：`scores` 的类型是 `{ [name: string]: number }`；`alice` 从里面取值，类型是 `number`。'
      ].join('\n'), starter: [
        'const scores: object = { alice: 90, bob: 75 };',
        '',
        'const alice = scores.alice;'
      ].join('\n'), solution: [
        'const scores: { [name: string]: number } = { alice: 90, bob: 75 };',
        '',
        'const alice = scores.alice;'
      ].join('\n'), tests: [
        'eqType(\'scores\', \'{ [name: string]: number }\', \'scores 的类型\')',
        'eqType(\'alice\', \'number\', \'取值的类型\')',
        'noErrors()'
      ], hints: [
        '键不固定、值类型固定时用索引签名：`{ [name: string]: number }`。',
        '`object` 上读不到任何具体属性，`scores.alice` 会报 TS2339。'
      ] },

      { kind: 'exercise', id: 'ex04-5', title: '用 Record 表达字典', task: [
        '`counts` 是一张「单词 → 出现次数」的表，键是运行时才知道的字符串。',
        '',
        '要求：`counts` 的类型是 `Record<string, number>`；`first` 取其中一个值，类型是 `number`。'
      ].join('\n'), starter: [
        'const counts: {} = {};',
        '',
        'counts[\'hello\'] = 1;   // ✗ {} 上没有索引签名',
        '',
        'const first = counts[\'hello\'];'
      ].join('\n'), solution: [
        'const counts: Record<string, number> = {};',
        '',
        'counts[\'hello\'] = 1;',
        'counts[\'world\'] = 2;',
        '',
        'const first = counts[\'hello\'];'
      ].join('\n'), tests: [
        'eqType(\'counts\', \'{ [key: string]: number }\', \'Record<string, number> 等价于索引签名\')',
        'eqType(\'first\', \'number\', \'取值的类型\')',
        'noErrors()'
      ], hints: [
        '`Record<string, number>` 就是 `{ [key: string]: number }` 的别名写法，专门描述字典。',
        '先声明成 `Record<...>`，后面才能按任意字符串键写进去。'
      ] },

      { kind: 'exercise', id: 'ex04-6', title: '下标访问可能是 undefined', task: [
        '这个练习开了 `noUncheckedIndexedAccess`，`xs[0]` 的类型会变成 `number | undefined`，',
        '直接赋给 `number` 就会报错。',
        '',
        '要求：`first` 的类型是 `number`，代码里没有错误——取值前先判断一次。'
      ].join('\n'), starter: [
        'const xs: number[] = [1, 2, 3];',
        '',
        'const first: number = xs[0];'
      ].join('\n'), solution: [
        'const xs: number[] = [1, 2, 3];',
        '',
        'let first = 0;',
        'const hit = xs[0];',
        'if (hit !== undefined) {',
        '  first = hit;',
        '}'
      ].join('\n'), tsconfig: { noUncheckedIndexedAccess: true }, tests: [
        'eqType(\'first\', \'number\', \'first 的类型\')',
        'noErrors()',
        'notError(2322, \'判断之后再赋值，就不该有 2322 了\')'
      ], hints: [
        '打开这个开关后，`xs[0]` 的结果是 `number | undefined`。',
        '先把结果存进变量，`if (hit !== undefined)` 之后再赋给 `number`。'
      ] },

      { kind: 'prose', md: [
        '## 小结',
        '数组用 `T[]`（或 `Array<T>`），要防改动就加 `readonly`；长度和每位类型定死就用元组，',
        '`as const` 能把字面量收成只读元组；键不固定时用索引签名或 `Record`；',
        '数组方法的返回类型从回调推出来；下标访问安不安全，看 `noUncheckedIndexedAccess` 开没开。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
