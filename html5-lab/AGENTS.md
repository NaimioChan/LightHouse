# AGENTS.md — HTML5 训练场

在这个仓库里干活的 agent 的硬约束。动手前先读这份，再读 `docs/01-content-schema.md`。

## 这是什么

离线静态站点，把 HTML5 教到能自己写出结构正确的页面。每章 = 讲解 + 可运行示例（当场渲染出真页面）+ 手写练习（现写 / 现渲染 / 现检验）。
无后端、无构建、无网络依赖。

与 `js-lab` 的关系：同一套骨架（契约优先、内容与引擎分离、三层验证、关窗即退），但执行模型不同——
`js-lab` 跑的是 JS 控制台输出，这里跑的是**真实 HTML 渲染**，断言打在渲染出来的 DOM 与计算样式上。

## 运行与验证

- 双击 `run.bat`：跑 `python serve.py`（起静态服务 + 打开浏览器）。**页面关掉后服务自己退出，终端窗口跟着关**
  —— 页面里挂一条 `/__alive` SSE 长连接（`assets/js/app.js` 的 `keepAlive`），没有任何连接持续 6 秒就退出。
- **每轮进站换 URL**：`serve.py` 每次运行生成一个令牌，入口是 `http://127.0.0.1:8878/index.html?v=<令牌>`，
  返回的 HTML 里 `assets/` `content/` 资源也全部打上同一个令牌，响应带 `no-store` 与 `Clear-Site-Data: "cache"`。
  原因：浏览器把 URL 当缓存键，而 Windows 的 ShellExecute 遇到**已经在开着的同一个 URL** 是把旧标签页切到前台、
  不重新加载——用户会看到上一轮的旧页面（旧 CSS，且旧 app.js 没有保活连接，窗口也不会关）。改代码后如果页面看着还是旧的，
  先看有没有顶部那条橙色「旧版本」提示条。
- 环境变量：`H5LAB_PORT` 起始端口、`H5LAB_KEEP=1` 永不自动退出（自动化用）、`H5LAB_NO_OPEN=1` 不开浏览器、
  `H5LAB_TOKEN` 指定令牌、`H5LAB_IDLE_GRACE` 无连接多久退出。
- 也必须能直接双击 `index.html` 打开。因此：**禁止 ES module、fetch、CDN、字体文件**（file:// 下全部失效）。
- 内容静态校验（改任何 `content/*.js` 后必跑，秒级）：`node tools/verify-content.mjs`
  —— 必填字段、id 唯一、tests ≥ 2、hints ≥ 1、starter ≠ solution、断言必须用内置辅助（否则失败信息不会说清期望/实际）。
- 内容行为校验（真浏览器里跑，慢但唯一说得上话的）：`node tools/verify-browser.mjs`
  —— 每个练习的参考解必须全过、起始代码必须至少挂一条、每个示例的 `checks` 必须全过。
  它可以 `--chapter ch05` 只跑一章。同一条路径在页面 console 里也能手动跑：`await H5LAB_SELFTEST()`。
- 浏览器端验收（真实输入管线 + 三档视口排版 + 全量自测）：`node tools/verify-ui.mjs`（`--fast` 跳过全量自测）。
  其中包含括号、引号与标签闭合的真实按键路径（`Input.dispatchKeyEvent`，含 CSS 页签里的花括号）。
- 括号与引号配对逻辑（`assets/js/pair.js`）：纯函数、浏览器与 node 共用，改判定规则后跑 `node tools/verify-pair.mjs`（秒级，82 项）。
- 逐章渲染检查（示例自检有没有挂、预览窗有没有缺、有没有未捕获错误）：`node tools/verify-pages.mjs`（`--shots` 存截图）。
- 关窗即退出：`node tools/verify-quit.mjs`；进站新鲜度：`node tools/verify-fresh.mjs`（毒化浏览器缓存后验新入口）。

CDP 验收的三条硬规矩（否则假失败）：

- 前台 `terminal` 超时 >600s 会被提升为后台进程，然后带 `stdin is not a tty` 立刻死掉。
  写成 `node tools/verify-ui.mjs > .cache/ui.txt 2>&1 < /dev/null` 且 timeout ≤ 600。
- `Page.captureScreenshot` 在隐藏标签页会一直挂着（不报错），截图前 `Page.bringToFront`，截图失败降级为警告。
- 满量自测要跑上百个沙箱 iframe，别塞进每轮迭代，迭代时用 `--chapter` / `--fast`。

## 架构铁律

