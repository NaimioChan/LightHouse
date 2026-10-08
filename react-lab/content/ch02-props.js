/* ch02 — props：值从外面传进来，组件靠参数接收。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch02 && node tools/verify-browser.mjs --chapter ch02
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch02',
    title: '第 2 章 · props：把值传进组件',
    goal: '会把组件拆小、用 props 把值传进去，并知道 props 是只读的。',
    sections: [
      {
        kind: 'prose',
        md: [
          '组件可以有**参数**，React 管它叫 `props`。父组件写标签时给的值，子组件在函数参数里接：',
          '',
          '- 传：`<${Greeting} name="非茗" />`',
          '- 接：`function Greeting(props) { return html`...${props.name}...` }`',
          '',
          '`props` 是一个普通对象。取里面的值用 `props.名字`，也可以直接在参数里解构：',
          '`function Greeting({ name }) { ... }`。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['在哪写', '怎么拿', '说明'],
        rows: [
          ['`function C(props)`', '`props.name`', '原样接收'],
          ['`function C({ name })`', '`name`', '解构，最常用'],
          ['`function C({ name = \'路人\' })`', '`name`', '带默认值']
        ]
      },
      {
        kind: 'demo',
        caption: '把 props 传给子组件',
        code: [
          'function Greeting(props) {',
          '  return html`<p class="g">你好，${props.name}！</p>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div>',
          '    <${Greeting} name="非茗" />',
          '    <${Greeting} name="阿黄" />',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".g"), 2, "渲染出两个子组件")',
          'eq(text(".g"), "你好，非茗！", "第一个拿到自己的 props")',
          'eq(text("p:nth-child(2)"), "你好，阿黄！", "第二个拿到自己的 props")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '组件名必须**大写开头**。`<${greeting} />` 会被当成一个 HTML 标签，而不是你的组件。'
      },
      {
        kind: 'prose',
        md: [
          '## 传进去的可以是任何值',
          '',
          '字符串可以写 `name=\"非茗\"`，但数字、布尔、对象、函数都要用 `${}` 包起来：',
          '`count=${3}`、`items=${list}`、`onPick=${fn}`。',
          '',
          '子组件里**不要**改 props：`props.name = \'x\'` 是错的，React 靠「数据只从上往下流」来保持可预测。',
          '要改，得由父组件把「改」这件事也做成函数传进来（第 4 章以后讲）。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '传非字符串的值',
        code: [
          'function Badge({ label, count }) {',
          '  return html`<span class="b">${label}（${count}）</span>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div>',
          '    <${Badge} label="收藏" count=${3} />',
          '    <${Badge} label="点赞" count=${128} />',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".b"), "收藏（3）", "数字 props 也能插值")',
          'eq(count(".b"), 2, "两个 badge")'
        ]
      },
      {
        kind: 'demo',
        caption: 'props 里放函数：把行为也传下去',
        code: [
          'function Item({ text, onPick }) {',
          '  return html`<button class="it" onClick=${onPick}>${text}</button>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div>',
          '    <${Item} text="苹果" onPick=${() => console.log("选了苹果")} />',
          '    <${Item} text="香蕉" onPick=${() => console.log("选了香蕉")} />',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".it"), "苹果", "第一个 item")',
          'click("button:nth-child(2)"); await tick();',
          'has("button:nth-child(2)", "第二个按钮还在")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-1',
        title: '把名字传给子组件',
        task: [
          '`Card` 组件想显示一句问候，但还没接参数。请：',
          '',
          '1. 让 `Card` 接收 `name` 这个 prop。',
          '2. 把 `name` 插进 `p` 里，显示成 `你好，非茗`。',
          '',
          '父组件已经把 `name="非茗"` 传下来了。'
        ].join('\n'),
        starter: [
          'function Card(props) {',
          '  return html`<p class="c">你好，</p>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${Card} name="非茗" />`',
          '}'
        ].join('\n'),
        solution: [
          'function Card(props) {',
          '  return html`<p class="c">你好，${props.name}</p>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${Card} name="非茗" />`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".c"), "你好，非茗", "子组件读出 props.name")',
          'eq(count(".c"), 1, "只渲染一个 Card")'
        ],
        hints: [
          '函数参数 `props` 已经有了，读 `props.name`。',
          '插值写成 `${props.name}`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-2',
        title: '用解构接 props',
        task: [
          '把 `Card` 的参数改成**解构**写法 `{ name, job }`，直接把两个值插进 `p`，',
          '显示成 `非茗 · 前端`。',
          '',
          '两个 prop 父组件都已经传了。'
        ].join('\n'),
        starter: [
          'function Card(props) {',
          '  return html`<p class="c">${props.name} · </p>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${Card} name="非茗" job="前端" />`',
          '}'
        ].join('\n'),
        solution: [
          'function Card({ name, job }) {',
          '  return html`<p class="c">${name} · ${job}</p>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${Card} name="非茗" job="前端" />`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".c"), "非茗 · 前端", "两个 prop 都用了")',
          'has(".c", "页面上要有 .c")'
        ],
        hints: [
          '参数写成 `{ name, job }`，函数体里就直接用 `name`、`job`。',
          '别漏掉 `job` 的插值。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-3',
        title: '给 prop 一个默认值',
        task: [
          '`Card` 的 `job` 现在可能没人传。请在解构里给 `job` 一个默认值 `\'待业\'`，',
          '这样父组件只传 `name="非茗"` 时，页面显示成 `非茗 · 待业`。',
          '',
          '父组件的代码不要改。'
        ].join('\n'),
        starter: [
          'function Card({ name, job }) {',
          '  return html`<p class="c">${name} · ${job}</p>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${Card} name="非茗" />`',
          '}'
        ].join('\n'),
        solution: [
          'function Card({ name, job = \'待业\' }) {',
          '  return html`<p class="c">${name} · ${job}</p>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${Card} name="非茗" />`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".c"), "非茗 · 待业", "没传 job 时用默认值")',
          'eq(count("p"), 1, "只渲染一个 p")'
        ],
        hints: [
          '默认值写在解构里：`{ name, job = \'待业\' }`。',
          '默认值只在父组件**没传**这个 prop 时生效。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-4',
        title: '把列表项拆成组件',
        task: [
          '把 `Item` 拆成一个子组件，用 props 接收 `text`，渲染成 `li`，文字就是 `text`。',
          '',
          '父组件用 `items` 数组渲染出两项：`苹果`、`香蕉`。',
          '（渲染数组要用 `items.map`，这部分第 3 章细讲，这里先照抄父组件已有的写法。）'
        ].join('\n'),
        starter: [
          'function Item({ text }) {',
          '  return html`<li class="it">占位</li>`',
          '}',
          '',
          'export default function App() {',
          '  const items = [\'苹果\', \'香蕉\']',
          '  return html`<ul>${items.map((t, i) => html`<${Item} key=${i} text=${t} />`)}</ul>`',
          '}'
        ].join('\n'),
        solution: [
          'function Item({ text }) {',
          '  return html`<li class="it">${text}</li>`',
          '}',
          '',
          'export default function App() {',
          '  const items = [\'苹果\', \'香蕉\']',
          '  return html`<ul>${items.map((t, i) => html`<${Item} key=${i} text=${t} />`)}</ul>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count("li"), 2, "渲染出两项")',
          'eq(text(".it"), "苹果", "第一项拿到自己的 text")',
          'eq(text("li:nth-child(2)"), "香蕉", "第二项拿到自己的 text")'
        ],
        hints: [
          '子组件把 `text` 插进 `li` 里就行。',
          '父组件已经把 `text=${t}` 传进来了，你只要用。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          'props 是父组件传下来的参数；子组件用 `props.x` 或解构 `{ x }` 接收，可以带默认值。',
          'props 只读，子组件不许改它。组件名必须大写开头，否则被当成 HTML 标签。',
          '',
          '下一章讲怎么把数组渲染成列表，以及 `key` 为什么不能随便写。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
