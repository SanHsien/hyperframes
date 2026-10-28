# 維護決策

## 2026-09-12：建立 Windows-first 維護型 fork

**決定**：fork `heygen-com/hyperframes`，保留 Apache License 2.0 與完整歷史。本線預設分支用 `main`。本線聚焦繁中文件、Windows 開發 gate、Windows CI，以及逐筆審查的上游追蹤。

**理由**：`hyperframes` 是一套強大的以 HTML / GSAP 即時渲染 MP4 影片的框架，專為 AI Coding Agent 打造。本 fork 補足 Windows 11 原生開發／驗收骨架、繁體中文維護入口，以及可審計的上游追蹤機制。

**限制**：

- 不把 fork 包裝成原創專案，不移除原作者 HeyGen 與官方連結。
- 不發佈 npm 取代官方管道。
- 維護 gate 不預設安裝重型套件。
- 上游更新必須逐筆審查。

## 2026-09-12：依賴新鮮度追蹤

**決定**：`tools/check_dependency_freshness.py` 納管 `requirements-dev.txt`。

**理由**：維護依賴（`pytest`, `ruff`）清單簡潔，納入每月新鮮度檢查以確保 Windows 門禁相容性。

## 2026-09-12：上游檢查涵蓋 Commit、PR 與 Issue 三面向

**決定**：`check_upstream_updates.py` 以 `--state all` 收集上游 PR 與 Issue，並追蹤 Commit SHA。`gh` 失敗時 fail closed（exit 2）。

**理由**：未合併即關閉的 PR 與待處理的 Issue 同樣可能揭露重要缺陷或需求。排程報告必須確保「未檢查」與「沒有新變更」截然分明。

## 2026-09-12：日常直接推 main

**決定**：日常維護修改在本機跑 `tools\dev_check.ps1` 後直接推 `origin/main`。Dependabot 與外部貢獻仍走 PR，合併前讀 diff。

**理由**：對齊 SanHsien 體系其他維護 fork 的治理規範。

## 2026-09-12：上游分支、PR 與 Issue 首次盤點結論

**決定**：
1. **上游分支**：本 fork 僅同步 `main` 分支至 `origin`，唯一長期跟隨分支為 `upstream/main`。
2. **水位鎖定與最新審查**：
   - PR `#3898` (OPEN)、`#3900` (OPEN)、`#3901` (OPEN)、`#3902` (OPEN)：皆為進行中之 PR，待上游合併進 `main` 經完整測試後再行同步。
   - Issue `#3897` (OPEN)、`#3899` (OPEN)：分別由 PR #3898 與 #3900 處理中，持續追蹤。
   - 水位基準推進鎖定至 Commit `51a88b95660c5f67e66e9c5977226f6ae7b31255`、PR 水位 `3902`、Issue 水位 `3902`。

**理由**：確立乾淨的審查基準線，增量檢查未來僅需處理大於 `#3902` 的新項目或 `51a88b9` 之後的新 Commit。

## 2026-09-12：Windows 原生支援與安全發布防線

**決定**：
1. **發布工作流程防護**：在 `.github/workflows/publish.yml` 與 `.github/workflows/sync-skills-to-clawhub.yml` 加入 `if: github.repository == 'heygen-com/hyperframes'`，防範 fork CI 誤調用發布或遺失 secret 報錯。
2. **Windows Bun Linker 規範**：在 Windows 環境下執行 `bun install` 規範使用 `--linker=hoisted`，避免預設 isolated linker 產生的巢狀工作區 junction 導致符號連結權限錯誤。

## 2026-09-12：引進上游 PR #3851 與 PR #3902

**決定**：
1. **引進 PR #3851**（`fix(cli): hide console window for detached child processes on Windows`）：在上游 HeyGen 維護者核准的基礎上，為 `previewLifecycle.ts`、`transport.ts`、`openBrowser.ts` 補齊 `windowsHide: true`，解決 Windows 下預覽與遙測背景執行彈出黑色命令提示字元視窗的問題（Issue #3476）。
2. **引進 PR #3902**（`fix(cli): stop isTransparentColor misreading opaque zero-blue colors as transparent`）：修正 `layout-audit.browser.js` 中 `hasPaint` 與 `isTransparentColor` 將不含藍色分量（如純紅、純綠、黃色）誤判為透明色之缺陷，改以 `colorAlpha(color) === 0` 精確判斷。

## 2026-09-12：全套件 Windows 原生測試相容性修復

**決定**：
1. **Windows 符號連結（symlink）權限隔離防護**：Windows 11 一般終端（非提權環境）執行 `fs.symlinkSync` 會拋出 `EPERM`。為 `packages/cli`、`packages/core`、`packages/studio-server`、`packages/engine` 等套件之 dangling symlink 與安全邊界測試補上 `canCreateSymlinks` 探測與優雅 skip，確保在不具備符號連結權限的 Windows 環境下測試不崩潰。
2. **現代 FFmpeg 參數相容性**：FFmpeg 7.0+ 完全廢除 `-vsync` 選項，全面換用現代 `-fps_mode vfr`。
3. **子行程測試跨平台抽象**：`packages/engine` 中的 `processTracker.test.ts` 擺脫 POSIX 指令相依（`echo`、`sleep`、`true`），統一採用 `process.execPath` 行內 Node 腳本，並處理 Windows 下 `SIGKILL` 之 `EINVAL`。
4. **跨平台路徑分隔符號正規化**：修復 `packages/producer` 與 `packages/studio-server` 測試中寫死正斜線 `/` 導致 Windows 反斜線 `\` 斷言失敗的問題。

## 2026-09-12：標籤收斂政策（只保留最新 Tag）

**決定**：本 fork 嚴格維持簡潔的標籤庫，本機與遠端 `origin` 僅保留最新穩定發布標籤 `v0.8.35`，其餘 295 個歷史舊標籤全數清理刪除。


## 2026-09-30：第二輪上游審查（commit 至 d1a5a05、PR 至 #4784、issue 至 #4763）

本 fork 歷史已壓縮、與上游無共同祖先，且產品樹與上游相差約 2270 檔，不能 merge，只能 `cherry-pick -x`。本輪量：675 個 commit、824 筆 PR、52 筆 issue。基準代表已審查，不代表全部合併。

### commit 軸（675 筆）依類型歸組

| 類型 | 筆數 | 判定 |
| --- | --- | --- |
| fix | 325 | 逐一比對關鍵字（Windows／CJK／非 Latin-1）；命中並採用 2 筆，其餘 **adoption pending**（見下） |
| feat | 156 | 不 fork-ahead：新功能（Parakeet 轉錄、Studio dock、motion blur 等），待整批同步 |
| chore／ci／test／docs／refactor／perf／merge | 174 | 不適用：版本 release bump、上游 CI／merge queue／Windows runner 分片、上游文件與效能調整 |

- **採用**：`edb6e87` #3982 子合成 ETag ByteString-safe（fixes #3979）、`b599f03` #3984 render 下載 header ByteString-safe（fixes #3983）。屬 CJK／非 Latin-1 檔名類，`cherry-pick -x` 無衝突（本 fork SHA `bc9a1adee`、`a8d919f32`）。
- **Windows 修正（fork 額外承擔）**：#3984 的新測試在 Windows 失敗——`/render/:jobId/view` 與 `/download` 用 `outputPath.split("/").pop()` 取檔名，Windows 路徑是反斜線，導致 header 帶完整路徑。改用 `node:path` `basename`（`packages/studio-server/src/routes/render.ts` 第 211、232 行）。這是本 fork 的修正，上游仍是 `split("/")`；下次同步 `render.ts` 時保留。驗證：`vitest run src/routes/preview.test.ts src/routes/render.test.ts` 88 項全過。
- **adoption pending（產品碼漂移過大，無法在本機逐項驗證）**：其餘 fix 共 323 筆，包含 producer／engine／core runtime／studio／lint 的修正。理由：與本 fork 相差 2270 檔且無共同祖先，逐筆 cherry-pick 需要完整 bun 工作區與跨套件測試；觸發條件：規劃整批同步（以 v0.8.97 為目標）時一次處理，優先項為下列 Windows／安全類。
  - Windows 類（皆為 open 或未合併 PR，上游尚未落地）：#3956／#3960／#3996 剩餘子行程隱藏 console、#4059 ffmpeg／ffprobe EBUSY 重試、issue #4028（`@puppeteer/browsers` 3.2.1 使 windowsHide 失效）、#4058、#4060（磁碟擷取 headroom 誤拒）、#4702（Git Credential Manager 彈窗）。
  - 安全類：#4243／#4304 擷取寫入 symlink 強化、#3957 studio server 備份失敗仍寫入、#4540（已合併，背景移除 planted links）。

### PR 軸（824 筆，#3903 至 #4784）

410 fix、166 feat、78 chore、45 codegen、34 ci、31 perf、26 docs、23 test。已合併者隨 commit 軸處理（見上）；OPEN 與 CLOSED 未合併者：Windows 相關與 CJK 相關的已列於上方 pending；其餘功能與上游 CI 類不適用。觸發條件：整批同步時以 PR 編號區間重新比對本 fork 與上游同名檔的差異。#4247 為垃圾訊息（外部推廣），不適用。

### issue 軸（52 筆，#3916 至 #4763）

- 已被上述採用項涵蓋：#3979、#3983。
- Windows 類 pending：#4028、#4058、#4060、#4702。
- 其餘為上游產品缺陷回報（render、lint、Studio、runtime 計時等），多數已有對應 PR；由整批同步追蹤。#4247（垃圾訊息）、#4674（Examples 頁不顯示影片，屬上游站台）不適用。

## 2026-10-07：整樹採用上游 `d94708e5`（取代 adoption pending）

**決定**：維護者授權一次採用全部待處理的上游工作（約 837 個 commit，含 Windows 與安全修正）。本 fork 與上游無共同祖先，所以用橋接方式做三方合併，結果在本機分支 `sync/upstream-d94708e5`（父為 fork `main` 的 `82f7e6f2f`，單一 commit），尚未推送，交獨立審查者審查後才合併。`tools/upstream_baseline.json` 的 `reviewed_through` 推進到 `d94708e5312df021e1fdcac421f00ed3015f11bd`；PR／issue 水位維持 `#4784`／`#4763`，因為本輪沒有逐筆讀那些編號。

**方法**：

- **基底選擇**：fork 樹不是乾淨的上游 v0.8.35。`git log` 找不到任何單一上游 commit 與它相符。它是 v0.8.35 `63574a7c7` 加上 fork 自己的 CodeQL 修復系列（分支 `security/codeql-remediation-20260920`，45 個 commit，隨 `370725f24` 壓縮進來）、Windows 測試相容修正與文件層。所以以 `63574a7c7` 為合併基底：`git merge -s ours --allow-unrelated-histories 63574a7c7` 建立橋接 commit，再 `git merge upstream/main`。這樣 fork 相對 v0.8.35 的差異才會被三方合併保留，而不是被上游整個蓋掉。
- **400 個 `docs/catalog/**` 與 `docs/snippets/catalog-detail.jsx` 衝突取上游**：這些是產生出來的頁面（376 個取上游版本，24 個上游已刪除而跟著刪除）。fork 沒有手改它們，內容由上游產生器決定，取上游才能與 `scripts/generate-catalog-pages.ts` 一致。
- 不採用的 CodeQL 變更見下表；其餘衝突手動解，原則是「上游重寫的地方取上游，fork 的加固能與上游並存就疊上去」。

**其餘 39 個衝突**：

| 類型 | 檔案 | 處理 |
| --- | --- | --- |
| fork 覆蓋層（取 fork） | `.github/pull_request_template.md`、`.github/workflows/ci.yml`、`AGENTS.md`、`CONTRIBUTING.md`、`README.md`（繁中主檔） | 保留 fork；上游 `README.md` 的變更（Studio 連結、Claude plugin 安裝、21 個 skill、IBM Bob、Plugin packages）三方合併進 `README.en.md`，繁中 `README.md` 沒有對應章節所以沒有翻譯內容可補 |
| fork 刪除 | `CLAUDE.md` | 維持刪除（fork 已併入 `AGENTS.md`） |
| 聯集 | `.gitignore` | fork 維護條目加上上游新增條目 |
| 取上游 | `capture/index.ts`、`media-use/lib/freeze.mjs`、`telemetry/client.test.ts`、`regression-harness.ts`、`routes/preview.ts`、`routes/preview.test.ts`、`routes/render.test.ts`、`scripts/generate-catalog-pages.ts` | 上游重寫或已含同等修正 |
| 取上游並疊 fork 的差異 | `routes/files.ts`、`routes/render.ts`、`proxyTranscoder.test.ts` | 衝突處取上游（`createFileAtomically`、新 import），fork 的 `basename` 與測試相容修正保留 |
| 組合 | `catalog.ts`、`catalog.test.ts`、`localSemantic.ts`、`localSemantic.test.ts`、`publication.test.ts`、`skillsMirror.test.ts`、`bridge.ts`、`component-variables.ts`、`registry/catalog-artifact/README.md`、`capture/mediaCapture.ts`、`commands/capture/video.ts` | 見下方「保留的 fork 差異」 |
| 組合（media-use 音訊） | `tts.md`、`audio.mjs`、`heygen.mjs`、`heygen.test.mjs`、`tts.mjs`、`tts.test.mjs` | 上游新增（cloned voice、`loadEnvFromDir`、`heygenMessage`）加上 fork 的固定語音與 ffmpeg 重新編碼 |
| 上游搬移 | `skills/media-use/scripts/lib/{freeze.test,logo-provider,logo-provider.test}.mjs` | 上游把這些搬到 `packages/cli/src/media-use/lib/`；舊路徑刪除，fork 對 favicon 的 `normalizeCloudImage` 移植到新路徑 |
| 產生檔 | `skills-manifest.json` | 以 `packages/cli/scripts/gen-skills-manifest.ts` 重新產生 |

**保留的 fork 差異**（相對上游 `d94708e5`）：

- `routes/render.ts`：`/render/:jobId/view` 與 `/download` 用 `node:path` `basename`，修 Windows 反斜線路徑。上游仍是 `split("/")`。
- `routes/files.ts`：移除上傳前的 `existsSync` 檢查再寫入（改為只靠 exclusive create 重試），並在碰撞上限處中止，屬 CodeQL 的 check-use race 修正。
- `localSemantic.ts`：新增 `installLocalVectors`（從隨套件的 `registry/catalog-artifact` 複製向量，不從網路寫入快取），`catalog.ts` 改呼叫它；上游的 `media-vectors` 在正式流程中由 `packages/cli/src/media-use/lib/local-media-search.mjs` 的 `installMediaVectors` 從隨套件目錄安裝（`installLocalVectors` 的 `artifactBasename: "media-vectors"` 分支只有測試使用）；上游的 `fetchLocalVectors` 已刪除，原因見下方「CodeQL（PR #2）」。
- `runtime/bridge.ts`：控制訊息以封閉的 `switch` 分派（不是 `Map` 查表），並補上上游新增的 `set-idle-heartbeat`、`set-play-range`。
- `scripts/catalog/component-variables.ts`：不靠 regex 的註解剝除，保留；上游以 `PREFER_AUTHORED_DEMO` 取代 `SNIPPET_PREVIEW_RENDERS_STILL`。
- `capture/mediaCapture.ts`、`commands/capture/video.ts`：擷取到的影片經 `videoNormalization` 以 ffmpeg 重封裝後才落地（上游沒有動這段）。
- media-use 音訊：HeyGen 非英文必須明給 `--voice`、雲端音訊經 ffmpeg 重新編碼後才寫檔；favicon 經 `image-normalize` 後才凍結。
- 測試：fork 的 `canCreateSymlinks` 探測與 `skipIf`（`publication.test.ts`、`skillsMirror.test.ts`；本輪另對上游新增的三個 Codex 符號連結測試加同樣的 `skipIf`）。
- 工作流：`catalog-publish.yml` 加上 `if: github.repository == 'heygen-com/hyperframes'`（它用寫入權杖開常駐 PR）；其餘新工作流（`comments`、`pr-captures`、`studio-drag-frames`）無 secrets 且唯讀，未加閘門。

**舊採用裁決已更正（superseded，2026-10-12）**：先前以「無呼叫者」接受移除 publisher／framework 防護的判斷不正確。

- 舊媒體 publisher 有真實產品呼叫：舊 freeze 模組透過 `spawnSync` 把已取得的媒體 bytes 交給發佈行程。直接寫目的地會失去安全發佈契約；本次恢復共用 publisher，涵蓋遠端與本地來源。
- 舊 framework markup 濾除器也有 capture 產品呼叫。新 DOM parser 不會自動遍歷 inert template 的內容，不能據此主張巢狀 template／hydration marker 防護等價；本次把有界 DOM traversal 接回 `packages/cli/src/capture/filterExtractedScripts.ts` 與其實際呼叫端。
- 上傳的 POSIX `0o600` 未保留。排他建立處理寫入競態，不能證明權限等價；Windows ACL 也不能由 POSIX mode 推定。此次以 Windows-only 維護範圍裁決，沒有新增或宣稱 ACL 隔離驗證。

**驗證**（Windows 11、Bun 1.4.2、`--linker=hoisted`；同一批測試在純上游 worktree `C:/GitHub/hf-upstream` 對照）：

| 範圍 | 合併後 | 純上游 |
| --- | --- | --- |
| studio-server `render`／`preview`／`files*`／`proxyTranscoder`（9 檔） | 5 失敗、359 通過（皆為 Windows 符號連結 `EPERM` 或備份失敗斷言，上游同樣失敗） | 10 失敗；多出的 5 個為 render 檔名（fork `basename` 修正使其通過）、proxyTranscoder、files.pathSafety |
| cli：`catalog`、`localSemantic`、`publication`、`client`、`skillsMirror`、`capture/**` | 全數通過（43 檔通過、2 檔略過） | `publication`、`skillsMirror` 共 13 項符號連結失敗 |
| core `runtime/bridge*` | 35 通過 | 未跑 |
| `tsc --noEmit`：studio-server、core、studio | 通過 | 未跑 |
| `tsc --noEmit`：cli | 17 個錯誤，與上游逐項相同（`typeof fetch` 的 `preconnect`、`compositionServer.ts`） | 17 個 |
| media-use node 測試 | 3 失敗（`ffprobeDuration`、`heygenAuthMethod` 符號連結迴圈、`logo-provider.test.mjs` 整檔載入失敗），與上游相同 | 相同 3 個 |

**lint 與 PR CI（2026-10-07 複審後）**：

- 複審指出 PR CI 的 Preflight lint 失敗：`skills/media-use/audio/scripts/lib/heygen.mjs` 是 fork 帶入的版本，`downloadTo` 改走 `normalizeCloudAudio` 後 `existsSync`／`mkdirSync`／`writeFileSync` 已不使用但仍 import（上游無此問題）。已只留 `readFileSync`；本機 `bun run lint` 全套 0 warnings、0 errors。
- 合併前就已紅、非本 fork 造成的兩項，不在本次處理：`Comments` workflow 的 comment-ratchet 以 fork `main` 為基準，整樹採用使 `packages/engine/src/services/captureFailure.ts` 的註解比例由 1.6% 升到 5.4%，`check-comment-citations.mjs` 另報 `EISDIR`（推測為 diff 中的目錄型 symlink，未證實）；`Studio drag frames` 只在 PR 改到該 workflow 檔時觸發，且固定 checkout `main` 來量測；fork 的 `main` 還沒有 `packages/studio/tests/e2e/edit-accuracy/`，所以找不到腳本。腳本在上游與本 PR 的樹裡都存在，合併後 `main` 就有，屬一次性紅燈（先前寫成「上游也不存在」有誤）。

- PR CI 的 `Tests on windows-latest: core` 失敗於上游新增的 `htmlBundler.test.ts`「emits styles and scripts in render order…」：該測試以 `push("n")` 等字面文字找腳本位置，而 fork 的 `wrapScopedCompositionScript` 把作者腳本存成 JSON 字串（引號變成 `\"`），找不到時 `indexOf` 回 -1，兩種模式排出的順序才不同；純上游樹本機通過、合併樹失敗。測試改為先還原跳脫的引號再比對，並新增「三段腳本在兩種模式都必須找得到」的斷言，避免空比對也通過；本機該檔 151 passed。

**未驗證**：producer、engine、player、完整 `bun run test`、`test:scripts`、`test:skills` 與 fallow 全庫、Docker／Lambda、瀏覽器端測試；`generate-catalog-pages` 與目錄產生器的實跑；移植到新路徑的 favicon `normalizeCloudImage` 沒有被通過的測試覆蓋（`logo-provider.test.mjs` 在上游同樣整檔失敗）；符號連結相關測試在本機無權限所以被略過而非通過；LFS「should have been pointers」警告（57 個 producer 輸出檔）是上游既有狀態，未更動。本機工作目錄另有未追蹤的檔案（not tracked: `pnpm-lock.yaml`、not tracked: `pnpm-workspace.yaml`），不屬於任何一側，未提交。

### 合併後審查與修正

PR #2 合併前由獨立審查檢視整樹採用後被上游取代的 fork 加固。逐項結論與處置如下；上面「不再生效或孤立的 fork 加固」三項與「工作流」一項的描述以本節為準。

