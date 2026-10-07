/* verify-judge.mjs — 判题内核自己的单测（秒级，不需要浏览器）。
 *
 * 内容里的断言全靠这几个辅助，它们的行为一旦漂了，全站判题跟着漂。这里把每条规则钉住：
 * 等价的定义（含 any 与 unknown 必须分开）、字面量拓宽、用严格版分得开、
 * 诊断辅助（错误码、行号）、期望类型写错时要报出来而不是静默判过、
 * 运行器（await run() / eqLogs）与模块语法的拒绝。
 *
 * 用法：node tools/verify-judge.mjs
 */
import { bootJudge } from './lib/env.mjs';
import { makeExec } from './lib/node-exec.mjs';

const JUDGE = bootJudge();
const exec = makeExec();
await JUDGE.ready();

let n = 0, bad = 0;

function ok(cond, what, extra) {
  n++;
  if (!cond) { bad++; console.log('  ✗ ' + what + (extra ? '  →  ' + extra : '')); }
}

/** 断言这一组 tests 全过 */
async function passes(what, code, tests, opts) {
  const res = await JUDGE.runCase(code, Object.assign({ tests, exec }, opts || {}));
  const failed = res.results.filter((r) => r.pass === false);
  ok(!res.error && failed.length === 0, what,
    res.error ? res.error.message : failed.map((f) => f.label + ' → ' + f.message).join('；'));
  return res;
}

/** 断言至少一条断言挂，且失败信息里包含 expect 片段 */
async function fails(what, code, tests, expectText, opts) {
  const res = await JUDGE.runCase(code, Object.assign({ tests, exec }, opts || {}));
  const failed = res.results.filter((r) => r.pass === false);
  const msg = res.error ? res.error.message : (failed[0] ? failed[0].message : '');
  ok(!res.error && failed.length >= 1 && (!expectText || msg.indexOf(expectText) >= 0), what,
    res.error ? '抛错：' + res.error.message : '实际信息：' + (msg || '（没有失败）'));
}

/* ---------- 等价与字面量 ---------- */
await passes('eqType 把字面量与宽类型视为同类', 'let s = \'a\';\nconst c = \'a\';',
  ['eqType(\'s\', \'string\')', 'eqType(\'c\', \'string\')']);
await passes('eqTypeExact 能分辨 const 的字面量类型', 'const c = \'a\';\nlet s = \'a\';',
  ['eqTypeExact(\'c\', \'"a"\')', 'eqTypeExact(\'s\', \'string\')']);
await fails('eqTypeExact 抓到 let 少了字面量', 'let s = \'a\';', ['eqTypeExact(\'s\', \'"a"\')'], '期望 "a"，实际 string');
await fails('eqType 抓到类型不对（报期望与实际）', 'let s = 1;', ['eqType(\'s\', \'string\')'], '期望 string，实际 number');
await fails('eqType 不允许用 any 蒙过去', 'const v: any = 1;', ['eqType(\'v\', \'unknown\')'], '期望 unknown，实际 any');
await passes('unknown 就是 unknown', 'const v: unknown = 1;', ['eqType(\'v\', \'unknown\')']);

/* ---------- any 藏在里面也要抓出来（写内容时实测踩到的坑） ---------- */
await fails('any[] 不能冒充 string[]', 'const tags: any[] = [1];', ['eqType(\'tags\', \'string[]\')'], '期望 string[]，实际 any[]');
await fails('对象里的 any 不能冒充具体类型', 'const o: { a: any } = { a: 1 };', ['eqType(\'o\', \'{ a: number }\')'], '期望 { a: number }，实际 { a: any; }');
await fails('Promise<any> 不能冒充 Promise<string>', 'const p: Promise<any> = Promise.resolve(1);', ['eqType(\'p\', \'Promise<string>\')'], '实际 Promise<any>');
await fails('参数是 any 的函数不能被当成具体签名', 'const f: (x: any) => void = function () {};', ['eqType(\'f\', \'(x: string) => void\')'], '实际 (x: any) => void');
await passes('两边都是 any 时仍然等价', 'const a: any = 1;\nconst b: any[] = [];', ['eqType(\'a\', \'any\')', 'eqType(\'b\', \'any[]\')']);
await passes('Array<number> 与 number[] 仍视为同一类型', 'const n = [1, 2];', ['eqType(\'n\', \'number[]\')', 'eqType(\'n\', \'Array<number>\')']);
await passes('字面量数组与 number[] 仍等价', 'const n = [1, 2, 3];', ['eqType(\'n\', \'number[]\')']);
await passes('数组与对象类型能比', 'const a = [1, 2];\nconst o = { x: 1, y: \'k\' };',
  ['eqType(\'a\', \'number[]\')', 'eqType(\'a\', \'Array<number>\')', 'eqType(\'o\', \'{ x: number; y: string }\')']);
