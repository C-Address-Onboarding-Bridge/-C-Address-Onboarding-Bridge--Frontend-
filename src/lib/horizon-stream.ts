/**
 * Horizon Streaming helpers
 *
 * Horizon exposes Server-Sent Events (SSE) streams for payments, transactions,
 * and effects.  This module wraps those streams and provides:
 *
 * - `streamPayments`   – subscribes to new payments for an account
 * - `streamTransactions` – subscribes to new transactions for an account
 * - `isStreamingSupported` – sniffs whether the current environment can
 *   sustain an SSE connection (returns false in SSR / non-browser contexts)
 *
 * Each stream function returns a `() => void` cleanup handle that callers
 * MUST invoke on unmount to prevent memory leaks.
 */

import { Horizon } from "@stellar/stellar-sdk";
import { HORIZON_URL } from "./types";

export interface StreamPaymentRecord {
  id: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  transaction_successful?: boolean;
  created_at?: string;
  transaction_hash?: string;
}

export interface StreamOptions {
  /** Called for each new record delivered by the SSE stream. */
  onRecord: (record: StreamPaymentRecord) => void;
  /** Called when the stream encounters an error.  Returning `true` stops retries. */
  onError?: (error: Error) => boolean | void;
  /**
   * Cursor to start streaming from.  Use `"now"` to receive only future
   * records (default) or a specific paging token to replay from a point.
   */
  cursor?: string;
}

/**
 * Returns true when the runtime environment supports persistent SSE
 * connections.  Always false in Node/SSR.
 */
export function isStreamingSupported(): boolean {
  return typeof window !== "undefined" && typeof EventSource !== "undefined";
}

/**
 * Stream new payments for `address` from the Horizon endpoint matching
 * `network`.  Returns a cleanup function – call it on component unmount.
 *
 * Falls back gracefully: if `EventSource` is unavailable the call is a no-op
 * and the returned cleanup is also a no-op.
 */
export function streamPayments(
  address: string,
  network: "PUBLIC" | "TESTNET",
  options: StreamOptions
): () => void {
  if (!isStreamingSupported()) {
    return () => {};
  }

  const server = new Horizon.Server(HORIZON_URL[network]);
  const { onRecord, onError, cursor = "now" } = options;

  let stop: (() => void) | null = null;

  try {
    stop = server
      .payments()
      .forAccount(address)
      .cursor(cursor)
      .stream({
        onmessage: (record) => {
          onRecord(record as unknown as StreamPaymentRecord);
        },
        onerror: (event) => {
          const err = event instanceof Error ? event : new Error("Horizon payment stream error");
          const shouldStop = onError?.(err);
          if (shouldStop) {
            stop?.();
          }
        },
        reconnectTimeout: 5000,
      });
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }

  return () => {
    stop?.();
  };
}

/**
 * Stream new transactions for `address`.  Returns a cleanup function.
 */
export function streamTransactions(
  address: string,
  network: "PUBLIC" | "TESTNET",
  options: StreamOptions
): () => void {
  if (!isStreamingSupported()) {
    return () => {};
  }

  const server = new Horizon.Server(HORIZON_URL[network]);
  const { onRecord, onError, cursor = "now" } = options;

  let stop: (() => void) | null = null;

  try {
    stop = server
      .transactions()
      .forAccount(address)
      .cursor(cursor)
      .stream({
        onmessage: (record) => {
          onRecord(record as unknown as StreamPaymentRecord);
        },
        onerror: (event) => {
          const err = event instanceof Error ? event : new Error("Horizon transaction stream error");
          const shouldStop = onError?.(err);
          if (shouldStop) {
            stop?.();
          }
        },
        reconnectTimeout: 5000,
      });
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error(String(e)));
    return () => {};
  }

  return () => {
    stop?.();
  };
}
