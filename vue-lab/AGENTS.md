# AGENTS.md — Vue 3 训练场

在这个仓库里干活的 agent 的硬约束。动手前先读这份，再读 `docs/01-content-schema.md`。

## 这是什么

离线静态站点，把 Vue 3 的写法教到能独立写单文件组件：响应式、计算属性、模板语法、
组件通信、组合式函数。每章 = 讲解 + 当场判题的示例 + 手写练习（现写 / 现编译 / 现检验）。

四座站同源（`js-lab`、`html5-lab`、`ts-lab`、本站）：契约优先、内容与引擎分离、多层验证、关窗即退。
差别在执行模型：

| 站点 | 用户代码跑在哪 | 断言打在什么上 |
|---|---|---|
| js-lab | 沙箱 iframe 里的 JS | 控制台输出 |
| html5-lab | 沙箱 iframe 里真实渲染的 DOM | DOM 与计算样式 |
| ts-lab | 类型层：父页面里的 TypeScript 编译器 | 诊断与类型等价 |
| **vue-lab** | **沙箱 iframe 里的 Vue 运行时 + SFC 编译器** | **挂载后的真实 DOM**（`nextTick` 之后） |

教什么、不教什么：不做全家桶。路由、状态管理库、SSR、构建工具都不在本站范围内
（它们需要真 node 进程或额外的第三方包）。这里教的是「写一个组件会遇到的全部基础」——
`ref` 与 `reactive` 的区别、`computed` 什么时候该用、模板里哪些写法不生效、
`props` / `emit` 怎么传、`v-model` 的展开、`watch` 与生命周期的时机、组合式函数怎么抽。

## 运行与验证

- 双击 `run.bat`：跑 `python serve.py`（起静态服务 + 打开浏览器）。**页面关掉后服务自己退出，
  终端窗口跟着关**——页面里挂一条 `/__alive` SSE 长连接（`assets/js/app.js` 的 `keepAlive`），
  没有任何连接持续 6 秒就退出。
- **每轮进站换 URL**：`serve.py` 每次运行生成一个令牌，入口是 `http://127.0.0.1:8881/index.html?v=<令牌>`，
  返回的 HTML 里 `assets/` `content/` `vendor/` 资源也全部打上同一个令牌。
  原因：浏览器把 URL 当缓存键，而 Windows 的 ShellExecute 遇到**已经在开着的同一个 URL** 是把旧标签页切到前台、
  不重新加载——用户会看到上一轮的旧页面。
- 环境变量：`VUELAB_PORT` 起始端口（默认 8881）、`VUELAB_KEEP=1` 永不自动退出（自动化用）、
  `VUELAB_NO_OPEN=1` 不开浏览器、`VUELAB_TOKEN` 指定令牌、`VUELAB_IDLE_GRACE` 无连接多久退出。
- 也必须能直接双击 `index.html` 打开。因此：**禁止 ES module、fetch、CDN、字体文件**（file:// 下全部失效）。
- **`vendor/` 的 972 KB 是例外**：`vue.global.prod.js` 与 `vue-sfc-compiler.js` 是构建期产物，
  由 classic `<script>` 引入、由 `sandbox.js` 在首屏之后懒加载（不在首屏关键路径上）。
  这是全站唯一的第三方代码，见 `vendor/README.md`。

## 验证（都别只靠手测）

1. `node tools/verify-content.mjs` —— 结构校验（秒级）：字段、id 唯一且与章号一致、`tests ≥2`、
   `hints ≥1`、`starter ≠ solution`、每章 ≥3 示例 ≥4 练习、
   `index.html` 的 script 清单与 `content/*.js` 完全一致。
2. `node tools/verify-compile.mjs` —— 编译内核自己的单测（秒级）：import 改写（含 `as` 别名、
   单双引号两种分隔符）、`export default` 改写、`__isScriptSetup`、`__scopeId`、
   坏代码要报出真实错误位置。改 `assets/js/compile.js` 后必跑。
