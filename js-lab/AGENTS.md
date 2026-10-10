# AGENTS.md — JS 训练场

在这个仓库里干活的 agent 的硬约束。动手前先读这份，再读 `docs/01-content-schema.md`。

## 这是什么

离线静态站点，把 JavaScript 从入门教到熟练。每章 = 讲解 + 可运行示例 + 手写练习（现写 / 现预览 / 现检验）。
无后端、无构建、无网络依赖。

## 运行与验证

- 双击 `run.bat`：跑 `python serve.py`（起静态服务 + 打开浏览器）。**页面关掉后服务自己退出，终端窗口跟着关**
  —— 页面里挂一条 `/__alive` SSE 长连接（`assets/js/app.js` 的 `keepAlive`），没有任何连接持续 6 秒就退出。
- **每轮进站换 URL**：`serve.py` 每次运行生成一个令牌，入口是 `http://127.0.0.1:8877/index.html?v=<令牌>`，
  返回的 HTML 里 `assets/` `content/` 资源也全部打上同一个令牌，响应带 `no-store` 与 `Clear-Site-Data: "cache"`。
  原因：浏览器把 URL 当缓存键，而 Windows 的 ShellExecute 遇到**已经在开着的同一个 URL** 是把旧标签页切到前台、
  不重新加载——用户会看到上一轮的旧页面（旧 CSS，且旧 app.js 没有保活连接，窗口也不会关）。改代码后如果页面看着还是旧的，
  先看有没有顶部那条橙色「旧版本」提示条。
- 环境变量：`JSLAB_PORT` 起始端口、`JSLAB_KEEP=1` 永不自动退出（自动化用）、`JSLAB_NO_OPEN=1` 不开浏览器、`JSLAB_TOKEN` 指定令牌。
- 也必须能直接双击 `index.html` 打开。因此：**禁止 ES module、fetch、CDN、字体文件**（file:// 下全部失效）。
- 内容校验（改任何 `content/*.js` 后必跑）：`node tools/verify-content.mjs`
  —— 每个练习的参考答案必须全部通过、起始代码必须至少挂一条断言、每个示例的 `expect` 必须与实际输出逐字一致。
- 写多行字符串（`[...].join('\n')`）时注意转义层级：写成 `'\\n'` 会得到**字面反斜杠 + n**，
  CSS/HTML 不会换行、直接失效。**这类错误 `verify-content` 抓不到**（练习的断言可能照样过），
  唯一的现场是 `verify-browser` 里示例自检挂掉、或页面里样式整段不生效。写完一章先肉眼看一眼 `join('\n')`。
- 指针类练习（第 15 章）：`new PointerEvent("pointermove", { clientX, clientY })` 会正常进监听器，
  可以「派发 → 读 DOM/文本」。但 `:hover` 合成不出来，别指望它。
- 浏览器端验收：`node tools/verify-ui.mjs`（真实输入管线 + 三档视口排版 + 全量自测；`--fast` 跳过全量自测）。
  其中包含括号与引号配对的真实按键路径（`Input.dispatchKeyEvent`）。
- 配对逻辑（`assets/js/pair.js`）：纯函数、浏览器与 node 共用，改判定规则后跑 `node tools/verify-pair.mjs`（秒级，60 项）。
- 关窗即退出：`node tools/verify-quit.mjs`；进站新鲜度：`node tools/verify-fresh.mjs`（毒化浏览器缓存后验新入口）。
- 浏览器端全量自测：打开页面后在 console 执行 `await JSLAB_SELFTEST()`，跑全部练习（含 DOM 类）并返回汇总。

## 架构铁律

1. **内容与引擎分离。** 所有教学文案、示例、练习只存在于 `content/chNN-*.js`；引擎不得内置任何一章的具体知识。
2. **内容文件是 classic script，带 UMD 尾巴**：
   `(function (root) { (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({ ... }); })(typeof window !== 'undefined' ? window : globalThis);`
   同一份内容，浏览器和 node 都能读。
3. **schema 即契约**（`docs/01-content-schema.md`）。改 schema 必须同时改契约文档、`tools/verify-content.mjs`、引擎渲染三处。
4. **沙箱只有一条路径**：`assets/js/sandbox.js` 里的 harness（`JSLAB_HARNESS_FN`）+ `assets/js/runner.js` 起 iframe。
   node 校验器必须复用同一个 harness（`toString()` 后丢进 `vm`），不许在 node 侧另写一套断言辅助函数。
5. **用户代码只在 `sandbox="allow-scripts"` 的 iframe 里执行**，主文档不做 eval。
6. **进度只进 localStorage**（key 前缀 `jslab.v1.`），不依赖任何后端，不写 cookie。
7. **列宽由容器负责，子元素不许自己居中**：讲解/示例/表格进 `.read`，练习卡/卡片网格进 `.work`
   （`renderChapter` 按段落类型分组建容器）。子元素自己写 `margin-inline: auto` 或
   `margin: 14px 0` 之类的简写，会把容器给的居中/对齐打乱——这正是踩过一次的 bug。
8. 每一章必须自洽：只使用本章及之前章节讲过的语法（`content/CHANGELOG` 不需要，靠章节顺序保证）。
9. **编辑器辅助只做括号与引号配对**，判定在 `assets/js/pair.js`（纯函数），浏览器与 node 共用。
   `()` `[]` `{}` 与 `' " \`` 三种引号都补另一半、都能成对删除；单引号紧跟在标识符字符后（撇号 don't）时不补。
   不引第三方编辑器（CodeMirror 之类是 ESM + 需要打包，会破坏 `file://` 直开），不做关键字补全、不做标签自动闭合。
10. **窄屏形态四座站一致**（`docs/04-mobile-layout.md`）：≤900px 目录栏收成抽屉（顶栏 `#nav-btn` + `body.nav-open`）、
    顶栏只留「目录/进度/自动运行」、「重置进度」进抽屉、表格包 `.tbl-wrap`、编辑器字号 ≥16px。
    改窄屏版式后跑 `node tools/verify-ui.mjs --fast`（含 390px 那一档）。

## 写作规范（文案与断言）

- 中文，高效少废话。不写"众所周知""值得注意的是""总之"，不写排比，不写总结式收尾。
- 每章开头一句 `goal`：这一章学完你能做什么。
- 每个练习必须有：可运行的起始代码、参考解、≥2 条断言、≥1 条提示。
- 断言的失败信息要说清实际值 vs 期望值，禁止只写"错误"。
- 示例的 `expect` 是照抄真实输出的 ground truth，由 `verify-content.mjs` 执行比对，不许手写猜测。

## 禁区

- 不引第三方库 / CDN / 外部字体，不引入运行时的 npm 依赖。
- 不用 `import` / `export`——file:// 下会直接白屏。
- 不改 `DESIGN.md` 的色值、字体、字号，除非同一提交内同步改 `assets/css/base.css` 的 CSS 变量。
- 内容文件里不写网络请求、定时炸弹（长 interval）、控制台刷屏等副作用。
- 不删 `legacy/`（若有）里的旧实现，只允许往里搬。
