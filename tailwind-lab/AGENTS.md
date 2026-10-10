# AGENTS.md — Tailwind 训练场

在这个仓库里干活的 agent 的硬约束。动手前先读这份，再读 `docs/01-content-schema.md`。

## 这是什么

离线静态站点，把 Tailwind 4 的工具类写法教到能照着词表拼出界面、能改主题令牌、能写变体。
每章 = 讲解 + 当场渲染的示例 + 手写练习（现写 / 现渲染 / 现检验）。无后端、无构建、无网络依赖。

七座站同源（`js-lab`、`html5-lab`、`css-lab`、`ts-lab`、`vue-lab`、`react-lab`、本站）：契约优先、
内容与引擎分离、多层验证、关窗即退。差别在执行模型：

| 站点 | 用户代码跑在哪 | 断言打在什么上 |
|---|---|---|
| js-lab | 沙箱 iframe 里的 JS | 控制台输出 |
| html5-lab | 沙箱 iframe 里真实渲染的 DOM | DOM 与计算样式 |
| css-lab | 沙箱 iframe 里真实渲染的 DOM | 几何与计算值（两阶段） |
| ts-lab | 类型层：父页面里的 TypeScript 编译器 | 诊断与类型等价 |
| vue-lab | 沙箱 iframe 里的 Vue 运行时 + SFC 编译器 | 挂载后的真实 DOM（`nextTick` 之后） |
| react-lab | 沙箱 iframe 里的 React 运行时（自建单入口 IIFE） | `flushSync` 之后的真实 DOM |
| **tailwind-lab** | **沙箱 iframe 里的 Tailwind 浏览器编译器 + 用户 HTML** | **编译器生成样式后的计算值与几何（两阶段）** |

与 `css-lab` 的关系最近：同一套骨架、同一套几何与两阶段断言。多出来的只有一样——每个预览帧里内联一份
Tailwind 浏览器编译器，它扫描 DOM 里的 `class` 异步生成样式，断言前要等它填好（见下）。

教什么、不教什么：不做组件库、不教构建配置、不讲 `tailwind.config.js`（v4 已改 CSS-first）。
这里教的是「工具类怎么拼出界面」——命名词表、间距与尺寸、字体与颜色、flex 与 grid、
组件组合、变体（`hover` / `focus` / `dark` / `odd` / `peer-checked`）、断点前缀、`@theme` 令牌。

## 运行与验证

- 双击 `run.bat`：跑 `python serve.py`（起静态服务 + 打开浏览器）。**页面关掉后服务自己退出，终端窗口跟着关**
  —— 页面里挂一条 `/__alive` SSE 长连接（`assets/js/app.js` 的 `keepAlive`），没有任何连接持续 6 秒就退出。
- **每轮进站换 URL**：`serve.py` 每次运行生成一个令牌，入口是 `http://127.0.0.1:8884/index.html?v=<令牌>`，
  返回的 HTML 里 `assets/` `content/` `vendor/` 资源也全部打上同一个令牌，响应带 `no-store` 与
  `Clear-Site-Data: "cache"`。原因：浏览器把 URL 当缓存键，而 Windows 的 ShellExecute 遇到**已经在开着的同一个 URL**
  是把旧标签页切到前台、不重新加载——用户会看到上一轮的旧页面。改代码后如果页面看着还是旧的，
  先看有没有顶部那条「旧版本」提示条。
- 环境变量：`TWLAB_PORT` 起始端口（默认 8884）、`TWLAB_KEEP=1` 永不自动退出（自动化用）、
  `TWLAB_NO_OPEN=1` 不开浏览器、`TWLAB_TOKEN` 指定令牌、`TWLAB_IDLE_GRACE` 无连接多久退出。
- 也必须能直接双击 `index.html` 打开。因此：**禁止 ES module、fetch、CDN、字体文件**（file:// 下全部失效）。
- **`vendor/` 的 282 KB 是例外**：`tailwind-src.js` 把官方浏览器编译器存成字符串，由 classic `<script>` 引入，
  首屏关键路径上只是读一个字符串，真正求值发生在每个预览 iframe 里。见 `vendor/README.md`。

## 验证（都别只靠手测）

1. `node tools/verify-content.mjs` —— 结构校验（秒级）：字段、id 唯一且与章号一致、`tests ≥2`、
   `hints ≥1`、`starter ≠ solution`、两阶段断言的阶段划分、`index.html` 的 script 清单与 `content/*.js` 完全一致。
