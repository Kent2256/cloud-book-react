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
      const name = ledgerName.trim() || '??撣單';
      await createLedger(name);
    } catch (e) {
      console.error('Create ledger failed:', e);
      setError('撱箇?撣單憭望?嚗?蝔??岫??);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (busy) return;
    const code = inviteCode.trim();
    if (!code) {
      setError('隢撓?仿?隢Ⅳ??);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const ok = await joinLedger(code);
      if (!ok) {
        setError('?曆??啣董?祆?瘝?甈???);
      }
    } catch (e) {
      console.error('Join ledger failed:', e);
      setError('?撣單憭望?嚗?蝔??岫??);
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
      setError('??撣單憭望?嚗?蝔??岫??);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100 text-slate-900">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
            ??          </div>
          <div>
            <h1 className="text-xl font-bold">??雿輻 CloudLedger</h1>
            <p className="text-sm text-slate-500">撱箇??啣董?祆???暹?撣單</p>
          </div>
        </div>

        <div className="space-y-4">
          {savedLedgers.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">?豢??函?撣單</h2>
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
                    <span className="text-xs text-slate-500">?脣</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowJoin((v) => !v)}
                className="mt-3 text-xs text-slate-500 hover:text-slate-700"
              >
                {showJoin ? '?嗉絲?隢Ⅳ頛詨' : '???隢Ⅳ'}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">撱箇??啣董??/h2>
            <input
              value={ledgerName}
              onChange={(e) => setLedgerName(e.target.value)}
              placeholder="撣單?迂嚗?征嚗?
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleCreate}
              disabled={busy}
              className="mt-3 w-full bg-amber-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? '??銝?..' : '撱箇?撣單'}
            </button>
          </div>

          {(savedLedgers.length === 0 || showJoin) && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">??暹?撣單</h2>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="頛詨?隢Ⅳ"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                onClick={handleJoin}
                disabled={busy}
                className="mt-3 w-full bg-sky-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-sky-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? '??銝?..' : '?撣單'}
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
          ?身摰??Ｙ瘜??摰?敺?舫?憪蝙?具?        </p>
      </div>
    </div>
  );
};

export default OnboardingScreen;
