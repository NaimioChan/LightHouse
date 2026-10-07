# AGENTS.md — LightHouse 项目铁律

四座前端训练场（HTML5 / CSS / JS / TypeScript）合并成一个仓库后的工作规则。改这个仓库之前先读完本文件。

## 这个仓库是什么

- **入口页**（仓库根）：`index.html` + `assets/css/portal.css` + `assets/js/portal.js` + 生成的 `assets/js/manifest.js`。
  只做两件事：说清这里有哪四座站，把访问者送进去（顺带按各站自己的进度显示「继续第 N 章」）。
  **保持简洁是硬要求**：大标题 + 副标题 + 一段简介 + 四张卡，别再往里加板块（见 `DESIGN.md` 的 Do's and Don'ts）。
- **四座训练场**（`html5-lab/` `css-lab/` `js-lab/` `ts-lab/`）：各自完整自洽的离线静态站，
  含 `assets/ content/ tools/ docs/ AGENTS.md DESIGN.md serve.py run.bat`。并入时**一个字节都没改**。
- **合并是目录级的，不是引擎级的**：四座站的引擎（各自的 `harness.js` / `sandbox.js` / `render.js` …）保持独立。
  它们已经各自演化出不同能力（HTML/CSS 判几何、TS 走真类型检查器），强行统一是纯粹的回归风险。

## 运行

| 想做什么 | 命令 / 动作 |
|---|---|
| 打开入口页与四座站（推荐） | 双击 `run.bat` → `http://127.0.0.1:8876/index.html?v=<令牌>` |
| 只打开某一座站（自带服务） | 进那座目录双击它的 `run.bat`（端口 8877–8880） |
| 完全离线、不起服务 | 双击任意 `index.html`（`file://`，四座站都支持） |

根 `serve.py` 把四座站放在**同一个源**上，入口页才读得到各站的 localStorage 进度。
它按请求的 `Referer` 认出请求来自哪座站，回一个以那座站名开头的 `/__whoami` 字符串——
各站 `app.js` 里「你打开的是缓存旧版本」的检测依赖这个前缀，**改 `serve.py` 时不许删**。

## 铁律

1. **无构建、无依赖、无 CDN**。`index.html` 一律 classic `<script src>` 顺序加载，**不许用 ES module**（`file://` 下白屏）。
   双击 `index.html` 与 `run.bat` 两条路都必须能跑。
2. **数字只有一个来源**。章节数、练习数、示例数由 `tools/labs.json`（文字）+ 各站 `content/*.js` 生成到
   `assets/js/manifest.js`，入口页只读它。**不许手改 `manifest.js`**，改完内容重跑 `node tools/build-manifest.mjs`。
3. **入口页只读**。不写 localStorage、不提供重置按钮；练习进度属于各座站。
4. **不许顺手统一四座站的代码**。改 `html5-lab/assets/js/*` 时不要「顺便」把 `css-lab` 的同名文件改成一样。
5. **`* -text` 不许动**（根与各站 `.gitattributes`）。校验脚本里有对文件内容的精确匹配，CRLF 会让它们静默失效；
   `ts-lab/vendor/` 的第三方产物也一样，动一个字节就要重新核对体积。
6. **内容与引擎分离**：一章一个 `content/chNN-*.js` 文件，UMD 尾巴挂全局注册表（`H5LAB_CHAPTERS` 等）。
   改内容 schema 必须同时改契约（`docs/01-content-schema.md`）、校验器、渲染三处。
7. **`run.bat` 必须纯 ASCII**（cmd 按 GBK 解析，中文注释会破坏批处理）。
8. **中文文案**守 `anti-slop`：不写「值得注意的是」「综上所述」，不排比，不写总结式收尾。

## 改完必须跑

```bash
node tools/verify-manifest.mjs     # 清单与内容一致（重算一遍逐字节比对）
node tools/verify-all.mjs          # 四座站各自的 node 侧校验（内容契约、括号配对、类型判题）
node tools/verify-portal.mjs       # 真浏览器：入口页与四座站的入口页、进度读取、资源无 404
```

改某一座站的内容后，还要在**那座目录**里跑它自己的验收（真浏览器行为校验，最权威）：

```bash
cd js-lab && node tools/verify-ui.mjs        # 或该站的 verify-browser.mjs / verify-pages.mjs
```

## 禁区

- 不要在根目录另写一套渲染引擎或判题内核——入口页不需要。
- 不要把 `ts-lab/vendor/`（12.3 MB）搬到根目录或做“共享”。
- 不要在 `index.html` 里写死章节/练习数量（一定会在下一次改内容时过期）。
- 不要为了「看起来统一」而重排四座站的目录结构；各站路径是它自己工具链的一部分（`serve.py`、`verify-*.mjs` 都按自身目录解析）。
