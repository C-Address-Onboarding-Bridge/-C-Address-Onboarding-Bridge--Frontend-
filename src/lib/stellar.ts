import {
  isConnected,
  getAddress,
  signTransaction,
  getNetwork,
} from "@stellar/freighter-api";
import {
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Networks,
  Asset,
  Horizon,
  rpc,
  Account,
} from "@stellar/stellar-sdk";
import { BRIDGE_CONTRACT_ID } from "./types";
import { withSequenceRetry } from "./sequenceManager";

const HORIZON_URLS = {
  PUBLIC: "https://horizon.stellar.org",
  TESTNET: "https://horizon-testnet.stellar.org",
};

const SOROBAN_RPC_URLS = {
  PUBLIC: "https://soroban-rpc.stellar.org",
  TESTNET: "https://soroban-rpc-testnet.stellar.org",
};

export function getHorizonServer(network: "PUBLIC" | "TESTNET"): Horizon.Server {
  return new Horizon.Server(HORIZON_URLS[network]);
}

export function getSorobanRpcServer(network: "PUBLIC" | "TESTNET"): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URLS[network]);
}

export function getNetworkPassphrase(network: "PUBLIC" | "TESTNET"): string {
  return network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;
}

export async function connectWallet(): Promise<string | null> {
  try {
    const conn = await isConnected();
    if (!conn.isConnected) {
      throw new Error("Freighter not detected");
    }
    const addr = await getAddress();
    return addr.address;
  } catch (e) {
    console.error("Failed to connect wallet:", e);
    return null;
  }
}

export async function checkConnection(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const result = await getAddress();
    return result.address;
  } catch {
    return null;
  }
}

export async function getCurrentNetwork(): Promise<"PUBLIC" | "TESTNET"> {
  try {
    const result = await getNetwork();
    return result.network === Networks.PUBLIC ? "PUBLIC" : "TESTNET";
  } catch {
    return "TESTNET";
  }
}

export function isValidStellarAddress(address: string): boolean {
  return /^[G|C][A-Z0-9]{55}$/.test(address);
}

export function isCAddress(address: string): boolean {
  return address.startsWith("C") && address.length === 56;
}

export function isGAddress(address: string): boolean {
  return address.startsWith("G") && address.length === 56;
}

export interface PaymentResult {
  hash: string;
  successful: boolean;
}

export interface AccountBalances {
  total: string;
  balances: { asset: string; amount: string }[];
}

export interface BridgeTransactionData {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  type: "g-to-c" | "fiat" | "cex";
  hash?: string;
  memo?: string;
}

interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface HorizonPayment {
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

export async function getAccountBalances(
  address: string,
  network: "PUBLIC" | "TESTNET"
): Promise<AccountBalances> {
  const server = getHorizonServer(network);
  try {
    const account = await server.loadAccount(address);
    const balances = (account.balances as HorizonBalance[]).map((b) => ({
      asset: b.asset_type === "native" ? "XLM" : (b.asset_code || "unknown"),
      amount: b.balance,
    }));
    const total = balances.find((b) => b.asset === "XLM")?.amount || "0";
    return { total, balances };
  } catch {
    return { total: "0", balances: [] };
  }
}

export async function fetchRecentTransactions(
  address: string,
  network: "PUBLIC" | "TESTNET",
  limit: number = 10
): Promise<BridgeTransactionData[]> {
  const server = getHorizonServer(network);
  try {
    const payments = await server
      .payments()
      .forAccount(address)
      .limit(limit)
      .order("desc")
      .call();

    return (payments.records as HorizonPayment[]).map((p) => ({
      id: p.id,
      fromAddress: p.from || "",
      toAddress: p.to || "",
      amount: p.amount || "0",
      asset: p.asset_type === "native" ? "XLM" : (p.asset_code || "XLM"),
      status: p.transaction_successful ? "confirmed" as const : "failed" as const,
      timestamp: new Date(p.created_at || Date.now()).getTime(),
      type: "g-to-c" as const,
      hash: p.transaction_hash,
    }));
  } catch {
    return [];
  }
}

export async function buildAndSubmitPayment(
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET"
): Promise<PaymentResult> {
  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);

  const result = await withSequenceRetry(
    sourceAddress,
    async (getSequence) => {
      const sequence = await getSequence();
      const account = new Account(sourceAddress, (sequence - 1n).toString());

      // Load balances for asset validation
      const horizonAccount = await server.loadAccount(sourceAddress);
      let asset: Asset;

      if (assetCode === "XLM") {
        asset = Asset.native();
      } else {
        const balances = horizonAccount.balances as HorizonBalance[];
        const matchingBalance = balances.find((b) => b.asset_code === assetCode);
        if (!matchingBalance) {
          throw new Error(`No ${assetCode} trustline found for this account`);
        }
        asset = new Asset(assetCode, matchingBalance.asset_issuer);
      }

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: passphrase,
      })
        .addOperation(
          Operation.payment({
            destination: destinationAddress,
            asset,
            amount,
          })
        )
        .setTimeout(30)
        .build();

      const signedResult = await signTransaction(tx.toXDR(), {
        networkPassphrase: passphrase,
      });

      if ("error" in signedResult && signedResult.error) {
        throw new Error(`Signing failed: ${signedResult.error}`);
      }

      const signedXDR = (signedResult as { signedTxXdr: string }).signedTxXdr;
      const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);

      const submitResult = await server.submitTransaction(signedTx);

      return {
        hash: submitResult.hash,
        successful: submitResult.successful,
      };
    },
    server
  );

  return result;
}

export async function bridgeViaContract(
  sourceAddress: string,
  cAddress: string,
  amount: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET"
): Promise<PaymentResult> {
  if (!BRIDGE_CONTRACT_ID) {
    return buildAndSubmitPayment(sourceAddress, cAddress, amount, assetCode, network);
  }

  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);

  const result = await withSequenceRetry(
    sourceAddress,
    async (getSequence) => {
      const sequence = await getSequence();
      const account = new Account(sourceAddress, (sequence - 1n).toString());

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: passphrase,
      })
        .addOperation(
          Operation.payment({
            destination: BRIDGE_CONTRACT_ID,
            asset: Asset.native(),
            amount,
          })
        )
        .setTimeout(30)
        .build();

      const unsignedXDR = tx.toXDR();

      const signedResult = await signTransaction(unsignedXDR, {
        networkPassphrase: passphrase,
      });

      if ("error" in signedResult && signedResult.error) {
        throw new Error(`Signing failed: ${signedResult.error}`);
      }

      const signedXDR = (signedResult as { signedTxXdr: string }).signedTxXdr;
      const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);

      try {
        const submitResult = await server.submitTransaction(signedTx);
        return {
          hash: submitResult.hash,
          successful: submitResult.successful,
        };
      } catch (e: unknown) {
        const err = e as { response?: { data?: { extras?: { result_codes?: unknown } } } };
        if (err.response?.data?.extras?.result_codes) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(err.response.data.extras.result_codes)}`
          );
        }
        throw e;
      }
    },
    server
  );

  return result;
}

export function getExplorerUrl(
  network: "PUBLIC" | "TESTNET",
  type: "tx" | "account" | "contract",
  id: string
): string {
  const base = network === "PUBLIC"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
  return `${base}/${type}/${id}`;
}

export function getAccountMinimumBalance(): string {
  return "1.0";
}
