/* verify-pages.mjs — 逐章渲染检查：真把每一章开一遍，数 DOM、找没渲染的东西、抓未捕获错误。
 *
 * 数量是拿 node 读出来的内容与浏览器里的 DOM 对账，不是凭记忆写的期望值。
 *
 * 用法：node tools/verify-pages.mjs [--chapter ch05] [--shots] [--headful]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, paths, startServer, startBrowser, waitHttp, connect, armErrorCollector, reporter, killAll, cacheDir, sleep } from './lib/cdp.mjs';

const argv = process.argv.slice(2);
const only = argv.includes('--chapter') ? argv[argv.indexOf('--chapter') + 1] : null;
const shots = argv.includes('--shots');
const headful = argv.includes('--headful');

const HTTP_PORT = Number(process.env.RLLAB_PAGES_HTTP_PORT || 8885);
const CDP_PORT = Number(process.env.RLLAB_PAGES_CDP_PORT || 9227);
const ctx = paths({ cdpPort: CDP_PORT, httpPort: HTTP_PORT });
const CACHE = cacheDir();
const { record, finish } = reporter();
const children = [];

/* ---------- node 侧先算出「应该看到什么」 ---------- */
function readChapter(file) {
  const c = vm.createContext({});
  vm.runInContext(fs.readFileSync(file, 'utf8'), c, { filename: file });
  return (c.RLLAB_CHAPTERS || [])[0];
}
const contentDir = path.join(ROOT, 'content');
const expected = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort().map((f) => {
  const ch = readChapter(path.join(contentDir, f));
  const secs = ch.sections || [];
  return {
    id: ch.id,
    file: f,
    demos: secs.filter((s) => s.kind === 'demo').length,
    exercises: secs.filter((s) => s.kind === 'exercise').length,
    tests: secs.filter((s) => s.kind === 'exercise').reduce((n, s) => n + (s.tests || []).length, 0),
    tables: secs.filter((s) => s.kind === 'table').length,
  };
}).filter((e) => !only || e.id === only);

function argued(j) { return `断言结果 ${j.marks}　状态 ${j.pill}`; }

