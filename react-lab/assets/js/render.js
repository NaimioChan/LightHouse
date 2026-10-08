/* render.js — 迷你 markdown + 章节 / 示例 / 练习的渲染。内容契约见 docs/01-content-schema.md。
 *
 * 与 vue-lab 的差别：右边同样是「真实在跑的渲染预览」（教的是组件跑起来的样子），
 * 但预览的是 React 组件，面板里的「编译产物」其实是**改写后的源码**（模块导入被换掉）。
 */
(function (root) {

  var esc = root.RLLAB_escape;
  var highlight = root.RLLAB_highlight;
  var autopair = root.RLLAB_pairs;
  var BOX = root.RLLAB_SANDBOX;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- 迷你 markdown（子集见契约文档） ---------- */
  function inline(s) {
    s = esc(s);
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

    function setCaret(start, end, sync) {
      var apply = function () { ta.selectionStart = start; ta.selectionEnd = end == null ? start : end; };
      if (sync) apply();
      else (window.requestAnimationFrame || function (fn) { setTimeout(fn, 0); })(apply);
    }

    ta.addEventListener('input', changed);
    ta.addEventListener('scroll', syncScroll);
    ta.addEventListener('keydown', function (ev) {
      var start = ta.selectionStart, end = ta.selectionEnd, v = ta.value;

      if (ev.isComposing || ev.keyCode === 229) return;

      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        if (opts.onRun) opts.onRun();
        return;
      }

      var st = { key: ev.key, value: v, start: start, end: end, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey, altKey: ev.altKey };
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
          var insert = '\n' + ind + '  \n' + ind + (closer === '}' ? '' : '');
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

  /* ---------- 渲染预览：一个真在跑的 iframe ---------- */
  function makePreview(host, opts) {
    opts = opts || {};
    var wrap = el('div', 'preview-box');
    var head = el('div', 'preview-head');
    head.appendChild(el('span', null, opts.label || '渲染结果'));
    var note = el('span', 'preview-note');
    head.appendChild(note);

    var frame = document.createElement('iframe');
    frame.className = 'preview-frame';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', '组件渲染预览');
    frame.setAttribute('srcdoc', '<!doctype html><meta charset="utf-8">');

    wrap.appendChild(head);
    wrap.appendChild(frame);
    host.appendChild(wrap);

    return {
      el: wrap,
      frame: frame,
      setNote: function (t) { note.textContent = t || ''; },
      show: function (src) {
        if (!BOX) return Promise.resolve();
        note.textContent = '';
        return BOX.runPreview(src, frame);
      },
      clear: function () {
        frame.setAttribute('srcdoc', '<!doctype html><meta charset="utf-8">');
      }
    };
  }

  /* ---------- 断言清单 ---------- */
  function makeTests(host, tests) {
    var box = el('div', 'tests');
    box.appendChild(el('div', 'tests-head', '检查项'));
    var rows = [];
    (tests || []).forEach(function (body, i) {
      var row = el('div', 'test-row');
      var mark = el('span', 'test-mark wait', '·');
      var body_ = el('div', 'test-body');
      var label = el('div', 'test-label', shortLabel(body, i));
      var msg = el('div', 'test-msg');
      body_.appendChild(label);
      body_.appendChild(msg);
      row.appendChild(mark);
      row.appendChild(body_);
      box.appendChild(row);
      rows.push({ row: row, mark: mark, msg: msg });
    });
    host.appendChild(box);

    return {
      el: box,
      reset: function () {
        rows.forEach(function (r) {
          r.mark.className = 'test-mark wait';
          r.mark.textContent = '·';
          r.msg.textContent = '';
        });
      },
      apply: function (results) {
        rows.forEach(function (r, i) {
          var res = results && results[i];
          if (!res) {
            r.mark.className = 'test-mark wait';
            r.mark.textContent = '·';
            r.msg.textContent = '';
            return;
          }
          r.mark.className = 'test-mark ' + (res.pass ? 'ok' : 'bad');
          r.mark.textContent = res.pass ? '✓' : '✗';
          r.msg.textContent = res.pass ? '' : res.message;
        });
      },
      allPass: function (results) {
        return (results || []).length === (tests || []).length && results.every(function (r) { return r.pass; });
      }
    };
  }

  function shortLabel(body, i) {
    var m = /,\s*(['"])([^'"]{2,40})\1\s*\)/.exec(String(body));
    if (m) return (i + 1) + '. ' + m[2];
    var s = String(body).trim().replace(/\s+/g, ' ');
    return (i + 1) + '. ' + (s.length > 46 ? s.slice(0, 44) + '…' : s);
  }

  /* ---------- 示例（讲解区的代码块：当场改写运行 + 可选预览） ---------- */
  function demoBlock(sec, ctx) {
    var wrap = el('div', 'case');
    var head = el('div', 'case-head');
    head.appendChild(el('span', 'case-caption', sec.caption || '示例'));

    var jsBtn = el('button', 'btn btn-sm', '看改写产物');
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

    var wantPreview = (sec.show !== 'none');
    var preview = null;
    if (wantPreview) {
      var pvHost = el('div');
      pvHost.style.marginTop = '10px';
      wrap.appendChild(pvHost);
      preview = makePreview(pvHost, { label: '渲染结果' });
    }

    jsBtn.addEventListener('click', function () {
      var hidden = jsPre.hasAttribute('hidden');
      if (hidden) jsPre.removeAttribute('hidden'); else jsPre.setAttribute('hidden', 'hidden');
      jsBtn.textContent = hidden ? '收起改写产物' : '看改写产物';
    });

    function render() {
      foot.textContent = '';
      foot.appendChild(el('span', null, '运行中…'));
      if (preview) preview.setNote('运行中…');
      return ctx.runDemo(sec.code, sec.tests || [], preview && preview.frame).then(function (res) {
        foot.textContent = '';
        jsPre.textContent = res.compiled || '';

        var bad = [];
        if (res.fatal) bad.push(res.fatal);
        (res.runtimeErrors || []).forEach(function (e) { bad.push(e.message); });
        (res.tests || []).forEach(function (t) { if (!t.pass) bad.push(t.message); });

        if (res.fatal || (res.runtimeErrors && res.runtimeErrors.length)) {
          foot.appendChild(el('span', 'case-out err', res.fatal || res.runtimeErrors[0].message));
        } else if (res.tests && res.tests.length) {
          var passed = res.tests.filter(function (t) { return t.pass; }).length;
          foot.appendChild(el('span', null, '检查项 ' + passed + '/' + res.tests.length + ' 通过。'));
          res.tests.filter(function (t) { return !t.pass; }).forEach(function (t) {
            foot.appendChild(el('span', 'case-out err', t.message));
          });
        } else {
          foot.appendChild(el('span', null, '这个示例只展示渲染结果。'));
        }

        if (bad.length) {
          note.style.display = 'block';
          note.textContent = '这个示例没通过自检：' + bad.join('；');
        } else {
          note.style.display = 'none';
        }
        if (preview) preview.setNote(res.fatal ? '运行失败' : '');
        return res;
      });
    }

    return { el: wrap, render: render };
  }

  /* ---------- 练习卡 ---------- */
  function exerciseCard(sec, ctx) {
    var card = el('div', 'ex-card');
    card.id = sec.id;
    card.setAttribute('data-ex', sec.id);

    var head = el('div', 'ex-head');
    head.appendChild(el('span', 'ex-id', sec.id));
    head.appendChild(el('span', 'ex-title', sec.title));
    var dot = el('span', 'ex-dot');
    head.appendChild(dot);
    card.appendChild(head);

    var grid = el('div', 'ex-grid');
    var task = el('div', 'ex-task md');
    task.innerHTML = md(sec.task || '');
    grid.appendChild(task);

    var edCell = el('div', 'editor-cell');
    grid.appendChild(edCell);

    var tests = makeTests(grid, sec.tests || []);

    card.appendChild(grid);

    var actions = el('div', 'ex-actions');
    var runBtn = el('button', 'btn btn-primary', '运行检查');
    var resetBtn = el('button', 'btn btn-sm', '还原起始代码');
    var hintBtn = el('button', 'btn btn-sm', '提示（' + (sec.hints || []).length + '）');
    var status = el('span', 'status-pill idle', '未检查');
    actions.appendChild(runBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(hintBtn);
    actions.appendChild(status);

    var hintList = el('ul', 'hint-list');
    hintList.style.display = 'none';
    (sec.hints || []).forEach(function (h) {
      var li = el('li');
      li.innerHTML = inline(h);
      hintList.appendChild(li);
    });
    card.appendChild(actions);
    card.appendChild(hintList);

    hintBtn.addEventListener('click', function () {
      var hidden = hintList.style.display === 'none';
      hintList.style.display = hidden ? 'block' : 'none';
      hintBtn.textContent = (hidden ? '收起提示' : '提示（' + (sec.hints || []).length + '）');
    });

    var editor = makeEditor(edCell, sec.starter, {
      label: sec.title + ' 的代码编辑器',
      onInput: function (text) {
        ctx.onEdit(sec.id, text);
        if (!ctx.autoRun()) return;
        clearTimeout(autoTimer);
        autoTimer = setTimeout(function () { run(); }, 700);
      },
      onRun: function () { run(); }
    });

    var busy = false;
    var autoTimer = null;
    function setStatus(kind, text) {
      status.className = 'status-pill ' + kind;
      status.textContent = text;
    }

    function run() {
      if (busy) return Promise.resolve(null);
      busy = true;
      runBtn.disabled = true;
      tests.reset();
      setStatus('idle', '检查中…');
      return ctx.run(editor.value, sec.tests || []).then(function (res) {
        busy = false;
        runBtn.disabled = false;
        tests.apply(res.tests);
        if (res.fatal || (res.runtimeErrors && res.runtimeErrors.length)) {
          dot.className = 'ex-dot fail';
          setStatus('fail', '没跑起来');
          return res;
        }
        var pass = tests.allPass(res.tests);
        dot.className = 'ex-dot ' + (pass ? 'pass' : 'fail');
        if (pass) {
          setStatus('pass', '全部通过');
          ctx.onPass(sec.id);
        } else {
          var n = (res.tests || []).filter(function (t) { return !t.pass; }).length;
          setStatus('fail', n + ' 项未通过');
          ctx.onFail(sec.id);
        }
        return res;
      });
    }

    resetBtn.addEventListener('click', function () {
      editor.value = sec.starter;
      tests.reset();
      dot.className = 'ex-dot';
      setStatus('idle', '未检查');
      ctx.onEdit(sec.id);
    });

    runBtn.addEventListener('click', function () { run(); });

    return { el: card, run: run, setCode: function (v) { editor.value = v; }, getCode: function () { return editor.value; } };
  }

  /* ---------- 章节渲染 ---------- */
  function renderChapter(chapter, ctx) {
    var frag = document.createDocumentFragment();
    var read = el('div', 'read');
    var work = el('div', 'work');
    var cards = [];

    frag.appendChild(el('h1', null, chapter.title));
    if (chapter.goal) read.appendChild(el('p', 'goal', chapter.goal));

    (chapter.sections || []).forEach(function (sec) {
      if (!sec || !sec.kind) return;
      var node = null;

      if (sec.kind === 'prose') {
        node = el('div', 'md');
        node.innerHTML = md(sec.md || '');
        read.appendChild(node);
      } else if (sec.kind === 'note') {
        node = el('div', 'note' + (sec.tone === 'tip' ? ' tip' : ''));
        node.innerHTML = md(sec.md || '');
        read.appendChild(node);
      } else if (sec.kind === 'table') {
        var tw = el('div', 'tbl-wrap');
        var tbl = el('table', 'tbl' + (sec.code ? ' mono' : ''));
        if (sec.head && sec.head.length) {
          var thead = el('thead');
          var tr = el('tr');
          sec.head.forEach(function (h) { tr.appendChild(el('th', null, h)); });
          thead.appendChild(tr);
          tbl.appendChild(thead);
        }
        var tbody = el('tbody');
        (sec.rows || []).forEach(function (row) {
          var r = el('tr');
          row.forEach(function (cell) {
            var td = el('td');
            td.innerHTML = inline(String(cell));
            r.appendChild(td);
          });
          tbody.appendChild(r);
        });
        tbl.appendChild(tbody);
        tw.appendChild(tbl);
        read.appendChild(tw);
      } else if (sec.kind === 'demo') {
        var demo = demoBlock(sec, ctx);
        work.appendChild(demo.el);
        ctx.pending.push(demo);
      } else if (sec.kind === 'exercise') {
        var card = exerciseCard(sec, ctx);
        work.appendChild(card.el);
        cards.push(card);
      }
    });

    frag.appendChild(read);
    frag.appendChild(work);
    return { el: frag, cards: cards };
  }

  /* ---------- 确认框 ---------- */
  function confirmBox(title, body, okText, onOk) {
    var backdrop = el('div', 'modal-backdrop');
    var box = el('div', 'modal');
    box.appendChild(el('h3', null, title));
    var p = el('p', null, body);
    box.appendChild(p);

    var actions = el('div', 'modal-actions');
    var cancel = el('button', 'btn btn-sm', '取消');
    var ok = el('button', 'btn btn-sm btn-primary', okText || '确定');
    actions.appendChild(cancel);
    actions.appendChild(ok);
    box.appendChild(actions);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    function close() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(ev) { if (ev.key === 'Escape' || ev.keyCode === 27) close(); }

    cancel.addEventListener('click', close);
    ok.addEventListener('click', function () { close(); if (onOk) onOk(); });
    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) close(); });
    document.addEventListener('keydown', onKey);
    ok.focus();
    return { close: close };
  }

  root.RLLAB_render = {
    renderChapter: renderChapter, md: md, inline: inline, el: el,
    shortLabel: shortLabel, makeEditor: makeEditor, confirmBox: confirmBox
  };
})(typeof window !== 'undefined' ? window : globalThis);
