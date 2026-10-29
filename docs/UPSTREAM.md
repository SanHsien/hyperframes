# 上游維護

## Remote

- Fork：`origin` → `https://github.com/SanHsien/hyperframes.git`（預設分支 `main`）
- 原作者：`upstream` → `https://github.com/heygen-com/hyperframes.git`（預設分支 `main`）
- 追蹤分支：`main`

## 檢查新提交

```powershell
git fetch upstream main
python tools\check_upstream_updates.py --strict
```

工具以 `tools/upstream_baseline.json` 的 `reviewed_through` 為起點，列出所有未審查提交、PR 與 Issues。
有新變更或檢查失敗時，`--strict` 回傳非零；排程 workflow 也會因此明確亮紅燈提醒。

CI 沒有 `upstream` remote，所以 baseline 的 `repo` 寫完整 clone URL，不要寫遠端短名。

## 審查清冊

每次只做一次批次審查：

1. 讀 commit 主旨與變更檔案（open PR 必須讀 diff，禁止只憑標題結案）。
2. 判斷是否與繁中 README、Windows gate、發佈閘門或測試衝突。
3. 可直接同步的提交用 merge；只需要部分修正時 cherry-pick 或最小重做。
4. 跑 `pwsh -NoProfile -File tools\dev_check.ps1`。
5. 在 `docs/DECISIONS.md` 記錄採用／略過理由。
6. 驗證完成後才把 baseline 推進到已審查的完整 40 字元 SHA 與更新 PR/Issue 水位。

Baseline 代表「已審查」，不代表「全部已合併」。

## 2026-09-12：fork 起點

本 fork 自上游 `main` `51a88b95660c5f67e66e9c5977226f6ae7b31255`
（`docs(catalog): put the install command above the preview (#3888)`）建立。
此 SHA 設為第一個 `reviewed_through`（短 SHA 為 `51a88b9`）。
之後的上游 commit 才需要進入審查清冊。

---

## 2026-09-12：上游 PR、Issue、分支全面盤點

2026-09-12 對 [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes) 進行基準盤點：
上游 PR 與 Issue 水位鎖定為 `#3896`。
本 fork **唯一長期跟隨分支為 `upstream/main`**。

### 防重複評估機制（Watermark 機制）

為避免每次巡檢重複評估既有項目，本專案實施嚴格的水位線（Watermark）機制：

