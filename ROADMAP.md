# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的數字是 2026-10-29 依 `main` `88a24dc2e1fe` 查的快照，開工前先重查 GitHub。

## 現況

HyperFrames 將 HTML、CSS 與動畫渲染為影片，本線保留 Windows 渲染驗收與已登記安全強化（[README](README.md)、[FORK](FORK.md)）。2026-10-29 `gh` 查詢顯示 CI、Windows render verification、POSIX security tests、CodeQL 最近成功，Dependabot 為 0，但 Code scanning 仍有 2 筆，嚴重度為 high 與 medium，#194 `js/insecure-temporary-file`（`packages/core/src/atomicFile.ts`）、#195 `js/file-access-to-http`（`packages/cli/src/capture/publicNetwork.ts`）尚無裁決（2026-10-29 `gh` 查詢）。上游比較為 ahead 58／behind 51，須按已審水位逐批判斷；舊報告的掃描歸零不代表目前狀態（2026-10-29 `gh` 查詢（上游比較）；tools/upstream_baseline.json）。

## 近期：可以直接動手

| 項目                              | 為什麼                                      | 驗收方式                                                                                                                                                                                    | 建議執行者  | 證據                                                                                |
| --------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| 逐筆辨識新 Code scanning 告警     | 最新快照有未分類的告警，舊裁決不能直接套用  | 查 `gh api repos/SanHsien/hyperframes/code-scanning/alerts?state=open --paginate`，取規則、檔案、位置、分析 SHA；真缺陷須有修前失敗／修後通過案例，誤報須有逐筆資料流證據，不能批次 dismiss | Claude Opus | 2026-10-29 `gh` 查詢；docs/DECISIONS.md 既有 CodeQL 裁決                            |
| 審水位後上游內容並重掃變動中的 PR | 上游持續前進，且先前審查後已有 PR head 改變 | 從 tools/upstream_baseline.json 查 commit／PR／issue；#6613、#6616、#6617、#6621、#6622 取當前 head 重掃；保留 fork 分歧與發布 guard，採用後對應 gate 通過才更新水位                        | Codex       | docs/DECISIONS.md「審查後換版」；tools/upstream_baseline.json；2026-10-29 `gh` 查詢 |

## 中期：等條件成立再做

| 項目                                         | 觸發條件                                                              | 驗收方式                                                                                                              | 建議執行者  | 證據                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| 消除 tsup 帶入的 esbuild 延後風險            | tsup 相容線有修正版、維護者決定升主版本，或本線開始使用 esbuild serve | 用 bun 重解受影響鏈，核對 bun.lock 中實際版本與 serve 呼叫；build、受影響套件測試通過，不只看 GitHub 依賴圖           | Codex       | docs/DECISIONS.md「Dependabot 安全更新」esbuild 延後；GHSA-g7r4-m6w7-qqqr           |
| 加入 Windows 可見視窗探測                    | 上游 #6613 合併並完成本線適用性評估                                   | 將同等探測加入 Windows render verification；正常 render 不開可見視窗，刻意開視窗的負例會失敗，其他渲染驗收保留        | Codex       | docs/DECISIONS.md:745；.github/workflows/windows-render.yml                         |
| 處理 freeze 鎖殘留與 junction 使用需求       | 實際遇到被終止後 EEXIST，或維護者要求專案位於 junction                | 先重現，再定義 stale lock 所有權與安全解除條件；不可刪除仍運作程序的鎖，junction 不能造成專案外寫入，相關安全回歸通過 | Claude Opus | 深掃報告（2026-10-2x）「觀察」；packages/cli/src/media-use/lib/freeze-publisher.mjs |
| 重建 Frost 產物與調整 PR／edit-accuracy 配套 | 需要改該區塊打包檔，或維護流程改走相關 PR／CI job                     | Frost 依鎖檔重建且產物檢查通過；PR 基準不再釘舊 PR；只在啟用對應 job 時採其測試，不改測試消除差異                     | Codex       | docs/DECISIONS.md:340、353；scripts/comment-check-base.mjs                          |
| 驗證分段 MOV 與媒體下載失敗行為              | 使用 HF_SEGMENTED_CAPTURE 輸出 MOV，或上游合併 #6481／#6606 對應修正  | 單一固定素材重現，MOV 可讀且時長／畫格符合設定；下載失敗有明確錯誤，不靜默少元素；正常 render 與 preview 回歸通過     | Codex       | docs/DECISIONS.md「issue 軸」#6481、#6606                                           |

## 刻意不做

| 不做什麼                                         | 理由                                                                      | 什麼情況下重新考慮                     |
| ------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------- |
| 因舊 Dependabot job 失敗重建 pnpm 鎖檔           | 本 repo 使用 bun，依賴圖與 bun.lock 的差異已有裁決                        | 專案正式更換套件管理器並有完整遷移計畫 |
| 為告警歸零全域覆蓋 esbuild 或全面升格式工具      | 會改不相關依賴與全 repo 格式，見 docs/DECISIONS.md「Dependabot 安全更新」 | 相容修補可用，或維護者批准獨立遷移     |
| 自動發布 npm、同步 ClawHub、改 branch protection | 發布守衛與治理權限見 FORK.md；不屬一般產品維護                            | 維護者另行授權自己的發布或保護規則     |

## 維護方式

每週按 [上游流程](docs/UPSTREAM.md) 與水位審 commit／PR／issue；上游快照與 workflow 成功各有時間，採用以實際 diff、分歧保留與裁決為準。
每月檢視依賴，安全公告即查；先跑 `pwsh -NoProfile -File tools/dev_check.ps1`，產品變更按 [開發指引](docs/DEVELOPMENT.md) 跑 bun build 與受影響測試，渲染改動以 Windows render verification、regression／preview-regression 驗收，POSIX 安全測試不可用 Windows skip 代替。
