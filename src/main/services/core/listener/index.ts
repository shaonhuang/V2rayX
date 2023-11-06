import logger from '@lib/logs';
import db from '@lib/lowdb';
import { VmessObjConfiguration } from '@lib/constant/types';
import { IpcMainEvent, app, clipboard, ipcMain, nativeTheme } from 'electron';
import emitter from '@lib/event-emitter';

import { autoUpdater } from 'electron-updater';
import { validatedIpcMain } from '@lib/bridge';

import ProxyService from '@main/services/core/proxy';
import V2rayService from '@main/services/core/v2ray';

const registerChannels = [
  {
    channel: 'update:checkForUpdate',
    listener: () => autoUpdater.checkForUpdatesAndNotify(),
  },
  {
    channel: 'update:downloadUpdate',
    listener: () => autoUpdater.downloadUpdate(),
  },
  {
    channel: 'update:quitAndInstall',
    listener: () => autoUpdater.quitAndInstall(),
  },
  {
    channel: 'app:quit',
    listener: () => app.quit(),
  },
  {
    channel: 'clipboard:read',
    listener: () => clipboard.readText(),
  },
  {
    channel: 'clipboard:paste',
    listener: (_: IpcMainEvent, data) => clipboard.writeText(data),
  },
  {
    channel: 'db:read',
    listener: async (_: IpcMainEvent, key) => {
      await db.read();
      const value = db.chain.get(key).value();
      return value;
    },
  },
  {
    channel: 'db:write',
    listener: async (_: IpcMainEvent, key, data) => {
      try {
        db.data[key] = data;
        return await db.write();
      } catch (error) {
        logger.error(error);
      }
    },
  },
  {
    channel: 'autoLaunch:change',
    listener: (_: IpcMainEvent, status: boolean) => {
      try {
        app.setLoginItemSettings({ openAtLogin: status });
        logger.info(`successfully setLoginItemSettings to ${status}`);
      } catch (e) {
        logger.error(`fail to setLoginItemSettings to ${status}`);
      }
    },
  },
];

validatedIpcMain.on('v2rayx:appearance:system', (event) => {
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  event.reply('appearance:system:fromMain', isDarkMode ? 'dark' : 'light');
});

validatedIpcMain.on('v2rayx:service:selected', (_) => emitter.emit('tray-v2ray:update', false));

validatedIpcMain.on('v2rayx:service:empty', (_) => emitter.emit('tray-v2ray:update', false));

validatedIpcMain.on('v2rayx:restart-app', () => {
  app.relaunch();
  app.quit();
});

const mountChannels = (channels: any[]) => {
  channels.forEach(({ channel, listener }) => {
    validatedIpcMain.handle(`v2rayx:${channel}`, listener);
  });
};
export const mountListeners = () => {
  mountChannels(registerChannels);
  ipcMain.handle('v2rayx:v2ray:start', (_, data: VmessObjConfiguration) => {
    const service = new V2rayService(process.platform);
    service.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    const proxy = new ProxyService();
    proxy.updatePort(httpPort, socksPort);
    proxy.stop();
    proxy.start();
    emitter.emit('tray-v2ray:update', true);
  });
  ipcMain.handle('v2rayx:v2ray:stop', () => {
    const service = new V2rayService(process.platform);
    service.stop();
    emitter.emit('tray-v2ray:update', false);
  });
  ipcMain.handle('v2rayx:v2ray:check', () => {
    const service = new V2rayService(process.platform);
    emitter.emit('tray-v2ray:update', service?.check() ?? false);
    return service?.check();
  });
  ipcMain.handle('get-logs-path', () => {
    return app.getPath('logs');
  });
  emitter.on('v2ray:stop', () => {
    const service = new V2rayService(process.platform);

    service?.stop();
    emitter.emit('v2ray:status', service?.check() ?? false);
    emitter.emit('tray-v2ray:update', false);
  });
  emitter.on('v2ray:start', (data) => {
    const service = new V2rayService(process.platform);
    service?.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    const proxy = new ProxyService();
    proxy.updatePort(httpPort, socksPort);
    proxy.stop();
    proxy.start();
    emitter.emit('tray-v2ray:update', true);
  });
};
