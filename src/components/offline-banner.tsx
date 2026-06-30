"use client";

import { AlertCircle } from "lucide-react";
import { useConnectivity } from "./connectivity-provider";

export function OfflineBanner() {
  const { isOffline, pendingOfflineActions } = useConnectivity();

  if (!isOffline) return null;

  return (
    <div className="w-full bg-[var(--error)]/10 border-b border-[var(--error)]/30 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[var(--error)]">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[var(--error)]" />
        <span>You are offline. Network actions are disabled until connectivity returns.</span>
      </div>
      {pendingOfflineActions > 0 && (
        <span className="text-xs font-medium text-[var(--error)]">
          {pendingOfflineActions} action{pendingOfflineActions === 1 ? "" : "s"} will retry when back online.
        </span>
      )}
    </div>
  );
