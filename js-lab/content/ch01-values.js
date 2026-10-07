(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 值、变量与类型',
    goal: '把值存进变量、认全基本类型、用模板字符串拼出可读文本。本章你只需要往函数体里写一两行。',
    sections: [
      {
        kind: 'prose',
        md: [
          'JavaScript 程序的最小单位是**值**：数字 `42`、字符串 `"hi"`、布尔 `true`。',
          '**变量**是给值起的名字，用 `let` 或 `const` 声明。',
          '',
          '- `const` 声明的名字不能再指向别的值，优先用它。',
          '- 需要重新赋值时改用 `let`。',
          '- `var` 是 2015 年前的写法，作用域规则反直觉，新代码一律不用。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'const 与 let',
        code: [
          'const name = "小明";',
          'let score = 60;',
          '',
          'score = score + 10;      // let 可以重新赋值',
          'console.log(name, score);',
          '',
          '// const 再赋值会抛错：',
          'try { name = "小红"; } catch (e) { console.log(e.name); }'
        ].join('\n'),
        expect: '小明 70\nTypeError'
      },
      {
        kind: 'table',
        head: ['typeof 结果', '什么样', '例子'],
        rows: [
          ['number', '整数、小数、NaN、Infinity 都算', '42，3.14，NaN'],
          ['string', '一串字符，单双引号或反引号都行', '"hi"，\'hi\'，`hi`'],
          ['boolean', '只有两个值', 'true，false'],
          ['undefined', '声明了但没赋值', 'let x;'],
          ['null', '有意留空', 'null'],
          ['bigint', '超大整数', '10n'],
          ['symbol', '独一无二的标识', 'Symbol("id")']
        ]
      },
      {
        kind: 'prose',
        md: [
          '用 `typeof` 可以问出一个值的类型。有两个地方会让人愣一下：`typeof null` 返回 `"object"`（早年的 bug，改不了了），`typeof 数组` 也返回 `"object"`——判断数组要用 `Array.isArray()`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'typeof 的坑',
        code: [
          'console.log(typeof 1, typeof "1", typeof true);',
          'console.log(typeof undefined, typeof null);',
          'console.log(typeof [], Array.isArray([]));'
        ].join('\n'),
        expect: 'number string boolean\nundefined object\nobject true'
      },
      {
        kind: 'prose',
        md: [
          '**模板字符串**用反引号，可以把变量直接嵌进文本：`${}` 里放表达式，什么都能放。',
          '',
          '数字和字符串用 `+` 相加时，数字会被转成字符串再拼接：`1 + "2"` 得到 `"12"`。这个行为经常咬人。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '模板字符串',
        code: [
          'const name = "小红";',
          'const score = 87;',
          'console.log(`${name} 得了 ${score} 分，还差 ${100 - score} 分满分。`);',
          'console.log(1 + "2");',
          'console.log(1 + 2);'
        ].join('\n'),
        expect: '小红 得了 87 分，还差 13 分满分。\n12\n3'
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '本章的练习都在**函数体里**写。函数是什么，第 4 章再说——现在只要知道「给它东西，它给你结果」。'
      },
      {
        kind: 'exercise',
        id: 'ex01-1',
        title: '问候语',
        task: [
          '补完 `greet(name)`，返回 `你好，小明！` 这样的字符串。',
          '',
          '要求用模板字符串，不要用 `+` 拼接。'
        ].join('\n'),
        starter: [
          'function greet(name) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function greet(name) {',
          '  return `你好，${name}！`;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(greet('小明'), '你好，小明！', '应返回 你好，小明！');",
          "eq(greet('JS'), '你好，JS！', '名字要原样嵌进字符串');"
        ],
        hints: [
          '模板字符串是反引号包围的，变量写在 ${} 里：反引号 + 你好，${name}！ + 反引号。',
          '别忘了 return，光拼出来不给出去，外面拿不到。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-2',
        title: '摄氏转华氏',
        task: [
          '补完 `toF(c)`，把摄氏温度 `c` 换成华氏温度返回。',
          '',
          '公式：`F = C * 9 / 5 + 32`'
        ].join('\n'),
        starter: [
          'function toF(c) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function toF(c) {',
          '  return c * 9 / 5 + 32;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(toF(0), 32, '0 摄氏度是 32 华氏度');",
          "eq(toF(100), 212, '100 摄氏度是 212 华氏度');",
          "eq(toF(-40), -40, '−40 度是两个刻度的交点');"
        ],
        hints: [
          '乘除的优先级高于加减，所以 `c * 9 / 5 + 32` 不需要括号也是对的。',
          '如果你写了 `9 % 5`，那是取余数，得到 4 —— 值会离谱地小。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-3',
        title: '报出类型',
        task: [
          '补完 `typeName(v)`，返回 `v` 的类型名字符串，也就是 `typeof v` 的结果。',
          '',
          '测试里包含 `null` 和数组，别被它们骗到。'
        ].join('\n'),
        starter: [
          'function typeName(v) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function typeName(v) {',
          '  return typeof v;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(typeName(1), 'number');",
          "eq(typeName('a'), 'string');",
          "eq(typeName(true), 'boolean');",
          "eq(typeName(undefined), 'undefined');",
          "eq(typeName(null), 'object', 'null 的 typeof 是 object，这是历史遗留');",
          "eq(typeName([]), 'object', '数组的 typeof 也是 object');"
        ],
        hints: [
          '一行就够：`return typeof v;`',
          '别去想怎么区分数组，这道题就是要你亲眼看到它们都返回 `object`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-4',
        title: '平均分',
        task: [
          '补完 `avgOf(a, b, c)`，返回三个数的平均值。',
          '',
          '要求用 `const` 存中间结果，再返回。'
        ].join('\n'),
        starter: [
          'function avgOf(a, b, c) {',
          '  // 先算出总和，再除以 3',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function avgOf(a, b, c) {',
          '  const total = a + b + c;',
          '  return total / 3;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(avgOf(1, 2, 3), 2);",
          "eq(avgOf(2, 4, 9), 5);",
          "near(avgOf(1, 2, 4), 7 / 3, 1e-9, '除不尽的时候保留小数，不要取整');"
        ],
        hints: [
          '总和的优先级：先 `a + b + c` 再除以 3，否则变成 a 加上 b/3。',
          '别用 `Math.round`，测试要的是真实小数。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
