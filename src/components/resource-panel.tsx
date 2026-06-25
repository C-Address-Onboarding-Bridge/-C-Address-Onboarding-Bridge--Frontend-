"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Cpu, Database, Loader2 } from "lucide-react";
import type { SorobanSimResult } from "@/lib/stellar";

interface ResourcePanelProps {
  status: "idle" | "loading" | "ready" | "error";
  result?: SorobanSimResult;
  error?: string;
}

export function ResourcePanel({ status, result, error }: ResourcePanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (status === "idle") return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-[var(--surface)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[var(--text-muted)]" />
          Resource Estimates
          {status === "loading" && <Loader2 className="w-3 h-3 animate-spin text-[var(--text-muted)]" />}
          {status === "error" && <span className="text-xs text-[var(--error)]">Failed</span>}
          {status === "ready" && result && (
            <span className="text-xs text-[var(--text-muted)]">{result.instructions.toLocaleString()} instructions</span>
          )}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)]">
          {status === "loading" && (
            <p className="text-xs text-[var(--text-muted)] py-2">Estimating resources…</p>
          )}
          {status === "error" && (
            <p className="text-xs text-[var(--error)] py-2">{error}</p>
          )}
          {status === "ready" && result && (
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <Cpu className="w-3 h-3" /> CPU Instructions
              </div>
              <span className="text-right font-mono">{result.instructions.toLocaleString()}</span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <Database className="w-3 h-3" /> Ledger Read (bytes)
              </div>
              <span className="text-right font-mono">{result.diskReadBytes.toLocaleString()}</span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <Database className="w-3 h-3" /> Ledger Write (bytes)
              </div>
              <span className="text-right font-mono">{result.writeBytes.toLocaleString()}</span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                Footprint Read-Only
              </div>
              <span className="text-right font-mono">{result.readOnlyCount} entries</span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                Footprint Read-Write
              </div>
              <span className="text-right font-mono">{result.readWriteCount} entries</span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                Min Resource Fee
              </div>
              <span className="text-right font-mono">{result.minResourceFee} stroops</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
