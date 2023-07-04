// import fs from 'fs-extra';
// import path from 'path';
// import { session } from 'electron';
// import isDev from 'electron-is-dev';
//
// import logger from '../logs';
// // import { pac } from '../core';
// import { getChromeExtensionsPath } from '../utils/utils';
// // import { pacDir } from '../config';
//
// const loadExtensionsManually = (paths: string[]) => {
//   paths.forEach(async (_path) => {
//     if (fs.existsSync(_path)) {
//       await session.defaultSession.loadExtension(_path);
//     }
//   })
// }
//
// const loadExtensionsWithInstaller = async () => {
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const installExtension = require('electron-devtools-installer');
//   const { REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS } = installExtension;
//
//   installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
//     .then((name: string) => console.log(`Added Extension:  ${name}`))
//     .catch((err: Error) => console.log('An error occurred: ', err));
// }
//
// export const setupAfterInstall = async (manually?: boolean) => {
//   if (manually && isDev) {
//     // react / redux devtool
//     getChromeExtensionsPath([
//       'fmkadmapgofadopljbjfkapdkoienihi',
//       'lmhkpmbekcpmknklioeibfkpmmfibljd'
//     ]).then(async (paths) => {
//       if (paths && paths.length) {
//         loadExtensionsManually(paths)
//       }
//     });
//   } else if (!manually && isDev) {
//     loadExtensionsWithInstaller();
//   }
// };
//
// export const setupIfFirstRun = async () => {
//   try {
//     // const firstRun = !(await fs.pathExists(path.resolve(pacDir, "pac.txt")));
//     const { PacServer: PS } = pac;
//
//     // if (!firstRun) {
//     //   return;
//     // }
//
//     logger.info("First run detected");
//
//     // const data = await fs.readFile(path.resolve(pacDir, "gfwlist.txt"));
//     // const text = data.toString("ascii");
//     // await PS.generatePacWithoutPort(text);
//   } catch (err) {
//     logger.error((err as any).message ?? err);
//   }
// };
//
//
const admZip = require('adm-zip');
const { net } = require('electron');
import * as fs from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import isDev from 'electron-is-dev';

import logger from '../logs';
import { platform,v2rayPlatform, v2rayArch,v2rayPath,v2rayBin, isMacOS, isLinux } from '@main/constant';

const getVersionNumber = async () => {
  let info: Object = {};
  let data = '';
  const request = net.request('https://api.github.com/repos/v2fly/v2ray-core/releases/latest');
  await new Promise((res, rej) => {
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        console.log('No more data in response.');
        info = { ...JSON.parse(JSON.parse(JSON.stringify(data.toString()))) };
        res(info);
      });
    });
    request.on('error', (err) => {
      rej(err);
    });
    request.end();
  }).catch((err) => {
    logger.error(err);
    throw err;
  });
  return info?.['tag_name'];
};

const downloadV2ray = async (version: string, cb: Function) => {
  const url = `https://github.com/v2fly/v2ray-core/releases/download/${version}/v2ray-${v2rayPlatform.get(
    platform
  )}-${v2rayArch.get(process.arch)}.zip`;
  const zipFile = isDev ? path.join('./', 'v2ray.zip') : path.join(tmpdir(), 'v2ray.zip');
  if (!fs.existsSync(zipFile)) {
    const request = net.request(url);
    const data: Array<any> = [];
    await new Promise((res, rej) => {
      request.on('response', (response: any) => {
        const totalBytes = parseInt(response.headers['content-length'], 10);
        let receivedBytes = 0;
        response.on('data', (chunk) => {
          data.push(chunk);
          receivedBytes += chunk.length;
          const progress = receivedBytes / totalBytes;
          cb(progress);
          console.log(
            `Download progress: ${progress * 100}% (${receivedBytes}/${totalBytes} bytes)`
          );
          logger.info(`Download progress: ${progress * 100}% (${receivedBytes}/${totalBytes} bytes)`);
        });
        response.on('end', (_) => {
          console.log('Download completed');
          cb(1);
          const buffer = Buffer.concat(data);
          res(buffer);
        });
      });
      request.on('error', (err: any) => {
        console.log(`Cannot download ${url}: ${err}`);
        logger.error(`Cannot download ${url}: ${err}`);
        rej(err);
      });
      request.end();
    })
      .then((buffer: any) => {
        fs.writeFileSync(zipFile, buffer);
      })
      .catch((err: any) => {
        logger.error(err);
        throw err;
      });
  }
};

const unzip = (zipFile: string, outputDir: string) => {
  const zip = new admZip(zipFile);
  zip.extractAllTo(/*target path*/ outputDir, /*overwrite*/ true);
  console.log('extractAllTo success');
};
const setupV2rayPrivilege = () => {
    if (isMacOS || isLinux) {
      // Change the file permissions
      fs.chmod(v2rayBin, '755', (err) => {
        if (err) throw err;
        console.log('File permissions changed!');
      });
    }
  }

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
    return fs.existsSync(v2rayPath);
  }
  async installV2ray(cb?: Function) {
    logger.info('installV2ray');
    try {
      const version = await getVersionNumber();
      logger.info(`v2ray release version:${version}`);
      // isDev will download v2ray package to ./ directory
      await downloadV2ray(version, (progress: number) => {
        console.log(progress);
        cb ? cb(progress) : undefined;
      });
      // isDev will choose v2ray package from ./ directory or tmpdir()
      unzip(isDev ? path.join('./', 'v2ray.zip') : path.join(tmpdir(), 'v2ray.zip'), v2rayPath);
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
