/* 一次性探针：跑 VUELAB_SELFTEST，并读预览 iframe 的真实渲染结果。 */
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const httpPort = 8893, cdpPort = 9282;

const server = spawn('python', ['-m', 'http.server', String(httpPort)], { cwd: ROOT, stdio: 'ignore' });
const browser = spawn(EDGE, [
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${path.join(process.env.LOCALAPPDATA, 'Temp', 'vuelab-selftest-' + cdpPort)}`,
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'
], { stdio: 'ignore' });
const cleanup = () => { try { browser.kill(); } catch {} try { server.kill(); } catch {} };
process.on('exit', cleanup);

await sleep(2500);
const ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
const cdp = new CDP(ws);
const t = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const S = (m, p) => cdp.send(m, p, 180000, sessionId);
await S('Page.enable', {});
await S('Runtime.enable', {});
await S('Page.navigate', { url: `http://127.0.0.1:${httpPort}/index.html` });
await sleep(3000);

const selftest = await S('Runtime.evaluate', {
  expression: 'window.VUELAB_SELFTEST().then(r => JSON.stringify(r))',
  returnByValue: true, awaitPromise: true
});
console.log('=== SELFTEST ===');
console.log(selftest.exceptionDetails ? 'ERR ' + JSON.stringify(selftest.exceptionDetails.exception?.description) : selftest.result.value);

// 预览 iframe 的真实渲染：从父页面读不到（opaque origin），改从 iframe 自己的执行上下文读
const frames = await S('Page.getFrameTree', {});
function collect(tree, acc = []) { acc.push(tree.frame); (tree.childFrames || []).forEach(c => collect(c, acc)); return acc; }
const all = collect(frames.frameTree);
console.log('=== FRAMES ===');
for (const f of all) console.log(f.id + ' ' + (f.url || '').slice(0, 60));
const previewFrame = all.find(f => f.url === 'about:srcdoc' || f.url === '');
if (previewFrame) {
  const r = await cdp.send('Runtime.evaluate', {
    expression: 'document.body.innerHTML.slice(0,200)', returnByValue: true
  }, 60000, previewFrame.id);
  console.log('preview body = ' + (r.exceptionDetails ? 'ERR' : JSON.stringify(r.result.value)));
}
cleanup();
process.exit(0);
