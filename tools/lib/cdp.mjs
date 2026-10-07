/* tools/lib/cdp.mjs — 起根 serve.py、起无头 Edge、连 CDP 的那一套，给入口页的验收脚本用。
 *
 * 与各站各自的同名文件是同一份骨架，差别只有两处：这里起的是仓库根的 serve.py（端口 8876 起），
 * 环境变量前缀是 LIGHTHOUSE_。同一台机器上并行跑两个验收脚本时用环境变量错开端口：
 *   LIGHTHOUSE_HTTP_PORT / LIGHTHOUSE_CDP_PORT
 * Edge 的 --user-data-dir 必须带端口号：共用一个 profile 时第二个实例起不来或抢调试端口。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const EDGE = process.env.LIGHTHOUSE_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export function paths({ cdpPort, httpPort }) {
  return {
    cdpPort,
    httpPort,
    base: `http://127.0.0.1:${httpPort}`,
    userDataDir: path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `lighthouse-cdp-${cdpPort}`),
  };
}

export function startServer(env, port) {
  return spawn('python', ['serve.py'], {
    cwd: ROOT,
    env: { ...process.env, LIGHTHOUSE_NO_OPEN: '1', LIGHTHOUSE_KEEP: '1', LIGHTHOUSE_PORT: String(port), ...(env || {}) },
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
  async waitFor(expression, timeoutMs = 60000, intervalMs = 250, evalTimeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    let last;
    while (Date.now() < deadline) {
      try {
        last = await this.eval(expression, { timeoutMs: Math.min(evalTimeoutMs, Math.max(1000, deadline - Date.now())) });
        if (last) return last;
      } catch (e) { last = e.message; }
      await sleep(intervalMs);
    }
    throw new Error(`waitFor 超时: ${expression}（最后一次: ${JSON.stringify(last)}）`);
  }
  /** 清掉已收集的事件（导航前调用，便于按页面统计网络错误） */
  clearEvents() { this.events.length = 0; }
  /** 本轮收集到的失败请求（>=400 或直接失败），返回 ['404 url', ...] */
  failedRequests() {
    const out = [];
    /* requestId → URL：loadingFailed 事件本身不带 URL，得从 requestWillBeSent 反查 */
    const urlById = new Map();
    for (const e of this.events) {
      if (e.method === 'Network.requestWillBeSent') urlById.set(e.params.requestId, e.params.request.url);
    }
    for (const e of this.events) {
      if (e.method === 'Network.responseReceived' && e.params.response.status >= 400) {
        out.push(`${e.params.response.status} ${e.params.response.url}`);
      }
      if (e.method === 'Network.loadingFailed') {
        const url = urlById.get(e.params.requestId) || '(未知请求)';
        const canceled = e.params.canceled ? '（被导航取消）' : '';
        out.push(`FAILED ${e.params.errorText}${canceled} ${e.params.type} ${url}`);
      }
    }
    return out;
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
