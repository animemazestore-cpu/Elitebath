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
        surface: "#F8FAF9",
        'surface-dark': "#F1F5F2",
        'surface-muted': "#F1F5F2",
        border: "#E2E8E4",
        primary: {
          DEFAULT: "#166534",
          dark: "#14532D",
          light: "#DCFCE7",
          soft: "#DCFCE7",
          hover: "#14532D",
        },
        secondary: {
          DEFAULT: "#4D7C5A",
          dark: "#3B6245",
          light: "#E8F0EA",
        },
        success: "#15803D",
        warning: "#D97706",
        danger: "#DC2626",
        text: {
          primary: "#17211B",
          secondary: "#647067",
          muted: "#94A19A",
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(23, 33, 27, 0.06), 0 1px 2px 0 rgba(23, 33, 27, 0.04)',
        'card-hover': '0 8px 16px -4px rgba(22, 101, 52, 0.1), 0 2px 6px -1px rgba(23, 33, 27, 0.04)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button-hover': '0 4px 6px -1px rgba(22, 101, 52, 0.25)',
      },
    },
  },
  plugins: [],
}
