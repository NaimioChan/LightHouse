# 02 · 校验分层

一个静态站最怕的是「看着能跑」：内容里有错字没人管、示例输出早就不对了、改了一处 schema 之后某章悄悄不渲染。
所以数字与行为都交给脚本，不靠肉眼。合并后分三层，越往下越贵、越权威。

## 第一层：各站的内容契约校验（node，秒级）

```bash
node tools/verify-all.mjs          # 一次跑完各站里 node 侧的那几支（站列表从 labs.json 读）
node tools/verify-all.mjs --lab vue   # 只跑一座
```

覆盖：章节/段落/练习的字段完整性；参考答案必须让全部断言通过；起始代码必须至少挂一条断言
（否则这道题抓不住空实现）；示例的 `expect` 与真实执行输出逐字比对；`ts-lab` 另跑类型判题与编译器自检；
`vue-lab` 另跑 `verify-compile.mjs`（SFC 改写内核的单测：import 别名方向、模板-only、反引号禁令）。
哪座站没有某支脚本就跳过哪支。

## 第二层：入口页与清单（node + 无头浏览器）

```bash
node tools/verify-manifest.mjs   # 重新生成清单，与提交的 assets/js/manifest.js 逐字节比对
node tools/verify-portal.mjs     # 起根 serve.py + 无头 Edge（CDP）：入口页与各座站入口页
```

`verify-portal.mjs` 检查的东西：入口页的大标题 / 副标题 / 简介长度（≤140 字）与断行（宽屏两行、每行用满）、
页脚版权行与 GitHub 图标链接、每张卡片的数字与一句话、卡片顺序与入口链接、三档宽度下的对齐与列数；各座站入口页从根服务取到后，
侧栏章节数与清单一致、编辑器有起始代码、目录栏底部有回入口页的按钮、版权行与 GitHub 图标链接、
版权行之上的快速参考友链（href 与该站语言对应、`target="_blank"`、占位非零）、行内代码里的星号没被当成强调标记
（js-lab 第 2 章的 `+ - * / %` 与 `**`）、没有未捕获错误；全站资源没有 404；读 localStorage 的进度分支能正确显示
「已通过 N/M」与「继续第 N 章」（测试前备份、测试后还原原有的进度键）；最后再走一遍 `file://` 直开。

## 第三层：各站自己的真浏览器行为验收（最权威）

改过某一座站的内容或引擎后，必须在那座目录里跑它自己的验收脚本：

| 站 | 命令 | 覆盖 |
|---|---|---|
| `js-lab` | `node tools/verify-ui.mjs` | 真实输入管线打字 → 自动运行 → 断言状态、进度、`file://` 直开 |
| `html5-lab` | `node tools/verify-browser.mjs`、`node tools/verify-pages.mjs` | 真渲染结果、逐章渲染对账、示例自检 |
| `css-lab` | `node tools/verify-browser.mjs`、`node tools/verify-pages.mjs` | 几何断言、两阶段练习卡、媒体查询重估 |
| `ts-lab` | `node tools/verify-judge.mjs`、`node tools/verify-types.mjs`、`node tools/verify-pages.mjs` | 真类型诊断、等价判定、逐章编译产物 |
| `vue-lab` | `node tools/verify-compile.mjs`、`node tools/verify-browser.mjs`、`node tools/verify-ui.mjs`、`node tools/verify-pages.mjs` | SFC 改写内核单测、两条路各跑一遍全部练习、真实按键与四档视口、逐章渲染对账 |
| `react-lab` | `node tools/verify-compile.mjs`、`node tools/verify-browser.mjs`、`node tools/verify-ui.mjs`、`node tools/verify-pages.mjs`、`node tools/verify-vendor.mjs` | React 运行时自检、两条路各跑一遍全部练习、真实按键与四档视口、逐章渲染对账、vendor 体积与哈希 |
| `tailwind-lab` | `node tools/verify-browser.mjs`、`node tools/verify-ui.mjs`、`node tools/verify-pages.mjs`、`node tools/verify-vendor.mjs`、`node tools/verify-pair.mjs` | 两条路各跑一遍全部练习（含等编译器生成样式）、真实按键与三档视口、逐章渲染对账、vendor 体积与哈希、括号配对纯逻辑 |

