import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  CreditCard,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  LogOut,
  Eye,
  ExternalLink,
  Flame,
  Search,
  Filter,
  Check,
  ChevronRight,
  UserCheck,
  Crown,
  Lock,
  Bell,
  Trophy,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';

// Default backend endpoint (auto-adapts for custom domain or local development)
const DEFAULT_API_BASE =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'doriscan.vercel.app')
    ? '/api/v1'
    : 'https://doriscan.vercel.app/api/v1';

interface OnboardingGrowthAnalytics {
  period: string;
  total_viewed: number;
  total_started: number;
  total_completed: number;
  total_skipped: number;
  completion_rate_percent: number;
  acquisition: {
    unique_visitors: number;
    unique_started: number;
    unique_completed: number;
    unique_skipped: number;
    start_rate_percent: number;
    completion_rate_percent: number;
    skip_rate_percent: number;
    abandonment_rate_percent: number;
  };
  funnel: {
    welcome_visitors: number;
    onboarding_starters: number;
    onboarding_completers: number;
    pricing_viewers: number;
    signups_started: number;
    signups_completed: number;
    subscription_starters: number;
    confirmed_paying_users: number;
  };
  categories_viewed: {
    health: number;
    sport: number;
    life: number;
    pricing: number;
    privacy: number;
  };
  top_opened_features: Array<{ feature_id: string; count: number }>;
  top_completed_demos: Array<{ feature_id: string; count: number }>;
  step_dropoff: Record<string, number>;
  platforms: Record<string, number>;
  retention: {
    has_sufficient_data: boolean;
    d1_retention_percent?: number | null;
    d7_retention_percent?: number | null;
    active_registered_users?: number;
    status_text: string;
  };
}

interface ExperimentVariantSummary {
  variant: 'A' | 'B';
  label: string;
  headline: string;
  exposures: number;
  starters: number;
  completers: number;
  skippers: number;
  signups: number;
  start_rate_percent: number;
  completion_rate_percent: number;
  skip_rate_percent: number;
  signup_rate_percent: number;
}

interface ExperimentSummary {
  experiment_id: string;
  name: string;
  status: 'running' | 'paused';
  min_sample_size: number;
  has_sufficient_data: boolean;
  is_significant: boolean;
  winner: 'A' | 'B' | null;
  lift_percent: number;
  p_value: number | null;
  confidence_percent: number | null;
  status_text: string;
  variants: {
    A: ExperimentVariantSummary;
    B: ExperimentVariantSummary;
  };
}

interface OverviewStats {
  total_users: number;
  standard_users: number;
  premium_users: number;
  ultra_users: number;
  total_drugs: number;
  total_scans: number;
  pending_payments: number;
  total_revenue_uzs: number;
  onboarding_stats?: {
    total_viewed: number;
    total_started: number;
    total_completed: number;
    total_skipped: number;
    completion_rate_percent: number;
    categories_viewed?: {
      health: number;
      sport: number;
      life: number;
      pricing: number;
      privacy: number;
    };
    features_tested?: Record<string, number>;
  };
}

interface PaymentItem {
  id: number;
  user_id: number;
  user_phone: string;
  user_name: string;
  plan: string;
  billing_cycle: string;
  final_amount_uzs: number;
  card_number: string;
  card_type: string;
  card_holder: string;
  cvc?: string | null;
  promo_code?: string | null;
  receipt_image?: string | null;
  status: 'pending' | 'waiting_admin' | 'approved' | 'rejected';
  created_at: string;
  confirmed_at?: string | null;
}

interface UserItem {
  id: number;
  phone: string;
  first_name: string;
  last_name?: string | null;
  plan: 'standard' | 'premium' | 'ultra';
  plan_cycle?: string | null;
  plan_expires_at?: string | null;
  streak_count: number;
  daily_steps: number;
  age?: number | null;
  gender?: string | null;
  created_at: string;
}

interface ScanItem {
  id: number;
  user_id?: number | null;
  user_phone?: string | null;
  user_name?: string | null;
  scan_type: string;
  summary?: string | null;
  extracted_drugs?: string | null;
  total_prescribed_uzs: number;
  total_savings_uzs: number;
  savings_percent: number;
  created_at: string;
}

interface ClubItem {
  id: number;
  name: string;
  description: string;
  sport_type: string;
  location: string;
  invite_url: string;
  members_count: number;
  created_at?: string | null;
}

interface NotificationItem {
  id: number;
  target_user_id?: number | null;
  target_label: string;
  title: string;
  message: string;
  sender_name: string;
  read_count: number;
  created_at?: string | null;
}

