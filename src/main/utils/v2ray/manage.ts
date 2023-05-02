// https://github.com/v2fly/v2ray-core/releases/download/v5.3.0/v2ray-macos-64.zip
import { app } from 'electron';
const admZip = require('adm-zip');
const { net } = require('electron');
import * as path from 'path';
import * as fs from 'fs';
import { tmpdir } from 'os';

const mac = 'darwin';
const win = 'win32';
const linux = 'linux';
const apiUrl = 'https://api.github.com/repos/v2fly/v2ray-core/releases/latest';
let v2ray: any;
const v2rayPath = path.join(app.getPath('userData'), 'v2ray-core');
const v2rayBin = path.join(app.getPath('userData'), 'v2ray-core', 'v2ray');

const getInfoFromGithub = async (apiUrl: string) => {
  let info: any = {};
  let data = '';
  const request = net.request(apiUrl);
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
    request.end();
  });
  return info;
};

const download = async (url: string, dest: string, cb: Function) => {
  try {
    const request = net.request(url);
    const data: Array<any> = [];
    await new Promise((rev) => {
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
        });
        response.on('end', (_) => {
          console.log('Download completed');
          cb(1);
          const buffer = Buffer.concat(data);
          rev(buffer);
        });
      });
      request.end();
    }).then((buffer: any) => {
      fs.writeFileSync(dest, buffer);
    });
  } catch (err) {}
};

const unzip = (zipFile: string, outputDir: string) => {
  const zip = new admZip(zipFile);
  zip.extractAllTo(/*target path*/ outputDir, /*overwrite*/ true);
  console.log('extractAllTo success');
};

export default {
  async downloadV2rayPackage(cb?: Function) {
    try {
      const info = await getInfoFromGithub(apiUrl);
      const version = info?.['tag_name'];
      let system = '';
      switch (process.platform) {
        case linux:
          system = 'linux';
          break;
        case mac:
          system = 'macos';
          break;
        case win:
          system = 'windows';
          break;
      }
      const url = `https://github.com/v2fly/v2ray-core/releases/download/${version}/v2ray-${system}-64.zip`;
      const zipFile = path.join(tmpdir(), 'v2ray.zip');

      if (!fs.existsSync(zipFile)) {
        await download(url, zipFile, (data: number) => {
          cb ? cb(data) : undefined;
        });
      }
    } catch (err) {
      console.log('failed download:', err);
    }
  },
  unzipV2rayPackage() {
    const outputDir = v2rayPath;
    const zipFile = path.join(tmpdir(), 'v2ray.zip');
    unzip(zipFile, outputDir);
  },
  setupV2rayPrivilege() {
    if (process.platform === linux || process.platform === mac) {
      // Change the file permissions
      fs.chmod(v2rayBin, '755', (err) => {
        if (err) throw err;
        console.log('File permissions changed!');
      });
    }
  },
  v2rayService(type: string, data?: JSON) {
    const { spawn } = require('node:child_process');
    console.log('v2rayService', type, data);
    try {
      fs.writeFileSync(path.join(v2rayPath, `tmp.json`), JSON.stringify(data));
      console.log('File written successfully.');
    } catch (err) {
      console.error(err);
    }
    const init = () => {
      v2ray = spawn(v2rayBin, ['run', '-c', path.join(v2rayPath, `tmp.json`)]);
      v2ray.stdout.on('data', (data: string) => {
        console.log(`stdout: ${data}`);
      });

      v2ray.stderr.on('data', (data: string) => {
        console.error(`stderr: ${data}`);
      });

      v2ray.on('close', (code: string) => {
        console.log(`child process exited with code ${code}`);
      });
      console.log('init finished');
    };
    const stop = () => {
      v2ray.kill();
      console.log('send kill');
    };
    switch (type) {
      case 'start':
        init();
        break;
      case 'stop':
        stop();
        break;
    }
  },
};
