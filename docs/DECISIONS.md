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

