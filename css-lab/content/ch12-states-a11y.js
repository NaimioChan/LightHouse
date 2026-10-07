/* ch12 — 状态、表单与无障碍 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch12',
    title: '第 12 章 · 状态、表单与无障碍',
    goal: '用 :hover / :focus-visible / :disabled / :checked 把交互状态写全，并把对比度和可见焦点这两件事做到位。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 伪类：把「状态」变成选择器',
          '',
          '交互状态在 CSS 里都对应一个伪类：',
          '',
          '- `:hover`：鼠标悬停（触屏上不存在，**别把关键功能只放在悬停里**）',
          '- `:focus`：获得焦点（点击、Tab、脚本设置都会触发）',
          '- `:focus-visible`：只在「键盘操作」时触发，鼠标点击不触发',
          '- `:active`：正在被按下',
          '- `:disabled` / `:enabled`：表单控件的禁用状态',
          '- `:checked`：勾选了的单选框与复选框',
          '- `:required` / `:invalid` / `:valid`：表单校验状态',
          '',
          '顺序上有条经验法则（LVHFA）：`:link` → `:visited` → `:hover` → `:focus` → `:active`。'
            + '同一优先级时后面的生效，所以 `:active` 放在最后才不会被 `:hover` 盖住。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一个按钮的四种状态',
        height: 200,
        html: [
          '<a class="btn" href="#end">一个链接按钮</a>',
          '<button class="btn" disabled>禁用状态</button>'
        ].join('\n'),
        css: [
          '.btn { display: inline-block; padding: 8px 14px; margin-right: 8px; border: 1px solid #2456c8; border-radius: 6px; background: #fff; color: #2456c8; font-size: 13px; text-decoration: none; }',
          '.btn:hover { background: #eaf0ff; }',
          '.btn:active { background: #2456c8; color: #fff; }',
          '.btn:disabled { border-color: #c8c2b2; color: #999; background: #f6f4ec; }'
        ].join('\n'),
        checks: [
          'eq(style(".btn:disabled", "color"), "rgb(153, 153, 153)", "禁用态的颜色单独写了")',
          'eq(style(".btn:disabled", "background-color"), "rgb(246, 244, 236)", "禁用态的背景也换了")',
          'eq(style(".btn:not(:disabled)", "color"), "rgb(36, 86, 200)", "能点的那个还是主色")',
          'eq(attr("button", "disabled"), "", "禁用按钮带 disabled 属性")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 焦点必须看得见，但不必对鼠标用户显示',
          '',
          '键盘用户靠 **Tab** 在页面里走，看不见焦点就等于走不了。所以 `outline: none` 单独用是错的——'
            + '它会把这唯一的提示抹掉。',
          '',
          '` :focus-visible` 是官方给的正解：键盘（和程序）触发时显示焦点圈，鼠标点击时不显示。',
          '',
          '```',
          ':focus-visible { outline: 2px solid #2456c8; outline-offset: 2px; }',
          '```',
          '',
          '如果你非要去掉默认外框，至少要配一条自己的替代：`:focus-visible` 上加边框或背景。',
          '`outline` 与 `box-shadow` 都不会改布局尺寸，比 `border` 更适合做焦点圈。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '焦点圈：默认被换成了自定义的',
        height: 200,
        html: [
          '<label class="field"><span>邮箱</span><input type="text" value="hi@example.com"></label>',
          '<label class="field"><span>昵称</span><input type="text" value="naimio"></label>'
        ].join('\n'),
        css: [
          '.field { display: block; margin-bottom: 10px; font-size: 13px; }',
          '.field span { display: block; color: #6b6558; }',
          '.field input { padding: 6px 8px; border: 1px solid #d8d3c4; border-radius: 6px; }',
          '.field input:focus-visible { outline: 2px solid #2456c8; outline-offset: 2px; }'
        ].join('\n'),
        checks: [
          'eq(style("input", "border-top-width"), "1px", "输入框的基础边框")',
          'eq(attr("input", "type"), "text", "两个都是文本框")',
          'eq(style("input", "outline-style"), "none", "没聚焦时不画焦点圈（预览窗里焦点不在输入框上）")',
          'count("input", 2, "两个输入框都在")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '把 `outline: none` 单独写上（后面没有任何替代样式）是最常见的无障碍错误。'
          + '它让几千瓦的键盘用户在你的页面上彻底失去位置感。'
      },
      {
        kind: 'prose',
        md: [
          '## 对比度：4.5:1 是底线',
          '',
          '正文文字与底色的对比度要达到 **4.5:1**（AA 级）；18.66px 以上加粗、或 24px 以上的大字可以放到 **3:1**。',
          '',
          '几个常见的失败组合：',
          '',
          '- 浅灰文字 `#999` 落在白底上：约 2.8:1，看着「高级」，读起来费劲',
          '- 品牌色直接承载小字：好看的品牌色往往在中明度，一批就掉到 3:1 上下',
          '',
          '做法不是把品牌色换掉，而是**拆成两支**：装饰用一支（对比度 3:1 够），承载文字用一支（压到 4.5:1 以上）。'
            + '本站的 `#2965F1`（装饰）与 `#2456C8`（文字）就是这么来的。',
          '',
          '计算方式：把两色的相对亮度（0–1）算出来，`(亮的 + 0.05) / (暗的 + 0.05)`。'
            + '不用手算——DevTools 的颜色选取器会直接给出比值。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一种色相，两支对比度',
        height: 220,
        html: [
          '<div class="row">',
          '  <div class="swatch deco">装饰用 #2965F1</div>',
          '  <div class="swatch text">文字用 #2456C8</div>',
          '  <div class="swatch bad">#999 落在白底上</div>',
          '</div>'
        ].join('\n'),
        css: [
          '.row { display: flex; gap: 8px; }',
          '.swatch { flex: 1; padding: 10px; font-size: 13px; background: #fff; border: 1px solid #e0dbcc; }',
          '.deco { color: #2965f1; }',
          '.text { color: #2456c8; }',
          '.bad { color: #999999; }'
        ].join('\n'),
        checks: [
          'eq(style(".deco", "color"), "rgb(41, 101, 241)", "装饰支的颜色")',
          'eq(style(".text", "color"), "rgb(36, 86, 200)", "文字支的颜色")',
          'eq(style(".bad", "color"), "rgb(153, 153, 153)", "低对比那一支")',
          'ok(style(".deco", "color") !== style(".text", "color"), "两支确实不是同一个颜色")'
        ]
      },
      {
        kind: 'table',
        head: ['伪类 / 写法', '触发时机'],
        rows: [
          ['`:hover`', '指针悬停，触屏上基本没有'],
          ['`:focus`', '获得焦点：点击、Tab、脚本都算'],
          ['`:focus-visible`', '只在键盘等「需要可见提示」的操作后触发'],
          ['`:active`', '正在被按下，按住的这一瞬间'],
          ['`:disabled`', '带 `disabled` 属性，不能交互'],
          ['`:checked`', '被勾选的单选/复选框'],
          ['`:valid` / `:invalid`', '表单值通过 / 不通过浏览器校验'],
          ['`:placeholder-shown`', '输入框还显示着占位符（也就是空的）'],
          ['`outline: 2px solid`', '焦点圈，不改布局尺寸'],
          ['`outline-offset: 2px`', '焦点圈与元素之间的空隙'],
          ['对比度 4.5:1', '正文文字的 AA 级下限']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex12-1',
        title: '给禁用按钮换一套样子',
        task: [
          '禁用按钮看着跟能点的一样，用户点了没反应更困惑。',
          '',
          '要求：只改 `css` 栏，给 `.btn:disabled` 设上浅灰的文字（`#999999`）和更浅的底（`#f6f4ec`），'
            + '同时让能用的时候看起来不变。'
        ].join('\n'),
        starter: {
          html: [
            '<button class="btn">可以点</button>',
            '<button class="btn" disabled>点不了</button>'
          ].join('\n'),
          css: [
            '.btn { padding: 8px 14px; margin-right: 8px; border: 1px solid #2456c8; border-radius: 6px; background: #fff; color: #2456c8; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<button class="btn">可以点</button>',
            '<button class="btn" disabled>点不了</button>'
          ].join('\n'),
          css: [
            '.btn { padding: 8px 14px; margin-right: 8px; border: 1px solid #2456c8; border-radius: 6px; background: #fff; color: #2456c8; font-size: 13px; }',
            '.btn:disabled { color: #999999; background: #f6f4ec; border-color: #d8d3c4; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".btn:disabled", "color"), "rgb(153, 153, 153)", "禁用态文字是浅灰")',
          'eq(style(".btn:disabled", "background-color"), "rgb(246, 244, 236)", "禁用态底色更浅")',
          'eq(style(".btn:not(:disabled)", "background-color"), "rgb(255, 255, 255)", "能点的那颗还是白底")'
        ],
        hints: [
          '`:disabled` 直接写在按钮选择器后面，不用另加类名。',
          '同时改 `border-color` 会更像「灰掉」，但题目只要求文字与底色。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-2',
        title: '把焦点圈找回来',
        task: [
          '有人把输入框的默认外框去掉了，现在键盘 Tab 过来完全看不出焦点在哪。',
          '',
          '要求：只改 `css` 栏，用 `:focus-visible` 给输入框加一条 `2px` 实线主色外框，'
            + '并留 `2px` 的间距。页面里那段 JS 会先把第一个输入框聚焦，好让断言读到焦点样式。'
        ].join('\n'),
        starter: {
          html: [
            '<label class="field"><span>第一条</span><input id="a" type="text" value="用 Tab 键走过来看看"></label>',
            '<label class="field"><span>第二条</span><input id="b" type="text" value="焦点应该看得见"></label>'
          ].join('\n'),
          css: [
            '.field { display: block; margin-bottom: 10px; font-size: 13px; }',
            '.field span { display: block; color: #6b6558; }',
            '.field input { padding: 6px 8px; border: 1px solid #d8d3c4; border-radius: 6px; }'
          ].join('\n'),
          js: [
            "// 保持这一行：它把焦点放进第一个输入框，断言才读得到焦点样式",
            "document.getElementById('a').focus();"
          ].join('\n')
        },
        solution: {
          html: [
            '<label class="field"><span>第一条</span><input id="a" type="text" value="用 Tab 键走过来看看"></label>',
            '<label class="field"><span>第二条</span><input id="b" type="text" value="焦点应该看得见"></label>'
          ].join('\n'),
          css: [
            '.field { display: block; margin-bottom: 10px; font-size: 13px; }',
            '.field span { display: block; color: #6b6558; }',
            '.field input { padding: 6px 8px; border: 1px solid #d8d3c4; border-radius: 6px; }',
            '.field input:focus-visible { outline: 2px solid #2456c8; outline-offset: 2px; }'
          ].join('\n'),
          js: [
            "// 保持这一行：它把焦点放进第一个输入框，断言才读得到焦点样式",
            "document.getElementById('a').focus();"
          ].join('\n')
        },
        tests: [
          'eq(style("#a", "outline-style"), "solid", "聚焦的第一个输入框有实线外框")',
          'eq(px("#a", "outline-width"), 2, 0.5, "外框宽度 2px")',
          'eq(px("#a", "outline-offset"), 2, 0.5, "外框与元素之间留 2px")',
          'eq(style("#b", "outline-style"), "none", "没聚焦的那个不画外框")'
        ],
        hints: [
          '`:focus-visible` 在脚本调用 `focus()` 时也会触发（脚本触发被视作需要提示的焦点）。',
          '`outline` 与 `outline-offset` 是两条声明，缩写形式写 `outline: 2px solid #2456c8`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-3',
        title: '用兄弟选择器给错误字段加提示',
        task: [
          '输入不合法的那个字段，提示文字没有任何变化。',
          '',
          '要求：只改 `css` 栏，让**不合法**的输入框边框变红（`#c2456b`），'
            + '并且它后面紧跟的 `.hint` 文字也变红。'
        ].join('\n'),
        starter: {
          html: [
            '<label class="field">',
            '  <input type="email" value="bad-email">',
            '  <span class="hint">请输入有效邮箱</span>',
            '</label>',
            '<label class="field">',
            '  <input type="email" value="ok@example.com">',
            '  <span class="hint">请输入有效邮箱</span>',
            '</label>'
          ].join('\n'),
          css: [
            '.field { display: block; margin-bottom: 10px; }',
            '.field input { padding: 6px 8px; border: 1px solid #d8d3c4; border-radius: 6px; }',
            '.hint { display: block; font-size: 12px; color: #6b6558; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<label class="field">',
            '  <input type="email" value="bad-email">',
            '  <span class="hint">请输入有效邮箱</span>',
            '</label>',
            '<label class="field">',
            '  <input type="email" value="ok@example.com">',
            '  <span class="hint">请输入有效邮箱</span>',
            '</label>'
          ].join('\n'),
          css: [
            '.field { display: block; margin-bottom: 10px; }',
            '.field input { padding: 6px 8px; border: 1px solid #d8d3c4; border-radius: 6px; }',
            '.hint { display: block; font-size: 12px; color: #6b6558; }',
            '.field input:invalid { border-color: #c2456b; }',
            '.field input:invalid + .hint { color: #c2456b; }'
          ].join('\n')
        },
        tests: [
          'eq(style("input:invalid", "border-top-color"), "rgb(194, 69, 107)", "不合法的输入框边框变红")',
          'eq(style("input:invalid + .hint", "color"), "rgb(194, 69, 107)", "紧跟其后的提示也变红")',
          'eq(style("input:valid + .hint", "color"), "rgb(107, 101, 88)", "合法的那个字段不受影响")'
        ],
        hints: [
          '浏览器按 `type="email"` 自己判合法性，不用写 JS。',
          '要让后面的提示跟着变，用相邻兄弟选择器 `+` 拼在 `:invalid` 后面。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-4',
        title: '勾选之后整行变样',
        task: [
          '选中的那一项没有任何视觉反馈。',
          '',
          '要求：只改 `css` 栏，让**被勾选**的那一项整行背景变成 `#eaf0ff`、文字变主色 `#2456c8`。'
        ].join('\n'),
        starter: {
          html: [
            '<label class="opt"><input type="radio" name="p" checked><span>方案甲</span></label>',
            '<label class="opt"><input type="radio" name="p"><span>方案乙</span></label>'
          ].join('\n'),
          css: [
            '.opt { display: block; padding: 8px 10px; margin-bottom: 6px; border: 1px solid #e0dbcc; border-radius: 6px; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<label class="opt"><input type="radio" name="p" checked><span>方案甲</span></label>',
            '<label class="opt"><input type="radio" name="p"><span>方案乙</span></label>'
          ].join('\n'),
          css: [
            '.opt { display: block; padding: 8px 10px; margin-bottom: 6px; border: 1px solid #e0dbcc; border-radius: 6px; font-size: 13px; }',
            '.opt:has(input:checked) { background: #eaf0ff; color: #2456c8; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".opt:has(input:checked)", "background-color"), "rgb(234, 240, 255)", "被选中的那行背景变了")',
          'eq(style(".opt:has(input:checked)", "color"), "rgb(36, 86, 200)", "文字色也变了")',
          'ok(style(".opt").replace(/\\s/g, "") !== style(".opt:has(input:checked)", "background-color").replace(/\\s/g, ""), "未选中的那行样式不同")'
        ],
        hints: [
          '勾选状态在 `input` 上，但要变样的是外层那一行——需要「往回看」，用 `:has()`。',
          '写成 `.opt:has(input:checked)`：选中「里面那个 input 被勾住的 .opt」。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-5',
        title: '把低对比度的说明文字压深',
        task: [
          '说明文字用的浅灰在白底上读不清。',
          '',
          '要求：只改 `css` 栏，把 `.hint` 的颜色换成色板里对比度合格的那一支 `#6b6558`，'
            + '字号保持 `12px` 不动。'
        ].join('\n'),
        starter: {
          html: [
            '<p class="main">主文本用深色。</p>',
            '<p class="hint">这段说明文字原本用的是 #999999，在白底上只有 2.8:1。</p>'
          ].join('\n'),
          css: [
            '.main { margin: 0 0 8px; color: #232019; }',
            '.hint { font-size: 12px; color: #999999; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<p class="main">主文本用深色。</p>',
            '<p class="hint">这段说明文字原本用的是 #999999，在白底上只有 2.8:1。</p>'
          ].join('\n'),
          css: [
            '.main { margin: 0 0 8px; color: #232019; }',
            '.hint { font-size: 12px; color: #6b6558; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".hint", "color"), "rgb(107, 101, 88)", "换成了对比度合格的灰褐")',
          'eq(px(".hint", "font-size"), 12, 0.5, "字号没被改")',
          'eq(style(".main", "color"), "rgb(35, 32, 25)", "主文本的颜色没被波及")'
        ],
        hints: [
          '把颜色换成更暗的一支，不要靠加粗或放大来补救。',
          '`#6b6558` 在白底上的对比度约 5.5:1，够 AA。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
