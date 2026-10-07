/* ch11 — 生命周期与模板引用：三个钩子的时机、用模板引用拿真实元素、卸载时清掉定时器。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch11
 *   node tools/lib/probe-chapter.mjs ch11
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch11',
    title: '第 11 章 · 生命周期与模板引用',
    goal: '知道 onMounted / onUpdated / onUnmounted 各在什么时机跑，能用模板引用拿到真实元素，并会在组件卸载时清掉定时器。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## `setup` 跑的时候，页面上什么都还没有',
          '',
          '`<script setup>` 里的代码（也就是 `setup()`）只负责**准备数据**。它跑的时候，组件还没挂到页面上，',
          '模板里写的元素一个都还不存在。',
          '',
          '所以在 `setup` 里想去量一个元素的宽度、想去 `focus` 一个输入框，拿到的都是 `null`。',
          '要等 Vue 把元素真的建出来才有 DOM 可读，这个时刻叫 `onMounted()`。',
          '',
          '下面这个组件在两个时刻各读一次同一个元素，看有什么不同。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一个元素，setup 里读是 null，onMounted 里读是元素',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, onMounted } from 'vue'",
          '',
          'const box = ref(null)',
          "const atSetup = box.value === null ? 'null' : '已经拿到元素'",
          "const atMounted = ref('onMounted 还没跑')",
          '',
          'onMounted(() => {',
          "  atMounted.value = box.value ? box.value.tagName : 'null'",
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="box" ref="box">盒子</div>',
          '  <p class="s">setup 里读 box：{{ atSetup }}</p>',
          '  <p class="m">onMounted 里读 box：{{ atMounted }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".s"), "setup 里读 box：null", "setup 跑的时候元素还没建出来")',
          'eq(text(".m"), "onMounted 里读 box：DIV", "onMounted 里 box 已经是真实元素")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 三个钩子的时机',
          '',
          '钩子函数都要在 `setup` 里调用，它们给的是同一个组件一生的三个节点。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['钩子', '什么时候跑', '常用它做什么'],
        rows: [
          ['`onMounted()`', '元素挂到页面之后，整份代码只跑一次', '读一次 DOM、开定时器、发请求'],
          ['`onUpdated()`', '数据变化引起重新渲染、DOM 更新完成之后', '读更新后的 DOM、记录更新次数'],
          ['`onUnmounted()`', '组件从页面上撤下来之后', '清定时器、撤监听、断开连接']
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`onUpdated()` 只在**更新**时跑，首次挂载不算。所以开头看到它一次都没跑，是正常的。'
      },
      {
        kind: 'prose',
        md: [
          '## 用模板引用拿真实元素',
          '',
          '光知道时机还不够，得先拿到元素。做法是给元素加一个 `ref="名字"`，',
          '再在 `<script setup>` 里声明一个**同名**的 `ref` 变量：',
          '',
          '1. 模板里写 `<div ref="box">`。',
          '2. 脚本里写 `const box = ref(null)`。',
          '3. 挂载之后，`box.value` 就是这个 `div` 元素。',
          '',
          '名字必须对上。初始值写 `null`，因为 `setup` 跑的时候元素还不存在。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'tip',
        md: 'Vue 3.5 还提供了 `useTemplateRef(\'box\')`，效果一样。本章统一用同名 `ref` 变量这种写法，在 `<script setup>` 里最直接。'
      },
      {
        kind: 'demo',
        caption: 'onMounted 里量宽度',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, onMounted } from 'vue'",
          '',
          'const bar = ref(null)',
          'const w = ref(0)',
          '',
          'onMounted(() => {',
          '  const rect = bar.value.getBoundingClientRect()',
          '  w.value = Math.round(rect.width)',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="bar" ref="bar">一条</div>',
          '  <p class="w">量到的宽度 {{ w }} px</p>',
          '</template>',
          '',
          '<style scoped>',
          '.bar { width: 180px; height: 16px; background: rgb(210, 230, 245); }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(style(".bar", "width"), "180px", "样式先把它撑到 180px")',
          'eq(text(".w"), "量到的宽度 180 px", "onMounted 里量到的宽度写进了文案")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `onUpdated` 是「更新之后」',
          '',
          '改数据之后 DOM 不是立刻就变的，Vue 会把这一轮的改动攒起来，一次渲染完。',
          '`onUpdated()` 就在**这次渲染结束之后**跑，这时读到的 DOM 才是新的。',
          '',
          '它每更新一次就跑一次。下面这个组件用一个普通变量记它跑了几次。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'onUpdated 每次更新后跑一遍',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, onUpdated } from 'vue'",
          '',
          "const text = ref('')",
          'const log = ref(null)',
          'let count = 0',
          '',
          'onUpdated(() => {',
          '  count++',
          "  if (log.value) log.value.textContent = '已更新 ' + count + ' 次'",
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="field" v-model="text" placeholder="打字看看">',
          '  <p class="echo">输入：{{ text }}</p>',
          '  <p class="log" ref="log">还没更新过</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".log"), "还没更新过", "首次挂载不算更新，onUpdated 没跑")',
          'input(".field", "a"); await tick();',
          'eq(text(".log"), "已更新 1 次", "onUpdated 在 DOM 更新之后跑")',
          'input(".field", "ab"); await tick();',
          'eq(text(".log"), "已更新 2 次", "每更新一次就跑一遍")',
          'eq(text(".echo"), "输入：ab", "DOM 里的输入同步过了")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '别在 `onUpdated()` 里改响应式数据：改它会让组件再更新一次，`onUpdated()` 又跑，转不完。要记次数就用普通变量。'
      },
      {
        kind: 'prose',
        md: [
          '## 组件撤下来时要自己收尾',
          '',
          '定时器、事件监听、长连接都不归 Vue 管。组件被撤下来之后它们还在跑，',
          '跑的东西没人用，就是白耗，也可能改到已经不该动的地方。',
          '',
          '`onMounted()` 里开的东西，在 `onUnmounted()` 里关掉，两个钩子成对写。',
          '下面这个组件用 `v-if` 开关控制子组件卸不卸下来，计数记在父组件上，',
          '所以子组件卸载后定时器还在不在跑，一眼能看出来。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '卸载时清掉定时器',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref, onMounted, onUnmounted, defineComponent, h } from 'vue'",
          '',
          'const beats = ref(0)',
          'const alive = ref(true)',
          '',
          'const Ticker = defineComponent({',
          "  name: 'Ticker',",
          '  setup() {',
          '    let id = null',
          '    onMounted(() => {',
          '      id = setInterval(() => { beats.value++ }, 30)',
          '    })',
          '    onUnmounted(() => {',
          '      clearInterval(id)',
          '    })',
          "    return () => h('span', { class: 'tick' }, '计时中')",
          '  }',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="beats">{{ beats }}</p>',
          '  <button class="toggle" @click="alive = !alive">{{ alive ? \'卸下\' : \'装上\' }}</button>',
          '  <Ticker v-if="alive" />',
          '</template>'
        ].join('\n'),
        tests: [
          'const wait = ms => new Promise(r => setTimeout(r, ms)); await wait(150);',
          'ok(Number(text(".beats")) > 0, "子组件挂上之后定时器在跑")',
          'click(".toggle"); await tick();',
          'missing(".tick", "点一下把子组件卸下来")',
          'const wait = ms => new Promise(r => setTimeout(r, ms)); const after = Number(text(".beats")); await wait(150); eq(Number(text(".beats")), after, "卸载之后定时器不再跳")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-1',
        title: '在 onMounted 里量出宽度',
        task: [
          '页面上的 `div.box` 宽度由样式定死，脚本里的 `w` 想显示这个宽度。',
          '',
          '请让它显示真实量出来的宽度：',
          '',
          '- 用模板引用拿到 `div.box`。',
          '- 在 `onMounted()` 里用 `getBoundingClientRect().width` 量它，`Math.round` 之后写进 `w`。',
          '',
          '检查项读 `.w` 的文字和 `.box` 的计算样式。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const box = ref(null)',
          'const w = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="box" ref="box">盒子</div>',
          '  <p class="w">宽度 {{ w }} px</p>',
          '</template>',
          '',
          '<style scoped>',
          '.box { width: 140px; height: 16px; background: rgb(226, 236, 247); }',
          '</style>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, onMounted } from 'vue'",
          '',
          'const box = ref(null)',
          'const w = ref(0)',
          '',
          'onMounted(() => {',
          '  w.value = Math.round(box.value.getBoundingClientRect().width)',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="box" ref="box">盒子</div>',
          '  <p class="w">宽度 {{ w }} px</p>',
          '</template>',
          '',
          '<style scoped>',
          '.box { width: 140px; height: 16px; background: rgb(226, 236, 247); }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(count(".box"), 1, "页面上有一个盒子")',
          'eq(style(".box", "width"), "140px", "宽度由样式给的")',
          'eq(text(".w"), "宽度 140 px", "onMounted 里量到的宽度写进了文案")'
        ],
        hints: [
          '`const box = ref(null)` 与模板里的 `ref="box"` 同名，挂载后 `box.value` 就是那个 `div`。',
          '在 `setup` 里直接读 `box.value` 是 `null`，要放进 `onMounted(() => { ... })` 里读。',
          '宽度是小数可能带零头，用 `Math.round()` 取整再写进 `w.value`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-2',
        title: '用模板引用改元素的内容',
        task: [
          '`p.msg` 现在写着「还没点过」，它由脚本改，不由 `{{ }}` 管。',
          '',
          '请让每次点击按钮之后，`.msg` 的文字变成 `点了 N 次`（N 是点击次数）：',
          '',
          '- 给 `p.msg` 加上模板引用，名字叫 `msg`。',
          '- 在 `go()` 里用 `msg.value.textContent` 改写它的文字。',
          '',
          '第一次点完显示 `点了 1 次`，第二次点完显示 `点了 2 次`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const hits = ref(0)',
          '',
          'function go() {',
          '  hits.value++',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="go" @click="go">点我</button>',
          '  <p class="msg">还没点过</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const hits = ref(0)',
          'const msg = ref(null)',
          '',
          'function go() {',
          '  hits.value++',
          "  msg.value.textContent = '点了 ' + hits.value + ' 次'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="go" @click="go">点我</button>',
          '  <p class="msg" ref="msg">还没点过</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".msg"), "还没点过", "初始文案")',
          'click(".go"); await tick();',
          'eq(text(".msg"), "点了 1 次", "用模板引用改了元素内容")',
          'click(".go"); await tick();',
          'eq(text(".msg"), "点了 2 次", "再点一次又改一遍")'
        ],
        hints: [
          '先声明 `const msg = ref(null)`，模板里的 `p` 上写 `ref="msg"`。',
          '改文字直接写 `msg.value.textContent = ...`，不用等 `tick()`，因为它不是响应式更新。',
          '拼接字符串用 `+`：`\'点了 \' + hits.value + \' 次\'`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-3',
        title: '用 onUpdated 记更新次数',
        task: [
          '输入框里的字每变一次，组件就重新渲染一次。',
          '',
          '请在 `p.log` 上显示出已经更新了几次：`.log` 的文字先是 `还没更新过`，',
          '输入一次之后变成 `更新 1 次`，再输入一次变成 `更新 2 次`。',
          '',
          '次数用一个普通变量记（不要用 `ref`），写文字的时机要选对钩子。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const text = ref('')",
          'const log = ref(null)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="field" v-model="text">',
          '  <p class="echo">输入：{{ text }}</p>',
          '  <p class="log" ref="log">还没更新过</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, onUpdated } from 'vue'",
          '',
          "const text = ref('')",
          'const log = ref(null)',
          'let count = 0',
          '',
          'onUpdated(() => {',
          '  count++',
          "  if (log.value) log.value.textContent = '更新 ' + count + ' 次'",
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="field" v-model="text">',
          '  <p class="echo">输入：{{ text }}</p>',
          '  <p class="log" ref="log">还没更新过</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".log"), "还没更新过", "首次挂载不算更新")',
          'input(".field", "a"); await tick();',
          'eq(text(".log"), "更新 1 次", "onUpdated 在 DOM 更新之后跑一次")',
          'input(".field", "ab"); await tick();',
          'eq(text(".log"), "更新 2 次", "第二次输入再记一次")',
          'eq(text(".echo"), "输入：ab", "输入本身还是同步的")'
        ],
        hints: [
          '管「更新之后」的钩子是 `onUpdated()`，它要在 `setup` 里调用。',
          '次数写成 `let count = 0`，在钩子里 `count++`。写成 `ref` 会让组件再更新一轮。',
          '`onUpdated()` 的开头要先 `import { onUpdated } from \'vue\'`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-4',
        title: '卸载时把定时器停掉',
        task: [
          '子组件 `Ticker` 挂上去之后要每 30 毫秒让父组件的 `beats` 加一，',
          '撤下来之后要停下来。',
          '',
          '请做两件事：',
          '',
          '1. 在 `Ticker` 的 `onMounted()` 里开一个 30 毫秒的 `setInterval`，回调里 `beats.value++`。',
          '2. 在 `onUnmounted()` 里用 `clearInterval()` 把它清掉。',
          '',
          '按钮 `.toggle` 会让 `alive` 取反，`<Ticker v-if="alive" />` 跟着卸载或重新挂载。',
          '检查项会先确认它在跳，`click(".toggle")` 之后确认 `.tick` 没了、`beats` 也不再涨。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref, defineComponent, h } from 'vue'",
          '',
          'const beats = ref(0)',
          'const alive = ref(true)',
          '',
          'const Ticker = defineComponent({',
          "  name: 'Ticker',",
          '  setup() {',
          '    // TODO: onMounted 里开定时器，每 30 毫秒让 beats 加一',
          '    // TODO: onUnmounted 里清掉这个定时器',
          "    return () => h('span', { class: 'tick' }, '计时中')",
          '  }',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="beats">{{ beats }}</p>',
          '  <button class="toggle" @click="alive = !alive">{{ alive ? \'卸下\' : \'装上\' }}</button>',
          '  <Ticker v-if="alive" />',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref, onMounted, onUnmounted, defineComponent, h } from 'vue'",
          '',
          'const beats = ref(0)',
          'const alive = ref(true)',
          '',
          'const Ticker = defineComponent({',
          "  name: 'Ticker',",
          '  setup() {',
          '    let id = null',
          '    onMounted(() => {',
          '      id = setInterval(() => { beats.value++ }, 30)',
          '    })',
          '    onUnmounted(() => {',
          '      clearInterval(id)',
          '    })',
          "    return () => h('span', { class: 'tick' }, '计时中')",
          '  }',
          '})',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="beats">{{ beats }}</p>',
          '  <button class="toggle" @click="alive = !alive">{{ alive ? \'卸下\' : \'装上\' }}</button>',
          '  <Ticker v-if="alive" />',
          '</template>'
        ].join('\n'),
        tests: [
          'const wait = ms => new Promise(r => setTimeout(r, ms)); await wait(150);',
          'ok(Number(text(".beats")) > 0, "挂上之后定时器在跳")',
          'click(".toggle"); await tick();',
          'missing(".tick", "点一下把子组件卸下来")',
          'const wait = ms => new Promise(r => setTimeout(r, ms)); const after = Number(text(".beats")); await wait(150); eq(Number(text(".beats")), after, "卸载之后定时器不再跳")'
        ],
        hints: [
          '要用的钩子先 import：`import { onMounted, onUnmounted, defineComponent, h } from \'vue\'`。',
          '定时器的号存进 `let id`：`id = setInterval(() => { beats.value++ }, 30)`。',
          '`onUnmounted(() => { clearInterval(id) })`，两个钩子都写在 `Ticker` 的 `setup` 里，管的是 `Ticker` 自己。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 一句话记住三个钩子的分工',
          '',
          '`setup` 里没有 DOM，所以拿到元素的动作放 `onMounted()`；',
          '要读更新后的 DOM 放 `onUpdated()`；',
          '在 `onMounted()` 里开的东西，去 `onUnmounted()` 里关掉。',
          '',
          '下一章把这些零散逻辑收成组合式函数，并让不相邻的组件直接通信。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
