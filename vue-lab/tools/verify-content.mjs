/* verify-content.mjs — 内容结构校验（秒级，不需要浏览器，也不编译）。
 *
 * 查的是「写内容时最容易写错、而且错了不会当场报」的那些事：
 *   - 字段齐全、id 唯一且与章号一致、starter ≠ solution
 *   - 每章 ≥3 示例 ≥4 练习、每个示例/练习的 tests 条数与要求
 *   - index.html 的 script 清单与 content/*.js 完全一致（加章忘了改 HTML 是静默失效）
 *   - 内容里不许出现反引号包裹的模板字符串、不许 import vue 以外的东西
 *
 * 用法：
 *   node tools/verify-content.mjs              # 全部
 *   node tools/verify-content.mjs --chapter ch05
 *   node tools/verify-content.mjs --no-index   # 并行写多章时跳过 index.html 清单那一条
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] === undefined ? true : process.argv[i + 1]) : dflt;
};
const only = arg('--chapter', null);
const skipIndex = !!arg('--no-index', false);

let failures = 0;
const problems = [];
function bad(where, msg) { failures++; problems.push(`${where}：${msg}`); console.log(`FAIL  ${where}  — ${msg}`); }
function fine(msg) { console.log(`PASS  ${msg}`); }

function readChapter(file) {
  const ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  const list = ctx.VUELAB_CHAPTERS || [];
  if (list.length !== 1) throw new Error(`${path.basename(file)} 注册了 ${list.length} 章，应该正好 1 章`);
  return list[0];
}

const files = fs.readdirSync(CONTENT).filter((f) => /^ch\d+.*\.js$/.test(f)).sort()
  .filter((f) => !only || f.startsWith(only));
if (!files.length) { console.log('没有匹配的内容文件'); process.exit(1); }

const seenIds = new Set();
const seenExercise = new Set();
const chapters = [];

for (const file of files) {
  const where = file;
  let ch;
  try { ch = readChapter(path.join(CONTENT, file)); }
  catch (e) { bad(where, '读不出来：' + e.message); continue; }
  chapters.push({ file, ch });

  const m = /^(ch\d+)/.exec(file);
  if (!ch.id) bad(where, '缺 id');
  else if (ch.id !== m[1]) bad(where, `id 是 ${ch.id}，文件名开头是 ${m[1]}，两者必须一致`);
  else if (seenIds.has(ch.id)) bad(where, `id ${ch.id} 重复`);
  else seenIds.add(ch.id);

  if (!ch.title || !/^第\s*\d+\s*章/.test(ch.title)) bad(where, 'title 必须以「第 N 章 · 」开头');
  if (!ch.goal || ch.goal.length < 8) bad(where, 'goal 太短，写一句学完能做什么');
  if (!Array.isArray(ch.sections) || !ch.sections.length) { bad(where, '没有 sections'); continue; }

  const demos = ch.sections.filter((s) => s.kind === 'demo');
  const exs = ch.sections.filter((s) => s.kind === 'exercise');
  if (demos.length < 3) bad(where, `示例只有 ${demos.length} 个，每章至少 3 个`);
  if (exs.length < 4) bad(where, `练习只有 ${exs.length} 个，每章至少 4 个`);

  ch.sections.forEach((sec, i) => {
    const at = `${where} sections[${i}]`;
    if (!sec || !sec.kind) return bad(at, '缺 kind');
    if (!['prose', 'note', 'table', 'demo', 'exercise'].includes(sec.kind)) return bad(at, `未知 kind ${sec.kind}`);

    if (sec.kind === 'prose') {
      if (!sec.md || !String(sec.md).trim()) bad(at, 'prose 缺 md');
    } else if (sec.kind === 'note') {
      if (!sec.md) bad(at, 'note 缺 md');
      if (sec.tone && !['tip', 'warn'].includes(sec.tone)) bad(at, `tone 只能是 tip / warn，写的是 ${sec.tone}`);
    } else if (sec.kind === 'table') {
      if (!Array.isArray(sec.head) || !sec.head.length) bad(at, 'table 缺 head');
      if (!Array.isArray(sec.rows) || !sec.rows.length) bad(at, 'table 缺 rows');
      (sec.rows || []).forEach((r, ri) => {
        if (r.length !== (sec.head || []).length) bad(at, `第 ${ri + 1} 行有 ${r.length} 格，表头有 ${(sec.head || []).length} 格`);
      });
    } else if (sec.kind === 'demo') {
      checkCode(at, sec.code, '示例');
      if (!Array.isArray(sec.tests) || !sec.tests.length) bad(at, 'demo 至少要 1 条 tests');
    } else if (sec.kind === 'exercise') {
      if (!sec.id) bad(at, '练习缺 id');
      else if (!/^ex\d{2}-\d+$/.test(sec.id)) bad(at, `id ${sec.id} 不符合 exNN-M 格式`);
      else if (seenExercise.has(sec.id)) bad(at, `练习 id ${sec.id} 重复`);
      else {
        seenExercise.add(sec.id);
        const num = sec.id.slice(2, 4);
        if (num !== (ch.id || '').slice(2)) bad(at, `id ${sec.id} 的章号与所在章 ${ch.id} 不一致`);
      }
      if (!sec.title) bad(at, '练习缺 title');
      if (!sec.task) bad(at, '练习缺 task');
      checkCode(at, sec.starter, '起始代码');
      checkCode(at, sec.solution, '参考答案');
      if (String(sec.starter) === String(sec.solution)) bad(at, 'starter 与 solution 一模一样，这道题抓不住空实现');
      if (!Array.isArray(sec.tests) || sec.tests.length < 2) bad(at, `练习的 tests 只有 ${(sec.tests || []).length} 条，至少 2 条`);
      if (!Array.isArray(sec.hints) || !sec.hints.length) bad(at, '练习至少要 1 条 hints');
      const reads = (sec.tests || []).filter((t) => /(text|has|missing|count|attr|style|click|input)\s*\(/.test(t));
      if (!reads.length) bad(at, '练习的断言里没有一条在读 DOM（不许全是 ok(true)）');
    }
  });
}

/* 代码块本身的检查：反引号模板串、import 白名单、必须是合法的一段 */
function checkCode(at, code, label) {
  if (typeof code !== 'string' || !code.trim()) return bad(at, `${label}为空`);
  if (/^\s*['"]/.test(code) && !code.includes('<')) return bad(at, `${label}看着不像 SFC（没有 <template>）`);

  /* import 只准 from 'vue'：compile.js 只认这一个模块名 */
  const imports = code.match(/^\s*import\s+.*$/gm) || [];
  imports.forEach((line) => {
    const mm = /from\s*['"]([^'"]+)['"]/.exec(line);
    if (mm && mm[1] !== 'vue') bad(at, `${label} import 了 ${mm[1]}，只支持 import ... from 'vue'`);
  });

  /* 内容文件用反引号会与外层字符串打架，也违反写作规范 */
  if (code.includes('`')) bad(at, `${label}里出现了反引号（内容文件统一用单引号与 [].join 写法）`);

  /* 简单的开闭标签平衡（只看 script / template / style 三个顶层块） */
  ['script', 'template', 'style'].forEach((tag) => {
    const open = (code.match(new RegExp('<' + tag + '(\\s|>)', 'g')) || []).length;
    const close = (code.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    if (open !== close) bad(at, `${label} 的 <${tag}> 开了 ${open} 次、闭了 ${close} 次`);
  });
}

/* ---------- index.html 的 script 清单必须与 content/*.js 一致 ---------- */
if (!skipIndex && !only) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const listed = (html.match(/<script src="content\/[^"]+"><\/script>/g) || [])
    .map((s) => /content\/([^"]+)/.exec(s)[1]);
  const actual = fs.readdirSync(CONTENT).filter((f) => f.endsWith('.js')).sort();
  const missing = actual.filter((f) => !listed.includes(f));
  const extra = listed.filter((f) => !actual.includes(f));
  if (missing.length) bad('index.html', '缺少这些内容文件的 <script>：' + missing.join(', '));
  if (extra.length) bad('index.html', '列了不存在的内容文件：' + extra.join(', '));
  if (!missing.length && !extra.length) fine(`index.html 的 ${listed.length} 个内容 script 与 content/ 一致`);
}

/* ---------- 汇总 ---------- */
const totalEx = chapters.reduce((n, c) => n + (c.ch.sections || []).filter((s) => s.kind === 'exercise').length, 0);
const totalDemo = chapters.reduce((n, c) => n + (c.ch.sections || []).filter((s) => s.kind === 'demo').length, 0);
const totalTests = chapters.reduce((n, c) => n + (c.ch.sections || [])
  .filter((s) => s.kind === 'exercise' || s.kind === 'demo')
  .reduce((k, s) => k + (s.tests || []).length, 0), 0);

if (!problems.length) {
  console.log(`PASS  ${chapters.length} 章 · ${totalEx} 练习 · ${totalDemo} 示例 · ${totalTests} 断言（结构全过）`);
}
console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