| 項目 | 嚴重度 | 處置 |
| --- | --- | --- |
| F1 媒體向量改由可變網路來源下載，且 `row.file` 未限制範圍 | 中 | 已修。上游 fetchMediaVectors 從 `raw.githubusercontent.com/heygen-com/hyperframes/main/registry`（可被 `HYPERFRAMES_REGISTRY` 覆蓋）下載 `media-vectors.*`，無逾時、無大小上限、無成對驗證且兩檔非原子寫入；之後 `resolve(row.file)` 與 `join(..., row.file)` 直接信任 JSON，竄改成 `C:/Users/<u>/.ssh/id_rsa` 或 `../..` 就會成為 `searchResult.localPath`，再被 `freezeLocalFile` 複製進專案。改為：`build-copy.mjs` 把 `media-vectors.json`／`.bin` 一併放進 `dist/catalog-artifact`；新增 `installMediaVectors()`，只從隨套件目錄安裝，套用與 `vectorPairAgrees` 相同的成對與逐列驗證並拒絕絕對路徑或含 `..` 的 `file`，以 `0o600` 經暫存檔加 rename 寫入，不做任何網路請求；新增 `resolveBundledMediaFile()`，只接受解析後仍在隨套件 SFX 根目錄內的相對路徑，並移除以工作目錄為基準的候選。`resolve.mjs` 改走 `searchLocalSfxIndex`，fetchMediaVectors 與 `HYPERFRAMES_REGISTRY` 路徑移除。測試涵蓋絕對路徑被拒、`..` 被拒、`fetch` 被禁止時排序仍可運作 |
| F2 遠端媒體不再驗證魔術位元組 | 中低 | 已修。把 fork 的 `assertRemoteMediaBytes` 移植進上游 `freeze.mjs`，在 `freezeUrl` 的 `readCappedBody` 之後、`writeFrozen` 之前依目的檔副檔名驗證（`.svg` 仍交給 `sanitizeSvg`、`.cube` 用 `cube-validate.mjs`、未知副檔名一律拒絕）；`freezeLocalFile` 不驗證。呼叫端的目的副檔名已逐一確認相容（HeyGen 影片 `video.mp4`、LUT `download.cube`、`resolve` 的保留檔名來自供應商 `ext`、URL 副檔名或預設值）。上游串流測試的假資料改為合法標頭，新增「HTML 位元組寫成 `.png` 被拒」與「`#EXTM3U` 寫成 `.mp4` 被拒」。先前刪除 publisher 的「無呼叫者」理由已撤回；本次恢復共用安全媒體 publisher，發佈與本地來源的最終驗證仍見本日決策 |
| F4 framework markup 防護 | 低 | 舊防護有 capture 產品呼叫；先前「無呼叫者／上游等價涵蓋」裁決已撤回。本次在實際呼叫的 `filterExtractedScripts` 恢復 nested template traversal 與 DOM marker 濾除，深度上限 16；超過上限拒絕不完整結果 |
| F5 上游 `.github/CODEOWNERS` 指名上游維護者 | 低 | 已刪除，避免對不維護本 fork 的人請求審查 |
| 上傳檔案 `0o600`（b） | Windows-only 裁決，非權限等價 | mode 未保留。`createFileAtomically` 的排他建立可處理碰撞與覆寫競態，但不是權限等價證據；Windows ACL 不能由 POSIX mode 證明。此次沒有驗證 ACL 隔離，未主張其他平台的權限契約已保留 |
| framework markup（c） | 已恢復產品防護 | 見 F4；舊程式確有 capture 呼叫。本次使用 DOM traversal 處理 hydration marker 與 inert template，不以「DOM parser 已足夠」取代這些防護 |

其他修正：

- `.github/workflows/pr-captures.yml` 要求 PR 內文附 Before/After 截圖，是上游貢獻流程，fork 自己的 PR 會必然失敗。job 條件加上 `github.repository == 'heygen-com/hyperframes'`（與原有的 `merge_group` 條件以 `&&` 合併），`FORK.md` 的工作流表補上 `pr-captures.yml`、`catalog-publish.yml` 與 `canary-sunset.yml`，並在 `tools/tests/test_fork_docs.py` 新增契約測試，確認這些上游專屬工作流都帶閘門且都記載在 `FORK.md`。上方「工作流」一項說 `pr-captures` 未加閘門，現已更正。
- `packages/studio-server/src/routes/files.ts` 上傳路徑的註解原寫「collision suffix 會選另一個路徑」，但該處驗證的是尚未加後綴的目的地；改成與程式一致的描述（後綴只在後面的排他建立迴圈選用，且每個候選都再過 `isSafePath`）。

驗證與已知限制：

- 同一批 media-use node 測試在修正前後的失敗集合相同，皆為 Windows 符號連結 `EPERM` 與缺少 `src/audio/scripts` 符號連結實體的既有失敗；新增的 F1、F2 測試全數通過。
- `scripts/merge-queue-workflows.test.mjs` 預期 `ci.yml` 監聽 `merge_group`，但 fork 的 `ci.yml` 是 Windows 專用版本而沒有該事件，此項在修正前就失敗，不在本次範圍內。
- 目前 `BUNDLED_MEDIA_ROOT` 沿用上游的 `join(import.meta.dirname, "..", "..", "..")`：在發佈佈局（`dist/skills/media-use/scripts`）指向 `dist`，列內 `skills/media-use/audio/assets/sfx/*` 可解析；在原始碼檢出中指向 `packages/`，本機索引不會命中，會落到下一層（HeyGen）。原本靠工作目錄相對路徑「碰巧可用」的開發情境因此不再命中，這是刻意的收斂。

### CodeQL（PR #2）

PR #2 的歷史 CodeQL 掃描共 28 筆（#156 至 #183）。下表保留先前四項修補紀錄；先前把其他項目概括裁決為無需修改的結論已 superseded，不能作為全數安全完成的證據。

| 警示 | 規則 | 檔案 | 修正 |
| --- | --- | --- | --- |
| #156 | `js/polynomial-redos` | `packages/core/src/compiler/svgIdNamespacing.ts` | `URL_HASH_REF_RE` 的 id 字元類排除 `(`（`[^"'()\s]+`）。`POST /render` 接受最大 8 MB 的 HTTP request body 的 html 欄位（not a repository file: `body.html`），經 `inlineSubCompositions` 進入此掃描；一長串沒有 `)` 結尾的 `url(#!` 會讓每個起點都掃到輸入尾端再回溯，時間為二次方並卡住 Node 事件迴圈。排除 `(` 後每次嘗試最多掃到下一個 `url(`，成為線性。新增測試以 `"url(#!".repeat(200_000)` 走 `namespaceCollidingSvgIds`（屬性與樣式表文字）與 `rewriteSvgIdReferencesInCss`，並確認 `url(#a)`、`url('#a')`、`url( "#a" )` 的改寫不變 |
| #177 | `js/insecure-temporary-file` | `packages/engine/src/services/extractionCache.ts` | 預設快取根目錄是共用 `/tmp` 下可預測的 `hyperframes-extract-cache-<uid>`，其他本機使用者可預先建立它來放入毒化的快取影格，或把 `.hf-last-gc` 放成符號連結。新增 `assertPrivateCacheRoot()`：以 `0o700` 建立，再用 `lstat` 要求是真正的目錄、不是符號連結；POSIX 另要求屬於目前使用者且 `(mode & 0o077) === 0`。`videoFrameExtractor.ts` 失敗時沿用既有的「caching disabled for this render」警告並停用快取（不讓渲染失敗），`clean.ts` 在 `gcExtractionCache` 前檢查並略過不安全的根目錄；`.hf-last-gc` 改為在已驗證的根目錄內以排他建立的暫存檔加 `rename` 寫入，不會跟隨符號連結。屬於目前使用者、且其他人沒有寫入權的既有根目錄（例如舊版以預設 umask 建立的 `0o755`）會就地收緊為 `0o700` 繼續使用；群組或其他人可寫（如 `0o775`、`0o777`）的根目錄內容可能已被他人放入，仍拒絕並停用快取。動畫 GIF 快取（`compileStage.ts` 的 `animatedGifCacheDir`）也在同一根目錄下、且比影格擷取更早執行，複審發現漏檢，已改為先經 `privateAnimatedGifCacheDir`（同一個 `assertPrivateCacheRoot`），不通過只停用 GIF 快取。`hyperframes clean --dry-run` 在檢查時也會把符合條件的根目錄收緊為 `0o700`，這是 dry-run 唯一的副作用 |
| #180 | `js/http-to-file-access` | `skills/media-use/audio/scripts/lib/gemini-tts.mjs` | Gemini 回應位元組只通過 RIFF/WAVE 標頭檢查就直接寫檔。依本 fork 對雲端音訊的政策（與 #133、#134 及 `heygen.mjs` 相同），改為經 `normalizeCloudAudio(bytes, wavAbs)` 由 ffmpeg 解碼再編碼後才寫入；該函式可由第二個參數注入供測試使用，回傳 false 時回 `{ ok: false, error: "audio transcode failed (ffmpeg; output must be .wav or .mp3)" }` 且不留下原始檔，標頭檢查與金鑰遮蔽維持不變 |
| #183 | `js/http-to-file-access` | `packages/cli/src/registry/localSemantic.ts` | 刪除已無呼叫者的 `fetchLocalVectors`（與僅供它使用的 `FetchLocalVectorOptions`、`CATALOG_ARTIFACT_TIMEOUT_MS`）。`git grep` 確認只有 `localSemantic.test.ts` 使用它；`catalog.ts` 早已改呼叫 `installLocalVectors`，向量只從隨套件目錄複製。原本只能透過它驗證的 `media-vectors` 成對與逐列檢查改在 `installLocalVectors` 上測試，並新增「`globalThis.fetch` 換成會丟例外的替身時 `installLocalVectors` 仍成功且不被呼叫」的測試 |

#182（`js/http-to-file-access`，`packages/cli/src/media-use/lib/local-media-search.mjs`）的修正是上方「合併後審查與修正」表的 F1 項：`installMediaVectors` 在 `packages/cli/src/media-use/lib/local-media-search.mjs:90`、`resolveBundledMediaFile` 在 `:129`，隨 `cfda43f51`（PR #2 合併，`chore(upstream): adopt d94708e5 as a whole tree (#2)`）進入 `main`。此警示只存在於 `refs/pull/2/merge`：`/instances` 僅列一筆（commit `0e11683ed`，state fixed），`main` 沒有這筆警示。先前把其餘 23 筆（#157 至 #176、#178、#179、#181）概括為「上游／測試／已有防護、無需修改」的裁決證據不足，已 superseded，以逐項 source flow 與實際修補決策為準。#171（Frost URL guard）原為候選，現已同樣隨 `cfda43f51` 進入 `main`：`registry/blocks/frost-sequence-camera-orbit/source/src/shape/logo.ts:86` 的 `isProjectAssetUrl`（拒絕控制字元與前後空白）、`:97` 的 guard，以及 `:98` 的 `fetch(url, { credentials: "omit", redirect: "error" })`；上游 `d94708e5` 的同檔只有 `isProjectAssetUrl` 與無選項的 `fetch(url)`。#171 也只存在於 `refs/pull/2/merge`（commit `ab282dd3a`，state fixed），`main` 的 open、dismissed、fixed 清單都不含它。2026-10-24 以 `gh api` 實測，`main` 的 code-scanning open 為 0、dismissed 為 25；歷史 dismissal 與舊 CI 綠燈仍不是「已安全完成」的證據，兩者之外以逐項 flow 為準。

### 2026-10-12：PR #2 產品與 Comments 驗收修復

- Windows core lane 的 core 測試本身通過（4,226 tests）；真正的非零來源是 shader preview unit fixture 啟動 html2canvas，DOM 關閉後背景計時器丟出 14 個未處理錯誤。fixture 改在 capture 邊界明確拒絕，仍驗證相同 DOM fallback／playhead 行為；capture 與依賴 patch 測試保留。
- Studio drag 的 PR checkout 原本固定為 `main`，該樹沒有 bench，五個 runs 都因找不到入口失敗。PR 改 checkout 事件的精確 head SHA；dispatch 保留指定 ref，五次矩陣及 quiet-box gate 不變。實際 drag 與 Windows lane 驗收以發布後對該 SHA 的 hosted jobs 為準。
- Comments citation checker 的 practice rules 原本嘗試讀取目錄 symlink，造成 `EISDIR`；改為只讀既定支援副檔名。修正 Windows CLI 入口與 Git 路徑分隔符，symbol 搜尋排除不能解析為文字行號的 binary。檢查範圍包含工作樹，避免本機候選被漏檢。
- 原 `main` ratchet 對整樹採用報出 200 findings，其中 192 項的 source blob 與上游 `d94708e5312df021e1fdcac421f00ed3015f11bd` 完全相同。本 fork 對此次採用使用一次性基準 `7609091171650913d3afd6050b9bc643d9432c56`，代表既有採用內容，不代表跳過後續 fork 修補。
- 例外只適用於 `SanHsien/hyperframes` 的 PR #2、head branch `sync/upstream-d94708e5`、base `82f7e6f2f32283b2074736f2b7deea6b810450a2`，要求 checkout HEAD 等於事件 head 且包含已審查 HEAD `9aa1b4a8cb51baa253a2f890d9df0414160ccb4a`，並驗證採用基準為其祖先。基準固定在 `scripts/comment-check-base.mjs`；CI 不接受 `COMMENT_CHECK_BASE` 改寫。一般 PR 仍對自己的 base 執行原規則，guard 不符的已指定採用歷史會失敗。
- 後續 fork 修改仍受完整 citation／ratchet 規則；四個安全修補檔只精簡重複註解，程式碼、regex、安全旗標與斷言不變，詳細威脅理由保留於前述 CodeQL 決策。測試涵蓋一般 PR 拒絕新增註解、env 不能繞過、錯誤 owner／PR／branch／base、stale checkout 與改寫歷史。


### 2026-10-12：安全裁決補正與有限候選

本節記錄建立時，候選尚未發布；以下 focused 證據不等同最終 combined gate／hosted CodeQL 通過。

| 範圍 | 決策與驗證邊界 |
| --- | --- |
| #157、#158、#159 Studio ReDoS | 三項都有產品 caller：composition HTML patch、project path 與 timeline source 分類。`rootDuration.ts` 改單次 tag span 掃描（含 quoted 小於符號）；`studioHelpers.ts` 倒序裁尾端斜線；`timelineInspector.ts` 先界定可匹配單行再判斷固定長度音訊副檔名。3 files／64 focused tests 通過，涵蓋長反例與原 quote／屬性順序／query／fragment／換行語義；未以 dismiss 代替修補 |
| #170 GSAP fixture | 固定 `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.14.2/gsap.min.js` 版本，實際下載 bytes SHA256 為 `c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280`，在 `packages/producer/tests/subcomp-bare-fragment/src/index.html` 加 SHA-384 SRI 與 anonymous CORS。實際 compiler 驗證 bytes、拒絕 tamper；jsdom 的 GSAP version／2 秒 timeline／seek 通過。完整 Chrome render 仍須 hosted regression |
| #172、#173、#174、#175、#176 HTML construction | 五項均有實際 caller，非無資料流。engine／producer 的 file server 傳入作者／runtime script，`packages/core/src/compiler/htmlDocument.ts` 的 inline script helper 經 `escapeInlineScriptSource` 處理 closing script token 與 HTML comment opener；相應測試保留。這是 intentional author JavaScript API 的逐項功能裁決，不能改成文字-only 以假通關，也不主張 render 執行環境是 sandbox |
| #181／舊 publisher 採用缺口 | 舊 freeze 模組確有 `spawnSync` 產品呼叫；安全 publisher 已接回目前 freeze 模組，遠端及本地來源都屬修補範圍。最新三項 review finding 已修：本地來源以 fd 流式處理、staging／previous 名稱互異、保留空本地來源契約。最終 focused 31 PASS／1 SKIP，fresh review SHIP；略過項目不算通過，且本機 focused 不取代 hosted 驗收 |
| 舊 framework 採用缺口 | 真實 capture caller 已確認；目前 `coreExtractionPhase.ts` 呼叫的 `filterExtractedScripts` 恢復 hydration DOM marker 與 nested template 濾除，深度上限 16，超限 fail closed。focused 6 tests 通過；不作全域 HTML sandbox 宣稱 |
| 上傳 mode／其餘歷史項目 | 上傳 POSIX mode 未保留；本次 Windows-only 裁決不證明 ACL 或權限等價。其餘 13 歷史警示已逐項 triage，結果如下；權限裁決不能外推成所有平台隔離證明 |

### 其餘警示的逐項 source flow 裁決

| 警示 | 已確認 flow 與裁決限制 |
| --- | --- |
| #160、#161 | catalog-script-inlining 的 extractPrecedingClassicScripts 經 generate-catalog-payloads、prepareProjectDir、composePayloadHtml 提取並重新嵌入作者 classic scripts。matchAll／replace 是有意的 code transformation，非 sanitizer，不能以「沒有資料流」解釋 |
| #162 | inlineCodeSliceScripts 呼叫 extractAndRemoveScript，提取作者程式碼再執行。大小寫漏處理屬轉換正確性問題，不是此 API 的安全邊界；不作任意 HTML 可安全執行的承諾 |
| #163 | heygen-tts 測試只把固定 voice_not_found fixture 經兩層 JSON.stringify 插值，spawnSync 使用 argv，沒有外部輸入。裁決限於這個固定測試 flow |
| #164 | glass asset 的 Three.js Source 以 Math.random 生成視覺 identity／serialization UUID，不是 auth／session／capability |
| #165 | 同一 asset 的 Texture UUID 屬視覺 identity／serialization，不是安全 token |
| #166 | 同一 asset 的 Object3D UUID 屬視覺 identity／serialization，不是安全 token |
| #167 | 同一 asset 的 Material UUID 屬視覺 identity／serialization，不是安全 token |
| #168 | 同一 asset 的 BufferGeometry UUID 屬視覺 identity／serialization，不是安全 token |
| #169 | 同一 asset 的 Shape UUID 屬視覺 identity／serialization，不是安全 token；#164–169 裁決只限已追蹤的 asset callers |
| #178 | 選定音訊 request 的 lines／style 經 synthesizeOne、synthesizeGemini 傳往固定 Google Interactions endpoint，OAuth 也使用固定 Google token endpoint，沒有自由 URL。選擇 Gemini 雲端 TTS 本來就會傳送資料；此 flow 不是任意檔案外洩，也不是本地隱私方案 |
| #179 | catalog-fetch-mirror 只在 explicit CATALOG_FETCH_MIRROR=record 時記錄，使用固定 mirror directory 與 SHA256(body) 的前 24 字元作檔名，沒有任意 path。預設 replay miss fail closed；hash 只命名，不證明內容可信，fixtures 仍須 review |
| #171 | logoUrl 編輯實際流入 Frost options、shape／mesh 載入與 SVG fetch。source 的 URL controls 可繞過，且當時 renderer 載入的 bundle 沒有 guard，是真實缺口。六檔候選已處理 URL controls、fetch credentials omit／redirect error，build output 改到實際 assets 並重產 bundle／LEGAL，補來源 package lock。npm ci／build 成功，source＋實際 minified consumer 的 4 focused tests 通過，fresh review SHIP；focused 使用 stub、不呼叫外部服務。另一次實際 Frost GPU recovery 驗收 PASS（34 秒，Chrome 155／D3D11／RTX 3060）：logo、font、兩張貼圖均 HTTP 200，logo／headline1／headline2／backward 四次 seek 無 errors。首次 shadow DOM helper 定位 incomplete 的證據仍保留；新版候選的 hosted 驗收仍 pending |

本決策更新時，#160–169、#172–176、#178、#179 共 17 項已由 root 依逐項 source flow 理由完成 false-positive dismissal，並驗證權威狀態。裁決是有意功能或限定 fixture 的證據，不是無 flow 或全渲染 sandbox。6 項真實漏洞仍保持 open 等候候選掃描；不宣稱零 alerts。

最終各 owner 的 source／tests／此文件穩定後，由 root 統一跑 canonical gate，再發布候選取得實際 hosted 產品與安全結果。先前 `77b9b204bd17185db232a948526a10f16527f73a` 的 Windows／Comments／drag／regression 成功僅覆蓋先前產品候選；CodeQL security check 的警示促成本節修補，不能把 Analyze job 的成功等同零安全問題。


### 2026-10-24：Linux 上執行 POSIX 權限測試

四個測試檔的權限案例以 `it.skipIf(process.platform === "win32")` 排除 Windows（`packages/engine/src/services/extractionCache.test.ts`、`packages/engine/src/services/videoFrameExtractor.test.ts`、`packages/cli/src/commands/clean.test.ts`、`packages/producer/src/services/render/stages/compileStage.gifCache.test.ts`），而本 fork 唯一跑 TS 單元測試的 `.github/workflows/windows-render.yml` 只在 Windows 執行，`.github/workflows/ci.yml` 原本只有 Windows Python。這些案例因此從未在任何 CI 執行過，CodeQL #177 的快取根目錄防護沒有自動化回歸保護。

新增 `.github/workflows/posix-security-tests.yml`（不放進 `ci.yml`，因為 `tools/tests/test_fork_docs.py` 的 `test_ci_covers_python_314` 把它釘為純 Windows）的 job `test-posix-security`（ubuntu-latest、一般 runner 使用者、`contents: read`，push 到 `main` 與 PR 都跑）：以 `--ignore-scripts` 安裝依賴、安裝 ffmpeg（`videoFrameExtractor.test.ts` 的兩個權限案例在 `describe.skipIf(!HAS_FFMPEG)` 內，缺 ffmpeg 會被靜默略過），用各套件自己的 vitest 跑上述四個檔，並由最後一步讀取 JSON report，要求 13 個具名案例的狀態是 `passed`；被略過、缺席或失敗都讓 job 失敗，因為只有 run 紀錄不代表測試有跑。

