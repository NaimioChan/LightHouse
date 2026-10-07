/* ch15 — 指针交互与动效编排 */
(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch15',
    title: '第 15 章 · 指针与动效编排',
    goal: '读得懂指针事件的坐标，用 Web Animations API 做能暂停、能定位的动画，并把一串动画错开延迟。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 指针事件的坐标有两套',
          '',
          '`pointermove` 给的事件对象上有两组坐标，新手最容易拿错：',
          '',
          '- `ev.clientX` / `ev.clientY`：相对**视口**，与页面是否滚过有关',
          '- `ev.offsetX` / `ev.offsetY`：相对**事件目标**，看着最方便，但目标被换成子元素时会跳',
          '',
          '要「鼠标在元素内部的哪个位置」，稳的做法是用 `clientX/Y` 减去元素的 `getBoundingClientRect()`。'
            + '只在最外层元素上绑监听时 `offsetX/Y` 也对得上，元素里还有别的盒子时就不一定了。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '视口坐标换算成元素内的本地坐标',
        code: [
          'function toLocal(ev, rect) {',
          '  return { x: Math.round(ev.clientX - rect.left), y: Math.round(ev.clientY - rect.top) };',
          '}',
          '',
          'const box = { left: 120, top: 40 };',
          'console.log(toLocal({ clientX: 150, clientY: 90 }, box));'
        ].join('\n'),
        expect: '{ x: 30, y: 50 }'
      },
      {
        kind: 'prose',
        md: [
          '## 派发一个 PointerEvent 就能验命中检测',
          '',
          '`new PointerEvent("pointermove", { bubbles: true, clientX, clientY })` 构造出来的事件会正常进到元素与 `window` 上的监听器里，'
            + '所以判题时不需要真鼠标：派发一次，再读被改过的样式或文本就行。',
          '',
          '另外两条与指针有关的事实：',
          '',
          '- `document.elementFromPoint(x, y)` 返回视口坐标那一堆元素里最上面的一个，用来做「点到谁了」',
          '- 要按屏幕像素算命中，得乘 `window.devicePixelRatio`；`getBoundingClientRect()` 给的是 CSS 像素'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '在 `pointermove` 里改 `width` / `top` / `margin` 这类**布局属性**会触发重排，鼠标一动就重算整页。要跟着鼠标动，改 `transform` 或 `opacity` 这类只走合成的属性。'
      },
      {
        kind: 'prose',
        md: [
          '## WAAPI：用代码起的动画，能暂停、能定位',
          '',
          '`el.animate(keyframes, options)` 返回一个 `Animation` 对象，它身上有两样在 CSS 里做不到的东西：',
          '',
          '- `pause()` / `play()`：随时停下、继续',
          '- `currentTime = 毫秒`：**直接跳到动画的某一刻**（配合 `pause()` 用）',
          '',
          '```',
          'const a = el.animate(',
          '  [{ transform: "translateX(0px)" }, { transform: "translateX(100px)" }],',
          '  { duration: 1000, fill: "both" }',
          ');',
          'a.pause();',
          'a.currentTime = 500;      // 停在 1 秒动画的正中间 → translateX(50px)',
          '```',
          '',
          '`fill: "both"` 让动画在开始前与结束后都保持关键帧的样子，否则跳到 0 或超过时长时元素会闪回原位。'
            + '默认缓动是 `linear`，所以 1000ms 的动画停在 500ms 就是正好一半。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '编排：把一串动画的延迟错开',
        code: [
          'function stagger(n, gapMs) {',
          '  const out = [];',
          '  for (let i = 0; i < n; i++) out.push(i * gapMs);',
          '  return out;',
          '}',
          '',
          'console.log(stagger(4, 60));'
        ].join('\n'),
        expect: '[ 0, 60, 120, 180 ]'
      },
      {
        kind: 'exercise',
        id: 'ex15-1',
        title: '把视口坐标换算成本地坐标',
        task: [
          '补完 `toLocal(ev, rect)`：返回指针在元素内的位置，`x` / `y` 都取整。',
          '',
          '`ev` 上有 `clientX` / `clientY`，`rect` 就是元素的 `getBoundingClientRect()` 结果。'
        ].join('\n'),
        starter: [
          'function toLocal(ev, rect) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function toLocal(ev, rect) {',
          '  return { x: Math.round(ev.clientX - rect.left), y: Math.round(ev.clientY - rect.top) };',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(toLocal({ clientX: 150, clientY: 80 }, { left: 100, top: 30 }), { x: 50, y: 50 }, '两个方向都要减');",
          "eq(toLocal({ clientX: 0, clientY: 0 }, { left: 0, top: 0 }), { x: 0, y: 0 });",
          "eq(toLocal({ clientX: 103.4, clientY: 40.6 }, { left: 0, top: 0 }), { x: 103, y: 41 }, '小数要取整');"
        ],
        hints: [
          '本地坐标 = 视口坐标 − 元素左上角的视口坐标。',
          '用 `Math.round` 取整，别用 `parseInt`（负数会被截向零）。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex15-2',
        title: '让元素显示指针在它内部的位置',
        task: [
          '补完 `followPointer(el)`：在 `el` 上监听 `pointermove`，把本地坐标写进 `el.textContent`，格式是 `x,y`。',
          '',
          '例：指针落在元素内部 (40, 25) 的位置时，`el.textContent` 应该是 `40,25`。'
        ].join('\n'),
        starter: [
          'function followPointer(el) {',
          '  el.addEventListener("pointermove", (ev) => {',
          '    // 你的代码',
          '  });',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function followPointer(el) {',
          '  el.addEventListener("pointermove", (ev) => {',
          '    const r = el.getBoundingClientRect();',
          '    const x = Math.round(ev.clientX - r.left);',
          '    const y = Math.round(ev.clientY - r.top);',
          '    el.textContent = `${x},${y}`;',
          '  });',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { $('#app').innerHTML = ''; const el = document.createElement('div'); el.style.cssText = 'width:200px;height:100px'; $('#app').appendChild(el); followPointer(el); const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + 40, clientY: r.top + 25 })); eq(el.textContent, '40,25', '文本要写成 本地x,本地y'); })();",
          "(() => { $('#app').innerHTML = ''; const el = document.createElement('div'); el.style.cssText = 'width:200px;height:100px'; $('#app').appendChild(el); followPointer(el); const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + 5, clientY: r.top + 70 })); eq(el.textContent, '5,70', '换一个位置也要对'); const r2 = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r2.left + 120, clientY: r2.top + 3 })); eq(el.textContent, '120,3', '再换一次'); })();",
          "(() => { $('#app').innerHTML = ''; const el = document.createElement('div'); el.style.cssText = 'width:200px;height:100px'; $('#app').appendChild(el); followPointer(el); eq(el.textContent, '', '还没动过指针时不要写内容'); })();"
        ],
        hints: [
          '每次事件都要重新取 `getBoundingClientRect()`——元素可能在两次事件之间被移动了。',
          '别用 `ev.offsetX`：元素里再放一个子盒子时，指针落在子盒子上读到的就是相对子盒子的坐标。'
        ],
        needsDom: true
      },
      {
        kind: 'exercise',
        id: 'ex15-3',
        title: '把动画定位到某一刻',
        task: [
          '补完 `freeze(el, ms)`：起一段 1000ms 的位移动画（从 `translateX(0px)` 到 `translateX(100px)`），把它暂停并定位到第 `ms` 毫秒，返回这个 `Animation` 对象。',
          '',
          '缓动用默认的 `linear`，`fill` 用 `both`。'
        ].join('\n'),
        starter: [
          'function freeze(el, ms) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function freeze(el, ms) {',
          '  const a = el.animate(',
          '    [{ transform: "translateX(0px)" }, { transform: "translateX(100px)" }],',
          '    { duration: 1000, fill: "both" }',
          '  );',
          '  a.pause();',
          '  a.currentTime = ms;',
          '  return a;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { $('#app').innerHTML = ''; const el = document.createElement('div'); el.style.cssText = 'width:40px;height:20px'; $('#app').appendChild(el); const a = freeze(el, 500); eq(a.currentTime, 500, 'currentTime 要落在 500'); eq(a.playState, 'paused', '必须是暂停状态'); eq(getComputedStyle(el).transform, 'matrix(1, 0, 0, 1, 50, 0)', '1000ms 的一半就是 50px'); })();",
          "(() => { $('#app').innerHTML = ''; const el = document.createElement('div'); el.style.cssText = 'width:40px;height:20px'; $('#app').appendChild(el); freeze(el, 0); eq(getComputedStyle(el).transform, 'matrix(1, 0, 0, 1, 0, 0)', '定位到 0 就是起点'); })();",
          "(() => { $('#app').innerHTML = ''; const el = document.createElement('div'); el.style.cssText = 'width:40px;height:20px'; $('#app').appendChild(el); freeze(el, 250); eq(getComputedStyle(el).transform, 'matrix(1, 0, 0, 1, 25, 0)', '四分之一就往前走 25px'); })();"
        ],
        hints: [
          '三件事按顺序做：`el.animate(...)` → `pause()` → 设 `currentTime`。先设 `currentTime` 再暂停会看到它继续跑。',
          '`fill: "both"` 写在 `el.animate` 的第二个参数里，和 `duration` 同一个对象。'
        ],
        needsDom: true
      },
      {
        kind: 'exercise',
        id: 'ex15-4',
        title: '错开一串动画的延迟',
        task: [
          '补完 `stagger(n, gapMs)`：返回一个长度 `n` 的数组，第 `i` 个元素是 `i * gapMs`。',
          '',
          '`n` 为 0 时返回空数组。'
        ].join('\n'),
        starter: [
          'function stagger(n, gapMs) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function stagger(n, gapMs) {',
          '  const out = [];',
          '  for (let i = 0; i < n; i++) out.push(i * gapMs);',
          '  return out;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(stagger(4, 60), [0, 60, 120, 180], '第一个是 0，之后每个加一个间隔');",
          "eq(stagger(0, 100), [], '数量为 0 时没有延迟要排');",
          "eq(stagger(1, 250), [0], '只有一个元素时没有错开');"
        ],
        hints: [
          '用一个 `for` 循环往数组里 `push(i * gapMs)` 就行。',
          '`Array.from({ length: n }, (_, i) => i * gapMs)` 也能一行写完。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
