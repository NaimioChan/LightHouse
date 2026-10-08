/* ch09 — ref 与 DOM：拿真实节点做聚焦、清空、读信息，ref 的变化不触发重渲染。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch09 --no-index
 *   node tools/verify-browser.mjs --chapter ch09 --skip-file
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch09',
    title: '第 9 章 · ref 与 DOM',
    goal: '会用 `useRef` 拿到 DOM 节点，挂载后聚焦、清空、读节点信息，并知道 ref 的变化不会触发重渲染。',
    sections: [
      {
        kind: 'prose',
        md: [
          '组件的输出来自 state：改 state，React 重新渲染，界面跟着更新。',
          '',
          '有些事和渲染无关：让输入框获得焦点、清空一个非受控输入框、读出某个节点的标签名或尺寸。',
          '这些都要摸到真实的 DOM 节点。React 给的办法是 `useRef`。',
          '',
          '`useRef(初始值)` 返回一个盒子 `{ current: 初始值 }`。盒子的身份在每次渲染之间保持不变，',
          '改 `ref.current` **不会**触发重渲染。把 ref 挂到标签上（`ref=${box}`），渲染后 `box.current` 就是那个 DOM 节点。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['', '`useState`', '`useRef`'],
        rows: [
          ['改它会不会重渲染', '会', '不会'],
          ['渲染之间保不保持', '保持', '保持'],
          ['拿值', '`[v, setV]`', '`ref.current`'],
          ['常用来干嘛', '驱动界面的值', '存 DOM 节点、定时器 id']
        ]
      },
      {
        kind: 'demo',
        caption: '挂载后自动聚焦',
        code: [
          "import { useRef, useEffect } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          '  useEffect(() => { box.current.focus() }, [])',
          '  return html`<input class="i" ref=${box} placeholder="自动聚焦" />`',
          '}'
        ].join('\n'),
        tests: [
          'await tick(); eq(document.activeElement.className, "i", "焦点在输入框上")',
          'has(".i", "页面上要有输入框")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '不要在渲染里靠 `ref.current` 算界面要显示的东西。ref 变了不会触发重渲染，界面不会跟着变；那种值用 `useState`。'
      },
      {
        kind: 'prose',
        md: [
          '## 挂载之后才能用',
          '',
          '`useEffect(() => { ... }, [])` 里的代码在组件挂载之后跑一次。这时 DOM 已经建好，',
          '`ref.current` 指向真实节点，可以调用 `focus()`。',
          '',
          '事件处理器里也一样拿得到：点按钮时节点早已就绪，直接 `ref.current.focus()` 就行。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '点按钮把焦点送进输入框',
        code: [
          "import { useRef } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          '  return html`<div>',
          '    <input class="i" ref=${box} />',
          '    <button class="btn" onClick=${() => box.current.focus()}>聚焦</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'click(".btn"); await tick();',
          'eq(document.activeElement.className, "i", "点按钮后焦点到了输入框")'
        ]
      },
      {
        kind: 'demo',
        caption: '把节点的标签名读出来',
        code: [
          "import { useRef, useState, useEffect } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          "  const [tag, setTag] = useState('')",
          '  useEffect(() => { setTag(box.current.tagName) }, [])',
          '  return html`<div>',
          '    <input class="i" ref=${box} />',
          '    <p class="t">${tag}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'await tick();',
          'eq(text(".t"), "INPUT", "把输入框的标签名写进 p")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 拿到节点能做什么',
          '',
          '`ref.current` 就是一个 DOM 元素，和 `document.querySelector` 拿到的是同一种东西：',
          '',
          '- 聚焦：`ref.current.focus()`',
          "- 清空：`ref.current.value = ''`（非受控输入框）",
          '- 读信息：`ref.current.tagName`、`ref.current.getBoundingClientRect()`',
          '',
          '`tagName` 是**大写**的：`input` 节点读出来是 `INPUT`。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex09-1',
        title: '挂载后让输入框自动聚焦',
        task: [
          '组件里有一个 `box` 这个 ref，已经挂到输入框上。请让输入框在组件挂载后自动获得焦点。',
          '',
          '借用 `useEffect` 的「挂载后跑一次」，在里面调用 `focus()`。',
          '检查项读 `document.activeElement`，看焦点是不是落在这个输入框上。'
        ].join('\n'),
        starter: [
          "import { useRef } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          '  return html`<input class="i" ref=${box} />`',
          '}'
        ].join('\n'),
        solution: [
          "import { useRef, useEffect } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          '  useEffect(() => { box.current.focus() }, [])',
          '  return html`<input class="i" ref=${box} />`',
          '}'
        ].join('\n'),
        tests: [
          'await tick();',
          'eq(document.activeElement.className, "i", "焦点在输入框上")',
          'has(".i", "页面上要有输入框")'
        ],
        hints: [
          '`useEffect(() => { box.current.focus() }, [])`：空依赖数组表示只在挂载后跑一次。',
          '别在渲染里调用 `focus()`，那时 DOM 可能还没挂上。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-2',
        title: '按钮把焦点移到第二个输入框',
        task: [
          '页面上有两个输入框：`a` 和 `b`。请让按钮点一下把焦点送到**第二个**（class 是 `b`）。',
          '',
          '两个 ref 已经建好、也挂好了，缺的是按钮上的 `onClick`。'
        ].join('\n'),
        starter: [
          "import { useRef } from 'react'",
          'export default function App() {',
          '  const first = useRef(null)',
          '  const second = useRef(null)',
          '  return html`<div>',
          '    <input class="a" ref=${first} />',
          '    <input class="b" ref=${second} />',
          '    <button class="btn">去第二个</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useRef } from 'react'",
          'export default function App() {',
          '  const first = useRef(null)',
          '  const second = useRef(null)',
          '  return html`<div>',
          '    <input class="a" ref=${first} />',
          '    <input class="b" ref=${second} />',
          '    <button class="btn" onClick=${() => second.current.focus()}>去第二个</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'click(".btn"); await tick();',
          'eq(document.activeElement.className, "b", "焦点在第二个输入框")',
          'has(".a", "第一个输入框还在")'
        ],
        hints: [
          '在按钮上写 `onClick=${() => second.current.focus()}`。',
          '用的是 `second` 这个 ref，别写成 `first`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-3',
        title: '用 ref 清空输入框',
        task: [
          '这是一个非受控输入框，初始有文字「草稿」。请让按钮点一下把它的值清空。',
          '',
          '非受控输入框的值不在 state 里。拿到 `ref.current` 后直接把 `value` 设成空字符串。',
          '检查项从 DOM 读 `value`。'
        ].join('\n'),
        starter: [
          "import { useRef } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          '  return html`<div>',
          '    <input class="i" ref=${box} defaultValue="草稿" />',
          '    <button class="btn">清空</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useRef } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          '  return html`<div>',
          '    <input class="i" ref=${box} defaultValue="草稿" />',
          '    <button class="btn" onClick=${() => { box.current.value = "" }}>清空</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq($(".i").value, "草稿", "初始有草稿")',
          'click(".btn"); await tick();',
          'eq($(".i").value, "", "输入框被清空")'
        ],
        hints: [
          '在 `onClick` 里写 `box.current.value = ""`。',
          '`defaultValue` 只设初始值，之后改 DOM 的 `value` 不会被 React 覆盖回去。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-4',
        title: '读出节点的标签名',
        task: [
          '页面上有一个按钮和一个空的 `p`。请用 ref 拿到按钮节点，把它的 `tagName` 写进 `p`。',
          '',
          'ref 挂好之后 `box.current` 就是按钮元素。挂载后读 `tagName` 存进状态，界面才会更新。',
          '检查项读 `p` 的文字。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          'export default function App() {',
          "  const [tag, setTag] = useState('')",
          '  return html`<div>',
          '    <button class="b">按钮</button>',
          '    <p class="t">${tag}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useRef, useState, useEffect } from 'react'",
          'export default function App() {',
          '  const box = useRef(null)',
          "  const [tag, setTag] = useState('')",
          '  useEffect(() => { setTag(box.current.tagName) }, [])',
          '  return html`<div>',
          '    <button class="b" ref=${box}>按钮</button>',
          '    <p class="t">${tag}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'await tick();',
          'eq(text(".t"), "BUTTON", "把按钮的标签名写进 p")',
          'has(".b", "按钮还在")'
        ],
        hints: [
          '先建 `box` 并挂到按钮上：`ref=${box}`。',
          '在 `useEffect(..., [])` 里 `setTag(box.current.tagName)`；`tagName` 是大写。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '`useRef(初始值)` 返回一个稳定的盒子 `{ current }`，改它不会触发重渲染。',
          '用 `ref=${box}` 挂到标签上，挂载后 `box.current` 就是那个 DOM 节点。',
          '聚焦、清空、读 `tagName` 都要等 DOM 就绪：放在 effect 里或事件处理器里最稳。',
          '',
          '下一章讲怎么用 `class` 和内联 `style` 控制组件的外观。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
