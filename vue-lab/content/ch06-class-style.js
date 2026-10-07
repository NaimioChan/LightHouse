/* ch06 — 样式与 class：:class 的对象与数组语法、:style 的对象语法、scoped 的作用范围。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch06
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch06',
    title: '第 6 章 · 样式与 class',
    goal: '能按数据切换元素的 class、用数据算出元素的 style，并知道 scoped 样式会落在哪些元素上。',
    sections: [
      {
        kind: 'prose',
        md: [
          '`:class` 与 `:style` 是 `v-bind` 在 `class` 和 `style` 两个属性上的特化写法。',
          '它们比普通 `v-bind` 多做一件事：把静态部分与动态部分**合起来**，而不是谁覆盖谁。',
          '',
          '- `:class` 的值可以是**对象** `{ active: isOn }`，也可以是**数组** `[a, b]`。',
          '- `:style` 的值是一个**对象**，键是 CSS 属性名（驼峰写法），值是要算出来的值。',
          '',
          '静态的 `class="btn"` 照常写，动态的就写在 `:class` 上。下面这个按钮两者都写了。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '对象语法与数组语法各做一次',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const isOn = ref(false)',
          "const size = ref('big')",
          "const tone = ref('warn')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="btn" :class="{ active: isOn }" @click="isOn = !isOn">{{ isOn ? \'开\' : \'关\' }}</button>',
          '  <p class="tag" :class="[size, tone]">标签</p>',
          '</template>',
          '',
          '<style scoped>',
          '.btn { padding: 4px 10px; }',
          '.active { color: rgb(200, 40, 40); }',
          '.big { font-size: 20px; }',
          '.warn { font-weight: 700; }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(attr(".btn", "class"), "btn", "对象语法：isOn 是 false 时不加 active")',
          'click(".btn"); await tick();',
          'eq(attr(".btn", "class"), "btn active", "对象语法：改成 true 后加上 active")',
          'eq(style(".btn", "color"), "rgb(200, 40, 40)", "active 的样式真的生效")',
          'eq(attr(".tag", "class"), "tag big warn", "数组语法把两项都拼上")',
          'eq(style(".tag", "fontWeight"), "700", "数组里的 warn 生效")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 对象还是数组，看你要表达什么',
          '',
          '对象语法适合「**满足某个条件就加这个 class**」，对象的键是 class 名，值是布尔表达式。',
          '值为假的键会被丢掉，所以 `{ active: isOn }` 在 `isOn` 是 `false` 时一个 class 也不加。',
          '',
          '数组语法适合「**把几个变量里的 class 名拼一拼**」，数组元素可以夹对象，两种写法能混用。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['写法', '结果（按上面的变量）', '用在哪'],
        rows: [
          ['`{ active: isOn }`', '`isOn` 为真时加 `active`', '按条件开关一个 class'],
          ['`[size, tone]`', '`big warn`', '把多个变量里的名字拼起来'],
          ['`[base, { active: isOn }]`', '数组里夹对象，两种混用', '静态名加条件']
        ]
      },
      {
        kind: 'demo',
        caption: ':style 的对象语法',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const w = ref(120)',
          'const hot = ref(true)',
          "const tone = ref({ backgroundColor: 'rgb(226, 236, 247)' })",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="bar" :style="{ width: w + \'px\', backgroundColor: hot ? \'rgb(230, 90, 70)\' : \'rgb(210, 210, 210)\' }">宽度与颜色都来自数据</p>',
          '  <p class="chip" :style="tone">整个对象绑进去</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(style(".bar", "backgroundColor"), "rgb(230, 90, 70)", "三元表达式选中了暖色")',
          'eq(style(".bar", "width"), "120px", "宽度是数据拼出来的")',
          'eq(style(".chip", "backgroundColor"), "rgb(226, 236, 247)", "style 也能绑一个对象变量")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '`:style` 里 CSS 属性名写成**驼峰**：`backgroundColor`、`fontSize`、`borderTopColor`。',
          '值必须带单位，`width: w` 不生效，要写成 `width: w + \'px\'`。',
          '',
          '它也可以直接绑一个对象变量，像上面 `.chip` 那样。对象里有什么属性，元素上就加什么。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'class 与 style 也能写成 v-bind',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const on = ref(false)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="cell" v-bind:class="{ on: on }">用 v-bind 写 class</p>',
          '  <p class="cell c2" v-bind:style="{ color: \'rgb(20, 120, 70)\' }">用 v-bind 写 style</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(attr(".cell", "class"), "cell", "v-bind:class 与 :class 等价")',
          'eq(attr(".c2", "class"), "cell c2", "两个 class 都在，没被覆盖")',
          'eq(style(".c2", "color"), "rgb(20, 120, 70)", "v-bind:style 与 :style 等价")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`:class` 是 `v-bind:class` 的缩写，`:style` 是 `v-bind:style` 的缩写。两种写法一个字都不差，习惯上用缩写。'
      },
      {
        kind: 'prose',
        md: [
          '## scoped 只管自己的元素',
          '',
          '`<style scoped>` 编译时，Vue 会给这个组件的每个元素挂一个 `data-v-` 开头的属性，',
          '再把这些属性加进选择器，让规则只命中本组件的元素。',
          '',
          '下面这个组件的样式怎么写都只影响它自己，页面上别的元素不受影响。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'scoped 命中自己的元素',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="card">',
          '    <p class="title">卡片标题</p>',
          '    <button class="card-btn" @click="n++">点了 {{ n }} 次</button>',
          '  </div>',
          '</template>',
          '',
          '<style scoped>',
          '.card { padding: 10px; border: 1px solid rgb(210, 210, 210); }',
          '.title { color: rgb(30, 80, 150); font-weight: 700; }',
          '.card-btn { margin-top: 6px; }',
          '</style>'
        ].join('\n'),
        tests: [
          'has(".card", "卡片渲染出来了")',
          'eq(style(".title", "color"), "rgb(30, 80, 150)", "scoped 样式命中了自己的元素")',
          'click(".card-btn"); await tick();',
          'eq(text(".card-btn"), "点了 1 次", "事件照常触发")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: 'scoped 的属性只挂在**本组件模板里写的元素**上。子组件内部渲染出来的元素拿不到，父组件的 scoped 规则打不进去。要用 `:deep(.类名)` 才能往下穿一层。'
      },
      {
        kind: 'exercise',
        id: 'ex06-1',
        title: '点一下切换高亮',
        task: [
          '这个组件里有一个开关值 `isOn`，初始是 `false`。请做两件事：',
          '',
          '1. 给 `button` 加上 `:class`，用**对象语法**把它绑到 `isOn`，class 名是 `on`。',
          '2. 给同一个 `button` 加上 `@click`，点一次把 `isOn` 取反。',
          '',
          '检查项会先读一次 class（此时不该有 `on`），点一下之后再读，应该有 `on`，而且样式要真的变红。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const isOn = ref(false)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="sw">开关</button>',
          '</template>',
          '',
          '<style scoped>',
          '.on { color: rgb(200, 40, 40); }',
          '</style>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const isOn = ref(false)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="sw" :class="{ on: isOn }" @click="isOn = !isOn">开关</button>',
          '</template>',
          '',
          '<style scoped>',
          '.on { color: rgb(200, 40, 40); }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(attr(".sw", "class"), "sw", "初始没有 on")',
          'click(".sw"); await tick();',
          'eq(attr(".sw", "class"), "sw on", "点一下加上 on")',
          'eq(style(".sw", "color"), "rgb(200, 40, 40)", "on 的样式生效")'
        ],
        hints: [
          '对象语法写成 `:class="{ on: isOn }"`，键是 class 名。',
          '取反写在点击处理里：`@click="isOn = !isOn"`。',
          '`class="sw"` 要留着，检查项靠它找元素。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-2',
        title: '把数组里的 class 拼上',
        task: [
          '有两个变量 `size` 和 `tone`，它们的值是 class 名（`big` 和 `warn`）。',
          '请给 `p` 加上 `:class`，用**数组语法**把这两个变量拼进 class。',
          '',
          '拼完之后元素的 class 应该是 `tag big warn` 三个。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const size = ref('big')",
          "const tone = ref('warn')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="tag">标签</p>',
          '</template>',
          '',
          '<style scoped>',
          '.big { font-size: 22px; }',
          '.warn { color: rgb(200, 90, 20); }',
          '</style>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const size = ref('big')",
          "const tone = ref('warn')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="tag" :class="[size, tone]">标签</p>',
          '</template>',
          '',
          '<style scoped>',
          '.big { font-size: 22px; }',
          '.warn { color: rgb(200, 90, 20); }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(attr(".tag", "class"), "tag big warn", "数组里的两项都拼进了 class")',
          'eq(style(".tag", "fontSize"), "22px", "big 生效")',
          'eq(style(".tag", "color"), "rgb(200, 90, 20)", "warn 生效")'
        ],
        hints: [
          '数组语法就是方括号：`:class="[size, tone]"`。',
          '静态的 `class="tag"` 不会被覆盖，Vue 会把它们合起来。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-3',
        title: '用数据算出一个 style',
        task: [
          '有一块进度条 `div.bar`，它的底色与高度要来自数据：`color` 和 `h`。',
          '请给 `div` 加上 `:style`，用对象语法：',
          '',
          '- 底色绑 `color`，属性名写 `backgroundColor`。',
          '- 高度绑 `h`，`h` 是数字，要拼上单位：`h + \'px\'`。',
          '',
          '检查项会读这个元素的**计算样式**。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const color = ref('rgb(210, 230, 245)')",
          'const h = ref(40)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="bar">进度</div>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const color = ref('rgb(210, 230, 245)')",
          'const h = ref(40)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="bar" :style="{ backgroundColor: color, height: h + \'px\' }">进度</div>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".bar"), 1, "页面上有一个 .bar")',
          'eq(style(".bar", "backgroundColor"), "rgb(210, 230, 245)", "backgroundColor 绑上了")',
          'eq(style(".bar", "height"), "40px", "height 是数字拼上 px")'
        ],
        hints: [
          '对象语法写成 `:style="{ backgroundColor: color }"`，键用驼峰。',
          '数字不带单位不生效，写成 `height: h + \'px\'`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-4',
        title: '让样式穿进子组件',
        task: [
          '这个组件里有一个子组件 `Badge`，它自己渲染出一层 `div.wrap`，里面才是 `span.badge`。',
          '父组件的 scoped 样式写了 `.card .badge { color: ... }`，但它**打不进子组件内部**，',
          '因为 `data-v-` 属性只挂在父组件模板里写的元素上。',
          '',
          '请改这条选择器，让红色与加粗真的落到 `span.badge` 上：在 `.card` 与 `.badge` 之间加 `:deep()`，',
          '也就是 `.card :deep(.badge)`。',
          '',
          '检查项会读 `span.badge` 的计算样式。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { defineComponent, h } from 'vue'",
          '',
          'const Badge = defineComponent({',
          "  name: 'Badge',",
          '  setup() {',
          "    return () => h('div', { class: 'wrap' }, [h('span', { class: 'badge' }, '标签')])",
          '  }',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="card">',
          '    <Badge />',
          '  </div>',
          '</template>',
          '',
          '<style scoped>',
          '.card { padding: 8px; }',
          '.card .badge { color: rgb(200, 40, 40); font-weight: 700; }',
          '</style>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { defineComponent, h } from 'vue'",
          '',
          'const Badge = defineComponent({',
          "  name: 'Badge',",
          '  setup() {',
          "    return () => h('div', { class: 'wrap' }, [h('span', { class: 'badge' }, '标签')])",
          '  }',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="card">',
          '    <Badge />',
          '  </div>',
          '</template>',
          '',
          '<style scoped>',
          '.card { padding: 8px; }',
          '.card :deep(.badge) { color: rgb(200, 40, 40); font-weight: 700; }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(count(".badge"), 1, "子组件渲染出一个标签")',
          'eq(style(".badge", "color"), "rgb(200, 40, 40)", "父级样式命中了子组件内部")',
          'eq(style(".badge", "fontWeight"), "700", "加粗也命中")',
          'has(".card", "父组件的卡片还在")'
        ],
        hints: [
          '`:deep()` 写在父级选择器之后：`.card :deep(.badge)`。',
          '`:deep()` 里的选择器不再加 `data-v-`，所以能命中的范围就扩大了。',
          '改完先跑一次，看看红色有没有出现在「标签」两个字上。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
