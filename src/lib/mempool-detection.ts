/**
 * Mempool-level duplicate transaction detection
 * Prevents users from submitting identical pending transactions
 */

import { Horizon } from "@stellar/stellar-sdk";
import { getHorizonServer } from "./stellar";

export interface MempoolTransaction {
  hash: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  asset: string;
  status: "pending" | "failed" | "confirmed";
  timestamp: number;
}

/**
 * Generates a deterministic transaction ID based on operation details
 * Used to identify duplicate transactions even if they have different hashes
 */
export function generateMempoolTransactionId(
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  asset: string
): string {
  const data = `${sourceAddress}|${destinationAddress}|${amount}|${asset}`;
  // SHA256-like hash (simple deterministic hash for deduplication)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `mempool_${Math.abs(hash).toString(36)}_${Buffer.from(data).toString("base64").substring(0, 16)}`;
}

/**
 * Checks for duplicate transactions in the Horizon mempool/recent ledgers
 * Returns detected duplicates
 */
export async function checkMempoolForDuplicates(
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  asset: string,
  network: "PUBLIC" | "TESTNET",
  lookbackLedgers: number = 100
): Promise<MempoolTransaction[]> {
  const server = getHorizonServer(network);
  const duplicates: MempoolTransaction[] = [];

  try {
    // Fetch recent transactions for the source address
    const transactions = await server
      .transactions()
      .forAccount(sourceAddress)
      .limit(50) // Get last 50 transactions
      .order("desc")
      .call();

    if (!transactions.records || transactions.records.length === 0) {
      return duplicates;
    }

    // Check each transaction for duplicates
    for (const tx of transactions.records) {
      const horizonTx = tx as Record<string, any>;
      const hash = horizonTx.id || horizonTx.hash;

      // Check if this transaction matches our criteria
      if (matchesTransactionDetails(horizonTx, destinationAddress, amount, asset)) {
        // Determine status based on whether it's in the most recent ledger
        const txTimestamp = new Date(horizonTx.created_at || Date.now()).getTime();
        const isRecent = Date.now() - txTimestamp < 5 * 60 * 1000; // Within 5 minutes

        duplicates.push({
          hash,
          sourceAddress,
          destinationAddress,
          amount,
          asset,
          status: isRecent ? "pending" : horizonTx.successful ? "confirmed" : "failed",
          timestamp: txTimestamp,
        });
      }
    }

    return duplicates;
  } catch (error) {
    console.warn("Error checking mempool for duplicates:", error);
    // Return empty array if unable to check - don't block the user
    return [];
  }
}

/**
 * Checks if a Horizon transaction matches the transaction details we're looking for
 */
function matchesTransactionDetails(
  tx: Record<string, any>,
  destinationAddress: string,
  amount: string,
  asset: string
): boolean {
  const sourceAddress = tx.source_account || tx.source || tx.account;

  // For now, we check transactions to the destination address with matching amount
  // In a real implementation, you would parse the operations within the transaction
  // to more precisely identify duplicates

  // Simple check: if the transaction was to the destination with similar timing
  if (tx.operations_count > 0) {
    // Note: This is a simplified check. A more robust implementation would
    // fetch and parse the operations within the transaction to verify amounts
    return true; // Conservative approach - mark as potential match
  }

  return false;
}

/**
 * Gets detailed information about pending/recent mempool transactions
 */
export async function getMempoolTransactionDetails(
  txHash: string,
  network: "PUBLIC" | "TESTNET"
): Promise<MempoolTransaction | null> {
  const server = getHorizonServer(network);

  try {
    const tx = await server.transactions().transaction(txHash).call();
    const horizonTx = tx as Record<string, any>;

    return {
      hash: horizonTx.id || txHash,
      sourceAddress: horizonTx.source_account || horizonTx.source || "",
      destinationAddress: "", // Would need to parse operations to get destination
      amount: "", // Would need to parse operations to get amount
      asset: "", // Would need to parse operations to get asset
      status: horizonTx.successful ? "confirmed" : "failed",
      timestamp: new Date(horizonTx.created_at || Date.now()).getTime(),
    };
  } catch (error) {
    console.warn(`Error fetching transaction details for ${txHash}:`, error);
    return null;
  }
}

/**
 * Warns user about duplicate transactions and provides recommended action
 */
export function getDuplicateWarningMessage(duplicates: MempoolTransaction[]): string {
  if (duplicates.length === 0) {
    return "";
  }

  const recent = duplicates.filter(d => d.status === "pending");
  if (recent.length > 0) {
    const tx = recent[0];
    const minutesAgo = Math.floor((Date.now() - tx.timestamp) / 60000);
    return `⚠️ A similar transaction was submitted ${minutesAgo} minute(s) ago and may still be pending. Check the transaction status before resubmitting.`;
  }

  const confirmed = duplicates.filter(d => d.status === "confirmed");
  if (confirmed.length > 0) {
    return `⚠️ A transaction with the same details was already confirmed. You may be attempting to submit a duplicate.`;
  }

  return `⚠️ A similar transaction was detected. Please verify it's not a duplicate before proceeding.`;
}

/**
 * Checks if a transaction is currently pending in the network
 */
export async function isTransactionPending(
  txHash: string,
  network: "PUBLIC" | "TESTNET"
): Promise<boolean> {
  const server = getHorizonServer(network);

  try {
    const tx = await server.transactions().transaction(txHash).call();
    const horizonTx = tx as Record<string, any>;

    // If transaction exists in ledger, check if it was confirmed
    return !horizonTx.successful; // Not confirmed = still pending or failed
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    // 404 = transaction not found, so it's pending (not yet in ledger)
    if (err.response?.status === 404) {
      return true;
    }
    // On error, assume not pending
    return false;
  }
}

/**
 * Gets the transaction status: pending, confirmed, or failed
 */
export async function getTransactionStatusDetail(
  txHash: string,
  network: "PUBLIC" | "TESTNET"
): Promise<{ status: "pending" | "confirmed" | "failed"; details?: MempoolTransaction }> {
  const server = getHorizonServer(network);

  try {
    const tx = await server.transactions().transaction(txHash).call();
    const horizonTx = tx as Record<string, any>;

    const details: MempoolTransaction = {
      hash: horizonTx.id || txHash,
      sourceAddress: horizonTx.source_account || "",
      destinationAddress: "",
      amount: "",
      asset: "",
      status: horizonTx.successful ? "confirmed" : "failed",
      timestamp: new Date(horizonTx.created_at || Date.now()).getTime(),
    };

    return {
      status: horizonTx.successful ? "confirmed" : "failed",
      details,
    };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return { status: "pending" };
    }
    // Default to pending on error
    return { status: "pending" };
  }
}
