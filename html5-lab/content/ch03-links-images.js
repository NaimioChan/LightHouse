/* ch03 — 链接与图片 */
(function (root) {
  /* 自包含的占位图：内联 SVG，不指向任何网络地址 */
  var IMG = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='160'%20height='100'%3E%3Crect%20width='160'%20height='100'%20fill='%23b0563a'/%3E%3Ccircle%20cx='80'%20cy='50'%20r='26'%20fill='%23f2e9dc'/%3E%3C/svg%3E";

  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch03',
    title: '第 3 章 · 链接与图片',
    goal: '写出指向正确、新窗口打开也安全的链接，以及带说明文字的图片。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 链接用 href 指路',
          '',
          '`a` 是链接，`href` 说清点下去去哪。常见的目标有四类：',
          '',
          '- `#id` 跳到同一页里的某个元素（锚点）',
          '- `page.html` 跳到同站的另一个文件（相对路径）',
          '- `https://…` 跳到别的站点（完整地址）',
          '- `mailto:you@example.com` 打开写信窗口',
          '',
          '锚点的 `#id` 要和页面里某个元素的 `id` 对上，否则点了没反应。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '三种目标各写一个链接',
        height: 190,
        html: [
          '<nav>',
          '  <a href="#later">跳到后面</a>',
          '  <a href="about.html">站内页面</a>',
          '  <a href="https://developer.mozilla.org/">MDN</a>',
          '</nav>',
          '<h2 id="later">后面的段落</h2>'
        ].join('\n'),
        checks: [
          'count("a", 3, "三个链接")',
          'eq(attr("a", "href"), "#later", "第一个是站内锚点")',
          'eq(text("a"), "跳到后面", "链接文字")',
          'has("h2#later", "锚点目标存在")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 新标签页要配一个安全开关',
          '',
          '让链接在新标签页打开，写 `target="_blank"`。同时一定加上 `rel="noopener"`。',
          '',
          '少了它，被打开的那个页面能通过 `window.opener` 拿到你的页面，甚至把它导航到别处。',
          '',
          '记住成对出现：`target="_blank"` 和 `rel="noopener"` 一起写。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '邮件链接与新标签页链接',
        height: 190,
        html: [
          '<p>有问题写信到 <a href="mailto:hi@example.com">hi@example.com</a>。</p>',
          '<p>',
          '  <a href="https://example.com/docs" target="_blank" rel="noopener">在新标签页打开文档</a>',
          '</p>'
        ].join('\n'),
        checks: [
          'eq(attr("a", "href"), "mailto:hi@example.com", "第一个是邮件链接")',
          'eq(attr("a[target]", "target"), "_blank", "这个链接在新标签页打开")',
          'eq(attr("a[target]", "rel"), "noopener", "新窗口链接配了 rel")'
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`target="_blank"` 不写 `rel="noopener"` 是个真实的漏洞：被打开的页面能反过来操纵你这一页。两处一起写，别偷懒。'
      },
      {
        kind: 'prose',
        md: [
          '## 图片的 alt 是给看不到图的人写的',
          '',
          '`img` 用 `src` 指图片，`alt` 写它的文字替代：图片没加载出来时显示它，读屏软件念它。',
          '',
          '装饰性的小图写 `alt=""`，让读屏软件跳过；承载信息的图，`alt` 要写出它传达的内容。',
          '',
          '再写上 `width` 和 `height`，浏览器能提前留出位置，图片加载时页面不会跳。`loading="lazy"` 让图片滚到附近再加载。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一张带说明的图片',
        height: 230,
        html: [
          '<figure>',
          '  <img src="' + IMG + '" alt="深红底色上居中的一个浅色圆" width="160" height="100" loading="lazy">',
          '  <figcaption>一张占位图，说明写在 figcaption 里。</figcaption>',
          '</figure>'
        ].join('\n'),
        checks: [
          'eq(attr("img", "alt"), "深红底色上居中的一个浅色圆", "alt 描述图片内容")',
          'eq(attr("img", "width"), "160", "写明宽度")',
          'eq(attr("img", "height"), "100", "写明高度")',
          'eq(attr("img", "loading"), "lazy", "懒加载")',
          'eq(tag("figure figcaption"), "figcaption", "图片配图注")'
        ]
      },
      {
        kind: 'table',
        head: ['标签 / 属性', '作用'],
        rows: [
          ['`a` + `href`', '链接与它的目标'],
          ['`target="_blank"`', '在新标签页打开'],
          ['`rel="noopener"`', '新窗口链接的安全开关，和一栏一起写'],
          ['`img` + `src`', '图片与它的地址'],
          ['`alt`', '图片的文字替代'],
          ['`width` / `height`', '预留尺寸，避免加载时页面跳动'],
          ['`loading="lazy"`', '滚到附近再加载']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 链接文字要说清去哪',
          '',
          '链接文字要能单独读出来就知道去向。写「查看规范原文」比写「点击这里」有用得多，因为读屏软件会把页面上所有链接文字单独列出来。',
          '',
          '图片需要补充说明时，用 `figure` 包住 `img`，说明写进 `figcaption`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一眼能看出去哪的链接',
        height: 190,
        html: [
          '<h2>延伸阅读</h2>',
          '<ul>',
          '  <li><a href="https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a">MDN 上 a 元素的说明</a></li>',
          '  <li><a href="about.html">这个站的关于页</a></li>',
          '</ul>'
        ].join('\n'),
        checks: [
          'count("ul a", 2, "两个链接")',
          'eq(text("li a"), "MDN 上 a 元素的说明", "第一段链接文字说清去哪")',
          'eq(attr("li a", "href"), "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/a", "第一个链接的地址")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '纯装饰的图片写 `alt=""`（空字符串），读屏软件会直接跳过它；省掉 `alt` 则会被念成文件路径，反而更吵。'
      },
      {
        kind: 'exercise',
        id: 'ex03-1',
        title: '给三个链接填对地址',
        task: [
          '三个链接的 `href` 都是空的占位。填成正确的目标：',
          '',
          '- 「首页」跳回页顶的锚点 `#top`',
          '- 「关于」指向同站的 `about.html`',
          '- 「邮箱」用 `mailto:` 打开写信窗口，地址 `hi@example.com`'
        ].join('\n'),
        starter: {
          html: [
            '<nav>',
            '  <a href="#">首页</a>',
            '  <a href="#">关于</a>',
            '  <a href="#">邮箱</a>',
            '</nav>'
          ].join('\n')
        },
        solution: {
          html: [
            '<nav>',
            '  <a href="#top">首页</a>',
            '  <a href="about.html">关于</a>',
            '  <a href="mailto:hi@example.com">邮箱</a>',
            '</nav>'
          ].join('\n')
        },
        tests: [
          'count("a", 3, "三个链接")',
          'eq(attr("a", "href"), "#top", "首页跳回锚点")',
          'eq(attr("a:nth-of-type(2)", "href"), "about.html", "关于指向站内页面")',
          'eq(attr("a:nth-of-type(3)", "href"), "mailto:hi@example.com", "邮箱用 mailto")'
        ],
        hints: [
          '页内锚点写成 `#` 加目标元素的 `id`。',
          '邮件链接要带 `mailto:` 前缀，后面跟地址。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-2',
        title: '给新窗口链接补安全开关',
        task: [
          '这个链接已经在新标签页打开了，但少了安全属性。补上它。',
          '',
          '要求：链接继续在新标签页打开，同时补上 `rel="noopener"`。'
        ].join('\n'),
        starter: {
          html: '<p><a href="https://example.com/spec" target="_blank">看规范原文</a></p>'
        },
        solution: {
          html: '<p><a href="https://example.com/spec" target="_blank" rel="noopener">看规范原文</a></p>'
        },
        tests: [
          'eq(attr("a", "target"), "_blank", "在新标签页打开")',
          'eq(attr("a", "rel"), "noopener", "补上 rel=noopener")'
        ],
        hints: [
          '属性写在 `<a` 标签里，空格隔开。',
          '`rel` 的值直接写 `noopener`，不用带引号以外的东西。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-3',
        title: '给图片补上 alt',
        task: [
          '这张图只有地址和尺寸，缺了文字替代。补上 `alt`。',
          '',
          '要求：`alt` 写「深红底色上居中的一个浅色圆」，`width`、`height` 保持不动。'
        ].join('\n'),
        starter: {
          html: '<img src="' + IMG + '" width="160" height="100">'
        },
        solution: {
          html: '<img src="' + IMG + '" width="160" height="100" alt="深红底色上居中的一个浅色圆">'
        },
        tests: [
          'eq(attr("img", "alt"), "深红底色上居中的一个浅色圆", "alt 写出图片内容")',
          'eq(attr("img", "width"), "160", "宽度别弄丢")',
          'eq(attr("img", "height"), "100", "高度别弄丢")'
        ],
        hints: [
          '`alt` 描述图里有什么，不是图片文件名。',
          '新增属性写在同一个 `<img` 标签里。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-4',
        title: '把图片包进 figure',
        task: [
          '图片下面单独挂着一个说明段落。把图和三说明合并成一个图块。',
          '',
          '要求：`figure` 包住 `img`，说明改写成 `figcaption` 放进 `figure` 里。'
        ].join('\n'),
        starter: {
          html: [
            '<img src="' + IMG + '" alt="深红底色上居中的一个浅色圆" width="160" height="100">',
            '<p>深红底色上居中的一个浅色圆。</p>'
          ].join('\n')
        },
        solution: {
          html: [
            '<figure>',
            '  <img src="' + IMG + '" alt="深红底色上居中的一个浅色圆" width="160" height="100">',
            '  <figcaption>深红底色上居中的一个浅色圆。</figcaption>',
            '</figure>'
          ].join('\n')
        },
        tests: [
          'eq(tag("body > figure"), "figure", "图片包进 figure")',
          'has("figure > img", "图片在 figure 里")',
          'eq(tag("figure figcaption"), "figcaption", "说明用 figcaption")',
          'count("p", 0, "原来的说明段落没有了")'
        ],
        hints: [
          '`figure` 是包住图和相关说明的容器。',
          '说明的标签从 `p` 改成 `figcaption`，位置挪到 `figure` 里。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-5',
        title: '给图片加尺寸和懒加载',
        task: [
          '这张图加载时会撑开页面，也没有懒加载。补齐属性。',
          '',
          '要求：`width="160"`、`height="100"`、`loading="lazy"`，`alt` 保持不动。'
        ].join('\n'),
        starter: {
          html: '<img src="' + IMG + '" alt="一张占位图">'
        },
        solution: {
          html: '<img src="' + IMG + '" alt="一张占位图" width="160" height="100" loading="lazy">'
        },
        tests: [
          'eq(attr("img", "loading"), "lazy", "加上懒加载")',
          'eq(attr("img", "width"), "160", "写宽度")',
          'eq(attr("img", "height"), "100", "写高度")',
          'eq(attr("img", "alt"), "一张占位图", "alt 还在")'
        ],
        hints: [
          '`width` 和 `height` 写的是像素数字，不用带 `px`。',
          '`loading="lazy"` 告诉浏览器这张图先别急着加载。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
