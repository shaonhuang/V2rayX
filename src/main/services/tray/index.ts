import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  shell,
  clipboard,
  Notification,
  NativeImage,
  MenuItemConstructorOptions,
} from 'electron';
import fs from 'node:fs';
import { join } from 'node:path';
import logger from '@lib/logs';
import db from '@lib/lowdb';
import emitter from '@lib/event-emitter';
import { isMacOS, isWindows, userPacConf, v2rayRuntimeConfigPath } from '@lib/constant';
import { autoUpdater } from 'electron-updater';
import icon from '@resources/icon.png?asset';
import { find, flattenDeep } from 'lodash';
import { Server } from '@main/lib/constant/types';
import Window from '@main/services/browser';
import tcpPing from '@lib/utils/misc/tcpPing';
import { VMess, VLess, Trojan } from '@main/lib/utils/misc/protocol';
import hash from 'object-hash';
import { uniqBy } from 'lodash';
import { TraySingleton } from './Tray';
import path from 'node:path';
import { resourcesPath } from '@lib/constant';

export class TrayService {
  private v2rayLogsFolder: string;
  private pastePort: number;
  private icon: string | NativeImage;
  private serversSubMenu: MenuItemConstructorOptions[];
  constructor(params: {
    v2rayLogsFolder: string;
    pastePort: number;
    serversSubMenu: MenuItemConstructorOptions[];
    icon: string | NativeImage;
  }) {
    this.v2rayLogsFolder = params.v2rayLogsFolder;
    this.pastePort = params.pastePort;
    this.icon =
      params.icon === ''
        ? nativeImage.createFromPath(path.join(resourcesPath, 'tray-icon.png'))
        : params.icon;
    this.serversSubMenu = params.serversSubMenu;
  }

  public init() {
    const service = new TraySingleton(this.icon);

    service.updateTemplate({
      id: '0',
      label: `v2ray-core: Off (v${app.getVersion()})`,
      enabled: false,
    });
    service.updateTemplate({
      id: '1',
      label: 'Turn v2ray-core On',
      accelerator: 'CmdOrCtrl+t',
      enabled: false,
      click: () => {
        emitter.emit('v2ray:stop', {});
      },
    });
    service.updateTemplate({
      id: '2',
      label: 'View Config.json',
      click: () => {
        const path = v2rayRuntimeConfigPath;
        if (fs.existsSync(path)) {
          logger.info('v2ray runtime tmp.json', path);
          shell.openExternal(`file://${path}`);
        }
      },
    });
    service.updateTemplate({
      id: '3',
      label: 'View PAC File',
      click: () => {
        const pac = userPacConf;
        if (fs.existsSync(pac)) {
          shell.openExternal(`file://${pac}`);
        }
      },
    });
    service.updateTemplate({
      id: '4',
      label: 'View Logs',
      click: () => {
        const logFile = `${this.v2rayLogsFolder}access.log`;
        if (fs.existsSync(logFile)) {
          shell.openPath(logFile);
        }
      },
    });
    service.updateTemplate({
      id: '5',
      label: 'Pac Mode',
      type: 'radio',
      checked: false,
      click: async () => {
        db.data = db.chain.set('settings.proxyMode', 'PAC').value();
        await db.write();
        const mainWindow = new Window().mainWin;
        mainWindow?.webContents.send('proxyMode:change', 'PAC');
        emitter.emit('proxyMode:change', 'PAC');
      },
    });
    service.updateTemplate({
      id: '6',
      label: 'Global Mode',
      type: 'radio',
      checked: false,
      click: async () => {
        db.data = db.chain.set('settings.proxyMode', 'Global').value();
        await db.write();
        const mainWindow = new Window().mainWin;
        mainWindow?.webContents?.send('proxyMode:change', 'Global');
        emitter.emit('proxyMode:change', 'Global');
      },
    });
    service.updateTemplate({
      id: '7',
      label: 'Manual Mode',
      type: 'radio',
      checked: false,
      click: async () => {
        db.data = db.chain.set('settings.proxyMode', 'Manual').value();
        await db.write();
        const mainWindow = new Window().mainWin;
        mainWindow?.webContents?.send('proxyMode:change', 'Manual');
        emitter.emit('proxyMode:change', 'Manual');
      },
    });
    service.updateTemplate({
      id: '8',
      label: 'Servers...',
      submenu: this.serversSubMenu,
    });
    service.updateTemplate({
      id: '9',
      label: 'Configure...',
      accelerator: 'CmdOrCtrl+c',
      click: () => {
        const mainWindow = new Window().mainWin;
        mainWindow?.show();
      },
    });
    service.updateTemplate({
      id: '10',
      label: 'Subscriptions...',
      click: () => {
        new Window('/index/servers').mainWin?.show();
        Window.createWindow(
          '/manage/subscription',
          {
            width: 800,
            height: 600,
            show: true,
          },
          {
            parentName: 'mainWindow',
            modalStatus: true,
          },
        );
      },
    });
    service.updateTemplate({
      id: '11',
      label: 'PAC Settings...',
      click: () => {
        Window.createWindow('/manage/pac', {
          width: 800,
          height: 600,
          show: true,
        });
      },
    });
    service.updateTemplate({
      id: '12',
      label: 'Connection Test...',
      enabled: false,
    });
    service.updateTemplate({
      id: '13',
      label: 'Import Server From Pasteboard',
      enabled: false,
    });
    service.updateTemplate({
      id: '14',
      label: 'Scan QR Code From Screen',
      click: () => {
        new Window('/index/servers').mainWin?.show();
      },
      enabled: false,
    });
    service.updateTemplate({
      id: '15',
      label: 'Share Link/QR Code',
      enabled: false,
      click: () => {
        Window.createWindow('/share/qrcode', {
          width: 420,
          height: 420,
          show: true,
        });
      },
    });
    service.updateTemplate({
      id: '16',
      label: 'Copy HTTP Proxy Shell Command',
      accelerator: 'CmdOrCtrl+e',
      click: () => {
        const pasteData = isWindows
          ? `set http_proxy=http://127.0.0.1:${this.pastePort}`
          : `export http_proxy=http://127.0.0.1:${this.pastePort};export https_proxy=http://127.0.0.1:${this.pastePort};`;
        clipboard.writeText(pasteData);
        new Notification({
          title: 'V2rayX',
          body: `Command has pasted to clipboard -- ${pasteData}`,
          silent: true,
          icon,
        }).show();
      },
    });
    service.updateTemplate({
      id: '17',
      label: 'Preferences...',
      accelerator: 'CmdOrCtrl+,',
      click: () => new Window('/index/settings').mainWin?.show(),
    });
    service.updateTemplate({
      id: '18',
      label: isMacOS ? 'Check Offical Website' : 'Check for Updates',
      click: () => {
        if (isMacOS) {
          shell.openExternal('https://github.com/shaonhuang/V2rayX/releases');
          return;
        }
        autoUpdater.checkForUpdates();
      },
    });
    service.updateTemplate({
      id: '19',
      label: 'Help',
      click: () => {
        shell.openExternal('https://github.com/shaonhuang/V2rayX/issues');
      },
    });
    service.updateTemplate({
      id: '20',
      label: 'Quit',
      accelerator: 'CmdOrCtrl+q',
      click: () => {
        app.quit();
      },
    });

    service.refreshTray();
  }
}

