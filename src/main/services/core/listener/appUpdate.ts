import { autoUpdater } from 'electron-updater';
import { validatedIpcMain } from '@lib/bridge';

const registerChannels = [
  {
    channel: 'update:checkForUpdate',
    listener: () => autoUpdater.checkForUpdatesAndNotify(),
  },
  {
    channel: 'update:downloadUpdate',
    listener: () => autoUpdater.downloadUpdate(),
  },
  {
    channel: 'update:quitAndInstall',
    listener: () => autoUpdater.quitAndInstall(),
  },
];

const mountChannels = (channels: any[]) => {
  channels.forEach(({ channel, listener }) => {
    validatedIpcMain.handle(`v2rayx:${channel}`, listener);
  });
};

export default () => mountChannels(registerChannels);
