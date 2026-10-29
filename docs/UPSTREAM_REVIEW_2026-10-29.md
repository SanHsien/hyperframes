# 2026-10-29 上游審查清冊

本輪來源：[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)。本線起點為 `89b98d266b342ed0bd4bfee0e6ff2467537cbc89`（detached HEAD）。本輪只做唯讀來源查詢與維護紀錄，不引入產品程式、依賴、workflow 或技能變更。

## 範圍與證據

- Commit：`bf7ebe961e522533fbbd9b94384198d662935ef5..17ffe479dc4283444b6874030a3ccf5a7eb3ea3e`，105 筆，475 檔，+15415/-6172。依主旨、完整變更檔清單與本線分歧交集逐筆分類；指定 5 筆與安全／身分／發布相關項目另讀 diff。這不是整樹逐行安全審計。
- PR：編號 >6629，共 120 筆（91 merged、21 open、8 closed 未合併）。91 筆 merged 都在固定 commit 範圍找到對應 `(#N)`；21 筆 open 取得 diff，依當前 source／test 內容裁決，不用標題代替。
- Issue：編號 >6610，共 2 筆（#6708、#6721），已讀內文與留言（兩筆皆無留言）。
- 指定重掃：#6613、#6616、#6617、#6621、#6622 均已 merged；表中記錄目前完整 head 與落入 main 的 commit。末次批次核對所有 125 筆所列 PR，head／state 無變動，也沒有新編號 >6751。
- 查詢：`python tools/check_upstream_updates.py --strict`、`gh pr list --repo heygen-com/hyperframes --state all --limit 180 --json number,title,state,headRefOid,baseRefName,mergedAt`、`gh api repos/heygen-com/hyperframes/pulls/<N> -H "Accept: application/vnd.github.diff"`、`gh issue view <N> --repo heygen-com/hyperframes --json number,title,body,state,comments`。
- #6711 diff API 因超過 300 檔回 406，改用 `gh api repos/heygen-com/hyperframes/pulls/6711/files?per_page=100 --paginate --slurp`：452 檔皆有 patch；448 份 Catalog 頁面皆加入 static head 與 static Docs slot，另 4 檔為 CSS、snippet、生成器與測試。
- Open PR 新增行掃描 `eval`／`new Function`／`atob`／`fromCharCode`／`globalThis`／`global.require`／零寬與雙向控制字元，只有 #6687 測試替換與還原 `globalThis.fetch` 的 3 行命中；不把掃描結果當成安全保證。
- 本機原始查詢、diff、套用檢查與 gate log 留在忽略的 `tmp/upstream-20261029/`；可追溯裁決與完整 SHA 保留於本清冊。

## 指定 5 個 PR 重掃

