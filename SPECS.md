# CloudLedger v3.3.0 開發規格書 (Development Specs)

## 1. 資料庫讀取優化 (Hybrid Sync Strategy)
**目標**：降低 Firestore 讀取成本，提升效能。
**現狀**：目前全域使用 `onSnapshot` 監聽。
**需求變更**：
1.  **移除監聽**：除「跑馬燈 (Marquee)」外，移除其他頁面的 `onSnapshot`。
2.  **同步時機**：改為使用 `getDocs` 單次讀取，觸發時機如下：
    * **App 啟動時 (App Launch)**：讀取一次最新資料。
    * **切換至首頁時 (On Home Focus)**：當 Router 切換回首頁 (日曆頁) 時，自動觸發同步。
    * **手動觸發 (Manual)**：使用者點擊首頁「立即同步」按鈕時。
3.  **例外**：跑馬燈維持 `onSnapshot` 以保持動態感。

## 2. 紀錄頁面搜尋 (Search Feature)
**目標**：讓使用者能快速查找舊帳目。
**需求變更**：
1.  在「紀錄 (Records)」列表頁上方新增搜尋輸入框。
2.  **過濾邏輯**：即時過濾 (Client-side filtering)，關鍵字需匹配以下任一欄位：
    * `note` (備註)
    * `category` (分類)
    * `amount` (金額)

## 3. 智慧輸入設定 (BYOK - Bring Your Own Key) [Security Enhanced]
**目標**：解決共用 API Key 額度不足問題，允許使用者自訂 AI，並確保極高的資安標準。
**資安原則 (Security Policy)**：
* **Zero Storage (Server-side)**：伺服器端資料庫 (Firestore) **嚴禁** 儲存使用者的 API Key。
* **Client-side Only**：API Key 僅能儲存於使用者的瀏覽器 `localStorage`。
* **No Logging**：後端 Cloud Function **嚴禁** 使用 `console.log` 印出包含 Key 的 Request Body 或 Headers。

**需求變更**：
1.  **設定頁面 (Settings)**：
    * 新增區塊「智慧輸入設定」。
    * **欄位**：
        * `API Key` (字串輸入)：僅儲存於 `localStorage.getItem('user_gemini_key')`。
        * `Model` (下拉選單)：選項包含 `Gemini 2.5 Flash`, `Gemini 3.0 Flash Preview`, `Gemma 3 27b`。
        * `Enable AI` (開關)：開啟/關閉智慧輸入功能。
    * **提示文字**：在輸入框下方標註「您的 Key 僅儲存於本地裝置，不會上傳至我們的資料庫」。

2.  **前端呼叫邏輯 (API Client)**：
    * 發送請求前，從 `localStorage` 讀取 Key。
    * **傳輸方式**：將 Key 放入 HTTP Request Header (例如 `x-custom-api-key`)，**不可** 放在 URL 參數中。
    * 若本地無 Key，則不發送 Header (或是前端阻擋請求)。

3.  **後端 (Firebase Functions)**：
    * **解析邏輯**：優先讀取 `req.headers['x-custom-api-key']`。
    * **Fallback**：若 Header 無值，則視系統策略決定是否使用預設環境變數 Key 或回傳 401 錯誤。
    * **模型初始化**：使用解析到的 Key 動態初始化 `GoogleGenerativeAI` 實例。
    * **清理**：執行完畢後立即釋放變數，確保無狀態 (Stateless)。

## 4. 快速語音記帳 (Quick Voice Input)
**目標**：提升記帳速度與 UX。
**需求變更**：
1.  **互動設計**：在記帳頁面的懸浮按鈕「+」新增 **長壓 (Long Press)** 事件偵測。
2.  **行為**：
    * **短按**：維持原本行為 (打開手動記帳)。
    * **長壓**：
        * 檢查是否已設定 API Key。
        * 若有：直接跳轉至「智慧輸入頁面」並自動啟動麥克風錄音。
        * 若無：跳出 Toast 提示前往設定頁。