/* verify-ui.mjs — 浏览器端验收：起 http.server + 无头 Edge(CDP)，跑真实用户流程。
 *
 * 用法：node tools/verify-ui.mjs [--fast]      （--fast 跳过全量自测）
 * 覆盖：加载无脚本错误 / 侧栏与路由 / 练习卡渲染 / 真实输入→自动运行→断言全过 /
 *       错代码给出带「期望」的失败信息 / 示例运行输出与 expect 一致 / 全量自测（solution 全过 + starter 全挂）。
 * 截图落在 .cache/。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(root, '.cache');
fs.mkdirSync(CACHE, { recursive: true });

const EDGE = process.env.JSLAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = Number(process.env.JSLAB_CDP_PORT || 9223);
const HTTP_PORT = Number(process.env.JSLAB_HTTP_PORT || 8877);
const BASE = `http://127.0.0.1:${HTTP_PORT}`;
const FAST = process.argv.includes('--fast');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let failures = 0;

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

/* ---------- 起服务与浏览器 ---------- */
const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', 'js-lab-cdp');
const children = [];

function startServer() {
  const p = spawn('python', ['serve.py'], {
    cwd: root,
    env: { ...process.env, JSLAB_NO_OPEN: '1', JSLAB_KEEP: '1' },
    stdio: 'ignore',
  });
  children.push(p);
  return p;
}

function startBrowser() {
  const p = spawn(EDGE, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1400,900',
    'about:blank',
  ], { stdio: 'ignore' });
  children.push(p);
  return p;
}

