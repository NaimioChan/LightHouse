/* tools/lib/probe.mjs — 起一个静态服务 + 无头 Edge，打开指定页面并读回 #out 的文本。 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EDGE = process.env.VUELAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export async function probe(page, { cdpPort = 9271, httpPort = 8885, waitMs = 9000 } = {}) {
  const server = spawn('python', ['-m', 'http.server', String(httpPort)], { cwd: ROOT, stdio: 'ignore' });
  const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `vuelab-cdp-${cdpPort}`);
  const browser = spawn(EDGE, [
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userDataDir}`,
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=1400,900', 'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => { try { browser.kill(); } catch {} try { server.kill(); } catch {} };
  process.on('exit', cleanup);

  try {
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
    await cdp.send('Page.enable', {}, 60000, sessionId);
    await cdp.send('Runtime.enable', {}, 60000, sessionId);
    const url = /^https?:/.test(page) ? page : `http://127.0.0.1:${httpPort}/${page}`;
    await cdp.send('Page.navigate', { url }, 60000, sessionId);
    await sleep(waitMs);
    const r = await cdp.send('Runtime.evaluate', {
      expression: "document.getElementById('out').textContent", returnByValue: true
    }, 60000, sessionId);
    return { text: r.result.value, url };
  } finally {
    cleanup();
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const page = process.argv[2] || 'probe-engine.html';
  const waitMs = process.argv[3] ? Number(process.argv[3]) : 9000;
  const r = await probe(page, { waitMs });
  console.log(`--- ${r.url} ---`);
  console.log(r.text);
}
