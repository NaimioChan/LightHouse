# AGENTS.md — React 训练场

在这个仓库里干活的 agent 的硬约束。动手前先读这份，再读 `docs/01-content-schema.md`。

## 这是什么

离线静态站点，把 React 19 的组件写法教到能独立拆组件、管状态、共享状态。每章 = 讲解 + 当场判题的示例 +
手写练习（现写 / 现跑 / 现检验）。

六座站同源（`js-lab`、`html5-lab`、`css-lab`、`ts-lab`、`vue-lab`、本站）：契约优先、内容与引擎分离、多层验证、关窗即退。
差别在执行模型：

| 站点 | 用户代码跑在哪 | 断言打在什么上 |
|---|---|---|
| js-lab | 沙箱 iframe 里的 JS | 控制台输出 |
| html5-lab | 沙箱 iframe 里真实渲染的 DOM | DOM 与计算样式 |
| css-lab | 沙箱 iframe 里真实渲染的 DOM | 几何与计算值（两阶段） |
| ts-lab | 类型层：父页面里的 TypeScript 编译器 | 诊断与类型等价 |
| vue-lab | 沙箱 iframe 里的 Vue 运行时 + SFC 编译器 | 挂载后的真实 DOM（`nextTick` 之后） |
| **react-lab** | **沙箱 iframe 里的 React 运行时（自建单入口 IIFE）** | **`flushSync` 之后的真实 DOM** |

教什么、不教什么：不做全家桶。路由、状态管理库、服务端渲染、构建工具都不在本站范围内。
这里教的是「写一个组件会遇到的全部基础」——props 与不可变性、列表与 key、state 与事件、
受控表单、派生值与条件渲染、副作用与清理、状态提升、ref 与 DOM、样式、`useReducer`、`context`。

模板**不用 JSX**（那要引入 2.98 MB 的 Babel），用 `htm` 的标签模板：属性写 `class=${'x'}`、
事件写 `onClick=${fn}`、组件用 `<${Comp}/>`。改写内核把 `import` 换成从沙箱里的产物取值。

## 运行与验证

- 双击 `run.bat`：跑 `python serve.py`（起静态服务 + 打开浏览器）。**页面关掉后服务自己退出，
  终端窗口跟着关**——页面里挂一条 `/__alive` SSE 长连接（`assets/js/app.js` 的 `keepAlive`），
  没有任何连接持续 6 秒就退出。
- **每轮进站换 URL**：`serve.py` 每次运行生成一个令牌，入口是 `http://127.0.0.1:8883/index.html?v=<令牌>`，
  返回的 HTML 里 `assets/` `content/` `vendor/` 资源也全部打上同一个令牌。
  原因：浏览器把 URL 当缓存键，而 Windows 的 ShellExecute 遇到**已经在开着的同一个 URL** 是把旧标签页切到前台、
  不重新加载——用户会看到上一轮的旧页面。
- 环境变量：`RLLAB_PORT` 起始端口（默认 8883）、`RLLAB_KEEP=1` 永不自动退出（自动化用）、
  `RLLAB_NO_OPEN=1` 不开浏览器、`RLLAB_TOKEN` 指定令牌、`RLLAB_IDLE_GRACE` 无连接多久退出。
- 也必须能直接双击 `index.html` 打开。因此：**禁止 ES module、fetch、CDN、字体文件**（file:// 下全部失效）。
- **`vendor/` 的 224 KB 是例外**：`react19.iife.min.js` 是构建期产物（react + react-dom + htm 打成单入口 IIFE），
  由 classic `<script>` 引入、由 `sandbox.js` 在首屏之后懒加载（不在首屏关键路径上）。
  这是全站唯一的第三方代码，见 `vendor/README.md`。

## 验证（都别只靠手测）

1. `node tools/verify-content.mjs` —— 结构校验（秒级）：字段、id 唯一且与章号一致、`tests ≥2`、
   `hints ≥1`、`starter ≠ solution`、每章 ≥3 示例 ≥4 练习、
   `index.html` 的 script 清单与 `content/*.js` 完全一致。
2. `node tools/verify-compile.mjs` —— 改写内核自己的单测（秒级）：默认导入、命名导入、别名、命名空间导入、
   `export default`、不支持的模块要报出来。改 `assets/js/compile.js` 后必跑。
3. `node tools/verify-browser.mjs` —— 真浏览器（无头 Edge + CDP）：走 http 与 `file://` 两条路，
   用页面里的 `RLLAB_SELFTEST()` 把每个练习跑两遍（参考答案必须全过、起始代码必须挂）。
