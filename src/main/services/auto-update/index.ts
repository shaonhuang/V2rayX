import { convert } from 'html-to-text';
import { is } from '@electron-toolkit/utils';
import { validatedIpcMain } from '@lib/bridge';
import { isMacOS } from '@lib/constant';
import logger from '@lib/logs';
import db from '@lib/lowdb';
import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import ProgressBar from 'electron-progressbar';
import Window from '@services/browser';

type UpdateInfo = {
  files: UpdateFile[];
  level: string;
  message: string;
  path: string;
  releaseDate: string;
  releaseName: string;
  releaseNotes: string;
  sha512: string;
  tag: string;
  version: string;
};

type UpdateFile = {
  sha512: string;
  size: number;
  url: string;
};
const AppUpdater = () => {
  let progressBar: ProgressBar | null = null;
  let checkForUpdateClick = false;
  const mainWindow = new Window().mainWin;

  autoUpdater.autoDownload = false;
  autoUpdater.logger = logger;

  if (is.dev) {
    // Useful for some dev/debugging tasks, but download can
    // not be validated becuase dev app is not signed
    // autoUpdater.updateConfigPath = join(__dirname, '../../dev-app-update.yml');
    autoUpdater.forceDevUpdateConfig = true;
  }
  autoUpdater.allowPrerelease = true;
  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for update...');
  });

  autoUpdater.on('update-available', async (info) => {
    const { tag, releaseNotes } = info as UpdateInfo;
    logger.info('Update available.', info);
    db.data = db.chain.set('updateAvailableVersion', info.version).value();
    await db.write();
    if (checkForUpdateClick && (!isMacOS || is.dev)) {
      dialog
        .showMessageBox({
          type: 'info',
          title: `Found Updates${tag ? ' ' + tag : ''}`,
          message: convert(
            releaseNotes ?? `Found updates${tag ? ' ' + tag : ''}, do you want to update now?`,
          ),
          buttons: ['Sure', 'No'],
        })
        .then((buttonIndex) => {
          logger.info('buttonIndex', buttonIndex);
          if (buttonIndex.response === 0) {
            autoUpdater.downloadUpdate();
            progressBar = null;
            progressBar = new ProgressBar({
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
          }

          progressBar.on('progress', (value: number) => {
            const maxValue = progressBar.getOptions().maxValue;
            const percentage = Math.round((value / maxValue) * 100);

            progressBar.detail = `Downloading ${percentage}%...`;
          });

          progressBar.on('completed', () => {});
        });
    }
  });

  autoUpdater.on('update-not-available', async (info) => {
    logger.info('Update not available.', info);
    db.data = db.chain.set('updateAvailableVersion', info.version).value();
    await db.write();
    if (checkForUpdateClick) {
      dialog.showMessageBox({
        title: 'Updates not found',
        message: 'Current version is up-to-date.',
      });
    }
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
    progressBar.detail = 'Download complete!';
    progressBar.setCompleted();
    setTimeout(() => {
      progressBar.close();
    }, 1000);
    setTimeout(() => {
      dialog
        .showMessageBox({
          title: 'Updating V2rayX',
          message: 'Updates downloaded, application will be quit for update...',
        })
        .then(() => {
          setImmediate(() => autoUpdater.quitAndInstall());
        });
    }, 2000);
  });
  validatedIpcMain.on('v2rayx:checkForUpdateClick', (_) => {
    checkForUpdateClick = true;
  });

  const checkForUpdates = () => {
    logger.info('call for checking update');
    return autoUpdater.checkForUpdates();
  };
  /*   checkForUpdates(); */
};

export default AppUpdater;
