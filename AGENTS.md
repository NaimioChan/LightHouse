# AGENTS.md — LightHouse 项目铁律

一个入口页 + 若干座各自独立的离线演练场。改这个仓库之前先读完本文件。

## 这个仓库是什么

- **入口页**（仓库根）：`index.html` + `assets/css/portal.css` + `assets/js/portal.js` + 生成的 `assets/js/manifest.js`。
  只做两件事：说清这里有哪些站，把访问者送进去（顺带按各站自己的进度显示「继续第 N 章」）。
  **保持简洁是硬要求**：大标题 + 副标题 + 一段简介 + 卡片，别再往里加板块（见 `DESIGN.md` 的 Do's and Don'ts）。
- **各座训练场**（`html5-lab/` `css-lab/` `js-lab/` `ts-lab/` `vue-lab/` `react-lab/` `tailwind-lab/`，以后会增加）：各自完整自洽的离线静态站，
  含 `assets/ content/ tools/ docs/ AGENTS.md DESIGN.md serve.py run.bat`。前四座并入时**一个字节都没改**；`vue-lab/`、`react-lab/`、`tailwind-lab/` 是并入后新建的第五、六、七座（同样自洽，只是不经过「字节保真搬运」这一步）。
- **合并是目录级的，不是引擎级的**：各站的引擎（各自的 `harness.js` / `sandbox.js` / `render.js` …）保持独立。
  它们已经各自演化出不同能力（HTML/CSS 判几何、TS 走真类型检查器、Vue/React/Tailwind 在沙箱里跑第三方运行时），强行统一是纯粹的回归风险。
- **入口页对「有几座站、都是什么领域」保持中立**：站名、目录名、语言列表、章节数一律不进 `index.html`，
  全部来自 `assets/js/manifest.js`。校验脚本会挡住写死。

## 运行

| 想做什么 | 命令 / 动作 |
|---|---|
| 在线看（正常用法） | https://naimiochan.github.io/LightHouse/ |
| 起本地服务 | 双击 `run.bat` → `http://127.0.0.1:8876/index.html?v=<令牌>` |
| 只打开某一座站（自带服务） | 进那座目录双击它的 `run.bat`（端口 8877–8884） |
| 完全离线、不起服务 | 双击任意 `index.html`（`file://`，每座站都支持） |

根 `serve.py` 把各座站放在**同一个源**上，入口页才读得到各站的 localStorage 进度。
它按请求的 `Referer` 认出请求来自哪座站（站名表从 `tools/labs.json` 读，不写死），
回一个以那座站名开头的 `/__whoami` 字符串——各站 `app.js` 里「你打开的是缓存旧版本」的检测依赖这个前缀，
**改 `serve.py` 时不许删**。

## 铁律

1. **无构建、无依赖、无 CDN**。`index.html` 一律 classic `<script src>` 顺序加载，**不许用 ES module**（`file://` 下白屏）。
   双击 `index.html` 与 `run.bat` 两条路都必须能跑。
2. **数字只有一个来源**。章节数、练习数、示例数由 `tools/labs.json`（文字）+ 各站 `content/*.js` 生成到
   `assets/js/manifest.js`，入口页只读它。**不许手改 `manifest.js`**，改完内容重跑 `node tools/build-manifest.mjs`。
3. **入口页只读**。不写 localStorage、不提供重置按钮；练习进度属于各座站。
4. **不许顺手统一各站的代码**。改 `html5-lab/assets/js/*` 时不要「顺便」把 `css-lab` 的同名文件改成一样。
5. **`* -text` 不许动**（根与各站 `.gitattributes`）。校验脚本里有对文件内容的精确匹配，CRLF 会让它们静默失效；
   `ts-lab/vendor/` 的第三方产物也一样，动一个字节就要重新核对体积。
6. **内容与引擎分离**：一章一个 `content/chNN-*.js` 文件，UMD 尾巴挂全局注册表（`H5LAB_CHAPTERS` 等）。
   改内容 schema 必须同时改契约（`docs/01-content-schema.md`）、校验器、渲染三处。
7. **`run.bat` 必须纯 ASCII**（cmd 按 GBK 解析，中文注释会破坏批处理）。
8. **中文文案**守 `anti-slop`：不写「值得注意的是」「综上所述」，不排比，不写总结式收尾。
9. **各座站的目录栏底部固定有这几样东西**：回入口页的「← LightHouse 目录」按钮、版权行之上的一行快速参考友链
   （`.side-ref`，指向 quickref.me 中文版里该站对应语言的备忘清单，`target="_blank"`）、一行 `© 2026 非茗 · Naimio`，
   以及该版权行尾部那个小号 GitHub 图标链接（`.gh-link`，指向 `https://github.com/NaimioChan/LightHouse`）
   （`app.js` 的 `sideFoot()` + `app.css` 的 `.side-foot` / `.side-ref` / `.gh-link`）。改动侧栏时别把它们删掉；
   入口页的版权与 GitHub 链接在 `index.html` 的 `.foot .credit`。
