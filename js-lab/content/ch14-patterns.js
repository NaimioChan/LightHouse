(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch14',
    title: '第 14 章 · 熟练篇：模式与陷阱',
    goal: '把前面的东西连起来：写得出好读的代码，躲得开老手也常踩的坑。',
    sections: [
      {
        kind: 'prose',
        md: [
          '**早返回**（卫语句）把异常情况在函数开头就处理掉，正文不再往右缩进。嵌套的 if 越少，读代码时脑子里要记的分支就越少。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '早返回替代多层嵌套',
        code: [
          'function describe(user) {',
          '  if (!user) return "没有用户";',
          '  if (!user.name) return "用户没有名字";',
          '  return `${user.name}，${user.age ?? "年龄未知"}`;',
          '}',
          '',
          'console.log(describe(null));',
          'console.log(describe({}));',
          'console.log(describe({ name: "小明", age: 18 }));'
        ].join('\n'),
        expect: '没有用户\n用户没有名字\n小明，18'
      },
      {
        kind: 'prose',
        md: [
          '**不要就地修改传入的数据**。要改就造一份新的：`{ ...obj, count: 1 }`、`[...arr, item]`、`arr.toSorted()`。',
          '',
          '理由不是教条：别人传进来的对象可能被别处引用着，你改了，那边就莫名其妙变了——这类 bug 最难查。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '不可变更新',
        code: [
          'const state = { count: 0, tags: ["a"] };',
          '',
          'const next = {',
          '  ...state,',
          '  count: state.count + 1,',
          '  tags: [...state.tags, "b"]',
          '};',
          '',
          'console.log(state);',
          'console.log(next);'
        ].join('\n'),
        expect: "{ count: 0, tags: [ 'a' ] }\n{ count: 1, tags: [ 'a', 'b' ] }"
      },
      {
        kind: 'prose',
        md: [
          '最经典的一个坑：`var` 在循环里只有**一份**变量，回调们共享它，等回调真的执行时循环早就跑完了。`let` 每轮都是新的一份，所以现在的代码一律用 `let` / `const`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'var 与 let 的差别',
        code: [
          'const withVar = [];',
          'for (var i = 0; i < 3; i++) withVar.push(() => i);',
          'console.log(withVar.map(f => f()));       // 全是 3',
          '',
          'const withLet = [];',
          'for (let j = 0; j < 3; j++) withLet.push(() => j);',
          'console.log(withLet.map(f => f()));       // 0 1 2',
          '',
          'console.log([1, 2, 3].map(n => n * 10));  // 需要返回值就用 map，别用 forEach'
        ].join('\n'),
        expect: '[ 3, 3, 3 ]\n[ 0, 1, 2 ]\n[ 10, 20, 30 ]'
      },
      {
        kind: 'table',
        head: ['坑', '表现', '正确做法'],
        rows: [
          ['== 隐式转换', '"1" == 1 为真，"" == 0 也为真', '一律 ==='],
          ['浮点数', '0.1 + 0.2 !== 0.3', '用整数分（分/毫秒），或误差比较'],
          ['给数组赋 length', 'arr.length = 0 会清空数组', '要清空就写清空意图'],
          ['sort 改原数组', '排完原数组顺序变了', 'slice() 或 toSorted()'],
          ['forEach 不能 break', '写 return 只是跳过本轮', '要中途退出用 for...of'],
          ['提取方法后 this 丢了', 'const f = obj.m; f() 崩', 'bind(obj) 或箭头包一层'],
          ['隐式全局', '忘了声明直接赋值，在严格模式下报错', '永远声明 const/let'],
          ['浅拷贝当深拷贝', '{ ...obj } 后改内层还影响原对象', 'structuredClone()'],
          ['异步没 await', '拿到的是 Promise 对象', 'await，或用 .then'],
          ['JSON 丢类型', 'undefined / 函数 / Symbol 消失', '换成数组或显式字段']
        ]
      },
      {
        kind: 'prose',
        md: [
          '**性能**的次序永远是：先对、再清楚、最后才是快。绝大多数性能问题只出现在少数几处，凭感觉优化容易白费力气。',
          '',
          '几条成本极低的习惯：',
          '',
          '- 循环外能算的别放在循环里算。',
          '- 大数组要反复「在不在里面」，先建 `Set`，`has` 比 `includes` 快得多。',
          '- 拼大量字符串时推进数组再 `join`，别一路 `+=`。',
          '- 要改一批 DOM，先建好 Fragment 或先 `display: none` 摘下来，改完再挂回去。',
          '- 真要优化，先用 `console.time` / 性能面板量出来瓶颈在哪。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '**命名与结构**是熟练度最直观的体现：',
          '',
          '- 名字说明意图：`activeUsers` 好过 `list2`；布尔量用 `is/has/can` 开头。',
          '- 一个函数做一件事，长到需要滚动就该拆。',
          '- 参数超过三个，考虑收成一个对象（调用处就有名字了）。',
          '- 重复三次以上再抽象，别为「将来可能」提前设计。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex14-1',
        title: '分组',
        task: [
          '补完 `groupBy(arr, keyFn)`：按 `keyFn(元素)` 的返回值分组，返回形如 `{ 键: [元素...] }` 的对象。',
          '',
          '同一组内的元素保持原顺序。'
        ].join('\n'),
        starter: [
          'function groupBy(arr, keyFn) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function groupBy(arr, keyFn) {',
          '  return arr.reduce((acc, item) => {',
          '    const key = keyFn(item);',
          '    (acc[key] = acc[key] || []).push(item);',
          '    return acc;',
          '  }, {});',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(groupBy([1, 2, 3, 4], n => (n % 2 === 0 ? 'even' : 'odd')), { even: [2, 4], odd: [1, 3] });",
          "eq(groupBy([], n => n), {});",
          "eq(groupBy(['aa', 'b', 'cc'], s => s.length), { 1: ['b'], 2: ['aa', 'cc'] }, '键是数字时会变成字符串键');"
        ],
        hints: [
          '用 `reduce`，初始值是 `{}`。',
          '「这一组还没有数组」就建一个：`(acc[key] = acc[key] || []).push(item)`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-2',
        title: '分块',
        task: [
          '补完 `chunk(arr, size)`：把数组按 `size` 个一组切开，返回数组的数组；最后一块可以不满。'
        ].join('\n'),
        starter: [
          'function chunk(arr, size) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function chunk(arr, size) {',
          '  const out = [];',
          '  for (let i = 0; i < arr.length; i += size) {',
          '    out.push(arr.slice(i, i + size));',
          '  }',
          '  return out;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);",
          "eq(chunk([], 3), []);",
          "eq(chunk([1, 2], 5), [[1, 2]], 'size 比数组长时只切出一块');",
          "eq(chunk([1, 2, 3], 3), [[1, 2, 3]]);"
        ],
        hints: [
          '下标每次跳 `size`：`for (let i = 0; i < arr.length; i += size)`。',
          '每一块就是 `arr.slice(i, i + size)`——slice 超出范围不会报错，正好处理最后一块。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-3',
        title: '防抖',
        task: [
          '补完 `debounce(fn, ms)`：返回一个新函数，被连续调用时只在停止调用 `ms` 毫秒后执行**最后一次**（用最后一次的实参）。',
          '',
          '测试里会真的等定时器。'
        ].join('\n'),
        starter: [
          'function debounce(fn, ms) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function debounce(fn, ms) {',
          '  let timer = null;',
          '  return function (...args) {',
          '    clearTimeout(timer);',
          '    timer = setTimeout(() => fn(...args), ms);',
          '  };',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { let calls = 0; const d = debounce(() => { calls += 1; }, 20); d(); d(); d(); eq(calls, 0, '还没到时间不能执行'); return new Promise(r => setTimeout(() => { eq(calls, 1, '连续调用只执行最后一次'); r(); }, 60)); })();",
          "(() => { let last = null; const d = debounce(v => { last = v; }, 10); d('a'); d('b'); return new Promise(r => setTimeout(() => { eq(last, 'b', '要用最后一次的实参'); r(); }, 40)); })();",
          "(() => { let calls = 0; const d = debounce(() => { calls += 1; }, 10); d(); return new Promise(r => setTimeout(() => { eq(calls, 1); d(); setTimeout(() => { eq(calls, 2, '间隔足够长时每次都执行'); r(); }, 30); }, 40)); })();"
        ],
        hints: [
          '每次调用都 `clearTimeout(上一个)` 再重新 `setTimeout`，这就是防抖的全部。',
          '`timer` 存在闭包里，多个防抖函数互不干扰。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-4',
        title: '管道组合',
        task: [
          '补完 `pipe(...fns)`：返回一个新函数，把入参依次穿过每个函数（前一个的输出是后一个的输入），返回最后的结果。',
          '',
          '一个函数都没传时，原样返回入参。'
        ].join('\n'),
        starter: [
          'function pipe(...fns) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function pipe(...fns) {',
          '  return function (x) {',
          '    return fns.reduce((acc, fn) => fn(acc), x);',
          '  };',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(pipe(x => x + 1, x => x * 2)(3), 8, '先加一再乘二');",
          "eq(pipe()(5), 5, '没有函数时原样返回');",
          "eq(pipe(s => s.trim(), s => s.toUpperCase())('  hi '), 'HI');",
          "eq(pipe(n => n * n)(4), 16);"
        ],
        hints: [
          '`reduce` 的初值就是入参 `x`，累加器一路被下一个函数加工。',
          '注意顺序：`pipe(f, g)(x)` 等于 `g(f(x))`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-5',
        title: '记忆化',
        task: [
          '补完 `memoize(fn)`：返回一个新函数，相同实参只真正调用 `fn` 一次，之后直接给缓存的结果。',
          '',
          '实参顺序不同算不同的调用。'
        ].join('\n'),
        starter: [
          'function memoize(fn) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function memoize(fn) {',
          '  const cache = new Map();',
          '  return function (...args) {',
          '    const key = JSON.stringify(args);',
          '    if (!cache.has(key)) cache.set(key, fn(...args));',
          '    return cache.get(key);',
          '  };',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { let calls = 0; const slow = memoize(n => { calls += 1; return n * n; }); eq(slow(3), 9); eq(slow(3), 9); eq(calls, 1, '第二次应该命中缓存'); eq(slow(4), 16); eq(calls, 2); })();",
          "(() => { let calls = 0; const f = memoize((a, b) => { calls += 1; return a + b; }); eq(f(1, 2), 3); eq(f(1, 2), 3); eq(calls, 1, '多个实参也要能缓存'); eq(f(2, 1), 3, '顺序不同算不同调用'); eq(calls, 2); })();",
          "(() => { let calls = 0; const f = memoize(s => { calls += 1; return s.toUpperCase(); }); f('a'); f('a'); eq(calls, 1); })();"
        ],
        hints: [
          '用 `Map` 当缓存，键用 `JSON.stringify(args)` 把实参数组变成字符串。',
          '先 `cache.has(key)` 判断，没有才调 `fn` 并存回去。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