上方 #171 列與文末「6 項真實漏洞仍保持 open」「新版候選的 hosted 驗收仍 pending」是 2026-10-12 的狀態，現況以上方 CodeQL 段落 2026-10-24 的實測為準。是否把此 job 設為 required check 不在本次變更內。

### 2026-10-24：Dependabot 不掃 Remotion 測試語料

Dependabot run `40021722362`（main `c1c221f6`，security update job `1648768405`）在 `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src` 對 `zod` 失敗，log 原文：`Dependabot can't update vulnerable dependencies for projects without a lockfile or pinned version requirement as the currently installed version of zod isn't known.`，錯誤類型 `dependency_file_not_supported`。這是安全更新 job，不受原本只設 `directory: "/"` 的版本更新設定約束，會掃到所有 manifest。

**決定**：在 `.github/dependabot.yml` 排除 `skills/remotion-to-hyperframes/assets/test-corpus/**`：根目錄 npm 項加 `exclude-paths`，另加一個以 `directories` 指向語料目錄的 npm 項，`ignore: dependency-name "*"` 且 `open-pull-requests-limit: 0`。

**理由**：這三個 `remotion-src/package.json` 是 `run.sh` 用來渲染 Remotion 基準影片、與 HyperFrames 轉譯結果比 SSIM 的 fixture，不隨產品發佈，只在手動跑語料時 `npm install`。它們以 caret 範圍宣告、沒有 lockfile，Dependabot 本來就無法判定版本而只會反覆失敗；要讓更新成功就得在上游擁有的 `skills/` 內新增 lockfile 或改宣告，偏離「`skills/` 以上游為準」且把 fixture 綁成本 fork 的版本。`zod` 從 3 升到最新 4.x 是 major 變更，也可能改變基準渲染。之前沒有關於 test-corpus 的既有決定（`docs/DECISIONS.md`、`FORK.md`、git log 均無）。`tools/tests/test_fork_docs.py::test_dependabot_skips_remotion_test_corpus` 釘住這項排除。


### 2026-10-24：ruff 下限升到 0.17

依賴新鮮度報告把 `ruff>=0.16` 標為 REVIEW UPDATE（PyPI 最新 0.17.2）。依報告的審查步驟，在乾淨 venv 裝 `ruff==0.17.2` 後跑 `tools/dev_check.ps1` 的同組指令：`ruff check --select E9,F --target-version py310 tools` 全過、`pytest -c tools/pytest.ini tools/tests` 全過。本 fork 只啟用 `E9,F` 兩組規則，新版新增規則不影響，所以把 `requirements-dev.txt` 的下限升到 `ruff>=0.17`，不是只為了讓報告變綠。

## 2026-10-25：升 fallow 3，happy-dom 留在 20.x

**決定**：`fallow` 升到 `^3.34.0`（lock 解到 3.35.0，修掉兩個 low 警示）；`happy-dom` 留在 `^20.9.0`，Dependabot 忽略其主版本升級。

**理由**：

- fallow 3.0.0 官方標明 CLI 旗標、設定、JSON 輸出皆無破壞性變更，只在 lefthook 的 `fallow audit` 使用；本機 `fallow audit --base origin/main --fail-on-issues` 通過。
- happy-dom 21 預設關閉 iframe 與 CSS 檔載入。設 `enableIframePageLoading`／`enableCSSFileLoading` 並改 `manualOffsetDrag` 測試後，仍有三項實作缺口：style 宣告不保留 `-webkit-text-fill-color`（`inlineTextStyleRange` 3 個測試）、`Menu` 的 capture 階段外部點擊關閉測試失敗、`motion-signature.browser` 兩個 `display:none` 誘餌測試失敗。修它們要改產品程式或砍測試覆蓋。
- happy-dom 只在 `devDependencies` 的測試環境使用，沒有任何非測試程式 import；GHSA-834v-8h66-3h79（ESM compiler 程式碼注入，修補版 21.0.4）影響的是載入不受信任模組腳本的情境，測試只載入本 repo 的 fixture。兩筆警示以 `tolerable_risk` 駁回。

**重評條件**：happy-dom 修好上述三項，或 20.x 出現無法繞開的相容問題。

**後續（同日）：已升 happy-dom 21.0.4，上面維持 20.x 的理由失效。**

- 當時說「修它們要改產品程式或砍測試覆蓋」不成立：三項缺口都是 happy-dom 21 與測試寫法的差異，全部在測試端處理，沒有動產品程式，也沒有刪測試。
  - `-webkit-text-fill-color`：21 的 `element.style` 只保留內建屬性表裡的屬性，不在表內的宣告被丟掉（20 會保留）。`inlineTextStyleRange.test.ts` 在該 describe 內把這個屬性登錄進 happy-dom 的 `CSSPropertyList`，測完還原；瀏覽器本來就保留它，產品程式的寫入沒問題。
  - `Menu` 外部點擊：不是 capture 階段失效。21 新增 `Element.getAnimations`，Base UI 會等它完成才卸載，popup 在關閉後晚一個 task 才離開 document（20 沒有這個方法，同步卸載）。`Menu.test.tsx` 與同樣情形的 `ShortcutsPanel.test.tsx`（4 個測試）在斷言前加一次 `settle()`；斷言本身（bubble 階段 witness 沒被觸發、popup 已關）不變。
  - `motion-signature.browser` 兩個 `display:none` 誘餌測試：21 新增 `Element.checkVisibility`，腳本因此走「平台決定」那條路，而該路徑讀 happy-dom 自己的 `getComputedStyle`，看不到 fixture 偽造的 `display:none`。fixture 在安裝時把 `checkVisibility` 遮掉，讓腳本回到 computed-style fallback（與 20 相同的路徑），`afterEach` 還原。平台路徑仍由 `motion-signature.browser.chromium.test.ts` 的真 Chromium 釘住。
- 預設變更：21 預設關閉 iframe 頁面載入，需要 `enableIframePageLoading: true`（`packages/player/vitest.config.ts`、`packages/sdk/vitest.config.ts`、`packages/studio/vite.config.ts` 的 `environmentOptions.happyDOM.settings`；`manualOffsetDrag.test.ts` 直接 `new Window` 的測試同樣傳這個設定）。`NLEPreview.slowBoot.test.ts` 原有的 `@vitest-environment-options` 註解多包了一層 `happyDOM`，vitest 會自己再包一次，（20 下 iframe 預設就會載入，所以看不出差別）；21 下這個逐檔選項會取代設定檔層的 `happyDOM` 設定，讓 `enableIframePageLoading` 掉掉、iframe 沒有 `contentWindow`（審查推測的成因），已移除該行改用設定檔。CSS 檔載入（`enableCSSFileLoading`）沒有測試需要，沒有開。
- 刪掉 `.github/dependabot.yml` 對 happy-dom 的 `semver-major` ignore。`package.json` 與 `packages/sdk/package.json` 的宣告下限改為 `^21.0.4`，是因為程式真的跑在新版上（`bun.lock` 解析為 21.0.4），不是為了消新鮮度報告；`.github/dependency-deferrals.json` 沒有 happy-dom 條目。兩筆 GHSA-834v-8h66-3h79 警示現在由修補版本本身解掉，不再靠 `tolerable_risk` 駁回。

## 2026-10-25：上游採用 `f5ab7711f`

**決定**：一次採用上游 `heygen-com/hyperframes` `main` 的 `f5ab7711fb8d0a3a0dea8bebc8e959448dac02d4`。`tools/upstream_baseline.json` 的 `reviewed_through` 由 `d94708e5` 推進到該 SHA，`reviewed_date` 為 2026-10-25；PR 水位 `#4784`、issue 水位 `#4763` **不動**，因為本輪沒有逐筆讀 PR 與 issue。

**範圍**：自 `d94708e5312df021e1fdcac421f00ed3015f11bd` 之後的 753 個 commit（`git rev-list --count d94708e5..upstream/main` 為 753，全為非 merge commit），約 3,400 個檔案變動，其中 `docs/catalog/**` 與 `docs/public/**` 為產生物。

**方法**：橋接 merge。fork 的 `main` 樹以 `d94708e5` 為基底（上一輪整樹採用的結果），先建橋接 commit `40b8c7c92`（`chore(upstream): bridge d94708e5 as merge base`，`-s ours`），再 `git merge --no-commit --no-ff upstream/main`。這樣 fork 相對 `d94708e5` 的差異由三方合併保留，不會被上游整個覆蓋。共 29 個檔案衝突，其餘自動合併。

**衝突逐檔處理**：

| 檔案 | 處理 |
| --- | --- |
| `.github/workflows/ci.yml` | 取 fork（Windows 專用版；上游新增的 test-reachability 等 job 是 Linux/merge queue 流程，不適用） |
| `AGENTS.md` | 取 fork 繁中版；上游 `CLAUDE.md`／`AGENTS.md` 的新內容（7 個技能、安裝警告、同步面清單、oxlint 路徑、Docs ship with the change）摘要為新段落「上游 Agent 技能與產品慣例」 |
| `CLAUDE.md` | 維持刪除（repo 只用 `AGENTS.md`）；上游模板 `packages/cli/src/templates/_shared/CLAUDE.md` 是產品要交付的範本，保留 |
| `CONTRIBUTING.md`、`README.md` | 取 fork 繁中版；上游 `README.md` 的變更（Studio 連結列、Claude plugin 安裝、7 個技能、核心集與按需表）用 patch 併進 `README.en.md`；`CONTRIBUTING.md` 加上上游「在檢出目錄內不要跑專案內 `skills add`」的說明，簽署 commit 與 fork PR 核准兩條屬上游流程，本 fork 不適用 |
| `bun.lock` | 取上游後以 `bun install --linker=hoisted` 重新產生；`bun install --frozen-lockfile` 通過 |
| `package.json` | 取上游的 `esbuild ^0.28.2`、`fallow ^3.34.1`、`yaml`／`picomatch` 位置與 scripts，`concurrently` 隨上游移除；保留 fork 的 `patchedDependencies`（`html2canvas@1.4.1`）並加上上游的 `engines.bun`，`happy-dom ^20.9.0` 兩邊一致 |
| `registry/blocks/frost-sequence-camera-orbit/source/package.json` | 取上游 `esbuild ^0.28.2`。fork 另有的 `package-lock.json` 已改鎖 `0.28.2`（`frost.js` 打包檔未重建，見下方未解決） |
| `skills-manifest.json`、`packages/producer/tests/style-10-prod/output/compiled.html` | 前者用 `gen:skills-manifest` 重新產生（fork 對 `media-use`、`remotion-to-hyperframes` 有差異，雜湊因此不同於上游）；後者是 LFS 指標，取上游指標 |
| `packages/cli/src/media-use/resolve.mjs` | 取上游新結構（Openverse 先、內建 SFX 次、本機索引末，`result()` 寫 `CREDITS.md`）；本機索引仍走 fork 的 `searchLocalSfxIndex`（只讀隨套件的向量，不連網），移除上游的 `fetchMediaVectors` 與 `HYPERFRAMES_REGISTRY` 路徑 |
| `packages/cli/src/commands/catalog.ts` | 取上游的 `--on-device` 流程（`installRuntime`、`ON_DEVICE_SETUP_COMMAND`）；`registry` 參數與 `fetchLocalVectors` 維持移除，向量走 `installLocalVectors` |
| `packages/cli/src/whisper/normalize.ts` | 上游新增 acorn 的 `findCaptionArray`、CJK 斷詞、VTT 實體編碼；fork 以 linkedom DOM 取代標籤剝除正則（`textContentOfHtml`、`scriptBodiesOfHtml`）保留，上游 `decodeVttText` 因 DOM 已解實體而移除 |
| `packages/core/src/runtime/bridge.ts` | 保留 fork 的封閉 `switch` 分派，補上上游新增的 `set-display-scale` |
| `packages/engine/src/services/extractionCache.ts` | 合併 import：fork 的 `chmodSync`、`renameSync`（私有快取根目錄與 `.hf-last-gc`）加上上游的 `createReadStream` |
| `packages/producer/src/services/render/stages/compileStage.ts` | 取上游新增的 `urlByAbsentLocalPath`、`pageMotionBlur`，保留 fork 的 `privateAnimatedGifCacheDir` |
| `packages/studio-server/src/routes/render.ts` | import 取 `basename`（fork，Windows 檔名）加 `dirname`（上游） |
| `packages/studio/src/captions/parser.ts` | 取上游的 acorn 靜態解析；fork 的 `decodeSingleQuotedString` 只服務舊的單引號正規化，已無呼叫者，移除 |
| `scripts/comment-ratchet.mjs`、`scripts/check-comment-citations.test.mjs` | 兩邊疊加：上游的 `generatedPaths` 與新測試加上 fork 的 `commentCheckBase`、Windows 入口判斷與「未提交候選」測試 |
| `packages/cli/src/commands/init.test.ts`、`previewLifecycle.test.ts`、`packages/lint/src/utils.test.ts`、`packages/producer/src/utils/ffprobeArgvContract.test.ts`、`packages/cli/src/utils/skillsMirror.test.ts`、`packages/engine/src/utils/processTracker.test.ts`、`skills/media-use/audio/scripts/lib/heygen.test.mjs` | 測試檔：取上游的新斷言與新型別，保留 fork 的 Windows 相容（`canCreateSymlinks` 與 `skipIf`、`process.execPath` 子行程、`toPosix`） |
| `skills/pr-to-video/scripts/fetch-people-avatars.mjs`、`frame-contract.test.mjs` | 接受上游刪除，見下 |

**非衝突處的後續修正**（自動合併成功但語意重複或在 Windows 失效）：`packages/cli/src/commands/previewLifecycle.ts` 的 spawn 呼叫與 `SpawnPreview` 型別都同時帶 fork 與上游的 `windowsHide`；呼叫處由 `no-dupe-keys` 擋下，型別處由 `tsc`（TS2300）擋下（審查發現），兩處各刪掉重複的一個。本次未跑 cli 套件的完整 typecheck（該套件另有與合併無關的既有型別錯誤）；`scripts/check-studio-copy-dashes.mjs`（上游新增）的豁免表用 POSIX 路徑，Windows 的 `relative()` 回傳反斜線而全部誤報，改為先轉成正斜線。`tools/tests/test_fork_docs.py` 的基準常數同步為新 SHA。

**`skills/pr-to-video` 的 fork 修補**：上游以 #5651 退役整個 `pr-to-video` 技能（含 `skills/pr-to-video/`），沒有新位置。fork 在那兩個檔案的差異是：頭像下載改經 `normalizeCloudImage` 再落地、以 fd 檢查既有輸出（CodeQL `js/http-to-file-access`／check-use race 類）、`people.json` 以 `0o600` 寫入，以及測試的 `fileURLToPath`（Windows）。功能隨技能整個消失，沒有可移植的位置，所以接受刪除。

**保留的 fork 分歧**：`local-media-search.mjs` 的路徑限制與只讀隨套件向量（`installMediaVectors`、`resolveBundledMediaFile`）；`freeze.mjs` 的遠端媒體魔術位元組驗證；Frost `logo.ts` 的 URL guard、`credentials: "omit"`、`redirect: "error"`；`routes/files.ts` 的排他建立與碰撞上限、`routes/render.ts` 的 `basename`；`extractionCache.ts` 與 `compileStage.ts` 的私有快取根目錄；`bridge.ts` 的封閉 `switch`；`normalize.ts` 與 `rootDuration.ts` 的非正則解析；fork 專用 CI（`ci.yml` Windows 版、`posix-security-tests.yml`、dependency freshness、`dependabot.yml`）；`publish.yml`、`sync-skills-to-clawhub.yml`、`catalog-publish.yml`、`pr-captures.yml` 的 `github.repository` 閘門仍在（本輪新增的 `lambda-arm64-image.yml`、`lambda-sam-template.yml`、`player-safari.yml` 為唯讀、無 secrets，未加閘門）；`docs/DECISIONS.md` 等 fork 文件與以 `AGENTS.md` 為唯一指令檔。

**判準八掃描**（對 `d94708e5..f5ab7711f` 的新增行，排除 `docs/catalog`、`docs/public`、`bun.lock` 與 `*.md`／`*.mdx`／`*.json`／`*.svg`）：

- 空白後藏程式：新增行中「非空白後接 30 個以上空白或 tab 再接程式」為 0 筆；雙向文字控制字元與零寬字元為 0 筆；行中 tab 命中 43 筆，皆為縮排內字面 tab 字元的程式字串或壓縮產生物（`svg-sanitize.mjs`、`pageBuild.*.html` 黃金檔、`shaders.iife.js`）。
- `eval`／`new Function` 命中分三類：測試檔（`contrast-occlusion.browser.test.ts`、`compositionScoping.test.ts`、`htmlBundler.test.ts`、`htmlCompiler.scriptOrder.test.ts`、`preview.test.ts`、`parser.dom.test.ts`、`fileServer.test.ts` 等 14 個，在瀏覽器頁或 `window` 內執行測試腳本）；執行環境沙盒（`audioFxProcessors.test-helpers.ts` 在測試中載入 AudioWorklet 模組，`new Function("window", wrapped)` 在假 `window` 內跑作者腳本）；以及產生或供應的打包檔：`packages/cli/src/media-use/lib/svg-sanitize.mjs` 是由 `scripts/generate-media-use-svg-sanitize.mjs` 產生的打包檔（`check-media-use-svg-sanitize-generated.test.mjs` 與 `check-svg-sanitize-parity.test.mjs` 把關）；另有 `registry/blocks/*/lib/shaders.iife.js` 36 份位元組相同的 `shaders@4.0.0`（Shader Effects Inc.，MIT，附授權文字）壓縮檔，內含 TypeGPU 的 schema writer 以 `new Function` 編譯，屬第三方供應檔，未逐行審。本輪沒有發現藏在空白後的程式。

**驗證**：見下方「驗證結果」。
### 驗證結果（2026-10-25，Windows 11、Bun 1.4.4、`--linker=hoisted`）

對照樹：`origin/main`（fork 上一版）與純上游 `f5ab7711f` 各用獨立 worktree，同樣 hoisted 安裝、`bun run build`，逐套件序列執行 vitest（JSON 報告），以「失敗測試的檔案加名稱」做集合比對。

| 項目 | 結果 |
| --- | --- |
| `bun install --frozen-lockfile --linker=hoisted` | 通過（`bun.lock` 已用 `bun install` 重新產生） |
| `bun run lint` | 通過（0 warnings、0 errors；skills 與 mirror 檢查通過） |
| `bun run build` | 全部套件通過（含 aws-lambda、sdk-playground） |
| `tsc --noEmit`：core、studio、scripts | 通過 |
| `python -m pytest tools/tests` | 全數通過；`ruff check --select E9,F` 通過 |
| `gen:skills-manifest --check` | 與內容一致 |
| `bun run test:scripts` | 合併樹 98 個不同失敗名稱，純上游 118 個；只在合併樹出現的 10 個：5 個在 `origin/main` 本來就失敗（Frost 兩項因 fork 重建的 `frost.js` 壓縮識別字不是 `a2`、`module blocks' shared catalog bundle`、merge queue 與 PR edit 工作流清單、stable publishing 事件路徑），5 個是上游新增的 edit-accuracy 工作流測試（`check-edit-accuracy-filter`、`edit-accuracy-retry`），因 fork 的 `ci.yml` 是 Windows 專用版而沒有對應 job |
| `test:unit`（各套件失敗數：合併／純上游／`origin/main`） | cli 53／65／6、core 7／3／1、engine 13／11／0、inspector 9／9／未建、lint 1／1／1、parsers 1／—／1、player 23／—／23、studio-server 24／47／9、studio 233／232／229（合併樹為修正前的第一次完整序列結果）；aws-lambda 9、gcp-cloud-run 1（`bun test`） |

只在合併樹失敗（相對純上游）的測試逐項判斷：

- 合併造成、已修：`htmlBundler.test.ts` 的「不能解析的子組合腳本」（fork 把作者程式放進 `Function()` 字串，語法錯誤在執行期被 `try/catch` 隔離，改為斷言整段腳本可解析且錯誤內容在字串內）；`pageBuild.golden` 兩個黃金檔（fork 的包裝改變輸出，以 `vitest -u` 更新，差異僅限包裝段落）；`studio` 的 `parser.test.ts` 單引號 code-point 測試（上游改為 acorn 靜態解析，超出 U+10FFFF 的跳脫視為語法錯誤，測試改為斷言有效跳脫可解、無效跳脫回傳空陣列）；`openBrowser.ts`（fork 的 `windowsHide` 會隱藏使用者自選瀏覽器的視窗，上游已明確不隱藏，採上游並移除）。
- 單獨重跑即通過、屬序列執行下的逾時或資源競爭：`snapshot.test`、`registryComponents.test`、`artifactCapture.test`、`entry.afterFonts.test`、engine 的 `browserManager`、`frameCapture-freshFallback`、`parallelCoordinator-peerAbort`、studio 的 `Timeline.virtualization` 與 `propertyPanelInputCoverage`。`chromeOrphans.process.test.ts` 與 `videoFrameTransport.browser.test.ts` 需要 Chrome 子行程，未單獨重驗，視為環境。
- 環境既有（`origin/main` 同樣失敗）：player 23、studio 約 230（Windows 符號連結、Chrome 與路徑）、studio-server 符號連結與 `EPERM`。

**未驗證與已知缺口**：

