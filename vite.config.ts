import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import { flatRoutes } from 'remix-flat-routes';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from 'tailwindcss';

declare module '@remix-run/node' {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      ssr: false,
      ignoredRouteFiles: ['**/*'],
      routes: async (defineRoutes) => {
        return flatRoutes('routes', defineRoutes);
      },
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
