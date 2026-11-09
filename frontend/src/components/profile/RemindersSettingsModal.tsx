import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  Smartphone,
  Calendar,
  AlertCircle,
  ExternalLink,
  Trash2,
  Plus,
  Globe,
  HeartPulse,
  Activity,
  Megaphone,
} from 'lucide-react';
import type { UserProfile } from '../../types/api';
import {
  isPushSupported,
  getPushPermissionState,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from '../../services/pushNotificationService';

interface RemindersSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  triggerHaptic?: (style?: 'light' | 'medium' | 'heavy') => void;
}

interface NotificationPrefs {
  is_telegram_connected: boolean;
  telegram_id: number | null;
  notify_health: boolean;
  notify_sport: boolean;
  notify_general: boolean;
  notify_in_app: boolean;
  notify_web_push: boolean;
  notify_quiet_hours_start: string;
  notify_quiet_hours_end: string;
  notify_detailed: boolean;
}

interface ScheduledReminderItem {
  id: number;
  category: string;
  title: string;
  message: string;
  scheduled_for: string;
  delivery_channel: string;
  status: string;
  delivered_at: string | null;
  created_at: string;
}

export const RemindersSettingsModal: React.FC<RemindersSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  triggerHaptic,
}) => {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    is_telegram_connected: Boolean(currentUser?.telegram_id),
    telegram_id: currentUser?.telegram_id || null,
    notify_health: true,
    notify_sport: true,
    notify_general: true,
    notify_in_app: true,
    notify_web_push: true,
    notify_quiet_hours_start: '22:00',
    notify_quiet_hours_end: '08:00',
    notify_detailed: false,
  });

  const [loading, setLoading] = useState(false);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [webPushLoading, setWebPushLoading] = useState(false);
  const [webPushPermission, setWebPushPermission] = useState<NotificationPermission>('default');
  const [webPushError, setWebPushError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ScheduledReminderItem[]>([]);
  const [showNewReminderForm, setShowNewReminderForm] = useState(false);

  // New reminder form state
  const [newTitle, setNewTitle] = useState('Dori ichish vaqti');
  const [newCategory, setNewCategory] = useState<'health' | 'sport' | 'general'>('health');
  const [newTime, setNewTime] = useState('20:00');
  const [newChannel, setNewChannel] = useState<'all' | 'web_push' | 'telegram' | 'in_app'>('all');

  const token = currentUser?.token;

  useEffect(() => {
    if (isPushSupported()) {
      setWebPushPermission(getPushPermissionState());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !token) return;

    // Load preferences
    fetch('/api/v1/auth/notification-preferences', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.is_telegram_connected === 'boolean') {
          setPrefs(data);
        }
      })
      .catch(() => {});

    // Load user's scheduled reminders
    fetch('/api/v1/notifications/my-reminders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReminders(data);
        }
      })
      .catch(() => {});
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPrefs) => {
    triggerHaptic?.('light');
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    savePreferences(updated);
  };

  const savePreferences = async (updatedPrefs: NotificationPrefs) => {
    if (!token) return;
    setLoading(true);
    setSaveStatus(null);
    try {
      await fetch('/api/v1/auth/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPrefs),
      });
      setSaveStatus('Sozlamalar saqlandi');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTelegram = async () => {
    if (!token) return;
    setLinkingLoading(true);
    triggerHaptic?.('medium');
    try {
      const res = await fetch('/api/v1/auth/telegram-link-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok && data.deep_link) {
        if ((window as any)?.Telegram?.WebApp?.openTelegramLink) {
          (window as any).Telegram.WebApp.openTelegramLink(data.deep_link);
        } else {
          window.open(data.deep_link, '_blank');
        }
      }
    } catch (err) {
      console.warn('Connect telegram error:', err);
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!token) return;
    triggerHaptic?.('medium');
    if (!window.confirm("Rostdan ham Telegram ulanishini uzmoqchimisiz?")) return;
    try {
      await fetch('/api/v1/auth/telegram-unlink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrefs((prev) => ({ ...prev, is_telegram_connected: false, telegram_id: null }));
    } catch {
      // ignore
    }
  };

  const handleWebPushToggle = async () => {
    if (!token) return;
    triggerHaptic?.('medium');
    setWebPushError(null);

    if (prefs.notify_web_push) {
      // Turn off
      await unsubscribeFromWebPush(token);
      const updated = { ...prefs, notify_web_push: false };
      setPrefs(updated);
      savePreferences(updated);
    } else {
      // Turn on
      setWebPushLoading(true);
      const res = await subscribeToWebPush(token);
      setWebPushLoading(false);
      setWebPushPermission(getPushPermissionState());
      if (res.ok) {
        const updated = { ...prefs, notify_web_push: true };
        setPrefs(updated);
        savePreferences(updated);
      } else {
        setWebPushError(res.error || "Web Push ulanmadi.");
      }
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    triggerHaptic?.('medium');

    const now = new Date();
    const [hh, mm] = newTime.split(':').map(Number);
    const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
    if (scheduled.getTime() <= now.getTime()) {
      scheduled.setDate(scheduled.getDate() + 1); // schedule for tomorrow
    }

    try {
      const res = await fetch('/api/v1/notifications/schedule-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: newCategory,
          title: newTitle,
          scheduled_for: scheduled.toISOString(),
          delivery_channel: newChannel,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowNewReminderForm(false);
        // refresh list
        fetch('/api/v1/notifications/my-reminders', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((list) => {
            if (Array.isArray(list)) setReminders(list);
          });
      }
    } catch (err) {
      console.warn('Create reminder error:', err);
    }
  };

  const handleCancelReminder = async (id: number) => {
    if (!token) return;
    triggerHaptic?.('light');
    try {
      await fetch(`/api/v1/notifications/reminders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-linear-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">Aqlli Eslatmalar & Bildirishnomalar</h2>
              <p className="text-[11px] text-purple-100">Telegram va Ilova ichidagi push xabarlar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Telegram Connection Card */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">Telegram Eslatmalar Boti</h3>
                  <p className="text-[11px] text-slate-500">
                    {prefs.is_telegram_connected
                      ? 'Telegram hisobingiz muvaffaqiyatli ulangan'
                      : 'Eslatmalarni Telegram orqali olish uchun botni ulang'}
                  </p>
                </div>
              </div>
              {prefs.is_telegram_connected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Ulangan
                </span>
              )}
            </div>

            {prefs.is_telegram_connected ? (
              <div className="flex items-center justify-between pt-1 border-t border-purple-100/80">
                <span className="text-[11px] text-slate-600 font-medium">
                  Telegram ID: <b>{prefs.telegram_id}</b>
                </span>
                <button
                  type="button"
                  onClick={handleUnlinkTelegram}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                >
                  Ulanishni uzish
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectTelegram}
                disabled={linkingLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{linkingLoading ? 'Ulanish ochilmoqda...' : 'Telegram Botni Ulash (/start)'}</span>
              </button>
            )}
          </div>

          {/* Web Push (Browser / Mobile PWA) Card */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">Brauzer / Telefon Web Push</h3>
                  <p className="text-[11px] text-slate-500">
                    {prefs.notify_web_push && webPushPermission === 'granted'
                      ? 'Qurilmangizda Web Push xabarlar faol'
                      : "Ilova yopiq bo'lsa ham ekranga tezkor eslatma kelishi uchun yoqing"}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notify_web_push && webPushPermission === 'granted'}
                disabled={webPushLoading}
                onChange={handleWebPushToggle}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>
            {webPushPermission === 'denied' && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-medium">
                ⚠️ Brauzeringizda bildirishnomalar bloklangan. Sayt sozlamalaridan «Ruxsat berish» (Allow) ni tanlang.
              </div>
            )}
            {webPushError && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                {webPushError}
              </div>
            )}
          </div>

          {/* Categories & Channel Toggles */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Eslatmalar Turlari</h4>

            {/* Health */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Salomatlik va Dori eslatmalari</p>
                  <p className="text-[10px] text-slate-400">Dori qabul qilish vaqti kelganda eslatish</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notify_health}
                onChange={() => handleToggle('notify_health')}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Sport */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Sport va Mashg'ulot eslatmalari</p>
                  <p className="text-[10px] text-slate-400">Kundalik yurish va fitnes rejalarini eslatish</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notify_sport}
                onChange={() => handleToggle('notify_sport')}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* In-App Push */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Ilova ichidagi Push xabarlar</p>
                  <p className="text-[10px] text-slate-400">Ilova ochiq paytda ekranda ko'rsatish</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notify_in_app}
                onChange={() => handleToggle('notify_in_app')}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* General */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">Umumiy tizim yangiliklari</p>
                  <p className="text-[10px] text-slate-400">Tetik yangilanishlari va qiziqarli maslahatlar</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.notify_general}
                onChange={() => handleToggle('notify_general')}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Quiet Hours & Privacy Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Tinch Rejim & Maxfiylik</h4>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Tinch rejim (Quiet Hours): 22:00 — 08:00</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Ushbu vaqt oralig'ida kechki payt uyqungizni buzmaslik uchun xabarlar avtomatik ertalabki vaqtga kechiktiriladi.
              </p>
            </div>

            <div className="flex items-start justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-950">Neytral Maxfiylik So'zlari</p>
                  <p className="text-[10px] text-emerald-800 leading-tight">
                    Telegram xabarnomasi ekran qulfida dori nomlarini yashiradi: «Siz uchun belgilangan eslatma vaqti keldi».
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!prefs.notify_detailed}
                onChange={() => handleToggle('notify_detailed')}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer mt-0.5"
              />
            </div>
          </div>

          {/* Scheduled Reminders List & Creator */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Rejalashtirilgan Eslatmalar ({reminders.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowNewReminderForm(!showNewReminderForm)}
                className="inline-flex items-center gap-1 text-[11px] font-black text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi eslatma</span>
              </button>
            </div>

            {/* New Reminder Form */}
            {showNewReminderForm && (
              <form onSubmit={handleCreateReminder} className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Turi</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full text-xs font-bold p-2 bg-white rounded-xl border border-slate-200"
                    >
                      <option value="health">Salomatlik / Dori</option>
                      <option value="sport">Sport / Yugurish</option>
                      <option value="general">Umumiy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Vaqt</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Yetkazish kanali</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-white rounded-xl border border-slate-200"
                  >
                    <option value="all">Barcha kanallar (Telegram + Push + Ilova)</option>
                    <option value="web_push">Brauzer / Telefon (Web Push)</option>
                    <option value="telegram">Telegram Bot</option>
                    <option value="in_app">Faqat ilova ichida</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Eslatma nomi</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Masalan: Kechki vitamin yoki 3 km yugurish"
                    className="w-full text-xs font-medium p-2 bg-white rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewReminderForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-xs cursor-pointer"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {reminders.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400">
                Hozircha faol eslatmalar yo'q. «Yangi eslatma» tugmasi orqali qo'shing.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        {r.category === 'sport' ? (
                          <Activity className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <HeartPulse className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="truncate">{r.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                            r.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'cancelled'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status === 'delivered' ? 'Yetkazildi' : r.status === 'cancelled' ? 'Bekor' : 'Kutilmoqda'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {new Date(r.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {r.delivery_channel === 'all'
                          ? 'Barcha kanallar'
                          : r.delivery_channel === 'web_push'
                          ? 'Web Push'
                          : r.delivery_channel === 'both'
                          ? 'Telegram + Ilova'
                          : r.delivery_channel}
                      </p>
                    </div>
                    {r.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCancelReminder(r.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                        title="Bekor qilish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-emerald-700 font-bold">{saveStatus || ''}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