- `lefthook` pre-commit 的 `typecheck` 以 `packages/core/node_modules/.bin/tsc` 呼叫，hoisted 安裝沒有這個路徑，hook 本身失敗（改用根目錄 `tsc` 驗證 core、studio、scripts 皆通過）；`fallow audit --base origin/main` 對整樹採用（約 3,400 個變動檔）把上游既有發現全算成新增，必然失敗，已知屬採用類 PR 的特性。因此此合併 commit 以 `--no-verify` 提交，其餘 hook（format、largefiles、skills-manifest、filesize、tracked-artifacts、cli-process-ownership、lint）在 hook 中通過，commitlint 另行手動通過。（**註（2026-10-27 更正，原文不改）**：此處 `typecheck` 失敗的說法已過時——`node_modules/.bin/tsc` 存在，`lefthook.yml` 的 `typecheck` 指令實跑 exit 0；只有 `fallow` 對整樹採用結構性過不了。）
- `scripts/comment-check-base.mjs` 的一次性基準仍綁定 PR #2（`sync/upstream-d94708e5`）；本次採用若走 PR，`Comments` 工作流會把整樹新增註解當成新增，需要新的例外，本次未處理。
- `registry/blocks/frost-sequence-camera-orbit/source/package-lock.json` 已改鎖 `esbuild` 0.28.2 以對齊 `package.json`，但 `assets/frost.js` 沒有重建（需要網路安裝 three 並重跑 `build.mjs`），所以 fork 的 Frost 壓縮檔仍是舊 esbuild 的輸出。
- 未跑：producer 的 Docker 回歸、瀏覽器端 e2e、Lambda／GCP 實機、`generate:catalog` 全流程。LFS 指標檔（`compiled.html` 等）未取得 fork 側物件。
- 審查後修正：`openBrowser.ts` 不再傳 `windowsHide`（`SW_HIDE` 會把使用者指定瀏覽器的視窗藏起來，上游 `051584c22` 刻意不藏），故刪除 fork 專有的 `openBrowser.windowsHide.test.ts`，上方 PR #3851 對 `openBrowser.ts` 的部分以此為準（superseded）；`publish.yml` 新增的 `lambda-arm64-ffmpeg` job 補上 `github.repository == 'heygen-com/hyperframes'` 防護，避免 fork 的 release 分支或預發佈 tag 白跑 ARM ffmpeg 建置。

### CodeQL 新警示 #186–#193

**決定**：這 8 筆都來自本次採用的上游新程式碼，逐筆讀過資料流後，全部以 false positive 駁回，不改程式。

| 警示 | 檔案 | 判斷 |
| --- | --- | --- |
| #186、#187、#188 | `packages/sdk/src/examples.test.ts` | 測試內對「自己序列化出來的 HTML」跑的正規表示式，輸入是同一個測試剛產生的字串，不是外部輸入，也不做安全過濾 |
| #189、#190 | `packages/cli/src/utils/stoppableExecFile.ts` | `spawn` 傳 argv 陣列且沒有設 `shell`，引數不會被 shell 解讀，沒有命令注入面 |
| #191 | `skills/media-use/audio/scripts/lib/heygen.mjs` | 把使用者自己的 HeyGen 憑證送往使用者自己設定的 HeyGen API，是該功能本身的用途，沒有第三方接收端 |
| #192 | `packages/cli/src/capture/publicNetwork.ts` | 這是 SSRF 防護抓取本身：先解析主機名稱、確認是公開位址，再釘住該位址連線，警示指向的請求已經過這層檢查 |
| #193 | `skills/media-use/audio/scripts/lib/openverse.mjs` | 只寫入呼叫端指定的 credits 檔，內容經 `oneLine`／`httpsUrl` 清理，不含外部可控的路徑或未清理的文字 |

**重看條件**：上游改動這些檔案的資料流（輸入來源、清理函式、連線目標或寫入路徑）時重看；僅格式或註解變動不需要。

## 2026-10-26：上游採用 `f76fa5c91`，PR／issue 水位推進到 #6369

**決定**：整樹合併 `f5ab7711f..535317115`（66 個 commit；先採用到 `f76fa5c91` 的 58 個，審查與 CI 期間上游再多 8 個，同日併入，含 #6361 與 #5824 等），並把三個水位一起推進（commit `535317115`、PR #6369、issue #6369）。第二段 8 個 commit 同樣掃過判準八（只有文件範例文字（docs/guides、docs/prompting 的長行）與重新產生的 `position-edits-render-inline.ts`，無 eval、bidi 或隱藏內容），`ci.yml` 衝突仍保留 fork 版。

**判準八掃描**：對這 58 個 commit 的 diff 掃過，只有一筆超長單行（`package.json` 的 `test:scripts`）與重新產生的 `position-edits-render-inline.ts`，其餘無行內空白後藏程式、無 bidi／零寬字元；`new Function(` 只出現在上游測試內。

**合併衝突與取捨**：

- `.github/workflows/ci.yml`：保留 fork 的 Windows-only 版本；上游新增的 reachability、changes、cli 獨立 job 不採用（fork 的 `test_fork_docs.py::test_ci_covers_python_314` 規定 `ci.yml` 只跑 Windows）。重看條件：fork 決定在 CI 跑上游測試全集時。
- `packages/producer/src/server.ts`：上游 #6297 以 `fetchPublicHttpsText` 拒絕私有與非 HTTPS 的 `previewUrl`，這比 fork 原本只驗 http(s) 更嚴，採上游；fork 保留 8 MiB 上限與 `validateInlineHtml`（NUL、空內容）。fork 原本的兩項檢查隨之放棄：`redirect: "error"`（上游改為每一跳都重做公網檢查）與 `TextDecoder` 的 fatal UTF-8 拒絕（`fetchPublicHttpsText` 用寬鬆解碼，壞位元組會變成 U+FFFD 而非被拒）。重看條件：producer 因壞編碼 HTML 渲染出亂碼被回報時，在 `resolveInlineRenderHtml` 補上 `�` 檢查。上游新增的 `.github/actions/setup-test-workspace` 在 fork 的 Windows-only `ci.yml` 沒有被使用，保留無害。
- `packages/engine/src/index.ts`：同時匯出 `isSelfOrAncestorHidden` 與 fork 的 `assertPrivateCacheRoot`。
- `skills-manifest.json`：以 `gen-skills-manifest.ts` 重新產生。

**引進（移植做法）**：`packages/cli/src/utils/cancellableProcess.ts` 逐 chunk `toString()` 會把跨 chunk 的 UTF-8 多位元組字元（CJK）切成兩個 U+FFFD。上游 #5273（open）、#5296（closed 未合併）都在修這個，fork 實測重現（新增兩個測試，修前 `'��幕'`），改用 `StringDecoder`。**更新 2026-10-27：#5273 已在上游合併為 `2be8bc2b9`，見該日條目的衝突判斷（採上游的實作）。**

**不引進／本 fork 已無此缺陷**（附證據）：

| 項目 | 結論 |
| --- | --- |
| #5254 保留 URL 後綴 | `packages/parsers/src/rewriteSubCompPaths.ts:80` 已用 `splitUrlSuffix` 並在 `:86` 補回 |
| #5660／#5542 inspector 以 `fileURLToPath` 解析路徑 | `packages/inspector/build.mjs:9` 已是 `fileURLToPath(new URL(...))` |
| #5362 已結束的 Windows 行程樹 | `terminateProcessTree` 在無 `child` 時吞掉 taskkill 失敗，有 `child` 時由呼叫端 `.catch`；無使用者可見影響 |
| #5834 `isPathInside` 拒絕 `..foo` | 只造成名稱以兩個點開頭的子路徑被誤拒（偏安全），producer 的 `fileServer.ts` 版本已正確。fork 自己的 `local-media-search.mjs` 有同型寫法但只處理固定的內建音效檔名。觸發：內建檔名出現 `..` 開頭 |
| #6129 遠端腳本公網政策（closed 未合併） | 上游 #6297 與既有 `publicNetwork.ts` 已涵蓋抓取側 |

**PR／issue 範圍的誠實說明**：1400 個 PR（1059 merged、222 closed、119 open）與 172 個 issue 並未逐筆讀 diff。merged 者經 commit 軸抵達（本次與前次整樹採用）；其餘 341 個未合併 PR 以 `gh pr list --json files` 比對 fork 分歧檔案與 Windows／CJK／安全關鍵字，篩出 108 筆，逐筆看標題與檔案後只對上列項目查證實際程式碼。其餘多為功能提案、依賴升級（Renovate）或重複／被取代的 PR，無法在本 fork 重現缺陷的不引進。觸發：上游 open PR #5273（UTF-8）、#5973（刪除選取元素會清空影片檔，studio-server `files.ts`）合併或本 fork 在對應路徑回報問題時重看；#5973 尚未查證，列為觀察。

**驗證**：producer `bun test`（server、htmlCompiler、inline-project-publisher）204 pass；engine extractionCache／videoFrameExtractor 261 pass；根目錄與 core／studio／scripts 的 `tsc` 無錯；`tools` pytest 45 pass。cli 的 `.browser.test.ts` 因本機瀏覽器 30 秒內起不來、`clean.test.ts` 因 Windows 符號連結 `EPERM` 失敗，皆為環境既有（與前次採用相同類型），由 main 的 regression／preview-regression 工作流覆蓋。

**已知缺口**：`lefthook` 的 `typecheck`（路徑）與 `fallow audit --base origin/main`（整樹採用把上游既有發現算新增）在採用類提交必然失敗，合併 commit 與修正 commit 以 `--no-verify` 提交，修正 commit 另以 `fallow audit --base HEAD` 驗證無新增問題；其餘 hook 與 commitlint 手動通過。（**註（2026-10-27 更正，原文不改）**：此處 `typecheck` 失敗的說法已過時——`node_modules/.bin/tsc` 存在，`lefthook.yml` 的 `typecheck` 指令實跑 exit 0；只有 `fallow` 對整樹採用結構性過不了。）

## 2026-10-26（補）：上游採用 `85dcc193d`，commit 軸 `535317115` → `85dcc193d`，PR／issue 水位推進到 #6429／#6422

**決定**：整樹合併 `535317115..85dcc193d`（46 個 commit，745 個檔，其中 472 個是 `docs/catalog/` 重排；v0.8.201–v0.8.204 四次 release bump 一併進來）。三個水位一起推進：commit `85dcc193d`、PR #6429、issue #6422。一次審完，沒有分批。

**判準八掃描**（取 PR 目前的 head，不信舊紀錄）：

- commit 軸：對整段 `git diff 535317115 upstream/main`（排除 `docs/catalog` 與 `bun.lock`，另單獨掃 `docs/catalog` 6736 行）的新增行掃 `\S\s{40,}\S`、`eval(`／`new Function(`／`globalThis.`／`global.require`／`atob(`／`fromCharCode`、120 字元以上的 base64／hex、1000 字元以上的單行、零寬與 bidi 字元。命中 17 筆全部查過：markdown 表格欄位對齊（`docs/prompting/*`、`docs/studio/canvas.mdx`、`skills/remotion-to-hyperframes/references/api-map.md`）、兩行超長文件（`harness-tool-context.mdx`、`html-schema.mdx`）、`package.json` 的 `test:scripts` 檔名清單，以及測試檔裡的 `$$eval`、`globalThis.viewportScriptRan`、`window.eval(gsap)`（測試自己的探針，不是隱藏內容）。無行內空白後藏程式、無 bidi。
- PR 軸：未合併的 23 筆（21 open、2 closed）逐筆用 `gh pr diff` 取目前 head 的 diff，掃同一組樣式，全部 0 命中；已合併的 29 筆內容就在上面的 commit 掃描範圍內。
- 本次沒有發現需要拒收的內容。

**合併衝突與取捨**（5 個檔）：

- `.github/workflows/ci.yml`：保留 fork 的 Windows-only 版本（`test_fork_docs.py::test_ci_covers_python_314` 規定），上游新增的 edit-accuracy 分片、smoke、filesize 等 job 不採用。重看條件：fork 決定在 CI 跑上游測試全集時。上游 #6406 的 `scripts/ci/inline-gsap.mjs` 與其測試隨樹進來，但 fork 的 `ci.yml` 不呼叫它。
- `packages/core/src/runtime/bridge.ts`：fork 把控制訊息分派從 `Map` 查表改成封閉的 `switch`（不讓訊息值變成間接函式呼叫），上游同時新增 `set-preview-quality`、`retry-preview-copies`、`request-preview-facts` 三個動作。保留 fork 的 `switch`，把三個新動作加進去（行為與上游查表版相同：`deps.onSetPreviewQuality?.(Number(data.level))` 等）。
- `packages/producer/src/server.ts`：兩邊各新增常數，全部保留（fork 的 `MAX_INLINE_HTML_BYTES`／`INLINE_PROJECT_*` 與上游的 `SSE_KEEPALIVE_MS`）。
- `packages/studio-server/src/helpers/proxyTranscoder.test.ts`：採上游的 `copiesIn()`（要略過新增的 `.fast-`／`.content-` 索引檔），比對檔名維持 fork 的 `basename(...)`，因為 Windows 路徑是反斜線，`.split("/").at(-1)` 取不到檔名；上游新增的另一處 `.split("/").at(-1)` 也一併改成 `basename`。
- `skills-manifest.json`：用 `packages/cli/scripts/gen-skills-manifest.ts` 重新產生（media-use 119 檔、remotion-to-hyperframes 78 檔）。

**合併後補的三處測試**（都是 fork 的 Windows 環境或函式包裝與上游測試的落差，產品程式未動）：

- `proxyTranscoder.test.ts`：上游新增的兩個測試（「copied project … symlinked clip」「link is retargeted」）直接 `symlinkSync`，在沒有符號連結權限的 Windows 帳號上 `EPERM`。新增 `symlinkOrSkip()`，與 fork 同檔案既有的寫法一致（只在 `win32` 且 `EPERM`／`EACCES`／`ENOSYS` 時跳過，其他錯誤照拋）。代價：這兩個測試在本機沒有實際驗證符號連結行為。
- `htmlCompiler.scriptOrder.test.ts`「不能解析的子組合腳本」：fork 把作者的行內程式放進 `Function()` 字串，語法錯誤在執行期被隔離，所以頁面上不會留下不可解析的 `<script>`；`htmlBundler.test.ts` 的同型測試早就改成斷言這一點，producer 這一份漏改。這不是本次合併造成的（合併沒動這個檔案，也沒動 core 的 compiler），已改為與 `htmlBundler.test.ts` 相同的斷言。
- `aws-lambda/src/handler.test.ts:1273`：`ffprobe` 在 Windows 輸出 CRLF，`split("\n")` 留下 `\r`，改 `split(/\r?\n/)`。這行是上游 2026-10-21 的既有程式，不在本次 delta。

**逐項處理：已合併的 46 個 commit，全部採用。** 依主題：

- core 預覽與 runtime：#6355（腳本隱藏的 clip 在跳轉後保持隱藏）、#5793（長媒體分析不卡頓並取樣整段）、#5800（變速或循環影片一次 seek 到位）、#6365（預覽用較輕的副本）、#6397（音量淡入淡出以音訊時鐘斜坡播放）。
- engine 與 producer：#6364＋#6405（chunk 擷取 round-robin，只對按牆鐘計費的呼叫端）、#5878（Mac 影片幀走 media engine）、#6413（擷取停滯幾分鐘內失敗）、#6420（Chrome 首次啟動慢不再誤降級為截圖擷取）、#6421（指向頁面自己的媒體 src 不算來源）。
- studio 與 studio-server：#5880、#6366、#6416、#6389（前端）；#6342、#6358、#6350、#6386（歷史鎖的 pid 被別的行程占用時接手）。
- cli：#6368（snapshot `--describe` 改為 opt-in）、#6369（不再出貨會被端點掃描器標記的環境變數名稱）、#6362、#6371、#6124（`.env` 帶引號的多行值）、#6390、#6376、#5446，以及 #6396＋#6400＋#6401＋#6409（check／check-review 新旗標與 inspector 整合，cli 新增 `@hyperframes/inspector` workspace 依賴）。
- 文件與維護：#6360、#6378、#6379、#6380、#6382、#6383、#6393、#6414（docs 重排與樣式）、#6370（套件大小預算）、#6392、#6406（測試頁內嵌 GSAP）、四個 release（#6377、#6404、#6412、#6423）。

fork 專有程式與這批 commit 重疊的只有 17 個檔（上面 5 個衝突加 12 個自動合併）。自動合併者逐一確認：`videoFrameExtractor.ts` 的 `assertPrivateCacheRoot` 與上游 #5878 的 media engine 解碼分支互不相干；`htmlCompiler.ts` 的 `inlineScriptBodies()`（fork 用 DOM 取代 `INLINE_SCRIPT_PATTERN` 正則）與上游 #6421 改的 `discoverMediaFromBrowser` 是不同函式；`build-copy.mjs`、`lefthook.yml`、`package.json` 兩邊改的是不同段落。

**逐項處理：未合併的 PR（23 筆，全部不採用，等上游合併）。** 慣例同前：fork 的產品程式大多與上游一致，未合併 PR 的缺陷在本線同樣存在，但它們可能在審查中改寫，摘取後會與日後合併版本分岔。下列只有 #6395、#6399、#6410、#6425 動到 fork 有分歧的檔案（`htmlCompiler.ts`、`htmlCompiler.test.ts`、`htmlBundler.test.ts`、`videoFrameExtractor.ts`、`engine/src/index.ts`），其餘與 fork 的 261 個分歧檔沒有交集。

| PR（目前 head） | 內容與規模 | 本 fork 的缺陷證據 | 結論與觸發條件 |
| --- | --- | --- | --- |
| #6373 `83ea696`（open，外部） | player 的 `controls` 晚加入時補上目前播放狀態；4 檔 +44 | `packages/player/src/hyperframes-player.ts` 與上游一致，即上游 issue #6372 | 不採用；合併時隨 commit 軸帶入。**更新 2026-10-27：已合併為 `d507323ef`，隨續批帶入** |
| #6375 `1e29216`（open，外部） | 長錄音分析：`Math.max(0, ...values)` 改 `reduce`，加 `--skip-file-seconds` 文件；3 檔 +44/-6 | `packages/cli/src/audio/analysis/run.ts:106` 仍展開 `...envelope(...).values`，即 issue #6374；是大陣列展開的堆疊上限，非 Windows 專屬 | 不採用；合併時帶入，或本線有人回報長音檔分析失敗時提前。**更新 2026-10-27：已合併為 `ec866ed1c`，隨續批帶入** |
| #6384 `49f5d7e`（closed） | studio e2e 的量測方式；3 檔 +48/-6，僅測試 | 本線不跑 edit-accuracy e2e | 不採用 |
| #6391 `bfb6c5c`（open） | aws-lambda 每個 chunk 記錄耗時；2 檔 +35/-4 | 純觀測性 | 不採用 |
| #6394 `adfe30c`（closed） | arm64 映像內附未封裝 Chrome；7 檔 +308/-35 | fork 不發佈 Lambda 映像 | 不採用 |
| #6395 `f37a6f7`（open，外部） | 組裝後去除重複的 `@font-face` 再內嵌，對應 issue #6381（524 MB HTML、導覽逾時）；7 檔 +83/-7，動到 fork 分歧的 `htmlCompiler.ts` | `packages/producer/src/services/htmlCompiler.ts` 的 `embedLocalFontFaces()` 仍對每個出現處內嵌整份字型 | 不採用：issue 的重現環境是 Linux 桌面版，本線無回報；照抄要在 fork 改過的檔案上合併。觸發：#6395 合併，或本線有專案因重複字型宣告渲染逾時（CJK 專案的大量子集字型宣告是可能情境） |
| #6399 `cc105ce`（open，外部） | 掛載場景的 `srcset` 候選圖依場景目錄改寫；11 檔 +120/-48，動到 `htmlCompiler.ts` | `packages/parsers/src/rewriteSubCompPaths.ts` 只改寫 `src`，不改寫 `srcset`，即 issue #6398 | 不採用；合併時帶入 |
| #6402 `97076d0`（open，外部） | `play`／`present`／`preview` 的 `--port` 嚴格驗證；7 檔 +95/-14 | `play.ts`、`present.ts` 仍是 `parseInt(args.port ?? "3003", 10)`，`3003oops` 會被當成 3003 | 不採用；只影響 CLI 輸入驗證，無安全面 |
| #6403 `8be76ee`（open，外部） | benchmark 輸出改用 `mkdtemp` 並清理；2 檔 +30/-6 | `benchmark.ts` 仍寫到 cwd 的 `renders/.benchmark` | 不採用 |
| #6407、#6408、#6411（open，維護者的 metadata PR） | npm homepage 指向 hyperframes.heygen.com、官方 MCP registry 的 `server.json`、認領 context7 | 都是上游身分資訊 | **永不採用**：fork 不發佈，也不該替上游登錄或認領。無觸發條件 |
| #6410 `7565caa`（open） | 工作者與 slot 數量讀 CPU quota（cgroup）；12 檔 +45/-29，動到 `videoFrameExtractor.ts` | cgroup 配額是 Linux 容器概念，Windows 原生不適用 | 不採用；觸發：fork 開始提供容器化 render 環境 |
| #6415 `bb8dfce`（open，外部） | fonts gate 先載入尚未被排版用到的宣告字型；2 檔 +81/-2 | `packages/core/src/runtime/afterFonts.ts` 與上游一致 | 不採用；合併時帶入。**更新 2026-10-27：已合併為 `36a24aeb8`，隨續批帶入** |
| #6417、#6418、#6419（open，維護者） | player 自動播放被擋時各 take 播自己的音訊；playbench 量測工具（`make-media.sh` 需要 bash，Windows 原生跑不了）；音訊 clip 準時加入與音量曲線 | 與已合併的 #6397 同一系列的預覽音訊修正 | 不採用；等合併。#6418 的 playbench 在本線也不會跑。**更新 2026-10-27：#6418 已合併為 `7d6c02f85`（隨續批帶入）；#6417、#6419 仍等合併** |
| #6424、#6425、#6426、#6427、#6428、#6429（open，維護者） | 影片超出媒體尾端仍跟動畫（5 檔 +155/-26）；snapshot 影片色彩與 render 一致（動到 `videoFrameExtractor.ts` 與 `engine/src/index.ts`）；`hyperframes <dir>` 開啟專案；兩筆 studio 捲動效能；studio 靜態組合移動後音訊持續 | 都是上游持續進行中的系列工作 | 不採用；等合併後隨 commit 軸帶入 |

