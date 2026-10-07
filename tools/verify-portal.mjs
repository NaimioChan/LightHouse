/* verify-portal.mjs — 入口页 + 各座站入口页的真浏览器验收（起根 serve.py + 无头 Edge，走 CDP）。
 *
 * 验的东西：令牌入口与 302 跳转、HTML 里资源 URL 的令牌改写、按 Referer 认站名的 /__whoami、
 * 入口页的标题/副标题/简介与卡片内容是否与清单一致、三种宽度下的对齐与列数、各座站入口页的章节数与编辑器、
 * 全站没有 404、以及「读进度 → 显示已通过 / 继续第 N 章」这条分支（测试前后备份还原），最后走一遍 file://。
 *
 * 用法：
 *   node tools/verify-portal.mjs                # 全部
 *   node tools/verify-portal.mjs --headful      # 看着浏览器跑
 *   node tools/verify-portal.mjs --shots        # 顺带截图到 .cache/
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, paths, startServer, startBrowser, waitHttp, connect, armErrorCollector, reporter, killAll, cacheDir, sleep } from './lib/cdp.mjs';
import { build } from './build-manifest.mjs';

const argv = process.argv.slice(2);
const headful = argv.includes('--headful');
const shots = argv.includes('--shots');

const HTTP_PORT = Number(process.env.LIGHTHOUSE_HTTP_PORT || 8899);
const CDP_PORT = Number(process.env.LIGHTHOUSE_CDP_PORT || 9228);
const ctx = paths({ cdpPort: CDP_PORT, httpPort: HTTP_PORT });
const CACHE = cacheDir();
const { record, finish } = reporter();
const children = [];

const LABS = build();

/* 各站的渲染入口全局名（内容注册表是 <X>_CHAPTERS，渲染器是 <X>_render）——从 labs.json 读，不写死 */
const RENDER_GLOBAL = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'labs.json'), 'utf8'))
    .map((l) => [l.dir, l.registry.replace('_CHAPTERS', '_render')]),
);

/* 各站的入口页都请求过 favicon，缺它只是 404 噪音，不算缺陷 */
const isNoise = (line) => /favicon/.test(line);

async function navigate(cdp, url) {
  cdp.clearEvents();
  await cdp.send('Page.navigate', { url });
  await cdp.waitFor("document.readyState === 'complete' || document.readyState === 'interactive'", 30000);
  await sleep(300);
}

async function shot(cdp, name) {
  try {
    await cdp.send('Page.bringToFront');
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' }, 30000);
    if (r && r.data) fs.writeFileSync(path.join(CACHE, name + '.png'), Buffer.from(r.data, 'base64'));
  } catch (e) { console.log('  （截图失败，忽略：' + e.message + '）'); }
}

