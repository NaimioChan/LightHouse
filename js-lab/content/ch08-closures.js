(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch08',
    title: '第 8 章 · 闭包、高阶函数与递归',
    goal: '理解「函数记住它出生的环境」这件事，会写返回函数的函数，也会写有出口的递归。',
    sections: [
      {
        kind: 'prose',
        md: [
          '函数可以返回函数。被返回的那个函数，会一直**记住**它定义时能看到的外层变量——这些变量不会因为外层函数执行完就消失。这就是**闭包**。',
          '',
          '闭包是 JS 里封装「私有状态」的标准手段：外面的代码碰不到那个变量，只能通过返回的函数去操作它。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '闭包：私有计数器',
        code: [
          'function makeCounter() {',
          '  let count = 0;              // 只有 next 能碰到它',
          '  return function next() {',
          '    count += 1;',
          '    return count;',
          '  };',
          '}',
          '',
          'const c1 = makeCounter();',
          'const c2 = makeCounter();     // 每个计数器有自己的一份 count',
          'console.log(c1(), c1(), c1());',
          'console.log(c2());',
          'console.log(typeof count);    // 外面根本看不到 count'
        ].join('\n'),
        expect: '1 2 3\n1\nundefined'
      },
      {
        kind: 'prose',
        md: [
          '闭包的另一种用法是**工厂**：拿参数造出专用函数。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '工厂函数',
        code: [
          'const makeMultiplier = n => x => x * n;',
          'const double = makeMultiplier(2);',
          'const triple = makeMultiplier(3);',
          'console.log(double(5), triple(5));',
          '',
          'console.log([1, 2, 3].map(double));',
          '',
          'const tag = prefix => text => `[${prefix}] ${text}`;',
          'const warn = tag("警告");',
          'console.log(warn("磁盘快满了"));'
        ].join('\n'),
        expect: '10 15\n[ 2, 4, 6 ]\n[警告] 磁盘快满了'
      },
      {
        kind: 'prose',
        md: [
          '**高阶函数**就是「接收函数或返回函数」的函数。`map` / `filter` 都是高阶函数，因为它们收回调。',
          '',
          '写一个「只执行一次」的包装，是闭包最实用的形态之一：'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'once：结果被闭包记住',
        code: [
          'function once(fn) {',
          '  let called = false;',
          '  let result;',
          '  return function (...args) {',
          '    if (!called) {',
          '      called = true;',
          '      result = fn(...args);',
          '    }',
          '    return result;',
          '  };',
          '}',
          '',
          'let runs = 0;',
          'const init = once(() => { runs += 1; return "初始化完成"; });',
          'console.log(init(), init(), init());',
          'console.log("函数体只跑了", runs, "次");'
        ].join('\n'),
        expect: '初始化完成 初始化完成 初始化完成\n函数体只跑了 1 次'
      },
      {
        kind: 'prose',
        md: [
          '**递归**是函数直接或间接调用自己。两个条件缺一不可：',
          '',
          '1. **出口**：某个条件下直接返回，不再递归。',
          '2. **缩小**：每次调用都朝着出口靠近（比如遍历更小的一层）。',
          '',
          '递归特别适合处理「嵌套结构」：树、目录、嵌套对象。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '递归：阶乘与嵌套求和',
        code: [
          'function factorial(n) {',
          '  if (n <= 1) return 1;        // 出口',
          '  return n * factorial(n - 1); // 缩小',
          '}',
          'console.log(factorial(5), factorial(1));',
          '',
          'function sumNested(node) {',
          '  let total = 0;',
          '  for (const key in node) {',
          '    const v = node[key];',
          '    if (typeof v === "number") total += v;',
          '    else if (v && typeof v === "object") total += sumNested(v);',
          '  }',
          '  return total;',
          '}',
          'console.log(sumNested({ a: 1, b: { c: 2, d: { e: 3 } } }));'
        ].join('\n'),
        expect: '120 1\n6'
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '递归没有出口，或者嵌套太深，会抛 `RangeError: Maximum call stack size exceeded`。数据有几千层就往循环改，别指望引擎兜着。'
      },
      {
        kind: 'exercise',
        id: 'ex08-1',
        title: '私有计数器',
        task: [
          '补完 `makeCounter()`：返回一个函数，每次调用它，返回值从 1 开始依次加 1。',
          '',
          '两次调用 `makeCounter()` 必须得到互相独立的计数器。'
        ].join('\n'),
        starter: [
          'function makeCounter() {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function makeCounter() {',
          '  let count = 0;',
          '  return function () {',
          '    count += 1;',
          '    return count;',
          '  };',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { const c = makeCounter(); eq([c(), c(), c()], [1, 2, 3]); })();",
          "(() => { const a = makeCounter(); const b = makeCounter(); a(); a(); eq(a(), 3); eq(b(), 1, '两个计数器各记各的'); })();",
          "eq(typeof makeCounter(), 'function', '要返回一个函数');"
        ],
        hints: [
          '在 `makeCounter` 里声明 `let count = 0`，然后 `return function () { ... }`。',
          'count 声明在函数内部，所以每次调用 makeCounter 都是新的一份。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-2',
        title: '只执行一次',
        task: [
          '补完 `once(fn)`：返回一个新函数，无论被调用多少次，`fn` 只真正执行第一次，之后都直接返回第一次的结果。',
          '',
          '第一次调用时的实参要原样传给 `fn`。'
        ].join('\n'),
        starter: [
          'function once(fn) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function once(fn) {',
          '  let called = false;',
          '  let result;',
          '  return function (...args) {',
          '    if (!called) {',
          '      called = true;',
          '      result = fn(...args);',
          '    }',
          '    return result;',
          '  };',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { let calls = 0; const f = once(x => { calls += 1; return x * 2; }); eq(f(2), 4); eq(f(9), 4, '第二次直接给第一次的结果'); eq(calls, 1, 'fn 只能被执行一次'); })();",
          "(() => { let n = 0; const f = once(() => { n += 1; }); f(); f(); f(); eq(n, 1); })();",
          "(() => { const f = once((a, b) => a + b); eq(f(2, 3), 5, '实参要传给 fn'); })();"
        ],
        hints: [
          '用两个闭包变量：一个记「跑过没有」，一个存结果。',
          '返回的函数要用 `(...args)` 接住实参，再 `fn(...args)` 转传出去。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-3',
        title: '递归阶乘',
        task: [
          '补完 `factorial(n)`，用**递归**返回 n 的阶乘（0 和 1 的阶乘都是 1）。',
          '',
          '别忘了写出口。'
        ].join('\n'),
        starter: [
          'function factorial(n) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function factorial(n) {',
          '  if (n <= 1) return 1;',
          '  return n * factorial(n - 1);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(factorial(0), 1, '0 的阶乘是 1');",
          "eq(factorial(1), 1);",
          "eq(factorial(5), 120);",
          "eq(factorial(10), 3628800);"
        ],
        hints: [
          '出口是 `n <= 1` 时返回 1。',
          '递推关系：n 的阶乘 = n × (n-1) 的阶乘。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-4',
        title: '嵌套结构里所有数字之和',
        task: [
          '补完 `deepSum(node)`：把对象（以及数组）里所有层级上的数字加起来。',
          '',
          '遇到的每个对象/数组都要继续往里找。'
        ].join('\n'),
        starter: [
          'function deepSum(node) {',
          '  let total = 0;',
          '  // 你的代码',
          '  return total;',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function deepSum(node) {',
          '  let total = 0;',
          '  for (const v of Object.values(node)) {',
          '    if (typeof v === "number") total += v;',
          '    else if (v && typeof v === "object") total += deepSum(v);',
          '  }',
          '  return total;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(deepSum({ a: 1, b: { c: 2, d: { e: 3 } } }), 6);",
          "eq(deepSum({}), 0);",
          "eq(deepSum({ list: [1, 2, { x: 3 }] }), 6, '数组也要往里走');",
          "eq(deepSum({ a: '7', b: 1 }), 1, '字符串不算数字');"
        ],
        hints: [
          '`Object.values(node)` 对数组也管用，会把元素按顺序给你。',
          '判断顺序：先 `typeof v === "number"` 累加，再判断它是不是对象，是就递归。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
