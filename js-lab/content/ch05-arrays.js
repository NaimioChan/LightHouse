(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch05',
    title: '第 5 章 · 数组方法',
    goal: '别再手写循环处理数组：map / filter / reduce 三件套用熟，知道每个方法改不改原数组。',
    sections: [
      {
        kind: 'prose',
        md: [
          '数组是一串有序的值，下标从 `0` 开始，`arr.length` 是长度，最后一个元素是 `arr[arr.length - 1]`（`arr.at(-1)` 更短）。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '增删与切片',
        code: [
          'const a = [1, 2, 3];',
          'a.push(4);                       // 尾部加，改动原数组',
          'console.log(a, a.length);',
          'console.log(a.slice(1, 3));      // 取下标 1 到 2，不改原数组',
          'console.log(a.at(-1));           // 最后一个元素',
          'console.log(a.splice(0, 2));     // 从下标 0 删 2 个：splice 改原数组并返回被删的',
          'console.log(a);'
        ].join('\n'),
        expect: '[ 1, 2, 3, 4 ] 4\n[ 2, 3 ]\n4\n[ 1, 2 ]\n[ 3, 4 ]'
      },
      {
        kind: 'prose',
        md: [
          '处理数组的主线是三个方法，它们都接收一个回调函数：',
          '',
          '- `map(fn)`：每个元素都换成一个新值，返回**等长**的新数组。',
          '- `filter(fn)`：留下回调返回真值的元素，返回**变短**的新数组。',
          '- `reduce(fn, 初值)`：把整个数组压成一个值（求和、计数、转对象都靠它）。',
          '',
          '三者都不改原数组。改原数组的是 `push` / `pop` / `splice` / `sort` / `reverse`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'map 与 filter',
        code: [
          'const nums = [1, 2, 3, 4, 5];',
          'console.log(nums.map(n => n * n));',
          'console.log(nums.filter(n => n % 2 === 1));',
          'console.log(nums);                        // 原数组没动',
          'console.log(nums.map((n, i) => `${i}:${n}`).join(" "));'
        ].join('\n'),
        expect: '[ 1, 4, 9, 16, 25 ]\n[ 1, 3, 5 ]\n[ 1, 2, 3, 4, 5 ]\n0:1 1:2 2:3 3:4 4:5'
      },
      {
        kind: 'code',
        caption: 'reduce：三个典型用法',
        code: [
          'const nums = [3, 1, 4, 1, 5];',
          'console.log(nums.reduce((sum, n) => sum + n, 0));          // 求和',
          'console.log(nums.reduce((max, n) => (n > max ? n : max))); // 求最大，没给初值就用第一个元素',
          '',
          'const words = ["a", "b", "a"];',
          'const count = words.reduce((acc, w) => {',
          '  acc[w] = (acc[w] || 0) + 1;',
          '  return acc;',
          '}, {});',
          'console.log(count);'
        ].join('\n'),
        expect: '14\n5\n{ a: 2, b: 1 }'
      },
      {
        kind: 'table',
        head: ['方法', '返回', '改动原数组吗'],
        rows: [
          ['map', '等长新数组', '否'],
          ['filter', '筛选后的新数组', '否'],
          ['reduce', '一个值', '否'],
          ['find / findIndex', '第一个满足的元素 / 下标（没有则 undefined / -1）', '否'],
          ['some / every', '布尔：有一个满足 / 全部满足', '否'],
          ['includes / indexOf', '布尔 / 下标', '否'],
          ['sort / reverse', '排好序的原数组', '是'],
          ['push / pop / shift / unshift', '新长度 / 被删的元素', '是'],
          ['splice', '被删元素组成的数组', '是']
        ]
      },
      {
        kind: 'code',
        caption: '查找与判定',
        code: [
          'const nums = [1, 2, 3, 4, 5];',
          'console.log(nums.find(n => n > 3), nums.findIndex(n => n > 3));',
          'console.log(nums.some(n => n > 4), nums.every(n => n > 0));',
          'console.log(nums.includes(3), nums.indexOf(9));'
        ].join('\n'),
        expect: '4 3\ntrue true\ntrue -1'
      },
      {
        kind: 'prose',
        md: [
          '`sort` 有两个坑：它**默认按字符串比**，所以 `[10, 9, 100]` 排出来是 `10, 100, 9`；它还会**直接改原数组**。数字排序必须传比较函数 `(a, b) => a - b`。',
          '',
          '想保住原数组，先 `slice()` 拷一份，或者用新的 `toSorted()`。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'sort 的坑',
        code: [
          'const nums = [10, 9, 100, 1];',
          'console.log(nums.slice().sort());                    // 默认按字符串',
          'console.log(nums.slice().sort((a, b) => a - b));      // 数字升序',
          'console.log(nums.toSorted((a, b) => b - a));          // 降序，且不改原数组',
          'console.log(nums);'
        ].join('\n'),
        expect: '[ 1, 10, 100, 9 ]\n[ 1, 9, 10, 100 ]\n[ 100, 10, 9, 1 ]\n[ 10, 9, 100, 1 ]'
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '判断「要 map 还是 filter」的土办法：元素个数会不会变？不会变用 `map`，会变用 `filter`，最后要变成一个值就用 `reduce`。'
      },
      {
        kind: 'exercise',
        id: 'ex05-1',
        title: '每个数翻倍',
        task: [
          '补完 `doubleAll(arr)`，返回每个元素乘以 2 之后的新数组。',
          '',
          '要求用 `map`，不要用循环。'
        ].join('\n'),
        starter: [
          'function doubleAll(arr) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function doubleAll(arr) {',
          '  return arr.map(n => n * 2);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(doubleAll([1, 2, 3]), [2, 4, 6]);",
          "eq(doubleAll([]), []);",
          "(() => { const src = [1, 2]; doubleAll(src); eq(src, [1, 2], '不能改原数组'); })();"
        ],
        hints: [
          '`arr.map(n => n * 2)` 一行就是答案。',
          '测试第三条会检查原数组没被改动。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-2',
        title: '只留偶数',
        task: [
          '补完 `evensOnly(arr)`，返回只包含偶数的数组（保持原顺序）。',
          '',
          '要求用 `filter`。'
        ].join('\n'),
        starter: [
          'function evensOnly(arr) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function evensOnly(arr) {',
          '  return arr.filter(n => n % 2 === 0);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(evensOnly([1, 2, 3, 4]), [2, 4]);",
          "eq(evensOnly([1, 3, 5]), []);",
          "eq(evensOnly([-2, 0, 7]), [-2, 0], '0 和负数也要考虑取余的结果');"
        ],
        hints: [
          '偶数就是 `n % 2 === 0`。',
          '负数取余在 JS 里会得到负数（-3 % 2 是 -1），但偶数判断不受影响。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-3',
        title: '购物车总价',
        task: [
          '补完 `totalPrice(cart)`。`cart` 形如 `[{ price: 10, qty: 2 }, ...]`，返回总价（每项的 price × qty 之和）。',
          '',
          '空购物车返回 `0`。要求用 `reduce`。'
        ].join('\n'),
        starter: [
          'function totalPrice(cart) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function totalPrice(cart) {',
          '  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(totalPrice([]), 0, '空数组要返回 0，所以初值必须给 0');",
          "eq(totalPrice([{ price: 10, qty: 2 }]), 20);",
          "eq(totalPrice([{ price: 10, qty: 2 }, { price: 5, qty: 3 }]), 35);"
        ],
        hints: [
          '初值写成 `0`：`cart.reduce((sum, item) => ..., 0)`。',
          '每项的贡献是 `item.price * item.qty`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-4',
        title: '谁分最高',
        task: [
          '补完 `topStudent(students)`。`students` 形如 `[{ name: "小明", score: 90 }, ...]`，返回分数最高的那个人的名字。',
          '',
          '分数可以为负；数组一定不为空。'
        ].join('\n'),
        starter: [
          'function topStudent(students) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function topStudent(students) {',
          '  return students.reduce((best, s) => (s.score > best.score ? s : best)).name;',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(topStudent([{ name: 'a', score: 90 }, { name: 'b', score: 95 }]), 'b');",
          "eq(topStudent([{ name: 'a', score: -5 }, { name: 'b', score: -9 }]), 'a', '分数是负数时不能把初始值当 0 比');",
          "eq(topStudent([{ name: 'only', score: 0 }]), 'only');"
        ],
        hints: [
          '用 `reduce` 把「当前最高分的那个人」一路带下去：不给初值时，第一个元素就是起点。',
          '别写 `score > 0` 当初始条件，分数可以是负的。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex05-5',
        title: '按年龄排序且不改原数组',
        task: [
          '补完 `sortByAge(people)`。`people` 形如 `[{ name: "a", age: 31 }, ...]`，返回按年龄**升序**排好的**新**数组，原数组必须保持不变。'
        ].join('\n'),
        starter: [
          'function sortByAge(people) {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'function sortByAge(people) {',
          '  return people.slice().sort((a, b) => a.age - b.age);',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { const src = [{ name: 'a', age: 31 }, { name: 'b', age: 24 }]; const out = sortByAge(src); eq(out.map(p => p.name), ['b', 'a']); eq(src.map(p => p.name), ['a', 'b'], '原数组的顺序不能变'); })();",
          "eq(sortByAge([]), []);",
          "(() => { const src = [{ name: 'x', age: 5 }, { name: 'y', age: 5 }]; eq(sortByAge(src).length, 2); })();"
        ],
        hints: [
          '`sort` 会改原数组，先复制一份：`people.slice()` 或 `[...people]`。',
          '比较函数用 `(a, b) => a.age - b.age`——返回负数表示 a 排在前面。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
