/* ch08 — 暗色模式与设计令牌 */
(function (root) {
  (root.TWLAB_CHAPTERS || (root.TWLAB_CHAPTERS = [])).push({
    id: 'ch08',
    title: '第 8 章 · 暗色模式与设计令牌',
    goal: '给一套界面配上暗色版本，并把品牌色这类反复出现的值收进 `@theme` 令牌，以后改一处就全站生效。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 两套底色，两种切换办法',
          '',
          'Tailwind 的 `dark:` 变体和别的变体一样，只是条件换成了「处于暗色模式」。真正要选的是**谁来判定暗色模式**：',
          '',
          '- **跟随系统**：默认行为，等价于 `@media (prefers-color-scheme: dark)`。用户在哪台设备上都自动匹配',
          '- **手动切换**：给 `<html>` 或某个容器加一个 `dark` 类，由页面上的按钮控制。用户能自己选，但要你写存储',
          '',
          '手动切换要先在 CSS 里告诉 Tailwind「`dark` 指的是什么」，v4 用 `@custom-variant` 一行搞定：',
          '',
          '```',
          '@custom-variant dark (&:where(.dark, .dark *));',
          '```',
          '',
          '读作：只要自己在 `.dark` 里、或自己是它的后代，`dark:` 就命中。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '这个训练场的预览窗已经配好了「手动切换」那一条（`.dark` 生效），所以本章练习里的 `dark:` 类'
          + '在带 `.dark` 的容器里就能直接看到效果，不用你自己声明 `@custom-variant`。'
      },
      {
        kind: 'demo',
        caption: '同一个卡片：左边在普通容器里，右边在 .dark 容器里',
        height: 200,
        html: [
          '<div class="wrap">',
          '  <div class="card bg-white dark:bg-slate-900 p-4 rounded border border-gray-200 dark:border-slate-700">',
          '    <h3 class="m-0 text-gray-900 dark:text-gray-100">普通容器</h3>',
          '  </div>',
          '  <div class="dark">',
          '    <div class="card bg-white dark:bg-slate-900 p-4 rounded border border-gray-200 dark:border-slate-700">',
          '      <h3 class="m-0 text-gray-900 dark:text-gray-100">.dark 容器</h3>',
          '    </div>',
          '  </div>',
          '</div>'
        ].join('\n'),
        css: [
          '.wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }',
          'body { font-size: 13px; }',
          'h3 { font-size: 15px; }'
        ].join('\n'),
        checks: [
          'eq(style(".wrap > .card", "background-color"), "rgb(255, 255, 255)", "左边还是白底")',
          'ok(style(".dark .card", "background-color") !== "rgb(255, 255, 255)", "右边的卡片底色变了")',
          'ok(style(".wrap > .card h3", "color") !== style(".dark .card h3", "color"), "两边的标题文字颜色也不同")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 设计令牌：把反复出现的值起个名字',
          '',
          '品牌色会出现在按钮、链接、强调文字、图表里。逐个写死 `bg-[#0ea5e9]`，改一次要翻遍全站。'
            + 'Tailwind 的做法是把这些值收进 `@theme`：',
          '',
          '```',
          '@theme {',
          '  --color-brand: #0ea5e9;',
          '}',
          '```',
          '',
          '命名规则是 `--color-<名字>`，之后就能像内置颜色一样用：`bg-brand`、`text-brand`、`border-brand`。'
            + '这一条 `@theme` 就是**设计令牌**——一个值一处定义，到处引用。',
          '',
          '除了颜色，间距、圆角、字号也能这样起名（`--spacing-…`、`--radius-…`），机制是一样的。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['令牌', '自动生成的工具类', '用途'],
        rows: [
          ['`--color-brand: #0ea5e9`', '`bg-brand` / `text-brand` / `border-brand`', '品牌主色'],
          ['`--color-brand-dark: #0369a1`', '`bg-brand-dark`', '主色的深一档（悬停）'],
          ['`--radius-card: 14px`', '`rounded-card`', '卡片统一圆角'],
          ['`--spacing-gutter: 24px`', '`p-gutter` / `gap-gutter`', '统一栅格间距']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex08-1',
        title: '给卡片配一套暗色',
        task: [
          '卡片现在只有亮色版本，放进暗色容器里也是一张白卡。',
          '',
          '要求：只改 `html` 栏，给 `.card` 加 `dark:bg-slate-900`、`dark:border-slate-700`，'
            + '给标题 `.title` 加 `dark:text-gray-100`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="dark">',
            '  <div class="card bg-white border border-gray-200 p-4 rounded">',
            '    <h3 class="title text-gray-900">设置</h3>',
            '  </div>',
            '</div>'
          ].join('\n'),
          css: 'body { font-size: 13px; } .title { margin: 0; font-size: 15px; }'
        },
        solution: {
          html: [
            '<div class="dark">',
            '  <div class="card bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4 rounded">',
            '    <h3 class="title text-gray-900 dark:text-gray-100">设置</h3>',
            '  </div>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'eq(style(".card", "background-color"), "oklch(0.208 0.042 265.755)", "暗色下卡片变 slate-900")',
          'ok(style(".card", "background-color") !== "rgb(255, 255, 255)", "不再是白底")',
          'ok(style(".title", "color") !== "oklch(0.21 0.034 264.665)", "标题颜色也随暗色变了")'
        ],
        hints: [
          '亮色那份类名留着别删，它是窄屏／未开暗色时的样子。',
          '`:where(.dark, .dark *)` 让容器内**所有后代**都命中，卡片不用自己写 `.dark`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-2',
        title: '把次要文字也降一档',
        task: [
          '暗色下说明文字的对比太强，显得和标题一样重。',
          '',
          '要求：只改 `html` 栏，给 `.note` 保留 `text-gray-500`，再加 `dark:text-gray-400`。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="dark">',
            '  <p class="note text-gray-500 mb-0">每 30 天自动续费。</p>',
            '</div>'
          ].join('\n'),
          css: 'body { font-size: 13px; }'
        },
        solution: {
          html: [
            '<div class="dark">',
            '  <p class="note text-gray-500 dark:text-gray-400 mb-0">每 30 天自动续费。</p>',
            '</div>'
          ].join('\n')
        },
        tests: [
          'eq(style(".note", "color"), "oklch(0.707 0.022 261.325)", "暗色下是 gray-400")',
          'ok(($(".note").className || "").indexOf("dark:text-gray-400") >= 0, "写在类名里的是 dark: 那一档")',
          'ok(($(".note").className || "").indexOf("text-gray-500") >= 0, "亮色那一档还留着")'
        ],
        hints: [
          '亮色的 `text-gray-500` 保留，暗色只是覆盖，不是替换。',
          '暗色底上「比正文浅一点」就够了，别用 `gray-600` 那种偏深的。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-3',
        title: '定义一枚品牌色令牌',
        task: [
          '按钮的蓝色写死在 `bg-[#0ea5e9]`，全站好多处。把它收成令牌。',
          '',
          '要求：只改 `css` 栏，加 `@theme { --color-brand: #0ea5e9; }`；'
            + '并把按钮的类名（`html` 栏）里的 `bg-[#0ea5e9]` 换成 `bg-brand`。两栏都要改。'
        ].join('\n'),
        starter: {
          html: '<button class="btn bg-[#0ea5e9] text-white px-4 py-2 rounded">购买</button>',
          css: [
            'body { font-size: 13px; }',
            '.btn { border: 0; }'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn bg-brand text-white px-4 py-2 rounded">购买</button>',
          css: [
            'body { font-size: 13px; }',
            '.btn { border: 0; }',
            '@theme {',
            '  --color-brand: #0ea5e9;',
            '}'
          ].join('\n')
        },
        tests: [
          'eq(style(".btn", "background-color"), "rgb(14, 165, 233)", "按钮仍是品牌色")',
          'eq(style(":root", "--color-brand"), "#0ea5e9", "令牌定义在 :root 上")',
          'ok(($(".btn").className || "").indexOf("bg-brand") >= 0, "按钮改用令牌名 bg-brand")'
        ],
        hints: [
          '`@theme` 要写在 `css` 栏，不能写进 HTML。',
          '令牌名会和内置颜色一起进调色板，所以 `bg-brand`、`text-brand` 都能用。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex08-4',
        title: '再给令牌配一个悬停用的深色档',
        task: [
          '主按钮悬停时要深一档，这个深色也值得起名字。',
          '',
          '要求：只改 `css` 栏，在 `@theme` 里加 `--color-brand-dark: #0369a1;`；'
            + '并把按钮类名（`html` 栏）从 `bg-brand` 对应的悬停写成 `hover:bg-brand-dark`。'
        ].join('\n'),
        starter: {
          html: '<button class="btn bg-brand text-white px-4 py-2 rounded">购买</button>',
          css: [
            'body { font-size: 13px; }',
            '.btn { border: 0; }',
            '@theme {',
            '  --color-brand: #0ea5e9;',
            '}'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded">购买</button>',
          css: [
            'body { font-size: 13px; }',
            '.btn { border: 0; }',
            '@theme {',
            '  --color-brand: #0ea5e9;',
            '  --color-brand-dark: #0369a1;',
            '}'
          ].join('\n')
        },
        tests: [
          'eq(style(":root", "--color-brand-dark"), "#0369a1", "深色令牌已定义")',
          'ok(($(".btn").className || "").indexOf("hover:bg-brand-dark") >= 0, "悬停用 hover:bg-brand-dark")',
          'eq(style(".btn", "background-color"), "rgb(14, 165, 233)", "常态仍是亮的那档品牌色")'
        ],
        hints: [
          '`:hover` 在预览窗里触发不了，所以判题只能看类名有没有写成 `hover:bg-brand-dark`。',
          '令牌是普通自定义属性，`--color-brand-dark` 和 `--color-brand` 是两个独立的值。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
