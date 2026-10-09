# 04 · 移动端布局契约

各座训练场的引擎是各自独立的（各自 `app.css` / `app.js` / `render.js`，见根 `AGENTS.md` 铁律 4），
但手机上的形态必须一致，否则会出现「js-lab 能开目录抽屉、css-lab 不能」这种四不像。
这一页是那套共享契约的**唯一来源**（现有七座站都在内）；改之前先读，改完各座都要跑自己的 `tools/verify-ui.mjs`。

## 为什么是 900px

断点取 **900px**，与练习卡自己的两栏断点（`@media (min-width: 900px)`）对齐：一跨过去，
版式就整体切成桌上电脑那一套。不用 768px——390px 的横屏手机约 844px 宽，用 768 会让它掉回桌面板式
（240px 侧栏 + 挤扁的正文）。

## 四条硬规则（各座站一致）

1. **目录栏在窄屏变成抽屉，不占正文宽度。**
   `.sidebar` 改 `position: fixed`（`top: 56px; bottom: 0`，宽 `82vw`，上限 300px），
   默认 `transform: translateX(-102%)` + `visibility: hidden`；`body.nav-open` 时滑出。
   顶栏最左边放一个 `#nav-btn`「目录」按钮（`>900px` 时 `display: none`）。
   `.nav-backdrop` 是遮罩，点它、点任意目录链接、按 Esc 都收起。

   反例（收之前的样子）：390px 竖屏下侧栏仍吃 240px 固定宽度，正文只剩 140px，宽表与代码块
   把整页撑到 539–638px，横向滚动与浏览器自动缩放一起出现。

2. **顶栏只留三样：`目录`、进度、`自动运行` 开关。**
   总览/练习场的文字导航（`.topnav`）在窄屏隐藏——它们本来就是侧栏底部与总览页的重复入口。
   「重置进度」挪进抽屉底部（低频危险操作）；进度条压到 56px。

3. **表格必须包一层 `.tbl-wrap`。**
   `render.js` 渲染 `kind: 'table'` 时外面套 `<div class="tbl-wrap">`，窄屏给它
   `overflow-x: auto`：宽表自己横向滚动，而不是把整页撑宽。
   **`.tbl` 不能再是 `.read` 的直接子元素**——各站验收脚本里按 `.read > .tbl` 找表格的地方要一并改成 `.tbl-wrap`。

4. **输入控件在窄屏 ≥ 16px。**
   `.editor-ta` 与高亮叠层 `.editor-hl` 在窄屏写 `font-size: 1rem`。
   手机浏览器（iOS Safari 最明显）在字号小于 16px 的输入框上会自动放大整页，点一下编辑器整页就跳。

另有两处形态调整：目录项与底部返回按钮在窄屏 `min-height: 44px`（iOS 可点面积下限）；
练习卡的编辑器/预览/结果面板在窄屏降到 240px 高，练习场降到 260–320px。

## 一个必须记住的坑：body 高度会打断顶栏粘住

`html, body { height: 100% }` 会让 body 的 sticky 包含块被限在一屏内：
**往下滚过一屏，顶栏就被一起推走**。桌面上只表现为顶栏不见了，窄屏上直接导致抽屉按钮点不到
（实测：目录按钮的 `getBoundingClientRect().top` 是 −1473px，`Input.dispatchMouseEvent` 打在空中）。

正解是 body 高度交给内容：

```css
html { height: 100%; }
body { min-height: 100%; }
```

各站的 `base.css` 都已按这个写。各站 `verify-ui.mjs` 里有一条断言盯着它：
滚到 1600px 后顶栏 `top` 必须仍是 0，且窄屏下「目录」按钮的位置用 `document.elementFromPoint` 命中的就是它自己。

## 验收（不能只看截图）

- 各站 `tools/verify-ui.mjs`：三档桌面视口（2000/1200/760）之外，另加 390px 手机档
  ——侧栏 `position: fixed`、抽屉默认 `visibility: hidden`、正文占满 ≥98%、顶栏高 ≤60px、
  无横向溢出、编辑器字号 ≥16px、目录项 ≥44px，真点按钮展开、点章节链接自动收起、点遮罩收起。
- 根 `tools/verify-portal.mjs`：入口页多一档 390px（卡片单列、无溢出、进入按钮够点），
  各座站入口页都多三条窄屏断言。
- CSS 断言只信 `getComputedStyle` 与 `getBoundingClientRect`；抽屉开合状态看 `body.nav-open`
  与 `visibility`，**不要只看 `transform`**——它受过渡动画影响，读到的可能是动画中途的值。
