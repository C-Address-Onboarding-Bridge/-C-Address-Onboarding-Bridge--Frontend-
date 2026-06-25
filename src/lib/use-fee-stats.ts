"use client";

import { useState, useEffect } from "react";
import { fetchFeeStats, type FeeTiers } from "./stellar";

export interface UseFeeStatsResult {
  tiers: FeeTiers | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFeeStats(network: "PUBLIC" | "TESTNET"): UseFeeStatsResult {
  const [tiers, setTiers] = useState<FeeTiers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await fetchFeeStats(network);
        if (!cancelled) {
          setTiers(t);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to fetch fee stats");
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [network, tick]);

  return { tiers, loading, error, refetch: () => setTick((n) => n + 1) };
}
