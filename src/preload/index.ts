import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer, shell } from 'electron';
const hash = require('object-hash');

// FIXME: fix this
// @ts-ignore
electronAPI.shell = shell;
// FIXME: fix this
// @ts-ignore
electronAPI.hash = hash;

// Custom APIs for renderer
const customApi = {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = [
      'toMain',
      'v2ray:install',
      'v2rayx:appearance:system',
      'logs:get',
      'v2rayx:service:empty',
      'v2rayx:service:selected',
      'v2rayx:restart-app',
      'v2rayx:checkForUpdateClick',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'fromMain',
      'v2ray:downloadStatus',
      'v2ray:finishedInstall',
      'appearance:system:fromMain',
      'proxyMode:change',
      'logs:get',
      'v2ray:status',
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (_, ...args) => func(...args));
    }
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  const api = {
    db: {
      read: async (key: string, query?: Object) => ipcRenderer.invoke('v2rayx:db:read', key, query),
      write: async (key: string, data: JSON) => ipcRenderer.invoke('v2rayx:db:write', key, data),
    },
    autoLaunch: {
      change: (status: boolean) => ipcRenderer.invoke('v2rayx:autoLaunch:change', status),
    },
    update: {
      checkForUpdate: () => ipcRenderer.invoke('v2rayx:update:checkForUpdate'),
      downloadUpdate: () => ipcRenderer.invoke('v2rayx:update:downloadUpdate'),
      quitAndInstall: () => ipcRenderer.invoke('v2rayx:update:quitAndInstall'),
    },
    clipboard: {
      read: () => ipcRenderer.invoke('v2rayx:clipboard:read'),
      paste: (data: string) => ipcRenderer.invoke('v2rayx:clipboard:paste', data),
    },
    quit: () => ipcRenderer.invoke('v2rayx:app:quit'),
  };

  try {
    contextBridge.exposeInMainWorld('api', customApi);
    contextBridge.exposeInMainWorld('v2rayService', {
      startService: (data: any) => ipcRenderer.invoke('v2rayx:v2ray:start', data),
      stopService: () => ipcRenderer.invoke('v2rayx:v2ray:stop'),
      checkService: () => ipcRenderer.invoke('v2rayx:v2ray:check'),
    });

    contextBridge.exposeInMainWorld('proxyMode', {
      change: (mode: string) => ipcRenderer.invoke('v2rayx:proxyMode:change', mode),
    });

    contextBridge.exposeInMainWorld('electron', {
      electronAPI,
      // ...
    });
    Object.keys(api).forEach((key: string) => {
      contextBridge.exposeInMainWorld(key, api[key]);
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
