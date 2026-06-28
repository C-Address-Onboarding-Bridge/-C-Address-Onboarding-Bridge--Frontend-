"use client";

import type { Meta, StoryObj } from "@storybook/react";
import Error from "@/app/error";

const meta: Meta<typeof Error> = {
  title: "Pages/Error",
  component: Error,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Error>;

const SampleError = new Error("Failed to fetch transaction data");

export const Default: Story = {
  args: {
    error: SampleError,
    reset: () => {},
  },
};

export const WithDigest: Story = {
  args: {
    error: { ...SampleError, digest: "1234567890" },
    reset: () => {},
  },
};

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: "light" },
  },
  globals: { theme: "light" },
  args: {
    error: SampleError,
    reset: () => {},
  },
};
