export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

// 摰儔 Category ?箏?銝脣??伐??嫣噶敺??游?
export type Category = string;

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
  
  // ???啣?嚗董?砍?撅祉???皜
  categories: string[]; 
  
  createdAt: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  
  // ?ㄐ?寧 string ?喳嚗??箇?典?憿????  category: string; 
  
  description: string;
  rewards: number; // Value of points/cashback received
  date: string; // ISO String
  creatorUid: string; // The UID of the user who created this record
  ledgerId: string; // Link to the associated ledger
  createdAt: number;

  // 憓??郊甈?
  updatedAt?: number; // unix ms
  deleted?: boolean; 
  deletedAt?: number;
}

export interface SpendingSummary {
  totalIncome: number;
  totalExpense: number;
  totalRewards: number;
  balance: number;
}

// ??2.3.0?啣?嚗頂蝯勗????export interface SystemAnnouncement {
  text: string;
  isEnabled: boolean;
  startAt: any; // Firestore Timestamp
  endAt: any;   // Firestore Timestamp
  type?: 'info' | 'warning' | 'error';
}
