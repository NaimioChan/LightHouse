# vendor/ — 入库的第三方产物

这里的东西**不要手改**，也不要让 git 动它们的换行（`.gitattributes` 里标了 `-text`，保持原字节）。
改一个字节就要重跑 `tools/verify-vendor.mjs` 并更新下表的 sha256（脚本里的期望值也要一起改）。

| 文件 | 字节 | sha256（前 16） | 来源 | 许可 |
|---|---|---|---|---|
| `react19.iife.min.js` | 224,264 | `7e7b5e402aeff11b` | `react@19.3.0` + `react-dom@19.3.0` + `react-dom/client` + `htm@3.1.1`，esbuild 打单入口 IIFE，全局名 `RLLAB_REACT` | MIT |
| `react19-src.js` | 229,048 | `6b9313f80d3f4863` | 由 `tools/build-vendor-src.mjs` 从上面那个文件生成（源码字符串） | MIT（同源） |
| `LICENSE-React.txt` | — | — | React 的 LICENSE | MIT |
| `LICENSE-htm.txt` | — | — | htm 的 LICENSE | Apache-2.0 |

合计 453,312 B（约 443 KB）。

## 为什么是一份单入口 IIFE

React 19 不再提供 UMD 构建，也没有 `ReactDOM.render`。`createRoot` 在 `react-dom/client` 里。
hooks 靠模块内部的状态，**页面里存在两份 React 就会让 hooks 失效**，所以 `React`、`ReactDOM`、
`ReactDOMClient`、`htm` 必须来自同一份打包产物，一起挂在全局 `RLLAB_REACT` 上。
`sandbox.js` 与 `harness.js` 只认这一个全局。

## 重新生成

`react19.iife.min.js` 是构建期产物，本机用 esbuild 的 API 打（见下）。产物体积与哈希对不上，
`tools/verify-vendor.mjs` 会报出来。

```js
// entry.js
import React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import htm from 'htm'
export { React, ReactDOM, ReactDOMClient, htm }
```

```js
// build.mjs —— 用 esbuild 的 API，而不是 CLI：要从产物里保留 React 的许可注释
import * as esbuild from 'esbuild'
await esbuild.build({
  entryPoints: ['entry.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'RLLAB_REACT',
  define: { 'process.env.NODE_ENV': '"production"' },
  outfile: 'react19.iife.min.js',
  legalComments: 'inline'
})
```

实测结果 224,264 B，sha256 前 16 位 `7e7b5e402aeff11b`。

生成 `react19-src.js`（给沙箱求值的源码字符串）：

```bash
node tools/build-vendor-src.mjs
```

## 为什么源码要再包一层字符串

判题与预览都在 `sandbox="allow-scripts"` 的 iframe 里跑（opaque origin）。这个 iframe：

- `<script src>` 加载本地 js 一律 `onerror`，只能靠 `postMessage` 把文本送进去；
- `file://` 下父页面的 `fetch` / `XHR` 读本地文件全被拦；
- `file://` 下外链 `<script src>` 的 `textContent` 是空的（拿不到源码）。

所以 `react19-src.js` 把产物本身编码成一个字符串常量（`root.RLLAB_REACT_SRC = "…"`），
用 classic 脚本送进页面，沙箱里再 `eval` 出来。`file://` 与 `http` 两条路才会表现一致。

## 沙箱里求值挂全局的方式（踩过的坑）

打包产物是 `var RLLAB_REACT=(()=>{...})()` 形式。`(0, eval)(src)` 之后变量名成了脚本作用域的一部分，
**不会自动挂到 `window`**。`sandbox.js` 里求值完显式补一句赋值：

```js
(0, eval)(src + ';window.RLLAB_REACT = RLLAB_REACT;');
```

实测症状：`typeof RLLAB_REACT === 'undefined'`，随后 `Cannot read properties of undefined (reading 'React')`。

## 体积的代价（本机实测，headless Edge）

| 步 | 耗时 |
|---|---|
| 沙箱内 eval 打包产物 | 数十毫秒 |
| `createRoot` + 首帧（`flushSync`） | 数毫秒 |
| 每个练习跑两遍（参考答案 + 起始代码） | 十几毫秒 |

每次自动运行都会重建 iframe，上面是每轮的固定开销；相对「停手一秒自动运行」可以忽略。
首屏关键路径上**没有**这 220 KB：它由 `sandbox.js` 在首屏之后懒加载，`index.html` 里只有
那个字符串包 `react19-src.js`（它本身不执行 React，只是存字符串）。

更细的运行时结论（改写内核、判题等待点、`tick()` 为什么不用 rAF）记在
`docs/02-runtime-model.md`，改 `assets/js/compile.js` / `assets/js/harness.js` 前先读那一页。