await passes('联合类型与元组能比', 'let u: \'a\' | \'b\' = \'a\';\nconst t: [number, string] = [1, \'x\'];',
  ['eqType(\'u\', \'"a" | "b"\')', 'eqType(\'t\', \'[number, string]\')']);
await passes('函数类型按签名比（参数名无关）', 'function add(a: number, b: number): number { return a + b; }',
  ['eqType(\'add\', \'(x: number, y: number) => number\')']);
await passes('属性路径取值', 'interface P { a: number; b: { c: string } }\nconst p: P = { a: 1, b: { c: \'x\' } };',
  ['eqType(\'p.a\', \'number\')', 'eqType(\'p.b.c\', \'string\')']);

/* ---------- 赋值方向 ---------- */
await passes('assignableTo / notAssignableTo 的方向', 'let s = \'a\';\nlet u: number | string = 1;',
  ['assignableTo(\'s\', \'string | number\')', 'notAssignableTo(\'u\', \'string\')']);
await fails('assignableTo 方向反了要报出来', 'let s = \'a\';', ['assignableTo(\'s\', \'number\')'], '能赋值给 number');

/* ---------- 诊断 ---------- */
await passes('noErrors / countErrors', 'const n: number = 1;', ['noErrors()', 'countErrors(0)']);
await passes('hasError 认错误码（数字与 TS 前缀都行）', 'const n: number = \'x\';',
  ['hasError(2322)', 'hasError(\'TS2322\')', 'countErrors(1)']);
await fails('hasError 抓不到时要说清实际有哪些错', 'const n: number = 1;', ['hasError(2322)'], '没有任何错误');
await passes('notError / errorAt / noErrorAt', 'const n: number = \'x\';\nconst ok2: string = \'y\';',
  ['notError(2345)', 'errorAt(1, 2322)', 'noErrorAt(2)', 'errorAt(1)']);
await fails('errorAt 行号不对要报出来', 'const n: number = 1;', ['errorAt(1, 2322)'], '实际那里没有错误');
await passes('strict 下的隐式 any（tsconfig 覆盖生效）', 'function f(x) { return x; }',
  ['hasError(7006)'], {});
await passes('关掉 strict 后隐式 any 不再报', 'function f(x) { return x; }',
  ['noErrors()'], { tsconfig: { strict: false } });
await passes('tsconfig 能改 target（编译产物跟着变）', 'const f = async () => 1;',
  ['noErrors()'], { tsconfig: { target: 'ES5' } });

/* ---------- 名字与提示 ---------- */
await fails('找不到名字时提示要说清怎么取名', 'const a = 1;', ['eqType(\'b\', \'number\')'], '找不到名字 b');
await passes('memberNames 列出属性', 'interface P { b: number; a: string }\nconst p = {} as P;',
  ['eq(memberNames(\'p\').join(\',\'), \'a,b\')']);
await passes('type() 直接给出类型字符串', 'const s = \'x\';\nlet wide = \'x\';\nconst n = 1;',
  ['eq(type(\'s\'), \'"x"\')', 'eq(type(\'wide\'), \'string\')', 'eq(type(\'n\'), \'1\')']);
