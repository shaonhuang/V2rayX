import logger from '@lib/logs';
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { join } from 'node:path';
import { is } from '@electron-toolkit/utils';
import icon from '@resources/icon.png?asset';
import db from '@main/lib/lowdb';
import { WindowCustomConfig } from '@lib/constant/types';

const preloadPath = join(__dirname, '../preload/index.mjs');

// Check if two BrowserWindow instances are the same
const areWindowsEqual = (win1: BrowserWindow, win2?: BrowserWindow) => win1.id === win2?.id;

export default class Window {
  private static instance: Window;
  mainWin?: BrowserWindow;
  constructor(
    suffix: string = '/index/home',
    options?: BrowserWindowConstructorOptions,
    customConfig?: WindwoCustomConfig,
  ) {
    if (!Window.instance) {
      logger.info(`${'Main'} Window is null, create one`);
      this.mainWin = Window.createWindow(suffix, options, customConfig);
      Window.instance = this;
    } else {
      if (
        BrowserWindow.getAllWindows().findIndex((win) =>
          areWindowsEqual(win, Window.instance.mainWin),
        ) < 0
      ) {
        Window.instance.mainWin = Window.createWindow(suffix, options, customConfig);
      } else {
        if (suffix !== '/index/home') {
          Window.instance.mainWin?.close();
          Window.instance.mainWin = Window.createWindow(suffix, options, customConfig);
        }
      }
    }
    return Window.instance;
  }
  static createWindow(
    suffix: string = '/index/home',
    options?: BrowserWindowConstructorOptions,
    customConfig?: WindowCustomConfig,
  ): BrowserWindow {
    const parentName = customConfig?.parentName;
    const modalStatus = customConfig?.modalStatus;
    const window = new BrowserWindow({
      title: 'V2RayX',
      width: 900,
      height: 670,
      show: false,
      icon: icon,
      closable: true,
      autoHideMenuBar: true,
      transparent: true,
      titleBarOverlay: true,
      vibrancy: 'appearance-based',
      visualEffectState: 'active',
      titleBarStyle: 'hiddenInset',
      ...(process.platform === 'linux' ? { icon } : {}),
      ...(parentName === 'mainWindow'
        ? { parent: Window.instance.mainWin, ...(modalStatus ? { modal: modalStatus } : {}) }
        : {}),
      webPreferences: {
        preload: preloadPath,
        sandbox: false,
        devTools: is.dev,
      },
      ...options,
    });
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      const urlObj = new URL(`${'#' + suffix}`, process.env['ELECTRON_RENDERER_URL']);
      window.loadURL(urlObj.href);
    } else {
      window.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: suffix,
      });
    }
    // when deinited customConfig.whenReadyShow gernerally false state or just go as default startup settings required.
    (customConfig?.whenReadyShow ?? true) &&
      db.read().then(() => {
        db.data.management.generalSettings.dashboardPopWhenStart &&
          window.once('ready-to-show', () => {
            window.show();
          });
      });

    return window;
  }
}
