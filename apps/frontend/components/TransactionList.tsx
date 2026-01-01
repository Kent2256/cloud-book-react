import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TransactionType, Transaction } from '../types';

const TransactionList = () => {
  const { transactions, users, deleteTransaction, updateTransaction } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search state (client-side, debounced)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce input to avoid excessive filtering during typing
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 200);
    return () => clearTimeout(id);
  }, [search]);

  // Filter transactions by debounced search term (match description, category, or amount)
  const filteredTransactions = React.useMemo(() => {
    if (!debouncedSearch) return transactions;
    const tokens = debouncedSearch.split(/\s+/).filter(Boolean);
    return transactions.filter(t => {
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const amt = String(t.amount || '');
      // Require ALL tokens to be matched in at least one of the fields (AND semantics)
      return tokens.every(token => desc.includes(token) || cat.includes(token) || amt.includes(token));
    });
  }, [transactions, debouncedSearch]);

  // ???芸?嚗???dark mode ???脤??莎?霈?蝐文暺?銝?頛???  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case '擗ㄡ': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case '鈭日?: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case '鞈潛': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
      case '撅?': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case '?芾?': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case '憡?': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      case '??': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400';
      // ?身憿 (??芾???)
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getUser = (id: string) => users.find(u => u.uid === id);

  const editingTransaction = transactions.find(t => t.id === editingId);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <p>撠鈭斗?蝝??/p>
      </div>
    );
  }

  // UI: Search input + count
  const onClearSearch = () => setSearch('');

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg transition-colors">餈?蝝??/h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">蝮賜???{transactions.length} / 憿舐內 {filteredTransactions.length}</div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="??嚗?餈?/ ?? / ??嚗??摮誑蝛箇??嚗?
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-slate-100 transition-colors"
            aria-label="??蝝??
          />
          {search && (
            <button onClick={onClearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400">
              ?
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 && (
          <div className="py-8 text-center text-slate-500">瘝?蝚血???????/div>
        )}

        {filteredTransactions.map((t) => {
          const user = getUser(t.creatorUid);
          const isExpense = t.type === TransactionType.EXPENSE;
          
          return (
            <div 
                key={t.id} 
                onClick={() => setEditingId(t.id)}
                // ???芸?嚗???dark:bg-slate-800, dark:border-slate-700
                className="group relative bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3 transition-all hover:shadow-md cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500/50 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Category Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-colors ${getCategoryColor(t.category)}`}>
                  {t.category[0]}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate transition-colors">{t.description}</h4>
                    {t.rewards > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex items-center shrink-0 transition-colors">
                        +{t.rewards} 暺???                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(t.date).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">??/span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.category}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`font-bold text-lg ${isExpense ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                  {isExpense ? '-' : '+'}${t.amount.toLocaleString()}
                </div>
                <div className="flex justify-end mt-1">
                   {user && (
                     <img src={user.photoURL || ''} alt={user.displayName || 'Guest'} className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-700" title={`蝝??${user.displayName || 'Guest'}`} />
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <EditTransactionModal 
            transaction={editingTransaction}
            onClose={() => setEditingId(null)}
            onSave={(updates) => {
                updateTransaction(editingTransaction.id, updates);
                setEditingId(null);
            }}
            onDelete={() => {
                deleteTransaction(editingTransaction.id);
                setEditingId(null);
            }}
        />
      )}
    </div>
  );
};

// ?曉 TransactionList.tsx ??銝

// Exporting Modal for use in Dashboard
export const EditTransactionModal = ({ 
    transaction, 
    onClose, 
    onSave, 
    onDelete 
}: { 
    transaction: Transaction, 
    onClose: () => void, 
    onSave: (updates: Partial<Transaction>) => void,
    onDelete: () => void
}) => {
    // ??1. 靽格迤嚗??箸??憿???    const { expenseCategories, incomeCategories } = useAppContext();
    
    const [amount, setAmount] = useState(transaction.amount.toString());
    const [type, setType] = useState(transaction.type);
    const [category, setCategory] = useState(transaction.category);
    const [description, setDescription] = useState(transaction.description);
    const [rewards, setRewards] = useState(transaction.rewards.toString());
    const [date, setDate] = useState(transaction.date.split('T')[0]);
    
    // UI state for delete confirmation
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // ??2. ??瘙箏??桀?閰脤＊蝷箏銝蝯?憿?(?脣?嚗策鈭征????身??
    const currentCategories = type === TransactionType.EXPENSE 
        ? (expenseCategories || []) 
        : (incomeCategories || []);

    // ?嗅???舫???嚗????憿??冽皜銝哨??身?箇洵銝??    useEffect(() => {
        if (currentCategories.length > 0 && !currentCategories.includes(category)) {
            setCategory(currentCategories[0]);
        }
    }, [type, currentCategories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            amount: parseFloat(amount),
            type,
            category,
            description,
            rewards: parseFloat(rewards) || 0,
            date: new Date(date).toISOString(),
        });
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isConfirmingDelete) {
            onDelete();
        } else {
            setIsConfirmingDelete(true);
        }
    };

    const handleFormInteract = () => {
        if (isConfirmingDelete) setIsConfirmingDelete(false);
    };

    // 蝯曹?璅?? class
    const inputClass = "w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-slate-100 transition-colors";

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300 border dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">蝺刻摩鈭斗?</h3>
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }} 
                        className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                
                <form 
                    onSubmit={handleSubmit} 
                    className="p-5 space-y-4"
                    onClick={handleFormInteract}
                >
                      {/* Type Toggle */}
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            ?臬
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            ?嗅
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">??</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg text-slate-800 dark:text-slate-100 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">??</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={inputClass}
                            >
                                {/* ??3. 靽格迤嚗蝙??currentCategories 皜脫??賊? */}
                                {currentCategories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">?交?</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">?膩</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
                            <span>?? / 暺</span>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={rewards}
                            onChange={(e) => setRewards(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${
                                isConfirmingDelete 
                                ? 'bg-red-600 text-white shadow-lg scale-105' 
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                            }`}
                        >
                            {isConfirmingDelete ? '蝣箏??芷嚗? : '?芷'}
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors"
                        >
                            ?脣?霈
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionList;
