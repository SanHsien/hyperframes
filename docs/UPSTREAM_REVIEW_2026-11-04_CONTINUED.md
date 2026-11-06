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

### 收尾 strict 快照（剩餘數量的單一記錄處）

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

### 收尾 strict 快照（本節為剩餘數量的單一記錄處）

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

### 收尾 strict 快照（剩餘數量的單一記錄處）

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

#### 水位與最新剩餘範圍

`python tools/check_upstream_updates.py --strict` exit 1：2026-11-06 收尾快照剩 36 個 commit（從 `b96d3c8` #7231 起）、85 筆 PR（#7190 以上）、9 筆 issue（#7223 以上）；92 筆 monitored 無差異。commit 只推進連續 15 筆至 `659ef568d`；PR／issue 水位不以已審 commit 的 PR 清單代替連續審查。ROADMAP 近期列保留。

上游作者：Miguel Ángel（#7214、#7212、#7221、#7222、#7228）、WaterrrForever（#7089）、Vance Ingalls（#7191）、James Russo（#7211）。Co-authored-by email 僅在交付回報提供，不寫入文件。
