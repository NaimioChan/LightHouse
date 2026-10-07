/* ch10 — 计算属性与侦听器：可读可写的 computed、computed 与方法的缓存差别、
 * watch 与 watchEffect 该用哪个、以及侦听回调里的 DOM 时机。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch10
 *   node tools/lib/probe-chapter.mjs ch10
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch10',
    title: '第 10 章 · 计算属性与侦听器',
    goal: '能写出可读可写的 computed，能用 watch / watchEffect 在数据变化后做事，并知道什么时候用哪个。',
    sections: [
      {
        kind: 'prose',
        md: [
          '`computed` 前面几章一直在用，但只用了一半：只读的那一半。',
          '它还能**可写**——给它一个 `set`，读它时走 `get`，给它赋值时走 `set`。',
          '',
          '`watch` 与 `watchEffect` 是另一类东西：它们不产出新值，只在**数据变化之后做事**。',
          '存草稿、打日志、改 DOM 这类动作叫副作用，塞不进 `computed`，得用侦听器。',
          '',
          '这一章把这两类工具分开讲清楚，最后给出选择的标准。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 可写的 `computed`：get 与 set',
          '',
          '`computed` 除了接一个函数，还能接一个对象，里面写两个方法：',
          '',
          '- `get()` —— 读这个值时算一次，必须 `return`。',
          '- `set(新值)` —— 给这个值赋值时被调用，参数是赋进来的新值。',
          '',
          '有了 `set`，这个派生值就能像普通 `ref` 一样被写。写进去之后怎么了，由你在 `set` 里决定：',
          '通常是**反向换算**回它依赖的那个原始 `ref`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '可写 computed：改全名时反向写回姓与名',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          "const first = ref('茗')",
          "const last = ref('非')",
          '',
          'const full = computed({',
          '  get() {',
          '    return last.value + first.value',
          '  },',
          '  set(v) {',
          '    const s = String(v).trim()',
          '    last.value = s.slice(0, 1)',
          '    first.value = s.slice(1)',
          '  }',
          '})',
          '',
          'function reset() {',
          "  full.value = '张三'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="full">全名 {{ full }}</p>',
          '  <p class="parts">{{ last }} / {{ first }}</p>',
          '  <button class="btn" @click="reset">改成张三</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".full"), "全名 非茗", "get 拼出来的初始值")',
          'eq(text(".parts"), "非 / 茗", "两个原始 ref 的初始值")',
          'click(".btn"); await tick();',
          'eq(text(".full"), "全名 张三", "读它立刻反映 set 写回去的变化")',
          'eq(text(".parts"), "张 / 三", "set 真的改到了两个原始 ref")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '只有 `get` 没有 `set` 的 `computed` 是只读的。给它赋值不会生效，开发版会警告「computed value is readonly」。'
      },
      {
        kind: 'prose',
        md: [
          '## 方法 vs `computed`：差别在缓存',
          '',
          '把一段推导写进普通方法，每次重新渲染都会重跑一遍。',
          '写进 `computed`，Vue 会记住结果：**依赖没变就不重算**，读多少次都返回缓存。',
          '',
          '下面这个组件把同一个「n 的二倍」同时写成 `computed` 和方法，各计数一次。',
          '点「无关的 seed」只改一个 `computed` 没读到的数据，看谁重跑了。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['', '普通方法', '`computed`'],
        rows: [
          ['依赖没变时重不重算', '重算', '不重算，返回缓存'],
          ['每次渲染都跑', '跑', '只有依赖变了才跑'],
          ['能不能赋值', '不是值，不能', '配了 `set` 才能'],
          ['适合放什么', '点击处理、一次性计算', '能由别的数据推出来的值']
        ]
      },
      {
        kind: 'demo',
        caption: '方法每次重算，computed 用缓存',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const n = ref(2)',
          'const seed = ref(0)',
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
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="v">倍数是 {{ doubled }}，方法算出来是 {{ doubledFn() }}</p>',
          '  <button class="seed" @click="seed++">无关的 seed +1（{{ seed }}）</button>',
          '  <button class="n" @click="n++">n +1</button>',
          '  <p class="cmp">computed 执行 {{ cmpRuns }} 次</p>',
          '  <p class="fn">方法执行 {{ fnRuns }} 次</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".v"), "倍数是 4，方法算出来是 4", "两者结果一致")',
          'click(".seed"); await tick();',
          'eq(text(".cmp"), "computed 执行 1 次", "seed 与它无关，命中缓存不重算")',
          'ok(Number(text(".fn").replace(/[^0-9]/g, "")) > 1, "方法每次渲染都重跑")',
          'click(".n"); await tick();',
          'eq(text(".cmp"), "computed 执行 2 次", "依赖变了才重算")',
          'eq(text(".fn"), "方法执行 3 次", "方法又跟着渲染跑了一次")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `watch`：守着某个来源，变了才做事',
          '',
          '`watch(来源, 回调)` 里，来源写谁就只盯谁。回调默认拿到 `(新值, 旧值)`。',
          '',
          '关键：**回调不是在赋值那一行同步跑的**。Vue 把这次改动记账，等同一批改动走完、',
          '组件重新渲染之后才调回调。所以断言里改完数据要 `await tick()`，否则读到旧值。',
          '',
          '回调默认在渲染前跑。想读数更新之后的 DOM，给选项加上 `flush` 并设成 `post`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'watch 记下每次变化，post 时机读新 DOM',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, watch } from 'vue'",
          '',
          "const word = ref('一')",
          'const changed = ref(0)',
          "const seen = ref('（还没变过）')",
          '',
          'function add() {',
          "  word.value = word.value + '一'",
          '}',
          '',
          'watch(word, (now, prev) => {',
          '  changed.value++',
          "  seen.value = String(prev) + ' → ' + String(now)",
          '})',
          '',
          "const title = ref('初始标题')",
          "const after = ref('（还没同步）')",
          '',
          'function rename() {',
          "  title.value = '标题 ' + title.value.length",
          '}',
          '',
          'watch(title, () => {',
          "  const el = document.querySelector('.t')",
          "  after.value = el ? el.textContent.trim() : '（没找到）'",
          "}, { flush: 'post' })",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="w" @click="add">加一个字</button>',
          '  <p class="cur">当前 {{ word }}</p>',
          '  <p class="changed">已变化 {{ changed }} 次</p>',
          '  <p class="seen">{{ seen }}</p>',
          '  <button class="rename" @click="rename">改标题</button>',
          '  <p class="t">{{ title }}</p>',
          '  <p class="after">{{ after }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".changed"), "已变化 0 次", "初始没触发过")',
          'eq(text(".after"), "（还没同步）", "初始 post 回调没跑过")',
          'click(".w"); await tick();',
          'eq(text(".changed"), "已变化 1 次", "变化之后回调跑了一次")',
          'eq(text(".seen"), "一 → 一一", "回调拿到新旧两个值")',
          'click(".w"); await tick();',
          'eq(text(".changed"), "已变化 2 次", "再变一次回调再跑")',
          'click(".rename"); await tick(); await tick();',
          'eq(text(".t"), "标题 4", "标题变了")',
          'eq(text(".after"), "标题 4", "post 时机读到了更新后的 DOM")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '来源也可以写成 `() => word.value`，或者数组 `[a, b]`。写成数组时，回调的第一个参数是新值组成的数组，第二个是旧值组成的数组。'
      },
      {
        kind: 'prose',
        md: [
          '## `watchEffect`：不写来源，用到了什么就盯什么',
          '',
          '`watchEffect(回调)` 会**先立刻跑一遍**，跑的过程里读了哪些响应式数据，就自动订上哪些。',
          '以后这些数据变了，回调再跑。',
          '',
          '`watch` 是**先给来源，再动手**；`watchEffect` 是**先动手，过程里顺手收集依赖**。',
          '代价是依赖看得不清楚：回调里没读到的数据，改了它也不会重跑。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'watchEffect 自动收集依赖，先跑一次',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, watchEffect } from 'vue'",
          '',
          'const a = ref(1)',
          'const b = ref(10)',
          'const runs = ref(0)',
          'let runCount = 0',
          '',
          'watchEffect(() => {',
          '  a.value',
          '  b.value',
          '  runs.value = ++runCount',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="a" @click="a++">a +1（{{ a }}）</button>',
          '  <button class="b" @click="b += 10">b +10（{{ b }}）</button>',
          '  <p class="runs">收集过 {{ runs }} 次</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".runs"), "收集过 1 次", "watchEffect 挂载时先跑一次")',
          'click(".a"); await tick();',
          'eq(text(".runs"), "收集过 2 次", "回调读过的 a 变了，自动重跑")',
          'click(".b"); await tick();',
          'eq(text(".runs"), "收集过 3 次", "b 也一样被收集到了")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '别在 `watchEffect` 里改它自己也读过的响应式数据，那样会一直重跑下去。沙箱里这种循环会被超时掐掉，报「watch 里互相触发」。'
      },
      {
        kind: 'table',
        code: true,
        head: ['', '`watch`', '`watchEffect`'],
        rows: [
          ['要不要写来源', '要，明确写出盯谁', '不写，过程里用到了就收'],
          ['挂载时跑不跑', '默认不跑', '立刻跑一次'],
          ['能不能拿旧值', '能，`(新值, 旧值)`', '不拿'],
          ['依赖清不清楚', '一眼看得见', '要读回调体才知道'],
          ['什么时候选它', '变化后要做明确的事', '几件相关的事绑在一段逻辑上']
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-1',
        title: '用 computed 算出总价',
        task: [
          '`price` 是单价，`qty` 是件数。现在 `total` 是一个写死的普通变量，加一件数字不会变。',
          '',
          '请把 `total` 改成 `computed`，让它等于 `price * qty`，模板里继续用 `total`。',
          '',
          '改完之后：初始显示 `总价 60`，点一次「加一件」显示 `总价 90`。',
          '',
          '在 `<script setup>` 里读 `ref` 要写 `.value`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const price = ref(30)',
          'const qty = ref(2)',
          'const total = 60',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="t">总价 {{ total }}</p>',
          '  <button class="inc" @click="qty++">加一件</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'const price = ref(30)',
          'const qty = ref(2)',
          'const total = computed(() => price.value * qty.value)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="t">总价 {{ total }}</p>',
          '  <button class="inc" @click="qty++">加一件</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".t"), "总价 60", "初始总价算对了")',
          'click(".inc"); await tick();',
          'eq(text(".t"), "总价 90", "加一件后 total 跟着重算")',
          'eq(count("p"), 1, "页面上只有一个 p")'
        ],
        hints: [
          '写法是 `computed(() => price.value * qty.value)`，箭头函数的返回值就是算出来的值。',
          '模板里读 `computed` 不用写 `.value`，直接写 `total`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-2',
        title: '给 computed 补一个 set',
        task: [
          '`question` 现在是一个只读的 `computed`，它把 `text` 去掉首尾空格、再截到 10 个字。',
          '',
          '请把它改成**可写**的：',
          '',
          '1. 换成对象形式 `computed({ get() {...}, set(v) {...} })`，现有逻辑放进 `get`。',
          '2. 在 `set` 里把收到的值去掉首尾空格，写回 `text.value`。',
          '',
          '检查项会点按钮把 `question` 赋值成一段带首尾空格的文字，要求 `text` 收到去掉空格后的版本。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          "const text = ref('原始文字')",
          '',
          'const question = computed(() => String(text.value).trim().slice(0, 10))',
          '',
          'function rewrite() {',
          "  question.value = '  我改过了  '",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="q">{{ question }}</p>',
          '  <p class="raw">原文「{{ text }}」</p>',
          '  <button class="btn" @click="rewrite">改写</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          "const text = ref('原始文字')",
          '',
          'const question = computed({',
          '  get() {',
          '    return String(text.value).trim().slice(0, 10)',
          '  },',
          '  set(v) {',
          '    text.value = String(v).trim()',
          '  }',
          '})',
          '',
          'function rewrite() {',
          "  question.value = '  我改过了  '",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="q">{{ question }}</p>',
          '  <p class="raw">原文「{{ text }}」</p>',
          '  <button class="btn" @click="rewrite">改写</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".q"), "原始文字", "get 初始算对了")',
          'eq(text(".raw"), "原文「原始文字」", "原始 ref 初始值没被动")',
          'click(".btn"); await tick();',
          'eq(text(".raw"), "原文「我改过了」", "set 把值写回了 text，且去掉空格")',
          'eq(text(".q"), "我改过了", "读它立刻反映 set 的结果")'
        ],
        hints: [
          '对象形式是 `computed({ get() {...}, set(v) {...} })`，两个方法在同一个对象里。',
          '`set` 的参数是赋进来的值，把它换算回去写另一个 `ref`：`text.value = String(v).trim()`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-3',
        title: '用 watch 记录变化次数与轨迹',
        task: [
          '`step` 是一个数字。请在下面的 `watch` 回调里做两件事：',
          '',
          '1. `changes` 每变一次加一。',
          '2. `trail` 拼出 `旧 → 新` 的一段，每次变化用 `、` 接在上一段后面。',
          '',
          '初始 `step` 是 `1`，检查项会连点两次「走一步」：',
          '第一次后要 `变化 1 次`、轨迹是 `1 → 2`；第二次后要 `变化 2 次`、轨迹是 `1 → 2、2 → 3`。',
          '',
          '回调的参数是 `(新值, 旧值)`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, watch } from 'vue'",
          '',
          'const step = ref(1)',
          'const changes = ref(0)',
          "const trail = ref('')",
          '',
          'watch(step, (now, prev) => {',
          '  // TODO: 记次数，并把「旧 → 新」拼进 trail',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="c">变化 {{ changes }} 次</p>',
          '  <p class="trail">轨迹 {{ trail }}</p>',
          '  <button class="go" @click="step++">走一步</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, watch } from 'vue'",
          '',
          'const step = ref(1)',
          'const changes = ref(0)',
          "const trail = ref('')",
          '',
          'watch(step, (now, prev) => {',
          '  changes.value++',
          "  const piece = String(prev) + ' → ' + String(now)",
          "  trail.value = trail.value ? trail.value + '、' + piece : piece",
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="c">变化 {{ changes }} 次</p>',
          '  <p class="trail">轨迹 {{ trail }}</p>',
          '  <button class="go" @click="step++">走一步</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".c"), "变化 0 次", "初始没有触发")',
          'click(".go"); await tick();',
          'eq(text(".c"), "变化 1 次", "第一次变化回调跑了一次")',
          'eq(text(".trail"), "轨迹 1 → 2", "轨迹拼上了旧值和新值")',
          'click(".go"); await tick();',
          'eq(text(".c"), "变化 2 次", "第二次变化又跑了一次")',
          'eq(text(".trail"), "轨迹 1 → 2、2 → 3", "轨迹在后面接着拼")',
          'eq(count(".go"), 1, "只有一个按钮")'
        ],
        hints: [
          '回调签名是 `(now, prev) => {}`，新值在前、旧值在后。',
          "拼接用字符串相加：`String(prev) + ' → ' + String(now)`；第一次 `trail.value` 是空串，直接放这段就行。"
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-4',
        title: '用 watchEffect 自动收集依赖',
        task: [
          '`a` 和 `b` 是两块会变的数据。请在 TODO 处用 `watchEffect` 维护一个 `sum`：',
          '',
          '1. 在回调里读 `a.value`、`b.value`，把它们的和写进 `sum.value`。',
          '2. 每跑一次，让 `runs` 显示的数字加一。',
          '',
          '`watchEffect` 会立刻跑一次，所以初始 `sum` 就是 `a + b`；之后 a 或 b 变了它自动重跑。',
          '',
          '注意：别在回调里**读** `runs`，只写它，否则它会把自己触发起来。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, watchEffect } from 'vue'",
          '',
          'const a = ref(1)',
          'const b = ref(20)',
          'const sum = ref(0)',
          'const runs = ref(0)',
          '',
          '// TODO: 用 watchEffect 把 a + b 写进 sum，并让 runs 加一',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="s">和 {{ sum }}</p>',
          '  <p class="runs">跑了 {{ runs }} 次</p>',
          '  <button class="a" @click="a++">a +1</button>',
          '  <button class="b" @click="b += 10">b +10</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, watchEffect } from 'vue'",
          '',
          'const a = ref(1)',
          'const b = ref(20)',
          'const sum = ref(0)',
          'const runs = ref(0)',
          'let runCount = 0',
          '',
          'watchEffect(() => {',
          '  sum.value = a.value + b.value',
          '  runs.value = ++runCount',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="s">和 {{ sum }}</p>',
          '  <p class="runs">跑了 {{ runs }} 次</p>',
          '  <button class="a" @click="a++">a +1</button>',
          '  <button class="b" @click="b += 10">b +10</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".s"), "和 21", "watchEffect 立刻跑了一次")',
          'eq(text(".runs"), "跑了 1 次", "只跑了一次")',
          'click(".a"); await tick();',
          'eq(text(".s"), "和 22", "a 变了自动重跑，sum 更新")',
          'click(".b"); await tick();',
          'eq(text(".s"), "和 32", "b 变了也自动重跑")',
          'eq(text(".runs"), "跑了 3 次", "两次变化各重跑一次")',
          'eq(count(".a"), 1, "页面上只有一个 a 按钮")'
        ],
        hints: [
          '回调体里读到的响应式数据就是它盯的数据：写 `sum.value = a.value + b.value`。',
          '计数不要读 `runs`，用一个普通变量再写进去：`let runCount = 0` 加 `runs.value = ++runCount`。'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '选择的简单标准：要产出**一个值**给模板用，用 `computed`；要在变化之后**做一件事**，用 `watch`；几件相关的事绑在一段逻辑上、又不想重复写来源，用 `watchEffect`。'
      },
      {
        kind: 'prose',
        md: [
          '可写 `computed` 的 `set` 负责**反向换算**：使用者改派生值，你把改动落回它依赖的原始数据。',
          '`computed` 有缓存，依赖没变不重算；方法每次渲染都重跑。',
          '',
          '`watch` 要先说清盯谁，回调里能拿到旧值，默认渲染前跑，要读新 DOM 就把 flush 设成 `post`。',
          '`watchEffect` 不写来源，挂载时先跑一次，用到了什么就自动盯着什么。',
          '',
          '下一章讲生命周期与模板引用：把真实 DOM 拿到手，以及组件离开时该收尾的事。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
