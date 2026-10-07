/* verify-ui.mjs — 真实输入管线 + 三档视口排版 + file:// 直开 + 全量自测。
 *
 * 走的是**真的按键**（Input.dispatchKeyEvent，带 text 的那种），不是改 DOM 里的值：
 * 括号配对、自动缩进、停手自动判题、Ctrl+Enter 全靠这条路才会被触发。
 * 排版用 getBoundingClientRect 量，不靠截图看（对齐回退很难靠肉眼发现）。
 *
 * 用法：node tools/verify-ui.mjs [--fast] [--headful]
 *   --fast  跳过最后的全量自测（那一趟要跑上百次判题）
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, paths, startServer, startBrowser, waitHttp, connect, armErrorCollector, reporter, killAll, cacheDir, sleep } from './lib/cdp.mjs';

const argv = process.argv.slice(2);
const fast = argv.includes('--fast');
const headful = argv.includes('--headful');

const HTTP_PORT = Number(process.env.TSLAB_UI_HTTP_PORT || 8882);
const CDP_PORT = Number(process.env.TSLAB_UI_CDP_PORT || 9228);
const ctx = paths({ cdpPort: CDP_PORT, httpPort: HTTP_PORT });
const { record, finish } = reporter();
const children = [];

/* ---------- 真实按键 ---------- */
const KEYCODES = { '(': 57, ')': 48, '[': 219, ']': 221, '{': 219, '}': 221, '"': 222, "'": 222, '<': 188, '>': 190, '=': 187, ':': 186 };

async function key(cdp, opts) {
  return cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown' }, opts));
}

/** 逐字真敲（走 DOM keydown + 文本插入） */
async function typeText(cdp, text) {
  for (const ch of text) {
    if (ch === '\n') {
      await key(cdp, { key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    } else {
      const code = KEYCODES[ch] || 0;
      await key(cdp, { key: ch, code: code ? (ch === '(' ? 'Digit9' : ch) : '', text: ch, unmodifiedText: ch });
    }
    await sleep(2);
  }
}

async function selectAll(cdp) {
  await key(cdp, { key: 'a', code: 'KeyA', text: 'a', unmodifiedText: 'a', modifiers: 2, windowsVirtualKeyCode: 65 });
  await sleep(30);
}

/** 清空编辑器：全选 + Backspace（真按键） */
async function clearEditor(cdp) {
  await selectAll(cdp);
  await key(cdp, { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 });
  await sleep(60);
}

async function pressCtrlEnter(cdp) {
  await key(cdp, { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 2 });
  await sleep(30);
}

async function clickIn(cdp, selector) {
  const box = await cdp.eval(`(() => {
    const e = document.querySelector(${JSON.stringify(selector)});
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.left + 20), y: Math.round(r.top + Math.min(18, r.height / 2)), top: Math.round(r.top), h: Math.round(r.height) };
  })()`);
  if (!box) throw new Error('找不到可点的元素: ' + selector);
  if (box.y < 0 || box.y > 900) throw new Error('元素滚进视口后坐标仍不可点: ' + selector + ' y=' + box.y);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
  }
  await sleep(80);
}

const val = (cdp, sel) => cdp.eval(`document.querySelector(${JSON.stringify(sel)}).value`);
const caret = (cdp, sel) => cdp.eval(`document.querySelector(${JSON.stringify(sel)}).selectionStart`);

async function setViewport(cdp, w, h) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(500);
}

