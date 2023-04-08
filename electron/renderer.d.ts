export interface IElectronAPI {
  openFile: () => Promise<void>;
}

declare global {
  interface Window {
    serverFiles: IElectronAPI;
    v2rayService: {
      startService: () => void;
      stopService: () => void;
    };
  }
}
