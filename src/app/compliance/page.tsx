"use client";

import { useState } from "react";
import { Shield, Search, Check, X, AlertTriangle, Filter } from "lucide-react";

type Jurisdiction = "US" | "EU" | "UK" | "APAC" | "ROW";

type RegulatoryStatus = "approved" | "restricted" | "pending" | "prohibited";

interface AssetCompliance {
  asset: string;
  name: string;
  type: "stablecoin" | "native" | "token";
  regulatoryStatus: Record<Jurisdiction, RegulatoryStatus>;
  cexSupport: string[];
  onrampSupport: string[];
  kycRequired: boolean;
}

const JURISDICTIONS: { id: Jurisdiction; label: string }[] = [
  { id: "US", label: "United States" },
  { id: "EU", label: "European Union" },
  { id: "UK", label: "United Kingdom" },
  { id: "APAC", label: "Asia-Pacific" },
  { id: "ROW", label: "Rest of World" },
];

const STATUS_CONFIG: Record<RegulatoryStatus, { label: string; color: string; icon: typeof Check }> = {
  approved: { label: "Approved", color: "text-[var(--success)]", icon: Check },
  restricted: { label: "Restricted", color: "text-[var(--warning)]", icon: AlertTriangle },
  pending: { label: "Pending Review", color: "text-[var(--text-muted)]", icon: AlertTriangle },
  prohibited: { label: "Prohibited", color: "text-[var(--error)]", icon: X },
};

const ASSETS: AssetCompliance[] = [
  {
    asset: "USDC",
    name: "USD Coin",
    type: "stablecoin",
    regulatoryStatus: {
      US: "approved",
      EU: "approved",
      UK: "approved",
      APAC: "approved",
      ROW: "pending",
    },
    cexSupport: ["Binance", "Coinbase", "Kraken"],
    onrampSupport: ["Moonpay", "Transak"],
    kycRequired: true,
  },
  {
    asset: "XLM",
    name: "Stellar Lumens",
    type: "native",
    regulatoryStatus: {
      US: "approved",
      EU: "approved",
      UK: "approved",
      APAC: "approved",
      ROW: "approved",
    },
    cexSupport: ["Binance", "Coinbase", "Kraken"],
    onrampSupport: ["Moonpay", "Transak"],
    kycRequired: false,
  },
  {
    asset: "EURC",
    name: "Euro Coin",
    type: "stablecoin",
    regulatoryStatus: {
      US: "restricted",
      EU: "approved",
      UK: "pending",
      APAC: "restricted",
      ROW: "pending",
    },
    cexSupport: ["Coinbase"],
    onrampSupport: [],
    kycRequired: true,
  },
  {
    asset: "BTC",
    name: "Bitcoin (Wrapped)",
    type: "token",
    regulatoryStatus: {
      US: "approved",
      EU: "approved",
      UK: "approved",
      APAC: "approved",
      ROW: "approved",
    },
    cexSupport: ["Binance", "Coinbase", "Kraken"],
    onrampSupport: ["Moonpay", "Transak"],
    kycRequired: false,
  },
];

const CEX_PROVIDERS = ["Binance", "Coinbase", "Kraken"];
const ONRAMP_PROVIDERS = ["Moonpay", "Transak"];

export default function CompliancePage() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>("US");
  const [filterStatus, setFilterStatus] = useState<RegulatoryStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssets = ASSETS.filter((asset) => {
    const matchesSearch =
      asset.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || asset.regulatoryStatus[selectedJurisdiction] === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[var(--primary-light)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        </div>
      </div>
      <p className="text-[var(--text-muted)] mb-8">
        Regulatory status of supported assets across jurisdictions. Information is for
        reference only and may not reflect the latest regulatory changes.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>

        <div className="flex gap-2">
          {JURISDICTIONS.map((j) => (
            <button
              key={j.id}
              onClick={() => setSelectedJurisdiction(j.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedJurisdiction === j.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {j.id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-muted)]">Status:</span>
        {(["all", "approved", "restricted", "pending", "prohibited"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-[var(--primary)]/10 text-[var(--primary-light)] border border-[var(--primary)]/20"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)] border border-transparent"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAssets.map((asset) => {
          const status = asset.regulatoryStatus[selectedJurisdiction];
          const StatusIcon = STATUS_CONFIG[status].icon;

          return (
            <div
              key={asset.asset}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold">{asset.asset}</h2>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]">
                        {asset.type}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{asset.name}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_CONFIG[status].color} bg-[var(--surface-2)] border border-[var(--border)]`}>
                    <StatusIcon className="w-4 h-4" />
                    {STATUS_CONFIG[status].label} in {selectedJurisdiction}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      Regulatory Status by Jurisdiction
                    </h3>
                    <div className="space-y-1.5">
                      {JURISDICTIONS.map((j) => {
                        const s = asset.regulatoryStatus[j.id];
                        const Icon = STATUS_CONFIG[s].icon;
                        return (
                          <div key={j.id} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">{j.label}</span>
                            <span className={`flex items-center gap-1 ${STATUS_CONFIG[s].color}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {STATUS_CONFIG[s].label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      Provider Support
                    </h3>

                    <div className="mb-3">
                      <p className="text-xs text-[var(--text-muted)] mb-1.5">CEX Support</p>
                      <div className="flex flex-wrap gap-1.5">
                        {CEX_PROVIDERS.map((cex) => {
                          const supported = asset.cexSupport.includes(cex);
                          return (
                            <span
                              key={cex}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                supported
                                  ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                                  : "bg-[var(--surface-2)] text-[var(--text-muted)]/50 border border-[var(--border)]"
                              }`}
                            >
                              {supported ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {cex}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1.5">Onramp Support</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ONRAMP_PROVIDERS.map((p) => {
                          const supported = asset.onrampSupport.includes(p);
                          return (
                            <span
                              key={p}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                supported
                                  ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                                  : "bg-[var(--surface-2)] text-[var(--text-muted)]/50 border border-[var(--border)]"
                              }`}
                            >
                              {supported ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {p}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {asset.kycRequired && (
                  <div className="mt-4 p-3 rounded-lg bg-[var(--warning)]/5 border border-[var(--warning)]/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text-muted)]">
                      <strong className="text-[var(--warning)]">KYC Required:</strong>{" "}
                      This asset requires identity verification when purchased through fiat onramp providers.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">No assets match your filters.</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
        <h3 className="text-sm font-semibold mb-2">Disclaimer</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Regulatory classifications are for informational purposes only and may not reflect
          the most current regulatory developments. Consult a qualified legal professional
          for guidance on compliance with applicable laws and regulations. Asset support by
          CEXes and onramp providers is subject to change.
        </p>
      </div>
    </div>
  );
}
