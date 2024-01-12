import { ElectronApp } from '@lib/app';
import appUpdater from '@main/services/auto-update';
import { autoUpdater } from 'electron-updater';
import { createTray } from '@main/services/tray';
import { CronJob } from 'cron';
import logger from '@main/lib/logs';
import db from '@main/lib/lowdb';
import emitter from '@lib/event-emitter';
import { TrayService } from '@main/services/tray';
import { flattenDeep } from 'lodash';
import { Server } from '@main/lib/constant/types';

const tasks: Array<(electronApp: ElectronApp) => void> = [];

const loadTray = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('Loading Tray', async (app, callback) => {
    console.log('hooks: >> Load Tray Plugins');
    await db.read();
    const v2rayLogsFolder = db.data.management.generalSettings.v2rayLogsFolder;
    const pastePort = db.data.management.v2rayConfigure.inbounds[1].port;
    const icon = db.data.management.appearance.enhancedTrayIcon;
    const currentServerId = db.data.currentServerId?.[0] ?? '';

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
              // const mainWindow = new Window().mainWin;
              // mainWindow?.webContents?.send('crrentServer:change', server.id);
              // emitter.emit('currentServer:change', server.id);
            },
          };
        });
      }),
    ]);
    if (!db.data.management.appearance.hideTrayBar) {
      const tray = new TrayService({
        v2rayLogsFolder,
        pastePort,
        icon,
        serversSubMenu,
      });
      tray.init();
      tray.mountListener();
      db.data.management.generalSettings.autoStartProxy &&
        emitter.emit(
          'tray-v2ray:update',
          ((db.data.currentServerId?.[0] ?? '') !== '' &&
            db.data.management.generalSettings.autoStartProxy) ||
            db.data.serviceRunningState,
        );
    }

    callback();
  });
};

const syncAppVersionToDb = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('Loading AppVersion to DB', async (app, callback) => {
    console.log('hooks: >> Load App Version to DB');
    await db.read();
    db.data = db.chain.set('management.generalSettings.appVersion', app.getVersion()).value();
    // each time write something to lowdb, we have to write await db.write() weird bug for lowdb
    await db.write();
    callback();
  });
};

const loadAppUpdater = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('Loading AppUpdater', async (app, callback) => {
    console.log('hooks: >> Load AppUpdater Plugins');
    appUpdater();
    callback();
  });
};

const loadCron = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('loadingCron', async (app, callback) => {
    console.log('hooks: >> Load App Check Update Timer Plugins');
    // TODO: release version add it
    // global.cronJob = new CronJob(
    //   '0 0 0 */2 * *', // cronTime
    //   function () {
    //     logger.info('You will see this message every two days and checkForUpdates');
    //     autoUpdater.checkForUpdates();
    //   }, // onTick
    //   null, // onComplete
    //   true, // start
    // );
    // autoUpdater.checkForUpdates();
    // sync appVersion to db
    callback();
  });
};

tasks.push(syncAppVersionToDb, loadTray, loadAppUpdater, loadCron);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
