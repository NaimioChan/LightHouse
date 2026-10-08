/* verify-compile.mjs — 改写内核自己的单测（秒级，不需要浏览器）。
 *
 * 把 assets/js/compile.js 在 vm 里跑，直接断言改写结果。这一层故意只测「文本改写」：
 * import 的别名方向、单双引号两种分隔符、export default 的三种形态——这些是最容易写反、
 * 写错了又不报错的地方（改错了表现为「没有找到 export default」，很难查）。
 *
 * 顺带守住两条引擎铁律：三个内核函数体里不许出现反引号、不许引用外部变量。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
function record(name, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
function includes(name, haystack, needle) {
  const ok = String(haystack).includes(needle);
  record(name, ok, ok ? '' : `找不到 ${JSON.stringify(needle)}；实际：${String(haystack).slice(0, 240)}`);
}
function notIncludes(name, haystack, needle) {
  const ok = !String(haystack).includes(needle);
  record(name, ok, ok ? '' : `不该出现 ${JSON.stringify(needle)}`);
}
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  record(name, ok, ok ? '' : `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
}

/* —— 改写内核在 vm 里装配（与沙箱同构：只有 __RLLAB_REACT 这个入参）—— */
function boot() {
  const ctx = vm.createContext({ console });
  ctx.globalThis = ctx;
  ctx.window = ctx;
  ctx.self = ctx;
  const file = path.join(ROOT, 'assets/js/compile.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  if (!ctx.RLLAB_COMPILE) throw new Error('compile.js 没挂上 RLLAB_COMPILE');
  return ctx;
}

const ctx = boot();
const compile = (src) => ctx.RLLAB_COMPILE.compile(src);
const code = (src) => compile(src).code;

/* 1. import 改写：默认 / 命名 / 别名 / 命名空间，两种引号 */
{
  const src = [
    "import React, { useState, useMemo as memo } from 'react'",
    "import * as RD from \"react-dom\"",
    "import { createRoot } from 'react-dom/client'",
    "import htm from 'htm'",
    'export default function App() { return null }',
  ].join('\n');
  const out = code(src);
  notIncludes('没有残留 import 语句', out, 'import ');
  includes('默认导入从产物取 React', out, 'const React = __RLLAB_REACT.React;');
  includes('命名导入解构（含别名）', out, 'const { useState, useMemo: memo } = __RLLAB_REACT.React;');
  includes('别名方向正确（本地名在右）', out, 'useMemo: memo');
  record('别名方向没写反', !out.includes('memo: useMemo'), out.slice(0, 160));
  includes('命名空间导入', out, 'const RD = __RLLAB_REACT.ReactDOM;');
  includes('react-dom/client 映射到 ReactDOMClient', out, 'const { createRoot } = __RLLAB_REACT.ReactDOMClient;');
  includes('htm 映射到产物里的 htm', out, 'const htm = __RLLAB_REACT.htm;');
}

/* 2. export default 三种形态都要把组件交出来 */
{
  const fn = code("export default function App() { return null }");
  includes('命名函数：去掉 export default', fn, 'function App() { return null }');
  notIncludes('命名函数：没有残留 export', fn, 'export');
  includes('命名函数：末尾补 return App', fn, 'return App;');

  const cls = code('export default class App {}');
  includes('命名类：去掉 export default', cls, 'class App {}');
  includes('命名类：末尾补 return App', cls, 'return App;');

  const anon = code('export default function () { return 1 }');
  includes('匿名函数：直接换成 return', anon, 'return function () { return 1 }');

  const arrow = code('export default () => 1');
  includes('箭头函数：换成 return', arrow, 'return () => 1');

  const ident = code("import { useState } from 'react'\nconst App = () => 1\nexport default App");
  includes('标识符导出：换成 return App', ident, 'return App');

  const named = code("import { useState } from 'react'\nexport default function App() { const [n] = useState(0); return n }");
  includes('命名默认导出与 import 同时改写', named, 'const { useState } = __RLLAB_REACT.React;');
  includes('命名默认导出末尾仍有 return App', named, 'return App;');
}

/* 3. 不支持的模块要报出来（unknown 非空，且留了标记注释） */
{
  const out = compile("import x from 'lodash'");
  eq('不支持的模块记在 unknown 里', out.unknown, 'lodash');
  includes('不支持的模块留了标记注释', out.code, '不支持的模块 lodash');
}

/* 4. 默认导出的 return 只补一次、且排在最后 */
{
  const out = code("import { useState } from 'react'\nexport default function App() { return 1 }");
  const idx = out.indexOf('return App;');
  record('补的 return App 在最后一行', idx > out.indexOf('function App'), `return@${idx} fn@${out.indexOf('function App')}`);
  eq('补的 return 只出现一次', out.split('return App;').length - 1, 1);
}

/* 5. 内核源码里不许出现反引号（它在模板字符串里，会提前终止） */
{
  for (const [rel, start, end] of [
    ['assets/js/compile.js', 'function RLLAB_COMPILE_FN', 'root.RLLAB_COMPILE_FN'],
    ['assets/js/harness.js', 'function RLLAB_HARNESS_FN', 'root.RLLAB_HARNESS_FN'],
    ['assets/js/harness.js', 'function RLLAB_PREVIEW_FN', 'root.RLLAB_PREVIEW_FN'],
  ]) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const body = src.slice(src.indexOf(start), src.indexOf(end));
    record(`${rel} 的 ${start.split(' ')[1]} 函数体里没有反引号`, !body.includes('`'), body.includes('`') ? '出现了反引号' : '');
  }
}

/* 6. 内核函数不许引用外部变量（贴进沙箱后看不见外面） */
{
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/compile.js'), 'utf8');
  const body = src.slice(src.indexOf('function RLLAB_COMPILE_FN'), src.indexOf('root.RLLAB_COMPILE_FN'));
  record('改写内核自带 toDestructure（不依赖外部）', body.includes('function toDestructure'));
}

console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
