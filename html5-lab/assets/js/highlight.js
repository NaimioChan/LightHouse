/* highlight.js — 极简语法高亮：HTML / CSS / JS 三套，给静态代码块与编辑器叠层共用。
 * 单遍正则，不做解析；宁可少上色，不要错位（高亮层和透明 textarea 是叠在一起的，错位就是可见的 bug）。 */
(function (root) {

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) { return '<span class="' + cls + '">' + esc(text) + '</span>'; }

  /* ---------- JS ---------- */
  var JS_RE = new RegExp([
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',                                     // 1 注释
    "('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)", // 2 字符串
    '(\\b\\d[\\w.]*\\b)',                                                       // 3 数字
    '(\\b(?:var|let|const|function|return|if|else|for|while|do|break|continue|new|typeof|instanceof|class|extends|super|this|try|catch|finally|throw|switch|case|default|delete|in|of|async|await|yield|null|undefined|true|false)\\b)', // 4 关键字
    '([A-Za-z_$][\\w$]*)(?=\\s*\\()',                                            // 5 函数名
    '([A-Za-z_$][\\w$]*)'                                                       // 6 标识符
  ].join('|'), 'g');
  var JS_CLS = [null, 'tk-com', 'tk-str', 'tk-num', 'tk-key', 'tk-fn', null];

  function highlightJS(code) {
    var out = '', last = 0, m;
    JS_RE.lastIndex = 0;
    while ((m = JS_RE.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      var cls = null;
      for (var g = 1; g < JS_CLS.length; g++) { if (m[g] !== undefined) { cls = JS_CLS[g]; break; } }
      out += cls ? span(cls, m[0]) : esc(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) JS_RE.lastIndex++;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  /* ---------- HTML ---------- */
  var HTML_RE = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][^>]*>)/g;
  var ATTR_RE = /([^\s=>]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?/g;

  function tagSpan(t) {
    var m = /^(<\/?)([a-zA-Z][\w:-]*)([\s\S]*?)(\/?>)$/.exec(t);
    if (!m) return esc(t);
    var attrs = m[3].replace(ATTR_RE, function (_, name, eqs, val) {
      return span('tk-attr', name) + esc(eqs) + (val ? span('tk-str', val) : '');
    });
    return span('tk-pun', m[1]) + span('tk-tag', m[2]) + attrs + span('tk-pun', m[4]);
  }

  function highlightHTML(code) {
    var out = '', last = 0, m;
    HTML_RE.lastIndex = 0;
    while ((m = HTML_RE.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      out += m[1] ? span('tk-com', m[1]) : tagSpan(m[2]);
      last = m.index + m[0].length;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  /* ---------- CSS ---------- */
  var CSS_RE = new RegExp([
    '(\\/\\*[\\s\\S]*?\\*\\/)',                 // 1 注释
    '("[^"\\n]*"|\'[^\'\\n]*\')',               // 2 字符串
    '(@[\\w-]+)',                               // 3 @规则
    '(#[0-9a-fA-F]{3,8}\\b)',                   // 4 颜色
    '([-a-zA-Z]+)(?=\\s*:)',                    // 5 属性名
    '(\\b\\d+(?:\\.\\d+)?(?:px|rem|em|%|s|ms|deg|vh|vw|fr)?\\b)'  // 6 数字
  ].join('|'), 'g');
  var CSS_CLS = [null, 'tk-com', 'tk-str', 'tk-at', 'tk-num', 'tk-prop', 'tk-num'];

  function highlightCSS(code) {
    var out = '', last = 0, m;
    CSS_RE.lastIndex = 0;
    while ((m = CSS_RE.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      var cls = null;
      for (var g = 1; g < CSS_CLS.length; g++) { if (m[g] !== undefined) { cls = CSS_CLS[g]; break; } }
      out += cls ? span(cls, m[0]) : esc(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) CSS_RE.lastIndex++;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  function highlight(code, lang) {
    if (lang === 'css') return highlightCSS(String(code || ''));
    if (lang === 'js') return highlightJS(String(code || ''));
    return highlightHTML(String(code || ''));
  }

  root.H5LAB_highlight = highlight;
  root.H5LAB_escape = esc;
})(typeof window !== 'undefined' ? window : globalThis);
