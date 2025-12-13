import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, User, SavedLedger } from '../types';
import { useAuth } from './AuthContext';
import { db, isMockMode } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc,
  getDoc,
  arrayUnion
} from 'firebase/firestore';

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  loadData: (data: { transactions: Transaction[], users: User[] }) => void;
  currentUser: User;
  users: User[];
  ledgerId: string | null;
  joinLedger: (id: string) => Promise<boolean>;
  createLedger: (name: string) => Promise<void>;
  switchLedger: (id: string) => Promise<void>;
  leaveLedger: (id: string) => Promise<void>;
  updateLedgerAlias: (id: string, alias: string) => Promise<void>;
  savedLedgers: SavedLedger[];
  switchUser: (userId: string) => void;
  addUser: (name: string) => void;
  removeUser: (userId: string) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_LEDGER_ID = 'duoledger_ledger_id';
const MOCK_STORAGE_KEY_TXS = 'duoledger_mock_txs';
const MOCK_STORAGE_KEY_USER_PROFILE = 'duoledger_mock_profile';
const STORAGE_KEY_THEME = 'duoledger_theme';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [savedLedgers, setSavedLedgers] = useState<SavedLedger[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Local fallback state
  const [localUsers, setLocalUsers] = useState<User[]>([{
    uid: 'local_user',
    displayName: '訪客',
    email: null,
    photoURL: null,
    color: 'bg-blue-500'
  }]);

  // --- Theme Initialization ---
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  };

  // --- Helper to update User Profile (Firestore or Local) ---
  const syncUserProfile = async (uid: string, data: { lastLedgerId?: string; savedLedgers?: SavedLedger[] }) => {
    if (isMockMode) {
      const currentStr = localStorage.getItem(MOCK_STORAGE_KEY_USER_PROFILE);
      const current = currentStr ? JSON.parse(currentStr) : { savedLedgers: [] };
      const updated = { ...current, ...data };
      localStorage.setItem(MOCK_STORAGE_KEY_USER_PROFILE, JSON.stringify(updated));
      return;
    }

    if (!db) return;
    const userRef = doc(db, 'users', uid);
    try {
      await setDoc(userRef, data, { merge: true });
    } catch (e) {
      console.error("Error syncing user profile:", e);
    }
  };

  // --- 1. Initialization Logic (User Login -> Load Profile -> Load Ledger) ---
  useEffect(() => {
    if (!authUser) return;

    const initializeUser = async () => {
      // 1. Mock Mode Handling
      if (isMockMode) {
        setUsers([
          { uid: authUser.uid, displayName: authUser.displayName, email: authUser.email, photoURL: authUser.photoURL, color: 'bg-indigo-500' },
          { uid: 'mock-partner', displayName: '另一半 (範例)', email: 'partner@demo.com', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Annie', color: 'bg-pink-500' }
        ]);

        const profileStr = localStorage.getItem(MOCK_STORAGE_KEY_USER_PROFILE);
        let profile = profileStr ? JSON.parse(profileStr) : null;
        
        let targetLedgerId = profile?.lastLedgerId || localStorage.getItem(STORAGE_KEY_LEDGER_ID);
        
        if (!targetLedgerId) {
           targetLedgerId = 'mock-ledger-demo';
           profile = { 
             lastLedgerId: targetLedgerId, 
             savedLedgers: [{ id: targetLedgerId, alias: '我的範例帳本', lastAccessedAt: Date.now() }] 
           };
           localStorage.setItem(MOCK_STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
        }

        setLedgerId(targetLedgerId);
        setSavedLedgers(profile.savedLedgers || []);
        localStorage.setItem(STORAGE_KEY_LEDGER_ID, targetLedgerId);
        return;
      }

      if (!db) return;

      // 2. Real Firestore Handling
      const userRef = doc(db, 'users', authUser.uid);
      
      try {
        const userSnap = await getDoc(userRef);
        let targetId = '';
        let currentSavedLedgers: SavedLedger[] = [];

        if (userSnap.exists()) {
          const userData = userSnap.data();
          targetId = userData.lastLedgerId;
          currentSavedLedgers = userData.savedLedgers || [];
          setSavedLedgers(currentSavedLedgers);
        }

        // If no lastLedgerId in Cloud, check localStorage or Create New
        if (!targetId) {
           targetId = localStorage.getItem(STORAGE_KEY_LEDGER_ID) || '';
        }

        if (targetId) {
          // Verify access to this ledger
          try {
             const ledgerRef = doc(db, 'ledgers', targetId);
             const ledgerSnap = await getDoc(ledgerRef);
             if (ledgerSnap.exists()) {
                setLedgerId(targetId);
                // Ensure it's in saved list if valid
                if (!currentSavedLedgers.find(l => l.id === targetId)) {
                   const newList = [...currentSavedLedgers, { id: targetId, alias: ledgerSnap.data().name || '未命名帳本', lastAccessedAt: Date.now() }];
                   setSavedLedgers(newList);
                   await syncUserProfile(authUser.uid, { lastLedgerId: targetId, savedLedgers: newList });
                } else {
                   // Just update last accessed
                   await syncUserProfile(authUser.uid, { lastLedgerId: targetId });
                }
             } else {
                // Invalid ID (deleted?), trigger create new
                targetId = ''; 
             }
          } catch (e) {
             console.error("Error verifying ledger:", e);
             targetId = '';
          }
        }

        // Create new ledger if absolutely nothing found
        if (!targetId) {
           await createNewLedgerInternal(authUser, '我的帳本', currentSavedLedgers);
        }

      } catch (e) {
        console.error("Error initializing user:", e);
      }
    };

    initializeUser();
  }, [authUser]);


  // Internal helper to create ledger and update state
  const createNewLedgerInternal = async (user: User, name: string, currentList: SavedLedger[]) => {
      if (!db) return;
      try {
        const newLedgerRef = doc(collection(db, 'ledgers'));
        const newLedgerData = {
          name: name,
          createdAt: Date.now(),
          ownerUid: user.uid,
          members: [{
             uid: user.uid,
             displayName: user.displayName,
             photoURL: user.photoURL,
             email: user.email
          }]
        };
        await setDoc(newLedgerRef, newLedgerData);
        
        const newEntry: SavedLedger = { id: newLedgerRef.id, alias: name, lastAccessedAt: Date.now() };
        const newList = [...currentList, newEntry];
        
        setLedgerId(newLedgerRef.id);
        setSavedLedgers(newList);
        
        await syncUserProfile(user.uid, { lastLedgerId: newLedgerRef.id, savedLedgers: newList });
        localStorage.setItem(STORAGE_KEY_LEDGER_ID, newLedgerRef.id);
      } catch (e: any) {
        console.error("Create ledger failed:", e);
        alert("建立帳本失敗: " + e.message);
      }
  };

  // --- 2. Sync Ledger Data (Transactions & Members) ---
  useEffect(() => {
    if (!authUser || !ledgerId) return;

    if (isMockMode) {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY_TXS);
      if (stored) {
        setTransactions(JSON.parse(stored));
      } else {
        setTransactions([]);
      }
      return;
    }

    if (!db) return;

    // Listen to Transactions
    const q = query(collection(db, `ledgers/${ledgerId}/transactions`), orderBy('date', 'desc'));
    const unsubscribeTx = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
    });

    // Listen to Ledger Metadata (Members)
    const ledgerRef = doc(db, 'ledgers', ledgerId);
    const unsubscribeLedger = onSnapshot(ledgerRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.members) {
          setUsers(data.members);
        }
      }
    });

    return () => {
      unsubscribeTx();
      unsubscribeLedger();
    };
  }, [authUser, ledgerId]);


  // --- Actions ---

  const createLedger = async (name: string) => {
      if (!authUser) return;
      if (isMockMode) {
          alert("演示模式下無法建立多個帳本。");
          return;
      }
      await createNewLedgerInternal(authUser, name, savedLedgers);
  };

  const switchLedger = async (id: string) => {
      if (!authUser) return;
      
      // Local state update
      setLedgerId(id);
      localStorage.setItem(STORAGE_KEY_LEDGER_ID, id);
      
      // Cloud update
      if (!isMockMode && db) {
          await syncUserProfile(authUser.uid, { lastLedgerId: id });
          // Update last accessed time locally for UI immediately
          const updatedList = savedLedgers.map(l => l.id === id ? { ...l, lastAccessedAt: Date.now() } : l);
          setSavedLedgers(updatedList);
          await syncUserProfile(authUser.uid, { savedLedgers: updatedList });
      }
  };

  const leaveLedger = async (id: string) => {
    if (!authUser) return;
    if (isMockMode) {
        const newSaved = savedLedgers.filter(l => l.id !== id);
        setSavedLedgers(newSaved);
        // If exiting current
        if (id === ledgerId) {
            if (newSaved.length > 0) switchLedger(newSaved[0].id);
            else alert("這是演示模式最後一個帳本，無法退出。");
        }
        return;
    }

    if (!db) return;
    
    try {
        // 1. Remove from local list & Firestore User Profile
        const newSavedList = savedLedgers.filter(l => l.id !== id);
        setSavedLedgers(newSavedList);
        await syncUserProfile(authUser.uid, { savedLedgers: newSavedList });

        // 2. Remove user from Ledger Members in Firestore
        // We have to read the ledger first to filter out the user object correctly
        // (Firestore arrayRemove needs exact object match which is hard with changing props)
        const ledgerRef = doc(db, 'ledgers', id);
        const ledgerSnap = await getDoc(ledgerRef);
        if (ledgerSnap.exists()) {
            const data = ledgerSnap.data();
            const newMembers = (data.members || []).filter((m: User) => m.uid !== authUser.uid);
            await updateDoc(ledgerRef, { members: newMembers });
        }

        // 3. Handle active ledger switch
        if (ledgerId === id) {
            if (newSavedList.length > 0) {
                // Switch to the first available one
                const nextId = newSavedList[0].id;
                setLedgerId(nextId);
                localStorage.setItem(STORAGE_KEY_LEDGER_ID, nextId);
                await syncUserProfile(authUser.uid, { lastLedgerId: nextId });
            } else {
                // If no ledgers left, create a new default one immediately to prevent blank screen
                await createNewLedgerInternal(authUser, '我的新帳本', []);
            }
        }
    } catch (e: any) {
        console.error("Leave ledger failed:", e);
        alert("退出帳本失敗: " + e.message);
    }
  };

  const updateLedgerAlias = async (id: string, alias: string) => {
     if (!authUser) return;
     const updatedList = savedLedgers.map(l => l.id === id ? { ...l, alias } : l);
     setSavedLedgers(updatedList);
     await syncUserProfile(authUser.uid, { savedLedgers: updatedList });
  };

  const joinLedger = async (id: string): Promise<boolean> => {
     if (isMockMode) {
       alert("演示模式下無法同步真實資料。");
       setLedgerId(id);
       return true;
     }

     if (!db || !authUser) return false;
     try {
       const ref = doc(db, 'ledgers', id);
       const snap = await getDoc(ref);
       
       if (snap.exists()) {
         const data = snap.data();
         
         // 1. Add user to ledger members if not already
         const members = data.members || [];
         if (!members.find((m: any) => m.uid === authUser.uid)) {
            await updateDoc(ref, {
               members: arrayUnion({
                  uid: authUser.uid,
                  displayName: authUser.displayName,
                  photoURL: authUser.photoURL,
                  email: authUser.email
               })
            });
         }

         // 2. Add to user's saved list
         const newEntry: SavedLedger = { 
             id: id, 
             alias: data.name || '已加入的帳本', 
             lastAccessedAt: Date.now() 
         };
         
         // Avoid duplicates
         const newList = savedLedgers.filter(l => l.id !== id).concat(newEntry);
         
         setSavedLedgers(newList);
         setLedgerId(id);
         localStorage.setItem(STORAGE_KEY_LEDGER_ID, id);

         await syncUserProfile(authUser.uid, { 
             lastLedgerId: id,
             savedLedgers: newList
         });

         return true;
       } else {
         return false;
       }
     } catch (e: any) {
       console.error(e);
       alert(`加入帳本失敗：${e.message}`);
       return false;
     }
  };

  // Transaction Actions (unchanged logic, just context access)
  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!authUser || !ledgerId) return;
    if (isMockMode) {
        // Mock implementation
        const newTx: Transaction = { ...t, id: 'mock-'+Date.now(), createdAt: Date.now(), ledgerId, creatorUid: authUser.uid };
        setTransactions([newTx, ...transactions]);
        localStorage.setItem(MOCK_STORAGE_KEY_TXS, JSON.stringify([newTx, ...transactions]));
        return;
    }
    if (!db) return;
    try {
      await addDoc(collection(db, `ledgers/${ledgerId}/transactions`), { ...t, createdAt: Date.now(), creatorUid: authUser.uid });
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (isMockMode) {
        const updated = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        setTransactions(updated);
        localStorage.setItem(MOCK_STORAGE_KEY_TXS, JSON.stringify(updated));
        return;
    }
    if (!ledgerId || !db) return;
    await updateDoc(doc(db, `ledgers/${ledgerId}/transactions`, id), updates);
  };

  const deleteTransaction = async (id: string) => {
    if (isMockMode) {
        const filtered = transactions.filter(t => t.id !== id);
        setTransactions(filtered);
        localStorage.setItem(MOCK_STORAGE_KEY_TXS, JSON.stringify(filtered));
        return;
    }
    if (!ledgerId || !db) return;
    await deleteDoc(doc(db, `ledgers/${ledgerId}/transactions`, id));
  };

  // Placeholders
  const loadData = () => {};
  const switchUser = () => {}; 
  const addUser = () => {};
  const removeUser = () => {};

  const currentUser: User = authUser ? {
      uid: authUser.uid,
      displayName: authUser.displayName,
      email: authUser.email,
      photoURL: authUser.photoURL,
      color: 'bg-indigo-500'
  } : localUsers[0];

  const activeUsers = authUser ? users : localUsers;

  return (
    <AppContext.Provider value={{
      transactions,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      loadData,
      currentUser,
      users: activeUsers,
      ledgerId,
      joinLedger,
      createLedger,
      switchLedger,
      leaveLedger,
      updateLedgerAlias,
      savedLedgers,
      switchUser,
      addUser,
      removeUser,
      selectedDate,
      setSelectedDate,
      isDarkMode,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};