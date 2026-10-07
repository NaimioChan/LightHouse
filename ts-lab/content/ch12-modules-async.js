/* 第 12 章 · 异步与 Promise 的类型。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch12',
    title: '第 12 章 · 异步与 Promise 的类型',
    goal: '看懂 Promise<T> 与 async / await 之间的类型对应，能写对 async 返回类型、用 Awaited 拆包、在 catch 里安全处理 unknown。',
    sections: [
      { kind: 'prose', md: [
        '异步操作不会立刻给出结果。它先返回一个**凭证**，等结果出来再交给你。这个凭证的静态类型是 `Promise<T>`：',
        '`T` 是**成功时那个值**的类型。',
        '',
        '- `Promise<string>`：将来会得到一个字符串',
        '- `Promise<number[]>`：将来会得到一个数字数组',
        '',
        '这一章讲的全是同一个动作的两面：`Promise<T>` 在外面，值是 `T` 在里面。把「现在是哪一层」看清，异步代码的类型就不会写错。'
      ].join('\n') },

      { kind: 'prose', md: [
        '## async 函数的返回类型',
        '给函数加 `async`，它的返回类型就**自动**是 `Promise<…>`。函数体里 `return 42`，返回值类型不是 `42`，也不是 `number`，',
        '而是 `Promise<number>`——`async` 帮你把值包进了 Promise。',
        '',
        '不写返回类型注解时，编译器自己推：`async function f() { return 42; }` 推出来是 `Promise<number>`。',
        '一旦手动写注解，就必须写 `Promise<…>` 这一层，写 `: number` 会被拒绝。'
      ].join('\n') },

      { kind: 'demo', caption: 'async 让返回类型多一层 Promise', code: [
        'function load(): Promise<string> {',
        '  return Promise.resolve(\'ok\');',
        '}',
        '',
        'async function loadFast() {',
        '  return 42;                 // 推成 Promise<number>',
        '}',
        '',
        'const p: Promise<string> = load();',
        'const q = loadFast();'
      ].join('\n'), checks: [
        'eqType(\'load\', \'() => Promise<string>\', \'load 的类型\')',
        'eqType(\'loadFast\', \'() => Promise<number>\', \'async 函数自动是 Promise<number>\')',
        'eqType(\'p\', \'Promise<string>\', \'p 的类型\')',
        'eqType(\'q\', \'Promise<number>\', \'q 的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## await 把值从 Promise 里取出来',
        '`await` 只能在 `async` 函数（或模块顶层）里用。它的作用是等这个 Promise 落定，然后把里面的值交给你：',
        '- `const text = await load();`（`load()` 返回 `Promise<string>`）',
        '',
        '这里 `text` 的类型是 `string`，不是 `Promise<string>`——**`await` 拆掉一层 Promise**。',
        '类型系统里有一个类型专门表示这个动作：`Awaited<T>`。`Awaited<Promise<string>>` 就是 `string`，',
        '而且它是递归的，`Awaited<Promise<Promise<number>>>` 也是 `number`。'
      ].join('\n') },

      { kind: 'demo', caption: 'await 取得内部类型，Awaited 在类型层做同一件事', code: [
        'async function load(): Promise<string> {',
        '  return \'ok\';',
        '}',
        '',
        'async function shout(): Promise<string> {',
        '  const text = await load();       // text 是 string',
        '  return text.toUpperCase();',
        '}',
        '',
        'type Unwrapped = Awaited<Promise<string>>;',
        'type Deep = Awaited<Promise<Promise<number>>>;'
      ].join('\n'), checks: [
        'eqType(\'load\', \'() => Promise<string>\', \'load 的类型\')',
        'eqType(\'shout\', \'() => Promise<string>\', \'shout 的类型\')',
        'eqType(\'Unwrapped\', \'string\', \'Awaited 拆掉一层 Promise\')',
        'eqType(\'Deep\', \'number\', \'Awaited 递归地把多层 Promise 拆到值\')',
        'noErrors()'
      ] },

      { kind: 'note', tone: 'tip', md: '`async` 函数无论 `return` 什么，函数类型都是 `() => Promise<…>`。看到 `async` 就先把外面那层 `Promise` 补上，再想里面值的类型。' },

      { kind: 'prose', md: [
        '## Promise.all：等一批，结果收进一个数组',
        '`Promise.all` 接收一个数组，等里面每一个 Promise 都完成，把各自的值收进一个新数组。结果类型是 `Promise<…>`，',
        '里面的元素类型取决于传进去的东西：',
        '',
        '- 传**字面量的数组**时，编译器按位置推成**元组**：`Promise.all([a(), b()])` 是 `Promise<[number, string]>`。',
        '- 传一个**已经标好元素类型的数组**时，推成同长的数组：元素是 `Promise<number>` 时结果是 `Promise<number[]>`。'
      ].join('\n') },

      { kind: 'demo', caption: '元组还是数组，看传进去的是不是定长的字面量', code: [
        'async function a(): Promise<number> { return 1; }',
        'async function b(): Promise<string> { return \'x\'; }',
        '',
        'const both = Promise.all([a(), b()]);          // Promise<[number, string]>',
        '',
        'const list: Promise<number>[] = [a(), a()];',
        'const many = Promise.all(list);                // Promise<number[]>'
      ].join('\n'), checks: [
        'eqType(\'both\', \'Promise<[number, string]>\', \'字面量数组推成元组\')',
        'eqType(\'list\', \'Promise<number>[]\', \'list 的类型\')',
        'eqType(\'many\', \'Promise<number[]>\', \'数组元素的 Promise 收成数组\')',
        'noErrors()'
      ] },

      { kind: 'table', head: ['写法', '类型 / 说明'], rows: [
        ['`Promise<string>`', '将来会得到一个 `string`'],
        ['`async function f(): Promise<number>`', '函数类型是 `() => Promise<number>`'],
        ['`await p`（`p` 是 `Promise<string>`）', '取出来是 `string`'],
        ['`Awaited<Promise<string>>`', '`string`，与 `await` 在类型层做的事一致'],
        ['`Promise.all([a(), b()])`', '`Promise<[A, B]>`，按位置推成元组'],
        ['`Promise.all(promiseList)`', '`Promise<T[]>`，`T` 是元素的 Promise 里的值'],
        ['`catch (e)`', '`e` 是 `unknown`，用之前必须自己收窄']
      ] },

      { kind: 'prose', md: [
        '## catch 里拿到的是 unknown',
        '`try / catch` 捕获到的东西类型上不保证是 `Error`——可能抛出来的是字符串、对象，或者别的任何值。',
        '所以在 `strict` 下，`catch` 绑定的变量类型是 `unknown`。',
        '',
        '`unknown` 上不能直接读属性，`e.message` 会报 `TS18046`。正路是先判断，再在判断成立的那一支里用它：',
        '- `if (e instanceof Error) { return e.message; }`',
        '',
        '`instanceof Error` 之后，那一支里的 `e` 已经被收窄成 `Error`，读 `.message` 就合法了。'
      ].join('\n') },

      { kind: 'demo', caption: '先 instanceof 收窄，再读 message', code: [
        'async function read(): Promise<string> {',
        '  try {',
        '    throw new Error(\'读失败了\');',
        '  } catch (e) {',
        '    // return e.message;   // ✗ TS18046：e 的类型是 unknown',
        '    if (e instanceof Error) {',
        '      return e.message;',
        '    }',
        '    return \'未知错误\';',
        '  }',
        '}'
      ].join('\n'), checks: [
        'eqType(\'read\', \'() => Promise<string>\', \'read 的类型\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 跑起来看一眼',
        '类型对不代表运行时对。下面这段在一个空白环境里跑：`async` 函数返回的 Promise 会在微任务里落定，',
        '`await` 拿到的就是函数体里 `return` 的那个值。'
      ].join('\n') },

      { kind: 'demo', caption: '运行时：await 取出的就是 return 的值', code: [
        'async function loadCount(): Promise<number> {',
        '  return 3;',
        '}',
        '',
        'async function main(): Promise<void> {',
        '  const n = await loadCount();',
        '  console.log(\'count=\' + n);',
        '}',
        '',
        'main();'
      ].join('\n'), run: true, checks: [
        'eqType(\'loadCount\', \'() => Promise<number>\', \'loadCount 的类型\')',
        'eqType(\'main\', \'() => Promise<void>\', \'main 的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'count=3\'], \'await 取出的值\')'
      ] },

      { kind: 'prose', md: [
        '## then 链上的类型，与永不返回的 async',
        '不用 `await` 也可以，`.then` 的回调拿到的是拆包后的值，`.then` 的结果又是一个 Promise。',
        '回调返回什么，外层 Promise 的元素类型就跟着变：',
        '- `p.then((n) => n * 2)`：`p` 是 `Promise<number>`，结果是 `Promise<number>`',
        '- `p.then((n) => \'n=\' + n)`：回调返回字符串，结果是 `Promise<string>`',
        '',
        '还有一种 async 函数永远不返回：函数体只抛错，或者一直不结束。它的返回类型可以写成 `Promise<never>`，',
        '调用处的后续代码会被判定为走不到。'
      ].join('\n') },

      { kind: 'demo', caption: 'then 链与 Promise<never>', code: [
        'const p: Promise<number> = Promise.resolve(1);',
        '',
        'const doubled = p.then((n) => n * 2);',
        'const label = p.then((n) => \'n=\' + n);',
        '',
        'async function fail(): Promise<never> {',
        '  throw new Error(\'不会返回\');',
        '}'
      ].join('\n'), checks: [
        'eqType(\'doubled\', \'Promise<number>\', \'回调返回 number，外层还是 Promise<number>\')',
        'eqType(\'label\', \'Promise<string>\', \'回调返回字符串，外层跟着变成 Promise<string>\')',
        'eqType(\'fail\', \'() => Promise<never>\', \'永不返回的 async 函数\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 练习',
        '下面五道题都围绕「现在是哪一层」：外面那层是 `Promise`，里面那层是值。改的时候只动该动的地方，' +
        '函数名、参数、其它代码都保留。'
      ].join('\n') },

      { kind: 'exercise', id: 'ex12-1', title: '给 async 函数写对返回类型', task: [
        '`greet` 是 `async` 函数，返回类型却写成了 `string`，编译器报 `TS1064`。',
        '',
        '把返回类型改成 `async` 函数该有的形式，保留函数名、参数和函数体。'
      ].join('\n'), starter: [
        'async function greet(name: string): string {',
        '  return \'hi \' + name;',
        '}'
      ].join('\n'), solution: [
        'async function greet(name: string): Promise<string> {',
        '  return \'hi \' + name;',
        '}'
      ].join('\n'), tests: [
        'eqType(\'greet\', \'(name: string) => Promise<string>\', \'greet 的返回类型\')',
        'noErrors()'
      ], hints: [
        '`async` 函数 `return` 的值会被自动包进 Promise，所以返回类型要写 `Promise<…>`。',
        '把原来的 `: string` 换成 `: Promise<string>`，别加别的。'
      ] },

      { kind: 'exercise', id: 'ex12-2', title: '把 Promise 里的 any 收成具体类型', task: [
        '`load` 的返回类型是 `Promise<any>`，调用处拿不到任何类型信息。',
        '',
        '把它收成 `Promise<number>`，保留函数名、`Promise.resolve(42)` 和下面的调用。'
      ].join('\n'), starter: [
        'function load(): Promise<any> {',
        '  return Promise.resolve(42);',
        '}',
        '',
        'load().then((n) => {',
        '  console.log(n * 2);',
        '});'
      ].join('\n'), solution: [
        'function load(): Promise<number> {',
        '  return Promise.resolve(42);',
        '}',
        '',
        'load().then((n) => {',
        '  console.log(n * 2);',
        '});'
      ].join('\n'), tests: [
        'eqType(\'load\', \'() => Promise<number>\', \'load 的返回类型里不该再有 any\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'84\'], \'运行输出\')'
      ], hints: [
        '`Promise<any>` 会让 `.then` 里的 `n` 也变成 `any`，`n * 2` 写错也看不出来。',
        '把尖括号里的 `any` 换成 `Promise.resolve(42)` 里那个值的类型。'
      ] },

      { kind: 'exercise', id: 'ex12-3', title: '用 Awaited 拆一层', task: [
        '`Un` 现在是 `Promise<number>`，但你要的是里面那个 `number`。',
        '',
        '用 `Awaited` 把 `Un` 改成拆出来的值类型，`load` 不要动。'
      ].join('\n'), starter: [
        'async function load(): Promise<number> {',
        '  return 1;',
        '}',
        '',
        'type Un = ReturnType<typeof load>;'
      ].join('\n'), solution: [
        'async function load(): Promise<number> {',
        '  return 1;',
        '}',
        '',
        'type Un = Awaited<ReturnType<typeof load>>;'
      ].join('\n'), tests: [
        'eqType(\'Un\', \'number\', \'Un 应该是拆出来的值类型\')',
        'eqType(\'load\', \'() => Promise<number>\', \'load 的类型\')',
        'noErrors()'
      ], hints: [
        '`Awaited<T>` 做的事和 `await` 一样：把 `Promise` 拆掉一层。',
        '把整条 `ReturnType<…>` 包进 `Awaited<…>` 里。'
      ] },

      { kind: 'exercise', id: 'ex12-4', title: '在 catch 里安全地取错误信息', task: [
        '`catch` 里的 `e` 类型是 `unknown`，直接读 `e.message` 编译器报 `TS18046`。',
        '',
        '把它改成先判断再取：只有在 `e` 确实是 `Error` 时才读 `message`，否则返回 `\'未知错误\'`。',
        '函数名、`try` 里抛的错误、下面的调用都保留。'
      ].join('\n'), starter: [
        'async function describe(): Promise<string> {',
        '  try {',
        '    throw new Error(\'boom\');',
        '  } catch (e) {',
        '    return e.message;',
        '  }',
        '}',
        '',
        'describe().then((s) => {',
        '  console.log(s);',
        '});'
      ].join('\n'), solution: [
        'async function describe(): Promise<string> {',
        '  try {',
        '    throw new Error(\'boom\');',
        '  } catch (e) {',
        '    if (e instanceof Error) {',
        '      return e.message;',
        '    }',
        '    return \'未知错误\';',
        '  }',
        '}',
        '',
        'describe().then((s) => {',
        '  console.log(s);',
        '});'
      ].join('\n'), tests: [
        'noErrors(\'catch 里的 e 用之前要先收窄\')',
        'eqType(\'describe\', \'() => Promise<string>\', \'describe 的类型\')',
        'await run();',
        'eqLogs([\'boom\'], \'运行输出\')'
      ], hints: [
        '`strict` 下 `catch` 绑定的变量是 `unknown`，上面没有 `.message` 只有先收窄之后才有。',
        '用 `if (e instanceof Error)` 把它收窄成 `Error`，再在 `if` 里 `return e.message;`，收窄不成立时返回兜底字符串。'
      ] },

      { kind: 'exercise', id: 'ex12-5', title: 'Promise.all 的结果类型', task: [
        '`Promise.all` 接收一个 `Promise<number>[]`，等全部完成后把值收进一个新数组。',
        '',
        '`all` 现在的类型标错了，会报 `TS2322`。把它改成正确的类型，其余代码不动。'
      ].join('\n'), starter: [
        'async function num(): Promise<number> {',
        '  return 1;',
        '}',
        '',
        'const list: Promise<number>[] = [num(), num()];',
        '',
        'const all: Promise<number> = Promise.all(list);'
      ].join('\n'), solution: [
        'async function num(): Promise<number> {',
        '  return 1;',
        '}',
        '',
        'const list: Promise<number>[] = [num(), num()];',
        '',
        'const all: Promise<number[]> = Promise.all(list);'
      ].join('\n'), tests: [
        'eqType(\'all\', \'Promise<number[]>\', \'all 的类型\')',
        'notAssignableTo(\'all\', \'Promise<number>\', \'all 等出来的是一串数字，不是一个数字\')',
        'noErrors()'
      ], hints: [
        '`Promise.all` 把每个 Promise 里的值都收进一个数组，所以结果里那层是数组。',
        '数一下 `all` 上的 `await` 会得到「一个数字」还是「一串数字」，注解就照那个写。'
      ] },

      { kind: 'prose', md: [
        '## 类型导出：export type',
        '真正跨文件共享类型要写 `export`，另一个文件再 `import type` 进来。这个站是**单文件判题**——',
        '一段代码自己在浏览器里判题、自己跑，没有第二个文件可以 `import`，所以这里的代码不写 `import`。',
        '',
        '类型层的导出仍然可以写，用来认语法：',
        '- `export type Role = \'admin\' | \'user\';`',
        '',
        '`export type` 只把类型交出去，编译成 `.js` 之后它一行代码都不剩（剩下的只是一个空的模块标记）。',
        '真正需要多文件协作时，项目里就是 `export` 一个文件、`import` 另一个文件；单文件练习里，',
        '把导出当成「给这个类型贴上对外的名字」就够用了。'
      ].join('\n') },

      { kind: 'demo', caption: 'export type 只导出类型', code: [
        'export type Role = \'admin\' | \'user\';',
        '',
        'const role: Role = \'admin\';'
      ].join('\n'), checks: [
        'eqType(\'Role\', \'"admin" | "user"\', \'导出的类型别名\')',
        'eqType(\'role\', \'"admin" | "user"\', \'role 的类型\')',
        'noErrors()'
      ] },

      { kind: 'note', md: '带 `export`（或 `import`）的代码编译出来是**模块**，没法当普通脚本直接跑。想在这一章里 `await run()` 看输出，就别在同一段代码里写 `export`。' },

      { kind: 'prose', md: [
        '## 收束',
        '异步的类型只有一个核心问题：值现在是 `Promise<T>` 这一层，还是 `T` 那一层。',
        '`async` 函数把值包进 `Promise`，`await` 和 `Awaited` 把它拆出来；`Promise.all` 把一批拆成一个数组，',
        '定长的字面量给元组、数组给数组。`catch` 绑定的变量是 `unknown`，先收窄再读字段。',
        '把这几个「层」的位置记住，读别人的异步代码时返回类型就都能推出来了。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
