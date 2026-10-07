---
version: alpha
name: CSS 训练场
description: 与 JS 训练场、HTML5 训练场同源的纸感浅色教学站点，强调色换成 CSS 官方的蓝。阅读区安静，代码区清晰，练习区有边界感。
colors:
  primary: "#232019"
  secondary: "#6B6558"
  tertiary: "#2965F1"
  tertiary-strong: "#2456C8"
  neutral: "#F0EEE6"
  panel: "#FAF9F5"
  line: "#E0DBCC"
  sage: "#3D7A68"
  code-bg: "#F6F4EC"
  ink-soft: "#4A453A"
typography:
  h1:
    fontFamily: Source Han Serif SC
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  h2:
    fontFamily: Source Han Serif SC
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: system-ui
    fontSize: 0.95rem
    fontWeight: 400
    lineHeight: 1.75
  body-sm:
    fontFamily: system-ui
    fontSize: 0.82rem
    fontWeight: 400
    lineHeight: 1.6
  code-md:
    fontFamily: Cascadia Code
    fontSize: 0.86rem
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: 4px
  md: 8px
  lg: 14px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  body-text:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-md}"
  divider:
    backgroundColor: "{colors.line}"
    height: 1px
  button-primary:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 7px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 7px
  button-ghost:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 7px
  exercise-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  editor:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    typography: "{typography.code-md}"
    height: 280px
  preview-frame:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    height: 280px
  stage-tag:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.tertiary-strong}"
    rounded: "{rounded.sm}"
    padding: 2px
  console-panel:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 8px
  sidebar-item-active:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 6px
  status-pass:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 4px
  stale-banner:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "{colors.panel}"
    typography: "{typography.body-sm}"
    padding: 9px
---

## Overview

教学工具的第一敌人是干扰。整站只有一栏正文、一条左侧目录、一块代码区，其余全靠留白和层级区分。
底色用象牙白 `#F0EEE6`，卡片浮到 `#FAF9F5`，所有交互只有一个强调色：CSS 蓝 `#2965F1`；
通过/正确的状态用鼠尾草绿 `#3D7A68`。

与 JS 训练场、HTML5 训练场共用一套骨架，视觉上只在强调色上换了色相：那边是赤陶橙与 HTML5 橙，这边是 CSS 官方的蓝。
其余令牌（纸色、墨色、线色、字体、字号、圆角）完全一致——三个站并排看是同一套系统。蓝色不是官方标识里的任何一支，
是照 HTML5 训练场那条「`#D25319` 装饰用 / `#B04A16` 承载文字用」的两支结构重新选的：正片 `#2965F1` 画线和状态，
深支 `#2456C8` 承担文字与实底按钮。

三区职责分明：讲解区安静（无边框、行宽限制在 44em 内），
示例区给一个**真实渲染的小窗**（带 1px 描边与浅底头栏），
练习区有边界（卡片 + 顶栏 + 页签编辑器与预览并排 + 控制台 + 断言清单）。

## Colors

