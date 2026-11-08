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

  const barData = [
    { day: 'Du', val: 65, km: 3.2 },
    { day: 'Se', val: 40, km: 2.1 },
    { day: 'Ch', val: 90, km: 5.4 },
    { day: 'Pa', val: 55, km: 2.8 },
    { day: 'Ju', val: 75, km: 4.1 },
    { day: 'Sh', val: 98, km: 5.8 },
    { day: 'Ya', val: 60, km: 3.0 },
  ];

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

      {/* 2. MAIN GRADIENT BAR CHART (from Image 1 Screen 7) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl shadow-slate-200/60 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-slate-900">Faollik dinamikasi</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <TrendingUp className="h-3 w-3" />
            +18% o'sish
          </span>
        </div>

        {/* Vertical Bars */}
        <div className="h-44 pt-4 flex items-end justify-between gap-2.5 sm:gap-3 px-2 border-b border-slate-100 pb-2">
          {barData.map((b, idx) => {
            const isHighest = b.val === 98;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-600 transition opacity-0 group-hover:opacity-100">
                  {b.km}km
                </span>
                <div
                  style={{ height: `${b.val}%` }}
                  className={`w-full max-w-[28px] rounded-xl transition-all duration-700 ${
                    isHighest
                      ? 'bg-linear-to-t from-blue-700 via-blue-600 to-cyan-400 shadow-md shadow-blue-500/30'
                      : 'bg-linear-to-t from-blue-500 to-blue-400 opacity-80 group-hover:opacity-100'
                  }`}
                />
                <span className={`text-[10px] font-black ${isHighest ? 'text-blue-600' : 'text-slate-400'}`}>
                  {b.day}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3. THREE BOTTOM SUMMARY METRICS (from Image 1 Screen 7) */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              12.5 km
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
              Masofa
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              820 kcal
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
              Kaloriya
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              2h 15m
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
            className={`text-xs font-black px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              subTab === 'activity'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            🏃 Sport mashg'ulotlari
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
                    🏃
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
