import path from 'node:path';
import { spawn } from 'node:child_process';
import { CDP, sleep } from './cdp.mjs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cdpPort = 9301;
const url = process.argv[2] || 'file:///C:/Users/Naimio/projects/LightHouse/vue-lab/probe-file.html';
const b = spawn(EDGE, ['--remote-debugging-port=' + cdpPort,
  '--user-data-dir=' + path.join(process.env.LOCALAPPDATA, 'Temp', 'vuelab-fileprobe-' + cdpPort),
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  'about:blank'], { stdio: 'ignore' });
process.on('exit', () => { try { b.kill(); } catch {} });

await sleep(2600);
const ver = await (await fetch('http://127.0.0.1:' + cdpPort + '/json/version')).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
const cdp = new CDP(ws);
const t = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
await cdp.send('Page.enable', {}, 60000, sessionId);
await cdp.send('Runtime.enable', {}, 60000, sessionId);
console.log('url = ' + url);
await cdp.send('Page.navigate', { url }, 60000, sessionId);
await sleep(4500);
const r = await cdp.send('Runtime.evaluate', { expression: "document.getElementById('out').textContent", returnByValue: true }, 60000, sessionId);
console.log(r.exceptionDetails ? 'ERR ' + JSON.stringify(r.exceptionDetails) : r.result.value);
b.kill();
process.exit(0);
