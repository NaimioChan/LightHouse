/* verify-content.mjs — 内容校验。改任何 content/*.js 之后必须跑这个。
 *
 * 1. 结构校验：章节/段落/练习的必填字段、id 唯一、starter ≠ solution、tests ≥ 2、hints ≥ 1。
 * 2. 行为校验：每个练习的 solution 必须全部通过断言；starter 必须至少挂一条（否则练习太松）。
 * 3. 示例校验：每个 kind:'code' 段落的 expect 必须与实际控制台输出逐字一致。
 *
 * 执行用的是 assets/js/sandbox.js 里那份 harness（与浏览器完全同一段代码），只是丢进 vm 跑。
 * 用法：node tools/verify-content.mjs [--chapter ch03] [--quiet]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');

const argv = process.argv.slice(2);
const onlyChapter = argv.includes('--chapter') ? argv[argv.indexOf('--chapter') + 1] : null;
const quiet = argv.includes('--quiet');

/* ---------- 加载 harness 与内容（与浏览器同一份代码） ---------- */
vm.runInThisContext(fs.readFileSync(path.join(root, 'assets/js/sandbox.js'), 'utf8'), { filename: 'sandbox.js' });
const HARNESS_SOURCE = globalThis.JSLAB_HARNESS_SOURCE;

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort();
for (const f of files) {
  vm.runInThisContext(fs.readFileSync(path.join(contentDir, f), 'utf8'), { filename: f });
}
const chapters = (globalThis.JSLAB_CHAPTERS || []).slice().sort((a, b) => (a.id < b.id ? -1 : 1));

/* ---------- 在 vm 里跑一个 job（与浏览器同一条执行路径） ---------- */
function runJob(job, timeoutMs = 6000) {
  const messages = [];
  let done = null;
  const send = (m) => {
    messages.push(m);
    if (m && m.type === 'done') done = m;
  };
  const sandbox = {
    JSLAB_JOB: job,
    JSLAB_SEND: send,
    console: { log() {}, info() {}, warn() {}, error() {} },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(HARNESS_SOURCE, ctx, { filename: 'harness' });

  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function poll() {
      if (done) {
        resolve({
          ...done,
          logs: messages.filter((m) => m.type === 'console').map((m) => m.text),
        });
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error('超时：harness 未回传 done（用户代码可能死循环）'));
        return;
      }
      setTimeout(poll, 5);
    })();
  });
}

/* ---------- 校验 ---------- */
const problems = [];
const stats = { chapters: 0, exercises: 0, examples: 0, prose: 0 };
const seenChapterIds = new Set();
const seenExerciseIds = new Set();
const seenExampleSeen = new Set();