/* ---------- 一、服务端行为（不用浏览器也能查的那几条） ---------- */
async function checkServer() {
  const head = async (p, referer) => {
    const r = await fetch(ctx.base + p, { redirect: 'manual', headers: referer ? { Referer: referer } : {} });
    return { status: r.status, location: r.headers.get('location'), text: r.status === 200 ? await r.text() : '' };
  };

  const root = await head('/');
  record('/ 302 到带令牌的入口', root.status === 302 && /^\/index\.html\?v=.+/.test(root.location || ''), `${root.status} ${root.location}`);

  const bare = await head('/index.html');
  record('/index.html 不带令牌时也跳一次', bare.status === 302 && /^\/index\.html\?v=.+/.test(bare.location || ''), `${bare.status} ${bare.location}`);

  /* 令牌由服务端每次启动生成，客户端带什么进来都不算数 —— 从 302 的 Location 里取真的那个 */
  const token = (root.location || '').split('?v=')[1] || '';

  const portal = await head(`/index.html?v=${token}`);
  record('入口页 HTML 里资源 URL 带上本轮令牌',
    portal.status === 200 && portal.text.includes(`assets/css/portal.css?v=${token}`) && portal.text.includes(`assets/js/manifest.js?v=${token}`),
    `token=${token}`);
  record('服务出去的入口页不限定领域与站数（不写死站名/目录名/前端）',
    !LABS.some((l) => portal.text.includes(l.title) || portal.text.includes(l.dir)) && !/前端|四座|四个站/.test(portal.text));

  const labDir = await head('/css-lab/');
  record('目录请求 302 到该站 index.html', labDir.status === 302 && /^\/css-lab\/index\.html\?v=.+/.test(labDir.location || ''), `${labDir.status} ${labDir.location}`);

  for (const lab of LABS) {
    const html = await head(`/${lab.entry}?v=${token}`);
    const ok = html.status === 200 &&
      new RegExp(`assets/[^"]+\\.(css|js)\\?v=${token}`).test(html.text) &&
      new RegExp(`content/[^"]+\\.js\\?v=${token}`).test(html.text);
    record(`${lab.title} 的页面里 assets/content 资源带本轮令牌`, ok, 'HTTP ' + html.status);
  }
  const tsHtml = (await head(`/${LABS.find((l) => l.key === 'ts').entry}?v=${token}`)).text;
  record('ts-lab 的 vendor 是运行时加载的（HTML 里不引它）', !tsHtml.includes('vendor/'), '编译器由 assets/js 按需拉取');
  const vendor = await fetch(ctx.base + '/ts-lab/vendor/typescript.js', { method: 'HEAD', redirect: 'manual' });
  record('vendor 也带 no-store（不会被浏览器缓存住旧版本）',
    vendor.status === 200 && /no-store/.test(vendor.headers.get('cache-control') || ''),
    `${vendor.status} ${vendor.headers.get('cache-control')}`);

  const whoPortal = await head('/__whoami', ctx.base + '/index.html?v=verify');
  record('/__whoami 对入口页回 lighthouse 前缀', whoPortal.text.startsWith('lighthouse serve.py'), whoPortal.text);

  for (const lab of LABS) {
    const t = (await head('/__whoami', `${ctx.base}/${lab.entry}?v=verify`)).text;
    record(`/__whoami 按 Referer 把 ${lab.dir} 的旧缓存检测接住`, t.startsWith(`${lab.dir} serve.py`), t);
  }
}

