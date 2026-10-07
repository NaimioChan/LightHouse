# 章节大纲（12 章）

写作顺序与依赖：每章只能用到本章及之前讲过的东西。`ch01` 已完成（作为范例）。

| 章 | 标题 | 讲什么 | 练习覆盖 |
|---|---|---|---|
| ch01 | 第一个组件 | SFC 三段结构、`{{ }}` 插值、`ref` 与 `.value`、`@click`、`v-bind` | ✅ 已完成 4 题 |
| ch02 | 响应式的两种写法 | `reactive` vs `ref`、`computed`、为什么 `computed` 比函数好（有缓存） | reactive 改属性、computed 派生值、computed 参与渲染 |
| ch03 | 模板里的条件与循环 | `v-if` / `v-else-if` / `v-else`、`v-show` 的区别、`v-for`、`:key` 为什么必须有 | 条件渲染、列表渲染、v-show vs v-if |
| ch04 | 列表的增删改 | `v-for` 上做增删、数组响应式的坑（`arr[i]=x` 不触发）、用不可变方式更新 | 添加一项、删除一项、切换完成态 |
| ch05 | 事件与表单 | `@click` 修饰符（`.prevent`、`.stop`）、`@keyup.enter`、`v-model`（text / checkbox / select / 单选） | 表单双向绑定、修饰符、多选框 |
| ch06 | 样式与 class | `:class` 对象/数组语法、`:style` 对象语法、scoped 样式怎么变成 `data-v-*` | 条件 class、动态 style、scoped 命中范围 |
| ch07 | 组件的 props | `defineProps`、props 是只读的、props 默认值、传对象/数组/函数 | 定义 props、默认值、传数组 |
| ch08 | 组件的 emit | `defineEmits`、子改父、`v-model` 在组件上的展开（`modelValue` + `update:modelValue`） | emit 自定义事件、组件版 v-model |
| ch09 | 插槽 | 默认插槽、具名插槽、作用域插槽（`v-slot`） | 默认插槽、具名插槽、作用域插槽 |
| ch10 | 计算属性与侦听器 | `computed` 的 get/set、`watch` 与 `watchEffect` 的区别、什么时候用哪个、`flush: 'post'` 与 DOM 时机 | 可写 computed、watch 触发次数、watchEffect |
| ch11 | 生命周期与模板引用 | `onMounted` / `onUnmounted` / `onUpdated`、`ref` 拿 DOM（`useTemplateRef` 或同名 ref 变量） | onMounted 里量 DOM、定时器要清理、模板引用 |
| ch12 | 组合式函数与组件通信 | 把逻辑抽成 `useXxx()`、`provide` / `inject`、`defineExpose`、跨层通信与不推荐的做法 | 抽一个组合式函数、provide/inject、defineExpose |

## 每章硬要求（`tools/verify-content.mjs` 会查）

- ≥3 个 `demo`、≥4 个 `exercise`
- 每个练习：`starter ≠ solution`、`tests ≥2`（至少一条读 DOM）、`hints ≥1`
- id 格式：章节 `chNN`，练习 `exNN-M`（NN 与章号一致）
- 代码里只准 `import ... from 'vue'`
- 内容文件里不许出现反引号（用 `[ 'line' ].join('\n')` 写代码块）

## 断言辅助（可用清单见 docs/01-content-schema.md）

`tick()` `$` `$$` `text()` `count()` `has()` `missing()` `attr()` `style()` `click()` `input()` `eq()` `ok()` `near()`

改完状态后**必须** `await tick()` 再读 DOM。

## 写作口吻

教学式，中文，短句。先说什么、再说为什么、最后怎么操作。
不排比、不写「值得注意的是」、不写总结式收尾。不用 emoji。
讲解里的 API 名用行内 code 包起来。
