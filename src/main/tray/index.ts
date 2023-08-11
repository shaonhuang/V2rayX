import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, ipcRenderer } from 'electron';
import fs from 'fs';
const Store = require('electron-store');
const store = new Store();
let tray: any = null;

export const createTray = (mainWindow: Object, createWindow: Function) => {
  const menuIcon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAASpJREFUOE+lk7FKA0EQhv85FSuLu/MRXAJqKTY2prZII4KtlazY2oiQSsgDZE8LX8BYiC9ginRWFhHC3htoNhFbb0cuGrnoeXuH2+3y/98M/84Q/nko9YftuMXEJxVYfbC9MUe15gQQqPgRHu+bQ/E0uV/oVVj0i4AMdEdS1L8AmqdiI8Wvt79AqdYJYMYzgA5bdMbHopvp8NpIse4EfFanByNXNv0o3iLmXrbbMoBx8o4Nu2hfFxLqAVSrBPCAxosUd34U3xJzI5uHMwMCTodSnIdR3GLmHXjY+/4ppbkQECqthlLIINIHYFz9rBy4AKkhL7QpyAlYuhws54WWGgtDtAnq83P0lhDO8kLLnQNf6XsCtivsAmZHuT1ogrxdAGslIbPLVNKUK/sAFubAEc0R7fYAAAAASUVORK5CYII='
  );
  tray = new Tray(menuIcon);

  const template: any = [
    {
      label: `v2ray-core: On (${app.getVersion()})`,
      enabled: false,
    },
    {
      label: 'Turn v2ray-core Off',
      accelerator: 'CmdOrCtrl+t',
      click: () => {
        global.eventEmitter.emit('tray-v2ray:stop');
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'View config.json',
    },
    {
      label: 'View log',
      click: () => {
        const logFile = `${app.getPath('logs')}/access.log`;
        if (fs.existsSync(logFile)) {
          shell.openPath(logFile);
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Pac Mode',
      enabled: false,
      type: 'radio',
      checked: false,
      click: () => {
        store.set('proxyMode', 'PAC');
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow?.webContents?.send('proxyMode:change', 'PAC');
        global.eventEmitter.emit('proxyMode:change', 'PAC');
      },
    },
    {
      label: 'Global Mode',
      type: 'radio',
      checked: false,
      click: () => {
        store.set('proxyMode', 'Global');
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow?.webContents?.send('proxyMode:change', 'Global');
        global.eventEmitter.emit('proxyMode:change', 'Global');
      },
    },
    {
      label: 'Manual Mode',
      type: 'radio',
      checked: false,
      click: () => {
        store.set('proxyMode', 'Manual');
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow?.webContents?.send('proxyMode:change', 'Manual');
        global.eventEmitter.emit('proxyMode:change', 'Manual');
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Configure...',
      click: () => {
        if (mainWindow === null) {
          mainWindow = createWindow();
        } else {
          if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow();
          } else {
            mainWindow.show();
          }
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ];

  const contextMenu = Menu.buildFromTemplate(template);
  const proxyMode = store.get('proxyMode');
  // item 6:PAC; item 7:GLobal; item 8:Manual;
  contextMenu.items[proxyMode === 'Global' ? 7 : proxyMode === 'Manual' ? 8 : 6].checked = true;
  tray.setToolTip('click for more operations');
  tray.setContextMenu(contextMenu);
  global.eventEmitter.on('tray-v2ray:update', (running: boolean) => {
    template[0].label = `v2ray-core: ${running ? 'On' : 'Off'} (${app.getVersion()})`;
    template[1].label = `Turn v2ray-core ${running ? 'Off' : 'On'}`;
    template[1].click = () => {
      global.eventEmitter.emit(running ? 'tray-v2ray:stop' : 'tray-v2ray:start');
      console.log('emit', running);
    };
    const proxyMode = store.get('proxyMode');
    [6, 7, 8].forEach((index: number) => {
      template[index].checked = false;
    });
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow?.webContents?.send('v2ray:status', running);
    console.log(running);
    store.set('v2rayStatus', running);
    template[proxyMode === 'Global' ? 7 : proxyMode === 'Manual' ? 8 : 6].checked = true;
    tray.setContextMenu(Menu.buildFromTemplate(template));
  });
};