/* ---------- 二、入口页的 DOM ---------- */
async function checkPortal(cdp) {
  await armErrorCollector(cdp);
  await navigate(cdp, ctx.base + '/index.html?v=verify');
  await cdp.waitFor(`document.querySelectorAll('#cards .card').length === ${LABS.length}`, 20000);
  record('入口页渲染出每座站一张卡片', true, `${LABS.length} 张`);

  const dom = await cdp.eval(`(() => {
    const cards = [...document.querySelectorAll('#cards .card')];
    const attr = (el, name) => (el ? el.getAttribute(name) : null);
    const text = (el) => (el ? el.textContent : null);
    return {
      hero: text(document.querySelector('.hero h1')),
      sub: text(document.querySelector('.hero .sub')),
      intro: text(document.querySelector('.hero .intro')),
      cards: cards.map(c => ({
        key: c.dataset.lab,
        stats: text(c.querySelector('.card-stats')),
        blurb: text(c.querySelector('.card-blurb')),
        title: attr(c.querySelector('.card-title a'), 'href'),
        enter: attr(c.querySelector('.btn-enter'), 'href'),
        cont: attr(c.querySelector('[data-continue]'), 'href'),
        accent: getComputedStyle(c).borderTopColor,
      })),
    };
  })()`);

  record('大标题就是 LightHouse', dom.hero === 'LightHouse', dom.hero);
  record('副标题保持领域中立（不列语言、不列站名）',
    !LABS.some((l) => dom.sub.includes(l.title)) && !/HTML5|TypeScript|前端/.test(dom.sub), dom.sub);
  record('简介是一小段（≤140 字，不许堆介绍）', dom.intro.length > 20 && dom.intro.length <= 140, `${dom.intro.length} 字：${dom.intro}`);

  /* 简介的断行：宽屏下两行，且除末行外每行都要用满——按标点硬断（word-break: keep-all）
     会让第一行空掉四成、末尾多一行孤字，这里连行宽一起量 */
  const introWrap = await cdp.eval(`(() => {
    const p = document.querySelector('.hero .intro');
    const node = p.firstChild;
    const r = document.createRange();
    const boxes = [];
    for (let i = 0; i < node.data.length; i++) {
      r.setStart(node, i); r.setEnd(node, i + 1);
      const b = r.getBoundingClientRect();
      boxes.push({ top: Math.round(b.top), left: b.left, right: b.right });
    }
    const lines = []; let cur = [], top = boxes[0].top;
    for (const b of boxes) { if (Math.abs(b.top - top) > 2) { lines.push(cur); cur = []; top = b.top; } cur.push(b); }
    lines.push(cur);
    return {
      count: lines.length,
      used: lines.map(l => Math.round(l[l.length - 1].right - l[0].left)),
      box: Math.round(p.getBoundingClientRect().width),
    };
  })()`);
  const linesFull = introWrap.used.slice(0, -1).every((u) => u >= introWrap.box * 0.85);
  record('宽屏下简介断成两行、每行都用满（不按标点提前换行）',
    introWrap.count === 2 && linesFull, `${introWrap.count} 行：${introWrap.used.join('/')} px（行宽 ${introWrap.box}）`);

  const footText = await cdp.eval("(document.querySelector('.foot') || {}).textContent || ''");
  record('入口页页脚有版权行', footText.includes('© 2026 非茗 · Naimio'), footText.trim().slice(0, 60));

  LABS.forEach((lab, i) => {
    const d = dom.cards.find((x) => x.key === lab.key) || {};
    record(`${lab.title} 卡片规模数字与清单一致`,
      d.stats === `${lab.stats.chapters} 章 · ${lab.stats.exercises} 练习 · ${lab.stats.examples} 示例`, d.stats);
    record(`${lab.title} 卡片的一句话与 labs.json 一致`, d.blurb === lab.blurb, d.blurb);
    record(`${lab.title} 卡片的入口链接指向它自己的目录`, d.enter === lab.entry && d.title === lab.entry, String(d.enter));
  });
  record('每张卡片的顶边颜色互不相同', new Set(dom.cards.map((d) => d.accent)).size === LABS.length, dom.cards.map((d) => d.accent).join(' / '));
  record('页面按清单顺序排列各座站', dom.cards.map((c) => c.key).join(',') === LABS.map((l) => l.key).join(','), dom.cards.map((c) => c.key).join(','));

  const noProgress = await cdp.eval(`document.querySelectorAll('[data-continue]').length`);
  console.log(`  （当前浏览器配置里已有进度的站：${noProgress} 个）`);

  const errs = await cdp.eval('window.__errs || []');
  record('入口页没有未捕获错误', errs.length === 0, errs.slice(0, 3).join(' ｜ '));
  const bad = cdp.failedRequests().filter((l) => !isNoise(l));
  record('入口页资源没有 404', bad.length === 0, bad.slice(0, 3).join(' ｜ '));
  if (shots) await shot(cdp, 'portal-1600');

  /* 三种宽度：列数、卡片左右边缘对齐、有没有横向溢出 */
  for (const [w, expectCols] of [[2000, 2], [1200, 2], [760, 1]]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: false });
    await sleep(300);
    const m = await cdp.eval(`(() => {
      const r = (el) => {
        const b = el.getBoundingClientRect();
        const act = el.querySelector('.card-actions');
        return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom),
                 btnBottom: act ? Math.round(act.getBoundingClientRect().bottom) : Math.round(b.bottom) };
      };
      const page = r(document.querySelector('.page'));
      const cards = [...document.querySelectorAll('#cards .card')].map(r);
      return {
        page, cards,
        client: document.documentElement.clientWidth,
        scrollW: document.documentElement.scrollWidth,
        cols: cards.length > 1 ? (cards[0].t === cards[1].t ? 2 : 1) : 1,
      };
    })()`);
    const lefts = m.cards.map((c) => c.l), rights = m.cards.map((c) => c.r), widths = m.cards.map((c) => c.r - c.l);
    const spread = (a) => Math.max(...a) - Math.min(...a);
    /* 同列的两张卡左右边缘必须对齐：两列时 col1 = 第 1、3 张，col2 = 第 2、4 张 */
    const col1 = m.cards.filter((_, i) => i % m.cols === 0), col2 = m.cards.filter((_, i) => i % m.cols === 1);
    const aligned = (rows) => rows.length < 2 || (spread(rows.map((c) => c.l)) <= 2 && spread(rows.map((c) => c.r)) <= 2);
    record(`${w}px 宽：卡片网格 ${expectCols} 列`, m.cols === expectCols, `${m.cols} 列`);
    record(`${w}px 宽：同列卡片左右边缘对齐（极差 ≤ 2px）`, aligned(col1) && aligned(col2), `左 ${lefts.join('/')}　右 ${rights.join('/')}`);
    record(`${w}px 宽：每张卡片等宽（极差 ≤ 2px）`, spread(widths) <= 2, `宽 ${widths.join('/')}`);
    /* 同一行（top 相同的那些卡）按钮底边要齐；一列布局时每行只有一张，跳过 */
    const rowsByTop = {};
    m.cards.forEach((c) => { (rowsByTop[c.t] = rowsByTop[c.t] || []).push(c.btnBottom); });
    const rowsOk = Object.values(rowsByTop).every((g) => g.length < 2 || spread(g) <= 2);
    record(`${w}px 宽：同一行的卡片按钮底边对齐（极差 ≤ 2px）`, rowsOk, `按钮底边 ${m.cards.map((c) => c.btnBottom).join('/')}`);
    record(`${w}px 宽：内容在页面里居中（|左留白 − 右留白| ≤ 3px）`,
      Math.abs(m.page.l - (m.client - m.page.r)) <= 3, `左 ${m.page.l}　右 ${m.client - m.page.r}`);
    record(`${w}px 宽：没有横向溢出`, m.scrollW <= m.client + 1, `scrollWidth ${m.scrollW} / clientWidth ${m.client}`);
    if (shots) await shot(cdp, `portal-${w}`);
  }
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  await sleep(200);
}

