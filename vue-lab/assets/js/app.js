/* app.js — 外壳：路由、目录、进度、练习场、自测钩子、关窗即退。
 *
 * 与 ts-lab 的差别：那边判题在父页面主线程（编译器在那儿），
 * 这边**编译与挂载都在沙箱里**（SFC 编译器与 Vue 运行时都是文本，送进 iframe 求值）。
 * 父页面只做两件事：把源码 postMessage 进去、把结果收回来渲染。
 */
(function () {
  var R = window.VUELAB_render;
  var BOX = window.VUELAB_SANDBOX;

  var CHAPTERS = (window.VUELAB_CHAPTERS || []).slice().sort(function (a, b) {
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  var ALL_EXERCISES = [];
  var ALL_DEMOS = [];
  CHAPTERS.forEach(function (ch) {
    (ch.sections || []).forEach(function (sec, i) {
      if (sec.kind === 'exercise') ALL_EXERCISES.push({ ch: ch.id, sec: sec });
      if (sec.kind === 'demo') ALL_DEMOS.push({ ch: ch.id, sec: sec, index: i });
    });
  });

  var KEY_PASSED = 'vuelab.v1.passed';
  var KEY_PG = 'vuelab.v1.playground';
  var KEY_CODE = 'vuelab.v1.code.';      // 每个练习自己的草稿

  var passMap = {};
  try { passMap = JSON.parse(localStorage.getItem(KEY_PASSED) || '{}') || {}; } catch (e) { passMap = {}; }
  function savePassed() { try { localStorage.setItem(KEY_PASSED, JSON.stringify(passMap)); } catch (e) {} }

  var progress = {
    isPassed: function (id) { return !!passMap[id]; },
    setPassed: function (id, v) { if (v) passMap[id] = 1; else delete passMap[id]; savePassed(); },
    passedCount: function () { return ALL_EXERCISES.filter(function (e) { return passMap[e.sec.id]; }).length; },
    chapterStat: function (ch) {
      var list = (ch.sections || []).filter(function (s) { return s.kind === 'exercise'; });
      var done = list.filter(function (s) { return passMap[s.id]; }).length;
      return { done: done, total: list.length };
    }
  };

  function shortTitle(t) { return String(t).replace(/^第\s*\d+\s*章\s*·\s*/, ''); }

  /* 运行器：一切都在沙箱里跑，父页面不执行用户代码 */
  function run(src, tests) {
    if (!BOX) {
      return Promise.resolve({ fatal: '沙箱没加载（assets/js/sandbox.js 缺失）', tests: [] });
    }
    return BOX.run({ src: src, tests: tests || [] });
  }
  function runDemo(src, tests, frame) {
    if (!BOX) return Promise.resolve({ fatal: '沙箱没加载', tests: [] });
    return BOX.runDemo(src, tests, frame || null);
  }

  /* 每个练习的草稿都存一份，刷新不丢 */
  function loadDraft(id) { try { return localStorage.getItem(KEY_CODE + id); } catch (e) { return null; } }
  function saveDraft(id, code) { try { localStorage.setItem(KEY_CODE + id, code); } catch (e) {} }

  function refreshChrome() {
    var total = ALL_EXERCISES.length;
    var done = progress.passedCount();
    var pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = done + '/' + total;

    Array.prototype.forEach.call(document.querySelectorAll('.nav-item[data-ch]'), function (item) {
      var ch = CHAPTERS.filter(function (c) { return c.id === item.getAttribute('data-ch'); })[0];
      if (!ch) return;
      var st = progress.chapterStat(ch);
      var countEl = item.querySelector('.nav-count');
      if (countEl) countEl.textContent = st.done + '/' + st.total;
      item.classList.toggle('done', st.total > 0 && st.done === st.total);
    });
  }

  function buildSidebar() {
    var sb = document.getElementById('sidebar');
    sb.innerHTML = '';
    sb.appendChild(R.el('div', 'nav-group', '章节'));
    CHAPTERS.forEach(function (ch, i) {
      var a = R.el('a', 'nav-item');
      a.href = '#' + ch.id;
      a.setAttribute('data-ch', ch.id);
      a.setAttribute('data-route-item', ch.id);
      a.appendChild(R.el('span', 'nav-label', String(i + 1).padStart(2, '0') + '  ' + shortTitle(ch.title)));
      a.appendChild(R.el('span', 'nav-count', '0/0'));
      sb.appendChild(a);
    });
    sb.appendChild(R.el('div', 'nav-sep'));
    var pg = R.el('a', 'nav-item');
    pg.href = '#playground';
    pg.setAttribute('data-route-item', 'playground');
    pg.appendChild(R.el('span', 'nav-label', '练习场'));
    sb.appendChild(pg);
    sb.appendChild(sideFoot());
    refreshChrome();
  }

  /* 目录栏底部：回 LightHouse 目录 + 版权（工具页在 tools/ 下，往回退一级） */
  function sideFoot() {
    var box = R.el('div', 'side-foot');
    var back = R.el('a', 'side-back', '← LightHouse 目录');
    back.href = /\/tools\/[^/]*$/.test(location.pathname) ? '../../index.html' : '../index.html';
    box.appendChild(back);
    var resetDrawer = R.el('button', 'btn btn-sm side-reset', '重置进度');
    resetDrawer.setAttribute('data-reset', 'drawer');
    resetDrawer.addEventListener('click', resetProgress);
    box.appendChild(resetDrawer);
    var credit = R.el('p', 'side-credit', '© 2026 非茗 · Naimio');
    var gh = R.el('a', 'gh-link');
    gh.href = 'https://github.com/NaimioChan/LightHouse';
    gh.setAttribute('aria-label', 'GitHub 仓库');
    gh.title = 'GitHub 仓库';
    gh.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
    credit.appendChild(gh);
    box.appendChild(credit);
    return box;
  }

  /* ---------- 窄屏目录抽屉 ---------- */
  function closeNav() {
    document.body.classList.remove('nav-open');
    var b = document.getElementById('nav-btn');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function initNavDrawer() {
    var btn = document.getElementById('nav-btn');
    var backdrop = document.getElementById('nav-backdrop');
    var sb = document.getElementById('sidebar');
    if (!btn || !backdrop || !sb) return;

    btn.addEventListener('click', function () {
      var open = !document.body.classList.contains('nav-open');
      document.body.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    backdrop.addEventListener('click', closeNav);
    sb.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
      if (a) closeNav();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' || ev.keyCode === 27) closeNav();
    });
  }

  function resetProgress() {
    R.confirmBox('重置全部进度？', '练习里写过的代码与已通过记录都会被清掉，无法撤销。', '重置', function () {
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf('vuelab.v1.') === 0; })
          .forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      passMap = {};
      location.reload();
    });
  }

  function markActive(route) {
    Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (a) {
      a.classList.toggle('active', a.getAttribute('data-route-item') === route);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.topnav a'), function (a) {
      a.classList.toggle('active', a.getAttribute('data-route') === route);
    });
  }

  function ctxFor(cards) {
    return {
      progress: progress,
      runDemo: runDemo,
      pending: [],
      autoRun: function () { return document.getElementById('auto-run').checked; },
      onEdit: function (id, code) { saveDraft(id, code); },
      onPass: function (id) { progress.setPassed(id, true); refreshChrome(); },
      onFail: function (id) { progress.setPassed(id, false); refreshChrome(); },
      run: run
    };
  }

  /* ---------- 总览 ---------- */
  function renderHome(main) {
    var c = R.el('div', 'content');
    var read = R.el('div', 'read');
    var work = R.el('div', 'work');
    c.appendChild(read);
    c.appendChild(work);

    read.appendChild(R.el('h1', null, 'Vue 3 训练场'));
    var intro = R.el('div', 'md');
    intro.innerHTML = R.md([
      CHAPTERS.length + ' 章，从一个单文件组件写到组件之间怎么通信。每章三件事：读一段讲解、看一段当场跑起来的示例、自己写一段代码并当场检验。',
      '',
      '写的是真实写法：`<script setup>` + `<template>` + `<style scoped>`，编译与运行都在浏览器里完成，没有构建步骤。',
      '',
      '## 怎么用',
      '1. 顺着左侧目录往下读。遇到 **练习**，在左边的编辑器里改代码。',
      '2. 点 **运行检查** 或按 `Ctrl + Enter`：右边是真跑起来的组件，下面逐条列出检查项结果。',
      '3. 每条 ✗ 都会说清「期望什么、实际什么」。改到全 ✓ 为止，进度会自己记住。',
      '4. 想随手试一个组件，去 **练习场**。',
      '',
      '常用键：`Ctrl + Enter` 运行 · `Tab` 缩进 · `Esc` 关掉弹窗。双击 `index.html` 就能跑，不用起服务。'
    ].join('\n'));
    read.appendChild(intro);

    var grid = R.el('div', 'ch-grid');
    CHAPTERS.forEach(function (ch) {
      var st = progress.chapterStat(ch);
      var a = R.el('a', 'ch-card' + (st.total && st.done === st.total ? ' done' : ''));
      a.href = '#' + ch.id;
      a.appendChild(R.el('div', 'ch-title', ch.title));
      a.appendChild(R.el('div', 'ch-goal', ch.goal));
      a.appendChild(R.el('div', 'ch-meta', '练习 ' + st.done + '/' + st.total));
      grid.appendChild(a);
    });
    work.appendChild(grid);
    main.appendChild(c);
  }

  /* ---------- 章节 ---------- */
  function renderChapterPage(main, chapter, index) {
    var c = R.el('div', 'content');
    var cards = { byId: {} };
    var ctx = ctxFor(cards);
    var built = R.renderChapter(chapter, ctx);
    c.appendChild(built.el);
    built.cards.forEach(function (card) { cards.byId[card.el.getAttribute('data-ex')] = card; });
    ctx.cards = cards;

    var pager = R.el('div', 'pager');
    var prev = CHAPTERS[index - 1], next = CHAPTERS[index + 1];
    if (prev) {
      var a = R.el('a', 'btn btn-sm', '← ' + shortTitle(prev.title));
      a.href = '#' + prev.id;
      pager.appendChild(a);
    } else {
      pager.appendChild(R.el('span'));
    }
    if (next) {
      var b = R.el('a', 'btn btn-sm', shortTitle(next.title) + ' →');
      b.href = '#' + next.id;
      pager.appendChild(b);
    }
    var pagerHost = R.el('div', 'read');
    pagerHost.appendChild(pager);
    c.appendChild(pagerHost);
    main.appendChild(c);

    /* 恢复草稿：练习里写了一半的代码刷新后还在 */
    built.cards.forEach(function (card) {
      var id = card.el.getAttribute('data-ex');
      var draft = loadDraft(id);
      if (draft != null && draft !== '' && draft !== card.getCode()) card.setCode(draft);
    });

    /* 示例打开就编译一次（示例多，分帧启动免得首屏卡住） */
    (ctx.pending || []).forEach(function (demo, i) {
      setTimeout(function () { demo.render(); }, 80 * i);
    });
  }

  /* ---------- 练习场 ---------- */
  var PG_DEFAULT = [
    '<scr' + 'ipt setup>',
    "import { ref, computed } from 'vue'",
    '',
    "const items = ref(['苹果', '香蕉'])",
    'const draft = ref(\'\')',
    'const count = computed(() => items.value.length)',
    '',
    'function add() {',
    '  const t = draft.value.trim()',
    '  if (!t) return',
    '  items.value.push(t)',
    "  draft.value = ''",
    '}',
    '</scr' + 'ipt>',
    '',
    '<template>',
    '  <div>',
    '    <input v-model="draft" @keyup.enter="add" placeholder="加一项">',
    '    <button @click="add">添加</button>',
    '    <p>共 {{ count }} 项</p>',
    '    <ul>',
    '      <li v-for="(it, i) in items" :key="i">{{ it }}</li>',
    '    </ul>',
    '  </div>',
    '</template>'
  ].join('\n');

  function renderPlayground(main) {
    var c = R.el('div', 'content');
    var read = R.el('div', 'read');
    var work = R.el('div', 'work');
    c.appendChild(read);
    c.appendChild(work);

    read.appendChild(R.el('h1', null, '练习场'));
    var tip = R.el('div', 'md');
    tip.innerHTML = R.md('随手写一个单文件组件。改完停手一秒自动编译；右边是它真跑起来的样子，下面是编译产物。这里没有检查项，纯粹给自己试。');
    read.appendChild(tip);

    var grid = R.el('div', 'pg-grid');
    var editorCell = R.el('div', 'editor-cell');
    var previewCell = R.el('div', 'editor-cell');
    grid.appendChild(editorCell);
    grid.appendChild(previewCell);
    work.appendChild(grid);

    /* 预览用可复用的 iframe；下面那个折页显示编译产物 */
    var previewHost = R.el('div', 'preview-box');
    var pvHead = R.el('div', 'preview-head');
    pvHead.appendChild(R.el('span', null, '渲染结果'));
    var pvNote = R.el('span', 'preview-note');
    pvHead.appendChild(pvNote);
    var pvFrame = document.createElement('iframe');
    pvFrame.className = 'preview-frame';
    pvFrame.setAttribute('sandbox', 'allow-scripts');
    pvFrame.setAttribute('title', '组件渲染预览');
    previewHost.appendChild(pvHead);
    previewHost.appendChild(pvFrame);
    previewCell.appendChild(previewHost);

    var jsBox = R.el('div', 'preview-box');
    jsBox.style.marginTop = '12px';
    var jsHead = R.el('div', 'preview-head');
    jsHead.appendChild(R.el('span', null, '编译产物'));
    jsBox.appendChild(jsHead);
    var jsPre = R.el('pre', 'panel-pane');
    jsPre.style.position = 'static';
    jsPre.style.minHeight = '120px';
    jsBox.appendChild(jsPre);
    work.appendChild(jsBox);

    var actions = R.el('div', 'ex-actions');
    var runBtn = R.el('button', 'btn btn-primary btn-sm', '编译 · Ctrl+Enter');
    var clearBtn = R.el('button', 'btn btn-sm', '清空');
    var pill = R.el('span', 'status-pill idle', '就绪');
    actions.appendChild(runBtn);
    actions.appendChild(clearBtn);
    actions.appendChild(pill);
    work.appendChild(actions);

    var saved = null;
    try { saved = localStorage.getItem(KEY_PG); } catch (e) {}
    var timerId = null;

    var editor = R.makeEditor(editorCell, saved != null && saved !== '' ? saved : PG_DEFAULT, {
      label: '练习场',
      onInput: function (v) {
        try { localStorage.setItem(KEY_PG, v); } catch (e) {}
        pill.className = 'status-pill idle';
        pill.textContent = '编译中…';
        clearTimeout(timerId);
        timerId = setTimeout(run, 700);
      },
      onRun: function () { run(); }
    });

    function run() {
      clearTimeout(timerId);
      runBtn.disabled = true;
      pvNote.textContent = '编译中…';
      return runDemo(editor.value, [], pvFrame).then(function (res) {
        runBtn.disabled = false;
        jsPre.textContent = res.compiled || '（编译失败，没有产物）';
        if (res.fatal) {
          pvNote.textContent = '编译失败';
          pill.className = 'status-pill fail';
          pill.textContent = '编译失败';
          return;
        }
        if (res.runtimeErrors && res.runtimeErrors.length) {
          pvNote.textContent = '运行出错';
          pill.className = 'status-pill fail';
          pill.textContent = res.runtimeErrors.length + ' 个运行错误';
          return;
        }
        pvNote.textContent = res.durationMs + ' ms';
        pill.className = 'status-pill pass';
        pill.textContent = '编译通过 · ' + res.durationMs + 'ms';
      });
    }

    runBtn.addEventListener('click', run);
    clearBtn.addEventListener('click', function () {
      editor.value = '';
      try { localStorage.removeItem(KEY_PG); } catch (e) {}
      pill.className = 'status-pill idle';
      pill.textContent = '已清空';
      run();
    });

    main.appendChild(c);
    setTimeout(run, 200);
  }

  /* ---------- 路由 ---------- */
  function route() {
    var hash = (location.hash || '').replace(/^#/, '') || 'home';
    var main = document.getElementById('main');
    main.innerHTML = '';
    window.scrollTo(0, 0);

    if (hash === 'home') { renderHome(main); markActive('home'); return; }
    if (hash === 'playground') { renderPlayground(main); markActive('playground'); return; }

    var idx = -1;
    for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === hash) idx = i;
    if (idx === -1) { location.hash = 'home'; return; }
    renderChapterPage(main, CHAPTERS[idx], idx);
    markActive(hash);
    refreshChrome();
  }

  /* ---------- 自测钩子 ----------
   * 全部在沙箱里跑。每道练习跑两遍：参考答案必须全过、起始代码必须挂。
   * 用 cases 一次性送进去，省掉几十次 iframe 重建。 */
  var selftestRunning = null;
  function selftest(filter) {
    if (selftestRunning) return selftestRunning;
    var inChapter = function (chId) { return !filter || !filter.chapter || filter.chapter === chId; };
    var demos = ALL_DEMOS.filter(function (d) { return inChapter(d.ch); });
    var exercises = ALL_EXERCISES.filter(function (e) { return inChapter(e.ch); });

    var report = {
      demos: { total: demos.length, pass: 0 },
      exercises: { total: exercises.length, solutionAllPass: 0, starterAllFail: 0 },
      problems: [], ok: false
    };

    /* 每个 case 一个 id，回传时按 id 对账 */
    var cases = [];
    demos.forEach(function (d) {
      cases.push({ id: 'demo:' + d.ch + ':' + d.index, src: d.sec.code, tests: d.sec.tests || [], _demo: d });
    });
    exercises.forEach(function (e) {
      cases.push({ id: 'sol:' + e.sec.id, src: e.sec.solution, tests: e.sec.tests, _ex: e, _kind: 'solution' });
      cases.push({ id: 'sta:' + e.sec.id, src: e.sec.starter, tests: e.sec.tests, _ex: e, _kind: 'starter' });
    });

    function evaluate(res, batch) {
      batch.forEach(function (c) {
        var got = res.cases[c.id];
        if (!got) {
          report.problems.push({ where: c.id, kind: '沙箱没有回传这个用例', detail: '' });
          return;
        }
        var failedList = (got.tests || []).filter(function (t) { return !t.pass; });
        var runtimeBad = (got.runtimeErrors || []).length > 0;
        var hardFail = !!got.fatal || runtimeBad;
        var detail = got.fatal || ((got.runtimeErrors || [])[0] || {}).message || failedList.map(function (t) { return t.message; }).join('；');

        if (c._demo) {
          if (!hardFail && !failedList.length && (got.tests || []).length === (c.tests || []).length) report.demos.pass++;
          else report.problems.push({ where: c._demo.ch + ' 示例 sections[' + c._demo.index + ']', kind: '示例自检未过', detail: detail });
        } else if (c._kind === 'solution') {
          if (!hardFail && !failedList.length && (got.tests || []).length === c.tests.length) report.exercises.solutionAllPass++;
          else report.problems.push({ where: c._ex.ch + ' ' + c._ex.sec.id, kind: '参考解没全过', detail: detail });
        } else {
          if (hardFail || failedList.length) report.exercises.starterAllFail++;
          else report.problems.push({ where: c._ex.ch + ' ' + c._ex.sec.id, kind: '起始代码居然全过了（练习太松）', detail: '' });
        }
      });
    }

    selftestRunning = BOX.preload()
      .then(function () {
        /* 分章跑，一章一个沙箱 run。
           一次把 96 份用例塞进去会超时（第 11、12 章里有真定时器，单份要几百毫秒，
           累计超过单次 run 的预算，后面几章就成了「没回传」）。分章之后每章几秒，
           哪一章挂了也看得清。 */
        var byChapter = {};
        cases.forEach(function (c) {
          var key = c._demo ? c._demo.ch : c._ex.ch;
          (byChapter[key] = byChapter[key] || []).push(c);
        });
        var ids = Object.keys(byChapter).sort();
        var chain = Promise.resolve();
        ids.forEach(function (id) {
          chain = chain.then(function () {
            return BOX.run({ src: null, tests: [], cases: byChapter[id] }, { timeoutMs: 90000 })
              .then(function (res) { evaluate(res, byChapter[id]); }, function (e) {
                report.problems.push({ where: id, kind: '这一章的沙箱运行失败', detail: String(e && e.message || e) });
              });
          });
        });
        return chain;
      })
      .then(function () {
        report.ok = report.problems.length === 0;
        selftestRunning = null;
        return report;
      }, function (e) {
        selftestRunning = null;
        report.problems.push({ where: '自测流程', kind: '抛错', detail: String(e && e.message || e) });
        return report;
      });
    return selftestRunning;
  }
  window.VUELAB_SELFTEST = selftest;

  /* 自测时 cases 里的 src 需要真实存在；这里顺手导出一份章节清单给验收脚本对账 */
  window.VUELAB_STATS = {
    chapters: CHAPTERS.length,
    exercises: ALL_EXERCISES.length,
    demos: ALL_DEMOS.length,
    tests: ALL_EXERCISES.reduce(function (n, e) { return n + (e.sec.tests || []).length; }, 0)
      + ALL_DEMOS.reduce(function (n, d) { return n + (d.sec.tests || []).length; }, 0)
  };

  /* ---------- 本地服务模式：页面关掉 → 服务退出 → 终端窗口跟着关 ---------- */
  function staleBanner(tag) {
    if (document.getElementById('stale-banner')) return;
    var b = document.createElement('div');
    b.id = 'stale-banner';
    b.className = 'stale-banner';
    b.innerHTML = '<span><strong>这个页面是浏览器缓存里的旧版本。</strong>按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> 强制刷新一次：页面才是最新的，关掉这个标签页时命令行窗口也才会跟着关。</span>'
      + '<span class="stale-tag">' + (tag || '') + '</span>';
    document.body.insertBefore(b, document.body.firstChild);
  }

  function keepAlive() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;   // file:// 直开没有服务
    if (!/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) return;
    try {
      var es = new EventSource('/__alive');
      var opened = false;
      es.onopen = function () { opened = true; };
      es.onerror = function () { if (!opened) es.close(); };
      window.VUELAB_ALIVE = es;
    } catch (e) {}

    setTimeout(function () {
      if (window.VUELAB_ALIVE && window.VUELAB_ALIVE.readyState === 1) return;
      fetch('/__whoami').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        if (t.indexOf('vue-lab serve.py') !== 0) return;   // 不是本服务，别误报
        staleBanner(t);
      }).catch(function () {});
    }, 12000);
  }

  /* ---------- 编译器加载提示（约 950 KB，只在首屏之后拉） ---------- */
  function bootCompiler() {
    var strip = document.getElementById('boot-strip');
    var t0 = Date.now();
    BOX.preload().then(function () {
      strip.hidden = true;
      window.VUELAB_COMPILER_READY = { ms: Date.now() - t0 };
    }, function (e) {
      strip.className = 'boot-strip failed';
      strip.innerHTML = '';
      strip.appendChild(R.el('b', null, 'Vue 编译器没加载起来：'));
      strip.appendChild(document.createTextNode(String(e && e.message || e) + '　页面里的练习与示例都不会工作。'));
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    keepAlive();
    buildSidebar();
    initNavDrawer();
    window.addEventListener('hashchange', route);
    document.getElementById('auto-run').addEventListener('change', function (ev) {
      try { localStorage.setItem('vuelab.v1.auto', ev.target.checked ? '1' : '0'); } catch (e) {}
    });
    try {
      if (localStorage.getItem('vuelab.v1.auto') === '0') document.getElementById('auto-run').checked = false;
    } catch (e) {}

    document.getElementById('reset-progress').addEventListener('click', resetProgress);

    route();
    /* 先让首屏画出来，再去拉 950 KB 的编译器 */
    setTimeout(bootCompiler, 0);

    if (/(^|[?&])selftest/.test(location.search)) {
      console.log('Vue 3 训练场自测开始（' + ALL_DEMOS.length + ' 个示例 + ' + ALL_EXERCISES.length + ' 个练习）…');
      selftest().then(function (r) {
        console.log('SELFTEST ' + JSON.stringify(r));
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
