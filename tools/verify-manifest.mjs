/* verify-manifest.mjs — 清单与事实对账：重算一遍 manifest，与提交的逐字节比，再查几件清单管不到的事。
 *
 * 入口页上的每一个数字都来自 assets/js/manifest.js。它既然是生成的，就必须与内容同步：
 * 改了某一章的内容却忘了重跑生成器，这里会当场报出来（不是「大概不一致」，是逐字节比对）。
 *
 * 用法：node tools/verify-manifest.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, cacheDir, reporter } from './lib/cdp.mjs';
import { build, render } from './build-manifest.mjs';

const { record, finish } = reporter();
const CACHE = cacheDir();
const committed = path.join(ROOT, 'assets', 'js', 'manifest.js');

let labs;
try {
  labs = build();
} catch (e) {
  record('清单能从内容里重新生成', false, e.message);
  process.exit(finish());
}
record('清单能从内容里重新生成', true, `${labs.length} 座训练场`);

const fresh = render(labs);
const freshPath = path.join(CACHE, 'manifest.js');
fs.writeFileSync(freshPath, fresh);

const onDisk = fs.existsSync(committed) ? fs.readFileSync(committed, 'utf8') : '';
record('assets/js/manifest.js 与内容逐字节一致', onDisk === fresh,
  onDisk === fresh ? `${onDisk.length} 字节` : `磁盘 ${onDisk.length} 字节 / 重算 ${fresh.length} 字节 —— 跑 node tools/build-manifest.mjs`);

const css = fs.readFileSync(path.join(ROOT, 'assets', 'css', 'portal.css'), 'utf8');
const design = fs.readFileSync(path.join(ROOT, 'DESIGN.md'), 'utf8');

for (const lab of labs) {
  record(`${lab.title} 入口文件存在`, fs.existsSync(path.join(ROOT, lab.entry)), lab.entry);
  record(`${lab.title} 颜色令牌在 portal.css 与 DESIGN.md 里都有`,
    css.includes(`--${lab.accentToken}:`) && css.includes(`--${lab.accentToken}-strong:`) && design.includes(`${lab.accentToken}:`),
    lab.accentToken);
  record(`${lab.title} 进度键与各站源码一致`,
    fs.readFileSync(path.join(ROOT, lab.dir, 'assets', 'js', 'app.js'), 'utf8').includes(`'${lab.progressKey}'`),
    lab.progressKey);
}

const keys = labs.map((l) => l.progressKey);
record(`${labs.length} 座训练场的进度键互不重复`, new Set(keys).size === keys.length, keys.join(' / '));

/* 入口页不许写死任何一座站：加站、改名都不该动 index.html。
   这条同时挡住「前端/四个」这类限定——演练场不止这四个，也不止前端。 */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const lab of labs) {
  record(`index.html 里没有写死「${lab.title}」`, !html.includes(lab.title));
  record(`index.html 里没有写死目录名 ${lab.dir}`, !html.includes(lab.dir));
  record(`index.html 里没有写死的「${lab.stats.chapters} 章」`, !html.includes(`${lab.stats.chapters} 章`));
}
record('index.html 里没有「前端 / 四个 / 四座」这类限定词',
  !/前端|四个|四座/.test(html.replace(/<!--[\s\S]*?-->/g, '')), '入口页对演练场的数量与领域保持中立');

const total = labs.reduce((a, l) => a + l.stats.exercises, 0);
record('练习总数合理（>0 且各站都有练习）', total > 0 && labs.every((l) => l.stats.exercises > 0), `${total} 个`);

/* 根 serve.py 的站名识别表必须来自清单，不许写死某一批站 */
const serve = fs.readFileSync(path.join(ROOT, 'serve.py'), 'utf8');
record('serve.py 的站名识别从 tools/labs.json 读（不写死）',
  /labs\.json/.test(serve) && !/\('(html5-lab|css-lab|js-lab|ts-lab)'/.test(serve));

process.exit(finish());
