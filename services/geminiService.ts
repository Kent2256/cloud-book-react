import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase"; // 確保引入的是初始化的 app
import { TransactionType, DEFAULT_CATEGORIES } from "../types";

// 初始化 Cloud Functions
const functions = getFunctions(app);

export interface ParsedTransactionData {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  rewards: number;
  date?: string;
}

/**
 * 呼叫 Firebase Cloud Function (後端) 進行 AI 解析
 */
export const parseSmartInput = async (
  input: string, 
  availableCategories: string[] = DEFAULT_CATEGORIES 
): Promise<ParsedTransactionData | null> => {
  try {
    // 建立後端函式參照
    const parseTransactionFn = httpsCallable(functions, 'parseTransaction');
    
    // 發送請求
    const result = await parseTransactionFn({
      text: input,
      categories: availableCategories
    });

    // Cloud Functions 回傳的資料在 data 屬性中
    return result.data as ParsedTransactionData;

  } catch (error) {
    console.error("Cloud Function Call Error:", error);
    return null;
  }
};

// (記得 getFinancialAdvice 已經移除了，這裡不需要放)