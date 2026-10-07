# 内容契约 v1

`content/*.js` 里的一切都必须符合本文档。改这里 = 同时改 `tools/verify-content.mjs` 和 `assets/js/render.js`。

## 章节文件

每个文件一个章节，classic script，UMD 尾巴挂到全局注册表：

```js
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 文档骨架与语义分区',
    goal: '写出一个结构正确、能被大纲工具读懂的页面骨架。',
    sections: [ /* 见下 */ ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

章节字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | `chNN`，全局唯一，决定排序 |
| `title` | string | ✓ | 目录与页首标题 |
| `goal` | string | ✓ | 一句话：学完能写出什么 |
| `sections` | Section[] | ✓ | 顺序即阅读顺序 |

## Section

五种 `kind`。

### `prose` — 讲解段落

```js
{ kind: 'prose', md: '用 `<header>` 包住页头。\n\n段落之间空一行。' }
```

`md` 支持的子集（`assets/js/render.js` 里的 mini-markdown，仅此而已）：
`## 小标题`、段落、`- 无序列表`、`1. 有序列表`、行内 `` `code` ``、`**粗体**`、`*斜体*`。
不支持表格、图片、链接、嵌套列表。需要表格用 `kind: 'table'`。

### `note` — 提示 / 警告

```js
{ kind: 'note', tone: 'tip', md: '短句。' }     // tone: tip | warn
```

### `table` — 对照表

```js
{ kind: 'table', head: ['标签', '管什么'], rows: [['`main`', '页面唯一的主题内容']] }
```

单元格走讲解用的那套行内 markdown（`` `code` ``、`**粗体**`、`*斜体*`），所以标签名照常用反引号写成等宽。
整张表要等宽就写 `code: true`。

### `demo` — 当场渲染的示例

```js
{
  kind: 'demo',
  caption: '两个语义分区',           // 可选，示例上方的小标题
  html: '<header>…</header>\n<main>…</main>',
  css: 'body { font: 14px/1.7 system-ui; }',   // 可选
  js: 'document.title = "示例";',               // 可选
  height: 150,                       // 可选，渲染窗高度 px，默认 170
  full: false,                       // 可选，true = html 里写的是整份文档（含 doctype），预览窗不再注入基础样式
  checks: [                          // ✓ 必填，≥1 条，对该示例渲染结果的真实断言
    'has("header")',
    'eq(text("h1"), "书架", "页头标题")'
  ]
}
```

- 示例在页面上**打开即渲染**（不用点按钮），下方是渲染窗。`checks` 在渲染时也跟着跑：
  全过则什么都不显示，挂了就在窗下显示一条红色提示（说明这个示例自己也站不住）。
- `checks` 也是内容校验的一部分：`node tools/verify-browser.mjs` 会重跑一遍，必须全过。
  别写永远为真的检查（比如 `ok(true)`）。
- 默认（不写 `full`）时，`html` 是**片段**，会被塞进一份现成文档的 `<body>` 里渲染，
  并且自带那三行基础样式（见文末）。讲整份文档结构（`doctype`、`html`、`head`、`title`）时才用 `full: true`：
  那时 `html` 就是整份文档，基础样式不再注入，`document.title`、`tag('html')` 这类断言才有意义。
- 示例代码必须自包含，不许引用练习里的东西。
- 用到 `document` / 事件 / 定时器的示例照常写，但在 `js` 里别用 `fetch`、`alert`、自动播放的媒体。

### `exercise` — 练习

```js
{
  kind: 'exercise',
  id: 'ex02-3',                      // 全局唯一，exNN-M
  title: '把段落拆成列表',
  task: '把三个项目写成无序列表。\n\n要求：外层 `ul`，里面三个 `li`。',   // markdown 子集
  starter: {
    html: '<ul>\n  <!-- TODO -->\n</ul>',
    css: '.box { padding: 8px; }',   // 可选：写了这一栏才出现 CSS 页签
    js: '/* TODO */'                 // 可选：写了这一栏才出现 JS 页签
  },
  solution: {
    html: '<ul>\n  <li>甲</li>\n  <li>乙</li>\n  <li>丙</li>\n</ul>'
    // 只给变化的那几栏；没给的栏继承 starter 的同名栏
  },
  tests: [
    'eq(tag("ul"), "ul", "外层要用 ul")',
    'count("ul > li", 3)'
  ],
  hints: ['`<li>` 必须写在 `<ul>` 里面，写成兄弟节点不算。'],
  height: 220,                       // 可选，预览窗高度 px，默认 280
  full: false                        // 可选，true = html 栏写的是整份文档（含 doctype）
}
```

