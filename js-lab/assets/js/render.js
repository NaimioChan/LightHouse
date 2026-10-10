/* render.js — 迷你 markdown + 章节/示例/练习的渲染。
 * 内容 schema 见 docs/01-content-schema.md；这里只负责把 schema 变成 DOM。 */
(function (root) {

  var esc = root.JSLAB_escape;
  var highlight = root.JSLAB_highlight;
  var RUN = root.JSLAB_RUN;
  var autopair = root.JSLAB_pairs;

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
    /* 行内代码先摘出来占位：反引号里常出现 `*`（乘号、取余、选择器通配符），
       直接跑强调规则会把代码里的星号当斜体标记吃掉——`+ - * / %` 与 `**` 那段踩过这个坑 */
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
      if (h) { flushPara(); flushList(); out.push('<' + (h[1].length === 2 ? 'h2' : 'h3') + '>' + inline(h[2]) + '</' + (h[1].length === 2 ? 'h2' : 'h3') + '>'); continue; }

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

  /* ---------- 编辑器：textarea + 高亮叠层 ---------- */
  function makeEditor(host, code, opts) {
    opts = opts || {};
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

    function paint() { codeEl.innerHTML = highlight(ta.value) + '\n'; }
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

      /* 括号与引号配对（判定逻辑在 pair.js，node 侧同一份代码有 60 项断言）：
         开括号补闭括号、光标前有闭括号就跳过、Backspace 成对删除；引号补另一半、单引号紧跟词字符时不补 */
      var st = { key: ev.key, value: v, start: start, end: end, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey, altKey: ev.altKey };
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
          // 缩进/反缩进选中的整行
          var from = v.lastIndexOf('\n', start - 1) + 1;
          var to = v.indexOf('\n', end); if (to === -1) to = v.length;
          var block = v.slice(from, to);
          var lines = block.split('\n').map(function (l) {
            if (ev.shiftKey) return l.replace(/^ {1,2}/, '');
            return '  ' + l;
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

  /* ---------- 可运行示例 ---------- */
  function exampleBlock(sec) {
    var wrap = el('div', 'example');
    var head = el('div', 'example-head');
    head.appendChild(el('span', 'ex-caption', sec.caption || '示例'));
    var runBtn = el('button', 'btn btn-sm', '运行');
    head.appendChild(runBtn);

    var pre = el('pre');
    var codeEl = el('code');
    codeEl.innerHTML = highlight(sec.code);
    pre.appendChild(codeEl);

    var out = el('div', 'example-out');
    out.style.display = 'none';

    var mount = el('div');
    mount.style.display = 'none';

    wrap.appendChild(head);
    wrap.appendChild(pre);
    wrap.appendChild(out);
    wrap.appendChild(mount);

    var running = false;
    runBtn.addEventListener('click', function () {
      if (running) return;
      running = true;
      runBtn.disabled = true;
      runBtn.textContent = '运行中';
      out.style.display = 'block';
      out.innerHTML = '<span class="lbl">输出</span>';

      RUN({
        mount: mount,
        code: sec.code,
        tests: [],
        onConsole: function (d) { out.textContent += (out.textContent ? '\n' : '') + d.text; }
      }).then(function (res) {
        running = false;
        runBtn.disabled = false;
        runBtn.textContent = '运行';
        if (!out.textContent || out.textContent === '') out.textContent = '（没有输出）';
        if (res.error) {
          var e = el('div', 'err', res.error.name + ': ' + res.error.message);
          out.appendChild(e);
        }
      });
    });

    return wrap;
  }

  /* ---------- 练习卡 ---------- */
  function exerciseCard(sec, ctx) {
    var KEY_CODE = 'jslab.v1.code.' + sec.id;
    var card = el('div', 'ex-card');
    card.id = sec.id;

    /* 头部 */
    var head = el('div', 'ex-head');
    head.appendChild(el('span', 'ex-id', sec.id));
    head.appendChild(el('span', 'ex-title', sec.title));
    var dot = el('span', 'ex-dot');
    head.appendChild(dot);
    card.appendChild(head);

    /* 说明 / 编辑器 / 预览：窄屏竖排，宽屏三栏（说明贴左边空出来的地方） */
    var grid = el('div', 'ex-grid');
    var task = el('div', 'md ex-task');
    task.innerHTML = md(sec.task);
    var editorBox = el('div', 'editor-box');
    var previewBox = el('div', 'preview-box');
    var mount = el('div', 'preview-mount');
    previewBox.appendChild(el('div', 'preview-empty', '运行后这里显示真实结果'));
    previewBox.appendChild(mount);
    grid.appendChild(task);
    grid.appendChild(editorBox);
    grid.appendChild(previewBox);
    card.appendChild(grid);

    var consoleBox = el('div', 'console-box');
    card.appendChild(consoleBox);

    /* 断言清单 */
    var testsBox = el('div', 'tests');
    var testsHead = el('div', 'tests-head', '检验（' + sec.tests.length + ' 条）');
    testsBox.appendChild(testsHead);
    var rows = [];
    sec.tests.forEach(function (t, i) {
      var row = el('div', 'test-row');
      var mark = el('span', 'test-mark wait', '·');
      var body = el('div', 'test-body');
      var label = el('div', 'test-label', String(t).replace(/\s+/g, ' ').trim().slice(0, 120));
      var msg = el('div', 'test-msg', '');
      body.appendChild(label);
      body.appendChild(msg);
      row.appendChild(mark);
      row.appendChild(body);
      testsBox.appendChild(row);
      rows.push({ mark: mark, msg: msg });
    });
    card.appendChild(testsBox);

    /* 操作栏 */
    var actions = el('div', 'ex-actions');
    var runBtn = el('button', 'btn btn-primary btn-sm', '运行 · 检验');
    var hintBtn = el('button', 'btn btn-sm', '提示');
    var solBtn = el('button', 'btn btn-sm', '看答案');
    var resetBtn = el('button', 'btn btn-sm', '重置');
    var pill = el('span', 'status-pill idle', '未运行');
    actions.appendChild(runBtn);
    actions.appendChild(hintBtn);
    actions.appendChild(solBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(pill);
    card.appendChild(actions);

    var hintsBox = el('ul', 'hint-list');
    hintsBox.style.display = 'none';
    card.appendChild(hintsBox);

    /* 状态 */
    var passed = ctx.progress.isPassed(sec.id);
    var shownHints = 0;
    var running = false;
    var dirty = false;
    var timerId = null;

    function setPill(kind, text) {
      pill.className = 'status-pill ' + kind;
      pill.textContent = text;
    }
    function paintDot() {
      dot.className = 'ex-dot' + (passed ? ' pass' : '');
    }
    paintDot();
    if (passed) setPill('pass', '已通过');

    /* 编辑器 */
    var saved = null;
    try { saved = localStorage.getItem(KEY_CODE); } catch (e) {}
    var editor = makeEditor(editorBox, saved != null ? saved : sec.starter, {
      label: sec.title,
      onInput: function (v) {
        try { localStorage.setItem(KEY_CODE, v); } catch (e) {}
        dirty = true;
        if (ctx.autoRun()) {
          clearTimeout(timerId);
          timerId = setTimeout(function () { run(true); }, 900);
        }
      },
      onRun: function () { run(false); }
    });

    function clearConsole() { consoleBox.textContent = ''; }
    function resetRows() {
      rows.forEach(function (r) {
        r.mark.className = 'test-mark wait';
        r.mark.textContent = '·';
        r.msg.textContent = '';
      });
    }
    function addConsole(d) {
      var line = el('div', 'console-line' + (d.level === 'error' ? ' err' : d.level === 'warn' ? ' warn' : ''), d.text);
      consoleBox.appendChild(line);
      consoleBox.scrollTop = consoleBox.scrollHeight;
    }

    function run(silent) {
      if (running) return Promise.resolve();
      running = true;
      runBtn.disabled = true;
      if (!silent) setPill('idle', '运行中');
      clearConsole();
      resetRows();

      return RUN({
        mount: mount,
        code: editor.value,
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
        dirty = false;

        if (res.error) {
          addConsole({ level: 'error', text: res.error.name + ': ' + res.error.message });
        }
        var allPass = !res.error && res.tests && res.tests.every(function (t) { return t.pass; });
        var anyFail = res.error || (res.tests && res.tests.some(function (t) { return t.pass === false; }));

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

    runBtn.addEventListener('click', function () { run(false); });

    hintBtn.addEventListener('click', function () {
      hintsBox.style.display = 'block';
      if (shownHints >= sec.hints.length) return;
      var hint = el('li', null, sec.hints[shownHints]);
      hintsBox.appendChild(hint);
      shownHints++;
      if (shownHints >= sec.hints.length) {
        hintBtn.disabled = true;
        hintBtn.textContent = '提示已给完';
      }
    });

    solBtn.addEventListener('click', function () {
      if (passed) { revealSolution(); return; }
      confirmBox('看参考答案？', '参考答案只是其中一种写法。先自己跑一遍断言，看看到底哪条不满足。', '看答案', revealSolution);
    });

    function revealSolution() {
      editor.value = sec.solution;
      try { localStorage.setItem(KEY_CODE, sec.solution); } catch (e) {}
      run(false);
    }

    resetBtn.addEventListener('click', function () {
      editor.value = sec.starter;
      try { localStorage.removeItem(KEY_CODE); } catch (e) {}
      passed = false;
      ctx.progress.setPassed(sec.id, false);
      paintDot();
      setPill('idle', '已重置');
      clearConsole();
      resetRows();
      if (ctx.onResult) ctx.onResult();
    });

    card._run = run;
    return card;
  }

  /* ---------- 确认框 ---------- */
  function confirmBox(title, text, okText, onOk) {
    var back = el('div', 'modal-backdrop');
    var box = el('div', 'modal');
    var h = el('h3', null, title);
    var p = el('p', null, text);
    var acts = el('div', 'modal-actions');
    var cancel = el('button', 'btn btn-sm', '再想想');
    var okBtn = el('button', 'btn btn-primary btn-sm', okText || '确定');
    acts.appendChild(cancel);
    acts.appendChild(okBtn);
    box.appendChild(h);
    box.appendChild(p);
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
   * 段落按列宽分组装进容器：讲解/示例/表格进 .read（窄列居中），练习进 .work（宽列）。
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

    chapter.sections.forEach(function (sec) {
      if (sec.kind === 'exercise') {
        hostFor('work').appendChild(exerciseCard(sec, ctx));
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
          row.forEach(function (c) { r.appendChild(el('td', null, String(c))); });
          tb.appendChild(r);
        });
        t.appendChild(tb);
        /* 表格包一层横向滚动容器：窄屏下宽表自己滚，而不是把整页撑宽 */
        var tw = el('div', 'tbl-wrap');
        tw.appendChild(t);
        readHost.appendChild(tw);
      } else if (sec.kind === 'code') {
        readHost.appendChild(exampleBlock(sec));
      }
    });
  }

  root.JSLAB_render = {
    el: el,
    md: md,
    renderChapter: renderChapter,
    makeEditor: makeEditor,
    confirmBox: confirmBox,
    exerciseCard: exerciseCard
  };
})(window);
