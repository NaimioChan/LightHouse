/* highlight.js — 极简语法高亮：TypeScript 一套，给静态代码块与编辑器叠层共用。
 * 单遍正则，不做解析；宁可少上色，不要错位（高亮层和透明 textarea 叠在一起，错位就是可见的 bug）。 */
(function (root) {

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) { return '<span class="' + cls + '">' + esc(text) + '</span>'; }

  var KEYWORDS = ['abstract', 'any', 'as', 'asserts', 'async', 'await', 'bigint', 'boolean', 'break', 'case',
    'catch', 'class', 'const', 'continue', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export',
    'extends', 'false', 'finally', 'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in',
    'infer', 'instanceof', 'interface', 'is', 'keyof', 'let', 'namespace', 'never', 'new', 'null', 'number',
    'object', 'of', 'override', 'private', 'protected', 'public', 'readonly', 'return', 'satisfies', 'set',
    'static', 'string', 'super', 'switch', 'symbol', 'this', 'throw', 'true', 'try', 'type', 'typeof',
    'undefined', 'unknown', 'var', 'void', 'while', 'yield'].join('|');

  var TS_RE = new RegExp([
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',                                     // 1 注释
    "('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)", // 2 字符串
    '(\\b\\d[\\w.]*\\b)',                                                       // 3 数字
    '(\\b(?:' + KEYWORDS + ')\\b)',                                              // 4 关键字
    '([A-Za-z_$][\\w$]*)(?=\\s*[<(])',                                          // 5 函数名 / 泛型函数名
    '([A-Za-z_$][\\w$]*)'                                                       // 6 标识符
  ].join('|'), 'g');
  var CLS = [null, 'tk-com', 'tk-str', 'tk-num', 'tk-key', 'tk-fn', null];

  function highlight(code) {
    code = String(code == null ? '' : code);
    var out = '', last = 0, m;
    TS_RE.lastIndex = 0;
    while ((m = TS_RE.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      var cls = null;
      for (var g = 1; g < CLS.length; g++) { if (m[g] !== undefined) { cls = CLS[g]; break; } }
      out += cls ? span(cls, m[0]) : esc(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) TS_RE.lastIndex++;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  root.TSLAB_highlight = highlight;
  root.TSLAB_escape = esc;
})(typeof window !== 'undefined' ? window : globalThis);
