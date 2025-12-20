# Copilot / AI Agent Instructions for cloud-ledger

This file contains concise, actionable guidance to help an AI coding agent be productive in this repository.

## Quick summary (big picture) 🔧
- frontend: React + TypeScript (Vite). Uses Tailwind for styling and PWA support via `vite-plugin-pwa`.
- backend: Firebase (Hosting + Auth + Firestore) and Firebase Cloud Functions (TypeScript) for server-side AI calls (Gemini).
- AI parsing happens entirely in Cloud Functions (`functions/src/index.ts`) using `@google/genai`. The frontend calls it via `httpsCallable` (`services/geminiService.ts`).

## Run & build (explicit commands) ✅
- Frontend (development):
  - npm install
  - npm run dev  (starts Vite on port 3000)
- Frontend production build / preview:
  - npm run build
  - npm run preview
- Functions (local dev & build):
  - cd functions
  - npm install
  - npm run build (TypeScript -> lib)
  - npm run serve (tsc + firebase emulators:start --only functions)
  - npm run deploy (deploy functions to Firebase)
- Firebase hosting deploy: `firebase deploy --only hosting` (note: `firebase.json` predeploy runs the functions build). 

## Important architecture & data-flow notes 🧭
- Firestore structure (important collections/fields):
  - `ledgers` (doc): { name, ownerUid, members[], expenseCategories[], incomeCategories[], ... }
  - `ledgers/{ledgerId}/transactions` (subcollection): each transaction has { amount, type: 'INCOME'|'EXPENSE', category, description, rewards, date, creatorUid, ledgerId, createdAt }
- New schema: categories are split into `expenseCategories` and `incomeCategories`. The code contains a migration compatibility path if an older `categories` field exists (see `contexts/AppContext.tsx`).
- Authentication: Cloud Function `parseTransaction` requires an authenticated call (server-side checks `request.auth`). Frontend uses Firebase Auth (Google) and will fall back to a **Mock Mode** if Firebase initialization fails.

## Mock Mode & local testing tips 🧪
- `firebase.ts` tries to initialize Firebase and sets `isMockMode` on failure. This triggers local-only behavior:
  - Auth: `AuthContext` auto-inserts a mock user and stores it in `localStorage: 'cloudledger_mock_user'`.
  - Transactions and profile sync use localStorage keys:
    - `MOCK_STORAGE_KEY_TXS = 'cloudledger_mock_txs'`
    - `MOCK_STORAGE_KEY_USER_PROFILE = 'cloudledger_mock_profile'`
    - `STORAGE_KEY_LEDGER_ID = 'cloudledger_ledger_id'`
- Useful when working offline or without Firebase setup. Many features explicitly check `isMockMode`.

## AI integration specifics (Gemini) 🤖
- Backend function: `functions/src/index.ts` defines `parseTransaction` using `GoogleGenAI` and a secret `GEMINI_API_KEY` via `defineSecret('GEMINI_API_KEY')`.
- Frontend: `services/geminiService.ts` calls `parseTransaction` via `httpsCallable(functions, 'parseTransaction')` and sends `text` + combined categories as `categories`.
- Local dev note: you must set the `GEMINI_API_KEY` as a Firebase Functions secret (or mock the function) to validate the end-to-end AI flow.

## Project-specific conventions & gotchas ⚠️
- Keep AI logic in Cloud Functions (server-side). Frontend passes categories and raw text only.
- The repo uses modular Firebase SDK imports and a defensive initialization pattern in `firebase.ts` — check `isMockMode` when editing code that depends on Firebase objects.
- Manual vs smart input:
  - UI merges expense + income categories and sends to AI (see `components/AddTransaction.tsx` and `services/geminiService.ts`).
  - The Cloud Function requires authentication; if calling locally, ensure emulator/auth or mock behavior.
- Vite/PWA config: `vite.config.ts` includes `VitePWA`. The base is set to `'/'` (suitable for Firebase hosting). If you change hosting base paths, update `base`.
- Functions runtime Node version: Node 24 (see `functions/package.json` engines).

## Files to inspect for context & examples 📁
- Frontend: `App.tsx`, `index.tsx`, `vite.config.ts`, `constants.ts`, `types.ts`
- Core logic: `contexts/AppContext.tsx`, `contexts/AuthContext.tsx`, `components/AddTransaction.tsx`
- Services: `services/geminiService.ts` (client -> functions), `firebase.ts` (init + mock mode)
- Functions: `functions/src/index.ts`, `functions/package.json`
- Deployment: `firebase.json`

## Typical tasks an AI agent is likely to do (with pointers) 🔍
- Add/modify parsing fields: update the Cloud Function schema (functions/src/index.ts) and the client parsing usage (services/geminiService.ts + components/AddTransaction.tsx). Test via functions emulator.
- Change categories schema: update `constants.ts`, `contexts/AppContext.tsx` (migration logic), and adjust UI rendering where categories are used.
- PWA or build tweaks: modify `vite.config.ts` (PWA manifest) and confirm `firebase.json` hosting `public: dist` and rewrites.

## Code style & tests
- TypeScript is used across the repo. There is no test suite in the repo. Add tests in `functions` (jest/ts-node or use `firebase-functions-test`) if you add functions logic.

## Communication preferences for PRs & code changes ✍️
- Preserve server-side handling of secrets (do not add API keys to frontend). Prefer adding tests and an emulator-based workflow when modifying AI or functions logic.
- When modifying Firestore schema, include migration or backward compatible reads (see how `AppContext` handles `categories` -> `expenseCategories`/`incomeCategories`).

---
If you'd like, I can open a draft PR with this file or refine any section (e.g., add a local emulation guide for Secrets). What should I add or clarify next? ✅