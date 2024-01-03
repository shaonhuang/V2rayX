import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import App from './App';
import { Provider } from 'react-redux';
import '@renderer/assets/index.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { from } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { set } from 'lodash';

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
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  const [styleInJson, setStyleInJson] = React.useState({
    palette: {
      mode: 'light',
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
      fontFamily: 'Source Sans Pro, sans-serif',
    },
  });
  const state$ = from(store);
  React.useLayoutEffect(() => {
    const localStorageSetHandler = (e: any) => {
      if (e.key === 'theme') {
        setMode(e.value);
      }
    };

    window.db.read('settings').then((res) => {
      res.appearance === 'dark' ? setMode('dark') : setMode('light');
    });
    document.addEventListener('itemInserted', localStorageSetHandler, false);
    // Subscribe to state changes using RxJS
    const subscription = state$
      .pipe(
        debounceTime(500), // Add a debounce time to avoid excessive updates
        map(() => store.getState().settingsPage.appearance.styleInJson),
      )
      .subscribe((styleInJson) => {
        try {
          setStyleInJson(JSON.parse(styleInJson));
        } catch (err) {}
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const theme: ThemeOptions = React.useMemo(() => {
    return createTheme(set(styleInJson, 'palette.mode', mode));
  }, [mode, styleInJson]);
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
