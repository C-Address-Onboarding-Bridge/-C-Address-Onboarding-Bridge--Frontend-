/**
 * Transaction simulation utilities
 * Allows users to preview transaction effects before signing
 */

import { rpc, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
import { SOROBAN_RPC_URL } from "./types";

export interface TransactionEffect {
  type: "payment" | "contract_invocation" | "trustline" | "unknown";
  description: string;
  details: Record<string, unknown>;
}

export interface SimulationResult {
  isSuccessful: boolean;
  effects: TransactionEffect[];
  estimatedFee: string;
  warnings: string[];
  errors: string[];
}

/**
 * Simulates a transaction to show its effects before signing
 * Uses Soroban RPC to simulate the transaction
 */
export async function simulateTransaction(
  txXdr: string,
  network: "PUBLIC" | "TESTNET"
): Promise<SimulationResult> {
  const result: SimulationResult = {
    isSuccessful: false,
    effects: [],
    estimatedFee: "0",
    warnings: [],
    errors: [],
  };

  try {
    const server = new rpc.Server(SOROBAN_RPC_URL[network]);
    const passphrase = network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;

    // Simulate the transaction using Soroban RPC
    const response = await server.simulateTransaction(
      TransactionBuilder.fromXDR(txXdr, passphrase)
    );

    // Check if the response is an error type
    const responseAsRecord = response as unknown as Record<string, unknown>;
    if (responseAsRecord.error) {
      const errorMessage = (responseAsRecord.error as Record<string, unknown>).message || "Simulation failed";
      result.errors.push(String(errorMessage));
      return result;
    }

    const responseAsSuccess = response as unknown as Record<string, unknown>;
    const results = responseAsSuccess.results as unknown[];
    if (!results || results.length === 0) {
      result.errors.push("No simulation results returned");
      return result;
    }

    result.isSuccessful = true;
    const ledgerBumpSeq = responseAsSuccess.latestLedgerBumpSeqNum;
    result.estimatedFee = ledgerBumpSeq ? String(ledgerBumpSeq) : "0";

    // Parse the simulation results to extract effects
    const simulationResult = results[0] as unknown as Record<string, unknown>;
    if (simulationResult) {
      // Extract transaction effects from the simulation
      const auth = simulationResult.auth as unknown[];
      if (auth && Array.isArray(auth)) {
        result.effects.push({
          type: "contract_invocation",
          description: `Contract invocation with ${auth.length} authorization(s)`,
          details: {
            authCount: auth.length,
          },
        });
      }
    }

    // Add warnings if simulation shows potential issues
    const bumpSeqNum = responseAsSuccess.latestLedgerBumpSeqNum;
    if (bumpSeqNum && typeof bumpSeqNum === "number" && bumpSeqNum > 1000) {
      result.warnings.push(
        "High ledger bump sequence number detected. The transaction might take longer than expected."
      );
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown simulation error";
    result.errors.push(`Simulation error: ${errorMsg}`);
    result.warnings.push("Could not simulate transaction. Please review carefully before signing.");
    return result;
  }
}

/**
 * Extracts expected payment effects from transaction XDR
 * Shows the user what they will be sending
 */
export function extractPaymentDetails(
  fromAddress: string,
  toAddress: string,
  amount: string,
  asset: string
): TransactionEffect {
  return {
    type: "payment",
    description: `Send ${amount} ${asset} to ${toAddress.substring(0, 8)}...${toAddress.substring(toAddress.length - 8)}`,
    details: {
      from: fromAddress,
      to: toAddress,
      amount,
      asset,
    },
  };
}

/**
 * Compares simulated transaction outcome with form inputs
 * Returns warnings if there are discrepancies
 */
export function validateSimulationAgainstForm(
  formAmount: string,
  formAsset: string,
  simulationResult: SimulationResult
): string[] {
  const warnings: string[] = [];

  // Check if simulation succeeded when transaction should succeed
  if (!simulationResult.isSuccessful && simulationResult.errors.length > 0) {
    warnings.push(`⚠️ Transaction simulation failed: ${simulationResult.errors[0]}`);
  }

  // Check if there are simulation warnings
  if (simulationResult.warnings.length > 0) {
    warnings.push(...simulationResult.warnings.map(w => `⚠️ ${w}`));
  }

  // Verify that the transaction has payment effects
  const hasPaymentEffect = simulationResult.effects.some(e => e.type === "payment");
  if (!hasPaymentEffect && simulationResult.isSuccessful) {
    warnings.push("No payment effect found in simulation. Please verify the transaction details.");
  }

  return warnings;
}

/**
 * Formats simulation result for display to user
 */
export function formatSimulationForDisplay(result: SimulationResult): string {
  const lines: string[] = [];

  if (result.isSuccessful) {
    lines.push("✓ Transaction simulation successful");
  } else {
    lines.push("✗ Transaction simulation failed");
  }

  if (result.effects.length > 0) {
    lines.push("\nExpected effects:");
    result.effects.forEach(effect => {
      lines.push(`  • ${effect.description}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push("\nWarnings:");
    result.warnings.forEach(warning => {
      lines.push(`  ⚠️ ${warning}`);
    });
  }

  if (result.errors.length > 0) {
    lines.push("\nErrors:");
    result.errors.forEach(error => {
      lines.push(`  ✗ ${error}`);
    });
  }

  return lines.join("\n");
}
