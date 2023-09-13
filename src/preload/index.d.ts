import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    db: {
      read: (key: string, query?: Object) => Promise<any>;
      write: (key: string, data: any) => Promise<any>;
    };
    quit: () => void;
    electron: {
      electronAPI: IElectronAPI;
    };
    api: IElectronAPI;
    serverFiles: IElectronAPI;
    v2rayService: {
      startService: (data: any) => void;
      stopService: () => void;
      checkService: () => boolean | Promise<boolean>;
    };
    update: {
      checkForUpdate: () => void;
      downloadUpdate: () => void;
      quitAndInstall: () => void;
    };
    clipboard: {
      read: () => string;
      paste: (data: string) => void;
    };
    autoLaunch: {
      change: (status: boolean) => void;
    };
    proxyMode: {
      change: (status: string) => void;
    };
  }
}
