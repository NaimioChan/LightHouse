/* ch10 — 容器查询与工具类 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch10',
    title: '第 10 章 · 容器查询与工具类',
    goal: '让组件按「自己被放进多宽的容器」变形，而不是按整个视口；并能看懂、写出工具类那套思路。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 媒体查询看视口，容器查询看容器',
          '',
          '媒体查询的所有规则都盯着**视口宽度**。问题是同一个卡片组件，放在宽屏的主栏里和窄屏的侧栏里，'
            + '视口是一样的宽，但它该长得不一样。',
          '',
          '容器查询解决的正是这件事：让组件按**自己所在容器的宽度**响应。',
          '',
          '用法分两步：',
          '',
          '1. 给容器声明 `container-type: inline-size;`（并起个名字 `container-name` 更好用）',
          '2. 在子元素里写 `@container 容器名 (min-width: 500px) { … }`',
          '',
          '注意 `container-type: inline-size` 会让这个容器在**行内方向上**成为独立的尺寸基准，'
            + '它的宽度不再由内容决定——所以在弹性项上用之前先确认宽度来源。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一个卡片，两种容器宽度下的两套样式',
        height: 250,
        html: [
          '<div class="shelf">',
          '  <div class="pane wide"><div class="card"><span class="dot"></span>宽容器里的卡片</div></div>',
          '  <div class="pane narrow"><div class="card"><span class="dot"></span>窄容器里的卡片</div></div>',
          '</div>'
        ].join('\n'),
        css: [
          '.shelf { display: flex; gap: 10px; align-items: flex-start; }',
          '.pane { container-type: inline-size; container-name: pane; background: #f6f4ec; padding: 8px; }',
          '.pane.wide { width: 260px; }',
          '.pane.narrow { width: 120px; }',
          '.card { display: flex; flex-direction: column; background: #dbe6ff; padding: 8px; }',
          '@container pane (min-width: 200px) {',
          '  .card { flex-direction: row; align-items: center; gap: 8px; }',
          '}'
        ].join('\n'),
        checks: [
          'eq(style(".pane", "container-type"), "inline-size", "容器声明了 inline-size")',
          'eq(style(".wide .card", "flex-direction"), "row", "宽容器里的卡片是横排")',
          'eq(style(".narrow .card", "flex-direction"), "column", "窄容器里的卡片是竖排")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '判断该用哪种查询：**整页的排版变化**（侧栏要不要并排、字号要不要变）用媒体查询；'
          + '**单个组件在窄位置里要变身**用容器查询。同一套组件库放进不同位置还要长得对，只有容器查询做得到。'
      },
      {
        kind: 'prose',
        md: [
          '## 工具类：一条规则只做一件事',
          '',
          '工具类（utility class）指的是 `padding: 16px`、`display: flex` 这种只干一件事的小类名，'
            + '比如 `.p-4`、`.flex`、`.text-center`。',
          '',
          '它跟「语义类」（`.card`、`.article-title`）是两种组织方式，各有代价：',
          '',
          '- 语义类：类名说清「这是什么」，样式集中在一处；组件一多，命名和复用会打架',
          '- 工具类：样式就写在元素上，改版快、不会有命名冲突；代价是 HTML 变长，且**改一处影响不到别处**',
          '',
          'Tailwind 这类框架就是把工具类的名字与取值收成一套固定词表，再按用到的类生成 CSS。'
            + '这里不引框架，用几行 CSS 手写一小套，理解它到底在干什么。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '手写一小套工具类，靠组合拼出一个卡片',
        height: 240,
        html: [
          '<div class="p-16 bg-panel radius-8 flex gap-8">',
          '  <span class="w-32 h-32 bg-brand radius-8"></span>',
          '  <div>',
          '    <p class="bold m-0">工具类拼出来的卡片</p>',
          '    <p class="muted small m-0">每条类只做一件事</p>',
          '  </div>',
          '</div>'
        ].join('\n'),
        css: [
          '.p-16 { padding: 16px; }',
          '.bg-panel { background: #f6f4ec; }',
          '.bg-brand { background: #2456c8; }',
          '.radius-8 { border-radius: 8px; }',
          '.flex { display: flex; }',
          '.gap-8 { gap: 8px; }',
          '.w-32 { width: 32px; }',
          '.h-32 { height: 32px; }',
          '.bold { font-weight: 700; }',
          '.m-0 { margin: 0; }',
          '.muted { color: #6b6558; }',
          '.small { font-size: 13px; }'
        ].join('\n'),
        checks: [
          'near(px(".p-16", "padding-top"), 16, 1, "内边距类生效")',
          'near(rect(".w-32").w, 32, 1, "宽度类生效")',
          'eq(style(".bg-brand", "background-color"), "rgb(36, 86, 200)", "颜色类生效")',
          'ok(rect(".w-32").h === rect(".w-32").w, "宽高都是 32，是个正方形")'
        ]
      },
      {
        kind: 'table',
        head: ['写法', '作用'],
        rows: [
          ['`container-type: inline-size`', '把元素变成「按行内尺寸响应」的容器'],
          ['`container-name: pane`', '给容器起名，查询时可以指名道姓'],
          ['`@container (min-width: 400px)`', '按最近的那个容器算条件'],
          ['`@container pane (min-width: 400px)`', '只按名叫 `pane` 的容器算条件'],
          ['`container: pane / inline-size`', '上面两个属性的简写'],
          ['`.p-16 { padding: 16px }`', '工具类：一条规则只做一件事'],
          ['`.md\\:flex-row`', '带前缀的变体类，表示「在某个条件下才生效」'],
          ['`@layer utilities { … }`', '把工具类放进低优先级层，业务样式能直接覆盖它']
        ],
        code: true
      },
      {
        kind: 'prose',
        md: [
          '## `@layer` 把优先级排好队',
          '',
          '工具类最大的麻烦是「它跟业务样式抢优先级」。`@layer` 让这件事变成显式的：',
          '',
          '```',
          '@layer base, components, utilities;',
          '',
          '@layer utilities { .p-16 { padding: 16px; } }',
          '@layer components { .card { padding: 24px; } }',
          '```',
          '',
          '**先声明的层优先级更低**（写法是 `@layer` 后面按从低到高列出来）。'
            + '上面这样写，`.card` 里的 `padding: 24px` 能直接盖掉 `.p-16`，'
            + '不需要比较选择器的具体程度，也不用 `!important`。',
          '',
          '没被任何层包住的规则，优先级**高于所有层**（这是给已有代码留的退路）。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '低层里的工具类被组件样式盖住',
        height: 200,
        html: [
          '<div class="card p-8">这个盒子的内边距听 .card 的</div>'
        ].join('\n'),
        css: [
          '@layer base, utilities, components;',
          '',
          '@layer utilities { .p-8 { padding: 8px; } }',
          '@layer components { .card { padding: 24px; background: #f6f4ec; } }'
        ].join('\n'),
        checks: [
          'near(px(".card", "padding-top"), 24, 1, "组件层的 padding 压过了工具层")',
          'eq(style(".p-8", "padding-top"), "24px", "工具类那条规则还在，只是输了")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-1',
        title: '让卡片按容器宽度变身',
        task: [
          '这个卡片在窄面板里被挤扁了，但在宽面板里又太浪费纵向空间。',
          '',
          '要求：只改 `css` 栏，把两个 `.pane` 变成容器（`container-type: inline-size`），'
            + '让卡片在**容器宽度不小于 200px 时横排**，更窄时竖排。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="row">',
            '  <div class="pane wide"><div class="card"><span class="dot"></span>宽面板</div></div>',
            '  <div class="pane narrow"><div class="card"><span class="dot"></span>窄面板</div></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.row { display: flex; gap: 10px; align-items: flex-start; }',
            '.pane { background: #f6f4ec; padding: 8px; }',
            '.pane.wide { width: 268px; }',
            '.pane.narrow { width: 120px; }',
            '.card { display: flex; flex-direction: column; gap: 6px; background: #dbe6ff; padding: 8px; }',
            '.dot { width: 20px; height: 20px; background: #2456c8; border-radius: 50%; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="row">',
            '  <div class="pane wide"><div class="card"><span class="dot"></span>宽面板</div></div>',
            '  <div class="pane narrow"><div class="card"><span class="dot"></span>窄面板</div></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.row { display: flex; gap: 10px; align-items: flex-start; }',
            '.pane { container-type: inline-size; background: #f6f4ec; padding: 8px; }',
            '.pane.wide { width: 268px; }',
            '.pane.narrow { width: 120px; }',
            '.card { display: flex; flex-direction: column; gap: 6px; background: #dbe6ff; padding: 8px; }',
            '.dot { width: 20px; height: 20px; background: #2456c8; border-radius: 50%; }',
            '@container (min-width: 200px) {',
            '  .card { flex-direction: row; align-items: center; }',
            '}'
          ].join('\n')
        },
        tests: [
          'eq(style(".pane", "container-type"), "inline-size", "面板声明成尺寸容器")',
          'eq(style(".wide .card", "flex-direction"), "row", "宽面板里横排")',
          'eq(style(".narrow .card", "flex-direction"), "column", "窄面板里竖排")'
        ],
        hints: [
          '容器查询的条件写在 `@container` 里，格式和媒体查询一样。',
          '别用 `@media`：两个面板的视口宽度完全相同，只有容器宽度不同。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-2',
        title: '给容器起个名字再查询',
        task: [
          '页面上有两个嵌套的容器，查询条件命中了外层的那个，不是想要的那个。',
          '',
          '要求：只改 `css` 栏，给内层的 `.inner` 起名 `card-box`，并让查询**只按它**判断：'
            + '容器宽度不小于 `160px` 时文字变成白色。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="outer">',
            '  <div class="inner"><span class="label">里面的文字</span></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.outer { container-type: inline-size; container-name: outer; width: 400px; background: #f6f4ec; padding: 8px; }',
            '.inner { container-type: inline-size; width: 150px; background: #2456c8; padding: 12px; }',
            '.label { color: #232019; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="outer">',
            '  <div class="inner"><span class="label">里面的文字</span></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.outer { container-type: inline-size; container-name: outer; width: 400px; background: #f6f4ec; padding: 8px; }',
            '.inner { container-type: inline-size; container-name: card-box; width: 150px; background: #2456c8; padding: 12px; }',
            '.label { color: #232019; }',
            '@container card-box (min-width: 160px) {',
            '  .label { color: #fff; }',
            '}'
          ].join('\n')
        },
        tests: [
          'eq(style(".inner", "container-name"), "card-box", "内层容器起了名字")',
          'eq(style(".label", "color"), "rgb(35, 32, 25)", "150px 的内层容器没到 160px，文字还是深色")',
          'eq(style(".outer", "container-name"), "outer", "外层容器没被改名")'
        ],
        hints: [
          '`@container` 不带名字时看的是**最近的那个**容器，所以这里命中了 `.inner`——但题目要求显式指名。',
          '给容器加 `container-name`，查询写成 `@container 名字 (min-width: …)`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-3',
        title: '写两个工具类',
        task: [
          '这段 HTML 已经在用 `.p-12` 和 `.round-8` 两个类名了，但 CSS 里还没有它们。',
          '',
          '要求：只改 `css` 栏，补上这两条工具类：`.p-12` 给四边 `12px` 内边距，'
            + '`.round-8` 给 `8px` 圆角。一条规则只干一件事。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="box p-12 round-8">工具类拼出来的盒子</div>'
          ].join('\n'),
          css: [
            '.box { background: #dbe6ff; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="box p-12 round-8">工具类拼出来的盒子</div>'
          ].join('\n'),
          css: [
            '.box { background: #dbe6ff; }',
            '.p-12 { padding: 12px; }',
            '.round-8 { border-radius: 8px; }'
          ].join('\n')
        },
        tests: [
          'near(px(".p-12", "padding-top"), 12, 1, "内边距 12px")',
          'near(px(".p-12", "padding-left"), 12, 1, "左边也是 12px")',
          'eq(px(".round-8", "border-top-left-radius"), 8, "圆角 8px")'
        ],
        hints: [
          '类名里的数字就是值，这是工具类的命名习惯（`p-12` = padding 12px）。',
          '工具类不写复合属性以外的别的东西，保持「一条只干一件事」。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-4',
        title: '用 @layer 让业务样式压过工具类',
        task: [
          '工具类 `.p-8` 把 `.panel` 想要的内边距盖住了。',
          '',
          '要求：只改 `css` 栏，用 `@layer` 让 `.panel` 的 `padding: 24px` 生效，'
            + '同时**不加 `!important`、不改选择器写法、不删掉 `.p-8`**。'
        ].join('\n'),
        starter: {
          html: '<div class="panel p-8">面板</div>',
          css: [
            '.panel { padding: 24px; }',
            '.p-8 { padding: 8px; background: #dbe6ff; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="panel p-8">面板</div>',
          css: [
            '@layer utilities, components;',
            '@layer utilities { .p-8 { padding: 8px; background: #dbe6ff; } }',
            '@layer components { .panel { padding: 24px; } }'
          ].join('\n')
        },
        tests: [
          'near(px(".panel", "padding-top"), 24, 1, "面板的内边距是 24px")',
          'eq(style(".panel", "background-color"), "rgb(219, 230, 255)", "工具类里的背景色还在生效")',
          'eq(style(".panel", "border-top-style"), "none", "没有引入边框")'
        ],
        hints: [
          '把两条规则分别包进 `@layer` 块里，注意**先声明的层优先级更低**。',
          '要压过工具类的那一条放后面的层（`components`），工具类放前面的层。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-5',
        title: '按容器宽度而不是视口宽度切换布局',
        task: [
          '这个卡片在视口宽的时候明明该横排，但现在它在窄的侧栏里横排着，很挤。',
          '',
          '要求：只改 `css` 栏，用**容器查询**让 `.item` 在**容器宽度不小于 `220px`** 时横排、'
            + '更窄时竖排。视口宽度在两种情况下是一样的，所以媒体查询解决不了。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="layout">',
            '  <div class="side"><div class="item"><span class="pic"></span><span>侧栏里的条目</span></div></div>',
            '  <div class="maincol"><div class="item"><span class="pic"></span><span>主栏里的条目</span></div></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.layout { display: flex; gap: 12px; }',
            '.side { width: 140px; }',
            '.maincol { flex: 1; }',
            '.item { display: flex; flex-direction: column; gap: 6px; background: #dbe6ff; padding: 8px; }',
            '.pic { width: 24px; height: 24px; background: #2456c8; border-radius: 4px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="layout">',
            '  <div class="side"><div class="item"><span class="pic"></span><span>侧栏里的条目</span></div></div>',
            '  <div class="maincol"><div class="item"><span class="pic"></span><span>主栏里的条目</span></div></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.layout { display: flex; gap: 12px; }',
            '.side { container-type: inline-size; width: 140px; }',
            '.maincol { container-type: inline-size; flex: 1; }',
            '.item { display: flex; flex-direction: column; gap: 6px; background: #dbe6ff; padding: 8px; }',
            '.pic { width: 24px; height: 24px; background: #2456c8; border-radius: 4px; }',
            '@container (min-width: 220px) {',
            '  .item { flex-direction: row; align-items: center; }',
            '}'
          ].join('\n')
        },
        tests: [
          'eq(style(".maincol .item", "flex-direction"), "row", "主栏里的条目横排")',
          'eq(style(".side .item", "flex-direction"), "column", "侧栏里的条目竖排")',
          'eq(style(".side", "container-type"), "inline-size", "两栏都成了尺寸容器")'
        ],
        hints: [
          '两个 `.item` 在同一个视口里，只有容器宽度不同——正是容器查询的用武之地。',
          '容器声明要写在 `.side` / `.maincol` 上，查询写在 `@container` 里。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
