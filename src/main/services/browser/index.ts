import { BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '@resources/icon.png?asset';
import createServerWindow from './createServer';

function createWindow(): BrowserWindow {
  const preloadPath = join(__dirname, '../preload/index.js');

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'V2RayX',
    width: 900,
    height: 670,
    show: false,
    icon: icon,
    autoHideMenuBar: true,
    transparent: true,
    titleBarOverlay: true,
    vibrancy: 'light',
    visualEffectState: 'active',
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      devTools: is.dev,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}
// FIXME:temporary naming createServerWindow
export { createWindow, createServerWindow };
