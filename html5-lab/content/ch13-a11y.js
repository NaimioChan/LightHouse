/* ch13 — 无障碍与语义 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch13',
    title: '第 13 章 · 无障碍与语义',
    goal: '写出读屏软件能念、键盘能走、屏幕上的东西都有名字的页面；知道什么时候该加 ARIA、什么时候什么都不用加。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 无障碍不是「给残疾人做的」',
          '',
          '读屏软件把页面念成一段声音；键盘用户靠 Tab 在页面里走；字号放大的用户会把布局撑开。'
            + '这三种用法覆盖的人群比你想象的多——视力衰退、临时手伤、在强光下看手机，都算。',
          '',
          '好消息是这几种用法吃的是同一套东西：**结构正确 + 有名字 + 顺序合理**。'
            + 'HTML 从一开始就是为这个设计的，所以大部分工作不是「额外加东西」，而是「别把原本就有的东西弄丢」。',
          '',
          '本章先讲三件事：语义标签不要一律用 `div`、表单控件要有可念的名字、动态变化要让读屏软件知道。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 地标：先让读屏软件能跳读',
          '',
          '一屏页面通常有三个区域：页头、主体、页脚。全用 `div` 包起来，读屏软件只能从头念到尾；'
            + '换成 `header` / `main` / `footer`，它就多出一个「跳到主内容」的快捷方式。',
          '',
          '这几个标签叫**地标**（landmark），不用配任何属性就有角色。它们负责回答「这块是什么」。',
          '',
          '`main` 全页只有一个。`header` / `footer` 写在 `body` 下是页面级，写进 `article` 里就是那一篇的页眉页脚。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '三个地标：读屏软件按区域跳读',
        height: 210,
        html: [
          '<header>书架</header>',
          '<main>',
          '  <h1>正在读的一本书</h1>',
          '  <p>正文。</p>',
          '</main>',
          '<footer>© 2026 非茗</footer>'
        ].join('\n'),
        css: [
          'body { font-size: 13px; }',
          'header, footer { padding: 8px 10px; background: #f6f4ec; }',
          'main { padding: 10px; border: 1px solid #e0dbcc; }'
        ].join('\n'),
        checks: [
          'eq(tag("body > header"), "header", "页头用地标标签，不是 div")',
          'eq(tag("body > main"), "main", "主体也是")',
          'eq(tag("body > footer"), "footer", "页脚也是")',
          'count("main", 1, "main 全页只有一个")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 标题的层级就是页面的目录',
          '',
          '读屏软件用户经常按标题（H 键）在页面里跳。所以标题不只是「把字变大」：',
          '',
          '- 一级标题 `h1` 全页通常一个，写明这一页是什么',
          '- 往下必须是 `h1 → h2 → h3`，**不要为了字号跳过层级**（想要小字号就用 CSS 调 `h2` 的 `font-size`）',
          '- 没有内容就不要标题；空标题会让跳读列表里多出一个念不出东西的项',
          '',
          '一句话：把 `h1`–`h6` 当成文档大纲用，字号是附带效果，不是选标题的理由。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '标题层级是一棵树，不是一串字号',
        height: 200,
        html: [
          '<h1>工作台</h1>',
          '<h2>今天的任务</h2>',
          '<h3>上午</h3>',
          '<h2>收件箱</h2>'
        ].join('\n'),
        checks: [
          'eq(tag("h1"), "h1", "页面主题用 h1")',
          'count("h2", 2, "两个二级分区")',
          'eq(tag("h2 + h3"), "h3", "h3 嵌套在 h2 底下，没有跳级")',
          'ok($("h1").compareDocumentPosition($("h2")) == 4, "h2 排在 h1 之后")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 每个控件都要有一个能念出来的名字',
          '',
          '输入框光有一个空框，读屏软件只会念「编辑框」。名字从哪来？优先级从高到低：',
          '',
          '1. `aria-labelledby` 指向页面上某段文字（最灵活，也能复用可见文字）',
          '2. `aria-label` 直接写一句名字（页面上不放可见文字时用）',
          '3. 关联的 `<label>`（`for` 指向控件的 `id`，或者把控件包在 `label` 里）',
          '',
          '能看见的标签用第 3 种，既对读屏有名字、又对所有人可见。'
            + '图标按钮这种没有可见文字的情况，才用 `aria-label` 补名字。',
          '',
          '这跟第 5 章讲过的 `label for` 是同一件事，只是那一章从「点标签能聚焦」的角度讲，这一章从「名字从哪来」的角度讲。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['名字来源', '怎么写', '什么时候用'],
        rows: [
          ['`aria-labelledby`', '值写别的元素的 `id`，可空格分隔多个', '页面上已经有可见文字，直接复用'],
          ['`aria-label`', '值就是名字本身', '没有可见文字（图标按钮）'],
          ['`<label for>`', '`for` 指向控件的 `id`', '表单字段，最常见的做法'],
          ['`<label>` 包裹', '控件写在 `label` 里面', '省掉一个 `id`，结构紧凑']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex13-1',
        title: '给图标按钮补一个名字',
        task: [
          '一个只有放大镜图标的搜索按钮，读屏软件念不出它叫什么。',
          '',
          '要求：只改 `html` 栏，给 `button` 加一条 `aria-label`，名字写成「搜索」。',
          '',
          '注意：图标本身不用念，保持 `aria-hidden="true"`。'
        ].join('\n'),
        starter: {
          html: [
            '<button class="icon-btn" type="button">',
            '  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor"/><path d="M11 11l4 4" stroke="currentColor"/></svg>',
            '</button>'
          ].join('\n'),
          css: [
            '.icon-btn { width: 34px; height: 34px; border: 1px solid #d8d3c4; border-radius: 6px; background: #fff; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<button class="icon-btn" type="button" aria-label="搜索">',
            '  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor"/><path d="M11 11l4 4" stroke="currentColor"/></svg>',
            '</button>'
          ].join('\n')
        },
        tests: [
          'eq(attr("button", "aria-label"), "搜索", "按钮有了名字")',
          'eq(attr("svg", "aria-hidden"), "true", "图标本身不念，标了 aria-hidden")'
        ],
        hints: [
          '`aria-label` 的值就是读屏软件会念出来的那句话，写名词，别写「按钮」。',
          '名字写在 `button` 上（真正被聚焦的元素），不是写在 `svg` 上。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-2',
        title: '用 aria-labelledby 复用可见标题',
        task: [
          '一篇文章用 `aria-labelledby` 指向自己可见的标题，读屏软件念这块区域时先念标题。',
          '',
          '要求：只改 `html` 栏，给 `section` 加 `aria-labelledby`，值指向那个 `h2` 的 `id`（`sec-title`）。'
            + '同时给 `section` 一个 `class="card"` 方便看。',
          '这个例子说明：名字不一定要新写一句话，直接指页面上已有的文字更省事，也不会和可见文字不一致。'
        ].join('\n'),
        starter: {
          html: [
            '<section>',
            '  <h2 id="sec-title">本周安排</h2>',
            '  <p>周一评审，周三联调。</p>',
            '</section>'
          ].join('\n'),
          css: [
            'body { font-size: 13px; }',
            'section { padding: 10px; border: 1px solid #e0dbcc; border-radius: 6px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<section class="card" aria-labelledby="sec-title">',
            '  <h2 id="sec-title">本周安排</h2>',
            '  <p>周一评审，周三联调。</p>',
            '</section>'
          ].join('\n')
        },
        tests: [
          'eq(attr("section", "aria-labelledby"), "sec-title", "区域的名字指向了标题")',
          'eq(attr("#sec-title", "id") !== null ? $("#sec-title").textContent.trim() : null, "本周安排", "指向的那个标题真的存在且非空")'
        ],
        hints: [
          '`aria-labelledby` 的值是 **id**，不是文字本身；文字本体的地方写错了就会念不出名字。',
          '被指向的元素必须真的在页面上，交叉引用断了读屏软件就没名字。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-3',
        title: '让控件能被读屏软件念出名字',
        task: [
          '这个输入框只有一个占位符，读屏软件念不出它是干什么的。',
          '',
          '要求：只改 `html` 栏，用 `<label for>` 把提示文字跟输入框绑起来，'
            + '输入框补一个 `id` 和 `name`（都叫 `email`），`label` 的 `for` 写同一个值。'
        ].join('\n'),
        starter: {
          html: [
            '<form>',
            '  <label>邮箱</label>',
            '  <input type="email" placeholder="you@example.com">',
            '</form>'
          ].join('\n'),
          css: [
            'body { font-size: 13px; }',
            'label { display: block; margin-bottom: 4px; }',
            'input { padding: 6px 8px; border: 1px solid #d8d3c4; border-radius: 6px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<form>',
            '  <label for="email">邮箱</label>',
            '  <input type="email" id="email" name="email" placeholder="you@example.com">',
            '</form>'
          ].join('\n')
        },
        tests: [
          'eq(attr("label", "for"), "email", "label 的 for")',
          'eq(attr("input", "id"), "email", "控件的 id，和 for 对上")',
          'eq(attr("input", "name"), "email", "name 用来提交，也跟着写上")'
        ],
        hints: [
          '`for` 和 `id` 必须是**一模一样的字符串**才对得上，一个字母之差就断。',
          '占位符不是名字：它在输入之后会消失，读屏软件靠不住它。'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## aria-live：让读屏软件知道「刚才变了」',
          '',
          '页面上一段文字被脚本改了，读屏软件默认不会主动念——它不知道那是普通重排还是重要通知。'
            + '`aria-live` 就是用来标记「这块内容会变，变了要念」的：',
          '',
          '- `aria-live="polite"`：等用户手头的事做完再念，**默认选它**',
          '- `aria-live="assertive"`：立刻打断当前的朗读，只用于报错这类紧急信息',
          '- `role="status"` 是 `aria-live="polite"` 的常见替代，语义更明确',
          '',
          '另一个常见属性是 `aria-atomic="true"`：内容变化时把**整块**重念一遍，而不是只念变的那几个字。'
            + '消息列表这种场景用得上。'
        ].join('\n')
      },
      {
        kind: 'exercise',
        id: 'ex13-4',
        title: '把变化区域标成实时区',
        task: [
          '下面这段状态文字会被脚本改，但读屏软件不念。',
          '',
          '要求：只改 `html` 栏，给 `.status` 加上 `aria-live="polite"` 和 `aria-atomic="true"`。'
        ].join('\n'),
        starter: {
          html: [
            '<p class="status">正在保存…</p>',
            '<button id="go" type="button">重新保存</button>'
          ].join('\n'),
          css: [
            'body { font-size: 13px; }',
            '.status { padding: 6px 8px; background: #eaf0ff; border-radius: 6px; }'
          ].join('\n'),
          js: [
            "document.getElementById('go').addEventListener('click', function () {",
            "  document.querySelector('.status').textContent = '已保存';",
            "});"
          ].join('\n')
        },
        solution: {
          html: [
            '<p class="status" aria-live="polite" aria-atomic="true">正在保存…</p>',
            '<button id="go" type="button">重新保存</button>'
          ].join('\n')
        },
        tests: [
          'eq(attr(".status", "aria-live"), "polite", "标了礼貌级实时区")',
          'eq(attr(".status", "aria-atomic"), "true", "整块重念")'
        ],
        hints: [
          '`aria-live` 写在**会变的那块元素**上，不是写在按钮上。',
          '消息、状态、错误这类动态文案，默认用 `polite`；只有真正紧急才用 `assertive`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-5',
        title: '纯装饰的元素别让读屏念',
        task: [
          '下面这个分隔符是纯装饰，读屏软件念它只会制造噪音。',
          '',
          '要求：只改 `html` 栏，给 `.divider` 加上 `aria-hidden="true"`；'
            + '它的名字文字也一起藏起来，保持页面视觉不变。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="divider">•••</div>',
            '<p>下面的内容是正文。</p>'
          ].join('\n'),
          css: [
            'body { font-size: 13px; }',
            '.divider { text-align: center; color: #c9c3b4; letter-spacing: 6px; margin: 8px 0; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="divider" aria-hidden="true">•••</div>',
            '<p>下面的内容是正文。</p>'
          ].join('\n')
        },
        tests: [
          'eq(attr(".divider", "aria-hidden"), "true", "装饰元素标成对读屏隐藏")',
          'eq(text("p"), "下面的内容是正文。", "正文照常保留")'
        ],
        hints: [
          '图标、分隔线、装饰性的图片，读屏念了反而干扰，标 `aria-hidden="true"` 藏起来。',
          '`aria-hidden` 只影响无障碍树，页面上它还在。'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: 'ARIA 的第一条规则是**能不用就不用**：一个 `nav` 标签天生就有「导航区」的角色，'
          + '再手动写 `role="navigation"` 是多余的，写错了反而会覆盖掉原本正确的语义。'
          + '先选对标签，标签不够用的时候才补 ARIA。'
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