10. **手机版式所有站点一致，契约在 `docs/04-mobile-layout.md`**：≤900px 目录栏收成抽屉（顶栏 `#nav-btn` +
   `body.nav-open`）、顶栏只留「目录/进度/自动运行」、「重置进度」进抽屉、宽表包 `.tbl-wrap`、
   编辑器字号 ≥16px。改一座就得改其余所有站，改完各自跑 `tools/verify-ui.mjs`（含 390px 那一档）。

## 加一座新站

1. 新建 `<name>-lab/`，按既有骨架做完并独立验收通过（`AGENTS.md` → `DESIGN.md` → 内容契约 → 引擎 → 内容 → 校验）。
2. `tools/labs.json` 加一条（`key` / `dir` / `title` / `registry` / `accentToken` / `entry` / `progressKey` / `blurb` / `note`）。
3. `assets/css/portal.css` 与 `DESIGN.md` 里加它的识别色两条（深支要在纸白上过 WCAG AA 4.5:1）。
4. `node tools/build-manifest.mjs`，然后 `verify-manifest.mjs` 与 `verify-portal.mjs`。
5. 它要是需要服务端才能判题（比如 Rust），先读 `docs/03-languages-and-scale.md` 再决定形状。

## 改完必须跑

```bash
node tools/verify-manifest.mjs     # 清单与内容一致；入口页没写死任何一座站
node tools/verify-all.mjs          # 各站的 node 侧校验（内容契约、括号与引号配对、类型判题）
node tools/verify-portal.mjs       # 真浏览器：入口页与各站入口页、进度读取、资源无 404、file:// 直开
```

动过某座站的窄屏版式（`base.css` / `app.css` / `app.js` / `render.js` 的表格容器）后，还得在**那座目录**里跑
`node tools/verify-ui.mjs --fast`——各座站的移动端形态契约与验收点见 `docs/04-mobile-layout.md`。

改某一座站的内容后，还要在**那座目录**里跑它自己的验收（真浏览器行为校验，最权威）：

```bash
cd js-lab && node tools/verify-ui.mjs        # 或该站的 verify-browser.mjs / verify-pages.mjs
```

## 禁区

- 不要在根目录另写一套渲染引擎或判题内核——入口页不需要。
- 不要把 `ts-lab/vendor/`（12.3 MB）搬到根目录或做“共享”。
- 不要在 `index.html` 里写死站名、目录名、章节/练习数量或语言列表（一定会在下一次改动时过期）。
- 不要为了「看起来统一」而重排各站的目录结构；各站路径是它自己工具链的一部分（`serve.py`、`verify-*.mjs` 都按自身目录解析）。

## Agent 交接（Hermes 与 OpenCode 共用）

本仓库会被两个 agent 轮流改：本机 Hermes、本机 OpenCode。两边看不到对方的会话记录，共享状态落在 `docs/agent-log.md`。

1. **开工先读**：这份 `AGENTS.md`，再读 `docs/agent-log.md` 最近 5 条。顶部「当前占用」栏里挂着别人的条目，就先别动这个仓库。
2. **收工必写**：在 `docs/agent-log.md` 的「当前占用」栏下面追加一条（时间 / 执行者 / 任务 / 改动文件 / 验证结果 / 遗留项），照已有条目抄格式。
3. **提交带 trailer**：每条 commit 末尾两行，`Agent: hermes` 或 `Agent: opencode`，以及 `Verify: <跑过的校验命令与结果>`。`.githooks/post-commit` 会在缺失时提醒。
4. 新克隆要执行一次 `git config core.hooksPath .githooks`，hook 才生效。
5. 完整流程与工具名对照见共享技能 `project-handoff`（`~/.agents/skills/project-handoff/`）。

## Agent skills

### Issue tracker

Issue 与 spec 都是 GitHub Issues（`NaimioChan/LightHouse`），用 `gh` CLI 读写。见 `docs/agents/issue-tracker.md`。

### Triage labels

沿用默认五个状态标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。见 `docs/agents/triage-labels.md`。

### Domain docs

单上下文：根 `GLOSSARY.md` + `docs/adr/`，不存在就先别建，用到再写。见 `docs/agents/domain.md`。
