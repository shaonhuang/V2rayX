import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { readFileSync } from 'fs';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import v2ray from './v2ray/manage';
// import Store from 'electron-store';

const handleFileOpen = () => {
  const data = JSON.parse(readFileSync(path.join(__dirname, '../../public/test.json'), 'utf-8'));
  return data;
};

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // transparent: true,
    transparent: false,
    webPreferences: {
      // contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (app.isPackaged) {
    // 'build/index.html'
    win.loadURL(`file://${__dirname}/../index.html`);
  } else {
    win.loadURL('http://localhost:3000/index.html');

    win.webContents.openDevTools();

    // Hot Reloading on 'node_modules/.bin/electronPath'
    require('electron-reload')(__dirname, {
      electron: path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        '.bin',
        'electron' + (process.platform === 'win32' ? '.cmd' : '')
      ),
      forceHardReset: true,
      hardResetMethod: 'exit',
    });
  }
}

app.whenReady().then(async () => {
  createWindow();

  // DevTools bugs
  // installExtension(REACT_DEVELOPER_TOOLS)
  //   .then((name) => console.log(`Added Extension:  ${name}`))
  //   .catch((err) => console.log('An error occurred: ', err));
  // v2ray.clean();
  // await v2ray.download();
  // v2ray.copy();
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
  ipcMain.handle('dialog:openFile', handleFileOpen);
  ipcMain.handle('v2ray:start', () => v2ray.v2rayService('start'));
  ipcMain.handle('v2ray:stop', () => v2ray.v2rayService('stop'));
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
