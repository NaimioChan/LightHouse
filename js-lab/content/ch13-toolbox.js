(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch13',
    title: '第 13 章 · 现代工具箱',
    goal: '补齐日常真正用得上的几件工具：Map / Set、生成器、JSON、正则。',
    sections: [
      {
        kind: 'prose',
        md: [
          '`Map` 是「键可以是任何东西」的字典；`Set` 是「不许重复」的集合。两者的 `size` 是属性不是方法，遍历顺序都是插入顺序。',
          '',
          '对象够用的场合就别上 Map；键是数字/对象、或者要频繁增删查，用 Map 更合适。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'Map 与 Set',
        code: [
          'const freq = new Map();',
          'for (const w of ["a", "b", "a"]) freq.set(w, (freq.get(w) || 0) + 1);',
          'console.log(freq.get("a"), freq.size, freq.has("b"));',
          '',
          'const uniq = new Set([1, 2, 2, 3]);',
          'console.log(uniq.size, [...uniq]);',
          '',
          'const seen = new Set();',
          'seen.add("x").add("y");',
          'console.log(seen.delete("x"), seen.has("x"));',
          '',
          'for (const [k, v] of freq) console.log(k, "=>", v);'
        ].join('\n'),
        expect: "2 2 true\n3 [ 1, 2, 3 ]\ntrue false\na => 2\nb => 1"
      },
      {
        kind: 'prose',
        md: [
          '生成器函数用 `function*` 声明，里面用 `yield` 一个一个吐出值。调用它不会执行函数体，只会拿到一个**迭代器**；`next()` 才往下走一步，`for...of` 会自动一步步走完。',
          '',
          '适合：造无限序列、分段读大文件、把复杂状态机写成顺读的代码。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '生成器',
        code: [
          'function* countdown(n) {',
          '  while (n > 0) {',
          '    yield n;',
          '    n -= 1;',
          '  }',
          '}',
          'console.log([...countdown(3)]);',
          '',
          'const it = countdown(2);',
          'console.log(it.next(), it.next(), it.next());',
          '',
          'function* ids() {',
          '  let i = 0;',
          '  while (true) yield ++i;      // 无限序列也没关系，不会一次算完',
          '}',
          'const gen = ids();',
          'console.log(gen.next().value, gen.next().value, gen.next().value);'
        ].join('\n'),
        expect: '[ 3, 2, 1 ]\n{ value: 2, done: false } { value: 1, done: false } { value: undefined, done: true }\n1 2 3'
      },
      {
        kind: 'prose',
        md: [
          '`JSON.stringify` 把值变成字符串，`JSON.parse` 变回来。数据传输、`localStorage` 存对象都靠它。',
          '',
          '它只认 JSON 支持的类型：`undefined`、函数、`Symbol` 会被丢掉，`Date` 会变成字符串，循环引用直接抛错。对象或数组里**全是**基本类型时，它就是最方便的深拷贝手段。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'JSON',
        code: [
          'const user = { name: "小明", tags: ["a", "b"], age: undefined, hi() {} };',
          'const text = JSON.stringify(user);',
          'console.log(text);',
          'const back = JSON.parse(text);',
          'console.log(back.name, back.tags[1], back.age, typeof back.hi);',
          '',
          'const copy = JSON.parse(JSON.stringify({ deep: { n: 1 } }));',
          'copy.deep.n = 99;',
          'console.log(copy.deep.n);'
        ].join('\n'),
        expect: '{"name":"小明","tags":["a","b"]}\n小明 b undefined undefined\n99'
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`JSON.stringify` 那行输出里没有 `age` 也没有 `hi`——它们被静默丢掉了。用处是「持久化/传数据」，不是万能深拷贝。要深拷贝更推荐 `structuredClone(obj)`（能处理 Date、Map、Set，但处理不了函数）。'
      },
      {
        kind: 'prose',
        md: [
          '正则用来做「模式匹配」。最常用的四件事：',
          '',
          '- `regex.test(s)` 判断有没有，返回布尔。',
          '- `s.match(/\\d+/g)` 取出所有匹配，加 `g` 是全局找。',
          '- `s.replace(/\\s+/g, " ")` 按模式替换。',
          '- `s.split(/,|;/ )` 按多种分隔符切分。',
          '',
          '记住几个元字符就够了：`\\d` 数字、`\\w` 字母数字下划线、`\\s` 空白、`.` 任意字符、`*` 零或多次、`+` 一或多次、`?` 零或一次、`[]` 字符集、`()` 分组、`^`/`$` 开头结尾。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '正则四件事',
        code: [
          'console.log(/^\\d{4}-\\d{2}$/.test("2026-10"));',
          'console.log("a1b22c333".match(/\\d+/g));',
          'console.log("a1b22c333".match(/\\d+/g).map(Number));',
          'console.log("  多余   的 空格 ".replace(/\\s+/g, " ").trim());',
          'console.log("a, b;c".split(/[,;]\\s*/));',
          'console.log("2026-10-06".replace(/(\\d{4})-(\\d{2})-(\\d{2})/, "$3/$2/$1"));'
        ].join('\n'),
        expect: "true\n[ '1', '22', '333' ]\n[ 1, 22, 333 ]\n多余 的 空格\n[ 'a', 'b', 'c' ]\n06/10/2026"
      },
      {
        kind: 'table',
        head: ['元字符', '含义', '例子'],
        rows: [
          ['\\d / \\D', '数字 / 非数字', '/\\d+/ 匹配 123'],
          ['\\w / \\W', '字母数字下划线 / 反之', '/\\w+/ 匹配 abc_1'],
          ['\\s / \\S', '空白 / 非空白', '/\\s+/ 匹配连续空格与换行'],
          ['.', '任意字符（不含换行）', '/a.c/ 匹配 abc'],
          ['* + ?', '零或多次 / 一或多次 / 零或一次', '/ab*/ 匹配 a、ab、abb'],
          ['[] / [^]', '字符集 / 排除', '/[aeiou]/ 元音之一'],
          ['() / $1', '分组 / 反向引用', 'replace 里用 $1 取第一组'],
          ['^ $', '开头 / 结尾', '/^a/ 以 a 开头'],
          ['g / i / m', '全局 / 忽略大小写 / 多行', '/x/gi']
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-1',
        title: '用 Map 数词频',
        task: [
          '补完 `wordFreq(words)`：返回一个 `Map`，键是词，值是该词出现次数。'
        ].join('\n'),
        starter: [
          'function wordFreq(words) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function wordFreq(words) {',
          '  const freq = new Map();',
          '  for (const w of words) {',
          '    freq.set(w, (freq.get(w) || 0) + 1);',
          '  }',
          '  return freq;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { const m = wordFreq(['a', 'b', 'a']); ok(m instanceof Map, '要返回 Map'); eq(m.get('a'), 2); eq(m.get('b'), 1); eq(m.size, 2); })();",
          "eq(wordFreq([]).size, 0);",
          "eq(wordFreq(['x', 'x', 'x']).get('x'), 3);"
        ],
        hints: [
          '`freq.get(w) || 0` 处理「第一次见到这个词」的情况。',
          '用 `freq.set(w, 次数)` 写回，Map 的 size 就是不同词的个数。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-2',
        title: '去重',
        task: [
          '补完 `unique(arr)`：返回去掉重复元素之后的新数组，**保持首次出现的顺序**。',
          '',
          '用 `Set` 写会最短。'
        ].join('\n'),
        starter: [
          'function unique(arr) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function unique(arr) {',
          '  return [...new Set(arr)];',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(unique([1, 1, 2, 3, 3]), [1, 2, 3]);",
          "eq(unique([]), []);",
          "eq(unique(['a', 'b', 'a']), ['a', 'b'], '字符串也按值去重');"
        ],
        hints: [
          '`new Set(arr)` 自动去重，`[...set]` 展开回数组。',
          'Set 用的是 SameValueZero 比较：`NaN` 之间算重复，`{}` 之间不算（因为它们不是同一个对象）。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-3',
        title: '写个倒计时生成器',
        task: [
          '补完生成器 `countdown(n)`：依次 `yield` 出 `n, n-1, ... 1`（n ≤ 0 时什么都不吐）。'
        ].join('\n'),
        starter: [
          'function* countdown(n) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function* countdown(n) {',
          '  while (n > 0) {',
          '    yield n;',
          '    n -= 1;',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq([...countdown(3)], [3, 2, 1]);",
          "eq([...countdown(0)], [], 'n 是 0 时什么都不吐');",
          "(() => { const it = countdown(2); eq(it.next(), { value: 2, done: false }); eq(it.next().value, 1); ok(it.next().done, '走完之后 done 是 true'); })();"
        ],
        hints: [
          '生成器用 `function*` 声明，函数体里用 `yield` 吐值。',
          '别忘了 `n -= 1`，否则会一直吐同一个数（无限序列）。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-4',
        title: '抽出所有数字',
        task: [
          '补完 `extractNumbers(s)`：把字符串里所有连续的整数抽出来，返回**数字**数组。',
          '',
          '`extractNumbers("a1b22c333")` 得到 `[1, 22, 333]`。'
        ].join('\n'),
        starter: [
          'function extractNumbers(s) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function extractNumbers(s) {',
          '  const found = s.match(/\\d+/g);',
          '  return found ? found.map(Number) : [];',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(extractNumbers('a1b22c333'), [1, 22, 333]);",
          "eq(extractNumbers('没有数字'), [], '一个都没匹配到时要返回空数组');",
          "eq(extractNumbers('007 3.5'), [7, 3, 5], '小数点会被当成分隔符');"
        ],
        hints: [
          '`s.match(/\\d+/g)` 匹配不到时返回 `null`，不是空数组，要处理一下。',
          '匹配出来的是字符串，记得 `.map(Number)`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex13-5',
        title: 'JSON 深拷贝',
        task: [
          '补完 `deepCopy(obj)`：返回一份完全独立的副本，改副本不能影响原对象。',
          '',
          '测试数据只含普通对象、数组和基本类型。'
        ].join('\n'),
        starter: [
          'function deepCopy(obj) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function deepCopy(obj) {',
          '  return JSON.parse(JSON.stringify(obj));',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { const src = { a: 1, b: { c: [1, 2] } }; const copy = deepCopy(src); copy.b.c.push(3); eq(src.b.c, [1, 2], '改副本不能影响原对象'); eq(copy.b.c, [1, 2, 3]); })();",
          "eq(deepCopy([1, 2]), [1, 2]);",
          "(() => { const src = { n: 1 }; ok(deepCopy(src) !== src, '要返回新对象，不能是同一个引用'); })();"
        ],
        hints: [
          '一行就够：`JSON.parse(JSON.stringify(obj))`。',
          '用 `{ ...obj }` 只是浅拷贝，内层对象还是共享的，第二条断言会失败。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
