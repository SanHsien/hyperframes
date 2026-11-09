# 2026-11-04：接續缺口與 FFmpeg 啟動診斷

## 範圍

起點為 fork `86cd29c68`，baseline 為 commit `8a6636efe`、PR #7049、issue #7113。起始 `python tools/check_upstream_updates.py --strict` exit 1，固定上游 `183614bda3df15812d9f18fd4a71ee77a7da6387`：水位以上 53 個 commit、82 筆 PR、0 筆新 issue、19 筆 monitored 變動。扣除既有清冊的 5 個 commit 與 PR #7053，真正未審是 48／81／0／19。

新增審查 14 個 commit、18 筆 PR、1 筆 monitored；各軸會重疊，不可相加為修正數。逐筆讀實際補丁並對照本線；`SHA:檔案:行號` 指該提交內容，PR head 的證據另見快照。既有 [接續清冊](UPSTREAM_REVIEW_2026-11-04.md) 的裁決仍有效。

## 新增 Commit 裁決（14 筆）

| Commit／PR        | 檔案行號證據                                                                                                                                                                                                                                                                     | 裁決與重訪條件                                                                                                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `81b93cf05` #6949 | `packages/cli/src/commands/snapshotHeldVideos.ts:12` 掃 local video，`:25` 解析 project file，`:79` cache FFprobe；`snapshot.ts:974` 建 hold 清單、`:990` 在導航前安裝。本線 `snapshot.ts` 無 held-video 入口，補丁也把 capture 的 onLoaded 改為 async，需 engine exports 配套。 | 延後：snapshot 解碼／版面生命週期改動，不能只搬一行 hold。同步擷取鏈或本線重現大量 4K clip 的 Chrome 崩潰時，驗 rotated／height:auto、遠端同 basename、壞 probe、held-past-end 及 Windows 路徑的實際畫格，再採用。                             |
| `d03bdeae9` #7051 | `packages/cli/src/auth/resolver.ts:55` 改 credential 優先序、`:141` refresh 拒絕才 fallback；`oauth.ts:358` 共享 refresh；本線 `resolver.ts:5` 與 `:67` 仍是環境 key 優先、舊 HeyGen store。                                                                                     | 延後：涉及付款身分與尚未同步的 HyperFrames OAuth 隔離。明確同步認證時，成組驗 gateway 不收 OAuth、400／401 與網路失敗區分、競爭 refresh、publish checked credential、media helper 隔離；不單獨改 resolver。                                    |
| `5e30bbdbe` #7059 | `packages/lint/src/rules/gsap.ts:72` 新增 point-window 判斷、`:1130` 報 set 與 tween 共屬性重疊。本線 `gsap.ts:1093`、`:1100` 跳過零長度 window。                                                                                                                                | 延後：新增使用者可見 lint 規則，與 #7061 的 preview 語義相連。同步 GSAP overlap 支援或需要此診斷時，驗首尾 epsilon、不同目標／屬性、overwrite、巢狀時間軸並同步 lint 文件；不把新增規則當既有規則的純錯字修正。                                |
| `112ba5330` #7060 | `packages/core/src/pageMotionBlur.ts:38` 按 ownerDocument 找 scene WeakSet；`packages/studio/src/player/components/Player.tsx:29` 在 host 也安裝 tracker，並新增 package subpath 與真瀏覽器測試。本線 `pageMotionBlur.ts:38` 仍加到本 realm 的 seen。                            | 延後：跨 iframe 原型、Core exports 與 Studio 的整合修正。同步 motion blur 或本線重現 host-first WebGL 凍結時，必須用 Chrome fixture 證明 host-realm canvas、filter fallback 與不改 host prototype，再驗打包 subpath；不以 jsdom 替代像素驗收。 |
| `0f85af7c7` #7061 | `packages/core/src/runtime/adapters/gsap.ts:221` 在 overlap 結束後 silent replay、`:276` 以 renderFps 區分 preview；本線 `gsap.ts:93` 的 seekGsapTimeline 尚無 renderFps 與 shared-property spans 前置鏈。                                                                       | 延後：不是可直接套用的單行修正。同步 GSAP render／preview adapter 時，連同前置 spans 模型驗 30／60／144 Hz、nested timeScale、正反 seek、callback 只觸發一次與輸出畫格一致。                                                                   |
| `dffc640e8` #7062 | `packages/cli/src/commands/cloud/render.ts:128` 移除 cloud flag，`:868` buildRenderBody 不再寫 page_motion_blur；補丁刪除舊 flag 測試。本線 `render.ts:125`、`:843` 仍宣告並傳此欄位。                                                                                           | 延後：與 #7058 的 schema 撤欄成組，涉及既有公開 CLI 合約；不刪測試繞過本線既有契約。同步 hosted schema／cloud CLI 時，保留負例測試驗舊旗標的明確拒絕與無網路請求、預設 body 無撤回欄位、local render flag 不變，再一併更新文件。               |
| `58a01f169` #7058 | `packages/cli/src/cloud/_gen/types.ts:33`、`:47` 補 asset ID／URL 說明，`:184` 的 crf 後移除 page_motion_blur。與 #7052／#7054／#7056 的實際 diff 相同。                                                                                                                         | 延後：generated schema 不獨立覆蓋；依 #7062 的 cloud CLI／負例測試同步條件重訪，防止只刪 type 使現有 body 不相容。                                                                                                                             |
| `bc9f33488` #7065 | `skills/media-use/SKILL.md:26` 修正 Voice Turbo 免費欄位，`:38` 仍使用新 billing／generate 工作流；本線 `skills/media-use/SKILL.md:26` 為 HeyGen voices 與本機 Kokoro 兩欄，`:33` 要求獨立 heygen login，沒有被修的 Voice Turbo signed-in 宣告。                                 | 不適用目前 skill 契約：不整份覆蓋而帶入未採帳戶／付款操作。引入 HyperFrames Voice Turbo 工作流時重新核對 Free／paid allowance 與費用揭露，保留明確付款授權。                                                                                   |
| `8c799ebd1` #7064 | `.codex-plugin/plugin.json:4` 與套件升 0.9.7；`releases/v0.9.7.md:5` 宣告尚未同步的 WebGL、GSAP 與 OAuth 行為。                                                                                                                                                                  | 不適用：本線不能以版本或發行說明宣稱已提供未採功能。整版同步並完成對應產品驗收時重訪。                                                                                                                                                         |
| `3eead5432` #7067 | `packages/core/src/runtime/clock.ts:106` 在 audio output 起步前 hold，`:140`、`:165` 重設 1500 ms 起步窗。本線 `clock.ts:99` 的 \_heldTimeWhenBehind 已用 MEDIA_HARD_SYNC_SECONDS 保留 seeking／短距落後，與上游父版不同。                                                       | 延後：本線有額外媒體時鐘分歧，不能覆蓋既有 hold。同步 transport clock 或重現 Play 暫時加速時，驗 seek／pause／replay、原生 loop、遠距落後、buffering、起步 timeout 與 Safari 實際音畫同步。                                                    |
| `79b6af9b4` #7066 | `packages/producer/src/server.ts:224` 僅接受布林 true，`:309` 透過 engineOverrides 傳 forceScreenshot；本線 `server.ts:327` 建 request 但未暴露此 HTTP 輸入。測試區分 true／false／字串與 env。                                                                                  | 延後：新增 server API，非既有預設的故障修正。需要每次 render 選 screenshot 或同步 #7070 fallback 時，驗 request／env 優先序、非布林值、併發請求隔離與兩條 capture 路徑；不默改預設。                                                           |
| `10bc426e3` #7063 | `packages/cli/src/cloud/_gen/client.ts:332` 起增媒體 endpoints，`packages/cli/src/heygen/v3.ts:140` 改 JobRoute、`:244` 讓同步 speech 不 poll；generate／transcribe 改由 generated client 送出，本線尚無這組 heygen/v3.ts 呼叫鏈。                                               | 不適用獨立移植：引入媒體服務／generated client 工作流時，整批驗 auth、idempotency、voice 同步回應、非 JSON／5xx、abort、poll deadline 與費用邊界；不可只搬 generated methods。                                                                 |
| `3f42dc1c7` #7057 | `packages/cli/src/commands/diff.ts:168` 新增 --offset；`packages/cli/src/measure/diff.ts:314` 裁 overlap、`:341` 拒非法 offset，並改 duration／person verdict。本線 tracked tree 沒有 commands/diff.ts 與 measure/diff.ts。                                                      | 不適用目前 CLI：未同步 diff 指令。引入 diff 時成組驗正負 offset、無 overlap、project／video、移位 duration 不誤判 pass、person 不支持時明示未量測與 FFmpeg 時間基。                                                                            |
| `482bcd73e` #7115 | `packages/cli/src/browser/preflight.ts:98` 補讀 code／signal；本線同檔 `:98` 用 unknown + Reflect.get 避免型別斷言。`preflight.test.ts:173` 固定錯誤欄位驗 code、signal 與 status 優先序。                                                                                       | 採用最小修正：只補診斷，不改啟動方式、取消、Windows DLL hint 或 FFprobe 成功判定的既有契約。整批同步包含此修正時移除 fork 差異。                                                                                                               |

## PR 裁決（18 筆新審）

Merged 項目核對 merge SHA 與上述實際 diff。Closed 與 open 項目另讀目前 head 的實際 diff；closed 本身不代表不適用。#7053 既有採用不重複計數。

| PR    | 檔案行號證據與裁決                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #7050 | closed head；`packages/cli/src/heygen/plan.ts:50`、`:51` 把 pricing 改為 billing，reverse／v3 測試連動。不適用本線未引入的該組 plan 模組；同步帳戶導流時連同 null upgrade URL、host override 與付款授權重訪，不能用此 closed 補丁取代後續 server 契約。 |
| #7051 | merge `d03bdeae9`；`packages/cli/src/auth/resolver.ts:55`、`:141`。延後至 OAuth 隔離與付款身分成組驗收，見 commit 表。                                                                                                                                  |
| #7052 | closed head；`packages/cli/src/cloud/_gen/types.ts:39`、`:53` 澄清資產，`:184` crf 後刪 page_motion_blur。延後至 schema／cloud CLI 成組同步，見 #7062；不因 closed 省略補丁審查。                                                                       |
| #7054 | closed head；`packages/cli/src/cloud/_gen/types.ts:39`、`:53`、`:184` 與 #7052 的 diff 相同。延後至 #7062 的 CLI 合約與負例測試同步。                                                                                                                   |
| #7055 | open head；`docs/custom.css:507` 改 current tab 灰底，移除 inset ring／font-weight；並移除 text-primary 覆蓋。延後：純品牌外觀，等上游合併或 docs 視覺改版時驗桌面／窄版、深淺模式、focus-visible 與 current 狀態可辨識，加入 monitored。               |
| #7056 | closed head；`packages/cli/src/cloud/_gen/types.ts:39`、`:53`、`:184` 與 #7052 相同。延後至 #7062 的 schema／CLI 同步。                                                                                                                                 |
| #7057 | merge `3f42dc1c7`；`packages/cli/src/commands/diff.ts:168`、`measure/diff.ts:314`。不適用尚無 diff 指令的本線；成組引入時依 commit 表驗時間基與 verdict。                                                                                               |
| #7058 | merge `58a01f169`；`packages/cli/src/cloud/_gen/types.ts:184`。延後至 #7062 的 schema／CLI 同步。                                                                                                                                                       |
| #7059 | merge `5e30bbdbe`；`packages/lint/src/rules/gsap.ts:72`、`:1130`。延後至 GSAP overlap 診斷需求與規則驗收。                                                                                                                                              |
| #7060 | merge `112ba5330`；`packages/core/src/pageMotionBlur.ts:38`、`packages/studio/src/player/components/Player.tsx:29`。延後至 host-first canvas 的 Chrome fixture 與 subpath build 驗收。                                                                  |
| #7061 | merge `0f85af7c7`；`packages/core/src/runtime/adapters/gsap.ts:221`、`:276`。延後至前置 spans／renderFps 與 callback 一次性驗收。                                                                                                                       |
| #7062 | merge `dffc640e8`；`packages/cli/src/commands/cloud/render.ts:128`、`:868`。延後至 schema／CLI 成組同步；保留負例測試，不直接刪檔。                                                                                                                     |
| #7063 | merge `10bc426e3`；`packages/cli/src/heygen/v3.ts:140`、`:244`。不適用未採該媒體服務鏈的本線，成組引入時重訪。                                                                                                                                          |
| #7064 | merge `8c799ebd1`；`.codex-plugin/plugin.json:4`、`releases/v0.9.7.md:5`。不適用未採功能的版本宣告，整版同步時重訪。                                                                                                                                    |
| #7065 | merge `bc9f33488`；`skills/media-use/SKILL.md:26`、`:38`。不適用目前兩欄 skill 契約，引入 Voice Turbo 帳戶工作流時重訪。                                                                                                                                |
| #7066 | merge `79b6af9b4`；`packages/producer/src/server.ts:224`、`:309`。延後至 request screenshot／fallback API 需求與隔離驗收。                                                                                                                              |
| #7067 | merge `3eead5432`；`packages/core/src/runtime/clock.ts:106`。延後至本線 hold 分歧與媒體時鐘實測。                                                                                                                                                       |
| #7115 | merge `482bcd73e`；本線 `packages/cli/src/browser/preflight.ts:98`、`preflight.test.ts:173`。採用 OS error／signal 診斷並完成先紅後綠，不因此跨過 #7068 之後的 PR 缺口。                                                                                |

## Monitored 重審（1 筆）

| PR    | Head／state                                        | 證據與裁決                                                                                                                                                                                                                |
| ----- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #6949 | `9478dc161470ed747bb6b0e5bd01bdb9eb8e24e9`／closed | 由 open 轉 merged 且 head 改變；merge `81b93cf05` 的 `packages/cli/src/commands/snapshotHeldVideos.ts:79`、`snapshot.ts:990` 對應上述實際補丁。延後至完整 held-video 瀏覽器驗收；依已審 head 重釘，不把 merged 當已採用。 |

## 採用與驗證

#7115 根因是 readToolVersion 的 catch 只讀數值 status，spawn error 通常只有 code，signal 結束也可能沒有 status。補丁只增加 status > code > signal 的診斷選擇；abort 仍先 throw。回歸不綁安裝套件版本，而釘錯誤欄位與優先序。

`bun run --cwd packages/cli test -- src/browser/preflight.test.ts`：舊碼 exit 1，4 failed／29 passed／1 skipped；四例實際字串都缺少 code 或 signal。修正後 exit 0，33 passed／1 skipped；新增的 status／code／signal 同時存在案例沿用 status。跳過的是 Windows 不適用的 POSIX shell process-tree 測試，不能當 POSIX runtime 通過。`node_modules/.bin/oxlint packages/cli/src/browser/preflight.ts packages/cli/src/browser/preflight.test.ts` exit 0，0 warnings／0 errors。

本機驗證綁定 fork `86cd29c68` 加 #7115 的工作樹：`bun run --cwd packages/cli build` exit 0（ESM／DTS Build success）；`pwsh -NoProfile -File tools/dev_check.ps1` exit 0（39 passed、12 份文件相對連結 0 錯誤、WINDOWS DEV CHECK GREEN）。Markdown 表格已執行 oxfmt。

`pwsh -NoProfile -File tools/test_product.ps1` exit 1：parsers 1367 passed／1 failed／7 skipped／3 todo；lint 1225 passed／1 failed。兩例分別在 `packages/parsers/src/assetResolution.test.ts:311` 與 `packages/lint/src/projectShaders.test.ts:85` 建立 symlink 時 EPERM；檔案均與 `86cd29c68` 一致，與先前清冊的環境限制相同。不改權限、skip、timeout 或相關測試；完整 workspace／瀏覽器／POSIX runtime 不由此取得綠燈。

## 水位與剩餘範圍

連續區段 `81b93cf05..79b6af9b4`（兩端含）共 14 個 commit，其中 #7053、#7048、#7046 已有裁決，新增審查 11 筆；另審 #7063／#7057／#7115 三筆，共新增 14 筆。連續水位已推至 `79b6af9b4`，下一筆為 `9a2cd9e61`；PR 已推至 #7067，下一筆 #7068；issue 維持 #7113。#7041、#7031 與新增三筆額外提交仍有清冊證據，但不跨越 commit 缺口。

以固定上游 `183614bda`、PR 快照至 #7133 計算，新 commit 水位以上 39 筆，扣已審 #7041、#7031、#7063、#7057、#7115 後真正未審 34 筆；PR 水位以上 64 筆扣已審 #7115 後真正未審 63 筆；0 筆新 issue；monitored 重審後真正未審變動 18 筆。新增 #7055 的 open head 條件追蹤。剩餘計畫僅在 ROADMAP.md 維護。

2026-11-04 結束的 `python tools/check_upstream_updates.py --strict` exit 1，權威輸出為 39 個水位以上 commit、64 筆 PR、0 筆新 issue、79 筆釘選中 18 筆變動；扣除上述已有逐筆證據的額外項目後，真正未審為 34／63／0／18，與 ROADMAP.md 近期列一致。monitored 後續範圍為 #6714, #6745, #6816, #6842, #6890, #6913, #6919, #6928, #6945, #6947, #6955, #6963, #6968, #6972, #6988, #7003, #7013, #7014。

## PR head 快照（2026-11-04）

| PR    | Head                                       | State  |
| ----- | ------------------------------------------ | ------ |
| #7050 | `97ba503973f1ccacc72952ad561c1b8d0fe5712d` | closed |
| #7051 | `6605e03f1cc4c0b6142908adc86775f5feb7146b` | merged |
| #7052 | `7a16f8c309053963bb9eb521f9d419c800d983f3` | closed |
| #7054 | `ac56036d7d76caf561eacfbad50fd1a99bf12e6b` | closed |
| #7055 | `da542c363fb01019ef81ae6d1688452924c1130a` | open   |
| #7056 | `53018c31207bb60486b88236b71ef0d1dcc8da9f` | closed |
| #7057 | `7542b7d99dcfd73e0722beaab6d73805399d9b2b` | merged |
| #7058 | `88adff6e93c25cc2fe4b7540afa67c5dd64c6488` | merged |
| #7059 | `ea210de5e61418cc2177d35597bab22a6cbaaa35` | merged |
| #7060 | `e6107f749aa90cd1cf8e491540aaf887174c9e84` | merged |
| #7061 | `5c262a1d0a84172b8a1564283c687d0955afc7c0` | merged |
| #7062 | `7fdba02dbe8dc52ecfc369c28ff589c01fcf045c` | merged |
| #7063 | `075b39b0fbba77c79460c09a571acf80b64673e1` | merged |
| #7064 | `3486aed93abd2d4b4306b62140636f464ad9e97d` | merged |
| #7065 | `6ab1dc16b780be0eae8d8b45d269a17a0fa1eac1` | merged |
| #7066 | `a68f7161b6ccb8428107abc49df7efecb48325ef` | merged |
| #7067 | `98d651ea2fe943de937c033fc97848282dbb59ca` | merged |
| #7115 | `dbd030e4d0093bc731fb27b9d3586a4dd46560e7` | merged |

## 2026-11-04：接續至 `3f42dc1c7` 與完成任務 TTL

起點為 fork `9fb5e73683b94d757c082579c90d48145dcf01ee`。起始 strict exit 1，上游仍為 `183614bda3df15812d9f18fd4a71ee77a7da6387`，水位以上 39 個 commit、64 筆 PR、0 筆新 issue，79 筆 monitored 中 18 筆變動。新增逐筆審查 **12 個 commit、15 筆 PR、3 筆 monitored 變動**；各軸重疊，不相加為獨立修正數。只採用 #7087。#7015、sharp 0.35.5、#7053、#7049、#7115 的既有採用保留。

Merged PR 以 GitHub merge SHA 核對實際 `git show` 補丁；未合併 PR 讀 `gh pr diff --repo heygen-com/hyperframes`。下表的 `SHA:檔案:行號` 是指定提交的原始碼位置；PR head 的位置則以表尾完整 SHA 釘選。本線差異以起點與 #7087 修正後的工作樹核對，沒有用主旨或 `--stat` 代替補丁。

### Commit 裁決（新增 12 筆）

| Commit／PR | 檔案行號證據與本線差異 | 裁決與重訪條件 |
| --- | --- | --- |
| `9a2cd9e61` #7070 | `packages/producer/src/services/renderOrchestrator.ts:2631` 加 BeginFrame 分類，`:5163` 由 capturePlan／drawElement／parallelCaptureMode 決定；測試 `renderOrchestrator.beginFrameRetry.test.ts:137` 驗整次 screenshot 重試與只重試一次。本線 `renderOrchestrator.ts:2520` 的 fallback 未有此分類。 | 延後：改變整次 render 的失敗恢復，與 #7066 screenshot API 相連。同步 capture fallback 或本線重現 BeginFrame 非 transient 故障時，驗取消／encoder interrupted 不重試、第二次失敗不循環、輸出幀完整與檔案清理，再採用。 |
| `9ceced05e` #7077 | `.codex-plugin/plugin.json:4`、各套件 package.json 升版；`releases/v0.9.8.md:5` 宣告 BeginFrame fallback，`:10` 宣告 screenshot request。 | 不適用目前產品版本：這些功能未成組採用，不能只升版本與發行說明。整版同步並通過產品驗收時重訪。 |
| `ce9830fec` #7073 | `packages/studio-server/src/helpers/projectSignature.ts:263` 改 async／`:268` 用 async walk，`compositionInputs.ts:102` 改 Promise，preview／thumbnail／projects 所有呼叫端加 await。本線 `projectSignature.ts:208` 仍是同步介面，尚無 createProjectSignatureAsync。 | 延後：缺少非同步 walker 前置實作，不能單搬 await。同步 signature 鏈或量到本線大型專案輪詢阻塞時，成組驗 adapter 同步／非同步回傳、event loop 可推進、編輯中 signature／thumbnail cache 不過期誤用及 Windows safePath。 |
| `95a86a19c` #7076 | `skills/reverse-any-video/SKILL.md:12` 要求下載 URL 前 auth status，仍導向 billing subscribe；skills-manifest 更新對應 hash。本線未安裝 reverse-any-video skill。 | 不適用目前技能集合：不帶入尚未採用的付費 reverse 流程。明確引入該技能時連同認證、費用揭露與付款授權重訪。 |
| `91e7f4d48` #7072 | `packages/cli/src/commands/diff.ts:219`／`commands/measure/sync.ts:39` 改缺參數訊息，`measure/media.ts:97` 提醒 Windows 路徑，`utils/reject-unknown-flags.ts:71`／`:90` 加同義詞。本線無 measure／diff 模組；本線 validator `:73` 無 command path 參數，`:84` 直接拋 Error。 | 延後：前半不適用目前 CLI；validator 部分依賴尚未同步的 command path／structured usage error 契約。引入 measure／diff 或同步 CLI 錯誤提示時，驗只建議目前命令已宣告旗標、短旗標／負數／`--`、JSON stdout 與 wrapper，再更新公開文件；不整檔覆蓋吞旗標防線。 |
| `d89bf35b1` #7080 | `packages/core/src/runtime/captureMotionBlur/frames.ts:14` 限制量測 256 子節點、`:79` 暫移 transform 量 overflow，composite／filterPlan 傳 origin；`index.ts:68`／`:174` 保留 SVG 引用資源可見。 | 延後：涉及真實版面、文字 Range 與 SVG 像素，不能以 jsdom stub 宣稱 Chrome 正確。同步 capture blur 或本線重現文字裁切／clipPath 消失時，驗正反 seek、旋轉及 ancestor transform、overflow hidden、SVG mask／clip、filter fallback 與輸出 RGBA，再成組採用。 |
| `e9de593fe` #7071 | `packages/cli/src/measure/media.ts:39` 新增 sumOf，超過 50 項遞迴分半；frames／diff／drawn／face／person 及 `commands/snapshot.ts:725` 改用它；media.test 實際解碼 199／200／237／401 picks 及 97／100／199 times。本線無 measure/media.ts，亦無該 snapshot 批次 selector。 | 不適用目前呼叫鏈：不是本線現有 flat sum 的獨立修正。引入 measure 或批次 snapshot 時連同 FFmpeg 8 實際解碼測試重訪，釘選幀數／順序與時間，不能只比對 expression 字串。 |
| `7ae108005` #7075 | `packages/cli/src/measure/cuts.ts:116` 搜 zoom／shift，`:129` 需兩側鄰幀均有運動；cuts.test 加 zoom 與 punch-in／out 負例。本線無 measure/cuts.ts。 | 不適用目前 CLI：同步 measure cuts 時，驗加速 zoom 不誤報、靜止一側的 punch-in／out 保留、flash 與真 cut，以及搜尋成本，不能單獨搬閾值。 |
| `47dddedd6` #7082 | `packages/core/src/runtime/media.ts:41` 新增 0.4 秒 frozen 記錄、`:666` 檢查 WebKit audio，evict 清 WeakMap；三例區分 frozen／buffering／moving。本線 `media.ts:570` 是 drift > 3，未有上游 1 秒 WebKit valve 前置鏈。 | 延後：需連同 #7024 與媒體時鐘分歧處理。同步 Safari audio 或本線重現已播放但 currentTime 凍結時，以 Safari 實機驗無資料／seeking／pause／重入與 hold 行為，不能只加入較短閾值。 |
| `35753f382` #7069 | `packages/parsers/src/hfIds.ts:21` 先檢 alreadyStamped，`:31` 用 tag reader，`:49` 要求 head/body 形狀；測試驗不 parse、空 ID、偽屬性、fragment 與不完整 head。本線 `hfIds.ts:20` 始終 parse，既有 stamp scanner 仍在。 | 延後：這是有輸出序列化契約影響的效能捷徑。量到本線 stamped preview 的 parse 瓶頸，或安排 parser／preview 同步時，成組跑 parsers、SDK edit／undo、studio-server，驗 table implied nodes／template／fragment 與 ID 穩定；Windows symlink 失敗不能算完整套件通過。 |
| `fc006f713` #7087 | `packages/studio-server/src/helpers/finishedJobs.ts:2` 以物件 WeakMap 記首次觀察完成時間；`routes/render.ts:81`、media.ts 的 cleanup 改用此值。本線對應 `render.ts:72`、`media.ts:134`；新增 `routes/finishedJobs.test.ts:49`／`:78` 驗兩種長任務。 | 採用最小修正：完成後才開始記憶體 TTL，不依建立時間立即清掉長任務；保留 job ID 撞名、safePath、取消與磁碟檔案。整版同步已含此修正時移除 fork 差異。 |
| `87a42e747` #7068 | `packages/cli/src/commands/billing.ts:39` 發起 offer／checkout、`:56` 等 Enter；`heygen/plan.ts:143`／`:161` POST checkout，只允許 Stripe URL，無 terminal 也會建立 checkout。本線無 commands/billing.ts 與 heygen/plan.ts。 | 不適用目前本地維護產品：新付費帳戶工作流，不是純顯示文案。明確引入 billing 時驗 offer 邊界、價格／貨幣、訂閱冪等、poll／abort 競爭、workspace／歸因與付款授權；這次審查沒有登入或建立 checkout。 |

### PR 裁決（新增 15 筆）

| PR | 證據與裁決 |
| --- | --- |
| #7068 | merge `87a42e747`；`packages/cli/src/commands/billing.ts:39`、`heygen/plan.ts:143`。不適用目前無 billing 的本線；引入付費流程才按 commit 表成組重訪。 |
| #7069 | merge `35753f382`；`packages/parsers/src/hfIds.ts:21`、`:49`。延後至 preview parse 量測或 parser 同步與 SDK round-trip 驗收。 |
| #7070 | merge `9a2cd9e61`；`packages/producer/src/services/renderOrchestrator.ts:2631`、`:5163`。延後至 capture fallback 成組驗收。 |
| #7071 | merge `e9de593fe`；`packages/cli/src/measure/media.ts:39`、`commands/snapshot.ts:725`。不適用目前未有該選幀鏈；引入時驗 FFmpeg 8 實際幀數。 |
| #7072 | merge `91e7f4d48`；`packages/cli/src/utils/reject-unknown-flags.ts:71`、`:90`。延後至 structured error／command path 與 measure 同步，保留本線吞旗標防線。 |
| #7073 | merge `ce9830fec`；`packages/studio-server/src/helpers/projectSignature.ts:263`、`:268`。延後至非同步 walker／cache 成組同步。 |
| #7074 | closed head；`packages/cli/src/cloud/_gen/types.ts:186`、`:339` 僅刪 4K 1.5x 費用註解。延後：不以 closed generated 補丁當現行計費事實；同步 hosted schema 時按權威契約重生並核對使用者文件。 |
| #7075 | merge `7ae108005`；`packages/cli/src/measure/cuts.ts:116`、`:129`。不適用未採 measure 的本線，引入時按 commit 表驗分類與成本。 |
| #7076 | merge `95a86a19c`；`skills/reverse-any-video/SKILL.md:12`。不適用目前技能集合，引入該付費流程時重訪。 |
| #7077 | merge `9ceced05e`；`.codex-plugin/plugin.json:4`、`releases/v0.9.8.md:5`。不適用未採功能的版本宣告，整版驗收後重訪。 |
| #7079 | open head；`skills/hyperframes-cli/SKILL.md:27` 允許技能指定 events，`docs/packages/cli.mdx:2290` 改手動 beacon 說明。延後至上游合併或明確需要該技能 telemetry 契約；先核對停用／opt-out 與授權邊界，不以「技能要求」自動擴大遙測，加入 monitored。 |
| #7080 | merge `d89bf35b1`；`packages/core/src/runtime/captureMotionBlur/frames.ts:79`、`index.ts:174`。延後至真瀏覽器 overflow／SVG 與確定性驗收。 |
| #7081 | closed head；`packages/core/src/runtime/afterFonts.ts:94` export nextUnclampedTask，`init.ts:4294`／`:4645` 用它取代 scene 的 setTimeout。本線 afterFonts.ts:94 已有 helper，但未 export。延後：closed 不等同產品不適用；同步 scene parking 或本線重現 hidden-page mount 延遲時，驗 MessageChannel／scheduler fallback、virtual time、取消／teardown 與 scene timeline 所有權後採用。 |
| #7082 | merge `47dddedd6`；`packages/core/src/runtime/media.ts:41`、`:666`。延後至 Safari 前置 valve／hold 分歧與實機驗收。 |
| #7087 | merge `fc006f713`；本線 `packages/studio-server/src/helpers/finishedJobs.ts:2`、`routes/finishedJobs.test.ts:49`／`:78`。採用並完成回歸先紅後綠；不因此跨過 PR #7078 的未審缺口。 |

### Monitored 重審（3 筆）

三筆均為 open → closed，head 與前次釘選相同；仍重新讀完整 head diff，沒有只看狀態便重釘。

| PR | Head／state | 證據與裁決 |
| --- | --- | --- |
| #6945 | `60c4bfbff8bf4a0f26cc660d53f812fdbe7c4ee3`／closed | `packages/core/src/runtime/init.ts:3447` 設 300 ms 起步窗、`:5917` 改 buffering／catch-up，audioClockSource／init.buffering 測試跟著改。延後：同前次 iOS／clock 條件，這是播放語義變更；同步 transport 時驗起步／中途飢餓、late source、pause 與 Safari 真實音畫，不搬閉合 PR 的測試來削弱本線等待契約。 |
| #6963 | `f9418f549f92ae3dc314487ac10e7ed4e40f7a2c`／closed | `packages/producer/src/services/renderOrchestrator.stall.test.ts:317` 移除 untilHeld 的 1 秒 IO cap 與 budgetRanOut 斷言，只靠 suite timeout。延後：本線沒有該 CI flake 重現，保留既有有界測試；本線出現同一等待失敗或同步 harness 時，按具名 timeout／失敗紀錄重訪，不無條件放寬。 |
| #7003 | `c15936cabcde65cbefec460ef7d2e29b23da974d`／closed | `packages/cli/src/cloud/_gen/types.ts:183` 刪 page_motion_blur。延後：與既有 #7058／#7062 相同 hosted schema 成組同步條件；本線 cloud render 仍會傳此欄位，不單獨刪 type。 |

### PR head 快照（新增審查）

| PR | Head | State |
| --- | --- | --- |
| #7068 | `735bed1bc6e4e58ec154a662a293e4cb5a1e0f77` | merged |
| #7069 | `9c9941a1502610976500d0680b0254f6b0d19855` | merged |
| #7070 | `6b2dcfed298273e07926fd337209e301bd66796b` | merged |
| #7071 | `e75e00b6e5ae4e31093887a3c9086e01a776ca31` | merged |
| #7072 | `e202feef1e122c1afb8bec3ed9308cbc3444d9a1` | merged |
| #7073 | `a47ff86350881cd96c75bb3e8ae1a67a9a460093` | merged |
| #7074 | `1d9a842d059a5438e439d545126a4c4e9f14948b` | closed |
| #7075 | `1d12321f26f55b39618249bb373667baf9f493d8` | merged |
| #7076 | `30df644f8c20d10db17e910b093cb52b4b5f7ace` | merged |
| #7077 | `ec62333390b2160a0e2518ca5721d38b44b7e1d3` | merged |
| #7079 | `f50de0ba2e7ae39a0b53c2e1273472785d20f075` | open |
| #7080 | `f755566d475aa49b8a5c008649c57b6144af20e2` | merged |
| #7081 | `c78f0bd51247c24f087d41ae34594b5424cfa845` | closed |
| #7082 | `1db307e62eb324ffba889fb8cc38f58b0fb3e0c3` | merged |
| #7087 | `fb5887275da3fbdeaccf1e72eb9069e35b26e918` | merged |

### 採用、驗證與連續性

#7087 的兩個回歸先套測試、保留舊碼執行：`bun run --cwd packages/studio-server test -- src/routes/finishedJobs.test.ts` exit 1，2 failed，兩例都為 expected 404 to be 200。移植後與 render／renderDeletion 同跑 exit 0：96 passed／1 skipped。測試釘長任務完成後可讀及 TTL 後清除；既有 deletion 測試調到首次完成 sweep 後超過五分鐘，仍斷言磁碟輸出保留，沒有刪斷言或寫死依賴版本。

`bun run --cwd packages/studio-server build` exit 0，ESM／DTS 成功。五個變更 TS 檔已執行 oxfmt／oxlint，0 warnings／0 errors。使用者文件在 `docs/packages/studio-server.mdx` 說明保留起點與不刪輸出檔的界線。

擴大測試 `bun run --cwd packages/studio-server test -- src/routes/finishedJobs.test.ts src/routes/render.test.ts src/routes/renderDeletion.test.ts src/routes/media.test.ts` exit 1：109 passed／1 failed／2 skipped；失敗在 `media.test.ts:99` 寫入含 `?` 的 Windows 檔名前置 fixture 時 ENOENT，尚未呼叫路由。該測試檔與起點 HEAD 位元組一致，不屬此次 TTL 修改造成的斷言退化；沒有調整權限、skip 或 timeout。

連續區段 `9a2cd9e61..3f42dc1c7`（兩端含）共 11 筆，新增審 8 筆，另外 #7041／#7063／#7057 沿用前文與接續清冊的既有逐檔證據。額外審 #7068／#7069／#7082／#7087 四個 commit，不跨下一筆 `2daedcdaf`。commit 水位只至 `3f42dc1c7`；PR 連續至 #7077，不跨 #7078；issue 維持 #7113（起始掃描無新項目）。新增 open #7079 與重釘上述三筆 monitored，其他釘選保持原值。真正未審範圍由 ROADMAP.md 近期列追蹤。

## 2026-11-04：接續至 `183614bda`，移植 10 筆獨立修正

起點為 fork `397e937f8`，baseline 為 commit `3f42dc1c7`、PR #7077、issue #7113。起始 `python tools/check_upstream_updates.py --strict` exit 1，固定上游 `183614bda3df15812d9f18fd4a71ee77a7da6387`：水位以上 28 個 commit、68 筆 PR、0 筆新 issue、16 筆 monitored 變動。扣除已有證據的 #7031／#7068／#7069／#7082／#7087／#7115 六個 commit，本輪逐筆審 **22 個 commit**（`2daedcdaf..183614bda` 連續，另 6 筆沿用前文證據）；PR 軸不連續，只列隨 commit 讀過補丁的 16 筆，PR 水位不動。各軸重疊，不相加為修正數。

`SHA:檔案:行號` 指該提交內容；「本線」指起點工作樹，採用項標明移植後行號。逐筆讀實際補丁，不以 `--stat` 或主旨判斷。

### Commit 裁決（28 筆，其中 22 筆新審）

| Commit／PR | 檔案行號證據與本線差異 | 裁決與重訪條件 |
| --- | --- | --- |
| `2daedcdaf` #6842 | 44 檔的付費樣式範本功能：`skills/style-sampling/SKILL.md:2`、`packages/cli/src/heygen/generate.ts:39`（lipsync／cutout）、`commands/templates.ts`、`pricing.ts`。其中 `packages/cli/src/cloud/offload.ts:841` 的 `namesFile` 與 `:950` 的 `TEMPLATE_SCENE_RE` 是獨立修正（`<template>` 內媒體未被改寫、同名他資料夾檔誤判為仍被提及）。本線 `offload.ts:490` 只掃 `document`、`:762` 以裸檔名比對、`:861` 無 template 處理；`core/src/fonts/deterministicFonts.ts:271` 的巢狀括號 font 簡寫，本線沒有 `fontShorthandFamilies`。 | **採用 offload 修正**（本線 `offload.ts:762`、`:871`、`:893`），5 個回歸，4 例先紅後綠。其餘不適用：本線無 `heygen/`、`templates`、`style-sampling`、media-use 的 HeyGen provider 鏈，也沒有字型簡寫解析器。引入 HyperFrames 計畫工作流時成組重訪（含 `adopt.mjs` 範本資料夾排除、cutout 的 request_id 重試去重）。 |
| `47dddedd6` #7082 | 沿用前文清冊。 | 延後，條件見前文。 |
| `35753f382` #7069 | 沿用前文清冊。 | 延後，條件見前文。 |
| `b2acef586` #7013 | `packages/cli/src/utils/autoUpdate.ts:57` 以 `0.<minor>` 當破壞線、`:259` 新增 Homebrew 不背景升級；本線 `autoUpdate.ts:54` 的 `majorOf` 只比第一個數字，`:262` 起 brew 仍會背景 `brew upgrade`。另 `skillsManifest.ts:643` 的 `cliReleaseTag`、`commands/skills.ts` 固定 `skills@1.5.13` 並以 release tag 安裝；本線 `skills.ts:137` 仍用未釘版 `npx skills`、`skillsManifest.ts:711` 無 ref。 | **採用 autoUpdate 部分**（本線 `autoUpdate.ts:54`、`:256`；文件 `docs/packages/cli.mdx:74`）：0.x minor 不背景安裝、Homebrew 只顯示通知；2 例先紅後綠。**延後 skills 的 release-tag 安裝**：改動 `npx skills` 版本釘選與遠端 ref，需與 #7120 成組。同步 skills 安裝時，驗 tag 404 才退回 main、逾時不退回、check 與 install 同 ref。 |
| `dec465949` #7088 | `packages/engine/src/services/frameCapture.ts:2734` 新增 `classifyScriptLoadCause`，警告尾端附 `[script_load: origin/code]`，不含 URL；本線 `frameCapture.ts:2661` 的 `recordScriptLoadFailure` 無 cause。 | **採用**（本線 `frameCapture.ts:2687`），新增 `frameCapture-scriptLoadCause.test.ts`（8 例）。`scripts/package-size-budgets.json` 上游加 632 位元組，落在本線預算 1% 容差內，未動；打包檢查若紅再依實測調整。 |
| `fc006f713` #7087 | 沿用前文清冊。 | 已採用，條件見前文。 |
| `4ceec0171` #7092 | `studio-server/src/helpers/lazyPreviewImages.ts:19` 先掃 tag、`subComposition.ts:383` 改 `findStartTags`、`core/.../scenePartsManifest.ts` 加早退；測試要求單次 parse。本線 `lazyPreviewImages.ts:18`、`subComposition.ts:383` 都先 parse。 | **延後（試移植後還原）**：本線把測試跑出 3 次 parse 而非 1 次（`helpers/previewReads.ts:107` 與 `@hyperframes/parsers` 的 `hfIds.js:99` 仍各 parse，後者是延後的 #7069），舊碼為 5 次。單搬只做到 5→3，不滿足測試性質。與 #7069 同批；量到 stamped preview 的 parse 瓶頸或同步 hfIds 時成組採用。 |
| `67d11c0a5` #7093 | `frameCapture.ts:2759` 對 `net::ERR_ABORTED` 的 script 不算載入失敗，抽出 `recordFailedRequest`（`:2761`）；本線 `frameCapture.ts:2778` 的 requestfailed 處理一律記失敗。 | **採用**（本線 `frameCapture.ts:2711`、`:2713`），依賴 #7088 的 cause 分類；2 例，被頁面取消的 script 舊碼被誤記（`['http://localhost/other.js']` 而非 `[]`）。 |
| `1071ff35a` #7097 | `README.md:14`／`:26`、`ADOPTERS.md:15`、`docs/community/adopters.mdx:17` 改新社群邀請。本線 `README.en.md:24`／`:36`／`:331`、`ADOPTERS.md:15`、`docs/community/adopters.mdx:17` 是舊連結；繁中 `README.md` 無 Discord 連結。 | **採用**：5 處改為官方新邀請碼（以 Discord 公開邀請端點唯讀查詢，新舊碼目前都有效，新碼由 HeyGen-Community 帳號發出）；保留上游官方連結。 |
| `12ce8c2ff` #7095 | 各 package.json／plugin.json 升 0.9.9，`releases/v0.9.9.md:5` 宣告未採功能。本線 `packages/cli/package.json:3` 為 0.8.210。 | 不適用：不以版本與發行說明宣稱未採功能；整版同步並驗收後重訪。 |
| `faae6017d` #7084 | `packages/cli/src/commands/templates.ts` 改 tar 由 stdin 讀。本線 tracked tree 沒有 `commands/templates.ts`。 | 不適用：同 #6842，引入 templates 時與 #7116 一併重訪。 |
| `a5a612133` #7031 | 沿用前文清冊。 | 見前文。 |
| `3a28ef41a` #6745 | `packages/studio/src/player/lib/mediaProbe.ts:134` 改為每檔一次 `apply(Map)`，`hooks/useTimelinePlayer.ts` 一次寫 store。本線舊 `probeMissingSourceDurations` 逐 clip 呼叫，hook 於 `useTimelinePlayer.ts:131` 以 `return {}` 仍觸發 store 通知。 | **採用**（本線 `mediaProbe.ts:134`、`useTimelinePlayer.ts:131`）。2 例先紅（apply 被呼叫 4 次而非 2 次）後綠。上游 `useTimelinePlayer.metadata.test.ts` 本線無此檔，store 層寫入次數未另釘，由 apply 層測試承擔。 |
| `3aaed65ef` #6919 | `packages/cli/src/utils/checkPipeline.ts:1509` 新增 `reportingProgress`，分析階段每個 driver 呼叫都重啟閒置視窗；`checkDeadline.ts` 加 `analysis` 階段。本線 `runAuditGrid` 分析區段（`checkPipeline.ts:1537` 起）直接用 driver。 | **採用**（本線 `checkPipeline.ts:1509`、`checkDeadline.ts` 新階段）。本線 `CheckDeadline` 閒置視窗固定 120 s、沒有 `analyze` progress 事件，上游測試改寫為以 `overlap` 後回到 `samples` 判定進入分析，並加無 wrapper 對照組；先紅後綠。 |
| `341fdd353` #7101 | `skills/reverse-any-video/SKILL.md:12`、`references/start.md` 付款與登入流程。本線 `skills/` 無 reverse-any-video（`git ls-files` 0 筆）。 | 不適用：引入該付費技能時連同認證、費用揭露與付款授權重訪。 |
| `9304d73ec` #7114 | `scripts/check-core-skills.test.mjs:20`、`:40` 對齊 reverse start 字句。本線同檔沒有 reverse 斷言。 | 不適用：隨 #7101 技能。 |
| `3dc82f18e` #7104 | `packages/producer/src/services/render/stages/captureStreamingStage.ts:659` 起，sequential 擷取停滯後重建 session 從第一個未寫入畫格續跑，最多三次。本線 `captureStreamingStage.ts:767` 只有 parallel BeginFrame 單次 resume，sequential 直接拋錯。 | 延後：改變整次渲染的失敗恢復，且 screenshot 模式畫格可否跨 session 銜接要渲染證據。本線重現 sequential 停滯，或安排 capture fallback 同步（連 #7070）時，驗畫格連續與 hash、三次後退回、取消不重試，並跑 Windows render verification 與 regression。 |
| `e2edc93f5` #7096 | `packages/producer/src/services/render/stallClock.ts:11` 新增 `createStallClock`，睡眠造成的時間跳躍不算停滯；用於 `observability.ts` 的 `watchStall`、`captureStreamingStage.ts` 的 `raceAgainstStall` 與 parallel／worker-encode 監看。本線以 `Date.now() - lastProgressAt`（`captureStreamingStage.ts:502`、`:512`、`:806`、`:1043`）與 `lastChangeAt`（`observability.ts:642`）計時，筆電睡眠醒來即判停滯。 | **採用**（本線 `stallClock.ts`、`captureStreamingStage.ts:82`／`:211`／`:520`／`:814`、`observability.ts` 的 `silence`）。另有超出上游的改動：本線 sequential 分支（`captureStreamingStage.ts:1049`，上游 `e2edc93f5` 該處仍用 `Date.now() - lastProgressAt`）也改用 `createStallClock`；`quiet.reset()` 與下一輪 `quiet.idle(0)` 之間只有同步程式碼，行為與原本一致，統一時間來源以免該分支仍受睡眠跳躍影響。本線 `watchStall` 無 `complete`／`tail` 分支，補丁無法直接套用，故手工移植；4 個行為先紅後綠。 |
| `d88d2cce4` #7116 | `packages/cli/src/commands/templates.ts`、`templates.test.ts`。本線無該檔。 | 不適用：同 #7084。 |
| `87a42e747` #7068 | 沿用前文清冊。 | 見前文。 |
| `482bcd73e` #7115 | 沿用前文清冊。 | 已採用。 |
| `3adc9f130` #7112 | `packages/cli/src/heygen/generate.ts`、`generate.test.ts` 在無 ffmpeg 機器送圖。本線沒有 `packages/cli/src/heygen/`。 | 不適用：未採 HeyGen 媒體服務鏈。 |
| `f487a20b2` #6947 | `packages/cli/src/utils/checkPipeline.ts:124` 預設 timeout 改 `DEFAULT_CONFIG.playerReadyTimeout`（45 s）、`checkBrowser.ts:96` 抽出 `RENDER_READY_WARNING_SUFFIX`、`commands/check.ts` 預設值同步。本線 `checkPipeline.ts:122` 為 10_000、`check.ts:211` 描述與預設為 10000。 | **採用**（本線 `checkPipeline.ts:123`、`checkBrowser.ts:94`、`check.ts:211`；文件 `docs/packages/cli.mdx:1169`；本線額外同步 `skills/hyperframes-cli/references/lint-validate-inspect.md:39` 的預設值 10000 為 45000）。這是公開預設值變更：check 與 snapshot／render 等待一致，慢場景不再以 10 s 誤報；`--timeout` 仍可覆寫。2 例先紅後綠。 |
| `e46ecd850` #6928 | `packages/cli/src/commands/validate.ts:79` image 資源被取消不忽略，`MEDIA_EXTENSIONS` 擴到 mkv／m4v／avi 等；本線 `validate.ts:53` 副檔名清單較窄、無 image 例外。 | **採用**（本線 `validate.ts:78`）。3 例先紅後綠。 |
| `d21877eb2` #7121 | `packages/cli/src/commands/billing.ts:72` 的 add-credits 改名。本線無 `commands/billing.ts`。 | 不適用：未採 billing。 |
| `c5a5e0882` #7103 | `commands/billing.ts:48`、`heygen/plan.ts`、`heygen/reverse.ts`、`commands/auth/status.ts` 讓付款連結帶 workspace。本線無 billing／plan／reverse。 | 不適用：未採 billing；未登入、未建立 checkout。 |
| `b02fe6506` #7120 | `packages/cli/src/utils/skillsManifest.ts:395` 的 `globalInstallRoot`、`commands/skills.ts` 的 `installTarget`；文件 `docs/guides/skills.mdx`。本線 `skillsManifest.ts:711` 仍 `locateInstall`，補丁依賴 #7013 的 `ref`／`cliVersion` 前置，`git apply --check` 在 `skills.ts:346`、`skillsManifest.ts:757` 失敗。 | 延後：與 #7013 skills 部分成組。同步 skills 安裝時驗 Claude 全域目錄為安裝目標、其他 agent 目錄不誤判已安裝、他人發行者的同名 skill 在離線與線上都不覆寫。 |
| `183614bda` #7128 | `.codex-plugin/plugin.json:4` 等升 0.9.10，`releases/v0.9.10.md`。本線 `packages/cli/package.json:3` 為 0.8.210。 | 不適用：同 #7095。 |

### 隨 commit 讀過補丁的 PR（16 筆，PR 水位不動）

下列 PR 皆為 merged，已核對 merge SHA 與上表補丁；它們都在 #7077 以上，而 #7078 起仍有未審項目，所以只作額外證據，不推進 PR 水位。

| PR | merge SHA 與結論 |
| --- | --- |
| #7084 | `faae6017d`；不適用，見 commit 表。 |
| #7088 | `dec465949`；採用，head `f09de208471b428d4ca227009659dff5c3f2589b`。 |
| #7092 | `4ceec0171`；延後，head `5a5007836575cb5e7362a9c4bc3ffa2d79c0c3b5`。 |
| #7093 | `67d11c0a5`；採用，head `e8d98bc564ff0be0dc171e2e9b6c9e2695366224`。 |
| #7095 | `12ce8c2ff`；不適用，head `8c8e1d20cd2ce8689bea42b07d24328298171c61`。 |
| #7096 | `e2edc93f5`；採用，head `c66b013a6a1534613f5d30e45736c68b5a266126`。 |
| #7097 | `1071ff35a`；採用，head `ecc96fcff36e52320f954067c5ee70459c7ffaa5`。 |
| #7101 | `341fdd353`；不適用，head `780a434970a604e9297f1ac13eecd70aba4a3724`。 |
| #7103 | `c5a5e0882`；不適用，head `44f95ebed90f6066fd07215b207716fd4bdc4959`。 |
| #7104 | `3dc82f18e`；延後，head `03384995e6cc9d2ee93a5e0373f16d5040b97e4e`。 |
| #7112 | `3adc9f130`；不適用，head `7b14df4140989f47f16778c5e08a9664252aaed1`。 |
| #7114 | `9304d73ec`；不適用，head `70df6244baa3c845322f7838b6a1189389e01826`。 |
| #7116 | `d88d2cce4`；不適用，head `74010b8b62ff2cf996fbd843a2c21426137d0857`。 |
| #7120 | `b02fe6506`；延後，head `a16a435d3258c09deea6837f60bc6267b8681fcf`。 |
| #7121 | `d21877eb2`；不適用，head `8d0e085698fd65c80515e7b2bcb33a0ff54aa110`。 |
| #7128 | `183614bda`；不適用，head `c9e166ee62afb0bb1c53d74db7ec526488add4cc`。 |

#6842／#7013／#6745／#6919／#6947／#6928 的編號在 PR 水位以內，其 merged 補丁已於上表讀過；它們同時是 baseline `monitored` 項，本輪**沒有重釘**（PR head 與 merged 補丁不保證相同，尚未逐一讀各自的 PR head），仍列入剩餘 monitored。

### 採用、驗證與已知環境失敗

採用項與上游作者（Co-authored-by 用；email 見 git log）：#6842 的 offload 部分（WaterrrForever）、#7013 的 autoUpdate 部分（Wenbo Zhu）、#7088／#7093／#7097／#6745／#6919／#7096／#6947／#6928（Miguel Ángel）。每項先把測試放到舊碼：

| 項目 | 舊碼 | 新碼 |
| --- | --- | --- |
| #6842 offload（`src/cloud/offload.test.ts`） | 4 failed／27 passed | 31 passed |
| #7013 autoUpdate（`src/utils/autoUpdate.test.ts`） | 2 failed／20 passed | autoUpdate、installer、updateCheck、installerDetection、cli.lifecycle 共 100 passed |
| #7088／#7093（engine `frameCapture-scriptLoadCause`、`-subTimelinePoll`） | 測試匯入失敗；加 `recordFailedRequest` 但未擋取消時 1 failed／25 passed | 26 passed |
| #6745（`mediaProbe.test.ts`） | 2 failed／6 passed | 與 `useTimelinePlayer*` 共 127 passed（7 檔） |
| #6928（`validate.test.ts`、`checkBrowser.test.ts`） | 3 failed／86 passed | 89 passed |
| #6919（`check.test.ts -t "slow analysis"`、`checkPipeline.reportingProgress.test.ts`） | check_runtime_failure 被報出（1 failed）；`reportingProgress is not a function` | reportingProgress 4 passed；check 套件綠 |
| #6947（`check.test.ts`、`checkBrowser.test.ts`） | 2 failed／217 passed（10000 與 NaN） | check、checkBrowser、checkPipeline 共 263 passed（7 檔） |
| #7096（producer） | `observability.test.ts` 1 failed；`captureStreamingStage.test.ts`（bun）2 failed／28 passed | stage 30 pass／0 fail；vitest 的 `stallClock`＋`observability` 22 passed |

另跑：`bun run --cwd packages/{engine,cli,studio,producer} build` 皆 exit 0；`oxfmt --check`／`oxlint` 對變更檔 0 warnings／0 errors。

已知本機失敗（與本輪修改無關，已在舊碼重現）：

- `src/cloud/offload.undecodableTrack.test.ts` 2 failed：ffmpeg 9.0.2 在 `made.mov` 已存在時詢問覆寫（`already exists. Overwrite? [y/N]`），舊碼同樣失敗。
- `src/utils/checkDeadline.process.test.ts` 2 failed（啟動 Chrome 逾時，1 skipped），舊碼同樣失敗。
- engine `src/services/frameCapture` 全套並行跑時 3 例 5 s 逾時（firstBeginFrame、freshFallback、softwareWebGpu）；三檔單獨跑在舊碼與新碼都是 25 passed。producer `renderOrchestrator.deGateProbe.test.ts` 首次冷啟動逾時，第二次 3 passed。
- 先前已知的 symlink EPERM（`assetResolution.test.ts:311`、`projectShaders.test.ts:85`）與 `media.test.ts:99` 含 `?` 檔名失敗，本輪沒有重跑產品 Quick gate，不宣稱完整產品驗收通過。

### 水位與剩餘範圍

commit 連續區段 `2daedcdaf..183614bda`（兩端含）共 28 個 commit，其中 6 個沿用前文證據、22 個本輪逐筆處理，水位推進至 `183614bda3df15812d9f18fd4a71ee77a7da6387`。PR 水位維持 #7077（#7078 起未逐筆審）；issue 維持 #7113。

固定上游 `183614bda` 的起始掃描為 28 commit／68 PR／16 monitored。審查期間上游又前進到 `7e71718`（新增 #7144 `19be35a`、#7143 `7e71718`），結束檢查 `python tools/check_upstream_updates.py --strict` exit 1：水位以上 2 個 commit、68 筆 PR、0 筆新 issue、80 筆釘選中 17 筆變動（含 pr#6714 `6c09af39…`→`4f09b98`、仍 open）。扣除本輪已有逐筆證據的 22 筆 PR（#7079／#7080／#7081／#7082／#7087／#7115 加上表列 16 筆），真正未審 PR 為 46 筆；monitored 未重釘，仍為 17 筆。剩餘計畫只在 ROADMAP.md 近期列維護。

## 2026-11-04：接續至 `1ff4cefd4`，移植 4 筆獨立修正

起點為 fork `08cc80bd5`，baseline 為 commit `183614bda`、PR #7077、issue #7113。起始 `python tools/check_upstream_updates.py --strict` exit 1：上游本地快照 `11f43268a`，水位以上 8 個 commit、75 筆 PR、0 筆新 issue，80 筆釘選中 19 筆變動（比上一輪結束時的 2／46／17 多，因為上游持續合併）。審查期間上游又前進到 `1ff4cefd4`（先後合併 #7154、#7156）並新開 #7157，本輪一併處理。本輪逐筆審查 **10 個 commit、#7078–#7157 範圍內尚無證據的 PR、19 筆既有 monitored 重釘、新增 8 筆 monitored**；各軸重疊，不相加為修正數。

`SHA:檔案:行號` 指該提交內容；「本線」指起點工作樹，採用項標明移植後行號。逐筆讀實際補丁，不以 `--stat` 或主旨判斷。未合併 PR 以 `gh pr diff --repo heygen-com/hyperframes` 取目前 head 的完整補丁；merged PR 另核對 merge 補丁與 PR head 補丁的新增／刪除行集合相同。對本輪新讀的補丁（8 個 commit、#7154、45 筆 PR 補丁、19 筆 monitored head）共 34309 個新增行做隱藏內容掃描（40 字元以上空白後接內容、`eval(`／`new Function`／`atob(`／`fromCharCode`、`globalThis`、100 字元以上 base64、500 字元以上單行、零寬與雙向控制字元）：命中只有 Markdown 表格欄位對齊的空白（#6842、#6968、#7135、#7136、`7cb6018c6`）、文件與技能的長句（#6842、#7134、#7138、`19be35a46`、`6857bb08e`、`76da5f693`）、測試中的 `globalThis`／`page.$eval`（#7014、#7108、#7119、#7140）以及 #7137 測試 fixture 內的重複字元與長 regex；沒有行尾藏碼。

### Commit 裁決（10 筆）

| Commit／PR | 檔案行號證據與本線差異 | 裁決與重訪條件 |
| --- | --- | --- |
| `19be35a46` #7144 | `packages/cli/src/heygen/v3.ts:277`、`:297` 把 `publicVoices` 抽成 `listVoices`，新增 `ownVoices`（`type: "private"`），401／403 導向 `auth login`；`commands/media-use/voices.ts:1` 新增 `media-use voices`，`commands/media-use.ts:103` 註冊。本線 `packages/cli/src/heygen/` 不存在，`packages/cli/src/media-use/lib/voice-provider.mjs:32` 仍以 `heygen voice list` 取聲線，`commands/media-use.ts` 無 `voices`／`generate`，`measure/command.ts` 也不存在。 | 不適用：整個補丁掛在本線沒有的 HyperFrames 帳戶媒體服務鏈（#7063）上，不能只搬一個 `ownVoices`。引入 `heygen/v3.ts` 與 `media-use generate` 時成組重訪，驗聲線列表走 HyperFrames 帳戶而非 `heygen` 登入、401／403 提示與 `--limit` 邊界。 |
| `7e717189c` #7143 | `packages/core/src/compiler/inlineSubCompositions.ts:474` 在 scene 內的 host 不在 `hostIdentityMap` 時，改讀 host 自己的 `data-composition-id`（原本 `identity?.authoredCompositionId \|\| null` 把它丟成 null，兩個共用 composition id 的 host 註冊到同一個 timeline key）；`htmlBundler.nestedTimelines.test.ts:1` 新增回歸；兩份 `pageBuild.*.html` golden 去掉內層根重複的 `data-composition-id`。本線 `inlineSubCompositions.ts:474` 與上游父版相同（`if (hostIdentityMap) { const identity = hostIdentityMap.get(hostEl); … }`）。 | **採用**（本線 `inlineSubCompositions.ts:474`、`:226` 說明、`__goldens__/pageBuild.preview.html`／`pageBuild.render.html`、`htmlBundler.nestedTimelines.test.ts:1`）。補丁無衝突，行為與上游一致；golden 變動是內層根不再帶重複的 `data-composition-id`，由 golden 測試釘住。 |
| `76da5f693` #7145 | `packages/cli/src/media-use/lib/credit-limit.mjs:10` 讀 `.hyperframes/credit-limit.json`，`:35` 的 `refuseUnderLimit` 對無法計價的 `heygen` 呼叫拒絕並導向 `media-use generate --type voice`；`heygen/v3.ts:221` 的 `withinLimit` 在付費任務前預留額度；`voice-provider.mjs`、`heygen-video-provider.mjs`、`skills/media-use/audio/scripts/lib/tts.mjs:311` 加拒絕。本線 `voice-provider.mjs:39`、`heygen-video-provider.mjs:46` 直接呼叫 `heygen` CLI，沒有 credit-limit 檔案也沒有 `media-use generate`。 | 不適用：拒絕訊息導向本線不存在的指令，單獨加上會讓使用者被擋卻無替代路徑。與 #7144 同屬媒體服務鏈，成組引入時驗額度預留、refused 回補、重試去重與無法計價的呼叫。 |
| `7cb6018c6` #7094 | 25 檔 +1956：新增 `commands/update.ts:1`（`update --check`，`:28` 範例）、`utils/dailyNotice.ts:1`（每日一次通知，未來時間不信任）、`installerDetection.ts:190` 起 `runningInstall`／`updateCommandFor`、`skillsUpdateCheck.ts:33` 起把快取改 2 小時並記錄 `skillsCheckedVersion`、`commands/skills.ts:328`、`:511` 以 `opts.cliVersion` 取 release tag、`telemetry/config.ts:503`、`doctor.ts` 新增 CLI binary 檢查。本線無 `commands/update.ts`、`utils/dailyNotice.ts`；`installerDetection.ts:56` 的 `isEphemeralExec` 只看上層目錄名是否以 `bunx-` 開頭（上游 `:63`–`:65` 補 `/bunx-[^/]+/node_modules/` 辨識真實 bunx 路徑），但本線 `detectInstaller` 對該路徑各分支皆不命中，最終於 `:153` 回 skip，自動更新行為不受影響；`skills.ts:137` 與 `skillsManifest.ts:711` 仍無 release-tag ref。 | 延後：新增公開指令與通知政策，並依賴 #7013 skills 部分（`cliReleaseTag`／固定 `skills` 版本）與 #7120 才完整。bunx 路徑辨識只影響 `update`／`doctor` 的標籤，本線無可觀察錯誤，不單獨搬。同步 skills 安裝與 update 指令時成組驗：`--check --json` 的 `_meta`、brew／plugin／project-local 的更新指令、每日通知不寫入唯讀 HOME、快取版本與 CLI 版本不同時失效、Windows 路徑。 |
| `e04b722a9` #7152 | `packages/cli/package.json:3` 等升 0.9.11；`releases/v0.9.11.md:1` 與 `docs/changelog.mdx:11` 宣告 #7094、#7145、#7143、#7144。本線 `packages/cli/package.json:3` 為 0.8.210。 | 不適用：版本與發行說明含未採功能（update、credit limit、voices），不能只升版本。整版同步並完成產品驗收後重訪。 |
| `6857bb08e` #7102 | 17 檔 ±57：`skills/hyperframes/references/skill-lifecycle.md:1`／`:12` 改為「安裝、更新、移除技能是使用者的步驟，agent 只告知」並要求 agent 跑 `init` 時加 `--skip-skills`；`skills/hyperframes-cli/SKILL.md:6`、`:18`、`:27` 與 `skills/hyperframes/SKILL.md` 同步，`skills-manifest.json` 18 行雜湊。本線 `init.ts:779` 已有 `--skip-skills`；`skills/hyperframes-cli/SKILL.md:16`、`:25` 與 `skill-lifecycle.md:8`、`:12` 仍寫由 agent 執行 `skills update`。補丁含本線沒有的 `reverse-any-video`、`style-sampling` 技能與 `scripts/check-core-skills.test.mjs:43` 的 reverse 斷言。 | 延後：這是 agent 行為政策，與 `7cb6018c6` 的「把過期狀態轉告使用者」成組（技能文字要求 agent 轉述 stale 提醒，而本線無該提醒），且 `skills-manifest.json` 雜湊需重生。同步 #7094／#7013 skills 部分時一併採用，驗 `init --skip-skills` 範例、plugin 安裝文字與 manifest 雜湊，並只改本線已有的技能。 |
| `50ce9fb51` #7151 | `packages/cli/src/utils/outputFolder.ts:1` 新增 `makeOutputFolder`：目錄已存在時不呼叫 `mkdirSync`；Windows 對已存在的磁碟根目錄（`D:\`）做遞迴 `mkdir` 會回 EPERM，輸出直接放磁碟根的指令在寫檔前就失敗。下列呼叫端改用它：`cloud/download.ts`、`commands/batchRender.ts`（2 處）、`compare.ts`、`grade-compare.ts`、`measure/extract.ts`、`measure/probe.ts`、`motionShot.ts`、`render/execute.ts`、`templates.ts`、`heygen/generate.ts`、`tts/synthesize.ts`；`fileIds.windows.test.ts` 的 `statSync` mock 改為保留 `Stats` 方法。本線無 `measure/`、`templates.ts`、`heygen/`。 | **採用**（本線 `utils/outputFolder.ts:1`；呼叫端 `cloud/download.ts:77`、`batchRender.ts:323`／`:345`、`compare.ts:365`、`grade-compare.ts:671`、`motionShot.ts:63`、`render/execute.ts:75`、`tts/synthesize.ts:213`；`fileIds.windows.test.ts` 的 mock 同上游）。本機 Node 26.12.1 實測 `fs.mkdirSync` 遞迴建立已存在的 `C:\` 與 `D:\` 皆回 EPERM，與上游描述一致。上游未動的 `commands/capture.ts:339`、`whisper/transcribe.ts:518` 等 `mkdirSync(outputDir)` 不在補丁內，本輪不擴大。 |
| `11f43268a` #7155 | `packages/cli/src/cloud/errors.ts:78`–`:80` 在 `err.param` 存在且訊息未含時，補上 `(parameter: …)`；`cloud/upload.ts:203` 的 `TYPE_REFUSAL` 與 `nameRefusedFile` 在 `completeAssetUpload` 回 `invalid_parameter` 時帶上檔名，只有型別拒絕才說是「型別」，過期等拒絕不誤指檔案類型。本線 `errors.ts:75`、`upload.ts:199` 與上游父版相同，無此包裝。 | **採用**（本線 `errors.ts:80`、`upload.ts:203`／`:205`／`:251`、`errors.test.ts`、`upload.test.ts`）。補丁無衝突。 |
| `5cea10e76` #7154 | `packages/producer/src/services/render/captureCost.ts:347`／`:386`／`:446`／`:488` 記錄校準最後一次失敗是否為 `Runtime.evaluate` 逾時、`:510` 回傳；新增 `render/pageNeverReady.ts:1`（`checkPageNeverReady`，`code: PAGE_NEVER_READY`、`retryable: false`、`owner: "user"`）；`renderOrchestrator.ts:5683` 在 catch 以它取代泛用錯誤；`safeRenderErrorCode.ts:12` 加入可公開的錯誤碼。本線沒有 `safeRenderErrorCode.ts`，該集合在 `packages/producer/src/server.ts:140`；`renderOrchestrator.ts:5473` 的 catch 為 `const error = tooSlowError ?? caught`（上游父版另有 `surfaceScriptFailure`，本線沒有）。 | **採用，手工適配**（本線 `captureCost.ts:346`／`:385`／`:445`／`:487`／`:509`、`pageNeverReady.ts:1`、`renderOrchestrator.ts:194`／`:2983`／`:4031`／`:5476`、`server.ts:151`）：補丁無法直接套用，錯誤碼加到本線 `server.ts` 的集合，catch 用 `tooSlowError ?? pageNeverReady ?? caught`；取消判定順序與上游相同（`executionSignal?.aborted` 仍走取消分支）。merge 補丁與 PR head 補丁的新增／刪除行集合相同（246 行）。 |
| `1ff4cefd4` #7156 | 21 檔：各 package.json 升 0.9.12；`releases/v0.9.12.md:1`、`docs/changelog.mdx:11` 宣告 #7154、#7155、#7151、#7102（其中 #7102 本線延後）。本線 `packages/cli/package.json:3` 為 0.8.210。除版本號、changelog 與發行說明外沒有其他新增行。 | 不適用：同 `e04b722a9`，版本與發行說明含未採功能，整版同步並完成產品驗收後重訪。 |

### PR 裁決（PR 水位 #7077 → #7157）

下列依編號列出尚無證據的項目。前文清冊已有證據的 #7079、#7080、#7081、#7082、#7087、#7115，以及已隨 commit 讀過補丁的 #7084、#7088、#7092、#7093、#7095、#7096、#7097、#7101、#7103、#7104、#7112、#7114、#7116、#7120、#7121、#7128 不重複。#7111、#7113、#7139 不在上游 PR 清單內（issue 或不存在）。

| PR | 檔案行號證據與裁決 |
| --- | --- |
| #7078 | closed head；`packages/cli/src/cloud/_gen/client.ts:5` 起新增 createImage／createVideo／listVoicesV3／createSpeechV3／createTranscription 等媒體端點，`types.ts:9` 起重生（+744 行），同時刪除舊端點宣告。不適用：與 #7063 同屬媒體服務與 generated client 鏈，本線 `cloud/_gen/client.ts` 沒有這些端點；不以 closed 補丁取代權威 schema。 |
| #7083 | open head；`packages/engine/src/services/audioMixer.test.ts:1053` 把 normalize fallback 測試擴成 padded gain 與自動化音量兩例，`audioMixer.ts:359` 只改註解。延後：只有測試與註解，無行為修正可移植；合併後若本線 fallback 與測試不一致再評估，不單獨搬測試。 |
| #7085 | open head；`commands/billing.ts`、`heygen/plan.ts`、`auth/oauth.ts` 新增終端機付款流程。不適用：本線無 billing、plan 與 OAuth 隔離（見 #7068）；未登入、未建立 checkout。 |
| #7086 | closed head；`scripts/clawhub-sync.mjs:48` 起改為逐版往上重試發布。不採：closed 未合併，且自動發布與 ClawHub 同步屬路線圖「刻意不做」；本線 `scripts/clawhub-sync.mjs:39` 的 `versionPastSkippable` 維持原樣。 |
| #7089 | open head；`commands/reverse/start.ts`、`commands/init.ts` 讓 reverse start 建立 `--dir` 專案並接受資料夾內既有影片。不適用：本線無 `commands/reverse/`。 |
| #7090 | open head；`measure/extract.ts:64`、`measure/diff.ts:371`、`measure/media.ts:228`、`measure/person.ts:259` 把 crop 前先轉 rgb24 或加 `exact=1`，避免奇數尺寸被 yuv420p 向下取偶。不適用：本線無 `packages/cli/src/measure/`。引入 measure 時成組驗奇數框 33x33 與奇數位移。 |
| #7091 | closed head；`runtime/preloadMedia.ts:34` 新增 `preloadFromInPoint`，WebKit 先載 metadata 再 seek 到入點；`init.ts:3055`、`:3140` 改呼叫。延後：與 #7082 的 Safari 音訊前置鏈成組，需 Safari 實機。同步 Safari 媒體時鐘時驗深入點、起點為 0 與非 WebKit 路徑，不以 closed 狀態判不適用。 |
| #7094 | merge `7cb6018c6`；見 commit 表。延後。 |
| #7098 | open head；`commands/render/plan.ts:572` 在擷取前用 `appendRateCapArgs` 驗 `--video-bitrate`，壞值 `abc`／`10x`／`0` 即 usage error；`plan.test.ts:249` 新增 4 例。本線 `plan.ts:482` 只 trim、`:512` 只拒空字串，壞值會到 ffmpeg 才失敗。延後至合併（獨立、可移植）；合併後依 commit 採用，驗 MOV 拒絕順序與 `--max-bitrate` 共用解析器。加入 monitored。 |
| #7099 | open head；`auth/status.ts`、`heygen/v3.ts`、`measure/command.ts` 的 paywall 連結與方案標籤。不適用：本線無這些模組。 |
| #7100、#7106、#7107、#7109、#7117、#7118、#7122、#7123、#7124、#7125、#7127、#7129 | 皆 closed head；`cloud/_gen/types.ts` 逐次補 `reverse_session_id`（`:124`）、`output_upload`（`:201`、`:243`）、`OutputUploadRequest`／`UploadTargetRequest`、`DeliveryStatus` 等欄位。延後：generated schema 不獨立覆蓋，與 #7062／#7058 同一重生條件；closed 本身不代表不適用。 |
| #7102 | merge `6857bb08e`；見 commit 表。延後。 |
| #7105 | closed head；`commands/billing.ts`、`heygen/v3.ts`、`skills/media-use/audio/scripts/lib/heygen.mjs` 的 top-up 改名 add-credits 並留別名。不適用：未採 billing；後續 #7121 已不留別名。 |
| #7108 | open head；`.github/workflows/ci.yml`、`packages/engine/src/services/__fixtures__/motionBlur/*`、四個 `captureMotionBlur.*.browser.test.ts` 與 `packages/producer/scripts/integration-tests.json`，+1860 行的像素不變量與 CI job。延後：測試與 CI 工作流，需 Chrome 與新增 job；本線已有 `captureMotionBlur.pixels.browser.test.ts`，合併並確定 CI 契約後再評估，不為稽核變綠加 workflow。 |
| #7110 | open head；`whisper/normalize.ts:502` 的 `parseWhisperJson` 把 JSON 字串外的 `nan`／`-nan`／`inf`／`-nan(ind)`（MSVC）換成 null，`transcribe.ts:581` 與 `loadTranscript` 改用；`normalize.test.ts:127` 新增回歸。本線 `normalize.ts:63`、`:531` 與 `transcribe` 讀 whisper JSON 處仍直接 `JSON.parse`，輸出含 `nan` 時會失敗。延後至合併（獨立、對 Windows MSVC 版 whisper-cli 有實益）；合併後依 commit 採用，驗字串內含 `nan` 的字詞不被改寫。加入 monitored。 |
| #7119 | open head；`engine/src/services/frameCapture-decodeTimeoutCallers.test.ts` 新增 +181 行，釘住 decode 逾時警告到達所有呼叫者。本線試跑：3 例失敗（drawElement init、per-frame seek 各 5 s 逾時，batch loop 例斷言 `lateBackgrounds`，該欄位由 #6972 引入），所以測試依賴 #6972（open）。延後：先有 #6972 才有意義；試跑檔案已移除。加入 monitored。 |
| #7126 | closed head；重複的 v0.9.10 release（#7128 已合併）。不適用：同 #7095。 |
| #7130、#7157 | open head；`cloud/_gen/types.ts` 生成補丁，同 #7100 群（#7157 於收尾前新開，補丁為 +37 行的同一組 `reverse_session_id`、`output_upload`、`DeliveryStatus`、`FileDeliveryStatus`、`VideoDetail.delivery`）。延後。 |
| #7131 | open head；`README.md`、`docs/faq.mdx`、`docs/introduction.mdx` 改寫「免費」與 Studio app 方案說明。不適用：Studio app 的方案與價格是上游產品宣告，本線不能複述。 |
| #7132 | open head；`docs/packages/cli.mdx:1114` 改為 `open` 的交棒在 macOS、Windows、Linux 都可用，`docs/studio-app/edit-with-the-agent.mdx:66` 移除 add a transition。本線 `docs/packages/cli.mdx:1069` 仍寫僅 macOS，而 `commands/open.ts:17` 的錯誤訊息已寫三平台。延後：文件需與 `open` 在 Windows 的實測一致，合併後以 `hyperframes open` 實跑核對再調整。 |
| #7133 | open head；`docs/docs-menu-label.js:1` 新增導覽按鈕標籤腳本。不適用：Mintlify 品牌互動，本線無對應需求。 |
| #7134、#7135、#7136、#7137、#7138、#7140、#7141 | 皆 draft；#7134 新增 `packages/share/` 與 CI 發佈步驟，#7135 `commands/share.ts`，#7136 `share/publishTransition.ts` 與 `publish.ts`，#7137 `share/sources.ts`（+14374 行），#7138 `share/telemetry.ts`，#7140 Studio 分享路由，#7141 `core/src/storyboard/frameIdentity.ts` 與 `reviewManifest.ts`。不適用：本線無 `packages/share`、`commands/share.ts`，分享要求 HyperFrames 帳戶與遙測；#7141 改動本線有的 `storyboard/parseStoryboard.ts`、`editStoryboard.ts` 序列化，draft 未穩定，先不採，合併後與分享鏈成組重訪。 |
| #7142 | open head；`commands/init.ts:215` 的 `missingRenderToolsWarning` 在 init 結束時警告找不到 FFmpeg／FFprobe，`browser/ffmpeg.ts:123` 對 macOS 補無 Homebrew 的路徑提示。本線 init 不警告，render 時才失敗。延後至合併（對 Windows 同樣有益）；合併後依 commit 採用，驗 `HYPERFRAMES_FFMPEG_PATH` 覆寫與非互動輸出。加入 monitored。 |
| #7143、#7144、#7145 | merge `7e717189c`、`19be35a46`、`76da5f693`；見 commit 表。#7143 採用，其餘不適用。 |
| #7146、#7147 | open head；`docs/snippets/catalog-gallery.jsx`、`docs/catalog-gallery.css`、`scripts/generate-catalog-previews.ts` 改 catalog 卡片為小段循環影片並加搜尋框。不適用：上游文件站互動與預覽資產管線，本線 catalog 頁無此需求。 |
| #7148、#7153 | open head；#7148 `docs/docs.json:1014` 把頁尾社群連結改為 HyperFrames 的 X 與 Discord，#7153 又把 README／ADOPTERS／adopters.mdx 的 Discord 邀請改成兩組不同的新邀請碼並在 `docs.json:1011`、`:1074` 加導覽列。本線 `docs/docs.json:987` 仍是 HeyGen 的 X 與 Instagram。延後：邀請碼在一天內已被 #7097 → #7153 更動，且兩筆都改同一個 `docs.json`，待上游合併後以最後有效連結一次採用，避免本線再追一次改版。兩筆加入 monitored。 |
| #7149 | open head；`engine/src/services/captureMotionBlur.sweep.browser.test.ts` 與 `__fixtures__/motionBlur/sweepFixtures.ts` +576 行，用症狀釘住 motion blur 掃描缺陷 A–O。延後：Chrome 像素測試，與 #7108 同批。 |
| #7150 | open head；`core/src/runtime/init.ts:4072` 在 `buildReady` 的 hold 被 reject 時呼叫 `recordStartupError(err)`，擷取以 `__hfStartupError` 失敗並帶原因，而不是渲染從未建好的場景後 exit 0；`init.test.ts:4518` 新增回歸。本線 `init.ts:3918` 只 `swallow("runtime.init.buildReady", err)`，`recordStartupError` 已在 `init.ts:196` 匯入。延後至合併（獨立、小）；合併後依 commit 採用，驗 `__renderReady` 不被錯放與錯誤字串。加入 monitored。 |
| #7151、#7152、#7155 | merge `50ce9fb51`、`e04b722a9`、`11f43268a`；見 commit 表。#7151／#7155 採用，#7152 不適用。 |
| #7154 | merge `5cea10e76`；見 commit 表。採用。 |
| #7156 | merge `1ff4cefd4`；見 commit 表。不適用。 |

### Monitored 重審

19 筆既有項目的 head 或狀態變動，逐一取目前 PR 完整補丁（`git diff <merge-base> <head>`）與前次已審 head 的新增／刪除行集合比對；merged 項目另與 merge 補丁比對。

| PR | 前 head／state | 新 head／state | 補丁差異與裁決 |
| --- | --- | --- | --- |
| #6695 | `ddc987bd983b0d4d316399ad3137eb6a4437fe2f`／open | `ad1577afb426c7e886cd96e075b416a742418f13`／open | 只差各 package.json 的版本號（0.8.214 → 0.9.11），undici 7.30.1 本體不變。延後不變：本線尚未引入 #6571 的直接依賴。 |
| #6714 | `6c09af3980ed84a27f0493aec10c283769a26758`／open | `4f09b98040af846cfdd727975876befe8bf8b0b7`／open | `beatFile.ts` 去掉「多個未標記 audio 時列出各候選」的歧義回報，改為「唯一未標記 audio 即音樂」，manifest 雜湊更新。延後不變：仍須驗證 beats 既有 JSON 契約。 |
| #6745 | `5cc515742006a00db3a42ad25e75672a3a5b5672`／open | `4100fad8b14d5fecc1d54f10d58867f90f31cdf7`／closed | PR head 補丁（77 行）與 merge `3a28ef41a` 補丁的新增／刪除行集合相同。本線 `mediaProbe.ts` 與 merge 內容逐位元組一致，`useTimelinePlayer.ts:140` 同為 `return patched ? { elements: patched } : state`；前輪註記的「`return {}` 仍觸發通知」指舊碼。已採用，重釘。 |
| #6816 | `224dba41b1b1200f2934d1f2798850b6f0315d4c`／open | `870f4d952a848d781b11a41ebdb0a7648e20ffb2`／open | 只差 `skills-manifest.json` 雜湊。延後不變。 |
| #6842 | `60264653a7082d1d6f228596ce3aebb1f6fc51ef`／draft | `fe3e2cfdc32a280a39b1af3214432630adbff9bf`／closed | PR head 補丁（1220 行）與 merge `2daedcdaf` 補丁行集合相同。offload 部分已採用，其餘不適用，見 `2daedcdaf` 列。重釘。 |
| #6861 | `070e6b9134a43e1ea6a39a9e33085b6110aca56e`／draft | `f55381bf079bdbb5bed716e5c09a59a865fa62de`／draft | 補丁由 579 行縮為 `docs/custom.css`、`docs/docs.json` 兩檔 55 行。不採不變：上游官網導覽。 |
| #6890 | `e4bdfa3a45c38bcec354cc869813a8d4c8b20672`／open | `67e48cc71d7f2e3eb338c41bfd2b61a6a743abbf`／open | 舊 head 物件本地缺失，改讀新 head 完整補丁：8 檔 +1023，`commands/lambda.ts`、`cloudrun.ts`、`lambda/sam.ts` 與其測試、`cli.agentMode.test.ts`、`docs/packages/cli.mdx` 的整數旗標拒絕。延後不變：雲端路徑，本線不發佈。 |
| #6913 | `357ef9fc037f6100e5b1eb506ab48f9500ee0d0d`／open | `b14c5dd56aa252845e1f18a32034ba35c4287640`／open | 補丁新增／刪除行集合與前 head 相同（只 rebase）。延後不變。 |
| #6919 | `8d5201ba9d603b95ee7ae6d9b08da38773ea8f4d`／open | `8c73f86d0358e3bf78293ecc359e50f3d77f9dec`／closed | PR head 補丁（140 行）與 merge `3aaed65ef` 補丁行集合相同。已採用，重釘。 |
| #6928 | `e9c0b30f28ed635fee61db2d0099d4e67d514bb0`／open | `dec711d2277dfb675847ea20b49748cf055e3642`／closed | PR head 補丁（51 行）與 merge `e46ecd850` 補丁行集合相同；新舊 head 只差一個測試名稱。已採用，重釘。 |
| #6947 | `8bf6fd3684484a39a09462bdf03ce6a2869b889e`／open | `c948138fa8fa8c06eb4366bedb5667937300f51d`／closed | PR head 補丁（48 行）與 merge `f487a20b2` 補丁行集合相同；新舊 head 差異是 `RENDER_READY_WARNING_SUFFIX` 的引用方式。已採用，重釘。 |
| #6955 | `2f42de39e0962ce50aed8d337a5ec44f4e616e2f`／open | `4e7963cd4eec18c9ef071407e0b3749c1d88d8fc`／open | 補丁新增／刪除行集合與前 head 相同。延後不變。 |
| #6968 | `d4bd4f45303052da3c1896832de6fffdce4ea6da`／open | `62916ad7acfaeab31b0c5de9aa83231e91d54cf0`／open | 新增 `coreSkillContent.test.ts`、`packages/lint/src/rules/media.test.ts` 回歸，並把 lint 提示改為「在 `<video>` 保留 data-start、wrapper 不計時」（`media.ts`）。延後不變：技能文字與 lint 提示成組，本線尚未同步。 |
| #6972 | `dcc3da710cb6c7d0e9098813be2e4c911f44afce`／open | `194f9a6078c2be505db668d4a2b61a389c588455`／open | 補丁由 80 行增為 191 行：late 背景的回報改走 `CaptureSession.warnings`（`recordBackgroundDecodeTimeouts`）並對網址去憑證與 query，新增 drawElement 與 freshFallback 測試。延後不變，並成為 #7119 的前置。 |
| #6983 | `51da80f814398acff1ab3cf8345ffa8d0be99870`／open | `08896bea3af5ccd491a0fdddef5605574ea2a679`／open | 補丁增 6 行：`phaseDeg` 在 `motionBlurSettings.ts`、`filterTier.ts`、`tier.ts` 的傳遞，測試移到 `frames.test.ts`。延後不變：新增屬性，屬新功能。 |
| #6988 | `af4f85471b1690c33f5208d2b95d2eea8f284bf4`／open | `59d21b3a94d153b26968401d0fd0e52acffd2d45`／open | 安裝頁一個連結由文字改為下載連結（增 4 行）。不採不變。 |
| #7013 | `7e1587f1a5f67f701fa72ede95a9bf2d083865ef`／draft | `144e889627b97ba521920e31287321e2026a5059`／closed | PR head 補丁（505 行）與 merge `b2acef586` 補丁行集合相同；autoUpdate 部分已採用，skills release-tag 安裝延後（見 `b2acef586` 列與 `7cb6018c6`）。重釘。 |
| #7014 | `2987c132791bebda62cef5e5dd3303be02b698dd`／open | `2b10d2ecd31b548fa9b9f7b33b5cc189d6cdecbc`／draft | 新 head 捨棄舊版的 `readRegistryManifest` 與 catalog 非零退出測試，改在 `registry/transport.ts` 以 `RegistryUnreachableError` 處理，並加入 mirror TLS 失敗後仍重試 raw GitHub reset 的測試。延後不變：registry 讀取契約仍在改，本線 `registry/remote.ts` 維持。 |
| #7055 | `da542c363fb01019ef81ae6d1688452924c1130a`／open | `d72cdde7b90d75abbb9292b22045694bc621dee2`／open | `docs/custom.css` 的選擇器補上 `.text-primary`（Docs 下拉）並加註解。延後不變：純品牌外觀。 |

新增 8 筆 monitored：#7098、#7110、#7142、#7150、#7119、#7148、#7153（均 open）與 #7154（結束前合併，baseline 重釘為 closed）。皆為「合併後可獨立採用」或「前置合併才有意義」的條件追蹤；其餘未合併 PR 的裁決已寫在 PR 表，合併後會以 commit 進入審查，不另列 monitored。

### PR head 快照（2026-11-04）

| PR | Head | State |
| --- | --- | --- |
| #7078 | `84df6a6f69ad94f0b1a1ab010f2b0037eeaafe96` | closed |
| #7083 | `5fa3bcd27bb775a5cc54a214df426b423b0c44da` | open |
| #7085 | `728bccb99a688b7abc5341e7ce7a9bbef8ed6c03` | open |
| #7086 | `baa860ca28ee80db524aea361c3aad1aef64148a` | closed |
| #7089 | `db29935554cdb2864c7cbf1d3829e42ff14713c4` | open |
| #7090 | `7c427d42fbd31a2b50ead5c52c1d40913398a6d4` | open |
| #7091 | `ee4074bc1ed6f13be7966597c9749ec46ba79d22` | closed |
| #7094 | `81208743e9a75231d75bc09dafd51d03da5e4914` | merged |
| #7098 | `84ae6de21589e87ca8a4827ae292c9eff83d2f84` | open |
| #7099 | `d88ec54663889d5d64facc59f6e1565b5864eb50` | open |
| #7100 | `3918e7e5e8af51e7d4f45d49305905e8512cb167` | closed |
| #7102 | `b8f5ac1e895cf3c6d215d7b85619900831b17e8a` | merged |
| #7105 | `81bf9d1850c5919585f03a819f94f4d11b28f500` | closed |
| #7106 | `b7956377005ad8f1f7b087cbdd1ede73d6f700ca` | closed |
| #7107 | `51c2ec1c760cf71f3314e451e4cf6df8456054ff` | closed |
| #7108 | `d50d6c758ae0479d1124805fa2d31fb852b6eb08` | open |
| #7109 | `f8cf2a098984e801239ca88a8401f863528b547a` | closed |
| #7110 | `1e52c9020396c510dcb8b4ea5da5b6d465b47684` | open |
| #7117 | `743dad0b00238c23d73eced31e365d00f0847bd2` | closed |
| #7118 | `2eed09d5443d4c72d13d622fe2a5b27333f845e6` | closed |
| #7119 | `d5b7ede744fad5d72584655f7f9487edaeeefef8` | open |
| #7122 | `46cdf5ba8103479e54c837f33806bb3819f39e13` | closed |
| #7123 | `c6e8ed0cd68a628419b2c68416d96bc329a5cf79` | closed |
| #7124 | `4a4a4bef5ee1adcc5b40bc0f6e4747c693b5c944` | closed |
| #7125 | `0acf9ccc7a5a944b975e7badbc348a2760be56b4` | closed |
| #7126 | `f5441a7ae81f99855b3a7bb168fec2843b0f48a2` | closed |
| #7127 | `d5a8e304a1cc34fcab2e25a991af37ddc11b802d` | closed |
| #7129 | `80ded7c120dfb213ad93760d95a5490b22221d23` | closed |
| #7130 | `f83fafba73db6086e8f28de5a21eca7812c670b8` | open |
| #7131 | `4fd9ab24784ca232198dde6dadb4009e32a27c0b` | open |
| #7132 | `11ee5bb5890d69421187106c23d20a59dfeb670d` | open |
| #7133 | `68e22a63e82595561ab14f5cc57de9558a1e27a5` | open |
| #7134 | `44ea44d75be281f354ec31bfc045d6a68e0c47c0` | draft |
| #7135 | `15a19b98b0f7a9aab8e98b450c6d0c7f634ccb08` | draft |
| #7136 | `fae212e56715c73971057fe7a011b2c616577615` | draft |
| #7137 | `e295ce246eaa53338337bf4ef6409cd395b0d654` | draft |
| #7138 | `570d844fad370852f57ebd6c42373a18208be95b` | draft |
| #7140 | `02aa315572eead46572a92ae892afeb39f37ca11` | draft |
| #7141 | `58f6c3acb4c5c9961a609b9b0dd060e5f3efcd02` | draft |
| #7142 | `107e0f0a5e465ede2e3f34f94e9ff4f544a06ed5` | open |
| #7143 | `186df6622b15b8190bb9e8c19096457565d82962` | merged |
| #7144 | `0427e8f9a4849e23afb067aed346b41cd333d350` | merged |
| #7145 | `18bddeb42001a5a2179974e50a78febee18b5f08` | merged |
| #7146 | `96dc56344a0ae1d80e7abe2f0daa04a175a42498` | open |
| #7147 | `b6e10d732f52301fac6a6e8f4d1095c26bdcc69b` | open |
| #7148 | `cdc5c67d663b871bb8b3088f1e64d51427123c40` | open |
| #7149 | `88e5031c9d879362a189a35e619eeb7bcf8ea43b` | open |
| #7150 | `0e2396e4bbb9353d4bccb830f63b8280bfcc7429` | open |
| #7151 | `50d1403489f887e85ea88e12cd14f81783cc1d18` | merged |
| #7152 | `3d475ffba76688aeede2f38ce62d93e0d027eb49` | merged |
| #7153 | `f865c42d1caad67ca763c090d0536483d078f4d7` | open |
| #7154 | `38ec25c70c14734791c863094cf24e8b1e7a5eca` | open（快照取於合併前，之後已合併） |
| #7155 | `e6b9dadd2e82cef5cb18dcc39ac368e12994a83f` | merged |
| #7156 | `da80133fdaa1af9d92279388f0ee60b0ce33c84b` | merged |
| #7157 | `0348d528e76765f628329f1201b380113d25f5a4` | open |

### 採用與驗證

採用項與上游作者（Co-authored-by 用；email 見 git log）：#7143、#7151、#7155、#7154 皆為 Miguel Ángel。每項先把測試放到舊碼：

| 項目 | 舊碼 | 新碼 |
| --- | --- | --- |
| #7143（core `htmlBundler.nestedTimelines.test.ts`） | 1 failed／0 passed：timeline key 為 `["caption-style","caption-style"]` 而非 `take-a`／`take-b` | 1 passed；`src/compiler` 24 檔中 23 檔 650 passed，`pageBuild.golden.test.ts` 在並行載入下 2 例 5 s 逾時，單獨以 `--testTimeout=60000` 跑 4 passed（新舊程式碼各自對應各自的 golden 皆通過） |
| #7151（cli `utils/outputFolder.test.ts`；另補本線呼叫端回歸 `commands/motionShot.driveRoot.test.ts`） | 上游測試匯入失敗（無 `outputFolder.ts`）；呼叫端回歸 1 failed／1 passed（對已存在的資料夾 mkdir 回 EPERM） | 相關 18 檔 298 passed／2 skipped／0 failed（outputFolder、motionShot*、fileIds.windows、cloud/download、batchRender、compare、grade-compare、tts、render） |
| #7155（cli `cloud/errors.test.ts`、`upload.test.ts`） | 3 failed／23 passed | `src/cloud` 11 檔 132 passed／2 skipped／2 failed：失敗的是既有 `offload.undecodableTrack.test.ts`（ffmpeg 覆寫詢問），與本輪無關 |
| #7154（producer `captureCost.calibrationTimeout.test.ts`、`renderOrchestrator.pageNeverReady.test.ts`） | 3 failed／2 passed（`calibrationEvaluateTimedOut` 為 undefined；錯誤為 `CaptureStageError` 而非 `PAGE_NEVER_READY`） | 5 檔 18 passed／0 failed（含 `server.errorCode`、`server.notMediaErrorCode`）；`bun test src/server.test.ts src/server.errorCode.test.ts` 44 pass／0 fail |

另跑：`bun run --cwd packages/{core,cli,producer} build` 皆 exit 0；變更檔 `oxfmt`／`oxlint` 0 warnings／0 errors。`renderOrchestrator*`／`server*` 的 vitest 擴大跑 14 檔：406 passed／1 failed，失敗為 `renderOrchestrator.stall.test.ts`「retries a stalled attempt on fewer workers…」（expected Symbol(pending) to be 'completed'）；還原 #7154 的三個 producer 檔後單獨重跑同樣失敗，屬既有環境或時序失敗，不是本輪回歸。`server.test.ts` 是 bun 測試，vitest 載入會因 `bun:test` 失敗，改用 bun 跑通過。

已知本機失敗（與本輪修改無關）：`media.test.ts:99` 含 `?` 的 Windows 檔名、symlink EPERM（`assetResolution.test.ts:311`、`projectShaders.test.ts:85`）、`offload.undecodableTrack.test.ts` 與 `checkDeadline.process.test.ts` 的前述環境失敗；本輪沒有重跑 Windows render verification，不宣稱完整產品驗收通過。

### 水位與剩餘範圍

commit 連續區段 `19be35a46..1ff4cefd4`（10 個，兩端含）逐筆有證據，水位推進到 `1ff4cefd40c8dad98127fc78e8761c1ac62053dd`；PR 水位推進到 #7157（#7078–#7157 每筆有證據）；issue 維持 #7113。monitored 共 88 筆，19 筆重釘、8 筆新增（含已合併的 #7154 重釘為 closed）。收尾的 `python tools/check_upstream_updates.py --strict` exit 0：水位以上 0 個 commit、0 筆 PR、0 筆新 issue，88 筆釘選皆在審過的 head 與狀態。上游仍會繼續前進，下一次從 `1ff4cefd4`、PR #7157 接續；審查不代表整版同步或完整產品驗收。

## 2026-11-04：接續至 PR #7160，三筆新開 PR 全數釘選

起點為 fork `36d5dbc75`（`origin/main`），baseline 為 commit `1ff4cefd4`、PR #7157、issue #7113。起始 `python tools/check_upstream_updates.py --strict` exit 1：commit 與 issue 皆無新增，水位以上 3 筆新 PR（#7158、#7159、#7160），88 筆釘選皆在審過的 head 與狀態。三筆都是 open，沒有 merged 的獨立修正可移植，故本輪不改程式碼、不加測試；依前幾輪慣例釘在 monitored 並給條件式裁決。

`SHA:檔案:行號` 指 PR head 補丁（`gh pr diff --repo heygen-com/hyperframes`，唯讀）的 hunk 起始行；「本線」指 `36d5dbc75`。

### PR 裁決（PR 水位 #7157 → #7160）

| PR | Head | 作者 | 裁決與證據 |
| --- | --- | --- | --- |
| #7158 | `15f04db69abbc269face07ffce2e2812e2d0a0e3`（open，`cli.ts`、`cli.lifecycle.test.ts`） | Miguel Ángel | 同類缺陷在本線存在：`15f04db69:packages/cli/src/cli.ts:461` 把 `handleStreamEpipe` 的 `process.exit(0)` 改成依是否已交付決定 0 或 1；本線 `packages/cli/src/cli.ts:448-451` 仍是 `if (!isRenderSucceeded()) commandFailed = true; process.exit(0)`，被拒絕的 render 在 `\| head` 下回 exit 0。**條件式：合併後採用**，需手工適配本線的 `isRenderSucceeded()`（上游為 `isRunDelivered()`），並沿用其測試改法（`cli.lifecycle.test.ts:366-380`，EPIPE 在交付前預期 exit 1 且 `success:false`），先在舊碼紅燈再轉綠。未合併不移植。 |
| #7159 | `692f0e3c4f9df866bc6c5c2fd0ae1502da5b24aa`（open，8 檔 core runtime 與 studio store） | Miguel Ángel | 新功能：預覽健康訊息帶出卡住播放的媒體元素（`692f0e3c4:packages/core/src/runtime/playbackHealth.ts:18,43`、`init.ts:5900`、`types.ts:294`、`studio/.../previewQualitySlice.ts:148`）。本線 `playbackHealth.ts:12,87` 與 `previewQualitySlice.ts:15` 沒有對應欄位，也沒有使用者回報此缺口。**延後；條件式**：合併且本線出現預覽卡頓診斷需求時，再與 runtime 訊息型別一併評估。 |
| #7160 | `f543e3b9a91f2acb45db9231e5a8b5a1af860913`（open，15 檔，作者 Vitozhu04） | Vitozhu04 | 文案：skills 安裝與更新提示改為對人說（`f543e3b9a:packages/cli/src/commands/skills.ts:380,550,577`、`utils/skillsUpdateCheck.ts:113`、`commands/init.ts:690,977`、`commands/update.ts:153`）。本線沒有 `commands/update.ts`（`update` 指令與 skills 政策成組，已於 #7094、#7102 延後）；`skillsUpdateCheck.ts:107`、`init.ts:693,984` 的提示仍是原句，不影響行為。**延後；條件式**：#7094／#7102 的決定改為採用時一併審，合併後再看。 |

### 新增 PR head 快照

| PR | Head | State |
| --- | --- | --- |
| #7158 | `15f04db69abbc269face07ffce2e2812e2d0a0e3` | open |
| #7159 | `692f0e3c4f9df866bc6c5c2fd0ae1502da5b24aa` | open |
| #7160 | `f543e3b9a91f2acb45db9231e5a8b5a1af860913` | open |

### 水位與剩餘範圍

PR 水位推進到 #7160（#7158–#7160 每筆有證據）；commit 維持 `1ff4cefd40c8dad98127fc78e8761c1ac62053dd`，issue 維持 #7113。monitored 由 88 筆增為 91 筆（新增 #7158、#7159、#7160，既有項目未重釘）。審查不代表整版同步或完整產品驗收。

## 2026-11-05：接續至 `370f886aa`，移植 6 筆獨立修正

起點為 fork `b604b39eb`（`origin/main`），baseline 為 commit `1ff4cefd4`、PR #7160、issue #7113。起始 `python tools/check_upstream_updates.py --strict` exit 1：水位以上 77 個 commit、72 筆 PR（#7161–#7236，編號 #7193、#7200、#7204、#7223 是 issue 或空號）、3 筆 issue（#7193、#7204、#7223），91 筆釘選中 17 筆 head 或狀態變動。量太大，本輪只做**連續前綴**：commit 從 `b3b6a8116` 到 `370f886aa` 共 14 筆（上游順序第 1–14 個），PR 到 #7164，issue 不動。其餘（第 15 個 `fb738015a`（#7170）起的 63 個 commit、#7165 起的 PR、3 筆 issue）留待下一輪。

`SHA:檔案:行號` 指上游 commit 補丁（`git show`，唯讀）的 hunk 起始行；「本線」指 `b604b39eb` 的行號。每項程式修正先把上游測試（或本線改寫的測試）放到舊碼確認紅燈，再移植來源。

### Commit 裁決（14 筆）

| Commit | PR／作者 | 裁決與證據 |
| --- | --- | --- |
| `b3b6a8116` | #7158 Miguel Ángel | **採用**。`b3b6a8116:packages/cli/src/cli.ts:461` 的 `handleStreamEpipe` 依是否已交付決定 `process.exit(0 或 1)`；本線 `cli.ts:448-451` 無條件 exit 0，被拒絕的 render 在管線提早關閉時回 0。手工適配本線的 `isRenderSucceeded()`（上游為 `isRunDelivered()`），並同步標頭註解（`cli.ts:10`）。測試改自 `b3b6a8116:packages/cli/src/cli.lifecycle.test.ts:366-380`，本線位置 `cli.lifecycle.test.ts:322`。履行 ROADMAP 中期列「採用 #7158」，該列已刪。；差異：上游用 `isRunDelivered()`（含 #6659 的「非 render 指令已交付」判斷），本線因 #6659 於 10-29 延後，只能用 `isRenderSucceeded()`，所以成功的非 render 指令在交付後管線才關閉會回 1（上游回 0）；隨 #6659 採用時一併改回。 |
| `604a25fba` | #7160 Wenbo Zhu | **延後，條件不變**。純措辭（PR 自述 No behavior changes）：把 skills 安裝與更新提示改成「For the user:」對人說，目的是過上游發佈審查（DeltaVerdict D5）。`604a25fba:packages/cli/src/commands/update.ts:153`、`update.test.ts:202` 在本線不存在（沒有 `update` 指令）；`git apply --check` 對本線 `README.md:64`、`media-use/resolve.mjs:56`、`skillsUpdateCheck.test.ts:191` 失敗，其餘（`init.ts:690,977`、`skills.ts:380,550,577`、`bundled-sfx-provider.mjs:27`、`docs/quickstart.mdx:55`）可套。與 #7094／#7102（update 指令與 skills 政策成組延後）同一個決定；採用時整組一起做。 |
| `21f211919` | #7153 Tejashmakwana | **不採用**。`21f211919:README.md:11,23,327`、`ADOPTERS.md:12`、`docs/community/adopters.mdx:14` 只是把 Discord 邀請碼換成帶來源歸因的新碼，`docs/docs.json:1011,1074` 加頁尾與導覽列圖示；commit 內文自述「Every link already went to the new server」，舊碼本來就到同一伺服器，改碼只影響上游的加入來源統計。本線 README 與 `docs/docs.json:987` 不動；X／Instagram 連結的 #7148（`f333569f1`）在第 16 個 commit，下一輪一併裁決。前輪「合併後一次採用」的條件改為不採用，理由如上。 |
| `ac1948a88` | #7161 Miguel Ángel | **採用**。`ac1948a88:packages/engine/src/services/videoFrameExtractor.ts:412,558,1439,1481` 新增 `disk_full` 失敗種類，磁碟寫滿不再被歸為「影片壞了」且不再用軟體解碼重跑；`extractVideosStage.ts:262-284` 把它升為 `ENOSPC` 主機錯誤。本線 `videoFrameExtractor.ts:408,1275,1317` 與 `extractVideosStage.ts:253` 沒有該分支，磁碟滿時回 `ffmpeg_failed`。補丁原樣套用。 |
| `845bd638a` | #7163 Miguel Ángel | **採用**。`845bd638a:packages/producer/src/services/render/shared.ts:581-620`：拒絕符號連結的磁碟不論回什麼錯誤碼都退回 junction 再複製，只有 `ENOSPC`／`EDQUOT`／`EEXIST`／`ENOENT` 直接拋出。本線 `shared.ts:551-585` 仍只認 `EPERM`／`EACCES`／`UNKNOWN`，其他碼（`EISDIR`、`EIO`、`EINVAL`）直接失敗。補丁原樣套用。 |
| `0bbc9b294` | #7172 Miguel Ángel | **採用**。`0bbc9b294:packages/studio-server/src/helpers/sourceMutation.ts:431,490,536,584`：起點寫成另一個 clip 的名字（`data-start="b + 1"`）時，切割改用 studio 給的解析範圍，兩半都保留參照；本線 `sourceMutation.ts:448-456` 把參照起點讀成 0（`resolveElementTiming` 回 `timing.start ?? 0`），在 clip 真實時間內的切割被拒、之前的切割會把 clip 改寫成從 0 開始。本線的 `readClipTiming(...).startExpression` 與 `ReferenceExpression` 已由 `packages/parsers/src/compositionContract.ts:34,73,153` 提供；補丁因 import 區塊不同改手工套用，測試附在檔尾。 |
| `cd7b7383c` | #7169 WaterrrForever | **採用**。`cd7b7383c:packages/lint/src/rules/audioAttributes.ts:1-84` 新增錯誤 `audio_attribute_unreadable`，在 `hyperframes check` 就擋下缺 `"version": 1` 的 `data-automation`／`data-fx-chain`；本線 `packages/core/src/audioAutomation.ts:457` 的 render 會拋 `Unsupported automation version`，lint 沒規則（`media.ts:884` 的規則表無此項）。新增檔原樣，`index.ts:13`、`media.ts:19,887` 手工加入，`docs/reference/lint-rules.mdx`、`audio-effects.mdx:242,541` 同步，lint 套件 unpacked 預算 695173 → 737342（上游值）。CLI 預算上游同次調高，本線未量測 CLI 實際大小，不改。 |
| `04bc4737a` | #7171 Miguel Ángel | **採用**。`04bc4737a:packages/producer/src/services/renderOrchestrator.ts:1472-1500`：每個頁面都逾時載入（`Network.enable timed out`、`Navigation timeout`）時減半 worker 重試，單 worker 僅重試一次；本線 `renderOrchestrator.ts:1455` 只對 `protocol_timeout` 的 `Network.enable` 重試一次，且不降 worker 數。補丁原樣套用（該區塊搬到 transient 重試之前）。 |
| `d36cad798` | #7108 Vance Ingalls | **延後**。15 檔 +1860：`engine/src/services/__fixtures__/` 與四個 `captureMotionBlur.*.browser.test.ts`、`producer/.../blurDifferential.integration.test.ts` 用症狀釘住預設開啟的 capture blur 缺陷；另改 `ci.yml` 逾時 30 → 60 分鐘與 `run-test-lane.mjs`。本線只有 `captureMotionBlur.pixels.browser.test.ts`，沒有 `__fixtures__/motionBlur/`，而後續 commit（`aace91b5e` #6983、`aa34cffe4` #7190、`898d0fb00` #7191）會改同一批 `thresholds.ts` 與 `captureMotionBlur.differential.browser.test.ts`，尚未審。這批是 Chrome 像素測試，本機不能代跑；等 blur 修正審完再與其成組判斷。 |
| `b3dd76661` | #7146 Ular Kimsanov | **不適用**。`b3dd76661:docs/snippets/catalog-gallery.jsx:5,98,228`、`docs/catalog-gallery.css:17`、`scripts/generate-catalog-previews.ts:136,561`：catalog 卡片從即時播放器改為預先產生的循環小影片，需要上游文件站的預覽資產管線。本線 `docs/snippets/catalog-gallery.jsx` 仍是即時播放器，沒有對應資產。 |
| `986d7c680` | #7042 Ular Kimsanov | **不適用**。`986d7c680:docs/docs.json:1058,1066` 頁尾加「Made by HeyGen」、`docs/logo/dark.svg:1` 換單行標誌：上游品牌。本線 `docs/docs.json:1033` 仍是「Download the Studio app」。 |
| `7128dc059` | #6988 Ular Kimsanov | **不適用**。`7128dc059:docs/quickstart.mdx:19`、`docs/studio-app/index.mdx:11,30,46`：Studio app 下載卡片與 `hyperframes.studio/studio/download?src=docs-*` 歸因連結，本線 `docs/quickstart.mdx:22` 的說明文字不同且不推廣該 app。 |
| `71b67ccf4` | #7055 Ular Kimsanov | **不適用**。`71b67ccf4:docs/custom.css:503,1421` 純外觀（目前分頁的灰色膠囊）；本線 `docs/custom.css:506` 選擇器仍是舊樣式，不影響行為。 |
| `370f886aa` | #7164 WaterrrForever | **不適用**。`370f886aa:packages/cli/src/commands/templates.ts:31-58` 重釘五個付費樣式範本包的雜湊與大小，`skills/style-sampling/SKILL.md:9`、`references/remix.md:6` 改文案；本線沒有 `commands/templates.ts`、沒有 `skills/style-sampling/`，已於 `2daedcdaf` #6842 列為不適用。 |

### 先行移植（commit 水位之後，不推進水位）

這兩筆在上游順序第 20、22 個，在本輪連續前綴之外，但實查本線有同樣缺陷後一併移植；水位不超過它們，下一輪遇到這兩個 commit 時記為「已於本節移植」。

| Commit | PR／作者 | 證據 |
| --- | --- | --- |
| `3d78ac0fa` | #7179 Miguel Ángel | `3d78ac0fa:packages/core/src/runtime/init.ts:1027-1037`：尚未載入檔案的 `<img>` 量得高度 0，被補成 `height: 100%` 而拉伸到畫面底部；改為 `img` 不補尺寸。本線 `init.ts:1010` 有同樣的 `el.style.width = "100%"` 補尺寸。補丁原樣套用。 |
| `cffd70f2f` | #7173 Miguel Ángel | `cffd70f2f:packages/cli/src/commands/beats.ts:96,153`：沒有節拍的曲目回 exit 0 與 `count: 0` 的空結果，而不是錯誤。本線 `beats.ts:121` 仍 `fail("No beats detected …")`。本線的 `beats` 不接受單一音檔（`beats.ts:108` 導向 `hyperframes audio`），上游 `analyzeFile` 那一支不存在，只移植專案路徑；`docs/packages/cli.mdx:702` 同步。 |

### PR 裁決（PR 水位 #7160 → #7164）

| PR | Head | 作者 | 裁決與證據 |
| --- | --- | --- | --- |
| #7161 | `e9df2a72790ad729dbf415650de709e460aff832`（merged，`ac1948a88`） | Miguel Ángel | 採用，見 commit 表。 |
| #7162 | `4a239e553901ca26204be3d680fcf6da018b86d4`（closed，未合併） | heygen-rui-bot | `packages/cli/src/cloud/_gen/types.ts` +37 的 cloud client 重新產生，已關閉未合併，由後續 resync（#7207）取代。不適用：同 #7100 群，本線不同步生成型別。 |
| #7163 | `5b04fd6e616a99afbab048838e2190e48166ed1b`（merged，`845bd638a`） | Miguel Ángel | 採用，見 commit 表。 |
| #7164 | `01d646d450e28cbc7288c12d2e39cb6f340291aa`（merged，`370f886aa`） | WaterrrForever | 不適用，見 commit 表。 |

### 隨 commit 讀過補丁的 PR（PR 水位不動）

#7158、#7160、#7153 在水位以內，見 commit 表與下節 monitored。#7169、#7171、#7172 編號高於 #7164，PR 水位要等 #7165–#7168 審完才能越過它們。#7108、#7146、#7042、#6988、#7055 是更早編號 PR 的 merge。

### Monitored 重審

| PR | 前 head／state | 新 head／state | 補丁差異與裁決 |
| --- | --- | --- | --- |
| #7158 | `15f04db69abbc269face07ffce2e2812e2d0a0e3`／open | 同 head／closed（merged `b3b6a8116`） | head 未變，內容即 merge 補丁。已採用，重釘。 |
| #7160 | `f543e3b9a91f2acb45db9231e5a8b5a1af860913`／open | 同 head／closed（merged `604a25fba`） | head 未變。延後不變（#7094／#7102 成組），重釘。 |
| #7153 | `f865c42d1caad67ca763c090d0536483d078f4d7`／open | 同 head／closed（merged `21f211919`） | head 未變。不採用，重釘。 |
| #6988 | `59d21b3a94d153b26968401d0fd0e52acffd2d45`／open | 同 head／closed（merged `7128dc059`） | head 未變。不適用，重釘。 |
| #7042 | `4f1d7caa23ff64cffadd3c4d87c1005bf1aa91f9`／open | 同 head／closed（merged `986d7c680`） | head 未變。不適用，重釘。 |
| #7055 | `d72cdde7b90d75abbb9292b22045694bc621dee2`／open | 同 head／closed（merged `71b67ccf4`） | head 未變。不適用，重釘。 |
| #7142 | `107e0f0a5e465ede2e3f34f94e9ff4f544a06ed5`／open | `af8fbc6277db940e05ea8e80898a01d4f396d03d`／open | 目前 PR 補丁 5 檔（`gh pr diff 7142`）：`cli/src/browser/ffmpeg.ts:1,123` 新增 macOS 無 Homebrew 的提示（本線 `ffmpeg.ts:118-124` 只有 win32／linux 分支，Windows 不受影響）、`commands/init.ts:213,984,1223` 的 `missingRenderToolsWarning` 是前輪記錄的 `init.ts:215` 警告同一組改動。延後不變：合併後依 commit 採用，重釘新 head。 |

尚未重審、留待下一輪（head 或狀態仍與 baseline 不同）的 10 筆：#6695（open，新 head `21ab00f49`）；#6714、#6727、#6761、#6968、#7008、#7014（皆 2026-11-05 關閉未合併，原因待讀補丁）；#6972、#6983、#7148（已合併，分別在上游順序第 23、44、16 個 commit，審到該 commit 時一併重釘）。

### 採用與驗證

採用項與上游作者（供 Co-authored-by）：#7158、#7161、#7163、#7171、#7172、#7179、#7173 為 Miguel Ángel；#7169 為 WaterrrForever。

| 項目 | 舊碼 | 新碼 |
| --- | --- | --- |
| #7158（cli `cli.lifecycle.test.ts`） | 1 failed／14 passed：預期 exit 1，實際 0 | 15 passed |
| #7161（producer `extractVideosStage.test.ts`；engine `videoFrameExtractor.mediaEngine.test.ts`） | producer 1 failed／24 passed（沒有 `ENOSPC`）；engine 該檔在 win32 整檔 skip，改以暫存、移除 skipIf 的複本跑：2 failed（`ffmpeg_failed` 而非 `disk_full`；解碼次序 `[videotoolbox, null]` 而非 `[videotoolbox]`） | producer 25 passed；engine 暫存複本 8 passed／1 skipped（darwin 專屬），複本已刪；engine `videoFrameExtractor*` 8 檔 261 passed／24 skipped／0 failed |
| #7163（producer `windowsFrameStaging.test.ts`） | 3 failed／12 passed（`EISDIR`、`EIO`、`EINVAL` 拒絕連結時直接失敗） | 15 passed／1 skipped |
| #7171（producer `renderOrchestrator.test.ts`） | 1 failed／290 passed | 291 passed |
| #7172（studio-server `sourceMutationSplitAndGroup.test.ts`） | 3 failed／53 passed（另 2 例釘住既有行為，舊碼即綠） | 56 passed；`src/helpers` 44 檔 610 passed／3 failed／8 skipped，3 例為 `hfIdPersist.test.ts` 兩例的 `EPERM` rename 與 `undecodableAudioTrack.test.ts`，還原 #7172 來源後同樣失敗，與本輪無關 |
| #7169（lint `audioAttributes.test.ts`、core `audioAttributeLintParity.test.ts`） | lint 測試檔因 `./audioAttributes.js` 不存在而無法載入；parity 在規則存在但 `packages/lint/dist` 未重建時 `audioAttributeShapeError is not a function`（vitest 走 `node` 條件取 dist） | `bun run --cwd packages/lint build` 後 parity 17 passed；lint 套件 24 檔 1236 passed／1 failed，失敗為既有 `projectShaders.test.ts` 的 symlink `EPERM` |
| #7173（cli `beats.test.ts`） | 1 failed／21 passed | 22 passed |
| #7179（core `runtime/init.test.ts`） | 1 failed／260 passed | 261 passed |

### 水位與剩餘範圍

commit 連續區段 `b3b6a8116..370f886aa`（14 個，兩端含）逐筆有證據，水位推進到 `370f886aa953c897906f97896e67229c19fd41a8`；PR 水位推進到 #7164（#7161–#7164 每筆有證據）；issue 維持 #7113。monitored 維持 91 筆，其中 6 筆重釘為 closed、1 筆（#7142）換新 head。收尾的 `python tools/check_upstream_updates.py --strict` 仍 exit 1：水位以上 65 個 commit（63 個為起始檢查時已有，另 2 個是之後新進）、#7165 起的 70 筆 PR、3 筆 issue，以及上述 10 筆未重審的 monitored。下一次從 `370f886aa` 之後的 `fb738015a`（#7170，36 檔 bug bash，含本線有的 `check.ts`、`studioServer.ts`、`desktopApp.ts`、`auth/client.ts`，也含本線沒有的 `templates.ts`、`avatars.ts`）與 PR #7165 接續。審查不代表整版同步或完整產品驗收。

## 2026-11-05：接續至 `06722eb9b`，拆分 #7170

起點為 fork `9f61d82cec20f6630628520da41343f78177592a`，工作樹乾淨。起始 `python tools/check_upstream_updates.py --strict` exit 1，上游快照 `b7d72c947`；只處理連續前綴 `fb738015a`、`f333569f1`、`06722eb9b`，不越過下一筆 `cba66f20a`（#7165）。PR 軸沒有連續處理 #7165 以後的全部項目，因此保持 #7164；issue 軸逐筆讀完 #7193、#7204、#7223。

以下上游 `SHA:檔案:行號` 為實際 `git show` 補丁的 hunk 行號；本線為移植後檔案行號，未改處以起點 HEAD 為準。PR 由 `gh pr view/diff --repo heygen-com/hyperframes` 唯讀取得，closed 與 merged 分開判定。

### Commit 裁決（連續 3 筆）

| Commit                                     | PR／作者              | 裁決與證據                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fb738015a03c7636566f4a6878768bd5755cf3ef` | #7170／WaterrrForever | **部分採用，其他部分按下表分流**。補丁共 36 檔，按下表逐項比對實際內容；不把缺少模組的新功能當獨立修正帶入。                                                                                                                                                                                                        |
| `f333569f160116ee8691b2ed9ac2bc981e45c973` | #7148／Ular Kimsanov  | **採用**。`f333569f1:docs/docs.json:1012` 將 X 指到 HyperFrames 帳戶並移除 HeyGen Instagram；本線 `docs/docs.json:985` 保留 GitHub、作者與官方連結，只更新既有 socials。JSON 可解析；無產品行為變更，無需紅綠測試。                                                                                                 |
| `06722eb9b90834beee636d1a9d41cd22452bd7fd` | #7175／發行提交       | **不適用**。21 檔完整補丁為套件／plugin 版本更新與 v0.9.13 發行記錄（`06722eb9b:packages/cli/package.json:3`、`docs/changelog.mdx:11`、`releases/v0.9.13.md:1`）；本線 `packages/cli/package.json:3` 與 `docs/changelog.mdx:11` 保持 fork 原有版本／產品範圍。只採部分修正不能宣稱整版發行，亦不解除 npm 發布守衛。 |

### #7170 分項裁決與適配

| 部分                                             | 上游證據                                                                                                                                          | 本線證據與裁決                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 帳戶與 token endpoint 的 timeout／錯誤診斷       | `fb738015a:packages/cli/src/auth/client.ts:133`、`auth/oauth.ts:371`、`utils/networkFailure.ts:1`                                                 | **採用**。`auth/client.ts:137` 的 GET、`auth/oauth.ts:386,413,519` 的 refresh／code exchange 共用 15 秒 AbortSignal 與 transport 診斷。保留本線既有 OAuth persist／refresh 所有權規則，不搬上游 `refreshOnce`／single-flight 前置鏈。`commands/auth/status.ts:156` 只補 NetworkFailure 的 cached user／api_error 表達；本線 `status.ts:83` 無主動 `refreshIfNeeded`，故上游 `status.ts:163` 的主動 refresh 短路不適用。                                  |
| check 在可載入 composition 時仍跑 browser audits | `fb738015a:packages/cli/src/utils/checkPipeline.ts:1659,1691`、`commands/check.ts:654`                                                            | **採用管線判定**。本線 `checkPipeline.ts:1658,1690` 僅 root 缺 composition id 才略過，其他 lint error 仍失敗但保留 browser findings。`commands/check.ts:638-642` 本線只有通用 skipped 訊息，沒有上游 `browserSkippedLine` helper，保留既有輸出介面；`docs/packages/cli.mdx` 與 CLI skill reference 同步新語義。                                                                                                                                          |
| preview 啟動不寫來源 HTML                        | `fb738015a:packages/cli/src/server/studioServer.ts:434,449`、`studioServer.openWritesNothing.test.ts:36`                                          | **採用**。本線 `studioServer.ts:467,482` 在 watcher 前建立 state folder，移除啟動的 `stampProjectHfIds`。沿用 `studioServer.stampOnOpen.test.ts` 原檔名改測新契約，不刪既有檔案；同時驗證 preview 的記憶體 IDs 與真正編輯存檔時的 IDs。                                                                                                                                                                                                                  |
| cloud aspect 與 4K preset 相容性                 | `fb738015a:packages/cli/src/commands/cloud/render.ts:463,541,577`、`render.test.ts:229,279`                                                       | **採用**。本線 `cloud/render.ts:240,492,535,571` 接受 W:H、1080p 保留 authored 尺寸，4K 在上傳前用 core `checkOutputResolutionCompatibility` 拒絕近似比例但不合 preset 的尺寸。保留本線 `page-motion-blur` 與 resolved entry error 診斷；補上本線缺少的 `failUsage` import。同步 CLI 文件、cloud skill reference 並依本線內容重生 manifest，不複製上游 hash。                                                                                            |
| registry cause-chain helper 搬移                 | `fb738015a:packages/cli/src/registry/remote.ts:183`、`remote.test.ts:328`                                                                         | **採用**（fallow 重複碼閘門逼出）。`registry/remote.ts:2` 改 import `utils/networkFailure.ts` 的 `describeCauseChain`，移除本地副本與 `remote.test.ts` 的重複測試（上游同改，測試移到 `networkFailure.test.ts`）；無其他 importer。另：`checkPipeline.ts:1658 leavesNothingToLoad` 改為非 export（僅本檔使用），`networkFailure.ts:65 fetchExplained` 加 `fallow-ignore-next-line unused-export`（上游 pull／avatars 呼叫端本線尚無）。                                                                                                                                                                                                                                                                                               |
| desktop hint 的 CI／pipe 過濾                    | `fb738015a:packages/cli/src/utils/desktopApp.ts:249`、`attendedTerminal.ts:5`                                                                     | **延後，需先有正確的 agent-only 分辨契約**。本線 `desktopApp.ts:243` 尚無此篩選；`telemetry/agent_runtime.ts:244` 只有使用 process.env 的 `detectAgentRuntime`，沒有上游 `isAgentDriven(env)` 與 `agentOnly` 規則，`attendedTerminal.ts:1` 也無 `isCI(env)`。不能以「偵測到編輯器」代替「代理正在驅動」，否則 pipe 下誤印提示。整組前置契約同步並驗證 CI／pipe／代理三種情境後採用。                                                                     |
| SFX 分數、名稱弱匹配與 miss 提示                 | `fb738015a:packages/cli/src/media-use/lib/sfx-provider.mjs:6`、`lib/heygen-search.mjs:44`、`lib/match.mjs:48`、`resolve.mjs:385,1309`             | **延後**。本線 `lib/sfx-provider.mjs:5` 只有 Openverse，沒有上游 `heygenSfxProvider`／`heygen.audio.sounds` 鏈；`resolve.mjs:370,1275` 亦無 match advisory。最小整合測試尚未執行到斷言即因本線 `lib/tts-local-provider.mjs:6` 匯入不存在的 `audio/scripts/lib/tts.mjs` 失敗；乾淨 HEAD 同樣失敗。先補齊媒體 provider／可執行的整合測試，再同步分數與 cached advisory，避免只改提示造成 provider 來源宣稱不實。試加測試已還原，沒有把載入失敗當功能紅燈。 |
| templates pull 清理、avatars 列表與對應文件      | `fb738015a:packages/cli/src/commands/templates.ts:178,190`、`commands/media-use/avatars.ts:1`、`heygen/avatars.ts:1`、`docs/packages/cli.mdx:656` | **不適用於現有模組集合**。本線 `commands/media-use.ts:1` 沒有 `generate`／`avatars` 子命令鏈，也無 `commands/templates.ts`、`heygen/avatars.ts`、`measure/command.ts`。不引入原本延後的 hosted templates／帳戶媒體功能；將來正式採用這些模組時一併帶入 owner marker、stdin tar 與 private looks 授權測試。                                                                                                                                               |

### Monitored 重審（數量仍為 91）

| PR    | 新 head／state                                             | 證據與裁決                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #6695 | `21ab00f493542234d31d8d74095f49419b34b3ea`／open           | 讀完整補丁：`21ab00f49:packages/cli/package.json:70`、`packages/engine/package.json:112` 加直接 undici 7.30.1，`bun.lock:2135` 更新實體並夾帶 workspace 版號重排。本線兩份 package.json 沒有直接 undici；`bun.lock:2145` 為 jsdom 的傳遞依賴。**仍觀察，不採未合併 PR**；合併後只評估安全依賴鏈，不搬夾帶版號，重釘新 head。                                                 |
| #6714 | `4f09b98040af846cfdd727975876befe8bf8b0b7`／closed，未合併 | `4f09b9804:packages/core/src/beats/beatFile.ts:105,136` 與本線 `beatFile.ts:116` 的唯一未標記 audio fallback 差異仍在。維護者 [關閉說明](https://github.com/heygen-com/hyperframes/pull/6714#issuecomment-6648721033)：衝突，若仍需要會開新 PR。**不移植未合併修正**，條件改為新的 merged 替代案；重釘 closed。                                                              |
| #6727 | `ffabeb89a464fcc2d5bb3fac0037550c77da8f65`／closed，未合併 | `ffabeb89a:packages/cli/src/utils/project.ts:55` 改 accessSync 分辨錯誤碼；本線 `project.ts:58` 仍使用 existsSync。維護者 [關閉說明](https://github.com/heygen-com/hyperframes/pull/6727#issuecomment-6648722044)：Windows 紅燈且未審。**不移植**；有 merged 替代案且 Windows 權限負例可驗證才重訪，重釘 closed。                                                            |
| #6761 | `6929fdaaea4e669f3abc69420f6f08f3064c21cc`／closed，未合併 | `6929fdaae:packages/engine/src/services/frameCapture.ts:5498` 在 truth screenshot 前等 LUT；本線 `frameCapture.ts:5454` 的 self-verify 與 `:3331` 的正常擷取 wait 為不同路徑。維護者 [關閉說明](https://github.com/heygen-com/hyperframes/pull/6761#issuecomment-6648722593)：檔案已變動。**不移植**；新的 merged 補丁與 Windows LUT fixture 能證明差異時重訪，重釘 closed。 |
| #6968 | `62916ad7acfaeab31b0c5de9aa83231e91d54cf0`／closed，未合併 | `62916ad7a:packages/lint/src/rules/media.ts:646`、`skills/hyperframes/SKILL.md:24` 對應本線 `media.ts:646` 的舊提示。維護者 [說明](https://github.com/heygen-com/hyperframes/pull/6968#issuecomment-6650248034) 已由 merged #7210 取代。**本 PR 不移植**，替代案由 commit 軸逐筆處理，重釘 closed。                                                                          |
| #7008 | `86188c1bb023c413ee67d20ac8b5d987f2393f05`／closed，未合併 | 補丁為 `86188c1bb:.github/workflows/windows-render.yml:237` 與 `packages/player/tests/perf/windows-dropped-frames.ts:1` 的診斷，不改播放。本線 `.github/workflows/windows-render.yml:88` 保持現有 render 驗收。維護者 [說明](https://github.com/heygen-com/hyperframes/pull/7008#issuecomment-6648718816) 診斷 draft 已無需求，**不採用**，重釘 closed。                     |
| #7014 | `2b10d2ecd31b548fa9b9f7b33b5cc189d6cdecbc`／closed，未合併 | `2b10d2ecd:packages/cli/src/registry/transport.ts:29` 的 CDN-first／4 秒 fallback 不在本線 `transport.ts:32`。維護者 [說明](https://github.com/heygen-com/hyperframes/pull/7014#issuecomment-6648720467) 為過期 draft；body 另明確要求 mirror 200 且內容一致。**不移植**，保留既有 #7015 catalog 錯誤行為；新 merged 案與 mirror 一致性證據齊備再重訪，重釘 closed。         |
| #7148 | `1c9000cb6a529667400f0137add4d5d233f1a28e`／closed，已合併 | head 補丁 `1c9000cb6:docs/docs.json:1012` 與 `f333569f1` 一致，本線 `docs/docs.json:985` 已採用，重釘 closed。                                                                                                                                                                                                                                                               |

#6972、#6983 不重釘：相應 merge commit 尚在連續水位之外。#7173、#7179 的既有先行移植保持不動；到達各自 commit 時再記已移植，不重複套用。

### Issue 裁決

| Issue           | 唯讀證據                                                                                                                                                                                                   | 本線與裁決                                                                                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #7193（open）   | [issue 原文](https://github.com/heygen-com/hyperframes/issues/7193)：audio＋setter tween 使 volume probe 提前讀到 hidden，preview 6.5 秒與 render 不同；建議 probe sweep／restore 期間 lift hidden sheet。 | 本線 `packages/core/src/runtime/init.ts:2735` 呼叫 probe，`mediaVolumeEnvelope.ts:283` 負責 seek；`init.ts:5258` 的 showHiddenClips 尚只在其他 seek 路徑。**記錄可疑同類路徑，不宣稱已重現或修好**；merged 修正需有 volume probe／first-pass 回歸及 Windows preview/render 同幀證據再採用。 |
| #7204（open）   | [issue 原文](https://github.com/heygen-com/hyperframes/issues/7204)：請求 single-stem 輸入與無法傳旗標的 host 可用的 no-stems 說明，並非已合併修正。                                                       | 本線 `packages/cli/src/audio/read/read.ts:77,87,224` 確有 stemsFor 與該提示。**功能提案觀察**；等 merged 輸入契約、音樂／效果來源斷言與文件齊備，不擅自發明 `--stem`。                                                                                                                      |
| #7223（closed） | [issue 原文](https://github.com/heygen-com/hyperframes/issues/7223)：GSAP 同一 scale 的 set＋重疊 tween，1／8 workers 的 59／90 frames 不同。關閉狀態不代表 fork 已修復。                                  | 本線 `packages/core/src/runtime/init.ts:1571` 仍有 producer stand-in timeline；該報告與既有 #7111 的畫格確定性驗收相關。**保留條件式風險**；沿 commit 軸審對應修正，以離線 1／多 workers 及反向 seek RGBA 作驗收，不套不曾驗證的 workaround。                                               |

### 採用與驗證

程式採用均來自 #7170，作者 WaterrrForever；社群連結 #7148 作者 Ular Kimsanov。Co-authored-by 的 email 僅由 Git commit metadata 提供給提交者，不寫入本文件。

| 驗證                         | 舊碼／乾淨 HEAD                                                                                                                                                                                                                                                                   | 移植後                                                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #7170 初次 6 檔 focused      | 12 failed／217 passed／1 skipped；另 networkFailure 新檔尚不存在造成 1 suite 載入失敗。功能紅燈包括 auth GET timeout／DNS、check browser、preview HTML、cloud 4K；desktop 測試曾重現但因前置契約不足還原，不列入交付。                                                            | 7 檔（auth client、oauth、status-user、check、cloud render、networkFailure、preview）256 passed／0 failed。                                                                       |
| OAuth refresh 的本線適配測試 | 1 failed／42 passed：原始 TypeError，無 NetworkFailure。                                                                                                                                                                                                                          | 包含於上述 focused 綠燈，測 common token-endpoint helper 的 timeout／錯誤型別。                                                                                                   |
| auth status 的本線適配       | 還原 status.ts 舊碼，1 failed／5 passed：NetworkFailure 未轉為 api_error。                                                                                                                                                                                                        | 包含於上述 focused 綠燈，保留 cached identity。                                                                                                                                   |
| CLI build                    | 不適用                                                                                                                                                                                                                                                                            | `bun run --cwd packages/cli build` exit 0，ESM／DTS build success。                                                                                                               |
| 產品 Quick                   | 乾淨 `9f61d82ce`（`git status --porcelain` 空）focused：parsers 33 passed／1 failed／1 skipped；lint 3 passed／1 failed，均 symlink EPERM。                                                                                                                                       | `pwsh -NoProfile -File tools/test_product.ps1` exit 1：parsers 1367 passed／1 failed／7 skipped／3 todo；lint 1236 passed／1 failed，失敗同為 symlink EPERM。不能算完整產品綠燈。 |
| media-use 既有載入失敗       | 乾淨 `9f61d82ce` 執行 `node --test --test-name-pattern="a project sound found by one shared word" packages/cli/src/media-use/resolve.test.mjs`，exit 1：ERR_MODULE_NOT_FOUND，tts-local-provider.mjs 匯入不存在的 audio/scripts/lib/tts.mjs；尚未到 name pattern 篩選或測試斷言。 | 試加的 name advisory 測試還原，未移植該部分；不把此失敗算成紅綠回歸。                                                                                                             |

只推進有上述裁決的連續前綴；產品水位與審查水位不同，完整產品驗收仍受 Quick 的既有平台失敗限制。最新 strict 結果集中記於本節收尾，其他文件只連到這裡。

交付擴大驗證：`bun run --cwd packages/cli test src/auth src/commands/auth src/commands/check.test.ts src/commands/cloud/render.test.ts src/utils/networkFailure.test.ts src/server/studioServer.stampOnOpen.test.ts` exit 0，18 檔 397 passed／1 skipped／0 failed。`pwsh -NoProfile -File tools/dev_check.ps1` exit 0：compileall／Ruff 通過，39 passed／0 failed，相對連結 12 份文件、0 錯誤，結尾 `WINDOWS DEV CHECK GREEN`。變更程式 oxlint 0 warnings／0 errors；Markdown 與變更檔已執行 oxfmt，skills manifest 依本線重生。

### 收尾 strict 快照（該水位的歷史快照）

`python tools/check_upstream_updates.py --strict` exit 1，固定上游 tip `b7d72c947`：commit 水位以上 69 筆、PR #7165 起 84 筆、issue #7223 以上 0 筆、91 筆 monitored 中 2 筆移動（#6972、#6983）。這是 checker 的水位缺口，包含水位外已先行採用的 #7173／#7179，以及額外讀過但未形成 PR 連續前綴的項目；不冒充全數未讀或 strict 綠燈。下一個 commit 是 `cba66f20a`（#7165），不跨缺口推進。ROADMAP 的接續列保留。

## 2026-11-06：接續至 `15b1de4ae`，移植 #7165／#7168／#7166 與先決修正

起點為 fork `2f575f082`（`origin/main`），baseline 為 commit `06722eb9b`、PR #7164、issue #7223。前一個 Codex 工作階段在額度耗盡時留下 #7165 的未提交移植；本輪先逐檔對上游 `cba66f20a` 核對：新增 8 檔與 4 個修改檔的變動行與上游**完全一致**，再補紅綠。只處理連續前綴：commit 上游順序第 1–24 個（`cba66f20a` 到 `15b1de4ae`），PR 水位 #7164 → #7189，issue 不動。第 25 個 `aace91b5e`（#6983）起留待下一輪。

`SHA:檔案:行號` 指上游補丁；「本線」指 `2f575f082` 的行號。

### Commit 裁決（24 筆）

| Commit | PR／作者 | 裁決與證據 |
| --- | --- | --- |
| `cba66f20a` | #7165 Miguel Ángel | **採用**。`cba66f20a:packages/cli/src/cloud/fontPreflight.ts:78` 的 `embedSystemFonts` 讓雲端 render 把專案用到的系統字型打包進 zip、找不到時在上傳前停下；`core/src/fonts/sfntNames.ts:100 extractSfntFace` 與 `systemFontLocator.ts` 依檔內 family 名找 `.ttc` 單一 face。本線 `deterministicFonts.ts:779` 只以檔名找、整個 `.ttc` 原樣嵌入；`cloud/render.ts:664` 暫存後直接上傳。未提交移植與上游逐行一致，補測試紅綠後採用。 |
| `d4e4b07e3` | #7168 WaterrrForever | **分項採用**，見下節。 |
| `3d78ac0fa` | #7179 Miguel Ángel | **已於 `9f61d82ce` 先行移植**，不重複套用（`git apply --check` 因已存在而失敗，內容一致）。 |
| `2679bcdee` | #7180 Miguel Ángel | **不適用**。`2679bcdee:.github/workflows/ci.yml:980`、`packages/studio/tests/e2e/perf-ceilings.json:2` 是上游 Linux 的 studio 視窗閘門釘 Chrome 版本；本線 `ci.yml` 是 Windows-only，補丁無法套用。 |
| `cffd70f2f` | #7173 Miguel Ángel | **已於 `9f61d82ce` 先行移植**。 |
| `73e65e2c7` | #6972 Miguel Ángel | **採用**。`73e65e2c7:packages/engine/src/services/frameCapture.ts` 讓永遠不完成解碼的背景圖逾時並報告（URL 去憑證、去 query），不再卡住整格；本線 `frameCapture.ts:457 decodeDynamicCssBackgroundImages` 無逾時，卡死時整格停住。補丁原樣套用。 |
| `00ea86570` | #7184 Miguel Ángel | **採用**。`00ea86570:packages/cli/src/utils/projectLock.ts` 等待專案鎖數秒後印出持有者，逾時訊息說「再執行一次」；本線 `projectLock.ts:74` 靜默等待。補丁原樣套用。 |
| `be8122d0c` | #7183 Miguel Ángel | **採用（手工適配）**。`be8122d0c:packages/cli/src/utils/checkPipeline.ts:758` 新增 `craftStride`，craft 取樣在慢速時變稀、步幅上限 12、預算 90 秒；本線 `checkPipeline.ts:760` 逐格取樣無預算。因本線 `seekGeometry(time)` 沒有 `{ draws: true }` 參數，hunk 無法機械套用，改手工加入同樣的迴圈與常數。 |
| `21e203859` | #7186 Miguel Ángel | **不適用**。`21e203859:packages/cli/src/heygen/reverse.ts`、`reverse.test.ts` 在本線不存在（沒有 reverse 指令）。 |
| `c6f87f59b` | #7182 Miguel Ángel | **延後**。`c6f87f59b:packages/studio-server/src/helpers/proxyTranscoder.ts:694,928,1153` 與測試需要上游的長來源分段複本（`PIECE_SECONDS`、`proxyWindowSeconds`、`limitSeconds`）；本線 `proxyTranscoder.ts` 沒有這套，`git apply --reject` 在 `checkBrowser.ts:1,168,186`、`checkPipeline.ts:3`、`proxyTranscoder.ts` 與其測試共 8 個 hunk 失敗。試套的乾淨檔案已全數還原。條件：先同步分段複本或另寫適配後成組採用。 |
| `2f321e0b0` | #7187 Miguel Ángel | **不適用**。同 #7180（`ci.yml:981`、`perf-ceilings.json:2`）。 |
| `c3eb05254` | #7131 Ular Kimsanov | **不適用**。`c3eb05254:README.md:27,37`、`docs/faq.mdx:20` 是 HeyGen Studio app 的免費／Pro 方案行銷與價格；本線 README 不推廣該 app，`git apply --check` 於 `README.md:27` 失敗。 |
| `97b805dcb` | #7132 Ular Kimsanov | **採用（文件）**。`97b805dcb:docs/packages/cli.mdx:1145` 把 `open` 交接改為「macOS、Windows、Linux 都可」。本線 `packages/cli/src/utils/desktopApp.ts:122-127,198-205` 已有 win32／linux 的啟動路徑，`docs/packages/cli.mdx:1071` 仍寫「僅 macOS」，文件落後於程式；`docs/studio-app/edit-with-the-agent.mdx:66` 同步移除已隱藏的加入轉場按鈕。補丁原樣套用。 |
| `054cf4f11` | #7133 Ular Kimsanov | **不適用**。`054cf4f11:docs/docs-menu-label.js:1` 是上游文件站導覽按鈕的自訂腳本，與 #7146／#7055 同類（文件站外觀）。 |
| `b2b034fcd` | #7147 Ular Kimsanov | **不適用**。`b2b034fcd:docs/snippets/catalog-gallery.jsx:251`、`docs/catalog-gallery.css:79` 的搜尋框建在上游 catalog 卡片版面上，補丁在本線失敗；與 #7146 同類。 |
| `2ac011422` | #7188 Miguel Ángel | **與 #7189 淨零**。移除 OpenRouter vision provider，隨即被 #7189 還原。 |
| `af0c815c7` | #7166 Miguel Ángel | **採用**。`af0c815c7:packages/core/src/fonts/deterministicFonts.ts` 讓 `var()` 簡寫、`font-X-400` 形式的 class 名稱不再讓 fail-closed 雲端 render 失敗；`packages/producer/src/services/htmlCompiler.ts:1751 projectStylesheetFontFamilies` 讀專案自帶的 `@font-face` 樣式表（只讀 family 名、不抓取）並先內嵌遠端字型表。本線 `htmlCompiler.ts:2179` 沿用先抓後查，專案樣式表字型會被判為未解析。前置：#6665、#7168 的簡寫解析（見下）。import 區塊 hunk 因本線已有 `readFileSync` 而不需套用。 |
| `60ca970ed` | #7185 Miguel Ángel | **不適用**。`60ca970ed:packages/cli/src/commands/billing.ts` 本線沒有 billing 指令。 |
| `4d9a4e4e8` | #7189 Miguel Ángel | **與 #7188 淨零**。`git diff 2ac011422^ 4d9a4e4e8 -- packages/cli/src/capture/contentExtractor.ts` 只剩一段註解改寫；本線 `contentExtractor.ts:248-299` 一直保留 OpenRouter，無需動。 |
| `fa318d972` | #7178 Michael Wang | **不適用**。`fa318d972:packages/cli/src/utils/sourceTag.ts:1` 為連結加上來源歸因（`README.md:17`、`docs/docs.json:326` 等），只影響上游流量統計，與 #7153 同判斷。 |
| `b503e5509` | #7176 Michael Wang | **延後**。`b503e5509:scripts/check-core-skills.mjs:11` 與各 `skills/*/SKILL.md` 要求每個技能回報自己的執行，屬遙測；與 #6839 同條件（先決定遙測政策）。 |
| `a6e6717f2` | #7177 Michael Wang | **不適用**。`a6e6717f2:packages/cli/src/commands/billing.ts`、`reverse/start.ts`、`templates.ts`、`heygen/plan.ts` 本線皆不存在。 |
| `bd6cff815` | #7196 James Russo | **採用（文件）**。`bd6cff815:docs/guides/skills.mdx` 說明 `skills update <repo>` 被當成技能名的錯誤與 YAML 修復；本線 `commands/skills.ts:29` 的 `hyperframes skills update` 行為與文件一致（核心集合加已安裝者）。補丁原樣套用。 |
| `15b1de4ae` | #7192 發行提交 | **不適用**。v0.9.14 版本與發行記錄（21 檔），同 `06722eb9b`：不宣稱整版發行。 |

### #7168 分項裁決與適配

| 部分 | 裁決與證據 |
| --- | --- |
| effect scan 與 session 開啟逾時 | **採用，本線適配**。`riskFrames.ts` 新增 `withinBudget`（`d4e4b07e3:riskFrames.ts:65`），一個 chunk 超過 120 秒預算即回 null 改走截圖，而不是等 CDP 協定逾時（最長 30 分鐘）；`captureStreamingStage.ts` 的效果畫格 session 開啟與 session 初始化各有自己的 60／300 秒無進度視窗，遲到才開好的 session 會被關閉。上游「逾時後在新 session 重試」依賴 #7104 的 sequential resume 迴圈，本線已延後（見 2026-11-04 清冊），所以這裡逾時直接以 `SequentialCaptureStallError` 失敗，與本線其他 sequential 停滯一致。先決：#6697（`e1a8c7f17`，`ScanOptions`／budget／progress）補丁乾淨套用，一併採用。 |
| 一次只跑一個本機 render | **採用，本線適配**。新增 `utils/renderLock*.ts`、`commands/render/renderSlot.ts`、`--wait/--no-wait`、`HYPERFRAMES_RENDER_LOCK=off`，文件寫入 `docs/packages/cli.mdx`。本線 `execute.ts` 自己解析 variables，故 `executeHeldRender` 保留原順序，並把註記拆成 `reportSingleRenderNotes`（fallow 複雜度閘門逼出）。先決：`@hyperframes/core/cache-dir`（#6716）——只採其 helper（`cacheDir.ts`＋exports＋2 個單元測試），**不採** 17 檔的路徑遷移與全套 guard 測試（該測試對本線 17 個檔失敗），遷移延後，仍須對齊 Windows 私有快取根。 |
| lint 的字型簡寫與 `font_face_local_only` | **採用**。`parsers/src/fontShorthand.ts`（含 spaced `/ line-height`、`var()` 規則）、`lint/src/rules/fonts.ts`、`docs/reference/lint-rules.mdx`、`skills/hyperframes/references/format.md`。先決：#6665（`67c7ec27d`，核心字型簡寫與 linked stylesheet）原樣套用。**更正**：原先「不採 3 個黃金輸出」是錯的——該 PR 的字型簡寫修正讓 `font: 120px "DejaVu Sans"` 這類宣告開始內嵌字型，編譯結果改變（`gradient-text-layered-child` 的 `compiled.html` 2468→170510 位元組），上游因此重產了 `gradient-text-layered-child`、`distributed/plan-v2-partial-color`、`distributed/static-volume-future-set` 三組 `output/{compiled.html,output.mp4}`。只採程式碼不採黃金輸出，使 `regression` 在 `04d8d2ccb` 失敗（run 42086224464 shard-7，`gradient-text-layered-child` PSNR 22.25）。已改為採用這 3 組 LFS 黃金檔（自上游 `67c7ec27d` 取指標與物件，未在本機重產）。驗證：本機編譯三個 suite，前兩者與採用的 `compiled.html` 逐位元組相同，第三者（`static-volume-future-set`）因 sub-composition 腳本包裝差異而非逐位元組相同（這個差異在 #6665 之前就存在），但通過 harness 的 `validateCompilation`；mp4 需 Linux Docker（本機無 Docker）重現，待 CI 確認。 |
| 雲端字型失敗點名專案檔案 | **採用**。`cloud/fontFailure.ts`＋`handleFailedRender` 傳入專案目錄。 |
| 套件預算 | 上游把 lint packed 預算調到 191022、engine 到 490452；本線 `npm pack --dry-run` 實測 lint 179116、engine 453284，仍在現有預算內，**不調整**。 |

### PR 裁決（PR 水位 #7164 → #7189）

| PR | 狀態 | 裁決 |
| --- | --- | --- |
| #7165、#7166、#7168、#7183、#7184 | merged | 見 commit 表。 |
| #7169–#7173、#7179 | merged | 前輪已處理。 |
| #7167、#7198 | closed | 產生型別 resync，同 #7162：不適用。 |
| #7174 | closed，未合併 | Opper 作 vision provider（Felixkw12），已關閉；不採用。 |
| #7175、#7192 | merged | 發行提交，不適用。 |
| #7176、#7177、#7178、#7180、#7182、#7185–#7189 | merged | 見 commit 表。 |
| #7181 | open，head `b055f760a2334d1c369dd5d9ac5e15dfdc4a7a70` | Märten Tropp：screenshot 模式啟動加 `--disable-partial-raster`，修 #7111（1／3 workers 畫格不一致），改 `engine/src/services/browserManager.ts`。與本線已觀察的 #7111／#7223 驗收直接相關。**釘選**，合併後依 commit 採用並以 1／多 workers RGBA 比對驗收。 |

### Monitored 重審（91 → 92 筆）

| PR | 前 → 後 | 裁決 |
| --- | --- | --- |
| #6695 | `21ab00f49…`／open → `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`／open | Renovate 的 undici 7.30.1 安全更新，diff 僅 `bun.lock`、`cli/package.json`、`engine/package.json` 的 undici 與版號；本線沒有直接 undici 依賴。仍觀察，重釘新 head。 |
| #6972 | `194f9a607…`／open → `bb149a880257d3947d632472dc3d1ce7edfaf5b8`／closed（merged `73e65e2c7`） | 已採用，重釘。 |
| #7181 | 新增 `b055f760a…`／open | 如上。 |
| #6983 | 不重釘 | 對應 commit 是第 25 個，尚在水位外：`git apply --check` 在 `motion-blur.mdx:28`、`filterTier.ts:8`、`index.ts:38` 失敗，`frames.test.ts` 與 `cli/src/docs/motion-blur.md` 本線不存在，下輪處理。 |

### 採用與驗證

採用項與上游作者（供 Co-authored-by）：#7165、#7166、#6665、#6697、#6716（僅 helper）、#6972、#7183、#7184 為 Miguel Ángel；#7168 為 WaterrrForever；#7132 為 Ular Kimsanov；#7196 為 James Russo。

紅燈做法：把來源檔還原成 `2f575f082` 版本（新增檔移開）後跑同批測試，確認失敗，再還原。

| 項目 | 舊碼 | 新碼 |
| --- | --- | --- |
| #7165＋#6665＋#7168 core 字型與 bundler（`src/fonts`、`htmlBundler.test.ts`、`cacheDir.test.ts`） | 11 failed／474 passed，另 `cacheDir`、`sfntNames` 兩檔載入失敗 | `src/fonts` 等 25 檔 491 passed |
| parsers `fontShorthand.test.ts` | 檔案不存在而無法載入 | 21 passed |
| lint `rules/fonts.test.ts` | 3 failed／61 passed | 64 passed |
| engine `riskFrames.test.ts`（#6697＋#7168） | 3 failed／15 passed | 18 passed |
| producer `captureStreamingStage.test.ts`＋`planValidation.test.ts`（bun） | 3 failed／64 passed | 67 passed |
| cli `renderLock`、`fontFailure`、`fontPreflight`、`render.fonts` | 3 檔載入失敗、1 failed | 4 檔 28 passed／3 skipped |
| #7166 core `fieldFamilies`、producer `htmlCompiler.projectFonts`（vitest） | 1 failed；5 failed | 3 passed；5 passed（先 `bun run --cwd packages/core build`） |
| #6972 engine `frameCapture*` 3 檔；#7184 cli `projectLock` | 5 failed／82 passed；2 failed／7 passed | 87 passed；9 passed |
| #7183 cli `check.test.ts` | 1 failed：expected 480 to be less than 120 | 154 passed |

測試改動：#6697 的 `riskFrames.test.ts` 有一例以位置參數傳 `60_000, now`（上游寫法，執行期被忽略），改成 `{ budgetMs, now }`，同一斷言。

已知環境失敗（與本輪無關）：cli `offload.undecodableTrack.test.ts` 2 例、parsers `assetResolution` 與 lint `projectShaders` 的 symlink 類失敗。

### 水位與剩餘範圍

commit 連續區段 `cba66f20a..15b1de4ae`（24 個，兩端含）逐筆有裁決，水位 `15b1de4aeba2a375931c13542fa2d1e6500174db`；PR 水位 #7189；issue 維持 #7223；monitored 92 筆。下一個 commit 為 `aace91b5e`（#6983）；之後第 26 個起（#7199、#7194、#7195 等）未讀。審查不代表整版同步或完整產品驗收。

### 收尾 strict 快照（該水位的歷史快照）

`python tools/check_upstream_updates.py --strict` exit 1，上游 tip `35cbca992`：commit 水位以上 55 筆（含本輪期間新進者）、PR #7190 起 62 筆、issue 無新項、92 筆 monitored 中 1 筆移動（#6983，待第 25 個 commit）。已先行處理但在水位外的 commit（#7179、#7173）見前節。下一個 commit 是 `aace91b5e`（#6983）。ROADMAP 的接續列保留。

交付驗證：core 全套 259 檔 5540 passed／0 failed；lint 1243 passed／1 failed（symlink EPERM）；parsers 1388 passed／1 failed（symlink 類，`assetResolution`）；engine 單獨重跑原本在整批壓力下失敗的 7 檔 150 passed，剩 `audioMixer.undecodableTrack`（乾淨 HEAD 同樣失敗）；cli 整批受壓力與環境影響（symlink EPERM、`git` exit 128、Chrome process 測試），逐檔重跑後 `check.test.ts` 通過，其餘失敗檔未被本輪修改；producer 單元 lane 的 `renderDirOwner`、`segmentManifest`（Windows 路徑分隔）在乾淨 HEAD 同樣失敗，另 3 檔在壓力下逾時、單獨重跑 58 passed。`pwsh -NoProfile -File tools/dev_check.ps1` 結尾 `WINDOWS DEV CHECK GREEN`；`npx fallow audit --base origin/main --fail-on-issues` exit 0；變更程式 oxlint 0 warnings／0 errors；cli `tsc` 只剩既有的 `check.test.ts(2264)`。

套件大小上限：`d4e4b07e3`（#7168）在上游把 engine packed 提高 28032、lint packed 提高 11684（量測值超出原上限）。本線移植同一批程式，照相同增量調整：engine `456397→484429`、lint `179338→191022`。本機缺 pnpm，無法跑 `verify:packed-manifests` 實測；發版流程（`publish.yml` 的 `verify:packed-manifests`）會實測把關。

## 2026-11-06：接續至 `aace91b5e`，採用 #6983

起點為 fork `94c048ba7734cfe84b5becde2f8760c7eb3a0731`，commit 水位 `15b1de4ae`、PR #7189、issue #7223。先執行 `python tools/check_upstream_updates.py --strict`，exit 1；只推進下表有完整裁決及回歸證據的一個連續 commit。PR／issue 軸沒有重新裁決，不推進。

### Commit 與逐檔裁決

| Commit／PR／作者                                                                                                        | 上游證據                                                                                                                                                                              | 本線證據與裁決                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aace91b5ec0d937772f66ab06e63c5755e579646`／[#6983](https://github.com/heygen-com/hyperframes/pull/6983)／Vance Ingalls | `aace91b5e:packages/core/src/motionBlurSettings.ts:6,14,23,47,66`、`runtime/captureMotionBlur/frames.ts:119,138`、`filterTier.ts:189,232`、`index.ts:99,282,565,705`、`tier.ts:19,37` | **採用，手工適配**。本線 `packages/core/src/motionBlurSettings.ts:6,14,23,47,66` 增加 -360 至 360 度的 phase，null 保持原先置中的取樣算式；`runtime/captureMotionBlur/frames.ts:30,49` 共用快門時間計算，`filterTier.ts:184,226`、`index.ts:97,272,553,694` 與 `tier.ts:19,36` 同步 capture／filter 及 report。兩個 tier 均驗證 phase 0 與未設定時的時間。無網路、時鐘或隨機來源；不改現有擷取、復原或 Windows 路徑政策。 |

`aace91b5e:packages/core/src/runtime/captureMotionBlur/frames.test.ts:234` 的 phase 測試可獨立採用；該檔較前面的 overflow、scene 及 restore 測試需要本線沒有的 `contentBox`／`holdFrame`，不能整檔覆蓋。新增本線 `packages/core/src/runtime/captureMotionBlur/frames.test.ts:6`，只收集前 `reads` 次 seek；本線最後仍以 `seek(t)` 復原，不引入上游的 restore 契約。`aace91b5e:index.test.ts:2026` 的 tier 測試追加到本線 `index.test.ts:1800`，settings 與 Studio panel 的測試照補丁採用（`aace91b5e:packages/studio/src/components/panels/motionBlurPanelModel.test.ts:117` 對應本線同檔）。

文件採用 `aace91b5e:docs/guides/motion-blur.mdx:31` 的 phase 屬性說明，本線同檔 `:31`。`aace91b5e:packages/cli/src/docs/motion-blur.md:9` 不另建整份舊 CLI 文件：本線不存在該頁，使用者入口為上述已更新的 guide；不引入無入口的文件複本。

### Monitored 與既有延後

唯讀 `gh pr view 6983 --repo heygen-com/hyperframes --json number,state,mergedAt,headRefOid,mergeCommit` 確認 merged，merge SHA 即上列 commit。#6983 從 head `08896bea3af5ccd491a0fdddef5605574ea2a679`／open 重釘為 `a3eec9fad7ee690fb706fc872466d161d640949d`／closed，monitored 維持 92 筆。其他項目不改釘選。

#6983 不依賴以下項目，維持原裁決：#7182 需先有長來源分段 proxy 契約及 Windows 回歸；#7176 需先決定技能執行遙測政策；#7104 與 #7168 的 retry 部分需 sequential resume／新 session 的可重現停滯與取消驗收；#6716 的 17 檔快取遷移需對齊 Windows 私有快取根及整套 guard，現有 helper 保留。對應上游與本線位置沿用前節分項表，不因 phase 功能而擴大移植。

### Golden 與作者

`94c048ba7` 已採用 #6665 的三組 golden（compiled.html 與 MP4 的 LFS pointer），取代前節未採 golden 的歷史裁決；不再次重生或更動這些 fixture。此區段不新增 LFS 物件，無新增待上傳清單。#6983 不含套件大小預算變更；保留現有預算。

Co-authored-by 作者為 Vance Ingalls；email 由上游 Git metadata 提供提交者，不寫入文件。

### 驗證

證據命令與輸出存於忽略目錄 `tmp/upstream-20261106/`。#6983 測試先套在舊來源碼，失敗後才移植；另將最終測試搭配 HEAD 來源碼重跑，得到相同 14 failed，最後完整還原新碼。

| 驗證                                                                                            | 結果                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run --cwd packages/core test src/motionBlurSettings.test.ts src/runtime/captureMotionBlur` | 舊碼 exit 1：14 failed／185 passed；新碼 exit 0：9 檔 199 passed／0 failed。包含 phase 0、正負邊界、未設定／無效值、置中時間完全相同、負時間截斷及 capture／filter 兩路。                                                                                                                            |
| `bun run --cwd packages/studio test src/components/panels/motionBlurPanelModel.test.ts`         | exit 0：11 passed／0 failed。                                                                                                                                                                                                                                                                        |
| `bun run --cwd packages/core build`                                                             | exit 0，runtime artifacts 與 TypeScript build 完成。                                                                                                                                                                                                                                                 |
| lefthook 三組 `tsc --noEmit -p`（core、studio、scripts）                                        | 全數 exit 0；此 hook 不含 CLI 的既有 `check.test.ts(2264)` 錯誤。                                                                                                                                                                                                                                    |
| `node_modules/.bin/fallow audit --base origin/main --fail-on-issues`                            | exit 0：10 changed files，dead code 0／complexity 0／duplication 0，No issues。                                                                                                                                                                                                                      |
| 變更 TypeScript 的 oxlint                                                                       | exit 0：0 warnings／0 errors。                                                                                                                                                                                                                                                                       |
| 乾淨 HEAD 產品 Quick                                                                            | 還原至 `94c048ba7`，`git status --porcelain` 空，再執行 `pwsh -NoProfile -File tools/test_product.ps1`，exit 1：parsers 1388 passed／1 failed／7 skipped／3 todo；lint 1243 passed／1 failed。失敗皆 symlink EPERM，位於 `assetResolution.test.ts` 與 `projectShaders.test.ts`；測試後完整還原移植。 |

`pwsh -NoProfile -File tools/dev_check.ps1` exit 0：39 passed／0 failed，compileall／Ruff 通過，相對連結 12 份文件 0 錯誤，結尾 `WINDOWS DEV CHECK GREEN`。

`pwsh -NoProfile -File tools/test_product.ps1 -Full` 的 wrapper exit 1，**未完成且未通過**。同時啟動 workspace 測試後記錄到 216 筆 `Failed to start forks worker`，部分測試逾時；停止該命令所啟動的程序樹並保留全部輸出，沒有終止其他工作。已完成摘要的小計為 14158 passed／401 failed，這不是完整套件總數。除上述乾淨 HEAD 已重現的 symlink EPERM，其他失敗沒有逐一在乾淨 HEAD 重現，不能一概歸為既有環境問題，也不據此宣稱產品回歸。

受影響 core 改用獨立程序 `bun run --cwd packages/core test --maxWorkers=2`，exit 0：260 檔、5552 passed／11 skipped／0 failed（207.56 秒）。未重跑其他已通過項目，未把該 core 結果冒充跨 workspace Full 綠燈。producer 由 Full 原有 `scripts/run-test-lane.mjs` 執行，沒有自行混用 runner。

已執行變更 Markdown 的 oxfmt；`docs/` 在 `.prettierignore`，另以空 ignore 檔格式化追加節，保留既有清冊前綴原樣。`mint validate` 無法啟動（找不到 Mintlify CLI）；`mint broken-links` 也因相同工具缺失未執行。維護相對連結 gate 通過不等於 Mintlify 驗證通過，MDX 的網站建置仍未驗證。

### 水位與剩餘範圍

commit 水位為 `aace91b5ec0d937772f66ab06e63c5755e579646`；PR #7189、issue #7223、monitored 92 筆。下一個 commit 是 `f6ae9bfb4`（#7199）；閱讀其補丁不等於完成裁決或採用。ROADMAP 接續列保留，審查水位不代表整版同步或完整產品驗收。

### 收尾 strict 快照（該水位的歷史快照）

`python tools/check_upstream_updates.py --strict --output tmp/upstream-20261106/strict-final.md` exit 1；固定上游 tip `256b84a41bc32913870953c06e05f4ab25e963f8`，commit 水位以上 62 筆（包含檢查期間新進者）、PR #7190 起 73 筆、issue #7259 一筆；monitored 92 筆全部維持釘選 head／state，移動數為 0。不以水位變更掩蓋其餘待審軸，ROADMAP 接續列保留。


## 2026-11-06：接續至 `aa34cffe4`，審查 15 個連續 commit

起點 fork `8406f9bca`，原 commit 水位 `aace91b5e`、PR #7189、issue #7223。先執行 `python tools/check_upstream_updates.py --strict`，exit 1。以下依上游時間序列逐筆讀完整補丁，不以檔案數判斷；只推進有裁決與回歸證據的連續前綴。

| Commit／PR／作者                                                                                                         | 上游 SHA:檔案:行號                                                        | fork 證據與裁決                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `f6ae9bfb43a4e4bee0d132a5ac2a0b1ce4bf383f`／[#7199](https://github.com/heygen-com/hyperframes/pull/7199)／WaterrrForever | `f6ae9bfb4:packages/producer/src/services/render/stages/audioStage.ts:60` | 本線 `packages/producer/src/services/render/stages/audioStage.ts:59`。採用，手工適配既有 constrainAacTruePeak，保留 delivery PCM 至 assemble；sourceStale 即使刪檔被 Windows 拒絕也不交給 assembly。沒有引入延後的 limitDeliveryPeaks。                                                                                                                                 |
| `2372fc34a12cc65e5793e88251c2ad783ec98ed6`／[#7194](https://github.com/heygen-com/hyperframes/pull/7194)／Miguel Ángel   | `2372fc34a:packages/cli/src/browser/manager.ts:765`                       | 本線 `packages/cli/src/browser/manager.ts:769`。採用。只在 Windows 對 EBUSY／EPERM／EACCES 有界退避；安裝及最後 rename 都重試，非 Windows／其他錯誤不重試。測試明確切換 linux，修正上游假定測試主機為 POSIX 的最後一例。                                                                                                                                                |
| `e2a65358600bbc70d5bd17c51ef2ec58cbc692aa`／[#7195](https://github.com/heygen-com/hyperframes/pull/7195)／Miguel Ángel   | `e2a653586:packages/core/src/runtime/init.ts:1464`                        | 本線 `packages/core/src/runtime/init.ts:1428`。採用。timing invalidation 清 queryCache，unmount 清掉強引用，離線節點不進待樣式集合。本線沒有 neverStyledStarts，故不新增該 cache 或照搬其 WeakMap 變更。                                                                                                                                                                |
| `33c17df5aeb7bc45f717e7091e81ea0e0ebe6e23`／[#7202](https://github.com/heygen-com/hyperframes/pull/7202)／WaterrrForever | `33c17df5a:packages/core/package.json:3`                                  | 本線 `packages/core/package.json:3`。不適用。只提高上游發行版本並宣告整版功能；本線版本與 release guard 維持，選擇性移植不宣稱 0.9.15。另已讀 docs/changelog.mdx:8 與 releases/v0.9.15.md:1。                                                                                                                                                                           |
| `071ec1fdddb874927f85827a42e84f04924f1bd2`／[#5746](https://github.com/heygen-com/hyperframes/pull/5746)／kevin          | `071ec1fdd:packages/core/src/runtime/diagnostics.ts:59`                   | 本線 `packages/core/src/runtime/diagnostics.ts:59`。採用。buildReady rejection 記錄 key 與 reason，ready 同 tick 釋放並攜 startup error；teardown 只清自己產生的錯誤。generated position-edits IIFE 依本線 builder 重產，不覆蓋上游 minifier 名稱。                                                                                                                     |
| `58b9ec0efffec78beb028e8866bd7150397585b8`／[#7203](https://github.com/heygen-com/hyperframes/pull/7203)／Jerrai         | `58b9ec0ef:packages/cli/src/ui/renderResult.ts:8`                         | 延後。producer 尚無 ReferenceBackground／referenceBackgroundResult／REFERENCE_BACKGROUND_FIELD；本線 packages/producer/src/index.ts:1 與 packages/cli/src/commands/batchRender.ts:40 沒有該結果契約。等 producer 背景量測與公開投影介面成組採用，再驗四種值、quiet／TTY／失敗路徑及 manifest，不印空殼結果。                                                            |
| `924bb64da6d14d515751e6357c4600d31768f1fc`／[#7201](https://github.com/heygen-com/hyperframes/pull/7201)／Miguel Ángel   | `924bb64da:packages/cli/src/commands/lint.ts:42`                          | 本線 `packages/cli/src/commands/lint.ts:41`。採用。lint 接受別名並顯示 info，check 接受同名旗標但維持顯示全部 findings。同步 CLI 文件，移除兩份 skill 的 --describe false 並由本線內容重生 manifest。                                                                                                                                                                   |
| `6e8454d6d529fcaee42970b37c5f08f7369a0a38`／[#6466](https://github.com/heygen-com/hyperframes/pull/6466)／Jason          | `6e8454d6d:packages/cli/src/utils/studioSelectionClient.ts:73`            | 本線 `packages/cli/src/utils/studioSelectionClient.ts:73`。採用。預設 Studio 探測先以一秒 socket connect 拒絕 dropped port，destroy socket 後才 fetch；保留注入 fetchImpl 的測試介面與路徑正規化。                                                                                                                                                                      |
| `982070388eeb4429d21c7bdd8bb61c7e24e303ae`／[#5017](https://github.com/heygen-com/hyperframes/pull/5017)／cooleryu       | `982070388:packages/core/src/runtime/adapters/waapi.ts:56`                | 本線 `packages/core/src/runtime/adapters/waapi.ts:56`。採用。初始 running／finished 的 document-timeline、rate 1 WAAPI 以 composition zero 對齊；保留 paused offset、CSS、其他 timeline／rate 及晚發現動畫基準。                                                                                                                                                        |
| `bdf9ba0ee68369ddfa19e7bb59b5432544970294`／[#5680](https://github.com/heygen-com/hyperframes/pull/5680)／Vincent Yip    | `bdf9ba0ee:packages/studio/src/utils/marqueeGeometry.ts:28`               | 本線 `packages/studio/src/utils/marqueeGeometry.ts:28`。採用完整 24 檔補丁。canvas 與 timeline 同用 replace／add／subtract；Alt 優先於 Shift，release 決定模式，Escape 還原；URL 與 selection bridge 改用 replace。docs/studio/canvas.mdx 與 timeline.mdx 同步操作說明。                                                                                                |
| `3b3d7c2cd32a9f2c7c9449dafed9c1a0d02bf05e`／[#7207](https://github.com/heygen-com/hyperframes/pull/7207)／heygen-rui-bot | `3b3d7c2cd:packages/cli/src/cloud/_gen/types.ts:127`                      | 本線 `packages/cli/src/cloud/_gen/types.ts:1`。不適用，沿用 generated schema 成組分流。增加 reverse session、帳戶媒體 output_upload／delivery 與未採背景量測型別；本線 packages/cli/src/cloud/\_gen/types.ts:1 仍是已採 API 契約。等對應 hosted 功能及 schema 生成來源一起驗證，不手改產生型別。                                                                        |
| `7862e271d16baa9052c78d3b85535ebc725cd136`／[#7205](https://github.com/heygen-com/hyperframes/pull/7205)／Miguel Ángel   | `7862e271d:packages/cli/src/utils/contrastMotion.ts:99`                   | 本線 `packages/cli/src/utils/contrastMotion.ts:99`。採用。文字下方相交圖層的非 ambient tween 也算運動；以時間吻合辨識隨 parent seek 的 paused sub-timeline，旁側不相交圖層不誤抑制。                                                                                                                                                                                    |
| `e976fdbfa1f118e761d5268905e3a667644f8b8c`／[#7210](https://github.com/heygen-com/hyperframes/pull/7210)／Miguel Ángel   | `e976fdbfa:packages/lint/src/rules/media.ts:650`                          | 本線 `packages/lint/src/rules/media.ts:646`。採用。lint hint 與技能說明一致要求 video 自有 timing、wrapper 不計時，保留既有 frame extractor 與 visibility 行為，重生 skills manifest。                                                                                                                                                                                  |
| `4ba47aaa122f8906b70a578cc10023e7d6a6e4ad`／[#7197](https://github.com/heygen-com/hyperframes/pull/7197)／Ular Kimsanov  | `4ba47aaa1:docs/download-attribution.js:71`                               | 本線 `docs/download-attribution.js:1`。不適用於 fork 的產品修正。補丁擴充官方 hyperframes.studio 的跨站 campaign／referrer 儲存與轉送；本線 docs/download-attribution.js:13 仍指向官方下載站，沒有本 fork 自有的 attribution 消費端。不擴大追蹤，若日後啟用 fork 網站歸因，先與 #7176 的遙測政策一併裁決及驗 consent。                                                  |
| `aa34cffe4b8d66053bc1bf999275b12265c22ab7`／[#7190](https://github.com/heygen-com/hyperframes/pull/7190)／Vance Ingalls  | `aa34cffe4:packages/core/src/runtime/captureMotionBlur/index.ts:206`      | 本線 `packages/core/src/runtime/captureMotionBlur/index.ts:201`。採用捲動修正。root 搬入／搬出 canvas 前保存 root 與後代的 scrollLeft／scrollTop，搬移後復原再 seek。另讀 engine thresholds.ts:9、captureMotionBlur.differential.browser.test.ts:21 與 producer blurDifferential.integration.test.ts:26；本線缺 #7108 fixture／測試，不新增這批缺前置鏈的缺陷釘選移除。 |

### 分項依賴、文件與 generated artifacts

#7199 的 PCM 保留只對本機 render 啟用；distributed plan 不要求保留。`audioPadTrim.ts` 的編碼與 peak correction 共用 PCM，`assembleStage.ts` 接收 `audioPcmPath`，`renderOrchestrator.ts` 傳遞結果；切 PCM 失敗時顯式 sourceStale，不能以 existsSync 推論 PCM 安全。保留原 workDir 所有權與最終清理。

#7195 的 producer browser 測試包含 paused scrub；#5017 的 browser 測試比較實際 WAAPI transform，涵蓋正負 delay、reverse、finished 與 authored pause offset。#7190 的單元測試模擬 DOM 搬移清空巢狀 scroll offsets，不依賴 DOM emulator 自行實作捲動。

#7201 更新 `docs/packages/cli.mdx`，#5680 補 canvas／timeline 的使用者說明。`docs/` 使用 Mintlify 根路徑與小寫錨點，沒有連到 docs 外的 `../`。技能 manifest 以 `bun packages/cli/scripts/gen-skills-manifest.ts` 依 fork 實際內容產生。

#7182 仍需長來源分段 proxy 契約與 Windows 回歸；#7176 仍需遙測政策；#7104／#7168 retry 仍需 sequential resume、新 session 停滯與取消驗收；#6716 的 17 檔快取遷移仍需 Windows 私有快取根與整套 guard。這 15 個 commit 沒有要求先採它們。#7108／#7149／#7191 的 blur 缺陷測試鏈仍待 commit 軸到達時成組判斷。

### PR、monitored、Golden 與作者

唯讀 `gh pr view 7190 --repo heygen-com/hyperframes --json state,mergedAt,headRefOid,mergeCommit` 確認 merged head `ec6f9002828d3c2f09faca8b155b01a0d50a0856`、merge commit `aa34cffe4b8d66053bc1bf999275b12265c22ab7`；PR 水位只推進到 #7190，不越過尚未完整裁決的 #7191。issue 維持 #7223。92 筆 monitored 由起始 strict 確認沒有 head／state 移動；這個連續前綴沒有需重釘的既有 monitored，數量維持。

這 15 個 commit 沒有新增或更動 golden LFS pointer，無新增待上傳 LFS 物件。保留 `94c048ba7` 已補的 #6665 golden。沒有上游 package-size budget 增量可採，保留現有預算。

採用作者：WaterrrForever、Miguel Ángel、kevin、Jason、cooleryu、Vincent Yip、Vance Ingalls；提交者從對應上游 Git metadata 取 Co-authored-by email，不在文件保存 email。

### 已移植檔案對照

以下按補丁第一個可定位的新增程式／測試行釘選；同檔多筆保留各自來源，不代表整檔覆蓋。

| 上游來源                                                                                 | fork 位置                                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `f6ae9bfb4:packages/producer/src/services/render/audioPadTrim.test.ts:18`                | `packages/producer/src/services/render/audioPadTrim.test.ts:18`                |
| `f6ae9bfb4:packages/producer/src/services/render/audioPadTrim.ts:81`                     | `packages/producer/src/services/render/audioPadTrim.ts:81`                     |
| `f6ae9bfb4:packages/producer/src/services/render/audioTruePeak.fakeFfmpeg.test.ts:126`   | `packages/producer/src/services/render/audioTruePeak.fakeFfmpeg.test.ts:121`   |
| `f6ae9bfb4:packages/producer/src/services/render/stages/assembleStage.test.ts:95`        | `packages/producer/src/services/render/stages/assembleStage.test.ts:95`        |
| `f6ae9bfb4:packages/producer/src/services/render/stages/assembleStage.ts:39`             | `packages/producer/src/services/render/stages/assembleStage.ts:39`             |
| `f6ae9bfb4:packages/producer/src/services/render/stages/audioStage.test.ts:130`          | `packages/producer/src/services/render/stages/audioStage.test.ts:116`          |
| `f6ae9bfb4:packages/producer/src/services/render/stages/audioStage.ts:20`                | `packages/producer/src/services/render/stages/audioStage.ts:20`                |
| `f6ae9bfb4:packages/producer/src/services/renderOrchestrator.ts:3684`                    | `packages/producer/src/services/renderOrchestrator.ts:3514`                    |
| `2372fc34a:packages/cli/src/browser/manager.test.ts:1297`                                | `packages/cli/src/browser/manager.test.ts:1292`                                |
| `2372fc34a:packages/cli/src/browser/manager.ts:754`                                      | `packages/cli/src/browser/manager.ts:758`                                      |
| `e2a653586:packages/core/src/runtime/init.ts:1442`                                       | `packages/core/src/runtime/init.ts:1406`                                       |
| `e2a653586:packages/producer/src/services/coreRuntimeBrowser.test.ts:1600`               | `packages/producer/src/services/coreRuntimeBrowser.test.ts:1692`               |
| `071ec1fdd:packages/core/src/runtime/diagnostics.ts:55`                                  | `packages/core/src/runtime/diagnostics.ts:55`                                  |
| `071ec1fdd:packages/core/src/runtime/init.test.ts:4543`                                  | `packages/core/src/runtime/init.test.ts:4467`                                  |
| `071ec1fdd:packages/core/src/runtime/init.ts:207`                                        | `packages/core/src/runtime/init.ts:197`                                        |
| `924bb64da:docs/packages/cli.mdx:1195`                                                   | `docs/packages/cli.mdx:1118`                                                   |
| `924bb64da:packages/cli/src/commands/check.test.ts:17`                                   | `packages/cli/src/commands/check.test.ts:1`                                    |
| `924bb64da:packages/cli/src/commands/check.ts:168`                                       | `packages/cli/src/commands/check.ts:163`                                       |
| `924bb64da:packages/cli/src/commands/lint.test.ts:92`                                    | `packages/cli/src/commands/lint.test.ts:92`                                    |
| `924bb64da:packages/cli/src/commands/lint.ts:42`                                         | `packages/cli/src/commands/lint.ts:41`                                         |
| `924bb64da:skills/hyperframes/references/storyboard.md:12`                               | `skills/hyperframes/references/storyboard.md:12`                               |
| `924bb64da:skills/media-use/references/media-treatments.md:141`                          | `skills/media-use/references/media-treatments.md:141`                          |
| `6e8454d6d:packages/cli/src/utils/studioSelectionClient.test.ts:2`                       | `packages/cli/src/utils/studioSelectionClient.test.ts:2`                       |
| `6e8454d6d:packages/cli/src/utils/studioSelectionClient.ts:2`                            | `packages/cli/src/utils/studioSelectionClient.ts:2`                            |
| `982070388:packages/core/src/runtime/adapters/waapi.initial.test.ts:1`                   | `packages/core/src/runtime/adapters/waapi.initial.test.ts:1`                   |
| `982070388:packages/core/src/runtime/adapters/waapi.ts:56`                               | `packages/core/src/runtime/adapters/waapi.ts:56`                               |
| `982070388:packages/producer/src/services/coreRuntimeBrowser.test.ts:203`                | `packages/producer/src/services/coreRuntimeBrowser.test.ts:203`                |
| `bdf9ba0ee:packages/studio/src/components/editor/DomEditOverlay.tsx:8`                   | `packages/studio/src/components/editor/DomEditOverlay.tsx:8`                   |
| `bdf9ba0ee:packages/studio/src/components/editor/MarqueeOverlay.tsx:1`                   | `packages/studio/src/components/editor/MarqueeOverlay.tsx:1`                   |
| `bdf9ba0ee:packages/studio/src/components/editor/marqueeCommit.test.tsx:6`               | `packages/studio/src/components/editor/marqueeCommit.test.tsx:6`               |
| `bdf9ba0ee:packages/studio/src/components/editor/marqueeCommit.ts:12`                    | `packages/studio/src/components/editor/marqueeCommit.ts:11`                    |
| `bdf9ba0ee:packages/studio/src/components/editor/previewReadOnly.overlay.test.tsx:332`   | `packages/studio/src/components/editor/previewReadOnly.overlay.test.tsx:332`   |
| `bdf9ba0ee:packages/studio/src/editorGesturesExports.test.tsx:101`                       | `packages/studio/src/editorGesturesExports.test.tsx:101`                       |
| `bdf9ba0ee:packages/studio/src/hooks/useDomSelection.test.ts:140`                        | `packages/studio/src/hooks/useDomSelection.test.ts:140`                        |
| `bdf9ba0ee:packages/studio/src/hooks/useDomSelection.ts:25`                              | `packages/studio/src/hooks/useDomSelection.ts:25`                              |
| `bdf9ba0ee:packages/studio/src/hooks/useDomSelectionTypes.ts:5`                          | `packages/studio/src/hooks/useDomSelectionTypes.ts:5`                          |
| `bdf9ba0ee:packages/studio/src/hooks/useStudioUrlState.ts:4`                             | `packages/studio/src/hooks/useStudioUrlState.ts:4`                             |
| `bdf9ba0ee:packages/studio/src/hooks/useTimelineSelectionPreviewSync.test.tsx:8`         | `packages/studio/src/hooks/useTimelineSelectionPreviewSync.test.tsx:8`         |
| `bdf9ba0ee:packages/studio/src/hooks/useTimelineSelectionPreviewSync.ts:4`               | `packages/studio/src/hooks/useTimelineSelectionPreviewSync.ts:4`               |
| `bdf9ba0ee:packages/studio/src/index.ts:286`                                             | `packages/studio/src/index.ts:275`                                             |
| `bdf9ba0ee:packages/studio/src/player/components/TimelineCanvas.tsx:229`                 | `packages/studio/src/player/components/TimelineCanvas.tsx:229`                 |
| `bdf9ba0ee:packages/studio/src/player/components/TimelineProvider.tsx:19`                | `packages/studio/src/player/components/TimelineProvider.tsx:19`                |
| `bdf9ba0ee:packages/studio/src/player/components/timelineMarquee.test.ts:10`             | `packages/studio/src/player/components/timelineMarquee.test.ts:10`             |
| `bdf9ba0ee:packages/studio/src/player/components/timelineMarquee.ts:2`                   | `packages/studio/src/player/components/timelineMarquee.ts:2`                   |
| `bdf9ba0ee:packages/studio/src/player/components/timelineMarqueeCommit.ts:1`             | `packages/studio/src/player/components/timelineMarqueeCommit.ts:1`             |
| `bdf9ba0ee:packages/studio/src/player/components/useTimelineRangeSelection.test.tsx:107` | `packages/studio/src/player/components/useTimelineRangeSelection.test.tsx:107` |
| `bdf9ba0ee:packages/studio/src/player/components/useTimelineRangeSelection.ts:11`        | `packages/studio/src/player/components/useTimelineRangeSelection.ts:10`        |
| `bdf9ba0ee:packages/studio/src/styles/theme.css:199`                                     | `packages/studio/src/styles/theme.css:199`                                     |
| `bdf9ba0ee:packages/studio/src/utils/marqueeGeometry.test.ts:2`                          | `packages/studio/src/utils/marqueeGeometry.test.ts:2`                          |
| `bdf9ba0ee:packages/studio/src/utils/marqueeGeometry.ts:17`                              | `packages/studio/src/utils/marqueeGeometry.ts:17`                              |
| `bdf9ba0ee:packages/studio/src/utils/studioUrlState.test.ts:221`                         | `packages/studio/src/utils/studioUrlState.test.ts:221`                         |
| `7862e271d:packages/cli/src/utils/contrastMotion.test.ts:164`                            | `packages/cli/src/utils/contrastMotion.test.ts:164`                            |
| `7862e271d:packages/cli/src/utils/contrastMotion.ts:20`                                  | `packages/cli/src/utils/contrastMotion.ts:20`                                  |
| `e976fdbfa:packages/lint/src/rules/media.test.ts:357`                                    | `packages/lint/src/rules/media.test.ts:342`                                    |
| `e976fdbfa:packages/lint/src/rules/media.ts:650`                                         | `packages/lint/src/rules/media.ts:646`                                         |
| `e976fdbfa:skills/hyperframes/SKILL.md:29`                                               | `skills/hyperframes/SKILL.md:27`                                               |
| `e976fdbfa:skills/hyperframes/references/format.md:149`                                  | `skills/hyperframes/references/format.md:149`                                  |
| `aa34cffe4:packages/core/src/runtime/captureMotionBlur/index.test.ts:640`                | `packages/core/src/runtime/captureMotionBlur/index.test.ts:614`                |
| `aa34cffe4:packages/core/src/runtime/captureMotionBlur/index.ts:206`                     | `packages/core/src/runtime/captureMotionBlur/index.ts:201`                     |

### 聚焦回歸與建置證據

完整輸出保存在忽略目錄 `tmp/upstream-20261106-next/`。先只套回歸測試，再移植產品程式；下表紅燈均為實際執行，不以預期失敗代替。

| 指令／範圍                                                                                                                                                                                                                                              | 舊碼紅燈                                                                                                    | 新碼結果                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| core：`bun run --cwd packages/core test src/runtime/init.test.ts src/runtime/adapters/waapi.initial.test.ts src/runtime/captureMotionBlur/index.test.ts --maxWorkers=2`；新碼用相同範圍的 `bun x vitest run`                                            | exit 1，13 failed／381 passed                                                                               | exit 0，394 passed／0 failed；#5746 3 例、#5017 9 例、#7190 1 例由紅轉綠                          |
| CLI：`bun run --cwd packages/cli test src/browser/manager.test.ts src/commands/lint.test.ts src/commands/check.test.ts src/utils/studioSelectionClient.test.ts src/utils/contrastMotion.test.ts --maxWorkers=2`                                         | exit 1，12 failed／263 passed                                                                               | exit 0，275 passed／0 failed                                                                      |
| Studio：`bun run --cwd packages/studio test` 加 9 個變更測試檔與 `--maxWorkers=2`                                                                                                                                                                       | exit 1，33 failed／116 passed                                                                               | exit 0，149 passed／0 failed；檔案清單見 red-studio.log／green-studio-focused.log                 |
| lint：`bun run --cwd packages/lint test src/rules/media.test.ts --maxWorkers=1`                                                                                                                                                                         | exit 1，2 failed／144 passed                                                                                | exit 0，146 passed／0 failed；舊碼 maxWorkers=2，測試範圍相同                                     |
| producer bun unit 分類的 `audioPadTrim.test.ts`，`HYPERFRAMES_TEST_LANE=unit bun test --preload ./scripts/no-network.mjs ./src/services/render/audioPadTrim.test.ts`                                                                                    | exit 1，4 failed／41 passed                                                                                 | exit 0，45 passed／0 failed                                                                       |
| producer unit lane `node scripts/run-test-lane.mjs unit`（`VITEST_MAX_WORKERS=2`）                                                                                                                                                                      | audioStage／assembleStage 各一例 failed；共 4 failed／1132 passed／5 skipped，另兩例為 Windows 路徑／所有權 | 新測試均通過；完整 unit Vitest 結果與限制另列                                                     |
| producer integration lane `node scripts/run-test-lane.mjs integration vitest`；browser 聚焦 `HYPERFRAMES_TEST_LANE=integration bun x vitest run src/services/coreRuntimeBrowser.test.ts -t 'lets go of each scene\|seeks initial WAAPI' --maxWorkers=1` | 舊 runtime 的 7 例 WAAPI 與 paused scene 一例失敗；取得紅燈後停止 lane 所啟動的程序樹，該次沒有完整總數     | 新 runtime 聚焦 exit 0，13 passed／78 skipped／0 failed；未把聚焦結果當完整 integration lane 通過 |

producer 聚焦採 repo `test-classification.mjs` 的 runner／lane 與 no-network preload，不把 bun:test 交給 Vitest。完整 lane 的命令保留原 runner，未改分類或測試選擇規則。

`bun run --cwd packages/{core,cli,producer,studio} build` 各自執行，四者均 exit 0；runtime artifacts、CLI／Studio ESM 與 DTS、producer build 完成。lefthook 的 core、studio、scripts 三組 `node node_modules/typescript/bin/tsc --noEmit -p <package>/tsconfig.json` 均 exit 0。`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0：最終 66 changed files，No issues（10.35 秒）；3 筆 inherited complexity 由原有 new-only gate 排除，不冒稱全部舊碼無問題。變更 TypeScript 的 oxlint exit 0：52 files、0 warnings／0 errors。

core 的 package test wrapper 因 `check:position-edits-render` 使用 `git diff --exit-code`，對正當的 generated IIFE 變更回 exit 1；沒有以 staging 遮掉差異。改跑其底層完整 Vitest，並由 build 與重複產生的位元組一致性驗證 generated artifact。

### 水位與 strict 快照（水位 aa34cffe4 時點的剩餘數量）

`python tools/check_upstream_updates.py --strict --output tmp/upstream-20261106-next/strict-final.md` exit 1；固定上游 tip `4935d6736b64ed3dd68524c1cb2c7f011171baef`。commit 水位以上 48 筆，從 `f3e5b81df`（#7149）開始；PR #7191 起 72 筆，issue #7259 一筆；monitored 92 筆全部仍在釘選 head／state，移動數 0。commit 連續前綴由 `git rev-list --count aace91b5e..aa34cffe4` 證明為 15，且 `aa34cffe4` 是該上游 tip 的 ancestor。strict 未綠，ROADMAP 近期接續列保留。

### 完整套件與乾淨 HEAD 對照

| 命令                                                                        | Exit code    | 結尾輸出與裁決                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core 目錄：`bun x vitest run --maxWorkers=2`                                | 1            | 261 files：5577 passed／1 failed／11 skipped。唯一失敗是 `pageBuild.golden.test.ts:163` 的 5000ms timeout，沒有像素或 snapshot 差異；只重跑該檔 exit 0，4 passed／0 failed。保留初次失敗，不把兩次結果冒充一次全綠。        |
| `bun run --cwd packages/cli test --maxWorkers=2`                            | 1            | 464 files：6183 passed／35 failed／303 skipped。六個 unit 失敗檔在乾淨 HEAD 同樣 27 failed；Chrome 的另外 8 個失敗採三檔各一代表案例複核。                                                                                  |
| `bun run --cwd packages/studio test --maxWorkers=2`                         | 1            | 717 files：7938 passed／229 failed／2 skipped／16 todo。22 個失敗檔全部在乾淨 HEAD 重現，229 個失敗名稱完全相同，集中於 localStorage／DOM 模擬與既有測試合約。                                                              |
| `bun run --cwd packages/lint test --maxWorkers=2`                           | 1            | 24 files：1244 passed／1 failed；`projectShaders.test.ts` symlink EPERM，乾淨 HEAD 的同檔 3 passed／1 failed，同一失敗。                                                                                                    |
| producer：`VITEST_MAX_WORKERS=2 node scripts/run-test-lane.mjs unit vitest` | 1            | 76 files：1133 passed／3 failed／5 skipped。只重跑失敗的 3 檔為 20 passed／2 failed，stall 通過；renderDirOwner 與 segmentManifest 的兩個差異，在乾淨 HEAD 同範圍也 20 passed／2 failed。                                   |
| producer：`node scripts/run-test-lane.mjs unit bun`                         | 1            | 在 `chunkAudio.test.ts` 6 passed／3 failed 後 runner 停止，後續 bun 檔未完整執行，不能報完整 bun lane 總數。乾淨 HEAD 同檔仍 6 passed／3 failed（現有 FFmpeg／音軌 fixture）。另已完成 audioPadTrim 的 45 passed 聚焦回歸。 |
| producer：`node scripts/run-test-lane.mjs integration vitest`               | 中止，非通過 | 舊 runtime 取得 #7195／#5017 的實際紅燈後停止此命令所啟動的程序樹；沒有完整 lane 總數。新 runtime 的 13 例 browser 聚焦通過，不代表所有 integration tests 通過；其他整合與端到端影片回歸未完整驗證。                        |
| `pwsh -NoProfile -File tools/dev_check.ps1`                                 | 0            | 39 passed／0 failed，compileall／Ruff 通過，相對連結 12 份文件 0 錯誤；`WINDOWS DEV CHECK GREEN`。                                                                                                                          |

乾淨 HEAD 對照使用 `8406f9bca`：先把 64 個 tracked 變更與 2 個新檔逐一備份，還原全部 HEAD bytes，新檔移到忽略目錄，再重建舊 core；`git status --porcelain` 空。對照後恢復 66 檔並逐一檢查 SHA-256，重建新 core 成功，HEAD 與 index 均保持原樣。沒有切分支、staging、commit 或外部寫入。

HEAD 比對的精確輸出：CLI 六檔 147 passed／27 failed／13 skipped，失敗名稱與完整 CLI 的 unit 部分相同；Studio 22 檔 55 passed／229 failed，229 個失敗名稱逐一相同。producer 三檔 20 passed／2 failed、chunkAudio 6 passed／3 failed，lint 一檔 3 passed／1 failed。這些都不改測試消除差異。

Chrome 代表案例在 HEAD 重建的舊 runtime 上執行：warmCheck 的 cold-check parity、chromeOrphans 的 check-finished cleanup、snapshot.lateImages 的 delayed img，各一例；exit 1，3 failed／14 skipped，209.33 秒，240 秒 named per-batch cap 未觸發。三個失敗原因分別與完整 CLI 的 exit 1、缺 processes.json、Command failed 相同。其餘 5 個 Chrome 失敗沒有逐例在 HEAD 重跑，不把代表案例推論成每例都已驗證。

提交前的獨立審查另以 `git archive 8406f9bca` 建乾淨樹（重建 core、lint、producer、studio、cli 的 `dist`），兩邊各跑一次完整 CLI 與逐檔 producer bun unit lane 並比對失敗名稱：CLI 移植樹 6187 passed／31 failed、乾淨樹 6174 passed／31 failed，31 個失敗名稱相同（含 warmCheck、chromeOrphans 等 Chrome 案例）；producer bun 52 檔移植樹 875 passed／8 failed、乾淨樹 870 passed／8 failed，8 個失敗相同。只在移植樹失敗的案例為 0；上表 35 與此處 31 的差距是 Chrome 案例在不同次執行間的波動。

完整 CLI 批次 1079.20 秒、Studio 批次 1138.48 秒，各自低於 1200 秒上限；沒有跑 `tools/test_product.ps1 -Full`，沒有重跑已通過的套件。core generated position-edits IIFE 重複產生 exit 0 且 SHA-256 相同（`a02104a8f122437a31386b940fbe8fc1fe2ca8e85315af4f94d0a59718ba7608`）。Markdown 的追加節以空 ignore 檔交給 oxfmt，保留各文件 HEAD 前綴；MDX 只格式化新增段落，避免覆蓋既有格式。

完整產品驗收仍未通過，strict 也仍有未審範圍，ROADMAP 接續列保留。這份紀錄只認列有逐筆證據的 15 個連續 commit 與 11 項移植，不把審查水位當成產品驗收。

## 2026-11-06：接續至 `659ef568d`，審查 15 個連續 commit

以 fork `12c05b9ea32f737b1f410396171964304d29505a` 為起點，逐筆讀取 `aa34cffe4` 之後 `f3e5b81df..659ef568d` 的 15 個連續補丁；PR 的 merged 狀態、head 與 mergeCommit 以唯讀 `gh pr view --repo heygen-com/hyperframes` 逐筆核對。採用 8 組獨立修正；水位只表示已審查，包含下表的部分採用、不適用與有條件延後。

| Commit／PR          | 裁決與條件                                                                                                                                                                                                                                                                                       | 上游證據                                                                            | fork 證據                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `f3e5b81df` / #7149 | 延後：缺 #7108 的 blurPage／thresholds／oracle fixture 鏈。沿用既有延後；成組補齊離線差分 harness 並驗證 A–O 症狀後採用，不把缺陷症狀測試當修復。                                                                                                                                                | `f3e5b81df:packages/engine/src/services/captureMotionBlur.sweep.browser.test.ts:79` | `packages/core/src/runtime/captureMotionBlur/index.ts:249`    |
| `fa1942d5a` / #7214 | 採用：apply 先折疊全部 move／trim，再驗最終 overlap；最終衝突仍不寫檔。抽出 settledClip 以符合 fallow 複雜度閘門；測試接受本線既有 stderr 診斷。                                                                                                                                                 | `fa1942d5a:packages/cli/src/timeline/a2Commands.ts:172`                             | `packages/cli/src/timeline/a2Commands.ts:174`                 |
| `823cd126e` / #7090 | 不適用：本線沒有 measure 指令、readClip／readDrawn／person 子系統。奇數 crop 修正與該子系統一併採用時重審；不為未提供的命令引入整套付費量測。                                                                                                                                                    | `823cd126e:packages/cli/src/measure/media.ts:222`                                   | `packages/cli/src/cli.ts:190`                                 |
| `6728b82e6` / #7089 | 部分採用：採用 init 的檔案 identity、來源保護與空閒轉碼名稱；reverse start／session 本線不存在，不導入。檔案 symlink 無權限時明確 skip，hard link 與目錄 junction 仍實跑。                                                                                                                       | `6728b82e6:packages/cli/src/commands/init.ts:286`                                   | `packages/cli/src/commands/init.ts:289`                       |
| `1fecf5b82` / #7099 | 不適用：本線沒有 heygen/v3、measure、HyperFrames plan；auth status 亦沒有 s.plan／user.subscription 的該段資料流。保留現有 OAuth 身分顯示；帳戶功能成組採用時重審。                                                                                                                              | `1fecf5b82:packages/cli/src/heygen/v3.ts:102`                                       | `packages/cli/src/commands/auth/status.ts:184`                |
| `060e6e4a1` / #7216 | 不適用：billing／plan／checkout 子系統不在本線；auth GET／token POST 已有 15 秒 timeout。補測的 OAuth timeout 不是此 commit 新增的產品行為，不導入付費工作流。                                                                                                                                   | `060e6e4a1:packages/cli/src/heygen/plan.ts:35`                                      | `packages/cli/src/auth/client.ts:35`                          |
| `898d0fb00` / #7191 | 適配採用：journal 記錄 loud seek 改過的 DOM；先落回時間再復原。適配本線 discoverMovers，FrameRequest 加可選 restore；只在 config.events 開啟時使用，不導入未同步的 readEvents／holdFrame 鏈。缺上游 browser fixture 的部分維持 #7108 條件。                                                      | `898d0fb00:packages/core/src/runtime/captureMotionBlur/discover.ts:299`             | `packages/core/src/runtime/captureMotionBlur/discover.ts:278` |
| `d452a6fad` / #7219 | 延後：上游原測試在 Windows 實跑 4 passed／1 failed：manifest 用 POSIX 路徑，relative() 回反斜線。builder 亦把 URL.pathname 當本機路徑。條件：修正 Windows 路徑、移除版本號斷言，並通過 raster／path seek、reload 與雙 worker 像素驗收後成組採用；不只搬入 911240-byte vendor。                   | `d452a6fad:registry/examples/path-traced-3d/source/build.mjs:9`                     | `scripts/file-url-paths.test.mjs:10`                          |
| `d810bdbb2` / #7220 | 延後：舊碼在 repo 內暫時 SUBST 磁碟根目錄重現器 1 passed，Node 26.12.1 未重現 0xC0000409；映射測試不等同實體磁碟根目錄。未取得規定的舊碼紅燈，不移植或假稱修好。條件：在可隔離的實體 Windows 磁碟根目錄取得舊紅新綠，並驗證 Unicode／symlink 複製與既有檔案保留；保留本線 Node 非 ASCII filter。 | `d810bdbb2:packages/cli/src/utils/copyDir.ts:5`                                     | `packages/cli/src/utils/copyDir.ts:3`                         |
| `7050b9b5b` / #7212 | 採用：切割拒絕分成 target-not-found、reference-without-range、no-duration、outside-clip；route 點名原因與檔案。保留本線既有精確邊界比較，不順帶引入未審 epsilon 行為。                                                                                                                           | `7050b9b5b:packages/studio-server/src/helpers/sourceMutation.ts:421`                | `packages/studio-server/src/helpers/sourceMutation.ts:381`    |
| `b98718fe9` / #7211 | 部分採用：採 engine 的 setup timeout headline／hint／transient 分類；零時長只用於 runtime ready。上游 CLI COMPOSITION_SETUP_TIMEOUT wire 尚不存在於本線 content-free audio diagnostic，不另建診斷協定。                                                                                          | `b98718fe9:packages/engine/src/services/frameCapture.ts:1892`                       | `packages/engine/src/services/frameCapture.ts:1882`           |
| `18513d46d` / #7221 | 採用：取消先改 cancelled，再有界等 adapter stop settle；最多 45000ms，回應反映 settle 後狀態，finally 清 timer。                                                                                                                                                                                 | `18513d46d:packages/studio-server/src/routes/render.ts:61`                          | `packages/studio-server/src/routes/render.ts:52`              |
| `7bebcb9fc` / #7218 | 不適用：本線沒有 reverse-any-video／style-sampling；media-use 的 Cost 規則已要求代理主動選擇的付費呼叫先確認，沒有 Never tell prices 的禁止告知政策。不以措辭補丁覆蓋現行較明確的費用授權規則。                                                                                                  | `7bebcb9fc:skills/media-use/SKILL.md:40`                                            | `skills/media-use/SKILL.md:38`                                |
| `ada71da92` / #7222 | 採用：capture plate／scroll tile 與一般 snapshot frame 共用一次 transient 重試；第二次失敗保留第一錯誤。未搬舊 snapshot 測試的 rename，因本線原無該檔；新增 helper 測試，不刪既有檔案。                                                                                                          | `ada71da92:packages/cli/src/utils/screenshotOnceMore.ts:4`                          | `packages/cli/src/utils/screenshotOnceMore.ts:4`              |
| `659ef568d` / #7228 | 採用：ffprobe 讀 display matrix／rotate tag；先套 pixel aspect ratio 再換直向尺寸，producer hints 採 displaySize。只補 #6772 的 metadata parser helper 先決，不引入其餘渲染管線。                                                                                                                | `659ef568d:packages/engine/src/utils/ffprobe.ts:869`                                | `packages/engine/src/utils/ffprobe.ts:841`                    |

### 依賴、monitored 與既有延後

- #7182：等待長來源分段複本與本線管線的整合及長片驗收；這些修正不依賴它。
- #7176：遙測仍等待既有政策決定，不順帶變更遙測邊界。
- #7104／#7168 retry：仍需新的 session 重試與所有權／取消／deadline 回歸成組成立；setup timeout 診斷不需要該機制，因此獨立採用，逾時策略保持原判定。
- #6716：只保留既有 cache-dir helper；17 檔路徑遷移仍待 Windows 私有快取根與 guard 測試對齊，沒有引入依賴它的新功能。
- #7228 的先決僅為 `54c98b590:packages/engine/src/utils/ffprobe.ts:848` 的 `parseSampleAspectRatio` 與 metadata 欄位，不採用 #6772 的其他行為。
- #7038 以唯讀 PR metadata 與完整 diff 重審：head `4eaa2558213300972e495b0791036b02cd0c23fe` 未變，仍為 draft，狀態由 open 改 closed，`mergedAt: null`；不移植未合併優化，若以新 PR 合併再驗 still-frame／scroll offset／GSAP 同時間回呼與 Windows 像素一致性。monitored 重釘 closed，總數維持 92。
- 沒有新增、修改或重生 golden／LFS pointer；要上傳的 LFS 物件：無。保留已修正的 #6665 pointer。沒有採用上游 release、npm publish 或官方發布 guard 變更。

### 回歸、完整套件與閘門

乾淨對照由 `git archive HEAD` 建立，HEAD 為 `12c05b9ea32f737b1f410396171964304d29505a`；workspace junction 指向各自樹內套件，外部依賴沿用同一安裝。core、engine、studio-server、CLI、producer 的 dist 各自重建；乾淨樹另建 parsers／lint，未變更的 Studio 等 dist 沿用同一 HEAD 的既有建置。原生檔案 symlink 仍受 Windows 權限限制，archive 的兩筆目錄 symlink 以樹內 junction 還原。

所有命令、exit code、開始時間、輸出與完整輸入 SHA256 在 `tmp/upstream-20261106/resume/`；`inputs.json` 保存開始狀態，`final-inputs.json` 保存交付狀態。測試輸出不納入版本控制。

#### 舊碼紅／移植碼綠

| 回歸                         | 舊碼 pass/fail/skip                                              | 移植碼 pass/fail/skip                 | 判讀                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| #7191 DOM journal            | 109/4/0                                                          | 113/0/0                               | 4 例舊碼失敗，移植 exit 0                                                                                                    |
| #7211、#7228 engine metadata | 203/6/0                                                          | 209/0/0                               | 6 例舊碼失敗，移植 exit 0                                                                                                    |
| #7214、#7089、#7222 CLI      | 88/9/2，另 screenshotCapture 30/2/1                              | 129/0/3                               | 舊碼共 11 例失敗；移植 exit 0。首次紅燈樹缺 generated 模組的載入錯誤不作行為證據，補齊 HEAD generated 模組後只重跑受影響檔案 |
| #7212、#7221 Studio server   | 249/11/0                                                         | 257/3/0                               | 8 例新增失敗消除；其餘 3 例 backup ENOTDIR 預期在兩樹均失敗。新增行為聚焦 41/0/219、exit 0                                   |
| #7222 screenshot helper      | 舊碼由 screenshotCapture／coreExtractionPhase 的真實呼叫路徑重現 | 4/0/0                                 | 新 helper 測試 exit 0，不以缺新函式的 import 錯誤當紅燈                                                                      |
| #7228 producer display hints | deepStrictEqual 失敗，exit 1                                     | `phone display hints: passed`，exit 0 | 同一輸入在舊碼為 1920×1080，移植碼為 1080×1920                                                                               |

focused 命令為各 package 中 `bun x vitest run <上述 result.json 的完整檔案清單> --maxWorkers=1 --reporter=json --outputFile=<report>`；手機 hints 為 `bun tmp/upstream-20261106/resume/phone-hints.mjs head|port`。紅燈所用新增測試與移植樹相同；新碼綠燈後未改產品程式。

#### 完整套件的雙樹逐名比較

core／engine／CLI／studio-server／studio／lint 分別執行 `bun run test --maxWorkers=2 --reporter=json --outputFile=<report>`。producer Vitest 用 `node scripts/run-test-lane.mjs unit vitest`；Bun 用相同 `test-classification.mjs` discovery、unit no-network preload 與全新行程逐檔執行，失敗檔不會中止後續檔案。每個 suite overall cap 3600 秒、Bun 每檔 cap 300 秒；timeout 只表示未完成。

| 套件            | 乾淨 HEAD pass/fail/skip | 移植 pass/fail/skip | exit HEAD/移植            | 原始僅移植失敗 | 覆驗後未解差異                          |
| --------------- | ------------------------ | ------------------- | ------------------------- | -------------- | --------------------------------------- |
| core            | 5578/0/11                | 5583/0/11           | 0/0                       | 0              | 0                                       |
| engine          | 2609/3/53                | 2614/5/53           | 1/1                       | 5              | 0；2 檔雙樹皆 25/0/0                    |
| cli             | 6183/35/303              | 6207/29/305         | 1/1                       | 0              | 0                                       |
| studio-server   | 1487/23/61               | 1490/23/61          | 1/1                       | 0              | 0                                       |
| studio          | 7936/231/2               | 7938/229/2          | 1/1                       | 0              | 0                                       |
| lint            | 1244/1/0                 | 1244/1/0            | 1/1                       | 0              | 0                                       |
| producer-vitest | 1136/2/5                 | 1136/3/5            | 1/1                       | 1              | 0；同名 stall 在 HEAD 6/1/0、移植 7/0/0 |
| producer-bun    | 875/8/0                  | 875/8/0             | 3 檔 nonzero/3 檔 nonzero | 0              | 0                                       |

完整套件有 fail／suite setup error，不能以聚焦覆驗替代完整套件綠燈；逐名原始差集與覆驗各自保留。engine 的原始 5 筆差異為 audioMixer.grouping 1 例、parallelCoordinator-peerAbort 4 例，雙樹單獨重跑均 25 passed；沒有修改程式或放寬 timeout。producer 的原始 1 筆 stall 差異在乾淨 HEAD 單獨重現相同 pending/completed 斷言失敗（6 passed／1 failed），移植樹單獨為 7 passed／0 failed。覆驗後沒有只在移植樹失敗的未解項目，這不把原始完整套件結果改為通過。

失敗清單 SHA256（排序後每行一筆，含 suite setup error）：

| 套件            | HEAD                                                               | 移植                                                               |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| core            | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| engine          | `09f7fa3b48c777fa7d325b260c08540ae703fc8275850a722dfe48037e290dc1` | `d72259399024826bb41c3df0bd9b34d15daab8960addfe70567857eabbd7e9a1` |
| cli             | `1a7a3899d0b71298d0cdf7cea3453d9ee502609fd340b1b4ff84be2b568d113c` | `569ef0a6c85b35b859edc7625bc41a9d24e762c6d3226e9743a4d341c274da6f` |
| studio-server   | `90f4ced7bb29e78b3e7d6be8db7a6ef7d548b8f678be3cceea7125425d24d75c` | `90f4ced7bb29e78b3e7d6be8db7a6ef7d548b8f678be3cceea7125425d24d75c` |
| studio          | `a84d10d3c5aecd4403d58b146a0225c3f320640cb721db78c93db85227ecdd99` | `85f011095edb5f83eb6e721503f151711046c48974714f93ca5df27e38cc1b28` |
| lint            | `4c4f0ddbaea3c111a48bacd0214ba6cfde022835ff9fdbaeb534181faf1ddb06` | `4c4f0ddbaea3c111a48bacd0214ba6cfde022835ff9fdbaeb534181faf1ddb06` |
| producer-vitest | `cf5bfa101f1a9759ba4ec24647c020fa65d26cf2d7d5ff7a15a9225bd9842897` | `c2aa35130ceea6cdaf1387a4afd8be65f20c96d4b4884661d4d50579b0822806` |
| producer-bun    | `9d168bbad1412a45904a6c0945fb4b85f560fa8ccfade6e42d03b22f2cd177af` | `9d168bbad1412a45904a6c0945fb4b85f560fa8ccfade6e42d03b22f2cd177af` |

#### 維護與靜態閘門

- `pwsh -NoProfile -File tools/dev_check.ps1`：exit 0，39 passed，相對連結 0 錯誤，`WINDOWS DEV CHECK GREEN`。
- lefthook 三組 `node node_modules/typescript/bin/tsc --noEmit -p packages/core/tsconfig.json`、`packages/studio/tsconfig.json`、`scripts/tsconfig.json`：全部 exit 0。
- 額外 CLI typecheck：雙樹 exit 2，診斷逐字一致；`check.test.ts:2265` 的 deadline 可能 undefined，`:3760`／`:3761` 呼叫多傳參數。
- `node_modules/.bin/fallow audit --base origin/main --fail-on-issues`：exit 0，`No issues`；變更 TS 的 oxlint exit 0，0 warnings／0 errors。
- Markdown／MDX 使用空 ignore 檔明確執行 oxfmt，避免既有 `.prettierignore` 的 `docs/` 排除；僅保留新增段落的格式化，既有清冊與日期快照不重排。
- core packed 預算只增加 #7191 在本線的 1065-byte 增量（1661748 → 1662813）；`listPackageSizeIssues` 對移植 core 回傳 `[]`。CLI packed／unpacked 在乾淨 HEAD 已超標，沒有調高其預算。

#### 水位 659ef568d 時點的剩餘快照

`python tools/check_upstream_updates.py --strict` exit 1：2026-11-06 收尾快照剩 36 個 commit（從 `b96d3c8` #7231 起）、85 筆 PR（#7190 以上）、9 筆 issue（#7223 以上）；92 筆 monitored 無差異。commit 只推進連續 15 筆至 `659ef568d`；PR／issue 水位不以已審 commit 的 PR 清單代替連續審查。ROADMAP 近期列保留。

上游作者：Miguel Ángel（#7214、#7212、#7221、#7222、#7228）、WaterrrForever（#7089）、Vance Ingalls（#7191）、James Russo（#7211）。作者 email 只放在提交訊息的 Co-authored-by，不寫入文件。

## 2026-11-06：接續至 `0a6746e1d`，審查 15 個連續 commit

以 fork `d599288fdc62dfe1073210b1dd1dba1b2ade95d3` 為起點，逐筆讀 `659ef568d..0a6746e1d` 的完整補丁；唯讀 GraphQL 取得 PR state、head 與 mergeCommit。採用／部分採用 11 組修正，另補 #6707 先決。水位表示連續審查，包含有條件延後與不適用。

| Commit／PR         | 裁決與重訪條件                                                                                                                                                                                                                                                                                | 上游證據                                                                     | fork 證據                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `b96d3c8bd`／#7231 | 採用並補齊已合併先決 #6707：重播重疊 tween 的跳過幀；proxy 的 overlap／landing mark 均以真 timeline 為 owner，root 與 scene 帶 export fps。                                                                                                                                                   | `b96d3c8bd:packages/core/src/runtime/adapters/gsap.ts:162`                   | `packages/core/src/runtime/adapters/gsap.ts:150`                   |
| `0180c603d`／#7217 | 採用：template entry 在共享 compile stage 解析，distributed plan 與本機 render 共用 index shell／獨立 duration；保留本線私有快取守衛。                                                                                                                                                        | `0180c603d:packages/producer/src/services/render/stages/compileStage.ts:161` | `packages/producer/src/services/render/stages/compileStage.ts:160` |
| `ecf0e1438`／#7224 | 採用：明確設定 HYPERFRAMES_CACHE_DIR 時搬移 preview state、registry、model、catalog、catch-up；空 catalog override 視為未設定。沒有擴成 #6716 的全部遷移。                                                                                                                                    | `ecf0e1438:packages/core/src/cacheDir.ts:9`                                  | `packages/core/src/cacheDir.ts:9`                                  |
| `b7a8cfa73`／#7225 | 延後：依賴尚缺的 #6912（e181d34ed）WebKit decode-first／element-to-buffer 接管管線，並有後續 #7232 的記憶體預算修正。需成組移植並驗證未知 duration 共用 source、長音訊記憶體上限、變速與 Safari 音訊時鐘；不單獨加 600 秒常數。                                                               | `b7a8cfa73:packages/core/src/runtime/init.ts:505`                            | `packages/core/src/runtime/webAudioTransport.ts:231`               |
| `216395e98`／#7229 | 部分採用：HyperFrames config／install-state、project links、Cloud Run state、running CLI／updater 與兩份 media-use telemetry 讀同一設定根，缺檔只 COPYFILE_EXCL seed，保留 opt-out；未登記 running 不啟動背景 installer。auth/paths 仍依本線 HEYGEN_CONFIG_DIR，不引入缺失的 OAuth 環境遷移。上游同時修改的 `packages/cli/src/utils/autoUpdate.invocation.test.ts` 在本線不存在，不移植。 | `216395e98:packages/cli/src/utils/configDir.ts:12`                           | `packages/cli/src/utils/configDir.ts:12`                           |
| `2af37ac0c`／#7233 | 採用：video 與 container 都無 duration 時，以 packet 最大結束時間補足；只留 64 KiB 尾端，丟棄切半行，缺 packet duration 用一幀。                                                                                                                                                              | `2af37ac0c:packages/engine/src/utils/ffprobe.ts:1128`                        | `packages/engine/src/utils/ffprobe.ts:1099`                        |
| `5f7b85c5d`／#7226 | 不適用：本線沒有 billing 指令／checkout 管線；先前 #7216／#7099 裁決不變。若導入該功能，須同採付款前重新讀帳戶、無法定價拒絕與取消契約，並保留明確費用授權。                                                                                                                                  | `5f7b85c5d:packages/cli/src/commands/billing.ts:89`                          | `packages/cli/src/cli.ts:190`                                      |
| `45705fa25`／#7230 | 不適用：整版 v0.9.16 發行 metadata／changelog，fork 未整版同步，不冒稱該版本；保留作者、官方連結與發佈 guard。                                                                                                                                                                                | `45705fa25:packages/core/package.json:3`                                     | `packages/core/package.json:3`                                     |
| `5ee9e928d`／#7234 | 部分採用：core、snapshot、engine extraction 與 Studio proxy 只在所有 SPS/keyframe transfers 都是 HLG 時用 203 nit，混合 PQ／SDR 或未讀出仍 100 nit；失敗 probe 不快取。measure 子系統不存在，該兩檔不適用。                                                                                   | `5ee9e928d:packages/core/src/hdrToneMap.ts:15`                               | `packages/core/src/hdrToneMap.ts:15`                               |
| `f55990ebc`／#7236 | 採用：fetch cause 只公開 /^[A-Z][A-Z0-9_]{2,40}$/ code，保留明確 suggestion 優先，拒絕含路徑的 free text。                                                                                                                                                                                    | `f55990ebc:packages/cli/src/cloud/errors.ts:60`                              | `packages/cli/src/cloud/errors.ts:60`                              |
| `80e02e74a`／#7239 | 採用：lint 與 publish 共用 gitignore matcher，掃 compositions 時跳過被忽略目錄；新增 lint 的 ignore 宣告及鎖檔 workspace edge，版本沿用既有相容線。Windows 測試補齊 dirname import。                                                                                                          | `80e02e74a:packages/lint/src/projectIgnore.ts:8`                             | `packages/lint/src/projectIgnore.ts:8`                             |
| `df54f380c`／#7235 | 採用：info --media 輸出 render 實際混音清單，含 scene host 的 film-clock offset，依來源長度截尾並重用 probe；文件同步旗標與 heard 欄位。                                                                                                                                                      | `df54f380c:packages/cli/src/utils/projectMedia.ts:50`                        | `packages/cli/src/utils/projectMedia.ts:49`                        |
| `c1977fab3`／#7244 | 採用：只靜默 uv_os_setpriority 的 EPERM／EACCES（info.code）；其餘錯誤仍點名，lint 繼續。                                                                                                                                                                                                     | `c1977fab3:packages/cli/src/renderSetupWorker.ts:23`                         | `packages/cli/src/renderSetupWorker.ts:22`                         |
| `b7d72c947`／#7245 | 採用並補必要副本取消先決：--budget 保留 10 秒回報時間，deadline 涵蓋啟動／copies／samples，副本只用剩餘預算；逾時回部分 report 與 check_budget_reached，停止 optional crops。適配本線既有固定 idle window；不引入 render retry。                                                              | `b7d72c947:packages/cli/src/utils/checkDeadline.ts:52`                       | `packages/cli/src/utils/checkDeadline.ts:49`                       |
| `0a6746e1d`／#7247 | 延後：依賴未採的 #6621（e2c915132）CLI unknownSubcommand／path／presented-error 契約；本線 resolver 僅回 command／parent，不能直接搬 helper 而讓 CLI 永遠不呼叫它。與該解析契約成組移植，驗未知 root／group／flag 的 exit 2、精簡 stderr、JSON hint 與 skill 路徑後重訪。                     | `0a6746e1d:packages/cli/src/cli.ts:540`                                      | `packages/cli/src/utils/commandUsageResolution.ts:5`               |

### 先決與保留分歧

#6707（`fa9acbd73`）已合併，重疊 property spans 與 fps 重播是 #7231 的必要先決，一併採用；沒有它時非 proxy 的 8-worker／chunk／host-offset 測試也失敗。兩個補丁的原始碼與測試均逐筆讀取，不以 proxy-only 修正冒充完整修復。

#7182 的長來源分段複本在來源窗口、快取與離線長片測試齊備後重訪；#7176 的遙測變更等維護者採用遙測政策後重訪；#7104／#7168 retry 等新 session 所有權、取消與一次性重試完整契約齊備後重訪；#6716 的 17 檔遷移等 Windows 私有快取根與整套 guard 測試齊備後重訪。所採用內容不依賴這四項，沒有藉 cache override 把它們一併搬入。

#7234 不導入本線沒有的 measure；#7229 保留 HeyGen credential 根，其他 HyperFrames 設定可遷移，缺檔 seed 不覆蓋目標。Node telemetry fixture 同時設定 HOME／USERPROFILE 並清除 config override，讓 Windows 的 homedir 確實隔離。

15 個補丁沒有修改 golden／output 或 LFS pointer；#6665 已採用的 golden pointer 保留。新增需上傳的 LFS 物件：無。

### PR 軸與 monitored

PR 軸從實際 baseline #7190 接續；#7191–#7231 範圍逐項如下。merged 的產品裁決以既有節及上述 commit 表為準；closed 未合併不採用，open 只釘 head。

| PR                                                           | 狀態／裁決                                                                                         | fork 證據／重訪條件                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [#7191](https://github.com/heygen-com/hyperframes/pull/7191) | MERGED；沿用 DOM journal 已採用                                                                    | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7192](https://github.com/heygen-com/hyperframes/pull/7192) | MERGED；整版 release 不適用                                                                        | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7194](https://github.com/heygen-com/hyperframes/pull/7194) | MERGED；沿用 Windows browser install 有界重試已採用                                                | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7195](https://github.com/heygen-com/hyperframes/pull/7195) | MERGED；沿用 paused-scene release 已採用                                                           | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7196](https://github.com/heygen-com/hyperframes/pull/7196) | MERGED；沿用 skills 文件已採用                                                                     | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7197](https://github.com/heygen-com/hyperframes/pull/7197) | MERGED；官方下載歸因不適用                                                                         | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7198](https://github.com/heygen-com/hyperframes/pull/7198) | CLOSED；closed 未合併的 generated client，不採用                                                   | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7199](https://github.com/heygen-com/hyperframes/pull/7199) | MERGED；沿用 delivery PCM 已採用                                                                   | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7201](https://github.com/heygen-com/hyperframes/pull/7201) | MERGED；沿用 lint-verbose 已採用                                                                   | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7202](https://github.com/heygen-com/hyperframes/pull/7202) | MERGED；整版 release 不適用                                                                        | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7203](https://github.com/heygen-com/hyperframes/pull/7203) | MERGED；延後：等 producer reference-background 契約                                                | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7205](https://github.com/heygen-com/hyperframes/pull/7205) | MERGED；沿用 contrast motion 已採用                                                                | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7206](https://github.com/heygen-com/hyperframes/pull/7206) | CLOSED；closed 未合併的 generated client，不採用                                                   | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7207](https://github.com/heygen-com/hyperframes/pull/7207) | MERGED；延後：generated schema／gateway 成組對齊                                                   | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7208](https://github.com/heygen-com/hyperframes/pull/7208) | OPEN；上游合併後核對 doctor 只讀診斷、FFmpeg 提示與 skill budget                                   | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7209](https://github.com/heygen-com/hyperframes/pull/7209) | OPEN；上游合併後驗 first-pass hide 在 volume sweep 的 detach／restore 與 preview/render 同時間像素 | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7210](https://github.com/heygen-com/hyperframes/pull/7210) | MERGED；沿用 timing lint 與文件已採用                                                              | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7211](https://github.com/heygen-com/hyperframes/pull/7211) | MERGED；沿用 setup timeout 診斷已採用                                                              | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7212](https://github.com/heygen-com/hyperframes/pull/7212) | MERGED；沿用 cut 拒絕診斷已採用                                                                    | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7213](https://github.com/heygen-com/hyperframes/pull/7213) | CLOSED；closed 未合併；不改 pre-capture RAF，若新 PR 合併再驗 deterministic first seek             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7214](https://github.com/heygen-com/hyperframes/pull/7214) | MERGED；沿用 apply 最終 overlap 已採用                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7215](https://github.com/heygen-com/hyperframes/pull/7215) | OPEN；上游合併後驗帶 MIME 參數／換行 base64 的拒絕與正常相對路徑                                   | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7216](https://github.com/heygen-com/hyperframes/pull/7216) | MERGED；billing 不存在，不適用                                                                     | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7217](https://github.com/heygen-com/hyperframes/pull/7217) | MERGED；見上述 commit 裁決與原始碼行號                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7218](https://github.com/heygen-com/hyperframes/pull/7218) | MERGED；沿用明確費用授權，不採代付措辭                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7219](https://github.com/heygen-com/hyperframes/pull/7219) | MERGED；延後：Windows builder／manifest 與 raster/path 像素驗收                                    | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7220](https://github.com/heygen-com/hyperframes/pull/7220) | MERGED；延後：隔離實體磁碟根目錄舊紅新綠                                                           | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7221](https://github.com/heygen-com/hyperframes/pull/7221) | MERGED；沿用 cancel settle 已採用                                                                  | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7222](https://github.com/heygen-com/hyperframes/pull/7222) | MERGED；沿用 screenshot 一次重試已採用                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7224](https://github.com/heygen-com/hyperframes/pull/7224) | MERGED；見上述 commit 裁決與原始碼行號                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7225](https://github.com/heygen-com/hyperframes/pull/7225) | MERGED；見上述 commit 裁決與原始碼行號                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7226](https://github.com/heygen-com/hyperframes/pull/7226) | MERGED；見上述 commit 裁決與原始碼行號                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7227](https://github.com/heygen-com/hyperframes/pull/7227) | OPEN；目前 open；#7231 已採替代修正，若此 PR 合併或 head 變動再比對重疊 DOM tween／proxy 像素      | `packages/core/src/runtime/adapters/gsap.ts`        |
| [#7228](https://github.com/heygen-com/hyperframes/pull/7228) | MERGED；沿用 display-size parser 已採用                                                            | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7229](https://github.com/heygen-com/hyperframes/pull/7229) | MERGED；見上述 commit 裁決與原始碼行號                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7230](https://github.com/heygen-com/hyperframes/pull/7230) | MERGED；整版 release 不適用                                                                        | `tools/upstream_baseline.json` 與本清冊各 commit 表 |
| [#7231](https://github.com/heygen-com/hyperframes/pull/7231) | MERGED；見上述 commit 裁決與原始碼行號                                                             | `tools/upstream_baseline.json` 與本清冊各 commit 表 |

monitored 由 92 增為 96 筆，新增以下 4 筆；既有 92 筆不因推進 PR 軸而刪除。

| PR    | pinned head／state                               | 重訪條件                                                                                     |
| ----- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| #7208 | `d22212561cda630ffafe8a0ae633ad4c5811a9fc`／open | 上游合併後核對 doctor 只讀診斷、FFmpeg 提示與 skill budget                                   |
| #7209 | `bdd3922759527d606b8023b88e1a47c28f8abb93`／open | 上游合併後驗 first-pass hide 在 volume sweep 的 detach／restore 與 preview/render 同時間像素 |
| #7215 | `85309fdbdd814186638df3e8ade5fe7f2d35b53d`／open | 上游合併後驗帶 MIME 參數／換行 base64 的拒絕與正常相對路徑                                   |
| #7227 | `9b646ef59ffaa140f4f908331461ded47614cad1`／open | 目前 open；#7231 已採替代修正，若此 PR 合併或 head 變動再比對重疊 DOM tween／proxy 像素      |

上游作者：Miguel Ángel、Jerrai。作者 email 只放在提交訊息的 Co-authored-by，不寫入文件。

### 聚焦回歸、先紅後綠與建置

原始命令、exit code、JSON reporter、逐名失敗清單與 SHA-256 證據存於忽略目錄 `tmp/upstream-20261106-b96/`。舊碼使用 `git archive HEAD` 的 `d599288fd`，只換入最終測試與 test helper 後執行，隨即還原原始 bytes；另保留產品移植前的實際紅燈輸出。

| 範圍／命令（套件 cwd）                                                                                                                                              | 舊碼 pass／fail／skip                       | 新碼 pass／fail／skip | Exit 舊／新 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------- | ----------- |
| core：`bun x vitest run src/cacheDir.test.ts src/hdrToneMap.test.ts src/runtime/adapters/gsap.order.test.ts src/runtime/adapters/gsap.steps.test.ts --maxWorkers=2` | 81／10／0                                   | 91／0／0              | 1／0        |
| CLI：14 個變更測試檔，`bun x vitest run <files> --maxWorkers=2`                                                                                                     | 432／21／2，另缺新 helper 的 suite 收集錯誤 | 455／0／2             | 1／0        |
| lint：`bun x vitest run src/project.test.ts --maxWorkers=2`                                                                                                         | 75／1／0                                    | 76／0／0              | 1／0        |
| producer：compileStage 與 mediaType，`bun x vitest run <files> --maxWorkers=2`                                                                                      | 1／20／0（含新介面未提供路徑與缺 resolver） | 21／0／0              | 1／0        |
| engine：ffprobe、videoFrameExtractor 與 concurrency 3 檔，`bun x vitest run <files> --maxWorkers=2`                                                                 | 340／6／7                                   | 346／0／7             | 1／0        |
| Node：local-media-search 與兩份 telemetry，`node --import ./packages/cli/scripts/test-home.mjs --test <3 files>`                                                    | 34／3／0                                    | 37／0／0              | 1／0        |

producer template plan 的實際行為另以分類指定的 integration／bun runner 驗證：舊碼 `HYPERFRAMES_TEST_LANE=integration bun test src/services/distributed/plan.test.ts -t 'template sub-composition entry'` 為 0 passed／2 failed；共享 compile 修正後兩例均通過。該檔全套移植樹 71 passed／3 failed，乾淨 HEAD 69 passed／3 failed，同名三例為既有 stitched mp4 loudness／encode 長度失敗。mediaType 依分類的 integration／Vitest 全檔雙樹均 exit 0。

初次把 plan 交給 Vitest 時因該檔使用 bun:test 而無法收集，exit 1，不列入驗收；隨即改由 repo 的 `discoverProducerTests()` 取得 runner／lane。完整 unit 的 Vitest 使用 `node scripts/run-test-lane.mjs unit vitest`；bun 使用同一分類清冊、unit 環境與 no-network preload，每檔 fresh process，失敗後仍跑完全部 52 檔。分類 gate 為 7 passed／0 failed，172 檔均有分類。

`bun run --cwd packages/{core,lint,producer,studio-server,cli,engine} build` 各自執行成功。乾淨樹另外重建 parsers、studio、inspector、player 的 dist，再完成 CLI copy；初次缺少 dist 的建置失敗只視為前置條件缺失，沒有改產品來略過。archive 中 packages／scripts 的 5153 個原始碼與設定檔逐檔比對原 tar bytes，差異 0；第三方依賴以 junction 共用，workspace links 指向乾淨樹自己的 packages。

三組 lefthook typecheck（core、studio、scripts）皆 exit 0。額外 CLI typecheck 雙樹 exit 2，只有相同三筆既有診斷：deadline 可能 undefined、兩個呼叫多傳一個參數；移植樹行號 2287／3834／3835，HEAD 為 2265／3760／3761。

`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0：81 changed files、No issues；dead code／complexity／duplication 均為 0。變更 TS／MJS 的 oxlint exit 0，72 files、0 warnings／0 errors。CLI process ownership、workspace contracts、skill mirror、core skills 與 skills manifest 皆 exit 0。

### Monitored #6904 的 head 變動

strict 快照發現 #6904 由 `843a29d0aa44bed346fbf425e25339dbeec9beb3` 變為 `fa3302b927d8c4542a276c199d1620978797b718`，仍 open、非 draft、mergedAt 為 null。已讀完整 3 檔 diff：`discover.test.ts` 新增 style-only callback、插入 sibling 的 element identity、真正由 callback 驅動 geometry 的三種案例；`discover.ts` 的 `readStepGeometry`／`boxesDiffer` 改以 HTMLElement identity 追蹤 boxes；`index.test.ts` 補 capture／filter 不重播 style-only callback 的斷言。上游證據為 [PR #6904 files](https://github.com/heygen-com/hyperframes/pull/6904/files)（head 如上，`packages/core/src/runtime/captureMotionBlur/discover.ts:51`／`:304`）；fork 為 `packages/core/src/runtime/captureMotionBlur/discover.ts:184`，仍是本線的 discovery 契約。

維持延後、不移植 open PR；head 已重釘，monitored 仍 96 筆。上游合併後，須連同本線的 DOM journal／seek restore 驗相同元素的幾何、style-only callback 次數、插入 sibling 與 capture/filter 前後像素，再判斷採用。

### 套件大小與預算缺口

雙樹以相同 `pnpm pack --json --pack-destination <ignored directory>` 量測，未安裝依賴或產生 pnpm 鎖檔；不是改用 pnpm 管理 workspace。判定使用 repo 的 `listPackageSizeIssues` 與原有 1% 容差。

| 套件          | HEAD packed／unpacked | 移植 packed／unpacked | 預算判定                                      |
| ------------- | --------------------- | --------------------- | --------------------------------------------- |
| core          | 1678498／4048191      | 1680858／4054737      | 新增 packed 超標；原 packed 預算 1662813 保留 |
| engine        | 458388／1524987       | 458963／1527263       | 通過                                          |
| cli           | 8487349／24160972     | 8494195／24173272     | 雙樹原有 packed／unpacked 超標，沒有調高      |
| producer      | 832683／3005281       | 833342／3007116       | 通過                                          |
| studio-server | 153477／597311        | 154765／597793        | 通過                                          |
| lint          | 180384／694438        | 180663／695324        | 通過                                          |

15 筆上游補丁與 #6707 都沒有改 `scripts/package-size-budgets.json`，沒有可直接照搬的上游預算增量。core 同一批產品修正的實測 packed 增量為 2360 bytes；若沿用前一節的實測增量方法，packed 預算為 1665173 時 `listPackageSizeIssues` 回 `[]`。目前預算保持 1662813，core 的新增超標仍是產品驗收缺口，不以假稱上游已調預算或放寬容差處理。

### 完整套件與乾淨 HEAD 的逐名比較

同一次雙樹完整測試的原始 reporter 與命令保留於 `tmp/upstream-20261106-b96/`；沒有重跑已完成的完整套件。下表數字為 pass／fail／skip，exit 依實際 runner 記錄；suite setup error 另外列出，不把 0 個 assertion failure 誤當 exit 0。

| 套件／runner（套件 cwd）                                           | 乾淨 HEAD     | 移植樹        | Exit HEAD／移植                              | 原始只在移植樹失敗 | 聚焦覆驗後未解差異                             |
| ------------------------------------------------------------------ | ------------- | ------------- | -------------------------------------------- | ------------------ | ---------------------------------------------- |
| core：`bun run test --maxWorkers=2`                                | 5583／0／11   | 5594／0／11   | 0／0                                         | 0                  | 0                                              |
| engine：`bun run test --maxWorkers=2`                              | 2619／0／53   | 2622／0／53   | 1／1                                         | 0                  | 0；兩邊均有 undecodableTrack suite setup error |
| CLI：`bun run test --maxWorkers=2`                                 | 6201／35／305 | 6227／29／305 | 1／1                                         | 0                  | 0                                              |
| Studio：`bun run test --maxWorkers=2`                              | 7938／229／2  | 7938／229／2  | 1／1                                         | 0                  | 0；另各 16 todo                                |
| lint：`bun run test --maxWorkers=2`                                | 1244／1／0    | 1245／1／0    | 1／1                                         | 0                  | 0                                              |
| Studio-server：`bun run test --maxWorkers=2`                       | 1490／23／61  | 1490／23／61  | 1／1                                         | 0                  | 0                                              |
| producer unit Vitest：`node scripts/run-test-lane.mjs unit vitest` | 1139／2／5    | 1141／3／5    | 1／1                                         | 1（stall）         | 0；stall 雙樹聚焦各 7／0／0                    |
| producer unit bun：分類清冊逐檔、unit 環境、no-network preload     | 875／8／0     | 875／8／0     | 3 個檔 exit 1，其餘 49 檔 exit 0（兩樹相同） | 0                  | 0；52 檔全部執行                               |
| producer integration bun：`plan.test.ts`                           | 69／3／0      | 71／3／0      | 1／1                                         | 0                  | 0                                              |

`comparison.json`、`cli-compare.json`、`producer-bun-compare.json` 與兩邊逐名的 `*.failures.json` 是原始差集；producer Vitest 的 stall 差異保留，沒有從總數刪掉。該檔雙樹聚焦 reporter `head-stall.tests.json`／`port-stall.tests.json` 都是 7 passed、0 failed；因此沒有未解的移植樹獨有失敗，但不能宣稱原始完整套件 0 fail。既有 symlink EPERM、media 檔名、Chrome 啟動、音軌與模擬 DOM 等失敗仍屬完整產品驗收限制。

舊 `inputs.json` 是產品移植前的工作樹快照，不能當成最終產品雜湊證明。收尾檢查確認所有受影響 package 的變更檔修改時間早於各自完整套件結束時間；這是時間序證據，不等同當時的最終輸入雜湊。另以 `closeout/focused-inputs.json` 釘目前 HEAD、全部 changed／untracked 輸入的 SHA-256，再執行受影響五組聚焦回歸，並保留各命令、exit 與 reporter；不冒稱舊完整套件具有當時未記錄的最終雜湊。

收尾聚焦回歸均 exit 0：core 91 passed／0 failed、CLI 455 passed／0 failed／2 skipped、lint 76 passed／0 failed、producer 21 passed／0 failed、engine 346 passed／0 failed／7 skipped；命令範圍與上方紅綠表相同。Node 的 local-media-search 與兩份 telemetry 沿用 37 passed／0 failed。產品程式及測試在釘雜湊後沒有變動；文件格式與證據補充另留最終雜湊清冊。

### 收尾閘門與水位界線

2026-11-06、fork HEAD `d599288fdc62dfe1073210b1dd1dba1b2ade95d3` 的收尾記錄位於 `tmp/upstream-20261106-b96/closeout/`：`pwsh -NoProfile -File tools/dev_check.ps1` exit 0（39 passed、0 failed；`WINDOWS DEV CHECK GREEN`）；lefthook 的 core、studio、scripts 三組 `node node_modules/typescript/bin/tsc --noEmit -p <path>` 均 exit 0；`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0（82 changed files，No issues；dead code／complexity／duplication 各 0）。只讀取／測試，沒有執行 lefthook 內會 staging 的 format job。

### 水位 `0a6746e1d` 時點的剩餘快照

2026-11-06 的 `python tools/check_upstream_updates.py --strict` exit 1；完整快照保存為 `closeout/strict-start.md`。上游 tip 為 `e2bb7da25da9d268e33d766683885ad69b088169`，水位以上 31 個 commit（自 `644b166` #7250 起）、PR #7232 起 58 筆、issue #7259 起 9 筆；96 筆 monitored 中 #6695 的 open head 又由 `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66` 移動至 `3b2321c`。該新 diff 沒有裁決，保留原釘選，於 commit 軸到達後重審；不以未讀差異的 head 重釘讓 strict 歸零。

這是水位 `0a6746e1d` 的日期快照；較早各節只保留其日期快照。連續水位停在已具逐筆裁決的 15 個 commit（`git rev-list --count 659ef568d..0a6746e1d` 為 15），PR #7231、issue #7223 不變；不擴大至半成品以外的 commit。strict 與完整產品驗收尚未通過，ROADMAP 近期接續列保留。core 新增封裝超標也保留為驗收缺口；沒有調整容差或捏造上游預算增量。需上傳的新 LFS 物件：無。

## 2026-11-06：接續至 `b108f8512`，審查 8 個連續 commit

以 fork `2e34275fc` 為起點，只讀 `0a6746e1d..b108f8512` 的 8 個連續補丁，採用六筆獨立修正並補 #6829；另外兩筆依缺失子系統延後。唯讀 GraphQL 核對八個 PR 均 MERGED、mergeCommit 與指定 SHA 一致。原始補丁、PR JSON、測試 reporter 與命令 exit 保存在忽略目錄 `tmp/upstream-20261106-644/`。

| Commit／PR                                                                | 裁決與重訪條件                                                                                                                                                                                                                               | 上游證據                                                                   | fork 證據                                                   |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `644b166e7`／[#7250](https://github.com/heygen-com/hyperframes/pull/7250) | 採用：motion signature 將 SVG strokeDashoffset／strokeDasharray 納入 paint channel，draw-on 不再被 check 判成靜止。                                                                                                                          | `644b166e7:packages/cli/src/commands/motion-signature.browser.js:174`      | `packages/cli/src/commands/motion-signature.browser.js:170` |
| `0b3559824`／[#7248](https://github.com/heygen-com/hyperframes/pull/7248) | 採用並補已合併 #6829：bundler StaticGuard 與 lint 共用 linkedSources，讀本機 script 的 timeline 註冊；保留本線 template 遞迴、路徑解析及 1,000,000 字元掃描上限。                                                                            | `0b3559824:packages/core/src/compiler/staticGuard.ts:22`                   | `packages/core/src/compiler/staticGuard.ts:22`              |
| `a664f99ec`／[#7252](https://github.com/heygen-com/hyperframes/pull/7252) | 採用：PostCSS 逐個展開逗號 selector，opacity:0 與 transform 衝突檢查都涵蓋每個 subject；不以最後一個 selector 代替整組。                                                                                                                     | `a664f99ec:packages/lint/src/rules/gsap.ts:1021`                           | `packages/lint/src/rules/gsap.ts:993`                       |
| `d40d0b251`／[#7246](https://github.com/heygen-com/hyperframes/pull/7246) | 延後：本線沒有 #6940（d1d631f60）的 audioDeliveryLimit／browser true-peak limiter，現有 guard 是整體增益衰減；需連同 limiter 管線成組採用，驗真實 AAC 峰值 -1.2 至 -1 dBTP、重複輸出 bytes 與分散式 loudness。單搬重試上限不會修到現有流程。 | `d40d0b251:packages/producer/src/services/render/audioDeliveryLimit.ts:13` | `packages/producer/src/services/render/audioPadTrim.ts:386` |
| `5377b756b`／[#7238](https://github.com/heygen-com/hyperframes/pull/7238) | 採用：render／preview／snapshot 共用 snapped clip window；snapshot 從 composition 讀 fps 並傳給現有內嵌 video frame resolver，沒有搬入上游本線尚缺的 activeVideoAt／blur-overlay 重構。                                                      | `5377b756b:packages/core/src/runtime/clipWindow.ts:29`                     | `packages/core/src/runtime/clipWindow.ts:29`                |
| `600bfa451`／[#7232](https://github.com/heygen-com/hyperframes/pull/7232) | 延後：沿用 #7225／#6912（e181d34ed）的 WebKit decode-first 管線缺口；目前沒有 decodesFirst／isDecodedOrDecoding，不單獨加 256 MiB 估算。成組採用後驗 pending/cache 共用 source、650 秒／長來源、未知 duration、Safari 音訊時鐘與變速。       | `600bfa451:packages/core/src/runtime/webAudioTransport.ts:374`             | `packages/core/src/runtime/webAudioTransport.ts:231`        |
| `f98218a22`／[#7237](https://github.com/heygen-com/hyperframes/pull/7237) | 採用：檔案與記憶體 ZIP 使用同一 socket 進度看門狗，60 秒停滯後中止，同一 presigned URL 最多三次重送；403、不可讀檔案及取消不重試，保留簽章 headers／checksum／complete retry。                                                               | `f98218a22:packages/cli/src/cloud/upload.ts:91`                            | `packages/cli/src/cloud/upload.ts:91`                       |
| `b108f8512`／[#7251](https://github.com/heygen-com/hyperframes/pull/7251) | 採用：compiler 與 runtime 讓最外層 timed SVG scene 各有 id scope，第二幕重複的 gradient／clipPath／symbol 不再指向第一幕；共享 page-level 定義及既有 host scopes 保留。                                                                      | `b108f8512:packages/core/src/compiler/svgIdNamespacing.ts:421`             | `packages/core/src/compiler/svgIdNamespacing.ts:414`        |

### 先決、延後與 LFS

#6829 的 `0708f6ca7` 是已合併、有限且必要的先決：`0708f6ca7:packages/lint/src/project.ts:160` 的 collectExternalScripts、context 與 registry rules 一併採用；fork 對應 `packages/lint/src/project.ts:171`，本線沒有 projectFontFamilies bookkeeping，維持既有字型邏輯。外部 JS 僅作靜態掃描，不執行；沿用 `packages/parsers/src/assetResolution.ts:109` 的專案根路徑限制、模板走訪與 minified／過大檔案排除。新增 Classic／module 本機 script 兩例先紅後綠。

#7182：長來源分段複本及離線長片測試齊備後重訪；#7176：維護者決定遙測政策後重訪；#7104／#7168 retry：新 session 所有權、取消及一次性重試契約齊備後重訪；#6716 的 17 檔遷移：Windows 私有快取根及全套 guard 測試齊備後重訪。六筆採用內容均不依賴這四項，沒有一併擴大移植。

八個補丁及 #6829 均無 golden／LFS pointer 變更；保留 #6665 的既有 golden。需上傳的新 LFS 物件：無。

### PR 軸與 monitored

實際起始 PR 水位為 #7231，沒有退回 #7189。PR #7232–#7238 全部已合併：#7232 依上表延後；#7233（`2af37ac0c:packages/engine/src/utils/ffprobe.ts:1128` → fork `packages/engine/src/utils/ffprobe.ts:1099`）、#7234（`5ee9e928d:packages/core/src/hdrToneMap.ts:15` → fork 同檔 `:15`）、#7235（`df54f380c:packages/cli/src/commands/info.ts:100` → fork `packages/cli/src/commands/info.ts:100`）與 #7236（`f55990ebc:packages/cli/src/cloud/errors.ts:60` → fork 同檔 `:60`）沿用上一節完整補丁及既有採用裁決；#7237／#7238 見上表。PR 水位因此連續至 #7238，issue 維持 #7223。

monitored 維持實際 baseline 的 96 筆；八個 PR 與 #6829 都不在該清單，沒有到達需重釘的項目。#6695 的 open head 變動保留既有釘選，於對應 commit 軸重審，不用未讀的新 head 消除 strict 差異。沒有加入未合併產品。

上游作者：Miguel Ángel（八筆與 #6829）。作者 email 只放在提交訊息的 Co-authored-by，不寫入文件。

### 聚焦回歸與紅綠證據

| 範圍／命令（套件 cwd，reporter／outputFile 見忽略目錄的 result JSON）                                                                                                                                                                                                                                                                                         | 舊碼 pass／fail／skip                                           | 新碼 pass／fail／skip  | Exit 舊／新      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------- | ---------------- |
| core：`bun x vitest run src/cacheDir.test.ts src/compiler/htmlBundler.test.ts src/compiler/inlineSubCompositions.test.ts src/compositionReadiness.test.ts src/runtime/adapters/gsap.order.test.ts src/runtime/adapters/gsap.steps.test.ts src/runtime/compositionLoader.test.ts src/runtime/frameSources.test.ts src/runtime/timeline.test.ts --maxWorkers=2` | 515／18／0                                                      | 533／0／0              | 1／0             |
| lint：`bun x vitest run src/project.test.ts src/rules/gsap.test.ts --maxWorkers=2`                                                                                                                                                                                                                                                                            | 301／4／0                                                       | 305／0／0              | 1／0             |
| CLI stroke：`bun x vitest run src/commands/motion-signature.browser.test.ts --maxWorkers=2`                                                                                                                                                                                                                                                                   | 30／1／0                                                        | 含於下列 CLI 195／0／0 | 1／0             |
| CLI 503 行為：`bun x vitest run src/cloud/upload.test.ts -t 'retries a server error before finalization' --maxWorkers=1`                                                                                                                                                                                                                                      | 0／1／17                                                        | 含於下列 CLI 195／0／0 | 1／0             |
| CLI 最終聚焦：`bun x vitest run src/cloud/upload.test.ts src/commands/motion-signature.browser.test.ts src/commands/snapshot.test.ts src/registry/localSemantic.test.ts src/utils/autoUpdate.test.ts --maxWorkers=2`                                                                                                                                          | snapshot resolver 原先回 null；upload 的新增 API 四例原先缺介面 | 195／0／0              | 原負例 1／最終 0 |

core 的 18 個紅燈包含 frameSources 移除舊 exportRenderSeek 參數後的介面不相容，不能全算成行為重現；獨立行為負例包括 StaticGuard local script、compiler／runtime 的 SVG references 及 timeline 在 100 秒邊界的可見性。#7237 另在 archive 舊碼跑 503→200 的網路測試，直接重現「收到 503 便拒絕」；該測試的臨時覆蓋隨後恢復原 bytes，不以 missing putTimings 介面單獨當作修復證據。#7250 保留上游 Chromium 測試，另用現有 happy-dom fixture 釘同一 paint-channel 性質，補足 Windows 預設不啟用 Chromium suite 的情況。

兩個新增 snapshot browser fixture 的最初 focused 執行因 Chrome 30 秒啟動逾時失敗，serial maxWorkers=1 亦同；乾淨 HEAD 注入相同最終 fixture 後也是 0 passed／2 failed，明確診斷為 `The browser did not finish starting within 30000 ms`。該臨時注入隨後移除，沒有改舊碼。移植樹的完整 CLI suite 依 repo 的 unit→chrome 分組，兩個 fixture 最終均 passed：100 秒交界前後皆紅色，兩幕重複 SVG ids 皆解析為自身顏色且共享 page gradient 保持綠色。沒有改 assertion、延長 timeout 或改成 skip；保留先前啟動失敗紀錄，不拿它們冒充行為紅燈，也不重跑已達標像素驗收。

`bun run build` 於 lint、core、CLI 均 exit 0；乾淨 HEAD 先重建 parsers／lint／core／studio-server／studio／inspector／player／CLI dist。首次乾淨樹缺 ignore 連結及前置 dist 的建置失敗，補齊依賴連結並按依賴順序建置後通過，沒有改產品略過。`archive-parity.json` 對 archive 內 packages／scripts 的原始碼及設定比對差異 0；第三方依賴只以 junction 共用，workspace links 指向乾淨樹自己的 package。

新增／修改的產品檔皆在 `product-inputs.json` 記 HEAD 及 SHA-256，格式化後的最終聚焦命令與 reporter 為 `final-{core,lint,cli}.*`。完整套件先執行一次，未因已知平台失敗重跑；core／lint 的非語意格式化後另以聚焦回歸驗證，不把後補雜湊冒稱為完整套件啟動時的輸入證明。

### 靜態閘門與套件大小

lefthook 的三組 `node node_modules/typescript/bin/tsc --noEmit -p <packages/core/tsconfig.json|packages/studio/tsconfig.json|scripts/tsconfig.json>` 均 exit 0；額外 CLI typecheck 雙樹均 exit 2，同一三筆診斷逐字一致：`check.test.ts:2287` 的 deadline 可能 undefined、`:3834`／`:3835` 多傳一個參數。變更 33 檔 oxlint exit 0，0 warnings／0 errors；`bun run check:cli-process-ownership` exit 0。沒有執行 lefthook 會 staging 的 format job。

雙樹使用相同 `pnpm pack --json --pack-destination <ignored directory>`，未改套件管理器、未安裝依賴或產生 pnpm lockfile。判定沿用 `listPackageSizeIssues` 的原 1% 容差。

| 套件 | HEAD packed／unpacked | 移植 packed／unpacked | 判定                                           |
| ---- | --------------------- | --------------------- | ---------------------------------------------- |
| core | 1680858／4054737      | 1681470／4056731      | 雙樹 packed 超標，既有缺口持續；增量 612 bytes |
| cli  | 8493414／24179350     | 8495279／24179414     | 雙樹 packed／unpacked 超標，既有缺口持續       |
| lint | 180663／695324        | 181454／698678        | 通過                                           |

指定八筆與 #6829 都沒有 `scripts/package-size-budgets.json` 的上游增量，因此保留原預算；沒有提高容差、捏造上游調整或用此段移植消除原有超標。#7246 未改產品，沒有執行 producer lane；受影響完整套件只包含 core、lint、CLI，沒有跑 `tools/test_product.ps1 -Full`。

### 完整套件與乾淨 HEAD 的逐名比較

三個受影響套件各樹只跑一次完整 suite；原始 Vitest JSON、命令與 exit 存於 `head-{core,lint,cli}.*`／`port-{core,lint,cli}.*`，逐名失敗清單與 SHA-256 差集為 `comparison.json`、`*.failures.json`。表內為 pass／fail／skip，不以 assertion 數字取代實際 runner exit。

| 套件／命令（套件 cwd）                  | 乾淨 HEAD     | 移植樹        | Exit HEAD／移植 | 只在移植樹失敗 |
| --------------------------------------- | ------------- | ------------- | --------------- | -------------- |
| core：`bun x vitest run --maxWorkers=2` | 5594／0／11   | 5598／0／11   | 0／0            | 0              |
| lint：`bun run test --maxWorkers=2`     | 1245／1／0    | 1249／1／0    | 1／1            | 0              |
| cli：`bun run test --maxWorkers=2`      | 6221／35／305 | 6236／29／306 | 1／1            | 0              |

lint 的共同失敗為 `does not read a linked shader outside the project through a symlink`；CLI 的逐名差集包含現有 Windows／瀏覽器啟動／媒體 fixture／optional packages 等失敗，詳見 reporter，沒有未解的移植樹獨有失敗。不把 CLI／lint 的非零失敗數宣稱成完整產品驗收綠燈。producer 未改檔，沒有擴大到不受影響的 lane 或跨 workspace Full。

### 收尾閘門

`pwsh -NoProfile -File tools/dev_check.ps1` exit 0：39 passed、0 failed，相對連結檢查 12 份文件、0 錯誤，結尾 `WINDOWS DEV CHECK GREEN`。Markdown 新節使用 `node_modules/.bin/oxfmt --ignore-path <empty-ignore>` 格式化，既有日期快照及表格不重排。

lefthook 三組 typecheck 最終均 exit 0；`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` 最終 exit 0，38 changed files，new-only gate 排除一組 inherited duplication，實際輸出見 `fallow-closeout.*`。PowerShell 可直接解析該本機入口，曾用 cmd 的 forward-slash 路徑呼叫則在啟動 audit 前失敗（0.04 秒），不計為產品 gate 結果。

### 水位 `b108f8512` 時點的剩餘快照

2026-11-06、fork HEAD `2e34275fc` 的 `python tools/check_upstream_updates.py --strict` exit 1，原始輸出為 `strict-final.md`。上游 tip `66cbabc39`；水位以上仍有 24 個 commit（下一筆 `35cbca992`／#7240）、PR #7238 以上 54 筆、issue #7223 以上 9 筆；96 筆 monitored 中 #6695 有一筆 open head 變動，原釘選保持 `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`。這是水位 `b108f8512` 的日期快照；現行剩餘數量見後續新節。

連續審查止於指定八筆的 `b108f851201dc22f5d4974ee7f1c9d19b472cc1e`，沒有讀入下一筆補丁或用新 head 消除未審缺口。PR 水位 #7238、issue #7223，baseline／UPSTREAM／DECISIONS／ROADMAP 現況一致。strict、CLI／lint 全套及既有封裝大小仍有缺口，ROADMAP 近期列保留。需上傳的新 LFS 物件：無。

## 2026-11-06：接續至 `32eb4c358`，審查 8 個連續 commit

以 fork `2de8e9755e9d172604dbd591a597cd82a3d56a85` 為起點，只處理 `35cbca992..32eb4c358` 八筆連續補丁。唯讀 GraphQL 核對這八筆 PR 均 MERGED，mergeCommit 與指定 SHA 一致；原始補丁、PR JSON、測試與命令 exit 保存在忽略目錄 `tmp/upstream-20261106-35c/`。採用七筆產品修正；release 不同步整版版本與發行資產。

| Commit／PR                                                                | 裁決與重訪條件                                                                                                                                                                                                     | 上游證據                                                                              | fork 證據                                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `35cbca992`／[#7240](https://github.com/heygen-com/hyperframes/pull/7240) | 採用：抽出共用 deferred frame resolver，保留 distributed remote-source guard 與 INVALID_VIDEO_METADATA。                                                                                                           | `35cbca992:packages/producer/src/services/render/deferredVideoFrames.ts:53`           | `packages/producer/src/services/render/deferredVideoFrames.ts:55`           |
| `599eaad2b`／[#7241](https://github.com/heygen-com/hyperframes/pull/7241) | 採用：每個 worker 持有自己的 hook，segment prepare／release、初始化／回收 on-demand 與 join 清理；保留本線 encoder 回傳 durationMs 的契約。                                                                        | `599eaad2b:packages/producer/src/services/render/segmentVideoFrames.ts:40`            | `packages/producer/src/services/render/segmentVideoFrames.ts:45`            |
| `8df4f21c2`／[#7255](https://github.com/heygen-com/hyperframes/pull/7255) | 採用：segmented 與 sequential capture 寫入 encoder 前也驗 drawElement 樣本；低於 PSNR floor 必須失敗。保留既有 stall clock，不導入 render retry。                                                                  | `8df4f21c2:packages/producer/src/services/render/stages/captureStreamingStage.ts:471` | `packages/producer/src/services/render/stages/captureStreamingStage.ts:457` |
| `2f2195515`／[#7254](https://github.com/heygen-com/hyperframes/pull/7254) | 採用：reference normalization 受 +12 dB 與 -1.5 dBTP 限制，回報與 reference 的差距；gain 被限制且不變時不寫檔。兩種模式共用 fittedGain，保留想提高音量時不反向降低的政策。                                         | `2f2195515:packages/studio-server/src/helpers/loudness.ts:386`                        | `packages/studio-server/src/helpers/loudness.ts:386`                        |
| `7290ee68c`／[#7256](https://github.com/heygen-com/hyperframes/pull/7256) | 採用：script-load origin／code 移到自由文字前，截斷長錯誤仍保留診斷，沒有輸出 script URL。                                                                                                                         | `7290ee68c:packages/engine/src/services/frameCapture.ts:2562`                         | `packages/engine/src/services/frameCapture.ts:2519`                         |
| `478ef2f26`／[#7258](https://github.com/heygen-com/hyperframes/pull/7258) | 採用：SVG gradient 用最弱 stop 算對比，支援 href 並限制八跳；pattern／無法解析的 reference 跳過，不製造黑色前景。瀏覽器像素驗收另記限制。                                                                          | `478ef2f26:packages/cli/src/commands/contrast-audit.browser.js:192`                   | `packages/cli/src/commands/contrast-audit.browser.js:192`                   |
| `968f97fe9`／[#7242](https://github.com/heygen-com/hyperframes/pull/7242) | 採用：HF_VIDEO_FRAME_WINDOW 預設關閉；只對 eligible segmented mp4／mov 延後抽幀，calibration 預抽後釋放，改走其他 capture route 時補齊全部 deferred frames。保留本線 capture options 與 updateJobStatus 進度介面。 | `968f97fe9:packages/producer/src/services/renderOrchestrator.ts:3546`                 | `packages/producer/src/services/renderOrchestrator.ts:3378`                 |
| `32eb4c358`／[#7260](https://github.com/heygen-com/hyperframes/pull/7260) | 整版 release 不適用：fork 未同步所有發布內容，不改 package／plugin 版本、不發佈 npm。producer unpacked 預算未超標，不套用 release 的額外預算。                                                                     | `32eb4c358:releases/v0.9.17.md:5`、`32eb4c358:scripts/package-size-budgets.json:40`   | `packages/producer/package.json:3`、`scripts/package-size-budgets.json:40`  |

### 依賴、PR 軸、monitored 與 LFS

#7240／#7241 是 #7242 在指定範圍內的先決，一併採用。#7242 以既有 engine deferredRange／range extraction 運作，不需要 #7182 的 browser-playable 長來源分段副本；兩者解決不同階段的磁碟用量。#7182 等長來源分段副本與離線長片驗收；#7176 等維護者決定遙測政策；#7104／#7168 retry 等新 session 所有權、取消與一次性重試契約；#6716 的 17 檔遷移等 Windows 私有快取根及完整 guard 測試。這四項維持延後，沒有隨新功能擴大採用。

指定八筆沒有 #6940 的 audioDeliveryLimit／browser true-peak limiter；#7246 維持延後，等 limiter 管線成組採用並驗 AAC -1.2 至 -1 dBTP、重複輸出 bytes 與分散式 loudness。#7232 仍等 #6912／#7225 WebKit decode-first 與記憶體／Safari clock 驗收。

PR 軸沿實際 #7238 接續：#7239 已於 `0a6746e1d` 那節採用，來源 `80e02e74a:packages/lint/src/projectIgnore.ts:8`，fork `packages/lint/src/projectIgnore.ts:8`；#7240–#7242 見上表。四筆均經唯讀 GraphQL 核對 MERGED，連續 PR 水位可至 #7242，沒有跳過 #7243 去釘 #7258。issue 保持 #7223。monitored 沿實際 baseline 維持 96 筆；這八筆沒有到達其中項目，#6695 open head 的未審差異仍保留原釘選，不重釘未讀補丁。

八個補丁均沒有新增或修改 golden／LFS pointer；#6665 既有 pointer 保留。需上傳的新 LFS 物件：無。上游作者為 Vance Ingalls（#7240／#7241／#7242／#7260）與 Miguel Ángel（其餘四筆）；email 僅供提交 trailer，不寫入文件。

### 適配與套件預算

新增 segmentVideoFrames 測試的實際磁碟路徑以分隔符正規化比對，避免 `/clip/` 在 Windows 產生假失敗。兩例原有 segmentOutputPath／segmentDirFor 的 POSIX 常數斷言保留，交由雙樹逐名比較。未更改 timeout、失敗斷言、coverage 容差或渲染品質門檻。

producer packed 實測 HEAD 833390 → 842152 bytes，超出原 828932 預算的 1% 容差；依 `968f97fe9:scripts/package-size-budgets.json:39` 同一補丁的 +12000 增量調為 840932，保留原 1% 容差。unpacked 3007333 → 3041607，仍在 3081613 預算內，不採用 release 的 +48387 增量。CLI 原有 packed／unpacked 超標不調高；engine 與 studio-server 預算不變。

### 聚焦回歸與先紅後綠

每項修正先移入測試才改產品；`red-*.log`／`red-cli.json`／`red-engine.json` 保留初始失敗，不把 Chrome 啟動逾時或錯誤 runner 當作行為紅燈。新 API 的缺失另外明列。

| 修正                     | 舊碼證據                                                                                                                                                            | 移植後證據                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #7240 共用抽幀           | deferredVideoFrames 單檔 exit 1：舊碼無共用模組，0 passed／1 failed／1 import error。這是介面新增，非既有行為斷言失敗。                                             | 分類指定的 unit／bun 單檔 2 passed；integration／bun 2 passed，含不夠幀時 fail-closed 與 fallback 全抽幀逐 byte 相同。                                            |
| #7241 分段生命週期       | `red-segment.log` 的 prepare 順序、retry 重抽、resume 不抽與 abort release 等斷言失敗；整個初試 37 passed／12 failed／1 missing-module error，含舊 POSIX 路徑失敗。 | 最終新功能篩選 `with segmentVideoFrames\|drawElement self-verify` 15 passed／0 failed；segmentVideoFrames 單檔 13 passed／0 failed。                              |
| #7255 drawElement 校驗   | `red-verify.log` 中 segmented／sequential 的「compares … ground truth」與「fails … below … floor」四例失敗，舊碼沒有呼叫校驗。                                      | segmented 的兩例包含在上列 15 passed；streaming 全檔 35 passed／0 failed，保留原 PSNR floor。                                                                     |
| #7254 reference loudness | planner 的 ceiling／true-peak／limitedBy 三例與 command 寫入／回報一例共四例失敗。                                                                                  | normalize-audio 的 planner／command 與 contrast-fg 合計 42 passed／0 failed；CLI 完整 suite 中新增 command 也通過。                                               |
| #7256 警告前綴           | `red-engine.json` 7 passed／1 failed：長自由文字前不是 origin／code。                                                                                               | 同檔 8 passed／0 failed。                                                                                                                                         |
| #7258 SVG gradient       | contrast-fg 舊碼將 gradient 當黑色，`toBeNull` 失敗。新增 browser 案例初試是 Chrome 30 秒啟動逾時，不當作視覺行為紅燈。                                             | contrast-fg 與上列 CLI focused 均通過；完整 CLI suite 的新增 browser 案例 passed，light／dim／borrowed stops 與 pattern 的實際像素斷言成立。                      |
| #7242 window flag        | `red-window.log` 的 forFrames 預抽／失敗清理兩例在舊介面失敗，另缺 videoFrameWindow 模組；初試混入 Vitest 檔造成的 runner error 不列為回歸證據。                    | 正確分類的 orchestrator／coverage／manifest 最終 focused 30 passed／0 failed／47 filtered；window helper 2 passed。較廣的 producer focused 356 passed／0 failed。 |

producer runner 由 `discoverProducerTests()` 分類：unit Vitest 透過 `node scripts/run-test-lane.mjs unit vitest`；unit bun 依同一清冊、HYPERFRAMES_TEST_LANE=unit 與 no-network preload，每檔 fresh process，失敗後繼續到最後一檔。分類測試 7 passed；全部 179 檔均有分類。未跑跨 workspace Full。

### 真實媒體與瀏覽器驗收

integration lane 的 deferredVideoFrames（bun）2 passed、extractVideosStage（Vitest）2 passed，均 exit 0：包含真實 FFmpeg、deferred fallback 逐 byte 與 VFR 來源留在全抽幀路徑。

真實 windowedFrames 只取兩個獨立必要證據，不展開其餘案例：`bun test src/services/render/windowedFrames.integration.test.ts -t 'renders a mid-clip start frame for frame'` exit 0，150 畫格的 framemd5 與完整抽幀一致；`-t 'never holds more than workers'` 初次 exit 1（2-workers-windowed 的 session navigation 60000ms 逾時），一次聚焦確認 exit 0，240 畫格一致，source-frame sampled／reported peak 均 715796 bytes，largest frame 6428 bytes，bound 925632 bytes。確認過程中 full 與 windowed 的測試內 retry 都為 false，沒有啟用 HF_TEST_RETRY_BROWSER_STALL、調長 timeout 或移除斷言。首個失敗與確認紀錄分別保存在 `integration-window-peak.*`／`integration-window-peak-confirm.*`；不把原始失敗抹掉。其餘 windowed integration 案例與硬體 drawElement 視覺 parity 未執行。

### 完整套件與乾淨 HEAD 逐名比較

乾淨樹由 `git archive HEAD` 建立，沒有切分支或更動 index；archive 中 packages／scripts 的 5532 個檔案逐 byte 比對差異 0。第三方依賴用 junction 共用，各 workspace 指向乾淨樹自己的 package；重建 core、lint、engine、studio-server、studio、inspector、player、producer、CLI dist。初次缺 ignore junction／前置 dist 的建置失敗，補齊環境後成功，沒有為建置改產品。CLI／engine／studio-server／producer 的移植樹 build 皆 exit 0。

完整 suite 各樹各跑一次。Vitest JSON／default reporter、逐名 failures、差集及命令 exit 保存於 `tmp/upstream-20261106-35c/`；`reconciled-comparison.json` 分開保存原始差異與聚焦後未解差異，不將 0 個 assertion failure 當成 runner exit 0。下表為 pass／fail／skip。

| 套件／命令（套件 cwd）                                             | 乾淨 HEAD        | 移植樹           | Exit HEAD／移植             | 原始只在移植樹失敗 | 聚焦後未解 |
| ------------------------------------------------------------------ | ---------------- | ---------------- | --------------------------- | ------------------ | ---------- |
| cli：`bun run test --maxWorkers=2`                                 | 6230／35／306    | 6239／29／306    | 1／1                        | 0                  | 0          |
| engine：`bun run test --maxWorkers=2`                              | 2616／6／53      | 2622／0／53      | 1／1                        | 0                  | 0          |
| studio-server：`bun run test --maxWorkers=2`                       | 1490／23／61     | 1488／25／61     | 1／1                        | 2                  | 0          |
| producer unit Vitest：`node scripts/run-test-lane.mjs unit vitest` | 1142／4／5       | 1164／6／5       | 1／1                        | 2                  | 0          |
| producer unit bun：分類清冊逐檔、unit 環境、no-network preload     | 875／8／0，52 檔 | 909／8／0，55 檔 | 各 3 檔 exit 1，其餘 exit 0 | 0                  | 0          |

Studio-server 的兩個原始差異為 projectHistory「ends a window idle past its lifetime」與 videoState「projects real committed history」；雙樹僅重跑這兩例，皆 2 passed／0 failed。producer Vitest 的兩個原始差異是 deGateProbe「a comp the engine refuses at init …」與 stall「gives each retry batch its own first-frame window」；雙樹對 stall、deGateProbe、segmentedDeRetry 三檔各作一次聚焦，皆 16 passed／1 failed，共同失敗只有既有「retries a stalled attempt on fewer workers … completes」，兩個差異案例均通過。沒有修改這些測試或 timeout。

CLI 原始逐名差集為 0；engine 原始逐名差集為 0，兩樹另有 undecodableTrack suite setup error，移植樹 assertion 0 fail 仍是 exit 1。producer bun 八個失敗名稱完全相同：chunkAudio 三例、projectHash 的四例 symlink EPERM 與 segmentOutputPath 的 POSIX 常數斷言。segmentManifest、renderDirOwner 與既有 stall 等共同失敗保留。完整產品驗收不是 0 fail，不能宣稱完整綠燈；沒有再跑已完成的全套。

產品補丁完成後僅做非語意格式化；最終 `final-product-inputs.json` 釘 HEAD、changed／untracked 輸入雜湊，後續分類正確的 focused 命令與 reporter 均保留。沒有把後補雜湊冒稱為完整 suite 啟動時的快照。

### 靜態閘門

lefthook core／studio／scripts 三組 `node node_modules/typescript/bin/tsc --noEmit -p <path>` 均 exit 0（無輸出）。`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0，36 changed files，new-only gate 排除三個 inherited findings，沒有新增阻擋項；完整 log 保留。變更 32 檔 oxlint exit 0、0 warnings／0 errors；`bun run check:cli-process-ownership` exit 0。只執行獨立檢查，沒有執行會 staging 的 lefthook format job。

### 水位 `32eb4c358` 時點的剩餘快照

2026-11-06、fork HEAD `2de8e9755` 的 `python tools/check_upstream_updates.py --strict` exit 1，原始輸出為 `strict-final.md`；上游 tip `6011d9d0dd555a21430baeee8d84cca8cbacbb6a`。commit 軸仍有 17 筆（下一筆 `256b84a41`／#7264），PR #7242 以上 52 筆、issue #7223 以上 9 筆；96 筆 monitored 中 #6695 有一筆 open head 差異，原釘選仍為 `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`。這是水位 32eb4c358 的日期快照；現行剩餘範圍見後續新節。

只推進有逐筆證據的八筆連續前綴至 `32eb4c3582d6b5b52c06f1444d23bc395b8e19d8`；PR #7242、issue #7223，baseline／UPSTREAM／DECISIONS／ROADMAP 現況一致。strict、完整產品套件與 CLI 既有封裝大小缺口仍在，ROADMAP 近期列保留。需上傳的新 LFS 物件：無。

### 維護 gate 收尾

2026-11-06、fork HEAD `2de8e9755` 的 `pwsh -NoProfile -File tools/dev_check.ps1` exit 0：39 passed／0 failed；相對連結 12 份文件、0 錯誤，結尾 `WINDOWS DEV CHECK GREEN`。新增 Markdown 節使用 `node_modules/.bin/oxfmt --ignore-path <empty-ignore>` 格式化，歷史節保留原文與原有表格格式；`git diff --check` exit 0。產品程式在聚焦確認後沒有變更；最終整體工作樹輸入另保存為 `delivery-inputs.json`。

## 2026-11-06：接續至 `b4cc674f7`，審查 8 個連續 commit

以 fork `6e8cc4d8b` 為起點，只審 `256b84a41..b4cc674f7` 八筆連續補丁。起始 strict exit 1；原始補丁、唯讀 GraphQL 的 MERGED／mergeCommit 證據、命令與 reporter 存在忽略目錄 `tmp/upstream-20261106-256/`。沒有讀入下一個 commit 的補丁。採用五筆獨立產品修正，另補已合併的 #7061 必要先決。

| Commit／PR                                                                | 裁決與理由                                                                                                                                                                                                             | 上游證據                                                                                                                     | fork 證據                                                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `256b84a41`／[#7264](https://github.com/heygen-com/hyperframes/pull/7264) | 採用：CLI no-draw seek 的 draw gate 同時阻止 color-grading source texture 上傳，下一次正常 draw 恢復。保留既有 WebGL／來源處理。                                                                                       | `256b84a41:packages/core/src/runtime/colorGrading.ts:3352`                                                                   | `packages/core/src/runtime/colorGrading.ts:3345`                                            |
| `4935d6736`／[#7267](https://github.com/heygen-com/hyperframes/pull/7267) | 採用：gain 被 ceiling／true-peak 限制而不寫檔時，回報實際保持的 LUFS。補齊先前 #7254 適配遺漏的 absolute matched／held 區別，不引進不同 loudness 政策。                                                                | `4935d6736:packages/cli/src/commands/normalize-audio.ts:203`；`9c01e2e12:packages/studio-server/src/helpers/loudness.ts:567` | `packages/cli/src/commands/normalize-audio.ts:168`、`:198`                                  |
| `72326a3ac`／[#7268](https://github.com/heygen-com/hyperframes/pull/7268) | 採用：render 等待的 lint 保持正常優先權，preview／Studio 背景 lint 明確帶 background；保留既有 Windows EPERM／EACCES 靜默處理。                                                                                        | `72326a3ac:packages/cli/src/renderSetupWorker.ts:40`                                                                         | `packages/cli/src/renderSetupWorker.ts:39`                                                  |
| `5259fd112`／[#7280](https://github.com/heygen-com/hyperframes/pull/7280) | 不採用：這是上游 queue 的 stale 自動關閉政策及 Renovate label 配套，非產品修正。本 fork 使用 Dependabot，現有 queue 由維護者逐筆判斷；只有決定採取同一個 14+7 日自動關閉政策時成組重訪，不因產品同步新增自動關閉權限。 | `5259fd112:.github/workflows/stale.yml:22`、`5259fd112:.github/renovate.json:9`                                              | `TRIAGE.md:89`、`.github/dependabot.yml:5`                                                  |
| `cbe5dcb2d`／[#7270](https://github.com/heygen-com/hyperframes/pull/7270) | 整版 release 不適用：只含版本 metadata、發行說明及其鏡像。fork 未整版同步，不宣稱 v0.9.18；不改 npm／plugin 發行版本。                                                                                                 | `cbe5dcb2d:releases/v0.9.18.md:5`                                                                                            | `packages/core/package.json:3`、`packages/cli/package.json:3`                               |
| `6abc62a17`／[#7283](https://github.com/heygen-com/hyperframes/pull/7283) | 採用，連同 #7061：每一次 render landing（包括 replay）都 settle 已結束的 overlap，讓 set 打斷 tween 後的畫格與 preview 相同。保留本線 gsapTimelineOf stand-in 與 authored-order steps。                                | `6abc62a17:packages/core/src/runtime/adapters/gsap.ts:263`                                                                   | `packages/core/src/runtime/adapters/gsap.ts:260`                                            |
| `b56e2c036`／[#7287](https://github.com/heygen-com/hyperframes/pull/7287) | 採用：保留能擷取的本機字型，缺少的 family 加空 face 走 stack fallback；CLI 點名、JSON 列 swapped_fonts。只放寬系統字型 capture pass，前置解析仍 fail-closed，其他例外仍傳出。保留本線 offloadMedia 介面。              | `b56e2c036:packages/cli/src/cloud/fontPreflight.ts:103`                                                                      | `packages/cli/src/cloud/fontPreflight.ts:103`；`docs/packages/cli.mdx` 的 cloud render 說明 |
| `b4cc674f7`／[#7290](https://github.com/heygen-com/hyperframes/pull/7290) | 整版 release 不適用：v0.9.19 發行 metadata／changelog，處理同上一筆 release；不更動本線版本或發布 guard。                                                                                                              | `b4cc674f7:releases/v0.9.19.md:5`                                                                                            | `packages/core/package.json:3`、`packages/cli/package.json:3`                               |

### 先決、延後與三軸邊界

#7283 需要 `0f85af7c7`／#7061 的 overlap span metadata、settleOverlapsEndedBetween 與 preview 回歸；唯讀 GraphQL 確認 MERGED。來源 `0f85af7c7:packages/core/src/runtime/adapters/gsap.ts:221` → fork 同檔 `:224`；preview 先在乾淨 HEAD 注入上游測試，2 passed／2 failed，移植後 4 passed。#6767 已有的「欲提升音量時不能反向降低」政策保留；以 #6767 的 absoluteOutcome matched／held 性質適配現有 CLI，不新增 studio-server export 或改變公開 helper 介面。

#6940 的 audioDeliveryLimit／browser limiter 沒有出現在這八筆，#7246 保持延後：成組採用 limiter 後驗真實 AAC -1.2 至 -1 dBTP、重複輸出 bytes 與分散式 loudness。#7182 等長來源分段副本與離線長片驗收；#7176 等維護者決定遙測政策；#7104／#7168 retry 等新 session 所有權、取消與一次性重試契約；#6716 的 17 檔遷移等 Windows 私有快取根與完整 guard 測試。五筆修正及 #7061 不依賴這四組延後內容。

commit 水位只推進至 `b4cc674f7f312e77ded32e0b53006cc0bad6723b`。實際起點 PR #7242／issue #7223 不退回提示中的舊水位，也不越過尚未裁決的 PR #7243；指定八筆 PR 均已合併不代表中間所有 PR 都已審完。monitored 保持實際 baseline 的 96 筆，八筆沒有到達其中項目；#6695 未審的 open head 差異保留原釘選，不以新 head 消除缺口。

八筆與 #7061 都沒有 golden／LFS pointer 變更，既有 #6665 pointer 保留；需上傳的新 LFS 物件：無。指定八筆與先決均無 package-size-budgets 增量，不能憑空提高預算；既有 core／CLI 超標另列驗證結果。上游產品作者：Miguel Ángel，email 僅供 Co-authored-by，不寫入文件。

### 聚焦回歸與適配

| 範圍                                                       | 舊碼                                                                                | 最終聚焦                             | exit 舊／新 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| core colorGrading＋gsap.order                              | 122 passed／2 failed：draw gate 仍上傳八次；set 在 tween 結束後為 0 而非 1          | 加入 preview 共 128 passed／0 failed | 1／0        |
| #7061 preview（乾淨 HEAD 注入新測試後恢復）                | 2 passed／2 failed：不同 tick／nested timeline 的 hide 不一致                       | 4 passed，包含 callback 恰一次       | 1／0        |
| CLI normalize／priority／fontPreflight／cloud render fonts | 14 passed／8 failed；其中一例是新增 describeSwappedFonts 介面不存在，其餘為行為斷言 | 22 passed／0 failed                  | 1／0        |

命令為套件 cwd 的 `bun x vitest run <files> --maxWorkers=2`；具體檔案與原始斷言見 `red-core.*`、`red-cli.*`、`red-preview-behavior.*`、`final-core.*`、`final-cli.*`。首次 red-preview 是沒有注入檔案的錯誤 runner，不算紅燈；修正注入位置後得到上述行為負例。首次 CLI 綠測揭露 absolute gain 已受限卻報 Already matched 的舊適配缺口，補 matched／held 判定後才全過。

保留 #7264 的 Chromium 真實圖片上傳測試，另補現有 mock WebGL 的 source upload 性質測試，以在 Windows 預設不啟用 Chromium 時仍能釘行為。顯式啟用 Chromium 的首次驗收 exit 1：Chrome 啟動／profile 錯誤。完整套件結束後作一次 serial 確認仍 exit 1（`chromium-confirm.*`）：同為 browser already running 的啟動錯誤，5 skipped，沒有取得真實 GPU 圖片上傳驗收；到此停止，不以 mock 取代該聲明。

fallow 首次發現 prepareLocalArchive 與新增 settleOverlapsEndedBetween 複雜度超標；抽出字型提示與 overlap predicate，保持相同行為，沒有改 gate、排除或門檻。最終聚焦與 core typecheck 都在此適配後通過。完整 suite 執行期間發生這兩處 helper extraction，完整 suite 與最終 focused 分開記錄，不將前者冒稱為最終 bytes 的全套驗證。

### 完整套件與乾淨 HEAD 逐名比較

乾淨樹以 `git archive HEAD` 建立，沒有改 index 或切分支。archive 中 packages／scripts 共 5543 個檔案逐 byte 比較差異 0；第三方依賴以 junction 共用，各 workspace 指向乾淨樹自身。補齊 ignore junction 與依賴 dist 後，重建 parsers、lint、core、studio-server、studio、inspector、player、CLI；移植樹 core／CLI 最終 build 均 exit 0。初始缺 ignore 的建置失敗不列為產品缺陷，未修改程式或依賴宣告消除環境問題。

只有 core／CLI 產品變更，兩個受影響套件在雙樹各跑一次完整 `bun run test --maxWorkers=2`，JSON reporter 與命令 exit 保存在 `head-{core,cli}.*`、`port-{core,cli}.*`。producer 未改產品檔，不擴大跑 producer lane；沒有執行 `tools/test_product.ps1 -Full`。表內為 passed／failed／skipped。

| 套件 | 乾淨 HEAD     | 移植樹        | exit HEAD／移植 | 原始只在移植樹失敗 |
| ---- | ------------- | ------------- | --------------- | ------------------ |
| core | 5598／0／11   | 5607／0／11   | 0／0            | 0                  |
| cli  | 6233／35／306 | 6243／29／307 | 1／1            | 0                  |

逐名失敗清單為 `head-cli.failures.json`／`port-cli.failures.json`，原始差集與清單 SHA-256 記在 `comparison.json`；未把既有環境失敗計為產品通過。完整 suite 的非零 exit 與跳過都保留，不能宣稱完整產品驗收綠燈。

### 靜態閘門與封裝大小

lefthook 三組 `node node_modules/typescript/bin/tsc --noEmit -p <packages/core/tsconfig.json|packages/studio/tsconfig.json|scripts/tsconfig.json>` 均 exit 0、無輸出；helper extraction 後 core typecheck 再驗仍 exit 0。`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` 最終 exit 0：`No issues in 17 changed files`，dead code／complexity／duplication 皆 0；沒有放寬規則。變更的 16 個 TypeScript 檔 oxlint exit 0，0 warnings／0 errors；`bun run check:cli-process-ownership` exit 0，結尾 `CLI process ownership verified: only process roots terminate the process.`。沒有執行會 staging 的 lefthook format job。

雙樹的 `pnpm pack --json --pack-destination <ignored directory>` 僅用於量測，沒有安裝依賴或新增 lockfile；最終 core／CLI dist 都已重建，原始封裝資訊存於 `package-sizes.json`。

| 套件 | HEAD packed／unpacked | 移植 packed／unpacked | 判定                                |
| ---- | --------------------- | --------------------- | ----------------------------------- |
| core | 1681470／4056731      | 1681999／4057971      | 雙樹 packed 既有超標；unpacked 通過 |
| cli  | 8498594／24200488     | 8500525／24196487     | 雙樹 packed／unpacked 既有超標      |

保留原有 1% 容差，八筆與 #7061 都沒有上游同 commit 的預算增量，因此不調高 budgets。大小缺口不能宣稱已驗收。

### 水位 `b4cc674f7` 時點的剩餘快照

2026-11-06、fork HEAD `6e8cc4d8b` 的 `python tools/check_upstream_updates.py --strict` exit 1，完整結果為 `strict-final.md`；上游 tip `41b7aeeaf`。commit 軸尚有 11 筆，下一筆是 `a81b344`／#7294；PR #7242 以上 55 筆、issue #7223 以上 9 筆；96 筆 monitored 中 #6695 有一筆 open head 差異（原釘 `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`，查詢為 `3b2321c`）。這是水位 b4cc674f7 的日期快照；現行剩餘數量只在後續最新節維護。沒有以未讀補丁或狀態釘選消除 strict 缺口，ROADMAP 近期列維持，連續審查止於指定八筆。

CLI 逐名差集為 0；「只在移植樹失敗＝0」只代表未新增失敗，並非全套 0 failed。

### 維護 gate 收尾

2026-11-06、fork HEAD `6e8cc4d8b` 的 `pwsh -NoProfile -File tools/dev_check.ps1` exit 0：39 passed／0 failed；相對連結 12 份文件、0 錯誤，結尾 `WINDOWS DEV CHECK GREEN`。新 Markdown 節與 CLI 說明以 `node_modules/.bin/oxfmt` 格式化，歷史節只調整過期的「最新」標題與快照定位，不重排舊內容；`git diff --check` exit 0。最終產品來源未再變更，交付時的 changed／untracked SHA-256 存於忽略目錄的 `delivery-inputs.json`，不冒稱它是完整 suite 啟動時的快照。

## 2026-11-06：接續至 `66cbabc39`，審查 8 個連續 commit

以 fork `46d98d9bd` 為起點，審查範圍止於 `a81b34410..66cbabc39` 八筆連續 commit。起始 `python tools/check_upstream_updates.py --strict` exit 1；唯讀 GraphQL 確認八筆均為 MERGED，mergeCommit 與下表相同。完整補丁、PR 狀態、來源行號及命令 reporter 保存在忽略目錄 `tmp/upstream-20261106-a81/`。沒有審查範圍之後的補丁。

| Commit／PR                                                                | 裁決與理由                                                                                                                                                                                                                                                                                          | 上游證據                                                                                                                                          | fork 證據                                                                                                                                              |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `a81b34410`／[#7294](https://github.com/heygen-com/hyperframes/pull/7294) | 採用：line_unread 帶出 line run 兩端各三個鄰近樣本，空白樣本使用 null，不推算未量到的 opacity／height。                                                                                                                                                                                             | `a81b34410:packages/cli/src/utils/craftAudit.ts:450`                                                                                              | `packages/cli/src/utils/craftAudit.ts:451`；`packages/cli/src/utils/checkTypes.ts:351`；`docs/packages/cli.mdx` 的 Craft warnings 說明                 |
| `cd7e93baa`／[#7271](https://github.com/heygen-com/hyperframes/pull/7271) | 採用：掃描／eventful pose read 暫停 GSAP 離散 callback，finally 恢復；onUpdate 保持執行。移除會消耗 once guard 的 DOM journal。沿用 fork discovery 與 seek 復原介面。                                                                                                                               | `cd7e93baa:packages/core/src/runtime/adapters/gsap.ts:505`；同 SHA `packages/core/src/runtime/captureMotionBlur/discover.ts:295`                  | `packages/core/src/runtime/adapters/gsap.ts:453`；`packages/core/src/runtime/captureMotionBlur/index.ts:253`                                           |
| `2066a2ff5`／[#7293](https://github.com/heygen-com/hyperframes/pull/7293) | 採用：filter 的 SVG 定義放在 documentElement，避免改變 composition 的 last-child；timeline／root 更換與 teardown 仍清理。                                                                                                                                                                           | `2066a2ff5:packages/core/src/runtime/captureMotionBlur/filterTier.ts:166`                                                                         | `packages/core/src/runtime/captureMotionBlur/filterTier.ts:191`                                                                                        |
| `f54b2227f`／[#7134](https://github.com/heygen-com/hyperframes/pull/7134) | 延後新功能：新增分享 kernel，而非既有路徑的獨立修正。host 需綁帳戶、上傳、project fingerprint；本線 CLI 仍使用既有 publishProject，沒有 share consumer。等分享 host／帳戶政策及 #7135–#7140 接線成組驗收；包含 Windows portable lock、可信 upload origin、redirect 拒絕、owner／feedback recovery。 | `f54b2227f:packages/share/src/host.mjs:9`、`:32`；同 SHA `packages/share/src/projectLock.mjs:62`；`packages/share/src/signedInRequest.mjs:80`     | `packages/cli/src/commands/publish.ts:18`、`:33`；`package.json:8`（現行 workspace，無 share consumer）                                                |
| `b6f2bec16`／[#7292](https://github.com/heygen-com/hyperframes/pull/7292) | 採用：有 viewport-fixed child 且尚非 containing block 的 mover 保持銳利，其他 mover 照常 blur；逐畫格判斷 transform／will-change／contain。256-node 上限直接保留在 filterTier，沒有引進 #7080 crop。                                                                                                | `b6f2bec16:packages/core/src/runtime/captureMotionBlur/filterTier.ts:97`                                                                          | `packages/core/src/runtime/captureMotionBlur/filterTier.ts:99`、`:229`                                                                                 |
| `4bee04e4a`／[#7295](https://github.com/heygen-com/hyperframes/pull/7295) | 延後，與 #7080 成組：pseudoBox 是接在本線不存在的 grownBox／contentBox 上；只搬 helper 沒有作用。等 #7080 的 Range／overflow／SVG 管線與此修正一併驗 before／after、旋轉與 ancestor transform、overflow hidden、SVG mask／clip、正反 seek 及輸出 RGBA。                                             | `4bee04e4a:packages/core/src/runtime/captureMotionBlur/frames.ts:59`、`:82`；`d89bf35b1:packages/core/src/runtime/captureMotionBlur/frames.ts:79` | `packages/core/src/runtime/captureMotionBlur/frames.ts:43`、`:61`（仍以 offsetWidth／offsetHeight 取 crop）；原 #7080 裁決保留                         |
| `e2bb7da25`／[#7288](https://github.com/heygen-com/hyperframes/pull/7288) | 採用：auto 一律 filter，capture 保持明確 opt-in，HDR／renderer-off 仍優先；移除 translationOnly hand-off。CLI finding、Beta label、guide／skill 同步；不把上游成本量測宣稱成本線重新量測。engine 端只有 `captureMotionBlur.pixels.browser.test.ts` 存在於本線，其 capture tier 明確指定由 `f6edc275d` 補採（Windows CI 曾因漏採而失敗）；其餘 engine fixture／sweep／differential 測試本線沒有。                                                                                                          | `e2bb7da25:packages/core/src/runtime/captureMotionBlur/tier.ts:70`；同 SHA `docs/guides/motion-blur.mdx:46`                                       | `packages/core/src/runtime/captureMotionBlur/tier.ts:69`；`packages/core/src/runtime/captureMotionBlur/index.ts:652`；`docs/guides/motion-blur.mdx:46` |
| `66cbabc39`／[#7298](https://github.com/heygen-com/hyperframes/pull/7298) | 採用：Shift 只更新容器 data attribute，cursor 交由 CSS，不以 React state 重渲染 timeline；blur／keyup 清除 modifier。                                                                                                                                                                               | `66cbabc39:packages/studio/src/player/components/useTimelineShiftModifier.ts:4`                                                                   | `packages/studio/src/player/components/useTimelineShiftModifier.ts:4`；`packages/studio/src/player/components/timelineProviderStateBuilders.ts:79`     |

### 適配、依賴與延後條件

`#7271 -> mute callbacks -> discover / pose reads -> seek(t) -> finally unmute`。本線沒有上游後續 scanMovers／holdFrame 介面，維持 `config.events` 驅動 onUpdate 與 `readMoverFrames` 最後的 `seek(t)`；不覆蓋 #6983 shutter phase 與復原。兩個 tier 的 once guard 回歸同時釘「掃描／跨過 callback 的 shutter pose read 都不先消耗 callback、回到原本 0.3／0.499 秒、真 seek 0.7 秒才寫 label」；異常測試確認 onUpdate 中途 throw 仍恢復 callback。

#7271 的已知限制保留：若 mover 要等首次被靜音的 callback 才建立，較早啟動的 worker 會讓它保持銳利；由 `tl.call(() => gsap.to(...))` 建立的 mover 不會被掃描到。非 GSAP adapter 若忽略 suppressEvents，once-only 完成 callback 仍可能提早寫 DOM；沒有宣稱這些限制已解。

本線沒有註冊上游新增的 CLI motion-blur topic，沒有留下無入口檔案；將相同設定摘要放入既有 `packages/cli/src/docs/rendering.md`，正式 guide 與 CLI 參考同步更新。

#7292／#7293 是 #7288 預設 filter 可獨立採用的修正；#7295 依賴原本已延後的 #7080，沒有藉預設切換偷偷搬入 crop／SVG 大改。上游新增的 browser differential／callback matrix 依賴本線尚未採用的 harness，未整批建立；保留現有 browser pixel test，聚焦驗證真實 filter trail。#7134 的 publish workflow、Docker、版本／lockfile 與 share 大型新 package 均未套用；發布 guard 保持。

指定八筆沒有 #6940 audioDeliveryLimit／true-peak limiter，#7246 維持延後，條件為 limiter 成組採用後驗 AAC -1.2 至 -1 dBTP、重複輸出 bytes 與分散式 loudness。#7182 等長來源分段副本與離線長片驗收；#7176 等維護者決定遙測政策；#7104／#7168 retry 等新 session 所有權、取消與一次性重試契約；#6716 的 17 檔遷移等 Windows 私有快取根與完整 guard 測試。所採六筆不依賴這四組。

實際 PR 水位 #7242、issue #7223 保持，不退回提示中的 #7189，也不越過尚未裁決的 #7243。monitored 維持實際 baseline 的 96 筆，這八筆沒有對應項目，#6695 保留舊 head；沒有以未讀的新 head 消除 strict 缺口。

八筆均沒有 golden／LFS pointer 變更；既有 #6665 pointer 保留，需上傳的新 LFS 物件：無。只有延後的 #7134 新增 share package 的預算，所採六筆沒有 core／CLI 的上游同 commit 增量，不能為既有超標提高 budgets。採用產品的上游作者為 Miguel Ángel 與 Vance Ingalls，#7271／#7293／#7292／#7288 另附 Claude Sonnet 5.5 attribution；email 僅供 Co-authored-by，不寫入文件。

### 聚焦紅綠與最終驗證

| 範圍                                                 | 舊碼紅燈                                                                                      | 最終聚焦                                         | exit 舊／新 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------- |
| core：mute／tier／filter guards                      | 120 passed／11 failed；五例是新 helper 不存在，其餘含 auto tier、SVG 與 fixed-child 行為斷言  | 加 frames／discover 共 164 passed／0 failed      | 1／0        |
| #7271 once guard（乾淨 HEAD 注入測試後恢復原 bytes） | capture／filter 與 0.3／0.499 秒四例均在 `expected true to be false` 失敗：掃描提前消耗 guard | 四例均通過，包含回到原時點與真正 seek 才寫 label | 1／0        |
| CLI：craftAudit／checkMotionBlur                     | 37 passed／2 failed：measured 為空，tier-auto 多報 finding                                    | 含 CLI docs 共 41 passed／0 failed               | 1／0        |
| Studio：Shift modifier／meta／Blur panel             | 15 passed／3 failed：attribute／cursor／Beta label                                            | 18 passed／0 failed                              | 1／0        |

命令為套件 cwd 的 `bun x vitest run <files> --maxWorkers=2 --reporter=json --outputFile=<ignored json>`，檔案清單與原始斷言見 `red-core-final.*`、`red-once-guard-final.*`、`red-cli.*`、`red-studio.*`、`final-core-guard.*`、`delivery-cli-docs.*`、`final-studio.*`。初次適配有缺閉括號的 transform error，修正後才取得上述綠燈，沒有把編譯錯誤當成 bug 重現。最終 core 聚焦同時包含 GSAP callback 參數／scope、nested mute、onUpdate throw 復原與 #6983 phase 測試。

最小真實瀏覽器驗收只取一個現有 filter trail 像素案例：engine cwd 的 `bun x vitest run src/services/captureMotionBlur.pixels.browser.test.ts -t "leaves a trail along the motion line, in the filter tier" --maxWorkers=1 --reporter=json --outputFile=<ignored json>` exit 0，1 passed／0 failed／16 未選取；確實執行了像素斷言，沒有把 skip 當成功。沒有另建 smoke data、重跑同一瀏覽器案例或宣稱已驗全部上游 differential matrix。

### 靜態閘門與封裝

core／CLI／Studio build 均 exit 0；CLI 在最終內建 rendering topic／Craft warnings／motion blur 文件完成後重建，`delivery-build-cli.*` exit 0，最後封裝量測為 `delivery-pack-cli.*`。lefthook 三組 `node node_modules/typescript/bin/tsc --noEmit -p <packages/core/tsconfig.json|packages/studio/tsconfig.json|scripts/tsconfig.json>` 均 exit 0、無輸出。`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0，結尾 `No issues in 27 changed files`；new-only gate 排除一筆 inherited complexity finding，沒有放寬門檻。最初呼叫不存在的 fallow.cmd 是啟動錯誤，改用實際 `.bin/fallow` 後成功，不列作產品失敗。

變更 TypeScript 的 oxlint exit 0、0 warnings／0 errors；`node scripts/check-cli-process-ownership.mjs` 與改動 Studio 檔案的 `node scripts/check-studio-file-size.mjs <files>` 亦 exit 0；`bun packages/cli/scripts/gen-skills-manifest.ts --check` exit 0，`skills-manifest.json is in sync (7 skills)`。只直接執行檢查，沒有執行會 staging 的 lefthook format job。完整套件啟動後產品程式只有非語意格式／換行調整；core 測試刪掉一例重複異常案例，另把 once guard 由兩例擴為四例、加入實際 mover 幾何及跨 callback 的 shutter window。全套仍記當時實跑的原始個數，最終產品程式的語意保持，最終聚焦與輸入雜湊另保留於 `final-product-inputs.json`，不把後補 hash 冒稱為全套啟動時的 bytes。

雙樹重建 dist 後以 `pnpm pack --json --pack-destination <ignored directory>` 單純量測（沒有安裝依賴或新增 lockfile），原始大小見 `package-sizes.json`。

| 套件 | HEAD packed／unpacked | 移植 packed／unpacked | 判定                                |
| ---- | --------------------- | --------------------- | ----------------------------------- |
| core | 1681999／4057971      | 1681350／4056727      | 雙樹 packed 既有超標；unpacked 通過 |
| cli  | 8500040／24202857     | 8500352／24197584     | 雙樹 packed／unpacked 既有超標      |

保留 1% 容差及現有 budgets；所採六筆沒有上游同 commit 的預算增量，延後的 #7134 只有新 share package 預算，不能用來提高 core／CLI 門檻。封裝大小缺口未消除。

### 水位 `66cbabc39` 時點的剩餘快照

2026-11-06、fork HEAD `46d98d9bd` 的收尾 `python tools/check_upstream_updates.py --strict` exit 1，完整報告為 `strict-final.md`；上游 tip `cb8e02e82`。水位以上 10 個 commit（下一筆 `6011d9d`／#7299）、PR #7242 以上 61 筆、issue #7223 以上 11 筆；96 筆 monitored 中 #6695 一筆 open head 差異，原釘 `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`、查詢為 `3b2321c`。此為水位 66cbabc39 的日期快照；現行剩餘數字只在後續最新節維護，歷史節的日期快照保留；沒有為 strict 歸零越過指定八筆或釘選未讀補丁。

### 完整套件與乾淨 HEAD 的逐名比較

乾淨樹由 `git archive HEAD` 建立，第三方依賴以 junction 共用，各 workspace 指向乾淨樹自身。core／CLI／Studio 與 scripts 共 3665 個 archive 檔案逐 byte 比較差異 0（`archive-parity.json`）。重建乾淨樹 parsers、lint、core、studio-server、Studio、inspector、player、CLI dist 均 exit 0；移植樹三個受影響 package 亦 build 成功。初次環境處理遇到 dangling ignore junction，改指向已安裝的實體套件後完成，沒有修改產品或依賴宣告。

兩樹的三個套件各執行一次完整 suite，`--maxWorkers=2`，並以 JSON reporter 保留逐名結果。命令為套件 cwd 的 `bun run test --maxWorkers=2 --reporter=json --outputFile=<ignored json>`；Studio 的同一個 underlying command 為 `node <tree>/packages/studio/node_modules/vitest/vitest.mjs run --maxWorkers=2 --reporter=json --outputFile=<ignored json>`。沒有因 wrapper 逾時重新啟動任何完整 suite。

| 套件   | 乾淨 HEAD pass／fail／skip | 移植 pass／fail／skip | 實際 test runner exit HEAD／移植 | 只在移植樹失敗（含 suite error） |
| ------ | -------------------------- | --------------------- | -------------------------------- | -------------------------------- |
| core   | 5607／0／11                | 5618／0／11           | 0／0                             | 0                                |
| cli    | 6237／35／307              | 6246／29／307         | 1／1                             | 0                                |
| studio | 7938／229／2               | 7940／229／2          | 1／1                             | 0                                |

Studio 的 Bun wrapper 兩樹均在初設 900 秒逾時，這兩個 wrapper 結果維持 incomplete。Vitest 子行程沒有被終止，沿用原本行程、原本輸出檔，透過已開啟的 Windows process handle 等待其真正結束並取 exit code；沒有重跑已完成案例。具名上限為 `UPSTREAM_STUDIO_BATCH_CAP_SECONDS=1800`、`UPSTREAM_OVERALL_CAP_SECONDS=3600`，overall 從這段全套開始時起算；原始命令、PID、時間、exit 1 保存在 `studio-processes.json`、`head-studio-native.result.json`、`port-studio-native.result.json`。兩樹實際耗時分別約 1172／1213 秒，均在上限內完成；不把 wrapper timeout 改記成成功。

逐名清單為 `head-{core,cli,studio}.failures.json` 與 `port-{core,cli,studio}.failures.json`，差集、清單 SHA-256、runner／wrapper exit 都存於 `comparison.json`。三套原始逐名差集與 suite-error 差集均為 0，沒有作失敗項目的重跑或藉聚焦改寫全套結果。Studio 229 個失敗的名稱集合 SHA-256 兩樹完全相同：`9b37556d350508f4a8606a50a88ceb839fc0256b652ffb7a8e9ce693cca76907`。CLI 另外六個只在 HEAD 失敗的 browser／warmCheck 案例保留原始清單，不宣稱是這六筆修正解決。

core 全套是在測試清理／加強前取得，保留原始 5618 個 passed；後續只移除一例重複異常測試並加強 once guard 的幾何與兩個跨 callback 案例，最終 focused 164 passed（`final-core-guard.*`），不虛構最終全套的個數。產品程式語意沒有在全套後改動。

受影響產品來源只有 core／CLI／Studio；沒有建立依賴缺失的 producer／engine harness 檔案。producer 未改產品檔，不擴大跑 producer lane；engine 只跑上述一個真實 filter trail 像素案例。沒有執行 `tools/test_product.ps1 -Full`。CLI／Studio 全套仍有既有失敗，封裝大小仍超標，strict 仍有範圍外未審項目，不能宣稱完整產品驗收綠燈；ROADMAP 近期列保留。

### 維護 gate 收尾

2026-11-06、fork HEAD `46d98d9bd` 的 `pwsh -NoProfile -File tools/dev_check.ps1` exit 0：39 passed／0 failed（`dev-check-final.log`）；12 份維護文件、0 個斷鏈，結尾 `WINDOWS DEV CHECK GREEN`。新節與 MDX 修改已用 `node_modules/.bin/oxfmt --ignore-path <empty-ignore>` 格式化，歷史節只改過期的「最新」標題與快照定位；`git diff --check` exit 0。最終工作樹的 changed／untracked SHA-256 存於 `delivery-inputs.json`，不冒稱為完整 suite 的啟動快照。

## 2026-11-06：接續至 `9e2510bda`，審查 8 個連續 commit

以 fork `537b88dbe9896c264fbe89e915bbb8b4aa4191b6` 為起點，只審 `6011d9d0d..9e2510bda` 八筆連續 commit。起始 `python tools/check_upstream_updates.py --strict` exit 1，報告存於忽略目錄 `tmp/upstream-20261106-601/strict-initial.md`；八筆的唯讀 `gh pr view --repo heygen-com/hyperframes --json state,mergeCommit,headRefOid,mergedAt` 均為 MERGED，mergeCommit 與下表一致。實際 baseline 的 PR #7242、issue #7223、monitored 96 筆保持，不退回提示中的舊水位或舊筆數。完整補丁與 reporter 同存此忽略目錄。

| Commit／PR                                                                | 裁決與理由                                                                                                                                                                                                                                                                                                                                                                                                                          | 上游證據                                                                        | fork 證據                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| `6011d9d0d`／[#7299](https://github.com/heygen-com/hyperframes/pull/7299) | 採用：variable supplement 在涵蓋的 bundled exact weights 另發 face，避免 Latin Extended 字母落到系統字型。                                                                                                                                                                                                                                                                                                                          | `6011d9d0d:packages/core/src/fonts/deterministicFonts.ts:691`                   | `packages/core/src/fonts/deterministicFonts.ts:690` |
| `8fd754207`／[#7301](https://github.com/heygen-com/hyperframes/pull/7301) | 採用：Chrome install worker 提高一級優先權；EPERM／EACCES 仍靜默退回正常優先權，lint 的 background 政策保留。                                                                                                                                                                                                                                                                                                                       | `8fd754207:packages/cli/src/renderSetupWorker.ts:25`                            | `packages/cli/src/renderSetupWorker.ts:24`          |
| `41b7aeeaf`／[#7262](https://github.com/heygen-com/hyperframes/pull/7262) | 部分採用：non-TTY 狀態改變或持續一分鐘時輸出進度，JSON 保持靜默。style-sampling remix／manifest 不適用，本線只有七個現有技能；說明同步既有 CLI 文件。                                                                                                                                                                                                                                                                               | `41b7aeeaf:packages/cli/src/commands/cloud/render.ts:1025`                      | `packages/cli/src/commands/cloud/render.ts:999`     |
| `3e86def58`／[#7265](https://github.com/heygen-com/hyperframes/pull/7265) | 採用並適配：video 在 cut 前最多一秒隱藏播放，以 0.5–2 倍速度追上，visible 後恢復溫和 steering；paused／render seek 不提前播放。保留本線 out-point、audio 與 source-window 行為。                                                                                                                                                                                                                                                    | `3e86def58:packages/core/src/runtime/media.ts:396`                              | `packages/core/src/runtime/media.ts:310`            |
| `fc0b53361`／[#7261](https://github.com/heygen-com/hyperframes/pull/7261) | 不適用：本線沒有 commands/media-use/{voices,generate}、heygen/generate 或 style-sampling 技能。既有 media-use 是 resolve.mjs passthrough，沒有 clone catalogue／public voice picker；若日後成組採用 HeyGen generation，必須同採 workspace 所有權提示、語言碼正規化與 multilingual 拒絕測試。                                                                                                                                        | `fc0b53361:packages/cli/src/heygen/generate.ts:619`                             | `packages/cli/src/commands/media-use.ts:32`         |
| `9fcd06cbb`／[#7305](https://github.com/heygen-com/hyperframes/pull/7305) | 採用：check_report 只帶 allowlist stop_code，沒有停止 finding 時省略。沿用既有 telemetry opt-out，沒有引進 #7176 的使用者資料或擴大遙測啟用政策；本線沒有外部 consumer，STOP_CODES 保持模組私有以通過 fallow。                                                                                                                                                                                                                      | `9fcd06cbb:packages/cli/src/utils/checkPipeline.ts:2133`                        | `packages/cli/src/utils/checkPipeline.ts:2128`      |
| `07824098e`／[#7302](https://github.com/heygen-com/hyperframes/pull/7302) | 成組延後：本線沒有 blurPage／differentialPage／liveness 與 producer blurDifferential harness。單搬 CI fail-closed 或新 helper 會沒有 consumer／缺 fixture；先採已延後的 #6967 differential harness 與 callback／crop fixtures，再同採 CI 缺 Chrome／drawElementImage／ffmpeg 必須失敗、inside 實際有 blur、held-card slide-out 與 serial producer integration lane；驗 Windows、CI 負例與逐幀結果，禁止只搬 helper 冒稱 gate 完成。 | `07824098e:packages/engine/src/services/__fixtures__/motionBlur/blurPage.ts:22` | `packages/producer/scripts/run-test-lane.mjs:35`    |
| `9e2510bda`／[#7263](https://github.com/heygen-com/hyperframes/pull/7263) | 不適用：本線沒有 templates pull／五個 plan-gated style-sampling packs，也沒有對應 pinned digest；不新建無入口的指紋清單。若引入 templates／billing 下載管線，必須成組採用新版完整性校驗與 release-check payload。                                                                                                                                                                                                                   | `9e2510bda:packages/cli/src/commands/templates.ts:37`                           | `packages/cli/src/cli.ts:133`                       |

### 依賴、延後與對外邊界

```text
preview playing -> hidden pre-roll -> proportional steering -> cut -> gentle steering
paused / render-driven seek -> no pre-roll
```

#7265 在本線沒有上游後續 WebKit／out-point metadata 的區塊上作最小適配，沒有搬入 #7232 或改本線的 source-duration 與 WebAudio 契約。舊 learned start-latency seam 由固定 pre-roll 取代，上游對應的舊測試同步替換為可觀察播放行為；既有非 latency 測試保留。#7305 的 type-only StopCode import 沒有建立 runtime 循環，stop_code 僅三個固定代碼，不包含訊息／路徑／素材內容。

#6940 的 audioDeliveryLimit／limiter 前置未出現在指定八筆，#7246 保持延後：成組採用 limiter 後驗真實 AAC -1.2 至 -1 dBTP、重複輸出 bytes 與分散式 loudness。#7182 等長來源分段副本與離線長片驗收；#7176 等維護者決定遙測政策；#7104／#7168 retry 等新 session 所有權、取消與一次性重試契約；#6716 的 17 檔遷移等 Windows 私有快取根與完整 guard 測試。採用的五筆不依賴以上延後內容。#7134 的 share host／kernel 與 #7295 的 #7080 overflow／SVG crop 維持先前成組條件。

八筆沒有到達 monitored 的項目，96 筆原釘選保留；#6695 的未讀 open head 差異不藉重釘消除。PR 水位不越過尚未完整裁決的 #7243，commit 軸的已合併證據不代表 PR 軸已連續清空。

八筆沒有 golden 或 LFS pointer 變更，既有 #6665 pointer 保留；需上傳的新 LFS 物件：無。`3e86def58:scripts/package-size-budgets.json:35` 只將 player packed 增加 1655 bytes；player 以 `noExternal: ["@hyperframes/core"]` 打包，`packages/player/src/parent-media.ts:22` 引入 core 的 media-steer，所以本線同樣採用此增量（157145→158800）。此預算只由 publish workflow 檢查，不移用該增量提高 core／CLI 預算。其餘所採補丁沒有相關預算增量。

採用產品的上游作者為 Miguel Ángel（#7299、#7301、#7265、#7305）與 WaterrrForever（#7262）；email 僅供 Co-authored-by，不寫入文件。

### 聚焦紅綠

| 範圍                                          | 舊碼 pass／fail                            | 移植 pass／fail | exit 舊／新 |
| --------------------------------------------- | ------------------------------------------ | --------------- | ----------- |
| bundledSubset                                 | 2／1，缺 bundled exact weights 的補充 face | 3／0            | 1／0        |
| Chrome install priority                       | 6／1，未設定 above-normal                  | 7／0            | 1／0        |
| media／mediaSteer／preseek／init.videoPreseek | 187／9，包含未提前啟動與 hidden rate 錯誤  | 196／0          | 1／0        |
| cloud render／telemetry events／check         | 260／3，包含未輸出 minute tick 與 stopCode | 263／0          | 1／0        |

命令為各套件 cwd 的 `bun x vitest run <files> --maxWorkers=2 --reporter=json --outputFile=<ignored json>`。`red-core.json`、`red-cli.json`、`red-media.json`、`red-more-cli.json` 保存舊碼斷言；`green-core.json` 合計 199 passed／0 failed，`green-cli.json` 合計 270 passed／0 failed。測試先注入舊碼再修改產品，未以編譯錯誤當行為重現；新增 logsTick 為舊版缺 helper 的負例，其餘有實際行為斷言。初次適配檢查發現缺少 isHiddenPreRoll 局部變數，於第一次綠測前補齊，未將此錯誤列為回歸證據。

### 雙樹建置、靜態閘門與封裝

乾淨樹以 `git archive HEAD` 建立，第三方依賴以 junction 共用，各 workspace 指向乾淨樹自身。core／CLI／scripts 的 1861 個 archive 檔案逐 byte 比較差異 0（`archive-parity.json`）。乾淨樹重建 parsers、lint、core、studio-server、Studio、inspector、player、CLI dist 全部 exit 0；移植樹 core／CLI build exit 0，CLI 模組私有化後再 build 亦 exit 0。archive 的歷史 compiled.html LFS 警告原樣保留，沒有改寫 fixture 或把它視為受影響套件通過證據。

lefthook 三組 `node node_modules/typescript/bin/tsc --noEmit -p <packages/core/tsconfig.json|packages/studio/tsconfig.json|scripts/tsconfig.json>` 全部 exit 0、無輸出（`{core,studio,scripts}-tsc.result.json`）。初次 Python static wrapper 用不可由 CreateProcess 直接執行的 fallow shim 失敗，三個 tsc 的 exit 0 結果保留；改用 PowerShell 執行實際 `.bin/fallow`。第一次 audit exit 1，唯一新增 dead-code finding 是 STOP_CODES 的多餘 export；改為模組私有後，`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0，結尾 `No issues in 18 changed files`。既有一組 69-line clone 由原 new-only gate 排除，沒有改排除設定、門檻或其他 package。

16 個變更 TypeScript 檔的 `node_modules/.bin/oxlint <files>` exit 0：0 warnings／0 errors；`node scripts/check-cli-process-ownership.mjs` exit 0：`CLI process ownership verified: only process roots terminate the process.`。沒有執行會 staging 的 lefthook format job。最終 CLI 聚焦 `final-focused-cli.json` 仍 270 passed／0 failed，exit 0。

額外的 `node node_modules/typescript/bin/tsc --noEmit -p packages/cli/tsconfig.json` 雙樹均 exit 2：check.test.ts 一例 TS18048（deadline 可能 undefined）與兩例 TS2554（assertKnownFlags 呼叫參數）。乾淨 HEAD 在 2287／3834／3835 行，移植在 2287／3838／3839 行；除新增測試造成的行號位移外內容完全相同，新增錯誤為 0（`cli-tsc-comparison.json`）。這不改寫為整個 CLI typecheck 綠燈；lefthook 的三組門檻與這個額外檢查分開記錄。

雙樹以 `pnpm pack --json --pack-destination <ignored directory>` 單純量測，沒有安裝依賴或新增鎖檔；來源與大小存於 `package-sizes.json`，最終 CLI 再建置／量測為 `delivery-pack-cli.log`。

| 套件 | HEAD packed／unpacked | 移植 packed／unpacked | 判定                                |
| ---- | --------------------- | --------------------- | ----------------------------------- |
| core | 1681350／4056727      | 1681651／4058035      | 雙樹 packed 既有超標；unpacked 通過 |
| cli  | 8499470／24203584     | 8501202／24198988     | 雙樹 packed／unpacked 既有超標      |

保留 1% 容差與現有 budgets；所採 commit 沒有可套用於 core／CLI 的預算增量，不以無出處的預算提高消除超標。封裝大小缺口保留，不宣稱完整產品驗收通過。

### 完整套件與乾淨 HEAD 逐名比較

只有 core／CLI 產品來源變更，兩樹各跑一次完整 `bun run test --maxWorkers=2 --reporter=json --outputFile=<ignored json>`；逐筆命令、開始時間、耗時及 exit 存於 `head-{core,cli}.result.json`／`port-{core,cli}.result.json`。per-batch 可設定上限為 `UPSTREAM_SUITE_TIMEOUT_SECONDS=2400` 秒，整段監看停止上限為 3600 秒；實際從第一套啟動到最後一套結束約 971 秒，沒有 timeout。沒有執行 `tools/test_product.ps1 -Full`，也沒有重跑任何完整 suite。

| 套件 | 乾淨 HEAD pass／fail／skip | 移植 pass／fail／skip | exit HEAD／移植 | 只在移植樹失敗（含 suite error） |
| ---- | -------------------------- | --------------------- | --------------- | -------------------------------- |
| core | 5619／0／11                | 5625／0／11           | 0／0            | 0                                |
| cli  | 6240／35／307              | 6250／29／307         | 1／1            | 0                                |

逐名清單為 `head-{core,cli}.failures.json`／`port-{core,cli}.failures.json`，差集與清單 SHA-256 存於 `comparison.json`。CLI 的 29 個移植樹失敗全部在乾淨 HEAD 重現；六個只在 HEAD 失敗的 snapshot late-image／warmCheck browser 案例另保留清單，不宣稱它們由這五筆修正解決。兩樹 suite-error 差集也為 0。CLI 完整套件仍非 0 failed，不能稱作完整產品驗收通過。

CLI 模組私有化發生在兩樹 CLI 全套啟動前；產品來源在全套啟動後只有 oxfmt 的非語意格式調整，沒有新增、移除或改寫測試。CLI 最終 dist 在全套執行期間再建置，其封裝數字取最後一次輸出；不把全套起始的 `suite-inputs.json` 冒稱為最終 bytes 快照。最終 changed／untracked hash 另存 `delivery-inputs.json`。producer／engine 沒有產品或測試變更，不擴大執行其 lane；#7302 的 producer serial lane 條件明確保留在 ROADMAP，沒有用其他 runner 取代該驗收。

### 剩餘快照（水位 `9e2510bda`）

2026-11-06、fork HEAD `537b88dbe` 的最後 `python tools/check_upstream_updates.py --strict --baseline tmp/upstream-20261106-601/candidate-baseline.json --output tmp/upstream-20261106-601/strict-final.md` exit 1。候選 baseline 與驗證後寫入的正式 `tools/upstream_baseline.json` 逐 byte 相同；只推進已逐筆審查的連續 commit 水位，不改 PR／issue／monitored。上游 tip `410a516ce`；尚有 3 個 commit，下一個是 `f3e45b492`／#7310；PR #7242 以上 62 筆、issue #7223 以上 11 筆，96 筆 monitored 中 #6695 一筆 open head 差異（原釘 `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`，查詢 `3b2321c`）。這是水位 `9e2510bda` 時點的歷史快照，現行剩餘數字見本檔最新節。沒有為 strict 歸零越過指定八筆，ROADMAP 近期列保留。

### 維護 gate 收尾

2026-11-06、fork HEAD `537b88dbe` 的 `pwsh -NoProfile -File tools/dev_check.ps1` exit 0：39 passed／0 failed，12 份維護文件、0 個斷鏈，結尾 `WINDOWS DEV CHECK GREEN`（`dev-check.log`）。Markdown／MDX 新增內容以 `node_modules/.bin/oxfmt --ignore-path <empty-ignore>` 格式化；歷史段落保留原格式，只改舊節「最新」標題與快照定位，沒有整檔重排。`git diff --check` exit 0。

## 2026-11-06：接續至 `4cf26b5b4`，審查 5 個連續 commit

以 fork `4cf9a241d` 為起點。起始 `python tools/check_upstream_updates.py --strict` exit 1：baseline `9e2510bda` 之後上游已有 5 個 commit（前一節記錄時為 3 個，其後上游又合併 #7316、#7317），PR #7242 以上 67 筆。本節審完這 5 個 commit（`f3e45b492..4cf26b5b4`）並把 PR 軸推進到 #7250。五筆的唯讀 `gh pr view --repo heygen-com/hyperframes` 均為 MERGED，commit 軸每筆都以 `git show --stat` 列出上游動到的全部檔案並逐檔判定。

### commit 軸

| Commit／PR                                                                | 裁決與理由                                                                                                                                                                                                                                                                                                              | 上游證據                                                                  | fork 證據                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `f3e45b492`／[#7310](https://github.com/heygen-com/hyperframes/pull/7310) | 採用：MPEG-4 Part 2 與 MJPEG 影片 Chrome 不能解碼，加入 browser-hostile 表（`representativeMime: null`、預先轉出可播放副本），與 prores 同路徑。                                                                                                                                                                         | `f3e45b492:packages/studio-server/src/helpers/mediaCodecMap.ts:71`        | `packages/studio-server/src/helpers/mediaCodecMap.ts:71`            |
| `cb8e02e82`／[#7309](https://github.com/heygen-com/hyperframes/pull/7309) | 延後：修的是 #6912（`e181d34ed`）引入的 `releaseRouted` handover，本線沒有 #6912，`webAudioTransport.ts` 沒有 `_handedOver`／`releaseRouted`，補丁（`_handedOver` 改 Set、`dispose(routed,false)`、`reconnectHandedOver`）無處可套。沿用既有條件：與 #6912／#7225／#7232 的 WebKit 接管管線、記憶體預算與 Safari 音訊時鐘驗收成組採用。 | `cb8e02e82:packages/core/src/runtime/webAudioTransport.ts:1056`           | `packages/core/src/runtime/webAudioTransport.ts:1091`（無 handover） |
| `410a516ce`／[#7314](https://github.com/heygen-com/hyperframes/pull/7314) | 不適用：只改 `skills/reverse-any-video`（HeyGen 付費方案與帳戶流程的技能）與其 manifest／檢查，本線沒有該技能，沿用 2026-11-02 對 reverse-any-video／billing 的不採邊界。                                                                                                                                                | `410a516ce:skills/reverse-any-video/references/start.md:4`                | `skills/`（七個技能，無 reverse-any-video）                         |
| `de2d21a8a`／[#7316](https://github.com/heygen-com/hyperframes/pull/7316) | 採用並適配：check_report 帶「必要副本」總數、等待毫秒、未完成數（僅計數與毫秒）；副本等待逾時仍是 browserSkipped，只在逾時造成未完成時才計 unfinished。本線 `preResolveHostileMediaProxies` 沒有上游後續的 copy window／百分比，所以只移植 `record` callback 與 keepPartial，不搬入 `limits`／`heartbeat.percent`。          | `de2d21a8a:packages/cli/src/utils/checkBrowser.ts:337`                    | `packages/cli/src/utils/checkBrowser.ts:275`                        |
| `4cf26b5b4`／[#7317](https://github.com/heygen-com/hyperframes/pull/7317) | 採用並適配：render 讀 `data-composition-src` 與 preview 一致（`%xx` 解碼、前導 `/` 視為專案根），任何離開專案資料夾的路徑（`..`、`%2e%2e%2f`）一律拒絕，並改寫 `%20` 資料夾下的 sibling asset 路徑。本線入口 HTML 仍用 `readFileSync(htmlPath, "utf-8")`（沒有上游 `readTextFile`），只在其後套 `normalizeCompositionSrcs`。 | `4cf26b5b4:packages/producer/src/utils/paths.ts:141`                      | `packages/producer/src/utils/paths.ts:141`                          |

#### 上游動到的檔案逐檔判定

| Commit    | 檔案                                                                                          | 判定                                                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `f3e45b492` | `packages/studio-server/src/helpers/mediaCodecMap.ts`、`mediaCodecMap.test.ts`                | 兩檔皆採用；同目錄沒有 `*.browser.test.ts`／`*.chromium.test.ts` 依賴此表。                                                                                                       |
| `cb8e02e82` | `packages/core/src/runtime/webAudioTransport.ts`、`webAudioTransport.test.ts`                | 兩檔皆不動（先決 #6912 未採）；core runtime 無變更，因此 `tsconfig.runtime.json` 型別檢查不適用。                                                                                  |
| `410a516ce` | `scripts/check-core-skills.test.mjs`、`skills-manifest.json`、`skills/reverse-any-video/{SKILL.md,references/start.md}` | 全部不適用；`skills-manifest.json` 不能單獨改（本線七技能的 hash 與上游不同）。                                                                                                     |
| `de2d21a8a` | `packages/cli/src/commands/check.test.ts`、`telemetry/events.ts`、`telemetry/events.test.ts`、`utils/checkBrowser.ts`、`utils/checkPipeline.ts`、`utils/checkTypes.ts` | 六檔皆採用（`checkBrowser.ts`、`check.test.ts` 手工適配）。fork 有而上游未動的 `utils/checkBrowser.test.ts`、`utils/checkDeadline.process.test.ts` 等不引用新欄位，不需改。 |
| `4cf26b5b4` | `packages/producer/src/services/htmlCompiler.ts`、`htmlCompiler.test.ts`、`utils/paths.ts`   | 三檔皆採用（`htmlCompiler.ts` 手工適配入口讀檔）。上游沒有動任何 `*.browser.test.ts`／`*.chromium.test.ts`；fork 的 producer 瀏覽器／整合測試不涉及 composition src 解析，不需同步。 |

本批五筆上游補丁均未觸及 `*.browser.test.ts` 或 `*.chromium.test.ts`，fork 端也沒有需要跟著改的此類檔案，因此沒有重蹈上一批漏改引擎瀏覽器測試的覆轍。

### PR 軸

| PR                                                                        | 裁決與理由                                                                                                                                                                                                                                               | 上游證據                                                                                       | fork 證據                                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [#7243](https://github.com/heygen-com/hyperframes/pull/7243)              | 不適用：作者於 2026-11-05 自行關閉未合併（head `4abccc7297f6e50d3c615abef7c341e4cdeec20b`）。關閉留言說明 20 次觸發實驗中有無此修正皆沒有 in-play 換源，Windows 預覽卡頓回報另待可重現的新修正。沒有可移植的合併補丁，也沒有重訪條件，不釘 monitored。 | `gh pr view 7243`：state CLOSED、mergeCommit null                                              | `packages/core/src/runtime/mediaProxy.ts`（未動）                               |
| [#7244](https://github.com/heygen-com/hyperframes/pull/7244)              | 已採用（`0a6746e1d` 那節）：只靜默 EPERM／EACCES 的 lint 優先權錯誤。                                                                                                                                                                                      | `c1977fab3:packages/cli/src/renderSetupWorker.ts:23`                                           | `packages/cli/src/renderSetupWorker.ts:22`                                      |
| [#7245](https://github.com/heygen-com/hyperframes/pull/7245)              | 已採用並補副本取消先決（`0a6746e1d` 那節）：`check --budget` 與 partial report。                                                                                                                                                                          | `b7d72c947:packages/cli/src/utils/checkDeadline.ts:28`                                         | `packages/cli/src/commands/check.ts:334`                                        |
| [#7246](https://github.com/heygen-com/hyperframes/pull/7246)              | 維持延後：需要 #6940 的 `audioDeliveryLimit`／true-peak limiter，本線沒有該檔。條件不變：成組採用 limiter 後驗真實 AAC -1.2 至 -1 dBTP、重複輸出 bytes 與分散式 loudness。                                                                                  | `d40d0b251:packages/producer/src/services/render/audioDeliveryLimit.ts:31`                     | `packages/producer/src/services/render/`（無 `audioDeliveryLimit*`）            |
| [#7247](https://github.com/heygen-com/hyperframes/pull/7247)              | 維持延後：依賴未採的 #6621 unknownSubcommand／path／presented-error 契約，本線沒有 `didYouMean.ts`。條件不變：與解析契約成組採用，驗 exit 2、精簡 stderr、JSON hint 與 skill 路徑。                                                                          | `0a6746e1d:packages/cli/src/utils/didYouMean.ts:17`                                            | `packages/cli/src/utils/`（無 `didYouMean.ts`）                                  |
| [#7248](https://github.com/heygen-com/hyperframes/pull/7248)              | 已採用並補 #6829（`b108f8512` 那節）：bundler StaticGuard 與 lint 共用 `linkedSources`。                                                                                                                                                                  | `0b3559824:packages/core/src/compiler/staticGuard.ts:1`                                        | `packages/core/src/compiler/staticGuard.ts:1`、`packages/lint/src/project.ts:160` |
| [#7249](https://github.com/heygen-com/hyperframes/pull/7249)              | monitored（open，釘 head `4dc886748172c5ccd1e378df7ae977a575356617`）：`isTemplateEntry` 改以結構判斷（完整 HTML 文件內含 `<template>` 的場景檔）。重訪條件：合併後連同 `locateSceneRoot`、`compileStage` 測試與 core packed 預算增量一併審；尚未合併不移植。 | `gh pr diff 7249`：`htmlDocument.ts` 新增 `locateSceneRoot`、`isTemplateEntry` 改用它          | `packages/core/src/compiler/htmlDocument.ts:19`（仍以開頭 `<template` 判斷）    |
| [#7250](https://github.com/heygen-com/hyperframes/pull/7250)              | 已採用（`b108f8512` 那節）：SVG stroke dash 納入 motion signature paint channel。對應 `motion-signature.browser.chromium.test.ts` 已同步。                                                                                                                  | `644b166e7:packages/cli/src/commands/motion-signature.browser.js:179`                          | `packages/cli/src/commands/motion-signature.browser.js:175`                     |

#7244、#7245、#7246、#7247、#7248、#7250 的唯讀 `gh pr view` 均為 MERGED，合併 commit（`c1977fab3`、`b7d72c947`、`d40d0b251`、`0a6746e1d`、`0b3559824`、`644b166e7`）全在 baseline 以內，裁決與紅綠證據保留在原清冊節，本節只重新核對 fork 端檔案行號後引用，不重寫。PR 軸從 #7242 連續推進到 #7250，沒有越過 #7249 去釘後面的項目。

### 依賴、延後與對外邊界

#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#7295、#7302 與 #7246（#6940 limiter）、#7247（#6621）維持原延後條件；#7316 沒有搬入依賴 #7182 的 copy window，故不影響該延後。#7314 與 reverse-any-video 屬 HeyGen 帳戶流程，沿用不採邊界。

沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無。沒有 `scripts/package-size-budgets.json` 的增量（上游這五筆都沒有動它）。

採用產品的上游作者為 Miguel Ángel（#7310、#7316、#7317）；email 僅供 Co-authored-by，不寫入文件。

### 聚焦紅綠

#7310：`mediaCodecMap.test.ts` 在舊碼 4 failed／37 passed（mpeg4／mjpeg 的 representativeMime 與 prewarm 斷言），新碼 41 passed。#7316：`events.test.ts` 的 copy facts 測試與 `check.test.ts` 的「copy wait 逾時仍是 browserSkipped 並送出 copy facts」在舊碼各 1 failed，新碼綠。#7317：`htmlCompiler.test.ts` 在舊碼 7 failed（`%20` 名稱、前導 `/`、`%20` 資料夾 sibling asset、四種逃出專案的寫法），新碼 180 passed／0 failed。

### 靜態閘門與驗證

core／studio／scripts 三組 `node node_modules/typescript/bin/tsc --noEmit -p <...>` 均 exit 0；`oxfmt --check` 與 `oxlint` 對 11 個變更 TypeScript 檔 0 錯誤；`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0（`No issues in 12 changed files`，1 筆既有 finding 被 new-only gate 排除）。producer 與 studio-server 的 `tsc --noEmit -p tsconfig.json` exit 0；cli 同指令只剩既有三筆 `check.test.ts` 錯誤（TS18048 `deadline` 可能 undefined、兩筆 TS2554），乾淨 HEAD 同三筆，僅因本批在檔內新增行而行號平移。core runtime 沒有變更，`tsconfig.runtime.json` 檢查不適用。

套件完整比較（port 樹對乾淨 `4cf9a241d` 樹，逐名比對失敗清單，兩邊各跑一次）：

| 套件                    | port 樹                             | 乾淨 HEAD                           | 只在 port 樹失敗 |
| ----------------------- | ----------------------------------- | ----------------------------------- | ---------------- |
| studio-server（vitest） | 1494 passed／23 failed／61 skipped  | 1490 passed／23 failed              | 0                |
| producer bun lane 逐檔  | 916 passed／8 failed（55 檔，3 檔非零） | 909 passed／8 failed            | 0                |
| producer vitest lane    | 1166 passed／4 failed               | 1166 passed／4 failed               | 0                |
| CLI 完整（vitest）      | 6250 passed／31 failed／307 skipped | 6248 passed／31 failed／307 skipped | 0                |

port 樹多出的通過數正是新增測試（studio-server 4、producer bun 7、CLI 2）。既有環境失敗在乾淨 HEAD 一樣出現：studio-server 23；producer bun 8（`chunkAudio`、`projectHash` 的 symlink、`captureSegmentedStage` 零補位）；producer vitest 4（`noNetworkNode` 兩例、`renderDirOwner`、`segmentManifest`）；CLI 31（`offload.undecodableTrack`、`clean`／`transcribe`／`describeProject`／`optionalPackages` 的 symlink 與 inode 0、`lambda/videoImage`、`warmCheck.process` 的 Chrome 啟動）。聚焦跑（telemetry、`check.test.ts`、`utils`）另出現 `checkDeadline.process` 兩例與 `staticProjectServer.charset.browser` 的 Chrome 30 秒啟動逾時，這三個檔在乾淨 HEAD 同樣 5 例失敗。這批沒有重建 dist，也沒有跑 `tools/test_product.ps1 -Full`。

### 剩餘快照（水位 `4cf26b5b4`）

2026-11-06、fork HEAD `4cf9a241d`（工作樹未提交）以寫入後的 `tools/upstream_baseline.json` 重跑 `python tools/check_upstream_updates.py --strict` 仍 exit 1：上游 tip 已前進到 `3e3ba8d0d`，commit 軸尚有 2 個，下一個是 `a874a6324`（#7306，motion blur 報告計數）與 `3e3ba8d0d`（#7318，interrupting set 在 render 的 worker 數不變）；PR #7250 以上 61 筆待審，下一個是 #7251；issue #7223 以上 11 筆；monitored 97 筆（由 96 新增 #7249 open），#6695 的 open head 差異維持原釘選。PR #7251 以後有數筆（#7251、#7252、#7262、#7265 等）已隨 commit 軸有裁決，但 PR 水位依連續規則逐筆核對後才推進，不跳號。這是水位 `4cf26b5b4` 時點的歷史快照，現行剩餘數字見本檔最新節。

### 維護 gate 收尾

2026-11-06、fork HEAD `4cf9a241d`（工作樹未提交）的 `pwsh -NoProfile -File tools/dev_check.ps1` exit 0，39 passed／0 failed，結尾 `WINDOWS DEV CHECK GREEN`，12 份維護文件、0 個斷鏈；`docs/UPSTREAM.md`、`docs/DECISIONS.md`、`ROADMAP.md` 與 baseline 已同步（commit 水位 `4cf26b5b49e6c4f2b42fb28738a1fb576e7494de`、PR #7250、issue #7223、monitored 97）。

## 2026-11-07：接續至 `3e3ba8d0d`，審查最後 2 個 commit 與 8 筆 PR

以 fork `21158b212` 為起點。起始 `git fetch upstream main` 後 `python tools/check_upstream_updates.py --strict` exit 1：baseline `4cf26b5b4` 之後上游有 2 個 commit（`a874a6324`、`3e3ba8d0d`，上游 tip 即 `3e3ba8d0d`），PR #7250 以上 63 筆。本節審完這 2 個 commit，commit 軸到達上游 tip；PR 軸依順序只審 #7251–#7258 八筆。兩筆 commit 的唯讀 `gh pr view` 與補丁都逐檔讀取，每個 commit 以 `git show --stat` 列出上游動到的全部檔案並逐檔判定。

### commit 軸

| Commit／PR                                                                | 裁決與理由                                                                                                                                                                                                                                                                                                                                                                                               | 上游證據                                                                   | fork 證據                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `a874a6324`／[#7306](https://github.com/heygen-com/hyperframes/pull/7306) | 部分採用並適配：blur 掃描後回報「composition 持有什麼」的計數（只有數量，沒有 id、class、文字或 URL）；engine 把非零計數放進 `[motion-blur]` 行並交給 perf summary，producer 聚合（第一份報告為準、失敗畫格加總），CLI 在 `render_complete` 加 `motion_blur_*` 屬性，CLI 與 Studio render 兩處都送。沿用既有 telemetry opt-out，不擴大遙測啟用政策（#7176 仍等維護者決定）。不採：`readEvents`（見下）。 | `a874a6324:packages/core/src/runtime/captureMotionBlur/fingerprint.ts:117` | `packages/core/src/runtime/captureMotionBlur/fingerprint.ts:117` |
| `3e3ba8d0d`／[#7318](https://github.com/heygen-com/hyperframes/pull/7318) | 採用，連同已合併的先決 `aafbd96b7`／#6851：below 分支的 render landing 也 settle 已結束的 overlap，set 打斷 tween 後任何 worker 數都停在 set 的值。#7318 的測試在無 structure 下呼叫 `rerenderGsapTimelineAt`，需要 #6851 的 `ownStructureOf`。                                                                                                                                                          | `3e3ba8d0d:packages/core/src/runtime/adapters/gsap.ts:64`                  | `packages/core/src/runtime/adapters/gsap.ts:64`                  |

#### #7306 的適配

本線的 motion blur 是上游 `4cf26b5b4` 的子集，沒有 #7191 的 `scanMovers`（silent／loud 兩段掃描）、#7295／#7080 的 crop 管線。逐項處理：

- `fingerprint.ts` 需要 `CONTENT_NODE_LIMIT`、`holdsFixedChild`、`within`、`pseudoBox`。本線 `filterTier.ts` 原有私有的前兩者，改移到 `frames.ts` 匯出並由兩個 tier 共用；`within`、`pseudoBox` 是 #7295 的純量測 helper，這裡只給 fingerprint 當讀取用 consumer，沒有搬入 #7295 的 `grownBox`／`contentBox`／crop 成長，所以 #7295 與 #7080 的延後條件不變。
- 上游 `onFast` 掛在 `scanMovers`，本線沒有該函式，改把 `onFast` 直接加在 `discoverMovers` 的每步迴圈（`discover.ts:234`），兩個 tier 的 `discover()` 各傳 `coverageSampler(root).sample`。上游「scan 只取樣一次」的 `scanMovers` 測試不適用，已省略；`onFast` 每步被呼叫的測試保留。
- `readEvents` 欄位保留在 `Report`／`PageMotionBlurSummary` 以維持與上游同形，但本線沒有 #7191 的 silent／loud 比對，恆為 `false`（`tier.ts` 註記）；CLI 不送這個欄位，engine 只在為 true 時才印，所以不會產生誤導資料。#7191 到達時再接上。
- `index.test.ts` 加 `Range.prototype.getBoundingClientRect` stub：上游該檔早有（#7080 鏈），本線沒有，而 fingerprint 掃描會用 `createRange()` 量文字；缺它時 76 個既有案例因 jsdom 沒有 Range 排版而失敗，不是行為回歸。
- `scripts/package-size-budgets.json`：inspector unpacked `3645432 → 3684092`，與上游同 commit 的增量逐 byte 一致（上游說明 fingerprint 程式被打包進 inspector）；此預算只由 publish workflow 檢查。core／CLI 預算沒有增量，不移用。

#### 上游動到的檔案逐檔判定

| Commit      | 檔案                                                                                                                                                                        | 判定                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `a874a6324` | `packages/core/src/motionBlurFingerprint.ts`、`core/src/index.ts`、`captureMotionBlur/fingerprint.ts`、`fingerprint.test.ts`、`tier.ts`                                     | 全部採用（新檔逐 byte 同上游）。                                                                                             |
| `a874a6324` | `captureMotionBlur/discover.ts`、`discover.test.ts`、`filterTier.ts`、`frames.ts`、`index.ts`、`index.test.ts`                                                              | 手工適配如上：`onFast` 掛 `discoverMovers`、helper 移到 `frames.ts`、省略 `scanMovers` 測試、`index.test.ts` 加 Range stub。 |
| `a874a6324` | `packages/engine/src/index.ts`、`services/frameCapture.ts`、`services/pageMotionBlur.ts`、`pageMotionBlur.test.ts`、`types.ts`                                              | 全部採用（`types.ts` 的 hunk 因本線 import 較少改為手動套用，內容同上游）。                                                  |
| `a874a6324` | `packages/producer/src/services/render/perfSummary.ts`、`perfSummary-motionBlur.test.ts`、`renderOrchestrator.ts`                                                           | 全部採用。                                                                                                                   |
| `a874a6324` | `packages/cli/src/commands/render.ts`、`server/studioRenderTelemetry.ts`、`telemetry/events.ts`、`renderMotionBlur.ts`、`renderMotionBlur.test.ts`、`docs/packages/cli.mdx` | 全部採用；`cli.mdx` 的遙測揭露句因本線已有 `check` stop code 句而手動合併。                                                  |
| `a874a6324` | `scripts/package-size-budgets.json`                                                                                                                                         | 採用 inspector unpacked 增量（見上）。                                                                                       |
| `3e3ba8d0d` | `packages/core/src/runtime/adapters/gsap.ts`、`gsap.order.test.ts`                                                                                                          | 兩檔皆採用；`gsap.ts` 需先決 #6851 的同檔改動（下）。                                                                        |
| `aafbd96b7` | `packages/core/src/runtime/adapters/gsap.ts`、`gsap.steps.test.ts`                                                                                                          | 先決，兩檔皆採用；補丁原樣套用，2026-11-02 清冊當時「依賴上游其他變更未驗證」的疑慮，本批以 #7318 測試實證其獨立。           |

兩個 commit 的上游補丁都沒有動 `*.browser.test.ts` 或 `*.chromium.test.ts`；fork 的 `captureMotionBlur.pixels.browser.test.ts` 不讀 report 的 fingerprint／readEvents，也不經過 `[motion-blur]` 行，不需同步，因此沒有重蹈上一批漏改 engine 瀏覽器測試的覆轍。

### PR 軸

起點 #7251。八筆的唯讀 `gh pr view --repo heygen-com/hyperframes --json state,mergeCommit,headRefOid` 結果如下；merged 的六筆合併 commit 全在 baseline `4cf26b5b4` 以內（`git merge-base --is-ancestor` 為真），裁決承接各自原清冊節，這裡只重新核對 fork 端行號，並用上游合併 commit 的 diff 對 fork 做反向套用檢查（`git apply -R --check`）。

| PR                                                           | 裁決與理由                                                                                                                                                                                                                                                                                                                                                              | 上游證據                                                                                          | fork 證據                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [#7251](https://github.com/heygen-com/hyperframes/pull/7251) | 已採用（`b108f8512` 那節）：outermost timed SVG scene 各有 id scope。fork 的 `snapshot.sceneSvgIds.browser.test.ts` 比上游多一段失敗診斷 `catch`，其餘同上游，所以反向檢查在該檔不全等，屬刻意的超集。                                                                                                                                                                  | MERGED `b108f8512`；`b108f8512:packages/core/src/compiler/svgIdNamespacing.ts:421`                | `packages/core/src/compiler/svgIdNamespacing.ts:414`                                                         |
| [#7252](https://github.com/heygen-com/hyperframes/pull/7252) | 已採用（`b108f8512` 那節）：comma 清單每個 selector 都算 hidden。反向檢查兩檔皆可乾淨反套用。                                                                                                                                                                                                                                                                           | MERGED `a664f99ec`；`a664f99ec:packages/lint/src/rules/gsap.ts:1021`                              | `packages/lint/src/rules/gsap.ts:993`                                                                        |
| [#7253](https://github.com/heygen-com/hyperframes/pull/7253) | monitored（open，釘 head `a954196b51cc7603c7dd9bd16a0b80eaff47af03`，外部貢獻者）：browser 下載失敗訊息補 `hyperframes doctor` 指引。本線的 `wrapDownloadFailureWithBrowserPathHint` 只有單一分支且訊息已含該句，PR 改的是上游「已安裝／未找到 Chrome」兩分支結構的第二分支，本線沒有，所以目前無可移植內容。重訪條件：合併後若上游兩分支結構被本線採入再比對最終字串。 | OPEN；`gh pr diff 7253`：`packages/cli/src/browser/manager.ts:721` 一帶 hunk                      | `packages/cli/src/browser/manager.ts:721`（單一分支，`:732` 已有 doctor 句）                                 |
| [#7254](https://github.com/heygen-com/hyperframes/pull/7254) | 已採用並適配（`b108f8512` 之前的節，見 `2f2195515` 列）：reference 正規化停在 +12 dB／-1.5 dBTP 而不拒絕。反向檢查 `normalize-audio.ts`、`command.test.ts`、`loudness.ts` 各有 hunk 不全等，原因是本線保留「想提高音量時不反向降低」政策的 `fittedGain` 與 `heldAtLimit` 寫法，不是缺漏。                                                                               | MERGED `2f2195515`；`2f2195515:packages/studio-server/src/helpers/loudness.ts:386`                | `packages/studio-server/src/helpers/loudness.ts:385`、`:549`                                                 |
| [#7255](https://github.com/heygen-com/hyperframes/pull/7255) | 已採用並適配：segmented 與 sequential capture 寫 encoder 前也驗 drawElement 樣本。保留既有 stall clock，不導入 render retry。                                                                                                                                                                                                                                           | MERGED `8df4f21c2`；`8df4f21c2:.../captureSegmentedStage.ts:222`、`captureStreamingStage.ts:1163` | `packages/producer/src/services/render/stages/captureSegmentedStage.ts:220`、`captureStreamingStage.ts:1116` |
| [#7256](https://github.com/heygen-com/hyperframes/pull/7256) | 已採用：script-load origin／code 移到自由文字前。反向檢查兩檔皆可乾淨反套用。                                                                                                                                                                                                                                                                                           | MERGED `7290ee68c`；`7290ee68c:packages/engine/src/services/frameCapture.ts:2562`                 | `packages/engine/src/services/frameCapture.ts:2522`                                                          |
| [#7257](https://github.com/heygen-com/hyperframes/pull/7257) | monitored（open，釘 head `ebcddd435e53fee17f25d16697a2f48528d3115c`）：macOS 上沒裝 developer tools 時，git／xcrun／cc 檢查不跳安裝提示。Windows 不受影響（只動 `/usr/bin/git`、`xcrun`、`/usr/bin/cc` 的 mac stub 判斷）。重訪條件：合併後視本線 macOS 支援再決定是否採 `appleStubs.ts`。                                                                              | OPEN；`gh pr diff 7257`：新增 `packages/cli/src/utils/appleStubs.ts`、`apple.ts` 加 guard         | `packages/cli/src/audio/analysis/providers/apple.ts:74`（無 guard）；`utils/appleStubs.ts` 不存在            |
| [#7258](https://github.com/heygen-com/hyperframes/pull/7258) | 已採用：SVG gradient 文字以 gradient stops 判斷對比，不當黑色。四檔（含 CI-only 的 `contrast-svg-gradient.browser.test.ts`）fork 與上游合併 commit 逐 byte 相同。                                                                                                                                                                                                       | MERGED `478ef2f26`；`478ef2f26:packages/cli/src/commands/contrast-audit.browser.js:192`           | `packages/cli/src/commands/contrast-audit.browser.js:192`                                                    |

PR 水位推進到 #7258，連續且每筆有證據。#7259 為 issue 軸項目，不在此軸。monitored 由 97 增為 99 筆（新增 #7253、#7257 兩筆 open）；#6695 的 open head 差異維持原釘選。

### 依賴、延後與對外邊界

#7191（`scanMovers`、silent／loud 讀取事件偵測）、#7295／#7080（crop 與 SVG 管線）、#6967／#7302 differential harness、#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#7246（#6940 limiter）、#7247（#6621）維持原延後條件。#7306 只用到 #7295 的量測 helper，沒有把 #7295 一併採入。

沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無。預算增量：只有 inspector unpacked 一筆（上游同 commit）。

採用產品的上游作者為 Vance Ingalls（#7306）與 Miguel Ángel（#7318、#6851）；email 僅供 Co-authored-by，不寫入文件。

### 聚焦紅綠

舊碼為乾淨 HEAD 樹（`git archive HEAD`，依賴以 junction 共用、core／engine／producer／CLI dist 在該樹重建），只把新測試檔複製進去，命令為各套件 cwd 的 `bun x vitest run <files>`。

| 範圍                                                            | 舊碼 pass／fail | 移植   | 失敗原因（舊碼）                                                                                                               |
| --------------------------------------------------------------- | --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| core `index.test.ts`＋`discover.test.ts`（#7306）               | 147／4          | 151／0 | 無 `fingerprint`／`readEvents` 欄位、`onFast` 不存在                                                                           |
| engine `pageMotionBlur.test.ts`（#7306）                        | 16／4           | 20／0  | `[motion-blur]` 行無計數、無 recorder、session 不寫入 summary                                                                  |
| producer `perfSummary-motionBlur.test.ts`（#7306）              | 1／3            | 4／0   | `aggregateMotionBlur` 不存在，perf summary 無 `motionBlur`                                                                     |
| core `gsap.order.test.ts`＋`gsap.steps.test.ts`（#7318＋#6851） | 85／4           | 89／0  | 無 `ownStructureOf`：#7318 重播測試與 #6851 三個 first-frame 測試失敗；只採 #6851 時仍有 1 個 #7318 測試失敗，證明兩者缺一不可 |

`fingerprint.test.ts`（新檔）與 CLI `renderMotionBlur.test.ts` 在舊碼因模組不存在而無法載入，屬編譯層紅燈，不當行為重現；它們的行為由上列四組與 CLI telemetry 聚焦 18 files／329 passed 涵蓋。producer `test:classification` 通過（180 檔已分類）。

### 靜態閘門與驗證

core `tsc --noEmit -p tsconfig.runtime.json` exit 0（在 packages/core）；core／studio／scripts 三組 lefthook `tsc --noEmit` 均 exit 0；engine、producer `tsc --noEmit -p tsconfig.json` exit 0；CLI 同指令只剩既有三筆 `check.test.ts` 錯誤（TS18048、兩筆 TS2554），本批未動該檔。`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0（29 changed files，3 筆既有 finding 被 new-only gate 排除）。28 個變更 TypeScript／JSON 檔 `oxfmt --check` 與 `oxlint` 皆 0 錯誤。

套件完整比較（移植樹對乾淨 `21158b212` 樹，逐名比對失敗清單，兩邊各跑一次）：

| 套件                            | 移植 pass／fail／skip           | 乾淨 HEAD pass／fail／skip | 只在移植樹失敗 |
| ------------------------------- | ------------------------------- | -------------------------- | -------------- |
| core（vitest 全套）             | 5655／0／11                     | 不需比較（移植樹 0 失敗）  | 0              |
| engine（vitest 全套）           | 2627／0／53（1 個 suite error） | 2622／0／53（同 1 個）     | 0              |
| producer bun lane 逐檔（55 檔） | 916／8（3 檔非零）              | 916／8                     | 0              |
| producer vitest lane            | 1172／2（含 suite error）       | 1168／2                    | 0              |
| CLI（vitest 全套）              | 6254／31／307                   | 6242／37／309              | 0              |

既有環境失敗兩邊一致：engine 的 `audioMixer.undecodableTrack` suite；producer bun 的 `chunkAudio`、`projectHash` symlink、`captureSegmentedStage` 零補位，vitest 的兩例；CLI 31 例（symlink／inode、`checkDeadline.process` 與 browser 的 Chrome 啟動逾時等）。乾淨樹多出的 7 個失敗（`colorGradingShaderStages.browser`、`snapshot.lateImages.browser` 四例、`checkDeadline.process` 兩例）是 Chrome 啟動逾時，移植樹同檔通過，不宣稱由本批修正。移植樹多出的通過數為新增測試。沒有執行 `tools/test_product.ps1 -Full`，封裝大小與 CLI 既有失敗未消除，不宣稱完整產品驗收綠燈。

### 剩餘快照（水位 `3e3ba8d0d`）

2026-11-07、fork HEAD `21158b212`（工作樹未提交）以寫入後的 `tools/upstream_baseline.json` 重跑 `python tools/check_upstream_updates.py --strict` 仍 exit 1：commit 水位 `3e3ba8d0d`，上游 tip 已再前進到 `18fc75dcd`，commit 軸尚有 2 個，下一個是 `318724f5f`（#7284，Studio Storyboard 分頁）與 `18fc75dcd`（#7324，engine drawElement 無 GPU Linux 後備）；PR #7258 以上 55 筆待審；issue #7223 以上 11 筆；monitored 99 筆，其中 3 筆有移動且尚未讀補丁：#6695（原釘 `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`，查詢 `3b2321c`）、#6816（原釘 `870f4d952a848d781b11a41ebdb0a7648e20ffb2`，查詢 `9732a8b`）、#7150（原釘 `0e2396e4bbb9353d4bccb830f63b8280bfcc7429` open，現 closed）；這三筆不藉重釘消除。現行剩餘數字只在此維護。

### 維護 gate 收尾

2026-11-07、fork HEAD `21158b212`（工作樹未提交）的 `pwsh -NoProfile -File tools/dev_check.ps1` 結果：exit 0，39 passed／0 failed，結尾 `WINDOWS DEV CHECK GREEN`，12 份維護文件、0 個斷鏈；`docs/UPSTREAM.md`、`docs/DECISIONS.md`、`ROADMAP.md` 與 baseline 已同步（commit 水位 `3e3ba8d0d076f1487b4e0aa9261ed148c26936eb`、PR #7258、issue #7223、monitored 99）。

## 2026-11-07：接續至 `18fc75dcd`，審查最後 2 個 commit 與 6 筆 PR

以 fork `48f5654de` 為起點。起始 `python tools/check_upstream_updates.py --strict` exit 1：baseline `3e3ba8d0d` 之後上游有 2 個 commit（`318724f5f`、`18fc75dcd`，上游 tip 即 `18fc75dcd`），PR #7258 以上 55 筆、issue #7223 以上 11 筆，99 筆釘選中 3 筆有移動（#6695、#6816、#7150）。本節審完這 2 個 commit，commit 軸再次到達上游 tip；PR 軸從 #7260 連續審到 #7265（#7259 是 issue 軸項目）；3 筆移動的釘選逐一重讀。每個 commit 以 `git show --stat` 列出上游動到的全部檔案並逐檔判定；補丁先用 `git apply --check` 預演（不用 `--reject`），整體不適用的檔案才手工移植。

### commit 軸

| Commit／PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `318724f5f`／[#7284](https://github.com/heygen-com/hyperframes/pull/7284) | 採用並適配：Studio 預覽面板在專案有 `storyboard.html`（根目錄或 `boards/`）時多一個 Storyboard 分頁，以 `DOMParser` 讀出 frame（惰性文件，頁面腳本不執行），board 以 `sandbox=""` 的 iframe 呈現；檔案變更經新的 `fileChangeFanout` 廣播給分頁重讀；Approve 只複製一句話給使用者貼給自己的 agent，不呼叫任何服務。CLI 的 `hyperframes open` 與 `/desktop` 路由新增 `doc: "storyboard"`，在交出資料夾之前寫入 `desktop-cta.json`，app 沒接手就還原舊記錄。不採：`skills/style-sampling/references/remix.md`（本線沒有 style-sampling 技能，見 #7263）。 | `318724f5f:packages/studio/src/components/storyboard/PreviewStage.tsx:15`、`packages/cli/src/utils/desktopApp.ts:229` | `packages/studio/src/components/storyboard/PreviewStage.tsx:15`、`packages/cli/src/utils/desktopApp.ts:219` |
| `18fc75dcd`／[#7324](https://github.com/heygen-com/hyperframes/pull/7324) | 採用並適配：drawElement 的初始化閘門改為純函式 `drawElementGate`，在 `swiftshader` 之外新增 `webgl_unavailable`（完全沒有 WebGL 的主機）與 `beginframe_no_self_verify`（BeginFrame 啟動的瀏覽器沒有 self-verify 真值頁，不再掛住）；`detectGpuBackend` 的軟體 GL 判斷與 `isSoftwareWebGlRenderer` 共用 `SOFTWARE_WEBGL_RENDERER_TOKENS`，`getContext` 丟例外視為無 WebGL。`HF_FORCE_DRAWELEMENT` 只繞過 BeginFrame 閘門。Windows 與 macOS 有 GPU 的主機行為不變。 | `18fc75dcd:packages/engine/src/services/drawElementService.ts:88` | `packages/engine/src/services/drawElementService.ts:88`、`packages/engine/src/services/frameCapture.ts:1139` |

#### #7284 的適配

本線的 `desktopApp.ts` 沒有上游 #6897 的「從設定讀 Desktop builds」結構（2026-11-02 清冊判定不採，依賴 HeyGen 帳戶設定），所以上游把 `opened` 與平台分派搬進 `dispatch()` 的 diff 不能整段套。改動限於相同行為：`openInDesktop` 新增 `doc` 參數，保留本線的 `DESKTOP_BUNDLE_IDS`／`opened(canary)`，把原有 darwin／其他平台分派原樣收進 `dispatch()`，前後加上游的 `leaveIntent`（先寫 `{ cta, at, doc }`；`cta` 與 `doc` 都沒有而舊記錄有 `doc` 時清掉舊 `doc`；app 沒接手時還原）。`EditorShell.tsx` 的 hunk 因本線沒有 #6966 的 `matchesKey` import 而 context 不合，只手工加 `PreviewStage` import 與包裹。`skills-manifest.json` 不套上游雜湊（本線 hyperframes 技能其他檔案內容不同），改用 `bun packages/cli/scripts/gen-skills-manifest.ts` 重生，只有 hyperframes 一列變（`32f78e32adf32c02 → 5d86420d991b3a95`，來源是 `storyboard.md` 的一行說明）。`scripts/package-size-budgets.json`：CLI packed `7902966 → 7982002`，與上游同 commit 的增量（+79036）一致；此預算只由 publish workflow 檢查，本機未打包驗證。

#### 上游動到的檔案逐檔判定

| Commit | 檔案 | 判定 |
| --- | --- | --- |
| `318724f5f` | `packages/studio/src/components/storyboard/` 的 `PreviewStage.tsx`、`StoryboardBoardView.tsx`、`ApproveBoardButton.tsx`、`useStoryboardBoard.ts`、`storyboardBoard.ts` 與四個測試檔（`PreviewStage.dom.test.tsx`、`PreviewStage.player.dom.test.tsx`、`ApproveBoardButton.dom.test.tsx`、`storyboardBoard.test.ts`）；`hooks/fileChangeFanout.ts`、`fileChangeFanout.test.ts` | 全部新檔，採用（經 `oxfmt`）。 |
| `318724f5f` | `useExternalFileChangeCoordinator.ts`、`DesktopGuideCard.tsx`、`OpenInDesktopButton.tsx`、`OpenInDesktopButton.dom.test.tsx` | 補丁原樣套用。 |
| `318724f5f` | `packages/studio/src/components/EditorShell.tsx` | 手工適配（見上）。 |
| `318724f5f` | `packages/cli/src/server/desktopRoutes.ts`、`desktopRoutes.test.ts`、`utils/projectRecords.ts`、`utils/desktopApp.test.ts` | 原樣套用。 |
| `318724f5f` | `packages/cli/src/utils/desktopApp.ts` | 手工適配（見上）。 |
| `318724f5f` | `skills/hyperframes/references/storyboard.md`、`skills-manifest.json`、`scripts/package-size-budgets.json` | 前者原樣套用；後兩者見上，重生／取增量。 |
| `318724f5f` | `skills/style-sampling/references/remix.md` | 不適用（檔案不存在）。 |
| `18fc75dcd` | `packages/engine/src/services/browserManager.ts`、`drawElementService.ts`、`drawElementService.test.ts`、`types.ts`；`packages/producer/src/services/render/observability.ts`、`renderOrchestrator.ts`、`windowedFrames.integration.test.ts` | 原樣套用。 |
| `18fc75dcd` | `packages/engine/src/services/frameCapture.ts` | 手工適配：本線 import 區塊沒有 `forcePreservedDrawingBuffer`，hunk 不合；加 `drawElementGate`／`DrawElementGateReason`、移除 `resolveDrawElementCaptureMode` import，其餘同上游。 |

兩個 commit 的上游補丁都沒有動 `*.browser.test.ts` 或 `*.chromium.test.ts`。fork 有但沒跟著改的相關檔：`drawElementService.integration.test.ts` 整檔是 `describe.skip`，只有註解提到 `resolveDrawElementCaptureMode`（該函式仍匯出且有單元測試），不需同步；`frameCapture-freshFallback.test.ts` 的 `vi.mock` 用 `importOriginal` 展開，真實的 `drawElementGate` 保留；`windowedFrames.integration.test.ts` 屬 producer integration lane（需要 Chrome 與 ffmpeg，列在 `packages/producer/scripts/integration-tests.json:39`），上游補丁原樣套用，其依賴的 `HF_SEGMENT_BROWSER_RECYCLE`（`segmentRecycle.ts`）、`perfSummary` 的 `verifyArmed`／`selfVerifyFallback`、`Segmented capture complete` 紀錄的 `browserRecycles` 欄位在本線都已存在。沒有 CI-only 的瀏覽器測試被遺漏。

### PR 軸

起點 #7260（#7259 為 issue，歸 issue 軸）。六筆的唯讀 `gh pr view --repo heygen-com/hyperframes --json state,mergeCommit,headRefOid` 都是 MERGED，合併 commit 全在 baseline 以內（`git merge-base --is-ancestor` 為真），裁決承接各自原清冊節；這裡重新核對 fork 端行號，並用上游合併 commit 的 diff 對 fork 做反向套用檢查（`git apply -R --check`）。

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7260](https://github.com/heygen-com/hyperframes/pull/7260) | 不適用（整版 release）：版本號、plugin manifest、changelog、`releases/v0.9.17.md`；不發佈 npm、不改版本，承接 2026-11-06 `32eb4c358` 節。 | MERGED `32eb4c358`；22 個檔案皆為版本／發行說明／預算 | `packages/cli/package.json` 版本不變 |
| [#7261](https://github.com/heygen-com/hyperframes/pull/7261) | 不適用：`commands/media-use/{voices,generate}.ts`、`heygen/generate.ts` 在本線不存在，也沒有 style-sampling 技能。 | MERGED `fc0b53361`；改 `packages/cli/src/commands/media-use/voices.ts` | `packages/cli/src/commands/media-use/`、`packages/cli/src/heygen/` 目錄不存在；`skills/` 只有 7 個技能 |
| [#7262](https://github.com/heygen-com/hyperframes/pull/7262) | 部分採用（原節）：cloud render 在 non-TTY 每次狀態改變或持續一分鐘時輸出進度，JSON 保持靜默。反向檢查 `render.ts` 可乾淨反套用；`render.test.ts` 不全等，是本線測試檔 context 不同。style-sampling remix／manifest 不適用。 | MERGED `41b7aeeaf`；`41b7aeeaf:packages/cli/src/commands/cloud/render.ts:1023`（`STILL_RUNNING_EVERY_MS = 60_000`） | `packages/cli/src/commands/cloud/render.ts:997` |
| [#7263](https://github.com/heygen-com/hyperframes/pull/7263) | 不適用（原節）：本線沒有 templates pull 的五個 plan-gated style-sampling packs，也沒有對應 pinned digest；不新建沒有入口的指紋清單。 | MERGED `9e2510bda`；只改 `packages/cli/src/commands/templates.ts` | `packages/cli/src/commands/templates.ts` 無 style-sampling pack 清單 |
| [#7264](https://github.com/heygen-com/hyperframes/pull/7264) | 已採用（原節）：CLI no-draw seek 的 draw gate 同時阻止 color-grading source texture 上傳。反向檢查 `colorGrading.ts` 可乾淨反套用；`colorGrading.chromium.test.ts` 不全等，是原節刻意保留 Chromium 測試並另補 mock WebGL 性質測試，不是缺漏。 | MERGED `256b84a41`；`256b84a41:packages/core/src/runtime/colorGrading.ts:3350` | `packages/core/src/runtime/colorGrading.ts:3343,3355` |
| [#7265](https://github.com/heygen-com/hyperframes/pull/7265) | 已採用並適配（原節）：video 在 cut 前最多一秒隱藏播放並追上。反向檢查四個測試檔可乾淨反套用；`media.ts`、`mediaSteer.ts` 不全等，是原節記載的最小適配（本線以固定 `VIDEO_PREROLL_SECONDS` 取代 learned start-latency，保留本線 out-point／audio 契約），不是缺漏。 | MERGED `3e86def58`；`3e86def58:packages/core/src/runtime/mediaSteer.ts` | `packages/core/src/runtime/media.ts:310`（`VIDEO_PREROLL_SECONDS = 1`）、`:388`（`startsEarly`） |

PR 水位推進到 #7265，連續且每筆有證據。

### 移動的釘選

| 釘選 | 原釘 | 現況 | 裁決 |
| --- | --- | --- | --- |
| #6695 | `8aa9967f3b8bb8c776f7555d065d8ebd939ebe66`／open | `3b2321c0bcca0edcc40fce84dbaa11af9d8bb6b1`／open | 讀完整補丁：3 檔（`bun.lock`、`packages/cli/package.json`、`packages/engine/package.json`）只有各 workspace 版號 `0.9.10 → 0.9.19` 與 undici `7.25.0 → 7.30.1` 的重排，本體不變。維持延後：本線兩份 package.json 沒有直接 undici（`bun.lock:2146` 為 jsdom 的傳遞依賴 7.25.0），不能只套 manifest 就宣稱修了安全漏洞；PR 仍 open，合併後再評估是否把 undici 提升為直接依賴。重釘新 head。 |
| #6816 | `870f4d952a848d781b11a41ebdb0a7648e20ffb2`／open | `9732a8b62dd414f369432f3688defc96829d6cfd`／open | 九個檔案不變，新增的 commit 都是 `Merge remote-tracking branch 'upstream/main'`；本線有這些 media-use 檔案（`packages/cli/src/media-use/lib/local-models.mjs`、`tts-local-provider.mjs`、`skills/media-use/audio/scripts/audio.mjs`），但 PR 尚未合併，延後不變，合併後以 commit 進入審查。重釘新 head。 |
| #7150 | `0e2396e4bbb9353d4bccb830f63b8280bfcc7429`／open | 同 head／closed（2026-11-06，作者自行關閉） | 已解決：作者留言說明 #5746 的 `BuildReadyRejection`／`recordBuildReadyRejection` 通道已做同一件事。#5746 合併 commit `071ec1fdd` 在 baseline 內且本線已採（`packages/core/src/runtime/init.ts:3943,3953` 的 `BuildReadyRejection`、`packages/core/src/runtime/diagnostics.ts:59` 的 `recordBuildReadyRejection`），所以 #7150 無可移植內容。重釘為 closed。 |

### 依賴、延後與對外邊界

#7191（`scanMovers`、silent／loud 讀取事件偵測）、#7295／#7080、#6967／#7302、#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#7246（#6940 limiter）、#7247（#6621）維持原延後條件；#6897（Desktop builds 設定）維持不採，#7284 的 Desktop 交接只用到 `doc` 欄位，沒有引入帳戶或設定讀取。#7246 的 limiter 前置沒有出現在這兩個 commit。

沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無。預算增量：CLI packed +79036（上游 #7284 同 commit）。

採用產品的上游作者為 WaterrrForever（#7284）與 Vance Ingalls（#7324）；email 僅供 Co-authored-by，不寫入文件。

### 聚焦紅綠

舊碼為乾淨 HEAD 樹（`git archive HEAD`，依賴以 junction 共用，gitignored 的 `packages/core/src/generated` 複製進去），只把新測試檔複製進去，各套件 cwd 的 `bun x vitest run <files>`。

| 範圍 | 舊碼 pass／fail | 移植 | 失敗原因（舊碼） |
| --- | --- | --- | --- |
| engine `drawElementService.test.ts`（#7324） | 10／12 | 22／0 | 無 `drawElementGate`、無 `webglAvailable`；`getContext` 丟例外與軟體 GL token 不被辨識 |
| CLI `desktopApp.test.ts`＋`desktopRoutes.test.ts`（#7284） | 37／6（1 skipped） | 43／0（1 skipped） | `doc: "storyboard"` 不寫入記錄、路由不轉送 `doc`、後來的標頭或一般開啟會重用舊 `doc` |
| studio `OpenInDesktopButton.dom.test.tsx`（#7284） | 11／12 | 23／0 | `placement` 不存在：storyboard 版卡片文字、`doc` 送出與 `storyboard-open-in-desktop` 測試 id |
| studio `storyboard/*` 四檔與 `fileChangeFanout.test.ts`（#7284） | 模組不存在，編譯層紅燈 | 與上列合計 6 files／45 tests passed | 新檔，不當行為重現 |
| producer `windowedFrames.integration.test.ts` 的 drawElement 案例（#7324，bun lane，`-t "captures with drawElement"`） | 舊測試無此案例 | 1 pass／0 fail（12 filtered） | 本機 Windows 有 GPU，案例真的走了 drawElement：`mode=drawelement`、`verifyArmed=8`、`selfVerifyFallback=false`、`recycles=1`、`onDemandWithFrames=8`、`left=[]` |

「puts the earlier record back when the app didn't take the folder」在舊碼也通過（舊碼只在成功後才寫入，沒有需要還原的狀態），它守的是新的先寫後還原流程不退步。

### 靜態閘門與驗證

core `tsc --noEmit -p tsconfig.runtime.json` exit 0（在 packages/core；本批沒有改 core）；core／studio／scripts 三組 lefthook `tsc --noEmit` 均 exit 0；engine、producer `tsc --noEmit -p tsconfig.json` exit 0；CLI 同指令只剩既有三筆 `check.test.ts` 錯誤（TS18048、兩筆 TS2554）。`node_modules/.bin/fallow audit --base origin/main --fail-on-issues` exit 0（32 changed files，5 筆既有 finding 被 new-only gate 排除）。變更的 TypeScript／JSON／Markdown 檔 `oxfmt --check` 皆通過。producer `test:classification` 通過（180 檔已分類）；producer `observability.test.ts`＋`perfSummary.test.ts` 27 passed。

套件完整比較（移植樹對乾淨 `48f5654de` 樹，逐名比對失敗清單，兩邊各跑一次）：

| 套件 | 移植 pass／fail／skip | 乾淨 HEAD pass／fail／skip | 只在移植樹失敗 |
| --- | --- | --- | --- |
| engine（vitest 全套） | 2624／13／53 | 2617／10／53 | 5（見下，隔離重跑 4 files／18 tests 全過） |
| studio（vitest 全套） | 7952／241／2（16 todo） | 7929／240／2（16 todo） | 2（見下，隔離重跑 11／11 全過） |
| CLI（vitest 全套） | 6255／35／307 | 6253／32／307 | 4（見下，隔離重跑 4 files／50 tests 全過） |
| producer | 聚焦：`observability`＋`perfSummary` 27 passed；drawElement 案例 1 pass | 不需比較 | 0 |

本批沒有重新跑完整的 producer bun lane 與 core 全套：producer 只改了兩處註解與一個 integration 測試，core 沒有改動。

逐名比對失敗清單後，只在移植樹失敗的 11 個名稱都是負載相關的逾時或啟動競態，各自隔離重跑皆通過，所以不當作回歸，也不宣稱由本批修正或造成：engine 的 `browserManager-vulkanEnv`、`browserManager-wslEnv` 與 `parallelCoordinator-peerAbort` 三例（隔離重跑 4 files／18 tests passed，同次也包含 `frameCapture-softwareWebGpu`）；studio 的 `Timeline.virtualization.test.tsx` 兩例（隔離重跑兩棵樹各 11／11 passed）；CLI 的 `audio/read/read.test.ts`、`cloud/offload.test.ts`、`registry/registryComponents.test.ts`、`utils/artifactCapture.test.ts`（隔離重跑 4 files／50 tests passed）。兩邊都失敗的既有環境失敗與前幾節一致：engine 的 `audioMixer.undecodableTrack` 與 Chrome 啟動競態、studio 的 localStorage／Dock／TimelineToolbar 一批（`--localstorage-file` 警告所屬環境）、CLI 的 symlink／inode 與 `checkDeadline.process` 的 Chrome 啟動逾時。乾淨樹多出的 `vite.browserVersion.test.ts` 同屬環境逾時。兩棵樹的 `parallelCoordinator-peerAbort` 失敗名稱互不相同，證明該檔隨負載飄動。沒有執行 `tools/test_product.ps1 -Full`，不宣稱完整產品驗收綠燈。

### 剩餘快照（水位 `18fc75dcd`）

2026-11-07、fork HEAD `48f5654de`（工作樹未提交）以寫入後的 `tools/upstream_baseline.json` 重跑 `python tools/check_upstream_updates.py --strict` 仍 exit 1，但只剩 PR 與 issue 軸：commit 軸 0 個（`No new upstream commits`，baseline 與上游 tip `18fc75dcd` 相同）；PR #7265 以上 50 筆待審（下一個是 #7266）；issue #7223 以上 11 筆；monitored 99 筆，沒有移動的釘選（#6695、#6816 重釘新 head，#7150 重釘 closed）。現行剩餘數字只在此維護。

### 維護 gate 收尾

2026-11-07、fork HEAD `48f5654de`（工作樹未提交）的 `pwsh -NoProfile -File tools/dev_check.ps1` 結果：exit 0，39 passed／0 failed，結尾 `WINDOWS DEV CHECK GREEN`，12 份維護文件、0 個斷鏈；`docs/UPSTREAM.md`、`docs/DECISIONS.md`、`ROADMAP.md` 與 baseline 已同步（commit 水位 `18fc75dcd7b453ab10d0834bc9e8d2265353121c`、PR #7265、issue #7223、monitored 99）。

## 2026-11-07：接續 PR 軸至 7288，審查 15 筆 PR

以 fork `6f7d25030` 為起點。起始 `python tools/check_upstream_updates.py --strict` exit 1：commit 軸已在上游 tip，`git fetch upstream main` 後 `No new upstream commits`（baseline 與 tip 同為 `18fc75dcd`），99 筆釘選全部「still at the head and state it was judged at」，沒有移動；PR #7265 以上 53 筆、issue #7223 以上 11 筆待審。本節只動 PR 軸：從 #7266 連續審到 #7288（共 15 筆，其間 #7272–#7279 是 issue 軸項目），沒有採用任何上游程式碼，所以沒有紅綠測試與套件雙樹比較。

### PR 軸

先用唯讀 `gh pr view --repo heygen-com/hyperframes --json state,mergeCommit,headRefOid` 取狀態：9 筆 MERGED 且合併 commit 全在 baseline 以內（`git merge-base --is-ancestor <合併 commit> 18fc75dcd` 為真），6 筆 OPEN。MERGED 的裁決承接各自原清冊節，這裡重新核對 fork 端行號，並用上游合併 commit 的補丁逐檔對 fork 做反向套用檢查（`git show <commit> --format= -- <檔案> | git apply -R --check`，不用 `--reject`）。反向檢查不全等的檔案都能對應到後續已採用的 commit 或原節記載的適配，逐檔說明在表中。

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7266](https://github.com/heygen-com/hyperframes/pull/7266) | monitored（open，釘 head `952fd2bb3c099f10c8df088a658a4ec7512afe32`，外部貢獻者，修 issue #7259）：`check` 的 geometry-only seek 把 `texImage2D`、`texSubImage2D`、`copyTexImage2D` 與兩個 compressed 變體也納入 draw gate，避免 macOS 硬體 GPU 上 `data-color-grading` 圖片每個 overlap sample 重傳紋理而吃滿 GPU 記憶體。本線 gate 清單只有 draw 類方法，缺陷存在；但 PR 未合併，review 尚未通過。重訪條件：合併後視為獨立小修正採用（補丁只加五個方法名與 `captureCompositionFrame.webglDraws.browser.test.ts` 的 upload 計數；該測試只在 CI 跑，要一併採）；macOS 專屬症狀本線 Windows 不重現，不阻塞。 | OPEN；`gh pr diff 7266`：`packages/cli/src/capture/captureCompositionFrame.ts:491` 一帶加五個方法；`...webglDraws.browser.test.ts:11` 加 upload 計數 | `packages/cli/src/capture/captureCompositionFrame.ts:486`（清單止於 `blitFramebuffer`）；`captureCompositionFrame.webglDraws.browser.test.ts` 存在、無 upload 計數 |
| [#7267](https://github.com/heygen-com/hyperframes/pull/7267) | 已採用（原節 2026-11-06 `b4cc674f7`）：gain 被 ceiling／true-peak 限制而不寫檔時，回報實際保持的 LUFS。兩個檔案反向套用皆乾淨。 | MERGED `4935d6736`；`4935d6736:packages/cli/src/commands/normalize-audio.ts:203`（`heldByLimit`） | `packages/cli/src/commands/normalize-audio.ts:190,198,203`、`:233`（`Stays at`／`Reaches`） |
| [#7268](https://github.com/heygen-com/hyperframes/pull/7268) | 已採用（原節）：render 等待的 lint 保持正常優先權，只有 `input.background` 才降低。`preview.ts`、`studioServer.ts` 反向乾淨；`renderSetupWorker.ts` 與 `renderSetupWorker.priority.test.ts` 不全等，是因為同一檔後來又採了 #7301（Chrome 安裝以 `PRIORITY_ABOVE_NORMAL` 執行，抽出共用的 `setOwnPriority`），不是缺漏。 | MERGED `72326a3ac`；`72326a3ac:packages/cli/src/renderSetupWorker.ts:40`（`if (input.background) lowerPriority()`） | `packages/cli/src/renderSetupWorker.ts:42`（`if (input.background) setOwnPriority(constants.priority.PRIORITY_LOW, "Lint runs")`）、`:24` |
| [#7269](https://github.com/heygen-com/hyperframes/pull/7269) | monitored（open，釘 head `7f3931eaf028d2aa69205652a8d040fa1715fdd9`）：`templates pull` 的暫存資料夾改放 `.hyperframes/template-pulls/`，避免 Windows 上 Desktop 開著專案時最後 rename 遇 EPERM。本線沒有 `commands/templates.ts`（付費樣式範本功能整組不採，見 #6842、#7084、#7116 的原判定），所以目前無可移植內容；PR 也還帶著 CI 探針 workflow 與測試（原文標明「removed before review」）。重訪條件：本線引入 `templates pull` 時，且該 PR 已合併、探針已移除，採用 staging 目錄改法。 | OPEN；`gh pr diff 7269`：`packages/cli/src/commands/templates.ts:175` 一帶 `removeAbandonedParts(stage, dest)`、`unpack(..., stage, ...)` | `git ls-tree HEAD` 無 `packages/cli/src/commands/templates.ts`；`pullTemplate` 全 `packages/cli/src` 零引用 |
| [#7270](https://github.com/heygen-com/hyperframes/pull/7270) | 不適用（整版 release v0.9.18）：版本號、plugin manifest、changelog、發行說明；不發佈 npm、不改版本，承接 2026-11-06 原節。 | MERGED `cbe5dcb2d`；21 個檔案皆為版本／發行說明 | 20 個 manifest 反向套用皆不全等（本線版本不同）；`releases/v0.9.18.md` 不存在；`packages/cli/package.json` 版本不變 |
| [#7271](https://github.com/heygen-com/hyperframes/pull/7271) | 已採用（原節 2026-11-06 `66cbabc39`）：掃描／eventful pose read 暫停 GSAP 離散 callback，finally 恢復。`gsap.mute.test.ts` 反向乾淨；`gsap.ts`、`discover.ts`、`filterTier.ts`、`index.ts`、`tier.ts`、`init.ts`、`index.test.ts` 不全等，是同一批檔案後來又採了 #7288、#7292、#7293、#7294 的修改與原節記載的適配（沿用本線 discovery 與 seek 復原），不是缺漏。engine 的三個 `captureMotionBlur.callbacks*.browser.test.ts`、兩個 `__fixtures__/motionBlur` 檔、producer `blurDifferential.integration.test.ts` 本線不存在，屬 #6967／#7302 成組延後的 harness（見依賴段），未被順手搬入。 | MERGED `cd7e93baa`；`cd7e93baa:packages/core/src/runtime/adapters/gsap.ts:505`（`muteDiscreteCallbacks`） | `packages/core/src/runtime/adapters/gsap.ts:466`（`muteDiscreteCallbacks`）、`:453`（`DISCRETE_CALLBACKS`）；`packages/core/src/runtime/captureMotionBlur/index.ts:253` |
| [#7280](https://github.com/heygen-com/hyperframes/pull/7280) | 不採用（原節）：上游 queue 的 stale 自動關閉政策與 Renovate label 配套，非產品修正；本 fork 使用 Dependabot。 | MERGED `5259fd112`；新增 `.github/workflows/stale.yml`、改 `.github/renovate.json`、`TRIAGE.md` | `.github/workflows/stale.yml` 不存在；`renovate.json`、`TRIAGE.md` 反向套用不全等（本線文件不同） |
| [#7281](https://github.com/heygen-com/hyperframes/pull/7281) | monitored（open，釘 head `aaf4a0217d8b4f523903fc0e1338f636135ed353`，外部貢獻者，修 issue #7277）：`hyperframes docs` 的終端 renderer 渲染 `**bold**`，不再印出標記。本線缺陷存在，但上游同時有 #7327、#7328 兩筆針對同一 issue 的 PR（在本批之外，輪到時一併判定），不在此先挑。重訪條件：其中一筆合併後以 commit 進入審查，採用最終合併的那一版（改動只在 `docs.ts` 的 inline formatter 與 `docs.test.ts`）。 | OPEN；`gh pr diff 7281`：`packages/cli/src/commands/docs.ts:67` 一帶 `formatInline` 取代 `formatInlineCode` | `packages/cli/src/commands/docs.ts:58`（`formatInlineCode` 只處理反引號）、`:86`、`:92` |
| [#7282](https://github.com/heygen-com/hyperframes/pull/7282) | monitored（open，釘 head `951cee8ca7279c0940df4436b431be99a0c68e9f`，外部貢獻者，修 issue #7279）：`scripts/lint-registry-items.mjs` 先安裝 manifest 宣告的 assets 再 lint，修 `yt-lower-third`、`texture-mask-text` 因素材缺失而誤報。本線腳本只掛載 `<name>.html`，缺陷存在；這是維護用腳本而非產品路徑，不阻塞。重訪條件：合併後採用（附 `scripts/lint-registry-items.test.mjs` 新測試檔）。 | OPEN；`gh pr diff 7282`：`scripts/lint-registry-items.mjs:17,74,96`；新增 `scripts/lint-registry-items.test.mjs` | `scripts/lint-registry-items.mjs:76`、`:98`（只複製 `item.html`）；`scripts/lint-registry-items.test.mjs` 不存在 |
| [#7283](https://github.com/heygen-com/hyperframes/pull/7283) | 已採用，連同 #7061（原節 2026-11-06 `b4cc674f7`）：每一次 render landing（包括 replay）都 settle 已結束的 overlap。`gsap.ts` 反向乾淨；`gsap.order.test.ts` 不全等，是同檔後來又加了 #7318 與 #6851 的測試。 | MERGED `6abc62a17`；`6abc62a17:packages/core/src/runtime/adapters/gsap.ts:263`（`settleOverlapsEndedBetween`） | `packages/core/src/runtime/adapters/gsap.ts:64`、`:235`、`:279` |
| [#7284](https://github.com/heygen-com/hyperframes/pull/7284) | 已採用並適配（原節 2026-11-07 `18fc75dcd` 的 commit 軸）：Studio Storyboard 分頁與 `hyperframes open` 的 `doc: "storyboard"` 交接。25 個檔案中 20 個反向套用乾淨；`desktopApp.ts`、`EditorShell.tsx` 是原節記載的手工適配，`skills-manifest.json`、`package-size-budgets.json` 是重生或取增量，`skills/style-sampling/references/remix.md` 不適用。 | MERGED `318724f5f`；`318724f5f:packages/studio/src/components/storyboard/PreviewStage.tsx:15`、`packages/cli/src/utils/desktopApp.ts:229` | `packages/studio/src/components/storyboard/PreviewStage.tsx:15`、`packages/cli/src/utils/desktopApp.ts:173,212,219` |
| [#7285](https://github.com/heygen-com/hyperframes/pull/7285) | monitored（open，釘 head `00b85568cf7b2e67655ca2ac7343e9a3aeb54b3b`，外部貢獻者，修 issue #7276）：lint 的 `non_deterministic_code` 規則加 `crypto.randomUUID()`。本線規則只有 `Math.random` 與 `crypto.getRandomValues`，缺陷存在。同一 issue 在上游另有 #7322、#7325 兩筆重複 PR（本批之外）。重訪條件：三筆其中一筆合併後以 commit 進入審查，採用最終合併的版本（改動只在 `packages/lint/src/rules/core.ts` 規則表與 `core.test.ts`）。 | OPEN；`gh pr diff 7285`：`packages/lint/src/rules/core.ts:964` 一帶加 pattern | `packages/lint/src/rules/core.ts:963`（`crypto.getRandomValues` 為最後一個 pattern，無 `randomUUID`） |
| [#7286](https://github.com/heygen-com/hyperframes/pull/7286) | monitored（open，釘 head `7f372305b8675cbe335ab7f4e155b6ef4444033d`，外部貢獻者，修 issue #7272）：composition lint 規則把 parser 的 `invalid-duration` 診斷當 error 回報。本線只轉出 `deprecated-layer`、`conflicting-end` 等診斷，`invalid-duration` 會靜默得到不同 duration；parser 端 `invalid-duration` 已存在，缺陷成立。同一議題上游另有 #7319、#7323（本批之外，後者含 `invalid-track-index`）。重訪條件：其中一筆合併後以 commit 進入審查，採用最終合併的版本（含 `docs/reference/lint-rules.mdx` 的規則說明）。 | OPEN；`gh pr diff 7286`：`packages/lint/src/rules/composition.ts:1102` 一帶新增診斷轉出；`docs/reference/lint-rules.mdx:102` | `packages/lint/src/rules/composition.ts:1067`、`:1081`（只處理 `deprecated-layer`、`conflicting-end`）；`packages/parsers/src/compositionContract.ts:41`（`invalid-duration` 型別） |
| [#7287](https://github.com/heygen-com/hyperframes/pull/7287) | 已採用（原節 2026-11-06 `b4cc674f7`）：缺少的本機字型不再中止 cloud render，加空 face 走 fallback 並點名，JSON 列 `swapped_fonts`。`fontPreflight.ts` 與兩個測試檔反向乾淨；`commands/cloud/render.ts` 不全等，是同檔後來採了其他 PR 的修改（例如 #7262 的進度輸出），不是缺漏。 | MERGED `b56e2c036`；`b56e2c036:packages/cli/src/cloud/fontPreflight.ts:86,126`（空 face 與 `describeSwappedFonts` 的說明） | `packages/cli/src/cloud/fontPreflight.ts:86`、`:127`；`packages/cli/src/commands/cloud/render.ts:324,370,661,816`（`swapped_fonts`、`describeSwappedFonts`） |
| [#7288](https://github.com/heygen-com/hyperframes/pull/7288) | 已採用（原節 2026-11-06 `66cbabc39`）：auto 一律走 filter tier，capture 維持明確 opt-in。`tier.ts`、`checkMotionBlur.ts`、`MotionBlurPanel.tsx`、`motion.md`、`captureMotionBlur.pixels.browser.test.ts` 等 10 個檔案反向乾淨；`discover.ts`、`index.ts` 不全等，是後續 #7271、#7292、#7293 的修改；`motion-blur.mdx` 為本線繁中版與手工合併；`skills-manifest.json` 為重生。`packages/cli/src/docs/motion-blur.md`（`hyperframes docs motion-blur` 的頁面）與五個 engine differential／fixtures browser 測試本線不存在：前者依 2026-11-06 原節判定不另建整份舊 CLI 文件（使用者入口是已更新的 guide），後者屬 #6967／#7302 成組延後的 harness。 | MERGED `e2bb7da25`；`e2bb7da25:packages/core/src/runtime/captureMotionBlur/tier.ts:70`（`chooseTier`） | `packages/core/src/runtime/captureMotionBlur/tier.ts:70`；`docs/guides/motion-blur.mdx:46` |

PR 水位推進到 #7288，連續且每筆有證據（#7272–#7279 為 issue 軸項目）。九筆 MERGED（#7267、#7268、#7270、#7271、#7280、#7283、#7284、#7287、#7288）沒有需要新移植的內容；六筆 OPEN 全部釘 monitored（見下）。

### 新釘選

| 釘選 | head | 狀態 | 重訪條件 |
| --- | --- | --- | --- |
| #7266 | `952fd2bb3c099f10c8df088a658a4ec7512afe32` | open | 合併後採用 texture upload gate 與 CI 專用的 `webglDraws.browser.test.ts` upload 計數 |
| #7269 | `7f3931eaf028d2aa69205652a8d040fa1715fdd9` | open | 本線引入 `templates pull` 且該 PR 已合併、探針已移除 |
| #7281 | `aaf4a0217d8b4f523903fc0e1338f636135ed353` | open | #7281、#7327、#7328 任一合併後採用最終版本 |
| #7282 | `951cee8ca7279c0940df4436b431be99a0c68e9f` | open | 合併後採用（含新測試檔） |
| #7285 | `00b85568cf7b2e67655ca2ac7343e9a3aeb54b3b` | open | #7285、#7322、#7325 任一合併後採用最終版本 |
| #7286 | `7f372305b8675cbe335ab7f4e155b6ef4444033d` | open | #7286、#7319、#7323 任一合併後採用最終版本 |

monitored 由 99 增為 105 筆。這六筆都是未合併的 open PR，依慣例只釘 head 與條件，不在 fork 先行移植；其中 #7285、#7286 是小而獨立的 lint 修正，但同一議題在上游有多筆重複 PR，等其中一筆合併才不會與最終版本分歧。

### 依賴、延後與對外邊界

#7191、#7295／#7080、#6967／#7302、#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#6897、#7246（#6940 limiter）、#7247（#6621）維持原延後條件；本批沒有新的延後項目，也沒有 commit 依賴它們。沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無。沒有預算增量。本批沒有採用任何上游程式碼，所以沒有 Co-authored-by 對象。

### 驗證

沒有產品程式碼變更：不需要 core runtime typecheck、lefthook typecheck、fallow 或套件雙樹比較。變更檔案限於 `tools/upstream_baseline.json`（PR 水位 7288、新增 6 筆 monitored）與四份文件。反向套用檢查與 `gh` 查詢皆為唯讀；沒有使用 `git apply --reject`，沒有執行 `tools/test_product.ps1 -Full`。

### 剩餘快照（水位 `18fc75dcd`，PR #7288）

2026-11-07、fork HEAD `6f7d25030`（工作樹未提交）以寫入後的 `tools/upstream_baseline.json` 重跑 `python tools/check_upstream_updates.py --strict` 仍 exit 1：commit 軸 0 個（`No new upstream commits`）；PR #7288 以上 38 筆待審（下一個是 #7289）；issue #7223 以上 11 筆；monitored 105 筆，沒有移動的釘選。現行剩餘數字只在此維護。

### 維護 gate 收尾

2026-11-07、fork HEAD `6f7d25030`（工作樹未提交）的 `pwsh -NoProfile -File tools/dev_check.ps1` 結果：exit 0，ruff `All checks passed!`、39 passed，結尾 `WINDOWS DEV CHECK GREEN`，12 份維護文件、0 個斷鏈；`docs/UPSTREAM.md`、`docs/DECISIONS.md`、`ROADMAP.md` 與 baseline 已同步（commit 水位 `18fc75dcd7b453ab10d0834bc9e8d2265353121c`、PR #7288、issue #7223、monitored 105）。

## 2026-11-07：接續至 `6fab21914`，審查最後 1 個 commit、15 筆 PR 與 11 筆 issue

以 fork `a3d8f0bcf` 為起點。起始 `python tools/check_upstream_updates.py --strict` exit 1：baseline `18fc75dcd` 之後 `git fetch upstream main` 得到 1 個新 commit（`6fab21914`／#7329，上游 tip），PR #7288 以上 38 筆、issue #7223 以上 11 筆，105 筆釘選全部「still at the head and state it was judged at」，沒有移動。本節審完這個 commit，commit 軸再次到達上游 tip；PR 軸從 #7289 連續審到 #7303（共 15 筆）；issue 軸 11 筆全部審完。#7329 的 PR 編號在 #7304 以上，本節因 commit 軸而先採用，PR 軸的 #7304–#7329 留給下一輪。補丁先用 `git apply --check` 預演（不用 `--reject`），整體不適用的檔案才手工移植。

### commit 軸

| Commit／PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `6fab21914`／[#7329](https://github.com/heygen-com/hyperframes/pull/7329) | 採用並適配：segmented 與 sequential disk 兩條擷取路徑也套用串流路徑早就有的 session 初始化預算。開 session、`initializeSession`、deferred drawElement init 共用同一個計時（`createSessionInitBudget`），卡住時以 `raceAgainstStall` 放棄，而不是無限等待；segmented 的 `openSegmentedSession` 晚到時會被關閉。串流路徑原有的內嵌預算抽成匯出的 `createSessionInitBudget`，三處共用。適配：本線串流路徑沒有 transient resume 迴圈，所以該處呼叫端 `frameIndex` 固定為 0（上游為 `resume.from`），其餘逐行同上游。這是跨平台的 timeout 保護，沒有 POSIX 專屬假設。 | `6fab21914:packages/producer/src/services/render/stages/captureStreamingStage.ts:278`（`createSessionInitBudget`）、`:1065`；`captureSegmentedStage.ts:342`；`captureStage.ts:586,595` | `packages/producer/src/services/render/stages/captureStreamingStage.ts:265,1026`；`captureSegmentedStage.ts:337`；`captureStage.ts:586,595` |

#### 上游動到的檔案逐檔判定

| Commit | 檔案 | 判定 |
| --- | --- | --- |
| `6fab21914` | `captureSegmentedStage.ts`、`captureStage.ts` | 補丁乾淨套用，逐行同上游。 |
| `6fab21914` | `captureStreamingStage.ts` | 預演在 1037 行附近的 hunk 失敗（本線沒有 `resume.from` 迴圈）；手工抽出 `createSessionInitBudget`、匯出 `StalledSession` 與 `OPENING_CAPTURE_SESSION`，序列路徑改呼叫 helper，`frameIndex: 0`。 |
| `6fab21914` | `captureSegmentedStage.test.ts`、`captureStage.test.ts` | 補丁乾淨套用，新增 3 個測試（segmented 2 個：session 開不起來、deferred drawElement init 卡住；sequential 1 個：deferred init 卡住）。 |
| `6fab21914` | 上游沒有動 engine 的 `*.browser.test.ts`、`*.chromium.test.ts`、golden、`package-size-budgets.json` | 本線無對應檔需要跟著改；沒有 LFS pointer。 |

### PR 軸

先用唯讀 `gh pr view --repo heygen-com/hyperframes --json state,mergeCommit,headRefOid` 取狀態：9 筆 MERGED 且合併 commit 全在 baseline 以內（`git merge-base --is-ancestor <合併 commit> 18fc75dcd` 為真）、5 筆 OPEN、1 筆 CLOSED（#7303）。MERGED 的裁決承接各自原清冊節，這裡重新核對 fork 端行號，並用上游合併 commit 的補丁逐檔對 fork 做反向套用檢查（`git show <commit> --format= -- <檔案> | git apply -R --check`，不用 `--reject`）。結果：#7294（3／3）、#7298（6／6）、#7299（2／2）、#7301（2／2）全部乾淨；#7290、#7292、#7293、#7295、#7302 不全等，逐檔原因見表。

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7289](https://github.com/heygen-com/hyperframes/pull/7289) | monitored（open，釘 head `14506ad8848b36aec3a1b2062b7af2cb865152fe`，外部貢獻者，修 issue #7275）：`hyperframes telemetry status --json` 輸出 `enabled`、`source`、`configPath`、`statePath`、`commandCount`。本線 `runStatus` 只印人類可讀文字，缺口存在；PR 尚待 review（`REVIEW_REQUIRED`）。重訪條件：合併後視為獨立小功能採用（改動限 `telemetry.ts`、`telemetry.test.ts` 與 `docs/packages/cli.mdx` 的說明段）。 | OPEN；`gh pr diff 7289`：`packages/cli/src/commands/telemetry.ts:53,91,100`（hunk） | `packages/cli/src/commands/telemetry.ts:55`（`runStatus`，只 `console.log` 人類文字）、`:120`（`case "status"`），整檔沒有 `json` 參數 |
| [#7290](https://github.com/heygen-com/hyperframes/pull/7290) | 不適用（整版 release v0.9.19）：21 個檔案皆為版本、plugin manifest、changelog 與發行說明；本線不發佈 npm、不改版本，承接 2026-11-06 原節（`b4cc674f7`）。 | MERGED `b4cc674f7`；`b4cc674f7:releases/v0.9.19.md:5` | 20 個既有檔案反向套用皆不全等（本線版本不同）；`releases/v0.9.19.md` 不存在；`packages/cli/package.json:3` 版本不變 |
| [#7291](https://github.com/heygen-com/hyperframes/pull/7291) | monitored（open，釘 head `d22ddb197d2e6c95b92ebed2d9179fa71a79ec34`，外部貢獻者，修 issue #7274）：新增 `media_invalid_data_volume` 警告，`data-volume` 不是有限數字或落在 0 到 3.98 之外時提醒。本線缺陷成立：執行期把超出範圍的值夾住、非數字退回 1，lint 完全不報；PR 尚待 review。重訪條件：合併後採用（改動限 `media.ts` 規則與 `media.test.ts`）。 | OPEN；`gh pr diff 7291`：`packages/lint/src/rules/media.ts:486`（新增規則）；`media.test.ts:1610` | `packages/lint/src/rules/media.ts` 沒有 `media_invalid_data_volume`（只在 `:907` 以 `Number(readAttr(...))` 讀值做別的規則）；`packages/core/src/audioGain.ts:25`（`clampAudioGain` 靜默夾住） |
| [#7292](https://github.com/heygen-com/hyperframes/pull/7292) | 已採用（原節 2026-11-06 批次）：有 viewport-fixed child 且尚非 containing block 的 mover 在 filter tier 保持銳利。`filterTier.ts`、`frames.ts`、`index.test.ts` 反向不全等，是原節記載的適配（helper 移到 `frames.ts`、`index.test.ts` 加 Range stub）與後續 #7293 的修改；engine 的 `captureMotionBlur.sweep.browser.test.ts` 與 `__fixtures__/motionBlur/thresholds.ts` 本線不存在，屬 #6967／#7302 成組延後的 harness，未被順手搬入。 | MERGED `b6f2bec16`；`b6f2bec16:packages/core/src/runtime/captureMotionBlur/filterTier.ts:97` | `packages/core/src/runtime/captureMotionBlur/filterTier.ts:99`、`:229`；兩個 engine 檔 `git ls-tree HEAD` 皆無 |
| [#7293](https://github.com/heygen-com/hyperframes/pull/7293) | 已採用（原節）：filter 的 SVG 定義放在 documentElement，不改變 composition 的 last-child。4 個檔案中 `filterTier.ts` 反向乾淨；`index.test.ts` 不全等（同上的 Range stub 與 #7292 測試）；兩個 engine harness 檔本線不存在，理由同 #7292。 | MERGED `2066a2ff5`；`2066a2ff5:packages/core/src/runtime/captureMotionBlur/filterTier.ts:166` | `packages/core/src/runtime/captureMotionBlur/filterTier.ts:191` |
| [#7294](https://github.com/heygen-com/hyperframes/pull/7294) | 已採用（原節）：`line_unread` 帶出 line run 兩端各三個鄰近樣本，空白樣本為 null。3 個檔案反向套用全部乾淨。 | MERGED `a81b34410`；`a81b34410:packages/cli/src/utils/craftAudit.ts:450` | `packages/cli/src/utils/craftAudit.ts:451`；`packages/cli/src/utils/checkTypes.ts:351` |
| [#7295](https://github.com/heygen-com/hyperframes/pull/7295) | 延後（承接原節，與 #7080 成組）：`pseudoBox` 接在本線不存在的 `grownBox`／`contentBox` 上，只搬 helper 沒有作用。`frames.ts` 反向不全等，因為本線的 `frames.ts` 只有為 fingerprint 讀取而搬入的 `within`／`pseudoBox`，沒有 crop 成長；engine 的 `sweepFixtures.ts`、`thresholds.ts`、`captureMotionBlur.sweep.browser.test.ts` 本線不存在。重訪條件不變：#7080 的 Range／overflow／SVG 管線與此修正一併驗 before／after、旋轉與 ancestor transform、overflow hidden、SVG mask／clip、正反 seek 及輸出 RGBA。 | MERGED `4bee04e4a`；`4bee04e4a:packages/core/src/runtime/captureMotionBlur/frames.ts:59`、`:82` | `packages/core/src/runtime/captureMotionBlur/frames.ts:43`、`:61`（仍以 `offsetWidth`／`offsetHeight` 取 crop） |
| [#7296](https://github.com/heygen-com/hyperframes/pull/7296) | monitored（open，釘 head `66d747e10b289ff2e0cf617da938c56d6d11ec65`，外部貢獻者，修 issue #7278）：`scripts/check-docs-cli-commands.mjs` 抽出可匯出的 `checkDocsCliCommands(cliSource, docsText)` 並新增測試，納入 `test:scripts`。本線腳本沒有測試，缺口存在；這是維護用 CI 腳本，不影響產品行為。重訪條件：合併後採用（`package.json` 的 `test:scripts` 清單要加新測試檔，本線該行與上游不同，需手工合併）。 | OPEN；`gh pr diff 7296`：`scripts/check-docs-cli-commands.mjs:1`（重寫）；`package.json:54`；新增 `scripts/check-docs-cli-commands.test.mjs` | `scripts/check-docs-cli-commands.mjs:1-25`（頂層直接執行、無匯出）；`package.json:57`（`test:scripts` 沒有此測試）；`.github/workflows/docs.yml:22` 觸發此腳本 |
| [#7297](https://github.com/heygen-com/hyperframes/pull/7297) | monitored（open，已 APPROVED，釘 head `dbe63cb7e94c98152c079e4b7354c97c835540fa`）：`hyperframes open` 在交出專案前停掉該專案的背景 preview，印一行說明；不是它啟動的背景 preview 則保留並印停止指令；`preview` 的提示改成說明如何結束。本線 `open.ts` 沒有這段，缺口存在；改動 10 個檔案橫跨 `open.ts`、`preview.ts`、`desktopApp.ts`、範本 `AGENTS.md`／`CLAUDE.md`（上游範本兩份位元組一致，本線只維護 `AGENTS.md` 那份）、skill 參考文件與 `skills-manifest.json`，且動到本線已手工適配的 `desktopApp.ts`，需合併後一次判定。重訪條件：合併後採用，範本只改 `AGENTS.md`，`skills-manifest.json` 重生。 | OPEN；`gh pr diff 7297`：`packages/cli/src/commands/open.ts:26,120`；`desktopApp.ts:220,263`；`preview.ts:1325` | `packages/cli/src/commands/open.ts:1-75`（沒有停 preview）；`packages/cli/src/commands/preview.ts:1332`（`desktopHint(projectDir)`）；`packages/cli/src/utils/desktopApp.ts:282`（提示文字） |
| [#7298](https://github.com/heygen-com/hyperframes/pull/7298) | 已採用（原節）：Shift 只更新容器 data attribute，cursor 交由 CSS，不以 React state 重渲染 timeline。6 個檔案反向套用全部乾淨。 | MERGED `66cbabc39`；`66cbabc39:packages/studio/src/player/components/useTimelineShiftModifier.ts:4` | `packages/studio/src/player/components/useTimelineShiftModifier.ts:4`；`timelineProviderStateBuilders.ts:79` |
| [#7299](https://github.com/heygen-com/hyperframes/pull/7299) | 已採用（原節）：variable supplement 在涵蓋的 bundled exact weights 另發 face。2 個檔案反向套用全部乾淨。此修正同時是 issue #7313 的修復（見 issue 軸）。 | MERGED `6011d9d0d`；`6011d9d0d:packages/core/src/fonts/deterministicFonts.ts:691` | `packages/core/src/fonts/deterministicFonts.ts:690`（`bundledWeightsWithin`）、`:762` |
| [#7300](https://github.com/heygen-com/hyperframes/pull/7300) | monitored（open，釘 head `df21718e3e3f0c38b9f73eb1203474dd421d99e0`，外部貢獻者，修 issue #7273）：新增 `start_reference_unknown_id` 警告，相對 `data-start`（例如 `intro + 0.5`）指向同 composition 內不存在的 id（拼錯或寫成 `1.5s`）時提醒，並建議純數字。本線缺口成立（會靜默從 0 開始）；PR 尚待 review。重訪條件：合併後採用（改動限 `structure.ts`、`structure.test.ts`、`structure.catalog.test.ts` 與 `docs/reference/lint-rules.mdx`，文件為本線繁中版需手工合併）。 | OPEN；`gh pr diff 7300`：`packages/lint/src/rules/structure.ts:228`（新規則，47 行）；`docs/reference/lint-rules.mdx:62` | `packages/lint/src/rules/structure.ts`：沒有 `start_reference_unknown_id`；`data-start` 只在 `:51-56` 與 `:208-221`（巢狀可見度）處理 |
| [#7301](https://github.com/heygen-com/hyperframes/pull/7301) | 已採用（原節）：Chrome install worker 提高一級優先權，EPERM／EACCES 仍退回正常優先權。2 個檔案反向套用全部乾淨。 | MERGED `8fd754207`；`8fd754207:packages/cli/src/renderSetupWorker.ts:25` | `packages/cli/src/renderSetupWorker.ts:24` |
| [#7302](https://github.com/heygen-com/hyperframes/pull/7302) | 成組延後（承接原節）：CI fail-closed 的 blur gate 與 liveness 依賴本線沒有的 harness。14 個檔案中 11 個本線不存在（engine 的 `blurPage.ts`、`differentialPage.ts`、`slideOutWatch.ts`／`.test.ts`、`captureMotionBlur.liveness.browser.test.ts`，producer 的 `blurRender.ts` 與五個 `blurDifferential.*.integration.test.ts`），3 個存在但反向不全等（`integration-tests.json`、`run-test-lane.mjs`、`scripts/test-reachability.json`，因為本線從未註冊這批測試）。單搬任何一個沒有被測物；重訪條件不變：#6967 的 differential harness 與 #6912 一併引入時成組採用。 | MERGED `07824098e`；`07824098e:packages/producer/scripts/integration-tests.json`（註冊 5 個 blurDifferential）；`packages/engine/src/services/captureMotionBlur.liveness.browser.test.ts` | `git ls-tree HEAD` 對 11 個檔案皆無；`packages/producer/scripts/integration-tests.json`、`scripts/test-reachability.json`、`packages/producer/scripts/run-test-lane.mjs` 存在但 `blurDifferential` 出現 0 次 |
| [#7303](https://github.com/heygen-com/hyperframes/pull/7303) | 不釘、不採：codegen bot 重生雲端客戶端型別（`packages/cli/src/cloud/_gen/types.ts`），已 CLOSED 未合併，bot 留言說明被 EF commit `bcebe2ab` 的 #7326 取代。依既有慣例（`docs/DECISIONS.md` 的 codegen 規則：機器重生的 `chore(codegen)` 不釘）不列 monitored；#7326 輪到時再判定，該型別重生會移除或新增 fork 呼叫端使用的欄位時，需與 `commands/cloud/render.ts` 一併檢查。 | CLOSED（`gh pr view 7303`，留言 "Superseded by sync/hyperframes-codegen-bcebe2ab"） | `packages/cli/src/cloud/_gen/types.ts` 未變；`packages/cli/src/cloud/generatedClient.contract.test.ts` 存在 |

PR 水位推進到 #7303，連續且每筆有證據。九筆 MERGED（#7290、#7292、#7293、#7294、#7295、#7298、#7299、#7301、#7302）沒有需要新移植的內容；五筆 OPEN 全部釘 monitored（見下）；#7303 已被取代，不釘。

### 新釘選

| 釘選 | head | 狀態 | 重訪條件 |
| --- | --- | --- | --- |
| #7289 | `14506ad8848b36aec3a1b2062b7af2cb865152fe` | open | 合併後採用 `telemetry status --json` |
| #7291 | `d22ddb197d2e6c95b92ebed2d9179fa71a79ec34` | open | 合併後採用 `media_invalid_data_volume` 規則 |
| #7296 | `66d747e10b289ff2e0cf617da938c56d6d11ec65` | open | 合併後採用腳本測試，手工合併 `test:scripts` 清單 |
| #7297 | `dbe63cb7e94c98152c079e4b7354c97c835540fa` | open | 合併後一次判定 10 個檔案（範本只改 `AGENTS.md`，manifest 重生） |
| #7300 | `df21718e3e3f0c38b9f73eb1203474dd421d99e0` | open | 合併後採用 `start_reference_unknown_id`，繁中規則文件手工合併 |

monitored 由 105 增為 110 筆。五筆都是未合併的 open PR，依慣例只釘 head 與條件，不在 fork 先行移植。

### issue 軸

11 筆全部以唯讀 `gh issue view` 取狀態與關聯 PR 後逐筆對 fork 判定。issue 沒有釘選機制（`monitored` 只收 `pr#`），所以仍會變動的項目靠對應的 PR 釘選或下方條件追蹤。

| Issue | 裁決與理由 | 證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7259](https://github.com/heygen-com/hyperframes/issues/7259) | 已由已採用的 commit 修復，且延伸修正已釘：macOS 硬體 GPU 上 `check` 的 `data-color-grading` 圖片每個 overlap sample 重傳整張紋理。已 CLOSED，由 #7264（MERGED `256b84a41`，原節已採用）關閉；#7266（open，已釘 `952fd2bb3c099f10c8df088a658a4ec7512afe32`）再把 geometry-only seek 的 draw gate 擴到 `texImage2D` 等 5 個上傳方法。症狀為 macOS 專屬，本線 Windows 不重現。 | `gh issue view 7259`：closedBy #7264、#7266 | `packages/core/src/runtime/colorGrading.ts:3343-3350`（`drawsGated`、`uploadSourceTexture` 受 gate 控制）；`packages/cli/src/capture/captureCompositionFrame.ts:486` 的清單仍止於 `blitFramebuffer`（#7266 的範圍） |
| [#7272](https://github.com/heygen-com/hyperframes/issues/7272) | 缺陷成立，等上游 PR：lint 不報 parser 拒絕的 `data-duration`。OPEN，三筆 PR 競爭（#7286 已釘、#7319、#7323，後兩者在下一批 PR 軸判定）。重訪條件：其中一筆合併後採用最終版本。 | OPEN；closedBy 候選 #7286、#7319、#7323 | `packages/lint/src/rules/composition.ts:1067`、`:1081`（只轉出 `deprecated-layer`、`conflicting-end`）；`packages/parsers/src/compositionContract.ts:41`（`invalid-duration` 診斷已存在） |
| [#7273](https://github.com/heygen-com/hyperframes/issues/7273) | 缺陷成立，等上游 PR：`data-start` 指向不存在的 id 時靜默從 0 開始。OPEN，PR #7300 已釘（本批新增）。重訪條件：#7300 合併後採用。 | OPEN；closedBy 候選 #7300 | `packages/lint/src/rules/structure.ts` 沒有 `start_reference_unknown_id` |
| [#7274](https://github.com/heygen-com/hyperframes/issues/7274) | 缺陷成立，等上游 PR：lint 不報超出 0 到 3.98 的 `data-volume`。OPEN，PR #7291 已釘（本批新增）。重訪條件：#7291 合併後採用。 | OPEN；closedBy 候選 #7291 | `packages/core/src/audioGain.ts:25`（靜默夾住）；`packages/lint/src/rules/media.ts` 沒有對應規則 |
| [#7275](https://github.com/heygen-com/hyperframes/issues/7275) | 功能缺口，等上游 PR：`telemetry status --json`。OPEN，PR #7289 已釘（本批新增）。重訪條件：#7289 合併後採用。 | OPEN；closedBy 候選 #7289 | `packages/cli/src/commands/telemetry.ts:55`（`runStatus` 只有人類文字） |
| [#7276](https://github.com/heygen-com/hyperframes/issues/7276) | 缺陷成立，等上游 PR：lint 的 `non_deterministic_code` 不認 `crypto.randomUUID()`。OPEN，三筆 PR 競爭（#7285 已釘、#7322、#7325，後兩者在下一批判定）。重訪條件：其中一筆合併後採用最終版本。 | OPEN；closedBy 候選 #7285、#7322、#7325 | `packages/lint/src/rules/core.ts:963-964`（最後一個 pattern 是 `crypto.getRandomValues`） |
| [#7277](https://github.com/heygen-com/hyperframes/issues/7277) | 缺陷成立，等上游 PR：`hyperframes docs` 印出字面 `**`。OPEN，三筆 PR 競爭（#7281 已釘、#7327、#7328）。重訪條件：其中一筆合併後採用最終版本。 | OPEN；closedBy 候選 #7281、#7327、#7328 | `packages/cli/src/commands/docs.ts:58`（`formatInlineCode` 只處理反引號）、`:86`、`:92` |
| [#7278](https://github.com/heygen-com/hyperframes/issues/7278) | 缺口成立（維護腳本無測試），等上游 PR：OPEN，PR #7296 已釘（本批新增）。重訪條件：#7296 合併後採用。 | OPEN；closedBy 候選 #7296 | `scripts/check-docs-cli-commands.mjs` 無匯出、無測試檔 |
| [#7279](https://github.com/heygen-com/hyperframes/issues/7279) | 缺陷成立，等上游 PR：`lint-registry-items.mjs` 沒有安裝 manifest 宣告的 assets 就 lint。OPEN，PR #7282 已釘。為維護腳本，不影響產品。重訪條件：#7282 合併後採用。 | OPEN；closedBy 候選 #7282 | `scripts/lint-registry-items.mjs:76`、`:98`（只複製 `<name>.html`） |
| [#7312](https://github.com/heygen-com/hyperframes/issues/7312) | 不在本 repo 的程式碼：`skills update <name>` 在偵測到 Devin agent 的主機上回 "No valid skills found"。上游維護者回報在目前 main 無法重現，標 `triage/needs-info`，沒有關聯 PR。本線的 `skills` 指令只是組參數後委派給外部 `npx skills add`（`packages/cli/src/commands/skills.ts:136`），來源 repo 固定為 `heygen-com/hyperframes`（`:153`）；Devin 的來源目錄解析在外部 CLI，本線沒有可改之處。`.agents/skills/` 在本線也只有 internal 技能，與回報描述的 tag 狀態相同，所以若外部 CLI 的行為如回報所述，本線同樣會遇到，但沒有本線端的修正點。記錄、不動程式碼。重訪條件：上游出現修正 PR 或確認為 `hyperframes` 端缺陷時重審；本線 Windows 沒有 Devin agent 情境。 | OPEN、`triage/needs-info`、無 closing PR；維護者留言要求 verbose 輸出 | `packages/cli/src/commands/skills.ts:136`（`spawnNpx(["skills","add",...])`）、`:153`；`packages/cli/src/utils/agentDirs.generated.ts:53`（`devin` 只是安裝目標目錄） |
| [#7313](https://github.com/heygen-com/hyperframes/issues/7313) | 已由已採用的 commit 修復：`injectDeterministicFontFaces` 在 bundled 權重（400／700）下，Google `text=` subset 的非 Latin 字會落到系統字型。#7299（`6011d9d0d`，原節已採用）讓 variable supplement（`font-weight: 100 900`）在涵蓋的 bundled exact weights 另發同一個 face。上游 #7315（open，純測試，在下一批 PR 軸）為這個行為補測試；本批把該測試暫時套進工作樹實測（見聚焦紅綠）。 | OPEN（上游仍開著，#7315 的說明稱已由 #7299 修復）；`6011d9d0d:packages/core/src/fonts/deterministicFonts.ts:691` | `packages/core/src/fonts/deterministicFonts.ts:690`（`bundledWeightsWithin`）、`:762-766`（對每個 exact weight 另發 range face） |

issue 水位推進到 #7313，連續且每筆有證據。本批沒有需要新增的程式碼：#7259、#7313 已被已採用的 commit 覆蓋；其餘 8 筆缺陷或缺口各自對應一筆已釘的 open PR；#7312 無本線修正點，記錄即可。

### 依賴、延後與對外邊界

#7191、#7295／#7080、#6967／#7302、#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#6897、#7246（#6940 limiter）、#7247（#6621）維持原延後條件。#7329 不依賴它們：它只動 producer 擷取階段的 timeout 包裝，本線既有的 `raceAgainstStall` 與 `createStallClock` 已具備。沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無。沒有預算增量（上游該 commit 不動 `package-size-budgets.json`）。採用的上游程式碼作者為 Miguel Ángel（#7329，供 Co-authored-by，email 不寫入文件）。

### 聚焦紅綠

先只套用上游新增的測試（`captureSegmentedStage.test.ts`、`captureStage.test.ts`）、尚未動來源：`bun test captureSegmentedStage.test.ts` 紅，新增的兩個案例失敗（`gives up on a deferred drawElement init that never finishes, within the session-init budget`、`gives up on a session that never finishes opening, and closes it when it opens late`）；`vitest captureStage.test.ts` 紅，1 failed／22 passed（`sequential: gives up on a deferred drawElement init that never finishes, within the session-init budget`）。套用來源後同三個案例綠：`captureStage.test.ts` 23 passed，`captureSegmentedStage.test.ts` 39 pass／1 fail，`captureStreamingStage.test.ts` 35 pass／0 fail。`captureSegmentedStage.test.ts` 剩下的 1 fail 是既有的 `segmentOutputPath > zero-pads so lexical order equals frame order`（測試寫死 `/` 路徑分隔，Windows 的 `join` 回傳 `\`），用 `git archive HEAD` 建的乾淨樹同樣失敗（37 pass／1 fail），不是移植造成。

issue #7313 另做一次反向驗證：把上游 #7315 的測試暫時套進工作樹，本線程式碼綠（1 passed）；暫時停用 `bundledWeightsWithin` 的 exact-weight 另發（`for (const exact of [] as string[])`）後同一測試紅（1 failed），還原程式碼並刪除該測試檔後工作樹無殘留。

### 靜態閘門與驗證

- core、studio、scripts 三個 lefthook typecheck（`node node_modules/typescript/bin/tsc --noEmit -p <pkg>/tsconfig.json`）皆 exit 0；producer `tsc --noEmit -p tsconfig.json` exit 0。本批沒有動 core，所以不需要 core runtime typecheck。
- `node_modules/.bin/oxfmt --check`、`oxlint` 對 5 個異動來源與測試檔 exit 0（0 warnings、0 errors）。
- `fallow audit --base origin/main --fail-on-issues` exit 0（6 個異動檔：dead code 0、complexity 0、duplication 0）。
- producer unit lane 逐檔跑（bun 55 檔：918 pass／8 fail；vitest 279 檔：1173 pass／2 fail，共 1180 tests）。10 個失敗：`chunkAudio.test.ts`（3）、`projectHash.test.ts`（4，symlink EPERM）、`captureSegmentedStage.test.ts` 的 `segmentOutputPath`（1）、`renderDirOwner.test.ts`（1）、`segmentManifest.test.ts`（1）。用 `git archive HEAD` 建乾淨樹（`node_modules` 以 junction 指回工作樹）對這 5 個檔案各跑一次，失敗名單逐名相同：只在移植樹失敗＝0。其餘套件（core、engine、CLI、studio）沒有原始碼變更，未重跑。
- 反向套用檢查與 `gh` 查詢皆為唯讀；沒有使用 `git apply --reject`，沒有執行 `tools/test_product.ps1 -Full`。暫時乾淨樹的 junction 先移除再刪除目錄，無殘留。

### 剩餘快照（水位 `6fab21914`，PR #7303）

2026-11-07、fork HEAD `a3d8f0bcf`（工作樹未提交）以寫入後的 `tools/upstream_baseline.json` 重跑 `python tools/check_upstream_updates.py --strict` 仍 exit 1，但只剩 PR 軸：commit 軸 0 個（`No new upstream commits`，baseline 與上游 tip `6fab21914` 相同）；PR #7303 以上 23 筆待審（下一個是 #7304，其中 #7329 已在本節由 commit 軸採用）；issue #7313 以上 0 筆；monitored 110 筆，沒有移動的釘選。這是該時點的數字，現行數字見清冊最後一節。


## 2026-11-07：接續 PR 軸至 7335，審查最後 29 筆 PR

以 fork `dfbd01348` 為起點。起始 `python tools/check_upstream_updates.py --strict` exit 1：`git fetch upstream main` 後 `No new upstream commits`（baseline 與上游 tip 同為 `6fab21914`），110 筆釘選全部「still at the head and state it was judged at」；PR #7303 以上 23 筆（#7304–#7329）待審，issue #7313 以上 0 筆。這 23 筆是 #7304–#7329 扣掉 issue #7312、#7313 與不存在的 #7320（`gh` 對 PR 與 issue 都解析失敗），其中 #7329 已在上一節由 commit 軸採用。收尾重跑 strict 時上游又陸續冒出 #7330–#7335 六筆新 PR（`git fetch upstream main` 後 tip 仍是 `6fab21914`，沒有新 commit），一併審完，共 29 筆。本節只動 PR 軸，連續審到 #7335，沒有採用任何上游程式碼，所以沒有紅綠測試與套件雙樹比較（沒有改任何 `packages/` 檔案）。

審查中途 #7304 的 head 從 `ec7eebf1` 移到 `5a3e258a`（作者補上 reviewer 指出的多 worker chunk 不重試缺口，檔案數由 11 增為 13），新釘的 #7331 也從 `c73eb989` 移到 `8b0d18d4`（見該列），嚴格檢查兩次回報「1 pinned item moved」；每次都重讀新 head 的檔案清單、diff 與最新 review 後，在新 head 重釘，這正是釘選機制要擋的情境。

### PR 軸

先用唯讀 `gh pr view --repo heygen-com/hyperframes --json state,mergeCommit,headRefOid,reviewDecision` 取狀態：10 筆 MERGED 且合併 commit 全在 baseline 以內（`git merge-base --is-ancestor <合併 commit> 6fab21914` 皆為真）、19 筆 OPEN（含 2 筆 draft）。MERGED 的裁決承接各自原清冊節，這裡重新核對 fork 端行號，並用上游合併 commit 的補丁逐檔對 fork 做反向套用檢查（`git show <commit> --format= -- <檔案> | git apply -R --check`，不用 `--reject`）。結果：#7310（2／2）、#7318（2／2）全部乾淨；#7305（1／4）、#7306（17／26）、#7309（0／2）、#7314（0／4，兩檔本線不存在）、#7316（4／6）、#7317（2／3）、#7324（7／8）、#7329（4／5）不全等，逐檔原因都對應原節記載的適配或延後，見表。

OPEN 的處理規則：沿用 `docs/DECISIONS.md` 既有慣例，open 與 draft 的 PR（含 draft、純測試、純註解）一律釘 monitored，只有機器重生的 `chore(codegen)` 與版號 PR 不釘。本節新記錄兩個窄例外：一是同一 issue 上已有已釘 PR 的 open 重複 PR 不逐筆釘，由已釘的那一筆當追蹤器，因為追蹤器若被關閉或換 head 會讓嚴格檢查亮燈，而其中任何一筆合併都會以 commit 進入 commit 軸，到時採用最終合併的版本；二是本線沒有對應程式、合併後也不會進入本線的不適用 PR（#7307）不釘。

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7304](https://github.com/heygen-com/hyperframes/pull/7304) | monitored（open，釘 head `5a3e258a343bd390cce99a5cc3b6656a3d58d528`，`CHANGES_REQUESTED`，作者 Miguel Ángel）：擷取開始時圖片仍在載入，首次顯示該圖的畫格等它；等不到或載入失敗就停止 render 並在錯誤與前一則警告中點名該圖，不再出空白。產品決策已寫進 PR 本文（「the render stops and warns」）。本線缺陷成立：`waitForImagesReady` 逾時只呼叫 `onUnloaded` 發警告就繼續，render 會出缺圖影片。13 個檔案橫跨 engine（`frameCapture.ts`、`types.ts`、`index.ts`、新測試 `frameCapture-lateImages.test.ts`）、CLI `renderDiagnostic`、AWS Lambda CDK 與範例 template、Cloud Run `server.ts`、producer `renderChunk.ts`；是改變 render 失敗語意的行為變更，且作者仍在改 non-retryable 清單。重訪條件：合併後視為一組採用，逐一判定 13 個檔案（含只在 CI 跑的測試），本線對應的 Lambda／Cloud Run 非重試錯誤名清單與 `renderChunk.ts` 多 worker 路徑要一併對照。 | OPEN；`gh pr view 7304` 檔案清單；最新 review（`ec7eebf1`）blocker 為「非重試清單漏掉多 worker chunk」，新 head 加 `renderChunk.ts` 與 `renderChunkFallback.test.ts` 回應 | `packages/engine/src/services/frameCapture.ts:2370-2390`（`waitForImagesReady` 逾時只 `onUnloaded` 後續跑）、`:3039`、`:3181`、`:3961`（呼叫端）；`packages/producer/src/services/distributed/renderChunk.ts`、`packages/gcp-cloud-run/src/server.ts`、`packages/aws-lambda/src/cdk/HyperframesRenderStack.ts`、`examples/aws-lambda/template.yaml` 皆存在 |
| [#7305](https://github.com/heygen-com/hyperframes/pull/7305) | 已採用（原節 2026-11-06 批次）：check_report 只帶 allowlist 的 `stop_code`。反向套用 1／4 乾淨；`events.ts`、`events.test.ts`、`checkPipeline.ts` 不全等，是原節記載的適配（STOP_CODES 保持模組私有以通過 fallow、type-only import、沿用既有 telemetry opt-out）。 | MERGED `9fcd06cbb`；`9fcd06cbb:packages/cli/src/utils/checkPipeline.ts:2133` | `packages/cli/src/utils/checkPipeline.ts:2128,2133`；`packages/cli/src/telemetry/events.ts:1168`（`stop_code`） |
| [#7306](https://github.com/heygen-com/hyperframes/pull/7306) | 部分採用並適配（原節 2026-11-07 批次）：blur 掃描後回報 composition 持有物的計數，沿用既有 opt-out，不採 `readEvents`。反向套用 17／26 乾淨；9 個不全等的檔案（`discover.ts`／`discover.test.ts`、`filterTier.ts`、`frames.ts`、`index.ts`、`tier.ts`、`engine/src/types.ts`、`renderOrchestrator.ts`、`docs/packages/cli.mdx`）都是原節記載的適配，或本線 blur 管線與上游不同（#7080／#7295 延後）所致。 | MERGED `a874a6324`；`a874a6324:packages/core/src/runtime/captureMotionBlur/fingerprint.ts:117` | `packages/core/src/runtime/captureMotionBlur/fingerprint.ts:117` |
| [#7307](https://github.com/heygen-com/hyperframes/pull/7307) | 不適用、不釘（open，已 APPROVED）：替 `media-use generate --type image` 的 GPT Image 2.6 與每張參考圖計價。本線沒有 `commands/media-use/generate.ts`、`heygen/generate.ts`、`heygen/pricing.ts`，既有 `media-use` 只是 resolve passthrough，與 #7261／#7263 同一邊界。重訪條件：日後成組採用 HeyGen generation 管線時，這張價格表隨該管線一起判定；PR 先合併時會進 commit 軸，屆時同樣因檔案不存在而不適用。 | OPEN；`gh pr view 7307` 檔案：`packages/cli/src/commands/media-use/generate.ts`、`packages/cli/src/heygen/pricing.ts`、`skills/media-use/references/heygen.md` | `packages/cli/src/heygen/`、`packages/cli/src/commands/media-use/` 目錄不存在；`packages/cli/src/commands/media-use.ts` 存在（passthrough） |
| [#7308](https://github.com/heygen-com/hyperframes/pull/7308) | monitored（open，釘 head `bf3e88529c80b56571347105a0b91585d927691a`，外部貢獻者，`REVIEW_REQUIRED`）：SVG contact sheet 的圖說在 Windows 用檔名而非整條路徑，抽出匯出的 `svgContactSheetLabel`（`basename(p, ".svg")`）並加兩個測試。Windows 症狀在本線已不存在：`createSvgContactSheet` 早就用 `basename(p)` 取檔名；剩下的差異只有圖說用 `.replace(".svg", "")`，會取第一個出現而不是結尾，`a.svg.backup.svg` 會得到 `a.backup.svg`，屬邊角缺陷。重訪條件：合併後採用（2 個檔案、自包含：`contactSheet.ts`、`contactSheet.test.ts`）。 | OPEN；`gh pr diff 7308`：`packages/cli/src/capture/contactSheet.ts:266` 新增 `svgContactSheetLabel`、移除 `:309` 的 `split("/")` | `packages/cli/src/capture/contactSheet.ts:307`（`basename(p)`，無 `split("/")`）、`:331`（`.replace(".svg", "")`） |
| [#7309](https://github.com/heygen-com/hyperframes/pull/7309) | 延後（承接原節 `cb8e02e82`）：修 #6912 引入的 `releaseRouted` handover，本線沒有 #6912，補丁無處可套。反向套用 0／2。條件不變：與 #6912／#7225／#7232 的 WebKit 接管管線成組採用。 | MERGED `cb8e02e82`；`cb8e02e82:packages/core/src/runtime/webAudioTransport.ts:1056` | `packages/core/src/runtime/webAudioTransport.ts:1091`（無 `_handedOver`） |
| [#7310](https://github.com/heygen-com/hyperframes/pull/7310) | 已採用（原節）：MPEG-4 Part 2 與 MJPEG 加入 browser-hostile 表，預先轉出可播放副本。2 個檔案反向套用全部乾淨。 | MERGED `f3e45b492`；`f3e45b492:packages/studio-server/src/helpers/mediaCodecMap.ts:71-72` | `packages/studio-server/src/helpers/mediaCodecMap.ts:71-72` |
| [#7311](https://github.com/heygen-com/hyperframes/pull/7311) | monitored（open，釘 head `ed8a035b7d6acc62391f2091386c7776d0173292`，`APPROVED`）：分散式 render（plan／renderChunk／assemble）與 `--start`／`--end` range render 不再強制關閉頁面 motion blur，composition 的 `data-motion-blur` 說了算。PR 開頭標明是行為變更，並記載滾動部署期間新舊 worker 混跑會讓同一 render 的 chunk 一半銳利一半模糊，另有 HDR 來源與約 1.6 倍 CPU 的成本。本線缺口存在：合成 render job 寫死 `pageMotionBlur: "off"`、chunk 預設 `"distributed-render"`、驗證器只收 `"off"`。22 個檔案中 7 個是 blur 分散式整合測試，另有 `run-test-lane.mjs`、`integration-tests.json`、`test-reachability.json`，依賴本線沒有的 differential harness（#6967／#7302 成組延後）。重訪條件：合併後與 #6967／#7302 的 harness 成組判定；單搬 `plan.ts`、`chunkFrames.ts` 會在沒有對應測試下改變 render 輸出，不做。 | OPEN；`gh pr diff 7311`：`packages/producer/src/services/distributed/shared.ts`（移除寫死的 `"off"`）、`chunkFrames.ts`（移除 `?? "distributed-render"`）、`plan.ts`、`renderChunk.ts` | `packages/producer/src/services/distributed/shared.ts:470`（`pageMotionBlur: "off"`）、`chunkFrames.ts:163`（`?? "distributed-render"`）、`renderConfigValidation.ts:96-97`（僅接受 `"off"`） |
| [#7314](https://github.com/heygen-com/hyperframes/pull/7314) | 不適用（原節）：只改 `skills/reverse-any-video`（HeyGen 付費帳戶流程技能）與其 manifest 檢查，本線沒有該技能，沿用 2026-11-02 對 reverse-any-video／billing 的不採邊界。反向套用 0／4（兩個技能檔案不存在，`skills-manifest.json` 與檢查測試對應不同內容）。 | MERGED `410a516ce`；`410a516ce:skills/reverse-any-video/references/start.md:4` | `skills/` 七個技能，無 reverse-any-video |
| [#7315](https://github.com/heygen-com/hyperframes/pull/7315) | monitored（open，釘 head `8d984979406c4bf0f238dc708d5ab3b5a765f789`，`REVIEW_REQUIRED`，純測試）：為 #7313 加回歸測試，守住 Google `text=` subset face 在 bundled 權重 400／700 另發。沒有來源缺陷要等：缺陷已由 #7299 修復。上一節（issue #7313 的聚焦紅綠）已把此測試暫時套進工作樹實測，本線程式碼綠、停用 `bundledWeightsWithin` 的 exact-weight 另發後紅，所以測試對本線成立。重訪條件：合併後單檔原樣採用（`packages/core/src/fonts/deterministicFonts-textSubsetBundledWeights.test.ts`，不需要來源改動）；未合併前不把未審的測試搬進本線，釘選只為在 head 或狀態變動時重讀。 | OPEN；`gh pr view 7315` 檔案：僅 `deterministicFonts-textSubsetBundledWeights.test.ts` | `packages/core/src/fonts/deterministicFonts.ts:690`（`bundledWeightsWithin`）、`:762-766` |
| [#7316](https://github.com/heygen-com/hyperframes/pull/7316) | 已採用並適配（原節）：check_report 帶副本等待的計數與毫秒。`checkBrowser.ts`、`check.test.ts` 反向不全等：本線 `preResolveHostileMediaProxies` 沒有上游後續的 copy window／百分比，只移植 `record` callback 與 keepPartial。 | MERGED `de2d21a8a`；`de2d21a8a:packages/cli/src/utils/checkBrowser.ts:337` | `packages/cli/src/utils/checkBrowser.ts:207,275`（`record?.`） |
| [#7317](https://github.com/heygen-com/hyperframes/pull/7317) | 已採用並適配（原節）：render 讀 `data-composition-src` 與 preview 一致，拒絕離開專案資料夾的路徑。`htmlCompiler.ts` 反向不全等：本線入口 HTML 仍用 `readFileSync`，沒有上游 `readTextFile`，只在其後套 `normalizeCompositionSrcs`。 | MERGED `4cf26b5b4`；`4cf26b5b4:packages/producer/src/utils/paths.ts:141` | `packages/producer/src/utils/paths.ts:141`（`resolveCompositionSrc`）；`packages/producer/src/services/htmlCompiler.ts:215,813` |
| [#7318](https://github.com/heygen-com/hyperframes/pull/7318) | 已採用（原節，連同先決 #6851）：below 分支的 render landing 也 settle 已結束的 overlap，set 打斷 tween 後任何 worker 數都停在 set 的值。2 個檔案反向套用全部乾淨。 | MERGED `3e3ba8d0d`；`3e3ba8d0d:packages/core/src/runtime/adapters/gsap.ts:64` | `packages/core/src/runtime/adapters/gsap.ts:60,64,68`（`ownStructureOf`、`settleOverlapsEndedBetween`） |
| [#7319](https://github.com/heygen-com/hyperframes/pull/7319) | 重複 PR，不另釘（open，外部貢獻者，修 issue #7272）：與已釘的 #7286、以及 #7323 同議題。三筆都把 parser 的 `invalid-duration` 與 `invalid-track-index` 轉成 lint 結果；#7319 與 #7286 的規則代碼為 `invalid_data_duration`／`invalid_data_track_index`，#7323 為 `invalid_data_duration`／`invalid_track_index`（`gh pr diff` 逐筆讀）。規則代碼會出現在使用者的 lint 輸出與 `docs/reference/lint-rules.mdx`，所以採用時必須跟著最終合併的那一版，不先挑。追蹤器：#7286（已釘）。重訪條件：三筆其中一筆合併後以 commit 進入審查，採用合併版本，繁中規則文件手工合併。 | OPEN；`gh pr diff 7319`：`packages/lint/src/rules/composition.ts:1102`（+25 行新規則）、`composition.test.ts:65` | `packages/lint/src/rules/composition.ts:1067`（只處理 `deprecated-layer`）；`packages/parsers/src/compositionContract.ts:269`（`invalid-duration` 診斷已存在） |
| [#7321](https://github.com/heygen-com/hyperframes/pull/7321) | monitored、延後（open **draft**，釘 head `3fccf55f618d023d4d9be9aea73c2ad2bcc761a8`，bot 帳號代 Cut Room 團隊提出）：`audio --read --layer music\|sfx\|voice` 讓已知單一音層的檔案跳過分離（stem separation，經 HeyGen 計費）。PR 本文明說是 proposal，等上游維護者同意方向前不要求合併。本線 audio read 落後：`READ_VERSION = 4`，上游 tip 為 7（`upstream/main:packages/cli/src/audio/read/types.ts:3`），單搬 `--layer` 沒有可依附的上游 read 版本。重訪條件：PR 離開 draft 並合併，且本線 audio read 追上 `READ_VERSION` 時一併判定；合併前不動。 | OPEN、draft；`gh pr diff 7321`：`packages/cli/src/audio/read/read.ts:28-496`、`types.ts:4`、`commands/audio.ts` | `packages/cli/src/audio/read/types.ts:3`（`READ_VERSION = 4`）；`read.ts` 沒有 `layer` |
| [#7322](https://github.com/heygen-com/hyperframes/pull/7322) | 重複 PR，不另釘（open，外部貢獻者，修 issue #7276）：`non_deterministic_code` 加 `crypto.randomUUID()`。與已釘的 #7285、以及 #7325、#7328 的 lint 部分同樣是在 `core.ts` 規則表加 `/crypto\.randomUUID\s*\(/` 與標籤 `crypto.randomUUID()`；差別只在註解與測試。producer 的 `fileServer.ts` 只種 `getRandomValues`，缺陷在本線成立。追蹤器：#7285（已釘）。重訪條件：四筆其中一筆合併後以 commit 進入審查，採用合併版本（改動只在 `core.ts` 規則表與 `core.test.ts`）。 | OPEN；`gh pr diff 7322`：`packages/lint/src/rules/core.ts:964`（+5） | `packages/lint/src/rules/core.ts:963-964`（最後一個 pattern 是 `crypto.getRandomValues`） |
| [#7323](https://github.com/heygen-com/hyperframes/pull/7323) | 重複 PR，不另釘（open，外部貢獻者，修 issue #7272）：同 #7319，規則代碼為 `invalid_data_duration`／`invalid_track_index`（與 #7286、#7319 的 `invalid_data_track_index` 不同）。追蹤器：#7286（已釘）；條件同 #7319。 | OPEN；`gh pr diff 7323`：`packages/lint/src/rules/composition.ts:1102`（+28） | 同 #7319 |
| [#7324](https://github.com/heygen-com/hyperframes/pull/7324) | 已採用並適配（原節）：drawElement 的初始化閘門改為純函式 `drawElementGate`，新增 `webgl_unavailable` 與 `beginframe_no_self_verify`。8 個檔案反向 7／8 乾淨，`frameCapture.ts` 不全等是原節記載的手工移植。 | MERGED `18fc75dcd`；`18fc75dcd:packages/engine/src/services/drawElementService.ts:88` | `packages/engine/src/services/drawElementService.ts:79,88`；`packages/engine/src/services/frameCapture.ts:1139` |
| [#7325](https://github.com/heygen-com/hyperframes/pull/7325) | 重複 PR，不另釘（open，外部貢獻者，修 issue #7276）：同 #7322，多 7 行（含說明註解）。追蹤器：#7285（已釘）；條件同 #7322。 | OPEN；`gh pr diff 7325`：`packages/lint/src/rules/core.ts:964`（+7） | 同 #7322 |
| [#7326](https://github.com/heygen-com/hyperframes/pull/7326) | 延後、不釘（open，codegen bot）：重生雲端客戶端 `types.ts`，來源為 EF commit `bcebe2ab`，新增 `GptImage26Request`、`GptImage26FlareRequest` 並擴充 `ImageCreateRequest` 聯集。取代已關閉的 #7303（承接上一節）。依 `docs/DECISIONS.md` 的 codegen 慣例（機器重生的 `chore(codegen)` 不釘）。本線 `_gen/types.ts` 停在 EF `354b4cf4`（#6608），沒有 `ImageCreateRequest`／`GptImage25Request`（本線 0 次，上游 tip 2 次），與上游相差 960 行；媒體端點屬 #7063／#7078 的 generated client 鏈，已延後至 #7062 的 hosted schema 成組同步，這筆新增的型別不能單獨落地。重訪條件：#7062 成組同步時，用權威契約整檔重生並核對 `commands/cloud/render.ts` 呼叫端。 | OPEN；`gh pr diff 7326`：`packages/cli/src/cloud/_gen/types.ts`（只加型別與聯集成員，無刪除） | `packages/cli/src/cloud/_gen/types.ts`：`GptImage25Request` 0 次；`git diff --stat upstream/main HEAD -- 該檔` 292 增／668 刪；`git log` 最近一次為 `32e171ca9`（#6608） |
| [#7327](https://github.com/heygen-com/hyperframes/pull/7327) | 重複 PR，不另釘（open，外部貢獻者，修 issue #7277）：`formatInlineCode` 改名 `formatInline`，反引號之後把 `**text**` 換成 `c.bold(text)`；改動限 `docs.ts` 與 `docs.test.ts`。與已釘的 #7281、以及 #7328 同議題。追蹤器：#7281（已釘）。重訪條件：三筆其中一筆合併後以 commit 進入審查，採用合併版本。 | OPEN；`gh pr diff 7327`：`packages/cli/src/commands/docs.ts:67,85` | `packages/cli/src/commands/docs.ts:58`（`formatInlineCode` 只處理反引號）、`:86`、`:92` |
| [#7328](https://github.com/heygen-com/hyperframes/pull/7328) | 重複 PR，不另釘（open，外部貢獻者，同時宣稱修 #7277）：先以反引號 span 切分、再處理 `**bold**`，避免動到反引號內的字面 `**`。這筆 PR 還夾帶 #7276 的 `crypto.randomUUID()` lint 規則（`core.ts:964`＋`core.test.ts`），標題與範圍不符，本線不從這筆撈一半。追蹤器：#7281（docs 部分）、#7285（lint 部分），皆已釘。條件同 #7327、#7322。 | OPEN；`gh pr diff 7328`：`packages/cli/src/commands/docs.ts:67,105`；`packages/lint/src/rules/core.ts:964` | 同 #7327 與 #7322 |
| [#7329](https://github.com/heygen-com/hyperframes/pull/7329) | 已採用並適配（上一節 commit 軸）：segmented 與 sequential disk 擷取路徑套用 session 初始化預算。反向套用 4／5 乾淨，`captureStreamingStage.ts` 不全等是上一節記載的手工抽出（本線串流路徑沒有 transient resume 迴圈，`frameIndex` 固定為 0）。 | MERGED `6fab21914`；`6fab21914:packages/producer/src/services/render/stages/captureStreamingStage.ts:278` | `packages/producer/src/services/render/stages/captureStreamingStage.ts:265,1026`；`captureSegmentedStage.ts:337`；`captureStage.ts:586,595` |
| [#7330](https://github.com/heygen-com/hyperframes/pull/7330) | monitored、延後（open **draft**，釘 head `075ad69ed4a6ef11e57df6dc47af1372f6c2c792`，bot 帳號，`REVIEW_REQUIRED`；審查期間 head 由 `13c932a7` 移到 `075ad69e`，第二個 commit 把 fonts 檢查改為依結果分級並略過 emoji 與 OS 別名，檔案仍為 9 個）：`hyperframes check` 新增 `fonts` 區段，用 CDP `CSS.getPlatformFontsForNode` 問 Chrome 每個可見文字元素實際用了哪個字型，和 computed `font-family` 的第一個族比對，標出落到系統 fallback 的文字（例：IBM Plex Mono 沒有 Hangul 而 Chrome 靜默用系統字型）。本線缺口成立：`getPlatformFontsForNode` 在 `packages/cli/src` 出現 0 次，check 沒有 fonts 區段。9 個檔案依賴本線沒有的 `checkFailureCodes.ts`，另有只在 CI 跑的 `checkFonts.chromium.test.ts`；草稿階段設計仍會變。重訪條件：離開 draft 並合併後一組採用，逐一判定 9 個檔案（含 chromium 測試）與 Windows 系統字型名稱比對。 | OPEN、draft；`gh pr view 7330` 檔案：`packages/cli/src/utils/checkFonts.ts`、`checkFailureCodes.ts`、`checkPipeline.ts`、`checkTypes.ts`、`commands/check.ts` | `packages/cli/src/utils/checkFonts.ts`、`checkFonts.chromium.test.ts`、`checkFailureCodes.ts` 皆不存在；`grep getPlatformFontsForNode packages/cli/src` 0 筆 |
| [#7331](https://github.com/heygen-com/hyperframes/pull/7331) | monitored（open，釘 head `8b0d18d42e160ed2d3de1cf0bc2f3e22f0eeb085`，作者 Miguel Ángel，`CHANGES_REQUESTED`）：首格前失敗的 render 回報正確的 failed stage。failed stage 是最後一次設定的標籤，GPU 檢查與校準之後沒有人設新標籤，所以缺圖等擷取失敗被記成 `Checking browser GPU`，遙測的 `failed_stage_code` 也一起錯。修法把 `Starting frame capture` 的設定包成 `startingFrameCapture()`，在 GPU 檢查與校準之後再呼叫。本線缺陷成立：`Starting frame capture` 在 `:3554` 設完後，`:3588` 與 `:4070` 又改成 `Checking browser GPU`、`Measuring capture speed`，到首格擷取前沒有任何 `updateJobStatus` 把標籤改回擷取階段。審查期間作者針對 review blocker（`onEffectScanProgress` 在首格前也會設 `Checking effects` 標籤，同一個 sticky label 問題在另一條路徑仍開著；本線 `renderOrchestrator.ts:3667` 同樣有這個標籤）推了第二個 commit，head 從 `c73eb989` 移到 `8b0d18d4`，檔案數由 2 增為 8（新增 `engine/src/services/frameCapture.ts`、`riskFrames.ts`＋測試、`engine/src/types.ts` 的 `onEffectScanEnd`、`cli/src/commands/render.ts`＋測試的 stage code 正規化 `\d+ of \d+`），review 狀態仍是 `CHANGES_REQUESTED`。重訪條件：合併後一組採用 8 個檔案（本線 `renderOrchestrator.pageNeverReady.test.ts` 已存在），逐一判定 engine 與 CLI 的測試檔。 | OPEN；`gh pr diff 7331`：`packages/producer/src/services/renderOrchestrator.ts`（`startingFrameCapture` 包裝）、`packages/engine/src/services/riskFrames.ts`（`scanCssEffectLiveFrames` 的 `onEnd`）、`packages/cli/src/commands/render.ts`（`STAGE_COUNTS` 加 `\d+ of \d+`） | `packages/producer/src/services/renderOrchestrator.ts:3554,3588,4070`（三次 `updateJobStatus` 標籤）、`:5656`（`failedStage = job.currentStage`） |
| [#7332](https://github.com/heygen-com/hyperframes/pull/7332) | monitored（open，釘 head `2f2f6248f1f82a6fbadfd90b0a87803738d2ef09`，作者 Miguel Ángel，`REVIEW_REQUIRED`；審查期間 head 由 `13c0b5bb` 移到 `2f2f6248`，多了格式化與「取消或失敗由頁面內判斷」兩個 commit，檔案仍為同樣 3 個）：`hyperframes login` 後瀏覽器落地頁改依 HyperFrames 登入設計，新增 `auth/callbackPage.ts` 產生三種頁面，成功、取消、伺服器錯誤分開說明，不再一律「Sign-in failed」（取消不是失敗）。本線缺口成立：`loopback.ts:194` 的成功頁與 `:202` 的失敗頁是舊式小卡片，取消也顯示 `Sign-in failed`。純 CLI 本地頁面、不連網、與 Windows 無關，3 個檔案自包含（`callbackPage.ts`、`loopback.ts`、`loopback.test.ts`）。重訪條件：合併後採用，對照本線 `loopback.ts` 的 HeyGen 帳戶流程後，只採頁面與取消分流。 | OPEN；`gh pr view 7332` 檔案：`packages/cli/src/auth/callbackPage.ts`（新增）、`loopback.ts`、`loopback.test.ts` | `packages/cli/src/auth/loopback.ts:194`（`Signed in to HeyGen`）、`:202-204`（`Sign-in failed`）；`packages/cli/src/auth/callbackPage.ts` 不存在 |
| [#7333](https://github.com/heygen-com/hyperframes/pull/7333) | monitored、延後（open，釘 head `80387ab610a838bf83c0c2cb6e59679c64b0ba25`，作者 Miguel Ángel，`REVIEW_REQUIRED`，純註解）：更正 `createSessionInitBudget` 的說明——每個 setup 步驟各自受預算約束，而不是共用一個時鐘（`createStallClock` 會略過超過 15 秒 suspend margin 的間隔，所以整個 setup 最多可到每步一份預算）。行為不變。這是 #7329 審查時被指出的說明錯誤，本線已移植 #7329，`captureStreamingStage.ts:261-264` 的註解仍是「Each call races against what is left of the same clock」。重訪條件：合併後單檔採用註解；未合併前不搬未審的文字。 | OPEN；`gh pr view 7333` 檔案：僅 `packages/producer/src/services/render/stages/captureStreamingStage.ts`（註解） | `packages/producer/src/services/render/stages/captureStreamingStage.ts:261-264`（舊說明）、`:265`（`createSessionInitBudget`） |
| [#7334](https://github.com/heygen-com/hyperframes/pull/7334) | monitored（open，釘 head `57e09a5d64259b6b72a58fdefa3620136ebca638`，作者 Miguel Ángel，`REVIEW_REQUIRED`）：disk 路徑的 drawElement self-verify 遇到缺失的 frame 檔，改為略過該取樣（函式契約本來如此），不再以「ffmpeg 或 `psnr` filter 不可用」中止 render；另補第一批真正跑 disk compare 與 sample arming 的測試。成因：`psnrForDiskSample` 把讀檔與比對放在同一個 `try`，`ENOENT` 被 `isFfmpegInfrastructureFailure` 當成缺 ffmpeg。本線缺陷成立：`parallelCoordinator.ts:783-792` 的 `psnrForDiskSample` 結構相同，`:761` 的 `isFfmpegInfrastructureFailure` 一樣把任何 `ENOENT` 視為 ffmpeg 基礎設施失敗。4 個檔案：`parallelCoordinator.ts`、`frameCapture.ts`（一行）、`parallelCoordinator.verifyDisk.test.ts`，以及只在 CI 跑的 `frameCapture-verifyArming.browser.test.ts`。重訪條件：合併後採用 4 個檔案（browser 測試要一併判定），先確認本線 `psnrForDiskSample` 與上游 diff 的前後文相符。 | OPEN；`gh pr diff 7334`：`packages/engine/src/services/parallelCoordinator.ts:814,828`（`psnrForDiskSample` 拆分讀檔與比對）、`frameCapture.ts:5601`（`seekDeVerifyTruth`） | `packages/engine/src/services/parallelCoordinator.ts:761`（`isFfmpegInfrastructureFailure`）、`:783-792`（`psnrForDiskSample`）、`:831`（呼叫端） |
| [#7335](https://github.com/heygen-com/hyperframes/pull/7335) | 重複 PR，不另釘（open，外部貢獻者 jeffrey-graham，`Closes #7278`，head `5d78e28a630d42e39b2bb679645a525147cdd6b3`）：與已釘的 #7296 同一 issue（#7278）、同一做法——從 `scripts/check-docs-cli-commands.mjs` 匯出 `checkDocsCliCommands(cli, docs)`，新增 `scripts/check-docs-cli-commands.test.mjs`，並把它登錄進根 `package.json` 的 `test:scripts`；三個檔案與 #7296 完全相同。維護用 CI 腳本，不影響產品行為。追蹤器：#7296（已釘）。重訪條件：兩筆其中一筆合併後以 commit 進入審查，採用合併版本，`test:scripts` 清單手工合併。 | OPEN；`gh pr view 7335` 檔案：`scripts/check-docs-cli-commands.mjs`、`scripts/check-docs-cli-commands.test.mjs`、`package.json` | `scripts/check-docs-cli-commands.mjs:1-25`（頂層直接執行、無匯出）；`package.json:57`（`test:scripts` 沒有此測試） |

PR 水位推進到 #7335，連續且每筆有證據。十筆 MERGED（#7305、#7306、#7309、#7310、#7314、#7316、#7317、#7318、#7324、#7329）沒有需要新移植的內容；十筆 OPEN 釘 monitored（#7304、#7308、#7311、#7315、#7321、#7330、#7331、#7332、#7333、#7334，見下）；其餘 9 筆 OPEN 不釘（#7307 不適用、#7319／#7322／#7323／#7325／#7327／#7328／#7335 同議題重複、#7326 codegen），各自的重訪條件寫在上表。

### 新釘選

| 釘選 | head | 狀態 | 重訪條件 |
| --- | --- | --- | --- |
| #7304 | `5a3e258a343bd390cce99a5cc3b6656a3d58d528` | open | 合併後一組採用 late image 停止 render，逐一判定 13 個檔案 |
| #7308 | `bf3e88529c80b56571347105a0b91585d927691a` | open | 合併後採用 `svgContactSheetLabel`（2 個檔案） |
| #7311 | `ed8a035b7d6acc62391f2091386c7776d0173292` | open | 合併後與 #6967／#7302 的 differential harness 成組判定 |
| #7331 | `8b0d18d42e160ed2d3de1cf0bc2f3e22f0eeb085` | open | 合併後採用 failed stage 修正（8 個檔案，跨 producer／engine／CLI） |
| #7332 | `2f2f6248f1f82a6fbadfd90b0a87803738d2ef09` | open | 合併後採用登入落地頁與取消分流（3 個檔案） |
| #7315 | `8d984979406c4bf0f238dc708d5ab3b5a765f789` | open | 合併後單檔採用回歸測試 |
| #7321 | `3fccf55f618d023d4d9be9aea73c2ad2bcc761a8` | open（draft） | 離開 draft 並合併、且本線 audio read 追上 `READ_VERSION` 後一併判定 |
| #7330 | `075ad69ed4a6ef11e57df6dc47af1372f6c2c792` | open（draft） | 離開 draft 並合併後一組判定 9 個檔案（含 chromium 測試） |
| #7333 | `80387ab610a838bf83c0c2cb6e59679c64b0ba25` | open | 合併後單檔採用註解 |
| #7334 | `57e09a5d64259b6b72a58fdefa3620136ebca638` | open | 合併後採用 4 個檔案（含只在 CI 跑的 browser 測試） |

monitored 由 110 增為 120 筆。十筆都是未合併的 open 或 draft PR，依慣例只釘 head 與條件，不在 fork 先行移植。

### issue 軸

上游沒有高於 #7313 的新 issue，issue 水位不動。上一節留下「後兩筆在下一批判定」的三個 issue，這批的結果：#7272 有 #7286（已釘）、#7319、#7323 三筆競爭 PR；#7276 有 #7285（已釘）、#7322、#7325、#7328 四筆；#7277 有 #7281（已釘）、#7327、#7328 三筆。三個 issue 仍 OPEN、缺陷在本線仍成立（fork 證據行號不變：`composition.ts:1067`、`core.ts:963-964`、`docs.ts:58`），條件是其中一筆 PR 合併後採用最終版本。#7313 的修復狀態不變（#7299 已採用，#7315 只是補測試）。

### 依賴、延後與對外邊界

#7191、#7295／#7080、#6967／#7302（#7311 的前置）、#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#6897、#7246（#6940 limiter）、#7247（#6621）維持原延後條件。沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無。沒有預算增量（沒有採用上游 commit）。沒有採用上游程式碼，所以沒有需要列入 Co-authored-by 的上游作者。

### 靜態閘門與驗證

- 本批只改 `tools/upstream_baseline.json` 與四份 Markdown（清冊、`docs/UPSTREAM.md`、`docs/DECISIONS.md`、`ROADMAP.md`），沒有 `packages/` 或 `scripts/` 變更，所以 core runtime typecheck、lefthook typecheck、fallow、套件測試與雙樹比較都沒有被測物；不為了湊數而跑。
- 反向套用檢查與 `gh` 查詢皆為唯讀；沒有使用 `git apply --reject`，沒有執行 `tools/test_product.ps1 -Full`，沒有建立暫時乾淨樹、junction 或背景行程。

### 剩餘快照（水位 `6fab21914`，PR #7335）

2026-11-07 04:24（+0800）當時 `python tools/check_upstream_updates.py --strict` exit 0（fork HEAD `dfbd01348`，工作樹未提交，以寫入後的 `tools/upstream_baseline.json` 重跑）：commit 軸 0 個（`No new upstream commits`，baseline 與上游 tip `6fab21914` 相同）；PR 軸 `Triaged through #7335`、`No new items above that number`；issue 軸 `Triaged through #7313`、`No new items above that number`；monitored 120 筆，`Every pinned item is still at the head and state it was judged at`。這是該時點的結果：本輪審查期間上游至少新開了 #7330–#7335 並移動過多筆釘選的 head，之後若再出現新 PR 或釘選移動，strict 會再亮燈，屬下一輪範圍，不使本時點的結論失真。現行剩餘數字只在此維護（以此時點為準）。


## 2026-11-07：接續至 `555c788a3`，審查 23 個 commit、22 筆 PR、1 筆 issue 與 14 筆釘選移動

以 fork `eea576869`（工作樹未提交）為起點。起始 `python tools/check_upstream_updates.py --strict` exit 1（2026-11-07 17:35 +0800）：commit 軸 21 個（`6fab21914..cf75dfd7a`），PR #7335 以上 21 筆（#7336–#7357，扣掉 issue #7340），issue #7313 以上 1 筆（#7340），120 筆釘選中 14 筆移動。審查中上游又進了 #7355（`9058fd1a7`）與 #7352（`555c788a3`，正是本節已採用的 #7350 的後續修正）兩個 commit 和 release PR #7358，都在最後一次 strict 之前，一併審完，所以本節共 23 個 commit、22 筆 PR。最後一次 strict 之後才出現的項目不追，屬下一輪範圍。

方法：每個 commit 先用 `git show --stat` 列出上游動到的全部檔案，逐檔對 fork 做 `git apply --check`（唯讀），再以 `git apply --3way` 依上游順序套用；先只放測試檔跑出紅燈，再放來源轉綠（紅綠名稱見「紅綠證據」）。三方合併產生的衝突都在本節逐項處理。工作樹沒有 commit，沒有 `git apply --reject`。

### commit 軸

20 個採用（其中 #7304 的 CLI renderDiagnostic 部分不採用），3 個不採用。fork 行號為採用後的工作樹。

| Commit | 裁決 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `a9a8d8937` #7304 | 採用，但不含 CLI `renderDiagnostic.ts`／`.test.ts`：render 擷取開始時圖片仍在載入，首次顯示它的畫格等到載入；等不到或載入失敗就停止 render 並點名該圖，非重試錯誤名 `ImageMissingFromFrameError` 同步進 Lambda CDK、Cloud Run 與分散式 chunk。CLI 那一行只是把 `IMAGE_MISSING_FROM_FRAME` 加進 #6725（`ba8ffffa0`，失敗代碼）的 `renderFailureCode`，本線沒有 #6725，`renderDiagnostic.ts` 只有 25 行的 `renderMachineDiagnostic`，該檔三方合併會把 #6725 的整套搬進來，不做；重訪條件：採用 #6725 時補那一行與 `it.each` 一列。`server.test.ts` 的新測試引用本線沒有的 `planBody`，改為測試內自行定義 `PlanEvent`。13 個檔案逐檔：11 個採用，2 個（`renderDiagnostic.ts`、`.test.ts`）不採用 | `a9a8d8937:packages/engine/src/services/frameCapture.ts`（`waitForShownLateImages`）；`git show --stat` 13 個檔案 | `packages/engine/src/services/frameCapture.ts:2513`；`packages/gcp-cloud-run/src/server.ts:935`；`packages/aws-lambda/src/cdk/HyperframesRenderStack.ts:244`；`packages/producer/src/services/distributed/renderChunk.ts:400` |
| `fe0f54b38` #7331 | 採用：首格前失敗的 render 回報 `Starting frame capture`，不再是最後一次設定的 `Checking browser GPU` 或 `Checking effects`；`scanCssEffectLiveFrames` 新增 `onEnd`，CLI 的 `normalizeStageCode` 把 `\d+ of \d+` 正規化。8 個檔案全部乾淨套用（含 `renderOrchestrator.pageNeverReady.test.ts`） | `fe0f54b38:packages/producer/src/services/renderOrchestrator.ts`（`startingFrameCapture`） | `packages/producer/src/services/renderOrchestrator.ts:3555`；`packages/cli/src/commands/render.ts:1759`；`packages/engine/src/services/riskFrames.ts:85` |
| `9acdce4a2` #7332 | 採用：`hyperframes login` 的瀏覽器落地頁改由新檔 `callbackPage.ts` 產生，取消與失敗分開說明。`loopback.ts` 衝突：fork 的舊 `successPage`／`errorPage`／`escapeHtml` 被上游整段移除，取上游側 | `9acdce4a2:packages/cli/src/auth/callbackPage.ts` | `packages/cli/src/auth/callbackPage.ts:55`；`packages/cli/src/auth/loopback.ts`（舊頁面函式已刪） |
| `cfa0d0cef` #7334 | 採用：disk 路徑缺 frame 檔時略過該 self-verify 取樣，不再把 `ENOENT` 當成 ffmpeg 不可用而中止 render。4 個檔案：含 `frameCapture-verifyArming.browser.test.ts`（上游只在 CI 跑，本機 engine 的 vitest browser project 也會執行它：單獨跑通過；整個 engine 套件並行時有一次 5000 ms 逾時，見驗證段；import 的 `captureDeVerificationFrames`、`resolveHeadlessShellPath`、`__fixtures__/loopback` 在 fork 皆存在） | `cfa0d0cef:packages/engine/src/services/parallelCoordinator.ts` | `packages/engine/src/services/parallelCoordinator.ts:783`（`psnrForDiskSample`）；`packages/engine/src/services/frameCapture.ts:5629` |
| `d2b170ce5` #7337 | 採用：Studio 測試用 Chrome 在開始監聽後卡住時殺掉重試（測試輔助），並更正 `captureStreamingStage.ts` 的預算註解（這就是已關閉的 #7333 想改的那段，見釘選移動）。3 個檔案乾淨 | `d2b170ce5:packages/studio/tests/chromeTestUtils.ts` | `packages/studio/tests/chromeTestUtils.ts:13`；`packages/producer/src/services/render/stages/captureStreamingStage.ts:261` |
| `ab50e9c14` #7307 | 不適用、不採用：GPT Image 2.6 與參考圖計價，5 個檔案中 `commands/media-use/generate.ts`、`heygen/pricing.ts`、`heygen/generate.test.ts`、`skills/media-use/references/heygen.md` 在本線不存在，與 #7261／#7263 同一邊界。重訪條件：日後成組採用 HeyGen generation 管線時 | `ab50e9c14` 檔案清單 | `packages/cli/src/heygen/` 不存在；`packages/cli/src/commands/media-use.ts` 為 passthrough |
| `ca64c2a6d` #7336 | 採用：effect scan 先解析選項再掃描，單檔重構，緊接 #7331 的 `riskFrames.ts` 之後乾淨套用 | `ca64c2a6d:packages/engine/src/services/riskFrames.ts` | `packages/engine/src/services/riskFrames.ts` |
| `539c70cee` #7339 | 採用：set 與另一個屬性的 tween 並存時，render 不再倒轉 timeline。2 個檔案乾淨 | `539c70cee:packages/core/src/runtime/adapters/gsap.ts` | `packages/core/src/runtime/adapters/gsap.ts:60`（`ownStructureOf`） |
| `6c0cab814` #7289 | 採用：`telemetry status --json`；`--json` 搭配其他子命令丟 `CliUsageError`。`telemetry.ts` import 衝突：本線沒有 `failUsage` 的用途，只取 `CliUsageError`、`failCommand`。`docs/packages/cli.mdx` 加一段 | `6c0cab814:packages/cli/src/commands/telemetry.ts` | `packages/cli/src/commands/telemetry.ts:56`；`docs/packages/cli.mdx` |
| `a4a84deec` #5594 | 採用：Studio 畫布手勢（移動、縮放、旋轉）顯示位置、大小與角度讀數。3 個新檔加 4 個既有檔，全部乾淨套用 | `a4a84deec:packages/studio/src/components/editor/DomEditGestureReadout.tsx` | `packages/studio/src/components/editor/DomEditGestureReadout.tsx:32` |
| `f004622a6` #6900 | 採用：元素挑選在 Studio 或預覽按 Escape 取消並還原選取，hover 目標以 `tag#id`／`tag.class` 顯示。9 個檔案乾淨，含 `elementPickerHoverLabel.browser.test.ts`（上游只在 CI 跑；import 的 `tests/chromeTestUtils` 存在；本機結果見驗證段）與 `docs/packages/studio.mdx` | `f004622a6:packages/core/src/runtime/picker.ts` | `packages/studio/src/hooks/elementPickerHoverLabel.ts:6`；`packages/core/src/runtime/picker.ts` |
| `cc7a760f0` #7322 | 採用：`non_deterministic_code` 加 `crypto.randomUUID()`；#7285、#7325、#7328 的 lint 部分同議題，由這筆合併版取代 | `cc7a760f0:packages/lint/src/rules/core.ts` | `packages/lint/src/rules/core.ts:968` |
| `25a61016d` #5708 | 延後、不採用：可輸入精確縮放與高倍率像素格線。上游 `NLEPreview.tsx` 已使用本線沒有的 `previewStage.ts`（`resolvePreviewStageSize`、`SHADOW_IFRAME_STYLE`，來自 #6911 `a7075fcb6`）與 `usePreviewZoomOverlay`，本線 `PreviewZoomOverlay.tsx` 匯出的是 `usePreviewNavigator`。單搬會得到半新半舊的混合檔（`PreviewZoomOverlay.tsx`、`previewZoom.ts` 雖然補丁能乾淨套上），已全部還原到 HEAD。重訪條件：與 #6911 的 preview stage 成組採用時一併判定 6 個檔案 | `25a61016d:packages/studio/src/components/nle/NLEPreview.tsx` | `packages/studio/src/components/nle/` 無 `previewStage.ts`；`PreviewZoomOverlay.tsx` 匯出 `usePreviewNavigator` |
| `1ddd42558` #7342 | 採用：預覽稍後掛載的 scene 在 script 建 timeline 時保有排版，字間空白不再被吃掉。2 個檔案乾淨 | `1ddd42558:packages/core/src/runtime/init.ts` | `packages/core/src/runtime/init.ts:9`（`parkedClips`） |
| `b37db1122` #7345 | 延後、不採用：`audio --read --layer` 對單音層檔案跳過分離。`read.ts`、`types.ts` 衝突，本線 `READ_VERSION = 4` 而上游為 7，`audio.command.test.ts` 不存在；與已釘 #7321 同一邊界。重訪條件：本線 audio read 追上 `READ_VERSION` 時一併判定 | `b37db1122:packages/cli/src/audio/read/types.ts` | `packages/cli/src/audio/read/types.ts:3`（`READ_VERSION = 4`） |
| `bc2773d04` #7343 | 採用：韓文數字與量詞算一個詞（逐行閱讀時間）。2 個檔案乾淨 | `bc2773d04:packages/cli/src/utils/craftAudit.ts` | `packages/cli/src/utils/craftAudit.ts` |
| `65c62f314` #7350 | 採用：雲端上傳在固定時間被切斷時提早停止並顯示進度。`upload.ts` 乾淨；`upload.test.ts` 與 `commands/cloud/render.ts` 衝突：fork 的 `prepareLocalArchive` 沒有 `variables` 引數，只取 `onProgress: reportUploadProgress(...)`；fork 自有的「retries a server error before finalization」測試保留 | `65c62f314:packages/cli/src/cloud/upload.ts` | `packages/cli/src/cloud/upload.ts:67`；`packages/cli/src/commands/cloud/render.ts:297` |
| `6004508e6` #7348 | 採用：MPEG-2 與 DNxHD 也預先轉出可播放副本。2 個檔案乾淨 | `6004508e6:packages/studio-server/src/helpers/mediaCodecMap.ts` | `packages/studio-server/src/helpers/mediaCodecMap.ts:73` |
| `9ac2a2387` #7344 | 採用：`check` 在 stderr 命名存檔的 report、每個步驟印一行並每 30 秒重申。`check.ts`、`checkDeadline.ts`、`skills/hyperframes-cli/references/lint-validate-inspect.md` 乾淨；`check.test.ts`／`checkDeadline.test.ts` 衝突時三方合併把本線沒有的 #6705（`idleWindow`）測試帶回來，已刪除並保留 fork 原測試標題；`skills-manifest.json` 以 `bun packages/cli/scripts/gen-skills-manifest.ts` 重生（`hyperframes-cli` hash 為本線內容的 `221faecb36b31f76`，不是上游的 `af4aa1c5232591dd`） | `9ac2a2387:packages/cli/src/utils/checkDeadline.ts` | `packages/cli/src/utils/checkDeadline.ts:123`；`packages/cli/src/commands/check.ts:311` |
| `6161ae740` #7353 | 採用：雲端 render 的 zip 帶上 composition 參照的 dot-folder 檔案。2 個檔案乾淨 | `6161ae740:packages/cli/src/utils/publishProject.ts` | `packages/cli/src/utils/publishProject.ts` |
| `cf75dfd7a` #7356 | 採用：沒人列過的 codec 也預先轉出可播放副本。接在 #7348 之後，2 個檔案乾淨 | `cf75dfd7a:packages/studio-server/src/helpers/mediaCodecMap.ts` | `packages/studio-server/src/helpers/mediaCodecMap.ts` |
| `9058fd1a7` #7355 | 採用：瀏覽器解不了的影片（fetch 停在 header）5 秒後跳過，不再凍住整部影片。`media.test.ts` import 衝突：取 `isUnplayable`，不取本線沒有的 `primeMediaForLaterStarts` | `9058fd1a7:packages/core/src/runtime/media.ts` | `packages/core/src/runtime/media.ts:241` |
| `555c788a3` #7352 | 採用：上傳測試不再互相拖慢而抖動，兩次在同一個時間點被切斷算同一次。這是 #7350 的後續修正；在此之前 #7350 的「stops after a second identical cut」測試在 8 檔並行時紅燈（`expected 3 to be 2`），單獨跑綠，採用後 21 項全綠（連跑 2 次） | `555c788a3:packages/cli/src/cloud/upload.ts` | `packages/cli/src/cloud/upload.ts:146`（`repeatedCut`） |

採用 commit 的上游作者（供 Co-authored-by）：Miguel Ángel（#7304、#7331、#7332、#7334、#7337、#7336、#7339、#7342、#7343、#7350、#7348、#7344、#7353、#7356、#7355、#7352）、SophiaHuangCc（#7289）、Dante（#5594）、Muzzy5150（#6900）、ump45nose（#7322）。不採用的 #7307、#5708、#7345 作者不列。

### 紅綠證據

先把上游測試檔放進乾淨 HEAD 的工作樹跑出紅燈，再放來源跑綠。同一組命令前後各一次：

| 套件 | 紅（只有測試檔） | 綠（含來源） | 名稱 |
| --- | --- | --- | --- |
| core（4 檔） | 5 failed／404 passed | 409 passed | gsap.order「renders forward without rewinding…」、init.swapScenes「lays out a scene…」、media「skips a clip whose fetch stopped at its header…」、picker 兩項 |
| lint | 1 failed／199 passed | 200 passed | 「detects crypto.randomUUID() in script content」 |
| studio-server | 6 failed／44 passed | 50 passed | mpeg2video、dnxhd 無 mime、預先轉出，未列 codec 與 `Object.prototype` 鍵 |
| cli（8 檔） | 24 failed／403 passed | 1 failed／425 passed，加入 #7352 後 upload 21/21 | loopback 3、upload 3、check 1、render 1、telemetry 9、checkDeadline 3、craftAudit 1、publishProject 3 |
| engine（3 檔） | 7 failed／29 passed | 36 passed | `waitForShownLateImages` 5、disk 取樣缺檔 1、`scanCssEffectLiveFrames` 結束訊號 1 |
| producer（vitest） | 3 failed／3 passed | 6 passed | pageNeverReady 三項 failed stage |
| producer（bun） | 0 pass／1 fail | 17 pass／0 fail | `renderChunkFallback.test.ts` |
| gcp-cloud-run（bun） | 27 pass／1 fail | 28 pass／0 fail | 「does not retry a chunk whose frame shows an image that never arrived」 |
| aws-lambda（bun） | 25 pass／1 fail | 26 pass／0 fail | `HyperframesRenderStack.snapshot.test.ts` |
| studio | 8 failed + 2 檔 import 失敗 | 36 passed（3 檔） | `useElementPicker` 取消與 hover 標籤、`DomEditGestureReadout`、`elementPickerHoverLabel` |

沒有紅綠證據的：#7337 的 `chromeTestUtils`（測試輔助，需要本機 Chrome，未執行）；兩個 `*.browser.test.ts`（cfa0d0cef 的 `frameCapture-verifyArming`、f004622a6 的 `elementPickerHoverLabel`）沒有單獨做舊碼紅燈，只在含來源的樹上跑綠，結果見驗證段。

### PR 軸

先用唯讀 `gh pr view --repo heygen-com/hyperframes` 取狀態。MERGED 的 PR 隨各自的 commit 裁決，不重複列；其餘：

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7338](https://github.com/heygen-com/hyperframes/pull/7338) | monitored（open，釘 head `6bb98481f`，`APPROVED`）：專案或輸出路徑旁的暫存資料夾在 Windows 超過 260 字元就失敗，26 處 `mkdtempSync` 改走 `@hyperframes/core/atomic-file` 的 `createStagingDir`，另有掃描測試防止回退。本線缺口成立（Windows 直接相關）。23 個檔案橫跨 CLI、engine、producer、core、studio-server，含本線沒有的 `templates.ts`。重訪條件：合併後一組採用，逐檔判定 23 個檔案，`templates.ts` 不存在時略過 | OPEN；`gh pr view 7338` 檔案清單 | `packages/cli/src/commands/benchmark.ts:75`、`compare.ts`（`mkdtempSync`）；`createStagingDir` 在 `packages/core/src` 0 筆 |
| [#7341](https://github.com/heygen-com/hyperframes/pull/7341) | monitored（open，釘 head `c42ff6b07`，`REVIEW_REQUIRED`）：預覽以排版方式（`visibility:hidden !important`）掛載 parked scene，而非 `display:none`，讓掛載時的 tween 不移動字間空白。與已採用的 #7342 修同一個症狀（karaoke 行字間空白消失）但做法不同，檔案相同（`init.ts`、`init.swapScenes.test.ts`）；#7342 已合併進本線。重訪條件：#7341 合併時重讀是否與 #7342 衝突或補充；被關閉就視為已被 #7342 取代 | OPEN；`gh pr view 7341` | `packages/core/src/runtime/init.ts:9`（`parkedClips`）；#7342 已採用 |
| [#7346](https://github.com/heygen-com/hyperframes/pull/7346) | monitored（open，釘 head `1aae19aef`，`REVIEW_REQUIRED`，作者 James Russo）：Studio 拖曳時間軸時，影片層解碼完成前保持上一張完整畫面。58 個檔案（含 `bun.lock`、core runtime、player、studio），改變預覽行為。重訪條件：合併後一組判定，逐檔對照本線 `init.swapScenes` 與 `video-texture-compat` 的差異 | OPEN；`gh pr view 7346` | `packages/core/src/runtime/init.ts`、`packages/player/src/` 存在，改動面大，待合併 |
| [#7347](https://github.com/heygen-com/hyperframes/pull/7347) | monitored（open，釘 head `ac007894c`，`REVIEW_REQUIRED`，純測試）：Safari 效能測試失敗時說明哪個等待逾時。4 個檔案：`.github/workflows/player-safari.yml`、`packages/player/tests/perf/browsers/bench-page.js`、`run.ts`、`perf/server.ts`，本線皆存在。重訪條件：合併後單批採用 | OPEN；`gh pr view 7347` | `.github/workflows/player-safari.yml`、`packages/player/tests/perf/browsers/bench-page.js` 存在 |
| [#7349](https://github.com/heygen-com/hyperframes/pull/7349) | monitored（open，釘 head `f7d763ce5`，`APPROVED`）：HLG 影片的 SEI 標頭很大時，也在 HLG 白點做 tone-map。2 個檔案：`videoFrameExtractor.ts`、`.test.ts`。重訪條件：合併後採用 | OPEN；`gh pr view 7349` 檔案 | `packages/engine/src/services/videoFrameExtractor.ts:911`（以 SPS 讀 transfer 的區段） |
| [#7357](https://github.com/heygen-com/hyperframes/pull/7357) | monitored（open，釘 head `498dfa297`，尚無 review）：大檔上傳後雲端回 409「仍在檢查」，CLI 原本只等約 5 秒就把整個匯出視為被拒，改為依檔案大小等到最多 10 分鐘。與已採用的 #7350／#7352 同檔（`upload.ts`）。重訪條件：合併後採用 | OPEN；`gh pr view 7357` | `packages/cli/src/cloud/upload.ts`（`completeWithRetry`） |
| [#7351](https://github.com/heygen-com/hyperframes/pull/7351) | 不適用、不釘（open，已 APPROVED）：GPT Image 價格標為估計並顯示實際扣款額度，9 個檔案落在 `heygen/generate.ts`、`pricing.ts`、`v3.ts`、`media-use` 技能，本線沒有；與 #7307 同一邊界 | OPEN；`gh pr view 7351` 檔案 | `packages/cli/src/heygen/` 不存在 |
| [#7354](https://github.com/heygen-com/hyperframes/pull/7354) | 重複 PR，不另釘（open，外部貢獻者）：docs 渲染器移除 `**bold**` 標記，與已釘的 #7281 同議題（#7277），都改 `docs.ts`／`docs.test.ts`。追蹤器：#7281（已釘）。重訪條件：其中一筆合併後以 commit 進入審查，採用合併版 | OPEN；`gh pr view 7354` | `packages/cli/src/commands/docs.ts:58`（`formatInlineCode` 只處理反引號） |
| [#7358](https://github.com/heygen-com/hyperframes/pull/7358) | 不釘（open，`chore: release v0.9.20`）：整版 release 版號與 changelog，沿用 #7270 的版號 PR 不釘慣例 | OPEN；`gh pr view 7358` 檔案：各 `package.json`、`plugin.json`、`releases/v0.9.20.md` | 不適用 |

### issue 軸

| issue | 裁決與理由 |
| --- | --- |
| [#7340](https://github.com/heygen-com/hyperframes/issues/7340) | 記錄、不動（OPEN，外部貢獻者 kevinschaich）：提議可選的 shared-browser 並行擷取模式，在 macOS 搭配 GPU 約快 3.5–4.5 倍。是效能提案，沒有對應 PR，也沒有 Windows 數據；本線 `packages/engine/src/services/parallelCoordinator.ts` 的每個 worker 各自啟動瀏覽器的結構不變。重訪條件：上游出現實作的 PR 並合併後，以 commit 進入審查，屆時對照 Windows 行為再判定 |

### 釘選移動（14 筆）

先前 120 筆釘選在起始 strict 中有 14 筆移動，逐筆重讀 `gh pr view` 與 compare 後：

| 釘選 | 移動 | 裁決 |
| --- | --- | --- |
| #6900 | open → merged（`f004622a6`） | 已解決：由 commit 軸採用，重釘 closed |
| #7289 | open → merged（`6c0cab814`） | 已解決：採用，重釘 closed |
| #7304 | open → merged（`a9a8d8937`） | 已解決：採用（不含 CLI renderDiagnostic），重釘 closed |
| #7331 | open → merged（`fe0f54b38`） | 已解決：採用，重釘 closed |
| #7332 | open → merged（`9acdce4a2`） | 已解決：採用，重釘 closed |
| #7334 | open → merged（`cfa0d0cef`） | 已解決：採用，重釘 closed |
| #7285 | open → closed（未合併） | 已解決：被合併的 #7322（`cc7a760f0`）取代並已採用，重釘 closed |
| #7333 | open → closed（未合併） | 已解決：註解更正已由 #7337（`d2b170ce5`）帶入並採用（`captureStreamingStage.ts:261`），重釘 closed |
| #7249 | head `4dc886748` → `4c89caa88`（open，`APPROVED`） | 重讀：作者重寫做法，現為 11 個檔案（`htmlDocument.ts` +24/-1、`standaloneEntry.ts`、`compositionLoader.ts`、`subCompositionValidity.ts`、`composition.ts` 等），改成 compiler、inliner、lint 共用單一「選第一個 scene template」的函式並對多個 template 發 lint。仍 open，缺口成立，重釘新 head；重訪條件不變（合併後一組採用） |
| #7281 | head `aaf4a0217` → `a49c2baa2`（open，`APPROVED`） | 重讀：新 commit「preserve literal markdown in docs code spans」（`docs.ts` +7/-7、`docs.test.ts` +8）。仍 open，重釘；追蹤器角色擴及 #7354 |
| #7282 | head `951cee8ca` → `0faec0a1c`（open，`APPROVED`） | 重讀：新 commit 把 registry lint 回歸整合進 CI（`package.json`、`lint-registry-items.mjs` +21/-17、`.test.mjs` +44/-6）。仍 open，重釘 |
| #7286 | head `7f372305b` → `3106a7559`（open，`APPROVED`） | 重讀：重新 rebase 成單一 commit，仍是 `lint-rules.mdx`、`composition.ts`、`composition.test.ts` 三個檔案。仍 open，重釘；追蹤器角色不變 |
| #7291 | head `d22ddb197` → `7a21c7140`（open） | 重讀：新 commit 只從 `media.ts` 移除 6 行 docblock（為了 comment ratchet）。重釘 |
| #7296 | head `66d747e10` → `a71998752`（open） | 重讀：新 commit 只對 `check-docs-cli-commands.mjs` 做 oxfmt 格式化（+5/-4）。重釘；追蹤器角色擴及 #7335 |

### 新釘選

#7338、#7341、#7346、#7347、#7349、#7357 六筆 open PR 新釘（head 見上表與 `tools/upstream_baseline.json`）。#7352 已合併而採用，#7351、#7354、#7358 不釘。monitored 由 120 增為 126 筆；14 筆移動全部重釘（8 筆轉 closed，6 筆換 head），沒有釘選被移除。

### 預算、LFS 與延後

- 沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無。
- 23 個 commit 的 `git show --stat` 沒有 `scripts/package-size-budgets.json` 變動，沒有預算增量要帶。
- 維持延後：#7191、#7295／#7080、#6967／#7302（#7311 的前置）、#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#6897、#7246、#7247。本輪新增延後：#5708（待 #6911 preview stage）、#7345（待 audio read 追上 `READ_VERSION`）、#6725 在 `renderDiagnostic.ts` 的 `IMAGE_MISSING_FROM_FRAME` 一行。

### 靜態閘門與驗證

- core runtime typecheck（`packages/core` 下 `node ../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.runtime.json`）exit 0；lefthook 的三組 `tsc --noEmit`（`packages/core`、`packages/studio`、`scripts`）全部 exit 0；engine、lint、studio-server、gcp-cloud-run、aws-lambda、producer 的 `tsc --noEmit` exit 0；`packages/cli` 只剩 `check.test.ts` 的 3 個既有型別錯誤（`deadline` possibly undefined、`assertKnownFlags` 引數數量兩處），乾淨 HEAD 同樣 3 個，行號因新增測試位移。
- oxlint 對 63 個變更檔案 0 error（修掉 `telemetry.ts` 一個未使用的 `failUsage` import），`oxfmt --check` 全部格式正確。
- `fallow audit --base origin/main --fail-on-issues`：首次 exit 1（`check.ts` 的 `checkReportFile` 多餘 export、`chromeTestUtils.ts` 與 engine `__fixtures__/loopback.ts` 的 `closeTestChrome` 重複碼）；修正後 exit 0（`checkReportFile` 不再 export；`chromeTestUtils.ts` 加 `// fallow-ignore-file code-duplication`，與 `media.test.ts` 同一做法，跨套件測試輔助不能互相 import）。輸出中仍列的 `parallelCoordinator.ts:1147-1165` 重複碼與 `handleRenderError` 複雜度是 `origin/main` 既有的 inherited findings，不在 gate 內。`check:cli-process-ownership`、`scripts/check-large-files.sh`、`check:tracked-artifacts`、`scripts/check-studio-file-size.mjs` 全部 exit 0。
- 套件完整測試（`vitest run`，各自以乾淨 HEAD 的 `git archive` 樹比對失敗名稱；乾淨樹的 `node_modules` 以 junction 指向本樹，workspace 依賴解析到本樹的 dist，所以只對與本批無關的 Windows 環境失敗做名稱比對）：
  - core：265 files、5662 passed／11 skipped／0 failed。
  - lint：1250 passed／1 failed（`projectShaders` symlink 檔），乾淨 HEAD 同一項失敗，只在移植樹失敗＝0。
  - studio-server：1503 passed／23 failed／61 skipped（12 檔：symlink EPERM、含 `%`／`#`／`?` 檔名、備份建立、`hfIdPersist`、`undecodableAudioTrack`），乾淨 HEAD 對這 12 檔跑出同樣 23 項，名稱逐一相同，只在移植樹失敗＝0。
  - engine：2657 passed／3 failed／53 skipped；失敗為 `frameCapture-verifyArming.browser`（5000 ms 逾時）、`frameCapture-softwareWebGpu`、`parallelCoordinator-peerAbort`，三檔單獨重跑 15 passed／0 failed，乾淨 HEAD 單獨跑 `softwareWebGpu`、`peerAbort` 也通過，所以是整套並行負載的時序失敗；另有既有的 `audioMixer.undecodableTrack`，乾淨 HEAD 同樣失敗。
  - cli：整套兩次都在逾時前沒跑完（560 秒 3 workers、590 秒 8 workers，exit 124），屬 incomplete，不是綠燈；改跑本批觸及的目錄與檔案（`src/auth`、`src/cloud`、`src/ui` 與 `checkDeadline`、`craftAudit`、`publishProject`、`telemetry`、`render`、`check` 六個測試檔）：32 files、751 passed／2 failed／8 skipped，兩項失敗都是 `cloud/offload.undecodableTrack`（既有的 ffmpeg 無法解碼音軌，與 studio-server 的 `undecodableAudioTrack` 同族；乾淨樹執行該檔在載入階段就失敗，無法逐名比對）。
  - studio：整套逾時（560 秒）與觸及目錄 `src/components/editor`、`src/hooks`（280 秒）都沒跑完，incomplete；聚焦的 3 個測試檔 36 passed／0 failed。
  - producer：vitest 聚焦 `renderOrchestrator.pageNeverReady` 6 passed；bun lane 逐檔 `renderChunkFallback.test.ts` 17 pass／0 fail；gcp-cloud-run `server.test.ts` 28 pass／0 fail；aws-lambda snapshot 26 pass／0 fail。producer 整套 vitest 未跑（本批只改 `renderOrchestrator.ts`、`renderChunk.ts`、`captureStreamingStage.ts` 註解）。
- 沒有使用 `git apply --reject`，沒有執行 `tools/test_product.ps1 -Full`。暫時乾淨樹是 `git archive HEAD` 解到 scratchpad，驗證完先移除 junction 再刪除。

### 剩餘快照（水位 `555c788a3`，PR #7358）

2026-11-07 18:19:01（+0800）當時 `python tools/check_upstream_updates.py --strict` exit 0（fork HEAD `eea576869`，工作樹未提交，以寫入後的 `tools/upstream_baseline.json` 重跑）：commit 軸 `No new upstream commits`（baseline 與上游 tip `555c788a3` 相同）；PR 軸 `Triaged through #7358`、`No new items above that number`；issue 軸 `Triaged through #7340`、`No new items above that number`；monitored 126 筆，`Every pinned item is still at the head and state it was judged at`。這是該時點的結果：之後若上游再出現新 commit、新 PR 或釘選移動，strict 會再亮燈，屬下一輪範圍，不使本時點的結論失真。這是該時點的歷史快照，現行剩餘數字見本檔最新節。

## 2026-11-07：接續至 `7b1d9cceb`，審查 5 個 commit、4 筆 PR、1 筆 issue 與 2 筆釘選移動

以 fork `a89e88397`（工作樹未提交）為起點。起始 `python tools/check_upstream_updates.py --strict` exit 1（2026-11-07 21:42 +0800）：commit 軸 5 個（`555c788a3..7b1d9cceb`），PR #7358 以上 4 筆（#7359–#7362），issue #7340 以上 1 筆（#7363），126 筆釘選中 2 筆移動（#7347、#7357，都是合併）。最後一次 strict 之後才出現的項目不追，屬下一輪範圍。

方法同前一節：每個 commit 先 `git show --stat` 列出上游動到的全部檔案，逐檔 `git apply --check`（唯讀）；先只放測試檔跑出紅燈，再放來源轉綠；有衝突時用 `git apply --3way` 並在本節逐項處理。沒有 commit，沒有 `git apply --reject`。

### commit 軸

4 個採用、1 個不適用。fork 行號為採用後的工作樹。

| Commit | 裁決 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `f46a593a9` #7357 | 採用：大檔上傳後雲端回 409「仍在檢查」，原本只等約 5 秒就把整個匯出視為被拒，改為依檔案大小決定等待上限（`completeBudgetMs`），逾時訊息說明已上傳但雲端尚未檢查完。2 個檔案：`upload.ts` 乾淨套用；`uploadComplete.test.ts` 是新檔（本線沒有，直接加入），其 import 的 `completeWithRetry` 與 `HyperframesApiError` 在 fork 皆存在 | `f46a593a9:packages/cli/src/cloud/upload.ts`（`completeBudgetMs`、`completeWait`） | `packages/cli/src/cloud/upload.ts:397`（`completeWithRetry`）；`packages/cli/src/cloud/uploadComplete.test.ts` |
| `e206ff6bd` #7358 | 不適用、不採用：`chore: release v0.9.20`，22 個檔案皆為版本號、plugin manifest、`docs/changelog.mdx` 與 `releases/v0.9.20.md`；本線不發佈 npm、不改版本，沿用 #7270、#7290 的版號 PR 慣例 | `git show --stat e206ff6bd`：各 `package.json`、四份 plugin manifest、`releases/v0.9.20.md` | 不適用 |
| `e827de256` #7360 | 採用：Chrome 啟動 3 分鐘仍未就緒時，`check` 以具名的 `CheckChromeStartError` 結束並說明每個步驟花了多久，提示先跑 `hyperframes browser ensure`；`launch` 不再算在「deadline 之前」，啟動視窗改成獨立的 180 秒。4 個檔案：`checkDeadline.ts` 三方合併只衝突在 docblock，取上游較精確的用語（fork 的 `idleMs` 建構參數早已存在，所以「idle window」成立）；`docs/packages/cli.mdx` 乾淨。`checkDeadline.test.ts` 的 import 衝突：取 `CheckChromeStartError`，不取本線沒有的 `idleWindow`（#6705）；`check.test.ts` 衝突時帶回的「a check given a long --timeout…」依賴 `idleWindow`，已刪除，保留 Chrome 啟動那一項。上游把舊測試「browser provisioning does not spend the check budget…」改寫成「the Chrome start window is spent once…」，並把另一項的期望文字從 `starting Chrome 2.0 (before the deadline)` 改為 `starting Chrome 2.0`，兩者本線都採用 | `e827de256:packages/cli/src/utils/checkDeadline.ts`（`CHROME_START_WINDOW_MS`、`rearm`） | `packages/cli/src/utils/checkDeadline.ts:25`、`:66`、`:181`；`packages/cli/src/commands/check.test.ts:2389`；`packages/cli/src/utils/checkDeadline.test.ts:66`；`docs/packages/cli.mdx:1205` |
| `336abaa80` #7361 | 採用：呼叫端中止時，等雲端檔案檢查的迴圈立刻停止並拋出「Stopped waiting…」，不再睡到下一輪。接在 #7357 之後乾淨套用，2 個檔案 | `336abaa80:packages/cli/src/cloud/upload.ts` | `packages/cli/src/cloud/upload.ts:419-423`；`packages/cli/src/cloud/uploadComplete.test.ts:73`（上傳呼叫端已傳入 `opts.signal`，`upload.ts:469`） |
| `7b1d9cceb` #7347 | 採用（測試工具）：Safari 效能測試等不到播放時，錯誤訊息帶出「瀏覽器從沒開始載入」的影片檔名，並在錯誤中保留 `String(e)` 加堆疊。2 個檔案 `bench-page.js`、`run.ts` 乾淨套用；`videos()` 與 `until()` 在本線 `bench-page.js:22`、`:7` 皆存在，`node --check` 語法通過。這兩個檔案只在 Safari 的 CI 工作流跑（`.github/workflows/player-safari.yml`），本機沒有 Safari，無法執行 | `7b1d9cceb:packages/player/tests/perf/browsers/bench-page.js` | `packages/player/tests/perf/browsers/bench-page.js:119-128`；`run.ts:265` |

採用 commit 的上游作者（供 Co-authored-by）：Miguel Ángel（#7357、#7360、#7361、#7347 全部）。

CI 專用檔案判定：本輪 `git show --stat` 動到的檔案沒有 `*.browser.test.ts` 或 `*.chromium.test.ts`；上游沒跟著改、但 fork 有且會受影響的 CI 專用測試，這 5 個 commit 都不涉及（`player/tests/perf/browsers/*` 由 Safari 工作流跑，上面已判定）。

### 紅綠證據

| 套件 | 紅（只有測試檔） | 綠（含來源） | 名稱 |
| --- | --- | --- | --- |
| cli `uploadComplete.test.ts`（#7357） | 4 failed（`completeWithRetry is not a function`） | 4 passed | 預算內等待、逾時訊息、非 409 立刻停止等 |
| cli `uploadComplete.test.ts`（#7361） | 1 failed／4 passed | 5 passed（`src/cloud` 目錄 158 passed，2 failed 為既有 `offload.undecodableTrack`） | 「stops waiting when the caller aborts」 |
| cli `checkDeadline.test.ts`＋`check.test.ts`（#7360） | 3 failed／171 passed | 4 檔（加 `upload.test.ts`、`uploadComplete.test.ts`）200 passed | check「a Chrome that never becomes ready ends the whole check…」、checkDeadline「a Chrome that never becomes ready ends the check with a named error」與「an expired check names the phase…」 |

沒有紅綠證據的：#7347（Safari 效能測試工具，需要 Safari，本機只做語法檢查與 import 對照）；#7360 的「the Chrome start window is spent once…」與「video copies keep their own budget…」兩項在舊碼上本來就通過（它們固定的是新行為的邊界，不是舊行為的反例）。

### PR 軸

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7359](https://github.com/heygen-com/hyperframes/pull/7359) | 不釘（CLOSED，draft）：`chore: proof run for the v0.9.20 release gate`，24 個檔案是版號檔加上疊進來的 #7341 `init.ts`，作為 release gate 演練從沒合併，已關閉；沒有獨立的修正 | CLOSED；`gh pr view 7359` | 不適用；#7341 另行釘選 |
| [#7360](https://github.com/heygen-com/hyperframes/pull/7360) | MERGED（`e827de256`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7361](https://github.com/heygen-com/hyperframes/pull/7361) | MERGED（`336abaa80`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7362](https://github.com/heygen-com/hyperframes/pull/7362) | monitored（open，釘 head `331ce783e`，`REVIEW_REQUIRED`，作者 Miguel Ángel）：render 期間頁面的 `setTimeout`／`setInterval` 改走影片時間，在 seek 到達到期時間時依序觸發，回呼內的 `Date.now()`／`performance.now()` 讀到期時間；`__renderReady` 之前仍走牆鐘。本線缺口成立：`buildVirtualTimeShim` 只凍結 `Date`、`performance.now`、rAF，不處理計時器（`fileServer.ts:299` 只保留 `originalSetTimeout`）。7 個檔案：`fileServer.ts`、新測試 `fileServer-virtualTimers.test.ts`（本線不存在，新檔）、`tests/shard-schedule.json`，以及新的 golden 迴歸 `tests/timers-on-film-time/`（`meta.json`、`src/index.html`、`output/compiled.html`、`output/output.mp4`，後者是 LFS 物件）。改變確定性渲染的時間語意，PR 本文提到與 #6599 同改 `buildVirtualTimeShim`，尚未合併。重訪條件：合併後一組採用，golden 要連同 LFS pointer 一併採用並回報要上傳的 LFS 物件，對照本線 `fileServer.ts` 的 shim 與 #6599 的相對順序 | OPEN；`gh pr view 7362` 檔案清單 | `packages/producer/src/services/fileServer.ts:236`（`buildVirtualTimeShim`）、`:299`（`originalSetTimeout`）；`packages/producer/tests/shard-schedule.json` 存在；`fileServer-virtualTimers.test.ts` 不存在 |

### issue 軸

| issue | 裁決與理由 |
| --- | --- |
| [#7363](https://github.com/heygen-com/hyperframes/issues/7363) | 記錄、不動（OPEN，外部帳號，標題「global open sourse global」，本文空白）：沒有可執行的內容、沒有重現步驟，也不對應任何程式碼。重訪條件：作者補上具體描述後再判定 |

### 釘選移動（2 筆）

| 釘選 | 移動 | 裁決 |
| --- | --- | --- |
| #7347 | open（head `ac007894c`）→ merged（head `157d6e4a7`，`7b1d9cceb`） | 已解決：重讀新 head，檔案由 4 個縮為 2 個（`bench-page.js`、`run.ts`；`player-safari.yml` 與 `perf/server.ts` 不在合併版），採用，重釘 closed 並換新 head |
| #7357 | open → merged（`f46a593a9`，head 不變 `498dfa297`） | 已解決：採用，重釘 closed |

### 新釘選

#7362 一筆 open PR 新釘（head 見 `tools/upstream_baseline.json`）。#7359 已關閉且為演練 PR 不釘；#7360、#7361 已合併，隨 commit 軸採用。monitored 由 126 增為 127 筆；2 筆移動全部重釘（2 筆轉 closed），沒有釘選被移除。

### 預算、LFS 與延後

- 沒有 golden 或 LFS pointer 變更，需上傳的新 LFS 物件：無（#7362 的 `timers-on-film-time/output/output.mp4` 要等它合併後才採用，屆時才有 LFS 物件）。
- 5 個 commit 的 `git show --stat` 沒有 `scripts/package-size-budgets.json` 變動，沒有預算增量要帶。
- 沒有 `skills/` 變動，`skills-manifest.json` 不用重生。
- 維持延後：#7191、#7295／#7080、#6967／#7302（#7311 的前置）、#6912（#7309 的先決）、#7182、#7176、#7104／#7168 retry、#6716 的 17 檔遷移、#7134、#6897、#7246、#7247、#5708、#7345、#6725 在 `renderDiagnostic.ts` 的一行；本輪新採用的 commit 沒有依賴其中任何一項。

### 靜態閘門與驗證

- core runtime typecheck（`packages/core` 下 `node ../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.runtime.json`）exit 0（本輪不動 core，仍照規定跑）；`packages/cli` 的 `tsc --noEmit` 只剩 `check.test.ts` 的 3 個既有型別錯誤（`deadline` possibly undefined、`assertKnownFlags` 引數數量兩處，行號 2313、3903、3904），與前一節記載的乾淨 HEAD 錯誤相同。
- oxlint 對 7 個變更檔案 0 warning／0 error；`oxfmt --check` 全部格式正確。
- `fallow audit --base origin/main --fail-on-issues` exit 0（8 個變更檔案，dead code 0、complexity 0、duplication 0）。
- cli 測試（只跑觸及的 `src/utils`、`src/cloud` 與 `src/commands/check.test.ts`，不跑整套）：132 個檔案中 4 個有失敗，1906 項中 7 failed／1841 passed／58 skipped。7 項失敗全是既有的 Windows 環境失敗，乾淨 HEAD 的 `git archive` 樹（`node_modules` 以 junction 指向本樹）對這 4 個檔案同樣失敗：`offload.undecodableTrack`（2 項，乾淨樹在載入階段就失敗）、`optionalPackages`（2 項，symlink EPERM，名稱逐一相同）、`checkDeadline.process`（2 項，Chrome 30 秒啟動逾時，名稱逐一相同）；`staticProjectServer.charset.browser`（1 項）在本樹單獨重跑同樣是 `The browser did not finish starting within 30000 ms`，與 `checkDeadline.process` 同一個 Chrome 啟動逾時，乾淨樹因 junction 解不到 `@hyperframes/parsers/slideshow` 而載入失敗，無法逐名比對，該檔不碰本輪修改的任何檔案。只在移植樹失敗＝0（可比對的 6 項）。
- 沒有使用 `git apply --reject`，沒有執行 `tools/test_product.ps1 -Full`。暫時乾淨樹解到 scratchpad，驗證完先移除 junction 再刪除。

### 最新剩餘快照（水位 `7b1d9cceb`，PR #7362）

2026-11-07 22:01:24 至 22:02:41（+0800）`python tools/check_upstream_updates.py --strict` exit 0（fork HEAD `a89e88397`，工作樹未提交，以寫入後的 `tools/upstream_baseline.json` 重跑）：commit 軸 `No new upstream commits`（baseline 與上游 tip `7b1d9cceb` 相同，behind 0）；PR 軸 `Triaged through #7362`、`No new items above that number`；issue 軸 `Triaged through #7363`、`No new items above that number`；monitored 127 筆，`Every pinned item is still at the head and state it was judged at`。這是該時點的結果：之後若上游再出現新 commit、新 PR 或釘選移動，strict 會再亮燈，屬下一輪範圍，不使本時點的結論失真。現行剩餘數字只在此維護（以此時點為準）。


## 2026-11-08：接續至 `f5bde9533`

接續審查 `7b1d9cceb` 至 `f5bde9533` 之間新進之上游項目，包含 10 筆 commit、PR #7364–#7382、issue #7370–#7371，及 3 筆釘選移動（pr#7297、pr#7346、pr#7362）。

### Commit 軸

| Commit | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `896a77c30` #7297 | 採用：`hyperframes open` 在交出專案前先行關閉背景 preview（`endPreviewBeforeOpening`），更新 `preview` 與 `desktopApp` 提示，適配本 fork 保留既有 Bundle ID 慣例；更新範本 `AGENTS.md` 並跳過上游 `CLAUDE.md`（fork 硬規則）；重生 `skills-manifest.json` | `packages/cli/src/commands/open.ts:36`；`packages/cli/src/utils/desktopApp.ts:26` | `packages/cli/src/commands/open.ts:36`；`packages/cli/src/utils/desktopApp.ts:16`；`open.test.ts`、`desktopApp.test.ts` |
| `330be7cd2` #7365 | 採用：`layout-audit.browser.js` 於 `content_overlap` 的 `fixHint` 加入裝飾性元素可標註 `data-layout-ignore` | `packages/cli/src/commands/layout-audit.browser.js:1080` | `packages/cli/src/commands/layout-audit.browser.js:1064`；`layout-audit.browser.test.ts` |
| `a3b8f521d` #7364 | 採用：`layout-audit.browser.js` 中 `visibleTextClientRects` 支援 `mask-image`（linear/radial）、`clip-path: inset` 與 overflow 幾何裁剪，被遮罩或裁切的文字不再誤判重疊；更新 `docs/packages/cli.mdx` | `packages/cli/src/commands/layout-audit.browser.js:309`（mask 判斷在 `:565`） | `packages/cli/src/commands/layout-audit.browser.js:312`（mask 判斷在 `:553`）；`layout-audit.chromium.test.ts` |
| `9efbbdf5a` #7366 | 採用：`packages/cli/src/whisper/manager.ts` 支援 Windows Visual Studio 產物路徑 `bin/Release/whisper-cli.exe`、winget 指令，並透過 `@hyperframes/core/cache-dir` 讀取快取路徑，提供失敗診斷 | `packages/cli/src/whisper/manager.ts:31` | `packages/cli/src/whisper/manager.ts:31`；`manager.install.test.ts` |
| `59c2065d6` #7362 | 採用：渲染期間頁面計時器改走影片時間（`fileServer.ts` 中的 `buildVirtualTimeShim` 支援 film-time timers，seek 時在 `flushAnimationFrame` 前依序觸發 due timers；新增 `packages/core/src/runtime/wallClock.ts` 與 `wallClock.test.ts`；更新 core runtime 46 處 bare timers；更新 engine `types.ts`、`browserManager.ts`、`drawElementService.ts`、`frameCapture.ts`；新增 `pageTimers.test.ts`；套用 producer tests 與 LFS 物件） | `packages/producer/src/services/fileServer.ts:380`；`packages/core/src/runtime/wallClock.ts` | `packages/producer/src/services/fileServer.ts:375`；`packages/core/src/runtime/wallClock.ts`；`fileServer-virtualTimers.test.ts`、`wallClock.test.ts`、`pageTimers.test.ts` |
| `a595755a3` #7368 | 採用：`packages/core/src/runtime/media.ts` 針對 Safari 瀏覽器從未開始載入之影片（`readyState === HAVE_NOTHING && networkState === NETWORK_LOADING && !receivedBytes.has(el)`），在 5 秒後視為 `isUnplayable` 並提示 `the browser never started loading it`，更新 `media.test.ts` 與 `init.test.ts` | `packages/core/src/runtime/media.ts:277` | `packages/core/src/runtime/media.ts:253`；`media.test.ts`、`init.test.ts` |
| `b418bb24f` #7374 | 採用：`packages/cli/src/cloud/uploadPut.ts` 抽取與 `upload.ts` 重構，將 PUT 串流與重試邏輯模組化 | `packages/cli/src/cloud/uploadPut.ts:1` | `packages/cli/src/cloud/uploadPut.ts:1`；`upload.ts`、`upload.test.ts` |
| `14e598e5a` #7377 | 延後：`skills/media-use/audio/scripts/audio.mjs` 加入個人錄音為 voice line，因本 fork 保留固定語音與 ffmpeg 封裝管線，待後續整組語音技能重整時再適配 | `skills/media-use/audio/scripts/audio.mjs:127` | 不適用（延後） |
| `57a75337b` #7376 | 採用：`packages/cli/src/cloud/offload.ts` 限制超過上限之影片檔案在 re-encode 時透過 `-maxrate` 與 `-bufsize` 控制大小；新增 `offload.sizeLimit.test.ts` | `packages/cli/src/cloud/offload.ts:371` | `packages/cli/src/cloud/offload.ts:362`；`offload.sizeLimit.test.ts` |
| `f5bde9533` #7380 | 延後：`skills/media-use/audio/scripts/lib/voice-credit.mjs`，依賴 #7377 之 recording 結構，待後續整組語音技能重整時再適配 | `skills/media-use/audio/scripts/lib/voice-credit.mjs:1` | 不適用（延後） |

採用 commit 的上游作者（供 Co-authored-by）：Michael Wang（#7297）、Miguel Ángel（#7365、#7364、#7366、#7362、#7368、#7374、#7376）。

### 紅綠證據

| 套件 | 紅（只有測試檔） | 綠（含來源） | 名稱 |
| --- | --- | --- | --- |
| cli `open.test.ts`＋`desktopApp.test.ts`（#7297） | 7 failed（`endPreviewBeforeOpening is not a function`）＋2 failed（`previewStopCommandFor is not a function`） | 7 passed＋35 passed（1 skipped） | `hyperframes open` 關閉預覽與提示文字 |
| cli `layout-audit.browser.test.ts`（#7365） | 1 failed（未包含 `data-layout-ignore`） | 1 passed（218 skipped） | `content_overlap` 裝飾標註提示 |
| cli `layout-audit.chromium.test.ts`（#7364） | 5 failed／4 passed（遮罩與裁剪案例誤判 overlap） | 9 passed（63 skipped） | 遮罩與 inset 裁剪不計重疊 |
| cli `manager.install.test.ts`（#7366） | 3 failed（缺少原因、winget 指令、未找到 Release 路徑） | 4 passed | whisper 安裝與診斷提示 |
| producer `fileServer-virtualTimers.test.ts`（#7362） | 5 failed／3 passed（timer 未依影片時間推進） | 8 passed | 虛擬時間計時器排程 |
| core `wallClock.test.ts`（#7362） | 1 failed／1 passed（抓出 46 個 bare timer offenders） | 2 passed | runtime 牆鐘計時器轉換 |
| engine `pageTimers.test.ts`（#7362） | 1 failed／1 passed（抓出 7 個 bare timer offenders） | 2 passed | engine 注入頁面之計時器守衛 |
| core `media.test.ts`（#7368） | 1 failed／179 skipped（未判定未載入影片） | 1 passed／179 skipped | 未開始載入之影片跳過保護 |
| core `init.test.ts`（#7368） | 1 failed／265 skipped | 1 passed／265 skipped | 未開始載入影片前進保護 |
| cli `offload.sizeLimit.test.ts`（#7376） | 6 failed（舊碼無 `sizeLimitArgs`／`limitFor` 函式） | 6 passed | 重新編碼大小上限限制 |

### PR 軸

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7364](https://github.com/heygen-com/hyperframes/pull/7364) | MERGED（`a3b8f521d`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7365](https://github.com/heygen-com/hyperframes/pull/7365) | MERGED（`330be7cd2`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7366](https://github.com/heygen-com/hyperframes/pull/7366) | MERGED（`9efbbdf5a`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7367](https://github.com/heygen-com/hyperframes/pull/7367) | monitored（open，釘 head `281efa2db`）：`Feat/deploy worker workflow`，工作流改動，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7368](https://github.com/heygen-com/hyperframes/pull/7368) | MERGED（`a595755a3`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7369](https://github.com/heygen-com/hyperframes/pull/7369) | monitored（open，釘 head `727d08e5d`）：`fix(check): lint and check skip compositions the project never mounts`，合併後採用 | OPEN | `tools/upstream_baseline.json` |
| [#7372](https://github.com/heygen-com/hyperframes/pull/7372) | monitored（open，釘 head `78bc9c15c`）：`fix(media-use): forward --language to the CLI in transcribe.mjs`，對應 issue #7371，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7373](https://github.com/heygen-com/hyperframes/pull/7373) | monitored（open，釘 head `ad02236b7`）：`fix(core): preview playback moves every frame between an audio track's time updates`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7374](https://github.com/heygen-com/hyperframes/pull/7374) | MERGED（`b418bb24f`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7375](https://github.com/heygen-com/hyperframes/pull/7375) | monitored（open，釘 head `8249651ad`）：`feat(cli): cloud uploads send a big file in parts, so a cut connection resends one part`，依賴 #7374 模組化，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7376](https://github.com/heygen-com/hyperframes/pull/7376) | MERGED（`57a75337b`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7377](https://github.com/heygen-com/hyperframes/pull/7377) | MERGED（`14e598e5a`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7378](https://github.com/heygen-com/hyperframes/pull/7378) | monitored（open，釘 head `4ffd6759d`）：`fix(core): retain complete preview pictures during native seeks`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7379](https://github.com/heygen-com/hyperframes/pull/7379) | monitored（open，釘 head `faa7546b6`）：`feat(studio): scrub full-quality video with decoded preview frames`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7380](https://github.com/heygen-com/hyperframes/pull/7380) | MERGED（`f5bde9533`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7381](https://github.com/heygen-com/hyperframes/pull/7381) | monitored（open，釘 head `aa5f2ed8e`）：`fix(cli): a media file referenced by its filesystem path goes into the cloud archive`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7382](https://github.com/heygen-com/hyperframes/pull/7382) | monitored（open，釘 head `dbf66cc22`）：`perf(producer): size a long video's chunks in one plan, no re-plan`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |

### issue 軸

| issue | 裁決與理由 |
| --- | --- |
| [#7370](https://github.com/heygen-com/hyperframes/issues/7370) | 記錄、不動（OPEN）：多 worker 重複靜態幀去重校驗之效能議題，無對應 PR，記錄追蹤 |
| [#7371](https://github.com/heygen-com/hyperframes/issues/7371) | 記錄、不動（OPEN）：`transcribe.mjs` 缺少 `--language` 參數，已由 open PR #7372 追蹤 |

### 釘選移動（3 筆）

| 釘選 | 移動 | 裁決 |
| --- | --- | --- |
| #7297 | open（head `dbe63cb7e`）→ merged（head `4575445a2`，`896a77c30`） | 已解決：採用，重釘 closed |
| #7346 | open（head `1aae19aef`）→ closed（作者關閉未合併） | 已解決：重釘 closed |
| #7362 | open（head `331ce783e`）→ merged（head `b6c2bfadf`，`59c2065d6`） | 已解決：採用，重釘 closed |

### 新釘選

新增 9 筆 open PR 釘選：#7367、#7369、#7372、#7373、#7375、#7378、#7379、#7381、#7382（head 見 `tools/upstream_baseline.json`）。monitored 總數由 127 增為 136 筆。

### 預算、LFS 與延後

- LFS 物件：#7362 引入 `packages/producer/tests/timers-on-film-time/output/compiled.html`（oid sha256: `1d552586958450872949cc4a0c7447fe77351f848c6ab9eb29f7c8d7cc39e130`，3196 bytes）與 `output/output.mp4`（oid sha256: `98e1c940acca15aec1581c146d8f48e00cf65735233671bf1fc22f1075f81e76`，8191 bytes）。
- `scripts/package-size-budgets.json` 無變動。
- `skills-manifest.json` 已因 #7297 重生（`hyperframes-cli` hash: `1b3a53755befbab2`）。
- 維持延後：#7377、#7380（media-use 錄音與 voice credit）以及既有延後項目。

### 最新剩餘快照（水位 `f5bde9533`，PR #7382，issue #7371）

2026-11-08 `python tools/check_upstream_updates.py --strict` exit 0：commit 軸 `No new upstream commits`（behind 0）；PR 軸 `Triaged through #7382`、`No new items above that number`；issue 軸 `Triaged through #7371`、`No new items above that number`；monitored 136 筆，`Every pinned item is still at the head and state it was judged at`。


## 2026-11-08：接續至 `12906e0bf`

以 fork `3de999d22` 為起點接續審查。接續審查 `f5bde9533` 至 `12906e0bf` 之間新進之上游項目，包含 22 筆 commit、PR #7383–#7403、issue #7404，及 13 筆釘選移動（pr#6732、pr#7119、pr#7159、pr#7249、pr#7321、pr#7349、pr#7369、pr#7373、pr#7375、pr#7378、pr#7379、pr#7381、pr#7382）。

### Commit 軸

| Commit | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `3d7f12acd` #7375 | 採用：雲端上傳超過 `PARTS_ABOVE_BYTES` 的檔案改分片送，斷線只重傳失敗分片（新增 `uploadParts.ts`，`upload.ts` 呼叫 `uploadParts(`）。`_gen/types.ts` 只帶分片所需型別（本線 45 行，上游 67 行另含 `GptImage26Request`、`GptImage26FlareRequest` 與 `ImageCreateRequest` 聯集；本線 generated types 沒有圖片生成型別，不補，取捨見 DECISIONS） | `packages/cli/src/cloud/upload.ts:320`；`packages/cli/src/cloud/uploadParts.ts:87` | `packages/cli/src/cloud/upload.ts:320`；`packages/cli/src/cloud/uploadParts.ts:87`；`uploadParts.test.ts` |
| `c27475b97` #7382 | 採用（本次移植，先紅後綠，見紅綠證據）：`resolveChunkPlan` 新增 `minParallelChunks` 下限，長影片依 `targetChunkFrames` 加 chunk、短影片保留下限 fan-out；`renderRequest.ts` 與 `renderConfigValidation.ts` 同步接欄位 | `packages/producer/src/services/distributed/plan.ts:777`；`packages/producer/src/renderRequest.ts:35`；`packages/producer/src/services/distributed/renderConfigValidation.ts:225` | `packages/producer/src/services/distributed/plan.ts:770`；`packages/producer/src/renderRequest.ts:35`；`packages/producer/src/services/distributed/renderConfigValidation.ts:225`；`plan.test.ts`、`renderConfigValidation.test.ts`、`renderRequest.test.ts` |
| `b559a98d3` #7349 | 採用：`readKeyframeTransfers` 在 stderr 串流時只收含 `transfer_characteristics` 的行，header SEI 很大的 HLG 影片不再因 stderr 尾端被擠掉而漏判，色調映射維持 HLG 白色參考（`npl=203`） | `packages/engine/src/services/videoFrameExtractor.ts:958`；`videoFrameExtractor.test.ts:4082` | `packages/engine/src/services/videoFrameExtractor.ts:912`；`videoFrameExtractor.test.ts:4063` |
| `7b79ab429` #7369 | 採用：`lint`／`check` 跳過專案 `index.html` 沒掛載的 composition，`--include-unmounted` 可加回；更新 `docs/packages/cli.mdx`。`mountedSources` 是 #6827 `bf4717893` 已有的輔助函式，#6827 本身仍延後，本線只帶這個函式（見 DECISIONS） | `packages/lint/src/project.ts:96` 與 `:309`；`packages/cli/src/utils/checkPipeline.ts:35` 與 `:1698` | `packages/lint/src/project.ts:94` 與 `:291`；`packages/cli/src/utils/checkPipeline.ts:33` 與 `:1693`；`project.test.ts`、`lintProject.test.ts`、`lint.test.ts` |
| `e0c11bf09` #7381 | 採用：以檔案系統絕對路徑引用的媒體資源正確打包進雲端 archive（`filesystemPath` 判斷） | `packages/cli/src/utils/publishProject.ts:470` | `packages/cli/src/utils/publishProject.ts:471`；`publishProject.absolutePath.test.ts` |
| `841e90ffe` #7383 | 採用：還原 #7265 的一秒隱藏 pre-roll，Safari 影片畫面回到剪切點上；以 `videoStartLatency` 學習啟動延遲取代，刪除 `mediaSteer.ts` 內不再使用的程式碼 | `packages/core/src/runtime/media.ts:453` | `packages/core/src/runtime/media.ts:372`；`media.test.ts`、`media.preseek.test.ts`、`init.videoPreseek.test.ts` |
| `942893eb2` #7373 | 採用：預覽播放時，音訊軌的 `currentTime` 兩次更新之間，時鐘仍每個顯示 frame 往前走（`_betweenUpdates`、`aheadOf`）。本線不含 #7067 `3eead5432` 的起步 hold（該 commit 維持延後，見 DECISIONS）：`clock.ts` 本線 61/1，上游 60/2，差在本線保留 `_heldTimeWhenBehind` 分支 | `packages/core/src/runtime/clock.ts:135`；`packages/core/src/runtime/init.ts:3829` | `packages/core/src/runtime/clock.ts:130`；`packages/core/src/runtime/init.ts:3697`；`clock.test.ts`、`clock.steer.test.ts` |
| `a0bbaab43` #7385 | 不適用：上游 v0.9.21 版本發布與 changelog | `.codex-plugin/plugin.json:4` | 不適用（版本號變更） |
| `34118d8f2` #7384 | 採用（本次移植，先紅後綠，見紅綠證據）：`chunkFrames.injectorBudget.test.ts` 不再用 `mock.module` 取代整個 engine 模組，改換 `chunkFrameInjectorDependencies`，測試後還原 | `packages/producer/src/services/distributed/chunkFrames.ts:52` | `packages/producer/src/services/distributed/chunkFrames.ts:52`；`chunkFrames.injectorBudget.test.ts:31` |
| `b87a01f6a` #7378 | 採用：原生 seek 期間保留完整預覽畫面（新增 `previewSeek.ts`，`init.ts` 接線）；更新 `docs/packages/player.mdx` | `packages/core/src/runtime/previewSeek.ts:70`；`packages/core/src/runtime/init.ts:4971` | `packages/core/src/runtime/previewSeek.ts:70`；`packages/core/src/runtime/init.ts:4780`；`init.previewSeek.test.ts`、`colorGrading.test.ts`、`entry.test.ts` |
| `b7157bdab` #7379 | 延後：57 檔、+4474／−153 的 Studio 預覽重構（新增 `pausedVideoDecoder.ts` 428 行等）；`git apply --check` 對本線失敗於 `init.ts:29`、`window.d.ts:11`。待整組 Studio 預覽改版時再評估 | `packages/studio/src/player/lib/pausedVideoDecoder.ts`（新檔） | 延後；本線沒有 `packages/studio/src/player/lib/pausedVideoProvider.ts` |
| `fed14b016` #7390 | 採用（本次移植，先紅後綠，見紅綠證據）：虛擬時間 shim 的 `seekToTime` 在首格不在 0 的 worker 上先播第 0 格，讓頁面計時器維持單 worker 渲染的排程 | `packages/producer/src/services/fileServer.ts:437` | `packages/producer/src/services/fileServer.ts:432`；`fileServer-virtualTimers.test.ts:92` |
| `26956ea1f` #7392 | 不適用：上游 v0.9.22 版本發布與 changelog | `.codex-plugin/plugin.json:4` | 不適用（版本號變更） |
| `fd05a3860` #7159 | 延後：改 `playbackHealth.ts`、`init.ts`、`types.ts` 與 Studio `previewQualitySlice.ts`（8 檔）；`git apply --check` 失敗於 `init.ts:26`，且本線沒有 `init.buffering.test.ts` | `packages/core/src/runtime/playbackHealth.ts` | 延後；本線沒有 `packages/core/src/runtime/init.buffering.test.ts` |
| `3151fd213` #7393 | 延後：16 檔、+1256／−33，建立在 #7379 的 `pausedVideoDecoder.ts` 上；`git apply --check` 失敗於 `.github/workflows/ci.yml:1009`。隨 #7379 一併重訪 | `packages/studio/src/player/lib/pausedVideoDecoder.ts` | 延後（隨 #7379） |
| `adf14d732` #7394 | 採用：CDN 腳本載入失敗的回報帶函式庫名稱與版本，不暴露完整 URL | `packages/engine/src/services/frameCapture.ts:2928` | `packages/engine/src/services/frameCapture.ts:2881`；`frameCapture-scriptLoadCause.test.ts` |
| `ab785e9c5` #7395 | 採用：選單列高亮圓角改為 `rounded-[calc(var(--radius-lg)+6px)]` | `packages/studio/src/components/ui/Menu.tsx:75` | `packages/studio/src/components/ui/Menu.tsx:75`；`Menu.test.tsx` |
| `0f5914dc4` #7119 | 採用：只新增測試，驗證背景解碼逾時的警告送達所有呼叫端（沒有來源變更，所以沒有紅燈階段） | `packages/engine/src/services/frameCapture-decodeTimeoutCallers.test.ts:120` | `packages/engine/src/services/frameCapture-decodeTimeoutCallers.test.ts:120` |
| `75fe18c62` #7397 | 採用：tween 之前寫入的 set 不再抹除 tween 的終點值（新增 `gsapAuthoredOrder.ts`） | `packages/core/src/runtime/adapters/gsap.ts:2`；`packages/core/src/runtime/adapters/gsapAuthoredOrder.ts:13` | `packages/core/src/runtime/adapters/gsap.ts:2`；`packages/core/src/runtime/adapters/gsapAuthoredOrder.ts:13`；`gsap.order.test.ts`、`init.authoredOrder.test.ts` |
| `7ad2be96e` #7399 | 不適用：上游 v0.9.23 版本發布與 changelog | `.codex-plugin/plugin.json:4` | 不適用（版本號變更） |
| `074de9dd1` #7401 | 不適用：CI Linux 安裝 ffmpeg 行動變更（`.github/actions/install-ffmpeg-linux/action.yml`） | `.github/actions/install-ffmpeg-linux/action.yml:1` | 不適用（CI 專用） |
| `12906e0bf` #7402 | 採用：hidden capture 頁面只載入螢幕上的 clip，seek 離開的 clip 即刻釋放（`capturePageIn`、`loadsAhead`） | `packages/core/src/studioPreviewMark.ts:20`；`packages/core/src/runtime/init.ts:3007`；`packages/core/src/runtime/timedClipHide.ts:77` | `packages/core/src/studioPreviewMark.ts:4`；`packages/core/src/runtime/init.ts:2936`；`packages/core/src/runtime/timedClipHide.ts:76`；`entry.test.ts` |



### Commit 逐檔 numstat（`git diff --numstat <c>^1 <c>` 實算）

```text
=== 3d7f12acd ===
49	0	packages/cli/src/cloud/_gen/client.ts
67	1	packages/cli/src/cloud/_gen/types.ts
134	26	packages/cli/src/cloud/upload.ts
282	0	packages/cli/src/cloud/uploadParts.test.ts
183	0	packages/cli/src/cloud/uploadParts.ts
20	7	packages/cli/src/cloud/uploadPut.ts

=== c27475b97 ===
2	0	packages/producer/src/renderRequest.test.ts
4	0	packages/producer/src/renderRequest.ts
28	0	packages/producer/src/services/distributed/plan.test.ts
13	5	packages/producer/src/services/distributed/plan.ts
13	0	packages/producer/src/services/distributed/renderConfigValidation.test.ts
15	0	packages/producer/src/services/distributed/renderConfigValidation.ts

=== b559a98d3 ===
36	0	packages/engine/src/services/videoFrameExtractor.test.ts
12	3	packages/engine/src/services/videoFrameExtractor.ts

=== 7b79ab429 ===
7	0	docs/packages/cli.mdx
6	0	packages/cli/src/commands/check.ts
39	0	packages/cli/src/commands/lint.test.ts
10	0	packages/cli/src/commands/lint.ts
8	3	packages/cli/src/utils/checkPipeline.ts
3	2	packages/cli/src/utils/checkTypes.ts
33	13	packages/cli/src/utils/lintProject.test.ts
1	1	packages/cli/src/utils/lintProject.ts
2	2	packages/lint/src/index.ts
68	5	packages/lint/src/project.test.ts
39	15	packages/lint/src/project.ts
1	1	packages/lint/src/projectShaders.test.ts
1	1	packages/lint/src/snippetFragment.test.ts

=== e0c11bf09 ===
63	0	packages/cli/src/utils/publishProject.absolutePath.test.ts
32	14	packages/cli/src/utils/publishProject.ts

=== 841e90ffe ===
1	2	packages/core/src/runtime/init.videoPreseek.test.ts
2	8	packages/core/src/runtime/media.preseek.test.ts
99	85	packages/core/src/runtime/media.test.ts
39	26	packages/core/src/runtime/media.ts
0	14	packages/core/src/runtime/mediaSteer.test.ts
0	11	packages/core/src/runtime/mediaSteer.ts
1	1	scripts/package-size-budgets.json

=== 942893eb2 ===
108	0	packages/core/src/runtime/clock.steer.test.ts
57	0	packages/core/src/runtime/clock.test.ts
60	2	packages/core/src/runtime/clock.ts
1	0	packages/core/src/runtime/init.ts
2	1	packages/core/src/runtime/media.ts

=== a0bbaab43 ===
1	1	.claude-plugin/plugin.json
1	1	.codex-plugin/plugin.json
1	1	.cursor-plugin/plugin.json
41	0	docs/changelog.mdx
1	1	gemini-extension.json
1	1	packages/aws-lambda/package.json
1	1	packages/cli/package.json
1	1	packages/core/package.json
1	1	packages/engine/package.json
1	1	packages/gcp-cloud-run/package.json
1	1	packages/inspector/package.json
1	1	packages/lint/package.json
1	1	packages/parsers/package.json
1	1	packages/player/package.json
1	1	packages/producer/package.json
1	1	packages/sdk/package.json
1	1	packages/shader-transitions/package.json
1	1	packages/share/package.json
1	1	packages/studio-server/package.json
1	1	packages/studio/package.json
1	1	plugin.json
40	0	releases/v0.9.21.md

=== 34118d8f2 ===
26	17	packages/producer/src/services/distributed/chunkFrames.injectorBudget.test.ts
4	2	packages/producer/src/services/distributed/chunkFrames.ts

=== b87a01f6a ===
6	0	docs/packages/player.mdx
21	0	packages/core/src/runtime/colorGrading.test.ts
2	0	packages/core/src/runtime/colorGrading.ts
31	0	packages/core/src/runtime/entry.test.ts
283	0	packages/core/src/runtime/init.previewSeek.test.ts
38	1	packages/core/src/runtime/init.swapScenes.test.ts
109	17	packages/core/src/runtime/init.ts
198	0	packages/core/src/runtime/previewSeek.ts
1	0	packages/core/src/studioPreviewMark.ts

=== b7157bdab ===
2	2	bun.lock
25	0	docs/packages/studio.mdx
8	0	packages/core/src/compiler/htmlDocument.test.ts
2	2	packages/core/src/compiler/htmlDocument.ts
5	0	packages/core/src/index.ts
2	0	packages/core/src/previewProxyBox.ts
238	0	packages/core/src/runtime/adapters/video-texture-compat.paused.test.ts
46	2	packages/core/src/runtime/adapters/video-texture-compat.ts
4	1	packages/core/src/runtime/colorGrading.ts
2	0	packages/core/src/runtime/entry.test.ts
2	0	packages/core/src/runtime/entry.ts
620	0	packages/core/src/runtime/init.previewSeek.test.ts
2	0	packages/core/src/runtime/init.swapScenes.test.ts
208	28	packages/core/src/runtime/init.ts
5	0	packages/core/src/runtime/media.ts
329	0	packages/core/src/runtime/pausedVideoCallbacks.test.ts
171	0	packages/core/src/runtime/pausedVideoCallbacks.ts
256	0	packages/core/src/runtime/pausedVideoFrames.test.ts
423	0	packages/core/src/runtime/pausedVideoFrames.ts
11	0	packages/core/src/runtime/picker.test.ts
3	1	packages/core/src/runtime/picker.ts
1	1	packages/core/src/runtime/player.ts
226	0	packages/core/src/runtime/previewSeek.frames.test.ts
281	84	packages/core/src/runtime/previewSeek.ts
1	1	packages/core/src/runtime/types.ts
2	0	packages/core/src/runtime/window.d.ts
6	0	packages/core/src/studioPreviewMark.ts
14	0	packages/studio-server/src/helpers/mediaMetadata.test.ts
17	1	packages/studio-server/src/helpers/mediaMetadata.ts
8	4	packages/studio-server/src/helpers/mediaProxyPreview.test.ts
2	2	packages/studio-server/src/helpers/mediaProxyPreview.ts
83	0	packages/studio-server/src/routes/preview.test.ts
3	3	packages/studio-server/src/routes/preview.ts
1	1	packages/studio/package.json
75	0	packages/studio/src/components/editor/domEditingDom.preview.test.ts
19	2	packages/studio/src/components/editor/domEditingDom.ts
4	1	packages/studio/src/components/nle/NLEContext.tsx
13	0	packages/studio/src/hooks/useElementPicker.test.ts
3	2	packages/studio/src/hooks/useElementPicker.ts
1	1	packages/studio/src/player/components/PlayerControls.test.tsx
1	1	packages/studio/src/player/components/PlayerControls.tsx
42	0	packages/studio/src/player/components/PreviewSeekBar.test.tsx
20	3	packages/studio/src/player/components/PreviewSeekBar.tsx
1	1	packages/studio/src/player/hooks/usePlaybackKeyboard.test.ts
2	1	packages/studio/src/player/hooks/usePlaybackKeyboard.ts
3	1	packages/studio/src/player/hooks/useTimelinePlayer.ts
3	4	packages/studio/src/player/lib/mediaFetch.test.ts
644	0	packages/studio/src/player/lib/pausedVideoDecoder.test.ts
428	0	packages/studio/src/player/lib/pausedVideoDecoder.ts
53	0	packages/studio/src/player/lib/pausedVideoProvider.test.ts
54	0	packages/studio/src/player/lib/pausedVideoProvider.ts
8	2	packages/studio/src/player/lib/playbackTypes.ts
38	0	packages/studio/src/player/lib/previewVideoTime.test.ts
39	0	packages/studio/src/player/lib/previewVideoTime.ts
11	0	packages/studio/src/utils/authoredSource.test.ts
2	0	packages/studio/src/utils/authoredSource.ts
1	1	scripts/package-size-budgets.json

=== fed14b016 ===
10	0	packages/producer/src/services/fileServer-virtualTimers.test.ts
16	9	packages/producer/src/services/fileServer.ts

=== 26956ea1f ===
1	1	.claude-plugin/plugin.json
1	1	.codex-plugin/plugin.json
1	1	.cursor-plugin/plugin.json
23	0	docs/changelog.mdx
1	1	gemini-extension.json
1	1	packages/aws-lambda/package.json
1	1	packages/cli/package.json
1	1	packages/core/package.json
1	1	packages/engine/package.json
1	1	packages/gcp-cloud-run/package.json
1	1	packages/inspector/package.json
1	1	packages/lint/package.json
1	1	packages/parsers/package.json
1	1	packages/player/package.json
1	1	packages/producer/package.json
1	1	packages/sdk/package.json
1	1	packages/shader-transitions/package.json
1	1	packages/share/package.json
1	1	packages/studio-server/package.json
1	1	packages/studio/package.json
1	1	plugin.json
22	0	releases/v0.9.22.md

=== fd05a3860 ===
1	1	packages/core/src/index.ts
3	2	packages/core/src/runtime/init.buffering.test.ts
16	7	packages/core/src/runtime/init.ts
47	0	packages/core/src/runtime/playbackHealth.test.ts
36	2	packages/core/src/runtime/playbackHealth.ts
10	0	packages/core/src/runtime/types.ts
27	0	packages/studio/src/player/store/previewQualitySlice.test.ts
12	0	packages/studio/src/player/store/previewQualitySlice.ts

=== 3151fd213 ===
10	1	.github/workflows/ci.yml
5	3	docs/packages/studio.mdx
119	11	packages/core/src/runtime/init.previewSeek.test.ts
13	5	packages/core/src/runtime/init.ts
22	0	packages/core/src/runtime/pausedVideoCallbacks.test.ts
13	0	packages/core/src/runtime/pausedVideoFrames.test.ts
13	0	packages/core/src/runtime/previewSeek.frames.test.ts
74	1	packages/studio/src/player/lib/pausedVideoDecoder.test.ts
23	12	packages/studio/src/player/lib/pausedVideoDecoder.ts
1	0	packages/studio/tests/e2e/fixtures/preview-video-regression/.gitignore
164	0	packages/studio/tests/e2e/fixtures/preview-video-regression/generate.mjs
9	0	packages/studio/tests/e2e/fixtures/preview-video-regression/hyperframes.json
134	0	packages/studio/tests/e2e/fixtures/preview-video-regression/index.html
64	0	packages/studio/tests/e2e/preview-video-capture-witness.mjs
143	0	packages/studio/tests/e2e/preview-video-picture.mjs
449	0	packages/studio/tests/e2e/preview-video-regression.mjs

=== adf14d732 ===
31	1	packages/engine/src/services/frameCapture-scriptLoadCause.test.ts
25	2	packages/engine/src/services/frameCapture.ts

=== ab785e9c5 ===
8	0	packages/studio/src/components/ui/Menu.test.tsx
1	1	packages/studio/src/components/ui/Menu.tsx

=== 0f5914dc4 ===
181	0	packages/engine/src/services/frameCapture-decodeTimeoutCallers.test.ts

=== 75fe18c62 ===
80	1	packages/core/src/runtime/adapters/gsap.order.test.ts
14	3	packages/core/src/runtime/adapters/gsap.ts
40	0	packages/core/src/runtime/adapters/gsapAuthoredOrder.ts
16	0	packages/core/src/runtime/init.authoredOrder.test.ts
7	3	packages/core/src/runtime/init.ts

=== 7ad2be96e ===
1	1	.claude-plugin/plugin.json
1	1	.codex-plugin/plugin.json
1	1	.cursor-plugin/plugin.json
25	0	docs/changelog.mdx
1	1	gemini-extension.json
1	1	packages/aws-lambda/package.json
1	1	packages/cli/package.json
1	1	packages/core/package.json
1	1	packages/engine/package.json
1	1	packages/gcp-cloud-run/package.json
1	1	packages/inspector/package.json
1	1	packages/lint/package.json
1	1	packages/parsers/package.json
1	1	packages/player/package.json
1	1	packages/producer/package.json
1	1	packages/sdk/package.json
1	1	packages/shader-transitions/package.json
1	1	packages/share/package.json
1	1	packages/studio-server/package.json
1	1	packages/studio/package.json
1	1	plugin.json
24	0	releases/v0.9.23.md

=== 074de9dd1 ===
29	5	.github/actions/install-ffmpeg-linux/action.yml
6	0	.github/workflows/ci.yml

=== 12906e0bf ===
17	0	packages/core/src/runtime/entry.test.ts
8	5	packages/core/src/runtime/init.ts
3	4	packages/core/src/runtime/timedClipHide.ts
6	0	packages/core/src/studioPreviewMark.ts
```

採用 commit 的上游作者（供 Co-authored-by）：Miguel Ángel（#7375、#7382、#7349、#7369、#7381、#7383、#7373、#7384、#7390、#7394、#7395、#7119、#7397、#7402）、James Russo（#7378）。

### 紅綠證據

紅＝把該組的來源檔還原成 fork HEAD 的版本（`git show HEAD:<path>`，新檔直接移除），測試檔維持移植後的版本，再跑同一批測試；綠＝來源與測試都在移植後的狀態。所有測試以 BelowNormal 優先權執行，數字是本次實際指令輸出的摘要。producer 三個 commit 逐個先放測試紅、再放來源綠；其餘各組的紅燈是同一組來源一起還原的合計，所以一個測試檔的失敗數可能含相鄰 commit 的測試（表內註明）。

| 套件 | 紅（來源還原為 fork HEAD） | 綠 | 名稱 |
| --- | --- | --- | --- |
| cli `uploadParts.test.ts`（#7375） | 5 failed | cli 組 5 檔合計 167 passed／0 failed | 大檔案分片上傳與斷線只重送失敗分片 |
| producer `plan.test.ts`＋`renderConfigValidation.test.ts`＋`renderRequest.test.ts`（#7382） | 僅放測試：7 failed／96 passed；其中 4 例是 #7382 新增（`resolveChunkPlan` 兩例、`minParallelChunks` 驗證一例、`renderRequest` round-trip 一例），另 3 例 `stitched mp4 plans` 是既有失敗（FFmpeg 找不到） | 放入來源：100 passed／3 failed，只剩那 3 例既有失敗 | 長影片依幀預算加 chunk、短影片保留下限 fan-out |
| engine `videoFrameExtractor.test.ts`（#7349） | 1 failed（HLG 來源遇大型 header SEI 時以 HLG 白色參考色調映射） | engine 組 3 檔合計 242 passed／2 skipped／0 failed | 大型 header SEI 的 HLG 影片 |
| lint `project.test.ts`（#7369）＋cli `lint.test.ts` | lint 4 failed；cli `lint.test.ts` 2 failed | lint 組 4 檔合計 403 passed／1 skipped／0 failed；cli 組 167 passed | check 與 lint 跳過未掛載 composition |
| cli `publishProject.absolutePath.test.ts`（#7381） | 2 failed | cli 組 167 passed | 絕對路徑引用的媒體進入雲端封包 |
| core `media.test.ts`＋`media.preseek.test.ts`＋`init.videoPreseek.test.ts`（#7383） | 13 failed／1 failed／1 failed（`media.test.ts` 的 13 例含 #7412 與 #7442 各 2 例） | core 組 12 檔合計 616 passed／0 failed | Safari 影片回到剪切點、以學習的啟動延遲取代 pre-roll |
| core `clock.test.ts`＋`clock.steer.test.ts`（#7373） | 1 failed＋1 failed | core 組 616 passed | 預覽音訊更新間隔內每個顯示 frame 都前進 |
| producer `chunkFrames.injectorBudget.test.ts`（#7384） | 僅放測試：`SyntaxError: Export named 'chunkFrameInjectorDependencies' not found`（0 pass／1 fail／1 error） | 放入來源：2 passed／0 failed | injector 測試不再取代整個 engine 模組 |
| core `init.previewSeek.test.ts`＋`colorGrading.test.ts`＋`entry.test.ts`＋`init.swapScenes.test.ts`（#7378） | 6 failed＋1 failed＋1 failed＋1 failed（`entry.test.ts` 另有 1 例屬 #7402） | core 組 616 passed | 原生 seek 期間保留完整預覽畫面 |
| producer `fileServer-virtualTimers.test.ts`（#7390） | 僅放測試：8 passed／1 failed（首格不在 0 的 worker 計時器排程） | 放入來源：`fileServer-virtualTimers.test.ts`＋`fileServer-seededRandom.test.ts` 19 passed／0 failed | 任意 worker 數下計時器維持影片排程 |
| engine `frameCapture-scriptLoadCause.test.ts`（#7394） | 4 failed（三個函式庫名稱分類＋失敗警告括號） | engine 組 242 passed／2 skipped | CDN 腳本失敗報告函式庫名稱與版本 |
| studio `Menu.test.tsx`（#7395） | 1 failed（列高亮圓角大於面板） | studio 1 檔 16 passed／0 failed | 選單列高亮圓角 |
| engine `frameCapture-decodeTimeoutCallers.test.ts`（#7119） | 無（只新增測試，沒有來源變更） | engine 組 242 passed／2 skipped | 解碼逾時警告送達所有呼叫端 |
| core `gsap.order.test.ts`＋`init.authoredOrder.test.ts`（#7397） | `gsap.order.test.ts` 載入失敗（找不到 `./gsapAuthoredOrder`）＋`init.authoredOrder.test.ts` 1 failed | core 組 616 passed | tween 之前的 set 不再抹除 tween 終點 |
| core `entry.test.ts`（#7402） | 1 failed（hidden capture 頁面只載入螢幕上的 clip） | core 組 616 passed | capture 頁面只載入螢幕上 clip |

既有失敗與環境抖動（本次實測）：producer `fileServer.test.ts` 兩例符號連結 EPERM、`plan.test.ts` 三例 FFmpeg 找不到，在移植前的 HEAD 來源上同樣失敗；cli 整包最終一次 9 個檔 32 例失敗（`offload.undecodableTrack`、`clean`、`transcribe`、`describeProject`、`optionalPackages`、`lambda/videoImage`、`warmCheck.process`、`chromeOrphans.process`、`launch.pipeEof`），除 `launch.pipeEof` 外都在 packages 還原為 HEAD 的狀態下同樣失敗；`launch.pipeEof.test.ts` 單獨重跑 1 passed；`snapshot.lateImages.browser`、`captureCompositionFrame.pageCrash.browser`、`checkDeadline.process` 在第一次整包與單獨重跑時失敗（Chrome 30 秒內沒起來），packages 還原為 HEAD 時單獨重跑同樣失敗，最終整包則通過，屬環境抖動；`uploadParts.test.ts` 與 `offload.test.ts` 在第一次整包高負載下各逾時 1 例，單獨低負載重跑通過；core 在預設 5 秒逾時、6 worker 下有 40 例逾時，改 `--maxWorkers=6 --testTimeout=60000` 後 116 檔 2758 passed（最終 `src/runtime` 為 116 檔 2761 passed）；lint 整包曾有 `sourceLocations.test.ts` 的線性時間斷言逾時 1 例，重跑 1255 passed／1 skipped（那 1 例 skipped 是 `projectShaders.test.ts` 的符號連結案例在本帳戶無權限而 skip）。

### PR 軸

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7383](https://github.com/heygen-com/hyperframes/pull/7383) | MERGED（`841e90ffe`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7384](https://github.com/heygen-com/hyperframes/pull/7384) | MERGED（`34118d8f2`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7385](https://github.com/heygen-com/hyperframes/pull/7385) | MERGED（`a0bbaab43`），版號不適用 | 見 commit 軸 | 見 commit 軸 |
| [#7386](https://github.com/heygen-com/hyperframes/pull/7386) | monitored（open，釘 head `828da2c4a`）：`fix(lint): name the clip without data-duration in the audio overlap hint`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7387](https://github.com/heygen-com/hyperframes/pull/7387) | monitored（open，釘 head `c1b783485`）：`feat(lint): warn when data-start references an id that does not exist`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7388](https://github.com/heygen-com/hyperframes/pull/7388) | monitored（open，釘 head `13c6a9711`）：`fix(producer): a render uses the CLI's own GSAP, so the default CDN's file needs no network`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7389](https://github.com/heygen-com/hyperframes/pull/7389) | open（head `a9b0ffe43`）：`chore(codegen): resync cloud client from EF c28ed684`，codegen PR 不釘 | OPEN | 不適用 |
| [#7390](https://github.com/heygen-com/hyperframes/pull/7390) | MERGED（`fed14b016`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7391](https://github.com/heygen-com/hyperframes/pull/7391) | CLOSED（`889647cf3`），作者關閉未合併，不釘 | CLOSED | 不適用 |
| [#7392](https://github.com/heygen-com/hyperframes/pull/7392) | MERGED（`26956ea1f`），版號不適用 | 見 commit 軸 | 見 commit 軸 |
| [#7393](https://github.com/heygen-com/hyperframes/pull/7393) | MERGED（`3151fd213`），延後（隨 #7379 延後） | 見 commit 軸 | 見 commit 軸 |
| [#7394](https://github.com/heygen-com/hyperframes/pull/7394) | MERGED（`adf14d732`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7395](https://github.com/heygen-com/hyperframes/pull/7395) | MERGED（`ab785e9c5`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7396](https://github.com/heygen-com/hyperframes/pull/7396) | monitored（open，釘 head `5627c410d`）：`fix(skills): measure seam-gate speed-match on the frame grid`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7397](https://github.com/heygen-com/hyperframes/pull/7397) | MERGED（`75fe18c62`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7398](https://github.com/heygen-com/hyperframes/pull/7398) | monitored（open，釘 head `ef994ced2`）：`feat(cli): check replays an unchanged project's last pass and takes --no-craft`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |
| [#7399](https://github.com/heygen-com/hyperframes/pull/7399) | MERGED（`7ad2be96e`），版號不適用 | 見 commit 軸 | 見 commit 軸 |
| [#7400](https://github.com/heygen-com/hyperframes/pull/7400) | CLOSED（`e6582828b`），作者關閉未合併，不釘 | CLOSED | 不適用 |
| [#7401](https://github.com/heygen-com/hyperframes/pull/7401) | MERGED（`074de9dd1`），CI 不適用 | 見 commit 軸 | 見 commit 軸 |
| [#7402](https://github.com/heygen-com/hyperframes/pull/7402) | MERGED（`12906e0bf`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7403](https://github.com/heygen-com/hyperframes/pull/7403) | monitored（open，釘 head `15ce9b24f`）：`feat(media-use): render avatar looks on Avatar 6 and ask for presenter and voice`，釘選追蹤 | OPEN | `tools/upstream_baseline.json` |

### issue 軸

| issue | 裁決與理由 |
| --- | --- |
| [#7404](https://github.com/heygen-com/hyperframes/issues/7404) | 記錄、不動（OPEN）：Desktop multi-select projects for bulk move and Trash in All projects，為 Electron 桌面應用議題，記錄追蹤 |

### 釘選移動（13 筆）

| 釘選 | 移動 | 裁決 |
| --- | --- | --- |
| #6732 | open（head `a07b25ea9`）→ open（head `b10fd340b`） | 重釘新 head |
| #7119 | open（head `d5b7ede74`）→ merged（head `0791b2421`，`0f5914dc4`） | 採用，重釘 closed |
| #7159 | open（head `692f0e3c4`）→ merged（head `872888326`，`fd05a3860`） | 延後，重釘 closed |
| #7249 | open（head `4c89caa88`）→ open（head `55124485b`） | 重釘新 head |
| #7321 | draft（head `3fccf55f6`）→ closed（作者關閉未合併） | 重釘 closed |
| #7349 | open（head `f7d763ce5`）→ merged（head `7a9b5db6b`，`b559a98d3`） | 採用，重釘 closed |
| #7369 | open（head `727d08e5d`）→ merged（head `727d08e5d`，`7b79ab429`） | 採用，重釘 closed |
| #7373 | open（head `ad02236b7`）→ merged（head `ca4995c1f`，`942893eb2`） | 採用，重釘 closed |
| #7375 | open（head `8249651ad`）→ merged（head `8249651ad`，`3d7f12acd`） | 採用，重釘 closed |
| #7378 | open（head `4ffd6759d`）→ merged（head `4ffd6759d`，`b87a01f6a`） | 採用，重釘 closed |
| #7379 | open（head `faa7546b6`）→ merged（head `c1b235be7`，`b7157bdab`） | 延後，重釘 closed |
| #7381 | open（head `aa5f2ed8e`）→ merged（head `f8cdaa920`，`e0c11bf09`） | 採用，重釘 closed |
| #7382 | open（head `dbf66cc22`）→ merged（head `1bbbfa2c3`，`c27475b97`） | 採用，重釘 closed |

### 新釘選

新增 6 筆 open PR 釘選：#7386、#7387、#7388、#7396、#7398、#7403（head 見 `tools/upstream_baseline.json`）。monitored 總數由 136 增為 142 筆。

### 預算、LFS 與延後

- 本批上游沒有新 LFS 物件。倉庫自身的 LFS 現況：`.gitattributes` 規定 `packages/producer/tests/**/output/compiled.html` 走 LFS，但本線 HEAD 自初始 commit `370725f24` 起存原始 HTML，上游存 pointer（`git show a73572c3b:packages/producer/tests/vfr-screen-recording/output/compiled.html` 是 3 行 pointer）；`git lfs fsck --pointers` 對 HEAD 報 55 筆 should have been a pointer。後果是 clean filter 把 10 個既有 fixture 在 `git status` 顯示為已修改，內容與 HEAD blob 相同（`git hash-object --no-filters` 與 `git rev-parse HEAD:<path>` 逐檔核對），這些檔不 stage、也不用 `assume-unchanged` 隱藏。根治（`git add --renormalize`）排在 ROADMAP 近期列，本批不做。
- `scripts/package-size-budgets.json`：`@hyperframes/player` 的 `packed` 預算由 158800 改為 157145，取自 #7383 `841e90ffe` 本身的變更（`git diff 841e90ffe^1 841e90ffe -- scripts/package-size-budgets.json`）。延後的 `b7157bdab` 與 `7bf65995b` 各有預算變更，本線沒有採用。
- 無 `skills/` 變動，`skills-manifest.json` 無需變動。
- 維持延後：#7379、#7159、#7393 以及既有延後項目。

### 最新剩餘快照（水位 `12906e0bf`，PR #7403，issue #7404）

2026-11-08 `python tools/check_upstream_updates.py --strict` exit 0：commit 軸 `No new upstream commits`（behind 0）；PR 軸 `Triaged through #7403`、`No new items above that number`；issue 軸 `Triaged through #7404`、`No new items above that number`；monitored 142 筆，`Every pinned item is still at the head and state it was judged at`。


## 2026-11-09：接續至 `c38ac5438`（推進至最新 tip `ad6f7858f`）

以 fork `3de999d22` 為起點接續審查。接續審查 `12906e0bf` 至 `c38ac5438`（以及審查期間上游合併之 `a73572c3b` #7442、`ad6f7858f` #7445）之間新進之上游項目，包含 17 筆 commit、PR #7405–#7450（39 筆 PR）、issue #7406–#7451（8 筆 issue），及 6 筆釘選移動（pr#7142、pr#7208、pr#7311、pr#7367、pr#7398、pr#7403）。

### Commit 軸

| Commit | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `070b964d7` #7398 | 延後：check 重播上次通過結果並新增 `--no-craft`；新增 `checkCache.ts`（139 行），7 檔 +405／−6；`git apply --check` 對本線失敗於 `check.test.ts:1`、`check.ts:44`。需要 check 重播時，連同 `check.test.ts` 的測試（+208／−1）與 `docs/packages/cli.mdx` 成組引入 | `packages/cli/src/utils/checkCache.ts`（新檔） | 延後；本線沒有 `packages/cli/src/utils/checkCache.ts`，`check.ts` 沒有 `no-craft` |
| `eb16510a1` #7410 | 延後：每次 render 都以固定種子產生隨機值，`fileServer.ts` +23／−71，新增 `random-stagger-workers` 回歸 fixture（`compiled.html`、`output.mp4` 在上游是 LFS pointer）；`git apply --check` 對本線乾淨。改的是渲染確定性，ROADMAP 維護方式要求以 Windows render verification 與 regression 驗收，本次未跑這兩項，所以不採用。重訪條件：能跑 producer regression 並接收新 fixture 時，連同 #7390 的 `fileServer.ts` 區塊一併驗 | `packages/producer/src/services/fileServer.ts`；`packages/producer/tests/random-stagger-workers/`（新目錄） | 延後；本線沒有 `packages/producer/tests/random-stagger-workers` |
| `fa2e63515` #7412 | 採用（先紅後綠，見紅綠證據）：靜音影片（`defaultMuted`）的畫面在剪切點不再等自己的音軌，`dropSilentAudioTrack` 停用該音軌 | `packages/core/src/runtime/media.ts:477`；`packages/core/src/runtime/media.test.ts:1627` | `packages/core/src/runtime/media.ts:395`；`packages/core/src/runtime/media.test.ts:1687` |
| `b764a5ffd` #6150 | 採用：只新增測試，覆蓋 `<template>` 根節點的 composition 變數宣告（`invalid_composition_variables_declaration`）；沒有來源變更，所以沒有紅燈階段 | `packages/lint/src/rules/composition.test.ts:1275` | `packages/lint/src/rules/composition.test.ts:1275` |
| `327e20208` #7414 | 不適用：上游 v0.9.25 版本發布與 changelog | `.codex-plugin/plugin.json:4` | 不適用（版本號變更） |
| `2927fe615` #7415 | 延後：Studio history 首次複製的效能優化（`blobStore.ts` +59、`projectHistory.ts` +33、新測試 `firstCopy.test.ts` 148 行），不是故障修正；`git apply --check` 對本線失敗於 `blobStore.test.ts:107`、`blobStore.ts:1`，需手工適配。有人回報大專案首次複製過慢時再做 | `packages/studio-server/src/history/blobStore.ts` | 延後；本線有 `packages/studio-server/src/history/blobStore.ts`，未改 |
| `91ad7fb6e` #7419 | 延後：雲端 render 對 Unicode NFC／NFD 檔名正規化（`offload.ts`、`cloud/render.ts`、`publishProject.ts`，5 檔 +129／−11）；`git apply --check` 對本線失敗於 `offload.ts:35`、`cloud/render.ts:49`，需手工適配並驗雲端上傳路徑，本次未做。需要處理 macOS 取得的 NFD 檔名時再做 | `packages/cli/src/cloud/offload.ts`；`packages/cli/src/utils/publishProject.ts` | 延後 |
| `5e8abd757` #7418 | 延後：新增 1440p 解析度預設（12 檔 +114／−11，含 `parsers/src/types.ts`、`init.ts`、`render.ts`、`plan.ts`、技能文件與 `skills-manifest.json`）；`git apply --check` 對本線失敗於 `init.ts:894`、`skills-manifest.json:10`（需重生技能清單雜湊）。有 1440p 輸出需求或下一次重生 skills manifest 時一併做 | `packages/parsers/src/types.ts`；`packages/cli/src/commands/init.ts` | 延後 |
| `0c6c7fca4` #7421 | 不適用：上游 v0.9.26 版本發布與 changelog | `.codex-plugin/plugin.json:4` | 不適用（版本號變更） |
| `d09584382` #7422 | 不適用：上游 v0.9.26 release notes 補充文件 | `releases/v0.9.26.md:5` | 不適用（版本文件） |
| `c14f25890` #7423 | 延後：遙測的 agent runtime 偵測（5 檔 +610／−68，其中 `agent_runtime.ts` +273／−63）；屬 ROADMAP 既有「遙測邊界」，本線先決定遙測政策才移植（先例：#6847、#6925，見 UPSTREAM_REVIEW_2026-11-02）；`git apply --check` 對本線失敗於 `agent_runtime.test.ts:622`、`agent_runtime.ts:89` | `packages/cli/src/telemetry/agent_runtime.ts` | 延後 |
| `c1e96a45b` #7424 | 延後：遙測偵測優先順序調整（2 檔 +24／−13），接在 #7423 之後，`git apply --check` 失敗於 `agent_runtime.ts:69`；隨 #7423 重訪 | `packages/cli/src/telemetry/agent_runtime.ts` | 延後（隨 #7423） |
| `7bf65995b` #7425 | 延後：遙測新增其他偵測器使用的 agent 標記（8 檔 +104／−38），本線沒有 `cli.agentMode.test.ts`，`git apply --check` 失敗；隨 #7423 重訪 | `packages/cli/src/telemetry/agent_runtime.ts` | 延後（隨 #7423） |
| `e35125372` #7426 | 延後：遙測 agent 偵測的註解修正（1 檔 +7／−7），接在 #7423 之後，`git apply --check` 失敗於 `agent_runtime.ts:92`；隨 #7423 重訪 | `packages/cli/src/telemetry/agent_runtime.ts` | 延後（隨 #7423） |
| `c38ac5438` #7311 | 延後：分散式與 range render 帶入 page motion blur（22 檔 +448／−26，含 `__test_utils__/blurChunkRender.ts` 210 行與一組 `blurChunks.*.integration.test.ts`）；`git apply --check` 對本線失敗於 `docs/guides/motion-blur.mdx:88`，且本線沒有 `packages/cli/src/docs/motion-blur.md`。需要成組採用 blur differential harness（ROADMAP 中期列 #6967／#7302）時一併做 | `packages/producer/src/services/distributed/__test_utils__/blurChunkRender.ts`（新檔） | 延後；本線沒有 `packages/cli/src/docs/motion-blur.md` |
| `a73572c3b` #7442 | 採用（本次移植，先紅後綠，見紅綠證據）：停在尾格的影片只 seek 一次，不再每個 frame 重 seek（`heldTailSeekedTo`）；上游補丁 4 個 hunk 有 2 個（`media.ts:50`、`:309` 的脈絡）在本線不能直接套用，手工放到本線對應位置，其餘 2 個 hunk 與測試原樣套用 | `packages/core/src/runtime/media.ts:826`（`tailSettled`）；`packages/core/src/runtime/media.test.ts:1283` | `packages/core/src/runtime/media.ts:717`（`tailSettled`）；`packages/core/src/runtime/media.test.ts:1282` |
| `ad6f7858f` #7445 | 不適用：把 `reverse-any-video` 與 `style-sampling` 加進核心技能清單（`skillsManifest.ts` 的 `isCoreSkill`、`FALLBACK_CORE_SKILLS`）並讓 `/hyperframes` 路由到它們，15 檔 +59／−48；本線 `skills/` 沒有這兩個技能（`ls skills`），`reverse-any-video` 屬 HeyGen 帳戶功能，DECISIONS 已列為不採；`git apply --check` 對本線失敗於 `AGENTS.md:4`、`README.md:66`，且本線沒有 `CLAUDE.md`（只維護 `AGENTS.md`）。本線新增這兩個技能時再重訪 | `packages/cli/src/utils/skillsManifest.ts`（`NAMED_CORE_SKILLS`） | 不適用；本線沒有 `skills/reverse-any-video`、`skills/style-sampling` |

採用 commit 的上游作者（供 Co-authored-by）：Miguel Ángel（#7412、#7442）、ym256-stanford（#6150）；`ad6f7858f`（#7445）不適用，不列作者。

### Commit 逐檔 numstat（`git diff --numstat <c>^1 <c>` 實算）

```text
=== 070b964d7 ===
2	0	docs/packages/cli.mdx
208	1	packages/cli/src/commands/check.test.ts
49	3	packages/cli/src/commands/check.ts
139	0	packages/cli/src/utils/checkCache.ts
3	1	packages/cli/src/utils/checkPipeline.ts
3	0	packages/cli/src/utils/checkTypes.ts
1	1	packages/cli/src/warmCheck.process.test.ts

=== eb16510a1 ===
2	2	packages/producer/src/services/distributed/planFrameCost.ts
5	6	packages/producer/src/services/distributed/renderChunk.ts
21	54	packages/producer/src/services/fileServer-seededRandom.test.ts
2	2	packages/producer/src/services/fileServer-virtualTimers.test.ts
23	71	packages/producer/src/services/fileServer.ts
13	0	packages/producer/tests/random-stagger-workers/meta.json
3	0	packages/producer/tests/random-stagger-workers/output/compiled.html
3	0	packages/producer/tests/random-stagger-workers/output/output.mp4
33	0	packages/producer/tests/random-stagger-workers/src/index.html
1	0	packages/producer/tests/shard-schedule.json

=== fa2e63515 ===
47	0	packages/core/src/runtime/media.test.ts
8	0	packages/core/src/runtime/media.ts

=== b764a5ffd ===
9	0	packages/lint/src/rules/composition.test.ts

=== 327e20208 ===
1	1	.claude-plugin/plugin.json
1	1	.codex-plugin/plugin.json
1	1	.cursor-plugin/plugin.json
24	0	docs/changelog.mdx
1	1	gemini-extension.json
1	1	packages/aws-lambda/package.json
1	1	packages/cli/package.json
1	1	packages/core/package.json
1	1	packages/engine/package.json
1	1	packages/gcp-cloud-run/package.json
1	1	packages/inspector/package.json
1	1	packages/lint/package.json
1	1	packages/parsers/package.json
1	1	packages/player/package.json
1	1	packages/producer/package.json
1	1	packages/sdk/package.json
1	1	packages/shader-transitions/package.json
1	1	packages/share/package.json
1	1	packages/studio-server/package.json
1	1	packages/studio/package.json
1	1	plugin.json
23	0	releases/v0.9.25.md

=== 2927fe615 ===
19	0	packages/studio-server/src/history/__fixtures__/dieMidFirstCopy.ts
22	2	packages/studio-server/src/history/blobStore.test.ts
55	4	packages/studio-server/src/history/blobStore.ts
148	0	packages/studio-server/src/history/firstCopy.test.ts
28	5	packages/studio-server/src/history/projectHistory.ts

=== 91ad7fb6e ===
28	0	packages/cli/src/cloud/offload.test.ts
9	4	packages/cli/src/cloud/offload.ts
7	4	packages/cli/src/commands/cloud/render.ts
52	0	packages/cli/src/utils/publishProject.test.ts
33	3	packages/cli/src/utils/publishProject.ts

=== 5e8abd757 ===
2	2	docs/packages/cli.mdx
19	0	packages/cli/src/commands/init.test.ts
4	3	packages/cli/src/commands/init.ts
15	0	packages/cli/src/commands/render.test.ts
1	1	packages/cli/src/commands/render.ts
3	2	packages/cli/src/commands/render/plan.ts
16	0	packages/core/src/index.test.ts
40	0	packages/parsers/src/outputResolutionCompatibility.test.ts
9	0	packages/parsers/src/types.ts
1	1	skills-manifest.json
2	2	skills/hyperframes-cli/references/init-and-scaffold.md
2	0	skills/hyperframes-cli/references/preview-render.md

=== 0c6c7fca4 ===
1	1	.claude-plugin/plugin.json
1	1	.codex-plugin/plugin.json
1	1	.cursor-plugin/plugin.json
18	0	docs/changelog.mdx
1	1	gemini-extension.json
1	1	packages/aws-lambda/package.json
1	1	packages/cli/package.json
1	1	packages/core/package.json
1	1	packages/engine/package.json
1	1	packages/gcp-cloud-run/package.json
1	1	packages/inspector/package.json
1	1	packages/lint/package.json
1	1	packages/parsers/package.json
1	1	packages/player/package.json
1	1	packages/producer/package.json
1	1	packages/sdk/package.json
1	1	packages/shader-transitions/package.json
1	1	packages/share/package.json
1	1	packages/studio-server/package.json
1	1	packages/studio/package.json
1	1	plugin.json
17	0	releases/v0.9.26.md

=== d09584382 ===
5	1	docs/changelog.mdx
5	1	releases/v0.9.26.md

=== c14f25890 ===
286	2	packages/cli/src/telemetry/agent_runtime.test.ts
273	63	packages/cli/src/telemetry/agent_runtime.ts
47	0	packages/cli/src/telemetry/system.test.ts
3	2	packages/cli/src/telemetry/system.ts
1	1	packages/cli/src/utils/attendedTerminal.test.ts

=== c1e96a45b ===
10	0	packages/cli/src/telemetry/agent_runtime.test.ts
14	13	packages/cli/src/telemetry/agent_runtime.ts

=== 7bf65995b ===
1	1	packages/cli/src/cli.agentMode.test.ts
3	2	packages/cli/src/commands/auth/login.test.ts
46	11	packages/cli/src/telemetry/agent_runtime.test.ts
44	20	packages/cli/src/telemetry/agent_runtime.ts
1	1	packages/cli/src/telemetry/system.test.ts
1	1	packages/cli/src/utils/attendedTerminal.test.ts
7	1	packages/cli/src/utils/desktopApp.test.ts
1	1	scripts/package-size-budgets.json

=== e35125372 ===
7	7	packages/cli/src/telemetry/agent_runtime.ts

=== c38ac5438 ===
2	1	docs/guides/motion-blur.mdx
1	1	packages/cli/src/docs/motion-blur.md
7	0	packages/producer/scripts/integration-tests.json
5	3	packages/producer/scripts/run-test-lane.mjs
210	0	packages/producer/src/services/distributed/__test_utils__/blurChunkRender.ts
21	0	packages/producer/src/services/distributed/blurChunks.callbacks.integration.test.ts
24	0	packages/producer/src/services/distributed/blurChunks.callbacksFilter.integration.test.ts
41	0	packages/producer/src/services/distributed/blurChunks.configOff.integration.test.ts
21	0	packages/producer/src/services/distributed/blurChunks.heldCard.integration.test.ts
24	0	packages/producer/src/services/distributed/blurChunks.heldCardFilter.integration.test.ts
21	0	packages/producer/src/services/distributed/blurChunks.onceGuardLabel.integration.test.ts
21	0	packages/producer/src/services/distributed/blurChunks.scrollList.integration.test.ts
2	2	packages/producer/src/services/distributed/chunkFrames.test.ts
1	1	packages/producer/src/services/distributed/chunkFrames.ts
19	14	packages/producer/src/services/distributed/plan.test.ts
1	0	packages/producer/src/services/distributed/plan.ts
1	0	packages/producer/src/services/distributed/renderChunk.ts
21	0	packages/producer/src/services/distributed/renderConfigValidation.test.ts
2	1	packages/producer/src/services/distributed/shared.ts
1	1	scripts/test-reachability.json
1	1	skills-manifest.json
1	1	skills/hyperframes/references/motion.md

=== a73572c3b ===
61	0	packages/core/src/runtime/media.test.ts
16	1	packages/core/src/runtime/media.ts

=== ad6f7858f ===
3	1	.claude-plugin/marketplace.json
3	3	AGENTS.md
4	4	CLAUDE.md
5	5	README.md
2	2	docs/guides/skills.mdx
16	16	packages/cli/src/commands/skills.installTarget.test.ts
2	2	packages/cli/src/templates/_shared/AGENTS.md
2	2	packages/cli/src/templates/_shared/CLAUDE.md
3	1	packages/cli/src/utils/skillsManifest.test.ts
9	5	packages/cli/src/utils/skillsManifest.ts
2	1	scripts/check-core-skills.mjs
2	2	skills-manifest.json
3	1	skills/hyperframes/SKILL.md
2	2	skills/hyperframes/references/skill-lifecycle.md
1	1	skills/reverse-any-video/SKILL.md
```

### 紅綠證據

紅綠方法同上一節。
| 套件 | 紅 | 綠 | 名稱 |
| --- | --- | --- | --- |
| core `media.test.ts`（#7412） | 反向套用 `fa2e63515` 在 `media.ts` 的兩個 hunk：2 failed／183 passed（`is switched off for a video the author muted`、`is switched off when the browser lists it after the first tick`） | 185 passed／0 failed | 靜音影片畫面在剪切點不等自己的音軌 |
| lint `composition.test.ts`（#6150） | 無（只新增測試，沒有來源變更） | lint 組 4 檔合計 403 passed／1 skipped／0 failed | template 根節點 composition 變數宣告檢查 |
| core `media.test.ts`（#7442） | 還原 `heldTailSeekedTo` 相關變更：2 failed／183 passed（`seeks a held video tail once…`、`seeks a held video tail again when something else moved the element off it`；第三例「paused 每次都 seek」兩邊都過，是防呆） | 185 passed／0 failed | 停在尾格的影片只 seek 一次 |

### PR 軸

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7405](https://github.com/heygen-com/hyperframes/pull/7405) | monitored（open，釘 head `48e699425`）：`test(core): keep font-locator tests independent of the host's fonts`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7409](https://github.com/heygen-com/hyperframes/pull/7409) | monitored（open，釘 head `6b4db7e7e`）：`feat(check): warn when a line break cuts a Korean word in two`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7410](https://github.com/heygen-com/hyperframes/pull/7410) | MERGED（`eb16510a1`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7411](https://github.com/heygen-com/hyperframes/pull/7411) | CLOSED（`a15d18634`），作者關閉未合併，不釘 | CLOSED | 不適用 |
| [#7412](https://github.com/heygen-com/hyperframes/pull/7412) | MERGED（`fa2e63515`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7413](https://github.com/heygen-com/hyperframes/pull/7413) | monitored（open，釘 head `8077df8d7`）：`fix(render): fail loudly when fontconfig finds no system fonts`；issue #7406 追蹤此問題。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7414](https://github.com/heygen-com/hyperframes/pull/7414) | MERGED（`327e20208`），版號不適用 | 見 commit 軸 | 見 commit 軸 |
| [#7415](https://github.com/heygen-com/hyperframes/pull/7415) | MERGED（`2927fe615`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7416](https://github.com/heygen-com/hyperframes/pull/7416) | monitored（open，釘 head `baaa8b499`）：`Rename marketplace.json to marketplace.plugin`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7418](https://github.com/heygen-com/hyperframes/pull/7418) | MERGED（`5e8abd757`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7419](https://github.com/heygen-com/hyperframes/pull/7419) | MERGED（`91ad7fb6e`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7421](https://github.com/heygen-com/hyperframes/pull/7421) | MERGED（`0c6c7fca4`），版號不適用 | 見 commit 軸 | 見 commit 軸 |
| [#7422](https://github.com/heygen-com/hyperframes/pull/7422) | MERGED（`d09584382`），文件不適用 | 見 commit 軸 | 見 commit 軸 |
| [#7423](https://github.com/heygen-com/hyperframes/pull/7423) | MERGED（`c14f25890`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7424](https://github.com/heygen-com/hyperframes/pull/7424) | MERGED（`c1e96a45b`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7425](https://github.com/heygen-com/hyperframes/pull/7425) | MERGED（`7bf65995b`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7426](https://github.com/heygen-com/hyperframes/pull/7426) | MERGED（`e35125372`），延後（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7427](https://github.com/heygen-com/hyperframes/pull/7427) | monitored（open，釘 head `88f4ebfaa`）：`fix(core): fsync atomic writes before publishing`；issue #7417 追蹤此修正。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7428](https://github.com/heygen-com/hyperframes/pull/7428) | monitored（open，釘 head `d9abf382b`）：`perf(engine): workers verify static frames only in the range they capture`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7430](https://github.com/heygen-com/hyperframes/pull/7430) | monitored（open，釘 head `e957b8803`）：`fix(registry): registry item lint installs every manifest file, and lints items again`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7432](https://github.com/heygen-com/hyperframes/pull/7432) | monitored（open，釘 head `36ebdb914`）：`fix(studio): keep Code on the last composition selected`；issue #7431 追蹤此修正。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7433](https://github.com/heygen-com/hyperframes/pull/7433) | monitored（open，釘 head `1acab6672`）：`feat(cli): add `hyperframes init --timeline` to start a project from an OTIO timeline`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7434](https://github.com/heygen-com/hyperframes/pull/7434) | monitored（open，釘 head `84d3e31b6`）：`docs(captions): add Arabic/RTL caption guidance`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7435](https://github.com/heygen-com/hyperframes/pull/7435) | monitored（open，釘 head `9186556a9`）：`ci(skills): lint skill-root paths and skill names in skill docs`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7436](https://github.com/heygen-com/hyperframes/pull/7436) | monitored（draft，釘 head `6a25337bd`）：`perf(core): Safari clips open at their in-point and are fetched ahead`；與已採用的 Safari 時鐘鏈（#7383、#7373、#7412）同區，合併後核對 `media.ts`。重訪條件：合併、關閉或 head 移動 | DRAFT | `tools/upstream_baseline.json` |
| [#7437](https://github.com/heygen-com/hyperframes/pull/7437) | monitored（open，釘 head `aebfb99bb`）：`test(engine): nightly motion blur run over generated compositions`；與延後的 #7311（motion blur）同屬 blur 驗證。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7438](https://github.com/heygen-com/hyperframes/pull/7438) | monitored（open，釘 head `ce6e1b092`）：`docs: a facts page with the official price, platforms, agents and formats, each dated`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7439](https://github.com/heygen-com/hyperframes/pull/7439) | monitored（open，釘 head `de40901bb`）：`docs(mcp): current ChatGPT and Claude setup steps, the hosted render's real output, and a first prompt that works`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7440](https://github.com/heygen-com/hyperframes/pull/7440) | monitored（open，釘 head `a76748924`）：`docs(studio-app): the Reference read is paid by Pro or a saved HeyGen API key`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7441](https://github.com/heygen-com/hyperframes/pull/7441) | monitored（open，釘 head `f76d06f76`）：`docs(studio-app): cloud exports come with the plan, not only an API key`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7442](https://github.com/heygen-com/hyperframes/pull/7442) | MERGED（`a73572c3b`），隨 commit 軸採用 | 見 commit 軸 | 見 commit 軸 |
| [#7443](https://github.com/heygen-com/hyperframes/pull/7443) | monitored（open，釘 head `8484f96cd`）：`fix(cli): measure answers the four mistakes agents make most`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7444](https://github.com/heygen-com/hyperframes/pull/7444) | monitored（open，釘 head `08a9d4c15`）：`feat(cli): reverse and templates report their own runs; commands say which skills are installed`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7445](https://github.com/heygen-com/hyperframes/pull/7445) | MERGED（`ad6f7858f`），不適用（見 commit 軸）；審查期間合併，所以不釘 monitored，改走 commit 軸 | 見 commit 軸 | 見 commit 軸 |
| [#7446](https://github.com/heygen-com/hyperframes/pull/7446) | CLOSED（`53189a3cf`），作者關閉未合併，不釘 | CLOSED | 不適用 |
| [#7447](https://github.com/heygen-com/hyperframes/pull/7447) | monitored（draft，釘 head `c1398b6d2`）：`perf(core): Safari plays a long source's audio from its element, not a whole-file decode`；與已採用的 Safari 時鐘鏈（#7383、#7373、#7412）同區，合併後核對 `media.ts`。重訪條件：合併、關閉或 head 移動 | DRAFT | `tools/upstream_baseline.json` |
| [#7448](https://github.com/heygen-com/hyperframes/pull/7448) | monitored（open，釘 head `c6206c585`）：`fix(cli): reject inherited names as documentation topics`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7449](https://github.com/heygen-com/hyperframes/pull/7449) | monitored（open，釘 head `cd50cd0b3`）：`fix(studio): leave Enter and Escape to an IME that is still composing`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |
| [#7450](https://github.com/heygen-com/hyperframes/pull/7450) | monitored（open，釘 head `86efcc5b3`）：`feat(skills): route a style outside the templates instead of listing them`。重訪條件：合併、關閉或 head 移動 | OPEN | `tools/upstream_baseline.json` |

### issue 軸

| issue | 裁決與理由 |
| --- | --- |
| [#7406](https://github.com/heygen-com/hyperframes/issues/7406) | 記錄、不動（OPEN）：render 在 Linux 上當 Chromium 找不到系統字型時文字缺失仍 exit 0，記錄追蹤 |
| [#7407](https://github.com/heygen-com/hyperframes/issues/7407) | 記錄、不動（OPEN）：doctor 核可了 render 不使用的 Chrome 版本且無法預知渲染是否成功，記錄追蹤 |
| [#7408](https://github.com/heygen-com/hyperframes/issues/7408) | 記錄、不動（OPEN）：render --json 在所有失敗皆報 runtime_error，取消或成功未印出任何內容，記錄追蹤 |
| [#7417](https://github.com/heygen-com/hyperframes/issues/7417) | 記錄、不動（OPEN）：斷電後 video-state.json 因無 fsync 與解析錯誤導致狀態被清空，已由 open PR #7427 追蹤 |
| [#7420](https://github.com/heygen-com/hyperframes/issues/7420) | 記錄、不動（OPEN）：支援 1080p 至 1440p 輸出而無需手動分數縮放，已由 commit 5e8abd757 實作，記錄追蹤 |
| [#7429](https://github.com/heygen-com/hyperframes/issues/7429) | 記錄、不動（OPEN）：Linux AppImage 結束時 Crashpad 拋出 SIGBUS 崩潰，記錄追蹤 |
| [#7431](https://github.com/heygen-com/hyperframes/issues/7431) | 記錄、不動（OPEN）：Studio Code 在延遲的來源回應後可能切換回舊的 composition，已由 open PR #7432 追蹤 |
| [#7451](https://github.com/heygen-com/hyperframes/issues/7451) | 記錄、不動（OPEN）：`hyperframes-cli` 技能在無人值守的 `npx hyperframes` 會停在 npm 的 "Ok to proceed?" 提示，固定版本的呼叫仍可能死在 npx 快取步驟；本線尚未重現，記錄追蹤 |

### 釘選移動（6 筆）

| 釘選 | 移動 | 裁決 |
| --- | --- | --- |
| #7142 | open（head `af8fbc627`）→ open（head `a954926ce`） | 重釘新 head |
| #7208 | open（head `d22212561`）→ open（head `4a889bd99`） | 重釘新 head |
| #7311 | open（head `ed8a035b7`）→ closed（merged `c38ac5438`，head `ef8c6395c`） | 延後，重釘 closed |
| #7367 | open（head `281efa2db`）→ closed（head `42ef462ca`） | 作者關閉未合併，重釘 closed |
| #7398 | open（head `ef994ced2`）→ closed（merged `070b964d7`，head `4fc5f8754`） | 延後，重釘 closed |
| #7403 | open（head `15ce9b24f`）→ open（head `8a1c8b317`） | 重釘新 head |

### 新釘選

依既有規則（open／draft PR 釘 monitored，機器重生的 codegen 與版號 PR、作者關閉未合併者不釘），新增 23 筆：#7405、#7409、#7413、#7416、#7427、#7428、#7430、#7432、#7433、#7434、#7435、#7436、#7437、#7438、#7439、#7440、#7441、#7443、#7444、#7447、#7448、#7449、#7450（head 與 open／draft 狀態見 `tools/upstream_baseline.json`，值取自 `gh pr list` 當下輸出）。本節依標題與狀態釘選，沒有逐行讀這 23 筆的 diff；重訪條件一律是合併（進 commit 軸審）、關閉或 head 移動（`check_upstream_updates.py` 會報）。不釘：#7411、#7446（作者關閉）、#7445（審查期間已合併為 `ad6f7858f`，走 commit 軸）。monitored 由 142 增為 165 筆。

### 預算、LFS 與延後

- 無新 LFS 物件。
- `scripts/package-size-budgets.json` 本批無變動。
- 無 `skills/` 變動，`skills-manifest.json` 無需變動。
- 維持延後：#7398、#7410、#7415、#7419、#7418、#7423、#7424、#7425、#7426、#7311 以及既有延後項目；#7067 依 2026-11-04 的延後條件維持延後，#7373 沒有帶入它的起步 hold。

### 最新剩餘快照（水位 `ad6f7858f`，PR #7450，issue #7451）

2026-11-09 `python tools/check_upstream_updates.py --strict` exit 0：commit 軸 `No new upstream commits`（behind 0）；PR 軸 `Triaged through #7450`、`No new items above that number`；issue 軸 `Triaged through #7451`、`No new items above that number`；monitored 165 筆，`Every pinned item is still at the head and state it was judged at`。審查中途上游前進過兩次（`ad6f7858f`、#7449、#7450、#7445 合併；其後 issue #7451 與 #7434、#7450 換 head），都已併入本節，#7434 與 #7450 在 baseline 重釘新 head。

## 2026-11-10：接續至 `c14973081`（上游 tip）

以 fork `4a7d1594d` 為起點接續審查 `ad6f7858f..c14973081`：8 個 commit、PR #7452（1 筆）、issue 軸無新增（仍到 #7451），以及 10 筆釘選移動（pr#7000、pr#7110、pr#7249、pr#7257、pr#7269、pr#7338、pr#7434、pr#7443、pr#7444、pr#7450）。審查期間上游前進兩次（`7b30a50b5` 之後多了 `c9fe04150`／#7000，再多了 `c14973081`／#7257），都已併入本節。

### Commit 軸

| Commit | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `eb0a52c29` #7443 | 不適用：`measure` 指令組的使用錯誤處理（沒指定 op 時改跑 `probe`、ffprobe 讀不了檔時帶原因、未加引號的含空白路徑提示、`--from/--to`／`-o` 旗標）。19 檔 +356／−50；19 檔中 14 檔在本線不存在（`commands/measure.ts`、`commands/measure/*`、`measure/*`、`utils/didYouMean*`），`reject-extra-positionals.ts` 的 hunk 依賴 `spacedPath`，`git apply --check` 失敗；DECISIONS 2026-11-04 已把 `measure` 列為本線沒有的模組。本線引入 `measure` 指令組時再重訪 | `packages/cli/src/commands/measure.ts:30`（`MEASURE_OPS`）；`packages/cli/src/utils/didYouMean.ts:77`（`fileHint`） | 不適用；本線沒有 `packages/cli/src/commands/measure.ts`、`packages/cli/src/measure/`、`packages/cli/src/utils/didYouMean.ts` |
| `448f88ff3` #7444 | 延後：`reverse start`／`templates pull` 回報自己的執行（新事件 `skill_command_ran`）、`cli_command` 帶 `skills_installed`／`skills_outdated` 名單、`auth status` 未登入帶 `NotSignedIn` 原因。11 檔 +269／−9；`commands/reverse/start.ts`、`start.test.ts`、`commands/templates.ts`、`templates.test.ts` 在本線不存在（reverse 與付費樣式範本整組不採，見 2026-11-02 清冊與 #6842、#7084、#7116 的原判定），`auth/status.ts:160`、`telemetry/events.ts:1017`、`skillsUpdateCheck.ts:50`、`skillsUpdateCheck.test.ts:100` 的 hunk 不合。遙測欄位新增屬本線先決定遙測政策才移植的範圍（先例：#6847、#6925、#7423）。重訪條件：決定遙測政策並引入 reverse／templates 時，連同 #7452 一併做 | `packages/cli/src/telemetry/events.ts:1030`（`trackSkillCommandRan`） | 延後；本線沒有 `trackSkillCommandRan`、`skills_installed`，`commands/reverse/` 與 `commands/templates.ts` 不存在 |
| `caa62fe68` #7249 | 採用（先紅後綠，見紅綠證據）：`isTemplateEntry` 改以結構判斷，完整 HTML 文件內 `<template>` 持有 composition 根的場景檔不再被當成一般檔編譯而得到「Composition has zero duration」；`locateSceneRoot` 與 `findSceneTemplate` 讓編譯器、子組合內嵌與執行期載入器共用同一個「第一個持有 composition 根的 template」；多個場景 template 且無 live 根時渲染第一個，並由新 lint 規則 `multiple_scene_templates` 警告。補丁對本線乾淨套用（`git apply --check` rc 0），11 檔 +326／−17，與上游 numstat 逐檔相同 | `packages/core/src/compiler/htmlDocument.ts:26`；`packages/parsers/src/subCompositionValidity.ts:65`；`packages/lint/src/rules/composition.ts:1968`；`packages/core/src/compiler/standaloneEntry.test.ts:20` | 同行號：`packages/core/src/compiler/htmlDocument.ts:26`；`packages/parsers/src/subCompositionValidity.ts:65`；`packages/lint/src/rules/composition.ts:1968`；`packages/core/src/compiler/standaloneEntry.test.ts:20` |
| `37f1819f3` #7450 | 不適用：`style-sampling` 回答範本以外風格時改指向 `reverse-any-video` 與 `look.md`，5 檔 +9／−6。`skills/reverse-any-video`、`skills/style-sampling` 在本線不存在（`ls skills`），`git apply --check` 另失敗於 `scripts/check-core-skills.mjs:13`（本線 `hyperframes` 預算為 7168，上游已逐筆加位元組）、`skills-manifest.json:6`（需重生雜湊）、`skills/hyperframes/SKILL.md:63`（本線路由表沒有 `/reverse-any-video`、`/style-sampling` 兩列）。唯一能獨立落地的是路由表一列「Another film's style on a new topic → `references/look.md`」，它的觸發端（`style-sampling` 的回覆）在本線不存在，且要重生 manifest 雜湊與調預算，與 `5e8abd757`（#7418，1440p）一樣等下一次重生技能清單時一併做。重訪條件：本線新增這兩個技能，或下一次重生 `skills-manifest.json` | `skills/hyperframes/SKILL.md:66`；`skills/style-sampling/SKILL.md:30` | 延後；本線 `skills/` 只有 figma、hyperframes、hyperframes-cli、hyperframes-registry、media-use、remotion-to-hyperframes、slideshow |
| `3a24da8a8` #7452 | 延後：#7443／#7444 的後續修正（含空白路徑提示取最長路徑並讀 `--flag=value`；遙測文件說明 reverse 的 session id）。3 檔 +32／−11；`reject-extra-positionals.ts:46` 的 `spacedPath` 與 `docs/packages/cli.mdx:2307` 的遙測段落都由 #7443／#7444 提供，本線沒有，`git apply --check` 失敗於這兩處加 `reject-extra-positionals.test.ts:1`。隨 #7443／#7444 重訪 | `packages/cli/src/utils/reject-extra-positionals.ts:55`（`spacedPath`） | 延後（隨 #7443／#7444）；本線 `reject-extra-positionals.ts` 沒有 `spacedPath` |
| `7b30a50b5` #7110 | 採用（先紅後綠，見紅綠證據）：whisper.cpp 在 token 機率寫出裸的 `nan`、`-nan`、`inf` 與 MSVC 的 `-nan(ind)`，`JSON.parse` 讀不了；新增 `parseWhisperJson` 把字串之外的這些值轉成 `null`，`loadTranscript`、`detectFormat` 與 `transcribe` 都改走它。Windows 的 whisper 會寫 `-nan(ind)`，是本線直接受益的修正。補丁的 `normalize.ts` hunk 對本線失敗於 `:41`（本線沒有 `readJsonFileText`，`detectFormat` 直接 `JSON.parse(readFileSync(...))`），所以兩個解析呼叫點手工改；`parseWhisperJson` 與其正規式區塊和測試與上游逐位元相同。3 檔 +48／−4，fork 的 numstat 為 +11／−2、+2／−2、+35／−0，與上游相同 | `packages/cli/src/whisper/normalize.ts:505`；`packages/cli/src/whisper/normalize.test.ts:127` | `packages/cli/src/whisper/normalize.ts:510`；`packages/cli/src/whisper/normalize.test.ts:119` |
| `c9fe04150` #7000 | 採用：只改測試，`browserManager.test.ts` 的空截圖探測測試改用 fake timers 推進 200 ms，不再等真實的 120 ms 期限，消除機器負載造成的不穩。補丁對本線乾淨套用，沒有來源變更，所以沒有紅燈階段 | `packages/engine/src/services/browserManager.test.ts:87` | `packages/engine/src/services/browserManager.test.ts:87` |
| `c14973081` #7257 | 不適用：macOS 沒裝 developer tools 時，`git`、`xcrun`、`cc` 是會跳出安裝對話框的 stub，新增 `appleStubs.ts` 的 `runsWithoutInstallPrompt` 讓 `whisper/manager.ts`、`audio/analysis/providers/apple.ts`、`commands/skills.ts` 先判斷再呼叫。6 檔 +154／−3；`runsWithoutInstallPrompt` 在非 darwin 平台第一行就回傳 true，Windows 行為不變；`git apply --check` 對本線失敗於 `commands/skills.ts:1`、`whisper/manager.ts:1`（import 區塊不同）。本線是 Windows 原生維護線，需要 macOS 支援時再重訪 | `packages/cli/src/utils/appleStubs.ts:49`（`runsWithoutInstallPrompt`）；`packages/cli/src/whisper/manager.ts:254` | 不適用；本線沒有 `packages/cli/src/utils/appleStubs.ts`，`whisper/manager.ts:253` 的 `hasGit` 只呼叫 `whichBinary("git")` |

採用 commit 的上游作者（供 Co-authored-by）：Jerrai（#7249）、Miguel Ángel（#7110、#7000）。

### Commit 逐檔 numstat（`git diff --numstat <c>^1 <c>` 實算）

```text
=== eb0a52c29 ===
19	1	packages/cli/src/cli.ts
17	13	packages/cli/src/commands/measure.ts
2	2	packages/cli/src/commands/measure/curve.ts
2	2	packages/cli/src/commands/measure/cuts.ts
2	2	packages/cli/src/commands/measure/events.ts
1	1	packages/cli/src/commands/measure/extract.ts
6	1	packages/cli/src/commands/measure/frames.ts
2	2	packages/cli/src/commands/measure/look.ts
2	2	packages/cli/src/commands/measure/sync.ts
1	1	packages/cli/src/measure/command.ts
97	2	packages/cli/src/measure/media.test.ts
70	12	packages/cli/src/measure/media.ts
2	4	packages/cli/src/measure/outFlags.test.ts
8	2	packages/cli/src/utils/didYouMean.test.ts
4	2	packages/cli/src/utils/didYouMean.ts
43	1	packages/cli/src/utils/projectShortcut.test.ts
27	0	packages/cli/src/utils/projectShortcut.ts
36	0	packages/cli/src/utils/reject-extra-positionals.test.ts
15	0	packages/cli/src/utils/reject-extra-positionals.ts

=== 448f88ff3 ===
2	1	docs/packages/cli.mdx
10	2	packages/cli/src/commands/auth/status.ts
41	1	packages/cli/src/commands/reverse/start.test.ts
15	1	packages/cli/src/commands/reverse/start.ts
37	2	packages/cli/src/commands/templates.test.ts
12	0	packages/cli/src/commands/templates.ts
11	0	packages/cli/src/telemetry/config.ts
58	1	packages/cli/src/telemetry/events.test.ts
24	0	packages/cli/src/telemetry/events.ts
38	0	packages/cli/src/utils/skillsUpdateCheck.test.ts
21	1	packages/cli/src/utils/skillsUpdateCheck.ts

=== caa62fe68 ===
6	0	docs/reference/lint-rules.mdx
47	0	packages/core/src/compiler/htmlBundler.test.ts
24	1	packages/core/src/compiler/htmlDocument.ts
79	8	packages/core/src/compiler/standaloneEntry.test.ts
2	6	packages/core/src/compiler/standaloneEntry.ts
21	0	packages/core/src/runtime/compositionLoader.test.ts
7	1	packages/core/src/runtime/compositionLoader.ts
26	0	packages/lint/src/rules/composition.test.ts
27	0	packages/lint/src/rules/composition.ts
15	1	packages/parsers/src/subCompositionValidity.ts
72	0	packages/producer/src/services/render/stages/compileStage.test.ts

=== 37f1819f3 ===
2	2	scripts/check-core-skills.mjs
3	3	skills-manifest.json
1	0	skills/hyperframes/SKILL.md
1	1	skills/reverse-any-video/SKILL.md
2	0	skills/style-sampling/SKILL.md

=== 3a24da8a8 ===
2	1	docs/packages/cli.mdx
19	6	packages/cli/src/utils/reject-extra-positionals.test.ts
11	4	packages/cli/src/utils/reject-extra-positionals.ts

=== 7b30a50b5 ===
35	0	packages/cli/src/whisper/normalize.test.ts
11	2	packages/cli/src/whisper/normalize.ts
2	2	packages/cli/src/whisper/transcribe.ts

=== c9fe04150 ===
11	4	packages/engine/src/services/browserManager.test.ts

=== c14973081 ===
2	0	packages/cli/src/audio/analysis/providers/apple.ts
24	1	packages/cli/src/commands/skills.test.ts
2	0	packages/cli/src/commands/skills.ts
59	0	packages/cli/src/utils/appleStubs.test.ts
63	0	packages/cli/src/utils/appleStubs.ts
4	2	packages/cli/src/whisper/manager.ts
```

### 紅綠證據

紅綠方法：先只套用測試檔（不含來源變更），跑測試記下失敗；再套來源變更，跑同一組測試。測試一律用 BelowNormal 優先權、`--maxWorkers=4 --testTimeout=60000`（producer 用 `bun test --timeout 60000`）。

| 套件 | 紅 | 綠 | 名稱 |
| --- | --- | --- | --- |
| core（#7249） | 只套測試：`htmlBundler.test.ts`、`standaloneEntry.test.ts`、`compositionLoader.test.ts` 共 11 failed（`recognizes the full-document shape whose composition root lives in the body template`、`keeps a template-first fragment with a live composition root beside it a plain entry`、`finds the scene template when an earlier template holds no composition root` ×3、`renders the first scene template when several hold a composition root and none is live`、`does not refuse when a live root makes the file a plain entry`、`reports no root when no template holds a composition root`、`reads a single template and a template-free document as before`、`mounts the scene template of a fetched file with a card template before the scene`、`mounts the scene template of a file with a card template before the scene`） | core 全套 269 檔 5713 passed／11 skipped／0 failed | template 入口以結構判斷、多 template 場景選取 |
| lint `composition.test.ts`（#7249） | 1 failed／319 passed（`warns, naming each scene template`） | lint 全套 24 檔 1259 passed／1 skipped／0 failed | `multiple_scene_templates` 警告 |
| producer `compileStage.test.ts`（#7249） | 1 fail／23 pass（`isolates a full-document scene whose root lives in the body template`：預期 `standalone-entry.html`，實際為 `compositions/scene.html`） | 24 pass／0 fail | 完整文件場景檔隔離為獨立入口 |
| cli `normalize.test.ts`（#7110） | 1 failed／83 passed（84）：`reads whisper-cli output whose floats are nan, -nan, inf or MSVC's -nan(ind)`，`SyntaxError: Unexpected token 'a', ..."p": nan,`，來自 `JSON.parse(content)` | `src/whisper` 14 檔 223 passed／9 skipped／0 failed | whisper 輸出含 nan／inf |
| engine `browserManager.test.ts`（#7000） | 無（只改測試，沒有來源變更） | 112 passed／5 skipped／0 failed | 空截圖探測改 fake timers |

**環境注意（core 綠燈的前提）**：vitest 在 node 條件下把 `@hyperframes/parsers/sub-composition-validity` 解析到 `packages/parsers/dist`，那是被 git 忽略的建置產物。dist 是舊的時候，#7249 的 core 測試會得到 `TypeError: findSceneTemplate is not a function`（同一批 compiler 與 compositionLoader 測試 280 failed／465 passed）；在 `packages/parsers` 跑 `bun run build` 後全綠。CI 先建置所以不受影響；本機移植觸及 `packages/parsers/src` 時要先重建。

**既有失敗（在乾淨 HEAD 同樣失敗，與本批無關）**：
- parsers `src/assetResolution.test.ts` 的 `reports a name too long or a symlink loop as missing, as existsSync did`：`EPERM: operation not permitted, symlink`（本機帳號不能建符號連結）。把 `subCompositionValidity.ts` 還原成乾淨 HEAD 版後單跑該檔，同樣 1 failed／33 passed／1 skipped。parsers 全套於本批後為 55 檔、54 passed、1 failed（1388 passed／1 failed／7 skipped／3 todo）。
- cli `tsc --noEmit` 在 `src/commands/check.test.ts` 有 3 個型別錯誤（`:2313` `'deadline' is possibly 'undefined'`、`:3903`、`:3904` `Expected 2 arguments, but got 3`），把 `packages/cli/src/whisper` 的變更暫存起來後在乾淨 HEAD 同樣出現；該檔本批沒有觸及。

### PR 軸

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7452](https://github.com/heygen-com/hyperframes/pull/7452) | MERGED（`3a24da8a8`），延後（見 commit 軸）；審查時已合併，不釘 | 見 commit 軸 | 見 commit 軸 |

### issue 軸

issue 軸本批沒有新增項目：`Triaged through #7451`，`No new items above that number`。

### 釘選移動（10 筆）

每筆都用唯讀 `gh pr view` 取當下 head 與狀態，重釘值取自該輸出。

| 釘選 | 移動 | 裁決 |
| --- | --- | --- |
| #7000 | open（head `bf74cbbbe`）→ closed（merged `c9fe04150`，head `0111704c1`） | 採用（見 commit 軸），重釘 closed |
| #7110 | open（head `1e52c9020`）→ closed（merged `7b30a50b5`，head `20a11e40c`） | 採用（見 commit 軸），重釘 closed |
| #7249 | open（head `55124485b`）→ closed（merged `caa62fe68`，head `55124485b`） | 採用（見 commit 軸），重釘 closed |
| #7257 | open（head `ebcddd435`）→ closed（merged `c14973081`，head `5909eb6d5`） | 先以 `gh pr diff` 讀 open 時的 head（6 檔 +154／−3，內容為 `/usr/bin/git`、`xcrun`、`/usr/bin/cc` 的 macOS stub 判斷與 `darwin` 測試），審查期間合併；不適用（見 commit 軸），重釘 closed |
| #7269 | open（head `7f3931eaf`）→ open（head `8a67eeb08`） | 讀 diff（2 檔 +43／−13，`templates.ts` 與其測試把 `templates pull` 的暫存資料夾改放 `.hyperframes/template-pulls`）：`commands/templates.ts` 在本線不存在，無可移植內容，維持原判定；重釘新 head |
| #7338 | open（head `6bb98481f`）→ open（head `e1f7af513`） | 讀 diff（23 檔 +206／−60，diff 移除 46 行含 `mkdtempSync` 的行、新增 57 行含 `createStagingDir` 的行，改走 `@hyperframes/core/atomic-file` 並加掃描測試 `noBareMkdtemp.test.ts`）：Windows 260 字元缺口仍成立，PR 仍 open，維持「合併後一組採用」；`git apply --check` 對本線失敗於 `cloud/download.ts:13`、`fonts/fontCompression.ts:1`、`captureHdrResources.ts:464`，且 `commands/measure/frames.ts`、`commands/templates.ts` 不存在，合併後逐檔判定 23 檔，不存在者略過；重釘新 head |
| #7434 | open（head `84d3e31b6`）→ open（head `368436fbc`） | 讀 diff（`gh pr diff`，2 檔 +20／−1：`skills/hyperframes/references/captions.md` 新增阿拉伯文與右到左文字的字幕指引，`skills-manifest.json` 一個雜湊）：純技能文件，沒有程式；套用到本線的 `skills-manifest.json` 失敗於 `:6`（需重生雜湊），PR 仍 open，維持原判定，合併後隨下一次重生技能清單一併做；重釘新 head |
| #7443 | open（head `8484f96cd`）→ closed（merged `eb0a52c29`，head `8484f96cd`） | 不適用（見 commit 軸），重釘 closed |
| #7444 | open（head `08a9d4c15`）→ closed（merged `448f88ff3`，head `08a9d4c15`） | 延後（見 commit 軸），重釘 closed |
| #7450 | open（head `86efcc5b3`）→ closed（merged `37f1819f3`，head `86efcc5b3`） | 不適用（見 commit 軸），重釘 closed |

### 新釘選

本批無新增（PR 軸只有已合併的 #7452，不釘）。monitored 維持 165 筆，沒有釘選被移除。

### 隱藏內容掃描（判準八）

掃描新增行：空白夾內容（`\S\s{40,}\S`）、`eval(`／`new Function(`、`globalThis.`／`global.require`、`atob(`／`fromCharCode`／`Buffer.from(…base64)`、120 字元以上的 base64、240 字元以上的 hex、零寬與雙向控制字元、400 字元以上單行。
- commit 軸：8 個 commit 共 1,205 行新增行（356、269、326、9、32、48、11、154）。0 命中隱藏內容；唯一的 400 字元以上單行是 `skills/style-sampling/SKILL.md` 的一段說明文字（#7450），內容是路由說明，沒有程式。
- PR 軸：仍 open 的移動釘選以目前 head 的 `gh pr diff` 掃：#7269（`8a67eeb08`）43 行、#7338（`e1f7af513`）206 行，共 249 行新增行，0 命中；#7434（`368436fbc`）20 行，0 命中，唯一的 400 字元以上單行是 captions.md 中含阿拉伯文字元範圍與連字單元說明的一段文件文字；#7257 在 open 時以 head `5909eb6d5` 掃過 154 行，0 命中，合併後的 commit 軸 154 行是同一份內容。
- 已合併的 PR 內容就是 commit 內容；本批沒有再被強推換版的 open PR。

### 預算、LFS 與延後

- 無新 LFS 物件；`packages/producer/tests/*/output/compiled.html` 的 10 筆工作樹差異是 LFS 還原差異，沒有暫存，也不在任何 commit 內。
- `scripts/package-size-budgets.json` 本批無變動。上游 #7249 的 squash 訊息列了兩次 inspector 預算調整，但最終 diff 沒有動這個檔案；`bun run verify:packed-manifests` 需要全套件建置與 pack，本批沒有跑，所以 core 與 inspector 的 packed 大小是否仍在 1% 容差內沒有驗證，下一次跑 pack 閘門時確認。
- 無 `skills/` 變動，`skills-manifest.json` 無需變動。
- 維持延後：#7443／#7444／#7452 一組（隨遙測政策與 reverse／templates 引入）、#7450 路由表一列（隨下一次重生技能清單），以及先前所有延後項目。

### 最新剩餘快照（水位 `c14973081`，PR #7452，issue #7451）

2026-11-10 `python tools/check_upstream_updates.py --strict` exit 0：commit 軸 `No new upstream commits`（behind 0）；PR 軸 `Triaged through #7452`、`No new items above that number`；issue 軸 `Triaged through #7451`、`No new items above that number`；monitored 165 筆，`Every pinned item is still at the head and state it was judged at`。

## 2026-11-10：接續至 `9e346f9bb`（上游 tip）

以 fork `f3cab380a` 為起點接續審查 `c14973081..9e346f9bb`：12 個 commit、PR #7453–#7468 共 11 筆、issue #7457–#7465 共 5 筆，以及 11 筆釘選移動（pr#6732、pr#7209、pr#7266、pr#7269、pr#7338、pr#7372、pr#7416、pr#7433、pr#7435、pr#7437、pr#7439）。審查期間上游由 2 個 commit（`0ca2b1ae9`）前進到 12 個（`6f9098039`，最後是 `9e346f9bb`），都已併入本節；採用的移植分兩個 fork commit：`ee26d636a`（#7338）與 `bf266f367`（#7459、#7463、#7454、#7456、#7439）。

### Commit 軸

| Commit | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| `b59fa2083` #7338 | 採用（部分，先紅後綠，見紅綠證據）：Windows 上 `mkdtemp` 在 `<專案路徑>/.xxx-` 超過 260 字元時失敗；新增 `createStagingDir(parent, prefix)`，`C:\` 磁碟路徑與 `\\server\share` UNC 路徑加 `\\?\`／`\\?\UNC\` 長路徑前綴建立資料夾，回傳去掉前綴的路徑；已是 `\\?\` 或 `\\.\` 命名空間的路徑與非 Windows 路徑原樣交給 `mkdtempSync`。23 檔 +206／−60；本線 21 檔適用（`atomicFile.ts` 與三份測試、17 個暫存資料夾呼叫點的來源檔），`commands/measure/frames.ts` 與 `commands/templates.ts` 在本線不存在而略過。`git apply --check` 失敗於 `cloud/download.ts:13`、`fonts/fontCompression.ts:1`、`captureHdrResources.ts:464`（import 區塊或呼叫點行與本線不同）及那兩個不存在的檔，其餘 18 檔乾淨套用；三處手工改，改法與上游逐行相同。測試 `noBareMkdtemp.test.ts` 掃描所有套件原始碼，本線有五個上游沒有的暫存資料夾呼叫點，處理見下 | `packages/core/src/atomicFile.ts:192`（`upstream/main` 的 `createStagingDir`）；`packages/core/src/noBareMkdtemp.test.ts:1` | `packages/core/src/atomicFile.ts:192`；`packages/cli/src/cloud/download.ts:21,82`；`packages/core/src/fonts/fontCompression.ts:7,67`；`packages/producer/src/services/render/stages/captureHdrResources.ts:46,468` |
| `0ca2b1ae9` #6732 | 已採用，無新增改動：本線 2026-10-30 在 `314e023cd` 照 PR 當時 head 移植 `contactSheet.ts` 的 `basename(p)` 與 `contactSheet.test.ts` 的 `labels each SVG thumbnail with its file name`。合併後的兩個檔與本線逐位元相同（`git show 0ca2b1ae9:<檔> \| diff - <檔>` exit 0），`git apply -R --check` 通過，表示補丁已在樹上 | `packages/cli/src/capture/contactSheet.ts:307`（`basename(p)`） | `packages/cli/src/capture/contactSheet.ts:307`、`contactSheet.test.ts:316` |
| `fc13420` #7454 | 採用（沒有紅燈階段：改的是技能腳本與說明，沒有測試）：上游內部技能 `motion-doctrine` 的 `seam-gate.mjs` in-page `seek`／`sample`／`scan` 改成 `async` 並 `await __player.seek(t)`，四個 `evalJs` 呼叫加 `awaitPromise`，`changelog-video` 的 `SKILL.md`、`build-spec.md` 改成 `await __player.seek(t)`，`seam-gate.md` 補一段說明；`.agents/skills` 與 `.claude/skills` 兩份鏡像同改。8 檔 +28／−20；補丁乾淨套用（`git apply --check` rc 0） | `.agents/skills/motion-doctrine/scripts/seam-gate.mjs:297` | `.agents/skills/motion-doctrine/scripts/seam-gate.mjs:297`、`.claude/skills/motion-doctrine/scripts/seam-gate.mjs:297` |
| `3ff0b3d` #7453 | 不適用：`docs/weekly-updates.mdx` 前置 88 行的週報，列上游本週功能與 commit 連結並嵌入上游 CDN 影片。本線不照搬上游週報（先例 #7032）；`git apply --check` 也失敗於 `docs/weekly-updates.mdx:12`（本線該檔頭部不同） | `docs/weekly-updates.mdx:15` | 不適用 |
| `a4e16d8` #7269 | 不適用：`templates pull` 的暫存資料夾改放 `.hyperframes/template-pulls`，2 檔 +43／−13 都是 `commands/templates.ts` 與其測試，兩者在本線不存在（`git apply --check` 失敗於 `No such file or directory`），範本 pull 整組不在本線（見 #7444 的判定）；#7338 帶進的 `createStagingDir` 已在本線，但這個變更的主體仍是 `templates.ts`。本線引入 `templates pull` 時再重訪 | `packages/cli/src/commands/templates.ts`（`removeAbandonedParts(stage, dest)`） | 不適用（`ls packages/cli/src/commands/templates.ts` 無此檔） |
| `b95ab79` #7455 | 延後：`chore(codegen): resync cloud client`，由 HeyGen 雲端服務的 OpenAPI 重生 `packages/cli/src/cloud/_gen/types.ts`（新增 `ChargedPool`、`ThirdPartyImageCharge`、`max_bitrate`／`buffer_size` 等欄位），1 檔 +11／−1。`git apply --check` 失敗於 `types.ts:79`（本線的重生檔落後上游，上游已重生過多次），單套這一筆不會乾淨；隨雲端用戶端整批同步（HeyGen 雲端／帳戶功能本線不採，同 2026-11-02 邊界） | `packages/cli/src/cloud/_gen/types.ts:79` | 延後；`packages/cli/src/cloud/_gen/types.ts` 未動 |
| `4d29a64` #7456 | 採用（沒有紅燈階段：改測試設定）：engine 的 `browser` 測試專案加 `testTimeout: 30_000`，慢速 runner 上真 Chrome 的測試不再吃 5 秒預設值。1 檔 +1，乾淨套用 | `packages/engine/vitest.config.ts:22` | `packages/engine/vitest.config.ts:22` |
| `48a2b4e` #7439 | 採用（文件）：`docs/guides/mcp.mdx` 改為目前 Claude 連接器目錄與 ChatGPT 自訂 MCP 伺服器的設定步驟、託管渲染實際輸出 MP4、第一個提示詞要點名 HyperFrames。1 檔 +24／−15，乾淨套用；這份文件本線原樣沿用上游，沒有 fork 改寫，所以直接跟上游，不另寫差異 | `docs/guides/mcp.mdx:60` | `docs/guides/mcp.mdx:60` |
| `4b3f70f` #7459 | 採用（先紅後綠，見紅綠證據）：Studio 的 `startRender` 在執行 `executeRenderJob` 前先取 CLI 同一把「每個使用者帳號同時一個渲染」鎖，等待時 `stage` 顯示 `Waiting for another render (…)`，Cancel 結束等待而不釋放別人持有的鎖，失敗時釋放；`HYPERFRAMES_RENDER_LOCK=off` 時並行。修 issue #7457（Studio 繞過既有跨專案渲染鎖）。2 檔 +158／−7，乾淨套用；本線 `utils/renderLock.ts` 已提供 `acquireRenderLock`（`wait`、`signal`、`onWait`）與 `describeRenderLockHolder`，不需先決 | `packages/cli/src/server/studioServer.ts:679` | `packages/cli/src/server/studioServer.ts:709`；`packages/cli/src/utils/renderLock.ts:55,84` |
| `7bf19ab` #7437 | 延後：夜間 motion blur 對產生的組合跑差異測試，9 檔 +1482／−19（新 `.github/workflows/motion-blur-nightly.yml`、`motionBlur/generate.ts`、`captureMotionBlur.generated.browser.test.ts`、報告腳本）。`git apply --check` 失敗於 `package.json:54`，且 `motionBlur/differentialPage.ts`、`fixtures.ts` 在本線不存在；與已延後的 blur differential harness（#6967／#7302）同屬一組，隨該組採用 | `packages/engine/src/services/__fixtures__/motionBlur/generate.ts` | 延後（`ls packages/engine/src/services/__fixtures__/motionBlur/` 無 `differentialPage.ts`） |
| `6f90980` #7463 | 採用（先紅後綠，見紅綠證據）：刪除一個動畫群組時，原本對群組內每個 tween 各解析一次 GSAP 腳本，改為整個群組只解析一次：`gsapWriterAcorn.ts` 新增 `removeAnimationsForSelectors`（一次解析後在同一份 MagicString 上移除所有符合的 tween 呼叫，連同變空的語句），`parseGsapScriptAcornForWrite` 多回傳 `timelineDeclaration` 供它定位，`htmlParser.ts` 的 `removeElementWithGsapCascade` 改呼叫它。修 issue #7460。4 檔 +142／−25，乾淨套用 | `packages/parsers/src/htmlParser.ts:738`（`removeElementWithGsapCascade`） | `packages/parsers/src/htmlParser.ts:738`；`packages/parsers/src/gsapWriterAcorn.ts:701` |
| `9e346f9` #7464 | 不適用：`chore(release): cut v0.9.27` 版號發行，22 檔 +115／−20（`package.json` 版號 0.9.26→0.9.27、各 plugin 清單、`docs/changelog.mdx` 新增 48 行、`releases/v0.9.27.md` 47 行）。本線 `packages/cli/package.json` 的版本是 0.8.210，不同步上游版號與發行；`git apply --check` 失敗於 `.claude-plugin/plugin.json:1` 等。發行說明列出的修正都在其他 commit 軸項目逐筆審過 | `packages/cli/package.json:3`（上游 0.9.27） | 不適用（`packages/cli/package.json:3` 是 0.8.210） |

採用 commit 的上游作者（供 Co-authored-by）：Miguel Ángel（#7338、#7456、#7459）、James Russo（#7454）、Ular Kimsanov（#7439）、Akshar Patel（#7463）。

**#7338 在本線多出的呼叫點與取捨**：
- 上游 ALLOWED 清單（不走 `createStagingDir` 的 `mkdtemp`）原有 `core/src/atomicFile.ts`、`cli/src/media-use/lib/lut-preset-provider.mjs`、`producer/src/server.ts`、`producer/src/regression-harness.ts`、`aws-lambda/src/s3PlanV2Publisher.ts`、`gcp-cloud-run/src/gcsPlanV2Publisher.ts`。本線另有五處上游沒有的 `mkdtemp`（`git grep` 實查）：`cli/src/capture/videoNormalization.ts:42`（`.hf-video-`，TypeScript，cli 已依賴 core，**改用 `createStagingDir`**，與其他呼叫點同處理）；`cli/src/media-use/lib/freeze-publisher.mjs:166`、`cli/src/media-use/lib/image-normalize.mjs:18`（技能內獨立腳本，與上游已允許的 `lut-preset-provider.mjs` 同類，不能 import 套件）；`core/src/figma/freeze.ts:124`（在 `String.raw` 內的子行程腳本，無法 import）；`producer/src/inline-project-publisher.mjs:55`（由 `build.mjs` 原樣複製到 `dist` 的獨立腳本）。後四處加進 `noBareMkdtemp.test.ts` 的 ALLOWED 並附註解，登記在 DECISIONS、FORK.md 與 ROADMAP；這是對上游新增測試檔的 fork 改寫。
- 本線 `fontCompression.ts` 沒有上游的 `hyperframesCacheDir` 匯入，import 區塊手工合併；`download.ts` 的 import 順序不同，手工合併。
- 呼叫點合計：`git grep -c "createStagingDir("`（排除測試）19 檔 27 處，扣掉定義 1 處，26 處呼叫點；其中 25 處在上游同樣改動的 17 個來源檔，1 處是 `videoNormalization.ts`。

### Commit 逐檔 numstat（`git diff --numstat <c>^1 <c>` 實算）

```text
=== b59fa2083 ===
3	2	packages/cli/src/capture/captureFile.ts
3	3	packages/cli/src/cloud/download.ts
3	2	packages/cli/src/commands/measure/frames.ts
2	2	packages/cli/src/commands/templates.ts
3	2	packages/cli/src/registry/publication.ts
39	1	packages/core/src/atomicFile.test.ts
27	0	packages/core/src/atomicFile.ts
33	0	packages/core/src/atomicFile.win32Paths.test.ts
3	10	packages/core/src/fonts/fontCompression.ts
48	0	packages/core/src/noBareMkdtemp.test.ts
3	2	packages/engine/src/services/aacEncode.ts
7	6	packages/engine/src/services/audioMixer.ts
3	2	packages/engine/src/services/audioVolumeEnvelope.ts
2	2	packages/engine/src/services/chunkEncoder.ts
2	2	packages/engine/src/utils/urlDownloader.ts
3	3	packages/producer/src/services/distributed/assemble.ts
4	3	packages/producer/src/services/distributed/mp4Stitch.ts
5	5	packages/producer/src/services/distributed/planV2.ts
3	3	packages/producer/src/services/distributed/planV2Publisher.ts
2	2	packages/producer/src/services/render/audioPadTrim.ts
3	3	packages/producer/src/services/render/renderDirOwner.ts
3	3	packages/producer/src/services/render/stages/captureHdrResources.ts
2	2	packages/studio-server/src/helpers/waveform.ts

=== 0ca2b1ae9 ===
31	2	packages/cli/src/capture/contactSheet.test.ts
1	1	packages/cli/src/capture/contactSheet.ts

=== fc13420 ===
1	1	.agents/skills/changelog-video/SKILL.md
1	1	.agents/skills/changelog-video/references/build-spec.md
4	0	.agents/skills/motion-doctrine/references/seam-gate.md
8	8	.agents/skills/motion-doctrine/scripts/seam-gate.mjs
1	1	.claude/skills/changelog-video/SKILL.md
1	1	.claude/skills/changelog-video/references/build-spec.md
4	0	.claude/skills/motion-doctrine/references/seam-gate.md
8	8	.claude/skills/motion-doctrine/scripts/seam-gate.mjs

=== 3ff0b3d ===
88	0	docs/weekly-updates.mdx

=== a4e16d8 ===
27	3	packages/cli/src/commands/templates.test.ts
16	10	packages/cli/src/commands/templates.ts

=== b95ab79 ===
11	1	packages/cli/src/cloud/_gen/types.ts

=== 4d29a64 ===
1	0	packages/engine/vitest.config.ts

=== 48a2b4e ===
24	15	docs/guides/mcp.mdx

=== 4b3f70f ===
136	0	packages/cli/src/server/studioServer.renderLock.test.ts
22	7	packages/cli/src/server/studioServer.ts

=== 7bf19ab ===
117	0	.github/workflows/motion-blur-nightly.yml
1	1	package.json
66	16	packages/engine/src/services/__fixtures__/motionBlur/differentialPage.ts
2	2	packages/engine/src/services/__fixtures__/motionBlur/fixtures.ts
94	0	packages/engine/src/services/__fixtures__/motionBlur/generate.test.ts
355	0	packages/engine/src/services/__fixtures__/motionBlur/generate.ts
156	0	packages/engine/src/services/captureMotionBlur.generated.browser.test.ts
328	0	scripts/ci/motion-blur-nightly-report.mjs
363	0	scripts/ci/motion-blur-nightly-report.test.mjs

=== 6f90980 ===
13	2	packages/parsers/src/gsapParserAcorn.ts
70	6	packages/parsers/src/gsapWriterAcorn.ts
55	1	packages/parsers/src/htmlParser.test.ts
4	16	packages/parsers/src/htmlParser.ts

=== 9e346f9 ===
1	1	.claude-plugin/plugin.json
1	1	.codex-plugin/plugin.json
1	1	.cursor-plugin/plugin.json
48	0	docs/changelog.mdx
1	1	gemini-extension.json
1	1	packages/aws-lambda/package.json
1	1	packages/cli/package.json
1	1	packages/core/package.json
1	1	packages/engine/package.json
1	1	packages/gcp-cloud-run/package.json
1	1	packages/inspector/package.json
1	1	packages/lint/package.json
1	1	packages/parsers/package.json
1	1	packages/player/package.json
1	1	packages/producer/package.json
1	1	packages/sdk/package.json
1	1	packages/shader-transitions/package.json
1	1	packages/share/package.json
1	1	packages/studio-server/package.json
1	1	packages/studio/package.json
1	1	plugin.json
47	0	releases/v0.9.27.md
```

### 紅綠證據

紅綠方法：先只套用測試檔（不含來源變更），跑測試記下失敗；再套來源變更，跑同一組測試。測試一律用 BelowNormal 優先權、`--maxWorkers=4 --testTimeout=60000`（producer 的 bun 測試逐檔各開一個行程，沿用該套件的 `run-test-lane.mjs` 規則）。

| 套件 | 紅 | 綠 | 名稱 |
| --- | --- | --- | --- |
| core（#7338） | 只套測試：`atomicFile.test.ts`、`atomicFile.win32Paths.test.ts`、`noBareMkdtemp.test.ts` 共 10 failed／27 passed／8 skipped（45）：`createStagingDir with Windows parents` 6 例與 `createStagingDir` 的 3 例皆為 `TypeError: createStagingDir is not a function`，`noBareMkdtemp.test.ts` 列出 29 個違規位置（`cli/src/capture/captureFile.ts:21` 起） | 3 檔 37 passed／8 skipped／0 failed；含 Windows 才跑的 `works when the full path passes 260 characters`（路徑 280 字元以上，回傳不帶 `\\?\`） | `createStagingDir` 長路徑與前綴還原；沒有套件在專案路徑旁用裸 `mkdtemp` |
| cli `studioServer.renderLock.test.ts`（#7459） | 只套測試：2 failed／2 passed（4）：`makes a second render wait, and say so, until the first ends`、`lets Cancel end a wait without freeing the slot the first render holds`，`AssertionError: the given combination of arguments (undefined and string) is invalid`（`stage` 是 `undefined`，沒有等待訊息） | `src/server` 21 檔：20 passed／1 skipped，240 passed／10 skipped／0 failed | Studio 渲染等待跨專案渲染鎖 |
| parsers `htmlParser.test.ts`（#7463） | 只套測試：1 failed／63 passed／2 todo（66）：`removeElementFromHtml > parses a script once when deleting a subtree with many tweens`，`expected "parse" to be called 1 times, but got 7 times` | parsers 全套 55 檔：54 passed／1 failed，1394 passed／1 failed／7 skipped／3 todo；唯一失敗是既有的 `assetResolution.test.ts` 符號連結 `EPERM`（見下） | 刪除群組只解析腳本一次 |

**環境注意（非 core 套件綠燈的前提）**：engine、producer、cli、studio-server 在 vitest 的 node 條件下把 `@hyperframes/core/atomic-file` 解析到 `packages/core/dist`，那是被 git 忽略的建置產物。dist 是舊的時候，這些套件得到 `TypeError: createStagingDir is not a function`（engine 首次執行 162 failed／12 errors，cli 首次執行 144 failed）；在 `packages/core` 以 `node ../../node_modules/typescript/bin/tsc` 加 `node ../../scripts/rewrite-relative-import-extensions.mjs dist` 重建後，結果見下。CI 先建置所以不受影響；本機移植觸及 `packages/core/src` 時要先重建。

**受影響套件的聚焦結果（重建 core dist 之後，採用 #7338 的樹）**：
- core 3 檔：見上表。`bun run --filter '*' typecheck` 15 個套件全部 exit 0；`cd packages/core && bun run typecheck` exit 0；`bun run --filter "@hyperframes/core" test:hyperframe-runtime-ci` exit 0。
- cli `src/capture src/cloud src/registry`：102 檔，8 failed 檔／90 passed／4 skipped，8 failed／1029 passed／50 skipped 例。
- engine `aacEncode`、`audioMixer`、`audioVolumeEnvelope`、`chunkEncoder`、`urlDownloader`：19 檔，1 failed 檔／18 passed，363 passed／4 skipped 例。
- studio-server `src/helpers`：44 檔，2 failed 檔／40 passed／2 skipped，3 failed／623 passed／8 skipped 例。
- producer（逐檔）：`mp4Stitch.test.ts` 13 pass、`planV2.test.ts` 67 pass、`audioPadTrim.test.ts` 45 pass、`assemble.test.ts` 20 pass（bun）；`captureHdrResources.test.ts` 36 passed（vitest）；失敗見下。

**既有失敗（在乾淨 HEAD `f3cab380a` 同樣失敗，與本批無關）**：把本批變更暫存起來後，在乾淨工作樹逐檔重跑，失敗集合完全相同：
- cli：`captureCompositionFrame.{lateImage,lateSubresources,slowScript,pageCrash,prelaunch}.browser.test.ts` 5 檔 6 例（`explainChromeLaunchFailure` 無法啟動 Chrome）、`navigateForCapture.browser.test.ts` 與 `captureCompositionFrame.webglDraws.browser.test.ts` 兩個套件層級失敗（子測試 skipped）、`cloud/offload.undecodableTrack.test.ts` 2 例；共 8 檔，與採用後樹的 8 failed 檔一致。
- engine：`audioMixer.undecodableTrack.test.ts` 套件層級失敗（3 例 skipped）。
- studio-server：`hfIdPersist.test.ts` 2 例（`EPERM: operation not permitted, rename`）、`undecodableAudioTrack.test.ts` 1 例，共 3 例。
- producer：`renderDirOwner.test.ts` 的 `reclaims only render temp dirs whose owner on this host has exited` 1 例、`planV2RemoteFiles.test.ts` 的 `probes the video by URL and publishes it by digest` 1 例。
- parsers：`assetResolution.test.ts` 的符號連結 `EPERM`（本機帳號不能建符號連結），先前清冊已記。
- 一次把 producer 的 `src/services/distributed src/services/render` 全部餵給單一 `bun test` 行程會有 38 個失敗，那是 bun 的 `mock.module` 在同一行程內互相污染（`run-test-lane.mjs` 註解已說明），不是本批造成；逐檔執行後只剩上列兩例。另一次整組執行在 14 分鐘後仍卡在 headless Chrome，已終止並改逐檔。

### PR 軸

| PR | 裁決與理由 | 上游證據 | fork 證據 |
| --- | --- | --- | --- |
| [#7453](https://github.com/heygen-com/hyperframes/pull/7453) | MERGED（`3ff0b3d`），不適用（見 commit 軸）；不釘 | 見 commit 軸 | 見 commit 軸 |
| [#7454](https://github.com/heygen-com/hyperframes/pull/7454) | MERGED（`fc13420`），已採用（見 commit 軸）；審查時是 open，head `b8a354e28`，`gh pr diff` 讀過全文，與合併內容相同 | 見 commit 軸 | 見 commit 軸 |
| [#7455](https://github.com/heygen-com/hyperframes/pull/7455) | MERGED（`b95ab79`），延後（見 commit 軸）；機器重生的 codegen PR 不釘 | 見 commit 軸 | 見 commit 軸 |
| [#7456](https://github.com/heygen-com/hyperframes/pull/7456) | MERGED（`4d29a64`），已採用（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7459](https://github.com/heygen-com/hyperframes/pull/7459) | MERGED（`4b3f70f`），已採用（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7462](https://github.com/heygen-com/hyperframes/pull/7462) | monitored（open，釘 head `4e2c961c4`）：`fix(cli): clear stale beat grids when reanalysis finds no beats`，修 issue #7461。讀全文 diff（3 檔 +52／−10）：`beats` 指令重新分析時若新音軌沒有節拍，刪掉該音軌已存的 `beats/…json`（只動那一個檔，解碼失敗時保留），`docs/packages/cli.mdx` 補說明，兩個新測試。`git apply --check` 失敗於 `beats.ts:1` 與 `beats.test.ts:146`（本線 `beats` 的 import 區塊與符號連結測試不同）。重訪條件：合併、關閉或 head 移動 | `packages/cli/src/commands/beats.ts` | `tools/upstream_baseline.json` |
| [#7463](https://github.com/heygen-com/hyperframes/pull/7463) | MERGED（`6f90980`），已採用（見 commit 軸） | 見 commit 軸 | 見 commit 軸 |
| [#7464](https://github.com/heygen-com/hyperframes/pull/7464) | MERGED（`9e346f9`），不適用（見 commit 軸）；審查時是 open（head `ec4a6adf1`），`gh pr diff` 讀過全文，與合併內容相同；版號 PR 不釘 | 見 commit 軸 | 見 commit 軸 |
| [#7466](https://github.com/heygen-com/hyperframes/pull/7466) | monitored（open，釘 head `45315cb6c`）：`fix(player): unload the video when its src is cleared`，修 issue #7465。讀全文 diff（4 檔 +38／−2）：`<hyperframes-player>` 的 `src` 移除或設為空字串時，移除 `<video>` 的 `src` 並 `load()`，播放狀態重設為暫停在 0:00，補文件與測試；補丁乾淨可套用（`git apply --check` rc 0）。重訪條件：合併（合併後與 #7462 一起進下一批）、關閉或 head 移動 | `packages/player/src/hyperframes-player.ts` | `tools/upstream_baseline.json` |
| [#7467](https://github.com/heygen-com/hyperframes/pull/7467) | monitored（open，釘 head `337aa38e6`）：`docs(cli): pin npx in unattended runs and verify the render`。讀全文 diff（5 檔 +43／−5）：`hyperframes-cli` 技能的 unattended 參考與 `docs/packages/cli.mdx` 說明無人值守時要固定 `npx` 版本、渲染後用 `ffprobe` 驗尺寸與長度；牽動 `skills-manifest.json` 雜湊與 `scripts/check-core-skills.mjs` 預算，`git apply --check` 失敗於 `docs/packages/cli.mdx:130` 與 `check-core-skills.mjs:15`。重訪條件：合併、關閉或 head 移動 | `skills/hyperframes-cli/references/unattended.md` | `tools/upstream_baseline.json` |
| [#7468](https://github.com/heygen-com/hyperframes/pull/7468) | monitored（open，釘 head `31d1eb7dd`）：`feat(cli): carry the motion blur summary on the @hf-result line`。讀全文 diff（6 檔 +167／−9：`render.ts` 把 `job.perfSummary?.motionBlur` 帶進 `@hf-result` 結果行、`ui/renderResult.ts` 輸出 `motion_blur`（`tier`、`movers`、`failed_frames`、14 項計數的 `fingerprint`）、`renderMotionBlur.ts`、`README.md` 說明與兩份測試）。`git apply --check` 失敗於 `packages/cli/README.md:104` 與 `render.ts:509`（本線的 `@hf-result` 說明與呼叫處不同）。重訪條件：合併、關閉或 head 移動 | `packages/cli/src/ui/renderResult.ts` | `tools/upstream_baseline.json` |

### issue 軸

| Issue | 裁決與理由 | 證據 |
| --- | --- | --- |
| [#7457](https://github.com/heygen-com/hyperframes/issues/7457) | 已由已採用的 commit 修復：Studio 繞過既有跨專案渲染鎖。CLOSED，由 #7459（`4b3f70f`）修；本線 `studioServer.ts:709` 已加鎖 | `gh issue view 7457`：CLOSED；`bf266f367` |
| [#7458](https://github.com/heygen-com/hyperframes/issues/7458) | 記錄、不動（OPEN，沒有對應 PR）：擷取與軟體 H.264 編碼重疊時 CPU 過度訂閱，回報者說 Windows 整機卡頓。回報自述為程式碼檢視、沒有量測；本線有同樣的程式路徑（`encodeStage.ts:299` 的 `canEncodeWhileCapturing`、`softwareEncoderThreads.ts:9` 預設 `availableParallelism()`）。x264 的位元流取決於執行緒數（`softwareEncoderThreads.ts:5` 的註解），改執行緒預算會改輸出位元組，不能當成無風險修正；先量測再決定，ROADMAP 中期表新增一列 | `gh issue view 7458`：OPEN；`packages/producer/src/services/render/stages/encodeStage.ts:299` |
| [#7460](https://github.com/heygen-com/hyperframes/issues/7460) | 已由已採用的 commit 修復：刪除動畫群組時重複解析 GSAP 腳本。CLOSED，由 #7463（`6f90980`）修 | `gh issue view 7460`：CLOSED；`bf266f367` |
| [#7461](https://github.com/heygen-com/hyperframes/issues/7461) | 記錄、不動（OPEN）：`beats` 換成沒有節拍的音軌後保留舊節拍格；已由 open PR #7462 追蹤並釘選 | `gh issue view 7461`：OPEN |
| [#7465](https://github.com/heygen-com/hyperframes/issues/7465) | 記錄、不動（OPEN）：清掉 player 的 `src` 後前一支影片仍在播；已由 open PR #7466 追蹤並釘選 | `gh issue view 7465`：OPEN |

### 釘選移動（11 筆）

每筆都用唯讀 `gh pr view` 取當下 head 與狀態，重釘值取自該輸出。

| 釘選 | 移動 | 裁決 |
| --- | --- | --- |
| #6732 | open（head `b10fd340b`）→ closed（merged `0ca2b1ae9`，head `b10fd340b`） | 已採用（見 commit 軸），重釘 closed |
| #7209 | open（head `bdd392275`）→ open（head `661738246`） | 讀 diff（`gh pr diff`，4 檔 +94／−7：`timedClipHide.ts`／`mediaVolumeEnvelope.ts` 與兩份測試，volume 探測掃描期間解除 until-first-pass 的隱藏，避免 GSAP 把繼承的 `hidden` 記成 autoAlpha tween 的起始值）；補丁乾淨可套用，仍 open，維持「合併後驗 first-pass hide 在 volume sweep 的 detach／restore」；重釘新 head |
| #7266 | open（head `952fd2bb3`）→ open（head `405c0f4cc`） | 讀 diff（2 檔 +24：`captureCompositionFrame.ts` 的上傳方法清單加 `texSubImage2D`、`copyTexImage2D`、`compressedTexImage2D`、`compressedTexSubImage2D`，與 `webglDraws.browser.test.ts` 的上傳計數）；補丁乾淨可套用，仍 open，症狀為 macOS 專屬；重釘新 head |
| #7269 | open（head `8a67eeb08`）→ closed（merged `a4e16d8`，head `e41481839`） | 不適用（見 commit 軸），重釘 closed |
| #7338 | open（head `e1f7af513`）→ closed（merged `b59fa2083`，head `e1f7af513`） | 採用（見 commit 軸），重釘 closed |
| #7372 | open（head `78bc9c15c`）→ open（head `7e2492fda`） | GitHub 的 `gh pr diff` 回 HTTP 406（314 檔超過 300 檔上限，因為分支落後主線）。改用唯讀 `git fetch upstream refs/pull/7372/head` 後 `git diff upstream/main...FETCH_HEAD`：merge-base 是 `4d29a64b0`，實際只有 4 檔 +27／−4（`skills/media-use/scripts/transcribe.mjs` 轉送 `--language`、其測試、`transcribe.md`、`skills-manifest.json` 雜湊）；補丁失敗於 `skills-manifest.json:18`（需重生雜湊），仍 open，維持原判定；重釘新 head |
| #7416 | open（head `baaa8b499`）→ closed（未合併，作者關閉） | 讀 diff（`gh pr diff`，0 行增減，只有 `.claude-plugin/marketplace.json` 改名為 `marketplace.plugin`，similarity 100%）：本線 `packages/cli/src/utils/skillsManifest.test.ts:181` 讀 `.claude-plugin/marketplace.json`，改名後該測試找不到檔，不採；重釘 closed |
| #7433 | open（head `1acab6672`）→ open（head `c1b07657d`） | 讀 diff（`gh pr diff`，46 檔 +7695，新增 `hyperframes init --timeline`、`docs/guides/import-from-otio.mdx`、`docs/schema/timeline-import.json`、`init.timeline.test.ts` 等，並動 `AGENTS.md`、`CLAUDE.md`、`README.md`、`.github/workflows/ci.yml` 這些本線有 fork 改寫的檔）；`git apply --check` 失敗於 `ci.yml:168`、`AGENTS.md:8`，功能屬 OTIO 匯入新指令，維持「合併後逐檔判定，不得蓋掉 fork 的 AGENTS.md／README／CI」；重釘新 head |
| #7435 | open（head `9186556a9`）→ open（head `6fcef7788`） | 讀 diff（`gh pr diff`，10 檔 +504／−23：`scripts/lint-skills.ts` 新增 `lintSkillPaths`、`buildSkillIndex`、`isWithin` 與一份 allow 標記語法，`lint-skills.test.mjs` 對應測試，並修正技能文件裡過期的路徑，例如 `changelog-video` 的 `skills/hyperframes-media/scripts/heygen-tts.mjs` 改為 `skills/media-use/audio/scripts/heygen-tts.mjs`）：PR 仍 open；`git apply --check` 失敗於 `skills-manifest.json:14`、`skills/media-use/audio/references/tts.md:75`，且 `skills/style-sampling/references/remix.md` 在本線不存在。維持「合併後逐檔判定」，重釘新 head |
| #7437 | open（head `aebfb99bb`）→ closed（merged `7bf19ab`，head `cdba44b11`） | 延後（見 commit 軸），重釘 closed |
| #7439 | open（head `de40901bb`）→ closed（merged `48a2b4e`，head `de40901bb`） | 採用（見 commit 軸），重釘 closed |

### 新釘選

#7462（head `4e2c961c4`）、#7466（head `45315cb6c`）、#7467（head `337aa38e6`）、#7468（head `31d1eb7dd`）四筆 open PR，monitored 由 165 增為 169 筆。#7453、#7455、#7464 依規則不釘（週報、機器重生的 codegen、版號 PR）。

### 隱藏內容掃描（判準八）

掃描新增行：空白夾內容（`\S\s{40,}\S`）、`eval(`／`new Function(`、`globalThis.`／`global.require`、`atob(`／`fromCharCode`／`Buffer.from(…base64)`、120 字元以上的 base64、240 字元以上的 hex、零寬與雙向控制字元、400 字元以上單行。
- commit 軸：12 個 commit 共 2,330 行新增行（206、32、28、88、43、11、1、24、158、1482、142、115）。0 個隱藏內容命中；400 字元以上單行兩處：`3ff0b3d` 的 22 行週報散文（所有連結都指向 `github.com/heygen-com/hyperframes` 的 commit／pull 與一個 `static.heygen.ai` 影片網址）、`7bf19ab` 的 `package.json` 一行 `test:scripts` 指令串。
- PR 軸（`gh pr diff` 讀目前 head，#7372 用三點 diff；#7464 已合併，內容併入 commit 軸的 115 行）：#7462（52）、#7466（38）、#7467（43）、#7209（94）、#7266（24）、#7372（27）、#7433（7695）、#7435（504）、#7468（167），共 8,644 行新增行。0 個隱藏內容命中；#7433 有 9 行超過 400 字元（技能清單、技能選擇器與 OTIO 文件的散文段落）與 4 行「空白夾內容」（Markdown 表格欄位對齊填充），#7435 有 1 行超過 400 字元（技能說明文字）。
- #7338、#6732 等已合併的 PR 內容就是 commit 內容；本批沒有再被強推換版的 open PR（#7269 在 2026-11-09 17:41:44Z 強推過一次，已重讀並隨後合併）。

### 預算、LFS 與延後

- 無新 LFS 物件；`packages/producer/tests/*/output/compiled.html` 的 10 筆工作樹差異是 LFS 還原差異，沒有暫存，也不在任何 commit 內。
- `scripts/package-size-budgets.json` 本批無變動；`createStagingDir` 使 `@hyperframes/core` 的 `atomicFile` 約增 27 行，**沒有重新量 packed 大小**（需全套件建置與 pack，由 ROADMAP 近期的 core 大小列承接）。
- 無 `skills/` 變動，`skills-manifest.json` 無需變動（#7454 動的是 `.agents/skills`、`.claude/skills` 內部技能，不在 manifest 內；`node scripts/check-skill-mirror.mjs` 回報 24 個檔案兩份鏡像逐位元相同）。
- 維持延後：#7443／#7444／#7452 一組（隨遙測政策與 reverse／templates 引入）、#7450 路由表一列，以及先前所有延後項目；新增延後 #7455（隨雲端用戶端整批同步）、#7437（隨 blur differential harness 一組）。

### 最新剩餘快照（水位 `9e346f9bb`，PR #7468，issue #7465）

2026-11-10 `python tools/check_upstream_updates.py --strict` exit 0：commit 軸 `No new upstream commits`（behind 0）；PR 軸 `Triaged through #7468`、`No new items above that number`；issue 軸 `Triaged through #7465`、`No new items above that number`；monitored 169 筆，`Every pinned item is still at the head and state it was judged at`。