| PR | 目前 head | main commit | 內容與裁決 |
| --- | --- | --- | --- |
| [#6613](https://github.com/heygen-com/hyperframes/pull/6613) | `155fe9fbe087991253c3d8c3d8465058d7b947b9` | `6cf4b5669703d9416d2ec276accff638d4a89ec6` | 22 檔 +356/-65。已不只是 CI：多個入口載入 hideChildConsoles，全域包裝 child_process 並 syncBuiltinESMExports；openBrowser／desktopApp 明確 windowsHide:false，另升 Puppeteer ~25.11。探測每 50 ms 枚舉整個桌面新視窗，並非只計渲染程序，亦無刻意開視窗負例。延後移植，須驗證程序所有權、可見視窗正反例與正常 render；不能沿用舊「只動 CI」裁決。 |
| [#6616](https://github.com/heygen-com/hyperframes/pull/6616) | `d02c0e70bfc9f8e003219db7fb39a47f49e5ba36` | `22e6da0233e905c39efc7a522e3a245f38decc2c` | 77 檔 +486/-110。統一 defineCommand 工廠、WeakSet 註冊契約、agent 偵測與 exit 2；涉及 fork 的 init／catalog／clean。延後整批對齊，不只替換 import。 |
| [#6617](https://github.com/heygen-com/hyperframes/pull/6617) | `49624ea9be8cc3e27d7523f05320e9521e75f012` | `0bdc128cb589c99147c76a2e9a5eb4a66f4b1be2` | 31 檔 +300/-37。承接 #6616，禁止 unattended prompt／自動安裝、統一 prompts wrapper，publish／upgrade 缺確認旗標退出 2。延後，須驗證 init、prompts 與自動更新契約。 |
| [#6621](https://github.com/heygen-com/hyperframes/pull/6621) | `75e80e490e57943b8a737cfd76ca292b59abd8d1` | `e2c91513203ec9be1833840bcfb35183a3dcee8d` | 11 檔 +310/-41。help 子指令、拼字建議、stderr usage、每日 skill notice 狀態檔。延後，須驗證 stderr／stdout、notice 寫入與 CLI 失敗語意。 |
| [#6622](https://github.com/heygen-com/hyperframes/pull/6622) | `dab4b83494a33fd7cda20c71a0d82fc4bee234ad` | `85efaece7e11a3e420fb4d93b85230781e805942` | 47 檔 +676/-198。依賴前述 CLI 工廠／prompts／help，新增 JSON failure envelope、攔截 stdout／console／stderr，未宣告 JSON 的指令退出 2。延後，不能單獨套用並宣稱契約一致。 |

對這 5 份完整 patch 執行 `git apply --check tmp/upstream-20261029/pr-<N>.diff` 全部 exit 1（未套用任何內容）：#6613 衝突從 bun.lock 開始；其餘因 .oxlintrc、docs 或前置 CLI 工廠尚未存在而失敗。這是相容性檢查，不是修 bug 的修前失敗證據。

## Open PR：逐項裁決

下列 21 筆在 baseline 的 `monitored` 釘住完整 head 與 open／draft 狀態；以後 head 或狀態改變會再報，不會因 PR 編號水位提高而永久隱藏。延後項目在合併、實際觸發本線需求或進入對應採用批次時重看。

| PR | 審查 head | 內容與裁決 |
| --- | --- | --- |
| [#6670](https://github.com/heygen-com/hyperframes/pull/6670) | `8fe0584bde1ba5853462a49452fbb5341c3b4cc1` | 延後：Windows 渲染測試拆分及 agentMode 獨立序列，須先帶入 CLI 工廠，再驗證每個 shard 的測試覆蓋與一次性檢查。 |
| [#6671](https://github.com/heygen-com/hyperframes/pull/6671) | `919df04fc067f98ece0cc3b7b1057cf3bf1d054f` | 延後：HDR 自動提升新增 gradedCanvas 與 gradingKeepsSdr，跨 engine／producer，須保留 assertPrivateCacheRoot 並做 SDR／HDR 畫格驗收。 |
| [#6687](https://github.com/heygen-com/hyperframes/pull/6687) | `752f5308009fbf1af008d422201ca5d25c1b952f` | 延後：OAuth client／環境綁定、憑證目錄改為 .hyperframes、媒體 helper 建暫存憑證；涉及登入相容與授權來源，不在純審查中遷移帳戶。 |
| [#6688](https://github.com/heygen-com/hyperframes/pull/6688) | `5a84b804ce11473fb3f861b7c23828392fbb8d95` | 略過此版本：上游 Linux Test(cli) 拆 shard，不能覆蓋 fork 的 Windows-only ci.yml；本線若拆測試需另配 gate。 |
| [#6695](https://github.com/heygen-com/hyperframes/pull/6695) | `ddc987bd983b0d4d316399ad3137eb6a4437fe2f` | 延後：CLI／engine 的 undici 7.25.0 → 7.30.1；本線尚未引入 #6571 的直接依賴，不能直接套兩份 manifest 或宣稱已修安全漏洞。 |
| [#6696](https://github.com/heygen-com/hyperframes/pull/6696) | `10c5a8ee925750bfe80b6ac8747af132f82f7be7` | 不採用此版本：產生碼移除 page_motion_blur；本線 cloud/render.ts:814、843 仍索引該型別並送出欄位，需先對齊 API。 |
| [#6702](https://github.com/heygen-com/hyperframes/pull/6702) | `b9d040c73b15a7bc90a2c14748d5cc7b7e663cca` | 延後：從 worker perf 彙整 captureBeyondViewport，屬渲染觀測介面變更；待對應 capture 路徑驗證。 |
| [#6704](https://github.com/heygen-com/hyperframes/pull/6704) | `f3d895e450f1cb15dba73298ed92a4a339b65cfb` | 延後：從憑證 user block 讀 email／username 並在事件加 $user_id，且依賴 #6703；須另評估遙測歸屬與退出行為。 |
| [#6711](https://github.com/heygen-com/hyperframes/pull/6711) | `7e90b50392c38c373a063a0679d43ba8f7bb750c` | 延後：Catalog 標題、簡介、Docs 文字改由伺服器 HTML 提供；452 檔中 448 份產生頁面模式一致，生成器／CSS／snippet 須一起建置並驗證頁面。 |
| [#6714](https://github.com/heygen-com/hyperframes/pull/6714) | `6c09af3980ed84a27f0493aec10c283769a26758` | 延後：唯一未標記 audio 被當音樂、多個候選回報歧義；同改 core、CLI、skill 與 manifest，須驗證 beats 的既有 JSON 契約。 |
| [#6715](https://github.com/heygen-com/hyperframes/pull/6715) | `df71defeda793f833a9d372b2ea95b163a445389` | 延後：URL.canParse 取代 try/catch，依賴已合併但本線尚未採用的 #6706 代理錯誤說明。 |
| [#6716](https://github.com/heygen-com/hyperframes/pull/6716) | `411eb179be7a3623c9b68410eb5441264b3131d1` | 延後：新增 core/cache-dir 出口並搬移各種快取；須對齊本線私有快取根、Windows LOCALAPPDATA 與既有資料位置。 |
| [#6722](https://github.com/heygen-com/hyperframes/pull/6722) | `9b849c06709226bb69b2e47ad32c8be8b260a11e` | 延後但列近期修復：usedArchivePaths 應由 fileContents.keys() 初始化；本線仍是空 Set，存在相同覆蓋路徑。上游測試涵蓋記憶體／磁碟 staging、重複引用及 ZIP；整份 patch 因文件上下文不同無法直接套用，尚未本機重現或移植。 |
| [#6727](https://github.com/heygen-com/hyperframes/pull/6727) | `ffabeb89a464fcc2d5bb3fac0037550c77da8f65` | 延後：以 accessSync 區分 ENOENT／ENOTDIR 與存取失敗；須對 Windows 權限與正常 resolveProjectOrThrow 路徑跑回歸。 |
| [#6732](https://github.com/heygen-com/hyperframes/pull/6732) | `a07b25ea9214f89ab2f6ce566d63257feaa5509d` | 延後：SVG contact sheet 改用 basename，符合 Windows 需求；整份 patch 的測試上下文套不上，須在本線補先紅後綠案例。 |
| [#6738](https://github.com/heygen-com/hyperframes/pull/6738) | `cc982826ea7e0c92657bc4e79221e591cdc15adc` | 不採用此版本：repro-only 的檔案刪除／改名追蹤、長渲染 workflow 與 encodeStage 診斷；不是 ENOENT 修正，會增加測試輸出與成本。 |
| [#6739](https://github.com/heygen-com/hyperframes/pull/6739) | `444b9b92be2f373774de12ad8eac4d0ff420243e` | 延後：TransportClock 從 500 ms hard-sync 改用 100 ms audio steer 門檻，含 300 ms 落後／50 ms 等待案例；須跑 clock 與 iOS 播放驗收。 |
| [#6745](https://github.com/heygen-com/hyperframes/pull/6745) | `5cc515742006a00db3a42ad25e75672a3a5b5672` | 延後：mediaProbe callback 由單一 key 改為 Map，按來源檔合併 store 更新；須測多 clip 共用素材與預覽更新。 |
| [#6748](https://github.com/heygen-com/hyperframes/pull/6748) | `313225ca54fdd7561852c322df1d624a87a16172` | 延後：Pi 教學與導覽、README；需先驗證 Pi 安裝方式，再同步繁中 README.md 與 README.en.md，不照抄上游 README。 |
| [#6750](https://github.com/heygen-com/hyperframes/pull/6750) | `d68e91133e5af02ef4df95349c8964f458db3b6e` | 延後：下載停滯測試等 .part 寫到指定長度後才觸發 timeout，僅測試變更，依賴本線尚未採用的 #6649／#6694。 |
| [#6751](https://github.com/heygen-com/hyperframes/pull/6751) | `556008794903a3ab198d858338d28d3a0a2514f1` | 略過此版本：v0.8.217 版本與發布文件；本 fork 不發 npm，不單獨同步版本號。 |

## 關閉未合併 PR

均不採用關閉版本；若 reopen 或有新替代 PR 再依當前內容重看。#6733 的 ffmpeg mirror 方案與已合併 #6728 重疊，但不把它視為已採用。

| PR | head | 內容 |
| --- | --- | --- |
| #6645 | `ed5e266d616b74a08ec8e41568b1520577494aca` | ci(windows): probe a render whose temp drive runs short of space；不採用。 |
| #6655 | `47f7803c8723eaa476f702774db9b7869e020301` | ci: probe check on trimmed audio clips at main and at the fix；不採用。 |
| #6657 | `7f86a032c0b4fd3f2dd10c86856a8310c64117ac` | ci(windows): probe the exit code of check and snapshot after success；不採用。 |
| #6668 | `afa2f537d2665254803404e645f4b83dc6f59a96` | ci: probe snapshot on four stills at main and at the fix；不採用。 |
| #6677 | `100781992f6ba442a072f9bc529cddb22348a062` | ci: the cli test job gets 15 minutes, as its runs now take 7 to 10；不採用。 |
| #6733 | `6c020c6ef3e280953fa8278e18153d9e0cf4cb2c` | fix(aws-lambda): the release ffmpeg build falls back to a mirror when ffmpeg.org is down；不採用。 |
| #6743 | `1ba89164ac30ba40cfdcccb23033ce649c1edea0` | chore: release v0.8.217；不採用。 |
| #6744 | `6b7fad088d63e9d677e11375697bfed8c4e44339` | refactor(engine): late-start measurement reads from names, not comments；不採用。 |

## Issue 裁決

| Issue | 內容、目前證據與結論 |
| --- | --- |
| [#6708](https://github.com/heygen-com/hyperframes/issues/6708) | 旁白文字、音訊、逐字字幕與場景時間聯動的產品提案；儲存位置與是否自動推移後續場景未定。延後，不在上游巡檢中自行新增 narration API；待上游定案。 |
| [#6721](https://github.com/heygen-com/hyperframes/issues/6721) | `_ext/shared/logo.*` 已存在時，外部素材會佔用相同 archive key。本線 publishProject.ts:607 同樣以空 Set 初始化（靜態確認，尚未本機重現）；#6722 有對應修正與測試，記入 ROADMAP 近期項目，不宣稱已修。 |

## Commit 軸逐筆清冊

以下每筆都不在本輪採用；「延後」保留於後續採用批次，並不代表產品缺陷已修或已完成整合。對照完整檔案清單取自 `git diff-tree --no-commit-id --name-only -r <SHA>`，與 `git diff --name-only bf7ebe961 HEAD` 的交集如下。未重疊也不代表可免測直接採用。

裁決代碼：A＝CLI 契約需成組建置與回歸；B＝Windows／渲染／播放改動需產品與畫格驗收；C＝本線安全或身分邊界需另外整合驗證；D＝上游 CI／發布配套不直接替換 fork；E＝文件／品牌／版本／功能／測試目前不引進。

特殊項：#6571 的 DNS lookup 防私有位址含代理例外且帶 undici；#6565 的專案 .env 白名單會改變設定載入，需保留本線 capture 安全防線；#6703 改登入後遙測身分與 traits，不順帶採用；#6734 路徑遮蔽需 Windows／CJK 回歸；#6736 的長影片尾幀修正已被 #6746 撤回，不挑回被撤回版本；#6713 僅處理上游 ClawHub 已佔版本，不啟用 fork 發布。

| Commit（完整 SHA） | PR／主旨 | 檔數 | 本線分歧交集 | 裁決 |
| --- | --- | --- | --- | --- |
| `815ff9ec8d755b52c050943765bf15c9c9b1e88e` | perf(cli): check's craft pass skips clips the runtime has hidden (#6627) | 3 | `packages/cli/src/commands/layout-audit.browser.js` | B：延後／本輪不採用 |
| `22e6da0233e905c39efc7a522e3a245f38decc2c` | feat(cli): define every command through one factory and test them all as an agent (#6616) | 77 | `packages/cli/src/commands/catalog.ts`<br>`packages/cli/src/commands/clean.ts`<br>`packages/cli/src/commands/init.test.ts`<br>`packages/cli/src/commands/init.ts` | A：延後／本輪不採用 |
| `a54921e0f6c5115b38e83884fc0de21ca6916032` | perf(studio): share video sources and keep frames for timeline thumbnails (#6629) | 13 | 無 | B：延後／本輪不採用 |
| `b288ce01870a2b4cbae40706b5a04e55e6a2fb71` | fix(cli): snapshot prints a progress line as each frame starts (#6618) | 3 | 無 | B：延後／本輪不採用 |
| `dd7290ae8383a4161a7271b5702a8f65171ed4ab` | fix(studio): the desktop card says the download opens hyperframes.studio (#6594) | 1 | 無 | E：延後／本輪不採用 |
| `2b6d1764524528a26b8375d1d13be62f3e7767bf` | perf(producer): worker sizing measures screenshot capture, one browser launch fewer (#6630) | 2 | 無 | B：延後／本輪不採用 |
| `7d83a3d219897cc99ba9a8067123523cdddf6eb4` | perf(producer): drawElement films keep their parallel workers instead of dropping to one (#6633) | 4 | 無 | B：延後／本輪不採用 |
| `3cc296845a5d02500c7e5f5f3b695e5d2e2b9b56` | feat(core): name why a choppy preview window dropped frames (#6634) | 5 | 無 | B：延後／本輪不採用 |
| `1d97ed24c647553cefb251c59b1bccc48ff4f09c` | perf(producer): the audio mix runs while capture starts its browsers (#6632) | 3 | 無 | B：延後／本輪不採用 |
| `6cf4b5669703d9416d2ec276accff638d4a89ec6` | fix(engine): a render on Windows opens no console windows (#6613) | 22 | `bun.lock` | B：延後／本輪不採用 |
| `0bdc128cb589c99147c76a2e9a5eb4a66f4b1be2` | fix(cli): never prompt or auto-install when nobody is at the terminal (#6617) | 31 | `packages/cli/src/commands/catalog.test.ts`<br>`packages/cli/src/commands/catalog.ts`<br>`packages/cli/src/commands/init.ts` | A：延後／本輪不採用 |
| `2ddf41eb7d0b3aa7a8ee7d267b5090e852bc215e` | perf(producer): download a remote video once per render (#6637) | 2 | `packages/producer/src/services/htmlCompiler.ts` | B：延後／本輪不採用 |
| `e6476c2cd57d8e605ca4d25f6c8b4fef6fdb322e` | perf(engine): Macs with a hardware GPU render with more capture workers (#6636) | 6 | `packages/engine/src/index.ts` | B：延後／本輪不採用 |
| `8e63faf8462d677661fccd9f1f1661ba07575729` | perf(engine): a --gpu render probes the GPU encoders once, not twice (#6638) | 6 | `packages/engine/src/index.ts` | B：延後／本輪不採用 |
| `51f9fa7c541fa2a8f57ae700d4189396058bbd62` | perf(aws-lambda): small-chunk cloud renders stitch their output in parallel (#6635) | 10 | `packages/aws-lambda/src/handler.test.ts` | B：延後／本輪不採用 |
| `30df5a48af7bc263aa6d09ba19d44a3339338b07` | fix(studio-server): undo and redo on Windows restore a file something holds open (#6628) | 6 | 無 | B：延後／本輪不採用 |
| `fa137cdfef07943033931c2a27cb8d788e650fc3` | fix(studio): a slow thumbnail job keeps a reader that other clips still decode from (#6643) | 3 | 無 | B：延後／本輪不採用 |
| `6553b1f6ba75582c0a2d0830cf74a84c434548a0` | perf(producer): --gpu renders encode while frames are captured (#6631) | 3 | 無 | B：延後／本輪不採用 |
| `5ed694264e9a48aebca0a0f29b94dbd30c2e29d0` | chore: release v0.8.211 (#6623) | 21 | `packages/cli/package.json`<br>`packages/sdk/package.json`<br>`packages/shader-transitions/package.json` | E：延後／本輪不採用 |
| `3d1c0764a018c5c0412c6273a54c87b6ce532ef7` | fix(cli): check prints a progress line as each pass after overlap begins (#6646) | 3 | 無 | B：延後／本輪不採用 |
| `e2c91513203ec9be1833840bcfb35183a3dcee8d` | fix(cli): add help [cmd], suggest the closest command or flag, and quiet the nags (#6621) | 11 | 無 | A：延後／本輪不採用 |
| `7758d9b8fd507384573eb56ba84cc62fb20444c6` | fix(engine): a Windows browser that will not start says where and why (#6647) | 2 | 無 | B：延後／本輪不採用 |
| `5a0179b88eb3da0e10797288b0c3ce2435e33d66` | fix(studio-server): the render route passes a MOV ProRes profile to the render (#6644) | 4 | 無 | B：延後／本輪不採用 |
| `0e32ee9b56bd0815c0dc23a1c3fbb81aa8c43a87` | ci: keep the bun cache warm and skip binary downloads in preflight (#6648) | 4 | `.github/workflows/ci.yml`<br>`package.json` | D：延後／本輪不採用 |
| `a88751d9d68475c84542c2cbc3621742ddfccd76` | fix(studio): a thumbnail reader forgets a start's failures after a minute (#6642) | 2 | 無 | B：延後／本輪不採用 |
| `7112e4b6bff935dcdcfc475e20b3719d7585251d` | test(studio): wait for the first undo press before the edit that should block the second (#6652) | 1 | 無 | E：延後／本輪不採用 |
| `ecad35a2254c98b84c9410072908c902eb3f7241` | fix(cli): resume a model download that stalls partway instead of failing (#6649) | 2 | 無 | B：延後／本輪不採用 |
| `205c1a31d3b4f031e7a10ef6dec8b7581c743d1a` | fix(inspector): live queries see every composition, wherever the playhead is (#6651) | 8 | 無 | B：延後／本輪不採用 |
| `b6eaed7cae2a92e80955c1b8d40db129cb74230b` | fix(cli): a check page forces a WebGL drawing buffer but keeps no list of 2d canvases (#6650) | 5 | `packages/engine/src/index.ts` | B：延後／本輪不採用 |
| `85efaece7e11a3e420fb4d93b85230781e805942` | fix(cli): every --json failure answers with one envelope, and --json only where supported (#6622) | 47 | 無 | A：延後／本輪不採用 |
| `b84762230f03dd182e950df93eb6849b86a12aec` | fix(cli): snapshot warns when a video on screen has no source to read a frame from (#6656) | 2 | 無 | B：延後／本輪不採用 |
| `2d3033c719bc82ea4a82fe4d7141e0669ab9a14d` | fix(cli): exit 2 for remaining flag validation errors (#6639) | 36 | `packages/cli/src/commands/init.test.ts`<br>`packages/cli/src/commands/init.ts` | A：延後／本輪不採用 |
| `eba596d026347d2e25a95692d77bd0ca2b830fe3` | chore: release v0.8.212 (#6660) | 22 | `packages/cli/package.json`<br>`packages/sdk/package.json`<br>`packages/shader-transitions/package.json` | E：延後／本輪不採用 |
| `1df31d8717578e31d4c80c194410bbc65783ff6f` | fix(audio): a sound is voice only with a voice-range pitch, judged on the whole clip (#6653) | 15 | 無 | B：延後／本輪不採用 |
| `437784038b10ef9dc1563a25865acae93cce3b2a` | fix(engine): late-starting MP4 and WebM videos render every frame the preview shows (#6664) | 12 | `packages/engine/src/index.ts`<br>`packages/engine/src/services/videoFrameExtractor.ts` | B：延後／本輪不採用 |
| `5a9fdd524b3303c23182176910a28201821819c9` | fix(cli): a late teardown error no longer turns a finished command into exit 1 (#6659) | 3 | 無 | A：延後／本輪不採用 |
| `4db1214e7df8bb56328da5db75e60eac3f57020c` | test(engine): the multi-chunk encode test gets the 30 s the other ffmpeg tests have (#6663) | 1 | 無 | E：延後／本輪不採用 |
| `6486d580218a57838b8bd37ab66e200c127acfe4` | test(producer): stall test no longer waits a real second for the progress flush (#6658) | 1 | 無 | E：延後／本輪不採用 |
| `40c28e10dbca440c9707ff8f66b0425cd78913af` | fix(studio): a timeline edit on a clip the file lacks says how the clip was looked up (#6661) | 2 | 無 | B：延後／本輪不採用 |
| `8fe0ce660bd8be77d70adf4ac10d699c3782c4a1` | fix(cli): check probes each audio file once, however many clips are cut from it (#6654) | 2 | 無 | B：延後／本輪不採用 |
| `a1733f4e40e7e60025b6e481be18309d2b5bd87f` | fix(cli): check treats text inside a closed details element as not rendered (#6669) | 2 | `packages/cli/src/commands/layout-audit.browser.js` | B：延後／本輪不採用 |
| `cd3b90d1edde62c3181800ee469b425edd32889f` | fix(cli): snapshot decodes each video once for all the times it shows (#6667) | 5 | 無 | B：延後／本輪不採用 |
| `cf627a86193808a7d9dcddf4ca903a898914ea8b` | fix(core): a preview media load that fails is reported, not swallowed (#6666) | 11 | 無 | B：延後／本輪不採用 |
| `5b5633fbbc2e77ee689dfe121c11c4adc4b31777` | fix(cli): website capture ends with what it has instead of running until it is killed (#6662) | 6 | `packages/cli/src/capture/coreExtractionPhase.ts` | B：延後／本輪不採用 |
| `67c7ec27d9978076137459d471be936a993e22df` | fix(core): bundled fonts in a linked stylesheet or a font shorthand are seen by the bundler (#6665) | 15 | `packages/core/src/compiler/htmlBundler.test.ts` | B：延後／本輪不採用 |
| `e38585ef5f5ccc831d804020d3014e2899dda204` | perf(studio): timeline thumbnails come back from disk in the next session (#6676) | 6 | 無 | B：延後／本輪不採用 |
| `c6af88d2e6566a3cc53d7cac8270b903da817606` | chore: release v0.8.213 (#6673) | 21 | `packages/cli/package.json`<br>`packages/sdk/package.json`<br>`packages/shader-transitions/package.json` | E：延後／本輪不採用 |
| `c9017f45f4b8c38e11396a70a3d05d3432c58b48` | feat(core): bake a colour grade into a 3D LUT (.cube) (#6679) | 4 | 無 | B：延後／本輪不採用 |
| `09b12904748b71ab1777d335f20026d45d6944ca` | feat(core): grade groups grade a whole lane from one hf-color-group (#6678) | 14 | 無 | B：延後／本輪不採用 |
| `348971c22285421a062ab5df45ad94bb4680bf9c` | fix(studio): a tab's save keeps the newer video version another tab recorded (#6682) | 2 | 無 | B：延後／本輪不採用 |
| `4719543e972548a261b8354f0a8dada479ae5d93` | chore: release v0.8.214 (#6684) | 21 | `packages/cli/package.json`<br>`packages/sdk/package.json`<br>`packages/shader-transitions/package.json` | E：延後／本輪不採用 |
| `c569760a7a7c96df6540d53bbfe4670225ae140e` | fix(core): grade groups resolve per composition; freeze frames keep their lane (#6685) | 5 | 無 | B：延後／本輪不採用 |
| `203a08dd7c1d4856e04e6a1288915a4b6f5fa2f6` | fix(cli): check no longer treats a transparent canvas as covering the frame (#6681) | 2 | `packages/cli/src/commands/layout-audit.browser.js` | B：延後／本輪不採用 |
| `c2cde2fb624ba5a311615574dff822a41f61ea96` | perf(producer): the audio true-peak check seeks to each segment instead of decoding up to it (#6672) | 4 | 無 | B：延後／本輪不採用 |
| `067cbf7acf55e54517650b5ade24cfa352806c04` | fix(producer): a capture that landed every frame is not failed for the work after its last frame (#6674) | 4 | 無 | B：延後／本輪不採用 |
| `710314c15e11bb1f49cd83117f42b3cf2b2fc62e` | fix(studio): an undo or redo counts as a preview change from its key, not from its reload (#6683) | 6 | 無 | B：延後／本輪不採用 |
| `cdc86117c7ffa6bf087017035ea17149b98303da` | fix(engine): a render from an app that bundles the engine stamps the engine's version (#6686) | 2 | 無 | B：延後／本輪不採用 |
| `1428f876899557a4fe4448a6ac327ff503be53f5` | docs(skills): the registry skill says its commands are catalog and add (#6680) | 2 | `skills-manifest.json` | E：延後／本輪不採用 |
| `9aa6346a779328f1c0963ec3d37b856ad164c969` | fix(studio): audio keeps playing after a timeline move or trim in a static composition (#6428) | 4 | 無 | B：延後／本輪不採用 |
| `aa4a71fe417401b5d8a69cff36f56319defd3ba7` | fix(core): graded media honors object-position vertically instead of mirroring it (#6691) | 2 | 無 | B：延後／本輪不採用 |
| `ec10aae54fd3bcadaebb7e935a2b53d788fee074` | fix(cli): beats --json answers with no track when the composition has no music (#6690) | 2 | 無 | B：延後／本輪不採用 |
| `9f65efb19c3f435ef58f6fc81c6909d2a3920f8a` | fix(cli): check no longer reports outline text as not painted (#6693) | 2 | `packages/cli/src/commands/layout-audit.browser.js` | B：延後／本輪不採用 |
| `3ca1005a81e76565a69d5874371c857321b66d59` | feat(producer): report which element set the film length (#6689) | 11 | `packages/engine/src/index.ts` | B：延後／本輪不採用 |
| `9830059bdb08adbab473d059d1b6db2230a5bb15` | fix(engine): downloads refuse hosts that resolve to private addresses (#6571) | 22 | `.github/workflows/ci.yml`<br>`bun.lock`<br>`packages/cli/package.json`<br>`packages/engine/src/index.ts`<br>`packages/engine/src/utils/urlDownloader.test.ts`<br>`packages/producer/src/server.test.ts`<br>`packages/producer/src/services/htmlCompiler.test.ts` | C：延後／本輪不採用 |
| `2c3d1e07fe63d4a2d67d63a3e29d4ad73e291d8e` | fix(cli): media-treatment finds an area by the name its overview prints (#6675) | 2 | 無 | B：延後／本輪不採用 |
| `81959201f0acb2e265e4d8c30daa89ffc1c9607d` | fix(cli): a stopped model download resumes on the next run instead of starting over (#6694) | 4 | 無 | B：延後／本輪不採用 |
| `0620067eb096fee9b6748efb9421d852d540cbf6` | fix(cli): snapshot reads https video in the Desktop app instead of failing at ffprobe (#6699) | 14 | `packages/producer/tests/vignelli-stacking/output/compiled.html` | B：延後／本輪不採用 |
| `ac449555f4607ea65895628164cb2835afdd0ce5` | fix(cli): a Windows render no longer prints taskkill's already-exited message (#6698) | 2 | 無 | B：延後／本輪不採用 |
| `cfa653af4d0f95d751286fb25c8d38bdb56ef663` | fix(cli): media-treatment --capability preset finds the presets area (#6700) | 2 | 無 | B：延後／本輪不採用 |
| `a5496b1887950777b78ed5ac2bff3505961cb5fe` | fix(producer): a BeginFrame capture that draws no first frame in 20 s switches to screenshot (#6701) | 6 | 無 | B：延後／本輪不採用 |
| `4fa5f54519150566b8ef706f60c05ff13c903423` | fix(cli): audio windows read beats off the whole clip; beats snap to the signal and mark silence (#6692) | 7 | 無 | B：延後／本輪不採用 |
| `1c3fcf4d237d031107baa6a5646b5bb1ee82cc2a` | feat(telemetry): identify signed-in CLI users by their HyperFrames user id, and say signed-in usage is not anonymous (#6703) | 27 | `.github/workflows/ci.yml`<br>`packages/cli/src/commands/init.ts`<br>`skills-manifest.json` | C：延後／本輪不採用 |
| `6c17659337d50b578c5c54ae716308a13eb2c822` | fix(cli): check waits as long as the --timeout it was given before it counts as idle (#6705) | 4 | 無 | B：延後／本輪不採用 |
| `f0c5db6ea266a5a96907e66ef762e0f6dd85d623` | fix(cli): capture names the network's proxy when it refuses the connection to the site (#6706) | 2 | 無 | B：延後／本輪不採用 |
| `11312b359b18c07911615656b95f48c7d8d82fea` | fix(cli): check says a lint error is why the browser pass was skipped (#6709) | 2 | 無 | B：延後／本輪不採用 |
| `fa9acbd7399b7cd5ca9940399d9066bb33d96973` | fix(core): a multi-worker or chunked render lands every frame where an in-order render does (#6707) | 3 | 無 | B：延後／本輪不採用 |
| `2f8c4b1dafaebc26f4dcfe6252312faf39ff9d89` | fix(cli): check says how many browser-playable copies are done while it makes them (#6712) | 2 | 無 | B：延後／本輪不採用 |
| `bb4deb8014a8457425c2e6e4a8619969514824ea` | fix(cli): an unknown command like search says which command does that (#6710) | 3 | 無 | B：延後／本輪不採用 |
| `49e0312300d6c049b19eb8435930f980621a993f` | fix(ci): skills sync steps past the five hidden ClawHub versions blocking it (#6713) | 2 | 無 | D：延後／本輪不採用 |
| `cd003e201051317234598bcf1c70cfed4770613f` | perf(engine): size render workers from measured heap and the container's CPU quota (#6641) | 4 | 無 | B：延後／本輪不採用 |
| `17f5d67643ce4a1c5d0d3249dc91f7a19a4e9c0b` | chore: release v0.8.215 (#6719) | 21 | `packages/cli/package.json`<br>`packages/sdk/package.json`<br>`packages/shader-transitions/package.json` | E：延後／本輪不採用 |
| `be05c86932be215ec70621dc568af96415555fa0` | perf(engine): encode high quality with the x264 fast preset (#6640) | 3 | 無 | B：延後／本輪不採用 |
| `98a28cc4b2919f1c8418d2cb61bafc66ec9ccb31` | fix(cli): the lint summary points at hyperframes lint, not a flag only render takes (#6723) | 2 | 無 | B：延後／本輪不採用 |
| `cf15892425245da96dc43d858a7478031533d2f1` | fix(cli): a snapshot still shows what playback shows, whatever other times are asked for (#6720) | 5 | 無 | B：延後／本輪不採用 |
| `ba8ffffa0b5695d207cc89949e90e5902839fd67` | fix(cli): a failed render names its failure code for the Desktop app (#6725) | 2 | 無 | B：延後／本輪不採用 |
| `077de9bfe9f248c0807ba2c7f78d1514adf85bc6` | test(cli): the publish abort test checks the summary hint is absent (#6726) | 1 | 無 | E：延後／本輪不採用 |
| `fa97f9d4b7b4f401560dcc3e642267e953a2a89e` | docs(cli): list check's audio findings with severity, trigger and fix (#6730) | 3 | `skills-manifest.json` | E：延後／本輪不採用 |
| `f0665f71813278b0e6999df68de691e51d52679d` | fix(aws-lambda): the release ffmpeg build falls back to verified mirrors when a source host is down (#6728) | 4 | 無 | B：延後／本輪不採用 |
| `74f3234736ad87568831ed51c34a7e289dc668e6` | ci: one regression shard writes the test image cache (#6729) | 3 | 無 | D：延後／本輪不採用 |
| `48ba0e5b2bf91fc816adc0a7769d7344091aa5d7` | fix(player): iPhone Safari keeps every take's sound after the first seconds of an edit (#6724) | 8 | 無 | B：延後／本輪不採用 |
| `5d437d5eecd65f05daa4ff451ebb85b71f88fdb9` | docs(cli): say which audio probes run once per file (#6731) | 3 | `skills-manifest.json` | E：延後／本輪不採用 |
| `6df754fbf3289ee0dc19e123e0628cc69218e518` | chore: release v0.8.216 (#6735) | 21 | `packages/cli/package.json`<br>`packages/sdk/package.json`<br>`packages/shader-transitions/package.json` | E：延後／本輪不採用 |
| `eab6541f5ba017aa7b8bb53263a40105ace6168e` | feat(cli): a feedback report names why the last check failed (#6717) | 6 | 無 | B：延後／本輪不採用 |
| `94203ad431678f85e20a2de17852f7f9c5e1ba04` | fix(cli): snapshot says FFmpeg was stopped when it exits 255 with no output (#6718) | 2 | 無 | B：延後／本輪不採用 |
| `71f716a91bc625e9243c5f25c194a114bb555668` | fix(core): telemetry redaction covers folders with spaces in any script (#6734) | 2 | 無 | C：延後／本輪不採用 |
| `0da46832ef9ddaa0e4f6941b02f066ae7c0b53dc` | fix(cli): a failed render's code comes only from the producer's list of safe codes (#6737) | 5 | `packages/producer/src/server.ts` | B：延後／本輪不採用 |
| `e1a8c7f1730149a81d5aa5863b963487a2e3955e` | fix(engine): long films show progress during the effect check and never wait minutes on it (#6697) | 5 | 無 | B：延後／本輪不採用 |
| `1a80b5407d6383be0922245389d93d94a3de86a0` | fix(cli): allow-occlusion on the covering element silences text_occluded (#6741) | 2 | `packages/cli/src/commands/layout-audit.browser.js`<br>`packages/cli/src/commands/layout-audit.browser.test.ts` | B：延後／本輪不採用 |
| `943849025a4d44d740ef94414cc8f422dbad2a52` | feat(cli): a render that finds a file missing says which kind of file, never its path (#6742) | 4 | 無 | B：延後／本輪不採用 |
| `93f3d3dcbbcc1820b7827d2bd688d61eb334c693` | fix(core): the preview's scene window settles when a scene can't unmount instead of hanging the page (#6740) | 2 | 無 | B：延後／本輪不採用 |
| `22b53c011505a4b22fcfa603a1037ebd942087cf` | fix(engine): late-starting videos play to their last frame (#6736) | 4 | `packages/engine/src/services/videoFrameExtractor.test.ts`<br>`packages/engine/src/services/videoFrameExtractor.ts` | B：延後／本輪不採用 |
| `838f8782c4a96913d1627cd344be8431e7c44019` | fix(cli): a project .env only sets the CLI's own settings (#6565) | 6 | 無 | C：延後／本輪不採用 |
| `a3ff1c490204b25d9e89bd2774e4c479a53c48c8` | revert(engine): late-starting videos play to their last frame (#6746) | 4 | `packages/engine/src/services/videoFrameExtractor.test.ts`<br>`packages/engine/src/services/videoFrameExtractor.ts` | B：延後／本輪不採用 |
| `558097ed70002ce63d0966dbd99f4ed7725e855e` | fix(cli): check no longer calls a redrawn WebGL canvas a dead stretch (#6749) | 5 | 無 | B：延後／本輪不採用 |
| `17ffe479dc4283444b6874030a3ccf5a7eb3ea3e` | feat(studio): a preview reload that gives up on the runtime says how far the page got (#6747) | 2 | 無 | B：延後／本輪不採用 |

## 保留與驗證邊界

- 本輪未改 packages、skills、bun.lock、README 雙語檔、.github 或任何產品版本。Function 包裝與 authored 標記、assertPrivateCacheRoot、fileServer 的 0o600、Windows-only CI、身分資訊分歧及 npm／ClawHub repository guard 全保留。
- 三個水位是「完成本輪採用／略過裁決」，不是「產品已同步」。本線相對固定上游仍 ahead 59／behind 105；以共同祖先算，推進 reviewed_through 不會消除這 105 筆未採用提交。
- 不宣稱產品 build、產品測試、Windows render、preview、POSIX 或任何登入流程通過；本輪未修改產品，沒有修 bug 的先紅後綠案例。
- 維護 gate：`pwsh -NoProfile -File tools/dev_check.ps1`；最終指令、exit code 與結尾輸出由派工回報及本機 log 提供。

## 2026-10-30：接續半成品與增量裁決

保留上述 2026-10-29 快照，續查到上游 `4e2a1c215a42c6d262b8c635df9d5edff80e8830`。新增 2 個 commit、3 筆 PR、1 筆 issue；原範圍累計 107 個 commit、123 筆 PR（93 merged／21 open／9 closed 未合併）、3 筆 issue。所有產品變更仍未採用，與本線相比 ahead 59／behind 107。

指定 #6613、#6616、#6617、#6621、#6622 已再次取目前 head，均與上表相同，不重複掃描相同 patch。原 21 筆追蹤項目只有 #6696、#6750、#6751 改變狀態，head 均未變；#6696 關閉未合併，另兩筆已合併。檢查器將 merged 統一記為 `closed`，baseline 不使用 `merged`。新增 3 筆 PR 加入追蹤，合計 24 筆（21 open／draft、3 closed）。

| 項目 | 完整 SHA／證據 | 裁決 |
| --- | --- | --- |
| Commit／PR #6750 | `b320a66d512f705b79e3e8d054b0f1e656d26752`；head `d68e91133e5af02ef4df95349c8964f458db3b6e` | 延後：讀完整 commit diff，僅改 download.test.ts；以 .part 寫入長度觸發 timeout，仍依賴本線未採用的 #6649／#6694，不單獨搬測試。 |
| Commit／PR #6751 | `4e2a1c215a42c6d262b8c635df9d5edff80e8830`；head `556008794903a3ab198d858338d28d3a0a2514f1` | 略過：21 檔均為版本與發布文件，不同步版本號，不啟用 fork 發布。 |
| PR #6696 | `10c5a8ee925750bfe80b6ac8747af132f82f7be7`，closed 未合併 | 維持不採用；未改 head，原 page_motion_blur 相容性理由仍成立。 |
| [PR #6752](https://github.com/heygen-com/hyperframes/pull/6752) | `fe31500eec770fa06030831a877735ab43ecd71a`，open | 不採用此版本：完整 diff 僅刪除產生型別的 page_motion_blur；本線 cloud/render.ts:814、843 仍使用，與 #6696 相同阻礙。 |
| [PR #6754](https://github.com/heygen-com/hyperframes/pull/6754) | `56903e395795258e3df2835a4befcfed2e06bc4c`，draft | 延後：取得完整 diff，聚焦讀 auth、billing、plan、generate 與 reverse skill；依賴 #6687，新增付費生成／方案查詢、mock plan、訂閱頁輪詢與技能層 Pro 判斷。PR 自述 Free／額度不足旅程未實測，dev video generation 失敗。須另做授權、費用確認、Windows 與 CLI 契約驗收；本次沒有登入、付費或執行上游腳本，不宣稱整份逐行安全審查。 |
| [PR #6755](https://github.com/heygen-com/hyperframes/pull/6755) | `f6c09ce86c447c6337e54b79cb509799f42d77b2`，open | 延後：完整 diff 將 stale metadata callback 的空物件改為原 state，附 600 clip／30 source 測試；承接 #6745 媒體探測路徑，待該批一起驗證，不宣稱本線已修。 |
| [Issue #6753](https://github.com/heygen-com/hyperframes/issues/6753) | open，內文與留言已讀，無留言 | 延後：回報非整格 data-start 在 render 造成一格延遲、重複／跳格，附 30 fps 編號素材與 1／4／8 worker 結果；屬上游重現證據，本線尚未重現。實際採用該區塊時需固定素材對齊來源畫格，不能直接照抄時間偏移 workaround。 |

查詢與完整 diff 存於忽略目錄 `tmp/upstream-20261029/`，增量檔名含 resume／20261030。補審前 `python tools/check_upstream_updates.py --strict --output tmp/upstream-20261029/resume-report-20261030.md` 為 exit 1，表示有待審內容，非執行失敗。另以 `gh pr list --repo heygen-com/hyperframes --state all --limit 180 --json number,state,headRefOid,isDraft` 比對本輪 123 筆及指定 5 筆，沒有其他 head／狀態變更。新增 PR 以 `gh pr view <N> --repo heygen-com/hyperframes --json number,title,body,headRefOid,state,isDraft,files` 與 `gh api repos/heygen-com/hyperframes/pulls/<N> -H "Accept: application/vnd.github.diff"` 讀取；issue 以 `gh issue view 6753 --repo heygen-com/hyperframes --json number,title,body,state,comments` 讀取。#6754 的 files 欄位只作導覽，不以該欄代替完整 diff。

本次只補審與更新紀錄，未改產品／依賴／workflow／技能，不需產品 build 或修 bug 的先紅後綠；完整維護 gate 與最終狀態見派工回報。沒有 git add、commit、push、切分支或遠端寫入。

接續驗收（2026-10-30）：

- `pwsh -NoProfile -File tools/dev_check.ps1`：exit 0；`39 passed`、`共 12 份文件，0 份有斷掉的相對連結。`、`WINDOWS DEV CHECK GREEN`。log：`tmp/upstream-20261029/dev-check-delivery-20261030.log`。
- `python tools/check_upstream_updates.py --strict --output tmp/upstream-20261029/delivery-report-20261030.md`：exit 0；commit／PR／issue 無待審新增；`Pinned: 24.`、`Every pinned item is still at the head and state it was judged at.`。log：`tmp/upstream-20261029/delivery-scan-20261030.log`。
- `git diff --check`：exit 0，無輸出。107 個 commit 的完整 SHA 全數出現在清冊；原 120 筆 PR 加指定 5 筆共 125 筆均有記錄，續查比對僅上述 3 筆狀態變更，沒有 head 改變。
- 未修產品 bug；不提供先紅後綠的回歸測試宣稱，補審前的 strict exit 1 也不是回歸測試紅燈。
