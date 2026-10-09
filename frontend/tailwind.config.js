/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#b22b2f', // DIT Signature Crimson Red
          600: '#991b1b', // DIT Royal Maroon
          700: '#7f1d1d', // DIT Deep Wine Maroon
          800: '#5c1414',
          900: '#450a0a',
        },
        dit: {
          maroon: '#b22b2f',
          darkmaroon: '#7a0c0c',
          gold: '#d1a550',
          goldlight: '#fef3c7',
          navy: '#0f172a',
          card: '#ffffff',
          bg: '#fcfbfa',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d1a550', // DIT Gold Accent
          600: '#b48a38',
          700: '#8f6c25',
          800: '#71541c',
          900: '#533c13',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        'hover': '0 20px 30px -10px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
