(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch09',
    title: '第 9 章 · 类、原型与 this',
    goal: '用 class 描述一类东西：会写构造函数、继承、getter，也搞得清楚 this 到底指谁。',
    sections: [
      {
        kind: 'prose',
        md: [
          '`class` 是「造对象的模板」：`constructor` 负责初始化实例属性，写在类里的函数都是实例方法。用 `new` 创建实例。',
          '',
          '方法里的 `this` 指向「调用这个方法的那个实例」。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '第一个类',
        code: [
          'class Circle {',
          '  constructor(r) {',
          '    this.r = r;',
          '  }',
          '  area() {',
          '    return Math.PI * this.r ** 2;',
          '  }',
          '  toString() {',
          '    return `半径 ${this.r} 的圆`;',
          '  }',
          '}',
          '',
          'const c = new Circle(2);',
          'console.log(c.toString());',
          'console.log(c.area().toFixed(2));',
          'console.log(c instanceof Circle);'
        ].join('\n'),
        expect: '半径 2 的圆\n12.57\ntrue'
      },
      {
        kind: 'prose',
        md: [
          '`extends` 继承父类，子类构造函数里必须先调用 `super(...)` 才能用 `this`。子类可以覆盖父类的方法，也可以用 `super.method()` 借用父类的实现。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: '继承',
        code: [
          'class Animal {',
          '  constructor(name) { this.name = name; }',
          '  speak() { return `${this.name} 发出声音`; }',
          '}',
          '',
          'class Dog extends Animal {',
          '  constructor(name) {',
          '    super(name);              // 先让父类初始化',
          '    this.kind = "狗";',
          '  }',
          '  speak() {',
          '    return super.speak() + "：汪汪";   // 借用父类实现再加料',
          '  }',
          '}',
          '',
          'const d = new Dog("旺财");',
          'console.log(d.speak());',
          'console.log(d.kind, d.name);',
          'console.log(d instanceof Dog, d instanceof Animal);'
        ].join('\n'),
        expect: '旺财 发出声音：汪汪\n狗 旺财\ntrue true'
      },
      {
        kind: 'prose',
        md: [
          '三个常用附加件：',
          '',
          '- `get` / `set`：像读属性一样调用方法，适合做换算或校验。',
          '- `static`：挂在类上而不是实例上（`Math.max` 就是这种）。',
          '- `#name`：真私有字段，类外面读不到。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'getter、static 与私有字段',
        code: [
          'class Temperature {',
          '  #celsius;',
          '  constructor(c) { this.#celsius = c; }',
          '  get fahrenheit() { return this.#celsius * 9 / 5 + 32; }',
          '  set fahrenheit(f) { this.#celsius = (f - 32) * 5 / 9; }',
          '  static fromKelvin(k) { return new Temperature(k - 273.15); }',
          '}',
          '',
          'const t = new Temperature(0);',
          'console.log(t.fahrenheit);',
          't.fahrenheit = 212;',
          'console.log(t.fahrenheit);',
          'console.log(Temperature.fromKelvin(273.15).fahrenheit);'
        ].join('\n'),
        expect: '32\n212\n32'
      },
      {
        kind: 'prose',
        md: [
          '`this` 的值**由调用方式决定**，不由定义位置决定：',
          '',
          '- `obj.fn()` → `this` 是 `obj`。',
          '- `const f = obj.fn; f()` → `this` 是 `undefined`（严格模式下），于是读属性就报错。',
          '- 箭头函数没有自己的 `this`，它用定义时外层的 `this`。',
          '',
          '把方法当回调传出去时，用 `obj.fn.bind(obj)` 或者干脆写成箭头函数包一层。'
        ].join('\n')
      },
      {
        kind: 'code',
        caption: 'this 看调用方式',
        code: [
          'const user = {',
          '  name: "小明",',
          '  hi() { return `我是 ${this.name}`; },',
          '  owner() { return this === globalThis ? "全局对象" : (this.name || "匿名"); }',
          '};',
          '',
          'console.log(user.hi());',
          'const loose = user.owner;',
          'console.log(loose());                     // 普通调用：this 变成全局对象',
          'console.log(user.owner());                // 方法调用：this 是 user',
          'console.log(user.owner.call({ name: "小红" }));'
        ].join('\n'),
        expect: '我是 小明\n全局对象\n小明\n小红'
      },
      {
        kind: 'table',
        head: ['写法', '作用', '要点'],
        rows: [
          ['constructor(...)', '初始化实例', '用 new 时自动执行'],
          ['method()', '实例方法', 'this 指向实例'],
          ['get x() / set x(v)', '当属性访问', '读 t.fahrenheit 不用加括号'],
          ['static f()', '类方法', '类名.方法()，没有 this 实例'],
          ['#field', '私有字段', '类外访问会报错'],
          ['extends / super', '继承', '子类构造函数里 super 必须最先调用']
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`instanceof` 顺着原型链一路往上找，所以 `new Dog()` 同时是 `Dog` 和 `Animal` 的实例。`class` 只是语法糖，底层还是原型，只是写起来清楚得多。'
      },
      {
        kind: 'exercise',
        id: 'ex09-1',
        title: '矩形类',
        task: [
          '补完 `Rectangle` 类：构造函数接收宽 `w` 和高 `h`，方法 `area()` 返回面积，`perimeter()` 返回周长。'
        ].join('\n'),
        starter: [
          'class Rectangle {',
          '  constructor(w, h) {',
          '    // 你的代码',
          '  }',
          '  area() {',
          '    // 你的代码',
          '  }',
          '  perimeter() {',
          '    // 你的代码',
          '  }',
          '}',
          ''
        ].join('\n'),
        solution: [
          'class Rectangle {',
          '  constructor(w, h) {',
          '    this.w = w;',
          '    this.h = h;',
          '  }',
          '  area() {',
          '    return this.w * this.h;',
          '  }',
          '  perimeter() {',
          '    return (this.w + this.h) * 2;',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(new Rectangle(3, 4).area(), 12);",
          "eq(new Rectangle(3, 4).perimeter(), 14);",
          "eq(new Rectangle(5, 5).area(), 25);",
          "ok(new Rectangle(1, 2) instanceof Rectangle, '要用 new 创建实例');"
        ],
        hints: [
          '属性和方法里都要通过 `this.` 访问：`this.w`。',
          '两个实例互不干扰，因为属性挂在各自的实例上。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-2',
        title: '继承与 super',
        task: [
          '下面的 `Animal` 已经写好。补完 `Dog`：',
          '',
          '- `constructor(name)` 里调用父类构造函数，并把 `"汪汪"` 存进 `this.sound`；',
          '- 覆盖 `speak()`，返回 `名字 说 汪汪`（用 this.name 和 this.sound 拼）。'
        ].join('\n'),
        starter: [
          'class Animal {',
          '  constructor(name) { this.name = name; }',
          '  speak() { return `${this.name} 发出声音`; }',
          '}',
          '',
          'class Dog extends Animal {',
          '  // 你的代码',
          '}',
          ''
        ].join('\n'),
        solution: [
          'class Animal {',
          '  constructor(name) { this.name = name; }',
          '  speak() { return `${this.name} 发出声音`; }',
          '}',
          '',
          'class Dog extends Animal {',
          '  constructor(name) {',
          '    super(name);',
          '    this.sound = "汪汪";',
          '  }',
          '  speak() {',
          '    return `${this.name} 说 ${this.sound}`;',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(new Dog('旺财').speak(), '旺财 说 汪汪');",
          "eq(new Dog('旺财').name, '旺财', 'name 应该由父类构造函数设置');",
          "ok(new Dog('a') instanceof Animal, 'Dog 的实例也是 Animal');"
        ],
        hints: [
          '子类构造函数第一句必须是 `super(name)`，之后才能用 this。',
          '返回的字符串里用模板字符串拼 `${this.name} 说 ${this.sound}`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-3',
        title: '写个栈',
        task: [
          '补完 `Stack` 类：`push(v)` 压入，`pop()` 弹出并返回最后一个元素（空栈返回 `undefined`），`size` 用 getter 返回元素个数。'
        ].join('\n'),
        starter: [
          'class Stack {',
          '  constructor() {',
          '    this.items = [];',
          '  }',
          '  push(v) {',
          '    // 你的代码',
          '  }',
          '  pop() {',
          '    // 你的代码',
          '  }',
          '  get size() {',
          '    // 你的代码',
          '  }',
          '}',
          ''
        ].join('\n'),
        solution: [
          'class Stack {',
          '  constructor() {',
          '    this.items = [];',
          '  }',
          '  push(v) {',
          '    this.items.push(v);',
          '  }',
          '  pop() {',
          '    return this.items.pop();',
          '  }',
          '  get size() {',
          '    return this.items.length;',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "(() => { const s = new Stack(); s.push(1); s.push(2); eq(s.size, 2); eq(s.pop(), 2, '后进先出'); eq(s.size, 1); })();",
          "eq(new Stack().pop(), undefined, '空栈弹出是 undefined，不要抛错');",
          "(() => { const s = new Stack(); s.push('a'); eq(s.pop(), 'a'); eq(s.pop(), undefined); })();"
        ],
        hints: [
          '数组本身就是栈：`push` 和 `pop` 正好是尾进尾出。',
          '`size` 是 getter，用的时候不加括号：`s.size`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-4',
        title: '温度换算类',
        task: [
          '补完 `Temperature`：构造函数接收摄氏度存入私有字段，`fahrenheit` 用 getter 返回华氏温度，也用 setter 支持反向写入。'
        ].join('\n'),
        starter: [
          'class Temperature {',
          '  #celsius;',
          '  constructor(c) {',
          '    // 你的代码',
          '  }',
          '  get fahrenheit() {',
          '    // 你的代码',
          '  }',
          '  set fahrenheit(f) {',
          '    // 你的代码',
          '  }',
          '  get celsius() {',
          '    return this.#celsius;',
          '  }',
          '}',
          ''
        ].join('\n'),
        solution: [
          'class Temperature {',
          '  #celsius;',
          '  constructor(c) {',
          '    this.#celsius = c;',
          '  }',
          '  get fahrenheit() {',
          '    return this.#celsius * 9 / 5 + 32;',
          '  }',
          '  set fahrenheit(f) {',
          '    this.#celsius = (f - 32) * 5 / 9;',
          '  }',
          '  get celsius() {',
          '    return this.#celsius;',
          '  }',
          '}',
          ''
        ].join('\n'),
        tests: [
          "eq(new Temperature(0).fahrenheit, 32, 'getter 用的时候不加括号');",
          "eq(new Temperature(100).fahrenheit, 212);",
          "(() => { const t = new Temperature(0); t.fahrenheit = 212; eq(t.celsius, 100, 'setter 要能反向换算'); })();",
          "(() => { const t = new Temperature(25); eq(Math.round(t.fahrenheit), 77); })();"
        ],
        hints: [
          '私有字段只能在类里面用 `this.#celsius` 访问。',
          '两个公式互为逆运算：`C * 9 / 5 + 32` 和 `(F - 32) * 5 / 9`。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
