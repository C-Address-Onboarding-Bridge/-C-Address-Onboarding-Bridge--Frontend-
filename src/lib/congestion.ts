import { getHorizonServer, getSorobanRpcServer } from "@/lib/stellar";

interface FeeDistribution {
  max: string; min: string; mode: string;
  p10: string; p20: string; p30: string; p40: string;
  p50: string; p60: string; p70: string;
  p80: string; p90: string; p95: string; p99: string;
}

interface FeeStatsResponse {
  last_ledger: string;
  last_ledger_base_fee: string;
  ledger_capacity_usage: string;
  fee_charged: FeeDistribution;
  max_fee: FeeDistribution;
}

export interface CongestionInfo {
  level: "none" | "mild" | "moderate" | "severe";
  feeChargedP90: number;
  ledgerCapacityUsage: number;
  suggestedFee: number;
  baseFee: number;
  message: string;
  tip: string;
}

function parseFeeStats(raw: FeeStatsResponse): FeeStatsResponse {
  return { ...raw };
}

function getBaseFee(feeStats: FeeStatsResponse): number {
  return parseInt(feeStats.last_ledger_base_fee, 10) || 100;
}

function getSuggestedFee(feeStats: FeeStatsResponse): number {
  const p90 = parseInt(feeStats.fee_charged.p90, 10);
  const baseFee = getBaseFee(feeStats);
  return Math.max(p90, baseFee * 2);
}

function getCongestionLevel(capacityUsage: number, _feeP90: number, baseFee: number): CongestionInfo["level"] {
  const ratio = _feeP90 / baseFee;
  if (capacityUsage >= 90 || ratio >= 10) return "severe";
  if (capacityUsage >= 70 || ratio >= 5) return "moderate";
  if (capacityUsage >= 40 || ratio >= 2) return "mild";
  return "none";
}

function getMessage(level: CongestionInfo["level"]): string {
  switch (level) {
    case "severe":
      return "Network is heavily congested. Transactions may be significantly delayed or fail.";
    case "moderate":
      return "Network experiencing moderate congestion. Consider higher fee for faster confirmation.";
    case "mild":
      return "Network is slightly congested. Transaction should proceed normally.";
    case "none":
      return "Network is operating normally.";
  }
}

function getTip(level: CongestionInfo["level"]): string {
  switch (level) {
    case "severe":
      return "Try again later, or use a different bridge if available. Set fee to at least 10x the base fee.";
    case "moderate":
      return "Setting a fee 3-5x the base fee will improve confirmation speed.";
    case "mild":
      return "Standard fee should suffice.";
    case "none":
      return "No special action needed.";
  }
}

export async function checkCongestion(network: "PUBLIC" | "TESTNET" | "SANDBOX"): Promise<CongestionInfo> {
  const server = getHorizonServer(network);
  const rawResponse = await server.feeStats();
  const feeStats = parseFeeStats(rawResponse);
  const baseFee = getBaseFee(feeStats);
  const suggestedFee = getSuggestedFee(feeStats);
  const feeP90 = parseInt(feeStats.fee_charged.p90, 10) || 0;
  const capacityUsage = parseFloat(feeStats.ledger_capacity_usage) || 0;
  const level = getCongestionLevel(capacityUsage, feeP90, baseFee);

  return {
    level,
    feeChargedP90: feeP90,
    ledgerCapacityUsage: capacityUsage,
    suggestedFee,
    baseFee,
    message: getMessage(level),
    tip: getTip(level),
  };
}

export async function checkSorobanHealth(network: "PUBLIC" | "TESTNET" | "SANDBOX"): Promise<boolean> {
  try {
    const rpcServer = getSorobanRpcServer(network);
    await rpcServer.getHealth();
    return true;
  } catch {
    return false;
  }
}
