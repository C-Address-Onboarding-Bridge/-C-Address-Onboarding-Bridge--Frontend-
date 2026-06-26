"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { validateFee, xlmToStroops, stroopsToXlm } from "@/lib/stellar";
import { useFeeStats } from "@/lib/use-fee-stats";

export type FeeTier = "slow" | "standard" | "fast" | "custom";

interface FeeSelectorProps {
  network: "PUBLIC" | "TESTNET";
  onFeeChange: (stroops: string, valid: boolean) => void;
}

export function FeeSelector({ network, onFeeChange }: FeeSelectorProps) {
  const { tiers, loading } = useFeeStats(network);
  const [selected, setSelected] = useState<FeeTier>("standard");
  const [customInput, setCustomInput] = useState("");
  const [customUnit, setCustomUnit] = useState<"stroops" | "xlm">("stroops");

  const handleSelectTier = (tier: FeeTier) => {
    setSelected(tier);
    if (tiers && tier !== "custom") {
      onFeeChange(tiers[tier], validateFee(tiers[tier], tiers.baseFee));
    }
  };

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    if (tiers) {
      const stroops = val ? (customUnit === "stroops" ? val : xlmToStroops(val)) : tiers.baseFee;
      onFeeChange(stroops, validateFee(stroops, tiers.baseFee));
    }
  };

  const handleUnitChange = (unit: "stroops" | "xlm") => {
    setCustomUnit(unit);
    if (tiers && customInput) {
      const stroops = unit === "stroops" ? customInput : xlmToStroops(customInput);
      onFeeChange(stroops, validateFee(stroops, tiers.baseFee));
    }
  };

  const customStroops = tiers
    ? (customInput ? (customUnit === "stroops" ? customInput : xlmToStroops(customInput)) : tiers.baseFee)
    : "";

  return (
    <div className="space-y-3">
      {tiers?.congested && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300">Network congested — consider using Fast fee</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {(["slow", "standard", "fast"] as Array<"slow" | "standard" | "fast">).map((tier) => (
          <button
            key={tier}
            onClick={() => handleSelectTier(tier)}
            disabled={loading}
            className={`flex flex-col items-center px-2 py-3 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 ${
              selected === tier
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary-light)]"
                : "border-[var(--border)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span className="capitalize">{tier}</span>
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin mt-1" />
            ) : (
              <span className="text-[var(--text-muted)] mt-1 font-mono">
                {tiers ? tiers[tier] : "—"} str
              </span>
            )}
          </button>
        ))}

        <button
          onClick={() => handleSelectTier("custom")}
          className={`flex flex-col items-center px-2 py-3 rounded-lg border text-xs font-medium transition-colors ${
            selected === "custom"
              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary-light)]"
              : "border-[var(--border)] hover:bg-[var(--surface-2)]"
          }`}
        >
          Custom
        </button>
      </div>

      {selected === "custom" && (
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={customInput}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={customUnit === "stroops" ? "e.g. 100" : "e.g. 0.00001"}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <select
            value={customUnit}
            onChange={(e) => handleUnitChange(e.target.value as "stroops" | "xlm")}
            className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          >
            <option value="stroops">Stroops</option>
            <option value="xlm">XLM</option>
          </select>
        </div>
      )}

      {tiers && selected === "custom" && customInput && (
        <p className="text-xs text-[var(--text-muted)]">
          ≈{" "}
          {customUnit === "stroops"
            ? `${stroopsToXlm(customInput)} XLM`
            : `${xlmToStroops(customInput)} stroops`}
          {!validateFee(customStroops, tiers.baseFee) && (
            <span className="text-[var(--error)] ml-2">Below minimum ({tiers.baseFee} stroops)</span>
          )}
        </p>
      )}
    </div>
  );
}
