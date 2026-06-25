/** Stellar asset codes used throughout the application */
export const ASSET_XLM = "XLM" as const;
export const ASSET_USDC = "USDC" as const;

/** Horizon API asset_type value for native XLM */
export const NATIVE_ASSET_TYPE = "native" as const;

/** Fallback label when an asset code cannot be determined */
export const UNKNOWN_ASSET = "unknown" as const;

/** Regex matching valid Stellar G- and C-addresses (56-char base-32) */
export const STELLAR_ADDRESS_REGEX = /^[G|C][A-Z0-9]{55}$/;

/** Expected length of a Stellar public key (G or C address) */
export const STELLAR_ADDRESS_LENGTH = 56;

/** Named network identifiers */
export const NETWORK_PUBLIC = "PUBLIC" as const;
export const NETWORK_TESTNET = "TESTNET" as const;

/** Human-readable labels for each network */
export const NETWORK_DISPLAY: Record<string, string> = {
  [NETWORK_PUBLIC]: "Mainnet",
  [NETWORK_TESTNET]: "Testnet",
};

/** Default network when none is configured */
export const DEFAULT_NETWORK = NETWORK_TESTNET;

/** CEX withdrawal network identifiers */
export const CEX_NETWORK_STELLAR = "Stellar" as const;
export const CEX_NETWORKS = ["Stellar", "Polygon", "Ethereum"] as const;

/** Time intervals in milliseconds */
export const WALLET_INITIAL_DELAY_MS = 0;
export const WALLET_POLL_INTERVAL_MS = 3000;
export const DASHBOARD_REFRESH_MS = 30000;
export const TX_POLL_INTERVAL_MS = 5000;
export const COPY_FEEDBACK_MS = 2000;
export const REDIRECT_DELAY_MS = 1500;

/** Maximum polling attempts before giving up on transaction confirmation */
export const TX_MAX_ATTEMPTS = 24;

/** Stellar transaction timebound (seconds from build) */
export const STELLAR_TX_TIMEOUT_SECONDS = 30;

/** Default limit for fetching recent payments */
export const DEFAULT_TX_LIMIT = 10;

/** Minimum XLM reserve buffer used for balance validation */
export const XLM_RESERVE_BUFFER = 0.00001;

/** Base-2 reserve required for a new Stellar account (in XLM) */
export const ACCOUNT_MIN_BALANCE = "1.0";

/** Fallback zero balance string */
export const BALANCE_INITIAL = "0";

/** Onramp provider fee rates (as decimal multipliers) */
export const MOONPAY_FEE_RATE = 0.045;
export const TRANSAK_FEE_RATE = 0.05;

/** Multipliers applied after fee deduction to compute estimated receive */
export const BASE_RECEIVE_MULTIPLIER = 0.95;
export const MOONPAY_RECEIVE_MULTIPLIER = 1;
export const TRANSAK_RECEIVE_MULTIPLIER = 0.95;

/** Onramp provider identifiers */
export const PROVIDER_MOONPAY = "moonpay" as const;
export const PROVIDER_TRANSAK = "transak" as const;

/** Number of decimal places for display formatting */
export const XLM_DISPLAY_DECIMALS = 2;
export const XLM_PRECISE_DECIMALS = 7;
export const ASSET_DISPLAY_DECIMALS = 6;
export const FIAT_DISPLAY_DECIMALS = 2;

/** Stellar.explorer base URLs per network */
export const EXPLORER_BASE_URLS: Record<string, string> = {
  [NETWORK_PUBLIC]: "https://stellar.expert/explorer/public",
  [NETWORK_TESTNET]: "https://stellar.expert/explorer/testnet",
};

/** Onramp provider base URLs */
export const MOONPAY_BASE_URL = "https://buy.moonpay.com";
export const TRANSAK_BASE_URL = "https://global.transak.com";

/** Environment variable keys used for configuration */
export const ENV_BRIDGE_CONTRACT_ID = "NEXT_PUBLIC_BRIDGE_CONTRACT_ID";
export const ENV_MOONPAY_API_KEY = "NEXT_PUBLIC_MOONPAY_API_KEY";
export const ENV_TRANSAK_API_KEY = "NEXT_PUBLIC_TRANSAK_API_KEY";
export const ENV_STELLAR_NETWORK = "NEXT_PUBLIC_STELLAR_NETWORK";

/** Shared status strings used across components */
export const STATUS_PENDING = "pending" as const;
export const STATUS_CONFIRMED = "confirmed" as const;
export const STATUS_FAILED = "failed" as const;
export const STATUS_IDLE = "idle" as const;
export const STATUS_SIGNING = "signing" as const;
export const STATUS_SUBMITTING = "submitting" as const;
export const STATUS_SUCCESS = "success" as const;
export const STATUS_ERROR = "error" as const;
export const STATUS_CONFIGURED = "configured" as const;
export const STATUS_MISSING = "missing" as const;
export const STATUS_UNKNOWN = "unknown" as const;
export const STATUS_HAS = "has" as const;

/** Step labels for multi-step forms */
export const STEP_FORM = "form" as const;
export const STEP_REVIEW = "review" as const;
export const STEP_CONFIRM = "confirm" as const;
export const STEP_REDIRECT = "redirect" as const;

/** Bridge transaction type identifiers */
export const TX_TYPE_G_TO_C = "g-to-c" as const;
export const TX_TYPE_FIAT = "fiat" as const;
export const TX_TYPE_CEX = "cex" as const;

/** Onramp widget parameters */
export const WALLET_CHAIN_STELLAR = "Stellar" as const;
export const DEFAULT_CRYPTO_CURRENCY = "USDC" as const;

/** USDC issuer addresses for each Stellar network */
export const USDC_ISSUERS: Record<string, string> = {
  PUBLIC: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  TESTNET: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};
