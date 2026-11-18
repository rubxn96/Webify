/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#10E575",
          "primary-light": "#6FFF9A",
          glow: "rgba(16, 229, 117, 0.22)",
          secondary: "#1DB954",
          "secondary-dim": "#53E076",
          tertiary: "#22C55E",
          "tertiary-dim": "#4AE176",
        },
        surface: {
          canvas: "#0A0A0A",
          base: "#131313",
          card: "#121212",
          cardElevated: "#1C1B1B",
          pod: "#181818",
          modal: "#2A2A2A",
          bright: "#393939",
        },
        content: {
          primary: "#E5E2E1",
          secondary: "#BACBB9",
          muted: "#859585",
          disabled: "#525252",
        },
        obsidian: {
          canvas: "#0A0A0A",
          sidebar: "#131313",
          card: "#181818",
          hover: "#222222",
          border: "#262626",
          primary: "#E5E2E1",
          secondary: "#BACBB9",
          accent: {
            DEFAULT: "#10E575",
            hover: "#6FFF9A",
            light: "rgba(16, 229, 117, 0.18)",
          },
        },
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        "emerald-glow": "0 12px 32px rgba(16, 229, 117, 0.22)",
        "emerald-glow-lg": "0 14px 36px rgba(16, 229, 117, 0.35)",
        "emerald-glow-sm": "0 4px 16px rgba(16, 229, 117, 0.25)",
      },
      borderRadius: {
        pill: "9999px",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "pulse-subtle": "pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

