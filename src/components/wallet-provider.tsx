"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { connectWallet, checkConnection, getWalletAddress, getCurrentNetwork } from "@/lib/stellar";
import { WALLET_INITIAL_DELAY_MS, WALLET_POLL_INTERVAL_MS, DEFAULT_NETWORK } from "@/lib/constants";

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
  network: "PUBLIC" | "TESTNET";
  walletNetwork: "PUBLIC" | "TESTNET";
  appNetwork: "PUBLIC" | "TESTNET";
  isNetworkMismatched: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearAllData: () => Promise<void>;
  revokePermissions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  publicKey: null,
  network: DEFAULT_NETWORK,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  clearAllData: async () => {},
  revokePermissions: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<"PUBLIC" | "TESTNET">(DEFAULT_NETWORK);
  const [isConnecting, setIsConnecting] = useState(false);

  const switchNetwork = useCallback((net: "PUBLIC" | "TESTNET") => {
    setAppNetwork(net);
    localStorage.setItem(APP_NETWORK_KEY, net);
  }, []);

  const updateConnection = useCallback(async () => {
    const isConnected = await checkConnection();
    if (isConnected) {
      const pk = await getWalletAddress();
      const net = await getCurrentNetwork();
      setAddress(pk);
      setNetwork(net);
      if (pk) {
        await addRecentAddress(pk);
      }
    } else {
      setAddress(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateConnection, WALLET_INITIAL_DELAY_MS);
    const interval = setInterval(updateConnection, WALLET_POLL_INTERVAL_MS);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [updateConnection]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const capsGranted = await ensureRequiredCapabilities();
      if (!capsGranted) {
        console.error("Required capabilities not granted");
        setIsConnecting(false);
        return;
      }
      const pk = await connectWallet();
      if (pk) {
        setAddress(pk);
        const net = await getCurrentNetwork();
        setWalletNetwork(net);
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

  return (
    <WalletContext.Provider
      value={{
        address,
        publicKey: address,
        network,
        walletNetwork,
        appNetwork,
        isNetworkMismatched,
        isConnected: !!address,
        isConnecting,
        connect,
        disconnect,
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
