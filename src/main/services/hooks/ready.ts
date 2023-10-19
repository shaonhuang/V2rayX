import { ElectronApp } from '@main/app';
import db from '@main/lib/lowdb';
import Service from '@main/services/core/v2ray';
import emitter from '@lib/event-emitter';
import logger from '@lib/logs';
import { promiseRetry, checkPortAvailability } from '@main/lib/utils';
import ProxyService from '@main/services/core/proxy';

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
    // TODD: auto start proxy
    db.read().then(() => {
      if (db.chain.get('v2rayInstallStatus').value()) {
        const service = new Service(process.platform);
        try {
          if (db.chain.get('currentServerId').value() !== '') {
            service.start(
              db.chain
                .get('servers')
                .find({ id: db.chain.get('currentServerId').value() })
                .value()?.config,
            );
            emitter.emit('tray-v2ray:update', true);
          }
        } catch (err) {
          logger.error('service init', err);
        }
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
      const socksPort = config?.inbounds[0].port;

      // [1] is http proxy port
      const httpPort = config?.inbounds[1].port;

      const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
      let pacPort = randomPort;
      const mode = db.chain.get('settings.proxyMode').value() as Mode;
      promiseRetry(
        () =>
          checkPortAvailability(randomPort)
            .then((res) => {
              logger.info(res);
              pacPort = randomPort;
            })
            .catch((err) => {
              logger.error(err);
            }),
        3,
        0,
      );
      const proxy = new ProxyService(httpPort, socksPort, pacPort, mode);
      proxy.mountListeners();
    });
  });
};

const configureLanguage = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('ready', 'configureLanguage', () => {
    console.log('hooks: >> configureLanguage');
  });
};

tasks.push(configureLanguage, autoStartSysProxy, autoStartProxy);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