await passes('exists 与 ok 组合', 'let s = \'x\';', ['exists(\'s\')', 'ok(type(\'s\').indexOf(\'str\') === 0)']);

/* ---------- 运行 ---------- */
await passes('await run() + eqLogs', 'console.log(\'a\');\nconsole.log(1, true);', ['await run();', 'eqLogs([\'a\', \'1 true\'])']);
await passes('jsHas / notJsHas 能断言编译产物本身', 'interface P { a: number }\nconst p: P = { a: 1 };\nconst n: number = 2;',
  ['notJsHas(\'interface P\', \'接口在产物里应当消失\')', 'notJsHas(\': number\', \'注解应当消失\')', 'jsHas(\'const p = { a: 1 };\')', 'ok(js().indexOf(\'const n = 2\') >= 0, js())']);
await fails('notJsHas 抓得住「产物里还留着」', 'enum E { A }\nconst e = E.A;', ['notJsHas(\'var E\', \'枚举对象会留在产物里\')'], '不该出现');
await passes('类静态成员也能走点号路径', 'class Counter { static total: number = 0; n = 1; }\nconst c = new Counter();',
  ['eqType(\'Counter.total\', \'number\')', 'eqType(\'c.n\', \'number\')']);
await passes('枚举的 memberNames 给的是成员本身', 'enum Dir { Up = \'up\', Down = \'down\' }\nconst d: Dir = Dir.Up;',
  ['eq(memberNames(\'d\'), [\'Down\', \'Up\'])']);
await fails('eqLogs 抓输出不一致', 'console.log(\'a\');', ['await run();', 'eqLogs([\'b\'])'], '期望输出 ["b"]，实际 ["a"]');
await passes('run() 里对象与数组的格式化', 'console.log({ a: 1, b: [1, \'x\'] });',
  ['await run();', 'eqLogs([\'{ a: 1, b: [ 1, \\\'x\\\' ] }\'])']);
await passes('编译产物里的类型被擦掉（enum 运行时还在）', 'enum E { A, B }\nconsole.log(E.B);',
  ['await run();', 'eqLogs([\'1\'])']);
await passes('编译产物带模块语法时给出可读的错', 'export const a = 1;',
  ['var r = await run(); ok(!!r.error, \'应当报错\'); ok(r.error.message.indexOf(\'模块语法\') >= 0, r.error.message)']);
await passes('死循环会被掐掉（2 秒预算）', 'while (true) {}',
  ['var r = await run(); ok(!!r.error, \'要求报错\');'], { timeoutMs: 2000 });

/* ---------- 内容写错要报出来，不能静默判过 ---------- */
{
  const res = await JUDGE.runCase('const a = 1;', { tests: ['eqType(\'a\', \'这不是一个类型@\')'], exec });
  ok(!!res.error && res.error.message.indexOf('期望类型') >= 0, '期望类型写错时必须抛错', JSON.stringify(res.error));
  const res2 = await JUDGE.runCase('const a = 1;', { tests: ['eqType(\'a\', type(\'b\'))'], exec });
  ok(!!res2.error && res2.error.message.indexOf('单引号字符串字面量') >= 0, '期望类型不是字面量时要报出来', JSON.stringify(res2.error));
}

/* ---------- 增量复用不能串味 ---------- */
{
  const a = await JUDGE.runCase('const x: number = \'no\';', { tests: ['hasError(2322)'], exec });
  const b = await JUDGE.runCase('const x: string = \'ok\';', { tests: ['noErrors()'], exec });
  const c = await JUDGE.runCase('const y = 1;', { tests: ['countErrors(0)', 'eqType(\'y\', \'number\')'], exec });
  ok(a.results[0].pass === true && b.results[0].pass === true && c.results[0].pass === true,
    '连着判不同代码，增量复用不许把上一份的诊断带过来');
}

console.log((bad ? '✗ ' : '✓ ') + (n - bad) + '/' + n + ' 项通过' + (bad ? '（' + bad + ' 项失败）' : ''));
process.exit(bad ? 1 : 0);
