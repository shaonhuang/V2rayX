import { ElectronApp } from '@lib/app';
import appUpdater from '@main/services/auto-update';
import { autoUpdater } from 'electron-updater';
import { createTray } from '@main/services/tray';
import { CronJob } from 'cron';
import logger from '@main/lib/logs';
import db from '@main/lib/lowdb';

const tasks: Array<(electronApp: ElectronApp) => void> = [];

const loadTray = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncWhenReady('loadingTray', async (app, callback) => {
    console.log('hooks: >> load Tray Plugins');
    db.data.management.appearance.hideTrayBar || createTray();
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
