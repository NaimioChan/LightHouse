# AGENTS.md — TypeScript 训练场

在这个仓库里干活的 agent 的硬约束。动手前先读这份，再读 `docs/01-content-schema.md`。

## 这是什么

离线静态站点，把 TypeScript 的类型系统与日常工程用法教到能自己读懂、自己修。每章 = 讲解 + 当场判题的示例 +
手写练习（现写 / 现诊断 / 现检验）。无后端、无构建、无网络依赖。

三个演练场同源（`js-lab`、`html5-lab`、本站）：契约优先、内容与引擎分离、多层验证、关窗即退。
差别在执行模型：

| 站点 | 用户代码跑在哪 | 断言打在什么上 |
|---|---|---|
| js-lab | 沙箱 iframe 里的 JS | 控制台输出 |
| html5-lab | 沙箱 iframe 里真实渲染的 DOM | DOM 与计算样式 |
| **ts-lab** | **类型层：父页面里的 TypeScript 编译器** | **诊断与类型等价**；要跑产物时才进沙箱 iframe |

教什么、不教什么：不做类型体操（`type-challenges` 那条赛道已经满了）。这里教的是
「日常写 TS 会遇到的东西」——推断与注解、联合与收窄、泛型与工具类型、类、strict 报错怎么读、类型在运行时留下了什么。

## 运行与验证

- 双击 `run.bat`：跑 `python serve.py`（起静态服务 + 打开浏览器）。**页面关掉后服务自己退出，终端窗口跟着关**
  ——页面里挂一条 `/__alive` SSE 长连接（`assets/js/app.js` 的 `keepAlive`），没有任何连接持续 6 秒就退出。
- **每轮进站换 URL**：`serve.py` 每次运行生成一个令牌，入口是 `http://127.0.0.1:8879/index.html?v=<令牌>`，
  返回的 HTML 里 `assets/` `content/` 资源也全部打上同一个令牌，响应带 `no-store` 与 `Clear-Site-Data: "cache"`。
  原因：浏览器把 URL 当缓存键，而 Windows 的 ShellExecute 遇到**已经在开着的同一个 URL** 是把旧标签页切到前台、
  不重新加载——用户会看到上一轮的旧页面（旧 CSS，且旧 app.js 里没有保活连接，窗口也不会关）。
  改代码后如果页面看着还是旧的，先看有没有顶部那条蓝色「旧版本」提示条。
- 环境变量：`TSLAB_PORT` 起始端口（默认 8879）、`TSLAB_KEEP=1` 永不自动退出（自动化用）、`TSLAB_NO_OPEN=1` 不开浏览器、
  `TSLAB_TOKEN` 指定令牌、`TSLAB_IDLE_GRACE` 无连接多久退出。
- 也必须能直接双击 `index.html` 打开。因此：**禁止 ES module、fetch、CDN、字体文件**（file:// 下全部失效）。
- **vendor 的 12.3 MB 编译器例外**：`vendor/` 下三个文件是构建期产物，由 classic `<script>` 引入、
  由 `judge.js` 在首屏之后懒加载（不在首屏关键路径上）。这是全站唯一的第三方代码，见 `vendor/README.md`。

## 验证八层（都别只靠手测）

1. `node tools/verify-content.mjs` —— 结构校验（秒级）：字段、id 唯一且与章号一致、`tests ≥2`、`hints ≥1`、
   `starter ≠ solution`、断言用了内置辅助、期望类型是单引号字面量、每章 ≥3 示例 ≥4 练习、
   `index.html` 的 script 清单与 `content/*.js` 完全一致。并行写多章时加 `--no-index` 跳过清单那一条。
2. `node tools/verify-judge.mjs` —— 判题内核自己的单测（秒级）：等价的定义、字面量拓宽、
   `any` 必须单独拆开、诊断辅助、期望类型写错要报出来、运行器与超时、增量复用不串味。改 `judge.js` 后必跑。
3. `node tools/verify-types.mjs` —— 内容行为（node，不需要浏览器）：每个示例的 `checks` 必须全过、
   每道练习的参考答案必须全过、起始代码必须至少挂一条。`--chapter ch05` 只跑一章。
4. `node tools/verify-browser.mjs` —— 真浏览器（无头 Edge + CDP）：走 http 与 `file://` 两条路，
   用页面里的 `TSLAB_SELFTEST()` 重跑一遍。`--chapter ch05`、`--skip-file`。
5. `node tools/verify-pages.mjs` / `verify-ui.mjs` / `verify-quit.mjs` / `verify-fresh.mjs` / `verify-pair.mjs` ——
   逐章渲染检查（DOM 数量与内容对账）、真实按键输入管线与三档视口排版、关窗即退、进站新鲜度、括号与引号配对。

CDP 验收的三条硬规矩（否则假失败）：

- 前台 `terminal` 超时 >600s 会被提升为后台进程，然后带 `stdin is not a tty` 立刻死掉（实测踩过一次，
  等于那趟验收根本没跑）。写成 `node tools/verify-ui.mjs > .cache/ui.txt 2>&1 < /dev/null` 且 timeout ≤ 600。
- `Page.captureScreenshot` 在隐藏标签页会一直挂着（不报错），截图前 `Page.bringToFront`，截图失败降级为警告。
- **一次 `Runtime.evaluate` 也要设上限**：页面在解析 12 MB 编译器（`file://` 上尤其明显）时主线程会被占住，
  一次卡 60 秒会把整个 `waitFor` 的时间预算吃光，看起来像「等的东西没出现」的假失败。见 `tools/lib/cdp.mjs`。

