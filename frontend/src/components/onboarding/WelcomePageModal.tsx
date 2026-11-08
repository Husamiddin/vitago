import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Scan,
  Search,
  History,
  MessageSquare,
  HeartPulse,
  BellRing,
  Compass,
  Footprints,
  Flame,
  Utensils,
  AlarmClock,
  Droplets,
  Moon,
  ShieldCheck,
  Check,
  Crown,
  ChevronRight,
  ExternalLink,
  Award,
  Lock,
} from 'lucide-react';
import {
  trackOnboardingEvent,
  markOnboardingCompleted,
} from '../../services/onboardingAnalytics';
import {
  FeaturePreviewModal,
  type FeaturePreviewData,
} from './FeaturePreviewModal';

// Master catalog of all verified, real VitaGo features
const HEALTH_FEATURES: FeaturePreviewData[] = [
  {
    id: 'prescription_scanner',
    category: 'health',
    title: 'Dori skaneri (Retsept OCR)',
    badge: 'Free',
    badgeColor: 'emerald',
    iconName: 'scan',
    summary: "Shifokor qo'lyozmasini 2 soniyada o'qish va 70% gacha arzon analoglarni topish.",
    description:
      "Tushunarsiz qo'lyozma bilan yozilgan retsept yoki dori qutisini rasmga olasiz. AI Gemini Vision bir zumda dori nomini aniqlaydi, uning vazifasini xalq tilida tushuntiradi va xuddi shu ta'sirga ega arzonroq analoglarini taklif etadi.",
    howItWorks: [
      'Kamerani retseptga qarating yoki galereyadan rasm tanlang',
      "AI 2 soniyada dori nomlari va dozalarini to'liq ajratib oladi",
      "Rasmiy bazadan bir xil tarkibli 70% gacha arzon analoglar ro'yxatini olasiz",
    ],
    benefits: [
      "Dorixonaga borishdan oldin sarf-xarajatni 70% gacha tejaysiz",
      "Shifokor xati tushunarsiz bo'lsa ham hech qanday xato qilmaysiz",
      "Dori qabul qilish qoidasini sodda tilda tushunasiz",
    ],
    demoType: 'prescription_scanner',
  },
  {
    id: 'drug_search',
    category: 'health',
    title: 'Dori qidirish & Narxlar bazasi',
    badge: 'Free',
    badgeColor: 'emerald',
    iconName: 'search',
    summary: "Rasmiy bazadagi 130+ dori vositalarining narxlari va qo'llash yo'riqnomasi.",
    description:
      "Dori nomini yoki kasallik alomatini yozing. VitaGo dorixonalaridagi aktual narxlar, dozalash, farmakologik guruh va eng yaqin analoglarni bir zumda chiqarib beradi.",
    howItWorks: [
      'Qidiruv satriga dori nomini yozasiz',
      "Tizim eng arzon va ishonchli analoglarini taqqoslab ko'rsatadi",
      "Dozalash va foydalanish yo'riqnomasini o'qiysiz",
    ],
    benefits: [
      "Keraksiz qimmat dorilarga ortiqcha pul to'lamaysiz",
      "Har bir dori haqida to'liq va ishonchli tibbiy ma'lumot olasiz",
    ],
    demoType: 'drug_search',
  },
  {
    id: 'scan_history',
    category: 'health',
    title: 'Skanerlash tarixi & Arxiv',
    badge: 'Premium',
    badgeColor: 'amber',
    iconName: 'history',
    summary: 'Barcha skanerlangan retseptlar shaxsiy arxivda xavfsiz saqlanadi.',
    description:
      "Qaysi dorini qachon ichganingiz yoki qaysi retsept berilganini unutib qo'ymaysiz. Barcha natijalar shifrlangan holda shaxsiy hisobingizda tartibli saqlanadi.",
    howItWorks: [
      'Har bir skanerlash avtomatik arxivlanadi',
      "Istalgan vaqtda eski retseptlar va o'tgan davolanish kurslarini ko'rishingiz mumkin",
    ],
    benefits: [
      "Eski retsept qog'ozlarini qidirib yurish shart emas",
      "Shifokorga oldingi davolanish tarixingizni ko'rsatish juda qulay",
    ],
    demoType: 'generic',
  },
  {
    id: 'ai_pharmacist',
    category: 'health',
    title: 'AI Farmatsevt (24/7 Maslahat)',
    badge: 'Premium',
    badgeColor: 'amber',
    iconName: 'message',
    summary: "Dori vositalarining o'zaro ta'siri va nojo'ya ta'sirlari bo'yicha 24/7 aqlli suhbat.",
    description:
      "Ikki xil dorini birga ichish mumkinmi? Homiladorlikda qaysi dori xavfsiz? AI Farmatsevt tibbiy ma'lumotlar bazasiga tayangan holda professional javob beradi. AI shifokor o'rnini bosmaydi, ammo xavfsizlik maslahatlarini beradi.",
    howItWorks: [
      'Savolingizni matn yoki ovoz orqali yuborasiz',
      "AI xalqaro farmakopeya va ilmiy manbalarga asosan javob tuzadi",
      "Nojo'ya ta'sirlar va to'g'ri qabul qilish tartibi tushuntiriladi",
    ],
    benefits: [
      "Dorixonaga yugurmasdan 24/7 tezkor xavfsizlik maslahatini olasiz",
      "Xavfli dori kombinatsiyalaridan ogohlantirilasiz",
    ],
    demoType: 'ai_pharmacist',
  },
  {
    id: 'medication_reminders',
    category: 'health',
    title: 'Audio Dori Eslatmalari',
    badge: 'Free',
    badgeColor: 'emerald',
    iconName: 'bell',
    summary: 'Dori vaqti kelganda telefon signal chaladi va tasdiqlashni talab qiladi.',
    description:
      "Dori ichish vaqtini o'tkazib yubormaslik uchun har bir doriga vaqt va doza belgilang. Belgilangan paytda aniq audio signal yangraydi va 'Ichdim ✓' tugmasi bosilmaguncha eslatib turadi.",
    howItWorks: [
      'Dori nomi, qabul vaqti va davomiyligini belgilaysiz',
      "Vaqti kelganda real audio signal chalinadi",
      "'Ichdim ✓' tugmasini bosib kunlik rejangizda qayd etasiz",
    ],
    benefits: [
      'Davolanish rejimini hech qachon unutmaysiz',
      "Oila a'zolaringiz va keksalar uchun juda qulay nazorat",
    ],
    demoType: 'medication_alarm',
  },
  {
    id: 'health_monitoring',
    category: 'health',
    title: "Sog'liq monitoringi & AI Kunlik Reja",
    badge: 'Premium',
    badgeColor: 'amber',
    iconName: 'heart',
    summary: 'Puls, qon bosimi va keksalar salomatligi uchun shaxsiy AI tavsiyalar.',
    description:
      "Kundalik puls, qon bosimi va umumiy holatingizni kiritasiz. AI Kunlik Reja bugungi ovqatlanish, jismoniy faollik va dam olish tavsiyalarini bir kunda bir marta yangilab beradi.",
    howItWorks: [
      "Har kuni ertalab salomatlik ko'rsatkichlaringizni kiritasiz",
      'AI individual tavsiyalarni tuzadi',
      "Oylik va haftalik sog'liq dinamikasini kuzatasiz",
    ],
    benefits: [
      "Salomatlikdagi noxush o'zgarishlarni vaqtida payqaysiz",
      "Keksalar parvarishi uchun xavfsiz va tizimli yordamchi",
    ],
    demoType: 'generic',
  },
];

