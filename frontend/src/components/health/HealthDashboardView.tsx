import React, { useState, useEffect } from 'react';
import {
  Heart,
  Moon,
  Sparkles,
  Bot,
  AlarmClock,
  Utensils,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  UserCheck,
  HeartPulse,
  Sun,
  BedDouble,
  Sliders,
} from 'lucide-react';
import type { UserProfile } from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';

interface HealthDashboardViewProps {
  user: UserProfile | null;
  t: TranslationDict;
  onOpenAiChat: () => void;
  onOpenAlarm: () => void;
  onOpenHealthPlan: () => void;
  onOpenFoodScan: () => void;
  onOpenPlans: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

type Period = 'today' | 'week' | 'month';

interface SleepData {
  bedtime: string;
  wakeTime: string;
  hours: number;
  minutes: number;
  qualityScore: number;
}

const SLEEP_STORAGE_KEY = 'vitago_user_sleep_data';

export const HealthDashboardView: React.FC<HealthDashboardViewProps> = ({
  user,
  t,
  onOpenAiChat,
  onOpenAlarm,
  onOpenHealthPlan,
  onOpenFoodScan,
  onOpenPlans,
  triggerHaptic,
}) => {
  const [period, setPeriod] = useState<Period>('today');
  const [showSleepEditor, setShowSleepEditor] = useState(false);
  const isPremium = user?.plan === 'premium' || user?.plan === 'ultra';
  const isUltra = user?.plan === 'ultra';

  // Real customizable sleep tracking state
  const [sleepData, setSleepData] = useState<SleepData>(() => {
    try {
      const saved = localStorage.getItem(SLEEP_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return {
      bedtime: '23:30',
      wakeTime: '07:18',
      hours: 7,
      minutes: 48,
      qualityScore: 89,
    };
  });

  const [editBedtime, setEditBedtime] = useState(sleepData.bedtime);
  const [editWakeTime, setEditWakeTime] = useState(sleepData.wakeTime);

  const calculateSleepDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes <= 0) {
      totalMinutes += 24 * 60; // Crosses midnight
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    // Quality estimation based on healthy 7-9 hours range
    let quality = 70;
    if (hours >= 7 && hours <= 9) quality = 88 + Math.min(10, Math.round(minutes / 6));
    else if (hours === 6 || hours === 10) quality = 76;
    else quality = 62;
    return { hours, minutes, quality };
  };

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic?.('success');
    const { hours, minutes, quality } = calculateSleepDuration(editBedtime, editWakeTime);
    const next: SleepData = {
      bedtime: editBedtime,
      wakeTime: editWakeTime,
      hours,
      minutes,
      qualityScore: quality,
    };
    setSleepData(next);
    localStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(next));
    setShowSleepEditor(false);
  };

