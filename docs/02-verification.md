# 02 · 校验分层

一个静态站最怕的是「看着能跑」：内容里有错字没人管、示例输出早就不对了、改了一处 schema 之后某章悄悄不渲染。
所以数字与行为都交给脚本，不靠肉眼。合并后分三层，越往下越贵、越权威。

## 第一层：各站的内容契约校验（node，秒级）

```bash
for d in html5-lab css-lab js-lab ts-lab; do (cd $d && node tools/verify-content.mjs); done
# 或一次跑完全部站里 node 侧的那几个：
node tools/verify-all.mjs
```

覆盖：章节/段落/练习的字段完整性；参考答案必须让全部断言通过；起始代码必须至少挂一条断言
（否则这道题抓不住空实现）；示例的 `expect` 与真实执行输出逐字比对；`ts-lab` 另跑类型判题与编译器自检。

## 第二层：入口页与清单（node + 无头浏览器）

```bash
node tools/verify-manifest.mjs   # 重新生成清单，与提交的 assets/js/manifest.js 逐字节比对
node tools/verify-portal.mjs     # 起根 serve.py + 无头 Edge（CDP）：入口页与各座站入口页
```

`verify-portal.mjs` 检查的东西：入口页的大标题 / 副标题 / 简介长度（≤140 字）与断行（宽屏两行、每行用满）、
页脚版权行、每张卡片的数字与一句话、卡片顺序与入口链接、三档宽度下的对齐与列数；各座站入口页从根服务取到后，
侧栏章节数与清单一致、编辑器有起始代码、目录栏底部有回入口页的按钮与版权行、行内代码里的星号没被当成强调标记
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

这几支脚本慢（几分钟），且要起无头 Edge 与 http.server，所以不放进每轮迭代。

## CDP 验收的三条硬规矩（踩过）

1. 前台 `terminal` 超时超过 600s 会被提升为后台进程，随后带 `stdin is not a tty` 立刻死掉——脚本输出要重定向到 `.cache/`。
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
