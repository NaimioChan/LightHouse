# 内容契约 v1

`content/*.js` 里的一切都必须符合本文档。改这里 = 同时改 `tools/verify-content.mjs`、`assets/js/judge.js`、`assets/js/render.js` 三处。

## 章节文件

每个文件一个章节，classic script（**不能用 ESM**，`file://` 下会白屏），UMD 尾巴挂到全局注册表：

```js
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 类型注解与推断',
    goal: '一句话：学完能写出什么。',
    sections: [ /* 见下 */ ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | `chNN`，全局唯一，文件名必须以它开头，决定排序 |
| `title` | string | ✓ | 目录与页首标题 |
| `goal` | string | ✓ | 一句话 |
| `sections` | Section[] | ✓ | 顺序即阅读顺序 |

文件名：`content/chNN-短名.js`（如 `ch04-arrays-tuples.js`），并且必须已经在 `index.html` 里按顺序引入。

## 五种 Section

### `prose` — 讲解段落

```js
{ kind: 'prose', md: '用 `let` 声明……\n\n段落之间空一行。' }
```

支持的 md 子集（`render.js` 的 mini-markdown，**仅此而已**）：
`## 小标题`、`### 小标题`、段落、`- 无序列表`、`1. 有序列表`、行内 `` `code` ``、`**粗体**`、`*斜体*`。
不支持表格、图片、链接、嵌套列表。要表格用 `kind: 'table'`。

行内 `code` 先被摘出来再跑强调规则，所以反引号里的 `*` 原样显示（写 `*` 或 `**` 这类符号时不会被当成斜体）。

### `note` — 提示 / 警告

```js
{ kind: 'note', tone: 'tip', md: '短句。' }     // tone: tip | warn（省略 = warn 样式）
```

### `table` — 对照表

```js
{ kind: 'table', head: ['写法', '类型'], rows: [['`let a = 1`', '`number`']] }
```

单元格走讲解用的那套行内 markdown。整张表要等宽就写 `code: true`。

### `demo` — 当场判题的示例

```js
{
  kind: 'demo',
  caption: 'let 与 const 推出来的类型不同',   // 可选，示例上方的小标题
  code: ['const a = \'x\';', 'let b = \'x\';'].join('\n'),
  tsconfig: { strict: false },                 // 可选，见「tsconfig」
  run: true,                                   // 可选，true = 除了类型检查还跑一次编译产物
  checks: [                                    // ✓ 必填，≥1 条
    'eqTypeExact(\'a\', \'"x"\', \'const 推字面量\')',
    'eqType(\'b\', \'string\', \'let 推宽类型\')'
  ]
}
```

页面上打开即判题（不用点按钮），下面显示运行输出（有的话）、一个「看编译产物」的折页，
以及自检结果（全过则什么都不显示，挂了显示一条红字说明这个示例自己也站不住）。
`checks` 也是内容校验的一部分：`tools/verify-types.mjs` 与浏览器自测都会重跑一遍，必须全过。

### `exercise` — 练习

```js
{
  kind: 'exercise',
  id: 'ex01-3',                       // 全局唯一，exNN-M，NN 与所在章号一致
  title: '外部数据用 unknown',
  task: 'markdown 子集：说清要写什么、要满足哪些条件。',
  starter: ['const raw: any = \'hello\';'].join('\n'),   // 起始代码（字符串）
  solution: ['const raw: unknown = \'hello\';'].join('\n'), // 参考答案（完整字符串，不做合并）
  tests: [...],                       // ✓ ≥2 条断言
  hints: ['……'],                      // ✓ ≥1 条，逐条点开
  tsconfig: { strict: false }         // 可选
}
```

硬要求（`tools/verify-content.mjs` 会查）：

- `starter !== solution`，且 **起始代码至少要挂掉一条断言**（否则这道题抓不住空实现）。
- 参考答案必须让**全部**断言通过。
- 每道题的 `tests` 里至少有一条是「真的在断类型或诊断」，不许全是 `ok(true)`。

## 断言辅助（`tests` / `checks` 里可用）

断言是**字符串**，被编译成 `async function` 执行，所以里面可以写 `await`。能看见的东西：

