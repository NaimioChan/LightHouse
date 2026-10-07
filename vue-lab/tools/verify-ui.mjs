/* tools/verify-ui.mjs — 真实输入管线 + 四档视口排版 + file:// 直开 + 全量自测。
 *
 * 走的是**真的按键**（Input.dispatchKeyEvent，带 text 的那种），不是改 DOM 里的值：
 * 括号配对、自动缩进、停手自动检查、Ctrl+Enter 全靠这条路才会被触发。
 * 排版用 getBoundingClientRect 量，不靠截图看（对齐回退很难靠肉眼发现）。
 *
 * 用法：node tools/verify-ui.mjs [--fast] [--headful]
 *   --fast  跳过最后的全量自测（那一趟要把每个练习跑两遍）
 *
 * 前台 terminal 超时 >600s 会被提升为后台进程，然后带 `stdin is not a tty` 立刻死掉。
 * 调用方要写：`node tools/verify-ui.mjs > .cache/ui.txt 2>&1 < /dev/null` 且 timeout ≤ 600。
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, paths, startServer, startBrowser, waitHttp, connect, armErrorCollector, reporter, killAll, cacheDir, sleep } from './lib/cdp.mjs';

const argv = process.argv.slice(2);
const fast = argv.includes('--fast');
const headful = argv.includes('--headful');

const HTTP_PORT = Number(process.env.VUELAB_UI_HTTP_PORT || 8882);
const CDP_PORT = Number(process.env.VUELAB_UI_CDP_PORT || 9228);
const ctx = paths({ cdpPort: CDP_PORT, httpPort: HTTP_PORT });
const { record, finish } = reporter();
const children = [];

/* ---------- 真实按键 ---------- */
const KEYCODES = { '(': 57, ')': 48, '[': 219, ']': 221, '{': 219, '}': 221, '"': 222, "'": 222, '<': 188, '>': 190, '=': 187, ':': 186, ';': 186, '.': 190, ',': 188 };

async function key(cdp, opts) {
  return cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown' }, opts));
}

/** 逐字真敲（走 DOM keydown + 文本插入；code 用 ts-lab 那套，写错会让浏览器多插一个字符） */
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

/** 用坐标真的在元素中心点一下（比 el.click() 更接近真人） */
async function clickIn(cdp, sel) {
  const box = await cdp.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'center'}); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!box) throw new Error('找不到元素：' + sel);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await sleep(60);
}

const val = (cdp, sel) => cdp.eval(`document.querySelector(${JSON.stringify(sel)}).value`);
const caret = (cdp, sel) => cdp.eval(`document.querySelector(${JSON.stringify(sel)}).selectionStart`);

