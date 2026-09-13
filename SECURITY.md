# 安全政策

## 支援範圍

安全修正以本 fork 的最新 `main` 為主；上游版本的問題也會視需要回報原作者。

## 私下回報

若發現針對本 fork 維護骨架或衍生程式的安全漏洞，請使用 GitHub Security Advisories 的 **Report a vulnerability** 私下回報：
<https://github.com/SanHsien/hyperframes/security/advisories/new>。
若該入口不可用，請透過 GitHub 個人檔案聯絡維護者，不要先建立公開 Issue。

若問題屬於上游核心邏輯，亦可向原作者 HeyGen 通報：<https://github.com/heygen-com/hyperframes/security>。

回報請包含影響範圍、重現步驟、受影響版本與最小必要證據。請勿在回報中附上真實 API key、token、個人機密文件或帳密。

## 特別注意

- **命令列工具與瀏覽器渲染**：`packages/engine` 調用 Chrome Headless 與 FFmpeg 進行影片錄製與轉碼。請防範未經淨化的 HTML / JS 進行惡意本機檔案存取或網路請求。
- **檔案路徑防護**：影片輸出與快取寫入涉及磁碟路徑，請防範路徑遍歷與非預期覆蓋。
- **憑證與機密保護**：嚴禁將 API key、token、私鑰或含憑證的 `.env` 提交進版本庫。