3. `node tools/verify-pages.mjs` / `verify-ui.mjs` / `verify-quit.mjs` / `verify-pair.mjs` ——
   逐章渲染检查、真实按键输入管线与四档视口排版（含 390px）、关窗即退、括号配对。
4. `node tools/verify-browser.mjs` —— 真浏览器（无头 Edge + CDP）：走 http 与 `file://` 两条路，
   用页面里的 `VUELAB_SELFTEST()` 把每个练习跑两遍（参考答案必须全过、起始代码必须挂）。

CDP 验收的硬规矩（否则假失败）：

- 前台 `terminal` 超时 >600s 会被提升为后台进程，然后带 `stdin is not a tty` 立刻死掉。
  写成 `node tools/verify-browser.mjs > .cache/b.txt 2>&1 < /dev/null` 且 timeout ≤ 600。
- `Page.captureScreenshot` 在隐藏标签页会一直挂着，截图前 `Page.bringToFront`，失败降级为警告。
- 用 flat session 调 CDP 时 `cdp.send(method, params, timeoutMs, sessionId)` 的第四个参数不能漏。

## 架构铁律

1. **内容与引擎分离。** 所有教学文案、示例、练习只存在于 `content/chNN-*.js`；引擎不得内置任何一章的具体知识。
2. **内容文件是 classic script，带 UMD 尾巴**：
   `(function (root) { (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({ ... }); })(typeof window !== 'undefined' ? window : globalThis);`
   同一份内容浏览器与 node 都能读（`tools/verify-content.mjs` 就是这么读的）。
3. **schema 即契约**（`docs/01-content-schema.md`）。改 schema 必须同时改契约文档、`tools/verify-content.mjs`、
   `assets/js/compile.js`、`assets/js/render.js` 四处。
4. **编译只有一个入口**：`assets/js/compile.js`。SFC 的 parse / compileScript / compileStyle /
   import 改写 / `__isScriptSetup` / `__scopeId` 全在里面。禁止在别处再写一套改写。
5. **用户代码只跑在沙箱里**：`sandbox="allow-scripts"` 的 iframe（opaque origin，
   `assets/js/sandbox.js` + `assets/js/harness.js`）。沙箱里 `localStorage` 抛 SecurityError、
   网络请求被拒、父页面读不到它的 DOM，结果只能 postMessage。
6. **两个 vue 产物的求值方式与普通脚本不同**（实测，改这里之前先看 `vendor/README.md`）：
   它们都是 `var X = (function(){...})()` 形式，**eval 之后不会自动挂到 window**，
   必须补 `window.Vue = Vue` / `window.VueSFC = VueSFC`。
7. **内核（贴进 srcdoc 的那段）里不许出现反引号**：它在模板字符串里，注释里写一个反引号就会提前
   终止模板串，整段内核会被当成外层代码。正则里的反斜杠要按两层转义写。
8. **判题等待点是 `nextTick()`**，不是固定毫秒。用户改完状态后 DOM 还没更新，必须等一次 nextTick 再读。
9. **进度只进 localStorage**（key 前缀 `vuelab.v1.`），不依赖任何后端，不写 cookie。
10. **列宽由容器负责，子元素不许自己居中**：讲解/示例/表格进 `.read`，练习卡/练习场进 `.work`
    （`renderChapter` 按段落类型分组建容器）。
11. **两种代码块别搞混**：`kind:'demo'` 是讲解区的示例（静态展示 + 当场判题），`kind:'exercise'`
    是练习卡（可编辑 + 判题）。
12. **手机版式与其余四座一致**，契约在根 `docs/04-mobile-layout.md`：≤900px 目录栏收成抽屉、
    顶栏只留三样、宽表包 `.tbl-wrap`、编辑器字号 ≥16px。

## 禁区

- 不在本站引入第二个框架（React / Svelte / Solid），不做全家桶。
- 不把 `vendor/` 里的产物搬出本站或做「共享」。
- 不在内容里写 `import` 一个不存在的模块（`compile.js` 只认 `vue`）。
- 不用 emoji。中文文案守 `anti-slop`：不排比、不写「值得注意的是」、不写总结式收尾。
