import { ElectronAPI } from '@electron-toolkit/preload';
import { BrowserWindowConstructorOptions } from 'electron';

declare global {
  interface Window {
    db: {
      read: (key: string, query?: Object) => Promise<any>;
      write: (key: string, data: any) => Promise<any>;
    };
    win: {
      create: (suffix: string, winConfig?: BrowserWindowConstructorOptions, customConfig?) => void;
      close: (suffix: string) => void;
    };
    net: {
      request: (url: string, options?: any) => Promise<any>;
      tcpPing: ({ host: string, port: number }) => Promise<any>;
    };
    app: {
      getQRcodeFromScreenResources: () => Promise<any>;
    };
    quit: () => void;
    electron: {
      electronAPI: IElectronAPI;
    };
    api: IElectronAPI;
    serverFiles: IElectronAPI;
    v2rayService: {
      startService: (data?: any) => void;
      stopService: () => void;
      checkService: () => boolean | Promise<boolean>;
      updatePort: () => void;
    };
    update: {
      checkForUpdate: () => void;
      downloadUpdate: () => void;
      quitAndInstall: () => void;
    };
    clipboard: {
      read: () => string;
      paste: (data: string) => void;
      writeImage: (data: string) => void;
    };
    autoLaunch: {
      change: (status: boolean) => void;
    };
    proxyMode: {
      change: (status: string) => void;
    };
    notification: {
      send: (params: { title: string; body: string; silent: boolean }) => void;
    };
    mainConst: {
      get: (key: string) => void;
    };
    writeToFile: {
      write: (params: { path: string; content: string }) => void;
    };
  }
}