async function main() {
  if (!expected.length) throw new Error('没有可验的章节');
  children.push(startServer({}, HTTP_PORT));
  children.push(startBrowser({ cdpPort: CDP_PORT, userDataDir: ctx.userDataDir, headless: !headful }));
  if (!(await waitHttp(ctx.base, 20000))) throw new Error('serve.py 没起来（端口 ' + HTTP_PORT + '）');
  const cdp = await connect(ctx);
  await armErrorCollector(cdp);
  await cdp.send('Page.navigate', { url: ctx.base + '/index.html?v=pages' });
  await cdp.waitFor('typeof window.RLLAB_SELFTEST === "function"', 40000);
  await cdp.waitFor('window.RLLAB_COMPILER_READY', 120000, 500);
  record('React 运行库在 http 下加载完成', true, (await cdp.eval('window.RLLAB_COMPILER_READY.ms')) + ' ms');

  for (const exp of expected) {
    await cdp.send('Page.navigate', { url: ctx.base + '/index.html?v=pages#skip' });
    await cdp.eval(`location.hash = ${JSON.stringify('#' + exp.id)}`);
    await sleep(500);
    /* 等这一章的示例跑完自检（.case-foot 里不再有「运行中…」） */
    await cdp.waitFor('(() => { const f = document.querySelectorAll(".case-foot"); return f.length > 0 && ![...f].some(x => x.textContent.indexOf("运行中") >= 0); })()', 120000, 300);

    const seen = await cdp.eval(`(() => ({
      cards: document.querySelectorAll('.ex-card').length,
      cases: document.querySelectorAll('.case').length,
      previews: document.querySelectorAll('.case .preview-frame').length,
      previewFilled: [...document.querySelectorAll('.case .preview-frame')].filter(f => (f.getAttribute('srcdoc')||'').length > 200).length,
      rows: document.querySelectorAll('.ex-card .test-row').length,
      tables: document.querySelectorAll('.content .tbl').length,
      emptyEditors: [...document.querySelectorAll('.ex-card textarea')].filter(t => !t.value.trim()).length,
      badNotes: [...document.querySelectorAll('.case-note')].filter(n => n.offsetParent !== null).map(n => n.textContent.slice(0, 120)),
      noOutput: [...document.querySelectorAll('.case-foot')].filter(f => !f.textContent.trim()).length,
      errs: window.__errs || []
    }))()`);

    const prefix = exp.id + ' ' + exp.file;
    record(prefix + ' 练习卡数量与内容一致', seen.cards === exp.exercises, `${seen.cards} / 期望 ${exp.exercises}`);
    record(prefix + ' 示例数量与内容一致', seen.cases === exp.demos, `${seen.cases} / 期望 ${exp.demos}`);
    record(prefix + ' 每个示例都有渲染预览', seen.cases === 0 || seen.previews >= seen.cases, `${seen.previews} / 期望 ${exp.demos}`);
    record(prefix + ' 预览都真渲染了（srcdoc 非空）', seen.cases === 0 || seen.previewFilled === seen.previews, `${seen.previewFilled}/${seen.previews}`);
    record(prefix + ' 断言行数与内容一致', seen.rows === exp.tests, `${seen.rows} / 期望 ${exp.tests}`);
    record(prefix + ' 表格数量与内容一致', seen.tables === exp.tables, `${seen.tables} / 期望 ${exp.tables}`);
    record(prefix + ' 编辑器都有内容', seen.emptyEditors === 0, String(seen.emptyEditors));
    record(prefix + ' 示例自检没挂（没有可见的红条）', seen.badNotes.length === 0, seen.badNotes.join(' ｜ '));
    record(prefix + ' 每个示例都有结果说明', seen.noOutput === 0, `${seen.noOutput} 个空`);
    record(prefix + ' 没有未捕获错误', seen.errs.length === 0, seen.errs.slice(0, 3).join(' ｜ '));

    /* 「看改写产物」要真的能点开，且里面有东西 */
    const probe = await cdp.eval(`(() => {
      const btn = document.querySelector('.case-head .btn');
      if (!btn) return { ok: false, why: '没有折叠按钮' };
      btn.click();
      const pre = document.querySelector('.case-js');
      const visible = pre && pre.offsetParent !== null;
      const text = pre ? pre.textContent.trim() : '';
      btn.click();
      const hiddenAgain = pre && pre.hasAttribute('hidden');
      return { ok: visible && text.length > 0 && !!hiddenAgain, len: text.length, hiddenAgain: !!hiddenAgain };
    })()`);
    record(prefix + ' 「看改写产物」能展开且产物非空', probe.ok === true, JSON.stringify(probe));

    /* 一份练习卡的状态：点运行检查应当给出「起始代码至少挂一条」的结果 */
    const judged = await cdp.eval(`(async () => {
      const card = document.querySelector('.ex-card');
      if (!card) return null;
      const btns = [...card.querySelectorAll('.ex-actions .btn')];
      btns[0].click();
      await new Promise(r => setTimeout(r, 6000));
      return {
        marks: [...card.querySelectorAll('.test-mark')].map(m => m.textContent).join(''),
        pill: card.querySelector('.status-pill').textContent,
        msg: ((card.querySelector('.test-msg') || {}).textContent || '').slice(0, 80)
      };
    })()`, { awaitPromise: true, timeoutMs: 40000 });
    if (judged) {
      record(prefix + ' 起始代码在页面上跑得出结果（有 ✗）', /✗/.test(judged.marks), argued(judged));
    }

    if (shots) {
      await cdp.send('Page.bringToFront');
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000).catch(() => null);
      if (shot && shot.data) fs.writeFileSync(path.join(CACHE, 'page-' + exp.id + '.png'), Buffer.from(shot.data, 'base64'));
    }
  }

  const errs = await cdp.eval('window.__errs || []');
  record('整轮没有未捕获错误', errs.length === 0, errs.slice(0, 5).join(' ｜ '));
}

main()
  .catch((e) => record('验收流程', false, e.stack || e.message))
  .finally(async () => {
    const code = finish();
    killAll(children);
    await sleep(300);
    process.exit(code);
  });
