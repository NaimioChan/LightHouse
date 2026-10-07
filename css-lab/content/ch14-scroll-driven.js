/* ch14 — 滚动驱动动画 */
(function (root) {
  (root.CSSLAB_CHAPTERS || (root.CSSLAB_CHAPTERS = [])).push({
    id: 'ch14',
    title: '第 14 章 · 滚动驱动动画',
    goal: '把「滚到哪儿了」变成动画的时间轴，用滚动位置直接驱动样式，不再写 scroll 事件里的监听器。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 老写法：滚动事件里算一次，再写回样式',
          '',
          '常见的做法是监听 `scroll`，读 `scrollTop`，算出进度，然后把结果写进 `style` 或 class：',
          '',
          '```',
          'box.addEventListener("scroll", () => {',
          '  const p = box.scrollTop / (box.scrollHeight - box.clientHeight);',
          '  bar.style.width = (p * 100) + "%";',
          '});',
          '```',
          '',
          '问题有三个：滚动事件在主线程上跑，滚动一次可能触发几十回回调；回调里改布局属性会触发重排；写在两个不同容器上的两段逻辑要自己对齐，稍微不同步就看着「卡一下」。'
        ].join('\n')
      },
      {
        kind: 'prose',
        md: [
          '## 新写法：把滚动位置当时间轴',
          '',
          '`animation-timeline: scroll()` 让动画的进度**由滚动位置决定**，而不是由时钟决定。写法和普通动画一样，只是把时间轴换掉：',
          '',
          '```',
          '.bar { animation: grow linear; animation-timeline: scroll(nearest block); }',
          '@keyframes grow { from { width: 0% } to { width: 100% } }',
          '```',
          '',
          '关键是：**没有动画时长**。`animation-duration` 在这里没有意义，进度完全等于滚动进度。浏览器内部把它跑在合成线程上，滚动时不会一帧给你几十个回调。',
          '',
          '要区分两个函数：',
          '',
          '- `scroll(nearest block)` 看**最近的滚动容器**的滚动进度（纵向用 `block`，横向用 `inline`）',
          '- `view(block)` 看**这个元素自己**穿过视口的进度，元素刚进视口是 0，走完是 100%',
          '',
          '一条要提前知道的限制：`getComputedStyle(el).animationTimeline` 只会回显成 `scroll()` / `view()`，**括号里的方向与容器参数读不出来**。所以断言只能判「挂的是哪一种时间轴」，判不了 `block` 还是 `inline`。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '预览窗里的页面可以自己滚。不过滚动驱动动画的进度**在预览窗里是冻结的**（帧不接收真实的滚动事件，`getAnimations()` 读到的 `progress` 一直是 0），所以这一章的练习判的是「时间轴与关键帧挂对了没有」，真要感受进度得在浏览器里刷新自己看一眼。'
      },
      {
        kind: 'prose',
        md: [
          '## animation-range：只取一段进度',
          '',
          '`animation-range` 把 0%–100% 的进度**映射到整个滚动行程的一段**上。写完它，前面一段和后面一段就不再参与：',
          '',
          '- `animation-range: 0 50%` 只看滚动行程的前半段，滚到一半时动画已经走完',
          '- `animation-range: entry 0% entry 100%` 用在 `view()` 上：元素从「刚露头」到「完全进入」',
          '- `cover`、`contain`、`entry`、`exit` 是 `view()` 的四个阶段名，后面可以跟百分比',
          '',
          '少了它，长页面上一个显现动画会拖到最后才结束，用户滚到一半还是半透明。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '滚动进度条：进度条宽度由 scroll() 驱动',
        height: 300,
        html: [
          '<div class="box">',
          '  <div class="bar"></div>',
          '  <div class="inner">',
          '    <p>这段文字下面还有很长的内容。</p>',
          '    <div class="filler"></div>',
          '    <p class="tail">滚到底时进度条应该是满的。</p>',
          '  </div>',
          '</div>',
          '<button id="go">滚到中间</button>',
          '<button id="back">滚回顶部</button>'
        ].join('\n'),
        css: [
          'body { margin: 0; padding: 12px; }',
          '.box { height: 190px; overflow-y: auto; border: 1px solid #ccc; position: relative; }',
          '.bar { position: sticky; top: 0; height: 8px; background: #1f56c8; width: 0;',
          '  animation: grow linear; animation-timeline: scroll(nearest block); }',
          '@keyframes grow { from { width: 0% } to { width: 100% } }',
          '.inner { height: 150px; }',
          '.filler { height: 420px; background: #f4f6fb; }',
          'p { margin: 10px 4px; }'
        ].join('\n'),
        js: [
          'document.querySelector("#go").addEventListener("click", () => {',
          '  const box = document.querySelector(".box");',
          '  box.scrollTop = (box.scrollHeight - box.clientHeight) / 2;',
          '});',
          'document.querySelector("#back").addEventListener("click", () => {',
          '  document.querySelector(".box").scrollTop = 0;',
          '});'
        ].join('\n'),
        checks: [
          'ok(/scroll/.test(style(".bar", "animation-timeline")), "进度条的时间轴要挂在滚动上")',
          'eq(style(".bar", "animation-name"), "grow", "用的是 grow 这组关键帧")',
          'ok(style(".inner", "height") !== null, "滚动内容要足够长，否则没有可滚的距离")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## view()：元素自己穿过视口',
          '',
          '滚动显现最省事的写法：`animation-timeline: view()` 让动画进度等于「这个元素已经进入视口多少」。底下这三张卡片各自有自己的时间轴，不需要任何 JS。',
          '',
          '滚动的容器可以是最外层的页面（`<body>` 自带滚动），也可以是练习里那种 `overflow: auto` 的盒子。换容器时要确认 `scroll()` 的 `nearest` 真的指向你想的那个盒子。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '每张卡片按自己的进入进度淡入',
        height: 300,
        html: [
          '<div class="scroll">',
          '  <div class="card">第一张</div>',
          '  <div class="card">第二张</div>',
          '  <div class="card">第三张</div>',
          '  <div class="pad"></div>',
          '</div>',
          '<button id="put">滚到第三张</button>'
        ].join('\n'),
        css: [
          'body { margin: 0; padding: 12px; }',
          '.scroll { height: 220px; overflow-y: auto; border: 1px solid #ccc; }',
          '.card { height: 120px; margin: 14px; border-radius: 8px; background: #1f56c8; color: #fff; padding: 12px;',
          '  animation: rise linear both; animation-timeline: view(block); animation-range: entry 0% entry 100%; }',
          '@keyframes rise { from { opacity: .1; transform: translateY(24px) } to { opacity: 1; transform: none } }',
          '.pad { height: 260px; }'
        ].join('\n'),
        js: [
          'document.querySelector("#put").addEventListener("click", () => {',
          '  const box = document.querySelector(".scroll");',
          '  box.scrollTop = 300;',
          '});'
        ].join('\n'),
        checks: [
          'ok(/view/.test(style(".card", "animation-timeline")), "卡片的时间轴是 view()")',
          'ok(/entry/.test(style(".card", "animation-range")), "animation-range 要指向 entry 阶段")',
          'count(".card", 3, "三张卡片各自一条时间轴")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-1',
        title: '把进度条接到滚动上',
        task: [
          '`.bar` 是一条进度条，现在还没动。给它接上滚动驱动：宽度从 `0%` 长到 `100%`。',
          '',
          '要求：只改 `css` 栏；`.box` 已经是可滚动的容器，不用动它；不要写 JS。',
          '（预览窗里滚动的进度是冻结的，这里判的是时间轴与关键帧挂对没有。）'
        ].join('\n'),
        height: 260,
        starter: {
          html: [
            '<div class="box">',
            '  <div class="bar"></div>',
            '  <div class="pad"></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; position: relative; }',
            '.bar { position: sticky; top: 0; height: 8px; background: #1f56c8; width: 0; }',
            '.pad { height: 520px; background: #f4f6fb; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; position: relative; }',
            '.bar { position: sticky; top: 0; height: 8px; background: #1f56c8; width: 0;',
            '  animation: grow linear; animation-timeline: scroll(nearest block); }',
            '@keyframes grow { from { width: 0% } to { width: 100% } }',
            '.pad { height: 520px; background: #f4f6fb; }'
          ].join('\n')
        },
        tests: [
          'ok(/scroll/.test(style(".bar", "animation-timeline")), "进度条要跟着最近的滚动容器走")',
          'eq(style(".bar", "animation-name"), "grow", "动画名字要指向自己定义的关键帧")',
          'ok(/grow/.test(Array.from(document.styleSheets).map(s => Array.from(s.cssRules).map(r => r.cssText).join(" ")).join(" ")), "关键帧要真的写出来，只挂名字不写 @keyframes 不会动")'
        ],
        hints: [
          '三样东西缺一不可：`animation-name`、`animation-timeline`、以及一组 `@keyframes`。',
          '宽度从 `0%` 长到 `100%`：关键帧里写 `from { width: 0% } to { width: 100% }`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-2',
        title: '只取前半段滚动行程',
        task: [
          '`.tip` 已经接上了滚动驱动，但目前整个滚动行程都在驱动它，拖得太久。',
          '',
          '用 `animation-range` 把它限制在滚动行程的前半段：滚到一半时动画就该走完。',
          '',
          '要求：只改 `css` 栏。'
        ].join('\n'),
        height: 260,
        starter: {
          html: [
            '<div class="box">',
            '  <div class="tip"></div>',
            '  <div class="pad"></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; }',
            '.tip { height: 6px; background: #c15f3c; width: 0;',
            '  animation: slide linear; animation-timeline: scroll(nearest block); }',
            '@keyframes slide { from { width: 0% } to { width: 100% } }',
            '.pad { height: 520px; background: #f4f6fb; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; }',
            '.tip { height: 6px; background: #c15f3c; width: 0;',
            '  animation: slide linear; animation-timeline: scroll(nearest block); animation-range: 0 50%; }',
            '@keyframes slide { from { width: 0% } to { width: 100% } }',
            '.pad { height: 520px; background: #f4f6fb; }'
          ].join('\n')
        },
        tests: [
          'ok(/50%/.test(style(".tip", "animation-range")), "animation-range 里要出现 50%，把行程截断")',
          'ok(/scroll/.test(style(".tip", "animation-timeline")), "时间轴仍然挂在滚动上")',
          'eq(style(".tip", "animation-name"), "slide", "关键帧的名字不能丢")'
        ],
        hints: [
          '语法是 `animation-range: 起点 终点`，两个都是滚动行程里的位置。',
          '要「滚到一半就结束」，起点 0%、终点 50%。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-3',
        title: '按进入进度淡入',
        task: [
          '`.reveal` 是一个卡片，现在静止。让它按自己的进入进度淡入并往上抬一点。',
          '',
          '从：`opacity: .2` + `transform: translateY(20px)`；到：`opacity: 1` + `transform: none`。',
          '',
          '要求：只改 `css` 栏；用 `animation-timeline: view(block)` 与 `animation-range: entry 0% entry 100%`。'
        ].join('\n'),
        height: 260,
        starter: {
          html: [
            '<div class="box">',
            '  <div class="pad-a"></div>',
            '  <div class="reveal">显现卡片</div>',
            '  <div class="pad-b"></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; }',
            '.pad-a, .pad-b { height: 240px; background: #f4f6fb; }',
            '.reveal { height: 90px; margin: 12px; border-radius: 8px; background: #1f56c8; color: #fff; padding: 12px; }'
          ].join('\n')
        },
        solution: {
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; }',
            '.pad-a, .pad-b { height: 240px; background: #f4f6fb; }',
            '.reveal { height: 90px; margin: 12px; border-radius: 8px; background: #1f56c8; color: #fff; padding: 12px;',
            '  animation: reveal-in linear both; animation-timeline: view(block); animation-range: entry 0% entry 100%; }',
            '@keyframes reveal-in { from { opacity: .2; transform: translateY(20px) } to { opacity: 1; transform: none } }'
          ].join('\n')
        },
        tests: [
          'ok(/view/.test(style(".reveal", "animation-timeline")), "时间轴用 view()，看的是元素自己进入视口的进度")',
          'ok(/entry/.test(style(".reveal", "animation-range")), "animation-range 指到 entry 阶段")',
          'eq(style(".reveal", "animation-fill-mode"), "both", "fill 用 both：进入视口之前停在第 0 帧")',
          'ok(/reveal-in/.test(Array.from(document.styleSheets).map(s => Array.from(s.cssRules).map(r => r.cssText).join(" ")).join(" ")), "@keyframes 里要有 translateY 那一段")',
          'near(rect(".reveal").w, rect(".box").w - 24, 30, "动画不改变盒子的占位")'
        ],
        hints: [
          '`both` 这个 fill 值让元素在进入视口之前就停在第 0 帧，不会闪一下原样。',
          '`transform: none` 写在 `to` 里就是回到原位；别写 `translateY(0)` 之外的第二套坐标。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex14-4',
        title: '两种滚动函数选一个',
        task: [
          '`.gauge` 要显示的是**整个滚动容器**的进度（不是它自己进入视口的进度）。',
          '',
          '现在它挂的是 `view()`，滚到它出现之后就不再变化了。改成跟容器滚动走。',
          '',
          '要求：只改 `css` 栏。'
        ].join('\n'),
        height: 260,
        starter: {
          html: [
            '<div class="box">',
            '  <div class="pad-a"></div>',
            '  <div class="gauge"></div>',
            '  <div class="pad-b"></div>',
            '</div>'
          ].join('\n'),
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; }',
            '.pad-a, .pad-b { height: 240px; background: #f4f6fb; }',
            '.gauge { position: sticky; top: 0; height: 8px; background: #1f56c8; width: 0;',
            '  animation: fill linear; animation-timeline: view(block); }',
            '@keyframes fill { from { width: 0% } to { width: 100% } }'
          ].join('\n')
        },
        solution: {
          css: [
            '.box { height: 180px; overflow-y: auto; border: 1px solid #ccc; }',
            '.pad-a, .pad-b { height: 240px; background: #f4f6fb; }',
            '.gauge { position: sticky; top: 0; height: 8px; background: #1f56c8; width: 0;',
            '  animation: fill linear; animation-timeline: scroll(nearest block); }',
            '@keyframes fill { from { width: 0% } to { width: 100% } }'
          ].join('\n')
        },
        tests: [
          'ok(/scroll/.test(style(".gauge", "animation-timeline")), "要换成 scroll(nearest block)")',
          'ok(!/view/.test(style(".gauge", "animation-timeline")), "view() 已经换掉了：它只看元素自己穿过视口那一段")',
          'eq(style(".gauge", "position"), "sticky", "粘在顶部的定位是原来就有的，别弄丢")'
        ],
        hints: [
          '两个函数只差一个词：`view()` 看元素自己，`scroll()` 看容器。',
          '`sticky` 让它在滚动时停在容器顶部，这样才像进度条。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
