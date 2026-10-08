# React 站运行时模型（实测记录）

从「用户敲的一段 htm + import 文本」到「挂载出来的 DOM 上跑断言」，一共几步，每步都有实测确认过的
必要性。改 `assets/js/compile.js` / `assets/js/harness.js` 之前先读这一页；
`tools/verify-compile.mjs` 与 `tools/verify-browser.mjs` 覆盖了下面大部分条目。

采集环境：Windows 11 + 无头 Edge，`sandbox="allow-scripts"` iframe（与判题同构），http 与 `file://` 双跑。

## 一、React 产物怎么进沙箱

React 19 没有 UMD 构建，`createRoot` 在 `react-dom/client` 里，且**两份 React 会让 hooks 失效**。
所以 `react` + `react-dom` + `react-dom/client` + `htm` 被打成一份单入口 IIFE，
全局名 `RLLAB_REACT`（见 `vendor/README.md`）。

沙箱 iframe 是 opaque origin，里面 `<script src>` 一律 `onerror`，`file://` 下父页面 `fetch` 又读不到本地文件。
做法与 vue-lab 相同：把产物源码编码成一个字符串常量（`vendor/react19-src.js` → 全局 `RLLAB_REACT_SRC`），
classic 脚本送进页面，判题/预览的 iframe 里再 `eval`。

打包产物是 `var RLLAB_REACT=(()=>{...})()`，`(0, eval)` 之后不会自动挂到 `window`，必须补一句：

```js
(0, eval)('window.__RLLAB_REACT = RLLAB_REACT;');
```

实测症状：不补这句，`Bundle` 是 `undefined`，随后 `React 产物没挂上 window`。

## 二、三处必做的改写（`assets/js/compile.js`）

改写内核只有这一个入口，`RLLAB_COMPILE_FN.toString()` 贴进沙箱，node 侧 `verify-compile.mjs` 用的是同一份。

### 1. `import` 改写

| 写法 | 改写成 |
|---|---|
| `import React, { useState } from 'react'` | `const React = __RLLAB_REACT.React;` + `const { useState } = __RLLAB_REACT.React;` |
| `import * as RD from 'react-dom'` | `const RD = __RLLAB_REACT.ReactDOM;` |
| `import { createRoot } from 'react-dom/client'` | `const { createRoot } = __RLLAB_REACT.ReactDOMClient;` |
| `import htm from 'htm'` | `const htm = __RLLAB_REACT.htm;` |
| `import { useMemo as memo } from 'react'` | `useMemo: memo`（**别名方向：本地名在右**） |

两个细节：

- 分隔符单双引号都会出现，只写一种会漏一半。
- 别名方向写反了渲染函数里全是 `undefined`，页面渲染成一个空注释节点且不报错——最难查的一个。

不在白名单里的模块（`react` / `react-dom` / `react-dom/client` / `htm`）不会静默消失：
改写时留一条 `/* 不支持的模块 x */` 标记并把模块名塞进 `unknown`，`verify-compile.mjs` 会查这一条。

### 2. `export default` → `return`

沙箱靠 `export default` 取根组件。三种形态各有改法：

| 写法 | 结果 |
|---|---|
| `export default function App() {}` | `function App() {}` + 末尾补 `return App;` |
| `export default class App {}` | `class App {}` + 末尾补 `return App;` |
| `export default () => ...` / 匿名 `function` / 标识符 | 直接换成 `return ...` |

只删前缀是错的：函数声明不会把值交出去，`buildRoot` 拿到 `undefined`，整体报「没有找到 export default」。
这是最早踩的坑，`verify-compile.mjs` 有专门几条断言盯着。

### 3. 其余 `export` 只去前缀

`export function` / `export const` / `export class` → 去掉 `export`，沙箱里没有模块。

## 三、全局注入，而不是 `new Function` 形参

`buildRoot` 用的不是 `new Function('__RLLAB_REACT', 'html', code)`，而是注入全局再
`new Function('__RLLAB_REACT', code)`：

```js
window.html = html;            // htm.bind(React.createElement)
window.React = React;
window.ReactDOM = Bundle.ReactDOM;
window.ReactDOMClient = Bundle.ReactDOMClient;
window.htm = Bundle.htm;
```

原因：用户代码里可能照真实工程那样写 `const html = htm.bind(React.createElement)`。
如果 `html` 是 `new Function` 的**形参**，同一作用域里再 `const html` 会直接
`SyntaxError: Identifier 'html' has already been declared`。注入成全局后，同名 `const` 只是遮蔽它，不报错。
两种写法都收。

## 四、挂载与判题等待点

