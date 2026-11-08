import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Heart,
  Sparkles,
  Timer,
  ChevronRight,
  ShieldCheck,
  Activity,
  Flame,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  Dumbbell,
} from 'lucide-react';
import type { UserProfile, WorkoutPlanResponse, ExerciseItem } from '../../types/api';
import { getWorkoutPlan } from '../../services/apiClient';

export const getExerciseEmoji = (iconOrName?: string, isYoga?: boolean): string => {
  if (!iconOrName) return isYoga ? '🧘' : '🏃';
  const s = iconOrName.toLowerCase();
  if (s.includes('warm') || s.includes('qizib') || s.includes('yurish') || s.includes('walk')) return '🏃';
  if (s.includes('squat') || s.includes('o\'tirib') || s.includes('oyoq') || s.includes('tizza')) return '🦵';
  if (s.includes('push') || s.includes('otjim') || s.includes('kuch') || s.includes('biceps')) return '💪';
  if (s.includes('plank') || s.includes('press') || s.includes('qorin')) return '🛡️';
  if (s.includes('lung') || s.includes('qadam')) return '🚶';
  if (s.includes('jump') || s.includes('sakrash')) return '⚡';
  if (s.includes('mushuk') || s.includes('sigir') || s.includes('marjary')) return '🐈';
  if (s.includes('bola') || s.includes('bala') || s.includes('child')) return '🌸';
  if (s.includes('tog') || s.includes('tadasana') || s.includes('mountain')) return '⛰️';
  if (s.includes('nafas') || s.includes('pranayama') || s.includes('tinch')) return '🫁';
  if (s.includes('stretch') || s.includes('cho\'z') || s.includes('egil') || s.includes('yoga')) return '🧘';
  if (/\p{Extended_Pictographic}/u.test(iconOrName)) return iconOrName;
  return isYoga ? '🧘' : '🏃';
};

interface AIWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutType: 'fitness' | 'yoga';
  user: UserProfile | null;
  triggerHaptic?: (type?: 'light' | 'success') => void;
  onCompleteWorkout?: (kcal: number, minutes: number) => void;
}

