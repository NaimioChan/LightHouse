/* verify-content.mjs — 内容结构校验（秒级，不需要浏览器，也不加载编译器）。
 *
 * 查的是「内容契约」的硬要求：字段齐全、id 唯一且与章号一致、tests ≥2 / hints ≥1、
 * 起始代码与参考答案不同、断言用的是内置辅助、期望类型是单引号字面量、
 * 每章规模（≥3 示例 / ≥4 练习）、index.html 里按顺序引入了每个章节文件。
 *
 * 行为层面（参考答案真的全过、起始代码真的被抓）由 tools/verify-types.mjs 与 tools/verify-browser.mjs 负责。
 * 用法：node tools/verify-content.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');

/* 与 judge.js 的 KEYS 一致 */
const HELPERS = ['d', 'codes', 'noErrors', 'countErrors', 'hasError', 'notError', 'errorAt', 'noErrorAt',
  'type', 'exists', 'memberNames', 'eqType', 'eqTypeExact', 'assignableTo', 'notAssignableTo',
  'run', 'eqLogs', 'logs', 'eq', 'ok', 'near', 'fmt', 'js', 'jsHas', 'notJsHas'];
const EXPECT_ARG1 = ['eqType', 'eqTypeExact', 'assignableTo', 'notAssignableTo'];
const BOOL_OPTS = ['strict', 'noImplicitAny', 'strictNullChecks', 'strictFunctionTypes', 'strictBindCallApply',
  'strictPropertyInitialization', 'noImplicitThis', 'alwaysStrict', 'exactOptionalPropertyTypes',
  'noUncheckedIndexedAccess', 'noImplicitReturns', 'noImplicitOverride', 'noFallthroughCasesInSwitch',
  'allowUnreachableCode', 'allowUnusedLabels', 'noUnusedLocals', 'noUnusedParameters', 'isolatedModules',
  'verbatimModuleSyntax', 'useDefineForClassFields', 'experimentalDecorators', 'emitDecoratorMetadata',
  'noPropertyAccessFromIndexSignature', 'allowSyntheticDefaultImports', 'esModuleInterop', 'resolveJsonModule',
  'declaration', 'allowJs', 'checkJs', 'removeComments', 'preserveConstEnums', 'noImplicitUseStrict'];
const ENUM_OPTS = ['target', 'module'];

const problems = [];
const push = (where, what) => problems.push({ where, what });

const argv = process.argv.slice(2);
const onlyChapter = argv.includes('--chapter') ? argv[argv.indexOf('--chapter') + 1] : null;
const skipIndex = argv.includes('--no-index');   // 并行写多章时用：章节还没写全，index.html 的清单必然对不上

/* ---------- 读章节文件 ---------- */
const allFiles = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort();
const files = allFiles.filter((f) => !onlyChapter || f.startsWith(onlyChapter));
if (!files.length) {
  console.log('没有匹配的内容文件' + (onlyChapter ? '（--chapter ' + onlyChapter + '）' : '') + '。');
  process.exit(1);
}

const ids = new Map();
const chapters = [];

for (const file of files) {
  const full = path.join(contentDir, file);
  const raw = fs.readFileSync(full, 'utf8');
  if (/\\\\'/.test(raw)) {
    push(file, "文件里有 \\\\'（连续两个反斜杠再加引号，多半是多写了一层转义）——这是内容里最容易写坏的一处");
  }
  const ctx = vm.createContext({});
  let list;
  try {
    vm.runInContext(raw, ctx, { filename: full });
    list = ctx.TSLAB_CHAPTERS || [];
  } catch (e) {
    push(file, '跑不起来：' + e.message);
    continue;
  }
  if (list.length !== 1) { push(file, '一个文件必须注册且只注册一个章节，实际 ' + list.length + ' 个'); continue; }
  const ch = list[0];
  chapters.push({ file, ch });

  if (!ch.id) { push(file, '缺 id'); continue; }
  if (ids.has(ch.id)) push(file, '章节 id 重复：' + ch.id);
  ids.set(ch.id, file);
  if (!file.startsWith(ch.id)) push(file, '文件名必须以章节 id 开头（' + ch.id + '）');
  if (!ch.title) push(ch.id, '缺 title');
  if (!ch.goal) push(ch.id, '缺 goal');
  if (!Array.isArray(ch.sections) || !ch.sections.length) { push(ch.id, '缺 sections'); continue; }
}

/* ---------- 逐段检查 ---------- */
const KINDS = ['prose', 'note', 'table', 'demo', 'exercise'];
const exIds = new Map();
const stats = { chapters: chapters.length, demos: 0, exercises: 0, assertions: 0, hints: 0, tables: 0, notes: 0, prose: 0, runtimeTests: 0 };

/** 取出 name(...) 调用的第二个实参原文（跳过字符串里的逗号与括号）。
 *  返回 { found, arg }：found=false 表示这条断言没用这个辅助，不用管。 */
