"use client";

import { useState } from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

/**
 * Developer panel for toggling feature flags in development mode.
 * Only renders when NODE_ENV is 'development'.
 */
export function FeatureFlagPanel() {
  if (process.env.NODE_ENV !== 'development') return null;

  const { flags, devOverrides, isEnabled, setOverride, clearOverride } = useFeatureFlags();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button — fixed bottom-right */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white
          text-xs px-3 py-2 rounded-full shadow-lg hover:bg-gray-700
          focus-visible:ring-2 focus-visible:ring-white transition-colors"
        aria-label="Toggle feature flags panel"
        aria-expanded={isOpen}
      >
        🚩 Flags
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Feature flags developer panel"
          className="fixed bottom-16 right-4 z-50 w-80 bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl
            overflow-hidden"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Feature Flags
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Dev overrides only — not persisted to server
            </p>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
            {flags.map(flag => {
              const hasOverride = flag.key in devOverrides;
              const enabled = isEnabled(flag.key);
              return (
                <li key={flag.key} className="p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {flag.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {flag.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Rollout: {flag.rolloutPercentage}%
                      {hasOverride && (
                        <span className="ml-2 text-amber-500 font-semibold">
                          ⚠ Overridden
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setOverride(flag.key, !enabled)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors
                        ${enabled ? 'bg-green-500' : 'bg-gray-300'}
                        focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500`}
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Toggle ${flag.name}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white
                          shadow transform transition-transform
                          ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                      />
                    </button>
                    {hasOverride && (
                      <button
                        onClick={() => clearOverride(flag.key)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-1 transition-colors"
                        aria-label={`Reset ${flag.name} to default`}
                        title="Reset to default"
                      >
                        ↩
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
