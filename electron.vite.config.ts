import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    // ssr: {
    //   noExternal: true,
    // },
    plugins: [
      externalizeDepsPlugin({
        exclude: ['electron-updater', 'lodash'],
      }),
    ],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@resources': resolve('resources'),
        '@lib': resolve('src/main/lib'),
        '@services': resolve('src/main/services'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@store': resolve('src/renderer/src/store'),
      },
    },
    plugins: [react()],
  },
});
