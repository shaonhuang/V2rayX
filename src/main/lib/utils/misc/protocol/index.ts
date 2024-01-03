import { VMess, VMessV2 } from './VMess';
import { VLess, VLessType } from './VLess';
import { Trojan, TrojanType } from './Trojan';

export class Protocol {
  private type;
  private data;
  private outbound;
  constructor() {
    this.data = {};
    this.outbound = {};
  }
}

export const v2rayTemplate = () => {
  const config = {
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
  config.outbounds = {};
  return config;
};

export { VMess, VLess, Trojan };
export type { VLessType, TrojanType, VMessV2 };
