import React from 'react';
import {
  Utensils,
  Camera,
  Sparkles,
  Flame,
  ChevronRight,
  TrendingUp,
  Apple,
  Fish,
  Wheat,
  Plus,
} from 'lucide-react';
import type { UserProfile } from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';

interface NutritionViewProps {
  user: UserProfile | null;
  t: TranslationDict;
  onOpenFoodScan: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  user,
  t,
  onOpenFoodScan,
  triggerHaptic,
}) => {
  const currentKcal = user?.daily_kcal || 850;
  const targetKcal = 2000;
  const kcalPercent = Math.min(100, Math.round((currentKcal / targetKcal) * 100));

  // Circular progress calculations for 850 kcal
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (kcalPercent / 100) * circumference;

  const meals = [
    {
      id: 'breakfast',
      title: 'Nonushta',
      desc: "Suli bo'tqasi, yong'oq va rezavorlar",
      kcal: 280,
      image: '/food/breakfast.jpg',
      time: '08:30',
      badge: 'Sog`lom boshlanish',
    },
    {
      id: 'lunch',
      title: 'Tushlik',
      desc: 'Tuxumli yangi avokado va barra sabzavotli salat',
      kcal: 320,
      image: '/food/salad.jpg',
      time: '13:00',
      badge: 'Past yog`li',
    },
    {
      id: 'dinner',
      title: 'Kechki ovqat',
      desc: 'Dimlangan tovuq filesi va pishirilgan sabzavotlar',
      kcal: 450,
      image: '/food/lunch.jpg',
      time: '19:30',
      badge: 'Yuqori oqsil',
    },
    {
      id: 'snack',
      title: 'Yengil tamaddi',
      desc: 'Yangi uzilgan sitrus va vitaminli mevalar',
      kcal: 120,
      image: '/food/fruits.jpg',
      time: '16:00',
      badge: 'Vitamin C',
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-5 pb-24 pt-1 animate-in fade-in duration-300">
      {/* 1. HERO CALORIE SUMMARY CARD (from Image 1 Screen 6) */}
      <div className="rounded-3xl bg-linear-to-br from-white via-orange-50/30 to-amber-50/50 border border-slate-200 p-5 shadow-xl shadow-slate-200/50 flex items-center justify-between gap-4">
        {/* Left Side: Healthy Bowl image preview */}
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-white">
          <img
            src="/food/salad.jpg"
            alt="Healthy meal"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 via-transparent to-transparent" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-black text-white flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-400" />
            Bugun
          </span>
        </div>

        {/* Right Side: Circular Calorie Gauge */}
        <div className="flex-1 flex items-center justify-end gap-3.5">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none flex items-baseline justify-end gap-1">
              <span>{currentKcal}</span>
              <span className="text-xs font-bold text-slate-400">kcal</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              / {targetKcal} kcal
            </div>
            <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center justify-end gap-0.5">
              <TrendingUp className="h-3 w-3" />
              1,150 kcal qoldi
            </div>
          </div>

          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-slate-100"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-orange-500 transition-all duration-1000 ease-out"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-800">{kcalPercent}%</span>
          </div>
        </div>
      </div>

      {/* 2. INSTANT CAMERA SCANNER CTA BUTTON */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic?.('light');
          onOpenFoodScan();
        }}
        className="w-full py-4 px-5 rounded-3xl bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-sm sm:text-base shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2.5 hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
      >
        <Camera className="h-5 w-5" />
        <span>Taomni suratga olish (AI Kaloriya)</span>
        <Sparkles className="h-4 w-4 text-amber-200" />
      </button>

      {/* 3. MACRONUTRIENT BARS */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          Makronutrientlar Balansi
        </h4>
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 flex items-center justify-center gap-1">
              <Fish className="h-3 w-3" />
              Oqsil
            </span>
            <div className="text-sm font-black text-slate-900 mt-0.5">58g / 90g</div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '64%' }} />
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-600 flex items-center justify-center gap-1">
              <Wheat className="h-3 w-3" />
              Uglevod
            </span>
            <div className="text-sm font-black text-slate-900 mt-0.5">120g / 220g</div>
            <div className="w-full bg-amber-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '55%' }} />
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 flex items-center justify-center gap-1">
              <Apple className="h-3 w-3" />
              Yog'lar
            </span>
            <div className="text-sm font-black text-slate-900 mt-0.5">28g / 55g</div>
            <div className="w-full bg-rose-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '51%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. BUGUNGI MENYU SECTION (from Image 1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-black text-slate-900">
            Bugungi tavsiya menyusi
          </h3>
          <span className="text-xs font-bold text-orange-600 flex items-center gap-0.5 cursor-pointer">
            <span>Barchasi</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {meals.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-orange-200 transition"
            >
              <img
                src={m.image}
                alt={m.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-xs border border-slate-100"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 truncate">{m.title}</span>
                  <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    {m.kcal} kcal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.desc}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-bold">
                  <span>⏰ {m.time}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">{m.badge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
