import { ElectronApp } from '@lib/app';
import ProxyService from '../core/proxy';
import Service from '../core/v2ray';
import db from '@main/lib/lowdb';

const tasks: Array<(electronApp: ElectronApp) => void> = [];

const stopProxy = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncBeforeQuit('beforeQuit1', async (app, callback) => {
    console.log('hooks: >> turn proxy off');
    const service = new Service(process.platform);
    await db.read();
    db.data = db.chain.set('serviceRunningState', false).value();
    await db.write();
    service.stop();
    callback();
  });
};

const stopService = (electronApp: ElectronApp) => {
  electronApp.registryHooksAsyncBeforeQuit('beforeQuit2', async (app, callback) => {
    console.log('hooks: >> turn service off');
    await new ProxyService().stop();
    callback();
  });
};

tasks.push(stopProxy, stopService);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
