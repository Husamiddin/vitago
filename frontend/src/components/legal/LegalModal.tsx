import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  HelpCircle,
  BarChart3,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  CreditCard,
  Zap,
} from 'lucide-react';

export type LegalModalTab =
  | 'how_it_works'
  | 'pricing'
  | 'stats'
  | 'faq'
  | 'terms'
  | 'privacy'
  | 'refund';

interface LegalModalProps {
  isOpen: boolean;
  activeTab: LegalModalTab;
  onClose: () => void;
  onOpenPlans: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onOpenPlans,
}) => {
  const [currentTab, setCurrentTab] = useState<LegalModalTab>(activeTab);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  if (!isOpen) return null;

  const tabLabels: { id: LegalModalTab; label: string }[] = [
    { id: 'how_it_works', label: 'Qanday ishlaydi' },
    { id: 'pricing', label: 'Narxlar' },
    { id: 'stats', label: 'Statistika' },
    { id: 'faq', label: 'Savol-javob' },
    { id: 'terms', label: 'Foydalanish shartlari' },
    { id: 'privacy', label: 'Maxfiylik siyosati' },
    { id: 'refund', label: 'Pul qaytarish' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              {currentTab === 'how_it_works' && <Info className="h-5 w-5 text-blue-100" />}
              {currentTab === 'pricing' && <CreditCard className="h-5 w-5 text-blue-100" />}
              {currentTab === 'stats' && <BarChart3 className="h-5 w-5 text-blue-100" />}
              {currentTab === 'faq' && <HelpCircle className="h-5 w-5 text-blue-100" />}
              {currentTab === 'terms' && <FileText className="h-5 w-5 text-blue-100" />}
              {currentTab === 'privacy' && <Lock className="h-5 w-5 text-blue-100" />}
              {currentTab === 'refund' && <RefreshCw className="h-5 w-5 text-blue-100" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {currentTab === 'how_it_works' && "VitaGo Qanday Ishlaydi?"}
                {currentTab === 'pricing' && "Tariflar va To'lov Narxlari"}
                {currentTab === 'stats' && "Platforma Statistikasi"}
                {currentTab === 'faq' && "Ko'p Beriladigan Savol-Javoblar"}
                {currentTab === 'terms' && "Foydalanish Shartlari (Oferta)"}
                {currentTab === 'privacy' && "Maxfiylik Siyosati & Bank Xavfsizligi"}
                {currentTab === 'refund' && "Pul Qaytarish Kafolati (Refund Policy)"}
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                YaTT GULNOZA QULDASHEVA KOMILOVNA • vitago.uz
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Horizontal Navigation Pills (Exact 7 sections from Image 2) */}
        <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {tabLabels.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCurrentTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                currentTab === t.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* 1. QANDAY ISHLAYDI */}
          {currentTab === 'how_it_works' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                <span className="font-black text-sm block">💡 3 ta oddiy qadamda 70% gacha tejash:</span>
                <p className="text-xs text-blue-800">
                  VitaGo sun'iy intellekti qimmat brend dorilarning xalqaro patentlanmagan faol moddasini (XPN / INN) aniqlab, O'zbekistondagi hamyonbop va sifatli analoglarini taqdim etadi.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Retseptni Suratga Oling</h4>
                  <p className="text-[11px] text-slate-500">
                    Shifokor qo'lyozmasi yoki dori qutisi rasmini yuklang yoki nomini qidiring.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">AI Tahlili</h4>
                  <p className="text-[11px] text-slate-500">
                    Gemini AI xalqaro patentlanmagan faol moddani (XPN) va dozani bir zumda aniqlaydi.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Arzon Analoglar</h4>
                  <p className="text-[11px] text-slate-500">
                    O'zbekistonda ishlab chiqarilgan, bir xil ta'sirga ega, 50-70% arzon dorilarni tanlang.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. NARXLAR (TARIFLAR) */}
          {currentTab === 'pricing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm">Shaffof va qulay narxlar</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Har bir foydalanuvchi uchun moslashuvchan tariflar rejasi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPlans();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition cursor-pointer shrink-0"
                >
                  Obunani tanlash
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="text-xs font-bold text-slate-500">Standart</div>
                  <div className="text-lg font-black text-slate-900">0 so'm</div>
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    <li>✓ Kuniga 3 ta retsept skanerlash</li>
                    <li>✓ Baza bo'yicha analoglar qidirish</li>
                    <li>✓ O'zbekiston dori narxlari</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border-2 border-blue-500 shadow-sm space-y-2 relative">
                  <span className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    Tavsiya
                  </span>
                  <div className="text-xs font-bold text-blue-700">Premium</div>
                  <div className="text-lg font-black text-slate-900">15 000 so'm/oy</div>
                  <div className="text-[10px] text-emerald-600 font-bold">Yillik: 150 000 so'm/yil (-30 000 chegirma)</div>
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    <li>✓ Cheksiz AI retsept skaneri</li>
                    <li>✓ 24/7 AI Farmatsevt konsultatsiyasi</li>
                    <li>✓ Shaxsiy kunlik salomatlik rejasi</li>
                    <li>✓ Oila a'zolari profili</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-linear-to-b from-amber-50/60 to-orange-50/40 border-2 border-amber-400 shadow-sm space-y-2 relative">
                  <span className="absolute -top-2.5 right-3 bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    Maksimal
                  </span>
                  <div className="text-xs font-bold text-amber-800">⚡ Ultra</div>
                  <div className="text-lg font-black text-slate-900">40 000 so'm/oy</div>
                  <div className="text-[10px] text-amber-700 font-bold">Yillik: 450 000 so'm/yil (-30 000 chegirma)</div>
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    <li>✓ Barcha Premium imkoniyatlari</li>
                    <li>✓ Aqlli Budilnik & Matematik missiya</li>
                    <li>✓ Taom suratidan kaloriya tahlili</li>
                    <li>✓ Sport GPS Navigator & Klublar</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 3. STATISTIKA */}
          {currentTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                  <div className="text-xl sm:text-2xl font-black text-blue-700">137+</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">Dori Vositalari</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-700">72%</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">O'rtacha Tejash</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                  <div className="text-xl sm:text-2xl font-black text-indigo-700">30+</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">XPN Guruhlari</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-center">
                  <div className="text-xl sm:text-2xl font-black text-teal-700">52+</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">Mahalliy Ishlab Chiqaruvchi</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block text-xs">
                  📊 O'zbekiston bo'yicha tejalgan mablag':
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Har bir foydalanuvchi bir retseptdan o'rtacha <b>85 000 so'mdan 320 000 so'mgacha</b> mablag' tejab qoladi. Sifatli mahalliy analoglar xalqaro GMP standartlari asosida sertifikatlangan.
                </p>
              </div>
            </div>
          )}

          {/* 4. SAVOL-JAVOB (FAQ) */}
          {currentTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">1. Arzon analog asl dorining o'rnini bosa oladimi?</span>
                <p className="text-xs text-slate-600">
                  Ha, 100%! Analog dorilar xuddi o'sha faol kimyoviy moddadan (XPN) va bir xil dozada tayyorlanadi. Brend dorilarning qimmatligi faqat chet eldan import bojxona to'lovlari va katta reklama xarajatlari bilan bog'liq.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">2. Shifokor ruxsatisiz dorini almashtirish mumkinmi?</span>
                <p className="text-xs text-slate-600">
                  VitaGo faqat bir xil ta'sir etuvchi moddaga ega dorilarni tavsiya qiladi. Biroq dorixonada harid qilishdan oldin dorixonachi yoki shifokoringiz bilan maslahatlashish tavsiya etiladi.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">3. Pullik tariflar (Premium & Ultra) nima beradi?</span>
                <p className="text-xs text-slate-600">
                  24/7 AI Farmatsevt ovozli suhbati, shaxsiy moslashuvchan kunlik salomatlik va qadam rejasi, ovqat kaloriyasini suratdan hisoblash hamda o'chirib bo'lmaydigan aqlli kamera-budilnik imkoniyatlarini beradi.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">4. To'lov qanday amalga oshiriladi?</span>
                <p className="text-xs text-slate-600">
                  O'zbekistondagi barcha bank kartalari (Uzcard / Humo) orqali xavfsiz to'lov tizimi orqali to'lanadi. Admin 1 daqiqada tekshirib obunani faollashtiradi.
                </p>
              </div>
            </div>
          )}

          {/* 5. FOYDALANISH SHARTLARI (OFERTA) */}
          {currentTab === 'terms' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  OMMAVIY OFERTA SHARTNOMASI
                </h4>
                <p className="text-slate-500 font-bold">
                  Ijrochi: YaTT GULNOZA QULDASHEVA KOMILOVNA • STIR: 584920194
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-200 text-slate-600 leading-relaxed">
                  <p>
                    <b>1. Umumiy qoidalar:</b> Mazkur ommaviy oferta VitaGo axborot platformasidan (vitago.uz va mobil ilovadan) foydalanish shartlarini belgilaydi. Platformadan foydalanish shartlarga to'liq rozilikni bildiradi.
                  </p>
                  <p>
                    <b>2. Xizmat maqsadi:</b> VitaGo dori vositalari, ularning faol moddalari (XPN) va taxminiy narxlari bo'yicha axborot-tahliliy ma'lumot taqdim etuvchi dasturiy ta'minotdir. VitaGo to'g'ridan-to'g'ri dori savdosi bilan shug'ullanmaydi.
                  </p>
                  <p>
                    <b>3. Tibbiy ogohlantirish:</b> Taqdim etilayotgan barcha ma'lumotlar tanishish va maslahat xarakteriga ega. Har qanday dori vositasini qabul qilishdan oldin davolovchi shifokor ko'rsatmasiga amal qilinishi shart.
                  </p>
                  <p>
                    <b>4. Tomonlarning majburiyatlari:</b> Ijrochi tizimning uzluksiz ishlashini ta'minlaydi. Foydalanuvchi tizimga noqonuniy kirish yoki xizmat faoliyatiga to'sqinlik qilmaslik majburiyatini oladi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. MAXFIYLIK SIYOSATI & BANK KARTASI PCI-DSS */}
          {currentTab === 'privacy' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>FOYDALANUVCHI MA'LUMOTLARI VA TO'LOVLAR XAVFSIZLIGI</span>
                </h4>
                <p className="text-slate-500 font-bold">
                  YaTT GULNOZA QULDASHEVA KOMILOVNA kafolati
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-200 text-slate-600 leading-relaxed">
                  <p>
                    <b>1. To'planadigan ma'lumotlar:</b> Ro'yxatdan o'tishda telefon raqam, ism-familiya va foydalanuvchi ixtiyoriy kiritgan biologik parametrlar (yosh, bo'y, vazn) saqlanadi.
                  </p>
                  <p>
                    <b>2. Ma'lumotlardan foydalanish:</b> Barcha kiritilgan ma'lumotlar faqatgina foydalanuvchiga to'g'ri dori dozasi va moslashuvchan salomatlik rejasini hisoblash maqsadida ishlatiladi.
                  </p>
                  <p>
                    <b>3. Uchinchi shaxslarga berilmaslik:</b> Foydalanuvchi ma'lumotlari hech qanday uchinchi shaxslarga, reklama agentliklariga yoki tashqi tashkilotlarga sotilmaydi va oshkor qilinmaydi.
                  </p>
                  <p>
                    <b>4. Shifrlash:</b> Barcha ma'lumotlar SSL 256-bitli xavfsiz shifrlangan kanallar orqali uzatiladi.
                  </p>
                  <p className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold mt-2">
                    <b>5. Ilova Xavfsizligi va Tozalik Kafolati:</b> VitaGo mobil dasturi mutlaqo xavfsiz (100% rasmiy) bo'lib, unda hech qanday virus, xakerlik yoki begona josuslik kodi mavjud emas. Telefoningizga o'rnatish paytidagi ogohlantirish shunchaki tizimga ilova shaklida o'rnatish haqidagi standart texnik eslatmadir.
                  </p>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-medium mt-2 space-y-1">
                    <b className="text-blue-900 block font-black">6. Bank Kartasi Ma'lumotlari Xavfsizligi va Maxfiyligi (PCI-DSS):</b>
                    <p>
                      • VitaGo ilovasi foydalanuvchilarning bank karta raqamlari (PAN), amal qilish muddati yoki maxfiy CVV/CVC kodlarini o'z serverlarida <b>MUTLAQO SAQLAMAYDI</b> va ularni ko'ra olmaydi.<br />
                      • Barcha to'lov amaliyotlari O'zbekiston Respublikasi Markaziy Banki litsenziyasiga ega rasmiy to'lov tizimlari (Click, Payme, Uzum Bank) orqali xalqaro <b>PCI-DSS Level 1</b> xavfsizlik standarti va <b>256-bitli SSL/TLS shifrlash</b> himoyasi ostida amalga oshiriladi.<br />
                      • To'lov ma'lumotlari to'liq konfidentsial bo'lib, xakerlik yoki ruxsatsiz yechib olish xavfidan 100% himoyalangan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. PUL QAYTARISH SIYOSATI (REFUND) */}
          {currentTab === 'refund' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <h4 className="font-black text-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-amber-700" />
                  <span>100% TO'LOVNI QAYTARISH KAFOLATI (REFUND)</span>
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Agar siz VitaGo Premium yoki Ultra tarifini sotib olganingizdan so'ng xizmatlar yoki funksiyalar <b>Ko'rsatilgandek ishlamasa</b>, <b>14 kun ichida</b> murojaat qilganingizda to'langan mablag'ingiz <b>100% to'liq qaytarib beriladi</b>!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700 leading-relaxed">
                <span className="font-extrabold text-slate-900 block">Pulni qaytarish tartibi:</span>
                <p>
                  1. Telegram orqali <b>@VitaGoApp_bot</b> ga yoki qo'llab-quvvatlash xizmatiga to'lov cheki va telefon raqamingizni yuborasiz.<br />
                  2. Murojaat 24 soat ichida ko'rib chiqiladi va tasdiqlanadi.<br />
                  3. Mablag' to'lov amalga oshirilgan bank kartangizga (Uzcard / Humo) 1-3 ish kunida to'liq qaytariladi.<br />
                  4. Hech qanday asossiz ushlab qolishlar yoki yashirin komissiyalar mavjud emas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Yopish
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPlans();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-black text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tariflarni Ko'rish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
