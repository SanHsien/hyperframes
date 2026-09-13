# AGENTS.md

給 Codex、Claude Code、Cursor、Gemini / Antigravity 與其他自動化代理在本專案工作時的指引。產品與使用方式先讀 [`README.md`](README.md)；開發與驗收細節見 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。

## 專案定位

這是 [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes) 的 Apache License 2.0 fork。
核心價值是以 HTML、CSS、GSAP 動畫與媒體元素為基礎，即時渲染為確定性 MP4 影片的 AI Agent 專屬架構。

`origin` 是 `SanHsien/hyperframes`（預設分支 `main`），`upstream` 是 HeyGen 原作者 repo（預設分支 `main`）。
保留上游作者、Apache License 2.0 與產品程式。本 fork 的維護差異記在 [`FORK.md`](FORK.md) 與 [`docs/DECISIONS.md`](docs/DECISIONS.md)。

主要開發與完整驗收環境是 **Windows 11 + PowerShell**。本 fork 為 Windows 原生維護線，排除 POSIX 專屬路徑假設，確保在 Windows 原生環境下可靠建置與測試。

## 硬性邊界

- 不提交使用者輸入影片、音訊、專有文件、API key、token、私鑰或 `.env`。
- 不推送到 `upstream`。上游同步先跑 `python tools/check_upstream_updates.py`，逐筆審查後再 merge / cherry-pick；不盲目覆蓋 fork 文件與 Windows gate。
- 不發佈到 npm 或取代官方發行管道。上游工作流已加 `heygen-com/hyperframes` 閘門，不要拿掉。
- 不要把維護 gate 改成完整產品依賴安裝。維護環境（`requirements-dev.txt`）僅安裝 pytest 與 ruff。
- 不把 fork 包裝成原創產品，不移除上游作者、贊助或官方連結。

## 技術與資料流

- Monorepo 架構：採用 **Bun** 管理 Workspace（`packages/*`）。
  - `packages/core`：核心編譯器與 HTML/GSAP 解析器。
  - `packages/cli`：hyperframes 命令列介面。
  - `packages/engine`：Puppeteer / Chrome 截圖與幀緩衝渲染引擎。
  - `packages/player`：網頁即時播放器。
  - `packages/studio`：可視化編輯器前端。
  - `packages/studio-server`：本地編輯器後端服務。
  - `packages/shader-transitions`：GLSL 轉場效果。
- Agent Skills：位於 `skills/`，提供影片製作專用 Agent 提示詞與工作流。
- 維護工具：`tools/`（Windows gate、上游檢查、相對連結檢查、依賴新鮮度）。
- 維護測試：`tools/tests/`（維護契約測試，獨立於產品測試目錄）。

## 開發原則

- 一般變更直接推 `origin/main`，不開功能分支、不開維護 PR。只有在需要他人審查、或改動風險高到值得先讓 CI 在 PR 上跑一輪時，才退回 **branch → PR → CI → merge**。
- 修 bug 先補可重現失敗測試，再做最小修正。
- 不為了套格式而大改上游程式；Ruff 只閘維護工具的 E9（語法）與 F（pyflakes）。
- 使用繁體中文回覆；使用者文件以繁中為主，公開入口同步維護 `README.en.md`。
- 上游更新英文 `README.md` 時：把新內容併進 `README.en.md`，再翻進繁中 `README.md`。
- 提交訊息用 Conventional Commit。Dependabot 或外部 fork 的變更走 PR，讀 diff 並通過 CI 後再合併。
- `REVIEW.md` 是風險快照，不是每個一般 bug 的流水帳。
- 不 force-push `main`，不刪 `upstream` remote。

## 上游處理

1. `git fetch upstream main`
2. `python tools/check_upstream_updates.py --strict`
3. 逐筆判斷是否與繁中 README、Windows gate、發佈閘門或測試衝突。
4. 可同步的提交用 merge；只需要部分修正時 cherry-pick 或最小重做。
5. 跑 `pwsh -NoProfile -File tools\dev_check.ps1`
6. 採用／略過寫進 `docs/DECISIONS.md`，驗證後才推進 `tools/upstream_baseline.json`

Baseline 代表「已審查」，不代表「全部已合併」。

## 依賴新鮮度

每月的 `Dependency freshness` workflow 跑 `tools/check_dependency_freshness.py`，比對 `requirements-dev.txt` 宣告與 PyPI 現行版。產品套件亦配置 Dependabot 追蹤更新。

紅燈只有兩種正當出口，兩種都要留下理由：

- **維持宣告**：在宣告那一行加 `# freshness-hold: <理由>`。
- **已延後**：在 `.github/dependency-deferrals.json` 加一筆。

## 檔案角色

- `README.md` / `README.en.md`：繁中維護主檔與英文鏡像。
- `FORK.md`：與上游的關係、差異、同步方針。
- `NOTICE.md`：授權與 attribution。
- `docs/UPSTREAM.md`：upstream remote 與審查清冊。
- `docs/DEVELOPMENT.md`：開發與驗收指令。
- `docs/DECISIONS.md`：長期取捨紀錄。
- `REVIEW.md`：全庫風險快照。
- `CONTRIBUTING.md` / `SECURITY.md`：本 fork 的貢獻與安全回報流程。

## 對外邊界：PR 只打本 fork

- **PR、push、release 一律指向 `SanHsien/hyperframes`。** 對上游 `heygen-com/hyperframes` 開 PR、push 或發 release 需要維護者在當次對話明確同意回貢；「fork 一份」「建開發環境」「比照其他 repo」都不是同意。
- 根因是機制不是粗心：`gh` 在 fork clone 的**預設 repo 就是上游**，裸跑 `gh pr create` 必然打上去。每個 clone 先跑一次 `gh repo set-default SanHsien/hyperframes`。
- 開 PR 仍明寫 `gh pr create --repo SanHsien/hyperframes --base <分支> --head <分支>`，並**讀輸出的 URL**，owner 必須是 `SanHsien`。不是就立刻 `gh pr close` 留言道歉說明，再對 origin 重開。
