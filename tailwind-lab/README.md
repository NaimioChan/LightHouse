# Tailwind 训练场

离线静态站点，把 Tailwind 4 的工具类写法教到能照着词表拼出界面、能改主题令牌、能写变体。8 章、33 个练习、9 个当场渲染的示例。

顺着左侧目录往下读，每章三件事：读一段讲解、看一段**真实渲染出来**的示例、自己写一段 HTML 并当场检验。
没有后端、没有构建、没有网络依赖——双击 `run.bat` 就能用，也可以直接双击 `index.html`。
页面上跑着一份入库的 Tailwind 浏览器编译器（282 KB），它扫描你写的 `class` 即时生成样式。

## 怎么用

1. **总览**页给 8 张章节卡，卡片上写着每章的练习进度。
2. 进任意一章：讲解、示例（打开即渲染，不用点按钮）、练习卡。
3. 练习卡里左边是任务，中间是代码框（按 `HTML` / `CSS` / `JS` 页签切），右边是预览窗——你写的类名算出来的真页面。
   停手一秒自动重渲，`Ctrl + Enter` 立刻渲染并跑断言。
4. 断言清单里每条 ✗ 都会说明「期望什么、实际什么」。改到全 ✓，进度自动记住（存在浏览器本地）。
5. 想随手试，去**练习场**：三栏自由写 HTML/CSS/JS，实时预览 + 控制台。

## 目录

```
index.html            入口（纯 classic script，file:// 也能跑）
run.bat               双击：起本地服务 + 开浏览器；关掉页面，终端窗口跟着关
serve.py              本地静态服务（带令牌的入口 URL + SSE 保活 + 关窗即退）
AGENTS.md             给改这个仓库的 agent 看的硬约束
DESIGN.md             色值 / 字体 / 版式的唯一来源（Google design.md 格式）
docs/01-content-schema.md   内容契约：写法、字段、断言辅助、两阶段断言、Tailwind 执行模型
vendor/               入库的 Tailwind 浏览器编译器（产物 + 源码字符串包），见 vendor/README.md
assets/css/           base.css（令牌）、app.css（布局与组件）
assets/js/            harness.js（预览 iframe 里的断言内核，唯一实现）
                      preview.js（拼装 iframe 文档、内联编译器、两阶段驱动、回传结果）
                      highlight.js（HTML/CSS/JS 三套极简高亮）
                      pair.js（括号与标签配对的纯逻辑）
                      render.js（迷你 markdown + 示例窗与练习卡）
                      app.js（路由、目录、进度、练习场、自测钩子）
content/chNN-*.js     一章一个文件，教学文案与练习只存在这里
tools/                校验与验收脚本，见下
```

## 加一章

内容契约是 `docs/01-content-schema.md`，照 `content/ch01-utilities.js` 的样子写最快：一章一个文件、
UMD 尾巴挂到 `TWLAB_CHAPTERS`，段落分 `prose` / `note` / `table` / `demo` / `exercise` 五种。
写完把文件名加进 `index.html` 的 script 列表（清单和文件不一致，结构校验会直接报错）。

每章至少要有：一句 `goal`、几段讲解、带自检的示例、4 个练习（每个练习 = 可运行的起始代码 + 参考解 + ≥2 条断言 + ≥1 条提示）。

## 验证（七个脚本，各管一段）

| 命令 | 管什么 | 现在的状态 |
|---|---|---|
| `node tools/verify-content.mjs` | 结构：字段、id 唯一与编号连续、断言用了内置辅助、starter ≠ solution、两阶段断言写法、index.html 清单一致 | 8 章 · 33 练习 · 9 示例 · 19 段讲解 · 4 条提示 · 6 张表，全通过 |
| `node tools/verify-browser.mjs` | 行为：真浏览器里跑每个示例的自检、每个练习的参考解（必须全过）与起始代码（必须至少挂一条） | 示例自检 9/9 · 参考解 33/33 · 起始代码被抓住 33/33 |
| `node tools/verify-ui.mjs [--fast]` | 交互与排版：真实键盘输入 → 自动判题、页签、练习场、三档视口对齐、死循环保护、file:// 直开 | 全通过 |
| `node tools/verify-pages.mjs [--shots]` | 逐章打开：示例有没有自检失败、预览窗有没有缺、有没有未捕获错误 | 8 章 + 练习场全通过 |
| `node tools/verify-pair.mjs` | 括号配对的纯逻辑（秒级） | 全通过 |
| `node tools/verify-vendor.mjs` | vendor 产物的体积与哈希、字符串包与产物同源 | 全通过 |
| `node tools/verify-quit.mjs` | 关窗即退出 | 全通过 |