/* ---------- 三、各站自己的入口页 ---------- */
async function checkLabs(cdp) {
  for (const lab of LABS) {
    await armErrorCollector(cdp);
    await navigate(cdp, `${ctx.base}/${lab.entry}?v=verify#${lab.chapters[0].id}`);
    const prefix = lab.dir;
    try {
      await cdp.waitFor(`document.querySelectorAll('#sidebar a[data-ch]').length === ${lab.stats.chapters}`, 25000);
      record(`${prefix} 侧栏章节数与清单一致`, true, `${lab.stats.chapters} 章`);
    } catch (e) {
      record(`${prefix} 侧栏章节数与清单一致`, false, e.message);
      continue;
    }
    await cdp.waitFor(`document.querySelectorAll('.ex-card').length > 0`, 25000).catch(() => {});
    const seen = await cdp.eval(`(() => ({
      cards: document.querySelectorAll('.ex-card').length,
      empty: [...document.querySelectorAll('.ex-card textarea')].filter(t => !t.value.trim()).length,
      editors: document.querySelectorAll('.ex-card textarea').length,
      errs: window.__errs || [],
    }))()`);
    record(`${prefix} 第一章有练习卡且编辑器都有起始代码`, seen.cards > 0 && seen.editors > 0 && seen.empty === 0,
      `卡片 ${seen.cards} / 编辑器 ${seen.editors} / 空的 ${seen.empty}`);
    record(`${prefix} 页面没有未捕获错误`, seen.errs.length === 0, seen.errs.slice(0, 3).join(' ｜ '));
    const bad = cdp.failedRequests().filter((l) => !isNoise(l));
    record(`${prefix} 资源没有 404`, bad.length === 0, bad.slice(0, 3).join(' ｜ '));

    /* 目录栏底部：回入口页的按钮 + 版权行（侧栏是静态骨架，每个路由都在） */
    const foot = await cdp.eval(`(() => {
      const rect = (el) => (el ? el.getBoundingClientRect() : null);
      const back = document.querySelector('#sidebar .side-back');
      const credit = document.querySelector('#sidebar .side-credit');
      const lastNav = [...document.querySelectorAll('#sidebar a[data-ch]')].pop();
      return {
        backText: back ? back.textContent.trim() : null,
        backHref: back ? back.getAttribute('href') : null,
        backBottom: rect(back) ? Math.round(rect(back).bottom) : null,
        sideBottom: Math.round(rect(document.querySelector('#sidebar')).bottom),
        belowList: !!(back && lastNav && rect(back).top >= rect(lastNav).top),
        creditText: credit ? credit.textContent.trim() : null,
      };
    })()`);
    const resolved = foot.backHref ? new URL(foot.backHref, `${ctx.base}/${lab.entry}`).pathname : '';
    record(`${prefix} 目录栏底部有回入口页的按钮`,
      resolved === '/index.html' && /LightHouse/.test(foot.backText || ''), `${foot.backText} → ${resolved}`);
    record(`${prefix} 按钮在最后一条章节链接之下（目录栏底部）`, foot.belowList === true,
      `按钮底边 ${foot.backBottom} / 侧栏底边 ${foot.sideBottom}`);
    record(`${prefix} 目录栏底部有版权行`, foot.creditText === '© 2026 非茗 · Naimio', String(foot.creditText));

    /* 迷你 markdown：行内代码里的星号必须原样显示（js-lab ch02 的 `+ - * / %` 与 `**` 踩过这个坑） */
    const probe = await cdp.eval(`(() => {
      const R = window[${JSON.stringify(RENDER_GLOBAL[lab.dir])}];
      if (!R || typeof R.md !== 'function') return null;
      return R.md(${JSON.stringify('运算符 `+ - * / %` 与 `**` 都是符号。')});
    })()`);
    const codeTexts = typeof probe === 'string' ? probe.split('<code>').slice(1).map((s) => s.split('</code>')[0]) : [];
    record(`${prefix} 行内代码里的星号不被当成强调标记`,
      !!probe && codeTexts.includes('+ - * / %') && codeTexts.includes('**') && !probe.includes('<em>'),
      String(probe).slice(0, 110));

    if (lab.key === 'js') {
      await navigate(cdp, `${ctx.base}/${lab.entry}?v=verify#ch02`);
      await cdp.waitFor("document.querySelectorAll('.read .md code').length > 0", 20000).catch(() => {});
      const op = await cdp.eval(`(() => {
        const md = [...document.querySelectorAll('.read .md')].find((n) => n.textContent.indexOf('算术运算符') >= 0);
        return md ? { html: md.innerHTML, text: md.textContent } : null;
      })()`);
      record('js-lab 第 2 章运算符文案原样渲染（不丢乘号、乘方号不变乘号）',
        !!op && op.text.includes('算术运算符：+ - * / %（取余）和 **（乘方）。') && !op.html.includes('<em>'),
        op ? op.text.slice(0, 90) : '没找到那一段');
    }

    if (shots) await shot(cdp, 'lab-' + lab.key);
  }
}

