import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: unknown;
    serverFiles: IElectronAPI;
    v2rayService: {
      startService: () => void;
      stopService: () => void;
    };
    store: {
      get: (key: string) => any;
      set: (key: string, val: any) => void;
      setServer: (val: JSON) => void;
    };
  }
}
