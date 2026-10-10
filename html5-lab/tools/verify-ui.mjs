/* verify-ui.mjs — 浏览器端验收：起 serve.py + 无头 Edge(CDP)，走真实用户流程。
 *
 * 用法：node tools/verify-ui.mjs [--fast]      （--fast 跳过全量自测）
 * 覆盖：加载无脚本错误 / 侧栏与路由 / 练习卡与示例渲染 / 页签切换 / 真实输入→自动校验→断言全过 /
 *       错代码给出带「期望」的失败信息 / 三档视口排版对齐 / 死循环被超时掐掉 / 保活连接 /
 *       file:// 双击直开可用 / 全量自测（示例自检 + 参考解全过 + 起始代码全挂）。
 * 截图落在 .cache/。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(root, '.cache');
fs.mkdirSync(CACHE, { recursive: true });

const EDGE = process.env.H5LAB_EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = Number(process.env.H5LAB_UI_CDP_PORT || 9225);
const HTTP_PORT = Number(process.env.H5LAB_UI_HTTP_PORT || 8887);
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

const userDataDir = path.join(process.env.LOCALAPPDATA || process.env.TEMP, 'Temp', `html5-lab-ui-${CDP_PORT}`);
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
  send(method, params = {}, timeoutMs = 30000) {
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
    if (r.exceptionDetails) throw new Error(`页面异常: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result?.value;
  }
  async waitFor(expression, timeoutMs = 30000, intervalMs = 200) {
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
  async shot(name) {
    try {
      await this.send('Page.bringToFront', {}, 10000);
      const r = await this.send('Page.captureScreenshot', { format: 'png' }, 40000);
      fs.writeFileSync(path.join(CACHE, name), Buffer.from(r.data, 'base64'));
    } catch (e) {
      console.log(`（截图 ${name} 失败：${e.message}，不影响结论）`);
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

/* 选一个「有 css 页签」和一个「有 js 页签」的练习，用来验页签与死循环保护 */
const PICK_SCRIPT = `(() => {
  const chs = (window.H5LAB_CHAPTERS || []).slice();
  const all = [];
  chs.forEach(ch => ch.sections.forEach(s => { if (s.kind === 'exercise') all.push({ ch: ch.id, sec: s }); }));
  const withPane = (p) => all.filter(e => e.sec.starter && (p in e.sec.starter));
  return {
    chapters: chs.map(c => ({ id: c.id, title: c.title, ex: c.sections.filter(s => s.kind === 'exercise').length, demo: c.sections.filter(s => s.kind === 'demo').length })),
    cssEx: (withPane('css')[0] || {}).sec ? { ch: withPane('css')[0].ch, id: withPane('css')[0].sec.id } : null,
    jsEx: (withPane('js')[0] || {}).sec ? { ch: withPane('js')[0].ch, id: withPane('js')[0].sec.id } : null,
    totalEx: all.length
  };
})()`;

