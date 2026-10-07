/* ch11 — 过渡与动画 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch11',
    title: '第 11 章 · 过渡与动画',
    goal: '让状态切换不再是「啪」地跳一下，并知道怎么用 @keyframes 做循环动画、怎么尊重用户的减少动效设置。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## transition：两个状态之间补上中间帧',
          '',
          '过渡只做一件事：某个属性从 A 值变到 B 值时，中间那几帧由浏览器补出来。它需要四个信息：',
          '',
          '- `transition-property`：哪个属性动（`all` 最省事，但也最容易误伤）',
          '- `transition-duration`：动多久，必须写，**不写就是 0 秒，等于没有过渡**',
          '- `transition-timing-function`：怎么动（`ease` 默认，`linear` 匀速，`cubic-bezier(...)` 自定义）',
          '- `transition-delay`：等多久再开始',
          '',
          '简写顺序是 `属性 时长 缓动 延迟`。过渡写**在两个状态都可能出现的地方**：'
            + '想「进去有、回来也有」，就写在基础规则上，而不是只写在 `:hover` 里。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '过渡写在基础规则上，进出都平滑',
        height: 190,
        html: [
          '<button class="btn">悬停看看</button>',
          '<button class="only-hover">过渡只写在 hover 里</button>'
        ].join('\n'),
        css: [
          '.btn, .only-hover { padding: 8px 14px; margin-right: 8px; border: 1px solid #2456c8; background: #fff; color: #2456c8; border-radius: 6px; font-size: 13px; }',
          '.btn { transition: background-color .25s ease, color .25s ease; }',
          '.btn:hover { background: #2456c8; color: #fff; }',
          '.only-hover:hover { background: #2456c8; color: #fff; transition: background-color .25s ease; }'
        ].join('\n'),
        checks: [
          'ok(/background-color/.test(style(".btn", "transition-property")), "基础规则上声明了要过渡的属性")',
          'eq(style(".btn", "transition-duration"), "0.25s, 0.25s", "两个属性各有一份时长")',
          'eq(style(".only-hover", "transition-property"), "all", "没写过渡时，这个属性的计算值就是默认的 all")',
          'eq(style(".only-hover", "transition-duration"), "0s", "时长为 0，等于没有过渡（鼠标移开时是硬切）")',
          'eq(style(".btn", "transition-timing-function"), "ease, ease", "缓动是默认的 ease")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '**哪些属性不能过渡**：`display`（`none` 到 `block` 之间没有中间态）、'
          + '`height: auto`。要「淡入淡出」用 `opacity` + `visibility`；要「高度展开」用 `grid-template-rows: 0fr → 1fr`。'
      },
      {
        kind: 'prose',
        md: [
          '## @keyframes：自己定义一串关键帧',
          '',
          '过渡只能「从当前值到目标值」，动画可以指定任意多个中间状态：',
          '',
          '```',
          '@keyframes breathe {',
          '  0%   { transform: scale(1); }',
          '  50%  { transform: scale(1.08); }',
          '  100% { transform: scale(1); }',
          '}',
          '.dot { animation: breathe 1.6s ease-in-out infinite; }',
          '```',
          '',
          '`animation` 简写里最常调的几件：`时长`、`缓动`、`次数`（`infinite` 无限）、`方向`（`alternate` 来回）、'
            + '`填充模式`（`forwards` 停在最后一帧）。',
          '',
          '**动画只改 `transform` 和 `opacity` 最流畅**：这两个属性可以由合成层处理，不触发布局与重绘。'
            + '改 `width` / `left` / `top` 会让浏览器每帧重算布局，动画一多就掉帧。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '关键帧动画：一个小圆点持续呼吸',
        height: 220,
        html: [
          '<div class="stage">',
          '  <span class="dot"></span>',
          '</div>'
        ].join('\n'),
        css: [
          '.stage { display: flex; align-items: center; justify-content: center; height: 120px; background: #f6f4ec; }',
          '.dot { width: 40px; height: 40px; border-radius: 50%; background: #2456c8; }',
          '@keyframes breathe {',
          '  0% { transform: scale(1); opacity: 1; }',
          '  50% { transform: scale(1.4); opacity: .6; }',
          '  100% { transform: scale(1); opacity: 1; }',
          '}',
          '.dot { animation: breathe 1.8s ease-in-out infinite; }'
        ].join('\n'),
        checks: [
          'ok(/breathe/.test(style(".dot", "animation-name")), "动画名对上了")',
          'eq(style(".dot", "animation-iteration-count"), "infinite", "无限循环")',
          'eq(style(".dot", "animation-timing-function"), "ease-in-out", "缓动写的是 ease-in-out")',
          'near(rect(".dot").w, 40, 2, "静止时的宽度还是 40（scale 是绘制层的事，不改布局）")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## transform 的顺序会互相影响',
          '',
          '`transform` 里多个函数是**按顺序叠加**的，位置不同结果完全不同：',
          '',
          '- `translate(20px) rotate(45deg)`：先平移再旋转，旋转中心在平移后的位置',
          '- `rotate(45deg) translate(20px)`：先旋转再平移，`translate` 的方向**被转过去了**，'
            + '看起来是沿着旋转后的轴走',
          '',
          '`transform-origin` 决定旋转与缩放的基准点，默认是元素中心（`50% 50%`）。',
          '',
          '还有一个实用点：`transform` 会创建层叠上下文，所以一个 `transform` 不为 `none` 的元素，'
            + '里面的 `z-index` 再大也翻不出它——第 4 章讲过的坑，动效里特别容易撞上。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '同样的两个变换，调换顺序结果不同',
        height: 230,
        html: [
          '<div class="stage">',
          '  <span class="a"></span>',
          '  <span class="b"></span>',
          '</div>'
        ].join('\n'),
        css: [
          '.stage { display: flex; gap: 40px; align-items: center; justify-content: center; height: 140px; background: #f6f4ec; }',
          '.a, .b { width: 30px; height: 30px; background: #2456c8; }',
          '.a { transform: translate(20px, 0) rotate(45deg); }',
          '.b { transform: rotate(45deg) translate(20px, 0); }'
        ].join('\n'),
        checks: [
          'ok(style(".a", "transform") !== style(".b", "transform"), "两个变换的书写顺序不同，计算值也不同")',
          'near(rect(".a").w, 42.43, 1.5, "45 度旋转后外接盒变宽（30×√2）")',
          'ok(Math.abs(rect(".a").x - rect(".b").x) > 10, "两者的水平位置差开了不少")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 尊重「减少动效」',
          '',
          '有些人对动效敏感（前庭失调、偏头痛），系统里开了「减少动态效果」。CSS 有对应的媒体查询：',
          '',
          '```',
          '@media (prefers-reduced-motion: reduce) {',
          '  *, *::before, *::after {',
          '    animation-duration: .01ms !important;',
          '    animation-iteration-count: 1 !important;',
          '    transition-duration: .01ms !important;',
          '  }',
          '}',
          '```',
          '',
          '用 `0.01ms` 而不是 `0`：有些浏览器把 `0s` 当成「没写时长」，反而用默认值跑起来。',
          '这也是少数几处 `!important` 站得住脚的地方——它要盖住的是整站所有规则。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['属性 / 值', '说明'],
        rows: [
          ['`transition: 属性 时长 缓动 延迟`', '简写顺序；不写时长等于没有过渡'],
          ['`transition-property: all`', '所有可过渡属性都动，省事但容易误伤'],
          ['`transition-timing-function: linear`', '匀速；默认是 `ease`'],
          ['`cubic-bezier(.4, 0, .2, 1)`', '自定义缓动曲线，常用的「快出慢入」'],
          ['`@keyframes 名 { 0% {} 100% {} }`', '定义关键帧'],
          ['`animation: 名 时长 缓动 次数 方向`', '简写；`infinite` 无限、`alternate` 来回'],
          ['`animation-fill-mode: forwards`', '动画结束后停在最后一帧'],
          ['`transform: translate(x, y)`', '平移，用百分比时相对自身尺寸'],
          ['`transform: scale(n)`', '缩放，不改布局尺寸'],
          ['`transform-origin`', '旋转与缩放的基准点，默认中心'],
          ['`prefers-reduced-motion: reduce`', '用户要求减少动效时生效']
        ],
        code: true
      },
      {
        kind: 'exercise',
        id: 'ex11-1',
        title: '给按钮补上过渡',
        task: [
          '按钮悬停时颜色是硬切换的。',
          '',
          '要求：只改 `css` 栏，让背景色和文字色都用 `0.2s` 过渡，并且**鼠标移开时也要平滑**。'
        ].join('\n'),
        starter: {
          html: '<button class="btn">提交</button>',
          css: [
            '.btn { padding: 8px 16px; border: 0; border-radius: 6px; background: #f6f4ec; color: #232019; }',
            '.btn:hover { background: #2456c8; color: #fff; }'
          ].join('\n')
        },
        solution: {
          html: '<button class="btn">提交</button>',
          css: [
            '.btn { padding: 8px 16px; border: 0; border-radius: 6px; background: #f6f4ec; color: #232019; transition: background-color .2s ease, color .2s ease; }',
            '.btn:hover { background: #2456c8; color: #fff; }'
          ].join('\n')
        },
        tests: [
          'ok(/background-color/.test(style(".btn", "transition-property")), "声明了背景色的过渡")',
          'eq(style(".btn", "transition-duration"), "0.2s, 0.2s", "两个属性的时长都是 0.2s")',
          'eq(style(".btn", "background-color"), "rgb(246, 244, 236)", "基础背景没被改成悬停色")',
          'eq(style(".btn", "color"), "rgb(35, 32, 25)", "基础文字色没变")'
        ],
        hints: [
          '过渡写在**基础规则**里：写在 `:hover` 里的话，只有「进入」有过渡，「退出」还是硬切。',
          '多个属性用逗号分隔，每个属性各带一份时长。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-2',
        title: '做一个转一圈的加载指示',
        task: [
          '一个方块，现在静止不动。',
          '',
          '要求：只改 `css` 栏，定义 `@keyframes spin` 让它从 `0deg` 转到 `360deg`，'
            + '并给 `.loader` 用上：`1s`、匀速、无限循环。'
        ].join('\n'),
        starter: {
          html: '<div class="loader"></div>',
          css: [
            '.loader { width: 34px; height: 34px; border: 4px solid #dbe6ff; border-top-color: #2456c8; border-radius: 50%; }'
          ].join('\n')
        },
        solution: {
          html: '<div class="loader"></div>',
          css: [
            '.loader { width: 34px; height: 34px; border: 4px solid #dbe6ff; border-top-color: #2456c8; border-radius: 50%; }',
            '@keyframes spin {',
            '  from { transform: rotate(0deg); }',
            '  to { transform: rotate(360deg); }',
            '}',
            '.loader { animation: spin 1s linear infinite; }'
          ].join('\n')
        },
        tests: [
          'ok(/spin/.test(style(".loader", "animation-name")), "动画名是 spin")',
          'eq(style(".loader", "animation-duration"), "1s", "时长 1s")',
          'eq(style(".loader", "animation-iteration-count"), "infinite", "无限循环")',
          'eq(style(".loader", "animation-timing-function"), "linear", "匀速")'
        ],
        hints: [
          '`from` / `to` 就是 `0%` / `100%` 的别名，两个关键帧写一个旋转即可。',
          '转圈的起点和终点必须是同一个角度（0 到 360），否则每一圈接不上会跳一下。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-3',
        title: '悬停时轻微放大，且不挤压旁边的东西',
        task: [
          '卡片想要悬停时放大一点。',
          '',
          '要求：只改 `css` 栏，悬停时放大到 `1.05` 倍，`0.2s` 过渡，'
            + '并且**放大时不能把旁边的卡片挤走**。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="row">',
            '  <div class="card">甲</div>',
            '  <div class="card">乙</div>',
            '  <div class="card">丙</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.row { display: flex; gap: 10px; }',
            '.card { width: 70px; padding: 16px 0; text-align: center; background: #dbe6ff; border-radius: 8px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="row">',
            '  <div class="card">甲</div>',
            '  <div class="card">乙</div>',
            '  <div class="card">丙</div>',
            '</div>'
          ].join('\n'),
          css: [
            '.row { display: flex; gap: 10px; }',
            '.card { width: 70px; padding: 16px 0; text-align: center; background: #dbe6ff; border-radius: 8px; transition: transform .2s ease; }',
            '.card:hover { transform: scale(1.05); }'
          ].join('\n')
        },
        tests: [
          'eq(style(".card", "transition-property"), "transform", "过渡作用在 transform 上")',
          'eq(style(".card", "transition-duration"), "0.2s", "过渡时长 0.2s")',
          'near(px(".card", "width"), 70, 1, "卡片自身的宽度没有被改（放大用的是 scale，不占布局）")',
          'near(rect(".card:nth-of-type(2)").x - (rect(".card").x + 70), 10, 2, "两张卡之间的间距还是 10px，没被挤动")'
        ],
        hints: [
          '`transform: scale()` 是绘制层的事，不改布局——这就是它不会挤走邻居的原因（也是它比改 `width` 更适合做动效的原因）。',
          '过渡要写在 `.card` 的基础规则里。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-4',
        title: '给整站加减少动效的兜底',
        task: [
          '页面里有一个一直转的指示器。对动效敏感的用户看着难受。',
          '',
          '要求：只改 `css` 栏，加一段 `@media (prefers-reduced-motion: reduce)`，'
            + '让所有元素与伪元素的动画和过渡几乎立刻结束（时长写 `0.01ms`，动画只跑一次）。',
          '',
          '写完点运行看看：这个环境没开「减少动效」，所以那一段规则此刻不生效，'
            + '断言会检查它确实写在正确的条件下、且没有误伤默认样式。'
        ].join('\n'),
        starter: {
          html: '<div class="spinner"></div><button class="btn">按钮</button>',
          css: [
            '.spinner { width: 30px; height: 30px; border: 4px solid #dbe6ff; border-top-color: #2456c8; border-radius: 50%; }',
            '@keyframes spin { to { transform: rotate(360deg); } }',
            '.spinner { animation: spin 1s linear infinite; }',
            '.btn { padding: 6px 12px; border: 1px solid #2456c8; background: #fff; color: #2456c8; border-radius: 6px; transition: background-color .2s ease; }',
            '@media (prefers-reduced-motion: reduce) {',
            '  .spinner { animation: none; }',
            '}'
          ].join('\n')
        },
        solution: {
          html: '<div class="spinner"></div><button class="btn">按钮</button>',
          css: [
            '.spinner { width: 30px; height: 30px; border: 4px solid #dbe6ff; border-top-color: #2456c8; border-radius: 50%; }',
            '@keyframes spin { to { transform: rotate(360deg); } }',
            '.spinner { animation: spin 1s linear infinite; }',
            '.btn { padding: 6px 12px; border: 1px solid #2456c8; background: #fff; color: #2456c8; border-radius: 6px; transition: background-color .2s ease; }',
            '@media (prefers-reduced-motion: reduce) {',
            '  *, *::before, *::after {',
            '    animation-duration: .01ms !important;',
            '    animation-iteration-count: 1 !important;',
            '    transition-duration: .01ms !important;',
            '  }',
            '}'
          ].join('\n')
        },
        tests: [
          'ok(matchMedia("(prefers-reduced-motion: reduce)").matches === false, "这个环境没开「减少动效」，所以那段规则此刻不生效")',
          'eq(style(".spinner", "animation-duration"), "1s", "默认时长没被改")',
          'eq(style(".spinner", "animation-iteration-count"), "infinite", "默认还是无限循环")',
          'eq(style(".btn", "transition-duration"), "0.2s", "按钮的过渡也没被波及")',
          'ok([].slice.call(document.styleSheets).some(function (s) { try { return [].slice.call(s.cssRules).some(function (r) { if (r.type !== 4 || !/prefers-reduced-motion/.test(r.conditionText)) return false; return [].slice.call(r.cssRules).some(function (x) { var sel = x.selectorText || ""; var css = (x.style && x.style.cssText) || ""; return sel.indexOf("*") === 0 && sel.indexOf("::before") >= 0 && css.indexOf("animation-duration") >= 0; }); }); } catch (e) { return false; } }), "媒体查询里有一条同时覆盖元素与伪元素的动画时长声明")'
        ],
        hints: [
          '现有的 `@media` 只停了指示器，按钮的过渡还留着；题目要求对所有元素与伪元素一起兜底。',
          '选择器写 `*, *::before, *::after`（`*` 选不到伪元素），三条声明都带 `!important`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex11-5',
        title: '让展开区域用高度过渡',
        task: [
          '这块内容现在一直展开着。',
          '',
          '要求：只改 `css` 栏，默认折叠（高度 0、不显示溢出），加上 `:hover` 时展开到 `70px`，'
            + '并且用 `0.3s` 过渡高度。'
        ].join('\n'),
        starter: {
          html: [
            '<div class="panel">',
            '  <p>折叠的内容。</p>',
            '  <p>悬停就展开。</p>',
            '</div>'
          ].join('\n'),
          css: [
            '.panel { width: 200px; padding: 8px; background: #f6f4ec; border: 1px solid #e0dbcc; }',
            '.panel p { margin: 0 0 8px; font-size: 13px; }'
          ].join('\n')
        },
        solution: {
          html: [
            '<div class="panel">',
            '  <p>折叠的内容。</p>',
            '  <p>悬停就展开。</p>',
            '</div>'
          ].join('\n'),
          css: [
            '.panel { width: 200px; padding: 8px; background: #f6f4ec; border: 1px solid #e0dbcc; height: 0; overflow: hidden; transition: height .3s ease; }',
            '.panel:hover { height: 70px; }',
            '.panel p { margin: 0 0 8px; font-size: 13px; }'
          ].join('\n')
        },
        tests: [
          'eq(style(".panel", "height"), "0px", "默认高度 0")',
          'eq(style(".panel", "overflow"), "hidden", "溢出裁掉")',
          'eq(style(".panel", "transition-property"), "height", "过渡作用在 height 上")',
          'eq(style(".panel", "transition-duration"), "0.3s", "过渡时长 0.3s")',
          'ok(rect(".panel").h < 30, "默认确实是收起的（只剩内边距与边框的那点高度）")'
        ],
        hints: [
          '高度过渡要写一个具体值：`height: 0` 到 `height: 70px` 之间浏览器才补得出中间帧。',
          '别忘了 `overflow: hidden`，否则内容会溢出到盒子外面。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
