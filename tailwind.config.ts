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
        // SubText exact color palette
        background: "#1a1a1a",
        foreground: "#ffffff",
        card: "#2a2a2a",
        "card-dark": "#1f1f1f",
        accent: "#FF6B6B", // Primary red accent
        "accent-dark": "#cc5555",
        "accent-light": "#ff8888",
        border: "#3a3a3a",
        muted: "#666666",
        "muted-foreground": "#999999",
        success: "#4CAF50",
        warning: "#FFC107",
        error: "#f44336",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 107, 107, 0.3)",
        "glow-strong": "0 0 30px rgba(255, 107, 107, 0.5)",
        card: "0 4px 6px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        glitch: "glitch 0.3s ease-in-out",
        scan: "scan 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fadeIn: "fadeIn 0.5s ease-in",
        slideUp: "slideUp 0.5s ease-out",
        typewriter: "typewriter 2s steps(40) 1s 1 normal both",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-5px)" },
          "40%": { transform: "translateX(5px)" },
          "60%": { transform: "translateX(-5px)" },
          "80%": { transform: "translateX(5px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
