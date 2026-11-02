# 2026-11-02 上游審查清冊

來源：[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)。範圍：`4e2a1c215a42c6d262b8c635df9d5edff80e8830..cd5984261a6cae06e91e7e796b9360a33d80ee1b`，195 個 commit；PR 編號 >6755 共 244 筆（176 merged、46 open／draft、22 closed 未合併）；issue 13 筆；monitored 既有 24 筆。上一份清冊見 [UPSTREAM_REVIEW_2026-10-29.md](UPSTREAM_REVIEW_2026-10-29.md)。

## 範圍與證據

- 本線產品碼落後上游：`git diff 4e2a1c2 HEAD --name-only -- packages skills` 有 616 個檔案不同，所以多數上游修正依賴本線沒有的重構，不能逐筆直接套。每個 commit 都跑 `git diff <sha>^ <sha> | git apply --check` 作為相容證據：195 筆中 75 筆可乾淨套用（含下列 5 筆已採），其餘 120 筆與現行檔案衝突。乾淨套用只表示補丁不衝突，不表示依賴齊全。
- 176 筆 merged PR 都在上述 commit 範圍以 `(#N)` 找到對應 commit，PR 軸與 commit 軸一對一，沒有遺漏。另外 monitored 中 11 筆舊 PR 已 merged（#6670、#6671、#6687、#6702、#6711、#6715、#6716、#6750、#6751、#6754、#6755），其內容同樣在 commit 軸。
- 隱藏內容掃描（判準八）：對 46 筆 open／draft 與 22 筆 closed 未合併 PR 的目前 head 全部取 `gh pr diff`，掃新增行的「40 字元以上空白後接內容」「`eval(`／`new Function`／`globalThis`／`atob(`／`fromCharCode`」「100 字元以上 base64」「500 字元以上單行」「零寬與雙向控制字元」。命中只有：Markdown 表格欄位對齊的空白（#6842、#6858、#6873、#6968）、測試中的 `vi.spyOn(globalThis, "fetch")`（#6993）、文件與 registry 範例的長句（#6842、#6877）。沒有行尾藏碼。對 `4e2a1c2..cd5984261` 整份 diff（排除文件、JSON、HTML、鎖檔）的 26649 個新增行同樣掃描，空白、`eval(`、`new Function(`、base64、零寬字元皆 0 筆。
- 查詢：`python tools/check_upstream_updates.py --strict`、`gh pr list --repo heygen-com/hyperframes --state all --limit 500 --json ...`、`gh pr diff <N>`、`gh issue view <N> --json state,body,comments,closedByPullRequestsReferences`。
- 不是整樹逐行安全審計：commit 軸依主旨、變更檔與補丁相容性分類；Windows、安全、遙測與帳戶相關項另讀 diff。

## 本輪採用（5 筆，皆為 Windows 或必炸的小修正）

| 上游 | 本線改動 | 證據 |
| --- | --- | --- |
| #6771 `6874cc289` | `packages/cli/src/browser/manager.ts` 新增 `removeLeftover`：`rmSync` 加重試，EBUSY／EPERM 時略過，下次清理再試 | 補丁乾淨；`manager.test.ts` 新增 Windows 鎖檔案例通過 |
| #6605 `4cabfd18a` | `batchRender.ts` 讀批次檔改用 `decodeJsonText`（`jsonFlag.ts` 匯出），支援 PowerShell 5.1 的 UTF-16LE／BOM；`docs/concepts/variables.mdx` 補一句 | 補丁乾淨；`batchRender.test.ts` 兩種編碼案例通過 |
| #6611 `3245b769a` | `studio-server` 的 `backupJournal.ts`：base64url 檔名超過 200 字元改 `sha256~<hex>`，prune 同時比對兩種鍵；`docs/packages/studio-server.mdx` 補說明 | 補丁乾淨；`backupJournal.test.ts` 與新增 `files.longPaths.test.ts` 通過 |
| #6800 `64d190e34`（issue #6756） | `core/src/figma/motionContextToDocs.ts` 的 `arrayAfterKey`／`scalarAfterKey`／`balancedBlock` 查 key 加字邊界，`y` 軌不再抄到 `opacity` 的值 | 補丁乾淨；還原修正後新增的 3 個案例 failed，修後 `packages/core` 的 `src/figma` 16 檔 176 通過 |
| #6831 `6f2b07227`（issue #6830） | `jsonFlag.ts` 的 `readJsonFlagText` 不再用展開合併 io，`readFile: undefined` 不會蓋掉預設 | 本線實測有缺陷：`variables.ts:67` 傳入可能為 undefined 的 `readFile`；還原修正後 `plan.test.ts` 新增案例 1 failed，修後綠 |

驗證：`npx vitest run` 於 `packages/cli`（`src/browser/manager.test.ts`、`src/commands/batchRender.test.ts`、`src/utils/jsonFlag`、`src/commands/render/plan.test.ts`）與 `packages/studio-server`（`backupJournal.test.ts`、`files.longPaths.test.ts`）全綠；`oxfmt --check` 與 `oxlint` 對變更的 TS 檔 0 錯誤。先 `bun run --filter "@hyperframes/{parsers,lint,studio-server}" build` 與 `bun run --cwd packages/core build`（產物被忽略，不入 commit）。

## 刻意不採的 Windows／相容性項目

| 上游 | 裁決與理由 |
| --- | --- |
| #6776 `0a18d8c35`（browser clear 報告 Windows 仍持有的資料夾） | 延後：`manager.ts:926` 附近與本線不同，補丁衝突；#6771 已涵蓋會讓 run 失敗的路徑，`browser clear` 的訊息改善留給產品同步。 |
| #6845 `16e2e4c6b`（BOM JSON：timeline plan、grade、motion spec） | 延後：13 個檔衝突（`batchRender.ts`、`lambda/policies.ts` 等）；#6605 已涵蓋批次檔。 |
| #6956 `8b029f4fb`（檔案 URL 與 Git Bash 路徑） | 延後：補丁動 `.github/workflows/windows-render.yml`，與本線 Windows workflow 衝突；須單獨驗證 parsers 與 render 路徑。 |
| #6580 `88f9ae846`（UTF-16 頁面） | 延後：`packages/lint/src/project.ts` 衝突，跨 core／lint 9 個檔。 |
| #6847 `6aa9c78bd`、#6925 `889144940`（Windows 結束時遙測遺失；暫存夾不可寫時靜默） | 延後：補丁乾淨但改遙測傳輸（改成寫暫存檔再由子行程讀取），屬 ROADMAP 既有「遙測邊界」；本線先決定遙測政策。 |
| #6789（未合併，Windows 瀏覽器關閉時結束整棵 Chrome 樹） | 不採：作者於 2026-10-30 自行關閉，留言「假設未在真 Windows 執行器上顯示；沒有修正時測試也過（run 41002532567）」。觸發條件：上游重開含真實重現的 PR。 |

## Commit 軸（195 筆）

欄位「套用」：`乾淨`＝補丁對現行工作樹 `git apply --check` 通過；`衝突`＝不通過。已採的 5 筆因已套用，顯示為衝突，裁決欄為準。

