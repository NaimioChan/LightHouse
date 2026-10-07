/* ch07 — 组件的 props：同文件里定义子组件、props 接收、只读、类型与默认值、:prop 动态传值。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch07
 *   node tools/lib/probe-chapter.mjs ch07
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch07',
    title: '第 7 章 · 组件的 props',
    goal: '能在同一个文件里写出子组件，用 props 接收父组件传下来的数据，并分清哪些能改、哪些只能读。',
    sections: [
      {
        kind: 'prose',
        md: [
          '父组件把数据交给子组件，走的是 `props`。数据从父流向子，子组件接到之后只负责显示或加工。',
          '',
          '这一章先解决「同一个文件里怎么写出一个子组件」，再讲怎么声明和接收 props，最后讲哪些能改、哪些只能读。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 一个文件里也能有子组件',
          '',
          '平时一个 `.vue` 文件就是一个组件，子组件写在别的文件里。训练场里每道题只有一个文件，所以子组件用**对象字面量**写：',
          '',
          '- `props` 列出它能接收哪些数据。',
          '- `template` 是一个字符串，写它的结构。完整构建会把这段字符串编译成渲染函数。',
          '',
          '把这个对象赋给一个变量，模板里就能把这个变量当标签用。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '子组件接收父组件写死的值',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Tag = {',
          "  props: ['label'],",
          "  template: '<span class=\"tag\">{{ label }}</span>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Tag label="新" />',
          '  <Tag label="热" />',
          '</template>',
          '',
          '<style>',
          '.tag { display: inline-block; padding: 1px 8px; margin-right: 6px; border: 1px solid rgb(170, 170, 170); border-radius: 3px; }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(count(".tag"), 2, "父组件写了两处 Tag")',
          'eq(text(".tag"), "新", "第一处的 label 显示出来了")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 父组件把值写在标签上',
          '',
          '`<Tag label="新" />` 里的 `label="新"` 就是一次传值。子组件在 `props` 里写了 `label`，才拿得到这个字符串。',
          '',
          '没写进 `props` 的属性不会报错，它们会落到子组件的根元素上，但模板里读不到。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## `defineProps`：声明本组件接收什么',
          '',
          '`<script setup>` 里用 `defineProps()` 声明 props。它是一个宏，不用 import，编译时就被处理掉。',
          '',
          '传一个对象可以写类型与默认值。类型用 `String` / `Number` / `Boolean` / `Array` / `Object` / `Function`。',
          '',
          '**数组和对象的默认值必须写成函数**，每个实例都要拿到自己的一份。',
          '',
          '训练场里的练习没有外层父组件，所以下面这两个 prop 都落到默认值。真实项目里父组件这样传：`<Card title="通知" :count="3" />`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'defineProps 的类型与默认值',
        code: [
          '<scr' + 'ipt setup>',
          'const props = defineProps({',
          "  title: { type: String, default: '未命名' },",
          '  count: { type: Number, default: 0 }',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="t">{{ title }}</p>',
          '  <p class="c">count 加一等于 {{ props.count + 1 }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".t"), "未命名", "没有传 title，落到默认值")',
          'eq(text(".c"), "count 加一等于 1", "数字类型与默认值都对")'
        ]
      },
      {
        kind: 'table',
        head: ['要接收的东西', '`defineProps()` 里怎么写', '子组件的 `props` 选项'],
        rows: [
          ['字符串', '`{ name: String }`', '`{ name: String }`'],
          ['数字，带默认值', '`{ n: { type: Number, default: 0 } }`', '同左'],
          ['数组', '`{ list: { type: Array, default: () => [] } }`', '同左'],
          ['对象', '`{ user: { type: Object, default: () => ({}) } }`', '同左']
        ]
      },
      {
        kind: 'prose',
        md: [
          '子组件写成对象字面量时，接收数据用 `props` 选项，写法和 `defineProps()` 完全一致。上表两列可以互换着看。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 传变量要加冒号',
          '',
          '`msg="你好"` 传的是死字符串。父组件的变量 `word` 后来变成别的值，子组件那边一点不动。',
          '',
          '要传变量就写成 `:msg="word"`，那个冒号是 `v-bind:` 的缩写。父组件的变量一变，子组件拿到的值跟着变。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: ':prop 传动态值，子组件跟着变',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Counter = {',
          '  props: { start: { type: Number, default: 0 } },',
          "  template: '<span class=\"v\">{{ start }}</span> <button class=\"b\" @click=\"start++\">子组件想加一</button>'",
          '}',
          '',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Counter :start="n" />',
          '  <button class="up" @click="n++">父组件加一</button>',
          '  <p class="out">父组件的 n 是 {{ n }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".v"), "0", "初始跟着父组件的 n")',
          'click(".b"); await tick();',
          'eq(text(".v"), "0", "子组件直接改 prop 没有生效")',
          'click(".up"); await tick();',
          'eq(text(".v"), "1", "父组件一改，子组件就跟着变")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: 'props 是**只读**的。子组件直接改 prop，Vue 会把它拦下来，值不变。要改就在子组件自己的本地状态里改：把 prop 拷进 `data` 或 `ref`，或者用 `emit` 请父组件改（下一章讲）。'
      },
      {
        kind: 'prose',
        md: [
          '## 数组与对象的 props',
          '',
          '类型是 `Array` 或 `Object` 的 prop，默认值写成工厂函数：`default: () => []`。',
          '',
          '直接写 `default: []` 会让所有实例共用同一个数组，一个实例改了别的也跟着变，Vue 不允许这么写。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '数组与对象类型的 props',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Panel = {',
          '  props: {',
          "    tags: { type: Array, default: () => ['未分类'] },",
          "    user: { type: Object, default: () => ({ name: '游客' }) }",
          '  },',
          "  template: '<p class=\"tags\">{{ tags.join(\\'，\\') }}</p><p class=\"who\">{{ user.name }}</p>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Panel />',
          "  <Panel :tags=\"['前端', 'Vue']\" :user=\"{ name: '非茗' }\" />",
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".tags"), "未分类", "没传 tags 就用工厂返回的默认数组")',
          'eq(text(".who"), "游客", "没传 user 就用默认对象")',
          'eq($$(".tags")[1].textContent.trim(), "前端，Vue", "传进去的数组拼起来")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-1',
        title: '把 label 声明成 prop',
        task: [
          '子组件 `Badge` 已经被父组件传了 `label="新"`，但它没把 `label` 列进 `props`，页面上只显示一个空的 `span`。',
          '',
          '请给 `Badge` 补上 `props`，用**数组写法**声明它接收 `label`（也就是 `props: [\'label\']`）。',
          '',
          '改完页面上应该出现 `新` 这个字。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Badge = {',
          "  template: '<span class=\"badge\">{{ label }}</span>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Badge label="新" />',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Badge = {',
          "  props: ['label'],",
          "  template: '<span class=\"badge\">{{ label }}</span>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Badge label="新" />',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".badge"), "新", "label 显示出来了")',
          'eq(count(".badge"), 1, "页面上只有一个标签")'
        ],
        hints: [
          '子组件要接数据，先在 `props` 里把名字列出来：`props: [\'label\']`。',
          '没列进 `props` 的属性只会落到子组件根元素上，模板里读不到。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-2',
        title: '用 :prop 传变量',
        task: [
          '父组件里有一个 `word`，初始是 `你好`，点按钮之后变成 `再见`。',
          '',
          '现在子组件写的是 `msg="你好"`，传的是死字符串，`word` 变了它也不会动。',
          '',
          '请改成传变量，让子组件跟着 `word` 变：点一次按钮，子组件里的字从 `你好` 变成 `再见`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  props: ['msg'],",
          "  template: '<p class=\"out\">{{ msg }}</p>'",
          '}',
          '',
          "const word = ref('你好')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child msg="你好" />',
          '  <button class="go" @click="word = \'再见\'">换一句</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  props: ['msg'],",
          "  template: '<p class=\"out\">{{ msg }}</p>'",
          '}',
          '',
          "const word = ref('你好')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child :msg="word" />',
          '  <button class="go" @click="word = \'再见\'">换一句</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "你好", "初始显示你好")',
          'click(".go"); await tick();',
          'eq(text(".out"), "再见", "点按钮后子组件跟着变")'
        ],
        hints: [
          '静态属性传的是死字符串：`msg="你好"`。',
          '要传变量就在属性名前加冒号：`:msg="word"`，冒号是 `v-bind:` 的缩写。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-3',
        title: '只读的 prop，别去改它',
        task: [
          '子组件 `Counter` 拿到一个 prop `start`。它想自己数数：点一次按钮加一。',
          '',
          '现在它直接写 `@click="start++"`，改的是 prop，Vue 会拦下来，数字根本不动。',
          '',
          '请把 `start` 拷进子组件**自己的本地状态**，在本地状态上加一。数字从传进来的 `3` 开始，点一次变 `4`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Counter = {',
          '  props: { start: { type: Number, default: 0 } },',
          "  template: '<span class=\"v\">{{ start }}</span> <button class=\"b\" @click=\"start++\">加一</button>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Counter :start="3" />',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Counter = {',
          '  props: { start: { type: Number, default: 0 } },',
          '  data() {',
          '    return { n: this.start }',
          '  },',
          "  template: '<span class=\"v\">{{ n }}</span> <button class=\"b\" @click=\"n++\">加一</button>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Counter :start="3" />',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".v"), "3", "初始是传进来的 3")',
          'click(".b"); await tick();',
          'eq(text(".v"), "4", "点一次变成 4")'
        ],
        hints: [
          'prop 只读，直接改它值不变。',
          '把 prop 拷进本地状态再改：`data() { return { n: this.start } }`，模板里用 `n`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-4',
        title: '给数组 prop 一个工厂默认值',
        task: [
          '子组件 `List` 接收一个数组 `items`，模板里显示 `共 N 项`。',
          '',
          '页面上有两个 `List`：第一个什么也没传，要用默认值；第二个传了 `[\'苹果\', \'梨\']`。',
          '',
          '请用对象写法声明 `items`：类型 `Array`，默认值用工厂函数返回一个空数组。',
          '',
          '现在第一个 `List` 没有默认值，`items` 是 `undefined`，一读 `items.length` 就报错。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const List = {',
          '  props: { items: { type: Array } },',
          "  template: '<p class=\"list\">共 {{ items.length }} 项</p>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <List />',
          "  <List :items=\"['苹果', '梨']\" />",
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const List = {',
          '  props: { items: { type: Array, default: () => [] } },',
          "  template: '<p class=\"list\">共 {{ items.length }} 项</p>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <List />',
          "  <List :items=\"['苹果', '梨']\" />",
          '</template>'
        ].join('\n'),
        tests: [
          'eq($$(".list").length, 2, "两个列表都渲染出来")',
          'eq(text(".list"), "共 0 项", "没传 items 时用默认的空数组")',
          'eq($$(".list")[1].textContent.trim(), "共 2 项", "传进去的数组有两项")'
        ],
        hints: [
          '数组和对象的 `default` 要写成函数：`default: () => []`。',
          '直接写 `default: []` 会让所有实例共用同一个数组，Vue 不允许。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
