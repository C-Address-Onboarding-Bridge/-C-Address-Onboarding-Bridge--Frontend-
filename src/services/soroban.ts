import { rpc } from "@stellar/stellar-sdk";
import type { Transaction, FeeBumpTransaction } from "@stellar/stellar-sdk";
import { getSorobanRpcServer } from "@/lib/stellar";

export interface SimulationResult {
  /** Recommended minimum fee in stroops, or null if unavailable. */
  minFee: string | null;
  /** Human-readable error on contract revert; null on success or soft network failure. */
  error: string | null;
}

/**
 * Pre-flight simulates a Soroban transaction.
 * - On contract revert: returns a descriptive error string.
 * - On RPC/network error: falls back gracefully (null minFee, null error) so the pipeline stays unblocked.
 */
export async function simulateSorobanTransaction(
  tx: Transaction | FeeBumpTransaction,
  network: "PUBLIC" | "TESTNET"
): Promise<SimulationResult> {
  try {
    const server = getSorobanRpcServer(network);
    const sim = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(sim)) {
      return { minFee: null, error: parseSimError((sim as rpc.Api.SimulateTransactionErrorResponse).error ?? "") };
    }

    const minFee = (sim as rpc.Api.SimulateTransactionSuccessResponse).minResourceFee ?? null;
    return { minFee: minFee != null ? String(minFee) : null, error: null };
  } catch (e) {
    console.warn("Soroban pre-flight unavailable, falling back to manual fee:", e);
    return { minFee: null, error: null };
  }
}

function parseSimError(raw: string): string {
  if (!raw) return "Simulation failed: Unknown error.";
  const revert = raw.match(/(?:panic|revert)[^:]*:\s*(.+?)(?:\n|$)/i);
  if (revert) return `Contract reverted: ${revert[1].trim()}`;
  const host = raw.match(/HostError:\s*(.+?)(?:\n|$)/i);
  if (host) return `Simulation failed: ${host[1].trim()}`;
  return `Simulation failed: ${raw.slice(0, 120)}`;
}

/** Converts stroops string to XLM display string. */
export function stroopsToXlm(stroops: string): string {
  const n = Number(stroops);
  return isNaN(n) ? "0.0000100" : (n / 10_000_000).toFixed(7);
}
