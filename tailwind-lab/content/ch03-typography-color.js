/* ch03 — 字体与颜色 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch03',
    title: '第 3 章 · 字体与颜色',
    goal: '用一组收窄的字号、字重、颜色工具类把文字排顺；知道颜色为什么算出来是 `oklch()`，为什么判题要按它写。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 字号是一张阶梯表',
          '',
          '和间距一样，字号不是任写数字，而是一档一档：',
          '',
          '```',
          'text-xs  text-sm  text-base  text-lg  text-xl  text-2xl  text-3xl  text-4xl',
          '12px     14px     16px       18px     20px     24px      30px      36px',
          '```',
          '',
          '字重同理：`font-normal`（400）、`font-medium`（500）、`font-semibold`（600）、`font-bold`（700）。'
            + '行高可以单独调（`leading-tight` / `leading-normal` / `leading-loose`），也可以通过 `text-lg/8` 这种斜杠语法一起给。',
          '',
          '正文用 `text-sm` 或 `text-base`，标题才往上走。字号混乱是排版「说不出的别扭」最常见的来源。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同一段话，四档字号与字重',
        height: 220,
        html: [
          '<p class="text-xl font-bold">大标题</p>',
          '<p class="text-base font-medium">正文强调</p>',
          '<p class="text-sm">普通说明文字</p>',
          '<p class="text-xs text-gray-500">最次要的注脚</p>'
        ].join('\n'),
        checks: [
          'eq(px(".text-xl", "font-size"), 20, "text-xl = 20px")',
          'eq(style(".font-bold", "font-weight"), "700", "font-bold = 700")',
          'eq(px(".text-xs", "font-size"), 12, "text-xs = 12px")',
          'ok(px(".text-xl", "font-size") > px(".text-sm", "font-size"), "大标题确实更大")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 颜色：色相 + 深浅',
          '',
          '颜色类名的形状是 `{属性}-{色相}-{深浅}`：`bg-blue-500`、`text-gray-700`、`border-red-300`。'
            + '深浅是 `50` 到 `950` 的一条梯度，`50` 最浅、`500` 是中档、`900` 以上接近黑。',
          '',
          '记法是：**浅色当背景，深色当文字**。`bg-gray-100` 配 `text-gray-800`、`bg-blue-600` 配 `text-white`，'
            + '对比度自然够。这也是为什么它做出来的界面不容易「颜色脏」。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '判题要读颜色的**计算值**。Tailwind 4 的颜色算出来是 `oklch(…)` 而不是 `rgb(…)`——'
          + '因为它的调色板现在基于 OKLCH 色彩空间。写断言时别按 `rgb` 猜，'
          + '先用预览窗跑一遍、把 `style()` 读到的值抄下来。'
      },
      {
        kind: 'exercise',
        id: 'ex03-1',
        title: '把标题和正文分出层次',
        task: [
          '标题和正文目前一样大、一样重。',
          '',
          '要求：只改 `html` 栏，给 `h1` 加 `text-2xl` 和 `font-bold`，给 `.lead` 加 `text-base`。'
        ].join('\n'),
        starter: {
          html: [
            '<h1>产品说明</h1>',
            '<p class="lead">一句话讲清它是什么。</p>'
          ].join('\n'),
          css: [
            'p { color: #6b6558; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<h1 class="text-2xl font-bold">产品说明</h1>',
            '<p class="lead text-base">一句话讲清它是什么。</p>'
          ].join('\n')
        },
        tests: [
          'eq(px("h1", "font-size"), 24, "标题 24px")',
          'eq(style("h1", "font-weight"), "700", "标题加粗")',
          'eq(px(".lead", "font-size"), 16, "正文 16px")',
          'ok(px("h1", "font-size") > px(".lead", "font-size"), "标题比正文大")'
        ],
        hints: [
          '`text-2xl` 是 24px，比 `text-xl` 大一档。',
          '字号和字重是两条独立的类，都要写。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-2',
        title: '给按钮配上够对比的颜色',
        task: [
          '一个浅色按钮，文字看不清。',
          '',
          '要求：只改 `html` 栏，给 `.btn` 加 `bg-blue-600` 和 `text-white`；'
            + '文字对比度要够（浅底深字、或深底浅字）。'
        ].join('\n'),
        starter: {
          html: '<button class="btn p-2 rounded">提交</button>',
          css: [
            '.btn { font-size: 13px; border: 0; }'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn p-2 rounded bg-blue-600 text-white">提交</button>'
        },
        tests: [
          'ok(style(".btn", "background-color").indexOf("oklch") === 0, "背景用上了 Tailwind 的蓝")',
          'eq(style(".btn", "color"), "rgb(255, 255, 255)", "文字是白色")',
          'ok(style(".btn", "background-color") !== style("body", "background-color"), "按钮底色和页面不同")'
        ],
        hints: [
          '`text-white` 的字面值是 `rgb(255, 255, 255)`，写断言时可以直接写这个。',
          '深底浅字用 `bg-*-600` 以上 + `text-white`；浅底深字用 `bg-*-100` + `text-*-800`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-3',
        title: '次要文字压到最浅但不失真',
        task: [
          '一行注脚想低调一点，但不能浅到看不清。',
          '',
          '要求：只改 `html` 栏，给 `.note` 加 `text-xs` 和 `text-gray-500`。'
        ].join('\n'),
        starter: {
          html: '<p class="note">每单限购两件。</p>',
          css: [
            'body { font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<p class="note text-xs text-gray-500">每单限购两件。</p>'
        },
        tests: [
          'eq(px(".note", "font-size"), 12, "注脚 12px")',
          'ok(style(".note", "color") !== style("body", "color"), "颜色和正文不同，确实压浅了")',
          'ok(style(".note", "color").indexOf("oklch") === 0 || style(".note", "color").indexOf("rgb") === 0, "颜色是可计算值")'
        ],
        hints: [
          '`text-gray-500` 是中灰；再往下 `gray-400` 在白底上对比度就偏低了。',
          '次要文字靠「字号 + 颜色」一起压，别只压颜色。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-4',
        title: '用行高与字距让标题更稳',
        task: [
          '一个英文大标题行距太松、字距太挤。',
          '',
          '要求：只改 `html` 栏，给 `.hero` 加 `text-3xl`、`tracking-tight`（收紧字距）、`leading-none`（行高收到与字号等大）。'
        ].join('\n'),
        starter: {
          html: '<h1 class="hero">Ship It Faster</h1>',
          css: [
            'body { font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: '<h1 class="hero text-3xl tracking-tight leading-none">Ship It Faster</h1>'
        },
        tests: [
          'eq(px(".hero", "font-size"), 30, "text-3xl = 30px")',
          'ok(parseFloat(style(".hero", "letter-spacing")) < 0, "tracking-tight 收紧字距（负值）")',
          'ok(parseFloat(style(".hero", "line-height")) < 36, "leading-none 把行高压到 36px 以下（默认是 36px）")'
        ],
        hints: [
          '`tracking-tight` 是负字距，`leading-none` 的行高等于字号本身。',
          '大标题默认行距会显得空，收一下更紧凑。注意 `leading-tight`（1.25）在这个字号下反而比默认的 1.2 更松。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
