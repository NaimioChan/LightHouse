/* ch10 — 现代标签 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch10',
    title: '第 10 章 · 现代标签',
    goal: '用一批原生就带行为的标签做出折叠、弹窗、进度、刻度与语义标注，大部分不用写 JavaScript。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 折叠与弹窗',
          '',
          '`details` 是一块能点开的折叠区，`summary` 是它露在外面的标题。点一下展开，再点收起，这个行为浏览器自带。',
          '',
          '`details` 上的 `open` 属性让它在页面打开时就展开：`<details open>`。',
          '',
          '`dialog` 是一块对话框。只写 `<dialog>` 它不显示；写上 `open` 属性会以非模态方式显示，铺在页面上但不挡操作；在 JS 里调 `dialog.showModal()` 则以模态方式弹出——带一层遮罩、焦点被关在里面、按 `Esc` 能关。`dialog.close()` 关掉它。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '两块折叠区，第一块默认展开',
        height: 175,
        html: [
          '<details open>',
          '  <summary>第一讲：挑相机</summary>',
          '  <p>机身够用就行，镜头更值得花钱。</p>',
          '</details>',
          '<details>',
          '  <summary>第二讲：测光</summary>',
          '  <p>先学会看直方图，再谈风格。</p>',
          '</details>'
        ].join('\n'),
        checks: [
          'count("details", 2, "两个折叠块")',
          'has("details[open]", "第一块默认展开")',
          'eq(text("summary"), "第一讲：挑相机", "第一块的标题")',
          'has("details > p", "展开区里有内容")'
        ]
      },
      {
        kind: 'demo',
        caption: '用 showModal() 弹一个带遮罩的对话框',
        height: 210,
        html: [
          '<button id="again">查看规则</button>',
          '<dialog id="rules">',
          '  <h3>进场规则</h3>',
          '  <p>带上自己的相机，教室里有备用机。</p>',
          '  <button id="ok">知道了</button>',
          '</dialog>'
        ].join('\n'),
        js: [
          'function openRules() {',
          '  document.getElementById("rules").showModal();',
          '}',
          'function closeRules() {',
          '  document.getElementById("rules").close();',
          '}',
          'document.getElementById("again").addEventListener("click", openRules);',
          'document.getElementById("ok").addEventListener("click", closeRules);',
          'openRules();'
        ].join('\n'),
        checks: [
          'has("dialog[open]", "示例打开时对话框已弹出")',
          'eq(tag("dialog > h3"), "h3", "对话框里有小标题")',
          'fn("openRules", "打开对话框的函数挂在全局")',
          'fn("closeRules", "关闭对话框的函数挂在全局")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 进度与刻度',
          '',
          '`progress` 画进度。给它 `value` 和 `max`，它是一根按比例走的进度条：`<progress value="30" max="100">`。不带 `value` 时它不知道进度，就一直转圈。',
          '',
          '`meter` 画一根带「好 / 一般 / 差」区间的刻度尺，比如电量、评分。`value` 是当前值，`min` / `max` 是量程（默认 0 到 1），`low` / `high` 划出偏低和偏高的分界，`optimum` 指出哪个范围最好——浏览器据此把刻度尺染成绿、黄或红。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '进度条、转圈、刻度尺',
        height: 165,
        html: [
          '<p>上传中 <progress id="upload" value="30" max="100"></progress></p>',
          '<p>处理中 <progress id="spin"></progress></p>',
          '<p>电量 <meter id="battery" value="0.35" low="0.25" high="0.75" optimum="1"></meter></p>'
        ].join('\n'),
        checks: [
          'eq(attr("#upload", "value"), "30", "上传进度的当前值")',
          'eq(attr("#upload", "max"), "100", "进度上限")',
          'eq(attr("#spin", "value"), null, "转圈的那个不写 value")',
          'eq(attr("#battery", "low"), "0.25", "meter 的低位分界")',
          'eq(attr("#battery", "high"), "0.75", "meter 的高位分界")',
          'eq(attr("#battery", "optimum"), "1", "meter 的最佳值")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 把含义写进标签',
          '',
          '一批标签用来说明「这段文字是什么」，读屏软件和搜索引擎读得到：',
          '',
          '- `mark` 高亮当前相关的一段文字，比如搜索结果里的关键词。',
          '- `time` 包住时间，`datetime` 给出机器可读的写法：`<time datetime="2026-10-06T20:00">今晚八点</time>`。',
          '- `abbr` 包住缩写，`title` 给出全称，鼠标停上去会显示。',
          '- `data` 包住数据，`value` 给出机器可读的值：`<data value="72">72 分贝</data>`。',
          '- `kbd` 表示键盘输入，`samp` 表示程序输出，`var` 表示变量名。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '时间、缩写、数据、高亮、按键',
        height: 210,
        html: [
          '<p>开课在 <time datetime="2026-10-06">10 月 6 日</time> 开始。</p>',
          '<p><abbr title="Cascading Style Sheets">CSS</abbr> 用来上色。</p>',
          '<p>教室里测到 <data value="72">72 分贝</data>。</p>',
          '<p>记住：<mark>带相机</mark>，别忘了电池。</p>',
          '<p>按 <kbd>Ctrl</kbd> + <kbd>R</kbd> 刷新；程序会打印 <samp>done</samp>；下标写作 <var>i</var>。</p>'
        ].join('\n'),
        checks: [
          'eq(attr("time", "datetime"), "2026-10-06", "time 的机器可读时间")',
          'eq(attr("abbr", "title"), "Cascading Style Sheets", "缩写的全称")',
          'eq(attr("data", "value"), "72", "data 的机器可读值")',
          'eq(text("data"), "72 分贝", "data 显示的文字")',
          'eq(text("mark"), "带相机", "高亮的几个字")',
          'count("kbd", 2, "两个按键")',
          'eq(tag("var"), "var", "变量名用 var")'
        ]
      },
      {
        kind: 'table',
        head: ['标签', '原生就有的行为'],
        rows: [
          ['`details` / `summary`', '点标题展开收起，`open` 属性控制默认展开'],
          ['`dialog` + `showModal()`', '带遮罩的模态弹窗，按 `Esc` 可关'],
          ['`progress`', '有 `value` 是进度条，没有就是转圈'],
          ['`meter`', '带 `low` / `high` / `optimum` 的刻度尺'],
          ['`mark`', '高亮一段文字'],
          ['`time`', '`datetime` 给出机器可读的时间'],
          ['`abbr`', '`title` 给出缩写全称'],
          ['`data`', '`value` 给出机器可读的值'],
          ['`kbd` / `samp` / `var`', '键盘输入 / 程序输出 / 变量名'],
          ['`img loading="lazy"`', '滚到附近再加载，省流量']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 图片的加载时机',
          '',
          '图片默认在页面解析到它时就加载。两个属性可以改这件事：',
          '',
          '- `loading="lazy"`：等到图片快滚进视口才开始加载，首屏之外的长图用它可以省流量、加快首屏。',
          '- `decoding="async"`：把解码挪到不阻塞渲染的时机，图片多的时候不容易卡住页面。',
          '',
          '`alt` 仍然要写：图挂了或者读屏时，它是这段内容唯一的说明。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '第二张图等滚到附近才加载',
        height: 175,
        html: [
          '<p>首屏图，解析到就加载：</p>',
          '<img id="cover" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="封面占位图" width="48" height="48">',
          '<p>下面的图，懒加载、异步解码：</p>',
          '<img id="foot" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="页脚占位图" width="48" height="48" loading="lazy" decoding="async">'
        ].join('\n'),
        checks: [
          'count("img", 2, "两张图")',
          'eq(attr("#cover", "alt"), "封面占位图", "首屏图的 alt")',
          'eq(attr("#cover", "loading"), null, "首屏图不懒加载")',
          'eq(attr("#foot", "loading"), "lazy", "下面的图懒加载")',
          'eq(attr("#foot", "decoding"), "async", "解码不阻塞渲染")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`progress` 有没有 `value` 是两种东西：`<progress value="30" max="100">` 是进度条，`<progress>` 是转圈。想让它转圈，就别写 `value`。'
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`dialog` 不写 `open` 也不调 `showModal()` 时完全不显示。别在它旁边自己再搭一层遮罩——`showModal()` 已经带了。'
      },
      {
        kind: 'exercise',
        id: 'ex10-1',
        title: '让第一块折叠区默认展开',
        height: 240,
        task: [
          '两段器材说明现在是折叠状态。',
          '',
          '让第一块（相机）在页面打开时就展开，第二块保持收起。'
        ].join('\n'),
        starter: {
          html: [
            '<details>',
            '  <summary>相机</summary>',
            '  <p>入门款就够用。</p>',
            '</details>',
            '<details>',
            '  <summary>镜头</summary>',
            '  <p>先买一个定焦。</p>',
            '</details>'
          ].join('\n')
        },
        solution: {
          html: [
            '<details open>',
            '  <summary>相机</summary>',
            '  <p>入门款就够用。</p>',
            '</details>',
            '<details>',
            '  <summary>镜头</summary>',
            '  <p>先买一个定焦。</p>',
            '</details>'
          ].join('\n')
        },
        tests: [
          'count("details", 2, "两个折叠块")',
          'count("details[open]", 1, "只有一块默认展开")',
          'count("summary", 2, "每块都有自己的标题")',
          'eq(text("summary"), "相机", "第一块的标题")'
        ],
        hints: [
          '`details` 的展开状态由 `open` 这个属性控制。',
          '属性名写在一个标签的开始处：`<details open>`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-2',
        title: '把第二个进度改成转圈',
        height: 230,
        task: [
          '两个指示器现在都是进度条。',
          '',
          '第一个「上传进度」保持 30/100；第二个「正在处理」不知道进度，改成一直转圈。'
        ].join('\n'),
        starter: {
          html: [
            '<p>上传进度 <progress id="upload" value="30" max="100"></progress></p>',
            '<p>正在处理 <progress id="spin" value="30" max="100"></progress></p>'
          ].join('\n')
        },
        solution: {
          html: [
            '<p>上传进度 <progress id="upload" value="30" max="100"></progress></p>',
            '<p>正在处理 <progress id="spin"></progress></p>'
          ].join('\n')
        },
        tests: [
          'count("progress", 2, "两个进度指示")',
          'eq(attr("#upload", "value"), "30", "上传进度是 30")',
          'eq(attr("#upload", "max"), "100", "进度上限 100")',
          'eq(attr("#spin", "value"), null, "转圈的那个不写 value")'
        ],
        hints: [
          '`progress` 有 `value` 就是进度条，没有就是转圈。',
          '转圈的那个把 `value` 和 `max` 一起删掉。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-3',
        title: '给电量表补上刻度',
        height: 210,
        task: [
          '下面这根 `meter` 只有当前值，看不出「多少算低、多少算好」。',
          '',
          '补上：低位分界 `0.25`、高位分界 `0.75`、最佳值 `1`。'
        ].join('\n'),
        starter: {
          html: '<p>电量 <meter id="battery" value="0.35"></meter></p>'
        },
        solution: {
          html: '<p>电量 <meter id="battery" value="0.35" low="0.25" high="0.75" optimum="1"></meter></p>'
        },
        tests: [
          'eq(attr("#battery", "value"), "0.35", "当前值")',
          'eq(attr("#battery", "low"), "0.25", "低位分界")',
          'eq(attr("#battery", "high"), "0.75", "高位分界")',
          'eq(attr("#battery", "optimum"), "1", "最佳值")'
        ],
        hints: [
          '这三个都是 `meter` 标签上的属性，和 `value` 写在同一对尖括号里。',
          '`meter` 默认量程是 0 到 1，所以这里的分界值直接写小数。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-4',
        title: '把死文本换成能读懂的标签',
        height: 230,
        task: [
          '三行文字现在只是普通文本，机器读不出其中的时间、缩写的全称和数值。',
          '',
          '- 时间用 `time`，把 `2026-10-06T20:00` 写进 `datetime`，显示文字用 **今晚八点**。',
          '- 缩写 `CSS` 用 `abbr`，`title` 写 `Cascading Style Sheets`。',
          '- 噪音值用 `data`，`value` 写 `72`，显示文字保持 **72 分贝**。'
        ].join('\n'),
        starter: {
          html: [
            '<p>下线时间：2026-10-06T20:00</p>',
            '<p>样式表技术：CSS</p>',
            '<p>昨晚噪音：72 分贝</p>'
          ].join('\n')
        },
        solution: {
          html: [
            '<p>下线时间：<time datetime="2026-10-06T20:00">今晚八点</time></p>',
            '<p>样式表技术：<abbr title="Cascading Style Sheets">CSS</abbr></p>',
            '<p>昨晚噪音：<data value="72">72 分贝</data></p>'
          ].join('\n')
        },
        tests: [
          'count("time", 1, "一个 time")',
          'eq(attr("time", "datetime"), "2026-10-06T20:00", "写进 datetime 的时间")',
          'eq(attr("abbr", "title"), "Cascading Style Sheets", "缩写的全称")',
          'eq(attr("data", "value"), "72", "数据的机器可读值")',
          'eq(text("data"), "72 分贝", "data 显示的文字保留")'
        ],
        hints: [
          '三个标签都是「外层包住显示文字，机器可读的值放属性里」。',
          '`time` 的属性叫 `datetime`，`abbr` 的叫 `title`，`data` 的叫 `value`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-5',
        title: '给页脚图加上懒加载',
        height: 230,
        task: [
          '两张图都在解析到时就加载。',
          '',
          '第二张在页面底部，让它滚到附近再加载，并做异步解码。第一张首屏图保持默认。'
        ].join('\n'),
        starter: {
          html: [
            '<img id="cover" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="封面" width="64" height="64">',
            '<img id="foot" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="页脚图" width="64" height="64">'
          ].join('\n')
        },
        solution: {
          html: [
            '<img id="cover" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="封面" width="64" height="64">',
            '<img id="foot" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="页脚图" width="64" height="64" loading="lazy" decoding="async">'
          ].join('\n')
        },
        tests: [
          'count("img", 2, "两张图")',
          'eq(attr("#cover", "loading"), null, "首屏图不懒加载")',
          'eq(attr("#foot", "loading"), "lazy", "页脚图懒加载")',
          'eq(attr("#foot", "decoding"), "async", "页脚图异步解码")'
        ],
        hints: [
          '两个属性都写在第二张 `img` 的开始标签里，和 `alt`、`width` 并排。',
          '值是固定写法：`loading="lazy"`、`decoding="async"`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex10-6',
        title: '做一个 showModal 弹窗',
        height: 260,
        task: [
          '页面上有一个按钮和一个 `dialog`，但点按钮没反应。',
          '',
          '- 在 JS 里写两个函数：`openNotice()` 调 `showModal()` 打开，`closeNotice()` 调 `close()` 关闭。',
          '- 把「查看须知」按钮接到 `openNotice`，把对话框里的按钮接到 `closeNotice`。'
        ].join('\n'),
        starter: {
          html: [
            '<button id="open">查看须知</button>',
            '<dialog id="notice">',
            '  <p>进场请安静，手机静音。</p>',
            '</dialog>'
          ].join('\n'),
          js: '/* TODO：写 openNotice / closeNotice 两个函数，并绑到按钮上 */'
        },
        solution: {
          html: [
            '<button id="open">查看须知</button>',
            '<dialog id="notice">',
            '  <p>进场请安静，手机静音。</p>',
            '  <button id="close">知道了</button>',
            '</dialog>'
          ].join('\n'),
          js: [
            'function openNotice() {',
            '  document.getElementById("notice").showModal();',
            '}',
            'function closeNotice() {',
            '  document.getElementById("notice").close();',
            '}',
            'document.getElementById("open").addEventListener("click", openNotice);',
            'document.getElementById("close").addEventListener("click", closeNotice);'
          ].join('\n')
        },
        tests: [
          'has("button#open", "打开按钮")',
          '$("button#open").click(); has("dialog[open]", "点按钮后对话框弹出")',
          'eq(tag("dialog > button"), "button", "对话框里有关闭按钮")',
          'fn("openNotice", "打开函数挂在全局")',
          'fn("closeNotice", "关闭函数挂在全局")'
        ],
        hints: [
          '`showModal()` 无参调用，作用在 `dialog` 元素上；`close()` 同样。',
          '用 `document.getElementById("open").addEventListener("click", openNotice)` 把按钮和函数接起来。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
