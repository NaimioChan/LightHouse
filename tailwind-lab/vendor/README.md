# vendor/ — 入库的第三方产物

这里的东西**不要手改**，也不要让 git 动它们的换行（根 `.gitattributes` 的 `* -text` 覆盖本站，
保持原字节）。改一个字节就要重跑 `tools/verify-vendor.mjs` 并更新下表的 sha256（脚本里的期望值也要一起改）。

| 文件 | 字节 | sha256（前 16） | 来源 | 许可 |
|---|---|---|---|---|
| `tailwind.global.js` | 282,289 | `a60c785630a06196` | `@tailwindcss/browser@4.3.3` 的官方浏览器构建（IIFE） | MIT |
| `tailwind-src.js` | 299,488 | `806a2945050d047c` | 由 `tools/build-vendor-src.mjs` 从上面那个文件生成（源码字符串） | MIT（同源） |
| `LICENSE-Tailwind.txt` | — | — | Tailwind CSS 的 LICENSE | MIT |

合计 581,777 B（约 568 KB）。

## 为什么是浏览器编译器

Tailwind 的正常用法是构建期（PostCSS / CLI）扫源码、生成一份 CSS。本站没有构建步骤，也不能联网，
所以用的是官方提供的**浏览器编译器**：它作为一个 classic 脚本载入页面，自己扫描 DOM 里的 `class`，
即时算出需要的工具类并写进一个 `<style>`。产物里没有导出名，靠副作用工作，用 `<script src>` 引入即可。

它的样式生成是**异步**的：脚本执行时先往 `<head>` 末尾 append 一个空 `<style>`，随后把编译结果写进去。
判题前必须等它填好，否则读到的全是浏览器的默认样式——`harness.js` 里的 `waitTailwind()` 负责这一步。

## 重新生成

`tailwind.global.js` 取自官方包，解包后原样入库：

```
npm pack @tailwindcss/browser@4.3.3
tar -xzf tailwindcss-browser-4.3.3.tgz
# package/dist/index.global.js → vendor/tailwind.global.js
```

实测结果 282,289 B，sha256 前 16 位 `a60c785630a06196`。

生成 `tailwind-src.js`（给沙箱求值的源码字符串）：

```bash
node tools/build-vendor-src.mjs
```

## 为什么源码要再包一层字符串

判题与预览都在 `sandbox="allow-scripts"` 的 iframe 里跑（opaque origin）。这个 iframe：

- `<script src>` 加载本地 js 一律 `onerror`，只能靠 `postMessage` 把文本送进去；
- `file://` 下父页面的 `fetch` / `XHR` 读本地文件全被拦；
- `file://` 下外链 `<script src>` 的 `textContent` 是空的（拿不到源码）。

所以 `tailwind-src.js` 把产物本身编码成一个字符串常量（`root.TWLAB_TAILWIND_SRC = "…"`），
用 classic 脚本送进页面，`preview.js` 再把它内联进预览 iframe 的文档。`file://` 与 `http` 两条路才会表现一致。

## 预览里怎么用它

`preview.js` 把 Tailwind 编译器脚本贴在用户 HTML 之后，并把用户的 CSS 栏塞进一个
`<style type="text/tailwindcss">` 源码块（编译器只认这种 type）。源码块顶部固定拼上：

```
@import "tailwindcss/theme.css";
@import "tailwindcss/utilities.css";
@custom-variant dark (&:where(.dark, .dark *));
```

只引 `theme` 与 `utilities`，**不引 `preflight`**：本站与其余各训练场一样不重置元素默认样式，
练习的初始条件才一致（`h1` 还是浏览器默认大小、`ul` 还有圆点）。`@custom-variant dark` 把 `dark:`
定成 class 策略（`.dark`），预习窗里判得了；Tailwind 默认的 `prefers-color-scheme` 版本在无头浏览器里没法触发。

## 体积的代价（本机实测，headless Edge）

| 步 | 耗时 |
|---|---|
| 首次载入编译器脚本 | 数百毫秒（首屏之后） |
| 每帧编译一次（扫描 class + 生成 CSS） | 约 100–300 ms |
| 两阶段练习（重建一次文档、再编译一次） | 翻倍 |

首屏关键路径上**没有**这 282 KB：`index.html` 里只有字符串包 `tailwind-src.js`（它本身不执行编译器，
只是存字符串），真正求值发生在每个预览 iframe 里。
