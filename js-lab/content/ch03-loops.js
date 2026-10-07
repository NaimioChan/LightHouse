(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch03',
    title: '第 3 章 · 循环与迭代',
    goal: '重复的事交给循环：会数数、会遍历、知道什么时候该退出。',
    sections: [
      {
        kind: 'prose',
        md: [
          '三种循环，各有各的场合：',
          '',
          '- `for (初始化; 条件; 步进)`：次数已知，最常见。',
          '- `while (条件)`：次数未知，靠条件停下来。',
          '- `for (const x of 数组)`：只想挨个拿元素，不关心下标。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'for：数的累加',
        code: [
          'let total = 0;',
          'for (let i = 1; i <= 5; i++) {',
          '  total = total + i;',
          '}',
          'console.log(total);',
          '',
          '// 倒着数也可以',
          'const words = [];',
          'for (let i = 3; i > 0; i--) words.push(i);',
          'console.log(words.join(" "));'
        ].join('\n'),
        expect: '15\n3 2 1'
      },
      {
        kind: 'prose',
        md: [
          '`while` 适合「不知道要跑几次」的场景。它每次执行前检查条件，所以条件一开始就是假的，循环体一次都不跑。',
          '',
          '`break` 立刻跳出整个循环，`continue` 跳过本轮剩下的语句、直接进入下一轮。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'while + break',
        code: [
          'let n = 1;',
          'while (n < 1000) {',
          '  n = n * 3;',
          '}',
          'console.log(n);',
          '',
          '// 找第一个能被 7 整除的数就停',
          'for (let i = 10; i < 100; i++) {',
          '  if (i % 7 !== 0) continue;   // 不是倍数，跳过',
          '  console.log("找到:", i);',
          '  break;                       // 找到就走',
          '}'
        ].join('\n'),
        expect: '2187\n找到: 14'
      },
      {
        kind: 'prose',
        md: [
          '`for...of` 遍历的是**值**：数组的元素、字符串的字符、Map 的 [键, 值]。',
          '',
          '`for...in` 遍历的是**键**，而且会把原型链上的键也翻出来，所以别拿它遍历数组——要下标就用带 `i` 的 `for`，要值就用 `for...of`。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['写法', '拿到什么', '什么时候用'],
        rows: [
          ['for (let i = 0; ...)', '下标 i', '需要下标，或需要跳着走'],
          ['for (const x of arr)', '元素值', '挨个处理每个元素'],
          ['arr.forEach(...)', '元素值+下标', '不需要中途退出'],
          ['for (const k in obj)', '键（含继承来的）', '几乎不用，遍历对象用 Object.keys'],
          ['while (...) / do...while', '无', '次数未知，或至少执行一次']
        ]
      },
      {
        kind: 'code',
        caption: 'for...of 与下标',
        code: [
          'const scores = [88, 92, 75];',
          'for (const s of scores) console.log("分数", s);',
          '',
          'for (let i = 0; i < scores.length; i++) {',
          '  console.log(i, scores[i]);',
          '}',
          '',
          'for (const ch of "abc") console.log(ch);'
        ].join('\n'),
        expect: '分数 88\n分数 92\n分数 75\n0 88\n1 92\n2 75\na\nb\nc'
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`while (true)` 忘写 `break` 就是死循环。本站会在 5 秒后强制掐掉并提示你——但真写进项目里就是浏览器卡死，写完循环记得问自己一句：它靠什么停下来。'
      },
      {
        kind: 'exercise',
        id: 'ex03-1',
        title: '从 1 加到 n',
        task: [
          '补完 `sumTo(n)`，返回 1 到 n 的和（n 为 0 时返回 0）。',
          '',
          '要求用 for 循环累加。'
        ].join('\n'),
        starter: [
          'function sumTo(n) {',
          '  let total = 0;',
          '  // 你的循环',
          '  return total;',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function sumTo(n) {',
          '  let total = 0;',
          '  for (let i = 1; i <= n; i++) {',
          '    total += i;',
          '  }',
          '  return total;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(sumTo(0), 0, 'n 是 0 时循环一次都不该跑');",
          "eq(sumTo(4), 10);",
          "eq(sumTo(100), 5050);"
        ],
        hints: [
          '起点是 1，条件是 `i <= n`（写 `i < n` 会少加一项）。',
          '`total += i` 就是 `total = total + i`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-2',
        title: '数元音',
        task: [
          '补完 `countVowels(s)`，返回字符串里元音字母的个数（a、e、i、o、u，不区分大小写）。',
          '',
          '要求用 `for...of` 逐字符遍历。'
        ].join('\n'),
        starter: [
          'function countVowels(s) {',
          '  let count = 0;',
          '  // 你的代码',
          '  return count;',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function countVowels(s) {',
          '  const vowels = "aeiou";',
          '  let count = 0;',
          '  for (const ch of s.toLowerCase()) {',
          '    if (vowels.includes(ch)) count++;',
          '  }',
          '  return count;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(countVowels('hello'), 2);",
          "eq(countVowels('JS'), 0);",
          "eq(countVowels('AEIOU'), 5, '大写也要算');",
          "eq(countVowels(''), 0);"
        ],
        hints: [
          '`s.toLowerCase()` 之后再逐字符判断，就不用管大小写了。',
          '判断「ch 在不在元音串里」可以用 `"aeiou".includes(ch)`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-3',
        title: '最大值的下标',
        task: [
          '补完 `indexOfMax(arr)`，返回数组中最大元素的下标。',
          '',
          '如果有多个相同的最大值，返回**第一个**的下标。空数组返回 `-1`。'
        ].join('\n'),
        starter: [
          'function indexOfMax(arr) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function indexOfMax(arr) {',
          '  if (arr.length === 0) return -1;',
          '  let best = 0;',
          '  for (let i = 1; i < arr.length; i++) {',
          '    if (arr[i] > arr[best]) best = i;',
          '  }',
          '  return best;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(indexOfMax([3, 9, 4]), 1);",
          "eq(indexOfMax([1, 2, 2]), 1, '相同的最大值取第一个');",
          "eq(indexOfMax([5]), 0);",
          "eq(indexOfMax([]), -1, '空数组返回 -1');"
        ],
        hints: [
          '维护一个「目前见过最大的下标」，从下标 1 开始往后比。',
          '比较用严格大于 `>`，用 `>=` 会让相同的最大值取到最后一个。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex03-4',
        title: '画楼梯',
        task: [
          '补完 `buildStairs(n)`，返回 n 行的星号楼梯，行之间用 `\\n` 连接。',
          '',
          '`buildStairs(3)` 应返回：第一行一个星，第二行两个星，第三行三个星。'
        ].join('\n'),
        starter: [
          'function buildStairs(n) {',
          '  const lines = [];',
          '  // 你的代码',
          '  return lines.join("\\n");',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function buildStairs(n) {',
          '  const lines = [];',
          '  for (let i = 1; i <= n; i++) {',
          '    lines.push("*".repeat(i));',
          '  }',
          '  return lines.join("\\n");',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(buildStairs(1), '*');",
          "eq(buildStairs(3), '*\\n**\\n***');",
          "eq(buildStairs(0), '', 'n 是 0 时返回空字符串');"
        ],
        hints: [
          '第 i 行是 i 个星号，`"*".repeat(i)` 直接给你。',
          '用 `lines.join("\\n")` 拼成多行字符串——注意在 JS 字符串字面量里 `\\n` 才是换行。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
