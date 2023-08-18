import { IpcMainEvent, app, clipboard, BrowserWindow, nativeTheme, ipcMain } from 'electron';
import { validatedIpcMain } from '@lib/bridge';
import { autoUpdater } from 'electron-updater';
import db from '@lib/lowdb';
import { Mode } from '@lib/constant/types';
import { Proxy } from '@main/lib/proxy';
import { Service } from '@main/lib/v2ray';
import logger from '@lib/logs';
import emitter from '@lib/event-emitter';

const gotTheLock = app.requestSingleInstanceLock();
let proxy: Proxy | null = null;
let cleanUp = false;
let service: Service | null = null;

const checkForRepeatedStart = () => {
  if (!gotTheLock) {
    cleanUp = true;
    // If another instance of the app is already running, quit this instance
    app.quit();
  } else {
    // TODO: click for open window
    const mainWindow: BrowserWindow = BrowserWindow.getAllWindows()[0];
    mainWindow?.once('ready-to-show', () => {
      mainWindow.show();
    });
  }
};

const initProxyMode = async () => {
  let proxy: Proxy | null = null;
  await db.read();
  // @ts-ignore
  const config = db.chain
    .get('servers')
    ?.find({ id: db.chain.get('currentServerId').value() })
    .value()?.config;
  // [0] is socks proxy port
  const socksPort = config?.inbounds[0].port;

  // [1] is http proxy port
  const httpPort = config?.inbounds[1].port;
  const mode = db.chain.get('settings.proxyMode').value() as Mode;
  if (socksPort && httpPort) {
    // const mode = (store.get('proxyMode') as Mode) ?? store.set('proxyMode', 'Manual');
    const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
    proxy = Proxy.createProxy(process.platform, httpPort, socksPort, randomPort, mode);
    if (proxy) {
      proxy.start();
    }
  } else {
    logger.warn('httpPort or socksPort is invalid');
  }

  return proxy;
};

const changeProxyMode = async (mode: Mode) => {
  await db.read();
  // @ts-ignore
  const config = db.chain
    .get('servers')
    ?.find({ id: db.chain.get('currentServerId').value() })
    .value()?.config;
  // [0] is socks proxy port
  const socksPort = config?.inbounds[0].port;

  // [1] is http proxy port
  const httpPort = config?.inbounds[1].port;
  const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
  if (httpPort && socksPort) {
    proxy = proxy ?? Proxy.createProxy(process.platform, httpPort, socksPort, randomPort, mode);
    if (proxy) {
      if (mode === 'Manual') {
        proxy.stop();
      } else {
        proxy.switch(mode);
      }
      db.chain.set('settings.proxyMode', mode);
      await db.write();
    }
  } else {
    db.chain.set('settings.proxyMode', 'Manual');
    await db.write();
    logger.warn('httpPort or socksPort is invalid');
    proxy?.stop();
  }
};

const writeAppVersion = async () => {
  db.chain.set('appVersion', app.getVersion());
  await db.write();
};

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
    listener: (event: IpcMainEvent, data) => clipboard.writeText(data),
  },
  {
    channel: 'db:read',
    listener: async (event: IpcMainEvent, key, query) => {
      await db.read();
      const value = db.chain.get(key).value();
      return value;
    },
  },
  {
    channel: 'db:write',
    listener: async (event: IpcMainEvent, key, data) => {
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
    listener: (event: IpcMainEvent, status: boolean) => {
      app.setLoginItemSettings({ openAtLogin: status });
    },
  },
  {
    channel: 'proxyMode:change',
    listener: (event, mode: Mode) => changeProxyMode(mode),
  },
];

nativeTheme.on('updated', async () => {
  await db.read();
  const appearance = db.chain.get('settings.appearance').value();
  if (appearance === 'system') {
    const isDarkMode = nativeTheme.shouldUseDarkColors;
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow?.webContents?.send('appearance:system:fromMain', isDarkMode ? 'dark' : 'light');
  }
});

validatedIpcMain.on('v2rayx:appearance:system', (event) => {
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  event.reply('appearance:system:fromMain', isDarkMode ? 'dark' : 'light');
});

validatedIpcMain.on('v2rayx:service:selected', (event) => emitter.emit('tray-v2ray:update', false));

validatedIpcMain.on('v2rayx:service:empty', (event) => emitter.emit('tray-v2ray:update', false));

const mountChannels = (channels: any[]) => {
  channels.forEach(({ channel, listener }) => {
    validatedIpcMain.handle(`v2rayx:${channel}`, listener);
  });
};

ipcMain.handle('proxyMode:change', (event, mode: Mode) => {
  changeProxyMode(mode);
});

const startUp = async () => {
  checkForRepeatedStart();
  mountChannels(registerChannels);
  proxy = await initProxyMode();
  // TODD: auto start proxy
  await db.read();
  if (db.chain.get('v2rayInstallStatus').value()) {
    service = new Service(process.platform);
    try {
      if (db.chain.get('currentServerId').value() !== '') {
        service.start(
          db.chain
            .get('servers')
            .find({ id: db.chain.get('currentServerId').value() })
            .value()?.config
        );
      }
    } catch (err) {
      logger.error('service init', err);
    }
  }
  ipcMain.handle('v2rayx:v2ray:start', (event, data: JSON) => {
    service?.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
    proxy?.updatePort(httpPort, socksPort, randomPort);
    proxy?.stop();
    proxy?.start();
    emitter.emit('tray-v2ray:update', true);
  });
  ipcMain.handle('v2rayx:v2ray:stop', () => {
    service?.stop();
    emitter.emit('tray-v2ray:update', false);
  });
  ipcMain.handle('v2rayx:v2ray:check', () => {
    emitter.emit('tray-v2ray:update', service?.check() ?? false);
    return service?.check();
  });
  ipcMain.handle('get-logs-path', () => {
    return app.getPath('logs');
  });
  emitter.on('v2ray:stop', () => {
    service?.stop();
    emitter.emit('tray-v2ray:update', false);
  });
  emitter.on('v2ray:start', (data) => {
    service?.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
    proxy?.updatePort(httpPort, socksPort, randomPort);
    proxy?.stop();
    proxy?.start();
    emitter.emit('tray-v2ray:update', true);
  });
  emitter.on('proxyMode:change', (mode: Mode) => changeProxyMode(mode));
  await writeAppVersion();
  return { preStartProxy: proxy, preStartService: service, repeatedStart: cleanUp };
};

export default startUp;
