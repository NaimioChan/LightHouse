/* verify-vendor.mjs — vendor 产物的体积与哈希没变（改了要同步 vendor/README.md）。
 *
 * vendor/ 是本站唯一入库的第三方代码，体积直接决定首屏之后的加载开销，
 * 也被 .gitattributes 标了 -text（禁行尾转换）。这条闸盯住「谁手滑改了产物却没更新文档」
 * 与「重新构建后哈希漂移却没说明」。
 *
 * 用法：node tools/verify-vendor.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = path.join(ROOT, 'vendor');

/* sha 取前 16 位十六进制，与 vendor/README.md 表里的值一致 */
const EXPECT = [
  { file: 'react19.iife.min.js', size: 224264, sha16: '7e7b5e402aeff11b' },
  { file: 'react19-src.js', size: 229048, sha16: '6b9313f80d3f4863' },
];

let failures = 0;
function record(name, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

for (const want of EXPECT) {
  const p = path.join(VENDOR, want.file);
  if (!fs.existsSync(p)) { record(`vendor/${want.file} 存在`, false, '文件不存在'); continue; }
  const buf = fs.readFileSync(p);
  const sha16 = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
  record(`vendor/${want.file} 体积`, buf.length === want.size, `${buf.length} / 期望 ${want.size}`);
  record(`vendor/${want.file} sha256 前 16 位`, sha16 === want.sha16, `${sha16} / 期望 ${want.sha16}`);
}

/* 源码字符串包必须与产物同源：把产物读出来，比对 build-vendor-src.mjs 会生成的形态 */
{
  const bin = fs.readFileSync(path.join(VENDOR, 'react19.iife.min.js'), 'utf8');
  const src = fs.readFileSync(path.join(VENDOR, 'react19-src.js'), 'utf8');
  const literal = JSON.stringify(bin).replace(/<\/script/gi, '<\\/script');
  record('react19-src.js 里嵌的正是 react19.iife.min.js 的源码', src.includes(literal), '逐字符比对');
  record('react19-src.js 挂到全局 RLLAB_REACT_SRC', src.includes('RLLAB_REACT_SRC = '), '');
  /* 内联脚本里的 </script 必须被转义成 <\/script，否则浏览器会提前闭合这个 classic script */
  record('react19-src.js 里没有未转义的 </script', src.indexOf('</script') < 0, '');
}

const size = EXPECT.reduce((n, e) => n + e.size, 0);
console.log(`\nvendor 合计 ${size} B（约 ${(size / 1024).toFixed(0)} KB）`);
console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