`vue-lab` 的 `verify-browser.mjs` 会把每个练习跑两遍（参考答案必须全过、起始代码必须至少挂一条），
`http` 与 `file://` 各一轮 —— 第五座站的执行模型是「沙箱里跑第三方运行时」，
`file://` 那条路尤其容易假绿（vendor 的读法只要不对，整站会静默不判题）。`tailwind-lab` 同理，
而且它每个预览帧里要再内联求值一次编译器，`file://` 下最容易暴露「源码字符串包没读对」。

这几支脚本慢（几分钟），且要起无头 Edge 与 http.server，所以不放进每轮迭代。

其中各站的 `verify-ui.mjs` 除了三档桌面视口（2000/1200/760），还有一档 390px 手机竖屏：
目录栏是否收成抽屉、顶栏是否还粘在顶部、有没有横向溢出、编辑器字号是否 ≥16px、抽屉能不能真点开又自动收起。
根 `tools/verify-portal.mjs` 同样带 390px 一档。改窄屏版式前先读 `docs/04-mobile-layout.md`。

## CDP 验收的三条硬规矩（踩过）

1. 前台 `terminal` 超时超过 600s 会被提升为后台进程，随后带 `stdin is not a tty` 立刻死掉——脚本输出要重定向到 `.cache/`。
   真要跑超过 10 分钟的那几支（`verify-ui.mjs` 的全量档、`verify-browser.mjs`），得用带 PTY 的后台任务
   （Hermes `terminal` 的 `background=true` + `pty=true`，不带 PTY 的后台任务同样立刻 `stdin is not a tty` 死掉）；
   PTY 下再重定向输出会变成 `stdout is not a tty`，日志从进程输出里取，别写进命令行。
2. `Page.captureScreenshot` 在隐藏标签页会一直挂着不报错，截图前先 `Page.bringToFront`，并把截图失败降级为警告。
3. 需要真实键盘行为时用 `Input.dispatchKeyEvent`（`type: 'keyDown'` + `text`）；`Input.insertText` 不经过 keydown，
   拿它验括号配对是假绿。

## 这次合并用到的对账

并入四个训练场时对每一步都做了机器比对，而不是「看起来一样」：

| 检查 | 命令 | 结果 |
|---|---|---|
| 四个目录逐字节一致 | `diff -r --brief -x .git -x .cache <原目录> LightHouse/<目录>` | 四座全部「字节一致」 |
| 内容规模与各站自报一致 | 各站 `node tools/verify-content.mjs` 与 `node tools/build-manifest.mjs` | 14/12/12/12 章、61/58/60/62 练习、52/50/36/77 示例，两边完全吻合 |
| 设计令牌无拼写/对比度问题 | `npx -y -p @google/design.md designmd lint DESIGN.md` | 0 errors 0 warnings |
| 入口页在三种宽度下对齐 | `node tools/verify-portal.mjs` | 101 项全过：2000/1200px 两列、760px 一列，同列卡片左右边缘极差 0px，同一行按钮底边齐平，三种宽度都没有横向溢出；含 `file://` 直开的一轮 |
| 入口页对站数与领域保持中立 | `node tools/verify-manifest.mjs`、`verify-portal.mjs` | 大标题/副标题/卡片内容里不出现任何一座站的名字、目录名、语言列表与「前端/四个」这类限定 |
| 四座站并入后仍各自通过自己的校验 | `node tools/verify-all.mjs --fast` | 10 支（内容契约、括号配对、类型判题与编译器自检）全过 |

## 第五座站（vue-lab）接入后的对账

`vue-lab` 不是搬运进来的，是并入后新写的，所以它走的是「加站清单」那五步（见根 `AGENTS.md`），
没有「逐字节搬运」这一栏。接入时实际跑过的：

| 检查 | 命令 | 结果 |
|---|---|---|
| 内容结构 | `vue-lab/node tools/verify-content.mjs` | 12 章 / 48 练习 / 48 示例 / 428 断言 |
| SFC 改写内核 | `vue-lab/node tools/verify-compile.mjs` | 22 项全过（含「内核函数体里不许有反引号」） |
| 两条路各跑一遍全部练习 | `vue-lab/node tools/verify-browser.mjs` | http 与 `file://` 都是 示例 48/48、参考答案 48/48、起始代码被抓 48/48 |
| 真实按键与四档视口 | `vue-lab/node tools/verify-ui.mjs --fast` | 全过（含 390px 抽屉与顶栏粘住那条） |
| 各站 node 侧校验一起跑 | `node tools/verify-all.mjs` | 18 支全过（五座站） |
| 清单与门户 | `node tools/build-manifest.mjs` → `verify-manifest.mjs` → `verify-portal.mjs` | 66 章 / 305 练习；门户全过（含 vue-lab 的星号与 390px 两项） |
| 设计令牌 | `designmd lint`（根与 `vue-lab/DESIGN.md`） | 两处都 0 errors 0 warnings |

