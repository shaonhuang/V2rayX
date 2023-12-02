import http from 'http';
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import logger from '@main/lib/logs';
import { globalPacConf, pacDir, userPacConf } from '@main/lib/constant';
import chokidar from 'chokidar';

export function debounce<params extends any[]>(fn: (...args: params) => any, timeout: number) {
  let timer: NodeJS.Timeout;

  return function (this: any, ...args: params) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, timeout);
  };
}

// eslint-disable-next-line @typescript-eslint/no-var-requires

let server: PacServer | null;

export class PacServer {
  core: http.Server;
  httpPort: number;
  sockPort: number;
  pacPort: number;
  globalPacConf: string;
  userPacConf: string;
  userConfWatcher: fs.FSWatcher | null;
  globalConfWatcher: fs.FSWatcher | null;

  static updateUserPacRules(text: string) {
    return fs.promises.writeFile(userPacConf, text);
  }

  static async getUserPacRules() {
    return await fs.promises.readFile(userPacConf, 'utf8');
  }

  static updateGlobalPacRules(text: string) {
    return fs.promises.writeFile(globalPacConf, text);
  }

  static async getGlobalPacRules() {
    return await fs.promises.readFile(globalPacConf, 'utf8');
  }

  static startPacServer(httpPort: number, sockPort: number, pacPort: number) {
    server?.close();
    server = new PacServer(httpPort, sockPort, pacPort, path.resolve(pacDir, 'proxy.pac'));
  }

  static stopPacServer() {
    logger.info('Closing PAC server');
    server?.close();
  }

  static async generatePacWithoutPort(gfwListText: string) {
    logger.info('Generating PAC file without port...');

    try {
      // remove useless chars
      const rules = JSON.stringify(
        gfwListText
          .replace(/[\r\n]/g, '\n')
          .split('\n')
          .filter((i) => i && i.trim() && i[0] !== '!' && i[0] !== '['),
        null,
        2,
      );
      const data = await fsExtra.readFile(path.resolve(pacDir, 'template.pac'));
      const pac = data.toString('ascii').replace(/__RULES__/g, rules);

      await fsExtra.writeFile(path.resolve(pacDir, 'pac.txt'), pac);
      logger.info('Generated done.');
    } catch (err) {
      logger.error((err as any).message ?? err);
    }
  }

  static async generateFullPac(httpPort: number, socks5Port: number) {
    logger.info('Generating full PAC file...');

    try {
      const data = await fsExtra.readFile(path.resolve(pacDir, 'pac.txt'));
      const pac = data
        .toString('ascii')
        .replace(/__HTTP__PORT__/g, httpPort.toString())
        .replace(/__SOCKS5__PORT__/g, socks5Port.toString());

      await fsExtra.writeFile(path.resolve(pacDir, 'proxy.pac'), pac);
      logger.info('Generated done.');
    } catch (err) {
      logger.error((err as any).message ?? err);
    }
  }

  // static async downloadAndGeneratePac(url: string, text: string, settings: Settings) {
  //   if (!url && !text) {
  //     throw new Error('invalid_parameter');
  //   }
  //
  //   logger.info(`Downloading GFWList from ${url}...`);
  //
  //   return new Promise<string>((resolve, reject) => {
  //     if (text) {
  //       logger.info('Parsing GFWList base64 text and generating PAC file without port');
  //       resolve(text);
  //     }
  //     if (url) {
  //       logger.info('Downloading GFWList and generating PAC file without port');
  //       const parsedUrl = URL.parse(url);
  //       const host = parsedUrl.hostname;
  //       const protocol = parsedUrl.protocol;
  //       const port = parsedUrl.port ?? (protocol === 'https:' ? 443 : 80);
  //
  //       return fetch(url)
  //         .then((response) => {
  //           return response.text();
  //         })
  //         .then((text) => {
  //           resolve(text);
  //         })
  //         .catch(() => {
  //           const agentConf = {
  //             ipaddress: '127.0.0.1',
  //             port: settings.localPort,
  //             type: 5,
  //           };
  //
  //           return request({
  //             url,
  //             method: 'GET',
  //             agent: new socks.Agent({
  //               proxy: agentConf,
  //               target: { host, port },
  //               authentication: {
  //                 username: '',
  //                 password: '',
  //               },
  //             }),
  //           }).then((rsp) => {
  //             if (rsp.error) {
  //               return reject(new Error(rsp.error.message));
  //             }
  //             resolve(rsp.data);
  //           });
  //         });
  //     }
  //   })
  //     .then((base64: string) => {
  //       const base64Text = Buffer.from(base64, 'base64').toString('ascii');
  //       return PacServer.generatePacWithoutPort(base64Text);
  //     })
  //     .catch((err: any) => {
  //       logger.error(err?.toString() ?? err);
  //       return Promise.reject(err);
  //     });
  // }

  constructor(httpPort: number, sockPort: number, pacPort: number, pacFile: string) {
    logger.info('Starting PAC server');
    this.httpPort = httpPort;
    this.sockPort = sockPort;
    this.pacPort = pacPort;
    this.core = http.createServer((req, res) => {
      fs.readFile(pacFile, (err, data) => {
        if (err) {
          res.writeHead(500);
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    });
    this.core.listen(this.pacPort);
    this.globalPacConf = globalPacConf;
    this.userPacConf = userPacConf;
    this.userConfWatcher = this.watch(this.userPacConf);
    this.globalConfWatcher = this.watch(this.globalPacConf);
  }

  watch(pacFile: string) {
    if (!fs.existsSync(pacFile)) return null;
    logger.info(`Watching PAC file ${pacFile}...`);
    return chokidar
      .watch(pacFile, {
        awaitWriteFinish: true,
        usePolling: true,
      })
      .on(
        'change',
        debounce(async () => {
          logger.info(`Regenerating PAC conf from file: ${pacFile}...`);
          try {
            const userData = await fs.promises.readFile(pacFile);
            const globalData = await fs.promises.readFile(this.globalPacConf);
            const userText = userData.toString('ascii');
            const globalText = globalData.toString('ascii');
            await PacServer.generatePacWithoutPort(`${userText}\n${globalText}`);
            await PacServer.generateFullPac(this.httpPort, this.sockPort);
            PacServer.stopPacServer();
            PacServer.startPacServer(this.httpPort, this.sockPort, this.pacPort);
          } catch (error) {
            console.log(error);
          }
        }, 1e3),
      );
  }

  unwatch() {
    logger.info(`UnWatching PAC file ${this.userPacConf}...`);
    this.userConfWatcher?.close();
    this.globalConfWatcher?.close();
  }

  close() {
    logger.info('Closing PAC server');
    try {
      this.core.close();
      this.unwatch();
      server = null;
    } catch (error) {
      console.log(error);
    }
  }
}
