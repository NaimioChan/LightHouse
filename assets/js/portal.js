/* portal.js — 入口页：按 manifest.js 渲染各座训练场，并读它们各自记在本地存储里的进度。
 *
 * 只读：不写 localStorage，不改任何训练场的数据。进度只用来显示「你上次停在哪」。
 */
(function () {
  var LABS = window.LIGHTHOUSE_LABS || [];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  /* ---------- 进度：读各站自己写的键（形状是 { <练习 id>: 1 }） ---------- */
  function progressOf(lab) {
    var map = {}, blocked = false;
    try {
      var raw = localStorage.getItem(lab.progressKey);
      var parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object') map = parsed;
    } catch (e) {
      blocked = true;   // 隐私模式下 localStorage 会抛，入口页不该因此空着
    }
    var done = 0, total = 0, next = null, nextIndex = 0;
    lab.chapters.forEach(function (ch, i) {
      var hit = 0;
      (ch.exercises || []).forEach(function (id) {
        total++;
        if (map[id]) { hit++; done++; }
      });
      if (!next && hit < (ch.exercises || []).length) { next = ch; nextIndex = i; }
    });
    return { done: done, total: total, next: next, nextIndex: nextIndex, blocked: blocked };
  }

  /* ---------- 一张卡片：站名 + 规模 + 教什么 + 进度 + 入口 ---------- */
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
    head.appendChild(el('span', 'card-stats',
      lab.stats.chapters + ' 章 · ' + lab.stats.exercises + ' 练习 · ' + lab.stats.examples + ' 示例'));
    card.appendChild(head);

    card.appendChild(el('p', 'card-blurb', lab.blurb));
    if (lab.note) card.appendChild(el('p', 'card-note', lab.note));

    /* 底部区域（进度 + 按钮）用 margin-top:auto 压在卡片底部，同一行两张卡的按钮才会齐 */
    var area = el('div', 'card-area');

    var line = el('div', 'progress-line');
    if (p.blocked) {
      line.appendChild(el('span', null, '本地存储被禁用，进度读不到（练习照做，只是记不住）'));
    } else if (p.done === 0) {
      line.appendChild(el('span', null, '还没开始'));
    } else {
      line.appendChild(el('span', null, '已通过'));
      line.appendChild(el('b', null, p.done + ' / ' + p.total));
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
      var cont = el('a', 'btn btn-ghost', '继续 · 第 ' + (p.nextIndex + 1) + ' 章');
      cont.href = lab.entry + '#' + p.next.id;
      cont.setAttribute('data-continue', lab.key);
      actions.appendChild(cont);
    }
    area.appendChild(actions);
    card.appendChild(area);

    return card;
  }

  /* ---------- 保活与缓存提示：与各座训练场同款（只在本地 serve.py 下生效） ---------- */
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

  function boot() {
    keepAlive();
    var box = document.getElementById('cards');
    if (!LABS.length) {
      box.appendChild(el('p', null, '清单没加载出来：assets/js/manifest.js 缺失或损坏，跑一下 node tools/build-manifest.mjs。'));
      return;
    }
    LABS.forEach(function (lab) { box.appendChild(renderCard(lab)); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
