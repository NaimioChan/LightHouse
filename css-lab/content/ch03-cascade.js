/* ch03 — 层叠、优先级与继承 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch03',
    title: '第 3 章 · 层叠、优先级与继承',
    goal: '两条规则抢同一个属性时，能当场算出谁赢；分清「没继承」和「被覆盖」，不再靠 !important 救火。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 谁说了算：层叠的三条顺序',
          '',
          '同一个属性被多条规则写到时，浏览器按这个顺序挑：',
          '',
          '1. **重要声明**优先：带 `!important` 的排在最前面',
          '2. **优先级**（specificity）：数字大的赢',
          '3. **顺序**：优先级一样时，**写在后面的赢**',
          '',
          '优先级用三位数记：`id 的数量 · class/属性/伪类的数量 · 标签/伪元素的数量`。',
          '',
          '- `p` → `0 0 1`',
          '- `.card` → `0 1 0`',
          '- `.card p` → `0 1 1`',
          '- `#main .card p` → `1 1 1`',
          '',
          '比较时从左往右比，第一位大的直接赢——`0 1 0` 永远压得住 `0 0 99`。',
          '`*`、`>`、`+`、`~`、空格这些连接符不算分。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '标签、类、id 三种选择器，谁赢',
        height: 210,
        html: [
          '<p class="text" id="lead">三重身份的一个段落</p>'
        ].join('\n'),
        css: [
          'p { color: #8a6b2f; }',
          '.text { color: #1f8a4c; }',
          '#lead { color: #2456c8; }'
        ].join('\n'),
        checks: [
          'eq(style("#lead", "color"), "rgb(36, 86, 200)", "id 那位赢（0 1 0 也压不过 1 0 0）")',
          'eq(px("#lead", "font-size"), 14, 2, "没被覆盖的属性照常有值")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 优先级一样时，看谁写在后面',
          '',
          '两条 `.card` 都写 `color`，谁在后面谁生效。这也是「我在 DevTools 里改了没用」的常见原因：',
          '你改的那条在文件上半截，下面还有一条同优先级的又把它盖了。',
          '',
          '把顺序规则和优先级规则放在一起记：**先比重要声明，再比优先级，最后比顺序**。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同优先级，后面的赢',
        height: 170,
        html: '<p class="t">两段一样的样式，只有顺序不同</p>',
        css: [
          '.t { color: #2456c8; }',
          '.t { color: #c2456b; }'
        ].join('\n'),
        checks: [
          'eq(style(".t", "color"), "rgb(194, 69, 107)", "后面那条生效")',
          'ok(style(".t", "color") !== "rgb(36, 86, 200)", "前面那条确实被盖住了")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 继承：哪些属性会自己往下传',
          '',
          '给父元素写的**文字类**属性，子元素会继承：`color`、`font-family`、`font-size`、`line-height`、'
            + '`letter-spacing`、`text-align`、`visibility`、`cursor`。',
          '',
          '**盒模型类**属性不继承：`margin`、`padding`、`border`、`background`、`width`、`height`、`display`。',
          '这条划分很好记——影响「文字怎么显示」的继承，影响「盒子怎么摆」的不继承。',
          '',
          '想强制继承一个本来不继承的属性，值写 `inherit`：`border: inherit`、`padding: inherit`。',
          '（`* { border: inherit }` 会让整棵树都长出边框，是经典翻车写法。）'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '文字属性继承，盒模型属性不继承',
        height: 230,
        html: [
          '<div class="parent">',
          '  父元素：color 与 font-size 会传下去，border 与 padding 不会',
          '  <span class="kid">子元素</span>',
          '</div>'
        ].join('\n'),
        css: [
          '.parent { color: #2456c8; font-size: 18px; border: 2px solid #2a6; padding: 14px; background: #f7f7f2; }',
          '.kid { background: #dfd; }'
        ].join('\n'),
        checks: [
          'eq(style(".kid", "color"), "rgb(36, 86, 200)", "颜色继承下来了")',
          'eq(px(".kid", "font-size"), 18, 1, "字号继承下来了")',
          'eq(style(".kid", "border-top-style"), "none", "边框没有继承")',
          'eq(px(".kid", "padding-top"), 0, 1, "内边距没有继承")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '「我的字号没生效」有两种：**被覆盖**（优先级/顺序输了）和**没继承**（写了不可继承的属性）。'
          + 'DevTools 里被划掉的声明是前者，压根不出现的属性是后者。'
      },
      {
        kind: 'prose',
        md: [
          '## `!important` 是最后手段',
          '',
          '`!important` 直接跳过优先级比较，所以第一次用它能解决眼前的问题，之后所有人想覆盖它都得跟着写 `!important`，'
          + '最后整个项目的样式表变成一团 `!important`。',
          '',
          '真正需要它的场合很少：覆盖第三方组件的行内样式、写打印样式表、做可见性工具类。',
          '自己的样式里遇到「压不过」，答案通常是**把选择器写具体一点**。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['写法', '优先级', '说明'],
        rows: [
          ['`*`', '0 0 0', '通配符不算分，所以特别容易被任何规则覆盖'],
          ['`li`', '0 0 1', '纯标签，最低一档'],
          ['`.card`', '0 1 0', '类，最常用的一档'],
          ['`.card li`', '0 1 1', '类 + 标签'],
          ['`.a.b`', '0 2 0', '同一个元素上的两个类会累加'],
          ['`#main`', '1 0 0', 'id 一位就压倒所有类和标签'],
          ['`#main .card li`', '1 1 1', 'id + 类 + 标签'],
          ['`style="…"`', '更高', '行内样式压过所有选择器'],
          ['`… !important`', '最高', '只输给用户样式表里的 `!important`']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex03-1',
        title: '不用 !important，把颜色抢回来',
        task: [
          '标题在卡片里，卡片那条规则比 `.title` 更具体，把颜色压住了。',
          '',
          '要求：只改 `css` 栏，让 `.title` 显示成 `#2456c8`，正文那行仍是 `#232019`；'
            + '**不许用 `!important`**，也不许删掉 `.card p` 那条规则。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="card">',
            '  <p class="title">标题应该显示成蓝色</p>',
            '  <p class="body">正文保持原来的深色</p>',
            '</div>'
          ].join('\n'),
          css: [
            '.card p { color: #232019; }',
            '.title { color: #2456c8; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="card">',
            '  <p class="title">标题应该显示成蓝色</p>',
            '  <p class="body">正文保持原来的深色</p>',
            '</div>'
          ].join('\n'),
          css: [
            '.card p { color: #232019; }',
            '.card .title { color: #2456c8; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".title", "color"), "rgb(36, 86, 200)", "标题的颜色")',
          'eq(style(".body", "color"), "rgb(35, 32, 25)", "正文还是深色")',
          'count(".card p", 2, "两个段落都还在")'
        ],
        hints: [
          '`.card p` 是 `0 1 1`（一个类 + 一个标签），`.title` 只有 `0 1 0`，所以前者赢。',
          '让 `.title` 那条也带上卡片这一层：`.card .title` 就是 `0 2 0`，反超了。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-2',
        title: '把写在后面的覆盖规则插回去',
        task: [
          '两条同优先级的规则抢同一个属性，但顺序反了。',
          '',
          '要求：只改 `css` 栏，让按钮背景是 `#2456c8`，两条规则都保留、都不加 `!important`。'
        ].join('\n'),
        starter: {
          html: '<button class="btn">提交</button>',
          css: [
            '.btn { background: #2456c8; padding: 8px 16px; border: 0; color: #fff; }',
            '.btn { background: #e0dbcc; }'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn">提交</button>',
          css: [
            '.btn { background: #e0dbcc; }',
            '.btn { background: #2456c8; padding: 8px 16px; border: 0; color: #fff; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".btn", "background-color"), "rgb(36, 86, 200)", "按钮背景")',
          'eq(px(".btn", "padding-top"), 8, 1, "内边距还在")',
          'count(".btn", 1, "按钮还在")'
        ],
        hints: [
          '优先级一样时，写在后面的赢。',
          '把那条你想要的规则挪到下面，或者把下面那条挪上去。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-3',
        title: '把 !important 换掉',
        task: [
          '这条 `!important` 的本意只是让**卡片里**的徽标变白，却把卡片外那个也一起刷白了——'
            + '白字落在象牙白底上，等于看不见。',
          '',
          '要求：只改 `css` 栏，卡片里的徽标是 `#fff`，卡片外的那个回到 `#232019`；'
            + '**代码里不能再出现 `!important`**。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="card"><span class="badge">新</span></div>',
            '<span class="badge">普通</span>'
          ].join('\n'),
          css: [
            '.card .badge { background: #e0dbcc; padding: 2px 6px; color: #232019; }',
            '.badge { color: #fff !important; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="card"><span class="badge">新</span></div>',
            '<span class="badge">普通</span>'
          ].join('\n'),
          css: [
            '.card .badge { background: #e0dbcc; padding: 2px 6px; color: #232019; }',
            '.card .badge { color: #fff; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".card .badge", "color"), "rgb(255, 255, 255)", "卡片里的徽标是白的")',
          'eq(style("body > .badge", "color"), "rgb(35, 32, 25)", "卡片外的徽标保持深色")',
          'near(px(".card .badge", "padding-top"), 2, 1, "第一条规则的其他声明没被破坏")'
        ],
        hints: [
          '`!important` 跳过优先级比较，所以它**对页面里所有 `.badge` 生效**，不管在不在卡片里。',
          '把范围收回来：第二条也写成 `.card .badge`，优先级与第一条打平，写在后面的那条赢。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-4',
        title: '让按钮里的文字跟外面一个色',
        task: [
          '父容器设了文字颜色和字号，但按钮没跟上——浏览器给 `button` 的默认样式会打断继承。',
          '',
          '要求：只改 `css` 栏，用 `inherit` 让按钮的 `color`、`font-size`、`font-family` 都跟着父容器。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="panel">',
            '  面板里的说明文字。',
            '  <button class="pill">按钮</button>',
            '</div>'
          ].join('\n'),
          css: [
            '.panel { color: #2456c8; font-size: 18px; font-family: Georgia, serif; padding: 12px; background: #f6f4ec; }',
            '.pill { padding: 4px 10px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="panel">',
            '  面板里的说明文字。',
            '  <button class="pill">按钮</button>',
            '</div>'
          ].join('\n'),
          css: [
            '.panel { color: #2456c8; font-size: 18px; font-family: Georgia, serif; padding: 12px; background: #f6f4ec; }',
            '.pill { color: inherit; font-size: inherit; font-family: inherit; padding: 4px 10px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".pill", "color"), "rgb(36, 86, 200)", "按钮文字颜色跟父容器一致")',
          'eq(px(".pill", "font-size"), 18, 1, "按钮字号跟父容器一致")',
          'eq(style(".pill", "font-family"), style(".panel", "font-family"), "字体跟父容器一致")'
        ],
        hints: [
          '`color` 和 `font-size` 本来会继承，是 `button` 的浏览器默认样式把它们挡掉了。',
          '值写 `inherit` 就是强制「跟父元素一样」，三个属性各写一次。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-5',
        title: '用 :root 变量统一换色',
        task: [
          '两个组件各自写死了颜色，现在要一起换成同一个品牌色。',
          '',
          '要求：只改 `css` 栏，在 `:root` 上定义一个变量 `--brand`，值为 `#2456c8`，'
            + '并让 `.tag` 与 `.link` 都通过 `var(--brand)` 取色。'
        ].join('\n'),
        starter: {
          html: [
            '<span class="tag">标签</span>',
            '<a class="link" href="#end">链接</a>'
          ].join('\n'),
          css: [
            '.tag { color: #232019; background: #e0dbcc; padding: 2px 8px; border-radius: 4px; }',
            '.link { color: #232019; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<span class="tag">标签</span>',
            '<a class="link" href="#end">链接</a>'
          ].join('\n'),
          css: [
            ':root { --brand: #2456c8; }',
            '.tag { color: var(--brand); background: #e0dbcc; padding: 2px 8px; border-radius: 4px; }',
            '.link { color: var(--brand); }'
          ].join('\n')
        },
        tests: [
          'eq(style(":root", "--brand"), "#2456c8", "变量定义在 :root 上")',
          'eq(style(".tag", "color"), "rgb(36, 86, 200)", "标签取到了变量")',
          'eq(style(".link", "color"), "rgb(36, 86, 200)", "链接取到了变量")'
        ],
        hints: [
          '自定义属性必须写在某个选择器里，`:root` 就是整个文档的根。',
          '取用写 `var(--brand)`；变量本身继承，所以子元素不用重复定义。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
