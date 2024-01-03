/**
 - {"type":"ss","name":"v2rayse_test_1","server":"198.57.27.218","port":5004,"cipher":"aes-256-gcm","password":"g5MeD6Ft3CWlJId"}
 - {"type":"ssr","name":"v2rayse_test_3","server":"20.239.49.44","port":59814,"protocol":"origin","cipher":"dummy","obfs":"plain","password":"3df57276-03ef-45cf-bdd4-4edb6dfaa0ef"}
 - {"type":"vmess","name":"v2rayse_test_2","ws-opts":{"path":"/"},"server":"154.23.190.162","port":443,"uuid":"b9984674-f771-4e67-a198-","alterId":"0","cipher":"auto","network":"ws"}
 - {"type":"vless","name":"test","server":"1.2.3.4","port":7777,"uuid":"abc-def-ghi-fge-zsx","skip-cert-verify":true,"network":"tcp","tls":true,"udp":true}
 - {"type":"trojan","name":"v2rayse_test_4","server":"ca-trojan.bonds.id","port":443,"password":"bc7593fe-0604-4fbe--b4ab-11eb-b65e-1239d0255272","udp":true,"skip-cert-verify":true}
 - {"type":"http","name":"http_proxy","server":"124.15.12.24","port":251,"username":"username","password":"password","udp":true}
 - {"type":"socks5","name":"socks5_proxy","server":"124.15.12.24","port":2312,"udp":true}
 - {"type":"socks5","name":"telegram_proxy","server":"1.2.3.4","port":123,"username":"username","password":"password","udp":true}
 */
import { parseInt } from 'lodash';
import { Protocol } from './index';

export type TrojanType = Partial<{
  password: string;
  address: string;
  port: number;
  flow: string;
  security: string;
  sni: string;
  host: string;
  remark: string;
  fp: string;
}>;

// trojan://pass@remote_host:443?flow=xtls-rprx-origin&security=xtls&sni=sni&host=remote_host#trojan
export class Trojan {
  private data: TrojanType = {};
  private outbound: Record<string, any> = {};

  constructor(arg: Partial<{ trojan: TrojanType; outbound: Record<string, any> }> | string) {
    try {
      if (typeof arg === 'string' && /^trojan:\/\//i.test(arg)) {
        this.data = this.parseTrojan(arg);
        this.outbound = this.getOutbound();
        return this;
      } else if (typeof arg === 'object') {
        this.data = arg?.data ?? {};
        this.outbound = this.getOutbound() ?? {};
        return this;
      }
      throw new Error();
    } catch (err) {}
  }

  private parseTrojan(arg: string): TrojanType {
    const [address, port] = arg.includes('?')
      ? arg.slice(8).split('?')[0].split(':')
      : arg.slice(8).split('#')[0].split(':');
    const url = new URLSearchParams(arg.slice(8).split('?')[1].split('#')[0]);
    return {
      password: address.split('@')[0],
      address: address.split('@')[1],
      port: parseInt(port),
      remark: arg.split('#')[1],
      security: url.get('security') ?? '',
      sni: url.get('sni') ?? '',
      host: url.get('host') ?? '',
      flow: url.get('flow') ?? '',
      fp: url.get('fp') ?? '',
    };
  }
  getLink() {
    const url = new URLSearchParams();
    Object.entries(this.data).forEach(
      ([key, value]) => key !== 'remark' && url.append(key, String(value)),
    );
    return `trojan://${url.toString()}#${this.data.remark}`;
  }
  getData() {
    return this.data;
  }
  upadteData(arg) {
    this.data = Object.assign(this.data, arg);
    return this.data;
  }
  getOutbound() {
    const { address, port, password, remark, security, sni, host, flow, fp } = this.data;
    const outbound = {
      mux: {
        enabled: false,
        concurrency: 8,
      },
      protocol: 'trojan',
      streamSettings: {
        kcpSettings: {},
        httpSettings: {},
        quicSettings: {},
        dsSettings: {},
        grpcSettings: {},
        wsSettings: {},
        tcpSettings: {},
        xtlsSettings: {},
        realitySettings: {},
        security: '',
        network: '',
      },
      tag: 'proxy',
      settings: {
        servers: [
          {
            password: 'pass',
            port: 443,
            email: '',
            level: 0,
            flow: '',
            address: 'remote_host',
          },
        ],
      },
    };
    outbound.settings.servers[0].address = address ?? '';
    outbound.settings.servers[0].port = port ?? 443;
    outbound.settings.servers[0].flow = flow ?? '';
    outbound.settings.servers[0].email = '';
    outbound.settings.servers[0].password = password ?? '';
    outbound.streamSettings.network = 'tcp';
    outbound.streamSettings.security = security ?? 'none';
    // FIXME:
    const type: string = 'tcp';
    // outbound.settings.servers[0].users[0].encryption = encryption ?? '';
    // outbound.settings.servers[0].users[0].id = id ?? '';

    switch (type) {
      case 'ws':
        outbound.streamSettings.wsSettings = {
          // path: path,
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
    switch (security) {
      case 'reality':
        outbound.streamSettings.realitySettings = {};
        break;
      case 'xtls':
        outbound.streamSettings.xtlsSettings = {
          serverName: sni,
          allowInsecure: true,
          fingerprint: fp,
        };
        break;
    }
    return outbound;
  }
  getPs() {
    return this.data.remark || this.data.address || '';
  }
}