const SPORT_FEATURES: FeaturePreviewData[] = [
  {
    id: 'gps_navigator',
    category: 'sport',
    title: 'Real GPS Navigator & Jonli Xarita',
    badge: 'Ultra',
    badgeColor: 'purple',
    iconName: 'map',
    summary: "Qurilma datchiklariga asoslangan jonli GPS marshrut, tezlik va balandlik ko'rsatkichlari.",
    description:
      "Yugurish yoki velosiped haydash paytida haqiqiy sun'iy yo'ldosh GPS ma'lumotlari asosida marshrutingiz xaritada chiziladi. Hech qanday soxta masofa yo'q — har bir metr haqiqatdan bosib o'tiladi.",
    howItWorks: [
      "Mashg'ulot turini tanlaysiz va 'Boshlash' tugmasini bosasiz",
      "GPS marshrutingizni xaritada chizib boradi",
      'Tezlik, balandlik va sarflangan kaloriya jonli hisoblanadi',
    ],
    benefits: [
      "Mashg'ulotlaringizning haqiqiy xaritasi va trayektoriyasini ko'rasiz",
      'Ilova yopilganda ham fon rejimida marshrut yozishda davom etadi',
    ],
    demoType: 'gps_navigator',
  },
  {
    id: 'sport_categories',
    category: 'sport',
    title: '7 xil Professional Sport Turlari',
    badge: 'Ultra',
    badgeColor: 'purple',
    iconName: 'trophy',
    summary: 'Yugurish, Trail, Piyoda yurish, Hiking, Shosse va Tog‘ velosipedi.',
    description:
      "Har bir sport turining o'ziga xos energiya sarfi bor. VitaGo tanlangan sport turiga qarab alohida kaloriya va tezlik formulasidan foydalanadi.",
    howItWorks: [
      '7 ta yo‘nalishdan birini tanlaysiz',
      'Tizim mos energiya sarfi (masalan, piyoda ~40 kcal/km, yugurish ~75 kcal/km) ko‘rsatadi',
    ],
    benefits: [
      'Barcha turdagi faolligingizni yagona tizimda hisobga olasiz',
      'Turli sport turlari bo‘yicha shaxsiy rekordlarni o‘rnatasiz',
    ],
    demoType: 'generic',
  },
  {
    id: 'step_counter',
    category: 'sport',
    title: 'Qadamlar hisoblagichi (Pedometer)',
    badge: 'Free',
    badgeColor: 'emerald',
    iconName: 'footprints',
    summary: "Haqiqiy harakat datchigi orqali qadamlar hisobi, 00:00 da avtomatik yangilanish.",
    description:
      'Telefoningiz akselerometri yordamida har bir qadamingiz hisoblanadi. Hech qanday soxta raqamlarsiz, kun oxirida 00:00 da yangilanadi.',
    howItWorks: [
      'Telefoningiz cho‘ntakda yoki qo‘lingizda bo‘lganda qadamlar sanaladi',
      'Kunlik 10 000 qadam maqsadi progress satrida ko‘rinadi',
    ],
    benefits: [
      'Kundalik faollik me’yoringizni doimo nazorat qilasiz',
      'Kamharakat turmush tarzidan xalos bo‘lasiz',
    ],
    demoType: 'generic',
  },
  {
    id: 'ai_workout',
    category: 'sport',
    title: 'AI Murabbiy (Fitness & Yoga)',
    badge: 'Ultra',
    badgeColor: 'purple',
    iconName: 'zap',
    summary: "Shaxsiy mashg'ulotlar rejasi, 45 soniyalik jonli intervallar va murabbiy ko'rsatmalari.",
    description:
      "Sport zalga borishga vaqtingiz yo'qmi? AI Murabbiy uyingizda jismoniy holatingizga mos fitness yoki tinchlantiruvchi yoga mashqlarini interaktiv taymer bilan o'tkazib beradi.",
    howItWorks: [
      'Fitness yoki Yoga mashg‘ulotini tanlaysiz',
      '45 soniyalik dinamik taymer bilan har bir mashq ko‘rsatiladi',
      "Mashq yakunida sarflangan kaloriya sport tarixingizga qo'shiladi",
    ],
    benefits: [
      'Qimmat shaxsiy fitnes murabbiyiga alternativa',
      'Har kuni qulay va xavfsiz tartibda shug‘ullanish imkoniyati',
    ],
    demoType: 'ai_workout',
  },
];

