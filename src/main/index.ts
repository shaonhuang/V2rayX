import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import { Proxy } from '@main/lib/proxy';
import logger from '@main/lib/logs';
import appUpdater from '@main/services/auto-update';
import { Install } from '@main/services/install';
import { Service } from '@main/lib/v2ray';
import { createTray } from '@main/services/tray';
import db from '@main/lib/lowdb/index';
import { createWindow } from '@main/services/browser';
import startUp from './bootstrap';

let mainWindow: any = null;
let proxy: Proxy | null = null;
let service: Service | null = null;
let cleanUp = false;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.v2rayx');
  // service for manage v2ray process, proxy for manage system proxy settings
  const { preStartProxy, preStartService, repeatedStart } = await startUp();
  proxy = preStartProxy;
  service = preStartService;
  cleanUp = repeatedStart;

  // Default open or close DevTools by F13 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  mainWindow = createWindow();

  if (is.dev) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow.webContents.openDevTools();
  }
  // load services
  createTray(mainWindow, createWindow);
  appUpdater(mainWindow);
  // check v2ray package install status
  const install = Install.createInstall(process.platform);
  const v2rayPackageStatus = install.checkV2ray();
  db.data.v2rayInstallStatus = v2rayPackageStatus;
  await db.write();

  logger.info(`v2rayPackageStatus: ${v2rayPackageStatus}`);
  ipcMain.on('v2ray:install', async () => {
    if (!v2rayPackageStatus) {
      try {
        await install.installV2ray((progress: number) => {
          mainWindow.webContents.send('v2ray:downloadStatus', progress);
        });
        mainWindow.webContents.send('v2ray:finishedInstall', true);
        db.data.v2rayInstallStatus = true;
        await db.write();
      } catch (err) {
        logger.error('installV2ray', err);
      }
    }
  });

  // FIXME: DevTools bugs
  // installExtension(REACT_DEVELOPER_TOOLS)
  //   .then((name) => console.log(`Added Extension:  ${name}`))
  //   .catch((err) => console.log('An error occurred: ', err));

  ipcMain.on('logs:get', (event, logName = 'access.log') => {
    const logPath = join(app.getPath('logs'), logName);
    const logs = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, 'utf-8').split('\n').slice(-11, -1)
      : [];
    event.reply('logs:get', logs);
  });

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
  logger.info('before-quit', proxy);

  // Prevent the application from quitting immediately
  cleanUp || event.preventDefault();

  Promise.resolve()
    .then(() => {
      if (proxy) {
        try {
          proxy?.stop();
        } catch (error) {
          logger.error('proxy stop', error);
        }
      }
    })
    .then(() => {
      service?.stop();
      cleanUp = true;
    })
    .then(() => app.quit());
});
