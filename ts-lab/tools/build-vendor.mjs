/* build-vendor.mjs — 从 npm 的 typescript 包生成 vendor/ 下的两个文件。
 *
 * 用法（一次性，产物入库）：
 *   npm pack typescript@5.9.2 && tar xzf typescript-5.9.2.tgz
 *   node tools/build-vendor.mjs ./package
 *
 * 生成：
 *   vendor/typescript.js     ← package/lib/typescript.js（UMD，挂 window.ts）
 *   vendor/libs-embed.js     ← 全部 lib.*.d.ts 打成 globalThis.TSLAB_LIB = { 'lib.es5.d.ts': '…' }
 *
 * 为什么 lib 要打成一个字符串包：file:// 下父页面 fetch/XHR 读本地文件全部失败，
 * 沙箱 iframe 里 <script src> 也一律 onerror，所以 .d.ts 只能在构建期内联。
 */
import fs from 'node:fs';
import path from 'node:path';

const pkg = process.argv[2];
if (!pkg) {
  console.error('用法: node tools/build-vendor.mjs <解压后的 typescript 包目录>');
  process.exit(1);
}

const root = path.resolve(pkg);
const outDir = path.resolve('vendor');
fs.mkdirSync(outDir, { recursive: true });

const tsjs = path.join(root, 'lib', 'typescript.js');
const tsText = fs.readFileSync(tsjs, 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
fs.writeFileSync(path.join(outDir, 'typescript.js'), tsText);
console.log('vendor/typescript.js', tsText.length, 'B  (typescript@' + version + ')');

const libDir = path.join(root, 'lib');
const names = fs.readdirSync(libDir).filter((f) => /^lib\..*\.d\.ts$/.test(f)).sort();
const parts = names.map((n) => JSON.stringify(n) + ':' + JSON.stringify(fs.readFileSync(path.join(libDir, n), 'utf8')));
const banner = '/* 由 tools/build-vendor.mjs 生成，勿手改。typescript@' + version + ' 的 ' + names.length
  + ' 个 lib.*.d.ts，共 ' + parts.join(',').length + ' B。许可见 vendor/LICENSE-TypeScript.txt。 */\n';
const embed = banner + 'globalThis.TSLAB_LIB = {\n' + parts.join(',\n') + '\n};\n';
fs.writeFileSync(path.join(outDir, 'libs-embed.js'), embed);
console.log('vendor/libs-embed.js', embed.length, 'B  (' + names.length + ' 个 d.ts)');

const lic = path.join(root, 'LICENSE.txt');
if (fs.existsSync(lic)) {
  fs.copyFileSync(lic, path.join(outDir, 'LICENSE-TypeScript.txt'));
  console.log('vendor/LICENSE-TypeScript.txt');
}

/* 中文诊断信息：可选文件，加载失败时 judge.js 会降级成英文 */
const zh = path.join(root, 'lib', 'zh-cn', 'diagnosticMessages.generated.json');
if (fs.existsSync(zh)) {
  const obj = JSON.parse(fs.readFileSync(zh, 'utf8'));
  const out = '/* 由 tools/build-vendor.mjs 生成，勿手改。typescript@' + version + ' 的 zh-cn 诊断文案。 */\n'
    + 'globalThis.TSLAB_DIAG_ZH = ' + JSON.stringify(obj) + ';\n';
  fs.writeFileSync(path.join(outDir, 'diag-zh.js'), out);
  console.log('vendor/diag-zh.js', out.length, 'B  (' + Object.keys(obj).length + ' 条文案)');
} else {
  console.log('（没有 zh-cn 目录，跳过中文诊断）');
}
