import type { BridgeTransaction } from "@/lib/types";

export const MOCK_ADDRESSES = {
  funded: "GABC123DEFGHIJKLMNOPQRSTUVWXYZ12345678901234567890ABC",
  empty: "GABC456DEFGHIJKLMNOPQRSTUVWXYZ12345678901234567890DEF",
  soroban: "CABC789DEFGHIJKLMNOPQRSTUVWXYZ12345678901234567890GHI",
} as const;

export const MOCK_BALANCES = {
  funded: [
    { asset: "XLM", amount: "100.0000000" },
    { asset: "USDC", amount: "50.0000000" },
  ],
  empty: [
    { asset: "XLM", amount: "1.0000000" },
  ],
} as const;

export const MOCK_TRANSACTIONS: BridgeTransaction[] = [
  {
    id: "mock-tx-001",
    hash: "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
    fromAddress: MOCK_ADDRESSES.funded,
    toAddress: MOCK_ADDRESSES.soroban,
    amount: "10.0",
    asset: "XLM",
    status: "confirmed",
    timestamp: Date.now() - 3600000,
    type: "g-to-c",
  },
  {
    id: "mock-tx-002",
    hash: "def456abc123def456abc123def456abc123def456abc123def456abc123def4",
    fromAddress: MOCK_ADDRESSES.funded,
    toAddress: MOCK_ADDRESSES.soroban,
    amount: "25.0",
    asset: "USDC",
    status: "pending",
    timestamp: Date.now() - 600000,
    type: "g-to-c",
  },
];

export const mockFreighterApi = {
  getPublicKey: async () => MOCK_ADDRESSES.funded,
  getNetwork: async () => ({ network: "TESTNET", networkPassphrase: "Test SDF Network ; September 2015" }),
  isConnected: async () => ({ isConnected: true }),
};

export function mockHorizonAccount(state: "funded" | "empty" | "error") {
  if (state === "error") throw new Error("Mock network error");
  return {
    exists: true,
    balances: MOCK_BALANCES[state],
  };
}
