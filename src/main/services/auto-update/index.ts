import { dialog } from 'electron';
import logger from '@lib/logs';
import { autoUpdater } from 'electron-updater';
const ProgressBar = require('electron-progressbar');

const AppUpdater = (mainWindow) => {
  const progressBar = new ProgressBar({
    indeterminate: false,
    title: 'Download Progress',
    text: 'Downloading...',
    detail: 'Preparing download...',
    browserWindow: {
      webPreferences: {
        nodeIntegration: true,
      },
      parent: mainWindow, // Replace mainWindow with your app's main window reference
      modal: true,
      closable: false,
    },
  });

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

    const progressPercent = Math.round(progressObj.percent);
    progressBar.value = progressPercent;
    progressBar.detail = `Downloading... ${progressPercent}%`;
  });

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded:', info.version);
    mainWindow.webContents.send('update-available', true);
    progressBar.detail = 'Download complete!';
    progressBar.setCompleted();
    setTimeout(() => {
      progressBar.close();
    }, 1000);
    setTimeout(() => {
      dialog
        .showMessageBox({
          title: 'Install Updates',
          message: 'Updates downloaded, application will be quit for update...',
        })
        .then(() => {
          setImmediate(() => autoUpdater.quitAndInstall());
        });
    }, 2000);
  });

  const checkForUpdates = () => {
    logger.info('call check update');
    return autoUpdater.checkForUpdates();
  };
  checkForUpdates();
};

export default AppUpdater;