const LIFE_FEATURES: FeaturePreviewData[] = [
  {
    id: 'food_calorie_scanner',
    category: 'life',
    title: 'Ultra Kaloriya — Taom skaneri',
    badge: 'Ultra',
    badgeColor: 'purple',
    iconName: 'utensils',
    summary: "Ovqatni rasmga olasiz — AI uning kaloriyasi, oqsili, yog'i va uglevodlarini aytadi.",
    description:
      "Tushlik yoki kechki ovqatingizni rasmga olasiz. AI taom tarkibini taniyadi va sizga uning ozuqaviy qiymatini tushuntiradi. Agar rejangizdan tashqari ko'p uglevod bo'lsa, semirishdan ogohlantiradi.",
    howItWorks: [
      'Taom rasmini yuklaysiz',
      'AI taom nomini, kaloriyasini va BJU (oqsil/yog‘/uglevod) hisoblaydi',
      'Kunlik kaloriya balansingizga avtomatik qo‘shiladi',
    ],
    benefits: [
      'Semirib ketishdan va ortiqcha vazndan samarali himoyalanasiz',
      'Parhez va sog‘lom ovqatlanishni hisoblash 5 barobar osonlashadi',
    ],
    demoType: 'food_calorie',
  },
  {
    id: 'smart_alarm',
    category: 'life',
    title: 'Ultra Missiyali Aqlli Budilnik',
    badge: 'Ultra',
    badgeColor: 'purple',
    iconName: 'alarm',
    summary: 'Buzilmas budilnik — matematik misol yechilmaguncha signal to‘xtamaydi!',
    description:
      "Ertalab uxlab qolishdan charchadingizmi? VitaGo budilnigi chalinganda siz arifmetik misol yechishingiz yoki jismoniy harakat qilishingiz kerak. Miya uyg'onmaguncha signal o'chmaydi.",
    howItWorks: [
      'Uyg‘onish vaqtini va missiyani (masalan, hisoblash) belgilaysiz',
      'Ertalab signal chalinganda ekranda misol paydo bo‘ladi',
      'Faqat to‘g‘ri javob berilgandagina signal o‘chadi',
    ],
    benefits: [
      "Aqliy va jismoniy missiyalar orqali uxlab qolishning oldini oladi",
      'Tongni aqliy uyg‘oq va tetik boshlaysiz',
    ],
    demoType: 'smart_alarm_math',
  },
  {
    id: 'water_sleep_tracker',
    category: 'life',
    title: 'Suv va Uyqu balansi monitoringi',
    badge: 'Free',
    badgeColor: 'emerald',
    iconName: 'water',
    summary: 'Kunlik 2.0L suv va 8 soatlik sog‘lom uyqu rejimini to‘liq nazorat qilish.',
    description:
      "Suv ichganingizda bir tugma bilan belgilab boring. Uxlash va uyg'onish soatlaringizni kiritib, haftalik uyqu sifatini grafikda tahlil qiling.",
    howItWorks: [
      'Bir stakan suv ichganda ‘+250ml’ tugmasini bosasiz',
      'Kechasi uxlash va ertalab uyg‘onish vaqtini kiritasiz',
      'Haqiqiy ma’lumotlarga asoslangan sog‘liq grafigini ko‘rasiz',
    ],
    benefits: [
      'Tanangiz suvsizlanishidan saqlanasiz',
      'Doimiy energiyaga to‘la bo‘lish uchun uyqu rejimingiz izga tushadi',
    ],
    demoType: 'water_tracker',
  },
];

