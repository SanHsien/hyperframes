# Repository review（Windows-only）

- Review date: 2026-09-12
- Review baseline: `51a88b95660c5f67e66e9c5977226f6ae7b31255`
- Remediation: 同日 fork-local overlay（不回貢）
- Upstream reviewed through: `51a88b95660c5f67e66e9c5977226f6ae7b31255`
- Primary environment: Windows 11、PowerShell、Python 3.14.7、Bun 1.4.0、Node v26.7.0
- Status: 維護骨架與產品相依環境全面可用。已完成建立 Windows 原生門禁與驗收。

## 結論

這個 fork 適合作為 Windows 本機、給 AI Agent 維護的 HyperFrames 影片渲染框架線。產品行為跟隨 `heygen-com/hyperframes` `51a88b9`，再加上本線維護骨架：繁體中文維護入口、Windows 原生 1-click gate、純 Windows 原生維護 CI、每週上游水位追蹤（commit、PR、issue）以及每月依賴新鮮度檢查。

上游發布工作流已加入 `github.repository` 機械防線，遠端分支已完成精簡僅保留 `main`，確保所有對外 PR/push/release 絕不污染上游。

## 本輪實證

### 審查當下（`51a88b9`）

```text
git rev-parse HEAD
→ 51a88b95660c5f67e66e9c5977226f6ae7b31255

gh repo set-default --view
→ SanHsien/hyperframes
```

實查結果：

- 上游 repository 為 `heygen-com/hyperframes`，採 Apache License 2.0。
- 上游 PR 與 Issue 水位鎖定為 `#3896`。
- 上游工作流 `publish.yml` 與 `sync-skills-to-clawhub.yml` 已配置 repository 隔離防護。
- 維護工具無 `os.system`／`shell=True`／`eval(`／`exec(`。

## 已修 findings

| ID   | 嚴重度 | 做了什麼                                                                                                                                                      |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01 | P2     | `.gitignore` 加入 `.env`、`.venv`、`upstream-review-report.md`、`dependency-freshness-report.md`、`.ruff_cache/`、`tools/.pytest_cache/`                      |
| R-02 | P2     | 建立獨立維護測試目錄 `tools/tests/` 與獨立 `tools/pytest.ini`，避免產品環境污染                                                                               |
| R-03 | P2     | 建立 `FORK.md`、`NOTICE.md`、`LICENSE`、`SECURITY.md`、`AGENTS.md`、`CLAUDE.md`、`GEMINI.md`，寫明對外邊界與安全性                                            |
| R-04 | P3     | `README.md`（繁體中文）與 `README.en.md`（英文鏡像）雙向互指，並標明 upstream 與 Apache-2.0 條款                                                              |
| R-05 | P2     | 建立 `tools/dev_check.ps1` 與 `tools/bootstrap_dev.ps1`，規範 Windows 11 原生 PowerShell 驗收門禁                                                             |
| R-06 | P2     | 建立 `tools/test_product.ps1` 支援 Windows 原生 Monorepo 建置與測試                                                                                           |
| R-07 | P2     | 建立純 Windows 原生 CI（`ci.yml`、`upstream-check.yml`、`dependency-freshness.yml`、`dependabot.yml`）                                                        |
| R-08 | P2     | 建立上游追蹤水位防重複巡檢機制，鎖定 PR `#3896`、Issue `#3896`                                                                                                |
| R-09 | P2     | 上游工作流防護：在 `publish.yml` 與 `sync-skills-to-clawhub.yml` 注入 `if: github.repository == 'heygen-com/hyperframes'` 機械閘門，防止 fork CI 誤觸對外發布 |
| R-10 | P2     | 遠端分支精簡：修剪 fork 預設複製的數百個上游分支，保持 `origin` 僅有純淨 `main` 維護主線                                                                      |

## 接受、不改契約

| ID  | 嚴重度 | 處理                                   |
| --- | ------ | -------------------------------------- |
| -   | -      | （無。所有已識別項目皆已妥善處理完畢） |

## 尚未宣稱範圍

- **不宣稱** 已將任何修改提交回原作者上游（依 fork 維護政策，所有 PR/commit 僅限於 `SanHsien/hyperframes`）。
