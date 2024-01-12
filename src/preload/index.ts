import { electronAPI } from '@electron-toolkit/preload';
import {
  contextBridge,
  ipcRenderer,
  shell,
  Notification,
  BrowserWindowConstructorOptions,
} from 'electron';
import hash from 'object-hash';

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
      'v2rayx:appearance:system',
      'v2rayx:settings:getDefaultLogDir',
      'v2rayx:settings:setAppLogsDir',
      'logs:get',
      'logs:getAll',
      'logs:getAllError',
      'v2rayx:service:empty',
      'v2rayx:service:selected',
      'v2rayx:restart-app',
      'v2rayx:checkForUpdateClick',
      'v2rayx:server:add/edit:toMain',
      'v2rayx:server:subscription:update:toMain',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'fromMain',
      'appearance:system:fromMain',
      'settings:getDefaultLogDir:fromMain',
      'proxyMode:change',
      'logs:get',
      'v2ray:status',
      'v2rayx:server:add/edit:fromMain',
      'v2rayx:server:subscription:update:fromMain',
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
      read: async (key: string) => ipcRenderer.invoke('v2rayx:db:read', key),
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
      writeImage: (data: string) => ipcRenderer.invoke('v2rayx:clipboard:writeImage', data),
    },
    win: {
      create: (suffix: string, winConfig: BrowserWindowConstructorOptions, customConfig: any) =>
        ipcRenderer.invoke('v2rayx:window:create', suffix, winConfig, customConfig),
      close: (suffix: string) => ipcRenderer.invoke('v2rayx:window:close', suffix),
    },
    net: {
      request: async (url: string, options?: any) =>
        await ipcRenderer.invoke('v2rayx:net:request', url, options),
      tcpPing: async (params: { host: string; port: number }) =>
        await ipcRenderer.invoke('v2rayx:net:tcpPing', { host: params.host, port: params.port }),
    },
    app: {
      getQRcodeFromScreenResources: async () => await ipcRenderer.invoke('v2rayx:screen:qrCode'),
    },
    quit: () => ipcRenderer.invoke('v2rayx:app:quit'),
    notification: {
      send: async (params: { title: string; body: string; silent: boolean }) =>
        ipcRenderer.invoke('v2rayx:notification:send', params),
    },
    mainConst: {
      get: (key: string) => ipcRenderer.invoke('v2rayx:mainConst:get', key),
    },
    writeToFile: {
      write: (params: { path: string; content: string }) =>
        ipcRenderer.invoke('v2rayx:writeToFile:write', {
          path: params.path,
          content: params.content,
        }),
    },
  };

  try {
    contextBridge.exposeInMainWorld('api', customApi);
    contextBridge.exposeInMainWorld('v2rayService', {
      startService: (data?: any) => ipcRenderer.invoke('v2rayx:v2ray:start', data ?? undefined),
      stopService: () => ipcRenderer.invoke('v2rayx:v2ray:stop'),
      checkService: () => ipcRenderer.invoke('v2rayx:v2ray:check'),
      updatePort: () => ipcRenderer.invoke('v2rayx:v2ray:port:update'),
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
