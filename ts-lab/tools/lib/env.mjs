/* tools/lib/env.mjs — 让 node 校验脚本能跑 judge.js。
 *
 * judge.js 是 classic script（浏览器里挂到 window），这里用 vm 在 globalThis 上把它与 format.js 一起执行，
 * 再把 vendor 里的编译器塞进 globalThis.ts / TSLAB_LIB —— 与浏览器走的是同一份判题代码、
 * 同一个 tsconfig 默认值、同一套断言辅助。node 侧只差一个「运行器」（见 node-exec.mjs）。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let booted = null;

export function bootJudge() {
  if (booted) return booted;
  const require = createRequire(import.meta.url);
  globalThis.ts = require(path.join(ROOT, 'vendor', 'typescript.js'));
  for (const rel of ['vendor/libs-embed.js', 'vendor/diag-zh.js', 'assets/js/format.js', 'assets/js/judge.js']) {
    const file = path.join(ROOT, rel);
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  }
  if (!globalThis.TSLAB_JUDGE) throw new Error('judge.js 没挂上 TSLAB_JUDGE');
  booted = globalThis.TSLAB_JUDGE;
  return booted;
}

/** 读一章内容文件（classic script + UMD 尾巴），返回章节对象。 */
export function readChapter(file) {
  const ctx = vm.createContext({});
  const code = fs.readFileSync(file, 'utf8');
  vm.runInContext(code, ctx, { filename: file });
  const list = ctx.TSLAB_CHAPTERS || [];
  if (!list.length) throw new Error('内容文件没有挂上章节：' + file);
  return list[0];
}

export function readAllChapters(dir, only) {
  /* 按文件名先过滤再解析：并行写多章时，别人文件里的语法错不该把这一章的命令整条打崩 */
  const files = fs.readdirSync(dir)
    .filter((f) => /^ch\d+.*\.js$/.test(f))
    .filter((f) => !only || f.startsWith(only))
    .sort();
  return files.map((f) => ({ file: path.join(dir, f), chapter: readChapter(path.join(dir, f)) }));
}
