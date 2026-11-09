import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Search,
  Clock,
  Info,
  Sparkles,
  Smartphone,
  Monitor,
  AlertCircle,
  ShieldAlert,
  User as UserIcon,
  Crown,
  MessageSquare,
  HeartPulse,
  Utensils,
  AlarmClock,
  Lock,
  Zap,
  Home as HomeIcon,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';

import type {
  ActiveTab,
  DrugAnalogOption,
  PlatformStatsResponse,
  PrescriptionAnalysisResponse,
  SamplePrescriptionMeta,
  SavedHistoryEntry,
  SupportedLang,
  UserProfile,
} from './types/api';
import { TRANSLATIONS, formatUzs } from './i18n/translations';
import { usePlatform } from './hooks/usePlatform';
import {
  fetchDrugAnalogsById,
  fetchPlatformStats,
  fetchSamplePrescriptions,
  getMe,
  loadSavedUser,
  clearSavedUser,
  lookupRareDrugWithAI,
  runDemoPrescription,
  saveUserLocally,
  scanPrescriptionImage,
  updateProfile,
} from './services/apiClient';
import {
  clearAllHistory,
  loadScanHistory,
  removeHistoryEntry,
  saveAnalysisToHistory,
} from './services/historyStorage';

import { BrandLogo, LanguageSwitcher } from './components/common/BrandLogo';
import { PrescriptionScanner } from './components/scanner/PrescriptionScanner';
import { DrugSearchBar } from './components/search/DrugSearchBar';
import { SavingsCalculatorCard } from './components/results/SavingsCalculatorCard';
import { DrugResultCard } from './components/results/DrugResultCard';
import { PharmacistModal } from './components/results/PharmacistModal';
import { ScanHistoryView } from './components/history/ScanHistoryView';
import { LandingSections } from './components/landing/LandingSections';
import { AuthGateModal } from './components/auth/AuthGateModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { PlansCheckoutModal } from './components/plans/PlansCheckoutModal';
import { AIChatModal } from './components/chat/AIChatModal';
import { HealthAndElderlyModal } from './components/health/HealthAndElderlyModal';
import { FoodScanModal } from './components/food/FoodScanModal';
import { AlarmMissionModal } from './components/alarm/AlarmMissionModal';
import { LegalModal, type LegalModalTab } from './components/legal/LegalModal';
import { WelcomePageModal } from './components/onboarding/WelcomePageModal';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { OfflineBanner } from './components/common/OfflineBanner';
import { AICoachNotificationBanner } from './components/common/AICoachNotificationBanner';
import { TetikSportView } from './components/sport/VitaGoSportView';
import { HomeDashboardView } from './components/home/HomeDashboardView';
import { HealthDashboardView } from './components/health/HealthDashboardView';
import { NutritionView } from './components/food/NutritionView';
import { DrugsAndScannerView } from './components/scanner/DrugsAndScannerView';
import { StatisticsView } from './components/history/StatisticsView';
import { ProfileView } from './components/profile/ProfileView';
import { StepCounterManager } from './services/stepCounter';
import { SportTrackerManager, type SportTrackerState } from './services/sportTracker';

const LANG_STORAGE_KEY = 'doriscan_lang';

const DEFAULT_DISCLAIMERS: Record<SupportedLang, string> = {
  uz: 'Tetik — axborot beruvchi intellektual tizim. Dori vositalarini yoki ularning analoglarini qabul qilishdan oldin davolovchi shifokoringiz yoki malakali farmatsevt bilan maslahatlashing.',
  uz_cyrl:
    'Tetik — ахборот берувчи интеллектуал тизим. Дори воситаларини ёки уларнинг аналогларини қабул қилишдан олдин даволовчи шифокорингиз ёки малакали фармацевт билан маслаҳатлашинг.',
  ru: 'Tetik — информационная интеллектуальная система. Перед применением лекарственных средств или заменой на аналоги обязательно проконсультируйтесь с лечащим врачом или фармацевтом.',
};

