/* verify-browser.mjs — 内容行为校验：在真浏览器里跑每个示例的自检、每个练习的参考解与起始代码。
 *
 * 为什么必须在浏览器里跑：断言打的是真实 DOM 与计算样式（`style('x','padding')` 之类），node 没有 DOM。
 * 页面里的 H5LAB_SELFTEST() 是唯一实现，这个脚本只是把它驱动起来、把结果抄出来。
 *
 * 用法：node tools/verify-browser.mjs [--chapter ch05]
 * 环境变量：H5LAB_EDGE / H5LAB_CDP_PORT(9224) / H5LAB_HTTP_PORT(8878) / H5LAB_HEADFUL=1
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(root, '.cache');
fs.mkdirSync(CACHE, { recursive: true });

const EDGE = process.env.H5LAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = Number(process.env.H5LAB_CDP_PORT || 9224);
const HTTP_PORT = Number(process.env.H5LAB_HTTP_PORT || 8878);
const BASE = `http://127.0.0.1:${HTTP_PORT}`;
const argv = process.argv.slice(2);
const chapter = argv.includes('--chapter') ? argv[argv.indexOf('--chapter') + 1] : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const files = fs.readdirSync(path.join(root, 'content')).filter((f) => f.endsWith('.js')).sort();
if (!files.length) {
  console.log('content/ 里还没有内容文件。');
  process.exit(1);
}

const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `html5-lab-cdp-${CDP_PORT}`);
const children = [];

function startServer() {
  const p = spawn('python', ['serve.py'], {
    cwd: root,
    env: { ...process.env, H5LAB_NO_OPEN: '1', H5LAB_KEEP: '1', H5LAB_PORT: String(HTTP_PORT) },
    stdio: 'ignore',
  });
  children.push(p);
  return p;
}

function startBrowser() {
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1400,900',
    'about:blank',
  ];
  if (!process.env.H5LAB_HEADFUL) args.unshift('--headless=new');
  const p = spawn(EDGE, args, { stdio: 'ignore' });
  children.push(p);
  return p;
}

async function waitHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {}
    await sleep(200);
  }
  return false;
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject, timer } = this.pending.get(msg.id);
        clearTimeout(timer);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}, timeoutMs = 60000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP 超时: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, { awaitPromise = false, timeoutMs = 60000 } = {}) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise, userGesture: true }, timeoutMs);
    if (r.exceptionDetails) {
      throw new Error(`页面异常: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    }
    return r.result?.value;
  }
  async waitFor(expression, timeoutMs = 60000, intervalMs = 300) {
    const deadline = Date.now() + timeoutMs;
    let last;
    while (Date.now() < deadline) {
      try {
        last = await this.eval(expression);
        if (last) return last;
      } catch (e) { last = e.message; }
      await sleep(intervalMs);
    }
    throw new Error(`waitFor 超时: ${expression}（最后一次: ${JSON.stringify(last)}）`);
  }
}

async function connect() {
  await waitHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
  const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && !/^(chrome|edge|devtools):/.test(t.url));
  if (!page) throw new Error('找不到可用的 page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Page.bringToFront');
  return cdp;
}

async function main() {
  startServer();
  startBrowser();
  if (!(await waitHttp(BASE, 20000))) throw new Error(`http.server 没起来（端口 ${HTTP_PORT}）`);
  const cdp = await connect();

  const url = `${BASE}/tools/selftest.html?files=${encodeURIComponent(files.join(','))}`;
  console.log(`载入 ${files.length} 个内容文件${chapter ? `（只验 ${chapter}）` : ''} …`);
  await cdp.send('Page.navigate', { url });
  await cdp.waitFor('typeof window.H5LAB_SELFTEST === "function"', 30000);

  /* 页面自己报的错也要收集：脚本 404、tag 写错都在这里现形 */
  await cdp.eval(`(() => {
    window.__errs = window.__errs || [];
    window.addEventListener('error', (e) => window.__errs.push(String((e && e.message) || (e.target && e.target.src) || 'unknown')));
    window.addEventListener('unhandledrejection', (e) => window.__errs.push('rej: ' + String(e.reason && e.reason.message || e.reason)));
    return true;
  })()`);

  const filterArg = chapter ? `{ chapter: ${JSON.stringify(chapter)} }` : 'undefined';
  const started = Date.now();
  await cdp.eval(`window.H5LAB_SELFTEST(${filterArg}).then(r => { window.__report = r; return "done"; })`, { awaitPromise: false });
  const report = await cdp.waitFor('window.__report || null', 900000, 1000);
  const secs = Math.round((Date.now() - started) / 1000);

  const errs = await cdp.eval('window.__errs || []');
  const loaded = await cdp.eval('(window.__LOADED || []).length');

  console.log(`\n示例自检：${report.demos.pass}/${report.demos.total} 通过`);
  console.log(`练习：参考解全过 ${report.exercises.solutionAllPass}/${report.exercises.total} · 起始代码被抓住 ${report.exercises.starterAllFail}/${report.exercises.total}`);
  console.log(`载入内容文件 ${loaded} 个 · 用时 ${secs}s`);

  let fail = false;
  if (errs.length) {
    fail = true;
    console.log(`\n页面报了 ${errs.length} 个错：\n` + errs.slice(0, 10).map((e) => '  ✗ ' + e).join('\n'));
  }
  if (report.problems.length) {
    fail = true;
    console.log(`\n发现 ${report.problems.length} 个问题：\n`);
    for (const p of report.problems) console.log(`  ✗ ${p.where} — ${p.kind}${p.detail ? '：' + p.detail : ''}`);
  }
  if (!fail) console.log('\n✓ 行为校验通过：示例自检全过、参考解全过、起始代码都能被断言抓住。\n');
  process.exitCode = fail ? 1 : 0;
}

main()
  .catch((e) => {
    console.log('✗ 校验流程失败：' + (e.stack || e.message));
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const c of children) { try { c.kill(); } catch {} }
    await sleep(300);
    process.exit(process.exitCode || 0);
  });
