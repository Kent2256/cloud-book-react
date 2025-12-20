## 📅 Version History (版本紀錄)

### v3.3.0 (In Development / 開發中) 🚧
**預計更新重點：效能優化與 AI 自定義**
- **⚡ 資料庫讀取優化 (Hybrid Sync)**：
  - 移除全域即時監聽 (onSnapshot)，大幅降低讀取成本。
  - 改採混合同步機制：僅在「App 啟動」、「切換回首頁」或「手動點擊同步鈕」時更新資料。
  - 跑馬燈 (Marquee) 維持即時更新以保留動態感。
- **🤖 智慧輸入設定 (BYOK)**：
  - 新增 API Key 設定頁面，允許使用者輸入個人的 Google Gemini Key。
  - 支援模型切換 (如 Gemini Flash / Gemma 系列) 與功能開關。
- **🎙️ 快速語音記帳**：新增長壓「+」號懸浮按鈕，可直接開啟語音輸入模式。
- **🔍 紀錄搜尋功能**：列表頁面新增搜尋列，支援搜尋備註、分類與金額。

---

### v3.2.1 (Current Release) ✅
**PWA 安裝修復版**
- **🐛 Bug Fixes**：
  - 修復 Android 裝置上 PWA 無法安裝的問題。
  - 修正 `manifest` 設定，加入 `purpose: 'any maskable'` 以支援 Android 自適應圖示 (Adaptive Icons)。
  - 修復電腦版瀏覽器分頁圖示 (Favicon) 顯示異常的問題 (補回 `index.html` link 標籤)。

### v3.2.0
**PWA 應用程式化與 UI 重大更新**
- **✨ New Features**：
  - **PWA 支援**：導入 `vite-plugin-pwa`，網站現在可以安裝為應用程式 (Installable)。
  - **Service Worker**：新增離線快取機制，提升載入速度。
- **🎨 UI/UX Changes**：
  - **全新圖示系統**：將原本的地球圖示更換為全新的「CloudLedger 雲朵」品牌識別。
  - **介面微調**：更新標題列樣式與應用程式名稱顯示。

### v3.1.0
**基礎穩定版**
- **🧠 AI Core**：整合 Google Gemini API 進行自然語言記帳 (後端功能)。
- **🔥 Firebase**：完成 Firestore 資料庫串接與 Firebase Hosting 部署。
- **📱 Responsive**：完成手機版與電腦版的響應式切版。jo