| 名字 | 含义 |
|---|---|
| `d` | 诊断数组，每条 `{ code, line, col, msg, text }`；`d.length` 就是错误条数 |
| `codes` | 只有错误码的数组，如 `[2322, 7006]` |
| `noErrors(msg?)` | 必须没有任何类型错误 |
| `countErrors(n, msg?)` | 错误条数必须等于 n |
| `hasError(code, msg?)` | 必须出现该错误码（`2322` 或 `'TS2322'` 都行） |
| `notError(code, msg?)` | 不许出现该错误码 |
| `errorAt(line, code?, msg?)` | 第 line 行（从 1 起）必须有错误，给了 code 就要求是那个码 |
| `noErrorAt(line, msg?)` | 第 line 行不许有错误 |
| `type(name)` | 取类型并返回**字符串**，如 `'number[]'`、`'() => void'`；配合 `ok()` 用 |
| `exists(name, msg?)` | 代码里声明了这个名字 |
| `memberNames(name)` | 该类型的属性名数组（已排序），配合 `eq()` 用 |
| `eqType(name, expected, msg?)` | 类型等价（**忽略字面量与宽类型之别**：`"abc"` 与 `string` 视为同类） |
| `eqTypeExact(name, expected, msg?)` | 严格等价（`"abc"` 与 `string` 不相等）——教 `const`/`let` 推断时用这个 |
| `assignableTo(name, expected, msg?)` | 该类型能赋值给 expected |
| `notAssignableTo(name, expected, msg?)` | 不能赋值给 expected |
| `await run()` | 把**编译产物**丢进沙箱 iframe 跑一次。返回 `{ logs, error }` |
| `eqLogs(array, msg?)` | 最近一次 `run()` 的控制台输出逐行等于 array（先 `await run()`） |
| `logs` | 最近一次 `run()` 的输出数组（字符串） |
| `js()` | 编译产物本身（字符串），教「类型在运行时剩下什么」时用 |
| `jsHas(sub, msg?)` | 编译产物里必须出现 sub |
| `notJsHas(sub, msg?)` | 编译产物里不许出现 sub（例如 `interface` 应当消失） |
| `eq(actual, expected, msg?)` | 用 `TSLAB_fmt` 格式化后逐字比较（对象、数组、字符串都行） |
| `ok(cond, msg?)` | 条件为假就抛错 |
| `near(a, b, tol, msg?)` | 数值近似 |
| `fmt(v)` | 值格式化成字符串 |

规则：

- **期望类型必须是单引号字符串字面量**，且**自包含**——它会被放进另一个文件里解析，
  所以不能引用用户代码里的名字。`eqType('st', 'Status')` ✗，`eqType('st', '\'idle\' | \'busy\'')` ✓。
- `name` 支持点号路径：`Box.size`、`Pair.b.c`。函数用函数类型整体比：`eqType('add', '(x: number) => number')`。
- **不用写 `!!` 之类的兜底**：每条辅助失败时都会抛错，错误信息里一定带「期望 X，实际 Y」。
  失败信息里的「期望」用的是你写在断言里的那串类型（不是编译器内部的别名名），所以直接写人话。
- 期望类型里要写字符串字面量就用双引号包单引号（`'"dark"'`），这样可以避免在内容里写一层转义地狱。
- 内容文件用单引号包字符串、内部单引号写 `\'`；代码用 `[ 'line', 'line' ].join('\n')` 逐行写，**别用模板字符串**
  （讲解里到处是反引号）。

写内容时踩过的坑（都已经实测确认，别重复踩）：

| 坑 | 事实 | 怎么办 |
|---|---|---|
| `any` 藏在里面 | `eqType` 会把双向可赋值当等价，而 `any` 与任何类型都互相可赋值。现在 `judge.js` 会专门扫一层：`any[]`、`Promise<any>`、`{ a: any }`、参数是 `any` 的函数都不能冒充具体类型 | 直接 `eqType` 就抓得住；只有**用户文件里写的** any 算数，lib 内部的 any（`Promise.catch` 的 `onrejected`）不算 |
| `readonly` 看不见 | 双向可赋值不看只读修饰符，`eqType('T', '{ readonly id: number }')` 对非只读的同形类型照样通过 | 要断言只读就断言行为：代码里给该属性赋值，然后 `hasError(2540)` 或 `errorAt(行, 2540)` |
| `type('别名')` 给的是别名名 | `type('User')` 打印 `User` 而不是结构（对象字面量变量才给结构） | 别名一律用 `eqType` + 内联期望串；不要用 `eq(type(...), '…')` |
| DOM 全局名会撞车 | 默认 lib 含 DOM，脚本顶层声明 `Event` / `Text` / `Image` / `Option` / `origin` / `Location` 之类会同名冲突（TS2451 / TS2300） | 换名字（`Action`、`zero`…）；`errorAt` / `hasError` 里写这些码也行，但多半不是你想要的 |
| 多实参 console.log | `console.log(a, b)` 的输出是**一行**（空格连接），`eqLogs` 的每一条来自独立的 `console.log` | 一行一个 `console.log` |
| 少写/多写一层转义 | 内容里到处是单引号，`\\'`（两个反斜杠）几乎总是笔误 | `verify-content.mjs` 会直接报出来 |

