import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = ['toMain', 'v2ray:install'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['fromMain', 'v2ray:downloadStatus', 'v2ray:unzipStatus'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('v2rayService', {
      startService: (data: JSON) => ipcRenderer.invoke('v2ray:start', data),
      stopService: () => ipcRenderer.invoke('v2ray:stop'),
    });
    contextBridge.exposeInMainWorld('update', {
      checkForUpdate: () => ipcRenderer.invoke('update:checkForUpdate'),
      downloadUpdate: () => ipcRenderer.invoke('update:downloadUpdate'),
      quitAndInstall: () => ipcRenderer.invoke('update:quitAndInstall'),
    });
    contextBridge.exposeInMainWorld('clipboard', {
      paste: (data:string) => ipcRenderer.invoke('clipboard:paste', data),
    });
    contextBridge.exposeInMainWorld('autoLaunch', {
      change: (status: boolean) => ipcRenderer.invoke('autoLaunch:change', status),
    });
    contextBridge.exposeInMainWorld('proxyMode', {
      change: (mode: string) => ipcRenderer.invoke('proxyMode:change', mode),
    });

    contextBridge.exposeInMainWorld('electron', {
      electronAPI,
      store: {
        get(key: any) {
          return ipcRenderer.sendSync('electron-store-get', key);
        },
        set(property: any, val: any) {
          ipcRenderer.send('electron-store-set', property, val);
        },
        delete(key: string) {
          ipcRenderer.send('electron-store-delete', key);
        },
        // Other method you want to add like has(), reset(), etc.
        setServer(val: any) {
          ipcRenderer.send('electron-store-set-server', val);
        },
      },
      // Any other methods you want to expose in the window object.
      // ...
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