1. **内容与引擎分离。** 所有教学文案、示例、练习只存在于 `content/chNN-*.js`；引擎不得内置任何一章的具体知识。
2. **内容文件是 classic script，带 UMD 尾巴**：
   `(function (root) { (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({ ... }); })(typeof window !== 'undefined' ? window : globalThis);`
   同一份内容浏览器和 node 都能读（`tools/verify-content.mjs` 就是这么读的）。
3. **schema 即契约**（`docs/01-content-schema.md`）。改 schema 必须同时改契约文档、`tools/verify-content.mjs`、引擎渲染三处。
4. **预览只有一个入口**：`assets/js/preview.js` 组装 iframe 文档，`assets/js/harness.js` 里的 harness 负责在 iframe 内
   定义断言辅助、截流控制台、跑断言、回传结果。禁止在别处再写一套 `has/count/eq`。
5. **用户代码只在 `sandbox="allow-scripts"` 的 iframe 里执行**（无 allow-same-origin，opaque origin），主文档不做 eval。
   因此断言拿不到父页面的任何东西，也拿不到用户代码里的顶层 `const`/`let`——见契约里的「断言能看见什么」。
6. **进度只进 localStorage**（key 前缀 `h5lab.v1.`），不依赖任何后端，不写 cookie。
7. **列宽由容器负责，子元素不许自己居中**：讲解/示例/表格进 `.read`，练习卡/示例预览/卡片网格进 `.work`
   （`renderChapter` 按段落类型分组建容器）。子元素自己写 `margin-inline: auto` 或 `margin: 14px 0` 之类的简写，
   会把容器给的居中/对齐打乱——js-lab 上踩过一次的 bug。
8. **两种代码块别搞混**：`kind:'demo'` 是讲解区的示例（静态展示 + 当场渲染 + 自检），`kind:'exercise'` 是练习卡（可编辑 + 判题）。
   示例不许引入练习里的东西，必须自包含。
9. 每一章必须自洽：只使用本章及之前章节讲过的标签与属性。
10. **编辑器辅助只做括号、引号配对与 HTML 标签闭合**，判定在 `assets/js/pair.js`（纯函数），浏览器与 node 共用。
    `()` `[]` `{}` 与 `' " \`` 三种引号都补另一半、都能成对删除；单引号紧跟在标识符字符后（撇号 don't）时不补。
    `<` `>` 与闭标签 `</tag>` 只在 HTML 页签补（JS 页签的 `<` 是小于号，CSS 里没有尖括号）。
    不引第三方编辑器（CodeMirror 之类是 ESM + 需要打包，会破坏 `file://` 直开），不做关键字补全。
10. **窄屏形态四座站一致**（`docs/04-mobile-layout.md`）：≤900px 目录栏收成抽屉（顶栏 `#nav-btn` + `body.nav-open`）、
    顶栏只留「目录/进度/自动运行」、「重置进度」进抽屉、表格包 `.tbl-wrap`、编辑器字号 ≥16px。
    改窄屏版式后跑 `node tools/verify-ui.mjs --fast`（含 390px 那一档）。

## 写作规范（文案与断言）

- 中文，高效少废话。不写「众所周知」「值得注意的是」「总之」，不写排比，不写总结式收尾。
- 每章开头一句 `goal`：这一章学完你能写出什么。
- 每个练习必须有：可运行的起始代码、参考解、≥2 条断言、≥1 条提示。
- 断言必须用内置辅助（`has/count/text/attr/tag/style/eq/ok/fn`），失败信息要说清实际值 vs 期望值，禁止只写「错误」。
- 示例的 `checks` 是对该示例的真实 DOM 断言（由 `tools/verify-browser.mjs` 跑），不许写成永远为真的检查。
- 讲解里出现的标签名、属性名用行内 `code` 包起来；不要用 emoji。

## 禁区

- 不引第三方库 / CDN / 外部字体，不引入运行时的 npm 依赖。
- 不用 `import` / `export`——file:// 下会直接白屏。
- 内容里不写网络请求（`fetch`/`XMLHttpRequest`/`<img src="http...">`）、不写 `alert`、`confirm`、`prompt`
  （iframe 里会静默或挂住）、不写自动播放带声音的媒体、不设 500ms 以下的定时器（会拖垮自测）。
- 不改 `DESIGN.md` 的色值、字体、字号，除非同一提交内同步改 `assets/css/base.css` 的 CSS 变量。
- 不删 `legacy/`（若有）里的旧实现，只允许往里搬。
