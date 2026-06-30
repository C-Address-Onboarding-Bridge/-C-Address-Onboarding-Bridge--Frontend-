"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  WALLET_ADAPTERS,
  getAvailableWallets,
  type WalletId,
  type WalletAdapter,
} from "@/lib/wallet-adapters";
import {
  WALLET_INITIAL_DELAY_MS,
  WALLET_POLL_INTERVAL_MS,
  DEFAULT_NETWORK,
} from "@/lib/constants";
import { addRecentAddress } from "@/lib/user-preferences";
import { ensureRequiredCapabilities, revokeAllCapabilities } from "@/lib/freighter-capabilities";
import { clearAllUserData } from "@/lib/user-preferences";

const APP_NETWORK_KEY = "stellar_app_network";
const ACTIVE_WALLET_KEY = "stellar_active_wallet";

function getEnvNetwork(): "PUBLIC" | "TESTNET" {
  const v = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toUpperCase();
  return v === "PUBLIC" ? "PUBLIC" : "TESTNET";
}

function loadPersistedNetwork(): "PUBLIC" | "TESTNET" {
  if (typeof window === "undefined") return getEnvNetwork();
  const stored = localStorage.getItem(APP_NETWORK_KEY);
  return stored === "PUBLIC" || stored === "TESTNET" ? stored : getEnvNetwork();
}

function loadPersistedWalletId(): WalletId | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACTIVE_WALLET_KEY) as WalletId | null;
  return stored && stored in WALLET_ADAPTERS ? stored : null;
}

interface WalletContextType {
  address: string | null;
  publicKey: string | null;
  /** The network reported by the connected wallet. */
  walletNetwork: "PUBLIC" | "TESTNET";
  /** The network the app is currently configured to use. */
  appNetwork: "PUBLIC" | "TESTNET";
  /**
   * Convenience alias — equals walletNetwork when connected, appNetwork
   * otherwise. Most components should use this.
   */
  network: "PUBLIC" | "TESTNET";
  /** True when the wallet is on a different network than the app. */
  isNetworkMismatched: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  /** The ID of the currently active wallet adapter. */
  activeWalletId: WalletId | null;
  /** All wallet adapters detected in this browser. */
  availableWallets: WalletAdapter[];
  connect: (walletId?: WalletId) => Promise<void>;
  disconnect: () => void;
  /** Switch to a different wallet without page reload. */
  switchWallet: (walletId: WalletId) => Promise<void>;
  /** Switch the app to the given network and persist the choice. */
  switchNetwork: (net: "PUBLIC" | "TESTNET") => void;
  clearAllData: () => Promise<void>;
  revokePermissions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<"PUBLIC" | "TESTNET">(DEFAULT_NETWORK);
  const [appNetwork, setAppNetworkState] = useState<"PUBLIC" | "TESTNET">(() =>
    loadPersistedNetwork()
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeWalletId, setActiveWalletId] = useState<WalletId | null>(
    () => loadPersistedWalletId()
  );
  const [availableWallets, setAvailableWallets] = useState<WalletAdapter[]>([]);

  const mountedRef = useRef(true);

  // Detect available wallets after mount (window access required).
  useEffect(() => {
    setAvailableWallets(getAvailableWallets());
  }, []);

  const switchNetwork = useCallback((net: "PUBLIC" | "TESTNET") => {
    setAppNetworkState(net);
    if (typeof window !== "undefined") {
      localStorage.setItem(APP_NETWORK_KEY, net);
    }
  }, []);

  const getActiveAdapter = useCallback((): WalletAdapter | null => {
    return activeWalletId ? WALLET_ADAPTERS[activeWalletId] : null;
  }, [activeWalletId]);

  const updateConnection = useCallback(async () => {
    const adapter = getActiveAdapter();
    if (!adapter) return;

    const pk = await adapter.getAddress();
    if (!mountedRef.current) return;

    if (pk) {
      const net = await adapter.getNetwork();
      if (!mountedRef.current) return;
      setAddress(pk);
      setWalletNetwork(net);
      addRecentAddress(pk).catch(() => {});
    } else {
      setAddress(null);
    }
  }, [getActiveAdapter]);

  // Poll the active wallet every WALLET_POLL_INTERVAL_MS to reflect
  // network changes or disconnects without requiring a page reload.
  useEffect(() => {
    mountedRef.current = true;

    const initTimer = setTimeout(async () => {
      if (!mountedRef.current) return;
      await updateConnection();
    }, WALLET_INITIAL_DELAY_MS);

    const interval = setInterval(async () => {
      if (!mountedRef.current) return;
      await updateConnection();
    }, WALLET_POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [updateConnection]);

  const connect = useCallback(async (walletId?: WalletId) => {
    // Default to the first available wallet when none specified.
    const targetId = walletId ?? activeWalletId ?? getAvailableWallets()[0]?.id ?? "freighter";
    const adapter = WALLET_ADAPTERS[targetId];

    setIsConnecting(true);
    try {
      const pk = await adapter.connect();
      if (pk) {
        const net = await adapter.getNetwork();
        setAddress(pk);
        setWalletNetwork(net);
        setActiveWalletId(targetId);
        if (typeof window !== "undefined") {
          localStorage.setItem(ACTIVE_WALLET_KEY, targetId);
        }
        // Freighter-specific capability bookkeeping (no-op for other wallets).
        if (targetId === "freighter") {
          ensureRequiredCapabilities().catch(() => {});
        }
      }
    } finally {
      setIsConnecting(false);
    }
  }, [activeWalletId]);

  /** Switch to a different wallet adapter without disconnecting first. */
  const switchWallet = useCallback(async (walletId: WalletId) => {
    // Disconnect from current wallet state, then connect via the new one.
    setAddress(null);
    setActiveWalletId(walletId);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_WALLET_KEY, walletId);
    }
    await connect(walletId);
  }, [connect]);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const clearAllData = useCallback(async () => {
    await clearAllUserData();
    setAddress(null);
  }, []);

  const revokePermissions = useCallback(async () => {
    await revokeAllCapabilities();
    setAddress(null);
  }, []);

  const isNetworkMismatched = !!address && walletNetwork !== appNetwork;
  const network = address ? walletNetwork : appNetwork;

  return (
    <WalletContext.Provider
      value={{
        address,
        publicKey: address,
        walletNetwork,
        appNetwork,
        network,
        isNetworkMismatched,
        isConnected: !!address,
        isConnecting,
        activeWalletId,
        availableWallets,
        connect,
        disconnect,
        switchWallet,
        switchNetwork,
        clearAllData,
        revokePermissions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
