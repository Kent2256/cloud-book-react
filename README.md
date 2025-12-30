## 更新紀錄
更新紀錄已移至 `public/changelog.json`，並由設定頁「更新紀錄」入口呈現。

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