## 第六座站（react-lab）接入后的对账

`react-lab` 同样不是搬运进来的，是并入后新写的，走「加站清单」那五步。接入时实际跑过的：

| 检查 | 命令 | 结果 |
|---|---|---|
| 内容结构 | `react-lab/node tools/verify-content.mjs` | 12 章 / 48 练习 / 38 示例 / 327 断言（含示例断言） |
| 括号配对 | `react-lab/node tools/verify-pair.mjs` | 全过 |
| React 运行时自检 | `react-lab/node tools/verify-compile.mjs`、`verify-vendor.mjs` | 全过；vendor 体积与 sha256 逐字节核对（`react19.iife.min.js` 224,264 B、`react19-src.js` 229,048 B） |
| 两条路各跑一遍全部练习 | `react-lab/node tools/verify-browser.mjs` | http 与 `file://` 都是 示例 38/38、参考答案 48/48、起始代码被抓 48/48 |
| 真实按键与四档视口 | `react-lab/node tools/verify-ui.mjs` | 全过（含 390px 抽屉、真实按键管线、`file://` 直开、完整自检） |
| 关窗即退 | `react-lab/node tools/verify-quit.mjs` | 全过 |
| 各站 node 侧校验一起跑 | `node tools/verify-all.mjs` | 22 支全过（六座站） |
| 清单与门户 | `node tools/build-manifest.mjs` → `verify-manifest.mjs` → `verify-portal.mjs` | 78 章 / 353 练习；门户 131 项全过（含 react-lab 卡片、侧栏与 390px 抽屉、页脚与各站版权行的 GitHub 图标链接） |
| 设计令牌 | `designmd lint`（根与 `react-lab/DESIGN.md`） | 两处都 0 errors 0 warnings |

第六座站落地时补的一个跨站修法：五座老站的 `serve.py` 在 Windows 上按控制台代码页（GBK）编码 stdout，
被管道接走就是乱码，各自的 `verify-quit.mjs` 按 UTF-8 读会认不出「页面已关闭」。这次一并把六座站的 stdout/stderr
都 `reconfigure(encoding='utf-8')`，`verify-all.mjs` 才从「5 支失败」回到 22 支全过。

## 第七座站（tailwind-lab）接入后的对账

`tailwind-lab` 与 `react-lab` 一样是并入后新写的。接入时实际跑过的：

| 检查 | 命令 | 结果 |
|---|---|---|
| 内容结构 | `tailwind-lab/node tools/verify-content.mjs` | 8 章 / 33 练习 / 9 示例 / 131 断言（含示例断言） |
| 括号配对 | `tailwind-lab/node tools/verify-pair.mjs` | 全过 |
| vendor 记账 | `tailwind-lab/node tools/verify-vendor.mjs` | 全过；体积与 sha256 逐字节核对（`tailwind.global.js` 282,289 B、`tailwind-src.js` 299,488 B），且字符串包里嵌的正是产物源码、无未转义的 `</script` |
| 两条路各跑一遍全部练习 | `tailwind-lab/node tools/verify-browser.mjs` | http 与 `file://` 都是 示例自检 9/9、参考答案 33/33、起始代码被抓 33/33 |
| 真实按键与三档视口 | `tailwind-lab/node tools/verify-ui.mjs`（不带 `--fast`） | 54 项全过：全量自测 示例 9/9 · 参考解 33/33 · 起始代码被抓 33/33（166s），另含 390px 抽屉、真实按键管线、`file://` 直开 |
| 关窗即退 | `tailwind-lab/node tools/verify-quit.mjs` | 全过 |
| 各站 node 侧校验一起跑 | `node tools/verify-all.mjs` | 全部通过（七座站） |
| 清单与门户 | `node tools/build-manifest.mjs` → `verify-manifest.mjs` → `verify-portal.mjs` | 87 章 / 391 练习；门户全过（含 tailwind-lab 卡片、侧栏与 390px 抽屉） |
| 设计令牌 | `designmd lint`（根与 `tailwind-lab/DESIGN.md`） | 两处都 0 errors 0 warnings |

