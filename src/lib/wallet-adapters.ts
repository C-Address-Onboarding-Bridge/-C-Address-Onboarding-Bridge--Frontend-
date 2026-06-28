/**
 * Wallet adapter abstraction for multi-wallet support.
 *
 * Each adapter wraps a different Stellar wallet extension behind a common
 * interface so the rest of the app doesn't care which wallet is active.
 *
 * Supported wallets
 * ─────────────────
 * • Freighter  – https://freighter.app          (chrome extension)
 * • Lobstr     – https://lobstr.co/wallet       (chrome extension)
 * • xBull      – https://xbull.app              (chrome extension)
 * • Albedo     – https://albedo.link            (web-based, iframe pop-up)
 *
 * Detection strategy
 * ──────────────────
 * Browser extensions inject objects onto `window`:
 *   Freighter → window.freighter
 *   Lobstr    → window.lobstr
 *   xBull     → window.xBullSDK
 *   Albedo    → always available (loaded from albedo.link CDN or bundled)
 *
 * SEP-0007 (stellar.toml / web+stellar: URI handler) is a payment-request
 * standard, not a signing API, so adapters use each wallet's native JS SDK
 * rather than SEP-0007 URIs.
 */

import { Networks } from "@stellar/stellar-sdk";
import {
  isConnected as freighterIsConnected,
  getAddress as freighterGetAddress,
  getNetwork as freighterGetNetwork,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";

// ─── Shared types ────────────────────────────────────────────────────────────

export type WalletId = "freighter" | "lobstr" | "xbull" | "albedo";

export interface WalletAdapter {
  id: WalletId;
  name: string;
  /** Returns true when the extension / service is available in this browser. */
  isAvailable(): boolean;
  /** Attempt to connect and return the public key, or null on failure. */
  connect(): Promise<string | null>;
  /** Return the currently authorised public key without prompting. */
  getAddress(): Promise<string | null>;
  /** Return "PUBLIC" or "TESTNET" for the wallet's active network. */
  getNetwork(): Promise<"PUBLIC" | "TESTNET">;
  /** Sign an XDR-encoded transaction envelope and return the signed XDR. */
  signTransaction(xdr: string, networkPassphrase: string): Promise<string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function networkFromPassphrase(passphrase: string | undefined): "PUBLIC" | "TESTNET" {
  return passphrase === Networks.PUBLIC ? "PUBLIC" : "TESTNET";
}

// ─── Freighter adapter ───────────────────────────────────────────────────────

export const freighterAdapter: WalletAdapter = {
  id: "freighter",
  name: "Freighter",

  isAvailable() {
    return typeof window !== "undefined" && "freighter" in window;
  },

  async connect() {
    try {
      const conn = await freighterIsConnected();
      if (!conn.isConnected) return null;
      const { address } = await freighterGetAddress();
      return address || null;
    } catch {
      return null;
    }
  },

  async getAddress() {
    try {
      const { address } = await freighterGetAddress();
      return address || null;
    } catch {
      return null;
    }
  },

  async getNetwork() {
    try {
      const result = await freighterGetNetwork();
      return result.network === Networks.PUBLIC ? "PUBLIC" : "TESTNET";
    } catch {
      return "TESTNET";
    }
  },

  async signTransaction(xdr, networkPassphrase) {
    const result = await freighterSignTransaction(xdr, { networkPassphrase });
    if ("error" in result && result.error) throw new Error(`Freighter: ${result.error}`);
    return (result as { signedTxXdr: string }).signedTxXdr;
  },
};

// ─── Lobstr adapter ──────────────────────────────────────────────────────────
// Lobstr injects window.lobstr with a Connect Wallet interface.
// Docs: https://lobstr.co/lobstr-wallet-api

interface LobstrWindow {
  lobstr?: {
    isConnected(): Promise<boolean>;
    getPublicKey(): Promise<string>;
    getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
    signTransaction(xdr: string): Promise<{ signedXDR: string }>;
  };
}

export const lobstrAdapter: WalletAdapter = {
  id: "lobstr",
  name: "Lobstr",

  isAvailable() {
    return typeof window !== "undefined" && "lobstr" in window;
  },

  async connect() {
    try {
      const lobstr = (window as LobstrWindow).lobstr;
      if (!lobstr) return null;
      const connected = await lobstr.isConnected();
      if (!connected) return null;
      return await lobstr.getPublicKey();
    } catch {
      return null;
    }
  },

  async getAddress() {
    try {
      const lobstr = (window as LobstrWindow).lobstr;
      return lobstr ? await lobstr.getPublicKey() : null;
    } catch {
      return null;
    }
  },

  async getNetwork() {
    try {
      const lobstr = (window as LobstrWindow).lobstr;
      if (!lobstr) return "TESTNET";
      const { networkPassphrase } = await lobstr.getNetwork();
      return networkFromPassphrase(networkPassphrase);
    } catch {
      return "TESTNET";
    }
  },

  async signTransaction(xdr) {
    const lobstr = (window as LobstrWindow).lobstr;
    if (!lobstr) throw new Error("Lobstr wallet not found");
    const { signedXDR } = await lobstr.signTransaction(xdr);
    return signedXDR;
  },
};

// ─── xBull adapter ───────────────────────────────────────────────────────────
// xBull injects window.xBullSDK.
// Docs: https://docs.xbull.app/wallet-sdk

interface XBullWindow {
  xBullSDK?: {
    connect(): Promise<{ publicKey: string }>;
    getPublicKey(): Promise<string>;
    getNetwork(): Promise<{ networkPassphrase: string }>;
    sign(params: { xdr: string; publicKey: string; network: string }): Promise<{ signedXDR: string }>;
  };
}

export const xbullAdapter: WalletAdapter = {
  id: "xbull",
  name: "xBull",

  isAvailable() {
    return typeof window !== "undefined" && "xBullSDK" in window;
  },

  async connect() {
    try {
      const sdk = (window as XBullWindow).xBullSDK;
      if (!sdk) return null;
      const { publicKey } = await sdk.connect();
      return publicKey || null;
    } catch {
      return null;
    }
  },

  async getAddress() {
    try {
      const sdk = (window as XBullWindow).xBullSDK;
      return sdk ? await sdk.getPublicKey() : null;
    } catch {
      return null;
    }
  },

  async getNetwork() {
    try {
      const sdk = (window as XBullWindow).xBullSDK;
      if (!sdk) return "TESTNET";
      const { networkPassphrase } = await sdk.getNetwork();
      return networkFromPassphrase(networkPassphrase);
    } catch {
      return "TESTNET";
    }
  },

  async signTransaction(xdr, networkPassphrase) {
    const sdk = (window as XBullWindow).xBullSDK;
    if (!sdk) throw new Error("xBull wallet not found");
    const publicKey = await sdk.getPublicKey();
    const { signedXDR } = await sdk.sign({ xdr, publicKey, network: networkPassphrase });
    return signedXDR;
  },
};

// ─── Albedo adapter ──────────────────────────────────────────────────────────
// Albedo is a web-based signer that opens a pop-up window — no extension required.
// It is always "available" but requires the user to have an Albedo account.
// Docs: https://albedo.link/docs

interface AlbedoWindow {
  albedo?: {
    publicKey(params: Record<string, unknown>): Promise<{ pubkey: string }>;
    tx(params: { xdr: string; network: string; submit?: boolean }): Promise<{ signed_envelope_xdr: string }>;
  };
}

export const albedoAdapter: WalletAdapter = {
  id: "albedo",
  name: "Albedo",

  // Albedo loads via a bundled SDK; we check for the injected global.
  isAvailable() {
    return typeof window !== "undefined" && "albedo" in window;
  },

  async connect() {
    try {
      const albedo = (window as AlbedoWindow).albedo;
      if (!albedo) return null;
      const { pubkey } = await albedo.publicKey({});
      return pubkey || null;
    } catch {
      return null;
    }
  },

  async getAddress() {
    try {
      const albedo = (window as AlbedoWindow).albedo;
      if (!albedo) return null;
      const { pubkey } = await albedo.publicKey({});
      return pubkey || null;
    } catch {
      return null;
    }
  },

  // Albedo does not expose a getNetwork call; default to TESTNET unless overridden.
  async getNetwork() {
    return "TESTNET";
  },

  async signTransaction(xdr, networkPassphrase) {
    const albedo = (window as AlbedoWindow).albedo;
    if (!albedo) throw new Error("Albedo wallet not found");
    // Albedo expects "testnet" or "public" (lowercase).
    const network = networkPassphrase === Networks.PUBLIC ? "public" : "testnet";
    const { signed_envelope_xdr } = await albedo.tx({ xdr, network, submit: false });
    return signed_envelope_xdr;
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const WALLET_ADAPTERS: Record<WalletId, WalletAdapter> = {
  freighter: freighterAdapter,
  lobstr: lobstrAdapter,
  xbull: xbullAdapter,
  albedo: albedoAdapter,
};

/** Returns the list of wallets detected in the current browser environment. */
export function getAvailableWallets(): WalletAdapter[] {
  return Object.values(WALLET_ADAPTERS).filter((w) => w.isAvailable());
}
