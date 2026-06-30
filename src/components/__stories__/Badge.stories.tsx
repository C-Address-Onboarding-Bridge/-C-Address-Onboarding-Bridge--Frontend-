import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Primitives/Badge",
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark" },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error", "accent"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
};

export default meta;
type Story = StoryObj = {};

const Badge: React.FC<{ children: React.ReactNode; variant?: "default" | "success" | "warning" | "error" | "accent"; size?: "sm" | "md" }> = ({
  variant = "default",
  size = "md",
  children,
}) => {
  const variantClasses = {
    default: "bg-[var(--surface-2)] text-[var(--text-muted)]",
    success: "bg-[var(--success)]/10 text-[var(--success)]",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
    error: "bg-[var(--error)]/10 text-[var(--error)]",
    accent: "bg-[var(--accent)]/10 text-[var(--accent)]",
  };
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-md ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

export const Default: Story = {
  render: () => <Badge>Default</Badge>,
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="accent">Accent</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="success">Confirmed</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="error">Failed</Badge>
      <Badge variant="accent">In Progress</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="success" size="sm">Small Success</Badge>
      <Badge variant="success" size="md">Medium Success</Badge>
      <Badge variant="warning" size="sm">Small Warning</Badge>
      <Badge variant="warning" size="md">Medium Warning</Badge>
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: "light" },
  },
  globals: { theme: "light" },
  render: () => <Badge variant="success">Light Theme Badge</Badge>,
};
