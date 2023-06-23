import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: {
      electronAPI: IElectronAPI;
      store: {
        get: (key: string) => any;
        set: (key: string | JSON, val?: any) => void;
        delete: (key: string) => void;
      };
    };
    api: IElectronAPI;
    serverFiles: IElectronAPI;
    v2rayService: {
      startService: (data: JSON) => void;
      stopService: () => void;
    };
    update: {
      checkForUpdate: () => void;
      downloadUpdate: () => void;
      quitAndInstall: () => void;
    };
    clipboard: {
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