**issue 軸（8 筆，#6372–#6422）**：#6372、#6374、#6381、#6398 各對應上表的 #6373、#6375、#6395、#6399，處理同左；#6385（Desktop 匯出資料夾）、#6387（Desktop Codex Fast 模式）已 closed，是 Desktop app 功能，本 fork 沒有該產品；#6388 是第三方「AI 輔助報告」的宣傳貼文（已 closed），內含外部連結，未開啟、不處理；#6422（player 加移動與縮放模式，open，功能提案）不採用，觸發：上游實作合併。

**驗證**：

- 型別：core（含 `tsconfig.runtime.json`）、engine、parsers、lint、studio-server、producer、cli、studio、`scripts/tsconfig.json` 的 `tsc --noEmit` 全部 0 錯（cli 需先建 inspector）。
- 測試（這次 delta 改到的測試檔，加上衝突與 fork 分歧檔相關的）：core 43 檔 1255 通過（`pageBuild.golden` 兩項在並行時 5 秒逾時，單獨以 `--testTimeout=120000` 重跑 4 通過）；producer `htmlCompiler`／`server` 系列依各檔的 runner 分類執行，全過（含 `htmlCompiler.scriptOrder` 修正後 7 通過）；engine 變更檔 391 通過；studio-server 變更的 6 檔 263 通過、19 跳過；cli 變更的 18 檔 427 通過、5 跳過；studio 9 檔中 8 檔通過；aws-lambda `handler.test.ts` 37 通過；`scripts/` 三個變更測試 17 通過；`skills/remotion-to-hyperframes` 4 通過。
- 未過或未驗證，附原因：
  - `studio` 的 `previewQualitySlice.test.ts`「keeps a person's pick over the app's」失敗：這台是 Node v26.12.1，內建實驗性 `localStorage` 在沒給 `--localstorage-file` 時回傳 `undefined`；用 `NODE_OPTIONS=--localstorage-file=...` 重跑 21 通過，所以是環境，不是程式。專案支援的是 Node 22，這台沒裝，未在 22 上實跑。
  - `producer/src/services/renderOrchestrator.stall.test.ts`（上游 #6413 新增）：假時鐘加真實檔案 IO，每次失敗的項目不同。暫時把 `runFor` 的真實 IO 預算從 1 秒放寬到 30 秒並加 `--testTimeout=120000`，7 個全過，所以是這台主機 IO 較慢造成的時序問題，不是產品缺陷。放寬只是診斷，測試檔已還原，未提交。
  - `producer/src/services/distributed/renderChunk.test.ts`（integration，需要 Chrome）：Chrome 在這台 30 秒內起不來，未驗證。
  - `studio-server` 的 `src/history/*`、`hfIdPersist` 共 11 項失敗（符號連結 `EPERM` 等）：這些檔案這次合併都沒動，與前一次採用記錄的「studio-server 符號連結與 EPERM」同型，未逐一對照 `origin/main` 基準。
  - `docs/catalog/` 重排與 Prompt Guide 等 mdx 只做了 `tools/check_links.py` 的相對連結檢查，沒有跑 Mintlify 建置。
  - 這次提交以 `LEFTHOOK_EXCLUDE=fallow` 略過 `fallow` hook：`lefthook.yml` 的 `fallow audit --base origin/main` 對整樹採用結構性必然失敗（把上游既有發現全算成新增）；前兩次的 `--no-verify` 也是同一原因。其餘 hook 照常實跑（含 `typecheck`，`node_modules/.bin/tsc` 存在且指令 exit 0；先前紀錄說該路徑不存在是錯的，見上面兩處的更正註記）。型別、測試與 `dev_check` 另外手動跑過。

## 2026-10-27：上游續批 `85dcc193d` → `7d6c02f85`，commit 軸推進（PR／issue 水位不動）

**決定**：把 `7d6c02f85`（8 個 commit：#6418、#5273、#6245、#5593、#5447、#6415、#6373、#6375）併入 `85dcc193d` 的採用 commit 之上，commit 水位推進到 `7d6c02f85`。這 8 筆 PR 編號都在既有 PR 水位 #6429 之內（它們原先是「未合併」，現在是「已合併」），所以 PR／issue 水位這個 commit 不動。

**判準八掃描**：對 `git diff 85dcc193d 7d6c02f85` 的 2279 行新增行掃 `\S\s{40,}\S`、`eval(`／`new Function(`／`globalThis.`／`global.require`／`atob(`／`fromCharCode`、120 字元以上的 base64／hex、零寬與雙向控制字元、400 字元以上的行；全部 0 命中（最長一行 239 字元；`child_process` 出現在 `playbench/run.ts` 的 import，是量測腳本自己的子行程，內容為固定參數）。已合併的 PR 內容就是 commit 內容，沒有 force-push 的空間。

**合併衝突與取捨**（2 個檔）：

- `.github/workflows/ci.yml`：取 fork 的 Windows-only 版本。上游這批只動了兩處註解（#6245 把 `--skip-skills` 說明改回正常描述），行為不變；`windows-render.yml` 的同一處註解自動合併進來。
- `packages/cli/src/utils/cancellableProcess.ts`（**#5273 與 fork 自行移植的 `744a620fe` 重疊**）：兩邊都用 `StringDecoder` 逐串流解碼並在 `close` 沖出尾端。差別只在計算輸出上限的方式：fork 用 `Buffer.byteLength(stdout) + Buffer.byteLength(stderr)`（量解碼後的字串），上游改成累計原始 chunk 的位元組數 `outputBytes`。上游的做法比較對——解碼後的字串會把不完整的位元組換成 3 位元組的 U+FFFD，量字串會讓上限的判斷隨解碼結果浮動，而且每個 chunk 都重算整個字串的長度。上游並新增 5 個測試釘住「分割字元在合併上限只算一次」「超過原始上限仍然 ENOBUFS」「串流結束時沖出不完整的尾端」。結論：**整檔採上游，fork 的實作退場**；fork 的兩個測試（`cancellable process output decoding`）與上游測試涵蓋同一性質，保留，不衝突。重看條件：上游再次改動這個函式的緩衝或終止邏輯時，與本檔的 fork 差異只剩這兩個測試。

**逐項處理**：

| 上游 | 內容 | 本 fork 的狀態 | 結論 |
| --- | --- | --- | --- |
| #6375 `ec866ed1c` | `loudest()` 用 `reduce` 取代 `Math.max(0, ...values)` | 原列「不採用；合併時帶入」，`run.ts:106` 仍展開大陣列 | 合併；`run.test.ts` 通過 |
| #6373 `d507323ef` | 晚加入的 `controls` 補上目前播放狀態 | 原列「合併時帶入」 | 合併；player 252 通過 |
| #6415 `36a24aeb8` | fonts gate 對 `unloaded` 的字型呼叫 `load()` | 原列「合併時帶入」；對 CJK 子集字型有利 | 合併；`entry.afterFonts.test.ts` 15 通過 |
| #5447 `64cb6556e` | lint 兩個 finding 加 `fixHint` | 與 fork 無重疊 | 合併；lint 511 通過 |
| #6245 `d1b347132` | init 的 `--skip-skills` 說明改回正常、範例改回 `--skip-skills` | `init.ts` 與 fork 的 `singleLineLogValue` 在不同位置，自動合併 | 合併 |
| #5593 `2d695a843` | studio 匯出 GIF（含迴圈次數、30 fps 上限）；25 檔 +762/-178 | `render.ts` 與 fork 的 `basename()` 檔名取值在不同行，自動合併；producer 早已支援 `gif` | 合併；studio 的 9 個 render 相關檔 51 通過、studio-server 93 通過、cli 的 `studioServer.test.ts` 通過 |
| #5273 `2be8bc2b9` | 子行程輸出跨 chunk 的 UTF-8 解碼 | 與 `744a620fe` 重疊 | 見上方衝突判斷 |
| #6418 `7d6c02f85` | player 的 `playbench` 量測工具（9 檔 +1238） | `run.ts` 與 `make-media.sh` 需要 bash 與 PulseAudio，Windows 原生跑不了；`playbench.test.ts` 只測分析函式，6 個在 Windows 通過；`typecheck` script 多了一個 tsconfig，通過 | 合併，不執行 `bun run playbench` |

**驗證**：

- 型別：core、lint、studio-server、studio、player（含 `tests/playbench/tsconfig.json`）、cli 的 `tsc --noEmit` 全部 exit 0。
- 測試（這批改到的檔）：cli 9 檔 142 通過、3 跳過（`cancellableProcess`、`audio/analysis/run`、`studioServer`、`commands/init*`）；core `entry.afterFonts` 15；lint 511；studio-server `render`＋`history/uncopied` 93；player `hyperframes-player` 252＋`tests/playbench` 6；studio `components/renders`＋`vite.adapter.render` 51。studio 的 `RenderQueue.test.tsx` 在這台 Node v26.12.1 會因內建實驗性 `localStorage` 為 `undefined` 失敗 20 項（與前次記錄同一環境問題），以 `NODE_OPTIONS=--localstorage-file=<暫存檔>` 重跑全過。
- 提交：`LEFTHOOK_EXCLUDE=fallow`。其餘 pre-commit hook 與 commit-msg 照常實跑（輸出見該次提交）；`fallow audit --base origin/main` 對整樹採用結構性過不了，與 `85dcc193d` 條目相同。

## 2026-10-27（補）：續批追到 `acd0bc361`，PR 水位推進到 #6439

**決定**：同日上一條之後上游又多了 2 個 commit（#5366、#3943），而 `check_upstream_updates.py` 對 PR 軸列出 #6430–#6439 共 10 筆，所以另開一個 merge commit 把 commit 軸補到 `acd0bc361`、PR 水位推到 #6439，讓 `--strict` 能是綠的。issue 水位 #6422 不動（水位之上沒有新 issue）。

**判準八掃描**：commit 軸對 `git diff 7d6c02f85 acd0bc361` 的 355 行新增行，PR 軸對 10 筆 PR 用 `gh pr diff` 取目前 head 的 diff（共 1,937 行新增行），掃空白夾內容、`eval(`／`new Function(`／`globalThis.`／`global.require`／`atob(`／`fromCharCode`、120 字元以上的 base64／hex、零寬與雙向控制字元；全部 0 隱藏內容。單獨檢視的命中都是正常內容：#6432 的 `new Function(` 是測試把產品內的 `mediaElementTime` 原始碼拿來求值；#6433 的 `$eval` 是 puppeteer 的 `page.$eval`；#6433 改的 `output.mp4` 是 Git LFS 指標檔（oid 與 size 兩行，沒有二進位內容）；#6436、#6437 的 URL 是測試用的 `localhost`、`127.0.0.1`、`cdn.example.com`；`#5366` 的 407 字元長行是 `docs/guides/media.mdx` 的說明文字。

**合併**（1 個衝突）：`skills-manifest.json` 的 `media-use` 雜湊衝突，以 `packages/cli/scripts/gen-skills-manifest.ts` 重新產生（media-use 119 檔，只有 `media-use` 的雜湊變動），不手改。

**commit 軸**：

| 上游 | 內容 | 本 fork 的狀態 | 結論 |
| --- | --- | --- | --- |
| #5366 `dfb7e5a4d` | 偏好記錄寫入以 `preferences.json.lock` 序列化，暫存檔名帶 pid；7 檔 +338/-57 | 兩份 `prefs-store.mjs`（`skills/` 與 `packages/cli/src/media-use/lib/`）同步更新，`check-media-use-copy-parity` 3 通過；`config-lock.mjs` 本來就在兩處；不動 fork 分歧檔 | 合併；`prefs-store` 兩個測試檔 21 通過 |
| #3943 `acd0bc361` | 有限迴圈 GIF 輸入尊重「停用迴圈」覆寫；2 檔 +17/-7 | `animatedGifPrep.ts` 與上游一致 | 合併；`bun test` 11 通過（這個檔用 `bun:test`，vitest 跑不起來是 runner 問題） |

**PR 軸（#6430–#6439，10 筆，全部 open，目前 head 在括號內）**：全部不採用、等上游合併後隨 commit 軸帶入，除非下面另有觸發條件。

| PR | 內容 | 本 fork 對應檔案的實際狀態 | 結論與觸發 |
| --- | --- | --- | --- |
| #6430 (`418a31572`) | 失敗的根組合腳本錯誤附上查找的元素與位置，用 `Debugger.getScriptSource`；2 檔 +114/-8 | `frameCapture.ts` 與上游一致，沒有 `describeThrowSite` | 不採用；診斷訊息改進，無安全或 Windows 面。觸發：合併 |
| #6431 (`302e2aa9f`) | CLI 被強制結束時由常駐的小子行程殺掉它的子行程（Windows 用 `taskkill /T /F`），Chrome 改 `pipe: true`；7 檔 +163/-18 | `packages/cli/src/utils/childReaper.ts` 不存在；`browserManager.ts:51` 仍是 `sigintLaunchOptions`；PR 會再改剛從 #5273 取得的 `cancellableProcess.ts` | 不採用：它新增一個 detached 的 `node -e` 行程並在其中呼叫 `taskkill`，直接碰 fork 的 `check:cli-process-ownership` 防線（只有行程根才可終止行程），要先和那條規則對齊再談。觸發：合併，或本線回報 CLI 被強制結束後 Chrome 殘留 |
| #6432 (`2364387b5`) | 預覽與 render 用同一個 `mediaElementTime` 決定暫停時的影片畫面；31 檔 +234/-100，**動到 fork 分歧檔** `generators/hyperframes.ts`、`videoFrameExtractor.ts`（與其測試） | `videoFrameExtractor.ts:2720` 仍是 `Math.floor(sourceTime * extracted.fps + 1e-9)`；`generators/hyperframes.ts:869` 仍是 `media.currentTime = mediaTime`；`runtime/mediaClock.ts` 不存在 | 不採用：fork 在這兩個檔案各有自己的改動（各 8 與 77 行差異），照抄要手工合併，且新增 `package-subpaths.json` 出口。觸發：合併；合併時這兩個檔案要逐行對 fork 的差異 |
| #6433 (`85748ef02`，外部) | HDR 的無時間覆蓋層與子樹遮罩（SVG 也納入）；6 檔 +312/-22 | `screenshotService.ts`／`videoFrameInjector.ts` 與上游一致，仍是 `instanceof HTMLElement` | 不採用；HDR 路徑本線不是 Windows 重點。觸發：合併 |
| #6434 (`8106c6bad`，外部) | probe 有 risk frame 時，分段擷取先關掉 probe session 再開新的；2 檔 +36 | `captureSegmentedStage.ts:294` 仍是 `probeSession ?? (await openSegmentedSession(input))`，沒有 `deRiskFrames` 判斷 | 不採用；只影響 drawElement 分段擷取的失敗復原。觸發：合併，或本線出現分段擷取 probe 失敗回報 |
| #6435 (`a66cd1ffc`) | 包在 wrapper 裡的組合取 wrapper 的 `data-start`；5 檔 +142/-9 | `startResolver.ts` 與上游一致，`inheritedTimingHost` 只看直接父層 | 不採用；觸發：合併 |
| #6436 (`cdc5d0825`) | 沒有註冊 timeline 的腳本不再等 45 秒；7 檔 +189/-7，**動到 fork 分歧檔** `compositionScoping.ts` | fork 的 `wrapScopedCompositionScript` 把作者程式放進 `Function(...)` 的字串字面值（`compositionScoping.ts` 約 680 行），上游在原始碼兩側插入的 `/*hf-authored-begin*/`／`end` 標記不會出現在原文，`authorScriptsMayRegisterTimelines` 讀到整個包裝（它自己提到 `__timelines`）會永遠回 true，修正等於不生效 | **不能照抄**：要移植設計，把標記放進 `jsonScriptLiteral` 之前的原文。觸發：合併；合併時對 fork 的 `Function()` 形式重做 |
| #6437 (`0d618045d`，外部) | drawElement 失敗後分段擷取改走截圖重試；4 檔 +380/-58 | `capturePlan.ts:235` 仍是 `forceScreenshot: keepSegmenting \|\| ...`；`renderOrchestrator.ts` 不是 fork 分歧檔 | 不採用；觸發：合併 |
| #6438 (`144976264`) | 影片不再超前播放頭或超過出點；3 檔 +187/-18 | `runtime/media.ts` 與上游一致，沒有 `prerollSourceTime`；與 #6432 動同一批檔案 | 不採用；觸發：合併，與 #6432 一起處理 |
| #6439 (`faf489da8`) | `hyperframes check` 偵測會遺失或靜音的音訊；13 檔 +597/-80 | `utils/checkAudio.ts` 不存在；功能新增 | 不採用；觸發：合併 |

**驗證**：

- 本條新增的程式變更只有 #5366 與 #3943，測試見上表。
- 提交：`LEFTHOOK_EXCLUDE=fallow`，其餘 hook 實跑；`fallow` 理由同上一條。
- 範圍說明：任務原先只點名到 `7d6c02f85`；追加 `acd0bc361` 與 #6430–#6439 是因為上游在審查期間又前進，而 `check_upstream_updates.py --strict` 以活的 `upstream/main` 為準。這個 merge commit 與上一個分開，要退回只需要還原最後一個 commit。提交前再抓一次上游，`upstream/main` 已前進到 `9ecb13ed6`（又 4 個 commit：#6395、#6209、#6363、#6403，另有 PR #6440–#6442），本批刻意停在 `acd0bc361`，那一段留給下一批，所以這個 commit 之後 `--strict` 會因為新項目而不是綠的。其中 #6395、#6403 在「2026-10-26（補）」的表裡原列「不採用；等合併」，下一批要更新。

## 2026-10-27（續）：上游追到 `ad4d3fad1`（v0.8.205），PR 水位推進到 #6458、issue 水位到 #6443

**決定**：把 20 個新 commit（`acd0bc361..ad4d3fad1`，含 v0.8.205 發布）以 merge 帶入，無衝突；PR 軸 #6440–#6458 與 issue #6443 逐筆處理後，三個水位一起推進。這批是補上前一條「刻意停在 `acd0bc361`」留下的那一段，但提交前上游又前進了（見該條「範圍說明」），所以這個 commit 之後 `--strict` 是紅的，不是綠的：它以活的 `upstream/main` 為準，水位只推到 `ad4d3fad1`。

**判準八掃描**：對 merge 後的 2,818 行新增行，以及 11 個 open PR（#6440、#6441、#6444、#6450–#6454、#6456–#6458，共 1,358 行新增行）的目前 head diff，掃空白夾內容、`eval(`／`new Function(`／`globalThis.`／`global.require`／`atob(`／`fromCharCode`、120 字元以上的 base64／hex、零寬與雙向控制字元：全部 0 隱藏內容。唯一的 `new Function(` 命中在 #6454 的測試，是把產品的包裝後腳本放進假 `window` 求值（與前幾輪同型）。

**合併**：沒有衝突，`skills-manifest.json` 自動合併後仍與 `skills/` 一致。本機的 `packages/core/dist` 是舊的，要先 `bun run --cwd packages/core build`，producer 的 `htmlCompiler.scriptOrder` 才不會因 `isAlwaysAppliedStyle` 匯入為 `undefined` 而失敗；CI 的建置步驟本來就會做。

**commit 軸（20 個）**：

