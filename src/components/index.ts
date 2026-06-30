/**
 * Public API barrel for src/components/.
 *
 * Re-exports every component and hook that external callers (app pages,
 * tests) may need. Files that only have default exports use the
 * `export { default as X }` form so consumers get named imports everywhere.
 */

// ─── CEX address verification ─────────────────────────────────────────────────
export type { CEXVerificationProps } from "./cex-address-verification";
export { CEXAddressVerification } from "./cex-address-verification";

// ─── Generic data table ───────────────────────────────────────────────────────
export type { Column, DataTableProps } from "./data-table";
export { DataTable } from "./data-table";

// ─── Fee selector ─────────────────────────────────────────────────────────────
export type { FeeTier } from "./fee-selector";
export { FeeSelector } from "./fee-selector";

// ─── Footer ───────────────────────────────────────────────────────────────────
export { default as Footer } from "./footer";

// ─── Keyboard shortcuts info panel ───────────────────────────────────────────
export { KeyboardShortcutsInfo } from "./keyboard-shortcuts-info";

// ─── Navigation bar ───────────────────────────────────────────────────────────
export { default as Navbar } from "./navbar";

// ─── Network mismatch banner ─────────────────────────────────────────────────
export { NetworkMismatchBanner } from "./network-mismatch-banner";

// ─── Onboarding tour ─────────────────────────────────────────────────────────
export { default as OnboardingTour, useOnboardingTour } from "./onboarding-tour";

// ─── Resource / simulation result panel ──────────────────────────────────────
export { ResourcePanel } from "./resource-panel";

// ─── Theme provider and hook ─────────────────────────────────────────────────
export { ThemeProvider, useTheme } from "./theme-provider";
export { ConnectivityProvider, useConnectivity } from "./connectivity-provider";
export { OfflineBanner } from "./offline-banner";

// ─── Theme toggle button ─────────────────────────────────────────────────────
export { ThemeToggle } from "./theme-toggle";

// ─── Toast notifications ─────────────────────────────────────────────────────
export type { ToastType, Toast } from "./toast";
export { ToastContainer, useToast } from "./toast";

// ─── Tour provider ────────────────────────────────────────────────────────────
export { default as TourProvider } from "./tour-provider";

// ─── Transaction history table ────────────────────────────────────────────────
export { default as TransactionHistory } from "./transaction-history";

// ─── Wallet modal ─────────────────────────────────────────────────────────────
export { default as WalletModal } from "./wallet-modal";

// ─── Wallet permissions panel ────────────────────────────────────────────────
export { WalletPermissionsPanel } from "./wallet-permissions-panel";

// ─── Wallet provider and hook ─────────────────────────────────────────────────
export { WalletProvider, useWallet } from "./wallet-provider";
