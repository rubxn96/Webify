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
        obsidian: {
          canvas: "#0A0A0C",
          sidebar: "#121216",
          card: "#1A1A22",
          hover: "#24242F",
          border: "#22222E",
          primary: "#F4F4F6",
          secondary: "#8E8E9E",
          accent: {
            DEFAULT: "#E11D48",
            hover: "#BE123C",
            light: "rgba(225, 29, 72, 0.15)",
          },
        },
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
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
