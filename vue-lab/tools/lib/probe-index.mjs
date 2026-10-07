/* tools/lib/probe-index.mjs — 打开真的 index.html，按 hash 走一遍，读回页面状态。 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EDGE = process.env.VUELAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export async function probeIndex({ cdpPort = 9281, httpPort = 8892, steps = [] } = {}) {
  const server = spawn('python', ['-m', 'http.server', String(httpPort)], { cwd: ROOT, stdio: 'ignore' });
  const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `vuelab-idx-${cdpPort}`);
  const browser = spawn(EDGE, [
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userDataDir}`,
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=1500,1000', 'about:blank'
  ], { stdio: 'ignore' });
  const cleanup = () => { try { browser.kill(); } catch {} try { server.kill(); } catch {} };
  process.on('exit', cleanup);

  await sleep(2500);
  const ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const cdp = new CDP(ws);
  const t = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  const S = (m, p) => cdp.send(m, p, 120000, sessionId);
  await S('Page.enable', {});
  await S('Runtime.enable', {});
  await S('Network.enable', {});
  await S('Page.navigate', { url: `http://127.0.0.1:${httpPort}/index.html` });
  await sleep(2500);

  const out = [];
  // 收集页面错误
  await S('Runtime.evaluate', { expression: "window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message||e.target.src)));1" });
  for (const step of steps) {
    if (step.hash) {
      await S('Runtime.evaluate', { expression: `location.hash=${JSON.stringify(step.hash)};1` });
    }
    await sleep(step.wait || 2500);
    const r = await S('Runtime.evaluate', {
      expression: step.expr, returnByValue: true, awaitPromise: !!step.await
    });
    if (r.exceptionDetails) {
      out.push({ label: step.label, error: r.exceptionDetails.exception?.description || r.exceptionDetails.text });
    } else {
      out.push({ label: step.label, value: r.result.value });
    }
  }
  const errs = await S('Runtime.evaluate', { expression: 'JSON.stringify(window.__errs||[])', returnByValue: true });
  cleanup();
  return { out, errs: errs.result.value };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const steps = [
    { label: 'stats', expr: 'JSON.stringify(window.VUELAB_STATS)' },
    { label: 'boot strip hidden', expr: 'document.getElementById("boot-strip").hidden' },
    { label: 'sidebar count', expr: 'document.querySelectorAll("#sidebar .nav-item").length' },
    { hash: '#ch01', wait: 6000, label: 'ch01 basics',
      expr: 'JSON.stringify({cases:document.querySelectorAll("#main .case").length,cards:document.querySelectorAll("#main .ex-card").length,previews:document.querySelectorAll("#main .preview-frame").length,notes:Array.prototype.map.call(document.querySelectorAll(".case-note"),n=>n.style.display+"|"+n.textContent.slice(0,80))})' },
    { label: 'preview1 html', expr: 'document.querySelectorAll("#main .preview-frame")[0] ? "iframe ok" : "none"' },
    { label: 'case foots', expr: 'JSON.stringify(Array.prototype.map.call(document.querySelectorAll(".case-foot"),n=>n.textContent.slice(0,90)))' },
    { label: 'test marks', expr: 'JSON.stringify(Array.prototype.map.call(document.querySelectorAll("#main .test-row .test-mark"),n=>n.textContent))' }
  ];
  const r = await probeIndex({ steps });
  for (const o of r.out) console.log(o.label + ' => ' + (o.error ? 'ERR ' + o.error : JSON.stringify(o.value)));
  console.log('PAGE ERRORS: ' + r.errs);
  process.exit(0);
}
