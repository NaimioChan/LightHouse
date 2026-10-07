# 内容契约 v1

`content/*.js` 里的一切都必须符合本文档。改这里 = 同时改 `tools/verify-content.mjs` 和 `assets/js/render.js`。

## 章节文件

每个文件一个章节，classic script，UMD 尾巴挂到全局注册表：

```js
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 选择器与命中',
    goal: '看到一条样式没生效时，能自己判断是没命中、还是被别的规则压过去了。',
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
{ kind: 'prose', md: '用 `.box` 选中一个类。\n\n段落之间空一行。' }
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
{ kind: 'table', head: ['写法', '含义'], rows: [['`.a .b`', '后代里的 b']] }
```

单元格走讲解用的那套行内 markdown（`` `code` ``、`**粗体**`、`*斜体*`），所以选择器照常用反引号写成等宽。
整张表要等宽就写 `code: true`。

### `demo` — 当场渲染的示例

```js
{
  kind: 'demo',
  caption: '两个盒子的两种盒模型',      // 可选，示例上方的小标题
  html: '<div class="box">…</div>',
  css: '.box { box-sizing: border-box; }',   // 可选
  js: 'document.title = "示例";',            // 可选
  height: 150,                       // 可选，渲染窗高度 px，默认 170
  width: 520,                        // 可选，把这一帧钉成 520px 宽（讲响应式时用）
  full: false,                       // 可选，true = html 里写的是整份文档（含 doctype），预览窗不再注入基础样式
  checks: [                          // ✓ 必填，≥1 条，对该示例渲染结果的真实断言
    'eq(px(".box", "width"), 200, "盒子宽度")',
    'eq(style(".box", "box-sizing"), "border-box", "盒模型")'
  ]
}
```

- 示例在页面上**打开即渲染**（不用点按钮），下方是渲染窗。`checks` 在渲染时也跟着跑：
  全过则什么都不显示，挂了就在窗下显示一条红色提示（说明这个示例自己也站不住）。
- `checks` 也是内容校验的一部分：`node tools/verify-browser.mjs` 会重跑一遍，必须全过。
  别写永远为真的检查（比如 `ok(true)`）。
- 默认（不写 `full`）时，`html` 是**片段**，会被塞进一份现成文档的 `<body>` 里渲染，
  并且自带那三行基础样式（见文末）。
- `html` 是片段时**不要写 `<style>` / `<link>` / `<script src>`**——浏览器不会执行这么插进去的脚本，
  样式一律写进 `css` 栏。要讲整份文档结构才用 `full: true`。
- 示例代码必须自包含，不许引用练习里的东西。
- 用到 `document` / 事件 / 定时器的示例照常写，但在 `js` 里别用 `fetch`、`alert`、自动播放的媒体。

### `exercise` — 练习

```js
{
  kind: 'exercise',
  id: 'ex01-1',                      // 全局唯一，exNN-M
  title: '让三张卡片都有圆角',
  task: '让每张卡片都有 8px 圆角。\n\n要求：只改 `css` 栏。',   // markdown 子集
  starter: {
    html: '<div class="card">甲</div>',
    css: '.card { padding: 12px; }',   // 可选：写了这一栏才出现 CSS 页签
    js: '/* TODO */'                   // 可选：写了这一栏才出现 JS 页签
  },
  solution: {
    css: '.card { padding: 12px; border-radius: 8px; }'
    // 只给变化的那几栏；没给的栏继承 starter 的同名栏
  },
  tests: [
    'eq(style(".card", "border-radius"), "8px", "卡片圆角")',
    'near(px(".card", "padding-top"), 12, 2, "内边距别弄丢")'
  ],
  hints: ['圆角写在 `.card` 自己的规则里，值带 `px`。'],
  height: 240,                       // 可选，预览窗高度 px，默认 280
  width: 520,                        // 可选，把预览帧钉成 520px 宽（讲响应式时用）
  widths: [420],                     // 可选，两阶段里第二阶段用的宽度，默认 [420]
  full: false                        // 可选，true = html 栏写的是整份文档（含 doctype）
}
```

