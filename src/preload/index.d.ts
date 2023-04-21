import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: {
      store: {
        get: (key: string) => any;
        set: (key: string | JSON, val: any | undefined) => void;
        delete: (key: string) => void;
      };
    };
    api: unknown;
    serverFiles: IElectronAPI;
    serverToFiles: IElectronAPI;
    v2rayService: {
      startService: (fileName:string) => void;
      stopService: () => void;
    };
  }
}
