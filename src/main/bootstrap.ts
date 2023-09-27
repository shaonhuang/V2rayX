import { validatedIpcMain } from '@lib/bridge';
import { appDataPath, pacDir, pathExecutable, pathRuntime } from '@lib/constant';
import { Mode, VmessObjConfiguration } from '@lib/constant/types';
import emitter from '@lib/event-emitter';
import registryHooks from '@lib/hooks';
import logger from '@lib/logs';
import db from '@lib/lowdb';
import { PacServer as PS } from '@lib/proxy/pac';
import App from '@main/app';
import { Proxy } from '@main/lib/proxy';
import { Service } from '@main/lib/v2ray';
import { BrowserWindow, IpcMainEvent, app, clipboard, ipcMain, nativeTheme } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fs from 'fs-extra';
import { resolve } from 'path';
import { checkPortAvailability } from './lib/utils';

logger.info(`appDataPath: ${appDataPath}`);
logger.info(`pathRuntime: ${pathRuntime}`);
logger.info(`pathExecutable: ${pathExecutable}`);

// for this moment, slowly transfor bootstrap to hooks life cycles

export const electronApp = new App();

registryHooks(electronApp);

electronApp.beforeReady(app);

const gotTheLock = app.requestSingleInstanceLock();
let proxy: Proxy | null = null;
let cleanUp = false;
let service: Service | null = null;
let pacPort: number;

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
    await (async () => {
      let findAPort = false;
      while (!findAPort) {
        const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
        try {
          const res = await checkPortAvailability(randomPort);
          logger.info(res);
          pacPort = randomPort;
          findAPort = true;
        } catch (error) {
          logger.error(error);
          findAPort = false;
        }
      }
    })();

    proxy = Proxy.createProxy(process.platform, httpPort, socksPort, pacPort, mode);
    if (proxy) {
      proxy.start();
    }
  } else {
    logger.warn('httpPort or socksPort is invalid');
  }

  return proxy;
};

const setupPACFile = async () => {
  try {
    const firstRun = !(await fs.pathExists(resolve(pacDir, 'pac.txt')));

    if (!firstRun) {
      return;
    }

    logger.info('First run detected');

    const data = await fs.readFile(resolve(pacDir, 'gfwlist.txt'));
    const text = data.toString('ascii');
    await PS.generatePacWithoutPort(text);
  } catch (err) {
    logger.error((err as any).message ?? err);
  }
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

  if (httpPort && socksPort) {
    proxy = proxy ?? Proxy.createProxy(process.platform, httpPort, socksPort, pacPort, mode);
    if (proxy) {
      if (mode === 'Manual') {
        proxy.stop();
      } else {
        proxy.switch(mode);
      }
      db.data = db.chain.set('settings.proxyMode', mode).value();
      await db.write();
    }
  } else {
    db.data = db.chain.set('settings.proxyMode', 'Manual').value();
    await db.write();
    logger.warn('httpPort or socksPort is invalid');
    proxy?.stop();
  }
};

const writeAppVersion = async () => {
  db.data = db.chain.set('appVersion', app.getVersion()).value();
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
      app.setLoginItemSettings({ openAtLogin: status });
    },
  },
  {
    channel: 'proxyMode:change',
    listener: (_, mode: Mode) => changeProxyMode(mode),
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

ipcMain.handle('proxyMode:change', (_, mode: Mode) => {
  changeProxyMode(mode);
});

const startUp = async () => {
  checkForRepeatedStart();
  mountChannels(registerChannels);
  await setupPACFile();
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
            .value()?.config,
        );
        emitter.emit('tray-v2ray:update', true);
      }
    } catch (err) {
      logger.error('service init', err);
    }
  }
  ipcMain.handle('v2rayx:v2ray:start', (_, data: VmessObjConfiguration) => {
    service?.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    proxy?.updatePort(httpPort, socksPort, pacPort);
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
    emitter.emit('v2ray:status', service?.check() ?? false);
    emitter.emit('tray-v2ray:update', false);
  });
  emitter.on('v2ray:start', (data) => {
    service?.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    proxy?.updatePort(httpPort, socksPort, pacPort);
    proxy?.stop();
    proxy?.start();
    emitter.emit('tray-v2ray:update', true);
  });

  emitter.on('proxyMode:change', (mode: Mode) => changeProxyMode(mode));
  emitter.on('proxy:stop', () => {
    proxy.stop().then(() => {
      emitter.emit('proxy:status', false);
    });
  });
  await writeAppVersion();
  return { preStartProxy: proxy, preStartService: service, repeatedStart: cleanUp };
};

export default startUp;
