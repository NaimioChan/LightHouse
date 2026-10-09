/* verify-pages.mjs — 逐章打开一遍，抓「这一页有没有炸」。
 *
 * verify-browser.mjs 验的是内容本身（参考解能不能过断言），它在离屏容器里跑，不进真实页面。
 * 这个脚本补的是另一半：真的把每一章都渲染出来，看示例窗有没有自检失败、预览 iframe 有没有缺、
 * 控制台有没有未捕获错误。内容改多了以后这一步最能抓到「排版/渲染」类问题。
 *
 * 用法：node tools/verify-pages.mjs [--shots]
 * 环境变量：TWLAB_EDGE / TWLAB_PAGES_CDP_PORT(9246) / TWLAB_PAGES_HTTP_PORT(8892)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(root, '.cache');
fs.mkdirSync(CACHE, { recursive: true });

const EDGE = process.env.TWLAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = Number(process.env.TWLAB_PAGES_CDP_PORT || 9246);
const HTTP_PORT = Number(process.env.TWLAB_PAGES_HTTP_PORT || 8892);
const BASE = `http://127.0.0.1:${HTTP_PORT}`;
const SHOTS = process.argv.includes('--shots');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const children = [];
let failures = 0;

function record(name, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

children.push(spawn('python', ['serve.py'], {
  cwd: root, env: { ...process.env, TWLAB_NO_OPEN: '1', TWLAB_KEEP: '1', TWLAB_PORT: String(HTTP_PORT) }, stdio: 'ignore',
}));
children.push(spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `tailwind-lab-pages-${CDP_PORT}`)}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1600,1000', 'about:blank',
], { stdio: 'ignore' }));

async function waitHttp(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await sleep(200);
  }
  return false;
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject, timer } = this.pending.get(m.id);
        clearTimeout(timer); this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      }
    });
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP 超时: ' + method)); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 60000) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }, timeoutMs);
    if (r.exceptionDetails) throw new Error('页面异常: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result?.value;
  }
  async shot(name) {
    try {
      await this.send('Page.bringToFront', {}, 10000);
      const r = await this.send('Page.captureScreenshot', { format: 'png' }, 40000);
      fs.writeFileSync(path.join(CACHE, name), Buffer.from(r.data, 'base64'));
    } catch (e) { console.log(`（截图 ${name} 失败：${e.message}）`); }
  }
}

async function main() {
  if (!(await waitHttp(`http://127.0.0.1:${CDP_PORT}/json/version`))) throw new Error('浏览器没起来');
  if (!(await waitHttp(`${BASE}/index.html`))) throw new Error(`serve.py 没起来（端口 ${HTTP_PORT}）`);
  const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });

  await cdp.send('Page.navigate', { url: `${BASE}/index.html` });
  await sleep(1500);
  await cdp.eval(`(() => {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push(String((e && e.message) || 'unknown')));
    window.addEventListener('unhandledrejection', e => window.__errs.push('rej: ' + String(e.reason && e.reason.message || e.reason)));
    return true;
  })()`);

  const chapters = await cdp.eval('(window.TWLAB_CHAPTERS || []).map(c => ({ id: c.id, title: c.title, ex: c.sections.filter(s => s.kind === "exercise").length, demo: c.sections.filter(s => s.kind === "demo").length }))');
  console.log(`逐章打开 ${chapters.length} 章 …\n`);

  for (const ch of chapters) {
    await cdp.eval(`location.hash = '${ch.id}'; "ok"`);
    /* 练习卡是分帧渲染的，等最后一个帧出来 */
    await sleep(1200 + ch.ex * 90);

    const st = await cdp.eval(`(() => {
      const cards = [...document.querySelectorAll('.ex-card')];
      return {
        cards: cards.length,
        cases: document.querySelectorAll('.case').length,
        frames: document.querySelectorAll('.preview-frame').length,
        expectedFrames: cards.length + document.querySelectorAll('.case').length,
        caseNotes: [...document.querySelectorAll('.case-note')].filter(n => n.style.display !== 'none').length,
        caseNoteText: ([...document.querySelectorAll('.case-note')].filter(n => n.style.display !== 'none')[0] || {}).textContent || '',
        badMarks: document.querySelectorAll('.test-mark.bad').length,
        emptyBoxes: [...document.querySelectorAll('.ex-card .preview-box')].filter(b => !b.querySelector('.preview-frame')).length,
        errs: (window.__errs || []).slice()
      };
    })()`);
    const ok = st.cards === ch.ex && st.cases === ch.demo && st.frames === st.expectedFrames
      && st.caseNotes === 0 && st.badMarks === 0 && st.emptyBoxes === 0 && st.errs.length === 0;
    record(`${ch.id} ${ch.title}`,
      ok,
      `练习卡 ${st.cards}/${ch.ex} · 示例 ${st.cases}/${ch.demo} · 预览窗 ${st.frames}/${st.expectedFrames} · 空窗 ${st.emptyBoxes} · 示例自检失败 ${st.caseNotes} · 未捕获错误 ${st.errs.length}`
        + (st.caseNoteText ? ` · ${st.caseNoteText.slice(0, 120)}` : '')
        + (st.errs.length ? ` · ${st.errs.slice(0, 2).join(' | ')}` : ''));
    if (SHOTS) await cdp.shot(`page-${ch.id}.png`);
  }

  await cdp.eval(`location.hash = 'playground'; "ok"`);
  await sleep(1800);
  const pg = await cdp.eval(`(() => ({
    panes: document.querySelectorAll('.pg-grid .ed-tab').length,
    frame: !!document.querySelector('.pg-grid .preview-frame'),
    errs: (window.__errs || []).length
  }))()`);
  record('练习场', pg.panes === 3 && pg.frame && pg.errs === 0, JSON.stringify(pg));

  /* 讲解区的对照表：单元格里的反引号必须渲染成等宽代码，不能是字面反引号 */
  const tblCh = await cdp.eval(`(() => {
    const chs = window.TWLAB_CHAPTERS || [];
    for (const ch of chs) {
      const t = ch.sections.find(s => s.kind === 'table' && (s.rows || []).some(r => r.some(c => String(c).includes('\`'))));
      if (t) return ch.id;
    }
    return null;
  })()`);
  if (tblCh) {
    await cdp.eval(`location.hash = '${tblCh}'; "ok"`);
    await sleep(1500);
    const tbl = await cdp.eval(`(() => {
      const cells = [...document.querySelectorAll('.tbl td')];
      return {
        cells: cells.length,
        code: cells.filter(td => td.querySelector('code')).length,
        literal: cells.filter(td => td.textContent.includes('\`')).length
      };
    })()`);
    record('对照表的单元格渲染行内代码', tbl.code > 0 && tbl.literal === 0,
      `${tblCh}：${tbl.cells} 个单元格，其中 ${tbl.code} 个含等宽代码，字面反引号 ${tbl.literal} 个`);
  }

  console.log(`\n${failures === 0 ? '✓ 每一章都渲染正常' : '✗ ' + failures + ' 章有问题'}${SHOTS ? '（截图在 .cache/）' : ''}\n`);
}

main()
  .catch((e) => record('逐章渲染', false, e.stack || e.message))
  .finally(async () => {
    for (const c of children) { try { c.kill(); } catch {} }
    await sleep(300);
    process.exit(failures === 0 ? 0 : 1);
  });
