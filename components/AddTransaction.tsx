import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { parseSmartInput } from '../services/geminiService';
import { TransactionType, Category } from '../types';

const MagicWandIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m19 14-4-4 4-4"/><path d="M15 10H7"/><path d="M7 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2Z"/></svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

interface Props {
  onComplete: () => void;
}

const AddTransaction: React.FC<Props> = ({ onComplete }) => {
  const { addTransaction, currentUser, selectedDate } = useAppContext();
  const [mode, setMode] = useState<'manual' | 'smart'>('smart');
  
  // Smart Input State
  const [smartInput, setSmartInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Manual Form State
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [description, setDescription] = useState('');
  const [rewards, setRewards] = useState<string>('0');
  
  // Initialize date with selectedDate or today
  const [date, setDate] = useState(() => {
    const target = selectedDate || new Date();
    // Format YYYY-MM-DD manually to avoid timezone issues with toISOString() in some cases
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;

    setIsParsing(true);
    const result = await parseSmartInput(smartInput);
    setIsParsing(false);

    if (result) {
      setAmount(result.amount.toString());
      setType(result.type as TransactionType);
      // Ensure category matches enum, default to OTHERS if mismatch
      const cat = Object.values(Category).includes(result.category as Category) 
        ? result.category as Category 
        : Category.OTHERS;
      setCategory(cat);
      setDescription(result.description);
      setRewards(result.rewards?.toString() || '0');
      setMode('manual'); // Switch to manual to review
    } else {
      alert('無法理解輸入內容，請重試或使用手動模式輸入。');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      amount: parseFloat(amount),
      type,
      category,
      description,
      rewards: parseFloat(rewards) || 0,
      date: new Date(date).toISOString(),
      creatorUid: currentUser.uid, 
      ledgerId: 'mock-ledger-1' 
    });
    onComplete();
  };

  // Shared class for manual input fields to ensure visibility
  const inputClass = "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 transition-colors";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setMode('smart')}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'smart' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <MagicWandIcon className="w-4 h-4" />
          智慧輸入
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          手動輸入
        </button>
      </div>

      <div className="p-5">
        {mode === 'smart' ? (
          <form onSubmit={handleSmartSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                用文字描述交易
              </label>
              <textarea
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                placeholder="例如：晚餐吃義大利麵 500元，回饋 20 點"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none transition-colors"
              />
              <p className="text-xs text-slate-400 mt-2">
                AI 將自動分析金額、分類、描述和回饋。
              </p>
            </div>
            <button
              type="submit"
              disabled={isParsing || !smartInput}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:shadow-indigo-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isParsing ? '分析中...' : (
                <>
                  <MagicWandIcon className="w-5 h-5" />
                  解析內容
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            
            {/* Type Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                收入
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">金額</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className={`${inputClass} pl-8 pr-4 py-2.5 font-bold text-lg`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">分類</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className={`${inputClass} p-2.5 text-sm`}
                >
                  {Object.values(Category).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputClass} p-2.5 text-sm text-slate-600 dark:text-slate-300`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">描述</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className={`${inputClass} p-2.5 text-sm`}
                placeholder="這筆消費是為了什麼？"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>回饋 / 點數</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">選填</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={rewards}
                  onChange={(e) => setRewards(e.target.value)}
                  className={`${inputClass} pl-3 pr-4 py-2.5 text-sm focus:ring-amber-400`}
                  placeholder="0"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-indigo-600 text-white py-3 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              儲存交易
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddTransaction;