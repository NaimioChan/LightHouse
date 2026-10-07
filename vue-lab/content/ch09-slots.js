/* ch09 — 插槽：默认插槽、具名插槽、作用域插槽，以及「组件只定结构、内容由使用方给」这件事。
 *
 * 内容契约见 docs/01-content-schema.md。写完记得跑：
 *   node tools/verify-content.mjs --chapter ch09
 *   node tools/lib/probe-chapter.mjs ch09
 */
(function (root) {
  (root.VUELAB_CHAPTERS || (root.VUELAB_CHAPTERS = [])).push({
    id: 'ch09',
    title: '第 9 章 · 插槽',
    goal: '能看懂并写出默认插槽、具名插槽、作用域插槽，把组件的结构留下、内容交给使用方。',
    sections: [
      {
        kind: 'prose',
        md: [
          '组件复用到后面会遇到一个矛盾：**结构想复用，内容却每家不一样**。',
          '',
          '一个对话框，外框、圆角、间距都一样，但标题和按钮文字各不相同。',
          '用 props 把这些文字一个个传进去，props 会越来越多：`title`、`okText`、`cancelText`……',
          '每多一种内容就要多一个 prop。',
          '',
          '插槽换个思路：**组件只定结构，内容由使用方给**。',
          '组件在自己想留位置的地方放一个 `<slot>`，使用方写在组件标签中间的东西，就会填到那个位置。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '默认插槽：内容从外面填进来',
        code: [
          '<scr' + 'ipt setup>',
          "import { ref } from 'vue'",
          '',
          'const Panel = {',
          '  template: \'<section class="panel"><h3 class="pt">固定标题</h3><div class="inner"><slot></slot></div></section>\'',
          '}',
          '',
          'const n = ref(0)',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Panel>',
          '    <p class="line">这段内容由使用方给</p>',
          '  </Panel>',
          '  <Panel>',
          '    <button class="btn" @click="n++">点了 {{ n }} 次</button>',
          '  </Panel>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".panel .pt"), "固定标题", "子组件自己的结构")',
          'eq(text(".panel .line"), "这段内容由使用方给", "默认插槽的内容渲染了")',
          'eq(text(".panel .btn"), "点了 0 次", "同一个组件换成了按钮")',
          'click(".panel .btn"); await tick();',
          'eq(text(".panel .btn"), "点了 1 次", "插槽里的事件照样触发")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `<slot>` 放在哪，内容就出现在哪',
          '',
          '`<slot></slot>` 是**出口**。使用方写在组件标签中间的东西，会被放到出口所在的位置。',
          '同一个组件用两次，两次填的内容互不影响。',
          '',
          '出口里可以写后备内容：`<slot>默认文字</slot>`，使用方不给内容时才显示它。',
          '',
          '一个组件里可以有多个具名插槽，但只能有一个没有 `name` 的默认插槽。'
        ].join('\n')
      },
      {
        kind: 'table',
        code: true,
        head: ['插槽', '子组件里的出口', '使用方怎么填'],
        rows: [
          ['默认插槽', '`<slot></slot>`', '直接写在组件标签中间'],
          ['具名插槽', '`<slot name="header"></slot>`', '`<template #header>...</template>`'],
          ['作用域插槽', '`<slot :item="it"></slot>`', '`<template #default="{ item }">...</template>`']
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 具名插槽：一个组件里留几个不同的口子',
          '',
          '对话框常常要「头部一段、内容一段、底部一段」，一个默认插槽不够分。',
          '给出口起名字：`<slot name="header"></slot>`。使用方按名字填：`<template #header>...</template>`。',
          '没写进任何 `<template #名字>` 的普通标签，落进默认插槽。',
          '',
          '`#header` 是 `v-slot:header` 的缩写，两种写法一样。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '具名插槽与后备内容',
        code: [
          '<scr' + 'ipt setup>',
          '',
          'const Dialog = {',
          '  template: \'<div class="dialog"><header class="hd"><slot name="header">默认标题</slot></header><div class="bd"><slot></slot></div><footer class="ft"><slot name="footer"></slot></footer></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Dialog>',
          '    <template #header>',
          '      <h3 class="h">删除确认</h3>',
          '    </template>',
          '    <p class="body">删掉之后就找不回来了</p>',
          '    <template #footer>',
          '      <button class="ok">确定</button>',
          '    </template>',
          '  </Dialog>',
          '  <Dialog>',
          '    <p class="body2">这条只填了默认插槽</p>',
          '  </Dialog>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".dialog .h"), "删除确认", "header 具名插槽渲染了")',
          'eq(text(".dialog .body"), "删掉之后就找不回来了", "默认插槽渲染了")',
          'eq(text(".dialog .ok"), "确定", "footer 具名插槽渲染了")',
          'eq(count(".dialog"), 2, "同一个组件用了两次")',
          'eq($$(".hd")[1].textContent.trim(), "默认标题", "没给 header 时就显示后备内容")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 作用域插槽：数据在子组件手里，画法在使用方手里',
          '',
          '前两种插槽只能把内容送**进**组件。作用域插槽多送一样东西：**子组件内部的数据**。',
          '',
          '子组件在出口上挂属性：`<slot :item="it" :index="i">`。这些属性叫插槽 prop。',
          '使用方用 `#default="{ item, index }"` 把它们接出来，就能在自己的模板里用子组件的数据决定画成什么样。',
          '',
          '常见用法：一个列表组件管数据与循环，每一行长什么样交给使用方。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '作用域插槽：子组件把数据交出来',
        code: [
          '<scr' + 'ipt setup>',
          '',
          'const List = {',
          '  props: [\'items\'],',
          '  template: \'<ul class="list"><li class="row" v-for="(it, i) in items" :key="i"><slot :item="it" :index="i">{{ it }}</slot></li></ul>\'',
          '}',
          '',
          'const fruits = [\'苹果\', \'香蕉\', \'梨\']',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <List :items="fruits">',
          '    <template #default="{ item, index }">',
          '      <span class="cell">{{ index }} - {{ item }}</span>',
          '    </template>',
          '  </List>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".list .row"), 3, "子组件按数据渲染出 3 行")',
          'eq(text(".row:nth-child(1) .cell"), "0 - 苹果", "第一行拿到了子组件给的数据")',
          'eq(text(".row:nth-child(2) .cell"), "1 - 香蕉", "第二行拿到了自己的 item")',
          'eq(text(".row:nth-child(3) .cell"), "2 - 梨", "第三行也一样")'
        ]
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '`#default` 接的就是默认插槽的出口。出口带名字时写成 `#名字="{ ... }"`。接出来的名字要和出口上 `:` 后面的名字一致。'
      },
      {
        kind: 'demo',
        caption: '一次用上多个具名插槽',
        code: [
          '<scr' + 'ipt setup>',
          '',
          'const Layout = {',
          '  template: \'<div class="layout"><header class="top"><slot name="header"></slot></header><main class="mid"><slot></slot></main><footer class="bot"><slot name="footer"></slot></footer></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Layout>',
          '    <template #header>',
          '      <h2 class="ttl">标题区</h2>',
          '    </template>',
          '    <p class="para">内容区</p>',
          '    <template v-slot:footer>',
          '      <small class="cp">底部区</small>',
          '    </template>',
          '  </Layout>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".top .ttl"), "标题区", "#header 填对了")',
          'eq(text(".mid .para"), "内容区", "没包 template 的落进默认插槽")',
          'eq(text(".bot .cp"), "底部区", "v-slot:footer 长写法一样管用")',
          'eq(count(".layout"), 1, "只渲染了一个布局")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-1',
        title: '给卡片留一个默认插槽',
        task: [
          '`Card` 组件想接收一段由外面传进来的内容，但它的模板里还没有出口，内容现在被丢掉了。',
          '',
          '请给 `Card` 的 `template` 加一个默认插槽，位置放在 `.fixed` 那段之后。',
          '',
          '加完之后，`<Card>` 标签中间的那段 `<p class="user">` 应该会显示出来。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          '',
          'const Card = {',
          '  template: \'<div class="card"><p class="fixed">卡片固定内容</p></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Card>',
          '    <p class="user">卡片插槽内容</p>',
          '  </Card>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          '',
          'const Card = {',
          '  template: \'<div class="card"><p class="fixed">卡片固定内容</p><slot></slot></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Card>',
          '    <p class="user">卡片插槽内容</p>',
          '  </Card>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".card .fixed"), "卡片固定内容", "组件自己的内容还在")',
          'has(".card .user", "传进去的内容落进了插槽")',
          'eq(text(".card .user"), "卡片插槽内容", "内容文字没错")'
        ],
        hints: [
          '出口写成 `<slot></slot>`，放在你想让内容出现的位置。',
          '默认插槽不用起名字，直接写 `<slot></slot>`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-2',
        title: '给顶栏加一个具名插槽',
        task: [
          '`Bar` 组件左侧有一段固定的品牌文字，右侧想留一个口子给使用方填。',
          '',
          '使用方已经写了 `<template #header>`，但 `Bar` 的模板里没有对应的出口，那段内容没出来。',
          '',
          '请给 `Bar` 的 `template` 补一个具名插槽：名字叫 `header`，放在 `.brand` 之后。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          '',
          'const Bar = {',
          '  template: \'<div class="bar"><span class="brand">站点</span></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Bar>',
          '    <template #header>',
          '      <span class="who">当前用户：非茗</span>',
          '    </template>',
          '  </Bar>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          '',
          'const Bar = {',
          '  template: \'<div class="bar"><span class="brand">站点</span><slot name="header"></slot></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Bar>',
          '    <template #header>',
          '      <span class="who">当前用户：非茗</span>',
          '    </template>',
          '  </Bar>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".bar .brand"), "站点", "左侧固定内容还在")',
          'has(".who", "具名插槽的内容出现了")',
          'eq(text(".who"), "当前用户：非茗", "内容文字没错")'
        ],
        hints: [
          '出口写成 `<slot name="header"></slot>`，`name` 要和 `<template #header>` 对上。',
          '`#header` 与 `v-slot:header` 是同一个东西。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-3',
        title: '让使用方决定每一行怎么画',
        task: [
          '`Row` 组件负责数据与循环，它已经在出口上写了 `:item="it"`，把每一行的数据交出来。',
          '',
          '但使用方没有接，所以每一行都是空的。请给 `<Row>` 补上插槽内容：',
          '用 `#default="{ item }"` 把数据接出来，渲染成一个 `<span class="val">{{ item }}</span>`。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          '',
          'const Row = {',
          '  props: [\'items\'],',
          '  template: \'<ul class="list"><li class="item" v-for="(it, i) in items" :key="i"><slot :item="it"></slot></li></ul>\'',
          '}',
          '',
          'const items = [\'铅笔\', \'橡皮\']',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Row :items="items" />',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          '',
          'const Row = {',
          '  props: [\'items\'],',
          '  template: \'<ul class="list"><li class="item" v-for="(it, i) in items" :key="i"><slot :item="it"></slot></li></ul>\'',
          '}',
          '',
          'const items = [\'铅笔\', \'橡皮\']',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Row :items="items">',
          '    <template #default="{ item }">',
          '      <span class="val">{{ item }}</span>',
          '    </template>',
          '  </Row>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(count(".item"), 2, "两行都渲染了")',
          'has(".val", "作用域插槽的内容出现了")',
          'eq(text(".item:nth-child(1) .val"), "铅笔", "第一行拿到了 item")',
          'eq(text(".item:nth-child(2) .val"), "橡皮", "第二行拿到了 item")'
        ],
        hints: [
          '接的写法是 `<template #default="{ item }">...</template>`，名字要和出口上的 `:item` 一致。',
          '接出来的 `item` 就是子组件里那个 `it`。'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex09-4',
        title: '把内容分给三个插槽',
        task: [
          '`Layout` 有三个口子：具名 `header`、默认插槽、具名 `footer`。',
          '',
          '现在的使用方把三段内容全裸着写在里面，结果全挤进了默认插槽，头和脚显示的是后备文字。',
          '',
          '请给标题那段套上 `<template #header>`，给版权那段套上 `<template #footer>`；',
          '中间正文不动，让它自然落进默认插槽。'
        ].join('\n'),
        starter: [
          '<scr' + 'ipt setup>',
          '',
          'const Layout = {',
          '  template: \'<div class="layout"><header class="top"><slot name="header">默认头</slot></header><main class="mid"><slot></slot></main><footer class="bot"><slot name="footer">默认脚</slot></footer></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Layout>',
          '    <h1 class="ttl">产品页</h1>',
          '    <p class="body">正文</p>',
          '    <p class="cop">版权 2026</p>',
          '  </Layout>',
          '</template>'
        ].join('\n'),
        solution: [
          '<scr' + 'ipt setup>',
          '',
          'const Layout = {',
          '  template: \'<div class="layout"><header class="top"><slot name="header">默认头</slot></header><main class="mid"><slot></slot></main><footer class="bot"><slot name="footer">默认脚</slot></footer></div>\'',
          '}',
          '</scr' + 'ipt>',
          '',
          '<template>',
          '  <Layout>',
          '    <template #header>',
          '      <h1 class="ttl">产品页</h1>',
          '    </template>',
          '    <p class="body">正文</p>',
          '    <template #footer>',
          '      <p class="cop">版权 2026</p>',
          '    </template>',
          '  </Layout>',
          '</template>'
        ].join('\n'),
        tests: [
          'eq(text(".top"), "产品页", "header 插槽收到了标题")',
          'eq(text(".mid .body"), "正文", "默认插槽收到了正文")',
          'eq(text(".bot"), "版权 2026", "footer 插槽收到了版权")',
          'eq(count(".mid .ttl"), 0, "标题没有落进默认插槽")'
        ],
        hints: [
          '哪段内容归哪个插槽，就用 `<template #名字>` 把它包起来。',
          '没被包起来的普通标签会落进默认插槽。'
        ]
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
