/* highlight.js — 极简 JS 语法高亮。给静态示例与编辑器叠层共用。
 * 单遍正则，不做解析；模板字符串整体当作字符串（够用且不会错位）。 */
(function (root) {
  var RE = new RegExp([
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)',                                  // 1 注释
    "('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)", // 2 字符串
    '(\\b\\d[\\w.]*\\b)',                                                     // 3 数字
    '(\\b(?:var|let|const|function|return|if|else|for|while|do|break|continue|new|typeof|instanceof|class|extends|super|this|try|catch|finally|throw|switch|case|default|delete|in|of|async|await|yield|static|get|set|import|export|from|null|undefined|true|false|NaN|Infinity|void)\\b)', // 4 关键字
    '([A-Za-z_$][\\w$]*)(?=\\s*\\()',                                         // 5 调用/函数名
    '([A-Za-z_$][\\w$]*)'                                                     // 6 普通标识符
  ].join('|'), 'g');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var CLS = [null, 'tk-com', 'tk-str', 'tk-num', 'tk-key', 'tk-fn', null];

  function highlight(code) {
    var out = '', last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(code)) !== null) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      var cls = null;
      for (var g = 1; g < CLS.length; g++) { if (m[g] !== undefined) { cls = CLS[g]; break; } }
      out += cls ? '<span class="' + cls + '">' + esc(m[0]) + '</span>' : esc(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) RE.lastIndex++;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  root.JSLAB_highlight = highlight;
  root.JSLAB_escape = esc;
})(typeof window !== 'undefined' ? window : globalThis);
