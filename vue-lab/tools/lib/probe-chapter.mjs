/* probe-chapter.mjs — 只跑一章的浏览器自测，给写章节的人自查用。
 *
 *   node tools/lib/probe-chapter.mjs ch05
 *
 * 它会起 http 服务 + 无头 Edge，跑 VUELAB_SELFTEST({chapter:'ch05'})，把结果打成可读的几行。
 * 前台 terminal 超时别超过 600s，并用 < /dev/null 重定向。
 */
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EDGE = process.env.VUELAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ONLY = process.argv[2] || null;
const httpPort = Number(process.env.VUELAB_HTTP_PORT || 8885);
const cdpPort = Number(process.env.VUELAB_CDP_PORT || 9293);

const server = spawn('python', ['serve.py'], {
  cwd: ROOT,
  env: { ...process.env, VUELAB_NO_OPEN: '1', VUELAB_KEEP: '1', VUELAB_PORT: String(httpPort) },
  stdio: 'ignore'
});
const browser = spawn(EDGE, [
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', 'vuelab-ch-' + cdpPort)}`,
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'
], { stdio: 'ignore' });
const cleanup = () => { try { browser.kill(); } catch {} try { server.kill(); } catch {} };
process.on('exit', cleanup);

await sleep(2800);
const ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
const cdp = new CDP(ws);
const t = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const S = (m, p) => cdp.send(m, p, 300000, sessionId);
await S('Page.enable', {});
await S('Runtime.enable', {});
await S('Page.navigate', { url: `http://127.0.0.1:${httpPort}/index.html` });
await sleep(3500);

const r = await S('Runtime.evaluate', {
  expression: `window.VUELAB_SELFTEST(${JSON.stringify(ONLY ? { chapter: ONLY } : {})}).then(x => JSON.stringify(x))`,
  returnByValue: true, awaitPromise: true
});
if (r.exceptionDetails) {
  console.log('自测抛错：' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
} else {
  const rep = JSON.parse(r.result.value);
  console.log(`示例 ${rep.demos.pass}/${rep.demos.total} · 参考答案 ${rep.exercises.solutionAllPass}/${rep.exercises.total} · 起始代码被抓 ${rep.exercises.starterAllFail}/${rep.exercises.total}`);
  if (rep.problems.length) {
    console.log('问题：');
    rep.problems.forEach(p => console.log(`  · ${p.where} — ${p.kind}：${p.detail}`));
  } else {
    console.log('没有未通过项。');
  }
}
cleanup();
process.exit(0);
