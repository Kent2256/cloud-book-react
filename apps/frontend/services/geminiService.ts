import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase"; // 蝣箔?撘????? app
import { TransactionType } from "../types"; 
// ??靽格嚗??交?蝯虜??import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "../constants";

// ????Cloud Functions
const functions = getFunctions(app);

export interface ParsedTransactionData {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  rewards: number;
  date?: string;
}

// ??靽格嚗?雿萄蝯?憿??粹?閮剖?獢?const defaultAllCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

/**
 * ?澆 Firebase Cloud Function (敺垢) ?脰? AI 閫??
 */
export const parseSmartInput = async (
  input: string, 
  // ??靽格嚗?閮剖潭?典?雿萄?????
  availableCategories: string[] = defaultAllCategories 
): Promise<ParsedTransactionData | null> => {
  try {
    // 撱箇?敺垢?賢??
    const parseTransactionFn = httpsCallable(functions, 'parseTransaction');
    
    // Read user-provided key (if any) from localStorage. This allows a user to input a
    // dev-code here and have the backend substitute the server key when appropriate.
    const userKey = localStorage.getItem('user_gemini_key') || undefined;

    // ?潮?瘙?(??apiKey 銝雿菟靘?Functions 瘙箏????孵?)
    const result = await parseTransactionFn({
      text: input,
      categories: availableCategories,
      apiKey: userKey
    });

    // Cloud Functions ???? data 撅祆找葉
    return result.data as ParsedTransactionData;

  } catch (error) {
    console.error("Cloud Function Call Error:", error);
    return null;
  }
};

/**
 * 撽? / 皜祈岫雿輻??靘? API Key嚗蒂??舐璅∪?皜
 */
export const validateApiKey = async (apiKey?: string): Promise<{ valid: boolean; models: string[] } > => {
  try {
    const validateFn = httpsCallable(functions, 'validateKey');
    const result = await validateFn({ apiKey });
    return result.data as { valid: boolean; models: string[] };
  } catch (err) {
    console.error('validateKey call failed', err);
    return { valid: false, models: [] };
  }
};
