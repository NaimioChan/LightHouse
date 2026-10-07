/* format.js — 值格式化，只有这一份。
 *
 * 判题内核、沙箱 iframe 三处共用同一段源码（VUELAB_FMT_SOURCE 被贴进 srcdoc）。
 * 容器内字符串用单引号，与 js-lab / ts-lab 的风格一致。
 */
(function (root) {
  'use strict';

  function VUELAB_fmt(v, depth, seen) {
    var d = depth == null ? 0 : depth;
    var s = seen || [];
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    var t = typeof v;
    if (t === 'string') return d === 0 ? v : "'" + v + "'";
    if (t === 'number' || t === 'boolean') return String(v);
    if (t === 'bigint') return String(v) + 'n';
    if (t === 'symbol') return String(v);
    if (t === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
    if (d > 4) return '…';
    if (s.indexOf(v) >= 0) return '[Circular]';
    s = s.concat([v]);
    if (Array.isArray(v)) {
      return '[ ' + v.map(function (x) { return VUELAB_fmt(x, d + 1, s); }).join(', ') + ' ]';
    }
    if (v instanceof Map) {
      var m = [];
      v.forEach(function (val, k) { m.push(VUELAB_fmt(k, d + 1, s) + ' => ' + VUELAB_fmt(val, d + 1, s)); });
      return 'Map { ' + m.join(', ') + ' }';
    }
    if (v instanceof Set) {
      var st = [];
      v.forEach(function (val) { st.push(VUELAB_fmt(val, d + 1, s)); });
      return 'Set { ' + st.join(', ') + ' }';
    }
    if (v instanceof Date) return v.toISOString();
    if (v instanceof Element) return '<' + v.tagName.toLowerCase() + '>';
    var keys = Object.keys(v);
    if (!keys.length) return '{}';
    return '{ ' + keys.map(function (k) {
      return k + ': ' + VUELAB_fmt(v[k], d + 1, s);
    }).join(', ') + ' }';
  }

  root.VUELAB_fmt = VUELAB_fmt;
  root.VUELAB_FMT_SOURCE = 'function VUELAB_fmt' + VUELAB_fmt.toString().slice('function VUELAB_fmt'.length);
})(typeof window !== 'undefined' ? window : globalThis);
