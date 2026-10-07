/* verify-fresh.mjs — 验证「每次进站都拿到最新代码」，也就是关窗即退出的前提。
 *
 * 复现用户踩到的场景：浏览器里已经缓存了旧版页面（旧 CSS + 旧 app.js），
 * 用同一个 URL 再打开时浏览器不会重新加载 → 排版是旧的、保活连接不存在 → 窗口不关。
 *
 * 做法：先用一个「老式静态服务器 + 旧副本」把浏览器缓存毒化，
 * 再切到 serve.py，打开它打印出来的带令牌 URL，断言拿到的是新页面；
 * 最后关掉页面，断言 serve.py 自己退出。
 *
 * 用法：node tools/verify-fresh.mjs
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(root, '.cache');
const POISON = path.join(CACHE, 'poison-root');
const PORT = Number(process.env.H5LAB_FRESH_PORT || 8878);
const CDP_PORT = Number(process.env.H5LAB_CDP_PORT || 9226);
const EDGE = process.env.H5LAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const GRACE = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const children = [];

function record(name, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

/* ---------- 造一份「旧版」副本，并用老式服务器把它塞进浏览器缓存 ---------- */
function buildPoisonRoot() {
  fs.rmSync(POISON, { recursive: true, force: true });
  fs.mkdirSync(POISON, { recursive: true });
  for (const dir of ['assets', 'content', 'docs']) {
    fs.cpSync(path.join(root, dir), path.join(POISON, dir), { recursive: true });
  }
  fs.copyFileSync(path.join(root, 'index.html'), path.join(POISON, 'index.html'));

  // 旧 app.js：没有保活连接（拿掉 keepAlive 的调用）
  const appPath = path.join(POISON, 'assets', 'js', 'app.js');
  let app = fs.readFileSync(appPath, 'utf8');
  app = app.replace('    keepAlive();\n', '');
  fs.writeFileSync(appPath, app + '\nwindow.__STALE = 1;\n');

  // 旧 app.css：没有 .read/.work 容器，还带着当年那套「每个块自己居中」的写法
  // （就是用户截图里那种「一半居中一半靠左」）
  const cssPath = path.join(POISON, 'assets', 'css', 'app.css');
  let css = fs.readFileSync(cssPath, 'utf8');
  css = css.replace('.read { width: 100%; max-width: var(--read-max); margin-inline: auto; }', '.read { width: 100%; max-width: none; }');
  css += '\n.md { max-width: 44em; margin-inline: auto; }\n';
  fs.writeFileSync(cssPath, css);

  // 旧 base.css：把阅读列宽度令牌改掉，好区分新旧 CSS 是否真的换过来了
  const basePath = path.join(POISON, 'assets', 'css', 'base.css');
  fs.writeFileSync(basePath, fs.readFileSync(basePath, 'utf8').replace('--read-max: 820px;', '--read-max: 600px;'));

  // 把改动时间往前挪一天，让浏览器按启发式规则把旧副本缓存住（老式服务器没有 no-store）
  const dayAgo = Date.now() / 1000 - 86400;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else fs.utimesSync(p, dayAgo, dayAgo);
    }
  };
  walk(POISON);
}

function startPoisonServer() {
  const p = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', POISON], {
    cwd: root, stdio: 'ignore',
  });
  children.push(p);
  return p;
}

function startServe(token = '') {
  const p = spawn('python', ['serve.py'], {
    cwd: root,
    env: { ...process.env, H5LAB_NO_OPEN: '1', H5LAB_PORT: String(PORT), H5LAB_IDLE_GRACE: String(GRACE), H5LAB_TOKEN: token },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(p);
  let out = '';
  p.stdout.on('data', (d) => { out += String(d); });
  p.stderr.on('data', (d) => { out += String(d); });
  p.getOut = () => out;
  return p;
}

async function waitHttp(url, timeoutMs = 15000, expectOk = true) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (!expectOk || r.ok || r.status === 302) return true;
    } catch {}
    await sleep(150);
  }
  return false;
}

/* ---------- 最小 CDP 客户端 ---------- */
class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject, timer } = this.pending.get(m.id);
        clearTimeout(timer); this.pending.delete(m.id);
        if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
      }
    });
  }
  send(method, params = {}, timeoutMs = 20000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP 超时: ' + method)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error('页面异常: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result?.value;
  }
}

async function connect() {
  await waitHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
  const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && !/^(chrome|edge|devtools):/.test(t.url));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.bringToFront');
  return cdp;
}