async function main() {
  children.push(startServer({}, HTTP_PORT));
  children.push(startBrowser({ cdpPort: CDP_PORT, userDataDir: ctx.userDataDir, headless: !headful }));
  if (!(await waitHttp(ctx.base, 20000))) throw new Error('serve.py 没起来（端口 ' + HTTP_PORT + '）');
  const cdp = await connect(ctx);
  await armErrorCollector(cdp);

  /* ---------- 一、真实输入管线（http） ---------- */
  await cdp.send('Page.navigate', { url: ctx.base + '/index.html?v=ui#ch01' });
  await cdp.waitFor('typeof window.TSLAB_SELFTEST === "function"', 30000);
  await cdp.waitFor('window.TSLAB_COMPILER_READY', 120000, 500);
  await cdp.waitFor('document.querySelectorAll(".ex-card .panel-pane").length > 0', 60000);
  record('http：编译器就绪并画出练习卡', true, (await cdp.eval('window.TSLAB_COMPILER_READY.ms')) + ' ms');

  const EDITOR = '#ex01-1 textarea';
  await clickIn(cdp, EDITOR);
  const focused = await cdp.eval('document.activeElement && document.activeElement.tagName');
  record('点进编辑器能拿到焦点', focused === 'TEXTAREA', String(focused));

  /* 括号配对：真的敲一遍（先把编辑器清空，否则光标在选区内会走「包起来」那条分支） */
  await selectAll(cdp);
  await typeText(cdp, '(');
  const wrapped = await val(cdp, EDITOR);
  record('有选区时用括号把选区包起来', wrapped.charAt(0) === '(' && wrapped.charAt(wrapped.length - 1) === ')', JSON.stringify(wrapped.slice(0, 20) + '…' + wrapped.slice(-6)));

  await clearEditor(cdp);
  record('全选 + Backspace 能清空编辑器', (await val(cdp, EDITOR)) === '', JSON.stringify((await val(cdp, EDITOR)).slice(0, 20)));
  await typeText(cdp, '(');
  record('敲 ( 自动补上 )', (await val(cdp, EDITOR)) === '()' && (await caret(cdp, EDITOR)) === 1, JSON.stringify(await val(cdp, EDITOR)) + ' caret=' + (await caret(cdp, EDITOR)));
  await clearEditor(cdp);
  await typeText(cdp, '{');
  record('敲 { 自动补上 }', (await val(cdp, EDITOR)) === '{}', JSON.stringify(await val(cdp, EDITOR)));
  await clearEditor(cdp);
  await typeText(cdp, '[');
  record('敲 [ 自动补上 ]', (await val(cdp, EDITOR)) === '[]', JSON.stringify(await val(cdp, EDITOR)));
  await clearEditor(cdp);
  await typeText(cdp, '"');
  record('引号不自动补（内容里到处是引号）', (await val(cdp, EDITOR)) === '"', JSON.stringify(await val(cdp, EDITOR)));
  await clearEditor(cdp);
  await typeText(cdp, '<');
  record('TS 里 < 不补尖括号（泛型）', (await val(cdp, EDITOR)) === '<', JSON.stringify(await val(cdp, EDITOR)));

  /* 敲一段「没有类型错误但类型不对」的代码，等停手自动判题 */
  await clearEditor(cdp);
  await typeText(cdp, "let title: number = 42;\nlet tags: number[] = [1, 2, 3];");
  const typed = await val(cdp, EDITOR);
  record('真敲进去的代码与预期一致', typed.indexOf('let title: number = 42;') === 0, JSON.stringify(typed.slice(0, 40)));

  await cdp.waitFor('document.querySelector("#ex01-1 .test-mark.bad") !== null', 20000, 300);
  const auto = await cdp.eval(`(() => ({
    marks: [...document.querySelectorAll('#ex01-1 .test-mark')].map(m => m.textContent).join(''),
    msg: (document.querySelector('#ex01-1 .test-msg') || {}).textContent || '',
    pill: document.querySelector('#ex01-1 .status-pill').textContent,
    diagBadge: document.querySelector('#ex01-1 .panel-tab .tab-badge').textContent,
    js: (document.querySelector('#ex01-1 .panel-body .panel-pane:nth-child(2)') || {}).textContent.slice(0, 60)
  }))()`);
  record('停手一秒自动判题，断言出现 ✗', /✗/.test(auto.marks), auto.marks + '　' + auto.pill);
  record('失败信息说清期望与实际', auto.msg.indexOf('期望 string') >= 0 && auto.msg.indexOf('实际 number') >= 0, auto.msg);
  record('状态标签显示未通过条数', /未通过/.test(auto.pill), auto.pill);
  record('没有类型错误时诊断页签是绿的 ✓', auto.diagBadge === '✓', auto.diagBadge);

  /* 再敲一段真有类型错误的，诊断页签应当给出 TS2322 与中文说明 */
  await selectAll(cdp);
  await typeText(cdp, 'let title = 42;\nlet bad: number = \'这不是数字\';');
  await cdp.waitFor('document.querySelector("#ex01-1 .panel-pane").textContent.indexOf("TS2322") >= 0', 20000, 300);
  const diag = await cdp.eval(`(() => {
    const pane = document.querySelector('#ex01-1 .panel-pane');
    return { text: pane.textContent.slice(0, 160), badge: document.querySelector('#ex01-1 .panel-tab .tab-badge').textContent };
  })()`);
  record('诊断页签显示 TS2322 并带中文说明', /TS2322/.test(diag.text) && /不能将类型|不能把类型/.test(diag.text), JSON.stringify(diag.text));
  record('诊断页签的角标显示条数', /^[1-9]/.test(diag.badge), diag.badge);

  /* Ctrl+Enter 再跑一次 */
  await pressCtrlEnter(cdp);
  await sleep(1200);
  const manual = await cdp.eval('document.querySelector("#ex01-1 .status-pill").textContent');
  record('Ctrl+Enter 能触发判题', /未通过|通过/.test(manual), manual);

  /* 编译产物页签里应当有编译产物 */
  const tabText = await cdp.eval(`(() => {
    const card = document.querySelector('#ex01-1');
    const tabs = [...card.querySelectorAll('.panel-tab')];
    tabs[1].click();
    const pane = [...card.querySelectorAll('.panel-pane')].find(p => !p.hasAttribute('hidden'));
    return pane ? pane.textContent.slice(0, 80) : '';
  })()`);
  record('编译产物页签里有产物（注解被擦掉）', tabText.indexOf('let title = 42') >= 0, JSON.stringify(tabText));

  /* 诊断页签：类型错误会显示成 TSxxxx */
  const diagText = await cdp.eval(`(() => {
    const card = document.querySelector('#ex01-1');
    card.querySelectorAll('.panel-tab')[0].click();
    return card.querySelector('.panel-tab').textContent + ' ｜ ' + card.querySelector('.panel-pane').textContent.slice(0, 90);
  })()`);
  record('诊断页签给出诊断摘要或绿色的 ✓', /诊断/.test(diagText), JSON.stringify(diagText));

  /* 看答案 → 全绿 → 进度 +1 */
  await clickIn(cdp, '#ex01-1 .ex-actions .btn:nth-child(3)');
  await cdp.waitFor('document.querySelector(".modal-backdrop .btn-primary") !== null', 5000, 150);
  await clickIn(cdp, '.modal-backdrop .btn-primary');
  await cdp.waitFor('document.querySelector("#ex01-1 .test-mark.ok") !== null', 20000, 300);
  const solved = await cdp.eval(`(() => ({
    marks: [...document.querySelectorAll('#ex01-1 .test-mark')].map(m => m.textContent).join(''),
    pill: document.querySelector('#ex01-1 .status-pill').textContent,
    dot: document.querySelector('#ex01-1 .ex-dot').className,
    progress: document.getElementById('progress-text').textContent,
    stored: Object.keys(localStorage).filter(k => k.indexOf('tslab.v1.') === 0).length
  }))()`);
  record('看答案后全部通过', solved.marks.indexOf('✗') < 0 && solved.marks.indexOf('✓') >= 0, solved.marks + '　' + solved.pill);
  record('进度点与总进度条更新', /pass/.test(solved.dot) && /^1\//.test(solved.progress), solved.dot + '　' + solved.progress);
  record('进度与代码写进 localStorage', solved.stored >= 2, solved.stored + ' 个键');

  /* 刷新后进度还在 */
  await cdp.send('Page.navigate', { url: ctx.base + '/index.html?v=ui2#ch01' });
  await cdp.waitFor('window.TSLAB_COMPILER_READY', 120000, 500);
  await sleep(800);
  const after = await cdp.eval(`(() => ({
    progress: document.getElementById('progress-text').textContent,
    pill: document.querySelector('#ex01-1 .status-pill').textContent,
    value: document.querySelector('#ex01-1 textarea').value.slice(0, 30)
  }))()`);
  record('刷新后进度与代码都还在', /^1\//.test(after.progress) && /通过/.test(after.pill), JSON.stringify(after));

  /* ---------- 二、三档视口的排版（对齐用量的，不靠看） ---------- */
  const METRICS = `(() => {
    const reads = [...document.querySelectorAll('.content .read')];
    const blocks = [];
    reads.forEach(r => [...r.children].forEach(c => blocks.push(c.getBoundingClientRect())));
    const lefts = blocks.map(r => Math.round(r.left)), rights = blocks.map(r => Math.round(r.right));
    const grid = document.querySelector('.ex-grid');
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0;
    const editor = document.querySelector('.ex-card .editor-cell');
    const panel = document.querySelectorAll('.ex-card .editor-cell')[1];
    const tests = document.querySelector('.ex-card .tests');
    const actions = document.querySelector('.ex-card .ex-actions');
    const er = editor ? editor.getBoundingClientRect() : null;
    const pr = panel ? panel.getBoundingClientRect() : null;
    const tr = tests ? tests.getBoundingClientRect() : null;
    const ar = actions ? actions.getBoundingClientRect() : null;
    return {
      blocks: blocks.length,
      spreadL: lefts.length ? Math.max(...lefts) - Math.min(...lefts) : -1,
      spreadR: rights.length ? Math.max(...rights) - Math.min(...rights) : -1,
      cols, gridWidth: grid ? Math.round(grid.getBoundingClientRect().width) : 0,
      editorH: er ? Math.round(er.height) : -1,
      panelH: pr ? Math.round(pr.height) : -1,
      testsOffset: (tr && er) ? Math.round(tr.left - er.left) : null,
      actionsOffset: (ar && er) ? Math.round(ar.left - er.left) : null,
      docWidth: document.documentElement.clientWidth
    };
  })()`;

  for (const [w, h, wantCols] of [[2000, 1000, 3], [1200, 900, 2], [760, 900, 1]]) {
    await setViewport(cdp, w, h);
    const m = await cdp.eval(METRICS);
    record(`${w}px：阅读块左右边缘极差 ≤ 2px`, m.blocks >= 4 && m.spreadL <= 2 && m.spreadR <= 2, `${m.blocks} 块，极差 ${m.spreadL}/${m.spreadR}px`);
    record(`${w}px：练习卡栅格 ${wantCols} 列`, m.cols === wantCols, `实际 ${m.cols} 列，栅格宽 ${m.gridWidth}px`);
    if (w >= 1360) {
      record(`${w}px：编辑器与结果面板同高`, Math.abs(m.editorH - m.panelH) <= 2, `${m.editorH} / ${m.panelH}`);
      record(`${w}px：断言清单与按钮栏左对齐到编辑器`, Math.abs(m.testsOffset) <= 2 && Math.abs(m.actionsOffset) <= 2, `差 ${m.testsOffset} / ${m.actionsOffset}px`);
    }
  }
  await cdp.send('Emulation.clearDeviceMetricsOverride');

  /* ---------- 三、file:// 直开 ---------- */
  const fileUrl = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
  await cdp.send('Page.navigate', { url: fileUrl + '#ch01' });
  await cdp.waitFor('typeof window.TSLAB_SELFTEST === "function"', 60000, 400);
  await cdp.waitFor('window.TSLAB_COMPILER_READY', 180000, 500, 15000);
  await cdp.waitFor('document.querySelector("#ex01-1 .test-mark.bad") !== null', 90000, 400, 15000);
  const fileRun = await cdp.eval(`(() => ({
    marks: [...document.querySelectorAll('#ex01-1 .test-mark')].map(m => m.textContent).join(''),
    cases: document.querySelectorAll('.case').length,
    badNotes: [...document.querySelectorAll('.case-note')].filter(n => n.offsetParent !== null).length,
    sandbox: !!document.getElementById('tslab-sandbox-host'),
    errs: window.__errs || []
  }))()`);
  record('file:// 直开：练习卡能判题（起始代码被抓）', /✗/.test(fileRun.marks), fileRun.marks);
  record('file:// 直开：示例都渲染出来了且自检没挂', fileRun.cases > 0 && fileRun.badNotes === 0, `${fileRun.cases} 个示例，红条 ${fileRun.badNotes}`);
  record('file:// 直开：没有未捕获错误', fileRun.errs.length === 0, fileRun.errs.slice(0, 3).join(' ｜ '));

  /* ---------- 四、全量自测 ---------- */
  if (!fast) {
    const t0 = Date.now();
    const report = await cdp.eval('window.TSLAB_SELFTEST().then(r => r)', { awaitPromise: true, timeoutMs: 900000 });
    record('页面内全量自测全绿', report.ok === true && report.problems.length === 0,
      `示例 ${report.demos.pass}/${report.demos.total}，参考解 ${report.exercises.solutionAllPass}/${report.exercises.total}，起始代码被抓 ${report.exercises.starterAllFail}/${report.exercises.total}，用时 ${Math.round((Date.now() - t0) / 1000)}s` +
      (report.problems.length ? '　问题：' + report.problems.slice(0, 5).map((p) => p.where + ' ' + p.kind + ' ' + p.detail).join(' ｜ ') : ''));
  }
}

main()
  .catch((e) => record('验收流程', false, e.stack || e.message))
  .finally(async () => {
    const code = finish();
    killAll(children);
    await sleep(300);
    process.exit(code);
  });