function secondArg(text, name) {
  const head = new RegExp('\\b' + name + '\\s*\\(').exec(text);
  if (!head) return { found: false, arg: null };
  const args = [];
  let i = head.index + head[0].length;
  let depth = 1, start = i, quote = null;
  for (; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === '\\') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '\'' || c === '"') { quote = c; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      depth--;
      if (depth === 0) { args.push(text.slice(start, i).trim()); break; }
    } else if (c === ',' && depth === 1) {
      args.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  return { found: true, arg: args.length >= 2 ? args[1] : null };
}

function checkAssertionSource(where, src) {
  const text = String(src);
  if (!text.trim()) { push(where, '断言是空的'); return; }
  if (text.length > 400) push(where, '断言太长（' + text.length + ' 字符），考虑拆开或把解释写进 task');
  if (!HELPERS.some((h) => new RegExp('\\b' + h + '\\s*\\(').test(text) || new RegExp('\\b' + h + '\\b').test(text))) {
    push(where, '断言里没有用任何内置辅助：' + text);
  }
  if (/\bok\s*\(\s*(true|1)\s*[,)]/.test(text)) push(where, '不许写永远为真的 ok(true)：' + text);
  if (/\bconsole\s*\./.test(text)) push(where, '断言里不要碰 console，用 logs / eqLogs：' + text);
  /* 断言本身的语法（不是类型）能在这里查出来：编译成 async 函数体 */
  try {
    /* eslint-disable-next-line no-new-func */
    new Function('return (async function () {\n' + text + '\n}).call(this);');
  } catch (e) {
    push(where, '断言有语法错误：' + e.message + '　→　' + text);
  }
  /* 期望类型必须是单引号字面量，否则 judge 里登记不到 */
  for (const name of EXPECT_ARG1) {
    const found = secondArg(text, name);
    if (!found.found) continue;
    if (!found.arg || !/^'[^']*'$/.test(found.arg)) {
      push(where, name + ' 的期望类型必须是单引号字符串字面量，现在是：' + (found.arg || '（没有第二个参数）'));
    }
  }
  if (/\brun\s*\(/.test(text)) stats.runtimeTests++;
}

function checkTsconfig(where, cfg) {
  if (!cfg) return;
  if (typeof cfg !== 'object' || Array.isArray(cfg)) { push(where, 'tsconfig 必须是对象'); return; }
  for (const k of Object.keys(cfg)) {
    if (BOOL_OPTS.includes(k)) {
      if (typeof cfg[k] !== 'boolean') push(where, 'tsconfig.' + k + ' 必须是布尔值');
    } else if (ENUM_OPTS.includes(k)) {
      if (typeof cfg[k] !== 'string') push(where, 'tsconfig.' + k + ' 必须是字符串（如 ESNext / ES2020）');
    } else {
      push(where, 'tsconfig 里有未知选项：' + k);
    }
  }
}