export function AdminApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('doriscan_admin_token'));
  const [username, setUsername] = useState('aminovweb');
  const [password, setPassword] = useState('aminov12345$$');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'payments' | 'users' | 'clubs' | 'notifications' | 'scans'>('overview');

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Growth Analytics State (Phase 3)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [growthAnalytics, setGrowthAnalytics] = useState<OnboardingGrowthAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // A/B Testing State (Phase 4)
  const [experimentData, setExperimentData] = useState<ExperimentSummary | null>(null);
  const [isLoadingExperiment, setIsLoadingExperiment] = useState(false);
  const [isUpdatingExperiment, setIsUpdatingExperiment] = useState(false);

  // Club creation form state
  const [clubName, setClubName] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  const [clubSport, setClubSport] = useState('run');
  const [clubLocation, setClubLocation] = useState("Toshkent, O'zbekiston");
  const [clubInviteUrl, setClubInviteUrl] = useState('');

  // Notification form state
  const [notifTargetUserId, setNotifTargetUserId] = useState<number>(0); // 0 = all users
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modal view for receipt image
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Modal to change plan
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<UserItem | null>(null);
  const [newPlanChoice, setNewPlanChoice] = useState<'standard' | 'premium' | 'ultra'>('premium');

  const apiHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };
  }, [token]);

  const fetchAllData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [stRes, payRes, uRes, scRes, clRes, noRes] = await Promise.all([
        fetch(`${DEFAULT_API_BASE}/admin/overview`, { headers: apiHeaders() }),
        fetch(`${DEFAULT_API_BASE}/admin/payments`, { headers: apiHeaders() }),
        fetch(`${DEFAULT_API_BASE}/admin/users`, { headers: apiHeaders() }),
        fetch(`${DEFAULT_API_BASE}/admin/scans`, { headers: apiHeaders() }),
        fetch(`${DEFAULT_API_BASE}/admin/clubs`, { headers: apiHeaders() }),
        fetch(`${DEFAULT_API_BASE}/admin/notifications`, { headers: apiHeaders() }),
      ]);

      if (stRes.status === 401) {
        localStorage.removeItem('doriscan_admin_token');
        setToken(null);
        return;
      }

      if (stRes.ok) setStats(await stRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (scRes.ok) setScans(await scRes.json());
      if (clRes.ok) setClubs(await clRes.json());
      if (noRes.ok) setNotifications(await noRes.json());
    } catch {
      // ignore transient network errors
    } finally {
      setIsLoading(false);
    }
  }, [token, apiHeaders]);

  const fetchGrowthAnalytics = useCallback(async (period: 'today' | '7d' | '30d' | 'all') => {
    if (!token) return;
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/onboarding-stats?period=${period}`, {
        headers: apiHeaders(),
      });
      if (res.ok) {
        setGrowthAnalytics(await res.json());
      }
    } catch (err) {
      console.error('Failed to load growth analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [token, apiHeaders]);

  const fetchExperimentData = useCallback(async () => {
    if (!token) return;
    setIsLoadingExperiment(true);
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/analytics/experiments`, {
        headers: apiHeaders(),
      });
      if (res.ok) {
        setExperimentData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load experiment data:', err);
    } finally {
      setIsLoadingExperiment(false);
    }
  }, [token, apiHeaders]);

  const toggleExperimentStatus = async () => {
    if (!token || !experimentData || isUpdatingExperiment) return;
    setIsUpdatingExperiment(true);
    const newAction = experimentData.status === 'running' ? 'pause' : 'resume';
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/analytics/experiments/${experimentData.experiment_id}/action`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ action: newAction }),
      });
      if (res.ok) {
        await fetchExperimentData();
      }
    } catch (err) {
      console.error('Failed to toggle experiment:', err);
    } finally {
      setIsUpdatingExperiment(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
      fetchGrowthAnalytics(analyticsPeriod);
      fetchExperimentData();
      const interval = setInterval(() => {
        fetchAllData();
        fetchGrowthAnalytics(analyticsPeriod);
        fetchExperimentData();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [token, analyticsPeriod, fetchAllData, fetchGrowthAnalytics, fetchExperimentData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login yoki parol xato');
      }
      localStorage.setItem('doriscan_admin_token', data.token);
      setToken(data.token);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Ulanishda xatolik yuz berdi');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doriscan_admin_token');
    setToken(null);
  };

  const handlePaymentAction = async (paymentId: number, action: 'approve' | 'reject') => {
    if (!confirm(`Haqiqatan ham ushbu to'lovni ${action === 'approve' ? 'TASDIQLAMOQCHIMISIZ' : 'RAD ETMOQCHIMISIZ'}?`)) {
      return;
    }
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/payments/${paymentId}/action`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      alert('Xatolik: ' + err);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedUserForPlan) return;
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/users/${selectedUserForPlan.id}/set-plan`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ plan: newPlanChoice, days: 30 }),
      });
      if (res.ok) {
        setSelectedUserForPlan(null);
        fetchAllData();
      }
    } catch (err) {
      alert('Xatolik: ' + err);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!confirm(`Haqiqatan ham #${userId} — "${name}" foydalanuvchisini o'chirmoqchimisiz?`)) {
      return;
    }
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });
      if (res.ok) {
        fetchAllData();
      } else {
        alert("Foydalanuvchini o'chirishda xatolik yuz berdi");
      }
    } catch {
      alert("Serverga ulanib bo'lmadi");
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/clubs`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          name: clubName.trim(),
          description: clubDesc.trim(),
          sport_type: clubSport,
          location: clubLocation.trim() || "O'zbekiston",
          invite_url: clubInviteUrl.trim(),
        }),
      });
      if (res.ok) {
        setClubName('');
        setClubDesc('');
        setClubInviteUrl('');
        fetchAllData();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.detail || 'Klub yaratishda xatolik yuz berdi');
      }
    } catch {
      alert("Serverga ulanib bo'lmadi");
    }
  };

  const handleDeleteClub = async (clubId: number, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" klubini o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch {
      alert("Serverga ulanib bo'lmadi");
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setNotifSending(true);
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/notifications`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          target_user_id: notifTargetUserId > 0 ? notifTargetUserId : null,
          title: notifTitle.trim(),
          message: notifMessage.trim(),
        }),
      });
      if (res.ok) {
        setNotifTitle('');
        setNotifMessage('');
        fetchAllData();
        alert('Xabarnoma muvaffaqiyatli yuborildi!');
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.detail || 'Xabar yuborishda xatolik');
      }
    } catch {
      alert("Serverga ulanib bo'lmadi");
    } finally {
      setNotifSending(false);
    }
  };

  const handleDeleteNotification = async (notifId: number) => {
    if (!confirm("Ushbu xabarnomani o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`${DEFAULT_API_BASE}/admin/notifications/${notifId}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch {
      alert("Serverga ulanib bo'lmadi");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-3 border border-emerald-400/40 overflow-hidden">
              <img src="/logo.png" alt="Tetik Logo" className="h-full w-full object-cover rounded-xl" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Tetik Admin</h1>
            <p className="text-xs text-slate-400 mt-1">Platformani boshqarish paneli</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Login</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Parol</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Kirilmoqda...' : 'Tizimga kirish'}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            Tetik System © 2026 • Maxfiy ma'lumotlar bilan ishlash
          </p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.phone.includes(userSearch) ||
      u.first_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.last_name && u.last_name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'all') return true;
    if (paymentFilter === 'pending') return p.status === 'pending' || p.status === 'waiting_admin';
    return p.status === paymentFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md shadow-emerald-600/30 border border-emerald-500/40 bg-white p-0.5 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Tetik Logo" className="h-full w-full object-cover rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">Tetik</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Super Admin (aminovweb)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Yangilash"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-800/60 overflow-x-auto">
          {[
            { id: 'overview', label: 'Boshqaruv', icon: TrendingUp },
            { id: 'analytics', label: 'Onboarding & Funnel', icon: Sparkles },
            {
              id: 'payments',
              label: "To'lovlar",
              icon: CreditCard,
              badge: stats?.pending_payments ? stats.pending_payments : null,
            },
            { id: 'users', label: 'Foydalanuvchilar', icon: Users, badge: stats?.total_users },
            { id: 'clubs', label: 'Sport Klublari', icon: Trophy, badge: clubs.length },
            { id: 'notifications', label: 'Xabarnomalar', icon: Bell, badge: notifications.length },
            { id: 'scans', label: 'Skanerlar lentalari', icon: FileText, badge: stats?.total_scans },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      tab.id === 'payments' && tab.badge > 0
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {isLoading && !stats && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-bold">Ma'lumotlar yuklanmoqda...</p>
          </div>
        )}

        {!isLoading && !stats && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-sm font-bold text-rose-400 mb-3">Serverga ulanishda xatolik yuz berdi yoki sessiya eskirgan.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAllData}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Qayta yuklash
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Chiqish (Qayta kirish)
              </button>
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">Foydalanuvchilar</span>
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total_users ?? 0} ta</div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{stats.premium_users ?? 0} Premium</span>
                  <span>•</span>
                  <span className="text-purple-400 font-bold">{stats.ultra_users ?? 0} Ultra</span>
                  <span>•</span>
                  <span>{stats.standard_users ?? 0} Bepul</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">Jami Tushum</span>
                  <CreditCard className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {(stats.total_revenue_uzs ?? 0).toLocaleString()} so'm
                </div>
                <div className="mt-2 text-[11px] text-slate-400">Tasdiqlangan to'lovlar summasi</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">Kutilayotgan To'lovlar</span>
                  <Clock className="h-5 w-5 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.pending_payments ?? 0} ta</div>
                <div className="mt-2 text-[11px] text-rose-400 font-semibold">
                  {(stats.pending_payments ?? 0) > 0 ? "Admin tasdig'ini kutmoqda" : "Barcha to'lovlar ko'rilgan"}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">Jami Skanerlashlar</span>
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total_scans} ta</div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Bazada {stats.total_drugs} ta dori vositasi
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Pending Payments */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span>Kutilayotgan to'lov buyurtmalari ({stats.pending_payments})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Barchasini ko'rish</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {payments.filter((p) => p.status === 'pending' || p.status === 'waiting_admin').length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-medium">
                  Hozirda kutilayotgan to'lovlar mavjud emas.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments
                    .filter((p) => p.status === 'pending' || p.status === 'waiting_admin')
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
                            {item.plan === 'ultra' ? <Crown className="h-5 w-5 text-amber-400" /> : <Sparkles className="h-5 w-5 text-blue-400" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white">{item.user_name}</span>
                              <span className="text-xs text-slate-400">({item.user_phone})</span>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-700 text-emerald-300">
                                {item.plan} ({item.billing_cycle})
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Karta: <span className="font-mono text-slate-200">{item.card_number}</span> ({item.card_type.toUpperCase()})
                              {item.cvc ? ` • CVC: ${item.cvc}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-black text-white">{(item.final_amount_uzs ?? 0).toLocaleString()} so'm</div>
                            <span className="text-[10px] text-amber-400 font-bold">Tasdiqlash kutilmoqda</span>
                          </div>

                          {item.receipt_image && (
                            <button
                              onClick={() => setViewReceiptUrl(item.receipt_image || null)}
                              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Chekni ko'rish"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handlePaymentAction(item.id, 'approve')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            Tasdiqlash
                          </button>
                          <button
                            onClick={() => handlePaymentAction(item.id, 'reject')}
                            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition cursor-pointer"
                          >
                            Rad etish
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Onboarding Funnel & Interest Analytics */}
            {stats.onboarding_stats && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    <h3 className="font-black text-base text-white">
                      Onboarding & Tanishtiruv Voronkasi
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    Konversiya: {stats.onboarding_stats.completion_rate_percent}%
                  </span>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <div className="text-[11px] font-bold text-slate-400">Ko'rganlar</div>
                    <div className="text-xl font-black text-white mt-1">
                      {stats.onboarding_stats.total_viewed}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Bosh sahifaga kirgan</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <div className="text-[11px] font-bold text-slate-400">Boshlaganlar</div>
                    <div className="text-xl font-black text-blue-400 mt-1">
                      {stats.onboarding_stats.total_started}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Tanishtiruvni boshlagan</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <div className="text-[11px] font-bold text-slate-400">Tugatganlar</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">
                      {stats.onboarding_stats.total_completed}
                    </div>
                    <div className="text-[10px] text-emerald-500/80 font-medium">Platformaga o'tgan</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
                    <div className="text-[11px] font-bold text-slate-400">Skip qilganlar</div>
                    <div className="text-xl font-black text-amber-400 mt-1">
                      {stats.onboarding_stats.total_skipped}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">To'g'ridan-to'g'ri o'tgan</div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>🩺 Sog'liq (Health)</span>
                      <span className="text-blue-400 font-black">
                        {stats.onboarding_stats.categories_viewed?.health || 0} marta
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-indigo-400" /> Sport</span>
                      <span className="text-indigo-400 font-black">
                        {stats.onboarding_stats.categories_viewed?.sport || 0} marta
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>🌱 Life (Hayot)</span>
                      <span className="text-emerald-400 font-black">
                        {stats.onboarding_stats.categories_viewed?.life || 0} marta
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONBOARDING & GROWTH ANALYTICS TAB (PHASE 3) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Bar with Period Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-black text-white">
                    Onboarding & Konversiya Voronkasi
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Haqiqiy SQL telemetriya va foydalanuvchilar qiziqishi tahlili
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Period Filter Pills */}
                <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-xs font-bold">
                  {(
                    [
                      { id: 'today', label: 'Bugun' },
                      { id: '7d', label: '7 kun' },
                      { id: '30d', label: '30 kun' },
                      { id: 'all', label: 'Barchasi' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAnalyticsPeriod(p.id);
                        fetchGrowthAnalytics(p.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs font-black ${
                        analyticsPeriod === p.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fetchGrowthAnalytics(analyticsPeriod)}
                  disabled={isLoadingAnalytics}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700/60"
                  title="Yangilash"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingAnalytics ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* 1. ACQUISITION & ONBOARDING KPIS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-400" />
                  1. Tashriflar va Onboarding Ko'rsatkichlari (Yakka sessiyalar)
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  Deduplikatsiya qilingan haqiqiy sessiyalar
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400">Yakka Tashrifchilar</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {growthAnalytics?.acquisition?.unique_visitors ?? (stats?.onboarding_stats?.total_viewed || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Sessiya identifikatori bilan</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400">Boshlash Darajasi</div>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {growthAnalytics?.acquisition?.start_rate_percent ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Tanishtiruvni boshlagan</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400">Yakunlash Darajasi</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {growthAnalytics?.acquisition?.completion_rate_percent ?? (stats?.onboarding_stats?.completion_rate_percent || 0)}%
                  </div>
                  <div className="text-[10px] text-emerald-500/80 font-medium">Barcha qadamlardan o'tgan</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400">Skip Darajasi</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {growthAnalytics?.acquisition?.skip_rate_percent ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">O'tkazib yuborgan</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-bold text-slate-400">Tark Etish (Abandon)</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    {growthAnalytics?.acquisition?.abandonment_rate_percent ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Tugallanmagan sessiyalar</div>
                </div>
              </div>
            </div>

            {/* 2. CONVERSION FUNNEL */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  2. Bosqichma-bosqich Konversiya Voronkasi
                </h3>
                <span className="text-xs font-bold text-emerald-400">
                  Welcome ➔ To'lov Tasdiqlanishi
                </span>
              </div>

              {(() => {
                const f = growthAnalytics?.funnel || {
                  welcome_visitors: stats?.onboarding_stats?.total_viewed || 1,
                  onboarding_starters: stats?.onboarding_stats?.total_started || 0,
                  onboarding_completers: stats?.onboarding_stats?.total_completed || 0,
                  pricing_viewers: stats?.onboarding_stats?.categories_viewed?.pricing || 0,
                  signups_started: 0,
                  signups_completed: stats?.total_users || 0,
                  subscription_starters: stats?.pending_payments || 0,
                  confirmed_paying_users: (stats?.premium_users || 0) + (stats?.ultra_users || 0),
                };
                const base = Math.max(1, f.welcome_visitors);

                const funnelSteps = [
                  { label: "1. Welcome sahifasiga tashrif", value: f.welcome_visitors, color: "bg-blue-500" },
                  { label: "2. Onboarding boshlaganlar", value: f.onboarding_starters, color: "bg-indigo-500" },
                  { label: "3. Onboarding yakunlaganlar", value: f.onboarding_completers, color: "bg-teal-500" },
                  { label: "4. Tariflar sahifasini ko'rganlar", value: f.pricing_viewers, color: "bg-amber-500" },
                  { label: "5. Ro'yxatdan o'tganlar", value: f.signups_completed, color: "bg-emerald-500" },
                  { label: "6. To'lov arizasini topshirganlar", value: f.subscription_starters, color: "bg-purple-500" },
                  { label: "7. Tasdiqlangan to'lovchilar (Rasmiy)", value: f.confirmed_paying_users, color: "bg-emerald-400" },
                ];

                return (
                  <div className="space-y-3 pt-1">
                    {funnelSteps.map((step, idx) => {
                      const pct = Math.min(100, Math.round((step.value / base) * 100));
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-300">{step.label}</span>
                            <span className="text-white font-mono font-black">
                              {step.value} ta <span className="text-slate-500 text-[10px]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${step.color} transition-all duration-500`}
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 3. FEATURE ENGAGEMENT & INTEREST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Kategoriyalar bo'yicha qiziqish
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: "🩺 Sog'liq (Health)", val: growthAnalytics?.categories_viewed?.health ?? (stats?.onboarding_stats?.categories_viewed?.health || 0), color: "text-blue-400" },
                    { label: "Sport (Sport)", val: growthAnalytics?.categories_viewed?.sport ?? (stats?.onboarding_stats?.categories_viewed?.sport || 0), color: "text-indigo-400" },
                    { label: "🌱 Life (Hayot)", val: growthAnalytics?.categories_viewed?.life ?? (stats?.onboarding_stats?.categories_viewed?.life || 0), color: "text-emerald-400" },
                    { label: "💎 Tariflar (Pricing)", val: growthAnalytics?.categories_viewed?.pricing ?? (stats?.onboarding_stats?.categories_viewed?.pricing || 0), color: "text-purple-400" },
                    { label: "🛡️ Maxfiylik (Privacy)", val: growthAnalytics?.categories_viewed?.privacy ?? (stats?.onboarding_stats?.categories_viewed?.privacy || 0), color: "text-slate-400" },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs font-bold">
                      <span className="text-slate-300">{c.label}</span>
                      <span className={`font-black ${c.color}`}>{c.val} marta</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Opened Demos */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Eng ko'p sinab ko'rilgan imkoniyatlar
                </h3>
                {growthAnalytics?.top_opened_features && growthAnalytics.top_opened_features.length > 0 ? (
                  <div className="space-y-2">
                    {growthAnalytics.top_opened_features.map((feat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                        <span className="text-slate-300 font-bold truncate max-w-[200px]">
                          {idx + 1}. {feat.feature_id.replace(/_/g, ' ')}
                        </span>
                        <span className="font-black text-emerald-400">{feat.count} ochilgan</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-800/20 rounded-2xl">
                    Hozircha imkoniyatlar testi qayd etilmagan
                  </div>
                )}
              </div>
            </div>

            {/* 4. RETENTION & COHORT HEALTH */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  4. Foydalanuvchilar Saqlanishi (Retention)
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {growthAnalytics?.retention?.status_text || "Kamida 7 kunlik faoliyat talab etiladi"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400">1-kunlik qaytish (Day 1)</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {growthAnalytics?.retention?.has_sufficient_data && growthAnalytics.retention.d1_retention_percent !== null
                      ? `${growthAnalytics.retention.d1_retention_percent}%`
                      : "Yetarli ma'lumot yo'q"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Ro'yxatdan keyingi kunda kirganlar</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400">7-kunlik qaytish (Day 7)</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {growthAnalytics?.retention?.has_sufficient_data && growthAnalytics.retention.d7_retention_percent !== null
                      ? `${growthAnalytics.retention.d7_retention_percent}%`
                      : "Yetarli ma'lumot yo'q"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Bir hafta o'tib faol qolganlar</div>
                </div>

                <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400">Jami Ro'yxatdan O'tganlar</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {growthAnalytics?.retention?.active_registered_users ?? (stats?.total_users || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Haqiqiy faol akkauntlar</div>
                </div>
              </div>
            </div>

            {/* 5. A/B TESTING EXPERIMENTS (PHASE 4) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xs">
                    A/B
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      5. A/B Tajriba: Welcome Page Asosiy Sarlavha
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          experimentData?.status === 'running'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {experimentData?.status === 'running' ? '● Faol (Running)' : '⏸ To‘xtatilgan'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      Eksperiment ID: <code className="text-purple-300 font-mono">welcome_headline_v1</code> (50/50 taqsimot)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleExperimentStatus}
                    disabled={isUpdatingExperiment || !experimentData}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                      experimentData?.status === 'running'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {experimentData?.status === 'running' ? 'To‘xtatish (Pause)' : 'Faollashtirish (Resume)'}
                  </button>

                  <button
                    type="button"
                    onClick={fetchExperimentData}
                    disabled={isLoadingExperiment}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700/60"
                    title="Yangilash"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingExperiment ? 'animate-spin text-purple-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Statistical Significance Alert Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  experimentData?.is_significant
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : experimentData?.has_sufficient_data
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 shrink-0">
                  {experimentData?.is_significant ? (
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="font-black text-xs uppercase tracking-wider flex items-center justify-between">
                    <span>
                      {experimentData?.is_significant
                        ? `G'olib aniqlandi: Variant ${experimentData.winner} (+${experimentData.lift_percent}% o'sish)`
                        : experimentData?.has_sufficient_data
                        ? 'Statistik farq yetarli emas'
                        : "Yetarli ma'lumot yo'q — tajriba davom etmoqda"}
                    </span>
                    {experimentData?.p_value !== null && (
                      <span className="text-[11px] font-mono text-slate-400">
                        p-qiymat: {experimentData?.p_value} ({experimentData?.confidence_percent}% ishonch)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {experimentData?.status_text || "Ma'lumotlar yuklanmoqda..."}
                  </p>
                </div>
              </div>

              {/* Comparison Cards / Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Variant A (Control) */}
                <div className="bg-slate-800/50 border border-slate-800 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                      Variant A (Control)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Namuna: {experimentData?.variants.A.exposures || 0} / 50
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-bold">
                    "{experimentData?.variants.A.headline || 'Sog‘lom hayotingiz sari aqlli qadam.'}"
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold">Ko'rishlar</div>
                      <div className="text-base font-black text-white mt-0.5">
                        {experimentData?.variants.A.exposures || 0}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold">Boshlaganlar</div>
                      <div className="text-base font-black text-blue-400 mt-0.5">
                        {experimentData?.variants.A.starters || 0}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold">Start Rate</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">
                        {experimentData?.variants.A.start_rate_percent || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Start Konversiyasi</span>
                      <span>{experimentData?.variants.A.start_rate_percent || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, experimentData?.variants.A.start_rate_percent || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Variant B (Challenger) */}
                <div className="bg-slate-800/50 border border-slate-800 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Variant B (Challenger)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Namuna: {experimentData?.variants.B.exposures || 0} / 50
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-bold">
                    "{experimentData?.variants.B.headline || 'Sog‘liq, sport va kundalik odatlar — bitta joyda.'}"
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold">Ko'rishlar</div>
                      <div className="text-base font-black text-white mt-0.5">
                        {experimentData?.variants.B.exposures || 0}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold">Boshlaganlar</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">
                        {experimentData?.variants.B.starters || 0}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold">Start Rate</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">
                        {experimentData?.variants.B.start_rate_percent || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Start Konversiyasi</span>
                      <span>{experimentData?.variants.B.start_rate_percent || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, experimentData?.variants.B.start_rate_percent || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">To'lov arizalari</h2>
              <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPaymentFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                      paymentFilter === filter
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'all'
                      ? 'Barchasi'
                      : filter === 'pending'
                      ? 'Kutilayotgan'
                      : filter === 'approved'
                      ? 'Tasdiqlangan'
                      : 'Rad etilgan'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Foydalanuvchi</th>
                      <th className="py-3.5 px-4">Reja / Summa</th>
                      <th className="py-3.5 px-4">Karta Ma'lumotlari</th>
                      <th className="py-3.5 px-4">Chek</th>
                      <th className="py-3.5 px-4">Holat</th>
                      <th className="py-3.5 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">#{p.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{p.user_name}</div>
                          <div className="text-[11px] text-slate-400">{p.user_phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${
                              p.plan === 'ultra'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {p.plan} ({p.billing_cycle})
                          </span>
                          <div className="font-extrabold text-white mt-1">
                            {(p.final_amount_uzs ?? 0).toLocaleString()} so'm
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-200">{p.card_number}</div>
                          <div className="text-[11px] text-slate-400">
                            {p.card_type.toUpperCase()} • {p.card_holder}
                            {p.cvc ? ` • CVC: ${p.cvc}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {p.receipt_image ? (
                            <button
                              onClick={() => setViewReceiptUrl(p.receipt_image || null)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Chekni ko'rish</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Chek yo'q</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              p.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : p.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400 animate-pulse'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status !== 'approved' && (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handlePaymentAction(p.id, 'approve')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                              >
                                Tasdiqlash
                              </button>
                              <button
                                onClick={() => handlePaymentAction(p.id, 'reject')}
                                className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition cursor-pointer"
                              >
                                Rad
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout (Responsive Rule 4) */}
              <div className="md:hidden divide-y divide-slate-800">
                {filteredPayments.map((p) => (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{p.id}</span>
                        <span className="font-extrabold text-sm text-white">{p.user_name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          p.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : p.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="text-slate-400">{p.user_phone}</div>
                      <div className="font-mono text-slate-200">
                        {p.card_number} ({p.card_type.toUpperCase()})
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span
                          className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${
                            p.plan === 'ultra'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {p.plan} ({p.billing_cycle})
                        </span>
                        <div className="font-black text-white text-sm mt-0.5">
                          {(p.final_amount_uzs ?? 0).toLocaleString()} so'm
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.receipt_image && (
                          <button
                            onClick={() => setViewReceiptUrl(p.receipt_image || null)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-emerald-400 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Chek</span>
                          </button>
                        )}
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => handlePaymentAction(p.id, 'approve')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                          >
                            Tasdiqlash
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">Foydalanuvchilar ro'yxati ({users.length})</h2>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ism yoki telefon qidirish..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none w-64"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Ism va Familiya</th>
                      <th className="py-3.5 px-4">Telefon</th>
                      <th className="py-3.5 px-4">Reja (Plan)</th>
                      <th className="py-3.5 px-4">Streak (Olovcha)</th>
                      <th className="py-3.5 px-4">Qadamlar</th>
                      <th className="py-3.5 px-4">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">#{u.id}</td>
                        <td className="py-3 px-4 font-bold text-white">
                          {u.first_name} {u.last_name || ''}
                        </td>
                        <td className="py-3 px-4 font-mono">{u.phone}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              u.plan === 'ultra'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : u.plan === 'premium'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.plan === 'ultra' && <Crown className="h-3 w-3" />}
                            {u.plan === 'premium' && <Sparkles className="h-3 w-3" />}
                            <span>{u.plan}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                            <Flame className="h-3.5 w-3.5" />
                            <span>{u.streak_count} kun</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{(u.daily_steps ?? 0).toLocaleString()} qadam</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUserForPlan(u);
                                setNewPlanChoice(u.plan);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition cursor-pointer"
                            >
                              Rejani o'zgartirish
                            </button>
                            <button
                              onClick={() => {
                                setNotifTargetUserId(u.id);
                                setActiveTab('notifications');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-xs font-bold text-amber-400 border border-amber-500/30 transition cursor-pointer inline-flex items-center gap-1"
                              title="Shu foydalanuvchiga xabar yuborish"
                            >
                              <Bell className="h-3 w-3" />
                              <span>Xabar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name || ''}`)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 border border-rose-500/20 transition cursor-pointer"
                              title="Foydalanuvchini o'chirish"
                            >
                              O'chirish
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout (Responsive Rule 4) */}
              <div className="md:hidden divide-y divide-slate-800">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{u.id}</span>
                        <span className="font-extrabold text-sm text-white">
                          {u.first_name} {u.last_name || ''}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          u.plan === 'ultra'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : u.plan === 'premium'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.plan}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono">{u.phone}</span>
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                        <Flame className="h-3.5 w-3.5" />
                        {u.streak_count} kun streak
                      </span>
                      <span className="font-medium text-slate-300">
                        {(u.daily_steps ?? 0).toLocaleString()} qadam
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => {
                          setSelectedUserForPlan(u);
                          setNewPlanChoice(u.plan);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 text-xs font-bold"
                      >
                        Reja
                      </button>
                      <button
                        onClick={() => {
                          setNotifTargetUserId(u.id);
                          setActiveTab('notifications');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Bell className="h-3 w-3" />
                        <span>Xabar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name || ''}`)}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SPORT CLUBS TAB */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <span>Yangi Sport Klubi Qo'shish (Tetik Sport)</span>
              </h2>
              <form onSubmit={handleCreateClub} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Klub nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Toshkent Yuguruvchilar Klubi"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sport yo'nalishi *</label>
                  <select
                    value={clubSport}
                    onChange={(e) => setClubSport(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="run">Yugurish (Run)</option>
                    <option value="trail_run">Tog'da yugurish (Trail Run)</option>
                    <option value="walk">Piyoda yurish (Walk)</option>
                    <option value="hike">Tog' sayohati (Hike)</option>
                    <option value="ride">Velosiped haydash (Ride)</option>
                    <option value="mtb_ride">Tog' velosipedi (MTB)</option>
                    <option value="gravel_ride">Shag'al yo'lda velosiped (Gravel)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Shahar / Hudud</label>
                  <input
                    type="text"
                    placeholder="Masalan: Toshkent, O'zbekiston"
                    value={clubLocation}
                    onChange={(e) => setClubLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Telegram guruh/kanal havolasi (ixtiyoriy)</label>
                  <input
                    type="text"
                    placeholder="https://t.me/..."
                    value={clubInviteUrl}
                    onChange={(e) => setClubInviteUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Klub haqida qisqacha ma'lumot</label>
                  <textarea
                    rows={2}
                    placeholder="Klub maqsadi, mashg'ulot kunlari va qoidalari..."
                    value={clubDesc}
                    onChange={(e) => setClubDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Klubni Qo'shish</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-black text-white mb-4">Mavjud Sport Klublari ({clubs.length})</h3>
              {clubs.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Hozircha hech qanday sport klubi qo'shilmagan. Yuqoridagi shakl orqali yangi klub qo'shing.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clubs.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{c.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                            {c.sport_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">📍 {c.location} • 👥 {c.members_count} a'zo</p>
                        {c.description && <p className="text-xs text-slate-300 mt-1">{c.description}</p>}
                        {c.invite_url && (
                          <a
                            href={c.invite_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:underline mt-1"
                          >
                            <span>Havolani ochish</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteClub(c.id, c.name)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer shrink-0"
                        title="Klubni o'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-amber-400" />
                <span>Foydalanuvchilarga Xabarnoma (Bildirishnoma) Yuborish</span>
              </h2>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Kimga yuborilsin? (Alohida foydalanuvchi yoki Umumiy hammaga) *
                    </label>
                    <select
                      value={notifTargetUserId}
                      onChange={(e) => setNotifTargetUserId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    >
                      <option value={0}>🌐 Barcha foydalanuvchilarga umumiy xabar yuborish</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          👤 #{u.id} — {u.first_name} {u.last_name || ''} ({u.phone}) [{u.plan.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Sarlavha *</label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Yangi musobaqa yoki muhim xabar!"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Xabar matni *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Foydalanuvchiga boradigan bildirishnoma matnini yozing..."
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={notifSending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{notifSending ? 'Yuborilmoqda...' : 'Xabarnomani Yuborish'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-black text-white mb-4">Yuborilgan Xabarnomalar Tarixi ({notifications.length})</h3>
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Hozircha xabarnomalar yuborilmagan.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-white">{n.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              n.target_user_id
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {n.target_label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            👁 {n.read_count} marta o'qildi
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-line">{n.message}</p>
                        <p className="text-[10px] text-slate-500">
                          {n.created_at ? new Date(n.created_at).toLocaleString('uz-UZ') : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer shrink-0"
                        title="Xabarnomani o'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCANS FEED TAB */}
        {activeTab === 'scans' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white">Skanerlangan rasmlar va retseptlar lentasi</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scans.map((s) => (
                <div key={s.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400">
                      {s.scan_type}
                    </span>
                    <span className="text-slate-400">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('uz-UZ') : ''}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-white text-sm">
                      {s.user_name || 'Foydalanuvchi'} ({s.user_phone || 'Web'})
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.summary || 'Tahlil bajarildi'}</p>
                  </div>

                  {s.extracted_drugs && (
                    <div className="p-2.5 rounded-xl bg-slate-800/80 text-[11px] text-slate-300">
                      <span className="font-bold text-emerald-400">Dorilar:</span> {s.extracted_drugs}
                    </div>
                  )}

                  {s.total_savings_uzs > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold">
                      <span className="text-slate-400">Tejalgan mablag':</span>
                      <span className="text-emerald-400 font-black">
                        -{(s.total_savings_uzs ?? 0).toLocaleString()} so'm ({s.savings_percent}%)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* RECEIPT IMAGE MODAL */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-lg w-full flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-white">To'lov cheki skrinshoti</span>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img src={viewReceiptUrl} alt="Receipt" className="max-h-[70vh] rounded-2xl object-contain w-full" />
          </div>
        </div>
      )}

      {/* CHANGE PLAN MODAL */}
      {selectedUserForPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Foydalanuvchi rejasini o'zgartirish</h3>
              <button onClick={() => setSelectedUserForPlan(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Foydalanuvchi: <b className="text-white">{selectedUserForPlan.first_name} ({selectedUserForPlan.phone})</b>
            </p>

            <div className="space-y-2">
              {(['standard', 'premium', 'ultra'] as const).map((p) => (
                <label
                  key={p}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    newPlanChoice === p
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="planChoice"
                      checked={newPlanChoice === p}
                      onChange={() => setNewPlanChoice(p)}
                      className="text-emerald-500"
                    />
                    <span className="font-extrabold capitalize text-sm">{p}</span>
                  </div>
                  <span className="text-xs font-mono">
                    {p === 'standard' ? '0 so`m' : p === 'premium' ? '15 000 so`m' : '40 000 so`m'}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForPlan(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleUpdatePlan}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApp;
