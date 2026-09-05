/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: "#FFF8F3",
          dark: "#1A1412",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#231E1A",
        },
        muted: {
          DEFAULT: "#FFF0E6",
          dark: "#2E2722",
        },
        border: {
          DEFAULT: "#F0DDD0",
          dark: "#3A322C",
        },
        text: {
          primary: "#2D2016",
          secondary: "#8F7C6E",
          darkPrimary: "#FFFFFF",
          darkSecondary: "#D8CDC5",
        },
        accent: {
          DEFAULT: "#E8784A",
          secondary: "#D4805C",
          glow: "#F0DDD0",
          dark: "#FFA278",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(45, 32, 22, 0.04), 0 1px 2px -1px rgba(45, 32, 22, 0.04)",
        cardHover: "0 10px 25px -5px rgba(232, 120, 74, 0.1), 0 4px 10px -2px rgba(45, 32, 22, 0.04)",
        glass: "0 4px 30px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        glassDark: "0 4px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        glassHover: "0 8px 40px rgba(232, 120, 74, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};