---
version: alpha
name: LightHouse
description: 一个入口页 + 若干座各自独立的编程演练场。一页纸：大标题、一句简介、卡片，别的都不放。
colors:
  primary: "#232019"
  secondary: "#6B6558"
  tertiary: "#C08A2E"
  tertiary-strong: "#8A5A00"
  neutral: "#F0EEE6"
  panel: "#FAF9F5"
  line: "#E0DBCC"
  ink-soft: "#4A453A"
  lab-html5: "#D25319"
  lab-html5-strong: "#B04A16"
  lab-css: "#2965F1"
  lab-css-strong: "#2456C8"
  lab-js: "#C15F3C"
  lab-js-strong: "#B4522F"
  lab-ts: "#3178C6"
  lab-ts-strong: "#2563A8"
  lab-vue: "#42B883"
  lab-vue-strong: "#35785F"
  lab-react: "#087EA4"
  lab-react-strong: "#046E8F"
  lab-tailwind: "#38BDF8"
  lab-tailwind-strong: "#0369A1"
typography:
  h1:
    fontFamily: Source Han Serif SC
    fontSize: 3.5rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Source Han Serif SC
    fontSize: 1.2rem
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
rounded:
  sm: 4px
  lg: 14px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
components:
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  hero-mark:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
  hero-sub:
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
  hero-intro:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 18px
  card-stats:
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
  card-blurb:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-sm}"
  progress-track:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.sm}"
    height: 5px
  progress-fill-lab:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    height: 5px
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
  card-rule-vue:
    backgroundColor: "{colors.lab-vue}"
    height: 3px
  card-rule-react:
    backgroundColor: "{colors.lab-react}"
    height: 3px
  card-rule-tailwind:
    backgroundColor: "{colors.lab-tailwind}"
    height: 3px
  card-button-html5:
    backgroundColor: "{colors.lab-html5-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  card-button-css:
    backgroundColor: "{colors.lab-css-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  card-button-js:
    backgroundColor: "{colors.lab-js-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  card-button-ts:
    backgroundColor: "{colors.lab-ts-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  card-button-vue:
    backgroundColor: "{colors.lab-vue-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  card-button-react:
    backgroundColor: "{colors.lab-react-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  card-button-tailwind:
    backgroundColor: "{colors.lab-tailwind-strong}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  button-enter-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: 5px
  button-ghost:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.tertiary-strong}"
    rounded: "{rounded.sm}"
    padding: 5px
  stale-banner:
    backgroundColor: "{colors.tertiary-strong}"
    textColor: "{colors.panel}"
    typography: "{typography.body-sm}"
    padding: 9px
---

## Overview

入口页只回答两件事：这里有什么、从哪进去。一屏之内：一个大的 `LightHouse` 标题、一行副标题、
一段不超过两行的简介，然后是卡片（每座演练场一张：名字、规模、教什么、进度、入口）。不放导语段落、
不放「选哪个」对照表、不放汇总条、不放招徕式的宣传文案。

副标题与简介对领域与站数保持中立：不列语言、不写「前端」「四个」这类限定，也不写死任何一座站的名字。
站数从 4 涨到 8、从语言扩展到数据库或工具链，这一页都不用改文案。

各座站的语言基础可能递进，但每张卡片都能独立进入——想补 CSS 就进 CSS，不必从 HTML5 开始，
所以卡片上不需要「前置」这类排序说明。

视觉上沿用各站的系统：象牙白 `#F0EEE6` 底、纸白 `#FAF9F5` 卡片、亚麻线 `#E0DBCC` 描边、
衬线标题 + 系统无衬线正文。入口页自己的强调色是灯塔金（装饰 `#C08A2E` / 承载文字 `#8A5A00`），
每座站各自的颜色只出现在对应卡片的顶边与按钮上，一卡一色。

## Colors

