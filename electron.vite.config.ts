import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['load-json-file', 'lowdb'] })],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@resources': resolve('resources'),
        '@lib': resolve('src/main/lib'),
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
