// 日志的级别。默认值为 "warning"。
//
// "debug"：详细的调试性信息。同时包含所有 "info" 内容。
// "info"：V2Ray 在运行时的状态，不影响正常使用。同时包含所有 "warning" 内容。
// "warning"：V2Ray 遇到了一些问题，通常是外部问题，不影响 V2Ray 的正常运行，但有可能影响用户的体验。同时包含所有 "error" 内容。
// "error"：V2Ray 遇到了无法正常运行的问题，需要立即解决。
// "none"：不记录任何内容。
//
// reference: https://www.v2fly.org/config/overview.html#logobject
import { VMessV2, TrojanType, VLessType } from '../utils/protocol/index';
export type { VMessV2, TrojanType, VLessType };

export type TitleWithTooltipType = {
  title: string;
  tooltip?: string;
  children?: React.ReactNode;
};

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

export type Servers = Server[];

export type EmptyObject = Record<string, never>;

export type Server = {
  id: string;
  link: string;
  ps: string;
  speedTestType: string;
  group: string;
  groupId: string;
  latency: string;
  outbound: Record<string, any>;
};

export type ServersGroup = {
  groupId: string;
  group: string;
  remark: string;
  link: string;
  speedTestType: string;
  subServers: Server[];
};

export type Subscription = {
  remark: string;
  link: string;
};

type V2RayCore = {
  version: string;
  isReinstallV2rayPackage: boolean;
};

type GeneralSettings = {
  appVersion: string;
  autoLaunch: boolean;
  allowSystemNotification: boolean;
  autoStartProxy: boolean;
  dashboardPopWhenStart: boolean;
  applicationLogsFolder: string;
  v2rayLogsFolder: string;
  automaticUpgrade: {
    visiableUpgradeTip: boolean;
    autodownloadAndInstall: boolean;
  };
};

type Appearance = {
  theme: string;
  customStyle: boolean;
  styleInJson: string;
  followSystemTheme: boolean;
  darkMode: boolean;
  fontFamily: string;
  hideTrayBar: boolean;
  enhancedTrayIcon: string;
};
export type Mode = 'PAC' | 'Global' | 'Manual';

type SystemProxy = {
  proxyMode: Mode;
  bypassDomains: string;
  pacSetting: {
    banListUrl: string;
    userRules: string;
  };
};

type Proxies = {
  latencyTest: {
    url: string;
    timeout: number;
  };
};

// Define SniffingObject type
type SniffingObject = {
  enabled: boolean;
  destOverride: string[];
  metadataOnly: boolean;
};

// Define AllocateObject type
type AllocateObject = {
  strategy: string;
  refresh: number;
  concurrency: number;
};

// TcpObject
type TcpObject = {
  acceptProxyProtocol: boolean;
  header: {
    type: string;
  };
};

// KcpObject
type KcpObject = {
  mtu: number;
  tti: number;
  uplinkCapacity: number;
  downlinkCapacity: number;
  congestion: boolean;
  readBufferSize: number;
  writeBufferSize: number;
  header: {
    type: string;
  };
};

// WebSocketObject
type WebSocketObject = {
  path: string;
  headers: Record<string, string>;
};

// HttpObject
type HttpObject = {
  host: string[];
  path: string;
};

// QuicObject
type QuicObject = {
  key: string;
  header: {
    type: string;
  };
};

// DomainSocketObject
type DomainSocketObject = {
  path: string;
};

// GrpcObject
type GrpcObject = {
  initial_windows_size: number;
  health_check_timeout: number;
  idle_timeout: number;
  permit_without_stream: boolean;
  user_agent: string;
  serviceName: string;
  multiMode: boolean;
};

// SockoptObject
type SockoptObject = {
  mark: number;
  tcpFastOpen: boolean;
  tcpFastOpenQueueLength: number;
  tproxy: 'redirect' | 'tproxy' | 'off';
  tcpKeepAliveInterval: number;
};

// TLSObject
type TLSObject = Partial<{
  serverName: string;
  alpn: string[];
  allowInsecure: boolean;
  disableSystemRoot: boolean;
  certificates: CertificateObject[];
  verifyClientCertificate: boolean;
  fingerprint: string;
  pinnedPeerCertificateChainSha256: string;
}>;

