import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Verde primário TerraSat
        green: {
          50:  "#E8F5EE",
          100: "#C6E8D5",
          200: "#90D0AE",
          300: "#7ED8A8",
          400: "#4DB882",
          500: "#2E7D52",
          600: "#1A6640",
          700: "#0F5132",
          800: "#0A3D25",
          900: "#062818",
        },
        // Âmbar — alertas
        amber: {
          50:  "#FEF9E7",
          100: "#FCF0BF",
          200: "#F9E48A",
          300: "#F4CF45",
          400: "#D4AC0D",
          500: "#B7950B",
          600: "#947A08",
          700: "#6E5A06",
          800: "#483C04",
          900: "#2E2602",
        },
        // Vermelho — risco
        red: {
          50:  "#FDEDEC",
          100: "#F9CCCB",
          200: "#F5A09E",
          300: "#EF6B69",
          400: "#E74C3C",
          500: "#C0392B",
          600: "#922B21",
          700: "#6E2019",
          800: "#4A1610",
          900: "#2C0D09",
        },
        // Neutros
        slate: {
          50:  "#F7F7F5",
          100: "#EBEBEA",
          200: "#D5D5D2",
          300: "#AEADA9",
          400: "#888782",
          500: "#66635D",
          600: "#4E4B46",
          700: "#3A3834",
          800: "#272521",
          900: "#1A1A2E",
        },
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.08em" }],
        xs:   ["12px", { lineHeight: "16px" }],
        sm:   ["13px", { lineHeight: "18px" }],
        base: ["15px", { lineHeight: "22px" }],
        lg:   ["17px", { lineHeight: "24px" }],
        xl:   ["20px", { lineHeight: "28px" }],
        "2xl":["24px", { lineHeight: "32px" }],
        "3xl":["30px", { lineHeight: "38px" }],
        "4xl":["36px", { lineHeight: "44px" }],
        "5xl":["48px", { lineHeight: "56px" }],
      },
      borderRadius: {
        sm:   "4px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl":"24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        md:   "0 4px 12px rgba(0,0,0,0.08)",
        lg:   "0 8px 24px rgba(0,0,0,0.10)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
