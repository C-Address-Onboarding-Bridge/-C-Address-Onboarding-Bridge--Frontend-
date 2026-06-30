"use client";

import { AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react";
import type { CongestionInfo } from "@/lib/congestion";

interface Props {
  congestion: CongestionInfo | null;
  loading: boolean;
  error: string | null;
}

const levelConfig = {
  none: { icon: Info, color: "text-[var(--success)]", bg: "bg-[var(--success)]/5", border: "border-[var(--success)]/10" },
  mild: { icon: Info, color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/5", border: "border-[var(--warning)]/10" },
  moderate: { icon: AlertTriangle, color: "text-[var(--warning)]", bg: "bg-[var(--warning)]/10", border: "border-[var(--warning)]/20" },
  severe: { icon: AlertCircle, color: "text-[var(--error)]", bg: "bg-[var(--error)]/10", border: "border-[var(--error)]/20" },
};

export default function CongestionBanner({ congestion, loading, error }: Props) {
  if (loading) {
    return (
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-muted)]">Checking network conditions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[var(--error)]">Unable to check network conditions</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Transaction will proceed with default fee.</p>
        </div>
      </div>
    );
  }

  if (!congestion) return null;

  const config = levelConfig[congestion.level];
  const Icon = config.icon;

  if (congestion.level === "none") return null;

  return (
    <div className={`p-4 rounded-lg border ${config.border} ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="space-y-1">
          <p className={`text-sm font-medium ${config.color}`}>Network Congestion Detected</p>
          <p className="text-sm text-[var(--foreground)]">{congestion.message}</p>
          <div className="mt-2 space-y-1">
              <p className="text-xs text-[var(--text-muted)]">
                Suggested fee: <span className="font-mono font-medium text-[var(--foreground)]">{congestion.suggestedFee} stroops</span>
                {" "}(base fee: {congestion.baseFee} stroops)
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Ledger capacity: {congestion.ledgerCapacityUsage.toFixed(0)}% | Fee p90: {congestion.feeChargedP90} stroops
              </p>
              <p className="text-xs text-[var(--warning)] mt-1">
                💡 {congestion.tip}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}
