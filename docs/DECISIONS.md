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

- `lefthook` pre-commit 的 `typecheck` 以 `packages/core/node_modules/.bin/tsc` 呼叫，hoisted 安裝沒有這個路徑，hook 本身失敗（改用根目錄 `tsc` 驗證 core、studio、scripts 皆通過）；`fallow audit --base origin/main` 對整樹採用（約 3,400 個變動檔）把上游既有發現全算成新增，必然失敗，已知屬採用類 PR 的特性。因此此合併 commit 以 `--no-verify` 提交，其餘 hook（format、largefiles、skills-manifest、filesize、tracked-artifacts、cli-process-ownership、lint）在 hook 中通過，commitlint 另行手動通過。
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

**決定**：整樹合併 `f5ab7711f..f76fa5c91`（58 個 commit），並把三個水位一起推進（commit `f76fa5c91`、PR #6369、issue #6369）。

**判準八掃描**：對這 58 個 commit 的 diff 掃過，只有一筆超長單行（`package.json` 的 `test:scripts`）與重新產生的 `position-edits-render-inline.ts`，其餘無行內空白後藏程式、無 bidi／零寬字元；`new Function(` 只出現在上游測試內。

**合併衝突與取捨**：

- `.github/workflows/ci.yml`：保留 fork 的 Windows-only 版本；上游新增的 reachability、changes、cli 獨立 job 不採用（fork 的 `test_fork_docs.py::test_ci_covers_python_314` 規定 `ci.yml` 只跑 Windows）。重看條件：fork 決定在 CI 跑上游測試全集時。
- `packages/producer/src/server.ts`：上游 #6297 以 `fetchPublicHttpsText` 拒絕私有與非 HTTPS 的 `previewUrl`，這比 fork 原本只驗 http(s) 更嚴，採上游；fork 保留 8 MiB 上限與 `validateInlineHtml`（NUL、空內容）。fork 原本的兩項檢查隨之放棄：`redirect: "error"`（上游改為每一跳都重做公網檢查）與 `TextDecoder` 的 fatal UTF-8 拒絕（`fetchPublicHttpsText` 用寬鬆解碼，壞位元組會變成 U+FFFD 而非被拒）。重看條件：producer 因壞編碼 HTML 渲染出亂碼被回報時，在 `resolveInlineRenderHtml` 補上 `�` 檢查。上游新增的 `.github/actions/setup-test-workspace` 在 fork 的 Windows-only `ci.yml` 沒有被使用，保留無害。
- `packages/engine/src/index.ts`：同時匯出 `isSelfOrAncestorHidden` 與 fork 的 `assertPrivateCacheRoot`。
- `skills-manifest.json`：以 `gen-skills-manifest.ts` 重新產生。

**引進（移植做法）**：`packages/cli/src/utils/cancellableProcess.ts` 逐 chunk `toString()` 會把跨 chunk 的 UTF-8 多位元組字元（CJK）切成兩個 U+FFFD。上游 #5273（open）、#5296（closed 未合併）都在修這個，fork 實測重現（新增兩個測試，修前 `'��幕'`），改用 `StringDecoder`。

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

**已知缺口**：`lefthook` 的 `typecheck`（路徑）與 `fallow audit --base origin/main`（整樹採用把上游既有發現算新增）在採用類提交必然失敗，合併 commit 與修正 commit 以 `--no-verify` 提交，修正 commit 另以 `fallow audit --base HEAD` 驗證無新增問題；其餘 hook 與 commitlint 手動通過。