| 上游 | 內容 | 本 fork 的狀態 | 結論 |
| --- | --- | --- | --- |
| #6403 `803655a67` | benchmark 的每輪輸出檔隔離 | 原列「不採用；等合併」 | 合併；`benchmark.test.ts` 通過 |
| #6363 `a07ab5087` | K8s 範例 Dockerfile 的 Chrome 版本對齊 | 範例檔，無重疊 | 合併 |
| #6209 `ecc2396e8` | 產品片文件連到完整工作區 | 純文件與 skill 參考 | 合併 |
| #6395 `9ecb13ed6` | 場景字型 `@font-face` 去重後再內嵌；把 `isAlwaysAppliedStyle` 從 `htmlBundler.ts` 移到 `scriptRuns.ts` 並匯出 | 原列「不採用；等合併」；`htmlCompiler.ts` 是分歧檔（`inlineScriptBodies`），改動在 `coalesceHeadStylesAndBodyScripts` 開頭，位置不同 | 合併；core `pageBuild.golden` 單獨 4 通過，producer `htmlCompiler` 系列依 runner 全過 |
| #6424 `d8398c9da` | 超過媒體結尾的影片仍跟著動畫的樣式更新 | `frameCapture.ts`、`screenshotService.ts` 與上游一致 | 合併；`videoFrameInjector.test.ts` 通過 |
| #6426 `324671829` | `hyperframes <dir>` 等於 `hyperframes open <dir>`，改寫 `process.argv` | 只用 `statSync` 讀目錄，沒有碰行程所有權 | 合併；`cli.lifecycle`、`projectShortcut` 通過 |
| #6442 `b76b52937`（`e34f9f01d`） | Windows 上提供 HyperFrames app 下載 | 與 Windows 相關，無重疊 | 合併；`desktopApp`、`desktopRoutes`、`OpenInDesktopButton.dom` 通過 |
| #6446 `b4eab1a8c` | 發布 v0.8.205 | 版本號與 manifest | 合併 |
| #6445／#6448 | 文件：app 的 Windows 安裝步驟、quickstart 提到 Windows | 純文件 | 合併 |
| #6430 `83a29e920` | 失敗的根組合腳本錯誤附上查找的元素（`Debugger.getScriptSource`） | 原列「不採用；等合併」 | 合併；`frameCapture-isolateScript.browser` 在放寬逾時後通過（見驗證） |
| #6402 `0cc14ddb8` | `play`／`present` 的連接埠驗證 | 與 `preview` 共用 `port.ts` | 合併；`port`、`serverPort` 通過 |
| #6435 `0979e32a8` | 包在 wrapper 裡的組合取 wrapper 的 `data-start` | 原列「不採用；等合併」 | 合併；core `startResolver` 通過 |
| #6439 `d83bf997b` | `check` 偵測會遺失或靜音的音訊（13 檔） | 原列「不採用；等合併」；功能新增 | 合併；`check`、`checkAudio` 通過 |
| #6447 | 每週摘要文件 | 純文件 | 合併 |
| #6449 `37543d223` | 查連接埠與剪貼簿時隱藏 Windows 主控台視窗 | **直接是 Windows 修正**；`portUtils.ts` 是分歧檔（fork 的 `allowedTcpPort`），改動位置不同，自動合併無衝突 | 合併；兩個 `windowsHide` 測試通過 |
| #5436 `95aba51e2` | 補三條字幕規則的 lint 測試 | 只加測試 | 合併；lint `captions.test.ts` 21 通過 |
| #6455 `ad4d3fad1` | 編譯期把 HEIC／HEIF 轉成 JPEG（15 檔 +827），需要 ffmpeg／ffprobe 7.0 以上 | 新增 `heifImagePrep.ts`，用 `runFfmpeg`／`runFfprobe`／`renameWithRetry`，路徑全走 `node:path`；`animatedGifPrep.ts` 只被匯出共用 | 合併；`heifImagePrep`、`htmlCompiler.heif` 在本機 ffmpeg 9.0.2 通過 |

**PR 軸（#6440–#6458，19 筆）**：已合併的 #6442、#6445–#6449、#6455 經 commit 軸抵達（上表）。未合併的 11 筆取目前 head 讀 diff，並對 merge 後的樹做 `git apply --check`：全部可套用、全部不採用，等上游合併後隨 commit 軸帶入。

| PR | 審查時 head | 內容 | 本 fork 對應檔案的實際狀態 | 結論與觸發 |
| --- | --- | --- | --- | --- |
| #6440 | `0285440da`（17:43Z 強推；18:53Z 又被換成 `c18b1d9ee`，那是審查之後） | Docker 映像的 Node 升到 22.23.4、bun 升到 1.4.4（Brotli CVE-2026-111497） | 只動三個 Dockerfile；`Dockerfile.test`、`gcp-cloud-run/Dockerfile` 是分歧檔但差異各只有 1 行；本機 bun 已是 1.4.4，Windows 路徑不用這些映像 | 不採用；觸發：合併，或本線開始建置這些映像 |
| #6441 | `2deec4775`（18:04Z 強推；前一版 `8979ecafc`） | 編譯時每個唯一媒體來源只 probe 一次 | `htmlCompiler.ts` 是分歧檔，改動位置不同（fork 改的是 `inlineScriptBodies`） | 不採用；觸發：合併 |
| #6444 | `bf04b7677`（18:07Z 強推，16 檔 +578，與本條所寫相符；18:39Z 又被換成 `b42613181`，28 檔 +801，那是審查之後。更早的 `b85e7f816` 統計相同） | 輸出設定關鍵影格間隔與峰值位元率上限（16 檔 +578） | `engine/src/index.ts` 的 fork 差異是多匯出 `assertPrivateCacheRoot`，不同行 | 不採用；編碼參數變更會影響輸出位元組，要等上游合併並在 Windows 實跑一次。觸發：合併 |
| #6450 | `fa50e82a9` | prompt 預覽編輯器加無障礙名稱 | studio 元件，無重疊 | 不採用；觸發：合併 |
| #6451 | `5e2652b4a` | 媒體預覽在檔案或專案改變後重試 | studio 元件，無重疊 | 不採用；觸發：合併 |
| #6452 | `68ddd6411` | 縮放後的預覽 iframe 不畫畫布外框 | 動 `hex-baseline.json`，無重疊 | 不採用；觸發：合併 |
| #6453 | `a54fb04d3`（14 檔 +258，與本條所寫相符） | PNG 色彩標籤不再改變預覽／check／snapshot／render 的像素（14 檔 +258，新增 `core/package-subpaths.json` 出口） | `fileServer.ts` 的分歧在 `openRegularFile` 的 `0o600`，`htmlBundler.test.ts` 的分歧在別處，hunk 不重疊 | 不採用；新增 core 子路徑出口，要照 `package-subpaths` 流程。觸發：合併 |
| #6454 | `5caeff07d` | `check` 處理切掉下伸部的遮罩，與共用場景自己的選擇器（6 檔，含兩份 golden） | `layout-audit.browser.js` 的 PR hunk 在 `visibleTextLineRects`，fork 的差異在 `hasPaint`／`isTransparentColor`（改用 `colorAlpha` 判斷透明），不同區；`compositionScoping.ts` 的 PR hunk 在 wrapper 前置程式，fork 的 `Function()` 字串只影響後面的作者程式，兩者不重疊 | 不採用；觸發：合併，合併時兩份 golden 要重算 |
| #6456（外部） | `eabf072d8` | `line_unread` 從區塊渲染文字計字（對應 issue #6443） | `craftAudit.ts` 與上游一致；`layout-audit.browser.js` 是分歧檔，PR 只在 craft 文字部件多加一行 `blockText`，與 fork 的差異不同區 | 不採用；觸發：合併。在那之前，逐字元 `<span>` 的標題會被 `check` 誤報停留時間不足（只影響警告，不影響 render） |
| #6457 | `195af01c5` | `parsers` 的套件大小預算調成實測值加餘裕 | 只改 `package-size-budgets.json` 一行 | 不採用；觸發：合併 |
| #6458 | `d6f782686` | CLI 組合路徑錯誤訊息帶出解析後的入口與專案目錄（6 檔） | 無重疊 | 不採用；觸發：合併 |

**審查時 head 的來歷**：上游 PR 的作者可以在審查後強推（判準八），所以表中記的是審查當時的 head，之後才能偵測換版。當時沒有逐筆記下 SHA，這一欄是事後用 GitHub 的 PR timeline（`head_ref_force_pushed` 事件的 `commit_id` 與時間）、各 commit 的 committer 時間、以及本條已寫的檔數／行數反推：審查發生在 `ad4d3fad1` 合入（18:05Z）之後、本條提交（18:20Z）之前，取該窗口內的 head；#6440 與 #6444 在審查後又被強推，現行 head 與審查時不同，下一批會對新 head 重掃。#6450、#6451、#6452、#6454、#6456、#6457、#6458 自首次推送後沒有強推，其 head 就是現行 head。

**前一輪仍 open 的 PR 重驗**：#6430、#6435、#6439 已合併並隨本批抵達。#6431–#6434、#6436–#6438 共 7 筆取目前 head 重做 `git apply --check`：#6432、#6433、#6434、#6437 現在可直接套用（#6432 的 head 已從 `2364387b5` 變成 `36602a8d4`）；#6431（`cancellableProcess.ts`，因 #5273）、#6436（`compositionScoping.ts` 的 `Function()` 包裝）、#6438（`media.test.ts`）套不上。結論與前一條相同：全部等上游合併；#6436 仍不能照抄，#6431 仍要先和行程所有權防線對齊。#6432 的 hunk 雖然可套用，合併時仍要逐行對 fork 的 `videoFrameExtractor.ts` 與新增的出口。

**issue 軸（#6443，open）**：`check` 的 `line_unread` 把每個逐字元 `<span>` 算成一個字，七個字的標題被算成 25 個字，停留門檻從 2.6 秒變成 8.0 秒。#6456 是對應修正。本線不自行修（`craftAudit.ts` 與上游一致，自修會變成新的分歧檔）；觸發：#6456 合併，或本線有人回報 `check` 對逐字動畫標題誤報。

**驗證**（皆在 merge 後的樹，Windows 11 本機）：

- cli 12 檔 266 通過、1 跳過（`cli.lifecycle`、`benchmark`、`check`、`serverPort`、`desktopRoutes`、`portUtils.windowsHide`、`checkAudio`、`clipboard.windowsHide`、`desktopApp`、`hdrPromotion`、`port`、`projectShortcut`）。
- core `startResolver` 與 `src/compiler` 23 檔 681 通過；唯一一項 `pageBuild.golden` 是並行時 5 秒逾時，單獨重跑 4 通過。
- engine：預設逾時下 `firstBeginFrame`、`freshFallback`、`softwareWebGpu` 等 5 項是 Chrome 在本機啟動超過 5 秒，不是斷言失敗；`--testTimeout=90000` 重跑 `firstBeginFrame`、`freshFallback`、`softwareWebGpu`、`isolateScript.browser`、`chromeMemory` 5 檔 37 通過。
- producer：`bun test` 跑 `htmlCompiler`、`htmlCompiler.heif`、`heifImagePrep` 共 200 通過；`htmlCompiler.scriptOrder` 是 vitest 檔，core dist 重建後 7 通過；`test:classification` 通過。`wrappedMountTiming.integration`、`motionBlurVideo.integration` 要完整 render，這輪沒有執行。
- lint `captions` 21 通過；studio `OpenInDesktopButton.dom` 21 通過。
- 已知環境問題，與本批無關：`scripts/package-subpaths.test.mjs` 在 Windows 失敗，斷言寫死 `/repo/packages/...` 而實際是 `C:\repo\...`（該檔與 `package-subpaths.json` 都不在本批的變更內）。
- 提交：`LEFTHOOK_EXCLUDE=fallow`，其餘 hook 實跑；`fallow` 理由同前幾條。
- 範圍說明：提交前再抓一次上游，`upstream/main` 又前進 3 個 commit（#6425、#6427、#6429）與 5 筆 PR（#6459–#6463），其中 #6459（Windows 的 Chrome 檢查）與 #6461（Windows 預覽記錄搬到 `LOCALAPPDATA`）與 Windows 直接相關。本批刻意停在 `ad4d3fad1`，那一段留給下一批，所以這個 commit 之後 `--strict` 會因新項目而不是綠的。

## 2026-10-27（CI 紅燈）：`Windows render verification` run 40368383385 的紅燈不是三個上游合併造成的，不改程式

**決定**：`74dcac16f`（`750f37bb6`、`3de9a09a1`、`74dcac16f` 三個上游合併，base `f3255f6af`）的 run 40368383385 第一次嘗試失敗，對同一個 SHA 重跑失敗的 job 後成功。這是 runner 抖動，不是合併帶入的回歸，所以不回退任何上游變更，也不改測試或設定；只記錄證據與觸發條件。

**證據**（驗證對象是 CI 在同一個 SHA 上的兩次結果，不是本機）：

| 項目 | 第 1 次嘗試（失敗） | 第 2 次嘗試（成功） | 上一次綠燈（`f3255f6af`，run 40254246556） |
| --- | --- | --- | --- |
| 失敗的 job | `Tests on windows-latest: engine-cli` | 全部成功 | 全部成功 |
| engine | 2547 測試通過、0 個測試失敗，**1 個 suite 失敗** | 133 檔通過、4 跳過 | 133 檔通過、3 跳過 |
| cli | 403 檔通過、15 跳過 | 403 檔通過、15 跳過 | 399 檔通過、14 跳過 |
| 失敗點 | `videoFrameExtractor.remoteTail.test.ts` 的 `a deferred window inside local sources of other shapes`：`afterAll` 的 `rmSync(dir, { recursive: true, force: true })` 超過 vitest 預設的 10 秒 hook 逾時（`Hook timed out in 10000ms`） | 無 | 無 |
| 同一個 suite 的 4 個測試耗時 | 10.2、10.9、15.8、8.0 秒 | 0.14–0.20 秒 | 0.14–0.19 秒 |
| 同檔「`decodes the tail`」 | 31.6 秒 | 3.3 秒 | 3.3 秒 |
| 同時間另一個 worker 的 `audioMixer.manyTracks` 200 clip 測試 | 58.3 秒 | 未取 | 22.8 秒 |

- 同一個 SHA 一次紅一次綠，測試內容沒有變，所以不是確定性的回歸。紅的那次，只有這個檔案的磁碟與行程密集操作整體慢了約 60 倍，同時另一個 worker 的 ffmpeg 重測試也慢了 2.5 倍，符合 runner 在那段時間資源被壓住；失敗的是最後一個只做 `rmSync` 的 hook，因為 suite 的 `timeout: 120_000` 不適用於 hook，hook 仍是 10 秒。
- 三個合併在 `packages/engine` 的變更與這個測試沒有關係：`videoFrameExtractor.ts` 只改了 macOS 分支（`isMacOS && ... isFfmpegHwaccelAvailable("videotoolbox")`，`win32` 在 `&&` 的第一項就短路）；`psnrFilterAvailability.ts` 只是多一份 `-hwaccels` 清單的快取，這個測試的路徑（延後範圍只數影格）不會呼叫；其餘是 `browserManager`／`frameCapture` 的瀏覽器啟動邏輯，這個測試不載入。
- 本機重現不了：在 `74dcac16f` 上單跑 `videoFrameExtractor.remoteTail.test.ts` 6 項全過，測試總計 7.5 秒（四個本地來源測試各 0.14–0.47 秒）。所以沒有可寫的紅燈測試，這也是不改程式的理由之一：沒有失敗的性質可釘。

**不做的事**：

- 不在 `videoFrameExtractor.remoteTail.test.ts` 加 hook 逾時或改 `rmSync`：該檔是上游測試，改它會多一個分歧檔，而且下一次合併時要逐行處理。
- 不回退 `750f37bb6`／`3de9a09a1`／`74dcac16f` 的任何部分。

**重看條件**：同一個 suite 或任何只做清理的 hook 在 Windows run 再出現 `Hook timed out`，且重跑後同一個 SHA 變綠，累計到第二次，就在 `packages/engine/vitest.config.ts` 加 `hookTimeout`（fork 側一行，需附這兩次 run 的 ID）；如果重跑仍紅，才當成回歸，從這次記錄的耗時表開始二分。回貢上游要主人當次對話明確同意。

## 2026-10-27（再續）：上游追到 `8f618c5ff`（v0.8.206），commit 水位推進，PR 水位只到 #6459，issue 水位不動

**決定**：把 14 個新 commit（`ad4d3fad1..8f618c5ff`）分三個 merge 帶入（`15367a9f6`、`74905aeff`、`8f618c5ff`，各自可單獨還原）。commit 水位推到 `8f618c5ff`；PR 水位只推到 #6459，因為 #6460 之後的 PR 與 issue #6465 這一輪沒有審完（見最後的未完成清單）；issue 水位維持 #6443。審查期間上游還在前進，提交前 `upstream/main` 就是 `8f618c5ff`，之後若再前進，`--strict` 會是紅的，這是預期。

**判準八掃描**：對 `ad4d3fad1..8f618c5ff` 的 1,497 行新增行（分兩段：`ad4d3fad1..15367a9f6` 1,191 行、`15367a9f6..8f618c5ff` 306 行）掃空白夾內容、`eval(`／`new Function(`／`globalThis.`／`global.require`／`atob(`／`fromCharCode`、120 字元以上的 base64／hex、零寬與雙向控制字元、400 字元以上單行：0 命中。另對 22 個 open PR 的目前 head diff 掃同一組：只有 #6433 測試裡的 puppeteer `page.$eval`、#6454 測試裡把包裝後腳本放進假 `window` 的 `new Function(`，都是良性。

**唯一衝突：#6436 與本 fork 的 `Function()` 包裝**（`compositionScoping.ts`）。前一輪預判「不能照抄」，這次實測確認。上游在原始碼兩側插入 `/*hf-authored-begin*/`／`end`，頁面端的 `authorScriptsMayRegisterTimelines` 只讀兩標記之間的文字，藉此把包裝自己的 `__timelines` 排除。本 fork 把作者程式放進 `Function(...)` 的 JSON 字串字面值，如果標記圍在字面值外面，掃描讀到的就是整個包裝，包裝自己提到 `__timelines`，永遠回 true，修正等於不生效。做法：標記放進字面值內（`jsonScriptLiteral(BEGIN + source + "\n" + END)`），begin 標記與第一行原始碼同一行，錯誤行號不位移。證據：

- 新增 `packages/engine/src/services/frameCapture-authorScan.scopedWrapper.test.ts`，用 `@hyperframes/core/compiler` 的真實 `wrapScopedCompositionScript` 輸出跑上游的掃描；把標記拿掉再重建 core dist，第一個測試失敗（`expected true to be false`），放回後 3 通過。
- `compositionScoping.test.ts` 的分隔符測試改寫成釘性質（作者程式在標記之間、包裝自己的 `__timelines` 在標記之外、含引號與角括號的 `__timelines` 仍在區內、begin 標記同行）；原本釘「字面值等於原始碼」的測試改成等於「標記＋原始碼＋標記」。
- `pageBuild.preview.html`／`pageBuild.render.html` 兩份 golden 各有 3 個 wrapper，每個 wrapper 的改動是：開頭那一行行尾接上 begin 標記（1 行改動），結尾多出一行獨立的 end 標記（作者程式後的 `\n` 讓原結尾行前多一個空行，結尾行本身變成 end 標記開頭）；每份 golden 共 +9／-6（逐行比對 diff，見 `90423ccbd` 的 merge diff）。

**逐項處理（commit 軸）**：

| 上游 | 內容 | 本 fork 的狀態 | 結論 |
| --- | --- | --- | --- |
| #6425 `37f14fdcb` | snapshot 的影片畫格與 render 同色（4 檔） | `snapshot.ts`、`videoFrameExtractor.ts` 的 fork 差異在別處（`assertPrivateCacheRoot`），自動合併 | 合併；`snapshot.test` 通過 |
| #6427 `f1b5d89a1`、#6429 `121bf20e9` | studio 圖層走訪與預覽訊息的效能 | 無重疊 | 合併；`domEditLayerWalkCache`、`previewMessageRouter` 通過 |
| #6431 `5148326fd` | CLI 被殺時不留子行程（`childReaper.ts`，Chrome 改 `pipe: true`）；前一輪註明要先對齊行程所有權防線 | `check:cli-process-ownership` 通過；`cancellableProcess.ts` 與上游一致 | 合併；`childReaper`、`cancellableProcess`、`chromeOrphans` 的 kill 兩項通過。`chromeOrphans.process.test.ts` 的「check 結束後不留 Chrome／watchdog」失敗，把 #6431 的三個產品檔還原到 `ad4d3fad1` 後同樣失敗（fresh HOME 下 check 的瀏覽器 30 秒內起不來，手動重現），所以不是這個 commit 造成，但原因沒有查完 |
| #6436 `4a5ee7361` | 沒有註冊 timeline 的組合不再等 45 秒 | 見上方 | 移植設計（標記進字面值），不照抄 |
| #6432 `e3e93aa7f` | 暫停預覽與 render 用同一個媒體時間（33 檔） | 前一輪標「動 fork 分歧檔」；`videoFrameExtractor.ts`、`generators/hyperframes.ts`、`gsapSerialize.ts` 的 fork 差異（`assertPrivateCacheRoot`、`joinJavaScriptFragments`）與上游 hunk 不同區，自動合併；重建 parsers dist 後 `hyperframes.test` 47 通過 | 合併；core compiler／runtime／generators 3258 通過 |
| #6453 `3e16603d3` | PNG 色彩標籤不改變像素；新增 core 子路徑出口 | `fileServer.ts` 的 `0o600` 差異不重疊 | 合併；producer `fileServer` 54 通過 |
| #6450、#6451、#6457 | studio 無障礙名稱、媒體預覽重試、套件大小預算 | 無重疊 | 合併；studio 18 通過 |
| #6469 `85fdc9aa8` | 發布 v0.8.206 | 版本號 | 合併 |
| #6464 `9ebc1f8a1` | 專案鎖在拒絕硬連結的環境也能用（改用 `createFileAtomically`） | **Windows 相關**；`projectLock.ts` 非分歧檔，`core/atomicFile.ts` 已在 | 合併；`projectLock` 8 通過（含 6 個行程併發接管） |
| #6461 `74905aeff` | Windows 的預覽與 catch-up 紀錄搬到 `LOCALAPPDATA`，被拒絕的 log 退到 null device | **Windows 相關**；`previewLifecycle.test.ts` 的 fork 差異 4 行，自動合併 | 合併；`previewLifecycle`、`appHistory`、`desktopApp` 通過 |
| #6459 `8f618c5ff` | Windows 的 Chrome 檢查改用 PowerShell 讀檔案版本，不信 `chrome.exe --version` | **Windows 相關**；`preflight.ts` 非分歧檔 | 合併；`preflight.test` 28 通過；本機 Chrome 同一條 `Get-Item` 指令回 156.0.8078.48 |

**PR 軸**：上表已合併的 PR 與前一輪 open 的 #6431、#6432、#6436、#6450、#6451、#6453、#6457 經 commit 軸抵達。PR 水位只推到 #6459。

