/* verify-browser.mjs — 真浏览器行为校验（最权威的一层）。
 *
 * 走 http 与 file:// 两条路，用页面里的 VUELAB_SELFTEST() 把每个练习跑两遍
 * （参考答案必须全过、起始代码必须挂），并检查零页错误、无 404。
 *
 * 用法：
 *   node tools/verify-browser.mjs                      # http + file://
 *   node tools/verify-browser.mjs --chapter ch05       # 只跑一章
 *   node tools/verify-browser.mjs --skip-file          # 跳过 file:// 那轮
 *
 * 前台 terminal 超时 >600s 会被提升为后台进程然后带 `stdin is not a tty` 死掉，
 * 所以调用方要写：`node tools/verify-browser.mjs > .cache/b.txt 2>&1 < /dev/null` 且 timeout ≤ 600。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './lib/cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = process.env.VUELAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? (process.argv[i + 1] === undefined ? true : process.argv[i + 1]) : d; };
const ONLY = arg('--chapter', null);
const SKIP_FILE = !!arg('--skip-file', false);

let failures = 0;
function record(name, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

async function withBrowser(label, url, { cdpPort, httpPort, server = null, waitMs = 3000 }) {
  const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `vuelab-vb-${cdpPort}`);
  const browser = spawn(EDGE, [
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userDataDir}`,
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=1500,1000', 'about:blank'
  ], { stdio: 'ignore' });

  const kill = () => { try { browser.kill(); } catch {} };
  try {
    await sleep(2600);
    const ver = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
    const ws = new WebSocket(ver.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
    const cdp = new CDP(ws);
    const t = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
    const S = (m, p) => cdp.send(m, p, 180000, sessionId);
    await S('Page.enable', {});
    await S('Runtime.enable', {});
    await S('Network.enable', {});
    await S('Network.setCacheDisabled', { cacheDisabled: true });

    /* 收集页错误与失败请求 */
    const fails = [];
    const origEvents = cdp.events;
    await S('Runtime.evaluate', {
      expression: "window.__errs=[];window.addEventListener('error',e=>__errs.push(String((e&&e.message)||(e.target&&(e.target.src||e.target.href))||'?')));window.addEventListener('unhandledrejection',e=>__errs.push('rej:'+String(e.reason&&e.reason.message||e.reason)));1"
    });

    await S('Page.navigate', { url });
    /* 等页面把自测钩子挂上（首屏之后才能好；file:// 上还要解析近 1 MB 的 vendor 字符串包） */
    let waited = 0;
    while (waited < 30000) {
      const t = await S('Runtime.evaluate', { expression: 'typeof window.VUELAB_SELFTEST', returnByValue: true });
      if (t.result.value === 'function') break;
      await sleep(400);
      waited += 400;
    }

    const loc = await S('Runtime.evaluate', { expression: 'JSON.stringify({href:location.href, title:document.title, hasMain:!!document.getElementById("main"), scripts:document.scripts.length})', returnByValue: true });
    console.log(`      [${label}] 页面状态：${loc.result.value}`);
    const stats = await S('Runtime.evaluate', { expression: 'JSON.stringify(window.VUELAB_STATS||null)', returnByValue: true });
    const errs = await S('Runtime.evaluate', { expression: 'JSON.stringify(window.__errs||[])', returnByValue: true });

    const selftest = await S('Runtime.evaluate', {
      expression: `window.VUELAB_SELFTEST(${JSON.stringify(ONLY ? { chapter: ONLY } : {})}).then(r => JSON.stringify(r))`,
      returnByValue: true, awaitPromise: true
    });

    /* 收失败请求（404 之类），favicon 不算 */
    const bad = cdp.events
      .filter(e => e.method === 'Network.responseReceived' && e.params && e.params.response)
      .map(e => e.params.response)
      .filter(r => r.status >= 400 && !/favicon/.test(r.url));

    kill();
    return { stats: stats.result.value, errs: errs.result.value, selftest, bad, origEvents };
  } catch (e) {
    kill();
    throw e;
  }
}

function judge(label, r) {
  const errs = JSON.parse(r.errs || '[]');
  record(`${label}：页面零错误`, errs.length === 0, errs.slice(0, 3).join(' | '));

  const badReq = r.bad;
  record(`${label}：资源无 404`, badReq.length === 0, badReq.slice(0, 3).map(x => x.status + ' ' + x.url).join(' | '));

  if (r.selftest.exceptionDetails) {
    record(`${label}：自测能跑完`, false, r.selftest.exceptionDetails.exception?.description || r.selftest.exceptionDetails.text);
    return null;
  }
  const rep = JSON.parse(r.selftest.result.value);
  record(`${label}：示例全过`, rep.demos.pass === rep.demos.total, `${rep.demos.pass}/${rep.demos.total}`);
  record(`${label}：参考答案全过`, rep.exercises.solutionAllPass === rep.exercises.total, `${rep.exercises.solutionAllPass}/${rep.exercises.total}`);
  record(`${label}：起始代码全被抓`, rep.exercises.starterAllFail === rep.exercises.total, `${rep.exercises.starterAllFail}/${rep.exercises.total}`);
  if (rep.problems.length) {
    rep.problems.slice(0, 8).forEach(p => console.log(`      · ${p.where} — ${p.kind}：${p.detail}`));
  }
  return rep;
}

/* ---------- http 一轮 ---------- */
const httpPort = Number(process.env.VUELAB_HTTP_PORT || 8882);
const server = spawn('python', ['serve.py'], {
  cwd: ROOT,
  env: { ...process.env, VUELAB_NO_OPEN: '1', VUELAB_KEEP: '1', VUELAB_PORT: String(httpPort) },
  stdio: 'ignore'
});
await sleep(1200);
try {
  const r = await withBrowser('http', `http://127.0.0.1:${httpPort}/index.html`, { cdpPort: 9291, httpPort, waitMs: 3500 });
  const rep = judge('http', r);
  if (rep) console.log(`      http 规模：${JSON.stringify(JSON.parse(r.stats || 'null'))}`);
} finally {
  try { server.kill(); } catch {}
}

/* ---------- file:// 一轮 ---------- */
if (!SKIP_FILE) {
  const fileUrl = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
  const r = await withBrowser('file://', fileUrl, { cdpPort: 9292, httpPort: 0, waitMs: 4500 });
  judge('file://', r);
}

console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
