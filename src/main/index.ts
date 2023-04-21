import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import * as path from 'path';
import { readFileSync, mkdir, writeFileSync, unlink } from 'fs';
import { initStore } from './store';
import { homedir } from 'os';
import v2ray from './v2ray/manage';

const handleSaveConfig = (name: string, data: JSON) => {
  writeFileSync(path.join(homedir(), 'v2ray-core', 'config', `${name}.json`), JSON.stringify(data),"utf8");
};
const handleDeleteConfig = (name: any) => {
  console.log(name);
  unlink(path.join(homedir(), 'v2ray-core', 'config', `${name}.json`), function (err) {
    if (err) return console.log(err);
    console.log('file deleted successfully');
  });
};

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  if (v2ray.checkConfigDir()) {
    createWindow();
  } else {
    v2ray.clean();
    await v2ray.download();
    mkdir(path.join(homedir(), 'v2ray-core', 'config'), (err) => {
      if (err) {
        return console.error(err);
      }
      console.log('Directory created successfully!');
    });
    app.exit();
  }
  console.log('start store');
  initStore();

  // DevTools bugs
  // installExtension(REACT_DEVELOPER_TOOLS)
  //   .then((name) => console.log(`Added Extension:  ${name}`))
  //   .catch((err) => console.log('An error occurred: ', err));

  // v2ray.initV2rayService();
  // store.set('foo.bar', true);
  // console.log(store.get('foo'));
  // globalShortcut
  //   .register('Alt+Shift+CommandOrControl+I', () => {
  //     console.log('Electron loves global shortcuts!');
  //   })
  //   .then(createWindow);
  // const v2rayProcess = (type: string) => {
  //   let controller;
  //   if (type === 'start') {
  //     controller = v2ray.initV2rayService();
  //   } else {
  //     controller.abort();
  //     console.log(controller);
  //   }
  // };
  ipcMain.handle('servers:saveFile', async (event, name, data) => {
    console.log(name, data, 'saveFile');
    handleSaveConfig(name, data);
  });
  ipcMain.handle('servers:deleteFile', (event, name) => {
    handleDeleteConfig(name);
  });
  ipcMain.handle('v2ray:start', (event, fileName: string) => v2ray.v2rayService('start', fileName));
  ipcMain.handle('v2ray:stop', () => v2ray.v2rayService('stop'));

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
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
