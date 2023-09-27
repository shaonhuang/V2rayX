import beforeReady from './beforeReady';
// copy code is not ready to use
// import afterReady from './afterReady';
// import ready from './ready';
import beforeQuit from './beforeQuit';
import { ElectronApp } from '@main/app';

export default (electronApp: ElectronApp) => {
  beforeReady(electronApp);
  // ready(electronApp);
  // afterReady(electronApp);
  beforeQuit(electronApp);
};