`html5-lab` 第 13 章（无障碍）落地时补的：`verify-browser.mjs` 加了逐章报告输出，`assets/js/app.js` 的
`selfTest` 增强；`verify-content` 与 `verify-ui` 同步。`verify-all.mjs` 的脚本清单这次加入了 `verify-vendor.mjs`，
让 React 与 Tailwind 两座站的 vendor 体积/哈希账也进汇总校验（缺这支脚本的站自动跳过）。

这一章落地时只做了 DOM 属性断言，缺一层「浏览器到底怎么理解」的核对（当时记为遗留）。随后的交叉核对
（2026-10-09）把五个参考解单独放进一个探针页，用 CDP 的 `Accessibility.getPartialAXTree` 读浏览器自己算出的
无障碍树：图标按钮 `role=button` / `name=「搜索」`，里面的 `svg` 已 `ignored`；`section[aria-labelledby]`
变成 `role=region` / `name=「本周安排」`（名字取自可见的 `h2`，不是另写的一句）；`label[for]` 配 `input[id]`
让输入框 `role=textbox` / `name=「邮箱」`（占位符没被当名字）；`.status` 上读到 `live=polite`、`atomic=true`；
`.divider` 整块 `ignored`，旁边的正文照常暴露。这仍不是真读屏软件的人工会话核对，但比只断言属性多走了一层。
复现方式：探针页放这五段参考解，`DOM.getDocument` → `DOM.querySelector` → `DOM.describeNode` 拿 backendNodeId，
再 `Accessibility.getPartialAXTree` 读 role / name / properties（live、atomic），看 `ignored` 判断是否被藏起来。

`tailwind-lab` 与其余各站的一处不同：每个预览帧里要内联一份 Tailwind 浏览器编译器（源码字符串包在
`assets/js/preview.js` 里拼进文档），样式异步生成。`assets/js/harness.js` 的 `waitTailwind()` 轮询 `<head>`
末尾那个**无 `type`** 的 `<style>`，有内容了才跑断言；这条等待是判题成立的前提，别删（详见
`tailwind-lab/AGENTS.md` 铁律 6）。

## 目录栏的快速参考友链

各座训练场的目录栏底部、版权行之上有一行「快速参考」外链（`.side-ref`），指向
[quickref.me](https://quickref.me/zh-CN/index.html) 中文版里该站对应语言的备忘清单。这是纯外链：对方站点
改版或断网只影响这一行能不能点开，各站自己的功能与判题都不依赖它。URL 写死在每座站的
`assets/js/app.js`（`sideFoot()`）里，`tools/verify-portal.mjs` 顶部的 `QUICKREF` 表里再记一份用来对账
（静态站没有构建步骤，两处必须一起改）。

| 站 | 链接 |
|---|---|
| html5-lab | `https://quickref.me/zh-CN/docs/html.html` |
| css-lab | `https://quickref.me/zh-CN/docs/css.html` |
| js-lab | `https://quickref.me/zh-CN/docs/javascript.html` |
| ts-lab | `https://quickref.me/zh-CN/docs/typescript.html` |
| vue-lab | `https://quickref.me/zh-CN/docs/vue.html` |
| react-lab | `https://quickref.me/zh-CN/docs/react.html` |
| tailwind-lab | `https://quickref.me/zh-CN/docs/tailwindcss.html` |

| 检查 | 命令 | 结果 |
|---|---|---|
| 七个 URL 当天可达、且是中文页 | `curl` 逐个取一次 | 七个都 200（标题形如「HTML 备忘清单」），2026-10-09 实测 |
| 侧栏友链的 href 与该站语言对应、新窗口打开、占位非零 | `node tools/verify-portal.mjs` | 185 项全过（比补这行之前多 7 项，每座站一条） |
| 侧栏版式与 390px 抽屉没被这行挤坏 | 七座各自的 `node tools/verify-ui.mjs`（六座 `--fast`，tailwind 跑全量） | html5 / css 54 项、js 45 项、ts / vue / react 各自全过、tailwind 54 项（含全量自测） |
| 入口页截图 | `node tools/verify-portal.mjs --shots` | 截图改成整页（`Page.captureScreenshot` 带 `captureBeyondViewport`），`docs/screenshot-portal*.png` 重截，七张卡与页脚都进图 |

`verify-portal.mjs` 的截图以前只截视口，入口页长到七张卡之后最后一张进不了图（README 拿这两张当门面）。
现在按 `Page.getLayoutMetrics` 的内容尺寸整页截，宽屏是两列、窄屏是一列，两张都是完整页面。
