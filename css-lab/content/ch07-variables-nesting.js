/* ch07 — 变量、嵌套与 :has() */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch07',
    title: '第 7 章 · 变量、嵌套与 :has()',
    goal: '把会重复的值收成变量，用嵌套把一段样式写在一起，用 :has() 让父元素跟着子元素变化。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 自定义属性：变量',
          '',
          '变量名以 `--` 开头，写在任意选择器里；`:root` 是文档根，写在它上面的相当于全局变量。',
          '',
          '```',
          ':root { --brand: #2456c8; --radius: 8px; }',
          '.btn { background: var(--brand); border-radius: var(--radius); }',
          '```',
          '',
          '两条重要性质：',
          '',
          '1. **变量本身会继承**，所以子元素不用重复定义',
          '2. **求值的时刻在使用它的元素上**，不是定义的地方——这就是「同一个变量在暗色区域自动变另一个值」的原理'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一个变量，在两块区域里取到不同的值',
        height: 210,
        html: [
          '<div class="light"><button class="btn">浅色区里的按钮</button></div>',
          '<div class="dark"><button class="btn">深色区里的按钮</button></div>'
        ].join('\n'),
        css: [
          ':root { --bg: #f6f4ec; --fg: #232019; }',
          '.light, .dark { padding: 12px; }',
          '.light { --bg: #f6f4ec; --fg: #232019; }',
          '.dark { --bg: #2b2a26; --fg: #f6f4ec; }',
          '.btn { background: var(--bg); color: var(--fg); border: 1px solid currentColor; padding: 6px 12px; }'
        ].join('\n'),
        checks: [
          'eq(style(".dark .btn", "color"), "rgb(246, 244, 236)", "深色区里的按钮文字取到了深色区那一份")',
          'eq(style(".light .btn", "color"), "rgb(35, 32, 25)", "浅色区里的按钮取到的是浅色那一份")',
          'eq(style(".btn", "border-top-style"), "solid", "用到的变量语法本身没问题")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`var(--x, 兜底值)` 可以给个默认值：变量没定义时用兜底，不会整条声明失效。'
          + '变量写错名字是**静默失效**的——那一条声明直接不算，不报错，很容易看不出来。'
      },
      {
        kind: 'prose',
        md: [
          '## 嵌套：把 `&` 用对',
          '',
          '原生 CSS 现在支持嵌套，子规则写在父规则里：',
          '',
          '```',
          '.card {',
          '  padding: 12px;',
          '  .title { font-weight: 700; }   /* 等于 .card .title */',
          '  &:hover { border-color: #2456c8; }   /* 等于 .card:hover */',
          '  &.big { font-size: 20px; }     /* 等于 .card.big */',
          '}',
          '```',
          '',
          '`&` 代表父选择器本身。**没有 `&` 的时候是后代关系**（中间有空格），'
            + '**有 `&` 的时候是拼接**（中间没空格）。这一个字符的差别决定命中范围。',
          '',
          '嵌套还会把优先级抬高（因为展开后选择器变长了），别嵌太深。三层以上就该拆开写。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '嵌套里的 & 与不加 & 的区别',
        height: 200,
        html: [
          '<div class="card">',
          '  <span class="label">被嵌套规则命中的标签</span>',
          '  <span class="tag">另一个标签</span>',
          '</div>'
        ].join('\n'),
        css: [
          '.card { padding: 12px; background: #f6f4ec; }',
          '.card {',
          '  .label { background: #dfd; padding: 4px 8px; }',
          '  &.on .label { outline: 2px solid #2456c8; }',
          '}'
        ].join('\n'),
        checks: [
          'eq(style(".label", "background-color"), "rgb(221, 255, 221)", "嵌套的后代规则生效了")',
          'eq(style(".tag", "background-color"), "rgba(0, 0, 0, 0)", "没被命中的标签没有底色")',
          'eq(style(".card", "padding-top"), "12px", "父规则自己的声明也在")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `:has()`：让父元素跟着子元素变',
          '',
          '以前只能「选中有某种属性的元素」，`:has()` 让选择器能**往回看**：选「**里面包含**某个东西」的元素。',
          '',
          '- `.card:has(img)`：卡片里**有图片**的那些卡片',
          '- `.field:has(input:invalid)`：输入不合法的那个字段',
          '- `.list:has(> .empty)`：直接子元素里有空状态的那个列表',
          '',
          '它解决的是「父元素要按子元素的状态改样式」这一整类问题，之前只能靠 JS 加类。',
          '注意它不能嵌套（`a:has(b:has(c))` 无效），也不便宜——大面积用会拖慢样式重算。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '有图和没图的卡片，外框不一样',
        height: 230,
        html: [
          '<div class="wrap">',
          '  <div class="card"><div class="thumb">图</div><p>有图的卡片</p></div>',
          '  <div class="card"><p>没图的卡片</p></div>',
          '</div>'
        ].join('\n'),
        css: [
          '.wrap { display: flex; gap: 10px; }',
          '.card { width: 130px; padding: 10px; border: 2px solid #e0dbcc; }',
          '.card:has(.thumb) { border-color: #2456c8; }',
          '.thumb { height: 40px; background: #dfd; }'
        ].join('\n'),
        checks: [
          'eq(style(".card:has(.thumb)", "border-top-color"), "rgb(36, 86, 200)", "有图的卡片被 :has() 命中")',
          'eq(style(".card:not(:has(.thumb))", "border-top-color"), "rgb(224, 219, 204)", "没图的卡片保持原样")',
          'count(".card", 2, "两张卡片都在")'
        ]
      },
      {
        kind: 'table',
        head: ['写法', '作用'],
        rows: [
          ['`--name: 值`', '定义变量，名字必须以两个短横线开头'],
          ['`var(--name)`', '取用；没定义时这条声明整条失效（不报错）'],
          ['`var(--name, 8px)`', '带兜底值，没定义时用 `8px`'],
          ['`:root`', '文档根，全局变量的常驻位置'],
          ['`.a { .b { } }`', '嵌套，展开是 `.a .b`（后代）'],
          ['`.a { &:hover { } }`', '嵌套加 `&`，展开是 `.a:hover`'],
          ['`.a { &.b { } }`', '展开是 `.a.b`（同一个元素上两个类）'],
          ['`.a:has(.b)`', '里面包含 `.b` 的 `.a`'],
          ['`.a:has(> .b)`', '直接子元素里有 `.b` 的 `.a`']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex07-1',
        title: '把写死的主色收成变量',
        task: [
          '同一个颜色在文件里抄了三遍，改起来容易漏。',
          '',
          '要求：只改 `css` 栏，在 `:root` 上定义 `--brand: #2456c8`，'
            + '并让 `.a`、`.b`、`.c` 三处都通过 `var(--brand)` 取色。'
        ].join('\n'),
        starter: {
          html: [
            '<p class="a">第一处</p>',
            '<p class="b">第二处</p>',
            '<p class="c">第三处</p>'
          ].join('\n'),
          css: [
            '.a { color: #2456c8; }',
            '.b { border-bottom: 2px solid #2456c8; }',
            '.c { background: #2456c8; color: #f6f4ec; }'
          ].join('\n')
        },
        solution: {
          css: [
            ':root { --brand: #2456c8; }',
            '.a { color: var(--brand); }',
            '.b { border-bottom: 2px solid var(--brand); }',
            '.c { background: var(--brand); color: #f6f4ec; }'
          ].join('\n')
        },
        tests: [
          'eq(style(":root", "--brand"), "#2456c8", "变量定义在 :root 上")',
          'eq(style(".a", "color"), "rgb(36, 86, 200)", "第一处取到变量")',
          'eq(style(".c", "background-color"), "rgb(36, 86, 200)", "第三处取到变量")'
        ],
        hints: [
          '变量定义和取用都要带两个短横线：`--brand`。',
          '取用写 `var(--brand)`，可以放在任何值的位置上。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-2',
        title: '给变量留个兜底值',
        task: [
          '这段样式的文字颜色全靠变量，但变量可能没被定义。',
          '',
          '要求：只改 `css` 栏，让 `.note` 的颜色用 `var(--note-color, #6b6558)`，'
            + '并且**不要**在 `:root` 里定义这个变量（练习要的就是走兜底那条路）。'
        ].join('\n'),
        starter: {
          html: '<p class="note">这段说明文字应该有颜色</p>',
          css: '.note { padding: 8px; background: #f6f4ec; color: var(--note-color); }'
        },
        solution: {
          css: '.note { padding: 8px; background: #f6f4ec; color: var(--note-color, #6b6558); }'
        },
        tests: [
          'eq(style(".note", "color"), "rgb(107, 101, 88)", "走了兜底值")',
          'eq(style(":root", "--note-color"), "", "没有在 :root 里定义它")',
          'eq(style(".note", "background-color"), "rgb(246, 244, 236)", "其他声明没被影响")'
        ],
        hints: [
          '`var()` 的第二个参数就是兜底值，用逗号隔开。',
          '变量不存在时，没有兜底的整条声明会失效——本例里就是「颜色没设上」。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-3',
        title: '把标题样式收进卡片里',
        task: [
          '这条标题样式现在对页面上**所有** `.title` 生效，卡片外面那个也跟着变了。',
          '',
          '要求：只改 `css` 栏，用嵌套把它收进 `.card` 里，让颜色只作用在卡片内的标题上；'
            + '卡片外那个 `.title` 回到默认文字色。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="card"><span class="title">卡片里的标题</span></div>',
            '<p class="title">卡片外的标题</p>'
          ].join('\n'),
          css: [
            '.card { padding: 12px; background: #f6f4ec; border: 1px solid #e0dbcc; }',
            '.title { font-weight: 700; color: #2456c8; font-size: 15px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="card"><span class="title">卡片里的标题</span></div>',
            '<p class="title">卡片外的标题</p>'
          ].join('\n'),
          css: [
            '.card {',
            '  padding: 12px; background: #f6f4ec; border: 1px solid #e0dbcc;',
            '  .title { font-weight: 700; color: #2456c8; font-size: 15px; }',
            '}'
          ].join('\n')
        },
        tests: [
          'eq(style(".card .title", "color"), "rgb(36, 86, 200)", "卡片里的标题还是蓝的")',
          'eq(style(".card .title", "font-weight"), "700", "粗体也在")',
          'eq(style("body > .title", "color"), "rgb(35, 32, 25)", "卡片外的标题回到了默认色")'
        ],
        hints: [
          '把那条 `.title` 规则挪进 `.card { }` 里面，选择器写 `.title`，展开就是 `.card .title`。',
          '嵌套里不加 `&` 就是后代关系，正好符合「只作用于卡片内部」。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-4',
        title: '输入出错时整个字段变红',
        task: [
          '用户把内容输错时，只有输入框变红，说明文字没跟上。',
          '',
          '要求：只改 `css` 栏，用 `:has()` 让**包含不合法输入的** `.field` 里的说明文字变成 `#c2456b`。'
        ].join('\n'),
        starter: {
          html: [
            '<label class="field">',
            '  <span class="hint">邮箱</span>',
            '  <input type="email" value="not-an-email">',
            '</label>',
            '<label class="field">',
            '  <span class="hint">昵称</span>',
            '  <input type="text" value="ok">',
            '</label>'
          ].join('\n'),
          css: [
            '.field { display: block; margin-bottom: 10px; }',
            '.hint { font-size: 13px; color: #6b6558; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<label class="field">',
            '  <span class="hint">邮箱</span>',
            '  <input type="email" value="not-an-email">',
            '</label>',
            '<label class="field">',
            '  <span class="hint">昵称</span>',
            '  <input type="text" value="ok">',
            '</label>'
          ].join('\n'),
          css: [
            '.field { display: block; margin-bottom: 10px; }',
            '.hint { font-size: 13px; color: #6b6558; }',
            '.field:has(input:invalid) .hint { color: #c2456b; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".field:has(input:invalid) .hint", "color"), "rgb(194, 69, 107)", "出错的那个字段的说明变红")',
          'eq(style(".field:nth-of-type(2) .hint", "color"), "rgb(107, 101, 88)", "正常字段不受影响")',
          'eq(style(".field:nth-of-type(2)", "display"), "block", "字段的布局没被改动")'
        ],
        hints: [
          '`:has(...)` 写在你想要改变的那个元素上，括号里写「它里面有什么」。',
          '`input:invalid` 由浏览器根据 `type="email"` 自己判定，不用写 JS。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-5',
        title: '列表空了才显示提示',
        task: [
          '两段提示文字现在一直挂在页面上，不管列表里有没有内容。',
          '',
          '要求：只改 `css` 栏，让提示默认隐藏，**只有**紧跟在空列表后面的那一段显示出来。'
        ].join('\n'),
        starter: {
          html: [
            '<ul class="list"></ul>',
            '<p class="empty-tip">还没有内容</p>',
            '<ul class="list filled"><li>有一条内容</li></ul>',
            '<p class="empty-tip">还没有内容</p>'
          ].join('\n'),
          css: [
            '.list { padding-left: 18px; margin: 0 0 8px; }',
            '.empty-tip { color: #6b6558; font-size: 13px; margin: 0 0 12px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<ul class="list"></ul>',
            '<p class="empty-tip">还没有内容</p>',
            '<ul class="list filled"><li>有一条内容</li></ul>',
            '<p class="empty-tip">还没有内容</p>'
          ].join('\n'),
          css: [
            '.list { padding-left: 18px; margin: 0 0 8px; }',
            '.empty-tip { display: none; color: #6b6558; font-size: 13px; margin: 0 0 12px; }',
            '.list:not(:has(li)) + .empty-tip { display: block; }'
          ].join('\n')
        },
        tests: [
          'eq(style("ul:not(:has(li)) + .empty-tip", "display"), "block", "空列表旁边那段显示出来了")',
          'eq(style(".list.filled + .empty-tip", "display"), "none", "有内容的列表旁边那段仍然隐藏")',
          'eq(style(".empty-tip", "color"), "rgb(107, 101, 88)", "提示文字的样式没被破坏")'
        ],
        hints: [
          '空列表就是「里面没有 `li` 的列表」：`.list:not(:has(li))`。',
          '紧跟在它后面的那一段用相邻兄弟选择器 `+` 选中，把 `display` 改回 `block`。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
