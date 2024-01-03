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

// 待定标准方案: https://github.com/XTLS/Xray-core/issues/91
//# VMess + TCP，不加密（仅作示例，不安全）
//vmess://99c80931-f3f1-4f84-bffd-6eed6030f53d@qv2ray.net:31415?encryption=none#VMessTCPNaked
//# VMess + TCP，自动选择加密。编程人员特别注意不是所有的 URL 都有问号，注意处理边缘情况。
//vmess://f08a563a-674d-4ffb-9f02-89d28aec96c9@qv2ray.net:9265#VMessTCPAuto
//# VMess + TCP，手动选择加密
//vmess://5dc94f3a-ecf0-42d8-ae27-722a68a6456c@qv2ray.net:35897?encryption=aes-128-gcm#VMessTCPAES
//# VMess + TCP + TLS，内层不加密
//vmess://136ca332-f855-4b53-a7cc-d9b8bff1a8d7@qv2ray.net:9323?encryption=none&security=tls#VMessTCPTLSNaked
//# VMess + TCP + TLS，内层也自动选择加密
//vmess://be5459d9-2dc8-4f47-bf4d-8b479fc4069d@qv2ray.net:8462?security=tls#VMessTCPTLS
//# VMess + TCP + TLS，内层不加密，手动指定 SNI
//vmess://c7199cd9-964b-4321-9d33-842b6fcec068@qv2ray.net:64338?encryption=none&security=tls&sni=fastgit.org#VMessTCPTLSSNI
//# VLESS + TCP + XTLS
//vless://b0dd64e4-0fbd-4038-9139-d1f32a68a0dc@qv2ray.net:3279?security=xtls&flow=rprx-xtls-splice#VLESSTCPXTLSSplice
//# VLESS + mKCP + Seed
//vless://399ce595-894d-4d40-add1-7d87f1a3bd10@qv2ray.net:50288?type=kcp&seed=69f04be3-d64e-45a3-8550-af3172c63055#VLESSmKCPSeed
//# VLESS + mKCP + Seed，伪装成 Wireguard
//vless://399ce595-894d-4d40-add1-7d87f1a3bd10@qv2ray.net:41971?type=kcp&headerType=wireguard&seed=69f04be3-d64e-45a3-8550-af3172c63055#VLESSmKCPSeedWG
//# VMess + WebSocket + TLS
//vmess://44efe52b-e143-46b5-a9e7-aadbfd77eb9c@qv2ray.net:6939?type=ws&security=tls&host=qv2ray.net&path=%2Fsomewhere#VMessWebSocketTLS
//# VLESS + TCP + reality
//vless://44efe52b-e143-46b5-a9e7-aadbfd77eb9c@qv2ray.net:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=sni.yahoo.com&fp=chrome&pbk=xxx&sid=88&type=tcp&headerType=none&host=hk.yahoo.com#reality

export type VLessType = Partial<{
  error: string;
  remark: string;
  address: string;
  port: number;
  id: string;
  level: number;
  flow: string;
  encryption: string; // auto,aes-128-gcm,...
  security: string; // xtls,tls,reality
  type: string; // tcp,http
  host: string;
  sni: string;
  path: string;
  fp: string; // fingerprint
  pbk: string; // reality public key
  sid: string; // reality shortId
  seed: string;
  headerType: string;
}>;

export class VLess {
  private data: VLessType = {};
  private outbound: Record<string, any> = {};

  constructor(arg: Partial<{ vless: VLessType; outbound: Record<string, any> }> | string) {
    try {
      if (typeof arg === 'string' && /^vless:\/\//i.test(arg)) {
        this.data = this.parseVLess(arg);
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

  private parseVLess(arg: string): VLessType {
    const [address, port] = arg.includes('?')
      ? arg.slice(8).split('?')[0].split(':')
      : arg.slice(8).split('#')[0].split(':');
    const url = new URLSearchParams(arg.slice(8).split('?')[1].split('#')[0]);
    return {
      id: address.split('@')[0],
      address: address.split('@')[1],
      port: parseInt(port),
      remark: arg.split('#')[1],
      encryption: url.get('encryption') ?? '',
      security: url.get('security') ?? '',
      sni: url.get('sni') ?? '',
      type: url.get('type') ?? '',
      host: url.get('host') ?? '',
      path: url.get('path') ?? '',
      flow: url.get('flow') ?? '',
      seed: url.get('seed') ?? '',
      pbk: url.get('pbk') ?? '',
      sid: url.get('sid') ?? '',
      fp: url.get('fp') ?? '',
      headerType: url.get('headerType') ?? '',
    };
  }
  getLink() {
    const url = new URLSearchParams();
    Object.entries(this.data).forEach(
      ([key, value]) => key !== 'remark' && url.append(key, String(value)),
    );
    return `vless://${url.toString()}#${this.data.remark}`;
  }
  getData() {
    return this.data;
  }
  upadteData(arg) {
    this.data = Object.assign(this.data, arg);
    return this.data;
  }
  getOutbound() {
    const {
      id,
      address,
      port,
      remark,
      encryption,
      security,
      sni,
      type,
      host,
      path,
      flow,
      seed,
      fp,
      headerType,
      sid,
      pbk,
    } = this.data;
    const outbound = {
      mux: {
        enabled: false,
        concurrency: 8,
      },
      protocol: 'vless',
      streamSettings: {
        tcpSettings: {},
        kcpSettings: {},
        httpSettings: {},
        quicSettings: {},
        dsSettings: {},
        grpcSettings: {},
        wsSettings: {},
        realitySettings: {},
        xtlsSettings: {},
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
                level: 0,
                encryption: 'none',
                flow: '',
              },
            ],
            port: 0,
          },
        ],
      },
    };
    outbound.settings.vnext[0].address = address ?? '';
    outbound.settings.vnext[0].port = port ?? 443;
    outbound.streamSettings.security = security ?? 'none';
    outbound.streamSettings.network = type ?? '';
    outbound.settings.vnext[0].users[0].encryption = encryption ?? '';
    outbound.settings.vnext[0].users[0].id = id ?? '';
    outbound.settings.vnext[0].users[0].flow = flow ?? '';

    switch (type) {
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
            type,
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
        outbound.streamSettings.kcpSettings = {
          header: {
            type,
          },
          mtu: 1350,
          congestion: false,
          tti: 20,
          uplinkCapacity: 50,
          writeBufferSize: 1,
          readBufferSize: 1,
          downlinkCapacity: 20,
        };
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
        outbound.streamSettings.realitySettings = {
          spiderX: '',
          publicKey: pbk,
          show: true,
          serverName: sni,
          shortId: sid,
          fingerprint: fp,
        };
        break;
      case 'xtls':
        outbound.streamSettings.xtlsSettings = {
          serverName: address,
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
