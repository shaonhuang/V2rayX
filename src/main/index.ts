import { app, BrowserWindow } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import logger from '@lib/logs';
import db from '@lib/lowdb/index';
import registryHooks from '@services/hooks';
import App from '@lib/app';
import { IpcMainWindowType } from '@lib/constant/types';
import Window from '@services/browser';

export let mainWindow: IpcMainWindowType;
let cleanUp = false;

/* -------------- pre work -------------- */

const gotTheLock = app.requestSingleInstanceLock(); // singleton lock
if (!gotTheLock) {
  app.quit();
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

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      new Window().mainWin;
    } else {
      new Window().mainWin?.show();
    }
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
