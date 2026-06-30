import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Primitives/Input',
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const BaseInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    state?: 'default' | 'error' | 'success';
  }
> = ({ state = 'default', className = '', ...props }) => {
  const stateClasses = {
    default: 'border-[var(--border)]',
    error: 'border-[var(--error)] focus:ring-[var(--error)]/20',
    success: 'border-[var(--success)] focus:ring-[var(--success)]/20',
  };

  return (
    <input
      className={`w-full rounded-lg border bg-[var(--surface)] px-4 py-2.5 ${stateClasses[state]} text-[var(--foreground)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:outline-none disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

export const Default: Story = {
  render: () => <BaseInput placeholder="Enter value..." />,
};

export const WithValue: Story = {
  render: () => <BaseInput defaultValue="GABC...1234" />,
};

export const Error: Story = {
  render: () => <BaseInput state="error" placeholder="Error state" />,
};

export const Success: Story = {
  render: () => <BaseInput state="success" placeholder="Success state" />,
};

export const Disabled: Story = {
  render: () => <BaseInput disabled placeholder="Disabled input" />,
};

export const Password: Story = {
  render: () => <BaseInput type="password" placeholder="Password" />,
};

export const Search: Story = {
  render: () => (
    <BaseInput type="search" placeholder="Search transactions..." />
  ),
};

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: 'light' },
  },
  globals: { theme: 'light' },
  render: () => <BaseInput placeholder="Dark support input" />,
};
