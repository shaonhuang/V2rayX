import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['fromMain'];
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
  console.log('process.contextIsolated', process.contextIsolated);
  try {
    contextBridge.exposeInMainWorld('api', api);

    contextBridge.exposeInMainWorld('serverFiles', {
      openFile: () => ipcRenderer.invoke('dialog:openFile'),
    });

    contextBridge.exposeInMainWorld('v2rayService', {
      startService: () => ipcRenderer.invoke('v2ray:start'),
      stopService: () => ipcRenderer.invoke('v2ray:stop'),
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
        // Other method you want to add like has(), reset(), etc.
        setServer(val: any) {
          console.log('preload setServer', val);
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
