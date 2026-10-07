/* ch02 — 盒模型与尺寸 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch02',
    title: '第 2 章 · 盒模型与尺寸',
    goal: '算得清一个元素到底占多宽，知道宽高写在盒子的哪一层，能用 box-sizing 让尺寸符合直觉。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 每个元素都是一个四层盒子',
          '',
          '从里往外：内容区（content）→ 内边距（padding）→ 边框（border）→ 外边距（margin）。',
          '前七层都画在元素自己身上，`margin` 是它占的空间但不属于它——背景色铺不到外边距上。',
          '',
          '默认的 `width` 只管**内容区**，这叫 `content-box`。所以下面两个盒子写的一样宽，看起来不一样宽：'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同样的 width，加了 padding 和边框就变胖',
        height: 190,
        html: [
          '<div class="a">width 200，没有内边距</div>',
          '<div class="b">width 200，padding 20 + border 4</div>'
        ].join('\n'),
        css: [
          'div { width: 200px; background: #eef; margin-bottom: 10px; }',
          '.b { padding: 20px; border: 4px solid #26b; }'
        ].join('\n'),
        checks: [
          'near(rect(".a").w, 200, 2, "第一个盒子 200 宽")',
          'near(rect(".b").w, 248, 2, "第二个盒子 200 + 20*2 + 4*2 = 248 宽")',
          'ok(rect(".b").w > rect(".a").w, "b 比 a 宽")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## box-sizing: border-box 让 width 管整个盒子',
          '',
          '`box-sizing: border-box` 之后，`width` 说的是「内容 + padding + 边框」的总宽，'
            + '内容区被自动压缩。写布局时几乎总是更省事，所以新手项目常第一件事就是全局设上它：',
          '',
          '```',
          '*, *::before, *::after { box-sizing: border-box; }',
          '```',
          '',
          '注意 `*` 选不到伪元素，所以要连着 `::before` / `::after` 一起写。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'border-box 之后，两个盒子一样宽',
        height: 200,
        html: [
          '<div class="a">200，border-box</div>',
          '<div class="b">200，border-box + padding 20 + border 4</div>'
        ].join('\n'),
        css: [
          'div { box-sizing: border-box; width: 200px; background: #dfd; margin-bottom: 10px; }',
          '.b { padding: 20px; border: 4px solid #2a6; }'
        ].join('\n'),
        checks: [
          'near(rect(".a").w, 200, 2, "a 是 200")',
          'near(rect(".b").w, 200, 2, "b 也是 200")',
          'near(px(".b", "padding-top"), 20, 1, "内边距照样生效")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '两个盒子都写了 `width: 200px` 却不一样宽，问题一定出在 `padding` 或 `border` 上——'
          + '先看 `box-sizing` 是哪个值，再去查别的。'
      },
      {
        kind: 'prose',
        md: [
          '## 尺寸的几种写法',
          '',
          '- 固定值 `width: 240px`：内容变化时可能溢出',
          '- 相对值 `width: 50%`：按**包含块**（通常就是父元素的内容区）算',
          '- `max-width` / `min-height`：给一个上下限，比写死一个值耐用得多',
          '- `width: auto`：块级元素默认行为，撑满包含块；行内元素则由内容决定',
          '',
          '一个常见的坑：`width: 100%` 加 `padding`，在 `content-box` 下会超出父元素一个内边距。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '100% 加内边距溢出，border-box 和 max-width 两种改法',
        height: 200,
        html: [
          '<div class="wrap">',
          '  <div class="kid">width 100% + padding 24（content-box）</div>',
          '</div>',
          '<div class="wrap">',
          '  <div class="kid ok">同样的写法，border-box</div>',
          '</div>'
        ].join('\n'),
        css: [
          '.wrap { width: 420px; background: #fdd; margin-bottom: 12px; }',
          '.kid { width: 100%; padding: 24px; background: #dbe6ff; }',
          '.kid.ok { box-sizing: border-box; background: #dfd; }'
        ].join('\n'),
        checks: [
          'ok(rect(".kid").w > rect(".wrap").w, "没设 border-box 的那个撑出了爸爸")',
          'near(rect(".kid.ok").w, rect(".wrap").w, 2, "设了 border-box 的正好贴住")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 上下外边距会合并',
          '',
          '两个相邻的块级元素，一个 `margin-bottom: 20px`，一个 `margin-top: 20px`，它们之间**不是 40px，是 20px**。',
          '这叫外边距合并（margin collapsing），只发生在垂直方向、且两个盒子之间没有别的东西隔开时。',
          '',
          '父子的上外边距也会合并，是新手觉得「padding 怎么不动」的常见原因。需要确定间距时，'
          + '用 `gap`（flex / grid）或只给一侧写 `margin`，比两边都写省事。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '两个 20px 的外边距贴在一起，实际间隔 20px',
        height: 190,
        html: [
          '<div class="one">上面那个</div>',
          '<div class="two">下面那个</div>'
        ].join('\n'),
        css: [
          'div { height: 40px; background: #eef; }',
          '.one { margin-bottom: 20px; }',
          '.two { margin-top: 20px; }'
        ].join('\n'),
        checks: [
          'near(rect(".two").y - (rect(".one").y + rect(".one").h), 20, 2, "两者间隔是 20 而不是 40")',
          'near(rect(".one").h, 40, 2, "第一个盒子高 40")'
        ]
      },
      {
        kind: 'table',
        head: ['属性', '管什么'],
        rows: [
          ['`box-sizing: content-box`', '默认值，`width` 只管内容区'],
          ['`box-sizing: border-box`', '`width` 管内容 + 内边距 + 边框'],
          ['`width` / `height`', '尺寸；块级的 `auto` 是撑满，行内的 `auto` 是看内容'],
          ['`max-width` / `min-height`', '尺寸上限 / 下限，比写死更耐用'],
          ['`padding`', '内边距，背景色铺得到；四值简写是 上 右 下 左'],
          ['`margin`', '外边距，不受背景影响；相邻垂直外边距会合并'],
          ['`margin: 0 auto`', '块级元素水平居中（必须有确定宽度）'],
          ['`overflow: hidden`', '超出部分裁掉，顺带成为新的块级格式化上下文']
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-1',
        title: '让两个盒子一样宽',
        task: [
          '两个盒子都写了 `width: 200px`，但加了内边距和边框的那个更胖。',
          '',
          '要求：只改 `css` 栏，让两个盒子的**实际占用宽度**都是 200px，`padding` 与 `border` 都保留。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="a">A</div>',
            '<div class="b">B 有 padding 和 border</div>'
          ].join('\n'),
          css: [
            'div { width: 200px; background: #eef; margin-bottom: 10px; }',
            '.b { padding: 20px; border: 4px solid #26b; }'
          ].join('\n')
        },
        solution: {
          css: [
            'div { box-sizing: border-box; width: 200px; background: #eef; margin-bottom: 10px; }',
            '.b { padding: 20px; border: 4px solid #26b; }'
          ].join('\n')
        },
        tests: [
          'near(rect(".a").w, 200, 2, "A 的实际宽度")',
          'near(rect(".b").w, 200, 2, "B 的实际宽度")',
          'near(px(".b", "padding-top"), 20, 1, "B 的内边距还在")'
        ],
        hints: [
          '默认 `width` 只管内容区，内边距和边框是加在外面的。',
          '给 `box-sizing` 换成 `border-box`，宽度就把它们一起算进去。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-2',
        title: '内容太贴边，但不许变宽',
        task: [
          '卡片里的文字紧贴着边框。要求加上内边距，同时卡片的总宽保持 `240px` 不变。',
          '',
          '要求：只改 `css` 栏，内边距取 `16px`。'
        ].join('\n'),
        starter: {
          html: '<div class="card">内容紧贴着边框，看着很挤。</div>',
          css: '.card { width: 240px; background: #eef; border: 1px solid #99f; }'
        },
        solution: {
          css: '.card { box-sizing: border-box; width: 240px; padding: 16px; background: #eef; border: 1px solid #99f; }'
        },
        tests: [
          'near(px(".card", "padding-top"), 16, 1, "上内边距")',
          'near(px(".card", "padding-left"), 16, 1, "左内边距")',
          'near(rect(".card").w, 240, 2, "总宽保持 240")'
        ],
        hints: [
          '`padding` 四值简写是「上 右 下 左」，一个值就是四边一样。',
          '光加 `padding` 会把盒子撑宽，还得同时改 `box-sizing`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-3',
        title: '让卡片在父容器里居中',
        task: [
          '卡片贴着左边。要求把它水平居中，且不改动父容器。',
          '',
          '要求：只改 `css` 栏，卡片宽度保持 `240px`，上下外边距保持 0。'
        ].join('\n'),
        starter: {
          html: '<div class="wrap"><div class="card">居中的卡片</div></div>',
          css: [
            '.wrap { width: 420px; padding: 12px; background: #f6f4ec; }',
            '.card { width: 240px; background: #eef; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.wrap { width: 420px; padding: 12px; background: #f6f4ec; }',
            '.card { margin: 0 auto; width: 240px; background: #eef; }'
          ].join('\n')
        },
        tests: [
          'ok(Math.abs((rect(".card").x - rect(".wrap").x) - (rect(".wrap").x + rect(".wrap").w - (rect(".card").x + rect(".card").w))) <= 3, "左右留白相等")',
          'near(rect(".card").w, 240, 2, "宽度没变")',
          'near(rect(".card").y - rect(".wrap").y, 12, 2, "上面留白是父容器的 padding")'
        ],
        hints: [
          '块级元素水平居中的老办法是 `margin: 0 auto`。',
          '`auto` 需要元素有确定的宽度才分得开左右，`width: 240px` 正好满足。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-4',
        title: '给空盒子兜个底',
        task: [
          '这个盒子现在没内容，整个塌成了一条线。要求它至少占 `120px` 高，而且以后内容变多也不会被截断。',
          '',
          '要求：只改 `css` 栏。'
        ].join('\n'),
        starter: {
          html: '<div class="slot"></div>',
          css: '.slot { width: 200px; background: #fdece2; }'
        },
        solution: {
          css: '.slot { width: 200px; min-height: 120px; background: #fdece2; }'
        },
        tests: [
          'eq(style(".slot", "min-height"), "120px", "最小高度写在声明里")',
          'near(rect(".slot").h, 120, 2, "空盒子的实际高度")'
        ],
        hints: [
          '写死 `height` 的话内容超了会溢出，这里要的是下限。',
          '给尺寸设下限的属性叫 `min-height`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-5',
        title: '让 100% 宽的子元素别撑出去',
        task: [
          '子元素写了 `width: 100%` 又有内边距，结果比父容器还宽，右侧被裁掉了。',
          '',
          '要求：只改 `css` 栏，让子元素的宽度不超过父容器，内边距保持 `20px`。'
        ].join('\n'),
        starter: {
          html: '<div class="wrap"><div class="kid">这一行会被右边裁掉一部分</div></div>',
          css: [
            '.wrap { width: 300px; background: #fdd; }',
            '.kid { width: 100%; padding: 20px; background: #dbe6ff; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.wrap { width: 300px; background: #fdd; }',
            '.kid { box-sizing: border-box; width: 100%; padding: 20px; background: #dbe6ff; }'
          ].join('\n')
        },
        tests: [
          'ok(rect(".kid").w <= rect(".wrap").w + 1, "子元素没撑出父容器")',
          'near(rect(".kid").w, 300, 2, "正好贴住父容器")',
          'near(px(".kid", "padding-left"), 20, 1, "内边距还在")'
        ],
        hints: [
          '`width: 100%` 算的是父元素内容区的宽，`padding` 再往外加就溢出了。',
          '`box-sizing: border-box` 让这 100% 包含内边距。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
