'use client';

import { AlertCircle } from 'lucide-react';
import { useConnectivity } from './connectivity-provider';

export function OfflineBanner() {
  const { isOffline, pendingOfflineActions } = useConnectivity();

  if (!isOffline) return null;

  return (
    <div className="flex w-full flex-col items-center justify-between gap-3 border-b border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)] sm:flex-row">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-[var(--error)]" />
        <span>
          You are offline. Network actions are disabled until connectivity
          returns.
        </span>
      </div>
      {pendingOfflineActions > 0 && (
        <span className="text-xs font-medium text-[var(--error)]">
          {pendingOfflineActions} action{pendingOfflineActions === 1 ? '' : 's'}{' '}
          will retry when back online.
        </span>
      )}
    </div>
  );
}
