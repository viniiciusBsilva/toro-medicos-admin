import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marca Tôro Médicos
        primary: {
          DEFAULT: "#BA0001",
          foreground: "#FFFFFF",
          hover: "#9A0001",
        },
        // Surfaces
        background: "#F6F7F9",
        surface: "#FFFFFF",
        outline: "#E1EAEC",
        border: "#E1EAEC",
        input: "#E1EAEC",
        muted: "#F6F7F9",
        "muted-foreground": "#6B7280",
        accent: "#F6F7F9",
        "accent-foreground": "#0E1015",
        destructive: "#D92D20",
        "destructive-foreground": "#FFFFFF",
        foreground: "#0E1015",
        // Texto (cor padrão de todos os textos)
        "text-primary": "#0E1015",
        "text-secondary": "#6B7280",
        placeholder: "#9CA3AF",
        // Sidebar
        "sidebar-active-bg": "#FDF0F0",
        "sidebar-active-text": "#BA0001",
        // Estados
        success: "#12B76A",
        error: "#D92D20",
        ring: "#BA0001",
        // Chips de status
        chip: {
          "green-bg": "#E8F5E9",
          "green-text": "#388E3C",
          "amber-bg": "#FFF3E0",
          "amber-text": "#E65100",
          "red-bg": "#FFCDD2",
          "red-text": "#B71C1C",
          "teal-bg": "#CCF0EA",
          "yellow-bg": "#FFECB3",
        },
      },
      fontFamily: {
        sans: ["Poppins", "var(--font-poppins)", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
