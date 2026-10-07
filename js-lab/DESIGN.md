---
version: alpha
name: JS 训练场
description: 纸感浅色、赤陶橙强调色的教学站点。阅读区安静，代码区清晰，练习区有边界感。
colors:
  primary: "#232019"
  secondary: "#6B6558"
  tertiary: "#C15F3C"
  tertiary-strong: "#B4522F"
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
    height: 268px
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

教学工具的第一敌人是干扰。整站只有一栏正文、一条左侧目录、一块代码区，
其余全靠留白和层级区分。底色用象牙白 `#F0EEE6`，卡片浮到 `#FAF9F5`，
所有交互只有一个强调色：赤陶橙 `#C15F3C`；通过/正确的状态用鼠尾草绿 `#3D7A68`。

三区职责分明：讲解区安静（无边框、行宽限制在 44em 内），
代码区清晰（等宽、浅底、语法高亮不外露彩度），
练习区有边界（卡片 + 顶栏 + 编辑/预览并排 + 控制台 + 断言清单）。

## Colors

- **Primary (#232019) 暖黑**：正文与标题。不用纯黑，纯黑在象牙底上过于对冲。
- **Secondary (#6B6558) 灰褐**：次要文字、行号、控制台输出、说明。
- **Tertiary (#C15F3C) 赤陶橙**：装饰与大面积交互——进度条、hover 描边、提示竖线。
- **Tertiary-strong (#B4522F) 深赤陶**：凡是**橙底要承载文字**、或**小字号橙色文字**，都用这一支。
  `#C15F3C` 上的纸白文字对比度只有 4.01:1，不到 WCAG AA 的 4.5:1；`#B4522F` 是 4.76:1。
  按钮实底、当前章节实底、错误信息文字、行内链接一律用它。
- **Neutral (#F0EEE6) 象牙白**：页面底色。
- **Panel (#FAF9F5) 纸白**：卡片、面板底。
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

- `.read` 阅读区 `--read-max: 820px`：正文、注释块、代码示例、表格、章节标题、翻页栏都在这里，
  宽度与左右留白完全一致；**居中由容器负责，子元素不许自己写居中的 margin**。
- `.work` 工具区 `--work-max: 1560px`（≥2100px 屏放宽到 1720px）：练习卡、练习场、章节卡片网格。

练习卡在 ≥1360px 走三栏：说明 24em | 编辑器 | 预览（编辑器与预览同高 268px）；
900–1359px 说明占一整行、编辑与预览并排；<900px 全部堆叠。
控制台、断言清单、按钮栏在下面通栏，宽屏时左缩进对齐到编辑器列的左边缘，
不横跨到说明栏下面。分区之间靠 1px 亚麻线与 10–14px 间距分隔。

### 窄屏（≤900px）

目录栏收成抽屉、顶栏只留「目录 / 进度 / 自动运行」、宽表进 `.tbl-wrap`、编辑器字号 ≥16px。
这套形态四座训练场一致，完整规则与验收点见根目录的 `docs/04-mobile-layout.md`；改一座就要改四座。

## Elevation & Depth

不使用阴影做层级——只用一个 1px 亚麻线描边加一档纸白提亮。
模态（看答案确认）用 40% 暖黑遮罩。

## Shapes

小圆角 4px 用于按钮与标签，8px 用于代码块与编辑器，14px 用于卡片。
圆角只为柔化边角，不做胶囊形按钮。

## Components

- `button-primary`：运行、检验。每屏最多 1–2 个。
- `button-ghost`：提示、重置、看答案。纸白底 + 强调色文字。
- `exercise-card`：纸白底 + 亚麻描边的圆角块；标题行含编号、任务、状态点。
- `editor`：浅纸底，无边框，靠底色与周围区分。
- `console-panel`：等宽、灰褐文字串行输出，错误行用深赤陶。
- `sidebar-item-active`：当前章节用深赤陶实底 + 纸白文字。
- `status-pass`：绿底白字标签，只在「全部通过」时出现。
- `stale-banner`：整条橙色横幅，插在页面最顶端，只在检测到「你打开的是缓存里的旧版本」时出现一次。
  一次性提示，不是常态 UI；不要把它做成可关闭的小角落通知。

## Do's and Don'ts

- 不要多强调色。橙与绿各有唯一用途，同时出现即错。
- 不要阴影、渐变、大圆角、图标堆叠。层级靠留白和描边。
- 不要深色主题（本项目既定浅色纸感）。
- 不要给正文区加边框或底板；讲解文字直接落在象牙底上。
- 编辑器与预览框必须同高并排，视觉上是一对，不是两个独立面板。
