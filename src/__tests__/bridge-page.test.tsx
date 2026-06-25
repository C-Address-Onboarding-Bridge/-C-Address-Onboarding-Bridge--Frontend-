// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";

// Shared mock wallet — tests mutate network to simulate network mismatch.
// Defaults to TESTNET/disconnected so placeholder text and balance behaviour
// stay predictable.
const mockWallet = {
  address:
    "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A",
  publicKey:
    "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A",
  network: "TESTNET" as "PUBLIC" | "TESTNET",
  isConnected: false,
  isConnecting: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock("@/components/wallet-provider", () => ({
  useWallet: () => mockWallet,
  WalletProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock stellar lib — keep real validators, mock async functions
vi.mock("@/lib/stellar", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stellar")>(
    "@/lib/stellar",
  );
  return {
    ...actual,
    bridgeViaContract: vi.fn(),
    loadAccountInfo: vi.fn(),
    buildAndSubmitChangeTrust: vi.fn(),
    getTransactionStatus: vi.fn(),
    getExplorerUrl: vi.fn().mockReturnValue("https://stellar.expert/test"),
  };
});

import {
  bridgeViaContract,
  loadAccountInfo,
  getTransactionStatus,
} from "@/lib/stellar";
import BridgePage from "@/app/bridge/page";

const G_ADDRESS =
  "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const C_ADDRESS =
  "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const MOCK_TX_HASH =
  "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

function setupAccountFound(balances = [{ asset: "XLM", amount: "100" }]) {
  vi.mocked(loadAccountInfo).mockResolvedValue({
    exists: true,
    balances,
  });
}

function setupAccountNotFound() {
  vi.mocked(loadAccountInfo).mockResolvedValue({
    exists: false,
    balances: [],
  });
}

function getFromInput(): HTMLInputElement {
  return screen.getAllByPlaceholderText(
    /GABC\.\.\.DEF or connect wallet/i,
  )[0] as HTMLInputElement;
}

function getToInput(): HTMLInputElement {
  return screen.getAllByPlaceholderText(/CABC\.\.\.DEF/i)[0] as HTMLInputElement;
}

function getAmountInput(): HTMLInputElement {
  return screen.getAllByPlaceholderText("0.00")[0] as HTMLInputElement;
}

function getReviewButton(): HTMLButtonElement {
  return screen.getAllByRole("button", {
    name: /Review Bridge Transaction/i,
  })[0] as HTMLButtonElement;
}

async function fillForm(from: string, to: string, amount: string) {
  const user = userEvent.setup();
  const fromInput = getFromInput();
  const toInput = getToInput();
  const amountInput = getAmountInput();

  await user.clear(fromInput);
  await user.type(fromInput, from);
  await user.clear(toInput);
  await user.type(toInput, to);
  await user.clear(amountInput);
  await user.type(amountInput, amount);
}

afterEach(() => {
  // Explicit DOM cleanup between tests for vitest 4 reliability
  cleanup();
  // Reset mutable wallet defaults so no state leaks between tests
  mockWallet.isConnected = false;
  mockWallet.network = "TESTNET";
});

describe("BridgePage — validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAccountFound();
  });

  it("shows error for invalid from address", async () => {
    render(<BridgePage />);

    const user = userEvent.setup();
    await user.type(getFromInput(), "invalid-address");

    expect(
      screen.getByText("Invalid Stellar address"),
    ).toBeInTheDocument();
  });

  it("shows error for invalid to address (must be C-address)", async () => {
    render(<BridgePage />);

    const user = userEvent.setup();
    await user.type(getToInput(), G_ADDRESS);

    expect(screen.getByText(/Invalid C-address/)).toBeInTheDocument();
  });

  it("disables Review button when form is empty", () => {
    render(<BridgePage />);

    expect(getReviewButton()).toBeDisabled();
  });

  it("disables Review button when only from address is filled", async () => {
    render(<BridgePage />);

    const user = userEvent.setup();
    await user.type(getFromInput(), G_ADDRESS);

    expect(getReviewButton()).toBeDisabled();
  });

  it("enables Review button when all fields are valid", async () => {
    render(<BridgePage />);

    await fillForm(G_ADDRESS, C_ADDRESS, "10");

    await waitFor(() => {
      expect(loadAccountInfo).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getReviewButton()).not.toBeDisabled();
    });
  });

  it("shows account not found error when account does not exist", async () => {
    setupAccountNotFound();

    render(<BridgePage />);

    const user = userEvent.setup();
    await user.type(getFromInput(), G_ADDRESS);

    // findByText polls with built-in timeout handling — more reliable than
    // waitFor + getByText under sequential test execution with React 19.
    const errorEl = await screen.findByText(
      (content) => content.includes("Account not found"),
      {},
      { timeout: 3000 },
    );
    expect(errorEl).toBeInTheDocument();
  });

  it("shows insufficient balance error when amount exceeds balance", async () => {
    setupAccountFound([{ asset: "XLM", amount: "5" }]);

    render(<BridgePage />);

    await fillForm(G_ADDRESS, C_ADDRESS, "100");

    expect(
      await screen.findByText(/Insufficient XLM balance/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});

describe("BridgePage — flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAccountFound();
  });

  it("navigates form → review → confirm on successful submission", async () => {
    vi.mocked(bridgeViaContract).mockResolvedValue({
      hash: MOCK_TX_HASH,
      successful: true,
    });
    vi.mocked(getTransactionStatus).mockResolvedValue("confirmed");

    render(<BridgePage />);

    await fillForm(G_ADDRESS, C_ADDRESS, "10");

    await waitFor(() => {
      expect(loadAccountInfo).toHaveBeenCalled();
    });

    const user = userEvent.setup();
    await waitFor(() => expect(getReviewButton()).not.toBeDisabled());
    await user.click(getReviewButton());

    expect(screen.getByText("Review Transaction")).toBeInTheDocument();
    expect(screen.getByText(G_ADDRESS)).toBeInTheDocument();
    expect(screen.getByText(C_ADDRESS)).toBeInTheDocument();
    expect(screen.getByText("10 XLM")).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", {
      name: /Confirm & Sign/i,
    });
    await user.click(confirmButton);

    expect(
      await screen.findByText(/Confirmed/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("returns to form when Edit is clicked on review step", async () => {
    render(<BridgePage />);

    await fillForm(G_ADDRESS, C_ADDRESS, "10");

    await waitFor(() => {
      expect(loadAccountInfo).toHaveBeenCalled();
    });

    const user = userEvent.setup();
    await waitFor(() => expect(getReviewButton()).not.toBeDisabled());
    await user.click(getReviewButton());

    expect(screen.getByText("Review Transaction")).toBeInTheDocument();

    const editButton = screen.getByRole("button", { name: "Edit" });
    await user.click(editButton);

    expect(getReviewButton()).toBeInTheDocument();
    expect(screen.queryByText("Review Transaction")).not.toBeInTheDocument();
  });
});

describe("BridgePage — error recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAccountFound();
  });

  it("shows error on review step and allows retry via Confirm & Sign", async () => {
    vi.mocked(bridgeViaContract).mockRejectedValueOnce(
      new Error("Insufficient balance"),
    );

    render(<BridgePage />);

    await fillForm(G_ADDRESS, C_ADDRESS, "10");

    await waitFor(() => {
      expect(loadAccountInfo).toHaveBeenCalled();
    });

    const user = userEvent.setup();
    await waitFor(() => expect(getReviewButton()).not.toBeDisabled());
    await user.click(getReviewButton());

    const confirmButton = screen.getByRole("button", {
      name: /Confirm & Sign/i,
    });
    await user.click(confirmButton);

    expect(
      await screen.findByText("Transaction Failed", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();

    // Set up success for retry
    vi.mocked(bridgeViaContract).mockResolvedValueOnce({
      hash: MOCK_TX_HASH,
      successful: true,
    });
    vi.mocked(getTransactionStatus).mockResolvedValue("confirmed");

    const retryConfirm = screen.getByRole("button", {
      name: /Confirm & Sign/i,
    });
    await user.click(retryConfirm);

    expect(
      await screen.findByText(/Confirmed/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});

describe("BridgePage — network mismatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Mainnet in error when wallet is on PUBLIC network", async () => {
    mockWallet.network = "PUBLIC";
    setupAccountNotFound();

    render(<BridgePage />);

    const user = userEvent.setup();
    await user.type(getFromInput(), G_ADDRESS);

    expect(
      await screen.findByText(
        (content) =>
          content.includes("Account not found on the Mainnet network"),
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
  });

  it("shows Testnet in error when wallet is on TESTNET", async () => {
    setupAccountNotFound();

    render(<BridgePage />);

    const user = userEvent.setup();
    await user.type(getFromInput(), G_ADDRESS);

    expect(
      await screen.findByText(
        (content) =>
          content.includes("Account not found on the Testnet network"),
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
  });
});
