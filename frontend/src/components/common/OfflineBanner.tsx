import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { getLastSyncTimestamp, syncPublicDrugs, getCachedDrugCount } from '../../services/offlineDrugCache';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTimestamp());
  const [cachedCount, setCachedCount] = useState<number>(getCachedDrugCount());
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setDismissed(false);
      setIsSyncing(true);
      syncPublicDrugs().then((res) => {
        setIsSyncing(false);
        if (res.synced_at) setLastSync(res.synced_at);
        if (res.count) setCachedCount(res.count);
      });
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setDismissed(false);
      setLastSync(getLastSyncTimestamp());
      setCachedCount(getCachedDrugCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial background sync if online and cache empty
    if (navigator.onLine && getCachedDrugCount() === 0) {
      syncPublicDrugs().then((res) => {
        if (res.synced_at) setLastSync(res.synced_at);
        if (res.count) setCachedCount(res.count);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatLastSync = (iso: string | null) => {
    if (!iso) return "Hali sinxronizatsiya qilinmagan";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  if (isOnline && !justReconnected) {
    return null;
  }

  if (dismissed && !justReconnected) {
    return null;
  }

  return (
    <div className="w-full z-50 sticky top-0 transition-all duration-300">
      {justReconnected ? (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 animate-pulse" />
            <span>
              <b>Aloqa tiklandi!</b> Dori vositalari ochiq katalogi muvaffaqiyatli yangilandi.
            </span>
          </div>
          <button
            onClick={() => setJustReconnected(false)}
            className="text-white/80 hover:text-white p-1 rounded-full"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs sm:text-sm shadow-lg border-b border-amber-600">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 mt-0.5 text-amber-950 flex-shrink-0" />
              <div>
                <p className="font-bold leading-tight">
                  Offline rejim: Internet aloqasi yo'q.
                </p>
                <p className="text-[11px] text-amber-950 mt-0.5">
                  Avval yuklangan {cachedCount > 0 ? `(${cachedCount} ta dori)` : ''} ma'lumotlaridan qidirishingiz mumkin.
                  Oxirgi yangilanish: <b>{formatLastSync(lastSync)}</b>.
                </p>
                <p className="text-[11px] text-amber-950 font-semibold mt-0.5 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-900 inline" />
                  Offline narxlar va dorixona mavjudligi eskirgan bo'lishi mumkin. Dori dozasini o'zgartirmang! Shoshilinchda: <b>103</b>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => setDismissed(true)}
                className="text-amber-950 hover:bg-amber-600/20 px-2 py-1 rounded text-xs font-semibold"
              >
                Tushundim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
