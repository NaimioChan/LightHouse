/* verify-quit.mjs — 证明「关掉浏览器页面 → serve.py 自己退出 → 终端窗口跟着关」。
 *
 * 用纯 HTTP 客户端扮演浏览器：挂着 SSE 长连接 = 页面开着；断开 = 页面关了。
 * 覆盖四个场景：页面活着不退 / 刷新（短断开）不误杀 / 全断开后退出 / 退出后端口能立刻复用。
 *
 * 用法：node tools/verify-quit.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.VUELAB_QUIT_PORT || 8896);
const BASE = `http://127.0.0.1:${PORT}`;
const GRACE = 4; // 测试里把宽限期压到 4 秒

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;

function record(name, pass, detail = '') {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

function startServer() {
  return spawn('python', ['serve.py'], {
    cwd: root,
    env: { ...process.env, VUELAB_NO_OPEN: '1', VUELAB_KEEP: '', VUELAB_PORT: String(PORT), VUELAB_IDLE_GRACE: String(GRACE) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitUp(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(BASE + '/index.html');
      if (r.ok) return true;
    } catch {}
    await sleep(150);
  }
  return false;
}

/** 扮演一个开着的浏览器页面：挂住 SSE 长连接 */
function openPage() {
  const ctl = new AbortController();
  let chunks = 0;
  const drained = fetch(BASE + '/__alive', { signal: ctl.signal })
    .then(async (res) => {
      if (!/text\/event-stream/.test(res.headers.get('content-type') || '')) throw new Error('不是 SSE：' + res.headers.get('content-type'));
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks += 1;
      }
    })
    .catch(() => {});
  return {
    close: () => { ctl.abort(); return drained; },
    get chunks() { return chunks; },
  };
}

async function waitExit(proc, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) return proc.exitCode;
    await sleep(200);
  }
  return null;
}

async function main() {
  const proc = startServer();
  let out = '';
  proc.stdout.on('data', (d) => { out += String(d); });
  proc.stderr.on('data', (d) => { out += String(d); });

  if (!(await waitUp())) throw new Error('serve.py 没起来：' + out);
  record('serve.py 起服务并打印地址', /http:\/\/127\.0\.0\.1:\d+\/index\.html/.test(out), out.trim().split('\n')[0] || '');

  /* --- 场景 1：页面开着不能退 --- */
  const page1 = openPage();
  await sleep(2500);
  record('页面开着时不退出', proc.exitCode === null, `exitCode=${proc.exitCode}`);
  record('SSE 端点在持续推心跳', page1.chunks >= 1, `${page1.chunks} 个心跳块`);

  /* --- 场景 2：刷新（断开一小会儿再连上）不能误杀 --- */
  await page1.close();
  await sleep(Math.round(GRACE * 0.5 * 1000));
  const page2 = openPage();
  await sleep((GRACE + 2) * 1000);
  record('刷新式的短暂断开不误杀', proc.exitCode === null, `exitCode=${proc.exitCode}`);

  /* --- 场景 3：最后一个页面关掉 → 自己退出 --- */
  await page2.close();
  const code = await waitExit(proc, (GRACE + 12) * 1000);
  record('最后一个页面关掉后自己退出', code === 0, `退出码 ${code}，终端会跟着关闭`);
  record('退出时打印了原因', /页面已关闭/.test(out), (out.trim().split('\n').pop() || '').slice(0, 60));

  /* --- 场景 4：退出后端口能立刻复用（Windows 上没有 TIME_WAIT 卡死） --- */
  const again = startServer();
  let out2 = '';
  again.stdout.on('data', (d) => { out2 += String(d); });
  const up = await waitUp(6000);
  record('退出后端口可立即复用（同端口重启）', up && out2.includes(':' + PORT + '/index.html'), out2.trim().split('\n')[0] || '没起来');

  const page3 = openPage();
  await sleep(1500);
  await page3.close();
  await waitExit(again, (GRACE + 12) * 1000);
  try { again.kill(); } catch {}
}

main()
  .catch((e) => record('验收流程', false, e.stack || e.message))
  .finally(async () => {
    console.log(`\n${failures === 0 ? '✓ 全部通过' : '✗ ' + failures + ' 项失败'}`);
    await sleep(200);
    process.exit(failures === 0 ? 0 : 1);
  });
