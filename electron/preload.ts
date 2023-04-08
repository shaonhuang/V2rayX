import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('serverFiles', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
});

contextBridge.exposeInMainWorld('v2rayService', {
  startService: () => ipcRenderer.invoke('v2ray:start'),
  stopService: () => ipcRenderer.invoke('v2ray:stop'),
});
