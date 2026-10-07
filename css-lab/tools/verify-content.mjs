/* verify-content.mjs — 内容静态校验（纯 node，不跑浏览器）。改任何 content/*.js 之后先跑这个。
 *
 * 它管的是「结构对不对、字段齐不齐、规律有没有破」。真正的行为校验（参考解全过、起始代码至少挂一条、
 * 示例自检全过）必须在真浏览器里跑，见 tools/verify-browser.mjs 与页面里的 CSSLAB_SELFTEST()。
 * 为什么不在 node 里跑：断言打的是真实 DOM 与计算样式，node 没有 DOM。
 *
 * 用法：node tools/verify-content.mjs [--quiet]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');
const argv = process.argv.slice(2);
const quiet = argv.includes('--quiet');
const strict = !argv.includes('--no-index');   // --no-index：写作期间只验自己这几章（不该管 index.html 清单与章节连续性）

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort();
for (const f of files) {
  vm.runInThisContext(fs.readFileSync(path.join(contentDir, f), 'utf8'), { filename: f });
}
const chapters = (globalThis.CSSLAB_CHAPTERS || []).slice().sort((a, b) => (a.id < b.id ? -1 : 1));

const problems = [];
const stats = { chapters: 0, exercises: 0, demos: 0, prose: 0, tables: 0, notes: 0, diffHint: {} };
const seenChapterIds = new Set();
const seenExerciseIds = new Set();
const fileByChapter = new Map();

function bad(where, msg) { problems.push(`${where} — ${msg}`); }
function isText(v) { return typeof v === 'string' && v.trim().length > 0; }
function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function isPaned(v) { return isPlainObject(v) && isText(v.html) && ['html', 'css', 'js'].every((k) => v[k] === undefined || typeof v[k] === 'string'); }
/* 参考解可以只给变化的那几栏，缺的栏从 starter 继承 */
function isPartialPaned(v) {
  if (!isPlainObject(v)) return false;
  const keys = Object.keys(v);
  if (!keys.length) return false;
  if (!keys.every((k) => ['html', 'css', 'js'].includes(k))) return false;
  if (!keys.every((k) => typeof v[k] === 'string')) return false;
  return keys.some((k) => v[k].trim().length > 0);
}

/* 断言：str = 单阶段；[str...] = 两阶段（第一条在默认宽度跑，第二条在窄宽度跑） */
function isFlatTests(v) {
  return Array.isArray(v) && v.length > 0 && v.every((t) => typeof t === 'string');
}
function isTwoStageTests(v) {
  return Array.isArray(v) && v.length === 2 && v.every(isFlatTests);
}
function isTests(v) { return isFlatTests(v) || isTwoStageTests(v); }
function flatTestCount(v) {
  if (!Array.isArray(v)) return 0;
  return v.reduce((n, t) => n + (Array.isArray(t) ? t.length : 1), 0);
}

