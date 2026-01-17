import { Axiom } from '@axiomhq/js';
import * as Sentry from '@sentry/react';
import CryptoJS from 'crypto-js';

// Initialize Axiom client
let axiomClient: Axiom | null = null;

export interface UsageMetrics {
  uptimeSeconds: number;
  proxyMode?: string;
  featuresUsed: string[];
  connectionAttempts: number;
  connectionSuccesses: number;
  sessionStart: number;
}

let usageMetrics: UsageMetrics = {
  uptimeSeconds: 0,
  featuresUsed: [],
  connectionAttempts: 0,
  connectionSuccesses: 0,
  sessionStart: Date.now(),
};

export function initAxiomClient(): void {
  const apiToken = import.meta.env.VITE_AXIOM_API_TOKEN;
  const orgId = import.meta.env.VITE_AXIOM_ORG_ID;

  if (!apiToken) {
    console.warn('Axiom API token not configured');
    return;
  }

  try {
    axiomClient = new Axiom({
      token: apiToken,
      orgId: orgId,
    });
    console.log('Axiom client initialized');
  } catch (error) {
    console.error('Failed to initialize Axiom client:', error);
  }
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const appVersion = import.meta.env.VITE_APP_VERSION;

  if (!dsn) {
    console.warn('Sentry DSN not configured');
    return;
  }

  try {
    Sentry.init({
      dsn: dsn,
      release: `v2rayx@${appVersion}`,
      environment: import.meta.env.MODE || 'development',
      // Basic configuration - integrations are optional
      tracesSampleRate: 0.1,
    });
    console.log('Sentry initialized');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

function hashUserId(userId: string): string {
  return CryptoJS.SHA256(userId).toString();
}

function getOS(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  return 'unknown';
}

export async function sendEvent(
  eventType: string,
  userId?: string,
  additionalData?: Record<string, unknown>,
): Promise<void> {
  if (!axiomClient) {
    console.warn('Axiom client not initialized');
    return;
  }

  const dataset = import.meta.env.VITE_AXIOM_DATASET || 'v2rayx';
  const appVersion = import.meta.env.VITE_APP_VERSION || 'unknown';

  const event: Record<string, unknown> = {
    _time: new Date().toISOString(),
    event_type: eventType,
    source: 'react',
    app_version: appVersion,
    os: getOS(),
  };

  if (userId) {
    event.user_id_hash = hashUserId(userId);
  }

  // Add usage metrics (only include non-zero/defined values to match Rust implementation)
  if (usageMetrics.uptimeSeconds > 0) {
    event.uptime_seconds = usageMetrics.uptimeSeconds;
  }
  if (usageMetrics.proxyMode) {
    event.proxy_mode = usageMetrics.proxyMode;
  }
  if (usageMetrics.featuresUsed.length > 0) {
    event.features_used = usageMetrics.featuresUsed;
  }
  if (usageMetrics.connectionAttempts > 0) {
    event.connection_attempts = usageMetrics.connectionAttempts;
  }
  if (usageMetrics.connectionSuccesses > 0) {
    event.connection_successes = usageMetrics.connectionSuccesses;
  }

  // Merge additional data
  if (additionalData) {
    Object.assign(event, additionalData);
  }

  try {
    await axiomClient.ingest(dataset, [event]);
  } catch (error) {
    console.error('Failed to send event to Axiom:', error);
  }
}

export async function sendErrorEvent(
  error: Error,
  userId?: string,
  context?: Record<string, string>,
): Promise<void> {
  // Send to Sentry
  Sentry.captureException(error);
  if (context) {
    Sentry.setContext('error_context', context);
  }

  // Send to Axiom
  const errorData: Record<string, unknown> = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  };

  if (context) {
    errorData.context = context;
  }

  await sendEvent('error', userId, errorData);
}

export function trackFeatureUsage(feature: string): void {
  if (!usageMetrics.featuresUsed.includes(feature)) {
    usageMetrics.featuresUsed.push(feature);
  }
}

export function trackConnectionAttempt(success: boolean): void {
  usageMetrics.connectionAttempts++;
  if (success) {
    usageMetrics.connectionSuccesses++;
  }
}

export function updateProxyMode(mode: string): void {
  usageMetrics.proxyMode = mode;
}

export function updateUptime(seconds: number): void {
  usageMetrics.uptimeSeconds = seconds;
}

export async function sendDailySummary(userId?: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const summary = {
    uptime_seconds: usageMetrics.uptimeSeconds,
    proxy_mode: usageMetrics.proxyMode,
    features_used: usageMetrics.featuresUsed,
    connection_attempts: usageMetrics.connectionAttempts,
    connection_successes: usageMetrics.connectionSuccesses,
    connection_success_rate:
      usageMetrics.connectionAttempts > 0
        ? (usageMetrics.connectionSuccesses / usageMetrics.connectionAttempts) *
          100
        : 0,
    date: today,
  };

  await sendEvent('daily_summary', userId, summary);
}

// Set up daily summary task
export function startDailySummaryTask(userId?: string): void {
  // Send summary when page is about to unload
  window.addEventListener('beforeunload', () => {
    sendDailySummary(userId).catch(console.error);
  });

  // Also send summary every 24 hours
  setInterval(
    () => {
      sendDailySummary(userId).catch(console.error);
    },
    24 * 60 * 60 * 1000,
  );
}

// Set up global error handlers
export function setupErrorHandlers(userId?: string): void {
  // React Error Boundary will handle component errors
  // This handles unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
    sendErrorEvent(error, userId, {
      type: 'unhandled_rejection',
    }).catch(console.error);
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message || 'Unknown error');
    sendErrorEvent(error, userId, {
      type: 'window_error',
      filename: event.filename || 'unknown',
      lineno: String(event.lineno || 'unknown'),
      colno: String(event.colno || 'unknown'),
    }).catch(console.error);
  });
}
