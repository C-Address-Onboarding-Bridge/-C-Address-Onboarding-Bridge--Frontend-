export type AddressType = "G" | "C";

export interface WalletState {
  address: string | null;
  publicKey: string | null;
  network: "PUBLIC" | "TESTNET";
  isConnected: boolean;
}

export interface BridgeTransaction {
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

export interface PaymentResult {
  hash: string;
  successful: boolean;
}

export interface AccountBalances {
  total: string;
  balances: { asset: string; amount: string }[];
}

export interface Balance {
  asset: string;
  amount: string;
  contractId?: string;
}

export interface OnrampQuote {
  sourceAmount: string;
  destinationAmount: string;
  fee: string;
  provider: "moonpay" | "transak";
  fiatCurrency: string;
  cryptoCurrency: string;
}

export interface CexConfig {
  name: string;
  logo: string;
  supportedNetworks: string[];
  minWithdrawal: string;
  fee: string;
  withdrawalUrl: string;
}

export const STELLAR_NETWORK = {
  PUBLIC: "PUBLIC",
  TESTNET: "TESTNET",
} as const;

export const SOROBAN_RPC_URL = {
  PUBLIC: "https://soroban-rpc.stellar.org",
  TESTNET: "https://soroban-rpc-testnet.stellar.org",
} as const;

export const HORIZON_URL = {
  PUBLIC: "https://horizon.stellar.org",
  TESTNET: "https://horizon-testnet.stellar.org",
} as const;

export const BRIDGE_CONTRACT_ID = process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID || "";

export { getBridgeContractId, BRIDGE_CONTRACT_IDS } from "@/config/networks";

export const DEFAULT_BRIDGE_ADDRESS = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5";
export const DEFAULT_BRIDGE_MEMO = "1847326491";

export const CEX_LIST: CexConfig[] = [
  {
    name: "Binance",
    logo: "/cex/binance.svg",
    supportedNetworks: ["Stellar"],
    minWithdrawal: "10 USDC",
    fee: "0.1 USDC",
    withdrawalUrl: "https://www.binance.com/en/withdraw",
  },
  {
    name: "Coinbase",
    logo: "/cex/coinbase.svg",
    supportedNetworks: ["Stellar", "Polygon"],
    minWithdrawal: "5 USDC",
    fee: "0.05 USDC",
    withdrawalUrl: "https://www.coinbase.com/withdraw",
  },
  {
    name: "Kraken",
    logo: "/cex/kraken.svg",
    supportedNetworks: ["Stellar"],
    minWithdrawal: "15 USDC",
    fee: "0.15 USDC",
    withdrawalUrl: "https://www.kraken.com/withdraw",
  },
];
