/* 第 1 章 · 类型注解与推断。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 类型注解与推断',
    goal: '知道什么时候该写类型注解、什么时候交给推断，并看懂 let 与 const 推出来的类型为什么不一样。',
    sections: [
      { kind: 'prose', md: [
        'TypeScript 的文件名后缀是 `.ts`，浏览器不认识它。真正跑起来之前，它会被编译成普通的 `.js`——',
        '**所有类型都留在编译期，进不了运行时**。这一章先建立这个前提，后面每一章都靠它。',
        '',
        '## 给变量写类型',
        '在变量名后面加冒号和类型名，就是这个变量的类型注解：',
        '- `let title: string = \'练习\';`',
        '- `const count: number = 3;`',
        '',
        '注解的作用是**约束**：写下的类型和赋的值对不上，编译器就报错 `TS2322`。它也是给读代码的人看的契约。'
      ].join('\n') },

      { kind: 'demo', caption: '写了注解，类型就是注解说了算', code: [
        'let title: string = \'练习场\';',
        'let count: number = 3;',
        'let tags: string[] = [\'ts\', \'js\'];'
      ].join('\n'), checks: [
        'eqType(\'title\', \'string\', \'title 的类型\')',
        'eqType(\'count\', \'number\', \'count 的类型\')',
        'eqType(\'tags\', \'string[]\', \'tags 的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 不写注解时，编译器自己猜',
        '大部分情况下不用写注解。看到 `let n = 3`，编译器知道它是 `number`；看到 `let s = \'abc\'`，知道是 `string`。',
        '这种「自己猜」叫**类型推断**，猜的结果和你写注解是等价的。',
        '',
        '推断有一个反直觉的地方：**同一个值，`let` 和 `const` 推出来的类型不一样**。',
        '`const` 声明的变量永远不会被重新赋值，编译器就把类型收窄到那个具体的值（**字面量类型**）；',
        '`let` 声明可以改，编译器只能给到宽的类型。'
      ].join('\n') },

      { kind: 'demo', caption: 'let 与 const 推出来的类型不同', code: [
        'const solid = \'dark\';   // const：类型是 "dark"',
        'let loose = \'dark\';     // let：类型是 string',
        '',
        'let n = 1;                // number',
        'const pair = [1, 2];      // number[]'
      ].join('\n'), checks: [
        'eqTypeExact(\'solid\', \'"dark"\', \'const 变量推出来的是字面量类型\')',
        'eqTypeExact(\'loose\', \'string\', \'let 变量推出来的是宽类型\')',
        'eqType(\'n\', \'number\', \'n 的类型\')',
        'eqType(\'pair\', \'number[]\', \'pair 的类型\')',
        'noErrors()'
      ] },

      { kind: 'table', head: ['写法', '推出来的类型', '为什么'], rows: [
        ['`const a = \'dark\'`', '`"dark"`', '值不会再变，类型就收到这个值本身'],
        ['`let a = \'dark\'`', '`string`', '还可能要改成别的字符串，只能给宽类型'],
        ['`const a = { n: 1 }`', '`{ n: number }`', '对象属性可以改，属性类型是宽的'],
        ['`const a = [1, 2]`', '`number[]`', '数组元素可以改，元素类型是宽的'],
        ['`let a = 1`', '`number`', '数字同理']
      ] },

      { kind: 'note', tone: 'tip', md: '要断言「类型就是这个字面量」用 `eqTypeExact`；把字面量和它的宽类型视为同类时用 `eqType`。上面那个示例的 1、2 两条只有用严格版才分得出来。' },

      { kind: 'prose', md: [
        '## 三种「没有类型」的写法',
        '',
        '- `any`：放弃检查。之后怎么用它都不报错，也就等于把类型系统关掉了。',
        '- `unknown`：**还不知道是什么**。可以接收任何值，但用之前必须先收窄（`typeof`、`instanceof` 等）。',
        '- `never`：**不可能有值**。函数永远抛错、或者 `switch` 里所有分支都走完了，剩下那一支就是 `never`。',
        '',
        '外部数据（接口返回、用户输入、`JSON.parse` 的结果）应该先声明成 `unknown`，用的时候再判断；',
        '直接标 `any` 等于放弃了后面的所有检查。'
      ].join('\n') },

      { kind: 'demo', caption: 'unknown 不收起窄就不能用', code: [
        'const raw: unknown = \'hello\';',
        '',
        '// raw.length;                 // ✗ TS18046：“raw”的类型为“未知”',
        'if (typeof raw === \'string\') {',
        '  console.log(raw.length);     // ✓ 这一支里它已经是 string',
        '}',
        '',
        'function fail(): never {',
        '  throw new Error(\'走不到这里\');',
        '}'
      ].join('\n'), run: true, checks: [
        'eqType(\'raw\', \'unknown\', \'raw 的类型\')',
        'eqType(\'fail\', \'() => never\', \'fail 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'5\'], \'收窄之后才取到长度\')'
      ] },

      { kind: 'prose', md: [
        '## 联合类型',
        '一个值只可能是几种之一时，用 `|` 把它们连起来。联合类型是后面「收窄」一章的地基：',
        '只有在确定了具体是哪一支之后，编译器才允许你访问那一支特有的东西。'
      ].join('\n') },

      { kind: 'demo', caption: '把一个值限制在几个字面量里', code: [
        'type Status = \'idle\' | \'busy\' | \'done\';',
        '',
        'let st: Status = \'busy\';',
        'st = \'done\';',
        '// st = \'oops\';   // ✗ TS2322：不能把 "oops" 赋给 Status'
      ].join('\n'), checks: [
        'eqType(\'Status\', \'"idle" | "busy" | "done"\', \'Status 的类型\')',
        'eqType(\'st\', \'"idle" | "busy" | "done"\', \'st 的类型\')',
        'noErrors()'
      ] },

      { kind: 'exercise', id: 'ex01-1', title: '把注解补上', task: [
        '两个变量各差一个类型注解，把它们补成要求的样子。',
        '',
        '要求：`title` 的类型是 `string`，`tags` 的类型是 `number[]`。别改变量名，也别删掉已有的值。'
      ].join('\n'), starter: [
        'let title = 42;        // 要变成 string',
        'let tags: number[] = [1, 2, 3];'
      ].join('\n'), solution: [
        'let title: string = \'练习场\';',
        'let tags: number[] = [1, 2, 3];'
      ].join('\n'), tests: [
        'eqType(\'title\', \'string\', \'title 的类型\')',
        'eqType(\'tags\', \'number[]\', \'tags 的类型\')',
        'noErrors(\'补完注解后不该有类型错误\')'
      ], hints: [
        '注解写在变量名后面：`let title: string = …`。',
        '`number[]` 表示「数字组成的数组」，方括号写在元素类型后面。'
      ] },

      { kind: 'exercise', id: 'ex01-2', title: '让类型停在字面量上', task: [
        '下面两个变量的类型现在都是 `string`，把它们改成：',
        '',
        '- `solid` 的类型是字面量 `"dark"`',
        '- `loose` 的类型是 `string`',
        '',
        '变量名、值都不要动，只改声明方式。'
      ].join('\n'), starter: [
        'let solid = \'dark\';',
        'const loose = \'dark\';'
      ].join('\n'), solution: [
        'const solid = \'dark\';',
        'let loose = \'dark\';'
      ].join('\n'), tests: [
        'eqTypeExact(\'solid\', \'"dark"\', \'solid 的类型\')',
        'eqTypeExact(\'loose\', \'string\', \'loose 的类型\')',
        'noErrors()'
      ], hints: [
        '`const` 声明的变量不可能被重新赋值，编译器就敢把类型标成那个具体的值。',
        '`let` 声明还可能要改，编译器只能给宽类型。'
      ] },

      { kind: 'exercise', id: 'ex01-3', title: '外部数据用 unknown', task: [
        '`raw` 现在标成了 `any`，等于关掉了检查。把它改成 `unknown`，并且**在不报错的前提下**',
        '算出字符串的长度存进 `len`。',
        '',
        '要求：`raw` 的类型是 `unknown`，`len` 的类型是 `number`，代码里没有类型错误。'
      ].join('\n'), starter: [
        'const raw: any = \'hello\';',
        '',
        'const len: number = raw.length;'
      ].join('\n'), solution: [
        'const raw: unknown = \'hello\';',
        '',
        'let len = 0;',
        'if (typeof raw === \'string\') {',
        '  len = raw.length;',
        '}'
      ].join('\n'), tests: [
        'eqType(\'raw\', \'unknown\', \'raw 的类型\')',
        'eqType(\'len\', \'number\', \'len 的类型\')',
        'noErrors(\'unknown 用之前必须先收窄\')'
      ], hints: [
        '`unknown` 上不能直接读属性，编译器会报 TS18046。',
        '先用 `typeof raw === \'string\'` 判断，`if` 里面编译器就知道它是字符串了。'
      ] },

      { kind: 'exercise', id: 'ex01-4', title: '联合类型与 never', task: [
        '写一个状态类型和一个兜底函数：',
        '',
        '- 类型别名 `Status`，取值只允许 `\'idle\'`、`\'busy\'`、`\'done\'` 三种字面量',
        '- 变量 `st` 声明成 `Status`，值是 `\'idle\'`',
        '- 函数 `assertNever`：接收一个 `never` 参数，返回 `never`，里面 `throw new Error(\'不应该到这里\')`'
      ].join('\n'), starter: [
        'type Status = string;          // 太宽了',
        '',
        'let st: Status = \'idle\';',
        '',
        'function assertNever(x: never): never {',
        '  throw new Error(\'不应该到这里\');',
        '}'
      ].join('\n'), solution: [
        'type Status = \'idle\' | \'busy\' | \'done\';',
        '',
        'let st: Status = \'idle\';',
        '',
        'function assertNever(x: never): never {',
        '  throw new Error(\'不应该到这里\');',
        '}'
      ].join('\n'), tests: [
        'eqType(\'Status\', \'"idle" | "busy" | "done"\', \'Status 的类型\')',
        'eqType(\'st\', \'"idle" | "busy" | "done"\', \'st 的类型\')',
        'eqType(\'assertNever\', \'(x: never) => never\', \'assertNever 的类型\')',
        'noErrors()'
      ], hints: [
        '联合类型用 `|` 连接几个字面量：`\'a\' | \'b\'`。',
        '函数类型写成 `(参数) => 返回值`，参数名不影响比较。'
      ] },

      { kind: 'exercise', id: 'ex01-5', title: '运行时看不到类型', task: [
        '把 `count` 的值改成 `5`，然后跑一次。编译产物里 `: number` 已经不见了，',
        '运行时打印出来的是 `5 number`。',
        '',
        '要求：`count` 的类型是 `number`，运行输出正好是 `5 number`。'
      ].join('\n'), starter: [
        'const count: number = 3;',
        '',
        'console.log(count, typeof count);'
      ].join('\n'), solution: [
        'const count: number = 5;',
        '',
        'console.log(count, typeof count);'
      ].join('\n'), tests: [
        'eqType(\'count\', \'number\', \'count 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'5 number\'], \'运行输出\')'
      ], hints: [
        '下标改成 `5` 就够了，注解留着。',
        '切到「编译产物」页签看一眼：`const count = 5;`——注解整条被抹掉。'
      ] },

      { kind: 'prose', md: [
        '## 小结',
        '注解是约束，推断是默认；`const` 会推出字面量类型，`let` 不会；',
        '外来数据用 `unknown` 而不是 `any`；类型只活在编译期，运行时只剩值。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
