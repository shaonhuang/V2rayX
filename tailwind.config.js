/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/**/**/**/*.{html,js,tsx}',
    './src/**/**/**/*.{html,js,tsx}',
    './src/**/**/*.{html,js,tsx}',
    './src/**/*.{html,js,tsx}',
    './src/*.{html,js,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      colors: {
        'blue-dark': '#05367A',
        'blue-dark-selected': '#00275C',
        'blue-light': '#EBF2FC',
        'blue-deep': '#0A2859',
        'blue-dim': '#77A7E8',
        'black-dim': '#929292',
        'gray-dark': '#273444',
        'gray-light': '#d3dce6',
      },
      spacing: {
        128: '32rem',
        144: '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
