import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TransactionType, Category } from '../types';

const Statistics = () => {
  const { transactions, users } = useAppContext();

  const stats = useMemo(() => {
    // Member Spending
    const memberStats = users.map(user => {
      const spent = transactions
        .filter(t => t.creatorUid === user.uid && t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { ...user, spent };
    }).sort((a, b) => b.spent - a.spent);

    // Category Spending
    const categoryStats = Object.values(Category).map(cat => {
      const amount = transactions
        .filter(t => t.category === cat && t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { name: cat, amount };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    const totalExpense = categoryStats.reduce((acc, curr) => acc + curr.amount, 0);

    return { memberStats, categoryStats, totalExpense };
  }, [transactions, users]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case Category.FOOD: return 'bg-orange-500';
      case Category.TRANSPORT: return 'bg-blue-500';
      case Category.SHOPPING: return 'bg-pink-500';
      case Category.HOUSING: return 'bg-purple-500';
      case Category.SALARY: return 'bg-emerald-500';
      case Category.ENTERTAINMENT: return 'bg-yellow-500';
      case Category.INVESTMENT: return 'bg-cyan-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-xl font-bold text-slate-800">財務統計</h2>

      {/* Member Breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">成員支出排行</h3>
        <div className="space-y-4">
          {stats.memberStats.map((user, idx) => (
            <div key={user.uid} className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="font-bold text-slate-400 w-4">{idx + 1}</div>
                  <div className="relative">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full bg-slate-50 object-cover" />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.color || 'bg-gray-400'}`}></div>
                  </div>
                  <div className="font-medium text-slate-700">{user.displayName}</div>
               </div>
               <div className="text-right">
                  <div className="font-bold text-slate-800">${user.spent.toLocaleString()}</div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">支出類別佔比</h3>
        {stats.categoryStats.length > 0 ? (
          <div className="space-y-4">
            {stats.categoryStats.map((cat) => {
              const percentage = Math.round((cat.amount / stats.totalExpense) * 100);
              return (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-slate-500">{percentage}% (${cat.amount.toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
          <div className="text-center text-slate-400 py-8 text-sm">尚無支出紀錄</div>
        )}
      </div>
    </div>
  );
};

export default Statistics;