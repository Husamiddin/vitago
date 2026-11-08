import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  Footprints,
  Droplets,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingDown,
  Activity,
  Heart,
  ChevronRight,
  Bell,
} from 'lucide-react';
import type { UserProfile, GoalsPlanResponse } from '../../types/api';
import { getGoalsPlan } from '../../services/apiClient';

interface AIGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onGoalUpdated?: (updatedUser: UserProfile) => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const AIGoalsModal: React.FC<AIGoalsModalProps> = ({
  isOpen,
  onClose,
  user,
  onGoalUpdated,
  triggerHaptic,
}) => {
  const [targetType, setTargetType] = useState<string>('vazn_tashlash');
  const [weightLossGoal, setWeightLossGoal] = useState<string>('1.0');
  const [stepsTarget, setStepsTarget] = useState<number>(user?.daily_target_steps || 10000);
  const [activeMinutes, setActiveMinutes] = useState<number>(45);
  const [activityPref, setActivityPref] = useState<string>('yurish');
  const [healthNotes, setHealthNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState<GoalsPlanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    triggerHaptic?.('light');
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = user?.token || '';
      const res = await getGoalsPlan(
        {
          target_type: targetType,
          weight_target_kg: parseFloat(weightLossGoal) || 1.0,
          daily_steps_target: stepsTarget,
          daily_active_minutes: activeMinutes,
          activity_preference: activityPref,
          health_notes: healthNotes || undefined,
        },
        token
      );
      setPlanResult(res);
      triggerHaptic?.('success');

      if (user && onGoalUpdated) {
        onGoalUpdated({
          ...user,
          daily_target_steps: res.recommended_daily_steps,
          daily_water_ml: res.recommended_daily_water_ml,
          daily_kcal: res.recommended_daily_burn_kcal,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Reja tuzishda xatolik yuz berdi. Iltimos qaytadan urining.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold shadow-inner">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Maqsadlarim & AI Rejalashtiruvchi
                </h3>
              </div>
              <p className="text-xs text-white/80 font-medium">
                Haftalik vazn, kunlik qadam va moslashuvchan reja
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!planResult ? (
            /* GOAL SETUP FORM */
            <div className="space-y-4">
              {/* Question 1: Target Type */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  1. Asosiy haftalik maqsadingiz:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'vazn_tashlash', label: 'Vazn tashlash', icon: '📉', desc: 'Ortiqcha yog`' },
                    { id: 'vazn_saqlash', label: 'Vaznni saqlash', icon: '⚖️', desc: 'Barqarorlik' },
                    { id: 'mushak_yigish', label: 'Qomat / Kuch', icon: '💪', desc: 'Chidamlilik' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetType(t.id)}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                        targetType === t.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-200'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <span className="text-xl block mb-1">{t.icon}</span>
                      <span className="text-xs font-black text-slate-900 block">{t.label}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Target Selection (if vazn_tashlash) */}
              {targetType === 'vazn_tashlash' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span>Shu hafta qancha vazn tashlamoqchisiz?</span>
                    <span className="text-blue-600 font-black">-{weightLossGoal} kg / hafta</span>
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {['0.5', '1.0', '1.5', '2.0'].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWeightLossGoal(w)}
                        className={`py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                          weightLossGoal === w
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        -{w} kg
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    *Tibbiyot bo'yicha haftasiga 0.5–1.0 kg xavfsiz va eng mustahkam me'yor hisoblanadi.
                  </p>
                </div>
              )}

              {/* Question 2: Daily Steps Target */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  2. Kunlik qadam maqsadi:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[6000, 8000, 10000, 12000].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStepsTarget(s)}
                      className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                        stepsTarget === s
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-200'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <Footprints className={`h-4 w-4 mx-auto mb-1 ${stepsTarget === s ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-black text-slate-900 block">{s.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 font-semibold">qadam</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Preferred Activity */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  3. Qanday harakatni yoqtirasiz?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'yurish', label: 'Piyoda', icon: '🚶' },
                    { id: 'yugurish', label: 'Yugurish', icon: '🏃' },
                    { id: 'fitness', label: 'Fitness', icon: '🏋️' },
                    { id: 'yoga', label: "Yog'a", icon: '🧘' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityPref(act.id)}
                      className={`py-2 px-1 rounded-xl border text-center transition cursor-pointer ${
                        activityPref === act.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="mr-1">{act.icon}</span>
                      <span className="text-xs font-black">{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4: Health Notes / Constraints */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  4. Sog'lig'ingizdagi cheklovlar (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  placeholder="Masalan: Tizza bo'g'imida yengil og'riq, qon bosimi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Generate Plan CTA Button */}
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:brightness-105 text-white font-black text-sm shadow-xl shadow-blue-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI Rejangiz hisoblanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-amber-300" />
                    <span>AI dan Shaxsiy Kunlik Reja Olish</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* PLAN RESULT VIEW */
            <div className="space-y-4 animate-in fade-in">
              {/* Summary Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-emerald-50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>AI Shaxsiy Kunlik Maqsadingiz</span>
                </div>
                <h4 className="text-base font-black text-slate-900 leading-snug">
                  {planResult.summary}
                </h4>

                {/* Calculated Targets */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-blue-100">
                    <Footprints className="h-4 w-4 text-blue-600 mx-auto" />
                    <div className="text-base font-black text-slate-900 mt-1">
                      {planResult.recommended_daily_steps.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">Kunlik qadam</div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-blue-100">
                    <Droplets className="h-4 w-4 text-cyan-600 mx-auto" />
                    <div className="text-base font-black text-slate-900 mt-1">
                      {planResult.recommended_daily_water_ml} ml
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">Suv normasi</div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-blue-100">
                    <Flame className="h-4 w-4 text-orange-500 fill-orange-500 mx-auto" />
                    <div className="text-base font-black text-slate-900 mt-1">
                      {planResult.recommended_daily_burn_kcal} kkal
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">Yoqish kerak</div>
                  </div>
                </div>
              </div>

              {/* Weekly Milestones */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Haftalik Bosqichlar:
                </span>
                <ul className="text-xs text-slate-700 space-y-1.5 pl-1">
                  {planResult.weekly_milestones.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-black">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Daily Routine Schedule */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Kunlik Tartib Jadvali:
                </span>
                <div className="space-y-2">
                  {planResult.daily_routine.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {r.time}
                      </span>
                      <span className="text-slate-800 font-medium">{r.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivation Quote */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium italic flex items-center gap-2.5">
                <span className="text-xl">🌟</span>
                <span>"{planResult.motivation_quote}"</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPlanResult(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer"
                >
                  Maqsadni o'zgartirish
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  Rejani Qabul Qilish ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
