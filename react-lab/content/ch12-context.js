/* ch12 — context：值要穿过很多层时，别再一层层往下传 props。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch12 && node tools/verify-browser.mjs --chapter ch12
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch12',
    title: '第 12 章 · context',
    goal: '会用 createContext 与 useContext 把值直接送到深层子组件，替代一层层的 props。',
    sections: [
      {
        kind: 'prose',
        md: [
          '值只能靠 props 从上往下传。当某个值要在**很多层**之下的组件里用，中间的组件就都得接一下、再传一下，',
          '哪怕它们自己根本不关心这个值。这堆只为了搬运而存在的参数叫 prop drilling。',
          '',
          '`context` 提供一条**直达**的通道：在顶层把值放进通道，深处任何组件直接取，中间层不用知道它的存在。',
          '',
          '用法三步：',
          '',
          '1. 建通道：`const Ctx = React.createContext(\'默认值\')`。',
          '2. 放值：`<${Ctx.Provider} value=${要传的值}>...<//>`，包住要用它的那棵子树。',
          '3. 取值：深处组件里 `const v = useContext(Ctx)`。',
          '',
          '`context` 本身不存状态。要能变，得让**放值的那个组件的父级**持有 `state`，把 `state` 的值放进 `value`，',
          '再用 `setState` 去改它。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['步骤', '写在哪', '代码'],
        rows: [
          ['建通道', '模块顶层', '`const Ctx = React.createContext(\'默认值\')`'],
          ['放值', '提供值的组件', '`<${Ctx.Provider} value=${v}>...<//>`'],
          ['取值', '任意深度的子组件', '`const v = useContext(Ctx)`']
        ]
      },
      {
        kind: 'demo',
        caption: '值直达三层深',
        code: [
          "import { useContext } from 'react'",
          '',
          "const ThemeCtx = React.createContext('浅色')",
          '',
          'function Leaf() {',
          '  const theme = useContext(ThemeCtx)',
          '  return html`<span class="theme">${theme}</span>`',
          '}',
          '',
          'function Mid() {',
          '  return html`<div class="mid"><${Leaf} /></div>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${ThemeCtx.Provider} value="深色"><${Mid} /><//>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".theme"), "深色", "最深的子组件读到 context")',
          'eq(count(".mid"), 1, "中间层不用接 props")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 值由 state 驱动',
          '',
          '典型用法是：父组件用 `useState` 持有值，把 `value` 绑到 state 上，再通过某个按钮去改。',
          '值一变，所有 `useContext` 读到它的组件都会重新渲染，不需要一层层传回调。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '按钮改动顶层的 state，深层组件跟着变',
        code: [
          "import { useContext, useState } from 'react'",
          '',
          "const ThemeCtx = React.createContext('浅色')",
          '',
          'function Leaf() {',
          '  const theme = useContext(ThemeCtx)',
          '  return html`<span class="theme">${theme}</span>`',
          '}',
          '',
          'export default function App() {',
          '  const [dark, setDark] = useState(false)',
          '  return html`<div>',
          '    <button class="tg" onClick=${() => setDark(!dark)}>切换</button>',
          '    <${ThemeCtx.Provider} value=${dark ? \'深色\' : \'浅色\'}><${Leaf} /><//>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".theme"), "浅色", "初始是浅色")',
          'click(".tg"); await tick();',
          'eq(text(".theme"), "深色", "切换后深层也跟着变")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 没有 Provider 时用默认值',
          '',
          '`createContext(...)` 的参数是**默认值**。一棵子树外面若没有对应的 `Provider`，`useContext`',
          '读到的是它。这让只用在一部分页面里的 context 也能安全复用：没人提供值时回落到默认。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '没有 Provider，读到默认值',
        code: [
          "import { useContext } from 'react'",
          '',
          "const ThemeCtx = React.createContext('浅色')",
          '',
          'function Leaf() {',
          '  const theme = useContext(ThemeCtx)',
          '  return html`<span class="theme">${theme}</span>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div class="wrap"><${Leaf} /></div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".theme"), "浅色", "没有 Provider 就用默认值")',
          'has(".wrap", "页面上要有 .wrap")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-1',
        title: '让孙组件从 context 取值',
        task: [
          '通道 `ThemeCtx` 和 `Provider` 都搭好了，`Leaf` 是第三层的子组件。',
          '',
          '请在 `Leaf` 里用 `useContext(ThemeCtx)` 拿到主题，插进 `span`，显示成 `深色`。',
          '',
          '中间层 `Mid` 不用改。'
        ].join('\n'),
        starter: [
          "import { useContext } from 'react'",
          '',
          "const ThemeCtx = React.createContext('浅色')",
          '',
          'function Leaf() {',
          '  return html`<span class="theme">占位</span>`',
          '}',
          '',
          'function Mid() {',
          '  return html`<div><${Leaf} /></div>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${ThemeCtx.Provider} value="深色"><${Mid} /><//>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useContext } from 'react'",
          '',
          "const ThemeCtx = React.createContext('浅色')",
          '',
          'function Leaf() {',
          '  const theme = useContext(ThemeCtx)',
          '  return html`<span class="theme">${theme}</span>`',
          '}',
          '',
          'function Mid() {',
          '  return html`<div><${Leaf} /></div>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${ThemeCtx.Provider} value="深色"><${Mid} /><//>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".theme"), "深色", "孙组件读到 Provider 的值")',
          'eq(count(".theme"), 1, "只渲染一个 span")'
        ],
        hints: [
          '第一行已经导入了 `useContext`，直接在 `Leaf` 里用。',
          '写 `const theme = useContext(ThemeCtx)`，再把 `${theme}` 插进 `span`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-2',
        title: '用按钮切换 context 的值',
        task: [
          '`App` 里已经有一个 `dark` 状态和切换按钮，但 `Provider` 的 `value` 写死成了 `浅色`。',
          '',
          '请把 `value` 改成随 `dark` 变化：`dark` 为真时 `深色`，否则 `浅色`。',
          '页面上的 `.theme` 要跟着按钮变。'
        ].join('\n'),
        starter: [
          "import { useContext, useState } from 'react'",
          '',
          "const ThemeCtx = React.createContext('浅色')",
          '',
          'function Leaf() {',
          '  const theme = useContext(ThemeCtx)',
          '  return html`<span class="theme">${theme}</span>`',
          '}',
          '',
          'export default function App() {',
          '  const [dark, setDark] = useState(false)',
          '  return html`<div>',
          '    <button class="tg" onClick=${() => setDark(!dark)}>切换</button>',
          '    <${ThemeCtx.Provider} value="浅色"><${Leaf} /><//>',
          '  </div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useContext, useState } from 'react'",
          '',
          "const ThemeCtx = React.createContext('浅色')",
          '',
          'function Leaf() {',
          '  const theme = useContext(ThemeCtx)',
          '  return html`<span class="theme">${theme}</span>`',
          '}',
          '',
          'export default function App() {',
          '  const [dark, setDark] = useState(false)',
          '  return html`<div>',
          '    <button class="tg" onClick=${() => setDark(!dark)}>切换</button>',
          '    <${ThemeCtx.Provider} value=${dark ? \'深色\' : \'浅色\'}><${Leaf} /><//>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".theme"), "浅色", "初始是浅色")',
          'click(".tg"); await tick();',
          'eq(text(".theme"), "深色", "点一次变深色")',
          'click(".tg"); await tick();',
          'eq(text(".theme"), "浅色", "再点一次变回浅色")'
        ],
        hints: [
          '把 `value="浅色"` 换成 `value=${...}`，里面写一个三元表达式。',
          '三元写成 `dark ? \'深色\' : \'浅色\'`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-3',
        title: '把一路传下来的 prop 换成 context',
        task: [
          '现在 `user` 从 `App` 传给 `Layout`，`Layout` 又传给 `Banner`，`Banner` 却没画出来。',
          '请改掉这条传递链：',
          '',
          '1. 在 `App` 外层用 `${UserCtx.Provider}` 把 `user` 放进去，值设为 `非茗`。',
          '2. 让 `Banner` 用 `useContext(UserCtx)` 取值并画进 `span`，不再接 `user` 这个 prop。',
          '',
          '中间的 `Layout` 不再需要知道 `user`。'
        ].join('\n'),
        starter: [
          "import { useContext } from 'react'",
          '',
          "const UserCtx = React.createContext('游客')",
          '',
          'function Banner({ user }) {',
          '  return html`<span class="user"></span>`',
          '}',
          '',
          'function Layout({ user }) {',
          '  return html`<div class="layout"><${Banner} user=${user} /></div>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${Layout} user="非茗" />`',
          '}'
        ].join('\n'),
        solution: [
          "import { useContext } from 'react'",
          '',
          "const UserCtx = React.createContext('游客')",
          '',
          'function Banner() {',
          '  const user = useContext(UserCtx)',
          '  return html`<span class="user">${user}</span>`',
          '}',
          '',
          'function Layout() {',
          '  return html`<div class="layout"><${Banner} /></div>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<${UserCtx.Provider} value="非茗"><${Layout} /><//>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".user"), "非茗", "深层组件从 context 拿到 user")',
          'eq(count(".user"), 1, "只渲染一个 .user")',
          'eq(count(".layout"), 1, "中间的 Layout 还在")'
        ],
        hints: [
          '先去掉 `Banner` 和 `Layout` 的参数，`Banner` 里改用 `const user = useContext(UserCtx)`。',
          '`App` 里把 `<${Layout} user="非茗" />` 包进 `<${UserCtx.Provider} value="非茗">...<//>`。',
          '动态标签的结束标记写 `<//>`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-4',
        title: '没有 Provider 时显示默认值',
        task: [
          '通道 `UserCtx` 的默认值是 `游客`，但这棵组件树外面**没有** `Provider`。',
          '',
          '请让 `Banner` 用 `useContext(UserCtx)` 取值并插进 `span`，页面显示成 `游客`。',
          '不要加 `Provider`。'
        ].join('\n'),
        starter: [
          "import { useContext } from 'react'",
          '',
          "const UserCtx = React.createContext('游客')",
          '',
          'function Banner() {',
          '  return html`<span class="user">占位</span>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div><${Banner} /></div>`',
          '}'
        ].join('\n'),
        solution: [
          "import { useContext } from 'react'",
          '',
          "const UserCtx = React.createContext('游客')",
          '',
          'function Banner() {',
          '  const user = useContext(UserCtx)',
          '  return html`<span class="user">${user}</span>`',
          '}',
          '',
          'export default function App() {',
          '  return html`<div><${Banner} /></div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".user"), "游客", "没有 Provider 时读到默认值")',
          'eq(count(".user"), 1, "只渲染一个 .user")'
        ],
        hints: [
          '默认值就是 `createContext` 的第一个参数。',
          '`const user = useContext(UserCtx)` 拿到的就是 `游客`。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '`React.createContext(默认值)` 建通道，`<${Ctx.Provider} value=${...}>` 放值，',
          '`useContext(Ctx)` 在任意深度取值。没有 `Provider` 时读到默认值。',
          '`context` 只管传值，要能变还是靠顶层 `useState`，把 state 放进 `value`。',
          '',
          '到这里你已经能拆组件、管状态、共享状态。剩下的就是在真实项目里不断组合这些基础。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