2. `node tools/verify-browser.mjs` —— 真浏览器（无头 Edge + CDP）：走 http 与 `file://` 两条路，
   用页面里的 `TWLAB_SELFTEST()` 把每个练习跑两遍（参考答案必须全过、起始代码必须至少挂一条）、每个示例的 `checks` 必须全过。
   可 `--chapter ch05` 只跑一章。慢，但唯一说得上话。
3. `node tools/verify-ui.mjs [--fast]` —— 真实按键输入管线、页签、练习场、三档视口排版（含 390px）、死循环保护、离线直开。
4. `node tools/verify-pages.mjs [--shots]` —— 逐章渲染对账（示例自检有没有挂、预览窗有没有缺、有没有未捕获错误）。
5. `node tools/verify-pair.mjs` —— 括号与引号配对的纯逻辑（秒级），与浏览器无关。
6. `node tools/verify-vendor.mjs` —— vendor 产物的体积与哈希没变，且字符串包与产物同源。
7. 关窗即退：`node tools/verify-quit.mjs`。

页面 console 里也能手动全量自测：`await TWLAB_SELFTEST()`。给地址加 `?selftest` 也一样。

CDP 验收的硬规矩（否则假失败）：

- 前台 `terminal` 超时 >600s 会被提升为后台进程，然后带 `stdin is not a tty` 立刻死掉。
  写成 `node tools/verify-ui.mjs > .cache/ui.txt 2>&1 < /dev/null` 且 timeout ≤ 600。
- `Page.captureScreenshot` 在隐藏标签页会一直挂着，截图前 `Page.bringToFront`，失败降级为警告。
- 满量自测要跑几十个预览 iframe、每个 iframe 里再跑一次 Tailwind 编译，迭代时用 `--chapter` / `--fast`。

## 架构铁律

1. **内容与引擎分离。** 所有教学文案、示例、练习只存在于 `content/chNN-*.js`；引擎不得内置任何一章的具体知识。
2. **内容文件是 classic script，带 UMD 尾巴**：
   `(function (root) { (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({ ... }); })(typeof window !== 'undefined' ? window : globalThis);`
   同一份内容浏览器与 node 都能读（`tools/verify-content.mjs` 就是这么读的）。
3. **schema 即契约**（`docs/01-content-schema.md`）。改 schema 必须同时改契约文档、`tools/verify-content.mjs`、
   引擎渲染三处。
4. **预览只有一个入口**：`assets/js/preview.js` 拼装 iframe 文档、内联 Tailwind 编译器、驱动两阶段；
   `assets/js/harness.js` 在 iframe 内定义断言辅助、跑断言、回传结果。禁止在别处再写一套 `has/count/eq/rect`。
5. **用户代码只在 `sandbox="allow-scripts"` 的 iframe 里执行**（无 allow-same-origin，opaque origin），主文档不做 eval。
6. **Tailwind 的样式是异步生成的，断言前必须等它。** 编译器先往 `<head>` 末尾 append 一个空 `<style>`，
   随后才把 CSS 写进去。`harness.js` 的 `waitTailwind()` 轮询的是**末尾那个无 `type` 的 `<style>`**：
   有内容了就往下走；挂上了但一直空（页面里没有工具类可生成）就等 800ms 放行；最长 3 秒。
   **不要删掉这段等待**，也**不要把用户 CSS 的源码块写成无 `type` 的 `<style>`**——那会被误判成编译器产物。
7. **用户 CSS 走 Tailwind 源码块**（`<style type="text/tailwindcss">`），前面拼固定 PREAMBLE：
   `@import "tailwindcss/theme.css";@import "tailwindcss/utilities.css";@custom-variant dark (&:where(.dark, .dark *));`
   **故意只引 theme + utilities，不引 preflight**：本训练场与其余各站一样不重置元素默认样式
   （`h1` 还是浏览器默认大小、`ul` 还有圆点），练习的初始条件才一致。
8. **`dark:` 是 class 策略**。PREAMBLE 里把 `dark` 定成 `(&:where(.dark, .dark *))`，
   练习给某个容器加 `dark` 类来判；不依赖 `prefers-color-scheme`（无头浏览器里没法触发）。
