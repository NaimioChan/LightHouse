# 01 · 这次合并做了什么，没做什么

这四座训练场原先各自一个仓库、各自一份 `serve.py` / `run.bat` / `README.md`，彼此不认识。合并成 LightHouse 后
形状是「一个门厅 + 四间屋」，这次改动只在门厅层面，屋子里一个字节都没动。

## 目录级合并，不是引擎级合并

| 层面 | 这次是否合并 | 理由 |
|---|---|---|
| 导航入口 | 合并：根 `index.html` 一张目录页 | 这是本次的目的：一个入口进四座站 |
| 服务进程 | 合并：根 `serve.py` 一个端口服务全部 | 四座站同源之后，入口页才读得到各站的 localStorage 进度 |
| 进度记录 | 不合并：四座站各自一个 localStorage 键 | 键名与结构是各站自己的（`jslab.v1.passed` 等），入口页只读不写 |
| 判题内核 | 不合并：各站保留 `sandbox.js` / `harness.js` | 四座站的执行模型已经分叉：HTML/CSS 判真实渲染的几何与声明，TS 判父页面主线程上真实类型检查器的诊断 |
| 内容契约 | 不合并：各站自己一份 `docs/01-content-schema.md` | 字段集不同（`needsDom`、`full` 模式、两阶段 `tests`、`expectType` 等） |
| 校验工具 | 不合并，但加了一层汇总入口 | 各站 `verify-*.mjs` 保持原样；根的 `tools/verify-all.mjs` 按站调用它们 |

代价是代码重复（四份 `highlight.js`、四份编辑器逻辑），换来的是四座站能各自继续演进，
且这次合并对「已经验收通过的 241 个练习」零回归风险——依据是并入时逐字节比对（`diff -r`）全部一致。

要真做引擎级统一，属于另一件事：先抽出公共内核与契约，再逐站迁移并重跑各站的真浏览器验收。
在那之前，任何「顺手统一」的改动都算破坏铁律第 4 条。

## 端口与入口

| 服务 | 端口 | 说明 |
|---|---|---|
| 根 `serve.py` | 8876 | 入口页 + 四座站在同一源：`/html5-lab/` `/css-lab/` `/js-lab/` `/ts-lab/` |
| `html5-lab/serve.py` | 8878 | 单站启动（自带令牌入口、SSE 保活、关窗即退） |
| `ts-lab/serve.py` | 8879 | 同上 |
| `css-lab/serve.py` | 8880 | 同上 |
| `js-lab/serve.py` | 8877 | 同上 |

端口都从指定值往后找空闲的，所以并行开着也不会互相抢。

## `/__whoami` 与旧缓存检测

四座站的 `app.js` 里都有一段检测：页面挂了保活连接就正常，否则十几秒后问一次 `/__whoami`，
如果响应以「本站名 serve.py」开头，就说明「你打开的是浏览器缓存里的旧版本」，插一条横幅提示强制刷新。
合并后页面由根服务发出，根服务于是按请求的 `Referer` 认出请求属于哪座站，回
`css-lab serve.py (LightHouse 入口服务)` 这样的字符串——各站那段逻辑不用改一个字。

## 入口页的数字从哪来

`tools/labs.json` 存文字（标题、一句话简介、前置、学习点、颜色令牌名），各站 `content/*.js` 存事实
（章节 id 与标题、每章的练习 id、示例与断言条数）。`tools/build-manifest.mjs` 把两者合成
`assets/js/manifest.js`，入口页只读这一份。数字对不上时 `tools/verify-manifest.mjs` 会当场报出来。

## 再加一座训练场要做什么

1. 新建目录 `<name>-lab/`，按既有骨架（`AGENTS.md` → `DESIGN.md` → 内容契约 → 引擎 → 内容 → 校验）做完，独立验收通过。
2. `tools/labs.json` 追加一条：`key` / `dir` / `title` / `registry`（它挂的全局注册表名）/ `accentToken` /
   `entry` / `progressKey` / `prereq` / `want` / `blurb` / `learn` / `note`。
3. `assets/css/portal.css` 里加它的识别色两个变量（浅支 + 深支，深支要在纸白上过 WCAG AA 4.5:1），
   `DESIGN.md` 的 `colors` 与 `card-rule-*` / `card-button-*` 组件同步加。
4. `node tools/build-manifest.mjs`，然后 `node tools/verify-manifest.mjs` 与 `node tools/verify-portal.mjs`。
5. 根 `serve.py` 不用改：它的站名识别表（`/__whoami` 靠它）与启动时打印的目录清单都是从 `tools/labs.json` 读的。
6. 站数多起来之后（大约六座以上）再考虑在 `tools/labs.json` 里加一个 `group` 字段按领域分组、入口页分组显示；
   现在只有一批站，加了就是没人用的代码，**别提前建**。
7. 新站的判题若需要服务端（例如 Rust），形状就不一样了：先读 `docs/03-languages-and-scale.md`。
