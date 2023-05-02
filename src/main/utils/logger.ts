import path from 'path';
import { app } from 'electron';
const userDataPath = app.getPath('userData');
import log4js from 'log4js';

const initLogger = () => {
  log4js.configure({
    appenders: {
      mainProcess: {
        type: 'fileSync',
        filename: path.join(userDataPath, 'logs', 'main-process.log'),
        alwaysIncludePattern: true,
        pattern: '-yyyy-MM-dd',
        daysToKeep: 1,
      },
      appUpdater: {
        type: 'fileSync',
        filename: path.join(userDataPath, 'logs', 'app-updater.log'),
        alwaysIncludePattern: true,
        pattern: '-yyyy-MM-dd',
        daysToKeep: 1,
      },
    },
    categories: { default: { appenders: ['mainProcess', 'appUpdater'], level: 'debug' } },
  });
};
export default initLogger;
