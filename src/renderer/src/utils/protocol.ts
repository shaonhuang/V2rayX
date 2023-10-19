import { decode, encode } from 'js-base64';

const isWindows = navigator.platform.includes('Win');
let logsDir;
window.electron.electronAPI.ipcRenderer
  .invoke('get-logs-path')
  .then((logsPath) => {
    // Use the logsPath in the renderer process
    logsDir = logsPath;
  })
  .catch((error) => {
    console.error(error);
    // Handle any errors that occur during IPC communication
    logsDir = '';
  });

// reference https://github.com/kyuuseiryuu/v2ray-tools.git

const tryToParseJson = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch (e) {}
};

const tryDecode = (encoded: string): string => {
  try {
    return decode(encoded);
  } catch (e) {}
  return '';
};
const v1ToV2Mapper = {
  remarks: 'ps',
  obfsParam: 'host',
  obfs: 'net',
  alterId: 'aid',
};

const v2ToV1Mapper = {
  ps: 'remarks',
  host: 'obfsParam',
  net: 'obfs',
};

const v2ToStdV2Mapper = {
  security: 'scy',
};

const v1Converter = {};

const v2Converter = {
  ps: (v) => encodeURIComponent(v),
  net: (v) => {
    if (['tcp', 'kcp', 'ws', 'h2', 'quic'].includes(v)) {
      return v;
    }
    switch (v) {
      case 'websocket':
        return 'ws';
      case 'http':
        return 'h2';
      default:
        return v;
    }
  },
  host: (v) => {
    try {
      if (typeof JSON.parse(v) === 'object') {
        const vObj = JSON.parse(v);
        for (const key of Object.keys(vObj)) {
          if (key.toLowerCase() === 'host') {
            return vObj[key];
          }
        }
        return v;
      }
    } catch (e) {}
    return v;
  },
  tls: (v) => (v === '1' ? 'tls' : ''),
};
const v2ToStdV2Converter = {
  scy: (v) => encodeURIComponent(v),
};

// https://github.com/v2ray/v2ray-core/issues/1139
/*
  VmessV1
  vmess://base64(security:uuid@host:port)?[urlencode(parameters)]
  其中 base64、urlencode 为函数，security 为加密方式，parameters 是以 & 为分隔符的参数列表，
  例如：network=kcp&aid=32&remarks=服务器1 经过 urlencode 后为 network=kcp&aid=32&remarks=%E6%9C%8D%E5%8A%A1%E5%99%A81
  可选参数（参数名称不区分大小写）：
  network - 可选的值为 "tcp"、 "kcp"、"ws"、"h2" 等
  wsPath - WebSocket 的协议路径
  wsHost - WebSocket HTTP 头里面的 Host 字段值
  kcpHeader - kcp 的伪装类型
  uplinkCapacity - kcp 的上行容量
  downlinkCapacity - kcp 的下行容量
  h2Path - h2 的路径
  h2Host - h2 的域名
  aid - AlterId
  tls - 是否启用 TLS，为 0 或 1
  allowInsecure - TLS 的 AllowInsecure，为 0 或 1
  tlsServer - TLS 的服务器端证书的域名
  mux - 是否启用 mux，为 0 或 1
  muxConcurrency - mux 的 最大并发连接数
  remarks - 备注名称
  导入配置时，不在列表中的参数一般会按照 Core 的默认值处理。
*/

