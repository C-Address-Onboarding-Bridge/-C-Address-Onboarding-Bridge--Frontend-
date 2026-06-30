/**
 * Public API barrel for src/lib/.
 *
 * Files within lib/ import each other via relative paths to avoid circular
 * dependencies. This barrel is for consumers outside lib/ (app pages,
 * components, services).
 *
 * env.ts is intentionally excluded — import it directly from "@/lib/env" so
 * the intent is explicit and tree-shaking stays clean.
 *
 * use-fee-stats.ts is intentionally excluded from this barrel because it
 * carries a "use client" directive. Import it directly from
 * "@/lib/use-fee-stats" inside client components.
 */

// ─── Core types (items not re-exported by stellar.ts) ────────────────────────
export type {
  AddressType,
  WalletState,
  BridgeTransaction,
  Balance,
  OnrampQuote,
  CexConfig,
} from "./types";
export {
  STELLAR_NETWORK,
  SOROBAN_RPC_URL,
  HORIZON_URL,
  BRIDGE_CONTRACT_ID,
  DEFAULT_BRIDGE_ADDRESS,
  DEFAULT_BRIDGE_MEMO,
  CEX_LIST,
  getBridgeContractId,
  BRIDGE_CONTRACT_IDS,
} from "./types";

// ─── Stellar / Soroban interactions ──────────────────────────────────────────
// Also re-exports: PaymentResult, AccountBalances, BridgeTransactionData (from types)
export * from "./stellar";

// ─── App-wide constants ───────────────────────────────────────────────────────
export * from "./constants";

// ─── CEX withdrawal verification ─────────────────────────────────────────────
export * from "./cex-verification";

// ─── Freighter wallet capability management ───────────────────────────────────
export * from "./freighter-capabilities";

// ─── Mempool duplicate detection ─────────────────────────────────────────────
export * from "./mempool-detection";

// ─── Fiat onramp estimation ───────────────────────────────────────────────────
export * from "./onramp";

// ─── Rate limiting and submission deduplication ───────────────────────────────
export * from "./rate-limit";

// ─── Input sanitization ───────────────────────────────────────────────────────
export * from "./sanitization";

// ─── Encrypted local storage ──────────────────────────────────────────────────
export * from "./secure-storage";

// ─── Transaction simulation ───────────────────────────────────────────────────
export * from "./transaction-simulation";

// ─── Encrypted user preferences ──────────────────────────────────────────────
export * from "./user-preferences";
