
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  FOOD = '餐飲',
  TRANSPORT = '交通',
  SHOPPING = '購物',
  HOUSING = '居住',
  ENTERTAINMENT = '娛樂',
  SALARY = '薪資',
  INVESTMENT = '投資',
  OTHERS = '其他'
}

export interface User {
  uid: string; // Firebase User ID
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  color?: string; // For UI display, like a fallback color
}

export interface SavedLedger {
  id: string;
  alias: string; // User's personal note/name for this ledger
  lastAccessedAt: number;
}

export interface UserProfile {
  uid: string;
  lastLedgerId?: string;
  savedLedgers: SavedLedger[];
}

export interface Ledger {
  id: string; // Ledger ID (Firestore document ID)
  name: string;
  ownerUid: string; // The UID of the user who created this ledger
  members: string[]; // Array of UIDs of all members
  createdAt: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  rewards: number; // Value of points/cashback received
  date: string; // ISO String
  creatorUid: string; // The UID of the user who created this record
  ledgerId: string; // Link to the associated ledger
  createdAt: number;
}

export interface SpendingSummary {
  totalIncome: number;
  totalExpense: number;
  totalRewards: number;
  balance: number;
}
