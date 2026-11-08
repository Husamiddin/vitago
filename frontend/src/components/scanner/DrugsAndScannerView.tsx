import React, { useState, useEffect } from 'react';
import {
  Pill,
  Camera,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  HeartPulse,
  AlertCircle,
  X,
  Bot,
} from 'lucide-react';
import type {
  DrugAnalogOption,
  PrescriptionAnalysisResponse,
  SamplePrescriptionMeta,
  SupportedLang,
  UserProfile,
} from '../../types/api';
import type { TranslationDict } from '../../i18n/translations';
import { PrescriptionScanner } from './PrescriptionScanner';
import { DrugSearchBar } from '../search/DrugSearchBar';
import { DrugResultCard } from '../results/DrugResultCard';
import { SavingsCalculatorCard } from '../results/SavingsCalculatorCard';

export interface UserMedication {
  id: string;
  condition: string;
  drugName: string;
  dose: string;
  timesPerDay: number;
  time: string;
  durationDays: number;
  done: boolean;
}

const MEDS_STORAGE_KEY = 'vitago_user_medications';
const NO_MEDS_FLAG_KEY = 'vitago_user_has_no_meds';

interface DrugsAndScannerViewProps {
  user: UserProfile | null;
  t: TranslationDict;
  lang: SupportedLang;
  samples: SamplePrescriptionMeta[];
  isLoading: boolean;
  onScanFile: (file: File) => void;
  onRunSample: (sampleId: string) => void;
  onSelectDrugId: (drugId: number) => void;
  onAiLookupQuery: (rawQuery: string) => void;
  analysis: PrescriptionAnalysisResponse | null;
  selectedMap: Record<string, { key: string; analog: DrugAnalogOption | null }>;
  onSelectOption: (itemId: string, optionKey: string, analog: DrugAnalogOption | null) => void;
  totalPrescribedUzs: number;
  totalSelectedUzs: number;
  onShowPharmacist: () => void;
  onShareTelegram: () => void;
  onCopyChecklist: () => void;
  onResetAnalysis: () => void;
  triggerHaptic?: (type?: 'light' | 'success') => void;
}

