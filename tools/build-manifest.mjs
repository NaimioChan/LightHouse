/* build-manifest.mjs — 生成入口页用的清单 assets/js/manifest.js。
 *
 * 数字不许手写：章节、练习、示例、断言条数一律从各训练场自己的 content/*.js 里读出来，
 * 与 tools/labs.json 里的文字（标题、简介、前置、颜色令牌名）合并成一份 JS 清单。
 * 入口页只读这份清单渲染，四个训练场互不依赖。
 *
 * 用法：
 *   node tools/build-manifest.mjs                 # 写入 assets/js/manifest.js
 *   node tools/build-manifest.mjs --out <file>    # 写到别处（verify-manifest.mjs 用它做逐字节比对）
 *   node tools/build-manifest.mjs --quiet
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 读一个训练场的一个内容文件，返回它注册的那一章 */
function readChapter(file, registry) {
  const ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  const list = ctx[registry];
  if (!Array.isArray(list) || list.length !== 1) {
    throw new Error(`${path.basename(file)} 注册到 ${registry} 的章节数不对：${Array.isArray(list) ? list.length : typeof list}`);
  }
  return list[0];
}

export function build() {
  const labs = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'labs.json'), 'utf8'));
  return labs.map((lab) => {
    const dir = path.join(ROOT, lab.dir);
    const files = fs.readdirSync(path.join(dir, 'content')).filter((f) => f.endsWith('.js')).sort();
    if (!files.length) throw new Error(`${lab.dir}/content 里没有内容文件`);

    const chapters = files.map((f) => {
      const ch = readChapter(path.join(dir, 'content', f), lab.registry);
      const secs = ch.sections || [];
      return {
        id: ch.id,
        title: ch.title,
        file: f,
        exercises: secs.filter((s) => s.kind === 'exercise').map((s) => s.id),
        examples: secs.filter((s) => s.kind === 'code' || s.kind === 'demo').length,
        tests: secs.filter((s) => s.kind === 'exercise').reduce((n, s) => n + (s.tests || []).length, 0),
      };
    });

    const dup = chapters.map((c) => c.id).filter((id, i, a) => a.indexOf(id) !== i);
    if (dup.length) throw new Error(`${lab.dir} 章节 id 重复：${dup.join(', ')}`);
    const missing = chapters.filter((c) => !c.exercises.length);
    if (missing.length) throw new Error(`${lab.dir} 这些章没有练习：${missing.map((c) => c.id).join(', ')}`);

    return {
      key: lab.key,
      dir: lab.dir,
      title: lab.title,
      entry: lab.entry,
      progressKey: lab.progressKey,
      accentToken: lab.accentToken,
      prereq: lab.prereq,
      want: lab.want,
      blurb: lab.blurb,
      learn: lab.learn,
      note: lab.note,
      stats: {
        chapters: chapters.length,
        exercises: chapters.reduce((n, c) => n + c.exercises.length, 0),
        examples: chapters.reduce((n, c) => n + c.examples, 0),
        tests: chapters.reduce((n, c) => n + c.tests, 0),
      },
      chapters: chapters.map((c) => ({ id: c.id, title: c.title, exercises: c.exercises })),
    };
  });
}

export function render(labs) {
  const body = JSON.stringify(labs, null, 2).split('\n').map((l) => '  ' + l).join('\n').trim();
  return [
    '/* assets/js/manifest.js — 自动生成，不要手改：node tools/build-manifest.mjs',
    ' * 来源：tools/labs.json（文字）+ 各训练场 content/*.js（章节、练习 id、数量）。',
    ' * 校验：node tools/verify-manifest.mjs 会重新生成一次，与本文件逐字节比对。 */',
    "(function (root) {",
    '  root.LIGHTHOUSE_LABS = ' + body.replace(/^\s+/, '') + ';',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ].join('\n');
}

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : dflt;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const out = path.resolve(ROOT, arg('--out', path.join('assets', 'js', 'manifest.js')));
  const labs = build();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, render(labs));
  if (!process.argv.includes('--quiet')) {
    for (const l of labs) {
      console.log(`${l.title.padEnd(20, ' ')} ${String(l.stats.chapters).padStart(2)} 章 · ` +
        `${String(l.stats.exercises).padStart(2)} 练习 · ${String(l.stats.examples).padStart(2)} 示例 · ` +
        `${String(l.stats.tests).padStart(3)} 断言　→ ${l.entry}`);
    }
    const t = labs.reduce((a, l) => ({
      chapters: a.chapters + l.stats.chapters,
      exercises: a.exercises + l.stats.exercises,
      examples: a.examples + l.stats.examples,
    }), { chapters: 0, exercises: 0, examples: 0 });
    console.log(`\n合计 ${t.chapters} 章 · ${t.exercises} 个练习 · ${t.examples} 个示例（写入 ${path.relative(ROOT, out)}）`);
  }
}
