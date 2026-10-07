(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch02',
    title: '第 2 章 · 运算符与分支',
    goal: '算数算得对、比较不踩坑、用 if / 三元 / ?? 让代码走不同的路。',
    sections: [
      {
        kind: 'prose',
        md: [
          '算术运算符：`+ - * / %`（取余）和 `**`（乘方）。',
          '',
          '`+` 有两个身份：两边都是数字时做加法，只要有一边是字符串就变成拼接。这在第 1 章见过，本章不再重复。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '取余与乘方',
        code: [
          'console.log(7 % 3);       // 7 除以 3 的余数',
          'console.log(2 ** 10);     // 2 的 10 次方',
          'console.log(-7 % 3);      // 结果是 -1：余数跟被除数的符号走',
          'console.log(7 / 2);       // 没有整数除：7 除以 2 得到 3.5'
        ].join('\n'),
        expect: '1\n1024\n-1\n3.5'
      },
      {
        kind: 'prose',
        md: [
          '比较用 `===`（严格相等：类型和值都要一样）和 `!==`。`==` 会先做类型转换，规则有几十条，记不住也别记——**默认一律用 `===`**。',
          '',
          '两个历史坑：浮点相加有误差，`0.1 + 0.2` 不等于 `0.3`；`NaN` 不等于任何值，包括它自己，要判断得用 `Number.isNaN()`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '比较的坑',
        code: [
          'console.log(0.1 + 0.2 === 0.3);',
          'console.log(NaN === NaN, Number.isNaN(NaN));',
          'console.log(1 === 1, "1" === 1, "1" == 1);',
          'console.log(null == undefined, null === undefined);'
        ].join('\n'),
        expect: 'false\nfalse true\ntrue false true\ntrue false'
      },
      {
        kind: 'prose',
        md: [
          '`if (x)` 里的 `x` 会被转成真假。只有下面这几个值是**假值**，其余一切（包括空数组 `[]`、空对象 `{}`、字符串 `" "`）都是真值。'
        ].join('\n')
      },
      {
        kind: 'table',
        head: ['假值', '说明'],
        rows: [
          ['false', '布尔假'],
          ['0 与 -0', '数字零'],
          ['0n', '大整数零'],
          ['""', '空字符串'],
          ['null', '有意留空'],
          ['undefined', '未赋值'],
          ['NaN', '非数字']
        ]
      },
      {
        kind: 'code',
        caption: '真假值',
        code: [
          'const falsy = [false, 0, -0, 0n, "", null, undefined, NaN];',
          'console.log(falsy.map(v => Boolean(v)));',
          'console.log(Boolean([]), Boolean({}), Boolean(" "));'
        ].join('\n'),
        expect: '[ false, false, false, false, false, false, false, false ]\ntrue true true'
      },
      {
        kind: 'prose',
        md: [
          '`&&` 和 `||` 不算布尔，它们返回**其中一个操作数**：`a || b` 在 `a` 是假值时才看 `b`，`a && b` 在 `a` 是真值时才看 `b`。',
          '',
          '`??` 只看 `null` 和 `undefined`：`0 ?? "兜底"` 得到 `0`，而 `0 || "兜底"` 得到 `"兜底"`。给配置项设默认值时要的就是 `??`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '短路与 ??',
        code: [
          'const name = "";',
          'console.log("|| 对空串:", name || "匿名");',
          'console.log("?? 对空串:", JSON.stringify(name ?? "匿名"));',
          'console.log("|| 对 0:", 0 || "匿名");',
          'console.log("?? 对 0:", 0 ?? "匿名");'
        ].join('\n'),
        expect: '|| 对空串: 匿名\n?? 对空串: ""\n|| 对 0: 匿名\n?? 对 0: 0'
      },
      {
        kind: 'prose',
        md: [
          '分支：`if` / `else if` / `else`。从上往下，第一个成立的分支执行，**执行完就跳出整个链条**——所以条件可以只写增量部分。',
          '',
          '只有一个表达式要选的时候用三元：`条件 ? 真值 : 假值`。嵌套三元超过一层就该改回 if。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'if 链与三元',
        code: [
          'function grade(score) {',
          '  if (score >= 90) return "A";',
          '  if (score >= 80) return "B";   // 能走到这里，说明前面已经排除 >= 90',
          '  if (score >= 60) return "C";',
          '  return "D";',
          '}',
          '',
          'console.log(grade(95), grade(85), grade(60), grade(59));',
          'const label = 3 > 2 ? "真" : "假";',
          'console.log(label);'
        ].join('\n'),
        expect: 'A B C D\n真'
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`==` 的转换规则里，`"" == 0` 是 `true`、`[] == false` 也是 `true`。看到这种代码，别去想为什么，直接换成 `===`。'
      },
      {
        kind: 'exercise',
        id: 'ex02-1',
        title: '成绩等级',
        task: [
          '补完 `grade(score)`：90 分及以上返回 `A`，80 及以上 `B`，60 及以上 `C`，其余 `D`。',
          '',
          '用 if 链写，注意判断顺序。'
        ].join('\n'),
        starter: [
          'function grade(score) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function grade(score) {',
          '  if (score >= 90) return "A";',
          '  if (score >= 80) return "B";',
          '  if (score >= 60) return "C";',
          '  return "D";',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(grade(95), 'A');",
          "eq(grade(90), 'A', '边界值 90 算 A');",
          "eq(grade(85), 'B');",
          "eq(grade(60), 'C', '边界值 60 算 C');",
          "eq(grade(59), 'D');"
        ],
        hints: [
          '从高分往低分写，后面的条件就不用写上限了。',
          '如果从低分往高分写，得写成 `score >= 60 && score < 80`，容易漏边界。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-2',
        title: '三个数里最大的',
        task: [
          '补完 `max3(a, b, c)`，返回三个数里最大的那个。',
          '',
          '用三元的话一行就能写完；也可以用 if。'
        ].join('\n'),
        starter: [
          'function max3(a, b, c) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function max3(a, b, c) {',
          '  const m = a > b ? a : b;',
          '  return m > c ? m : c;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(max3(1, 2, 3), 3);",
          "eq(max3(9, 2, 3), 9);",
          "eq(max3(1, 5, 3), 5);",
          "eq(max3(-1, -2, -3), -1, '负数也要对');"
        ],
        hints: [
          '先比出前两个的最大值，再拿它和第三个比。',
          '别用 `Math.max`，这道题练的是比较与三元。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-3',
        title: '闰年判断',
        task: [
          '补完 `isLeap(year)`：能被 4 整除，但不能被 100 整除的是闰年；能被 400 整除的也是闰年。',
          '',
          '返回 `true` 或 `false`。'
        ].join('\n'),
        starter: [
          'function isLeap(year) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function isLeap(year) {',
          '  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(isLeap(2024), true);",
          "eq(isLeap(1900), false, '1900 能被 100 整除又不能被 400 整除，不是闰年');",
          "eq(isLeap(2000), true, '2000 能被 400 整除，是闰年');",
          "eq(isLeap(2023), false);"
        ],
        hints: [
          '先写「能被 4 整除」，再想怎么把整百年份例外掉。',
          '括号很关键：`a && (b || c)` 和 `a && b || c` 不是一回事（&& 优先级高于 ||）。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-4',
        title: '单个 FizzBuzz 判断',
        task: [
          '补完 `fizz(n)`：能被 15 整除返回 `fizzbuzz`，能被 3 整除返回 `fizz`，能被 5 整除返回 `buzz`，否则把 n 转成字符串返回。',
          '',
          '下一章的循环会拿它去打印 1 到 100。'
        ].join('\n'),
        starter: [
          'function fizz(n) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function fizz(n) {',
          '  if (n % 15 === 0) return "fizzbuzz";',
          '  if (n % 3 === 0) return "fizz";',
          '  if (n % 5 === 0) return "buzz";',
          '  return String(n);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(fizz(15), 'fizzbuzz');",
          "eq(fizz(9), 'fizz');",
          "eq(fizz(10), 'buzz');",
          "eq(fizz(7), '7', '既不是 3 的倍数也不是 5 的倍数时要转成字符串');"
        ],
        hints: [
          '15 的倍数同时是 3 和 5 的倍数，所以必须先判 15。',
          '`return n` 会返回数字，测试要的是字符串 `"7"`，用 `String(n)` 或 `` `${n}` ``。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex02-5',
        title: '默认值只兜 null 和 undefined',
        task: [
          '补完 `withDefault(v)`：`v` 是 `null` 或 `undefined` 时返回 `匿名`，其余情况原样返回。',
          '',
          '注意 `0`、`""`、`false` 都要原样返回。'
        ].join('\n'),
        starter: [
          'function withDefault(v) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function withDefault(v) {',
          '  return v ?? "匿名";',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(withDefault(undefined), '匿名');",
          "eq(withDefault(null), '匿名');",
          "eq(withDefault(''), '', '空字符串是真值以外的合法值，要原样返回');",
          "eq(withDefault(0), 0);",
          "eq(withDefault(false), false);"
        ],
        hints: [
          '用 `??`，别用 `||`——`||` 会把 `0` 和 `""` 也当成没给值。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
