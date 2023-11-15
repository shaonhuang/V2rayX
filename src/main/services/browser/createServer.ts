import { BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '@resources/icon.png?asset';

export default function createServerWindow(suffix: string): BrowserWindow {
  const preloadPath = join(__dirname, '../preload/index.js');

  const window = new BrowserWindow({
    title: 'Server Configuration',
    width: 800,
    height: 600,
    show: true,
    icon,
    transparent: true,
    vibrancy: 'light',
    visualEffectState: 'active',
    autoHideMenuBar: true,
    titleBarOverlay: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      devTools: is.dev,
    },
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const urlObj = new URL(`${'#' + suffix}`, process.env['ELECTRON_RENDERER_URL']);
    window.loadURL(urlObj.href);
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: suffix,
    });
  }

  return window;
}
