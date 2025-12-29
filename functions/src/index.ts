import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions/v1";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI, Type } from "@google/genai";
import * as admin from "firebase-admin";

admin.initializeApp();

// 1. 定義 Secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");
// Optional developer test code: when the frontend sends this exact code as the API Key,
// the function will substitute the server-side GEMINI_API_KEY for that request.
const devKeyCode = defineSecret("DEV_KEY_CODE");

// ✅ 修改：定義分開的預設分類 (與前端 constants.ts 保持一致)
const DEFAULT_EXPENSE_CATEGORIES = [
  '餐飲', '交通', '日常', '居住', '娛樂', '醫療', '教育', '其他'
];

const DEFAULT_INCOME_CATEGORIES = [
  '薪資', '獎金', '投資', '兼職', '零用金', '點券折抵', '其他'
];

interface SmartInputRequest {
  text: string;
  categories?: string[];
}

// 2. 解析交易的函式
export const parseTransactionHandler = async (request: any) => {
  // 檢查使用者是否登入
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "請先登入");
  }

  const { text, categories } = request.data as SmartInputRequest;
  const providedKey = (request.data as any).apiKey as string | undefined;

  const defaultAllCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

  const availableCategories = categories && categories.length > 0
    ? categories
    : defaultAllCategories;

  let apiKeyToUse: string;
  try {
    if (providedKey) {
      if (providedKey === devKeyCode.value()) {
        apiKeyToUse = geminiApiKey.value();
      } else {
        apiKeyToUse = providedKey;
      }
    } else {
      apiKeyToUse = geminiApiKey.value();
    }
  } catch (e: any) {
    console.error('Key resolution failed:', String(e));
    throw new HttpsError('internal', 'Key resolution failed');
  }

  const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this financial input: "${text}".
        Context: Today is ${today}.
        Requirements:
        1. Amount: Extract number.
        2. Type: 'EXPENSE' or 'INCOME'.
        3. Category: Select strictly from: [${availableCategories.join(', ')}]. If unsure, use '其他'.
        4. Description: Short summary in Traditional Chinese (NO numbers).
        5. Rewards: Extract points/cashback value.
        6. Date: YYYY-MM-DD format if mentioned, else null.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
            category: { type: Type.STRING, enum: availableCategories },
            description: { type: Type.STRING },
            rewards: { type: Type.NUMBER },
            date: { type: Type.STRING }
          },
          required: ["amount", "type", "category", "description"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    return JSON.parse(resultText);

  } catch (error: any) {
    console.error("Gemini Backend Error:", error);
    throw new HttpsError("internal", "AI 解析失敗");
  }
};

export const parseTransaction = onCall(
  { secrets: [geminiApiKey, devKeyCode] },
  parseTransactionHandler
);

// 新增：validateKey (驗證使用者提供的 key 並嘗試回傳可用模型清單)
export const validateKeyHandler = async (request: any) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '請先登入');
  }

  const providedKey = (request.data as any).apiKey as string | undefined;
  if (!providedKey) {
    return { valid: false, models: [] };
  }

  let keyToUse: string;
  try {
    if (providedKey === devKeyCode.value()) {
      keyToUse = geminiApiKey.value();
    } else {
      keyToUse = providedKey;
    }
  } catch (e: any) {
    console.error('Key resolution failed:', String(e));
    throw new HttpsError('internal', 'Key resolution failed');
  }

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemma-3-27b'
  ];

  const ai = new GoogleGenAI({ apiKey: keyToUse });

  const available: string[] = [];

  for (const m of candidateModels) {
    try {
      await ai.models.generateContent({
        model: m,
        contents: 'Is this model available? Reply YES',
        config: { responseMimeType: 'text/plain' }
      });
      available.push(m);
    } catch (e: any) {
      // Ignore failures per model
    }
  }

  const valid = available.length > 0;

  return { valid, models: available };
};

export const validateKey = onCall(
  { secrets: [geminiApiKey, devKeyCode] },
  validateKeyHandler
);
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  await db.collection('users').doc(user.uid).set({
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ledgers: []
  }, { merge: true });
});

// 2.1 退出與軟刪除 (Leave Ledger)
export const leaveLedgerHandler = async (request: any) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '請先登入');
  }

  const ledgerId = (request.data as any)?.ledgerId as string | undefined;
  if (!ledgerId) {
    throw new HttpsError('invalid-argument', '缺少帳本 ID');
  }

  const db = admin.firestore();
  const ledgerRef = db.collection('ledgers').doc(ledgerId);
  const uid = request.auth.uid;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ledgerRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', '帳本不存在');
    }

    const data = snap.data() || {};
    const members = Array.isArray(data.members) ? data.members : [];
    const newMembers = members.filter((m: any) => m?.uid !== uid);

    if (newMembers.length === members.length) {
      throw new HttpsError('failed-precondition', '使用者不在帳本內');
    }

    const updates: Record<string, any> = { members: newMembers };
    if (newMembers.length === 0) {
      const sevenDaysLater = admin.firestore.Timestamp.fromMillis(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );
      updates.scheduledDeleteAt = sevenDaysLater;
    }

    tx.update(ledgerRef, updates);
  });

  return { ok: true };
};

export const leaveLedger = onCall(leaveLedgerHandler);

// 2.2 加入與復活 (Join Ledger)
export const joinLedgerHandler = async (request: any) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '請先登入');
  }

  const ledgerId = (request.data as any)?.ledgerId as string | undefined;
  if (!ledgerId) {
    throw new HttpsError('invalid-argument', '缺少帳本 ID');
  }

  const db = admin.firestore();
  const ledgerRef = db.collection('ledgers').doc(ledgerId);
  const uid = request.auth.uid;
  const token = request.auth.token || {};
  const member = {
    uid,
    displayName: token.name ?? null,
    email: token.email ?? null,
    photoURL: token.picture ?? null
  };

  let ledgerName: string | null = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ledgerRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', '帳本不存在');
    }

    const data = snap.data() || {};
    ledgerName = data.name ?? null;
    const members = Array.isArray(data.members) ? data.members : [];
    const exists = members.some((m: any) => m?.uid === uid);
    const newMembers = exists ? members : [...members, member];

    const updates: Record<string, any> = { members: newMembers };
    if (data.scheduledDeleteAt) {
      updates.scheduledDeleteAt = admin.firestore.FieldValue.delete();
    }

    tx.update(ledgerRef, updates);
  });

  return { ok: true, ledgerName };
};

export const joinLedger = onCall(joinLedgerHandler);

// 2.3 排程清理 (Scheduled Cleanup)
export const scheduledCleanup = functionsV1.pubsub.schedule('every 24 hours').onRun(async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const snap = await db
    .collection('ledgers')
    .where('members', '==', [])
    .where('scheduledDeleteAt', '<', now)
    .get();

  if (snap.empty) return null;

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return null;
});
