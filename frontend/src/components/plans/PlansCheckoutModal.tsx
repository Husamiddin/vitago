import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  Crown,
  CreditCard,
  ShieldCheck,
  Clock,
  ArrowRight,
  Upload,
  RefreshCw,
  Tag,
  AlertCircle,
  Zap,
} from 'lucide-react';
import type { PlanInfo, UserProfile } from '../../types/api';
import { checkPromoCode, checkoutPlan, confirmPaymentSent, getPaymentStatus } from '../../services/apiClient';

interface PlansCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onPlanActivated: (updatedUser: UserProfile) => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const PlansCheckoutModal: React.FC<PlansCheckoutModalProps> = ({
  isOpen,
  onClose,
  user,
  onPlanActivated,
  triggerHaptic,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'ultra'>('premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const [step, setStep] = useState<'select' | 'card_info' | 'transfer' | 'timer'>('select');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(() => (user ? `${user.first_name} ${user.last_name || ''}`.trim() : ''));
  const [cvc, setCvc] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Transfer & confirmation
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [receiverCard, setReceiverCard] = useState('1234 5678 1234 5678');
  const [receiverName, setReceiverName] = useState('Aminov H');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Timer & polling
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-detect card type
  const cleanCard = cardNumber.replace(/\D/g, '');
  const isUzcard = cleanCard.startsWith('8600') || cleanCard.startsWith('5614');
  const isHumo = cleanCard.startsWith('9860');
  const isVisa = cleanCard.startsWith('4');
  const isMastercard = cleanCard.startsWith('5');

  const cardTypeLabel = isUzcard
    ? 'Uzcard 🇺🇿'
    : isHumo
    ? 'Humo 🇺🇿'
    : isVisa
    ? 'Visa 💳'
    : isMastercard
    ? 'Mastercard 💳'
    : 'Bank Kartasi';

  // Base pricing matching updated plan standards (Premium: 15k/150k, Ultra: 40k/450k)
  const basePrice =
    selectedPlan === 'premium'
      ? billingCycle === 'annually'
        ? 150000
        : 15000
      : billingCycle === 'annually'
      ? 450000
      : 40000;

  const finalPrice = Math.max(0, basePrice - promoDiscount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await checkPromoCode(promoCode.trim(), selectedPlan, billingCycle);
      if (res.valid) {
        setPromoDiscount(res.discount_uzs);
        setPromoMessage(res.message);
        triggerHaptic?.('success');
      } else {
        setPromoDiscount(0);
        setPromoMessage(res.message);
      }
    } catch {
      setPromoMessage("Promo-kod tekshirishda xatolik.");
    }
  };

  const handleGoToCardInfo = () => {
    setErrorMsg(null);
    setStep('card_info');
    triggerHaptic?.('light');
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanCard.length < 16) {
      setErrorMsg("Karta raqami kamida 16 ta raqam bo'lishi kerak.");
      return;
    }
    if (isVisa && cvc.length < 3) {
      setErrorMsg("Visa kartasi uchun 3 xonali CVC kodini kiriting.");
      return;
    }
    setErrorMsg(null);

    try {
      const res = await checkoutPlan(
        {
          plan: selectedPlan,
          billing_cycle: billingCycle,
          card_number: cleanCard,
          card_holder: cardHolder,
          cvc: isVisa ? cvc : undefined,
          promo_code: promoCode || undefined,
          user_phone: user?.phone,
        },
        user?.token || ''
      );
      setPaymentId(res.payment_id);
      setReceiverCard(res.receiver_card);
      setReceiverName(res.receiver_name);
      setStep('transfer');
      triggerHaptic?.('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "To'lov arizasini yaratishda xatolik.");
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      triggerHaptic?.('light');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSent = async () => {
    if (!paymentId) return;
    setIsVerifying(true);
    setSecondsLeft(60);
    setStep('timer');
    triggerHaptic?.('light');

    try {
      if (user) {
        await confirmPaymentSent(paymentId, receiptImage, user.token);
      }
    } catch {
      // ignore
    }
  };

  // Timer countdown & polling effect
  useEffect(() => {
    if (step !== 'timer' || !paymentId) return;

    // If user is already on Ultra or selected plan, activate immediately
    if (user?.plan === 'ultra' || user?.plan === selectedPlan) {
      triggerHaptic?.('success');
      onPlanActivated({
        ...user,
        plan: selectedPlan,
      });
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          triggerHaptic?.('success');
          const finalProfile = user
            ? { ...user, plan: selectedPlan }
            : {
                id: 1,
                phone: '+998872207844',
                first_name: 'Husamiddin',
                last_name: 'Aminov',
                gender: 'male' as const,
                age: 14,
                height_cm: 176,
                weight_kg: 65,
                token: 'doriscan_session_token',
                is_profile_complete: true,
                plan: selectedPlan,
                streak_count: 1,
                daily_steps: 0,
                daily_target_steps: 6000,
                daily_water_ml: 2000,
                daily_kcal: 0,
                alarm_enabled: false,
              };
          onPlanActivated(finalProfile);
          onClose();
          alert(`Tabriklaymiz! To'lovingiz tasdiqlandi va ${selectedPlan.toUpperCase()} rejasi muvaffaqiyatli faollashtirildi!`);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const poller = setInterval(async () => {
      try {
        const token = user?.token || '';
        const statusRes = await getPaymentStatus(paymentId, token);
        if (statusRes.is_approved) {
          clearInterval(timer);
          clearInterval(poller);
          triggerHaptic?.('success');
          if (user) {
            onPlanActivated({
              ...user,
              plan: (statusRes.user_plan as any) || selectedPlan,
            });
          }
          onClose();
          alert(`Tabriklaymiz! ${statusRes.plan.toUpperCase()} rejasi muvaffaqiyatli faollashtirildi!`);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [step, paymentId, user, selectedPlan, onPlanActivated, onClose, triggerHaptic]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-300" />
            <h3 className="text-base sm:text-lg font-black">VitaGo Pullik Rejalari</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: SELECT PLAN */}
        {step === 'select' && (
          <div className="p-5 space-y-4">
            {user?.plan === 'ultra' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-2 border-amber-400 text-slate-800 text-xs font-bold flex items-center gap-2.5">
                <Crown className="h-5 w-5 text-amber-600 shrink-0 fill-amber-500" />
                <div className="flex-1">
                  <div className="font-black text-amber-900">Siz allaqachon ULTRA rejasidasiz! 🎉</div>
                  <div className="text-[11px] text-slate-600 font-normal mt-0.5">
                    Barcha imkoniyatlar (VitaGo ⚡ Sport GPS, AI Ovozli Farmatsevt, 4x tezlik, Salomatlik, Ovqat skaneri, Ovozli Budilnik) 100% ochiq.
                  </div>
                </div>
              </div>
            )}

            {/* Billing Cycle Switcher */}
            <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Oylik to'lov
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annually')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                  billingCycle === 'annually' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                <span>Yillik to'lov</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                  -30 000 so'm
                </span>
              </button>
            </div>

            {/* Plan Cards */}
            <div className="space-y-3">
              {/* PREMIUM */}
              <div
                onClick={() => setSelectedPlan('premium')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                  selectedPlan === 'premium'
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                      💎
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Premium Plan</h4>
                      <p className="text-[11px] text-slate-500">Shaxsiy AI farmatsevt va salomatlik</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-700">
                      {billingCycle === 'annually' ? '150 000' : '15 000'} so'm
                    </div>
                    <span className="text-[10px] text-slate-400">/{billingCycle === 'annually' ? 'yil' : 'oy'}</span>
                  </div>
                </div>

                {billingCycle === 'annually' && (
                  <div className="mt-2 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 p-2 rounded-xl">
                    🎁 Yillik to'lovda 30 000 so'm chegirma (150 000 so'm/yil)!
                  </div>
                )}

                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span><b>Cheksiz AI retsept skaneri</b></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span><b>24/7 AI Farmatsevt konsultatsiyasi</b> (yozma va ovozli)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span><b>Shaxsiy kunlik salomatlik rejasi</b></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span><b>Oila a'zolari profili</b></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span><b>Kunlik qadamlar va Olovcha (streak)</b> hisobi</span>
                  </li>
                </ul>
              </div>

              {/* ULTRA */}
              <div
                onClick={() => setSelectedPlan('ultra')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                  selectedPlan === 'ultra'
                    ? 'border-purple-500 bg-purple-50/40 shadow-md ring-2 ring-purple-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900">Ultra Plan</h4>
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-md">
                          Maksimal
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Sport, budilnik va to'liq nazorat</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-purple-700">
                      {billingCycle === 'annually' ? '450 000' : '40 000'} so'm
                    </div>
                    <span className="text-[10px] text-slate-400">/{billingCycle === 'annually' ? 'yil' : 'oy'}</span>
                  </div>
                </div>

                {billingCycle === 'annually' && (
                  <div className="mt-2 text-[11px] font-bold text-purple-800 bg-purple-100/70 p-2 rounded-xl">
                    🎁 Yillik to'lovda 30 000 so'm chegirma (450 000 so'm/yil)!
                  </div>
                )}

                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span><b>Barcha Premium imkoniyatlari</b></span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span><b>Aqlli Budilnik & Matematik missiya</b> (o'chirib bo'lmas budilnik)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span><b>Taom suratidan kaloriya tahlili</b> (oqsil, yog', uglevod)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span><b>VitaGo Sport & GPS Navigator:</b> 7 xil sport turi, real vaqt marshruti va AI murabbiy</span>
                  </li>
                </ul>
              </div>
            </div>

            {user?.plan === 'ultra' ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('success');
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="h-4 w-4 fill-white" />
                <span>Sizda allaqachon Ultra faol (Yopish)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoToCardInfo}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{selectedPlan.toUpperCase()} Rejasini sotib olish</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* STEP 2: CARD DETAILS & PROMO */}
        {step === 'card_info' && (
          <form onSubmit={handleProcessCheckout} className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b">
              <span>Tanlangan reja:</span>
              <span className="font-black text-slate-900 uppercase">
                {selectedPlan} ({billingCycle}) • {finalPrice.toLocaleString()} so'm
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Bank Karta Raqami</label>
                <span className="text-[11px] font-black text-emerald-700">{cardTypeLabel}</span>
              </div>
              <div className="relative">
                <CreditCard className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="8600 0000 0000 0000"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-300 font-mono text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none tracking-wider"
                />
              </div>
            </div>

            {isVisa && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CVC / CVV Kodi (Visa)</label>
                <input
                  type="password"
                  required
                  placeholder="123"
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-32 px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Karta Egasining Ism va Familiyasi</label>
              <input
                type="text"
                required
                placeholder="HUSAMIDDIN AMINOV"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 rounded-2xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Promo Code Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Promo-kod (Mavjud bo'lsa)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="PROMO KOD"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Qo'llash
                </button>
              </div>
              {promoMessage && (
                <p className={`text-[11px] mt-1 font-semibold ${promoDiscount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Orqaga
              </button>
              <button
                type="submit"
                className="flex-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                To'lashga o'tish ({finalPrice.toLocaleString()} so'm)
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: TRANSFER INSTRUCTIONS & CHEK UPLOAD */}
        {step === 'transfer' && (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-800">To'lov uchun karta ma'lumotlari:</span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-wider">
                    {receiverCard}
                  </div>
                  <div className="text-xs font-bold text-slate-600">{receiverName}</div>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800">
                  {finalPrice.toLocaleString()} so'm
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-snug">
                Iltimos, ilovangiz orqali (Payme, Click, Anorbank va h.k.) ushbu kartaga pulni o'tkazing va pastdagi <b>"Tashladim"</b> tugmasini bosing.
              </p>
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">To'lov cheki skrinshoti (ixtiyoriy)</label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-500 bg-slate-50 cursor-pointer transition">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-600">
                  {receiptImage ? "Chek tanlandi (o'zgartirish uchun bosing)" : "Chek rasmini yuklash"}
                </span>
                <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleConfirmSent}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="h-5 w-5" />
              <span>Tashladim (To'lovni tasdiqlash)</span>
            </button>
          </div>
        )}

        {/* STEP 4: 1-MINUTE TIMER & REAL-TIME VERIFICATION */}
        {step === 'timer' && (
          <div className="p-6 text-center space-y-4">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-500 shadow-xl">
              <span className="text-2xl font-black text-emerald-700 font-mono">{secondsLeft}s</span>
              <Clock className="h-5 w-5 text-emerald-600 absolute -top-1 -right-1" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900">To'lov tekshirilmoqda...</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Admin to'lovni 1 daqiqa ichida tekshiradi va rejangiz darhol faollashadi. Iltimos, ushbu oynani yopmay turing.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-bold">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Server bilan tekshiruv davom etmoqda...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
