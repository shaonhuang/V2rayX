import { app, ipcMain } from 'electron';
const Store = require('electron-store');

const store = new Store();

const setServer = (jsonObj: JSON) => {
  store.set('servers', store.get('servers') ?? [jsonObj]);
};

export function initStore() {
  ipcMain.on('electron-store-get', async (event, val) => {
    event.returnValue = store.get(val);
  });
  ipcMain.on('electron-store-set', async (event, key, val) => {
    store.set(key, val);
  });
  ipcMain.on('electron-store-delete', async (event, key) => {
    store.delete(key);
  });
  ipcMain.on('electron-store-set-server', async (event, val) => {
    setServer(val);
  });
  ipcMain.on('servers', async (event, type, val) => {
    switch (type) {
      case 'get':
        event.returnValue = store.get(val);
        break;
      case 'set':
        store.set(val);
        break;
    }
  });
  store.set('servers', store.get('servers') ?? []);
}
