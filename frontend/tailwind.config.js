/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        mist: '#eef1f6',
        ink: { DEFAULT: '#0e1a2b', soft: '#4b5870' },
        line: '#d9dee8',
        brand: { DEFAULT: '#3d3df5', dark: '#2b2bd0', soft: '#e9e9ff' },
        heart: '#e5484d',
      },
    },
  },
  plugins: [],
};
