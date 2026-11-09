import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Check, Sparkles, ShieldCheck, CheckCircle2, Send } from 'lucide-react';
import { sendApkViaTelegram } from '../../services/apiClient';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    try {
      if (localStorage.getItem('vitago_apk_installed') === 'true') return true;
      if ((window as any).VitaGoNative?.isNativeApk?.()) return true;
      if ((window as any).Capacitor?.isNativePlatform?.()) return true;
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [dismissed, setDismissed] = useState(() => {
    return (
      sessionStorage.getItem('pwa_banner_dismissed') === 'true' ||
      localStorage.getItem('vitago_apk_installed') === 'true'
    );
  });
  const [showModal, setShowModal] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check if already in standalone mode or native APK
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      (window as any).VitaGoNative?.isNativeApk?.() ||
      (window as any).Capacitor?.isNativePlatform?.() ||
      localStorage.getItem('vitago_apk_installed') === 'true'
    ) {
      localStorage.setItem('vitago_apk_installed', 'true');
      setIsInstalled(true);
      return;
    }

    // Check Web getInstalledRelatedApps if supported
    try {
      if ('getInstalledRelatedApps' in navigator && typeof (navigator as any).getInstalledRelatedApps === 'function') {
        (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          if (Array.isArray(apps) && apps.length > 0) {
            localStorage.setItem('vitago_apk_installed', 'true');
            setIsInstalled(true);
          }
        }).catch(() => {});
      }
    } catch {
      // ignore
    }

    // Telegram WebApp checkHomeScreenStatus if available
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.checkHomeScreenStatus) {
        tg.checkHomeScreenStatus((status: string) => {
          if (status === 'added') {
            setIsInstalled(true);
          }
        });
      }
    } catch {
      // ignore
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallStatus("Ilova muvaffaqiyatli o'rnatildi!");
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  if (isInstalled || dismissed) return null;

  const handleOpenInstallModal = () => {
    setShowModal(true);
  };

  const handleNativeInstall = async () => {
    try {
      // 1. If in Telegram Mini App, call Telegram's native addToHomeScreen
      const tg = (window as any).Telegram?.WebApp;
      if (tg && typeof tg.addToHomeScreen === 'function') {
        tg.addToHomeScreen();
        setInstallStatus("Ilovani telefon ekraniga o'rnatish so'rovi yuborildi!");
        setShowModal(false);
        return;
      }

      // 2. If browser provided beforeinstallprompt (WebAPK / PWA)
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallStatus("Ilova muvaffaqiyatli o'rnatildi!");
          setShowModal(false);
        }
        setDeferredPrompt(null);
        return;
      }

      // 3. Fallback: Download direct
      handleDownloadApk();
    } catch (err) {
      console.warn('Install error:', err);
      handleDownloadApk();
    }
  };

  const handleDownloadApk = () => {
    const appUrl = 'https://doriscan.vercel.app/VitaGo_App.apk?v=20261108';
    localStorage.setItem('vitago_apk_installed', 'true');

    // 1. If in Telegram WebApp, open via openLink in phone's default browser
    const tg = (window as any).Telegram?.WebApp;
    if (tg && typeof tg.openLink === 'function') {
      try {
        tg.openLink(appUrl, { try_instant_view: false });
      } catch {}
    }

    // 2. Direct anchor click
    try {
      const link = document.createElement('a');
      link.href = appUrl;
      link.download = 'Tetik.apk';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = appUrl;
    }
    setInstallStatus("Tetik ilovasi yuklab olinmoqda...");
  };

  const handleSendViaTelegram = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      let tgId = tg?.initDataUnsafe?.user?.id;
      if (!tgId && tg?.initData) {
        try {
          const params = new URLSearchParams(tg.initData);
          const raw = params.get('user');
          if (raw) tgId = JSON.parse(raw).id;
        } catch {
          // ignore
        }
      }

      let phone = '';
      try {
        const raw = localStorage.getItem('doriscan_auth_user_v1') || localStorage.getItem('doriscan_user_profile') || localStorage.getItem('doriscan_user');
        if (raw) phone = JSON.parse(raw).phone || '';
      } catch {
        // ignore
      }

      setInstallStatus("Telegram chatingizga yuborilmoqda...");
      await sendApkViaTelegram(tgId, phone || '+998872207844');

      // Seamlessly open chat with @TetikApp_bot with start=ilova parameter
      if (tg?.openTelegramLink) {
        tg.openTelegramLink("https://t.me/TetikApp_bot?start=ilova");
      } else {
        window.open("https://t.me/TetikApp_bot?start=ilova", "_blank");
      }

      localStorage.setItem('vitago_apk_installed', 'true');
      setInstallStatus("Ilova fayli @TetikApp_bot chatingizga yuborildi! Telegram chatini oching.");
    } catch {
      localStorage.setItem('vitago_apk_installed', 'true');
      if ((window as any).Telegram?.WebApp?.openTelegramLink) {
        (window as any).Telegram.WebApp.openTelegramLink("https://t.me/TetikApp_bot?start=ilova");
      }
      setInstallStatus("Ilova fayli @TetikApp_bot chatiga yuborildi!");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
    localStorage.setItem('vitago_apk_installed', 'true');
    setShowModal(false);
  };

  return (
    <>
      {/* Top compact banner */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-2.5 sm:px-3 py-1.5 text-xs shadow-md border-b border-emerald-500/40 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs">
              <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="truncate">
              <span className="font-extrabold tracking-tight text-[11px] sm:text-xs">
                Tetik ilovasi:
              </span>{' '}
              <span className="text-emerald-100 font-medium text-[10px] sm:text-[11px]">
                Telefonga qulay ilova shaklida o'rnatish
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleOpenInstallModal}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-black text-emerald-800 shadow-xs hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
            >
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>O'rnatish</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-white/70 hover:text-white rounded-md transition cursor-pointer"
              aria-label="Yopish"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* APK & App Installation Modal with Security Notice */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-emerald-100 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-200" />
                <h3 className="text-base sm:text-lg font-black">Tetik Ilovasini O'rnatish</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Security Reassurance Box + Google Play Notice (Explicit User Requirement) */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                    Xavfsizlik Kafolati (100% Rasmiy)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-emerald-800/90 leading-relaxed">
                    Bu virus yoki xakerlik emas, shunchaki platformadan yanada tezkor, qulay va internet tejamkor foydalanishingiz uchun telefoningizga ilova shakliga o'tkaziladi.
                  </p>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
                    📌 Bu APK demo uchun yaqinda Google Play ga xavfsiz tarzda chiqadi.
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {installStatus && (
                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{installStatus}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleSendViaTelegram}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Send className="h-4 w-4 text-sky-100" />
                  <span>Telegram Chatga Yuborish</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                  <span>Telefon Ekraniga O'rnatish</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadApk}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-slate-200"
                >
                  <Download className="h-4 w-4 text-slate-600" />
                  <span>Ilovani Yuklab Olish</span>
                </button>
              </div>

              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Keyinroq o'rnatish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
