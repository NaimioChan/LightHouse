/* ch08 — 状态提升与共享：把状态挪到最近的公共父组件，值往下传、回调往上传。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch08 && node tools/verify-browser.mjs --chapter ch08
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch08',
    title: '第 8 章 · 状态提升与共享',
    goal: '会把两个组件都要用的状态提到公共父组件，用值和回调在父子之间连通。',
    sections: [
      {
        kind: 'prose',
        md: [
          '两个兄弟组件要用同一份数据时，各自 `useState` 会得到两份互不相干的值。改了这个，那个不知道。',
          '',
          '做法是把状态**提升**到它们最近的公共父组件：父组件持有 `useState`，把值作为 prop 传下去，',
          '再把它需要的「改值」函数（或包一层的回调）也传下去。子组件不存数据，只负责显示和把动作报上去。',
          '这样数据只有一个来源，两边永远一致。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['谁', '存状态', '通过 prop 拿到', '做的事'],
        rows: [
          ['父组件', '`useState`', '—', '持有唯一的值'],
          ['显示的子组件', '不存', '`value`', '只画出来'],
          ['操作的子组件', '不存', '`onChange` 回调', '把新值报给父组件']
        ]
      },
      {
        kind: 'demo',
        caption: '两块面板共用父组件的一份计数',
        code: [
          "import { useState } from 'react'",
          '',
          'function Readout({ name, count }) {',
          '  return html`<p class="r">${name}：${count}</p>`',
          '}',
          '',
          'export default function App() {',
          '  const [count, setCount] = useState(0)',
          '  return html`<div>',
          '    <button class="b" onClick=${() => setCount(count + 1)}>加一</button>',
          '    <${Readout} name="左" count=${count} />',
          '    <${Readout} name="右" count=${count} />',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".r"), 2, "两块面板")',
          'eq(text(".r"), "左：0", "初始是 0")',
          'click(".b"); await tick();',
          'eq(text(".r"), "左：1", "左边跟着变")',
          'eq(text("p:nth-child(2)"), "左：1", "左边还是第一块")',
          'eq(text("p:nth-child(3)"), "右：1", "右边也变到 1")'
        ]
      },
      {
        kind: 'demo',
        caption: '一份选中状态，两个列表都高亮',
        code: [
          "import { useState } from 'react'",
          '',
          "const ITEMS = ['苹果', '香蕉', '梨']",
          '',
          'function List({ title, sel, onPick }) {',
          '  return html`<div class="col">',
          '    <h4>${title}</h4>',
          '    <ul>${ITEMS.map((it) => html`<li class=${it === sel ? "row on" : "row"}>',
          '      <button class="pick" onClick=${() => onPick(it)}>${it}</button>',
          '    </li>`)}</ul>',
          '  </div>`',
          '}',
          '',
          'export default function App() {',
          "  const [sel, setSel] = useState('')",
          '  return html`<div>',
          '    <${List} title="左" sel=${sel} onPick=${setSel} />',
          '    <${List} title="右" sel=${sel} onPick=${setSel} />',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".col"), 2, "两个列表")',
          'eq(count(".on"), 0, "开始没有高亮")',
          'click(".pick"); await tick();',
          'eq(count(".on"), 2, "两个列表都高亮同一个")',
          'eq(text(".on"), "苹果", "选中的是第一个")'
        ]
      },
      {
        kind: 'demo',
        caption: '父组件持有输入值，一个子组件编辑、一个显示',
        code: [
          "import { useState } from 'react'",
          '',
          'function Editor({ value, onChange }) {',
          '  return html`<input class="e" value=${value} onInput=${(e) => onChange(e.target.value)} />`',
          '}',
          '',
          'function Viewer({ value }) {',
          '  return html`<p class="v">你输入：${value}</p>`',
          '}',
          '',
          'export default function App() {',
          "  const [value, setValue] = useState('')",
          '  return html`<div>',
          '    <${Editor} value=${value} onChange=${setValue} />',
          '    <${Viewer} value=${value} />',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq($(".e").value, "", "输入框初始为空")',
          'input(".e", "hello", "打字"); await tick();',
          'eq(text(".v"), "你输入：hello", "显示的子组件跟上")',
          'eq($(".e").value, "hello", "输入框显示父组件的值")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '判断该把状态放在哪：找出所有要用这个值的组件，提升到它们最近的公共祖先。父组件持有值，子组件用 `value` 显示、用回调把变化报上去。'
      },
      {
        kind: 'exercise',
        id: 'ex08-1',
        title: '让子组件的按钮改父组件的计数',
        task: [
          '`Counter` 显示父组件的 `n`，但按钮没接线。请：',
          '',
          '1. 让 `Counter` 接收一个 `onAdd` prop，把按钮的 `onClick` 绑到它。',
          '2. 父组件把 `onAdd=${() => setN(n + 1)}` 传下去。',
          '',
          '状态留在父组件，子组件只负责报告「要加一」。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          '',
          'function Counter({ n }) {',
          '  return html`<div>',
          '    <p class="n">${n}</p>',
          '    <button class="b">加一</button>',
          '  </div>`',
          '}',
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  return html`<${Counter} n=${n} />`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'function Counter({ n, onAdd }) {',
          '  return html`<div>',
          '    <p class="n">${n}</p>',
          '    <button class="b" onClick=${onAdd}>加一</button>',
          '  </div>`',
          '}',
          '',
          'export default function App() {',
          '  const [n, setN] = useState(0)',
          '  return html`<${Counter} n=${n} onAdd=${() => setN(n + 1)} />`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".n"), "0", "初始是 0")',
          'click(".b"); await tick();',
          'eq(text(".n"), "1", "点一次变成 1")',
          'click(".b"); await tick();',
          'eq(text(".n"), "2", "再点一次变成 2")'
        ],
        hints: [
          '子组件解构出 `onAdd`：`function Counter({ n, onAdd })`。',
          '`onClick=${onAdd}` 直接把回调当成处理器。',
          '父组件传 `onAdd=${() => setN(n + 1)}`，改的仍是父组件的状态。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-2',
        title: '两个面板共享一份选中值',
        task: [
          '现在每个 `Panel` 各存各的 `sel`，点左边只有左边变。请把状态提升到 `App`：',
          '',
          '1. `App` 用 `useState` 存 `sel`，初始为 `\'无\'`。',
          '2. 把 `sel` 和 `setSel` 作为 prop 传给两个 `Panel`。',
          '3. `Panel` 不再自己 `useState`，用传进来的 `sel` 显示，按钮调用传进来的回调。',
          '',
          '完成后点任意面板的按钮，两个面板都要显示同一个选中值。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          '',
          'function Panel({ label }) {',
          "  const [sel, setSel] = useState('无')",
          '  return html`<div class="p">',
          '    <span class="lbl">${label}</span>',
          '    <button class="pick" onClick=${() => setSel(label)}>选它</button>',
          '    <span class="cur">${sel}</span>',
          '  </div>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div>',
          '    <${Panel} label="左" />',
          '    <${Panel} label="右" />',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'function Panel({ label, sel, onPick }) {',
          '  return html`<div class="p">',
          '    <span class="lbl">${label}</span>',
          '    <button class="pick" onClick=${() => onPick(label)}>选它</button>',
          '    <span class="cur">${sel}</span>',
          '  </div>`',
          '}',
          '',
          'export default function App() {',
          "  const [sel, setSel] = useState('无')",
          '  return html`<div>',
          '    <${Panel} label="左" sel=${sel} onPick=${setSel} />',
          '    <${Panel} label="右" sel=${sel} onPick=${setSel} />',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".p"), 2, "两个面板")',
          'eq(text(".cur"), "无", "初始都是无")',
          'click(".pick"); await tick();',
          'eq(text(".cur"), "左", "点左边后左边显示左")',
          'eq(text(".p:nth-child(2) .cur"), "左", "右边也显示左")'
        ],
        hints: [
          '`useState` 只能调在组件函数体里，所以状态要住在 `App`。',
          '`Panel` 的参数改成 `{ label, sel, onPick }`，去掉里面的 `useState`。',
          '父组件两处都传 `sel=${sel} onPick=${setSel}`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-3',
        title: '把选中的值报给父组件',
        task: [
          '`Picker` 里有两个选项按钮，父组件想知道用户选了哪个。请：',
          '',
          '1. `App` 用 `useState` 存 `color`，初始为 `\'没选\'`。',
          '2. 给 `Picker` 传一个 `onPick` prop，按钮分别调用 `onPick(\'红\')`、`onPick(\'蓝\')`。',
          '3. `App` 把 `setColor` 作为 `onPick` 传下去，`p` 显示当前的 `color`。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          '',
          'function Picker() {',
          '  return html`<div>',
          '    <button class="a">红</button>',
          '    <button class="b">蓝</button>',
          '  </div>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div>',
          '    <${Picker} />',
          '    <p class="v">没选</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'function Picker({ onPick }) {',
          '  return html`<div>',
          '    <button class="a" onClick=${() => onPick(\'红\')}>红</button>',
          '    <button class="b" onClick=${() => onPick(\'蓝\')}>蓝</button>',
          '  </div>`',
          '}',
          '',
          'export default function App() {',
          "  const [color, setColor] = useState('没选')",
          '  return html`<div>',
          '    <${Picker} onPick=${setColor} />',
          '    <p class="v">${color}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".v"), "没选", "初始是没选")',
          'click(".a"); await tick();',
          'eq(text(".v"), "红", "选红")',
          'click(".b"); await tick();',
          'eq(text(".v"), "蓝", "再选蓝")'
        ],
        hints: [
          '回调可以带参数：子组件里 `onClick=${() => onPick(\'红\')}`。',
          '父组件直接把 `setColor` 传下去就行，它接收一个值。',
          '`p` 里插值 `${color}`，值更新它自己会重渲染。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-4',
        title: '两个输入框共用一份值',
        task: [
          '两个输入框现在各存各的，打字互不影响。请把值提到 `App`：',
          '',
          '1. `App` 用 `useState` 存 `value`，初始为 `\'\'`。',
          '2. 两个 `Field` 都接收 `value` 和 `onChange`，`input` 绑成受控。',
          '3. 父组件两处都传同一个 `value` 和 `setValue`，`p` 显示 `value`。',
          '',
          '完成后在任意一个框里打字，另一个和下面的 `p` 都会变成同样的内容；',
          '换一个框打字会整段替换，因为两边共用的是同一个值。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          '',
          'function Field({ cls }) {',
          "  const [v, setV] = useState('')",
          '  return html`<input class=${cls} value=${v} onInput=${(e) => setV(e.target.value)} />`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div>',
          '    <${Field} cls="a" />',
          '    <${Field} cls="b" />',
          '    <p class="v"></p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          '',
          'function Field({ cls, value, onChange }) {',
          '  return html`<input class=${cls} value=${value} onInput=${(e) => onChange(e.target.value)} />`',
          '}',
          '',
          'export default function App() {',
          "  const [value, setValue] = useState('')",
          '  return html`<div>',
          '    <${Field} cls="a" value=${value} onChange=${setValue} />',
          '    <${Field} cls="b" value=${value} onChange=${setValue} />',
          '    <p class="v">${value}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq($(".a").value, "", "两个框初始为空")',
          'input(".a", "非茗"); await tick();',
          'eq($(".b").value, "非茗", "第二个框镜像第一个")',
          'eq(text(".v"), "非茗", "下面的 p 也显示")',
          'input(".b", "阿黄"); await tick();',
          'eq($(".a").value, "阿黄", "在第二个框打字整段替换第一个")'
        ],
        hints: [
          '`Field` 参数改成 `{ cls, value, onChange }`，去掉自己的 `useState`。',
          '`input` 的 `onInput` 调 `onChange(e.target.value)`。',
          '父组件两处都传 `value=${value} onChange=${setValue}`，值只有这一份。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '两个组件要用同一份数据，就把状态提升到最近的公共父组件。父组件持有 `useState`，',
          '把值用 `value` 传下去显示，把改值函数或回调用 prop 传下去，子组件只显示和上报。',
          '数据只有一个来源，界面才不会各说各话。',
          '',
          '下一章讲用 `useRef` 记住不影响渲染的值，以及直接操作 DOM 节点（比如让输入框自动聚焦）。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
