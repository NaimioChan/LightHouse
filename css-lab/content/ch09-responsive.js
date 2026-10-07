/* ch09 — 响应式与媒体查询 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch09',
    title: '第 9 章 · 响应式与媒体查询',
    goal: '写出一套能同时活在窄屏和宽屏的样式，知道该断在哪里、为什么要移动优先。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 媒体查询：到某个宽度换一套写法',
          '',
          '```',
          '@media (min-width: 700px) {',
          '  .row { flex-direction: row; }',
          '}',
          '```',
          '',
          '读作：**视口宽度不小于 700px 时**，里面的规则才生效。',
          '',
          '- `min-width` 是「从这个宽度往上」，`max-width` 是「到这个宽度为止」',
          '- `and` 可以连条件：`@media (min-width: 600px) and (max-width: 900px)`',
          '- 逗号是「或」：`@media (max-width: 500px), (orientation: landscape)`',
          '- 范围写法 `(600px <= width <= 900px)` 也行，读起来更直白',
          '',
          '媒体查询里的规则**不提升优先级**，它只是「条件成立时才参与层叠」。'
            + '所以写在后面的媒体查询覆盖前面的，跟普通规则一样。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一排盒子：宽了横排，窄了竖排',
        width: 1000,
        height: 210,
        html: '<div class="row"><div>甲</div><div>乙</div><div>丙</div></div>',
        css: [
          '.row { display: flex; flex-direction: column; gap: 8px; background: #f6f4ec; padding: 8px; }',
          '.row div { background: #dbe6ff; padding: 8px; }',
          '@media (min-width: 700px) {',
          '  .row { flex-direction: row; }',
          '  .row div { flex: 1; }',
          '}'
        ].join('\n'),
        checks: [
          'eq(style(".row", "flex-direction"), "row", "1000px 的窗口里是横排")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 移动优先：先写窄屏，再用 `min-width` 往上加',
          '',
          '两种写法都成立，但方向不同：',
          '',
          '- **移动优先**：默认样式写窄屏的，`@media (min-width: …)` 里写宽屏的补充',
          '- **桌面优先**：默认写宽屏的，`@media (max-width: …)` 里写窄屏的覆盖',
          '',
          '推荐移动优先。理由是窄屏的样式通常更简单（一列、更少装饰），'
            + '宽屏只是「多几列、多一点留白」，用叠加的方式写比用覆盖的方式写更容易删改。',
          '',
          '移动优先还要配一件事：`<meta name="viewport" content="width=device-width, initial-scale=1">`。'
            + '没有它，手机浏览器会按 980px 的假宽度渲染再整体缩放，媒体查询算出来的宽度全是错的。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '断点不要照抄设备的像素值（375 / 768 / 1024）。**在布局被挤坏的那个宽度上打断点**：'
          + '慢慢拖窄窗口，什么时候一行放不下、什么时候文字开始贴边，那个位置才是你的断点。'
      },
      {
        kind: 'table',
        head: ['写法', '含义'],
        rows: [
          ['`@media (min-width: 700px)`', '视口 ≥ 700px 时生效（移动优先用这个）'],
          ['`@media (max-width: 699px)`', '视口 ≤ 699px 时生效（桌面优先用这个）'],
          ['`@media (600px <= width <= 900px)`', '范围写法，等价于两条 `and`'],
          ['`@media (orientation: landscape)`', '横屏时生效'],
          ['`@media (prefers-color-scheme: dark)`', '用户系统开了深色模式时生效'],
          ['`@media (prefers-reduced-motion: reduce)`', '用户要求减少动效时生效'],
          ['`@media print`', '打印时生效'],
          ['`@media (hover: hover)`', '设备有真正的悬浮能力时生效']
        ],
        code: true
      },
      {
        kind: 'prose',
        md: [
          '## 这一章的断言会跑两遍',
          '',
          '这一章的练习里，断言清单中带 `窄屏` 标记的那几条，会先把预览窗收窄到 `420px` 再跑一遍。',
          '',
          '所以写断言时要想清楚：哪几条是在**宽窗口**里验证的，哪几条是**收窄之后**才成立的。'
            + '两条都写，这个练习才算真的把响应式写对了——只在宽窗口里对，等于没写媒体查询。',
          '',
          '练习卡右上角会显示「第二条在 420px 宽的窗口里跑」，跑的时候能看见预览窗先变窄再重排。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex09-1',
        title: '宽了横排，窄了竖排',
        task: [
          '这一排盒子现在窄屏上会被压得很难看。',
          '',
          '要求：只改 `css` 栏，用媒体查询让它在**视口不小于 700px 时横排**、更窄时竖排；'
            + '宽屏下三个盒子等宽。'
        ].join('\n'),
        starter: {
          html: '<div class="row"><div>甲</div><div>乙</div><div>丙</div></div>',
          css: [
            '.row { display: flex; flex-direction: column; gap: 8px; background: #f6f4ec; padding: 8px; }',
            '.row div { background: #dbe6ff; padding: 8px; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="row"><div>甲</div><div>乙</div><div>丙</div></div>',
          css: [
            '.row { display: flex; flex-direction: column; gap: 8px; background: #f6f4ec; padding: 8px; }',
            '.row div { background: #dbe6ff; padding: 8px; }',
            '@media (min-width: 700px) {',
            '  .row { flex-direction: row; }',
            '  .row div { flex: 1; }',
            '}'
          ].join('\n')
        },
        tests: [
          ['eq(style(".row", "flex-direction"), "row", "宽窗口里横排")',
            'ok(Math.abs(rect(".row div:nth-of-type(2)").y - rect(".row div:nth-of-type(3)").y) <= 2, "三个盒子在同一行，顶边齐平")'],
          ['eq(style(".row", "flex-direction"), "column", "窄窗口里竖排")',
            'ok(rect(".row div:nth-of-type(3)").y > rect(".row div").y, "窄窗口里第三个落到了下面")']
        ],
        widths: [420],
        hints: [
          '移动优先：默认写竖排，`@media (min-width: 700px)` 里改成 `row`。',
          '等宽用 `flex: 1`，写在媒体查询里面，只在宽屏生效。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-2',
        title: '窄屏时卡片铺满，宽屏时两列',
        task: [
          '卡片一直是两列的，窄屏上每张只剩一半宽度。',
          '',
          '要求：只改 `css` 栏，写成移动优先：默认单列，视口不小于 `640px` 时两列，间距都是 `10px`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="wall">',
            '  <div>卡片一</div><div>卡片二</div><div>卡片三</div><div>卡片四</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.wall { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f6f4ec; padding: 8px; }',
            '.wall div { background: #dfd; padding: 14px 6px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="wall">',
            '  <div>卡片一</div><div>卡片二</div><div>卡片三</div><div>卡片四</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.wall { display: grid; grid-template-columns: 1fr; gap: 10px; background: #f6f4ec; padding: 8px; }',
            '.wall div { background: #dfd; padding: 14px 6px; }',
            '@media (min-width: 640px) {',
            '  .wall { grid-template-columns: 1fr 1fr; }',
            '}'
          ].join('\n')
        },
        tests: [
          ['eq(tracks(".wall").length, 2, "宽窗口里两列")', 'eq(style(".wall", "gap"), "10px", "间距没变")'],
          ['eq(tracks(".wall").length, 1, "窄窗口里一列")',
            'near(rect(".wall div").w, rect(".wall").w - 16, 3, "卡片铺满容器内容区")']
        ],
        widths: [420],
        hints: [
          '默认写成单列 `grid-template-columns: 1fr`。',
          '媒体查询里再改成两列，`1fr 1fr` 或者 `repeat(2, 1fr)` 都行。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-3',
        title: '窄屏时把侧栏挪到下面',
        task: [
          '两栏布局在窄屏上挤得没法看。',
          '',
          '要求：只改 `css` 栏，视口不小于 `720px` 时是「左侧栏 140px + 右内容」，'
            + '更窄时变成上下堆叠（侧栏在上面），间距始终 `12px`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="layout">',
            '  <aside>侧栏</aside>',
            '  <main>内容区</main>',
            '</div>'
          ].join('\n'),
          css: [
            '.layout { display: grid; grid-template-columns: 140px 1fr; gap: 12px; background: #f6f4ec; padding: 8px; }',
            'aside, main { background: #dbe6ff; padding: 12px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="layout">',
            '  <aside>侧栏</aside>',
            '  <main>内容区</main>',
            '</div>'
          ].join('\n'),
          css: [
            '.layout { display: grid; grid-template-columns: 1fr; gap: 12px; background: #f6f4ec; padding: 8px; }',
            'aside, main { background: #dbe6ff; padding: 12px; }',
            '@media (min-width: 720px) {',
            '  .layout { grid-template-columns: 140px 1fr; }',
            '}'
          ].join('\n')
        },
        tests: [
          ['eq(tracks(".layout").length, 2, "宽窗口里两列")',
            'near(tracks(".layout")[0], 140, 2, "侧栏 140px")',
            'near(rect("aside").y, rect("main").y, 2, "两栏并排，顶边齐平")'],
          ['eq(tracks(".layout").length, 1, "窄窗口里一列")',
            'ok(rect("main").y > rect("aside").y, "内容区落在侧栏下面")']
        ],
        widths: [420],
        hints: [
          '默认单列 `grid-template-columns: 1fr`，窄屏就是上下两块。',
          '媒体查询里换成 `140px 1fr`，两栏就出现。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-4',
        title: '窄屏时少显示一列数据',
        task: [
          '表格在三列时窄屏上要横向滚动。',
          '',
          '要求：只改 `css` 栏，视口小于 `560px` 时把第三列（备注）藏起来，'
            + '不小于 `560px` 时三列都在。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="table">',
            '  <div class="tr"><span>名称</span><span>数量</span><span class="note">备注</span></div>',
            '  <div class="tr"><span>扳手</span><span>2</span><span class="note">放在工具箱</span></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.table { display: grid; gap: 4px; background: #f6f4ec; padding: 8px; }',
            '.tr { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 8px; }',
            '.tr span { background: #dbe6ff; padding: 6px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="table">',
            '  <div class="tr"><span>名称</span><span>数量</span><span class="note">备注</span></div>',
            '  <div class="tr"><span>扳手</span><span>2</span><span class="note">放在工具箱</span></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.table { display: grid; gap: 4px; background: #f6f4ec; padding: 8px; }',
            '.tr { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 8px; }',
            '.tr span { background: #dbe6ff; padding: 6px; }',
            '@media (max-width: 559px) {',
            '  .note { display: none; }',
            '}'
          ].join('\n')
        },
        tests: [
          ['eq(style(".note", "display"), "block", "宽窗口里备注看得见")',
            'eq(style(".tr", "grid-template-columns").split(" ").length, 3, "还是三列")'],
          ['eq(style(".note", "display"), "none", "窄窗口里备注隐藏")',
            'eq(style(".tr", "grid-template-columns").split(" ").length, 3, "列定义没动，只是内容藏了")']
        ],
        widths: [420],
        hints: [
          '这一题用「桌面优先」更好写：默认三列都显示，`@media (max-width: 559px)` 里把备注藏掉。',
          '藏起来用 `display: none`（不是 `visibility: hidden`，那个还占位置）。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-5',
        title: '窄屏把标题缩小、宽屏放大',
        task: [
          '标题的字号是一个固定值，两个尺寸下都不合适。',
          '',
          '要求：只改 `css` 栏，标题字号默认 `20px`，视口不小于 `800px` 时改成 `32px`；'
            + '别改别的属性。'
        ].join('\n'),
        starter: {
          html: '<h1 class="title">一个标题</h1>',
          css: '.title { font-size: 28px; margin: 0; }'
        },
        solution: {
          html: '<h1 class="title">一个标题</h1>',
          css: [
            '.title { font-size: 20px; margin: 0; }',
            '@media (min-width: 800px) {',
            '  .title { font-size: 32px; }',
            '}'
          ].join('\n')
        },
        tests: [
          ['near(px(".title", "font-size"), 32, 1, "宽窗口里 32px")',
            'eq(style(".title", "margin-top"), "0px", "margin 没被改")'],
          ['near(px(".title", "font-size"), 20, 1, "窄窗口里 20px")',
            'eq(style(".title", "margin-top"), "0px", "margin 还是 0")']
        ],
        widths: [420],
        hints: [
          '默认写窄屏的值，媒体查询里写大的那个。',
          '`min-width: 800px` 表示「不小于 800px 时生效」。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
