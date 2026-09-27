<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo/dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/logo/light.svg">
    <img alt="HyperFrames" src="docs/logo/light.svg" width="300">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hyperframes"><img src="https://img.shields.io/npm/v/hyperframes.svg?style=flat" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen" alt="Node.js"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/bun-%3E%3D1.2-black" alt="Bun"></a>
</p>

<p align="center"><b>以 HTML 撰寫、即時渲染影片的 AI Agent 專屬架構（Windows-first 維護線）</b></p>
<p align="center"><b>Write HTML. Render video. Built for agents.</b></p>

> [!NOTE]
> **維護型 Fork 說明**：
> 本專案為 [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes)（Apache-2.0 授權）的 Windows 11 原生維護 Fork，由 [@SanHsien](https://github.com/SanHsien) 維護。
>
> - 英文原版說明請參閱 [README.en.md](README.en.md)。
> - 本 Fork 的維護方針、同步機制與回貢判準請參閱 [FORK.md](FORK.md)。
> - 法律聲明與上游版權歸屬請參閱 [NOTICE.md](NOTICE.md)。
> - AI 代理協作規範請參閱 [AGENTS.md](AGENTS.md)。

---

## 專案簡介

HyperFrames 是一個開源影片生成框架，能將標準 HTML、CSS、媒體素材與可尋軌動畫（GSAP、CSS Keyframes 等）編譯並渲染為確定性（Deterministic）的 MP4 影片（frames read as states，以 reconstructed motion 重建動態）。特別針對 AI Coding Agent（如 Claude Code、Codex、Antigravity）設計，支援藉由自然語言描述直接呼叫 Agent Skills 產出影片。

本 Fork 的核心價值：

1. **Windows 11 原生一級公民**：全面排除 Linux 專用路徑與 Shell 假設，在 Windows 原生環境下確保測試與渲染可靠執行。
2. **機械防線與零上游污染**：強制鎖定 `gh repo set-default SanHsien/hyperframes`，CI 停用上游發布工作流，PR/push/release 嚴格指向本 Fork。
3. **可稽核的上游同步機制**：提供 `tools/check_upstream_updates.py` 每週自動巡檢上游 Commit、PR 與 Issue 水位。
4. **現代依賴新鮮度管理**：提供 `tools/check_dependency_freshness.py` 納管維護相依性。

---

## 快速上手（Windows 11 原生環境）

### 1. 一鍵初始化維護環境

本專案提供 PowerShell 原生的一鍵引導腳本：

```powershell
pwsh -NoProfile -File tools\bootstrap_dev.ps1
```

若需一併安裝整個 Monorepo 的前端與產品依賴（調用 `bun install --frozen-lockfile --linker=hoisted`）：

```powershell
pwsh -NoProfile -File tools\bootstrap_dev.ps1 -All
```

### 2. 執行本機開發門禁

在提交變更前，務必執行 Canonical Windows Gate：

```powershell
pwsh -NoProfile -File tools\dev_check.ps1
```

門禁自動執行：

- Python 工具語法編譯（`compileall`）
- Ruff 靜態分析（`ruff check`）
- Fork 契約測試與文件檢查（`pytest tools/tests`）
- Markdown 相對連結完整性驗證（`tools/check_links.py`）

### 3. 執行產品驗證

```powershell
pwsh -NoProfile -File tools\test_product.ps1
```

---

## 架構與專案結構

```text
packages/
  ├── core/                 核心編譯器與 HTML/GSAP 解析器
  ├── cli/                  hyperframes 命令列工具
  ├── engine/               Puppeteer / Chrome 截圖與幀緩衝渲染引擎
  ├── player/               前端網頁播放器
  ├── studio/               可視化編輯器前端
  ├── studio-server/        本地編輯器後端服務
  └── shader-transitions/   WebGL / GLSL 轉場著色器
skills/                     AI Agent 專用 Skills（提示詞與工作流）
tools/                      Windows 原生維護工具庫與門禁
docs/                       專案與維護架構文件
  ├── DEVELOPMENT.md        開發環境完整指南
  ├── DECISIONS.md          歷史維護決策紀錄
  └── UPSTREAM.md           上游同步水位與審查規範
```

---

## 授權與宣告

本專案以 [Apache License 2.0](LICENSE) 釋出。
原始創作歸屬於 HeyGen 及 `heygen-com/hyperframes` 貢獻者團隊，詳見 [NOTICE.md](NOTICE.md)。