## 架构铁律

1. **内容与引擎分离。** 所有教学文案、示例、练习只存在于 `content/chNN-*.js`；引擎不得内置任何一章的具体知识。
2. **内容文件是 classic script，带 UMD 尾巴**：
   `(function (root) { (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({ ... }); })(typeof window !== 'undefined' ? window : globalThis);`
   同一份内容浏览器与 node 都能读（`tools/verify-content.mjs` 就是这么读的）。
3. **schema 即契约**（`docs/01-content-schema.md`）。改 schema 必须同时改契约文档、`tools/verify-content.mjs`、
   `assets/js/judge.js`、`assets/js/render.js` 四处。
4. **判题只有一个入口**：`assets/js/judge.js`。它负责建 Program、收诊断、取值类型、编译与执行断言，
   浏览器（父页面主线程）与 node 校验脚本跑的是同一个文件、同一套默认 tsconfig。禁止在别处再写一套 `eqType`。
5. **用户代码从不 eval。** 类型检查是编译器的活；要真跑的时候，只把**编译产物**送进
   `sandbox="allow-scripts"` 的 iframe（`assets/js/sandbox.js` + `assets/js/harness.js`，opaque origin）。
   沙箱里 `localStorage` 抛 SecurityError、网络请求被拒、父页面读不到它的 DOM，结果只能 postMessage。
6. **值格式化只有一份**：`assets/js/format.js`。判题内核、node 运行器、沙箱 iframe 三处共用同一段源码
   （`TSLAB_FMT_SOURCE` 被贴进 srcdoc），否则「node 过、浏览器挂」这类假失败会一直冒出来。
7. **lib 的 SourceFile 跨 Program 复用 + `oldProgram` 增量**：首个 Program 约 240 ms，之后每次判题 2–8 ms。
   编译产物用**同一个 Program 的 `emit`**（不是另做一次 transpile），否则 `const enum` 内联与 target 差异都看不出来。
   改了建 Program / emit 的逻辑，务必用 `verify-judge.mjs` 的最后一项（增量复用不许串味）验一遍。
8. **进度只进 localStorage**（key 前缀 `tslab.v1.`），不依赖任何后端，不写 cookie。
9. **列宽由容器负责，子元素不许自己居中**：讲解/示例/表格进 `.read`，练习卡/练习场/卡片网格进 `.work`
   （`renderChapter` 按段落类型分组建容器）。
10. **两种代码块别搞混**：`kind:'demo'` 是讲解区的示例（静态展示 + 当场判题），`kind:'exercise'` 是练习卡（可编辑 + 判题）。
    示例不许引用练习里的东西，必须自包含。
11. **带模块语法的代码不要自动跑**：编译产物是 ESM，当普通脚本执行必然报「不能用模块语法」，只会在页面上制造假红条。
    判定规则只有一处（`render.js` 的 `wantsRun`）并三处共用（UI 渲染、页面自测、node 校验）：
    作者明确要 `run: true`、或断言里有 `run(`、或代码里没有 `import`/`export`。
12. **编辑器辅助只做括号与引号配对**（`assets/js/pair.js`，纯函数，浏览器与 node 共用）。
    `()` `[]` `{}` 与 `' " \`` 三种引号都补另一半、都能成对删除；单引号紧跟在标识符字符后（撇号 don't）时不补。
    **TS 的 `<` 是泛型尖括号，一律不补**（`html: false` 走到底）。
    不引第三方编辑器（CodeMirror 之类是 ESM + 需要打包，会破坏 `file://` 直开），不做关键字补全。
10. **窄屏形态四座站一致**（`docs/04-mobile-layout.md`）：≤900px 目录栏收成抽屉（顶栏 `#nav-btn` + `body.nav-open`）、
    顶栏只留「目录/进度/自动运行」、「重置进度」进抽屉、表格包 `.tbl-wrap`、编辑器字号 ≥16px。
    改窄屏版式后跑 `node tools/verify-ui.mjs --fast`（含 390px 那一档）。

## 写作规范（文案与断言）

- 中文，高效少废话。不写「众所周知」「值得注意的是」「总之」，不写排比，不写总结式收尾。不用 emoji。
- 每章开头一句 `goal`：这一章学完你能写出什么。
- 每个练习必须有：可运行的起始代码、参考答案、≥2 条断言、≥1 条提示；起始代码要能被断言抓住。
  起始代码要是「看起来合理但有具体缺陷」的版本，不要写空函数或 `TODO`。
- 断言必须用内置辅助，失败信息要说清实际值 vs 期望值。内容文件里出现 `\\'`（两个反斜杠）会被校验器直接报出来。
- 示例的 `checks` 是对该示例的真实断言（`verify-types.mjs` 与浏览器自测都会跑），不许写成永远为真的检查。
- 讲解里出现的类型名、关键字、错误码用行内 `code` 包起来。
- 每章只用本章及之前章节讲过的语法。

## 禁区

- 不引第三方库 / CDN / 外部字体，不引入运行时的 npm 依赖（`vendor/` 里的编译器是构建期产物，不是运行时依赖）。
- 不用 `import` / `export`——`file://` 下会直接白屏。内容里的代码同理（运行时断言不许出现模块语法）。
- 内容里不写网络请求（`fetch`/`XMLHttpRequest`）、不写 `alert`、`confirm`、`prompt`、不写 `while (true)`。
- 不改 `DESIGN.md` 的色值、字体、字号，除非同一提交内同步改 `assets/css/base.css` 的 CSS 变量。
- 不手改 `vendor/` 里的文件（重新生成见 `vendor/README.md`）。
