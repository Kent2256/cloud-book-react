# CloudLedger v2 - 原生 Android + Web 併行規格

## 1. 目標
- 原生 Android 與 Web 前台並行開發與發布
- Android 使用 Kotlin + Jetpack Compose
- Web 保留 PWA 能力
- Firebase / AdMob / Google 登入保留並分平台實作

---

## 2. 平台架構
### 2.1 Web 前台 (apps/frontend)
- 技術：React + Vite + PWA
- 功能：完整記帳功能（新增/列表/統計/設定）
- 發布：Firebase Hosting (apps/frontend/dist)

### 2.2 Web 後台 (apps/admin)
- 技術：React + Vite
- 功能：管理者登入與資料管理
- 發布：Firebase Hosting (apps/admin/dist)

### 2.3 原生 Android (apps/android)
- 技術：Kotlin + Jetpack Compose
- 功能：完整記帳功能 + 原生整合
- 發布：Android APK/AAB

---

## 3. Firebase / Google / AdMob
### 3.1 Firebase
- 專案沿用既有 Firebase
- apps/android 使用 `apps/android/app/google-services.json`
- functions 與 firestore schema 延續現有設計

### 3.2 Google 登入
- Web：使用既有 Web OAuth / Firebase Auth
- Android：改用原生 Google Sign-In + Firebase Auth

### 3.3 AdMob
- Android 保留 Banner 廣告
- Web 不顯示廣告

---

## 4. Android 原生功能範圍
- 登入 / 登出
- 帳本切換 / 建立 / 加入
- 記帳新增（含智慧輸入與語音，必要時用原生語音）
- 記帳列表 / 搜尋 / 刪除
- 統計圖表
- 設定（主題、匯入匯出、API Key、VIP）

---

## 5. 開發流程
### 5.1 Web
- 開發：`npm --prefix apps/frontend run dev`
- Build：`npm --prefix apps/frontend run build`

### 5.2 Admin
- 開發：`npm --prefix apps/admin run dev`
- Build：`npm --prefix apps/admin run build`

### 5.3 Android
- Build Debug：`cd apps/android && .\gradlew assembleDebug`
- Build Release：`cd apps/android && .\gradlew assembleRelease`

---

## 6. 發布流程
### 6.1 Firebase Hosting
- 前台：target `app` -> apps/frontend/dist
- 後台：target `admin` -> apps/admin/dist

### 6.2 Android
- Release APK/AAB 依 Keystore 簽名

