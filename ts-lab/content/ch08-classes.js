/* 第 8 章 · 类。内容契约见 docs/01-content-schema.md。 */
(function (root) {
  (root.TSLAB_CHAPTERS || (root.TSLAB_CHAPTERS = [])).push({
    id: 'ch08',
    title: '第 8 章 · 类',
    goal: '用类把状态和行为封在一起，让编译器替你管住字段初始化、可见性和继承的约定。',
    sections: [
      { kind: 'prose', md: [
        '类把数据和对数据的操作放在一起。JavaScript 本来就有 `class`，TypeScript 在它上面加了三件**编译期**的事：',
        '给字段和方法写类型、用修饰符限定谁能访问、检查字段有没有被初始化。',
        '',
        '运行时的类还是那个类：类型注解、`private`、`readonly` 编译后都会消失，留下的只有真正的值。',
        '`#` 字段是唯一的例外。',
        '',
        '## 字段先声明，再在构造函数里初始化',
        '写在类体里的字段声明带类型。开了 `strictPropertyInitialization`（`strict` 默认带着它）之后，',
        '构造函数跑完，每个非可选字段都必须有值，否则编译器报 `TS2564`。'
      ].join('\n') },

      { kind: 'demo', caption: '构造函数里把字段都赋上，类才站得住', code: [
        'class Box {',
        '  size: number;',
        '  label: string;',
        '',
        '  constructor(size: number, label: string) {',
        '    this.size = size;',
        '    this.label = label;',
        '  }',
        '}',
        '',
        'const b = new Box(3, \'x\');'
      ].join('\n'), checks: [
        'eqType(\'b.size\', \'number\', \'size 的类型\')',
        'eqType(\'b.label\', \'string\', \'label 的类型\')',
        'eq(memberNames(\'b\'), [\'label\', \'size\'], \'实例上的字段名\')',
        'noErrors()'
      ] },

      { kind: 'prose', md: [
        '## 可见性修饰符',
        '`public` / `private` / `protected` 决定成员能从哪儿访问，不写就是 `public`。',
        '这些限定只在编译期成立，改不了运行时的行为——绕开类型系统照样能读到你标了 `private` 的字段。',
        '`readonly` 也是编译期的：它管的是「别重新赋值」，字段本身还是普通属性。'
      ].join('\n') },

      { kind: 'table', head: ['写法', '谁能访问', '编译后还剩吗'], rows: [
        ['`public x`', '任何地方（不写就是它）', '不剩，和不写修饰符一样'],
        ['`private x`', '只在类内部', '不剩，外部照样能读到'],
        ['`protected x`', '类内部与子类', '不剩'],
        ['`readonly x`', '能读不能写，构造函数里除外', '不剩'],
        ['`#x`', '只在类内部，子类也不行', '**在**，是真私有字段'],
        ['`static x`', '挂在类本身，不在实例上', '在']
      ] },

      { kind: 'demo', caption: '声明了字段却没在构造函数里赋值', code: [
        'class Bad {',
        '  count: number;',
        '}'
      ].join('\n'), checks: [
        'hasError(2564, \'未初始化的字段\')',
        'errorAt(2, 2564)'
      ] },

      { kind: 'prose', md: [
        '`TS2564` 的意思是「字段有类型、但没有初始值，构造函数里也没给它赋上」。三条路可以修：',
        '',
        '- 在声明处给个初始值：`count = 0;`',
        '- 在构造函数里赋值：`this.count = n;`',
        '- 用参数属性：`constructor(private count: number) {}`',
        '',
        '如果这个字段本来就允许先空着，可以写成可选（`count?: number`）或用确定赋值断言 `count!: number`——',
        '断言是你向编译器保证「运行到用的时候它一定有值」，编译器就不再替你检查。'
      ].join('\n') },

      { kind: 'note', tone: 'tip', md: '构造函数的参数前面加上 `public` / `private` / `protected` / `readonly`，就同时声明了字段并完成赋值，这叫作**参数属性**。上一段那个报错用一行就能消掉。' },

      { kind: 'demo', caption: '参数属性把声明和赋值合成一步', code: [
        'class Point {',
        '  constructor(public x: number, private label: string) {}',
        '',
        '  describe() {',
        '    return this.label + \':\' + this.x;',
        '  }',
        '}',
        '',
        'const p = new Point(1, \'p1\');',
        'p.describe();',
        'p.label;'
      ].join('\n'), checks: [
        'eqType(\'p.x\', \'number\', \'参数属性 x 的类型\')',
        'errorAt(11, 2341, \'类外访问 private 成员\')'
      ] },

      { kind: 'prose', md: [
        '## 访问器：get 与 set',
        '在方法名前面写 `get` 或 `set`，就把一个属性接到函数上。读 `t.value` 会走 `get`，',
        '写 `t.value = x` 会走 `set`。好处是取值和赋值可以带上自己的逻辑，外部看起来还是一次普通读写。',
        '',
        '`get` 的返回类型决定这个属性读出来的类型，`set` 参数的类型决定能写进去什么。',
        '只写 `get` 就是只读属性，只写 `set` 在不能读的地方用。'
      ].join('\n') },

      { kind: 'demo', caption: 'setter 夹住越界的值', code: [
        'class Temp {',
        '  private celsius = 0;',
        '',
        '  get value() {',
        '    return this.celsius;',
        '  }',
        '',
        '  set value(c: number) {',
        '    this.celsius = c < 0 ? 0 : c;',
        '  }',
        '}',
        '',
        'const t = new Temp();',
        't.value = -5;',
        'console.log(t.value);'
      ].join('\n'), run: true, checks: [
        'eqType(\'t.value\', \'number\', \'访问器读出来的类型\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'0\'], \'负值被夹成了 0\')'
      ] },

      { kind: 'prose', md: [
        '## 继承：extends、super、抽象类',
        '`class Dog extends Animal` 让 `Dog` 拿到 `Animal` 的字段和方法，`super(...)` 负责调用父类的构造函数。',
        '子类重写方法时，签名要和父类兼容。',
        '',
        '父类用 `abstract` 修饰、方法前也写 `abstract`，就是**抽象方法**：父类只声明它存在，不给实现，',
        '子类必须补上。抽象类不能 `new`，它只用来说明「子类都长这样」。'
      ].join('\n') },

      { kind: 'demo', caption: '抽象方法逼子类把 area 写出来', code: [
        'abstract class Shape {',
        '  constructor(public name: string) {}',
        '',
        '  abstract area(): number;',
        '',
        '  describe() {',
        '    return this.name + \' area=\' + this.area();',
        '  }',
        '}',
        '',
        'class Square extends Shape {',
        '  constructor(public side: number) {',
        '    super(\'square\');',
        '  }',
        '',
        '  area() {',
        '    return this.side * this.side;',
        '  }',
        '}',
        '',
        'const s = new Square(4);',
        'console.log(s.describe());'
      ].join('\n'), run: true, checks: [
        'eqType(\'s.side\', \'number\', \'子类自己的字段\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'square area=16\'], \'describe 拼出来的结果\')'
      ] },

      { kind: 'prose', md: [
        '`implements` 管的是另一件事：它要求这个类的实例**符合某个接口**，少一个成员、签名对不上都不行。',
        '`extends` 是继承父类的实现，`implements` 只是签一份契约——这是它们的区别。',
        '',
        '## static 与 `#` 私有字段',
        '`static` 成员挂在类本身上，用 `类名.成员` 访问，不在实例上。',
        '`#` 开头的字段是**语法级**的私有：它不是 `private` 那种编译期约定，运行时真的拦得住，',
        '类外写 `obj.#x` 直接就是编译错误。'
      ].join('\n') },

      { kind: 'demo', caption: 'static 记总数，`#` 锁住内部状态', code: [
        'class Counter {',
        '  static total = 0;',
        '  #n = 0;',
        '',
        '  inc() {',
        '    this.#n += 1;',
        '    Counter.total += 1;',
        '    return this.#n;',
        '  }',
        '}',
        '',
        'const c = new Counter();',
        'console.log(c.inc());',
        'console.log(c.inc());',
        'console.log(Counter.total);',
        '',
        'const total: number = Counter.total;'
      ].join('\n'), run: true, checks: [
        'eqType(\'total\', \'number\', \'static 字段读出来是 number\')',
        'noErrors()',
        'await run();',
        'eqLogs([\'1\', \'2\', \'2\'], \'实例各自计数，类上累计总数\')'
      ] },

      { kind: 'exercise', id: 'ex08-1', title: '把字段收成 private', task: [
        '`balance` 现在谁都能读能改，把它收成**类内**才能碰的字段：从外面直接读 `acct.balance` 应该报错，',
        '而 `deposit` 方法正常可用。',
        '',
        '要求：`acct.balance` 这一行产生 `TS2341`；`deposit` 那行不报错；字段仍有初始值，不该出现 `TS2564`。'
      ].join('\n'), starter: [
        'class Account {',
        '  balance = 0;',
        '',
        '  deposit(n: number) {',
        '    this.balance += n;',
        '  }',
        '}',
        '',
        'const acct = new Account();',
        'acct.deposit(10);',
        'console.log(acct.balance);'
      ].join('\n'), solution: [
        'class Account {',
        '  private balance = 0;',
        '',
        '  deposit(n: number) {',
        '    this.balance += n;',
        '  }',
        '}',
        '',
        'const acct = new Account();',
        'acct.deposit(10);',
        'acct.balance;'
      ].join('\n'), tests: [
        'errorAt(11, 2341, \'类外读 private 字段要报错\')',
        'noErrorAt(10, \'deposit 在类外可以调用\')',
        'notError(2564, \'balance 有初始值，不该报未初始化\')'
      ], hints: [
        '给字段加可见性修饰符，写在字段名前面：`private balance = 0;`。',
        '`private` 是编译期的检查，类外的访问（包括 `console.log` 里那次）都会报 `TS2341`。'
      ] },

      { kind: 'exercise', id: 'ex08-2', title: '用参数属性简化构造', task: [
        '`User` 的 `name` 声明了却没在构造函数里赋值，编译不过。用**参数属性**把 `id` 和 `name` 的',
        '声明与赋值合成一步，构造函数体要留空。',
        '',
        '要求：`u.id` 是 `number`、`u.name` 是 `string`，整段代码没有类型错误。'
      ].join('\n'), starter: [
        'class User {',
        '  id: number;',
        '  name: string;',
        '',
        '  constructor(id: number, name: string) {',
        '    this.id = id;',
        '  }',
        '}',
        '',
        'const u = new User(1, \'ada\');'
      ].join('\n'), solution: [
        'class User {',
        '  constructor(public id: number, public name: string) {}',
        '}',
        '',
        'const u = new User(1, \'ada\');'
      ].join('\n'), tests: [
        'eqType(\'u.id\', \'number\', \'参数属性 id 的类型\')',
        'eqType(\'u.name\', \'string\', \'参数属性 name 的类型\')',
        'noErrors(\'参数属性让字段自动初始化\')'
      ], hints: [
        '在构造函数参数的**前面**加 `public`（或 `private` / `readonly`），这个参数就变成字段。',
        '`constructor(public id: number, public name: string) {}`——类体里不用再写 `id`、`name` 的声明。'
      ] },

      { kind: 'exercise', id: 'ex08-3', title: '实现一个接口', task: [
        '`Robot` 声明了 `implements Greeter`，但 `greet` 返回的不是字符串，接口没被满足。把它改对。',
        '',
        '要求：`r.name` 是 `string`，`r.greet` 的类型是 `() => string`，代码没有类型错误。'
      ].join('\n'), starter: [
        'interface Greeter {',
        '  name: string;',
        '  greet(): string;',
        '}',
        '',
        'class Robot implements Greeter {',
        '  name = \'r2\';',
        '',
        '  greet() {',
        '    return this.name.length;',
        '  }',
        '}',
        '',
        'const r = new Robot();'
      ].join('\n'), solution: [
        'interface Greeter {',
        '  name: string;',
        '  greet(): string;',
        '}',
        '',
        'class Robot implements Greeter {',
        '  name = \'r2\';',
        '',
        '  greet() {',
        '    return \'hi \' + this.name;',
        '  }',
        '}',
        '',
        'const r = new Robot();'
      ].join('\n'), tests: [
        'eqType(\'r.name\', \'string\', \'接口要求的 name\')',
        'eqType(\'r.greet\', \'() => string\', \'接口要求的 greet\')',
        'noErrors(\'类要真的满足接口\')'
      ], hints: [
        '接口里写的是 `greet(): string`，类的实现返回类型也必须能赋给 `string`。',
        '`this.name.length` 是 `number`，换成拼字符串就对了，比如 `\'hi \' + this.name`。'
      ] },

      { kind: 'exercise', id: 'ex08-4', title: '用 readonly 锁住 id', task: [
        '`Ticket.id` 一旦构造出来就不该再改。给它加上 `readonly`，让**构造函数之外**的赋值报 `TS2540`。',
        '',
        '要求：`tk.id` 是 `number`；`tk.id = 2;` 那一行报 `TS2540`；构造函数里的赋值仍合法（第 5 行不报错）。'
      ].join('\n'), starter: [
        'class Ticket {',
        '  id: number;',
        '',
        '  constructor(id: number) {',
        '    this.id = id;',
        '  }',
        '}',
        '',
        'const tk = new Ticket(1);',
        'tk.id = 2;'
      ].join('\n'), solution: [
        'class Ticket {',
        '  readonly id: number;',
        '',
        '  constructor(id: number) {',
        '    this.id = id;',
        '  }',
        '}',
        '',
        'const tk = new Ticket(1);',
        'tk.id = 2;'
      ].join('\n'), tests: [
        'eqType(\'tk.id\', \'number\', \'id 的类型\')',
        'hasError(2540, \'readonly 字段在构造之外不能赋值\')',
        'noErrorAt(5, \'构造函数里可以给 readonly 字段赋值\')'
      ], hints: [
        '`readonly` 写在字段名前：`readonly id: number;`。',
        '`readonly` 只在构造函数里允许赋值，类外或别的方法里再写 `this.id = …` 都是 `TS2540`。'
      ] },

      { kind: 'exercise', id: 'ex08-5', title: '把基类改成抽象类', task: [
        '`Shape.area` 现在给了一个没意义的 `0`，子类忘了重写也不会被发现。把 `Shape` 变成**抽象类**、',
        '`area` 变成抽象方法，由 `Circle` 给出真正的实现。',
        '',
        '要求：`c.area` 的类型是 `() => number`；`new Shape();` 那一行报 `TS2511`（抽象类不能实例化）；',
        '`Shape` 这个名字在代码里存在。'
      ].join('\n'), starter: [
        'class Shape {',
        '  area() {',
        '    return 0;',
        '  }',
        '}',
        '',
        'class Circle extends Shape {',
        '  constructor(public r: number) {',
        '    super();',
        '  }',
        '}',
        '',
        'const c = new Circle(2);',
        'new Shape();'
      ].join('\n'), solution: [
        'abstract class Shape {',
        '  abstract area(): number;',
        '}',
        '',
        'class Circle extends Shape {',
        '  constructor(public r: number) {',
        '    super();',
        '  }',
        '',
        '  area() {',
        '    return 3 * this.r * this.r;',
        '  }',
        '}',
        '',
        'const c = new Circle(2);',
        'new Shape();'
      ].join('\n'), tests: [
        'exists(\'Shape\', \'Shape 还在\')',
        'eqType(\'c.area\', \'() => number\', \'子类实现了 area\')',
        'hasError(2511, \'抽象类不能实例化\')'
      ], hints: [
        '类名前加 `abstract`，抽象方法也写 `abstract` 并且**不带方法体**：`abstract area(): number;`。',
        '继承抽象类的子类必须把抽象方法补齐，否则 `Circle` 自己也会被要求变成抽象类。'
      ] },

      { kind: 'prose', md: [
        '## 这一章要留住的东西',
        '字段声明负责类型，构造函数负责初始化，两者对不上就是 `TS2564`；',
        '`public` / `private` / `protected` / `readonly` 都是编译期的约定，只有 `#` 在运行时也拦得住；',
        '构造参数属性省掉一批「先声明再赋值」；访问器让读写走同一段逻辑；',
        '`extends` / `super` 传实现，`implements` 认契约，`abstract` 逼子类把方法补完。'
      ].join('\n') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