async function waitHttp(url, timeoutMs = 15000) {
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

/* ---------- 最小 CDP 客户端 ---------- */
class CDP {
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
  send(method, params = {}, timeoutMs = 20000) {
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
  async eval(expression, { awaitPromise = false } = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
      userGesture: true,
    });
    if (r.exceptionDetails) {
      throw new Error(`页面异常: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    }
    return r.result?.value;
  }
  async waitFor(expression, timeoutMs = 30000, intervalMs = 200) {
    const deadline = Date.now() + timeoutMs;
    let last;
    while (Date.now() < deadline) {
      try {
        last = await this.eval(expression);
        if (last) return last;
      } catch (e) {
        last = e.message;
      }
      await sleep(intervalMs);
    }
    throw new Error(`waitFor 超时: ${expression}（最后一次: ${JSON.stringify(last)}）`);
  }
  async shot(name) {
    try {
      await this.send('Page.bringToFront', {}, 10000);
      const r = await this.send('Page.captureScreenshot', { format: 'png' }, 40000);
      const file = path.join(CACHE, name);
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
      return file;
    } catch (e) {
      console.log(`（截图 ${name} 失败：${e.message}，不影响结论）`);
      return null;
    }
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
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.bringToFront');
  return cdp;
}

/* ---------- 主流程 ---------- */
async function main() {
  startServer();
  startBrowser();
  if (!(await waitHttp(BASE, 15000))) throw new Error('http.server 没起来');
  const cdp = await connect();

  await cdp.send('Page.navigate', { url: `${BASE}/index.html` });
  await sleep(1200);
  await cdp.eval('localStorage.clear(); "ok"');
  await cdp.send('Page.reload', { ignoreCache: true });
  await sleep(1500);

  // 收集页面错误
  const installErrHook = `(() => {
    window.__errs = window.__errs || [];
    if (!window.__hook) {
      window.__hook = true;
      window.addEventListener('error', e => window.__errs.push(String(e.message)));
      window.addEventListener('unhandledrejection', e => window.__errs.push('rej: ' + String(e.reason && e.reason.message || e.reason)));
    }
    return window.__errs.length;
  })()`;
  await cdp.eval(installErrHook);

  /* --- 结构 --- */
  const chapters = await cdp.eval('(window.JSLAB_CHAPTERS || []).map(c => ({id: c.id, title: c.title, ex: c.sections.filter(s => s.kind === "exercise").length}))');
  const navCount = await cdp.eval('document.querySelectorAll(".nav-item[data-ch]").length');
  record('侧栏章节数与内容一致', navCount === chapters.length && navCount > 0, `${navCount} 章`);
  const totalEx = chapters.reduce((a, c) => a + c.ex, 0);
  record('内容规模合理', totalEx >= 40, `${chapters.length} 章 / ${totalEx} 练习`);

  const homeCards = await cdp.eval('document.querySelectorAll(".ch-card").length');
  record('总览页渲染章节卡', homeCards === chapters.length, `${homeCards} 张`);
  await cdp.shot('01-home.png');

  /* --- 路由 --- */
  const targetCh = chapters[Math.min(1, chapters.length - 1)];
  await cdp.eval(`location.hash = '${targetCh.id}'; "ok"`);
  await sleep(600);
  const h1 = await cdp.eval('document.querySelector("#main h1")?.textContent');
  record('章节路由切换正常', h1 === targetCh.title, `${h1}`);
  const cardCount = await cdp.eval('document.querySelectorAll(".ex-card").length');
  record('练习卡渲染', cardCount === targetCh.ex && cardCount > 0, `${cardCount} 张`);
  const rows = await cdp.eval('document.querySelectorAll(".ex-card .test-row").length');
  record('断言清单可见', rows >= 2, `${rows} 行`);
  const hlSpans = await cdp.eval('document.querySelectorAll(".editor-hl code span").length');
  record('编辑器有语法高亮叠层', hlSpans > 3, `${hlSpans} 个 span`);
  const exampleBtns = await cdp.eval('document.querySelectorAll(".example .btn").length');
  record('示例带运行按钮', exampleBtns > 0, `${exampleBtns} 个`);
  await cdp.shot('02-chapter.png');

  /* --- 示例运行：输出必须等于 expect 字段 --- */
  const expectExample = await cdp.eval(`(() => {
    const ch = window.JSLAB_CHAPTERS.find(c => c.id === '${targetCh.id}');
    let nth = -1;
    for (const s of ch.sections) {
      if (s.kind !== 'code') continue;
      nth++;
      if (s.expect) return { nth, expect: s.expect };
    }
    return null;
  })()`);
  if (expectExample) {
    await cdp.eval(`document.querySelectorAll('.example .btn')[${expectExample.nth}]?.click(); "ok"`);
    await sleep(1200);
    const out = await cdp.eval(`document.querySelectorAll('.example-out')[${expectExample.nth}]?.textContent || ''`);
    const cleaned = out.replace(/^输出\s*/, '').trim();
    const okOut = cleaned.includes(expectExample.expect.trim());
    record('示例运行输出与 expect 一致', okOut, okOut ? '' : `期望 ${JSON.stringify(expectExample.expect)} 实际 ${JSON.stringify(cleaned)}`);
  }

  /* --- 真实输入 → 自动运行 → 断言全过 --- */
  const firstEx = await cdp.eval(`(() => {
    const ch = window.JSLAB_CHAPTERS.find(c => c.id === '${targetCh.id}');
    const ex = ch.sections.find(s => s.kind === 'exercise');
    return { id: ex.id, solution: ex.solution, title: ex.title };
  })()`);

  const box = await cdp.eval(`(() => {
    const ta = document.querySelector('#${firstEx.id} .editor-ta');
    const r = ta.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + 40 };
  })()`);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await cdp.eval(`(() => { document.querySelector('#${firstEx.id} .editor-ta').focus(); document.execCommand('selectAll'); return 'ok'; })()`);
  await cdp.send('Input.insertText', { text: firstEx.solution });
  const typed = await cdp.eval(`document.querySelector('#${firstEx.id} .editor-ta').value`);
  record('真实键盘输入进入编辑器', typed.includes(firstEx.solution.trim().split('\n')[0]), `${typed.length} 字符`);

  let pill = '';
  try {
    await cdp.waitFor(`(() => { const p = document.querySelector('#${firstEx.id} .status-pill'); return p && /通过/.test(p.textContent); })()`, 20000);
    pill = await cdp.eval(`document.querySelector('#${firstEx.id} .status-pill').textContent`);
    record('自动运行后断言全部通过', /全部通过/.test(pill), pill);
  } catch (e) {
    pill = await cdp.eval(`document.querySelector('#${firstEx.id} .status-pill')?.textContent || ''`);
    record('自动运行后断言全部通过', false, `状态：${pill}`);
  }
  const okMarks = await cdp.eval(`document.querySelectorAll('#${firstEx.id} .test-mark.ok').length`);
  record('每条断言都显示 ✓', okMarks === (await cdp.eval(`window.JSLAB_CHAPTERS.find(c => c.id === '${targetCh.id}').sections.find(s => s.id === '${firstEx.id}').tests.length`)), `${okMarks} 条`);
  await cdp.shot('03-exercise-pass.png');

  /* --- 进度持久化 --- */
  const passedText = await cdp.eval(`document.getElementById('progress-text').textContent`);
  const navCount2 = await cdp.eval(`document.querySelector('.nav-item[data-ch="' + '${targetCh.id}' + '"] .nav-count').textContent`);
  record('通过后总进度与章节计数更新', /^[1-9]/.test(passedText) && /^[1-9]/.test(navCount2), `${passedText} / 章节 ${navCount2}`);

  /* --- 错代码必须给出「期望 / 实际」：用起始代码当答案 --- */
  const starterCode = await cdp.eval(`window.JSLAB_CHAPTERS.find(c => c.id === '${targetCh.id}').sections.find(s => s.id === '${firstEx.id}').starter`);
  await cdp.eval(`(() => { const ta = document.querySelector('#${firstEx.id} .editor-ta'); ta.focus(); document.execCommand('selectAll'); return 'ok'; })()`);
  await cdp.send('Input.insertText', { text: starterCode });
  try {
    await cdp.waitFor(`(() => { const m = document.querySelector('#${firstEx.id} .test-msg'); return m && m.textContent.length > 0; })()`, 20000);
  } catch {}
  const failMsg = await cdp.eval(`document.querySelector('#${firstEx.id} .test-msg')?.textContent || ''`);
  record('错误答案给出期望/实际信息', /期望/.test(failMsg) && /实际/.test(failMsg), failMsg.slice(0, 80));

  /* --- 括号自动配对：走真实按键路径（不是 insertText，insertText 不经过 keydown） --- */
  const taSel = `#${firstEx.id} .editor-ta`;
  const KEYDEF = {
    '(': { code: 'Digit9', vk: 57, text: '(' },
    ')': { code: 'Digit0', vk: 48, text: ')' },
    '[': { code: 'BracketLeft', vk: 219, text: '[' },
    ']': { code: 'BracketRight', vk: 219, text: ']' },
    '{': { code: 'BracketRight', vk: 221, text: '{' },
    "'": { code: 'Quote', vk: 222, text: "'" },
  };
  const setEditor = (text, selStart, selEnd) => cdp.eval(`(() => {
    const ta = document.querySelector('${taSel}');
    ta.focus();
    ta.value = ${JSON.stringify(text)};
    ta.selectionStart = ${selStart};
    ta.selectionEnd = ${selEnd == null ? selStart : selEnd};
    return 'ok';
  })()`);
  const readEditor = () => cdp.eval(`(() => {
    const ta = document.querySelector('${taSel}');
    return { value: ta.value, start: ta.selectionStart, end: ta.selectionEnd };
  })()`);
  async function pressKey(key) {
    const d = KEYDEF[key];
    const base = { key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk };
    await cdp.send('Input.dispatchKeyEvent', { ...base, type: 'keyDown', text: d.text, unmodifiedText: d.text });
    await cdp.send('Input.dispatchKeyEvent', { ...base, type: 'keyUp' });
    await sleep(90);
  }
  async function pressNamedKey(key, vk) {
    const base = { key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
    await cdp.send('Input.dispatchKeyEvent', { ...base, type: 'keyDown' });
    await cdp.send('Input.dispatchKeyEvent', { ...base, type: 'keyUp' });
    await sleep(90);
  }

  await setEditor('');
  await pressKey('(');
  let ap = await readEditor();
  record('敲 ( 自动补出闭括号，光标留在中间', ap.value === '()' && ap.start === 1 && ap.end === 1, JSON.stringify(ap));

  await pressKey(')');
  ap = await readEditor();
  record('闭括号已经等在光标后：跳过不重复', ap.value === '()' && ap.start === 2, JSON.stringify(ap));

  const hlText = await cdp.eval(`document.querySelector('${taSel.replace('.editor-ta', '.editor-hl')} code').textContent`);
  record('配对后高亮叠层跟着更新', hlText.trim() === '()', JSON.stringify(hlText.trim().slice(0, 20)));

  await setEditor('');
  await pressKey('{');
  await pressNamedKey('Backspace', 8);
  ap = await readEditor();
  record('空括号中间 Backspace 一次删掉一对', ap.value === '' && ap.start === 0, JSON.stringify(ap));

  await setEditor('abc', 0, 3);
  await pressKey('[');
  ap = await readEditor();
  record('选中内容被括号包住且保持选中', ap.value === '[abc]' && ap.start === 1 && ap.end === 4, JSON.stringify(ap));

  await setEditor('');
  await pressKey("'");
  ap = await readEditor();
  record('引号不自动补', ap.value === "'" && ap.start === 1, JSON.stringify(ap));

  await setEditor('x', 1, 1);
  const ime = await cdp.eval(`(() => {
    const ta = document.querySelector('${taSel}');
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true });
    ta.dispatchEvent(ev);
    return { prevented: ev.defaultPrevented, value: ta.value };
  })()`);
  record('输入法组合期间 Enter 不被编辑器拦下', ime.prevented === false && ime.value === 'x', JSON.stringify(ime));

  /* 把编辑器还原成起始代码，别让后面几节拿到半截括号 */
  await cdp.eval(`(() => {
    const ta = document.querySelector('${taSel}');
    ta.focus();
    ta.value = ${JSON.stringify(starterCode)};
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`);

  /* --- 全量自测 --- */
  await cdp.eval(`location.hash = 'home'; "ok"`);
  await sleep(400);
  if (!FAST) {
    console.log('\n跑全量自测（每个练习：参考答案必须全过、起始代码必须至少挂一条）…');
    const started = Date.now();
    await cdp.eval('window.JSLAB_SELFTEST().then(r => { window.__self = r; return "started"; })', { awaitPromise: false });
    try {
      await cdp.waitFor('!!window.__self', 600000, 1000);
      const self = await cdp.eval('window.__self');
      record('全量自测（含 DOM 类练习）', self.ok, `参考答案全过 ${self.solutionAllPass}/${self.total}，起始代码全部被抓住 ${self.starterAllFail}/${self.total}，用时 ${Math.round((Date.now() - started) / 1000)}s`);
      if (!self.ok) {
        for (const p of self.problems.slice(0, 12)) console.log(`        · ${p.id} ${p.kind} ${p.error || ''} ${JSON.stringify(p.failedTests || '')}`);
      }
    } catch (e) {
      record('全量自测（含 DOM 类练习）', false, e.message);
    }
  }

  /* --- 响应式排版：宽/中/窄三档 --- */
  async function probeLayout(w, h, chapterId) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await cdp.eval(`location.hash = '${chapterId}'; "ok"`);
    await sleep(450);
    return cdp.eval(`(() => {
      const c = document.querySelector('.content');
      const r = c.getBoundingClientRect();
      const main = document.querySelector('.main').getBoundingClientRect();
      const g = document.querySelector('.ex-card .ex-grid');
      const read = document.querySelector('.content > .md') || document.querySelector('.content .tbl-wrap') || document.querySelector('.content .example');
      const rr = read.getBoundingClientRect();
      const card = document.querySelector('.ex-card').getBoundingClientRect();
      const editor = document.querySelector('.ex-card .editor-box').getBoundingClientRect();
      const cons = document.querySelector('.ex-card > .console-box').getBoundingClientRect();
      const acts = document.querySelector('.ex-card > .ex-actions').getBoundingClientRect();
      const edges = [...document.querySelectorAll('.content .read > h1, .content .read > .md, .content .read > .note, .content .read > .tbl-wrap, .content .read > .example, .content .goal')]
        .map((e) => { const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right) }; });
      const lefts = edges.map((e) => e.l), rights = edges.map((e) => e.r);
      return {
        contentW: Math.round(r.width),
        gutterLeft: Math.round(r.left - main.left),
        gutterRight: Math.round(main.right - r.right),
        readW: Math.round(rr.width),
        readLeft: Math.round(rr.left - r.left),
        readRight: Math.round(r.right - rr.right),
        readBlocks: edges.length,
        readSpreadL: Math.max(...lefts) - Math.min(...lefts),
        readSpreadR: Math.max(...rights) - Math.min(...rights),
        cardW: Math.round(card.width),
        consoleIndent: Math.round(cons.left - editor.left),
        actionsIndent: Math.round(acts.left - editor.left),
        cols: getComputedStyle(g).gridTemplateColumns.split(' ').length,
        overflow: document.documentElement.scrollWidth - window.innerWidth
      };
    })()`);
  }

  const wide = await probeLayout(2000, 1100, targetCh.id);
  record('宽屏内容列填满并居中', wide.contentW >= 1500 && Math.abs(wide.gutterLeft - wide.gutterRight) <= 2 && wide.overflow <= 0,
    `内容宽 ${wide.contentW}px，左右留白 ${wide.gutterLeft}/${wide.gutterRight}px，溢出 ${wide.overflow}`);
  record('阅读区窄而居中（正文/示例/表格同宽）', wide.readW <= 860 && Math.abs(wide.readLeft - wide.readRight) <= 2,
    `阅读列 ${wide.readW}px，左右留白 ${wide.readLeft}/${wide.readRight}px`);
  record('标题/正文/提示/表格/示例左边缘完全对齐', wide.readSpreadL <= 2 && wide.readSpreadR <= 2 && wide.readBlocks >= 4,
    `${wide.readBlocks} 块，左边缘偏差 ${wide.readSpreadL}px，右边缘偏差 ${wide.readSpreadR}px`);
  record('练习卡用满宽屏（明显宽于阅读列）', wide.cardW > wide.readW + 300 && wide.cardW >= 1500,
    `练习卡 ${wide.cardW}px vs 阅读列 ${wide.readW}px`);
  record('宽屏练习卡三栏（说明 | 编辑器 | 预览）', wide.cols === 3, `grid 列数 ${wide.cols}`);
  record('控制台与按钮栏和编辑器列左对齐', Math.abs(wide.consoleIndent) <= 2 && Math.abs(wide.actionsIndent) <= 2,
    `偏移 ${wide.consoleIndent}/${wide.actionsIndent}px`);
  await cdp.shot('05-wide-2000.png');
  await cdp.eval(`window.scrollTo(0, document.querySelector('.ex-card').getBoundingClientRect().top + window.scrollY - 70); "ok"`);
  await sleep(400);
  await cdp.shot('06-wide-exercise.png');

  const mid = await probeLayout(1200, 900, targetCh.id);
  record('中屏练习卡两栏且不溢出', mid.cols === 2 && mid.overflow <= 0, `grid 列数 ${mid.cols}，溢出 ${mid.overflow}`);

  const narrow = await probeLayout(760, 900, targetCh.id);
  record('窄屏练习卡单栏堆叠且不溢出', narrow.cols === 1 && narrow.overflow <= 0, `grid 列数 ${narrow.cols}，溢出 ${narrow.overflow}`);

  /* --- 顶栏粘住：往下滚一屏后仍在视口顶部 ---
     踩过的坑：`html, body { height: 100% }` 会把 body 的 sticky 包含块限在一屏内，
     滚过一屏顶栏就被推走。窄屏的证据更硬——顶栏那条「目录」按钮直接点不到。 */
  async function probeStick(w, h) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await cdp.eval(`window.scrollTo(0, 0); "ok"`);
    await sleep(200);
    await cdp.eval(`window.scrollTo(0, 1600); "ok"`);
    await sleep(250);
    const m = await cdp.eval(`(() => {
      const t = document.querySelector('.topbar');
      const b = t.getBoundingClientRect();
      const btn = document.getElementById('nav-btn');
      const r = btn.getBoundingClientRect();
      return { top: Math.round(b.top), height: Math.round(b.height), scrollY: Math.round(window.scrollY),
        btnHit: (() => { const e = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)); return e ? (e.id || e.tagName) : null; })(),
        btnVisible: getComputedStyle(btn).display !== 'none' };
    })()`);
    await cdp.eval(`window.scrollTo(0, 0); "ok"`);
    await sleep(200);
    return m;
  }

  const stickWide = await probeStick(1400, 900);
  record('宽屏：往下滚一屏后顶栏仍粘在视口顶部', stickWide.top === 0 && stickWide.scrollY > 1000,
    `滚到 ${stickWide.scrollY}px，顶栏 top=${stickWide.top}`);
  const stickPhone = await probeStick(390, 844);
  record('窄屏：往下滚一屏后顶栏仍粘在顶部，且「目录」按钮点得到',
    stickPhone.top === 0 && stickPhone.btnHit === 'nav-btn',
    `顶栏 top=${stickPhone.top}，按钮位置命中 ${stickPhone.btnHit}`);

  /* --- 手机竖屏：目录抽屉 + 不横向溢出 + 输入控件不被浏览器放大 --- */
  async function probePhone(w, h) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
    await cdp.eval(`location.hash = '${targetCh.id}'; "ok"`);
    await sleep(400);
    return cdp.eval(`(() => {
      const sb = document.getElementById('sidebar');
      const cs = getComputedStyle(sb);
      return {
        vw: window.innerWidth,
        client: document.documentElement.clientWidth,
        scrollW: document.documentElement.scrollWidth,
        sidebarFixed: cs.position === 'fixed',
        /** 抽屉收起时侧栏用 visibility: hidden 藏起来（比只看 transform 可靠：不依赖过渡是否跑完） */
        drawerHidden: cs.visibility === 'hidden',
        btnVisible: getComputedStyle(document.getElementById('nav-btn')).display !== 'none',
        /** 正文拿回整屏宽度：抽屉形态下不该再被侧栏挤掉 240px */
        mainShare: Math.round(document.querySelector('.main').getBoundingClientRect().width / document.documentElement.clientWidth * 100),
        topbarH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
        /** 只量可见的编辑器（隐藏的 iframe 里的不算），取最小值 */
        editorFont: Math.min(...[...document.querySelectorAll('.editor-ta')]
          .filter((t) => t.offsetParent !== null)
          .map((t) => parseFloat(getComputedStyle(t).fontSize))),
        navMinH: Math.min(...[...document.querySelectorAll('.nav-item')].map((n) => Math.round(n.getBoundingClientRect().height))),
      };
    })()`);
  }

  const phone = await probePhone(390, 844);
  record('390px：目录栏收成抽屉（侧栏脱离文档流、正文拿回整屏）',
    phone.sidebarFixed && phone.mainShare >= 98, `侧栏 ${phone.sidebarFixed ? 'fixed' : '仍在流里'}，正文占 ${phone.mainShare}%`);
  record('390px：抽屉默认收起', phone.drawerHidden, `visibility ${phone.drawerHidden ? 'hidden' : '可见'}`);
  record('390px：顶栏放得下（不换行、不裁切）', phone.topbarH <= 60, `顶栏高 ${phone.topbarH}px`);
  record('390px：没有横向溢出', phone.scrollW <= phone.client + 1, `scrollWidth ${phone.scrollW} / clientWidth ${phone.client}`);
  record('390px：编辑器字号 ≥ 16px（否则手机浏览器会放大整页）', phone.editorFont >= 16, `${phone.editorFont}px`);
  record('390px：目录项够手指点（≥ 44px）', phone.navMinH >= 44, `最矮 ${phone.navMinH}px`);

  /* 点开抽屉：真点按钮，然后点一个章节链接，必须自动收起 */
  const openBox = await cdp.eval(`(() => {
    const b = document.getElementById('nav-btn').getBoundingClientRect();
    return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
  })()`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: openBox.x, y: openBox.y, button: 'left', clickCount: 1 });
  }
  await sleep(450);
  const opened = await cdp.eval(`(() => ({
    open: document.body.classList.contains('nav-open'),
    vis: getComputedStyle(document.getElementById('sidebar')).visibility,
    btn: document.getElementById('nav-btn').getAttribute('aria-expanded'),
  }))()`);
  record('点「目录」按钮能展开抽屉', opened.open === true && opened.vis === 'visible' && opened.btn === 'true', JSON.stringify(opened));

  await cdp.eval(`document.querySelector('.nav-item[data-ch="${targetCh.id}"]').click(); "ok"`);
  await sleep(500);
  const afterPick = await cdp.eval(`(() => ({
    open: document.body.classList.contains('nav-open'),
    vis: getComputedStyle(document.getElementById('sidebar')).visibility,
  }))()`);
  record('选完章节抽屉自动收起（不挡正文）', afterPick.open === false && afterPick.vis === 'hidden', JSON.stringify(afterPick));
  await cdp.shot('07-phone-390.png');
  await cdp.eval(`document.getElementById('nav-btn').click(); "ok"`);
  await sleep(300);
  await cdp.shot('08-phone-drawer.png');
  await cdp.eval(`document.getElementById('nav-backdrop').click(); "ok"`);
  await sleep(300);
  const afterBackdrop = await cdp.eval(`document.body.classList.contains('nav-open')`);
  record('点遮罩能收起抽屉', afterBackdrop === false, String(afterBackdrop));

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  const pageErrs = await cdp.eval('window.__errs || []');
  record('页面无未捕获脚本错误', pageErrs.length === 0, pageErrs.slice(0, 3).join(' | '));

  const alive = await cdp.eval(`(() => { const a = window.JSLAB_ALIVE; return a ? { open: a.readyState === 1, readyState: a.readyState } : null; })()`);
  record('页面挂上了保活长连接（关窗即退出用）', !!alive && alive.open, JSON.stringify(alive));

  /* --- 死循环保护（放最后：它会拖累渲染进程几秒） --- */
  const loopsCh = chapters.find((c) => c.id === 'ch03');
  if (loopsCh) {
    await cdp.eval(`location.hash = 'ch03'; "ok"`);
    await sleep(700);
    const anyEx = await cdp.eval(`(() => { const ch = window.JSLAB_CHAPTERS.find(c => c.id === 'ch03'); const ex = ch.sections.find(s => s.kind === 'exercise'); return ex.id; })()`);
    await cdp.eval(`(() => { const ta = document.querySelector('#${anyEx} .editor-ta'); ta.focus(); document.execCommand('selectAll'); return 'ok'; })()`);
    await cdp.send('Input.insertText', { text: 'let i = 0;\nwhile (true) { i++; }\n' });
    try {
      await cdp.waitFor(`(() => { const c = document.querySelector('#${anyEx} .console-box'); return c && /超时|强制停止/.test(c.textContent); })()`, 25000);
      record('死循环被超时掐掉并给出提示', true);
    } catch {
      const txt = await cdp.eval(`document.querySelector('#${anyEx} .console-box')?.textContent || ''`);
      record('死循环被超时掐掉并给出提示', false, txt.slice(0, 60));
    }
    await cdp.eval(`location.hash = 'home'; "ok"`);
    await sleep(400);
  }

  await cdp.shot('04-final.png');

  /* --- file:// 离线可用（双击 index.html 也能用） --- */
  try {
    const fileUrl = 'file:///' + root.replace(/\\/g, '/') + '/index.html';
    await cdp.send('Page.navigate', { url: fileUrl });
    await sleep(1800);
    const offline = await cdp.eval(`(() => {
      const navs = document.querySelectorAll('.nav-item[data-ch]').length;
      const chips = document.querySelectorAll('.ch-card').length;
      return { navs, chips, href: location.href.slice(0, 7) };
    })()`);
    record('file:// 直开可用（目录与总览渲染）', offline.navs === chapters.length && offline.chips === chapters.length, JSON.stringify(offline));

    await cdp.eval(`location.hash = 'ch01'; "ok"`);
    await sleep(700);
    // 上一轮跑过会在 file:// 源里留下「已通过」，先清干净再验，免得等到的其实是旧状态
    try { await cdp.eval(`localStorage.clear(); "ok"`); } catch {}
    await cdp.send('Page.reload', { ignoreCache: true });
    await sleep(1600);
    await cdp.eval(`location.hash = 'ch01'; "ok"`);
    await sleep(700);
    const sol1 = await cdp.eval(`window.JSLAB_CHAPTERS[0].sections.find(s => s.kind === 'exercise').solution`);
    await cdp.eval(`(() => { const ta = document.querySelector('.ex-card .editor-ta'); ta.value = ${JSON.stringify(sol1)}; ta.dispatchEvent(new Event('input', { bubbles: true })); return 'ok'; })()`);
    await cdp.waitFor(`(() => { const p = document.querySelector('.ex-card .status-pill'); return p && /通过/.test(p.textContent); })()`, 20000);
    const offlinePill = await cdp.eval(`document.querySelector('.ex-card .status-pill').textContent`);
    record('file:// 下沙箱照样能跑并全过', /全部通过/.test(offlinePill), offlinePill);
  } catch (e) {
    record('file:// 直开可用', false, e.message);
  }
}

main()
  .catch((e) => {
    record('验收流程', false, e.stack || e.message);
  })
  .finally(async () => {
    console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}（共 ${results.length} 项检查）`);
    console.log(`截图：${CACHE}`);
    for (const c of children) { try { c.kill(); } catch {} }
    await sleep(300);
    process.exit(failures === 0 ? 0 : 1);
  });
