/* render.js — 迷你 markdown + 章节 / 示例 / 练习的渲染。
 * 内容 schema 见 docs/01-content-schema.md；这里只负责把 schema 变成 DOM。 */
(function (root) {

  var esc = root.H5LAB_escape;
  var highlight = root.H5LAB_highlight;
  var RUN = root.H5LAB_RUN;
  var autopair = root.H5LAB_pairs;

  var PANE_LABEL = { html: 'HTML', css: 'CSS', js: 'JS' };

  /* ---------- 基础 ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- 迷你 markdown（子集见契约文档） ---------- */
  function inline(s) {
    s = esc(s);
    /* 行内代码先摘出来占位：反引号里常出现 `*`（乘号、选择器通配符），
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
    var lang = opts.lang || 'html';
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

    host.appendChild(hl);
    host.appendChild(ta);

    function paint() { codeEl.innerHTML = highlight(ta.value, lang) + '\n'; }
    function syncScroll() { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }

    function indentOf(line) { var m = /^[ \t]*/.exec(line); return m ? m[0] : ''; }

    ta.addEventListener('input', function () {
      paint();
      if (opts.onInput) opts.onInput(ta.value);
    });
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

      /* 括号与标签配对（判定逻辑在 pair.js，node 侧同一份代码有 66 项断言）：
         开括号补闭括号、光标前有闭括号就跳过、Backspace 成对删除、HTML 页签里 < > 与 </tag> */
      var st = { key: ev.key, value: v, start: start, end: end, html: lang === 'html', ctrlKey: ev.ctrlKey, metaKey: ev.metaKey, altKey: ev.altKey };
      var edit = ev.key === 'Backspace' ? autopair.decideBackspace(st) : autopair.decide(st);
      if (edit) {
        ev.preventDefault();
        if (edit.value !== v) {
          ta.value = edit.value;
          paint();
          if (opts.onInput) opts.onInput(ta.value);
        }
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
        paint();
        if (opts.onInput) opts.onInput(ta.value);
        return;
      }
      if (ev.key === 'Enter') {
        var lineStart = v.lastIndexOf('\n', start - 1) + 1;
        var line = v.slice(lineStart, start);
        var ind = indentOf(line);
        var nextChar = v.charAt(start);
        var trimmed = line.replace(/\s+$/, '');
        var opens = /[{([]$/.test(trimmed);
        var pairs = { '{': '}', '(': ')', '[': ']' };
        var closer = opens ? pairs[trimmed.charAt(trimmed.length - 1)] : null;

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
        paint();
        if (opts.onInput) opts.onInput(ta.value);
        return;
      }
    });

    paint();
    return {
      textarea: ta,
      get value() { return ta.value; },
      set value(v) { ta.value = v; paint(); },
      focus: function () { ta.focus(); }
    };
  }

  /** 练习/练习场用的多页签代码框：panes = ['html'] / ['html','css'] / … */
  function makeCodeBox(host, panes, values, opts) {
    opts = opts || {};
    var box = el('div', 'editor-box');
    var tabs = el('div', 'ed-tabs');
    var panesHost = el('div', 'ed-panes');
    var editors = {};
    var current = panes[0];

    function show(name) {
      current = name;
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle('active', b.__pane === name); });
      Array.prototype.forEach.call(panesHost.children, function (p) { p.classList.toggle('active', p.__pane === name); });
      if (opts.onPaneChange) opts.onPaneChange(name);
    }

    panes.forEach(function (name) {
      var b = el('button', 'ed-tab', PANE_LABEL[name] || String(name).toUpperCase());
      b.type = 'button';
      b.__pane = name;
      b.addEventListener('click', function () { show(name); editors[name].focus(); });
      tabs.appendChild(b);

      var pane = el('div', 'ed-pane');
      pane.__pane = name;
      panesHost.appendChild(pane);
      editors[name] = makeEditor(pane, values[name] || '', {
        lang: name,
        label: (opts.label || '代码') + ' · ' + (PANE_LABEL[name] || name),
        onInput: function (v) { if (opts.onInput) opts.onInput(name, v); },
        onRun: opts.onRun
      });
    });

    if (panes.length > 1) box.appendChild(tabs);
    box.appendChild(panesHost);
    host.appendChild(box);
    show(current);

    return {
      box: box,
      editors: editors,
      values: function () {
        var o = {};
        panes.forEach(function (n) { o[n] = editors[n].value; });
        return o;
      },
      setValues: function (vals) {
        panes.forEach(function (n) { if (vals[n] != null) editors[n].value = vals[n]; });
      },
      focus: function (n) { show(n || current); editors[n || current].focus(); }
    };
  }

  /* 练习用哪几个页签：starter 里写了哪几个键就有哪几个页签 */
  function panesOf(starter) {
    var panes = ['html'];
    if (starter && 'css' in starter) panes.push('css');
    if (starter && 'js' in starter) panes.push('js');
    return panes;
  }

  /* 参考解：只给变化的栏，其余继承起始代码 */
  function mergeSolution(starter, solution) {
    var out = { html: starter.html || '' };
    if ('css' in starter) out.css = starter.css || '';
    if ('js' in starter) out.js = starter.js || '';
    Object.keys(solution || {}).forEach(function (k) { if (solution[k] != null) out[k] = solution[k]; });
    return out;
  }

  /* ---------- 示例（当场渲染 + 自检） ---------- */
  function demoBlock(sec) {
    var wrap = el('div', 'case');
    var head = el('div', 'case-head');
    head.appendChild(el('span', 'case-caption', sec.caption || '示例'));

    var panes = ['html'];
    if (sec.css) panes.push('css');
    if (sec.js) panes.push('js');

    var pre = el('pre', 'case-code');
    var codeEl = el('code');
    pre.appendChild(codeEl);

    if (panes.length > 1) {
      var tabs = el('div', 'case-tabs');
      panes.forEach(function (name) {
        var b = el('button', 'ed-tab', PANE_LABEL[name]);
        b.type = 'button';
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(tabs.children, function (x) { x.classList.toggle('active', x === b); });
          paint(name);
        });
        tabs.appendChild(b);
      });
      head.appendChild(tabs);
    }
    function paint(name) { codeEl.innerHTML = highlight(sec[name] || '', name); }

    var frame = el('div', 'case-frame');
    var mount = el('div', 'preview-mount');
    frame.style.height = (sec.height || 170) + 'px';
    frame.appendChild(mount);

    var note = el('div', 'case-note');
    note.style.display = 'none';

    wrap.appendChild(head);
    wrap.appendChild(pre);
    wrap.appendChild(frame);
    wrap.appendChild(note);

    function render() {
      return RUN({ mount: mount, html: sec.html, css: sec.css, js: sec.js, full: !!sec.full, tests: sec.checks || [] })
        .then(function (res) {
          var bad = res.error || (res.tests || []).filter(function (t) { return t.pass === false; });
          var msgs = [];
          if (res.error) msgs.push(res.error.name + ': ' + res.error.message);
          if (res.jsError) msgs.push(res.jsError.message);
          Array.prototype.push.apply(msgs, (res.tests || []).filter(function (t) { return t.pass === false; })
            .map(function (t) { return t.message || t.label; }));
          if (msgs.length) {
            note.style.display = 'block';
            note.textContent = '这个示例没通过自检：' + msgs.join('；');
          } else {
            note.style.display = 'none';
            note.textContent = '';
          }
          return res;
        });
    }

    paint('html');
    wrap.__run = render;
    render();
    return wrap;
  }

  /* ---------- 练习卡 ---------- */
  function exerciseCard(sec, ctx) {
    var panes = panesOf(sec.starter);
    var KEY = 'h5lab.v1.code.' + sec.id + '.';
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
    var editorBox = el('div', 'editor-cell');
    var previewBox = el('div', 'preview-box');
    var mount = el('div', 'preview-mount');
    previewBox.style.height = (sec.height || 280) + 'px';
    editorBox.style.height = (sec.height || 280) + 'px';   // 编辑器与预览必须同高，视觉上是一对
    previewBox.setAttribute('data-empty', '渲染中…');
    previewBox.appendChild(mount);
    grid.appendChild(task);
    grid.appendChild(editorBox);
    grid.appendChild(previewBox);
    card.appendChild(grid);

    var hasJs = panes.indexOf('js') >= 0;
    var consoleBox = null;
    if (hasJs) {
      consoleBox = el('div', 'console-box');
      card.appendChild(consoleBox);
    }

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
    var shownHints = 0;
    var running = false;
    var timerId = null;
    var firstPaint = true;

    function setPill(kind, text) { pill.className = 'status-pill ' + kind; pill.textContent = text; }
    function paintDot() { dot.className = 'ex-dot' + (passed ? ' pass' : ''); }
    paintDot();
    if (passed) setPill('pass', '已通过');

    var saved = {};
    var anySaved = false;
    panes.forEach(function (n) {
      var v = null;
      try { v = localStorage.getItem(KEY + n); } catch (e) {}
      if (v != null && v !== sec.starter[n]) { anySaved = true; }
      saved[n] = (v != null) ? v : (sec.starter[n] || '');
    });

    var box = makeCodeBox(editorBox, panes, saved, {
      label: sec.title,
      onInput: function (name, v) {
        try { localStorage.setItem(KEY + name, v); } catch (e) {}
        if (ctx.autoRun()) {
          clearTimeout(timerId);
          timerId = setTimeout(function () { run(true); }, 900);
        }
      },
      onRun: function () { run(false); }
    });

    function clearConsole() { if (consoleBox) consoleBox.textContent = ''; }
    function addConsole(d) {
      if (!consoleBox) return;
      consoleBox.appendChild(el('div', 'console-line' + (d.level === 'error' ? ' err' : d.level === 'warn' ? ' warn' : ''), d.text));
      consoleBox.scrollTop = consoleBox.scrollHeight;
    }
    function resetRows() {
      rows.forEach(function (r) { r.mark.className = 'test-mark wait'; r.mark.textContent = '·'; r.msg.textContent = ''; });
    }

    function run(silent) {
      if (running) return Promise.resolve();
      running = true;
      runBtn.disabled = true;
      if (!silent) setPill('idle', '渲染中');
      clearConsole();
      resetRows();

      var vals = box.values();
      return RUN({
        mount: mount,
        html: vals.html,
        css: vals.css,
        js: vals.js,
        full: !!sec.full,
        tests: sec.tests,
        onConsole: addConsole,
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
        if (res.error) addConsole({ level: 'error', text: res.error.name + ': ' + res.error.message });
        if (res.jsError) addConsole({ level: 'error', text: res.jsError.message });

        var allPass = !res.error && !res.jsError && res.tests && res.tests.every(function (t) { return t.pass; });
        if (allPass) {
          passed = true;
          ctx.progress.setPassed(sec.id, true);
          paintDot();
          setPill('pass', '全部通过 · ' + res.durationMs + 'ms');
        } else {
          if (passed) { passed = false; ctx.progress.setPassed(sec.id, false); paintDot(); }
          var failCount = res.tests ? res.tests.filter(function (t) { return t.pass === false; }).length : 0;
          setPill('fail', res.error ? '出错了' : failCount + ' 条未通过');
        }
        if (ctx.onResult) ctx.onResult();
        return res;
      });
    }

    /* 打开就先把起始效果渲染出来（不判题），省掉「点了才知道长什么样」 */
    function firstRender() {
      if (!firstPaint) return;
      firstPaint = false;
      var vals = box.values();
      RUN({ mount: mount, html: vals.html, css: vals.css, js: vals.js, full: !!sec.full, tests: [] }).then(function (res) {
        if (res.error) addConsole({ level: 'error', text: res.error.name + ': ' + res.error.message });
        if (res.jsError) addConsole({ level: 'error', text: res.jsError.message });
      });
    }

    runBtn.addEventListener('click', function () { run(false); });
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
      var full = mergeSolution(sec.starter, sec.solution);
      box.setValues(full);
      panes.forEach(function (n) { try { localStorage.setItem(KEY + n, full[n]); } catch (e) {} });
      run(false);
    }
    resetBtn.addEventListener('click', function () {
      box.setValues(sec.starter);
      panes.forEach(function (n) { try { localStorage.removeItem(KEY + n); } catch (e) {} });
      passed = false;
      ctx.progress.setPassed(sec.id, false);
      paintDot();
      setPill('idle', '已重置');
      clearConsole();
      resetRows();
      firstRender();
      if (ctx.onResult) ctx.onResult();
    });

    card.__run = firstRender;
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

  /* ---------- 章节 ----------
   * 段落按列宽分组装进容器：讲解/注释/示例/表格进 .read（窄列居中），练习进 .work（宽列）。
   * 靠容器负责居中，元素自身的 margin 简写就再也打不乱对齐。
   */
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

    var pendingRender = [];

    chapter.sections.forEach(function (sec) {
      if (sec.kind === 'exercise') {
        var card = exerciseCard(sec, ctx);
        hostFor('work').appendChild(card);
        pendingRender.push(card);
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
        readHost.appendChild(t);
      } else if (sec.kind === 'demo') {
        readHost.appendChild(demoBlock(sec));
      }
    });

    return pendingRender;
  }

  root.H5LAB_render = {
    el: el,
    md: md,
    renderChapter: renderChapter,
    makeEditor: makeEditor,
    makeCodeBox: makeCodeBox,
    panesOf: panesOf,
    mergeSolution: mergeSolution,
    confirmBox: confirmBox,
    exerciseCard: exerciseCard,
    demoBlock: demoBlock
  };
})(window);
