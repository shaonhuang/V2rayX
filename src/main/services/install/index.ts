const admZip = require('adm-zip');
const { net, dialog, app } = require('electron');
import * as fs from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { is } from '@electron-toolkit/utils';

import logger from '@main/lib/logs';
import {
  platform,
  v2rayPlatform,
  v2rayArch,
  v2rayPath,
  v2rayBin,
  isMacOS,
  isLinux,
} from '@main/lib/constant';

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
        logger.info('No more data in response.');
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

const makeRequest = async (url, requestOptions, cb) => {
  return new Promise((res, rej) => {
    const request = net.request(url);
    const data: Array<Uint8Array> = [];

    request.on('response', (response: any) => {
      const totalBytes = parseInt(response.headers['content-length'], 10);
      let receivedBytes = 0;

      response.on('data', (chunk) => {
        data.push(chunk);
        receivedBytes += chunk.length;
        const progress = receivedBytes / totalBytes;
        cb(progress);
        logger.info(`Download progress: ${progress * 100}% (${receivedBytes}/${totalBytes} bytes)`);
      });
      response.on('end', (_) => {
        logger.info('Download completed');
        cb(1);
        const buffer: Uint8Array = Buffer.concat(data);
        res(buffer);
      });
      setTimeout(
        () => {
          !response && requestOptions?.timeout ? rej('Task Timed out') : response;
        },
        requestOptions?.timeout,
      );
    });

    request.on('error', (err: any) => {
      logger.error(`Cannot download ${url}: ${err}`);
      rej(err);
    });

    // use the request.end() method to send the request.
    logger.info(url);
    request.end();
  });
};

const downloadV2ray = async (version: string, cb: Function) => {
  // https://ghproxy.com/ is a proxy for github -- useage : url+github-url
  const url = `https://github.com/v2fly/v2ray-core/releases/download/${version}/v2ray-${v2rayPlatform.get(
    platform,
  )}-${v2rayArch.get(process.arch)}.zip`;
  // Define RequestOptions with timeout
  const requestOptions = {
    timeout: 5000, // 5 seconds
  };

  const zipFile = is.dev ? path.join('./', 'v2ray.zip') : path.join(tmpdir(), 'v2ray.zip');
  if (!fs.existsSync(zipFile) || true) {
    try {
      // First request
      const buffer: any = await makeRequest(`https://ghproxy.com/${url}`, requestOptions, cb);
      fs.writeFileSync(zipFile, buffer);
    } catch (err) {
      // Handle timeout error
      logger.error(err);
      try {
        // Second request
        const buffer: any = await makeRequest(url, requestOptions, cb);
        fs.writeFileSync(zipFile, buffer);
      } catch (error) {
        // Handle second request error
        logger.error(error);
        dialog
          .showMessageBox({
            type: 'info',
            title: 'Download Request Timeout',
            message:
              'Please check the network connection and download the path to v2ray-core from GitHub releases',
            buttons: ['OK'],
          })
          .then((result) => {
            // Handle dialog response
            logger.info(result);
            app.quit();
          });
        throw error;
      }
    }
  }
};

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
    return fs.existsSync(v2rayPath);
  }
  async installV2ray(cb?: Function) {
    logger.info('installV2ray');
    try {
      const version = await getVersionNumber();
      logger.info(`v2ray release version:${version}`);
      // is.dev will download v2ray package to ./ directory
      await downloadV2ray(version, (progress: number) => {
        cb ? cb(progress) : undefined;
      });
      // is.dev will choose v2ray package from ./ directory or tmpdir()
      unzip(is.dev ? path.join('./', 'v2ray.zip') : path.join(tmpdir(), 'v2ray.zip'), v2rayPath);
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
