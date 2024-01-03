import logger from '@lib/logs';
import db from '@lib/lowdb';
import { ipcMain } from 'electron';
import emitter from '@lib/event-emitter';
import { find, flattenDeep } from 'lodash';

import ProxyService from '@main/services/core/proxy';
import V2rayService from '@main/services/core/v2ray';

const listeners = () => {
  ipcMain.handle('v2rayx:v2ray:start', async (_, data) => {
    await db.read();
    const service = new V2rayService(process.platform);
    let outbound;
    let template;
    if (data === undefined) {
      const currentServerId = db.chain.get('currentServerId').value();
      const outbounds = flattenDeep([
        db.chain.get('servers').value(),
        db.chain
          .get('subscriptionList')
          .value()
          .map((i) => i.requestServers),
      ]);
      outbound = find(outbounds, { id: currentServerId[0] ?? '' })?.outbound;
      template = db.chain.get('serverTemplate').value();
      const v2rayLogsFolder = db.chain.get('management.generalSettings.v2rayLogsFolder').value();
      template.log = {
        error: v2rayLogsFolder.concat('error.log'),
        loglevel: 'info',
        access: v2rayLogsFolder.concat('access.log'),
      };
      console.log(template.log, 'log');
      template.outbounds = [outbound];
      service.start(template);
    } else {
      service.start(data);
    }
    console.log(data, template);
    const socksPort = data ? data.inbounds[0].port : template?.inbounds[0].port;
    const httpPort = data ? data.inbounds[1].port : template?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    const proxy = new ProxyService();
    proxy.updatePort(httpPort, socksPort);
    await proxy.stop();
    await proxy.start();
    emitter.emit('tray-v2ray:update', true);
  });
  ipcMain.handle('v2rayx:v2ray:stop', () => {
    const service = new V2rayService(process.platform);
    service.stop();
    emitter.emit('tray-v2ray:update', false);
  });

  ipcMain.handle('v2rayx:v2ray:check', () => {
    const service = new V2rayService(process.platform);
    emitter.emit('tray-v2ray:update', service?.check() ?? false);
    return service?.check();
  });
  emitter.on('v2ray:stop', () => {
    const service = new V2rayService(process.platform);

    service?.stop();
    emitter.emit('v2ray:status', service?.check() ?? false);
    emitter.emit('tray-v2ray:update', false);
  });
  emitter.on('v2ray:start', (data) => {
    const service = new V2rayService(process.platform);
    service?.start(data);
    const socksPort = data?.inbounds[0].port;
    const httpPort = data?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    const proxy = new ProxyService();
    proxy.updatePort(httpPort, socksPort);
    proxy.stop();
    proxy.start();
    emitter.emit('tray-v2ray:update', true);
  });
};
export default listeners;
