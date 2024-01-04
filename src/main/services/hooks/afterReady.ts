import { ElectronApp } from '@lib/app';
import appUpdater from '@main/services/auto-update';
import { autoUpdater } from 'electron-updater';
import { createTray } from '@main/services/tray';
import { CronJob } from 'cron';
import logger from '@main/lib/logs';
import db from '@main/lib/lowdb';
import { TrayService } from '@main/services/tray';

const tasks: Array<(electronApp: ElectronApp) => void> = [];

const loadTray = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('loadingTray', async (app, callback) => {
    console.log('hooks: >> load Tray Plugins');
    // db.data.management.appearance.hideTrayBar || createTray();
    //     v2rayLogsFolder: string;
    // pastePort: number;
    // serversSubMenu: MenuItemConstructorOptions[];
    // icon?: string;
    const v2rayLogsFolder = db.data.management.generalSettings.v2rayLogsFolder;
    const pastePort = db.data.management.v2rayConfigure.inbounds[1].port;
    const icon = db.data.management.appearance.enhancedTrayIcon;
    const serversSubMenu = [];
    if (!db.data.management.appearance.hideTrayBar) {
      console.log('tray start')
      new TrayService({
        v2rayLogsFolder,
        pastePort,
        icon,
        serversSubMenu,
      }).init();
    }

    callback();
  });
};

const loadAppUpdater = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('loadingAppUpdater', async (app, callback) => {
    console.log('hooks: >> load AppUpdater Plugins');
    appUpdater();
    callback();
  });
};

const loadCron = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('loadingCron', async (app, callback) => {
    console.log('hooks: >> load App Check Update Timer Plugins');
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
    autoUpdater.checkForUpdates();
    callback();
  });
};

tasks.push(loadTray, loadAppUpdater, loadCron);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
