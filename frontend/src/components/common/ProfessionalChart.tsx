import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';

export interface ChartDataPoint {
  label: string; // e.g. 'Du', 'Se', 'Ch' or 'Yan', 'Fev'
  value: number; // e.g. 5.2
  unit?: string; // e.g. 'km', 'kkal', 'h'
  subValue?: string; // e.g. '420 kkal'
  dateLabel?: string; // e.g. 'Dushanba, 8-noyabr'
}

interface ProfessionalChartProps {
  title: string;
  data: ChartDataPoint[];
  period: 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'week' | 'month' | 'year') => void;
  growthPercent?: number; // e.g. +18
  unit?: string;
  colorScheme?: 'blue' | 'purple' | 'emerald';
  emptyMessage?: string;
}

export const ProfessionalChart: React.FC<ProfessionalChartProps> = ({
  title,
  data,
  period,
  onPeriodChange,
  growthPercent = 18,
  unit = 'km',
  colorScheme = 'blue',
  emptyMessage = "Hozircha faollik qayd etilmagan",
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const totalVal = values.reduce((acc, v) => acc + v, 0);

  const colors = {
    blue: {
      bar: 'from-blue-500 to-indigo-600',
      activeBar: 'from-blue-600 to-indigo-700',
      glow: 'rgba(37,99,235,0.25)',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    purple: {
      bar: 'from-purple-500 to-indigo-600',
      activeBar: 'from-purple-600 to-indigo-700',
      glow: 'rgba(147,51,234,0.25)',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    emerald: {
      bar: 'from-emerald-400 to-teal-600',
      activeBar: 'from-emerald-500 to-teal-700',
      glow: 'rgba(16,185,129,0.25)',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  }[colorScheme];

  const activeItem = activeIdx !== null ? data[activeIdx] : null;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xl shadow-slate-200/60 space-y-4 relative">
      {/* 1. Header with Period & Growth Badge */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-black text-slate-900">{title}</span>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
            Jami: <b className="text-slate-800">{totalVal.toFixed(1)} {unit}</b>
          </div>
        </div>

        {growthPercent !== undefined && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${colors.badge}`}>
            {growthPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {growthPercent >= 0 ? `+${growthPercent}% o'sish` : `${growthPercent}% pasayish`}
          </span>
        )}
      </div>

      {/* 2. Interactive Tooltip Bubble (Visible on touch or hover) */}
      <div className="h-8 flex items-center justify-between px-2 bg-slate-50 rounded-xl border border-slate-100">
        {activeItem ? (
          <>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>{activeItem.dateLabel || activeItem.label}:</span>
              <span className="text-blue-600 font-extrabold">
                {activeItem.value} {activeItem.unit || unit}
              </span>
            </div>
            {activeItem.subValue && (
              <span className="text-[10px] font-semibold text-slate-500">
                {activeItem.subValue}
              </span>
            )}
          </>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Info className="h-3 w-3" /> Ustun ustiga bosing yoki tanlang
          </span>
        )}
      </div>

      {/* 3. Bar Chart Area */}
      <div className="relative pt-4 pb-2 border-b border-slate-100">
        {/* Horizontal reference lines */}
        <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
        </div>

        <div className="h-40 flex items-end justify-between gap-1.5 sm:gap-2 px-1 relative z-10">
          {data.map((item, idx) => {
            const heightPct = item.value > 0 ? Math.max(16, Math.min(100, Math.round((item.value / maxVal) * 100))) : 8;
            const isSelected = activeIdx === idx;
            const hasData = item.value > 0;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(isSelected ? null : idx)}
                onMouseEnter={() => setActiveIdx(idx)}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group focus:outline-none cursor-pointer"
              >
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[28px] rounded-xl transition-all duration-300 relative ${
                    hasData
                      ? isSelected
                        ? `bg-linear-to-t ${colors.activeBar} shadow-lg scale-105`
                        : `bg-linear-to-t ${colors.bar} hover:scale-102`
                      : 'bg-slate-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 inset-x-0 mx-auto w-2 h-2 rounded-full bg-white shadow-xs" />
                  )}
                </div>

                <span
                  className={`text-[9px] sm:text-[10px] font-bold transition ${
                    isSelected ? 'text-blue-600 font-black scale-110' : hasData ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Chart Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Faollik qaydlari
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> Bo'sh kunlar
          </span>
        </div>
        <span className="font-bold text-slate-600">Maks: {maxVal} {unit}</span>
      </div>
    </div>
  );
};
