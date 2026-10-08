/* ch06 — 派生值与条件渲染：渲染时算出来的值不必进 state，按条件决定画什么。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch06 --no-index
 *   node tools/verify-browser.mjs --chapter ch06 --skip-file
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch06',
    title: '第 6 章 · 派生值与条件渲染',
    goal: '会把能从 state 算出来的值留在渲染里算，会按条件决定显示哪一块或什么都不显示。',
    sections: [
      {
        kind: 'prose',
        md: [
          '有些值能从别的 state 算出来，比如「总价 = 单价 × 数量」。这种值**不要**再放进 state，',
          '直接在渲染的时候算：',
          '',
          '- 放进 state，你就得在改单价、改数量时都记得同步它，漏一处就不一致',
          '- 留在渲染里算，每次渲染都重算一遍，永远和来源同步',
          '',
          '组件每次因为 state 或 props 变化重新执行时，函数体都会重跑，所以派生的值天然是新的。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '总价由单价和数量算出来',
        code: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [price] = useState(19.9)',
          '  const [qty, setQty] = useState(1)',
          '  const total = price * qty',
          '  return html`<div>',
          '    <button class="add" onClick=${() => setQty(qty + 1)}>加一件</button>',
          '    <p class="qty">数量 ${qty}</p>',
          '    <p class="total">合计 ${total.toFixed(2)} 元</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".total"), "合计 19.90 元", "初始总价")',
          'click(".add"); await tick();',
          'eq(text(".qty"), "数量 2", "数量加了一")',
          'eq(text(".total"), "合计 39.80 元", "总价跟着重算")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '能算出来的就别存。判断标准：这个值有没有**独立**的信息来源？没有，它就是派生的。'
      },
      {
        kind: 'prose',
        md: [
          '## 三元决定显示哪一块',
          '',
          '要按条件显示两块中的一块，用三元表达式：`cond ? html`...` : html`...``。',
          '它在渲染里就是一个普通表达式，`cond` 变了两块就换着画，不需要动 state。',
          '',
          '只关心「有」或「没有」，可以只跟 `null` 比较：`cond ? html`<p>有</p>` : null`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '两块内容来回切',
        code: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [on, setOn] = useState(true)',
          '  return html`<div>',
          '    <button class="toggle" onClick=${() => setOn(on => !on)}>切换</button>',
          '    ${on ? html`<p class="state">现在是开</p>` : html`<p class="state">现在是关</p>`}',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".state"), "现在是开", "初始是开")',
          'click(".toggle"); await tick();',
          'eq(text(".state"), "现在是关", "点一下切成关")',
          'click(".toggle"); await tick();',
          'eq(text(".state"), "现在是开", "再点一下切回来")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 什么都不显示就画 null',
          '',
          '条件不满足时返回 `null`，React 就在那个位置什么都不画。它和返回一个空的 `div` 不一样：',
          '`null` 不占位置，也没有多余的元素。',
          '',
          '一个组件只画一种东西、条件不满足就整个不画时，可以在函数开头**提前返回**（early return）：',
          '',
          '```',
          'if (items.length === 0) return null',
          'return html`<ul>...</ul>`',
          '```'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '数量和为空时都不显示',
        code: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [count, setCount] = useState(0)',
          '  return html`<div>',
          '    <button class="add" onClick=${() => setCount(count + 1)}>记一笔</button>',
          '    <p class="tip">${count > 0 ? \'已有 \' + count + \' 笔\' : null}</p>',
          '    <span class="badge">${count === 0 ? null : count}</span>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".tip"), "", "没有记录时不显示提示")',
          'eq(count(".badge"), 1, "badge 元素在，但内容为空")',
          'click(".add"); await tick();',
          'eq(text(".tip"), "已有 1 笔", "有记录后显示提示")',
          'eq(text(".badge"), "1", "badge 显示数量")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 三元也能换按钮的文字和行为',
          '',
          '把 `label` 和 ` onClick` 都挂在同一个条件上，就成了一个会变身的主按钮：',
          '展开时显示「收起」、点它就收；收起时显示「展开」。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex06-1',
        title: '算出总价',
        task: [
          '组件有 `price` 和 `qty` 两个状态。请派生一个 `total`，让 `p.total` 显示 `合计 X 元`，',
          '`X` 是 `price * qty`。',
          '',
          '初始显示 `合计 20 元`；点一下 `.add` 之后，`qty` 变 2，显示 `合计 40 元`。',
          '',
          '`total` 不要放进 state。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [price] = useState(20)',
          '  const [qty, setQty] = useState(1)',
          '  return html`<div>',
          '    <button class="add" onClick=${() => setQty(qty + 1)}>加一件</button>',
          '    <p class="total">合计 元</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [price] = useState(20)',
          '  const [qty, setQty] = useState(1)',
          '  const total = price * qty',
          '  return html`<div>',
          '    <button class="add" onClick=${() => setQty(qty + 1)}>加一件</button>',
          '    <p class="total">合计 ${total} 元</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".total"), "合计 20 元", "初始总价")',
          'click(".add"); await tick();',
          'eq(text(".total"), "合计 40 元", "数量变 2 后总价重算")',
          'eq(text(".add"), "加一件", "按钮文字没变")'
        ],
        hints: [
          '在 `return` 之前写 `const total = price * qty`。',
          '插值写成 `${total}`，别用 `qty`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-2',
        title: '有数量才显示提示',
        task: [
          '组件有 `count` 状态和一个 `.add` 按钮。请让 `p.tip` 只在 `count` 大于 0 时显示内容：',
          '',
          '- `count` 为 0：`p.tip` 里什么都没有',
          '- `count` 大于 0：显示 `已有 N 笔`（`N` 是当前数量）',
          '',
          '用三元表达式，条件不满足时给出 `null`。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [count, setCount] = useState(0)',
          '  return html`<div>',
          '    <button class="add" onClick=${() => setCount(count + 1)}>记一笔</button>',
          '    <p class="tip">已有 笔</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [count, setCount] = useState(0)',
          '  return html`<div>',
          '    <button class="add" onClick=${() => setCount(count + 1)}>记一笔</button>',
          '    <p class="tip">${count > 0 ? \'已有 \' + count + \' 笔\' : null}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".tip"), "", "初始不显示提示")',
          'click(".add"); await tick();',
          'click(".add"); await tick();',
          'eq(text(".tip"), "已有 2 笔", "两次之后显示数量")',
          'eq(count(".tip"), 1, "提示元素始终在（只是内容为空）")'
        ],
        hints: [
          '三元写成 `${count > 0 ? 一段文字 : null}`。',
          '文字里要插值的话先拼字符串：`\'已有 \' + count + \' 笔\'`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-3',
        title: '列表为空时整个不显示',
        task: [
          '组件有一个 `items` 数组。请在函数开头加一句提前返回：',
          '',
          '1. `items` 长度为 0 时，`return null`，页面上不出现 `.empty` 以外的任何东西。',
          '2. 有内容时，渲染一个 `.list`，里面每个 `li` 显示一项。',
          '',
          '注意检查项会先看空列表：此时页面上不该有 `.list`。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [items] = useState([])',
          '  return html`<div>',
          '    <ul class="list">${items.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [items] = useState([])',
          '  if (items.length === 0) return null',
          '  return html`<div>',
          '    <ul class="list">${items.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'missing(".list", "空列表时不渲染列表")',
          'eq(count("li"), 0, "空列表时没有 li")',
          'eq(count("ul"), 0, "也不该留下包裹的 ul")'
        ],
        hints: [
          '提前返回写在 `return html`...`` 之前：`if (items.length === 0) return null`。',
          '返回 `null` 表示这块位置什么都不画。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-4',
        title: '按钮文字和行为一起换',
        task: [
          '把 `.toggle` 做成展开 / 收起：',
          '',
          '- 收起时文字是 `展开`，点一下展开，`p.body` 出现内容 `详细内容`',
          '- 展开时文字是 `收起`，点一下收起，`p.body` 消失',
          '',
          '`.toggle` 的文字和行为都跟着同一个状态走。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [open, setOpen] = useState(false)',
          '  return html`<div>',
          '    <button class="toggle" onClick=${() => setOpen(true)}>展开</button>',
          '    <p class="body">${null}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [open, setOpen] = useState(false)',
          '  return html`<div>',
          '    <button class="toggle" onClick=${() => setOpen(o => !o)}>${open ? \'收起\' : \'展开\'}</button>',
          '    ${open ? html`<p class="body">详细内容</p>` : null}',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".toggle"), "展开", "收起时按钮是展开")',
          'missing(".body", "收起时没有内容")',
          'click(".toggle"); await tick();',
          'eq(text(".toggle"), "收起", "展开后按钮是收起")',
          'eq(text(".body"), "详细内容", "展开后显示内容")',
          'click(".toggle"); await tick();',
          'missing(".body", "再点一下又收起")'
        ],
        hints: [
          '按钮文字用三元：`${open ? \'收起\' : \'展开\'}`。',
          '内容也用三元，收起时给 `null`：`${open ? html`<p class="body">详细内容</p>` : null}`。',
          '切换写成 `setOpen(o => !o)`，或 `setOpen(!open)` 也行。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '能从 state 或 props 算出来的值，就地用 `const` 算，别往 state 里塞。条件渲染用三元，',
          '两块里选一块就 `cond ? a : b`，什么都不显示就给 `null`，整块不画还可以提前 `return null`。',
          '',
          '下一章讲副作用：什么时候该在渲染之外做事，以及怎么收拾这些事。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
