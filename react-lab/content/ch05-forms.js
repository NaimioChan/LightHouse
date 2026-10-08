/* ch05 — 受控表单：input 的值来自 state，事件把输入写回 state。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch05 --no-index
 *   node tools/verify-browser.mjs --chapter ch05 --skip-file
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch05',
    title: '第 5 章 · 受控表单',
    goal: '能把 input、checkbox、textarea 的值接进 state，做出一个受 React 控制的表单。',
    sections: [
      {
        kind: 'prose',
        md: [
          '表单元素自己会保存用户输入的值。React 想把这份值也拿在手里，做法是把 `value` 绑到 state，',
          '再用事件把新输入写回 state。这样写出来的输入框叫**受控组件**：',
          '',
          '- 显示什么，由 `value=${state}` 决定',
          '- 用户敲了什么，由 `onInput=${e => setState(e.target.value)}` 写回 state',
          '',
          '两条缺一不可。少了写回那一条，输入框看着就像卡住了。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['元素', '值的属性', '写回的事件', '读新值'],
        rows: [
          ['文本框 / 密码框', '`value`', '`onInput` / `onChange`', '`e.target.value`'],
          ['复选框 / 单选框', '`checked`', '`onChange`', '`e.target.checked`'],
          ['多行文本', '`value`', '`onInput` / `onChange`', '`e.target.value`']
        ]
      },
      {
        kind: 'demo',
        caption: '受控文本输入：值和 state 一起走',
        code: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [text, setText] = useState(\'\')',
          '  return html`<div>',
          '    <input class="in" value=${text} onInput=${e => setText(e.target.value)} />',
          '    <p class="live">你输入了：${text}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".live"), "你输入了：", "初始是空的")',
          'input(".in", "你好"); await tick();',
          'eq(text(".live"), "你输入了：你好", "敲进去之后 state 跟着变")',
          'eq($(".in").value, "你好", "输入框显示的就是 state")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`onChange` 和 `onInput` 在本站的文本框上都监听 `input` 事件，写哪个都能收到；复选框只能用 `onChange`。'
      },
      {
        kind: 'prose',
        md: [
          '## 忘了写回，输入框就冻住了',
          '',
          '只写 `value=${text}` 而不写 `onInput`，用户每敲一个字符，React 立刻用 state 把 `value` 覆盖回去。',
          'state 没变，所以框里一直是原来的字：看起来像键盘失灵。',
          '',
          '另一种「不受控」的写法是用 `defaultValue`，它只给一个**初始值**，之后输入框自己管自己，React 不再插手。',
          '两者取谁，看你需不需要实时读到用户输入。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '冻住的输入框，和补上写回之后',
        code: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [frozen, setFrozen] = useState(\'打不进\')',
          '  const [live, setLive] = useState(\'能打\')',
          '  return html`<div>',
          '    <input class="frozen" value=${frozen} />',
          '    <input class="live" value=${live} onInput=${e => setLive(e.target.value)} />',
          '    <p class="echo">实时值：${live}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'input(".live", "新内容"); await tick();',
          'eq($(".live").value, "新内容", "写了 onInput 的框接受输入")',
          'eq(text(".echo"), "实时值：新内容", "state 跟着更新")',
          'eq($(".frozen").value, "打不进", "没写回的那个框保持原值")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 复选框看 checked',
          '',
          '复选框没有 `value` 这一层含义，它认的是 `checked`，事件里读 `e.target.checked`（布尔值）。',
          '把复选框的 `checked` 接到 state，就能用它去控制别的元素，比如让按钮变得可以点或不能点。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '复选框控制按钮可用',
        code: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [agree, setAgree] = useState(false)',
          '  const [name, setName] = useState(\'\')',
          '  const ready = agree && name.trim() !== \'\'',
          '  return html`<div>',
          '    <input class="name" value=${name} onInput=${e => setName(e.target.value)} />',
          '    <input class="agree" type="checkbox" checked=${agree} onChange=${e => setAgree(e.target.checked)} />',
          '    <button class="go" disabled=${!ready}>提交</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'ok($(".go").disabled, "两边都没满足时按钮不可点")',
          'input(".name", "非茗"); await tick();',
          'ok($(".go").disabled, "只填了名字还不能点")',
          'click(".agree"); await tick();',
          'ok(!$(".go").disabled, "勾上同意之后按钮可用")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 提交时把值读出来',
          '',
          '真实工程里，提交挂在 `form` 上：`<form onSubmit=${e => { e.preventDefault(); ... }}>`。',
          '浏览器默认的提交会让页面跳走，所以第一句先用 `e.preventDefault()` 拦下来，再拿 state 去拼结果。',
          '',
          '本站的练习跑在 `sandbox="allow-scripts"` 的 iframe 里，浏览器不允许它做真正的表单提交，',
          '所以下面的示例把「提交」这件事挂在一个普通按钮的 `onClick` 上。逻辑一样：读 state、算结果、写回 state。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '点提交后显示一条消息',
        code: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [name, setName] = useState(\'\')',
          '  const [msg, setMsg] = useState(\'\')',
          '  function submit() {',
          '    setMsg(name.trim() === \'\' ? \'\' : \'你好，\' + name.trim())',
          '  }',
          '  return html`<div class="form">',
          '    <input class="name" value=${name} onInput=${e => setName(e.target.value)} />',
          '    <button class="submit" onClick=${submit}>打招呼</button>',
          '    <p class="msg">${msg}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".msg"), "", "还没提交，没有消息")',
          'input(".name", "非茗"); await tick();',
          'click(".submit"); await tick();',
          'eq(text(".msg"), "你好，非茗", "提交后拼出消息")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-1',
        title: '把输入回显到段落里',
        task: [
          '组件里已经有一个 `text` 状态。请：',
          '',
          '1. 把 `input` 接成受控：`value` 绑 `text`，`onInput` 里用 `setText` 写回。',
          '2. 让 `p.live` 显示 `你输入了：` 加上当前内容。',
          '',
          '目标是敲进 `你好` 之后，段落显示 `你输入了：你好`，输入框的 `value` 也是 `你好`。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [text, setText] = useState(\'\')',
          '  return html`<div>',
          '    <input class="in" />',
          '    <p class="live">你输入了：</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [text, setText] = useState(\'\')',
          '  return html`<div>',
          '    <input class="in" value=${text} onInput=${e => setText(e.target.value)} />',
          '    <p class="live">你输入了：${text}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".live"), "你输入了：", "初始没有内容")',
          'input(".in", "你好"); await tick();',
          'eq(text(".live"), "你输入了：你好", "段落回显了输入")',
          'eq($(".in").value, "你好", "输入框的值也受控")'
        ],
        hints: [
          '输入框上两件事：`value=${text}` 和 `onInput=${e => setText(e.target.value)}`。',
          '段落里的插值写成 `${text}`，跟在 `你输入了：` 后面。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-2',
        title: '去掉首尾空格并显示长度',
        task: [
          '输入框已经受控。请用一个**派生出来的值** `clean`：把输入去掉首尾空格（`.trim()`），',
          '并让 `p.info` 显示成 `长度 N`，其中 `N` 是 `clean` 的长度。',
          '',
          '输入 `  你好  ` 之后，`p.info` 要显示 `长度 2`。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [text, setText] = useState(\'\')',
          '  const clean = text.trim()',
          '  return html`<div>',
          '    <input class="in" value=${text} onInput=${e => setText(e.target.value)} />',
          '    <p class="info">长度 </p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [text, setText] = useState(\'\')',
          '  const clean = text.trim()',
          '  return html`<div>',
          '    <input class="in" value=${text} onInput=${e => setText(e.target.value)} />',
          '    <p class="info">长度 ${clean.length}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".info"), "长度 0", "一开始长度是 0")',
          'input(".in", "  你好  "); await tick();',
          'eq(text(".info"), "长度 2", "长度按 trim 之后算")',
          'eq($(".in").value, "  你好  ", "输入框保留原始输入")'
        ],
        hints: [
          '`clean` 已经在代码里算好了，你只要把它的长度插进段落。',
          '插值写 `${clean.length}`，注意是 `.length` 不是 `.size`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-3',
        title: '复选框切换按钮是否可点',
        task: [
          '有一个复选框 `.agree` 和按钮 `.go`。请：',
          '',
          '1. 把复选框接成受控：`checked` 绑 `agree`，`onChange` 里用 `setAgree(e.target.checked)` 写回。',
          '2. 让按钮的 `disabled` 在 `agree` 为假时是 `true`，为真时是 `false`。',
          '',
          '初始没勾选，按钮不可点；勾上之后按钮可点。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [agree, setAgree] = useState(false)',
          '  return html`<div>',
          '    <input class="agree" type="checkbox" />',
          '    <button class="go">提交</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [agree, setAgree] = useState(false)',
          '  return html`<div>',
          '    <input class="agree" type="checkbox" checked=${agree} onChange=${e => setAgree(e.target.checked)} />',
          '    <button class="go" disabled=${!agree}>提交</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'ok($(".go").disabled, "没勾选时按钮不可点")',
          'click(".agree"); await tick();',
          'ok(!$(".go").disabled, "勾上之后按钮可点")',
          'click(".agree"); await tick();',
          'ok($(".go").disabled, "取消勾选后又不可点")'
        ],
        hints: [
          '复选框用 `checked=${agree}`，事件里读 `e.target.checked`。',
          '按钮的禁用写成 `disabled=${!agree}`：`agree` 为假时 `!agree` 为真。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-4',
        title: '两栏表单点提交拼一句话',
        task: [
          '有两个受控输入：`.first`（名）和 `.city`（城），两个状态已经接好了。请补上提交逻辑：',
          '',
          '1. 写一个 `submit` 函数（或直接内联），把 `msg` 设成 `非茗 来自 杭州` 这种格式',
          '（`名字 来自 城市`，两边都 `.trim()`）。',
          '2. 把 `.submit` 按钮的 `onClick` 接到这段逻辑上。',
          '3. 点按钮后 `p.msg` 显示这句话。',
          '',
          '真实工程里提交挂在 `form` 的 `onSubmit` 上，先 `e.preventDefault()`；本站的沙箱不允许真正的表单提交，',
          '所以这里把同一段逻辑挂到按钮的 `onClick`。'
        ].join('\n'),
        starter: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [first, setFirst] = useState(\'\')',
          '  const [city, setCity] = useState(\'\')',
          '  const [msg, setMsg] = useState(\'\')',
          '  return html`<div class="form">',
          '    <input class="first" value=${first} onInput=${e => setFirst(e.target.value)} />',
          '    <input class="city" value=${city} onInput=${e => setCity(e.target.value)} />',
          '    <button class="submit">提交</button>',
          '    <p class="msg">${msg}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          'import { useState } from \'react\'',
          '',
          'export default function App() {',
          '  const [first, setFirst] = useState(\'\')',
          '  const [city, setCity] = useState(\'\')',
          '  const [msg, setMsg] = useState(\'\')',
          '  function submit() {',
          '    setMsg(first.trim() + \' 来自 \' + city.trim())',
          '  }',
          '  return html`<div class="form">',
          '    <input class="first" value=${first} onInput=${e => setFirst(e.target.value)} />',
          '    <input class="city" value=${city} onInput=${e => setCity(e.target.value)} />',
          '    <button class="submit" onClick=${submit}>提交</button>',
          '    <p class="msg">${msg}</p>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".msg"), "", "还没提交时没有消息")',
          'input(".first", "非茗"); await tick();',
          'input(".city", "杭州"); await tick();',
          'click(".submit"); await tick();',
          'eq(text(".msg"), "非茗 来自 杭州", "点提交后拼出消息")',
          'click(".submit"); await tick();',
          'eq(text(".msg"), "非茗 来自 杭州", "再点一次结果不变")'
        ],
        hints: [
          '把两个输入 `.trim()` 之后拼起来：`first.trim() + \' 来自 \' + city.trim()`。',
          '按钮上写 `onClick=${submit}`，或直接写内联箭头函数。',
          '提交后要显示的是 `p.msg`，它已经绑了 `msg` 状态。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '受控表单就是把值的来源交给 state：文本与 `textarea` 用 `value` + `onInput`，复选框用 `checked` + `onChange`。',
          '`defaultValue` 只给初始值、之后放手，`value` 则每帧都由 state 决定。提交用 `onSubmit`，先 `e.preventDefault()`。',
          '',
          '下一章讲派生值与条件渲染：怎么在渲染里算值，以及怎么按条件决定显示什么。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
