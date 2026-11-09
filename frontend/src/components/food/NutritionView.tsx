import React, { useState, useEffect } from 'react';
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
  Clock,
  Settings2,
  Trophy,
  Footprints,
  AlertCircle,
  CheckCircle2,
  X,
  Bell,
} from 'lucide-react';
import type { UserProfile } from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';

interface NutritionViewProps {
  user: UserProfile | null;
  t: TranslationDict;
  onOpenFoodScan: () => void;
  onNavigateToSport?: (sportType?: 'run' | 'walk', targetKm?: number) => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

interface MealSchedule {
  weekKey: string;
  editCount: number;
  unlockedByChallenge: boolean;
  meals: {
    breakfast: string;
    lunch: string;
    snack: string;
    dinner: string;
  };
}

const SCHEDULE_STORAGE_KEY = 'tetik_meal_schedule_v2';
const CHALLENGE_STORAGE_KEY = 'tetik_meal_challenge_status';

const getCurrentWeekKey = (): string => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

export const NutritionView: React.FC<NutritionViewProps> = ({
  user,
  t,
  onOpenFoodScan,
  onNavigateToSport,
  triggerHaptic,
}) => {
    // Real meals logged by the user from AI Food Scan
  const [userMeals, setUserMeals] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('tetik_user_meals_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleMealUpdate = (e: any) => {
      if (e.detail) {
        setUserMeals(prev => [e.detail, ...prev]);
      }
    };
    window.addEventListener('tetik_meal_logged', handleMealUpdate);
    return () => window.removeEventListener('tetik_meal_logged', handleMealUpdate);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = userMeals.filter((m: any) => m.date === todayStr);
  const realCalories = todayMeals.reduce((acc: number, m: any) => acc + (Number(m.calories) || 0), 0);
  const latestMeal = todayMeals[0] || null;
  const hasRealMealToday = todayMeals.length > 0;

  const currentKcal = hasRealMealToday ? realCalories : (user?.daily_kcal || 0);
  const targetKcal = 2000;
  const remainingKcal = Math.max(0, targetKcal - currentKcal);
  const kcalPercent = Math.min(100, Math.round((currentKcal / targetKcal) * 100));

  // Circular progress calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (kcalPercent / 100) * circumference;

  // 4 Meals Schedule State & Weekly Change Rule
  const [schedule, setSchedule] = useState<MealSchedule>(() => {
    const currentWeek = getCurrentWeekKey();
    try {
      const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (saved) {
        const parsed: MealSchedule = JSON.parse(saved);
        if (parsed.weekKey === currentWeek) {
          return parsed;
        }
      }
    } catch {}
    return {
      weekKey: currentWeek,
      editCount: 0,
      unlockedByChallenge: false,
      meals: {
        breakfast: '08:30',
        lunch: '13:00',
        snack: '16:30',
        dinner: '19:30',
      },
    };
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [editTimes, setEditTimes] = useState(schedule.meals);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Sync state to local storage
  const saveSchedule = (next: MealSchedule) => {
    setSchedule(next);
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(next));
  };

  const handleOpenEdit = () => {
    triggerHaptic?.('light');
    const currentWeek = getCurrentWeekKey();
    let currentSched = schedule;
    if (schedule.weekKey !== currentWeek) {
      currentSched = {
        ...schedule,
        weekKey: currentWeek,
        editCount: 0,
        unlockedByChallenge: false,
      };
      saveSchedule(currentSched);
    }

    // Check challenge condition: If edited 1 or more times this week and not yet unlocked by exercise
    if (currentSched.editCount >= 1 && !currentSched.unlockedByChallenge) {
      setShowChallengeModal(true);
    } else {
      setEditTimes(currentSched.meals);
      setShowEditModal(true);
    }
  };

  const handleSaveTimes = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic?.('success');
    const next: MealSchedule = {
      ...schedule,
      editCount: schedule.editCount + 1,
      unlockedByChallenge: false,
      meals: editTimes,
    };
    saveSchedule(next);
    setShowEditModal(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);
  };

  const handleStartSportChallenge = (sportType: 'run' | 'walk', targetKm: number) => {
    triggerHaptic?.('light');
    setShowChallengeModal(false);
    try {
      localStorage.setItem(
        CHALLENGE_STORAGE_KEY,
        JSON.stringify({
          active: true,
          sportType,
          targetKm,
          weekKey: schedule.weekKey,
          startedAt: new Date().toISOString(),
        })
      );
    } catch {}

    if (onNavigateToSport) {
      onNavigateToSport(sportType, targetKm);
    }
  };

    const mealCards = [
    {
      id: 'breakfast',
      title: 'Nonushta',
      desc: todayMeals.find((m: any) => m.mealCategory === 'breakfast')?.foodName || "Suli bo'tqasi, yong'oq va rezavorlar",
      kcal: todayMeals.find((m: any) => m.mealCategory === 'breakfast')?.calories || 280,
      image: todayMeals.find((m: any) => m.mealCategory === 'breakfast')?.photoBase64 || '/food/breakfast.jpg',
      isReal: Boolean(todayMeals.find((m: any) => m.mealCategory === 'breakfast')),
      time: schedule.meals.breakfast,
      badge: todayMeals.find((m: any) => m.mealCategory === 'breakfast') ? '✓ Haqiqiy tahlil' : 'Tavsiya',
    },
    {
      id: 'lunch',
      title: 'Tushlik',
      desc: todayMeals.find((m: any) => m.mealCategory === 'lunch')?.foodName || "Grilda pishirilgan tovuq go'shti va sabzavotlar",
      kcal: todayMeals.find((m: any) => m.mealCategory === 'lunch')?.calories || 520,
      image: todayMeals.find((m: any) => m.mealCategory === 'lunch')?.photoBase64 || '/food/lunch.jpg',
      isReal: Boolean(todayMeals.find((m: any) => m.mealCategory === 'lunch')),
      time: schedule.meals.lunch,
      badge: todayMeals.find((m: any) => m.mealCategory === 'lunch') ? '✓ Haqiqiy tahlil' : 'Tavsiya',
    },
    {
      id: 'snack',
      title: 'Ikkinchi tushlik',
      desc: todayMeals.find((m: any) => m.mealCategory === 'snack')?.foodName || "Mevalar, qatiq va bodom",
      kcal: todayMeals.find((m: any) => m.mealCategory === 'snack')?.calories || 180,
      image: todayMeals.find((m: any) => m.mealCategory === 'snack')?.photoBase64 || '/food/snack.jpg',
      isReal: Boolean(todayMeals.find((m: any) => m.mealCategory === 'snack')),
      time: schedule.meals.snack,
      badge: todayMeals.find((m: any) => m.mealCategory === 'snack') ? '✓ Haqiqiy tahlil' : 'Tavsiya',
    },
    {
      id: 'dinner',
      title: 'Kechki ovqat',
      desc: todayMeals.find((m: any) => m.mealCategory === 'dinner')?.foodName || "Losos balig'i, brokkoli va zaytun yog'i",
      kcal: todayMeals.find((m: any) => m.mealCategory === 'dinner')?.calories || 450,
      image: todayMeals.find((m: any) => m.mealCategory === 'dinner')?.photoBase64 || '/food/lunch.jpg',
      isReal: Boolean(todayMeals.find((m: any) => m.mealCategory === 'dinner')),
      time: schedule.meals.dinner,
      badge: todayMeals.find((m: any) => m.mealCategory === 'dinner') ? '✓ Haqiqiy tahlil' : 'Tavsiya',
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-5 pb-24 pt-1 animate-in fade-in duration-300">
      {/* SUCCESS TOAST */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>4 mahal ovqatlanish jadvali saqlandi! AI Murabbiy eslatmalarni yoqdi.</span>
        </div>
      )}

      {/* 1. HERO CALORIE SUMMARY CARD */}
      <div className="rounded-3xl bg-linear-to-br from-white via-orange-50/30 to-amber-50/50 border border-slate-200 p-5 shadow-xl shadow-slate-200/50 flex items-center justify-between gap-4 apple-card">
        {/* Left Side: Real or Default meal preview */}
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-md border-2 border-white">
          <img
            src={latestMeal?.photoBase64 || '/food/salad.jpg'}
            alt="Healthy meal"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/50 via-transparent to-transparent" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-black text-white flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-400" />
            {hasRealMealToday ? 'Haqiqiy Taom' : 'Namuna'}
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
              {remainingKcal} kcal qoldi
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

      {/* 3. 4 MAHAL OVQATLANISH GRAFIGI & AI MURABBIY CARD */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3 apple-card">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">4 Mahal Ovqatlanish Grafigi</h3>
              <p className="text-[11px] text-slate-500 font-semibold">AI Murabbiy Telegram & Push eslatmasi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Sozlash</span>
          </button>
        </div>

        {/* 4 Time Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-2xl bg-orange-50/60 border border-orange-100 text-center">
            <span className="text-[10px] font-bold text-orange-700 block">Nonushta</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{schedule.meals.breakfast}</span>
            <span className="text-[9px] text-orange-600/80 font-semibold">Energiya</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
            <span className="text-[10px] font-bold text-amber-700 block">Tushlik</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{schedule.meals.lunch}</span>
            <span className="text-[9px] text-amber-600/80 font-semibold">To'yimli</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-teal-50/60 border border-teal-100 text-center">
            <span className="text-[10px] font-bold text-teal-700 block">Ikkinchi tushlik</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{schedule.meals.snack}</span>
            <span className="text-[9px] text-teal-600/80 font-semibold">Poldnik</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
            <span className="text-[10px] font-bold text-indigo-700 block">Kechki ovqat</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{schedule.meals.dinner}</span>
            <span className="text-[9px] text-indigo-600/80 font-semibold">Yengil</span>
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Bell className="h-3.5 w-3.5 text-orange-500" />
            <span>AI Murabbiy belgilangan vaqtda rasm so‘raydi</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            {schedule.editCount === 0 ? "Haftalik o'zgartirish: 1 ta erkin" : "2-o'zgartirish: Sport sharti bilan"}
          </span>
        </div>
      </div>

      {/* 4. MACRONUTRIENT BARS (Foydali yog'lar ta'kidlangan) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm space-y-3 apple-card">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Makronutrientlar Balansi
          </h4>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Biologik muvozanat
          </span>
        </div>
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
              Sog‘lom Yog‘
            </span>
            <div className="text-sm font-black text-slate-900 mt-0.5">28g / 55g</div>
            <div className="w-full bg-rose-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '51%' }} />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed text-center font-medium">
          💡 <b>Eslatma:</b> To'yinmagan sog'lom yog'lar (zaytun moyi, yong'oq, tuxum) gormonlar va miya quvvati uchun biologik zarur.
        </p>
      </div>

      {/* 5. BUGUNGI MENYU SECTION */}
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
          {mealCards.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-orange-200 transition apple-card"
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

      {/* TIME PICKER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900">4 Mahal Ovqatlanish Vaqtlari</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTimes} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">🌅 1. Nonushta vaqti</label>
                <input
                  type="time"
                  required
                  value={editTimes.breakfast}
                  onChange={(e) => setEditTimes({ ...editTimes, breakfast: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">☀️ 2. Tushlik vaqti</label>
                <input
                  type="time"
                  required
                  value={editTimes.lunch}
                  onChange={(e) => setEditTimes({ ...editTimes, lunch: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">🍎 3. Ikkinchi tushlik (Poldnik)</label>
                <input
                  type="time"
                  required
                  value={editTimes.snack}
                  onChange={(e) => setEditTimes({ ...editTimes, snack: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">🌙 4. Kechki ovqat vaqti</label>
                <input
                  type="time"
                  required
                  value={editTimes.dinner}
                  onChange={(e) => setEditTimes({ ...editTimes, dinner: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-orange-50 text-[11px] text-orange-800 font-medium leading-relaxed">
                🔔 <b>AI Murabbiy:</b> Belgilangan har bir vaqtda Telegram orqali sizga xabar yuborib, taom va ichimlik rasmini so‘raydi.
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md shadow-orange-600/25"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GAMIFICATION CHALLENGE MODAL (Haftada 2-marta o'zgartirish uchun) */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-orange-200 space-y-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center shadow-inner">
              <Trophy className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Haftalik Intizom Sharti!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Siz ushbu haftada ovqatlanish jadvalingizni allaqachon bir marta belgilab bo‘ldingiz. 
                Metabolizm va kun tartibini buzmaslik uchun jadvalni <b>2-marta o‘zgartirish sport vazifasi</b> bilan ochiladi:
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 text-left space-y-2">
              <div className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                <Footprints className="h-4 w-4 text-orange-600" />
                <span>Quyidagi 2 ta vazifadan birini bajaring:</span>
              </div>
              <ul className="text-[11px] text-slate-700 font-semibold space-y-1 pl-1">
                <li>• <b>🚶 2 km</b> piyoda yurish</li>
                <li>• <b>🏃 1 km</b> yugurish</li>
              </ul>
              <p className="text-[10px] text-slate-500 font-medium">
                Vazifa bajarilgach, haftalik jadvalni tahrirlash avtomatik ochiladi!
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleStartSportChallenge('run', 1.0)}
                className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-orange-500 to-amber-600 text-white text-xs font-black shadow-md shadow-orange-500/25 hover:opacity-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🏃 1 km Yugurishni boshlash</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartSportChallenge('walk', 2.0)}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚶 2 km Yurishni boshlash</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChallengeModal(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Hozir emas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
