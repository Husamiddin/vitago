import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Activity,
  Flame,
  Droplet,
  Footprints,
  Sparkles,
  Lock,
  Camera,
  Loader2,
  FileText,
  AlertTriangle,
  Pill,
  CheckCircle2,
  Clock,
  Timer,
} from 'lucide-react';
import type { ElderlyAnalysisResponse, HealthAnalysisResponse, UserProfile } from '../../types/api';
import { getElderlyAnalysis, getHealthAssessment } from '../../services/apiClient';
import { StepCounterManager } from '../../services/stepCounter';

interface HealthAndElderlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenPlans: () => void;
  onUserUpdated?: (user: UserProfile) => void;
}

export const HealthAndElderlyModal: React.FC<HealthAndElderlyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenPlans,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'health' | 'elderly'>('health');
  const [healthData, setHealthData] = useState<HealthAnalysisResponse | null>(null);
  const [elderlyData, setElderlyData] = useState<ElderlyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Health inputs & Real-Time Clock + Date state
  const [routineNotes, setRoutineNotes] = useState('');
  const [nowTime, setNowTime] = useState<Date>(() => new Date());
  const [isTodayPlanActive, setIsTodayPlanActive] = useState<boolean>(false);

  const getLocalYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const formatRealClock = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  const formatRealDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

  // Live real-time clock ticking every second
  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date();
      setNowTime(current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved plan from Railway DB (currentUser.health_plan_json) first, fallback to localStorage
  useEffect(() => {
    try {
      const todayKey = getLocalYMD(new Date());
      if (currentUser?.health_plan_json) {
        const dbPlan = JSON.parse(currentUser.health_plan_json) as HealthAnalysisResponse;
        setHealthData(dbPlan);
        const updatedMs = currentUser.health_plan_updated_at
          ? parseInt(currentUser.health_plan_updated_at, 10) || Date.parse(currentUser.health_plan_updated_at)
          : 0;
        if (updatedMs > 0) {
          const updatedKey = getLocalYMD(new Date(updatedMs));
          setIsTodayPlanActive(updatedKey === todayKey);
          return;
        }
      }

      const storageKey = 'doriscan_daily_health_plan_' + (currentUser?.phone || 'user');
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.plan) {
          setHealthData(parsed.plan);
          const genMs = parsed.generatedAt || 0;
          setIsTodayPlanActive(genMs > 0 && getLocalYMD(new Date(genMs)) === todayKey);
        } else {
          setIsTodayPlanActive(false);
        }
      }
    } catch {
      // ignore
    }
  }, [currentUser?.phone, currentUser?.health_plan_json, currentUser?.health_plan_updated_at, nowTime.getDate()]);

  // Elderly inputs
  const [elderlyNotes, setElderlyNotes] = useState('');
  const [bloodTestImage, setBloodTestImage] = useState<string | null>(null);

  const isEligible = currentUser?.plan === 'premium' || currentUser?.plan === 'ultra';

  if (!isOpen) return null;

  const handleGenerateHealthPlan = async () => {
    if (isTodayPlanActive) {
      setErrorMsg("Bugungi AI salomatlik rejangiz allaqachon tuzilgan. Kunlik reja faqat kuniga 1 marta tuziladi va saqlanadi.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = currentUser?.token || '';
      const currentSteps = currentUser?.daily_steps || 0;
      const targetSteps = currentUser?.daily_target_steps || 6000;
      const adaptiveNote = `Real vaqt: ${formatRealDate(nowTime)} ${formatRealClock(nowTime)}. Foydalanuvchi hozirgi yurgan qadamlari: ${currentSteps} ta (Mo'ljal: ${targetSteps}). ${
        currentSteps < targetSteps
          ? "Kechagi harakat kam bo'lgan, bugun faollikni oshirish tavsiya qilinsin."
          : "Harakat a'lo darajada bajarilgan, muvozanatli reja tavsiya qilinsin."
      } ${routineNotes}`;

      const res = await getHealthAssessment(adaptiveNote, token);
      setHealthData(res);

      const nowMs = Date.now();
      setIsTodayPlanActive(true);

      const storageKey = 'doriscan_daily_health_plan_' + (currentUser?.phone || 'user');
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          plan: res,
          generatedAt: nowMs,
          dateKey: getLocalYMD(new Date(nowMs)),
        })
      );

      if (currentUser && onUserUpdated) {
        onUserUpdated({
          ...currentUser,
          daily_target_steps: res.target_steps,
          daily_water_ml: res.target_water_ml,
          daily_kcal: res.target_calories_burn,
          health_plan_json: JSON.stringify(res),
          health_plan_updated_at: String(nowMs),
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Rejani tuzishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeElderly = async () => {
    if (!elderlyNotes.trim() && !bloodTestImage) {
      setErrorMsg("Iltimos, avval shikoyatlaringizni yozing yoki qon tahlili rasmini yuklang. Bo'sh ma'lumot bilan tahlil olinmaydi.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = currentUser?.token || '';
      const res = await getElderlyAnalysis(elderlyNotes, bloodTestImage, token);
      setElderlyData(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Tahlilda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBloodTestImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs shadow-inner">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">Salomatlik & Yoshi Kattalar Markazi</h3>
                <span className="rounded-md bg-amber-400 text-amber-950 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Premium
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Shaxsiy reja, qon tahlili diagnostikasi va kundalik nazorat
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'health'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Salomatlik (Ovqat, Harakat & Suv)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('elderly')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'elderly'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="h-4 w-4" />
            <span>Yoshi Kattalar Uchun Maxsus</span>
          </button>
        </div>

        {/* Content Area */}
        {!isEligible ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4 shadow-sm">
              <Lock className="h-8 w-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-1">
              Salomatlik Bo'limi — Premium imkoniyat
            </h4>
            <p className="text-xs text-slate-600 max-w-md mb-5 leading-relaxed">
              Siz kiritgan yosh, bo'y, og'irlik ma'lumotlarini AI tahlil qiladi va shaxsiy kun tartibi, suv normasi, qon tahlillari va qandli diabet/bosim xulosasini taqdim etadi.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPlans();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-800 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Premium rejasini olish (15 000 so'm/oy)</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: SALOMATLIK */}
            {activeTab === 'health' && (
              <div className="space-y-4">
                {/* Live Real-Time Pedometer / Step Counter Card */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                      <Footprints className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-black text-amber-950 text-sm">
                        {currentUser?.daily_steps || 0} / {healthData?.target_steps || currentUser?.daily_target_steps || 6000} qadam
                      </div>
                      <div className="text-[10px] text-amber-800 font-medium">
                        Telefon datchigi orqali avtomatik sanalmoqda
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-amber-100/80 border border-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Datchik faol</span>
                  </div>
                </div>

                {/* Live Real-Time Clock & Date Banner */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                      <Timer className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="font-extrabold text-blue-950 text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                        <span>{isTodayPlanActive ? 'Bugungi Shaxsiy Rejangiz Faol' : 'Bugungi AI Kunlik Reja'}</span>
                        <span className="font-mono text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-lg font-black tracking-wider shadow-2xs">
                          🕒 {formatRealClock(nowTime)}
                        </span>
                      </div>
                      <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                        Real vaqt va bugungi sana bo‘yicha shaxsiy AI kunlik salomatlik rejasi
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-black text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2.5 py-1 rounded-xl">
                    📅 {formatRealDate(nowTime)}
                  </div>
                </div>

                {/* User biometrics card */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Profil ma'lumotlari:</span>
                    <div className="flex items-center gap-3 mt-1 text-slate-600 font-medium">
                      <span>Yosh: <strong>{currentUser?.age || 25} yosh</strong></span>
                      <span>Bo'y: <strong>{currentUser?.height_cm || 175} sm</strong></span>
                      <span>Og'irlik: <strong>{currentUser?.weight_kg || 70} kg</strong></span>
                      <span>Jins: <strong>{currentUser?.gender === 'female' ? 'Ayol' : 'Erkak'}</strong></span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateHealthPlan}
                    disabled={loading || isTodayPlanActive}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition shadow-xs ${
                      isTodayPlanActive
                        ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {isTodayPlanActive ? '✓ Bugungi Reja Faol (Kuniga 1 marta)' : 'AI Kunlik Reja Tuzish'}
                    </span>
                  </button>
                </div>

                {healthData && (
                  <div className="space-y-3 animate-in fade-in">
                    {/* Metrics grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-center">
                        <Droplet className="h-5 w-5 mx-auto text-cyan-600 mb-1" />
                        <div className="text-base font-black">{healthData.target_water_ml} ml</div>
                        <div className="text-[10px] text-cyan-700 font-bold">Kunlik suv normasi</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center">
                        <Footprints className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                        <div className="text-base font-black">{healthData.target_steps} qadam</div>
                        <div className="text-[10px] text-amber-700 font-bold">Kunlik harakat</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-center">
                        <Flame className="h-5 w-5 mx-auto text-rose-600 mb-1" />
                        <div className="text-base font-black">{healthData.target_calories_burn} kkal</div>
                        <div className="text-[10px] text-rose-700 font-bold">Energiya sarfi</div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <h5 className="font-extrabold text-xs text-slate-900 mb-1">
                        🌟 AI Umumiy Tavsiyasi:
                      </h5>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {healthData.daily_plan_summary}
                      </p>
                    </div>

                    {/* Food recommendations */}
                    {healthData.food_recommendations?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                        <h5 className="font-extrabold text-xs text-emerald-900 mb-2">
                          🥗 Nimalar iste'mol qilish tavsiya etiladi:
                        </h5>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {healthData.food_recommendations.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Routine */}
                    {healthData.activity_routine?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <h5 className="font-extrabold text-xs text-slate-900 mb-2">
                          ⏰ Kun tartibi va tavsiyalar:
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {healthData.activity_routine.map((act, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-black">
                                {i + 1}
                              </span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: YOSHI KATTALAR UCHUN */}
            {activeTab === 'elderly' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                  <strong>💡 Yoshi kattalar uchun maxsus bo'lim:</strong> Ushbu bo'limda so'nggi qon tahlillari (glyukoza, qon bosimi, gemoglobin) yoki o'zingizdagi alomatlarni yozishingiz/rasmini yuklashingiz mumkin. AI diabet, qon bosimi va mos xavfsiz dorilar bo'yicha yo'l-yo'riq beradi.
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Alomatlar yoki oxirgi tahlil natijalari (ixtiyoriy yozing):
                  </label>
                  <textarea
                    rows={3}
                    value={elderlyNotes}
                    onChange={(e) => setElderlyNotes(e.target.value)}
                    placeholder="Masalan: Qon bosimim 140/90 chiqmoqda, qand miqdori 6.5 mmol/l. Ba'zan boshim aylanadi..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Blood test image capture */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Qon tahlili varaqasi rasmi (kamera orqali):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 text-xs font-bold cursor-pointer transition">
                      <Camera className="h-4 w-4 text-emerald-600" />
                      <span>{bloodTestImage ? "Rasmni o'zgartirish" : "Kamerada rasmga olish"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageCapture}
                        className="hidden"
                      />
                    </label>

                    {bloodTestImage && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Rasm yuklandi
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeElderly}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 text-xs font-black text-white hover:from-emerald-700 hover:to-teal-800 transition disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>AI Tahlilini Olish</span>
                </button>

                {elderlyData && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <h5 className="font-extrabold text-xs text-slate-900">
                        📋 Tahlil Xulosasi:
                      </h5>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {elderlyData.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                        <span className="font-bold text-rose-900 block mb-1">🩸 Qandli diabet & Qon holati:</span>
                        <p className="text-rose-800">{elderlyData.has_diabetes_signs}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs">
                        <span className="font-bold text-indigo-900 block mb-1">💓 Qon bosimi tavsiyasi:</span>
                        <p className="text-indigo-800">{elderlyData.blood_pressure_advice}</p>
                      </div>
                    </div>

                    {elderlyData.dietary_dos_and_donts?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                        <h5 className="font-extrabold text-xs text-emerald-950 mb-2">
                          🍽️ Nima yeyish mumkin va nimalar taqiqlanadi:
                        </h5>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {elderlyData.dietary_dos_and_donts.map((rule, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-700 font-bold">•</span>
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {elderlyData.suggested_safe_medicines?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                        <h5 className="font-extrabold text-xs text-blue-950 mb-2">
                          💊 Tavsiya etiladigan xavfsiz preparatlar (yo'naltiruvchi):
                        </h5>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {elderlyData.suggested_safe_medicines.map((med, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{med}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 border border-slate-200">
                      ⚠️ <strong>Muhim eslatma:</strong> {elderlyData.disclaimer}
                    </div>
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
