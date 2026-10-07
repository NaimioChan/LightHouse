/* ch08 — 排版、颜色与背景 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch08',
    title: '第 8 章 · 排版、颜色与背景',
    goal: '把一段文字调成好读的样子，知道字号为什么别用 px 写死、行高该写几、颜色怎么写才不踩对比度的坑。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 字号：px / rem / em',
          '',
          '- `px` 是绝对单位，用户改了浏览器默认字号它也不会跟着变',
          '- `rem` 相对**根元素**（`html`）的字号，随用户设置缩放',
          '- `em` 相对**当前元素的父元素**字号，会层层累积，嵌套时容易算错',
          '',
          '正文、间距这些用 `rem`；边框、阴影这类「不该随字号缩放」的细线用 `px`。',
          '`1rem` 默认是 16px（除非用户改过或 `html` 上写了 `font-size`）。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'rem 跟着根字号走，px 不跟',
        height: 190,
        html: [
          '<div class="box">',
          '  <p class="px">16px 的字</p>',
          '  <p class="rem">1rem 的字</p>',
          '</div>'
        ].join('\n'),
        css: [
          '.box { font-size: 20px; }',
          '.px { font-size: 16px; }',
          '.rem { font-size: 1rem; }'
        ].join('\n'),
        checks: [
          'near(px(".px", "font-size"), 16, 1, "px 写法就是 16，不看父元素")',
          'near(px(".rem", "font-size"), 16, 1, "1rem 看的是根元素（html 是 16px，body 的 14px 管不到它）")',
          'eq(px(".rem", "font-size"), parseFloat(getComputedStyle(document.documentElement).fontSize), "rem 与根元素字号一致")',
          'eq(style(".px", "font-size"), style(".rem", "font-size"), "这里两者恰好一样大")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 行高与行宽',
          '',
          '`line-height` 写**不带单位的倍数**最稳（`1.6`），因为带单位的值会继承一个绝对值，'
            + '子元素改字号时行高就乱了。',
          '',
          '行宽（measure）比字号更影响可读性。中文正文一行 25–40 字比较舒服，'
            + '用 `max-width` 配合 `em` 限制：`max-width: 34em` 会随字号一起缩放。',
          '',
          '小标题与正文的间距也要管：只写 `margin: 0` 会让整篇挤在一起。',
          '常见的做法是给标题写上「`margin-top` 大、`margin-bottom` 小」。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '行高 1.2 与 1.8 的差别',
        height: 220,
        html: [
          '<p class="tight">排版的第一件事是让人愿意读下去。行高太紧，眼晴在换行时容易串行；行高太松，段落又散了。这一段用 1.2。</p>',
          '<p class="loose">排版的第一件事是让人愿意读下去。行高太紧，眼晴在换行时容易串行；行高太松，段落又散了。这一段用 1.8。</p>'
        ].join('\n'),
        css: [
          'p { width: 320px; font-size: 14px; background: #f6f4ec; margin: 0 0 8px; }',
          '.tight { line-height: 1.2; }',
          '.loose { line-height: 1.8; }'
        ].join('\n'),
        checks: [
          'near(px(".tight", "line-height"), 16.8, 1, "1.2 × 14px，计算值会算成 px")',
          'near(px(".loose", "line-height"), 25.2, 1, "1.8 × 14px")',
          'near(rect(".loose").h / rect(".tight").h, 1.5, 0.1, "行高大的那个整段更高")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`line-height` 不带单位时会被算成一个具体像素值再继承，所以父元素写 `line-height: 1.6`，'
          + '子元素把字号改大，行高**还是父元素算完的那个数**。想要跟着字号走就写倍数，别写 px。'
      },
      {
        kind: 'prose',
        md: [
          '## 颜色的几种写法',
          '',
          '- `#2456c8` 十六进制，最常用',
          '- `rgb(36, 86, 200)` / `rgb(36 86 200 / 40%)` 带透明度',
          '- `hsl(223 80% 46%)` 色相/饱和度/亮度，调色时比十六进制好推：改亮度就是改最后一个数',
          '- `currentColor` 取当前 `color` 的值，做「边框跟文字同色」很方便',
          '',
          '`opacity` 与 `rgba` 不一样：`opacity` 会把整个元素（含子元素）一起变透明，'
            + '`rgba` 只影响那一个颜色。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'currentColor 让边框自动跟文字同色',
        height: 190,
        html: [
          '<a class="chip" href="#end">默认色</a>',
          '<a class="chip warn" href="#end">警示色</a>'
        ].join('\n'),
        css: [
          '.chip { display: inline-block; padding: 4px 10px; margin-right: 8px; color: #2456c8; border: 2px solid currentColor; border-radius: 6px; text-decoration: none; }',
          '.chip.warn { color: #c2456b; }'
        ].join('\n'),
        checks: [
          'eq(style(".chip", "border-top-color"), style(".chip", "color"), "边框颜色就是文字颜色")',
          'eq(style(".chip.warn", "border-top-color"), "rgb(194, 69, 107)", "改了文字色，边框自动跟着变")',
          'ok(style(".chip", "border-top-color") !== style(".chip.warn", "border-top-color"), "两个标签的边框颜色不一样")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 背景：底色、图片、渐变',
          '',
          '`background` 是一组属性的简写，常用三件：',
          '',
          '- `background-color`：底色（写在最前面）',
          '- `background-image: linear-gradient(...)`：渐变，**渐变算图片**，所以用 `background-image` 而不是 `background-color`',
          '- `background-position` / `background-size`：图片的位置与缩放，`cover` 表示铺满且保持比例',
          '',
          '简写里如果漏写 `background-color`，那一条会被重设成透明——这是「写了 `background` 之后底色没了」的原因。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '线性渐变做一条强调条',
        height: 170,
        html: '<div class="bar">渐变背景</div>',
        css: [
          '.bar { padding: 16px; color: #fff; border-radius: 8px;',
          '  background-image: linear-gradient(90deg, #2456c8, #7aa2ff); }'
        ].join('\n'),
        checks: [
          'ok(/linear-gradient/.test(style(".bar", "background-image")), "背景图是渐变")',
          'eq(style(".bar", "background-color"), "rgba(0, 0, 0, 0)", "没有单独的底色")',
          'near(px(".bar", "border-top-left-radius"), 8, 1, "圆角生效")'
        ]
      },
      {
        kind: 'table',
        head: ['写法 / 属性', '说明'],
        rows: [
          ['`px`', '绝对单位，不随用户字号设置变化'],
          ['`rem`', '相对根元素字号，可缩放，间距与字号都用它'],
          ['`em`', '相对父元素字号，嵌套会累积'],
          ['`line-height: 1.6`', '不带单位的倍数，跟着字号走（推荐）'],
          ['`max-width: 34em`', '限制行宽，随字号缩放'],
          ['`#2456c8`', '十六进制颜色'],
          ['`rgb(36 86 200 / 40%)`', '带透明度的颜色'],
          ['`hsl(223 80% 46%)`', '色相/饱和度/亮度，调色好推'],
          ['`currentColor`', '取当前 `color` 的值'],
          ['`linear-gradient(方向, 起, 止)`', '渐变，属于 `background-image`']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex08-1',
        title: '把写死的像素换成长度可缩放的单位',
        task: [
          '这段正文用的是固定像素，用户把浏览器字号调大也不会变。',
          '',
          '要求：只改 `css` 栏，让 `.article` 的字号是 `1.1rem`，'
            + '并且把它限制在 `30em` 宽以内（两个值都别写成 px）。'
        ].join('\n'),
        starter: {
          html: '<p class="article">这一段要能跟着用户的字号设置一起变大变小。浏览器默认字号是 16px，但用户可能改过。</p>',
          css: '.article { font-size: 18px; width: 540px; line-height: 1.7; }'
        },
        solution: {
          css: '.article { font-size: 1.1rem; max-width: 30em; line-height: 1.7; }'
        },
        tests: [
          'near(px(".article", "font-size"), 17.6, 0.5, "1.1rem 在根字号 16px 下算出 17.6px")',
          'ok(style(".article", "max-width") !== "none", "宽度有上限")',
          'near(px(".article", "max-width"), 528, 6, "30em 按这一段的字号算 ≈ 528px")'
        ],
        hints: [
          '`rem` 相对的是根元素字号，`1.1rem` 就是「根字号的 1.1 倍」。',
          '限制行宽用 `max-width`，单位写 `em`，它会跟着这一段的字号一起缩放。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-2',
        title: '把行高写成不累积的倍数',
        task: [
          '标题的字号比正文大，行高却被正文定下的像素值拖着，看着很挤。',
          '',
          '要求：只改 `css` 栏，让 `.body` 的行高写成 `1.8`，并让 `.title` 的行高写成 `1.3`（都用不带单位的倍数）。'
        ].join('\n'),
        starter: {
          html: [
            '<article class="body">',
            '  <h2 class="title">一个标题</h2>',
            '  <p>正文段落。行高写 px 的话，子元素改字号时不会跟着变。</p>',
            '</article>'
          ].join('\n'),
          css: '.body { font-size: 14px; line-height: 26px; }'
        },
        solution: {
          html: [
            '<article class="body">',
            '  <h2 class="title">一个标题</h2>',
            '  <p>正文段落。行高写 px 的话，子元素改字号时不会跟着变。</p>',
            '</article>'
          ].join('\n'),
          css: '.body { font-size: 14px; line-height: 1.8; }\n.title { font-size: 22px; line-height: 1.3; }'
        },
        tests: [
          'near(px(".body", "line-height") / px(".body", "font-size"), 1.8, 0.05, "正文的行高倍数")',
          'near(px(".title", "line-height") / px(".title", "font-size"), 1.3, 0.05, "标题的行高倍数")',
          'ok(px(".title", "font-size") > px(".body", "font-size"), "标题字号确实更大")'
        ],
        hints: [
          '不带单位的 `line-height` 会按「当前元素自己的字号」算，不会继承一个固定像素。',
          '两条规则各写一行，或者把 `.title` 那条也放进 `.body` 的嵌套里。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-3',
        title: '让边框跟着文字走',
        task: [
          '有两种色彩的标签，边框写死了颜色，换成另一种色时边框对不上。',
          '',
          '要求：只改 `css` 栏，让 `.tag` 的边框颜色跟随它自己的 `color`（不要写具体色值）。'
        ].join('\n'),
        starter: {
          html: [
            '<span class="tag">普通</span>',
            '<span class="tag hot">热门</span>'
          ].join('\n'),
          css: [
            '.tag { display: inline-block; padding: 2px 8px; margin-right: 6px; color: #2456c8; border: 2px solid #2456c8; border-radius: 6px; }',
            '.tag.hot { color: #c2456b; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<span class="tag">普通</span>',
            '<span class="tag hot">热门</span>'
          ].join('\n'),
          css: [
            '.tag { display: inline-block; padding: 2px 8px; margin-right: 6px; color: #2456c8; border: 2px solid currentColor; border-radius: 6px; }',
            '.tag.hot { color: #c2456b; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".tag", "border-top-color"), "rgb(36, 86, 200)", "普通标签的边框跟文字同色")',
          'eq(style(".tag.hot", "border-top-color"), "rgb(194, 69, 107)", "热门标签的边框自动换色")',
          'eq(style(".tag", "border-top-width"), "2px", "边框宽度没变")'
        ],
        hints: [
          '`currentColor` 就是「当前的 `color` 值」，可以直接写在需要颜色的地方。',
          '把边框里的具体色值换成 `currentColor`，`.hot` 那条就不用再管边框了。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-4',
        title: '给卡片铺一条渐变',
        task: [
          '卡片现在是纯色底，想要一条从左上到右下的浅色渐变。',
          '',
          '要求：只改 `css` 栏，用 `linear-gradient(135deg, #f6f4ec, #dbe6ff)` 作为背景，'
            + '并保留 `8px` 圆角。'
        ].join('\n'),
        starter: {
          html: '<div class="card">渐变卡片</div>',
          css: '.card { padding: 20px; border-radius: 8px; background-color: #f6f4ec; }'
        },
        solution: {
          css: '.card { padding: 20px; border-radius: 8px; background-image: linear-gradient(135deg, #f6f4ec, #dbe6ff); }'
        },
        tests: [
          'ok(/linear-gradient/.test(style(".card", "background-image")), "背景用了渐变")',
          'ok(/135deg/.test(style(".card", "background-image")), "方向是 135 度")',
          'eq(px(".card", "border-top-left-radius"), 8, "圆角没丢")'
        ],
        hints: [
          '渐变是**图片**，要写在 `background-image` 上，写进 `background-color` 不生效。',
          '原来的 `background-color` 可以删掉，或者留着当渐变不支持时的兜底。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-5',
        title: '把行宽收进舒适区',
        task: [
          '这段文字一行太长，读到行尾很难找到下一行的开头。',
          '',
          '要求：只改 `css` 栏，把宽度限制到 `32em` 以内，字号保持 `15px`，行高保持 `1.7`。'
        ].join('\n'),
        starter: {
          html: '<p class="long">这一行的宽度一直铺到容器边缘，读起来需要眼睛大幅横向移动，换行时很容易跳到别的地方去。合理的做法是给正文一个宽度上限，让每行落在二十到四十个汉字之间。</p>',
          css: '.long { font-size: 15px; line-height: 1.7; background: #f6f4ec; }'
        },
        solution: {
          css: '.long { font-size: 15px; line-height: 1.7; max-width: 32em; background: #f6f4ec; }'
        },
        tests: [
          'eq(px(".long", "font-size"), 15, 0.5, "字号没变")',
          'ok(px(".long", "max-width") > 400 && px(".long", "max-width") < 560, "宽度上限在合理范围（≈ 32 × 15）")',
          'near(px(".long", "line-height") / px(".long", "font-size"), 1.7, 0.05, "行高倍数没变")'
        ],
        hints: [
          '`em` 用在 `max-width` 上时，参照的是**这个元素自己的**字号。',
          '32em 配 15px 的字号大约就是 480px。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
