/* ch01 — 工具类：一个类名做一件事 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 工具类：一个类名做一件事',
    goal: '看懂 `p-4`、`text-center` 这类类名的构成，能照着词表拼出想要的样子，不再为「这段样式该叫什么名字」纠结。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 从「给样式起名」到「直接描述样式」',
          '',
          '传统 CSS 的写法是先起一个类名，再在样式表里写这个类名长什么样：',
          '',
          '```',
          '.card { padding: 16px; border-radius: 8px; background: #fff; }',
          '```',
          '',
          'Tailwind 反过来：**类名本身就是样式**，`padding: 16px` 直接写成 `p-4`。',
          '',
          '```',
          '<div class="p-4 rounded-lg bg-white">卡片</div>',
          '```',
          '',
          '好处是不用给每段样式想名字，也不会出现「改了 `.card` 结果别处也变了」；代价是类名会很长。'
            + '本章先把这套命名看明白，后面几章再讲长类名怎么管。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 类名由「属性 + 取值」拼成',
          '',
          '工具类不是一个固定清单，而是几条**命名规则**组合出来的：',
          '',
          '- 前缀说明改哪个属性：`p`（padding）、`m`（margin）、`text`、`bg`、`w`（width）',
          '- 后缀是取值：`-4`、`-center`、`-red-500`',
          '',
          '`p-4` 拆开是「padding」+「4 号间距」，`mt-2` 是「margin-top」+「2 号间距」，'
            + '`text-center` 是「文本」+「居中」。属性简写都是英文单词的首字母或缩写，看几次就熟了。',
          '',
          '取值不是随便写的数字：`4` 对应 `16px`，间隔取值都落在一条固定的刻度上，所以两处用了 `4` 就是对齐的。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一个盒子，三种写法都在，右边按浏览器算出来的值看结果',
        height: 190,
        html: [
          '<div class="box p-4 bg-blue-100 text-center rounded-lg">p-4 · 居中 · 圆角</div>',
          '<div class="box p-2 mt-2 bg-blue-50">p-2 · mt-2</div>'
        ].join('\n'),
        css: [
          '.box { font-size: 13px; }'
        ].join('\n'),
        checks: [
          'eq(px(".p-4", "padding-top"), 16, "p-4 就是 16px 内边距")',
          'eq(style(".text-center", "text-align"), "center", "text-center 让文字居中")',
          'ok(style(".bg-blue-100", "background-color").length > 0, "背景色能被计算出来")',
          'eq(px(".mt-2", "margin-top"), 8, "mt-2 是 8px")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '间距的编号是**固定刻度**，不是像素：`1`=4px、`2`=8px、`3`=12px、`4`=16px、`6`=24px、`8`=32px。'
          + '全站都用同一套刻度，是它看起来「自带设计感」的原因。'
      },
      {
        kind: 'table',
        head: ['类名', '等于的 CSS', '备注'],
        rows: [
          ['`p-4`', '`padding: 16px`', '四周内边距'],
          ['`px-4`', '`padding-left/right: 16px`', '`x` = 水平方向'],
          ['`py-2`', '`padding-top/bottom: 8px`', '`y` = 垂直方向'],
          ['`mt-2`', '`margin-top: 8px`', '`m` 系列同理'],
          ['`text-center`', '`text-align: center`', '文本类前缀'],
          ['`rounded-lg`', '`border-radius: 8px`', '圆角大小是名字，不是像素'],
          ['`bg-blue-100`', '`background-color` 一档浅蓝', '颜色是色相 + 深浅'],
          ['`font-bold`', '`font-weight: 700`', ''],
          ['`flex` / `grid`', '`display: flex` / `grid`', '一个字就是一个显示方式']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex01-1',
        title: '给卡片加上内边距和圆角',
        task: [
          '一张卡片贴着边框，太挤了。',
          '',
          '要求：只改 `html` 栏，给 `.card` 加上 `p-4`（四周 16px 内边距）和 `rounded-lg`（8px 圆角）。'
            + '已有的 `card` 类留着。'
        ].join('\n'),
        starter: {
          html: '<div class="card">一张卡片</div>',
          css: [
            '.card { background: #f6f4ec; border: 1px solid #e0dbcc; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="card p-4 rounded-lg">一张卡片</div>'
        },
        tests: [
          'eq(px(".card", "padding-top"), 16, "四周内边距 16px")',
          'eq(px(".card", "border-top-left-radius"), 8, "圆角 8px")',
          'eq(px(".card", "padding-left"), 16, "左右也一起加上（p- 管四周）")'
        ],
        hints: [
          '`p-4` 同时管上下左右，只改一个方向才用 `pt-` / `px-` 这种。',
          '`rounded-lg` 是一个整体，不能拆成 `rounded-4`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-2',
        title: '让标题居中、副标题变小',
        task: [
          '一个标题和一段副标题都左对齐、字号一样。',
          '',
          '要求：只改 `html` 栏，给 `h1` 加 `text-center`，给 `.sub` 加 `text-sm`（更小一档字号）。'
        ].join('\n'),
        starter: {
          html: [
            '<h1>报名表</h1>',
            '<p class="sub">请填好下面的信息。</p>'
          ].join('\n'),
          css: [
            'body { font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<h1 class="text-center">报名表</h1>',
            '<p class="sub text-sm">请填好下面的信息。</p>'
          ].join('\n')
        },
        tests: [
          'eq(style("h1", "text-align"), "center", "标题居中")',
          'eq(px(".sub", "font-size"), 14, "副标题是 text-sm（14px）")',
          'ok(px("h1", "font-size") > px(".sub", "font-size"), "副标题比标题小")'
        ],
        hints: [
          '`text-center` 管对齐，`text-sm` 管字号，前缀一样但后缀决定改什么。',
          '`text-sm` 在上述基础样式（14px）下算出来是 14px。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-3',
        title: '用方向前缀分别调上下和左右',
        task: [
          '一个盒子四周边距一样，现在想让上下更小、左右更大。',
          '',
          '要求：只改 `html` 栏，把 `.panel` 的 `p-4` 换成 `py-2`（上下 8px）加 `px-6`（左右 24px）。'
        ].join('\n'),
        starter: {
          html: '<div class="panel p-4">左右要比上下宽</div>',
          css: [
            '.panel { background: #eef; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="panel py-2 px-6">左右要比上下宽</div>'
        },
        tests: [
          'eq(px(".panel", "padding-top"), 8, "上下 8px")',
          'eq(px(".panel", "padding-left"), 24, "左右 24px")',
          'ok(px(".panel", "padding-left") > px(".panel", "padding-top"), "左右确实比上下大")'
        ],
        hints: [
          '`x` 是水平（左右），`y` 是垂直（上下），方向想清楚再写。',
          '`p-4` 和 `py-2 px-6` 不要同时留着，后者会盖住前者，读起来也乱。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-4',
        title: '把一句提示做成印章样式',
        task: [
          '把提示文字做成一个小圆角标签：浅黄底、深色字、上下内边距小、左右大一点。',
          '',
          '要求：只改 `html` 栏，给 `.tag` 加 `bg-yellow-100`、`py-1`、`px-3`、`rounded`，'
            + '并加 `inline-block`（否则它只是一行文字，内边距撑不开）。'
        ].join('\n'),
        starter: {
          html: '<span class="tag">草稿</span>',
          css: [
            'body { font-size: 13px; }',
            '.tag { color: #7c5e10; }'
          ].join('\n')
        },
        solution: {
          html: '<span class="tag inline-block bg-yellow-100 py-1 px-3 rounded">草稿</span>'
        },
        tests: [
          'eq(style(".tag", "display"), "inline-block", "inline-block 才撑得开内边距")',
          'eq(px(".tag", "padding-left"), 12, "左右 12px")',
          'eq(px(".tag", "padding-top"), 4, "上下 4px")',
          'ok(style(".tag", "background-color").indexOf("oklch") === 0 || style(".tag", "background-color").indexOf("rgb") === 0, "有色背景")'
        ],
        hints: [
          '`span` 默认是行内元素，内边距在上下方向会被行高吃掉，加 `inline-block` 变成行内块。',
          '`px-3` 是 12px，`py-1` 是 4px，编号乘 4 是像素值。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
