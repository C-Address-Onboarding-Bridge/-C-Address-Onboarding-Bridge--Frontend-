// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/lib/stellar", () => ({
  connectWallet: vi.fn(),
  checkConnection: vi.fn(),
  getWalletAddress: vi.fn(),
  getCurrentNetwork: vi.fn(),
}));

import {
  connectWallet,
  checkConnection,
  getWalletAddress,
  getCurrentNetwork,
} from "@/lib/stellar";
import { WalletProvider, useWallet } from "@/components/wallet-provider";

const PK = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5";

function wrapper({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}

describe("WalletProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks: not connected
    vi.mocked(checkConnection).mockResolvedValue(false);
    vi.mocked(getWalletAddress).mockResolvedValue(null);
    vi.mocked(getCurrentNetwork).mockResolvedValue("TESTNET");
    vi.mocked(connectWallet).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("has null address and is not connected", () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.address).toBeNull();
      expect(result.current.publicKey).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.network).toBe("TESTNET");
    });
  });

  describe("connect", () => {
    it("connects successfully and sets address and network", async () => {
      vi.mocked(connectWallet).mockResolvedValue(PK);
      vi.mocked(getCurrentNetwork).mockResolvedValue("PUBLIC");

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe(PK);
      expect(result.current.publicKey).toBe(PK);
      expect(result.current.network).toBe("PUBLIC");
    });

    it("leaves state unchanged when connectWallet returns null (Freighter not installed)", async () => {
      vi.mocked(connectWallet).mockResolvedValue(null);

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.publicKey).toBeNull();
      expect(result.current.network).toBe("TESTNET");
    });

    it("leaves state unchanged when connectWallet returns null (user rejection)", async () => {
      vi.mocked(connectWallet).mockResolvedValue(null);

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.isConnecting).toBe(false);
    });

    it("sets isConnecting to true while connecting and false after", async () => {
      // Mock connectWallet with a delayed promise so we can observe isConnecting
      vi.mocked(connectWallet).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(PK), 100))
      );
      vi.mocked(getCurrentNetwork).mockResolvedValue("TESTNET");

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Fire connect(), don't await it yet
      let connectPromise: Promise<void>;
      await act(async () => {
        connectPromise = result.current.connect();
      });

      // isConnecting should be true while the promise is pending
      await waitFor(() => {
        expect(result.current.isConnecting).toBe(true);
      });

      // Wait for connection to complete
      await act(async () => {
        await connectPromise;
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe("disconnect", () => {
    it("clears address and isConnected after disconnect", async () => {
      vi.mocked(connectWallet).mockResolvedValue(PK);

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for the auto-connection poll (setTimeout(0)) to complete,
      // otherwise it races with connect and clears the address
      await waitFor(() => {
        expect(checkConnection).toHaveBeenCalled();
      });

      // Connect first
      await act(async () => {
        await result.current.connect();
      });
      expect(result.current.isConnected).toBe(true);

      // Disconnect
      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
      expect(result.current.publicKey).toBeNull();
    });

    it("disconnect is idempotent (calling when already disconnected does not throw)", () => {
      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(() => {
        act(() => {
          result.current.disconnect();
        });
      }).not.toThrow();

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
    });
  });

  describe("auto-connection on mount", () => {
    it("detects connected wallet and sets address and network", async () => {
      vi.mocked(checkConnection).mockResolvedValue(true);
      vi.mocked(getWalletAddress).mockResolvedValue(PK);
      vi.mocked(getCurrentNetwork).mockResolvedValue("PUBLIC");

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for the setTimeout(0) to fire and state to update
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.address).toBe(PK);
      expect(result.current.network).toBe("PUBLIC");
      expect(checkConnection).toHaveBeenCalled();
    });

    it("does not set address when no wallet is connected", async () => {
      vi.mocked(checkConnection).mockResolvedValue(false);

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Wait for the setTimeout(0) to fire
      await waitFor(() => {
        expect(checkConnection).toHaveBeenCalled();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
    });
  });

  describe("polling behavior", () => {
    it("polls wallet connection at regular intervals", async () => {
      vi.useFakeTimers();
      vi.mocked(checkConnection).mockResolvedValue(false);

      renderHook(() => useWallet(), { wrapper });

      // Advance past the initial setTimeout(0) — must wrap in act
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(checkConnection).toHaveBeenCalledTimes(1);

      // Advance past first interval (3000ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(checkConnection).toHaveBeenCalledTimes(2);

      // Advance past second interval (3000ms)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(checkConnection).toHaveBeenCalledTimes(3);
    });

    it("updates state when wallet connects during polling", async () => {
      vi.useFakeTimers();

      // Initially not connected
      vi.mocked(checkConnection).mockResolvedValue(false);

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.isConnected).toBe(false);

      // User connects wallet between polls
      vi.mocked(checkConnection).mockResolvedValue(true);
      vi.mocked(getWalletAddress).mockResolvedValue(PK);
      vi.mocked(getCurrentNetwork).mockResolvedValue("PUBLIC");

      // Next poll detects the connection
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe(PK);
      expect(result.current.network).toBe("PUBLIC");
    });

    it("clears state when wallet disconnects during polling", async () => {
      vi.useFakeTimers();

      // Start connected
      vi.mocked(checkConnection).mockResolvedValue(true);
      vi.mocked(getWalletAddress).mockResolvedValue(PK);
      vi.mocked(getCurrentNetwork).mockResolvedValue("TESTNET");

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.isConnected).toBe(true);

      // Wallet disconnects
      vi.mocked(checkConnection).mockResolvedValue(false);

      // Next poll detects disconnection
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
    });

    it("stops polling on unmount", async () => {
      vi.useFakeTimers();
      vi.mocked(checkConnection).mockResolvedValue(false);

      const { unmount } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(checkConnection).toHaveBeenCalledTimes(1);

      unmount();

      // Advance far into the future — no more calls should happen
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });
      expect(checkConnection).toHaveBeenCalledTimes(1);
    });

    it("detects network change during polling (switchNetwork)", async () => {
      vi.useFakeTimers();

      // Start with TESTNET
      vi.mocked(checkConnection).mockResolvedValue(true);
      vi.mocked(getWalletAddress).mockResolvedValue(PK);
      vi.mocked(getCurrentNetwork).mockResolvedValue("TESTNET");

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.network).toBe("TESTNET");

      // Network changes to PUBLIC
      vi.mocked(getCurrentNetwork).mockResolvedValue("PUBLIC");

      // Next poll picks up the network change
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(result.current.network).toBe("PUBLIC");
    });
  });

  describe("context error", () => {
    it("throws when useWallet is used outside WalletProvider", () => {
      expect(() => {
        renderHook(() => useWallet());
      }).toThrow("useWallet must be used within a WalletProvider");
    });
  });
});
