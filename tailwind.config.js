/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F8FAFC",
        'surface-dark': "#F1F5F9",
        'surface-muted': "#F1F5F9",
        border: "#E2E8F0",
        primary: {
          DEFAULT: "#1e3a8a", // Deep sapphire navy
          dark: "#172554",    // Midnight navy
          light: "#eff6ff",   // Soft ice tint
          soft: "#dbeafe",    // Powder blue
          hover: "#1d4ed8",   // Electric royal blue
        },
        secondary: {
          DEFAULT: "#2563eb",
          dark: "#1d4ed8",
          light: "#eff6ff",
        },
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
        text: {
          primary: "#0f172a",
          secondary: "#475569",
          muted: "#94a3b8",
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card-hover': '0 8px 16px -4px rgba(30, 58, 138, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button-hover': '0 4px 6px -1px rgba(30, 58, 138, 0.25)',
      },
    },
  },
  plugins: [],
}
