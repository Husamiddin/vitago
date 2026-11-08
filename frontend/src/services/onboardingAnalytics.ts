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
  session_id?: string;
  event: OnboardingEventType;
  category?: 'health' | 'sport' | 'life' | 'pricing' | 'privacy';
  feature_id?: string;
  step_index?: number;
  platform?: 'web' | 'telegram' | 'mobile';
  timestamp?: string;
}

export interface OnboardingStatsSummary {
  period?: string;
  total_viewed: number;
  total_started: number;
  total_completed: number;
  total_skipped: number;
  completion_rate_percent: number;
  acquisition?: {
    unique_visitors: number;
    unique_started: number;
    unique_completed: number;
    unique_skipped: number;
    start_rate_percent: number;
    completion_rate_percent: number;
    skip_rate_percent: number;
    abandonment_rate_percent: number;
  };
  funnel?: {
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
  top_opened_features?: Array<{ feature_id: string; count: number }>;
  top_completed_demos?: Array<{ feature_id: string; count: number }>;
  step_dropoff?: Record<string, number>;
  features_tested?: Record<string, number>;
  retention?: {
    has_sufficient_data: boolean;
    d1_retention_percent?: number | null;
    d7_retention_percent?: number | null;
    active_registered_users?: number;
    status_text: string;
  };
  platforms?: Record<string, number>;
}

const STORAGE_EVENTS_KEY = 'vitago_onboarding_events';
const STORAGE_COMPLETED_KEY = 'vitago_onboarding_completed';
const STORAGE_SESSION_ID_KEY = 'vitago_anonymous_session_id';
const STORAGE_SAVED_STEP_KEY = 'vitago_onboarding_saved_step';
const STORAGE_SAVED_MODE_KEY = 'vitago_onboarding_saved_mode';

// In-memory cache for client-side event deduplication (suppress duplicate triggers within 3 seconds)
const recentEventsCache = new Map<string, number>();

/**
 * Get or create an anonymous random session identifier.
 * Safe, pseudo-random hex string — zero invasive device fingerprinting.
 */
export function getOrCreateSessionId(): string {
  try {
    let sid = localStorage.getItem(STORAGE_SESSION_ID_KEY);
    if (!sid || sid.length < 10) {
      const array = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
      } else {
        for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
      }
      sid = 'sid_' + Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(STORAGE_SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return 'sid_fallback_' + Math.random().toString(36).substring(2, 15);
  }
}

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
      clearSavedOnboardingState();
    } else {
      localStorage.removeItem(STORAGE_COMPLETED_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Save current onboarding state (Scenario F: browser close recovery)
 */
export function saveOnboardingState(mode: 'welcome' | 'walkthrough', stepIndex: number): void {
  try {
    localStorage.setItem(STORAGE_SAVED_MODE_KEY, mode);
    localStorage.setItem(STORAGE_SAVED_STEP_KEY, String(stepIndex));
  } catch {
    // ignore
  }
}

/**
 * Retrieve saved onboarding state (Scenario F: restore state)
 */
export function getSavedOnboardingState(): { mode: 'welcome' | 'walkthrough'; stepIndex: number } {
  try {
    const mode = (localStorage.getItem(STORAGE_SAVED_MODE_KEY) as 'welcome' | 'walkthrough') || 'welcome';
    const rawStep = localStorage.getItem(STORAGE_SAVED_STEP_KEY);
    let stepIndex = 0;
    if (rawStep !== null) {
      const parsed = parseInt(rawStep, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
        stepIndex = parsed;
      }
    }
    return { mode: mode === 'walkthrough' ? 'walkthrough' : 'welcome', stepIndex };
  } catch {
    return { mode: 'welcome', stepIndex: 0 };
  }
}

/**
 * Clear saved onboarding state on completion or cancellation
 */
export function clearSavedOnboardingState(): void {
  try {
    localStorage.removeItem(STORAGE_SAVED_MODE_KEY);
    localStorage.removeItem(STORAGE_SAVED_STEP_KEY);
  } catch {
    // ignore
  }
}

/**
 * Send an onboarding telemetry event with anonymous session ID and deduplication
 */
export function trackOnboardingEvent(
  event: OnboardingEventType,
  meta?: {
    category?: 'health' | 'sport' | 'life' | 'pricing' | 'privacy';
    feature_id?: string;
    step_index?: number;
  }
): void {
  const sessionId = getOrCreateSessionId();

  // Client-side Deduplication key
  const dedupKey = `${sessionId}_${event}_${meta?.category || ''}_${meta?.feature_id || ''}_${meta?.step_index ?? ''}`;
  const now = Date.now();
  const lastFired = recentEventsCache.get(dedupKey);
  if (lastFired && now - lastFired < 3000) {
    // Suppress rapid repeated triggers within 3 seconds
    return;
  }
  recentEventsCache.set(dedupKey, now);

  const isTg = Boolean(
    typeof window !== 'undefined' &&
      (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData
  );
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const platform = isTg ? 'telegram' : isMobile ? 'mobile' : 'web';

  const payload: OnboardingEventPayload = {
    session_id: sessionId,
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

      if (ev.category && summary.categories_viewed[ev.category] !== undefined) {
        summary.categories_viewed[ev.category] += 1;
      }

      if (ev.feature_id) {
        if (!summary.features_tested) {
          summary.features_tested = {};
        }
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
