/* verify-all.mjs — 把各座训练场里「不需要浏览器」的那几支校验跑一遍，汇总结果。
 *
 * 覆盖：内容契约（字段、参考答案、起始代码必须挂断言、示例输出逐字比对）、编辑器括号配对、
 * ts-lab 的类型判题与编译器自检、以及各站自带 serve.py 的关窗即退（verify-quit.mjs）。
 * 需要真浏览器的深度验收不在这里（各站自己的 verify-ui / verify-browser / verify-pages），见 docs/02-verification.md。
 *
 * 用法：
 *   node tools/verify-all.mjs           # 全部
 *   node tools/verify-all.mjs --fast    # 跳过 verify-quit.mjs（省 1 分钟）
 *   node tools/verify-all.mjs --lab js  # 只跑一座站
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/cdp.mjs';

const argv = process.argv.slice(2);
const fast = argv.includes('--fast');
const only = argv.includes('--lab') ? argv[argv.indexOf('--lab') + 1] : null;

/* 站列表从清单读（加站不用改这里）；每座站跑它自己有的那几支 node 侧校验。
   缺哪支脚本就跳过哪支（verify-types 只有 ts-lab 有，verify-compile 只有 vue-lab 有）。 */
const SCRIPTS = ['verify-content.mjs', 'verify-pair.mjs', 'verify-types.mjs', 'verify-judge.mjs', 'verify-compile.mjs', 'verify-quit.mjs'];
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'labs.json'), 'utf8'))
  .map((lab) => ({ dir: lab.dir, scripts: SCRIPTS }));

function run(cwd, script) {
  return new Promise((resolve) => {
    const started = Date.now();
    const p = spawn(process.execPath, [path.join('tools', script)], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => resolve({ code, ms: Date.now() - started, out }));
  });
}

const cache = path.join(ROOT, '.cache');
fs.mkdirSync(cache, { recursive: true });
const log = [];
let failed = 0;

for (const station of PLAN) {
  if (only && !station.dir.startsWith(only)) continue;
  const cwd = path.join(ROOT, station.dir);
  const scripts = fast ? station.scripts.filter((s) => s !== 'verify-quit.mjs') : station.scripts;
  console.log(`\n=== ${station.dir} ===`);
  for (const script of scripts) {
    if (!fs.existsSync(path.join(cwd, 'tools', script))) continue;
    const r = await run(cwd, script);
    const tail = r.out.trim().split('\n').filter((l) => l.trim()).slice(-1)[0] || '';
    const ok = r.code === 0;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${script.padEnd(20)} ${String((r.ms / 1000).toFixed(1)).padStart(6)}s  ${tail.slice(0, 90)}`);
    fs.writeFileSync(path.join(cache, `${station.dir}-${script.replace('.mjs', '')}.txt`), r.out);
    log.push({ dir: station.dir, script, code: r.code, ms: r.ms });
  }
}

const total = log.length;
console.log(`\n各站共 ${total} 支校验：${failed === 0 ? '全部通过' : failed + ' 支失败（完整输出在 .cache/）'}`);
if (failed) {
  console.log('失败明细：');
  for (const l of log.filter((x) => x.code !== 0)) console.log(`  ${l.dir}/tools/${l.script}（退出码 ${l.code}）`);
}
process.exit(failed ? 1 : 0);
