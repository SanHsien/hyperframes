# 2026-11-04：接續上游逐筆審查

## 範圍與讀法

起點為 fork `6d29b2631` 與 `tools/upstream_baseline.json` 的 commit `4c1c1782a`、PR #7025、issue #7113。起始 strict 檢查在固定上游 `183614bda3df15812d9f18fd4a71ee77a7da6387` 列出 67 個 commit 與 22 筆 monitored 變動；#7053 已審，故 commit 真正未審 66 筆。PR 持續新增，計數以結束 strict 回報為準。

以下審 18 個 commit：連續前 14 筆 `e8ffaa410..8a6636efe`（兩端含），以及 PR 軸涉及的 `a5a612133`、`b84835c41`、`3baf81f9a`、`05ddddbbf`。PR #7026–#7049 間實際有 23 筆（#7035 是 issue）；另重審 3 筆 monitored 變動。各軸重疊，數字不可加成獨立修正數。判斷依實際補丁、相關測試與本線程式，不以標題或檔案統計代替。

`SHA:檔案:行號` 指該上游提交內容；PR 表的行號指所列 head 的 diff；「本線」指 `6d29b2631` 加 #7049 最小移植。完整水位仍只涵蓋連續區段，不代表採用上游整套產品。

## Commit 裁決（18 筆）

