/* ch07 — 响应式：断点前缀与移动优先 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch07',
    title: '第 7 章 · 响应式：断点前缀',
    goal: '用 `md:` `lg:` 这些前缀，让同一段 HTML 在窄屏一列、宽屏多列，知道断点为什么从 `sm` 开始往上加。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 断点前缀就是一条 `min-width` 媒体查询',
          '',
          'Tailwind 预置了几个断点，写成前缀：'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['前缀', '生效宽度'],
        rows: [
          ['`sm:`', '≥ 640px'],
          ['`md:`', '≥ 768px'],
          ['`lg:`', '≥ 1024px'],
          ['`xl:`', '≥ 1280px'],
          ['`2xl:`', '≥ 1536px']
        ],
        code: true
      },
      {
        kind: 'prose',
        md: [
          '`md:grid-cols-3` 展开成一条 `@media (min-width: 768px)` 规则，里面是 `grid-template-columns: repeat(3, …)`。'
            + '规则是**移动优先**：不带前缀的样式对所有宽度生效，带前缀的只在该断点**往上**生效。',
          '',
          '所以「窄屏一列、宽屏三列」写成 `grid-cols-1 md:grid-cols-3`——默认一列，够宽了才覆盖成三列，'
            + '不用去写 `max-width` 往回盖。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 前缀可以叠加，也可以只改一件事',
          '',
          '断点前缀和状态前缀能一起用：`md:hover:bg-blue-700`。写在最前面的是断点。',
          '',
          '你不需要在每个断点都重写一遍。**只写变化的那一档**：默认三列、窄屏要一列，就让默认那档是你要的，'
            + '前缀那份负责覆盖。`grid-cols-1 md:grid-cols-3` 只有两条规则，`lg` 那档没提，'
            + '于是宽屏沿用 `md` 的结论。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一组卡片：这一窗宽，所以走到了三列那一档',
        width: 1000,
        height: 180,
        html: [
          '<div class="wall grid grid-cols-1 md:grid-cols-3 gap-2">',
          '  <div>卡一</div><div>卡二</div><div>卡三</div>',
          '</div>'
        ].join('\n'),
        css: '.wall div { padding: 12px 8px; background: #eaf0ff; font-size: 13px; text-align: center; }',
        checks: [
          'eq(tracks(".wall").length, 3, "1000px 的窗口里排成三列")',
          'eq(style(".wall", "gap"), "8px", "间距对所有宽度都生效")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '本章练习里带 `窄屏` 标记的断言，会先把预览窗收窄到 `420px` 再跑一遍。'
          + '420px 比 `sm` 的 640px 还窄，所以那时**任何断点前缀都不生效**，看到的全是默认那档。'
          + '写断言时想清楚哪条验证宽窗口、哪条验证窄窗口。'
      },
      {
        kind: 'table',
        head: ['前缀', '从多宽开始生效', '常用场景'],
        rows: [
          ['（无）', '所有宽度', '移动端默认：单列、小字'],
          ['`sm:`', '≥ 640px', '大屏手机横屏、小平板'],
          ['`md:`', '≥ 768px', '平板竖屏：两栏'],
          ['`lg:`', '≥ 1024px', '笔记本：三栏、出现侧栏'],
          ['`xl:`', '≥ 1280px', '大显示器：更宽的内容区']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex07-1',
        title: '窄屏一列，宽屏三列',
        task: [
          '一组卡片现在固定一列，宽屏下浪费空间。',
          '',
          '要求：只改 `html` 栏，写成移动优先：默认 `grid-cols-1`，视口不小于 768px 时 `md:grid-cols-3`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="wall grid grid-cols-1 gap-2">',
            '  <div>卡一</div><div>卡二</div><div>卡三</div>',
            '</div>'
          ].join('\n'),
          css: '.wall div { padding: 14px 8px; background: #eaf0ff; font-size: 13px; }'
        },
        solution: {
          html: [
            '<div class="wall grid grid-cols-1 md:grid-cols-3 gap-2">',
            '  <div>卡一</div><div>卡二</div><div>卡三</div>',
            '</div>'
          ].join('\n')
        },
        tests: [
          ['eq(tracks(".wall").length, 3, "宽窗口里三列")'],
          ['eq(tracks(".wall").length, 1, "窄窗口里一列")']
        ],
        widths: [420],
        hints: [
          '`md:` 是 768px 往上，420px 的窄窗口达不到，所以那时是默认的一列。',
          '默认那档写成 `grid-cols-1`，宽的那档覆盖成 `grid-cols-3`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-2',
        title: '窄屏藏起次要栏，宽屏显示',
        task: [
          '一条工具栏里有两组按钮：主要操作和次要操作。窄屏放不下全部，先把次要那组藏起来。',
          '',
          '要求：只改 `html` 栏，给次要那组 `.secondary` 加 `hidden md:flex`（默认藏起来，不窄于 768px 才作为 flex 显示）。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="bar flex gap-2">',
            '  <button class="pri">保存</button>',
            '  <div class="secondary flex gap-2"><button>导出</button><button>分享</button></div>',
            '</div>'
          ].join('\n'),
          css: 'body { font-size: 13px; } button { padding: 6px 10px; } .bar { background: #f6f4ec; padding: 8px; }'
        },
        solution: {
          html: [
            '<div class="bar flex gap-2">',
            '  <button class="pri">保存</button>',
            '  <div class="secondary hidden md:flex gap-2"><button>导出</button><button>分享</button></div>',
            '</div>'
          ].join('\n')
        },
        tests: [
          ['eq(style(".secondary", "display"), "flex", "宽窗口里次要按钮看得见")'],
          ['eq(style(".secondary", "display"), "none", "窄窗口里次要按钮藏起来")']
        ],
        widths: [420],
        hints: [
          '`hidden` 是 `display: none`，`md:flex` 是「宽屏时显示成 flex」。后者会盖住前者。',
          '别用 `sm:block` 这种，你要的是 flex 容器，就写 `md:flex`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-3',
        title: '窄屏竖排，宽屏横排',
        task: [
          '一个表单在窄屏上排到一行放不下。',
          '',
          '要求：只改 `html` 栏，给 `.form` 加 `flex flex-col md:flex-row` 和 `gap-2`。'
        ].join('\n'),
        starter: {
          html: [
            '<form class="form">',
            '  <input placeholder="姓名"><input placeholder="邮箱"><button type="button">提交</button>',
            '</form>'
          ].join('\n'),
          css: 'body { font-size: 13px; } input, button { padding: 6px 8px; } .form { background: #f6f4ec; padding: 8px; }'
        },
        solution: {
          html: [
            '<form class="form flex flex-col md:flex-row gap-2">',
            '  <input placeholder="姓名"><input placeholder="邮箱"><button type="button">提交</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          ['eq(style(".form", "flex-direction"), "row", "宽窗口里横排")',
            'ok(Math.abs(rect(".form input").y - rect(".form button").y) <= 2, "控件在同一行，顶边齐平")'],
          ['eq(style(".form", "flex-direction"), "column", "窄窗口里竖排")',
            'ok(rect(".form button").y > rect(".form input").y, "按钮落到了输入框下面")']
        ],
        widths: [420],
        hints: [
          '`flex-col` 是默认那档（窄屏竖排），`md:flex-row` 覆盖成横排。',
          '`gap-2` 不带前缀，两个方向都用同一个间距。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-4',
        title: '窄屏小字，宽屏大字',
        task: [
          '一个标题在小屏上太大、大屏上又不够气派。',
          '',
          '要求：只改 `html` 栏，给 `.title` 加 `text-base md:text-2xl`。'
        ].join('\n'),
        starter: {
          html: '<h2 class="title">数据总览</h2>',
          css: 'body { font-size: 13px; } .title { margin: 0; }'
        },
        solution: {
          html: '<h2 class="title text-base md:text-2xl">数据总览</h2>'
        },
        tests: [
          ['eq(px(".title", "font-size"), 24, "宽窗口里 24px")'],
          ['eq(px(".title", "font-size"), 16, "窄窗口里 16px")']
        ],
        widths: [420],
        hints: [
          '`text-base` 是 16px，`text-2xl` 是 24px。',
          '默认写小的那个，前缀写大的那个。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
