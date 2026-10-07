/* format.js — 值格式化。控制台输出与断言失败信息共用同一份实现。
 *
 * 为什么单独一个文件：判题内核（judge.js）与沙箱 iframe 里的内核（harness.js）都要格式化值，
 * 两边必须是同一个函数，否则「同一段代码在 node 校验里过、在浏览器里挂」这类假失败会一直冒出来。
 * sandbox.js 把 TSLAB_fmt 的源码贴进 iframe，node 校验脚本也加载这个文件，于是三处同源。
 * 因此：这个函数不许引用外部变量、不许碰 DOM。
 */
(function (root) {
  'use strict';

  function fmt(v, depth, inContainer) {
    depth = depth || 0;
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    var t = typeof v;
    if (t === 'string') {
      if (!inContainer) return v;
      return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    }
    if (t === 'number') { if (v !== v) return 'NaN'; if (v === 0 && 1 / v < 0) return '-0'; return String(v); }
    if (t === 'bigint') return String(v) + 'n';
    if (t === 'boolean') return String(v);
    if (t === 'symbol') return String(v);
    if (t === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
    if (depth > 3) return '…';
    if (v instanceof Error) return (v.name || 'Error') + ': ' + v.message;
    var i, out, keys;
    if (Array.isArray(v)) {
      if (!v.length) return '[]';
      out = [];
      for (i = 0; i < v.length && i < 30; i++) out.push(fmt(v[i], depth + 1, true));
      if (v.length > 30) out.push('… ' + (v.length - 30) + ' more');
      return '[ ' + out.join(', ') + ' ]';
    }
    if (v instanceof Map) return 'Map(' + v.size + ')';
    if (v instanceof Set) return 'Set(' + v.size + ')';
    try { keys = Object.keys(v); } catch (e) { return String(v); }
    if (!keys.length) {
      var ctor = v.constructor && v.constructor.name;
      return (ctor && ctor !== 'Object') ? ctor + ' {}' : '{}';
    }
    out = [];
    for (i = 0; i < keys.length; i++) out.push(keys[i] + ': ' + fmt(v[keys[i]], depth + 1, true));
    return '{ ' + out.join(', ') + ' }';
  }

  function fmtArgs(args) {
    var out = [];
    for (var i = 0; i < args.length; i++) out.push(fmt(args[i], 0, false));
    return out.join(' ');
  }

  root.TSLAB_fmt = fmt;
  root.TSLAB_fmtArgs = fmtArgs;

  /* 沙箱 iframe 里没有这个文件的作用域：把两个函数连名字一起打包成一段自包含的源码贴进 srcdoc。
     fmtArgs 内部调用的 fmt 靠的就是这里声明的 var fmt——别把顺序调过来。 */
  root.TSLAB_FMT_SOURCE = 'var fmt = ' + fmt.toString() + ';\n'
    + 'var fmtArgs = ' + fmtArgs.toString() + ';\n'
    + 'var TSLAB_fmt = fmt, TSLAB_fmtArgs = fmtArgs;\n';
})(typeof window !== 'undefined' ? window : globalThis);
