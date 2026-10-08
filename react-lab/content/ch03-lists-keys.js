/* ch03 — 列表与 key：把数组映射成一组元素，给每个元素一个稳定的 key。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch03 && node tools/verify-browser.mjs --chapter ch03
 */
(function (root) {
  (root.RLLAB_CHAPTERS || (root.RLLAB_CHAPTERS = [])).push({
    id: 'ch03',
    title: '第 3 章 · 列表与 key',
    goal: '会把数组映射成列表、给每个兄弟元素一个稳定的 key，并能把列表项拆成组件。',
    sections: [
      {
        kind: 'prose',
        md: [
          '数组要变成一组元素，用 `.map` 逐项映射：`items.map(item => 元素)`。模板里 `${}` 的位置',
          '可以直接放数组，React 会把它展开成一串兄弟节点，所以 `.map` 的返回值正好放得进去。',
          '',
          '映射出来的每个元素都要一个 `key`。`key` 只在 React 内部用，不会变成 DOM 属性。',
          '它必须在**同一组兄弟里唯一**，而且**跨渲染稳定**：这一项挪到哪，`key` 就跟到哪。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['写法', '结果'],
        rows: [
          ['`items.map(...)`', '每项变成一个元素，每个元素都要 `key`'],
          ['`key=${item.id}`', '稳定唯一，重排后还认得同一项'],
          ['`key=${i}`', '数组下标；列表不重排时能用，一重排就错位']
        ]
      },
      {
        kind: 'demo',
        caption: '把数组映射成 li，每项带 key',
        code: [
          'export default function App() {',
          '  const fruits = ["苹果", "香蕉", "樱桃"]',
          '  return html`<ul>${fruits.map(f => html`<li class="f" key=${f}>${f}</li>`)}</ul>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".f"), 3, "映射出三项")',
          'eq(text(".f"), "苹果", "第一项是苹果")',
          'eq(text("li:nth-child(2)"), "香蕉", "第二项是香蕉")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## key 用数据的 id，不要用下标',
          '',
          '`key=${i}` 用的是数组下标。列表只展示、顺序不动时它没事；一旦插入、删除、排序，',
          '下标对应的项就换人了。React 靠 `key` 判断「这一项还是不是刚才那一项」，',
          '`key` 错位会把上一条的状态安到下一条身上。',
          '',
          '数据自带 id 时，`key=${item.id}` 永远对得上。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '下标 key 与 id key 写法上的差别',
        code: [
          'export default function App() {',
          '  const todos = [',
          '    { id: "t1", text: "写代码" },',
          '    { id: "t2", text: "跑步" },',
          '    { id: "t3", text: "读书" }',
          '  ]',
          '  return html`<div>',
          '    <ul class="idx">${todos.map((t, i) => html`<li key=${i}>${t.text}</li>`)}</ul>',
          '    <ul class="uid">${todos.map(t => html`<li key=${t.id}>${t.text}</li>`)}</ul>',
          '  </div>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".idx li"), 3, "下标 key 的列表三项")',
          'eq(count(".uid li"), 3, "id key 的列表三项")',
          'eq(text(".uid li"), "写代码", "id key 列表第一项")',
          'eq(text(".uid li:nth-child(3)"), "读书", "id key 列表第三项")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '同一组兄弟里 `key` 要唯一。漏写 `key`，或几项共用一个 `key`，React 会在控制台警告，重排时还可能把上面的状态错安到下面。'
      },
      {
        kind: 'prose',
        md: [
          '## 一行一个组件',
          '',
          '`.map` 里可以直接写标签，也可以写你自己的组件。写成组件时 `key` 加在**组件标签**上：',
          '`<${Item} key=${item.id} text=${item.text} />`。',
          '',
          '`key` 是 React 保留的属性，子组件里 `props.key` 读不到它，别指望把它当普通 prop 用。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '每行是一个 Item 组件',
        code: [
          'function Item({ text }) {',
          '  return html`<li class="it">${text}</li>`',
          '}',
          '',
          'export default function App() {',
          '  const items = ["苹果", "香蕉"]',
          '  return html`<ul>${items.map(t => html`<${Item} key=${t} text=${t} />`)}</ul>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 2, "两个 Item")',
          'eq(text(".it"), "苹果", "第一个 Item 拿到 text")',
          'eq(text("li:nth-child(2)"), "香蕉", "第二个 Item 拿到 text")'
        ]
      },
      {
        kind: 'note',
        md: '把数组直接塞进模板、没有先 `.map`，数组里若是对象，React 会报「Objects are not valid as a React child」。先映射成元素，再给每个元素 `key`。'
      },
      {
        kind: 'exercise',
        id: 'ex03-1',
        title: '把数组渲染成列表',
        task: [
          '现在只写死了一项。请用 `items.map` 把整个数组渲染成 `li`：',
          '',
          '- 每项一个 `li`，类名 `it`；',
          '- 文字就是该项的字符串；',
          '- 每个 `li` 给一个 `key`。',
          '',
          '先把右边跑起来看看现在只剩一项，再动手改。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  const items = ["苹果", "香蕉", "樱桃"]',
          '  return html`<ul><li class="it">苹果</li></ul>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          '  const items = ["苹果", "香蕉", "樱桃"]',
          '  return html`<ul>${items.map(t => html`<li class="it" key=${t}>${t}</li>`)}</ul>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count("li"), 3, "三项都要渲染")',
          'eq(text(".it"), "苹果", "第一项是苹果")',
          'eq(text("li:nth-child(3)"), "樱桃", "第三项是樱桃")',
          'has("ul", "外面要有 ul")'
        ],
        hints: [
          '在 `ul` 里写 `${items.map(t => ...)}`，箭头函数返回一个 `li`。',
          '`li` 上写 `key=${t}`，因为这里字符串本身就是唯一的值。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-2',
        title: 'key 用数据的 id',
        task: [
          '`todos` 是对象数组，每项有 `id` 和 `title`。现在每行显示的是 `id`，要改成 `title`。',
          '',
          '- `li` 的类名保持 `it`；',
          '- 文字改成该条的 `title`：`写代码`、`跑步`、`读书`；',
          '- `key` 用该条的 `id`，不要用数组下标。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  const todos = [',
          '    { id: "t1", title: "写代码" },',
          '    { id: "t2", title: "跑步" },',
          '    { id: "t3", title: "读书" }',
          '  ]',
          '  return html`<ul>${todos.map((t, i) => html`<li class="it" key=${i}>${t.id}</li>`)}</ul>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          '  const todos = [',
          '    { id: "t1", title: "写代码" },',
          '    { id: "t2", title: "跑步" },',
          '    { id: "t3", title: "读书" }',
          '  ]',
          '  return html`<ul>${todos.map(t => html`<li class="it" key=${t.id}>${t.title}</li>`)}</ul>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 3, "三项都在")',
          'eq(text(".it"), "写代码", "第一项显示 title")',
          'eq(text("li:nth-child(2)"), "跑步", "第二项显示 title")'
        ],
        hints: [
          '把插值从 `${t.id}` 改成 `${t.title}`。',
          '`key` 换成 `key=${t.id}`，id 才是跨渲染稳定的。',
          '`.map` 的回调可以不要下标参数，直接 `t => ...`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-3',
        title: '把列表项拆成组件',
        task: [
          '父组件已经把每项交给 `Item` 组件了，但 `Item` 还在显示占位文字。',
          '',
          '请让 `Item` 渲染一个 `li`：类名 `it`，文字是收到的 `text`。',
          '',
          '父组件的写法不用改。'
        ].join('\n'),
        starter: [
          'function Item({ text }) {',
          '  return html`<li class="it">占位</li>`',
          '}',
          '',
          'export default function App() {',
          '  const items = ["苹果", "香蕉", "樱桃"]',
          '  return html`<ul>${items.map(t => html`<${Item} key=${t} text=${t} />`)}</ul>`',
          '}'
        ].join('\n'),
        solution: [
          'function Item({ text }) {',
          '  return html`<li class="it">${text}</li>`',
          '}',
          '',
          'export default function App() {',
          '  const items = ["苹果", "香蕉", "樱桃"]',
          '  return html`<ul>${items.map(t => html`<${Item} key=${t} text=${t} />`)}</ul>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 3, "每一项都是一个 Item")',
          'eq(text(".it"), "苹果", "Item 读出 text")',
          'eq(text("li:nth-child(3)"), "樱桃", "第三项是樱桃")'
        ],
        hints: [
          '`Item` 的参数里已经解构出了 `text`，直接把它插进 `li`。',
          '`key` 加在父组件里的 `<${Item} ... />` 上，组件内部写不到 `key`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-4',
        title: '过滤后再渲染，key 还是 id',
        task: [
          '`tasks` 每项有 `done`。请只渲染 `done` 为真的项：',
          '',
          '- 先 `filter`，再 `map`；',
          '- 类名 `it`，文字是该条的 `text`；',
          '- `key` 继续用该条的 `id`。',
          '',
          '结果应该只剩两项：`写代码`、`读书`。'
        ].join('\n'),
        starter: [
          'export default function App() {',
          '  const tasks = [',
          '    { id: "a", text: "写代码", done: true },',
          '    { id: "b", text: "跑步", done: false },',
          '    { id: "c", text: "读书", done: true }',
          '  ]',
          '  return html`<ul>${tasks.map(t => html`<li class="it" key=${t.id}>${t.text}</li>`)}</ul>`',
          '}'
        ].join('\n'),
        solution: [
          'export default function App() {',
          '  const tasks = [',
          '    { id: "a", text: "写代码", done: true },',
          '    { id: "b", text: "跑步", done: false },',
          '    { id: "c", text: "读书", done: true }',
          '  ]',
          '  return html`<ul>${tasks.filter(t => t.done).map(t => html`<li class="it" key=${t.id}>${t.text}</li>`)}</ul>`',
          '}'
        ].join('\n'),
        tests: [
          'eq(count(".it"), 2, "只留 done 的两项")',
          'eq(text(".it"), "写代码", "第一项是写代码")',
          'eq(text("li:nth-child(2)"), "读书", "第二项是读书")'
        ],
        hints: [
          '`tasks.filter(t => t.done)` 会得到一个新数组，再对它 `.map`。',
          '`filter` 的回调返回布尔值，真值留下。',
          '过滤不会改变 `id`，`key` 照旧写 `key=${t.id}`。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 小结',
          '',
          '把数组用 `.map` 映射成一组元素，模板里 `${}` 直接放结果；每个兄弟元素给一个 `key`，',
          '用数据自己的稳定 id，不要用数组下标；`.map` 里可以返回标签，也可以返回你自己的组件。',
          '',
          '下一章讲 state 与事件，让页面能随点击变化。'
        ].join('\n')
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
