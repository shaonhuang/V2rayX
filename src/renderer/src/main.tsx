import React from 'react';
import ReactDOM from 'react-dom/client';
import { useMemo, useState, useLayoutEffect } from 'react';
import './assets/index.css';
import App from './App';
import { Provider } from 'react-redux';
import '@renderer/assets/index.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { from } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { debounce, set, throttle } from 'lodash';
import { nightMode } from './components/Theme';

import store from '@store/index';

const originalSetItem = window.localStorage.setItem;

// temp fix for theme change
window.localStorage.setItem = function (key, value) {
  const event = new Event('itemInserted');

  event.value = value; // Optional..
  event.key = key; // Optional..

  document.dispatchEvent(event);

  originalSetItem.apply(this, arguments);
};

const Page = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [styleInJson, setStyleInJson] = useState({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#9c27b0',
      },
      success: {
        main: '#2e7d32',
      },
    },
    typography: {
      fontFamily: '',
    },
  });

  const state$ = from(store);
  const localStorageSetHandler = (e) => {
    if (e.key === 'theme') {
      setMode(e.value);
    }
  };

  useLayoutEffect(() => {
    document.addEventListener('itemInserted', localStorageSetHandler, false);
    // Subscribe to state changes using RxJS
    const subscription = state$
      .pipe(
        debounceTime(500), // Add a debounce time to avoid excessive updates
        map(() => store.getState().settingsPage.appearance.styleInJson),
      )
      .subscribe((styleInJson) => {
        try {
          const config = JSON.parse(styleInJson);
          if (store.getState().settingsPage.appearance.customStyle) {
            nightMode(config?.palette?.mode === 'dark');
          } else {
            nightMode(store.getState().settingsPage.appearance.darkMode);
            set(
              config,
              'palette.mode',
              store.getState().settingsPage.appearance.darkMode ? 'dark' : 'light',
            );
          }
          setStyleInJson(config);
        } catch (err) {
          window.notification.send({
            title: 'Change Style Error',
            body: `${styleInJson}
            is not JSON format. Please check it`,
            silent: true,
          });
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const theme: ThemeOptions = useMemo(
    throttle(() => {
      return createTheme(styleInJson);
    }, 2000),
    [mode, styleInJson],
  );
  return (
    <React.StrictMode>
      <div className="fixed h-8 w-screen" style={{ WebkitAppRegion: 'drag' }}></div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Provider store={store}>
          <App />
        </Provider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Page />);
