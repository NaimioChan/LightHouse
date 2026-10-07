/* ch05 — 事件与表单：@click 的修饰符、@keyup.enter、v-model 的几种控件形态。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch05
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch05',
    title: '第 5 章 · 事件与表单',
    goal: '用 @click 的修饰符控制默认行为与冒泡，用 @keyup.enter 接键盘，用 v-model 把文本框、复选框、下拉选单、单选按钮和状态绑在一起。',
    sections: [
      {
        kind: 'prose',
        md: [
          '这一章讲两件事：怎么接用户的操作，表单控件的值怎么交给状态。',
          '',
          '`@click` 前面用过，这里补它的修饰符——管默认行为和事件冒泡；再加一个键盘事件 `@keyup.enter`。',
          '然后是 `v-model`，它把「显示值」和「写回值」合成一句。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 修饰符：不改逻辑，只改事件往哪走',
          '',
          '事件后面可以跟修饰符，管的是「这次事件该不该继续」。常用的三个：',
          '',
          '- `.prevent` —— 阻止默认行为。链接别跳转，表单别提交。',
          '- `.stop` —— 阻止冒泡。点内层按钮时，别让外层容器也收到这次点击。',
          '- `.once` —— 只响应第一次，之后这个处理函数不再跑。',
          '',
          '修饰符可以叠在一起写。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['写法', '作用'],
        rows: [
          ['`@click.prevent`', '拦掉默认行为：链接不跳转、表单不提交'],
          ['`@click.stop`', '拦掉冒泡：外层容器收不到这次点击'],
          ['`@click.once`', '只跑第一次'],
          ['`@click.prevent.stop`', '两个一起用，顺序不影响结果']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '修饰符写在**事件名和 `=` 之间**：`@click.stop="..."`。写成 `@click="...stop"` 是把 `stop` 当成了表达式，不生效。'
      },
      {
        kind: 'demo',
        caption: '.stop 与 .prevent 各管一件事',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const outer = ref(0)',
          'const inner = ref(0)',
          'const link = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="card" @click="outer++">',
          '    <button class="inner" @click.stop="inner++">内层按钮</button>',
          '    <p class="o">外层 {{ outer }}</p>',
          '    <p class="i">内层 {{ inner }}</p>',
          '  </div>',
          '  <a class="link" href="#nowhere" @click.prevent="link++">一个链接</a>',
          '  <p class="l">链接 {{ link }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".o"), "外层 0", "外层初始是 0")',
          'eq(text(".i"), "内层 0", "内层初始是 0")',
          'eq(text(".l"), "链接 0", "链接初始是 0")',
          'click(".inner"); await tick();',
          'eq(text(".i"), "内层 1", "stop 之后内层加一")',
          'eq(text(".o"), "外层 0", "stop 挡住了冒泡，外层没变")',
          'click(".link"); await tick();',
          'eq(text(".l"), "链接 1", "prevent 不挡处理函数，计数照加")',
          'click(".card"); await tick();',
          'eq(text(".o"), "外层 1", "直接点卡片外层加一")'
        ]
      },
      {
        kind: 'demo',
        caption: '.once 只生效一次',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <button class="once" @click.once="n++">只会生效一次</button>',
          '  <p class="out">{{ n }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "0", "初始是 0")',
          'click(".once"); await tick();',
          'eq(text(".out"), "1", "第一次加一")',
          'click(".once"); await tick();',
          'eq(text(".out"), "1", "第二次不再加")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 回车键：`@keyup.enter`',
          '',
          '在输入框里按回车，常用来代替找提交按钮。Vue 把按键做成了修饰符：`@keyup.enter` 只在回车那一刻触发，别的键不动。',
          '',
          '`keyup` 是**松开**按键时触发。要在**按下**就触发，用 `@keydown.enter`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '回车把输入项加进列表',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const draft = ref('')",
          'const list = ref([])',
          '',
          'function add() {',
          '  const t = draft.value.trim()',
          '  if (!t) return',
          '  list.value.push(t)',
          "  draft.value = ''",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="draft" v-model="draft" @keyup.enter="add" placeholder="输入后按回车">',
          '  <p class="count">共 {{ list.length }} 项</p>',
          '  <ul>',
          '    <li v-for="(it, i) in list" :key="i">{{ it }}</li>',
          '  </ul>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".count"), "共 0 项", "初始没有项")',
          'input(".draft", "苹果"); await tick();',
          'var ev = new KeyboardEvent("keyup", { key: "Enter", bubbles: true, cancelable: true }); $(".draft").dispatchEvent(ev); await tick();',
          'eq(text(".count"), "共 1 项", "回车后加了一项")',
          'eq(text("li"), "苹果", "列表里是刚敲进去的")',
          'eq($(".draft").value, "", "提交后输入框清空")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `v-model`：一句话做双向绑定',
          '',
          '输入框既要「把状态显示出来」，又要「把输入写回状态」，两件事各写一遍容易漏。`v-model` 把两者合一：',
          '',
          '1. 状态变了，控件里的值跟着变。',
          '2. 控件里输入了，状态跟着变。',
          '',
          '不用再手写 `@input` 或 `@change`。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '浏览器里，文本框改内容触发的是 `input`，下拉选单改选项触发的是 `change`。这两种事件 `v-model` 都替你接好了，写的时候不用区分。'
      },
      {
        kind: 'demo',
        caption: '文本框与复选框共用一个 v-model',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const name = ref('非茗')",
          'const agree = ref(false)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="name" v-model="name">',
          '  <label><input class="agree" type="checkbox" v-model="agree"> 记住我</label>',
          '  <p class="out">{{ name }} · {{ agree ? "已同意" : "未同意" }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "非茗 · 未同意", "初始值")',
          'input(".name", "小明"); await tick();',
          'eq(text(".out"), "小明 · 未同意", "文本框改了名字")',
          'click(".agree"); await tick();',
          'eq(text(".out"), "小明 · 已同意", "复选框打上勾")',
          'click(".agree"); await tick();',
          'eq(text(".out"), "小明 · 未同意", "再点一下取消")'
        ]
      },
      {
        kind: 'table',
        head: ['控件', '`v-model` 绑到的东西'],
        rows: [
          ['文本框 `<input type="text">`', '字符串'],
          ['单个复选框（不写 `value`）', '布尔值'],
          ['多个复选框（同一个数组 + 各自的 `value`）', '数组'],
          ['下拉选单 `<select>`', '选中那一项的 `value`'],
          ['单选按钮 `<input type="radio">`', '被选中那一项的 `value`']
        ]
      },
      {
        kind: 'demo',
        caption: '下拉选单与单选按钮',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const city = ref('bj')",
          "const size = ref('m')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <select class="city" v-model="city">',
          '    <option value="bj">北京</option>',
          '    <option value="sh">上海</option>',
          '    <option value="gz">广州</option>',
          '  </select>',
          '  <label><input class="cup-m" type="radio" value="m" v-model="size"> 中杯</label>',
          '  <label><input class="cup-l" type="radio" value="l" v-model="size"> 大杯</label>',
          '  <p class="out">{{ city }} · {{ size }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".out"), "bj · m", "初始值")',
          'input(".city", "sh"); $(".city").dispatchEvent(new Event("change", { bubbles: true })); await tick();',
          'eq(text(".out"), "sh · m", "选单切到上海")',
          'click(".cup-l"); await tick();',
          'eq(text(".out"), "sh · l", "单选切到大杯")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-1',
        title: '把输入框和状态绑起来',
        task: [
          '`msg` 已经声明好了，但输入框还没和它绑上。',
          '',
          '请给 `input` 加上 `v-model`，让输入的内容立刻出现在下面的 `p.preview` 里。',
          '',
          '不用写 `@input`，也不用写函数。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const msg = ref('')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="field" placeholder="在这里打字">',
          '  <p class="preview">{{ msg }}</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const msg = ref('')",
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="field" v-model="msg" placeholder="在这里打字">',
          '  <p class="preview">{{ msg }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".preview"), "", "初始没有内容")',
          'input(".field", "你好"); await tick();',
          'eq(text(".preview"), "你好", "输入同步到预览")',
          'input(".field", "再见"); await tick();',
          'eq(text(".preview"), "再见", "再改一次也同步")'
        ],
        hints: [
          '把 `v-model="msg"` 写在 `input` 标签上。',
          '`v-model` 自己处理输入事件，不用再写 `@input`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-2',
        title: '按回车才算提交',
        task: [
          '给这个输入框加上回车提交：每按一次回车，下面的提交次数加一，其它按键不动。',
          '',
          '输入框已经和 `draft` 绑好了，只差一个键盘事件。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const draft = ref('')",
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="box" v-model="draft" placeholder="输入后按回车">',
          '  <p class="count">提交 {{ n }} 次</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          "const draft = ref('')",
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <input class="box" v-model="draft" @keyup.enter="n++" placeholder="输入后按回车">',
          '  <p class="count">提交 {{ n }} 次</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".count"), "提交 0 次", "初始是 0 次")',
          'var ev = new KeyboardEvent("keyup", { key: "a", bubbles: true, cancelable: true }); $(".box").dispatchEvent(ev); await tick();',
          'eq(text(".count"), "提交 0 次", "普通按键不计数")',
          'var ev2 = new KeyboardEvent("keyup", { key: "Enter", bubbles: true, cancelable: true }); $(".box").dispatchEvent(ev2); await tick();',
          'eq(text(".count"), "提交 1 次", "按回车后加一次")'
        ],
        hints: [
          '修饰符接在事件名后面：`@keyup.enter="n++"`。',
          '回车键的名字是 `Enter`，写 `@keyup.enter` 就行，不用自己判断。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-3',
        title: '复选框收集多选',
        task: [
          '三样水果，勾中的项要按勾选顺序收进 `picked`，显示成 `苹果，香蕉` 这种样子；一个都没勾时显示 `还没选`。',
          '',
          '`label()` 已经写好了，它读的是 `picked`。请让三个复选框都把勾选结果写进这个数组。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const picked = ref([])',
          '',
          'function label() {',
          "  return picked.value.length ? picked.value.join('，') : '还没选'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <label><input class="f1" type="checkbox" value="苹果"> 苹果</label>',
          '  <label><input class="f2" type="checkbox" value="香蕉"> 香蕉</label>',
          '  <label><input class="f3" type="checkbox" value="梨"> 梨</label>',
          '  <p class="picked">{{ label() }}</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const picked = ref([])',
          '',
          'function label() {',
          "  return picked.value.length ? picked.value.join('，') : '还没选'",
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <label><input class="f1" type="checkbox" value="苹果" v-model="picked"> 苹果</label>',
          '  <label><input class="f2" type="checkbox" value="香蕉" v-model="picked"> 香蕉</label>',
          '  <label><input class="f3" type="checkbox" value="梨" v-model="picked"> 梨</label>',
          '  <p class="picked">{{ label() }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".picked"), "还没选", "初始一个都没勾")',
          'click(".f1"); await tick();',
          'eq(text(".picked"), "苹果", "勾上苹果")',
          'click(".f2"); await tick();',
          'eq(text(".picked"), "苹果，香蕉", "再勾上香蕉")',
          'click(".f1"); await tick();',
          'eq(text(".picked"), "香蕉", "取消苹果")'
        ],
        hints: [
          '多个复选框共用一个数组时，每个 `input` 都要写 `v-model="picked"`。',
          '`value` 决定这一项被勾中时往数组里放什么，别删掉它。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-4',
        title: '拦住默认行为与冒泡',
        task: [
          '链接在一张可点击的卡片里。要求点链接时三件事同时成立：',
          '',
          '1. 链接的白底跳转不能发生。',
          '2. 链接自己的计数加一。',
          '3. 卡片收不到这次点击，卡片计数不变。',
          '',
          '现在缺的是修饰符。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const card = ref(0)',
          'const hit = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="card" @click="card++">',
          '    <a class="link" href="#nowhere" @click="hit++">点我不会跑走</a>',
          '  </div>',
          '  <p class="c">卡片 {{ card }}</p>',
          '  <p class="h">链接 {{ hit }}</p>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const card = ref(0)',
          'const hit = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <div class="card" @click="card++">',
          '    <a class="link" href="#nowhere" @click.prevent.stop="hit++">点我不会跑走</a>',
          '  </div>',
          '  <p class="c">卡片 {{ card }}</p>',
          '  <p class="h">链接 {{ hit }}</p>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".h"), "链接 0", "链接计数初始是 0")',
          'eq(text(".c"), "卡片 0", "卡片计数初始是 0")',
          'var ev = new MouseEvent("click", { bubbles: true, cancelable: true }); ok($(".link").dispatchEvent(ev) === false, "默认跳转被拦住了"); await tick();',
          'eq(text(".h"), "链接 1", "链接计数加一")',
          'eq(text(".c"), "卡片 0", "卡片没有被带动")'
        ],
        hints: [
          '`.prevent` 拦默认行为，`.stop` 拦冒泡，两个可以叠着写。',
          '写成 `@click.prevent.stop="hit++"`。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
