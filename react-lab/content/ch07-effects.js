/* ch07 — 副作用与清理：useEffect 的依赖数组、清理函数、定时器。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch07 && node tools/verify-browser.mjs --chapter ch07
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch07',
    title: '第 7 章 · 副作用与清理',
    goal: '会用 useEffect 在渲染之外做事，会用清理函数收掉定时器和订阅。',
    sections: [
      {
        kind: 'prose',
        md: [
          '组件函数只做一件事：看着当前的 props 和 state，算出要画的结构。',
          '',
          '渲染之外的动作都算**副作用**：发请求、开定时器、订阅事件、直接改 DOM。这些要交给 `useEffect`，',
          'React 会在把页面画出来之后才调用它。组件函数本身得是纯的：同样的输入返回同样的结构。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '挂载后跑一次：加载中变成就绪',
        code: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          "  const [status, setStatus] = useState('加载中')",
          '  useEffect(() => {',
          "    setStatus('就绪')",
          '  }, [])',
          '  return html`<p class="s">${status}</p>`',
          '}'
        ].join('\n'),
        tests: [
          'await tick();',
          'eq(text(".s"), "就绪", "effect 在挂载后改了状态")',
          'eq(count(".s"), 1, "只有一个状态行")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 第二个参数决定什么时候跑',
          '',
          '`useEffect` 的第二个参数是**依赖数组**，列出这个 effect 用到的、来自组件作用域的值。',
          'React 每次渲染后比对一遍，只有数组里某一项变了才重跑这段副作用。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['写法', '什么时候跑', '用在哪'],
        rows: [
          ['`useEffect(fn, [])`', '挂载后一次', '初始化、开定时器、订阅'],
          ['`useEffect(fn, [dep])`', '挂载后，且 `dep` 变了才再跑', '把某个值同步出去'],
          ['`useEffect(fn)`', '每次渲染后都跑', '几乎总是 bug']
        ]
      },
      {
        kind: 'demo',
        caption: '依赖数组：n 变了才再跑',
        code: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [n, setN] = useState(1)',
          "  const [kind, setKind] = useState('')",
          '  useEffect(() => {',
          "    setKind(n > 0 ? '正数' : '非正数')",
          '  }, [n])',
          '  return html`<div>',
          '    <button class="b" onClick=${() => setN(n * -1)}>变号</button>',
          '    <p class="n">${n}</p>',
          '    <p class="k">${kind}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'await tick();',
          'eq(text(".k"), "正数", "首次渲染后算出正数")',
          'click(".b"); await tick();',
          'eq(text(".n"), "-1", "n 取反")',
          'eq(text(".k"), "非正数", "依赖 n 的 effect 跟着跑")'
        ]
      },
      {
        kind: 'demo',
        caption: '空数组只跑一次：别的状态变了它也不动',
        code: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  const [runs, setRuns] = useState(0)',
          '  useEffect(() => {',
          '    setRuns((v) => v + 1)',
          '  }, [])',
          '  return html`<div>',
          '    <button class="b" onClick=${() => setN(n + 1)}>点我</button>',
          '    <p class="n">${n}</p>',
          '    <p class="m">${runs}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'await tick();',
          'eq(text(".m"), "1", "effect 只跑了一次")',
          'click(".b"); await tick();',
          'click(".b"); await tick();',
          'eq(text(".n"), "2", "n 变了两次")',
          'eq(text(".m"), "1", "空数组的 effect 没有重跑")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`useEffect(fn)` 漏掉第二个参数时，每次渲染后都会跑。它常常又在里面 `setState`，于是再渲染、再跑，转成死循环被超时掐掉。除非清楚为什么，否则总给一个依赖数组。'
      },
      {
        kind: 'prose',
        md: [
          '## 清理函数',
          '',
          '`useEffect` 里的函数可以 `return` 一个函数，这就是**清理函数**。React 在两个时机调用它：',
          '',
          '- 依赖变化、effect 要重跑之前',
          '- 组件被卸载时',
          '',
          '开出去的定时器、订阅，都在这里收掉。不收，定时器会在组件已经不在时继续跑。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'setTimeout 配 clearTimeout',
        code: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          "  const [msg, setMsg] = useState('等待中')",
          '  useEffect(() => {',
          "    const id = setTimeout(() => setMsg('到点了'), 30)",
          '    return () => clearTimeout(id)',
          '  }, [])',
          '  return html`<p class="m">${msg}</p>`',
          '}'
        ].join('\n'),
        tests: [
          'await new Promise((r) => setTimeout(r, 120)); await tick();',
          'eq(text(".m"), "到点了", "定时器到点后更新")',
          'has(".m", "提示还在")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '在组件函数体（渲染那一段）里直接调用 `setState` 是错的：React 会立刻重渲染，又调用一次，转成死循环。改状态放进 `useEffect` 或事件处理器。'
      },
      {
        kind: 'exercise',
        id: 'ex07-1',
        title: '挂载后在 effect 里改状态',
        task: [
          '这个组件初始显示「准备中」。请让它挂载后变成「就绪」：',
          '',
          '1. 用 `useEffect` 加一段副作用。',
          '2. 依赖数组用 `[]`，让它在挂载后只跑一次。',
          '3. 在里面把 `ready` 设为 `true`。'
        ].join('\n'),
        starter: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [ready, setReady] = useState(false)',
          "  const label = ready ? '就绪' : '准备中'",
          '  return html`<p class="r">${label}</p>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [ready, setReady] = useState(false)',
          '  useEffect(() => {',
          '    setReady(true)',
          '  }, [])',
          "  const label = ready ? '就绪' : '准备中'",
          '  return html`<p class="r">${label}</p>`',
          '}'
        ].join('\n'),
        tests: [
          'await tick();',
          'eq(text(".r"), "就绪", "effect 里把 ready 设成 true")',
          'eq(count(".r"), 1, "只渲染一个提示")'
        ],
        hints: [
          '`useEffect` 已经 import 进来了，直接调用。',
          '第二个参数写空数组 `[]`，表示只在挂载后跑一次。',
          '在里面写 `setReady(true)`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-2',
        title: '用依赖数组把一个值同步进另一个状态',
        task: [
          '输入框的值存在 `name` 里，`echo` 还没接上。请加一段 effect：',
          '',
          '1. 依赖数组写 `[name]`。',
          '2. 在 effect 里把 `name` 赋给 `echo`（`setEcho(name)`）。',
          '',
          '这样每次 `name` 变化，`echo` 都会跟上。'
        ].join('\n'),
        starter: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          "  const [name, setName] = useState('')",
          "  const [echo, setEcho] = useState('')",
          '  return html`<div>',
          '    <input class="i" value=${name} onInput=${(e) => setName(e.target.value)} />',
          '    <p class="e">${echo}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          "  const [name, setName] = useState('')",
          "  const [echo, setEcho] = useState('')",
          '  useEffect(() => {',
          '    setEcho(name)',
          '  }, [name])',
          '  return html`<div>',
          '    <input class="i" value=${name} onInput=${(e) => setName(e.target.value)} />',
          '    <p class="e">${echo}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'input(".i", "非茗", "在输入框里打字")',
          'await tick();',
          'eq(text(".e"), "非茗", "effect 把 name 抄进 echo")',
          'eq($(".i").value, "非茗", "输入框显示输入的值")'
        ],
        hints: [
          'effect 放在两个 `useState` 之后、`return` 之前。',
          '依赖数组写 `[name]`，写成 `[]` 的话只会抄第一次的值。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-3',
        title: '开一个定时器，停得掉',
        task: [
          '计数器要每 20 毫秒加一，按钮能把开关切到「跑」/「停」。请：',
          '',
          '1. 在依赖 `[running]` 的 effect 里判断：没在跑就直接 `return`。',
          '2. 在跑的时候用 `setInterval` 让 `n` 加一，间隔 20 毫秒。',
          '3. 返回清理函数，用 `clearInterval` 收掉它。',
          '',
          '停止靠的是依赖变化前先跑清理函数，不是靠事件处理器。'
        ].join('\n'),
        starter: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [running, setRunning] = useState(true)',
          '  const [n, setN] = useState(0)',
          "  const label = running ? '停' : '跑'",
          '  useEffect(() => {',
          '    // 在这里开定时器，并返回清理函数',
          '  }, [running])',
          '  return html`<div>',
          '    <button class="t" onClick=${() => setRunning(!running)}>${label}</button>',
          '    <p class="n">${n}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [running, setRunning] = useState(true)',
          '  const [n, setN] = useState(0)',
          "  const label = running ? '停' : '跑'",
          '  useEffect(() => {',
          '    if (!running) return',
          '    const id = setInterval(() => setN((v) => v + 1), 20)',
          '    return () => clearInterval(id)',
          '  }, [running])',
          '  return html`<div>',
          '    <button class="t" onClick=${() => setRunning(!running)}>${label}</button>',
          '    <p class="n">${n}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'await new Promise((r) => setTimeout(r, 70)); await tick();\nok(Number(text(".n")) > 0, "定时器让计数涨起来")',
          'click(".t"); await tick();\nawait new Promise((r) => setTimeout(r, 40)); await tick();\nconst stopped = Number(text(".n"));\nawait new Promise((r) => setTimeout(r, 70)); await tick();\neq(text(".n"), String(stopped), "停掉之后计数不再增长")'
        ],
        hints: [
          '更新计数用函数式写法 `setN((v) => v + 1)`，避免闭包里拿到旧的 `n`。',
          '清理函数写在 effect 的 `return` 里：`return () => clearInterval(id)`。',
          '`running` 变成 `false` 时，React 先跑上一次的清理函数，再跑新一次。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-4',
        title: '取消后就不要再触发',
        task: [
          '这段代码在挂载后 30 毫秒会把 `done` 设成 `true`，但现在点「取消」也拦不住它。',
          '',
          '请加上清理：把定时器的 id 存下来，effect 返回一个用 `clearTimeout` 收掉它的函数。',
          '',
          '要求：点「取消」把 `armed` 设为 `false`，那一次排好的定时器就不能再改状态。'
        ].join('\n'),
        starter: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [armed, setArmed] = useState(true)',
          '  const [done, setDone] = useState(false)',
          "  const label = done ? '已触发' : '等待'",
          '  useEffect(() => {',
          '    if (!armed) return',
          '    setTimeout(() => setDone(true), 30)',
          '  }, [armed])',
          '  return html`<div>',
          '    <button class="c" onClick=${() => setArmed(false)}>取消</button>',
          '    <p class="d">${label}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState, useEffect } from 'react'",
          '',
          'export default function App() {',
          '  const [armed, setArmed] = useState(true)',
          '  const [done, setDone] = useState(false)',
          "  const label = done ? '已触发' : '等待'",
          '  useEffect(() => {',
          '    if (!armed) return',
          '    const id = setTimeout(() => setDone(true), 30)',
          '    return () => clearTimeout(id)',
          '  }, [armed])',
          '  return html`<div>',
          '    <button class="c" onClick=${() => setArmed(false)}>取消</button>',
          '    <p class="d">${label}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'await new Promise((r) => setTimeout(r, 10));',
          'click(".c"); await tick();',
          'await new Promise((r) => setTimeout(r, 100)); await tick();',
          'eq(text(".d"), "等待", "取消后定时器被清理，没有触发")',
          'has(".d", "提示还在")'
        ],
        hints: [
          '把 `setTimeout(...)` 的返回值存进 `const id`。',
          'effect 里 `return () => clearTimeout(id)`。',
          '`armed` 变 `false` 时 React 会先跑清理函数，把还没到点的定时器清掉。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '副作用放进 `useEffect`；第二个参数是依赖数组，`[]` 表示只在挂载后跑一次，`[dep]` 表示 `dep` 变了才重跑，',
          '不写则每次渲染后都跑。effect 可以返回清理函数，React 在重跑前和卸载时调用它。渲染里不要直接改状态。',
          '',
          '下一章讲两个组件要共享同一份数据时，把状态提升到它们的公共父组件。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
