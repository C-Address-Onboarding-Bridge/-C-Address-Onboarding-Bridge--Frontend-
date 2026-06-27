export interface AppEnv {
  stellarNetwork: "PUBLIC" | "TESTNET";
  bridgeContractIdTestnet: string;
  bridgeContractIdMainnet: string;
  bridgeContractIdFuturenet: string;
  /** Legacy single-network contract ID; prefer per-network vars. */
  bridgeContractId: string;
  moonpayApiKey: string;
  transakApiKey: string;
}

interface EnvError {
  key: string;
  message: string;
}

function isContractAddress(value: string): boolean {
  return /^C[A-Z0-9]{55}$/.test(value);
}

let _env: AppEnv | undefined;

/**
 * Validates all NEXT_PUBLIC_* environment variables and returns a typed env
 * object. Throws with a descriptive list of all failures on misconfiguration.
 * Subsequent calls return the cached result without re-validating.
 */
export function validateEnv(): AppEnv {
  if (_env) return _env;

  const errors: EnvError[] = [];

  // NEXT_PUBLIC_STELLAR_NETWORK — optional, must be PUBLIC or TESTNET if set
  const rawNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  let stellarNetwork: "PUBLIC" | "TESTNET" = "TESTNET";
  if (rawNetwork !== undefined && rawNetwork !== "") {
    const upper = rawNetwork.toUpperCase();
    if (upper !== "PUBLIC" && upper !== "TESTNET") {
      errors.push({
        key: "NEXT_PUBLIC_STELLAR_NETWORK",
        message: `must be "PUBLIC" or "TESTNET", got "${rawNetwork}"`,
      });
    } else {
      stellarNetwork = upper as "PUBLIC" | "TESTNET";
    }
  }

  // Contract ID vars — optional, but must be valid C-addresses if provided
  const contractVars = [
    "NEXT_PUBLIC_BRIDGE_CONTRACT_ID_TESTNET",
    "NEXT_PUBLIC_BRIDGE_CONTRACT_ID_MAINNET",
    "NEXT_PUBLIC_BRIDGE_CONTRACT_ID_FUTURENET",
    "NEXT_PUBLIC_BRIDGE_CONTRACT_ID",
  ] as const;

  for (const key of contractVars) {
    const value = process.env[key];
    if (value && !isContractAddress(value)) {
      errors.push({
        key,
        message: `must be a valid C-address (56 chars, starts with "C"), got "${value}"`,
      });
    }
  }

  if (errors.length > 0) {
    const details = errors.map((e) => `  • ${e.key}: ${e.message}`).join("\n");
    throw new Error(`Environment configuration error(s):\n${details}`);
  }

  _env = {
    stellarNetwork,
    bridgeContractIdTestnet: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID_TESTNET ?? "",
    bridgeContractIdMainnet: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID_MAINNET ?? "",
    bridgeContractIdFuturenet: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID_FUTURENET ?? "",
    bridgeContractId: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID ?? "",
    moonpayApiKey: process.env.NEXT_PUBLIC_MOONPAY_API_KEY ?? "",
    transakApiKey: process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? "",
  };

  return _env;
}

/**
 * Returns the validated env singleton. Validates on first call; subsequent
 * calls are effectively free. Prefer importing this over process.env directly
 * so callers get full type inference.
 */
export function getEnv(): AppEnv {
  return validateEnv();
}