9. **两阶段判题只改被判题那一帧的宽度**（`content` 里的 `widths`，默认 `[420]`），不许去改全局视口或别的卡片。
   两阶段的练习卡自动走 `.ex-card-2stage`（预览占一整行）：挤在三栏里只剩三百来像素，断点触发不了。
10. **判题只打在被渲染出来的东西上**：计算值、几何、DOM 结构。颜色是计算出的 `oklch(...)`，写断言前先在预览窗里跑一遍抄值。
11. **`:hover` / `:focus` 的计算值在无头预览里触发不了**，变体类练习判「类名写对没有」+ 基础态；
    `disabled` / `odd` / `even` / `peer-checked` 可以先由页面脚本设状态再读计算值（`peer-checked` 需结构上让 `.peer` 与目标为兄弟）。
12. **进度只进 localStorage**（key 前缀 `twlab.v1.`），不依赖任何后端，不写 cookie。
13. **列宽由容器负责，子元素不许自己居中**：讲解/示例/表格进 `.read`，练习卡/练习场进 `.work`
    （`renderChapter` 按段落类型分组建容器）。
14. **两种代码块别搞混**：`kind:'demo'` 是讲解区的示例（静态展示 + 当场判题），`kind:'exercise'` 是练习卡（可编辑 + 判题）。
    示例不许引用练习里的东西，必须自包含。
15. 每一章必须自洽：只使用本章及之前章节讲过的能力。
16. **编辑器的括号、引号配对与 HTML 标签闭合**，判定在 `assets/js/pair.js`（纯函数，`TWLAB_pairs`）。
    `()` `[]` `{}` 与 `' " \`` 三种引号都补另一半、都能成对删除；单引号紧跟在标识符字符后（撇号 don't）时不补。
    不引第三方编辑器（CodeMirror 之类是 ESM + 需要打包，会破坏 `file://` 直开），不做关键字补全。
17. **窄屏形态所有站点一致**，契约在根 `docs/04-mobile-layout.md`：≤900px 目录栏收成抽屉（顶栏 `#nav-btn` + `body.nav-open`）、
    顶栏只留「目录/进度/自动运行」、「重置进度」进抽屉、表格包 `.tbl-wrap`、编辑器字号 ≥16px。
    改窄屏版式后跑 `node tools/verify-ui.mjs --fast`（含 390px 那一档）。

## 写作规范（文案与断言）

- 中文，高效少废话。不写「众所周知」「值得注意的是」「总之」，不写排比，不写总结式收尾。
- 每章开头一句 `goal`：这一章学完你能写出什么。
- 每个练习必须有：可运行的起始代码、参考解、≥2 条断言、≥1 条提示，并且 task 里写明**只改哪一栏**。
- 断言必须用内置辅助（`has/count/text/attr/tag/style/rect/px/tracks/eq/ok/near/atLeast/atMost`），
  失败信息要说清实际值 vs 期望值，禁止只写「错误」。
- 示例的 `checks` 是对该示例的真实断言（由 `tools/verify-browser.mjs` 跑），不许写成永远为真的检查。
- 颜色、像素、间距**先在预览窗里跑一遍再写进断言**，别猜。Tailwind 调色板是 `oklch()`，字面颜色仍是 `rgb()`。
- `md` 里行内 `code` 是 `white-space: nowrap`：单个别超过约 40 字符，否则 390px 窄屏会横向溢出（`verify-ui.mjs` 会抓）。
  更长的代码用 ``` 围栏块（现在引擎支持了）或 `kind: 'table'`。

## 禁区

- 不在本站再引第二个框架或工具（不做组件库、不做构建配置、不讲 `tailwind.config.js`）。
- 不把 `vendor/` 里的产物搬出本站或做「共享」。
- 不用 `import` / `export`——file:// 下会直接白屏。
- 内容里不写网络请求（`fetch`/`XMLHttpRequest`/`url(http…)`）、不写 `alert`、`confirm`、`prompt`
  （iframe 里会静默或挂住）、不写自动播放带声音的媒体、不设 500ms 以下的定时器（会拖垮自测）。
- 内容里不要再嵌 `<iframe>`。
- 不改 `DESIGN.md` 的色值、字体、字号，除非同一提交内同步改 `assets/css/base.css` 的 CSS 变量。
- 不手改 `vendor/tailwind.global.js` 与 `vendor/tailwind-src.js`；改了要重跑 `tools/verify-vendor.mjs` 并同步 `vendor/README.md`。