// CertificateObject
type CertificateObject = {
  usage: 'encipherment' | 'verify' | 'issue' | 'verifyclient';
  certificateFile: string;
  certificate: string[];
  keyFile: string;
  key: string[];
};

// Define InboundObject type
export interface InboundObject {
  listen: string;
  port: number;
  protocol: string;
  settings?: Record<string, any>;
  streamSettings?: StreamSettingsObject;
  tag?: string;
  sniffing?: SniffingObject;
  allocate?: AllocateObject;
}

type V2rayConfigure = {
  inbounds: InboundObject[];
  dns: string;
};
// StreamSettingsObject
export interface StreamSettingsObject {
  network: 'tcp' | 'kcp' | 'ws' | 'http' | 'domainsocket' | 'quic' | 'grpc';
  security: 'none' | 'tls';
  tlsSettings?: TLSObject;
  tcpSettings?: TcpObject;
  kcpSettings?: KcpObject;
  wsSettings?: WebSocketObject;
  httpSettings?: HttpObject;
  quicSettings?: QuicObject;
  dsSettings?: DomainSocketObject;
  grpcSettings?: GrpcObject;
  sockopt?: SockoptObject;
}

type realitySettings = {
  spiderX: string;
  publicKey: string;
  show: boolean;
  serverName: string;
  shortId: string;
  fingerprint: string;
};

type xtlsSettings = {
  serverName: string;
  allowInsecure: boolean;
  fingerprint: string;
};

export type StreamSettings = {
  network: 'tcp' | 'kcp' | 'ws' | 'h2' | 'quic' | 'grpc';
  security: 'none' | 'tls' | 'reality';
  tlsSettings?: TLSObject;
  tcpSettings?: TcpObject;
  kcpSettings?: KcpObject;
  wsSettings?: WebSocketObject;
  httpSettings?: HttpObject;
  quicSettings?: QuicObject;
  dsSettings?: DomainSocketObject;
  grpcSettings?: GrpcObject;
  realitySettings?: realitySettings;
  xtlsSettings?: xtlsSettings;
  sockopt?: SockoptObject;
};

export type Mux = {
  enabled: boolean;
  concurrency: number;
};

export type VMessSettings = Partial<{
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
}>;

export type VLessSettings = Partial<{
  vnext: {
    address: string;
    users: {
      id: string;
      level: number;
      encryption: string;
      flow: string;
    }[];
    port: number;
  }[];
}>;

export type TrojanSettings = Partial<{
  servers: {
    password: string;
    port: number;
    email: string;
    level: number;
    flow: string;
    address: string;
  }[];
}>;

export type Outbound = Partial<{
  mux?: Mux;
  protocol: string;
  streamSettings: StreamSettings;
  tag: string;
  settings: Partial<VMessSettings & VLessSettings & TrojanSettings>;
}>;

export type SettingsPageType = {
  v2rayCore: V2RayCore;
  generalSettings: GeneralSettings;
  appearance: Appearance;
  systemProxy: SystemProxy;
  proxies: Proxies;
  v2rayConfigure: V2rayConfigure;
};

