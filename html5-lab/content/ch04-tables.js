/* ch04 — 表格 */
(function (root) {
  var TABLE_CSS = [
    'table { border-collapse: collapse; }',
    'th, td { border: 1px solid #9a938a; padding: 4px 8px; text-align: left; }',
    'caption { text-align: left; padding-bottom: 6px; }'
  ].join('\n');

  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch04',
    title: '第 4 章 · 表格',
    goal: '用 table 家族写出行列对齐、读屏软件能读懂的表格与数据表。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 表格装的是数据',
          '',
          '`table` 里一行是一个 `tr`，一行里的格子是 `td`。表头用 `th`，它默认加粗居中，值钱的地方在语义。',
          '',
          '把结构再分细一点：`caption` 写表题，`thead` 装表头行，`tbody` 装数据行，`tfoot` 装合计那一行。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一张有表头、表体和表尾的表',
        height: 260,
        css: TABLE_CSS,
        html: [
          '<table>',
          '  <caption>本月课程安排</caption>',
          '  <thead>',
          '    <tr><th scope="col">日期</th><th scope="col">地点</th><th scope="col">时长</th></tr>',
          '  </thead>',
          '  <tbody>',
          '    <tr><td>10 月 3 日</td><td>三号楼 201</td><td>2 小时</td></tr>',
          '    <tr><td>10 月 5 日</td><td>实验楼 305</td><td>3 小时</td></tr>',
          '  </tbody>',
          '  <tfoot>',
          '    <tr><td colspan="2">合计</td><td>5 小时</td></tr>',
          '  </tfoot>',
          '</table>'
        ].join('\n'),
        checks: [
          'eq(tag("table caption"), "caption", "表格有标题")',
          'eq(text("caption"), "本月课程安排", "表题文字")',
          'count("thead th", 3, "三个列头")',
          'eq(attr("thead th", "scope"), "col", "列头标了 scope")',
          'count("tbody tr", 2, "两行数据")',
          'has("tfoot", "合计行在 tfoot 里")',
          'eq(style("table", "border-collapse"), "collapse", "边框合并")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 表头不只是一格加粗的字',
          '',
          '表头格子用 `th`，数据格子用 `td`。再加 `scope` 说清它管谁：`scope="col"` 管一整列，`scope="row"` 管一整行。',
          '',
          '第一列如果也是「这一行是什么」的标签，它就该是 `th` 加 `scope="row"`，而不是普通的 `td`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '第一列当行表头',
        height: 240,
        css: TABLE_CSS,
        html: [
          '<table>',
          '  <caption>每周练习打卡</caption>',
          '  <thead>',
          '    <tr><th scope="col">项目</th><th scope="col">周一</th><th scope="col">周三</th></tr>',
          '  </thead>',
          '  <tbody>',
          '    <tr><th scope="row">音阶</th><td>20 分钟</td><td>15 分钟</td></tr>',
          '    <tr><th scope="row">视唱</th><td>10 分钟</td><td>未练</td></tr>',
          '  </tbody>',
          '</table>'
        ].join('\n'),
        checks: [
          'count("tbody th", 2, "两行各有一个行表头")',
          'eq(attr("tbody th", "scope"), "row", "行表头标 scope=row")',
          'eq(text("tbody th"), "音阶", "第一行的行头")',
          'count("td", 4, "四个数据格")'
        ]
      },
      {
        kind: 'table',
        head: ['标签 / 属性', '作用'],
        rows: [
          ['`table`', '一张数据表'],
          ['`caption`', '表题，写在 table 开头'],
          ['`thead` / `tbody` / `tfoot`', '表头 / 表体 / 表尾（合计行）'],
          ['`tr`', '一行'],
          ['`th`', '表头单元格'],
          ['`td`', '数据单元格'],
          ['`scope="col"` / `scope="row"`', '说清这个表头管一列还是一行'],
          ['`colspan="n"`', '横向合并 n 列'],
          ['`rowspan="n"`', '纵向合并 n 行']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '别拿 `table` 排版页面。表格的语义是「行列相关的数据」，用它拼版面，读屏软件会把整页当成一张表念出来。'
      },
      {
        kind: 'prose',
        md: [
          '## 合并单元格',
          '',
          '一个格子要横跨两列，写 `colspan="2"`；要竖跨两行，写 `rowspan="2"`。',
          '',
          '关键在「被盖住的格子要从 HTML 里删掉」：一格占了两个位置，原来那两个位置上的 `<td>` 只留一个，否则整行会多出一格，列数对不上。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '横跨两列的午休',
        height: 240,
        css: TABLE_CSS,
        html: [
          '<table>',
          '  <caption>工作坊日程</caption>',
          '  <thead>',
          '    <tr><th scope="col">时段</th><th scope="col">内容</th></tr>',
          '  </thead>',
          '  <tbody>',
          '    <tr><td>上午</td><td>讲结构</td></tr>',
          '    <tr><td colspan="2">午休</td></tr>',
          '    <tr><td>下午</td><td>动手写</td></tr>',
          '  </tbody>',
          '</table>'
        ].join('\n'),
        checks: [
          'eq(attr("td[colspan]", "colspan"), "2", "午休横跨两列")',
          'eq(text("td[colspan]"), "午休", "跨列的格子")',
          'count("tbody tr", 3, "三行日程")',
          'count("tbody td", 5, "合并后剩五个数据格")'
        ]
      },
      {
        kind: 'demo',
        caption: '竖跨两行的场地',
        height: 240,
        css: TABLE_CSS,
        html: [
          '<table>',
          '  <caption>两天日程</caption>',
          '  <thead>',
          '    <tr><th scope="col">场地</th><th scope="col">时段</th></tr>',
          '  </thead>',
          '  <tbody>',
          '    <tr><td rowspan="2">三号楼 201</td><td>14:00</td></tr>',
          '    <tr><td>16:00</td></tr>',
          '    <tr><td>实验楼 305</td><td>19:00</td></tr>',
          '  </tbody>',
          '</table>'
        ].join('\n'),
        checks: [
          'eq(attr("td[rowspan]", "rowspan"), "2", "三号楼 201 跨两行")',
          'eq(text("td[rowspan]"), "三号楼 201", "跨行的是场地")',
          'count("tbody tr", 3, "三行")',
          'count("tbody td", 5, "跨行的格子只写一次，其余格照常")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`rowspan="3"` 之后，下面两行不必再写场地那一格。列宽也别用空格硬凑，交给 CSS 的 `width` 处理。'
      },
      {
        kind: 'prose',
        md: [
          '## 表题和列宽',
          '',
          '`caption` 是这张表的标题，读屏软件在进入表格前会先念它。写清楚「这是什么数据的表」，比留空强得多。',
          '',
          '列宽、对齐、边框都交给 CSS，别用空格或 `br` 去凑。表里塞大段说明也会让行列对不上，说明放到表格外面写。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex04-1',
        title: '把散架的表搭成标准结构',
        task: [
          '这张时刻表只有 `tr` 和 `td`，看不出哪行是表头。改成标准结构。',
          '',
          '要求：加 `caption` 写「早班车时刻」；表头行进 `thead` 并用 `th` 加 `scope="col"`；数据行进 `tbody`。'
        ].join('\n'),
        starter: {
          html: [
            '<table>',
            '  <tr>',
            '    <td>车站</td>',
            '    <td>发车时间</td>',
            '  </tr>',
            '  <tr>',
            '    <td>北站</td>',
            '    <td>08:10</td>',
            '  </tr>',
            '  <tr>',
            '    <td>南站</td>',
            '    <td>08:40</td>',
            '  </tr>',
            '</table>'
          ].join('\n'),
          css: TABLE_CSS
        },
        solution: {
          html: [
            '<table>',
            '  <caption>早班车时刻</caption>',
            '  <thead>',
            '    <tr><th scope="col">车站</th><th scope="col">发车时间</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td>北站</td><td>08:10</td></tr>',
            '    <tr><td>南站</td><td>08:40</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n')
        },
        tests: [
          'eq(tag("table caption"), "caption", "表格有 caption")',
          'count("thead th", 2, "表头两格都用 th")',
          'eq(attr("thead th", "scope"), "col", "表头标 scope=col")',
          'count("tbody tr", 2, "两行数据进 tbody")',
          'count("thead td", 0, "表头里不该用 td")'
        ],
        hints: [
          '表头那一行整行挪进 `thead`，格子标签从 `td` 换成 `th`。',
          '`caption` 是 `table` 的第一个孩子，紧跟在 `<table>` 后面写。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-2',
        title: '把第一列改成行表头',
        task: [
          '「品类」这一列其实是每行的名字，现在却写成了普通数据格。改成行表头。',
          '',
          '要求：每行第一个格子是 `th` 并写 `scope="row"`，其余仍是 `td`。'
        ].join('\n'),
        starter: {
          html: [
            '<table>',
            '  <thead>',
            '    <tr><th scope="col">品类</th><th scope="col">数量</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td>黑胶</td><td>12</td></tr>',
            '    <tr><td>CD</td><td>30</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n'),
          css: TABLE_CSS
        },
        solution: {
          html: [
            '<table>',
            '  <thead>',
            '    <tr><th scope="col">品类</th><th scope="col">数量</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><th scope="row">黑胶</th><td>12</td></tr>',
            '    <tr><th scope="row">CD</th><td>30</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n')
        },
        tests: [
          'count("tbody th[scope=row]", 2, "两行都用行表头")',
          'eq(attr("tbody th", "scope"), "row", "scope 是 row")',
          'eq(text("tbody th"), "黑胶", "第一行的行头")',
          'count("tbody td", 2, "每行只剩一个数据格")'
        ],
        hints: [
          '行表头管的是它右边那一行的数据。',
          '只改每行第一个格子：`td` 换成 `th`，加上 `scope="row"`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-3',
        title: '用 colspan 合并周末两列',
        task: [
          '周六、周日两列内容一样，合并成一个「周末」列。',
          '',
          '要求：表头里用一格的 `colspan="2"` 代替原来两个 `th`；数据行同样用 `colspan="2"`。'
        ].join('\n'),
        starter: {
          html: [
            '<table>',
            '  <thead>',
            '    <tr><th scope="col">周一</th><th scope="col">周六</th><th scope="col">周日</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td>上课</td><td>休息</td><td>休息</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n'),
          css: TABLE_CSS
        },
        solution: {
          html: [
            '<table>',
            '  <thead>',
            '    <tr><th scope="col">周一</th><th scope="col" colspan="2">周末</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td>上课</td><td colspan="2">休息</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n')
        },
        tests: [
          'count("thead th", 2, "表头剩两个格子")',
          'eq(attr("thead th[colspan]", "colspan"), "2", "周末横跨两列")',
          'eq(attr("tbody td[colspan]", "colspan"), "2", "数据行的休息也跨两列")',
          'count("tbody td", 2, "数据行剩两个格子")'
        ],
        hints: [
          '一格占了两个位置，原来第二个 `th`（周日）就要删掉。',
          '合并后这一格的文字写什么，由你定：这里统一改成「周末」和「休息」。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-4',
        title: '用 rowspan 合并同一个场地',
        task: [
          '三节课都在「三号楼 201」，场地那一列重复了三遍。合并成一格。',
          '',
          '要求：第一行的场地格写 `rowspan="3"`，下面两行不再重复场地那一格。'
        ].join('\n'),
        starter: {
          html: [
            '<table>',
            '  <thead>',
            '    <tr><th scope="col">场地</th><th scope="col">时段</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td>三号楼 201</td><td>14:00</td></tr>',
            '    <tr><td>三号楼 201</td><td>16:00</td></tr>',
            '    <tr><td>三号楼 201</td><td>19:00</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n'),
          css: TABLE_CSS
        },
        solution: {
          html: [
            '<table>',
            '  <thead>',
            '    <tr><th scope="col">场地</th><th scope="col">时段</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td rowspan="3">三号楼 201</td><td>14:00</td></tr>',
            '    <tr><td>16:00</td></tr>',
            '    <tr><td>19:00</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n')
        },
        tests: [
          'eq(attr("tbody td[rowspan]", "rowspan"), "3", "场地跨三行")',
          'eq(text("tbody td[rowspan]"), "三号楼 201", "跨行的是场地")',
          'count("tbody tr", 3, "还是三行")',
          'count("tbody td", 4, "合并后总共四个格子")'
        ],
        hints: [
          '`rowspan="3"` 放在第一行的场地格上。',
          '第二、三行只留时段那一格，场地那格删掉。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-5',
        title: '给表加一行合计',
        task: [
          '这张支出表缺了合计。加一行合计放进 `tfoot`。',
          '',
          '要求：`tfoot` 里一行，第一格是 `th` 写「合计」并 `scope="row"`，第二格是 `td` 写 `2000`。'
        ].join('\n'),
        starter: {
          html: [
            '<table>',
            '  <caption>本月支出</caption>',
            '  <thead>',
            '    <tr><th scope="col">项目</th><th scope="col">金额</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td>设备</td><td>1200</td></tr>',
            '    <tr><td>课程</td><td>800</td></tr>',
            '  </tbody>',
            '</table>'
          ].join('\n'),
          css: TABLE_CSS
        },
        solution: {
          html: [
            '<table>',
            '  <caption>本月支出</caption>',
            '  <thead>',
            '    <tr><th scope="col">项目</th><th scope="col">金额</th></tr>',
            '  </thead>',
            '  <tbody>',
            '    <tr><td>设备</td><td>1200</td></tr>',
            '    <tr><td>课程</td><td>800</td></tr>',
            '  </tbody>',
            '  <tfoot>',
            '    <tr><th scope="row">合计</th><td>2000</td></tr>',
            '  </tfoot>',
            '</table>'
          ].join('\n')
        },
        tests: [
          'has("tfoot", "合计行放进 tfoot")',
          'eq(text("tfoot th"), "合计", "合计行的第一个格子")',
          'eq(text("tfoot td"), "2000", "合计金额")',
          'eq(attr("tfoot th", "scope"), "row", "合计是行表头")'
        ],
        hints: [
          '`tfoot` 写在 `tbody` 后面，浏览器会把它渲染在表尾。',
          '合计那一行和普通行一样是 `tr`，只是外面套 `tfoot`。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
