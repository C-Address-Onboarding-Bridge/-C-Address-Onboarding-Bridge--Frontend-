/**
 * Abstraction layer over @stellar/stellar-sdk and @stellar/freighter-api.
 *
 * All SDK imports used by the application must flow through this module.
 * This minimises the surface area that breaks when the SDK is upgraded:
 * only this file needs to change; the rest of the codebase stays stable.
 *
 * Version compatibility: @stellar/stellar-sdk 15.x, @stellar/freighter-api 6.x
 */

import {
  TransactionBuilder,
  Operation,
  Asset,
  Contract,
  Address,
  Account,
  Networks,
  BASE_FEE,
  StrKey,
  Horizon,
  rpc,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import type { Transaction, FeeBumpTransaction, xdr } from "@stellar/stellar-sdk";
import {
  isConnected as freighterIsConnected,
  getAddress as freighterGetAddress,
  getNetwork as freighterGetNetwork,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";

// ── Re-export SDK primitives ──────────────────────────────────────────────────
// Components and lib modules import from here, never from @stellar/* directly.

export {
  TransactionBuilder,
  Operation,
  Asset,
  Contract,
  Address,
  Account,
  Networks,
  BASE_FEE,
  StrKey,
  Horizon,
  rpc,
  nativeToScVal,
  scValToNative,
};
export type { Transaction, FeeBumpTransaction, xdr };

// ── Horizon ───────────────────────────────────────────────────────────────────

/**
 * Create a Horizon HTTP client for the given network.
 * Centralising construction here means a URL or constructor change only
 * requires editing this one function.
 */
export function createHorizonServer(baseUrl: string): Horizon.Server {
  return new Horizon.Server(baseUrl);
}

// ── Soroban RPC ───────────────────────────────────────────────────────────────

/**
 * Create a Soroban RPC client for the given network.
 */
export function createSorobanServer(baseUrl: string): rpc.Server {
  return new rpc.Server(baseUrl);
}

// ── Simulation helpers ────────────────────────────────────────────────────────

/**
 * Type-safe wrapper that checks whether a simulation response is an error.
 * Isolates the rpc.Api.isSimulationError call so callers are shielded from
 * type-shape changes in new SDK versions.
 */
export function isSimulationError(
  sim: rpc.Api.SimulateTransactionResponse
): sim is rpc.Api.SimulateTransactionErrorResponse {
  return rpc.Api.isSimulationError(sim);
}

/**
 * Extract the min resource fee from a successful simulation response.
 * Returns null when the field is absent (version-safe default).
 */
export function getSimulationMinFee(
  sim: rpc.Api.SimulateTransactionSuccessResponse
): string | null {
  const fee = sim.minResourceFee;
  return fee != null ? String(fee) : null;
}

/**
 * Extract the return value ScVal from a successful simulation response.
 * Returns null when the field is absent (version-safe default).
 */
export function getSimulationRetval(
  sim: rpc.Api.SimulateTransactionSuccessResponse
): xdr.ScVal | null {
  return sim.result?.retval ?? null;
}

// ── Freighter API wrappers ────────────────────────────────────────────────────
// Thin wrappers that translate Freighter's return shapes into plain values,
// so callers don't need to know the exact response shape for each SDK version.

export interface FreighterConnectionResult {
  isConnected: boolean;
}

export async function checkFreighterConnection(): Promise<FreighterConnectionResult> {
  try {
    const result = await freighterIsConnected();
    return { isConnected: result.isConnected };
  } catch {
    return { isConnected: false };
  }
}

export async function getFreighterAddress(): Promise<string | null> {
  try {
    const result = await freighterGetAddress();
    return result.address || null;
  } catch {
    return null;
  }
}

export async function getFreighterNetwork(): Promise<"PUBLIC" | "TESTNET"> {
  try {
    const result = await freighterGetNetwork();
    return result.network === Networks.PUBLIC ? "PUBLIC" : "TESTNET";
  } catch {
    return "TESTNET";
  }
}

export interface FreighterSignResult {
  signedTxXdr: string;
}

export async function signWithFreighter(
  xdrStr: string,
  networkPassphrase: string
): Promise<FreighterSignResult> {
  const result = await freighterSignTransaction(xdrStr, { networkPassphrase });
  if ("error" in result && result.error) {
    throw new Error(`Freighter signing failed: ${result.error}`);
  }
  return { signedTxXdr: (result as { signedTxXdr: string }).signedTxXdr };
}

// ── Address utilities ─────────────────────────────────────────────────────────

/**
 * Validate a Stellar address using the SDK's StrKey utilities.
 * Handles both G-addresses (Ed25519 public keys) and C-addresses (contract IDs).
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  try {
    return (
      StrKey.isValidEd25519PublicKey(address) ||
      isValidContractAddress(address)
    );
  } catch {
    return false;
  }
}

export function isValidContractAddress(address: string): boolean {
  try {
    StrKey.decodeContract(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert an account or contract address string to an Address instance.
 */
export function addressFromString(address: string): Address {
  if (address.startsWith("C")) {
    return Address.contract(StrKey.decodeContract(address));
  }
  return Address.account(StrKey.decodeEd25519PublicKey(address));
}

// ── Transaction helpers ───────────────────────────────────────────────────────

/**
 * Decode an XDR envelope back to a Transaction or FeeBumpTransaction.
 * Wraps TransactionBuilder.fromXDR so callers are isolated from signature
 * changes in future SDK versions.
 */
export function transactionFromXDR(
  xdrStr: string,
  networkPassphrase: string
): Transaction | FeeBumpTransaction {
  return TransactionBuilder.fromXDR(xdrStr, networkPassphrase);
}

// ── Network passphrase helper ─────────────────────────────────────────────────

export function networkPassphrase(network: "PUBLIC" | "TESTNET"): string {
  return network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;
}
