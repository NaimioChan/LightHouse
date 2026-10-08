# 内容契约 v1

`content/*.js` 里的一切都必须符合本文档。改这里 = 同时改 `tools/verify-content.mjs` 与 `assets/js/render.js`、`assets/js/compile.js`。

## 章节文件

每个文件一个章节，classic script（**不能用 ESM**，`file://` 下会白屏），UMD 尾巴挂到全局注册表：

```js
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'chNN',
    title: '第 N 章 · 标题',
    goal: '一句话：学完能写出什么。',
    sections: [ /* 见下 */ ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | `chNN`，全局唯一，文件名必须以它开头，决定排序 |
| `title` | string | ✓ | 目录与页首标题，以「第 N 章 · 」开头 |
| `goal` | string | ✓ | 一句话 |
| `sections` | Section[] | ✓ | 顺序即阅读顺序 |

文件名：`content/chNN-短名.js`，且必须已经在 `index.html` 里按顺序引入。

## 五种 Section

### `prose` — 讲解段落

```js
{ kind: 'prose', md: '用 `useState` 声明会变的值。\n\n段落之间空一行。' }
```

支持的 md 子集（`render.js` 的 mini-markdown，**仅此而已**）：
`## 小标题`、`### 小标题`、段落、`- 无序列表`、`1. 有序列表`、行内 `` `code` ``、`**粗体**`、`*斜体*`。
不支持表格、图片、链接、嵌套列表。要表格用 `kind: 'table'`。

### `note` — 提示 / 警告

```js
{ kind: 'note', tone: 'tip', md: '短句。' }     // tone: tip | warn（省略 = warn 样式）
```

### `table` — 对照表

```js
{ kind: 'table', head: ['写法', '结果'], rows: [['`useState(0)`', '`[n, setN]`']] }
```

单元格走讲解用的那套行内 markdown。整张表要等宽就写 `code: true`。

### `demo` — 当场判题的示例

```js
{
  kind: 'demo',
  caption: 'useState 与普通变量不同',           // 可选
  code: [
    "import { useState } from 'react'",
    "import htm from 'htm'",
    'const html = htm.bind(React.createElement)',
    'export default function App() { const [n, setN] = useState(0); return html`<p class="n">${n}</p>` }'
  ].join('\n'),
  tests: [                                  // ✓ 必填，≥1 条
    'eq(text(".n"), "0", "初始值")'
  ],
  show: 'preview'                            // 可选：preview | none（默认 preview）
}
```

页面上打开即运行（不用点按钮），下面显示渲染结果、改写产物（折页）、以及断言结果。

### `exercise` — 练习

```js
{
  kind: 'exercise',
  id: 'ex01-3',                             // 全局唯一，exNN-M，NN 与所在章号一致
  title: '让按钮点一下加一',
  task: 'markdown 子集：说清要写什么、要满足哪些条件。',
  starter: [ '...' ].join('\n'),
  solution: [ '...' ].join('\n'),
  tests: [                                  // ✓ ≥2 条断言，至少一条读 DOM
    'eq(text("button"), "0", "初始值")',
    'click("button"); await tick();',
    'eq(text("button"), "1", "点一次之后")'
  ],
  hints: ['……']                             // ✓ ≥1 条，逐条点开
}
```

硬要求（`tools/verify-content.mjs` 会查）：

- `starter !== solution`，且**起始代码至少要挂一条断言**。
- 参考答案必须让**全部**断言通过。
- 每道题的 `tests` 里至少有一条是「真的在读 DOM」。
- 不许依赖外部状态；源码只准 `import` react / react-dom / react-dom/client / htm。
- 每段代码都要 `export default` 根组件。

## htm 代码块在内容文件里怎么写

htm 的模板串用反引号。代码块本身是**外层单引号字符串数组** `[ 'line' ].join('\n')` 拼出来的，
只要把每行写成单引号字符串，行内的反引号就是普通字符，不用转义：

```js
{
  kind: 'demo',
  caption: '计数器',
  code: [
    "import { useState } from 'react'",
    'export default function App() {',
    '  const [n, setN] = useState(0)',
    '  return html`<button class="b" onClick=${() => setN(n + 1)}>${n}</button>`',
    '}'
  ].join('\n'),
  tests: [ 'eq(text(".b"), "0", "初始是 0")' ]
}
```

注意两种引号的配合：外层行用单引号，行内的反引号原样写，行内要写单引号（比如字符串字面量）
的场合就改用双引号包这一行（`"const s = 'x'"`）。

`html` 由沙箱注入成全局，代码里直接用，不用自己 `htm.bind`（写了也不报错，见下）。

### 可用的全局

沙箱里用户代码能直接用这些：

| 名字 | 是什么 |
|---|---|
| `html` | `htm.bind(React.createElement)`，写模板用 |
| `htm` | htm 本体（一般用不到，`html` 已经绑好了） |
| `React` | React 19 的完整命名空间（`React.createElement`、`React.useMemo`…） |
| `ReactDOM` | react-dom（`ReactDOM.flushSync`） |
| `ReactDOMClient` | react-dom/client（`createRoot`，判题时自己用，用户一般用不到） |

