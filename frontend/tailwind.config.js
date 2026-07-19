/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tangerine: {
          50: "#FFF8F2",
          100: "#FFF0E5",
          200: "#FFD9B3",
          300: "#FFB980",
          400: "#FF9D55",
          500: "#FF8C42",
          600: "#E67A2E",
          700: "#BF5F1F",
          800: "#80401A",
          900: "#4D2612",
        },
        cocoa: {
          100: "#F5EEE8",
          300: "#C4A88C",
          500: "#8C6E52",
          700: "#5C4532",
          900: "#3D2C1E",
        },
        cream: "#FFFAF5",
        flame: "#FF6B35",
        lime: "#7CB342",
      },
      fontFamily: {
        sans: ["Quicksand", "Nunito", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        tangerine: "0 2px 8px rgba(230,122,46,0.10)",
        "tangerine-md": "0 4px 16px rgba(230,122,46,0.12)",
      },
    },
  },
  plugins: [],
};
