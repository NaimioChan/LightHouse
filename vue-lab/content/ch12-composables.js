/* ch12 — 组合式函数与跨层通信：把重复逻辑抽成 useXxx()、用 provide/inject 跨层传值。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch12
 *   node tools/lib/probe-chapter.mjs ch12
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch12',
    title: '第 12 章 · 组合式函数与跨层通信',
    goal: '能把重复的响应式逻辑抽成一个 useXxx() 函数反复用，并用 provide / inject 把值跨越中间层传给深层组件。',
    sections: [
      {
        kind: 'prose',
        md: [
          '一个计数器写了三遍，每遍都要声明 `ref`、想名字、加一个加一的函数。',
          '重复的不是数据，是**套路**：一组 `ref` 加上操作它们的函数。',
          '',
          '组合式函数就是把这种套路包起来：写一个普通函数，名字习惯以 `use` 开头，',
          '内部声明 `ref`、`computed`，需要的话再挂生命周期；最后把要用的东西 **return 出去**，',
          '谁调用谁就得到一份自己的数据。',
          '',
          '它不是一个新 API，就是把 `<script setup>` 里天天写的那些东西搬进函数里。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '把计数器抽成 useCounter()',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'function useCounter(start) {',
          '  const n = ref(start)',
          '  function inc() { n.value++ }',
          '  function reset() { n.value = start }',
          '  return { n, inc, reset }',
          '}',
          '',
          'const a = useCounter(0)',
          'const b = useCounter(10)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="a" @click="a.inc">A {{ a.n }}</button>',
          '  <button class="a-r" @click="a.reset">复位 A</button>',
          '  <button class="b" @click="b.inc">B {{ b.n }}</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".a"), "A 0", "A 从 0 起")',
          'eq(text(".b"), "B 10", "B 从 10 起，两个实例互不影响")',
          'click(".a"); click(".a"); await tick();',
          'eq(text(".a"), "A 2", "点两次 A")',
          'eq(text(".b"), "B 10", "A 动的时候 B 没变")',
          'click(".a-r"); await tick();',
          'eq(text(".a"), "A 0", "复位回到初始值")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '组合式函数内部可以随便用 `ref`、`computed`、`watch`、生命周期——它跟组件共享同一套响应式系统。区别只在于：组件是「一个页面块」，组合式函数是「一段可复用的逻辑」。'
      },
      {
        kind: 'prose',
        md: [
          '## 组合式函数里能放 computed',
          '',
          '抽出来的逻辑经常要算派生值。把 `computed` 也写进函数，return 出去，使用方拿到的就跟着变。',
          '',
          '下面这个 `useCart()` 管购物车：`items` 是货架，`total` 是总价。',
          '总价不让外部自己乘，函数内部算好，外部只管读。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '组合式函数里放 computed',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'function useCart() {',
          '  const items = ref([])',
          '  const total = computed(function () {',
          '    return items.value.reduce(function (s, it) { return s + it.price }, 0)',
          '  })',
          '  const count = computed(function () { return items.value.length })',
          '  function add(name, price) { items.value.push({ name: name, price: price }) }',
          '  return { items, total, count, add }',
          '}',
          '',
          'const cart = useCart()',
          '</scr' + 'ipt>',
          '',
          '<template>',
          "  <button class=\"add1\" @click=\"cart.add('苹果', 3)\">加苹果</button>",
          "  <button class=\"add2\" @click=\"cart.add('梨', 5)\">加梨</button>",
          '  <p class="total">合计 {{ cart.total }} 元</p>',
          '  <p class="n">共 {{ cart.count }} 件</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".total"), "合计 0 元", "初始合计是 0")',
          'click(".add1"); await tick();',
          'eq(text(".total"), "合计 3 元", "加一件苹果")',
          'click(".add2"); await tick();',
          'eq(text(".total"), "合计 8 元", "computed 跟着货架更新")',
          'eq(text(".n"), "共 2 件", "件数也对")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 组合式函数里也能挂生命周期',
          '',
          '`onMounted` / `onUnmounted` 写在组合式函数里，效果和写在组件里一样——',
          '因为调用这个函数的组件**就是**当前实例。',
          '',
          '一个常见套路：挂载时起一个定时器，卸载时清掉。这段逻辑谁都需要，抽成 `useClock()`，',
          '哪个组件要用就调一次。定时器与清理成对出现，不会有人忘了清。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '组合式函数里用 onMounted / onUnmounted',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, onMounted, onUnmounted } from 'vue'",
          '',
          'function useClock(step) {',
          '  const n = ref(0)',
          '  let timer = null',
          '  onMounted(function () {',
          '    timer = setInterval(function () { n.value++ }, step)',
          '  })',
          '  onUnmounted(function () { clearInterval(timer) })',
          '  function zero() { n.value = 0 }',
          '  return { n, zero }',
          '}',
          '',
          'const clock = useClock(30)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="tick">滴答 {{ clock.n }}</p>',
          '  <button class="set" @click="clock.zero">归零</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".tick"), "滴答 0", "挂载时定时器还没跑")',
          'await new Promise(function (r) { setTimeout(r, 140) });',
          'ok(parseInt(text(".tick").replace("滴答 ", ""), 10) > 0, "onMounted 里起的定时器真的在走")',
          'click(".set"); await tick();',
          'eq(text(".tick"), "滴答 0", "可以手动归零")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## provide / inject：跳过中间层直接给',
          '',
          '父组件想给孙子组件传值，中间那层组件用不上这个值，却得一路当 props 传下去。',
          '层级越深越啰嗦，这种叫 prop 逐级透传。',
          '',
          '- 祖先组件用 `provide(键, 值)` 把东西放出去。',
          '- 任意后代用 `inject(键)` 取回来，中间隔几层都不用管。',
          '',
          '`provide` 的值如果是 `ref`，子孙拿到的也是那个 `ref`——改它，**所有读它的组件一起更新**。',
          '这就是跨层共享响应式状态的写法。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '祖先 provide，深层 inject',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, provide } from 'vue'",
          '',
          "const theme = ref('浅色')",
          "provide('theme', theme)",
          '',
          'const Deep = {',
          "  inject: ['theme'],",
          "  template: '<p class=\"deep\">深层拿到 {{ theme }}</p>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          "  <button class=\"sw\" @click=\"theme = theme === '浅色' ? '深色' : '浅色'\">切换</button>",
          '  <Deep />',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".deep"), "深层拿到 浅色", "子孙 inject 到了祖先的 ref")',
          'click(".sw"); await tick();',
          'eq(text(".deep"), "深层拿到 深色", "祖先改了值，隔层的子孙跟着更新")',
          'click(".sw"); await tick();',
          'eq(text(".deep"), "深层拿到 浅色", "再切回来")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`provide` / `inject` 靠的是**组件树**，不是模块。它只在「祖先提供、后代取用」这条线上生效，平级组件、兄弟组件之间用不了。'
      },
      {
        kind: 'prose',
        md: [
          '## 别用全局变量在组件之间通信',
          '',
          '有人图省事，把共享数据写成模块顶层的变量，谁都能读能改。这在 Vue 里有三个麻烦：',
          '',
          '1. **改了不触发更新**。普通变量不是响应式的，页面上读它的地方不会重画。',
          '2. **谁改的说不清**。任何一处代码都能偷偷改它，出了问题顺着引用往回找，找不到源头。',
          '3. **没法各用各的**。同一份数据，两个组件想各持一份，做不到。',
          '',
          '要跨层共享，就用 `ref` 加 `provide` / `inject`：谁提供、谁消费、改的是哪个 `ref`，一路能看清。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '普通变量改了页面不动',
        code: [
          '<scr' + 'ipt setup>',
          '',
          'let shared = 0',
          '',
          'function bump() {',
          '  shared = shared + 1',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="b" @click="bump">加一</button>',
          '  <p class="raw">普通变量 {{ shared }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".raw"), "普通变量 0", "初始是 0")',
          'click(".b"); await tick();',
          'eq(text(".raw"), "普通变量 0", "普通变量改了但页面没动")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-1',
        title: '把计数器抽成 useCounter()',
        task: [
          '这个组件里直接把计数器写在了 `setup` 里。请把它抽成一个组合式函数，名字叫 `useCounter`：',
          '',
          '- 接收一个参数 `start`，返回的对象里有 `n`（一个 `ref`）、`inc`、`dec` 三个东西。',
          '- 在这个组件里调用 `const c = useCounter(5)`，模板改成读 `c.n`，按钮改成调 `c.inc` / `c.dec`。',
          '',
          '检查项会先读初始值 `5`，再点加、点减各一次。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(5)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="n">{{ n }}</p>',
          '  <button class="inc">加</button>',
          '  <button class="dec">减</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'function useCounter(start) {',
          '  const n = ref(start)',
          '  function inc() { n.value++ }',
          '  function dec() { n.value-- }',
          '  return { n, inc, dec }',
          '}',
          '',
          'const c = useCounter(5)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="n">{{ c.n }}</p>',
          '  <button class="inc" @click="c.inc">加</button>',
          '  <button class="dec" @click="c.dec">减</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".n"), "5", "初始值是传进去的 5")',
          'click(".inc"); await tick();',
          'eq(text(".n"), "6", "点加变 6")',
          'click(".dec"); click(".dec"); await tick();',
          'eq(text(".n"), "4", "点两次减回到 4")'
        ],
        hints: [
          '组合式函数就是普通函数：`function useCounter(start) { ... return { ... } }`。',
          '返回值里的 `n` 直接给 `ref`，模板里写 `c.n` 就读到值。',
          '事件写成 `@click="c.inc"`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-2',
        title: '给组合式函数加一个 computed',
        task: [
          '下面是一个 `useScores()`，它管一组分数 `scores`。请给它加一个 `average`，返回平均分。',
          '',
          '- 用 `computed` 算：没有分数时返回 `0`，否则返回总分除以个数。',
          '- 把 `average` 也 return 出去，模板已经准备好了读它。',
          '',
          '检查项会加两个分数再读平均。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'function useScores() {',
          '  const scores = ref([])',
          '  function add(v) { scores.value.push(v) }',
          '  return { scores, add }',
          '}',
          '',
          'const s = useScores()',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="add1" @click="s.add(80)">加 80</button>',
          '  <button class="add2" @click="s.add(90)">加 90</button>',
          '  <p class="avg">平均 {{ s.average }}</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, computed } from 'vue'",
          '',
          'function useScores() {',
          '  const scores = ref([])',
          '  const average = computed(function () {',
          '    if (!scores.value.length) return 0',
          '    const sum = scores.value.reduce(function (a, b) { return a + b }, 0)',
          '    return sum / scores.value.length',
          '  })',
          '  function add(v) { scores.value.push(v) }',
          '  return { scores, average, add }',
          '}',
          '',
          'const s = useScores()',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="add1" @click="s.add(80)">加 80</button>',
          '  <button class="add2" @click="s.add(90)">加 90</button>',
          '  <p class="avg">平均 {{ s.average }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".avg"), "平均 0", "空数组时平均是 0")',
          'click(".add1"); await tick();',
          'eq(text(".avg"), "平均 80", "一个分数时平均就是它")',
          'click(".add2"); await tick();',
          'eq(text(".avg"), "平均 85", "两个分数时算对了")'
        ],
        hints: [
          "先在顶部 import `computed`：`import { ref, computed } from 'vue'`。",
          '`computed(function () { ... })` 里读 `scores.value`，返回算好的数。',
          '别忘了把 `average` 加进 return 的对象。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-3',
        title: '用 provide / inject 把值传到底层',
        task: [
          '这里有一个深层子组件 `Deep`，它 inject 了键 `msg`。但祖先组件忘了 provide，所以显示不出来。',
          '',
          '请做两件事：',
          '',
          '1. 在 `setup` 里 import 并调用 `provide`，把 `ref` 变量 `msg` 用键 `msg` 放出去。',
          '2. 让按钮点击时把 `msg` 改成 `已连接`，验证深层跟着变。',
          '',
          '检查项会读深层元素的文字。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const msg = ref('等待中')",
          '',
          'const Deep = {',
          "  inject: ['msg'],",
          "  template: '<p class=\"deep\">{{ msg }}</p>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Deep />',
          '  <button class="go">连接</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, provide } from 'vue'",
          '',
          "const msg = ref('等待中')",
          "provide('msg', msg)",
          '',
          'const Deep = {',
          "  inject: ['msg'],",
          "  template: '<p class=\"deep\">{{ msg }}</p>'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Deep />',
          "  <button class=\"go\" @click=\"msg = '已连接'\">连接</button>",
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".deep"), "等待中", "深层取到了祖先提供的初始值")',
          'click(".go"); await tick();',
          'eq(text(".deep"), "已连接", "改了 ref，深层跟着更新")'
        ],
        hints: [
          "import 里加上 `provide`：`import { ref, provide } from 'vue'`。",
          "放出去用 `provide('msg', msg)`，键是字符串。",
          '把 `ref` 放出去时不用 `.value`，放盒子本身，子孙才拿得到更新。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-4',
        title: '在组合式函数里管定时器',
        task: [
          '把「挂载起一个定时器、卸载时清掉」抽成组合式函数 `useTicker`。',
          '',
          '要求：',
          '',
          '- `useTicker()` 内部用 `onMounted` 起 `setInterval`，每 30 毫秒把 `n.value` 加一。',
          '- 用 `onUnmounted` 把定时器 `clearInterval` 清掉。',
          '- return 出 `n` 和一个 `stop`（调它就清掉定时器、让数字停住）。',
          '',
          '检查项会等一会儿看数字有没有涨，再点 `stop` 看它停住。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          '// TODO：写一个 useTicker()，从 setup 里搬出去',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="tick">{{ n }}</p>',
          '  <button class="stop">停</button>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, onMounted, onUnmounted } from 'vue'",
          '',
          'function useTicker() {',
          '  const n = ref(0)',
          '  let timer = null',
          '  onMounted(function () {',
          '    timer = setInterval(function () { n.value++ }, 30)',
          '  })',
          '  onUnmounted(function () { clearInterval(timer) })',
          '  function stop() { clearInterval(timer) }',
          '  return { n, stop }',
          '}',
          '',
          'const t = useTicker()',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="tick">{{ t.n }}</p>',
          '  <button class="stop" @click="t.stop">停</button>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".tick"), "0", "挂载瞬间还是 0")',
          'await new Promise(function (r) { setTimeout(r, 140) });',
          'ok(parseInt(text(".tick"), 10) > 0, "onMounted 起的定时器在自增")',
          'click(".stop"); await tick(); var frozen = parseInt(text(".tick"), 10); await new Promise(function (r) { setTimeout(r, 120) }); eq(parseInt(text(".tick"), 10), frozen, "stop 之后数字停住不再涨")'
        ],
        hints: [
          '计时器要用 `let timer = null` 存起来，`onMounted` 里 `timer = setInterval(...)`。',
          '`stop` 里调 `clearInterval(timer)`；函数 return `{ n, stop }`。',
          '模板里写 `{{ t.n }}`，按钮写成 `@click="t.stop"`。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 交接点',
          '',
          '组合式函数把「逻辑」从「组件」里拿了出来，一个函数谁调谁用，各持一份状态。',
          '`provide` / `inject` 解决的是另一件事：一份状态，要跨好几层给一群人用。',
          '',
          '两者常常搭配：写一个 `useTheme()` 管主题的 `ref` 与切换函数，祖先 `provide` 出去，',
          '深层组件 `inject` 进来。状态从哪来、谁在改、改了谁跟着变，一读就清楚。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
