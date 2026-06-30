import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Primitives/Card",
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark" },
  },
  argTypes: {
    hoverable: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj = {};

const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }> = ({
  hoverable = false,
  className = "",
  children,
  ...props
}) => (
  <div
    className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] card-hover ${hoverable ? "card-hover" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const Default: Story = {
  render: () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Card Title</h3>
      <p className="text-sm text-[var(--text-muted)]">This is a basic card with body content. Cards are used throughout the app to group related information.</p>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <div className="p-6 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Fund Your C-Address</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">Choose your funding source</p>
      </div>
      <div className="p-6">
        <p className="text-sm text-[var(--text-muted)]">0x1a2b3c4d...5e6f</p>
      </div>
    </Card>
  ),
};

export const Hoverable: Story = {
  render: () => (
    <Card className="p-6 card-hover" style={{ transition: "all 0.2s ease" }}>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Hoverable Card</h3>
      <p className="text-sm text-[var(--text-muted)]">Hover over this card to see the elevated shadow effect.</p>
    </Card>
  ),
};

export const SurfaceVariant: Story = {
  render: () => (
    <Card className="p-6 bg-[var(--surface-2)]">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Surface 2 Card</h3>
      <p className="text-sm text-[var(--text-muted)]">Card using the secondary surface color.</p>
    </Card>
  ),
};

export const WithGradientBorder: Story = {
  render: () => (
    <div className="gradient-border rounded-xl">
      <div className="p-6 bg-[var(--surface)] rounded-xl">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Gradient Border Card</h3>
        <p className="text-sm text-[var(--text-muted)]">Card with a gradient border using the primary/secondary theme colors.</p>
      </div>
    </div>
  ),
};

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: "light" },
  },
  globals: { theme: "light" },
  render: () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Light Card</h3>
      <p className="text-sm text-[var(--text-muted)]">Card displayed with the light theme active.</p>
    </Card>
  ),
};
