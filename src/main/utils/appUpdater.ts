import { dialog } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import log4js from 'log4js';

const log = log4js.getLogger('appUpdater');

const AppUpdater = (mainWindow) => {
  autoUpdater.autoDownload = false;
  autoUpdater.logger = log;
  // if (process.env.NODE_ENV === 'development') {
  //   console.log(path.join(__dirname, '../../dev-app-update.yml'));
  //   autoUpdater.setFeedURL(path.join(__dirname, '../../dev-app-update.yml'));
  // }
  autoUpdater.allowPrerelease = true;
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info);
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Found Updates',
        message: 'Found updates, do you want update now?',
        buttons: ['Sure', 'No'],
      })
      .then((buttonIndex) => {
        log.info('buttonIndex', buttonIndex);
        if (buttonIndex.response === 0) {
          autoUpdater.downloadUpdate();
        } else {
        }
      });
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info);
    mainWindow.webContents.send('update-available', false);
    dialog.showMessageBox({
      title: 'Updates not found',
      message: 'Current version is up-to-date.',
    });
  });

  autoUpdater.on('error', (err) => {
    log.error('Error checking for update:', ['err', err]);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download progress: ${progressObj.percent}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    mainWindow.webContents.send('update-available', true);
    dialog
      .showMessageBox({
        title: 'Install Updates',
        message: 'Updates downloaded, application will be quit for update...',
      })
      .then(() => {
        setImmediate(() => autoUpdater.quitAndInstall());
      });
  });

  const checkForUpdates = () => {
    log.info('call check update');
    return autoUpdater.checkForUpdates();
    // autoUpdater.checkForUpdatesAndNotify();
  };
  checkForUpdates();
};

export default AppUpdater;
