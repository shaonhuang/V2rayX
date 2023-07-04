import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { Proxy } from '@main/utils/proxy';
import logger from '@main/utils/logs';
import appUpdater from '@main/utils/appUpdater';
import { initStore } from '@main/store';
const Store = require('electron-store');
const store = new Store();
import { Install } from '@main/utils/install';
import { Service } from '@main/utils/v2ray';
import { createTray } from '@main/tray';
import { init } from '@main/setups';

let mainWindow: any = null;
let proxy: Proxy | null = null;
let service: Service | null = null;
let cleanUp = false;
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  cleanUp = true;
  // If another instance of the app is already running, quit this instance
  app.quit();
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: icon,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: is.dev,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  // FIXME: remove this line before publishing
  if (is.dev) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.openDevTools();
  }
}

app.setLoginItemSettings({
  openAtLogin: store.get('autoLaunch') ?? false,
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F13 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  const { proxyInstance } = init();
  proxy = proxyInstance;
  createTray(mainWindow, createWindow);
  initStore();
  appUpdater(mainWindow);

  const install = Install.createInstall(process.platform);
  const v2rayPackageStatus = install.checkV2ray();
  store.set('v2rayInstallStatus', v2rayPackageStatus);

  logger.info(`v2rayPackageStatus: ${v2rayPackageStatus}`);
  ipcMain.on('v2ray:install', async () => {
    if (!v2rayPackageStatus) {
      try {
        await install.installV2ray((progress: number) => {
          mainWindow.webContents.send('v2ary:downloadStatus', progress);
        });
        mainWindow.webContents.send('v2ray:finishedInstall', true);
        store.set('v2rayInstallStatus', true);
        service = new Service(process.platform);
        try {
          store.get('selectedServer') > -1 && service.start();
        } catch (err) {
          logger.error('service init', err);
        }
      } catch (err) {
        logger.error('installV2ray', err);
      }
    }
  });
  if (store.get('v2rayInstallStatus')) {
    service = new Service(process.platform);
    try {
      store.get('selectedServer') > -1 && service.start();
    } catch (err) {
      logger.error('service init', err);
    }
  }
  // FIXME: DevTools bugs
  // installExtension(REACT_DEVELOPER_TOOLS)
  //   .then((name) => console.log(`Added Extension:  ${name}`))
  //   .catch((err) => console.log('An error occurred: ', err));

  ipcMain.handle('v2ray:start', (event, data: JSON) => {
    service?.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    proxy?.updatePort(httpPort, socksPort);
    proxy?.stop();
    proxy?.start();
    console.log(proxy)
  });
  ipcMain.handle('v2ray:stop', () => service?.stop());

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
app.on('before-quit', (event) => {
  // Perform some actions before quitting
  console.log('Before quitting...', proxy);
  console.log('finished');

  // Prevent the application from quitting immediately
  cleanUp || event.preventDefault();

  Promise.resolve()
    .then(() => proxy?.stop())
    .then(() => {
      service?.stop();
      cleanUp = true;
    })
    .then(() => app.quit())
    .catch((error) => {
      console.error(error);
    });
});
