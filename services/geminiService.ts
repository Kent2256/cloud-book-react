import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, Category } from "../types";

// ==========================================
// 設定 API KEY
// ==========================================
// 優先使用環境變數中的 API Key
// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedTransactionData {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  rewards: number;
}

/**
 * Parses natural language input into structured transaction data.
 * e.g., "Lunch at McDonald's 250, got 5 points back"
 */
export const parseSmartInput = async (input: string): Promise<ParsedTransactionData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse this financial transaction: "${input}". 
      If no currency is specified, assume simple numbers. 
      If rewards/cashback/points are mentioned, extract their value into 'rewards'.
      Infer the category from the description.
      The category MUST be one of the following exact strings: ${Object.values(Category).join(', ')}.
      If unsure, use '其他'.
      Translate the description to Traditional Chinese if it is not already.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: [TransactionType.INCOME, TransactionType.EXPENSE] },
            category: { type: Type.STRING, enum: Object.values(Category) },
            description: { type: Type.STRING },
            rewards: { type: Type.NUMBER, description: "The value of cashback or points earned" }
          },
          required: ["amount", "type", "category", "description"],
        },
      },
    });

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
      contents: `以下是一對伴侶的近期交易紀錄 JSON: ${summary}. 
      請給出一個友善、簡短的繁體中文建議或觀察（30字以內）。
      如果他們有獲得回饋（rewards），可以適當稱讚。`,
    });

    return response.text || "持續記帳以獲得更多分析！";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "暫時無法產生建議。";
  }
};