interface WelcomePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNow: () => void;
  onOpenPlans: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const WelcomePageModal: React.FC<WelcomePageModalProps> = ({
  isOpen,
  onClose,
  onStartNow,
  onOpenPlans,
  triggerHaptic,
}) => {
  // Mode: 'welcome' (Hero Screen) or 'walkthrough' (Step-by-step Interactive Tour)
  const [mode, setMode] = useState<'welcome' | 'walkthrough'>('welcome');
  // Walkthrough steps: 0=Health, 1=Sport, 2=Life, 3=Pricing, 4=Privacy
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Feature preview modal state
  const [selectedFeature, setSelectedFeature] = useState<FeaturePreviewData | null>(null);

  useEffect(() => {
    if (isOpen) {
      trackOnboardingEvent('onboarding_viewed');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartWalkthrough = (initialStep = 0) => {
    triggerHaptic?.('light');
    trackOnboardingEvent('onboarding_started', {
      step_index: initialStep,
    });
    setCurrentStep(initialStep);
    setMode('walkthrough');
  };

  const handleSkip = () => {
    triggerHaptic?.('light');
    trackOnboardingEvent('onboarding_skipped', {
      step_index: currentStep,
    });
    markOnboardingCompleted(true);
    onClose();
  };

  const handleCompleteAndStart = () => {
    triggerHaptic?.('success');
    trackOnboardingEvent('onboarding_completed');
    markOnboardingCompleted(true);
    onClose();
    onStartNow();
  };

  const handleStepChange = (newStep: number) => {
    triggerHaptic?.('light');
    const categories: Array<'health' | 'sport' | 'life' | 'pricing' | 'privacy'> = [
      'health',
      'sport',
      'life',
      'pricing',
      'privacy',
    ];
    trackOnboardingEvent('category_opened', {
      category: categories[newStep],
      step_index: newStep,
    });
    setCurrentStep(newStep);
  };

  const handleOpenFeature = (feature: FeaturePreviewData) => {
    triggerHaptic?.('light');
    trackOnboardingEvent('feature_demo_opened', {
      category: feature.category,
      feature_id: feature.id,
    });
    setSelectedFeature(feature);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* ======================================================== */}
        {/* TOP BAR / NAVIGATION */}
        {/* ======================================================== */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="VitaGo"
              className="h-8 w-8 rounded-xl object-contain shadow-xs bg-slate-50"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-sm tracking-tight">VitaGo</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  AI Platform
                </span>
              </div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Health • Sport • Life
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'walkthrough' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setMode('welcome');
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Bosh sahifa
              </button>
            )}
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="O'tkazib yuborish"
            >
              <span>O'tkazib yuborish</span>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: WELCOME HERO SCREEN (BIRINCHI EKRAN) */}
        {/* ======================================================== */}
        {mode === 'welcome' && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
            {/* Hero Banner Header */}
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black tracking-wide">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                VitaGo — Health • Sport • Life
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Sog‘lom hayotingiz sari <br />
                <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  aqlli qadam.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-medium leading-relaxed">
                Sog‘lig‘ingizni nazorat qiling, sport natijalaringizni kuzating va kundalik
                hayotingizni bitta aqlli platformada boshqaring.
              </p>
            </div>

            {/* TWO PRIMARY CTAs (USER_REQUEST: Ikki asosiy CTA) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleStartWalkthrough(0)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2 group"
              >
                <Sparkles className="h-4 w-4 text-blue-200 group-hover:rotate-12 transition" />
                <span>Barcha imkoniyatlar bilan tanishish</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </button>

              <button
                type="button"
                onClick={handleCompleteAndStart}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Darhol boshlash</span>
              </button>
            </div>

            {/* 3 CORE PILLARS PREVIEW CARDS */}
            <div className="pt-3 space-y-3">
              <div className="text-center">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Uch asosiy yo'nalish
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pillar 1: Health */}
                <div
                  onClick={() => handleStartWalkthrough(0)}
                  className="rounded-2xl border border-blue-200/80 bg-linear-to-b from-blue-50/50 to-white p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black mb-3 group-hover:scale-105 transition">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center justify-between">
                    <span>Sog'liq (Health)</span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Retsept skaneri, 70% tejash, dori qidirish, AI Farmatsevt va dori eslatmalari.
                  </p>
                </div>

                {/* Pillar 2: Sport */}
                <div
                  onClick={() => handleStartWalkthrough(1)}
                  className="rounded-2xl border border-indigo-200/80 bg-linear-to-b from-indigo-50/50 to-white p-4 shadow-sm hover:shadow-md hover:border-indigo-400 transition cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black mb-3 group-hover:scale-105 transition">
                    <Compass className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center justify-between">
                    <span>Sport (Sport)</span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Jonli GPS xarita, 7 sport turi, qadamlar hisobi va interaktiv AI Murabbiy.
                  </p>
                </div>

                {/* Pillar 3: Life */}
                <div
                  onClick={() => handleStartWalkthrough(2)}
                  className="rounded-2xl border border-emerald-200/80 bg-linear-to-b from-emerald-50/50 to-white p-4 shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black mb-3 group-hover:scale-105 transition">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center justify-between">
                    <span>Life (Hayot)</span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Taom rasmini skanerlab kaloriya hisoblash, buzulmas budilnik va suv balansi.
                  </p>
                </div>
              </div>
            </div>

            {/* TRUST & METRICS BANNER */}
            <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-1">
                <div className="text-base sm:text-lg font-black text-blue-400">130+</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Rasmiy dorilar</div>
              </div>
              <div className="p-1">
                <div className="text-base sm:text-lg font-black text-emerald-400">Jonli GPS</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Sensor kuzatuvi</div>
              </div>
              <div className="p-1">
                <div className="text-base sm:text-lg font-black text-amber-400">Aqlli</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Missiyali Budilnik</div>
              </div>
              <div className="p-1">
                <div className="text-base sm:text-lg font-black text-indigo-400">-70% gacha</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Analog tejamkorligi</div>
              </div>
            </div>

            {/* Bottom footnote */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleStartWalkthrough(4)}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold underline cursor-pointer"
              >
                Maxfiylik siyosati va tibbiy ogohlantirishlar
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: INTERACTIVE WALKTHROUGH MODE (5 BOSQICH) */}
        {/* ======================================================== */}
        {mode === 'walkthrough' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Step Progress Stepper */}
            <div className="flex-shrink-0 px-4 sm:px-6 pt-3 pb-2 bg-slate-50/80 border-b border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-black text-slate-600 mb-2">
                <span>
                  {currentStep === 0 && '🩺 1. Sog‘liq — Health'}
                  {currentStep === 1 && '🏃 2. Sport — Sport'}
                  {currentStep === 2 && '🌱 3. Life — Kundalik Hayot'}
                  {currentStep === 3 && '💎 4. Tariflar — Rejalar'}
                  {currentStep === 4 && '🛡️ 5. Maxfiylik va Ishonch'}
                </span>
                <span className="text-[11px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  {currentStep + 1} / 5
                </span>
              </div>

              {/* Progress Bar / Interactive Dots */}
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((stepIdx) => (
                  <button
                    key={stepIdx}
                    type="button"
                    onClick={() => handleStepChange(stepIdx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      stepIdx === currentStep
                        ? 'bg-blue-600 ring-2 ring-blue-400/40'
                        : stepIdx < currentStep
                        ? 'bg-blue-300'
                        : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={`Bosqich ${stepIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content Container */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {/* STEP 0: HEALTH */}
              {currentStep === 0 && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                    <HeartPulse className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-blue-950">Sog‘liq bo‘limi imkoniyatlari</h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Har bir kartani bosib uning qanday ishlashi, foydasi va interaktiv
                        namunasini ko'rishingiz mumkin:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {HEALTH_FEATURES.map((feat) => (
                      <div
                        key={feat.id}
                        onClick={() => handleOpenFeature(feat)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                feat.badge === 'Ultra'
                                  ? 'bg-purple-100 text-purple-700'
                                  : feat.badge === 'Premium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {feat.badge}
                            </span>
                            <span className="text-[10px] text-blue-600 font-black group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                              Sinab ko'rish <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                          <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                            {feat.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {feat.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 1: SPORT */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                    <Compass className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-indigo-950">Sport bo‘limi imkoniyatlari</h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Hech qanday soxta hisob-kitobsiz, haqiqiy sensorlar va real GPS
                        ma'lumotlari:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SPORT_FEATURES.map((feat) => (
                      <div
                        key={feat.id}
                        onClick={() => handleOpenFeature(feat)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                feat.badge === 'Ultra'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {feat.badge}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-black group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                              Sinab ko'rish <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                          <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                            {feat.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {feat.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: LIFE */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                    <Utensils className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">Kundalik Hayot (Life)</h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Taom kaloriyasini nazorat qilish va erta uyg'onish odatlarini
                        shakllantiring:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {LIFE_FEATURES.map((feat) => (
                      <div
                        key={feat.id}
                        onClick={() => handleOpenFeature(feat)}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                feat.badge === 'Ultra'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {feat.badge}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-black group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                              Sinab ko'rish <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                          <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                            {feat.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {feat.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: PRICING COMPARISON (USER_REQUEST: Aniq real tariflar konfiguratsiyasi) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Shaffof va qulay tariflar
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Hech qanday yashirin to'lovlarsiz, ehtiyojingizga mos rejani tanlang:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* PLAN 1: FREE */}
                    <div className="rounded-2xl border border-slate-200 p-4 bg-white flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Standart
                        </div>
                        <div className="text-xl font-black text-slate-900 mt-1">0 so'm</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Doimiy bepul</div>
                        <div className="border-t border-slate-100 my-3" />
                        <ul className="space-y-2 text-xs font-medium text-slate-600">
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Retsept skaneri (3 ta/kun)
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Dori qidirish va narxlar
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Qadamlar va pedometer
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Suv monitoringi
                          </li>
                        </ul>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 text-[10px] text-slate-400 text-center font-bold">
                        Boshlang'ich reja
                      </div>
                    </div>

                    {/* PLAN 2: PREMIUM */}
                    <div className="rounded-2xl border-2 border-amber-300 p-4 bg-amber-50/20 relative flex flex-col justify-between space-y-3 shadow-md">
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider">
                        Eng ommabop
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">
                          <Crown className="h-3.5 w-3.5" />
                          Premium
                        </div>
                        <div className="text-xl font-black text-slate-900 mt-1">15 000 so'm</div>
                        <div className="text-[10px] text-amber-600 font-bold">
                          oyiga (yillik 150 000 so'm)
                        </div>
                        <div className="border-t border-amber-100 my-3" />
                        <ul className="space-y-2 text-xs font-medium text-slate-700">
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Free'dagi barcha imkoniyatlar
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            24/7 AI Farmatsevt konsultatsiyasi
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            AI Kunlik salomatlik rejalari
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Retseptlar tarixi to'liq arxiv
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Keksalar salomatligi tahlili
                          </li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic?.('light');
                          trackOnboardingEvent('subscription_started');
                          onOpenPlans();
                        }}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs cursor-pointer shadow-md transition"
                      >
                        Premium'ga o'tish
                      </button>
                    </div>

                    {/* PLAN 3: ULTRA */}
                    <div className="rounded-2xl border-2 border-purple-400 p-4 bg-purple-50/20 relative flex flex-col justify-between space-y-3 shadow-md">
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[9px] uppercase tracking-wider">
                        To'liq VIP
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          Ultra
                        </div>
                        <div className="text-xl font-black text-slate-900 mt-1">40 000 so'm</div>
                        <div className="text-[10px] text-purple-700 font-bold">
                          oyiga (yillik 450 000 so'm)
                        </div>
                        <div className="border-t border-purple-100 my-3" />
                        <ul className="space-y-2 text-xs font-medium text-slate-700">
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-purple-600" />
                            Premium'dagi barcha imkoniyatlar
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-purple-600" />
                            Haqiqiy GPS Navigator & Xarita
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-purple-600" />
                            7 xil sport rejimlari
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-purple-600" />
                            AI Murabbiy (Fitness & Yoga)
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-purple-600" />
                            Ultra Kaloriya ovqat skaneri
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-purple-600" />
                            Ultra Missiyali Buzilmas Budilnik
                          </li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic?.('light');
                          trackOnboardingEvent('subscription_started');
                          onOpenPlans();
                        }}
                        className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer shadow-md transition"
                      >
                        Ultra'ga ulanish
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PRIVACY & TRUST (USER_REQUEST: Maxfiylik va ishonch) */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2.5 text-slate-900 font-black text-sm">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <span>Xavfsizlik va Maxfiylik Kafolatlari</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="font-bold text-slate-900 block">
                          🩺 Tibbiy mas'uliyat cheklovi:
                        </span>
                        VitaGo platformasi taqdim etgan barcha tahlillar va AI tavsiyalari axborot
                        xarakteriga ega bo‘lib, professional shifokor ko‘rigi yoki davolash o‘rnini
                        bosa olmaydi.
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="font-bold text-slate-900 block">
                          🔒 Shaxsiy ma'lumotlar daxlsizligi:
                        </span>
                        Sizning salomatlik ko'rsatkichlaringiz, skanerlangan retseptlaringiz va
                        manzilingiz shifrlangan holatda saqlanadi hamda uchinchi tomonlarga hech
                        qachon berilmaydi.
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="font-bold text-slate-900 block">
                          💳 To'lovlar xavfsizligi:
                        </span>
                        Barcha obuna to'lovlari rasmiy O'zbekiston to'lov tizimlari orqali xavfsiz
                        o'tkaziladi. 14 kunlik qaytarish kafolati (Refund) amal qiladi.
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="font-bold text-slate-900 block">
                          🗑️ Profilni o'chirish huquqi:
                        </span>
                        Foydalanuvchi istalgan vaqtda shaxsiy profilini va unga biriktirilgan barcha
                        ma'lumotlarni o'chirish huquqiga ega.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Floating Navigation Dock */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 0) {
                    handleStepChange(currentStep - 1);
                  } else {
                    setMode('welcome');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Orqaga</span>
              </button>

              <div className="text-[11px] font-black text-slate-400">
                {currentStep + 1} / 5
              </div>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => handleStepChange(currentStep + 1)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Keyingi</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteAndStart}
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>🚀 Hoziroq boshlash</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Preview Modal */}
      {selectedFeature && (
        <FeaturePreviewModal
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onTryFeature={() => {
            setSelectedFeature(null);
            handleCompleteAndStart();
          }}
          triggerHaptic={triggerHaptic}
        />
      )}
    </div>
  );
};
