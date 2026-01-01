import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { parseSmartInput } from '../services/geminiService';
import { TransactionType } from '../types';
// ???啣? Mic, MicOff, Wand2 ?內
import { Mic, MicOff, Check, Wand2 } from 'lucide-react'; 

// ?游? window ?拐辣隞交?渡汗?刻???API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const MagicWandIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m19 14-4-4 4-4"/><path d="M15 10H7"/><path d="M7 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2Z"/></svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

interface Props {
  onComplete: () => void;
}

interface Props {
  onComplete: () => void;
  autoStartVoice?: boolean;
}

const AddTransaction: React.FC<Props> = ({ onComplete, autoStartVoice = false }) => {
  // 1. 敺?AppContext ???
  const { addTransaction, createRecurringTemplate, currentUser, ledgerId, selectedDate, expenseCategories, incomeCategories } = useAppContext();
  // ?箸頛詨?臬撌脣??剁???Settings ?批銝血???localStorage嚗?  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(() => {
    return localStorage.getItem('user_gemini_enabled') === '1';
  });
  const [mode, setMode] = useState<'manual' | 'smart'>(() => (localStorage.getItem('user_gemini_enabled') === '1' ? 'smart' : 'manual'));

  
  // Smart Input State
  const [smartInput, setSmartInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false); // ??隤???
  // Manual Form State
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  const [category, setCategory] = useState<string>('');

  // 2. ??瘙箏??桀?閰脤＊蝷箏銝蝯?憿?  const currentCategories = type === TransactionType.EXPENSE 
      ? (expenseCategories || []) 
      : (incomeCategories || []);

  // 3. ?嗅???舫???嚗??閮剖?憿閰脤???蝚砌????  useEffect(() => {
      if (currentCategories.length > 0) {
          if (!currentCategories.includes(category)) {
              setCategory(currentCategories[0]);
          }
      }
  }, [type, currentCategories, category]);
  
  const [description, setDescription] = useState('');
  const [rewards, setRewards] = useState<string>('0');
  const [isRecurring, setIsRecurring] = useState(false);
  const [executeDay, setExecuteDay] = useState<number>(() => {
    const today = new Date();
    return today.getDate();
  });
  const [intervalMonths, setIntervalMonths] = useState<number>(1);
  const [runMode, setRunMode] = useState<'continuous' | 'limited'>('continuous');
  const [totalRuns, setTotalRuns] = useState<string>('12');
  
  // Initialize date with selectedDate or today
  const [date, setDate] = useState(() => {
    const target = selectedDate || new Date();
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    if (isRecurring) return;
    const day = Number(date.split('-')[2]);
    if (!Number.isNaN(day)) {
      setExecuteDay(day);
    }
  }, [date, isRecurring]);

  const addMonthsWithDay = (base: Date, months: number, day: number) => {
    const year = base.getFullYear();
    const monthIndex = base.getMonth() + months;
    const targetYear = year + Math.floor(monthIndex / 12);
    const targetMonth = ((monthIndex % 12) + 12) % 12;
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const safeDay = Math.min(day, daysInMonth);
    const next = new Date(targetYear, targetMonth, safeDay);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  const computeNextRunAt = (day: number, interval: number) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const safeDay = Math.min(day, daysInMonth);
    let next = new Date(base.getFullYear(), base.getMonth(), safeDay);
    next.setHours(0, 0, 0, 0);
    if (next < now) {
      next = addMonthsWithDay(next, interval, day);
    }
    return next;
  };

  // If autoStartVoice was requested, trigger voice input on mount when in smart mode
  useEffect(() => {
    // Listen for Settings toggles so the tab visibility updates immediately
    const handler = (e: any) => {
      const enabled = typeof e?.detail?.enabled === 'boolean' ? e.detail.enabled : (localStorage.getItem('user_gemini_enabled') === '1');
      setIsAIEnabled(enabled);
      if (!enabled && mode === 'smart') setMode('manual');
    };

    window.addEventListener('user-gemini-enabled-change', handler as EventListener);

    // If autoStartVoice was requested, ensure AI is enabled and auto-start when in smart mode
    if (autoStartVoice && mode === 'smart' && isAIEnabled) {
      // Minor delay to ensure component rendered fully
      setTimeout(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          // If Web Speech API not available, navigate to settings or notify user
          alert('?函??汗?其??舀隤頛詨? (隢蝙??Chrome ??Safari)');
          return;
        }
        handleVoiceInput();
      }, 200);
    }

    return () => window.removeEventListener('user-gemini-enabled-change', handler as EventListener);
  }, [autoStartVoice, mode, isAIEnabled]);

  // ??隤頛詨???摩
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("?函??汗?其??舀隤頛詨? (隢蝙??Chrome ??Safari)");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW'; 
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      
      setSmartInput(transcript); 
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;

    setIsParsing(true);

    // 4. 撠蝯?憿?雿萄蝯?AI
    const allCategories = [...(expenseCategories || []), ...(incomeCategories || [])];
    const result = await parseSmartInput(smartInput, allCategories);
    setIsParsing(false);

    if (result) {
      setAmount(result.amount.toString());
      
      const newType = result.type as TransactionType;
      setType(newType);
      
      const targetList = newType === TransactionType.EXPENSE ? expenseCategories : incomeCategories;

      if (targetList && targetList.includes(result.category)) {
          setCategory(result.category);
      } else {
          setCategory(targetList?.[0] || '?嗡?');
      }
      
      setDescription(result.description);
      setRewards(result.rewards?.toString() || '0');

      if (result.date) {
        setDate(result.date);
      }

      setMode('manual');
    } else {
      alert('?⊥??圾頛詨?批捆嚗??岫?蝙?冽??芋撘撓?乓?);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerId) return;
    const amountValue = parseFloat(amount);
    if (Number.isNaN(amountValue)) return;

    try {
      await addTransaction({
        amount: amountValue,
        type,
        category: category,
        description,
        rewards: parseFloat(rewards) || 0,
        date: new Date(date).toISOString(),
        creatorUid: currentUser.uid, 
        ledgerId
      });

      if (isRecurring) {
        const day = Math.min(Math.max(executeDay, 1), 31);
        const interval = Math.max(Number(intervalMonths) || 1, 1);
        const nextRunAt = computeNextRunAt(day, interval);
        const isLimited = runMode === 'limited';
        const runs = isLimited ? Math.max(parseInt(totalRuns, 10) || 1, 1) : undefined;

        await createRecurringTemplate({
          title: description,
          amount: amountValue,
          type: type === TransactionType.EXPENSE ? 'expense' : 'income',
          category,
          note: '',
          intervalMonths: interval,
          executeDay: day,
          nextRunAt,
          totalRuns: runs,
          remainingRuns: runs
        });
      }

      onComplete();
    } catch (e) {
      console.error('Save transaction failed:', e);
      alert('?脣?憭望?嚗?蝔??岫??);
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 transition-colors";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {isAIEnabled && (
          <button
            onClick={() => setMode('smart')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'smart' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Wand2 className="w-4 h-4" />
            ?箸頛詨
          </button>
        )}

        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          ??頛詨
        </button>
      </div>

      <div className="p-5">
        {mode === 'smart' ? (
          <form onSubmit={handleSmartSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ?冽?摮?餈唬漱??              </label>
              
              {/* ??頛詨獢?隤??摰孵 */}
              <div className="relative">
                <textarea
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  placeholder="靘?嚗憭拇?擗?蝢拙之?拚熊 500???? 20 暺?
                  className="w-full p-3 pb-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none transition-colors"
                />
                
                {/* ? 隤?? */}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 shadow-sm ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse shadow-rose-200' 
                      : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                  title="隤頛詨"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                AI 撠????憿?憿?餈啜?擖誑???              </p>
              <p className="text-[11px] text-indigo-500 mt-1">
                ?瑟??恍銝???敹恍????唾儘霅?蝡??頛詨??              </p>
            </div>
            <button
              type="submit"
              disabled={isParsing || !smartInput}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:shadow-indigo-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isParsing ? '??銝?..' : (
                <>
                  <MagicWandIcon className="w-5 h-5" />
                  閫???批捆
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
                    className={`${inputClass} pl-8 pr-4 py-2.5 font-bold text-lg`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">??</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`${inputClass} p-2.5 text-sm`}
                >
                  {/* 5. 雿輻 currentCategories 皜脫??賊? */}
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
                  className={`${inputClass} p-2.5 text-sm text-slate-600 dark:text-slate-300`}
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
                className={`${inputClass} p-2.5 text-sm`}
                placeholder="??瘨祥?舐鈭?暻潘?"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>?? / 暺</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">?詨‵</span>
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

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">閮剔?望???/div>
                  <div className="text-[11px] text-slate-400">瘥??芸?閮董嚗????箏?鞎餌嚗?/div>
                </div>
                <label className="inline-flex relative items-center cursor-pointer">
                  <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="sr-only" />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isRecurring ? 'translate-x-5' : ''}`}></span>
                  </div>
                </label>
              </div>

              {isRecurring && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">瘥???狡??/label>
                      <select
                        value={executeDay}
                        onChange={(e) => setExecuteDay(Number(e.target.value))}
                        className={`${inputClass} p-2.5 text-sm`}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d} ??/option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">瘥?N ??</label>
                      <input
                        type="number"
                        min={1}
                        value={intervalMonths}
                        onChange={(e) => setIntervalMonths(Number(e.target.value))}
                        className={`${inputClass} p-2.5 text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">?瑁?甈⊥</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRunMode('continuous')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm border ${runMode === 'continuous' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                      >
                        ??
                      </button>
                      <button
                        type="button"
                        onClick={() => setRunMode('limited')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm border ${runMode === 'limited' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                      >
                        ??甈⊥
                      </button>
                    </div>
                    {runMode === 'limited' && (
                      <input
                        type="number"
                        min={1}
                        value={totalRuns}
                        onChange={(e) => setTotalRuns(e.target.value)}
                        className={`${inputClass} p-2.5 text-sm mt-2`}
                        placeholder="靘?嚗?2"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-indigo-600 text-white py-3 rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              ?脣?鈭斗?
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddTransaction;
