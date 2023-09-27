import { ElectronApp } from '@main/app';
import emitter from '@lib/event-emitter';

let proxy = true;
let service = true;
const tasks: Array<(electronApp: ElectronApp) => void> = [];

emitter.on('v2ray:status', (status: boolean) => {
  service = status;
});
emitter.on('proxy:status', (status: boolean) => {
  proxy = status;
  if (!service && !proxy) {
    emitter.emit('cleanUp:refresh', true);
  }
});
const unProxy = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeQuit', 'unProxy', () => {
    console.log('hooks: >> turn proxy off');
    emitter.emit('proxy:stop', {});
  });
};

const stopService = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeQuit', 'unProxy', () => {
    console.log('hooks: >> turn service off');
    emitter.emit('v2ray:stop', {});
  });
};

tasks.push(unProxy, stopService);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
