/* tools/lib/cdp.mjs — 起 serve.py、起无头 Edge、连 CDP 的那一套，给几个验收脚本共用。
 *
 * 端口默认按脚本区分（见各自文件），同一台机器上并行跑两个验收脚本时用环境变量错开：
 *   VUELAB_CDP_PORT / VUELAB_HTTP_PORT
 * Edge 的 --user-data-dir 必须带上端口号：共用一个 profile 时第二个实例起不来或抢调试端口。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const EDGE = process.env.VUELAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export function paths({ cdpPort, httpPort }) {
  return {
    cdpPort,
    httpPort,
    base: `http://127.0.0.1:${httpPort}`,
    userDataDir: path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `vuelab-cdp-${cdpPort}`),
  };
}

export function startServer(env, port) {
  return spawn('python', ['serve.py'], {
    cwd: ROOT,
    env: { ...process.env, VUELAB_NO_OPEN: '1', VUELAB_KEEP: '1', VUELAB_PORT: String(port), ...(env || {}) },
    stdio: 'ignore',
  });
}

export function startBrowser({ cdpPort, userDataDir, headless = true, windowSize = '1600,1000' }) {
  const args = [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `--window-size=${windowSize}`,
    'about:blank',
  ];
  if (headless) args.unshift('--headless=new');
  return spawn(EDGE, args, { stdio: 'ignore' });
}

export async function waitHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.ok || r.status === 302) return true;
    } catch {}
    await sleep(200);
  }
  return false;
}

export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject, timer } = this.pending.get(msg.id);
        clearTimeout(timer);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  send(method, params = {}, timeoutMs = 60000, sessionId = null) {
    const id = ++this.id;
    const payload = sessionId ? { id, method, params, sessionId } : { id, method, params };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP 超时: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify(payload));
    });
  }
  async eval(expression, { awaitPromise = false, timeoutMs = 60000 } = {}) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise, userGesture: true }, timeoutMs);
    if (r.exceptionDetails) {
      throw new Error(`页面异常: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    }
    return r.result?.value;
  }
  async waitFor(expression, timeoutMs = 60000, intervalMs = 250, evalTimeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    let last;
    while (Date.now() < deadline) {
      try {
        /* 单次求值也给上限：页面在解析 12 MB 编译器时主线程会被占住，
           一次评估卡 60 秒会把整个 waitFor 的时间预算吃光（file:// 上尤其明显） */
        last = await this.eval(expression, { timeoutMs: Math.min(evalTimeoutMs, Math.max(1000, deadline - Date.now())) });
        if (last) return last;
      } catch (e) { last = e.message; }
      await sleep(intervalMs);
    }
    throw new Error(`waitFor 超时: ${expression}（最后一次: ${JSON.stringify(last)}）`);
  }
}

export async function connect(ctx) {
  await waitHttp(`http://127.0.0.1:${ctx.cdpPort}/json/version`);
  const list = await (await fetch(`http://127.0.0.1:${ctx.cdpPort}/json/list`)).json();
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

/** 收集页面里的未捕获错误（脚本 404、语法错、未处理拒绝） */
export async function armErrorCollector(cdp) {
  await cdp.eval(`(() => {
    window.__errs = [];
    window.addEventListener('error', (e) => __errs.push(String((e && e.message) || (e.target && (e.target.src || e.target.href)) || 'unknown')));
    window.addEventListener('unhandledrejection', (e) => __errs.push('rej: ' + String((e.reason && e.reason.message) || e.reason)));
    return true;
  })()`);
}

export function reporter() {
  let failures = 0;
  const record = (name, pass, detail = '') => {
    if (!pass) failures++;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  };
  return {
    record,
    get failures() { return failures; },
    finish() {
      console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
      return failures === 0 ? 0 : 1;
    },
  };
}

export function killAll(children) {
  for (const c of children) { try { c.kill(); } catch {} }
}

export function cacheDir() {
  const dir = path.join(ROOT, '.cache');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