function checkCode(where, code, hasRuntimeTest) {
  const text = String(code);
  if (!text.trim()) push(where, '代码是空的');
  if (/<script/i.test(text)) push(where, '代码里不该出现 <script>');
  if (/\b(fetch|XMLHttpRequest|alert|confirm|prompt)\s*\(/.test(text)) push(where, '禁区：不能用 fetch / XMLHttpRequest / alert / confirm / prompt');
  if (/\bwhile\s*\(\s*(true|1)\s*\)/.test(text)) push(where, '禁区：死循环会白等 5 秒超时，别写进内容');
  if (/^\s*(import|export)\s/m.test(text) && hasRuntimeTest) {
    push(where, '带 import/export 的代码不能配 await run()：编译产物是模块语法，没法当普通脚本跑');
  }
  if (/^\s*import\s/m.test(text)) push(where, '运行时练习不用 import（单文件课程里没有模块可导入）');
}

function checkDemo(where, sec) {
  stats.demos++;
  if (!sec.code) push(where, '缺 code');
  if (!Array.isArray(sec.checks) || !sec.checks.length) { push(where, 'checks 至少 1 条'); return; }
  sec.checks.forEach((c, i) => { checkAssertionSource(where + ' checks[' + i + ']', c); stats.assertions++; });
  checkTsconfig(where, sec.tsconfig);
  checkCode(where, sec.code, sec.checks.some((c) => /\brun\s*\(/.test(c)) || !!sec.run);
}

function checkExercise(chId, where, sec) {
  stats.exercises++;
  const need = ['id', 'title', 'task', 'starter', 'solution', 'tests', 'hints'];
  need.forEach((k) => { if (!sec[k]) push(where, '缺 ' + k); });
  if (!sec.id) return;
  if (exIds.has(sec.id)) push(where, '练习 id 重复：' + sec.id);
  exIds.set(sec.id, chId);
  const m = /^ex(\d+)-(\d+)$/.exec(sec.id);
  if (!m) push(where, 'id 必须形如 exNN-M：' + sec.id);
  else if (('ch' + m[1]) !== chId) push(where, 'id 里的章号与所在章不一致：' + sec.id + ' 出现在 ' + chId);
  if (sec.starter === sec.solution) push(where, 'starter 与 solution 一模一样，这道题抓不住空实现');
  if (!Array.isArray(sec.tests) || sec.tests.length < 2) push(where, 'tests 至少 2 条');
  if (!Array.isArray(sec.hints) || sec.hints.length < 1) push(where, 'hints 至少 1 条');
  (sec.tests || []).forEach((t, i) => { checkAssertionSource(where + ' tests[' + i + ']', t); stats.assertions++; });
  stats.hints += (sec.hints || []).length;
  checkTsconfig(where, sec.tsconfig);
  checkCode(where + ' starter', sec.starter, (sec.tests || []).some((t) => /\brun\s*\(/.test(t)));
  checkCode(where + ' solution', sec.solution, (sec.tests || []).some((t) => /\brun\s*\(/.test(t)));
}

const SLOP = ['值得注意的是', '众所周知', '综上所述', '换句话说', '总而言之', '不难看出'];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

for (const { file, ch } of chapters) {
  if (!ch.id) continue;
  if (onlyChapter && ch.id !== onlyChapter) continue;
  let demos = 0, exercises = 0;
  ch.sections.forEach((sec, i) => {
    const where = ch.id + ' sections[' + i + ']' + (sec.id ? ' ' + sec.id : '');
    if (!KINDS.includes(sec.kind)) { push(where, '未知的段落 kind：' + sec.kind); return; }
    if (sec.kind === 'prose') {
      stats.prose++;
      if (!sec.md) push(where, 'prose 缺 md');
      else SLOP.forEach((s) => { if (sec.md.includes(s)) push(where, '别写「' + s + '」这类话'); });
    } else if (sec.kind === 'note') {
      stats.notes++;
      if (!sec.md) push(where, 'note 缺 md');
      if (sec.tone && sec.tone !== 'tip' && sec.tone !== 'warn') push(where, 'note.tone 只能是 tip / warn');
    } else if (sec.kind === 'table') {
      stats.tables++;
      if (!Array.isArray(sec.head) || !sec.head.length) push(where, 'table 缺 head');
      if (!Array.isArray(sec.rows) || !sec.rows.length) push(where, 'table 缺 rows');
      (sec.rows || []).forEach((r, ri) => {
        if (!Array.isArray(r) || r.length !== (sec.head || []).length) push(where, 'table 第 ' + (ri + 1) + ' 行的列数与 head 不一致');
      });
    } else if (sec.kind === 'demo') { demos++; checkDemo(where, sec); }
    else if (sec.kind === 'exercise') { exercises++; checkExercise(ch.id, where, sec); }

    [sec.md, sec.task, sec.caption, sec.title].forEach((t) => {
      if (typeof t === 'string' && EMOJI.test(t)) push(where, '不用 emoji：' + t.slice(0, 40));
    });
  });
  if (demos < 3) push(ch.id, '示例少于 3 个（现在 ' + demos + '）');
  if (exercises < 4) push(ch.id, '练习少于 4 道（现在 ' + exercises + '）');
  if (!file.startsWith(ch.id)) push(file, '文件名与章节 id 不一致');
}

/* ---------- index.html 的引入情况（--no-index 时跳过：并行写多章期间必然对不上） ---------- */
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!skipIndex) {
  const refs = [...html.matchAll(/<script src="content\/([^"]+)"><\/script>/g)].map((m) => m[1]);
  files.forEach((f) => { if (!refs.includes(f)) push('index.html', '没有引入内容文件：' + f); });
  refs.forEach((f) => { if (!fs.existsSync(path.join(contentDir, f))) push('index.html', '引入的内容文件不存在：content/' + f); });
  const refsExisting = refs.filter((f) => files.includes(f));
  if (refsExisting.join(',') !== files.join(',')) {
    push('index.html', '内容文件的引入顺序与文件名排序不一致：\n      期望 ' + files.join(' → ') + '\n      实际 ' + refsExisting.join(' → '));
  }
}
/* vendor 三个文件也要存在 */
for (const v of ['vendor/typescript.js', 'vendor/libs-embed.js', 'vendor/diag-zh.js']) {
  if (!fs.existsSync(path.join(root, v))) push(v, 'vendor 文件不存在（跑 node tools/build-vendor.mjs）');
}
if (html.indexOf('assets/js/judge.js') < 0) push('index.html', '没有引入判题内核 assets/js/judge.js');
if (html.indexOf('assets/js/format.js') < 0) push('index.html', '没有引入 assets/js/format.js（judge 依赖它）');

/* ---------- 报告 ---------- */
console.log('章节 ' + stats.chapters + '　示例 ' + stats.demos + '　练习 ' + stats.exercises +
  '　断言 ' + stats.assertions + '　提示 ' + stats.hints + '　（表格 ' + stats.tables + ' / 提示段 ' + stats.notes + ' / 讲解段 ' + stats.prose + '）');
console.log('断言里带 await run() 的：' + stats.runtimeTests + ' 条');

if (problems.length) {
  console.log('\n发现 ' + problems.length + ' 个问题：');
  problems.slice(0, 60).forEach((p) => console.log('  ✗ ' + p.where + '\n      ' + p.what));
  if (problems.length > 60) console.log('  …还有 ' + (problems.length - 60) + ' 个');
  process.exit(1);
}
console.log('\n✓ 内容结构校验通过。');
