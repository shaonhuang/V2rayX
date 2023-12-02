import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import logger from '@main/lib/logs';
import appUpdater from '@main/services/auto-update';
import { createTray } from '@main/services/tray';
import db from '@main/lib/lowdb/index';
import { createWindow } from '@main/services/browser';
import registryHooks from '@main/services/hooks';
import App from '@main/app';
import { IpcMainWindowType } from '@lib/constant/types';
import { filter, find } from 'lodash';

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
app.on('ready', async () => {
  await db.read();
  db.data = db.chain.set('appVersion', app.getVersion()).value();
  // each time write something to lowdb, we have to write await db.write() weird bug for lowdb
  await db.write();

  electronHookApp.ready(app);
  electronHookApp.afterReady(app, (err) => {
    if (err) console.log(err);
  });

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

  ipcMain.on('logs:getAllError', (event, { type, start, size, filters, globalFilter, sorting }) => {
    if (!start) return;
    const logName = type ?? 'error.log';
    const logPath = join(app.getPath('logs'), logName);
    const logs = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').split('\n') : [];
    const filteredLogs = filter(
      logs
        .filter((i) => i.includes(globalFilter) || globalFilter === '')
        .reverse()
        .map((i) => {
          const [errorDate, errorTime, errorType] = i.split(' ');
          const errorContent = i.split(' ').slice(3).join(' ');
          return {
            errorDate,
            errorTime,
            errorType,
            errorContent,
          };
        }),
      (i: any) => {
        const filtersObj = JSON.parse(filters);
        const patternErrorDate = new RegExp(
          find(filtersObj, { id: 'errorDate' })?.value ?? /.*/,
          'i',
        );
        const patternErrorTime = new RegExp(
          find(filtersObj, { id: 'errorTime' })?.value ?? /.*/,
          'i',
        );
        const patternErrorType = new RegExp(
          find(filtersObj, { id: 'errorType' })?.value ?? /.*/,
          'i',
        );
        const patternErrorContent = new RegExp(
          find(filtersObj, { id: 'errorContent' })?.value ?? /.*/,
          'i',
        );
        const preTest =
          patternErrorDate.test(i.errorDate) &&
          patternErrorTime.test(i.errorTime) &&
          patternErrorType.test(i.errorType) &&
          patternErrorContent.test(i.errorContent);
        return preTest;
      },
    );
    event.reply('logs:getAllError', {
      data: filteredLogs.slice(start, start + size).filter((i) => i.errorContent),
      meta: {
        totalRowCount: filteredLogs.length,
        type,
        start,
        size,
        filters,
        globalFilter,
        sorting,
      },
    });
  });

  ipcMain.on('logs:getAll', (event, { type, start, size, filters, globalFilter, sorting }) => {
    if (!start) return;
    const logName = type ?? 'access.log';
    const logPath = join(app.getPath('logs'), logName);
    const logs = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').split('\n') : [];
    const filteredLogs = filter(
      logs
        .filter((i) => i.includes(globalFilter) || globalFilter === '')
        .reverse()
        .map((i) => {
          const [date, time, address, type, content, level] = i.split(' ');
          return {
            date,
            time,
            address,
            type,
            content,
            level,
          };
        }),
      (i: any) => {
        const filtersObj = JSON.parse(filters);
        const patternDate = new RegExp(find(filtersObj, { id: 'date' })?.value ?? /.*/, 'i'); // case insensitive
        const patternAddress = new RegExp(find(filtersObj, { id: 'address' })?.value ?? /.*/, 'i');
        const patternTime = new RegExp(find(filtersObj, { id: 'time' })?.value ?? /.*/, 'i');
        const patternType = new RegExp(find(filtersObj, { id: 'type' })?.value ?? /.*/, 'i');
        const patternContent = new RegExp(find(filtersObj, { id: 'content' })?.value ?? /.*/, 'i');
        const patternLevel = new RegExp(find(filtersObj, { id: 'level' })?.value ?? /.*/, 'i');
        const preTest =
          patternDate.test(i.date) &&
          patternAddress.test(i.address) &&
          patternTime.test(i.time) &&
          patternType.test(i.type) &&
          patternContent.test(i.content) &&
          patternLevel.test(i.level);

        return preTest;
      },
    );
    event.reply('logs:getAll', {
      data: filteredLogs.slice(start, start + size).filter((i) => i.content),
      meta: {
        totalRowCount: filteredLogs.length,
        type,
        start,
        size,
        filters,
        globalFilter,
        sorting,
      },
    });
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