| 字段 | 必填 | 约束 |
|---|---|---|
| `id` | ✓ | 全局唯一，`exNN-M`，NN 与所在章号一致 |
| `title` | ✓ | 一句话任务名 |
| `task` | ✓ | markdown 子集，说清要写什么、要满足哪些条件；**写明只改哪一栏** |
| `starter` | ✓ | 对象，`html` 必填；有 `css`/`js` 键才出现对应页签；不得与 `solution` 渲染结果相同 |
| `solution` | ✓ | 对象，至少一栏；缺失的栏从 `starter` 继承 |
| `tests` | ✓ | ≥2 条断言，必须用内置辅助；两阶段写法见下 |
| `hints` | ✓ | ≥1 条，逐条点开 |
| `height` | | 预览窗高度，默认 280 |
| `width` | | 把这一帧钉成这么宽（120–1200），不写就跟着窗口走 |
| `widths` | | 两阶段断言里第二阶段用的宽度，默认 `[420]` |
| `full` | | `true` = `html` 栏里是整份文档（含 `doctype`），预览窗不注入基础样式 |

## 两阶段断言（响应式判题）

断言可以写成两层数组：

```js
tests: [
  [ 'eq(style(".row", "flex-direction"), "row", "宽窗口横排")' ],
  [ 'eq(style(".row", "flex-direction"), "column", "窄窗口竖排")',
    "watch('resized')" ]
]
```

跑法：第一阶段在默认宽度（或 `width` 指定的宽度）跑；跑完把这一帧改窄到 `widths[0]`（默认 420px），
等页面完成一次布局，再用**新文档**跑第二阶段。第二阶段看到的就是窄窗口下的计算结果。

- 只改被判题的那一帧（宽度取 `widths[0]`，默认 420），不动同一个练习里别的窗口。
- **两阶段的练习卡会自动把预览窗放成一整行**（`renderChapter` 认出两阶段断言就加 `.ex-card-2stage`）：
  三栏布局下这个窗只剩三百来像素宽，媒体查询触发不了，判题结论会跟真实使用不符。写内容时不用管这件事。
- 断言前引擎会等到那一帧真的有宽度（最多 1 秒）：一页上好几张卡同时渲染时帧可能是 0×0，
  那时所有盒子都量出 0。**内容里的几何断言不需要自己等**，但别把这条前提从引擎里删掉。
- 第二阶段里写 `watch('名字')`，配合页面脚本里的 `__notify('名字')`：脚本侧的状态（顶层 `const`、
  事件监听里记下的值）父页面拿不到，只能在帧内自己回传。页面里常见的写法：
  ```js
  var mq = matchMedia('(min-width: 700px)');
  function upd() {
    document.querySelector('#st').textContent = mq.matches ? 'wide' : 'narrow';
    __notify('resized');          // 给断言一个信号
  }
  mq.addEventListener('change', upd);
  window.addEventListener('resize', upd);
  upd();
  ```
  断言写 `watch('resized')`，`__notify` 一被调用就算过；一直没等到会明确报「没有等到页面里的 `__notify("resized")`」。
- 纯 CSS 的响应式（媒体查询、容器查询、`flex-wrap`、`grid-template-columns` 变化）**不需要** `watch`，
  第二阶段直接读计算值。
- 一条断言里别写两件不相干的事，两个阶段里各管各的；`watch` 那一条独占一行最好读。

## 断言辅助（沙箱内可用）

用户代码和断言都跑在预览 iframe 里，作用域里预先放好了这些：

| 辅助 | 行为 |
|---|---|
| `$(sel, root?)` | `querySelector`，取不到返回 `null` |
| `$$(sel, root?)` | `querySelectorAll`，返回数组 |
| `has(sel, msg?)` | 必须存在；失败说「期望页面里有 …，实际没找到」 |
| `count(sel, n, msg?)` | 个数必须等于 n |
| `atLeast(sel, n, msg?)` / `atMost(sel, n, msg?)` | 个数上下限 |
| `text(sel)` | `textContent.trim()`，取不到返回 `null` |
| `attr(sel, name)` | 属性值，没有这个属性返回 `null` |
| `tag(sel)` | 小写标签名，取不到返回 `null` |
| `style(sel, prop)` | `getComputedStyle` 的值（如 `'8px'`、`'rgb(31, 86, 200)'`、`'flex'`） |
| `rect(sel, msg?)` | 取整后的几何 `{ x, y, w, h }`，如 `rect(".box").w` |
| `px(sel, prop)` | 计算值里取出数字（`'12px'` → `12`）；`64em` 这种没解析出数值的原样返回 |
| `tracks(sel, name?)` | 网格/多列算完的轨道尺寸数组，默认读 `grid-template-columns`，如 `[200, 200, 200]` |
| `eq(actual, expected, msg?)` | 深比较；不等则抛错并打印实际值 vs 期望值 |
| `ok(cond, msg?)` | `cond` 为假则抛错 |
| `near(actual, expected, tol?, msg?)` | 数值比较，默认容差 2；给几何用 |
| `fn(name, msg?)` | 取全局函数（顶层 `function` 声明或挂在 `window` 上的） |
| `logs` | 页面里 `console.log/info/warn/error` 的格式化输出数组（字符串） |
| `watch(name)` | 只用于两阶段第二阶段：等页面 `__notify(name)` |
| `__notify(name, payload?)` | 在页面脚本里调用，把状态回传给 `watch` |

