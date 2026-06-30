'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Database, Loader2 } from 'lucide-react';
import type { SorobanSimResult } from '@/lib/stellar';

interface ResourcePanelProps {
  status: 'idle' | 'loading' | 'ready' | 'error';
  result?: SorobanSimResult;
  error?: string;
}

export function ResourcePanel({ status, result, error }: ResourcePanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (status === 'idle') return null;

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
      >
        <span className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[var(--text-muted)]" />
          Resource Estimates
          {status === 'loading' && (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--text-muted)]" />
          )}
          {status === 'error' && (
            <span className="text-xs text-[var(--error)]">Failed</span>
          )}
          {status === 'ready' && result && (
            <span className="text-xs text-[var(--text-muted)]">
              {result.instructions.toLocaleString()} instructions
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 pt-1 pb-4">
          {status === 'loading' && (
            <p className="py-2 text-xs text-[var(--text-muted)]">
              Estimating resources…
            </p>
          )}
          {status === 'error' && (
            <p className="py-2 text-xs text-[var(--error)]">{error}</p>
          )}
          {status === 'ready' && result && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <Cpu className="h-3 w-3" /> CPU Instructions
              </div>
              <span className="text-right font-mono">
                {result.instructions.toLocaleString()}
              </span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <Database className="h-3 w-3" /> Ledger Read (bytes)
              </div>
              <span className="text-right font-mono">
                {result.diskReadBytes.toLocaleString()}
              </span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <Database className="h-3 w-3" /> Ledger Write (bytes)
              </div>
              <span className="text-right font-mono">
                {result.writeBytes.toLocaleString()}
              </span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                Footprint Read-Only
              </div>
              <span className="text-right font-mono">
                {result.readOnlyCount} entries
              </span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                Footprint Read-Write
              </div>
              <span className="text-right font-mono">
                {result.readWriteCount} entries
              </span>

              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                Min Resource Fee
              </div>
              <span className="text-right font-mono">
                {result.minResourceFee} stroops
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
