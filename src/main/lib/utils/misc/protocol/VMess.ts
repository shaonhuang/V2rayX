import { decode, encode } from 'js-base64';
import { Protocol } from './index';

// reference https://github.com/kyuuseiryuu/v2ray-tools.git
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

export interface VMessV1 {
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
export type VMessV2 = Partial<{
  v: string;
  ps: string;
  add: string;
  port: number;
  id: string;
  aid: string;
  net: 'tcp' | 'kcp' | 'ws' | 'h2' | 'quic' | 'grpc';
  type: string;
  host: string;
  path: string;
  tls: string;
  scy: string;
  alpn: string;
  fp: string;
  sni: string;
}>;

export type VMessV2Object = Partial<{
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

export const outbound2VMess2 = (json): VMessV2 => {
  const { outbounds, other } = json;
  const { settings, streamSettings } = outbounds[0];
  const ps = encodeURIComponent(other?.ps ?? ''),
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
const v1ToV2Mapper = {
  remarks: 'ps',
  obfsParam: 'host',
  obfs: 'net',
  alterId: 'aid',
};

const v2ToStdV2Mapper = {
  security: 'scy',
};

const v1Converter = {};

const v2Converter = {
  ps: (v) => encodeURIComponent(v ?? ''),
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

export class VMess {
  private data: VMessV2 = {};
  private outbound: Record<string, any> = {};

  constructor(arg: Partial<{ vmess: VMessV2; outbound: Record<string, any> }> | string) {
    try {
      if (typeof arg === 'string') {
        if (
          (/^vmess:\/\//i.test(arg) && this.isVMessLinkV1(arg)) ||
          this.isVMessLinkV2(arg as string)
        ) {
          if (this.isVMessLinkV1(arg as string)) {
            this.data = this.parseV1Link(arg as string);
          }
          this.data = this.parseV2Link(arg as string) as VMessV2;
          this.outbound = this.getOutbound();
          return this;
        }
      } else if (typeof arg === 'object') {
        this.data = arg?.data ?? {};
        this.outbound = this.getOutbound() ?? {};
        return this;
      }
      throw new Error();
    } catch (err) {}
  }

  private tryToParseJson(str: string): any {
    try {
      return JSON.parse(str);
    } catch (e) {
      throw new Error();
    }
  }

  private tryDecode(encoded: string): string {
    try {
      return decode(encoded);
    } catch (e) {
      throw new Error();
    }
  }

  private isVMessLink(link: string): boolean {
    return (
      /^vmess:\/\//i.test(link) &&
      (Boolean(this.parseV1Link(link)) || Boolean(this.parseV2Link(link)))
    );
  }
  private isVMessLinkV1(link: string): boolean {
    const linkBody = link.replace(/^vmess:\/\//i, '');
    return linkBody.includes('?');
  }

  private isVMessLinkV2(link: string): boolean {
    const linkBody = link.replace(/^vmess:\/\//i, '');
    return !linkBody.includes('?') && this.tryToParseJson(this.tryDecode(linkBody));
  }
  private parseV1Link(v1Link: string): VMessV2 {
    const [main, searchStr] = v1Link.replace(/^vmess:\/\//i, '').split('?');
    const s = this.tryDecode(main);
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
  }

  private parseV2Link(link: string): VMessV2 | undefined {
    const v2ToStdV2Converter = {
      scy: (v) => encodeURIComponent(v),
    };
    const s = decode(link.replace(/^vmess:\/\//i, ''));
    const obj = JSON.parse(s);
    const params = {};
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = v2ToStdV2Mapper[key] || key;
      params[newKey] = v2ToStdV2Converter[newKey] ? v2ToStdV2Converter[newKey](value) : value;
    });
    return params;
  }
  getLink(): string {
    return `vmess://${encode(JSON.stringify({ ...this.data, v: '2' }))}`;
  }
  getData() {
    return this.data;
  }
  updateData(arg) {
    this.data = Object.assign(this.data, arg);
    return this.data;
  }
  getOutbound(obj?: VmessV2) {
    const { ps, add, port, id, aid, net, type, host, path, tls, scy, alpn, sni, fp } =
      obj ?? this.data;
    const outbound: any = {
      mux: {
        enabled: false,
        concurrency: 8,
      },
      protocol: 'vmess',
      streamSettings: {
        tcpSettings: {},
        kcpSettings: {},
        httpSettings: {},
        quicSettings: {},
        dsSettings: {},
        grpcSettings: {},
        wsSettings: {},
        tlsSettings: {
          serverName: '',
          allowInsecure: true,
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
    outbound.settings.vnext[0].address = add ?? '';
    outbound.settings.vnext[0].port = port ?? 443;
    outbound.streamSettings.security = tls ?? 'none';
    outbound.streamSettings.network = net ?? 'tcp';
    outbound.settings.vnext[0].users[0].security = scy ?? 'none';
    outbound.settings.vnext[0].users[0].id = id ?? '';
    outbound.settings.vnext[0].users[0].alterId = aid ?? 0;
    // type:伪装类型（none\http\srtp\utp\wechat-video）

    switch (net) {
      case 'ws':
        outbound.streamSettings.wsSettings = {
          path: path,
          headers: {
            host: host,
          },
        };
        break;
      case 'tcp':
        outbound.streamSettings.tcpSettings = {
          acceptProxyProtocol: false,
          header: {
            type: 'none',
          },
        };
        break;
      case 'grpc':
        outbound.streamSettings.grpcSettings = {};
        break;
      case 'h2':
        outbound.streamSettings.httpSettings = {};
        break;
      case 'kcp':
        outbound.streamSettings.kcpSettings = {};
        break;
      case 'quic':
        outbound.streamSettings.quicSettings = {};
        break;
      // FIXME
      case 'ds':
        outbound.streamSettings.dsSettings = {};
        break;
    }

    return outbound;
  }
  getPs() {
    return this.data.ps || this.data.add || '';
  }
}
