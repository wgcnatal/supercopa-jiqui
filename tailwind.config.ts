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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#065f46",
          light: "#0d9668",
          dark: "#064e3b",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        gold: {
          DEFAULT: "#d4a017",
          light: "#f0c040",
          dark: "#b8860b",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#d4a017",
          600: "#b8860b",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        surface: {
          DEFAULT: "#1a1a2e",
          light: "#252540",
          dark: "#0f0f1a",
          card: "#1e1e35",
        },
      },
    },
  },
  plugins: [],
};
export default config;
