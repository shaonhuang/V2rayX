import type { Config } from 'tailwindcss';

import { iconsPlugin, getIconCollections } from '@egoist/tailwindcss-icons';
import animatePlugin from 'tailwindcss-animate';
import { customIcons } from './app/designs/icons/custom-icons';
import { heroui } from '@heroui/react';

export default {
  content: [
    './app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans-serif': ['sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        ptsans: ['PTSans', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        lora: ['Lora', 'serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui(),
    iconsPlugin({
      extraProperties: {
        verticalAlign: 'middle',
      },
      collections: {
        ...getIconCollections(['feather', 'mdi']),
        custom: {
          icons: customIcons,
          height: 24,
          width: 24,
        },
      },
    }),
    animatePlugin,
  ],
} satisfies Config;