4. `node tools/verify-ui.mjs` —— 真实按键输入管线与四档视口排版（含 390px）、离线直开。
5. `node tools/verify-pages.mjs` —— 逐章渲染对账（DOM 数量 vs 内容里的数字）。
6. `node tools/verify-quit.mjs` —— 关窗即退。
7. `node tools/verify-vendor.mjs` —— vendor 产物的体积与哈希没变（改了要同步 `vendor/README.md`）。

CDP 验收的硬规矩（否则假失败）：

- 前台 `terminal` 超时 >600s 会被提升为后台进程，然后带 `stdin is not a tty` 立刻死掉。
  写成 `node tools/verify-browser.mjs > .cache/b.txt 2>&1 < /dev/null` 且 timeout ≤ 600。
- `Page.captureScreenshot` 在隐藏标签页会一直挂着，截图前 `Page.bringToFront`，失败降级为警告。
- 用 flat session 调 CDP 时 `cdp.send(method, params, timeoutMs, sessionId)` 的第四个参数不能漏。

## 架构铁律

1. **内容与引擎分离。** 所有教学文案、示例、练习只存在于 `content/chNN-*.js`；引擎不得内置任何一章的具体知识。
2. **内容文件是 classic script，带 UMD 尾巴**：
   `(function (root) { (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({ ... }); })(typeof window !== 'undefined' ? window : globalThis);`
   同一份内容浏览器与 node 都能读（`tools/verify-content.mjs` 就是这么读的）。
3. **schema 即契约**（`docs/01-content-schema.md`）。改 schema 必须同时改契约文档、`tools/verify-content.mjs`、
   `assets/js/render.js` 四处。
4. **改写只有一个入口**：`assets/js/compile.js`。`import` 改写、`export` 改写、模块白名单全在里面。
   禁止在别处再写一套改写。
5. **用户代码只跑在沙箱里**：`sandbox="allow-scripts"` 的 iframe（opaque origin，
   `assets/js/sandbox.js` + `assets/js/harness.js`）。沙箱里 `localStorage` 抛 SecurityError、
   网络请求被拒、父页面读不到它的 DOM，结果只能 postMessage。
6. **判题等待点是 `flushSync` + 等一帧**，不是固定毫秒。事件处理里的状态更新多为同步刷新，
   但 effect / 并发更新要等一次宏任务再读 DOM。断言里用 `await tick()`。
7. **内核（贴进 srcdoc 的那段）里不许出现反引号**：它在模板字符串里，注释里写一个反引号就会提前
   终止模板串，整段内核会被当成外层代码。正则里的反斜杠要按两层转义写。
8. **React 根用 `createRoot`，不是 `ReactDOM.render`**（19 已移除）。多个 React 副本会让 hooks 失效，
   所以产物必须单入口打成一份——`React`、`ReactDOM`、`ReactDOMClient`、`htm` 一起挂在 `RLLAB_REACT` 上。
9. **进度只进 localStorage**（key 前缀 `rllab.v1.`），不依赖任何后端，不写 cookie。
10. **列宽由容器负责，子元素不许自己居中**：讲解/示例/表格进 `.read`，练习卡/练习场进 `.work`
    （`renderChapter` 按段落类型分组建容器）。
11. **两种代码块别搞混**：`kind:'demo'` 是讲解区的示例（静态展示 + 当场判题），`kind:'exercise'`
    是练习卡（可编辑 + 判题）。
12. **手机版式与其余五座一致**，契约在根 `docs/04-mobile-layout.md`：≤900px 目录栏收成抽屉、
    顶栏只留三样、宽表包 `.tbl-wrap`、编辑器字号 ≥16px、`html{height:100%}` + `body{min-height:100%}`。
13. **编辑器辅助只做括号与引号配对**（`assets/js/pair.js`，纯函数，浏览器与 node 共用）。
    `()` `[]` `{}` 与 `' " \`` 三种引号都补另一半、都能成对删除；单引号紧跟在标识符字符后（撇号 don't）时不补。
    尖括号是 htm 的标签语法，一律不补。

## 禁区

- 不在本站引入第二个框架（Vue / Svelte / Solid），不做全家桶。
- 不把 `vendor/` 里的产物搬出本站或做「共享」。
- 不在内容里写 `import` 一个不存在的模块（`compile.js` 只认 react / react-dom / react-dom/client / htm）。
- 不用 emoji。中文文案守 `anti-slop`：不排比、不写「值得注意的是」、不写总结式收尾。
