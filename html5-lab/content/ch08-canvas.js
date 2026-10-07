/* ch08 — Canvas 绘图 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch08',
    title: '第 8 章 · Canvas 绘图',
    goal: '用 canvas 的宽高属性与 2D 上下文，写出能画矩形、线条、圆和文字的脚本。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 一块由脚本画满的位图',
          '',
          '`<canvas>` 在页面上是一块没有内容的矩形。它有多少像素，由标签上的 `width` 和 `height` 属性决定，默认 300×150。',
          '不写这两个属性、只用 CSS 改大小，画出来的东西会跟着拉伸变糊：CSS 改的是显示尺寸，属性改的才是画布本身有多少像素。',
          '',
          '画布上的东西不在 DOM 里，是一堆像素。读屏软件读不到，文字也选不中——需要被读懂的文本仍然要写成真正的标签。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '320×200 的画布，一个填充矩形',
        height: 280,
        html: '<canvas id="board" width="320" height="200"></canvas>',
        js: [
          "var board = document.getElementById('board');",
          "var ctx = board.getContext('2d');",
          "console.log('画布 ' + board.width + 'x' + board.height);",
          "ctx.fillStyle = '#c9532f';",
          'ctx.fillRect(20, 20, 140, 80);'
        ].join('\n'),
        checks: [
          'eq(attr("canvas", "width"), "320", "canvas 的 width 属性")',
          'eq(attr("canvas", "height"), "200", "canvas 的 height 属性")',
          'eq(logs[0], "画布 320x200", "脚本读到的画布尺寸")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `getContext` 才是那支笔',
          '',
          '画布元素本身不会画东西，所有绘制都通过它的上下文：',
          '',
          '- `ctx.fillStyle` 决定填充色，`ctx.fillRect(x, y, 宽, 高)` 画一个实心矩形',
          '- `ctx.strokeStyle` 决定描边色，`ctx.strokeRect(x, y, 宽, 高)` 画一个空心矩形',
          '- 坐标原点在画布左上角，`x` 向右增大，`y` 向下增大',
          '',
          '`getContext(\'2d\')` 返回的就是 `ctx`，同一块画布上反复调它拿到的是同一个上下文。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '描边矩形与一条线',
        height: 240,
        html: '<canvas id="panel" width="240" height="140"></canvas>',
        js: [
          "var ctx = document.getElementById('panel').getContext('2d');",
          "ctx.strokeStyle = '#234f6b';",
          'ctx.lineWidth = 6;',
          'ctx.strokeRect(20, 20, 80, 60);',
          'ctx.beginPath();',
          'ctx.moveTo(130, 110);',
          'ctx.lineTo(220, 30);',
          'ctx.stroke();',
          "console.log('线宽 ' + ctx.lineWidth);"
        ].join('\n'),
        checks: [
          'has("canvas#panel", "画布要有 id，脚本才找得到它")',
          'eq(attr("canvas", "width"), "240", "画布的 width 属性")',
          'eq(logs[0], "线宽 6", "脚本读到的线宽")'
        ]
      },
      {
        kind: 'table',
        code: true,
        head: ['调用', '作用'],
        rows: [
          ['fillRect(x, y, w, h)', '实心矩形，颜色取 fillStyle'],
          ['strokeRect(x, y, w, h)', '空心矩形，颜色取 strokeStyle'],
          ['beginPath()', '开始一条新路径'],
          ['moveTo(x, y) / lineTo(x, y)', '移到起点 / 连一段直线'],
          ['stroke()', '把当前路径画出来'],
          ['arc(x, y, r, 起, 止)', '圆弧，整圆从 0 到 Math.PI * 2'],
          ['fillText(文字, x, y)', '写字，字体和字号取 font'],
          ['clearRect(x, y, w, h)', '擦掉一块，恢复透明']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '画布的 `width` / `height` 属性与 CSS 的 `width` / `height` 是两回事。属性决定画布有多少像素，CSS 只负责把这块像素拉伸到多大显示。只改 CSS，线条和文字会一起变糊。'
      },
      {
        kind: 'prose',
        md: [
          '## 路径与圆',
          '',
          '矩形是一个方法就画完的，任意形状要走路径：`beginPath()` 开始一条新路径，`moveTo(x, y)` 把笔移过去，`lineTo(x, y)` 连一段直线，最后 `stroke()` 才把它画出来。`beginPath()` 之前画的路径，会被之后的 `stroke()` 一起再描一遍。',
          '',
          '圆用 `arc(圆心x, 圆心y, 半径, 起始角, 结束角)`。角度用弧度：整圆是 `0` 到 `Math.PI * 2`，半圆是 `0` 到 `Math.PI`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一个填充圆',
        height: 220,
        html: '<canvas id="dot" width="240" height="160"></canvas>',
        js: [
          "var ctx = document.getElementById('dot').getContext('2d');",
          "ctx.fillStyle = '#e0a63c';",
          'var r = 46;',
          'ctx.beginPath();',
          'ctx.arc(70, 70, r, 0, Math.PI * 2);',
          'ctx.fill();',
          "console.log('半径 ' + r + '，直径 ' + r * 2);"
        ].join('\n'),
        checks: [
          'eq(attr("canvas", "height"), "160", "画布的 height 属性")',
          'eq(logs[0], "半径 46，直径 92", "脚本算出的直径")',
          'has("canvas#dot", "画布要有 id")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 文字与字体',
          '',
          '文字用 `fillText(文字, x, y)`，`y` 是文字基线的位置。字号和字体写在上下文的 `font` 上，写法跟 CSS 的 `font` 简写一样，至少要给字号和字体名：`ctx.font = \'20px system-ui\'`。',
          '',
          '重画之前先 `clearRect(0, 0, 画布宽, 画布高)` 把整块画布擦干净，否则新的图形会叠在旧的上面。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '画布上的像素没法从 DOM 里读出来。本章的练习要求你把绘制写成接收上下文的函数，比如 `function drawRect(ctx) { … }`，检验会传给它一个假的上下文，看你调用了哪些方法、参数是多少。'
      },
      {
        kind: 'demo',
        caption: '先擦干净，再写一行字',
        height: 200,
        html: '<canvas id="poster" width="280" height="120"></canvas>',
        js: [
          "var canvas = document.getElementById('poster');",
          'var ctx = canvas.getContext("2d");',
          'ctx.clearRect(0, 0, canvas.width, canvas.height);',
          "ctx.font = 'bold 24px system-ui';",
          "ctx.fillStyle = '#234f6b';",
          "var title = 'HTML5 训练场';",
          'ctx.fillText(title, 16, 70);',
          "console.log('文字：' + title);"
        ].join('\n'),
        checks: [
          'eq(attr("canvas", "width"), "280", "画布的 width 属性")',
          'has("canvas#poster", "画布要有 id")',
          'eq(logs[0], "文字：HTML5 训练场", "脚本写下的文字")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-1',
        title: '把画布调成 400×240',
        task: [
          '这块画布现在用的是默认尺寸 300×150，下面的脚本已经拿到了上下文。',
          '',
          '要求：',
          '- 把画布改成宽 400、高 240，写在标签属性上',
          '- 在脚本里把这尺寸打印出来，格式是 `宽x高`，也就是 `400x240`'
        ].join('\n'),
        starter: {
          html: '<canvas id="board"></canvas>',
          js: [
            "var board = document.getElementById('board');",
            "var ctx = board.getContext('2d');",
            '// TODO: 打印画布尺寸'
          ].join('\n')
        },
        solution: {
          html: '<canvas id="board" width="400" height="240"></canvas>',
          js: [
            "var board = document.getElementById('board');",
            "var ctx = board.getContext('2d');",
            "console.log(board.width + 'x' + board.height);"
          ].join('\n')
        },
        tests: [
          'eq(attr("canvas", "width"), "400", "canvas 的 width 属性")',
          'eq(attr("canvas", "height"), "240", "canvas 的 height 属性")',
          'eq(logs[0], "400x240", "脚本打印的画布尺寸")'
        ],
        hints: [
          '尺寸是标签上的 `width` 和 `height` 属性，不是 CSS 里的 `width` / `height`。',
          '`board.width` 读到的是数字 400，用 `+` 拼字符串会自动转成文本。'
        ],
        height: 300
      },
      {
        kind: 'exercise',
        id: 'ex08-2',
        title: '写一个画矩形的函数',
        task: [
          '画布是 200×140。补完顶层的 `function drawRect(ctx)`：',
          '',
          '- 用 `ctx.fillStyle` 把填充色设成 `#c9532f`',
          '- 用 `ctx.fillRect(20, 30, 120, 60)` 画一个实心矩形',
          '',
          '脚本最后已经调用了一次 `drawRect`，把矩形画到画布上。'
        ].join('\n'),
        starter: {
          html: '<canvas id="panel" width="200" height="140"></canvas>',
          js: [
            'function drawRect(ctx) {',
            '  // TODO: 设填充色，再画矩形',
            '}',
            "drawRect(document.getElementById('panel').getContext('2d'));"
          ].join('\n')
        },
        solution: {
          html: '<canvas id="panel" width="200" height="140"></canvas>',
          js: [
            'function drawRect(ctx) {',
            "  ctx.fillStyle = '#c9532f';",
            '  ctx.fillRect(20, 30, 120, 60);',
            '}',
            "drawRect(document.getElementById('panel').getContext('2d'));"
          ].join('\n')
        },
        tests: [
          'eq(typeof fn("drawRect"), "function", "要有一个全局的 drawRect 函数")',
          [
            'var calls = [];',
            'var fake = { fillStyle: null, fillRect: function (x, y, w, h) { calls.push([x, y, w, h]); } };',
            'fn("drawRect")(fake);',
            'eq(fake.fillStyle, "#c9532f", "ctx.fillStyle 的取值")',
            'eq(calls[0], [20, 30, 120, 60], "fillRect 的四个参数")'
          ].join('\n'),
          'has("canvas#panel", "画布还在")'
        ],
        hints: [
          '函数体里直接用传进来的 `ctx`，不要再 `getContext` 一次。',
          '`fillRect` 的四个参数依次是左边距、上边距、宽、高。'
        ],
        height: 280
      },
      {
        kind: 'exercise',
        id: 'ex08-3',
        title: '画一条线',
        task: [
          '补完顶层的 `function drawLine(ctx)`，按顺序做这四件事：',
          '',
          '1. `ctx.strokeStyle` 设成 `#234f6b`，`ctx.lineWidth` 设成 `4`',
          '2. `ctx.beginPath()`',
          '3. `ctx.moveTo(20, 20)`，再 `ctx.lineTo(160, 90)`',
          '4. `ctx.stroke()`',
          '',
          '脚本最后已经调用了一次 `drawLine`。'
        ].join('\n'),
        starter: {
          html: '<canvas id="panel" width="200" height="140"></canvas>',
          js: [
            'function drawLine(ctx) {',
            '  // TODO',
            '}',
            "drawLine(document.getElementById('panel').getContext('2d'));"
          ].join('\n')
        },
        solution: {
          html: '<canvas id="panel" width="200" height="140"></canvas>',
          js: [
            'function drawLine(ctx) {',
            "  ctx.strokeStyle = '#234f6b';",
            '  ctx.lineWidth = 4;',
            '  ctx.beginPath();',
            '  ctx.moveTo(20, 20);',
            '  ctx.lineTo(160, 90);',
            '  ctx.stroke();',
            '}',
            "drawLine(document.getElementById('panel').getContext('2d'));"
          ].join('\n')
        },
        tests: [
          'eq(typeof fn("drawLine"), "function", "要有一个全局的 drawLine 函数")',
          [
            'var calls = [];',
            'var fake = {',
            '  strokeStyle: null, lineWidth: 0,',
            '  beginPath: function () { calls.push(["beginPath"]); },',
            '  moveTo: function (x, y) { calls.push(["moveTo", x, y]); },',
            '  lineTo: function (x, y) { calls.push(["lineTo", x, y]); },',
            '  stroke: function () { calls.push(["stroke"]); }',
            '};',
            'fn("drawLine")(fake);',
            'eq(fake.strokeStyle, "#234f6b", "ctx.strokeStyle 的取值")',
            'eq(fake.lineWidth, 4, "ctx.lineWidth 的取值")',
            'eq(calls[0], ["beginPath"], "第一件事是 beginPath")',
            'eq(calls[1], ["moveTo", 20, 20], "起点")',
            'eq(calls[2], ["lineTo", 160, 90], "终点")',
            'eq(calls[3], ["stroke"], "最后 stroke")'
          ].join('\n'),
          'count("canvas", 1, "画布还在")'
        ],
        hints: [
          '路径只是一串命令，`moveTo` / `lineTo` 不会立刻画出东西，`stroke()` 才落笔。',
          '`beginPath()` 写在 `moveTo` 前面，否则新的线会连着上一条路径的末尾。'
        ],
        height: 280
      },
      {
        kind: 'exercise',
        id: 'ex08-4',
        title: '画一个填充圆',
        task: [
          '补完顶层的 `function drawCircle(ctx, cx, cy, r)`：',
          '',
          '- 把 `ctx.fillStyle` 设成 `#e0a63c`',
          '- `ctx.beginPath()`',
          '- `ctx.arc(cx, cy, r, 0, Math.PI * 2)`，圆心和半径用传进来的参数',
          '- `ctx.fill()`',
          '',
          '脚本最后已经用圆心 (80, 70)、半径 45 调用了一次。'
        ].join('\n'),
        starter: {
          html: '<canvas id="panel" width="200" height="160"></canvas>',
          js: [
            'function drawCircle(ctx, cx, cy, r) {',
            '  // TODO',
            '}',
            "drawCircle(document.getElementById('panel').getContext('2d'), 80, 70, 45);"
          ].join('\n')
        },
        solution: {
          html: '<canvas id="panel" width="200" height="160"></canvas>',
          js: [
            'function drawCircle(ctx, cx, cy, r) {',
            "  ctx.fillStyle = '#e0a63c';",
            '  ctx.beginPath();',
            '  ctx.arc(cx, cy, r, 0, Math.PI * 2);',
            '  ctx.fill();',
            '}',
            "drawCircle(document.getElementById('panel').getContext('2d'), 80, 70, 45);"
          ].join('\n')
        },
        tests: [
          'eq(typeof fn("drawCircle"), "function", "要有一个全局的 drawCircle 函数")',
          [
            'var calls = [];',
            'var fake = {',
            '  fillStyle: null,',
            '  beginPath: function () { calls.push(["beginPath"]); },',
            '  arc: function () { calls.push(["arc"].concat(Array.prototype.slice.call(arguments))); },',
            '  fill: function () { calls.push(["fill"]); }',
            '};',
            'fn("drawCircle")(fake, 80, 70, 45);',
            'eq(fake.fillStyle, "#e0a63c", "ctx.fillStyle 的取值")',
            'eq(calls[0], ["beginPath"], "先 beginPath")',
            'eq(calls[1][0], "arc", "第二步 arc")',
            'eq(calls[1].slice(1, 4), [80, 70, 45], "圆心和半径用传进来的参数")',
            'eq(calls[1][4], 0, "从 0 弧度开始")',
            'eq(calls[1][5], Math.PI * 2, "转到 Math.PI * 2")',
            'eq(calls[2], ["fill"], "最后 fill")'
          ].join('\n'),
          'count("canvas", 1, "画布还在")'
        ],
        hints: [
          '圆的四个参数别写死：`cx`、`cy`、`r` 就是函数收到的圆心和半径。',
          '弧度不是角度：一圈是 `Math.PI * 2`，约 6.283。'
        ],
        height: 280
      },
      {
        kind: 'exercise',
        id: 'ex08-5',
        title: '清空画布再写一行字',
        task: [
          '补完顶层的 `function drawTitle(canvas)`，参数是那块画布：',
          '',
          "1. `var ctx = canvas.getContext('2d')`",
          '2. `ctx.clearRect(0, 0, canvas.width, canvas.height)` 先把整块画布擦干净',
          "3. `ctx.font = '20px system-ui'`，`ctx.fillStyle` 设成 `#234f6b`",
          "4. `ctx.fillText('你好', 20, 40)`",
          '',
          '脚本最后已经用 `#poster` 调用了一次。'
        ].join('\n'),
        starter: {
          html: '<canvas id="poster" width="240" height="120"></canvas>',
          js: [
            'function drawTitle(canvas) {',
            '  // TODO',
            '}',
            "drawTitle(document.getElementById('poster'));"
          ].join('\n')
        },
        solution: {
          html: '<canvas id="poster" width="240" height="120"></canvas>',
          js: [
            'function drawTitle(canvas) {',
            "  var ctx = canvas.getContext('2d');",
            '  ctx.clearRect(0, 0, canvas.width, canvas.height);',
            "  ctx.font = '20px system-ui';",
            "  ctx.fillStyle = '#234f6b';",
            "  ctx.fillText('你好', 20, 40);",
            '}',
            "drawTitle(document.getElementById('poster'));"
          ].join('\n')
        },
        tests: [
          'eq(typeof fn("drawTitle"), "function", "要有一个全局的 drawTitle 函数")',
          [
            'var calls = [];',
            'var fakeCtx = {',
            '  font: "", fillStyle: null,',
            '  clearRect: function () { calls.push(["clearRect"].concat(Array.prototype.slice.call(arguments))); },',
            '  fillText: function () { calls.push(["fillText"].concat(Array.prototype.slice.call(arguments))); }',
            '};',
            'var fakeCanvas = { width: 240, height: 120, getContext: function (kind) { calls.push(["getContext", kind]); return fakeCtx; } };',
            'fn("drawTitle")(fakeCanvas);',
            'eq(calls[0], ["getContext", "2d"], "先拿到 2d 上下文")',
            'eq(calls[1], ["clearRect", 0, 0, 240, 120], "清空整块画布")',
            'eq(fakeCtx.font, "20px system-ui", "ctx.font 的取值")',
            'eq(calls[2], ["fillText", "你好", 20, 40], "写下的文字与位置")'
          ].join('\n'),
          'count("canvas", 1, "画布还在")'
        ],
        hints: [
          '擦除的范围要用画布自己的尺寸：`canvas.width`、`canvas.height`，不要写死数字。',
          '`font` 至少给字号和字体名，跟 CSS 的 `font` 简写一个写法。'
        ],
        height: 260
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