export const App: React.FC = () => {
  const {
    isNativeTelegram,
    isTelegramMiniApp,
    previewTelegramMode,
    setPreviewTelegramMode,
    isCompactAppLayout,
    triggerHaptic,
    shareViaTelegram,
  } = usePlatform();

  const [lang, setLang] = useState<SupportedLang>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'uz' || saved === 'uz_cyrl' || saved === 'ru') return saved;
    const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (tgLang === 'ru') return 'ru';
    return 'uz';
  });

  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const qTab = new URLSearchParams(window.location.search).get('tab');
    if (qTab === 'sport') {
      return 'sport';
    }
    if (
      qTab === 'home' ||
      qTab === 'health' ||
      qTab === 'drugs' ||
      qTab === 'food' ||
      qTab === 'stats' ||
      qTab === 'profile' ||
      qTab === 'plans' ||
      qTab === 'search' ||
      qTab === 'history' ||
      qTab === 'about' ||
      qTab === 'scanner'
    ) {
      return qTab as ActiveTab;
    }
    return 'home';
  });
  const [samples, setSamples] = useState<SamplePrescriptionMeta[]>([]);
  const [stats, setStats] = useState<PlatformStatsResponse | null>(null);
  const [history, setHistory] = useState<SavedHistoryEntry[]>(() => loadScanHistory());

  const [analysis, setAnalysis] = useState<PrescriptionAnalysisResponse | null>(null);
  const [selectedMap, setSelectedMap] = useState<
    Record<string, { key: string; analog: DrugAnalogOption | null }>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pharmacistModalOpen, setPharmacistModalOpen] = useState(false);

  // User Authentication & Medical Profile State (Guests can enter without registering!)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => loadSavedUser());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [plansModalOpen, setPlansModalOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('modal') === 'plans';
  });
  const [chatModalOpen, setChatModalOpen] = useState(
    () => new URLSearchParams(window.location.search).get('modal') === 'voice'
  );
  const [healthModalOpen, setHealthModalOpen] = useState(
    () => new URLSearchParams(window.location.search).get('modal') === 'health'
  );
  const [foodModalOpen, setFoodModalOpen] = useState(
    () => new URLSearchParams(window.location.search).get('modal') === 'food'
  );
  const [alarmModalOpen, setAlarmModalOpen] = useState(
    () => new URLSearchParams(window.location.search).get('modal') === 'alarm'
  );
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<LegalModalTab>('how_it_works');
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    const qOnboarding = new URLSearchParams(window.location.search).get('onboarding');
    if (qOnboarding === 'true' || qOnboarding === '1') return true;
    return !localStorage.getItem('vitago_onboarding_completed');
  });

  // Persistent Alarm Settings & Global Background Monitor
  const [alarmTime, setAlarmTime] = useState<string>(() => {
    const savedUser = loadSavedUser();
    return savedUser?.alarm_time || localStorage.getItem('doriscan_alarm_time') || '07:00';
  });
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(() => {
    const savedUser = loadSavedUser();
    if (typeof savedUser?.alarm_enabled === 'boolean') {
      return savedUser.alarm_enabled;
    }
    const s = localStorage.getItem('doriscan_alarm_enabled');
    return s !== null ? s !== 'false' : false;
  });
  const [alarmForceRinging, setAlarmForceRinging] = useState(false);

  // Global persistent Sport Tracker & Navigator state (stays alive on Main screen & background)
  const [sportTrackerState, setSportTrackerState] = useState<SportTrackerState>(() =>
    SportTrackerManager.getInstance().getState()
  );

  useEffect(() => {
    const tracker = SportTrackerManager.getInstance();
    const unsub = tracker.subscribe((st) => {
      setSportTrackerState(st);
    });
    // Eagerly trigger GPS watch silently on mount so Android and browser register Joylashuv (Location) permission
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      tracker.startGpsWatch(true);
    }
    return () => unsub();
  }, []);

  // Real-Time Live Clock & Current Date (replaces 24h countdown)
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const liveClockStr = `${String(liveNow.getHours()).padStart(2, '0')}:${String(
    liveNow.getMinutes()
  ).padStart(2, '0')}:${String(liveNow.getSeconds()).padStart(2, '0')}`;
  const liveDateStr = `${String(liveNow.getDate()).padStart(2, '0')}.${String(
    liveNow.getMonth() + 1
  ).padStart(2, '0')}.${liveNow.getFullYear()}`;

  // Request device notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Midnight Step Reset (When a new day begins, reset daily steps to 0)
  useEffect(() => {
    const todayStr = `${liveNow.getFullYear()}-${String(liveNow.getMonth() + 1).padStart(2, '0')}-${String(liveNow.getDate()).padStart(2, '0')}`;
    const lastDate = localStorage.getItem('vitago_last_step_date');
    if (lastDate && lastDate !== todayStr) {
      if (currentUser && currentUser.daily_steps !== 0) {
        const updated = { ...currentUser, daily_steps: 0 };
        setCurrentUser(updated);
        try {
          localStorage.setItem('doriscan_user_profile', JSON.stringify(updated));
        } catch {}
      }
    }
    localStorage.setItem('vitago_last_step_date', todayStr);
  }, [liveNow.getDate()]);

  // Real Medication Alarm Audio & "Ichdim" Modal state
  const [activeMedAlarm, setActiveMedAlarm] = useState<{ id: string; drugName: string; dose: string } | null>(null);
  const medAlarmAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleMarkMedTaken = useCallback(() => {
    if (!activeMedAlarm) return;
    triggerHaptic('success');
    if (medAlarmAudioRef.current) {
      medAlarmAudioRef.current.pause();
      medAlarmAudioRef.current.currentTime = 0;
    }
    try {
      const raw = localStorage.getItem('vitago_user_medications');
      if (raw) {
        const meds = JSON.parse(raw);
        const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        const updated = meds.map((m: any) =>
          m.id === activeMedAlarm.id ? { ...m, done: true, lastTakenDate: todayKey } : m
        );
        localStorage.setItem('vitago_user_medications', JSON.stringify(updated));
      }
    } catch {}
    setActiveMedAlarm(null);
  }, [activeMedAlarm, triggerHaptic]);

  // Global wall-clock checker for Medication Reminders (checks every 4 seconds)
  useEffect(() => {
    const checkMedTimes = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      try {
        const raw = localStorage.getItem('vitago_user_medications');
        if (!raw) return;
        const meds = JSON.parse(raw);
        if (!Array.isArray(meds)) return;

        const dueMed = meds.find(
          (m: any) =>
            m.time === currentHHMM &&
            (!m.done || m.lastTakenDate !== todayKey) &&
            localStorage.getItem(`vitago_med_rung_${m.id}_${todayKey}`) !== currentHHMM
        );

        if (dueMed && !activeMedAlarm) {
          localStorage.setItem(`vitago_med_rung_${dueMed.id}_${todayKey}`, currentHHMM);
          setActiveMedAlarm({ id: dueMed.id, drugName: dueMed.drugName, dose: dueMed.dose });
          triggerHaptic('success');

          try {
            if (!medAlarmAudioRef.current) {
              medAlarmAudioRef.current = new Audio('/alarm.mp3');
              medAlarmAudioRef.current.loop = true;
            }
            medAlarmAudioRef.current.play().catch(() => {});
          } catch {}

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('💊 Dori ichish vaqti bo‘ldi!', {
                body: `${dueMed.drugName} (${dueMed.dose}) qabul qilish vaqti keldi. Tetik ilovasida «Ichdim» tugmasini bosing!`,
                icon: '/logo.png',
              });
            } catch {}
          }
        }
      } catch {}
    };

    const interval = setInterval(checkMedTimes, 4000);
    return () => clearInterval(interval);
  }, [activeMedAlarm, triggerHaptic]);

  // Demo Budilnik State for Unregistered Guests (Max 2 tries, disappears on 3rd)
  const DEMO_ALARM_STORAGE_KEY = 'vitago_demo_alarm_count_v1';
  const [demoAlarmCount, setDemoAlarmCount] = useState<number>(() => {
    const raw = localStorage.getItem('vitago_demo_alarm_count_v1');
    return raw ? parseInt(raw, 10) || 0 : 0;
  });
  const [demoAlarmPhase, setDemoAlarmPhase] = useState<'idle' | 'preparing' | 'counting'>('idle');
  const [demoTargetTimeStr, setDemoTargetTimeStr] = useState<string>('');
  const [demoCountdownSec, setDemoCountdownSec] = useState<number>(60);
  const [isDemoAlarmModalActive, setIsDemoAlarmModalActive] = useState<boolean>(false);

  const handleStartDemoAlarm = () => {
    if (demoAlarmCount >= 2 || demoAlarmPhase !== 'idle') return;
    triggerHaptic('light');
    const now = new Date();
    const targetDate = new Date(now.getTime() + 2 * 60 * 1000);
    const hh = String(targetDate.getHours()).padStart(2, '0');
    const mm = String(targetDate.getMinutes()).padStart(2, '0');
    setDemoTargetTimeStr(`${hh}:${mm}`);
    setDemoCountdownSec(60);
    setDemoAlarmPhase('preparing');
  };

  useEffect(() => {
    if (demoAlarmPhase === 'preparing') {
      const prepTimer = setTimeout(() => {
        setDemoAlarmPhase('counting');
      }, 2400);
      return () => clearTimeout(prepTimer);
    }
    if (demoAlarmPhase === 'counting') {
      const tick = setInterval(() => {
        setDemoCountdownSec((prev) => {
          if (prev <= 1) {
            clearInterval(tick);
            const nextCount = demoAlarmCount + 1;
            setDemoAlarmCount(nextCount);
            localStorage.setItem(DEMO_ALARM_STORAGE_KEY, String(nextCount));
            setDemoAlarmPhase('idle');
            setIsDemoAlarmModalActive(true);
            setAlarmForceRinging(true);
            setAlarmModalOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(tick);
    }
  }, [demoAlarmPhase, demoAlarmCount]);

  // Sync alarm settings when user profile loads
  useEffect(() => {
    if (currentUser?.alarm_time) {
      setAlarmTime(currentUser.alarm_time);
      localStorage.setItem('doriscan_alarm_time', currentUser.alarm_time);
    }
    if (typeof currentUser?.alarm_enabled === 'boolean') {
      setAlarmEnabled(currentUser.alarm_enabled);
      localStorage.setItem('doriscan_alarm_enabled', currentUser.alarm_enabled ? 'true' : 'false');
    }
  }, [currentUser?.alarm_time, currentUser?.alarm_enabled]);

  // Global continuous wall-clock alarm checker (active across entire app lifecycle)
  useEffect(() => {
    if (!alarmEnabled || currentUser?.plan !== 'ultra') return;

    const checkAlarmTime = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const checkKey = `${todayDate}_${alarmTime}`;
      const lastRung = localStorage.getItem('doriscan_last_alarm_rung');

      if (currentHHMM === alarmTime && lastRung !== checkKey) {
        localStorage.setItem('doriscan_last_alarm_rung', checkKey);
        setAlarmForceRinging(true);
        setAlarmModalOpen(true);
      }
    };

    const interval = setInterval(checkAlarmTime, 3000);
    return () => clearInterval(interval);
  }, [alarmEnabled, alarmTime, currentUser?.plan]);

  const openLegalModal = (tab: LegalModalTab) => {
    setActiveLegalTab(tab);
    setLegalModalOpen(true);
    triggerHaptic('light');
  };
  const [avatarError, setAvatarError] = useState(false);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const handleLangChange = (nextLang: SupportedLang) => {
    setLang(nextLang);
    localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    triggerHaptic('light');
  };

  const handleAuthSuccess = useCallback(
    (user: UserProfile) => {
      setCurrentUser(user);
      setAuthModalOpen(false);
      triggerHaptic('success');
    },
    [triggerHaptic]
  );

  const handleUserUpdated = useCallback((user: UserProfile) => {
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    clearSavedUser();
    try {
      localStorage.removeItem('doriscan_user_profile');
      localStorage.removeItem('doriscan_user');
      localStorage.removeItem('doriscan_auth_user_v1');
      localStorage.removeItem('doriscan_daily_health_plan_user');
      localStorage.removeItem('doriscan_alarm_time');
      localStorage.removeItem('doriscan_alarm_enabled');
    } catch {}
    setCurrentUser(null);
    setProfileModalOpen(false);
    setAuthModalOpen(false);
    setActiveTab('home');
    triggerHaptic('success');
  }, [triggerHaptic]);

  const ensureAuthenticated = useCallback(() => {
    if (!currentUser || !currentUser.is_profile_complete) {
      setAuthModalOpen(true);
      return false;
    }
    return true;
  }, [currentUser]);

  const handleOpenSport = useCallback(() => {
    triggerHaptic('light');
    // Anyone (including unregistered guests) can open Sport; VitaGoSportView locks actions if not Ultra!
    setActiveTab('sport');
  }, [triggerHaptic]);

  // Live Step Counter & Sensor Integration
  useEffect(() => {
    const mgr = StepCounterManager.getInstance();
    if (currentUser?.token) {
      mgr.setToken(currentUser.token);
    }
    mgr.startListening();

    const unsub = mgr.subscribe((steps) => {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        if (prev.daily_steps === steps) return prev;
        const target = prev.daily_target_steps || 6000;
        const isTargetReached = steps >= target;
        return {
          ...prev,
          daily_steps: steps,
          streak_count: isTargetReached ? Math.max(prev.streak_count, 1) : prev.streak_count,
        };
      });
    });

    return () => {
      unsub();
      mgr.stopListening();
    };
  }, [currentUser?.token]);

  useEffect(() => {
    fetchPlatformStats()
      .then(setStats)
      .catch(() => {});

    // Sync latest user profile & plan status from Railway DB on mount, focus, and every 12s
    const syncProfileFromServer = () => {
      const token = currentUser?.token || loadSavedUser()?.token || '';
      getMe(token)
        .then((me: UserProfile) => {
          if (me) {
            setCurrentUser(me);
            saveUserLocally(me);
            StepCounterManager.getInstance().syncFromServer(me.daily_steps || 0);
          }
        })
        .catch(() => {});
    };

    syncProfileFromServer();
    const syncInterval = setInterval(syncProfileFromServer, 12000);
    const onFocus = () => syncProfileFromServer();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser?.token]);

  useEffect(() => {
    fetchSamplePrescriptions(lang)
      .then(setSamples)
      .catch(() => {});
  }, [lang]);

  const applyNewAnalysis = useCallback(
    (res: PrescriptionAnalysisResponse, saveHistory = true) => {
      setAnalysis(res);
      setErrorMsg(null);

      // Default each drug to its cheapest recommended analog
      const initialSelections: Record<string, { key: string; analog: DrugAnalogOption | null }> = {};
      res.items.forEach((item) => {
        if (item.analogs.length > 0 && item.analogs[0].price_uzs < item.prescribed_price_uzs) {
          initialSelections[item.item_id] = { key: 'analog-0', analog: item.analogs[0] };
        } else {
          initialSelections[item.item_id] = { key: 'original', analog: null };
        }
      });
      setSelectedMap(initialSelections);

      if (saveHistory && res.is_valid_prescription && res.items.length > 0) {
        setHistory(saveAnalysisToHistory(res));
      }

      triggerHaptic('success');
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    },
    [triggerHaptic]
  );

  const handleScanFile = useCallback(
    async (file: File) => {
      if (!ensureAuthenticated()) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await scanPrescriptionImage(file, lang);
        applyNewAnalysis(res, true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [lang, applyNewAnalysis, ensureAuthenticated]
  );

  const handleRunSample = useCallback(
    async (sampleId: string) => {
      if (!ensureAuthenticated()) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await runDemoPrescription(sampleId, lang);
        applyNewAnalysis(res, true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [lang, applyNewAnalysis, ensureAuthenticated]
  );

  const handleSelectDrugId = useCallback(
    async (drugId: number) => {
      if (!ensureAuthenticated()) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchDrugAnalogsById(drugId, lang);
        applyNewAnalysis(res, true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [lang, applyNewAnalysis, ensureAuthenticated]
  );

  const handleAiLookupQuery = useCallback(
    async (query: string) => {
      if (!ensureAuthenticated()) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await lookupRareDrugWithAI(query, lang);
        applyNewAnalysis(res, true);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [lang, applyNewAnalysis, ensureAuthenticated]
  );

  // Real-time interactive budget totals based on user's selected analog per drug
  const { totalPrescribedUzs, totalSelectedUzs, totalSavingsUzs } = useMemo(() => {
    if (!analysis || !analysis.items.length) {
      return { totalPrescribedUzs: 0, totalSelectedUzs: 0, totalSavingsUzs: 0 };
    }
    let prescribed = 0;
    let selected = 0;
    for (const item of analysis.items) {
      prescribed += item.prescribed_price_uzs;
      const chosen = selectedMap[item.item_id]?.analog;
      selected += chosen ? chosen.price_uzs : item.prescribed_price_uzs;
    }
    return {
      totalPrescribedUzs: prescribed,
      totalSelectedUzs: selected,
      totalSavingsUzs: Math.max(0, prescribed - selected),
    };
  }, [analysis, selectedMap]);

  const buildShareChecklistText = useCallback(() => {
    if (!analysis) return '';
    const lines = [t.shareHeader, ''];
    analysis.items.forEach((item, idx) => {
      const chosen = selectedMap[item.item_id]?.analog;
      const name = chosen ? chosen.trade_name : item.prescribed_name;
      const dosage = chosen ? chosen.dosage : item.dosage;
      const price = chosen ? chosen.price_uzs : item.prescribed_price_uzs;
      lines.push(`${idx + 1}. ${name} (${dosage}) — ~${formatUzs(price, lang)}`);
    });
    lines.push('');
    lines.push(`💰 ${t.analogsTotalLabel} ~${formatUzs(totalSelectedUzs, lang)}`);
    if (totalSavingsUzs > 0) {
      lines.push(`✅ ${t.yourSavingsLabel} ${formatUzs(totalSavingsUzs, lang)}`);
    }
    return lines.join('\n');
  }, [analysis, selectedMap, t, lang, totalSelectedUzs, totalSavingsUzs]);

  const handleCopyChecklist = useCallback(() => {
    const txt = buildShareChecklistText();
    if (txt) {
      navigator.clipboard?.writeText(txt).catch(() => {});
      triggerHaptic('light');
    }
  }, [buildShareChecklistText, triggerHaptic]);

  const handleShareTelegram = useCallback(() => {
    const txt = buildShareChecklistText();
    if (txt) {
      shareViaTelegram(txt);
    }
  }, [buildShareChecklistText, shareViaTelegram]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 w-full max-w-full overflow-x-hidden ${
        previewTelegramMode ? 'max-w-md mx-auto border-x border-slate-300 shadow-2xl bg-slate-50' : ''
      }`}
    >
      {activeTab === 'sport' ? (
        <TetikSportView
          currentUser={currentUser}
          lang={lang}
          onLangChange={handleLangChange}
          onBackToMain={() => {
            setActiveTab('scanner');
            triggerHaptic('light');
          }}
          onOpenPlans={() => setPlansModalOpen(true)}
          onOpenAIChat={() => setChatModalOpen(true)}
          onRequireAuth={() => setAuthModalOpen(true)}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            saveUserLocally(updatedUser);
          }}
          triggerHaptic={triggerHaptic}
        />
      ) : (
        <>
          {/* AI Murabbiy In-App Coach & Health Notifications (Every 45 min for Premium & Ultra) */}
          <AICoachNotificationBanner
            user={currentUser}
            onOpenFoodScan={() => setFoodModalOpen(true)}
            onOpenWorkout={(_type) => {
              setActiveTab('sport');
            }}
            triggerHaptic={triggerHaptic}
          />

          {/* Offline PWA Connectivity Banner */}
          <OfflineBanner />

          {/* PWA / Mobile Install Banner */}
          <PwaInstallBanner />

          {/* Top Sticky Header */}
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md w-full max-w-full">
            <div
              className={`mx-auto flex items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 w-full max-w-full min-w-0 ${
                isTelegramMiniApp ? 'max-w-2xl' : 'max-w-6xl'
              }`}
            >
              <BrandLogo
                compact={isCompactAppLayout}
                onClick={() => {
                  setActiveTab('scanner');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />

              {/* Desktop Navigation Pills (hidden on Mobile & Telegram Mini App) */}
              {!isCompactAppLayout && (
                <nav className="flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1">
                  {(
                    [
                      { id: 'scanner', label: t.navScanner, icon: Camera },
                      { id: 'search', label: t.navSearch, icon: Search },
                      { id: 'history', label: `${t.navHistory} (${history.length})`, icon: Clock },
                      { id: 'about', label: t.navAbout, icon: Info },
                    ] as const
                  ).map((navItem) => {
                    const Icon = navItem.icon;
                    const active = activeTab === navItem.id;
                    return (
                      <button
                        key={navItem.id}
                        type="button"
                        onClick={() => setActiveTab(navItem.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                          active
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {navItem.label}
                      </button>
                    );
                  })}

                  {/* Distinct Green Sport Button in Desktop Navigation */}
                  <button
                    type="button"
                    onClick={handleOpenSport}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 px-3.5 py-2 text-xs font-black text-white shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-400/50 transition hover:brightness-105 active:scale-95 cursor-pointer ml-1"
                  >
                    <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    <span>Sport</span>
                  </button>
                </nav>
              )}

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Daily Streak Flame Indicator */}
            {currentUser && (
              <div
                className="inline-flex items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl border border-amber-200 bg-amber-50/90 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-black text-amber-900 shadow-2xs shrink-0 cursor-pointer"
                onClick={() => setHealthModalOpen(true)}
                title={`Kunlik faollik: ${currentUser.streak_count || 0} kun ketma-ket`}
              >
                <img
                  src={
                    (currentUser.daily_steps || 0) >= (currentUser.daily_target_steps || 6000) ||
                    (currentUser.streak_count || 0) > 0
                      ? '/streak_active.jpg'
                      : '/streak_inactive.jpg'
                  }
                  alt="Streak"
                  className="h-4 w-4 sm:h-5 sm:w-5 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[10px] sm:text-[11px] font-black text-amber-900">
                  {currentUser.streak_count || 0}d
                </span>
              </div>
            )}

            {/* Current Plan Badge / Upgrade Trigger */}
            <button
              type="button"
              onClick={() => {
                if (!ensureAuthenticated()) return;
                setPlansModalOpen(true);
                triggerHaptic('light');
              }}
              className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black transition cursor-pointer shadow-2xs shrink-0 ${
                currentUser?.plan === 'ultra'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-orange-500/25 ring-1 ring-amber-300'
                  : currentUser?.plan === 'premium'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/25 ring-1 ring-emerald-300'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Obuna rejasini ko'rish va yangilash"
            >
              {currentUser?.plan === 'ultra' ? (
                <>
                  <Crown className="h-3 w-3 fill-white text-white" />
                  <span className="text-[10px] sm:text-[11px] hidden xs:inline">Ultra</span>
                </>
              ) : currentUser?.plan === 'premium' ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span className="text-[10px] sm:text-[11px] hidden xs:inline">Premium</span>
                </>
              ) : (
                <>
                  <span className="text-slate-600 font-extrabold text-[10px] sm:text-[11px]">Tarif</span>
                </>
              )}
            </button>

            {/* Direct link to @TetikApp_bot on Web */}
            {!isNativeTelegram && (
              <a
                href="https://t.me/TetikApp_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
              >
                <span>✈️ @TetikApp_bot</span>
              </a>
            )}

            {/* Desktop preview toggle to test Telegram Mini App appearance */}
            {!isNativeTelegram && (
              <button
                type="button"
                onClick={() => setPreviewTelegramMode((p) => !p)}
                title={t.tgPreviewToggle}
                className={`hidden md:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  previewTelegramMode
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {previewTelegramMode ? (
                  <>
                    <Monitor className="h-3.5 w-3.5" />
                    {t.tgPreviewExit}
                  </>
                ) : (
                  <>
                    <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                    {t.tgPreviewToggle}
                  </>
                )}
              </button>
            )}

            {/* User Profile Button or Login Button */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(true);
                  triggerHaptic('light');
                }}
                className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-emerald-200 bg-emerald-50 p-0.5 sm:px-2.5 sm:py-1.5 text-xs font-bold text-emerald-900 transition hover:bg-emerald-100 cursor-pointer shadow-2xs shrink-0"
                title={currentUser.first_name ? `${currentUser.first_name} (${t.profileBtn})` : t.profileBtn}
              >
                {currentUser.avatar_data && !avatarError ? (
                  <img
                    src={currentUser.avatar_data}
                    alt={currentUser.first_name || 'User'}
                    onError={() => setAvatarError(true)}
                    className="h-6 w-6 sm:h-5 sm:w-5 rounded-full object-cover ring-1 sm:ring-2 ring-emerald-500 shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white shrink-0 shadow-xs">
                    {currentUser.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                {/* On mobile screens, hide wide name to prevent horizontal overflow */}
                <span className="hidden sm:inline font-bold truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUser.first_name || t.profileBtn}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(true);
                  triggerHaptic('light');
                }}
                className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-emerald-600 bg-emerald-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 cursor-pointer shadow-xs shrink-0"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span className="text-xs">{lang === 'ru' ? 'Войти' : 'Kirish'}</span>
              </button>
            )}

            <LanguageSwitcher lang={lang} onChange={handleLangChange} />
          </div>
        </div>
      </header>

      {/* Live Background Sport / GPS Navigator Bar when active on Main screen */}
      {(sportTrackerState.isRecording || sportTrackerState.destPos !== null) && (
        <div className="sticky top-[49px] sm:top-[57px] z-30 bg-gradient-to-r from-[#FC4C02] via-orange-600 to-emerald-600 text-white px-3 py-2 shadow-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-black truncate">
                  Tetik Sport • {sportTrackerState.isRecording ? 'Mashg‘ulot Faol (24/7)' : 'GPS Navigator Faol (24/7)'}
                </p>
                <p className="text-[10px] font-bold text-white/90 truncate">
                  {sportTrackerState.isRecording
                    ? `Vaqt: ${String(Math.floor(sportTrackerState.elapsedSec / 60)).padStart(2, '0')}:${String(sportTrackerState.elapsedSec % 60).padStart(2, '0')} • Masofa: ${sportTrackerState.distanceKm.toFixed(2)} km • ${sportTrackerState.locationLabel}`
                    : `${sportTrackerState.locationLabel} → Yo‘nalish (${sportTrackerState.routeDistanceKm ?? 0} km)`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sport');
                triggerHaptic('light');
              }}
              className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black text-[#FC4C02] shadow-xs shrink-0 cursor-pointer"
            >
              Ochish →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main
        className={`mx-auto w-full max-w-full flex-1 px-3 sm:px-4 pt-3.5 sm:pt-5 overflow-x-hidden min-w-0 ${
          isCompactAppLayout ? 'max-w-2xl pb-28' : 'max-w-6xl pb-16'
        }`}
      >
        {/* Hero Header (Compact in Telegram Mini App, Expansive on Web/PC) */}
        {(activeTab === 'scanner' || activeTab === 'search') && (
          <div className={`${isTelegramMiniApp ? 'mb-3.5 text-left' : 'mb-7 text-center'} w-full max-w-full`}>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-bold text-emerald-800">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{t.sloganBadge}</span>
            </div>

            <h1
              className={`mt-2 font-black tracking-tight text-slate-900 leading-snug break-words ${
                isTelegramMiniApp
                  ? 'text-lg sm:text-2xl'
                  : 'text-2xl sm:text-4xl lg:text-[42px] lg:leading-tight'
              }`}
            >
              {t.heroTitle}
            </h1>

            {!isTelegramMiniApp && (
              <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
                {t.heroSubtitle}
              </p>
            )}

            {/* Real-Time Clock & Date + AI Daily Health Plan Banner */}
            <div
              onClick={() => {
                if (!ensureAuthenticated()) return;
                setHealthModalOpen(true);
                triggerHaptic('light');
              }}
              className="mt-3 flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 p-2.5 sm:p-3 text-left shadow-2xs cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all duration-200 w-full max-w-full"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      AI Kunlik Salomatlik Rejasi
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      📅 {liveDateStr}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                    Real vaqt va bugungi sana bo‘yicha shaxsiy AI reja tuzish
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-0.5">
                <div className="font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-700 shadow-2xs">
                  {liveClockStr}
                </div>
                <span className="text-[9px] font-extrabold text-emerald-700">✨ Reja tuzish →</span>
              </div>
            </div>

            {/* ==================== DEMO BUDILNIK (ONLY FOR UNREGISTERED USERS, MAX 2 TRIES) ==================== */}
            {(!currentUser || !currentUser.is_profile_complete) && demoAlarmCount < 2 && (
              <div className="mt-3.5 relative overflow-hidden rounded-3xl border-2 border-purple-400/80 bg-gradient-to-br from-purple-700 via-indigo-700 to-rose-600 p-4 sm:p-5 text-white shadow-xl shadow-purple-600/20 transition-all duration-300">
                <div className="flex flex-col items-center text-center space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200 border border-white/25">
                    <AlarmClock className="h-3.5 w-3.5 text-amber-300 animate-bounce" />
                    <span>Yangi foydalanuvchilar uchun • {2 - demoAlarmCount} ta sinov qoldi</span>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase drop-shadow-xs">
                    ⏰ DEMO BUDILNIK
                  </h2>

                  <p className="text-[11px] sm:text-xs text-purple-100 max-w-md leading-relaxed font-medium">
                    Ilova qanday ishlashini ro‘yxatdan o‘tmasdan oldin his qilib ko‘ring! Ovozni pasaytirib bo‘lmaydigan va 3 ta jonli kamera vazifasi bilan o‘chadigan aqlli budilnik.
                  </p>

                  {demoAlarmPhase === 'idle' && (
                    <button
                      type="button"
                      onClick={handleStartDemoAlarm}
                      className="mt-1 w-full sm:w-auto min-w-[230px] inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-black text-purple-800 shadow-lg hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
                    >
                      <Zap className="h-4 w-4 fill-amber-400 text-orange-600 shrink-0" />
                      <span>DEMO BUDILNIKNI SINAB KO‘RISH (1 daqiqa)</span>
                    </button>
                  )}

                  {demoAlarmPhase === 'preparing' && (
                    <div className="w-full rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 p-3.5 text-center space-y-1.5 animate-pulse">
                      <div className="text-xs sm:text-sm font-black text-amber-300">
                        ⏳ Iltimos, biroz kuting, Demo Budilnik tayyorlanyapti...
                      </div>
                      <div className="text-[11px] font-bold text-white/90">
                        Budilnik vaqti avtomatik <b>{demoTargetTimeStr}</b> ga o‘rnatildi (vaqtni o‘zgartirib bo‘lmaydi)
                      </div>
                    </div>
                  )}

                  {demoAlarmPhase === 'counting' && (
                    <div className="w-full rounded-2xl bg-slate-950/55 backdrop-blur-md border border-white/30 p-3.5 text-center space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-100 px-1">
                        <span>🔒 Vaqt: <b>{demoTargetTimeStr}</b> (Avtomatik)</span>
                        <span className="text-amber-300 font-black">Chalinishiga qolgan vaqt:</span>
                      </div>
                      <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider">
                        00:{String(demoCountdownSec).padStart(2, '0')}
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000"
                          style={{ width: `${Math.max(4, ((60 - demoCountdownSec) / 60) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-amber-200 font-semibold">
                        Taymer 00:00 bo‘lishi bilan haqiqiy o‘chirib bo‘lmas budilnik chalinadi!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Mode Switcher Tabs (Scan Photo vs Search by Name) - 100% Fit & No Clipping */}
            <div
              className="mt-3.5 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/90 p-1 shadow-2xs w-full max-w-full"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('scanner');
                  triggerHaptic('light');
                }}
                className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-black transition cursor-pointer truncate ${
                  activeTab === 'scanner'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.tabScanPhoto}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('search');
                  triggerHaptic('light');
                }}
                className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-black transition cursor-pointer truncate ${
                  activeTab === 'search'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.tabSearchName}</span>
              </button>
            </div>

            {/* Smart Modules Quick Access Bar (Premium & Ultra) */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-full">
              {/* 1. AI Farmatsevt */}
              <button
                type="button"
                onClick={() => {
                  if (!ensureAuthenticated()) return;
                  if (currentUser?.plan !== 'premium' && currentUser?.plan !== 'ultra') {
                    setPlansModalOpen(true);
                    return;
                  }
                  setChatModalOpen(true);
                }}
                className="group relative flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-white p-2 text-left transition-all hover:border-emerald-400 hover:shadow-xs active:scale-98 cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-slate-900 truncate">AI Farmatsevt</span>
                    {currentUser?.plan === 'standard' && <Lock className="h-2.5 w-2.5 text-slate-400" />}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded block w-fit">
                    Premium
                  </span>
                </div>
              </button>

              {/* 2. Salomatlik & Yoshi Kattalar */}
              <button
                type="button"
                onClick={() => {
                  if (!ensureAuthenticated()) return;
                  if (currentUser?.plan !== 'premium' && currentUser?.plan !== 'ultra') {
                    setPlansModalOpen(true);
                    return;
                  }
                  setHealthModalOpen(true);
                }}
                className="group relative flex items-center gap-2 rounded-2xl border border-teal-200/80 bg-white p-2 text-left transition-all hover:border-teal-400 hover:shadow-xs active:scale-98 cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-slate-900 truncate">Salomatlik</span>
                    {currentUser?.plan === 'standard' && <Lock className="h-2.5 w-2.5 text-slate-400" />}
                  </div>
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded block w-fit">
                    Kattalar & Reja
                  </span>
                </div>
              </button>

              {/* 3. Ovqatlanish & Kaloriya */}
              <button
                type="button"
                onClick={() => {
                  if (!ensureAuthenticated()) return;
                  if (currentUser?.plan !== 'ultra') {
                    setPlansModalOpen(true);
                    return;
                  }
                  setFoodModalOpen(true);
                }}
                className="group relative flex items-center gap-2 rounded-2xl border border-orange-200/80 bg-white p-2 text-left transition-all hover:border-orange-400 hover:shadow-xs active:scale-98 cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Utensils className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-slate-900 truncate">Ovqatlanish</span>
                    {currentUser?.plan !== 'ultra' && <Lock className="h-2.5 w-2.5 text-slate-400" />}
                  </div>
                  <span className="text-[9px] font-bold text-orange-700 bg-orange-50 px-1 py-0.2 rounded block w-fit">
                    Ultra Kaloriya
                  </span>
                </div>
              </button>

              {/* 4. Aqlli Budilnik */}
              <button
                type="button"
                onClick={() => {
                  if (!ensureAuthenticated()) return;
                  if (currentUser?.plan !== 'ultra') {
                    setPlansModalOpen(true);
                    return;
                  }
                  setAlarmModalOpen(true);
                }}
                className="group relative flex items-center gap-2 rounded-2xl border border-purple-200/80 bg-white p-2 text-left transition-all hover:border-purple-400 hover:shadow-xs active:scale-98 cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <AlarmClock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-slate-900 truncate">Budilnik</span>
                    {currentUser?.plan !== 'ultra' && <Lock className="h-2.5 w-2.5 text-slate-400" />}
                  </div>
                  <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded block w-fit">
                    Ultra Missiya
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm font-medium text-rose-900">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Active View Content */}
        {activeTab === 'home' && (
          <HomeDashboardView
            user={currentUser}
            t={t}
            onNavigateTab={(tab) => {
              if (tab === 'sport') {
                handleOpenSport();
              } else if (tab === 'plans') {
                setPlansModalOpen(true);
              } else {
                setActiveTab(tab);
              }
              triggerHaptic('light');
            }}
            onOpenAiChat={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'premium' && currentUser?.plan !== 'ultra') {
                setPlansModalOpen(true);
                return;
              }
              setChatModalOpen(true);
            }}
            onOpenAlarm={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'ultra') {
                setPlansModalOpen(true);
                return;
              }
              setAlarmModalOpen(true);
            }}
            onOpenHealthPlan={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'premium' && currentUser?.plan !== 'ultra') {
                setPlansModalOpen(true);
                return;
              }
              setHealthModalOpen(true);
            }}
            onOpenFoodScan={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'ultra' && currentUser?.plan !== 'premium') {
                setPlansModalOpen(true);
                return;
              }
              setFoodModalOpen(true);
            }}
            onOpenPrescriptionScan={() => {
              setActiveTab('drugs');
              triggerHaptic('light');
            }}
            onOpenPlans={() => setPlansModalOpen(true)}
            triggerHaptic={triggerHaptic}
          />
        )}

        {activeTab === 'health' && (
          <HealthDashboardView
            user={currentUser}
            t={t}
            onOpenAiChat={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'premium' && currentUser?.plan !== 'ultra') {
                setPlansModalOpen(true);
                return;
              }
              setChatModalOpen(true);
            }}
            onOpenAlarm={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'ultra') {
                setPlansModalOpen(true);
                return;
              }
              setAlarmModalOpen(true);
            }}
            onOpenHealthPlan={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'premium' && currentUser?.plan !== 'ultra') {
                setPlansModalOpen(true);
                return;
              }
              setHealthModalOpen(true);
            }}
            onOpenFoodScan={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'ultra' && currentUser?.plan !== 'premium') {
                setPlansModalOpen(true);
                return;
              }
              setFoodModalOpen(true);
            }}
            onOpenPlans={() => setPlansModalOpen(true)}
            triggerHaptic={triggerHaptic}
          />
        )}

        {(activeTab === 'drugs' || activeTab === 'scanner' || activeTab === 'search') && (
          <DrugsAndScannerView
            user={currentUser}
            t={t}
            lang={lang}
            samples={samples}
            isLoading={isLoading}
            onScanFile={handleScanFile}
            onRunSample={handleRunSample}
            onSelectDrugId={handleSelectDrugId}
            onAiLookupQuery={handleAiLookupQuery}
            analysis={analysis}
            selectedMap={selectedMap}
            onSelectOption={(itemId, optionKey, analog) => {
              setSelectedMap((prev) => ({
                ...prev,
                [itemId]: { key: optionKey, analog },
              }));
              triggerHaptic('light');
            }}
            totalPrescribedUzs={totalPrescribedUzs}
            totalSelectedUzs={totalSelectedUzs}
            onShowPharmacist={() => setPharmacistModalOpen(true)}
            onShareTelegram={handleShareTelegram}
            onCopyChecklist={handleCopyChecklist}
            onResetAnalysis={() => {
              setAnalysis(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            triggerHaptic={triggerHaptic}
          />
        )}

        {activeTab === 'food' && (
          <NutritionView
            user={currentUser}
            t={t}
            onOpenFoodScan={() => {
              if (!ensureAuthenticated()) return;
              if (currentUser?.plan !== 'ultra' && currentUser?.plan !== 'premium') {
                setPlansModalOpen(true);
                return;
              }
              setFoodModalOpen(true);
            }}
            triggerHaptic={triggerHaptic}
          />
        )}

        {(activeTab === 'stats' || activeTab === 'history') && (
          <StatisticsView
            user={currentUser}
            t={t}
            lang={lang}
            historyEntries={history}
            onOpenHistoryEntry={(savedRes) => {
              applyNewAnalysis(savedRes, false);
              setActiveTab('drugs');
            }}
            onDeleteHistoryEntry={(id) => setHistory(removeHistoryEntry(id))}
            onClearHistory={() => {
              clearAllHistory();
              setHistory([]);
            }}
            triggerHaptic={triggerHaptic}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={currentUser}
            t={t}
            lang={lang}
            onChangeLang={handleLangChange}
            onOpenEditProfile={() => setProfileModalOpen(true)}
            onOpenLegalModal={(tab) => openLegalModal(tab)}
            onOpenPlans={() => setPlansModalOpen(true)}
            onLogout={handleLogout}
            onOpenOnboarding={() => setOnboardingOpen(true)}
            onGoalUpdated={(updated) => setCurrentUser(updated)}
            triggerHaptic={triggerHaptic}
          />
        )}

        {activeTab === 'about' && (
          <LandingSections
            t={t}
            stats={stats}
            disclaimer={DEFAULT_DISCLAIMERS[lang]}
          />
        )}


        {/* Full Web Landing Sections on Desktop / Web Scanner & Search Views */}
        {!isTelegramMiniApp && (activeTab === 'scanner' || activeTab === 'search') && (
          <div className="mt-12">
            <LandingSections
              t={t}
              stats={stats}
              disclaimer={DEFAULT_DISCLAIMERS[lang]}
            />
          </div>
        )}
      </main>

      {/* Platform Legal access is cleanly inside Profil -> Huquqlar & Shartlar */}

          {/* Mobile & Telegram Mini App Bottom Tab Navigation (Image 1 Style) */}
          {isCompactAppLayout && (
            <nav
              className={`fixed bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md pb-safe w-full max-w-full overflow-hidden shadow-lg ${
                previewTelegramMode ? 'max-w-md left-1/2 -translate-x-1/2' : 'left-0 right-0'
              }`}
            >
              <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1 gap-1">
                {[
                  { id: 'home', label: t.navHome, icon: HomeIcon },
                  { id: 'sport', label: t.navSport, icon: Dumbbell },
                  { id: 'health', label: t.navHealth, icon: HeartPulse },
                  { id: 'plans', label: t.navPlans, icon: Sparkles },
                  { id: 'profile', label: t.navProfile, icon: UserIcon },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        if (tab.id === 'sport') {
                          handleOpenSport();
                          return;
                        }
                        if (tab.id === 'plans') {
                          setPlansModalOpen(true);
                          triggerHaptic('light');
                          return;
                        }
                        setActiveTab(tab.id as ActiveTab);
                        triggerHaptic('light');
                      }}
                      className={`relative flex flex-col items-center justify-center py-1 text-[10px] sm:text-[11px] font-black transition cursor-pointer ${
                        active
                          ? 'text-blue-600'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <div className="relative">
                        <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5] text-blue-600' : ''}`} />
                      </div>
                      <span className="mt-0.5 truncate max-w-full font-bold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </>
      )}

      {/* Show to Pharmacist Modal */}
      {analysis && (
        <PharmacistModal
          open={pharmacistModalOpen}
          onClose={() => setPharmacistModalOpen(false)}
          items={analysis.items}
          selectedMap={selectedMap}
          totalSelectedUzs={totalSelectedUzs}
          totalSavingsUzs={totalSavingsUzs}
          disclaimer={analysis.disclaimer}
          t={t}
          lang={lang}
          onShareTelegram={handleShareTelegram}
          onCopyChecklist={handleCopyChecklist}
        />
      )}

      {/* User Registration & Telegram OTP Auth Gate */}
      <AuthGateModal
        t={t}
        lang={lang}
        isOpen={authModalOpen}
        onAuthSuccess={handleAuthSuccess}
        onClose={() => setAuthModalOpen(false)}
        triggerHaptic={triggerHaptic}
      />

      {/* User Profile & Medical Details Modal */}
      {currentUser && (
        <UserProfileModal
          t={t}
          lang={lang}
          isOpen={profileModalOpen}
          user={currentUser}
          onClose={() => setProfileModalOpen(false)}
          onUserUpdated={handleUserUpdated}
          onLogout={handleLogout}
          triggerHaptic={triggerHaptic}
        />
      )}

      {/* Subscription Plans & Checkout Modal */}
      <PlansCheckoutModal
        isOpen={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        user={currentUser}
        onPlanActivated={(updatedUser) => {
          setCurrentUser(updatedUser);
          saveUserLocally(updatedUser);
        }}
      />

      {/* AI Pharmacist Live & Voice Chat Modal */}
      <AIChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        currentUser={currentUser}
        onOpenPlans={() => setPlansModalOpen(true)}
      />

      {/* Personalized Health Routine & Elderly Care Modal */}
      <HealthAndElderlyModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        currentUser={currentUser}
        onOpenPlans={() => setPlansModalOpen(true)}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          saveUserLocally(updatedUser);
        }}
      />

      {/* AI Meal Nutrition & Calorie Scanner Modal */}
      <FoodScanModal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        currentUser={currentUser}
        onOpenPlans={() => setPlansModalOpen(true)}
      />

      {/* Ultra Wakeup Alarm & Camera Mission Modal */}
      <AlarmMissionModal
        isOpen={alarmModalOpen}
        onClose={() => {
          setAlarmModalOpen(false);
          setAlarmForceRinging(false);
          setIsDemoAlarmModalActive(false);
        }}
        currentUser={currentUser}
        onOpenPlans={() => setPlansModalOpen(true)}
        forceRinging={alarmForceRinging}
        isDemoMode={isDemoAlarmModalActive}
        onDemoCompleted={() => {
          setIsDemoAlarmModalActive(false);
        }}
        alarmTime={alarmTime}
        alarmEnabled={alarmEnabled}
        onAlarmSettingsChange={(newTime, newEnabled) => {
          setAlarmTime(newTime);
          setAlarmEnabled(newEnabled);
          localStorage.setItem('doriscan_alarm_time', newTime);
          localStorage.setItem('doriscan_alarm_enabled', newEnabled ? 'true' : 'false');
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev, alarm_time: newTime, alarm_enabled: newEnabled };
            saveUserLocally(next);
            return next;
          });
          if (currentUser?.token) {
            updateProfile(currentUser.token, { alarm_time: newTime, alarm_enabled: newEnabled })
              .then((updated) => {
                if (updated) {
                  setCurrentUser(updated);
                  saveUserLocally(updated);
                }
              })
              .catch(() => {});
          }
        }}
      />

      {/* Legal & Information Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        activeTab={activeLegalTab}
        onClose={() => setLegalModalOpen(false)}
        onOpenPlans={() => {
          setLegalModalOpen(false);
          setPlansModalOpen(true);
        }}
        onOpenOnboarding={() => setOnboardingOpen(true)}
      />

      {/* Premium Welcome Page & Interactive Onboarding System */}
      <WelcomePageModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onStartNow={() => {
          setOnboardingOpen(false);
          if (!currentUser) {
            setAuthModalOpen(true);
          }
        }}
        onOpenPlans={() => {
          setOnboardingOpen(false);
          setPlansModalOpen(true);
        }}
        triggerHaptic={triggerHaptic}
      />

      {/* ==================== MEDICATION ALARM MODAL WITH "ICHDIM" BUTTON ==================== */}
      {activeMedAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-purple-500 text-center space-y-4 animate-in zoom-in-95">
            <div className="h-16 w-16 rounded-3xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center text-3xl shadow-lg border border-purple-200 animate-bounce">
              💊
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Dori ichish vaqti bo'ldi!
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {activeMedAlarm.drugName}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Miqdori: <span className="text-purple-700 font-black">{activeMedAlarm.dose}</span>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Dorini o'z vaqtida ichish sog'liq uchun juda muhimdir. Qabul qilganingizdan so'ng «Ichdim» tugmasini bosing.
            </p>

            <button
              type="button"
              onClick={handleMarkMedTaken}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base shadow-xl shadow-emerald-600/30 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Ichdim ✓</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
