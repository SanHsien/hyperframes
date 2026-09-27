# Fork 維護說明

本 repo fork 自 [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes)，
沿用 Apache License 2.0 與完整 Git 歷史。

## 為什麼維護 fork

- 建立 Windows 11 原生一級公民支援：在 Windows 11 + PowerShell 環境下驗證並確保渲染、CLI 與 Studio 穩定運行。
- 建立可重現的 Windows 開發門禁、Windows CI 工作流，以及逐筆審查的上游追蹤（涵蓋 commit、PR 與 issue 水位）。
- 公開入口維持繁體中文為主，英文鏡像放 [README.en.md](README.en.md)。
- 建立嚴格的機械防線：`gh repo set-default SanHsien/hyperframes`，CI 遮蔽上游發布工作流，確保對外 PR/push/release 絕不污染上游。
- 產品執行路徑以上游為準；本線不擅自變更上游授權。

**回貢判準：修的是上游的 bug 就送回去；這裡獨創的文件／Windows 維護骨架留在這裡。**
回貢前必須在當次對話取得維護者明確同意；「fork」「建開發環境」「開 PR」都不是同意。

## 與上游的差異

| 項目                                                           | 說明                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `README.md`                                                    | 繁中主檔；加入 fork 維護資訊與快速入口                                    |
| `README.en.md`                                                 | 英文鏡像；加入 fork 維護資訊                                              |
| `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`                        | 本 fork 的 AI 維護單一真相源與代理指南                                    |
| `NOTICE.md` / `FORK.md` / `LICENSE`                            | 來源、授權與歸屬說明                                                      |
| `tools/dev_check.ps1`                                          | Windows 本機一鍵 gate（維護工具門禁）                                     |
| `tools/bootstrap_dev.ps1`                                      | Windows 本機一鍵初始化與驗收（支援 `-All` 安裝產品依賴）                  |
| `tools/test_product.ps1`                                       | Windows 原生產品測試執行腳本                                              |
| `requirements-dev.txt`                                         | 維護工具依賴清單                                                          |
| `.github/workflows/ci.yml`                                     | 純 Windows 原生 CI（windows-latest Python 3.10–3.14 矩陣執行 gate）       |
| `.github/workflows/upstream-check.yml`                         | 每週對 `upstream/main` 做未審查 commit、PR、issue 水位檢查                |
| `.github/workflows/dependency-freshness.yml`                   | 每月依賴新鮮度檢查                                                        |
| `.github/workflows/publish.yml`                                | 加上 `if: github.repository == 'heygen-com/hyperframes'` 防止 fork 誤發布 |
| `.github/workflows/sync-skills-to-clawhub.yml`                 | 加上 `if: github.repository == 'heygen-com/hyperframes'` 防止 fork 誤同步 |
| `docs/DECISIONS.md`、`docs/UPSTREAM.md`、`docs/DEVELOPMENT.md` | fork 維護文件                                                             |
| `REVIEW.md`                                                    | 全庫風險審查快照                                                          |

核心模組在 `packages/`、Agent Skills 在 `skills/`，以上游為準。

## 分支與 remote

- `origin/main`：SanHsien 維護線，也是唯一長期分支。
- 日常修改在本機跑 gate 後直接推 `origin/main`。
- `upstream/main`：heygen-com 原始專案，只追蹤、不推送。
- Dependabot 或外部 fork 的變更走 PR，讀 diff 並通過 CI 後再合併。

不要 `git push upstream`。同步方式見 [`docs/UPSTREAM.md`](docs/UPSTREAM.md)。

上游更新英文 `README.en.md` 或其他文件時，把新內容併進本 fork 對應檔案。

## 換一台電腦怎麼開發

```powershell
git clone https://github.com/SanHsien/hyperframes.git
cd hyperframes
git remote add upstream https://github.com/heygen-com/hyperframes.git
gh repo set-default SanHsien/hyperframes
pwsh -NoProfile -File tools\bootstrap_dev.ps1
```

詳細開發與測試流程請參閱 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。
