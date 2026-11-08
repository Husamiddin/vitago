// VitaGo Onboarding & Platform Analytics Service
// Privacy-first: strictly records navigation and feature interest metrics.
// NEVER logs patient medical data, prescription text, or private health details.

export type OnboardingEventType =
  | 'onboarding_viewed'
  | 'onboarding_started'
  | 'onboarding_skipped'
  | 'category_opened'
  | 'feature_demo_opened'
  | 'feature_demo_completed'
  | 'pricing_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'onboarding_completed'
  | 'subscription_started'
  | 'subscription_succeeded';

export interface OnboardingEventPayload {
  event: OnboardingEventType;
  category?: 'health' | 'sport' | 'life' | 'pricing' | 'privacy';
  feature_id?: string;
  step_index?: number;
  platform?: 'web' | 'telegram' | 'mobile';
  timestamp?: string;
}

export interface OnboardingStatsSummary {
  total_viewed: number;
  total_started: number;
  total_completed: number;
  total_skipped: number;
  completion_rate_percent: number;
  categories_viewed: {
    health: number;
    sport: number;
    life: number;
    pricing: number;
    privacy: number;
  };
  features_tested: Record<string, number>;
  signups_started: number;
  signups_completed: number;
  subscriptions_started: number;
}

const STORAGE_EVENTS_KEY = 'vitago_onboarding_events';
const STORAGE_COMPLETED_KEY = 'vitago_onboarding_completed';

/**
 * Check if the current visitor has previously completed or skipped onboarding
 */
export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed or dismissed
 */
export function markOnboardingCompleted(completed = true): void {
  try {
    if (completed) {
      localStorage.setItem(STORAGE_COMPLETED_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_COMPLETED_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Send an onboarding telemetry event
 */
export function trackOnboardingEvent(
  event: OnboardingEventType,
  meta?: {
    category?: 'health' | 'sport' | 'life' | 'pricing' | 'privacy';
    feature_id?: string;
    step_index?: number;
  }
): void {
  const isTg = Boolean(
    typeof window !== 'undefined' && (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData
  );
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const platform = isTg ? 'telegram' : isMobile ? 'mobile' : 'web';

  const payload: OnboardingEventPayload = {
    event,
    category: meta?.category,
    feature_id: meta?.feature_id,
    step_index: meta?.step_index,
    platform,
    timestamp: new Date().toISOString(),
  };

  // 1. Save in local log buffer (keeps last 100 events)
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
    const list: OnboardingEventPayload[] = raw ? JSON.parse(raw) : [];
    list.push(payload);
    if (list.length > 100) {
      list.splice(0, list.length - 100);
    }
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  // 2. Dispatch to backend API asynchronously (non-blocking)
  try {
    fetch('/api/v1/analytics/onboarding-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Gracefully silent on offline or network disconnect
    });
  } catch {
    // ignore
  }
}

/**
 * Get aggregated analytics locally (serves as instantaneous offline fallback)
 */
export function getLocalOnboardingStats(): OnboardingStatsSummary {
  const summary: OnboardingStatsSummary = {
    total_viewed: 0,
    total_started: 0,
    total_completed: 0,
    total_skipped: 0,
    completion_rate_percent: 0,
    categories_viewed: {
      health: 0,
      sport: 0,
      life: 0,
      pricing: 0,
      privacy: 0,
    },
    features_tested: {},
    signups_started: 0,
    signups_completed: 0,
    subscriptions_started: 0,
  };

  try {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (!raw) return summary;
    const events: OnboardingEventPayload[] = JSON.parse(raw);

    for (const ev of events) {
      if (ev.event === 'onboarding_viewed') summary.total_viewed += 1;
      else if (ev.event === 'onboarding_started') summary.total_started += 1;
      else if (ev.event === 'onboarding_completed') summary.total_completed += 1;
      else if (ev.event === 'onboarding_skipped') summary.total_skipped += 1;
      else if (ev.event === 'signup_started') summary.signups_started += 1;
      else if (ev.event === 'signup_completed') summary.signups_completed += 1;
      else if (ev.event === 'subscription_started') summary.subscriptions_started += 1;

      if (ev.category && summary.categories_viewed[ev.category] !== undefined) {
        summary.categories_viewed[ev.category] += 1;
      }

      if (ev.feature_id) {
        summary.features_tested[ev.feature_id] = (summary.features_tested[ev.feature_id] || 0) + 1;
      }
    }

    const denom = summary.total_started || summary.total_viewed || 1;
    summary.completion_rate_percent = Math.round((summary.total_completed / denom) * 100);
  } catch {
    // ignore
  }

  return summary;
}
