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

interface SleepRecord {
  bedtime: string;
  wakeTime: string;
  hours: number;
  minutes: number;
  qualityScore: number;
}

const SLEEP_STORAGE_KEY = 'vitago_user_sleep_data_v2';
const SLEEP_HISTORY_KEY = 'vitago_sleep_history_v2';

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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

  // Persistent Real Sleep Data & History
  const [sleepData, setSleepData] = useState<SleepRecord>(() => {
    try {
      const saved = localStorage.getItem(SLEEP_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      bedtime: '23:00',
      wakeTime: '07:00',
      hours: 8,
      minutes: 0,
      qualityScore: 88,
    };
  });

  const [sleepHistory, setSleepHistory] = useState<Record<string, { hours: number; minutes: number }>>(() => {
    try {
      const saved = localStorage.getItem(SLEEP_HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
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
    const next: SleepRecord = {
      bedtime: editBedtime,
      wakeTime: editWakeTime,
      hours,
      minutes,
      qualityScore: quality,
    };
    setSleepData(next);
    localStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(next));

    // Save to real history for today
    const todayKey = getTodayDateStr();
    const nextHistory = {
      ...sleepHistory,
      [todayKey]: { hours, minutes },
    };
    setSleepHistory(nextHistory);
    localStorage.setItem(SLEEP_HISTORY_KEY, JSON.stringify(nextHistory));
    setShowSleepEditor(false);
  };

  // Compute real weekly sleep stats (Monday to Sunday of current week)
  const getWeekDaysSleep = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const labels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    let totalRecordedHours = 0;
    let recordedDaysCount = 0;

    const days = labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const rec = sleepHistory[key];
      const isToday = d.toDateString() === now.toDateString();
      if (rec) {
        const val = rec.hours + Math.round((rec.minutes / 60) * 10) / 10;
        totalRecordedHours += val;
        recordedDaysCount += 1;
        return { label, val, text: `${val}h`, hasData: true, isToday };
      }
      return { label, val: 0, text: '—', hasData: false, isToday };
    });

    const avgHours = recordedDaysCount > 0 ? (totalRecordedHours / recordedDaysCount).toFixed(1) : null;
    return { days, avgHours, recordedDaysCount };
  };

  const { days: weekDaysSleep, avgHours: avgSleepHours, recordedDaysCount } = getWeekDaysSleep();

  const handlePeriodChange = (p: Period) => {
    triggerHaptic?.('light');
    setPeriod(p);
  };

  const dailySteps = user?.daily_steps || 0;
  const targetSteps = user?.daily_target_steps || 6000;
  const stepPercent = Math.min(100, Math.round((dailySteps / targetSteps) * 100));
  const waterMl = user?.daily_water_ml || 2000;

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

      {/* 2. REAL DAILY HEALTH SUMMARY (REPLACES FAKE 98 SCORE) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl shadow-slate-200/60 relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HeartPulse className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">Kunlik Salomatlik Ko'rsatkichlari</div>
              <div className="text-[11px] font-semibold text-slate-500">Haqiqiy tahlil va monitoring</div>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Real time
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-4 text-center">
          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="text-[10px] font-bold text-blue-700 uppercase">Qadamlar</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {dailySteps.toLocaleString()}
            </div>
            <div className="text-[9px] font-semibold text-blue-600 mt-0.5">
              {stepPercent}% bajarildi
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="text-[10px] font-bold text-purple-700 uppercase">Uyqu</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {sleepData.hours}h {sleepData.minutes}m
            </div>
            <div className="text-[9px] font-semibold text-purple-600 mt-0.5">
              {sleepData.qualityScore}% sifat
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100">
            <div className="text-[10px] font-bold text-teal-700 uppercase">Suv normasi</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {waterMl} ml
            </div>
            <div className="text-[9px] font-semibold text-teal-600 mt-0.5">
              Kunlik me'yor
            </div>
          </div>
        </div>
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

      {/* 4. UYQU GRAFIGI (REAL WEEKLY SLEEP RECORD TRACKER) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-lg shadow-slate-200/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Moon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-black text-slate-900">Uyqu grafigi (haftalik)</span>
          </div>
          <span className="text-xs font-bold text-indigo-600 flex items-center gap-0.5">
            <span>{avgSleepHours ? `O'rtacha ${avgSleepHours}h / kun` : "Hali ma'lumot kiritilmagan"}</span>
          </span>
        </div>

        {/* Real Daily Sleep Bars */}
        <div className="pt-3">
          <div className="h-28 flex items-end justify-between gap-2 px-1 border-b border-slate-100 pb-2">
            {weekDaysSleep.map((d, idx) => {
              const maxScaleHours = 10;
              const heightPct = d.hasData ? Math.min(100, Math.round((d.val / maxScaleHours) * 100)) : 8;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className={`text-[10px] font-black ${d.hasData ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {d.text}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[26px] rounded-xl transition-all duration-500 ${
                      d.hasData
                        ? d.isToday
                          ? 'bg-linear-to-t from-indigo-600 to-purple-500 shadow-md shadow-indigo-500/25'
                          : 'bg-indigo-400'
                        : 'bg-slate-100 border border-dashed border-slate-200'
                    }`}
                  />
                  <span className={`text-[10px] font-black ${d.isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 font-medium text-center mt-2">
            {recordedDaysCount > 0
              ? `Joriy haftada ${recordedDaysCount} kunlik uyqu qayd etildi`
              : "Tepadagi «O'zgartirish» tugmasini bosib bugungi uyqu vaqtingizni kiriting"}
          </p>
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
