import type { Meta, StoryObj } from "@storybook/react";
import { Wallet, RefreshCw } from "lucide-react";

const meta: Meta = {
  title: "Primitives/Button",
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark" },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj = {};

const BaseButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline"; size?: "sm" | "md" | "lg" }> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50";
  const variantClasses = {
    primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90",
    secondary: "bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--border)]",
    outline: "bg-transparent border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10",
  };
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Primary: Story = {
  render: () => <BaseButton variant="primary"><Wallet className="w-4 h-4" /> Connect Wallet</BaseButton>,
};

export const Secondary: Story = {
  render: () => <BaseButton variant="secondary">Secondary</BaseButton>,
};

export const Outline: Story = {
  render: () => <BaseButton variant="outline">Outline</BaseButton>,
};

export const WithIcon: Story = {
  render: () => (
    <BaseButton variant="primary">
      <RefreshCw className="w-4 h-4" />
      Try Again
    </BaseButton>
  ),
};

export const Small: Story = {
  render: () => <BaseButton variant="primary" size="sm">Small</BaseButton>,
};

export const Large: Story = {
  render: () => <BaseButton variant="primary" size="lg">Large</BaseButton>,
};

export const Disabled: Story = {
  render: () => <BaseButton variant="primary" disabled>Disabled</BaseButton>,
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <BaseButton variant="primary">Primary</BaseButton>
      <BaseButton variant="secondary">Secondary</BaseButton>
      <BaseButton variant="outline">Outline</BaseButton>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <BaseButton variant="primary" size="sm">Small</BaseButton>
      <BaseButton variant="primary" size="md">Medium</BaseButton>
      <BaseButton variant="primary" size="lg">Large</BaseButton>
    </div>
  ),
};
