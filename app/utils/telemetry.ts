import { Axiom } from '@axiomhq/js';
import * as Sentry from '@sentry/react';
import CryptoJS from 'crypto-js';

// Initialize Axiom client
let axiomClient: Axiom | null = null;
let locationCache: { country: string; timestamp: number } | null = null;
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

async function detectLocation(): Promise<{ country: string }> {
  // Check cache first
  if (locationCache) {
    const now = Date.now();
    if (now - locationCache.timestamp < LOCATION_CACHE_DURATION) {
      return { country: locationCache.country };
    }
  }

  try {
    // Try ipapi.co (free, no API key, supports HTTPS)
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const country = data.country_code || data.country || 'unknown';

      // Cache the result
      locationCache = {
        country,
        timestamp: Date.now(),
      };

      return { country };
    }
  } catch (error) {
    console.warn(
      'Failed to detect location with ipapi.co, trying fallback:',
      error,
    );

    // Fallback to ip-api.com with HTTPS
    try {
      const fallbackResponse = await fetch(
        'https://ip-api.com/json/?fields=country',
        {
          signal: AbortSignal.timeout(5000),
        },
      );

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const country = data.country || 'unknown';

        // Cache the result
        locationCache = {
          country,
          timestamp: Date.now(),
        };

        return { country };
      }
    } catch (fallbackError) {
      console.warn('Fallback location detection also failed:', fallbackError);
    }
  }

  return { country: 'unknown' };
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
  const location = await detectLocation();

  const event: Record<string, unknown> = {
    _time: new Date().toISOString(),
    event_type: eventType,
    source: 'react',
    location: {
      country: location.country,
    },
    app_version: appVersion,
    os: getOS(),
    ...usageMetrics,
    ...additionalData,
  };

  if (userId) {
    event.user_id_hash = hashUserId(userId);
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
    session_duration_ms: Date.now() - usageMetrics.sessionStart,
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
