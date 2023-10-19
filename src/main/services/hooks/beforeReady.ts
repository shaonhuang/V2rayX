import path from 'path';
import os from 'os';

import logger from '@lib/logs';
import { ElectronApp } from '@main/app';
import { checkEnvFiles as check, copyDir, chmod } from '@lib/utils/misc/utils';
import { appDataPath, platform, pathRuntime, pathExecutable, pacDir, binDir } from '@lib/constant';
import { BrowserWindow, IpcMainEvent, app, clipboard, ipcMain, nativeTheme } from 'electron';

import ThemeService from '@main/services/theme';
import * as fs from 'fs-extra';
import { resolve } from 'path';
import { PacServer as PS } from '@lib/proxy/pac';
import db from '@main/lib/lowdb';
import { mountListeners } from '../core/listener';

const binPath = path.join(__dirname, '../../resources/bin').replace('app.asar', 'app.asar.unpacked');
const pacPath = path.join(__dirname, '../../resources/pac').replace('app.asar', 'app.asar.unpacked');

const tasks: Array<(electronApp: ElectronApp) => void> = [];

const checkEnvFiles = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'checkEnvFiles', () => {
    console.log('hooks: >> checkEnvFiles');
    check([
      { _path: appDataPath, isDir: true },
      ...(platform === 'linux' ? [{ _path: `${os.homedir}/.config/autostart`, isDir: true }] : []),
      { _path: pathRuntime, isDir: true },
      {
        _path: binDir,
        isDir: true,
        checkEmpty: true,
        exec: () => {
          logger.info(`copyDir: ${binPath} -> ${binDir}`);
          copyDir(binPath, binDir);
        },
      },
      {
        _path: pacDir,
        isDir: true,
        checkEmpty: true,
        exec: () => {
          logger.info(`copyDir: ${pacPath} -> ${pacDir}`);
          copyDir(pacPath, pacDir);
        },
      },
    ]);
  });
};

const chmodFiles = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'chmodFiles', () => {
    console.log('hooks: >> chmodFiles');
    chmod(path.join(pathRuntime, 'bin'), 0o711);
  });
};

const checkPlatform = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'checkPlatform', (app: Electron.App) => {
    console.log('hooks: >> checkPlatform');
    if (platform === 'linux') {
      try {
        app.disableHardwareAcceleration();
      } catch (error) {
        console.log(error);
      }
    }
  });
};

const listenTheme = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'listenTheme', () => {
    console.log('hooks: >> listenTheme');
    const theme = new ThemeService();
    theme.listenForUpdate();
  });
};

const setupListeners = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'setupListeners', () => {
    console.log('hooks: >> setupListeners');
    mountListeners();
  });
};

const setupPACFile = async () => {
  try {
    const firstRun = !(await fs.pathExists(resolve(pacDir, 'pac.txt')));

    if (!firstRun) {
      return;
    }

    logger.info('First run detected');

    const data = await fs.readFile(resolve(pacDir, 'gfwlist.txt'));
    const text = data.toString('ascii');
    await PS.generatePacWithoutPort(text);
  } catch (err) {
    logger.error((err as any).message ?? err);
  }
};

const setupSysProxy = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'setupProxy', () => {
    console.log('hooks: >> setupSysProxy');
    setupPACFile();
  });
};

tasks.push(checkEnvFiles, chmodFiles, checkPlatform, listenTheme, setupListeners, setupSysProxy);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
