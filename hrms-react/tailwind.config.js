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
        brand:   '#0D1F4E',
        accent:  '#1A6AB4',
        teal:    '#3DC7B3',
        success: '#2DB37A',
        cloud:   '#F4F8FF',
        mist:    '#E8EDF5',
        steel:   '#A0AABF',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', "'Helvetica Neue'", 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