export const DrugsAndScannerView: React.FC<DrugsAndScannerViewProps> = ({
  user,
  t,
  lang,
  samples,
  isLoading,
  onScanFile,
  onRunSample,
  onSelectDrugId,
  onAiLookupQuery,
  analysis,
  selectedMap,
  onSelectOption,
  totalPrescribedUzs,
  totalSelectedUzs,
  onShowPharmacist,
  onShareTelegram,
  onCopyChecklist,
  onResetAnalysis,
  triggerHaptic,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'scanner' | 'search'>(
    analysis ? 'scanner' : 'schedule'
  );

  // Dynamic user medications state (NO FAKE HARDCODED DRUGS)
  const [medications, setMedications] = useState<UserMedication[]>(() => {
    try {
      const raw = localStorage.getItem(MEDS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [hasNoMeds, setHasNoMeds] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NO_MEDS_FLAG_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Modal for adding a real user medication
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newDrugName, setNewDrugName] = useState('');
  const [newDose, setNewDose] = useState('1 tabletka');
  const [newTimesPerDay, setNewTimesPerDay] = useState(2);
  const [newTime, setNewTime] = useState('09:00');
  const [newDurationDays, setNewDurationDays] = useState(7);

  const saveMedications = (meds: UserMedication[]) => {
    setMedications(meds);
    try {
      localStorage.setItem(MEDS_STORAGE_KEY, JSON.stringify(meds));
    } catch {
      // ignore
    }
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugName.trim()) return;
    triggerHaptic?.('success');

    const created: UserMedication = {
      id: 'med_' + Date.now(),
      condition: newCondition.trim() || 'Umumiy salomatlik',
      drugName: newDrugName.trim(),
      dose: newDose.trim() || '1 tabletka',
      timesPerDay: newTimesPerDay,
      time: newTime || '09:00',
      durationDays: newDurationDays,
      done: false,
    };

    const next = [...medications, created];
    saveMedications(next);
    setHasNoMeds(false);
    localStorage.removeItem(NO_MEDS_FLAG_KEY);

    // Reset form
    setNewDrugName('');
    setNewCondition('');
    setShowAddModal(false);
  };

  const toggleMedicationDone = (id: string) => {
    triggerHaptic?.('light');
    const next = medications.map((m) =>
      m.id === id ? { ...m, done: !m.done } : m
    );
    saveMedications(next);
  };

  const handleDeleteMedication = (id: string) => {
    triggerHaptic?.('light');
    const next = medications.filter((m) => m.id !== id);
    saveMedications(next);
  };

  const handleSetNoMeds = () => {
    triggerHaptic?.('success');
    setHasNoMeds(true);
    saveMedications([]);
    localStorage.setItem(NO_MEDS_FLAG_KEY, 'true');
  };

  // Find next upcoming medication time
  const nextMed = medications.find((m) => !m.done) || medications[0];

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-5 pb-24 pt-1 animate-in fade-in duration-300">
      {/* 1. TOP DYNAMIC REMINDER BANNER */}
      {medications.length > 0 ? (
        <div className="p-4 rounded-3xl bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-100 uppercase tracking-wide">
                Keyingi qabul vaqti
              </div>
              <div className="text-sm sm:text-base font-black">
                {nextMed ? `${nextMed.drugName} • bugun ${nextMed.time}` : 'Barcha dorilar ichildi'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            title="Dori qo'shish"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      ) : hasNoMeds ? (
        <div className="p-4 rounded-3xl bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">
                Holat: A'lo
              </div>
              <div className="text-sm sm:text-base font-black">
                Ichadigan dorilar yo'q
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold text-white transition cursor-pointer"
          >
            + Dori qo'shish
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-linear-to-r from-slate-800 to-indigo-900 text-white shadow-lg shadow-slate-900/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Pill className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wide">
                Salomatlik nazorati
              </div>
              <div className="text-sm sm:text-base font-black">
                Dorilar jadvalini sozlang
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-xs font-black text-white shadow-md shadow-blue-500/30 transition cursor-pointer"
          >
            Boshlash
          </button>
        </div>
      )}

      {/* 2. SUB NAVIGATION PILLS */}
      <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80 shadow-2xs w-full">
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('light');
            setActiveSubTab('schedule');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Grafik</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('light');
            setActiveSubTab('scanner');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'scanner'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Skaner</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('light');
            setActiveSubTab('search');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'search'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Qidirish</span>
        </button>
      </div>

      {/* 3. CONTENT: DORI GRAFIKI & ESLATMALAR (DYNAMIC) */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-4 animate-in fade-in">
          {medications.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bugungi qabul rejasi
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Kunlik shaxsiy davolanish jadvali
                  </p>
                </div>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {medications.filter((m) => m.done).length} / {medications.length} ichildi
                </span>
              </div>

              <div className="space-y-2.5">
                {medications.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-2xs ${
                      m.done
                        ? 'bg-slate-50/80 border-slate-200 opacity-70'
                        : 'bg-white border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    <div
                      onClick={() => toggleMedicationDone(m.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                          m.done ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-black tracking-tight ${
                              m.done ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                          >
                            {m.drugName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {m.condition}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold mt-0.5">
                          {m.dose} • {m.timesPerDay} mahal • {m.time} • ({m.durationDays > 0 ? `${m.durationDays} kun` : 'Doimiy'})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMedicationDone(m.id)}
                        className="cursor-pointer"
                      >
                        {m.done ? (
                          <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full border-2 border-slate-300 hover:border-blue-500 flex items-center justify-center" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedication(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Yana dori qo'shish</span>
                </button>

                <button
                  type="button"
                  onClick={onShowPharmacist}
                  className="py-3 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-700 text-white text-xs font-black flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-teal-800 transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Bot className="h-4 w-4" />
                  <span>AI Farmatsevt tavsiyasi</span>
                </button>
              </div>
            </>
          ) : hasNoMeds ? (
            /* USER EXPLICITLY CHOSE "NO DRUGS" */
            <div className="rounded-3xl bg-linear-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 p-6 text-center space-y-4 shadow-sm">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Ichadigan dorilarim yo'q
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Sizda doimiy qabul qilinadigan dori yoki surunkali kasallik belgilanmagan. Kunlik to'g'ri ovqatlanish va sport faolligi bo'yicha tavsiyalarga amal qiling!
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-emerald-300 text-emerald-800 text-xs font-black hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
                >
                  + Zarurat bo'lsa dori qo'shish
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('scanner')}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Retseptni skaner qilish</span>
                </button>
              </div>
            </div>
          ) : (
            /* ONBOARDING: USER HAS NOT CONFIGURED MEDS YET */
            <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center space-y-4 shadow-lg shadow-slate-200/50">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
                <Pill className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Shaxsiy dorilar va kasalliklar grafigi
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Sizda biron kasallik (masalan, shamollash, qon bosimi) yoki doimiy ichadigan dorilaringiz bormi? Shaxsiy jadvalingizni birgalikda tuzamiz.
                </p>
              </div>

              <div className="pt-3 space-y-2.5 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Dorilarni va kasallikni qo'shish</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetNoMeds}
                  className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Ichadigan dorilarim yo'q</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('scanner')}
                  className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="h-4 w-4 text-slate-500" />
                  <span>Retseptingiz bormi? Skaner qiling</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: ADD REAL MEDICATION & CONDITION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pill className="h-5 w-5" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Dori va kasallik qo'shish
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kasallik yoki tashxis (sababi)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Shamollash, Qon bosimi, Bosh og'rig'i..."
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dori nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Paratsetamol, Kardiomagnil, No-shpa..."
                  value={newDrugName}
                  onChange={(e) => setNewDrugName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Doza miqdori
                  </label>
                  <input
                    type="text"
                    value={newDose}
                    onChange={(e) => setNewDose(e.target.value)}
                    placeholder="1 tabletka"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Necha mahal?
                  </label>
                  <select
                    value={newTimesPerDay}
                    onChange={(e) => setNewTimesPerDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={1}>1 mahal</option>
                    <option value={2}>2 mahal (ertalab/kechqurun)</option>
                    <option value={3}>3 mahal (ovqatdan keyin)</option>
                    <option value={4}>4 mahal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ichish vaqti
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Davomiyligi (kun)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={newDurationDays}
                    onChange={(e) => setNewDurationDays(Number(e.target.value))}
                    placeholder="7 (0 = doimiy)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CONTENT: RETSEPT SKANER */}
      {activeSubTab === 'scanner' && (
        <div className="space-y-4 animate-in fade-in">
          <PrescriptionScanner
            t={t}
            lang={lang}
            samples={samples}
            isLoading={isLoading}
            onScanFile={onScanFile}
            onRunSample={onRunSample}
          />

          {analysis && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  Retsept tahlili va arzon analoglar
                </h3>
                <button
                  type="button"
                  onClick={onResetAnalysis}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                >
                  Tozalash
                </button>
              </div>

              <SavingsCalculatorCard
                t={t}
                lang={lang}
                summaryText={analysis.summary}
                totalPrescribedUzs={totalPrescribedUzs}
                totalSelectedUzs={totalSelectedUzs}
                onShowPharmacist={onShowPharmacist}
                onShareTelegram={onShareTelegram}
                onCopyChecklist={onCopyChecklist}
                onReset={onResetAnalysis}
              />

              <div className="space-y-3">
                {analysis.items.map((item, idx) => (
                  <DrugResultCard
                    key={item.item_id}
                    index={idx}
                    item={item}
                    selectedAnalogKey={selectedMap[item.item_id]?.key || 'original'}
                    onSelectOption={(optionKey, analog) =>
                      onSelectOption(item.item_id, optionKey, analog)
                    }
                    t={t}
                    lang={lang}
                  />
                ))}
              </div>

              {/* Medical Legal Disclaimer right under results */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium text-amber-950 leading-relaxed">
                  {analysis.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. CONTENT: DORI QIDIRISH */}
      {activeSubTab === 'search' && (
        <div className="space-y-4 animate-in fade-in">
          <DrugSearchBar
            t={t}
            lang={lang}
            isLoading={isLoading}
            onSelectDrugId={onSelectDrugId}
            onAiLookupQuery={onAiLookupQuery}
          />

          {analysis && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  Qidirilgan dori tahlili
                </h3>
                <button
                  type="button"
                  onClick={onResetAnalysis}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                >
                  Tozalash
                </button>
              </div>

              <SavingsCalculatorCard
                t={t}
                lang={lang}
                summaryText={analysis.summary}
                totalPrescribedUzs={totalPrescribedUzs}
                totalSelectedUzs={totalSelectedUzs}
                onShowPharmacist={onShowPharmacist}
                onShareTelegram={onShareTelegram}
                onCopyChecklist={onCopyChecklist}
                onReset={onResetAnalysis}
              />

              <div className="space-y-3">
                {analysis.items.map((item, idx) => (
                  <DrugResultCard
                    key={item.item_id}
                    index={idx}
                    item={item}
                    selectedAnalogKey={selectedMap[item.item_id]?.key || 'original'}
                    onSelectOption={(optionKey, analog) =>
                      onSelectOption(item.item_id, optionKey, analog)
                    }
                    t={t}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
