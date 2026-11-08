import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Camera,
  LogOut,
  Save,
  CheckCircle2,
  RefreshCw,
  Scale,
  Ruler,
  Calendar,
} from 'lucide-react';
import type { TranslationDict } from '../../i18n/translations';
import type { SupportedLang, UserProfile } from '../../types/api';
import { updateProfile, logoutUser, clearSavedUser } from '../../services/apiClient';

interface UserProfileModalProps {
  t: TranslationDict;
  lang: SupportedLang;
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onLogout: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  t,
  lang,
  isOpen,
  user,
  onClose,
  onUserUpdated,
  onLogout,
  triggerHaptic,
}) => {
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [gender, setGender] = useState<'male' | 'female'>(user.gender || 'male');
  const [age, setAge] = useState<string>(user.age ? String(user.age) : '25');
  const [heightCm, setHeightCm] = useState<string>(user.height_cm ? String(user.height_cm) : '175');
  const [weightKg, setWeightKg] = useState<string>(user.weight_kg ? String(user.weight_kg) : '70');
  const [avatarData, setAvatarData] = useState<string | null>(user.avatar_data || null);

  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAvatarData(b64);
      triggerHaptic?.('light');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user.token) return;

    setIsLoading(true);
    try {
      const ageNum = parseInt(age, 10) || user.age || 25;
      const heightNum = parseInt(heightCm, 10) || user.height_cm || 175;
      const weightNum = parseInt(weightKg, 10) || user.weight_kg || 70;

      const updated = await updateProfile(user.token, {
        first_name: firstName.trim() || user.first_name,
        last_name: lastName.trim() || user.last_name,
        gender,
        age: ageNum,
        height_cm: heightNum,
        weight_kg: weightNum,
        avatar_data: avatarData,
      });

      onUserUpdated(updated);
      setSavedSuccess(true);
      triggerHaptic?.('success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      if (user.token) {
        await logoutUser(user.token);
      }
    } catch {
      // ignore network errors on logout
    }
    clearSavedUser();
    triggerHaptic?.('light');
    onLogout();
  };

  // BMI (Tana vazni indeksi) hisoblash: weight / (height/100)^2
  const heightM = (parseInt(heightCm, 10) || 170) / 100;
  const weightVal = parseInt(weightKg, 10) || 70;
  const bmi = (weightVal / (heightM * heightM)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md my-auto sm:my-6 overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900">{t.profileBtn}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Avatar and Main Info */}
          <div className="flex flex-col items-center text-center">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />

            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-emerald-500 bg-slate-100 flex items-center justify-center shadow-md">
                {avatarData ? (
                  <img src={avatarData} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-emerald-700">
                    {firstName.charAt(0).toUpperCase()}
                    {lastName ? lastName.charAt(0).toUpperCase() : ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-emerald-600 text-white shadow-md flex items-center justify-center hover:bg-emerald-700 cursor-pointer transition"
                title={t.uploadAvatarBtn}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              {avatarData ? t.changeAvatarBtn : t.uploadAvatarBtn}
            </button>
          </div>

          {/* Form details */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.firstNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.lastNameLabel}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.phoneLabel}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user.phone}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 pl-10 pr-3.5 py-2 text-sm font-bold text-slate-700 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Gender Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.genderLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    gender === 'male'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {t.genderMale}
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    gender === 'female'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {t.genderFemale}
                </button>
              </div>
            </div>

            {/* Physical metrics: Age, Height, Weight */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-emerald-600" />
                  <span>Yosh</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full text-center rounded-xl border border-slate-300 py-1.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Ruler className="h-3 w-3 text-emerald-600" />
                  <span>Bo‘y (sm)</span>
                </label>
                <input
                  type="number"
                  min="40"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full text-center rounded-xl border border-slate-300 py-1.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Scale className="h-3 w-3 text-emerald-600" />
                  <span>Vazn (kg)</span>
                </label>
                <input
                  type="number"
                  min="2"
                  max="300"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full text-center rounded-xl border border-slate-300 py-1.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* BMI indicator pill */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs flex items-center justify-between text-emerald-900">
              <span className="font-semibold">Tana vazni indeksi (BMI):</span>
              <span className="font-extrabold bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                {bmi} kg/m²
              </span>
            </div>

            {savedSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-2.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t.profileUpdatedToast}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 cursor-pointer transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>O‘zgarishlarni saqlash</span>
                </>
              )}
            </button>
          </form>

          {/* Logout button */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer transition"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.logoutBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
