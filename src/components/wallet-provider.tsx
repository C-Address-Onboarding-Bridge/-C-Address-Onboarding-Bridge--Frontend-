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
  connectWallet,
  checkConnection,
  getWalletAddress,
  getCurrentNetwork,
} from "@/lib/stellar";
import {
  WALLET_INITIAL_DELAY_MS,
  WALLET_POLL_INTERVAL_MS,
  DEFAULT_NETWORK,
} from "@/lib/constants";
import { addRecentAddress } from "@/lib/user-preferences";
import {
  ensureRequiredCapabilities,
  revokeAllCapabilities,
} from "@/lib/freighter-capabilities";
import { clearAllUserData } from "@/lib/user-preferences";

const APP_NETWORK_KEY = "stellar_app_network";

function getEnvNetwork(): "PUBLIC" | "TESTNET" {
  const v = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toUpperCase();
  return v === "PUBLIC" ? "PUBLIC" : "TESTNET";
}

function loadPersistedNetwork(): "PUBLIC" | "TESTNET" {
  if (typeof window === "undefined") return getEnvNetwork();
  const stored = localStorage.getItem(APP_NETWORK_KEY);
  return stored === "PUBLIC" || stored === "TESTNET" ? stored : getEnvNetwork();
}

interface WalletContextType {
  address: string | null;
  publicKey: string | null;
  /** The network reported by the connected Freighter wallet. */
  walletNetwork: "PUBLIC" | "TESTNET";
  /** The network the app is currently configured to use. */
  appNetwork: "PUBLIC" | "TESTNET";
  /**
   * Convenience alias — equals walletNetwork when connected, appNetwork
   * otherwise.  Most components should use this.
   */
  network: "PUBLIC" | "TESTNET";
  /** True when the wallet is on a different network than the app. */
  isNetworkMismatched: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
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

  const mountedRef = useRef(true);

  const switchNetwork = useCallback((net: "PUBLIC" | "TESTNET") => {
    setAppNetworkState(net);
    if (typeof window !== "undefined") {
      localStorage.setItem(APP_NETWORK_KEY, net);
    }
  }, []);

  const updateConnection = useCallback(async () => {
    const connected = await checkConnection();
    if (!mountedRef.current) return;

    if (connected) {
      const pk = await getWalletAddress();
      const net = await getCurrentNetwork();
      if (!mountedRef.current) return;
      setAddress(pk);
      setWalletNetwork(net);
      if (pk) {
        addRecentAddress(pk).catch(() => {});
      }
    } else {
      setAddress(null);
    }
  }, []);

  // ── Polling ───────────────────────────────────────────────────────────────
  // Checks wallet connection every WALLET_POLL_INTERVAL_MS (3 s) so that
  // network changes and disconnects are reflected promptly.
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

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const pk = await connectWallet();
      if (pk) {
        const net = await getCurrentNetwork();
        setAddress(pk);
        setWalletNetwork(net);
        // Fire-and-forget — capability bookkeeping must not block connecting.
        ensureRequiredCapabilities().catch(() => {});
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

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
        connect,
        disconnect,
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