| Commit | 日期 | PR | 套用 | 主旨 | 裁決 |
| --- | --- | --- | --- | --- | --- |
| `3e462f427723e81352fea956b155848428cf1319` | 2026-10-29 | #6687 | 衝突 | feat(cli): use dedicated HyperFrames OAuth clients (#6687) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `d81099b1ff1a0638fc0ff0a13d3be09722978f7b` | 2026-10-29 | #6760 | 衝突 | fix(cli): Apple Silicon skips an ffprobe or ffmpeg that cannot run and names it (#6760) | 延後：產品同步批次；與現行檔案衝突 |
| `f7db6ba40cb2f95390513dc76ad0a9e83b490673` | 2026-10-29 | #6758 | 衝突 | chore: release v0.8.218 (#6758) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `aa094f385838cbaca4f85036a6cbe5905c88f2ee` | 2026-10-30 | #6766 | 乾淨 | fix(cli): render with no -o writes to the project's renders folder from any directory (#6766) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `9c01e2e1213f89451b7f19c4883f60899aa8910d` | 2026-10-30 | #6767 | 乾淨 | fix(cli): normalize-audio never cuts a clip that is quieter than the target (#6767) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `6874cc289012f31a0c9441d7fff12a277080c077` | 2026-10-30 | #6771 | 已採 | fix(cli): a locked Chrome debug.log on Windows no longer fails check, snapshot or render (#6771) | 採（移植）：Windows 上被執行中的 Chrome 鎖住 debug.log 時，清理殘留改為重試後略過 EBUSY／EPERM；`git apply` 乾淨、`manager.test.ts` 通過 |
| `f523ee2fcacdbe792561209dd8309cb01a116fff` | 2026-10-30 | #6770 | 乾淨 | fix(cli): check flags caption words hidden behind a cut-out and ignores a mostly transparent cover (#6770) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `c5a52037c92c07bbb151a33e0f3ee2febe4fe91e` | 2026-10-30 | #6762 | 乾淨 | fix(core): a still sub-composition's data-no-timeline on its template root skips the timeline wait (#6762) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `a30a5209709fa7d5aceab56b02a4d817a6d8553b` | 2026-10-30 | #6775 | 衝突 | chore: release v0.8.219 (#6775) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `471d60a8ac5f5a9824c5dde6c8d487bd0e436174` | 2026-10-30 | #6768 | 乾淨 | fix(core): the playhead keeps moving at a cut while the incoming take has not started (#6768) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `d1c0593717d50fe4cd374775f8519df22b6ed517` | 2026-10-30 | #6769 | 乾淨 | fix(cli): text-to-speech ignores a foreign PYTHONPATH when it looks for kokoro-onnx (#6769) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `0a18d8c3508474dd938a9f31cb354c026b6fb290` | 2026-10-30 | #6776 | 乾淨 | fix(cli): browser clear reports a browser folder Windows still holds (#6776) | 延後：產品同步批次（Windows 相關）；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `8fb08f2a7c8cb481f21e937aac86aaa0d55c7edd` | 2026-10-30 | #6764 | 乾淨 | fix(engine): a render no longer waits for a sub-composition timeline no script can register (#6764) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `a66b2c80352b6da6c742ab4f86dd228c11453085` | 2026-10-30 | #6774 | 衝突 | fix(cli): anonymous hosts and host in-points move a caption word's lifetime window (#6774) | 延後：產品同步批次；與現行檔案衝突 |
| `54c98b590672b76e548b3ecef4624b44ce5b2df4` | 2026-10-30 | #6772 | 乾淨 | fix(engine): a video on a non-square pixel grid renders at its display shape (#6772) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `c922591c6c495d90693cbc459fec4b62e93c0634` | 2026-10-30 | #6777 | 衝突 | ci: edit accuracy shards start once the CLI is built, not after all of Build (#6777) | 跳過：上游 Linux／merge queue CI 配置；本線 CI 為 Windows 單一路徑，另配 gate 時才看 |
| `6c78dee99348b057b5d7a0dee01882a8e75b8481` | 2026-10-30 | #6773 | 乾淨 | perf(studio): a long project's timeline stops redrawing every clip when its elements change (#6773) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `6b7e2c96eb5f4ccb0677db7ab267013fb4adfb5c` | 2026-10-30 | #6670 | 乾淨 | ci(windows): split the engine-cli test lane into two shards (#6670) | 跳過：上游 Linux／merge queue CI 配置；本線 CI 為 Windows 單一路徑，另配 gate 時才看 |
| `360ca9cf61f712e96c72dd42a90dd131ab712662` | 2026-10-30 | #6781 | 衝突 | chore: release v0.8.220 (#6781) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `21eefcd006f895ee41641de65392b56c7b7e6c0a` | 2026-10-30 | #6779 | 乾淨 | fix(cli): hyperframes docs motion-blur shows the motion blur guide (#6779) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `9fd90d23c4cc1208965c2179cd25a6d871246df9` | 2026-10-30 | #6785 | 乾淨 | fix(core): long cut-list edits play every cut without dropped or late frames (#6785) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `8c36f3254f0b98aa097f9b02d229d69596a592c2` | 2026-10-30 | #6783 | 乾淨 | fix(cli): check no longer flags a hidden scene child or a small animated sprite (#6783) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `2a9dd059830437403c755c49fd465b570b8c6d6b` | 2026-10-30 | #6784 | 衝突 | ci(studio): split edit accuracy into 15 PR shards packed by measured case time (#6784) | 跳過：上游 Linux／merge queue CI 配置；本線 CI 為 Windows 單一路徑，另配 gate 時才看 |
| `7f7a4af7c48b736fb678d83047ab76af7ca7983a` | 2026-10-30 | #6791 | 衝突 | fix(cli): add takes several names in one call, and adopted audio is labelled voice or sfx (#6791) | 延後：產品同步批次；與現行檔案衝突 |
| `27e16becb1e9888a83df0b664a4fcdb932ce4c71` | 2026-10-30 | #6793 | 乾淨 | test(cli): a failed late-image snapshot reports why it failed (#6793) | 跳過：只動測試；隨對應產品修正一起移植 |
| `f43bec76e7ceef13e65b930496f7e1f66779250b` | 2026-10-30 | #6797 | 乾淨 | docs(studio-app): pending video edits have no cap of 10 (#6797) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `3e795ece0fec8ef5331058566893f85a50605070` | 2026-10-30 | #6782 | 乾淨 | fix(cli): preview stops at once on Ctrl+C after Studio was open (#6782) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `b3c47a36a2bd8dff5bbf3753e3e6fe97d013c42b` | 2026-10-30 | #6798 | 衝突 | fix(cli): snapshot probes each video clip once for all the times it is asked for (#6798) | 延後：產品同步批次；與現行檔案衝突 |
| `32c01c99a1bbe12e329c4d5812995b07600a1a8a` | 2026-10-30 | #6792 | 乾淨 | fix(registry): caption components keep the last phrase until its last word ends (#6792) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `36cf990d99a6c585c2d28219823134b5743e5ee1` | 2026-10-30 | #6795 | 乾淨 | test(studio): edit accuracy screenshots are viewport-only and taken in the confirmation re-runs (#6795) | 跳過：只動測試；隨對應產品修正一起移植 |
| `47a1a92064cef4cf6602199ece1b32b8c16a22ae` | 2026-10-30 | #6799 | 衝突 | fix(cli): a missing registry item names the closest ones, and a blocked browser says how to allow it (#6799) | 延後：產品同步批次；與現行檔案衝突 |
| `f4bbbe10741bbcfe2ae866203611797e4a1999d4` | 2026-10-30 | #6802 | 衝突 | chore: release v0.8.221 (#6802) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `b93c01c75a06f45d5eaca90bb22a56f4507581d0` | 2026-10-30 | #6804 | 衝突 | ci(studio): run the merge queue edit accuracy grid in 30 shards (#6804) | 跳過：上游 Linux／merge queue CI 配置；本線 CI 為 Windows 單一路徑，另配 gate 時才看 |
| `d83f2767436ef85260a42e6c548f9609f99b11ba` | 2026-10-30 | #6805 | 乾淨 | perf(studio): films with thousands of timed clips stop re-reading every clip each frame (#6805) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `07c714ce9b139500465b37174971e5f288b854a9` | 2026-10-30 | #6794 | 乾淨 | fix(core): the first cut after Play starts on time instead of running ahead (#6794) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `0bd1fd59721a2660d07474e1628e18d6c1ced09f` | 2026-10-30 | #6808 | 衝突 | fix(cli): add says --dir is the project root when the folder is missing (#6808) | 延後：產品同步批次；與現行檔案衝突 |
| `71b668010f9bffb8f50b43c623679d4759c0a5ec` | 2026-10-30 | #6807 | 衝突 | fix(cli): the ignored-binary note names only the missing binary, and covers .hyperframes/bin (#6807) | 延後：產品同步批次；與現行檔案衝突 |
| `b239d8dea93b4a25fe548d23e879dd0fc16df0ef` | 2026-10-30 | #6790 | 衝突 | docs(readme): link the desktop app download for macOS, Windows and Linux (#6790) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `10a4ed56cb09159afec0dba3ea784e3162ee2e71` | 2026-10-30 | #6759 | 衝突 | fix(engine): a video clip starting between frames shows its media on the right frame (#6759) | 延後：產品同步批次；與現行檔案衝突 |
| `279d40dcd75e3d074149b18dc5b297608dcf0540` | 2026-10-30 | #6811 | 衝突 | test(engine): the rotated-clip fixture builds on ffmpeg older than 6 (#6811) | 跳過：只動測試；隨對應產品修正一起移植 |
| `2f8b8c47e02a7eae0644d644616b7d3f50618c5d` | 2026-10-30 | #6814 | 衝突 | fix(producer): a render that stalls before its first frame says which worker phase it was in (#6814) | 延後：產品同步批次；與現行檔案衝突 |
| `a3730712618c1b39520d760a85168178e5869ab0` | 2026-10-30 | #6812 | 衝突 | feat(cli): beats analyses an audio or video file given directly (#6812) | 延後：產品同步批次；與現行檔案衝突 |
| `054592c4dea41d894824d29feacfd216850e1fb9` | 2026-10-30 | #6817 | 衝突 | fix(cli): check sees an image swap even when the page cannot read the image's pixels (#6817) | 延後：產品同步批次；與現行檔案衝突 |
| `315969cda01aeb6e3e8a9102249f7b6bca9eabbb` | 2026-10-30 | #6819 | 衝突 | fix(cli): render names the FFmpeg that has no libx264 and how to point at another (#6819) | 延後：產品同步批次；與現行檔案衝突 |
| `d4a866d612ed8bba2eed0b3594adc1dd805c14c0` | 2026-10-30 | #6818 | 衝突 | fix(cli): check no longer calls text occluded by a cover that a CSS mask paints through (#6818) | 延後：產品同步批次；與現行檔案衝突 |
| `536209da07b48d77b300a7659ab07a38195d07c2` | 2026-10-30 | #6822 | 衝突 | fix(producer): report extract_video progress while ffmpeg extracts frames (#6822) | 延後：產品同步批次；與現行檔案衝突 |
| `44ee07a2da79f58bd3147a61b3e544745390e7d9` | 2026-10-30 | #6823 | 乾淨 | fix(cli): check drops a request a network change cut when the file loads again (#6823) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `01783f3757be1cb45246e180b3891a376461375f` | 2026-10-30 | #6820 | 乾淨 | feat(cli): review notes name the command that reviews the cuts inside a sub-composition (#6820) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `bb2c8142fd726c9f2bdb827d7b79b311341195af` | 2026-10-30 | #6825 | 乾淨 | perf(studio-server): add createProjectSignatureAsync so project open stops blocking the loop (#6825) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `88d8e5b490c268d60b6942b96a0c71deaefc40f9` | 2026-10-30 | #6824 | 乾淨 | fix(cli): check and snapshot load GSAP from the bundled copy, not jsDelivr (#6824) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `b20d0a62ce1d1c573c3344b544851875bd2b157c` | 2026-10-30 | #6826 | 乾淨 | fix(studio): a split at a clip's edge leaves the file unchanged (#6826) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `ef2159fe8c05d89dbdb75a7d38b7c6a67763ad67` | 2026-10-30 | #6821 | 衝突 | fix(cli): capture retries without WebGL when the page stops answering under software GL (#6821) | 延後：產品同步批次；與現行檔案衝突 |
| `8142d6d59f84d83dd91dc15e34e92bd753e6b296` | 2026-10-30 | #6828 | 乾淨 | test(cli): capture watchdog tests use a fake output folder outside the temp dir (#6828) | 跳過：只動測試；隨對應產品修正一起移植 |
| `bf47178937d210c269ac8e737f5f5d7f24b74d82` | 2026-10-30 | #6827 | 乾淨 | fix(lint): a font the project's root stylesheet declares counts for its sub-compositions (#6827) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `cb2389cf35aedbe88fa634fb0a6af27242e93660` | 2026-10-30 | #6754 | 衝突 | feat(skills): reverse any video on the HyperFrames plan (#6754) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `6f2b072275b6107c253fd61edebe107cbd3c8275` | 2026-10-30 | #6831 | 已採 | fix(cli): --variables-file and --variables <path> read the file again (#6831) | 採（移植）：`readJsonFlagText` 的展開讓 `readFile: undefined` 蓋掉預設，`--variables-file` 必炸；本線實測重現（還原修正後新測試 1 failed），修後綠 |
| `6a8c064fb96e68e365b91063f511a3cd934794f7` | 2026-10-30 | #6835 | 衝突 | fix(producer): render telemetry names content gates instead of calling them disabled (#6835) | 延後：遙測邊界（ROADMAP 既有項），本線保留遙測分歧；先決定遙測政策再移植 |
| `3ebf888fb69bcf462c177d2042ed33b5d6501b1e` | 2026-10-30 | #6838 | 乾淨 | fix(cli): point a brace-stripped JSON flag value at the file and stdin forms (#6838) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `4ba01be1519a27c6363d2afca088924de99a895d` | 2026-10-30 | #6836 | 衝突 | fix(cli): history show --diff names a changed video or audio file instead of refusing (#6836) | 延後：產品同步批次；與現行檔案衝突 |
| `746ce956b322128e93fc768bc1a6b20573a43eab` | 2026-10-30 | #6837 | 乾淨 | test(history): the write-timing test no longer depends on how late its timers fire (#6837) | 跳過：只動測試；隨對應產品修正一起移植 |
| `b45e602faad84d947d80e1bbb75331b3314a8132` | 2026-10-30 | #6840 | 衝突 | revert: feat(skills): reverse any video (#6754) (#6840) | 不採：撤回上游同日功能（#6754），後由 #6833 重上 |
| `5a164fb3693d522ef163570bde82b10af47d2322` | 2026-10-30 | #6834 | 衝突 | feat(cli): render --start and --end render only that span of the film as its own MP4 (#6834) | 延後：產品同步批次；與現行檔案衝突 |
| `4da50e221842f97dafebe5004225bd7e11443586` | 2026-10-30 | #6839 | 乾淨 | feat(telemetry): render_complete splits capture time into seek, page, screenshot and encoder wait (#6839) | 延後：遙測邊界（ROADMAP 既有項），本線保留遙測分歧；先決定遙測政策再移植 |
| `6cddd1a24043ce852bcca3e4cf59378a02d400d1` | 2026-10-30 | #6844 | 乾淨 | feat(lint): warn when a url() in a linked stylesheet does not resolve beside it (#6844) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `28181602fe2d9ffa38474a6e8155a89909a7b8aa` | 2026-10-30 | #6803 | 乾淨 | docs(quickstart): drop the stale 'if you are on Windows' line (#6803) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `a06fdfe26ea27794b3a2723777b10d71130b2dfd` | 2026-10-30 | #6711 | 乾淨 | docs(catalog): put each item page's title, description and Docs text in the server HTML (#6711) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `a6dec0701f550c6bbf06c6e8506360f2b1373a52` | 2026-10-30 | #5568 | 衝突 | fix(media-use): keep the network cause in Gemini TTS errors (#5568) | 延後：產品同步批次；與現行檔案衝突 |
| `fc3d0a5fce9a898ba10b7529e7cc7b644d48bf4a` | 2026-10-30 | #6399 | 衝突 | fix(core): load responsive images from their scene (#6399) | 延後：產品同步批次；與現行檔案衝突 |
| `f64b0282238236bd0cab15ab0ba1525755d94411` | 2026-10-30 | #6456 | 乾淨 | fix(cli): count line_unread words from the block's rendered text (#6456) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `0a304f2aa67a49606a30201d2e7869240e0fe25a` | 2026-10-30 | #6497 | 衝突 | fix(cli): read a comment after an empty .env value as no value (#6497) | 延後：產品同步批次；與現行檔案衝突 |
| `b54de2c9e14f580d21dfc269d749201eed6eb91e` | 2026-10-30 | #6514 | 乾淨 | fix(parsers): validate slideshow time bounds before playback (#6514) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `4cabfd18a256210ff8d9295f5016cccf3454cce9` | 2026-10-30 | #6605 | 已採 | fix(cli): render batches read PowerShell JSON files (#6605) | 採（移植）：PowerShell 5.1 寫的 UTF-16LE／BOM 批次 JSON 可讀；`batchRender.test.ts` 兩種編碼案例通過 |
| `3245b769aa5ec10b6af4fcc9c5c6539d1df764a2` | 2026-10-30 | #6611 | 已採 | fix(studio-server): keep long file paths from blocking saves (#6611) | 採（移植）：備份檔名超過 200 字元改用 sha256，修 Windows 檔名／路徑長度造成儲存被擋；`backupJournal.test.ts`、`files.longPaths.test.ts` 通過 |
| `64d190e34fcb3e8bad13e1ef98aa39b494b7c742` | 2026-10-30 | #6800 | 已採 | fix(core): prevent Figma motion property key collisions (#6800) | 採（移植）：Figma 動作鍵以不含字邊界的查找互相碰撞（issue #6756）；本線 `motionContextToDocs.ts` 有同缺陷，還原修正後新測試 3 failed，修後 `src/figma` 176 通過 |
| `ee7059d4d23f434af0bc710771b31e49391bbe4e` | 2026-10-30 | #6815 | 乾淨 | fix(parsers): treat any URL scheme as non-relative in isNonRelativeUrl (#6815) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `1116077dabf5bacde60e566578e85068e6777b17` | 2026-10-30 | #6853 | 衝突 | fix(cli): capture treats only 192.0.0.0/24 and 192.0.2.0/24 as reserved, via one shared list (#6853) | 延後：產品同步批次；與現行檔案衝突 |
| `e28dbe4ce48842cfbeab34a1bf0090fd9e428b6d` | 2026-10-30 | #6846 | 衝突 | chore: release v0.8.222 (#6846) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `3d942ee9210a166a53a6497b76aa323acc8e95bc` | 2026-10-30 | #6841 | 乾淨 | fix(producer): HDR renders report their encoder wait in render telemetry (#6841) | 延後：遙測邊界（ROADMAP 既有項），本線保留遙測分歧；先決定遙測政策再移植 |
| `16e2e4c6b5579a0ccefbfc7bd6991ec23a6f8c75` | 2026-10-30 | #6845 | 衝突 | fix(cli): read BOM-prefixed JSON files for timeline plans, grades and motion specs (#6845) | 延後：產品同步批次（Windows 相關）；與現行檔案衝突 |
| `6aa9c78bd87d6215ad7c599e4caf44331b39a645` | 2026-10-30 | #6847 | 乾淨 | fix(cli): exit-time telemetry no longer loses a render's events on Windows (#6847) | 延後：遙測邊界（ROADMAP 既有項），本線保留遙測分歧；先決定遙測政策再移植 |
| `80f9350da21b54741d392c684511b6f93a00026c` | 2026-10-30 | #6850 | 乾淨 | fix(cli): remove-background gathers each decoded frame in linear time (#6850) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `aafbd96b77702f295c77de1430dfcb14302e4958` | 2026-10-30 | #6851 | 乾淨 | fix(core): same-time sets at 0 land in authored order on the first frame (#6851) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `ef9155fee13cf8a65282e1681ac2761edcb1fcc2` | 2026-10-30 | #6852 | 衝突 | fix(cli): say stdin was empty when a JSON flag reads - and nothing is piped (#6852) | 延後：產品同步批次；與現行檔案衝突 |
| `0708f6ca7dc0718487a2d0a066853b87db92a1aa` | 2026-10-30 | #6829 | 衝突 | fix(lint): a timeline registered in a local script file counts as registered (#6829) | 延後：產品同步批次；與現行檔案衝突 |
| `e342a9099162b6a5d4ad89d9a986203c2b548091` | 2026-10-30 | #6832 | 乾淨 | fix(history): reading a project's history no longer rewrites its record (#6832) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `9b0df610cca45bb1bc8bacec78059d3c4443ec09` | 2026-10-30 | #6855 | 乾淨 | perf(studio): a long timeline no longer lays itself out on every render while it settles (#6855) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `359b6c8a3877039068711915d94323f7e777f5e6` | 2026-10-30 | #6856 | 衝突 | feat(core): playback health reports how long a video on screen showed no moving picture (#6856) | 延後：產品同步批次；與現行檔案衝突 |
| `4cee7be834c18b571da1cfcda6e3eaeca7689855` | 2026-10-30 | #6860 | 乾淨 | docs: one Docs menu and Catalog in the top bar (#6860) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `443ded42615f81fd5a4b97d34318676fb76957bd` | 2026-10-30 | #6859 | 乾淨 | fix(player): preview voice no longer goes silent while other tracks play (#6859) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `5169422a8a424fadbb97424a95316a63343eb4f2` | 2026-10-30 | #6809 | 衝突 | fix(lint): the podcast-lanes.html page Desktop writes is not a second root composition (#6809) | 延後：產品同步批次；與現行檔案衝突 |
| `f2358315e59731833334c5d881a7fb5543c22a97` | 2026-10-31 | #6833 | 衝突 | feat(skills): re-land reverse any video on the HyperFrames plan, with clearer credit wording (#6833) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `5e4f5aefb58a9996ea5920f008184e9789346871` | 2026-10-30 | #6865 | 乾淨 | fix(core): motion blur preview no longer slows down later in the timeline (#6865) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `2439b62acd88eb98148d63aedbc7ad54513c7e3b` | 2026-10-30 | #6869 | 衝突 | chore: release v0.8.223 (#6869) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `2bd8cd95cb43fba47de906530e043900bb283371` | 2026-10-31 | #6870 | 衝突 | refactor(core): split the frozen-picture judgement so it stays under the complexity limit (#6870) | 延後：產品同步批次；與現行檔案衝突 |
| `164d6c7a36eba26e9126b364beab98437e2eeec7` | 2026-10-30 | #6602 | 衝突 | fix(studio-server): download exports larger than 2 GiB (#6602) | 延後：產品同步批次；與現行檔案衝突 |
| `a04b45a6db0d1f724be9cf1985c3b13657195f0d` | 2026-10-31 | #6876 | 乾淨 | docs: list OpenAI and Nate Herk as HyperFrames adopters (#6876) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `0c16afd949f2511ca17347eaa113640df0bac1e5` | 2026-10-31 | #6854 | 衝突 | fix(core): Safari stops chopping audio by seeking it over and over during playback (#6854) | 延後：產品同步批次；與現行檔案衝突 |
| `168429d514ccefdfc5658138fb58426cf0e66e01` | 2026-10-31 | #6755 | 乾淨 | fix(studio): preserve identity for stale metadata completions (#6755) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `60f711686ccae602caaed24faa3e225be6d96b12` | 2026-10-31 | #6671 | 乾淨 | fix(producer): auto renders with color-graded media stay SDR instead of promoting to HDR (#6671) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `4d6d38519d06b650a5d4f55c5cc7ba854c0993ad` | 2026-10-31 | #6715 | 衝突 | refactor(cli): proxy failure wording without added comments or a try/catch (#6715) | 延後：產品同步批次；與現行檔案衝突 |
| `124a00f563944a006dd9ac286ecb91043b0fa0b9` | 2026-10-31 | #6874 | 乾淨 | fix(studio-server): repeated splits stop stacking id CSS rules (#6874) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `5c92fb07761cd0667d22380c2c855b89766f8fa4` | 2026-10-31 | #6843 | 乾淨 | fix(core): style a sub-composition root written as #root[data-composition-id] (#6843) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `1e5413f34ce489a1b35eaf46635a630a44cb5804` | 2026-10-31 | #6596 | 衝突 | fix(core): a stuck seek in check or snapshot fails named before the protocol timeout (#6596) | 延後：產品同步批次；與現行檔案衝突 |
| `ea7d43c616c4cd3bb77f27eaf9f3becd32e41744` | 2026-10-31 | #6848 | 衝突 | fix(cli): stopping remove-background on a Mac no longer aborts the process (#6848) | 延後：產品同步批次；與現行檔案衝突 |
| `2b76e9a70a749c445cd137946512b0dda8aa770f` | 2026-10-31 | #6884 | 衝突 | feat(skills): render final cuts in the cloud on a paid HyperFrames plan (#6884) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `6b0fd6d10992ebf5913dcc8418b7b8b58803f035` | 2026-10-31 | #6886 | 衝突 | fix(skills): paid-plan cloud final keeps the composition fps and high quality (#6886) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `2239771efd9ef8ed34171fe40dcdc096f33ec856` | 2026-10-31 | #6885 | 衝突 | chore: release v0.8.224 (#6885) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `919e138fc25c5ae3dc6bc3ca46adc7f6b52cd0c8` | 2026-10-31 | #6892 | 衝突 | fix(cli): fill --mask boxes from the picture behind and crop generated clips to the requested aspect (#6892) | 延後：產品同步批次；與現行檔案衝突 |
| `4d44c0d0ab459e4defad0954480a0798f353e421` | 2026-10-31 | #6887 | 衝突 | fix(cli): billing top-up opens the pricing page (#6887) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `47fe68562f39d91b4d9280dff41ae43d67805fae` | 2026-10-31 | #6893 | 衝突 | fix(engine): nested video clips on a frame boundary export every source frame (#6893) | 延後：產品同步批次；與現行檔案衝突 |
| `b687d062353f2dd43a9a4b8b77aafeb1077b3875` | 2026-10-31 | #6898 | 衝突 | chore: release v0.8.225 (#6898) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `88f9ae8468f0ce9b09efbdf29720aec0f2eb3207` | 2026-10-31 | #6580 | 衝突 | fix(core): a page saved as UTF-16 bundles as its text, not NUL bytes (#6580) | 延後：產品同步批次（Windows 相關）；與現行檔案衝突 |
| `ee50cd2fc0d0fe4a4eac22683ed23b6066289ab3` | 2026-10-31 | #6895 | 乾淨 | fix(cli): cloud render uses the composition's data-fps and skips unused heavy files (#6895) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `5259097261a33c8c2aac8bcfa8c2a1b0eae5540f` | 2026-10-31 | #6894 | 衝突 | fix(cli): one cut detector that tells real cuts from flashes and fast moves (#6894) | 延後：產品同步批次；與現行檔案衝突 |
| `bb3c3b211840b08ff8889e021320ba5962f0f6e6` | 2026-10-31 | #6702 | 衝突 | fix(producer): render telemetry reports beyond-viewport capture as the workers used it (#6702) | 延後：遙測邊界（ROADMAP 既有項），本線保留遙測分歧；先決定遙測政策再移植 |
| `8a0b8a9c2224fc0fb4e9d239556fc63e7c6411d3` | 2026-10-31 | #6891 | 衝突 | fix(cli): measure ink, one output-folder flag spelling, logo wordmark variant (#6891) | 延後：產品同步批次；與現行檔案衝突 |
| `f3cdf2b4739d7012f67803668f47c5e22dd39408` | 2026-10-31 | #6901 | 乾淨 | fix(engine): scale static-frame verification budget with the job (#6901) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `5ce6b30bdbe18d5351c67b168d0e057d16d1d48c` | 2026-10-31 | #6897 | 衝突 | fix(cli): billing and Desktop handoff read their hosts from settings (#6897) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `bba3676a3705e1e51a239899404f9982fca86951` | 2026-10-31 | #6906 | 衝突 | feat(core): the playback health reading says which clock the film followed (#6906) | 延後：產品同步批次；與現行檔案衝突 |
| `32de0196d59f73d1f7512315eac1acb88dfd9e42` | 2026-11-01 | #6905 | 乾淨 | fix(producer): a failed video extraction names which clip files failed (#6905) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `ef0007b003384d321b90b7a9b7c0d4e06d014612` | 2026-11-01 | #6907 | 乾淨 | test(engine): run the non-PNG probe test on a fake clock (#6907) | 跳過：只動測試；隨對應產品修正一起移植 |
| `a2c5a8a0245ef770695212c14f1f3f21d90bf78d` | 2026-11-01 | #6902 | 衝突 | ci: split the cli test job into two shards so each stays well under its limit (#6902) | 跳過：上游 Linux／merge queue CI 配置；本線 CI 為 Windows 單一路徑，另配 gate 時才看 |
| `f486ad6d49c7c6880b83cad63ab99b764ba3bb36` | 2026-11-01 | #6909 | 衝突 | fix(engine): ffprobe read intervals never carry an exponent (#6909) | 延後：產品同步批次；與現行檔案衝突 |
| `94849bf1e0b3bdc2d5eb118b82109e310c4215b1` | 2026-11-01 | #6908 | 衝突 | refactor(engine): one builder for the video frame filter chain (#6908) | 延後：產品同步批次；與現行檔案衝突 |
| `52a42983db0e9b1db5d3ab0826f1686a09064462` | 2026-11-01 | #6910 | 衝突 | fix(cli): snapshot gives a seek that will not settle its own --timeout, not three minutes (#6910) | 延後：產品同步批次；與現行檔案衝突 |
| `2c1a10f3ad1fc2c356d3f9b4a4fd329a6900e806` | 2026-11-01 | #6888 | 衝突 | fix(core): Safari keeps playing edits' audio without seeks or rate changes (#6888) | 延後：產品同步批次；與現行檔案衝突 |
| `e181d34edc45e2f9590007ebf7318f8a139bf747` | 2026-11-01 | #6912 | 乾淨 | feat(core): WebKit plays bare audio from a decoded buffer on the audio clock (#6912) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `a7075fcb6c712e183736aac938d3ef57e8b12004` | 2026-11-01 | #6911 | 乾淨 | feat(studio): a host that draws its own loader can turn off both of Studio's preview loaders (#6911) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `98520366a6fccb0447a61f8e4baffa0f2568c359` | 2026-11-01 | #6914 | 衝突 | feat(producer): opt-in video layer passthrough for a lone full-canvas video (#6914) | 延後：產品同步批次；與現行檔案衝突 |
| `bbd487c6f8d216ab15041220a3e1131f5d543b84` | 2026-11-01 | #6916 | 衝突 | fix(cli): snapshot ends the process once its stills are saved, like render (#6916) | 延後：產品同步批次；與現行檔案衝突 |
| `f08f07ab64f834a5d0bb526fc360f5650b18d954` | 2026-11-01 | #6917 | 衝突 | chore: release v0.8.226 (#6917) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `8c22ddba0fda22c3ec6faa83f4686249804d299d` | 2026-11-01 | #6915 | 乾淨 | fix(cli): snapshot warns when self-closed audio or video clips have swallowed the page (#6915) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `e5887959bb7c23c45ea56d44d9e6f0929de4eb3d` | 2026-11-01 | #6918 | 乾淨 | fix(studio-server): a copy another process holds without progress ends in a named error (#6918) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `58428b44bcc412646086028be816d90f379f4af5` | 2026-11-01 | #6920 | 衝突 | fix(engine): passthrough keeps frame count and accepts films whose audio outlasts the picture (#6920) | 延後：產品同步批次；與現行檔案衝突 |
| `9aaa3ae675698fddb7459cca48cabf88a5ec08ec` | 2026-11-01 | #6926 | 乾淨 | fix(engine): a video with no source no longer holds capture for 45 seconds (#6926) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `af0d68d612ebd9c419f27d9ebc8068512667bae4` | 2026-11-01 | #6922 | 衝突 | fix(core): a resized preview video keeps its picture while its new copy loads (#6922) | 延後：產品同步批次；與現行檔案衝突 |
| `439d01784c58911208a2b2d39deb23454ab64260` | 2026-11-01 | #6924 | 衝突 | fix(cli): a shot from --first-frame comes back in that frame's shape (#6924) | 延後：產品同步批次；與現行檔案衝突 |
| `6b3e7a7a95e11d5d290123ea821b53109d6103c9` | 2026-11-01 | #6929 | 衝突 | fix(cli): check and snapshot free video clips the playhead left, halving memory on cut films (#6929) | 延後：產品同步批次；與現行檔案衝突 |
| `69400df27686b4e69f6ad9b5fe3652809222f775` | 2026-11-01 | #6923 | 衝突 | fix(cli): the cut detector keeps real cuts in live footage (#6923) | 延後：產品同步批次；與現行檔案衝突 |
| `a23cc59ee199d217f1a22b4d5cfb1cffa578df76` | 2026-11-01 | #6931 | 乾淨 | fix(studio): opening the thumbnail browser no longer stalls the server to read its version (#6931) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `ef250cc9d0deaf601315de097b575112ba455242` | 2026-11-01 | #6932 | 乾淨 | feat(cli): the api exports offloadHeavyMedia and every offloaded file reports its asset_id (#6932) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `90f7fe624f7972e1dea939c269bc590a920e2f91` | 2026-11-01 | #6930 | 衝突 | fix(engine): GPU renders use the NVENC preset names the host's ffmpeg lists (#6930) | 延後：產品同步批次；與現行檔案衝突 |
| `7aa3a447e255ed16c05c4daf504cc1b4f8608b59` | 2026-11-01 | #6936 | 衝突 | chore: release v0.8.227 (#6936) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `aa77770ebe03afbdd0316de29178a814967a76f4` | 2026-11-01 | #6933 | 衝突 | docs(skills): reverse-any-video gets a recipe for animated and painted films (#6933) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `f9e8cab67d948adbc115d3f3a0b271659e2521da` | 2026-11-01 | #6938 | 乾淨 | fix(cli): a render says when it lowered the whole mix, and how to keep the level (#6938) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `89a595316176b78ec96b94b57eada22fd1458a62` | 2026-11-01 | #6937 | 衝突 | fix(core): music keeps playing while a preview video swaps to a new copy (#6937) | 延後：產品同步批次；與現行檔案衝突 |
| `d1d631f60a6cc949c572831927c7fe86455b21f8` | 2026-11-01 | #6940 | 衝突 | fix(producer): an export over the ceiling limits its peaks and keeps the mix's level (#6940) | 延後：產品同步批次；與現行檔案衝突 |
| `12b52e28be2ee5c36a66c1a0522ebe45236d2dde` | 2026-11-01 | #6944 | 衝突 | docs(skills): reverse-any-video keeps what the original does when check flags it (#6944) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `3179348d9a080a9d77820a5c9790e255e2fbac7a` | 2026-11-01 | #6943 | 衝突 | chore: release v0.8.228 (#6943) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `0f76a7d01ed260670371e6b36ce3334a43ae1c91` | 2026-11-01 | #6946 | 衝突 | docs(skills): animated films in reverse-any-video decide code or generation per shot (#6946) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `7f8ae5b4b650c6b103e4547ddcfab9ed66e20e37` | 2026-11-01 | #6948 | 衝突 | fix(cli): a masked box follows the frame while the camera moves (#6948) | 延後：產品同步批次；與現行檔案衝突 |
| `6b0abb4eb52e9576b0c72b636254c87d0f9ad2a5` | 2026-11-01 | #6950 | 衝突 | fix(cli): a stale mask takes its frame's colours instead of delogo's streaks (#6950) | 延後：產品同步批次；與現行檔案衝突 |
| `0ab49311597ce1e01ae2f5e438276c5d313ba448` | 2026-11-01 | #6942 | 乾淨 | fix(studio): a clip's thumbnail strip stays put while you trim it (#6942) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `34ddced2d0e9350c2b6387b2365257bb7080e832` | 2026-11-01 | #6879 | 衝突 | fix(cli): keep browser sign-in open through checkout (#6879) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `5540f491219cedd8cbdcff8f48c296362377363e` | 2026-11-01 | #6951 | 衝突 | chore: release v0.8.229 (#6951) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `9284e69fff2af4928d41cc376f36d5cfbd789bfd` | 2026-11-01 | #6921 | 乾淨 | fix(core): accept 65-point .cube LUTs, the size grading apps export (#6921) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `7d8cdfbb8b609cbca98f93a60ee1ac8eb06bdf8d` | 2026-11-01 | #6953 | 衝突 | fix(studio): a preview reload that timed out is tried once more, so an edit is not left unseen (#6953) | 延後：產品同步批次；與現行檔案衝突 |
| `5c5794287bd0dc2c94f238ca89f4752ecaa045a2` | 2026-11-01 | #6952 | 衝突 | fix(cli): say a font or image URL is a download, not a page, when capture is given one (#6952) | 延後：產品同步批次；與現行檔案衝突 |
| `465128d00201dc931e2bee0396d07cdbe167ce4e` | 2026-11-01 | #6958 | 乾淨 | fix(cli): media-treatment says which media the file has when the selector matches none (#6958) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `8b029f4fb0ab9aa357759628acd7ba842a7c12bd` | 2026-11-01 | #6956 | 衝突 | fix(parsers): resolve file URLs and Git Bash paths in media sources (#6956) | 延後：產品同步批次（Windows 相關）；與現行檔案衝突 |
| `57d23598a7269ac7e4d9c01003eb8c6039ed198b` | 2026-11-01 | #6957 | 乾淨 | feat(studio): hosts can remap Studio's single-key shortcuts (#6957) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `de6ec3811ee53711409c504ebf75aa3ab63f17ca` | 2026-11-01 | #6716 | 衝突 | fix: cache paths follow HYPERFRAMES_CACHE_DIR (#6716) | 延後：產品同步批次；與現行檔案衝突 |
| `13b42bec3c934b012c6873fa0dcbb1e8bd2519ef` | 2026-11-01 | #6959 | 乾淨 | fix(shader-transitions): keep the loading panel out of snapshot and check captures (#6959) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `2bce65ee1b90a32fbdc9836d31048b3219194f14` | 2026-11-01 | #6960 | 衝突 | fix(cli): add the audio and transcribe topics to hyperframes docs (#6960) | 延後：產品同步批次；與現行檔案衝突 |
| `53c93ba68eefe57718d22568599035840906911b` | 2026-11-01 | #6941 | 衝突 | fix(cli): snapshot shoots a frame again when Chrome drops the screenshot mid-paint (#6941) | 延後：產品同步批次；與現行檔案衝突 |
| `fb2c28e8aaf66df71aa5b12ecec9ef338810b0ff` | 2026-11-01 | #6962 | 衝突 | chore: release v0.8.230 (#6962) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `6b008cbc2cc7f16b4db24d956e7e4f78627d2bbc` | 2026-11-01 | #6961 | 乾淨 | fix(lint): a scene may use Three.js or Lottie loaded by the parent document (#6961) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `7c5c1ce849a6b479f957b69de8dcac8db7eab127` | 2026-11-01 | #6954 | 乾淨 | fix(cli): the browser install hint names only a Chrome that exists (#6954) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `f8309b356ecc878418d780d7147d8644dd412292` | 2026-11-02 | #6964 | 衝突 | fix(cli): media-treatment reads a relative --grading file from the project folder (#6964) | 延後：產品同步批次；與現行檔案衝突 |
| `c06427b0637edcafc58f88db8c3e412b0349ee2d` | 2026-11-02 | #6969 | 衝突 | test(cli): run the real npx shim check only in its own CI job (#6969) | 跳過：只動測試；隨對應產品修正一起移植 |
| `9fa02badfc20319a292573333c72da715c263bcf` | 2026-11-02 | #6966 | 衝突 | feat(studio): every editor and player shortcut is remappable (#6966) | 延後：產品同步批次；與現行檔案衝突 |
| `f0b2dd0cdbd926e32cb11435c53819933fcc1ef3` | 2026-11-02 | #6971 | 衝突 | chore: release v0.8.231 (#6971) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `99223d993cf5ddf78f27ab87fc9b7009d79407a3` | 2026-11-02 | #6976 | 衝突 | fix(cli): diff warns when yours runs at another frame rate (#6976) | 延後：產品同步批次；與現行檔案衝突 |
| `7f48a6894c42426ae9bc8a913879d4cd0fb72166` | 2026-11-02 | #6970 | 衝突 | feat!: remove Plan v1 distributed transport (#6970) | 延後：破壞性變更（移除 Plan v1 分散式傳輸），須整批產品同步時評估 aws-lambda／producer 相容 |
| `8519f2836358499f36d3ba79ca3c16bc1318a97f` | 2026-11-02 | #6974 | 衝突 | fix(core): a preview video short of data holds the film instead of looping snippets (#6974) | 延後：產品同步批次；與現行檔案衝突 |
| `6bbda219bb25ab771c1b86df7b7e34c8eb0b9124` | 2026-11-02 | #6973 | 乾淨 | fix(core): a smaller preview copy nobody wants any more no longer swaps in (#6973) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `b1316e61d170d29067735150ebb5ab291e0f4171` | 2026-11-02 | #6978 | 衝突 | fix(cli): diff stops counting a fast move as an extra cut (#6978) | 延後：產品同步批次；與現行檔案衝突 |
| `f1391156e0316d145a0284d24ec483428187060d` | 2026-11-02 | #6980 | 衝突 | chore: release v0.9.0 (#6980) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `758759673bdd12ef007fc7315ecca1c721875f5a` | 2026-11-02 | #6985 | 衝突 | fix(aws-lambda): route an omitted PlanProtocol before comparing it (#6985) | 延後：產品同步批次；與現行檔案衝突 |
| `a17af79ab0cec11b97c1a682b2a7aa0ff35093c9` | 2026-11-02 | #6986 | 衝突 | docs(changelog): complete the v0.9.0 notes (#6986) | 跳過：上游文件；本線文件為繁中維護，隨產品同步一併處理 |
| `870569a431035743aac2028fa1d2a66ffe511725` | 2026-11-02 | #6987 | 衝突 | chore: release v0.9.1 (#6987) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `e5b10f8bc2316aa2b9bf27b67f27658fb0b1dc94` | 2026-11-02 | #6982 | 衝突 | feat(core): a heavy clip's lighter copy can be made ahead of time (#6982) | 延後：產品同步批次；與現行檔案衝突 |
| `5fca435623a5005def2c3d0e5a1c4195e8084a4c` | 2026-11-02 | #6979 | 衝突 | feat(studio): hosts can ask which action holds a key combination (#6979) | 延後：產品同步批次；與現行檔案衝突 |
| `26d6e3eef17d3f9b3d2764c7504a38e1bec0af97` | 2026-11-02 | #6984 | 衝突 | fix(engine): a scene that has ended gives up its WebGL context so the next scene is not slowed (#6984) | 延後：產品同步批次；與現行檔案衝突 |
| `5e50ac1c475f9446cd17a04f218194b555fa311f` | 2026-11-02 | #6994 | 衝突 | chore: release v0.9.2 (#6994) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `43f8b1a3fcfe14e7e128c31a3f91d275fe123105` | 2026-11-02 | #6999 | 衝突 | fix(lint): a helper script's timeline nested by the page is not reported as unregistered (#6999) | 延後：產品同步批次；與現行檔案衝突 |
| `aaa5b63f558adc8069ac56244c2d6da377923c89` | 2026-11-02 | #6996 | 乾淨 | fix(core): keep media prefetch queue ordered (#6996) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `a46412ee07fee0d91b29d62d92363dcad8cbbcd9` | 2026-11-02 | #6998 | 衝突 | fix(studio): a preview reload writes the composition as it is now, not as it was when it asked (#6998) | 延後：產品同步批次；與現行檔案衝突 |
| `618c486734b3cbb697bd432bace7e9642e48b6be` | 2026-11-02 | #6997 | 衝突 | fix(cli): measure and diff report why they failed, and reverse reports its runs (#6997) | 延後：產品同步批次；與現行檔案衝突 |
| `c54f84859d8ce2b1d13e351e4c9f8b1cdfcb06cc` | 2026-11-02 | #7002 | 衝突 | fix(studio-server): long media clips no longer leave the host unanswered (#7002) | 延後：產品同步批次；與現行檔案衝突 |
| `d17b958318b3616ede33dec84d7a1c3eb8bc4b5a` | 2026-11-02 | #7004 | 乾淨 | feat(studio-server): stamp a project hf-ids without holding the event loop (#7004) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
| `8089f0049ca68bd1f8f88d77838fa34f0459f869` | 2026-11-02 | #7006 | 衝突 | feat(skills): soft-launch reverse-any-video, and fix what Wanbi's Pro test found (#7006) | 不採：依賴 HeyGen 付費方案／雲端／帳戶，本線不操作帳戶也不發佈 |
| `f6536e9f5deab41ffe30132543ed1586e2b16088` | 2026-11-02 | #7010 | 衝突 | chore: release v0.9.3 (#7010) | 跳過：上游版號與 changelog；本線自有版號且不發 npm |
| `88914494011f3a8062a832d42e924392e15dc0c0` | 2026-11-02 | #6925 | 衝突 | fix(cli): exit-time telemetry stays silent when the temp folder cannot be written (#6925) | 延後：遙測邊界（ROADMAP 既有項），本線保留遙測分歧；先決定遙測政策再移植 |
| `cd5984261a6cae06e91e7e796b9360a33d80ee1b` | 2026-11-02 | #7005 | 乾淨 | fix(studio): an undo that drops the keyframes clears the transform the old preview still shows (#7005) | 延後：產品同步批次；補丁可乾淨套用但依賴上游其他變更未驗證 |
## 未合併 PR（46 open／draft、22 closed）

