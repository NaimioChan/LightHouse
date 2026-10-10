# TypeScript 训练场

离线静态的 TypeScript 交互教学站：读一段讲解 → 看一段**当场判题的示例** → 自己写一段并当场检验。
没有后端、没有构建步骤、没有网络请求，双击 `index.html` 就能用。

**12 章 / 77 个当场判题的示例 / 62 道练习 / 516 条断言 / 124 条提示**（数字抄自 `verify-content.mjs` 的输出）。

教的是**日常写 TS 会遇到的东西**，不是类型体操：
推断与注解、对象与函数类型、联合与收窄、数组与元组、接口、泛型、工具类型、类、
类型守卫与断言、枚举与运行时的类型、strict 报错怎么读、异步与 Promise 的类型。

## 怎么跑

- **双击 `run.bat`**（推荐）：起一个本地静态服务并打开浏览器。页面上挂了一条保活连接，
  **关掉浏览器页面，命令行窗口会自己跟着关**。
  需要 python；没有 python 时它会退回到直接打开 `index.html`。
- **直接双击 `index.html`**：纯 `file://` 模式，功能完整（这也是每次验收都要走一遍的路径）。

判题界面：编辑器与右边一块**结果面板**并排，面板三个页签——
**诊断**（类型错误的错误码 + 行号 + 中文说明）、**编译产物**（类型被擦掉之后的 JS）、
**运行输出**（编译产物真的跑一遍的控制台输出）。停手一秒自动判题，也可以按 `Ctrl + Enter`。

## 判题是怎么做的

用户写的是 `.ts`，判题核心是**真的 TypeScript 编译器**（`typescript@5.9.2`，Apache-2.0，见 `vendor/`），
跑在页面主线程里：

- 类型检查走 `ts.createProgram` + `ts.getPreEmitDiagnostics`，lib 的 `SourceFile` 跨 Program 复用、
  传 `oldProgram` 做增量：首个 Program 约 240 ms，之后每次判题 2–8 ms。
- 「编译产物」是**同一个 Program 的 emit**（不是另做一次 transpile），所以它就是这台编译器真会给你的东西：
  `const enum` 成员会被内联、`useDefineForClassFields` 随 target 走、改 target 产物立刻变。
- 类型断言用 `ts.TypeChecker`：双向可赋值判等价（`eqType`，且专抓藏在里面的 `any`）、字面量严格等价（`eqTypeExact`）、
  赋值方向（`assignableTo`）、属性与静态成员路径（`Box.size`、`Counter.total`）——失败信息是「期望 X，实际 Y」。
- 需要真的跑一遍时，只用**编译产物**，送进 `sandbox="allow-scripts"` 的 iframe（opaque origin，没有同源权限），
  控制台输出经 `postMessage` 回传。用户手写的 TS 从不 `eval`。
- 诊断文案是中文（`vendor/diag-zh.js`，加载失败会自动退回英文）。

## 验证

```bash
node tools/verify-content.mjs      # 结构：字段、id、tests ≥2、hints ≥1、starter ≠ solution、index.html 清单…
node tools/verify-judge.mjs        # 判题内核自己的单测
node tools/verify-types.mjs        # 内容行为（node + 真编译器 + vm 运行器）
node tools/verify-browser.mjs      # 真浏览器：http 与 file:// 两条路各跑一遍全量自测
node tools/verify-pages.mjs        # 逐章渲染检查（数量与内容对账）
node tools/verify-ui.mjs           # 真实输入管线 + 三档视口排版（--fast 跳过全量自测）
node tools/verify-quit.mjs         # 关窗即退
node tools/verify-fresh.mjs        # 每次进站都拿到最新代码（先毒化缓存再验）
node tools/verify-pair.mjs         # 括号与引号配对逻辑
```

交付时的实测输出（2026-10，Windows 11 + 无头 Edge）：

| 层 | 结果 |
|---|---|
| `verify-content` | 12 章 / 77 示例 / 62 练习 / 516 断言 / 124 提示，结构校验通过 |
| `verify-judge` | 44/44 项通过（等价判定、字面量拓宽、`any` 检测、诊断辅助、运行器、增量复用） |
| `verify-types` | 示例 77/77 全过；练习 62 道：参考解全过 62、起始代码至少挂一条 62（3.8s） |
| `verify-browser` | http：77/77 · 62/62 · 62/62（118s，编译器就绪 187 ms）；file:// 那一章 4/4 · 5/5 · 5/5（编译器就绪 256 ms） |
| `verify-pages` | 134 项全过（逐章 DOM 与内容对账） |
| `verify-ui --fast` | 34 项全过：真按键输入、括号与引号配对、失败信息「期望/实际」、进度持久化、2000/1200/760 三档视口排版、file:// 直开 |
| `verify-quit` / `verify-fresh` / `verify-pair` | 全过（关窗即退、进站拿新代码、配对 82 项） |

## 目录

```
AGENTS.md           项目铁律（栈、命令、架构铁律、禁区）——动这个仓库前先读它
index.html          入口（classic <script> 顺序加载，内容清单也在这里）
assets/js/          format.js 值格式化 · judge.js 判题内核 · sandbox.js + harness.js 运行沙箱
                    highlight.js 高亮 · pair.js 括号与引号配对 · render.js 渲染 · app.js 外壳
assets/css/         base.css 设计令牌 · app.css 布局与组件
content/            一章一个文件（教学内容全在这里，UMD 尾巴挂到 TSLAB_CHAPTERS）
docs/               01-content-schema.md 内容契约（改 schema 要同时改它、校验器、判题内核、渲染）
vendor/             typescript.js + libs-embed.js + diag-zh.js（构建期产物，见 vendor/README.md）
tools/              校验脚本、lib/ 公共件、build-vendor.mjs
run.bat / serve.py  本地服务（关窗即退）
```

设计令牌（色值、字体、字号）以 `DESIGN.md` 为唯一来源，`assets/css/base.css` 必须与之同步。

## 已知限制

- 单文件判题：一次只判一个 `.ts` 文件，所以真正的 `import` 教不了（模块章节只讲类型导出与语法）。
- 运行时练习跑在空白沙箱里：没有可用的 DOM，`localStorage` 会抛错，网络请求被拒。
- 死循环会被 5 秒超时掐掉；异步代码安静 30 ms 收工、最长等 1.5 秒，更慢的延迟逻辑判不到。
- 编译器要 12.3 MB 的 vendor，首次进站要加载一次（实测 http 下约 170–420 ms，`file://` 下约 270 ms）。
  它是首屏之后懒加载的，所以不影响页面先画出来。
