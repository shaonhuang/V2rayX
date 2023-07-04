import { app, ipcMain, clipboard } from 'electron';
import { autoUpdater } from 'electron-updater';
import { Mode } from '@main/constant/types';
import { Proxy } from '@main/utils/proxy';
import { isLinux, isMacOS } from '@main/constant';
const Store = require('electron-store');
const store = new Store();

let proxy: Proxy | null = null;
export const init = () => {
  const appVersion = app.getVersion();
  if (store.get('appVersion') !== appVersion) {
    store.set('appVersion', appVersion);
  }
  ipcMain.handle('update:checkForUpdate', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
  ipcMain.handle('update:downloadUpdate', () => {
    autoUpdater.downloadUpdate();
  });
  ipcMain.handle('update:quitAndInstall', () => {
    autoUpdater.quitAndInstall();
  });
  ipcMain.handle('quit-app', () => {
    app.quit();
  });
  ipcMain.handle('clipboard:paste', (event, data) => {
    clipboard.writeText(data);
  });
  ipcMain.handle('autoLaunch:change', (event, status) => {
    app.setLoginItemSettings({
      openAtLogin: status,
    });
  });
  // [0] is socks proxy port
  const socksPort = store.get('servers')?.[store.get('selectedServer')]?.inbounds[0].port;
  // [1] is http proxy port
  const httpPort = store.get('servers')?.[store.get('selectedServer')]?.inbounds[1].port;

  if (socksPort && httpPort) {
    const mode = (store.get('proxyMode') as Mode) ?? store.set('proxyMode', 'Manual');
    proxy = Proxy.createProxy(process.platform, isMacOS || isLinux ? socksPort : httpPort, 11111, mode);
    if (proxy) {
      proxy.start();
    }
  } else {
    store.set('proxyMode', 'Manual');
  }
  ipcMain.handle('proxyMode:change', (event, mode: Mode) => {
    const socksPort = store.get('servers')[store.get('selectedServer')]?.inbounds[0].port;
    const httpPort = store.get('servers')[store.get('selectedServer')]?.inbounds[1].port;

    if (httpPort && socksPort) {
      proxy = proxy ?? Proxy.createProxy(process.platform, isMacOS || isLinux ? socksPort : httpPort, 11111, mode);
      if (proxy) {
        if (mode === 'Manual') {
          proxy.stop();
        } else {
          proxy.switch(mode);
        }
        store.set('proxyMode', mode);
      }
    } else {
      store.set('proxyMode', 'Manual');
      proxy?.stop();
    }
  });
  return {proxyInstance: proxy};
};
