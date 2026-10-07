/* pair.js — 括号与 HTML 标签的自动配对：纯逻辑，浏览器与 node 校验器共用同一段代码。
 *
 * 三种页签通用：
 *   敲开括号 → 补上闭括号，光标留在里面；有选区就把选区包起来
 *   敲闭括号 → 下一个字符正好是它，就跳过去，不补第二个
 *   Backspace → 光标夹在一对空括号中间时，一次删掉一对
 * HTML 页签额外两件（CSS 里没有尖括号，JS 里的 `<` 是小于号，都不能补）：
 *   敲 < → 补上 >
 *   敲 > → 跳过那个 >，并在后面补上闭标签 </tag>
 *          （空元素、闭标签、DOCTYPE、注释、后面已经有闭标签的都不补）
 * 引号不补：HTML 属性与 CSS 值里到处是引号，补了更烦。
 *
 * 编辑器 keydown 里调 decide() / decideBackspace()：返回 { value, start, end } 就采纳，
 * 返回 null 表示不插手，交给浏览器默认行为。
 * 入参 status 形如 { key, value, start, end, html, ctrlKey, metaKey, altKey, composing }。
 */
(function (root) {
  var PAIRS = { '(': ')', '[': ']', '{': '}' };
  var CLOSERS = { ')': '(', ']': '[', '}': '{' };

  /* 不需要闭标签的空元素（HTML 规范里的 void elements） */
  var VOID = {
    area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1,
    link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1,
  };

  /* 修饰键组合与输入法组合一律放行：组合期间 Enter 是选字键，抢过来会把中文输入搅坏 */
  function blocked(st) {
    return !!st.composing || !!st.ctrlKey || !!st.metaKey || !!st.altKey;
  }

  /* 光标前（到 gt 这个 > 为止）是不是一个还没闭合的开标签，是就返回标签名 */
  function openTagAt(v, gt) {
    var lt = v.lastIndexOf('<', gt - 1);
    if (lt === -1) return null;
    var inner = v.slice(lt + 1, gt);
    if (!inner) return null;
    var head = inner.charAt(0);
    if (head === '/' || head === '!' || head === '?') return null;   // 闭标签 / DOCTYPE / 注释
    var m = /^([A-Za-z][\w:-]*)/.exec(inner);
    if (!m) return null;
    if (VOID[m[1].toLowerCase()]) return null;                       // <br> 之类不需要闭标签
    return m[1];
  }

  function skip(v, start) { return { value: v, start: start + 1, end: start + 1 }; }

  function decide(st) {
    if (blocked(st)) return null;
    var key = st.key;
    if (typeof key !== 'string' || key.length !== 1) return null;   // Enter / Tab / Process 之类不插手
    var v = st.value, start = st.start, end = st.end;

    /* ---------- HTML 页签：尖括号与标签闭合 ---------- */
    if (st.html) {
      if (key === '<') {
        if (start !== end) return null;                             // 有选区时交给浏览器（包成 <选区> 只多一个开标签）
        return { value: v.slice(0, start) + '<>' + v.slice(start), start: start + 1, end: start + 1 };
      }
      if (key === '>' && start === end && v.charAt(start) === '>') {
        var name = openTagAt(v, start);
        if (!name) return skip(v, start);                           // 跳过 > 就行，不用补闭标签
        var tail = v.slice(start + 1);
        if (new RegExp('^\\s*</\\s*' + name + '\\b', 'i').test(tail)) return skip(v, start);
        return {
          value: v.slice(0, start + 1) + '</' + name + '>' + v.slice(start + 1),
          start: start + 1,
          end: start + 1,
        };
      }
    }

    /* ---------- 三种页签通用：() [] {} ---------- */
    if (PAIRS[key]) {
      if (start === end) {
        return { value: v.slice(0, start) + key + PAIRS[key] + v.slice(start), start: start + 1, end: start + 1 };
      }
      /* 包住选区，选中的文字继续选中，方便接着改 */
      return {
        value: v.slice(0, start) + key + v.slice(start, end) + PAIRS[key] + v.slice(end),
        start: start + 1,
        end: end + 1,
      };
    }

    /* 下一个字符就是刚敲的闭括号（多半是刚自动补上的那个）：跳过去 */
    if (CLOSERS[key] && start === end && v.charAt(start) === key) {
      return skip(v, start);
    }
    return null;
  }

  function decideBackspace(st) {
    if (blocked(st)) return null;
    var v = st.value, start = st.start, end = st.end;
    if (start !== end || start === 0) return null;                  // 有选区 / 在文首：不插手
    if (PAIRS[v.charAt(start - 1)] === v.charAt(start)) {
      return { value: v.slice(0, start - 1) + v.slice(start + 1), start: start - 1, end: start - 1 };
    }
    return null;
  }

  root.TSLAB_pairs = {
    PAIRS: PAIRS, CLOSERS: CLOSERS, VOID: VOID,
    decide: decide, decideBackspace: decideBackspace, openTagAt: openTagAt,
  };
})(typeof window !== 'undefined' ? window : globalThis);