  // Circular gauge for Health Score 98
  const score = 98;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handlePeriodChange = (p: Period) => {
    triggerHaptic?.('light');
    setPeriod(p);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-5 pb-24 pt-1 animate-in fade-in duration-300">
      {/* 1. PERIOD SELECTOR PILLS */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => handlePeriodChange('today')}
            className={`px-6 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              period === 'today'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bugun
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('week')}
            className={`px-6 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              period === 'week'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hafta
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('month')}
            className={`px-6 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              period === 'month'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Oy
          </button>
        </div>
      </div>

      {/* 2. LARGE CIRCULAR GAUGE (98 Yaxshi) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl shadow-slate-200/60 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Soft background blue blur */}
        <div className="absolute w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-center">
          <svg className="w-44 h-44 transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              className="text-slate-100"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Gradient Arc */}
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="url(#scoreGrad)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute flex flex-col items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-1 animate-pulse">
              <Heart className="h-5 w-5 fill-rose-500" />
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              {score}
            </div>
            <div className="text-xs font-black text-slate-500 mt-1">
              Yaxshi
            </div>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-500 mt-3 max-w-xs">
          Barcha fiziologik va uyqu ko'rsatkichlaringiz xavfsiz va barqaror diapazonda
        </p>
      </div>

      {/* 3. DEDICATED REAL UYQU (SLEEP) MONITORING CARD (REPLACES FAKE 72 BPM & 118/76 MMHG) */}
      <div className="rounded-3xl bg-linear-to-br from-indigo-900 via-purple-900 to-slate-950 p-5 text-white shadow-xl shadow-indigo-950/25 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-purple-300">
              <Moon className="h-5 w-5 fill-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">Uyqu Monitoringi</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-bold border border-purple-400/20">
                  {sleepData.qualityScore}% Chuqur
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80 font-medium">
                Tungi tiklanish va gormonal muvozanat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setShowSleepEditor(!showSleepEditor);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 transition cursor-pointer text-xs font-bold flex items-center gap-1"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>O'zgartirish</span>
          </button>
        </div>

        {/* Sleep Metrics Row */}
        <div className="grid grid-cols-3 gap-2 pt-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="text-[10px] font-bold text-purple-200/70 uppercase">Uyqu davomiyligi</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
              {sleepData.hours}h {sleepData.minutes}m
            </div>
            <div className="text-[9px] font-semibold text-emerald-400 mt-0.5">Me'yorda (7-9h)</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="text-[10px] font-bold text-purple-200/70 uppercase">Uxlash vaqti</div>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight flex items-center justify-center gap-1">
              <Moon className="h-3.5 w-3.5 text-indigo-300" />
              <span>{sleepData.bedtime}</span>
            </div>
            <div className="text-[9px] font-semibold text-purple-300 mt-0.5">Rejim bo'yicha</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="text-[10px] font-bold text-purple-200/70 uppercase">Uyg'onish vaqti</div>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight flex items-center justify-center gap-1">
              <Sun className="h-3.5 w-3.5 text-amber-300" />
              <span>{sleepData.wakeTime}</span>
            </div>
            <div className="text-[9px] font-semibold text-amber-300 mt-0.5">Tetiklangan</div>
          </div>
        </div>

        {/* Inline Sleep Editor */}
        {showSleepEditor && (
          <form onSubmit={handleSaveSleep} className="mt-4 p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-3 animate-in fade-in duration-200">
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-purple-300" />
              <span>Uyqu vaqtini kiriting:</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-purple-200 font-bold block mb-1">Uxlash vaqti</label>
                <input
                  type="time"
                  value={editBedtime}
                  onChange={(e) => setEditBedtime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-purple-400/40 text-white font-bold text-sm focus:outline-hidden focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-purple-200 font-bold block mb-1">Uyg'onish vaqti</label>
                <input
                  type="time"
                  value={editWakeTime}
                  onChange={(e) => setEditWakeTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-purple-400/40 text-white font-bold text-sm focus:outline-hidden focus:border-purple-400"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowSleepEditor(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/15 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-xs font-black text-white shadow-md shadow-purple-500/30 cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. UYQU GRAFIGI (WEEKLY SLEEP HOURS SPLINE) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-lg shadow-slate-200/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Moon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-black text-slate-900">Uyqu grafigi (haftalik)</span>
          </div>
          <span className="text-xs font-bold text-indigo-600 flex items-center gap-0.5">
            <span>O'rtacha 7.9h / kun</span>
          </span>
        </div>

        {/* Smooth Purple/Blue Spline Wave for Sleep */}
        <div className="relative pt-2">
          <svg className="w-full h-24 overflow-visible" viewBox="0 0 300 70" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sleepWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,38 Q 40,25 80,30 T 160,20 T 230,35 T 300,18 L 300,70 L 0,70 Z"
              fill="url(#sleepWave)"
            />
            <path
              d="M 0,38 Q 40,25 80,30 T 160,20 T 230,35 T 300,18"
              fill="none"
              stroke="#6366F1"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Dots with sleep duration indicators */}
            {[
              { cx: 0, cy: 38, val: '7.5h' },
              { cx: 50, cy: 28, val: '8.0h' },
              { cx: 100, cy: 32, val: '7.2h' },
              { cx: 150, cy: 20, val: '8.2h' },
              { cx: 200, cy: 26, val: '7.8h' },
              { cx: 250, cy: 15, val: '8.5h' },
              { cx: 300, cy: 18, val: '8.0h' },
            ].map((pt, i) => (
              <g key={i}>
                <circle cx={pt.cx} cy={pt.cy} r="4.5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
              </g>
            ))}
          </svg>
          <div className="flex justify-between text-[10px] font-extrabold text-slate-500 mt-2 px-1">
            <span className="flex flex-col items-center"><span>Du</span><span className="text-[9px] text-slate-400">7.5h</span></span>
            <span className="flex flex-col items-center"><span>Se</span><span className="text-[9px] text-slate-400">8.0h</span></span>
            <span className="flex flex-col items-center"><span>Ch</span><span className="text-[9px] text-slate-400">7.2h</span></span>
            <span className="flex flex-col items-center"><span>Pa</span><span className="text-[9px] text-slate-400">8.2h</span></span>
            <span className="flex flex-col items-center"><span>Ju</span><span className="text-[9px] text-slate-400">7.8h</span></span>
            <span className="flex flex-col items-center"><span>Sh</span><span className="text-[9px] text-slate-400">8.5h</span></span>
            <span className="flex flex-col items-center text-indigo-600 font-black"><span>Ya</span><span className="text-[9px]">8.0h</span></span>
          </div>
        </div>
      </div>

      {/* 5. USER REQUESTED: ULTRA & PREMIUM FEATURES IN HEALTH SECTION */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Premium & Ultra Imkoniyatlar
            </h3>
          </div>
          {!isUltra && (
            <button
              type="button"
              onClick={onOpenPlans}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Yangilash ➔
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
          {/* AI Farmatsevt */}
          <div
            onClick={() => {
              triggerHaptic?.('light');
              onOpenAiChat();
            }}
            className="p-4 rounded-3xl bg-linear-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">24/7 AI Farmatsevt</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                    Premium
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dori mosligi, doza va nojo'ya ta'sirlarni AI orqali aniqlang
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-600 shrink-0" />
          </div>

          {/* Aqlli Budilnik & Missiyalar */}
          <div
            onClick={() => {
              triggerHaptic?.('light');
              onOpenAlarm();
            }}
            className="p-4 rounded-3xl bg-linear-to-r from-purple-50 to-indigo-50/60 border border-purple-200/90 shadow-sm hover:shadow-md hover:border-purple-400 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 shrink-0">
                <AlarmClock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">Aqlli Budilnik & Missiyalar</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                    ⚡ Ultra
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  O'chirib bo'lmaydigan matematik va kamera missiyali uyg'otkich
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-purple-600 shrink-0" />
          </div>

          {/* Shaxsiy Salomatlik Rejasi & Kattalar */}
          <div
            onClick={() => {
              triggerHaptic?.('light');
              onOpenHealthPlan();
            }}
            className="p-4 rounded-3xl bg-linear-to-r from-teal-50 to-cyan-50/60 border border-teal-200/90 shadow-sm hover:shadow-md hover:border-teal-400 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 shrink-0">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">Kattalar & Salomatlik Rejasi</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[9px] font-black uppercase">
                    Ultra
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Surunkali kasalliklar, suv va qon bosimi bo'yicha shaxsiy reja
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-teal-600 shrink-0" />
          </div>

          {/* AI Ovqatlanish Skaneri */}
          <div
            onClick={() => {
              triggerHaptic?.('light');
              onOpenFoodScan();
            }}
            className="p-4 rounded-3xl bg-linear-to-r from-orange-50 to-amber-50/60 border border-orange-200/90 shadow-sm hover:shadow-md hover:border-orange-400 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 shrink-0">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">AI Ovqatlanish & Kaloriya</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[9px] font-black uppercase">
                    Ultra
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Taom suratidan oqsil, yog', uglevod va kaloriyani bir zumda hisoblang
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-orange-600 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
