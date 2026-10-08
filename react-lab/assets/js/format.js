/* format.js — 值格式化，只有这一份。
 *
 * 判题内核、沙箱 iframe 三处共用同一段源码（RLLAB_FMT_SOURCE 被贴进 srcdoc）。
 * 容器内字符串用单引号，与其余各站的风格一致。
 */
(function (root) {
  'use strict';

  function RLLAB_fmt(v, depth, seen) {
    var d = depth == null ? 0 : depth;
    var s = seen || [];
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (v && typeof v === 'object' && v.nodeType === 1) return '<' + String(v.tagName || '').toLowerCase() + '>';
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
      return '[ ' + v.map(function (x) { return RLLAB_fmt(x, d + 1, s); }).join(', ') + ' ]';
    }
    if (v instanceof Map) {
      var m = [];
      v.forEach(function (val, k) { m.push(RLLAB_fmt(k, d + 1, s) + ' => ' + RLLAB_fmt(val, d + 1, s)); });
      return 'Map { ' + m.join(', ') + ' }';
    }
    if (v instanceof Set) {
      var st = [];
      v.forEach(function (val) { st.push(RLLAB_fmt(val, d + 1, s)); });
      return 'Set { ' + st.join(', ') + ' }';
    }
    if (v instanceof Date) return v.toISOString();
    var keys = Object.keys(v);
    if (!keys.length) return '{}';
    return '{ ' + keys.map(function (k) {
      return k + ': ' + RLLAB_fmt(v[k], d + 1, s);
    }).join(', ') + ' }';
  }

  root.RLLAB_fmt = RLLAB_fmt;
  root.RLLAB_FMT_SOURCE = 'function RLLAB_fmt' + RLLAB_fmt.toString().slice('function RLLAB_fmt'.length);
})(typeof window !== 'undefined' ? window : globalThis);
