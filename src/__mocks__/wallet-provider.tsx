"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface WalletContextValue {
  isConnected: boolean;
  address: string | null | undefined;
  connect: (walletId?: string) => void;
  disconnect: () => void;
  isConnecting: boolean;
  network: "PUBLIC" | "TESTNET";
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const FAKE_ADDRESS = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected] = useState(true);
  const [isConnecting] = useState(false);
  const [address] = useState<string | null>(FAKE_ADDRESS);

  const connect = useCallback((_walletId?: string) => {
    // no-op in storybook
  }, []);

  const disconnect = useCallback(() => {
    // no-op in storybook
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        connect,
        disconnect,
        isConnecting,
        network: "TESTNET",
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context !== undefined) return context;
  return {
    isConnected: true,
    address: FAKE_ADDRESS,
    connect: () => {},
    disconnect: () => {},
    isConnecting: false,
    network: "TESTNET",
  };
}
