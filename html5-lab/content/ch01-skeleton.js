/* ch01 — 文档骨架与语义分区 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 文档骨架与语义分区',
    goal: '写出结构正确、能被大纲与读屏软件读懂的页面骨架。',
    sections: [
      {
        kind: 'prose',
        md: [
          '一个 HTML 文件就是一份文档。浏览器从上往下读，把标签变成你看到的页面。',
          '',
          '顶层只有两个容器：`head` 装给机器看的东西（字符集、页面标题、样式），`body` 装给人看的内容。',
          '第一行的 `<!doctype html>` 告诉浏览器「按标准模式渲染」，少了它浏览器会退回一套几十年前的兼容规则。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一份最小的完整文档',
        full: true,
        height: 160,
        html: [
          '<!doctype html>',
          '<html lang="zh-CN">',
          '<head>',
          '  <meta charset="utf-8">',
          '  <title>我的第一个页面</title>',
          '</head>',
          '<body>',
          '  <h1>书架</h1>',
          '  <p>这里是我读过的书。</p>',
          '</body>',
          '</html>'
        ].join('\n'),
        checks: [
          'eq(document.doctype && document.doctype.name, "html", "第一行的 doctype")',
          'eq(attr("html", "lang"), "zh-CN", "html 的 lang")',
          'eq(document.title, "我的第一个页面", "页面标题（标签页上那行字）")',
          'eq(text("h1"), "书架", "一级标题")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 分区：先说这块是什么，再管它长什么样',
          '',
          '`body` 里最外层的几块，用标签名说清各自的角色：',
          '',
          '- `header` 页头，`footer` 页脚',
          '- `nav` 一组导航链接',
          '- `main` 这一页唯一的主题内容，一页只写一个',
          '- `section` 有大纲意义的一个章节，通常带自己的标题',
          '- `article` 能独立拿出去的一整篇内容（一篇文章、一条帖子）',
          '- `aside` 与正文相关的旁支内容（作者介绍、相关链接）',
          '',
          '这些标签的默认外观跟 `div` 一模一样。它们值钱的地方在大纲、读屏软件和你半年后回来改代码时的判断力。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一个有分区的读书笔记页',
        height: 240,
        html: [
          '<header>',
          '  <h1>读书笔记</h1>',
          '  <nav>',
          '    <a href="#recent">最近</a>',
          '    <a href="#all">全部</a>',
          '  </nav>',
          '</header>',
          '<main>',
          '  <article>',
          '    <h2>《设计中的设计》</h2>',
          '    <p>原研哉把设计说成一种观察方式。</p>',
          '  </article>',
          '  <article>',
          '    <h2>《字体故事》</h2>',
          '    <p>一行字的重量，比想象中更能影响阅读。</p>',
          '  </article>',
          '</main>',
          '<footer>',
          '  <p>更新于 2026 年 10 月</p>',
          '</footer>'
        ].join('\n'),
        checks: [
          'count("main", 1, "main 一页只能有一个")',
          'has("header > nav", "导航在页头里")',
          'count("article", 2, "两篇笔记")',
          'eq(tag("main > article"), "article", "main 的第一块是 article")',
          'has("footer p", "页脚里有内容")'
        ]
      },
      {
        kind: 'table',
        head: ['标签', '放什么'],
        rows: [
          ['`header` / `footer`', '页头与页脚，一页各一个'],
          ['`nav`', '一组导航链接，通常放在 header 里'],
          ['`main`', '这一页的主题内容，一页只有一个'],
          ['`section`', '有标题的一个章节'],
          ['`article`', '能独立成篇的内容'],
          ['`aside`', '正文旁边的补充说明']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '别用 `div` 把整页堆出来，也别把 `section` 当万能容器——`section` 的定义是「有大纲位置的章节」，一串没有标题的排版盒子应该继续用 `div`。'
      },
      {
        kind: 'prose',
        md: [
          '## 标题层级是结构，不是字号',
          '',
          '`h1` 到 `h6` 表示层级的深浅：一页一个 `h1` 当主标题，它下面的章节用 `h2`，再往里 `h3`，依此类推。',
          '',
          '跳级（`h1` 直接到 `h4`）和「用 `h4` 只因为字小」都是常见错。要字号小，用 CSS。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '层级正确的文章',
        height: 220,
        html: [
          '<h1>把阳台改成小菜园</h1>',
          '<section>',
          '  <h2>准备</h2>',
          '  <p>两个花盆、一袋营养土，就能开始。</p>',
          '  <h3>光照</h3>',
          '  <p>每天直射四小时以上，叶子才长得挺。</p>',
          '</section>',
          '<section>',
          '  <h2>养护</h2>',
          '  <p>土面干了再浇水，别天天浇。</p>',
          '</section>'
        ].join('\n'),
        checks: [
          'count("h1", 1, "主标题只有一个")',
          'count("h2", 2, "两个章节标题")',
          'eq(tag("section h3"), "h3", "小节用 h3")',
          'count("section", 2, "两个章节")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-1',
        title: '把 div 改成语义标签',
        task: [
          '下面三个块只说了「顶、中间、底」，没说它们是什么。',
          '',
          '把它们换成三个语义标签，并把已经没有作用的 `class` 删掉。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="top">',
            '  <h1>我的小站</h1>',
            '</div>',
            '<div class="content">',
            '  <p>这里放正文。</p>',
            '</div>',
            '<div class="bottom">',
            '  <p>© 2026 示例站点</p>',
            '</div>'
          ].join('\n')
        },
        solution: {
          html: [
            '<header>',
            '  <h1>我的小站</h1>',
            '</header>',
            '<main>',
            '  <p>这里放正文。</p>',
            '</main>',
            '<footer>',
            '  <p>© 2026 示例站点</p>',
            '</footer>'
          ].join('\n')
        },
        tests: [
          'count("header", 1, "页头")',
          'count("main", 1, "主题内容")',
          'count("footer", 1, "页脚")',
          'count("div", 0, "不该再有 div")'
        ],
        hints: [
          '页头用 `header`，这一页唯一的主题内容用 `main`，页脚用 `footer`。',
          '`class` 可以一起删掉：换成语义标签之后，标签名本身就说清了它的角色。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-2',
        title: '把片段补成一份完整文档',
        full: true,
        height: 200,
        task: [
          '现在给你的只有孤零零一个 `html` 和一个标题。补成一份完整文档：',
          '',
          '- 第一行是 `doctype`',
          '- `head` 里有字符集和标题，标题写 **我的练习页**',
          '- 内容放进 `body`',
          '- `html` 上写 `lang="zh-CN"`'
        ].join('\n'),
        starter: {
          html: [
            '<html>',
            '  <h1>练习：整份文档</h1>',
            '</html>'
          ].join('\n')
        },
        solution: {
          html: [
            '<!doctype html>',
            '<html lang="zh-CN">',
            '<head>',
            '  <meta charset="utf-8">',
            '  <title>我的练习页</title>',
            '</head>',
            '<body>',
            '  <h1>练习：整份文档</h1>',
            '</body>',
            '</html>'
          ].join('\n')
        },
        tests: [
          'eq(document.doctype && document.doctype.name, "html", "第一行的 doctype")',
          'eq(document.title, "我的练习页", "文档标题")',
          'has("head > meta", "head 里有 meta")',
          'has("body > h1", "内容在 body 里")',
          'eq(attr("html", "lang"), "zh-CN", "html 的 lang")'
        ],
        hints: [
          '顺序是 `doctype` → `html` → `head`（此刻不含内容）→ `body`。',
          '`<title>` 写在 `head` 里，它决定浏览器标签页上那行字。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-3',
        title: '修好被用坏的标题层级',
        task: [
          '这篇周记把「看起来字小一点」当成了层级：主标题和小节标题都写成了 `h3`。',
          '',
          '按结构改：主标题一级，小节二级。'
        ].join('\n'),
        starter: {
          html: [
            '<h3>周记</h3>',
            '<h3>周一</h3>',
            '<p>读完了一本小说。</p>',
            '<h3>周三</h3>',
            '<p>把上周的笔记整理成了两页。</p>'
          ].join('\n')
        },
        solution: {
          html: [
            '<h1>周记</h1>',
            '<h2>周一</h2>',
            '<p>读完了一本小说。</p>',
            '<h2>周三</h2>',
            '<p>把上周的笔记整理成了两页。</p>'
          ].join('\n')
        },
        tests: [
          'count("h1", 1, "主标题只有一个")',
          'eq(tag("body > h2"), "h2", "第二行是小节标题")',
          'count("h2", 2, "两个小节")',
          'count("h3", 0, "不该再用 h3")'
        ],
        hints: [
          '页面主标题用 `h1`，它下面的小节一律 `h2`。',
          '层级不是字号：想让字变小，是 CSS 的事。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex01-4',
        title: '一篇内容一个 article',
        task: [
          '两本书现在是平铺的标题和段落，读者看不出哪段属于哪本。',
          '',
          '把每本书包成一个 `article`，每篇里有自己的标题和正文。外层标题留在外面当页面主标题。'
        ].join('\n'),
        starter: {
          html: [
            '<h1>两本书</h1>',
            '<h2>《小王子》</h2>',
            '<p>一本写给大人看的童话。</p>',
            '<h2>《人类简史》</h2>',
            '<p>把几万年的历史压缩进一本书。</p>'
          ].join('\n')
        },
        solution: {
          html: [
            '<h1>两本书</h1>',
            '<article>',
            '  <h2>《小王子》</h2>',
            '  <p>一本写给大人看的童话。</p>',
            '</article>',
            '<article>',
            '  <h2>《人类简史》</h2>',
            '  <p>把几万年的历史压缩进一本书。</p>',
            '</article>'
          ].join('\n')
        },
        tests: [
          'count("article", 2, "两本书两篇")',
          'has("article > h2", "每篇有自己的标题")',
          'count("article p", 2, "每篇有一段正文")',
          'eq(text("h1"), "两本书", "页面主标题留在外面")'
        ],
        hints: [
          '标准是「能独立拿出去」：一篇标题加一段正文，就是一个 `article`。',
          '`h2` 和它下面那段 `p` 要一起放进 `article` 里，别只包住标题。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
