# Vue 站编译模型（实测记录）

SFC 从文本到「挂载出来的 DOM」一共四步，每步都有实测确认过的必要性。
改 `assets/js/compile.js` 前先读这一页，`tools/verify-compile.mjs` 覆盖了下面的大部分条目。

采集环境：Windows 11 + 无头 Edge，`sandbox="allow-scripts"` iframe（与判题同构），http 与 `file://` 双跑。

## 一、两条产物的求值方式

`vue.global.prod.js` 的头尾是 `var Vue=function(e){...}({})`，
`vue-sfc-compiler.js` 是 `var VueSFC=(()=>{...})()`。**两者都是变量声明**，
`(0, eval)(src)` 之后不会自动挂到 `window` 上：

- 实测症状：`hasVue:false, hasSFC:false`，随后 `Cannot read properties of undefined (reading 'parse')`。
- 正解：求值后补一句显式赋值。

```js
(0, eval)(vueSrc + ';window.Vue = Vue;');
(0, eval)(sfcSrc + ';window.VueSFC = VueSFC;');
```

## 二、三处必做的改写

`compileScript(descriptor, { id, inlineTemplate: true }).content` 是 ESM 文本，
要过三道处理才能 `new Function('Vue', code)`：

### 1. import 改写

`import { a, b as c } from 'vue'` → `const { a, b: c } = Vue;`

四个实测出来的细节：

| 细节 | 事实 |
|---|---|
| 分隔符有两种 | 模板 helper 用**双引号**（`from "vue"`），用户自己写的用**单引号**。只写一种会漏掉另一半 |
| `[\s\S]*?` 而不是 `[^}]*` | 多个名字时跨行也要匹配 |
| **别名方向** | `import { a as b }` 绑的本地名是 **b**，所以解构要写 `a: b`。写反了渲染函数里全是 undefined，页面渲染成一个空注释节点且不报错——最难查的一个 |
| 同名不必写冒号 | `import { ref }` → `const { ref } = Vue;` 即可 |

### 2. `export default` → `return`

### 3. 组件对象上补两个字段

```js
comp.__isScriptSetup = true;   // 不设：setup 的返回值被当成「绑定对象」而不是渲染函数 → 空渲染
comp.__scopeId = id;           // 不设：不打 data-v-* 属性，scoped 样式全落空
```

第一条是最隐蔽的：`compileScript` 把渲染函数放在 `setup()` 的**返回值**里，
运行时要靠 `__isScriptSetup` 才知道那个返回值是渲染函数。不设的话页面渲染出一个 `<!---->`，
控制台一声不响。

## 三、只有 `<template>` 的 SFC 走另一条路

`compileScript` 对没有 `<script>` 的文件直接抛「SFC contains no `<script>` tags.」。
没有 script 时改走 `compileTemplate`：

```js
var tpl = S.compileTemplate({ source, filename, id, scoped });
```

它的产物是 `export function render(...) {...}`，**不是表达式**，而且里面还有
`const _hoisted_N = ...` 这类提升的静态节点。构造顺序必须是：

```
<模板 helper 的解构>
<整个 compileTemplate 产物（含 hoisted 常量与 render 函数声明）>
return { render: render };
```

三处都试过：把 `return` 放前面会在渲染时抛 `Cannot access '_openBlock' before initialization`（TDZ），
少一层就是 `Unexpected token 'const'`。

## 四、写内核（贴进 srcdoc 的那段）时的两个真坑

1. **内核里不许出现反引号**。它在 `assets/js/sandbox.js` 的模板字符串里；
   注释里写一个反引号就会提前终止模板串，整段内核被当成外层代码，报 `Unexpected identifier 'as'`。
   `tools/verify-compile.mjs` 有两条断言盯着这个。
2. **正则的反斜杠要按两层转义**。内核源码本身在模板串里被解析一次，贴进 srcdoc 再被解析一次。
   最省事的做法是正则用 `new RegExp('...')` 加单引号字符串，比写双反斜杠可读。
3. **内核不许引用外部变量**。`VUELAB_COMPILE_FN.toString()` 带不走闭包里的东西；
   最早的版本把 `toDestructure` 放在函数外面，沙箱里直接 `toDestructure is not defined`。

## 五、错误怎么被看见

| 情况 | 表现 | 处理 |
|---|---|---|
| 模板语法错 | `S.parse` 的 `errors` 非空 | 抛 `kind: 'parse'` 的错，显示原始 message |
| CSS 语法错 | `compileStyle` 的 `errors` 非空 | 抛 `kind: 'style'` |
| setup / 渲染里抛错 | 默认只在控制台 warn，界面是一个空注释节点 | `app.config.errorHandler` 接住，作为整体红框显示 |
| 死循环 | iframe 卡死 | 6 秒超时、切掉 iframe（下次运行重建），给一条能读的提示 |
| import 了 `vue` 以外的模块 | 改写后留裸 import | 编译产物语法错，提示「只支持 import vue」 |

实测（probe-engine3/4）：死循环超时后**下一次运行 105 ms 恢复正常**，不需要手动 reset。

## 六、耗时（本机实测）

| 步 | 耗时 |
|---|---|
| 沙箱内 eval 两个产物 | 100 ms 上下 |
| `compileScript`（含模板内联） | 29.8 ms |
| 挂载 + nextTick + 跑 7 条断言 | 总 57–76 ms |

每次自动运行都会重建 iframe，上面这些是每轮的固定开销。

## 七、判题等待点

**`Vue.nextTick()`，不是固定毫秒。** 用户改完状态后 DOM 还没更新；
断言里写 `click("button"); await tick();` 再读，否则永远读到上一帧。

`click()` 派发的是真实 `MouseEvent`（`bubbles: true`），`@click` 才会触发；
`input()` 设 `value` 后派发 `input` 事件，`v-model` 才会同步。
