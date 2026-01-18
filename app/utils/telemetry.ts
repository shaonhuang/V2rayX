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
    // Silently return - telemetry is optional
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

export function isInitialized(): boolean {
  return axiomClient !== null;
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

/**
 * Telemetry Module
 *
 * This module handles telemetry and analytics for the application.
 * It sends events to Axiom for analytics and Sentry for error tracking.
 *
 * Note: Device ID is managed on the Rust backend side, so we don't track it here.
 * Client IP and daily active tracking are handled in this frontend module.
 */

// Cache for daily active tracking and client IP
let lastActiveDateCache: string | null = null;
let clientIpCache: string | null = null;

/**
 * Get or fetch client IP address (cached)
 */
async function getClientIp(): Promise<string | null> {
  if (clientIpCache) {
    return clientIpCache;
  }

  try {
    // Try ipify.org first
    const response = await fetch('https://api.ipify.org', {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const ip = (await response.text()).trim();
      if (ip) {
        clientIpCache = ip;
        return ip;
      }
    }
  } catch {
    // Fallback to icanhazip.com
    try {
      const response = await fetch('https://icanhazip.com', {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const ip = (await response.text()).trim();
        if (ip) {
          clientIpCache = ip;
          return ip;
        }
      }
    } catch {
      // Silently fail - IP detection is optional
    }
  }

  return null;
}

export async function sendEvent(
  eventType: string,
  userId?: string,
  additionalData?: Record<string, unknown>,
): Promise<void> {
  // Early return if telemetry is not initialized (no warning - this is expected)
  if (!isInitialized()) {
    return;
  }

  const dataset = import.meta.env.VITE_AXIOM_DATASET || 'v2rayx';
  const appVersion = import.meta.env.VITE_APP_VERSION || 'unknown';

  // Get client IP (cached)
  const clientIp = await getClientIp();

  const event: Record<string, unknown> = {
    _time: new Date().toISOString(),
    event_type: eventType,
    source: 'react',
    app_version: appVersion,
    os: getOS(),
  };

  // Add client IP if available
  if (clientIp) {
    event.client_ip = clientIp;
  }

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
    await axiomClient!.ingest(dataset, [event]);
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
  if (!isInitialized()) {
    return;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Check if device was active today for DAU tracking
  const isDailyActive = lastActiveDateCache === today;

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
    is_daily_active: isDailyActive,
    date: today,
  };

  await sendEvent('daily_summary', userId, summary);
}

/**
 * Track daily active user (DAU) - sends an event when device is active on a new day
 */
export async function trackDailyActive(): Promise<void> {
  if (!isInitialized()) {
    return;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Check if we've already tracked activity for today
  if (lastActiveDateCache === today) {
    return; // Already tracked today
  }

  // New day - update the date and send event
  lastActiveDateCache = today;

  const dauData = {
    date: today,
    is_daily_active: true,
  };

  await sendEvent('daily_active', undefined, dauData);
}

// Set up daily summary task
export function startDailySummaryTask(userId?: string): void {
  if (!isInitialized()) {
    return;
  }

  // Send summary when page is about to unload
  window.addEventListener('beforeunload', () => {
    sendDailySummary(userId).catch(() => {
      // Silently fail on unload
    });
  });

  // Also send summary every 24 hours
  // Use a more reliable approach than setInterval for long periods
  const scheduleNext = () => {
    const now = Date.now();
    const next24h = 24 * 60 * 60 * 1000;
    const delay = next24h - (now % next24h);

    setTimeout(() => {
      sendDailySummary(userId).catch(console.error);
      scheduleNext(); // Schedule next one
    }, delay);
  };

  scheduleNext();
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