```js
var root = ReactDOMClient.createRoot(host, options);
ReactDOM.flushSync(function () { root.render(element); });
```

- **不用 `ReactDOM.render`**：19 已移除。
- `flushSync` 把首次渲染刷成同步，挂载完立刻就能读 DOM。
- `options.onUncaughtError` / `onCaughtError` 接住渲染期抛错，作为整体红框（fatal）显示，
  而不是只留一个空注释节点。

### `tick()` 为什么是宏任务，不是 `requestAnimationFrame`

断言里状态改完之后要 `await tick()` 再读 DOM。`tick()` 的实现是**两轮 `setTimeout(0)`**：

```js
function tick() {
  return new Promise(function (resolve) {
    setTimeout(function () { setTimeout(resolve, 0); }, 0);
  });
}
```

早期版本用 `setTimeout` + `requestAnimationFrame`。**实测这条路是死的**：沙箱 iframe 被放在离屏容器里
（`#rllab-sandbox-host` 在 `left:-9999px`），隐藏文档里 rAF 从不触发，`tick()` 永远挂着，
整批用例一起 90 秒超时，报「沙箱没有回传这个用例」。

探针（直接驱动 `window.RLLAB_SANDBOX.run`）对比：

| 断言 | 耗时 / 结果 |
|---|---|
| 纯读 DOM | 6 ms，PASS |
| `await tick()`（rAF 版） | 8 秒超时，fatal |
| 纯 `setTimeout(0)` | 2 ms，PASS |
| `await tick()`（两轮宏任务） | 3 ms，PASS |

`flushSync` 之后的状态更新与 `useEffect` 排的活，两轮宏任务足够落定。

### 一次点击一次 tick

React 的状态更新不是同步写进 DOM 的。`click(".b"); click(".b")` 两次之间不 await，
两个处理器会读到同一个旧值，计数只加一次。正确写法：

```js
click(".b"); await tick(); click(".b"); await tick();
```

这是内容写作最容易犯的错，`docs/01-content-schema.md` 的断言规则里单独写了一条。

## 五、事件辅助怎么派发

| 辅助 | 派发 | 为什么 |
|---|---|---|
| `click(sel)` | `new MouseEvent('click', {bubbles:true, cancelable:true})` | React 的 `onClick` 挂在真实 DOM 上 |
| `input(sel, v)` | 设 `el.value` + `new Event('input', {bubbles:true})` | 文本输入上 React 的 `onChange` 实际监听 `input` |
| `check(sel, v)` | 设 `el.checked` + `input` + `change` | 复选框 / 单选用 |
| `key(sel, k)` | `keydown` + `keyup` | 键盘处理器才会触发 |

实测：受控输入用 `input()` 能同步（React 19 的 value tracker 在 `el.value = v` 这条赋值边上会更新），
`check()` 能触发 `onChange`。这两条在 `verify-browser` 里有专门用例。

## 六、错误怎么被看见

| 情况 | 表现 | 处理 |
|---|---|---|
| 语法错 | `compile` 后 `new Function` 抛错 | `fatal`，整体红框，显示原始 message |
| 根组件没导出 | `buildRoot` 抛「没有找到 export default」 | `fatal` |
| 渲染里抛错 | 被 `onUncaughtError` / `onCaughtError` 接住 | `runtimeErrors` 非空 → 整体红框 |
| 断言抛错 | 单条 `try/catch` | 单条失败，其余照跑 |
| 死循环 | iframe 卡死 | `BOX.run` 超时，切掉 iframe（下次运行重建） |

死循环超时后一次运行即恢复，不需要手动 reset（每份用例独立建栈、跑完 `resetDom`）。

## 七、多份用例连跑

自测（`RLLAB_SELFTEST`）把每个练习的参考答案与起始代码各跑一遍，按章分组，每章一次 `BOX.run`。
`JOB.cases` 里每份用例独立 `resetDom()` + `mountComponent` + `runTests`，
**每份都要自己吞异常**——只在链尾挂 catch 的话，一份挂了后面全被跳过。
`__results` 每份清空，`resetDom` 卸载上一个 React 根、删掉挂载点和 `<style>`，否则断言会抓到一个用例残留的元素。

## 八、耗时（本机实测）

| 步 | 耗时 |
|---|---|
| 沙箱内 eval 打包产物 | 数十毫秒 |
| `compile` 改写 | 亚毫秒 |
| `createRoot` + `flushSync` 首帧 | 数毫秒 |
| 一个练习两遍（参考答案 + 起始代码） | 十几毫秒 |

首屏关键路径上**没有**这 220 KB：`sandbox.js` 在首屏之后懒加载，`index.html` 里只有字符串包。
