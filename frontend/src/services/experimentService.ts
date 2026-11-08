// VitaGo A/B Experimentation Engine
// Lightweight, privacy-first client-side assignment and persistence.
// Zero cookies, zero third-party tracking, fully deterministic and persistent in localStorage.

import { trackOnboardingEvent } from './onboardingAnalytics';

export type ExperimentVariant = 'A' | 'B';

export interface ExperimentMetadata {
  id: string;
  name: string;
  variantA: {
    label: string;
    headline: string;
    subtitle: string;
  };
  variantB: {
    label: string;
    headline: string;
    subtitle: string;
  };
}

export const WELCOME_HEADLINE_EXPERIMENT: ExperimentMetadata = {
  id: 'welcome_headline_v1',
  name: 'Welcome Page Asosiy Sarlavha (Headline A/B)',
  variantA: {
    label: 'Variant A (Control)',
    headline: 'Sog‘lom hayotingiz sari aqlli qadam.',
    subtitle:
      'Sog‘lig‘ingizni nazorat qiling, sport natijalaringizni kuzating va kundalik hayotingizni bitta aqlli platformada boshqaring.',
  },
  variantB: {
    label: 'Variant B (Challenger)',
    headline: 'Sog‘liq, sport va kundalik odatlar — bitta joyda.',
    subtitle:
      'Ortiqcha ilovalarsiz: salomatlik monitoringi, mashg‘ulotlar va sog‘lom turmush tarzingiz yagona aqlli tizimda.',
  },
};

const STORAGE_PREFIX = 'vitago_exp_';

/**
 * Get the assigned variant for an experiment.
 * Checks URL parameter override first (e.g. ?exp_welcome=A or ?exp_welcome=B) for QA testing.
 * Falls back to localStorage, or randomly assigns 50/50 and persists.
 */
export function getExperimentVariant(experimentId: string): ExperimentVariant {
  if (typeof window === 'undefined') return 'A';

  // 1. URL parameter override for testing/QA: ?exp_<id>=A or ?exp_welcome=A
  try {
    const params = new URLSearchParams(window.location.search);
    const urlOverride = params.get(`exp_${experimentId}`) || params.get('exp_welcome');
    if (urlOverride === 'A' || urlOverride === 'a') return 'A';
    if (urlOverride === 'B' || urlOverride === 'b') return 'B';
  } catch {
    // Ignore URL parsing errors
  }

  // 2. Persistent assignment from localStorage
  const storageKey = `${STORAGE_PREFIX}${experimentId}`;
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing === 'A' || existing === 'B') {
      return existing;
    }

    // 3. 50/50 randomized assignment for first-time visitors
    const assigned: ExperimentVariant = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(storageKey, assigned);

    // Track assignment telemetry once
    trackOnboardingEvent('experiment_assigned', {
      variant: assigned,
      feature_id: experimentId,
    });

    return assigned;
  } catch {
    return 'A';
  }
}

/**
 * Convenience helper specifically for the Welcome Page Headline experiment.
 */
export function getWelcomeHeadlineVariant(): ExperimentVariant {
  return getExperimentVariant(WELCOME_HEADLINE_EXPERIMENT.id);
}

/**
 * Log that the visitor was exposed to the experiment on-screen.
 * Includes client-side deduplication so we don't spam exposures.
 */
export function trackExperimentExposure(
  experimentId: string = WELCOME_HEADLINE_EXPERIMENT.id,
  variant?: ExperimentVariant
): void {
  const currentVariant = variant || getExperimentVariant(experimentId);
  trackOnboardingEvent('experiment_exposed', {
    variant: currentVariant,
    feature_id: experimentId,
  });
}
