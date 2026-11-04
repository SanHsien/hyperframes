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
