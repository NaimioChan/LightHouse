/* build-vendor-src.mjs — 把 vendor/ 的 React 单入口产物打包成「源码字符串」classic 脚本。
 *
 * 为什么需要这一层（与 vue-lab 同理，见 docs/02-runtime-model.md）：
 *   - 判题/预览的沙箱 iframe 是 opaque origin，里面 `<script src>` 一律 onerror，只能 postMessage 送文本进去。
 *   - file:// 下父页面的 fetch 与 XHR 读本地文件全被拦。
 *   - file:// 下 `<script src>` 的 textContent 是空的（外链脚本不暴露源码）。
 * 所以把源码本身编码成一个字符串常量，用 classic 脚本送进页面，沙箱里再 eval。
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
  const literal = JSON.stringify(src).replace(/<\/script/gi, '<\\/script');
  const body = [
    '/* vendor/' + outName + ' — 自动生成，不要手改：node tools/build-vendor-src.mjs',
    ' * 内容来源：vendor/' + rel + '（' + src.length + ' 字符）',
    ' * 它只是把源码存成一个字符串；真正求值发生在判题/预览的沙箱 iframe 里。 */',
    '(function (root) {',
    '  root.' + globalName + ' = ' + literal + ';',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    ''
  ].join('\n');
  const out = path.join(VENDOR, outName);
  fs.writeFileSync(out, body);
  console.log(`${outName.padEnd(26)} ${String(fs.statSync(out).size).padStart(9)} B   ← ${rel} (${src.length} 字符)`);
  return fs.statSync(out).size;
}

const a = build('react19.iife.min.js', 'RLLAB_REACT_SRC', 'react19-src.js');
console.log(`\n合计 ${a} B（约 ${(a / 1024).toFixed(0)} KB）`);
