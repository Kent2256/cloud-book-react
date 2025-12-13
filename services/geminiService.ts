import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, DEFAULT_CATEGORIES } from "../types"; // ✅ 修改 1: 引入 DEFAULT_CATEGORIES

// ==========================================
// 設定 API KEY
// ==========================================
// 建議之後將 Key 移至環境變數
const ai = new GoogleGenAI({ apiKey: "AIzaSyBSgFRahsbIsiqHjiEdpPvPbO51S2nbc8Q" });

export interface ParsedTransactionData {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  rewards: number;
  date?: string;
}

/**
 * 智慧解析使用者的自然語言輸入
 * input: 使用者輸入的字串 (ex: "昨天買衣服500回饋10點")
 * availableCategories: 當前系統中所有的分類清單 (包含使用者自訂的)
 */
export const parseSmartInput = async (
  input: string, 
  // ✅ 修改 2: 預設值改用 DEFAULT_CATEGORIES
  availableCategories: string[] = DEFAULT_CATEGORIES 
): Promise<ParsedTransactionData | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Analyze this financial input: "${input}".
        Context: Today is ${today}.

        Requirements:
        1. **Amount**: Extract the numeric value. If no currency is specified, assume TWD.
        2. **Type**: Determine if it is 'EXPENSE' or 'INCOME'.
        3. **Category**: Select the MOST appropriate category strictly from this list: [${availableCategories.join(', ')}]. If unsure or no match, use '其他'.
        4. **Description**: 
           - Generate a SHORT summary (2-5 words) in Traditional Chinese (繁體中文).
           - **CRITICAL**: Do NOT include the numeric amount or price in the description. 
           - Example: Input "Lunch $120" -> Description "午餐" (NOT "午餐 120").
        5. **Rewards**: If cash back, points, or discounts are mentioned, extract the value into 'rewards'.
        6. **Date**: If a relative date (e.g., "yesterday", "last Friday") or specific date is mentioned, convert it to YYYY-MM-DD format. Otherwise, use null.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: [TransactionType.INCOME, TransactionType.EXPENSE] },
            // 限制 AI 只能選提供的分類
            category: { type: Type.STRING, enum: availableCategories },
            description: { type: Type.STRING },
            rewards: { type: Type.NUMBER, description: "Points or cashback value" },
            date: { type: Type.STRING, description: "YYYY-MM-DD format if mentioned" }
          },
          required: ["amount", "type", "category", "description"],
        },
      },
    });

    // 注意：根據 SDK 版本，有時是 response.text() 函式，有時是屬性
    // 如果這裡報錯，請嘗試改成 response.text()
    const text = response.text; 
    
    if (!text) return null;
    
    return JSON.parse(text) as ParsedTransactionData;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};

/**
 * Generates a short financial insight based on recent transactions.
 */
export const getFinancialAdvice = async (transactions: any[]): Promise<string> => {
  try {
    // Limit to last 15 transactions to save tokens and context
    const recent = transactions.slice(0, 15);
    const summary = JSON.stringify(recent);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `以下是一個帳本的近期交易紀錄 JSON: ${summary}. 
      請給出一個友善、簡短的繁體中文建議或觀察（30字以內）。
      如果他們有獲得回饋（rewards），可以適當稱讚。`,
    });

    return response.text || "持續記帳以獲得更多分析！";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "暫時無法產生建議。";
  }
};