`verify-content` 与 `verify-pair` 是纯 node 的（秒级）；其余会起无头 Edge，几十秒到几分钟。
页面里也能手动全量自测：打开后 console 执行 `await TWLAB_SELFTEST()`（或给地址加 `?selftest`）。

## 设计与实现上的几个硬决定

- **用户代码只跑在 `sandbox="allow-scripts"` 的 iframe 里**（没有 `allow-same-origin`，opaque origin），
  主文档不做 eval。断言在 iframe 内部对真实 DOM 与计算样式跑，结果经 postMessage 回传，按 runId 过滤。
- **Tailwind 编译器以字符串入库、内联进每个预览帧**。沙箱 iframe 里外链 `<script src>` 一律 `onerror`，
  `file://` 下父页面又读不到源码，所以 `vendor/tailwind-src.js` 把整份编译器存成 `window.TWLAB_TAILWIND_SRC`，
  `preview.js` 再把它内联进文档。`file://` 与 http 两条路表现一致。
- **样式是异步生成的，断言前要等**。编译器先 append 一个空 `<style>` 再填内容；
  `harness.js` 的 `waitTailwind()` 轮询 `<head>` 末尾那个无 `type` 的 `<style>`，有内容了才往下跑。
- **用户 CSS 走 Tailwind 源码块**（`<style type="text/tailwindcss">`），顶部拼
  `@import "tailwindcss/theme.css"` 与 `@import "tailwindcss/utilities.css"`，
  **故意不引 preflight**：不重置元素默认样式，练习的初始条件才和其余各站一致（`h1` 还是默认大小、`ul` 还有圆点）。
- **`dark:` 用 class 策略**（`@custom-variant dark (&:where(.dark, .dark *))`）。无头浏览器里触发不了
  `prefers-color-scheme`，练习给容器加 `dark` 类来判。
- **两阶段判题**（判断点前缀）：断言写成 `[[阶段1...], [阶段2...]]` 时，阶段 1 跑完把**这一帧**的宽度
  改到 `widths[0]`（默认 420px），等页面完成一次真实布局，再用新文档跑阶段 2。这类练习卡的预览窗自动放成一整行。
- **几何断言的坑**：预览窗 `body` 自带 12px 内边距；比例字体下宽度是小数，用 `near(容差)` 而不是 `eq`。
- **示例也要自证**：每个 `demo` 必须带 `checks`，打开即渲染并当场跑；不通过就在窗下显示一条红字。

## 已知限制

- **判题只判效果，不判写法**。`bg-blue-600` 与 `bg-[#2b6ef2]` 只要算出来一样就都算对，断言看不出「类名是否恰当」。
- **颜色是计算出的 `oklch(...)`**，不是 `rgb(...)`。Tailwind 4 调色板基于 OKLCH；字面颜色（`text-white`、`@theme` 令牌、任意值）仍是 `rgb()`。写断言前先在预览窗里跑一遍。
- **`:hover` / `:focus` 在无头预览里触发不了**，变体类练习判的是「类名写对没有」+ 基础态。
  `disabled` / `odd` / `even` / `peer-checked` 能读计算值（页面脚本先设状态；`peer-checked` 需结构上让 `.peer` 与目标为兄弟）。
- **每个预览帧都要跑一次编译器**。首屏关键路径上没有这 282 KB，但打开一章时多张卡同时渲染，
  单帧生成样式约 100–300 ms；两阶段练习要编译两次。机器很卡时个别几何断言可能撞上帧还没排出版面（引擎会等最多 1 秒）。
- 死循环会被 5 秒超时掐掉并给提示，异步输出最多等 1.5 秒。
- 预览 iframe 是 opaque origin：`localStorage` / `sessionStorage` 在预览里用不了，也没有网络。
- 进度只存在浏览器本地，换浏览器或清数据就没了。

## 与 css-lab 的关系

同一套骨架：契约优先（`docs/01-content-schema.md` 是唯一真相）、内容与引擎分离、分层验证、关窗即退。
`css-lab` 教你从零写 CSS 并自己排查样式不生效；这里直接用工具类拼界面，反过来补上 `css-lab` 第 10 章
（手写工具类）没有真判类名的那一块。色板同源，强调色换成 Tailwind 的天蓝：`#38BDF8` 装饰用、
`#0369A1` 承载文字用（纸白上 5.63:1，过 AA）。
