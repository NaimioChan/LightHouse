/* ch01 — 选择器与命中 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 选择器与命中',
    goal: '看到一条样式没生效时，能判断是选择器没选中，还是被别的规则压过去了；写出能精确命中的选择器。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 一条 CSS 规则由两半组成',
          '',
          '```',
          '选择器 { 属性: 值; }',
          '```',
          '',
          '选择器负责**选中哪些元素**，花括号里写**把它们变成什么样**。样式不生效，`90%` 的情况出在前半截：'
            + '选择器一个元素都没选中。判断方法只有一个——打开 DevTools 的 Elements 面板点一下那个元素，看右侧 Styles 里有没有你的规则。',
          '',
          '本章练的是选择器这一半。四种基本形态：',
          '',
          '- 标签选择器 `p`，选中页面上所有 `p`，改一个影响一片',
          '- 类选择器 `.card`，选中 `class="card"` 的元素，可以重复用',
          '- id 选择器 `#main`，选中 `id="main"` 的那一个，全页唯一',
          '- 通配符 `*`，选中所有元素，页面上每个元素都占一行开销'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '四种选择器各命中不同范围的元素',
        height: 200,
        html: [
          '<p class="lead">我是 p，也是 .lead</p>',
          '<p>我只是 p</p>',
          '<p id="only">我是 p，也是 #only</p>'
        ].join('\n'),
        css: [
          'p { padding: 6px 8px; margin: 0 0 6px; background: #eef; }',
          '.lead { background: #dfd; font-weight: 700; }',
          '#only { background: #fdd; }'
        ].join('\n'),
        checks: [
          'count("p", 3, "页面上有三个 p")',
          'eq(style(".lead", "background-color"), "rgb(221, 255, 221)", "类选择器命中的那个背景是浅绿")',
          'eq(style("#only", "background-color"), "rgb(255, 221, 221)", "id 命中的那个背景是浅红")',
          'eq(style("p:nth-of-type(2)", "background-color"), "rgb(238, 238, 255)", "第二个 p 只吃到 p 的规则")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '同一份样式被多条规则同时选中时，谁在后面、谁更具体，就谁说了算——这条规则叫层叠，第 3 章专门讲。',
          '',
          '## 后代、子代、相邻兄弟',
          '',
          '三个空格开头的连接符决定了「隔几层也算数」：',
          '',
          '- `.list li`（空格）选 `.list` 里**任意深度**的 `li`，包括嵌套列表里的',
          '- `.list > li`（`>`）只选**直接子元素**，嵌套的更深的选不到',
          '- `h2 + p`（`+`）选紧跟在 `h2` 后面那个 `p`；`h2 ~ p`（`~`）选后面**所有**同级 `p`',
          '',
          '需要「只作用于第一层」时不要靠目测，写成 `>` 是最省事的办法。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同样的两条规则，加不加 > 结果不同',
        height: 240,
        html: [
          '<ul class="plain">',
          '  <li>第一层 A</li>',
          '  <li>',
          '    第一层 B',
          '    <ul>',
          '      <li>嵌套里的 C</li>',
          '    </ul>',
          '  </li>',
          '</ul>',
          '<ul class="direct">',
          '  <li>第一层 A</li>',
          '  <li>',
          '    第一层 B',
          '    <ul>',
          '      <li>嵌套里的 C</li>',
          '    </ul>',
          '  </li>',
          '</ul>'
        ].join('\n'),
        css: [
          '.plain li { border: 2px solid #d26; padding: 2px 6px; }',
          '.direct > li { border: 2px solid #26b; padding: 2px 6px; }'
        ].join('\n'),
        checks: [
          'eq(px(".plain ul li", "border-top-width"), 2, "后代选择器连嵌套里的 li 一起选中")',
          'eq(style(".direct > li", "border-top-color"), "rgb(34, 102, 187)", "子代选择器命中直接子元素")',
          'eq(style(".direct ul li", "border-top-style"), "none", "子代选择器碰不到更深一层")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '判断一条选择器会不会命中，把它念一遍：「`.list > li` = `.list` 的**直接子元素**里的 `li`」。'
          + '如果念出来跟你想的不一样，页面上的结果就会跟你想的不一样。'
      },
      {
        kind: 'prose',
        md: [
          '## `:nth-child` 与 `:nth-of-type` 不是一回事',
          '',
          '两个都用来数「第几个」，但数的范围不同：',
          '',
          '- `li:nth-child(2)`：把父元素里**所有孩子**排成一排，第 2 个如果正好是 `li` 才命中',
          '- `li:nth-of-type(2)`：只数**同标签的兄弟**，第 2 个 `li` 命中',
          '',
          '列表里混进一个别的标签（比如一条说明 `span`），这两者的结果就差开了。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '混了 span 之后，两种数法的差别',
        height: 210,
        html: [
          '<ul>',
          '  <li class="a">第一个</li>',
          '  <span class="note-line">一条插进来的说明</span>',
          '  <li class="b">第二个</li>',
          '  <li class="c">第三个</li>',
          '</ul>'
        ].join('\n'),
        css: [
          'ul { margin: 0; padding: 0; list-style: none; }',
          'li, .note-line { padding: 4px 8px; }',
          'li:nth-child(2) { background: #fdd; }',
          'li:nth-of-type(2) { background: #dfd; }'
        ].join('\n'),
        checks: [
          'eq(style(".a", "background-color"), "rgba(0, 0, 0, 0)", "第一个 li 没被 nth-child(2) 命中（它不是第 2 个孩子）")',
          'eq(style(".b", "background-color"), "rgb(221, 255, 221)", "第二个 li 被 nth-of-type(2) 命中")',
          'eq(style(".c", "background-color"), "rgba(0, 0, 0, 0)", "第三个 li 两条都没命中")'
        ]
      },
      {
        kind: 'table',
        head: ['选择器', '选中什么'],
        rows: [
          ['`.card`', '所有 `class="card"` 的元素'],
          ['`#main`', '`id="main"` 的那一个元素'],
          ['`.list li`', '`.list` 内任意深度的 `li`'],
          ['`.list > li`', '`.list` 的直接子元素里的 `li`'],
          ['`li:nth-child(2)`', '父元素所有孩子里的第 2 个，且它必须是 `li`'],
          ['`li:nth-of-type(2)`', '同标签兄弟里的第 2 个 `li`'],
          ['`.btn:not([disabled])`', '不带 `disabled` 属性的 `.btn`'],
          ['`input[type="text"]`', '`type` 恰好是 `text` 的输入框'],
          ['`.a, .b`', '命中 `.a` 或 `.b` 的元素（逗号是「或」）']
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-1',
        title: '把没命中的选择器改对',
        task: [
          '三张卡片的圆角没出来，因为选择器少写了一个符号。',
          '',
          '要求：只改 `css` 栏，让每张卡片都有 `8px` 的圆角；`padding` 保持 `12px` 不动。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="card">甲</div>',
            '<div class="card">乙</div>',
            '<div class="card">丙</div>'
          ].join('\n'),
          css: [
            '.card { padding: 12px; margin-bottom: 8px; background: #eef; }',
            'card { border-radius: 8px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.card { padding: 12px; margin-bottom: 8px; background: #eef; }',
            '.card { border-radius: 8px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".card", "border-radius"), "8px", "卡片的圆角")',
          'near(px(".card", "padding-top"), 12, 1, "内边距还在")',
          'count(".card", 3, "三张卡片都在")'
        ],
        hints: [
          '`card {}` 这种写法选的是 `<card>` 这个标签，页面上没有这种元素，所以一条都没选中。',
          '类选择器要在名字前面加一个点：`.card`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-2',
        title: '只给第一层列表项加边框',
        task: [
          '嵌套列表里的子项也被描上了边框，看着一层层套下去。',
          '',
          '要求：只改 `css` 栏，让边框只落在第一层 `li` 上，嵌套里的 `li` 不要边框。'
        ].join('\n'),
        starter: {
          html: [
            '<ul class="list">',
            '  <li>第一层 A</li>',
            '  <li>',
            '    第一层 B',
            '    <ul>',
            '      <li>嵌套里的 C</li>',
            '    </ul>',
            '  </li>',
            '</ul>'
          ].join('\n'),
          css: [
            '.list li { border: 2px solid #26b; padding: 3px 6px; }',
            'ul { padding-left: 18px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.list > li { border: 2px solid #26b; padding: 3px 6px; }',
            'ul { padding-left: 18px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".list > li", "border-top-width"), "2px", "第一层有边框")',
          'eq(style(".list ul li", "border-top-style"), "none", "嵌套里的 li 没有边框")',
          'count(".list li", 3, "三个 li 都还在")'
        ],
        hints: [
          '把空格换成 `>`，选择器就从「后代」变成「直接子元素」。',
          '`.list > li` 只认 `.list` 自己的孩子，嵌套列表的 li 是孙子辈。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-3',
        title: '跳过混进来的那一行，标出第二个 li',
        task: [
          '列表里插了一行说明，用 `:nth-child(2)` 标到的不是第二个 `li`。',
          '',
          '要求：只改 `css` 栏，让**第二个 `li`**（文字是「第二个」）背景变成 `#dfd`，'
            + '说明行和第一个、第三个 `li` 不受影响。'
        ].join('\n'),
        starter: {
          html: [
            '<ul>',
            '  <li class="one">第一个</li>',
            '  <span class="hint-line">一条插进来的说明</span>',
            '  <li class="two">第二个</li>',
            '  <li class="three">第三个</li>',
            '</ul>'
          ].join('\n'),
          css: [
            'ul { margin: 0; padding: 0; list-style: none; }',
            'li, .hint-line { padding: 4px 8px; }',
            'li:nth-child(2) { background: #dfd; }'
          ].join('\n')
        },
        solution: {
          css: [
            'ul { margin: 0; padding: 0; list-style: none; }',
            'li, .hint-line { padding: 4px 8px; }',
            'li:nth-of-type(2) { background: #dfd; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".two", "background-color"), "rgb(221, 255, 221)", "第二个 li 被标上")',
          'eq(style(".one", "background-color"), "rgba(0, 0, 0, 0)", "第一个 li 不受影响")',
          'eq(style(".hint-line", "background-color"), "rgba(0, 0, 0, 0)", "说明行不受影响")'
        ],
        hints: [
          '`:nth-child` 数的是父元素的所有孩子，那个 `span` 也算一个，所以第 2 个孩子根本不是 `li`。',
          '换成只数同类兄弟的那个写法：`:nth-of-type`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-4',
        title: '给能点的按钮加底边，禁用的不动',
        task: [
          '两个按钮长得一样，但其中一个带 `disabled`，点了没反应。要求把视觉上也分开。',
          '',
          '要求：只改 `css` 栏，给**不带 `disabled` 的** `.btn` 加一条 `2px` 实线底边（颜色任意深色，'
            + '这里用 `#26b`），带 `disabled` 的那个按钮不要这条底边。'
        ].join('\n'),
        starter: {
          html: [
            '<button class="btn">可以点</button>',
            '<button class="btn" disabled>点不了</button>'
          ].join('\n'),
          css: [
            '.btn { padding: 6px 12px; margin-right: 8px; background: #eef; border: 0; border-radius: 6px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.btn { padding: 6px 12px; margin-right: 8px; background: #eef; border: 0; border-radius: 6px; }',
            '.btn:not([disabled]) { border-bottom: 2px solid #26b; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".btn:not([disabled])", "border-bottom-width"), "2px", "能点的那个有底边")',
          'eq(style(".btn[disabled]", "border-bottom-style"), "none", "禁用的那个没有底边")',
          'count(".btn", 2, "两个按钮都在")'
        ],
        hints: [
          '`:not(选择器)` 把「不满足」的条件拼进选择器里。',
          '属性选择器 `[disabled]` 匹配带这个属性的元素，写进 `:not()` 就是「没有这个属性」。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-5',
        title: '一条规则管住两种按钮',
        task: [
          '两个按钮的元素类型不同（一个是 `button`，一个是 `a`），都要长得一样。',
          '',
          '要求：只改 `css` 栏，用**一条**规则同时给 `.btn-primary` 和 `.btn-link` 加上 `6px` 圆角，'
            + '别写两条。'
        ].join('\n'),
        starter: {
          html: [
            '<button class="btn btn-primary">主要操作</button>',
            '<a class="btn btn-link" href="#end">看说明</a>',
            '<p id="end">下边这段只是占位。</p>'
          ].join('\n'),
          css: [
            '.btn { display: inline-block; padding: 6px 12px; margin-right: 8px; background: #eef; }',
            '.btn-primary { color: #26b; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.btn { display: inline-block; padding: 6px 12px; margin-right: 8px; background: #eef; }',
            '.btn-primary { color: #26b; }',
            '.btn-primary, .btn-link { border-radius: 6px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".btn-primary", "border-radius"), "6px", "按钮圆角")',
          'eq(style(".btn-link", "border-radius"), "6px", "链接圆角")',
          'near(px(".btn-link", "padding-top"), 6, 1, "链接继承了 .btn 的内边距")'
        ],
        hints: [
          '选择器列表用逗号分隔，逗号读作「或」。',
          '一条规则里逗号前后是两个独立的选择器，属性只写一遍。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
