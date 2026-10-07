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
- `localSemantic.ts`：新增 `installLocalVectors`（從隨套件的 `registry/catalog-artifact` 複製向量，不從網路寫入快取），`catalog.ts` 改呼叫它；上游的 `fetchLocalVectors` 與 `media-vectors` 支援原樣保留，所以兩者並存。
- `runtime/bridge.ts`：控制訊息以封閉的 `switch` 分派（不是 `Map` 查表），並補上上游新增的 `set-idle-heartbeat`、`set-play-range`。
- `scripts/catalog/component-variables.ts`：不靠 regex 的註解剝除，保留；上游以 `PREFER_AUTHORED_DEMO` 取代 `SNIPPET_PREVIEW_RENDERS_STILL`。
- `capture/mediaCapture.ts`、`commands/capture/video.ts`：擷取到的影片經 `videoNormalization` 以 ffmpeg 重封裝後才落地（上游沒有動這段）。
- media-use 音訊：HeyGen 非英文必須明給 `--voice`、雲端音訊經 ffmpeg 重新編碼後才寫檔；favicon 經 `image-normalize` 後才凍結。
- 測試：fork 的 `canCreateSymlinks` 探測與 `skipIf`（`publication.test.ts`、`skillsMirror.test.ts`；本輪另對上游新增的三個 Codex 符號連結測試加同樣的 `skipIf`）。
- 工作流：`catalog-publish.yml` 加上 `if: github.repository == 'heygen-com/hyperframes'`（它用寫入權杖開常駐 PR）；其餘新工作流（`comments`、`pr-captures`、`studio-drag-frames`）無 secrets 且唯讀，未加閘門。

**不再生效或孤立的 fork 加固**（維護者需決定要重做還是移除）：

- `capture/frameworkMarkup.ts`（與其測試）已不被使用：上游把擷取流程搬到 `captureAttempt.ts`／`coreExtractionPhase.ts`，並改用自己的 DOM 解析版 `filterExtractedScripts`。fork 版多做的 `data-reactroot` 屬性與巢狀 `<template>` 處理沒有接上。
- `skills/media-use/scripts/lib/freeze-publisher.mjs`（與其測試）已不被使用：上游的 `freeze.mjs` 接受經過 `sanitizeSvg` 的遠端 SVG，並有不驗證位元組內容的串流測試，和 fork 的「魔術位元組驗證加獨立發佈行程」互斥，所以取上游。結果：遠端下載的媒體不再做魔術位元組驗證。
- 上傳檔案的 `0o600` 權限：上游 `createFileAtomically` 使用預設權限，fork 的 `openSync(..., "wx", 0o600)` 沒有保留。

**驗證**（Windows 11、Bun 1.4.2、`--linker=hoisted`；同一批測試在純上游 worktree `C:/GitHub/hf-upstream` 對照）：

| 範圍 | 合併後 | 純上游 |
| --- | --- | --- |
| studio-server `render`／`preview`／`files*`／`proxyTranscoder`（9 檔） | 5 失敗、359 通過（皆為 Windows 符號連結 `EPERM` 或備份失敗斷言，上游同樣失敗） | 10 失敗；多出的 5 個為 render 檔名（fork `basename` 修正使其通過）、proxyTranscoder、files.pathSafety |
| cli：`catalog`、`localSemantic`、`publication`、`client`、`skillsMirror`、`capture/**` | 全數通過（43 檔通過、2 檔略過） | `publication`、`skillsMirror` 共 13 項符號連結失敗 |
| core `runtime/bridge*` | 35 通過 | 未跑 |
| `tsc --noEmit`：studio-server、core、studio | 通過 | 未跑 |
| `tsc --noEmit`：cli | 17 個錯誤，與上游逐項相同（`typeof fetch` 的 `preconnect`、`compositionServer.ts`） | 17 個 |
| media-use node 測試 | 3 失敗（`ffprobeDuration`、`heygenAuthMethod` 符號連結迴圈、`logo-provider.test.mjs` 整檔載入失敗），與上游相同 | 相同 3 個 |

**未驗證**：producer、engine、player、完整 `bun run test`、`bun run lint`、`test:scripts`、`test:skills` 與 fallow 全庫、Docker／Lambda、瀏覽器端測試；`generate-catalog-pages` 與目錄產生器的實跑；移植到新路徑的 favicon `normalizeCloudImage` 沒有被通過的測試覆蓋（`logo-provider.test.mjs` 在上游同樣整檔失敗）；符號連結相關測試在本機無權限所以被略過而非通過；LFS「should have been pointers」警告（57 個 producer 輸出檔）是上游既有狀態，未更動。本機工作目錄另有未追蹤的 `pnpm-lock.yaml`、`pnpm-workspace.yaml`，不屬於任何一側，未提交。
