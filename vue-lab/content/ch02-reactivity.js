/* ch02 — 响应式的两种写法：reactive 管对象、ref 管单值，computed 从已有数据算新值。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch02
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch02',
    title: '第 2 章 · 响应式的两种写法',
    goal: '学会用 reactive 存一组数据、用 ref 存单个值，并用 computed 从已有数据算出新值。',
    sections: [
      {
        kind: 'prose',
        md: [
          '第 1 章用 `ref()` 包一个数字。数据变多之后，一个个包成 `ref` 会很啰嗦，',
          '这时候用 `reactive()` 把整组数据包成一个对象。',
          '',
          '- `ref(值)` —— 什么都能存，脚本里读写要走 `.value`。',
          '- `reactive(对象)` —— 只包对象或数组，脚本里直接改属性，不写 `.value`。',
          '',
          '两者在模板里的读法是一样的，都不用写 `.value`。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['', '`ref`', '`reactive`'],
        rows: [
          ['存什么', '任意值', '只能是对象或数组'],
          ['脚本里读', '`n.value`', '`obj.key`'],
          ['模板里读', '`n`', '`obj.key`']
        ]
      },
      {
        kind: 'demo',
        caption: 'reactive 改属性，页面跟着变',
        code: [
          '<scr' + 'ipt setup>',
          "import { reactive } from 'vue'",
          '',
          "const cart = reactive({ name: '苹果', qty: 1 })",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="row">{{ cart.name }} x {{ cart.qty }}</p>',
          '  <button class="add" @click="cart.qty++">加一件</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".row"), "苹果 x 1", "初始")',
          'click(".add"); await tick();',
          'eq(text(".row"), "苹果 x 2", "改 reactive 的属性会重新渲染")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 脚本里改数据，两种写法不一样',
          '',
          '`reactive` 返回的是一个代理对象，直接改属性就行。`ref` 返回的是一个盒子，',
          '在脚本里读写它的值必须走 `.value`。忘了写 `.value`，改的就是盒子本身，页面不动。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'ref 与 reactive 一起用',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, reactive } from 'vue'",
          '',
          'const hits = ref(0)',
          "const state = reactive({ marks: 0 })",
          '',
          'function bump() {',
          '  hits.value++',
          '  state.marks++',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" @click="bump">点我</button>',
          '  <p class="refs">ref 里是 {{ hits }}</p>',
          '  <p class="rea">reactive 里是 {{ state.marks }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".refs"), "ref 里是 0", "初始 ref")',
          'eq(text(".rea"), "reactive 里是 0", "初始 reactive")',
          'click(".b"); await tick();',
          'eq(text(".refs"), "ref 里是 1", "ref 在脚本里要写 .value")',
          'eq(text(".rea"), "reactive 里是 1", "reactive 直接改属性")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`reactive()` 只接对象和数组。要整体换掉一份数据（比如拿回一个新对象），用 `ref` 把对象包起来，写成 `n.value = 新对象`。'
      },
      {
        kind: 'prose',
        md: [
          '## `computed`：从已有数据算出新值',
          '',
          '总价、面积、全名这类值不用单独存，它们能由别的数据推出来。',
          '把这些推导写进 `computed(() => ...)`，它就是会跟着更新的派生值。',
          '',
          '`computed` 返回的也是一个 `ref`，脚本里读它要写 `.value`，模板里直接写名字。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'computed 算出派生值',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const price = ref(100)',
          'const qty = ref(3)',
          '',
          'const total = computed(() => price.value * qty.value)',
          'const avg = computed(() => total.value / qty.value)',
          '',
          'function half() {',
          '  price.value = price.value / 2',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="total">总价 {{ total }}</p>',
          '  <p class="avg">单价 {{ avg }}</p>',
          '  <button class="half" @click="half">打五折</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".total"), "总价 300", "初始总价")',
          'eq(text(".avg"), "单价 100", "初始单价")',
          'click(".half"); await tick();',
          'eq(text(".total"), "总价 150", "打折后总价")',
          'eq(text(".avg"), "单价 50", "avg 跟着 total 一起变")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `computed` 比普通函数好在有缓存',
          '',
          '普通函数每次调用都从头算一遍。`computed` 会记住上次的结果：',
          '依赖没变，读多少次都返回同一个缓存，不重算；依赖变了，才重新算一次。',
          '',
          '下面这个组件同时读两次 `computed`、调两次普通函数，看看各执行了几次。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'computed 只算一次，函数每次都算',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const n = ref(1)',
          'const rerender = ref(0)',
          '',
          'let cmpRuns = 0',
          'let fnRuns = 0',
          '',
          'const doubled = computed(() => {',
          '  cmpRuns++',
          '  return n.value * 2',
          '})',
          '',
          'function doubledFn() {',
          '  fnRuns++',
          '  return n.value * 2',
          '}',
          '',
          'function useBoth() {',
          '  doubled.value',
          '  doubled.value',
          '  doubledFn()',
          '  doubledFn()',
          '  rerender.value++',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="v">值 {{ doubled }}</p>',
          '  <button class="run" @click="useBoth">读两次</button>',
          '  <p class="cmp">computed 执行 {{ cmpRuns }} 次</p>',
          '  <p class="fn">函数执行 {{ fnRuns }} 次</p>',
          '  <span class="seed" style="display:none">{{ rerender }}</span>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".cmp"), "computed 执行 1 次", "首次渲染读了一次")',
          'eq(text(".fn"), "函数执行 0 次", "函数还没被调用")',
          'click(".run"); await tick();',
          'eq(text(".cmp"), "computed 执行 1 次", "再读两次还是缓存")',
          'eq(text(".fn"), "函数执行 2 次", "函数每调用一次就算一次")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`computed()` 默认只读，只拿它的值，别把它当普通 `ref` 去赋值。'
      },
      {
        kind: 'exercise',
        id: 'ex02-1',
        title: '把普通对象改成 reactive',
        task: [
          '这个组件的 `state` 是普通对象，点了按钮数字不变。',
          '',
          '请把 `state` 改成 `reactive` 包起来的对象，让按钮上的次数跟着点。',
          '',
          '改完之后：初始显示 `点了 0 次`，每点一次加一。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { reactive } from 'vue'",
          '',
          'const state = { count: 0 }',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" @click="state.count++">点了 {{ state.count }} 次</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { reactive } from 'vue'",
          '',
          'const state = reactive({ count: 0 })',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" @click="state.count++">点了 {{ state.count }} 次</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".b"), "点了 0 次", "初始")',
          'click(".b"); await tick();',
          'eq(text(".b"), "点了 1 次", "点一次页面要更新")',
          'eq(count(".b"), 1, "页面上只有一个按钮")'
        ],
        hints: [
          '`reactive()` 已经 import 进来了，把对象包进去：`reactive({ count: 0 })`。',
          '包起来之后，`state.count++` 才会触发重新渲染。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-2',
        title: '在函数里改 ref，别忘了 .value',
        task: [
          '按钮上要显示点赞数，`hits` 是 `ref`，`state.label` 是 `reactive` 里的字。',
          '',
          '请在 `add` 函数里让 `hits` 加一。点了按钮，数字要从 `0` 变 `1`。',
          '',
          '注意：在 `<script setup>` 里读写 `ref` 要写 `.value`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, reactive } from 'vue'",
          '',
          'const hits = ref(0)',
          "const state = reactive({ label: '赞' })",
          '',
          'function add() {',
          '  // TODO: 让 hits 加一',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" @click="add">{{ state.label }} {{ hits }}</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, reactive } from 'vue'",
          '',
          'const hits = ref(0)',
          "const state = reactive({ label: '赞' })",
          '',
          'function add() {',
          '  hits.value++',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" @click="add">{{ state.label }} {{ hits }}</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".b"), "赞 0", "初始")',
          'click(".b"); await tick();',
          'eq(text(".b"), "赞 1", "点一次")',
          'eq(count(".b"), 1, "仍是一个按钮")'
        ],
        hints: [
          '`ref` 在脚本里是盒子，写 `hits.value++`。',
          '`state.label` 来自 `reactive`，直接读属性，不用 `.value`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-3',
        title: '用 computed 算面积',
        task: [
          '宽 `w` 高 `h` 会变，面积要跟着变。现在 `area` 是一个普通变量，只算了一次。',
          '',
          '请把 `area` 改成 `computed`，让它跟着 `w`、`h` 自动重算。',
          '',
          '初始 `4 x 3` 显示 `面积 12`；加宽一次后显示 `面积 15`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const w = ref(4)',
          'const h = ref(3)',
          'const area = w.value * h.value',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="a">面积 {{ area }}</p>',
          '  <button class="grow" @click="w++">加宽</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const w = ref(4)',
          'const h = ref(3)',
          'const area = computed(() => w.value * h.value)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="a">面积 {{ area }}</p>',
          '  <button class="grow" @click="w++">加宽</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".a"), "面积 12", "初始")',
          'click(".grow"); await tick();',
          'eq(text(".a"), "面积 15", "加宽之后要重算")',
          'eq(count("p"), 1, "只留一个 p")'
        ],
        hints: [
          '`w.value * h.value` 只是那一行算了一次的快照，之后不会更新。',
          '换成 `computed(() => w.value * h.value)`，依赖变了它自己重算。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-4',
        title: '小计与合计都用 computed',
        task: [
          '`price` 是单价，`qty` 是件数。小计是 `price * qty`，合计是小计再加 `8` 元运费。',
          '',
          '现在 `subtotal` 与 `total` 都是写死的数字，加一件不会变。',
          '',
          '请用两个 `computed` 把它们算出来，`total` 基于 `subtotal`。',
          '',
          '初始显示 `小计 100`、`合计 108`；加一件后显示 `小计 150`、`合计 158`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const price = ref(50)',
          'const qty = ref(2)',
          '',
          'const subtotal = 100',
          'const total = 108',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="s">小计 {{ subtotal }}</p>',
          '  <p class="t">合计 {{ total }}</p>',
          '  <button class="inc" @click="qty++">加一件</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const price = ref(50)',
          'const qty = ref(2)',
          '',
          'const subtotal = computed(() => price.value * qty.value)',
          'const total = computed(() => subtotal.value + 8)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="s">小计 {{ subtotal }}</p>',
          '  <p class="t">合计 {{ total }}</p>',
          '  <button class="inc" @click="qty++">加一件</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".s"), "小计 100", "初始小计")',
          'eq(text(".t"), "合计 108", "初始合计")',
          'click(".inc"); await tick();',
          'eq(text(".s"), "小计 150", "加一件后小计要变")',
          'eq(text(".t"), "合计 158", "合计跟着小计一起变")'
        ],
        hints: [
          '先写 `const subtotal = computed(() => price.value * qty.value)`。',
          '`total` 再基于 `subtotal`：`computed(() => subtotal.value + 8)`，读 computed 也要 `.value`。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 什么时候用哪个',
          '',
          '单个值用 `ref`，成组的数据用 `reactive`。能由已有数据推出来的值一律用 `computed`：',
          '名字清楚，还会缓存，依赖没变就不重算。',
          '',
          '下一章讲模板里的 `v-if` 与 `v-for`，把数据和结构接起来。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