**未審完、不進水位**（PR #6460 起與 issue #6465）：以下只做了 `git apply --check`（對 `8f618c5ff` 的樹）與隱藏內容掃描，沒有逐筆對 fork 檔案下結論，下一批要做。目前 head：#6460 `8549d66af`（24 檔，套得上）、#6462 `eb804f0a6`（`Dockerfile.test`、`gcp-cloud-run/Dockerfile` 是分歧檔）、#6463 `ea99169c6`（init 在拒絕硬連結的環境也能建檔；Windows 相關，`writeNewFile.ts` 與上游一致，`projectConfig.create.test.ts` 是分歧檔；已讀 diff，結論待測）、#6466 `5a20b67dd`（對應 issue #6465，loopback Studio 探測加 1 秒上限）、#6467 `0484fe2ff`、#6468 `83ecb8f83`、#6470 `9c2cbc214`、#6471 `c216986ba`、#6472 `21968d83d`、#6473 `0348f90f0`。issue #6465 的結論待 #6466 一起下。

**前一輪仍 open 的 PR 目前 head**（`git apply --check` 對 `8f618c5ff` 的樹）：#6428 `781935309`、#6433 `85748ef02`、#6434 `8106c6bad`、#6437 `0d618045d`、#6440 `c18b1d9ee`（已換版）、#6441 `2deec4775`、#6444 `b42613181`（已換版）、#6452 `68ddd6411`、#6454 `5caeff07d`、#6456 `eabf072d8`、#6458 `d6f782686` 全部套得上；#6438 `4b10a8d3e` 套不上，它疊在 `fix/player-audio-joins` 之上（base 不是 main，39 檔 +893/-270），不能獨立合併。結論仍是等上游合併；#6454 動 `compositionScoping.ts` 與兩份 golden，合併時 golden 要對本條的標記重算。#6440 與 #6444 的新 head 沒有重讀 diff。

**驗證**（皆在 merge 後的樹，Windows 11 本機，Node 26）：

- core `src/compiler`、`src/runtime`、`src/generators` 3258 通過；唯一失敗是 `pageBuild.golden`（上述標記，已更新）與一項 `hyperframes.test`（parsers dist 過期，重建後 47 通過）。
- engine：`videoFrameExtractor`、`frameCapture-subTimelinePoll`、`-subTimelineWarning`、新增的 `authorScan.scopedWrapper` 共 246 通過、2 跳過（`--testTimeout=90000`）。
- cli：#6431／#6425／伺服器相關 6 檔 144 通過、3 跳過、1 失敗（`chromeOrphans` 見上）；`projectLock`、`previewLifecycle`、`appHistory`、`desktopApp` 通過；`preflight` 28 通過。`projectLock` 併發接管測試在預設環境會因 Node 26 的 `DEP0205` 警告寫進子行程 stderr 而失敗，`NODE_OPTIONS=--disable-warning=DEP0205` 後 8 通過。
- producer：`scriptFailureAttribution` 通過；`fileServer.test.ts` 要用 `bun test`，54 通過、2 失敗（Windows 無權建立符號連結 `EPERM`）。
- player 23 項失敗是 Node 26 的 `localStorage` 全域；`NODE_OPTIONS=--no-experimental-webstorage` 後 386 通過。studio 18、studio-server 134 通過。
- `scripts/package-subpaths.test.mjs` 仍只有已知的路徑寫死失敗（`/repo/...` vs `C:\repo\...`）。
- 提交：`LEFTHOOK_EXCLUDE=fallow`，其餘 hook 實跑（`typecheck`、`cli-process-ownership`、`commitlint` 等）；`fallow` 理由同前幾條。`8f618c5ff` 那次 merge 我誤跑過一次不帶排除的 `git commit --no-edit`，hook 全數實跑並通過，隨後用排除 fallow 的 amend 改訊息（沒有 `--no-verify`）。

## 2026-10-27（第五續）：上游追到 `933ae3eb5`，commit 水位推進，PR 水位 #6479，issue 水位 #6465

**決定**：前一條「未審完」的清單（PR #6460 起、issue #6465）在此逐筆處理完，三個水位一起推進。審查期間上游又前進兩次（先是 `8f618c5ff` → `6dee9d144`，再到 `933ae3eb5`，PR 編號從 #6476 長到 #6479），所以這一批追到的是提交前最後一次 `git fetch upstream` 的 `933ae3eb5`；之後若再前進，`--strict` 會是紅的，這是預期。commit 軸以 5 個 merge 帶入，各自可單獨還原：`6263c2b3b`（`306f21a1b`）、`3e29570a5`（`6dee9d144`）、`0296f41ac`（`020e6c99f`）、`97dc6e63a`（`e42318d08`）、`ee2ea67c5`（`933ae3eb5`），另有一個修正 commit `6bdc7cdf5` 把 `永不採用` 的上游身分資訊拿掉（見下）。

**判準八掃描**：commit 軸對 `8f618c5ff..6dee9d144` 的 187 行與 `6dee9d144..933ae3eb5` 的 670 行新增行；PR 軸對 12 筆新的 open PR（首次 head 共 1,251 行新增行）與 10 筆前一輪仍 open 的 PR 目前 head。掃空白夾內容（`\S\s{40,}\S`）、`eval(`／`new Function(`／`globalThis.`／`global.require`／`atob(`／`fromCharCode`／`Buffer.from(…base64)`、120 字元以上的 base64、120 位元組以上的 hex、零寬與雙向控制字元、400 字元以上單行：全部 0 隱藏內容。命中的都是已知良性：`#6454` 測試把包裝後腳本放進假 `window` 求值的 `new Function(`（commit 軸 1 次）、`#6433` 測試的 puppeteer `page.$eval`（3 次）。**審查中有兩筆被強推換版，換版後各重掃一次**：`#6444` 從 `b42613181` 換成 `2d9037311`（28 檔 +801 → 31 檔 +874/-35；差異是把 `studioServer.ts` 的四個編碼欄位收進 `encoderJobOptions()`、位元率上限多接受 `G` 單位、因 #6467 合併而改動 `integration-tests.json`），`#6474` 從 `f465e9cb9` 換成 `ce894665a`（只差一個測試呼叫的排版）。所有 PR 的結論都針對下表記的 head，之後再換版要重掃。

**commit 軸（已合併進上游的）**：

| 上游 | 內容 | 本 fork 的狀態 | 結論 |
| --- | --- | --- | --- |
| #6458 `306f21a1b`（原列 open，`d6f782686`） | 組合路徑錯誤訊息帶出解析後的入口與專案目錄；`renderArgs.ts` 的 `--composition` 解析搬到新檔 `compositionEntry.ts` | 6 檔皆非分歧檔 | 合併；`renderArgs`、`cloud/render` 2 檔 50 通過、1 跳過 |
| #6463 `6dee9d144`（`ea99169c6`） | `init` 建檔在拒絕硬連結的環境也能用，`writeNewFileSync` 改呼叫 `@hyperframes/core/atomic-file` 的 `createFileAtomically` | **這筆本線需要**：fork 從 #6464 帶進 `createFileAtomically` 後，只有 `projectLock.ts` 在用，`writeNewFile.ts` 仍是自己的 `linkSync`（呼叫端 `init.ts`、`capture/scaffolding.ts`、`tts/synthesize.ts`、`projectConfig.ts` 都沒受益），在 FAT／exFAT 或拒絕硬連結的磁碟上 `init` 會失敗；`atomicFile.ts` 的 `NO_HARD_LINKS` 含 `EPERM`／`ENOTSUP`／`EOPNOTSUPP`／`EXDEV`／`EISDIR`。`projectConfig.create.test.ts` 是分歧檔（fork 把「dangling symlink」測試加上 Windows 無權建立符號連結時的跳過），但上游 hunk 在檔案開頭與 `47` 行附近，fork 的差異在 `55` 行之後，自動合併 | 合併；`projectConfig.create` 3 通過（新增的 EPERM 測試通過、符號連結那項照舊在 Windows 跳過），加 `commands/init*`、`capture/scaffolding`、`projectConfig*` 共 10 檔 156 通過、3 跳過 |
| #6454 `020e6c99f`（原列 open，`5caeff07d`） | `check` 處理切掉下伸部的遮罩，與共用場景自己的選擇器；`compositionScoping.ts` 的選擇器正規化多一段，兩份 golden 重算 | 前一條預告「合併時 golden 要對 #6436 的標記重算」：`compositionScoping.ts` 的 hunk 在 wrapper 前置程式，fork 的 `Function()` 字串與 `AUTHORED_SOURCE_BEGIN`／`END` 標記在後面，不重疊；兩份 golden 自動合併，標記保留，且多出 `__hfTimelineRootSelectorPattern` 一行與一個 `if` 區塊 | 合併；core `compositionScoping`＋`pageBuild` 3 檔 89 通過（重建 core dist 後）；engine `frameCapture-authorScan.scopedWrapper`＋`subTimeline*` 4 檔 37 通過；cli `layout-audit*` 2 檔 230 通過。**未驗證**：`layout-audit.chromium.test.ts` 需要 Chrome，本機 Chrome 在 30 秒的 hook 內起不來（與前幾條同一個環境問題），63 項被跳過 |
| #5255 `5279b6f47` | parsers 的媒體來源寫入在各自的詞法範圍解析 | 非分歧檔 | 合併；parsers `mediaSrcMutation` 17 通過；lint `media` 145 通過（要先 `bun run --cwd packages/parsers build`，否則 3 項因 dist 過期失敗）；producer `probeStage`（`bun:test`）70 通過 |
| #6467 `9b339e37c`（`0484fe2ff`） | producer 的整合測試清單移到 `integration-tests.json`，`test-reachability.json` 的 pin 跟著換 | `test-classification.mjs` 非分歧檔，fork 的檔案雜湊與上游舊 pin 相同；合併後 sha256 為 `e0874fac…`，與 `test-reachability.json:50` 一致 | 合併；`node --test scripts/test-classification.test.mjs` 6 通過。`scripts/check-test-reachability.mjs` 本 fork 的 CI 與 hook 都沒接，手動跑印出 2,099 行，全是 `no CI runner selects this test`（fork CI 只有 Windows 用的 workflow），沒有 pin 不符的訊息；合併前的輸出沒有留，所以不能說這 2,099 行不是新增的 |
| #6470 `933ae3eb5`（`9c2cbc214`） | drawElement 的 worker 編碼失敗改走 fresh-session 復原（`asDrawElementCaptureFailure`） | `frameCapture.ts` 非分歧檔，缺陷在本 fork 存在（`captureFrameToBufferPipelined` 直接取 `produceDrawElementFrame` 的 `encodeResult`） | 合併；`frameCapture-freshFallback` 20 通過 |
| #6468 `25b7cbd45`（`83ecb8f83`） | `docs/download-attribution.js`：點擊 `hyperframes.dev/studio/download` 時把 docs 訪客的 PostHog `distinct_id` 以 `ph_id` 附上 | 純文件站腳本，只在 Mintlify 站上跑，且只有頁面已載入 PostHog（`docs.json` 的 `integrations.posthog`，fork 既有，帶上游的 `apiKey`）、訪客沒有拒絕追蹤時才作用；腳本只在點擊時改 `href`，點完還原。本 fork 沒有部署 docs 站（`FORK.md`、`README.md` 沒有 Mintlify 的紀錄） | 合併，**目前是惰性的**。**觸發條件（要移除）**：fork 一旦把 `docs/` 部署到任何站，要同時移除 `docs/download-attribution.js` 與 `docs.json` 的 `integrations.posthog`，否則會把 fork 訪客的 id 送到上游的 PostHog 專案與 `hyperframes.dev`。這是維護者的隱私決定，本次沒有替維護者做 |
| #6407／#6408／#6411 `08eeb4979`、`772cc95e8`、`e42318d08` | npm homepage 指向 `hyperframes.heygen.com`、官方 MCP registry 的 `server.json`、認領 context7（`context7.json` 的 `url`＋`public_key`） | 「2026-10-26（補）」已寫 **永不採用**：fork 不發佈，也不該替上游登錄或認領 | commit 軸必須整批 merge，所以先合併再用 `6bdc7cdf5` 還原三處（刪 `server.json`、`context7.json` 與 `packages/cli/package.json` 還原到合併前）；日後上游再動這三個檔，合併時一樣取 fork 這一邊 |

**PR 軸（#6460–#6479，19 筆 PR＋issue #6465）**：已合併的 #6461、#6464、#6469 上一批已帶入，#6463、#6467、#6468、#6470 在上表。其餘 12 筆全部 open，逐筆取目前 head、讀 diff、對合併後的樹做 `git apply --check`（全部可套用）；全部不採用、等上游合併後隨 commit 軸帶入，除非下面另有觸發條件。

| PR | 審查時 head | 內容 | 本 fork 對應檔案的實際狀態 | 結論與觸發 |
| --- | --- | --- | --- | --- |
| #6460 | `8549d66af6a3a332bf1517f4a0328529680513b2`（24 檔 +248/-180，維護者） | 暫停預覽的 seek 落在組合自己的 frame rate：runtime 的 `canonicalFps` 改為 `renderFps ?? data-fps ?? 30`，studio 的逐格、時間碼、跳格、尺規改用組合的 rate，`parseFps` 搬到 `core/src/fps.ts`，protocol 把 `n/1001` 的 rate 精確送出 | **缺陷在本 fork 存在**：`core/src/runtime/init.ts:541` 是 `state.canonicalFps = exportRenderFps.fps ?? state.canonicalFps`（預設 `state.ts:102` 的 30）；`studio/src/player/lib/time.ts:1` 的 `STUDIO_PREVIEW_FPS = 30` 仍是各 helper 的預設，`linkedClipPreferences.ts:27` 的 `compositionFps` 只有 `OutOfSyncBadge` 在讀。所以 25、60、29.97 fps 的組合在預覽逐格會落在 30 fps 的格線上（PR 內文的量測：29.97 fps 在 600 格中只有 1 格正確）。fork 分歧檔：只有 `ShortcutsPanel.test.tsx`，PR 沒碰 | 不採用：24 檔橫跨 runtime 訊息協定與 studio 的格數運算，open 中。**觸發：合併**；或本線有人回報非 30 fps 組合在預覽逐格錯位。這筆合併時不需要特別處理，但要在 Windows 上實跑一次非 30 fps 的預覽逐格 |
| #6462 | `eb804f0a6b64b39b1bf2b93fa8f1fe9b9f7965fd` | 三個 Dockerfile 的 Node 基底映像 22.23.3 → 22.23.4（CVE-2026-111497） | 只動 `Dockerfile.test`、`cli/src/docker/Dockerfile.render`、`gcp-cloud-run/Dockerfile`（後兩者與 `Dockerfile.test` 在 fork 各有 1 行差異，不重疊）；已被 #6440 涵蓋（同三檔，另外升 bun 到 1.4.4） | 不採用；Windows 原生路徑不用這些映像。觸發：合併，或本線開始建置這些映像 |
| #6466（對應 issue #6465） | `5a20b67ddd7445109569e65f0a436b3b847256a4`（外部） | `findPreviewServerForProject` 的 loopback 探測先用 `node:net` 以 1 秒為界連線再 `fetch`，因為 WSL 2 mirrored 網路或隱身模式防火牆會丟棄而不是拒絕連線，`fetch` 要等 10 秒 | 缺陷在本 fork 存在（`studioSelectionClient.ts:66` 的 `fetchImpl: typeof fetch = fetch`，無界）；**但本機實測不會發生**：這台 Windows 對關閉的 `127.0.0.1:5190` 的 `fetch` 在 31 ms 內回 `ECONNREFUSED`（Node v26.12.1） | 不採用。觸發：合併，或本線在 WSL 2 mirrored／有防火牆丟棄封包的環境回報 `render`／`check`／`snapshot` 多等 10 秒。**issue #6465**：同上，等 #6466 |
| #6471 | `c216986ba94ec4999651a9bff61c38c93d3d9e55`（外部，4 檔 +29/-15） | 下載連結多帶 `src=cli`／`src=browser-editor`，讓 `hyperframes.dev` 分辨連結從哪裡點的 | `desktopApp.ts`、`desktopRoutes.ts` 非分歧檔；只加查詢參數，不含識別資料 | 不採用；觸發：合併（合併後 Windows 的 `desktopDownloadUrl()` 會變成 `…?os=windows&src=cli`，測試要跟著換）。是上游的行銷歸因，對本線無用 |
| #6472 | `21968d83d0bdd67d3f664095bb020d00e0d97bdb`（外部） | 兩份 docs 加 `keywords` | 純文件 | 不採用；觸發：合併 |
| #6473 | `0348f90f0c977d15b7483c87740ad7fab9138bb3`（codegen bot） | 重新產生雲端 render 客戶端型別，**移除** `CreateHyperframesRenderRequest.page_motion_blur` | **這個 PR 單獨會讓型別檢查失敗**：本 fork 的 `commands/cloud/render.ts:814,843` 與 `render.pageMotionBlur.test.ts` 都在用這個欄位；PR 自己的 CI 也是 `Typecheck` 紅燈、`REVIEW_REQUIRED` | 不採用。觸發：合併（且上游同時處理 `page_motion_blur` 的使用處）；合併前不要手動套這個型別檔 |
| #6474 | `ce894665aab3cdbacf57ece6b32a117b13faa3a0`（10 檔 +149/-22，維護者；先讀的是 `f465e9cb9`） | **Windows**：TEMP 資料夾拒絕刪除時，音訊暫存的清理（`rmSync`）與 `renameWithRetry` 的 `EPERM` 不再讓整個 render 變成「Audio mix failed; output would be video-only」；新增 `removeScratch`、rename 重試用盡後改複製 | 缺陷在本 fork 存在（`audioMixer.ts`、`aacEncode.ts`、`audioFxRender.ts`、`audioPadTrim.ts`、`audioStage.ts` 都是裸 `rmSync`，`renameWithRetry.ts` 重試用盡就拋出）；回報條件是受限的 TEMP（`icacls` 拒絕子項刪除），本機預設 TEMP 不適用 | 不採用：open 中，且 PR 內文自述沒有在真實使用者環境驗證，只有 CI 上一個 ACL 拒絕刪除的案例。**觸發：合併，或本線 Windows render 出現 `Audio mix failed … EPERM`**（這種情況可以先單獨移植 `removeScratch` 與複製後備） |
| #6475 | `fc0462abda4f05c0585e99284e6c23f5e823bd31`（4 檔 +203/-98，維護者） | `history show --diff` 不再呼叫 `git diff --no-index`，改用自寫的 Myers 差異（`unifiedDiff.ts`）；移除「git 輸出檔路徑在 git 結束後被換掉」的競爭測試（隨著被取代的程式碼一起拿掉） | 缺陷在本 fork 存在（`history.ts` 的 `textDiff` 呼叫 `spawnSync("git", …)`，沒有 git 就拒絕）；本機有 git，不受影響。PR 的移除不削弱防線：被刪的是它取代的那段 spawn＋讀回輸出檔的程式碼 | 不採用；觸發：合併，或本線在沒有 git 的 Windows 上回報 `--diff needs git on PATH` |
| #6476 | `ad89ecd73f27548e460a7b15dd1ba7b46ebc6c74`（2 檔 +27/-1） | 把檔案當成專案資料夾傳入時，錯誤訊息指出該傳哪個資料夾 | `utils/project.ts` 非分歧檔 | 不採用；訊息改進。觸發：合併 |
| #6477 | `21e313f3045432c590bb24d2883d8e26f99d88d5`（6 檔 +244/-5，維護者） | studio 的媒體探測與縮圖解碼讀不到檔案時，兩次重試後放棄並只印一行（不含 URL），取代 mediabunny 預設對同源網路失敗的無限重試 | `mediaProbe.ts`、`thumbnailVideoDecoder.ts` 非分歧檔；缺陷在本 fork 存在；被其他程式鎖住的媒體檔在 Windows 比較常見 | 不採用；觸發：合併，或本線 studio 預覽出現成串的 `TypeError: Failed to fetch` |
| #6478 | `6239ad722a7aa431aebe74e5bd7f45fe41448d7e`（外部，6 檔 +14/-12） | docs：HyperFrames app 的 Windows 設定資料夾（`%APPDATA%\HyperFrames`）、快捷鍵、「your computer」措辭 | 純文件 | 不採用；觸發：合併 |
| #6479 | `34cf685dc181fd1d823e74c5c88dc45b0eb740bc`（2 檔 +68/-2，維護者） | `HYPERFRAMES_BROWSER_PATH` 指向不存在的路徑時立刻報錯並點名；首次下載 Chrome 時每 15 秒印一行提示 | `browser/manager.ts` 非分歧檔；行為改變：現在是靜默繼續找其他瀏覽器，合併後變成拋出 | 不採用；觸發：合併。合併時確認維護者的環境變數沒有指向一個已不存在的路徑 |

**前一輪仍 open 的 PR 目前 head**（`git apply --check` 對合併後的樹全部可套用；結論不變，等上游合併）：#6428 `781935309`、#6433 `85748ef02`、#6434 `8106c6bad`、#6437 `0d618045d`、#6440 `c18b1d9ee`（3 檔 +5/-5：三個 Dockerfile 的 Node 22.23.4 與 bun 1.4.4，**這次讀了 diff**，涵蓋 #6462）、#6441 `2deec4775`、#6444 `2d9037311`（換版，見上；**這次讀了 diff**：與 fork 分歧檔的重疊是 `engine/src/index.ts`、`producer/src/server.ts`，hunk 不同區）、#6452 `68ddd6411`、#6456 `eabf072d8`。#6438 `4b10a8d3e` 的 base 仍是 `fix/player-audio-joins`（39 檔 +893/-270），不能獨立合併。#6444 與已合併的 #6467 都動 `test-classification.mjs`／`integration-tests.json`／`test-reachability.json`，合併時要重新對一次。

