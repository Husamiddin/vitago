import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  Sparkles,
  Lock,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  Clock,
  ShieldAlert,
  Loader2,
  Zap,
  RefreshCw,
  Video,
} from 'lucide-react';
import type { UserProfile } from '../../types/api';
import { verifyAlarmMission } from '../../services/apiClient';

interface AlarmMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenPlans: () => void;
  forceRinging?: boolean;
  isDemoMode?: boolean;
  onDemoCompleted?: () => void;
  alarmTime?: string;
  alarmEnabled?: boolean;
  onAlarmSettingsChange?: (time: string, enabled: boolean) => void;
}

export const AlarmMissionModal: React.FC<AlarmMissionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenPlans,
  forceRinging = false,
  isDemoMode = false,
  onDemoCompleted,
  alarmTime: propAlarmTime,
  alarmEnabled: propAlarmEnabled,
  onAlarmSettingsChange,
}) => {
  const [alarmTime, setAlarmTime] = useState(() => {
    return propAlarmTime || localStorage.getItem('doriscan_alarm_time') || currentUser?.alarm_time || '07:00';
  });
  const [alarmEnabled, setAlarmEnabled] = useState(() => {
    if (typeof propAlarmEnabled === 'boolean') return propAlarmEnabled;
    const saved = localStorage.getItem('doriscan_alarm_enabled');
    if (saved !== null) return saved !== 'false';
    return currentUser?.alarm_enabled ?? true;
  });

  const [isRinging, setIsRinging] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: rakvina/chombirak, 2: tish yuvish, 3: tetik yuz
  const [missionComplete, setMissionComplete] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [stepTimer, setStepTimer] = useState(180); // 3 minutes grace period
  const [verifying, setVerifying] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<number | null>(null);
  const antiMuteIntervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isEligible = currentUser?.plan === 'ultra' || isDemoMode;

  // Sync props when updated from parent
  useEffect(() => {
    if (propAlarmTime) setAlarmTime(propAlarmTime);
  }, [propAlarmTime]);

  useEffect(() => {
    if (typeof propAlarmEnabled === 'boolean') setAlarmEnabled(propAlarmEnabled);
  }, [propAlarmEnabled]);

  // Handle external force ringing trigger
  useEffect(() => {
    if (forceRinging && !isRinging && isEligible) {
      startRinging();
    }
  }, [forceRinging, isRinging, isEligible]);

  const updateAlarmSettings = (newTime: string, newEnabled: boolean) => {
    setAlarmTime(newTime);
    setAlarmEnabled(newEnabled);
    localStorage.setItem('doriscan_alarm_time', newTime);
    localStorage.setItem('doriscan_alarm_enabled', newEnabled ? 'true' : 'false');
    onAlarmSettingsChange?.(newTime, newEnabled);
  };

  // Check alarm time vs current wall clock time every 5 seconds
  useEffect(() => {
    if (!alarmEnabled || isRinging || !isEligible) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (currentHHMM === alarmTime && !isRinging) {
        startRinging();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [alarmEnabled, alarmTime, isRinging, isEligible]);

  // Grace timer during mission: 3 minutes max before alarm resumes
  useEffect(() => {
    if (!isRinging || missionComplete) return;

    timerRef.current = window.setInterval(() => {
      setStepTimer((prev) => {
        if (prev <= 1) {
          playLoudAlarm();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRinging, missionComplete]);

  // Clean up camera on unmount or when modal is closed
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (targetFacing?: 'environment' | 'user') => {
    stopCamera();
    const facing = targetFacing || (currentStep === 3 ? 'user' : 'environment');
    setCameraFacing(facing);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      // Fallback try without specific facingMode constraint
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (e2: any) {
        setFeedbackMsg(`Kameraga ulanishda xatolik: ${err?.message || "Kamera ruxsatini yoqing"}`);
      }
    }
  };

  const toggleFacingMode = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const playLoudAlarm = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/alarm.mp3');
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;
    audio.volume = 1.0;
    audio.muted = false;

    // Anti-Mute Protection: if volume is decreased or muted, force it back to 1.0
    audio.onvolumechange = () => {
      if (audio.volume < 1.0) audio.volume = 1.0;
      if (audio.muted) audio.muted = false;
    };

    // If audio is paused while ringing and mission incomplete, restart immediately
    audio.onpause = () => {
      if (!missionComplete) {
        setTimeout(() => {
          audio.play().catch(() => {});
        }, 50);
      }
    };

    audio.currentTime = 0;
    audio.play().catch(() => {});

    // Active anti-mute watchdog ticking every 150ms: forces volume to 1.0 and unmutes
    if (antiMuteIntervalRef.current) clearInterval(antiMuteIntervalRef.current);
    antiMuteIntervalRef.current = window.setInterval(() => {
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.muted = false;
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([1000, 200, 1000, 200]);
        } catch {}
      }
    }, 200);
  };

  const pauseAlarm = () => {
    if (antiMuteIntervalRef.current) {
      clearInterval(antiMuteIntervalRef.current);
      antiMuteIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stopAlarmPermanently = () => {
    if (antiMuteIntervalRef.current) {
      clearInterval(antiMuteIntervalRef.current);
      antiMuteIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
    stopCamera();
    setIsRinging(false);
    setMissionComplete(true);
    if (isDemoMode) {
      onDemoCompleted?.();
    }
  };

  const startRinging = () => {
    setIsRinging(true);
    setCurrentStep(1);
    setMissionComplete(false);
    setStepTimer(180);
    setFeedbackMsg("⏰ Budilnik chalindi! Xamomdagi cho'mbirakni kameraga ko'rsating!");

    if ('wakeLock' in navigator) {
      try {
        (navigator as any).wakeLock?.request('screen').catch(() => {});
      } catch {
        // ignore
      }
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("⏰ VitaGo Budilnik: Uyg'onish vaqti!", {
          body: "Cho'mbirak, tish yuvish va tetik yuz rasmini kameradan ko'rsatib budilnikni o'chiring!",
          icon: '/favicon.png',
        });
      } catch {
        // ignore
      }
    }

    playLoudAlarm();
    setTimeout(() => {
      startCamera('environment');
    }, 300);
  };

  const handleCaptureFromVideo = async () => {
    if (!videoRef.current) {
      setFeedbackMsg("Kamera hali to'liq yuklanmadi. Biroz kuting yoki kamerani qayta yoqing.");
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setFeedbackMsg("Kamera kadrini olib bo'lmadi. Kamerani yoqilishini kuting.");
      return;
    }

    // Capture direct video frame to canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);

    pauseAlarm();
    setVerifying(true);
    setFeedbackMsg("AI suratni tekshirmoqda...");

    try {
      const token = currentUser?.token || '';
      const res = await verifyAlarmMission(currentStep, base64, token);

      if (res.passed) {
        if (res.mission_completed || currentStep === 3) {
          stopAlarmPermanently();
          setFeedbackMsg("🎉 Tabriklaymiz! Siz barcha 3 ta vazifani bajardingiz va to'liq uyg'ondingiz! Budilnik o'chirildi.");
        } else {
          const nextStep = res.next_step || currentStep + 1;
          setCurrentStep(nextStep);
          setStepTimer(180);
          setFeedbackMsg(res.message);

          // If transitioning to Step 3 (face), automatically switch to front camera!
          if (nextStep === 3) {
            startCamera('user');
          }
        }
      } else {
        setFeedbackMsg(`❌ AI qabul qilmadi: ${res.message}. Kamerani to'g'irlab qaytadan oling!`);
        playLoudAlarm();
      }
    } catch (err: any) {
      console.warn("Alarm mission capture error:", err);
      setFeedbackMsg("Kamerani to'g'irlab, xomomdagi rakvina yoki vazifa obyektini aniqroq ko'rsatib qaytadan oling!");
      playLoudAlarm();
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-5 py-4 text-white shrink-0 ${
            isRinging
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 animate-pulse'
              : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs shadow-inner">
              {isRinging ? <BellRing className="h-6 w-6 animate-bounce" /> : <Bell className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  {isRinging ? "⏰ BUDILNIK CHALINDI!" : "Ultra Budilnik & Uyg'onish Missiyasi"}
                </h3>
                <span className="rounded-md bg-amber-400 text-amber-950 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Ultra
                </span>
              </div>
              <p className="text-xs text-purple-100 font-medium">
                O'chirib bo'lmaydigan aqlli ertalabki budilnik
              </p>
            </div>
          </div>

          {!isRinging ? (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-lg text-white tracking-wider">
              O'CHIRIB BO'LMAYDI
            </div>
          )}
        </div>

        {/* Lock screen if not Ultra */}
        {!isEligible ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 mb-4 shadow-sm">
              <Lock className="h-8 w-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-1">
              Aqlli Budilnik — Ultra imkoniyat
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mb-5 leading-relaxed">
              Bu budilnik oddiy emas: u jiringlaganda xamomdagi cho'mbirak, tish yuvish va tetik yuz rasmini faqat jonli kameradan ko'rsatmaguningizcha hech qachon o'chmaydi!
            </p>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
                onOpenPlans();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ultra rejasiga o'tish (40 000 so'm/oy)</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Strict Warning Alert */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-amber-950 mb-0.5">
                  ⚠️ QAT'IY QOIDA:
                </strong>
                Budilnik chalinganda fayl yoki galereyadan rasm tanlash imkoni mutlaqo yo'q! Faqat jonli kamera ochiladi va AI tasdiqlaganidan so'nggina o'chadi.
              </div>
            </div>

            {/* NORMAL STATE: Set Alarm Time & Settings */}
            {!isRinging ? (
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 block">
                        Budilnik vaqti:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Har kuni ertalab belgilangan vaqtda chalish
                      </span>
                    </div>
                    <input
                      type="time"
                      value={alarmTime}
                      onChange={(e) => updateAlarmSettings(e.target.value, alarmEnabled)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-base font-black text-slate-900 shadow-2xs focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Budilnik faol:</span>
                    <button
                      type="button"
                      onClick={() => updateAlarmSettings(alarmTime, !alarmEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        alarmEnabled ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          alarmEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 3 Steps Overview */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <span className="text-xs font-black text-slate-900 block">
                    Budilnikni o'chirish uchun 3 ta vazifa:
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-950">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-black text-[10px]">
                        1
                      </span>
                      <span>Xamomdagi cho'mbirak (rakvina) rasmi</span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-950">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-black text-[10px]">
                        2
                      </span>
                      <span>Tish yuvayotgan holat rasmi (pasta & cho'tka)</span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-950">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-black text-[10px]">
                        3
                      </span>
                      <span>Tiniq, tetik uyg'ongan yuz rasmi</span>
                    </div>
                  </div>
                </div>

                {/* Test button to try alarm right now */}
                <button
                  type="button"
                  onClick={startRinging}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 py-3.5 text-xs font-black text-white shadow-md shadow-rose-500/20 hover:from-rose-700 hover:to-amber-700 transition cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Budilnik va Jonli Kamera Missiyasini Sinash</span>
                </button>
              </div>
            ) : (
              /* ALARM ACTIVELY RINGING: MISSION ENFORCEMENT WITH DIRECT CAMERA VIEWFINDER */
              <div className="space-y-4 animate-in fade-in">
                {/* Timer countdown for this mission step */}
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                    {Math.floor(stepTimer / 60)}:{String(stepTimer % 60).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] font-bold text-rose-800 mt-0.5">
                    Surat ko'rsatish uchun qolgan vaqt (3 daqiqadan oshsa yana ovoz kuchayadi!)
                  </div>
                </div>

                {/* Anti-Mute Active Banner */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>🔇 Ovozni pasaytirib bo'lmaydi! Faqat jonli surat olinganda to'xtaydi.</span>
                </div>

                {/* Current Active Mission */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-300 font-extrabold uppercase tracking-wider text-[10px]">
                      Vazifa {currentStep}/3
                    </span>
                    <span className="bg-purple-600/60 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      {currentStep === 1
                        ? "Cho'mbirak (Rakvina)"
                        : currentStep === 2
                        ? "Tish yuvish"
                        : "Tetik yuz"}
                    </span>
                  </div>

                  <h4 className="text-sm font-black leading-snug">
                    {currentStep === 1 && "1. Xamomga boring va cho'mbirakni (rakvinani) kameraga qarating:"}
                    {currentStep === 2 && "2. Tishingizni yuvayotganingizni kameraga ko'rsating:"}
                    {currentStep === 3 && "3. Tiniq, uyg'oq yuzingizni to'liq kameraga qarating:"}
                  </h4>

                  {/* LIVE CAMERA VIEWFINDER (NO FILE PICKER!) */}
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-emerald-500/40 shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Camera Overlay Guide */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                      {currentStep === 3 ? (
                        <div className="w-48 h-56 rounded-full border-2 border-dashed border-emerald-400/80 bg-white/5 backdrop-blur-[0.5px] flex items-center justify-center">
                          <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md">
                            Yuzingizni doira ichiga oling
                          </span>
                        </div>
                      ) : (
                        <div className="w-56 h-48 rounded-2xl border-2 border-dashed border-emerald-400/80 bg-white/5 backdrop-blur-[0.5px] flex items-center justify-center">
                          <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md text-center">
                            {currentStep === 1 ? "Cho'mbirakni to'g'irlang" : "Tish cho'tkasini ko'rsating"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Facing Mode Switcher Button on top corner */}
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition cursor-pointer"
                      title="Oldi / Orqa kameraga o'tish"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* If camera is not active yet, button to activate */}
                  {!isCameraActive && (
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3 text-xs font-bold text-white border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Video className="h-4 w-4 text-emerald-400" />
                      <span>Kamerani yoqish</span>
                    </button>
                  )}

                  {/* SNAPSHOT & VERIFY BUTTON (100% LIVE CAMERA ONLY, ZERO GALLERY ACCESS) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleCaptureFromVideo}
                      disabled={verifying}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 px-4 text-xs font-black text-white hover:from-emerald-600 hover:to-teal-600 cursor-pointer shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>AI kadrni tekshirmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-5 w-5" />
                          <span>Suratga olish & AI tekshiruviga yuborish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {feedbackMsg && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs leading-relaxed font-semibold ${
                      feedbackMsg.includes('❌') || feedbackMsg.includes('Xatolik')
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : feedbackMsg.includes('🎉') || feedbackMsg.includes('Ajoyib') || feedbackMsg.includes('Tabriklaymiz')
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    {feedbackMsg}
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
