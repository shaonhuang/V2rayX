import os from 'node:os';
import path from 'node:path';
import { app } from 'electron';
import { is } from '@electron-toolkit/utils';

export const resourcesPath = path
  .join(__dirname, '../../resources/')
  .replace('app.asar', 'app.asar.unpacked');

export const pacPath = path.join(resourcesPath, 'pac');
export const binPath = path.join(resourcesPath, 'bin');
export const v2rayPackage = path.join(resourcesPath, 'v2ray-package');

export const ignoredHosts =
  'FE80::/64, 127.0.0.1/8, ::1, FD00::/8, 192.168.0.0/16, 10.0.0.0/8, localhost';

export const ignoredHosts_win =
  'localhost;127.*;10.*;172.16.*;172.17.*;172.18.*;172.19.*;172.20.*;172.21.*;172.22.*;172.23.*;172.24.*;172.25.*;172.26.*;172.27.*;172.28.*;172.29.*;172.30.*;172.31.*;192.168.*';

const electronAppPath = app.getPath('appData');

export const rootPath = path.resolve(__dirname, '../../');

export const ssrProtocol = 'ssr';
export const ssProtocol = 'ss';
export const ssPrefix = `${ssProtocol}:`;
export const ssrPrefix = `${ssrProtocol}:`;
export const isInspect = process.env.INSPECT;
export const platform = os.platform();
export const isMacOS = platform === 'darwin';
export const isWindows = platform === 'win32';
export const isLinux = platform === 'linux';
export const packageName = 'v2rayx';
export const v2rayPackageName = 'v2ray-core';
export const singBoxPackageName = 'single-box';
export const appDataPath = path.join(electronAppPath, packageName);
export const v2rayBin = path.join(
  app.getPath('userData'),
  v2rayPackageName,
  `v2ray${isWindows ? '.exe' : ''}`,
);

export const v2rayRuntimeConfigPath = path.join(
  app.getPath('userData'),
  v2rayPackageName,
  'tmp.json',
);
export const pathRuntime = path.join(appDataPath, 'runtime/');
export const pathExecutable = is.dev
  ? app.getAppPath()
  : isMacOS
    ? path.join(path.dirname(app.getPath('exe')), '..')
    : path.dirname(app.getPath('exe'));

export const arch = os.arch();

export const archMap = new Map([
  ['aarch64', 'arm64'],
  ['x86', 'ia32'],
  ['x64', 'x64'],
  ['ia32', 'ia32'],
  ['arm64', 'arm64'],
]);

export const v2rayPlatform = new Map([
  ['darwin', 'macos'],
  ['win32', 'windows'],
  ['linux', 'linux'],
]);

export const v2rayArch = new Map([
  ['x64', '64'],
  ['ia32', '32'],
  ['arm', 'arm32-v7a'],
  ['arm64', 'arm64-v8a'],
]);

export const getPathRoot = (p: string) => path.join(appDataPath, p);
export const getPathRuntime = (p: string) => path.join(pathRuntime, p);
export const pacDir = getPathRuntime('pac');
export const binDir = getPathRuntime('bin');
export const v2rayDir = path.join(app.getPath('userData'), v2rayPackageName);
export const singleBoxDir = path.join(app.getPath('userData'), singBoxPackageName);
export const globalPacConf = path.resolve(pacDir, 'gfwlist.txt');
export const userPacConf = path.resolve(pacDir, 'gfwlist-user.txt');
export const v2rayPackagePath = path.join(
  v2rayPackage,
  platform,
  arch,
  `v2ray-${v2rayPlatform.get(platform)}-${v2rayArch.get(arch)}.zip`,
);

export const emptyV2Template = () => {
  const config: any = {
    log: {
      error: '',
      loglevel: 'info',
      access: '',
    },
    inbounds: [
      {
        listen: '127.0.0.1',
        port: 10801,
        protocol: 'socks',
        tag: 'socks-inbound',
        allocate: {
          strategy: 'always',
          refresh: 5,
          concurrency: 3,
        },
      },
      {
        listen: '127.0.0.1',
        port: 10871,
        protocol: 'http',
        tag: 'http-inbound',
        allocate: {
          strategy: 'always',
          refresh: 5,
          concurrency: 3,
        },
      },

      {
        listen: '127.0.0.1',
        port: 10085,
        protocol: 'dokodemo-door',
        settings: {
          address: '127.0.0.1',
        },
        tag: 'api',
      },
    ],
    stats: {},
    api: {
      services: ['HandlerService', 'LoggerService', 'StatsService'],
      tag: 'api',
    },
    policy: {
      levels: {
        '0': {
          statsUserUplink: true,
          statsUserDownlink: true,
        },
      },
      system: {
        statsInboundUplink: true,
        statsInboundDownlink: true,
        statsOutboundUplink: true,
        statsOutboundDownlink: true,
      },
    },
    outbounds: [],
    dns: {},
    routing: {
      settings: {
        domainStrategy: 'AsIs',
        rules: [
          {
            inboundTag: ['api'],
            outboundTag: 'api',
            type: 'field',
          },
        ],
      },
    },
    transport: {},
  };
  const outboundsInjection = [
    {
      tag: 'direct',
      protocol: 'freedom',
      settings: {
        domainStrategy: 'UseIP',
        userLevel: 0,
      },
    },
    {
      tag: 'block',
      protocol: 'blackhole',
      settings: {
        response: {
          type: 'none',
        },
      },
    },
  ];
  const outbounds: any = {
    mux: {
      enabled: false,
      concurrency: 8,
    },
    protocol: 'vmess',
    streamSettings: {
      wsSettings: {
        path: '',
        headers: {
          host: '',
        },
      },
      tlsSettings: {
        serverName: '',
        allowInsecure: false,
      },
      security: 'none',
      network: '',
    },
    tag: 'proxy',
    settings: {
      vnext: [
        {
          address: '',
          users: [
            {
              id: '',
              alterId: 0,
              level: 0,
              security: '',
            },
          ],
          port: 0,
        },
      ],
    },
  };
  config.outbounds = [outbounds, ...outboundsInjection];
  return config;
};

export default {
  v2rayPackageName,
  packageName,
  platform,
  isInspect,
  isMacOS,
  appDataPath,
  pathRuntime,
  pathExecutable,
  getPathRoot,
  getPathRuntime,
};
