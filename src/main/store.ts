import { app, ipcMain } from 'electron';
import { loadJsonFileSync } from 'load-json-file';
import { homedir } from 'os';
import * as path from 'path';
import { readdirSync } from 'fs';
const _ = require('lodash');
const hash = require('object-hash');
const Store = require('electron-store');
const { webContents } = require('electron');
import { cloneDeep } from 'lodash';

const store = new Store();
const configPath = path.join(homedir(), 'v2ray-core', 'config');

const setServer = (jsonObj: JSON) => {
  const newServerHash = hash(JSON.stringify(jsonObj));
  const serversHash = store.get('serversHash');
  if (!store.get('serversHash')) {
    store.set('serversHash', []);
  }
  if (!store.get(`servers.server-${newServerHash}`)) {
    store.set({
      serversHash: [...serversHash, ...(serversHash.includes(newServerHash) ? [] : [newServerHash])],
      servers: {
        ...(store.get('servers') ?? {}),
        [`server-${newServerHash}`]: jsonObj,
      },
    });
  }

  store.set('newServerHash', newServerHash);
  // store.set('serversHash', []);
  // store.set('servers', {});
};

const loadJsonList = (folder: string) => {
  const serversHash: Array<string> = [];
  const hashCheckList: Array<string> = [];
  const servers: Object = {};
  readdirSync(folder).forEach((file) => {
    const jsonObj: any = loadJsonFileSync(path.join(configPath, file)) ?? {};
    serversHash.push(file.replace('.json', ''));
    hashCheckList.push(hash(jsonObj));
    servers[file.replace('.json', '')] = jsonObj;
  });
  store.set('serversHash', serversHash);
  store.set('hashCheckList', hashCheckList);
  store.set('servers', servers);
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
  store.set('unicorn', '🦄');
  loadJsonList(configPath);
}
