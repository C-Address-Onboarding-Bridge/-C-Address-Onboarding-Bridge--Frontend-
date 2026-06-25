"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { connectWallet, checkConnection, getWalletAddress, getCurrentNetwork } from "@/lib/stellar";
import { WALLET_INITIAL_DELAY_MS, WALLET_POLL_INTERVAL_MS, DEFAULT_NETWORK } from "@/lib/constants";

interface WalletContextType {
  address: string | null;
  publicKey: string | null;
  network: "PUBLIC" | "TESTNET";
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
        setNetwork(net);
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