async function main() {
  startServer();
  startBrowser();
  if (!(await waitHttp(BASE, 20000))) throw new Error(`http.server 没起来（端口 ${HTTP_PORT}）`);
  const cdp = await connect();

  await cdp.send('Page.navigate', { url: `${BASE}/index.html` });
  await sleep(1200);
  await cdp.eval('localStorage.clear(); "ok"');
  await cdp.send('Page.reload', { ignoreCache: true });
  await sleep(1500);

  await cdp.eval(`(() => {
    window.__errs = window.__errs || [];
    window.addEventListener('error', e => window.__errs.push(String((e && e.message) || 'unknown')));
    window.addEventListener('unhandledrejection', e => window.__errs.push('rej: ' + String(e.reason && e.reason.message || e.reason)));
    return true;
  })()`);

  const info = await cdp.eval(PICK_SCRIPT);
  record('内容规模合理', info.totalEx >= 40, `${info.chapters.length} 章 / ${info.totalEx} 练习`);

  /* --- 结构 --- */
  const navCount = await cdp.eval('document.querySelectorAll(".nav-item[data-ch]").length');
  record('侧栏章节数与内容一致', navCount === info.chapters.length && navCount > 0, `${navCount} 章`);

  const homeCards = await cdp.eval('document.querySelectorAll(".ch-card").length');
  record('总览页渲染章节卡', homeCards === info.chapters.length, `${homeCards} 张`);
  await cdp.shot('01-home.png');

  /* --- 路由 + 练习卡 + 示例 --- */
  const target = info.chapters.find((c) => c.ex > 0 && c.demo > 0) || info.chapters[0];
  await cdp.eval(`location.hash = '${target.id}'; "ok"`);
  await sleep(1500);
  const h1 = await cdp.eval('document.querySelector("#main h1")?.textContent');
  record('章节路由切换正常', h1 === target.title, `${h1}`);

  const cardCount = await cdp.eval('document.querySelectorAll(".ex-card").length');
  record('练习卡渲染', cardCount === target.ex && cardCount > 0, `${cardCount} 张`);
  const rows = await cdp.eval('document.querySelectorAll(".ex-card .test-row").length');
  record('断言清单可见', rows >= 2, `${rows} 行`);
  const hlSpans = await cdp.eval('document.querySelectorAll(".editor-hl code span").length');
  record('编辑器有语法高亮叠层', hlSpans > 3, `${hlSpans} 个 span`);

  const demoInfo = await cdp.eval(`(() => ({
    cases: document.querySelectorAll('.case').length,
    frames: document.querySelectorAll('.case-frame .preview-frame').length,
    notes: [...document.querySelectorAll('.case-note')].filter(n => n.style.display !== 'none').length
  }))()`);
  record('示例当场渲染出 iframe', demoInfo.cases > 0 && demoInfo.frames === demoInfo.cases, `${demoInfo.frames}/${demoInfo.cases} 个示例窗`);
  record('示例自检没挂（页面上没有红色提示）', demoInfo.notes === 0, `${demoInfo.notes} 条失败提示`);

  const frameAccess = await cdp.eval(`(() => {
    const f = document.querySelector('.case-frame .preview-frame');
    if (!f) return 'no-frame';
    return f.contentDocument === null ? 'isolated' : 'reachable';
  })()`);
  record('预览 iframe 与主文档隔离（父页面拿不到它的 DOM）', frameAccess === 'isolated', `contentDocument 探测：${frameAccess}`);

  await cdp.shot('02-chapter.png');

  /* --- 真实输入 → 自动校验 --- */
  const targetEx = await cdp.eval(`(() => {
    const ch = window.H5LAB_CHAPTERS.find(c => c.id === '${target.id}');
    const ex = ch.sections.find(s => s.kind === 'exercise');
    return { id: ex.id, html: ex.solution.html, panes: Object.keys(ex.starter) };
  })()`);

  await cdp.eval(`(() => { const ta = document.querySelector('#${targetEx.id} .editor-ta'); ta.focus(); document.execCommand('selectAll'); return 'ok'; })()`);
  await cdp.send('Input.insertText', { text: targetEx.html });
  const typed = await cdp.eval(`document.querySelector('#${targetEx.id} .editor-ta').value`);
  record('真实键盘输入进入编辑器', typed.includes(targetEx.html.trim().split('\n')[0]), `${typed.length} 字符`);

  let pill = '';
  try {
    await cdp.waitFor(`(() => { const p = document.querySelector('#${targetEx.id} .status-pill'); return p && /通过/.test(p.textContent); })()`, 25000);
    pill = await cdp.eval(`document.querySelector('#${targetEx.id} .status-pill').textContent`);
    record('自动运行后断言全部通过', /全部通过/.test(pill), pill);
  } catch {
    pill = await cdp.eval(`document.querySelector('#${targetEx.id} .status-pill')?.textContent || ''`);
    record('自动运行后断言全部通过', false, `状态：${pill}`);
  }
  const marks = await cdp.eval(`(() => {
    const box = document.querySelector('#${targetEx.id}');
    return { ok: box.querySelectorAll('.test-mark.ok').length, bad: box.querySelectorAll('.test-mark.bad').length };
  })()`);
  const wantMarks = targetEx.html ? await cdp.eval(`window.H5LAB_CHAPTERS.find(c => c.id === '${target.id}').sections.find(s => s.id === '${targetEx.id}').tests.length`) : 0;
  record('每条断言都显示 ✓', marks.ok === wantMarks && marks.bad === 0, `${marks.ok}/${wantMarks}`);
  await cdp.shot('03-exercise-pass.png');

  const passedText = await cdp.eval(`document.getElementById('progress-text').textContent`);
  const navText = await cdp.eval(`document.querySelector('.nav-item[data-ch="${target.id}"] .nav-count').textContent`);
  record('通过后总进度与章节计数更新', /^[1-9]/.test(passedText) && /^[1-9]/.test(navText), `${passedText} / 章节 ${navText}`);

  /* --- 页签切换 --- */
  if (info.cssEx) {
    await cdp.eval(`location.hash = '${info.cssEx.ch}'; "ok"`);
    await sleep(1500);
    const tabInfo = await cdp.eval(`(() => {
      const card = document.querySelector('#${info.cssEx.id}');
      if (!card) return null;
      const tabs = [...card.querySelectorAll('.ed-tab')].map(b => b.textContent);
      const cssTab = [...card.querySelectorAll('.ed-tab')].find(b => b.textContent === 'CSS');
      if (!cssTab) return { tabs, switched: false };
      cssTab.click();
      const pane = card.querySelector('.ed-pane.active');
      const ta = pane && pane.querySelector('.editor-ta');
      return { tabs, switched: !!ta, value: ta ? ta.value.slice(0, 20) : '' };
    })()`);
    record('CSS 页签能切到 CSS 编辑器', !!tabInfo && tabInfo.switched, tabInfo ? `页签 ${tabInfo.tabs.join('/')}` : '找不到练习卡');
    await cdp.eval(`location.hash = '${target.id}'; "ok"`);
    await sleep(1500);
  } else {
    record('CSS 页签能切到 CSS 编辑器', false, '内容里还没有带 CSS 页签的练习');
  }

  /* --- 错代码给出「期望 / 实际」 --- */
  const starterHtml = await cdp.eval(`window.H5LAB_CHAPTERS.find(c => c.id === '${target.id}').sections.find(s => s.id === '${targetEx.id}').starter.html`);
  await cdp.eval(`(() => { const ta = document.querySelector('#${targetEx.id} .editor-ta'); ta.focus(); document.execCommand('selectAll'); return 'ok'; })()`);
  await cdp.send('Input.insertText', { text: starterHtml });
  try {
    await cdp.waitFor(`(() => { const m = document.querySelector('#${targetEx.id} .test-msg'); return m && m.textContent.length > 0; })()`, 25000);
  } catch {}
  const failMsg = await cdp.eval(`document.querySelector('#${targetEx.id} .test-msg')?.textContent || ''`);
  record('错误答案给出期望/实际信息', /期望/.test(failMsg) && /实际/.test(failMsg), failMsg.slice(0, 80));

  /* --- 括号自动配对：走真实按键路径（insertText 不经过 keydown，验不到） --- */
  const taSel = `#${targetEx.id} .editor-ta`;
  const KEYDEF = {
    '(': { code: 'Digit9', vk: 57, text: '(' },
    ')': { code: 'Digit0', vk: 48, text: ')' },
    '[': { code: 'BracketLeft', vk: 219, text: '[' },
    '{': { code: 'BracketRight', vk: 221, text: '{' },
    '<': { code: 'Comma', vk: 188, text: '<' },
    '>': { code: 'Period', vk: 190, text: '>' },
    "'": { code: 'Quote', vk: 222, text: "'" },
    '"': { code: 'Quote', vk: 222, text: '"' },
    '`': { code: 'Backquote', vk: 192, text: '`' },
  };
  const setEditor = (sel, text, selStart, selEnd) => cdp.eval(`(() => {
    const ta = document.querySelector('${sel}');
    ta.focus();
    ta.value = ${JSON.stringify(text)};
    ta.selectionStart = ${selStart};
    ta.selectionEnd = ${selEnd == null ? selStart : selEnd};
    return 'ok';
  })()`);
  const readEditor = (sel) => cdp.eval(`(() => {
    const ta = document.querySelector('${sel}');
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

  await setEditor(taSel, '');
  await pressKey('(');
  let ap = await readEditor(taSel);
  record('敲 ( 自动补出闭括号，光标留在中间', ap.value === '()' && ap.start === 1 && ap.end === 1, JSON.stringify(ap));

  await pressKey(')');
  ap = await readEditor(taSel);
  record('闭括号已经等在光标后：跳过不重复', ap.value === '()' && ap.start === 2, JSON.stringify(ap));

  const hlText = await cdp.eval(`document.querySelector('#${targetEx.id} .editor-hl code').textContent`);
  record('配对后高亮叠层跟着更新', hlText.trim() === '()', JSON.stringify(hlText.trim().slice(0, 20)));

  await setEditor(taSel, '');
  await pressKey('{');
  await pressNamedKey('Backspace', 8);
  ap = await readEditor(taSel);
  record('空括号中间 Backspace 一次删掉一对', ap.value === '' && ap.start === 0, JSON.stringify(ap));

  await setEditor(taSel, '段落文字', 0, 4);
  await pressKey('[');
  ap = await readEditor(taSel);
  record('选中内容被括号包住且保持选中', ap.value === '[段落文字]' && ap.start === 1 && ap.end === 5, JSON.stringify(ap));

  /* 引号补另一半，且不打扰属性值与撇号 */
  await setEditor(taSel, '');
  await pressKey('"');
  ap = await readEditor(taSel);
  record('敲双引号补出另一半，光标留在中间', ap.value === '""' && ap.start === 1 && ap.end === 1, JSON.stringify(ap));

  await pressKey('"');
  ap = await readEditor(taSel);
  record('引号已经等在光标后：跳过不重复', ap.value === '""' && ap.start === 2, JSON.stringify(ap));

  await setEditor(taSel, 'don', 3, 3);
  await pressKey("'");
  ap = await readEditor(taSel);
  record('撇号（词字符后）不自动补', ap.value === "don'" && ap.start === 4, JSON.stringify(ap));

  /* 尖括号与标签闭合只在 HTML 页签里出现 */
  await setEditor(taSel, '');
  await pressKey('<');
  ap = await readEditor(taSel);
  record('HTML 页签敲 < 补出 >', ap.value === '<>' && ap.start === 1, JSON.stringify(ap));

  await cdp.send('Input.insertText', { text: 'p' });
  await sleep(60);
  await pressKey('>');
  ap = await readEditor(taSel);
  record('敲 > 补出闭标签且光标留在标签里', ap.value === '<p></p>' && ap.start === 3, JSON.stringify(ap));

  await setEditor(taSel, '');
  await pressKey('<');
  await cdp.send('Input.insertText', { text: 'br' });
  await sleep(60);
  await pressKey('>');
  ap = await readEditor(taSel);
  record('空元素不补闭标签', ap.value === '<br>' && ap.start === 4, JSON.stringify(ap));

  await setEditor(taSel, '<p>\n</p>', 2, 2);
  await pressKey('>');
  ap = await readEditor(taSel);
  record('后面已有闭标签：只跳过，不重复补', ap.value === '<p>\n</p>' && ap.start === 3, JSON.stringify(ap));

  await setEditor(taSel, 'x', 1, 1);
  const ime = await cdp.eval(`(() => {
    const ta = document.querySelector('${taSel}');
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true });
    ta.dispatchEvent(ev);
    return { prevented: ev.defaultPrevented, value: ta.value };
  })()`);
  record('输入法组合期间 Enter 不被编辑器拦下', ime.prevented === false && ime.value === 'x', JSON.stringify(ime));

  /* CSS 页签里花括号最常用，单独验一遍（编辑器是每个页签一个实例） */
  if (info.cssEx) {
    await cdp.eval(`location.hash = '${info.cssEx.ch}'; "ok"`);
    await sleep(1500);
    const cssSel = `#${info.cssEx.id} .ed-pane.active .editor-ta`;
    const before = await cdp.eval(`(() => {
      const card = document.querySelector('#${info.cssEx.id}');
      if (!card) return null;
      const tab = [...card.querySelectorAll('.ed-tab')].find(b => b.textContent === 'CSS');
      if (!tab) return null;
      tab.click();
      const ta = card.querySelector('.ed-pane.active .editor-ta');
      return { value: ta.value, start: ta.selectionStart };
    })()`);
    if (before) {
      await setEditor(cssSel, '');
      await pressKey('{');
      const cssAp = await readEditor(cssSel);
      record('CSS 页签里敲 { 也补出 }', cssAp.value === '{}' && cssAp.start === 1, JSON.stringify(cssAp));

      await setEditor(cssSel, '');
      await pressKey('<');
      const cssLt = await readEditor(cssSel);
      record('CSS 页签敲 < 不补（尖括号只属于 HTML 页签）', cssLt.value === '<' && cssLt.start === 1, JSON.stringify(cssLt));

      await setEditor(cssSel, before.value, before.start);
    } else {
      record('CSS 页签里敲 { 也补出 }', false, '找不到 CSS 页签');
    }
    await cdp.eval(`location.hash = '${target.id}'; "ok"`);
    await sleep(1500);
  }

  /* 把编辑器还原成起始代码，别让后面几节拿到半截括号 */
  await cdp.eval(`(() => {
    const ta = document.querySelector('${taSel}');
    ta.focus();
    ta.value = ${JSON.stringify(starterHtml)};
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return 'ok';
  })()`);

  /* --- 全量自测 --- */
  await cdp.eval(`location.hash = 'home'; "ok"`);
  await sleep(400);
  if (!FAST) {
    console.log('\n跑全量自测（每个示例自检 + 每个练习的参考解与起始代码）…');
    const started = Date.now();
    await cdp.eval('window.H5LAB_SELFTEST().then(r => { window.__self = r; return "started"; })', { awaitPromise: false });
    try {
      await cdp.waitFor('!!window.__self', 900000, 1000);
      const self = await cdp.eval('window.__self');
      record('全量自测', self.ok,
        `示例 ${self.demos.pass}/${self.demos.total} · 参考解 ${self.exercises.solutionAllPass}/${self.exercises.total} · 起始代码被抓住 ${self.exercises.starterAllFail}/${self.exercises.total} · 用时 ${Math.round((Date.now() - started) / 1000)}s`);
      if (!self.ok) for (const p of self.problems.slice(0, 15)) console.log(`        · ${p.where} ${p.kind} ${p.detail || ''}`);
    } catch (e) {
      record('全量自测', false, e.message);
    }
  }

  /* --- 三档视口排版 --- */
  async function probeLayout(w, h, chapterId) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await cdp.eval(`location.hash = '${chapterId}'; "ok"`);
    await sleep(900);
    return cdp.eval(`(() => {
      const main = document.querySelector('.main').getBoundingClientRect();
      const c = document.querySelector('.content').getBoundingClientRect();
      const card = document.querySelector('.ex-card').getBoundingClientRect();
      const g = document.querySelector('.ex-card .ex-grid');
      const editor = document.querySelector('.ex-card .editor-cell').getBoundingClientRect();
      const preview = document.querySelector('.ex-card .preview-box').getBoundingClientRect();
      const cons = document.querySelector('.ex-card > .console-box');
      const acts = document.querySelector('.ex-card > .ex-actions').getBoundingClientRect();
      const readBlocks = [...document.querySelectorAll('.content > .read > h1, .content > .read > .goal, .content > .read > .md, .content > .read > .note, .content > .read > .tbl-wrap, .content > .read > .case')];
      const edges = readBlocks.map(e => { const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right) }; });
      const readW = edges[0] ? (edges[0].r - edges[0].l) : 0;
      return {
        contentW: Math.round(c.width),
        gutterLeft: Math.round(c.left - main.left),
        gutterRight: Math.round(main.right - c.right),
        readBlocks: edges.length,
        readFirstLeft: edges[0] ? edges[0].l : 0,
        readLeftGap: edges[0] ? Math.round(edges[0].l - c.left) : 0,
        readRightGap: edges[0] ? Math.round(c.right - edges[0].r) : 0,
        readSpreadL: Math.max(...edges.map(e => e.l)) - Math.min(...edges.map(e => e.l)),
        readSpreadR: Math.max(...edges.map(e => e.r)) - Math.min(...edges.map(e => e.r)),
        cardW: Math.round(card.width),
        editorH: Math.round(editor.height),
        previewH: Math.round(preview.height),
        consoleIndent: cons ? Math.round(cons.getBoundingClientRect().left - editor.left) : null,
        actionsIndent: Math.round(acts.left - editor.left),
        cols: getComputedStyle(g).gridTemplateColumns.split(' ').length,
        overflow: document.documentElement.scrollWidth - window.innerWidth
      };
    })()`);
  }

  const wide = await probeLayout(2000, 1100, target.id);
  record('宽屏内容列填满并居中', wide.contentW >= 1500 && Math.abs(wide.gutterLeft - wide.gutterRight) <= 2 && wide.overflow <= 0,
    `内容宽 ${wide.contentW}px，左右留白 ${wide.gutterLeft}/${wide.gutterRight}px，溢出 ${wide.overflow}`);
  record('阅读区窄而居中（正文/示例/表格同宽）', wide.readBlocks >= 4 && wide.readLeftGap <= 860 && Math.abs(wide.readLeftGap - wide.readRightGap) <= 2,
    `${wide.readBlocks} 块，左右留白 ${wide.readLeftGap}/${wide.readRightGap}px`);
  record('标题/正文/提示/表格/示例左边缘完全对齐', wide.readSpreadL <= 2 && wide.readSpreadR <= 2,
    `左边缘偏差 ${wide.readSpreadL}px，右边缘偏差 ${wide.readSpreadR}px`);
  record('练习卡用满宽屏', wide.cardW > 1400 && wide.cardW >= 1500, `练习卡 ${wide.cardW}px`);
  record('宽屏练习卡三栏（说明 | 编辑器 | 预览）', wide.cols === 3, `grid 列数 ${wide.cols}`);
  record('编辑器与预览窗同高（视觉上是一对）', Math.abs(wide.editorH - wide.previewH) <= 1, `编辑器 ${wide.editorH}px / 预览 ${wide.previewH}px`);
  record('控制台与按钮栏和编辑器列左对齐', wide.consoleIndent === null || (Math.abs(wide.consoleIndent) <= 2 && Math.abs(wide.actionsIndent) <= 2),
    `偏移 ${wide.consoleIndent}/${wide.actionsIndent}px`);
  await cdp.shot('05-wide-2000.png');
  await cdp.eval(`window.scrollTo(0, document.querySelector('.ex-card').getBoundingClientRect().top + window.scrollY - 70); "ok"`);
  await sleep(400);
  await cdp.shot('06-wide-exercise.png');

  const mid = await probeLayout(1200, 900, target.id);
  record('中屏练习卡两栏且不溢出', mid.cols === 2 && mid.overflow <= 0, `grid 列数 ${mid.cols}，溢出 ${mid.overflow}`);

  const narrow = await probeLayout(760, 900, target.id);
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
  async function probePhone(w, h, hash) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
    if (hash) { await cdp.eval(`location.hash = '${hash}'; "ok"`); }
    await sleep(600);
    return cdp.eval(`(() => {
      const sb = document.getElementById('sidebar');
      const cs = getComputedStyle(sb);
      return {
        client: document.documentElement.clientWidth,
        scrollW: document.documentElement.scrollWidth,
        sidebarFixed: cs.position === 'fixed',
        /** 抽屉收起时侧栏用 visibility: hidden 藏起来（比只看 transform 可靠：不依赖过渡是否跑完） */
        drawerHidden: cs.visibility === 'hidden',
        /** 正文拿回整屏宽度：抽屉形态下不该再被侧栏挤掉 240px */
        mainShare: Math.round(document.querySelector('.main').getBoundingClientRect().width / document.documentElement.clientWidth * 100),
        topbarH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
        /** 只量可见的编辑器（隐藏页签/iframe 里的不算），取最小值 */
        editorFont: Math.min(...[...document.querySelectorAll('.editor-ta')]
          .filter((t) => t.offsetParent !== null)
          .map((t) => parseFloat(getComputedStyle(t).fontSize))),
        navMinH: Math.min(...[...document.querySelectorAll('.nav-item')].map((n) => Math.round(n.getBoundingClientRect().height))),
      };
    })()`);
  }

  const phone = await probePhone(390, 844, target.id);
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

  await cdp.eval(`document.querySelector('.nav-item[data-ch="${target.id}"]').click(); "ok"`);
  await sleep(500);
  const afterPick = await cdp.eval(`(() => ({
    open: document.body.classList.contains('nav-open'),
    vis: getComputedStyle(document.getElementById('sidebar')).visibility,
  }))()`);
  record('选完章节抽屉自动收起（不挡正文）', afterPick.open === false && afterPick.vis === 'hidden', JSON.stringify(afterPick));
  await cdp.eval(`document.getElementById('nav-btn').click(); "ok"`);
  await sleep(300);
  await cdp.shot('06-phone-390.png');
  await cdp.eval(`document.getElementById('nav-backdrop').click(); "ok"`);
  await sleep(300);
  const afterBackdrop = await cdp.eval(`document.body.classList.contains('nav-open')`);
  record('点遮罩能收起抽屉', afterBackdrop === false, String(afterBackdrop));

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });

  /* --- 练习场 --- */
  await cdp.eval(`location.hash = 'playground'; "ok"`);
  await sleep(1500);
  const pg = await cdp.eval(`(() => ({
    panes: document.querySelectorAll('.pg-grid .ed-tab').length,
    frame: !!document.querySelector('.pg-grid .preview-frame'),
    logs: document.querySelectorAll('.pg-grid ~ .console-box .console-line').length,
    empty: !!document.querySelector('.pg-grid ~ .console-box .console-line.err')
  }))()`);
  record('练习场三个页签 + 实时预览 + 控制台', pg.panes === 3 && pg.frame && pg.logs > 0 && !pg.empty, JSON.stringify(pg));
  await cdp.shot('07-playground.png');

  /* --- 死循环保护（放最后：它要拖累渲染进程几秒） --- */
  if (info.jsEx) {
    await cdp.eval(`location.hash = '${info.jsEx.ch}'; "ok"`);
    await sleep(1200);
    const loopCard = info.jsEx.id;
    await cdp.eval(`(() => {
      const card = document.querySelector('#${loopCard}');
      const tab = [...card.querySelectorAll('.ed-tab')].find(b => b.textContent === 'JS');
      if (tab) tab.click();
      return 'ok';
    })()`);
    await cdp.eval(`(() => { const ta = document.querySelector('#${loopCard} .ed-pane.active .editor-ta') || document.querySelector('#${loopCard} .editor-ta'); ta.focus(); document.execCommand('selectAll'); return 'ok'; })()`);
    await cdp.send('Input.insertText', { text: 'while (true) {}\n' });
    try {
      await cdp.waitFor(`(() => { const c = document.querySelector('#${loopCard} .console-box'); return c && /强制停止|TimeoutError/.test(c.textContent); })()`, 30000);
      record('死循环被超时掐掉并给出提示', true);
    } catch {
      const txt = await cdp.eval(`document.querySelector('#${loopCard} .console-box')?.textContent || ''`);
      record('死循环被超时掐掉并给出提示', false, txt.slice(0, 60));
    }
    await cdp.eval(`location.hash = 'home'; "ok"`);
    await sleep(400);
  }

  await cdp.shot('04-final.png');

  const pageErrs = await cdp.eval('window.__errs || []');
  record('页面无未捕获脚本错误', pageErrs.length === 0, pageErrs.slice(0, 3).join(' | '));

  const alive = await cdp.eval(`(() => { const a = window.H5LAB_ALIVE; return a ? { open: a.readyState === 1 } : null; })()`);
  record('页面挂上了保活长连接（关窗即退出用）', !!alive && alive.open, JSON.stringify(alive));

  /* --- file:// 双击直开 --- */
  try {
    const fileUrl = 'file:///' + root.replace(/\\/g, '/') + '/index.html';
    await cdp.send('Page.navigate', { url: fileUrl });
    await sleep(2200);
    const offline = await cdp.eval(`(() => ({
      navs: document.querySelectorAll('.nav-item[data-ch]').length,
      chips: document.querySelectorAll('.ch-card').length,
      proto: location.protocol
    }))()`);
    record('file:// 直开可用（目录与总览渲染）', offline.navs === info.chapters.length && offline.chips === info.chapters.length, JSON.stringify(offline));

    await cdp.eval(`localStorage.clear(); "ok"`);
    await cdp.send('Page.reload', { ignoreCache: true });
    await sleep(2000);
    await cdp.eval(`location.hash = '${target.id}'; "ok"`);
    await sleep(1400);
    const sol = await cdp.eval(`window.H5LAB_CHAPTERS.find(c => c.id === '${target.id}').sections.find(s => s.kind === 'exercise').solution.html`);
    await cdp.eval(`(() => { const ta = document.querySelector('.ex-card .editor-ta'); ta.value = ${JSON.stringify(sol)}; ta.dispatchEvent(new Event('input', { bubbles: true })); return 'ok'; })()`);
    await cdp.waitFor(`(() => { const p = document.querySelector('.ex-card .status-pill'); return p && /通过/.test(p.textContent); })()`, 25000);
    const offlinePill = await cdp.eval(`document.querySelector('.ex-card .status-pill').textContent`);
    record('file:// 下预览与判题照样能跑', /全部通过/.test(offlinePill), offlinePill);
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
