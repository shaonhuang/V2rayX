import { dialog } from 'electron';
import logger from '@main/utils/logs';
import { autoUpdater } from 'electron-updater';

const AppUpdater = (mainWindow) => {
  autoUpdater.autoDownload = false;
  autoUpdater.logger = logger;
  // if (process.env.NODE_ENV === 'development') {
  //   console.log(path.join(__dirname, '../../dev-app-update.yml'));
  //   autoUpdater.setFeedURL(path.join(__dirname, '../../dev-app-update.yml'));
  // }
  autoUpdater.allowPrerelease = true;
  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    logger.info('Update available.', info);
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Found Updates',
        message: 'Found updates, do you want update now?',
        buttons: ['Sure', 'No'],
      })
      .then((buttonIndex) => {
        logger.info('buttonIndex', buttonIndex);
        if (buttonIndex.response === 0) {
          autoUpdater.downloadUpdate();
        } else {
        }
      });
  });

  autoUpdater.on('update-not-available', (info) => {
    logger.info('Update not available.', info);
    mainWindow.webContents.send('update-available', false);
    dialog.showMessageBox({
      title: 'Updates not found',
      message: 'Current version is up-to-date.',
    });
  });

  autoUpdater.on('error', (err) => {
    logger.error('Error checking for update:', ['err', err]);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    logger.info(`Download progress: ${progressObj.percent}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded:', info.version);
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
    logger.info('call check update');
    return autoUpdater.checkForUpdates();
  };
  checkForUpdates();
};

export default AppUpdater;
