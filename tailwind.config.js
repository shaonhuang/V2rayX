/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
module.exports = {
  content: ['./src/**/*.{html,js,tsx}', './src/*.{html,js,tsx}'],
  theme: {
    extend: {},
    colors: {
      'blue-dark': '#05367A',
      'blue-dark-selected': '#00275C',
      'blue-light': '#EBF2FC',
      'blue-deep': '#0A2859',
      'blue-dim': '#77A7E8',
    },
  },
  plugins: [],
};