function bad(where, msg) {
  problems.push(`${where} — ${msg}`);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

for (const ch of chapters) {
  const where = `[${ch.id}]`;
  stats.chapters++;
  if (!/^ch\d{2}$/.test(ch.id || '')) bad(where, `章节 id 必须是 chNN 形式，实际 ${JSON.stringify(ch.id)}`);
  if (seenChapterIds.has(ch.id)) bad(where, '章节 id 重复');
  seenChapterIds.add(ch.id);
  if (!isNonEmptyString(ch.title)) bad(where, '缺 title');
  if (!isNonEmptyString(ch.goal)) bad(where, '缺 goal');
  if (!Array.isArray(ch.sections) || !ch.sections.length) { bad(where, '缺 sections'); continue; }
  if (onlyChapter && ch.id !== onlyChapter) continue;

  for (const [i, sec] of ch.sections.entries()) {
    const sw = `${where} sections[${i}]`;
    if (!sec || typeof sec !== 'object') { bad(sw, '段落不是对象'); continue; }

    if (sec.kind === 'prose' || sec.kind === 'note') {
      if (!isNonEmptyString(sec.md)) bad(sw, `${sec.kind} 缺 md`);
      if (sec.kind === 'note' && sec.tone && sec.tone !== 'tip' && sec.tone !== 'warn') bad(sw, `note.tone 只能是 tip/warn`);
      stats.prose++;
    } else if (sec.kind === 'table') {
      if (!Array.isArray(sec.head) || !sec.head.length) bad(sw, 'table 缺 head');
      if (!Array.isArray(sec.rows) || !sec.rows.length) bad(sw, 'table 缺 rows');
      for (const r of sec.rows || []) {
        if (!Array.isArray(r) || r.length !== (sec.head || []).length) bad(sw, 'table 行列数与表头不一致');
      }
    } else if (sec.kind === 'code') {
      if (!isNonEmptyString(sec.code)) { bad(sw, 'code 段落缺 code'); continue; }
      if (sec.expect !== undefined && typeof sec.expect !== 'string') bad(sw, 'expect 必须是字符串');
      stats.examples++;
      const key = ch.id + '#' + i;
      if (seenExampleSeen.has(key)) bad(sw, '重复段落');
      seenExampleSeen.add(key);
      if (sec.needsDom) continue;
      try {
        const res = await runJob({ code: sec.code, tests: [] });
        if (res.error) bad(sw, `示例抛错：${res.error.name}: ${res.error.message}`);
        if (sec.expect !== undefined) {
          const actual = res.logs.join('\n').trim();
          const expected = sec.expect.trim();
          if (actual !== expected) bad(sw, `expect 与实际输出不一致\n      期望: ${JSON.stringify(expected)}\n      实际: ${JSON.stringify(actual)}`);
        }
      } catch (e) {
        bad(sw, `示例执行失败：${e.message}`);
      }
    } else if (sec.kind === 'exercise') {
      stats.exercises++;
      if (!isNonEmptyString(sec.id)) { bad(sw, '练习缺 id'); continue; }
      if (seenExerciseIds.has(sec.id)) bad(sw, `练习 id 重复：${sec.id}`);
      seenExerciseIds.add(sec.id);
      if (!/^ex\d{2}-\d+$/.test(sec.id)) bad(sw, `练习 id 建议 exNN-M 形式，实际 ${sec.id}`);
      const ew = `${where} ${sec.id}`;
      for (const f of ['title', 'task', 'starter', 'solution']) {
        if (!isNonEmptyString(sec[f])) bad(ew, `缺 ${f}`);
      }
      if (!Array.isArray(sec.tests) || sec.tests.length < 2) bad(ew, 'tests 至少要 2 条');
      if (!Array.isArray(sec.hints) || !sec.hints.length) bad(ew, 'hints 至少要 1 条');
      if (sec.starter === sec.solution) bad(ew, 'starter 与 solution 相同');
      if (sec.needsDom) {
        if (!quiet) console.log(`  · ${ew} 跳过执行校验（needsDom）`);
        continue;
      }

      try {
        const sol = await runJob({ code: sec.solution, tests: sec.tests });
        if (sol.error) bad(ew, `solution 抛错：${sol.error.name}: ${sol.error.message}`);
        else {
          const failed = sol.tests.filter((t) => t.pass !== true);
          if (failed.length) {
            bad(ew, `solution 未通过 ${failed.length}/${sec.tests.length} 条断言：\n      ` + failed.map((t) => `#${t.i} ${t.message}`).join('\n      '));
          }
        }
      } catch (e) {
        bad(ew, `solution 执行失败：${e.message}`);
      }

      try {
        const st = await runJob({ code: sec.starter, tests: sec.tests });
        const anyFail = !!st.error || st.tests.some((t) => t.pass === false);
        if (!anyFail) bad(ew, 'starter 居然全部通过（练习太松，断言抓不住空实现）');
      } catch (e) {
        // 起始代码超时/死循环也算「挂」
      }
    } else {
      bad(sw, `未知的 kind: ${JSON.stringify(sec.kind)}`);
    }
  }
}

/* ---------- 汇总 ---------- */
console.log(`\n内容统计：${stats.chapters} 章 · ${stats.exercises} 个练习 · ${stats.examples} 个可运行示例 · ${stats.prose} 个讲解段落`);
if (problems.length) {
  console.log(`\n发现 ${problems.length} 个问题：\n`);
  for (const p of problems) console.log('  ✗ ' + p);
  process.exit(1);
} else {
  console.log('\n✓ 全部通过：参考答案断言全过、起始代码都能被断言抓住、示例输出与 expect 逐字一致。\n');
}
