import { app } from 'electron';
import { Mode } from '@lib/constant/types';
import { SettingsPageType } from '@lib/constant/types';
import { emptyV2Template, isWindows } from '../constant';
import { ServersGroup, Serverx, Subscription } from '@lib/constant/types';

type Settings = {
  appearance: 'system' | 'light' | 'dark';
  proxyMode: Mode;
};

export type Data = {
  autoLaunch: boolean;
  servers: Serverx[];
  serversGroups: ServersGroup[];
  appVersion: string;
  settings: Settings;
  serviceRunningState: boolean;
  updateAvailableVersion: string;
  subscriptionList: Subscription[];
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
    darkMode: false,
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
      url: 'http://www.gstatic.com/generate_204',
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

export const defaultData: Data = {
  autoLaunch: false,
  servers: [],
  serversGroups: [],
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
