import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Phone,
  ShieldCheck,
  Send,
  Sparkles,
  Camera,
  Activity,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import type { TranslationDict } from '../../i18n/translations';
import type { SupportedLang, UserProfile } from '../../types/api';
import { requestOtp, verifyOtp, updateProfile } from '../../services/apiClient';

interface AuthGateModalProps {
  t: TranslationDict;
  lang: SupportedLang;
  isOpen: boolean;
  onAuthSuccess: (user: UserProfile) => void;
  onClose?: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

type AuthStep = 1 | 2 | 3 | 4;
type CountryCode = 'UZ' | 'RU';

interface CountryDef {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  digitsLen: number;
  placeholder: string;
  format: (digits: string) => string;
}

const COUNTRIES: Record<CountryCode, CountryDef> = {
  UZ: {
    code: 'UZ',
    name: "O'zbekiston",
    dialCode: '+998',
    flag: '🇺🇿',
    digitsLen: 9,
    placeholder: '90 123 45 67',
    format: (raw: string) => {
      const d = raw.slice(0, 9);
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
      if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
    },
  },
  RU: {
    code: 'RU',
    name: 'Россия',
    dialCode: '+7',
    flag: '🇷🇺',
    digitsLen: 10,
    placeholder: '912 345 67 89',
    format: (raw: string) => {
      const d = raw.slice(0, 10);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
    },
  },
};

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  t,
  lang,
  isOpen,
  onAuthSuccess,
  onClose,
  triggerHaptic,
}) => {
  const [step, setStep] = useState<AuthStep>(1);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState<CountryCode>('UZ');
  const [phoneDigits, setPhoneDigits] = useState('');

  // OTP State
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  // Profile questionnaire
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('25');
  const [heightCm, setHeightCm] = useState<string>('175');
  const [weightKg, setWeightKg] = useState<string>('70');

  // Avatar & Completed User
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-fill from Telegram WebApp if opened in Telegram
  useEffect(() => {
    const twaUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (twaUser?.first_name) {
      setFirstName(twaUser.first_name);
    }
    if (twaUser?.last_name) {
      setLastName(twaUser.last_name);
    }
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handlePhoneDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    const cfg = COUNTRIES[country];
    // Strip dial code if user pasted with country prefix
    if (country === 'UZ' && val.startsWith('998')) {
      val = val.slice(3);
    } else if (country === 'RU' && (val.startsWith('7') || val.startsWith('8'))) {
      val = val.slice(1);
    }
    // Strictly block typing more digits than allowed!
    if (val.length > cfg.digitsLen) {
      val = val.slice(0, cfg.digitsLen);
    }
    setPhoneDigits(val);
    setErrorMsg(null);
  };

  const fullPhone = `${COUNTRIES[country].dialCode}${phoneDigits}`;

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName.trim()) {
      setErrorMsg(lang === 'ru' ? 'Введите ваше имя' : 'Iltimos, ismingizni kiriting');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg(
        lang === 'ru'
          ? 'Пожалуйста, подтвердите согласие с Условиями и Политикой конфиденциальности'
          : 'Iltimos, davom etish uchun Foydalanish shartlari va Maxfiylik siyosatiga rozilik bildiring.'
      );
      return;
    }
    const cfg = COUNTRIES[country];
    if (phoneDigits.length !== cfg.digitsLen) {
      setErrorMsg(
        country === 'UZ'
          ? "O'zbekiston raqami uchun roppa-rosa 9 ta raqam kiritilishi shart (masalan: 90 123 45 67)."
          : 'Российский номер должен содержать ровно 10 цифр (например: 912 345 67 89).'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const tgChatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      await requestOtp(fullPhone, firstName.trim(), lastName.trim(), tgChatId);
      setStep(2);
      setResendTimer(60);
      triggerHaptic?.('light');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.trim().length !== 6) {
      setErrorMsg(lang === 'ru' ? 'Введите 6-значный код' : '6 xonali tasdiqlash kodini kiriting');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const tgChatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const user = await verifyOtp(fullPhone, code.trim(), firstName.trim(), lastName.trim(), tgChatId);
      setCurrentUser(user);
      triggerHaptic?.('success');

      if (user.is_profile_complete) {
        // Already filled medical profile
        setCurrentUser(user);
        setStep(4);
      } else {
        // Go to Step 3 (Medical Questionnaire)
        setStep(3);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMedicalProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser?.token) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const ageNum = parseInt(age, 10) || 25;
      const heightNum = parseInt(heightCm, 10) || 175;
      const weightNum = parseInt(weightKg, 10) || 70;

      const updated = await updateProfile(currentUser.token, {
        gender,
        age: ageNum,
        height_cm: heightNum,
        weight_kg: weightNum,
      });
      setCurrentUser(updated);
      triggerHaptic?.('success');
      setStep(4);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setAvatarData(b64);
      if (currentUser?.token) {
        try {
          const updated = await updateProfile(currentUser.token, { avatar_data: b64 });
          setCurrentUser(updated);
          triggerHaptic?.('success');
        } catch {
          // ignore
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinishAndEnter = () => {
    if (currentUser) {
      onAuthSuccess(currentUser);
      triggerHaptic?.('success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto sm:my-6 overflow-hidden rounded-3xl bg-white shadow-2xl border border-emerald-100 flex flex-col">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 sm:px-6 py-4 sm:py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
              <span>VitaGo ID</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-emerald-100">
                {step}/4 {lang === 'ru' ? 'Шаг' : 'Bosqich'}
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                  title="Yopish"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <h2 className="mt-2 text-lg sm:text-2xl font-black">{t.authGateTitle}</h2>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {t.authGateSubtitle}
          </p>

          {/* Progress Indicator */}
          <div className="mt-3.5 grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  step >= s ? 'bg-white' : 'bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-3.5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-medium text-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {/* STEP 1: Name & Phone */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.authStep1Title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.step1Subtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.firstNameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t.firstNamePlaceholder}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 pl-10 pr-3 py-2.5 text-base sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.lastNameLabel}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t.lastNamePlaceholder}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50/60 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.phoneLabel} <span className="text-rose-500">*</span>
                  </label>
                  {/* Country Code Toggle (Uzbekistan 9 digits / Russia 10 digits) */}
                  <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setCountry('UZ');
                        setPhoneDigits('');
                        setErrorMsg(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        country === 'UZ' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🇺🇿</span>
                      <span>+998</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCountry('RU');
                        setPhoneDigits('');
                        setErrorMsg(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        country === 'RU' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🇷🇺</span>
                      <span>+7</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center rounded-2xl border-2 border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition overflow-hidden">
                  <div className="flex items-center gap-1.5 bg-slate-100/90 px-3.5 py-2.5 border-r border-slate-200 text-sm font-black text-slate-800 select-none shrink-0">
                    <span>{COUNTRIES[country].flag}</span>
                    <span>{COUNTRIES[country].dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={COUNTRIES[country].format(phoneDigits)}
                    onChange={handlePhoneDigitsChange}
                    placeholder={COUNTRIES[country].placeholder}
                    className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base font-bold text-slate-900 focus:outline-none tracking-wider"
                  />
                  <div className="pr-3 text-[11px] font-bold text-slate-400 select-none shrink-0">
                    {phoneDigits.length === COUNTRIES[country].digitsLen ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-extrabold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{phoneDigits.length}/{COUNTRIES[country].digitsLen}</span>
                      </span>
                    ) : (
                      <span>{phoneDigits.length}/{COUNTRIES[country].digitsLen}</span>
                    )}
                  </div>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {country === 'UZ'
                      ? "O'zbekiston raqamlari uchun aynan 9 ta raqam kiritiladi."
                      : 'Российские номера содержат ровно 10 цифр.'}
                  </span>
                </p>
              </div>

              {/* Shartlar va Maxfiylik siyosatiga rozilik */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 shrink-0"
                  />
                  <span className="text-[11px] leading-snug text-slate-600 group-hover:text-slate-800">
                    <span className="font-semibold text-slate-800">Foydalanish shartlari</span> va{' '}
                    <span className="font-semibold text-slate-800">Maxfiylik siyosati</span> hamda bank kartasi xavfsizligiga roziman.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneDigits.length !== COUNTRIES[country].digitsLen || !agreedToTerms}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t.sendingCode}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{t.getCodeBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-Digit Verification Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.authStep2Title}</h3>
                <div className="mt-2.5 rounded-2xl bg-sky-50 border border-sky-200 p-3.5 text-xs text-sky-950 leading-relaxed space-y-2.5">
                  <p className="font-semibold text-sky-900">{t.step2Subtitle}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sky-200/80">
                    <span className="font-bold text-sky-800">
                      📱 Raqam: <b>{fullPhone}</b>
                    </span>
                    <a
                      href={`https://t.me/VitaGoApp_bot?start=otp_${fullPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-sky-700 transition"
                    >
                      <span>✈️ Kodni Telegram'da olish</span>
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  Telegram'dagi 6 xonali tasdiqlash kodini kiriting
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-300"
                />
                <p className="mt-1.5 text-center text-[11px] text-slate-500">
                  Kod @VitaGoApp_bot chatiga yuborildi. Kod kelmagan bo'lsa, botga kirib /start bosing.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>
                  {resendTimer > 0 ? (
                    `Qayta yuborish: ${resendTimer}s`
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      className="text-emerald-700 font-bold underline cursor-pointer hover:text-emerald-800"
                    >
                      {t.resendCodeBtn}
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCode('');
                    setErrorMsg(null);
                  }}
                  className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Raqamni o‘zgartirish
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t.verifyingCode}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t.verifyCodeBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Medical & Physical Questionnaire */}
          {step === 3 && (
            <form onSubmit={handleSaveMedicalProfile} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.authStep3Title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.step3Subtitle}</p>
              </div>

              {/* Gender selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.genderLabel}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('male');
                      triggerHaptic?.('light');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 font-bold text-sm cursor-pointer transition ${
                      gender === 'male'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.genderMale}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGender('female');
                      triggerHaptic?.('light');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 font-bold text-sm cursor-pointer transition ${
                      gender === 'female'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.genderFemale}</span>
                  </button>
                </div>
              </div>

              {/* Age, Height, Weight inputs */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.ageLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t.agePlaceholder}
                    className="w-full text-center rounded-2xl border border-slate-300 bg-slate-50/60 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.heightLabel}
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="250"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder={t.heightPlaceholder}
                    className="w-full text-center rounded-2xl border border-slate-300 bg-slate-50/60 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.weightLabel}
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="300"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder={t.weightPlaceholder}
                    className="w-full text-center rounded-2xl border border-slate-300 bg-slate-50/60 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-start gap-2">
                <Activity className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Bo‘y va vazn ko‘rsatkichlari dori dozalarini shifokor tavsiyasiga ko‘ra to‘g‘ri taqqoslash va
                  xavfli qarshi ko‘rsatmalarni tekshirish uchun zarur.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>{t.saveProfileBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Personal Profile & Avatar Photo */}
          {step === 4 && (
            <div className="space-y-5 text-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">{t.authStep4Title}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.step4Subtitle}</p>
              </div>

              {/* Avatar Photo Upload */}
              <div className="flex flex-col items-center justify-center">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />

                <div className="relative group">
                  <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-emerald-500 bg-slate-100 flex items-center justify-center shadow-lg">
                    {avatarData || currentUser?.avatar_data ? (
                      <img
                        src={avatarData || currentUser?.avatar_data || ''}
                        alt="Profile avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-emerald-700">
                        {firstName.charAt(0).toUpperCase()}
                        {lastName ? lastName.charAt(0).toUpperCase() : ''}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-emerald-600 text-white shadow-md flex items-center justify-center hover:bg-emerald-700 cursor-pointer transition"
                    title={t.uploadAvatarBtn}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-3 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {avatarData || currentUser?.avatar_data ? t.changeAvatarBtn : t.uploadAvatarBtn}
                </button>
              </div>

              {/* User details summary card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Ism-Familiya:</span>
                  <span className="font-bold text-slate-900">
                    {currentUser?.first_name} {currentUser?.last_name || ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Telefon:</span>
                  <span className="font-bold text-slate-900 font-mono">{currentUser?.phone}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Bemor anketasi:</span>
                  <span className="font-bold text-emerald-800">
                    {currentUser?.gender === 'female' ? 'Ayol' : 'Erkak'}, {currentUser?.age} yosh • {currentUser?.height_cm} sm / {currentUser?.weight_kg} kg
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishAndEnter}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.99] transition cursor-pointer"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>{t.goToAppBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
