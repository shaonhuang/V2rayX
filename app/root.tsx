import { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { LinksFunction } from 'react-router';
import { invoke } from '@tauri-apps/api/core';
import { HeroUIProvider } from '@heroui/react';
import NiceModal from '@ebay/nice-modal-react';
import '~/designs/styles/index.css';
import { Toaster } from 'react-hot-toast';
import { I18nextProvider } from 'react-i18next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import * as Sentry from '@sentry/react';

import i18n from './translations/i18n';
import {
  initAxiomClient,
  initSentry,
  setupErrorHandlers,
  startDailySummaryTask,
  sendEvent,
} from './utils/telemetry';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

// export function HydrateFallback() {
//   return (
//     <html lang="en">
//       <head>
//         <meta charSet="utf-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1" />
//         <Meta />
//         <Links />
//       </head>
//       <body>
//         <p>Loading...</p>
//         <Scripts />
//       </body>
//     </html>
//   );
// }

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const userId = localStorage.getItem('userID') || undefined;
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    // Also send to Axiom
    sendEvent('error', userId, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      componentStack: errorInfo.componentStack,
    }).catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>An error occurred. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize telemetry SDKs
    initSentry();
    initAxiomClient();

    const userId = localStorage.getItem('userID') || undefined;

    // Set up error handlers
    setupErrorHandlers(userId);

    // Start daily summary task
    startDailySummaryTask(userId);

    // Send app started event
    sendEvent('app_started', userId).catch(console.error);

    // Close splashscreen when main app is ready
    if (typeof window !== 'undefined') {
      invoke('close_splashscreen', {
        userId: userId ?? '',
      })
        .then(() => {
          console.log('Splash screen closed successfully.');
        })
        .catch((error) => {
          console.error('Failed to close splash screen:', error);
        });
    }

    // Set up titlebar drag functionality
    const appWindow = getCurrentWindow();
    const titlebar = document.getElementById('titlebar');
    if (titlebar) {
      titlebar.addEventListener('mousedown', (e) => {
        if (e.buttons === 1) {
          // Primary (left) button
          e.detail === 2
            ? appWindow.toggleMaximize() // Maximize on double click
            : appWindow.startDragging(); // Else start dragging
        }
      });
    }

    // Cleanup event listener on unmount
    return () => {
      if (titlebar) {
        titlebar.removeEventListener('mousedown', () => {});
      }
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ErrorBoundary>
          <I18nextProvider i18n={i18n}>
            <HeroUIProvider>
              <Toaster
                reverseOrder={false}
                position="top-right"
                toastOptions={{
                  className: 'dark:bg-[#121212] dark:text-white',
                }}
              />
              <NiceModal.Provider>
                <div id="font-wrapper">
                  <div id="titlebar" className="titlebar"></div>
                  {children}
                </div>
              </NiceModal.Provider>
              <ScrollRestoration />
              <Scripts />
            </HeroUIProvider>
          </I18nextProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
