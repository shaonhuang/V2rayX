type Log = {
  error: string;
  loglevel: string;
  access: string;
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
