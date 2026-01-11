import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    // Call this at the end of the hook
  },
} satisfies Config;
