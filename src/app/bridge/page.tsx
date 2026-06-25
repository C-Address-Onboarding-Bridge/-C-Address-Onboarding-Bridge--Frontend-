"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRightLeft, Wallet, Send, ArrowRight, Check, AlertCircle,
  Loader2, ExternalLink, XCircle, AlertTriangle,
} from "lucide-react";
import { useWallet } from "@/components/wallet-provider";
import {
  isValidStellarAddress,
  isCAddress,
  bridgeViaContract,
  getExplorerUrl,
  loadAccountInfo,
  buildAndSubmitChangeTrust,
  getTransactionStatus,
  USDC_ISSUERS,
} from "@/lib/stellar";

type Step = "form" | "review" | "confirm";
type TxStatus = "idle" | "signing" | "submitting" | "success" | "error";
type PollStatus = "pending" | "confirmed" | "failed" | null;

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

  // Account info (fetched async)
  const [allBalances, setAllBalances] = useState<{ asset: string; amount: string }[]>([]);
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [sourceBalance, setSourceBalance] = useState<string | null>(null);

  // Trustline add-flow
  const [trustlineActionStatus, setTrustlineActionStatus] = useState<"idle" | "signing" | "error">("idle");
  const [trustlineError, setTrustlineError] = useState<string | null>(null);

  // Transaction polling
  const [pollStatus, setPollStatus] = useState<PollStatus>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollActiveRef = useRef(false);

  // --- Computed values (derived from state, no extra renders needed) ---

  const trustlineStatus: "unknown" | "has" | "missing" =
    asset !== "USDC" || accountExists !== true
      ? "unknown"
      : allBalances.some((b) => b.asset === "USDC") ? "has" : "missing";

  const balanceError = (() => {
    if (!amount || allBalances.length === 0) return null;
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return null;
    if (asset === "XLM") {
      const xlmBal = parseFloat(allBalances.find((b) => b.asset === "XLM")?.amount ?? "0");
      if (n > xlmBal - 0.00001) return `Insufficient XLM balance. You have ${xlmBal.toFixed(7)} XLM`;
    } else if (asset === "USDC") {
      const usdcBal = parseFloat(allBalances.find((b) => b.asset === "USDC")?.amount ?? "0");
      if (n > usdcBal) return `Insufficient USDC balance. You have ${usdcBal.toFixed(2)} USDC`;
    }
    return null;
  })();

  // --- Effects ---

  // Fetch account info whenever from-address is a valid address
  useEffect(() => {
    if (!fromAddress || !isValidStellarAddress(fromAddress)) return;
    let ignore = false;
    const fetch = async () => {
      try {
        const info = await loadAccountInfo(fromAddress, network);
        if (!ignore) {
          setAccountExists(info.exists);
          setAllBalances(info.balances);
          setSourceBalance(info.balances.find((b) => b.asset === "XLM")?.amount ?? "0");
        }
      } catch {
        if (!ignore) {
          setAccountExists(null);
          setAllBalances([]);
          setSourceBalance(null);
        }
      }
    };
    fetch();
    return () => { ignore = true; };
  }, [fromAddress, network]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollActiveRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  // --- Polling ---

  const startPolling = (hash: string) => {
    pollActiveRef.current = true;
    setPollStatus("pending");
    setPollTimedOut(false);

    let attempts = 0;
    const maxAttempts = 24; // 24 × 5 s = 120 s

    const doPoll = async () => {
      if (!pollActiveRef.current) return;
      if (attempts >= maxAttempts) {
        setPollTimedOut(true);
        return;
      }
      attempts++;
      try {
        const status = await getTransactionStatus(hash, network);
        if (!pollActiveRef.current) return;
        setPollStatus(status);
        if (status === "pending") {
          pollTimeoutRef.current = setTimeout(doPoll, 5000);
        }
      } catch {
        if (pollActiveRef.current) {
          pollTimeoutRef.current = setTimeout(doPoll, 5000);
        }
      }
    };

    doPoll();
  };

  // --- Validation ---

  const validFrom = !fromAddress || isValidStellarAddress(fromAddress);
  const validTo = !toAddress || (isValidStellarAddress(toAddress) && isCAddress(toAddress));
  const validAmount = !!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  const canProceed =
    fromAddress &&
    toAddress &&
    validFrom &&
    validTo &&
    validAmount &&
    txStatus === "idle" &&
    accountExists !== false &&
    !balanceError &&
    trustlineStatus !== "missing";

  // --- Handlers ---

  const handleUseConnected = () => {
    if (address) setFromAddress(address);
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
      const result = await bridgeViaContract(fromAddress, toAddress, amount, asset, network);
      setTxHash(result.hash);
      setTxStatus("success");
      setStep("confirm");
      startPolling(result.hash);
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus("error");
    }
  };

  const handleAddTrustline = async () => {
    if (!fromAddress) return;
    setTrustlineActionStatus("signing");
    setTrustlineError(null);
    try {
      await buildAndSubmitChangeTrust(fromAddress, "USDC", USDC_ISSUERS[network], network);
      setTrustlineActionStatus("idle");
      // Re-fetch so trustlineStatus recomputes to "has"
      const info = await loadAccountInfo(fromAddress, network);
      setAccountExists(info.exists);
      setAllBalances(info.balances);
    } catch (e: unknown) {
      setTrustlineError(e instanceof Error ? e.message : "Failed to add trustline");
      setTrustlineActionStatus("error");
    }
  };

  const handleReset = () => {
    pollActiveRef.current = false;
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setStep("form");
    setTxStatus("idle");
    setTxHash(null);
    setTxError(null);
    setPollStatus(null);
    setPollTimedOut(false);
    setTrustlineActionStatus("idle");
    setTrustlineError(null);
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
                {/* From address */}
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
                        setAccountExists(null);
                        setAllBalances([]);
                      }}
                      placeholder={isConnected ? address! : "GABC...DEF or connect wallet"}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== "idle"}
                    />
                  </div>
                  {!validFrom && fromAddress && (
                    <p className="text-xs text-[var(--error)] mt-1">Invalid Stellar address</p>
                  )}
                  {accountExists === false && (
                    <p className="text-xs text-[var(--error)] mt-1">
                      Account not found on the {network === "PUBLIC" ? "Mainnet" : "Testnet"} network. It needs to be funded first.
                    </p>
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

                {/* To address */}
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

                {/* Amount + asset */}
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
                  {balanceError && (
                    <p className="text-xs text-[var(--error)] mt-1">{balanceError}</p>
                  )}
                </div>

                {/* USDC trustline warning */}
                {trustlineStatus === "missing" && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">No USDC trustline found</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          You need to establish a trustline first before bridging USDC.
                        </p>
                      </div>
                    </div>
                    {trustlineError && (
                      <p className="text-xs text-[var(--error)] mb-2">{trustlineError}</p>
                    )}
                    <button
                      onClick={handleAddTrustline}
                      disabled={trustlineActionStatus === "signing"}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                    >
                      {trustlineActionStatus === "signing" ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Adding Trustline…
                        </>
                      ) : (
                        "Add USDC Trustline"
                      )}
                    </button>
                  </div>
                )}

                {trustlineStatus === "has" && asset === "USDC" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
                    <Check className="w-4 h-4 text-[var(--success)]" />
                    <p className="text-xs text-[var(--success)]">USDC trustline established</p>
                  </div>
                )}

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
                    <span className="text-sm text-[var(--text-muted)]">Fee</span>
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
                        {txStatus === "signing" ? "Signing…" : "Submitting…"}
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
                {pollStatus === "confirmed" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-[var(--success)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Confirmed ✓</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                      Your transaction has been confirmed on the Stellar network.
                    </p>
                  </>
                ) : pollStatus === "failed" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-[var(--error)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Failed ✗</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                      The transaction was rejected by the network.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-[var(--primary-light)] animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Pending…</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                      {pollTimedOut
                        ? "Could not confirm the transaction status in time."
                        : "Waiting for confirmation on the Stellar network."}
                    </p>
                  </>
                )}
                {txHash && (
                  <a
                    href={getExplorerUrl(network, "tx", txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[var(--primary-light)] hover:underline mb-6"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {pollTimedOut ? "Check on Stellar Expert" : "View on Stellar Expert"}
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