export interface VmessV1 {
  network: string;
  wsPath: string;
  wsHost: string;
  kcpHeader: string;
  uplinkCapacity: string;
  downlinkCapacity: string;
  h2Path: string;
  h2Host: string;
  aid: string;
  tls: string;
  allowInsecure: string;
  tlsServer: string;
  mux: string;
  muxConcurrency: string;
  remark: string;
}
// https://github.com/2dust/v2rayN/wiki/%E5%88%86%E4%BA%AB%E9%93%BE%E6%8E%A5%E6%A0%BC%E5%BC%8F%E8%AF%B4%E6%98%8E(ver-2)
/*
  分享的链接（二维码）格式：vmess://(Base68编码的json格式服务器数据
  json数据如下
  {
  "v": "2",
  "ps": "备注别名",
  "add": "111.111.111.111",
  "port": "32000",
  "id": "1386f85e-657b-4d6e-9d56-78badb75e1fd",
  "aid": "100",
  "net": "tcp",
  "type": "none",
  "host": "www.bbb.com",
  "path": "/",
  "tls": "tls"
  }
  v:配置文件版本号,主要用来识别当前配置
  net ：传输协议（tcp\kcp\ws\h2)
  type:伪装类型（none\http\srtp\utp\wechat-video）
  host：伪装的域名
  1)http host中间逗号(,)隔开
  2)ws host
  3)h2 host
  path:path(ws/h2)
  tls：底层传输安全（tls)
*/
export type VmessV2 = Partial<{
  v: string;
  ps: string;
  add: string;
  port: number;
  id: string;
  aid: string;
  net: 'tcp' | 'kcp' | 'ws' | 'h2' | 'quic';
  type: string;
  host: string;
  path: string;
  tls: string;
  scy: string;
}>;

export type VmessV2Object = Partial<{
  v: string;
  ps: string;
  address: string;
  port: number;
  id: string;
  alterId: number;
  level: number;
  network: string;
  host: string;
  path: string;
  tls: string;
}>;

