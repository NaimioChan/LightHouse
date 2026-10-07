/* ch08 — 组件的 emit：子组件用事件把「发生了什么」告诉父组件，父组件自己改自己的数据。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch08
 *   node tools/lib/probe-chapter.mjs ch08
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch08',
    title: '第 8 章 · 组件的 emit',
    goal: '能写出会发事件的子组件，让父组件用 @事件名 接住并更新自己的数据，也能用 v-model 在组件上做双向绑定。',
    sections: [
      {
        kind: 'prose',
        md: [
          '`props` 把数据从父组件送到子组件，方向是单向的。子组件要往回说话，用的是**事件**。',
          '',
          '子组件声明自己能发哪些事件（`emits`），需要时用 `$emit(\'事件名\')` 发出去。父组件在标签上用 `@事件名` 接住，在**自己的函数里改自己的数据**。',
          '',
          '父组件传下来的 `props` 是只读的。子组件不能直接改它，只能把「发生了什么」说出去；怎么响应由父组件决定。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '子组件发事件，父组件自己改数据',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  emits: ['ping'],",
          "  template: '<button class=\"child\" @click=\"$emit(\\'ping\\')\">通知父组件</button>'",
          '}',
          '',
          "const state = ref('父组件什么都没收到')",
          '',
          'function onPing() {',
          "  state.value = '父组件收到 ping'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @ping="onPing" />',
          '  <p class="out">{{ state }}</p>',
          '</template>',
          '',
          '<style scoped>',
          '.out { color: rgb(42, 99, 73); }',
          '</style>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "父组件什么都没收到", "初始状态")',
          'eq(text(".child"), "通知父组件", "子组件渲染出来了")',
          'click(".child"); await tick();',
          'eq(text(".out"), "父组件收到 ping", "子组件发了事件，父组件改了自己的数据")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 子组件先声明事件',
          '',
          '发事件前先在组件里写 `emits`，把事件名列出来。它不参与渲染，是一份声明：读代码的人一眼能看到这个组件会往外发哪些事件。',
          '',
          '发的时候写 `$emit(\'名字\')`。第一个参数是事件名，后面的参数会原样传给父组件的处理函数。',
          '',
          '父组件不写 `@名字`，事件发出去没人接，页面上什么也不会变。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '子组件里**不许**去改父组件的数据，也不许直接改 `props`。`props` 是只读的，改了本来就不生效，父组件那边的真实数据也不会跟着变。'
      },
      {
        kind: 'demo',
        caption: '同一件事，用 emit 函数发',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  emits: ['ping'],",
          '  setup(props, ctx) {',
          '    function ping() {',
          "      ctx.emit('ping')",
          '    }',
          '    return { ping }',
          '  },',
          "  template: '<button class=\"child\" @click=\"ping\">用函数发事件</button>'",
          '}',
          '',
          'const n = ref(0)',
          '',
          'function onPing() {',
          '  n.value = n.value + 1',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @ping="onPing" />',
          '  <p class="out">收到 {{ n }} 次</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "收到 0 次", "初始 0 次")',
          'click(".child"); await tick();',
          'eq(text(".out"), "收到 1 次", "用 emit 函数发事件，父组件收到了")',
          'click(".child"); await tick();',
          'eq(text(".out"), "收到 2 次", "再点一次再加一")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `$emit` 与 `defineEmits`',
          '',
          '模板里能直接写 `$emit`，因为每个组件实例都自带它。',
          '',
          '在 `setup` 里没有 `this`，事件从第二个参数里取：`setup(props, { emit })`，然后调用 `emit(\'名字\')`。',
          '',
          '写 `<script setup>` 时，`const emit = defineEmits([\'名字\'])` 做的是同一件事：声明事件列表，同时交给你一个 `emit` 函数。',
          '',
          '两种写法效果一样，看哪种顺手。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '事件带参数，参数回到父组件',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Item = {',
          "  props: ['id', 'name'],",
          "  emits: ['pick'],",
          "  template: '<button class=\"item\" @click=\"$emit(\\'pick\\', id, name)\">{{ name }}</button>'",
          '}',
          '',
          "const picked = ref('还没选')",
          '',
          'function onPick(id, name) {',
          "  picked.value = '选了 ' + id + ' 号 ' + name",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Item id="1" name="苹果" @pick="onPick" />',
          '  <Item id="2" name="香蕉" @pick="onPick" />',
          '  <p class="out">{{ picked }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".item"), 2, "两个按钮都渲染了")',
          'eq(text(".out"), "还没选", "初始没选")',
          'var ev = new MouseEvent("click", { bubbles: true, cancelable: true }); $$(".item")[0].dispatchEvent(ev); await tick();',
          'eq(text(".out"), "选了 1 号 苹果", "第一个按钮把 id 与 name 一起带回来了")',
          'var ev2 = new MouseEvent("click", { bubbles: true, cancelable: true }); $$(".item")[1].dispatchEvent(ev2); await tick();',
          'eq(text(".out"), "选了 2 号 香蕉", "第二个按钮带回来的参数不一样")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '`$emit` 的第一个参数是事件名，**后面的参数**都传给父组件的处理函数。参数就是子组件想说给父组件听的信息，比如被点中的是哪一项。',
          '',
          '父组件接住时，处理函数的形参按顺序对上这些参数。也可以只用 `$event`：只传一个参数时，它就放在 `$event` 里。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['父组件里写', '子组件里发', '结果'],
        rows: [
          ['`@pick="onPick"`', '`$emit(\'pick\')`', '调用 `onPick()`'],
          ['`@pick="onPick"`', '`$emit(\'pick\', id, name)`', '调用 `onPick(id, name)`'],
          ['`@pick="count++"`', '`$emit(\'pick\', 1)`', '内联语句，参数在 `$event` 里']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 在组件上用 `v-model`',
          '',
          '表单元素上的 `v-model` 已经用过。组件上也能用 `v-model`，Vue 会把它拆成两件事：',
          '',
          '1. 把值用 `:modelValue` 传下去。',
          '2. 监听 `@update:modelValue`，把子组件传来的新值写回自己的数据。',
          '',
          '子组件配合的也只有两样：用 `props` 接住 `modelValue`，改值的时候 `$emit(\'update:modelValue\', 新值)`。这样父组件一句 `v-model="on"` 就能和子组件双向同步。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['缩写', '展开成'],
        rows: [
          ['`<Child v-model="on" />`', '`<Child :modelValue="on" @update:modelValue="on = $event" />`']
        ]
      },
      {
        kind: 'demo',
        caption: '组件版 v-model：一个开关',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Switch = {',
          "  props: ['modelValue'],",
          "  emits: ['update:modelValue'],",
          "  template: '<button class=\"sw\" @click=\"$emit(\\'update:modelValue\\', !modelValue)\">{{ modelValue ? \\'开\\' : \\'关\\' }}</button>'",
          '}',
          '',
          'const on = ref(false)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Switch v-model="on" />',
          '  <p class="out">父组件里是 {{ on ? \'开\' : \'关\' }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "父组件里是 关", "初始是关")',
          'eq(text(".sw"), "关", "子组件按 modelValue 显示关")',
          'click(".sw"); await tick();',
          'eq(text(".out"), "父组件里是 开", "v-model 把父组件的 on 写成了 true")',
          'eq(text(".sw"), "开", "子组件拿到新的 modelValue 后显示开")',
          'click(".sw"); await tick();',
          'eq(text(".out"), "父组件里是 关", "再点一下回到关")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`v-model` 在组件上默认绑的就是 `modelValue` 与 `update:modelValue` 这一对。写成 `v-model` 时 Vue 已经替你接好了，不用手写 `@update:modelValue`。'
      },
      {
        kind: 'exercise',
        id: 'ex08-1',
        title: '让按钮通知父组件',
        task: [
          '子组件 `Child` 上有一个「再来一次」按钮，点它要把父组件的轮数加一。',
          '',
          '现在子组件既没有声明事件、按钮上也没有任何绑定，点了没反应。请做两件事：',
          '',
          '1. 给 `Child` 加上 `emits: [\'again\']`。',
          '2. 给按钮加上 `@click="$emit(\'again\')"`。',
          '',
          '父组件的 `@again="next"` 已经接好了，你只要让子组件真的发出这个事件。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  template: '<button class=\"again\">再来一次</button>'",
          '}',
          '',
          'const round = ref(1)',
          '',
          'function next() {',
          '  round.value = round.value + 1',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @again="next" />',
          '  <p class="out">第 {{ round }} 轮</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  emits: ['again'],",
          "  template: '<button class=\"again\" @click=\"$emit(\\'again\\')\">再来一次</button>'",
          '}',
          '',
          'const round = ref(1)',
          '',
          'function next() {',
          '  round.value = round.value + 1',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @again="next" />',
          '  <p class="out">第 {{ round }} 轮</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "第 1 轮", "初始是第 1 轮")',
          'click(".again"); await tick();',
          'eq(text(".out"), "第 2 轮", "子组件发事件后父组件的轮数加一")',
          'click(".again"); await tick();',
          'eq(text(".out"), "第 3 轮", "再点一次再加一")'
        ],
        hints: [
          '事件名自己定，这里两边都叫 `again`：子组件 `$emit(\'again\')`，父组件 `@again`。',
          '按钮上的绑定写成 `@click="$emit(\'again\')"`，引号里那句就是点击时要跑的代码。',
          '别忘了给按钮留着 `class="again"`，检查项靠它找元素。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-2',
        title: '把名字一起发过去',
        task: [
          '子组件 `Child` 有两个按钮，点它们要把自己的名字告诉父组件，父组件显示成 `你选了 青柠`。',
          '',
          '现在两处 `$emit` 都只写了事件名，父组件的 `onPick(name)` 收到的是 `undefined`，显示成 `你选了 undefined`。',
          '',
          '请给两处 `$emit` 各补上第二个参数：第一个按钮发 `\'青柠\'`，第二个发 `\'薄荷\'`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  emits: ['pick'],",
          "  template: '<button class=\"a\" @click=\"$emit(\\'pick\\')\">青柠</button><button class=\"b\" @click=\"$emit(\\'pick\\')\">薄荷</button>'",
          '}',
          '',
          "const chosen = ref('还没选')",
          '',
          'function onPick(name) {',
          "  chosen.value = '你选了 ' + name",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @pick="onPick" />',
          '  <p class="out">{{ chosen }}</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  emits: ['pick'],",
          "  template: '<button class=\"a\" @click=\"$emit(\\'pick\\', \\'青柠\\')\">青柠</button><button class=\"b\" @click=\"$emit(\\'pick\\', \\'薄荷\\')\">薄荷</button>'",
          '}',
          '',
          "const chosen = ref('还没选')",
          '',
          'function onPick(name) {',
          "  chosen.value = '你选了 ' + name",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @pick="onPick" />',
          '  <p class="out">{{ chosen }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "还没选", "初始没选")',
          'click(".a"); await tick();',
          'eq(text(".out"), "你选了 青柠", "第一个按钮把名字带回来了")',
          'click(".b"); await tick();',
          'eq(text(".out"), "你选了 薄荷", "第二个按钮带回了另一个名字")'
        ],
        hints: [
          '`$emit` 的第一个参数是事件名，要传的值写在它后面。',
          '第一个按钮写成 `$emit(\'pick\', \'青柠\')`，第二个把名字换成 `\'薄荷\'`。',
          '`onPick(name)` 已经写好了，它直接拿第一个参数，不用改。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-3',
        title: '父组件收到事件后加一项',
        task: [
          '子组件每点一次就通知父组件，父组件往自己的列表里加一项。',
          '',
          '事件这条路已经接通：子组件发 `submit`，父组件也写了 `@submit="pushItem"`。缺的是 `pushItem` 里那句——它现在什么都不做。',
          '',
          '请把它补上：往 `list` 里推一个字符串 `第 N 项`，N 按现有项数往下排，第一项是 `第 1 项`，第二项是 `第 2 项`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  emits: ['submit'],",
          "  template: '<button class=\"add\" @click=\"$emit(\\'submit\\')\">加一项</button>'",
          '}',
          '',
          'const list = ref([])',
          '',
          'function pushItem() {',
          '  // 收到事件后要往 list 里加一项',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @submit="pushItem" />',
          '  <p class="count">共 {{ list.length }} 项</p>',
          '  <ul>',
          '    <li v-for="(it, i) in list" :key="i">{{ it }}</li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  emits: ['submit'],",
          "  template: '<button class=\"add\" @click=\"$emit(\\'submit\\')\">加一项</button>'",
          '}',
          '',
          'const list = ref([])',
          '',
          'function pushItem() {',
          "  list.value.push('第 ' + (list.value.length + 1) + ' 项')",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child @submit="pushItem" />',
          '  <p class="count">共 {{ list.length }} 项</p>',
          '  <ul>',
          '    <li v-for="(it, i) in list" :key="i">{{ it }}</li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".count"), "共 0 项", "初始没有项")',
          'click(".add"); await tick();',
          'eq(text(".count"), "共 1 项", "点一次加一项")',
          'eq(text("li"), "第 1 项", "列表里是第 1 项")',
          'click(".add"); await tick();',
          'eq(text(".count"), "共 2 项", "再点一次变两项")'
        ],
        hints: [
          '改数组要用 `list.value.push(...)`，`list.value[i] = x` 这种写法不触发更新。',
          '序号是现有项数加一：`list.value.length + 1`。',
          '拼字符串用加号：`\'第 \' + (list.value.length + 1) + \' 项\'`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-4',
        title: '把开关改成组件版 v-model',
        task: [
          '子组件 `Child` 用 `props` 接住了 `modelValue`，点一下会 `$emit(\'update:modelValue\', ...)`。',
          '',
          '父组件现在只把值传了下去（`:modelValue="on"`），**没有接住子组件的修改**，所以点开关时 `on` 一直不变。',
          '',
          '请把父组件里的 `:modelValue="on"` 换成一句组件版 `v-model="on"`。换完之后点开关，父组件的 `on` 会跟着变。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  props: ['modelValue'],",
          "  emits: ['update:modelValue'],",
          "  template: '<button class=\"sw\" @click=\"$emit(\\'update:modelValue\\', !modelValue)\">{{ modelValue ? \\'开\\' : \\'关\\' }}</button>'",
          '}',
          '',
          'const on = ref(false)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child :modelValue="on" />',
          '  <p class="out">{{ on ? \'开\' : \'关\' }}</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Child = {',
          "  props: ['modelValue'],",
          "  emits: ['update:modelValue'],",
          "  template: '<button class=\"sw\" @click=\"$emit(\\'update:modelValue\\', !modelValue)\">{{ modelValue ? \\'开\\' : \\'关\\' }}</button>'",
          '}',
          '',
          'const on = ref(false)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Child v-model="on" />',
          '  <p class="out">{{ on ? \'开\' : \'关\' }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "关", "初始是关")',
          'click(".sw"); await tick();',
          'eq(text(".out"), "开", "v-model 把父组件的 on 写成了 true")',
          'eq(text(".sw"), "开", "子组件按新的 modelValue 显示开")',
          'click(".sw"); await tick();',
          'eq(text(".out"), "关", "再点一下回到关")'
        ],
        hints: [
          '`v-model="on"` 展开就是 `:modelValue="on"` 加 `@update:modelValue="on = $event"`，你缺的是后一半。',
          '可以直接写缩写：把 `:modelValue="on"` 改成 `v-model="on"`。',
          '子组件不用改，它发的事件名 `update:modelValue` 与 `v-model` 默认约定的一致。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '父组件想换一种响应方式，只要改自己的处理函数，子组件一行都不用动——它只负责把事件发出去。',
          '',
          '下一章讲插槽：父组件把一段模板交给子组件，由子组件决定这段模板渲染在什么位置。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
