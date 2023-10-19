import { ElectronApp } from '@main/app';
import emitter from '@lib/event-emitter';
import ProxyService from '../core/proxy';
import Service from '../core/v2ray';

let proxy = true;
let service = true;
const tasks: Array<(electronApp: ElectronApp) => void> = [];

emitter.on('v2ray:status', (status: boolean) => {
  service = status;
});
emitter.on('proxy:status', (status: boolean) => {
  proxy = status;
});
const stopProxy = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeQuit', 'unProxy', () => {
    console.log('hooks: >> turn proxy off');
    const service = new Service(process.platform);
    service.stop();
  });
};

const stopService = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeQuit', 'unProxy', () => {
    console.log('hooks: >> turn service off');
    new ProxyService().stop();
  });
};

tasks.push(stopProxy, stopService);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
