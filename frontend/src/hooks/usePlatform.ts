import { useCallback, useEffect, useState } from 'react';

interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  enableClosingConfirmation?: () => void;
  openTelegramLink?: (url: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function usePlatform() {
  const [isNativeTelegram, setIsNativeTelegram] = useState(false);
  const [previewTelegramMode, setPreviewTelegramMode] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [telegramUserFirstName, setTelegramUserFirstName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tgQuery = params.get('tg') === '1';
    const twa = window.Telegram?.WebApp;
    const hasInitData = Boolean(twa?.initData && twa.initData.length > 0);

    if (hasInitData || tgQuery) {
      setIsNativeTelegram(true);
      twa?.ready?.();
      twa?.expand?.();
      try {
        twa?.setHeaderColor?.('#ffffff');
        twa?.setBackgroundColor?.('#f8fafc');
      } catch {
        // ignore if not supported in client
      }
      if (twa?.initDataUnsafe?.user?.first_name) {
        setTelegramUserFirstName(twa.initDataUnsafe.user.first_name);
      }
    }

    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isTelegramMiniApp = isNativeTelegram || previewTelegramMode;
  const isCompactAppLayout = isTelegramMiniApp || isMobileViewport;

  const triggerHaptic = useCallback((kind: 'light' | 'success' = 'light') => {
    const hf = window.Telegram?.WebApp?.HapticFeedback;
    if (!hf) return;
    if (kind === 'success') {
      hf.notificationOccurred?.('success');
    } else {
      hf.impactOccurred?.('light');
    }
  }, []);

  const shareViaTelegram = useCallback((shareText: string) => {
    const siteUrl = window.location.origin;
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(shareText)}`;
    const twa = window.Telegram?.WebApp;
    if (twa?.openTelegramLink && isNativeTelegram) {
      twa.openTelegramLink(tgShareUrl);
    } else {
      window.open(tgShareUrl, '_blank', 'noopener,noreferrer');
    }
  }, [isNativeTelegram]);

  return {
    isNativeTelegram,
    isTelegramMiniApp,
    previewTelegramMode,
    setPreviewTelegramMode,
    isMobileViewport,
    isCompactAppLayout,
    telegramUserFirstName,
    triggerHaptic,
    shareViaTelegram,
  };
}
