/* ch10 — 样式：class 管复用，内联 style 对象管随 state 变化的那一份。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch10 --no-index
 *   node tools/verify-browser.mjs --chapter ch10 --skip-file
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch10',
    title: '第 10 章 · 样式',
    goal: '会用 `class` 切换整套样式，会用内联 `style` 对象写出随 state 变化的那一份样式。',
    sections: [
      {
        kind: 'prose',
        md: [
          '给元素上样式有两条路。',
          '',
          '- `class="名字"`：把样式写进 CSS 类，同一个类到处复用，也方便按状态整体切换。',
          '- `style=${{ ... }}`：直接挂到这一个元素上，适合「随 state 变的那一份」，比如颜色、粗细。',
          '',
          '这章只讲内联 `style` 对象，站点里没有独立的 CSS 文件，样式在组件里自给自足。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '内联 `style` 是**对象**，外面套着 `${}`，所以写成双层花括号 `style=${{ color: "red" }}`。属性名用驼峰：`fontWeight`、`backgroundColor`，不是 `font-weight`。'
      },
      {
        kind: 'prose',
        md: [
          '## 用 class 切换整套样式',
          '',
          '把样式分成几个类，状态决定挂哪个。写法是插值里放三元：',
          '`class=${on ? "on" : "off"}`。改 state，React 换掉类名，样式跟着换。',
          '',
          '多个类可以拼字符串：`class="card ${on ? "on" : ""}"`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '点一下切换类名',
        code: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [on, setOn] = useState(false)',
          '  return html`<div>',
          '    <p class=${on ? "on" : "off"}>状态：${on ? "开" : "关"}</p>',
          '    <button class="b" onClick=${() => setOn(!on)}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(attr(".off", "class"), "off", "初始挂 off")',
          'click(".b"); await tick();',
          'eq(attr(".on", "class"), "on", "点完挂 on")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 内联 style 对象',
          '',
          '`style` 的值是一个普通对象，键是驼峰属性名，值是字符串或数字：',
          '',
          '`style=${{ color: "rgb(200, 40, 40)", padding: "8px" }}`',
          '',
          '读回来的颜色是浏览器算过后的 `rgb(r, g, b)`，逗号后面带空格。',
          '`padding: "8px"` 会展开成四个方向，`paddingTop` 读到 `8px`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '带颜色与内边距的内联样式',
        code: [
          'export default function App() {',
          '  return html`<p class="x" style=${{ color: "rgb(200, 40, 40)", padding: "8px" }}>红字，有内边距</p>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(style(".x", "color"), "rgb(200, 40, 40)", "颜色")',
          'eq(style(".x", "paddingTop"), "8px", "内边距")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 样式跟着 state 走',
          '',
          '对象里可以直接放三元，或者整个对象按条件取。state 一变，React 重新算这个对象，',
          '把新的样式写到节点上。',
          '',
          '内联 `style` 的优先级比类高：同一个属性两边都写了，内联那条赢。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '颜色随 state 变化',
        code: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [hot, setHot] = useState(false)',
          '  return html`<div>',
          '    <p class="x" style=${{ color: hot ? "rgb(200, 40, 40)" : "rgb(61, 122, 104)" }}>温度</p>',
          '    <button class="b" onClick=${() => setHot(!hot)}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(style(".x", "color"), "rgb(61, 122, 104)", "初始是绿")',
          'click(".b"); await tick();',
          'eq(style(".x", "color"), "rgb(200, 40, 40)", "点完变红")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-1',
        title: '用状态切换类名',
        task: [
          '`p` 现在固定挂着 `off`。请让按钮点一下在 `on` 和 `off` 之间切换。',
          '',
          '已经有一个 `on` 状态和 `setOn`。把 `p` 的 `class` 改成三元，再给按钮接上 `onClick`。',
          '检查项读元素的 `class` 属性。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [on, setOn] = useState(false)',
          '  return html`<div>',
          '    <p class="off">状态</p>',
          '    <button class="b">切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [on, setOn] = useState(false)',
          '  return html`<div>',
          '    <p class=${on ? "on" : "off"}>状态</p>',
          '    <button class="b" onClick=${() => setOn(!on)}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(attr(".off", "class"), "off", "初始是 off")',
          'click(".b"); await tick();',
          'eq(attr(".on", "class"), "on", "点一下变 on")'
        ],
        hints: [
          '`class` 写 `class=${on ? "on" : "off"}`。',
          '按钮写 `onClick=${() => setOn(!on)}`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-2',
        title: '给段落加内联颜色',
        task: [
          '给 `p` 加一个内联 `style` 对象，把文字颜色设成 `rgb(200, 40, 40)`。',
          '',
          '注意双层花括号：外层 `${}` 是插值，内层 `{}` 才是对象。',
          '检查项读计算后的 `color`。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  return html`<p class="x">红字</p>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          '  return html`<p class="x" style=${{ color: "rgb(200, 40, 40)" }}>红字</p>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(style(".x", "color"), "rgb(200, 40, 40)", "颜色是红")',
          'has(".x", "页面上要有 .x")'
        ],
        hints: [
          '写成 `style=${{ color: "rgb(200, 40, 40)" }}`。',
          '别漏了里面那层 `{}`，也别忘了 `rgb()` 里逗号后的空格。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-3',
        title: '用状态控制字重',
        task: [
          '`bold` 这个状态控制文字要不要加粗。请把它的值接到 `p` 的内联 `style` 上：',
          '为真时 `fontWeight` 是 `"bold"`，为假时是 `"normal"`。',
          '',
          '按钮的切换已经接好，你只补 `style`。检查项读计算后的 `fontWeight`。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [bold, setBold] = useState(true)',
          '  return html`<div>',
          '    <p class="x">文字</p>',
          '    <button class="b" onClick=${() => setBold(!bold)}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [bold, setBold] = useState(true)',
          '  return html`<div>',
          '    <p class="x" style=${{ fontWeight: bold ? "bold" : "normal" }}>文字</p>',
          '    <button class="b" onClick=${() => setBold(!bold)}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'ok(style(".x", "fontWeight") === "bold" || style(".x", "fontWeight") === "700", "初始加粗")',
          'click(".b"); await tick();',
          'ok(style(".x", "fontWeight") === "normal" || style(".x", "fontWeight") === "400", "点完常规")'
        ],
        hints: [
          '对象写成 `{ fontWeight: bold ? "bold" : "normal" }`，外面再套 `${}`。',
          '属性名是 `fontWeight`（驼峰），不是 `font-weight`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-4',
        title: '只在为真时套样式',
        task: [
          '`marked` 为真时给 `p` 套上内联颜色 `rgb(200, 40, 40)`，为假时不要套任何内联样式。',
          '',
          '写法是三元：一个分支给对象，另一个分支给 `null`。',
          '检查项判断为假时颜色不再是那个红。'
        ].join('\n'),
        starter: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [marked, setMarked] = useState(true)',
          '  return html`<div>',
          '    <p class="x">文字</p>',
          '    <button class="b" onClick=${() => setMarked(!marked)}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useState } from 'react'",
          'export default function App() {',
          '  const [marked, setMarked] = useState(true)',
          '  return html`<div>',
          '    <p class="x" style=${marked ? { color: "rgb(200, 40, 40)" } : null}>文字</p>',
          '    <button class="b" onClick=${() => setMarked(!marked)}>切换</button>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(style(".x", "color"), "rgb(200, 40, 40)", "为真时套上红色")',
          'click(".b"); await tick();',
          'ok(style(".x", "color") !== "rgb(200, 40, 40)", "为假时不再红")'
        ],
        hints: [
          '`style=${marked ? { color: "rgb(200, 40, 40)" } : null}`：假分支给 `null` 表示不加内联样式。',
          '真分支是对象 `{ color: ... }`，整段仍包在 `${}` 里。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '`class` 用来挂一整套可复用的样式，按 state 切换类名用三元 `class=${on ? "on" : "off"}`。',
          '内联样式写 `style=${{ 驼峰属性: 值 }}`，对象里能放三元，整个样式也能按条件在对象和 `null` 之间选。',
          '内联的优先级高过类。',
          '',
          '下一章讲当状态一多、更新规则一复杂时，怎么用 `useReducer` 把更新逻辑收进一个函数。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
