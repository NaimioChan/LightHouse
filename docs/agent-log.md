# Agent 交接日志

Hermes 与 OpenCode 共用这一份。最新的在最上面。开工先读最近 5 条，收工必须追加一条。
格式说明与工具名对照见共享技能 `project-handoff`（`~/.agents/skills/project-handoff/SKILL.md`）。

## 当前占用

（空。开工时在这里加一行 `- <agent> · <任务> · <开始时间>`，收工删掉。）

---

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
