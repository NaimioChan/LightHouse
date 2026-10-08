# Agent 交接日志

Hermes 与 OpenCode 共用这一份。最新的在最上面。开工先读最近 5 条，收工必须追加一条。
格式说明与工具名对照见共享技能 `project-handoff`（`~/.agents/skills/project-handoff/SKILL.md`）。

## 当前占用

（空。开工时在这里加一行 `- <agent> · <任务> · <开始时间>`，收工删掉。）

---

## 2026-10-08 18:45 · opencode · 入口页页脚句子换成 GitHub 图标链接，各站版权行也加一个

- 改：`index.html`、`assets/css/portal.css`；六座站的 `assets/js/app.js`（`sideFoot()`）与 `assets/css/app.css`；`tools/verify-portal.mjs`；`DESIGN.md`、`AGENTS.md`、`docs/02-verification.md`、`README.md`、`docs/前端演练场-方向评估与实测.md`；`docs/screenshot-portal.png` 与 `docs/screenshot-portal-narrow.png`（重截）。
- 做了什么：① 入口页页脚删掉「进度只存在你自己的浏览器里，没有后端。源码与校验脚本在 GitHub。」整句，只留版权行 `© 2026 非茗 · Naimio`，行尾加一个 GitHub 图标链接（内联 SVG，指向上游仓库）。② 六座站的 `sideFoot()` 里，版权 `<p class="side-credit">` 尾部也塞进同一个图标链接，样式抽成 `.gh-link`，`<p>` 改 flex 同行排列。③ `verify-portal.mjs` 把两处新链接纳入验收：入口页页脚不许再出现那句旧文案、页脚与六站版权行各有一个 href 正确且占位非零的 `.gh-link`。④ 文档同步：DESIGN.md 页脚/组件描述、AGENTS.md 铁律 9、02-verification 的验收清单、README 与评估文档的 verify-portal 项数。
- 验证：`node tools/verify-manifest.mjs` 全过；`node tools/verify-portal.mjs` 131 项全过（比改动前多 8 项，正是新加的链接断言）；`react-lab/node tools/verify-ui.mjs --fast` 42 项全过、`js-lab` 同款全过（侧栏 flex 行没破坏窄屏版式）；`designmd lint DESIGN.md` 0 errors 0 warnings；`node --check` 过全部改动的 js。
- 遗留：各站自己的 `verify-ui.mjs` 全量档只跑了 react 与 js 两座，其余四座未逐座重跑全量（改动与它们同构，portal 侧已覆盖六座页脚）。
- 下一步：无。

## 2026-10-08 17:05 · opencode · 按 react-lab 增量回填 README 与评估文档，并修掉六座 serve.py 的 GBK 编码

- 改：`README.md`、`docs/前端演练场-方向评估与实测.md`、`docs/02-verification.md`、`DESIGN.md`、`html5-lab/serve.py`、`css-lab/serve.py`、`js-lab/serve.py`、`ts-lab/serve.py`、`vue-lab/serve.py`、`docs/screenshot-portal.png` 与 `docs/screenshot-portal-narrow.png`（重截，含六张卡）。
- 做了什么：① 根 README 补第六座与规模数字（78 章 / 353 练习 / 310 示例 / 1294 断言），目录树、校验段、诚实说明都加上 react-lab，端口区间改 8877–8883。② 评估文档把第 0/1/2/3/4/5/6.4/8/9/10 节从「五座/React 未开工」回填成六座已交付：站表加 React 行、总览矩阵 React 行改「已交付」、2.1 加 `react-lab/vendor/` 表、2.2 把 React 两行移出候选、3 节 React 计时改落地核对、4 节 React 判题手段补全、6.4 整节重写成交付记录（含 IIFE 构建命令、判题链路五步、rAF 不触发这条坑）、8/9/10 节同步（残留候选只剩 Tailwind）。③ `docs/02-verification.md` 新增「第六座站（react-lab）接入后的对账」一节。④ `DESIGN.md` 的 Do's/Don'ts 去掉「四张卡」「第五种强调色」「四座站」等过期措辞。
- 顺带修的跨站问题：五座老站的 `serve.py` 在 Windows 上按控制台代码页（GBK）编码 stdout，管道里变乱码，各自 `verify-quit.mjs` 按 UTF-8 读会认不出「页面已关闭」，五座一起挂 1 项（与本次增量无关，是既有问题）。给五座各加同 react-lab 一样的 `sys.stdout/stderr.reconfigure(encoding='utf-8')`，逐座 `verify-quit` 复跑全过。这与根 `AGENTS.md` 第 4 条「不许顺手统一各站代码」不冲突——改的是各站自己那份 serve.py 的输出编码，没动引擎逻辑；已征得用户同意。
- 验证：`node tools/verify-manifest.mjs` 全过（练习总数 353）；`node tools/verify-all.mjs` 22 支全过（修 serve.py 之前是 5 支失败）；`node tools/verify-portal.mjs` 123 项全过（含六座卡片与 390px 抽屉）；`designmd lint` 根与 `react-lab/DESIGN.md` 都 0 errors 0 warnings。本轮只改文档与 serve.py，未重跑各站最慢的 `verify-browser.mjs`（react-lab 那支在 16:24 那条里刚跑过）。
- 遗留：评估文档第 6.5 节（Tailwind）仍是候选；`docs/前端演练场-方向评估与实测.md` 第 3 节里少数非依赖型计时（如「iframe 同 URL 重载」「cache-bust 冷载」）仍标「未落地」，因为确实没在成站里量过。
- 下一步：如需发布，`git push` 当前分支。

