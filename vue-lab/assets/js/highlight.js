/* highlight.js — 极简语法高亮：SFC（模板 + 脚本 + 样式）一套，给静态代码块与编辑器叠层共用。
 * 单遍正则，不做解析；宁可少上色，不要错位（高亮层和透明 textarea 叠在一起，错位就是可见的 bug）。
 *
 * 比 ts-lab 那版多两类 token：模板标签（含 v- 指令与 @ 事件）与插值 {{ }}。
 * 顺序很重要：模板标签排在字符串前面，否则标签属性里的引号会被当成字符串整段吃掉。 */
(function (root) {

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) { return '<span class="' + cls + '">' + esc(text) + '</span>'; }

  var KEYWORDS = ['as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'get', 'if',
    'import', 'in', 'instanceof', 'let', 'new', 'null', 'of', 'return', 'set', 'static', 'super', 'switch',
    'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'yield'].join('|');

  var VUE_RE = new RegExp([
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',                                       // 1 注释
    '(\\{\\{[^}]*\\}\\})',                                                          // 2 插值
    '(<\\/?[a-zA-Z][\\w-]*|\\/?>)',                                                 // 3 标签名 / 尖括号
    '((?:v-|@|:)[a-zA-Z][\\w:.-]*)',                                               // 4 指令 / 事件 / 绑定
    "('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)", // 5 字符串（模板里含转义）
    '(\\b\\d[\\w.]*\\b)',                                                          // 6 数字
    '(\\b(?:' + KEYWORDS + ')\\b)',                                                // 7 关键字
    '([A-Za-z_$][\\w$]*)(?=\\s*\\()',                                              // 8 调用
    '([A-Za-z_$][\\w$]*)'                                                          // 9 标识符
  ].join('|'), 'g');
  var CLS = [null, 'tk-com', 'tk-prop', 'tk-tag', 'tk-at', 'tk-str', 'tk-num', 'tk-key', 'tk-fn', null];

  function highlight(code) {
    code = String(code == null ? '' : code);
    var out = '', last = 0, m;
    VUE_RE.lastIndex = 0;
    while ((m = VUE_RE.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      var cls = null;
      for (var g = 1; g < CLS.length; g++) { if (m[g] !== undefined) { cls = CLS[g]; break; } }
      out += cls ? span(cls, m[0]) : esc(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) VUE_RE.lastIndex++;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  root.VUELAB_highlight = highlight;
  root.VUELAB_escape = esc;
})(typeof window !== 'undefined' ? window : globalThis);