这些名字是沙箱的**全局**，不是用户代码的形参。所以用户代码里可以照真实工程那样写
`const html = htm.bind(React.createElement)`（`html` 这个名字只是遮蔽了全局，不报错），
也可以直接省掉这一行用现成的全局 `html`。练习与示例两种写法都收。

所以用户代码**不需要**写 `import React from 'react'` 才能用 `React`（沙箱里它已在作用域里），
但练习里仍鼓励写 `import { useState } from 'react'` 这类具名导入，因为它更接近真实工程写法，
改写内核也支持。

## 断言辅助（`tests` 里可用）

断言是**字符串**，被编译成 async 函数执行，所以里面可以写 `await tick()`。能看见的东西：

| 名字 | 含义 |
|---|---|
| `tick()` | 等两轮宏任务。**改完状态后必须 await 它才能稳读新 DOM** |
| `$` / `$$` | `querySelector` / `querySelectorAll`（返回数组） |
| `text(sel, msg?)` | 元素的 `textContent`（已 trim），取不到就抛错 |
| `count(sel)` | 匹配元素个数 |
| `has(sel, msg?)` / `missing(sel, msg?)` | 元素必须存在 / 必须不存在 |
| `attr(sel, name, msg?)` | 读属性 |
| `style(sel, prop, msg?)` | 读计算样式 |
| `click(sel, msg?)` | 派发真实 `MouseEvent`，`onClick` 才会触发 |
| `input(sel, value, msg?)` | 设 `value` 并派发 `input`，受控输入才会同步 |
| `check(sel, value?, msg?)` | 设 `checked` 并派发 `input`/`change`，复选框与单选用 |
| `key(sel, keyName, msg?)` | 派发 `keydown` + `keyup`，键盘处理器才会触发 |
| `eq(actual, expected, msg?)` | 格式化后逐字比较 |
| `ok(cond, msg?)` | 条件为假就抛错 |
| `near(a, b, tol, msg?)` | 数值近似 |

规则：

- 失败信息一律「期望 X，实际 Y」，不写「错误」两个字。
- 断言里**不许**出现 `document.body.innerHTML` 这类整体串比较；要么读具体元素，要么用 `count()`。
- 颜色断言按**计算值**写：`rgb(1, 2, 3)` 会带空格。
- React 的事件是合成事件，但它挂在真实 DOM 上，`dispatchEvent` 会正常触发。
  `onChange` 在文本输入上实际监听 `input`（React 内部做的），所以用 `input()` 辅助；
  复选框用 `check()`。
- **每点一次都要 `await tick()` 再读、再点**。React 的状态更新不是同步写进 DOM 的：
  `click(".b"); click(".b")` 两次之间不 await，两个处理器会读到同一个旧值，计数只加一次。
  正确写法是 `click(".b"); await tick(); click(".b"); await tick();`。
- `tick()` 用的是宏任务，不是 `requestAnimationFrame`。沙箱 iframe 是离屏的，隐藏文档里
  rAF 不触发——用 rAF 会让整批用例一起超时（实测过）。

## 执行模型：什么跑在哪

```
用户 React 源码（文本）
  └─ 送进 sandbox="allow-scripts" 的 iframe（opaque origin），在里面：
       ├─ eval vendor 的 React 单入口产物（挂到 window.__RLLAB_REACT）
       ├─ RLLAB_COMPILE_FN 改写：import → 从产物取值、export default → return
       ├─ 注入全局 html / React / ReactDOM / ReactDOMClient / htm
       ├─ new Function('__RLLAB_REACT', code) 得到根组件
       ├─ createRoot(host).render() + flushSync，等一帧
       └─ 逐条跑断言（同一作用域，可 await tick），结果 postMessage 回父页面
```

由此确定内容里能做什么、不能做什么：

- 用户代码只能 import react / react-dom / react-dom/client / htm。import 别的会在改写阶段留下标记，
  运行时报错。
- 一个练习只有**一个模块**，没有多文件组件。子组件写在同一个文件里（函数组件）。
- 沙箱里 `localStorage` 抛 SecurityError，网络请求被拒，没有 `history` / `location` 语义。
- 定时器可用：`useEffect` 里排的定时器能跑到。
- 死循环会被 6 秒超时掐掉，并重建 iframe。
- 组件在渲染里抛错会被接住，作为整体红框显示——这是最常见的「页面上什么都没有」的原因。

## 写作规范

- 中文，高效少废话。不写「众所周知」「值得注意的是」「总之」，不写排比，不写总结式收尾。
- 每章开头一句 `goal`：这一章学完你能写出什么。
- 讲解里出现的 API 名、钩子都用手写 `code` 包起来（`useState`、`onClick`）。
- 每章至少 3 个示例、4 道练习，且练习要覆盖本章的主要知识点。
- 每章的练习与示例只能用到**本章及之前章节**讲过的东西。
- 不用 emoji。
