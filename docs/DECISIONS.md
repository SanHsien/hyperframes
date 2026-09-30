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
