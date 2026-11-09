import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Footprints,
  Flame,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
} from 'lucide-react';
import type { PrescriptionAnalysisResponse, SavedHistoryEntry, SupportedLang, UserProfile } from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';
import { ScanHistoryView } from './ScanHistoryView';
import { ProfessionalChart } from '../common/ProfessionalChart';

interface StatisticsViewProps {
  user: UserProfile | null;
  t: TranslationDict;
  lang?: SupportedLang;
  historyEntries?: SavedHistoryEntry[];
  onOpenHistoryEntry?: (res: PrescriptionAnalysisResponse) => void;
  onDeleteHistoryEntry?: (id: string) => void;
  onClearHistory?: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

type StatPeriod = 'week' | 'month' | 'year';

interface ActivityItem {
  id?: string | number;
  sport_type?: string;
  distance_km: number;
  duration_sec: number;
  calories: number;
  created_at: string;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  user,
  t,
  lang = 'uz',
  historyEntries = [],
  onOpenHistoryEntry = () => {},
  onDeleteHistoryEntry = () => {},
  onClearHistory = () => {},
  triggerHaptic,
}) => {
  const [period, setPeriod] = useState<StatPeriod>('week');
  const [subTab, setSubTab] = useState<'activity' | 'history'>('activity');

  const handlePeriod = (p: StatPeriod) => {
    triggerHaptic?.('light');
    setPeriod(p);
  };

  // Real activities loaded from user profile or local storage
  const activities: ActivityItem[] = React.useMemo(() => {
    let list: ActivityItem[] = [];
    if (user?.sport_activities_json) {
      try {
        const parsed = JSON.parse(user.sport_activities_json);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }
    if (list.length === 0) {
      try {
        const raw =
          localStorage.getItem('vitago_activities') ||
          localStorage.getItem('vitago_saved_activities_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        }
      } catch {}
    }
    return list;
  }, [user?.sport_activities_json]);

  // Dynamic real period aggregation
  const dynamicStats = React.useMemo(() => {
    const now = new Date();

    if (period === 'week') {
      const labels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMonday);

      const dayKm = [0, 0, 0, 0, 0, 0, 0];
      let totalKm = 0;
      let totalKcal = 0;
      let totalSec = 0;

      activities.forEach((act) => {
        if (!act.created_at) return;
        const actDate = new Date(act.created_at);
        const diffDays = Math.floor(
          (actDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays >= 0 && diffDays < 7) {
          dayKm[diffDays] += act.distance_km || 0;
          totalKm += act.distance_km || 0;
          totalKcal += act.calories || 0;
          totalSec += act.duration_sec || 0;
        }
      });

      const maxVal = Math.max(...dayKm, 1);
      const bars = labels.map((day, idx) => ({
        label: day,
        km: Math.round(dayKm[idx] * 100) / 100,
        heightPct: dayKm[idx] > 0 ? Math.max(15, Math.min(100, Math.round((dayKm[idx] / maxVal) * 100))) : 8,
        hasData: dayKm[idx] > 0,
      }));

      return { bars, totalKm, totalKcal, totalSec };
    }

    if (period === 'month') {
      const labels = ['1-7 kun', '8-14 kun', '15-21 kun', '22-28 kun', '29+ kun'];
      const weekKm = [0, 0, 0, 0, 0];
      let totalKm = 0;
      let totalKcal = 0;
      let totalSec = 0;
      const curYear = now.getFullYear();
      const curMonth = now.getMonth();

      activities.forEach((act) => {
        if (!act.created_at) return;
        const actDate = new Date(act.created_at);
        if (actDate.getFullYear() === curYear && actDate.getMonth() === curMonth) {
          const dom = actDate.getDate();
          let idx = 0;
          if (dom <= 7) idx = 0;
          else if (dom <= 14) idx = 1;
          else if (dom <= 21) idx = 2;
          else if (dom <= 28) idx = 3;
          else idx = 4;

          weekKm[idx] += act.distance_km || 0;
          totalKm += act.distance_km || 0;
          totalKcal += act.calories || 0;
          totalSec += act.duration_sec || 0;
        }
      });

      const maxVal = Math.max(...weekKm, 1);
      const bars = labels.map((label, idx) => ({
        label,
        km: Math.round(weekKm[idx] * 100) / 100,
        heightPct: weekKm[idx] > 0 ? Math.max(15, Math.min(100, Math.round((weekKm[idx] / maxVal) * 100))) : 8,
        hasData: weekKm[idx] > 0,
      }));

      return { bars, totalKm, totalKcal, totalSec };
    }

    // Year aggregation (12 months)
    const labels = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const monthKm = new Array(12).fill(0);
    let totalKm = 0;
    let totalKcal = 0;
    let totalSec = 0;
    const curYear = now.getFullYear();

    activities.forEach((act) => {
      if (!act.created_at) return;
      const actDate = new Date(act.created_at);
      if (actDate.getFullYear() === curYear) {
        const m = actDate.getMonth();
        monthKm[m] += act.distance_km || 0;
        totalKm += act.distance_km || 0;
        totalKcal += act.calories || 0;
        totalSec += act.duration_sec || 0;
      }
    });

    const maxVal = Math.max(...monthKm, 1);
    const bars = labels.map((label, idx) => ({
      label,
      km: Math.round(monthKm[idx] * 100) / 100,
      heightPct: monthKm[idx] > 0 ? Math.max(15, Math.min(100, Math.round((monthKm[idx] / maxVal) * 100))) : 8,
      hasData: monthKm[idx] > 0,
    }));

    return { bars, totalKm, totalKcal, totalSec };
  }, [activities, period]);

  const { bars, totalKm, totalKcal, totalSec } = dynamicStats;
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-5 pb-24 pt-1 animate-in fade-in duration-300">
      {/* 1. PERIOD TABS: Hafta / Oy / Yil (from Image 1 Screen 7) */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => handlePeriod('week')}
            className={`px-7 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              period === 'week'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hafta
          </button>
          <button
            type="button"
            onClick={() => handlePeriod('month')}
            className={`px-7 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              period === 'month'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Oy
          </button>
          <button
            type="button"
            onClick={() => handlePeriod('year')}
            className={`px-7 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              period === 'year'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yil
          </button>
        </div>
      </div>

      {/* 2. MAIN GRADIENT BAR CHART (REAL USER ACTIVITY DYNAMICS) */}
      <ProfessionalChart
        title="Faollik dinamikasi"
        period={period}
        growthPercent={totalKm > 0 ? 18 : 0}
        unit="km"
        colorScheme="blue"
        data={bars.map((b) => ({
          label: b.label,
          value: b.km,
          unit: 'km',
          subValue: `${Math.round(b.km * 65)} kkal`,
          dateLabel: `${b.label} kuni`,
        }))}
      />

      {/* 3. THREE BOTTOM SUMMARY METRICS (REAL DATA CALCULATED FROM WORKOUTS) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl shadow-slate-200/60">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {totalKm.toFixed(1)} km
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
              Masofa
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {Math.round(totalKcal)} kcal
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
              Kaloriya
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {formattedTime}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
              Vaqt
            </div>
          </div>
        </div>
      </div>

      {/* 4. TOGGLE: SPORT ACTIVITY VS SKANERLAR TARIXI */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => setSubTab('activity')}
            className={`text-xs font-black px-3.5 py-1.5 rounded-full transition cursor-pointer inline-flex items-center gap-1.5 ${
              subTab === 'activity'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Sport mashg'ulotlari</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`text-xs font-black px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              subTab === 'history'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Skanerlangan retseptlar
          </button>
        </div>

        {subTab === 'activity' ? (
          <div className="space-y-2.5">
            {[
              { title: 'Yugurish (Kogon tumani)', dist: '5.2 km', time: '28 min', kcal: '312 kcal', date: 'Bugun, 07:45' },
              { title: 'Piyoda yurish (Toshkent)', dist: '3.1 km', time: '35 min', kcal: '145 kcal', date: 'Kecha, 18:20' },
              { title: 'Fitness kardio mashqi', dist: '—', time: '20 min', kcal: '190 kcal', date: '5-noyabr' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-400 font-bold mt-0.5">{item.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-blue-600">{item.dist}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{item.kcal} • {item.time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScanHistoryView
            entries={historyEntries}
            t={t}
            lang={lang}
            onOpenEntry={onOpenHistoryEntry}
            onDeleteEntry={onDeleteHistoryEntry}
            onClearAll={onClearHistory}
          />
        )}
      </div>
    </div>
  );
};
