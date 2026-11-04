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
- 21 筆 open PR 使用 baseline `monitored` 記錄 head 與 open／draft 狀態，後續換版或合併會再報；本線需要的實作與驗收只列於 [ROADMAP](https://github.com/SanHsien/hyperframes/blob/main/ROADMAP.md)。

## 2026-10-30：接續半成品並補審最新增量

- 三軸水位為 commit `4e2a1c215a42c6d262b8c635df9d5edff80e8830`、PR #6755、issue #6753。累計 107 個 commit、123 筆 PR、3 筆 issue 均有裁決，本輪仍未採用產品。
- 指定 5 筆 PR head 不變；#6696／#6750／#6751 狀態更新，另新增 3 筆追蹤，baseline monitored 共 24 筆。續查證據與完整 SHA 見 [清冊續記](UPSTREAM_REVIEW_2026-10-29.md)。

## 2026-11-02：追到 `cd5984261`，移植五筆小修正

- 三軸水位為 commit `036e41fa09e6670f155fa3f2c361b58b8ed77e02`、PR #7014、issue #6995。累計本輪 195 個 commit、246 筆 PR、13 筆 issue 均有裁決，裁決與完整 SHA 見 [2026-11-02 清冊](UPSTREAM_REVIEW_2026-11-02.md)。
- 採用 #6771、#6605、#6611、#6831、#6800；其餘產品延後，baseline monitored 共 72 筆。

## 2026-11-03：採用 #7015，水位不動

- 採用 #7015（`5a07ea2`：`catalog` 讀不到 registry 時 exit 1 並說原因），細節見 [`DECISIONS.md`](DECISIONS.md) 2026-11-03 條目。
- 三軸水位仍為 commit `036e41fa09e6670f155fa3f2c361b58b8ed77e02`、PR #7014、issue #6995；其餘新進項目尚未審查，不推進水位。

## 2026-11-04：連續區段審查與 #7053

- 逐筆裁決與檔案行號見 [維護決策](DECISIONS.md#2026-11-04上游連續區段與同秒匯出修正)。審查 15 個 commit（連續 14 個加 #7053）、10 筆 PR、4 筆 issue、7 筆既有 monitored 變動；不同軸有重疊，不相加當作獨立修正數。
- 採用 #7053；#7015 與 sharp 0.35.5 保留既有採用，不重複移植。commit 水位只到 `4c1c1782afae1ac45f119771dc2c142edfd86304`，不跨過未審的 `e8ffaa410`；PR 水位到 #7025，issue 到 #7113。#7053 雖已審，仍在 commit／PR 水位以上。
- 更新 7 筆已審 monitored 的 head／狀態，新增 #7019、#7023 的條件追蹤；其餘變動保持原釘選值。未審範圍與 issue 重訪條件由 repo 根目錄 `ROADMAP.md` 追蹤。
- 結束檢查固定上游 `183614bda3df15812d9f18fd4a71ee77a7da6387`：strict exit 1，水位以上 67 commit／101 PR／0 issue／22 monitored；扣除已審 #7053，未審為 66／100／0／22。新增 release #7128 保持未審，不跨越水位。

## 2026-11-04（續）：追到 `8a6636efe`，移植 #7049

- 逐筆裁決與檔案行號見 [2026-11-04 接續清冊](UPSTREAM_REVIEW_2026-11-04.md)。審查 18 個 commit（連續 14 個加 4 個水位以上）、23 筆 PR、3 筆 monitored 變動。
- 採用 #7049（較舊 CLI 版本快取不進入 metadata）。三軸水位：commit `8a6636efe36c3ec313aeb4a122f875b687ffdc5d`、PR #7049、issue #7113；baseline monitored 共 78 筆。
- 未審範圍由 repo 根目錄 `ROADMAP.md` 追蹤。

## 2026-11-04：缺口接續至 `79b6af9b4`

從 `8a6636efe` 之後逐筆讀實際補丁，新增審 14 個 commit、18 筆 PR、1 筆 monitored；證據、採用／不適用／延後與重訪條件見 [接續缺口清冊](UPSTREAM_REVIEW_2026-11-04_CONTINUED.md)。採用 #7115 的 FFmpeg error code／signal 診斷，focused 回歸先紅後綠、CLI ESM／DTS build 成功。產品 Quick gate 仍因既有兩例 Windows symlink EPERM 失敗，不宣稱完整產品驗收通過。

commit 水位只推進連續 14 筆至 `79b6af9b484280706da5d1af8e981305f4e1a13d`，其中 #7053／#7048／#7046 沿用既有證據；另審 #7063／#7057／#7115，不跳過下一筆 `9a2cd9e61`。PR 水位至 #7067，issue 保持 #7113；重釘 #6949 的 head／closed，新增 #7055 的 open head。上游快照為 `183614bda`，計畫範圍見 ROADMAP.md；審查不代表整版產品採用。

## 2026-11-04：接續至 `3f42dc1c7`，移植 #7087

新增逐筆審查 12 個 commit、15 筆 PR、3 筆 monitored 變動；檔案行號、完整 PR head、裁決與重訪條件見 [同日接續清冊](UPSTREAM_REVIEW_2026-11-04_CONTINUED.md#2026-11-04接續至-3f42dc1c7-與完成任務-ttl)。採用 #7087 的最小完成任務 TTL 修正，兩例回歸先紅後綠，受影響 render／renderDeletion 96 passed／1 skipped，studio-server ESM／DTS build 成功。

commit 水位只推進連續 11 筆至 `3f42dc1c73b0c9915b311e48bd0099b39a0865a9`，其中 #7041／#7063／#7057 沿用已有逐筆證據；額外審 #7068／#7069／#7082／#7087 不跨下一筆 `2daedcdaf`。PR 水位至 #7077，不跨 #7078；issue 保持 #7113。重釘 #6945／#6963／#7003 的 closed head，新增 open #7079，monitored 共 80 筆；上游固定 `183614bda`。剩餘計畫只在 ROADMAP.md 近期列維護，審查不代表整版同步或完整產品驗收。

## 2026-11-04：追到 `183614bda`，移植 10 筆獨立修正

逐筆審查 22 個新 commit（連續區段 `2daedcdaf..183614bda` 共 28 個，其中 6 個沿用既有證據），檔案行號、PR head、紅綠證據與重訪條件見 [同日接續清冊](UPSTREAM_REVIEW_2026-11-04_CONTINUED.md#2026-11-04接續至-183614bda移植-10-筆獨立修正)。採用 #6842 的 `<template>` 媒體 offload、#7013 的 0.x minor 與 Homebrew 不背景升級、#7088／#7093 的腳本載入診斷與取消判定、#7097 的社群邀請連結、#6745 的媒體時長單檔寫入、#6919 的 check 分析閒置視窗、#6947 的 check 預設等待、#6928 的取消判定、#7096 的睡眠不計入擷取停滯；#7092／#7104／#7120 與 #7013 的 skills 安裝延後，billing、templates、reverse 與版本宣告不適用。

三軸水位為 commit `183614bda3df15812d9f18fd4a71ee77a7da6387`、PR #7077、issue #7113。PR 水位不動：#7078 起仍有未審項目，隨 commit 讀過補丁的 16 筆 PR 只作額外證據；baseline monitored 未重釘，共 80 筆。剩餘範圍只在 ROADMAP.md 近期列維護，審查不代表整版同步或完整產品驗收。

## 2026-11-04：追到 `1ff4cefd4`，移植 4 筆獨立修正

逐筆審查 10 個 commit（`183614bda..1ff4cefd4` 連續）、#7078–#7157 範圍內尚無證據的 PR、19 筆既有 monitored 重釘與 8 筆新增；檔案行號、PR head、紅綠證據與重訪條件見 [同日接續清冊](UPSTREAM_REVIEW_2026-11-04_CONTINUED.md#2026-11-04接續至-1ff4cefd4移植-4-筆獨立修正)。採用 #7143（scene 內 host 共用 composition id 時各自保有 timeline）、#7151（Windows 磁碟根目錄輸出不再在寫檔前 EPERM）、#7155（雲端上傳被拒時點名檔案與參數）、#7154（頁面從未就緒的 render 只失敗一次並回報不可重試的錯誤碼，手工適配本線 `server.ts` 的錯誤碼集合）；#7144、#7145、#7152、#7156 不適用，#7094、#7102 延後（update 指令與 skills 政策成組）。

三軸水位為 commit `1ff4cefd40c8dad98127fc78e8761c1ac62053dd`、PR #7157、issue #7113；baseline monitored 共 88 筆（19 筆重釘，新增 #7098、#7110、#7142、#7150、#7119、#7148、#7153、#7154）。收尾 strict 檢查 exit 0；上游仍會前進，剩餘範圍只在 ROADMAP.md 維護，審查不代表整版同步或完整產品驗收。

## 2026-11-04：接續至 PR #7160，三筆新開 PR 釘選

審查 #7158、#7159、#7160 三筆新開 PR，皆為 open，沒有可移植的 merged 修正；逐筆 head、檔案行號與條件式裁決見 [同日接續清冊](UPSTREAM_REVIEW_2026-11-04_CONTINUED.md#2026-11-04接續至-pr-7160三筆新開-pr-全數釘選)。#7158（EPIPE 時失敗的 run 改 exit 1）本線有同類缺陷，合併後採用；#7159（預覽健康點名媒體元素）與 #7160（skills 提示改對人說）延後。

三軸水位為 commit `1ff4cefd40c8dad98127fc78e8761c1ac62053dd`、PR #7160、issue #7113；baseline monitored 共 91 筆（新增 #7158、#7159、#7160）。收尾 strict 檢查 exit 0；審查不代表整版同步或完整產品驗收。
