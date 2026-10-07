/* ch12 — 浏览器存储 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch12',
    title: '第 12 章 · 浏览器存储',
    goal: '把草稿、设置这类小数据用 localStorage / sessionStorage 存下来再读回去：会用 setItem / getItem / removeItem，会给对象套上 JSON.stringify / JSON.parse，会用 try / catch 兜住存不了的环境。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 两种存储，一套 API',
          '',
          '浏览器给你两个键值仓库，用法一模一样：',
          '',
          '- `localStorage`：数据留在域名下，关掉浏览器再打开还在',
          '- `sessionStorage`：只跟当前这个标签页同生共死，标签页一关就清空',
          '',
          '四个方法：`setItem(key, value)` 写、`getItem(key)` 读（没有这个键返回 `null`）、`removeItem(key)` 删一个、`clear()` 全清。键和值都存在同一个命名空间里，键名自己加前缀避免撞车。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '写进去，再读回来',
        height: 200,
        html: [
          '<button id="save" type="button">保存草稿</button>',
          '<p id="out">还没读过</p>'
        ].join('\n'),
        js: [
          'function saveDraft(draft) {',
          '  try {',
          '    localStorage.setItem(\'draft\', draft);',
          '    return \'已保存\';',
          '  } catch (e) {',
          '    return \'存不了：\' + e.name;',
          '  }',
          '}',
          '',
          'function loadDraft() {',
          '  try {',
          '    return localStorage.getItem(\'draft\');',
          '  } catch (e) {',
          '    return null;',
          '  }',
          '}',
          '',
          'function show() {',
          '  var v = loadDraft();',
          '  document.getElementById(\'out\').textContent = \'读回来：\' + (v === null ? \'（这个环境读不到）\' : v);',
          '}',
          '',
          'document.getElementById(\'save\').addEventListener(\'click\', show);',
          'document.getElementById(\'out\').textContent = \'存草稿 → \' + saveDraft(\'第一章笔记\');'
        ].join('\n'),
        checks: [
          'has("#save", "保存按钮")',
          'fn("saveDraft", "把保存写成顶层函数 saveDraft(draft)")',
          'fn("loadDraft", "把读取写成顶层函数 loadDraft()")',
          'ok(text("#out").indexOf("存草稿 → ") === 0, "把保存结果写进 #out")',
          'fn("show")()',
          'ok(text("#out").indexOf("读回来：") === 0, "调用 show() 之后 #out 显示读取结果")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 只能存字符串，对象要先序列化',
          '',
          '存储里放不下对象。`setItem` 收到非字符串会先悄悄转成字符串，对象转出来是 `[object Object]`，读回去已经没救了。',
          '',
          '常规做法是存之前 `JSON.stringify(obj)` 变成文本，读出来再 `JSON.parse(text)` 还原成对象。数组、布尔、数字都走这条路。',
          '',
          '读回来的文本是别人（或别的版本的自己）写的，`JSON.parse` 遇到坏数据会抛错，所以解析也要放进 `try`。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '对象穿一道 JSON 的桥',
        height: 190,
        html: [
          '<pre id="json"></pre>'
        ].join('\n'),
        js: [
          'var note = { title: \'第一章\', tags: [\'骨架\', \'语义\'], done: true };',
          'var jsonText = JSON.stringify(note);',
          '',
          'function readBack() {',
          '  return JSON.parse(jsonText);',
          '}',
          '',
          'document.getElementById(\'json\').textContent = jsonText;',
          'console.log(\'还原后的标题：\' + readBack().title);'
        ].join('\n'),
        checks: [
          'has("#json", "显示 JSON 文本的框")',
          'ok(text("#json").indexOf("第一章") >= 0, "#json 里是序列化后的文本")',
          'eq(logs[0], "还原后的标题：第一章", "JSON.parse 读回来的 title")',
          'eq(fn("readBack")().tags.length, 2, "数组也连带存下来了")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 存不了的时候会抛错',
          '',
          '不是每个浏览器环境都让页面用存储：隐私模式、被禁用的站点数据、被沙箱隔离的文档，都会让 `localStorage` 的读写直接抛错。抛出来的是 `SecurityError` 一类的异常，不是返回 `null`。',
          '',
          '所以读写一律包 `try`：能存就存，存不了就退回到内存里的默认值，页面照样能用。把结果写进 `catch` 里，用户至少知道草稿没保住。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '先探一探这个环境让不让存',
        height: 190,
        html: [
          '<p id="state">检查中…</p>'
        ].join('\n'),
        js: [
          'function probe() {',
          '  try {',
          '    localStorage.setItem(\'h5lab.probe\', \'1\');',
          '    localStorage.removeItem(\'h5lab.probe\');',
          '    return \'这个环境允许存储\';',
          '  } catch (e) {',
          '    return \'这个环境不允许存储（\' + e.name + \'），代码要能扛住\';',
          '  }',
          '}',
          '',
          'var answer = probe();',
          'document.getElementById(\'state\').textContent = answer;',
          'console.log(\'探针：\' + answer);'
        ].join('\n'),
        checks: [
          'fn("probe", "把探测写成顶层函数 probe()")',
          'has("#state", "结果段落")',
          'ok(text("#state").indexOf("存储") >= 0, "把探测结论写进 #state")',
          'ok(logs[0].indexOf("探针：") === 0, "console.log 出探针结果")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '只需要在刷新后保住、关掉标签页就该消失的东西（比如未提交的表单步骤）用 `sessionStorage`；要跨次访问留下来的（主题、草稿、进度）用 `localStorage`。'
      },
      {
        kind: 'prose',
        md: [
          '## 草稿自动保存，以及和 cookie 的分工',
          '',
          '输入框每次改动就把内容写进存储，下次打开先读出来填回去，就是草稿箱。读不到就给一个空串或默认值，别让页面停在半路。',
          '',
          'cookie 也能在浏览器里留东西，但它每发一次请求都跟着带上，容量只有几 KB，只适合服务端也要读的小标记（登录态、语言）。页面自己用的数据留在 `localStorage`，别塞进 cookie。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '草稿：存、读、清',
        height: 220,
        html: [
          '<label for="note">草稿</label>',
          '<input id="note" type="text" value="今天的段落">',
          '<button id="save" type="button">保存</button>',
          '<button id="clear" type="button">清空</button>',
          '<p id="msg">（未操作）</p>'
        ].join('\n'),
        js: [
          'function saveDraft() {',
          '  try {',
          '    localStorage.setItem(\'h5lab.draft\', document.getElementById(\'note\').value);',
          '    return \'已保存\';',
          '  } catch (e) {',
          '    return \'存不了：\' + e.name;',
          '  }',
          '}',
          '',
          'function loadDraft() {',
          '  try {',
          '    return localStorage.getItem(\'h5lab.draft\');',
          '  } catch (e) {',
          '    return null;',
          '  }',
          '}',
          '',
          'function clearDraft() {',
          '  try {',
          '    localStorage.removeItem(\'h5lab.draft\');',
          '    return \'已清空\';',
          '  } catch (e) {',
          '    return \'清不了：\' + e.name;',
          '  }',
          '}',
          '',
          'function showDraft() {',
          '  var v = loadDraft();',
          '  document.getElementById(\'msg\').textContent = v === null ? \'没有草稿\' : (\'草稿：\' + v);',
          '}',
          '',
          'document.getElementById(\'save\').addEventListener(\'click\', function () {',
          '  document.getElementById(\'msg\').textContent = saveDraft();',
          '});',
          'document.getElementById(\'clear\').addEventListener(\'click\', clearDraft);'
        ].join('\n'),
        checks: [
          'eq(attr("#note", "value"), "今天的段落", "输入框的默认值")',
          'fn("saveDraft", "把保存写成顶层函数 saveDraft()")',
          'fn("loadDraft", "把读取写成顶层函数 loadDraft()")',
          'fn("showDraft")()',
          'ok(text("#msg").indexOf("草稿") >= 0, "调用 showDraft() 之后 #msg 显示草稿状态")',
          'ok(typeof fn("saveDraft")() === "string", "saveDraft() 返回一句结果文案且不抛错")'
        ]
      },
      {
        kind: 'table',
        head: ['存放位置', '活多久', '谁来读', '大致容量'],
        rows: [
          ['localStorage', '一直留在域名下，除非手动清', '只有页面自己的 JS', '几 MB'],
          ['sessionStorage', '标签页关闭即清空', '只有当前标签页的 JS', '几 MB'],
          ['cookie', '可设过期时间', '页面 JS 和每次 HTTP 请求', '约 4 KB']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '存储里的东西没加密，同一台电脑上能打开开发者工具的人都看得到。密码、令牌这类敏感内容不要写进去；用户名这类只用来让页面别忘事的，可以用。'
      },
      {
        kind: 'exercise',
        id: 'ex12-1',
        title: '存一个名字，再读回来',
        height: 280,
        task: [
          '实现三个顶层函数：',
          '',
          '- `saveName(name)`：把 `name` 存进 `localStorage`，返回一句结果文案（例如 `已保存`）；不能抛错',
          '- `readName()`：把存的名字读回来；读不到返回 `（没有）`',
          '- `showName()`：把读到的名字写进 `#shown`，格式为 `姓名：名字`',
          '',
          '判题时存储可能用不了，会直接抛错。读写都要用 `try / catch` 兜住，`saveName` 绝不能把异常漏出去。'
        ].join('\n'),
        starter: {
          html: [
            '<p id="shown">（未读）</p>'
          ].join('\n'),
          js: [
            'function saveName(name) {',
            '  /* TODO: localStorage.setItem，用 try/catch 兜住 */',
            '}',
            '',
            'function readName() {',
            '  /* TODO: localStorage.getItem；读不到返回 \'（没有）\' */',
            '}',
            '',
            'function showName() {',
            '  document.getElementById(\'shown\').textContent = \'姓名：\' + readName();',
            '}'
          ].join('\n')
        },
        solution: {
          html: [
            '<p id="shown">（未读）</p>'
          ].join('\n'),
          js: [
            'function saveName(name) {',
            '  try {',
            '    localStorage.setItem(\'name\', name);',
            '    return \'已保存\';',
            '  } catch (e) {',
            '    return \'没存进去：\' + e.name;',
            '  }',
            '}',
            '',
            'function readName() {',
            '  try {',
            '    var v = localStorage.getItem(\'name\');',
            '    return v === null ? \'（没有）\' : v;',
            '  } catch (e) {',
            '    return \'（没有）\';',
            '  }',
            '}',
            '',
            'function showName() {',
            '  document.getElementById(\'shown\').textContent = \'姓名：\' + readName();',
            '}'
          ].join('\n')
        },
        tests: [
          'has("#shown", "结果显示段落")',
          'fn("saveName", "把保存写成顶层函数 saveName(name)")',
          'fn("readName", "把读取写成顶层函数 readName()")',
          'eq(fn("readName")(), "（没有）", "还没存过时返回「（没有）」")',
          'fn("showName")()',
          'eq(text("#shown"), "姓名：（没有）", "#shown 里显示读到的姓名")',
          'ok(typeof fn("saveName")("草稿") === "string", "saveName(name) 返回结果文案，且不抛错（try/catch 兜住）")'
        ],
        hints: [
          '读写都放进 `try`，`catch` 里返回一句能给用户看的文案。',
          '`getItem` 在键不存在时返回 `null`，不要拿它去拼字符串，先判断再决定显示什么。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-2',
        title: '把对象存成 JSON 再还原',
        height: 300,
        task: [
          '实现三个顶层函数：',
          '',
          '- `saveUser(user)`：用 `JSON.stringify` 把对象转成文本再 `setItem`，返回结果文案，不能抛错',
          '- `readUser(raw)`：`raw` 给了就直接解析 `raw`，没给就去存储里读；读不到返回 `null`，解析失败也返回 `null`',
          '- `showUser()`：读回来有对象就写 `名字，N 岁`，没有就写 `没有用户`',
          '',
          '判题会把一段 JSON 文本（形如 `{"name":"张三","age":20}`）直接传给 `readUser`，所以 `raw` 这个参数必须真的参与解析。'
        ].join('\n'),
        starter: {
          html: [
            '<p id="who">（未读）</p>'
          ].join('\n'),
          js: [
            'function saveUser(user) {',
            '  /* TODO: JSON.stringify 之后 setItem，用 try/catch 兜住 */',
            '}',
            '',
            'function readUser(raw) {',
            '  /* TODO: 有 raw 就解析 raw，否则读存储；读不到或解析失败返回 null */',
            '}',
            '',
            'function showUser() {',
            '  var u = readUser();',
            '  document.getElementById(\'who\').textContent = u ? (u.name + \'，\' + u.age + \' 岁\') : \'没有用户\';',
            '}'
          ].join('\n')
        },
        solution: {
          html: [
            '<p id="who">（未读）</p>'
          ].join('\n'),
          js: [
            'function saveUser(user) {',
            '  try {',
            '    localStorage.setItem(\'user\', JSON.stringify(user));',
            '    return \'已保存\';',
            '  } catch (e) {',
            '    return \'没存进去：\' + e.name;',
            '  }',
            '}',
            '',
            'function readUser(raw) {',
            '  try {',
            '    var text = (raw === undefined) ? localStorage.getItem(\'user\') : raw;',
            '    return (text === null || text === undefined) ? null : JSON.parse(text);',
            '  } catch (e) {',
            '    return null;',
            '  }',
            '}',
            '',
            'function showUser() {',
            '  var u = readUser();',
            '  document.getElementById(\'who\').textContent = u ? (u.name + \'，\' + u.age + \' 岁\') : \'没有用户\';',
            '}'
          ].join('\n')
        },
        tests: [
          'has("#who", "结果显示段落")',
          'fn("saveUser", "把保存写成顶层函数 saveUser(user)")',
          'fn("readUser", "把读取写成顶层函数 readUser(raw)")',
          'eq(fn("readUser")(), null, "存储里没有时返回 null")',
          'eq(fn("readUser")(\'{"name":"张三","age":20}\'), { name: "张三", age: 20 }, "把 JSON 文本还原成对象")',
          'fn("showUser")()',
          'eq(text("#who"), "没有用户", "#who 显示占位文案")'
        ],
        hints: [
          '存储里只有字符串。存对象之前先 `JSON.stringify`，读出来之后 `JSON.parse`。',
          '`JSON.parse` 遇到坏文本会抛错，把它放进 `try` 里，`catch` 返回 `null`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-3',
        title: '读设置，读不到就用默认值',
        height: 260,
        task: [
          '实现顶层函数 `loadSetting(key, fallback)`：从 `localStorage` 读 `key` 对应的值并返回；键不存在、读不了（抛错）都返回 `fallback`。',
          '',
          '页面正文用 `loadSetting(\'theme\', \'浅色\')` 的结果拼出 `主题：浅色` 写进 `#theme`。',
          '',
          '这是读配置的通用写法：任何时候都拿得到一个能用的值。'
        ].join('\n'),
        starter: {
          html: [
            '<p id="theme">主题：</p>'
          ].join('\n'),
          js: [
            'function loadSetting(key, fallback) {',
            '  /* TODO: 读 key；读不到或读不了都返回 fallback */',
            '}',
            '',
            'document.getElementById(\'theme\').textContent = \'主题：\' + loadSetting(\'theme\', \'浅色\');'
          ].join('\n')
        },
        solution: {
          html: [
            '<p id="theme">主题：</p>'
          ].join('\n'),
          js: [
            'function loadSetting(key, fallback) {',
            '  try {',
            '    var v = localStorage.getItem(key);',
            '    return v === null ? fallback : v;',
            '  } catch (e) {',
            '    return fallback;',
            '  }',
            '}',
            '',
            'document.getElementById(\'theme\').textContent = \'主题：\' + loadSetting(\'theme\', \'浅色\');'
          ].join('\n')
        },
        tests: [
          'fn("loadSetting", "把读取写成顶层函数 loadSetting(key, fallback)")',
          'eq(fn("loadSetting")("theme", "浅色"), "浅色", "没有这个键时返回 fallback")',
          'eq(fn("loadSetting")("theme", 0), 0, "fallback 是数字也原样返回")',
          'eq(text("#theme"), "主题：浅色", "#theme 显示读到的设置")'
        ],
        hints: [
          '`getItem(key)` 在这个键不存在时返回 `null`，`null` 就要换成 `fallback`。',
          '存储整体用不了时访问 `localStorage` 本身就会抛错，`try` 要包住整个读取过程。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex12-4',
        title: '表单草稿：存、读、清',
        height: 320,
        task: [
          '输入框 `#note` 里的内容是草稿。实现三个顶层函数：',
          '',
          '- `saveDraft()`：把 `#note` 的当前值存起来，把结果文案写进 `#msg`，返回该文案',
          '- `loadDraft()`：读草稿；读不到返回空串 `\'\'`',
          '- `clearDraft()`：删掉草稿，把结果文案写进 `#msg`，返回该文案',
          '',
          '判题不会真的点按钮，它直接调用这三个函数。三个都不能抛错，存储用不了时也要正常返回。'
        ].join('\n'),
        starter: {
          html: [
            '<input id="note" type="text" value="记得买牛奶">',
            '<button id="save" type="button">保存草稿</button>',
            '<button id="clear" type="button">清空</button>',
            '<p id="msg">（未操作）</p>'
          ].join('\n'),
          js: [
            'function saveDraft() {',
            '  /* TODO: 把 #note 的值存起来，把结果写进 #msg，返回这句结果 */',
            '}',
            '',
            'function loadDraft() {',
            '  /* TODO: 读草稿；读不到返回 \'\' */',
            '}',
            '',
            'function clearDraft() {',
            '  /* TODO: 删掉草稿，把结果写进 #msg，返回这句结果 */',
            '}',
            '',
            'document.getElementById(\'save\').addEventListener(\'click\', saveDraft);',
            'document.getElementById(\'clear\').addEventListener(\'click\', clearDraft);'
          ].join('\n')
        },
        solution: {
          html: [
            '<input id="note" type="text" value="记得买牛奶">',
            '<button id="save" type="button">保存草稿</button>',
            '<button id="clear" type="button">清空</button>',
            '<p id="msg">（未操作）</p>'
          ].join('\n'),
          js: [
            'function saveDraft() {',
            '  var text = document.getElementById(\'note\').value;',
            '  var msg;',
            '  try {',
            '    localStorage.setItem(\'h5lab.draft\', text);',
            '    msg = \'已保存：\' + text;',
            '  } catch (e) {',
            '    msg = \'没存进去：\' + e.name;',
            '  }',
            '  document.getElementById(\'msg\').textContent = msg;',
            '  return msg;',
            '}',
            '',
            'function loadDraft() {',
            '  try {',
            '    var v = localStorage.getItem(\'h5lab.draft\');',
            '    return v === null ? \'\' : v;',
            '  } catch (e) {',
            '    return \'\';',
            '  }',
            '}',
            '',
            'function clearDraft() {',
            '  var msg;',
            '  try {',
            '    localStorage.removeItem(\'h5lab.draft\');',
            '    msg = \'草稿已清空\';',
            '  } catch (e) {',
            '    msg = \'没清掉：\' + e.name;',
            '  }',
            '  document.getElementById(\'msg\').textContent = msg;',
            '  return msg;',
            '}',
            '',
            'document.getElementById(\'save\').addEventListener(\'click\', saveDraft);',
            'document.getElementById(\'clear\').addEventListener(\'click\', clearDraft);'
          ].join('\n')
        },
        tests: [
          'eq(attr("#note", "value"), "记得买牛奶", "输入框的初始值")',
          'fn("loadDraft", "把读取写成顶层函数 loadDraft()")',
          'eq(fn("loadDraft")(), "", "没有草稿时读回空串")',
          'fn("saveDraft")()',
          'ok(text("#msg") !== "（未操作）" && text("#msg").length > 0, "saveDraft() 之后 #msg 要有结果文案")',
          'ok(typeof fn("clearDraft")() === "string", "clearDraft() 返回结果文案且不抛错")'
        ],
        hints: [
          '`document.getElementById("note").value` 拿输入框当前的文字。',
          '`removeItem` 只会删指定的键，存的时候用什么键名，删的时候用同一个。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
