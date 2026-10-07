# 内容契约 v1

`content/*.js` 里的一切都必须符合本文档。改这里 = 同时改 `tools/verify-content.mjs` 和 `assets/js/render.js`。

## 章节文件

每个文件一个章节，classic script，UMD 尾巴挂到全局注册表：

```js
(function (root) {
  (root.JSLAB_CHAPTERS || (root.JSLAB_CHAPTERS = [])).push({
    id: 'ch01',
    title: '第 1 章 · 值、变量与类型',
    goal: '把值存进变量、认全基本类型、用模板字符串拼出可读的文本。',
    sections: [ /* 见下 */ ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

章节字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | `chNN`，全局唯一，决定排序 |
| `title` | string | ✓ | 目录与页首标题 |
| `goal` | string | ✓ | 一句话：学完能做什么 |
| `sections` | Section[] | ✓ | 顺序即阅读顺序 |

## Section

四种 `kind`。

### `prose` — 讲解段落

```js
{ kind: 'prose', md: '用 `let` 声明可以改的变量。\n\n段落之间空一行。' }
```

`md` 支持的子集（`assets/js/render.js` 里的 mini-markdown，仅此而已）：
`## 小标题`、段落、`- 无序列表`、`1. 有序列表`、行内 `` `code` ``、`**粗体**`、`*斜体*`。
不支持表格、图片、链接、嵌套列表。需要表格用 `kind: 'table'`。

### `code` — 可运行示例

```js
{
  kind: 'code',
  code: 'const n = 2;\nconsole.log(n * 3);',
  expect: '6',            // 真实输出，逐字比对；可省略（省略则只校验不抛错）
  caption: '一行也照样跑'  // 可选，示例上方的小标题
}
```

- 站点上每个示例都有「运行」按钮，输出进同一个沙箱控制台。
- `expect` 由 `tools/verify-content.mjs` 在 node 里执行并与实际控制台输出比对（两边都 trim），不一致直接报错。
- 示例代码不许引用练习里的变量，必须自包含。
- 示例里用 `setTimeout` 排的异步输出会被等（安静 40ms 后收工，最多等 1.5 秒），所以延时 ≤ 1 秒的异步示例也能正常校验。
- `needsDom: true`：这段示例要用到 `document`，node 侧跳过执行校验（浏览器自测仍会跑）。

### `table` — 对照表

```js
{ kind: 'table', head: ['写法', '结果'], rows: [['"1" + 1', '"11"'], ['1 + "1"', '"11"']] }
```

单元格是纯文本（会转义，不走 markdown）。可用 `code: true` 让整张表用等宽字体。

### `note` — 提示 / 警告

```js
{ kind: 'note', tone: 'tip', md: '短句。' }     // tone: tip | warn
```

### `exercise` — 练习

```js
{
  kind: 'exercise',
  id: 'ex01-2',                 // 全局唯一
  title: '摄氏转华氏',
  task: '实现 `toF(c)`，返回摄氏温度 c 对应的华氏温度。\n\n公式：`F = C * 9 / 5 + 32`',
  starter: 'function toF(c) {\n  // TODO\n}\n',
  solution: 'function toF(c) {\n  return c * 9 / 5 + 32;\n}\n',
  tests: [
    'eq(toF(0), 32, "toF(0) 应为 32");',
    'eq(toF(100), 212, "toF(100) 应为 212");'
  ],
  hints: ['先算乘除再算加法，注意 9/5 不要写成 9%5。'],
  needsDom: false               // 默认 false；true = 只有浏览器能校验（node 侧跳过）
}
```

| 字段 | 必填 | 约束 |
|---|---|---|
| `id` | ✓ | 全局唯一，建议 `exNN-M` |
| `title` | ✓ | 一句话任务名 |
| `task` | ✓ | markdown 子集，说明要写什么、函数名、输入输出 |
| `starter` | ✓ | 可运行且能编辑；不得与 `solution` 相同 |
| `solution` | ✓ | 参考解，必须让 `tests` 全过 |
| `tests` | ✓ | ≥2 条断言；每条自己负责抛错，可以写多条语句（用 IIFE 包起来），也可以 `await` |
| `hints` | ✓ | ≥1 条 |
| `needsDom` | | `true` 时 node 校验器跳过（浏览器自测仍会跑）；DOM 类练习必须标 |

## 断言辅助（沙箱内可用，浏览器与 node 共用同一实现）

| 辅助 | 行为 |
|---|---|
| `eq(actual, expected, msg?)` | 深比较；不等则抛错并打印实际值 vs 期望值 |
| `ok(cond, msg?)` | `cond` 为假则抛错 |
| `throws(fn, msg?)` | `fn` 未抛错则失败 |
| `logs` | 用户代码 `console.log` 的格式化输出数组（字符串） |
| `$` / `$$` | `document.querySelector` / `querySelectorAll`（转数组） |
| `app` | 沙箱里预建的 `<div id="app">`，DOM 练习往这里写 |

## 执行模型

用户代码 + 断言被拼成一个 async 函数体在同一作用域里执行：

```
用户代码
await (async () => { …每条断言各自 try/catch… })()
```

所以用户代码里的 `const` / `let` / `function` 对断言可见，断言里可以 `await`。
用户代码抛错 = 整体错误（红框），断言抛错 = 该项失败，其余断言继续跑。
