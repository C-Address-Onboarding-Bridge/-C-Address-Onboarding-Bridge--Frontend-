"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ArrowRightLeft, Wallet, Send, ArrowRight, Check, AlertCircle,
  Loader2, ExternalLink, XCircle, AlertTriangle, RotateCcw, RotateCw,
} from "lucide-react";
import { useWallet } from "@/components/wallet-provider";
import { ToastContainer, useToast } from "@/components/toast";
import { useFormHistory, type FormState } from "@/hooks/useFormHistory";
import {
  isValidStellarAddress,
  isCAddress,
  bridgeViaContract,
  getExplorerUrl,
  loadAccountInfo,
  buildAndSubmitChangeTrust,
  getTransactionStatus,
} from "@/lib/stellar";
import {
  ASSET_XLM,
  ASSET_USDC,
  XLM_RESERVE_BUFFER,
  XLM_DISPLAY_DECIMALS,
  XLM_PRECISE_DECIMALS,
  STELLAR_ADDRESS_LENGTH,
  NETWORK_PUBLIC,
  NETWORK_TESTNET,
  NETWORK_DISPLAY,
  TX_MAX_ATTEMPTS,
  TX_POLL_INTERVAL_MS,
  STATUS_IDLE,
  STATUS_SIGNING,
  STATUS_SUBMITTING,
  STATUS_SUCCESS,
  STATUS_ERROR,
  STATUS_PENDING,
  STATUS_CONFIRMED,
  STATUS_FAILED,
  STATUS_UNKNOWN,
  STATUS_HAS,
  STATUS_MISSING,
  STEP_FORM,
  STEP_REVIEW,
  STEP_CONFIRM,
  USDC_ISSUERS,
} from "@/lib/constants";

type Step = "form" | "review" | "simulate" | "confirm";
type TxStatus = "idle" | "signing" | "submitting" | "success" | "error";
type PollStatus = "pending" | "confirmed" | "failed" | null;