1. **基準水位鎖定**：
   - Commit 水位：`51a88b95660c5f67e66e9c5977226f6ae7b31255`（短 SHA `51a88b9`）
   - PR 水位：`3902`
   - Issue 水位：`3902`
   - 記錄於 [`tools/upstream_baseline.json`](https://github.com/SanHsien/hyperframes/blob/main/tools/upstream_baseline.json)。

2. **增量巡檢機制**：
   - 每次執行 `tools/check_upstream_updates.py` 或 GitHub Actions 每週排程時，檢查器會自動過濾 `number <= watermark` 的項目。
   - 只有編號大於 **#3902** 的新開 PR / Issue，或 `main` 上高於 `51a88b9` 的新 Commit，才會出現在待審報告中。
   - 當新項目被審查完畢並於 [`docs/DECISIONS.md`](DECISIONS.md) 記錄結論後，再遞增更新 baseline 水位。


## 2026-09-30：第二輪 triage，水位推進到 `d1a5a05`

- commit 水位：`d1a5a05609a1c53996cb96c1ae2c9a57d09313aa`（675 筆歸組審查）；PR 水位 **#4784**（824 筆）；issue 水位 **#4763**（52 筆）。
- 採用 #3982／#3984（ByteString-safe）並修正 Windows 檔名取值；其餘記為 adoption pending，見 [`DECISIONS.md`](DECISIONS.md) 2026-09-30 條目。

## 2026-10-07：整樹採用，水位推進到 `d94708e`

- commit 水位：`d94708e5312df021e1fdcac421f00ed3015f11bd`。從 `d1a5a05` 之後的 commit 全部以整樹合併採用，沒有逐筆讀 diff；PR 水位 **#4784**、issue 水位 **#4763** 不動，因為這些編號沒有逐筆審查。
- 做法：以 `63574a7c7`（v0.8.35）為合併基底的橋接 commit，再合併 `upstream/main`；詳見 [`DECISIONS.md`](DECISIONS.md) 2026-10-07 條目，包含衝突表、保留的 fork 差異與驗證結果。
- 結果在本機分支 `sync/upstream-d94708e5`，未推送，待獨立審查。

## 2026-10-25：橋接 merge，水位推進到 `f5ab7711f`

- commit 水位：`f5ab7711fb8d0a3a0dea8bebc8e959448dac02d4`。自 `d94708e5` 之後的 753 個 commit 以橋接 merge 採用，沒有逐筆讀 diff；PR 水位 **#4784**、issue 水位 **#4763** 不動，因為這些編號沒有逐筆審查。
- 做法與逐檔衝突處理見 [`DECISIONS.md`](DECISIONS.md) 2026-10-25 條目。

## 2026-10-26：整樹採用 `f76fa5c91`，三個水位推進

- commit 水位：`5353171155473d1e75941306800d8909690c8cb1`（`535317115`，自 `f5ab7711f` 之後 66 個 commit；中間採用點 `f76fa5c91`，判準八掃描無隱藏內容）；PR 水位 **#6369**、issue 水位 **#6369**。
- PR／issue 以 `--state all` 列出 1400 與 172 筆：merged 者經 commit 軸抵達，341 個未合併 PR 以分歧檔案與 Windows／CJK／安全關鍵字篩出 108 筆，逐項查證並只引進 UTF-8 分段解碼一項；其餘結論與觸發條件見 [DECISIONS](DECISIONS.md) 的「2026-10-26：上游採用 `f76fa5c91`」。
- `check_upstream_updates.py` 現在會加大 `gh --limit` 直到碰到水位，不再在 1000 筆處靜默截斷。


## 2026-10-26（補）：整樹採用 `85dcc193d`，三個水位推進

- commit 水位：`85dcc193d560567c8d08e7f09c0f7fc9f2197c56`（自 `535317115` 之後 46 個 commit，v0.8.201–v0.8.204，判準八掃描無隱藏內容）；PR 水位 **#6429**、issue 水位 **#6422**。
- 這一段的 52 個 PR 與 8 個 issue 都逐筆處理：已合併的經 commit 軸抵達，未合併的 23 個 PR 取目前 head 讀 diff 並掃隱藏內容，全部等上游合併；逐項結論、5 個合併衝突的取捨與驗證缺口見 [DECISIONS](DECISIONS.md) 同日「補」條目。

## 2026-10-27：續批採用 `7d6c02f85`，commit 水位推進

- commit 水位：`7d6c02f85`（自 `85dcc193d` 之後 8 個 commit：#6418、#5273、#6245、#5593、#5447、#6415、#6373、#6375，判準八掃描無隱藏內容）；PR 水位 **#6429**、issue 水位 **#6422** 不動，因為這 8 筆編號都在既有水位之內。
- #5273 與 fork 的 `744a620fe` 重疊，整檔採上游實作；逐項結論與驗證見 [DECISIONS](DECISIONS.md) 同日條目。

## 2026-10-27（補）：追到 `acd0bc361`，PR 水位推進到 #6439

- commit 水位：`acd0bc361ffa238bda6d8cadbb97360b7fb9b1ab`（自 `7d6c02f85` 之後 2 個 commit：#5366、#3943，判準八掃描無隱藏內容）；PR 水位 **#6439**、issue 水位 **#6422** 不動。
- #6430–#6439 共 10 筆 open PR 逐筆取目前 head 讀 diff 並掃隱藏內容，全部等上游合併；其中 #6436 不能照抄（fork 的 `Function()` 包裝讓上游的標記失效），#6431 要先和行程所有權防線對齊。逐項結論見 [DECISIONS](DECISIONS.md) 同日「補」條目。

## 2026-10-27（續）：追到 `ad4d3fad1`，三個水位推進

- commit 水位：`ad4d3fad139490104f5bbeba66a2892c609e37fc`（自 `acd0bc361` 之後 20 個 commit，含 v0.8.205；判準八掃描無隱藏內容）；PR 水位 **#6458**、issue 水位 **#6443**。
- #6440–#6458 的 11 筆 open PR 取目前 head 讀 diff 並對 merge 後的樹做 `git apply --check`，全部可套用、全部等上游合併；前一輪 7 筆仍 open 的 PR 也重驗，#6431、#6436、#6438 仍套不上。逐項結論與驗證見 [DECISIONS](DECISIONS.md)「2026-10-27（續）：上游追到 `ad4d3fad1`（v0.8.205）…」條目；同日另有「2026-10-27（CI 紅燈）」條目，與水位無關。

## 2026-10-27（再續）：追到 `8f618c5ff`，commit 水位推進，PR 水位 #6459，issue 水位不動

- commit 水位：`8f618c5ffeb14b7fc2689ae0156efd75da5bc35d`（自 `ad4d3fad1` 之後 14 個 commit，含 v0.8.206；判準八掃描無隱藏內容）；PR 水位 **#6459**、issue 水位 **#6443** 不動。
- #6436 與本 fork 的 `Function()` 包裝衝突：標記放進字串字面值內，新增測試釘住（拿掉標記會失敗）。Windows 相關的 #6459、#6461、#6464 已合併並驗證。
- #6460 起的 open PR 與 issue #6465 這一輪沒有審完，所以水位停在 #6459；清單與目前 head 見 [DECISIONS](DECISIONS.md)「2026-10-27（再續）」條目。

## 2026-10-27（第五續）：追到 `933ae3eb5`，三個水位一起推進

- commit 水位：`933ae3eb5b173995ad730360f9a11f3e3c287e1d`（自 `8f618c5ff` 之後 10 個 commit，含 #6458、#6463、#6454、#6467、#6468、#6470；判準八掃描無隱藏內容）；PR 水位 **#6479**、issue 水位 **#6465**。
- #6460 起的 12 筆 open PR 與 issue #6465 取目前 head 讀 diff 後逐筆結論，全部等上游合併；#6473 單獨套用會讓型別檢查失敗（拿掉本線還在用的 `page_motion_blur`）。#6407／#6408／#6411 的上游身分資訊依既有決定不採用，merge 後以獨立 commit 還原。逐項結論、head SHA 與觸發條件見 [DECISIONS](DECISIONS.md)「2026-10-27（第五續）」條目。

## 2026-10-29：完成新一批裁決與變動 PR 重掃，未採用產品

- commit 審查水位：`17ffe479dc4283444b6874030a3ccf5a7eb3ea3e`（水位後 105 筆）；PR 水位 #6751（新增 120 筆）；issue 水位 #6721（新增 2 筆）。
- #6613、#6616、#6617、#6621、#6622 目前都已合併，依完整 head 重掃，裁決與主線 commit 見 [本輪清冊](UPSTREAM_REVIEW_2026-10-29.md)。本輪所有產品變更均未採用，不以審查水位冒充同步版本。
- 21 筆 open PR 使用 baseline `monitored` 記錄 head 與 open／draft 狀態，後續換版或合併會再報；本線需要的實作與驗收只列於 [ROADMAP](../ROADMAP.md)。

## 2026-10-30：接續半成品並補審最新增量

- 三軸水位為 commit `4e2a1c215a42c6d262b8c635df9d5edff80e8830`、PR #6755、issue #6753。累計 107 個 commit、123 筆 PR、3 筆 issue 均有裁決，本輪仍未採用產品。
- 指定 5 筆 PR head 不變；#6696／#6750／#6751 狀態更新，另新增 3 筆追蹤，baseline monitored 共 24 筆。續查證據與完整 SHA 見 [清冊續記](UPSTREAM_REVIEW_2026-10-29.md)。
