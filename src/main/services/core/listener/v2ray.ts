import logger from '@lib/logs';
import db from '@lib/lowdb';
import { ipcMain } from 'electron';
import emitter from '@lib/event-emitter';
import { find, flattenDeep, uniqBy } from 'lodash';

import ProxyService from '@main/services/core/proxy';
import V2rayService from '@main/services/core/v2ray';

const listeners = () => {
  ipcMain.handle('v2rayx:v2ray:start', async (_) => {
    await db.read();
    const service = new V2rayService(process.platform);
    const currentServerId = db.chain.get('currentServerId').value()[0];
    const outbounds = flattenDeep([
      db.chain
        .get('serversGroups')
        .value()
        .map((i) => i.subServers),
    ]);
    const outbound = find(outbounds, { id: currentServerId ?? '' })?.outbound;
    const template = db.chain.get('serverTemplate').value();
    template.inbounds = uniqBy(
      [...template.inbounds, ...db.chain.get('management.v2rayConfigure.inbounds').value()],
      'tag',
    );
    const v2rayLogsFolder = db.chain.get('management.generalSettings.v2rayLogsFolder').value();
    const dns = JSON.parse(db.chain.get('management.v2rayConfigure.dns').value());
    template.log = {
      error: v2rayLogsFolder.concat('error.log'),
      loglevel: 'info',
      access: v2rayLogsFolder.concat('access.log'),
    };
    template.dns = dns;
    template.outbounds = [outbound, ...template.outbounds];
    service.start(template);

    const socksPort = template.inbounds[0].port;
    const httpPort = template.inbounds[1].port;
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
    emitter.emit('tray-v2ray:update', service?.check());
    return service?.check();
  });

  ipcMain.handle('v2rayx:v2ray:port:update', async () => {
    await db.read();
    const port = db.data.management.v2rayConfigure.inbounds[1].port;
    emitter.emit('tray-pastedPort:update', port);
  });
  emitter.on('v2ray:stop', () => {
    const service = new V2rayService(process.platform);
    service?.stop();
  });
  emitter.on('v2ray:start', async (data) => {
    await db.read();
    const service = new V2rayService(process.platform);
    const currentServerId = db.chain.get('currentServerId').value()[0];
    const outbounds = flattenDeep([
      db.chain
        .get('serversGroups')
        .value()
        .map((i) => i.subServers),
    ]);
    const outbound = find(outbounds, { id: currentServerId ?? '' })?.outbound;
    const template = db.chain.get('serverTemplate').value();
    const v2rayLogsFolder = db.chain.get('management.generalSettings.v2rayLogsFolder').value();
    const dns = JSON.parse(db.chain.get('management.v2rayConfigure.dns').value());
    template.log = {
      error: v2rayLogsFolder.concat('error.log'),
      loglevel: 'info',
      access: v2rayLogsFolder.concat('access.log'),
    };
    template.dns = dns;
    template.outbounds = [outbound, ...template.outbounds];
    service.start(template);

    const socksPort = template?.inbounds[0].port;
    const httpPort = template?.inbounds[1].port;
    logger.info(`socksPort: ${socksPort}, httpPort: ${httpPort}`);
    const proxy = new ProxyService();
    proxy.updatePort(httpPort, socksPort);
    await proxy.stop();
    await proxy.start();
  });
};
export default listeners;
