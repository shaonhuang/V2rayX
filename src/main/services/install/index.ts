const admZip = require('adm-zip');
import * as fs from 'fs';
import { join } from 'path';

import logger from '@main/lib/logs';
import {
  platform,
  v2rayPackage,
  v2rayDir,
  v2rayBin,
  isMacOS,
  isLinux,
  arch,
  v2rayPlatform,
  v2rayArch,
  v2rayPackagePath,
} from '@main/lib/constant';

const unzip = (zipFile: string, outputDir: string) => {
  const zip = new admZip(zipFile);
  zip.extractAllTo(/*target path*/ outputDir, /*overwrite*/ true);
  logger.info('extractAllTo success');
};
const setupV2rayPrivilege = () => {
  if (isMacOS || isLinux) {
    // Change the file permissions
    fs.chmod(v2rayBin, '755', (err) => {
      if (err) throw err;
      logger.info('File permissions changed!');
    });
  }
};

export class Install {
  platform: NodeJS.Platform;
  constructor(platform: NodeJS.Platform) {
    this.platform = platform;
  }
  static createInstall(platform: NodeJS.Platform) {
    switch (platform) {
      case 'win32':
        return new WinInstall();
      case 'darwin':
        return new DarwinInstall();
      case 'linux':
        return new LinuxInstall();
      default:
        return new Install(platform);
    }
  }
  checkV2ray() {
    return fs.existsSync(v2rayBin);
  }
  installV2ray(cb?: Function) {
    logger.info('installV2ray');
    try {
      unzip(v2rayPackagePath, v2rayDir);
      setupV2rayPrivilege();
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
}

export class WinInstall extends Install {
  constructor() {
    super('win32');
  }
}

export class DarwinInstall extends Install {
  constructor() {
    super('darwin');
  }
}

export class LinuxInstall extends Install {
  constructor() {
    super('linux');
  }
}