export const AIWorkoutModal: React.FC<AIWorkoutModalProps> = ({
  isOpen,
  onClose,
  workoutType,
  user,
  triggerHaptic,
  onCompleteWorkout,
}) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active workout state
  const [activeStep, setActiveStep] = useState<number>(-1); // -1: overview, >=0: exercise index
  const [timerSeconds, setTimerSeconds] = useState<number>(45);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  const isYoga = workoutType === 'yoga';

  // Load plan when modal opens
  useEffect(() => {
    if (!isOpen) {
      setActiveStep(-1);
      setIsTimerRunning(false);
      return;
    }

    const fetchPlan = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const token = user?.token || '';
        const res = await getWorkoutPlan(
          {
            workout_type: workoutType,
            age: user?.age || (isYoga ? 55 : 28),
            duration_min: isYoga ? 25 : 20,
            fitness_level: 'boshlovchi',
            health_conditions: isYoga ? "Bo'g'imlarga xavfsiz, o'murtqa va nafas mashqlari" : "Uy sharoitida, bo'g'imlarga xavfsiz",
          },
          token
        );
        setPlan(res);
      } catch (err: any) {
        setErrorMsg(err?.message || "Mashg'ulot rejasini yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [isOpen, workoutType, user?.token, user?.age, isYoga]);

  // 1-second continuous countdown interval (tick down smoothly every second)
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // When timer reaches 0, transition to rest or next exercise
  useEffect(() => {
    if (timerSeconds !== 0 || !isTimerRunning) return;

    triggerHaptic?.('success');

    if (!isResting && plan && activeStep < plan.exercises.length) {
      // Switch to rest interval
      setIsResting(true);
      const rest = plan.exercises[activeStep]?.rest_sec || 20;
      setTimerSeconds(rest);
    } else if (isResting && plan) {
      // Move to next exercise
      setIsResting(false);
      const next = activeStep + 1;
      if (next < plan.exercises.length) {
        setActiveStep(next);
        setTimerSeconds(45);
      } else {
        // Completed
        setActiveStep(plan.exercises.length);
        setIsTimerRunning(false);
        onCompleteWorkout?.(plan.estimated_kcal, plan.total_duration_min);
      }
    }
  }, [timerSeconds, isTimerRunning, isResting, activeStep, plan, triggerHaptic, onCompleteWorkout]);

  if (!isOpen) return null;

  const currentExercise: ExerciseItem | undefined =
    plan && activeStep >= 0 && activeStep < plan.exercises.length
      ? plan.exercises[activeStep]
      : undefined;

  const handleStartWorkout = () => {
    triggerHaptic?.('light');
    setActiveStep(0);
    setTimerSeconds(45);
    setIsResting(false);
    setIsTimerRunning(true);
  };

  const handleNextExercise = () => {
    if (!plan) return;
    triggerHaptic?.('light');
    if (!completedExercises.includes(activeStep)) {
      setCompletedExercises([...completedExercises, activeStep]);
    }
    const next = activeStep + 1;
    if (next < plan.exercises.length) {
      setActiveStep(next);
      setTimerSeconds(45);
      setIsResting(false);
      setIsTimerRunning(true);
    } else {
      setActiveStep(plan.exercises.length);
      onCompleteWorkout?.(plan.estimated_kcal, plan.total_duration_min);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className={`relative w-full max-w-lg my-auto overflow-hidden rounded-3xl bg-white shadow-2xl border ${isYoga ? 'border-purple-200' : 'border-blue-200'} flex flex-col max-h-[92vh]`}>
        
        {/* HEADER */}
        <div className={`px-5 py-4 text-white flex items-center justify-between shrink-0 ${isYoga ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800'}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold shadow-inner">
              {isYoga ? '🧘' : '🏋️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isYoga ? "AI Tinchlantiruvchi Yog'a" : "AI Shaxsiy Fitness"}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-white">
                  {isYoga ? 'Nafas & Bo`g`im' : 'Kuch & Chidamlilik'}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">
                {isYoga ? "Keksalar va bo'g'im salomatligi uchun xavfsiz" : "Shaxsiy jismoniy holatingizga moslashtirilgan"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className={`h-10 w-10 animate-spin mx-auto ${isYoga ? 'text-purple-600' : 'text-blue-600'}`} />
              <div className="text-sm font-black text-slate-800">
                AI Murabbiy siz uchun xavfsiz mashg'ulot rejasini tuzmoqda...
              </div>
              <p className="text-xs text-slate-400">
                Yoshingiz va salomatlik holatingiz inobatga olinmoqda
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {plan && activeStep === -1 && (
            /* OVERVIEW / PREVIEW OF WORKOUT */
            <div className="space-y-4">
              {/* Title & Quick Stats */}
              <div className={`p-4 rounded-3xl border ${isYoga ? 'bg-purple-50/70 border-purple-200' : 'bg-blue-50/70 border-blue-200'}`}>
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {plan.title}
                </h4>
                <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-slate-100">
                    <Timer className="h-3.5 w-3.5 text-blue-600" />
                    {plan.total_duration_min} daqiqa
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-slate-100">
                    <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                    ~{plan.estimated_kcal} kkal
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl shadow-2xs border border-slate-100">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Xavfsiz
                  </span>
                </div>
              </div>

              {/* Safety Precautions (especially for seniors/joints) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  Xavfsizlik va Salomatlik Qoidalari:
                </span>
                <ul className="text-xs text-amber-950 space-y-1 pl-1">
                  {plan.safety_precautions.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-700 font-bold">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exercise List Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 px-1">
                  <span>MASHQLAR KETMA-KETLIGI ({plan.exercises.length} ta)</span>
                  <span>SUR'AT</span>
                </div>

                <div className="space-y-2">
                  {plan.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-lg shrink-0">
                          {getExerciseEmoji(ex.animation_icon || ex.name, isYoga)}
                        </span>
                        <div>
                          <div className={`font-black text-slate-900 ${isYoga ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}>
                            {ex.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {ex.focus_muscle} • Dam olish: {ex.rest_sec}s
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl shrink-0">
                        {ex.duration_or_reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start CTA Button */}
              <button
                type="button"
                onClick={handleStartWorkout}
                className={`w-full py-4 rounded-2xl text-white font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 ${
                  isYoga
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-600/30 hover:from-purple-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Mashg'ulotni Boshlash</span>
              </button>
            </div>
          )}

          {/* ACTIVE RUNNING WORKOUT */}
          {plan && activeStep >= 0 && activeStep < plan.exercises.length && currentExercise && (
            <div className="space-y-5 animate-in fade-in">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-600">
                  <span>Mashq {activeStep + 1} / {plan.exercises.length}</span>
                  <span>{isResting ? "⏳ Dam olish" : "🔥 Harakat vaqti"}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${isResting ? 'bg-amber-500' : isYoga ? 'bg-purple-600' : 'bg-blue-600'}`}
                    style={{ width: `${((activeStep + (isResting ? 0.5 : 0)) / plan.exercises.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Central Exercise Card with Large Clear Typography (Ideal for seniors in Yoga) */}
              <div className={`p-6 rounded-3xl border-2 text-center space-y-4 shadow-lg ${
                isResting
                  ? 'bg-amber-50/80 border-amber-300'
                  : isYoga
                  ? 'bg-gradient-to-b from-purple-50/80 via-white to-indigo-50/50 border-purple-300'
                  : 'bg-gradient-to-b from-blue-50/80 via-white to-indigo-50/50 border-blue-300'
              }`}>
                {/* Big Animated Icon / Character */}
                <div className="relative inline-flex items-center justify-center">
                  <div className={`h-24 w-24 rounded-3xl flex items-center justify-center text-5xl shadow-md border-2 ${
                    isResting ? 'bg-amber-100 border-amber-300' : isYoga ? 'bg-purple-100 border-purple-300 animate-pulse' : 'bg-blue-100 border-blue-300'
                  }`}>
                    {isResting ? '💧' : getExerciseEmoji(currentExercise.animation_icon || currentExercise.name, isYoga)}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {isResting ? "Tana tiklanishi va suv ichish" : currentExercise.focus_muscle}
                  </span>
                  <h3 className={`font-black text-slate-900 mt-1 leading-tight ${isYoga ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                    {isResting ? "Dam oling va nafasni rostlang" : currentExercise.name}
                  </h3>
                </div>

                {/* Big Circular / Bold Countdown Timer */}
                <div className="flex items-center justify-center gap-3">
                  <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                    isResting ? 'text-amber-600' : isYoga ? 'text-purple-700' : 'text-blue-600'
                  }`}>
                    00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Me'yor: <span className="text-slate-800 font-black">{currentExercise.duration_or_reps}</span>
                </div>

                {/* Instruction - High Contrast, Legible, Senior Accessible */}
                <div className={`p-4 rounded-2xl text-left border ${
                  isYoga ? 'bg-white border-purple-100 text-slate-800' : 'bg-white border-blue-100 text-slate-700'
                }`}>
                  <span className="text-[11px] font-black uppercase text-blue-700 block mb-1">
                    To'g'ri bajarish usuli:
                  </span>
                  <p className={`font-medium leading-relaxed ${isYoga ? 'text-sm sm:text-base text-slate-900' : 'text-xs sm:text-sm text-slate-700'}`}>
                    {currentExercise.instruction}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-md ${
                    isTimerRunning
                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      : isYoga
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                  <span>{isTimerRunning ? "To'xtatib turish" : "Davom ettirish"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextExercise}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer transition"
                >
                  <span>Keyingi mashq</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* COMPLETED WORKOUT SCREEN */}
          {plan && activeStep >= plan.exercises.length && (
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
              <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-4xl shadow-lg border-2 border-emerald-300">
                🎉
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Mashg'ulot Muvaffaqiyatli Yakunlandi!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
                  Siz salomatligingiz uchun ajoyib qadam tashladingiz. Tana tetiklashdi va kaloriyalar sarflandi!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200">
                  <div className="text-[11px] font-bold text-orange-600">Sarflangan energiya</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">~{plan.estimated_kcal} kkal</div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="text-[11px] font-bold text-blue-600">Mashg'ulot vaqti</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{plan.total_duration_min} daqiqa</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-xs py-3.5 mx-auto rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition cursor-pointer"
              >
                Natijani Saqlash va Chiqish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