/* ---------- 四、进度分支：清空 → 看未开始 → 造进度 → 看继续 → 还原 ----------
 * 无头浏览器用的是自己的临时配置目录（serve.py 同目录外的 Temp/lighthouse-cdp-<端口>），
 * 这里读写的都是那个配置的 localStorage，不是用户日常浏览器的进度；备份还原只是让脚本可重复跑。
 */
function expectedNext(lab, passedIds) {
  const set = new Set(passedIds);
  for (let i = 0; i < lab.chapters.length; i++) {
    const ch = lab.chapters[i];
    if (ch.exercises.some((id) => !set.has(id))) return { ch, index: i };
  }
  return null;
}

async function checkProgress(cdp) {
  const keys = LABS.map((l) => l.progressKey);
  await navigate(cdp, ctx.base + '/index.html?v=verify');
  await cdp.waitFor(`document.querySelectorAll('#cards .card').length === ${LABS.length}`, 20000);

  const backup = await cdp.eval(`(() => {
    const out = {};
    for (const k of ${JSON.stringify(keys)}) out[k] = localStorage.getItem(k);
    return out;
  })()`);
  await cdp.eval(`(() => { for (const k of ${JSON.stringify(keys)}) localStorage.removeItem(k); return true; })()`);

  /* 未开始 */
  await navigate(cdp, ctx.base + '/index.html?v=verify');
  await cdp.waitFor(`document.querySelectorAll('#cards .card').length === ${LABS.length}`, 20000);
  const blank = await cdp.eval(`(() => ({
    cont: document.querySelectorAll('[data-continue]').length,
    lines: [...document.querySelectorAll('#cards .card .progress-line')].map(n => n.textContent.replace(/\\s+/g, ' ').trim()),
    widths: [...document.querySelectorAll('#cards .card .track > span')].map(n => n.style.width),
  }))()`);
  record('没有进度时不出现「继续」按钮', blank.cont === 0, blank.cont + ' 个');
  record('没有进度时每张卡片都写「还没开始」', blank.lines.every((t) => t.includes('还没开始')), blank.lines[0]);
  record('没有进度时进度条宽度为 0', blank.widths.every((w) => w === '0%'), blank.widths.join(' '));

  /* 造 3 条进度 */
  const target = LABS.find((l) => l.key === 'css') || LABS[0];
  const seeded = target.chapters[0].exercises.slice(0, 3);
  const next = expectedNext(target, seeded);
  await cdp.eval(`(() => {
    const map = {};
    for (const id of ${JSON.stringify(seeded)}) map[id] = 1;
    localStorage.setItem(${JSON.stringify(target.progressKey)}, JSON.stringify(map));
    return true;
  })()`);

  await navigate(cdp, ctx.base + '/index.html?v=verify');
  await cdp.waitFor(`document.querySelector('[data-lab="${target.key}"] [data-continue]') !== null`, 20000);
  const shown = await cdp.eval(`(() => {
    const card = document.querySelector('[data-lab="${target.key}"]');
    return {
      line: card.querySelector('.progress-line').textContent.replace(/\\s+/g, ' ').trim(),
      width: card.querySelector('.track > span').style.width,
      cont: card.querySelector('[data-continue]').getAttribute('href'),
      label: card.querySelector('[data-continue]').textContent,
      doneCards: [...document.querySelectorAll('[data-continue]')].length,
    };
  })()`);
  record('造了 3 条进度后显示「已通过 3 / N」',
    shown.line.includes(`3 / ${target.stats.exercises}`), shown.line);
  record('进度条宽度按比例算', shown.width === Math.round(3 / target.stats.exercises * 100) + '%', shown.width);
  record('「继续」跳到第一个没做完的章',
    shown.cont === `${target.entry}#${next.ch.id}` && shown.label.includes(`第 ${next.index + 1} 章`),
    `${shown.cont}　${shown.label}`);
  record('只有造过进度的那座站出现「继续」', shown.doneCards === 1, shown.doneCards + ' 个');

  const restored = await cdp.eval(`(() => {
    const saved = ${JSON.stringify(backup)};
    for (const k of Object.keys(saved)) {
      if (saved[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, saved[k]);
    }
    const now = {};
    for (const k of Object.keys(saved)) now[k] = localStorage.getItem(k);
    return now;
  })()`);
  record('测试用的进度键已还原', JSON.stringify(restored) === JSON.stringify(backup), JSON.stringify(restored).slice(0, 80));
}

