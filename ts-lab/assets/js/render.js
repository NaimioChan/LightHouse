/* render.js — 迷你 markdown + 章节 / 示例 / 练习的渲染。内容契约见 docs/01-content-schema.md。
 *
 * 与 html5-lab 最大的不同：这里没有「预览窗」。练习卡右边那块是**结果面板**
 * （诊断 / 编译产物 / 运行输出），因为 TypeScript 教的是编译期的事，不是渲染出来的样子。
 */
(function (root) {

  var esc = root.TSLAB_escape;
  var highlight = root.TSLAB_highlight;
  var autopair = root.TSLAB_pairs;
  var JUDGE = root.TSLAB_JUDGE;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* 要不要顺手把编译产物跑一遍（用于显示运行输出）：
     作者明确要（run: true）或断言里 await run() 就一定跑；带模块语法的代码不跑——
     编译产物是 ESM，当普通脚本执行会直接报「不能用模块语法」，那只会在页面上制造假红条。 */
  function wantsRun(code, tests, explicit) {
    if (explicit) return true;
    if (/(^|[^\w.])run\s*\(/.test((tests || []).join('\n'))) return true;
    return !/^\s*(import|export)\s/m.test(String(code || ''));
  }
  function isModuleCode(code) { return /^\s*(import|export)\s/m.test(String(code || '')); }

  /* ---------- 迷你 markdown（子集见契约文档） ---------- */
  function inline(s) {
    s = esc(s);
    /* 行内代码先摘出来占位：反引号里常出现 `*`（通配、乘号），
       直接跑强调规则会把代码里的星号当斜体标记吃掉（js-lab 的 `+ - * / %` 与 `**` 那段踩过这个坑） */
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s（(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return '<code>' + codes[+i] + '</code>'; });
  }

  function md(text) {
    var lines = String(text).split('\n');
    var out = [], para = [], list = null;

    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('</' + list + '>'); list = null; } }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/\s+$/, '');
      if (!line.trim()) { flushPara(); flushList(); continue; }

      var h = /^(#{2,3})\s+(.*)$/.exec(line);
      if (h) {
        flushPara(); flushList();
        var t = h[1].length === 2 ? 'h2' : 'h3';
        out.push('<' + t + '>' + inline(h[2]) + '</' + t + '>');
        continue;
      }

      var ul = /^[-*]\s+(.*)$/.exec(line);
      if (ul) { flushPara(); if (list !== 'ul') { flushList(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inline(ul[1]) + '</li>'); continue; }

      var ol = /^\d+\.\s+(.*)$/.exec(line);
      if (ol) { flushPara(); if (list !== 'ol') { flushList(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inline(ol[1]) + '</li>'); continue; }

      flushList();
      para.push(line.trim());
    }
    flushPara(); flushList();
    return out.join('');
  }

  /* ---------- 编辑器：透明 textarea + 高亮叠层 ---------- */
  function makeEditor(host, code, opts) {
    opts = opts || {};
    var box = el('div', 'editor-box');
    var panes = el('div', 'ed-panes');
    var pane = el('div', 'ed-pane');
    var hl = el('pre', 'editor-hl');
    var codeEl = el('code');
    hl.appendChild(codeEl);

    var ta = document.createElement('textarea');
    ta.className = 'editor-ta';
    ta.spellcheck = false;
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('aria-label', opts.label || '代码编辑器');
    ta.value = code;

    pane.appendChild(hl);
    pane.appendChild(ta);
    panes.appendChild(pane);
    box.appendChild(panes);
    host.appendChild(box);

    function paint() { codeEl.innerHTML = highlight(ta.value) + '\n'; }
    function syncScroll() { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }

    function indentOf(line) { var m = /^[ \t]*/.exec(line); return m ? m[0] : ''; }
    function changed() { paint(); if (opts.onInput) opts.onInput(ta.value); }

    ta.addEventListener('input', changed);
    ta.addEventListener('scroll', syncScroll);
    ta.addEventListener('keydown', function (ev) {
      var start = ta.selectionStart, end = ta.selectionEnd, v = ta.value;

      /* 输入法组合期间一律放行：这时 Enter 是选字键，抢过来会把中文输入搅坏 */
      if (ev.isComposing || ev.keyCode === 229) return;

      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        if (opts.onRun) opts.onRun();
        return;
      }

      /* 括号配对（判定在 pair.js，node 侧同一份代码有断言）。TS 里 `<` 是泛型尖括号，不能补 */
      var st = { key: ev.key, value: v, start: start, end: end, html: false, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey, altKey: ev.altKey };
      var edit = ev.key === 'Backspace' ? autopair.decideBackspace(st) : autopair.decide(st);
      if (edit) {
        ev.preventDefault();
        if (edit.value !== v) { ta.value = edit.value; changed(); }
        ta.selectionStart = edit.start;
        ta.selectionEnd = edit.end;
        return;
      }

      if (ev.key === 'Tab') {
        ev.preventDefault();
        if (start !== end || ev.shiftKey) {
          var from = v.lastIndexOf('\n', start - 1) + 1;
          var to = v.indexOf('\n', end); if (to === -1) to = v.length;
          var lines = v.slice(from, to).split('\n').map(function (l) {
            return ev.shiftKey ? l.replace(/^ {1,2}/, '') : '  ' + l;
          });
          var replacement = lines.join('\n');
          ta.value = v.slice(0, from) + replacement + v.slice(to);
          ta.selectionStart = from;
          ta.selectionEnd = from + replacement.length;
        } else {
          ta.value = v.slice(0, start) + '  ' + v.slice(end);
          ta.selectionStart = ta.selectionEnd = start + 2;
        }
        changed();
        return;
      }
      if (ev.key === 'Enter') {
        var lineStart = v.lastIndexOf('\n', start - 1) + 1;
        var line = v.slice(lineStart, start);
        var ind = indentOf(line);
        var nextChar = v.charAt(start);
        var trimmed = line.replace(/\s+$/, '');
        var opens = /[{([]$/.test(trimmed);
        var closers = { '{': '}', '(': ')', '[': ']' };
        var closer = opens ? closers[trimmed.charAt(trimmed.length - 1)] : null;

        ev.preventDefault();
        if (opens && closer && nextChar === closer) {
          var insert = '\n' + ind + '  \n' + ind;
          ta.value = v.slice(0, start) + insert + v.slice(end);
          ta.selectionStart = ta.selectionEnd = start + 1 + ind.length + 2;
        } else {
          var add = '\n' + ind + (opens ? '  ' : '');
          ta.value = v.slice(0, start) + add + v.slice(end);
          ta.selectionStart = ta.selectionEnd = start + add.length;
        }
        changed();
        return;
      }
    });

    paint();
    return {
      box: box,
      textarea: ta,
      get value() { return ta.value; },
      set value(v) { ta.value = v; paint(); },
      focus: function () { ta.focus(); },
      repaint: paint
    };
  }

  /* ---------- 结果面板：诊断 / 编译产物 / 运行输出 ---------- */
  function makePanel(opts) {
    opts = opts || {};
    var wrap = el('div', 'panel-box');
    var tabsRow = el('div', 'panel-tabs');
    var body = el('div', 'panel-body');
    var panes = {}, tabs = {};
    var current = 'diag';

    [['diag', '诊断'], ['js', '编译产物'], ['out', '运行输出']].forEach(function (pair) {
      var key = pair[0];
      var tab = el('button', 'panel-tab', pair[1]);
      tab.type = 'button';
      var badge = el('span', 'tab-badge');
      tab.appendChild(badge);
      tab.addEventListener('click', function () { show(key); });
      tabsRow.appendChild(tab);
      tabs[key] = { tab: tab, badge: badge };

      var pane = el('div', 'panel-pane');
      pane.setAttribute('hidden', 'hidden');
      body.appendChild(pane);
      panes[key] = pane;
    });

    wrap.appendChild(tabsRow);
    wrap.appendChild(body);

    function show(key) {
      current = key;
      Object.keys(panes).forEach(function (k) {
        if (k === key) panes[k].removeAttribute('hidden');
        else panes[k].setAttribute('hidden', 'hidden');
        tabs[k].tab.classList.toggle('active', k === key);
      });
    }
    show(current);

    function setDiags(diags) {
      var p = panes.diag;
      p.textContent = '';
      p.classList.toggle('empty', !diags.length);
      p.setAttribute('data-empty', '没有类型错误。');
      diags.forEach(function (d) {
        var line = el('span', 'diag-line');
        line.appendChild(el('span', 'diag-code', 'TS' + d.code));
        line.appendChild(el('span', 'diag-line-no', d.line ? '　第 ' + d.line + ' 行' : '　'));
        line.appendChild(document.createTextNode('　' + d.msg));
        p.appendChild(line);
      });
      tabs.diag.badge.textContent = diags.length ? String(diags.length) : '✓';
      tabs.diag.tab.className = 'panel-tab' + (diags.length ? ' bad' : ' ok');
      if (diags.length) show('diag');
    }

    function setJs(js) {
      panes.js.textContent = js || '（没有产物）';
      panes.js.classList.remove('empty');
    }

    function setLogs(logs, runError, ran) {
      var p = panes.out;
      p.textContent = '';
      p.classList.remove('empty');
      if (runError) {
        p.appendChild(el('span', 'log-line err', runError.name + ': ' + runError.message));
      }
      (logs || []).forEach(function (t) {
        p.appendChild(el('span', 'log-line', t));
      });
      if (!logs || !logs.length) {
        if (!runError) {
          p.classList.add('empty');
          p.setAttribute('data-empty', ran === false ? '这段代码没有运行（只看类型）。' : (opts.outEmpty || '这段代码没有输出。'));
        }
      }
    }

    function setBusy(text) {
      var p = panes[current];
      p.textContent = text;
      p.classList.remove('empty');
    }

    function fail(msg) {
      panes.diag.textContent = '';
      panes.diag.classList.remove('empty');
      panes.diag.appendChild(el('span', 'log-line err', msg));
      tabs.diag.badge.textContent = '!';
      tabs.diag.tab.className = 'panel-tab bad';
      show('diag');
    }

    return { el: wrap, setDiags: setDiags, setJs: setJs, setLogs: setLogs, setBusy: setBusy, fail: fail, show: show };
  }

  /* ---------- 示例（讲解区的代码块：当场判题 + 可选运行） ---------- */
  function demoBlock(sec, ctx) {
    var wrap = el('div', 'case');
    var head = el('div', 'case-head');
    head.appendChild(el('span', 'case-caption', sec.caption || '示例'));

    var jsBtn = el('button', 'btn btn-sm', '看编译产物');
    head.appendChild(jsBtn);

    var pre = el('pre', 'case-code');
    var codeEl = el('code');
    pre.appendChild(codeEl);
    codeEl.innerHTML = highlight(sec.code);

    var jsPre = el('pre', 'case-js');
    jsPre.setAttribute('hidden', 'hidden');

    var foot = el('div', 'case-foot');
    var note = el('div', 'case-note');
    note.style.display = 'none';

    wrap.appendChild(head);
    wrap.appendChild(pre);
    wrap.appendChild(jsPre);
    wrap.appendChild(foot);
    wrap.appendChild(note);

    jsBtn.addEventListener('click', function () {
      var hidden = jsPre.hasAttribute('hidden');
      if (hidden) jsPre.removeAttribute('hidden'); else jsPre.setAttribute('hidden', 'hidden');
      jsBtn.textContent = hidden ? '收起编译产物' : '看编译产物';
    });

    function render() {
      foot.textContent = '';
      foot.appendChild(el('span', null, '检查中…'));
      return JUDGE.runCase(sec.code, {
        tests: sec.checks || [],
        tsconfig: sec.tsconfig,
        exec: ctx && ctx.exec,
        alwaysRun: wantsRun(sec.code, sec.checks, sec.run)
      }).then(function (res) {
        foot.textContent = '';
        jsPre.textContent = res.js || '';

        var bad = res.error ? [res.error.message]
          : res.results.filter(function (t) { return t.pass === false; }).map(function (t) { return t.message || t.label; });
        if (res.runError) bad.push(res.runError.name + ': ' + res.runError.message);

        (res.logs || []).forEach(function (t) {
          foot.appendChild(el('span', 'case-out', t));
        });
        if (!res.logs || !res.logs.length) {
          foot.appendChild(el('span', null, res.ran ? '运行这段代码没有输出。' : (isModuleCode(sec.code) ? '这段代码带模块语法，只看类型，不运行。' : '这个示例只看类型，不运行。')));
        }

        if (bad.length) {
          note.style.display = 'block';
          note.textContent = '这个示例没通过自检：' + bad.join('；');
        } else {
          note.style.display = 'none';
          note.textContent = '';
        }
        return res;
      }, function (e) {
        note.style.display = 'block';
        note.textContent = '这个示例没通过自检：' + (e && e.message);
      });
    }

    wrap.__run = render;
    return wrap;
  }

  /* ---------- 练习卡 ---------- */
  function exerciseCard(sec, ctx) {
    var KEY = 'tslab.v1.code.' + sec.id;
    var card = el('div', 'ex-card');
    card.id = sec.id;

    var head = el('div', 'ex-head');
    head.appendChild(el('span', 'ex-id', sec.id));
    head.appendChild(el('span', 'ex-title', sec.title));
    var dot = el('span', 'ex-dot');
    head.appendChild(dot);
    card.appendChild(head);

    var grid = el('div', 'ex-grid');
    var task = el('div', 'md ex-task');
    task.innerHTML = md(sec.task);
    var editorCell = el('div', 'editor-cell');
    var panelCell = el('div', 'editor-cell');
    grid.appendChild(task);
    grid.appendChild(editorCell);
    grid.appendChild(panelCell);
    card.appendChild(grid);

    var panel = makePanel({ outEmpty: '这段代码没有输出。' });
    panelCell.appendChild(panel.el);

    var testsBox = el('div', 'tests');
    testsBox.appendChild(el('div', 'tests-head', '检验（' + sec.tests.length + ' 条）'));
    var rows = [];
    sec.tests.forEach(function (t, i) {
      var row = el('div', 'test-row');
      var mark = el('span', 'test-mark wait', '·');
      var body = el('div', 'test-body');
      body.appendChild(el('div', 'test-label', String(t).replace(/\s+/g, ' ').trim().slice(0, 160)));
      var msg = el('div', 'test-msg', '');
      body.appendChild(msg);
      row.appendChild(mark);
      row.appendChild(body);
      testsBox.appendChild(row);
      rows.push({ mark: mark, msg: msg });
    });
    card.appendChild(testsBox);

    var actions = el('div', 'ex-actions');
    var runBtn = el('button', 'btn btn-primary btn-sm', '运行 · 检验');
    var hintBtn = el('button', 'btn btn-sm', '提示');
    var solBtn = el('button', 'btn btn-sm', '看答案');
    var resetBtn = el('button', 'btn btn-sm', '重置');
    var pill = el('span', 'status-pill idle', '未检验');
    actions.appendChild(runBtn);
    actions.appendChild(hintBtn);
    actions.appendChild(solBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(pill);
    card.appendChild(actions);

    var hintsBox = el('ul', 'hint-list');
    hintsBox.style.display = 'none';
    card.appendChild(hintsBox);

    var passed = ctx.progress.isPassed(sec.id);
    var shownHints = 0, running = false, timerId = null, queued = false;

    function setPill(kind, text) { pill.className = 'status-pill ' + kind; pill.textContent = text; }
    function paintDot() { dot.className = 'ex-dot' + (passed ? ' pass' : ''); }
    paintDot();
    if (passed) setPill('pass', '已通过');

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var editor = makeEditor(editorCell, saved != null ? saved : sec.starter, {
      label: sec.title,
      onInput: function (v) {
        try { localStorage.setItem(KEY, v); } catch (e) {}
        if (ctx.autoRun()) {
          clearTimeout(timerId);
          timerId = setTimeout(function () { judge(true); }, 900);
        }
      },
      onRun: function () { judge(false); }
    });

    function resetRows() {
      rows.forEach(function (r) { r.mark.className = 'test-mark wait'; r.mark.textContent = '·'; r.msg.textContent = ''; });
    }

    function judge(silent) {
      if (running) { queued = true; return Promise.resolve(); }
      running = true;
      runBtn.disabled = true;
      if (!silent) setPill('idle', '检验中');
      resetRows();
      panel.setBusy('判题中…');

      return JUDGE.runCase(editor.value, {
        tests: sec.tests,
        tsconfig: sec.tsconfig,
        exec: ctx.exec,
        alwaysRun: wantsRun(editor.value, sec.tests, false),
        onTest: function (d) {
          var r = rows[d.i];
          if (!r) return;
          r.mark.className = 'test-mark ' + (d.pass ? 'ok' : 'bad');
          r.mark.textContent = d.pass ? '✓' : '✗';
          r.msg.textContent = d.pass ? '' : d.message;
        }
      }).then(function (res) {
        running = false;
        runBtn.disabled = false;
        if (res.error) {
          panel.fail(res.error.message);
          setPill('fail', '出错了');
        } else {
          panel.setDiags(res.diags);
          panel.setJs(res.js);
          panel.setLogs(res.logs, res.runError, res.ran);
          if (res.ok) {
            passed = true;
            ctx.progress.setPassed(sec.id, true);
            paintDot();
            setPill('pass', '全部通过 · ' + res.durationMs + 'ms');
          } else {
            if (passed) { passed = false; ctx.progress.setPassed(sec.id, false); paintDot(); }
            setPill('fail', res.failed + ' 条未通过');
          }
        }
        if (ctx.onResult) ctx.onResult();
        if (queued) { queued = false; return judge(true); }
      });
    }

    runBtn.addEventListener('click', function () { judge(false); });
    hintBtn.addEventListener('click', function () {
      hintsBox.style.display = 'block';
      if (shownHints >= sec.hints.length) return;
      hintsBox.appendChild(el('li', null, sec.hints[shownHints]));
      shownHints++;
      if (shownHints >= sec.hints.length) { hintBtn.disabled = true; hintBtn.textContent = '提示已给完'; }
    });
    solBtn.addEventListener('click', function () {
      if (passed) { revealSolution(); return; }
      confirmBox('看参考答案？', '参考答案只是其中一种写法。先自己跑一遍检验，看看到底哪条不满足。', '看答案', revealSolution);
    });
    function revealSolution() {
      editor.value = sec.solution;
      try { localStorage.setItem(KEY, sec.solution); } catch (e) {}
      judge(false);
    }
    resetBtn.addEventListener('click', function () {
      editor.value = sec.starter;
      try { localStorage.removeItem(KEY); } catch (e) {}
      passed = false;
      ctx.progress.setPassed(sec.id, false);
      paintDot();
      setPill('idle', '已重置');
      resetRows();
      judge(true);
      if (ctx.onResult) ctx.onResult();
    });

    card.__judge = judge;
    card.__exercise = sec;
    return card;
  }

  /* ---------- 确认框 ---------- */
  function confirmBox(title, text, okText, onOk) {
    var back = el('div', 'modal-backdrop');
    var box = el('div', 'modal');
    box.appendChild(el('h3', null, title));
    box.appendChild(el('p', null, text));
    var acts = el('div', 'modal-actions');
    var cancel = el('button', 'btn btn-sm', '再想想');
    var okBtn = el('button', 'btn btn-primary btn-sm', okText || '确定');
    acts.appendChild(cancel);
    acts.appendChild(okBtn);
    box.appendChild(acts);
    back.appendChild(box);
    document.body.appendChild(back);

    function close() { document.body.removeChild(back); document.removeEventListener('keydown', onKey); }
    function onKey(ev) { if (ev.key === 'Escape') close(); }
    cancel.addEventListener('click', close);
    back.addEventListener('click', function (ev) { if (ev.target === back) close(); });
    okBtn.addEventListener('click', function () { close(); onOk(); });
    document.addEventListener('keydown', onKey);
    okBtn.focus();
  }

  /* ---------- 章节：段落按列宽分组装进容器 ---------- */
  function renderChapter(chapter, container, ctx) {
    var kind = 'read';
    var host = el('div', 'read');
    container.appendChild(host);

    function hostFor(want) {
      if (want !== kind) {
        kind = want;
        host = el('div', want);
        container.appendChild(host);
      }
      return host;
    }

    host.appendChild(el('h1', null, chapter.title));
    host.appendChild(el('p', 'goal', chapter.goal));

    var pending = [];

    chapter.sections.forEach(function (sec) {
      if (sec.kind === 'exercise') {
        var card = exerciseCard(sec, ctx);
        hostFor('work').appendChild(card);
        pending.push(card);
        return;
      }
      var readHost = hostFor('read');

      if (sec.kind === 'prose') {
        var d = el('div', 'md');
        d.innerHTML = md(sec.md);
        readHost.appendChild(d);
      } else if (sec.kind === 'note') {
        var n = el('div', 'note' + (sec.tone === 'tip' ? ' tip' : ''));
        n.innerHTML = md(sec.md);
        readHost.appendChild(n);
      } else if (sec.kind === 'table') {
        var t = el('table', 'tbl' + (sec.code ? ' mono' : ''));
        var thead = el('thead'), tr = el('tr');
        (sec.head || []).forEach(function (h) { tr.appendChild(el('th', null, h)); });
        thead.appendChild(tr);
        t.appendChild(thead);
        var tb = el('tbody');
        (sec.rows || []).forEach(function (row) {
          var r = el('tr');
          row.forEach(function (c) { var td = el('td'); td.innerHTML = inline(String(c)); r.appendChild(td); });
          tb.appendChild(r);
        });
        t.appendChild(tb);
        /* 表格包一层横向滚动容器：窄屏下宽表自己滚，而不是把整页撑宽 */
        var tw = el('div', 'tbl-wrap');
        tw.appendChild(t);
        readHost.appendChild(tw);
      } else if (sec.kind === 'demo') {
        var demo = demoBlock(sec, ctx);
        readHost.appendChild(demo);
        pending.push(demo);
      }
    });

    return pending;
  }

  root.TSLAB_render = {
    el: el,
    md: md,
    inline: inline,
    renderChapter: renderChapter,
    makeEditor: makeEditor,
    makePanel: makePanel,
    confirmBox: confirmBox,
    exerciseCard: exerciseCard,
    demoBlock: demoBlock,
    wantsRun: wantsRun,
    isModuleCode: isModuleCode
  };
})(window);
