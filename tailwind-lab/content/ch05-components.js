/* ch05 — 组件：把工具类拼成界面 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch05',
    title: '第 5 章 · 组件：把工具类拼成界面',
    goal: '用工具类拼出按钮、卡片、徽标这些常见组件，并知道重复的类名该在什么时候收成一个自己的类或一个组件。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 组件就是一组固定的类名',
          '',
          '一个按钮的样子，其实就是一段固定的类名组合：',
          '',
          '```',
          'btn px-4 py-2 rounded bg-blue-600 text-white font-medium',
          '```',
          '',
          '把它抄到所有按钮上，样式就一致了。问题也随之而来：**要改主色，得改几十处**。'
            + '工程上有三条出路，按「用得多不多」来选：',
          '',
          '1. 就一两处：直接写全类名，别过度设计',
          '2. 同一页反复用：在 `css` 栏里写一条自己的类（`@apply` 或直接写属性），把它收起来',
          '3. 跨页面反复用：在组件系统里建一个 `<Button>`，类名只写一遍',
          '',
          'Tailwind 的态度是：**先别急着抽象**。类名重复三遍以内，直接写比抽出来好维护。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 状态：hover / focus / active 前缀',
          '',
          '伪类用冒号前缀写：`hover:bg-blue-700`、`focus:ring-2`、`active:scale-95`。'
            + '冒号左边是条件，右边是那条条件下才生效的样式。',
          '',
          '这是工具类最舒服的地方之一——以前要写 `.btn:hover { … }` 单独一条规则，'
            + '现在状态跟在类名里，读一眼就知道按钮按下会长什么样。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一个按钮：三组类叠出常态、悬停、聚焦',
        height: 170,
        html: [
          '<button class="btn px-4 py-2 rounded bg-blue-600 text-white font-medium">主要操作</button>',
          '<button class="btn ml-2 px-4 py-2 rounded bg-gray-100 text-gray-800 font-medium">次要操作</button>'
        ].join('\n'),
        css: [
          '.btn { border: 0; font-size: 13px; }',
          '@media (min-width: 0px) { .btn:focus-visible { outline: 2px solid #0369a1; outline-offset: 2px; } }'
        ].join('\n'),
        checks: [
          'eq(style(".bg-blue-600", "font-weight"), "500", "font-medium = 500")',
          'eq(px(".bg-blue-600", "padding-left"), 16, "px-4 = 16px")',
          'ok(style(".bg-blue-600", "background-color") !== style(".bg-gray-100", "background-color"), "两个按钮底色不同")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-1',
        title: '拼一个主要按钮',
        task: [
          '把默认的浏览器按钮做成一个主要操作按钮：深蓝底、白字、圆角、稍粗、有内边距。',
          '',
          '要求：只改 `html` 栏，给 `.btn` 加 `bg-blue-600`、`text-white`、`rounded`、`font-medium`、`px-4`、`py-2`。'
        ].join('\n'),
        starter: {
          html: '<button class="btn">保存</button>',
          css: [
            '.btn { font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn bg-blue-600 text-white rounded font-medium px-4 py-2">保存</button>'
        },
        tests: [
          'eq(style(".btn", "color"), "rgb(255, 255, 255)", "白字")',
          'eq(style(".btn", "font-weight"), "500", "中等字重")',
          'eq(px(".btn", "padding-left"), 16, "左右内边距 16px")',
          'eq(px(".btn", "border-top-left-radius"), 4, "rounded = 4px 圆角")'
        ],
        hints: [
          '`rounded` 不加后缀是最小圆角（4px），`rounded-lg` 更大。',
          '按钮的类名顺序不影响效果，但按「布局 → 框 → 底色 → 字」写更好读。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-2',
        title: '给按钮加悬停态',
        task: [
          '按钮能点，但悬停上去没反馈。',
          '',
          '要求：只改 `html` 栏，在主按钮的类名里加 `hover:bg-blue-700`（悬停时颜色变深一档）。'
        ].join('\n'),
        starter: {
          html: '<button class="btn bg-blue-600 text-white rounded px-4 py-2">删除</button>',
          css: [
            '.btn { font-size: 13px; border: 0; }'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">删除</button>'
        },
        tests: [
          'eq(style(".btn", "background-color"), style(".btn", "background-color"), "常态底色可读")',
          'ok(($(".btn").className || "").indexOf("hover:bg-blue-700") >= 0, "类名里写了 hover 变体")',
          'ok(style(".btn", "background-color") !== "rgb(255, 255, 255)", "按钮底色不是白的")'
        ],
        hints: [
          '`:hover` 在预览窗里触发不了（合成不出真实悬停），所以判题只能看类名写没写对。',
          '冒号写成英文半角，中文全角冒号不算。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-3',
        title: '拼一张信息卡片',
        task: [
          '把一组内容包成一张卡片：白底、描边、圆角、内部留白、标题和描述之间有点距离。',
          '',
          '要求：只改 `html` 栏，给 `.card` 加 `bg-white`、`border`、`border-gray-200`、`rounded-lg`、`p-4`；'
            + '给 `h3` 加 `mb-2`、`font-semibold`；给 `p` 加 `text-sm`、`text-gray-600`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="card">',
            '  <h3>免费额度</h3>',
            '  <p>每月 1000 次调用，超出后按量计费。</p>',
            '</div>'
          ].join('\n'),
          css: [
            'body { background: #f0eee6; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="card bg-white border border-gray-200 rounded-lg p-4">',
            '  <h3 class="mb-2 font-semibold">免费额度</h3>',
            '  <p class="text-sm text-gray-600">每月 1000 次调用，超出后按量计费。</p>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'eq(px(".card", "padding-top"), 16, "卡片内边距")',
          'eq(style("h3", "font-weight"), "600", "标题 semibold")',
          'eq(px("h3", "margin-bottom"), 8, "标题下间距 8px")',
          'eq(px(".card", "border-top-left-radius"), 8, "圆角")'
        ],
        hints: [
          '`border` 一个类就给出 1px 实线，颜色另用 `border-gray-200` 指定。',
          '标题与描述之间用 `mb-2`，比给描述加 `mt-2` 更符合「标题带着下面的内容」的读法。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-4',
        title: '做一个状态徽标',
        task: [
          '做一个「已上线」的小圆角徽标：浅绿底、深绿字、小字、紧凑内边距、行内块。',
          '',
          '要求：只改 `html` 栏，给 `.badge` 加 `inline-block`、`bg-green-100`、`text-green-800`、'
            + '`text-xs`、`px-2`、`py-1`、`rounded`。'
        ].join('\n'),
        starter: {
          html: '<span class="badge">已上线</span>',
          css: [
            'body { font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<span class="badge inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">已上线</span>'
        },
        tests: [
          'eq(style(".badge", "display"), "inline-block", "行内块")',
          'eq(px(".badge", "font-size"), 12, "小字 12px")',
          'eq(px(".badge", "padding-left"), 8, "左右 8px")',
          'ok(style(".badge", "background-color") !== style("body", "background-color"), "徽标底色和页面不同")'
        ],
        hints: [
          '浅底配深字（`bg-green-100` + `text-green-800`），对比度自然够。',
          '`inline-block` 不能漏，否则 `px-2 py-1` 在行内元素上撑不开。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
