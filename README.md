## 更新紀錄
更新紀錄已移至 `apps/frontend/public/changelog.json`，並由設定頁「更新紀錄」入口呈現。

---

## 專案結構
- `apps/frontend`：前台（使用者記帳介面）
- `apps/admin`：後台（管理者操作、用量與資料調閱、跑馬燈設定等）
- `functions`：後端（Firebase Functions）

---

## 本機開發
### 前台
```bash
npm --prefix apps/frontend run dev
```
### 後台
```bash
npm --prefix apps/admin run dev
```
### 後端（Functions）
```bash
npm --prefix functions run build
```

---

## 建構與發布
### 前台 build
```bash
npm --prefix apps/frontend run build
```

### 後台 build
```bash
npm --prefix apps/admin run build
```

### 後端 build（Functions）
```bash
npm --prefix functions run build
```

### 發布（Firebase）
目前 `firebase.json` 僅設定前台（`apps/frontend/dist`）的 Hosting。
若要發布前台與 Functions：
```bash
firebase deploy --only hosting,functions
```

若要發布後台，請先在 `firebase.json` 新增第二個 hosting target（例如 `admin`），
並指定 `apps/admin/dist`，再部署對應 target。

---

## 前台 / 後台 / 後端差異
- 前台（Frontend）：使用者記帳與查詢介面，面向一般使用者。
- 後台（Admin）：管理者介面，需白名單 Google 帳號登入，提供用量、資料調閱、公告設定等功能。
- 後端（Backend / Functions）：雲端 API 與背景處理，供前台/後台呼叫。

---

## CI / 自動化測試 (GitHub Actions)
PR 與推送到 `main` 會觸發 `.github/workflows/ci-tests.yml`。
- `functions-tests`: `functions/` 的單元測試（Jest）與 Firebase Functions Emulator E2E (`npm run test:e2e`)。
- `frontend-tests`: 前端單元測試（Vitest）。

### 必填 GitHub Secrets
在 Settings → Secrets and variables → Actions 建立：
- `GEMINI_API_KEY`: Emulator 測試用 Key（用測試授權即可）。
- `DEV_KEY_CODE`: 測試代碼（例：`6yhn%TGB`），CI 會放入 `functions/.secret.local` 提供 Emulator 使用。

**安全注意**：勿將私密金鑰硬寫進版本庫；請用 Secrets 或 `.secret.local`。

### 本機跑 CI 模擬
在 `functions/` 建立 `.secret.local` 並填入 `GEMINI_API_KEY`、`DEV_KEY_CODE`，再執行 `npm run test:e2e`。