## 2026-10-08 16:24 · opencode · 新建 React 19 训练场（react-lab，第六座）并接入入口页

- 改：新建 `react-lab/`（整座站，见下），改 `tools/labs.json`、`assets/css/portal.css`、`assets/js/manifest.js`（重跑生成）、`DESIGN.md`（补 `lab-react` 两条识别色）。
- 做了什么：按 `docs/前端演练场-方向评估与实测.md` §6.4 落成第六座。12 章 48 练习 38 示例。React 19 没有 UMD，也没有 `ReactDOM.render`，所以把 react + react-dom + react-dom/client + htm 用 esbuild 打成**单入口 IIFE**（全局 `RLLAB_REACT`，224 KB），再由 `tools/build-vendor-src.mjs` 生成源码字符串包 `react19-src.js` 供沙箱求值。模板用 `htm` 标签模板，不引 Babel。判题等待点是两轮宏任务 `tick()`（沙箱 iframe 离屏，rAF 不触发，实测过）。
- 验证：`react-lab` 内 `verify-content` / `verify-compile` / `verify-pair` / `verify-vendor` / `verify-quit` / `verify-pages` / `verify-ui` 全过（`verify-ui` 含 390px 与 `file://` 直开）；`verify-browser` http 与 `file://` 双跑，示例 38/38、参考答案 48/48、起始代码全被抓 48/48；`tools/verify-all.mjs --lab react` 4 支全过；根侧 `verify-manifest`、`verify-portal`（含 react-lab 卡片、侧栏、390px 抽屉）全过。
- 遗留：根 `AGENTS.md` 有一处与本任务无关的未提交改动（五座 → 所有站点的措辞），未纳入本次提交。
- 下一步：无。

## 2026-10-08 11:32 · hermes · 方向评估文件的表格按现况回填

- 改：`docs/前端演练场-方向评估与实测.md`（只动这一份文档）
- 做了什么：把全文的评估表格从「四座站」改写到五座站的现况——第 0 节站表与产能均值（66 章 / 305 练习 / 272 示例 / 1106 断言，23134 行内容、76 行每练习）、第 1 节总览矩阵（CSS 15 章 / Vue 3 标为已交付、React 19 升为下一站候选、动画一行改成两章承接）、第 2 节把 `vue-lab/vendor/` 从候选挪进已入库表、第 3 节 Vue 计时改成落地核对、第 4 节新增四行（Vue/混合遮罩滤镜/滚动驱动/指针 WAAPI）、第 6.3 节改成已交付的落地记录、第 6.6 节补上两处增量的落地对账与「滚动后重读几何不可行」这条偏差、第 8/9/10 节同步。
- 验证：`node tools/verify-manifest.mjs` 全过（含「入口页没写死任何一座站」，练习总数 305）；`node tools/verify-all.mjs --fast` 13 支全过。本次只改 markdown，未跑浏览器侧的 `verify-portal.mjs` 与各站 `verify-ui.mjs`。
- 遗留：文档里第 6.4（React 19）与第 6.5（Tailwind）仍是选型结论，没成站。

## 2026-10-08 11:25 · hermes · 接入多 agent 交接机制
- 改：`docs/agent-log.md`（新建）、`AGENTS.md`（加「Agent 交接」一节）、`.githooks/post-commit`（新建，校验提交是否带 trailer）
- 验证：本次只动文档与 hook，没碰站点代码，故未跑 `verify-*.mjs`
- 遗留：无
- 下一步：OpenCode 侧按同一格式追加即可

## 2026-10-08 10:51 · human · README 更新（既有提交 45ec46b）
- 改：`README.md` 与截图
- 验证：未记录
- 遗留：无
- 下一步：无
