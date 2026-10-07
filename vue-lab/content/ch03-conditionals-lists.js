/* ch03 — 模板里的条件与循环：什么时候画、画几个。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch03
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch03',
    title: '第 3 章 · 模板里的条件与循环',
    goal: '用 v-if 决定画不画，用 v-for 把一个数组画成一排元素，并知道 :key 是干什么的。',
    sections: [
      {
        kind: 'prose',
        md: [
          '有两个场景上面一章解决不了：某块内容要不要出现、一个数组要画成多少条。',
          '',
          '- 要不要出现 —— `v-if` / `v-else-if` / `v-else`。',
          '- 一个数组画成多少条 —— `v-for`，配一个 `:key`。',
          '',
          '先看条件。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '三选一：v-if / v-else-if / v-else',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const score = ref(75)",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <p class="a" v-if="score >= 90">优秀</p>',
          '  <p class="a" v-else-if="score >= 60">及格</p>',
          '  <p class="a" v-else>不及格</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".a"), 1, "三个分支里只会画一个")',
          'eq(text(".a"), "及格", "75 分走 else-if 那支")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `v-if` 是移除节点，不是藏起来',
          '',
          '不成立的那一支，Vue **根本不生成这个元素**。用 `count()` 数，它不在。',
          '',
          '## `v-show` 只是加一条 `display: none`',
          '',
          '`v-show` 的元素一直待在 DOM 里，`count()` 查得到，只是计算样式里的 `display` 变成了 `none`。',
          '',
          '这两个的差别在真实项目里有后果：切得很勤用 `v-show`（省去反复建销），一开始就不该出现的东西用 `v-if`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'v-if 拿掉节点，v-show 只是藏起来',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const on = ref(true)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="t" @click="on = !on">切换</button>',
          '  <p class="if" v-if="on">v-if 这里</p>',
          '  <p class="show" v-show="on">v-show 这里</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'has(".if", "打开时 v-if 在")',
          'eq(count(".show"), 1, "v-show 一直在 DOM 里")',
          'click(".t"); await tick();',
          'missing(".if", "关掉后 v-if 的节点没了")',
          'eq(count(".show"), 1, "关掉后 v-show 的节点还在")',
          'eq(style(".show", "display"), "none", "它只是 display 变 none")'
        ]
      },
      {
        kind: 'table',
        code: true,
        head: ['', '`v-if`', '`v-show`'],
        rows: [
          ['关掉时', '节点消失', '节点还在'],
          ['`count()` 查得到吗', '查不到', '查得到'],
          ['靠什么隐藏', '不生成', '`display: none`'],
          ['切得很勤时', '每次要重建', '只改样式，更划算']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '同一层里 `v-if` 和 `v-show` 别混着判断同一件事。名字取反写反了，页面上很难看出来——但它查得出来。'
      },
      {
        kind: 'prose',
        md: [
          '## `v-for` 把数组画成一批元素',
          '',
          '写法是 `v-for="item in 数组"`，写在要重复的那个标签上，重复的是**这个标签和它的内容**。',
          '',
          '拿一项元素的 `text()` 只能拿到第一项的合并文字；要一项一项看，用 `$$` 拿数组再取下标。',
          '',
          '## `:key` 为什么必须有',
          '',
          'Vue 按位置复用元素。列表一变，它得知道「谁是新的、谁还是原来那个」。',
          '',
          '`:key` 就是这项的身份。给每项一个**稳定且唯一**的值（一般用 `id`）。',
          '用下标当 key，删掉第一项之后所有下标都挪位，复用就对错了对象。',
          '',
          '一条规矩：`:key` 绑的要是这项数据自己的身份，不要用 `index`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'v-for 画一个列表，:key 绑 id',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const rows = ref([',
          "  { id: 1, name: '苹果' },",
          "  { id: 2, name: '香蕉' },",
          "  { id: 3, name: '橘子' }",
          '])',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul class="list">',
          '    <li v-for="row in rows" :key="row.id">{{ row.name }}</li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".list li"), 3, "三项都画出来了")',
          'eq($$(".list li")[0].textContent, "苹果", "第一项")',
          'eq($$(".list li")[2].textContent, "橘子", "第三项")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-1',
        title: '登录了就打招呼',
        task: [
          '组件里有一个 `on`。请用 `v-if` 加一个「没登录」的分支：',
          '',
          '- `on` 为真时显示 `p.ok`，文字 `欢迎回来`。',
          '- 否则不显示 `p.ok`（这种情况下一个也别画）。',
          '',
          '检查项会先数 `p.ok` 的个数，再点按钮把 `on` 关掉，看它是不是真的消失了。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const on = ref(true)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="t" @click="on = !on">切换</button>',
          '  <p class="ok">欢迎回来</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const on = ref(true)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="t" @click="on = !on">切换</button>',
          '  <p class="ok" v-if="on">欢迎回来</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".ok"), 1, "一开始要有一个 p.ok")',
          'click(".t"); await tick();',
          'missing(".ok", "关掉之后 p.ok 要从 DOM 里消失")'
        ],
        hints: [
          '条件写在 `p` 上：`v-if="on"`。',
          '`v-if` 拿掉节点之后，`count(".ok")` 会变成 `0`——不是藏起来，是不在。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-2',
        title: '把状态分成三档',
        task: [
          '`p.tip` 要按 `n` 显示三种文字：',
          '',
          '- `n` 小于 0：`欠着`',
          '- `n` 等于 0：`正好`',
          '- `n` 大于 0：`多了`',
          '',
          '用 `v-if` / `v-else-if` / `v-else` 放在同一个 `p` 上，页面上永远只有这一个 `p`。',
          '',
          '检查项会读它的文字，再点按钮把 `n` 从 2 加到 3。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(2)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="t" @click="n++">加一</button>',
          '  <p class="tip" v-if="n < 0">欠着</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(2)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="t" @click="n++">加一</button>',
          '  <p class="tip" v-if="n < 0">欠着</p>',
          '  <p class="tip" v-else-if="n === 0">正好</p>',
          '  <p class="tip" v-else>多了</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".tip"), 1, "三个分支里只留一个 p")',
          'eq(text(".tip"), "多了", "n 是 2，走最后一支")',
          'click(".t"); await tick();',
          'eq(text(".tip"), "多了", "加一之后还是多了")'
        ],
        hints: [
          '三支都写在 `p` 上：第一个 `v-if`，第二个 `v-else-if`，最后 `v-else` 不用写条件。',
          '`v-else-if` 里的比较要用 `===`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-3',
        title: '用 v-show 藏一个面板',
        task: [
          '这里有一个面板 `p.panel`，请做成可以开关：',
          '',
          '- 用 `v-show` 绑定 `open`。',
          '- 关掉之后它**要留在 DOM 里**，只是看不见。',
          '',
          '检查项会点按钮，然后同时看「还在不在」和它的 `display`。',
          '',
          '用 `v-show`，不要用 `v-if`——两者这一项的分值不一样。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const open = ref(true)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="t" @click="open = !open">开关</button>',
          '  <p class="panel">我是面板</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const open = ref(true)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="t" @click="open = !open">开关</button>',
          '  <p class="panel" v-show="open">我是面板</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".panel"), 1, "一开始面板在")',
          'click(".t"); await tick();',
          'eq(count(".panel"), 1, "关掉之后它还在 DOM 里")',
          'eq(style(".panel", "display"), "none", "只是 display 变成了 none")'
        ],
        hints: [
          '写在 `p` 上：`v-show="open"`。',
          '`v-show` 不删节点，所以关掉之后 `count(".panel")` 还是 `1`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-4',
        title: '把数组画成列表',
        task: [
          '`items` 是一个字符串数组。请把它渲染成 `ul.list` 里的 `li`：',
          '',
          '- 每一项一个 `li`。',
          '- 加上 `:key`。',
          '',
          '这个数组里会有重复的文字，所以 `:key` 不能用文字本身。',
          '数组的下标可以用，而且它就在这里——`:key="i"`。',
          '',
          '检查项会数 `li` 的个数，再一项一项对文字。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const items = ref(['鸡蛋', '鸡蛋', '牛奶'])",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul class="list"></ul>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const items = ref(['鸡蛋', '鸡蛋', '牛奶'])",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <ul class="list">',
          '    <li v-for="(it, i) in items" :key="i">{{ it }}</li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".list li"), 3, "三项都要画出来")',
          'eq($$(".list li")[0].textContent, "鸡蛋", "第一项")',
          'eq($$(".list li")[2].textContent, "牛奶", "第三项")'
        ],
        hints: [
          '要同时拿到项和下标写成 `v-for="(it, i) in items"`。',
          '`:key` 写在同一行：`:key="i"`。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '条件用 `v-if` 系列：不成立的那支不生成节点。只是要藏起来用 `v-show`：节点还在，改的是 `display`。',
          '循环用 `v-for`，每一项配一个稳定唯一的 `:key`。',
          '',
          '下一章在这个列表上做增删，并看数组响应式的两个坑。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
