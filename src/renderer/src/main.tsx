import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import App from './App';
import { Provider } from 'react-redux';
import '@renderer/assets/index.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import store from '@store/index';
import InstallDialog from '@renderer/components/Install';
import { isMac } from '@renderer/constant';

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
  }, []);
  const theme: ThemeOptions = React.useMemo(
    () =>
      createTheme(
        isMac
          ? {
              palette: {
                mode: 'dark',
                primary: {
                  main: '#ffffff',
                },
                secondary: {
                  main: '#616161',
                },
                background: {
                  default: 'rgba(18,18,18,0.1)',
                  paper: 'rgba(18,18,18,0.1)',
                },
                success: {
                  main: '#2e7d32',
                },
              },
              typography: {
                // fontFamily: 'Droid Serif',
              },
            }
          : {
              palette: {
                mode,
                primary: {
                  main: '#1976d2',
                },
                secondary: {
                  main: '#9c27b0',
                },
                success: {
                  main: '#2e7d32',
                },
              },
            },
      ),
    [mode],
  );
  return (
    <React.StrictMode>
      <div className="fixed h-8 w-screen" style={{ WebkitAppRegion: 'drag' }}></div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Provider store={store}>
          <App />
          <InstallDialog />
        </Provider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Page />);
