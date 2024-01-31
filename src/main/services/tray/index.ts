import {
  app,
  nativeImage,
  shell,
  clipboard,
  Notification,
  NativeImage,
  MenuItemConstructorOptions,
} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import logger from '@lib/logs';
import db from '@lib/lowdb';
import emitter from '@lib/event-emitter';
import hash from 'object-hash';
import icon from '@resources/icon.png?asset';
import { isMacOS, isWindows, userPacConf, v2rayRuntimeConfigPath } from '@lib/constant';
import { autoUpdater } from 'electron-updater';
import { uniqBy, flattenDeep, findIndex, cloneDeep } from 'lodash';
import { Server, ServersGroup } from '@main/lib/constant/types';
import Window from '@services/browser';
import tcpPing from '@lib/utils/misc/tcpPing';
import { VMess, VLess, Trojan } from '@main/lib/utils/misc/protocol';
import { TraySingleton } from './Tray';
import { resourcesPath } from '@lib/constant';
import { Mode } from '@lib/constant/types';

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
    return this;
  }

  public async init() {
    await db.read();
    const mode = db.data.management.systemProxy.proxyMode;
    const autoStartProxy = db.data.management.generalSettings.autoStartProxy;
    const currentServerId = db.data.currentServerId?.[0] ?? '';
    const serviceRunningState = db.data.serviceRunningState;
    const service = new TraySingleton(this.icon);

    service.updateTemplate({
      id: '0',
      label: `v2ray-core: ${
        (currentServerId !== '' && autoStartProxy) || serviceRunningState ? 'On' : 'Off'
      } (v${app.getVersion()})`,
      enabled: false,
    });
    service.updateTemplate({
      id: '1',
      label: `Turn v2ray-core ${
        (currentServerId !== '' && autoStartProxy) || serviceRunningState ? 'Off' : 'On'
      }`,
      accelerator: 'CmdOrCtrl+t',
      enabled: currentServerId !== '',
      click: async () => {
        const shouldStop = (currentServerId !== '' && autoStartProxy) || serviceRunningState;
        emitter.emit(shouldStop ? 'v2ray:stop' : 'v2ray:start', '');
        const mainWindow = new Window().mainWin;
        mainWindow?.webContents?.send('v2ray:status', !shouldStop);
        db.data.serviceRunningState = !shouldStop;
        await db.write();
        emitter.emit('tray-v2ray:update', !shouldStop);
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
      label: 'PAC Mode',
      type: 'radio',
      checked: mode === 'PAC',
      click: async () => {
        db.data = db.chain.set('management.systemProxy.proxyMode', 'PAC').value();
        await db.write();
        const mainWindow = new Window('/index/home', {}, { whenReadyShow: false }).mainWin;
        mainWindow?.webContents.send('proxyMode:change', 'PAC');
        emitter.emit('proxyMode:change', 'PAC');
      },
    });
    service.updateTemplate({
      id: '6',
      label: 'Global Mode',
      type: 'radio',
      checked: mode === 'Global',
      click: async () => {
        db.data = db.chain.set('management.systemProxy.proxyMode', 'Global').value();
        await db.write();
        const mainWindow = new Window('/index/home', {}, { whenReadyShow: false }).mainWin;
        mainWindow?.webContents?.send('proxyMode:change', 'Global');
        emitter.emit('proxyMode:change', 'Global');
      },
    });
    service.updateTemplate({
      id: '7',
      label: 'Manual Mode',
      type: 'radio',
      checked: mode === 'Manual',
      click: async () => {
        db.data = db.chain.set('management.systemProxy.proxyMode', 'Manual').value();
        await db.write();
        const mainWindow = new Window('/index/home', {}, { whenReadyShow: false }).mainWin;
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
          height: 540,
          show: true,
        });
      },
    });
    service.updateTemplate({
      id: '12',
      label: 'Connection Test...',
      click: async () => {
        await db.read();
        db.data.serversGroups = await Promise.all(
          db.data.serversGroups.map(async (group) => {
            group.subServers = await Promise.all(
              group.subServers.map(async (i) => {
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
                const res = await tcpPing({ host, port: parseInt(port) });
                i.latency = isNaN(res[0].ave ?? NaN) ? 'Timeout' : `${res[0].ave}ms`;
                return i;
              }),
            );
            return group;
          }),
        );
        await db.write();
      },
    });
    service.updateTemplate({
      id: '13',
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
        const serversGroups = db.data.serversGroups;
        const saveItem: Server = {
          id: hash(factory.getOutbound()),
          link,
          ps: factory.getPs(),
          latency: '',
          speedTestType: '',
          group: 'localservers',
          groupId: hash('localservers', {
            algorithm: 'md5',
          }),
          outbound: factory.getOutbound(),
        };
        let newServersGroups: ServersGroup[] =
          serversGroups.length > 0
            ? cloneDeep(serversGroups)
            : [
                {
                  group: 'localservers',
                  groupId: hash('localservers', { algorithm: 'md5' }),
                  remark: 'Local Servers',
                  link: '',
                  speedTestType: 'icmp',
                  subServers: [saveItem],
                },
              ];
        // sort serversGroups make localservers group frist
        let idxOfLocalServersItem = findIndex(newServersGroups, { group: 'localservers' });
        if (idxOfLocalServersItem > -1) {
          newServersGroups = [
            newServersGroups[idxOfLocalServersItem],
            ...newServersGroups.filter((i) => i.group !== 'localservers'),
          ];
        } else {
          newServersGroups = [
            {
              group: 'localservers',
              groupId: hash('localservers', { algorithm: 'md5' }),
              remark: 'Local Servers',
              link: '',
              speedTestType: 'icmp',
              subServers: [saveItem],
            },
            ...newServersGroups,
          ];
          idxOfLocalServersItem = 0;
        }
        if (idxOfLocalServersItem > -1) newServersGroups[0].subServers.push(saveItem);
        newServersGroups = newServersGroups.map((i) => {
          const subServers = uniqBy(i.subServers, 'id');
          i.subServers = subServers;
          return i;
        });

        db.data.serversGroups = newServersGroups;
        await db.write();
        new Notification({
          title: 'Import From Clipboard',
          body: 'Import Server Success',
          silent: false,
        }).show();
        return;
      },
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
  public mountListener() {
    const service = new TraySingleton(this.icon);
    emitter.on('tray-mode:update', (mode: Mode) => {
      const [pac, global, manual] = [mode === 'PAC', mode === 'Global', mode === 'Manual'];
      service.updateTemplate({ id: '5', checked: pac });
      service.updateTemplate({ id: '6', checked: global });
      service.updateTemplate({ id: '7', checked: manual });
      service.refreshTray();
    });
    emitter.on('tray-v2ray:update', async (running: boolean) => {
      await db.read();
      const currentServerId = db.data.currentServerId?.[0] ?? '';
      service.updateTemplate({
        id: '0',
        label: `v2ray-core: ${running ? 'On' : 'Off'} (v${
          db.data.management.generalSettings.appVersion
        })`,
      });
      service.updateTemplate({
        id: '1',
        label: `Turn v2ray-core ${running ? 'Off' : 'On'}`,
        enabled: currentServerId !== '',
        click: async () => {
          emitter.emit(running ? 'v2ray:stop' : 'v2ray:start', '');
          const mainWindow = new Window().mainWin;
          mainWindow?.webContents?.send('v2ray:status', !running);
          db.data.serviceRunningState = !running;
          await db.write();
          emitter.emit('tray-v2ray:update', !running);
        },
      });
      service.updateTemplate({
        id: '15',
        enabled: currentServerId !== '',
      });
      service.refreshTray();
    });
    emitter.on('tray-servers:update', () => {
      const currentServerId = db.chain.get('currentServerId').value()?.[0] ?? '';
      const serversSubMenu = flattenDeep([
        ...db.data.serversGroups.map((group) => {
          return group.subServers.map((server: Server) => {
            return {
              label: server.latency
                ? `${server.latency === 'Timeout' ? 'Timeout' : server.latency}  ${server.ps}`
                : server.ps,
              type: 'radio' as 'radio' | 'normal' | 'separator' | 'submenu' | 'checkbox' | undefined,
              checked: server.id === currentServerId,
              enabled: false,
              click: async () => {
                db.data = db.chain.set('currentServerId', [server.id]).value();
                await db.write();
              },
            };
          });
        }),
      ]);
      service.updateTemplate({
        id: '8',
        label: 'Servers...',
        submenu: serversSubMenu,
      });
      service.refreshTray();
    });
    emitter.on('tray-pastedPort:update', (port: number) => {
      this.pastePort = port;
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
      service.refreshTray();
    });
  }
}