失败信息必须能读出「期望什么、实际什么」，所以：

- 能用 `has` / `count` 就别手写 `ok(!!$('x'))`。
- 用 `eq` 时把被测对象写进 `msg`：`eq(style(".card", "border-radius"), "8px", "卡片圆角")`。
- 计算值按浏览器算完的样子写：颜色是 `rgb(31, 86, 200)` 这种形式，长度是 `12px`。
  写之前先在预览窗里跑一遍，别猜。

### 几何断言的写法规矩（布局章最容易写错的地方）

- 预览窗里的页面自带宽 12px 的内边距（见文末基础样式）。`rect().x/y` 是相对**视口**的，
  跨元素比位置时两边都要算上这 12px；比尺寸（`w`/`h`）不受影响。
- 宽度受字体影响：预览窗用的是 `system-ui`，**比例字体**，中英文混排算出来是小数。
  用 `near(..., 容差 2~3)`，别用 `eq` 写死像素。等宽场景（`font-family: monospace`）例外。
- `100%` / `auto` 的宽度随视口变，写断言时要么配合 `width` 把帧钉住，要么用相对比较：
  ```js
  ok(rect(".a").w > rect(".b").w, "a 比 b 宽")
  ok(Math.abs(rect(".c").x - (rect(".a").x + rect(".a").w)) <= 3, "c 紧跟在 a 右边")
  ```
- 百分比宽度按父元素算，父元素又受 `body` 的 12px 内边距影响：`.half{width:50%}` 在 1000px 的帧里
  算出来是 `(1000-24)*0.5 = 488`，不是 500。

## 断言能看见什么（执行模型）

预览 iframe 里的文档是这条顺序拼出来的：

```
基础样式（见下）→ 用户 CSS → 用户 HTML → 用户 JS → 断言
```

- **断言看得见**：整个文档（`document`、`$`、`$$`）、用户 JS 里的 `console` 输出（`logs`）、
  用户 JS 里用 `function` 声明或挂到 `window` 上的函数（`fn('名')` 取得到）。
- **断言看不见**：用户 JS 顶层用 `const` / `let` / `class` 声明的东西（那是脚本作用域，不在 `window` 上）。
  练习里要断言的东西，要么写进 DOM，要么用 `function foo(){}` / `window.foo = …`。
- 用户 JS 里的 `setTimeout` 由 harness 记账，安静 40ms 后收工、最长 1.5 秒。
  所以别写 1.5 秒以上才生效的延迟逻辑。
- 用户 JS 抛错 = 整体错误（红框），断言抛错 = 该条失败、其余照跑。用户 JS 里 `while (true)` 会被 5 秒超时掐掉并给出提示。
- 预览 iframe 的 `sandbox="allow-scripts"` 没有 `allow-same-origin`，所以 opaque origin 下
  **不能**用 `localStorage`、不能发网络请求（会被拒）。

## 基础样式（预览窗自带的，可以当已知条件用）

预览窗不是空白浏览器，它自带这一小段（`assets/js/preview.js` 的 `BASE_CSS`）：

```
html { background: #fff }
body { margin: 0; padding: 12px; font: 14px/1.7 system-ui, "Microsoft YaHei", sans-serif; color: #232019 }
```

除此之外不重置任何东西：`h1` 的大小、`ul` 的圆点、`margin` 的默认值都是浏览器原样的。
讲 `margin` 默认值、盒模型这类内容时，这就是练习的初始条件；写断言按这个前提来。