不採用者不代表內容無害：已掃隱藏內容（見上）。open／draft 與非機械的 closed 項已寫入 baseline `monitored`，釘完整 head 與狀態；機器重生的 `chore(codegen)` 與版號 PR 不釘。

| PR | 狀態 | 審查 head | 規模 | 內容與裁決 |
| --- | --- | --- | --- | --- |
| #6761 | open | `6929fdaaea4e669f3abc69420f6f08f3064c21cc` | 2 檔 +51/-9 | fix(engine): drawElement self-verify waits for colour-grading LUTs before its truth screenshot。延後：engine drawElement 自驗證等色彩 LUT，渲染路徑，隨產品同步。 |
| #6763 | closed | `22ca582efae7fcf50cc3088e7da6202fcb87c975` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF 632956b6。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6765 | closed | `9052b7d6e3510dd3bf1d8cb00f8d79e48c474475` | 3 檔 +39/-11 | perf(studio): a long project's clips get their durations in one update per source。不採：上游關閉未合併；studio 時長更新批次化。 |
| #6778 | closed | `cb20514ce9166c45903bf27a9a8d6c1df00c0a20` | 7 檔 +831/-3 | ci(studio): pack edit accuracy shards by measured case time so they finish together。不採：上游 Linux CI 分片，本線 CI 為 Windows 單一路徑。 |
| #6780 | closed | `d1531c322872156cf9d0e088bbfd0de5426ab7f9` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF 9fe36934。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6786 | closed | `e0c1e238362a995ee1bdd5f828a51cc1d87ab4a0` | 2 檔 +31/-8 | perf(core): a video edit with no animation timeline stops rewriting every clip each frame。不採：上游關閉未合併；core 無動畫時間軸時的重寫最佳化。 |
| #6787 | closed | `93d52593d13c1ac624a807ff4c8c8c5e7daa0ad6` | 2 檔 +44/-1 | fix(core): a clip that has fully downloaded stays loaded and plays on time。不採：上游關閉未合併；預覽載入時序。 |
| #6788 | closed | `e1f6f0172663a74985e53a0b67b845c5aaf65a89` | 2 檔 +24/-5 | fix(cli): check sees a small sprite move across a large canvas。不採：上游關閉未合併；同題由已合併 #6783 處理。 |
| #6789 | closed | `a9de586cfb5ef16a930364ba1c62c65a7db9a25a` | 3 檔 +95/-3 | fix(cli): a Windows browser close ends the whole Chrome tree while its root is alive。不採：作者自行關閉，假設未在真 Windows 執行器顯示；見上方 Windows 表。觸發條件：上游重開含真實重現的 PR。 |
| #6796 | closed | `c1738fffcc3884262c1818a0efc58a937eb83f15` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF 22b38a53。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6801 | closed | `c58bbb1e70ddb095e02b16cad86e2831596f2744` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF b6505f63。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6806 | open | `750b464ab6ecdde9faf07ad74f5ad4566d4eec63` | 7 檔 +193/-45 | fix(cli): honor low-memory overrides in Docker renders。不採：Docker 低記憶體覆寫，本線為 Windows 原生。觸發條件：本線開始以容器渲染。 |
| #6810 | open | `82696b7c37e5c2bc87b6c918ea94b3dcd70c7752` | 2 檔 +40/-3 | fix(figma): don't take a motion key from the tail of a longer name。不單獨採：同題由已合併 #6800 處理（本輪已移植）。 |
| #6813 | closed | `cb7ac39dc8653ec45490e0ee4e0204e9bb4643ed` | 3 檔 +45/-5 | fix(cli): capture retries a screenshot Chrome refused before it counts it failed。不採：上游關閉未合併；截圖重試。 |
| #6816 | open | `224dba41b1b1200f2934d1f2798850b6f0315d4c` | 9 檔 +176/-17 | fix(media-use): keep the other voices when a TTS run re-voices some lines。延後：media-use TTS 重配部分行時保留其他聲線，隨產品同步。 |
| #6842 | draft | `dc9d426f11770d37d4d81e289d37a323ccbf792b` | 35 檔 +935/-104 | feat(skills): creator templates on the HyperFrames plan。不採（draft）：依賴 HeyGen 付費方案的創作者模板。 |
| #6857 | open | `0ef576e57ae4a9a6e9ac0ceb5646fe3b80252a42` | 2 檔 +4/-4 | fix(cli): default Vertex captioning to a live Gemini model。延後：Vertex 字幕預設模型，隨產品同步。 |
| #6858 | open | `853620027b9df50aeb7453be8bf4b61430e20931` | 2 檔 +20/-12 | docs(adopters): add AI Qadam。不採：上游採用者清單。 |
| #6861 | draft | `070e6b9134a43e1ea6a39a9e33085b6110aca56e` | 2 檔 +333/-246 | docs: Web Studio tab and Sign up in the top bar (merge on web launch)。不採（draft）：上游官網導覽文件。 |
| #6862 | closed | `dae4556ad89d308a622af45a79747a91074b9423` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF c65e47a9。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6863 | open | `bd1e27efcabd4584c02798629e05d1b3e1ec1fda` | 2 檔 +17/-2 | fix(figma): read the branch key from a Figma branch URL。延後：Figma 分支網址讀取分支鍵，隨 Figma 流程同步。 |
| #6864 | closed | `7f41db977291eb28b28e35deade3525d714f3ff5` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF 226c26d7。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6866 | closed | `eaa8a423eb31abbbb63c05398e98ea749eb4dbbd` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF 0fbc19ee。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6868 | open | `1edbcdefdb602e72acf5b9994fdb90686601b476` | 2 檔 +9/-1 | fix(core): don't cut an astral character in half when truncating telemetry strings。延後：遙測字串截斷避免切半代理對，屬遙測邊界。 |
| #6872 | open | `a4771eea870567a19eca100679860804813ffa19` | 2 檔 +9/-0 | fix(lint): don't report revert-layer as a font family without @font-face。延後：lint 不把 revert-layer 當字型，+9 行，隨產品同步。 |
| #6873 | closed | `b5ab72f5e48b56781731b269fdfaa1f21900eea4` | 4 檔 +106/-4 | fix(producer): warn when audio gain changes in quiet mode。不採：上游關閉未合併；產出靜音模式警告。 |
| #6875 | open | `9bf2f73301626c79dafe6ead2f2a336fa29c87ce` | 2 檔 +8/-0 | docs(adopters): add Motionboard。不採：上游採用者清單。 |
| #6877 | closed | `a5d4158cbad52b14d20183039eab5a30495e68cb` | 3 檔 +465/-0 | feat(registry): add dreamframe-bedtime ambient bedtime story block。不採：上游關閉未合併；新增 registry 睡前故事區塊（465 行內容）。 |
| #6878 | open | `173e9033da514a31a4717714f060e78adfd0e3c2` | 2 檔 +65/-6 | fix(producer): derive segmented capture container extension from output format。延後：分段擷取副檔名依輸出格式，對應 ROADMAP 既有「分段 MOV」項；該項觸發時一併評估。 |
| #6880 | open | `eb05ea3799499b5cff10e45843d95f8258a163dc` | 13 檔 +84/-84 | fix(presets): repair frontmatter that no YAML parser accepts。延後：presets frontmatter 修復，13 檔機械變更。 |
| #6883 | open | `e429b50966943635b289cda062f52fcd67f883b0` | 2 檔 +62/-0 | fix(lint): findRootTag honors an explicit data-root composition。延後：lint 的 findRootTag 認 data-root，隨產品同步。 |
| #6890 | open | `e4bdfa3a45c38bcec354cc869813a8d4c8b20672` | 6 檔 +858/-26 | fix(cli): reject partial integer flags。延後：Lambda／Cloud Run 整數旗標拒絕部分數字（issue #6889），+858 行，雲端路徑，本線不發佈。 |
| #6896 | open | `2e921c6938ddafa591cfe13d37d3068d919d5883` | 1 檔 +2/-0 | fix(swiss-grid): anchor body-level A-roll to canvas origin。延後：swiss-grid 範例補 `top:0; left:0`（issue #6882），2 行 CSS，registry 範例；本線未重現，觸發條件為本線渲染該範例出現缺畫面。 |
| #6900 | open | `004ba4763187d351da64087a7f1a8a00202c49d4` | 9 檔 +911/-51 | feat(studio): cancel element picking with Escape and show hover labels。延後：studio 拾取 Esc 取消與懸停標籤，+911 行功能。 |
| #6903 | closed | `d4fdedef0a524e7a0cadc5c224714031fc354173` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF c5e5a229。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6904 | open | `843a29d0aa44bed346fbf425e25339dbeec9beb3` | 3 檔 +142/-26 | perf(core): avoid unnecessary motion-blur callback replays。延後：motion blur 回呼重播最佳化，核心渲染。 |
| #6913 | open | `357ef9fc037f6100e5b1eb506ab48f9500ee0d0d` | 4 檔 +143/-0 | feat(cli): check names a WebGL scene that draws while it is not on screen。延後：check 新增 WebGL 離屏繪製偵測，新規則。 |
| #6919 | open | `8d5201ba9d603b95ee7ae6d9b08da38773ea8f4d` | 4 檔 +127/-13 | fix(check): the analysis restarts the idle window with every call it makes。延後：check 分析逾時視窗重啟，隨 check 同步。 |
| #6928 | open | `e9c0b30f28ed635fee61db2d0099d4e67d514bb0` | 3 檔 +50/-1 | fix(cli): check ignores the cancelled fetch of a proxy-swapped media file, not a broken image。延後：check 忽略代理替換媒體被取消的 fetch。 |
| #6934 | open | `a53b81375a8f3b1261da06add1840013109ffcd2` | 4 檔 +130/-4 | feat(player): loading assets shows the blurred frame and the mark, like Desktop。延後：player 載入畫面，功能。 |
| #6935 | open | `b90c658d21a57cab1df939f5614aa8a9861ecd3d` | 2 檔 +89/-17 | fix(sdk): a style edit keeps the declarations it does not name (#6267)。延後：sdk 樣式編輯保留未指名宣告（issue #6267）。 |
| #6939 | closed | `d60b48292bba10c9f4987e74a253c5a305703d07` | 3 檔 +72/-2 | fix(core): a first video iOS fetches only on play is warmed before the tap。不採：上游關閉未合併；iOS 預熱。 |
| #6945 | open | `60c4bfbff8bf4a0f26cc660d53f812fdbe7c4ee3` | 4 檔 +135/-26 | fix(core): play waits 0.3 s for a clip with no data, then runs on and lets it catch up。延後：播放等待 0.3 秒無資料素材，core 播放時鐘，須 iOS／clock 驗收。 |
| #6947 | open | `8bf6fd3684484a39a09462bdf03ce6a2869b889e` | 6 檔 +41/-7 | fix(cli): check waits for the composition as long as snapshot and render do。延後：check 與 snapshot／render 等待時間一致。 |
| #6949 | open | `6811e3167de17777d0cb2acb4c5b27dc58168414` | 5 檔 +207/-14 | fix(cli): snapshot stops Chrome decoding videos it already replaces with extracted frames。延後：snapshot 停止 Chrome 解碼已替換的影片。 |
| #6955 | open | `2f42de39e0962ce50aed8d337a5ec44f4e616e2f` | 2 檔 +88/-0 | fix(cli): remove-background --json streams progress lines on stderr。延後：remove-background --json 進度走 stderr。 |
| #6963 | open | `f9418f549f92ae3dc314487ac10e7ed4e40f7a2c` | 1 檔 +5/-16 | fix(producer): the stall retry test waits for IO as long as the host needs。不採：只改測試等待時間。 |
| #6965 | closed | `252d9ef4da7bc43e23d6a75cbd42fa3da845b518` | 3 檔 +174/-14 | feat(studio): the key resolver accepts key combinations。不採：上游關閉未合併；快捷鍵組合解析（已由 #6966 取代）。 |
| #6967 | open | `8829228be61d899bfc6e7331cfc5bdb8ce1778d6` | 2 檔 +33/-0 | fix(core): a motion blur worker starting mid-film keeps the right state。延後：motion blur worker 中途啟動狀態。 |
| #6968 | open | `d4bd4f45303052da3c1896832de6fffdce4ea6da` | 2 檔 +2/-2 | fix(skills): say a video carries its own data-start, not its wrapper。不採：只改一行 skills 文字。 |
| #6972 | open | `dcc3da710cb6c7d0e9098813be2e4c911f44afce` | 2 檔 +66/-14 | fix(engine): a background image that never finishes decoding no longer stalls the frame。延後：背景圖永遠解不完不再卡住擷取，engine。 |
| #6975 | open | `c0468ee7ae5d07969c80cd8b271079b2c80c8c4f` | 2 檔 +14/-0 | fix(core): a canvas in a blurred composition stays where it was laid out。延後：模糊合成中的 canvas 位置。 |
| #6977 | closed | `d422eacfea021bbfa96c2474802315b9d207b748` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF 14661d31。不採：自動重生的雲端用戶端（-4 行），本線 cloud/render.ts 尚未對齊該 API（同 #6696）。 |
| #6981 | closed | `4c3758e7d23ef7dc2233deade64282f45a5d1c2a` | 21 檔 +56/-19 | chore: release v0.8.232。不採：上游版號 PR，已關閉。 |
| #6983 | open | `51da80f814398acff1ab3cf8345ffa8d0be99870` | 11 檔 +145/-10 | feat(core): data-motion-blur-phase sets when the shutter opens。延後：新增 data-motion-blur-phase 屬性，新功能。 |
| #6988 | open | `af4f85471b1690c33f5208d2b95d2eea8f284bf4` | 2 檔 +15/-16 | docs: a download card on the quickstart, the Windows zip on the install page。不採：上游文件下載卡片。 |
| #6990 | open | `cdb503eb3d964edb6dae6bf38b20506d26ddd707` | 1 檔 +6/-1 | test(studio): quarantine the seqplainkeys center cases whose undo sometimes leaves the box off。不採：上游把不穩的 studio 案例隔離，只動測試。 |
| #6991 | open | `c1b5a2beb7342567e4ce71fc459b30d79df3f000` | 1 檔 +4/-1 | test(producer): the stall tests wait out a slow cold start before moving fake time。不採：只改測試等待。 |
| #6992 | open | `8301df1492a89fae448f28c8402ab7fdd2d6fb7d` | 1 檔 +5/-2 | test(studio): the dev server render job tests wait up to 20 s for the render。不採：只改測試等待。 |
| #6993 | draft | `eb28cfc25bfd8b76b7740ac82d9bd7580bf27c1d` | 14 檔 +1120/-148 | feat(cli): read audio stems through your HeyGen account。不採（draft）：經 HeyGen 帳戶讀音訊分軌。 |
| #7000 | open | `bf74cbbbebeeb77c8c0f6aa9da2bb2f22af20b99` | 1 檔 +11/-4 | test(engine): drive the empty-screenshot probe test with fake timers。不採：只改測試計時器。 |
| #7001 | closed | `393b80aee57285427cf7e5d6e27556a08f6b7be2` | 6 檔 +121/-8 | fix(core): iPhone Safari loads the first take before the clips behind it。不採：上游關閉未合併；iPhone Safari 預載。 |
| #7003 | open | `c15936cabcde65cbefec460ef7d2e29b23da974d` | 1 檔 +0/-4 | chore(codegen): resync cloud client from EF f28f6f7a。不採：自動重生的雲端用戶端（-4 行），同 #6696。 |
| #7007 | open | `39aeaaa9f530f2ba7182e5a3852c2f94e17f8447` | 27 檔 +2246/-22 | feat(producer): report browser-computed reference backgrounds。延後：producer 回報瀏覽器計算的參考背景，+2246 行 27 檔，大型功能。 |
| #7008 | draft | `86188c1bb023c413ee67d20ac8b5d987f2393f05` | 5 檔 +686/-57 | test(player): add Windows dropped-frame diagnostics。不採（draft）：player 的 Windows 掉格診斷測試；僅診斷用，觸發條件為上游合併且本線需要追掉格。 |
| #7009 | open | `384a823df9192bae03c6fdc66ce4b882926f7a30` | 5 檔 +86/-6 | fix(producer): a render stops when a capture session sees every composition script fail。延後：所有合成腳本都失敗時渲染停止，producer。 |
| #7011 | open | `17121230936d28317ea8bc40184cbaf896efe826` | 6 檔 +162/-16 | fix(cli): snapshot reads video frames through any ffprobe and fails on an unreadable one。延後：snapshot 經任一 ffprobe 讀影片幀。 |
| #7012 | open | `7a24df978010aacc8ea9c1fa5f523629ee7fedbf` | 6 檔 +155/-6 | fix(core): iPhone Safari keeps one connection per file for the take on screen and the next。延後：iPhone Safari 連線數，core。 |

