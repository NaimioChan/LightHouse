/* ch11 — useReducer：给状态的每一次变化起个名字，把变化集中在一个纯函数里。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch11 && node tools/verify-browser.mjs --chapter ch11
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch11',
    title: '第 11 章 · useReducer',
    goal: '看懂什么时候该把状态变化收进 reducer，能用 useReducer 写计数、增删列表和带参数的动作。',
    sections: [
      {
        kind: 'prose',
        md: [
          '前面的 `useState` 适合改一个简单的值。可当「改」有好几种方式，或者一次要动好几个值时，',
          '散落各处的 `setN(n + 1)` 会越来越难读：你得从每个按钮反推它到底改变了什么。',
          '',
          '`useReducer` 换一种组织方式：把**所有**改动的规则写进一个函数，给每种改动起一个名字，',
          '组件里只负责「报告发生了什么」。',
          '',
          '- 命名：`useReducer(reducer, 初始值)` 返回 `[state, dispatch]`，和 `useState` 一样是数组解构。',
          '- 纯粹的规则函数：`reducer(state, action)` 读入**当前状态**和**动作**，返回**新的状态**。',
          '- 报告：`dispatch({ type: \'increment\' })`。`dispatch` 只描述动作，具体怎么改由 `reducer` 决定。',
          '',
          '一个简单值用 `useState` 就够了；当改动的名称比值本身更重要，或者一次要动几处，才用得着 `useReducer`。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['', 'useState', 'useReducer'],
        rows: [
          ['写法', '`const [n, setN] = useState(0)`', '`const [state, dispatch] = useReducer(reducer, 0)`'],
          ['改动', '`setN(n + 1)`', '`dispatch({ type: \'increment\' })`'],
          ['规则放哪', '写在事件处理里', '集中在 `reducer` 函数']
        ]
      },
      {
        kind: 'demo',
        caption: '一个计数器 reducer：加、减、清零',
        code: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'increment\') return state + 1',
          '  if (action.type === \'decrement\') return state - 1',
          '  if (action.type === \'reset\') return 0',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [count, dispatch] = useReducer(reducer, 0)',
          '  return html`<div>',
          '    <span class="count">${count}</span>',
          '    <button class="inc" onClick=${() => dispatch({ type: \'increment\' })}>加一</button>',
          '    <button class="dec" onClick=${() => dispatch({ type: \'decrement\' })}>减一</button>',
          '    <button class="reset" onClick=${() => dispatch({ type: \'reset\' })}>清零</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".count"), "0", "初始是 0")',
          'click(".inc"); await tick();',
          'eq(text(".count"), "1", "加一之后")',
          'click(".reset"); await tick();',
          'eq(text(".count"), "0", "清零之后")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`reducer` 必须是**纯函数**：只根据传进来的 `state` 和 `action` 算出新值，不改参数、不发请求、不写 `localStorage`。React 在某些情况下会重复调用它，脏操作会被执行多次。'
      },
      {
        kind: 'prose',
        md: [
          '## 不修改，返回新的',
          '',
          '最简单也最容易犯的错，是直接在数组上 `push` / `splice`：那是**修改**原对象，React 可能看不到变化，',
          '因为你交回去的还是同一个引用。',
          '',
          '正确做法是构造一个**新数组**：`return [...state, 新项]` 加，`return state.filter(...)` 删。',
          '对象同理，用 `{ ...old, 字段: 新值 }`，而不是 `old.字段 = 新值`。',
          '',
          '`state` 和 `action` 都只是普通值，动作长什么样由你定，习惯上用 `{ type: \'...\' }` 加一个 `type` 来区分。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '数组 reducer：不修改，返回新数组',
        code: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'add\') return [...state, action.text]',
          '  if (action.type === \'remove\') return state.filter((t) => t !== action.text)',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [items, dispatch] = useReducer(reducer, [\'牛奶\'])',
          '  return html`<div>',
          '    <ul class="list">${items.map((t) => html`<li class="item" key=${t}>${t}</li>`)}</ul>',
          '    <button class="add" onClick=${() => dispatch({ type: \'add\', text: \'面包\' })}>加面包</button>',
          '    <button class="rm" onClick=${() => dispatch({ type: \'remove\', text: \'牛奶\' })}>删牛奶</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".item"), 1, "一开始一项")',
          'click(".add"); await tick();',
          'eq(count(".item"), 2, "加一项之后")',
          'eq(text("li:nth-child(2)"), "面包", "新项加在末尾")',
          'click(".rm"); await tick();',
          'eq(text(".item"), "面包", "删掉牛奶后只剩面包")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 动作用 `{ type, ... }` 带参数',
          '',
          '动作是一个普通对象，除了 `type` 还能带上别的字段。`dispatch({ type: \'addBy\', n: 5 })` 把 `5`',
          '交给了 `reducer`，`reducer` 用 `action.n` 取。这样同一个 `reducer` 能处理「加几」这种带参数的请求，',
          '不必为每个数字各写一个 `type`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '动作带参数：一次加几由 dispatch 决定',
        code: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'addBy\') return state + action.n',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [n, dispatch] = useReducer(reducer, 0)',
          '  return html`<div>',
          '    <span class="n">${n}</span>',
          '    <button class="five" onClick=${() => dispatch({ type: \'addBy\', n: 5 })}>加 5</button>',
          '    <button class="ten" onClick=${() => dispatch({ type: \'addBy\', n: 10 })}>加 10</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".n"), "0", "初始是 0")',
          'click(".five"); await tick();',
          'eq(text(".n"), "5", "加 5 之后")',
          'click(".ten"); await tick();',
          'eq(text(".n"), "15", "再加 10 之后")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-1',
        title: '把计数器改成 reducer',
        task: [
          '现在 `reducer` 什么都不做。请让它处理 `increment`：返回 `state + 1`。',
          '',
          '`increment` 按钮已经派发 `{ type: \'increment\' }`，你只改 `reducer`。'
        ].join('\n'),
        starter: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [count, dispatch] = useReducer(reducer, 0)',
          '  return html`<div>',
          '    <span class="count">${count}</span>',
          '    <button class="inc" onClick=${() => dispatch({ type: \'increment\' })}>加一</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'increment\') return state + 1',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [count, dispatch] = useReducer(reducer, 0)',
          '  return html`<div>',
          '    <span class="count">${count}</span>',
          '    <button class="inc" onClick=${() => dispatch({ type: \'increment\' })}>加一</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".count"), "0", "初始是 0")',
          'click(".inc"); await tick();',
          'eq(text(".count"), "1", "点一次加一")',
          'click(".inc"); await tick();',
          'eq(text(".count"), "2", "再点一次再加一")'
        ],
        hints: [
          '在 `reducer` 里写 `if (action.type === \'increment\') return state + 1`。',
          '按钮已经在派发 `{ type: \'increment\' }` 了，你只要让 `reducer` 认这个 `type`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-2',
        title: '再接一个减一',
        task: [
          '计数器现在只能加。请给 `reducer` 加一个 `decrement` 分支，返回 `state - 1`，',
          '「加一」「减一」两个按钮都生效。'
        ].join('\n'),
        starter: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'increment\') return state + 1',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [count, dispatch] = useReducer(reducer, 0)',
          '  return html`<div>',
          '    <span class="count">${count}</span>',
          '    <button class="inc" onClick=${() => dispatch({ type: \'increment\' })}>加一</button>',
          '    <button class="dec" onClick=${() => dispatch({ type: \'decrement\' })}>减一</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'increment\') return state + 1',
          '  if (action.type === \'decrement\') return state - 1',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [count, dispatch] = useReducer(reducer, 0)',
          '  return html`<div>',
          '    <span class="count">${count}</span>',
          '    <button class="inc" onClick=${() => dispatch({ type: \'increment\' })}>加一</button>',
          '    <button class="dec" onClick=${() => dispatch({ type: \'decrement\' })}>减一</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".count"), "0", "初始是 0")',
          'click(".inc"); await tick();',
          'click(".inc"); await tick();',
          'eq(text(".count"), "2", "加两次")',
          'click(".dec"); await tick();',
          'eq(text(".count"), "1", "减一次回到 1")',
          'click(".dec"); await tick();',
          'eq(text(".count"), "0", "再减一次回到 0")'
        ],
        hints: [
          '照抄 `increment` 那一行，把 `+ 1` 改成 `- 1`，`type` 写成 `decrement`。',
          '别忘了最后那行 `return state`，它兜住所有没认出来的 `type`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-3',
        title: '用 reducer 切换布尔值',
        task: [
          '开关的状态是一个布尔值。请在 `reducer` 里处理 `toggle`，返回**取反**后的值：',
          '`true` 变 `false`，`false` 变 `true`。',
          '',
          '按钮点击后派发 `{ type: \'toggle\' }`，页面上显示 `开` 或 `关`。'
        ].join('\n'),
        starter: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [on, dispatch] = useReducer(reducer, false)',
          '  return html`<div>',
          '    <span class="state">${on ? \'开\' : \'关\'}</span>',
          '    <button class="tg" onClick=${() => dispatch({ type: \'toggle\' })}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'toggle\') return !state',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [on, dispatch] = useReducer(reducer, false)',
          '  return html`<div>',
          '    <span class="state">${on ? \'开\' : \'关\'}</span>',
          '    <button class="tg" onClick=${() => dispatch({ type: \'toggle\' })}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".state"), "关", "初始是关")',
          'click(".tg"); await tick();',
          'eq(text(".state"), "开", "切一次变开")',
          'click(".tg"); await tick();',
          'eq(text(".state"), "关", "再切一次变关")'
        ],
        hints: [
          '取反就是一个 `!`：`return !state`。',
          '动作里不需要额外参数，只靠 `action.type` 判断。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-4',
        title: '带参数地加，或从列表里删',
        task: [
          '这份状态同时装着分数和名单，`reducer` 还是空的。请处理两个动作：',
          '',
          '1. `addBy`：把 `action.n` 加进总分。',
          '2. `remove`：用 `filter` 把 `action.name` 从名单里去掉，返回**新数组**。',
          '',
          '两个按钮都写好了，你只改 `reducer`。'
        ].join('\n'),
        starter: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [s, dispatch] = useReducer(reducer, { score: 0, names: [\'甲\', \'乙\'] })',
          '  return html`<div>',
          '    <span class="score">${s.score}</span>',
          '    <ul class="list">${s.names.map((x) => html`<li class="name" key=${x}>${x}</li>`)}</ul>',
          '    <button class="add" onClick=${() => dispatch({ type: \'addBy\', n: 3 })}>加 3 分</button>',
          '    <button class="rm" onClick=${() => dispatch({ type: \'remove\', name: \'甲\' })}>删甲</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useReducer } from 'react'",
          '',
          'function reducer(state, action) {',
          '  if (action.type === \'addBy\') return { ...state, score: state.score + action.n }',
          '  if (action.type === \'remove\') return { ...state, names: state.names.filter((x) => x !== action.name) }',
          '  return state',
          '}',
          '',
          'export default function App() {',
          '  const [s, dispatch] = useReducer(reducer, { score: 0, names: [\'甲\', \'乙\'] })',
          '  return html`<div>',
          '    <span class="score">${s.score}</span>',
          '    <ul class="list">${s.names.map((x) => html`<li class="name" key=${x}>${x}</li>`)}</ul>',
          '    <button class="add" onClick=${() => dispatch({ type: \'addBy\', n: 3 })}>加 3 分</button>',
          '    <button class="rm" onClick=${() => dispatch({ type: \'remove\', name: \'甲\' })}>删甲</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".score"), "0", "初始 0 分")',
          'eq(count(".name"), 2, "初始两个人")',
          'click(".add"); await tick();',
          'eq(text(".score"), "3", "加 3 分")',
          'click(".add"); await tick();',
          'eq(text(".score"), "6", "再加 3 分")',
          'click(".rm"); await tick();',
          'eq(count(".name"), 1, "删掉一个")',
          'eq(text(".name"), "乙", "剩下乙")'
        ],
        hints: [
          '对象要返回新对象：`return { ...state, score: state.score + action.n }`。',
          '删就用 `state.names.filter((x) => x !== action.name)`，`filter` 本来就返回新数组。',
          '别忘了最后 `return state` 兜底。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '改动的规则集中在一个纯 `reducer` 里，组件用 `dispatch({ type: \'...\' })` 报告发生了什么；',
          '`reducer` 永远返回**新值**，不要改旧对象。动作可以带上 `n`、`text` 这类参数。',
          '一个简单值用 `useState` 就够了，名字和组合才是 `useReducer` 的用武之地。',
          '',
          '下一章讲当值要穿过很多层组件往下传时，怎么用 `context` 免去一层层的 props。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
