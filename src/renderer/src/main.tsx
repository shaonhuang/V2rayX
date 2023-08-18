import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import App from './App';
import { Provider } from 'react-redux';
import '@renderer/assets/index.css';
import store from '@store/index';
import InstallDialog from '@renderer/components/Install';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <InstallDialog />
    </Provider>
  </React.StrictMode>
);