let tray: any = null;

export const createTray = () => {
  const menuIcon = nativeImage.createFromDataURL(
    db.data?.management.appearance.enhancedTrayIcon ||
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAASpJREFUOE+lk7FKA0EQhv85FSuLu/MRXAJqKTY2prZII4KtlazY2oiQSsgDZE8LX8BYiC9ginRWFhHC3htoNhFbb0cuGrnoeXuH2+3y/98M/84Q/nko9YftuMXEJxVYfbC9MUe15gQQqPgRHu+bQ/E0uV/oVVj0i4AMdEdS1L8AmqdiI8Wvt79AqdYJYMYzgA5bdMbHopvp8NpIse4EfFanByNXNv0o3iLmXrbbMoBx8o4Nu2hfFxLqAVSrBPCAxosUd34U3xJzI5uHMwMCTodSnIdR3GLmHXjY+/4ppbkQECqthlLIINIHYFz9rBy4AKkhL7QpyAlYuhws54WWGgtDtAnq83P0lhDO8kLLnQNf6XsCtivsAmZHuT1ogrxdAGslIbPLVNKUK/sAFubAEc0R7fYAAAAASUVORK5CYII=',
  );
  tray = new Tray(menuIcon);

  const currentServerId = db.data.currentServerId?.[0] ?? '';
  const pastePort = db.data.management.v2rayConfigure.inbounds[1].port ?? 10871;
  const v2rayLogsFolder = db.data.management.generalSettings.v2rayLogsFolder;
  const outbounds = flattenDeep([
    db.chain.get('servers').value(),
    db.chain
      .get('subscriptionList')
      .value()
      .map((i) => i.requestServers),
  ]);
  const serversSubMenu = outbounds.map((server: Server) => {
    return {
      label: server.latency
        ? `${server.latency === 'Timeout' ? 'Timeout' : server.latency}  ${server.ps}`
        : server.ps,
      type: 'radio',
      checked: server.id === currentServerId,
      enabled: false,
      click: async () => {
        // db.data = db.chain.set('currentServerId', [server.id]).value();
        // await db.write();
        // const mainWindow = new Window().mainWin;
        /* mainWindow?.webContents?.send('crrentServer:change', server.id); */
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
        const logFile = `${v2rayLogsFolder}access.log`;
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
        const mainWindow = new Window().mainWin;
        mainWindow?.show();
      },
    },
    {
      label: 'Subscriptions...',
      click: () => {
        new Window('/index/servers').mainWin?.show();
        Window.createWindow(
          '/manage/subscription',
          {
            width: 800,
            height: 600,
            show: true,
          },
          {
            parentName: 'mainWindow',
            modalStatus: true,
          },
        );
      },
    },
    {
      label: 'PAC Settings...',
      click: () => {
        Window.createWindow('/manage/pac', {
          width: 800,
          height: 600,
          show: true,
        });
      },
    },
    {
      label: 'Connection Test...',
      // enabled: false,
      click: async () => {
        const getTcpPIngTest = async (i) => {
          const protocol = i.outbound.protocol;
          let host = '',
            port = '';
          if (protocol === 'vmess' || protocol === 'vless') {
            host = i.outbound.settings.vnext[0].address;
            port = i.outbound.settings.vnext[0].port;
          } else if (protocol === 'trojan') {
            host = i.outbound.settings.servers[0].address;
            port = i.outbound.settings.servers[0].port;
          }
          const res = await tcpPing({ host, port });
          i.latency = isNaN(res[0].ave) ? 'Timeout' : `${res[0].ave}ms`;
          return i;
        };
        const localServers = db.data.servers;
        const subscriptionList = db.data.subscriptionList;
        db.data.servers = await Promise.all(localServers.map(async (i) => await getTcpPIngTest(i)));
        db.data.subscriptionList = await Promise.all(
          subscriptionList.map(async (i) => {
            i.requestServers = await Promise.all(
              i.requestServers.map(async (j) => await getTcpPIngTest(j)),
            );
            return i;
          }),
        );
        await db.write();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Import Server From Pasteboard',
      click: async () => {
        new Window('/index/servers').mainWin?.show();
        const link = clipboard.readText();
        const factory = link.includes('vmess://')
          ? new VMess(link)
          : link.includes('vless://')
            ? new VLess(link)
            : link.includes('trojan://')
              ? new Trojan(link)
              : null;
        if (!factory) {
          new Notification({
            title: 'Import From Clipboard',
            body: 'Import Server Failed',
            silent: false,
          }).show();
          return;
        }
        const saveItem = {
          id: hash(factory.getOutbound()),
          link,
          ps: factory.getPs(),
          latency: '',
          outbound: factory.getOutbound(),
        };

        db.data = db.chain.set('servers', uniqBy([...db.data.servers, saveItem], 'id')).value();
        await db.write();
        new Notification({
          title: 'Import From Clipboard',
          body: 'Import Server Success',
          silent: false,
        }).show();
        // localStorage.setItem('serverAddOrEdit', 'add');
      },
    },
    {
      label: 'Scan QR Code From Screen',
      click: () => {
        new Window('/index/servers').mainWin?.show();
        Window.createWindow(
          '/servers/add',
          {
            title: 'Server Configuration',
            width: 800,
            height: 600,
            show: true,
          },
          { parentName: 'mainWindow', modalStatus: true },
        );
        // localStorage.setItem('serverAddOrEdit', 'add');
      },
      enabled: false,
    },
    {
      label: 'Share Link/QR Code',
      enabled: false,
      click: () => {
        Window.createWindow('/share/qrcode', {
          width: 420,
          height: 420,
          show: true,
        });
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Copy HTTP Proxy Shell Command',
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
      accelerator: 'CmdOrCtrl+,',
      click: () => new Window('/index/settings').mainWin?.show(),
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
    const currentServerId = db.chain.get('currentServerId').value()?.[0] ?? '';

    const proxyMode = db.data.settings.proxyMode;
    template[0].label = `v2ray-core: ${running ? 'On' : 'Off'} (v${app.getVersion()})`;
    template[1].label = `Turn v2ray-core ${running ? 'Off' : 'On'}`;
    template[1].enabled = currentServerId !== '';
    template[19].enabled = currentServerId !== '';

    // @ts-ignore
    const outbounds = flattenDeep([
      db.chain.get('servers').value(),
      db.chain
        .get('subscriptionList')
        .value()
        .map((i) => i.requestServers),
    ]);
    const outbound = find(outbounds, { id: currentServerId ?? '' })?.outbound;
    const serverTemplate = db.chain.get('serverTemplate').value();
    const v2rayLogsFolder = db.chain.get('management.generalSettings.v2rayLogsFolder').value();
    serverTemplate.log = {
      error: v2rayLogsFolder.concat('error.log'),
      loglevel: 'info',
      access: v2rayLogsFolder.concat('access.log'),
    };
    serverTemplate.outbounds = [outbound];
    const config = serverTemplate;
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
    const currentServerId = db.chain.get('currentServerId').value()?.[0] ?? '';
    const outbounds = flattenDeep([
      db.chain.get('servers').value(),
      db.chain
        .get('subscriptionList')
        .value()
        .map((i) => i.requestServers),
    ]);
    const pastePort = db.data.management.v2rayConfigure.inbounds[1].port ?? 10871;
    const serversSubMenu = outbounds.map((server: Server) => {
      return {
        label: server.latency
          ? `${server.latency === 'Timeout' ? 'Timeout' : server.latency}  ${server.ps}`
          : server.ps,
        type: 'radio',
        checked: server.id === currentServerId,
        enabled: false,
        click: async () => {
          // db.data = db.chain.set('currentServerId', [server.id]).value();
          // await db.write();
          // const mainWindow = new Window().mainWin;
          /* mainWindow?.webContents?.send('crrentServer:change', server.id); */
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
};
