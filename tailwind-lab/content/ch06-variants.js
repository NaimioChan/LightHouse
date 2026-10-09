/* ch06 — 变体：状态、顺序与关系 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch06',
    title: '第 6 章 · 变体：同一个类在不同条件下',
    goal: '用 `hover:` `disabled:` `first:` `group-hover:` 这些前缀，把「什么条件下长什么样」写进类名，不再为每个状态单开一条规则。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 变体就是「条件 + 类名」',
          '',
          '第 5 章见过 `hover:bg-blue-700`。冒号左边是**条件**，右边是那条条件下才生效的工具类。',
          + '条件可以叠：`md:hover:bg-blue-700` 读作「宽屏且悬停时」。',
          '',
          '变体分几类，记的时候按「它是靠什么触发的」来分：',
          '',
          '- 交互状态：`hover:` `focus:` `active:` `disabled:` `checked:`',
          '- 结构位置：`first:` `last:` `odd:` `even:`',
          '- 元素关系：`group-hover:`（父元素被悬停时，改子元素）、`peer-checked:`（兄弟被勾选时）',
          '',
          '它们生成的 CSS 其实还是普通的 `:hover` / `:first-child` / `.group:hover …`，'
            + '变体只是让你不必离开 HTML 去写那一条规则。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 交互状态：`:hover` `:disabled` `:focus`',
          '',
          '- `hover:bg-blue-700` → 展开成 `.hover\\:bg-blue-700:hover { … }`',
          '- `disabled:opacity-50` → 按钮被禁用时才变半透明',
          '- `focus:outline-none` / `focus:ring-2` → 聚焦时的描边',
          '',
          '一个常见搭配是主按钮的完整状态：`bg-blue-600` 管常态，`hover:bg-blue-700` 管悬停，'
            + '`focus:ring-2` 管聚焦，`disabled:opacity-50` 与 `disabled:cursor-not-allowed` 管禁用。四组类把四种状态都覆盖了。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一排按钮：常态与禁用对比，禁用那个少了一半透明度',
        height: 160,
        html: [
          '<button class="btn bg-blue-600 text-white rounded px-4 py-2">可以点</button>',
          '<button class="btn bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled>禁用了</button>'
        ].join('\n'),
        css: '.btn { font-size: 13px; border: 0; margin-right: 8px; }',
        checks: [
          'eq(style("button:nth-child(1)", "opacity"), "1", "可用按钮不透明")',
          'eq(style("button:nth-child(2)", "opacity"), "0.5", "disabled:opacity-50 = 0.5")',
          'ok(attr("button:nth-child(2)", "disabled") !== null, "第二个确实带 disabled 属性")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 结构位置：`first:` `last:` `odd:` `even:`',
          '',
          '列表里「除了第一个，其余都加上间距」过去要写 `:not(:first-child)`，现在直接 `mt-3 first:mt-0`。'
            + '斑马纹同理：`odd:bg-amber-100 even:bg-sky-100`，奇数行与偶数行各给一个底色。',
          '',
          '这类变体靠元素在兄弟里的**序号**触发，和用户的动作无关，所以判题时能直接读计算值。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一份清单：奇数行暖色、偶数行冷色，首尾去掉多余外边距',
        height: 190,
        html: [
          '<ul class="list">',
          '  <li class="row odd:bg-amber-100 even:bg-sky-100">第一行</li>',
          '  <li class="row odd:bg-amber-100 even:bg-sky-100">第二行</li>',
          '  <li class="row odd:bg-amber-100 even:bg-sky-100">第三行</li>',
          '</ul>'
        ].join('\n'),
        css: '.list { margin: 0; padding: 0; list-style: none; } .row { padding: 8px; font-size: 13px; }',
        checks: [
          'ok(style(".row:nth-child(1)", "background-color") !== style(".row:nth-child(2)", "background-color"), "奇数行与偶数行底色不同")',
          'eq(style(".list", "list-style-type"), "none", "清单去了圆点")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-1',
        title: '给禁用按钮一个状态',
        task: [
          '禁用按钮看起来和能点的一样，用户会去按。',
          '',
          '要求：只改 `html` 栏，给 `.btn` 加 `disabled:opacity-50` 和 `disabled:cursor-not-allowed`。',
          + '（这个按钮在 HTML 里已经带了 `disabled`，所以禁用样式会直接生效。）'
        ].join('\n'),
        starter: {
          html: '<button class="btn" disabled>提交</button>',
          css: [
            '.btn { padding: 8px 16px; background: #2563eb; color: #fff; border: 0; border-radius: 4px; font-size: 13px; cursor: pointer; }'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn disabled:opacity-50 disabled:cursor-not-allowed" disabled>提交</button>'
        },
        tests: [
          'eq(style(".btn", "opacity"), "0.5", "禁用时半透明")',
          'eq(style(".btn", "cursor"), "not-allowed", "禁用时光标是禁止号")',
          'ok(($(".btn").className || "").indexOf("disabled:opacity-50") >= 0, "两处都用 disabled: 变体写的")'
        ],
        hints: [
          '`disabled:` 只在元素带 `disabled` 属性时生效，没写属性的按钮不受影响。',
          '透明度不要写 `opacity-50`（那是无条件生效），要带 `disabled:` 前缀。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-2',
        title: '列表首尾去掉多余外边距',
        task: [
          '每个列表项都有上下外边距，第一项顶部、最后一项底部就多出了一段空白。',
          '',
          '要求：只改 `html` 栏，保留每项的 `mt-3 mb-3`，再用 `first:mt-0` 去掉第一项的上边距、'
            + '用 `last:mb-0` 去掉最后一项的下边距。'
        ].join('\n'),
        starter: {
          html: [
            '<ul class="list">',
            '  <li class="item mt-3 mb-3">甲</li>',
            '  <li class="item mt-3 mb-3">乙</li>',
            '  <li class="item mt-3 mb-3">丙</li>',
            '</ul>'
          ].join('\n'),
          css: [
            '.list { margin: 0; padding: 0; list-style: none; background: #f6f4ec; font-size: 13px; }',
            '.item { padding: 6px 8px; background: #eaf0ff; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<ul class="list">',
            '  <li class="item mt-3 mb-3 first:mt-0 last:mb-0">甲</li>',
            '  <li class="item mt-3 mb-3 first:mt-0 last:mb-0">乙</li>',
            '  <li class="item mt-3 mb-3 first:mt-0 last:mb-0">丙</li>',
            '</ul>'
          ].join('\n')
        },
        tests: [
          'eq(px(".item:nth-child(1)", "margin-top"), 0, "第一项上边距归零")',
          'eq(px(".item:nth-child(2)", "margin-top"), 12, "中间项上边距仍是 12px")',
          'eq(px(".item:nth-child(3)", "margin-bottom"), 0, "最后一项下边距归零")'
        ],
        hints: [
          '三个 `li` 都写同一组类名，语义是一样的：第一个吃掉 `first:`，最后一个吃掉 `last:`。',
          '`mt-3` 是 12px。别去掉它，只在首尾用变体覆盖。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-3',
        title: '给表格行做斑马纹',
        task: [
          '一列数据行，想隔行换个底色，方便横向读。',
          '',
          '要求：只改 `html` 栏，给每个 `.row` 加 `odd:bg-gray-100` 和 `even:bg-white`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="tbl">',
            '  <div class="row">一</div>',
            '  <div class="row">二</div>',
            '  <div class="row">三</div>',
            '  <div class="row">四</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.tbl { background: #e9e5da; font-size: 13px; }',
            '.row { padding: 8px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="tbl">',
            '  <div class="row odd:bg-gray-100 even:bg-white">一</div>',
            '  <div class="row odd:bg-gray-100 even:bg-white">二</div>',
            '  <div class="row odd:bg-gray-100 even:bg-white">三</div>',
            '  <div class="row odd:bg-gray-100 even:bg-white">四</div>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'ok(style(".row:nth-child(1)", "background-color") !== style(".row:nth-child(2)", "background-color"), "相邻两行底色不同")',
          'eq(style(".row:nth-child(1)", "background-color"), style(".row:nth-child(3)", "background-color"), "奇数行底色一致")',
          'eq(style(".row:nth-child(2)", "background-color"), style(".row:nth-child(4)", "background-color"), "偶数行底色一致")'
        ],
        hints: [
          '`odd:` 与 `even:` 按元素在**兄弟里的序号**算，第一个是奇数。',
          '一行行写太啰嗦，实际项目里会给所有行同一个类名，靠变体区分。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-4',
        title: '关系变体：父悬停时子元素变色',
        task: [
          '一张卡片，希望鼠标移到**整张卡**上时，里面的标题才变蓝（而不只是鼠标压到标题上）。',
          '',
          '要求：只改 `html` 栏，给卡片加 `group`，给标题加 `group-hover:text-blue-600`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="card p-4 border border-gray-200 rounded">',
            '  <h3 class="title">卡片标题</h3>',
            '  <p>把鼠标移到这张卡上。</p>',
            '</div>'
          ].join('\n'),
          css: [
            'body { font-size: 13px; }',
            '.title { font-size: 15px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="card group p-4 border border-gray-200 rounded">',
            '  <h3 class="title group-hover:text-blue-600">卡片标题</h3>',
            '  <p>把鼠标移到这张卡上。</p>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'ok(($(".card").className || "").indexOf("group") >= 0, "卡片上写了 group")',
          'ok(($(".title").className || "").indexOf("group-hover:text-blue-600") >= 0, "标题用了 group-hover: 变体")',
          'eq(style(".title", "color"), style("body", "color"), "常态下标题颜色还没变")'
        ],
        hints: [
          '`group` 本身不产生任何样式，它只是一个「我是可以被子元素监视的父元素」的标记。',
          '`:hover` 在预览窗里合成不出真实悬停，所以这里只能看类名写没写对。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex06-5',
        title: '关系变体：勾选后高亮另一处',
        task: [
          '一个复选框控制下面的文字：勾上才变绿。',
          '',
          '要求：只改 `html` 栏，给复选框加 `peer`，给文字加 `peer-checked:text-emerald-700`。'
        ].join('\n'),
        starter: {
          html: [
            '<label class="row"><input type="checkbox" class="cb"> 我已阅读条款</label>',
            '<p class="hint text-gray-400">谢谢确认。</p>'
          ].join('\n'),
          css: [
            'body { font-size: 13px; }',
            '.hint { margin-top: 6px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<input type="checkbox" class="cb peer"> <span>我已阅读条款</span>',
            '<p class="hint peer-checked:text-emerald-700 text-gray-400">谢谢确认。</p>'
          ].join('\n')
        },
        tests: [
          'ok(($(".cb").className || "").indexOf("peer") >= 0, "复选框上写了 peer")',
          'ok(($(".hint").className || "").indexOf("peer-checked:text-emerald-700") >= 0, "文字用了 peer-checked: 变体")',
          'ok((function () { var before = style(".hint", "color"); $(".cb").checked = true; return style(".hint", "color") !== before; })(), "勾选之后颜色真的变了")'
        ],
        hints: [
          '`peer` 要写在**复选框**上，`peer-checked:` 写在被它影响的**兄弟**元素上（必须是兄弟，不能隔层）。',
          '预览窗里勾选不是靠真人点，判断题里主动把它设成 checked 再读一次颜色。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
