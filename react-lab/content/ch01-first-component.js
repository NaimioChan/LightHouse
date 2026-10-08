/* ch01 — 第一个组件：函数组件长什么样，htm 模板怎么把数据画出来。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs && node tools/verify-browser.mjs --chapter ch01
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 第一个组件',
    goal: '看懂一个函数组件由什么组成，能把数据画到页面上、能用 htm 模板写结构。',
    sections: [
      {
        kind: 'prose',
        md: [
          'React 的组件就是一个**函数**：它返回要显示的结构，React 负责把它画出来。',
          '',
          '本站的模板不用 JSX（那要引入一大包编译工具），用 `htm` 的标签模板。两者写法几乎一样，',
          '区别只有几处，下面这张表先记住。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['想写的东西', 'JSX 里', 'htm 里（本站）'],
        rows: [
          ['类名', '`className="x"`', '`class="x"`'],
          ['事件', '`onClick={fn}`', '`onClick=${fn}`'],
          ['插值', '`{name}`', '`${name}`'],
          ['组件', '`<Comp />`', '`<${Comp} />`']
        ]
      },
      {
        kind: 'demo',
        caption: '最小的函数组件',
        code: [
          'export default function App() {',
          '  return html`<p class="hi">你好，React</p>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".hi"), "你好，React", "组件渲染出来了")',
          'has(".hi", "页面上要有 .hi")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 模板里插值用 `${}`',
          '',
          '`${ }` 里可以放任何**表达式**：变量、算术、函数调用、三元。React 会把它的结果插进这个位置。',
          '插值的结果会被转成文字，所以数字、字符串都能直接放。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '插值：把值塞进模板',
        code: [
          'export default function App() {',
          "  const name = '非茗'",
          '  const n = 2',
          '  return html`<p class="hello">你好，${name}！有 ${n} 条消息</p>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".hello"), "你好，非茗！有 2 条消息", "两个插值都画出来了")'
        ]
      },
      {
        kind: 'demo',
        caption: '插值里能算',
        code: [
          'export default function App() {',
          '  const price = 19.9',
          '  const count = 3',
          '  return html`<p class="total">共 ${count} 件，合计 ${(price * count).toFixed(2)} 元</p>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".total"), "共 3 件，合计 59.70 元", "算术与函数调用")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '组件函数里除了 `return` 结构，不要在里面直接改外面变量、发请求或订阅——那些事属于副作用，第 7 章讲。'
      },
      {
        kind: 'prose',
        md: [
          '## 属性写在标签里',
          '',
          '静态属性直接写：`class="t"`、`title="提示"`。要绑**变量**就在等号后写 `${}`：`title=${tip}`。',
          '',
          '事件属性名是驼峰：`onClick`、`onInput`，值是 `${一个函数}`。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex01-1',
        title: '把名字插进标题里',
        task: [
          '组件里已经有一个 `name`，请把它插进 `h1`：',
          '',
          '标题要显示成 `欢迎，非茗`（注意中间是中文逗号）。',
          '',
          '先把右边跑起来看看现在是什么样，再动手改。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          "  const name = '非茗'",
          '  return html`<h1 class="t">欢迎，</h1>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          "  const name = '非茗'",
          '  return html`<h1 class="t">欢迎，${name}</h1>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".t"), "欢迎，非茗", "标题里插上名字")',
          'eq(count("h1"), 1, "只留一个 h1")'
        ],
        hints: [
          '插值写成 `${name}`，放在「欢迎，」后面。',
          '`${}` 内外都不用加引号。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-2',
        title: '在插值里算八折',
        task: [
          '这个组件有一个 `price`，请在 `p` 里把**八折价**插进去，显示成 `现价 80 元`。',
          '',
          '八折就是乘 `0.8`。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  const price = 100',
          '  return html`<p class="p">现价 元</p>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          '  const price = 100',
          '  return html`<p class="p">现价 ${price * 0.8} 元</p>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".p"), "现价 80 元", "八折算对了")',
          'has(".p", "页面上要有 .p")'
        ],
        hints: [
          '直接在 `${}` 里写 `price * 0.8`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-3',
        title: '用属性绑变量',
        task: [
          '`{{ }}` 不在这里，本站用 `${}`。当你要把值放进的是 **HTML 属性**（比如 `title`、`href`），',
          '写法是 `属性名=${表达式}`。',
          '',
          '这个组件里有一个 `tip`，请给 `button` 加上 `title` 属性，值绑到 `tip`。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          "  const tip = '这是提示'",
          '  return html`<button class="b">悬停看看</button>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          "  const tip = '这是提示'",
          '  return html`<button class="b" title=${tip}>悬停看看</button>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(attr(".b", "title"), "这是提示", "title 绑上了")',
          'eq(text(".b"), "悬停看看", "按钮文字没被改动")'
        ],
        hints: [
          '写法是 `title=${tip}`，等号后面不要加引号。',
          '检查项会读 `button` 的 `title` 属性。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-4',
        title: '换掉类名',
        task: [
          'htm 里写类名用 `class`，不是 `className`。',
          '',
          '这个 `p` 现在挂着 `todo`，请把类名换成 `done`，文字保持 `完成` 不变。',
          '检查项按新类名 `done` 找元素。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  return html`<p class="todo">完成</p>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          '  return html`<p class="done">完成</p>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(text(".done"), "完成", "类名换成了 done")',
          'missing(".todo", "旧的 todo 不该还在")'
        ],
        hints: [
          '只改 `class` 属性的值，别动文字。',
          'htm 用 `class`，用 `className` 的话样式和检查项都找不到元素。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '一个组件是一个返回结构的函数；模板用 `htm` 的反引号标签，插值写 `${表达式}`，',
          '类名用 `class`、事件用驼峰 `onClick`、属性绑变量写 `属性=${值}`。',
          '',
          '下一章讲怎么把值从外面传进组件（props），以及组件怎么拼起来。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
