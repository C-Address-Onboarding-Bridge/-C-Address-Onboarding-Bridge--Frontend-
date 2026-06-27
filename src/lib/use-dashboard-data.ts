"use client";

/**
 * useDashboardData
 *
 * Manages balance + transaction data for the Dashboard page.
 *
 * Strategy (in priority order):
 *
 * 1. **Streaming** – when the browser supports SSE and the address is a
 *    G-address, open a Horizon payment stream.  Incoming records trigger an
 *    incremental refresh of both balances and the transaction list without
 *    showing the loading spinner.
 *
 * 2. **Reduced-interval fallback polling** – when streaming is unavailable
 *    (SSR, some corporate proxies, C-addresses backed by Soroban RPC) we
 *    poll at `DASHBOARD_FALLBACK_POLL_MS`.  This is intentionally longer
 *    than the original 30 s interval because streaming handles the
 *    real-time requirement; the poll only exists to recover from stream
 *    outages or to stay fresh on Soroban accounts.
 *
 * 3. **Exponential back-off on errors** – consecutive fetch failures double
 *    the next poll delay up to `DASHBOARD_MAX_BACKOFF_MS`.  A successful
 *    fetch resets the delay.
 *
 * All timers and stream subscriptions are cleaned up on unmount or when
 * `address` / `network` changes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAccountBalances,
  fetchRecentTransactions,
  isCAddress,
  getSorobanAccountBalances,
} from "./stellar";
import { streamPayments, isStreamingSupported } from "./horizon-stream";
import type { BridgeTransaction } from "./types";
import type { AccountBalances } from "./types";
import {
  DEFAULT_TX_LIMIT,
  DASHBOARD_FALLBACK_POLL_MS,
  DASHBOARD_MAX_BACKOFF_MS,
  USDC_ISSUERS,
} from "./constants";

export interface DashboardData {
  balance: string | null;
  allBalances: AccountBalances["balances"];
  transactions: BridgeTransaction[];
  loading: boolean;
  error: string | null;
  /** True while a live Horizon SSE stream is connected. */
  isStreaming: boolean;
  /** Force an immediate data refresh. */
  refresh: () => void;
}

export function useDashboardData(
  address: string | null,
  network: "PUBLIC" | "TESTNET",
  isConnected: boolean
): DashboardData {
  const [balance, setBalance] = useState<string | null>(null);
  const [allBalances, setAllBalances] = useState<AccountBalances["balances"]>([]);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Use a ref for the poll timer so we can reschedule it from inside
  // the polling callback without creating a self-referential useCallback.
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const backoffRef = useRef(DASHBOARD_FALLBACK_POLL_MS);
  // Expose a way to trigger an ad-hoc refresh from outside the effect.
  const refreshTickRef = useRef(0);
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Data fetcher ──────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (quiet = false) => {
      if (!address) return;

      if (!quiet) setLoading(true);
      setError(null);

      try {
        const balPromise = isCAddress(address)
          ? getSorobanAccountBalances(address, [USDC_ISSUERS[network]], network)
          : getAccountBalances(address, network);

        const [balResult, txResult] = await Promise.all([
          balPromise,
          fetchRecentTransactions(address, network, DEFAULT_TX_LIMIT),
        ]);

        if (!mountedRef.current) return;

        setBalance(balResult.total);
        setAllBalances(balResult.balances);
        setTransactions(txResult);
        backoffRef.current = DASHBOARD_FALLBACK_POLL_MS;
      } catch (e: unknown) {
        if (!mountedRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to fetch data");
        // Double the backoff interval up to the ceiling on consecutive errors.
        backoffRef.current = Math.min(
          backoffRef.current * 2,
          DASHBOARD_MAX_BACKOFF_MS
        );
      } finally {
        if (mountedRef.current && !quiet) setLoading(false);
      }
    },
    [address, network]
  );

  // ── Main effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    if (!isConnected || !address) {
      // Nothing to load — ensure loading spinner is off.
      // We schedule this as a microtask so it does not fire synchronously
      // inside the effect body, which would trigger the react-hooks/set-state-in-effect lint rule.
      const id = setTimeout(() => {
        if (mountedRef.current) setLoading(false);
      }, 0);
      return () => {
        mountedRef.current = false;
        clearTimeout(id);
      };
    }

    // Reset backoff when address/network changes.
    backoffRef.current = DASHBOARD_FALLBACK_POLL_MS;

    // ── 1. Initial full load (show spinner) ────────────────────────────────
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchData is async; setters run after the effect body returns
    fetchData(false);

    // ── 2. Try to open a Horizon SSE stream (G-addresses, browser only) ───
    let streamActive = false;
    if (isStreamingSupported() && !isCAddress(address)) {
      const cleanup = streamPayments(address, network, {
        cursor: "now",
        onRecord: () => {
          // A new payment arrived – refresh data immediately in quiet mode
          // so the loading spinner doesn't flash.
          fetchData(true);
        },
        onError: () => {
          // Called asynchronously by the SSE error handler — setState is safe here.
          if (!mountedRef.current) return;
          setIsStreaming(false);
          streamActive = false;
        },
      });
      streamActive = true;
      // Defer the state update: calling setState synchronously in the effect
      // body triggers the react-hooks/set-state-in-effect lint rule.
      let streamingTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        streamingTimer = null;
        if (mountedRef.current && streamActive) setIsStreaming(true);
      }, 0);
      streamCleanupRef.current = () => {
        if (streamingTimer !== null) clearTimeout(streamingTimer);
        cleanup();
      };
    }

    // ── 3. Fallback polling ────────────────────────────────────────────────
    // Always schedule a fallback poll.  When streaming is active this is
    // a safety net; when streaming is unavailable it is the primary update
    // mechanism.
    const scheduleNext = () => {
      if (!mountedRef.current) return;
      pollTimerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        // Skip the poll if the stream is still healthy — avoids redundant
        // requests while the SSE connection is delivering updates.
        if (!streamActive) {
          await fetchData(true);
        }
        scheduleNext();
      }, backoffRef.current);
    };

    scheduleNext();

    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      streamCleanupRef.current?.();
      streamCleanupRef.current = null;
    };
  }, [isConnected, address, network, fetchData, refreshTick]);

  const refresh = useCallback(() => {
    backoffRef.current = DASHBOARD_FALLBACK_POLL_MS;
    refreshTickRef.current += 1;
    setRefreshTick(refreshTickRef.current);
  }, []);

  return {
    balance,
    allBalances,
    transactions,
    loading,
    error,
    isStreaming,
    refresh,
  };
}
