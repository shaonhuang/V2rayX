import lodash from 'lodash';
import { app } from 'electron';
import { Low } from 'lowdb';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { JSONFile } from 'lowdb/node';
import { Mode } from '@lib/constant/types';
import { SettingsPageType } from '@lib/constant/types';
import { emptyV2Template, isWindows } from '../constant';
import fs from 'node:fs';

type Server = {
  id: number;
  item: JSON;
};

type Settings = {
  appearance: 'system' | 'light' | 'dark';
  proxyMode: Mode;
};

type Data = {
  autoLaunch: boolean;
  servers: Server[];
  appVersion: string;
  settings: Settings;
  serviceRunningState: boolean;
  updateAvailableVersion: string;
  subscriptionList: [];
  currentServerId: [];
  serverTemplate: Record<string, any>;
  management: SettingsPageType;
};

const logsDir = `${app.getPath('logs')}${isWindows ? '\\' : '/'}`;

const styleInJson = JSON.stringify(
  {
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#9c27b0',
      },
      success: {
        main: '#2e7d32',
      },
    },
    typography: {
      fontFamily: 'Source Sans Pro, sans-serif',
    },
  },
  null,
  2,
);
const defaultHttpInboundObject = {
  listen: '127.0.0.1',
  port: 10871,
  protocol: 'http',
  tag: 'http-inbound',
  allocate: {
    strategy: 'always',
    refresh: 5,
    concurrency: 3,
  },
};

const defaultSocksInboundObject = {
  listen: '127.0.0.1',
  port: 10801,
  protocol: 'socks',
  tag: 'socks-inbound',
  allocate: {
    strategy: 'always',
    refresh: 5,
    concurrency: 3,
  },
};

const initialState: SettingsPageType = {
  v2rayCore: {
    version: '5.12.1',
    isReinstallV2rayPackage: false,
  },
  generalSettings: {
    allowSystemNotification: true,
    autoStartProxy: false,
    dashboardPopWhenStart: true,
    applicationLogsFolder: logsDir,
    v2rayLogsFolder: logsDir,
    automaticUpgrade: {
      visiableUpgradeTip: true,
      autodownloadAndInstall: true,
    },
  },
  appearance: {
    theme: 'default',
    customStyle: false,
    styleInJson: styleInJson,
    followSystemTheme: false,
    fontFamily: '',
    hideTrayBar: false,
    enhancedTrayIcon: '',
  },
  systemProxy: {
    bypassDomains: `bypass:
  - 127.0.0.1
  - 192.168.0.0/16
  - 10.0.0.0/8
  - FE80::/64
  - ::1
  - FD00::/8,
  - localhost`,
    pacSetting: {
      banListUrl: '',
      userRules: '',
    },
  },
  proxies: {
    latencyTest: {
      url: 'https:www.google.com',
      timeout: 3000,
    },
  },
  v2rayConfigure: {
    inbounds: [defaultSocksInboundObject, defaultHttpInboundObject],
    dns: `{
    "hosts": {
      "dns.google": "8.8.8.8"
    }
}`,
  },
};

// Extend Low class with a new `chain` field
class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data');
}

const defaultData: Data = {
  autoLaunch: false,
  servers: [],
  currentServerId: [],
  appVersion: '0.0.0',
  settings: {
    appearance: 'light',
    proxyMode: 'Manual',
  },
  subscriptionList: [],
  serverTemplate: emptyV2Template(),
  serviceRunningState: false,
  updateAvailableVersion: '',
  management: initialState,
};

const userData = app.getPath('userData');
const dbPathOld = join(userData, 'lowdb', 'db.json');
const dbPath = join(userData, 'lowdb', 'dbv2.json');
const parentDir = join(userData, 'lowdb');
if (existsSync(dbPathOld)) {
  // Use the unlink method to delete the file
  fs.unlink(dbPathOld, (err) => {
    if (err) {
      console.error(`Error deleting file: ${err}`);
    } else {
      console.log(`${dbPathOld} File deleted successfully`);
    }
  });
}
if (!existsSync(parentDir)) {
  mkdirSync(parentDir);
}
const adapter = new JSONFile<Data>(dbPath);
const db = new LowWithLodash(adapter, defaultData);
export default db;
// await db.read();

// Instead of db.data use db.chain to access lodash API
// const post = db.chain.get('posts').find({ id: 1 }).value(); // Important: value() must be called to execute chain
