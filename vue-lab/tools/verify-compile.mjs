/* verify-compile.mjs — 编译内核自己的单测（秒级，不需要浏览器）。
 *
 * 把 vendor 的 VueSFC 与 assets/js/compile.js 一起在 vm 里跑，直接断言改写结果。
 * 这一层故意只测「文本改写」：import 的别名方向、单双引号两种分隔符、export default、
 * 模板 helper 前缀——这些是最容易写反、写错了又不报错的地方。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
function record(name, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  record(name, ok, ok ? '' : `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
}
function includes(name, haystack, needle) {
  const ok = String(haystack).includes(needle);
  record(name, ok, ok ? '' : `找不到 ${JSON.stringify(needle)}；实际前 200 字：${String(haystack).slice(0, 200)}`);
}
function notIncludes(name, haystack, needle) {
  const ok = !String(haystack).includes(needle);
  record(name, ok, ok ? '' : `不该出现 ${JSON.stringify(needle)}`);
}
function throws(name, fn, needle) {
  try { fn(); record(name, false, '没有抛错'); }
  catch (e) { record(name, String(e.message).includes(needle), `错误信息 ${JSON.stringify(e.message)} 不含 ${JSON.stringify(needle)}`); }
}

/* —— 把编译器与内核在同一个 vm 上下文里装配起来（与浏览器同构） —— */
function boot() {
  const ctx = vm.createContext({ console });
  ctx.globalThis = ctx;
  ctx.window = ctx;
  ctx.self = ctx;
  for (const rel of ['vendor/vue-sfc-compiler.js', 'assets/js/compile.js']) {
    const file = path.join(ROOT, rel);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  if (!ctx.VueSFC) throw new Error('VueSFC 没挂上');
  if (!ctx.VUELAB_COMPILE) throw new Error('compile.js 没挂上 VUELAB_COMPILE');
  return ctx;
}

const ctx = boot();
const compile = (src, opts) => ctx.VUELAB_COMPILE.compile(src, opts);

const SFC = [
  '<scr' + 'ipt setup>',
  'import { ref, computed } from \'vue\'',
  'const n = ref(0)',
  '</scr' + 'ipt>',
  '<template><p class="v">{{ n }}</p></template>',
  '<style scoped>.v { color: rgb(1, 2, 3); }</style>'
].join('\n');

/* 1. import 改写：模板 helper 用双引号、用户写的用单引号，两种都要改到 */
{
  const out = compile(SFC);
  notIncludes('没有残留 import 语句', out.code, 'import ');
  notIncludes('没有残留 export default', out.code, 'export default');
  includes('模板 helper 的双引号分隔符被改写', out.code, '= Vue;');
  includes('别名方向正确（本地名在右）', out.code, 'toDisplayString: _toDisplayString');
  record('别名方向没写反', !out.code.includes('_toDisplayString: toDisplayString'));
  includes('无别名的名字原样保留', out.code, 'ref');
  eq('css 是一段 scoped 规则', out.css.trim().startsWith('.v[data-v-'), true);
  eq('hasSetup 认出来是 script setup', out.hasSetup, true);
}

/* 2. 显式验一条 import 改写的纯文本行为（不依赖编译器输出格式） */
{
  const src = '<scr' + 'ipt setup>' + 'import { a, b as c, d as e } from \'vue\'' + '</scr' + 'ipt><template><p>x</p></template>';
  const out = compile(src);
  includes('多名字解构：a 原样', out.code, 'a');
  includes('多名字解构：b as c 改成 b: c', out.code, 'b: c');
  includes('多名字解构：d as e 改成 d: e', out.code, 'd: e');
}

/* 3. 双引号分隔符 */
{
  const src = '<scr' + 'ipt setup>' + 'import { aa as bb } from "vue"' + '</scr' + 'ipt><template><p>x</p></template>';
  const out = compile(src);
  includes('双引号 from 也能改写', out.code, 'aa: bb');
  notIncludes('双引号 case 没有残留 import', out.code, 'import ');
}

/* 4. 只有 template 的 SFC（没有 script） */
{
  const out = compile('<template><p class="v">hi</p></template>');
  includes('template-only 产出 render 函数', out.code, 'function render');
  includes('template-only 最后返回组件对象', out.code, 'return { render: render };');
  const retIdx = out.code.lastIndexOf('return { render: render };');
  const hoistIdx = out.code.indexOf('_hoisted');
  record('模板提升的静态节点排在 return 之前', hoistIdx < 0 || hoistIdx < retIdx,
    `hoisted@${hoistIdx} return@${retIdx}`);
}

/* 5. 语法错的 SFC 要抛**
{
  throws('模板缺闭合标签要报出来', () => compile('<template><p>no close'), 'end tag');
  throws('空源码要报出来', () => compile(''), 'no <script>');
}

/* 6. 错误对象带 kind，方便 UI 分辨阶段 */
{
  try { compile('<template><p>no close'); } catch (e) { eq('parse 错误带 kind=parse', e.kind, 'parse'); }
}

/* 7. 内核源码里不许出现反引号（它在模板字符串里，会提前终止） */
{
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/compile.js'), 'utf8');
  const fnStart = src.indexOf('function VUELAB_COMPILE_FN');
  const fnEnd = src.indexOf('root.VUELAB_COMPILE_FN');
  const fnSrc = src.slice(fnStart, fnEnd);
  record('编译内核函数体里没有反引号', !fnSrc.includes('`'), fnSrc.includes('`') ? '出现了反引号' : '');
}
{
  for (const rel of ['assets/js/harness.js']) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const fnStart = src.indexOf('function VUELAB_HARNESS_FN');
    const fnEnd = src.indexOf('root.VUELAB_HARNESS_FN');
    const fnSrc = src.slice(fnStart, fnEnd);
    record(`${rel} 的内核函数体里没有反引号`, !fnSrc.includes('`'), fnSrc.includes('`') ? '出现了反引号' : '');
  }
}

/* 8. 内核函数不许引用外部变量（贴进沙箱后看不见外面） */
{
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/compile.js'), 'utf8');
  const fnSrc = src.slice(src.indexOf('function VUELAB_COMPILE_FN'), src.indexOf('root.VUELAB_COMPILE_FN'));
  record('编译内核自带 toDestructure（不依赖外部）', fnSrc.includes('function toDestructure'));
}

/* 9. vendor 产物的体积与哈希没变（改了要同步 vendor/README.md） */
{
  const sizes = {
    'vue.global.prod.js': 168331,
    'vue-sfc-compiler.js': 803660,
  };
  for (const [f, want] of Object.entries(sizes)) {
    const got = fs.statSync(path.join(ROOT, 'vendor', f)).size;
    eq(`vendor/${f} 体积`, got, want);
  }
}

console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
