/* ch04 — 显示方式与定位 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch04',
    title: '第 4 章 · 显示方式与定位',
    goal: '知道每个元素为什么占一行或挤在一行，能让元素脱离普通流、固定在窗口角落，并说清它盖在谁上面。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## display 决定它怎么摆',
          '',
          '- `block`：独占一行，宽度默认撑满（`div`、`p`、`h1`）',
          '- `inline`：跟文字排在同一行，宽高由内容决定，**设 `width` / `height` 无效**（`span`、`a`、`strong`）',
          '- `inline-block`：跟文字排在同一行，但宽高、内边距（上下也生效）、边框都照用',
          '- `none`：从渲染里彻底拿掉，不占位置（跟 `visibility: hidden` 不同——那个还占位）',
          '',
          '新手最常踩的一条：给 `span` 写 `width` 没反应。因为它是 `inline`，先改成 `inline-block`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'inline 设宽高无效，inline-block 可以',
        height: 210,
        html: [
          '<p>两个 span 都写了 <code>width: 160px; height: 40px</code>：</p>',
          '<span class="a">短</span>',
          '<span class="b">短</span>'
        ].join('\n'),
        css: [
          '.a, .b { width: 160px; height: 40px; padding: 6px; background: #fdd; margin-right: 8px; }',
          '.b { display: inline-block; background: #dfd; }'
        ].join('\n'),
        checks: [
          'ok(rect(".a").w < 60, "inline 的宽度由内容决定（一个汉字加内边距），写了 160 没用")',
          'near(px(".b", "width"), 160, 1, "inline-block 认下 160px")',
          'near(px(".b", "height"), 40, 1, "高度也认下 40px")',
          'ok(rect(".b").h > rect(".a").h, "两个盒子高度差得很明显")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '「为什么设了 `width` 没变宽」的排查顺序：先看 `display` 是不是 `inline`，'
          + '再看是不是被 `flex` 容器当成了弹性项（那时的尺寸由 `flex-basis` / `flex-grow` 管）。'
      },
      {
        kind: 'prose',
        md: [
          '## position：五种定位',
          '',
          '- `static`：默认值，待在普通流里',
          '- `relative`：相对**自己原来的位置**挪动，原来的位置还占着',
          '- `absolute`：脱离普通流，相对**最近的一个定位祖先**摆（没有就相对初始包含块）',
          '- `fixed`：脱离普通流，相对**视口**摆，滚动时不动',
          '- `sticky`：在滚动到指定阈值前是普通流，之后粘住',
          '',
          '`absolute` 的参照物是「最近的 `position` 不是 `static` 的祖先」。想让它相对某个盒子定位，'
            + '得给那个盒子加 `position: relative`——这是「绝对定位飞到页面外面去了」的唯一原因。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: 'absolute 相对最近的定位祖先',
        height: 220,
        html: [
          '<div class="stage">',
          '  <span class="dot">角标</span>',
          '</div>'
        ].join('\n'),
        css: [
          '.stage { position: relative; width: 320px; height: 120px; background: #f6f4ec; border: 1px solid #d8d3c4; }',
          '.dot { position: absolute; top: 8px; right: 8px; background: #2456c8; color: #fff; padding: 2px 8px; border-radius: 10px; }'
        ].join('\n'),
        checks: [
          'eq(style(".stage", "position"), "relative", "父盒子是定位参照")',
          'near(rect(".dot").x + rect(".dot").w, rect(".stage").x + rect(".stage").w - 8, 3, "角标离父盒子右边 8px")',
          'near(rect(".dot").y, rect(".stage").y + 8, 3, "角标离父盒子上边 8px")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## z-index 只在同一个层叠上下文里比大小',
          '',
          '`z-index` 管的是「谁盖在谁上面」，但它有两个前提：',
          '',
          '1. 元素得先脱离普通流（`position` 不是 `static`，或者用 flex/grid 的子项加 `z-index`）',
          '2. 只能跟**同一个层叠上下文**里的兄弟比',
          '',
          '一个元素只要满足下面任意一条，就自成一个层叠上下文：`position` 加 `z-index` 不为 `auto`、'
            + '`opacity` 小于 1、`transform` 不是 `none`、`filter` 不是 `none`、`isolation: isolate`。',
          '',
          '后果：**父元素的 `z-index` 一旦定了，子元素再大也翻不出这个父元素的层级**。'
            + '看到「设了 `z-index: 9999` 还是被盖住」，先顺着 DOM 往上找一个创建了层叠上下文的祖先。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一个上下文里的 z-index 比大小',
        height: 200,
        html: [
          '<div class="stack">',
          '  <div class="box one">z-index: 1</div>',
          '  <div class="box two">z-index: 2</div>',
          '  <div class="box three">z-index: 3</div>',
          '</div>'
        ].join('\n'),
        css: [
          '.stack { position: relative; height: 120px; }',
          '.box { position: absolute; width: 140px; height: 60px; padding: 6px; color: #fff; font-size: 12px; }',
          '.one { left: 0; top: 0; background: #8a8f98; z-index: 1; }',
          '.two { left: 60px; top: 24px; background: #6b6558; z-index: 2; }',
          '.three { left: 120px; top: 48px; background: #2456c8; z-index: 3; }'
        ].join('\n'),
        checks: [
          'eq(style(".one", "z-index"), "1", "第一个的层级")',
          'eq(style(".three", "z-index"), "3", "第三个最高")',
          'ok(rect(".three").x > rect(".one").x && rect(".three").y > rect(".one").y, "排在最上面，也是最后画的那个")'
        ]
      },
      {
        kind: 'table',
        head: ['值 / 属性', '行为'],
        rows: [
          ['`display: block`', '独占一行，宽度默认撑满'],
          ['`display: inline`', '跟文字同行，`width` / `height` 无效'],
          ['`display: inline-block`', '同行排列，宽高与内边距都生效'],
          ['`display: none`', '不渲染、不占位'],
          ['`visibility: hidden`', '不显示，但位置还占着'],
          ['`position: relative`', '相对原位偏移，原位保留'],
          ['`position: absolute`', '脱离普通流，相对最近的定位祖先'],
          ['`position: fixed`', '相对视口，滚动时不动'],
          ['`position: sticky`', '滚到阈值后粘住，容器里有效'],
          ['`z-index`', '同层叠上下文里比大小，数值大的盖在上面']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex04-1',
        title: '让两个标签真正并排',
        task: [
          '两个标签想左右并排，但左边那个设了宽度没用。',
          '',
          '要求：只改 `css` 栏，让两个标签各占 `120px` 宽、并排在一行。'
        ].join('\n'),
        starter: {
          html: [
            '<span class="chip">标签一</span>',
            '<span class="chip">标签二</span>'
          ].join('\n'),
          css: [
            '.chip { width: 120px; padding: 6px 10px; background: #eef; border-radius: 6px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.chip { display: inline-block; width: 120px; padding: 6px 10px; background: #eef; border-radius: 6px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".chip", "display"), "inline-block", "两个标签是 inline-block")',
          'near(rect(".chip").w, 140, 6, "宽度生效（120 + 左右 padding）")',
          'ok(rect(".chip").y === rect(".chip:nth-of-type(2)").y, "两个标签在同一行")'
        ],
        hints: [
          '`span` 默认是 `inline`，`width` 对它无效。',
          '改成 `inline-block`：既能并排，又认宽高。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-2',
        title: '把角标钉到卡片右上角',
        task: [
          '角标现在被挤到卡片下面去了。要求把它钉在卡片的右上角，卡片位置不能动。',
          '',
          '要求：只改 `css` 栏，角标距卡片上边和右边各 `10px`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="card">',
            '  <p>卡片正文</p>',
            '  <span class="badge">新</span>',
            '</div>'
          ].join('\n'),
          css: [
            '.card { width: 260px; height: 120px; padding: 12px; background: #f6f4ec; border: 1px solid #d8d3c4; }',
            '.badge { top: 10px; right: 10px; background: #2456c8; color: #fff; padding: 2px 8px; border-radius: 10px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="card">',
            '  <p>卡片正文</p>',
            '  <span class="badge">新</span>',
            '</div>'
          ].join('\n'),
          css: [
            '.card { position: relative; width: 260px; height: 120px; padding: 12px; background: #f6f4ec; border: 1px solid #d8d3c4; }',
            '.badge { position: absolute; top: 10px; right: 10px; background: #2456c8; color: #fff; padding: 2px 8px; border-radius: 10px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".badge", "position"), "absolute", "角标用了绝对定位")',
          'near(rect(".badge").y, rect(".card").y + 10, 3, "距卡片上边 10px")',
          'near(rect(".badge").x + rect(".badge").w, rect(".card").x + rect(".card").w - 10, 3, "距卡片右边 10px")'
        ],
        hints: [
          '只写 `top` / `right` 但不写 `position`，这两个属性一点作用都没有。',
          '角标要知道「相对谁」，所以卡片得先变成定位元素：`position: relative`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-3',
        title: '让提示条跟着窗口停在底部',
        task: [
          '底部提示条现在跟着页面一起滚走了。要求让它固定贴在窗口底部，长度铺满。',
          '',
          '要求：只改 `css` 栏。页面里那 300px 高的占位块不要动，它是用来看滚动效果的。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="spacer">这一块只是把页面撑长</div>',
            '<div class="toast">固定底部的提示条</div>'
          ].join('\n'),
          css: [
            '.spacer { height: 300px; background: #f6f4ec; }',
            '.toast { left: 0; right: 0; bottom: 0; padding: 8px 12px; background: #2456c8; color: #fff; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="spacer">这一块只是把页面撑长</div>',
            '<div class="toast">固定底部的提示条</div>'
          ].join('\n'),
          css: [
            '.spacer { height: 300px; background: #f6f4ec; }',
            '.toast { position: fixed; left: 0; right: 0; bottom: 0; padding: 8px 12px; background: #2456c8; color: #fff; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".toast", "position"), "fixed", "提示条是 fixed")',
          'near(rect(".toast").y + rect(".toast").h, window.innerHeight, 2, "贴着窗口底边")',
          'near(rect(".toast").x, 0, 2, "从左边 0 开始")'
        ],
        hints: [
          '相对窗口定位、滚动时纹丝不动的是 `fixed`。',
          '`top` / `right` / `bottom` / `left` 只在元素脱离普通流（定位不为 `static`）时才有意义。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-4',
        title: '把被盖住的弹层拎上来',
        task: [
          '下拉面板被下面那张卡片盖住了一半。',
          '',
          '要求：只改 `css` 栏，让面板完整显示在卡片上面。不要改 DOM 顺序，也不要改 `top` / `left`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="wrap">',
            '  <div class="panel">下拉面板</div>',
            '  <div class="card">一张普通的卡片</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.wrap { position: relative; height: 160px; }',
            '.panel { position: absolute; top: 10px; left: 10px; width: 200px; height: 80px; background: #2456c8; color: #fff; padding: 8px; }',
            '.card { position: absolute; top: 40px; left: 60px; width: 200px; height: 80px; background: #e0dbcc; padding: 8px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="wrap">',
            '  <div class="panel">下拉面板</div>',
            '  <div class="card">一张普通的卡片</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.wrap { position: relative; height: 160px; }',
            '.panel { position: absolute; top: 10px; left: 10px; width: 200px; height: 80px; background: #2456c8; color: #fff; padding: 8px; z-index: 2; }',
            '.card { position: absolute; top: 40px; left: 60px; width: 200px; height: 80px; background: #e0dbcc; padding: 8px; z-index: 1; }'
          ].join('\n')
        },
        tests: [
          'ok(Number(style(".panel", "z-index")) > Number(style(".card", "z-index")), "面板的 z-index 比卡片大")',
          'eq(style(".panel", "position"), "absolute", "面板仍是绝对定位")',
          'near(rect(".panel").y, rect(".wrap").y + 10, 3, "位置没被改动")'
        ],
        hints: [
          '两个元素都是绝对定位，谁在上面就看 `z-index`；都不写时按 DOM 顺序，后面的盖前面的。',
          '给面板一个更大的 `z-index`（比如 2），卡片保持默认或 1。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex04-5',
        title: '让表头滚动时粘住',
        task: [
          '列表很长，往下滚就看不见表头了。',
          '',
          '要求：只改 `css` 栏，让表头滚动时粘在容器顶部（容器顶边处）。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="box">',
            '  <div class="head">表头</div>',
            '  <p>第一行内容</p>',
            '  <p>第二行内容</p>',
            '  <p>第三行内容</p>',
            '  <p>第四行内容</p>',
            '  <p>第五行内容</p>',
            '  <p>第六行内容</p>',
            '</div>'
          ].join('\n'),
          css: [
            '.box { height: 140px; overflow: auto; border: 1px solid #d8d3c4; }',
            '.head { top: 0; background: #2456c8; color: #fff; padding: 6px 10px; }',
            '.box p { margin: 0; padding: 10px; border-bottom: 1px solid #eee; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="box">',
            '  <div class="head">表头</div>',
            '  <p>第一行内容</p>',
            '  <p>第二行内容</p>',
            '  <p>第三行内容</p>',
            '  <p>第四行内容</p>',
            '  <p>第五行内容</p>',
            '  <p>第六行内容</p>',
            '</div>'
          ].join('\n'),
          css: [
            '.box { height: 140px; overflow: auto; border: 1px solid #d8d3c4; }',
            '.head { position: sticky; top: 0; background: #2456c8; color: #fff; padding: 6px 10px; }',
            '.box p { margin: 0; padding: 10px; border-bottom: 1px solid #eee; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".head", "position"), "sticky", "表头用了 sticky")',
          'eq(style(".head", "top"), "0px", "粘住的阈值是 0")',
          'has(".box > .head", "表头还是容器的直接子元素")'
        ],
        hints: [
          '`sticky` = 普通流 + 到阈值后粘住，光写 `top` 不写 `position` 是不动的。',
          '粘住的范围是最近的滚动祖先，这里的滚动容器就是 `.box`。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
