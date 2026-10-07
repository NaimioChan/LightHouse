/* ch05 — flex 弹性布局 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch05',
    title: '第 5 章 · flex 弹性布局',
    goal: '用一维的弹性容器把一排东西排好、对齐、分配剩余空间，知道主轴与交叉轴各自受哪些属性管。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 两轴、两个角色',
          '',
          '给容器写 `display: flex` 之后，它的**直接子元素**变成弹性项，自动排成一行。',
          '容器有两根轴：',
          '',
          '- **主轴**：由 `flex-direction` 决定，默认 `row`（横着），改成 `column` 就变竖着',
          '- **交叉轴**：跟主轴垂直的那一根',
          '',
          '两条轴各管一件事，记混了就会写出「为什么竖排没居中」这种问题：',
          '',
          '- 主轴方向的对齐与分配：`justify-content`',
          '- 交叉轴方向的对齐：`align-items`（单行）/ `align-content`（多行）'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一排三个盒子，justify-content 的三种取值',
        height: 200,
        html: [
          '<div class="row start"><i>1</i><i>2</i><i>3</i></div>',
          '<div class="row center"><i>1</i><i>2</i><i>3</i></div>',
          '<div class="row between"><i>1</i><i>2</i><i>3</i></div>'
        ].join('\n'),
        css: [
          '.row { display: flex; width: 320px; height: 50px; margin-bottom: 8px; background: #f6f4ec; border: 1px solid #e0dbcc; }',
          '.row i { width: 46px; background: #dbe6ff; font-style: normal; text-align: center; line-height: 50px; }',
          '.start { justify-content: flex-start; }',
          '.center { justify-content: center; }',
          '.between { justify-content: space-between; }'
        ].join('\n'),
        checks: [
          'eq(style(".center", "justify-content"), "center", "第二排是居中的写法")',
          'near(rect(".center i").x - rect(".center").x, (320 - 46 * 3) / 2, 3, "第一个盒子左边留白 = 剩余空间的一半")',
          'near(rect(".between i:last-child").x + rect(".between i:last-child").w, rect(".between").x + 320 - 1, 3, "space-between 时最后一个贴住右边")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 交叉轴：align-items 与 align-content',
          '',
          '`align-items` 管的是**每一行内部**：`stretch`（默认，撑满）、`center`、`flex-start`、`flex-end`、`baseline`。',
          '',
          '`align-content` 只在**换行之后有多行**时才有效果，管的是**行与行之间**怎么分空间。',
          '单行容器写 `align-content` 不会有任何变化——这是「为什么我写了没用」的常见来源。',
          '',
          '还有一个反直觉的：默认 `align-items: stretch` 时，弹性项的高度被拉满；'
            + '一旦你给某一项写了 `height`，它就不拉了。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '交叉轴三种对齐，以及默认的 stretch',
        height: 210,
        html: [
          '<div class="row"><i class="tall">stretch</i><i></i></div>',
          '<div class="row center"><i class="tall">center</i><i></i></div>'
        ].join('\n'),
        css: [
          '.row { display: flex; width: 320px; height: 60px; margin-bottom: 8px; background: #f6f4ec; border: 1px solid #e0dbcc; }',
          '.row i { width: 90px; background: #dbe6ff; font-style: normal; font-size: 12px; }',
          '.row.center { align-items: center; }',
          '.row i.tall { height: 30px; }'
        ].join('\n'),
        checks: [
          'eq(style(".row.center", "align-items"), "center", "第二行显式写了 center")',
          'near(rect(".row:not(.center) i:nth-of-type(2)").h, 60, 2, "没写高度的那个被拉满了")',
          'near(rect(".row.center i.tall").y - rect(".row.center").y, 15, 2, "写了高度的那个在 center 下上下居中")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 弹性项的伸缩：flex-grow / shrink / basis',
          '',
          '`flex: 1` 是简写，展开是 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`。它有两层意思：',
          '',
          '1. 剩余空间按 `grow` 的比例分给各项',
          '2. `basis: 0%` 意味着**内容宽度不参与计算**，所以两项 `flex: 1` 永远是等宽的',
          '',
          '对比 `flex: auto`（`basis: auto`）：那时先按内容宽度分，内容多的拿得多。'
            + '「两边等分用 `flex: 1`，按内容分用 `flex: auto`」这条能省掉很多调试。',
          '',
          '`flex-shrink` 默认是 1，所以内容太长时弹性项会被压缩；写 `flex-shrink: 0` 就锁住不缩，'
            + '常见于「头像不要被挤扁」。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'flex: 1 与 flex: auto 分空间的差别',
        height: 190,
        html: [
          '<div class="row a"><span>短</span><span>一段比较长的文字内容</span></div>',
          '<div class="row b"><span>短</span><span>一段比较长的文字内容</span></div>'
        ].join('\n'),
        css: [
          '.row { display: flex; width: 320px; margin-bottom: 8px; background: #f6f4ec; border: 1px solid #e0dbcc; }',
          '.row span { background: #dbe6ff; padding: 6px; }',
          '.a span { flex: 1; }',
          '.b span { flex: auto; }'
        ].join('\n'),
        checks: [
          'near(rect(".a span").w, 160, 6, "flex: 1 时两项等宽（container 320 的一半）")',
          'ok(rect(".b span:nth-of-type(2)").w > rect(".b span").w, "flex: auto 时长内容那个更宽")'
        ]
      },
      {
        kind: 'table',
        head: ['属性', '写在哪', '管什么'],
        rows: [
          ['`display: flex`', '容器', '开启弹性布局，直接子元素成为弹性项'],
          ['`flex-direction`', '容器', '主轴方向：`row` / `column` / 两个 `-reverse`'],
          ['`flex-wrap`', '容器', '挤不下时换不换行，默认 `nowrap`'],
          ['`gap`', '容器', '项之间的间距，比给每项写 `margin` 干净'],
          ['`justify-content`', '容器', '主轴方向的对齐与空间分配'],
          ['`align-items`', '容器', '单行内每项在交叉轴上的对齐'],
          ['`align-content`', '容器', '多行之间在交叉轴上的分配（单行无效）'],
          ['`align-self`', '项', '单项覆盖容器的 `align-items`'],
          ['`flex: 1`', '项', '等分剩余空间（`grow:1 shrink:1 basis:0%`）'],
          ['`flex: auto`', '项', '先按内容宽度分，再分剩余空间'],
          ['`flex-shrink: 0`', '项', '锁住不压缩']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex05-1',
        title: '把三张卡片排成一行',
        task: [
          '三张卡片现在是竖着堆的。',
          '',
          '要求：只改 `css` 栏，让它们横向排成一行、左右两端对齐（第一张靠左、最后一张靠右）。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="lane">',
            '  <div class="card">甲</div>',
            '  <div class="card">乙</div>',
            '  <div class="card">丙</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.lane { width: 320px; background: #f6f4ec; padding: 8px; }',
            '.card { width: 80px; padding: 10px 0; background: #dbe6ff; text-align: center; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.lane { display: flex; justify-content: space-between; width: 320px; background: #f6f4ec; padding: 8px; }',
            '.card { width: 80px; padding: 10px 0; background: #dbe6ff; text-align: center; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".lane", "justify-content"), "space-between", "两端对齐")',
          'ok(rect(".card").y === rect(".card:nth-of-type(3)").y, "三张卡片在同一行")',
          'near(rect(".card:last-child").x + rect(".card:last-child").w, rect(".lane").x + rect(".lane").w - 8, 3, "最后一张贴住右边内边距")'
        ],
        hints: [
          '`display: flex` 写在父容器上，不写在卡片上。',
          '两端对齐是主轴方向的分配，用 `justify-content`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-2',
        title: '让卡片内容垂直居中',
        task: [
          '卡片高度是 `90px`，里面的文字贴在顶上。',
          '',
          '要求：只改 `css` 栏，让每张卡片里的文字在卡片内**水平垂直都居中**（不要用 `line-height`）。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="lane">',
            '  <div class="card">甲</div>',
            '  <div class="card">乙</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.lane { display: flex; gap: 10px; }',
            '.card { display: flex; width: 120px; height: 90px; background: #dbe6ff; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.lane { display: flex; gap: 10px; }',
            '.card { display: flex; width: 120px; height: 90px; background: #dbe6ff; align-items: center; justify-content: center; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".card", "align-items"), "center", "交叉轴居中")',
          'eq(style(".card", "justify-content"), "center", "主轴居中")',
          'ok(Math.abs(rect(".lane").h - rect(".card").h) <= 2, "卡片高度没被改掉")'
        ],
        hints: [
          '卡片自己也是个 flex 容器，两条轴各管一个方向。',
          '卡片里只有一个文字节点时，把它当成一个匿名弹性项，两条属性一起写就居中了。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-3',
        title: '让中间那块撑满，两边不动',
        task: [
          '头栏里左右两个小图标被挤扁了，中间那块又太窄。',
          '',
          '要求：只改 `css` 栏，让左右两块保持 `40px`，中间那块吃掉所有剩下的宽度。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="bar">',
            '  <span class="side">左</span>',
            '  <span class="mid">中间这块要撑满</span>',
            '  <span class="side">右</span>',
            '</div>'
          ].join('\n'),
          css: [
            '.bar { display: flex; width: 320px; background: #f6f4ec; padding: 6px; }',
            '.side { width: 40px; background: #e0dbcc; text-align: center; }',
            '.mid { background: #dbe6ff; padding: 4px 6px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.bar { display: flex; width: 320px; background: #f6f4ec; padding: 6px; gap: 6px; }',
            '.side { flex: 0 0 40px; background: #e0dbcc; text-align: center; }',
            '.mid { flex: 1; background: #dbe6ff; padding: 4px 6px; }'
          ].join('\n')
        },
        tests: [
          'ok(Number(style(".side", "flex-grow")) === 0, "两边不参与分空间")',
          'ok(Number(style(".mid", "flex-grow")) >= 1, "中间那块参与分空间")',
          'ok(rect(".mid").w > rect(".side").w, "中间那块确实更宽")'
        ],
        hints: [
          '「固定宽 + 不吃剩余」用 `flex: 0 0 40px`，三个值分别是 grow / shrink / basis。',
          '「吃掉剩下的」就是 `flex: 1`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-4',
        title: '挤不下时换行',
        task: [
          '五个标签挤在一行里被压得很窄，文字都换行了。',
          '',
          '要求：只改 `css` 栏，让标签在一行放不下时自动换到下一行，每个标签保持 `90px` 宽、间距 `8px`，不要压缩。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="tags">',
            '  <span>标签一</span>',
            '  <span>标签二</span>',
            '  <span>标签三</span>',
            '  <span>标签四</span>',
            '  <span>标签五</span>',
            '</div>'
          ].join('\n'),
          css: [
            '.tags { display: flex; width: 300px; background: #f6f4ec; padding: 6px; }',
            '.tags span { background: #dbe6ff; padding: 4px 0; text-align: center; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.tags { display: flex; flex-wrap: wrap; gap: 8px; width: 300px; background: #f6f4ec; padding: 6px; }',
            '.tags span { flex: 0 0 90px; background: #dbe6ff; padding: 4px 0; text-align: center; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".tags", "flex-wrap"), "wrap", "允许换行")',
          'near(rect(".tags span").w, 90, 2, "标签宽度 90px")',
          'ok(rect(".tags").h > 40, "已经换成了不止一行")'
        ],
        hints: [
          '默认 `flex-wrap: nowrap`，所以挤不下就往里压；改成 `wrap` 才会换行。',
          '要保证每个标签宽度不变、也不被压，用 `flex: 0 0 90px`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-5',
        title: '钉一条永远在右边的小尾巴',
        task: [
          '这一行左侧标题、右侧一个「更多」，中间空着。',
          '',
          '要求：只改 `css` 栏，让「更多」始终贴在这一行的最右边，标题贴左边，**不要用 `justify-content: space-between`**。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="head">',
            '  <h3>最近更新</h3>',
            '  <a class="more" href="#end">更多</a>',
            '</div>'
          ].join('\n'),
          css: [
            '.head { display: flex; width: 300px; background: #f6f4ec; padding: 6px; }',
            '.head h3 { margin: 0; font-size: 15px; }',
            '.more { text-decoration: none; color: #2456c8; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.head { display: flex; width: 300px; background: #f6f4ec; padding: 6px; }',
            '.head h3 { margin: 0; font-size: 15px; }',
            '.more { margin-left: auto; text-decoration: none; color: #2456c8; }'
          ].join('\n')
        },
        tests: [
          'near(rect(".more").x + rect(".more").w, rect(".head").x + rect(".head").w - 6, 3, "「更多」贴住右边内边距")',
          'near(rect(".head h3").x, rect(".head").x + 6, 3, "标题贴住左边内边距")',
          'ok(px(".more", "margin-left") > 100, "左外边距吃掉了中间那一段空档")'
        ],
        hints: [
          '弹性项上的 `margin: auto` 会吃掉那一侧的所有剩余空间。',
          '写 `margin-left: auto` 就能把这一项顶到最右边，比调 `justify-content` 更局部。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
