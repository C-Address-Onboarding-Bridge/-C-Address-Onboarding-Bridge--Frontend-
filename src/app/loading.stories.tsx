import type { Meta, StoryObj } from "@storybook/react";
import Loading from "@/app/loading";

const meta: Meta<typeof Loading> = {
  title: "Pages/Loading",
  component: Loading,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = {};

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: "light" },
  },
  globals: { theme: "light" },
};
