import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI, Type } from "@google/genai";

// 1. 定義 Secret (這樣 Key 就不會寫死在程式碼裡)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// 定義預設分類 (因為無法直接讀取前端的 types.ts，直接複製一份過來最穩)
const DEFAULT_CATEGORIES = [
  '餐飲', '交通', '購物', '居住', '娛樂', '薪資', '投資', '其他'
];

interface SmartInputRequest {
  text: string;
  categories?: string[];
}

// 2. 這是後端的函式，名稱叫 parseTransaction
export const parseTransaction = onCall(
  { secrets: [geminiApiKey] }, // 授權此函式讀取 API Key
  async (request) => {
    // 檢查使用者是否登入 (保護 API 不被路人亂 call)
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "請先登入");
    }

    const { text, categories } = request.data as SmartInputRequest;
    
    // 如果前端有傳分類就用前端的，沒有就用預設的
    const availableCategories = categories && categories.length > 0 
        ? categories 
        : DEFAULT_CATEGORIES;

    // 在後端使用 Secret 初始化 Gemini
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const today = new Date().toISOString().split('T')[0];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
  }
);