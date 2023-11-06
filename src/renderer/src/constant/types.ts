// 日志的级别。默认值为 "warning"。
//
// "debug"：详细的调试性信息。同时包含所有 "info" 内容。
// "info"：V2Ray 在运行时的状态，不影响正常使用。同时包含所有 "warning" 内容。
// "warning"：V2Ray 遇到了一些问题，通常是外部问题，不影响 V2Ray 的正常运行，但有可能影响用户的体验。同时包含所有 "error" 内容。
// "error"：V2Ray 遇到了无法正常运行的问题，需要立即解决。
// "none"：不记录任何内容。
//
// reference: https://www.v2fly.org/config/overview.html#logobject

type Log = {
  error: string | 'none';
  loglevel: 'debug' | 'info' | 'warning' | 'error' | 'none';
  access: string | 'none';
};

type Inbound = {
  listen: string;
  protocol: string;
  settings: {
    udp: boolean;
    auth: string;
    timeout?: number;
  };
  port: number;
};

type Outbound = {
  mux?: {
    enabled: boolean;
    concurrency: number;
  };
  protocol: string;
  streamSettings: {
    network: string;
    tcpSettings: {
      header: {
        type: string;
      };
    };
    security: string;
  };
  tag: string;
  settings: {
    vnext: {
      address: string;
      users: {
        id: string;
        alterId: number;
        level: number;
        security: string;
      }[];
      port: number;
    }[];
  };
};

type DNS = Record<string, any>; // Placeholder for the actual DNS configuration type

type Routing = {
  settings: {
    domainStrategy: string;
    rules: any[]; // Placeholder for the actual rules type
  };
};

type Transport = Record<string, any>; // Placeholder for the actual transport configuration type

export type VmessObjConfiguration = {
  log: Log;
  inbounds: Inbound[];
  outbounds: Outbound[];
  dns: DNS;
  routing: Routing;
  transport: Transport;
  other: Record<string, any>;
};

export type Server = {
  id: string;
  ps: string;
  link: string;
  config: VmessObjConfiguration;
};

export type Servers = Server[];

export type EmptyObject = Record<string, never>;
