import logger from '@main/lib/logs';
import { Proxy } from '@main/lib/proxy';
import db from '@lib/lowdb';
import { Mode } from '@main/lib/constant/types';
import { ipcMain } from 'electron';
import { validatedIpcMain } from '@lib/bridge';
import emitter from '@lib/event-emitter';

const changeProxyMode = async (mode: Mode) => {
  await db.read();
  new ProxyService().updateMode(mode);
  db.data = db.chain.set('management.systemProxy.proxyMode', mode).value();
  await db.write();
  emitter.emit('tray-mode:update', mode);
};
const registerChannels = [
  {
    channel: 'proxyMode:change',
    listener: (_, mode: Mode) => changeProxyMode(mode),
  },
];

const mountChannels = (channels: any[]) => {
  channels.forEach(({ channel, listener }) => {
    validatedIpcMain.handle(`v2rayx:${channel}`, listener);
  });
};

export default class ProxyService {
  private static instance: ProxyService;
  httpPort?: number;
  socksPort?: number;
  pacPort?: number;
  mode?: Mode;
  proxy?: Proxy | null;
  constructor(httpPort?: number, socksPort?: number, pacPort?: number, mode?: Mode) {
    if (!ProxyService.instance) {
      this.httpPort = httpPort;
      this.socksPort = socksPort;
      this.pacPort = pacPort;
      this.mode = mode;
      if (httpPort && socksPort && pacPort && mode) {
        this.proxy = Proxy.createProxy(process.platform, httpPort, socksPort, pacPort, mode);
      } else {
        this.proxy = null;
      }
      ProxyService.instance = this;
    }
    return ProxyService.instance;
  }

  updatePort(httpPort: number, socksPort: number) {
    if (this.proxy && this.pacPort) {
      this.proxy.updatePort(httpPort, socksPort, this.pacPort);
    } else {
      this.mode !== 'Manual' && logger.error('ProxyService:updatePort: proxy is not initialized');
    }
  }
  updateMode(mode: Mode) {
    if (this.proxy) {
      this.proxy.switch(mode);
    } else {
      this.mode !== 'Manual' && logger.error('ProxyService:updateMode: proxy is not initialized');
    }
  }
  async start() {
    if (this.proxy) {
      await this.proxy.stop();
      await this.proxy.start();
    } else {
      this.mode !== 'Manual' && logger.error('ProxyService:start: proxy is not initialized');
    }
  }
  async stop() {
    if (this.proxy) {
      await this.proxy.stop();
    } else {
      this.mode !== 'Manual' && logger.error('ProxyService:stop: proxy is not initialized');
    }
  }
  mountListeners() {
    mountChannels(registerChannels);
    ipcMain.handle('proxyMode:change', (_, mode: Mode) => {
      changeProxyMode(mode);
    });
    emitter.on('proxyMode:change', (mode: Mode) => changeProxyMode(mode));
  }
}