### 審查期間新增（#7013、#7014）

| PR | 狀態 | 審查 head | 規模 | 內容與裁決 |
| --- | --- | --- | --- | --- |
| #7013 | draft | `7e1587f1a5f67f701fa72ede95a9bf2d083865ef` | 11 檔 +245/-50 | fix(cli): 0.x 次版本間不自動更新，技能依 CLI 發佈 tag 安裝。延後：動到自動更新與技能安裝契約，隨產品同步；隱藏內容掃描 0 命中。 |
| #7014 | open | `2987c132791bebda62cef5e5dd3303be02b698dd` | 6 檔 +166/-21 | fix(cli): registry 優先走 HeyGen CDN，並說明所有主機都不回應的原因。延後：registry 讀取路徑，須先決定本線是否接受 HeyGen CDN；掃描只命中測試的 `vi.spyOn(globalThis, "fetch")`。 |

### 收尾增量（commit `036e41fa09e6670f155fa3f2c361b58b8ed77e02`）

| Commit | PR | 裁決 |
| --- | --- | --- |
| `036e41fa09e6670f155fa3f2c361b58b8ed77e02` | #7012 | 延後：iPhone Safari 每檔一條連線，core 預覽載入，屬 Safari 播放批次，隨產品同步。#7012 原在 open 列，改記為 merged 並自 `monitored` 移除；#7013 由 draft 轉 open，已重釘。審查期間 #6842、#7011 的 head 又換過，已重掃（表格對齊、無隱藏內容）並重釘。 |