/* ---------- 主流程 ---------- */
async function main() {
  children.push(startServer({}, HTTP_PORT));
  children.push(startBrowser({ cdpPort: CDP_PORT, userDataDir: ctx.userDataDir, headless: !headful }));
  if (!(await waitHttp(ctx.base, 20000))) throw new Error('serve.py 没起来（端口 ' + HTTP_PORT + '）');
  const cdp = await connect(ctx);
  await armErrorCollector(cdp);

  /* ---------- 一、真实输入管线（http） ---------- */
  await cdp.send('Page.navigate', { url: ctx.base + '/index.html?v=ui' });
  await cdp.waitFor('typeof window.VUELAB_SELFTEST === "function"', 30000);
  await cdp.eval(`location.hash = '#ch01'`);
  await cdp.waitFor('window.VUELAB_COMPILER_READY', 120000, 500);
  await cdp.waitFor('document.querySelectorAll("#ex01-1 textarea").length > 0', 60000);
  record('http：编译器就绪并画出练习卡', true, (await cdp.eval('window.VUELAB_COMPILER_READY.ms')) + ' ms');

  const EDITOR = '#ex01-1 textarea';
  await clickIn(cdp, EDITOR);
  const focused = await cdp.eval('document.activeElement && document.activeElement.tagName');
  record('点进编辑器能拿到焦点', focused === 'TEXTAREA', String(focused));

  /* 括号配对：真的敲一遍（先把编辑器清空，否则光标在选区内会走「包起来」那条分支） */
  await selectAll(cdp);
  await typeText(cdp, '(');
  const wrapped = await val(cdp, EDITOR);
  record('有选区时用括号把选区包起来', wrapped.charAt(0) === '(' && wrapped.charAt(wrapped.length - 1) === ')', JSON.stringify(wrapped.slice(0, 14) + '…' + wrapped.slice(-4)));

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
  record('引号不自动补（SFC 里到处是引号）', (await val(cdp, EDITOR)) === '"', JSON.stringify(await val(cdp, EDITOR)));
  await clearEditor(cdp);
  await typeText(cdp, '<');
  record('SFC 里 < 不补尖括号', (await val(cdp, EDITOR)) === '<', JSON.stringify(await val(cdp, EDITOR)));

  /* 敲一段能过的模板，等停手自动检查 */
  await clearEditor(cdp);
  await typeText(cdp, '<template>\n  <h1 class="t">欢迎，非茗</h1>\n</template>');
  const typed = await val(cdp, EDITOR);
  record('真敲进去的代码与预期一致', typed.indexOf('<template>') === 0, JSON.stringify(typed.slice(0, 44)));

  await cdp.waitFor('document.querySelector("#ex01-1 .test-mark.ok") !== null', 30000, 300);
  const auto = await cdp.eval(`(() => ({
    marks: [...document.querySelectorAll('#ex01-1 .test-mark')].map(m => m.textContent).join(''),
    pill: document.querySelector('#ex01-1 .status-pill').textContent,
    dot: document.querySelector('#ex01-1 .ex-dot').className
  }))()`);
  record('停手一秒自动检查，全 ✓', auto.marks.indexOf('✗') < 0 && /✓/.test(auto.marks), auto.marks + '　' + auto.pill);
  record('状态标签显示全部通过', /通过/.test(auto.pill), auto.pill);
  record('练习卡的圆点变成通过态', /pass/.test(auto.dot), auto.dot);

  /* 写一段错的（断言应当给出「期望 X，实际 Y」） */
  await selectAll(cdp);
  await typeText(cdp, '<template>\n  <h1 class="t">走开</h1>\n</template>');
  await cdp.waitFor('document.querySelector("#ex01-1 .test-mark.bad") !== null', 30000, 300);
  const bad = await cdp.eval(`(() => ({
    marks: [...document.querySelectorAll('#ex01-1 .test-mark')].map(m => m.textContent).join(''),
    msg: (document.querySelector('#ex01-1 .test-msg') || {}).textContent || '',
    pill: document.querySelector('#ex01-1 .status-pill').textContent
  }))()`);
  record('写错时断言出现 ✗', /✗/.test(bad.marks), bad.marks + '　' + bad.pill);
  record('失败信息说清期望与实际', /期望/.test(bad.msg) && /实际/.test(bad.msg), bad.msg.slice(0, 90));

  /* Ctrl+Enter 再跑一次 */
  await pressCtrlEnter(cdp);
  await sleep(1500);
  const manual = await cdp.eval('document.querySelector("#ex01-1 .status-pill").textContent');
  record('Ctrl+Enter 能触发检查', /通过/.test(manual), manual);

  /* 渲染预览：示例卡里那个 iframe 要真编译过。
     父页读不到沙箱 iframe 的 DOM（opaque origin），headless 下 Page.getFrameTree 也
     看不到这些 srcdoc 帧 —— 所以改判「srcdoc 被填成了编译产物」这个可观测事实：
     填过之后长度是百 KB 级（含编译出来的模板代码），没填过只有一句空文档。 */
  await cdp.eval(`window.scrollTo(0, 0)`);
  await sleep(500);
  const previews = await cdp.eval(`(() => {
    const list = [...document.querySelectorAll('#main .preview-frame')];
    const lens = list.map(f => (f.getAttribute('srcdoc') || '').length);
    return { count: list.length, filled: lens.filter(n => n > 20000).length, lens: lens.slice(0, 5) };
  })()`);
  record('示例的渲染预览真的编译过（srcdoc 里是编译产物）',
    previews.count > 0 && previews.filled === previews.count,
    JSON.stringify(previews));

  /* 还原起始代码 */
  await clickIn(cdp, '#ex01-1 .ex-actions .btn:nth-child(2)');
  await sleep(400);
  const restored = await cdp.eval(`document.querySelector('#ex01-1 textarea').value`);
  record('「还原起始代码」把编辑器改回起始代码', restored.indexOf('欢迎，') >= 0, JSON.stringify(restored.slice(0, 40)));

  /* 提示能展开 */
  await clickIn(cdp, '#ex01-1 .ex-actions .btn:nth-child(3)');
  await sleep(300);
  const hints = await cdp.eval(`(() => { const l = document.querySelector('#ex01-1 .hint-list'); return l ? { shown: l.style.display !== 'none', n: l.children.length } : null; })()`);
  record('提示能展开且有条数', !!hints && hints.shown && hints.n >= 1, JSON.stringify(hints));

  /* 进度写进 localStorage */
  const stored = await cdp.eval(`Object.keys(localStorage).filter(k => k.indexOf('vuelab.v1.') === 0).length`);
  record('进度与草稿写进 localStorage', stored >= 1, stored + ' 个键');

  /* 刷新后草稿还在。这里不依赖前面那串按键敲出来的内容（那串代码会被还原按钮改掉），
     而是自己写一段带标记的代码、等它落进 localStorage，再刷新看它有没有回来。 */
  await cdp.eval(`(() => {
    const ta = document.querySelector('#ex01-1 textarea');
    ta.value = '<template>\\n  <h1 class="t">欢迎，草稿标记</h1>\\n</template>';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await cdp.waitFor(`!!localStorage.getItem('vuelab.v1.code.ex01-1')`, 10000, 200).catch(() => {});
  await cdp.send('Page.navigate', { url: ctx.base + '/index.html?v=ui2' });
  await cdp.waitFor('typeof window.VUELAB_SELFTEST === "function"', 30000);
  await cdp.eval(`location.hash = '#ch01'`);
  await cdp.waitFor(`(document.querySelector('#ex01-1 textarea') || {}).value && document.querySelector('#ex01-1 textarea').value.indexOf('草稿标记') >= 0`, 60000, 300).catch(() => {});
  const after = await cdp.eval(`(() => ({ value: (document.querySelector('#ex01-1 textarea') || {}).value || '' }))()`);
  record('刷新后草稿还在（练习里写的代码没丢）', after.value.indexOf('草稿标记') >= 0, JSON.stringify(after.value.slice(0, 40)));

  /* ---------- 二、四档视口的排版（对齐用量的，不靠看） ---------- */
  const METRICS = `(() => {
    const reads = [...document.querySelectorAll('.content .read')];
    const blocks = [];
    reads.forEach(r => [...r.children].forEach(c => blocks.push(c.getBoundingClientRect())));
    const lefts = blocks.map(r => Math.round(r.left)), rights = blocks.map(r => Math.round(r.right));
    const grid = document.querySelector('.ex-grid');
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0;`;

  for (const [w, h, label] of [[2000, 1100, '2000'], [1200, 900, '1200'], [760, 900, '760'], [390, 844, '390']]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 900 });
    await sleep(600);
    const m = await cdp.eval(`${METRICS}
    const card = document.querySelector('.ex-card');
    const ed = card ? card.querySelector('.editor-cell') : null;
    const sidebar = document.getElementById('sidebar');
    return {
      blocks: blocks.length,
      lr: lefts.length ? Math.max(...lefts.map((v,i)=>Math.abs(v-lefts[0]))) + Math.max(...rights.map((v,i)=>Math.abs(v-rights[0]))) : 0,
      cols: cols,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      topbarH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
      sidePos: sidebar ? getComputedStyle(sidebar).position : '',
      sideVis: sidebar ? getComputedStyle(sidebar).visibility : '',
      editorFont: ed ? parseFloat(getComputedStyle(card.querySelector('.editor-ta')).fontSize) : 0,
      navBtnShown: getComputedStyle(document.getElementById('nav-btn')).display !== 'none'
    };
  })()`);

    record(`宽 ${label}px：练习卡列数为 ${m.cols}`, m.cols >= 1, `${m.cols} 列`);
    record(`宽 ${label}px：没有横向溢出`, m.overflow <= 1, m.overflow + 'px');
    if (w >= 1200) {
      record(`宽 ${label}px：阅读区左右边缘对齐（极差 ≤ 2px）`, m.lr <= 2, m.lr + 'px');
    }
    if (w <= 900) {
      record(`宽 ${label}px：目录栏收成抽屉（fixed + hidden）`, m.sidePos === 'fixed' && m.sideVis === 'hidden', `${m.sidePos} / ${m.sideVis}`);
      record(`宽 ${label}px：顶栏出现「目录」按钮`, m.navBtnShown, String(m.navBtnShown));
      record(`宽 ${label}px：顶栏高 ≤ 60px`, m.topbarH <= 60, m.topbarH + 'px');
      record(`宽 ${label}px：编辑器字号 ≥ 16px`, m.editorFont >= 16, m.editorFont + 'px');
    }
  }

  /* 窄屏抽屉：真点按钮展开、点遮罩收起 */
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(400);
  await clickIn(cdp, '#nav-btn');
  await sleep(400);
  const opened = await cdp.eval(`(() => ({ open: document.body.classList.contains('nav-open'), vis: getComputedStyle(document.getElementById('sidebar')).visibility }))()`);
  record('点「目录」按钮能展开抽屉', opened.open && opened.vis === 'visible', JSON.stringify(opened));

  /* 滚过一屏后顶栏仍粘着（这条盯的是 html/body 高度那个坑） */
  await cdp.eval('window.scrollTo(0, 1600)');
  await sleep(400);
  const sticky = await cdp.eval(`(() => {
    const t = document.querySelector('.topbar').getBoundingClientRect();
    const b = document.getElementById('nav-btn').getBoundingClientRect();
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { top: Math.round(t.top), btnVisible: !!hit && (hit.id === 'nav-btn' || !!hit.closest('#nav-btn')) };
  })()`);
  record('滚到 1600px 后顶栏仍贴在顶部', sticky.top === 0, 'top=' + sticky.top);
  record('滚过一屏后「目录」按钮仍点得到', sticky.btnVisible, String(sticky.btnVisible));
  await cdp.eval('window.scrollTo(0, 0)');

  await clickIn(cdp, '.nav-backdrop');
  await sleep(400);
  const closed = await cdp.eval(`document.body.classList.contains('nav-open')`);
  record('点遮罩能收起抽屉', closed === false, String(closed));
  await cdp.send('Emulation.clearDeviceMetricsOverride');

  /* ---------- 三、file:// 直开 ---------- */
  const fileUrl = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
  await cdp.send('Page.navigate', { url: fileUrl });
  await cdp.waitFor('typeof window.VUELAB_SELFTEST === "function"', 30000);
  await cdp.eval(`location.hash = '#ch01'`);
  await cdp.waitFor('document.querySelectorAll("#ex01-1 textarea").length > 0', 90000);
  /* 练习卡不会在打开时自动判题，点一次「运行检查」走完整链路：
     读 vendor 字符串 → 沙箱 eval Vue → 编译 SFC → 挂载 → 跑断言 */
  await cdp.eval(`(() => { const b = document.querySelector('#ex01-1 .ex-actions .btn'); if (b) b.click(); return true; })()`);
  await cdp.waitFor('document.querySelector("#ex01-1 .test-mark.ok") !== null || document.querySelector("#ex01-1 .test-mark.bad") !== null', 90000, 400);
  const file = await cdp.eval(`(() => ({
    chapters: document.querySelectorAll('#sidebar .nav-item[data-ch]').length,
    marks: [...document.querySelectorAll('#ex01-1 .test-mark')].map(m => m.textContent).join(''),
    pill: document.querySelector('#ex01-1 .status-pill').textContent,
    errs: window.__errs || []
  }))()`);
  record('file:// 直开：目录渲染出来', file.chapters >= 1, file.chapters + ' 章');
  record('file:// 直开：沙箱仍能编译与判题', /✓|✗/.test(file.marks), file.marks + '　' + file.pill);
  record('file:// 直开：没有未捕获错误', file.errs.length === 0, file.errs.slice(0, 3).join(' ｜ '));

  /* ---------- 四、全量自测（可 --fast 跳过） ---------- */
  if (!fast) {
    await cdp.send('Page.navigate', { url: ctx.base + '/index.html?v=ui3' });
    await cdp.waitFor('typeof window.VUELAB_SELFTEST === "function"', 30000);
    const rep = await cdp.eval('window.VUELAB_SELFTEST().then(r => JSON.stringify(r))', { awaitPromise: true, timeoutMs: 300000 });
    const r = JSON.parse(rep);
    record('全量自测：示例全过', r.demos.pass === r.demos.total, r.demos.pass + '/' + r.demos.total);
    record('全量自测：参考答案全过', r.exercises.solutionAllPass === r.exercises.total, r.exercises.solutionAllPass + '/' + r.exercises.total);
    record('全量自测：起始代码全被抓', r.exercises.starterAllFail === r.exercises.total, r.exercises.starterAllFail + '/' + r.exercises.total);
    if (r.problems.length) r.problems.slice(0, 10).forEach(p => console.log(`      · ${p.where} — ${p.kind}：${p.detail}`));
  } else {
    console.log('（--fast：跳过全量自测）');
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
