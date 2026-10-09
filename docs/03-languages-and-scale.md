# 03 · 换别的语言还带得动吗（纯静态能到哪一步）

入口页是纯静态站（GitHub Pages，没有后端、没有构建），这个形状还能撑多少座站、哪些语言能上、哪些必须配后端判题。
结论先写在这里，依据列在最后一节。

## 一句话结论

**能不能带，取决于「这门语言有没有一个能在浏览器里跑的求值器」。** 有，就照现有做法做（讲解 + 示例 + 练习 + 断言），
内容与引擎的模式完全不变；没有，就得给这座站单配一个瘦判题服务——内容仍然静态，只是判题走一次网络。

## 三档

| 档 | 语言 / 领域 | 判题怎么做 | 代价 |
|---|---|---|---|
| **能直接带** | Python、SQL（SQLite / PostgreSQL / DuckDB）、R、Ruby、PHP、Lua、C / C++、Java、C#、以及已有的 JS / TS / HTML / CSS | 浏览器里有真求值器（下面列了具体项目），照 ts-lab 的做法：把求值器放父页面主线程或 Worker，断言打在它的判断上 | 首屏几 MB 到几十 MB 的运行时要懒加载 + 进度条（ts-lab 那条「正在加载编译器」的提示已有先例）；仓库体积涨 |
| **能带，但判题沙箱要换一套** | Go、以及所有 WASM 运行时语言 | 同上，但**必须跑在 Worker 里**：WASM 里的死循环没法从 JS 打断，只能 `terminate()` 整个 Worker。JS/TS 现在那套「5 秒超时掐掉」在 WASM 里不成立 | 每次超时都要重建 Worker；线程特性（SharedArrayBuffer）需要 COOP/COEP 响应头，而 GitHub Pages 不能自定义响应头 → 别依赖线程 |
| **今天带不动，需要后端判题** | Rust；真实进程 / 线程 / 网络 / 部署 / 性能类内容；多文件工程 + 包管理（cargo / npm 那种） | 一个瘦判题服务：收源代码 → 跑容器 → 回结果。你自己的常驻机器（Tailscale 内网）或 Cloudflare 容器都行 | 站点从「纯静态」变成「静态 + 一个小 API」；要设计「服务不可用时怎么办」（例如降级成看答案 + 自查清单） |

Rust 单独说明，因为它最像「值得做但踩不到底」的那个：**rustc 没有可用的官方 WASM 构建**，公开的 Rust playground
（包括官方那条路）都是把源码发到服务端、在 Docker 沙箱里编译。有厂商做出来了——Leaning Tech 的 BrowserPod 3.0
能在浏览器里跑**未经修改的 Rust 程序**（连文件系统、子进程、网络都给了），但它的官方说明写着今天用户仍需要
**先把程序编译好、再把二进制放进 Pod**，「直接在浏览器里编译 Rust」是他们的后续计划。所以 Rust 站要么等，
要么走「静态内容 + 本地/远程判题服务」。

## 现成的浏览器求值器（写新站之前先查这一栏）

| 语言 | 项目 | 备注 |
|---|---|---|
| Python | Pyodide（CPython → WASM），带 NumPy / pandas / matplotlib | 最大的那几个运行时之一，首次加载慢、之后有缓存 |
| SQLite | sql.js | 体积小，教学最划算的一类 |
| PostgreSQL | PGlite | 真 Postgres，可以把数据持久化到 IndexedDB |
| DuckDB | DuckDB-Wasm | 分析型 SQL，能直接读 CSV / Parquet |
| R | WebR | 带绘图与数据框 |
| Ruby | ruby.wasm（CRuby） | 语义完整 |
| PHP | php-wasm（WordPress Playground 那套引擎） | — |
| C / C++ | clang / clang++ 编到浏览器（browsercc 这类打包） | 能不能装工具链要按项目实测 |
| Java | CheerpJ（OpenJDK） | **专有软件**，免费社区版通常要求从它的 CDN 加载——与本仓库「无 CDN」铁律冲突，要用得先拍板 |
| C# | Roslyn 跑在 .NET 的 WASM 运行时上 | 编译期判题可以照抄 ts-lab 的思路 |
| Go | 官方 gc 编译器可以编到 WASM（`GOOS=js GOARCH=wasm`），社区有纯静态站实现（内存文件系统） | 官方的 play.golang.org 仍走服务端；纯静态这条更重、更慢 |
| Rust | 无官方 WASM 构建；BrowserPod 只能跑预编译二进制 | 见上一节 |

## 这个形状的结构性变化

- **加站不用改入口页**：`tools/labs.json` 加一条 + 新目录，入口页自动多一张卡。站名与领域不写死（校验脚本会挡）。
- **分组字段仍未建**：现在到了七座（超过「六座以上」那条线），但入口页一屏排得下、也没出现按领域分段的真实需求；
  真需要时在 `labs.json` 里加 `group`（语言 / 数据库 / 工具链）让入口页分段显示，现在加就是没人用的代码。
- **要加「需要后端判题」的站时，再加 `judge: "remote"` 这类字段**，让卡片能标出「这座站需要网络才能判题」。
  同理，现在别提前建。
- **仓库体积**：现在约 18.3 MB（ts-lab 的编译器 12.1 MB 占大头）。再来两三座带运行时的站，仓库会到百 MB 级。
  GitHub 的单文件上限 100 MB、仓库软上限 1 GB，物理上够；但克隆体验会变差，届时可以考虑把大运行时放进
  Release 附件或 CDN（后两者都要单独决策，因为「无 CDN」是铁律）。
- **本地/离线优势会稀释**：需要后端判题的站，`file://` 双击这条路走不通。可以在卡片上标出来，不要假装还是全离线。

## 依据（2026-10 查证）

- Pyodide / sql.js / PGlite / DuckDB-Wasm / WebR / ruby.wasm / php-wasm / browsercc / CheerpJ / .NET wasm + Roslyn
  这些运行时的用途与体积特性：见 dataslope 项目与其文档、以及一篇逐个列举这些浏览器内运行时的综述（含
  「首屏几 MB 到几十 MB」「没有系统访问、内存 32 位上限、线程需要隔离响应头」这些限制）。
- Go 编译器编到 WASM 并做纯静态 playground：`Yeicor/static-go-playground`、`ccbrown/wasm-go-playground`；
  官方 playground 与 Boot.dev 的 playground 仍是服务端编译。
- Rust：Rust 官方论坛「Compiling rustc to the web」讨论（现有实现都依赖服务端 Docker）；Leaning Tech
  「Running any Rust application in the browser with BrowserPod 3.0」——今日需预编译二进制，浏览器内编译列在后续计划。
