(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch07',
    title: '第 7 章 · 字符串、数字与 Math',
    goal: '把文本和数字处理干净：常用字符串方法、数字解析与舍入、随机整数配方。',
    sections: [
      {
        kind: 'prose',
        md: [
          '字符串**不可变**：`s.toUpperCase()` 返回新字符串，`s` 本身从来不变。所以方法可以连成一串写。',
          '',
          '最常用的一批：`trim`、`toLowerCase`、`includes`、`startsWith`、`slice`、`split`、`join`、`replace`、`repeat`、`padStart`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '字符串方法',
        code: [
          'const s = "  Hello World  ";',
          'console.log("[" + s.trim() + "]");',
          'console.log(s.trim().toLowerCase());',
          'console.log(s.includes("World"), s.trim().startsWith("He"));',
          'console.log("a-b-c".split("-"));',
          'console.log(["x", "y"].join("/"));',
          'console.log("ab".repeat(3), "5".padStart(3, "0"));',
          'console.log("hello".replace("l", "L"));'
        ].join('\n'),
        expect: "[Hello World]\nhello world\ntrue true\n[ 'a', 'b', 'c' ]\nx/y\nababab 005\nheLlo"
      },
      {
        kind: 'table',
        head: ['想干什么', '写法', '备注'],
        rows: [
          ['去掉两头空白', 's.trim()', '不改原串'],
          ['大小写', 's.toLowerCase() / toUpperCase()', ''],
          ['找子串位置', 's.indexOf("x") / s.lastIndexOf("x")', '找不到返回 -1'],
          ['判断包含', 's.includes("x") / startsWith / endsWith', '返回布尔'],
          ['切一段', 's.slice(1, 4)', '支持负数下标；substring 不支持负数'],
          ['拆成数组', 's.split(",")', '传空串可拆成单字符'],
          ['替换', 's.replace("a", "b") / replaceAll', 'replace 只换第一个'],
          ['对齐填充', 's.padStart(6, "0")', '常用来补零']
        ]
      },
      {
        kind: 'prose',
        md: [
          '数字这里只有两件事要记：怎么把文本变成数字，以及浮点数不精确。',
          '',
          '- `Number("12.5")` 严格解析，有杂字符就是 `NaN`。',
          '- `parseInt("12.5px")` 从开头往下读，读到读不动为止。',
          '- `NaN` 不等于任何值，判断用 `Number.isNaN()`。',
          '- `(0.1 + 0.2)` 得到 `0.30000000000000004`，展示时用 `toFixed(2)`——注意它返回的是**字符串**。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '数字解析与格式化',
        code: [
          'console.log(Number("12.5"), parseInt("12.5px"), parseFloat("12.5px"));',
          'console.log(Number("abc"), Number.isNaN(Number("abc")));',
          'console.log(Number(""), Number.isNaN(Number("")));   // 空串会变成 0，注意',
          'console.log((255).toString(16), (3.7).toFixed(1), (3).toFixed(2));'
        ].join('\n'),
        expect: '12.5 12 12.5\nNaN true\n0 false\nff 3.7 3.00'
      },
      {
        kind: 'prose',
        md: [
          '`Math` 是个工具箱：`round`（四舍五入）、`floor`（向下）、`ceil`（向上）、`abs`、`max`、`min`、`sqrt`、`random`。',
          '',
          '`Math.random()` 返回 `[0, 1)` 的随机小数。要「[min, max] 之间的整数」就用这条固定配方：'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'Math 与随机整数',
        code: [
          'console.log(Math.round(2.5), Math.floor(2.9), Math.ceil(2.1));',
          'console.log(Math.abs(-3), Math.max(1, 9, 4), Math.min(1, 9, 4));',
          'console.log(Math.pow(2, 3), Math.sqrt(16));',
          '',
          'const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;',
          'const r = randInt(1, 6);',
          'console.log(r >= 1 && r <= 6 && Number.isInteger(r));   // 每次结果不同，只验证范围'
        ].join('\n'),
        expect: '3 2 3\n3 9 1\n8 4\ntrue'
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '要「保留两位小数的金额」用 `toFixed(2)`，但它返回字符串；要「保留两位小数的数字」得 `Math.round(n * 100) / 100`。别拿 `toFixed` 的结果继续做加减——那是在拼字符串。'
      },
      {
        kind: 'exercise',
        id: 'ex07-1',
        title: '单词首字母大写',
        task: [
          '补完 `titleCase(s)`：每个单词的首字母大写，其余小写，用单个空格连接。',
          '',
          '`titleCase("hello world")` 得到 `Hello World`。'
        ].join('\n'),
        starter: [
          'function titleCase(s) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function titleCase(s) {',
          '  return s',
          '    .split(" ")',
          '    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())',
          '    .join(" ");',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(titleCase('hello world'), 'Hello World');",
          "eq(titleCase('JS is FUN'), 'Js Is Fun', '其余字母要小写');",
          "eq(titleCase(''), '');"
        ],
        hints: [
          '先 `split(" ")` 拆词，改完再 `join(" ")`。',
          '单词首字母：`w.charAt(0).toUpperCase()`，剩下部分 `w.slice(1).toLowerCase()`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-2',
        title: '数单词',
        task: [
          '补完 `wordCount(s)`：按空白切分，返回单词个数。两头和中间多余的空格都不该算成词。',
          '',
          '空字符串、纯空格都返回 `0`。'
        ].join('\n'),
        starter: [
          'function wordCount(s) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function wordCount(s) {',
          '  const parts = s.trim().split(/\\s+/);',
          '  return parts[0] === "" ? 0 : parts.length;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(wordCount(''), 0);",
          "eq(wordCount('   '), 0, '纯空格没有词');",
          "eq(wordCount('one'), 1);",
          "eq(wordCount('  a b  c '), 3, '多余空格不能算成空词');"
        ],
        hints: [
          '先 `trim()` 去掉两头，再 `split(/\\s+/)` 按一段空白切——正则式样 `\\s+` 表示连续空白。',
          '如果 trim 之后是空串，split 会给你 `[""]`，长度是 1，得单独返回 0。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-3',
        title: '保留 n 位小数',
        task: [
          '补完 `roundTo(n, digits)`：返回数字 `n` 四舍五入到 `digits` 位小数后的**数字**（不是字符串）。'
        ].join('\n'),
        starter: [
          'function roundTo(n, digits) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function roundTo(n, digits) {',
          '  const factor = 10 ** digits;',
          '  return Math.round(n * factor) / factor;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(roundTo(3.14159, 2), 3.14);",
          "eq(roundTo(3.14159, 3), 3.142);",
          "eq(roundTo(7.5, 0), 8);",
          "eq(typeof roundTo(1.234, 2), 'number', '要返回数字而不是字符串');"
        ],
        hints: [
          '先放大 `10 ** digits` 倍，四舍五入成整数，再缩回去。',
          '别用 `toFixed`——它返回字符串，`typeof` 那条断言会抓到。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-4',
        title: '分转元',
        task: [
          '补完 `formatYuan(cents)`：把以「分」为单位的整数换成「元」的字符串，固定两位小数。',
          '',
          '`formatYuan(1234)` 得到 `"12.34"`。'
        ].join('\n'),
        starter: [
          'function formatYuan(cents) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function formatYuan(cents) {',
          '  return (cents / 100).toFixed(2);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(formatYuan(1234), '12.34');",
          "eq(formatYuan(100), '1.00', '整数元也要补两位小数');",
          "eq(formatYuan(0), '0.00');",
          "eq(formatYuan(5), '0.05');"
        ],
        hints: [
          '除以 100 之后 `toFixed(2)`，正好补零和四舍五入都办了。',
          '这道题要的就是字符串，所以 toFixed 是对的。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-5',
        title: '能解析就用数字',
        task: [
          '补完 `toNumberOrNull(v)`：如果 `v` 能作为整个数字被解析（用 `Number(v)` 的规则），返回数字；否则返回 `null`。',
          '',
          '`"12"` → 12，`"12px"` → null，`""` → null。'
        ].join('\n'),
        starter: [
          'function toNumberOrNull(v) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function toNumberOrNull(v) {',
          '  if (v.trim() === "") return null;',
          '  const n = Number(v);',
          '  return Number.isNaN(n) ? null : n;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(toNumberOrNull('12'), 12);",
          "eq(toNumberOrNull(' 3.5 '), 3.5, '两头空白要忽略');",
          "eq(toNumberOrNull('abc'), null);",
          "eq(toNumberOrNull(''), null, '空串在 Number 里是 0，但这里要 null');",
          "eq(toNumberOrNull('12px'), null, '严格解析，带单位就不算数字');"
        ],
        hints: [
          '空串要先拦掉：`Number("")` 是 `0`，不是 NaN。',
          '`Number("12px")` 是 NaN，`parseInt("12px")` 才是 12——这道题要严格的那一个。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