| Commit／PR        | 檔案行號證據                                                                                                                                                                                                                                          | 裁決與重訪條件                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `e8ffaa410` #7028 | `packages/core/src/runtime/init.ts:4783` 註冊 context 復原、`:4794` 先偏移 timeline 再 seek；`runtime/vfx.ts:571` 等全部 context 恢復才重建。本線 `init.ts:4603` 只初始化 VFX，`:161` 無復原 import。                                                 | 延後：屬 runtime seek／VFX 生命週期整合。引入 GPU 復原或本線重現 context loss 時，驗 paused／playing、多 context、重複 mount 與 cleanup；不僅搬事件 listener。                                   |
| `0bcd816d5` #7029 | `packages/engine/src/config.ts:310` 預設 `useInPageEncode: false`；`services/chunkStreamingEncoder.ts:38` 直接 mux H.264，`:55` 共用新抽取的 FFmpeg stream；`inPageEncodeEligibility.ts:16` 判斷 HDR、透明與 workers 等條件。                         | 延後：預設關閉的新編碼路徑，不是既有編碼的獨立修正。明確需要 page encoder 時，驗色域、幀數、abort／backpressure、各拒絕條件與舊 JPEG 路徑。                                                      |
| `acd5c30e6` #6993 | `packages/cli/src/audio/read/describe.ts:26` 使用 HeyGen messages；`:130` 把音訊編為 base64、`:144` POST；`read.ts:393` 起擴充分析輸出，`effects.ts:393` 起移除聲音種類分類並追來源。                                                                 | 不適用本地維護範圍：新增帳戶服務、音訊上傳與輸出契約。維護者明確引入該服務時，連同憑證隔離、離線 fallback、cache revision 與輸出相容性一起重審。                                                 |
| `472b750ac` #7033 | `packages/cli/src/cloud/offload.ts:589` 依 magic bytes 決定 as-is，`:456` probe 是否有 video stream；`offloadSniff.ts:3` 起按容器分類，測試涵蓋 AAC 假 MP3 與 audio-only MP4。                                                                        | 延後：會改雲端上傳／轉碼選擇與 cache key，不是本地輸出修正。使用 cloud heavy-media export 或同步 offload 鏈時，驗錯副檔名、probe 失敗、trim、快取與上傳上限。                                    |
| `3bb0a9a5b` #7027 | `packages/engine/src/services/screenshotService.ts:170` 先送無 screenshot 的 BeginFrame，`:178` 截圖不更新 display；`:117` 清快取，`frameCapture.ts:4508` 外部 BeginFrame 後失效。本線 `screenshotService.ts:159` 仍一呼叫擷取。                      | 延後：改確定性擷取時序。採 BeginFrame 效能同步時，用 headless-shell 驗靜止重用、逐 rAF 變色、外部 BeginFrame 與 seek 後不可回傳舊幀，不能只靠 mock。                                             |
| `01c0bf496` #6967 | `packages/core/src/runtime/captureMotionBlur/discover.ts:296` 的 `scanMovers` 在 `:323` loud rewind；本線同檔 `:184` 只有 `discoverMovers`，`index.ts:247` 直接呼叫，沒有 events-aware 掃描入口。                                                     | 不適用目前程式：本線未引入被修的 loud／quiet 雙掃描。同步事件感知 motion blur 時必須含此修正，驗從影片中段起始的 call 狀態與 filter fallback。                                                   |
| `2bdc866c8` #6975 | `packages/core/src/runtime/captureMotionBlur/index.ts:68` 定義低 specificity canvas translate，`:174` 注入捕捉樣式；新增測試檢查樣式文字，沒有瀏覽器像素證明。                                                                                        | 延後：Chrome drawElementImage workaround 會影響巢狀 canvas。同步 capture blur 或本線重現偏移時，以瀏覽器 fixture 驗 layout offset、原有 translate 優先序與 capture／preview 畫格後採用。         |
| `398ef5062` #7037 | `.codex-plugin/plugin.json:4` 與各 manifest 升 0.9.6；`releases/v0.9.6.md:5` 宣告尚未採用的音訊、Safari、WebGL 與帳戶功能。                                                                                                                           | 不適用：不以改 manifest 宣稱整版已同步。完整產品同步該版時重訪。                                                                                                                                 |
| `4ef8c1de5` #7040 | `releases/v0.9.6.md:18`、`:19`、`:25` 補 cloud sniff、motion blur 與 BeginFrame，`docs/changelog.mdx` 同步四筆缺漏。                                                                                                                                  | 不適用：本線未採這些產品行為，不能匯入成 fork 發行說明。同步對應產品時一併重訪。                                                                                                                 |
| `6feb4bec7` #7032 | `docs/weekly-updates.mdx:28` 宣告 0.9、Windows Studio 與 span render；`:30` 起要求 Plan v2 並移除 v1。                                                                                                                                                | 不適用：上游週報不能代表本線已提供未同步功能。整批產品同步或維護上游發行歷史時重訪，保留上游 attribution。                                                                                       |
| `de2603e63` #7045 | `packages/cli/src/commands/auth/login.ts:127` 改成只擋 CI，讓非 TTY 執行 device flow；本線同檔 `:120`、`:121` 仍要求 attended terminal，測試對無 TTY 原本拒絕。                                                                                       | 延後：放寬認證操作邊界，非純錯字修正。維護者需要 agent／SSH device login 時，先驗 CI 拒絕、URL／code 輸出、取消／timeout 與登入資料保存，不執行實際登入 smoke。                                  |
| `b22af8f25` #7044 | `scripts/package-size-budgets.json:55`、`:56` 提高 studio-server packed／unpacked 預算。                                                                                                                                                              | 不適用目前產品差異：不為尚未採用的 preview 功能放寬體積 gate。採用那些功能後，以實際打包量與成長原因重訂預算。                                                                                   |
| `eb3562966` #6589 | `packages/core/src/runtime/mediaProxy.ts:402`、`:411` 加 playhead poster URL；`packages/studio-server/src/helpers/proxyTranscoder.ts:1107` 產 JPEG，`routes/preview.ts:745` 起新增 still 服務。本線 `routes/preview.ts:741` 直接進 ETag，沒有該分支。 | 延後：跨 runtime／server／cache 的預覽功能。需要不支援 codec 的等待畫面時，同步驗 authored poster 不覆蓋、time／variant 輸入拒絕、safePath、FFmpeg 失敗、cache sweep 與 copy 完成後移除 poster。 |
| `8a6636efe` #7049 | `packages/cli/src/utils/updateCheck.ts:122` 用已安裝版本過濾快取；本線同檔 `:119` 共用 helper 由 `_meta` 與 fallback 使用。`updateCheck.test.ts:453` 以固定 mock 驗較舊正式版／prerelease、同版與較新版，無套件版本斷言。                             | 採用最小修正：保留原 helper 與更新節奏，只增加版本下限判斷；較舊快取的 JSON 欄位省略，fallback 回報目前版本。整批同步含此修正時移除 fork 差異。                                                  |
| `a5a612133` #7031 | `packages/cli/src/heygen/reverse.ts:61` 把 server 的 null upgrade URL 保留為 null；`commands/reverse/start.ts:66` 起不再憑空產購買 fix，測試區分 absent／null。                                                                                       | 不適用目前本地範圍：依賴未採 reverse-session 帳戶導流。引入該流程時必須保留 null／absent 的區分，不可替伺服器發明購買連結。                                                                      |
| `b84835c41` #7041 | `packages/studio-server/src/routes/preview.ts:353` 加 scriptJson escape，`:361` 起對早期錯誤分類；保留原 messages 並另存 constructor／同源路徑分類，測試禁止新欄位含錯誤文字。                                                                        | 延後：屬預覽診斷協定擴充。需要 error-kind consumer 或同步 preview 時，驗 inline-script escape、跨源 unknown、訊息不流入分類欄位，並檢查本線 preview 注入差異。                                   |
| `3baf81f9a` #7046 | `packages/cli/src/commands/reverse/start.ts:29` 新增 billing subscribe command，`:63` 作為 refusal fix；`commands/billing.ts:48` 把 feature／rs 帶往付款頁。                                                                                          | 不適用本地維護範圍：帳戶購買歸因與自動等待流程。維護者明確需要該流程時連同 server gate、取消與付款授權邊界重訪。                                                                                 |
| `05ddddbbf` #7048 | `skills/reverse-any-video/references/start.md:13` 改 init --video；`:63` 起彙總所有拒絕步驟的 credit 再 top-up；`scripts/check-core-skills.test.mjs:34` 起新增文字契約。                                                                              | 不適用目前核心 skills 範圍：是未引入 reverse 工作流的成組操作指引，不能只挑付款步驟。引入 reverse skill 時檢查 init 參數、原音訊保留與明確付款邊界後重訪。                                       |

