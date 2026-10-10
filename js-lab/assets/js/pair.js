/* pair.js — 括号与引号自动配对：纯逻辑，浏览器与 node 校验器共用同一段代码。
 *
 * 做四件事：
 *   敲开括号 → 补上闭括号，光标留在里面；有选区就把选区包起来
 *   敲闭括号 → 下一个字符正好是它，就跳过去，不补第二个
 *   敲引号 ' " ` → 补上同一个引号，光标留在中间；有选区就用引号把选区包起来
 *   Backspace → 光标夹在一对空括号或空引号中间时，一次删掉一对
 * 引号有两条克制规则：单引号紧跟标识符字符时不补（don't 这类撇号）；下一个字符正好是同一个引号时就跳过去。
 * HTML 的 < > 不补（标签闭合是另一件事）。
 *
 * 编辑器 keydown 里调 decide() / decideBackspace()：返回 { value, start, end } 就采纳，
 * 返回 null 表示不插手，交给浏览器默认行为。
 * 入参 status 形如 { key, value, start, end, ctrlKey, metaKey, altKey, composing }。
 */
(function (root) {
  var PAIRS = { '(': ')', '[': ']', '{': '}' };
  var CLOSERS = { ')': '(', ']': '[', '}': '{' };
  var QUOTES = { "'": 1, '"': 1, '`': 1 };

  /* 修饰键组合与输入法组合一律放行：组合期间 Enter 是选字键，抢过来会把中文输入搅坏 */
  function blocked(st) {
    return !!st.composing || !!st.ctrlKey || !!st.metaKey || !!st.altKey;
  }

  /* 标识符字符（字母、数字、下划线、$ 与常见非 ASCII 词字符）。单引号跟在它后面多半是撇号
     （don't、l'été），这时补另一半只会碍事；双引号与反引号则照补。 */
  function isWordChar(ch) { return !!ch && /[\w$]/.test(ch); }

  function decide(st) {
    if (blocked(st)) return null;
    var key = st.key;
    if (typeof key !== 'string' || key.length !== 1) return null;   // Enter / Tab / Process 之类不插手
    var v = st.value, start = st.start, end = st.end;

    if (QUOTES[key]) {
      /* 下一个字符就是同一个引号（多半是刚补上的那个）：跳过去，不补第二个 */
      if (start === end && v.charAt(start) === key) return { value: v, start: start + 1, end: start + 1 };
      /* 单引号紧跟在词字符后多半是撇号（don't、l'été）：不补。双引号与反引号跟在标识符后是合法的
         （属性值、`` html`...` `` 这类标签模板），照补 */
      if (key === "'" && start === end && isWordChar(v.charAt(start - 1))) return null;
      if (start === end) {
        return { value: v.slice(0, start) + key + key + v.slice(start), start: start + 1, end: start + 1 };
      }
      /* 包住选区，选中的文字继续选中，方便接着改 */
      return {
        value: v.slice(0, start) + key + v.slice(start, end) + key + v.slice(end),
        start: start + 1,
        end: end + 1,
      };
    }

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
      return { value: v, start: start + 1, end: start + 1 };
    }
    return null;
  }

  function decideBackspace(st) {
    if (blocked(st)) return null;
    var v = st.value, start = st.start, end = st.end;
    if (start !== end || start === 0) return null;                  // 有选区 / 在文首：不插手
    var prev = v.charAt(start - 1);
    if (PAIRS[prev] === v.charAt(start) || (QUOTES[prev] && v.charAt(start) === prev)) {
      return { value: v.slice(0, start - 1) + v.slice(start + 1), start: start - 1, end: start - 1 };
    }
    return null;
  }

  root.JSLAB_pairs = { PAIRS: PAIRS, CLOSERS: CLOSERS, QUOTES: QUOTES, decide: decide, decideBackspace: decideBackspace };
})(typeof window !== 'undefined' ? window : globalThis);
