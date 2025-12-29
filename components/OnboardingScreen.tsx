import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const OnboardingScreen: React.FC = () => {
  const { createLedger, joinLedger, savedLedgers, switchLedger, refreshUserProfile } = useAppContext();
  const [ledgerName, setLedgerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  const handleCreate = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const name = ledgerName.trim() || '我的帳本';
      await createLedger(name);
    } catch (e) {
      console.error('Create ledger failed:', e);
      setError('建立帳本失敗，請稍後再試。');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (busy) return;
    const code = inviteCode.trim();
    if (!code) {
      setError('請輸入邀請碼。');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const ok = await joinLedger(code);
      if (!ok) {
        setError('找不到帳本或沒有權限。');
      }
    } catch (e) {
      console.error('Join ledger failed:', e);
      setError('加入帳本失敗，請稍後再試。');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectLedger = async (id: string) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await switchLedger(id);
    } catch (e) {
      console.error('Switch ledger failed:', e);
      setError('切換帳本失敗，請稍後再試。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100 text-slate-900">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
            新
          </div>
          <div>
            <h1 className="text-xl font-bold">開始使用 CloudLedger</h1>
            <p className="text-sm text-slate-500">建立新帳本或加入現有帳本</p>
          </div>
        </div>

        <div className="space-y-4">
          {savedLedgers.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">選擇您的帳本</h2>
              <div className="space-y-2">
                {savedLedgers.map((ledger) => (
                  <button
                    key={ledger.id}
                    onClick={() => handleSelectLedger(ledger.id)}
                    disabled={busy}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-left disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{ledger.alias}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">ID: {ledger.id}</div>
                    </div>
                    <span className="text-xs text-slate-500">進入</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowJoin((v) => !v)}
                className="mt-3 text-xs text-slate-500 hover:text-slate-700"
              >
                {showJoin ? '收起邀請碼輸入' : '我有邀請碼'}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">建立新帳本</h2>
            <input
              value={ledgerName}
              onChange={(e) => setLedgerName(e.target.value)}
              placeholder="帳本名稱（可留空）"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleCreate}
              disabled={busy}
              className="mt-3 w-full bg-amber-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? '處理中...' : '建立帳本'}
            </button>
          </div>

          {(savedLedgers.length === 0 || showJoin) && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">加入現有帳本</h2>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="輸入邀請碼"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                onClick={handleJoin}
                disabled={busy}
                className="mt-3 w-full bg-sky-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-sky-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? '處理中...' : '加入帳本'}
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-slate-400">
          這個設定頁面無法略過，完成後即可開始使用。
        </p>
      </div>
    </div>
  );
};

export default OnboardingScreen;
