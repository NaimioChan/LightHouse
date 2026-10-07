# vendor/ — 入库的第三方产物

这里的东西**不要手改**，也不要让 git 动它们的换行（`.gitattributes` 里标了 `-text` 的文件保持原字节）。

| 文件 | 体积 | 来源 | 许可 |
|---|---|---|---|
| `typescript.js` | 9,111,680 B | npm `typescript@5.9.2` 的 `lib/typescript.js` | Apache-2.0（见 `LICENSE-TypeScript.txt`） |
| `libs-embed.js` | 3,216,375 B | 同一个包的 99 个 `lib.*.d.ts`，打成 `globalThis.TSLAB_LIB` | 同上 |
| `diag-zh.js` | ~300 KB | 同一个包的 `lib/zh-cn/diagnosticMessages.generated.json`，打成 `globalThis.TSLAB_DIAG_ZH` | 同上 |

重新生成（版本升级时）：

```bash
export HTTPS_PROXY=http://127.0.0.1:7897      # 直连 npm 会失败
npm pack typescript@5.9.2 && tar xzf typescript-5.9.2.tgz
node tools/build-vendor.mjs ./package
```

为什么要打成文本包：`file://` 下父页面的 `fetch`/`XHR` 读本地文件全部失败，沙箱 iframe 里 `<script src>`
也一律 `onerror`。`.d.ts` 只能以字符串形式内联，编译器再按文件名从这张表里取。

为什么中文诊断是单独一个可选文件：它只是一个 JSON，加载失败不影响判题（`judge.js` 里降级处理），
但成功之后所有类型错误都是中文，对学习者差别很大。

体积的代价（本机实测，headless Edge + `file://`）：`typescript.js` classic 加载 150–250 ms
（V8 惰性解析，不进首屏关键路径），首个 Program 约 240 ms（可 `requestIdleCallback` 预热摊掉），
之后每次判题 2–8 ms（lib 的 SourceFile 跨 Program 复用 + `oldProgram` 增量）。
