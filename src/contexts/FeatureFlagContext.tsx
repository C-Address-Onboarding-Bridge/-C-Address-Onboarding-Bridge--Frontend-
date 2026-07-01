"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { FEATURE_FLAGS, isFeatureEnabled, getDevOverrides, setDevOverride, clearDevOverride } from '@/lib/featureFlags';

interface FeatureFlagContextValue {
  isEnabled: (key: string) => boolean;
  devOverrides: Record<string, boolean>;
  setOverride: (key: string, enabled: boolean) => void;
  clearOverride: (key: string) => void;
  flags: typeof FEATURE_FLAGS;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [devOverrides, setDevOverrides] = useState<Record<string, boolean>>(
    typeof window !== 'undefined' ? getDevOverrides() : {}
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setDevOverrides(getDevOverrides());
  }, []);

  const isEnabled = (key: string) => isFeatureEnabled(key);

  const setOverride = (key: string, enabled: boolean) => {
    setDevOverride(key, enabled);
    setDevOverrides(getDevOverrides());
  };

  const clearOverride = (key: string) => {
    clearDevOverride(key);
    setDevOverrides(getDevOverrides());
  };

  // Avoid hydration mismatch
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <FeatureFlagContext.Provider 
      value={{ 
        isEnabled, 
        devOverrides, 
        setOverride, 
        clearOverride, 
        flags: FEATURE_FLAGS 
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to check if a feature flag is enabled.
 * Usage: const isEnabled = useFeatureFlag('new_onboarding_flow');
 */
export function useFeatureFlag(key: string): boolean {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) {
    throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  }
  return ctx.isEnabled(key);
}

/**
 * Hook to access the full feature flag context (for the dev panel).
 */
export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return ctx;
}
