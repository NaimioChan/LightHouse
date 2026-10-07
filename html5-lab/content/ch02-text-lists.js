/* ch02 — 文本与列表 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch02',
    title: '第 2 章 · 文本与列表',
    goal: '把正文写成层次清楚、读屏软件能读懂的段落、强调、列表、引用与代码块。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 段落是正文的最小单位',
          '',
          '写完一段话就用 `p` 把它包起来。段落之间的间距交给浏览器，不用手写空行。',
          '同一段话内部要换行，才用 `br`。',
          '',
          '强调一处意思用 `strong`（重要）和 `em`（语气加重）。它们默认一个加粗一个斜体，值钱的地方在语义：读屏软件会在这两处加重语气。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '段落与强调',
        height: 210,
        html: [
          '<p>这家小店的一天分三段。</p>',
          '<p>早上<strong>最安静</strong>，只有咖啡机在响。</p>',
          '<p>下午开始上<em>人流</em>。<br>太阳一出来，门口就坐满了。</p>'
        ].join('\n'),
        checks: [
          'count("p", 3, "三段话")',
          'eq(text("strong"), "最安静", "加粗的那个词")',
          'eq(text("em"), "人流", "斜体的那个词")',
          'has("p br", "同一段话里用 br 换行")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 有序、无序，都是列表',
          '',
          '并列、没有先后的一串东西用 `ul`（无序），顺序不能换的用 `ol`（有序）。每一个项目是一条 `li`，`li` 只待在 `ul` 或 `ol` 里，不单独出现。',
          '',
          '列表可以套列表：把一个 `ul` 放进外层某条 `li` 里，就成了子列表。浏览器的项目符号会跟着层级换样子。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '带子列表的流程',
        height: 220,
        css: 'ul { list-style-type: square; }',
        html: [
          '<h2>办事流程</h2>',
          '<ol>',
          '  <li>准备材料',
          '    <ul>',
          '      <li>身份证</li>',
          '      <li>一寸照片</li>',
          '    </ul>',
          '  </li>',
          '  <li>提交申请</li>',
          '  <li>领结果</li>',
          '</ol>'
        ].join('\n'),
        checks: [
          'eq(tag("body > ol"), "ol", "主流程用有序列表")',
          'count("ol > li", 3, "主流程三步")',
          'count("ol ul > li", 2, "准备材料里两条")',
          'eq(text("ol ul li"), "身份证", "子列表第一项")',
          'eq(style("ul", "list-style-type"), "square", "子列表用方块符号")'
        ]
      },
      {
        kind: 'table',
        head: ['标签', '做什么'],
        rows: [
          ['`p`', '一个段落'],
          ['`strong` / `em`', '重点与语气加重'],
          ['`br`', '同一段话里的强制换行'],
          ['`ul` / `ol`', '无序 / 有序列表'],
          ['`li`', '列表项，只出现在 ul 或 ol 里'],
          ['`dl` / `dt` / `dd`', '定义列表：术语与它的解释'],
          ['`blockquote` / `cite`', '成段引用 / 引用的出处'],
          ['`code` / `pre`', '行内代码 / 保留空白的一整块']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`br` 只用来在同一段话里强制换行。拿一堆 `br` 硬拼出整页的排版，等于把段落结构拆碎了：要分段用 `p`，要分隔用 `hr`。'
      },
      {
        kind: 'prose',
        md: [
          '## 术语和引用',
          '',
          '`dl` 是定义列表：`dt` 写术语，紧跟的 `dd` 写它的解释。可以有好几组 `dt` + `dd`，一个术语配一条解释。',
          '',
          '成段引用别人的话用 `blockquote`，出处放进 `cite`。`cite` 也可以出现在正文里，标一个作品名。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '术语表与一条引用',
        height: 230,
        html: [
          '<dl>',
          '  <dt>BPM</dt>',
          '  <dd>每分钟的拍数，决定曲子快慢。</dd>',
          '  <dt>Key</dt>',
          '  <dd>调性，决定主音落在哪。</dd>',
          '</dl>',
          '<blockquote>',
          '  <p>限制越多，选择越清楚。</p>',
          '  <cite>一位制作人</cite>',
          '</blockquote>'
        ].join('\n'),
        checks: [
          'count("dt", 2, "两个术语")',
          'count("dd", 2, "两条解释")',
          'eq(text("dt"), "BPM", "第一个术语")',
          'has("blockquote > p", "引用正文在 p 里")',
          'eq(tag("blockquote cite"), "cite", "出处用 cite")',
          'eq(text("cite"), "一位制作人", "出处的文字")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 代码、分隔与图注',
          '',
          '行内的命令、变量名用 `code`。要保留空格和换行的一整块代码用 `pre`，通常是 `pre` 里套一个 `code`。',
          '',
          '`hr` 是一条水平分隔线，表示话题的转换。要给一段内容配说明，用 `figure` 包住它，说明写进 `figcaption`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一块代码和它的图注',
        height: 230,
        html: [
          '<figure>',
          '  <pre><code>npm run build',
          'npm run test</code></pre>',
          '  <figcaption>两条最常用的脚本命令。</figcaption>',
          '</figure>',
          '<hr>',
          '<p>图注也能配在别的内容上，比如一条命令、一段引用、一张表。</p>'
        ].join('\n'),
        checks: [
          'has("figure", "有图块")',
          'eq(tag("figure figcaption"), "figcaption", "图块带图注")',
          'eq(text("figcaption"), "两条最常用的脚本命令。", "图注文字")',
          'eq(tag("pre code"), "code", "pre 里放 code")',
          'eq(text("pre code"), "npm run build\\nnpm run test", "pre 原样保留两行")',
          'count("hr", 1, "一条分隔线")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`pre` 里的空格和换行会原样保留，写代码片段时直接回车换行就行，不用手动补空格。'
      },
      {
        kind: 'exercise',
        id: 'ex02-1',
        title: '把清单拆成无序列表',
        task: [
          '这一行购物清单把几样东西挤在了一起。改写成真正的列表。',
          '',
          '要求：外层是 `ul`，每个商品各占一条 `li`。'
        ].join('\n'),
        starter: {
          html: '<p>购物清单：牛奶、鸡蛋、面包</p>'
        },
        solution: {
          html: [
            '<ul>',
            '  <li>牛奶</li>',
            '  <li>鸡蛋</li>',
            '  <li>面包</li>',
            '</ul>'
          ].join('\n')
        },
        tests: [
          'count("ul > li", 3, "三样商品各占一条 li")',
          'eq(text("ul li"), "牛奶", "第一条是牛奶")',
          'count("p", 0, "清单不该还留在段落里")'
        ],
        hints: [
          '几样东西并列、没有先后，用 `ul`。',
          '每样商品各写一条 `li`，别再塞回 `p` 里。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-2',
        title: '有序步骤加一条子列表',
        height: 260,
        task: [
          '把这三步写成有序列表，并在第二步里嵌一个无序列表，写两条注意事项。',
          '',
          '要求：外层是 `ol`；子列表写在第二条 `li` 的内部。'
        ].join('\n'),
        starter: {
          html: '<p>1. 买豆子 2. 磨豆 3. 冲泡</p>'
        },
        solution: {
          html: [
            '<ol>',
            '  <li>买豆子</li>',
            '  <li>磨豆',
            '    <ul>',
            '      <li>先称重</li>',
            '      <li>再调刻度</li>',
            '    </ul>',
            '  </li>',
            '  <li>冲泡</li>',
            '</ol>'
          ].join('\n')
        },
        tests: [
          'eq(tag("body > ol"), "ol", "外层是有序列表")',
          'count("ol > li", 3, "三个步骤")',
          'count("ol ul > li", 2, "第二步里嵌了两条")',
          'eq(text("ol > li"), "买豆子", "第一步")'
        ],
        hints: [
          '步骤有先后，外层用 `ol`。',
          '子列表要写进第二条 `li` 里面，才跟着这个步骤走。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-3',
        title: '给关键词加上强调',
        task: [
          '这句话里有两处该强调：书名用 `em`，关键词「留白」用 `strong`。',
          '',
          '要求：只包住该强调的部分，别把整句都包进去。'
        ].join('\n'),
        starter: {
          html: '<p>今天读了《设计中的设计》，学到留白也是一种信息。</p>'
        },
        solution: {
          html: '<p>今天读了<em>《设计中的设计》</em>，学到<strong>留白</strong>也是一种信息。</p>'
        },
        tests: [
          'eq(tag("strong"), "strong", "关键词用 strong")',
          'eq(text("strong"), "留白", "加粗的是「留白」")',
          'eq(tag("em"), "em", "书名用 em")',
          'eq(text("em"), "《设计中的设计》", "斜体内容是书名")'
        ],
        hints: [
          '`em` 表示语气加重，书名、被引用的词适合它。',
          '`strong` 表示重要，只给真正关键的那一个词。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-4',
        title: '把解释写成定义列表',
        task: [
          '两组术语和解释现在挤在一句话里。改写成定义列表：术语用 `dt`，解释用 `dd`。',
          '',
          '要求：外层是 `dl`，两个术语、两条解释。'
        ].join('\n'),
        starter: {
          html: '<p>回声：声音碰到障碍反射回来。混响：声音在空间里持续回响。</p>'
        },
        solution: {
          html: [
            '<dl>',
            '  <dt>回声</dt>',
            '  <dd>声音碰到障碍反射回来。</dd>',
            '  <dt>混响</dt>',
            '  <dd>声音在空间里持续回响。</dd>',
            '</dl>'
          ].join('\n')
        },
        tests: [
          'eq(tag("body > dl"), "dl", "外层用 dl")',
          'count("dt", 2, "两个术语")',
          'count("dd", 2, "两条解释")',
          'eq(text("dt"), "回声", "第一个术语")'
        ],
        hints: [
          '一个术语配一条 `dd`，两组就是 `dt`、`dd`、`dt`、`dd`。',
          '`dl` 是外层容器，`dt` 和 `dd` 都写在它里面。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-5',
        title: '把一句话改成引用',
        task: [
          '把这句话改成一条引用：正文放进 `blockquote`，出处用 `cite` 标出来。',
          '',
          '要求：`blockquote` 里有一个 `p` 装正文，一个 `cite` 装出处。'
        ].join('\n'),
        starter: {
          html: '<p>好的设计是尽可能少的设计。—— Dieter Rams</p>'
        },
        solution: {
          html: [
            '<blockquote>',
            '  <p>好的设计是尽可能少的设计。</p>',
            '  <cite>Dieter Rams</cite>',
            '</blockquote>'
          ].join('\n')
        },
        tests: [
          'eq(tag("body > blockquote"), "blockquote", "用 blockquote 装引用")',
          'has("blockquote p", "引用正文在 p 里")',
          'eq(tag("blockquote cite"), "cite", "出处用 cite")',
          'eq(text("cite"), "Dieter Rams", "cite 里是出处")'
        ],
        hints: [
          '`blockquote` 里再放一个 `p` 装引用正文，读屏软件会把它念成引用。',
          '`cite` 放在 `blockquote` 里，写出处。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
