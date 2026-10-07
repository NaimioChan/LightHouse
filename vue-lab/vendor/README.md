# vendor/ — 入库的第三方产物

这里的东西**不要手改**，也不要让 git 动它们的换行（`.gitattributes` 里标了 `-text`，保持原字节）。
改一个字节就要重跑 `tools/verify-vendor.mjs` 并更新下表的 sha256。

| 文件 | 字节 | sha256（前 16） | 来源 | 许可 |
|---|---|---|---|---|
| `vue.global.prod.js` | 168,331 | `b72394052eef1eed` | `vue@3.5.43` 的 `/dist/vue.global.prod.js` | MIT |
| `vue-sfc-compiler.js` | 803,660 | `dba5458961206354` | `@vue/compiler-sfc@3.5.43` 的 `/dist/compiler-sfc.esm-browser.js`，经 esbuild 打成 IIFE | MIT |
| `LICENSE-Vue.txt` | — | — | 同一个包的 LICENSE | MIT |

合计 971,991 B（约 950 KB）。

## 重新生成

```bash
export HTTPS_PROXY=http://127.0.0.1:7897      # 直连 npm / jsdelivr 会失败

curl -sL -o vue.global.prod.js \
  https://cdn.jsdelivr.net/npm/vue@3.5.43/dist/vue.global.prod.js

curl -sL -o compiler-sfc.esm-browser.js \
  https://cdn.jsdelivr.net/npm/@vue/compiler-sfc@3.5.43/dist/compiler-sfc.esm-browser.js

# entry.js 只有一行（必须是相对路径：没装这个包时 esbuild 解析不了裸名）：
#   export * from './compiler-sfc.esm-browser.js';
npx --yes esbuild@0.25.10 entry.js --bundle --format=iife \
  --global-name=VueSFC --minify --outfile=vue-sfc-compiler.js   # → 803,660 B，耗时约 110 ms
```

生成完把 `compiler-sfc.esm-browser.js` 与 `entry.js` 删掉，只留三个产物入库。
测一下压缩字节数没变（`node tools/verify-vendor.mjs`）。

## 为什么要在沙箱里重新求值，而不是 `<script src>`

`file://` 下父页面的 `fetch` / `XHR` 读本地文件全部失败，`sandbox="allow-scripts"` 的 iframe 里
`<script src>` 加载本地 js 一律 onerror。所以两个产物都只能以**文本**形式在父页面读出，
postMessage 送进沙箱，在沙箱里 `eval` 出来。

## 两个产物的求值方式与普通脚本不同（踩过的坑）

`vue.global.prod.js` 的头尾是 `var Vue=function(e){...}({})`，
`vue-sfc-compiler.js` 是 `var VueSFC=(()=>{...})()`。两者都是**变量声明**，
`eval(src)` 之后**不会自动挂到 `window` 上**——父页面里它们靠 `var` 在全局作用域生效，
但 `(0, eval)(src)` 是间接求值、作用域在全局，变量名成了脚本作用域的一部分，
`window.Vue` 依然是 `undefined`。

正解：求值后显式补一句赋值。

```js
(0, eval)(vueSrc + ';window.Vue = Vue;');
(0, eval)(sfcSrc + ';window.VueSFC = VueSFC;');
```

实测症状：`hasVue:false, hasSFC:false`，随后 `Cannot read properties of undefined (reading 'parse')`。

## 体积的代价（本机实测，headless Edge）

| 步 | 耗时 |
|---|---|
| esbuild 打包 compiler-sfc | 112 ms（构建期，一次性） |
| 沙箱内 eval 两个产物 | 100 ms 上下 |
| `compileScript`（`inlineTemplate: true`，含模板编译） | 29.8 ms |
| 挂载 + `nextTick` 后读 DOM | 数毫秒 |

每次自动运行都会重建 iframe，所以上面这几项是每轮的固定开销；相对「停手一秒自动运行」可以忽略。

更细的探针结论（三处改写各自的必要性、写内核时反引号的坑）记在
`docs/02-compile-model.md`，改 `assets/js/compile.js` 前先读那一页。