## 既有 monitored（24 筆）的變動

| PR | 原釘 | 現況 | 處理 |
| --- | --- | --- | --- |
| #6670、#6671、#6687、#6702、#6711、#6715、#6716、#6750、#6751、#6754、#6755 | open／draft／closed | 全部 merged | 內容已在上方 commit 軸逐筆裁決，從 `monitored` 移除（merged 項不會再漂移，留著只會變成噪音）。 |
| #6688、#6738、#6739、#6752 | open／draft | closed 未合併 | 裁決不變（Linux CI 分片、repro-only 診斷、播放時鐘、codegen 重生），重釘為 closed。 |
| #6748 | open | open，head 變為 `83fe9bc` | 仍是 Pi 教學文件，延後不變，重釘新 head。 |
| #6695、#6696、#6704、#6714、#6722、#6727、#6732、#6745 | 同前 | 未變 | 裁決不變；#6722、#6732 本線已於 2026-10-30 移植，上游仍 open。 |

## Issue 軸（#6756–#6995，13 筆）

| Issue | 狀態 | 裁決與證據 |
| --- | --- | --- |
| #6756 motionContextToDocs 的 `y` 軌抄到 `opacity` | CLOSED（#6800、#6810） | 本線有同缺陷（`packages/core/src/figma/motionContextToDocs.ts`），已移植 #6800。 |
| #6757 Windows 桌面 App 偵測不到 Claude Code | CLOSED（無關聯 PR） | 不適用：桌面 App 不在本 repo 的 `packages/`；`grep` 無對應程式。 |
| #6830 `--variables-file` 報 `io.readFile is not a function` | CLOSED（#6831） | 本線有同缺陷（`variables.ts:67` 傳入 `readFile: undefined`）；已移植 #6831 並先紅後綠。 |
| #6849 remove-background 每個 chunk 重複複製半個幀 | CLOSED（無關聯 PR；#6850 同題已合併） | 本線 `background-removal/pipeline.ts:283` 仍是 `Buffer.concat([buffered, chunk])`；#6850 補丁乾淨可套，但是效能而非正確性，延後隨產品同步。 |
| #6867 motion blur 回呼重播與 events-on 掃描兩次 | OPEN | 延後：效能追蹤，對應 open #6904／#6967。 |
| #6871 每次有音訊的渲染 AAC 重編 2–3 次 | OPEN | 延後：報告環境 macOS arm64，未在 Windows 驗證；觸發條件為本線出現同樣的重編證據。 |
| #6881 Linux/NVIDIA 長 4K 渲染 NVDEC 只帶來 7% | OPEN | 不適用：Linux GPU 情境，本線為 Windows 原生。 |
| #6882 CLI render 丟失 body 層媒體容器 | OPEN（#6896 open） | 延後：#6896 為 swiss-grid 範例 2 行 CSS；根因（render 路徑與 preview 不同）未解，且報告於 Windows 11，觸發條件為本線渲染該範例出現缺畫面。 |
| #6889 Lambda／Cloud Run 整數旗標接受部分數字 | OPEN（#6890 open） | 延後：雲端路徑，本線不發佈；見 #6890。 |
| #6899 義大利電話號碼欄位被吃掉 `39` | OPEN | 不適用：HeyGen 網站表單，非本 repo 程式。 |
| #6927 Ubuntu 26.04 時間軸編輯卡頓 | OPEN | 不適用：Linux 環境，本線為 Windows 原生；上游效能修正（#6773、#6805、#6855）在 commit 軸延後。 |
| #6989 undo/redo 後方塊偏移 240–314px | CLOSED（#6998、#7005） | 延後：兩個修正已 merged，須整批 studio 同步才有意義；不單獨移植。 |
| #6995 lint 誤報 `gsap_timeline_not_registered` 並使 check 略過瀏覽器稽核 | CLOSED（#6999） | 本線不受影響：issue 指回歸版本為 0.8.223–0.8.226，由 #6829（`0708f6ca7`）引入的行為，本線沒有該 commit（補丁與現行檔案衝突，`lint` 規則維持舊版），#6999 也隨產品同步一併延後。 |

## 水位

commit `cd5984261a6cae06e91e7e796b9360a33d80ee1b`、PR #7014、issue #6995（commit 水位含收尾增量 `036e41fa0`）。水位代表已審查，不代表已合併；產品同步見 [ROADMAP](https://github.com/SanHsien/hyperframes/blob/main/ROADMAP.md) 的「分批採用」。
