# 章节大纲（12 章）

写作顺序与依赖：每章只能用到本章及之前讲过的东西。
每章硬要求由 `tools/verify-content.mjs` 查：≥3 个 `demo`、≥4 个 `exercise`；
每个练习 `starter ≠ solution`、`tests ≥2`（至少一条读 DOM）、`hints ≥1`；`id` 格式 `chNN` / `exNN-M`。

| 章 | 标题 | 讲什么 | 练习覆盖 |
|---|---|---|---|
| ch01 | 第一个组件 | 函数组件、`htm` 模板、`${}` 插值、`class`、属性绑变量 | `ex01-1` 插值用户名 · `ex01-2` 插值里算八折 · `ex01-3` 用属性绑 `tip` · `ex01-4` 换类名 |
| ch02 | props：把值传进组件 | `props` 参数、解构、默认值、传数字 / 函数、props 只读、组件名大写 | `ex02-1` 传名字 · `ex02-2` 解构两个 prop · `ex02-3` 默认值 · `ex02-4` 列表项拆组件 |
| ch03 | 列表与 key | `map` 渲染列表、`key` 用稳定 id 而不是下标、key 错了会串状态 | `ex03-1` 数组变列表 · `ex03-2` key 用 id · `ex03-3` 每行一个组件 · `ex03-4` 过滤后仍用 id |
| ch04 | state 与事件 | `useState` 的 `[值, 改值]`、事件处理器、函数式更新、传函数 vs 调函数 | `ex04-1` 点一下加一 · `ex04-2` 归零 · `ex04-3` 开关 · `ex04-4` 一次点加三 |
| ch05 | 受控表单 | 受控 `input` / `checkbox` / `textarea`、`value` 来自 state、`onChange` 写回、`disabled`、提交 | `ex05-1` 回显 · `ex05-2` 去空格看长度 · `ex05-3` 勾选控制按钮 · `ex05-4` 两栏表单点提交拼话 |
| ch06 | 派生值与条件渲染 | 能算的就别存 state、三元切块、`null` 什么都不显示、提前 return | `ex06-1` 算总价 · `ex06-2` 有数量才提示 · `ex06-3` 空列表整块不显示 · `ex06-4` 按钮文字与行为一起换 |
| ch07 | 副作用与清理 | `useEffect` 的时机、依赖数组 `[]` / `[dep]`、`setTimeout` / `setInterval`、清理函数 | `ex07-1` 挂载后改状态 · `ex07-2` 依赖把一个值同步进另一个 state · `ex07-3` 定时器停得掉 · `ex07-4` 取消后不再触发 |
| ch08 | 状态提升与共享 | 兄弟组件共用状态提到公共父组件、值往下传、回调往上传、单一数据源 | `ex08-1` 子按钮改父计数 · `ex08-2` 两面板共享选中 · `ex08-3` 子把选中报给父 · `ex08-4` 两个输入共用一份值 |
| ch09 | ref 与 DOM | `useRef` 的 `{ current }`、`ref=${ref}` 拿节点、聚焦 / 清空 / 读信息、ref 变化不触发重渲染 | `ex09-1` 挂载后自动聚焦 · `ex09-2` 焦点移到第二个框 · `ex09-3` 用 ref 清空 · `ex09-4` 读标签名 |
| ch10 | 样式 | `class` 切换整套样式、内联 `style` 对象（双花括号）、驼峰属性、随 state 变的那一份 | `ex10-1` 切类名 · `ex10-2` 内联颜色 · `ex10-3` 状态控字重 · `ex10-4` 只为真时套样式 |
| ch11 | useReducer | 变化有名字 / 多个值一起变就收进 reducer、`reducer(state, action)` 返回新对象、dispatch、纯函数 | `ex11-1` 计数器改 reducer · `ex11-2` 加一个减一 · `ex11-3` 用 reducer 切布尔 · `ex11-4` 带参数地加或删 |
| ch12 | context | `createContext`、`<Ctx.Provider value=${...}>`、`useContext`、跨层取值、默认值 | `ex12-1` 孙组件取 context · `ex12-2` 按钮切 context · `ex12-3` 把一路传的 prop 换 context · `ex12-4` 无 Provider 显示默认值 |

## 断言辅助（可用清单见 docs/01-content-schema.md）

`tick()` `$` `$$` `text()` `count()` `has()` `missing()` `attr()` `style()` `click()` `input()` `check()` `key()` `eq()` `ok()` `near()`

改完状态后**必须** `await tick()` 再读 DOM，每点一次也要一次 `tick()`。

## 写作口吻

教学式，中文，短句。先说什么、再说为什么、最后怎么操作。不排比、不写「值得注意的是」、不写总结式收尾。
不用 emoji。讲解里的 API 名用行内 code 包起来。htm 与 JSX 的差异（`class` / `onClick` 驼峰 / `${}` / `<${Comp}/>`）
在 ch01 用一张表一次交代清楚，后面章节不再重复。
