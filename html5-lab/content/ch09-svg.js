/* ch09 — 内联 SVG */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch09',
    title: '第 9 章 · 内联 SVG',
    goal: '写出一张能随容器缩放的内联 SVG：用形状与路径画出内容，用 CSS 控制颜色与描边。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 坐标从左上角开始',
          '',
          '`svg` 直接写在 HTML 里，和 `p`、`div` 一样是文档的一部分。里面的图形由标签描述，浏览器按矢量渲染，放大不糊。',
          '',
          '`svg` 有一套自己的坐标：x 向右，y 向下，原点 `(0, 0)` 在左上角。这跟数学课上 y 轴向上的画法相反，下笔前先记住。两个属性决定它怎么显示：',
          '',
          '- `viewBox="0 0 100 100"`：把图形内部的坐标框定为宽 100、高 100，起点在 `(0, 0)`。',
          '- `width` / `height`：这张图在页面上占多少像素。',
          '',
          '分工是：`viewBox` 定坐标系，`width` / `height` 定尺寸。只写尺寸不写 `viewBox`，图形不会跟着容器缩放；写了 `viewBox`，同一份坐标可以画成任意大小。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'viewBox 把 100×100 的坐标系缩进 120 的窗',
        height: 165,
        html: [
          '<svg width="120" height="120" viewBox="0 0 100 100">',
          '  <rect x="0" y="0" width="100" height="100" fill="#f0eee6"></rect>',
          '  <circle cx="12" cy="12" r="10" fill="#e05a3a"></circle>',
          '  <circle cx="88" cy="88" r="10" fill="#3a6ea5"></circle>',
          '</svg>'
        ].join('\n'),
        checks: [
          'eq(attr("svg", "viewBox"), "0 0 100 100", "viewBox 定的坐标系")',
          'eq(attr("svg", "width"), "120", "svg 在页面上的宽度")',
          'count("circle", 2, "两个圆分别落在左上和右下")',
          'eq(attr("circle", "cx"), "12", "第一个圆的圆心 x")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 七个基本形状',
          '',
          '形状标签靠属性描述自己和位置：',
          '',
          '- `rect` 矩形：`x` `y` `width` `height`',
          '- `circle` 圆：`cx` `cy` `r`',
          '- `ellipse` 椭圆：`cx` `cy` `rx` `ry`',
          '- `line` 线段：`x1` `y1` `x2` `y2`',
          '- `polyline` 折线与 `polygon` 多边形：一串 `points`，形如 `x,y x,y x,y`',
          '- `path` 任意路径：`d` 里写 `M`（起点）、`L`（直线）、`C`（曲线）、`Z`（闭合）等指令',
          '',
          '`polyline` 不闭合，`polygon` 自动把最后一个点连回第一个点。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '七种形状各画一个',
        height: 170,
        html: [
          '<svg width="300" height="120" viewBox="0 0 300 120">',
          '  <rect x="10" y="10" width="40" height="40" fill="#e05a3a"></rect>',
          '  <circle cx="85" cy="30" r="20" fill="#3a6ea5"></circle>',
          '  <ellipse cx="145" cy="30" rx="28" ry="18" fill="#7a9a8a"></ellipse>',
          '  <line x1="190" y1="10" x2="230" y2="50" stroke="#2f2a24" stroke-width="3"></line>',
          '  <polyline points="245,50 265,10 285,50" fill="none" stroke="#c98a2b" stroke-width="3"></polyline>',
          '  <polygon points="30,70 50,110 10,110" fill="#8a5a7a"></polygon>',
          '  <path d="M90 110 C 110 70, 150 70, 170 110" fill="none" stroke="#2f2a24" stroke-width="3"></path>',
          '</svg>'
        ].join('\n'),
        checks: [
          'count("rect", 1, "一个矩形")',
          'count("ellipse", 1, "一个椭圆")',
          'eq(attr("ellipse", "rx"), "28", "椭圆的横半径")',
          'eq(attr("line", "stroke-width"), "3", "线段的粗细")',
          'eq(attr("polyline", "fill"), "none", "折线只描边、不填充")',
          'eq(attr("polygon", "points"), "30,70 50,110 10,110", "多边形的三个顶点")',
          'count("path", 1, "一条路径")'
        ]
      },
      {
        kind: 'table',
        head: ['形状', '画什么', '关键属性'],
        rows: [
          ['`rect`', '矩形', '`x` `y` `width` `height`'],
          ['`circle`', '圆', '`cx` `cy` `r`'],
          ['`ellipse`', '椭圆', '`cx` `cy` `rx` `ry`'],
          ['`line`', '线段', '`x1` `y1` `x2` `y2`'],
          ['`polyline`', '折线，不闭合', '`points`'],
          ['`polygon`', '多边形，自动闭合', '`points`'],
          ['`path`', '任意路径', '`d`']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 上色：fill 与 stroke',
          '',
          '`fill` 决定填充，`stroke` 决定描边，`stroke-width` 决定描边粗细。这三个既能写成元素上的属性，也能写成 CSS：',
          '',
          '- 属性写法：`<rect fill="#e05a3a" stroke="#2f2a24" stroke-width="3">`',
          '- CSS 写法：`.dot { fill: #e05a3a; stroke: #2f2a24; stroke-width: 3px; }`',
          '',
          '两条规则要记住：CSS 的 `fill` / `stroke` 会盖过元素上的同名属性，两边都写时以 CSS 为准；不填充就写 `fill="none"`，纯描边的折线必须这么写，否则会被当成多边形填起来。',
          '',
          'CSS 写法更划算：一组图形共用颜色时改一处就够，鼠标悬停之类的状态也能直接写在 CSS 里。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一张图，颜色全交给 CSS',
        height: 160,
        html: [
          '<svg width="200" height="90" viewBox="0 0 200 90">',
          '  <rect class="panel" x="0" y="0" width="200" height="90"></rect>',
          '  <circle class="dot" cx="60" cy="45" r="24"></circle>',
          '  <circle class="dot alt" cx="120" cy="45" r="24"></circle>',
          '</svg>'
        ].join('\n'),
        css: [
          '.panel { fill: #f0eee6; }',
          '.dot { fill: #e05a3a; }',
          '.dot.alt { fill: #3a6ea5; }'
        ].join('\n'),
        checks: [
          'eq(style(".panel", "fill"), "rgb(240, 238, 230)", "面板底色")',
          'eq(style(".dot", "fill"), "rgb(224, 90, 58)", "第一个圆")',
          'eq(style(".dot.alt", "fill"), "rgb(58, 110, 165)", "第二个圆被第二条规则改掉")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`viewBox` 定坐标系，`width` / `height` 定尺寸。只写 `width` / `height` 不写 `viewBox`，图形不会随容器缩放；写练习里的图尺寸时，两者一起写。'
      },
      {
        kind: 'prose',
        md: [
          '## g 分组与 transform',
          '',
          '`g` 把若干图形归成一组，可以整组设属性，也可以整组变换：`transform="translate(dx dy)"` 平移，`rotate(角度)` 旋转，`scale(倍数)` 缩放。组里的坐标都相对组自己的原点。',
          '',
          '`text` 在 `svg` 里放文字，位置由 `x` `y` 定；`tspan` 放在 `text` 里，给其中一段单独换色或换位置。',
          '',
          '## 什么时候用 SVG，什么时候用 canvas',
          '',
          '- 图标、图表、示意图、要随窗口缩放的线条：用 `svg`。它是 DOM，能用 CSS 上色、能绑事件、能被读屏软件读到。',
          '- 成千上万个点、逐帧重绘的游戏或数据可视化：用 `canvas`。它是一块位图，画完只记得像素，元素再多也不会拖慢 DOM。',
          '',
          '判断标准很直接：数量少、要交互、要用 CSS 控制，选 `svg`；要画的是海量点、每帧重绘，选 `canvas`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'g 整体平移，text 里的 tspan 还能分段换色',
        height: 165,
        html: [
          '<svg width="240" height="100" viewBox="0 0 240 100">',
          '  <g transform="translate(20 20)">',
          '    <rect x="0" y="0" width="60" height="60" rx="8" fill="#3a6ea5"></rect>',
          '    <circle cx="30" cy="30" r="18" fill="#f0eee6"></circle>',
          '  </g>',
          '  <text x="100" y="55" fill="#2f2a24">水位 <tspan fill="#e05a3a">偏高</tspan></text>',
          '</svg>'
        ].join('\n'),
        checks: [
          'eq(attr("g", "transform"), "translate(20 20)", "g 的平移")',
          'eq(tag("g > rect"), "rect", "组里先画矩形")',
          'eq(text("text"), "水位 偏高", "文字与 tspan 拼出的内容")',
          'has("text tspan", "tspan 是 text 里的分段")',
          'eq(attr("text tspan", "fill"), "#e05a3a", "tspan 单独换了颜色")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`fill` / `stroke` 写两处时 CSS 赢。同一张图别既在属性上改颜色又在 CSS 里改，否则回头看时你会分不清到底是谁生效。'
      },
      {
        kind: 'exercise',
        id: 'ex09-1',
        title: '给 SVG 装上坐标系',
        height: 190,
        task: [
          '下面这个矩形画在 0 到 100 的坐标里，但 `svg` 没有告诉浏览器这套坐标。',
          '',
          '给它加上 `viewBox="0 0 100 100"`，让 100×100 的坐标缩进 60×60 的窗。'
        ].join('\n'),
        starter: {
          html: [
            '<svg width="60" height="60">',
            '  <rect x="0" y="0" width="100" height="100" fill="#7a9a8a"></rect>',
            '</svg>'
          ].join('\n')
        },
        solution: {
          html: [
            '<svg width="60" height="60" viewBox="0 0 100 100">',
            '  <rect x="0" y="0" width="100" height="100" fill="#7a9a8a"></rect>',
            '</svg>'
          ].join('\n')
        },
        tests: [
          'eq(attr("svg", "viewBox"), "0 0 100 100", "svg 的 viewBox")',
          'eq(attr("svg", "width"), "60", "svg 的宽度")',
          'eq(attr("rect", "width"), "100", "矩形仍画在 100 的坐标系里")'
        ],
        hints: [
          '`viewBox` 的四个数是「起点 x、起点 y、宽、高」，全写在同一对引号里，用空格隔开。',
          '它写在 `svg` 开始标签上，和 `width` / `height` 并排。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-2',
        title: '用三个圆画一个靶',
        height: 250,
        task: [
          '在下面的 `svg` 里画三个同心圆当靶子，圆心都在 `(50, 50)`，半径从大到小是 **40、26、12**。',
          '',
          '先画大的，后画的会盖在上面。最外两圈填不同颜色就行。'
        ].join('\n'),
        starter: {
          html: [
            '<svg width="160" height="160" viewBox="0 0 100 100">',
            '  <rect x="0" y="0" width="100" height="100" fill="#f3efe7"></rect>',
            '</svg>'
          ].join('\n')
        },
        solution: {
          html: [
            '<svg width="160" height="160" viewBox="0 0 100 100">',
            '  <rect x="0" y="0" width="100" height="100" fill="#f3efe7"></rect>',
            '  <circle cx="50" cy="50" r="40" fill="#e05a3a"></circle>',
            '  <circle cx="50" cy="50" r="26" fill="#f3efe7"></circle>',
            '  <circle cx="50" cy="50" r="12" fill="#e05a3a"></circle>',
            '</svg>'
          ].join('\n')
        },
        tests: [
          'count("circle", 3, "三个圆")',
          'eq($$("circle").map(function (c) { return c.getAttribute("r"); }), ["40", "26", "12"], "三圈的半径")',
          'eq(attr("circle", "cx"), "50", "圆心 x")',
          'eq(attr("circle", "cy"), "50", "圆心 y")'
        ],
        hints: [
          '圆的圆心用 `cx` / `cy`，半径用 `r`，三个圆这三个值都一样，只有 `r` 不同。',
          '想画出环，就让相邻两圈填不同的颜色：红、白、红。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-3',
        title: '用折线画一条走势',
        height: 250,
        task: [
          '用 `polyline` 画一条折线，依次经过四个点：`10,70`、`40,30`、`70,55`、`100,20`（写成 `points`）。',
          '',
          '折线只描边、不填充。'
        ].join('\n'),
        starter: {
          html: [
            '<svg width="140" height="100" viewBox="0 0 120 90">',
            '  <!-- TODO：在这里画一条折线 -->',
            '</svg>'
          ].join('\n')
        },
        solution: {
          html: [
            '<svg width="140" height="100" viewBox="0 0 120 90">',
            '  <polyline points="10,70 40,30 70,55 100,20" fill="none" stroke="#3a6ea5" stroke-width="3"></polyline>',
            '</svg>'
          ].join('\n')
        },
        tests: [
          'has("polyline", "走一条折线")',
          'eq(attr("polyline", "points"), "10,70 40,30 70,55 100,20", "四个转折点")',
          'eq(attr("polyline", "fill"), "none", "折线不填充")',
          'has("polyline[stroke]", "折线要有描边颜色")'
        ],
        hints: [
          '`points` 是一串「x,y」，点之间用空格隔开：`points="10,70 40,30"`。',
          '不写 `fill="none"`，浏览器会把首尾连起来当成多边形填满。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-4',
        title: '改用 CSS 给图形上色',
        height: 210,
        task: [
          '这张图现在用 `fill` 属性上色。把颜色搬到 CSS 里：',
          '',
          '- `.bg` 填 `#f0eee6`',
          '- `.dot` 填 `#e05a3a`，并加一条 `3px` 的 `#2f2a24` 描边',
          '',
          '改完以后，元素上的 `fill` 属性可以留着——CSS 会盖过它。'
        ].join('\n'),
        starter: {
          html: [
            '<svg width="140" height="90" viewBox="0 0 140 90">',
            '  <rect class="bg" x="0" y="0" width="140" height="90" fill="#cccccc"></rect>',
            '  <circle class="dot" cx="70" cy="45" r="26" fill="#888888"></circle>',
            '</svg>'
          ].join('\n'),
          css: '/* TODO：用 CSS 给 .bg 和 .dot 上色 */'
        },
        solution: {
          html: [
            '<svg width="140" height="90" viewBox="0 0 140 90">',
            '  <rect class="bg" x="0" y="0" width="140" height="90" fill="#cccccc"></rect>',
            '  <circle class="dot" cx="70" cy="45" r="26" fill="#888888"></circle>',
            '</svg>'
          ].join('\n'),
          css: [
            '.bg { fill: #f0eee6; }',
            '.dot { fill: #e05a3a; stroke: #2f2a24; stroke-width: 3px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".dot", "fill"), "rgb(224, 90, 58)", "圆被 CSS 填成红色")',
          'eq(style(".dot", "stroke"), "rgb(47, 42, 36)", "圆的描边颜色")',
          'eq(style(".dot", "stroke-width"), "3px", "描边粗细")',
          'eq(style(".bg", "fill"), "rgb(240, 238, 230)", "底色也被 CSS 改掉")'
        ],
        hints: [
          '选择器就用元素上的 class：`.dot { … }`。',
          'CSS 里的长度要带单位：写成 `stroke-width: 3px`，不是 `3`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-5',
        title: '用 g 把一组图形整体移位',
        height: 210,
        task: [
          '下面 `g` 里是一枚靶心图标，画在左上角。',
          '',
          '- 给 `g` 加 `transform="translate(80 0)"`，把整组右移 80。',
          '- 在 `g` 里加一段文字 `<text x="48" y="45" fill="#2f2a24">北</text>`，让它跟着一起平移。'
        ].join('\n'),
        starter: {
          html: [
            '<svg width="200" height="80" viewBox="0 0 200 80">',
            '  <g>',
            '    <circle cx="20" cy="40" r="16" fill="#e05a3a"></circle>',
            '    <circle cx="20" cy="40" r="7" fill="#f0eee6"></circle>',
            '  </g>',
            '</svg>'
          ].join('\n')
        },
        solution: {
          html: [
            '<svg width="200" height="80" viewBox="0 0 200 80">',
            '  <g transform="translate(80 0)">',
            '    <circle cx="20" cy="40" r="16" fill="#e05a3a"></circle>',
            '    <circle cx="20" cy="40" r="7" fill="#f0eee6"></circle>',
            '    <text x="48" y="45" fill="#2f2a24">北</text>',
            '  </g>',
            '</svg>'
          ].join('\n')
        },
        tests: [
          'eq(attr("g", "transform"), "translate(80 0)", "g 整体右移 80")',
          'eq(tag("g > text"), "text", "文字放进组里")',
          'eq(text("text"), "北", "文字内容")',
          'eq(attr("g > text", "fill"), "#2f2a24", "文字颜色")'
        ],
        hints: [
          '`translate(80 0)` 的两个数是横向和纵向的偏移，第二个 0 表示只在横向移。',
          '`text` 写在 `g` 里面，它才跟图形一起被平移。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
