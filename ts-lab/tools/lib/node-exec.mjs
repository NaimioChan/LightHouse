/* tools/lib/node-exec.mjs — node 侧的「运行器」：把编译产物丢进 vm 里跑，收控制台输出。
 *
 * 与浏览器侧（sandbox.js + 沙箱 iframe）对等：同样的输入（编译产物文本）、同样的输出（{ logs, error }）、
 * 同样的值格式化（format.js）。断言里写 `await run()` 时，两边应该给出一模一样的 logs。
 *
 * 同步死循环由 vm 的 timeout 掐掉（浏览器侧对应 5 秒超时）。
 */
import vm from 'node:vm';

export function makeExec() {
  const fmtArgs = globalThis.TSLAB_fmtArgs;
  if (typeof fmtArgs !== 'function') throw new Error('要先 bootJudge()');

  return function exec(jsText, timeoutMs) {
    const budget = timeoutMs || 5000;
    return new Promise((resolve) => {
      const logs = [];
      /* 注意：vm 里的代码调用宿主函数时，参数是**逐个**传进来的（不是数组），
         所以这里必须用 arguments，别写成 (a) => …（那样只有一个参数，输出会变成空字符串）。 */
      const push = function () { logs.push(fmtArgs(arguments)); };
      let live = 0, lastBusy = Date.now(), settled = false;

      const sandbox = {
        console: { log: push, info: push, warn: push, error: push, debug: push, table: push },
        setTimeout: function (fn, ms) {
          const args = Array.prototype.slice.call(arguments, 2);
          live++;
          lastBusy = Date.now();
          const id = setTimeout(function () { live--; lastBusy = Date.now(); if (typeof fn === 'function') fn.apply(null, args); }, ms);
          if (id.unref) id.unref();
          return id;
        },
        clearTimeout: function (id) { if (id) { live = Math.max(0, live - 1); clearTimeout(id); } },
        queueMicrotask: queueMicrotask
      };
      const ctx = vm.createContext(sandbox);

      let error = null;
      try {
        vm.runInContext(jsText, ctx, { timeout: budget, filename: 'main.js' });
      } catch (e) {
        error = { name: e.name || 'Error', message: String(e.message || e) };
      }

      const t0 = Date.now();
      (function tick() {
        const idle = Date.now() - lastBusy;
        if (settled) return;
        if ((live === 0 && idle >= 30) || Date.now() - t0 >= 1500) {
          settled = true;
          resolve({ logs: logs, error: error });
          return;
        }
        setTimeout(tick, 5);
      })();
    });
  };
}
