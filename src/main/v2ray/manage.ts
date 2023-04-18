// https://github.com/v2fly/v2ray-core/releases/download/v5.3.0/v2ray-macos-64.zip
import { exec } from 'child_process';
const admZip = require('adm-zip');
const { net } = require('electron');
import * as path from 'path';
import * as fs from 'fs';

const mac = 'darwin';
const win = 'win32';
const linux = 'linux';
const apiUrl = 'https://api.github.com/repos/v2fly/v2ray-core/releases/latest';
let v2ray: any;

const runCmd = (cmd: any) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    console.log(`stdout: ${stdout}`);
  });
};

export default {
  // # remove old file
  // rm -rf ~/.v2rayx/v2ray-core
  // rm -rf ~/.v2rayx/pac
  clean() {
    try {
      runCmd('rm -rf ~/.v2rayx/v2ray-core');
      console.log('finish clean core');
      runCmd('rm -rf ~/.v2rayx/pac');
      console.log('finish clean pac');
    } catch (err) {
      console.log('clean err');
    }
  },

  async download() {
    const getInfo = async () => {
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
    const download = async (url: string, dest: string, cb: any) => {
      const zipFile = 'v2ray.zip';
      const outputDir = 'v2ray-core';
      console.log(url, dest);
      const request = net.request(url);
      const data: Array<any> = [];
      const write = fs.createWriteStream(zipFile);
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data.push(chunk);
        });
        response.on('end', () => {
          const buffer = Buffer.concat(data);
          fs.writeFileSync(zipFile, buffer);
        });
      });
      request.end();
    };
    try {
      const zipFile = 'v2ray.zip';
      const outputDir = 'v2ray-core';

      const info = await getInfo();
      const version = info?.['tag_name'];
      let system;
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
      const url = `https://github.com/v3fly/v2ray-core/releases/download/${version}/v2ray-${system}-64.zip`;
      // console.log(url);
      fs.existsSync('v2ray.zip') ?? (await download(url, __dirname, undefined));
      const zip = new admZip(zipFile);
      zip.extractAllTo(/*target path*/ outputDir, /*overwrite*/ true);
      console.log('extractAllTo success');
    } catch (err) {
      console.log('failed download:', err);
    }
  },
  // # copy
  copy() {
    try {
      const homedir = require('os').homedir();
      fs.cpSync('v2ray-core', path.join(homedir, 'v2ray-core'), { recursive: true });
      console.log('copy success');
    } catch (err) {
      console.log(err);
    }
  },
  v2rayService(type: string) {
    const homedir = require('os').homedir();
    const { spawn } = require('node:child_process');
    const init = () => {
      v2ray = spawn(path.join(homedir, 'v2ray-core') + '/v2ray', [
        'run',
        '-c',
        path.join(homedir, 'v2ray-core', 'test.json'),
      ]);
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
