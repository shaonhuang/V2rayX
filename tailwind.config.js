/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
module.exports = {
  content: ['./src/**/*.{html,js,tsx}', './src/*.{html,js,tsx}'],
  theme: {
    colors: {
      'blue-dark': '#05367A',
      'blue-dark-selected': '#00275C',
      'blue-light': '#EBF2FC',
      'blue-deep': '#0A2859',
      'blue-dim': '#77A7E8',
      'black-dim': '#929292',
      blue: '#1fb6ff',
      purple: '#7e5bef',
      pink: '#ff49db',
      orange: '#ff7849',
      green: '#13ce66',
      yellow: '#ffc82c',
      'gray-dark': '#273444',
      gray: '#8492a6',
      'gray-light': '#d3dce6',
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
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
