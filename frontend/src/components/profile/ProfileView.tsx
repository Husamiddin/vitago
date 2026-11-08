import React, { useState } from 'react';
import {
  User as UserIcon,
  Settings,
  Target,
  Bell,
  Scale,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Flame,
  Footprints,
  Activity,
  Heart,
} from 'lucide-react';
import type { UserProfile, SupportedLang } from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';
import { AIGoalsModal } from './AIGoalsModal';

interface ProfileViewProps {
  user: UserProfile | null;
  t: TranslationDict;
  lang: SupportedLang;
  onChangeLang: (lang: SupportedLang) => void;
  onOpenEditProfile: () => void;
  onOpenLegalModal: (tab: 'how_it_works' | 'pricing' | 'stats' | 'faq' | 'terms' | 'privacy' | 'refund') => void;
  onOpenPlans: () => void;
  onLogout: () => void;
  onGoalUpdated?: (updatedUser: UserProfile) => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  t,
  lang,
  onChangeLang,
  onOpenEditProfile,
  onOpenLegalModal,
  onOpenPlans,
  onLogout,
  onGoalUpdated,
  triggerHaptic,
}) => {
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const name = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Mehmon (Ro`yxatdan o`tmagan)';
  const plan = user?.plan || 'standard';
  const steps = user?.daily_steps || 0;
  const streak = user?.streak_count || 0;

  const handleClick = (action: () => void) => {
    triggerHaptic?.('light');
    action();
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-5 pb-24 pt-1 animate-in fade-in duration-300">
      {/* 1. USER PROFILE HEADER CARD (from Image 1 Screen 8) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl shadow-slate-200/60 flex flex-col items-center text-center relative overflow-hidden">
        {/* Soft gradient aura */}
        <div className="absolute -top-10 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        {/* Avatar */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
            {user?.avatar_data ? (
              <img
                src={user.avatar_data}
                alt={name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-2xl uppercase">
                {name.charAt(0)}
              </div>
            )}
          </div>
          {/* Plan badge icon on avatar */}
          <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center">
            {plan === 'ultra' ? '⚡' : plan === 'premium' ? '👑' : '👤'}
          </div>
        </div>

        {/* Name & Plan Badge */}
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {name}
        </h2>
        <div className="mt-1 flex items-center gap-1.5">
          {plan === 'ultra' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-linear-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-xs">
              ⚡ Ultra a'zo
            </span>
          ) : plan === 'premium' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-linear-to-r from-blue-500 to-indigo-600 text-white font-black text-xs shadow-xs">
              ⭐ Premium a'zo
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenPlans}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              <span>Standart a'zo</span>
              <span className="text-emerald-600 font-extrabold">• Tariflar</span>
            </button>
          )}
        </div>

        {/* Biometric Quick Stats Strip */}
        {user && (
          <div className="w-full grid grid-cols-4 gap-2 pt-5 mt-4 border-t border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 block">Bo'y</span>
              <span className="text-xs font-black text-slate-800">{user.height_cm || '—'} sm</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 block">Vazn</span>
              <span className="text-xs font-black text-slate-800">{user.weight_kg || '—'} kg</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 block">Yosh</span>
              <span className="text-xs font-black text-slate-800">{user.age || '—'}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50">
              <span className="text-[10px] font-black text-amber-600 flex items-center justify-center gap-0.5">
                <Flame className="h-3 w-3 fill-amber-500" />
                Streak
              </span>
              <span className="text-xs font-black text-amber-700">{streak} kun</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. PROFILE MENU LIST ITEMS (from Image 1 Screen 8 & Image 2) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-2 shadow-lg shadow-slate-200/40 divide-y divide-slate-100">
        {/* Shaxsiy ma'lumot */}
        <button
          type="button"
          onClick={() => handleClick(onOpenEditProfile)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900">Shaxsiy ma'lumot</div>
              <div className="text-[10px] text-slate-400 font-semibold">Tana parametrlari va profil</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
        </button>

        {/* Maqsadlarim */}
        <button
          type="button"
          onClick={() => handleClick(() => setGoalsModalOpen(true))}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900">Maqsadlarim</div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {(user?.daily_target_steps || 10000).toLocaleString()} qadam • AI moslashuvchan reja
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
        </button>

        {/* Bildirishnomalar */}
        <button
          type="button"
          onClick={() => handleClick(() => onOpenLegalModal('faq'))}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900">Bildirishnomalar</div>
              <div className="text-[10px] text-slate-400 font-semibold">Dori va mashg'ulot eslatmalari</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition" />
        </button>

        {/* ======================================================== */}
        {/* CRITICAL IMAGE 2 REQUIREMENT: HUQUQLAR VA QOIDALAR */}
        {/* ======================================================== */}
        <button
          type="button"
          onClick={() => handleClick(() => onOpenLegalModal('terms'))}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left bg-linear-to-r from-emerald-50/50 to-teal-50/30 hover:bg-emerald-50 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>Huquqlar & Shartlar</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white">
                  7 ta bo'lim
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Oferta, Maxfiylik, Bank kartasi PCI-DSS, Refund kafolati
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition" />
        </button>

        {/* Sozlamalar (Til va rejim) */}
        <div className="px-4 py-3.5 flex items-center justify-between rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900">Tilni tanlash</div>
              <div className="text-[10px] text-slate-400 font-semibold">Ilova interfeysi tili</div>
            </div>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
            {(['uz', 'uz_cyrl', 'ru'] as SupportedLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  onChangeLang(l);
                }}
                className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] font-black ${
                  lang === l ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {l === 'uz' ? "O'z" : l === 'uz_cyrl' ? 'Ўз' : 'Ру'}
              </button>
            ))}
          </div>
        </div>

        {/* Yordam va qo'llab-quvvatlash */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('light');
            if ((window as any)?.Telegram?.WebApp?.openTelegramLink) {
              (window as any).Telegram.WebApp.openTelegramLink('https://t.me/VitaGoSupport');
            } else {
              window.open('https://t.me/VitaGoSupport', '_blank');
            }
          }}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 rounded-2xl transition cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900">Yordam va qo'llab-quvvatlash</div>
              <div className="text-[10px] text-slate-400 font-semibold">@VitaGoSupport rasmiy chat va yordam</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition" />
        </button>

        {/* Chiqish (Hisobdan chiqish) */}
        {user && (
          <button
            type="button"
            onClick={() => handleClick(onLogout)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-rose-50 text-rose-600 rounded-2xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-rose-600">Hisobdan chiqish</div>
                <div className="text-[10px] text-rose-400 font-semibold">Mehmon rejimiga o'tish</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-rose-400" />
          </button>
        )}
      </div>

      {/* AI Goals Modal */}
      <AIGoalsModal
        isOpen={goalsModalOpen}
        onClose={() => setGoalsModalOpen(false)}
        user={user}
        onGoalUpdated={(updated) => {
          onGoalUpdated?.(updated);
        }}
        triggerHaptic={triggerHaptic}
      />
    </div>
  );
};
