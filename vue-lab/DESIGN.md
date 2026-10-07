---
version: alpha
name: Vue 3 训练场
description: 与 JS 训练场、TypeScript 训练场同源的纸感浅色教学站点，强调色用 Vue 的品牌绿。阅读区安静，编译结果区清晰，练习区有边界感。
colors:
  primary: "#232019"
  secondary: "#6B6558"
  tertiary: "#42B883"
  tertiary-strong: "#35785F"
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
  heading:
    textColor: "{colors.primary}"
    typography: "{typography.h1}"
  muted-text:
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
  link:
    textColor: "{colors.tertiary-strong}"
  code-block:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.primary}"
    typography: "{typography.code-md}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
  panel-divider:
    backgroundColor: "{colors.line}"
    height: 1px
  exercise-frame:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
  accent-chip:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
  pass-badge:
    textColor: "{colors.sage}"
  fail-badge:
    textColor: "{colors.tertiary-strong}"
---

# Vue 3 训练场

一个离线静态站点，把 Vue 3 的组件写法教到能独立写单文件组件。

## 强调色的两支

`tertiary` 与 `tertiary-strong` 是一对，别混用：

- `#42B883`（`colors.tertiary`）是 Vue 的品牌绿。它当**装饰**用——色块、左边框、进度条填充、
  目录选中态的底。它在纸白 `#F0EEE6` 上只有 **2.15:1**，**不能承载文字**。
- `#35785F`（`colors.tertiary-strong`）是承载文字的那一支，在纸白上 **4.52:1**，
  勉强过 WCAG AA 的 4.5:1。链接、强调文字、按钮文字用它。

这两个值不许互换，也不许在别处另写一个绿色。改色值 = 同时改
`assets/css/base.css` 的 `--accent*` 与 `assets/css/app.css` 的派生色。

## 字体

标题用思源宋体（本机已装全字重），正文用系统 UI 字体，代码用 Cascadia Code。
三个族名都已在 `base.css` 的 `--serif` / `--sans` / `--mono` 里给出回退链。

## 排版约定

阅读区宽度 `--read-max: 820px`，工具区 `--work-max: 1560px`，超宽屏只放开工具区。
**列宽由容器负责**，子元素自己不许写 `margin-inline: auto`——不然宽屏下会一半居中一半靠左。
练习卡宽屏走三栏（说明 | 编辑器 | 编译结果），窄屏堆叠。

## Do's and Don'ts

- 页面上不要出现第二个强调色。对错状态用 `sage`（对）与 `tertiary-strong`（错），不用红绿双色。
- 不用 emoji，不用图标字体（离线站不带字体文件）。
- 编译结果面板的底色用 `--code-bg`，与代码块一致；不要用纯白，会跟 `panel` 撞。
