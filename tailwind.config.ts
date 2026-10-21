import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C1A17",
          soft: "#3A3630",
        },
        bone: "#F4EFE4",
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        line: "#E7E3DA",
        muted: {
          DEFAULT: "#6B655B",
          foreground: "#6B655B",
        },
        primary: {
          DEFAULT: "#2E7D5B",
          hover: "#276A4D",
          soft: "#E6F1EC",
        },
        warning: {
          DEFAULT: "#C98A1B",
          soft: "#FEF7EA",
        },
        danger: {
          DEFAULT: "#C0453B",
          soft: "#F7E7E5",
        },
        info: {
          DEFAULT: "#2F6FB0",
          soft: "#EBF3FB",
        },
        category: {
          barang: "#2E7D5B",
          jasa: "#1C1A17",
          transportasi: "#C9A227",
          lainnya: "#8B6FB0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        btn: "10px",
        input: "10px",
        card: "16px",
        modal: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,26,23,0.04), 0 4px 16px rgba(28,26,23,0.06)",
        modal: "0 8px 32px rgba(28,26,23,0.12), 0 2px 8px rgba(28,26,23,0.06)",
        dropdown: "0 4px 20px rgba(28,26,23,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
