import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Scan,
  Search,
  History,
  MessageSquare,
  HeartPulse,
  BellRing,
  Compass,
  MapPin,
  Trophy,
  Footprints,
  Flame,
  Utensils,
  AlarmClock,
  Droplets,
  Moon,
  ShieldCheck,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import { trackOnboardingEvent } from '../../services/onboardingAnalytics';

export interface FeaturePreviewData {
  id: string;
  category: 'health' | 'sport' | 'life' | 'pricing';
  title: string;
  badge: 'Free' | 'Premium' | 'Ultra';
  badgeColor: string;
  iconName: string;
  summary: string;
  description: string;
  howItWorks: string[];
  benefits: string[];
  demoType:
    | 'prescription_scanner'
    | 'drug_search'
    | 'ai_pharmacist'
    | 'medication_alarm'
    | 'gps_navigator'
    | 'ai_workout'
    | 'food_calorie'
    | 'smart_alarm_math'
    | 'water_tracker'
    | 'generic';
}

interface FeaturePreviewModalProps {
  feature: FeaturePreviewData | null;
  onClose: () => void;
  onTryFeature?: (featureId: string) => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const FeaturePreviewModal: React.FC<FeaturePreviewModalProps> = ({
  feature,
  onClose,
  onTryFeature,
  triggerHaptic,
}) => {
  // Demo states
  const [demoPrescriptionScanned, setDemoPrescriptionScanned] = useState(false);
  const [demoSearchQuery, setDemoSearchQuery] = useState('Paratsetamol');
  const [demoAlarmChecked, setDemoAlarmChecked] = useState(false);
  const [demoMathAnswer, setDemoMathAnswer] = useState('');
  const [demoMathSolved, setDemoMathSolved] = useState(false);
  const [demoMathError, setDemoMathError] = useState(false);
  const [demoWaterMl, setDemoWaterMl] = useState(1250);
  const [demoWorkoutRunning, setDemoWorkoutRunning] = useState(false);
  const [demoWorkoutSecs, setDemoWorkoutSecs] = useState(45);

  if (!feature) return null;

  const handleClose = () => {
    triggerHaptic?.('light');
    trackOnboardingEvent('feature_demo_completed', {
      category: feature.category,
      feature_id: feature.id,
    });
    onClose();
  };

  const renderIcon = () => {
    const cls = 'h-7 w-7';
    switch (feature.iconName) {
      case 'scan':
        return <Scan className={cls} />;
      case 'search':
        return <Search className={cls} />;
      case 'history':
        return <History className={cls} />;
      case 'message':
        return <MessageSquare className={cls} />;
      case 'heart':
        return <HeartPulse className={cls} />;
      case 'bell':
        return <BellRing className={cls} />;
      case 'map':
        return <Compass className={cls} />;
      case 'trophy':
        return <Trophy className={cls} />;
      case 'footprints':
        return <Footprints className={cls} />;
      case 'zap':
        return <Zap className={cls} />;
      case 'utensils':
        return <Utensils className={cls} />;
      case 'alarm':
        return <AlarmClock className={cls} />;
      case 'water':
        return <Droplets className={cls} />;
      case 'moon':
        return <Moon className={cls} />;
      default:
        return <Sparkles className={cls} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/20 text-slate-900 p-5 sm:p-6 space-y-5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              {renderIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    feature.badge === 'Ultra'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : feature.badge === 'Premium'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {feature.badge}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {feature.category}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {feature.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Core Value Headline */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-950 font-bold text-xs sm:text-sm leading-relaxed">
          {feature.summary}
        </div>

        {/* Detailed Explanation */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          {feature.description}
        </p>

        {/* How It Works Checklist */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Qanday ishlaydi?
          </h4>
          <div className="space-y-1.5">
            {feature.howItWorks.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                <span className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Sizga beradigan asosiy foydasi:
          </h4>
          <div className="space-y-1.5">
            {feature.benefits.map((b, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE DEMO CARD (Marked clearly as Demo Ma'lumot) */}
        {/* ======================================================== */}
        <div className="pt-2">
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-slate-50/70 p-4 space-y-3 relative overflow-hidden">
            {/* Demo Watermark Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Interaktiv Demo (Namunaviy)
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Shaxsiy hisobga ta'sir qilmaydi
              </span>
            </div>

            {/* DEMO 1: Prescription Scanner Demo */}
            {feature.demoType === 'prescription_scanner' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400">Namunaviy retsept (Ko'rgazmali demo):</div>
                  <div className="font-serif italic text-sm text-slate-800 mt-0.5">
                    "Nurofen 400mg №12 (Ibuprofen) — 1 tabletka og'riqda, ovqatdan so'ng"
                  </div>
                </div>

                {!demoPrescriptionScanned ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.('light');
                      setDemoPrescriptionScanned(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <Scan className="h-4 w-4" />
                    Skanerlash namunasini ko'rish
                  </button>
                ) : (
                  <div className="space-y-2.5 animate-in fade-in duration-300">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                        <span>Brend dori: Nurofen 400mg</span>
                        <span className="text-slate-500 line-through">42 000 so'm</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-emerald-300 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            Rasmiy generik analog: Ibuprofen 400mg
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            Faol modda: 100% bir xil (Ibuprofen 400mg)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-700">12 000 so'm</div>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white">
                            -71% tejash
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-1.5 text-[10px] text-amber-800 font-semibold leading-relaxed">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Tibbiy xavfsizlik:</strong> Ushbu demo namunaviy hisoblanadi. Hech qachon dori vositasi yoki dozasini davolovchi shifokor yoki farmatsevt maslahatisiz mustaqil o'zgartirmang.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDemoPrescriptionScanned(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" /> Qayta sinash
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DEMO 2: Drug Search Demo */}
            {feature.demoType === 'drug_search' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={demoSearchQuery}
                    onChange={(e) => setDemoSearchQuery(e.target.value)}
                    placeholder="Dori nomini kiriting..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black">
                    Qidirish
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>Paratsetamol 500mg №10</span>
                    <span className="text-blue-600 font-bold">4 500 — 7 000 so'm</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Analgetik va antipiretik vosita • Dorixonalardagi narxlar taqqoslanadi
                  </div>
                </div>
              </div>
            )}

            {/* DEMO 3: AI Pharmacist Demo */}
            {feature.demoType === 'ai_pharmacist' && (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-blue-100/60 text-blue-900 text-xs font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>"Paratsetamol va Ibuprofen bir vaqtda mumkinmi?"</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-blue-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Farmatsevt axborot xulosasi:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    "Paratsetamol va Ibuprofen turli xil farmakologik guruhga kiradi. Ularni bir vaqtda birga qabul qilish jigar va buyraklarga ortiqcha yuklama berishi mumkin. Faqat shifokor ko'rsatmasi bilan qat'iy vaqt oraliqlariga (Paratsetamol 4-6 soat, Ibuprofen 6-8 soat) rioya qilgan holda navbatma-navbat berilishi mumkin."
                  </p>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-[10px] text-amber-900 font-bold">
                    <div className="flex items-center gap-1 text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                      <span>Shifokor ko'rigi zarur:</span>
                    </div>
                    <p className="font-medium text-amber-800">
                      Ushbu javob individual davolash rejasi emas. Shoshilinch vaziyatlarda zudlik bilan 103 tez tibbiy yordam xizmatiga qo'ng'iroq qiling.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DEMO 4: Medication Alarm Demo */}
            {feature.demoType === 'medication_alarm' && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                      💊
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Vitamin D3 • 1 kapsula</div>
                      <div className="text-[10px] text-slate-400 font-bold">Har kuni 08:00 da</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.('success');
                      setDemoAlarmChecked(!demoAlarmChecked);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      demoAlarmChecked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {demoAlarmChecked ? <Check className="h-3.5 w-3.5" /> : null}
                    {demoAlarmChecked ? 'Ichildi ✓' : 'Ichdim deb belgilash'}
                  </button>
                </div>
              </div>
            )}

            {/* DEMO 5: GPS Navigator Demo */}
            {feature.demoType === 'gps_navigator' && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1 text-slate-900">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      Marshrut: Toshkent shahar bog'i
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      GPS Marshrut (Datchik faol)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] font-bold text-slate-400">Masofa</div>
                      <div className="text-xs font-black text-slate-800">1.82 km</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] font-bold text-slate-400">Vaqt</div>
                      <div className="text-xs font-black text-slate-800">14:20</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] font-bold text-slate-400">Tezlik</div>
                      <div className="text-xs font-black text-blue-600">8.7 km/soat</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DEMO 6: Ultra Calorie Food Scanner Demo */}
            {feature.demoType === 'food_calorie' && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">🍛</span> Milliy Taom: Samarqand Oshi (Palov)
                    </span>
                    <span className="text-amber-600 font-bold">~850 kcal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">Oqsil: 24g</div>
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">Yog': 32g</div>
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">Uglevod: 112g</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-[10px] text-slate-600 font-medium">
                    💡 AI Xulosasi: Uglevod darajasi me'yordan sal balandroq. Bugun qo'shimcha 25
                    daqiqa piyoda yurish tavsiya etiladi.
                  </div>
                </div>
              </div>
            )}

            {/* DEMO 7: Smart Mission Alarm Math Demo */}
            {feature.demoType === 'smart_alarm_math' && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900">
                    <span>Budilnik Missiyasi: Aqliy uyg'onish</span>
                    <span className="text-rose-600 font-bold animate-pulse">⏰ Signal chalinmoqda!</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-white text-center font-mono font-black text-base">
                    23 + 38 = ?
                  </div>
                  {!demoMathSolved ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={demoMathAnswer}
                        onChange={(e) => {
                          setDemoMathAnswer(e.target.value);
                          setDemoMathError(false);
                        }}
                        placeholder="Javobni yozing..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (demoMathAnswer.trim() === '61') {
                            triggerHaptic?.('success');
                            setDemoMathSolved(true);
                            setDemoMathError(false);
                          } else {
                            triggerHaptic?.('light');
                            setDemoMathError(true);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition cursor-pointer"
                      >
                        Tekshirish
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-center text-xs font-black text-emerald-800">
                      🎉 To'g'ri (61)! Budilnik o'chdi va siz uyg'ondingiz!
                    </div>
                  )}
                  {demoMathError && (
                    <div className="text-[10px] text-rose-600 font-bold text-center">
                      Noto'g'ri javob, hisoblab qayta urinib ko'ring (23 + 38)!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DEMO 8: AI Workout Demo */}
            {feature.demoType === 'ai_workout' && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Sprint & Cho'zilish mashqi
                    </span>
                    <span className="text-blue-600 font-mono font-bold">
                      00:{demoWorkoutSecs < 10 ? `0${demoWorkoutSecs}` : demoWorkoutSecs}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-600 font-semibold">
                      Har 45 soniyada yangi mashq va ovozli murabbiy
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic?.('light');
                        setDemoWorkoutRunning(!demoWorkoutRunning);
                        if (!demoWorkoutRunning && demoWorkoutSecs <= 0) {
                          setDemoWorkoutSecs(45);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-black cursor-pointer flex items-center gap-1"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      {demoWorkoutRunning ? "To'xtatish" : 'Boshlash'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DEMO 9: Water Tracker Demo */}
            {feature.demoType === 'water_tracker' && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900">
                    <span className="flex items-center gap-1 text-cyan-600">
                      <Droplets className="h-4 w-4" />
                      Kunlik suv balansi
                    </span>
                    <span className="text-slate-800 font-bold">{demoWaterMl} / 2000 ml</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (demoWaterMl / 2000) * 100)}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.('light');
                      setDemoWaterMl((prev) => Math.min(2500, prev + 250));
                    }}
                    className="w-full py-1.5 rounded-xl bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-black text-xs cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    + 250 ml (Bir stakan suv)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm transition cursor-pointer text-center"
          >
            Tushunarli
          </button>
          {onTryFeature && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('success');
                onTryFeature(feature.id);
                handleClose();
              }}
              className="flex-1 py-3 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Sinab ko'rish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
