/* app.js — 外壳：路由、目录、进度、练习场、自测钩子。 */
(function () {
  var R = window.H5LAB_render;

  var CHAPTERS = (window.H5LAB_CHAPTERS || []).slice().sort(function (a, b) {
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

  var KEY_PASSED = 'h5lab.v1.passed';
  var KEY_PG = 'h5lab.v1.playground.';

  /* ---------- 进度（只进 localStorage） ---------- */
  var passedMap = {};
  try { passedMap = JSON.parse(localStorage.getItem(KEY_PASSED) || '{}') || {}; } catch (e) { passedMap = {}; }

  function savePassed() {
    try { localStorage.setItem(KEY_PASSED, JSON.stringify(passedMap)); } catch (e) {}
  }

  var progress = {
    isPassed: function (id) { return !!passedMap[id]; },
    setPassed: function (id, v) {
      if (v) passedMap[id] = 1; else delete passedMap[id];
      savePassed();
    },
    passedCount: function () {
      return ALL_EXERCISES.filter(function (e) { return passedMap[e.sec.id]; }).length;
    },
    chapterStat: function (ch) {
      var list = (ch.sections || []).filter(function (s) { return s.kind === 'exercise'; });
      var done = list.filter(function (s) { return passedMap[s.id]; }).length;
      return { done: done, total: list.length };
    }
  };

  function shortTitle(t) { return String(t).replace(/^第\s*\d+\s*章\s*·\s*/, ''); }

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

  /* ---------- 侧栏 ---------- */
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
        Object.keys(localStorage).filter(function (k) { return k.indexOf('h5lab.v1.') === 0; })
          .forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      passedMap = {};
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

  /* ---------- 页面：总览 ---------- */
  function renderHome(main) {
    var c = R.el('div', 'content');
    var read = R.el('div', 'read');
    var work = R.el('div', 'work');
    c.appendChild(read);
    c.appendChild(work);

    read.appendChild(R.el('h1', null, 'HTML5 训练场'));
    var intro = R.el('div', 'md');
    intro.innerHTML = R.md([
      CHAPTERS.length + ' 章，从「一个页面该有哪些区块」写到「表单、媒体、绘图、存储」。每章三件事：读一段讲解、看一段当场渲染的示例、自己写一段 HTML 并当场检验。',
      '',
      '## 怎么用',
      '1. 顺着左侧目录往下读。遇到 **练习**，就在编辑器里改代码（`HTML` / `CSS` / `JS` 三块按页签切）。',
      '2. 停手一秒，预览窗会重新渲染；点 **运行 · 检验** 或按 `Ctrl + Enter` 跑断言。',
      '3. 断言清单里每条 ✗ 都会说出「期望什么、实际什么」。改到全 ✓ 为止，进度会自动记住。',
      '4. 想随手试标签，去 **练习场**。',
      '',
      '常用键：`Ctrl + Enter` 运行检验 · `Tab` 缩进 · `Esc` 关掉弹窗。'
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

  /* ---------- 页面：章节 ---------- */
  function renderChapterPage(main, chapter, index) {
    var c = R.el('div', 'content');
    var cards = R.renderChapter(chapter, c, {
      progress: progress,
      autoRun: function () { return document.getElementById('auto-run').checked; },
      onResult: refreshChrome
    });

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

    /* 练习卡与示例都是打开就渲染，一屏十几个 iframe，分帧启动免得卡住首屏 */
    cards.forEach(function (card, i) {
      setTimeout(function () { if (card.__run) card.__run(); }, 60 * i);
    });
  }

  /* ---------- 页面：练习场 ---------- */
  var PG_PANES = ['html', 'css', 'js'];
  var PG_DEFAULT = {
    html: [
      '<h1>练习场</h1>',
      '<p>左栏写代码，这里就是真实渲染出来的结果。</p>',
      '<ul>',
      '  <li>HTML 决定结构</li>',
      '  <li>CSS 决定样子</li>',
      '  <li>JS 决定行为</li>',
      '</ul>',
      '<button id="hi">点我</button>',
      '<p id="out"></p>'
    ].join('\n'),
    css: [
      'body { font-family: system-ui; }',
      'button {',
      '  padding: 6px 14px;',
      '  border: 1px solid #b04a16;',
      '  border-radius: 4px;',
      '  background: #faf9f5;',
      '  color: #b04a16;',
      '}'
    ].join('\n'),
    js: [
      "document.getElementById('hi').addEventListener('click', () => {",
      "  document.getElementById('out').textContent = '看到我了';",
      '});',
      "console.log('练习场已就绪');"
    ].join('\n')
  };

  function renderPlayground(main) {
    var c = R.el('div', 'content');
    var read = R.el('div', 'read');
    var work = R.el('div', 'work');
    c.appendChild(read);
    c.appendChild(work);

    read.appendChild(R.el('h1', null, '练习场'));
    var tip = R.el('div', 'md');
    tip.innerHTML = R.md('随手写点标签试试。三个页签分别是 `HTML` / `CSS` / `JS`，改完停手一秒自动重新渲染；`console.log` 出现在下面。');
    read.appendChild(tip);

    var grid = R.el('div', 'pg-grid');
    var editorBox = R.el('div', 'editor-cell');
    var previewBox = R.el('div', 'preview-box');
    var mount = R.el('div', 'preview-mount');
    previewBox.setAttribute('data-empty', '渲染中…');
    previewBox.appendChild(mount);
    grid.appendChild(editorBox);
    grid.appendChild(previewBox);
    work.appendChild(grid);

    var consoleBox = R.el('div', 'console-box');
    work.appendChild(consoleBox);

    var actions = R.el('div', 'ex-actions');
    var runBtn = R.el('button', 'btn btn-primary btn-sm', '重新渲染 · Ctrl+Enter');
    var clearBtn = R.el('button', 'btn btn-sm', '清空');
    var pill = R.el('span', 'status-pill idle', '就绪');
    actions.appendChild(runBtn);
    actions.appendChild(clearBtn);
    actions.appendChild(pill);
    work.appendChild(actions);

    var saved = {};
    var anySaved = false;
    PG_PANES.forEach(function (n) {
      var v = null;
      try { v = localStorage.getItem(KEY_PG + n); } catch (e) {}
      if (v != null) anySaved = true;
      saved[n] = (v != null) ? v : PG_DEFAULT[n];
    });
    if (!anySaved) saved = PG_DEFAULT;

    var timerId = null;
    var box = R.makeCodeBox(editorBox, PG_PANES, saved, {
      label: '练习场',
      onInput: function (name, v) {
        try { localStorage.setItem(KEY_PG + name, v); } catch (e) {}
        pill.className = 'status-pill idle';
        pill.textContent = '渲染中…';
        clearTimeout(timerId);
        timerId = setTimeout(run, 700);
      },
      onRun: function () { run(); }
    });

    function run() {
      clearTimeout(timerId);
      runBtn.disabled = true;
      consoleBox.textContent = '';
      var vals = box.values();
      window.H5LAB_RUN({
        mount: mount,
        html: vals.html,
        css: vals.css,
        js: vals.js,
        tests: [],
        onConsole: function (d) {
          consoleBox.appendChild(R.el('div', 'console-line' + (d.level === 'error' ? ' err' : d.level === 'warn' ? ' warn' : ''), d.text));
          consoleBox.scrollTop = consoleBox.scrollHeight;
        }
      }).then(function (res) {
        runBtn.disabled = false;
        if (res.error) {
          consoleBox.appendChild(R.el('div', 'console-line err', res.error.name + ': ' + res.error.message));
          pill.className = 'status-pill fail';
          pill.textContent = '出错了';
        } else if (res.jsError) {
          pill.className = 'status-pill fail';
          pill.textContent = '脚本出错';
        } else {
          pill.className = 'status-pill pass';
          pill.textContent = '渲染完成 · ' + res.durationMs + 'ms';
        }
      });
    }

    runBtn.addEventListener('click', run);
    clearBtn.addEventListener('click', function () {
      box.setValues({ html: '', css: '', js: '' });
      PG_PANES.forEach(function (n) { try { localStorage.removeItem(KEY_PG + n); } catch (e) {} });
      consoleBox.textContent = '';
      run();
      pill.className = 'status-pill idle';
      pill.textContent = '已清空';
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

  /* ---------- 自测钩子：示例自检 + 练习的参考解/起始代码，全在真实预览 iframe 里跑 ---------- */
  var selftestRunning = null;
  function selftest(filter) {
    if (selftestRunning) return selftestRunning;
    var mount = document.createElement('div');
    mount.style.cssText = 'position:fixed;left:-9999px;top:0;width:360px;height:240px;';
    document.body.appendChild(mount);

    var inChapter = function (chId) { return !filter || !filter.chapter || filter.chapter === chId; };
    var demos = ALL_DEMOS.filter(function (d) { return inChapter(d.ch); });
    var exercises = ALL_EXERCISES.filter(function (e) { return inChapter(e.ch); });

    var report = {
      demos: { total: demos.length, pass: 0 },
      exercises: { total: exercises.length, solutionAllPass: 0, starterAllFail: 0 },
      problems: [],
      ok: false
    };

    function attempt(job) {
      return window.H5LAB_RUN({
        mount: mount,
        html: job.html, css: job.css, js: job.js, full: !!job.full, tests: job.tests,
        timeoutMs: 15000, quietMs: 15, maxSettleMs: 600
      }).then(function (res) {
        if (res.error && res.error.name === 'TimeoutError') {
          return window.H5LAB_RUN({ mount: mount, html: job.html, css: job.css, js: job.js, full: !!job.full, tests: job.tests, timeoutMs: 20000, quietMs: 15, maxSettleMs: 800 });
        }
        return res;
      });
    }

    var chain = Promise.resolve();

    demos.forEach(function (d) {
      chain = chain.then(function () {
        var sec = d.sec;
        return attempt({ html: sec.html, css: sec.css, js: sec.js, full: !!sec.full, tests: sec.checks || [] }).then(function (res) {
          var failed = res.error ? [res.error.message] : (res.tests || []).filter(function (t) { return t.pass !== true; }).map(function (t) { return t.message || t.label; });
          if (res.jsError) failed.push(res.jsError.message);
          if (!res.error && !res.jsError && failed.length === 0) report.demos.pass++;
          else report.problems.push({ where: d.ch + ' 示例 sections[' + d.index + ']', kind: '示例自检未过', detail: failed.join('；') });
        });
      });
    });

    exercises.forEach(function (item) {
      chain = chain.then(function () {
        var sec = item.sec;
        var sol = R.mergeSolution(sec.starter, sec.solution);
        return attempt({ html: sol.html, css: sol.css, js: sol.js, full: !!sec.full, tests: sec.tests }).then(function (res) {
          var allPass = !res.error && !res.jsError && res.tests && res.tests.length === sec.tests.length && res.tests.every(function (t) { return t.pass; });
          if (allPass) report.exercises.solutionAllPass++;
          else report.problems.push({
            where: item.ch + ' ' + sec.id, kind: '参考解没全过',
            detail: res.error ? (res.error.name + ': ' + res.error.message)
              : res.jsError ? res.jsError.message
              : (res.tests || []).filter(function (t) { return t.pass !== true; }).map(function (t) { return t.message || t.label; }).join('；')
          });
          return attempt({ html: sec.starter.html, css: sec.starter.css, js: sec.starter.js, full: !!sec.full, tests: sec.tests });
        }).then(function (res) {
          var anyFail = !!res.error || !!res.jsError || (res.tests || []).some(function (t) { return t.pass === false; });
          if (anyFail) report.exercises.starterAllFail++;
          else report.problems.push({ where: item.ch + ' ' + sec.id, kind: '起始代码居然全过了（练习太松）', detail: '' });
        });
      });
    });

    selftestRunning = chain.then(function () {
      document.body.removeChild(mount);
      report.ok = report.problems.length === 0;
      selftestRunning = null;
      return report;
    }, function (e) {
      document.body.removeChild(mount);
      selftestRunning = null;
      report.problems.push({ where: '自测流程', kind: '抛错', detail: e.message });
      return report;
    });
    return selftestRunning;
  }
  window.H5LAB_SELFTEST = selftest;

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
      window.H5LAB_ALIVE = es;
    } catch (e) {}

    setTimeout(function () {
      if (window.H5LAB_ALIVE && window.H5LAB_ALIVE.readyState === 1) return;
      fetch('/__whoami').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        if (t.indexOf('html5-lab serve.py') !== 0) return;   // 不是本服务，别误报
        staleBanner(t);
      }).catch(function () {});
    }, 12000);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    keepAlive();
    buildSidebar();
    initNavDrawer();
    window.addEventListener('hashchange', route);
    document.getElementById('auto-run').addEventListener('change', function (ev) {
      try { localStorage.setItem('h5lab.v1.auto', ev.target.checked ? '1' : '0'); } catch (e) {}
    });
    try {
      if (localStorage.getItem('h5lab.v1.auto') === '0') document.getElementById('auto-run').checked = false;
    } catch (e) {}

    document.getElementById('reset-progress').addEventListener('click', resetProgress);

    route();

    if (/(^|[?&])selftest/.test(location.search)) {
      console.log('HTML5 训练场自测开始（' + ALL_DEMOS.length + ' 个示例 + ' + ALL_EXERCISES.length + ' 个练习）…');
      selftest().then(function (r) {
        console.log('SELFTEST ' + JSON.stringify(r));
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
