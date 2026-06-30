"use client";

import { WifiOff } from "lucide-react";
import { useConnectivity } from "./connectivity-provider";

export default function OfflineBanner() {
  const { isOnline } = useConnectivity();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--error)] text-white px-4 py-3 text-center"
      aria-label="You are offline. Please check your internet connection."
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-medium">
          You are offline. Please check your internet connection.
        </span>
      </div>
    </div>
  );
}