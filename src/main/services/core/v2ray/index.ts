import path from 'node:path';
import { ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import logger from '@lib/logs';
import { v2rayBin, v2rayDir } from '@lib/constant';
import { spawn } from 'node:child_process';

export default class Service {
  private static instance: Service;
  service?: WinService | DarwinService | LinuxService | null;
  platform?: NodeJS.Platform;
  v2ray?: ChildProcessWithoutNullStreams | null;
  status?: boolean;
  constructor(platform: NodeJS.Platform) {
    if (!Service.instance) {
      this.platform = platform;
      this.v2ray = null;
      this.status = false;
      Service.instance = this;
    }
    return Service.instance;
  }
  private createService(platform: NodeJS.Platform) {
    switch (platform) {
      case 'win32':
        return new WinService();
      case 'darwin':
        return new DarwinService();
      case 'linux':
        return new LinuxService();
      default:
        return null;
    }
  }
  start(data?: JSON) {
    if (data) {
      fs.writeFileSync(path.join(v2rayDir, `tmp.json`), JSON.stringify(data));
      logger.info('tmp.json file has written successfully.');
    }
    try {
      this.v2ray = spawn(v2rayBin, ['run', '-c', path.join(v2rayDir, `tmp.json`)]);
      this.v2ray?.stdout.on('data', (data: string) => {
        logger.info(`stdout: ${data}`);
      });

      this.v2ray?.stderr.on('data', (data: string) => {
        logger.error(`stderr: ${data}`);
      });
      this.v2ray?.on('close', (code: string) => {
        logger.info(`child process exited with code ${code}`);
      });
      this.status = true;
    } catch (err) {
      logger.error(err);
      this.status = false;
    }
  }
  stop() {
    this.v2ray?.kill();
    logger.info('send kill');
    this.status = false;
  }
  check() {
    return this.status;
  }
}