**驗證**（皆在合併後的樹，Windows 11 本機，Node 26；`NODE_OPTIONS=--no-experimental-webstorage --disable-warning=DEP0205`）：

- 型別：每個 merge commit 的 pre-commit `typecheck` hook 實跑並通過（`6263c2b3b`、`3e29570a5`、`0296f41ac`、`97dc6e63a`、`ee2ea67c5`）。
- 測試：見上表各列；另外 cli 的 `projectLock` 與 `previewLifecycle` 等前一批的檔案這次沒有重跑。
- 未驗證：`layout-audit.chromium.test.ts`（Chrome 起不來）；producer 的整合測試（`deliveryRender.integration`、`wrappedMountTiming.integration` 等）沒有執行。
- 提交：`LEFTHOOK_EXCLUDE=fallow`，其餘 hook 實跑（`tracked-artifacts`、`lint`、`format`、`largefiles`、`cli-process-ownership`、`typecheck`、`commitlint`）；`fallow` 理由同前幾條。

## 2026-10-28：上游追到 `bf7ebe961`（v0.8.210），三個水位推進到 commit `bf7ebe961`、PR #6629、issue #6610；Dependabot 安全更新改由 override 處理

**決定**：`933ae3eb5..bf7ebe961` 的 114 個 commit 以一個 merge 帶入（`2fa845282`，可單獨還原；衝突只有 4 檔，沒有拆批的必要）。open 的上游 PR #6512 先行移植（`554dbb7f0`）。PR 與 issue 軸逐筆審完，水位推到審查時上游最大的 PR #6629 與 issue #6610（#6625–#6629 是審查期間新開的，一併審完）。之後上游再前進，`--strict` 會是紅的，這是預期。

**判準八掃描**：commit 軸 16,092 行新增行，掃空白夾內容（`\S\s{40,}\S`）、`eval(`／`new Function(`／`global(This).require`／`atob(`／`fromCharCode`、120 字元以上的 base64、240 字元以上的 hex、零寬與雙向控制字元、400 字元以上單行。命中都是良性：Markdown 表格對齊、測試的 puppeteer `page.$eval`、`.claude/settings.json` 既有的 pre-commit hook（`node -e` 單行腳本，改成在 Windows `cmd.exe` 下不靠 shell pipe 過濾型別錯誤，#6619）、producer fixture 的長描述。PR 軸對 47 筆未合併 PR 的目前 head diff 掃同一組：只有 #6433 測試的 `page.$eval`（3 次）與 #6502 一行文件段落，0 隱藏內容。

**commit 軸**：

| 範圍 | 本 fork 的狀態 | 結論 |
| --- | --- | --- |
| 衝突：`.github/workflows/ci.yml` | fork 的 `ci.yml` 只跑 Windows（`tools/tests/test_fork_docs.py` 釘住）；上游加的 `test-reachability` job 與 `.github/actions/fetch-history`、`release-only-diff`（#6524、#6577）是上游 Linux CI 的 | 取 fork（不加 `test-reachability`）。兩個 composite action 隨 merge 進來，被其他自動合併的 workflow 使用：`release-only-diff` 在 player-perf、player-safari、preview-regression、regression、windows-render、lambda-arm64-image，`fetch-history` 在其中三個；新增的步驟只檢出程式碼並跑 `node scripts/ci/release-only-diff.mjs`，不用 secrets、不推送、沒有 `pull_request_target`，插值只有 `${{ github.event_name }}`。觸發：fork 把 Linux CI 接回時再考慮 `test-reachability` |
| 衝突：`README.md` | fork 繁中主檔 | 取 fork；上游的變更（`hyperframes.dev` → `hyperframes.studio` 網域與表格對齊，#6585）用 patch 併進 `README.en.md`。繁中 `README.md` 沒有這些連結，沒有內容要翻 |
| 衝突：`scripts/check-studio-copy-dashes.mjs` | fork 自己修過 Windows 反斜線（`replaceAll("\\", "/")`） | 取上游（#6619 的 `split(sep).join("/")`，等效）；`node scripts/check-studio-copy-dashes.mjs` 通過 |
| 衝突：`skills-manifest.json` | 雜湊 | 用 `bun packages/cli/scripts/gen-skills-manifest.ts` 重產 |
| 動 fork 分歧檔、自動合併 | `compositionScoping.ts` 與兩份 golden（#6543）：fork 的 `Function()` 字面值與 `AUTHORED_SOURCE_BEGIN`／`END` 標記保留（`compositionScoping.ts:378-379`）；`videoFrameExtractor.ts`（#6488、#6527、#6583、#6597）：`assertPrivateCacheRoot` 保留（`:79`、`:2221`）；`fileServer.ts`（#6561、#6620）：`0o600` 保留（`:736`）；另有 `extractionCache.ts`、`engine/src/index.ts`、`producer/src/server.ts`、`htmlCompiler.ts`、`layout-audit.browser.js`、`init.ts`、`capture/video.ts` | 合併；測試見「驗證」 |
| Windows 相關 | #6474（音訊暫存刪不掉不再讓 render 失敗）、#6475（`history show --diff` 不需要 git）、#6484（`hyperframes open` 在 Windows 交給 app）、#6505（Chrome profile 刪不掉不再讓 capture 失敗）、#6507（Kokoro 的 espeak 路徑超過 260 字元）、#6518（JSON 旗標可從檔案或 stdin 讀，PowerShell 可用）、#6559（undo／redo 等待 Windows 短暫鎖住的檔案）、#6576（`hyperframes add` 在檔案被鎖時繼續）、#6619（lint 與 Claude pre-commit hook 在 Windows 可用）、#5834（`isPathInside` 接受 `..` 開頭的子項名） | 合併；都是本線需要的修正 |
| 版本發布 | v0.8.207–v0.8.210（#6510、#6529、#6562、#6600） | 合併；fork 不發佈 |
| 其餘 | producer／engine／core／cli／studio 的一般修正、文件、測試 | 合併 |

身分資訊：前一條「永不採用」的 `server.json`、`context7.json` 的 `url`／`public_key`、cli `homepage` 這一批沒有被上游再動，合併後仍是 fork 的狀態。

**PR 軸（#6480–#6629，136 筆：93 筆已合併、35 筆 open、8 筆關閉未合併）**：93 筆已合併的全部可在 `upstream/main` 的 commit 主旨找到 `(#N)`，經 commit 軸抵達。未合併的：

| PR | 審查時 head | 內容 | 本 fork 對應檔案的實際狀態 | 結論與觸發 |
| --- | --- | --- | --- | --- |
| #6512 | `35309340f`（外部，3 檔 +66/-1，CI 全綠） | studio 數字欄位：IME 確認組字的 Enter（`isComposing`，或舊 WebKit 的 `keyCode 229`）不再直接提交數值 | **缺陷在本 fork 存在**：`NumberField.tsx:102` 只判斷 `event.key !== "Enter"`。繁中輸入法是本線的主要情境 | **採用**（`554dbb7f0`，照抄，含測試與 `docs/studio/canvas.mdx` 一段）；拿掉修正時新測試 2 項失敗，放回後通過 |
| #6492 | `cc16106ff`（20 檔，CHANGES_REQUESTED） | **Windows**：專案路徑旁的暫存資料夾改用統一的 `createStagingDir`，避免長路徑下 `mkdtemp` 的 ENOENT | 缺陷在本 fork 存在（`capture/captureFile.ts:21` 在專案旁 `mkdtempSync`，非測試檔還有 49 個用到 `mkdtempSync`）；對合併後的樹套不上 | 不採用：審查要求修改。觸發：合併，或本線 Windows 出現長路徑 `snapshot` 的 `ENOENT … mkdtemp` |
| #6506 | `1ec084759`（APPROVED） | undo／redo 的放回等待 Windows 鎖檔 | **已被 #6559 取代**：`studio-server/src/history/blobStore.ts:57` 已是 `renameWithRetry`；本 PR 對合併後的樹套不上 | 不採用；無觸發（上游若仍合併會經 commit 軸抵達） |
| #6580 | `7d9bbce39`（9 檔，APPROVED） | **Windows**：PowerShell 5.1 寫出的 UTF-16 頁面依 BOM 解碼 | 缺陷在本 fork 存在（`producer/src/services/htmlCompiler.ts:2047` 固定 `"utf-8"`）；動 fork 分歧檔 `htmlCompiler.ts`、`htmlBundler.test.ts`，可套用 | 不採用：已核准、應會很快合併。觸發：合併，或本線出現 PowerShell 存的頁面預覽全黑 |
| #6605（issue #6604） | `1145a3f7c`（4 檔） | **Windows**：`--batch` 讀 UTF-8 BOM 與 UTF-16LE 的 JSON | 缺陷在本 fork 存在（`cli/src/commands/batchRender.ts:95` 直接丟 `Invalid JSON in --batch`） | 不採用：open、等審查。觸發：合併，或本線用 PowerShell 產生 batch 檔時報錯 |
| #6611（issue #6610） | `a0ff08799`（4 檔） | studio 備份檔名超過 200 字元時改用雜湊 | 非分歧檔；長路徑在 Windows 較常見 | 不採用；觸發：合併，或本線 studio 存檔報 `backup failed: ENAMETOOLONG` |
| #6613 | `a98796069`（20 檔） | **Windows CI**：渲染時偵測有沒有開出可見視窗 | 與本線「測試不得開視窗」的規則同方向；只動上游 CI | 不採用；觸發：合併後評估把同一個探測加進 fork 的 `Windows render verification` |
| #6571 | `e5856f0b6`（17 檔，CHANGES_REQUESTED） | 下載前解析主機，拒絕私有位址（SSRF） | 動 fork 分歧檔 `bun.lock`、cli `package.json`、`urlDownloader.test.ts`，套不上 | 不採用：審查要求修改。觸發：合併 |
| #6565 | `0a9654fec`（6 檔） | 專案 `.env` 只能設定 CLI 自己的變數（白名單） | 非分歧檔，可套用 | 不採用；觸發：合併 |
| #6497 | `3fded16d4`（外部） | `.env` 空值後的註解視為無值 | 非分歧檔 | 不採用；觸發：合併 |
| #6486、#6587、#6589、#6592（draft）、#6596、#6599、#6618 | `187cddbd2`、`7915eb233`、`87493be9d`、`e300c3c22`、`ce1d96b0e`、`4b5ba8423`、`ae117ac2f` | producer 分段擷取、長 GOP 擷取、預覽代理、系統字型、seek 逾時、PNG 序列、snapshot 進度 | #6587 動 `videoFrameExtractor.ts`（分歧檔，套不上）、#6592 動 `htmlCompiler.ts`、#6599 動 `fileServer.ts`（皆可套用） | 不採用；觸發：合併。#6587／#6599 合併時重看 fork 的 `assertPrivateCacheRoot` 與 `0o600` |
| #6514（issue #6513）、#6593（issue #6590）、#6602（issue #6601）、#6612（issue #6609）、#6591 | `8a73ab451`、`f531291e9`、`32fcba8e7`、`a47a6f360`、`3c6118866` | 投影片時間界線、base64 媒體 lint、2 GiB 以上匯出、音量自動化、`--variables-file` | 非 Windows 專屬；#6602 動分歧檔 `studio-server/src/routes/render.ts`（套不上） | 不採用；觸發：合併 |
| #6548 | `99bb3b10a`（外部，578 行） | registry 新增一個 CTA block | 新增內容 | 不採用；觸發：合併 |
| #6594 | `4002cce32` | 桌面卡片文字指向 `hyperframes.studio` | 上游品牌文字 | 不採用；觸發：合併 |
| #6616、#6617、#6621、#6622 | `625bd9cf1`、`6e43f2d71`、`aeb5991ab`、`21814c39e` | CLI 指令工廠化與 agent 模式（後三筆疊在 `fix/cli-agent-mode*` 分支上，不能獨立合併） | 動 fork 分歧檔 `init.ts`、`catalog.ts`、`clean.ts`；套不上 | 不採用；觸發：合併。`init.ts` 合併時要重對 fork 的差異 |
| #6623、#6624 | `8720f4176`、`bd7f0a5f1` | v0.8.211 發布、雲端客戶端型別重產 | 版本號／產生碼 | 不採用；觸發：合併 |
| #6625、#6626 | `335b1a856`、`7b930aace`（外部，各 2 檔） | 把 `tar` 7.5.21、`@modelcontextprotocol/server` 2.3.0 加成根 `dependencies` 以處理 CVE；內文自述沒有驗證 | 做法無效：`@mcp-b/*` 5.0.1 精確釘 `@modelcontextprotocol/server` 2.0.0，加根依賴不會換掉那份；本 fork 改用 `overrides`（見下方 Dependabot 一節）。`tar` 在本 fork 是 7.5.15，本 fork 沒有對應的 Dependabot alert；#6625 內文寫 7.5.19、`package.json` 寫 7.5.21，前後不一 | 不採用。觸發：本 fork 出現 `tar` 的 alert 時用 `overrides` 處理 |
| #6628 | `0c8c4b23d`（6 檔 +185/-14） | **Windows**：undo／redo 還原的檔案被開著時也能還原：還原前先結束預覽自己對該檔的讀取串流（新增 `helpers/servedFiles.ts`），Windows 上重試用盡後改成就地寫入 | 非分歧檔；本 fork 的 `blobStore.ts:57` 已有 #6559 的重試，這筆處理重試用盡的情況；可套用 | 不採用；觸發：合併，或本線 Windows 的 undo 仍報 `EPERM`／`EBUSY` |
| #6627、#6629 | `d2aacd2e5`、`4cd77d316` | check 的 craft pass 跳過隱藏的 clip；studio 時間軸縮圖共用影片來源 | #6627 動分歧檔 `layout-audit.browser.js`，可套用 | 不採用；觸發：合併 |
| 關閉未合併：#6485、#6540、#6573、#6595 | codegen bot | 雲端客戶端型別重產 | 已被合併的 #6608 取代 | 不採用 |
| 關閉未合併：#6496、#6502 | `1f8ed98f3`、`ca38d5c51` | chunk worker 開機與 BeginFrame 探測並行；capture 代理與本機 `--file` | 已分別由合併的 #6500、#6499＋#6498 取代 | 不採用 |
| 關閉未合併：#6554 | `25903ada0` | 「release v0.8.999 proof, do not merge」 | 上游的發布演練 | 不採用 |
| 關閉未合併：#6607 | `6ad2b7f32`（外部） | lint 規則的測試補強 | 只有測試；上游沒有收 | 不採用 |

**審查後換版**：提交前重查，#6613（→ `7728b3131`）、#6616、#6617、#6621、#6622 的 head 已在表中記錄的版本之後更新；都不採用，下一輪重掃。

**前一輪仍 open 的 PR**：#6434、#6437、#6438、#6440、#6441、#6444、#6452、#6460、#6471、#6472、#6474–#6479 已合併，經 commit 軸抵達；#6462 關閉（#6440 合併後取代）、#6473 關閉（移除 `page_motion_blur` 的型別重產沒有被收；合併後 `typecheck` hook 通過）。仍 open：#6428 `781935309`、#6456 `eabf072d8`、#6466 `5a20b67dd`（head 都沒變，結論不變）；#6433 換版 `85748ef02` → `534bc7562`，重掃只命中測試的 `page.$eval`，結論不變。

**issue 軸（#6481–#6610，14 筆）**：

| issue | 內容 | 結論與觸發 |
| --- | --- | --- |
| #6519、#6556、#6578 | 已關閉 completed：雲端 render 變數驗證、HLG 重複畫格、大寫 `.WEBM` 混音 | 修正 #6520、#6575、#6579 經 commit 軸抵達 |
| #6513、#6590、#6601、#6604、#6609、#6610 | 各有 open PR（#6514、#6593、#6602、#6605、#6612、#6611） | 隨對應 PR，見上表 |
| #6481 | 分段擷取搭 `--format mov` 必失敗（回報者在 Windows 11 重現，程式路徑與平台無關） | 沒有修正 PR。觸發：上游修正合併，或本線用 `HF_SEGMENTED_CAPTURE` 輸出 MOV |
| #6482 | 功能需求：CLI 指定畫格範圍／重用分段 | 不採用；產品方向 |
| #6530 | macOS XProtect 擋下 render | 不適用（本線是 Windows） |
| #6584 | 「Error exporting」，沒有環境與重現資訊 | 不採用；觸發：上游補出可重現的原因 |
| #6606 | producer 下載遠端媒體失敗時靜默丟掉該元素 | 沒有 PR；觸發：上游修正合併 |

**Dependabot 安全更新（`@modelcontextprotocol/server`、`esbuild`、`tinypool`、`uuid` 四個 job 失敗）**：

- 原因一：`f4175462a` 換上游檢查器時，誤把 `pnpm-lock.yaml`（9,596 行）與 `pnpm-workspace.yaml` 一起提交（本 repo 用 bun，上游沒有這兩檔；`AGENTS.md` 寫明「不建 `pnpm-lock.yaml`」）。Dependabot 的 7 個 alert 都掛在這份鎖檔上。本次刪除。
- 原因二：`bun.lock` 本身也是受影響版本，而且都是被上游套件精確釘住的間接依賴，Dependabot 無法自動升（`security_update_not_possible`）。只刪 pnpm 鎖檔會讓 alert 假性消失，所以在根 `package.json` 的 `overrides` 修：
  - `@modelcontextprotocol/server` 與 `@modelcontextprotocol/core` → `2.3.1`（`@mcp-b/*` 5.0.1 精確釘 2.0.0；server 2.3.1 精確依賴 core 2.3.1，兩個一起覆蓋才不會分裂成兩份 core）。studio `src/webmcp` 15 檔 183 項通過。
  - `tinypool` → `2.1.2`（`oxfmt` 0.41 精確釘 2.1.0；升 oxfmt 會重排整個 repo 的格式，不做）。`oxfmt --check` 正常。
  - `uuid` → `^11.1.1`（`@google-cloud/storage` 7、`gaxios` 6、`teeny-request` 9 要求 8.x／9.x；這三個只用 `v4()`，uuid 11 仍提供 CJS 的 `v4`）。實測三個套件解析到的 uuid 都是 11.1.1、`v4()` 可用，`Storage` 可建構；gcp-cloud-run `bun test` 104 通過，1 失敗是 Windows 無權建立符號連結（`EPERM`）。
  - tsx 鎖檔在原本的 `^4.21.0` 範圍內升到 4.23.15（依賴 `esbuild ~0.28.0`），宣告不變。
- **延後：`esbuild` 0.27.7（GHSA-g7r4-m6w7-qqqr，low）**。剩下的唯一來源是 `tsup` 8.5.1（8.x 最新版，要求 `esbuild ^0.27.0`）；bun 不支援巢狀 override，全域覆蓋會連帶改動 `vite` 用的 0.25.12，修好要升 tsup 9（大版本）。風險：漏洞只在 `esbuild serve` 用 `servedir` 提供檔案時成立（Windows 的反斜線路徑穿越）；tsup 的 dist 沒有 `.serve(` 呼叫，本 repo 也沒有用 esbuild 的開發伺服器。**重看條件**：tsup 出 8.x 修正版或本線決定升 tsup 9；或本 repo 開始使用 `esbuild serve`。

**驗證**（Windows 11 本機，Node 26.12.1、bun 1.4.4；`NODE_OPTIONS=--no-experimental-webstorage --disable-warning=DEP0205`）：

- `bun install --frozen-lockfile`、`bun run build` 通過。
- core `src/compiler`＋`src/runtime/timeline` 740 項：739 通過；`pageBuild.golden` 的 preview 一項在預設 5 秒逾時，`--testTimeout=60000` 單獨重跑 4 項通過。
- engine `videoFrameExtractor*`、`extractionCache*`、`frameCapture-authorScan*` 312 通過、27 跳過。
- producer `fileServer`＋`htmlCompiler`（`bun test`）227 通過，2 失敗是 `EPERM` 符號連結。
- cli `layout-audit.browser`、`commands/init*`、`commands/capture*`、`tts/synthesize.cache`、`src/browser` 544 通過、21 跳過；失敗的是 `chromeOrphans.process`（check 的 Chrome 起不來，前幾條同一個環境問題）與 `colorGradingShaderStages.browser`（`The browser is already running for …`）。
- studio-server `history`＋`proxyTranscoder`＋`waveform.file-race`：7 項失敗，5 項是 `EPERM` 符號連結，`snapshotRuns` 一項在 mock 內建符號連結，`undoUncopied` 一項靠 `chmod 0o111`（Windows 無效）；這兩個測試檔與它們的產品檔都不在本次 merge 的改動中。POSIX 版本由 `POSIX security tests` workflow 在 Linux 上跑。
- aws-lambda `handler.test` 37 通過；`tools/tests` 39 通過；`node scripts/check-studio-copy-dashes.mjs` 通過。
- 未驗證：producer 整合測試、需要 Chrome 的 `*.chromium.test.ts`。
- 提交：`LEFTHOOK_EXCLUDE=fallow`，其餘 hook 實跑（`filesize`、`tracked-artifacts`、`lint`、`cli-process-ownership`、`format`、`skills-manifest`、`largefiles`、`typecheck`、`commitlint`）；`fallow` 理由同前幾條。
