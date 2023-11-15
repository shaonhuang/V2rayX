import * as networksetup from './macProxy';
import * as gsettings from './linuxProxy';
import * as sysproxy from './winProxy';
import { PacServer as PS } from './pac';
import { Mode, ProxyStatus } from '@lib/constant/types';
import logger from '@lib/logs';

export class Proxy {
  mode: Mode;
  status: ProxyStatus;
  httpPort: number;
  socksPort: number;
  pacPort: number;
  platform: NodeJS.Platform;

  constructor(
    platform: NodeJS.Platform,
    httpPort: number,
    socksPort: number,
    pacPort: number,
    mode: Mode,
  ) {
    this.platform = platform;
    this.status = 'off';
    this.httpPort = httpPort;
    this.socksPort = socksPort;
    this.pacPort = pacPort;
    this.mode = mode;
  }

  static createProxy(
    platform: NodeJS.Platform,
    httpPort: number,
    socksPort: number,
    pacPort: number,
    mode: Mode,
  ): Proxy | null {
    if (mode === 'Manual') return null;
    switch (platform) {
      case 'darwin':
        return new DarwinProxy(httpPort, socksPort, pacPort, mode);
      case 'win32':
        return new WinProxy(httpPort, socksPort, pacPort, mode);
      case 'linux':
        return new LinuxProxy(httpPort, socksPort, pacPort, mode);
      default:
        return new Proxy(platform, httpPort, socksPort, pacPort, mode);
    }
  }
  updatePort(httpPort: number, socksPort: number, pacPort: number) {
    this.httpPort = httpPort;
    this.socksPort = socksPort;
    this.pacPort = pacPort;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async start() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async stop() {}

  public async switch(mode: Mode) {
    this.mode = mode;
    logger.info(`Switch proxy mode to ${mode}`);
    await this.stop();
    await this.start();
  }
}

export class LinuxProxy extends Proxy {
  constructor(httpPort: number, socksPort: number, pacPort: number, mode: Mode) {
    super('linux', httpPort, socksPort, pacPort, mode);
  }

  public async start() {
    if (this.mode === 'Global') {
      await gsettings.setGlobalProxy('127.0.0.1', this.httpPort ?? 10871, this.socksPort ?? 10801);
    } else if (this.mode === 'PAC') {
      await PS.generateFullPac(this.httpPort ?? 10871, this.socksPort ?? 10801);
      await gsettings.setPacProxy(`http://127.0.0.1:${this.pacPort ?? 1090}/proxy.pac`);
      PS.startPacServer(this.pacPort);
    }
    logger.info('Set proxy on');
  }

  public async stop() {
    PS.stopPacServer();
    await gsettings.unsetProxy();
    logger.info('Set proxy off');
  }
}

export class WinProxy extends Proxy {
  constructor(httpPort: number, socksPort: number, pacPort: number, mode: Mode) {
    super('win32', httpPort, socksPort, pacPort, mode);
  }

  public async start() {
    if (this.mode === 'Global') {
      await sysproxy.setGlobalProxy('127.0.0.1', this.httpPort ?? 10871, this.socksPort ?? 10801);
    } else if (this.mode === 'PAC') {
      await PS.generateFullPac(this.httpPort ?? 10871, this.socksPort ?? 10801);
      await sysproxy.setPacProxy(`http://127.0.0.1:${this.pacPort ?? 1090}/proxy.pac`);
      PS.startPacServer(this.pacPort);
    }
    logger.info('Set proxy on');
  }

  public async stop() {
    PS.stopPacServer();
    await sysproxy.unsetProxy();
    logger.info('Set proxy off');
  }
}

export class DarwinProxy extends Proxy {
  constructor(httpPort: number, socksPort: number, pacPort: number, mode: Mode) {
    super('darwin', httpPort, socksPort, pacPort, mode);
  }

  public async start() {
    if (this.mode === 'Global') {
      await networksetup.setGlobalProxy(
        '127.0.0.1',
        this.httpPort ?? 10871,
        this.socksPort ?? 10801,
      );
    } else if (this.mode === 'PAC') {
      await PS.generateFullPac(this.httpPort ?? 10871, this.socksPort ?? 10801);
      await networksetup.setPacProxy(`http://127.0.0.1:${this.pacPort ?? 1090}/proxy.pac`);
      PS.startPacServer(this.pacPort);
    }
    logger.info('Set proxy on');
  }

  public async stop() {
    PS.stopPacServer();
    await networksetup.unsetProxy();
    logger.info('Set proxy off');
  }
}
