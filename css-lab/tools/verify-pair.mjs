/* verify-pair.mjs — 括号配对的纯逻辑校验，不起浏览器，秒级跑完。
 *
 * 用法：node tools/verify-pair.mjs
 * 覆盖：开括号补对 / 选区包裹 / 闭括号跳过 / Backspace 成对删除 /
 *       修饰键与输入法组合放行 / 引号与尖括号不插手 / 不修改入参。
 * 浏览器里的真实按键路径由 tools/verify-ui.mjs 验（含 CSS 页签里的花括号），这里只管判定逻辑。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
vm.runInThisContext(fs.readFileSync(path.join(root, 'assets/js/pair.js'), 'utf8'), { filename: 'pair.js' });
const P = globalThis.CSSLAB_pairs;

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  const detail = ok ? '' : `  — 期望 ${JSON.stringify(want)}，实际 ${JSON.stringify(got)}`;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail}`);
}

/* 敲键：返回判定结果的精简形态；null 表示「交给浏览器」 */
const type = (key, value, start, end, extra = {}) =>
  P.decide({ key, value, start, end: end == null ? start : end, ...extra });
const back = (value, start, end, extra = {}) =>
  P.decideBackspace({ key: 'Backspace', value, start, end: end == null ? start : end, ...extra });
const edit = (value, start, end) => ({ value, start, end });

/* ---------- 开括号 ---------- */
check('空文本敲 ( 补出 ()', type('(', '', 0), edit('()', 1, 1));
check('空文本敲 [ 补出 []', type('[', '', 0), edit('[]', 1, 1));
check('空文本敲 { 补出 {}', type('{', '', 0), edit('{}', 1, 1));
check('文本中间敲 ( 不吞掉后面的字', type('(', 'ab', 1), edit('a()b', 2, 2));
check('文末敲 ( 补在末尾', type('(', 'foo', 3), edit('foo()', 4, 4));
check('选中内容用括号包住', type('(', 'abc', 0, 3), edit('(abc)', 1, 4));
check('选中内容用花括号包住', type('{', 'abc', 0, 3), edit('{abc}', 1, 4));
check('CSS 里给选择器补花括号', type('{', 'p { color: red; }', 0, 17), edit('{p { color: red; }}', 1, 18));
check('多行选区也能包住', type('[', 'a\nb', 0, 3), edit('[a\nb]', 1, 4));
check('中文内容包住不影响', type('(', '数字', 0, 2), edit('(数字)', 1, 3));

/* ---------- 闭括号 ---------- */
check('闭括号正好在光标后：跳过不重复', type(')', '()', 1), edit('()', 2, 2));
check('闭方括号跳过', type(']', '[]', 1), edit('[]', 2, 2));
check('闭花括号跳过', type('}', '{}', 1), edit('{}', 2, 2));
check('嵌套时跳最内层', type(')', '(())', 2), edit('(())', 3, 3));
check('闭括号对不上：交给浏览器', type(']', '()', 1), null);
check('后面没有闭括号：交给浏览器', type(')', '', 0), null);
check('闭括号后面是别的字符：交给浏览器', type(')', '(a', 1), null);
check('有选区时敲闭括号：交给浏览器', type(')', '()', 0, 2), null);

/* ---------- HTML 页签：尖括号与标签闭合 ---------- */
const inHtml = (key, value, start, end, extra = {}) =>
  P.decide({ key, value, start, end: end == null ? start : end, html: true, ...extra });

