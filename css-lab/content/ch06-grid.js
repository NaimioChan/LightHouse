/* ch06 — grid 网格布局 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch06',
    title: '第 6 章 · grid 网格布局',
    goal: '用网格把「行列同时对齐」的版面一次写完，知道什么时候该用它、什么时候 flex 更合适。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 定列在先，摆放在后',
          '',
          '`display: grid` 之后要做的第一件事是**划列**：`grid-template-columns` 有几个值就是几列。',
          '',
          '`repeat(3, 1fr)` 是最常用的一行：重复三次 `1fr`，也就是三列等宽。`fr` 表示「剩余空间的一份」，',
          '所以 `1fr 2fr` 就是「一比二」。',
          '',
          '`gap` 同时给出列间距和行间距，不用再算 `margin`，也不会在最后一列后面留出多余的边距。',
          '',
          'flex 与 grid 的分工：**一行/一列的东西用 flex，要同时对齐行列的用 grid**。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '三列等宽的网格',
        height: 210,
        html: [
          '<div class="grid">',
          '  <div>1</div><div>2</div><div>3</div>',
          '  <div>4</div><div>5</div><div>6</div>',
          '</div>'
        ].join('\n'),
        css: [
          '.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 320px; background: #f6f4ec; padding: 8px; }',
          '.grid div { background: #dbe6ff; padding: 10px 0; text-align: center; }'
        ].join('\n'),
        checks: [
          'eq(style(".grid", "display"), "grid", "容器是网格")',
          'eq(tracks(".grid").length, 3, "算完正好是三列")',
          'near(tracks(".grid")[0], 101.33, 1, "每列 (320 - 两个 gap 16) / 3 ≈ 101.33（内容是 content-box，320 指内容区）")',
          'ok(rect(".grid div:nth-of-type(4)").y > rect(".grid div").y, "第四项掉到了第二行")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 自适应列数：auto-fit + minmax',
          '',
          '写死三列以后换个屏幕就不好看了。想「按容器宽度自己决定放几列」，用：',
          '',
          '```',
          'grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));',
          '```',
          '',
          '读法：每一列**最窄 140px、最宽等分**，能塞几列就塞几列。容器宽了就多一列，窄了就少一列，'
            + '完全不用写媒体查询。这就是「卡片墙」最常见的写法。',
          '',
          '`auto-fill` 与 `auto-fit` 的区别只在最后一行有富余空间时：`auto-fit` 会把空轨道折叠掉，'
            + '让已有卡片拉宽铺满；`auto-fill` 会留下空位。卡片墙通常要的是 `auto-fit`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一段 CSS，容器越宽列越多',
        width: 300,
        height: 230,
        html: [
          '<div class="wall">',
          '  <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>',
          '</div>'
        ].join('\n'),
        css: [
          '.wall { display: grid; grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)); gap: 8px; background: #f6f4ec; padding: 8px; }',
          '.wall div { background: #dfd; padding: 12px 0; text-align: center; }'
        ].join('\n'),
        checks: [
          'eq(style(".wall", "display"), "grid", "这是一个网格")',
          'ok(tracks(".wall").length >= 2, "按容器宽度自动列出了至少两列")',
          'ok(tracks(".wall").length * 70 <= rect(".wall").w, "每一列都不低于 70px 这个下限")',
          'near(tracks(".wall")[0], tracks(".wall")[1], 1, "各列等宽")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 让某一项跨列或跨行',
          '',
          '网格里的每个子项默认占一格。要跨出去，用这四个属性：',
          '',
          '- `grid-column: 1 / 3`：从第 1 条列线跨到第 3 条列线，也就是**占两列**',
          '- `grid-column: span 2`：从当前位置往后占两列（不用数线号，更省事）',
          '- `grid-row: 1 / 3` / `span 2`：同理，纵向跨两行',
          '',
          '网格线是从 1 开始数的；`1 / 3` 这种写法容易看错，' +
            '记住它是「从第 1 条线到第 3 条线」而不是「跨 3 列」。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一块横跨整行，一块纵向跨两行',
        height: 230,
        html: [
          '<div class="grid">',
          '  <div class="wide">标题横跨两列</div>',
          '  <div class="tall">纵向跨两行</div>',
          '  <div>普通</div><div>普通</div>',
          '</div>'
        ].join('\n'),
        css: [
          '.grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 46px; gap: 8px; width: 330px; background: #f6f4ec; padding: 8px; }',
          '.grid div { background: #dbe6ff; display: flex; align-items: center; justify-content: center; font-size: 12px; }',
          '.wide { grid-column: span 2; background: #dfd; }',
          '.tall { grid-row: span 2; background: #fdece2; }'
        ].join('\n'),
        checks: [
          'near(rect(".wide").w / rect(".grid div:nth-of-type(3)").w, 2, 0.2, "标题的宽度是普通格子的两倍（注意 gap 会被扣掉）")',
          'ok(rect(".tall").h > rect(".grid div:nth-of-type(3)").h, "纵向那块比普通格子高")',
          'near(rect(".tall").h, 100, 4, "跨两行 ≈ 46*2 + gap 8")'
        ]
      },
      {
        kind: 'table',
        head: ['写法', '含义'],
        rows: [
          ['`display: grid`', '开启网格布局，直接子元素成为网格项'],
          ['`grid-template-columns: repeat(3, 1fr)`', '三列等宽'],
          ['`grid-template-columns: 120px 1fr`', '左边固定 120px，右边吃掉剩下'],
          ['`repeat(auto-fit, minmax(140px, 1fr))`', '按容器宽度自动决定列数'],
          ['`grid-auto-rows: 60px`', '给没指定的那些行一个统一高度'],
          ['`gap: 12px`', '行列间距一起设'],
          ['`grid-column: span 2`', '这一项横向占两列'],
          ['`grid-row: 1 / 3`', '从第 1 条行线占到第 3 条（占两行）'],
          ['`justify-items` / `align-items`', '格子里内容在水平 / 垂直方向的对齐']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex06-1',
        title: '把六个方块摆成三列',
        task: [
          '六个方块现在竖着堆成一列。',
          '',
          '要求：只改 `css` 栏，排成三列等宽，行列间距都是 `8px`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="grid">',
            '  <div>1</div><div>2</div><div>3</div>',
            '  <div>4</div><div>5</div><div>6</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.grid { width: 320px; background: #f6f4ec; padding: 8px; }',
            '.grid div { background: #dbe6ff; padding: 10px 0; text-align: center; margin-bottom: 8px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 320px; background: #f6f4ec; padding: 8px; }',
            '.grid div { background: #dbe6ff; padding: 10px 0; text-align: center; }'
          ].join('\n')
        },
        tests: [
          'eq(tracks(".grid").length, 3, "三列")',
          'eq(style(".grid", "gap"), "8px", "行列间距 8px")',
          'ok(rect(".grid div:nth-of-type(4)").y > rect(".grid div").y, "第四项换到了第二行")'
        ],
        hints: [
          '列在容器上划：`grid-template-columns`，等宽三列写 `repeat(3, 1fr)`。',
          '有了 `gap` 之后，子项的 `margin-bottom` 就不需要了。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-2',
        title: '侧栏固定宽，内容区自适应',
        task: [
          '侧栏和内容区现在宽度一样。',
          '',
          '要求：只改 `css` 栏，左栏固定 `100px`，右栏吃掉剩下的宽度，两栏间距 `12px`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="layout">',
            '  <aside>侧栏</aside>',
            '  <main>内容区会跟着容器变宽</main>',
            '</div>'
          ].join('\n'),
          css: [
            '.layout { width: 400px; background: #f6f4ec; padding: 8px; }',
            'aside, main { background: #dbe6ff; padding: 10px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.layout { display: grid; grid-template-columns: 100px 1fr; gap: 12px; width: 400px; background: #f6f4ec; padding: 8px; }',
            'aside, main { background: #dbe6ff; padding: 10px; }'
          ].join('\n')
        },
        tests: [
          'near(tracks(".layout")[0], 100, 2, "第一列 100px")',
          'ok(tracks(".layout")[1] > 250, "第二列吃掉剩下的宽度")',
          'near(rect("main").x - (rect("aside").x + rect("aside").w), 12, 2, "两栏间距 12px")'
        ],
        hints: [
          '两列宽度在 `grid-template-columns` 里用空格分隔。',
          '「剩下的都给它」用 `1fr`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-3',
        title: '让卡片墙自己决定几列',
        task: [
          '卡片写死了三列，在窄容器里挤成一团。',
          '',
          '要求：只改 `css` 栏，换成按容器宽度自动决定列数的写法，每列最窄 `90px`、最宽等分，间距 `10px`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="wall">',
            '  <div>卡片一</div><div>卡片二</div><div>卡片三</div>',
            '  <div>卡片四</div><div>卡片五</div><div>卡片六</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.wall { display: grid; grid-template-columns: repeat(3, 1fr); width: 300px; background: #f6f4ec; padding: 8px; }',
            '.wall div { background: #dfd; padding: 12px 6px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.wall { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 10px; width: 300px; background: #f6f4ec; padding: 8px; }',
            '.wall div { background: #dfd; padding: 12px 6px; }'
          ].join('\n')
        },
        tests: [
          'eq(tracks(".wall").length, 3, "300px 的容器里正好排三列")',
          'eq(style(".wall", "gap"), "10px", "间距 10px")',
          'ok(tracks(".wall")[0] >= 90 - 1, "每列不低于 90px")'
        ],
        hints: [
          '自动列数的固定搭配是 `repeat(auto-fit, minmax(最小值, 1fr))`。',
          '最小值就是「一列最窄能到多少」，容器放不下这么多列时会自动少放一列。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-4',
        title: '让标题横跨整行',
        task: [
          '标题只想占一格，看着很局促。',
          '',
          '要求：只改 `css` 栏，让 `.headline` 横向占满三列，其余方块维持一格。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="grid">',
            '  <div class="headline">我要横跨整行</div>',
            '  <div>1</div><div>2</div><div>3</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 320px; background: #f6f4ec; padding: 8px; }',
            '.grid div { background: #dbe6ff; padding: 10px; }',
            '.headline { background: #dfd; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 320px; background: #f6f4ec; padding: 8px; }',
            '.grid div { background: #dbe6ff; padding: 10px; }',
            '.headline { grid-column: span 3; background: #dfd; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".headline", "grid-column-start"), "span 3", "横向占三列")',
          'near(rect(".headline").w, rect(".grid").w - 16, 3, "宽度接近容器内容区整宽")',
          'ok(rect(".grid div:nth-of-type(2)").y > rect(".headline").y, "其余方块被挤到下一行")'
        ],
        hints: [
          '跨列写在**子项**上，不写在容器上。',
          '`grid-column: span 3` 就是横向吃三格。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-5',
        title: '一格占两行，做一张竖长卡',
        task: [
          '要在网格里做一张纵向占两行的特色卡。',
          '',
          '要求：只改 `css` 栏，让 `.feature` 纵向占两行，行高统一 `50px`，间距 `8px`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="grid">',
            '  <div class="feature">竖长卡</div>',
            '  <div>1</div><div>2</div><div>3</div><div>4</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.grid { display: grid; grid-template-columns: repeat(3, 1fr); width: 330px; background: #f6f4ec; padding: 8px; }',
            '.grid div { background: #dbe6ff; padding: 8px; }',
            '.feature { background: #fdece2; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 50px; gap: 8px; width: 330px; background: #f6f4ec; padding: 8px; }',
            '.grid div { background: #dbe6ff; padding: 8px; }',
            '.feature { grid-row: span 2; background: #fdece2; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".feature", "grid-row-start"), "span 2", "纵向占两行")',
          'near(rect(".feature").h, 108, 4, "两行高 ≈ 50*2 + gap 8")',
          'near(px(".grid", "grid-auto-rows"), 50, 1, "行高统一 50px")'
        ],
        hints: [
          '先给所有行定高：`grid-auto-rows: 50px`（没显式指定的行都按这个来）。',
          '跨行用 `grid-row: span 2`，写在那个子项上。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
