"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ArrowRightLeft, Wallet, Send, ArrowRight, Check, AlertCircle,
  Loader2, ExternalLink, XCircle, AlertTriangle, RotateCcw, RotateCw,
} from "lucide-react";
import { useWallet, ToastContainer, useToast } from "@/components";
import { useFormHistory, type FormState } from "@/hooks/useFormHistory";
import { useMultiStepForm } from "@/hooks/useMultiStepForm";
import { useConnectivity } from "@/components/connectivity-provider";
import { getBridgeContractId, NETWORK_CONFIG_ERRORS } from "@/config/networks";
import {
  isValidStellarAddress,
  isCAddress,
  bridgeViaContract,
  buildBridgeTransaction,
  getExplorerUrl,
  loadAccountInfo,
  buildAndSubmitChangeTrust,
  getTransactionStatus,
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
} from "@/lib";
import { validateCAddress } from "@/utils/validation";

type TxStatus = "idle" | "signing" | "submitting" | "success" | "error";
type PollStatus = "pending" | "confirmed" | "failed" | null;

type CachedBridgeState = {
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  selectedFee: string;
};

type CachedAccountInfo = {
  exists: boolean | null;
  balances: { asset: string; amount: string }[];
  sourceBalance: string | null;
};

type QueuedBridgeSubmission = {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  network: "PUBLIC" | "TESTNET";
  selectedFee: string;
};

const BRIDGE_FORM_STATE_KEY = "c_bridge_cached_form_state";
const BRIDGE_ACCOUNT_INFO_KEY = "c_bridge_cached_account_info";
const BRIDGE_OFFLINE_QUEUE_KEY = "c_bridge_offline_submission_queue";

