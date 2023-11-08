import { BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '@resources/icon.png?asset';

export default function createServerWindow(): BrowserWindow {
  const preloadPath = join(__dirname, '../preload/index.js');

  const window = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    icon,
    webPreferences: {
      preload: preloadPath,
      devTools: is.dev,
    },
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}
