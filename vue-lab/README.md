# Vue 3 训练场

一座离线的静态教学站：12 章，从一个单文件组件写到组件之间怎么通信。每章三件事——读一段讲解、
看一段当场跑起来的示例、自己写一段代码并当场检验。

写的是真实写法：`<script setup>` + `<template>` + `<style scoped>`，编译与运行都在浏览器里完成。

## 怎么跑

| 想做什么 | 怎么操作 |
|---|---|
| 起本地服务（推荐） | 双击 `run.bat`，浏览器打开 `http://127.0.0.1:8881/index.html?v=<令牌>` |
| 完全离线 | 直接双击 `index.html`（`file://`，一样能用） |
| 从入口页进 | 在 LightHouse 入口页点「Vue 3 训练场」那张卡 |

关掉浏览器页面，命令行窗口会自己关。

## 规模

12 章 / 48 练习 / 48 示例 / 428 断言。章节：第一个组件、响应式的两种写法、条件与循环、
列表的增删改、事件与表单、样式与 class、组件的 props、组件的 emit、插槽、计算属性与侦听器、
生命周期与模板引用、组合式函数与跨层通信。

## 判题是怎么做的

用户写的是 SFC 源码文本，跑在 `sandbox="allow-scripts"` 的 iframe 里（opaque origin）：

1. 在沙箱里求值两个 vendor 产物（Vue 运行时 + SFC 编译器），见 `vendor/README.md`；
2. 用 `docs/02-compile-model.md` 里那三处改写把它变成可执行的组件工厂；
3. 挂载、等 `nextTick`，然后逐条跑断言（断言能读真实 DOM、能派发点击、能 `await tick()`）。

父页面不执行任何用户代码；示例卡的右边那块就是这个链路渲出来的**真在跑的组件**，不是截图。

## 验证

```bash
node tools/verify-content.mjs      # 结构：字段、id、数量、index.html 的 script 清单
node tools/verify-compile.mjs      # 编译内核自己的单测（import 改写、别名方向、模板-only）
node tools/verify-pair.mjs         # 括号配对的纯逻辑
node tools/verify-browser.mjs      # 真浏览器：http 与 file:// 两条路各跑一遍全部练习
node tools/verify-ui.mjs           # 真实按键输入 + 四档视口排版 + 离线直开
node tools/verify-pages.mjs        # 逐章渲染对账（DOM 数量 vs 内容里的数字）
node tools/verify-quit.mjs         # 关窗即退
```

`verify-browser.mjs` 会把每个练习跑两遍：参考答案必须全过、起始代码必须至少挂一条。
当前结果：示例 48/48、参考答案 48/48、起始代码被抓 48/48（http 与 `file://` 都一样）。

## 已知限制

- 首次打开要加载约 1 MB 的 Vue 与 SFC 编译器，只需一次（首屏之后才拉，不挡阅读）。
- 一个练习只有一个 `.vue` 文件，没有多文件组件；用户代码只能 `import ... from 'vue'`。
- 沙箱里没有 `localStorage`、没有网络、没有真实的 `history` / `location`。
- 死循环会被 6 秒超时掐掉并重建 iframe；组件在 `setup` 或渲染里抛错会作为整体红框显示。
- 不做路由、状态管理库、SSR、构建工具（它们要么需要真 node 进程，要么要额外第三方包）。

## 目录

```
vue-lab/
├── index.html          入口页（classic script 顺序加载，不用 ES module）
├── AGENTS.md           硬约束：架构铁律、禁区、验证要求
├── DESIGN.md           色值与字体的唯一来源（design.md spec）
├── serve.py run.bat    本地服务与双击启动（纯 ASCII）
├── assets/js/          format / compile / harness / sandbox / highlight / pair / render / app
├── assets/css/         base（令牌）+ app（布局与组件）
├── content/            12 个章节文件（一章一个，UMD 尾巴挂 VUELAB_CHAPTERS）
├── vendor/             Vue 运行时与 SFC 编译器（唯一的第三方代码）
├── docs/               内容契约、编译模型、章节大纲
└── tools/              校验脚本与 CDP 脚手架
```
