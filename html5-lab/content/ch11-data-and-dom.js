/* ch11 — data 属性与 DOM 交互 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch11',
    title: '第 11 章 · data 属性与 DOM 交互',
    goal: '用 data-* 给元素挂数据、用 dataset 读出来，用 querySelector 选元素、classList 改状态、textContent 安全写文字，并把 click 监听挂在父元素上做事件委托。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## data-* 属性：给标签挂自己的数据',
          '',
          '标准属性只有那几十个，页面自己的状态常常哪个都不属于。`data-*` 是留给你的扩展位：名字以 `data-` 开头，后面自己起。',
          '',
          'HTML 里写成 `data-user-id="u1"`，JS 里通过元素的 `dataset` 读，命名会自动转换：连字符去掉，它后面那个字母变大写。`data-user-id` 对应 `dataset.userId`，`data-city` 对应 `dataset.city`。',
          '',
          '属性值照旧是字符串。要当数字或布尔值用，读出来之后自己转换。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'data-* 写在 HTML，dataset 读在 JS',
        height: 190,
        html: [
          '<ul id="users">',
          '  <li data-user-id="u1" data-city="北京">张三</li>',
          '  <li data-user-id="u2" data-city="成都">李四</li>',
          '</ul>',
          '<p id="info"></p>'
        ].join('\n'),
        js: [
          'var rows = document.querySelectorAll(\'#users li\');',
          'var lines = [];',
          'for (var i = 0; i < rows.length; i++) {',
          '  lines.push(rows[i].dataset.userId + \' / \' + rows[i].dataset.city);',
          '}',
          'document.getElementById(\'info\').textContent = lines.join(\'；\');'
        ].join('\n'),
        checks: [
          'has("#users li[data-user-id]", "列表项要带 data-user-id")',
          'eq(attr("li", "data-user-id"), "u1", "第一项的 data-user-id")',
          'eq(text("#info"), "u1 / 北京；u2 / 成都", "dataset 读出来的结果")'
        ]
      },
      {
        kind: 'table',
        head: ['写在 HTML 里', '在 JS 里读', '规则'],
        code: true,
        rows: [
          ['data-user-id="u1"', 'dataset.userId', '连字符去掉，后一个字母大写'],
          ['data-city="北京"', 'dataset.city', '只有一个词就不变'],
          ['data-full-name="张三"', 'dataset.fullName', '多段连字符逐段大写']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 选元素、绑事件、改类名',
          '',
          '- `document.querySelector("选择器")` 取第一个匹配的元素，`querySelectorAll` 取全部',
          '- `element.classList.add` / `remove` / `toggle` / `contains` 增删查类名',
          '- `element.addEventListener("click", 处理函数)` 绑定点击',
          '',
          '类名既影响样式又当状态标记。只想知道「开还是关」，`classList.toggle` 是最省事的开关：有就删，没有就加。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'classList 切换开关状态',
        height: 190,
        css: [
          '.off { color: #888; }',
          '.on { color: #1d7a3f; }'
        ].join('\n'),
        html: [
          '<button id="sw" class="off" type="button">开关：关</button>'
        ].join('\n'),
        js: [
          'function toggle() {',
          '  var b = document.getElementById(\'sw\');',
          '  b.classList.toggle(\'on\');',
          '  b.classList.toggle(\'off\');',
          '  b.textContent = b.classList.contains(\'on\') ? \'开关：开\' : \'开关：关\';',
          '}',
          'document.getElementById(\'sw\').addEventListener(\'click\', toggle);'
        ].join('\n'),
        checks: [
          'has("#sw", "开关按钮")',
          'eq(text("#sw"), "开关：关", "初始文案")',
          'ok($("#sw").classList.contains("off"), "初始带 off 类")',
          'fn("toggle")()',
          'ok($("#sw").classList.contains("on"), "调用 toggle() 后带 on 类")',
          'eq(text("#sw"), "开关：开", "调用 toggle() 后的文案")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## textContent 与 innerHTML',
          '',
          '两者都能往元素里塞字符串，区别在怎么解释这段字符串：',
          '',
          '- `textContent` 当纯文本：`<b>甲</b>` 原样显示成 `<b>甲</b>`',
          '- `innerHTML` 当 HTML 解析：同一个字符串会造出一个真的 `b` 元素',
          '',
          '内容来自用户或别处时，`innerHTML` 等于把对方给的标签当成页面结构塞进来。昵称、评论、搜索结果一律用 `textContent`；只有结构完全由自己写死才考虑 `innerHTML`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一段字符串，两种解释',
        height: 190,
        html: [
          '<p id="as-text"></p>',
          '<p id="as-html"></p>'
        ].join('\n'),
        js: [
          'var raw = \'<b>加粗</b>\';',
          'document.getElementById(\'as-text\').textContent = raw;',
          'document.getElementById(\'as-html\').innerHTML = raw;'
        ].join('\n'),
        checks: [
          'eq(text("#as-text"), "<b>加粗</b>", "textContent 把标签当纯文本")',
          'count("#as-text b", 0, "textContent 不造元素")',
          'eq(text("#as-html"), "加粗", "innerHTML 把标签解析了")',
          'eq(tag("#as-html b"), "b", "innerHTML 真的造出了一个 b 元素")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`innerHTML` 里的字符串会被当成 HTML 解析。来源不完全由你控制的内容（昵称、留言、搜索词）用它，别人的输入就可能带进标签甚至脚本；这类内容一律 `textContent`。'
      },
      {
        kind: 'prose',
        md: [
          '## 事件委托：监听挂在父元素上',
          '',
          '列表有几十项，给每一项都绑一个监听，费事，而且新增的项容易被漏掉。把监听挂在父元素上，靠事件冒泡接住所有子项的点击：',
          '',
          '- `event.target` 是真正被点的那个元素',
          '- `event.target.closest("li")` 往上找最近的列表项，点到里面的文字也能命中外面的 `li`',
          '- 再从 `closest` 拿到的元素上读 `dataset`，就知道点的是哪一条',
          '',
          '父元素一个监听管所有子项，之后往里加多少条都不用再绑。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一个监听管三个选项',
        height: 200,
        html: [
          '<ul id="list">',
          '  <li data-id="1">甲</li>',
          '  <li data-id="2">乙</li>',
          '  <li data-id="3">丙</li>',
          '</ul>',
          '<p id="picked">还没点</p>'
        ].join('\n'),
        js: [
          'function select(id) {',
          '  document.getElementById(\'picked\').textContent = \'选中：\' + id;',
          '}',
          '',
          'document.getElementById(\'list\').addEventListener(\'click\', function (ev) {',
          '  var li = ev.target.closest(\'li\');',
          '  if (li) select(li.dataset.id);',
          '});'
        ].join('\n'),
        checks: [
          'count("#list > li", 3, "三个选项")',
          'eq(text("#picked"), "还没点", "初始文案")',
          'fn("select")("2")',
          'eq(text("#picked"), "选中：2", "select() 之后显示选中的 id")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-1',
        title: '把 data-user-id 读出来',
        height: 260,
        task: [
          '名单里每一项都用 `data-user-id` 标了自己的编号，段落 `#out` 还留着占位文字。',
          '',
          '把每项的 `data-user-id` 读出来，用逗号拼成一行（例如 `u1,u2`）写进 `#out` 的 `textContent`。'
        ].join('\n'),
        starter: {
          html: [
            '<ul id="list">',
            '  <li data-user-id="u1">张三</li>',
            '  <li data-user-id="u2">李四</li>',
            '</ul>',
            '<p id="out">（未读取）</p>'
          ].join('\n'),
          js: [
            '/* TODO: 遍历 #list 里的 li，把每项的 data-user-id 拼成 u1,u2 写进 #out */'
          ].join('\n')
        },
        solution: {
          html: [
            '<ul id="list">',
            '  <li data-user-id="u1">张三</li>',
            '  <li data-user-id="u2">李四</li>',
            '</ul>',
            '<p id="out">（未读取）</p>'
          ].join('\n'),
          js: [
            'var items = document.querySelectorAll(\'#list li\');',
            'var ids = [];',
            'for (var i = 0; i < items.length; i++) {',
            '  ids.push(items[i].dataset.userId);',
            '}',
            'document.getElementById(\'out\').textContent = ids.join(\',\');'
          ].join('\n')
        },
        tests: [
          'has("#list li[data-user-id]", "每个列表项要带 data-user-id")',
          'eq(text("#out"), "u1,u2", "读出来的编号用逗号拼起来")',
          'count("#list li", 2, "两项都要读")'
        ],
        hints: [
          '属性名 `data-user-id` 在 JS 里是 `element.dataset.userId`。',
          '`document.querySelectorAll("#list li")` 拿到的是一个类数组，用 `for` 循环按下标取。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-2',
        title: '用 classList 做一个开关',
        height: 280,
        task: [
          '按钮 `#sw` 要能切换激活状态：切换 `active` 类，文案在 **已激活** 和 **未激活** 之间跟着变。',
          '',
          '判题不会真的去点按钮，它直接调用顶层函数 `toggle()` 再查结果。所以切换逻辑必须写成 `function toggle()`，不能只写在匿名的点击回调里。'
        ].join('\n'),
        starter: {
          html: [
            '<button id="sw" type="button">未激活</button>'
          ].join('\n'),
          css: [
            '#sw { padding: 4px 10px; font: inherit; cursor: pointer; }',
            '.active { background: #1d7a3f; color: #fff; }'
          ].join('\n'),
          js: [
            'function toggle() {',
            '  /* TODO: 切换 #sw 的 active 类，并同步按钮文案（已激活 / 未激活） */',
            '}',
            '',
            'document.getElementById(\'sw\').addEventListener(\'click\', toggle);'
          ].join('\n')
        },
        solution: {
          html: [
            '<button id="sw" type="button">未激活</button>'
          ].join('\n'),
          js: [
            'function toggle() {',
            '  var b = document.getElementById(\'sw\');',
            '  b.classList.toggle(\'active\');',
            '  b.textContent = b.classList.contains(\'active\') ? \'已激活\' : \'未激活\';',
            '}',
            '',
            'document.getElementById(\'sw\').addEventListener(\'click\', toggle);'
          ].join('\n')
        },
        tests: [
          'has("#sw", "开关按钮")',
          'fn("toggle", "把切换逻辑写成顶层函数 toggle()")',
          'ok(!$("#sw").classList.contains("active"), "初始不该带 active 类")',
          'fn("toggle")()',
          'ok($("#sw").classList.contains("active"), "调用 toggle() 之后要带上 active 类")',
          'eq(text("#sw"), "已激活", "调用之后按钮文案")'
        ],
        hints: [
          '`classList.toggle("active")` 一次调用就能加上或去掉这个类。',
          '加完类之后用 `classList.contains("active")` 判断现在的状态，再决定按钮上写什么字。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-3',
        title: '把带尖括号的昵称安全插进去',
        height: 240,
        task: [
          '变量 `nickname` 里存着一个昵称，内容里带尖括号。',
          '',
          '把它写进 `#name`，要求页面显示的就是这几个字符本身，不能变成一个真的 `em` 元素。'
        ].join('\n'),
        starter: {
          html: [
            '<p id="name"></p>'
          ].join('\n'),
          js: [
            'var nickname = "<em>阿明</em>";',
            '',
            '/* TODO: 把 nickname 当纯文本写进 #name */'
          ].join('\n')
        },
        solution: {
          html: [
            '<p id="name"></p>'
          ].join('\n'),
          js: [
            'var nickname = "<em>阿明</em>";',
            '',
            'document.getElementById(\'name\').textContent = nickname;'
          ].join('\n')
        },
        tests: [
          'has("#name", "放昵称的段落")',
          'eq(text("#name"), "<em>阿明</em>", "尖括号要原样显示")',
          'count("#name em", 0, "不能用 innerHTML，别解析出 em 元素")'
        ],
        hints: [
          '`textContent` 会把整段字符串当纯文本，标签不会被解析。',
          '换成 `innerHTML` 就会造出一个 `em` 元素，第三条检验会挂。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-4',
        title: '用事件委托选中一道菜',
        height: 300,
        task: [
          '菜单 `#menu` 里三道菜，每项用 `data-dish` 存了自己的名字。点击某一项时，要把它标成 `selected`，并把它的 `data-dish` 写进 `#picked`（写成 `选中：蛋炒饭`）。同一时刻只有一项是 `selected`。',
          '',
          '判题不会真的去点，它会直接调用顶层函数 `choose(item)`（`item` 是被选中的那个 `li`）。所以「选中某一项」的逻辑必须写成 `function choose(item)`；监听照旧挂在父元素 `#menu` 上。'
        ].join('\n'),
        starter: {
          html: [
            '<ul id="menu">',
            '  <li data-id="1" data-dish="牛肉面">牛肉面</li>',
            '  <li data-id="2" data-dish="蛋炒饭">蛋炒饭</li>',
            '  <li data-id="3" data-dish="紫菜汤">紫菜汤</li>',
            '</ul>',
            '<p id="picked">还没选</p>'
          ].join('\n'),
          css: [
            '.selected { font-weight: 700; }'
          ].join('\n'),
          js: [
            'function choose(item) {',
            '  /* TODO: 给 item 加 selected 类，把它的 data-dish 写进 #picked */',
            '}',
            '',
            'document.getElementById(\'menu\').addEventListener(\'click\', function (ev) {',
            '  var li = ev.target.closest(\'li\');',
            '  if (li) choose(li);',
            '});'
          ].join('\n')
        },
        solution: {
          html: [
            '<ul id="menu">',
            '  <li data-id="1" data-dish="牛肉面">牛肉面</li>',
            '  <li data-id="2" data-dish="蛋炒饭">蛋炒饭</li>',
            '  <li data-id="3" data-dish="紫菜汤">紫菜汤</li>',
            '</ul>',
            '<p id="picked">还没选</p>'
          ].join('\n'),
          js: [
            'function choose(item) {',
            '  var items = document.querySelectorAll(\'#menu li\');',
            '  for (var i = 0; i < items.length; i++) items[i].classList.remove(\'selected\');',
            '  item.classList.add(\'selected\');',
            '  document.getElementById(\'picked\').textContent = \'选中：\' + item.dataset.dish;',
            '}',
            '',
            'document.getElementById(\'menu\').addEventListener(\'click\', function (ev) {',
            '  var li = ev.target.closest(\'li\');',
            '  if (li) choose(li);',
            '});'
          ].join('\n')
        },
        tests: [
          'count("#menu > li", 3, "三道菜")',
          'eq(text("#picked"), "还没选", "初始文案")',
          'fn("choose", "把选中逻辑写成顶层函数 choose(item)")',
          'fn("choose")($$("#menu li")[1])',
          'ok($$("#menu li")[1].classList.contains("selected"), "被选中的项要带上 selected 类")',
          'eq(text("#picked"), "选中：蛋炒饭", "把 data-dish 写进 #picked")',
          'ok(!$$("#menu li")[0].classList.contains("selected"), "其它项不该保留 selected")'
        ],
        hints: [
          '`item.dataset.dish` 读的就是 `data-dish` 的值。',
          '先把所有项的 `selected` 去掉，再给 `item` 加上，才能保证同一时刻只有一项被选中。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
