/* highlight.js — 极简语法高亮：JS + JSX/htm 一套，给静态代码块与编辑器叠层共用。
 * 单遍正则，不做解析；宁可少上色，不要错位（高亮层和透明 textarea 叠在一起，错位就是可见的 bug）。
 *
 * 比纯 JS 那版多两类 token：JSX / htm 的标签（`<div`、`</div>`、`/>`）与花括号插值。
 * 顺序很重要：标签排在字符串前面，否则标签属性里的引号会被当成字符串整段吃掉。 */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) { return '<span class="' + cls + '">' + esc(text) + '</span>'; }

  var KEYWORDS = ['as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'get', 'if',
    'import', 'in', 'instanceof', 'let', 'new', 'null', 'of', 'return', 'set', 'static', 'super', 'switch',
    'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'yield'].join('|');

  var RE = new RegExp([
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',                                         // 1 注释
    '(<\\/?[a-zA-Z][\\w.-]*|\\/?>)',                                                 // 2 标签名 / 尖括号
    "('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)",   // 3 字符串 / 模板串
    '(\\{\\s*[^{}\\n]{0,60}\\s*\\})',                                                // 4 花括号插值
    '(\\b\\d[\\w.]*\\b)',                                                            // 5 数字
    '(\\b(?:' + KEYWORDS + ')\\b)',                                                  // 6 关键字
    '([A-Za-z_$][\\w$]*)(?=\\s*\\()',                                                // 7 调用
    '([A-Za-z_$][\\w$]*)'                                                            // 8 标识符
  ].join('|'), 'g');
  var CLS = [null, 'tk-com', 'tk-tag', 'tk-str', 'tk-prop', 'tk-num', 'tk-key', 'tk-fn', null];

  function highlight(code) {
    code = String(code == null ? '' : code);
    var out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      var cls = null;
      for (var g = 1; g < CLS.length; g++) { if (m[g] !== undefined) { cls = CLS[g]; break; } }
      out += cls ? span(cls, m[0]) : esc(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) RE.lastIndex++;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  root.RLLAB_highlight = highlight;
  root.RLLAB_escape = esc;
})(typeof window !== 'undefined' ? window : globalThis);