| 字段 | 必填 | 约束 |
|---|---|---|
| `id` | ✓ | 全局唯一，`exNN-M`，NN 与所在章号一致 |
| `title` | ✓ | 一句话任务名 |
| `task` | ✓ | markdown 子集，说清要写什么、要满足哪些条件 |
| `starter` | ✓ | 对象，`html` 必填；有 `css`/`js` 键才出现对应页签；不得与 `solution` 渲染结果相同 |
| `solution` | ✓ | 对象，至少一栏；缺失的栏从 `starter` 继承（显式把与 starter 相同的栏一起写上也算合法） |
| `tests` | ✓ | ≥2 条断言，必须用内置辅助（见下） |
| `hints` | ✓ | ≥1 条，逐条点开 |
| `height` | | 预览窗高度，默认 280 |
| `full` | | `true` = `html` 栏里是整份文档（含 `doctype`），预览窗不注入基础样式 |

## 断言辅助（沙箱内可用）

用户代码和断言都跑在预览 iframe 里，作用域里预先放好了这些：

| 辅助 | 行为 |
|---|---|
| `$(sel, root?)` | `querySelector`，取不到返回 `null` |
| `$$(sel, root?)` | `querySelectorAll`，返回数组 |
| `has(sel, msg?)` | 必须存在；失败说「期望页面里有 …，实际没找到」 |
| `count(sel, n, msg?)` | 个数必须等于 n |
| `text(sel)` | `textContent.trim()`，取不到返回 `null` |
| `attr(sel, name)` | 属性值，没有这个属性返回 `null` |
| `tag(sel)` | 小写标签名，取不到返回 `null` |
| `style(sel, prop)` | `getComputedStyle` 的值（如 `'8px'`、`'rgb(240, 238, 230)'`） |
| `eq(actual, expected, msg?)` | 深比较；不等则抛错并打印实际值 vs 期望值 |
| `ok(cond, msg?)` | `cond` 为假则抛错 |
| `fn(name, msg?)` | 取全局函数（如 `fn('toF')`）；顶层用 `function` 声明、或挂在 `window` 上的才取得到 |
| `logs` | 页面里 `console.log/info/warn/error` 的格式化输出数组（字符串） |

失败信息必须能读出「期望什么、实际什么」，所以：

- 能用 `has` / `count` 就别手写 `ok(!!$('x'))`。
- 用 `eq` 时把被测对象写进 `msg`：`eq(attr('a', 'href'), 'https://example.com', 'a 的 href')`。
- `style()` 的结果按浏览器算完的值来写（`8px` 不会写成 `8`）。写真实值前先在预览里跑一遍，别猜。

## 断言能看见什么（执行模型）

预览 iframe 里的文档是这条顺序拼出来的：

```
基础样式（见下）→ 用户 CSS → 用户 HTML → 用户 JS → 断言
```

- **断言看得见**：整个文档（`document`、`$`、`$$`）、用户 JS 里的 `console` 输出（`logs`）、
  用户 JS 里用 `function` 声明或挂到 `window` 上的函数（`fn('名')` 取得到）。
- **断言看不见**：用户 JS 顶层用 `const` / `let` / `class` 声明的东西（那是脚本作用域，不在 `window` 上）。
  练习里要断言的东西，要么写进 DOM，要么用 `function foo(){}` / `window.foo = …`。
- 进度条式的检查不会等你：用户 JS 里的 `setTimeout` 由 harness 记账，安静 40ms 后收工、最长 1.5 秒。
  所以别写 1.5 秒以上才生效的延迟逻辑。
- 用户 JS 抛错 = 整体错误（红框），断言抛错 = 该条失败、其余照跑。用户 JS 里 `while (true)` 会被 5 秒超时掐掉并给出提示。
- 预览 iframe 的 `sandbox="allow-scripts"` 没有 `allow-same-origin`，所以 opaque origin 下
  **不能**用 `localStorage`、不能发网络请求（会被拒），存储类章节练的是「写代码」而不是「真的存进去」——
  断言只看 DOM 与 `logs`。

## 基础样式（预览窗自带的，可以当已知条件用）

预览窗不是空白浏览器，它自带这一小段（`assets/js/preview.js` 的 `BASE_CSS`）：

```
html { background: #fff }
body { margin: 0; padding: 12px; font: 14px/1.7 system-ui, "Microsoft YaHei", sans-serif; color: #232019 }
```

除此之外不重置任何东西：`h1` 的大小、`ul` 的圆点、`input` 的默认外观都是浏览器原样的。
写练习的断言时按这个前提来，需要别的样式就在 `css` 里自己写。
