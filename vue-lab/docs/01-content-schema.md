# 内容契约 v1

`content/*.js` 里的一切都必须符合本文档。改这里 = 同时改 `tools/verify-content.mjs`、`assets/js/compile.js`、`assets/js/render.js` 三处。

## 章节文件

每个文件一个章节，classic script（**不能用 ESM**，`file://` 下会白屏），UMD 尾巴挂到全局注册表：

```js
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 第一个组件',
    goal: '一句话：学完能写出什么。',
    sections: [ /* 见下 */ ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | `chNN`，全局唯一，文件名必须以它开头，决定排序 |
| `title` | string | ✓ | 目录与页首标题 |
| `goal` | string | ✓ | 一句话 |
| `sections` | Section[] | ✓ | 顺序即阅读顺序 |

文件名：`content/chNN-短名.js`（如 `ch04-props-emit.js`），并且必须已经在 `index.html` 里按顺序引入。

## 五种 Section

### `prose` — 讲解段落

```js
{ kind: 'prose', md: '用 `ref()` 声明会变的值。\n\n段落之间空一行。' }
```

支持的 md 子集（`render.js` 的 mini-markdown，**仅此而已**）：
`## 小标题`、`### 小标题`、段落、`- 无序列表`、`1. 有序列表`、行内 `` `code` ``、`**粗体**`、`*斜体*`。
不支持表格、图片、链接、嵌套列表。要表格用 `kind: 'table'`。

行内 `code` 先被摘出来再跑强调规则，所以反引号里的 `*` 原样显示。

### `note` — 提示 / 警告

```js
{ kind: 'note', tone: 'tip', md: '短句。' }     // tone: tip | warn（省略 = warn 样式）
```

### `table` — 对照表

```js
{ kind: 'table', head: ['写法', '结果'], rows: [['`ref(0)`', '`Ref<number>`']] }
```

单元格走讲解用的那套行内 markdown。整张表要等宽就写 `code: true`。

### `demo` — 当场判题的示例

```js
{
  kind: 'demo',
  caption: 'ref 与普通变量不同',            // 可选，示例上方的小标题
  code: [ '<script setup>', 'import { ref } from \'vue\'', 'const n = ref(0)', '</script>',
          '<template><p class="n">{{ n }}</p></template>' ].join('\n'),
  tests: [                                  // ✓ 必填，≥1 条
    'eq(text(".n"), "0", "初始值")',
    'click("button"); await tick();',
    'eq(text(".n"), "1", "点一次")'
  ],
  show: 'preview'                            // 可选：preview | none（默认 preview，显示渲染结果）
}
```

页面上打开即编译运行（不用点按钮），下面显示渲染结果、模板编译产物（折页）、以及断言结果。
`tests` 也是内容校验的一部分：`tools/verify-content.mjs` 与浏览器自测都会重跑一遍，必须全过。

### `exercise` — 练习

```js
{
  kind: 'exercise',
  id: 'ex01-3',                             // 全局唯一，exNN-M，NN 与所在章号一致
  title: '让按钮点一下加一',
  task: 'markdown 子集：说清要写什么、要满足哪些条件。',
  starter: [ '<script setup>', 'import { ref } from \'vue\'', '// TODO', '</script>',
             '<template><button @click="">{{ count }}</button></template>' ].join('\n'),
  solution: [ '<script setup>', 'import { ref } from \'vue\'', 'const count = ref(0)', '</script>',
              '<template><button @click="count++">{{ count }}</button></template>' ].join('\n'),
  tests: [                                  // ✓ ≥2 条断言
    'eq(text("button"), "0", "初始值")',
    'click("button"); await tick();',
    'eq(text("button"), "1", "点一次之后")'
  ],
  hints: ['……']                             // ✓ ≥1 条，逐条点开
}
```

硬要求（`tools/verify-content.mjs` 会查）：

- `starter !== solution`，且 **起始代码至少要挂掉一条断言**（否则这道题抓不住空实现）。
- 参考答案必须让**全部**断言通过。
- 每道题的 `tests` 里至少有一条是「真的在读 DOM」，不许全是 `ok(true)`。
- 练习不许依赖 `JOB.setup` 之外的外部状态；组件里只准 `import ... from 'vue'`。