export default function BridgePage() {
  const { isConnected, address, network, connect } = useWallet();
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState<string>(ASSET_XLM);
  const [step, setStep] = useState<Step>(STEP_FORM);
  const [txStatus, setTxStatus] = useState<TxStatus>(STATUS_IDLE);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const formState = useMemo(
    () => ({ fromAddress, toAddress, amount, asset }),
    [fromAddress, toAddress, amount, asset]
  );

  const restoreFormState = useCallback((state: FormState): void => {
    setFromAddress(state.fromAddress);
    setToAddress(state.toAddress);
    setAmount(state.amount);
    setAsset(state.asset);
  }, []);
  const { updateHistory, undo, redo, clearHistory, canUndo, canRedo } = useFormHistory(
    formState,
    restoreFormState
  );

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

  // Allowance state
  type AllowanceStatus = "idle" | "checking" | "sufficient" | "required" | "approving" | "approved" | "error";
  const [allowanceStatus, setAllowanceStatus] = useState<AllowanceStatus>("idle");
  const [allowanceError, setAllowanceError] = useState<string | null>(null);

  // For native XLM or when no bridge contract is set, approval is never needed
  const needsAllowanceCheck = step === "review" && !isNativeAsset(asset) && !!BRIDGE_CONTRACT_ID && asset === "USDC";

  const checkAllowance = async (owner: string, amtStr: string, net: "PUBLIC" | "TESTNET") => {
    setAllowanceStatus("checking");
    setAllowanceError(null);
    try {
      const tokenContractId = USDC_ISSUERS[net];
      const amountRaw = BigInt(Math.round(parseFloat(amtStr) * 10_000_000));
      const current = await getTokenAllowance(tokenContractId, owner, BRIDGE_CONTRACT_ID, net);
      setAllowanceStatus(current >= amountRaw ? "sufficient" : "required");
    } catch (e) {
      setAllowanceError(e instanceof Error ? e.message : "Allowance check failed");
      setAllowanceStatus("error");
    }
  };

  // --- Computed values (derived from state, no extra renders needed) ---

  const trustlineStatus: "unknown" | "has" | "missing" =
    asset !== ASSET_USDC || accountExists !== true
      ? STATUS_UNKNOWN
      : allBalances.some((b) => b.asset === ASSET_USDC) ? STATUS_HAS : STATUS_MISSING;

  const balanceError = (() => {
    if (!amount || allBalances.length === 0) return null;
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return null;
    if (asset === ASSET_XLM) {
      const xlmBal = parseFloat(allBalances.find((b) => b.asset === ASSET_XLM)?.amount ?? "0");
      if (n > xlmBal - XLM_RESERVE_BUFFER) return `Insufficient ${ASSET_XLM} balance. You have ${xlmBal.toFixed(XLM_PRECISE_DECIMALS)} ${ASSET_XLM}`;
    } else if (asset === ASSET_USDC) {
      const usdcBal = parseFloat(allBalances.find((b) => b.asset === ASSET_USDC)?.amount ?? "0");
      if (n > usdcBal) return `Insufficient ${ASSET_USDC} balance. You have ${usdcBal.toFixed(XLM_DISPLAY_DECIMALS)} ${ASSET_USDC}`;
    }
    return null;
  })();

  // --- Effects ---

  // Update history when form state changes (only on form step)
  useEffect(() => {
    if (step === "form") {
      updateHistory(formState);
    }
  }, [fromAddress, toAddress, amount, asset, step, formState, updateHistory]);

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
          setSourceBalance(info.balances.find((b) => b.asset === ASSET_XLM)?.amount ?? "0");
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

  // Cleanup polling and rate limit on unmount
  useEffect(() => {
    return () => {
      pollActiveRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (rateLimitIntervalRef.current) clearInterval(rateLimitIntervalRef.current);
    };
  }, []);

  const handleApprove = async () => {
    if (!fromAddress || !amount || !BRIDGE_CONTRACT_ID || !needsAllowanceCheck) return;
    const tokenContractId = USDC_ISSUERS[network];

    setAllowanceStatus("approving");
    setAllowanceError(null);
    try {
      const amountRaw = BigInt(Math.round(parseFloat(amount) * 10_000_000));
      await approveToken(tokenContractId, fromAddress, BRIDGE_CONTRACT_ID, amountRaw, network);
      setAllowanceStatus("approved");
    } catch (e) {
      setAllowanceError(e instanceof Error ? e.message : "Approval failed");
      setAllowanceStatus("error");
    }
  };

  // --- Polling ---

  const startPolling = (hash: string) => {
    pollActiveRef.current = true;
    setPollStatus("pending");
    setPollTimedOut(false);

    let attempts = 0;
    const maxAttempts = TX_MAX_ATTEMPTS;

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
        if (status === STATUS_PENDING) {
          pollTimeoutRef.current = setTimeout(doPoll, TX_POLL_INTERVAL_MS);
        }
      } catch {
        if (pollActiveRef.current) {
          pollTimeoutRef.current = setTimeout(doPoll, TX_POLL_INTERVAL_MS);
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
    txStatus === STATUS_IDLE &&
    accountExists !== false &&
    !balanceError &&
    trustlineStatus !== STATUS_MISSING;

  // Keyboard shortcut for form submission
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && step === "form" && canProceed) {
        e.preventDefault();
        setStep("review");
        setTxError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, canProceed]);

  // --- Handlers ---

  const handleUseConnected = () => {
    if (address) setFromAddress(address);
  };

  const handleSubmit = () => {
    if (!canProceed) return;
    setStep(STEP_REVIEW);
    setTxError(null);
    setAllowanceStatus("idle");
    setAllowanceError(null);
    if (!isNativeAsset(asset) && BRIDGE_CONTRACT_ID && asset === "USDC" && fromAddress && amount) {
      checkAllowance(fromAddress, amount, network);
    }
  };

  const handleConfirm = async () => {
    if (!fromAddress || !toAddress || !amount) return;
    setTxStatus(STATUS_SIGNING);
    setTxError(null);
    recordSubmissionAttempt("bridge_submission");
    recordTransactionSubmission(fromAddress, toAddress, amount, asset);

    try {
      const result = await bridgeViaContract(fromAddress, toAddress, amount, asset, network);
      setTxHash(result.hash);
      setTxStatus(STATUS_SUCCESS);
      setStep(STEP_CONFIRM);
      startPolling(result.hash);
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(STATUS_ERROR);
    }
  };

  const handleAddTrustline = async () => {
    if (!fromAddress) return;
    setTrustlineActionStatus(STATUS_SIGNING);
    setTrustlineError(null);
    try {
      await buildAndSubmitChangeTrust(fromAddress, ASSET_USDC, USDC_ISSUERS[network], network);
      setTrustlineActionStatus(STATUS_IDLE);
      // Re-fetch so trustlineStatus recomputes to "has"
      const info = await loadAccountInfo(fromAddress, network);
      setAccountExists(info.exists);
      setAllBalances(info.balances);
    } catch (e: unknown) {
      setTrustlineError(e instanceof Error ? e.message : "Failed to add trustline");
      setTrustlineActionStatus(STATUS_ERROR);
    }
  };

  const handleReset = () => {
    pollActiveRef.current = false;
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setStep(STEP_FORM);
    setTxStatus(STATUS_IDLE);
    setTxHash(null);
    setTxError(null);
    setPollStatus(null);
    setPollTimedOut(false);
    setTrustlineActionStatus(STATUS_IDLE);
    setTrustlineError(null);
    setAllowanceStatus("idle");
    setAllowanceError(null);
  };

  const handleUndo = () => {
    if (undo()) {
      addToast("Undo: Form state restored", "info", 2000);
    }
  };

  const handleRedo = () => {
    if (redo()) {
      addToast("Redo: Form state restored", "info", 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">G → C Bridge</h1>
          {step === "form" && (
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Shift+Z)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
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
                        const sanitized = sanitizeStellarAddress(e.target.value) || e.target.value;
                        setFromAddress(sanitized);
                        setSourceBalance(null);
                        setAccountExists(null);
                        setAllBalances([]);
                      }}
                      placeholder={isConnected ? address! : "GABC...DEF or connect wallet"}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== STATUS_IDLE}
                    />
                  </div>
                  {!validFrom && fromAddress && (
                    <p className="text-xs text-[var(--error)] mt-1">Invalid Stellar address</p>
                  )}
                  {accountExists === false && (
                    <p className="text-xs text-[var(--error)] mt-1">
                      Account not found on the {network === NETWORK_PUBLIC ? NETWORK_DISPLAY[NETWORK_PUBLIC] : NETWORK_DISPLAY[NETWORK_TESTNET]} network. It needs to be funded first.
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
                      Balance: {parseFloat(sourceBalance).toFixed(XLM_DISPLAY_DECIMALS)} {ASSET_XLM}
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
                      onChange={(e) => {
                        const sanitized = sanitizeCAddress(e.target.value) || e.target.value;
                        setToAddress(sanitized);
                      }}
                      placeholder="CABC...DEF"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== STATUS_IDLE}
                    />
                  </div>
                  {!validTo && toAddress && (
                    <p className="text-xs text-[var(--error)] mt-1">
                      Invalid C-address (must start with C and be {STELLAR_ADDRESS_LENGTH} characters)
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
                        onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                        disabled={txStatus !== "idle"}
                      />
                    </div>
                    <select
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      className="px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== STATUS_IDLE}
                    >
                      <option>{ASSET_XLM}</option>
                      <option>{ASSET_USDC}</option>
                    </select>
                  </div>
                  {balanceError && (
                    <p className="text-xs text-[var(--error)] mt-1">{balanceError}</p>
                  )}
                </div>

                {/* USDC trustline warning */}
                {trustlineStatus === STATUS_MISSING && (
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
                      disabled={trustlineActionStatus === STATUS_SIGNING}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                    >
                      {trustlineActionStatus === STATUS_SIGNING ? (
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

                {trustlineStatus === STATUS_HAS && asset === ASSET_USDC && (
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

            {step === STEP_REVIEW && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Review Transaction</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">From</span>
                    <span className="text-sm font-mono">{encodeHtml(fromAddress)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">To</span>
                    <span className="text-sm font-mono">{encodeHtml(toAddress)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">Amount</span>
                    <span className="text-sm font-semibold">{encodeHtml(amount)} {encodeHtml(asset)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">Network</span>
                    <span className="text-sm">{network === NETWORK_PUBLIC ? NETWORK_DISPLAY[NETWORK_PUBLIC] : NETWORK_DISPLAY[NETWORK_TESTNET]}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">Fee</span>
                    <span className="text-sm">~{XLM_RESERVE_BUFFER} {ASSET_XLM}</span>
                  </div>
                </div>

                {/* Allowance status row */}
                {needsAllowanceCheck && (
                  <div className="p-4 rounded-lg bg-[var(--surface-2)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-muted)]">Token Approval</span>
                      {allowanceStatus === "checking" && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking allowance…
                        </span>
                      )}
                      {(allowanceStatus === "sufficient" || allowanceStatus === "approved") && (
                        <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {allowanceStatus === "required" && (
                        <span className="text-xs text-amber-400">Approval Required</span>
                      )}
                      {allowanceStatus === "approving" && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Loader2 className="w-3 h-3 animate-spin" /> Approving…
                        </span>
                      )}
                      {allowanceStatus === "error" && (
                        <span className="text-xs text-[var(--error)]">Check failed</span>
                      )}
                    </div>
                    {allowanceStatus === "required" && (
                      <button
                        onClick={handleApprove}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-colors"
                      >
                        Approve {asset} for Bridge Contract
                      </button>
                    )}
                    {allowanceError && (
                      <p className="text-xs text-[var(--error)]">{allowanceError}</p>
                    )}
                  </div>
                )}

                {!needsAllowanceCheck && (
                  <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-sm text-[var(--text-muted)]">Token Approval</span>
                    <span className="text-xs text-[var(--text-muted)]">Not needed for XLM</span>
                  </div>
                )}

                {txError && (
                  <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[var(--error)]">
                        {rateLimitRemaining > 0 ? "Rate Limited" : "Transaction Failed"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {rateLimitRemaining > 0
                          ? `Please wait ${Math.ceil(rateLimitRemaining / 1000)} seconds before submitting again`
                          : txError}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    disabled={txStatus === STATUS_SIGNING || txStatus === STATUS_SUBMITTING}
                    className="flex-1 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={txStatus === STATUS_SIGNING || txStatus === STATUS_SUBMITTING}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                  >
                    {txStatus === STATUS_SIGNING || txStatus === STATUS_SUBMITTING ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {txStatus === STATUS_SIGNING ? "Signing…" : "Submitting…"}
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

            {step === STEP_CONFIRM && txStatus === STATUS_SUCCESS && (
              <div className="text-center py-12">
                {pollStatus === STATUS_CONFIRMED ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-[var(--success)] checkmark-animation" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 slide-in">Confirmed ✓</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4 slide-in">
                      Your transaction has been confirmed on the Stellar network.
                    </p>
                  </>
                ) : pollStatus === STATUS_FAILED ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4 rotate-scale-animation">
                      <XCircle className="w-8 h-8 text-[var(--error)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 slide-in">Failed ✗</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4 slide-in">
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

            {step === STEP_CONFIRM && txStatus === STATUS_ERROR && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-[var(--error)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transaction Failed</h3>
                <p className="text-sm text-[var(--text-muted)] mb-6">{txError || "An unexpected error occurred"}</p>
                <button
                  onClick={() => { setStep(STEP_REVIEW); setTxStatus(STATUS_IDLE); setTxError(null); }}
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
