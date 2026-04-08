/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f1',
          100: '#ffdfdf',
          200: '#ffc5c5',
          300: '#ff9d9d',
          400: '#ff6464',
          500: '#ee0000', // Vibrant Red
          600: '#d00000',
          700: '#af0000',
          800: '#910303',
          900: '#780a0a',
          950: '#420000',
        },
        secondary: {
          50: '#ecfdf3',
          100: '#d1fae1',
          200: '#a7f3c9',
          300: '#6ee7a4',
          400: '#34d385',
          500: '#00c853', // Vibrant Green
          600: '#059654',
          700: '#047846',
          800: '#065f3a',
          900: '#064e31',
        },
        tertiary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#badffd',
          300: '#7cc2fc',
          400: '#36a2f8',
          500: '#2979ff', // Vibrant Blue
          600: '#1c5ce5',
          700: '#1648d1',
          800: '#173ba8',
          900: '#193486',
        },
      },
      boxShadow: {
        'glass-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glass-md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glass-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
