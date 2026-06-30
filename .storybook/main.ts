import type { StorybookConfig } from "@storybook/nextjs";
import path from "path";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  stories: [
    "../src/app/**/*.stories.@(ts|tsx)",
    "../src/components/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
    "@storybook/addon-interactions",
  ],
  staticDirs: ["../public"],
  typescript: {
    check: false,
  },
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...(config.resolve?.alias ?? {}),
      "@/*": path.resolve(__dirname, "../src/*"),
      "next/navigation": path.resolve(__dirname, "../src/__mocks__/next/navigation.ts"),
      "next/router": path.resolve(__dirname, "../src/__mocks__/next/router.ts"),
      "next/font": path.resolve(__dirname, "../src/__mocks__/next/font.ts"),
      "@/components/wallet-provider": path.resolve(__dirname, "../src/__mocks__/wallet-provider.tsx"),
      "@/hooks/use-keyboard-shortcuts": path.resolve(__dirname, "../src/__mocks__/hooks/use-keyboard-shortcuts.ts"),
    };
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default config;
