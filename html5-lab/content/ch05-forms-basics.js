/* ch05 — 表单基础 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch05',
    title: '第 5 章 · 表单基础',
    goal: '写出一个字段名清楚、能被浏览器正确收集与提交的表单。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 表单是一组字段的容器',
          '',
          '`form` 把一组控件包起来。浏览器负责收集里面的字段，一并交出去。每个控件带上 `name`（提交时的字段名）和一个当前值。',
          '',
          '`input` 是最常用的控件，本身是空元素。它的 `type` 决定输入框长什么样、弹出什么键盘。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一个能填的搜索框',
        html: [
          '<form action="/search" method="get">',
          '  <label for="q">搜索关键词</label>',
          '  <input id="q" name="q" type="text">',
          '  <button type="submit">搜索</button>',
          '</form>'
        ].join('\n'),
        checks: [
          'has("form input[name=q]", "有字段名为 q 的输入框")',
          'eq(attr("input", "type"), "text", "input 的类型")',
          'eq(attr("input", "id"), "q", "输入框的 id")',
          'eq(attr("label", "for"), "q", "label 的 for")',
          'eq(text("label"), "搜索关键词", "label 的文字")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## label 与 id 配对，点标签就能聚焦',
          '',
          '`label` 是字段的说明文字。把它的 `for` 写成某个控件的 `id`，两者就绑在一起：点标签，光标自动进到那个输入框；读屏软件也会把它当字段名念出来。',
          '',
          '一个 `id` 在一页里只能出现一次，`for` 也只能指向一个控件。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '登录表单：label 与 id 一一对应',
        height: 210,
        html: [
          '<form action="/login" method="post">',
          '  <label for="user">用户名</label>',
          '  <input id="user" name="user" type="text">',
          '  <label for="pw">密码</label>',
          '  <input id="pw" name="pw" type="password">',
          '  <button type="submit">登录</button>',
          '</form>'
        ].join('\n'),
        checks: [
          'eq(attr("form", "action"), "/login", "表单的 action")',
          'eq(attr("form", "method"), "post", "表单的 method")',
          'eq(attr("#pw", "type"), "password", "密码框的类型")',
          'count("input", 2, "两个输入框")',
          'has("label[for=pw]", "label 指向密码框")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`id` 管「这一页里它是谁」，`name` 管「提交时它叫什么」。输入框通常两个都要写。'
      },
      {
        kind: 'prose',
        md: [
          '## 提交去哪儿：action 与 method',
          '',
          '`action` 是提交的目标地址，`method` 是提交方式。两个都可以不写：',
          '',
          '- 不写 `action`，表单提交到当前页面的地址，适合「提交后还留在本页」的场合。',
          '- 不写 `method`，默认是 `get`，字段会拼在地址后面（`?user=…&pw=…`）。要藏住内容就写 `method="post"`。',
          '',
          '预览窗里表单不会真的发出去，这里练的是把结构和字段写对。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '三种输入类型',
        html: [
          '<form>',
          '  <label for="mail">邮箱</label>',
          '  <input id="mail" name="mail" type="email">',
          '  <label for="age">年龄</label>',
          '  <input id="age" name="age" type="number">',
          '  <label for="day">入学日期</label>',
          '  <input id="day" name="day" type="date">',
          '</form>'
        ].join('\n'),
        checks: [
          'eq(attr("#mail", "type"), "email", "邮箱字段")',
          'eq(attr("#age", "type"), "number", "年龄字段")',
          'eq(attr("#day", "type"), "date", "日期字段")',
          'count("input", 3, "三个输入框")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '没有 `name` 的控件交不上去：表单收集字段时只看 `name`，`id` 是给 `label` 和脚本用的。'
      },
      {
        kind: 'table',
        head: ['标签 / 属性', '管什么'],
        rows: [
          ['`form`', '包住一组控件，负责把字段提交出去'],
          ['`label` 的 `for`', '写控件的 `id`，点标签等于点控件'],
          ['`input` 的 `name`', '提交时的字段名；没写就拿不到这个字段'],
          ['`input` 的 `type`', '输入框的形态：`text`、`password`、`email`、`number`、`date`'],
          ['`action` / `method`', '提交到哪、怎么提交；不写 action 就交到当前地址'],
          ['`fieldset` / `legend`', '给控件分组，`legend` 是组标题'],
          ['`button` 的 `type`', '`submit` 提交、`reset` 复位、`button` 只当按钮']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 分组与按钮',
          '',
          '控件多了就分组：`fieldset` 把相关的几个圈在一起，里面的 `legend` 是这一组的标题。读屏软件会连组名一起念出来。',
          '',
          '按钮在表单里有三种身份，由 `button` 的 `type` 决定：`submit` 提交表单，`reset` 把每个控件恢复成默认值，`button` 什么都不做、留给脚本用。不写 `type` 的 `button` 默认就是 `submit`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '用 fieldset 把地址和电话分开',
        height: 260,
        html: [
          '<form action="/order" method="post">',
          '  <fieldset>',
          '    <legend>收货地址</legend>',
          '    <label for="city">城市</label>',
          '    <input id="city" name="city" type="text">',
          '  </fieldset>',
          '  <fieldset>',
          '    <legend>联系方式</legend>',
          '    <label for="phone">电话</label>',
          '    <input id="phone" name="phone" type="text">',
          '  </fieldset>',
          '  <button type="submit">提交订单</button>',
          '</form>'
        ].join('\n'),
        checks: [
          'count("fieldset", 2, "两组")',
          'has("fieldset > legend", "legend 在 fieldset 里")',
          'eq(text("legend"), "收货地址", "第一组的标题")',
          'count("legend", 2, "两个组标题")'
        ]
      },
      {
        kind: 'demo',
        caption: '三种按钮，各干各的事',
        height: 200,
        html: [
          '<form>',
          '  <label for="nick">昵称</label>',
          '  <input id="nick" name="nick" type="text" value="阿明">',
          '  <button type="submit">保存</button>',
          '  <button type="reset">重置</button>',
          '  <button type="button">预览</button>',
          '</form>'
        ].join('\n'),
        checks: [
          'count("button", 3, "三个按钮")',
          'eq(attr("button", "type"), "submit", "第一个按钮的类型")',
          'count("button[type=reset]", 1, "重置按钮")',
          'count("button[type=button]", 1, "普通按钮")',
          'eq(attr("input", "value"), "阿明", "输入框的默认值")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-1',
        title: '把说明和输入框连起来',
        task: [
          '这个表单里的 `label` 没有和输入框绑定，点它没有反应。',
          '',
          '把两者接上：给输入框加 `id` 和 `name`（都叫 `nickname`），`label` 的 `for` 写上同一个值。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/profile" method="post">',
            '  <label>昵称</label>',
            '  <input type="text">',
            '  <button type="submit">保存</button>',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/profile" method="post">',
            '  <label for="nickname">昵称</label>',
            '  <input id="nickname" name="nickname" type="text">',
            '  <button type="submit">保存</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'eq(attr("input", "id"), "nickname", "输入框的 id")',
          'eq(attr("input", "name"), "nickname", "提交时的字段名")',
          'eq(attr("label", "for"), "nickname", "label 的 for")',
          'eq(text("label"), "昵称", "label 上的文字")'
        ],
        hints: [
          '`label` 的 `for` 和输入框的 `id` 要写成一模一样的字符串，才能配对。',
          '`id` 给 `label` 用，`name` 给提交用，这里两者都叫 `nickname`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-2',
        title: '给字段换上对的 type',
        task: [
          '三个字段都写成了普通的文本输入框。',
          '',
          '按内容换 `type`：邮箱用 `email`，密码用 `password`，生日用 `date`。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/join" method="post">',
            '  <label for="mail">邮箱</label>',
            '  <input id="mail" name="mail" type="text">',
            '  <label for="pw">密码</label>',
            '  <input id="pw" name="pw" type="text">',
            '  <label for="birth">生日</label>',
            '  <input id="birth" name="birth" type="text">',
            '  <button type="submit">注册</button>',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/join" method="post">',
            '  <label for="mail">邮箱</label>',
            '  <input id="mail" name="mail" type="email">',
            '  <label for="pw">密码</label>',
            '  <input id="pw" name="pw" type="password">',
            '  <label for="birth">生日</label>',
            '  <input id="birth" name="birth" type="date">',
            '  <button type="submit">注册</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'eq(attr("#mail", "type"), "email", "邮箱字段的类型")',
          'eq(attr("#pw", "type"), "password", "密码字段的类型")',
          'eq(attr("#birth", "type"), "date", "生日字段的类型")',
          'count("input", 3, "三个输入框都还在")'
        ],
        hints: [
          '`type` 决定键盘与校验：`email` 会检查形如邮箱，`date` 会给出日期选择器。',
          '密码框写 `type="password"`，输入的字会显示成圆点。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-3',
        title: '把控件分进两个 fieldset',
        task: [
          '四个控件平铺在一起。',
          '',
          '用 `fieldset` 分成两组：地址那组标题写「收货地址」，电话那组写「联系方式」。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/order" method="post">',
            '  <label for="city">城市</label>',
            '  <input id="city" name="city" type="text">',
            '  <label for="phone">电话</label>',
            '  <input id="phone" name="phone" type="text">',
            '  <button type="submit">提交</button>',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/order" method="post">',
            '  <fieldset>',
            '    <legend>收货地址</legend>',
            '    <label for="city">城市</label>',
            '    <input id="city" name="city" type="text">',
            '  </fieldset>',
            '  <fieldset>',
            '    <legend>联系方式</legend>',
            '    <label for="phone">电话</label>',
            '    <input id="phone" name="phone" type="text">',
            '  </fieldset>',
            '  <button type="submit">提交</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'count("fieldset", 2, "两组")',
          'has("fieldset > legend", "legend 要写在 fieldset 里面")',
          'eq(text("legend"), "收货地址", "第一组的标题")',
          'count("legend", 2, "两个组标题")'
        ],
        hints: [
          '`legend` 必须是 `fieldset` 的第一个子元素。',
          '每组里放自己的 `label` 和 `input`，提交按钮留在两组外面。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-4',
        title: '给按钮写上各自的 type',
        task: [
          '两个按钮都没写 `type`，浏览器一律当提交处理。',
          '',
          '把「保存」写成提交按钮，「清空」写成复位按钮，再补一个 `type="button"` 的「预览」按钮。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/note" method="post">',
            '  <label for="text">便签</label>',
            '  <input id="text" name="text" type="text" value="记得买牛奶">',
            '  <button>保存</button>',
            '  <button>清空</button>',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/note" method="post">',
            '  <label for="text">便签</label>',
            '  <input id="text" name="text" type="text" value="记得买牛奶">',
            '  <button type="submit">保存</button>',
            '  <button type="reset">清空</button>',
            '  <button type="button">预览</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'count("button", 3, "三个按钮")',
          'count("button[type=submit]", 1, "一个提交按钮")',
          'count("button[type=reset]", 1, "一个复位按钮")',
          'count("button[type=button]", 1, "一个普通按钮")',
          'eq(text("button[type=reset]"), "清空", "复位按钮上的文字")'
        ],
        hints: [
          '`reset` 会把每个控件恢复到默认值，也就是写死的 `value`。',
          '不写 `type` 的 `button` 默认就是 `submit`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-5',
        title: '别让密码出现在地址栏',
        task: [
          '这个表单没写 `method`，默认用 `get`，`pw` 会被拼进地址。',
          '',
          '改成 `method="post"`。`action` 保持不写——表单会提交到当前页面的地址。'
        ].join('\n'),
        starter: {
          html: [
            '<form method="get">',
            '  <label for="pw">密码</label>',
            '  <input id="pw" name="pw" type="password">',
            '  <button type="submit">登录</button>',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form method="post">',
            '  <label for="pw">密码</label>',
            '  <input id="pw" name="pw" type="password">',
            '  <button type="submit">登录</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'eq(attr("form", "method"), "post", "提交方式")',
          'eq(attr("form", "action"), null, "不要写 action，交给当前地址")',
          'eq(attr("#pw", "type"), "password", "密码框的类型")',
          'has("form button", "表单里有提交按钮")'
        ],
        hints: [
          '`get` 把字段拼在地址后面，密码会明晃晃地留在地址栏和浏览器历史里。',
          '`post` 把字段放进请求体。`action` 不写，浏览器就提交到当前地址。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
