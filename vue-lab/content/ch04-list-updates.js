/* ch04 — 列表的增删改：v-for 画出来的列表，怎么加一条、删一条、改一条。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch04
 *   node tools/verify-browser.mjs --chapter ch04
 *
 * 本章的坑句在 Vue 3 里与 Vue 2 不同（已用无头 Edge 实测）：
 *   items.value[0] = x        → 页面会更新
 *   items.value.length = 0    → 页面会更新
 *   items[0] = x（漏 .value） → 页面不变，也不报错
 *   items.length = 0（漏 .value）→ 页面不变，也不报错
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch04',
    title: '第 4 章 · 列表的增删改',
    goal: '给一个 v-for 列表加上增、删、改，并且能一眼看出哪一句改完页面上不会动。',
    sections: [
      {
        kind: 'prose',
        md: [
          '`v-for` 把一个数组画成列表。列表不是摆设，它要变：加一条、删一条、改一条。',
          '',
          '改列表有两类写法：',
          '',
          '- **原地改**：`items.value.push(x)`、`items.value.splice(i, 1)` —— 直接动原来那个数组。',
          '- **整体替换**：`items.value = items.value.filter(...)` —— 算出一个新数组，赋回去。',
          '',
          '这两种都能触发更新。真正让新手卡住的是第三种：句子写错了，运行不报错，页面上也看不出变化。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '列表放在 `ref` 里的时候，动它得走 `items.value`。少写 `.value`，`items[0] = x` 改的是 `items` 这个对象上的一个属性，不是数组里的元素 —— 页面不会重画，控制台也不报错。'
      },
      {
        kind: 'demo',
        caption: '同一件事写两遍：看不见变化的那遍，和看得见的那遍',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const a = ref([',
          "  { id: 1, name: '牛奶', done: false },",
          "  { id: 2, name: '鸡蛋', done: false }",
          '])',
          'const b = ref([',
          "  { id: 1, name: '牛奶', done: false },",
          "  { id: 2, name: '鸡蛋', done: false }",
          '])',
          '',
          'function wrongA() {',
          '  a[0] = { id: 1, name: \'牛奶\', done: true }',
          '}',
          '',
          'function rightB() {',
          '  b.value.splice(0, 1, { id: 1, name: \'牛奶\', done: true })',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="h">写法一：a[0] = ...（漏了 .value）</p>',
          '  <ul>',
          '    <li v-for="item in a" :key="item.id" class="ta">{{ item.name }} {{ item.done }}</li>',
          '  </ul>',
          '  <button class="ba" @click="wrongA">改写法一</button>',
          '',
          '  <p class="h">写法二：b.value.splice(0, 1, ...)</p>',
          '  <ul>',
          '    <li v-for="item in b" :key="item.id" class="tb">{{ item.name }} {{ item.done }}</li>',
          '  </ul>',
          '  <button class="bb" @click="rightB">改写法二</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".ta"), "牛奶 false", "写法一初始")',
          'eq(text(".tb"), "牛奶 false", "写法二初始")',
          'click(".ba"); await tick();',
          'eq(text(".ta"), "牛奶 false", "写法一点完，页面还是老样子")',
          'click(".bb"); await tick();',
          'eq(text(".tb"), "牛奶 true", "写法二点完，页面变了")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `arr[i] = x` 到底改得动页面吗',
          '',
          '网上老资料说「`arr[i] = x` 和 `arr.length = 0` 改不动页面」，那是 Vue 2 的事。',
          'Vue 3 换成了 `Proxy`，这两句本身能触发更新。',
          '',
          '在 Vue 3 里看不见变化，基本是漏了 `.value`。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['这一句', 'Vue 3 里页面会变吗'],
        rows: [
          ['`items.value[0] = x`', '会'],
          ['`items.value.length = 0`', '会'],
          ['`items[0] = x`（漏了 `.value`）', '不会'],
          ['`items.length = 0`（漏了 `.value`）', '不会']
        ]
      },
      {
        kind: 'demo',
        caption: '加一条：push 到末尾',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶' }",
          '])',
          'let next = 2',
          '',
          'function add() {',
          "  items.value.push({ id: next, name: '第 ' + next + ' 项' })",
          '  next++',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">{{ item.name }}</li>',
          '  </ul>',
          '  <button class="add" @click="add">添加</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 1, "初始一条")',
          'click(".add"); await tick();',
          'eq(count(".it"), 2, "点一次变两条")',
          'eq(text(".it:last-child"), "第 2 项", "新项在末尾")'
        ]
      },
      {
        kind: 'demo',
        caption: '删一条：filter 出一个新数组，整体赋回去',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶' },",
          "  { id: 2, name: '鸡蛋' },",
          "  { id: 3, name: '面包' }",
          '])',
          '',
          'function remove(id) {',
          '  items.value = items.value.filter(item => item.id !== id)',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">',
          '      <span class="nm">{{ item.name }}</span>',
          '      <button class="del" @click="remove(item.id)">删</button>',
          '    </li>',
          '  </ul>',
          '  <p class="n">还剩 {{ items.length }} 条</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 3, "初始三条")',
          'click(".del"); await tick();',
          'eq(count(".it"), 2, "删掉一条")',
          'eq(text(".nm"), "鸡蛋", "第一条换成了鸡蛋")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 改一条：原地改，还是整体替换',
          '',
          '要改列表里的某一条，两种都行：',
          '',
          '- 原地改属性：`items.value[0].done = true`。Vue 3 的表里能追到对象属性，页面会更新。',
          '- 整体替换：用 `map` 算出一个新数组，赋回 `items.value`。原数组没被动过。',
          '',
          '需要把列表原样交出去（比如当 `props` 往下传）的时候，整体替换更稳：拿到的是一份新的，不会被别处顺手改掉。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '改一条：map 整体替换',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶', done: false },",
          "  { id: 2, name: '鸡蛋', done: false }",
          '])',
          '',
          'function mark(id) {',
          '  items.value = items.value.map(item =>',
          '    item.id === id ? { id: item.id, name: item.name, done: true } : item',
          '  )',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">{{ item.name }}-{{ item.done }}</li>',
          '  </ul>',
          '  <button class="b" @click="mark(1)">勾上牛奶</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".it"), "牛奶-false", "初始未勾")',
          'click(".b"); await tick();',
          'eq(text(".it"), "牛奶-true", "换掉整条之后")',
          'eq(count(".it"), 2, "只换一条，条数不变")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-1',
        title: '加一条到列表末尾',
        task: [
          '列表里现在只有一条。请把 `add()` 补上：每点一次「添加」，就往 `items` 末尾加一条新数据。',
          '',
          '要求：',
          '',
          '- 新的一条 `id` 用当前的 `next`，`name` 是 `第 N 项`（N 就是那个 `next`）。',
          '- 加完把 `next` 加一，下一次的编号就跟着走。',
          '- 用 `push` 加。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶' }",
          '])',
          'let next = 2',
          '',
          'function add() {',
          '  // TODO：加一条，然后 next 加一',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">{{ item.name }}</li>',
          '  </ul>',
          '  <button class="add" @click="add">添加</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶' }",
          '])',
          'let next = 2',
          '',
          'function add() {',
          "  items.value.push({ id: next, name: '第 ' + next + ' 项' })",
          '  next++',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">{{ item.name }}</li>',
          '  </ul>',
          '  <button class="add" @click="add">添加</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 1, "初始一条")',
          'click(".add"); await tick();',
          'eq(count(".it"), 2, "加一条变两条")',
          'click(".add"); await tick();',
          'eq(text(".it:last-child"), "第 3 项", "最后一条是第 3 项")'
        ],
        hints: [
          '往数组末尾加东西用 `items.value.push(...)`。',
          '新对象写成 `{ id: next, name: \'第 \' + next + \' 项\' }`，加完别忘了 `next++`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-2',
        title: '删掉点的那一条',
        task: [
          '每一行右边有个「删」按钮。请把 `remove(id)` 写完：点谁，就把 `id` 是它的那一条从列表里去掉。',
          '',
          '- 点第一行的「删」，页面上不该再有「牛奶」。',
          '- 剩下的顺序要原样，别打乱。',
          '',
          '整体替换（`filter`）和原地删（`splice`）都可以。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶' },",
          "  { id: 2, name: '鸡蛋' },",
          "  { id: 3, name: '面包' }",
          '])',
          '',
          'function remove(id) {',
          '  // TODO：把 id 对应的那一条删掉',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">',
          '      <span class="nm">{{ item.name }}</span>',
          '      <button class="del" @click="remove(item.id)">删</button>',
          '    </li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶' },",
          "  { id: 2, name: '鸡蛋' },",
          "  { id: 3, name: '面包' }",
          '])',
          '',
          'function remove(id) {',
          '  items.value = items.value.filter(item => item.id !== id)',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">',
          '      <span class="nm">{{ item.name }}</span>',
          '      <button class="del" @click="remove(item.id)">删</button>',
          '    </li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 3, "初始三条")',
          'click(".del"); await tick();',
          'eq(count(".it"), 2, "删一条变两条")',
          'eq(text(".nm"), "鸡蛋", "第一条换成了鸡蛋")'
        ],
        hints: [
          '整体替换写成 `items.value = items.value.filter(item => item.id !== id)`。',
          '想原地删就找下标：`const i = items.value.findIndex(item => item.id === id)`，再 `items.value.splice(i, 1)`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-3',
        title: '点一行把它勾上',
        task: [
          '点任意一行，把它那条数据的 `done` 从 `false` 变成 `true`，页面上的 `-false` 要跟着变成 `-true`。',
          '',
          '要求用**整体替换**写：拿 `map` 算出一个新数组赋回 `items.value`，不改原来那条对象。',
          '',
          '- 点一次，勾上。',
          '- 列表条数不变。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶', done: false },",
          "  { id: 2, name: '鸡蛋', done: false }",
          '])',
          '',
          'function mark(id) {',
          '  // TODO：用 map 换出一个新数组，把 id 这条的 done 变 true',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it" @click="mark(item.id)">',
          '      {{ item.name }}-{{ item.done }}',
          '    </li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶', done: false },",
          "  { id: 2, name: '鸡蛋', done: false }",
          '])',
          '',
          'function mark(id) {',
          '  items.value = items.value.map(item =>',
          '    item.id === id ? { id: item.id, name: item.name, done: true } : item',
          '  )',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it" @click="mark(item.id)">',
          '      {{ item.name }}-{{ item.done }}',
          '    </li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".it"), "牛奶-false", "初始未勾")',
          'click(".it"); await tick();',
          'eq(text(".it"), "牛奶-true", "点完变成 true")',
          'eq(count(".it"), 2, "条数不变")'
        ],
        hints: [
          '整体替换的骨架：`items.value = items.value.map(item => ...)`。',
          'map 的回调里判断 `item.id === id`：是就返回一个新对象 `{ id: item.id, name: item.name, done: true }`，不是就原样返回 `item`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-4',
        title: '点了页面不变，哪句错了',
        task: [
          '这个按钮点了页面上没有任何变化，控制台也不报错。原因在 `mark()` 里那一句。',
          '',
          '请把它改成能看出变化的写法，用 `splice` 换掉整条：',
          '',
          '- 点一次，「牛奶-false」要变成「牛奶-true」。',
          '- 只换一条，条数保持两条。',
          '',
          '先想想漏了什么，再动手。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶', done: false },",
          "  { id: 2, name: '鸡蛋', done: false }",
          '])',
          '',
          'function mark() {',
          "  items[0] = { id: 1, name: '牛奶', done: true }",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">{{ item.name }}-{{ item.done }}</li>',
          '  </ul>',
          '  <button class="b" @click="mark">勾上牛奶</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const items = ref([',
          "  { id: 1, name: '牛奶', done: false },",
          "  { id: 2, name: '鸡蛋', done: false }",
          '])',
          '',
          'function mark() {',
          "  items.value.splice(0, 1, { id: 1, name: '牛奶', done: true })",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul>',
          '    <li v-for="item in items" :key="item.id" class="it">{{ item.name }}-{{ item.done }}</li>',
          '  </ul>',
          '  <button class="b" @click="mark">勾上牛奶</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".it"), "牛奶-false", "初始未勾")',
          'click(".b"); await tick();',
          'eq(text(".it"), "牛奶-true", "点完要变")',
          'eq(count(".it"), 2, "只换一条，条数不变")'
        ],
        hints: [
          '`items` 是 `ref`，动里面的数组要写 `items.value`。原来的 `items[0] = ...` 改的是 `items` 对象自己的属性。',
          '`splice(0, 1, 新对象)` 的意思：从下标 0 起，删掉 1 个，塞进新对象。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '列表能加、能删、能改了。接下来把输入框接上：`v-model` 让表单和 `ref` 互相同步，下一章讲。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
