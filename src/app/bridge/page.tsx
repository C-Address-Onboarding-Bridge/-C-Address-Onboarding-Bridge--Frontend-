"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, Wallet, Send, ArrowRight, Check, AlertCircle, Loader2, ExternalLink, Clock } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";
import { isValidStellarAddress, isCAddress, bridgeViaContract, getExplorerUrl, getAccountBalances } from "@/lib/stellar";
import CongestionBanner from "@/components/congestion-banner";
import { checkCongestion } from "@/lib/congestion";
import type { CongestionInfo } from "@/lib/congestion";

type Step = "form" | "review" | "confirm";
type TxStatus = "idle" | "signing" | "submitting" | "success" | "error";

export default function BridgePage() {
  const { isConnected, address, network, connect } = useWallet();
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("XLM");
  const [step, setStep] = useState<Step>("form");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [sourceBalance, setSourceBalance] = useState<string | null>(null);
  const [congestion, setCongestion] = useState<CongestionInfo | null>(null);
  const [congestionError, setCongestionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !network) return;
    const check = async () => {
      try {
        const info = await checkCongestion(network);
        setCongestion(info);
        setCongestionError(null);
      } catch {
        setCongestionError("Failed to check network conditions");
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [isConnected, network]);

  const validFrom = !fromAddress || isValidStellarAddress(fromAddress);
  const validTo = !toAddress || (isValidStellarAddress(toAddress) && isCAddress(toAddress));
  const canProceed = fromAddress && toAddress && amount && validFrom && validTo && txStatus === "idle";

  const handleUseConnected = () => {
    if (address) {
      setFromAddress(address);
      checkBalance(address);
    }
  };

  const checkBalance = async (addr: string) => {
    const result = await getAccountBalances(addr, network);
    setSourceBalance(result.total);
  };

  const handleSubmit = () => {
    if (!canProceed) return;
    setStep("review");
    setTxError(null);
  };

  const handleConfirm = async () => {
    if (!fromAddress || !toAddress || !amount) return;
    setTxStatus("signing");
    setTxError(null);

    try {
      const result = await bridgeViaContract(
        fromAddress,
        toAddress,
        amount,
        asset,
        network
      );
      setTxHash(result.hash);
      setTxStatus("success");
      setStep("confirm");
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus("error");
    }
  };

  const handleReset = () => {
    setStep("form");
    setTxStatus("idle");
    setTxHash(null);
    setTxError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">G → C Bridge</h1>
        <p className="text-[var(--text-muted)]">
          Fund a Soroban smart account (C-address) from an existing Stellar G-address.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            {step === "form" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">From (G-address)</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={fromAddress}
                      onChange={(e) => {
                        setFromAddress(e.target.value);
                        setSourceBalance(null);
                      }}
                      placeholder={isConnected ? address! : "GABC...DEF or connect wallet"}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== "idle"}
                    />
                  </div>
                  {!validFrom && fromAddress && (
                    <p className="text-xs text-[var(--error)] mt-1">Invalid Stellar address</p>
                  )}
                  {isConnected && (
                    <button
                      onClick={handleUseConnected}
                      className="text-xs text-[var(--primary-light)] mt-1 hover:underline"
                    >
                      Use connected wallet
                    </button>
                  )}
                  {sourceBalance !== null && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Balance: {parseFloat(sourceBalance).toFixed(2)} XLM
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-[var(--primary-light)]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">To (C-address)</label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      placeholder="CABC...DEF"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== "idle"}
                    />
                  </div>
                  {!validTo && toAddress && (
                    <p className="text-xs text-[var(--error)] mt-1">
                      Invalid C-address (must start with C and be 56 characters)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                        disabled={txStatus !== "idle"}
                      />
                    </div>
                    <select
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      className="px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== "idle"}
                    >
                      <option>XLM</option>
                      <option>USDC</option>
                    </select>
                  </div>
                </div>

                <CongestionBanner congestion={congestion} loading={false} error={congestionError} />

                <button
                  onClick={handleSubmit}
                  disabled={!canProceed}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Review Bridge Transaction
                </button>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Review Transaction</h3>

                <CongestionBanner congestion={congestion} loading={false} error={null} />

              {congestion?.level !== "none" && congestion && (
                <div className="p-4 rounded-lg border border-[var(--warning)]/20 bg-[var(--warning)]/5">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                    <div className="text-sm space-y-2">
                      <p className="font-medium">Alternative Options</p>
                      <ul className="space-y-1 text-xs text-[var(--text-muted)]">
                        <li>• Try again later when network traffic subsides</li>
                        <li>• Use CEX Withdrawal route as an alternative</li>
                        {congestion.level === "severe" && (
                          <li>• Consider using a different bridge service</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">From</span>
                    <span className="text-sm font-mono">{fromAddress}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">To</span>
                    <span className="text-sm font-mono">{toAddress}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">Amount</span>
                    <span className="text-sm font-semibold">{amount} {asset}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">Network</span>
                    <span className="text-sm">{network === "PUBLIC" ? "Mainnet" : "Testnet"}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">
                      Fee {congestion?.level !== "none" && congestion ? `(suggested: ${congestion.suggestedFee} stroops)` : ""}
                    </span>
                    <span className="text-sm">~0.00001 XLM</span>
                  </div>
                </div>

                {txError && (
                  <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[var(--error)]">Transaction Failed</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{txError}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    disabled={txStatus === "signing" || txStatus === "submitting"}
                    className="flex-1 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={txStatus === "signing" || txStatus === "submitting"}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                  >
                    {txStatus === "signing" || txStatus === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {txStatus === "signing" ? "Signing..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Confirm & Sign
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && txStatus === "success" && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[var(--success)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transaction Submitted</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Your bridge transaction has been submitted to the network.
                </p>
                {txHash && (
                  <a
                    href={getExplorerUrl(network, "tx", txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[var(--primary-light)] hover:underline mb-6"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Stellar Expert
                  </a>
                )}
                <div className="mt-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
                  >
                    New Bridge Transaction
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && txStatus === "error" && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-[var(--error)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transaction Failed</h3>
                <p className="text-sm text-[var(--text-muted)] mb-6">{txError || "An unexpected error occurred"}</p>
                <button
                  onClick={() => { setStep("review"); setTxStatus("idle"); setTxError(null); }}
                  className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold mb-3">About G → C Bridging</h3>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
                <span>Bridge XLM or USDC from any G-address</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
                <span>Supports all Soroban C-addresses</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
                <span>Low network fees via Stellar network</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold mb-3">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Network</span>
                <span className="font-mono text-xs">{network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Bridge Contract</span>
                <span className="font-mono text-xs">v0.1.0</span>
              </div>
            </div>
          </div>

          {!isConnected && (
            <button
              onClick={connect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--primary)]/30 text-[var(--primary-light)] font-medium hover:bg-[var(--primary)]/5 transition-colors text-sm"
            >
              <Wallet className="w-4 h-4" />
              Connect Freighter Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