## PR 軸（23 筆）

Merged PR 核對 merge SHA 與上表；未合併項目讀取其目前 head 的實際 diff。Closed codegen PR 也讀了補丁，不以 closed 代替判斷。完整 head 另見表末快照。

| PR    | 檔案行號證據與裁決                                                                                                                                                                                                                                                                                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #7026 | closed；`packages/cli/src/cloud/_gen/types.ts:180` 刪除 page_motion_blur request 欄位。本線 `types.ts:186` 仍有欄位。不適用獨立採用；雲端 schema／CLI 選項成組同步時重訪。                                                                                                                                                                                           |
| #7027 | merged `3bb0a9a5b`；`packages/engine/src/services/screenshotService.ts:170`；延後至 BeginFrame browser 驗收，見 commit 表。                                                                                                                                                                                                                                          |
| #7028 | merged `e8ffaa410`；`packages/core/src/runtime/init.ts:4783`；延後至 context-loss 生命週期驗收。                                                                                                                                                                                                                                                                     |
| #7029 | merged `0bcd816d5`；`packages/engine/src/services/inPageEncodeEligibility.ts:16`；延後至 page encoder 功能需求與各拒絕條件驗收。                                                                                                                                                                                                                                     |
| #7030 | closed；`packages/cli/src/cloud/_gen/types.ts:180` 與 #7026 同樣刪 request 欄位；不適用單獨 codegen 覆蓋，雲端 schema／CLI 成組同步時重訪。                                                                                                                                                                                                                          |
| #7031 | merged `a5a612133`；`packages/cli/src/heygen/reverse.ts:61`；帳戶流程不適用，未來引入時保留 null 語義。                                                                                                                                                                                                                                                              |
| #7032 | merged `6feb4bec7`；`docs/weekly-updates.mdx:28`；上游週報不適用本線功能宣告，產品整批同步時重訪。                                                                                                                                                                                                                                                                   |
| #7033 | merged `472b750ac`；`packages/cli/src/cloud/offload.ts:589`；延後至 cloud offload 鏈驗收。                                                                                                                                                                                                                                                                           |
| #7034 | open；`packages/lint/src/rules/rootPaths.ts:29` strip CSS comments、`:35` 用 stripJsCode 過濾註解與字串；新增測試仍要求 executable fetch 被警告。本線 `rootPaths.ts:34` 仍直接 regex。延後至上游合併或本線有 false-positive fixture；採用前驗 template interpolation 與 active path 不漏報，加入 monitored。                                                         |
| #7036 | open；`packages/producer/src/services/distributed/renderSpan.ts:80` 將 local plan cap 改為 MAX_SAFE_INTEGER，integration 測試固定 1024-byte cap。`git ls-tree 6d29b2631 -- packages/producer/src/services/distributed/renderSpan.ts` 無輸出，本線沒有呼叫鏈。不適用目前程式；引入 span render 時同時驗 Lambda 仍受限，加入 monitored 並接續既有 issue #7035 裁決。   |
| #7037 | merged `398ef5062`；`.codex-plugin/plugin.json:4`；未採產品的版本宣告不適用，整版同步時重訪。                                                                                                                                                                                                                                                                        |
| #7038 | draft；`packages/core/src/runtime/captureMotionBlur/index.ts:151` 掃 scroll container、`:212` 保存 offsets，`:546` 起無 mover 時 unwrap；測試 `index.test.ts:1985` 起驗靜止、scroll 與短 shake，`gsap.steps.test.ts:839` 驗 call 不重複。延後至上游合併及 blur 前置鏈同步；須驗 seek／scroll、subpixel 與 scan 間短 motion，不以加速理由改捕捉預設，加入 monitored。 |
| #7039 | closed；`packages/cli/src/cloud/_gen/types.ts:39` 澄清 asset ID，`:53` 澄清 public URL，`:182` 刪 page_motion_blur。雲端 schema／CLI 成組同步時重訪，不獨立覆蓋 generated types。                                                                                                                                                                                    |
| #7040 | merged `4ef8c1de5`；`releases/v0.9.6.md:18`；未採行為的發行說明不適用，同步產品時重訪。                                                                                                                                                                                                                                                                              |
| #7041 | merged `b84835c41`；`packages/studio-server/src/routes/preview.ts:353`、`:361`；延後至 early-error 診斷 consumer／preview 同步與注入安全驗收。                                                                                                                                                                                                                       |
| #7042 | open；`docs/docs.json:1068` 起保留 Made by HeyGen footer；`docs/logo/dark.svg:1`、`light.svg:1` 改單行尺寸與 viewBox。延後至上游合併或 docs 品牌改版；驗深淺背景、可讀性、作者連結保留後採用，加入 monitored。                                                                                                                                                       |
| #7043 | closed；`packages/cli/src/cloud/_gen/types.ts:39`、`:53`、`:182` 與 #7039 同類 schema 補丁；不適用獨立覆蓋，schema／CLI 成組同步時重訪。                                                                                                                                                                                                                             |
| #7044 | merged `b22af8f25`；`scripts/package-size-budgets.json:55`；不適用尚未採功能的預算放寬，產品同步後實測重訂。                                                                                                                                                                                                                                                         |
| #7045 | merged `de2603e63`；`packages/cli/src/commands/auth/login.ts:127`；延後至明確非 TTY device-flow 需求與 CI／取消驗收。                                                                                                                                                                                                                                                |
| #7046 | merged `3baf81f9a`；`packages/cli/src/commands/billing.ts:48`；購買歸因流程不適用，明確引入才重訪。                                                                                                                                                                                                                                                                  |
| #7047 | closed；`packages/cli/src/cloud/_gen/types.ts:39`、`:53`、`:182` 與 #7039 同類 schema 補丁；不適用獨立覆蓋，schema／CLI 成組同步時重訪。                                                                                                                                                                                                                             |
| #7048 | merged `05ddddbbf`；`skills/reverse-any-video/references/start.md:13`、`:63`；不適用目前核心 skill 集合，引入 reverse 工作流才重訪。                                                                                                                                                                                                                                 |
| #7049 | merged `8a6636efe`；`packages/cli/src/utils/updateCheck.ts:122`；採用最小快取過濾，見 commit 表與下方回歸證據。                                                                                                                                                                                                                                                      |