- **Primary (#232019) 暖黑**：标题、卡片名、按钮 hover 的实底。
- **Secondary (#6B6558) 灰褐**：副标题、规模数字、页脚。纸白上 5.50:1，过 WCAG AA。
- **Tertiary (#C08A2E) 灯塔金**：品牌竖条、进度条填充。纸白上 2.88:1，只做装饰。
- **Tertiary-strong (#8A5A00) 深金**：金底承载文字（缓存横幅）、正文里的链接。纸白上 5.63:1。
- **Neutral (#F0EEE6) 象牙白**：页面底色。
- **Panel (#FAF9F5) 纸白**：卡片底色。
- **Line (#E0DBCC) 亚麻线**：全局唯一的 1px 描边色。
- **Ink-soft (#4A453A) 柔墨**：简介与卡片上那句话的正文色。
- **lab-html5 / lab-css / lab-js / lab-ts / lab-vue / lab-react / lab-tailwind 与各自的 -strong 深支**：各座训练场的识别色，取自各自 `DESIGN.md`；
  装饰用浅支，按钮实底与文字用深支。

## Typography

标题衬线（Source Han Serif SC，英文回退 Times New Roman），正文系统无衬线。
大标题 3.5rem 是入口页唯一的大字号，卡片名 1.2rem，正文 0.95rem，次要信息 0.82rem。
简介行宽不超过 42em，断行交给浏览器的中文默认规则（`word-break: normal`，中文可在任意两字之间断行），
配 `overflow-wrap: anywhere` 兜住长串；文案超标时删字，不要放大宽度、也不要靠拉宽带子解决。
曾经用过 `word-break: keep-all`（只在标点处断行），全宽下会让简介在标点前空掉大片再换行、末尾多出一行孤字。

## Layout

单栏居中，最大宽度 1080px（`--page-max`），上下留白 72px / 64px；窄屏（≤560px）上下留白收到 44px / 48px。
自上而下只有三块：标题区（标题 + 副标题 + 简介）、卡片网格、页脚（版权 `© 2026 非茗 · Naimio` 与一个 GitHub 图标链接同行）。

卡片网格宽屏两列、≤880px 一列，卡片间距 18px。
手机竖屏下大标题降到 2.4rem、卡片与页脚都不许出现横向溢出（入口页自己的整页缩放交给浏览器，
但卡片按钮必须够手指点：`.btn-enter` 一类按钮窄屏高度 ≥ 36px）。卡片内部自上而下：站名与规模（同一行，规模右对齐）、
一句话、进度文本、进度条、按钮（进入，有进度时多一个「继续第 N 章」）；带第三方运行库的站（TS / Vue / React / Tailwind）
末尾多一行小字提示首次加载体积。

## Elevation & Depth

不用阴影、不用渐变。层级靠 1px 描边、纸白提亮，以及卡片顶部的 3px 识别色。

## Shapes

4px 用于按钮，14px 用于卡片，大标题左侧的竖条同用 4px。不做胶囊形按钮。

## Components

- `hero-mark`：大标题左侧 6px 的金色竖条，入口页唯一的常驻强调。
- `card`：一座站一张，顶边 3px 该站识别色。
- `progress-fill-lab`：进度条填充用该站识别色；未开始时宽度 0，文案写「还没开始」而不是「0%」。
- `button-enter`：该站深支实底 + 纸白字；hover 变暖黑。
- `button-ghost`：纸白底 + 该站深支文字，只在有进度时出现（继续第 N 章）。
- `stale-banner`：整条金色横幅，插在页面最顶端，只在检测到「打开的是缓存里的旧版本」时出现一次（本地 serve.py 专有）。
- `side-back`：各座训练场目录栏底部的「← LightHouse 目录」按钮，纸白底 + 亚麻描边 + 该站深支文字，hover 换成该站识别色描边。
- `side-credit`：目录栏底部那行 `© 2026 非茗 · Naimio`，比次要信息再小一档，灰褐；行尾跟着一个小号 GitHub 图标链接（`.gh-link`，`https://github.com/NaimioChan/LightHouse`）。

## Do's and Don'ts

- **简洁优先**：入口页只留「大标题 + 副标题 + 一段简介 + 卡片」。不要导语式大标题、不要选哪个对照表、
  不要汇总条、不要学习点标签串、不要页顶工具条。想加板块前先问：删掉它访客会少知道什么？
- 不要给入口页引入新的强调色；金色属于门厅，各站色属于各自的卡片。
- 不要阴影、渐变、图标堆叠、大圆角。层级靠描边与留白。
- 不要深色主题（与各座站一致的浅色纸感）。
- 入口页**不写** localStorage、不提供重置：进度属于各座站，入口页只读。
- 卡片顺序固定 HTML5 → CSS → JS → TypeScript → Vue 3 → React 19 → Tailwind，不按字母或热度重排。
