import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import logger from '@main/lib/logs';
import appUpdater from '@main/services/auto-update';
import { Install } from '@main/services/install';
import { createTray } from '@main/services/tray';
import db from '@main/lib/lowdb/index';
import { createWindow } from '@main/services/browser';
import registryHooks from '@main/services/hooks';
import App from '@main/app';
import { IpcMainWindowType } from '@lib/constant/types';

export let mainWindow: IpcMainWindowType;
let cleanUp = false;

/* -------------- pre work -------------- */

const gotTheLock = app.requestSingleInstanceLock(); // singleton lock
if (!gotTheLock) {
  app.quit();
} else {
  // TODO: click for open window
  const mainWindow: BrowserWindow = BrowserWindow.getAllWindows()[0];
  mainWindow?.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// Set app user model id for windows
electronApp.setAppUserModelId('io.shaonhuang.v2rayx');
// app.dock?.hide();

export const electronHookApp = new App();

registryHooks(electronHookApp);

electronHookApp.beforeReady(app);

/* -------------- electron life cycle -------------- */

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await db.read();
  electronHookApp.ready(app);

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
  if (db.chain.get('v2rayInstallStatus').value()) {
    createTray(mainWindow, createWindow);
  }
  appUpdater(mainWindow);
  // check v2ray package install status
  const install = Install.createInstall(process.platform);
  const v2rayPackageStatus = install.checkV2ray();
  db.data.v2rayInstallStatus = v2rayPackageStatus;
  await db.write();
  db.data = db.chain.set('appVersion', app.getVersion()).value();
  // each time write something to lowdb, we have to write await db.write() weird bug for lowdb
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
  cleanUp || logger.info('App before quit. Cleaning up...');
  cleanUp || event.preventDefault();

  cleanUp ||
    electronHookApp.beforeQuit(app, (err) => {
      if (err) console.log(err);
      cleanUp = true;
      app.quit();
    });
});

process.on('exit', () => {
  app.quit();
});
