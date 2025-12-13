import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TransactionType } from '../types'; // ❌ 移除 Category 引用

const Statistics = () => {
  // ✅ 1. 從 Context 取出動態的 categories 清單
  const { transactions, users, categories } = useAppContext();

  const stats = useMemo(() => {
    // Member Spending
    const memberStats = users.map(user => {
      const spent = transactions
        .filter(t => t.creatorUid === user.uid && t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { ...user, spent };
    }).sort((a, b) => b.spent - a.spent);

    // Category Spending
    // ✅ 2. 改為遍歷動態分類清單，而不是舊的 Enum
    const categoryStats = categories.map(cat => {
      const amount = transactions
        .filter(t => t.category === cat && t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: cat, amount };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    const totalExpense = categoryStats.reduce((acc, curr) => acc + curr.amount, 0);

    return { memberStats, categoryStats, totalExpense };
  }, [transactions, users, categories]); // 加入 categories 依賴

  // ✅ 3. 修正顏色邏輯 (改用字串比對)
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case '餐飲': return 'bg-orange-500';
      case '交通': return 'bg-blue-500';
      case '購物': return 'bg-pink-500';
      case '居住': return 'bg-purple-500';
      case '薪資': return 'bg-emerald-500';
      case '娛樂': return 'bg-yellow-500';
      case '投資': return 'bg-cyan-500';
      // 自訂分類預設顏色，或給它一個通用的 indigo
      default: return 'bg-indigo-400'; 
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">財務統計</h2>

      {/* Member Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">成員支出排行</h3>
        <div className="space-y-4">
          {stats.memberStats.map((user, idx) => (
            <div key={user.uid} className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="font-bold text-slate-400 dark:text-slate-500 w-4">{idx + 1}</div>
                  <div className="relative">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 object-cover" />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${user.color || 'bg-gray-400'}`}></div>
                  </div>
                  <div className="font-medium text-slate-700 dark:text-slate-200">{user.displayName || '未知成員'}</div>
               </div>
               <div className="text-right">
                  <div className="font-bold text-slate-800 dark:text-white">${user.spent.toLocaleString()}</div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">支出類別佔比</h3>
        {stats.categoryStats.length > 0 ? (
          <div className="space-y-4">
            {stats.categoryStats.map((cat) => {
              const percentage = Math.round((cat.amount / stats.totalExpense) * 100);
              return (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{percentage}% (${cat.amount.toLocaleString()})</span>
                  </div>
                  {/* 進度條背景色 dark:bg-slate-700 */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden transition-colors">
                    <div 
                      className={`h-2.5 rounded-full ${getCategoryColor(cat.name)}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-400 dark:text-slate-500 py-8 text-sm">尚無支出紀錄</div>
        )}
      </div>
    </div>
  );
};

export default Statistics;