- **Primary (#232019) 暖黑**：正文与标题。不用纯黑，纯黑在象牙底上过于对冲。
- **Secondary (#6B6558) 灰褐**：次要文字、行号、控制台输出、说明。
- **Tertiary (#2965F1) CSS 蓝**：装饰与大块交互——进度条、hover 描边、提示竖线、示例头栏的标记、`窄屏` 标签的描边。
  纸白上 4.72:1、象牙白上 4.28:1，够装饰与粗体用，**不承载正文小字**。
- **Tertiary-strong (#2456C8) 深蓝**：凡是**蓝底要承载文字**、或**小字号蓝色文字**，都用这一支。
  纸白上 6.15:1、象牙白上 5.58:1，过 WCAG AA。按钮实底、当前章节实底、错误信息文字、行内链接、`窄屏` 标签文字一律用它。
- **Neutral (#F0EEE6) 象牙白**：页面底色。
- **Panel (#FAF9F5) 纸白**：卡片、面板底，也是示例渲染窗的底。
- **Line (#E0DBCC) 亚麻线**：1px 分隔线，全局只用这一种描边色。
- **Sage (#3D7A68) 鼠尾草绿**：断言通过、章节完成。禁止把它当第二主色铺开使用。
- **Code bg (#F6F4EC) 浅纸**：代码块与编辑器底色，比 Panel 略深以形成凹入感。

## Typography

标题用衬线（Source Han Serif SC，英文回退 Times New Roman），正文用系统无衬线，
代码用 Cascadia Code / Consolas 等宽。三族分工固定，不混用。

正文 0.95rem / 行高 1.75，讲解段落最大宽度 44em——这是本站可读性的核心参数。
代码 0.86rem，行高 1.6。行号、控制台、提示等次要信息用 0.82rem。

## Layout

单栏正文 + 左侧 240px 固定目录。**两档列宽用容器实现**（`.read` / `.work`，由 `renderChapter` 按段落类型分组）：

- `.read` 阅读区 `--read-max: 820px`：正文、注释块、示例、表格、章节标题、翻页栏都在这里，
  宽度与左右留白完全一致；**居中由容器负责，子元素不许自己写居中的 margin**。
- `.work` 工具区 `--work-max: 1560px`（≥2100px 屏放宽到 1720px）：练习卡、练习场、章节卡片网格。
- 示例（`kind:'demo'`）跟讲解同宽（进 `.read`）；带 `width` 的示例窗在窗内再收窄到那个宽度，外面套一层同宽的外框。

练习卡在 ≥1360px 走三栏：说明 24em | 编辑器 | 预览（编辑器与预览同高 280px）；
900–1359px 说明占一整行、编辑与预览并排；<900px 全部堆叠。
控制台、断言清单、按钮栏在下面通栏，宽屏时左缩进对齐到编辑器列的左边缘，不横跨到说明栏下面。
分区之间靠 1px 亚麻线与 10–14px 间距分隔。

**两阶段练习卡是例外**（`tests` 写成 `[[…], […]]` 的那些，第 9 章）：预演窗要占**一整行**
（说明与编辑器并排在上、预览在下），因为这一章的例子要在宽窗口里判一次——
挤在三栏里只剩三百来像素宽，媒体查询根本触发不了，判题会得出与真实使用不符的结论。
这类卡片加 `.ex-card-2stage`，只换排布不换外观，下面的控制台/断言/按钮栏恢复通栏对齐。

### 窄屏（≤900px）

目录栏收成抽屉、顶栏只留「目录 / 进度 / 自动运行」、宽表进 `.tbl-wrap`、编辑器字号 ≥16px。
这套形态四座训练场一致，完整规则与验收点见根目录的 `docs/04-mobile-layout.md`；改一座就要改四座。

## Elevation & Depth

不使用阴影做层级——只用一个 1px 亚麻线描边加一档纸白提亮。
模态（看答案确认）用 40% 暖黑遮罩。

## Shapes

小圆角 4px 用于按钮、页签、标签与 `窄屏` 标记，8px 用于代码块、编辑器与示例窗，14px 用于卡片。
圆角只为柔化边角，不做胶囊形按钮。

## Components

- `button-primary`：运行·检验。每屏最多 1–2 个。
- `button-ghost`：提示、重置、看答案。纸白底 + 强调色文字。
- `exercise-card`：纸白底 + 亚麻描边的圆角块；标题行含编号、任务、状态点。
- `editor`：浅纸底，页签切 HTML/CSS/JS 三块，无边框，靠底色与周围区分。
- `preview-frame`：纸白底 + 亚麻描边的固定高度窗，里面是 iframe 里的真实渲染结果。示例与练习共用这一种外观。
- `stage-tag`：断言行首的小标记 `窄屏`，说明这条断言是在窄窗口里跑的。蓝描边 + 深蓝字，4px 圆角，不填充底色。
- `console-panel`：等宽、灰褐文字串行输出，错误行用深蓝。
- `sidebar-item-active`：当前章节用深蓝实底 + 纸白文字。
- `status-pass`：绿底白字标签，只在「全部通过」时出现。
- `stale-banner`：整条橙色横幅，插在页面最顶端，只在检测到「你打开的是缓存里的旧版本」时出现一次。
  一次性提示，不是常态 UI；不要把它做成可关闭的小角落通知。

## Do's and Don'ts

- 不要多强调色。蓝与绿各有唯一用途，同时出现即错。
- 不要阴影、渐变、大圆角、图标堆叠。层级靠留白和描边。
- 不要深色主题（本项目既定浅色纸感）。
- 不要给正文区加边框或底板；讲解文字直接落在象牙底上。
- 编辑器与预览窗必须同高并排，视觉上是一对，不是两个独立面板。
- 预览窗里是真实页面，不要在 iframe 外套装饰性边框或阴影，那是它的内容不是我们的 UI。
- 窄预览窗（`width`）只收窄窗本身，不许把它拉成整行——外框保持与阅读区同宽。
