/* app.js — 外壳：路由、目录、进度、练习场、自测钩子、关窗即退。 */
(function () {
  var R = window.TSLAB_render;
  var JUDGE = window.TSLAB_JUDGE;

  var CHAPTERS = (window.TSLAB_CHAPTERS || []).slice().sort(function (a, b) {
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

  var KEY_PASSED = 'tslab.v1.passed';
  var KEY_PG = 'tslab.v1.playground';

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

  /* 沙箱运行器：判题里的 await run() 走这里（沙箱 iframe，opaque origin） */
  var exec = function (js, timeoutMs) {
    if (!window.TSLAB_SANDBOX) return Promise.resolve({ logs: [], error: { name: 'NoRunner', message: '沙箱没加载' } });
    return window.TSLAB_SANDBOX.run(js, timeoutMs);
  };

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
    /* 窄屏顶栏放不下「重置进度」，这个按钮只在窄屏的抽屉底部显示（顶栏那个在宽屏用） */
    var resetDrawer = R.el('button', 'btn btn-sm side-reset', '重置进度');
    resetDrawer.setAttribute('data-reset', 'drawer');
    resetDrawer.addEventListener('click', resetProgress);
    box.appendChild(resetDrawer);
    /* 友链：这一座站对应语言的快速参考（quickref.me 中文版），排在版权行之上 */
    var ref = R.el('p', 'side-ref');
    var refA = R.el('a', 'side-ref-link', 'TypeScript 快速参考 ↗');
    refA.href = 'https://quickref.me/zh-CN/docs/typescript.html';
    refA.target = '_blank';
    refA.rel = 'noopener';
    refA.title = 'TypeScript 快速参考（quickref.me，新窗口打开）';
    ref.appendChild(refA);
    box.appendChild(ref);
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
    /* 侧栏是静态骨架（buildSidebar 只跑一次），这里挂一次代理就够：点任何链接都收起抽屉 */
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
        Object.keys(localStorage).filter(function (k) { return k.indexOf('tslab.v1.') === 0; })
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

  function ctxFor() {
    return {
      progress: progress,
      exec: exec,
      autoRun: function () { return document.getElementById('auto-run').checked; },
      onResult: refreshChrome
    };
  }

  /* ---------- 总览 ---------- */
  function renderHome(main) {
    var c = R.el('div', 'content');
    var read = R.el('div', 'read');
    var work = R.el('div', 'work');
    c.appendChild(read);
    c.appendChild(work);

    read.appendChild(R.el('h1', null, 'TypeScript 训练场'));
    var intro = R.el('div', 'md');
    intro.innerHTML = R.md([
      CHAPTERS.length + ' 章，从「什么时候该写注解」写到「strict 下的报错怎么读」。每章三件事：读一段讲解、看一段当场判题的示例、自己写一段代码并当场检验。',
      '',
      '这个站教的不是类型体操，是**日常写 TS 会遇到的东西**：推断与注解、联合与收窄、泛型、工具类型、strict 报错、以及类型在运行时到底发生了什么。',
      '',
      '## 怎么用',
      '1. 顺着左侧目录往下读。遇到 **练习**，在编辑器里改代码。',
      '2. 点 **运行 · 检验** 或按 `Ctrl + Enter`：右边面板给出**类型诊断**与**编译产物**，下面逐条列出断言结果。',
      '3. 每条 ✗ 都会说清「期望什么、实际什么」。改到全 ✓ 为止，进度会自己记住。',
      '4. 想随手试一段类型，去 **练习场**。',
      '',
      '常用键：`Ctrl + Enter` 运行检验 · `Tab` 缩进 · `Esc` 关掉弹窗。页面里没有构建步骤、没有网络请求，双击 `index.html` 就能跑。'
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
    var cards = R.renderChapter(chapter, c, ctxFor());

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

    /* 示例与练习打开就判一次，分帧启动免得首屏卡住（编译器要先加载完） */
    cards.forEach(function (card, i) {
      setTimeout(function () {
        var run = card.__run || card.__judge;
        if (run) run(true);
      }, 60 * i);
    });
  }

  /* ---------- 练习场 ---------- */
  var PG_DEFAULT = [
    '// 随手试类型：改完停手一秒自动判题。',
    'type User = { id: number; name: string; admin?: boolean };',
    '',
    'const users: User[] = [',
    '  { id: 1, name: \'非茗\', admin: true },',
    '  { id: 2, name: \'访客\' },',
    '];',
    '',
    'function names(list: User[]): string[] {',
    '  return list.map(function (u) { return u.name; });',
    '}',
    '',
    'console.log(names(users).join(\', \'));'
  ].join('\n');

  function renderPlayground(main) {
    var c = R.el('div', 'content');
    var read = R.el('div', 'read');
    var work = R.el('div', 'work');
    c.appendChild(read);
    c.appendChild(work);

    read.appendChild(R.el('h1', null, '练习场'));
    var tip = R.el('div', 'md');
    tip.innerHTML = R.md('随手写一段 TypeScript。改完停手一秒自动判题；右边是类型诊断、编译产物与运行输出。这里没有断言，纯粹给自己试。');
    read.appendChild(tip);

    var grid = R.el('div', 'pg-grid');
    var editorCell = R.el('div', 'editor-cell');
    var panelCell = R.el('div', 'editor-cell');
    grid.appendChild(editorCell);
    grid.appendChild(panelCell);
    work.appendChild(grid);

    var panel = R.makePanel({ outEmpty: '这段代码没有输出。' });
    panelCell.appendChild(panel.el);

    var actions = R.el('div', 'ex-actions');
    var runBtn = R.el('button', 'btn btn-primary btn-sm', '检查 · Ctrl+Enter');
    var clearBtn = R.el('button', 'btn btn-sm', '清空');
    var pill = R.el('span', 'status-pill idle', '就绪');
    actions.appendChild(runBtn);
    actions.appendChild(clearBtn);
    actions.appendChild(pill);
    work.appendChild(actions);

    var saved = null;
    try { saved = localStorage.getItem(KEY_PG); } catch (e) {}
    var timerId = null;

    var editor = R.makeEditor(editorCell, saved != null ? saved : PG_DEFAULT, {
      label: '练习场',
      onInput: function (v) {
        try { localStorage.setItem(KEY_PG, v); } catch (e) {}
        pill.className = 'status-pill idle';
        pill.textContent = '判题中…';
        clearTimeout(timerId);
        timerId = setTimeout(run, 700);
      },
      onRun: function () { run(); }
    });

    function run() {
      clearTimeout(timerId);
      runBtn.disabled = true;
      panel.setBusy('判题中…');
      return JUDGE.runCase(editor.value, { tsconfig: undefined, exec: exec, alwaysRun: true }).then(function (res) {
        runBtn.disabled = false;
        if (res.error) {
          panel.fail(res.error.message);
          pill.className = 'status-pill fail';
          pill.textContent = '出错了';
          return;
        }
        panel.setDiags(res.diags);
        panel.setJs(res.js);
        panel.setLogs(res.logs, res.runError);
        if (res.diags.length) {
          pill.className = 'status-pill fail';
          pill.textContent = res.diags.length + ' 条类型错误';
        } else {
          pill.className = 'status-pill pass';
          pill.textContent = '没有类型错误 · ' + res.durationMs + 'ms';
        }
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
    setTimeout(run, 120);
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

  /* ---------- 自测钩子（全部在父页面里跑：编译器在父页面，运行器是沙箱 iframe） ---------- */
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

    var chain = JUDGE.ready();
    if (!filter || !filter.skipWarmup) chain = chain.then(function () { return JUDGE.runCase('let __warm: number = 1;', {}); });

    demos.forEach(function (d) {
      chain = chain.then(function () {
        return JUDGE.runCase(d.sec.code, { tests: d.sec.checks || [], tsconfig: d.sec.tsconfig, exec: exec, alwaysRun: R.wantsRun(d.sec.code, d.sec.checks, d.sec.run) });
      }).then(function (res) {
        var bad = res.error ? [res.error.message]
          : res.results.filter(function (t) { return t.pass !== true; }).map(function (t) { return t.message || t.label; });
        if (res.runError) bad.push(res.runError.message);
        if (!bad.length && res.results.length === (d.sec.checks || []).length) report.demos.pass++;
        else report.problems.push({ where: d.ch + ' 示例 sections[' + d.index + ']', kind: '示例自检未过', detail: bad.join('；') });
      });
    });

    exercises.forEach(function (item) {
      chain = chain.then(function () {
        return JUDGE.runCase(item.sec.solution, { tests: item.sec.tests, tsconfig: item.sec.tsconfig, exec: exec });
      }).then(function (res) {
        var bad = res.error ? [res.error.message] : res.results.filter(function (t) { return t.pass !== true; }).map(function (t) { return t.message || t.label; });
        if (!bad.length && res.results.length === item.sec.tests.length) report.exercises.solutionAllPass++;
        else report.problems.push({ where: item.ch + ' ' + item.sec.id, kind: '参考解没全过', detail: bad.join('；') });
        return JUDGE.runCase(item.sec.starter, { tests: item.sec.tests, tsconfig: item.sec.tsconfig, exec: exec });
      }).then(function (res) {
        var caught = !!res.error || res.results.some(function (t) { return t.pass === false; });
        if (caught) report.exercises.starterAllFail++;
        else report.problems.push({ where: item.ch + ' ' + item.sec.id, kind: '起始代码居然全过了（练习太松）', detail: '' });
      });
    });

    selftestRunning = chain.then(function () {
      report.ok = report.problems.length === 0;
      selftestRunning = null;
      return report;
    }, function (e) {
      selftestRunning = null;
      report.problems.push({ where: '自测流程', kind: '抛错', detail: String(e && e.message) });
      return report;
    });
    return selftestRunning;
  }
  window.TSLAB_SELFTEST = selftest;

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
      window.TSLAB_ALIVE = es;
    } catch (e) {}

    setTimeout(function () {
      if (window.TSLAB_ALIVE && window.TSLAB_ALIVE.readyState === 1) return;
      fetch('/__whoami').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        if (t.indexOf('ts-lab serve.py') !== 0) return;   // 不是本服务，别误报
        staleBanner(t);
      }).catch(function () {});
    }, 12000);
  }

  /* ---------- 编译器加载提示 ---------- */
  function bootCompiler() {
    var strip = document.getElementById('boot-strip');
    var t0 = Date.now();
    JUDGE.ready().then(function () {
      /* 预热：第一次建 Program 要 200–300 ms，趁现在摊掉 */
      if (window.requestIdleCallback) {
        requestIdleCallback(function () { JUDGE.runCase('let __warm: number = 1;', {}); });
      }
      strip.hidden = true;
      window.TSLAB_COMPILER_READY = { ms: Date.now() - t0 };
    }, function (e) {
      strip.className = 'boot-strip failed';
      strip.innerHTML = '';
      strip.appendChild(R.el('b', null, '编译器没加载起来：'));
      strip.appendChild(document.createTextNode(String(e && e.message || e) + '　页面里的判题与示例都不会工作。'));
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    keepAlive();
    buildSidebar();
    initNavDrawer();
    window.addEventListener('hashchange', route);
    document.getElementById('auto-run').addEventListener('change', function (ev) {
      try { localStorage.setItem('tslab.v1.auto', ev.target.checked ? '1' : '0'); } catch (e) {}
    });
    try {
      if (localStorage.getItem('tslab.v1.auto') === '0') document.getElementById('auto-run').checked = false;
    } catch (e) {}

    document.getElementById('reset-progress').addEventListener('click', resetProgress);

    route();
    /* 先让首屏画出来，再去拉 12 MB 的编译器（拉完顺手预热一次） */
    setTimeout(bootCompiler, 0);

    if (/(^|[?&])selftest/.test(location.search)) {
      console.log('TypeScript 训练场自测开始（' + ALL_DEMOS.length + ' 个示例 + ' + ALL_EXERCISES.length + ' 个练习）…');
      selftest().then(function (r) {
        console.log('SELFTEST ' + JSON.stringify(r));
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
