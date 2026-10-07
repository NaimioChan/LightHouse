/* verify-browser.mjs — 内容行为校验：在真浏览器里跑每个示例的自检、每个练习的参考解与起始代码。
 *
 * 为什么浏览器这一层不能省：vendor 的三个文件要在真实页面里被 classic <script> 加载（file:// 下尤其），
 * 沙箱 iframe 里的运行器也只有浏览器里才有；node 侧（verify-types.mjs）用的是 vm，
 * 两者的日志格式化虽然同源，加载路径与沙箱行为仍要按真环境验一次。
 *
 * 页面里的 TSLAB_SELFTEST() 是唯一实现，这个脚本只是把它驱动起来、把结果抄出来。
 * 用法：node tools/verify-browser.mjs [--chapter ch05] [--skip-file] [--headful]
 * 环境变量：TSLAB_EDGE / TSLAB_CDP_PORT(9225) / TSLAB_HTTP_PORT(8879)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(root, '.cache');
fs.mkdirSync(CACHE, { recursive: true });

const EDGE = process.env.TSLAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = Number(process.env.TSLAB_CDP_PORT || 9225);
const HTTP_PORT = Number(process.env.TSLAB_HTTP_PORT || 8879);
const BASE = `http://127.0.0.1:${HTTP_PORT}`;
const argv = process.argv.slice(2);
const chapter = argv.includes('--chapter') ? argv[argv.indexOf('--chapter') + 1] : null;
const skipFile = argv.includes('--skip-file');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const files = fs.readdirSync(path.join(root, 'content')).filter((f) => f.endsWith('.js')).sort();
if (!files.length) {
  console.log('content/ 里还没有内容文件。');
  process.exit(1);
}

const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `tslab-cdp-${CDP_PORT}`);
const children = [];

function startServer() {
  const p = spawn('python', ['serve.py'], {
    cwd: root,
    env: { ...process.env, TSLAB_NO_OPEN: '1', TSLAB_KEEP: '1', TSLAB_PORT: String(HTTP_PORT) },
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
  if (!process.env.TSLAB_HEADFUL) args.unshift('--headless=new');
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

async function armErrorCollector(cdp) {
  await cdp.eval(`(() => {
    window.__errs = [];
    window.addEventListener('error', (e) => __errs.push(String((e && e.message) || (e.target && (e.target.src || e.target.href)) || 'unknown')));
    window.addEventListener('unhandledrejection', (e) => __errs.push('rej: ' + String((e.reason && e.reason.message) || e.reason)));
    return true;
  })()`);
}

/** 载入页面 → 等编译器就绪 → 跑自测并轮询结果 */
async function runSelftest(cdp, url, label, timeoutMs, onlyChapter) {
  await cdp.send('Page.navigate', { url });
  await cdp.waitFor('typeof window.TSLAB_SELFTEST === "function"', 30000);
  await armErrorCollector(cdp);
  await cdp.waitFor('window.TSLAB_COMPILER_READY || (document.getElementById("boot-strip") && document.getElementById("boot-strip").className.indexOf("failed") >= 0) || null', 120000, 500);
  const strip = await cdp.eval('document.getElementById("boot-strip") ? document.getElementById("boot-strip").hidden : "missing"');
  const bootMs = await cdp.eval('window.TSLAB_COMPILER_READY ? window.TSLAB_COMPILER_READY.ms : -1');
  console.log(`[${label}] 编译器就绪：${bootMs >= 0 ? bootMs + ' ms' : '没有就绪'}　提示条已隐藏：${strip}`);

  const filterArg = onlyChapter ? `{ chapter: ${JSON.stringify(onlyChapter)}, skipWarmup: true }` : '{ skipWarmup: true }';
  await cdp.eval(`window.TSLAB_SELFTEST(${filterArg}).then(r => { window.__report = r; return true; })`);
  const report = await cdp.waitFor('window.__report || null', timeoutMs, 1000);
  const errs = await cdp.eval('window.__errs || []');
  return { report, errs, bootMs, strip };
}

function printReport(label, { report, errs }) {
  console.log(`\n[${label}] 示例自检：${report.demos.pass}/${report.demos.total} 通过`);
  console.log(`[${label}] 练习：参考解全过 ${report.exercises.solutionAllPass}/${report.exercises.total} · 起始代码被抓住 ${report.exercises.starterAllFail}/${report.exercises.total}`);
  let fail = false;
  if (errs.length) {
    fail = true;
    console.log(`[${label}] 页面报了 ${errs.length} 个错：\n` + errs.slice(0, 10).map((e) => '  ✗ ' + e).join('\n'));
  }
  if (report.problems.length) {
    fail = true;
    console.log(`[${label}] 发现 ${report.problems.length} 个问题：`);
    for (const p of report.problems) console.log(`  ✗ ${p.where} — ${p.kind}${p.detail ? '：' + p.detail : ''}`);
  }
  return fail;
}

async function main() {
  startServer();
  startBrowser();
  if (!(await waitHttp(BASE, 20000))) throw new Error(`http.server 没起来（端口 ${HTTP_PORT}）`);
  const cdp = await connect();

  console.log(`载入 ${files.length} 个内容文件${chapter ? `（只验 ${chapter}）` : ''} …`);
  let fail = false;

  /* 一、run.bat 那条路（http） */
  const started = Date.now();
  const http = await runSelftest(cdp, `${BASE}/index.html?v=verify`, 'http', 900000, chapter);
  fail = printReport('http', http) || fail;
  console.log(`[http] 用时 ${Math.round((Date.now() - started) / 1000)}s`);

  /* 二、双击 index.html 那条路（file://）：默认只跑第一章，够证明 vendor 与沙箱在 file:// 下都活得下来 */
  if (!skipFile) {
    const fileUrl = 'file:///' + path.join(root, 'index.html').replace(/\\/g, '/');
    const one = chapter || (files[0].match(/^(ch\d+)/) || [])[1] || 'ch01';
    console.log(`[file://] 只验 ${one}（file:// 这一趟是证明 vendor 与沙箱可用）`);
    const fileRes = await runSelftest(cdp, fileUrl, 'file://', 900000, one);
    fail = printReport('file://', fileRes) || fail;
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
