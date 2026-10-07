(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch04',
    title: '第 4 章 · 函数',
    goal: '把重复的代码收进函数：会传参、会返回、看得懂作用域，能写箭头函数。',
    sections: [
      {
        kind: 'prose',
        md: [
          '函数是「打包好的一段逻辑」，给它入参，它给你返回值。三种写法现在是通用的：',
          '',
          '- `function 名字() {}` 声明：会被提升，可以在定义之前调用。',
          '- `const 名字 = function () {}` 函数表达式：定义在哪儿，哪儿之后才能用。',
          '- `const 名字 = () => {}` 箭头函数：写法短，但 `this` 的行为不同（第 9 章细讲）。',
          '',
          '函数没写 `return`，返回的就是 `undefined`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '四种短小的函数',
        code: [
          'function add(a, b) { return a + b; }',
          'const sub = function (a, b) { return a - b; };',
          'const mul = (a, b) => a * b;                 // 箭头：单表达式可省 return',
          'const shout = s => {                         // 多语句要花括号 + return',
          '  const up = s.toUpperCase();',
          '  return up + "!";',
          '};',
          '',
          'console.log(add(1, 2), sub(5, 3), mul(2, 4), shout("hi"));',
          'function nothing() {}',
          'console.log(nothing());'
        ].join('\n'),
        expect: '3 2 8 HI!\nundefined'
      },
      {
        kind: 'prose',
        md: [
          '**默认参数**给没传的参数兜底，**剩余参数** `...rest` 把多出来的实参收成一个数组。两者可以同时用，但 `...rest` 必须放最后。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '默认参数与剩余参数',
        code: [
          'function join(sep = "-", ...parts) {',
          '  return parts.join(sep);',
          '}',
          'console.log("[" + join() + "]");',
          'console.log(join("/", "a", "b", "c"));',
          'console.log(join("+", 1, 2));'
        ].join('\n'),
        expect: '[]\na/b/c\n1+2'
      },
      {
        kind: 'prose',
        md: [
          '**作用域**决定一个名字在哪儿可见。两条规则够用：',
          '',
          '- 函数内部能看见外面的变量（外层作用域链）。',
          '- 外面看不见函数内部的变量。用 `let` / `const` 声明的名字只在它所在的那对花括号里存在。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '内可见外，外不可见内',
        code: [
          'const outer = "外面的";',
          '',
          'function show() {',
          '  const inner = "里面的";',
          '  console.log(outer, inner);   // 两边都能看见',
          '}',
          'show();',
          '',
          'console.log(typeof inner);     // 外面看不见 inner',
          '',
          'if (true) { const block = 1; console.log("块内:", block); }',
          'console.log(typeof block);     // let/const 只在块里活着'
        ].join('\n'),
        expect: '外面的 里面的\nundefined\n块内: 1\nundefined'
      },
      {
        kind: 'table',
        head: ['写法', '特点', '什么时候用'],
        rows: [
          ['function f() {}', '提升；有自己的 this', '顶层工具函数、需要被提前调用'],
          ['const f = function () {}', '不提升；有 this', '按条件赋值、传给别人'],
          ['const f = () => {}', '不提升；继承外面的 this；不能当构造函数', '回调、单表达式小函数'],
          ['f = (a = 1) => {}', '默认参数', '参数可选'],
          ['f = (...xs) => {}', '剩余参数收成数组', '参数个数不定']
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '函数在 JS 里是**值**：可以存进变量、放进数组、当参数传给别的函数。第 8 章的闭包和第 5 章的 `map` 都建立在这件事上。'
      },
      {
        kind: 'exercise',
        id: 'ex04-1',
        title: '任意个数求和',
        task: [
          '补完 `sumAll(...nums)`，返回所有参数的和。一个都没传时返回 `0`。',
          '',
          '用剩余参数接住不定个数的实参。'
        ].join('\n'),
        starter: [
          'function sumAll() {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function sumAll(...nums) {',
          '  return nums.reduce((sum, n) => sum + n, 0);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(sumAll(), 0, '没有参数时返回 0');",
          "eq(sumAll(5), 5);",
          "eq(sumAll(1, 2, 3, 4), 10);"
        ],
        hints: [
          '函数签名要写成 `function sumAll(...nums)`，nums 就是一个数组。',
          '先用循环累加也行，`nums.reduce((sum, n) => sum + n, 0)` 也行。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-2',
        title: '把函数当参数',
        task: [
          '补完 `applyTwice(fn, x)`：把 `fn` 连续作用在 `x` 上两次，返回结果。',
          '',
          '`applyTwice(n => n + 1, 5)` 应该得到 `7`。'
        ].join('\n'),
        starter: [
          'function applyTwice(fn, x) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function applyTwice(fn, x) {',
          '  return fn(fn(x));',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(applyTwice(n => n + 1, 5), 7);",
          "eq(applyTwice(s => s + '!', 'hi'), 'hi!!');",
          "eq(applyTwice(n => n * 2, 3), 12);"
        ],
        hints: [
          '函数可以像普通值一样被调用：参数叫 fn，就写 `fn(x)`。',
          '当前答案就是两次调用的嵌套：`fn(fn(x))`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-3',
        title: '正方形的默认值',
        task: [
          '补完 `area(w, h)`：返回矩形面积。',
          '',
          '只传一个参数时，当成正方形处理（`h` 默认等于 `w`）。'
        ].join('\n'),
        starter: [
          'function area(w, h) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function area(w, h = w) {',
          '  return w * h;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(area(3), 9, '只传一个参数时按正方形算');",
          "eq(area(3, 4), 12);",
          "eq(area(5, 5), 25);"
        ],
        hints: [
          '默认值写在参数列表里：`h = w`，右边可以引用左边的参数。',
          '在函数体里写 `if (h === undefined) h = w;` 也能过，但默认参数更直接。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-4',
        title: '平均值',
        task: [
          '补完 `average(...nums)`，返回平均值。没传参数时返回 `0`（不是 NaN）。'
        ].join('\n'),
        starter: [
          'function average() {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function average(...nums) {',
          '  if (nums.length === 0) return 0;',
          '  let sum = 0;',
          '  for (const n of nums) sum += n;',
          '  return sum / nums.length;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(average(), 0, '没有参数时返回 0，别返回 NaN');",
          "eq(average(5), 5);",
          "eq(average(1, 2, 3), 2);",
          "near(average(1, 2), 1.5, 1e-9);"
        ],
        hints: [
          '先处理空参数的情况，否则 `sum / 0` 会得到 NaN。',
          '数组的长度就是参数个数：`nums.length`。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
