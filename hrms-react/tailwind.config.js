/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      'sm':  { min: '640px' },
      'md':  { min: '768px' },
      'lg':  { min: '1024px' },
      'xl':  { min: '1280px' },
      '2xl': { min: '1536px' },
    },
    extend: {
      colors: {
        brand: '#1B3A6B',
        accent: '#2E6BE6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