const isVMessLink = (link: string): boolean => {
  return /^vmess:\/\//i.test(link) && (Boolean(parseV1Link(link)) || Boolean(parseV2Link(link)));
};
const isVMessLinkV1 = (link: string): boolean => {
  const linkBody = link.replace(/^vmess:\/\//i, '');
  return linkBody.includes('?');
};

const isVMessLinkV2 = (link: string): boolean => {
  const linkBody = link.replace(/^vmess:\/\//i, '');
  return !linkBody.includes('?') && tryToParseJson(tryDecode(linkBody));
};

const parseV1Link = (v1Link: string): VmessV2 | undefined => {
  if (!isVMessLinkV1(v1Link)) return;
  const [main, searchStr] = v1Link.replace(/^vmess:\/\//i, '').split('?');
  const s = tryDecode(main);
  if (!s) return;
  const [type, id, add, port] = s.split(/[@:]/);
  const search = {};
  const searchParams = new URLSearchParams(searchStr);
  searchParams.forEach((value, key) => {
    const newKey = v1ToV2Mapper[key] || key;
    search[newKey] = v2Converter[newKey] ? v2Converter[newKey](value) : value;
  });
  return {
    v: '2',
    type,
    id,
    add,
    port: Number(port),
    ...search,
  };
};

const parseV2Link = (link: string): VmessV2 | undefined => {
  if (!isVMessLinkV2(link)) return;
  const s = decode(link.replace(/^vmess:\/\//i, ''));
  if (!s) return;
  const obj = JSON.parse(s);
  const params = {};
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = v2ToStdV2Mapper[key] || key;
    params[newKey] = v2ToStdV2Converter[newKey] ? v2ToStdV2Converter[newKey](value) : value;
  });
  return params;
};

export const toV1Link = (link: string): string => {
  if (!isVMessLink(link)) return '';
  if (isVMessLinkV1(link)) return link;
  const parsed = parseV2Link(link);
  if (!parsed) return '';
  return objToV1Link(parsed);
};

export const toV2Link = (link: string): string => {
  if (!isVMessLink(link)) return '';
  if (isVMessLinkV2(link)) return link;
  const v2 = parseV1Link(link);
  if (!v2) return '';
  return objToV2Link(v2);
};

const objToV1Link = (obj: VmessV2): string => {
  const { v, type, id, port, add, ...others } = obj;
  const searchParams = new URLSearchParams();
  Object.keys(others).forEach((k) => {
    const newKey = v2ToV1Mapper[k] || k;
    const newValue = v1Converter[newKey] ? v1Converter[newKey](others[k]) : others[k];
    searchParams.append(newKey, newValue);
  });
  return `vmess://${encode(`${type}:${id}@${add}:${port}`)}?${decodeURIComponent(
    searchParams.toString(),
  )}`;
};

const objToV2Link = (obj: VmessV2): string => {
  return `vmess://${encode(JSON.stringify({ ...obj, v: '2' }))}`;
};

const parseVmess2config = (obj: VmessV2) => {
  if (JSON.stringify(obj) === '{}') return {};
  const config: any = {
    log: {
      loglevel: 'info',
      error: logsDir ? `${logsDir}${isWindows ? '\\' : '/'}error.log` : '',
      access: logsDir ? `${logsDir}${isWindows ? '\\' : '/'}access.log` : '',
    },
    inbounds: [
      {
        listen: '127.0.0.1',
        protocol: 'socks',
        settings: {
          udp: false,
          auth: 'noauth',
        },
        port: '10801',
      },
      {
        listen: '127.0.0.1',
        protocol: 'http',
        settings: {
          timeout: 360,
        },
        port: '10871',
      },
    ],
    outbounds: [],
    dns: {},
    routing: {
      settings: {
        domainStrategy: 'AsIs',
        rules: [],
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
      security: '',
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
          port: 443,
        },
      ],
    },
  };
  const other = {
    ps: decodeURIComponent(obj.ps ?? ''),
  };
  outbounds.streamSettings.wsSettings.path = obj.path;
  outbounds.streamSettings.wsSettings.headers.host = obj.host;
  outbounds.streamSettings.tlsSettings.serverName = obj.host;
  // outbounds.streamSettings.tlsSettings.allowInsecure =
  outbounds.streamSettings.security = obj.tls;
  outbounds.streamSettings.network = obj.net;
  outbounds.settings.vnext[0].address = obj.add;
  outbounds.settings.vnext[0].users[0] = {
    id: obj.id,
    alterId: Number(obj.aid),
    level: 0,
    security: obj.scy ?? 'none',
  };
  outbounds.settings.vnext[0].port = Number(obj.port);
  config.outbounds = [outbounds, ...outboundsInjection];
  config.other = other;
  return config;
};
const fromJson2Vmess2 = (json: any): VmessV2 => {
  const { outbounds, other } = json;
  const { settings, streamSettings } = outbounds[0];
  const ps = encodeURIComponent(other.ps),
    add = settings.vnext[0].address,
    port = settings.vnext[0].port,
    tls = streamSettings.security,
    net = streamSettings.network,
    scy = settings.vnext[0].users[0].security,
    id = settings.vnext[0].users[0].id,
    aid = settings.vnext[0].users[0].alterId,
    type = 'none',
    host = streamSettings.wsSettings.headers.host,
    path = streamSettings.wsSettings.path;

  return {
    v: '2',
    ps,
    add,
    port,
    id,
    aid,
    net,
    type,
    host,
    path,
    tls,
    scy,
  };
};

const emptyVmessV2 = (): VmessV2 => {
  const config: any = {
    log: {
      error: '',
      loglevel: 'info',
      access: '',
    },
    inbounds: [
      {
        listen: '127.0.0.1',
        protocol: 'socks',
        settings: {
          udp: false,
          auth: 'noauth',
        },
        port: '10801',
      },
      {
        listen: '127.0.0.1',
        protocol: 'http',
        settings: {
          timeout: 360,
        },
        port: '10871',
      },
    ],
    outbounds: [],
    dns: {},
    routing: {
      settings: {
        domainStrategy: 'AsIs',
        rules: [],
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
        path: '/hkcHOyeEK',
        headers: {
          host: 'hihacker.shop',
        },
      },
      tlsSettings: {
        serverName: 'hihacker.shop',
        allowInsecure: false,
      },
      security: 'tls',
      network: 'ws',
    },
    tag: 'proxy',
    settings: {
      vnext: [
        {
          address: '45.76.168.25',
          users: [
            {
              id: '54374ca2-3388-4df2-a999-08bb81eefee7',
              alterId: 0,
              level: 0,
              security: 'aes-128-gcm',
            },
          ],
          port: 443,
        },
      ],
    },
  };
  config.outbounds = [outbounds, ...outboundsInjection];
  return config;
};
// link: https://github.com/shadowsocks/ShadowsocksX-NG

// link: https://coderschool.cn/2498.html

export {
  isVMessLink,
  isVMessLinkV1,
  isVMessLinkV2,
  parseV1Link,
  parseV2Link,
  objToV1Link,
  objToV2Link,
  parseVmess2config,
  fromJson2Vmess2,
  emptyVmessV2,
};
