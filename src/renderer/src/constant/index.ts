const version = window.electron.store.get('appVersion');
const platform = window.electron.electronAPI.process.platform;
export {
  version,
  platform
}
