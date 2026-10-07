/* ch01 — 第一个组件：一个 .vue 文件由什么组成，模板怎么把数据画出来。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs && node tools/verify-browser.mjs --chapter ch01
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 第一个组件',
    goal: '看懂一个单文件组件的三段结构，能把数据画到页面上、能让按钮改数据。',
    sections: [
      {
        kind: 'prose',
        md: [
          '一个 Vue 组件就是一个 `.vue` 文件，里面分三段，各管一件事：',
          '',
          '- `<script setup>` —— **逻辑**：定义数据与函数。',
          '- `<template>` —— **结构**：写 HTML，用 `{{ }}` 把数据插进来。',
          '- `<style scoped>` —— **样式**：加 `scoped` 之后，这些样式只管这个组件，不会漏到别处。',
          '',
          '下面这个组件把三段都写全了。右边是它真跑起来的样子，不是截图。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '三段结构齐全的一个组件',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const name = ref('世界')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="hi">你好，{{ name }}！</p>',
          '</template>',
          '',
          '<style scoped>',
          '.hi { color: rgb(42, 99, 73); font-weight: 600; }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(text(".hi"), "你好，世界！", "插值画出来了")',
          'eq(style(".hi", "fontWeight"), "600", "scoped 样式生效了")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `{{ }}` 里放的是表达式，不是语句',
          '',
          '插值里可以写任何**表达式**：算术、三元、函数调用、数组下标。不能写 `if` 或 `for` 这类语句——',
          '要条件渲染用 `v-if`，要循环用 `v-for`，这两个后面几章讲。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '插值里可以算',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const price = ref(19.9)',
          'const count = ref(3)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="total">共 {{ count }} 件，合计 {{ (price * count).toFixed(2) }} 元</p>',
          '  <p class="mood">{{ count > 2 ? \'买得多\' : \'再看看\' }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".total"), "共 3 件，合计 59.70 元", "算术与函数调用")',
          'eq(text(".mood"), "买得多", "三元表达式")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '插值里的 `{{ }}` 只在 `<template>` 里生效。写在 `<script setup>` 里就是普通的字符串，页面上不会变。'
      },
      {
        kind: 'prose',
        md: [
          '## `ref()` 包起来的值才会跟着变',
          '',
          '普通的 `const n = 0` 改了，页面不会更新——Vue 不知道它变了。',
          '用 `ref(0)` 包起来，读写走 `.value`，**改它就会触发重新渲染**。',
          '',
          '在 `<template>` 里可以省掉 `.value`（Vue 会自己拆），在 `<script setup>` 里必须写。',
          '这是新手最常忘的一件事。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['在哪写', '怎么读', '能不能省 .value'],
        rows: [
          ['`<script setup>`', '`n.value`', '不能'],
          ['`<template>`', '`n`', '能（Vue 自动拆）']
        ]
      },
      {
        kind: 'demo',
        caption: '改 ref，页面跟着变',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="btn" @click="n++">点了 {{ n }} 次</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".btn"), "点了 0 次", "初始")',
          'click(".btn"); await tick();',
          'eq(text(".btn"), "点了 1 次", "点一次")',
          'click(".btn"); click(".btn"); await tick();',
          'eq(text(".btn"), "点了 3 次", "再点两次")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-1',
        title: '把名字插进标题里',
        task: [
          '这个组件里已经有一个 `user`，请在 `<template>` 里把它插进 `h1`：',
          '',
          '标题要显示成 `欢迎，非茗` 这个格式（注意中间是中文逗号）。',
          '',
          '先把右边跑起来看看现在是什么样，再动手改。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const user = ref('非茗')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <h1 class="t">欢迎，</h1>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const user = ref('非茗')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <h1 class="t">欢迎，{{ user }}</h1>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".t"), "欢迎，非茗", "标题里插上名字")',
          'eq(count("h1"), 1, "只留一个 h1")'
        ],
        hints: [
          '插值用两对花括号：`{{ user }}`。',
          '在 `<template>` 里直接写 `user`，不用写 `user.value`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-2',
        title: '把价格换成能改的',
        task: [
          '这个组件想显示「原价」的八折价，但 `price` 用的是普通变量，改它页面不会更新。',
          '',
          '请做两件事：',
          '',
          '1. 把 `price` 改成 `ref`，初始值 `100`。',
          '2. 在 `<template>` 里的 `p` 中，把八折价按 `{{ }}` 插进去，显示成 `现价 80 元`。',
          '',
          '八折就是乘 `0.8`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const price = 100',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="p">现价 元</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const price = ref(100)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="p">现价 {{ price * 0.8 }} 元</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".p"), "现价 80 元", "八折算对了")',
          'has(".p", "页面上要有 .p")'
        ],
        hints: [
          '`ref` 已经 import 进来了，直接用。',
          '模板里写 `price * 0.8`，不用写 `.value`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-3',
        title: '做一个能点的计数器',
        task: [
          '写一个按钮，上面显示当前数字，每点一次加一。',
          '',
          '要求：',
          '',
          '- 初始显示 `0`。',
          '- 按钮文字就是数字本身（只有数字，别加别的字）。',
          '- 点击之后数字变。',
          '',
          '提示：事件绑定写成 `@click="..."`，里面放一句会改数据的表达式。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b">{{ n }}</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" @click="n++">{{ n }}</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".b"), "0", "初始是 0")',
          'click(".b"); await tick();',
          'eq(text(".b"), "1", "点一次变 1")',
          'click(".b"); click(".b"); await tick();',
          'eq(text(".b"), "3", "再点两次变 3")'
        ],
        hints: [
          '事件写成 `@click="n++"`，双引号里那句就是点击时要跑的代码。',
          '别忘了给 `button` 加上 `class="b"`，检查项靠它找元素。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-4',
        title: '用 v-bind 改属性',
        task: [
          '`{{ }}` 只能往**文字**里插值。要改的是 **HTML 属性**（比如 `title`、`src`、`disabled`），',
          '得用 `v-bind`，缩写是一个冒号。',
          '',
          '这个组件里有一个 `tip`，请：',
          '',
          '1. 给 `button` 加上 `title` 属性，值绑定到 `tip`。',
          '2. 用 `v-bind` 的缩写写（也就是 `:title="..."`）。',
          '',
          '检查项会读 `button` 的 `title` 属性。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const tip = ref('这是提示')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b">悬停看看</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const tip = ref('这是提示')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" :title="tip">悬停看看</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(attr(".b", "title"), "这是提示", "title 绑上了")',
          'eq(text(".b"), "悬停看看", "按钮文字没被改动")'
        ],
        hints: [
          '写法是 `:title="tip"`，冒号是 `v-bind:` 的缩写。',
          '属性绑定的引号里放的是**表达式**，直接写变量名 `tip` 就行（不用加 `{{ }}`）。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '一个组件三段：`<script setup>` 定数据与函数，`<template>` 画结构，`<style scoped>` 管自己的样式。',
          '`ref()` 包起来的值改了会重新渲染；模板里读它不用 `.value`，脚本里读它必须写 `.value`。',
          '',
          '下一章讲 `ref` 的搭档 `reactive`，以及怎么从已有数据算出一个新值（`computed`）。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
