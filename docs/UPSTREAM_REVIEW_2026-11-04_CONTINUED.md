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

採用項與上游作者（供 Co-authored-by）：#6842 的 offload 部分（WaterrrForever `miao.yang@heygen.com`）、#7013 的 autoUpdate 部分（Wenbo Zhu `wenbo_zhu@berkeley.edu`）、#7088／#7093／#7097／#6745／#6919／#7096／#6947／#6928（Miguel Ángel `miguel.sierra@heygen.com`）。每項先把測試放到舊碼：

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

採用項與上游作者（供 Co-authored-by）：#7143、#7151、#7155、#7154 皆為 Miguel Ángel `miguel.sierra@heygen.com`。每項先把測試放到舊碼：

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