/* 内置辅助清单：内容和断言里必须用到的那些（watch/__notify 只在两阶段断言里出现） */
const HELPER_RE = /(^|[^\w$.])(\$\$?|has|count|text|attr|tag|style|rect|px|tracks|eq|ok|near|atLeast|atMost|fn|watch|__notify)\s*\(/;
const TWO_STAGE_ONLY = /(^|[^\w$.])(watch|__notify)\s*\(/;
const BANNED = [
  [/\bfetch\s*\(/, '别用 fetch（离线站点，也没有网络）'],
  [/XMLHttpRequest/, '别用 XMLHttpRequest'],
  [/\balert\s*\(|\bwindow\.alert\s*\(/, '别用 alert（iframe 里会静默）'],
  [/\bconfirm\s*\(|\bprompt\s*\(/, '别用 confirm / prompt'],
  [/<img[^>]+src\s*=\s*["']?https?:/i, '图片不要指向网络地址'],
  [/url\(\s*["']?https?:/i, 'CSS 里不要引用网络地址'],
  [/<link\b/i, '不要引外部样式表'],
  [/<(?:video|audio)[^>]*\bautoplay\b(?![^>]*muted)/i, '媒体不要自动播放（会带声音）'],
  [/<iframe\b/i, '内容里不要再嵌 iframe'],
];

for (const f of files) {
  const m = /^(ch\d{2})-/.exec(f);
  if (!m) bad(`[文件] ${f}`, '文件名必须是 chNN-xxx.js 形式');
}

chapters.forEach((ch, idx) => {
  const where = `[${ch.id}]`;
  stats.chapters++;
  if (!/^ch\d{2}$/.test(ch.id || '')) bad(where, `章节 id 必须是 chNN 形式，实际 ${JSON.stringify(ch.id)}`);
  if (seenChapterIds.has(ch.id)) bad(where, '章节 id 重复');
  seenChapterIds.add(ch.id);
  const expectId = 'ch' + String(idx + 1).padStart(2, '0');
  if (strict && ch.id !== expectId) bad(where, `章节编号必须连续：第 ${idx + 1} 章应为 ${expectId}，实际 ${ch.id}`);
  if (!isText(ch.title)) bad(where, '缺 title');
  if (!isText(ch.goal)) bad(where, '缺 goal');
  if (!Array.isArray(ch.sections) || !ch.sections.length) { bad(where, '缺 sections'); return; }

  for (const [i, sec] of ch.sections.entries()) {
    const sw = `${where} sections[${i}]`;
    if (!isPlainObject(sec)) { bad(sw, '段落不是对象'); continue; }

    if (sec.kind === 'prose' || sec.kind === 'note') {
      if (!isText(sec.md)) bad(sw, `${sec.kind} 缺 md`);
      if (sec.kind === 'note' && sec.tone && sec.tone !== 'tip' && sec.tone !== 'warn') bad(sw, 'note.tone 只能是 tip / warn');
      if (sec.kind === 'prose') stats.prose++; else stats.notes++;
    } else if (sec.kind === 'table') {
      if (!Array.isArray(sec.head) || !sec.head.length) bad(sw, 'table 缺 head');
      if (!Array.isArray(sec.rows) || !sec.rows.length) bad(sw, 'table 缺 rows');
      for (const r of sec.rows || []) {
        if (!Array.isArray(r) || r.length !== (sec.head || []).length) bad(sw, 'table 行列数与表头不一致');
      }
      stats.tables++;
    } else if (sec.kind === 'demo') {
      stats.demos++;
      if (!isText(sec.html)) bad(sw, 'demo 缺 html');
      if (sec.css !== undefined && typeof sec.css !== 'string') bad(sw, 'demo.css 必须是字符串');
      if (sec.js !== undefined && typeof sec.js !== 'string') bad(sw, 'demo.js 必须是字符串');
      if (sec.height !== undefined && typeof sec.height !== 'number') bad(sw, 'demo.height 必须是数字');
      if (sec.full !== undefined && typeof sec.full !== 'boolean') bad(sw, 'demo.full 必须是 true / false');
      if (sec.full && !/<html[\s>]/i.test(sec.html || '')) bad(sw, 'full 模式的 html 里应该包含 <html>（写的就是整份文档）');
      if (sec.width !== undefined && (typeof sec.width !== 'number' || sec.width < 120 || sec.width > 1200)) bad(sw, 'demo.width 应是 120–1200 之间的数字');
      if (!isTests(sec.checks)) bad(sw, 'demo.checks 必须是 [断言...] 或 [[阶段1...],[阶段2...]]');
      (Array.isArray(sec.checks) ? sec.checks.flat() : []).forEach((c) => {
        if (typeof c !== 'string' || !HELPER_RE.test(c)) bad(sw, `checks 必须用内置辅助（has/count/text/attr/tag/style/rect/px/tracks/eq/ok/near/atLeast/atMost/fn）：${JSON.stringify(c)}`);
      });
      if (isFlatTests(sec.checks) && sec.checks.some((c) => TWO_STAGE_ONLY.test(c))) {
        bad(sw, 'checks 里用了 watch / __notify，但它不是两阶段写法：写成 [[...], [...]]');
      }
      for (const [re, why] of BANNED) {
        const blob = [sec.html, sec.css, sec.js].filter(Boolean).join('\n');
        if (re.test(blob)) bad(sw, why);
      }
    } else if (sec.kind === 'exercise') {
      stats.exercises++;
      if (!isText(sec.id)) { bad(sw, '练习缺 id'); continue; }
      if (seenExerciseIds.has(sec.id)) bad(sw, `练习 id 重复：${sec.id}`);
      seenExerciseIds.add(sec.id);
      const ew = `${where} ${sec.id}`;
      const wantPrefix = 'ex' + ch.id.slice(2) + '-';
      if (!new RegExp('^' + wantPrefix + '\\d+$').test(sec.id)) bad(ew, `练习 id 必须与本 chapter 号一致：期望 ${wantPrefix}N`);
      for (const f of ['title', 'task']) if (!isText(sec[f])) bad(ew, `缺 ${f}`);
      if (!isPaned(sec.starter)) bad(ew, 'starter 必须是 { html, css?, js? } 且 html 非空');
      if (!isPartialPaned(sec.solution)) bad(ew, 'solution 必须是 { html?, css?, js? } 且至少一栏非空（缺的栏继承 starter）');
      else if (!Object.keys(sec.solution).length) bad(ew, 'solution 一栏都没给');
      if (!isTests(sec.tests)) bad(ew, 'tests 必须是 [断言...] 或 [[阶段1...],[阶段2...]]（两阶段表示「改窄窗口后重读一次」）');
      else if (flatTestCount(sec.tests) < 2) bad(ew, `tests 至少要 2 条，现在 ${flatTestCount(sec.tests)} 条`);
      if (isTwoStageTests(sec.tests) && sec.tests[1].some((t) => !TWO_STAGE_ONLY.test(t) && !/^\s*(eq|ok|near|atLeast|atMost|has|count)\b/.test(t))) {
        bad(ew, '两阶段的第二阶段里出现了既不是 watch 也不查 DOM 的断言，看看是不是写错了阶段');
      }
      if (isFlatTests(sec.tests) && sec.tests.some((t) => TWO_STAGE_ONLY.test(t))) {
        bad(ew, 'tests 里用了 watch / __notify，但它不是两阶段写法：写成 [[...], [...]]');
      }
      if (!Array.isArray(sec.hints) || !sec.hints.length) bad(ew, 'hints 至少要 1 条');
      if (sec.height !== undefined && typeof sec.height !== 'number') bad(ew, 'height 必须是数字');
      if (sec.full !== undefined && typeof sec.full !== 'boolean') bad(ew, 'full 必须是 true / false');
      if (sec.full && !/<html[\s>]/i.test((sec.starter && sec.starter.html) || '')) bad(ew, 'full 模式的 starter.html 里应该包含 <html>（写的就是整份文档）');
      if (sec.width !== undefined && (typeof sec.width !== 'number' || sec.width < 120 || sec.width > 1200)) bad(ew, 'width 应是 120–1200 之间的数字');
      if (sec.widths !== undefined && (!Array.isArray(sec.widths) || !sec.widths.length || !sec.widths.every((w) => typeof w === 'number' && w >= 120 && w <= 1200))) {
        bad(ew, 'widths 应是 [宽度数字]，每个在 120–1200 之间');
      }
      if (sec.widths !== undefined && !isTwoStageTests(sec.tests)) bad(ew, 'widths 只在两阶段断言（[[...],[...]]）下有意义');
      for (const t of (Array.isArray(sec.tests) ? sec.tests.flat() : [])) {
        if (typeof t !== 'string' || !HELPER_RE.test(t)) bad(ew, `断言必须用内置辅助（否则失败信息不会说清期望/实际）：${JSON.stringify(t)}`);
      }
      if (isPaned(sec.starter) && isPartialPaned(sec.solution)) {
        const merged = { html: sec.starter.html, css: sec.starter.css, js: sec.starter.js };
        for (const k of Object.keys(sec.solution)) if (sec.solution[k] != null) merged[k] = sec.solution[k];
        const same = ['html', 'css', 'js'].every((k) => (merged[k] || '') === (sec.starter[k] || ''));
        if (same) bad(ew, 'starter 与 solution 完全一样（练习没有要动手的地方）');
        const diffKeys = ['html', 'css', 'js'].filter((k) => (merged[k] || '') !== (sec.starter[k] || ''));
        if (diffKeys.length) stats.diffHint[diffKeys.join('+')] = (stats.diffHint[diffKeys.join('+')] || 0) + 1;
      }
      const blob = [sec.starter.html, sec.starter.css, sec.starter.js, sec.solution.html, sec.solution.css, sec.solution.js].filter(Boolean).join('\n');
      for (const [re, why] of BANNED) if (re.test(blob)) bad(ew, why);
    } else {
      bad(sw, `未知的 kind: ${JSON.stringify(sec.kind)}`);
    }
  }
});

/* ---------- content/*.js 与 index.html 的 script 清单必须完全对上 ---------- */
try {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const listed = [...html.matchAll(/<script src="content\/([^"]+)"><\/script>/g)].map((m) => m[1]);
  if (strict) {
    const missing = files.filter((f) => !listed.includes(f));
    const extra = listed.filter((f) => !files.includes(f));
    if (missing.length) bad('[index.html]', `这些内容文件没被 index.html 加载：${missing.join(', ')}`);
    if (extra.length) bad('[index.html]', `index.html 加载了不存在的内容文件：${extra.join(', ')}`);
    if (!missing.length && !extra.length && listed.join('|') !== files.join('|')) bad('[index.html]', '内容文件的加载顺序与文件名排序不一致');
  } else {
    for (const f of listed) if (!files.includes(f)) bad('[index.html]', `index.html 里写的 ${f} 不存在`);
  }
} catch (e) {
  bad('[index.html]', `读不到 index.html：${e.message}`);
}

/* ---------- 汇总 ---------- */
console.log(`\n内容统计：${stats.chapters} 章 · ${stats.exercises} 个练习 · ${stats.demos} 个示例 · ${stats.prose} 段讲解 · ${stats.notes} 条提示 · ${stats.tables} 张表`);
const diffKeys = Object.keys(stats.diffHint).sort((a, b) => stats.diffHint[b] - stats.diffHint[a]);
if (diffKeys.length) console.log('参考解改动的栏位分布：' + diffKeys.map((k) => `${k} ${stats.diffHint[k]}`).join(' · '));
if (problems.length) {
  console.log(`\n发现 ${problems.length} 个问题：\n`);
  for (const p of problems) console.log('  ✗ ' + p);
  process.exit(1);
} else {
  console.log('\n✓ 结构全部通过（行为的最终裁决在 tools/verify-browser.mjs）。\n');
}