## Monitored 重審（3 筆）

| PR    | 重新釘住的 head／state                             | 檔案行號證據與裁決                                                                                                                                                                           |
| ----- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #6967 | `8829228be61d899bfc6e7331cfc5bdb8ce1778d6`／closed | merge `01c0bf496` 的 `packages/core/src/runtime/captureMotionBlur/discover.ts:323`；head 未變、由 open 轉 merged。本線尚無 scanMovers，不適用目前程式；引入 events-aware scan 時連修正移植。 |
| #6975 | `c0468ee7ae5d07969c80cd8b271079b2c80c8c4f`／closed | merge `2bdc866c8` 的 `packages/core/src/runtime/captureMotionBlur/index.ts:68`；head 未變、由 open 轉 merged。延後至本線 nested-canvas 瀏覽器重現或 blur 同步。                              |
| #6993 | `631b21d967986c9815e80200a8eeef1065745614`／closed | merge `acd5c30e6` 的 `packages/cli/src/audio/read/describe.ts:130`、`:144`；由 draft 轉 merged 並改 head。帳戶音訊上傳功能不適用本地維護範圍，明確引入服務時重訪。                           |

## 採用與驗證邊界

#7049 的根因為 safeCachedVersion 只驗格式，未比較目前已安裝版本；同一 helper 同時供 JSON metadata 與快取 fallback 使用。最小修正增加版本下限，沒有改 network check、auto-update、registry 格式驗證與 daily cadence。測試使用明確 mock 的版本組合，驗的是版本序關係，不綁產品或依賴版本。

