export const BRIDGE_CONTRACT_IDS: Record<string, string> = {
  TESTNET: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID_TESTNET || "",
  PUBLIC: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID_MAINNET || "",
  FUTURENET: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID_FUTURENET || "",
};

/** Returns the bridge contract ID for the given network, or empty string if unconfigured. */
export function getBridgeContractId(network: string): string {
  return BRIDGE_CONTRACT_IDS[network] ?? "";
}

/** Error messages for network/contract configuration issues. */
export const NETWORK_CONFIG_ERRORS = {
  NO_CONTRACT:
    "Bridge contract is not deployed or configured on the selected network.",
  NETWORK_MISMATCH:
    "Network mismatch detected. Please switch your wallet to match the target bridge network.",
} as const;