export default function BridgePage() {
  const { isConnected, address, network, connect } = useWallet();
  const { toasts, add: addToast, update: updateToast, remove: removeToast } = useToast();

  const bridgeContractId = getBridgeContractId(network);

  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState<string>(ASSET_XLM);
  const [step, setStep] = useState<Step>(STEP_FORM);
  const prevStepRef = useRef<Step>(STEP_FORM);
  const [stepDir, setStepDir] = useState<"forward" | "back">("forward");
  const [txStatus, setTxStatus] = useState<TxStatus>(STATUS_IDLE);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [selectedFee, setSelectedFee] = useState<string>("100");
  const { isOffline } = useConnectivity();
  const mountedRef = useRef(true);
  const [pendingOfflineSubmissions, setPendingOfflineSubmissions] = useState(0);

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

  useEffect(() => {
    mountedRef.current = true;

    if (typeof window === "undefined") return undefined;

    const cachedForm = localStorage.getItem(BRIDGE_FORM_STATE_KEY);
    if (cachedForm) {
      try {
        const parsed = JSON.parse(cachedForm) as CachedBridgeState;
        if (parsed.fromAddress) setFromAddress(parsed.fromAddress);
        if (parsed.toAddress) setToAddress(parsed.toAddress);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.asset) setAsset(parsed.asset);
        if (parsed.selectedFee) setSelectedFee(parsed.selectedFee);
      } catch {
        // ignore malformed cache
      }
    }

    const cachedAccount = localStorage.getItem(BRIDGE_ACCOUNT_INFO_KEY);
    if (cachedAccount) {
      try {
        const parsed = JSON.parse(cachedAccount) as { fromAddress: string; info: CachedAccountInfo };
        if (parsed.fromAddress && parsed.info && parsed.info.balances) {
          setAccountExists(parsed.info.exists);
          setAllBalances(parsed.info.balances);
          setSourceBalance(parsed.info.sourceBalance);
        }
      } catch {
        // ignore malformed cache
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedState: CachedBridgeState = {
      fromAddress,
      toAddress,
      amount,
      asset,
      selectedFee,
    };
    localStorage.setItem(BRIDGE_FORM_STATE_KEY, JSON.stringify(cachedState));
  }, [fromAddress, toAddress, amount, asset, selectedFee]);

  useEffect(() => {
    if (typeof window === "undefined" || !fromAddress) return;
    const accountCache = {
      fromAddress,
      info: {
        exists: accountExists,
        balances: allBalances,
        sourceBalance,
      },
    };
    localStorage.setItem(BRIDGE_ACCOUNT_INFO_KEY, JSON.stringify(accountCache));
  }, [fromAddress, accountExists, allBalances, sourceBalance]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem(BRIDGE_OFFLINE_QUEUE_KEY);
    if (!data) {
      setPendingOfflineSubmissions(0);
      return;
    }

    try {
      const queued = JSON.parse(data) as QueuedBridgeSubmission[];
      setPendingOfflineSubmissions(queued.length);
    } catch {
      setPendingOfflineSubmissions(0);
    }
  }, []);

  useEffect(() => {
    if (!isOffline) {
      const data = localStorage.getItem(BRIDGE_OFFLINE_QUEUE_KEY);
      if (!data) return;

      try {
        const queued = JSON.parse(data) as QueuedBridgeSubmission[];
        if (!queued.length) return;
        localStorage.removeItem(BRIDGE_OFFLINE_QUEUE_KEY);
        setPendingOfflineSubmissions(0);

        queued.forEach(async (submission) => {
          try {
            const result = await bridgeViaContract(
              submission.fromAddress,
              submission.toAddress,
              submission.amount,
              submission.asset,
              submission.network,
              submission.selectedFee,
            );
            const toastId = addToast(
              "Queued transaction submitted successfully",
              "success",
              5000,
              {
                txHash: result.hash,
                explorerUrl: getExplorerUrl(submission.network, "tx", result.hash),
              },
            );
            startPolling(result.hash, toastId);
          } catch (error: unknown) {
            addToast(
              error instanceof Error ? error.message : "Queued transaction failed",
              "error",
              6000,
            );
          }
        });
      } catch {
        // ignore malformed queue data
      }
    }
  }, [isOffline, addToast, startPolling, network]);

  const enqueueOfflineSubmission = (payload: Omit<QueuedBridgeSubmission, "id">) => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem(BRIDGE_OFFLINE_QUEUE_KEY);
    let queued: QueuedBridgeSubmission[] = [];
    if (data) {
      try {
        queued = JSON.parse(data) as QueuedBridgeSubmission[];
      } catch {
        queued = [];
      }
    }

    const nextItem: QueuedBridgeSubmission = {
      id: `${Date.now()}-${queued.length}`,
      ...payload,
    };
    queued.push(nextItem);
    localStorage.setItem(BRIDGE_OFFLINE_QUEUE_KEY, JSON.stringify(queued));
    setPendingOfflineSubmissions(queued.length);
  };

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

  // Pre-flight simulation state
  type SimStatus = "idle" | "running" | "done" | "error";
  const [simStatus, setSimStatus] = useState<SimStatus>("idle");
  const [simMinFee, setSimMinFee] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [feeOverride, setFeeOverride] = useState<string>("");

  // For native XLM or when no bridge contract is set, approval is never needed
  const needsAllowanceCheck = step === "review" && !isNativeAsset(asset) && !!bridgeContractId && asset === "USDC";

  const checkAllowance = async (owner: string, amtStr: string, net: "PUBLIC" | "TESTNET") => {
    setAllowanceStatus("checking");
    setAllowanceError(null);
    try {
      const tokenContractId = USDC_ISSUERS[net];
      const amountRaw = BigInt(Math.round(parseFloat(amtStr) * 10_000_000));
      const current = await getTokenAllowance(tokenContractId, owner, bridgeContractId, net);
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
    if (isOffline) return;
    if (!fromAddress || !amount || !bridgeContractId || !needsAllowanceCheck) return;
    const tokenContractId = USDC_ISSUERS[network];

    setAllowanceStatus("approving");
    setAllowanceError(null);
    try {
      const amountRaw = BigInt(Math.round(parseFloat(amount) * 10_000_000));
      await approveToken(tokenContractId, fromAddress, bridgeContractId, amountRaw, network);
      setAllowanceStatus("approved");
    } catch (e) {
      setAllowanceError(e instanceof Error ? e.message : "Approval failed");
      setAllowanceStatus("error");
    }
  };

  // --- Polling ---

  const startPolling = (hash: string, toastId?: string) => {
    pollActiveRef.current = true;
    setPollStatus("pending");
    setPollTimedOut(false);

    let attempts = 0;
    const maxAttempts = TX_MAX_ATTEMPTS;

    const doPoll = async () => {
      if (!pollActiveRef.current) return;
      if (attempts >= maxAttempts) {
        setPollTimedOut(true);
        if (toastId) updateToast(toastId, { type: "info", message: "Transaction status unknown — check explorer", duration: 8000 });
        return;
      }
      attempts++;
      try {
        const status = await getTransactionStatus(hash, network);
        if (!pollActiveRef.current) return;
        setPollStatus(status);
        if (status === STATUS_CONFIRMED) {
          if (toastId) updateToast(toastId, { type: "success", message: "Transaction confirmed", duration: 8000 });
        } else if (status === STATUS_FAILED) {
          if (toastId) updateToast(toastId, { type: "error", message: "Transaction failed on-chain", duration: 8000 });
        } else {
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
  const toAddressError = validateCAddress(toAddress);
  const validTo = !toAddress || (!toAddressError && isCAddress(toAddress));
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
        goStep("review");
        setTxError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, canProceed, setStep]);

  // --- Helpers ---

  const STEP_ORDER: Step[] = [STEP_FORM, STEP_REVIEW, STEP_CONFIRM];

  const goStep = (next: Step) => {
    const cur = STEP_ORDER.indexOf(prevStepRef.current);
    const nxt = STEP_ORDER.indexOf(next);
    setStepDir(nxt >= cur ? "forward" : "back");
    prevStepRef.current = next;
    setStep(next);
  };

  // --- Handlers ---

  const handleUseConnected = () => {
    if (address) setFromAddress(address);
  };

  const handleSubmit = () => {
    if (!canProceed) {
      if (!fromAddress || !validFrom) {
        document.getElementById("from-address")?.focus();
      } else if (!toAddress || !validTo) {
        document.getElementById("to-address")?.focus();
      } else if (!validAmount || balanceError) {
        document.getElementById("amount")?.focus();
      }
      return;
    }
    goStep(STEP_REVIEW);
    setTxError(null);
    setAllowanceStatus("idle");
    setAllowanceError(null);

    if (!isOffline && !isNativeAsset(asset) && bridgeContractId && asset === "USDC" && fromAddress && amount) {
      checkAllowance(fromAddress, amount, network);
    }

    if (isOffline) {
      setSimStatus("done");
      setSimMinFee(null);
      setSimError(null);
      return;
    }

    // Run pre-flight simulation (non-blocking)
    buildBridgeTransaction(fromAddress, toAddress, amount, network)
      .then((draftTx) => simulateSorobanTransaction(draftTx, network))
      .then(({ minFee, error }) => {
        setSimMinFee(minFee);
        setSimError(error);
        setSimStatus(error ? "error" : "done");
        if (minFee && !feeOverride) setFeeOverride(minFee);
      })
      .catch(() => setSimStatus("done"));
  };

  const handleConfirm = async () => {
    if (!fromAddress || !toAddress || !amount) return;
    if (isOffline) {
      enqueueOfflineSubmission({
        fromAddress,
        toAddress,
        amount,
        asset,
        network,
        selectedFee,
      });
      addToast(
        "Offline: transaction queued and will retry automatically when online.",
        "info",
        6000,
      );
      return;
    }

    setTxStatus(STATUS_SIGNING);
    setTxError(null);
    recordSubmissionAttempt("bridge_submission");
    recordTransactionSubmission(fromAddress, toAddress, amount, asset);

    try {
      const result = await bridgeViaContract(fromAddress, toAddress, amount, asset, network, selectedFee);
      setTxHash(result.hash);
      setTxStatus(STATUS_SUCCESS);
      goStep(STEP_CONFIRM);
      const toastId = addToast("Transaction submitted", "pending", 0, {
        txHash: result.hash,
        explorerUrl: getExplorerUrl(network, "tx", result.hash),
      });
      startPolling(result.hash, toastId);
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxStatus(STATUS_ERROR);
      addToast(e instanceof Error ? e.message : "Transaction failed", "error", 6000);
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
    goStep(STEP_FORM);
    setTxStatus(STATUS_IDLE);
    setTxHash(null);
    setTxError(null);
    setPollStatus(null);
    setPollTimedOut(false);
    setTrustlineActionStatus(STATUS_IDLE);
    setTrustlineError(null);
    setAllowanceStatus("idle");
    setAllowanceError(null);
    setSimStatus("idle");
    setSimMinFee(null);
    setSimError(null);
    setFeeOverride("");
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

      {!bridgeContractId && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {NETWORK_CONFIG_ERRORS.NO_CONTRACT}
        </div>
      )}

      {isConnected && !bridgeContractId && getBridgeContractId(network === "PUBLIC" ? "TESTNET" : "PUBLIC") && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-center gap-2 text-sm text-[var(--error)]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {NETWORK_CONFIG_ERRORS.NETWORK_MISMATCH}
        </div>
      )}

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
          {/* Step indicator */}
          {(() => {
            const steps = [{ label: "Details" }, { label: "Review" }, { label: "Confirm" }];
            const idx = step === STEP_FORM ? 0 : step === STEP_REVIEW ? 1 : 2;
            return (
              <div className="mb-4">
                <div className="flex items-center gap-0 mb-2">
                  {steps.map((s, i) => (
                    <div key={s.label} className="flex items-center flex-1 last:flex-none">
                      <div className={`step-dot w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
                        i < idx ? "bg-[var(--primary)] border-[var(--primary)] text-white" :
                        i === idx ? `bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary-light)] step-dot-active` :
                        "bg-transparent border-[var(--border)] text-[var(--text-muted)]"
                      }`}>
                        {i < idx ? "✓" : i + 1}
                      </div>
                      <span className={`ml-2 text-xs font-medium hidden sm:inline ${i === idx ? "text-[var(--foreground)]" : "text-[var(--text-muted)]"}`}>{s.label}</span>
                      {i < steps.length - 1 && (
                        <div className="flex-1 mx-3 h-px bg-[var(--border)] overflow-hidden">
                          <div className={`step-progress-bar h-full bg-[var(--primary)] ${i < idx ? "w-full" : "w-0"}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 overflow-hidden">
            <div key={step} className={stepDir === "forward" ? "step-enter" : "step-enter-back"}>
            {step === "form" && (
              <div className="space-y-6">
                {/* From address */}
                <div>
                  <label className="block text-sm font-medium mb-2">From (G-address)</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      id="from-address"
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
                      aria-describedby="from-address-error"
                      aria-invalid={!validFrom && !!fromAddress}
                    />
                  </div>
                  {!validFrom && fromAddress && (
                    <p id="from-address-error" role="alert" className="text-xs text-[var(--error)] mt-1">Invalid Stellar address</p>
                  )}
                  {accountExists === false && (
                    <p id="from-address-error" role="alert" className="text-xs text-[var(--error)] mt-1">
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
                      id="to-address"
                      value={toAddress}
                      onChange={(e) => {
                        const sanitized = sanitizeCAddress(e.target.value) || e.target.value;
                        setToAddress(sanitized);
                      }}
                      placeholder="CABC...DEF"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                      disabled={txStatus !== STATUS_IDLE}
                      aria-describedby="to-address-error"
                      aria-invalid={!validTo && !!toAddress}
                    />
                  </div>
                  {!validTo && toAddress && (
                    <p id="to-address-error" role="alert" className="text-xs text-[var(--error)] mt-1">
                      {toAddressError}
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
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                        disabled={txStatus !== "idle"}
                        aria-describedby="amount-error"
                        aria-invalid={!!balanceError}
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
                    <p id="amount-error" role="alert" className="text-xs text-[var(--error)] mt-1">{balanceError}</p>
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
                  <div className="p-4 rounded-lg bg-[var(--surface-2)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-muted)]">Estimated Fee</span>
                      {simStatus === "running" && (
                        <span className="flex items-center gap-1">
                          <span className="animate-pulse rounded bg-[var(--surface-2)] h-3 w-20 inline-block" />
                        </span>
                      )}
                      {simStatus === "done" && simMinFee && (
                        <span className="text-xs text-[var(--text-muted)]">
                          ~{stroopsToXlm(simMinFee)} {ASSET_XLM} (simulated)
                        </span>
                      )}
                      {(simStatus === "idle" || (simStatus === "done" && !simMinFee)) && (
                        <span className="text-xs text-[var(--text-muted)]">~{XLM_RESERVE_BUFFER} {ASSET_XLM}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-muted)] whitespace-nowrap">Fee (stroops)</label>
                      <input
                        type="number"
                        min="100"
                        value={feeOverride}
                        onChange={(e) => setFeeOverride(e.target.value)}
                        placeholder={simMinFee ?? "100"}
                        className="flex-1 px-2 py-1 rounded bg-[var(--surface-3)] border border-[var(--border)] text-xs font-mono focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    {simStatus === "error" && simError && (
                      <p className="text-xs text-[var(--error)]">{simError}</p>
                    )}
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
                  <div aria-live="polite" className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-start gap-3">
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

                <ResourcePanel status={simStatus} result={simResult} error={simError} />

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
                  onClick={() => { goStep(STEP_REVIEW); setTxStatus(STATUS_IDLE); setTxError(null); }}
                  className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
            </div>{/* end step-enter */}
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
