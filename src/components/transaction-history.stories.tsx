import type { Meta, StoryObj } from "@storybook/react";
import TransactionHistory from "@/components/transaction-history";
import type { BridgeTransaction } from "@/lib/types";

const mockTransactions: BridgeTransaction[] = [
  {
    id: "1",
    type: "g-to-c",
    asset: "XLM",
    amount: "100.00",
    status: "confirmed",
    timestamp: "2026-06-25T12:00:00Z",
    fromAddress: "GABC...1234",
    toAddress: "CABC...5678",
    hash: "abc123def456",
    network: "TESTNET",
  },
  {
    id: "2",
    type: "fiat",
    asset: "USDC",
    amount: "50.00",
    status: "pending",
    timestamp: "2026-06-26T10:00:00Z",
    fromAddress: "GDEF...9012",
    toAddress: "CDEF...3456",
    hash: "",
    network: "TESTNET",
  },
  {
    id: "3",
    type: "cex",
    asset: "XLM",
    amount: "200.00",
    status: "failed",
    timestamp: "2026-06-24T08:00:00Z",
    fromAddress: "GHIJ...7890",
    toAddress: "CIJK...1234",
    hash: "xyz789ghi012",
    network: "TESTNET",
  },
];

const meta: Meta<typeof TransactionHistory> = {
  title: "Transactions/TransactionHistory",
  component: TransactionHistory,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    network: {
      control: "select",
      options: ["PUBLIC", "TESTNET"],
    },
    loading: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TransactionHistory>;

export const Default: Story = {
  args: {
    transactions: mockTransactions,
    loading: false,
    network: "TESTNET",
  },
};

export const Loading: Story = {
  args: {
    transactions: [],
    loading: true,
    network: "TESTNET",
  },
};

export const EmptyState: Story = {
  args: {
    transactions: [],
    loading: false,
    network: "TESTNET",
  },
};

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: "light" },
  },
  globals: { theme: "light" },
  args: {
    transactions: mockTransactions,
    loading: false,
    network: "TESTNET",
  },
};
