import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Loader2,
  Mic,
  MicOff,
} from 'lucide-react';
import type { AIChatMessage, UserProfile } from '../../types/api';
import { askAIChat } from '../../services/apiClient';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenPlans: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenPlans,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      text: "Assalomu alaykum! Men VitaGo AI shaxsiy farmatsevtingizman. Dori vositalari, ularning dozasi, nojo'ya ta'sirlari yoki muqobil analoglari bo'yicha savollaringiz bo'lsa, bemalol so'rang.",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isEligible = currentUser?.plan === 'premium' || currentUser?.plan === 'ultra';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Preload speech synthesis voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoices;
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  if (!isOpen) return null;

  // Clean text from markdown for natural speech
  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .trim();
  };

  // Robust speech synthesis for Uzbek / Russian
  const speakText = (text: string, gender: 'male' | 'female') => {
    if (!('speechSynthesis' in window)) {
      alert("Qurilmangizda ovozli o'qish funksiyasi qo'llab-quvvatlanmaydi.");
      return;
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    window.speechSynthesis.cancel();

    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(clean);
        const voices = window.speechSynthesis.getVoices();

        let chosenVoice = voices.find((v) =>
          gender === 'female'
            ? v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('irina') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('victoria')
            : v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('pavel') ||
              v.name.toLowerCase().includes('dmitri')
        );

        if (!chosenVoice) {
          chosenVoice =
            voices.find((v) => v.lang.startsWith('uz') || v.lang.startsWith('ru') || v.lang.startsWith('tr')) ||
            voices[0];
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
          utterance.lang = chosenVoice.lang || 'ru-RU';
        } else {
          utterance.lang = 'ru-RU';
        }

        utterance.pitch = gender === 'female' ? 1.15 : 0.9;
        utterance.rate = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
          console.error("SpeechSynthesis error:", e);
          setIsSpeaking(false);
        };

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis failed:", err);
        setIsSpeaking(false);
      }
    }, 50);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg: AIChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const token = currentUser?.token || '';
      const res = await askAIChat(text, messages, voiceGender, token);
      const assistantMsg: AIChatMessage = { role: 'assistant', text: res.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(res.reply, voiceGender);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Kechirasiz, xatolik yuz berdi: ${err?.message || 'Iltimos, qayta urinib ko\'ring.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API speech-to-text
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Kechirasiz, brauzeringiz ovozli kiritishni (SpeechRecognition) qo'llab-quvvatlamaydi.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
      <div className="relative w-full max-w-xl h-[88vh] max-h-[680px] rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shadow-inner">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold tracking-tight">AI Farmatsevt Suxbati</h3>
                <span className="rounded-md bg-amber-400/90 text-amber-950 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider">
                  Premium
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                Dori-darmonlar bo'yicha 24/7 ovozli va matnli konsultatsiya
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Voice gender selector & audio status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200/70 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Ovoz turi:</span>
            <button
              type="button"
              onClick={() => {
                setVoiceGender('female');
                stopSpeaking();
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                voiceGender === 'female'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              👩 Ayol ovozi
            </button>
            <button
              type="button"
              onClick={() => {
                setVoiceGender('male');
                stopSpeaking();
              }}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                voiceGender === 'male'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              👨 Erkak ovozi
            </button>
          </div>

          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md hover:bg-rose-100 transition"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Ovozni to'xtatish</span>
            </button>
          )}
        </div>

        {/* Lock Overlay if user does not have Premium/Ultra */}
        {!isEligible ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4 shadow-sm">
              <Lock className="h-8 w-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mb-1">
              AI Farmatsevt — Premium imkoniyat
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mb-5 leading-relaxed">
              O'zbek tilida erkin ovozli suxbat (ayol va erkak ovozlari) hamda dori-darmonlar bo'yicha cheksiz maslahat olish faqat <strong>Premium</strong> va <strong>Ultra</strong> rejimlarida mavjud.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPlans();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-800 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Rejani yangilash (15 000 so'm/oy)</span>
            </button>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, idx) => {
                const isAssistant = m.role === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAssistant && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-100 text-slate-900 rounded-tl-xs'
                          : 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      {isAssistant && (
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => speakText(m.text, voiceGender)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>Tinglash</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {!isAssistant && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl w-fit">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>AI Farmatsevt javob tayyorlamoqda...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                    isListening
                      ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={isListening ? "Ovoz yozish to'xtatish" : 'Ovoz bilan gapirish'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Dori nomi, dozasi yoki alomatlar bo'yicha so'rang..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
