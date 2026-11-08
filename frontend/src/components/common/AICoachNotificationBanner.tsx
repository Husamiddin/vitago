import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Sparkles,
  Camera,
  Activity,
  Droplets,
  ChevronRight,
  Flame,
} from 'lucide-react';
import type { UserProfile } from '../../types/api';

interface AICoachNotificationBannerProps {
  user: UserProfile | null;
  onOpenFoodScan: () => void;
  onOpenWorkout: (type: 'yoga' | 'fitness') => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

type PromptType = 'stretch' | 'meal' | 'water';

interface PromptConfig {
  type: PromptType;
  title: string;
  desc: string;
  actionText: string;
  icon: string;
  badge: string;
}

const PROMPTS: PromptConfig[] = [
  {
    type: 'stretch',
    title: "AI Murabbiy: Cho'zilish vaqti!",
    desc: "45 daqiqa o'tdi! Tana va bo'g'imlarni yengillatish uchun 2 daqiqa cho'ziling.",
    actionText: "Yog'a / Mashq",
    icon: '🧘',
    badge: "Har 45 min",
  },
  {
    type: 'meal',
    title: "AI Murabbiy: Hozir nima yeyapsiz?",
    desc: "Semirishning oldini olish uchun taomingizni rasmga oling, AI uglerodini tekshiradi.",
    actionText: "Rasmga olish",
    icon: '🍽',
    badge: "Taom nazorati",
  },
  {
    type: 'water',
    title: "AI Murabbiy: Suv ichish eslatmasi",
    desc: "Metabolizm va terini tetik tutish uchun 1 stakan iliq suv iching.",
    actionText: "Ichdim ✓",
    icon: '💧',
    badge: "Gidratatsiya",
  },
];

export const AICoachNotificationBanner: React.FC<AICoachNotificationBannerProps> = ({
  user,
  onOpenFoodScan,
  onOpenWorkout,
  triggerHaptic,
}) => {
  const [currentPrompt, setCurrentPrompt] = useState<PromptConfig | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);

  // Strictly gated for Premium and Ultra
  const isPaid = user?.plan === 'premium' || user?.plan === 'ultra';

  useEffect(() => {
    if (!isPaid) return;

    // Check last prompt time in localStorage (interval: 45 minutes = 2700000 ms)
    const INTERVAL_MS = 45 * 60 * 1000;
    const LAST_KEY = 'vitago_coach_last_prompt_ts';

    const checkAndShow = () => {
      const now = Date.now();
      const last = parseInt(localStorage.getItem(LAST_KEY) || '0', 10);

      // If never prompted or 45 min elapsed, show next prompt
      if (!last || now - last >= INTERVAL_MS) {
        const nextIdx = (promptIndex + 1) % PROMPTS.length;
        setPromptIndex(nextIdx);
        setCurrentPrompt(PROMPTS[nextIdx]);
        localStorage.setItem(LAST_KEY, String(now));
        triggerHaptic?.('light');

        // Optional Web Notification API if supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(PROMPTS[nextIdx].title, {
              body: PROMPTS[nextIdx].desc,
              icon: '/favicon.png',
            });
          } catch {
            // ignore
          }
        }
      }
    };

    // Initial check after 3 seconds, then every 60 seconds
    const initialTimer = setTimeout(checkAndShow, 3000);
    const poller = setInterval(checkAndShow, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(poller);
    };
  }, [isPaid, promptIndex, triggerHaptic]);

  if (!isPaid || !currentPrompt) return null;

  const handleAction = () => {
    triggerHaptic?.('success');
    const p = currentPrompt;
    setCurrentPrompt(null);
    if (p.type === 'stretch') {
      onOpenWorkout('yoga');
    } else if (p.type === 'meal') {
      onOpenFoodScan();
    }
  };

  const handleDismiss = () => {
    triggerHaptic?.('light');
    setCurrentPrompt(null);
  };

  return (
    <div className="fixed top-2.5 left-2.5 right-2.5 z-50 max-w-md mx-auto animate-in slide-in-from-top-4 duration-300">
      <div className="rounded-3xl bg-slate-900/95 backdrop-blur-md border border-amber-500/40 p-3.5 shadow-2xl shadow-slate-950/60 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
            {currentPrompt.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate">
                {currentPrompt.title}
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 shrink-0">
                {currentPrompt.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {currentPrompt.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAction}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            {currentPrompt.actionText}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