/* ---------- 五、双击 index.html 的 file:// 路径 ---------- */
async function checkFileMode(cdp) {
  const url = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';
  await armErrorCollector(cdp);
  await navigate(cdp, url);
  await cdp.waitFor(`document.querySelectorAll('#cards .card').length === ${LABS.length}`, 20000).catch(() => {});
  const seen = await cdp.eval(`(() => ({
    cards: document.querySelectorAll('#cards .card').length,
    banner: !!document.getElementById('stale-banner'),
    lines: [...document.querySelectorAll('#cards .card .progress-line')].map(n => n.textContent.replace(/\\s+/g, ' ').trim()),
    errs: window.__errs || [],
  }))()`);
  record('file:// 直开也能渲染出全部卡片', seen.cards === LABS.length, seen.cards + ' 张');
  record('file:// 下不误报「缓存旧版本」横幅', seen.banner === false);
  record('file:// 下进度读不到时不崩（照常显示文案）', seen.lines.length === LABS.length, seen.lines[0]);
  record('file:// 下没有未捕获错误', seen.errs.length === 0, seen.errs.slice(0, 3).join(' ｜ '));
  if (shots) await shot(cdp, 'portal-file');
}

/* ---------- 跑 ---------- */
async function main() {
  children.push(startServer({}, HTTP_PORT));
  children.push(startBrowser({ cdpPort: CDP_PORT, userDataDir: ctx.userDataDir, headless: !headful }));
  if (!(await waitHttp(ctx.base, 20000))) throw new Error('根 serve.py 没起来（端口 ' + HTTP_PORT + '）');

  console.log('=== 服务端行为 ===');
  await checkServer();

  const cdp = await connect(ctx);
  console.log('\n=== 入口页 ===');
  await checkPortal(cdp);
  console.log('\n=== 各座训练场入口页 ===');
  await checkLabs(cdp);
  console.log('\n=== 进度显示 ===');
  await checkProgress(cdp);
  console.log('\n=== 离线 file:// 直开 ===');
  await checkFileMode(cdp);
}

main()
  .catch((e) => record('验收流程', false, e.stack || e.message))
  .finally(async () => {
    const code = finish();
    killAll(children);
    await sleep(300);
    process.exit(code);
  });
