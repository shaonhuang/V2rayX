import logger from '@lib/logs';
import { net } from 'electron';
import db from '@lib/lowdb';
import fs from 'node:fs';
import {
  IpcMainEvent,
  app,
  clipboard,
  nativeTheme,
  BrowserWindowConstructorOptions,
  Notification,
  nativeImage,
} from 'electron';
import emitter from '@lib/event-emitter';
import { is } from '@electron-toolkit/utils';
import { BrowserWindow } from 'electron';
import { validatedIpcMain } from '@lib/bridge';
import Window from '@main/services/browser';
import tcpPing from '@lib/utils/misc/tcpPing';
// import { getQrCodeFromScreenResources } from '../misc';

import logListeners from './logs';
import v2rayListeners from './v2ray';
import updateListeners from './appUpdate';
import * as constVariables from '@lib/constant';

const registerChannels = [
  {
    channel: 'app:quit',
    listener: () => app.quit(),
  },
  {
    channel: 'clipboard:read',
    listener: () => clipboard.readText(),
  },
  {
    channel: 'clipboard:paste',
    listener: (_: IpcMainEvent, data: string) => clipboard.writeText(data),
  },
  {
    channel: 'clipboard:writeImage',
    listener: (_: IpcMainEvent, data: string) =>
      clipboard.writeImage(nativeImage.createFromDataURL(data)),
  },
  {
    channel: 'db:read',
    listener: async (_: IpcMainEvent, key) => {
      await db.read();
      const value = db.chain.get(key).value();
      return value;
    },
  },
  {
    channel: 'db:write',
    listener: async (_: IpcMainEvent, key, data) => {
      try {
        db.data[key] = data;
        return await db.write();
      } catch (error) {
        logger.error(error);
      }
    },
  },
  {
    channel: 'autoLaunch:change',
    listener: (_: IpcMainEvent, status: boolean) => {
      try {
        app.setLoginItemSettings({ openAtLogin: status });
        logger.info(`successfully setLoginItemSettings to ${status}`);
      } catch (e) {
        logger.error(`fail to setLoginItemSettings to ${status}`);
      }
    },
  },
  {
    channel: 'window:create',
    listener: (
      _: IpcMainEvent,
      suffix: string,
      winConfig?: BrowserWindowConstructorOptions,
      customConfig?,
    ) => {
      try {
        logger.info(`v2rayx:window:create-url:${suffix}, ${winConfig}, ${customConfig}`);
        const configWin = Window.createWindow(suffix, winConfig, customConfig);
        is.dev && configWin.webContents.openDevTools();
      } catch (e) {
        logger.error(`v2rayx:window:create-url:${suffix} failed`);
      }
    },
  },
  {
    channel: 'window:close',
    listener: (_: IpcMainEvent, suffix: string) => {
      try {
        const allWindows = BrowserWindow.getAllWindows();
        // allWindows[0].close();
        // allWindows.find((win) => win.title === 'Server Configuration')?.close();
        logger.info(`v2rayx:window:close-url:${suffix}`);
      } catch (e) {
        logger.error(`v2rayx:window:close-url:${suffix} failed`);
      }
    },
  },
  {
    channel: 'net:request',
    listener: (_: IpcMainEvent, url: string, options?: any) => {
      return new Promise((resolve, reject) => {
        try {
          const request = net.request(url);
          request.on('response', (response) => {
            let res = '';
            console.log(`STATUS: ${response.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
            response.on('data', (chunk) => {
              console.log(`BODY: ${chunk}`);
              res += chunk;
            });
            response.on('end', () => {
              resolve(res);
              console.log('No more data in response.');
            });
          });
          request.end();
        } catch (error) {
          logger.error(error);
          reject(error);
        }
      });
    },
  },
  {
    channel: 'net:tcpPing',
    listener: (_: IpcMainEvent, params: { host: string; port: number }) => {
      return new Promise((resolve) => {
        tcpPing({
          host: params.host,
          port: params.port,
        }).then(([result, records]) => {
          resolve({
            code: 200,
            result: {
              ...result,
              records: records,
            },
          });
        });
      });
    },
  },
  {
    channel: 'screen:qrCode',
    listener: async () => {
      try {
        // return await getQrCodeFromScreenResources();
      } catch (error) {
        logger.error(error);
      }
    },
  },
  {
    channel: 'notification:send',
    listener: async (e, params: { title: string; body: string; silent: boolean }) => {
      new Notification({
        title: params.title,
        body: params.body,
        silent: params.silent,
      }).show();
    },
  },
  {
    channel: 'mainConst:get',
    listener: (e, key: string) => {
      return constVariables[key];
    },
  },
  {
    channel: 'writeToFile:write',
    listener: (e, params: { path: string; content: string }) => {
      if (fs.existsSync(params.path)) {
        fs.writeFile(params.path, params.content, 'utf8', (err) => {
          if (err) {
            console.error('Error writing file:', err);
            return;
          }

          console.log('File updated successfully.');
        });
      } else {
        logger.info(`path:${params.path} do not exist`);
      }
    },
  },
];

validatedIpcMain.on('v2rayx:appearance:system', (event) => {
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  event.reply('appearance:system:fromMain', isDarkMode ? 'dark' : 'light');
});

validatedIpcMain.on('v2rayx:settings:getDefaultLogDir', (event) => {
  event.reply('settings:getDefaultLogDir:fromMain', app.getPath('logs'));
});

validatedIpcMain.on(
  'v2rayx:settings:setAppLogsDir',
  (_: IpcMainEvent, applicationLogsDir: string) => {
    console.log(applicationLogsDir);
  },
);

validatedIpcMain.on('v2rayx:service:selected', (_) => {
  emitter.emit('tray-v2ray:update', false);
  emitter.emit('tray-servers:update', _);
});

validatedIpcMain.on('v2rayx:service:empty', (_) => {
  emitter.emit('tray-v2ray:update', false);
  emitter.emit('tray-servers:update', _);
});

validatedIpcMain.on('v2rayx:server:add/edit:toMain', (_, serverItem: any) => {
  const mainWindow = BrowserWindow.getAllWindows()[1];
  mainWindow?.webContents.send('v2rayx:server:add/edit:fromMain', serverItem);
});

validatedIpcMain.on('v2rayx:server:subscription:update:toMain', (_) => {
  const mainWindow = new Window().mainWin;
  mainWindow?.webContents.send('v2rayx:server:subscription:update:fromMain');
});

validatedIpcMain.on('v2rayx:restart-app', () => {
  app.relaunch();
  app.quit();
});

const mountChannels = (channels: any[]) => {
  channels.forEach(({ channel, listener }) => {
    validatedIpcMain.handle(`v2rayx:${channel}`, listener);
  });
};
export const mountListeners = () => {
  // inject file listener
  logListeners();
  v2rayListeners();
  updateListeners();

  mountChannels(registerChannels);
};