## 断言辅助（`tests` 里可用）

断言是**字符串**，被编译成 async 函数执行，所以里面可以写 `await tick()`。能看见的东西：

| 名字 | 含义 |
|---|---|
| `tick()` | 等一次 `nextTick`。**改完状态后必须 await 它才能读到新 DOM** |
| `$` / `$$` | `querySelector` / `querySelectorAll`（返回数组） |
| `text(sel, msg?)` | 元素的 `textContent`（已 trim），取不到就抛错 |
| `count(sel)` | 匹配元素个数 |
| `has(sel, msg?)` / `missing(sel, msg?)` | 元素必须存在 / 必须不存在 |
| `attr(sel, name, msg?)` | 读属性 |
| `style(sel, prop, msg?)` | 读计算样式 |
| `click(sel, msg?)` | 派发真实 `MouseEvent`，`@click` 才会触发 |
| `input(sel, value, msg?)` | 设 `value` 并派发 `input`，`v-model` 才会同步 |
| `eq(actual, expected, msg?)` | 格式化后逐字比较 |
| `ok(cond, msg?)` | 条件为假就抛错 |
| `near(a, b, tol, msg?)` | 数值近似 |

规则：

- 失败信息一律「期望 X，实际 Y」，不写「错误」两个字。
- 断言里**不许**出现 `document.body.innerHTML` 这类整体串比较（一改样式就全挂）；
  要么读具体元素，要么用 `count()`。
- 颜色断言要按**计算值**写：`rgb(1, 2, 3)` 会带空格，写 `rgb(1, 2, 3)` 而不是 `rgb(1,2,3)`。
- 别断言 Vue 的内部属性名（`__scopeId` 之类）；要判 scoped 生效就读 `attr(el, 'data-v-…')`
  或直接读计算样式——**scoped 的正确断言方式是「样式生效了」**，不是「属性叫什么」。

## 执行模型：什么跑在哪

```
用户 SFC 源码（文本）
  └─ 送进 sandbox="allow-scripts" 的 iframe（opaque origin），在里面：
       ├─ eval 两个 vendor 产物（Vue 运行时 + SFC 编译器，见 vendor/README.md）
       ├─ VUELAB_COMPILE_FN 编译：parse → compileScript(内联模板) → compileStyle
       ├─ 改写 ESM（import / export default）、设 __isScriptSetup 与 __scopeId
       ├─ createApp().mount(host)，等 nextTick
       └─ 逐条跑断言（同一作用域，可 await tick），结果 postMessage 回父页面
```

由此确定内容里能做什么、不能做什么：

- 用户代码**只能 import `vue`**。`compile.js` 只认这一个模块名，import 别的会在改写阶段留下裸 import，
  编译产物语法错。要复用逻辑就同文件里写函数，或写成自己的组合式函数。
- 一个练习只有**一个 .vue 文件**，没有多文件组件。子组件写在同一个 `<script setup>` 里用
  `defineComponent` / 对象字面量定义，模板里用 `<component :is>` 或 `h()` 组合。
- 沙箱里 `localStorage` 抛 SecurityError，网络请求被拒，没有 `history` / `location` 语义。
- 定时器可用：练习里的 `setTimeout` 会等到安静后收工。组件里 `onMounted` 里排的异步任务也能跑到。
- 死循环会被 6 秒超时掐掉，给一条能读的提示，并重建 iframe。
- 组件在 `setup` / 渲染里抛错会被接住，作为整体红框显示——这是最常见的「页面上什么都没有」的原因。

## 写作规范

- 中文，高效少废话。不写「众所周知」「值得注意的是」「总之」，不写排比，不写总结式收尾。
- 每章开头一句 `goal`：这一章学完你能写出什么。
- 讲解里出现的 API 名、指令都用手写 `code` 包起来（`ref()`、`v-model`、`@click`）。
- 每章至少 3 个示例、4 道练习，且练习要覆盖本章的主要知识点。
- 每章的练习与示例只能用到**本章及之前章节**讲过的东西。
- 不用 emoji。
