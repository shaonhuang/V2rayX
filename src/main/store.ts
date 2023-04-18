import { app, ipcMain } from 'electron';
import { loadJsonFileSync } from 'load-json-file';
import { homedir } from 'os';
import * as path from 'path';
import { readdirSync } from 'fs';
const md5 = require('md5');
const Store = require('electron-store');
const { webContents } = require('electron');
import { cloneDeep } from 'lodash';

const store = new Store();
const configPath = path.join(homedir(), 'v2ray-core', 'config');

const setServer = (jsonObj: JSON) => {
  const newServerHash = md5(JSON.stringify(jsonObj));
  if (!store.get(`servers.${newServerHash}`)) {
    console.log('store.set');
    store.set({
      serversHash: [...(store.get('serversHash') ?? []), newServerHash],
      servers: {
        ...(store.get('servers') ?? {}),
        [newServerHash]: jsonObj,
      },
    });
  }
  console.log(store.get('serversHash'), JSON.stringify(store.get('servers')));
};

const loadJsonList = (folder: string) => {
  readdirSync(folder).forEach((file) => {
    console.log(file);
    const jsonObj: any = loadJsonFileSync(configPath + `/${file}`) ?? {};
    setServer(jsonObj);
  });
};

export function initStore() {
  ipcMain.on('electron-store-get', async (event, val) => {
    event.returnValue = store.get(val);
  });
  ipcMain.on('electron-store-set', async (event, key, val) => {
    store.set(key, val);
  });
  ipcMain.on('electron-store-set-server', async (event, val) => {
    console.log(val, 'electron-store-set-server');
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
  store.set('unicorn', '🦄');
  console.log(store.get('unicorn'), app.getPath('userData'));
  // console.log(loadJsonFileSync(configPath + '/test.json'));
  console.log(configPath);
  loadJsonList(configPath);
}
