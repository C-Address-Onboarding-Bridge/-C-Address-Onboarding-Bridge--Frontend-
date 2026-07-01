export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  rolloutPercentage: number; // 0-100
}

/**
 * Define all feature flags here.
 * Add new features behind flags in this list.
 */
export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'new_onboarding_flow',
    name: 'New Onboarding Flow',
    description: 'Redesigned step-by-step onboarding experience',
    defaultEnabled: false,
    rolloutPercentage: 0,
  },
  {
    key: 'advanced_address_validation',
    name: 'Advanced Address Validation',
    description: 'Enhanced address validation with real-time feedback',
    defaultEnabled: false,
    rolloutPercentage: 0,
  },
];

/**
 * Determines if a feature flag is enabled for the current user/session.
 * Priority order:
 * 1. Developer override (localStorage) — highest priority, dev panel only
 * 2. Environment variable override (NEXT_PUBLIC_FEATURE_FLAGS)
 * 3. Rollout percentage (deterministic based on session ID)
 * 4. Default value
 */
export function isFeatureEnabled(
  key: string,
  sessionId?: string,
): boolean {
  // 1. Dev override from localStorage (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const devOverrides = getDevOverrides();
    if (key in devOverrides) return devOverrides[key];
  }

  // 2. Env var override
  const envFlags = parseEnvFlags();
  if (key in envFlags) return envFlags[key];

  // 3. Rollout percentage
  const flag = FEATURE_FLAGS.find(f => f.key === key);
  if (!flag) return false;

  if (flag.rolloutPercentage === 100) return true;
  if (flag.rolloutPercentage === 0) return flag.defaultEnabled;

  const hash = deterministicHash(`${key}:${sessionId ?? getSessionId()}`);
  const isEnabledByRollout = (hash % 100) < flag.rolloutPercentage;

  // 4. Return rollout result if it applies, otherwise default
  return isEnabledByRollout || flag.defaultEnabled;
}

/**
 * Deterministic hash function for consistent rollout behavior.
 */
function deterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get or create a session ID for deterministic rollout.
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let id = sessionStorage.getItem('ff_session_id');
  if (!id) {
    id = Math.random().toString(36).slice(2);
    sessionStorage.setItem('ff_session_id', id);
  }
  return id;
}

const DEV_OVERRIDES_KEY = 'ff_dev_overrides';

/**
 * Get all dev overrides from localStorage.
 */
export function getDevOverrides(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  
  try {
    return JSON.parse(localStorage.getItem(DEV_OVERRIDES_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/**
 * Set a dev override for a feature flag.
 */
export function setDevOverride(key: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  const overrides = getDevOverrides();
  overrides[key] = enabled;
  localStorage.setItem(DEV_OVERRIDES_KEY, JSON.stringify(overrides));
}

/**
 * Clear a dev override for a feature flag.
 */
export function clearDevOverride(key: string): void {
  if (typeof window === 'undefined') return;
  
  const overrides = getDevOverrides();
  delete overrides[key];
  localStorage.setItem(DEV_OVERRIDES_KEY, JSON.stringify(overrides));
}

/**
 * Parse feature flags from environment variables.
 * Format: flag1=true,flag2=false
 */
function parseEnvFlags(): Record<string, boolean> {
  const raw = process.env.NEXT_PUBLIC_FEATURE_FLAGS ?? '';
  if (!raw) return {};
  
  return Object.fromEntries(
    raw.split(',')
      .map(pair => pair.trim())
      .filter(pair => pair.length > 0)
      .map(pair => {
        const [k, v] = pair.split('=');
        return [k?.trim() || '', v?.trim() === 'true'];
      })
      .filter(([k]) => k.length > 0)
  );
}
