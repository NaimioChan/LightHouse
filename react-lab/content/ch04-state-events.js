/* ch04 — state 与事件：用 useState 存会变的值，用事件处理器去改它。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch04 && node tools/verify-browser.mjs --chapter ch04
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch04',
    title: '第 4 章 · state 与事件',
    goal: '会用 useState 存会变的值、用事件处理器改它，并知道什么时候该用函数式更新。',
    sections: [
      {
        kind: 'prose',
        md: [
          '组件里**会变的值**用 `useState` 存。它返回一个二元数组，通常解构出来：',
          '',
          '- `const [n, setN] = useState(0)`：`n` 是当前值，`setN` 是改它的函数。',
          '',
          '调用 `setN(新值)` 之后，React 会**重新渲染**这个组件，模板里的 `n` 就变成新值。',
          '只在函数里改一个普通变量不会重渲染，而且那个变量在下一次渲染时会被重新赋值。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['写法', '含义'],
        rows: [
          ['`const [n, setN] = useState(0)`', '声明一个初始 0 的状态'],
          ['`setN(5)`', '把 n 设为 5，并排队一次重渲染'],
          ['`setN(n + 1)`', '用当前值算新值'],
          ['`setN(v => v + 1)`', '用函数式更新，拿到的 v 是最新值']
        ]
      },
      {
        kind: 'demo',
        caption: '用 useState 做计数器',
        code: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  return html`<button class="b" onClick=${() => setN(n + 1)}>${n}</button>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".b"), "0", "初始是 0")',
          'click(".b"); await tick();',
          'eq(text(".b"), "1", "点一次加一")',
          'click(".b"); await tick();',
          'eq(text(".b"), "2", "再点一次加一")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '事件处理器是「传函数」，写 `onClick=${fn}`。写成 `onClick=${fn()}` 会**在渲染时就把函数调了**，不是等点击。'
      },
      {
        kind: 'prose',
        md: [
          '## 想要新值，用函数式更新',
          '',
          '`setN(n + 1)` 里的 `n` 是**这一次渲染**看见的旧值。同一次事件里写两遍，两遍读到的 `n` 一样，',
          '最终只加一。',
          '',
          '`setN(v => v + 1)` 把「怎么从旧值算新值」交给 React，队列里的每一步都拿到上一步的结果，',
          '连着写两遍就是加二。新值依赖旧值时，用这个写法。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一个值改两次：普通写法与函数式更新的差别',
        code: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [a, setA] = useState(0)',
          '  const [b, setB] = useState(0)',
          '  return html`<div>',
          '    <button class="plain" onClick=${() => { setA(a + 1); setA(a + 1) }}>plain ${a}</button>',
          '    <button class="fn" onClick=${() => { setB(v => v + 1); setB(v => v + 1) }}>fn ${b}</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".plain"), "plain 0", "初始 plain 为 0")',
          'click(".plain"); await tick();',
          'eq(text(".plain"), "plain 1", "两次 setA(a+1) 只加一")',
          'click(".fn"); await tick();',
          'eq(text(".fn"), "fn 2", "两次函数式更新加二")',
          'click(".plain"); await tick();',
          'eq(text(".plain"), "plain 2", "再点一次 plain 加一")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 处理器能拿到事件对象',
          '',
          '事件处理器被调用时会收到一个事件对象，需要时用参数接：`onClick=${(e) => ...}`。',
          '常见用到的是 `e.target`、`e.preventDefault()`。',
          '',
          '处理器写成 `() => setN(n + 1)` 也行，只要别在渲染时就调用它。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '布尔状态：函数式更新取反',
        code: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [on, setOn] = useState(false)',
          '  return html`<button class="t" onClick=${() => setOn(v => !v)}>${on ? "开" : "关"}</button>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".t"), "关", "初始是关")',
          'click(".t"); await tick();',
          'eq(text(".t"), "开", "点一下变开")',
          'click(".t"); await tick();',
          'eq(text(".t"), "关", "再点一下变关")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-1',
        title: '让按钮点一下加一',
        task: [
          '按钮现在写在页面上的次数永远是 0。请用 `useState` 让它真的会累加：',
          '',
          '- 初始显示 `点了 0 次`；',
          '- 每点一次，数字加一（`点了 1 次`、`点了 2 次`……）。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  const n = 0',
          '  return html`<button class="b">点了 ${n} 次</button>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  return html`<button class="b" onClick=${() => setN(n + 1)}>点了 ${n} 次</button>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".b"), "点了 0 次", "初始为 0")',
          'click(".b"); await tick();',
          'eq(text(".b"), "点了 1 次", "点一次加一")',
          'click(".b"); await tick();',
          'eq(text(".b"), "点了 2 次", "再点一次加一")'
        ],
        hints: [
          '把普通变量换成 `const [n, setN] = useState(0)`。',
          '给按钮加 `onClick=${() => setN(n + 1)}`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-2',
        title: '加一个归零按钮',
        task: [
          '页面有一个「加一」和一个「归零」按钮，`n` 显示在 `p.n` 里。',
          '现在两个按钮都不能用。请用 `useState`：',
          '',
          '- 「加一」把 `n` 加一；',
          '- 「归零」把 `n` 设回 0。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  const n = 0',
          '  return html`<div>',
          '    <button class="inc">加一</button>',
          '    <button class="reset">归零</button>',
          '    <p class="n">${n}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  return html`<div>',
          '    <button class="inc" onClick=${() => setN(n + 1)}>加一</button>',
          '    <button class="reset" onClick=${() => setN(0)}>归零</button>',
          '    <p class="n">${n}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".n"), "0", "初始为 0")',
          'click(".inc"); await tick();',
          'eq(text(".n"), "1", "加一之后是 1")',
          'click(".inc"); await tick();',
          'eq(text(".n"), "2", "再加一是 2")',
          'click(".reset"); await tick();',
          'eq(text(".n"), "0", "归零回到 0")'
        ],
        hints: [
          '两个按钮各写一个 `onClick`。',
          '归零就是 `setN(0)`，不需要用 `n`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-3',
        title: '切换开关',
        task: [
          '做一个开关按钮，文字在 `已关闭` 和 `已开启` 之间切换。',
          '',
          '- 初始是 `已关闭`；',
          '- 每点一次切换一次；',
          '',
          '用 `useState` 存布尔值，切换时用函数式更新 `setOn(v => !v)`。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  const on = false',
          '  return html`<button class="sw">${on ? "已开启" : "已关闭"}</button>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [on, setOn] = useState(false)',
          '  return html`<button class="sw" onClick=${() => setOn(v => !v)}>${on ? "已开启" : "已关闭"}</button>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".sw"), "已关闭", "初始是已关闭")',
          'click(".sw"); await tick();',
          'eq(text(".sw"), "已开启", "点一下变已开启")',
          'click(".sw"); await tick();',
          'eq(text(".sw"), "已关闭", "再点一下变回已关闭")'
        ],
        hints: [
          '`const [on, setOn] = useState(false)`。',
          '切换用 `setOn(v => !v)`，`v` 是最新的布尔值。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-4',
        title: '一次点击加三',
        task: [
          '按钮现在每点一次只加一，但它在处理器里调了三次 `setN`。',
          '',
          '请改成函数式更新，让每点一次加 **三**：初始 0，点一次到 3，再点一次到 6。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  return html`<button class="b" onClick=${() => { setN(n + 1); setN(n + 1); setN(n + 1) }}>${n}</button>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  return html`<button class="b" onClick=${() => { setN(v => v + 1); setN(v => v + 1); setN(v => v + 1) }}>${n}</button>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".b"), "0", "初始为 0")',
          'click(".b"); await tick();',
          'eq(text(".b"), "3", "点一次加三")',
          'click(".b"); await tick();',
          'eq(text(".b"), "6", "再点一次到 6")'
        ],
        hints: [
          '把三处 `setN(n + 1)` 各改成 `setN(v => v + 1)`。',
          '每次点击都从最新的值往上加，三个更新就加了三。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '`useState(初始值)` 返回 `[值, 设置函数]`；调用设置函数会排队一次重渲染。',
          '新值依赖旧值时用函数式更新 `setN(v => v + 1)`，同一段里连写多次才叠加得上。',
          '事件处理器写成 `onClick=${fn}` 传函数，别写成 `onClick=${fn()}`。',
          '',
          '下一章讲受控表单：把输入框的值也放进 state。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
