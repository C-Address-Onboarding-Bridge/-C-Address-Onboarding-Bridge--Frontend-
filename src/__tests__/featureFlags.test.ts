import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isFeatureEnabled,
  FEATURE_FLAGS,
  getDevOverrides,
  setDevOverride,
  clearDevOverride,
} from '@/lib/featureFlags';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.NEXT_PUBLIC_FEATURE_FLAGS;
  
  // Clear localStorage mock
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

afterEach(() => {
  process.env = originalEnv;
});

describe('featureFlags', () => {
  describe('isFeatureEnabled', () => {
    it('returns false for unknown flag', () => {
      const result = isFeatureEnabled('unknown_flag');
      expect(result).toBe(false);
    });

    it('returns default value for known flag', () => {
      // Both flags in FEATURE_FLAGS have defaultEnabled: false
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(false);
    });

    it('respects dev override in development', () => {
      process.env.NODE_ENV = 'development';
      setDevOverride('new_onboarding_flow', true);
      
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(true);
    });

    it('returns true when rollout percentage is 100', () => {
      process.env.NODE_ENV = 'production';
      
      // We need to test the rollout logic directly by creating a scenario
      // Since we can't modify FEATURE_FLAGS directly, we test with env var override
      process.env.NEXT_PUBLIC_FEATURE_FLAGS = 'new_onboarding_flow=true';
      
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(true);
    });

    it('returns default when rollout percentage is 0', () => {
      process.env.NODE_ENV = 'production';
      // rolloutPercentage is 0 by default
      
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(false);
    });

    it('is deterministic for same session id', () => {
      process.env.NODE_ENV = 'production';
      
      const sessionId = 'test-session-123';
      const result1 = isFeatureEnabled('new_onboarding_flow', sessionId);
      const result2 = isFeatureEnabled('new_onboarding_flow', sessionId);
      
      expect(result1).toBe(result2);
    });

    it('env var override has priority over default', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_FEATURE_FLAGS = 'new_onboarding_flow=true';
      
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(true);
    });

    it('dev override has priority over env var', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_FEATURE_FLAGS = 'new_onboarding_flow=true';
      setDevOverride('new_onboarding_flow', false);
      
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(false);
    });
  });

  describe('getDevOverrides', () => {
    it('returns empty object when no overrides set', () => {
      const result = getDevOverrides();
      expect(result).toEqual({});
    });

    it('returns overrides from localStorage', () => {
      setDevOverride('new_onboarding_flow', true);
      setDevOverride('advanced_address_validation', false);
      
      const result = getDevOverrides();
      expect(result).toEqual({
        new_onboarding_flow: true,
        advanced_address_validation: false,
      });
    });
  });

  describe('setDevOverride', () => {
    it('persists override to localStorage', () => {
      setDevOverride('new_onboarding_flow', true);
      
      const stored = localStorage.getItem('ff_dev_overrides');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.new_onboarding_flow).toBe(true);
    });

    it('updates existing override', () => {
      setDevOverride('new_onboarding_flow', true);
      setDevOverride('new_onboarding_flow', false);
      
      const result = getDevOverrides();
      expect(result.new_onboarding_flow).toBe(false);
    });
  });

  describe('clearDevOverride', () => {
    it('removes override from localStorage', () => {
      setDevOverride('new_onboarding_flow', true);
      clearDevOverride('new_onboarding_flow');
      
      const result = getDevOverrides();
      expect(result.new_onboarding_flow).toBeUndefined();
    });

    it('does not affect other overrides', () => {
      setDevOverride('new_onboarding_flow', true);
      setDevOverride('advanced_address_validation', true);
      
      clearDevOverride('new_onboarding_flow');
      
      const result = getDevOverrides();
      expect(result.new_onboarding_flow).toBeUndefined();
      expect(result.advanced_address_validation).toBe(true);
    });
  });

  describe('FEATURE_FLAGS', () => {
    it('has at least 2 flags defined', () => {
      expect(FEATURE_FLAGS.length).toBeGreaterThanOrEqual(2);
    });

    it('all flags have required properties', () => {
      FEATURE_FLAGS.forEach(flag => {
        expect(flag).toHaveProperty('key');
        expect(flag).toHaveProperty('name');
        expect(flag).toHaveProperty('description');
        expect(flag).toHaveProperty('defaultEnabled');
        expect(flag).toHaveProperty('rolloutPercentage');
        expect(typeof flag.key).toBe('string');
        expect(typeof flag.name).toBe('string');
        expect(typeof flag.description).toBe('string');
        expect(typeof flag.defaultEnabled).toBe('boolean');
        expect(typeof flag.rolloutPercentage).toBe('number');
      });
    });

    it('rolloutPercentage is between 0 and 100', () => {
      FEATURE_FLAGS.forEach(flag => {
        expect(flag.rolloutPercentage).toBeGreaterThanOrEqual(0);
        expect(flag.rolloutPercentage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('environment variable parsing', () => {
    it('parses single flag from env var', () => {
      process.env.NEXT_PUBLIC_FEATURE_FLAGS = 'new_onboarding_flow=true';
      
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(true);
    });

    it('parses multiple flags from env var', () => {
      process.env.NEXT_PUBLIC_FEATURE_FLAGS = 'new_onboarding_flow=true,advanced_address_validation=false';
      
      expect(isFeatureEnabled('new_onboarding_flow')).toBe(true);
      expect(isFeatureEnabled('advanced_address_validation')).toBe(false);
    });

    it('handles whitespace in env var', () => {
      process.env.NEXT_PUBLIC_FEATURE_FLAGS = 'new_onboarding_flow = true , advanced_address_validation = false';
      
      expect(isFeatureEnabled('new_onboarding_flow')).toBe(true);
      expect(isFeatureEnabled('advanced_address_validation')).toBe(false);
    });

    it('ignores invalid flag values', () => {
      process.env.NEXT_PUBLIC_FEATURE_FLAGS = 'new_onboarding_flow=invalid';
      
      const result = isFeatureEnabled('new_onboarding_flow');
      expect(result).toBe(false);
    });
  });
});