常见错误码（实测）：`2353` 多余属性、`2741` 缺必填属性、`2540` 给只读属性赋值、`2554` 实参个数不对、
`7006` 参数隐式 any、`18048` 值可能为 undefined、`2322` 类型不符、`2339` 属性不存在、
`2532` 对象可能为 undefined（要对**索引元素**开 `noUncheckedIndexedAccess` 才会出现）、`2300` 标识符重复。
不确定就写个小例子跑一遍 `verify-types.mjs`，失败信息会回显实际的码。

## tsconfig

练习与示例都可以给一个 `tsconfig` 覆盖项，用来教 strict 开关、target 差异这类事。**只能写这些键**，
写别的名字会在校验期报错：

- 枚举型：`target`（`ES5` / `ES2015`…`ES2024` / `ESNext`）、`module`（`None` / `CommonJS` / `ESNext` …）
- 布尔型：`strict`、`noImplicitAny`、`strictNullChecks`、`strictFunctionTypes`、`strictPropertyInitialization`、
  `exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`noImplicitReturns`、`noImplicitThis`、
  `noImplicitOverride`、`useDefineForClassFields`、`experimentalDecorators`、`noUnusedLocals`、
  `noUnusedParameters`、`verbatimModuleSyntax`、`isolatedModules`、`allowUnreachableCode` 等（见 `judge.js` 的 `BOOL_OPTS`）

默认（不写 `tsconfig` 时）：`strict: true`、`target: ES2020`、`module: ESNext`、`skipLibCheck: true`、
`types: []`，lib 是 `lib.es2020.full`（含 DOM）。

## 执行模型：什么跑在哪

```
用户代码（TS 文本）
  ├─→ 类型检查：父页面主线程里的 ts.createProgram（lib 的 SourceFile 复用 + oldProgram 增量）
  │     诊断、类型等价判定、断言列表都在这一侧
  └─→ 同一个 Program 的 emit → 编译产物 JS 文本（这才是这台编译器真会给你的东西：
        const enum 成员会内联、`useDefineForClassFields` 随 target 走、target 一改产物就变）
        ├─ 显示在「编译产物」页签，断言里可以用 js() / jsHas() / notJsHas() 读它
        └─ 需要运行时（await run()）：丢进 sandbox="allow-scripts" 的 iframe（opaque origin）
             里面只有一份截流控制台的内核，输出经 postMessage 回到父页面
```

由此确定内容里能做什么、不能做什么：

- 断言**看不到** TS 的类型信息之外的东西——它就是类型检查的结果。
- 运行时环境是一个空白的沙箱 iframe：有 `console`、`Promise`、定时器（安静 30ms 收工、最长 1.5 秒），
  **没有 DOM 内容可依赖**，`localStorage` 会抛 SecurityError，任何网络请求都会被拒。
- 运行时练习**不许用 `import` / `export`**：编译产物里带模块语法没法当普通脚本执行，
  判题会直接给一条「不能用模块语法」的错。教模块语法请用 `eqType` / `hasError` 这类类型层断言。
- 死循环会被 5 秒超时掐掉并给出提示。

## 写作规范

- 中文，高效少废话。不写「众所周知」「值得注意的是」「总之」，不写排比，不写总结式收尾。
- 每章开头一句 `goal`：这一章学完你能写出什么。
- 讲解里出现的类型名、关键字、错误码都用行内 `code` 包起来。
- 每章至少 3 个示例、4 道练习，且练习要覆盖本章的主要知识点。
- 每章的练习与示例只能用到**本章及之前章节**讲过的东西。
- 不用 emoji。
- 错误码要写真实的：先在 `tools/verify-judge.mjs` 那种方式里跑一遍，别猜（猜错了 `hasError` 会一直在说明里回显实际错误）。
