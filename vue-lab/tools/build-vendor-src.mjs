/* build-vendor-src.mjs — 把 vendor 的两个产物打包成「源码字符串」classic 脚本。
 *
 * 为什么需要这一层（实测结论，见 docs/02-compile-model.md）：
 *   - 沙箱 iframe 是 opaque origin，里面 `<script src>` 一律 onerror，只能 postMessage 送文本进去。
 *   - file:// 下父页面的 fetch 与 XHR 读本地文件全被拦。
 *   - file:// 下 `<script src>` 的 textContent 是**空的**（外链脚本不暴露源码）。
 *   - 只有 classic `<script src>` 在 http 与 file:// 两条路上都能把本地 js 执行起来。
 * 所以：把源码本身编码成一个字符串常量，用 classic 脚本送进页面，沙箱里再 eval。
 * 这也是 ts-lab 对 3.2 MB 的 lib `.d.ts` 用的办法（libs-embed.js）。
 *
 * 产物里不含原始的可执行版本，只是字符串，体积与原来基本一样（多一层 JSON 转义）。
 *
 * 用法：node tools/build-vendor-src.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = path.join(ROOT, 'vendor');

function build(rel, globalName, outName) {
  const src = fs.readFileSync(path.join(VENDOR, rel), 'utf8');
  /* JSON.stringify 给出的就是一个合法的 JS 字符串字面量，转义由它负责。
     顺带把 </script 挡掉：万一以后有人把这段内联进 HTML，也不会提前闭合。 */
  const literal = JSON.stringify(src).replace(/<\/script/gi, '<\\/script');
  const body = [
    '/* vendor/' + outName + ' — 自动生成，不要手改：node tools/build-vendor-src.mjs',
    ' * 内容来源：vendor/' + rel + '（' + src.length + ' 字符）',
    ' * 它只是把源码存成一个字符串；真正求值发生在判题/预览的沙箱 iframe 里。 */',
    '(function (root) {',
    "  root." + globalName + ' = ' + literal + ';',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    ''
  ].join('\n');
  const out = path.join(VENDOR, outName);
  fs.writeFileSync(out, body);
  console.log(`${outName.padEnd(28)} ${String(fs.statSync(out).size).padStart(9)} B   ← ${rel} (${src.length} 字符)`);
  return fs.statSync(out).size;
}

const a = build('vue.global.prod.js', 'VUELAB_VUE_SRC', 'vue-global-src.js');
const b = build('vue-sfc-compiler.js', 'VUELAB_SFC_SRC', 'vue-sfc-src.js');
console.log(`\n合计 ${a + b} B（约 ${((a + b) / 1024).toFixed(0)} KB）`);
