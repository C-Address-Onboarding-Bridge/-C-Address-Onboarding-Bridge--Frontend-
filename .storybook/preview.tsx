import type { Preview } from "@storybook/nextjs";
import { ThemeProvider } from "@/components/theme-provider";

const applyThemeClass = (theme: string) => {
  try {
    const root = document.documentElement;
    root.classList.remove("dark-theme", "light-theme");
    root.classList.add(`${theme}-theme`);
  } catch {
    // noop in non-browser envs
  }
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    docs: {
      toc: true,
    },
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "region", enabled: true },
        ],
      },
    },
    backgrounds: {
      default: "dark",
      options: {
        dark: { name: "Dark", value: "#0a0b0e" },
        light: { name: "Light", value: "#ffffff" },
        surface: { name: "Surface", value: "#141519" },
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "dark";
      applyThemeClass(theme);
      return (
        <ThemeProvider forcedTheme={theme}>
          <Story />
        </ThemeProvider>
      );
    },
  ],
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        icon: "circlehollow",
        items: ["dark", "light"],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