/* 页面上的排版探针：阅读块左右边缘的极差（旧版会是几十像素，新版是 0） */
const PROBE = `(() => {
  const blocks = [...document.querySelectorAll('.content .read > h1, .content .read > .md, .content .read > .tbl-wrap, .content .read > .case')];
  const lefts = blocks.map(e => e.getBoundingClientRect().left);
  const rights = blocks.map(e => e.getBoundingClientRect().right);
  return {
    stale: window.__STALE === 1,
    readMax: getComputedStyle(document.documentElement).getPropertyValue('--read-max').trim(),
    blocks: blocks.length,
    spreadL: Math.round(Math.max(...lefts) - Math.min(...lefts)),
    spreadR: Math.round(Math.max(...rights) - Math.min(...rights)),
    alive: window.H5LAB_ALIVE ? window.H5LAB_ALIVE.readyState : -1,
    url: location.href,
    stored: localStorage.getItem('h5lab.probe')
  };
})()`;

async function waitExit(proc, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) return proc.exitCode;
    await sleep(200);
  }
  return null;
}

async function main() {
  buildPoisonRoot();

  const browser = spawn(EDGE, [
    '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${path.join(process.env.LOCALAPPDATA || '', 'Temp', 'html5-lab-fresh')}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1600,1000', 'about:blank',
  ], { stdio: 'ignore' });
  children.push(browser);

  const poison = startPoisonServer();
  const cdp = await connect();

  /* --- 1. 用老式服务器把旧副本塞进浏览器缓存 --- */
  if (!(await waitHttp(`http://127.0.0.1:${PORT}/index.html`))) throw new Error('旧式服务器没起来');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html#ch02` });
  await sleep(1800);
  await cdp.eval(`localStorage.setItem('h5lab.probe', 'keep-me'); "ok"`);
  const before = await cdp.eval(PROBE);
  record('缓存毒化成功：浏览器拿到的是旧版页面', before.stale === true && before.blocks >= 4 && before.spreadL > 2,
    `旧版标记=${before.stale}，阅读块 ${before.blocks} 个，左边缘极差 ${before.spreadL}px（探针确实能抓到旧行为）`);
  const oldReadMax = before.readMax;
  poison.kill();
  await sleep(800);

  /* --- 2. 切到 serve.py，打开它给的新入口 URL --- */
  const srv = startServe();
  await waitHttp(`http://127.0.0.1:${PORT}/`, 15000);
  await sleep(500);
  const entry = (srv.getOut().match(/http:\/\/127\.0\.0\.1:\d+\/index\.html\?v=\w+/) || [])[0];
  record('serve.py 打印带令牌的入口 URL', !!entry, entry || srv.getOut().split('\n')[0]);

  const html = await fetch(`http://127.0.0.1:${PORT}/index.html`, { redirect: 'manual' });
  record('裸地址会被 302 到带令牌的地址', html.status === 302 && /index\.html\?v=/.test(html.headers.get('location') || ''),
    `${html.status} → ${html.headers.get('location')}`);

  const full = await fetch(entry);
  const body = await full.text();
  record('HTML 响应禁止缓存并顺手清缓存', /no-store/.test(full.headers.get('cache-control') || '') && /"cache"/.test(full.headers.get('clear-site-data') || ''),
    `cache-control=${full.headers.get('cache-control')} · clear-site-data=${full.headers.get('clear-site-data')}`);
  const token = (entry.match(/v=(\w+)/) || [])[1];
  const stamped = (body.match(/\?v=/g) || []).length;
  record('HTML 里的资源都带上了令牌', stamped >= 12 && body.includes(`assets/css/app.css?v=${token}`), `${stamped} 处`);

  await cdp.send('Page.navigate', { url: entry + '#ch02' });
  await sleep(2200);
  const after = await cdp.eval(PROBE);
  record('入口 URL 拿到的是新页面（不再是缓存旧版）', after.stale === false, `旧版标记=${after.stale}`);
  record('新页面里 CSS 是新的（阅读列生效）', after.readMax && after.readMax !== oldReadMax && after.readMax === '820px',
    `--read-max=${after.readMax}（旧版为 ${oldReadMax}）`);
  record('新页面排版对齐（左右边缘极差 0）', after.blocks > 0 && after.spreadL <= 2 && after.spreadR <= 2,
    `${after.blocks} 块，极差 ${after.spreadL}/${after.spreadR}px`);
  record('新页面挂上了保活连接', after.alive === 1, `readyState=${after.alive}`);
  record('清缓存不影响练习进度（localStorage 还在）', after.stored === 'keep-me', String(after.stored));

  /* --- 3. 关掉页面 → serve.py 自己退出（终端窗口跟着关） --- */
  await cdp.send('Page.navigate', { url: 'about:blank' });
  const code = await waitExit(srv, (GRACE + 12) * 1000);
  record('关掉页面后 serve.py 自己退出', code === 0, `退出码 ${code}`);
}

main()
  .catch((e) => record('验收流程', false, e.stack || e.message))
  .finally(async () => {
    console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
    for (const c of children) { try { c.kill(); } catch {} }
    await sleep(300);
    process.exit(failures === 0 ? 0 : 1);
  });
