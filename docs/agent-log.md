# Agent 交接日志

Hermes 与 OpenCode 共用这一份。最新的在最上面。开工先读最近 5 条，收工必须追加一条。
格式说明与工具名对照见共享技能 `project-handoff`（`~/.agents/skills/project-handoff/SKILL.md`）。

## 当前占用

（空。开工时在这里加一行 `- <agent> · <任务> · <开始时间>`，收工删掉。）

---

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
