/* ch02 — 间距与尺寸 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch02',
    title: '第 2 章 · 间距与尺寸',
    goal: '用同一套刻度排出疏密一致的间距，并按需给出宽高；知道 `m-` 与 `p-` 差在哪、`w-full` 和 `w-1/2` 怎么选。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 间距只有一条刻度',
          '',
          '原生 CSS 里 `padding` 与 `margin` 可以写任意值，`7px`、`13px`、`1.3em` 都行——'
            + '这也是排版不整齐的来源。Tailwind 把它们收进一条刻度，每个编号对应一个像素值：',
          '',
          '```',
          '0  1   2   3   4   5    6    8    10    12    16',
          '0  4px 8px 12px 16px 20px 24px 32px 40px 48px 64px',
          '```',
          '',
          '你要做的就是在这条刻度上挑，而不是随手写数字。两个元素都用 `4`，它们之间的呼吸感自然一致。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一刻度：p-4 的盒子与 mt-4 的上间距',
        height: 190,
        html: [
          '<div class="a p-4">内边距 p-4（16px）</div>',
          '<div class="b mt-4 p-4">我上面有 mt-4（16px）</div>'
        ].join('\n'),
        css: [
          '.a, .b { background: #eaf0ff; font-size: 13px; }'
        ].join('\n'),
        checks: [
          'eq(px(".a", "padding-top"), 16, "p-4 = 16px")',
          'eq(px(".b", "margin-top"), 16, "mt-4 = 16px")',
          'eq(px(".b", "padding-left"), 16, "两个盒子内边距一致")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## margin 在外，padding 在内',
          '',
          '这个区别在纯 CSS 里讲过，工具类只是换了写法：',
          '',
          '- `p-*` / `padding`：盒子里面的留白，背景色会铺到这个范围',
          '- `m-*` / `margin`：盒子外面的空隙，背景色铺不到',
          '',
          '还有一个现实差别：**相邻元素的上下 margin 会合并**，取大的那个，`padding` 不会。'
            + '所以控制「一层与下一层之间的距离」，用 `space-y-*` 或父容器 `gap` 通常比逐个写 `mt-` 稳。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['类名', '作用的范围', '换成 CSS'],
        rows: [
          ['`p-4`', '四周内边距', '`padding: 16px`'],
          ['`px-6`', '左右内边距', '`padding-inline: 24px`'],
          ['`mt-2`', '上外边距', '`margin-top: 8px`'],
          ['`mx-auto`', '左右自动（水平居中）', '`margin-inline: auto`'],
          ['`gap-4`', 'flex / grid 子项之间', '`gap: 16px`'],
          ['`space-y-2`', '纵向相邻子项之间', '子项加 `margin-top`（首项除外）']
        ],
        code: true
      },
      {
        kind: 'prose',
        md: [
          '## 宽高：先想「相对谁」',
          '',
          '- `w-full`：占满**父元素**的宽度（`width: 100%`）',
          '- `w-1/2`：父元素的一半，`w-1/3`、`w-2/3` 同理',
          '- `w-64`：写死 `256px`（固定值，编号乘 4）',
          '- `max-w-md`：最宽 `448px`，但允许更窄——它常和 `w-full` 一起用，得到「最多这么宽」的卡片',
          '',
          '高度同理：`h-10`（40px）、`h-full`、`min-h-screen`（至少一屏高）。'
            + '多数布局里给宽、少给高，高度交给内容撑开，这样文字换行也不会溢出。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex02-1',
        title: '把两块内容拉开距离',
        task: [
          '两段文字挤在一起，需要上下有点间距。',
          '',
          '要求：只改 `html` 栏，给第二个 `.row` 加上 `mt-4`（上外边距 16px）。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="row">第一行</div>',
            '<div class="row">第二行</div>'
          ].join('\n'),
          css: [
            '.row { padding: 8px; background: #f6f4ec; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="row">第一行</div>',
            '<div class="row mt-4">第二行</div>'
          ].join('\n')
        },
        tests: [
          'eq(px(".row:nth-child(2)", "margin-top"), 16, "第二行上外边距 16px")',
          'eq(px(".row:nth-child(1)", "margin-top"), 0, "第一行不动")'
        ],
        hints: [
          '只加 `mt-4` 就够，别给第一个也加，否则顶部会多出一段空白。',
          '`:nth-child(2)` 是按顺序取第二个 `.row`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-2',
        title: '让卡片居中且最宽不超过 448px',
        task: [
          '一张卡片想让它在页面上居中，同时窗再宽也不要超过 448px。',
          '',
          '要求：只改 `html` 栏，给 `.card` 加 `w-full`、`max-w-md`、`mx-auto`。'
        ].join('\n'),
        starter: {
          html: '<div class="card p-4">一张居中的卡片</div>',
          css: [
            '.card { background: #eaf0ff; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="card p-4 w-full max-w-md mx-auto">一张居中的卡片</div>'
        },
        tests: [
          'eq(px(".card", "max-width"), 448, "最宽 448px")',
          'eq(style(".card", "margin-left"), style(".card", "margin-right"), "左右自动边距相等即居中")',
          'ok(px(".card", "width") <= 448, "内容撑不出界限")'
        ],
        hints: [
          '`mx-auto` 靠左右 `auto` 边距居中，前提是元素知道自己有多宽——所以先有 `w-full` 或固定宽。',
          '`max-w-md` 只封顶，不写死；窄窗口下卡片会跟着变窄。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-3',
        title: '用 gap 排一行等宽的块',
        task: [
          '三个块用 flex 排一行，现在没有缝隙，最后一块越界。',
          '',
          '要求：只改 `html` 栏，给 `.row` 加 `flex` 和 `gap-4`，并给每个 `.cell` 加 `flex-1`'
            + '（三个平分剩余宽度）。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="row">',
            '  <div class="cell">甲</div>',
            '  <div class="cell">乙</div>',
            '  <div class="cell">丙</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.cell { padding: 8px; background: #eaf0ff; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="row flex gap-4">',
            '  <div class="cell flex-1">甲</div>',
            '  <div class="cell flex-1">乙</div>',
            '  <div class="cell flex-1">丙</div>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'eq(style(".row", "display"), "flex", "容器变成 flex")',
          'eq(px(".row", "gap"), 16, "子项之间有 16px 缝隙")',
          'ok(Math.abs(rect(".cell").w - rect(".cell:nth-child(2)").w) <= 2, "三块宽度相等")'
        ],
        hints: [
          '`gap` 写在**容器**上，不是在子项上写 `mr-`。',
          '`flex-1` 让每个子项平分剩余空间（`flex: 1 1 0%`），避免内容多的那块挤掉别的。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-4',
        title: '给占位块设一个固定宽高',
        task: [
          '一个图片占位块要 200×120，用来撑住位置，避免内容加载后跳动。',
          '',
          '要求：只改 `html` 栏，给 `.ph` 加 `w-52`（208px）、`h-28`（112px）、`rounded-lg`。'
        ].join('\n'),
        starter: {
          html: '<div class="ph"></div>',
          css: [
            '.ph { background: #d8d3c4; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="ph w-52 h-28 rounded-lg"></div>'
        },
        tests: [
          'eq(px(".ph", "width"), 208, "宽 208px")',
          'eq(px(".ph", "height"), 112, "高 112px")',
          'eq(px(".ph", "border-top-left-radius"), 8, "圆角")'
        ],
        hints: [
          '固定宽高的编号乘 4：`w-52` = 52×4 = 208px，`h-28` = 28×4 = 112px。',
          '真要锁住比例、不随窗口变形，后面章节会讲容器查询，这里先用固定值。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
