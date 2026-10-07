(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch12',
    title: '第 12 章 · DOM 与事件',
    goal: '用 JS 读写页面：会创建元素、改内容、绑事件，知道事件委托为什么好用。',
    sections: [
      {
        kind: 'prose',
        md: [
          '页面的 DOM 是一棵树，`document` 是树根。选择元素用 `querySelector`（拿第一个）和 `querySelectorAll`（拿全部）；本站在沙箱里预建了一个 `<div id="app">`，还提供了 `$` / `$$` 两个简写，练习就往 `#app` 里写。',
          '',
          '上面的白框就是这个沙箱的页面本身——你的代码动什么，白框里立刻就能看见。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '创建并插入元素',
        needsDom: true,
        code: [
          '$("#app").innerHTML = "";              // 每轮先清干净',
          '',
          'const ul = document.createElement("ul");',
          'for (const name of ["甲", "乙"]) {',
          '  const li = document.createElement("li");',
          '  li.textContent = name;               // 文本节点：安全，不会被当 HTML 解析',
          '  li.className = "player";',
          '  ul.appendChild(li);',
          '}',
          '$("#app").appendChild(ul);',
          '',
          'console.log($$("#app li").length, $("#app li").textContent);'
        ].join('\n'),
        expect: '2 甲'
      },
      {
        kind: 'table',
        head: ['想干什么', '写法', '备注'],
        rows: [
          ['选一个', 'document.querySelector("#id .cls")', '没找到返回 null'],
          ['选全部', 'document.querySelectorAll("li")', '得到类数组，可 [... ] 展开'],
          ['改文本', 'el.textContent = "hi"', '安全，不解析标签'],
          ['塞 HTML', 'el.innerHTML = "<b>x</b>"', '有内容注入风险，只用于自己拼的可信字符串'],
          ['建元素', 'document.createElement("li")', '建完要 append 才上树'],
          ['插入', 'parent.appendChild(el) / el.append(a, b) / insertAdjacentHTML', ''],
          ['改类名', 'el.classList.add/remove/toggle/contains', '比手拼 className 稳'],
          ['改属性', 'el.setAttribute("data-x", 1) / el.id = "x"', ''],
          ['删掉', 'el.remove()', ''],
          ['读表单值', 'input.value（不是 textContent）', '表单元素用 value']
        ]
      },
      {
        kind: 'prose',
        md: [
          '事件用 `addEventListener("click", 回调)` 绑定。回调收到的**事件对象**里有几个常用东西：`ev.target`（真正被点的那个元素）、`ev.preventDefault()`（阻止默认行为，比如表单提交、链接跳转）、`ev.stopPropagation()`（阻止继续冒泡）。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '点击事件',
        needsDom: true,
        code: [
          '$("#app").innerHTML = \'<button id="b">点我</button>\';',
          'let count = 0;',
          '$("#b").addEventListener("click", ev => {',
          '  count += 1;',
          '  ev.target.textContent = `点了 ${count} 次`;',
          '});',
          '',
          '$("#b").click();     // 代码里也能触发一次真实点击',
          '$("#b").click();',
          'console.log($("#b").textContent);'
        ].join('\n'),
        expect: '点了 2 次'
      },
      {
        kind: 'prose',
        md: [
          '点击子元素时，事件会**冒泡**到父元素。利用这一点，不必给每个列表项绑事件——在父容器上绑一次，用 `ev.target` 判断是谁被点了，这就叫**事件委托**。',
          '',
          '委托的好处：以后动态加进去的子元素自动有效，也不用记着在删除元素时解绑。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '事件委托',
        needsDom: true,
        code: [
          '$("#app").innerHTML = \'<ul id="list"><li>甲</li><li>乙</li></ul><p id="picked"></p>\';',
          '',
          '$("#list").addEventListener("click", ev => {',
          '  if (ev.target.tagName === "LI") {',
          '    $("#picked").textContent = `你点了 ${ev.target.textContent}`;',
          '  }',
          '});',
          '',
          '$("#list").insertAdjacentHTML("beforeend", "<li>丙</li>");   // 后来加的',
          '$$("#list li")[2].click();',
          'console.log($("#picked").textContent);'
        ].join('\n'),
        expect: '你点了 丙'
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '优先 `textContent`，谨慎 `innerHTML`——把用户输入塞进 innerHTML 就是 XSS 漏洞。需要拼 HTML 时，先把内容里 `<` `>` 转义掉。'
      },
      {
        kind: 'exercise',
        id: 'ex12-1',
        title: '渲染一个列表',
        task: [
          '补完 `renderList(items)`：往 `#app` 里追加一个 `<ul>`，每个元素一个 `<li>`，`li` 的文本就是元素内容，最后返回这个 `ul`。',
          '',
          '空数组也要生成一个空的 `ul`。'
        ].join('\n'),
        starter: [
          'function renderList(items) {',
          '  const ul = document.createElement("ul");',
          '  // 你的代码',
          '  $("#app").appendChild(ul);',
          '  return ul;',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function renderList(items) {',
          '  const ul = document.createElement("ul");',
          '  for (const item of items) {',
          '    const li = document.createElement("li");',
          '    li.textContent = item;',
          '    ul.appendChild(li);',
          '  }',
          '  $("#app").appendChild(ul);',
          '  return ul;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { $('#app').innerHTML = ''; renderList(['甲', '乙']); eq($$('#app ul li').length, 2); eq($('#app ul li').textContent, '甲'); })();",
          "(() => { $('#app').innerHTML = ''; renderList([]); eq($('#app ul').tagName, 'UL'); eq($$('#app li').length, 0, '空数组也要有一个 ul'); })();",
          "(() => { $('#app').innerHTML = ''; renderList([1, 2]); eq($$('#app li')[1].textContent, '2', '数字会转成文本'); })();"
        ],
        hints: [
          '每个 li 都要 `document.createElement("li")` 新建，不要复用同一个。',
          '文本用 `li.textContent = item` 写入（用 innerHTML 会把内容当标签解析）。'
        ],
        needsDom: true
      },
      {
        kind: 'exercise',
        id: 'ex12-2',
        title: '点击计数器',
        task: [
          '补完 `buildCounter()`：往 `#app` 里追加一个按钮 `<button id="inc">点我</button>` 和一个 `<span id="out">点了 0 次</span>`。',
          '',
          '每点一次按钮，`#out` 的文本更新成 `点了 N 次`。'
        ].join('\n'),
        starter: [
          'function buildCounter() {',
          '  let count = 0;',
          '  // 建按钮、建 span、绑点击',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function buildCounter() {',
          '  let count = 0;',
          '  const btn = document.createElement("button");',
          '  btn.id = "inc";',
          '  btn.textContent = "点我";',
          '  const out = document.createElement("span");',
          '  out.id = "out";',
          '  out.textContent = "点了 0 次";',
          '  btn.addEventListener("click", () => {',
          '    count += 1;',
          '    out.textContent = `点了 ${count} 次`;',
          '  });',
          '  $("#app").append(btn, out);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { $('#app').innerHTML = ''; buildCounter(); const btn = $('#inc'); const out = $('#out'); ok(btn && out, '需要 #inc 按钮和 #out 显示区'); eq(out.textContent, '点了 0 次'); btn.click(); eq(out.textContent, '点了 1 次'); btn.click(); btn.click(); eq(out.textContent, '点了 3 次'); })();",
          "(() => { $('#app').innerHTML = ''; buildCounter(); $('#inc').click(); ok($('#out').textContent.indexOf('1') >= 0, '计数要真的跟着点击走'); })();"
        ],
        hints: [
          '`count` 用闭包变量存在函数里，点一次加一。',
          '绑定写在 append 之前之后都行，但必须先 createElement 才能绑。'
        ],
        needsDom: true
      },
      {
        kind: 'exercise',
        id: 'ex12-3',
        title: '事件委托',
        task: [
          '补完 `setupList(items)`：往 `#app` 里追加 `<ul id="list">`（每项一个 li）和空的 `<span id="picked">`。',
          '',
          '在 `ul` 上**只绑一个** click 监听，点到哪个 li 就把它的文本写进 `#picked`。'
        ].join('\n'),
        starter: [
          'function setupList(items) {',
          '  const ul = document.createElement("ul");',
          '  ul.id = "list";',
          '  const picked = document.createElement("span");',
          '  picked.id = "picked";',
          '  // 你的代码',
          '  $("#app").append(ul, picked);',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function setupList(items) {',
          '  const ul = document.createElement("ul");',
          '  ul.id = "list";',
          '  const picked = document.createElement("span");',
          '  picked.id = "picked";',
          '  for (const item of items) {',
          '    const li = document.createElement("li");',
          '    li.textContent = item;',
          '    ul.appendChild(li);',
          '  }',
          '  ul.addEventListener("click", ev => {',
          '    if (ev.target.tagName === "LI") picked.textContent = ev.target.textContent;',
          '  });',
          '  $("#app").append(ul, picked);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { $('#app').innerHTML = ''; setupList(['甲', '乙', '丙']); eq($$('#list li').length, 3); $$('#list li')[1].click(); eq($('#picked').textContent, '乙'); })();",
          "(() => { $('#app').innerHTML = ''; setupList(['甲']); $('#list').insertAdjacentHTML('beforeend', '<li>新来的</li>'); $$('#list li')[1].click(); eq($('#picked').textContent, '新来的', '后加进来的 li 也要能响应，说明用的是委托'); })();"
        ],
        hints: [
          '监听绑在 `ul` 上，回调里用 `ev.target` 判断点击源。',
          '`ev.target.tagName` 是大写的 `"LI"`。第二条断言会往列表里塞一个新的 li，只有委托写法能通过。'
        ],
        needsDom: true
      },
      {
        kind: 'exercise',
        id: 'ex12-4',
        title: '切换类名',
        task: [
          '补完 `toggleClass(el, cls)`：`el` 上有这个类就删掉，没有就加上；返回切换**之后**是否含这个类（布尔）。',
          '',
          '不要影响元素上的其他类名。'
        ].join('\n'),
        starter: [
          'function toggleClass(el, cls) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function toggleClass(el, cls) {',
          '  el.classList.toggle(cls);',
          '  return el.classList.contains(cls);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { const d = document.createElement('div'); ok(toggleClass(d, 'on'), '第一次应该加上并返回 true'); ok(d.classList.contains('on')); eq(toggleClass(d, 'on'), false, '第二次应该移除并返回 false'); })();",
          "(() => { const d = document.createElement('div'); d.className = 'a b'; toggleClass(d, 'b'); eq(d.className, 'a', '别的类名不能被弄丢'); })();",
          "(() => { const d = document.createElement('div'); toggleClass(d, 'x'); toggleClass(d, 'x'); eq(d.className, ''); })();"
        ],
        hints: [
          '`classList.toggle("名字")` 一步搞定加/删。',
          '返回状态用 `classList.contains(cls)`，别去手拼 className 字符串。'
        ],
        needsDom: true
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
