// env.d.ts
interface ImportMetaEnv {
  readonly VITE_V2RAY_CORE_VERSION: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_UPDATER_ACTIVE: string;
  // Axiom Configuration
  readonly VITE_AXIOM_API_TOKEN?: string;
  readonly VITE_AXIOM_DATASET?: string;
  readonly VITE_AXIOM_ORG_ID?: string;
  // Add more environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
