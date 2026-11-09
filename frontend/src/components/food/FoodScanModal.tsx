import React, { useState } from 'react';
import {
  X,
  Camera,
  UtensilsCrossed,
  Flame,
  Clock,
  Footprints,
  Sparkles,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Apple,
  ShieldAlert,
} from 'lucide-react';
import type { FoodScanResponse, FoodVerifyResponse, UserProfile } from '../../types/api';
import { scanFoodNutrition, verifyFoodMeal } from '../../services/apiClient';

interface FoodScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenPlans: () => void;
}

export const FoodScanModal: React.FC<FoodScanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenPlans,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [foodData, setFoodData] = useState<FoodScanResponse | null>(null);
  const [verifyData, setVerifyData] = useState<FoodVerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Both Premium and Ultra are eligible for AI Murabbiy!
  const isEligible = currentUser?.plan === 'ultra' || currentUser?.plan === 'premium';

  if (!isOpen) return null;

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFoodData(null);
    setVerifyData(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeFood = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = currentUser?.token || '';
      // Run AI Murabbiy verification
      const verifyRes = await verifyFoodMeal({ image_base64: imageBase64, meal_time: 'lunch' }, token);
      setVerifyData(verifyRes);

      // Also parse standard food data
      const parsedFood = {
        food_name: verifyRes.food_name,
        calories: verifyRes.calories,
        ingredients: [],
        sleep_after_hours: verifyRes.sleep_after_hours,
        fat_g: verifyRes.fat_g,
        carbs_g: verifyRes.carbs_g,
        protein_g: verifyRes.protein_g,
        vitamins: ['Oqsil', 'Kaliy', 'Kalsiy'],
        walk_distance_km: verifyRes.walk_distance_km,
        health_advice: verifyRes.health_advice,
      };
      setFoodData(parsedFood);

      // Persist real meal to localStorage (tetik_user_meals_v1)
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const h = new Date().getHours();
        let cat: 'breakfast' | 'lunch' | 'snack' | 'dinner' = 'lunch';
        if (h < 11) cat = 'breakfast';
        else if (h < 15) cat = 'lunch';
        else if (h < 18) cat = 'snack';
        else cat = 'dinner';

        const mealEntry = {
          id: `meal_${Date.now()}`,
          date: todayStr,
          timestamp: Date.now(),
          foodName: verifyRes.food_name || 'Taom',
          calories: Number(verifyRes.calories) || 350,
          proteinG: Number(verifyRes.protein_g) || 15,
          carbsG: Number(verifyRes.carbs_g) || 40,
          fatG: Number(verifyRes.fat_g) || 10,
          photoBase64: imageBase64,
          mealCategory: cat,
        };
        const prev = JSON.parse(localStorage.getItem('tetik_user_meals_v1') || '[]');
        prev.unshift(mealEntry);
        localStorage.setItem('tetik_user_meals_v1', JSON.stringify(prev));
        window.dispatchEvent(new CustomEvent('tetik_meal_logged', { detail: mealEntry }));
      } catch (e) {
        console.error('Failed to save meal:', e);
      }
    } catch (err: any) {
      try {
        const token = currentUser?.token || '';
        const res = await scanFoodNutrition(imageBase64, token);
        setFoodData(res);
      } catch (err2: any) {
        setErrorMsg(err2?.message || "Ovqatni tahlil qilishda xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs shadow-inner">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">AI Murabbiy — Taom Nazorati</h3>
                <span className="rounded-md bg-white text-orange-900 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  💎 Premium & 👑 Ultra
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium">
                Semirishning oldini olish, ortiqcha uglerod va yog'larni tahlil qilish
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {!isEligible ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-4 shadow-sm">
              <Lock className="h-8 w-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-1">
              AI Murabbiy — Premium va Ultra imkoniyat
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mb-5 leading-relaxed">
              Taqomingizni rasmga oling. AI Murabbiy ortiqcha uglerod semirtirib yuborishini aniqlaydi va sizga sog'lom almashtirish variantini beradi.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPlans();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:brightness-105 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Premium (15 000 so'm) yoki Ultra (40 000 so'm) ga o'tish</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Photo capture area */}
            <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 p-5 text-center">
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Ovqat"
                    className="max-h-48 mx-auto rounded-xl object-cover shadow-sm border border-orange-200"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Boshqa rasm</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCapture}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleAnalyzeFood}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 text-xs font-black shadow-xs cursor-pointer transition disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>AI Murabbiy Tekshirsin</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-800 block">
                      Hozirgi taomingizni rasmga oling
                    </span>
                    <span className="text-[11px] text-slate-500">
                      AI Murabbiy semirish xavfini va ozuqa tarkibini aniqlab beradi
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapture}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* STRICT WARNING ALERT (if excessive carbs / oil causing weight gain) */}
            {verifyData?.warning_alert && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 space-y-2.5 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 font-black text-xs text-rose-700">
                  <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>QAT'IY OGOHLANTIRISH (SEMIRISH XAVFI)</span>
                </div>
                <p className="text-xs leading-relaxed font-semibold text-rose-900">
                  {verifyData.warning_alert}
                </p>
                {verifyData.swap_recommendation && (
                  <div className="pt-2 border-t border-rose-200 text-emerald-900 text-xs font-bold bg-emerald-50/70 p-2.5 rounded-xl">
                    🥗 <b>AI Murabbiy tavsiyasi:</b> {verifyData.swap_recommendation}
                  </div>
                )}
              </div>
            )}

            {/* Analysis results */}
            {foodData && (
              <div className="space-y-3 pt-1 animate-in fade-in">
                {/* Food title & calories */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                        Aniqlangan taom
                      </span>
                      <h4 className="text-base font-black text-slate-900">{foodData.food_name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-orange-600 font-black text-lg">
                        <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
                        <span>{foodData.calories} kkal</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Umumiy energiya</span>
                    </div>
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">Oqsil (Protein)</div>
                    <div className="font-extrabold text-slate-800 mt-0.5">{foodData.protein_g}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">Yog' (Fat)</div>
                    <div className="font-extrabold text-slate-800 mt-0.5">{foodData.fat_g}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">Uglevod (Carbs)</div>
                    <div className="font-extrabold text-slate-800 mt-0.5">{foodData.carbs_g}</div>
                  </div>
                </div>

                {/* Walk to burn & Sleep timing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Footprints className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                        Yoqish uchun yurish:
                      </div>
                      <div className="text-xs font-black text-emerald-950 mt-0.5">
                        {foodData.walk_distance_km}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">
                        Uxlaguncha vaqt:
                      </div>
                      <div className="text-xs font-black text-indigo-950 mt-0.5">
                        {foodData.sleep_after_hours}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health advice */}
                {foodData.health_advice && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    💡 <strong>Maslahat:</strong> {foodData.health_advice}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
