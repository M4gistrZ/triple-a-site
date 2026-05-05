import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#141414",
        "surface-elevated": "#1a1a1a",
        border: "#262626",
        accent: "#3b82f6",
        "accent-hover": "#2563eb",
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        muted: "#737373",
      },
    },
  },
  plugins: [],
};

export default config;