check('HTML 页签敲 < 补出 <>', inHtml('<', '', 0), edit('<>', 1, 1));
check('HTML 页签敲 < 有选区时不插手', inHtml('<', '文字', 0, 2), null);
check('敲 > 跳过并补出闭标签', inHtml('>', '<p>', 2), edit('<p></p>', 3, 3));
check('带属性的开标签照样补闭标签', inHtml('>', '<div class="a">', 14), edit('<div class="a"></div>', 15, 15));
check('标签大小写照原样补', inHtml('>', '<DIV>', 4), edit('<DIV></DIV>', 5, 5));
check('空元素不补闭标签', inHtml('>', '<br>', 3), edit('<br>', 4, 4));
check('大小写混写的空元素也不补', inHtml('>', '<BR>', 3), edit('<BR>', 4, 4));
check('img 带属性不补闭标签', inHtml('>', '<img src="a.png">', 16), edit('<img src="a.png">', 17, 17));
check('闭标签不补', inHtml('>', '</p>', 3), edit('</p>', 4, 4));
check('DOCTYPE 不补', inHtml('>', '<!DOCTYPE html>', 14), edit('<!DOCTYPE html>', 15, 15));
check('注释不补', inHtml('>', '<!-- 备注 -->', 10), edit('<!-- 备注 -->', 11, 11));
check('后面已经有闭标签就不重复补', inHtml('>', '<p>\n</p>', 2), edit('<p>\n</p>', 3, 3));
check('后面有带空格的闭标签也不重复补', inHtml('>', '<p> </p>', 2), edit('<p> </p>', 3, 3));
check('后面是别的闭标签照补', inHtml('>', '<p></div>', 2), edit('<p></p></div>', 3, 3));
check('光标后不是 > 时交给浏览器', inHtml('>', '<p', 2), null);
check('光标夹在 > 与已有的闭标签之间：只跳过不重复补', inHtml('>', '<div></div>', 4), edit('<div></div>', 5, 5));
check('HTML 页签外的 > 完全不插手', type('>', '<p>', 2), null);
check('CSS 页签敲 < 不补（没有尖括号这回事）', type('<', '', 0, null, { html: false }), null);
check('JS 页签的 < 是小于号，不补', type('<', 'a ', 2, null, { html: false }), null);
check('HTML 页签里括号照样补', inHtml('(', '', 0), edit('()', 1, 1));
check('HTML 页签里花括号照样补', inHtml('{', 'x', 1), edit('x{}', 2, 2));

/* ---------- 不插手的输入 ---------- */
check('普通字符不插手', type('a', '', 0), null);
check('单引号不补', type("'", '', 0), null);
check('双引号不补（HTML 属性常用）', type('"', '<a href=', 8), null);
check('反引号不补', type('`', '', 0), null);
check('左尖括号在非 HTML 页签不补', type('<', '', 0), null);
check('右尖括号在非 HTML 页签不补', type('>', '<p', 2), null);
check('Enter 不插手', type('Enter', 'ab', 1), null);
check('Tab 不插手', type('Tab', 'ab', 1), null);
check('Process（输入法中继键）不插手', type('Process', 'ab', 1), null);
check('Ctrl+( 放行', type('(', '', 0, null, { ctrlKey: true }), null);
check('Alt+( 放行', type('(', '', 0, null, { altKey: true }), null);
check('Meta+( 放行', type('(', '', 0, null, { metaKey: true }), null);
check('输入法组合期间敲 ( 放行', type('(', '', 0, null, { composing: true }), null);
check('输入法组合期间敲 ) 也不跳', type(')', '()', 1, null, { composing: true }), null);

/* ---------- Backspace ---------- */
check('空括号中间 Backspace 删一对', back('()', 1), edit('', 0, 0));
check('空方括号同样', back('[]', 1), edit('', 0, 0));
check('空花括号同样', back('{}', 1), edit('', 0, 0));
check('括号里有内容时只删一个字', back('(a)', 2), null);
check('光标在闭括号之后照常删', back('(a)', 3), null);
check('跨行的一对括号不误删', back('(\n)', 2), null);
check('配不上对：交给浏览器', back('a)', 1), null);
check('有选区：交给浏览器', back('()', 0, 2), null);
check('文首：交给浏览器', back('()', 0), null);
check('输入法组合期间 Backspace 放行', back('()', 1, null, { composing: true }), null);
check('Ctrl+Backspace 放行', back('()', 1, null, { ctrlKey: true }), null);

/* ---------- 纯函数：不许改入参 ---------- */
{
  const st = { key: '(', value: 'ab', start: 1, end: 1 };
  P.decide(st);
  check('decide 不修改入参', st, { key: '(', value: 'ab', start: 1, end: 1 });
  const st2 = { key: 'Backspace', value: '()', start: 1, end: 1 };
  P.decideBackspace(st2);
  check('decideBackspace 不修改入参', st2, { key: 'Backspace', value: '()', start: 1, end: 1 });
}

console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
process.exit(failures === 0 ? 0 : 1);
