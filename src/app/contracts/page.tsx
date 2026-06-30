"use client";

import { useState, useRef } from "react";
import { useWallet } from "@/components/wallet-provider";
import { ToastContainer, useToast } from "@/components/toast";
import { deployContract, upgradeContract, getContractState } from "@/lib/stellar";
import { getExplorerUrl } from "@/lib/stellar";
import { ExternalLink, Upload, RefreshCw, Wallet } from "lucide-react";
import type { ContractState } from "@/lib/stellar";

const ADMIN_ENABLED = process.env.NEXT_PUBLIC_CONTRACTS_ADMIN === "true";

export default function ContractsPage() {
  const { isConnected, address, network, connect } = useWallet();
  const { toasts, add: addToast, remove: removeToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [wasmBytes, setWasmBytes] = useState<Uint8Array | null>(null);
  const [wasmFileName, setWasmFileName] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState<{ contractId: string; wasmHash: string; txHash: string } | null>(null);

  const [upgradeContractId, setUpgradeContractId] = useState("");
  const [upgradeWasmHash, setUpgradeWasmHash] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const [inspectId, setInspectId] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [contractState, setContractState] = useState<ContractState | null>(null);

  if (!ADMIN_ENABLED) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-[var(--text-muted)] text-sm">
          Contract admin is disabled. Set{" "}
          <code className="font-mono text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">
            NEXT_PUBLIC_CONTRACTS_ADMIN=true
          </code>{" "}
          to enable.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <Wallet className="w-10 h-10 text-[var(--primary-light)] mx-auto" />
        <p className="text-[var(--text-muted)] text-sm">Connect your Freighter wallet to manage contracts.</p>
        <button
          onClick={connect}
          className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          Connect Freighter
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWasmFileName(file.name);
    file.arrayBuffer().then((buf) => setWasmBytes(new Uint8Array(buf)));
  };

  const handleDeploy = async () => {
    if (!wasmBytes || !address) return;
    setDeploying(true);
    try {
      const result = await deployContract(address, wasmBytes, network);
      setDeployed(result);
      addToast(`Contract deployed: ${result.contractId.slice(0, 10)}…`, "success", 8000, {
        txHash: result.txHash,
        explorerUrl: getExplorerUrl(network, "tx", result.txHash),
      });
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Deploy failed", "error", 8000);
    } finally {
      setDeploying(false);
    }
  };

  const handleUpgrade = async () => {
    if (!upgradeContractId || !upgradeWasmHash || !address) return;
    setUpgrading(true);
    try {
      const txHash = await upgradeContract(address, upgradeContractId, upgradeWasmHash, network);
      addToast("Contract upgraded", "success", 8000, {
        txHash,
        explorerUrl: getExplorerUrl(network, "tx", txHash),
      });
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Upgrade failed", "error", 8000);
    } finally {
      setUpgrading(false);
    }
  };

  const handleInspect = async () => {
    if (!inspectId) return;
    setInspecting(true);
    setContractState(null);
    try {
      const state = await getContractState(inspectId, network);
      setContractState(state);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Inspect failed", "error", 6000);
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div>
        <h1 className="text-3xl font-bold mb-1">Contract Admin</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Deploy and manage Soroban bridge contracts · {network}
        </p>
      </div>

      {/* Deploy */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h2 className="font-semibold text-lg">Deploy Contract</h2>
        <div>
          <input ref={fileRef} type="file" accept=".wasm" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm hover:bg-[var(--surface-3)] transition-colors"
          >
            <Upload className="w-4 h-4" />
            {wasmFileName || "Select .wasm file"}
          </button>
        </div>
        <button
          onClick={handleDeploy}
          disabled={!wasmBytes || deploying}
          className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deploying ? "Deploying…" : "Deploy"}
        </button>
        {deployed && (
          <div className="space-y-1 text-sm p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
            <p><span className="text-[var(--text-muted)]">Contract ID:</span>{" "}
              <code className="font-mono text-xs">{deployed.contractId}</code>
              <a href={getExplorerUrl(network, "contract", deployed.contractId)} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-[var(--primary-light)] hover:underline text-xs">
                <ExternalLink className="w-3 h-3" /> View
              </a>
            </p>
            <p><span className="text-[var(--text-muted)]">WASM hash:</span>{" "}
              <code className="font-mono text-xs break-all">{deployed.wasmHash}</code>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Copy the contract ID above into <code className="font-mono">NEXT_PUBLIC_BRIDGE_CONTRACT_ID_{network}</code> in your <code className="font-mono">.env.local</code>.
            </p>
          </div>
        )}
      </section>

      {/* Upgrade */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h2 className="font-semibold text-lg">Upgrade Contract</h2>
        <p className="text-xs text-[var(--text-muted)]">Calls <code className="font-mono">__upgrade</code> on the contract. The contract must expose this entrypoint and the caller must be the admin.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Contract ID</label>
            <input
              value={upgradeContractId}
              onChange={(e) => setUpgradeContractId(e.target.value.trim())}
              placeholder="C…"
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">New WASM hash (hex)</label>
            <input
              value={upgradeWasmHash}
              onChange={(e) => setUpgradeWasmHash(e.target.value.trim())}
              placeholder="abc123…"
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={!upgradeContractId || !upgradeWasmHash || upgrading}
          className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {upgrading ? "Upgrading…" : "Upgrade"}
        </button>
      </section>

      {/* Inspect */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h2 className="font-semibold text-lg">Inspect Contract</h2>
        <div className="flex gap-3">
          <input
            value={inspectId}
            onChange={(e) => setInspectId(e.target.value.trim())}
            placeholder="C… contract address"
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
          <button
            onClick={handleInspect}
            disabled={!inspectId || inspecting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${inspecting ? "animate-spin" : ""}`} />
            {inspecting ? "Loading…" : "Fetch"}
          </button>
        </div>
        {contractState && (
          <div className="text-sm p-4 rounded-lg bg-[var(--surface-2)] space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Latest ledger</span>
              <span className="font-mono">{contractState.ledger}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-[var(--text-muted)] flex-shrink-0">WASM hash</span>
              <span className="font-mono text-xs break-all text-right">{contractState.wasmHash ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Explorer</span>
              <a
                href={getExplorerUrl(network, "contract", contractState.contractId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--primary-light)] hover:underline text-xs"
              >
                <ExternalLink className="w-3 h-3" /> View on Stellar Expert
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
