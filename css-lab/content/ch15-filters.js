/* ch15 — 滤镜与 SVG 滤镜 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch15',
    title: '第 15 章 · 滤镜与 SVG 滤镜',
    goal: '用一串图像算子改画面的样子，并知道哪些效果必须借 SVG 才能做出来。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## filter：一行就是一条图像处理流水线',
          '',
          '`filter` 接一个函数列表，按**从左到右**的顺序作用在元素画出来的图像上：',
          '',
          '- `blur(6px)` 高斯模糊，半径越大越糊',
          '- `brightness(1.4)` 乘一个亮度系数，`1` 是原样，小于 1 变暗',
          '- `contrast(1.6)` 对比度，`0` 是全灰',
          '- `saturate(2)` 饱和度，`0` 是灰度',
          '- `hue-rotate(90deg)` 色相整体转一个角度',
          '- `drop-shadow(0 4px 6px rgba(0,0,0,.35))` 只给**不透明的部分**加投影，比 `box-shadow` 贴合图形',
          '',
          '顺序真的会影响结果：先模糊再提高对比度，和先提高对比度再模糊，出来的东西不一样。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一张色板，四种滤镜',
        height: 190,
        html: [
          '<div class="row">',
          '  <div class="chip a"></div>',
          '  <div class="chip b"></div>',
          '  <div class="chip c"></div>',
          '  <div class="chip d"></div>',
          '</div>'
        ].join('\n'),
        css: [
          '.row { display: flex; gap: 10px; }',
          '.chip { flex: 1; height: 110px; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #1f56c8); }',
          '.chip.b { filter: grayscale(1); }',
          '.chip.c { filter: blur(4px); }',
          '.chip.d { filter: hue-rotate(120deg) saturate(1.6); }'
        ].join('\n'),
        checks: [
          'eq(style(".chip.b", "filter"), "grayscale(1)", "第二格去色")',
          'eq(style(".chip.c", "filter"), "blur(4px)", "第三格模糊")',
          'ok(/hue-rotate\\(120deg\\)/.test(style(".chip.d", "filter")) && /saturate\\(1.6\\)/.test(style(".chip.d", "filter")), "第四格是两个滤镜串起来，顺序按书写顺序")',
          'ok(style(".chip.a", "filter") === "none" || style(".chip.a", "filter") === "", "第一格没有滤镜")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '计算值会按书写顺序原样回显，比如 `hue-rotate(120deg) saturate(1.6)`。要判「两个都写了」用 `ok(/hue-rotate/.test(...) && /saturate/.test(...))`，别把整串写死——空格和角度格式会变。'
      },
      {
        kind: 'prose',
        md: [
          '## 滤镜是渲染出来的，不占布局',
          '',
          '`filter`、`mix-blend-mode`、`mask` 和 `clip-path` 一样，只影响**画出来什么样**：元素还是原来的尺寸、原来的位置、原来的可点区域。给一个盒子加 `blur(20px)`，它会糊出一大团，但 `rect()` 量出来还是原来那个矩形。',
          '',
          '`hue-rotate` 的旋转发生在什么色彩空间里、结果精确到多少，各家浏览器略有差别。所以判题时判「写了哪个函数、参数是多少」，别去断言某个像素的颜色。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## SVG 滤镜：CSS 的滤镜列表不够用时',
          '',
          'CSS 的 `filter` 只有那十来个固定函数，想做**噪点、扭曲、发光、描边**就得上 SVG 的 `<filter>`。里面每个 `<feXxx>` 是一个图像算子，用 `in` / `result` 把前一个的输出接给后一个：',
          '',
          '```',
          '<svg width="0" height="0" aria-hidden="true">',
          '  <filter id="grain">',
          '    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3"/>',
          '    <feColorMatrix type="saturate" values="0"/>',
          '    <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>',
          '  </filter>',
          '</svg>',
          '<div style="filter: url(#grain)"></div>',
          '```',
          '',
          '几个常用的原语：`feTurbulence` 造噪声（`fractalNoise` 像颗粒，`turbulence` 像云），`feDisplacementMap` 用一张图当位移场把另一张图扭掉，`feGaussianBlur` 做柔光，`feColorMatrix` 调颜色通道，`feComponentTransfer` 逐通道重映射（拿来做透明度曲线）。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '用 feTurbulence 做一层噪点',
        height: 210,
        html: [
          '<svg width="0" height="0" aria-hidden="true">',
          '  <filter id="grain">',
          '    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="n"/>',
          '    <feColorMatrix in="n" type="saturate" values="0"/>',
          '    <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>',
          '  </filter>',
          '</svg>',
          '<div class="noise"></div>',
          '<p class="note-txt">上面这块就是 SVG 滤镜生成的颗粒，不是图片。</p>'
        ].join('\n'),
        css: [
          '.noise { height: 120px; border-radius: 8px; background: #1f56c8; filter: url(#grain); }',
          '.note-txt { font-size: 12px; color: #6b7280; }'
        ].join('\n'),
        checks: [
          'ok(/url\\("?#grain"?\\)/.test(style(".noise", "filter")), "滤镜要指向 SVG 里的 filter id")',
          'count(".noise", 1, "那个引用 SVG 滤镜的盒子还在")',
          'count(".note-txt", 1, "说明文字在页面里")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: 'SVG 的 `<svg>` 块设成 `width="0" height="0"` 就够了：它只提供定义，不占地方。`aria-hidden="true"` 免得读屏软件念一堆空内容。'
      },
      {
        kind: 'exercise',
        id: 'ex15-1',
        title: '把图片变成黑白',
        task: [
          '给 `.photo` 加滤镜，让它完全变成灰阶。',
          '',
          '要求：只改 `css` 栏。'
        ].join('\n'),
        height: 210,
        starter: {
          html: '<div class="photo"></div>',
          css: [
            '.photo { width: 100%; height: 140px; border-radius: 8px; background: linear-gradient(120deg, #f59e0b, #b91c1c); }'
          ].join('\n')
        },
        solution: {
          css: [
            '.photo { width: 100%; height: 140px; border-radius: 8px; background: linear-gradient(120deg, #f59e0b, #b91c1c); filter: grayscale(1); }'
          ].join('\n')
        },
        tests: [
          'eq(style(".photo", "filter"), "grayscale(1)", "完全灰阶：参数是 1，不是 0")',
          'near(rect(".photo").h, 140, 2, "滤镜不改变盒子尺寸")'
        ],
        hints: [
          '`grayscale(0)` 是原样，`grayscale(1)` 才是全灰。',
          '参数可以只写数字，`1` 和 `100%` 等价；写数字更稳。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex15-2',
        title: '先模糊，再提对比度',
        task: [
          '给 `.banner` 加两个滤镜，**按顺序**写：先 `blur(3px)`，再 `contrast(1.5)`。',
          '',
          '要求：只改 `css` 栏；顺序不能反。'
        ].join('\n'),
        height: 210,
        starter: {
          html: '<div class="banner"></div>',
          css: [
            '.banner { width: 100%; height: 140px; border-radius: 8px; background: linear-gradient(120deg, #1f56c8, #7a3ec8); }'
          ].join('\n')
        },
        solution: {
          css: [
            '.banner { width: 100%; height: 140px; border-radius: 8px; background: linear-gradient(120deg, #1f56c8, #7a3ec8);',
            '  filter: blur(3px) contrast(1.5); }'
          ].join('\n')
        },
        tests: [
          'ok(/blur\\(3px\\)/.test(style(".banner", "filter")), "第一个滤镜是 3px 的模糊")',
          'ok(/contrast\\(1.5\\)/.test(style(".banner", "filter")), "第二个滤镜是对比度 1.5")',
          'ok(style(".banner", "filter").indexOf("blur") < style(".banner", "filter").indexOf("contrast"), "顺序：blur 写在 contrast 前面")'
        ],
        hints: [
          '两个函数写在同一个 `filter` 里，中间用空格隔开。',
          '计算值会按你书写的顺序回显，所以顺序可以用 `indexOf` 比出来。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex15-3',
        title: '给不规则形状加投影',
        task: [
          '`.blob` 被 `clip-path` 裁成了一个八边形。现在要用 `filter` 给它加投影：偏移 4px、模糊 6px、颜色半透明黑。',
          '',
          '要求：只改 `css` 栏；不要动 `clip-path`（`box-shadow` 在这种形状上会露出方角，这题要的就是避开它）。'
        ].join('\n'),
        height: 220,
        starter: {
          html: '<div class="blob"></div>',
          css: [
            '.blob { width: 140px; height: 120px; background: #1f56c8;',
            '  clip-path: polygon(29% 0, 71% 0, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0 71%, 0 29%); }'
          ].join('\n')
        },
        solution: {
          css: [
            '.blob { width: 140px; height: 120px; background: #1f56c8;',
            '  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));',
            '  clip-path: polygon(29% 0, 71% 0, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0 71%, 0 29%); }'
          ].join('\n')
        },
        tests: [
          'ok(/drop-shadow/.test(style(".blob", "filter")), "要用 drop-shadow，不是 box-shadow")',
          'ok(/polygon/.test(style(".blob", "clip-path")), "原来的裁剪要留着")',
          'near(rect(".blob").w, 140, 2, "裁剪与滤镜都不改变盒子宽度")'
        ],
        hints: [
          '`drop-shadow(横向偏移 纵向偏移 模糊半径 颜色)`，四个参数之间用空格。',
          '`box-shadow` 投的是**盒子**的影子，`drop-shadow` 投的是**画出来的形状**的影子。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex15-4',
        title: '去掉 SVG 滤镜自带的糊边',
        task: [
          '这段 SVG 滤镜后面接了一串算子，但颗粒整体糊成一片。原因在第一个算子的 `baseFrequency` 太大。',
          '',
          '把它的 `baseFrequency` 改成 `0.8`，噪声频率低一点、颗粒更大更清楚。',
          '',
          '要求：只改 `html` 栏里的那一个数值，别动别的属性。'
        ].join('\n'),
        height: 220,
        starter: {
          html: [
            '<svg width="0" height="0" aria-hidden="true">',
            '  <filter id="grain2">',
            '    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>',
            '    <feColorMatrix in="n" type="saturate" values="0"/>',
            '    <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>',
            '  </filter>',
            '</svg>',
            '<div class="grainy"></div>'
          ].join('\n'),
          css: [
            '.grainy { height: 130px; border-radius: 8px; background: #7a3ec8; filter: url(#grain2); }'
          ].join('\n')
        },
        solution: {
          html: [
            '<svg width="0" height="0" aria-hidden="true">',
            '  <filter id="grain2">',
            '    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="n"/>',
            '    <feColorMatrix in="n" type="saturate" values="0"/>',
            '    <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>',
            '  </filter>',
            '</svg>',
            '<div class="grainy"></div>'
          ].join('\n')
        },
        tests: [
          'ok(count("feTurbulence", 1) && attr("feTurbulence", "baseFrequency") === "0.8", "baseFrequency 要改成 0.8");',
          'eq(attr("feTurbulence", "baseFrequency"), "0.8", "再确认一次这个属性值");',
          'ok(/url\\("?#grain2"?\\)/.test(style(".grainy", "filter")), "盒子还是引用这个滤镜 id")'
        ],
        hints: [
          '改的是 `<feTurbulence>` 标签上的 `baseFrequency` 属性值，别去动 CSS。',
          '`type` 保持 `fractalNoise`（它更像颗粒，`turbulence` 更像烟雾）。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
