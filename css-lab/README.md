# CSS 训练场

离线静态站点，把 CSS 教到「看到效果不对能自己找到原因」。15 章、72 个练习、43 个当场渲染的示例。

顺着左侧目录往下读，每章三件事：读一段讲解、看一段**真实渲染出来**的示例、自己写一段 CSS 并当场检验。
没有后端、没有构建、没有网络依赖——双击 `run.bat` 就能用，也可以直接双击 `index.html`。

## 怎么用

1. **总览**页给 15 张章节卡，卡片上写着每章的练习进度。
2. 进任意一章：讲解、示例（打开即渲染，不用点按钮）、练习卡。
3. 练习卡里左边是任务，中间是代码框（按 `HTML` / `CSS` / `JS` 页签切），右边是预览窗——就是你样式渲染出来的真页面。
   停手一秒自动重渲，`Ctrl + Enter` 立刻渲染并跑断言。
4. 断言清单里每条 ✗ 都会说明「期望什么、实际什么」。改到全 ✓，进度自动记住（存在浏览器本地）。
5. 标了 `窄屏` 的断言，会把预览窗收窄到 **420px** 再跑一遍——这是第 9 章的响应式练习专用的。
6. 想随手试样式，去**练习场**：三栏自由写 HTML/CSS/JS，实时预览 + 控制台。

## 目录

```
index.html            入口（纯 classic script，file:// 也能跑）
run.bat               双击：起本地服务 + 开浏览器；关掉页面，终端窗口跟着关
serve.py              本地静态服务（带令牌的入口 URL + SSE 保活 + 关窗即退）
AGENTS.md             给改这个仓库的 agent 看的硬约束
DESIGN.md             色值 / 字体 / 版式的唯一来源（Google design.md 格式）
docs/01-content-schema.md   内容契约：写法、字段、断言辅助、两阶段断言
assets/css/           base.css（令牌）、app.css（布局与组件）
assets/js/            harness.js（预览 iframe 里的断言内核，唯一实现）
                      preview.js（拼装 iframe 文档、两阶段驱动、回传结果）
                      highlight.js（HTML/CSS/JS 三套极简高亮）
                      render.js（迷你 markdown + 示例窗与练习卡）
                      app.js（路由、目录、进度、练习场、自测钩子）
content/chNN-*.js     一章一个文件，教学文案与练习只存在这里
tools/                校验与验收脚本，见下
```

## 加一章

内容契约是 `docs/01-content-schema.md`，照 `content/ch01-selectors.js` 的样子写最快：一章一个文件、
UMD 尾巴挂到 `CSSLAB_CHAPTERS`，段落分 `prose` / `note` / `table` / `demo` / `exercise` 五种。
写完把文件名加进 `index.html` 的 script 列表（清单和文件不一致，结构校验会直接报错）。

每章至少要有：一句 `goal`、几段讲解、带自检的示例、5 个练习（每个练习 = 可运行的起始代码 + 参考解 + ≥2 条断言 + ≥1 条提示）。

## 验证（七个脚本，各管一段）

| 命令 | 管什么 | 现在的状态 |
|---|---|---|
| `node tools/verify-content.mjs` | 结构：字段、id 唯一与编号连续、断言用了内置辅助、starter ≠ solution、两阶段断言写法、index.html 清单一致 | 15 章 · 72 练习 · 43 示例 · 51 段讲解 · 15 条提示 · 13 张表，全通过 |
| `node tools/verify-browser.mjs` | 行为：真浏览器里跑每个示例的自检、每个练习的参考解（必须全过）与起始代码（必须至少挂一条） | 示例自检 43/43 · 参考解 72/72 · 起始代码被抓住 72/72（394 秒） |
| `node tools/verify-ui.mjs [--fast]` | 交互与排版：真实键盘输入 → 自动判题、页签、练习场、三档视口对齐、死循环保护、file:// 直开 | 43 项检查全通过 |
| `node tools/verify-pages.mjs [--shots]` | 逐章打开：示例有没有自检失败、预览窗有没有缺、有没有未捕获错误 | 15 章 + 练习场全通过 |
| `node tools/verify-quit.mjs` · `node tools/verify-fresh.mjs` | 关窗即退出；换 URL 保证不拿到缓存旧版 | 各 7 / 11 项全通过 |
| `node tools/verify-pair.mjs` | 括号与引号配对的纯逻辑（秒级） | 全通过 |

`verify-content` 与 `verify-pair` 是纯 node 的（秒级）；其余会起无头 Edge，几十秒到六分钟。
页面里也能手动全量自测：打开后 console 执行 `await CSSLAB_SELFTEST()`（或给地址加 `?selftest`）。

