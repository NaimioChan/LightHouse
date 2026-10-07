/* portal.js — 入口页：按 manifest.js 渲染总览、选哪个、四张卡片，并读各训练场的本地进度。
 *
 * 入口页是只读的：不写 localStorage，不改任何训练场的数据。进度只用来显示「你上次停在哪」。
 */
(function () {
  var LABS = window.LIGHTHOUSE_LABS || [];

  /* ---------- 小工具 ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function num(n) { return String(n); }

  /* ---------- 进度：先读各自训练场写下的 localStorage ---------- */
  function readMap(key) {
    var out = { map: {}, blocked: false };
    try {
      var raw = localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object') out.map = parsed;
    } catch (e) {
      out.blocked = true;   // 隐私模式下 localStorage 会抛，入口页不该因此空着
    }
    return out;
  }

  function progressOf(lab) {
    var read = readMap(lab.progressKey);
    var done = 0, total = 0, next = null, nextIndex = 0;
    lab.chapters.forEach(function (ch, i) {
      var hit = 0;
      (ch.exercises || []).forEach(function (id) {
        total++;
        if (read.map[id]) { hit++; done++; }
      });
      if (!next && hit < (ch.exercises || []).length) { next = ch; nextIndex = i; }
    });
    return { done: done, total: total, next: next, nextIndex: nextIndex, blocked: read.blocked };
  }

  /* ---------- 顶部合计 ---------- */
  function renderSummary(labs) {
    var t = labs.reduce(function (a, l) {
      return {
        chapters: a.chapters + l.stats.chapters,
        exercises: a.exercises + l.stats.exercises,
        examples: a.examples + l.stats.examples,
      };
    }, { chapters: 0, exercises: 0, examples: 0 });

    var box = document.getElementById('summary');
    [
      [t.chapters, '章'],
      [t.exercises, '个练习'],
      [t.examples, '个当场运行的示例'],
      [labs.length, '座训练场'],
    ].forEach(function (pair, i) {
      if (i) box.appendChild(el('span', 'sep', '·'));
      box.appendChild(el('strong', null, num(pair[0])));
      box.appendChild(el('span', null, pair[1]));
    });
    box.appendChild(el('span', 'src', '按 tools/labs.json 与各训练场内容生成'));
    return t;
  }

  /* ---------- 选哪个：行由清单生成，最后一行（不确定先学哪个）写在 HTML 里 ---------- */
  function renderPick(labs) {
    var tbody = document.getElementById('pick-body');
    var fixed = [].slice.call(tbody.children);   // HTML 里写死的行（排到最后）
    tbody.textContent = '';
    labs.forEach(function (lab) {
      var tr = el('tr');
      tr.appendChild(el('td', null, lab.want));
      var to = el('td', 'to');
      var a = el('a', null, lab.title);
      a.href = lab.entry;
      to.appendChild(a);
      tr.appendChild(to);
      tr.appendChild(el('td', 'pre', lab.prereq));
      tbody.appendChild(tr);
    });
    fixed.forEach(function (r) { tbody.appendChild(r); });
  }

  /* ---------- 卡片 ---------- */
  function renderCard(lab) {
    var p = progressOf(lab);
    var card = el('article', 'card');
    card.style.setProperty('--card-accent', 'var(--' + lab.accentToken + ')');
    card.style.setProperty('--card-accent-strong', 'var(--' + lab.accentToken + '-strong)');
    card.setAttribute('data-lab', lab.key);

    var head = el('div', 'card-head');
    var title = el('h2', 'card-title');
    var link = el('a', null, lab.title);
    link.href = lab.entry;
    title.appendChild(link);
    head.appendChild(title);
    head.appendChild(el('div', 'card-stats',
      num(lab.stats.chapters) + ' 章 · ' + num(lab.stats.exercises) + ' 练习 · ' + num(lab.stats.examples) + ' 示例'));
    card.appendChild(head);

    card.appendChild(el('p', 'card-blurb', lab.blurb));

    var chips = el('ul', 'chips');
    (lab.learn || []).forEach(function (s) { chips.appendChild(el('li', null, s)); });
    card.appendChild(chips);

    var area = el('div', 'card-area');
    var line = el('div', 'progress-line');
    if (p.blocked) {
      line.appendChild(el('span', null, '浏览器禁用了本地存储，进度读不到（练习照样能做，只是记不住）'));
    } else if (p.done === 0) {
      line.appendChild(el('span', null, '还没开始'));
      line.appendChild(el('span', null, '共 ' + num(p.total) + ' 个练习'));
    } else {
      line.appendChild(el('span', null, '已通过'));
      line.appendChild(el('b', null, num(p.done) + ' / ' + num(p.total)));
      line.appendChild(el('span', null, p.done === p.total ? '全部完成' : '继续加油'));
    }
    area.appendChild(line);

    var track = el('div', 'track');
    var fill = el('span');
    fill.style.width = (p.total ? Math.round(p.done / p.total * 100) : 0) + '%';
    track.appendChild(fill);
    area.appendChild(track);

    var actions = el('div', 'card-actions');
    var enter = el('a', 'btn btn-enter', p.done > 0 ? '回到训练场' : '进入训练场');
    enter.href = lab.entry;
    actions.appendChild(enter);
    if (!p.blocked && p.done > 0 && p.next) {
      var cont = el('a', 'btn btn-ghost', '继续 · 第 ' + num(p.nextIndex + 1) + ' 章');
      cont.href = lab.entry + '#' + p.next.id;
      cont.setAttribute('data-continue', lab.key);
      actions.appendChild(cont);
    }
    area.appendChild(actions);
    card.appendChild(area);

    if (lab.note) card.appendChild(el('p', 'card-note', lab.note));
    return { node: card, progress: p };
  }

  function renderCards(labs) {
    var box = document.getElementById('cards');
    var sum = { done: 0, total: 0 };
    labs.forEach(function (lab) {
      var r = renderCard(lab);
      box.appendChild(r.node);
      sum.done += r.progress.done;
      sum.total += r.progress.total;
    });
    var mini = document.getElementById('mini-fill');
    var text = document.getElementById('mini-text');
    var pct = sum.total ? Math.round(sum.done / sum.total * 100) : 0;
    mini.style.width = pct + '%';
    text.textContent = sum.done + ' / ' + sum.total + '（' + pct + '%）';
  }

  /* ---------- 保活与缓存提示：与四个训练场同款 ---------- */
  function staleBanner(tag) {
    if (document.getElementById('stale-banner')) return;
    var b = el('div', 'stale-banner');
    b.id = 'stale-banner';
    var span = el('span');
    span.innerHTML = '<strong>这个页面是浏览器缓存里的旧版本。</strong>按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> 强制刷新一次：' +
      '页面才是最新的，关掉这个标签页时命令行窗口也才会跟着关。';
    b.appendChild(span);
    b.appendChild(el('span', null, tag || ''));
    document.body.insertBefore(b, document.body.firstChild);
  }

  function keepAlive() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    if (!/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) return;
    try {
      var es = new EventSource('/__alive');
      var opened = false;
      es.onopen = function () { opened = true; };
      es.onerror = function () { if (!opened) es.close(); };
      window.LIGHTHOUSE_ALIVE = es;
    } catch (e) {}

    setTimeout(function () {
      if (window.LIGHTHOUSE_ALIVE && window.LIGHTHOUSE_ALIVE.readyState === 1) return;
      fetch('/__whoami').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        if (t.indexOf('lighthouse serve.py') !== 0) return;
        staleBanner(t);
      }).catch(function () {});
    }, 12000);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    keepAlive();
    if (!LABS.length) {
      document.getElementById('summary').appendChild(el('span', null, '清单没加载出来：assets/js/manifest.js 缺失或损坏，跑一下 node tools/build-manifest.mjs。'));
      return;
    }
    renderSummary(LABS);
    renderPick(LABS);
    renderCards(LABS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
