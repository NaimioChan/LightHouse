/* ch06 — 表单校验与更多控件 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch06',
    title: '第 6 章 · 表单校验与更多控件',
    goal: '给字段加上浏览器自带的校验，并用下拉框、多行文本、成组选项等控件收集结构化输入。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 让浏览器挡住不合规的输入',
          '',
          '几个属性就能让浏览器在提交前先替你检查：`required` 表示不能为空，`minlength` / `maxlength` 管字符数，`min` / `max` / `step` 管数值的范围与步长，`pattern` 用一个正则要求输入整体匹配。',
          '',
          '不合规时浏览器拦下提交，在控件旁边弹出提示。这一层不需要写一行 JavaScript。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '必填与长度限制',
        height: 220,
        html: [
          '<form action="/join" method="post">',
          '  <label for="user">用户名</label>',
          '  <input id="user" name="user" type="text" required minlength="3" maxlength="12">',
          '  <label for="mail">邮箱</label>',
          '  <input id="mail" name="mail" type="email" required>',
          '  <button type="submit">注册</button>',
          '</form>'
        ].join('\n'),
        checks: [
          'has("input#user[required]", "用户名必填")',
          'eq(attr("#user", "minlength"), "3", "用户名最短 3 个字符")',
          'eq(attr("#user", "maxlength"), "12", "用户名最长 12 个字符")',
          'count("input[required]", 2, "两个必填字段")'
        ]
      },
      {
        kind: 'demo',
        caption: '数值的范围与步长',
        html: [
          '<form>',
          '  <label for="qty">数量</label>',
          '  <input id="qty" name="qty" type="number" min="1" max="10" step="1" value="1">',
          '</form>'
        ].join('\n'),
        checks: [
          'eq(attr("#qty", "min"), "1", "最小值")',
          'eq(attr("#qty", "max"), "10", "最大值")',
          'eq(attr("#qty", "step"), "1", "步长")',
          'eq(attr("#qty", "value"), "1", "默认数量")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## placeholder 是示例，label 才是说明',
          '',
          '`placeholder` 是输入框里那段浅色文字，一开始打字就消失，读屏软件也不一定读得到。',
          '',
          '真正说明字段作用的是 `label`。`placeholder` 顶多放一个格式示例（比如「六位数字」），不能拿它替代标签。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '用 pattern 要求六位数字',
        html: [
          '<form>',
          '  <label for="zip">邮编</label>',
          '  <input id="zip" name="zip" type="text" pattern="[0-9]{6}" placeholder="六位数字" required>',
          '</form>'
        ].join('\n'),
        checks: [
          'eq(attr("#zip", "pattern"), "[0-9]{6}", "校验规则")',
          'eq(attr("#zip", "placeholder"), "六位数字", "占位提示")',
          'eq(text("label"), "邮编", "label 才是字段的说明")',
          'has("input#zip[required]", "邮编必填")'
        ]
      },
      {
        kind: 'table',
        head: ['属性', '管什么'],
        rows: [
          ['`required`', '不能留空'],
          ['`minlength` / `maxlength`', '字符数的下限与上限'],
          ['`min` / `max` / `step`', '数值或日期的范围、步长'],
          ['`pattern`', '一个正则，输入必须整体匹配'],
          ['`list`', '把输入框接到一个 `datalist` 的候选上'],
          ['`autocomplete`', '浏览器能否用记过的值自动填']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 选择框、多行文本、成组选项',
          '',
          '- `select` 是下拉框，里面每一项写一个 `option`；用 `optgroup` 加 `label` 可以给选项分组。',
          '- `textarea` 是多行文本，`rows` 决定初始显示几行。它和 `input` 不同，内容写在开始标签和结束标签之间。',
          '- `checkbox` 是多选，`radio` 是单选。同组的控件必须同名：`checkbox` 靠同名归到一组，`radio` 靠同名才互斥——名字不同就各自成组，两个都能被选中。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '下拉框、复选框、单选框与多行文本',
        height: 400,
        html: [
          '<form action="/order" method="post">',
          '  <fieldset>',
          '    <legend>饮品</legend>',
          '    <label for="drink">选择</label>',
          '    <select id="drink" name="drink">',
          '      <optgroup label="咖啡">',
          '        <option value="latte" selected>拿铁</option>',
          '        <option value="mocha">摩卡</option>',
          '      </optgroup>',
          '      <optgroup label="茶">',
          '        <option value="oolong">乌龙</option>',
          '      </optgroup>',
          '    </select>',
          '  </fieldset>',
          '  <fieldset>',
          '    <legend>加料</legend>',
          '    <label><input type="checkbox" name="topping" value="milk"> 奶盖</label>',
          '    <label><input type="checkbox" name="topping" value="pearl"> 珍珠</label>',
          '  </fieldset>',
          '  <fieldset>',
          '    <legend>杯型</legend>',
          '    <label><input type="radio" name="size" value="m" checked> 中杯</label>',
          '    <label><input type="radio" name="size" value="l"> 大杯</label>',
          '  </fieldset>',
          '  <label for="note">备注</label>',
          '  <textarea id="note" name="note" rows="3">少冰</textarea>',
          '  <button type="submit">下单</button>',
          '</form>'
        ].join('\n'),
        checks: [
          'count("option", 3, "三个选项")',
          'eq(attr("optgroup", "label"), "咖啡", "第一个分组标题")',
          'count("input[name=topping]", 2, "两个同名的复选框才是一组")',
          'count("input[name=size]", 2, "两个同名的单选框才是一组")',
          'eq(tag("#note"), "textarea", "备注是多行文本")',
          'eq(attr("#note", "rows"), "3", "显示 3 行")',
          'has("option[selected]", "有默认选中的选项")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '单选框的名字写错就成不了组：同组统一用一个 `name`，各写各的 `name` 会变成两个独立的小组，可以同时选中。'
      },
      {
        kind: 'prose',
        md: [
          '## 更多控件与自动填写',
          '',
          '- `input` 的 `type` 换成 `search` 会得到一个搜索框，换成 `file` 会得到一个选文件按钮。',
          '- `datalist` 给输入框提供一串候选：`input` 写 `list="某id"`，对应的 `datalist` 用同一个 `id`。用户仍能自己敲别的值。',
          '- `autocomplete` 告诉浏览器哪些字段可以用记过的信息自动填。写在 `form` 上对整张表单生效，写在单个控件上只作用于它，取值是 `street-address`、`postal-code` 这类字段名。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '候选列表、搜索框、文件选择与自动填写',
        height: 330,
        html: [
          '<form action="/ship" method="post" autocomplete="on">',
          '  <label for="kind">类别</label>',
          '  <input id="kind" name="kind" type="text" list="kinds">',
          '  <datalist id="kinds">',
          '    <option value="文具"></option>',
          '    <option value="图书"></option>',
          '  </datalist>',
          '  <label for="kw">搜索</label>',
          '  <input id="kw" name="kw" type="search" placeholder="找一件商品">',
          '  <label for="avatar">头像</label>',
          '  <input id="avatar" name="avatar" type="file" accept="image/png">',
          '  <label for="addr">收货地址</label>',
          '  <input id="addr" name="addr" type="text" autocomplete="street-address">',
          '</form>'
        ].join('\n'),
        checks: [
          'eq(attr("#kind", "list"), "kinds", "输入框绑定的候选列表")',
          'count("datalist option", 2, "两个候选")',
          'eq(attr("#kw", "type"), "search", "搜索框的类型")',
          'eq(attr("#avatar", "type"), "file", "文件选择框")',
          'eq(attr("form", "autocomplete"), "on", "整个表单允许自动填写")',
          'eq(attr("#addr", "autocomplete"), "street-address", "地址字段的自动填写提示")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`required`、`pattern` 这类是浏览器的第一道防线：能挡住手滑，但用户绕过它很容易，真正的检查还得在服务器上再做一遍。'
      },
      {
        kind: 'exercise',
        id: 'ex06-1',
        title: '给注册表单加校验',
        task: [
          '用户名和邮箱都不设防。',
          '',
          '用户名加 `required` 和 `minlength="3"`；邮箱的 `type` 改成 `email` 并加 `required`。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/join" method="post">',
            '  <label for="user">用户名</label>',
            '  <input id="user" name="user" type="text">',
            '  <label for="mail">邮箱</label>',
            '  <input id="mail" name="mail" type="text">',
            '  <button type="submit">注册</button>',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/join" method="post">',
            '  <label for="user">用户名</label>',
            '  <input id="user" name="user" type="text" required minlength="3">',
            '  <label for="mail">邮箱</label>',
            '  <input id="mail" name="mail" type="email" required>',
            '  <button type="submit">注册</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'has("input#user[required]", "用户名必填")',
          'eq(attr("#user", "minlength"), "3", "用户名最少 3 个字符")',
          'eq(attr("#mail", "type"), "email", "邮箱字段的类型")',
          'has("input#mail[required]", "邮箱必填")',
          'count("input[required]", 2, "两个必填字段")'
        ],
        hints: [
          '`required` 是布尔属性，写上就生效，不用给值。',
          '`type="email"` 自带格式校验，再配 `required` 就连空值也挡住。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-2',
        title: '限制数量范围',
        task: [
          '数量框可以填任意数字。',
          '',
          '把它限制在 1 到 9，每次加 1；再补一个提交按钮。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/buy" method="post">',
            '  <label for="qty">数量</label>',
            '  <input id="qty" name="qty" type="number">',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/buy" method="post">',
            '  <label for="qty">数量</label>',
            '  <input id="qty" name="qty" type="number" min="1" max="9" step="1">',
            '  <button type="submit">购买</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'eq(attr("#qty", "min"), "1", "最小值")',
          'eq(attr("#qty", "max"), "9", "最大值")',
          'eq(attr("#qty", "step"), "1", "步长")',
          'has("button[type=submit]", "有提交按钮")'
        ],
        hints: [
          '`min` 与 `max` 是范围，`step` 是每次增减的量。',
          '提交按钮写成 `<button type="submit">`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-3',
        title: '用 pattern 卡住格式',
        task: [
          '验证码这一栏只应该收六位数字，现在什么都能填。',
          '',
          '给它加 `pattern`，规则是 `[0-9]{6}`；并让这个字段必填。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/verify" method="post">',
            '  <label for="code">验证码</label>',
            '  <input id="code" name="code" type="text" placeholder="六位数字">',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/verify" method="post">',
            '  <label for="code">验证码</label>',
            '  <input id="code" name="code" type="text" pattern="[0-9]{6}" placeholder="六位数字" required>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'eq(attr("#code", "pattern"), "[0-9]{6}", "校验规则")',
          'has("input#code[required]", "验证码必填")',
          'eq(attr("label", "for"), "code", "label 指向输入框")',
          'eq(attr("#code", "placeholder"), "六位数字", "占位提示保留")'
        ],
        hints: [
          '`pattern` 里的正则默认要求整个输入都匹配，不用自己加 `^` 和 `$`。',
          '`required` 和 `pattern` 可以写在同一个输入框上。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-4',
        title: '换成下拉框与多行文本',
        task: [
          '这两个字段都用文本输入框凑合着。',
          '',
          '饮品改成 `select`：三档 `espresso` / `latte` / `mocha`，显示成「浓缩」「拿铁」「摩卡」，用 `optgroup` 分组，组名「咖啡」。备注改成 `textarea`，显示 3 行。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/order" method="post">',
            '  <label for="drink">饮品</label>',
            '  <input id="drink" name="drink" type="text">',
            '  <label for="note">备注</label>',
            '  <input id="note" name="note" type="text">',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/order" method="post">',
            '  <label for="drink">饮品</label>',
            '  <select id="drink" name="drink">',
            '    <optgroup label="咖啡">',
            '      <option value="espresso">浓缩</option>',
            '      <option value="latte">拿铁</option>',
            '      <option value="mocha">摩卡</option>',
            '    </optgroup>',
            '  </select>',
            '  <label for="note">备注</label>',
            '  <textarea id="note" name="note" rows="3"></textarea>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'eq(tag("#drink"), "select", "饮品用下拉框")',
          'count("#drink option", 3, "三个选项")',
          'eq(attr("optgroup", "label"), "咖啡", "分组标题")',
          'eq(tag("#note"), "textarea", "备注用多行文本")',
          'eq(attr("#note", "rows"), "3", "显示 3 行")'
        ],
        hints: [
          '`option` 的 `value` 是提交的值，标签之间的文字是给人看的。',
          '`textarea` 没有 `value` 属性，初始内容写在标签之间；`input` 才用 `value`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-5',
        title: '让复选框和单选框成组',
        task: [
          '两个复选框各自一个名字，两个单选框也是，结果全都不成组。',
          '',
          '让两个复选框同叫 `topping`，两个单选框同叫 `size`，`fieldset` 的分组别动。'
        ].join('\n'),
        starter: {
          html: [
            '<form action="/order" method="post">',
            '  <fieldset>',
            '    <legend>加料</legend>',
            '    <label><input type="checkbox" name="topping" value="milk"> 奶盖</label>',
            '    <label><input type="checkbox" name="tea" value="pearl"> 珍珠</label>',
            '  </fieldset>',
            '  <fieldset>',
            '    <legend>杯型</legend>',
            '    <label><input type="radio" name="size" value="m"> 中杯</label>',
            '    <label><input type="radio" name="cup" value="l"> 大杯</label>',
            '  </fieldset>',
            '  <button type="submit">下单</button>',
            '</form>'
          ].join('\n')
        },
        solution: {
          html: [
            '<form action="/order" method="post">',
            '  <fieldset>',
            '    <legend>加料</legend>',
            '    <label><input type="checkbox" name="topping" value="milk"> 奶盖</label>',
            '    <label><input type="checkbox" name="topping" value="pearl"> 珍珠</label>',
            '  </fieldset>',
            '  <fieldset>',
            '    <legend>杯型</legend>',
            '    <label><input type="radio" name="size" value="m"> 中杯</label>',
            '    <label><input type="radio" name="size" value="l"> 大杯</label>',
            '  </fieldset>',
            '  <button type="submit">下单</button>',
            '</form>'
          ].join('\n')
        },
        tests: [
          'count("input[name=topping]", 2, "两个复选框同名")',
          'count("input[name=size]", 2, "两个单选框同名")',
          'count("input[type=checkbox]", 2, "两个复选框")',
          'count("input[type=radio]", 2, "两个单选框")',
          'count("fieldset", 2, "两组都还在")'
        ],
        hints: [
          '`radio` 靠 `name` 划分互斥组，同组共用一个名字，值放在各自的 `value` 里。',
          '`checkbox` 也是同理：同名的一组一起提交，不同名就是互不相干的两个字段。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
