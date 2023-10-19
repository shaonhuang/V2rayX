import { nativeTheme } from 'electron';
import { ServiceResult, ThemeService as ThemeServiceType } from '@lib/constant/types';
import { debounce } from 'lodash';
import { mainWindow } from '@main/index';

const updateTheme = debounce<boolean[]>((isDarkMode: boolean) => {
  // FIXME
  mainWindow?.webContents.send('appearance:system:fromMain', isDarkMode ? 'dark' : 'light');
}, 300);

export default class ThemeService implements ThemeServiceType {
  private static instance: ThemeService;
  constructor() {
    if (!ThemeService.instance) {
      ThemeService.instance = this;
    }
    return ThemeService.instance;
  }
  private updateTheme() {
    updateTheme(nativeTheme.shouldUseDarkColors);
  }
  listenForUpdate(): Promise<ServiceResult> {
    return new Promise((resolve) => {
      nativeTheme.off('updated', this.updateTheme);
      nativeTheme.on('updated', this.updateTheme);
      resolve({
        code: 200,
        result: null,
      });
    });
  }
  unlistenForUpdate(): Promise<ServiceResult> {
    return new Promise((resolve) => {
      nativeTheme.off('updated', this.updateTheme);
      resolve({
        code: 200,
        result: null,
      });
    });
  }
  getSystemThemeInfo(): Promise<ServiceResult> {
    return new Promise((resolve) => {
      resolve({
        code: 200,
        result: {
          shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
          shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
          shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme,
        },
      });
    });
  }
}

// nativeTheme.on('updated', async () => {
//   await db.read();
//   const appearance = db.chain.get('settings.appearance').value();
//   if (appearance === 'system') {
//     const isDarkMode = nativeTheme.shouldUseDarkColors;
//     const mainWindow = BrowserWindow.getAllWindows()[0];
//     mainWindow?.webContents?.send('appearance:system:fromMain', isDarkMode ? 'dark' : 'light');
//   }
// });
