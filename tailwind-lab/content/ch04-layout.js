/* ch04 — 布局：flex 与 grid 的工具类 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch04',
    title: '第 4 章 · 布局：flex 与 grid',
    goal: '用 `flex` / `grid` 工具类排出一行或一格一格的布局，会用对齐类把子项摆到想要的位置，不再靠手写像素偏移。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## flex：一行里的对齐',
          '',
          '`display: flex` 在 Tailwind 里就是一个 `flex`。打开之后，配三组类控制子项：',
          '',
          '- 主轴方向：`flex-row`（默认）/ `flex-col` / `flex-wrap`',
          '- 主轴对齐：`justify-start` / `justify-center` / `justify-between` / `justify-around`',
          '- 交叉轴对齐：`items-start` / `items-center` / `items-end` / `items-stretch`',
          '',
          '这跟第 5 章（CSS 训练场）讲的 flexbox 是同一套模型，只是换成了类名。'
            + '「水平居中」这件事现在写 `flex items-center justify-center`，不用再 `margin: auto` 兜。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一行，两端对齐 + 垂直居中',
        height: 180,
        html: [
          '<div class="bar flex items-center justify-between">',
          '  <span>左边</span>',
          '  <span>右边</span>',
          '</div>'
        ].join('\n'),
        css: [
          '.bar { height: 60px; padding: 0 12px; background: #eaf0ff; font-size: 13px; }'
        ].join('\n'),
        checks: [
          'eq(style(".bar", "display"), "flex", "容器是 flex")',
          'eq(style(".bar", "justify-content"), "space-between", "子项两端对齐")',
          'eq(style(".bar", "align-items"), "center", "子项垂直居中")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## grid：一格一格地排',
          '',
          '`grid` 打开网格，再用 `grid-cols-N` 分列：`grid-cols-2` 两列、`grid-cols-3` 三列、'
            + '`grid-cols-12` 十二列（做精细排版时用）。',
          '',
          '间距统一用 `gap-*`。要做出「窄屏幕一列、宽屏幕多列」的卡片墙，靠的是下一章讲的响应式前缀，'
            + '比如 `grid-cols-1 md:grid-cols-3`。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['类名', '等于的 CSS', '用途'],
        rows: [
          ['`flex`', '`display: flex`', '把子项排成一行'],
          ['`flex-col`', '`flex-direction: column`', '把子项排成一列'],
          ['`items-center`', '`align-items: center`', '交叉轴居中'],
          ['`justify-between`', '`justify-content: space-between`', '两端顶住、中间拉开'],
          ['`grid`', '`display: grid`', '网格布局'],
          ['`grid-cols-3`', '`grid-template-columns: repeat(3, …)`', '三等分'],
          ['`col-span-2`', '`grid-column: span 2`', '一个子项跨两列'],
          ['`gap-4`', '`gap: 16px`', '行列间距']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex04-1',
        title: '把页头做成两端对齐的一行',
        task: [
          '页头里的图标和文字现在上下堆着，想让它们同一行、分别靠两端。',
          '',
          '要求：只改 `html` 栏，给 `.head` 加 `flex` 和 `justify-between`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="head">',
            '  <span>Logo</span>',
            '  <span>登录</span>',
            '</div>'
          ].join('\n'),
          css: [
            '.head { padding: 10px 12px; background: #eaf0ff; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="head flex justify-between">',
            '  <span>Logo</span>',
            '  <span>登录</span>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'eq(style(".head", "display"), "flex", "容器变 flex")',
          'eq(style(".head", "justify-content"), "space-between", "两端对齐")',
          'ok(rect("span").x < rect("span:nth-child(2)").x, "两个 span 左右分开")'
        ],
        hints: [
          '`justify-between` 把首尾分别顶到两端，中间的空隙自动分配。',
          '只写 `flex` 的话子项会挨在左边，还要加上对齐类。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-2',
        title: '让卡片里的内容垂直居中',
        task: [
          '一个高度固定的横幅，里面的文字顶在上面。',
          '',
          '要求：只改 `html` 栏，给 `.banner` 加 `flex` 和 `items-center`，让内容在竖直方向居中。'
        ].join('\n'),
        starter: {
          html: '<div class="banner"><span>横幅文字</span></div>',
          css: [
            '.banner { height: 80px; padding: 0 12px; background: #fde68a; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="banner flex items-center"><span>横幅文字</span></div>'
        },
        tests: [
          'eq(style(".banner", "display"), "flex", "容器是 flex")',
          'eq(style(".banner", "align-items"), "center", "交叉轴居中")',
          'ok(Math.abs((rect("span").y + rect("span").h / 2) - (rect(".banner").y + rect(".banner").h / 2)) <= 3, "文字竖直方向在横幅中间")'
        ],
        hints: [
          'flex 行方向下，交叉轴是竖直方向，所以用 `items-center` 做垂直居中。',
          '`justify-center` 管的是水平方向，别混了。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-3',
        title: '做一个三列的等宽网格',
        task: [
          '六个小方块，想让它们排成三列、每列等宽，中间留缝。',
          '',
          '要求：只改 `html` 栏，给 `.grid` 加 `grid`、`grid-cols-3`、`gap-2`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="grid">',
            '  <div class="cell">1</div><div class="cell">2</div><div class="cell">3</div>',
            '  <div class="cell">4</div><div class="cell">5</div><div class="cell">6</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.cell { padding: 10px; background: #eaf0ff; font-size: 13px; text-align: center; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="grid grid-cols-3 gap-2">',
            '  <div class="cell">1</div><div class="cell">2</div><div class="cell">3</div>',
            '  <div class="cell">4</div><div class="cell">5</div><div class="cell">6</div>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'eq(style(".grid", "display"), "grid", "容器是 grid")',
          'eq(tracks(".grid").length, 3, "正好三列")',
          'ok(rect(".cell:nth-child(1)").y === rect(".cell:nth-child(2)").y, "前三个在同一行")'
        ],
        hints: [
          '`grid-cols-3` 让子项按三列自动换行，不用自己算宽度。',
          '`gap-2` 同时管行列间距，八个方向的空隙一次搞定。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-4',
        title: '让其中一格横跨两列',
        task: [
          '三列网格里，第一项想独占两列的宽度，后面几项照常一格。',
          '',
          '要求：只改 `html` 栏，给第一个 `.cell` 加 `col-span-2`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="grid grid-cols-3 gap-2">',
            '  <div class="cell">宽的那格</div>',
            '  <div class="cell">B</div><div class="cell">C</div><div class="cell">D</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.cell { padding: 10px; background: #eaf0ff; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="grid grid-cols-3 gap-2">',
            '  <div class="cell col-span-2">宽的那格</div>',
            '  <div class="cell">B</div><div class="cell">C</div><div class="cell">D</div>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'eq(style(".cell", "grid-column"), "span 2 / span 2", "第一格跨两列")',
          'ok(rect(".cell").w > rect(".cell:nth-child(2)").w, "第一格确实更宽")'
        ],
        hints: [
          '`col-span-2` 让这一格占两列的轨道。',
          '跨列之后剩下的项会自动往前挤，不用手动排位置。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