export type GithubReleaseLatest = {
  title: 'Release';
  description: 'A release.';
  type: 'object';
  properties: {
    url: {
      type: 'string';
      format: 'uri';
    };
    html_url: {
      type: 'string';
      format: 'uri';
    };
    assets_url: {
      type: 'string';
      format: 'uri';
    };
    upload_url: {
      type: 'string';
    };
    tarball_url: {
      type: ['string', 'null'];
      format: 'uri';
    };
    zipball_url: {
      type: ['string', 'null'];
      format: 'uri';
    };
    id: {
      type: 'integer';
    };
    node_id: {
      type: 'string';
    };
    tag_name: {
      description: 'The name of the tag.';
      type: 'string';
      examples: ['v1.0.0'];
    };
    target_commitish: {
      description: 'Specifies the commitish value that determines where the Git tag is created from.';
      type: 'string';
      examples: ['master'];
    };
    name: {
      type: ['string', 'null'];
    };
    body: {
      type: ['string', 'null'];
    };
    draft: {
      description: 'true to create a draft (unpublished) release, false to create a published one.';
      type: 'boolean';
      examples: [false];
    };
    prerelease: {
      description: 'Whether to identify the release as a prerelease or a full release.';
      type: 'boolean';
      examples: [false];
    };
    created_at: {
      type: 'string';
      format: 'date-time';
    };
    published_at: {
      type: ['string', 'null'];
      format: 'date-time';
    };
    author: {
      title: 'Simple User';
      description: 'A GitHub user.';
      type: 'object';
      properties: {
        name: {
          type: ['string', 'null'];
        };
        email: {
          type: ['string', 'null'];
        };
        login: {
          type: 'string';
          examples: ['octocat'];
        };
        id: {
          type: 'integer';
          examples: [1];
        };
        node_id: {
          type: 'string';
          examples: ['MDQ6VXNlcjE='];
        };
        avatar_url: {
          type: 'string';
          format: 'uri';
          examples: ['https://github.com/images/error/octocat_happy.gif'];
        };
        gravatar_id: {
          type: ['string', 'null'];
          examples: ['41d064eb2195891e12d0413f63227ea7'];
        };
        url: {
          type: 'string';
          format: 'uri';
          examples: ['https://api.github.com/users/octocat'];
        };
        html_url: {
          type: 'string';
          format: 'uri';
          examples: ['https://github.com/octocat'];
        };
        followers_url: {
          type: 'string';
          format: 'uri';
          examples: ['https://api.github.com/users/octocat/followers'];
        };
        following_url: {
          type: 'string';
          examples: ['https://api.github.com/users/octocat/following{/other_user}'];
        };
        gists_url: {
          type: 'string';
          examples: ['https://api.github.com/users/octocat/gists{/gist_id}'];
        };
        starred_url: {
          type: 'string';
          examples: ['https://api.github.com/users/octocat/starred{/owner}{/repo}'];
        };
        subscriptions_url: {
          type: 'string';
          format: 'uri';
          examples: ['https://api.github.com/users/octocat/subscriptions'];
        };
        organizations_url: {
          type: 'string';
          format: 'uri';
          examples: ['https://api.github.com/users/octocat/orgs'];
        };
        repos_url: {
          type: 'string';
          format: 'uri';
          examples: ['https://api.github.com/users/octocat/repos'];
        };
        events_url: {
          type: 'string';
          examples: ['https://api.github.com/users/octocat/events{/privacy}'];
        };
        received_events_url: {
          type: 'string';
          format: 'uri';
          examples: ['https://api.github.com/users/octocat/received_events'];
        };
        type: {
          type: 'string';
          examples: ['User'];
        };
        site_admin: {
          type: 'boolean';
        };
        starred_at: {
          type: 'string';
          examples: ['"2020-07-09T00:17:55Z"'];
        };
      };
      required: [
        'avatar_url',
        'events_url',
        'followers_url',
        'following_url',
        'gists_url',
        'gravatar_id',
        'html_url',
        'id',
        'node_id',
        'login',
        'organizations_url',
        'received_events_url',
        'repos_url',
        'site_admin',
        'starred_url',
        'subscriptions_url',
        'type',
        'url',
      ];
    };
    assets: {
      type: 'array';
      items: {
        title: 'Release Asset';
        description: 'Data related to a release.';
        type: 'object';
        properties: {
          url: {
            type: 'string';
            format: 'uri';
          };
          browser_download_url: {
            type: 'string';
            format: 'uri';
          };
          id: {
            type: 'integer';
          };
          node_id: {
            type: 'string';
          };
          name: {
            description: 'The file name of the asset.';
            type: 'string';
            examples: ['Team Environment'];
          };
          label: {
            type: ['string', 'null'];
          };
          state: {
            description: 'State of the release asset.';
            type: 'string';
            enum: ['uploaded', 'open'];
          };
          content_type: {
            type: 'string';
          };
          size: {
            type: 'integer';
          };
          download_count: {
            type: 'integer';
          };
          created_at: {
            type: 'string';
            format: 'date-time';
          };
          updated_at: {
            type: 'string';
            format: 'date-time';
          };
          uploader: {
            anyOf: [
              {
                type: 'null';
              },
              {
                title: 'Simple User';
                description: 'A GitHub user.';
                type: 'object';
                properties: {
                  name: {
                    type: ['string', 'null'];
                  };
                  email: {
                    type: ['string', 'null'];
                  };
                  login: {
                    type: 'string';
                    examples: ['octocat'];
                  };
                  id: {
                    type: 'integer';
                    examples: [1];
                  };
                  node_id: {
                    type: 'string';
                    examples: ['MDQ6VXNlcjE='];
                  };
                  avatar_url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://github.com/images/error/octocat_happy.gif'];
                  };
                  gravatar_id: {
                    type: ['string', 'null'];
                    examples: ['41d064eb2195891e12d0413f63227ea7'];
                  };
                  url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://api.github.com/users/octocat'];
                  };
                  html_url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://github.com/octocat'];
                  };
                  followers_url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://api.github.com/users/octocat/followers'];
                  };
                  following_url: {
                    type: 'string';
                    examples: ['https://api.github.com/users/octocat/following{/other_user}'];
                  };
                  gists_url: {
                    type: 'string';
                    examples: ['https://api.github.com/users/octocat/gists{/gist_id}'];
                  };
                  starred_url: {
                    type: 'string';
                    examples: ['https://api.github.com/users/octocat/starred{/owner}{/repo}'];
                  };
                  subscriptions_url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://api.github.com/users/octocat/subscriptions'];
                  };
                  organizations_url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://api.github.com/users/octocat/orgs'];
                  };
                  repos_url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://api.github.com/users/octocat/repos'];
                  };
                  events_url: {
                    type: 'string';
                    examples: ['https://api.github.com/users/octocat/events{/privacy}'];
                  };
                  received_events_url: {
                    type: 'string';
                    format: 'uri';
                    examples: ['https://api.github.com/users/octocat/received_events'];
                  };
                  type: {
                    type: 'string';
                    examples: ['User'];
                  };
                  site_admin: {
                    type: 'boolean';
                  };
                  starred_at: {
                    type: 'string';
                    examples: ['"2020-07-09T00:17:55Z"'];
                  };
                };
                required: [
                  'avatar_url',
                  'events_url',
                  'followers_url',
                  'following_url',
                  'gists_url',
                  'gravatar_id',
                  'html_url',
                  'id',
                  'node_id',
                  'login',
                  'organizations_url',
                  'received_events_url',
                  'repos_url',
                  'site_admin',
                  'starred_url',
                  'subscriptions_url',
                  'type',
                  'url',
                ];
              },
            ];
          };
        };
        required: [
          'id',
          'name',
          'content_type',
          'size',
          'state',
          'url',
          'node_id',
          'download_count',
          'label',
          'uploader',
          'browser_download_url',
          'created_at',
          'updated_at',
        ];
      };
    };
    body_html: {
      type: 'string';
    };
    body_text: {
      type: 'string';
    };
    mentions_count: {
      type: 'integer';
    };
    discussion_url: {
      description: 'The URL of the release discussion.';
      type: 'string';
      format: 'uri';
    };
    reactions: {
      title: 'Reaction Rollup';
      type: 'object';
      properties: {
        url: {
          type: 'string';
          format: 'uri';
        };
        total_count: {
          type: 'integer';
        };
        '+1': {
          type: 'integer';
        };
        '-1': {
          type: 'integer';
        };
        laugh: {
          type: 'integer';
        };
        confused: {
          type: 'integer';
        };
        heart: {
          type: 'integer';
        };
        hooray: {
          type: 'integer';
        };
        eyes: {
          type: 'integer';
        };
        rocket: {
          type: 'integer';
        };
      };
      required: [
        'url',
        'total_count',
        '+1',
        '-1',
        'laugh',
        'confused',
        'heart',
        'hooray',
        'eyes',
        'rocket',
      ];
    };
  };
  required: [
    'assets_url',
    'upload_url',
    'tarball_url',
    'zipball_url',
    'created_at',
    'published_at',
    'draft',
    'id',
    'node_id',
    'author',
    'html_url',
    'name',
    'prerelease',
    'tag_name',
    'target_commitish',
    'assets',
    'url',
  ];
};
