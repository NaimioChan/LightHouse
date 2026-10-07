/* verify-types.mjs — 内容的行为校验（node，不需要浏览器）。
 *
 * 跑的是浏览器里那份判题内核（assets/js/judge.js）：每个示例的 checks 必须全过；
 * 每个练习的参考答案必须让全部断言通过；起始代码必须至少挂一条（否则这道题抓不住空实现）。
 * 断言里写 await run() 的，这里用 vm 跑编译产物（tools/lib/node-exec.mjs），与浏览器沙箱对等。
 *
 * 用法：
 *   node tools/verify-types.mjs              全量
 *   node tools/verify-types.mjs --chapter ch05
 *   node tools/verify-types.mjs --quiet      只打印问题与合计
 */
import path from 'node:path';
import { bootJudge, readAllChapters, ROOT } from './lib/env.mjs';
import { makeExec } from './lib/node-exec.mjs';

const argv = process.argv.slice(2);
const only = (argv.includes('--chapter') ? argv[argv.indexOf('--chapter') + 1] : null);
const quiet = argv.includes('--quiet');

const JUDGE = bootJudge();
const exec = makeExec();

const report = { demos: { total: 0, pass: 0 }, exercises: { total: 0, solutionPass: 0, starterCaught: 0 }, problems: [] };
const t0 = Date.now();

const chapters = readAllChapters(path.join(ROOT, 'content'), only);
if (!chapters.length) {
  console.log('没有匹配的内容文件' + (only ? '（--chapter ' + only + '）' : '') + '。');
  process.exit(1);
}

function problem(where, kind, detail) { report.problems.push({ where, kind, detail }); }

/* 与页面里 assets/js/render.js 的 wantsRun 同规则：作者明确要、或断言里 await run() 才跑；
   带模块语法的代码不跑（产物是 ESM，当普通脚本执行只会得到「不能用模块语法」）。 */
function wantsRun(code, tests, explicit) {
  if (explicit) return true;
  if (/(^|[^\w.])run\s*\(/.test((tests || []).join('\n'))) return true;
  return !/^\s*(import|export)\s/m.test(String(code || ''));
}

for (const { chapter } of chapters) {
  const line = { demos: [0, 0], ex: [0, 0, 0] };

  for (let i = 0; i < (chapter.sections || []).length; i++) {
    const sec = chapter.sections[i];
    const where = chapter.id + ' sections[' + i + ']' + (sec.id ? ' ' + sec.id : '') + (sec.caption ? ' ' + sec.caption : '');

    if (sec.kind === 'demo') {
      report.demos.total++; line.demos[0]++;
      const res = await JUDGE.runCase(sec.code, {
        tests: sec.checks || [], tsconfig: sec.tsconfig, exec, alwaysRun: wantsRun(sec.code, sec.checks, sec.run)
      });
      const bad = res.results.filter((r) => r.pass === false).map((r) => r.label + ' → ' + r.message);
      if (res.runError) bad.push('运行产物时出错：' + res.runError.name + ': ' + res.runError.message);
      if (res.error) problem(where, '示例自检抛错', res.error.message);
      else if (bad.length) problem(where, '示例自检未过', bad.join('；'));
      else { report.demos.pass++; line.demos[1]++; }
      continue;
    }

    if (sec.kind !== 'exercise') continue;
    report.exercises.total++; line.ex[0]++;

    const sol = await JUDGE.runCase(sec.solution, { tests: sec.tests, tsconfig: sec.tsconfig, exec, alwaysRun: wantsRun(sec.solution, sec.tests, false) });
    const solBad = sol.results.filter((r) => r.pass !== true);
    if (sol.error) problem(where, '参考解抛错', sol.error.message);
    else if (sol.results.length !== (sec.tests || []).length) problem(where, '参考解的断言没跑完', sol.results.length + '/' + (sec.tests || []).length);
    else if (solBad.length) problem(where, '参考解没全过', solBad.map((r) => r.label + ' → ' + r.message).join('；'));
    else { report.exercises.solutionPass++; line.ex[1]++; }

    const st = await JUDGE.runCase(sec.starter, { tests: sec.tests, tsconfig: sec.tsconfig, exec });
    const caught = !!st.error || st.results.some((r) => r.pass === false);
    if (caught) { report.exercises.starterCaught++; line.ex[2]++; }
    else problem(where, '起始代码居然全过了', '这道题抓不住空实现，starter 与 solution 的差距不够');
  }

  if (!quiet) {
    console.log(chapter.id + '  示例 ' + line.demos[1] + '/' + line.demos[0] +
      '　练习 ' + line.ex[0] + ' 道：参考解全过 ' + line.ex[1] + '，起始代码被抓 ' + line.ex[2]);
  }
}

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log('');
if (report.problems.length) {
  console.log('问题 ' + report.problems.length + ' 项：');
  report.problems.forEach((p) => console.log('  [' + p.kind + '] ' + p.where + '\n      ' + p.detail));
} else {
  console.log('没有发现问题。');
}
console.log('合计：示例 ' + report.demos.pass + '/' + report.demos.total + ' 全过；练习 ' + report.exercises.total +
  ' 道 —— 参考解全过 ' + report.exercises.solutionPass + '，起始代码至少挂一条 ' + report.exercises.starterCaught + '。用时 ' + secs + 's');
process.exit(report.problems.length ? 1 : 0);
