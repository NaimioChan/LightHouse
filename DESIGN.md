---
version: alpha
name: LightHouse
description: 四座前端训练场（HTML5 / CSS / JS / TypeScript）的入口页。与四座站同一套纸感浅色系统，入口页自己的强调色是灯塔金，四座站各自的颜色只出现在对应卡片上。
colors:
  primary: "#232019"
  secondary: "#6B6558"
  tertiary: "#C08A2E"
  tertiary-strong: "#8A5A00"
  neutral: "#F0EEE6"
  panel: "#FAF9F5"
  line: "#E0DBCC"
  code-bg: "#F6F4EC"
  ink-soft: "#4A453A"
  lab-html5: "#D25319"
  lab-html5-strong: "#B04A16"
  lab-css: "#2965F1"
  lab-css-strong: "#2456C8"
  lab-js: "#C15F3C"
  lab-js-strong: "#B4522F"
  lab-ts: "#3178C6"
  lab-ts-strong: "#2563A8"
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
  topbar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.primary}"
    height: 54px
  brand-mark:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-head-rule:
    backgroundColor: "{colors.line}"
    height: 1px
  card-stats:
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
  chips:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.sm}"
    typography: "{typography.body-sm}"
  pick-table:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
  pick-table-head:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.primary}"
    height: 38px
  progress-track:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.sm}"
    height: 6px
  progress-fill-lab:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    height: 6px
  card-rule-html5:
    backgroundColor: "{colors.lab-html5}"
    height: 3px
  card-rule-css:
    backgroundColor: "{colors.lab-css}"
    height: 3px
  card-rule-js:
    backgroundColor: "{colors.lab-js}"
    height: 3px
  card-rule-ts:
    backgroundColor: "{colors.lab-ts}"
    height: 3px
  card-button-html5:
    backgroundColor: "{colors.lab-html5-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 6px
  card-button-css:
    backgroundColor: "{colors.lab-css-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 6px
  card-button-js:
    backgroundColor: "{colors.lab-js-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 6px
  card-button-ts:
    backgroundColor: "{colors.lab-ts-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 6px
  button-enter:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 6px
  button-enter-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 6px
  button-ghost:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.tertiary-strong}"
    rounded: "{rounded.sm}"
    padding: 6px
  summary-strip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.lg}"
    padding: 14px
  stale-banner:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "{colors.panel}"
    typography: "{typography.body-sm}"
    padding: 9px
---

## Overview

LightHouse 是四座训练场的门厅，不是第五座训练场：没有讲解章节、没有练习、不判题。
它只做三件事——说清四座站各自解决什么问题、把访问者送进去、把四座站的本地进度汇总显示出来。

视觉上直接沿用四座站的系统：象牙白 `#F0EEE6` 底、纸白 `#FAF9F5` 卡片、亚麻线 `#E0DBCC` 描边、
衬线标题 + 系统无衬线正文 + 等宽代码。**入口页自己的强调色是灯塔金**（装饰 `#C08A2E` / 承载文字 `#8A5A00`），
而四座站各自的颜色（赤陶橙、HTML5 橙、CSS 蓝、TS 蓝）只作为卡片的顶边与按钮出现，一张卡一种，不混用。

## Colors

- **Primary (#232019) 暖黑**：标题、正文、卡片标题。
- **Secondary (#6B6558) 灰褐**：统计数字、前置条件、章节标签。
- **Tertiary (#C08A2E) 灯塔金**：入口页自己的装饰色——品牌标记的竖条、总进度条、hover 描边、表格分栏。
  纸白上 2.88:1，只做装饰与粗体，不承载正文小字。
- **Tertiary-strong (#8A5A00) 深金**：凡是金底要承载文字（缓存横幅的实底）、或小字号金色文字，都用这一支。
  纸白上 5.63:1、象牙白上 5.10:1，过 WCAG AA。
- **Neutral (#F0EEE6) 象牙白**：页面底色。
- **Panel (#FAF9F5) 纸白**：卡片、顶栏、表格底色。
- **Line (#E0DBCC) 亚麻线**：全局唯一的 1px 描边色。
- **Code bg (#F6F4EC) 浅纸**：章节标签与表头的底。
- **lab-html5 / lab-css / lab-js / lab-ts 与各自的 -strong 深支**：四座训练场的识别色，取自各自 `DESIGN.md`，
  只在对应卡片上出现。装饰用浅支、按钮实底与文字用 `-strong` 深支，两支的对比度在那边已经验过。

## Typography

标题衬线（Source Han Serif SC，英文回退 Times New Roman），正文系统无衬线，代码 Cascadia Code / Consolas。
字号与四座站完全一致：正文 0.95rem / 行高 1.75，次要信息 0.82rem，代码 0.86rem。

## Layout

单栏居中，最大宽度 1180px（`--page-max`）。自上而下：吸顶顶栏（品牌 + 总进度）→ 标题与两段导语 →
合计条 → 「该进哪一座」表 → 卡片网格 → 页脚。

卡片网格宽屏两列、≤900px 一列；卡片内部 flex 纵向排列，底部区域（进度 + 按钮）用 `margin-top:auto` 压到同高，
两列卡片的底边因此对齐。表格与卡片同宽。

## Elevation & Depth

不用阴影、不用渐变。层级靠 1px 描边、纸白提亮、以及卡片顶部的 3px 颜色条（该站识别色）区分。

## Shapes

4px 用于按钮、章节标签，8px 未使用于入口页，14px 用于卡片、表格与合计条。不做胶囊形按钮。

## Components

- `brand-mark`：品牌文字左侧 3px 金色竖条，入口页唯一的常驻强调。
- `summary-strip`：一行合计（多少章 / 多少练习 / 多少示例 / 几座站），数字用衬线放大。
- `pick-table`：「你想做的事 → 进哪座训练场 → 前置」三列；最后一行是「不确定先后顺序」指向仓库内的方向评估文档。
- `card`：一座站一张。顶边 3px 该站识别色，内含标题、规模统计、一句话简介、学习点标签、
  进度条与两个按钮（进入 / 继续第 N 章）。
- `progress-fill-lab`：进度条填充用该站识别色；未开始时宽度 0，且文案写「还没开始」而不是「0%」。
- `button-enter`：该站深支实底 + 纸白字；hover 变暖黑。
- `button-ghost`：纸白底 + 该站深支文字，只在与「进入」并排时出现（继续第 N 章）。
- `stale-banner`：整条金色横幅，插在页面最顶端，只在检测到「打开的是缓存里的旧版本」时出现一次。

## Do's and Don'ts

- 不要给入口页引入第五种强调色；金色属于门厅，四种站色属于各自的卡。
- 不要在卡片上放阴影、渐变、图标堆叠或大圆角。层级靠描边与色条。
- 不要深色主题（与四座站一致的浅色纸感）。
- 入口页**不写** localStorage、不提供重置按钮：进度属于各座站，入口页只读。
- 不要在入口页重复站内的讲解内容；卡片上只放「这座站解决什么」与规模数字。
- 卡片之间的顺序固定为 HTML5 → CSS → JS → TypeScript（学习顺序），不要按字母或热度重排。
