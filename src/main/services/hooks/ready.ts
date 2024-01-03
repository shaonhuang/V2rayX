import { ElectronApp } from '@lib/app';
import db from '@main/lib/lowdb';
import Service from '@main/services/core/v2ray';
import emitter from '@lib/event-emitter';
import logger from '@lib/logs';
import { promiseRetry, checkPortAvailability } from '@main/lib/utils';
import ProxyService from '@main/services/core/proxy';
import { existsSync } from 'node:fs';
import Window from '@main/services/browser';
import { app } from 'electron';
import { find, flatMapDeep, flattenDeep } from 'lodash';
import { isWindows } from '@main/lib/constant';

const tasks: Array<(electronApp: ElectronApp) => void> = [];

// const syncAppVersion = () => {
//   db.read().then(() => {
//     db.data = db.chain.set('appVersion', app.getVersion()).value();
//     console.log('appVersion', app.getVersion(), db.data);
//   });
//   db.write().then(() => {
//     console.log(db.data);
//   });
// };

const autoStartProxy = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('ready', 'autoStartProxy', () => {
    console.log('hooks: >> autoStartProxy');
    // TODO: auto start proxy
    db.read().then(() => {
      if (!db.chain.get('management.generalSettings.autoStartProxy').value()) return;
      const service = new Service(process.platform);
      try {
        const currentServerId = db.chain.get('currentServerId').value()?.[0] ?? '';
        const v2rayLogsFolder = db.chain.get('management.generalSettings.v2rayLogsFolder').value();
        const outbounds = flatMapDeep([
          db.chain.get('servers').value(),
          db.chain
            .get('subscriptionList')
            .value()
            .map((i) => i.requestServers),
        ]);
        const outbound = find(outbounds, { id: currentServerId ?? '' })?.outbound;
        const template = db.chain.get('serverTemplate').value();
        template.log = {
          error: v2rayLogsFolder.concat('error.log'),
          loglevel: 'info',
          access: v2rayLogsFolder.concat('access.log'),
        };
        if (!outbound) throw new Error('choose id not point,outbound find empty');
        template.outbounds = [outbound];
        if (currentServerId !== '') {
          if (existsSync(v2rayLogsFolder.concat('access.log'))) {
            service.start(template);
            emitter.emit('tray-v2ray:update', true);
            db.data = db.chain.set('serviceRunningState', true).value();
          } else {
            logger.error('service init failed. accessing log file not found');
            db.data = db.chain
              .set(
                'management.generalSettings.v2rayLogsFolder',
                `${app.getPath('logs')}${isWindows ? '\\' : '/'}`,
              )
              .set(
                'management.generalSettings.applicationLogsFolder',
                `${app.getPath('logs')}${isWindows ? '\\' : '/'}`,
              )
              .set('serviceRunningState', false)
              .value();
            db.data = db.chain.set('serviceRunningState', false).value();
          }
        }
      } catch (err) {
        logger.error('service init', err);
      }
    });
  });
};

const autoStartSysProxy = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('beforeReady', 'setupProxy', () => {
    console.log('hooks: >> setupProxy');
    db.read().then(() => {
      // @ts-ignore
      const config = db.chain
        .get('servers')
        ?.find({ id: db.chain.get('currentServerId').value() })
        .value()?.config;
      // [0] is socks proxy port
      const socksPort = config?.inbounds[0].port ?? 10801;

      // [1] is http proxy port
      const httpPort = config?.inbounds[1].port ?? 10871;

      const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
      let pacPort = randomPort;
      const mode = db.chain.get('settings.proxyMode').value() as Mode;
      promiseRetry(
        () =>
          checkPortAvailability(randomPort)
            .then((res) => {
              logger.info(res);
              pacPort = randomPort;
              logger.info(
                `Mode port infomation -- pacPort:${pacPort}, httpPort:${httpPort}, socksPort:${socksPort}, mode:${mode}`,
              );
              const proxy = new ProxyService(httpPort, socksPort, pacPort, mode);
              proxy.mountListeners();
              proxy.updateMode(mode);
            })
            .catch((err) => {
              logger.error(err);
            }),
        3,
        0,
      );
    });
  });
};

const configureLanguage = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('ready', 'configureLanguage', () => {
    console.log('hooks: >> configureLanguage');
  });
};

const createMainSingletonWindow = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('ready', 'createMainSingletonWindow', () => {
    console.log('hooks: >> createMainSingletonWindow');
    new Window();
  });
};

tasks.push(configureLanguage, autoStartSysProxy, autoStartProxy, createMainSingletonWindow);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
