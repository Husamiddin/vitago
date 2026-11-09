import React from 'react';
import {
  Sparkles,
  Dumbbell,
  HeartPulse,
  Pill,
  BarChart3,
  Flame,
  Footprints,
  Compass,
  ArrowRight,
  TrendingUp,
  Clock,
  MapPin,
  Bot,
  Utensils,
  AlarmClock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Play,
  Zap,
  Crown,
} from 'lucide-react';
import type { UserProfile } from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';

interface HomeDashboardViewProps {
  user: UserProfile | null;
  t: TranslationDict;
  onNavigateTab: (tab: 'home' | 'sport' | 'health' | 'drugs' | 'plans' | 'profile' | 'stats' | 'food') => void;
  onOpenAiChat: () => void;
  onOpenAlarm: () => void;
  onOpenHealthPlan: () => void;
  onOpenFoodScan: () => void;
  onOpenPrescriptionScan: () => void;
  onOpenPlans: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
  demoAlarmCount?: number;
  demoAlarmPhase?: 'idle' | 'preparing' | 'counting';
  demoCountdownSec?: number;
  demoTargetTimeStr?: string;
  onStartDemoAlarm?: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  user,
  t,
  onNavigateTab,
  onOpenAiChat,
  onOpenAlarm,
  onOpenHealthPlan,
  onOpenFoodScan,
  onOpenPrescriptionScan,
  onOpenPlans,
  triggerHaptic,
  demoAlarmCount = 0,
  demoAlarmPhase = 'idle',
  demoCountdownSec = 60,
  demoTargetTimeStr = '',
  onStartDemoAlarm,
}) => {
  const firstName = user?.first_name || 'Foydalanuvchi';
  const steps = user?.daily_steps ?? 0;
  const targetSteps = user?.daily_target_steps || 10000;
  const stepPercent = targetSteps > 0 ? Math.min(100, Math.round((steps / targetSteps) * 100)) : 0;

  // Circular progress calculations for gauge
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stepPercent / 100) * circumference;

  // Real Weekly Steps for Du-Ya
  const weeklyStepsData = React.useMemo(() => {
    const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    return days.map((day, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let val = 0;
      try {
        const raw = localStorage.getItem(`doriscan_steps_${dateKey}`);
        if (raw) val = parseInt(raw, 10) || 0;
      } catch {}
      if (idx === (currentDay === 0 ? 6 : currentDay - 1)) {
        val = Math.max(val, steps);
      }
      const isToday = idx === (currentDay === 0 ? 6 : currentDay - 1);
      const pct = targetSteps > 0 ? Math.min(100, Math.round((val / targetSteps) * 100)) : 0;
      return { day, steps: val, pct, isToday };
    });
  }, [steps, targetSteps]);

  // Latest real workout from storage
  const latestActivity = React.useMemo(() => {
    try {
      const raw =
        user?.sport_activities_json ||
        localStorage.getItem('tetik_activities') ||
        localStorage.getItem('doriscan_activities') ||
        localStorage.getItem('vitago_activities');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[parsed.length - 1];
        }
      }
    } catch {}
    return null;
  }, [user?.sport_activities_json]);

  const handleCardClick = (action: () => void) => {
    triggerHaptic?.('light');
    action();
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-5 pb-24 pt-1 animate-in fade-in duration-300">
      {/* 1. GREETING & HEADER */}
      <div className="px-1 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Salom, {firstName}!</span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-600 text-xs font-black">
              ✨
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            Bugungi kun uchun tayyor tavsiyalar
          </p>
        </div>
        {user?.plan === 'ultra' ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-linear-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20">
            <Zap className="h-3.5 w-3.5 fill-slate-950" /> Ultra
          </span>
        ) : user?.plan === 'premium' ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-linear-to-r from-blue-500 to-indigo-600 text-white font-black text-xs shadow-md shadow-blue-500/20">
            <Crown className="h-3.5 w-3.5 fill-white" /> Premium
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenPlans}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-linear-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 transition cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            <span>Tariflar</span>
          </button>
        )}
      </div>

      {/* 2. TOP METRICS DUAL CARDS (Row 1 from Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {/* Card 1: Bugungi faoliyat (Deep Blue Gradient) */}
        <div
          onClick={() => handleCardClick(() => onNavigateTab('sport'))}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 sm:p-5 text-white shadow-xl shadow-blue-600/20 cursor-pointer active:scale-[0.98] transition group"
        >
          {/* Subtle background glow circle */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-blue-200 tracking-wide uppercase flex items-center gap-1.5">
              <Footprints className="h-3.5 w-3.5 text-blue-300" />
              Bugungi faoliyat
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white">
              Qadamlar
            </span>
          </div>

          <div className="mt-3.5 flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight flex items-baseline gap-1">
                <span>{steps.toLocaleString()}</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-200">
                  /{targetSteps.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-blue-200/90 mt-0.5">qadam bajarildi</p>
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="text-white/20"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="text-white transition-all duration-1000 ease-out"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-black text-white">{stepPercent}%</span>
            </div>
          </div>

          {/* Mini Weekly Bar Chart (Real steps per day, responsive fit) */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-end justify-between gap-1.5 h-10 w-full min-w-0">
            {weeklyStepsData.map((d, idx) => {
              const hPct = d.pct > 0 ? Math.max(12, Math.min(100, d.pct)) : 6;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
                  <div
                    style={{ height: `${hPct}%` }}
                    className={`w-full rounded-xs transition-all duration-500 ${
                      d.isToday ? 'bg-amber-300 shadow-xs' : 'bg-white/40'
                    }`}
                  />
                  <span className={`text-[8px] truncate ${d.isToday ? 'font-bold text-amber-200' : 'font-medium text-blue-200/80'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Sog'liq holati (Dynamic Real-Time Biological Index) */}
        <div
          onClick={() => handleCardClick(() => onNavigateTab('health'))}
          className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition active:scale-[0.98] cursor-pointer group flex flex-col justify-between apple-card"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-wide uppercase flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <HeartPulse className="h-3.5 w-3.5 text-[#16A68A]" />
                </div>
                Sog'liq holati
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#16A68A] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                <TrendingUp className="h-3 w-3" />
                {stepPercent >= 75 ? "A'lo" : stepPercent >= 30 ? "Faol" : "Kuzatuvda"}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {stepPercent >= 75 ? "A'lo darajada" : stepPercent >= 30 ? "Yaxshi" : "Boshlang'ich"}
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {stepPercent >= 75
                  ? "Kunlik faollik to'liq bajarildi"
                  : stepPercent >= 30
                  ? "Kunlik faoliyat me'yorida"
                  : "Bugungi harakat qayd etilmoqda"}
              </p>
            </div>
          </div>

          {/* Smooth Green Sparkline Curve */}
          <div className="mt-4 pt-2">
            <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A68A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#16A68A" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,28 Q 25,32 50,22 T 100,26 T 150,14 T 200,8 L 200,40 L 0,40 Z"
                fill="url(#healthGrad)"
              />
              <path
                d="M 0,28 Q 25,32 50,22 T 100,26 T 150,14 T 200,8"
                fill="none"
                stroke="#16A68A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="200" cy="8" r="4" fill="#16A68A" className="animate-ping opacity-75" />
              <circle cx="200" cy="8" r="3.5" fill="#16A68A" />
            </svg>
            <div className="flex justify-between text-[9px] font-medium text-slate-400 mt-1 px-1">
              <span>Du</span>
              <span>Se</span>
              <span>Ch</span>
              <span>Pa</span>
              <span>Ju</span>
              <span>Sh</span>
              <span>Ya</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4-ITEM QUICK ACTION GRID (from Image 1) */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {/* Sport */}
        <button
          type="button"
          onClick={() => handleCardClick(() => onNavigateTab('sport'))}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition active:scale-95 cursor-pointer text-center group"
        >
          <div className="h-11 w-11 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center mb-1.5 transition-colors shadow-xs">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="text-xs font-black text-slate-900 leading-tight">Sport</span>
          <span className="text-[10px] font-semibold text-slate-400 leading-tight">Trening</span>
        </button>

        {/* Sog'liq */}
        <button
          type="button"
          onClick={() => handleCardClick(() => onNavigateTab('health'))}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition active:scale-95 cursor-pointer text-center group"
        >
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center mb-1.5 transition-colors shadow-xs">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-xs font-black text-slate-900 leading-tight">Sog'liq</span>
          <span className="text-[10px] font-semibold text-slate-400 leading-tight">Monitoring</span>
        </button>

        {/* Dorilar */}
        <button
          type="button"
          onClick={() => handleCardClick(() => onNavigateTab('drugs'))}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-400 hover:shadow-md transition active:scale-95 cursor-pointer text-center group"
        >
          <div className="h-11 w-11 rounded-2xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center mb-1.5 transition-colors shadow-xs">
            <Pill className="h-5 w-5" />
          </div>
          <span className="text-xs font-black text-slate-900 leading-tight">Dorilar</span>
          <span className="text-[10px] font-semibold text-slate-400 leading-tight">Eslatma</span>
        </button>

        {/* Statistika */}
        <button
          type="button"
          onClick={() => handleCardClick(() => onNavigateTab('stats'))}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition active:scale-95 cursor-pointer text-center group"
        >
          <div className="h-11 w-11 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center mb-1.5 transition-colors shadow-xs">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-xs font-black text-slate-900 leading-tight">Statistika</span>
          <span className="text-[10px] font-semibold text-slate-400 leading-tight">Hisobotlar</span>
        </button>
      </div>

      {/* 4. BUGUNGI FAOLIYATLAR SECTION (Real Activity or Steps Tracker) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            Bugungi faoliyatlar
          </h2>
          <button
            type="button"
            onClick={() => handleCardClick(() => onNavigateTab('sport'))}
            className="text-xs font-semibold text-[#16A68A] hover:text-teal-700 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Barchasi</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Activity Card with Real Activity / Walked Distance */}
        <div
          onClick={() => handleCardClick(() => onNavigateTab('sport'))}
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-md transition active:scale-[0.99] cursor-pointer apple-card"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[#16A68A] flex items-center justify-center shrink-0">
              <Footprints className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {latestActivity
                  ? latestActivity.sport_type === 'run'
                    ? 'Yugurish'
                    : latestActivity.sport_type === 'bike'
                    ? 'Velosport'
                    : 'Piyoda yurish'
                  : steps > 0
                  ? 'Piyoda yurish'
                  : "Kunlik harakat"}
              </div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">
                {latestActivity
                  ? `${(latestActivity.distance_km || 0).toFixed(1)} km • ${Math.round((latestActivity.duration_sec || 0) / 60)} min • ${Math.round(latestActivity.calories || 0)} kcal`
                  : steps > 0
                  ? `${(steps * 0.00075).toFixed(1)} km • ${steps} qadam • ${Math.round(steps * 0.04)} kcal`
                  : "Hali mashg'ulot boshlanmadi • Tetik Sport"}
              </div>
            </div>
          </div>

          {/* Mini Route Map / Direction Thumbnail */}
          <div className="relative w-16 h-12 rounded-xl bg-slate-50 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center">
            <svg className="w-full h-full p-1" viewBox="0 0 60 40">
              <path
                d="M 10,30 Q 20,10 35,20 T 50,10"
                fill="none"
                stroke="#16A68A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="30" r="3" fill="#10B981" />
              <circle cx="50" cy="10" r="3" fill="#F97316" />
            </svg>
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/5 to-transparent" />
          </div>
        </div>
      </div>

      {/* 5. "BITTA ILOVADA BARCHA IMKONIYATLAR!" SHOWCASE (matching bottom-right card in Image 1) */}
      <div className="rounded-3xl bg-linear-to-br from-slate-50 to-blue-50/50 border border-blue-100 p-4 sm:p-5 shadow-lg shadow-blue-500/5 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900">
            Bitta ilovada barcha imkoniyatlar!
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* AI Farmatsevt */}
          <button
            type="button"
            onClick={() => handleCardClick(onOpenAiChat)}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition active:scale-95 text-center flex flex-col items-center cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">AI Farmatsevt</span>
            <span className="text-[9px] font-bold text-emerald-600 leading-tight mt-0.5">Premium</span>
          </button>

          {/* Salomatlik */}
          <button
            type="button"
            onClick={() => handleCardClick(onOpenHealthPlan)}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:shadow-xs transition active:scale-95 text-center flex flex-col items-center cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5">
              <HeartPulse className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Salomatlik</span>
            <span className="text-[9px] font-bold text-teal-600 leading-tight mt-0.5">Kattalar & Reja</span>
          </button>

          {/* Ovqatlanish */}
          <button
            type="button"
            onClick={() => handleCardClick(onOpenFoodScan)}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-orange-400 hover:shadow-xs transition active:scale-95 text-center flex flex-col items-center cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1.5">
              <Utensils className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Ovqatlanish</span>
            <span className="text-[9px] font-bold text-orange-600 leading-tight mt-0.5">Ultra Kaloriya</span>
          </button>

          {/* Budilnik */}
          <button
            type="button"
            onClick={() => handleCardClick(onOpenAlarm)}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-400 hover:shadow-xs transition active:scale-95 text-center flex flex-col items-center cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
              <AlarmClock className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Budilnik</span>
            <span className="text-[9px] font-bold text-purple-600 leading-tight mt-0.5">Ultra Missiya</span>
          </button>

          {/* Sport */}
          <button
            type="button"
            onClick={() => handleCardClick(() => onNavigateTab('sport'))}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition active:scale-95 text-center flex flex-col items-center cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Sport</span>
            <span className="text-[9px] font-bold text-blue-600 leading-tight mt-0.5">GPS Xarita</span>
          </button>

          {/* Statistika */}
          <button
            type="button"
            onClick={() => handleCardClick(() => onNavigateTab('stats'))}
            className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition active:scale-95 text-center flex flex-col items-center cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black text-slate-900 leading-tight">Statistika</span>
            <span className="text-[9px] font-bold text-indigo-600 leading-tight mt-0.5">Tahlil</span>
          </button>
        </div>

        {/* Bottom Banner */}
        <div
          onClick={() => handleCardClick(() => onNavigateTab('sport'))}
          className="p-3 rounded-2xl bg-linear-to-r from-[#081525] via-[#10233D] to-[#0A4844] text-white flex items-center justify-between cursor-pointer active:scale-[0.99] transition shadow-md shadow-slate-900/20 border border-teal-500/20"
        >
          <div className="flex items-center gap-2">
            <Footprints className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-black">
              Tetik — Sog'lom hayot sari bir qadam oldinda!
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
};
