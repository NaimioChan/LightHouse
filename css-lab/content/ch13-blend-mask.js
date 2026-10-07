/* ch13 — 混合模式与遮罩 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch13',
    title: '第 13 章 · 混合模式与遮罩',
    goal: '让两层图形按像素算出第三种颜色，以及用一个形状去裁掉另一个形状。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 混合：两层叠在一起之后，按像素算颜色',
          '',
          '默认情况下上面那层不透明就把下面那层**盖住**。`mix-blend-mode` 改的是这条规则：它让上面这层和它下面的内容**逐像素算**出一个新颜色。',
          '',
          '- `mix-blend-mode` 管的是「本元素与它下方的层」',
          '- `background-blend-mode` 管的是「同一个元素自己的多个背景层之间」',
          '',
          '常用的几种：`multiply` 越乘越暗（像两层颜料叠着看），`screen` 越加越亮，`overlay` 保留下层明暗、把上层当对比度用，`difference` 取差的绝对值（同色变黑，全对照的地方最亮）。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一个蓝块，四种混合模式叠在红底上',
        height: 200,
        html: [
          '<div class="row">',
          '  <div class="tile normal"><i></i></div>',
          '  <div class="tile multiply"><i></i></div>',
          '  <div class="tile screen"><i></i></div>',
          '  <div class="tile difference"><i></i></div>',
          '</div>'
        ].join('\n'),
        css: [
          '.row { display: flex; gap: 10px; font-size: 12px; }',
          '.tile { flex: 1; height: 110px; background: #f00; position: relative; }',
          '.tile i { position: absolute; inset: 20px; background: #00f; }',
          '.normal i { mix-blend-mode: normal; }',
          '.multiply i { mix-blend-mode: multiply; }',
          '.screen i { mix-blend-mode: screen; }',
          '.difference i { mix-blend-mode: difference; }'
        ].join('\n'),
        checks: [
          'eq(style(".multiply i", "mix-blend-mode"), "multiply", "第二格用了 multiply")',
          'eq(style(".screen i", "mix-blend-mode"), "screen", "第三格用了 screen")',
          'eq(style(".difference i", "mix-blend-mode"), "difference", "第四格用了 difference")',
          'eq(style(".normal i", "mix-blend-mode"), "normal", "默认态就是普通覆盖")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '混合模式只影响**绘制**，不影响布局：叠在上面的元素照样占位、照样接事件，`rect()` 量出来的位置也不会变。所以判题要读的是计算值里的 `mix-blend-mode` 与 `background-blend-mode`，不是几何。'
      },
      {
        kind: 'prose',
        md: [
          '## 背景层的混合写在同一个元素上',
          '',
          '一个元素可以有好几层背景（`background-image` 里用逗号分隔，也可以直接写 `linear-gradient(...)`）。`background-blend-mode` 按顺序把它们叠起来算——两层渐变混出更复杂的光影，不用真的放两个元素。',
          '',
          '### 隔离：别让混合漏到文档底下去',
          '',
          '混合范围默认一路往下算到最近的**层叠上下文**边界。给父元素加 `isolation: isolate` 就自己开一个新边界：里面的混合只在这个盒子里发生，不会把整页背景也拽进来。做卡片时几乎总要写这一条。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '两层渐变混合，并用 isolation 圈住范围',
        height: 190,
        html: [
          '<div class="cards">',
          '  <div class="card"><b>混好了</b></div>',
          '  <div class="card plain"><b>只有一层</b></div>',
          '</div>'
        ].join('\n'),
        css: [
          '.cards { display: flex; gap: 12px; }',
          '.card { flex: 1; height: 110px; padding: 10px; border-radius: 8px; color: #fff; isolation: isolate;',
          '  background-image: linear-gradient(120deg, #1f56c8, #7a3ec8), linear-gradient(0deg, #ffffff, #000000);',
          '  background-blend-mode: multiply; }',
          '.card.plain { background-image: linear-gradient(120deg, #1f56c8, #7a3ec8); background-blend-mode: normal; }'
        ].join('\n'),
        checks: [
          'eq(style(".card", "isolation"), "isolate", "混合范围被圈在卡片里")',
          'ok(/multiply/.test(style(".card", "background-blend-mode")), "卡片的两层背景用 multiply 混合")',
          'eq(style(".card.plain", "background-blend-mode"), "normal", "对照组没有混合")',
          'count(".card", 2, "两个卡片")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 遮罩：用一个形状决定「哪里看得见」',
          '',
          '`mask-image` 会取一张图（`gradient` 也算图），然后**按这张图的透明度**决定元素每个像素的可见度：',
          '',
          '- 遮罩不透明的地方 → 元素照常显示',
          '- 遮罩透明的地方 → 元素被抹掉',
          '',
          '所以一条 `linear-gradient(to bottom, #000, transparent)` 就是常见的「图片往下淡出」。注意渐变里用 `#000` 还是 `#fff` 不影响结果，遮罩只看 alpha。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一张图：不遮罩 / 底下淡出 / 圆形遮罩',
        height: 200,
        html: [
          '<div class="row">',
          '  <div class="hero a"></div>',
          '  <div class="hero b"></div>',
          '  <div class="hero c"></div>',
          '</div>'
        ].join('\n'),
        css: [
          '.row { display: flex; gap: 12px; }',
          '.hero { flex: 1; height: 150px; background: linear-gradient(135deg, #f59e0b, #b91c1c); }',
          '.hero.b { -webkit-mask-image: linear-gradient(to bottom, #000 40%, transparent); mask-image: linear-gradient(to bottom, #000 40%, transparent); }',
          '.hero.c { -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 45%, transparent 62%); mask-image: radial-gradient(circle at 50% 50%, #000 45%, transparent 62%); }'
        ].join('\n'),
        checks: [
          'ok(/radial-gradient/.test(style(".hero.c", "mask-image")), "第三格用的是圆形遮罩")',
          'eq(style(".hero.a", "mask-image"), "none", "第一格没有遮罩")',
          'near(rect(".hero.b").w, rect(".hero.a").w, 2, "有遮罩的元素照样占着原来的位置")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '遮罩只影响看得见看不见，**不影响布局和点击**：被抹掉的那半边元素照样占位、照样能点。要连交互一起裁掉，用 `clip-path`（下一节），或者配合 `pointer-events`。'
      },
      {
        kind: 'prose',
        md: [
          '## clip-path：把盒子裁成一个形状',
          '',
          '`mask-image` 用图和渐变；`clip-path` 直接给一个**几何形状**，盒子里形状外的部分连着交互一起被裁掉。',
          '',
          '- `circle(50% at 30% 40%)` 圆，可指定圆心位置',
          '- `ellipse(120px 60px at 50% 50%)` 椭圆',
          '- `polygon(0 0, 100% 0, 50% 100%)` 多边形，顶点按顺时针给',
          '- `inset(10px 20px 30px)` 四条边各往里收多少',
          '- `path("M0 0 L100 0 L50 80 Z")` 直接写 SVG 路径',
          '',
          '判题时计算值会把参数原样回显成 `circle(50% at 50% 50%)` 或 `polygon(0% 0%, 100% 0%, 50% 100%)` 这种形式（百分比带 `%`、数字带 `px`），先在预览窗里看一眼再往断言里抄。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['想要的样子', '写法', '关键点'],
        rows: [
          ['圆头像', '`clip-path: circle(50%)`', '不写 at 就默认居中'],
          ['斜切的色块', '`clip-path: polygon(0 0, 100% 0, 100% 82%, 0 100%)`', '顶点顺时针，至少三个'],
          ['只留中间一条', '`clip-path: inset(0 30% 0 30%)`', '四条边依次是上右下左'],
          ['复杂外形', '`clip-path: path("M...")`', '坐标是绝对像素，不随盒子缩放']
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-1',
        title: '给卡片加一层 multiply 混合',
        task: [
          '给 `.tint` 加一条 `mix-blend-mode: multiply`，让它和下面的底图混起来。',
          '',
          '要求：只改 `css` 栏；`.card` 上的 `isolation: isolate` 保留，别让混合漏到页面背景。'
        ].join('\n'),
        height: 220,
        starter: {
          html: [
            '<div class="card">',
            '  <div class="tint"></div>',
            '  <p>前景文字</p>',
            '</div>'
          ].join('\n'),
          css: [
            '.card { position: relative; height: 160px; padding: 14px; border-radius: 10px; isolation: isolate;',
            '  background: linear-gradient(135deg, #fef3c7, #fca5a5); }',
            '.tint { position: absolute; inset: 0; background: #1f56c8; opacity: .55; }',
            '.card p { position: relative; margin: 0; font-weight: 700; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.card { position: relative; height: 160px; padding: 14px; border-radius: 10px; isolation: isolate;',
            '  background: linear-gradient(135deg, #fef3c7, #fca5a5); }',
            '.tint { position: absolute; inset: 0; background: #1f56c8; opacity: .55; mix-blend-mode: multiply; }',
            '.card p { position: relative; margin: 0; font-weight: 700; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".tint", "mix-blend-mode"), "multiply", "覆盖层要按 multiply 和底下的卡片混合")',
          'eq(style(".card", "isolation"), "isolate", "父卡片要把混合范围圈住")',
          'near(px(".tint", "opacity"), 0.55, 0.01, "另一半靠透明度给，别把两件事混成一件")'
        ],
        hints: [
          '要改的是 `.tint` 那条规则，加一个属性，原来的 `opacity` 留着。',
          '混合模式写在**上面那一层**（这里是被绝对定位铺满的 `.tint`）。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-2',
        title: '用遮罩做往下淡出',
        task: [
          '给 `.fade` 加遮罩：顶部完全不透明，到 35% 处开始变透明，底部完全看不见。',
          '',
          '要求：只改 `css` 栏；用 `linear-gradient(to bottom, …, transparent)` 这一类写法。'
        ].join('\n'),
        height: 220,
        starter: {
          html: '<div class="fade"></div>',
          css: [
            '.fade { width: 100%; height: 150px; background: linear-gradient(120deg, #1f56c8, #7a3ec8); }'
          ].join('\n')
        },
        solution: {
          css: [
            '.fade { width: 100%; height: 150px; background: linear-gradient(120deg, #1f56c8, #7a3ec8);',
            '  -webkit-mask-image: linear-gradient(to bottom, #000 35%, transparent);',
            '  mask-image: linear-gradient(to bottom, #000 35%, transparent); }'
          ].join('\n')
        },
        tests: [
          'ok(/gradient/.test(style(".fade", "mask-image")), "遮罩要是一段渐变");',
          'ok(/rgba\\(0, 0, 0, 0\\)/.test(style(".fade", "mask-image")), "渐变要走到完全透明（计算值是 rgba(0, 0, 0, 0)），否则底下那一层还看得见");',
          'near(rect(".fade").h, 150, 2, "遮罩不改变盒子尺寸")'
        ],
        hints: [
          '遮罩看的是 alpha：`#000` 与 `#fff` 在这里等价，关键是后面那个 `transparent`。',
          '`to bottom` 表示渐变从上往下走，`35%` 是开始变淡的位置。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-3',
        title: '把盒子裁成三角形',
        task: [
          '用 `clip-path: polygon(...)` 把 `.corner` 裁成一个右下角被斜掉的形状。',
          '',
          '具体的三个顶点：左上 `0 0`、右上 `100% 0`、底部中点 `50% 100%`。',
          '',
          '要求：只改 `css` 栏。'
        ].join('\n'),
        height: 220,
        starter: {
          html: '<div class="corner"></div>',
          css: [
            '.corner { width: 100%; height: 160px; background: #1f56c8; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.corner { width: 100%; height: 160px; background: #1f56c8; clip-path: polygon(0 0, 100% 0, 50% 100%); }'
          ].join('\n')
        },
        tests: [
          'ok(/polygon/.test(style(".corner", "clip-path")), "要用 polygon 给出顶点")',
          'count(".corner", 1, "盒子还在，只是被裁掉一部分")',
          'near(rect(".corner").h, 160, 2, "裁剪不改盒子高度")'
        ],
        hints: [
          '顶点顺序按顺时针写，中间用逗号分开。',
          '`50% 100%` 是横向居中、贴到底部的那一点。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-4',
        title: '给混合开一个独立范围',
        task: [
          '`.stage` 里面放了一个用 `difference` 混合的圆。现在这个混合会一路算到页面背景上。',
          '',
          '给 `.stage` 加一条属性，让混合只在 `.stage` 内部发生。',
          '',
          '要求：只改 `css` 栏，别动那个圆的混合模式。'
        ].join('\n'),
        height: 230,
        starter: {
          html: [
            '<div class="stage">',
            '  <div class="ball"></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.stage { position: relative; height: 150px; background: #fef3c7; }',
            '.ball { position: absolute; left: 40px; top: 30px; width: 90px; height: 90px; border-radius: 50%;',
            '  background: #1f56c8; mix-blend-mode: difference; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.stage { position: relative; height: 150px; background: #fef3c7; isolation: isolate; }',
            '.ball { position: absolute; left: 40px; top: 30px; width: 90px; height: 90px; border-radius: 50%;',
            '  background: #1f56c8; mix-blend-mode: difference; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".stage", "isolation"), "isolate", "父盒子要自己开一层层叠上下文，混合才不外溢")',
          'eq(style(".ball", "mix-blend-mode"), "difference", "圆本身的混合模式保持不变")',
          'near(rect(".ball").w, 90, 2, "混合范围不影响尺寸")'
        ],
        hints: [
          '要加的不是 `.ball` 上的东西，而是父元素 `.stage` 上的。',
          '一条 `isolation` 就够，别去动 `z-index` 或 `position`。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
