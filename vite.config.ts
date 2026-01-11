import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  resolve: {},
  plugins: [reactRouter(), tsconfigPaths(), tailwindcss()],
  optimizeDeps: {
    // Force pre-bundle these packages at startup to prevent 504 errors when discovered at runtime
    include: [
      // --- React Core ---
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router',
      'react-hot-toast',

      // --- UI Libraries ---
      '@heroui/react',
      '@heroui/use-theme', // Found in logs
      '@heroui/switch',
      '@heroui/tooltip',
      '@heroui/select',
      '@heroui/card',
      '@heroui/alert',
      '@heroui/checkbox',
      'motion',
      '@ebay/nice-modal-react',

      // --- Utility Libraries (completing items found in logs) ---
      'i18next',
      'i18next-browser-languagedetector',
      'react-i18next',
      'lodash', // Found in logs
      'js-yaml', // Found in logs
      'crypto-js', // Found in logs
      'uuid', // Found in logs
      'js-base64', // Found in logs
      'zod',
      '@hookform/resolvers/zod',
      'react-hook-form',
      'monaco-editor',
      '@melloware/react-logviewer',
      'jsqr',

      // --- Tauri Core & Plugins (completing items found in logs) ---
      '@tauri-apps/api',
      '@tauri-apps/api/core',
      '@tauri-apps/api/window',
      '@tauri-apps/api/path',
      '@tauri-apps/plugin-sql', // This one most likely causes reloads
      '@tauri-apps/plugin-autostart', // Found in logs
      '@tauri-apps/plugin-opener', // Found in logs
      '@tauri-apps/plugin-dialog', // Found in logs
      '@tauri-apps/plugin-updater', // Found in logs
      '@tauri-apps/plugin-clipboard-manager',
      '@tauri-apps/plugin-fs',
      '@tauri-apps/plugin-shell',
      '@number-flow/react',
      '@tauri-apps/api/event',
      '@tauri-apps/plugin-os',
    ],
  },
});