`bun run --cwd packages/cli test -- src/utils/updateCheck.test.ts`：舊碼 2 failed／40 passed（較舊正式版與 prerelease 仍洩漏至 metadata）；修正後 42 passed，exit 0。`bun run --cwd packages/cli build` exit 0，ESM 與 DTS build success。#7015、sharp 0.35.5 與 #7053 既有採用保留。

commit 水位只推進連續 14 筆至 `8a6636efe36c3ec313aeb4a122f875b687ffdc5d`，PR 至 #7049，issue 保持 #7113。固定上游 `183614bda` 在新 commit 水位以上有 53 筆，其中 #7053 與上表 4 筆額外提交已審，因此真正未審 48 個 commit；結束 strict 列 PR 水位以上 82 筆（至 #7133），扣既有已審 #7053，真正未審 81 筆；monitored 22 筆移動重審 3 筆後剩 19 筆。新增 4 筆條件追蹤，monitored 共 78 筆。下一個連續 commit 是 `81b93cf05`；計畫只在 ROADMAP 維護。

2026-11-04 結束的 `python tools/check_upstream_updates.py --strict` exit 1：53 個水位以上 commit、82 筆 PR、0 筆新 issue、19 筆 monitored 變動；扣除上述 5 個已審 commit 與 PR #7053，真正未審為 48／81／0／19。保存的 PR head 快照之後又出現 #7131／#7132／#7133，均沒有裁決或推進水位。

## PR head 快照（2026-11-04）

| PR    | Head                                       | State  |
| ----- | ------------------------------------------ | ------ |
| #7026 | `cdf5b981d25000ef387625e4e8b7db027a076926` | closed |
| #7027 | `cbffe2414906c763ee1c47c6e9e98f428a0401f8` | merged |
| #7028 | `1cefca8f2052fe84ebc9d32c6d538f6e2b00af5b` | merged |
| #7029 | `dca10dc832236400c2bc218ae2a64b9a2928bc7e` | merged |
| #7030 | `535e2b3239f862447b37bc92bed859551c5c1638` | closed |
| #7031 | `83323e4a6fbad10a86fe37557f118c8b598eab0f` | merged |
| #7032 | `4826bdcebf46754feda29bb00bed9dba46c8ae4c` | merged |
| #7033 | `1f8176477a747a2c146307df86ac854cd550761b` | merged |
| #7034 | `2a5cf57de7dd3db6c500f662a788424b7ff4691d` | open   |
| #7036 | `2fbb1e75a548a662e05dfa5748ba1caa09ae4636` | open   |
| #7037 | `e957a3f1ac28d62c542610b04757c03faf727c73` | merged |
| #7038 | `4eaa2558213300972e495b0791036b02cd0c23fe` | draft  |
| #7039 | `7be912057d14abff3990b7a21225d6aef7da20d8` | closed |
| #7040 | `c04e3261b78f364474f1854158f1dbeabde57a3c` | merged |
| #7041 | `a745dab7094722598a7639a26d65310870ed12c6` | merged |
| #7042 | `4f1d7caa23ff64cffadd3c4d87c1005bf1aa91f9` | open   |
| #7043 | `56dfd634086b73babe248b69a0ee18f2d2b38360` | closed |
| #7044 | `c016c07c1929b7833ffec60ae2ec6f9c3f8072ea` | merged |
| #7045 | `caf6b701b63260039f19706afca9bb9c02001143` | merged |
| #7046 | `48c2ff038d42c6a850cba3c63f1b89a8af0ca911` | merged |
| #7047 | `eca5082248b400e59ad5bf52a35e489b5e1f8a43` | closed |
| #7048 | `ae19827f2b6b52e6ecbea3e7feb7f2158aedea7e` | merged |
| #7049 | `ccddbf645bb8445d2666d8f3eb27a27f1456a0a6` | merged |
