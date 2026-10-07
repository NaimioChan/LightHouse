(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch11',
    title: '第 11 章 · 异步：Promise 与 async/await',
    goal: '搞明白「等待」是怎么回事：会用 Promise、会写 async 函数、会用 Promise.all 并发。',
    sections: [
      {
        kind: 'prose',
        md: [
          'JS 只有一个线程。遇到要等的事（网络、定时器、读文件），它不会傻等，而是**把回调登记下来，继续往下跑**；等结果来了再回头执行那段回调。',
          '',
          '所以同步代码永远先跑完。下面这段的输出顺序值得记住：'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '同步先于异步',
        code: [
          'console.log("1 同步开始");',
          'setTimeout(() => console.log("3 定时器回调"), 0);',
          'console.log("2 同步结束");',
          '',
          '// 就算延时写 0，回调也在当前这段代码跑完之后才执行'
        ].join('\n'),
        expect: '1 同步开始\n2 同步结束\n3 定时器回调'
      },
      {
        kind: 'prose',
        md: [
          '`Promise` 是「将来会有结果」的凭据，三个状态：等待中、成功（fulfilled）、失败（rejected）。',
          '',
          '- `new Promise((resolve, reject) => {...})` 手动造一个。',
          '- `.then(值 => ...)` 接成功，`.catch(错误 => ...)` 接失败，`.finally` 都跑，`.then` 返回的还是 Promise，所以能串起来。',
          '- 一次 Promise 只能落定一次，之后的状态不会再变。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '造一个 Promise',
        code: [
          'function delay(ms, value) {',
          '  return new Promise(resolve => setTimeout(() => resolve(value), ms));',
          '}',
          '',
          'delay(10, "结果").then(v => console.log("拿到:", v));',
          '',
          'function fail() {',
          '  return Promise.reject(new Error("坏了"));',
          '}',
          'fail()',
          '  .then(() => console.log("不会走到这里"))',
          '  .catch(e => console.log("接住错误:", e.message));'
        ].join('\n'),
        expect: '接住错误: 坏了\n拿到: 结果'
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '上面两行的顺序说明一件事：`delay(10)` 要等 10 毫秒，`fail()` 立刻失败，所以 catch 先打印。顺序由时间决定，不由书写顺序决定。'
      },
      {
        kind: 'prose',
        md: [
          '`async/await` 是把 Promise 写得更像同步代码的语法糖：',
          '',
          '- `async function` 一定返回 Promise。',
          '- `await p` 等 p 出结果，成功就拿值，失败就**在这行抛错**——所以用 `try/catch` 接。',
          '- `await` 只能在 async 函数（或模块顶层）里用。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'async / await',
        code: [
          'function delay(ms, value) {',
          '  return new Promise(resolve => setTimeout(() => resolve(value), ms));',
          '}',
          '',
          'async function run() {',
          '  const a = await delay(5, "第一步");',
          '  console.log(a);',
          '  try {',
          '    await Promise.reject(new Error("第二步失败"));',
          '  } catch (e) {',
          '    console.log("catch:", e.message);',
          '  }',
          '  return "收工";',
          '}',
          '',
          'run().then(r => console.log("返回值:", r));'
        ].join('\n'),
        expect: '第一步\ncatch: 第二步失败\n返回值: 收工'
      },
      {
        kind: 'prose',
        md: [
          '要同时发起多个互不依赖的等待，用 `Promise.all`。它返回一个 Promise，等全部成功给你结果数组；**只要有一个失败，整体立刻失败**。',
          '',
          '`Promise.allSettled` 不管成败都等齐，返回每项的状态——想「一批里成功了几个」就用它。',
          '',
          '在循环里 `await` 是**串行**的：三个 30 毫秒的任务要 90 毫秒。想并发就把 Promise 先攒起来再 `Promise.all`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '并发：Promise.all',
        code: [
          'function delay(ms, value) {',
          '  return new Promise(resolve => setTimeout(() => resolve(value), ms));',
          '}',
          '',
          'async function main() {',
          '  const started = Date.now();',
          '  const all = await Promise.all([delay(30, "a"), delay(30, "b"), delay(30, "c")]);',
          '  console.log(all);',
          '  console.log("并发三个 30ms 任务用了不到 100ms:", Date.now() - started < 100);',
          '',
          '  const settled = await Promise.allSettled([',
          '    delay(5, "成功"),',
          '    Promise.reject(new Error("失败"))',
          '  ]);',
          '  console.log(settled.map(r => r.status));',
          '}',
          'main();'
        ].join('\n'),
        expect: "[ 'a', 'b', 'c' ]\n并发三个 30ms 任务用了不到 100ms: true\n[ 'fulfilled', 'rejected' ]"
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '最常见的两个异步 bug：忘记 `await` 拿到的是一个 Promise 对象（打印出来是 `Promise { <pending> }`），以及在 `forEach` 里写 `async` 回调却指望它被等——`forEach` 不认 Promise，改用 `for...of` + `await` 或 `Promise.all(arr.map(...))`。'
      },
      {
        kind: 'exercise',
        id: 'ex11-1',
        title: '延时返回',
        task: [
          '补完 `delay(ms, value)`：返回一个 Promise，`ms` 毫秒后以 `value` 兑现。',
          '',
          '测试里会真的等一会儿。'
        ].join('\n'),
        starter: [
          'function delay(ms, value) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function delay(ms, value) {',
          '  return new Promise(resolve => setTimeout(() => resolve(value), ms));',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(typeof delay(0, 1).then, 'function', '要返回 Promise');",
          "eq(await delay(5, 'ok'), 'ok');",
          "eq(await delay(1, 42), 42, 'value 是数字也要原样给');",
          "(() => { const t0 = Date.now(); return delay(30, 1).then(() => ok(Date.now() - t0 >= 25, '确实等了至少 25ms')); })();"
        ],
        hints: [
          '`new Promise(resolve => { setTimeout(() => resolve(value), ms); })`。',
          '别忘了 return 这个 Promise。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-2',
        title: '并发加载',
        task: [
          '补完 `loadAll(items, fn)`：对每个元素调用一次 `fn(item)`（返回 Promise），用 `Promise.all` 并发等齐，返回结果数组。',
          '',
          '顺序要和 `items` 一致。'
        ].join('\n'),
        starter: [
          'function loadAll(items, fn) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function loadAll(items, fn) {',
          '  return Promise.all(items.map(item => fn(item)));',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(await loadAll([1, 2, 3], async n => n * 2), [2, 4, 6]);",
          "eq(await loadAll([], async n => n), [], '空数组直接得到空结果');",
          "(() => { const wait = ms => new Promise(r => setTimeout(r, ms)); const t0 = Date.now(); return loadAll([1, 2, 3], n => wait(30).then(() => n)).then(r => { eq(r, [1, 2, 3]); ok(Date.now() - t0 < 85, '要并发执行，别一个等一个'); }); })();"
        ],
        hints: [
          '先把每个元素变成 Promise 数组（用 map），再交给 `Promise.all`。',
          '如果在 `for` 循环里 `await`，三个任务就会串起来，第二组断言会失败。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-3',
        title: '失败的异步就给兜底',
        task: [
          '补完 `tryAsync(fn, fallback)`：调用 `fn()`（可能是 async 函数、也可能直接抛错），成功返回结果；失败或拒绝时返回 `fallback`。'
        ].join('\n'),
        starter: [
          'function tryAsync(fn, fallback) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function tryAsync(fn, fallback) {',
          '  try {',
          '    return Promise.resolve(fn()).catch(() => fallback);',
          '  } catch (e) {',
          '    return Promise.resolve(fallback);',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(await tryAsync(async () => 1, 'x'), 1);",
          "eq(await tryAsync(async () => { throw new Error('boom'); }, 'x'), 'x');",
          "eq(await tryAsync(() => { throw new Error('同步抛错'); }, 0), 0, '同步抛错也要兜住');",
          "eq(await tryAsync(async () => Promise.reject(new Error('拒绝')), 'fallback'), 'fallback');"
        ],
        hints: [
          '两条路都要管：`fn()` 立刻抛错（用 try/catch），和 `fn()` 返回被拒绝的 Promise（用 .catch）。',
          '不管哪条路，最终都要返回一个 Promise——用 `Promise.resolve(...)` 包一下。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-4',
        title: '一个一个来',
        task: [
          '补完 `inOrder(tasks)`：`tasks` 是一组「返回 Promise 的函数」，**顺序**执行，前一个完成后再开始下一个，最后返回结果数组。',
          '',
          '必须真的是串行，不能并发。'
        ].join('\n'),
        starter: [
          'function inOrder(tasks) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function inOrder(tasks) {',
          '  return (async () => {',
          '    const out = [];',
          '    for (const task of tasks) {',
          '      out.push(await task());',
          '    }',
          '    return out;',
          '  })();',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(await inOrder([async () => 1, async () => 2, async () => 3]), [1, 2, 3]);",
          "(() => { const wait = ms => new Promise(r => setTimeout(r, ms)); const order = []; return inOrder([async () => { await wait(20); order.push(1); }, async () => { order.push(2); }]).then(() => eq(order, [1, 2], '第二个必须等第一个做完')); })();",
          "eq(await inOrder([]), []);"
        ],
        hints: [
          '用 `for...of` 循环 + `await`：`out.push(await task())`，天然串行。',
          '整个函数要返回 Promise，所以要么写成 `async function`，要么用立即执行的 async 箭头函数包一层。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
