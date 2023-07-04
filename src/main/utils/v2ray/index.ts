import path from 'node:path';
import { ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import { v2rayBin, v2rayPath } from '@main/constant';

export class Service {
  platform: NodeJS.Platform;
  v2ray: ChildProcessWithoutNullStreams | null;
  constructor(platform: NodeJS.Platform) {
    this.platform = platform;
    this.v2ray = null;
  }
  static createService(platform: NodeJS.Platform) {
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
    if(data) {
      fs.writeFileSync(path.join(v2rayPath, `tmp.json`), JSON.stringify(data));
      console.log('File written successfully.');
    }
    const { spawn } = require('node:child_process');
    try {
      this.v2ray = spawn(v2rayBin, ['run', '-c', path.join(v2rayPath, `tmp.json`)]);
      this.v2ray?.stdout.on('data', (data: string) => {
        console.log(`stdout: ${data}`);
      });

      this.v2ray?.stderr.on('data', (data: string) => {
        console.error(`stderr: ${data}`);
      });
      this.v2ray?.on('close', (code: string) => {
        console.log(`child process exited with code ${code}`);
      });
      console.log('init finished');
    } catch (err) {
      console.log(err);
    }
  }
  stop() {
    this.v2ray?.kill();
    console.log('send kill');
  }
}
export class WinService extends Service {
  constructor() {
    super('win32');
  }
}
export class DarwinService extends Service {
  constructor() {
    super('darwin');
  }
}
export class LinuxService extends Service {
  constructor() {
    super('linux');
  }
}
