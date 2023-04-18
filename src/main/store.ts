import { app, ipcMain } from 'electron';

const Store = require('electron-store');

const store = new Store();

export function initStore() {
  ipcMain.on('electron-store-get', async (event, val) => {
    event.returnValue = store.get(val);
  });
  ipcMain.on('electron-store-set', async (event, key, val) => {
    store.set(key, val);
  });
  ipcMain.on('store-add-server', async (event, val) => {
    store.set('serverItem', val);
  });
  store.set('unicorn', '🦄');
  console.log(store.get('unicorn'), app.getPath('userData'));
}
