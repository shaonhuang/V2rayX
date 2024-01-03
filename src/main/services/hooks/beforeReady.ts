import path from 'node:path';
import os from 'node:os';
import * as Sentry from '@sentry/electron';
import logger from '@lib/logs';
import { ElectronApp } from '@lib/app';
import { checkEnvFiles as check, copyDir, chmod } from '@lib/utils/misc/utils';
import { appDataPath, platform, pathRuntime, pathExecutable, pacDir, binDir } from '@lib/constant';
import { is } from '@electron-toolkit/utils';
import { Install } from '@main/services/install';

import ThemeService from '@main/services/theme';
import * as fs from 'fs-extra';
import { resolve } from 'node:path';
import { PacServer as PS } from '@lib/proxy/pac';
import { mountListeners } from '../core/listener';
import { binPath, pacPath, v2rayDir, v2rayPackagePath } from '@lib/constant';

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
      {
        _path: v2rayDir,
        isDir: true,
        checkEmpty: true,
        exec: () => {
          logger.info(`copyDir: ${v2rayPackagePath} -> ${v2rayDir}`);
          // check v2ray package install status
          const install = Install.createInstall(process.platform);
          install.installV2ray();
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

const injectSentryMonitor = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'injectSentryMonitor', () => {
    if (is.dev) {
      console.log('hooks: >> uncaughtException');
      // 未捕获的全局错误
      process.on('uncaughtException', (err) => {
        console.error('<---------------');
        console.log(err);
        console.error('--------------->');
      });
    } else {
      // 错误上报
      console.log('hooks: >> injectSentryMonitor');
      Sentry.init({
        dsn: 'https://e6252cd56d7cb6799154b451d4305b23@o4505950688575488.ingest.sentry.io/4505950692900864',
      });
    }
  });
};

tasks.push(
  checkEnvFiles,
  chmodFiles,
  checkPlatform,
  listenTheme,
  setupListeners,
  setupSysProxy,
  injectSentryMonitor,
);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