## 设计与实现上的几个硬决定

- **用户代码只跑在 `sandbox="allow-scripts"` 的 iframe 里**（没有 `allow-same-origin`，opaque origin），
  主文档不做 eval。断言在 iframe 内部对真实 DOM 与计算样式跑，结果经 postMessage 回传，按 runId 过滤。
- **断言必须在真实 DOM 上跑，所以内容的行为校验只能在浏览器里做**（node 没有 DOM）。
  结构问题交给纯 node 的 `verify-content`，行为问题交给 `verify-browser` 与页面里的 `CSSLAB_SELFTEST()`。
- **两阶段判题**（教 CSS 特有的能力）：断言写成 `[[阶段1...], [阶段2...]]` 时，阶段 1 跑完把**这一帧**的宽度
  改到 `widths[0]`（默认 420px），等页面完成一次真实布局，再用新文档跑阶段 2。
  这样媒体查询、`flex-wrap`、`grid-template-columns` 的变化都判得了。脚本侧的状态用 `__notify('名字')` 配 `watch('名字')` 回传。
- **几何断言的坑都写进契约了**：预览窗 `body` 自带 12px 内边距（`rect().x/y` 是相对视口的，跨元素比位置要算上它）；
  比例字体下宽度是小数，用 `near(容差)` 而不是 `eq`；`100%` 配 `padding` 的算法在契约里举了例子。
- **两档列宽**：讲解/示例/表格走 `.read`（820px 居中），练习卡与练习场走 `.work`（1560px）。
  居中由容器负责，子元素不许自己写居中的 margin——这是 js-lab 上踩过的 bug。
- **每轮进站换 URL**：`serve.py` 每次生成令牌，入口是 `index.html?v=<令牌>`，HTML 里的资源也带上它，
  响应带 `no-store` 与 `Clear-Site-Data: "cache"`。否则 Windows 上重复打开同一地址只会把旧标签页切到前台。
- **示例也要自证**：每个 `demo` 必须带 `checks`，打开即渲染并当场跑；不通过就在窗下显示一条红字。

## 已知限制

- 打开一章时十几张练习卡同时渲染，个别几何断言可能在帧还没排出版面时读到 0（引擎会等最多 1 秒，
  但机器很卡时仍可能撞上）；重跑一次就正常。全量校验里出现过、重跑即消失的就是这一类。
- 死循环会被 5 秒超时掐掉并给提示，但那几秒那一格预览会卡住。
- 异步输出最多等 1.5 秒（安静 40ms 收工），更慢的延时逻辑判不到。
- `:hover` 的计算值判题时取不到（选择器不匹配），所以悬停类练习判的是「声明写对没有」+ 基础态，
  需要真的看到聚焦/勾选状态时，由页面里的 JS 先触发一次（第 12 章的焦点练习就是这么做的）。
- 预览 iframe 是 opaque origin：`localStorage` / `sessionStorage` 在预览里用不了，也没有网络。
- 样式类断言按 `getComputedStyle` 的实际值比较，是按 Edge 的取值写的；换浏览器内核理论上可能差一两个值。
- `prefers-reduced-motion` / `prefers-color-scheme` 这类查的是**预览窗所在浏览器**的设置，
  桌面没开就走不到那个分支，只能判「声明写对了没有」。
- **滚动驱动动画的进度在预览窗里是冻结的**（第 14 章）：帧收不到真实滚动事件，`getAnimations()` 的
  `progress` 一直是 0，`scrollTop` 改了也不驱动样式。所以那一章判的是「时间轴与关键帧挂对了没有」；
  真要感受进度得在真实浏览器里打开页面自己滚。
- 计算值里的 `animation-timeline` 只会回显成 `scroll()` / `view()`，括号里的方向与容器参数读不出来。
- 进度只存在浏览器本地，换浏览器或清数据就没了。

## 与 js-lab / html5-lab 的关系

同一套骨架：契约优先（`docs/01-content-schema.md` 是唯一真相）、内容与引擎分离、分层验证、关窗即退。
`js-lab` 跑的是 JS 控制台输出，`html5-lab` 跑的是真实 HTML 渲染，这里同样跑真实渲染，
另外把引擎补成了「判 CSS 需要的样子」：几何断言辅助、两阶段（改宽度重读）、`watch` 回传。
色板同源，强调色从赤陶橙 / HTML5 橙换成 CSS 官方的蓝：`#2965F1` 装饰用、`#2456C8` 承载文字用
（纸白上 6.15:1，过 AA）。
