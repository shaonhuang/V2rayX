import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  shell,
  clipboard,
  Notification,
} from 'electron';
import fs from 'fs';
import { join } from 'node:path';
import logger from '@lib/logs';
import db from '@lib/lowdb';
import emitter from '@lib/event-emitter';
import { globalPacConf, isMacOS, isWindows, pacDir, userPacConf } from '@main/lib/constant';
import { autoUpdater } from 'electron-updater';
import icon from '@resources/icon.png?asset';
import { find, findIndex } from 'lodash';
import { Server } from '@main/lib/constant/types';

let tray: any = null;

export const createTray = (mainWindow: Object, createWindow: Function) => {
  const menuIcon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAASpJREFUOE+lk7FKA0EQhv85FSuLu/MRXAJqKTY2prZII4KtlazY2oiQSsgDZE8LX8BYiC9ginRWFhHC3htoNhFbb0cuGrnoeXuH2+3y/98M/84Q/nko9YftuMXEJxVYfbC9MUe15gQQqPgRHu+bQ/E0uV/oVVj0i4AMdEdS1L8AmqdiI8Wvt79AqdYJYMYzgA5bdMbHopvp8NpIse4EfFanByNXNv0o3iLmXrbbMoBx8o4Nu2hfFxLqAVSrBPCAxosUd34U3xJzI5uHMwMCTodSnIdR3GLmHXjY+/4ppbkQECqthlLIINIHYFz9rBy4AKkhL7QpyAlYuhws54WWGgtDtAnq83P0lhDO8kLLnQNf6XsCtivsAmZHuT1ogrxdAGslIbPLVNKUK/sAFubAEc0R7fYAAAAASUVORK5CYII=',
  );
  tray = new Tray(menuIcon);

  const servers = db.chain.get('servers').value();
  const currentServerId = db.chain.get('currentServerId').value();
  const currentServer: Server = find(servers, { id: currentServerId });
  const pastePort = currentServerId ? currentServer.config.inbounds[1].port : 10871;
  const serversSubMenu = servers.map((server: Server) => {
    return {
      label: server.ps,
      type: 'radio',
      checked: server.id === currentServerId,
      enabled: false,
      click: async () => {
        // db.data = db.chain.set('currentServerId', server.id).value();
        // await db.write();
        // const mainWindow = BrowserWindow.getAllWindows()[0];
        // mainWindow?.webContents?.send('crrentServer:change', server.id);
        // emitter.emit('currentServer:change', server.id);
      },
    };
  });
  const template: any = [
    {
      label: `v2ray-core: Off (v${app.getVersion()})`,
      enabled: false,
    },
    {
      label: 'Turn v2ray-core On',
      accelerator: 'CmdOrCtrl+t',
      enabled: false,
      click: () => {
        emitter.emit('v2ray:stop', {});
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'View Config.json',
      click: () => {
        const config = join(app.getPath('userData'), 'v2ray-core', 'tmp.json');
        if (fs.existsSync(config)) {
          logger.info('config.json', config);
          shell.openExternal(`file://${config}`);
        }
      },
    },
    {
      label: 'View PAC File',
      click: () => {
        const pac = userPacConf;
        if (fs.existsSync(pac)) {
          shell.openExternal(`file://${pac}`);
        }
      },
    },
    {
      label: 'View Log',
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
      type: 'radio',
      checked: false,
      click: async () => {
        db.data = db.chain.set('settings.proxyMode', 'PAC').value();
        await db.write();
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow?.webContents?.send('proxyMode:change', 'PAC');
        emitter.emit('proxyMode:change', 'PAC');
      },
    },
    {
      label: 'Global Mode',
      type: 'radio',
      checked: false,
      click: async () => {
        db.data = db.chain.set('settings.proxyMode', 'Global').value();
        await db.write();
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow?.webContents?.send('proxyMode:change', 'Global');
        emitter.emit('proxyMode:change', 'Global');
      },
    },
    {
      label: 'Manual Mode',
      type: 'radio',
      checked: false,
      click: async () => {
        db.data = db.chain.set('settings.proxyMode', 'Manual').value();
        await db.write();
        const mainWindow = BrowserWindow.getAllWindows()[0];
        mainWindow?.webContents?.send('proxyMode:change', 'Manual');
        emitter.emit('proxyMode:change', 'Manual');
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Servers...',
      submenu: serversSubMenu,
    },
    {
      label: 'Configure...',
      accelerator: 'CmdOrCtrl+c',
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
      label: 'Subscriptions...',
      enabled: false,
    },
    {
      label: 'PAC Settings...',
      enabled: false,
    },
    {
      label: 'Connection Test...',
      enabled: false,
    },
    {
      type: 'separator',
    },
    {
      label: 'Import Server From Pasteboard',
      enabled: false,
    },
    {
      label: 'Scan QR Code from Screen',
      enabled: false,
    },
    {
      label: 'Share Link/QR Code',
      enabled: false,
    },
    {
      type: 'separator',
    },
    {
      label: 'Copy HTTP Proxy Shell Export Command',
      accelerator: 'CmdOrCtrl+e',
      click: () => {
        const pasteData = isWindows
          ? `set http_proxy=http://127.0.0.1:${pastePort}`
          : `export http_proxy=http://127.0.0.1:${pastePort};export https_proxy=http://127.0.0.1:${pastePort};`;
        clipboard.writeText(pasteData);
        new Notification({
          title: 'V2rayX',
          body: `Command has pasted to clipboard -- ${pasteData}`,
          silent: true,
          icon,
        }).show();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Preferences...',
      enabled: false,
    },
    {
      label: isMacOS ? 'Check Offical Website' : 'Check for Updates',
      click: () => {
        if (isMacOS) {
          shell.openExternal('https://github.com/shaonhuang/V2rayX/releases');
          return;
        }
        autoUpdater.checkForUpdates();
      },
    },
    {
      label: 'Help',
      click: () => {
        shell.openExternal('https://github.com/shaonhuang/V2rayX/issues');
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+q',
      click: () => {
        app.quit();
      },
    },
  ];

  const contextMenu = Menu.buildFromTemplate(template);
  const proxyMode = db.chain.get('settings.proxyMode').value();
  // item 7:PAC; item 8:GLobal; item 9:Manual;
  contextMenu.items[proxyMode === 'Global' ? 8 : proxyMode === 'Manual' ? 9 : 7].checked = true;
  tray.setToolTip('click for more operations');
  tray.setContextMenu(contextMenu);
  emitter.on('tray-v2ray:update', (running: boolean) => {
    const proxyMode = db.data.settings.proxyMode;
    template[0].label = `v2ray-core: ${running ? 'On' : 'Off'} (v${app.getVersion()})`;
    template[1].label = `Turn v2ray-core ${running ? 'Off' : 'On'}`;
    // @ts-ignore
    const config = db.chain
      .get('servers')
      .find({ id: db.chain.get('currentServerId').value() })
      .value()?.config;
    template[1].enabled = config ? true : false;
    template[1].click = () => {
      if (config) {
        emitter.emit(running ? 'v2ray:stop' : 'v2ray:start', config);
      }
    };
    [7, 8, 9].forEach((index: number) => {
      template[index].checked = false;
    });
    const mainWindow = BrowserWindow.getAllWindows()[0];
    mainWindow?.webContents?.send('v2ray:status', running);
    db.data.serviceRunningState = running;
    db.write().then(() => {
      template[proxyMode === 'Global' ? 8 : proxyMode === 'Manual' ? 9 : 7].checked = true;
      tray.setContextMenu(Menu.buildFromTemplate(template));
    });
  });
  emitter.on('tray-mode:update', (mode) => {
    [7, 8, 9].forEach((index: number) => {
      template[index].checked = false;
    });
    template[mode === 'Global' ? 8 : mode === 'Manual' ? 9 : 7].checked = true;
    tray.setContextMenu(Menu.buildFromTemplate(template));
  });
  emitter.on('tray-servers:update', () => {
    const servers = db.chain.get('servers').value();
    const currentServerId = db.chain.get('currentServerId').value();
    const currentServer: Server = find(servers, { id: currentServerId });
    const pastePort = currentServerId ? currentServer.config.inbounds[1].port : 10871;
    const serversSubMenu = servers.map((server: Server) => {
      return {
        label: server.ps,
        type: 'radio',
        checked: server.id === currentServerId,
        enabled: false,
        click: async () => {
          // db.data = db.chain.set('currentServerId', server.id).value();
          // await db.write();
          // const mainWindow = BrowserWindow.getAllWindows()[0];
          // mainWindow?.webContents?.send('crrentServer:change', server.id);
          // emitter.emit('currentServer:change', server.id);
        },
      };
    });
    template[21].click = () => {
      const pasteData = isWindows
        ? `set http_proxy=http://127.0.0.1:${pastePort}`
        : `export http_proxy=http://127.0.0.1:${pastePort};export https_proxy=http://127.0.0.1:${pastePort};`;
      clipboard.writeText(pasteData);
      new Notification({
        title: 'V2rayX',
        body: `Command has pasted to clipboard -- ${pasteData}`,
        silent: true,
        icon,
      }).show();
    };
    template[11].submenu = serversSubMenu;
    tray.setContextMenu(Menu.buildFromTemplate(template));
  });
  tray.on('double-click', function () {
    if (mainWindow === null) {
      mainWindow = createWindow();
    } else {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      } else {
        mainWindow.show();
      }
    }
  });
};
