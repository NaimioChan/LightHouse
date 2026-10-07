/* app.js — 外壳：路由、目录、进度、练习场、自测钩子。 */
(function () {
  var R = window.JSLAB_render;

  var CHAPTERS = (window.JSLAB_CHAPTERS || []).slice().sort(function (a, b) {
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  var ALL_EXERCISES = [];
  CHAPTERS.forEach(function (ch) {
    (ch.sections || []).forEach(function (sec) {
      if (sec.kind === 'exercise') ALL_EXERCISES.push({ ch: ch.id, sec: sec });
    });
  });

  var KEY_PASSED = 'jslab.v1.passed';
  var KEY_PG = 'jslab.v1.playground';

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
    passedCount: function () { return ALL_EXERCISES.filter(function (e) { return passedMap[e.sec.id]; }).length; },
    chapterStat: function (ch) {
      var list = (ch.sections || []).filter(function (s) { return s.kind === 'exercise'; });
      var done = list.filter(function (s) { return passedMap[s.id]; }).length;
      return { done: done, total: list.length };
    }
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
      var label = ch.title.replace(/^第\s*\d+\s*章\s*·\s*/, '');
      a.appendChild(R.el('span', 'nav-label', String(i + 1).padStart(2, '0') + '  ' + label));
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
    box.appendChild(R.el('p', 'side-credit', '© 2026 非茗 · Naimio'));
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
    R.confirmBox('重置全部进度？', '练习代码与已通过记录都会被清掉，无法撤销。', '重置', function () {
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf('jslab.v1.') === 0; })
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

    read.appendChild(R.el('h1', null, 'JS 训练场'));
    var intro = R.el('div', 'md');
    intro.innerHTML = R.md([
      '十四章，从「什么是变量」走到「异步并发怎么写才不出错」。每章三件事：读一段讲解、跑一段示例、自己写一段代码并当场检验。',
      '',
      '## 怎么用',
      '1. 顺着左侧目录往下读，遇到 **练习** 就在左边的编辑器里写。',
      '2. 停手一秒，页面会自动运行并跑断言；右侧白框里就是你代码的真实运行结果。',
      '3. 断言清单里每条 ✗ 都会说出「期望什么、实际什么」。改到全 ✓ 为止，进度会自动记住。',
      '4. 想单独试手，去 **练习场**。',
      '',
      '常用键：`Ctrl + Enter` 立刻运行 · `Tab` 缩进 · `Esc` 关掉弹窗。'
    ].join('\n'));
    read.appendChild(intro);

    var grid = R.el('div', 'ch-grid');
    CHAPTERS.forEach(function (ch, i) {
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
    R.renderChapter(chapter, c, {
      progress: progress,
      autoRun: function () { return document.getElementById('auto-run').checked; },
      onResult: refreshChrome
    });

    var pager = R.el('div', 'pager');
    var prev = CHAPTERS[index - 1], next = CHAPTERS[index + 1];
    if (prev) {
      var a = R.el('a', 'btn btn-sm', '← ' + prev.title.replace(/^第\s*\d+\s*章\s*·\s*/, ''));
      a.href = '#' + prev.id;
      pager.appendChild(a);
    } else {
      pager.appendChild(R.el('span'));
    }
    if (next) {
      var b = R.el('a', 'btn btn-sm', next.title.replace(/^第\s*\d+\s*章\s*·\s*/, '') + ' →');
      b.href = '#' + next.id;
      pager.appendChild(b);
    }
    var pagerHost = R.el('div', 'read');
    pagerHost.appendChild(pager);
    c.appendChild(pagerHost);
    main.appendChild(c);
  }

  /* ---------- 页面：练习场 ---------- */
  function renderPlayground(main) {
    var c = R.el('div', 'content');
    var read = R.el('div', 'read');
    var work = R.el('div', 'work');
    c.appendChild(read);
    c.appendChild(work);

    read.appendChild(R.el('h1', null, '练习场'));
    var tip = R.el('div', 'md');
    tip.innerHTML = R.md('随手写点什么。`console.log` 会出现在下面，动 DOM 会出现在上面的白框里。');
    read.appendChild(tip);

    var grid = R.el('div', 'pg-grid');
    var editorBox = R.el('div', 'editor-box');
    var previewBox = R.el('div', 'preview-box');
    var mount = R.el('div', 'preview-mount');
    previewBox.appendChild(R.el('div', 'preview-empty', '运行后这里显示真实结果'));
    previewBox.appendChild(mount);
    grid.appendChild(editorBox);
    grid.appendChild(previewBox);
    work.appendChild(grid);
    var consoleBox = R.el('div', 'console-box');
    work.appendChild(consoleBox);

    var actions = R.el('div', 'ex-actions');
    var runBtn = R.el('button', 'btn btn-primary btn-sm', '运行 · Ctrl+Enter');
    var clearBtn = R.el('button', 'btn btn-sm', '清空');
    var pill = R.el('span', 'status-pill idle', '就绪');
    actions.appendChild(runBtn);
    actions.appendChild(clearBtn);
    actions.appendChild(pill);
    work.appendChild(actions);

    var saved = '';
    try { saved = localStorage.getItem(KEY_PG) || ''; } catch (e) {}
    if (!saved) saved = 'const nums = [3, 1, 4, 1, 5, 9, 2, 6];\nconsole.log(nums.slice().sort((a, b) => a - b));\n\nconst seen = new Set(nums);\nconsole.log(seen.size, [...seen]);\n\ndocument.body.insertAdjacentHTML(\'beforeend\', \'<p>这段 HTML 是我在沙箱里加的</p>\');\n';

    var editor = R.makeEditor(editorBox, saved, {
      label: '练习场',
      onInput: function (v) { try { localStorage.setItem(KEY_PG, v); } catch (e) {} },
      onRun: function () { run(); }
    });

    function run() {
      runBtn.disabled = true;
      pill.className = 'status-pill idle';
      pill.textContent = '运行中';
      consoleBox.textContent = '';
      window.JSLAB_RUN({
        mount: mount,
        code: editor.value,
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
        } else {
          pill.className = 'status-pill pass';
          pill.textContent = '运行完成 · ' + res.durationMs + 'ms';
        }
      });
    }

    runBtn.addEventListener('click', run);
    clearBtn.addEventListener('click', function () {
      editor.value = '';
      try { localStorage.removeItem(KEY_PG); } catch (e) {}
      consoleBox.textContent = '';
      mount.innerHTML = '';
      pill.className = 'status-pill idle';
      pill.textContent = '已清空';
    });
    main.appendChild(c);
  }

  /* ---------- 路由 ---------- */
  function route() {
    var hash = (location.hash || '').replace(/^#/, '') || 'home';
    var main = document.getElementById('main');
    main.innerHTML = '';
    main.scrollTop = 0;

    if (hash === 'home') { renderHome(main); markActive('home'); window.scrollTo(0, 0); return; }

    if (hash === 'playground') { renderPlayground(main); markActive('playground'); window.scrollTo(0, 0); return; }

    var idx = -1;
    for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === hash) idx = i;
    if (idx === -1) { location.hash = 'home'; return; }
    renderChapterPage(main, CHAPTERS[idx], idx);
    markActive(hash);
    window.scrollTo(0, 0);
    refreshChrome();
  }

  /* ---------- 自测钩子（浏览器端全量校验，含 DOM 类练习） ---------- */
  window.JSLAB_SELFTEST = function (filter) {
    var mount = document.createElement('div');
    mount.style.cssText = 'position:fixed;left:-9999px;top:0;width:320px;height:200px;';
    document.body.appendChild(mount);

    var targets = ALL_EXERCISES.filter(function (e) {
      if (!filter) return true;
      if (filter.chapter && e.ch !== filter.chapter) return false;
      return true;
    });

    var report = { total: targets.length, solutionAllPass: 0, starterAllFail: 0, problems: [] };
    var i = 0;

    function next() {
      if (i >= targets.length) {
        document.body.removeChild(mount);
        report.ok = report.problems.length === 0;
        return Promise.resolve(report);
      }
      var item = targets[i++];
      var sec = item.sec;

      function attempt(code) {
        return window.JSLAB_RUN({ mount: mount, code: code, tests: sec.tests, timeoutMs: 15000, quietMs: 15, maxSettleMs: 600 })
          .then(function (res) {
            // 刚被失控帧挤过（进程重建）时可能超时，重试一次
            if (res.error && res.error.name === 'TimeoutError') {
              return window.JSLAB_RUN({ mount: mount, code: code, tests: sec.tests, timeoutMs: 15000, quietMs: 15, maxSettleMs: 600 });
            }
            return res;
          });
      }

      return attempt(sec.solution)
        .then(function (res) {
          var allPass = !res.error && res.tests && res.tests.length === sec.tests.length && res.tests.every(function (t) { return t.pass; });
          if (allPass) report.solutionAllPass++;
          else report.problems.push({
            id: sec.id, kind: 'solution 未全过',
            error: res.error ? (res.error.name + ': ' + res.error.message) : null,
            failedTests: (res.tests || []).filter(function (t) { return t.pass !== true; }).map(function (t) { return t.message || ('#' + t.i); })
          });

          return attempt(sec.starter);
        })
        .then(function (res) {
          var anyFail = !!res.error || (res.tests || []).some(function (t) { return t.pass === false; });
          if (anyFail) report.starterAllFail++;
          else report.problems.push({ id: sec.id, kind: 'starter 居然全过了（练习太松）' });
          return next();
        });
    }

    return next();
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
      // 普通静态服务器没有这个端点：连不上就作罢，别刷控制台
      es.onerror = function () { if (!opened) es.close(); };
      window.JSLAB_ALIVE = es;
    } catch (e) {}

    // 十几秒还没连上保活端点：多半是缓存里的旧页面（旧版 app.js 根本没有这条连接）
    setTimeout(function () {
      if (window.JSLAB_ALIVE && window.JSLAB_ALIVE.readyState === 1) return;
      fetch('/__whoami').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        if (t.indexOf('js-lab serve.py') !== 0) return;   // 不是本服务，别误报
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
      try { localStorage.setItem('jslab.v1.auto', ev.target.checked ? '1' : '0'); } catch (e) {}
    });
    try {
      var auto = localStorage.getItem('jslab.v1.auto');
      if (auto === '0') document.getElementById('auto-run').checked = false;
    } catch (e) {}

    document.getElementById('reset-progress').addEventListener('click', resetProgress);

    route();

    if (/(^|[?&])selftest/.test(location.search)) {
      console.log('JS 训练场自测开始（' + ALL_EXERCISES.length + ' 个练习）…');
      window.JSLAB_SELFTEST().then(function (r) {
        console.log('SELFTEST ' + JSON.stringify(r));
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
