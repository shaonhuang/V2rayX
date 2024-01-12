import { parseInt } from 'lodash';
import { Protocol } from './Protocol';

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

// 待定标准方案: https://github.com/XTLS/Xray-core/issues/91
//# VLESS + TCP + XTLS
//vless://b0dd64e4-0fbd-4038-9139-d1f32a68a0dc@qv2ray.net:3279?security=xtls&flow=rprx-xtls-splice#VLESSTCPXTLSSplice
//# VLESS + mKCP + Seed
//vless://399ce595-894d-4d40-add1-7d87f1a3bd10@qv2ray.net:50288?type=kcp&seed=69f04be3-d64e-45a3-8550-af3172c63055#VLESSmKCPSeed
//# VLESS + mKCP + Seed，伪装成 Wireguard
//vless://399ce595-894d-4d40-add1-7d87f1a3bd10@qv2ray.net:41971?type=kcp&headerType=wireguard&seed=69f04be3-d64e-45a3-8550-af3172c63055#VLESSmKCPSeedWG
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
  type: 'tcp' | 'kcp' | 'ws' | 'h2' | 'quic' | 'grpc' | 'multi'; // tcp,http
  host: string;
  sni: string;
  path: string;
  fp: string; // fingerprint
  pbk: string; // reality public key
  sid: string; // reality shortId
  seed: string;
  headerType: string;
}>;

export class VLess extends Protocol {
  constructor(link: string) {
    super(link);
    if (/^vless:\/\//i.test(link)) {
      this.shareLinkParseData = this.parseVLess(link);
      this.setProtocol('vless');
      this.genOutboundFromLink();
      this.genPs();
      return this;
    } else if (link === '') {
      this.initTemplate();
      return this;
    }
    throw new Error(`VLess parse error: please check link ${link}`);
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
      type: (url.get('type') ?? 'tcp') as 'tcp' | 'kcp' | 'ws' | 'h2' | 'quic' | 'grpc' | 'multi',
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

  genPs() {
    if (!this.getPs()) {
      this.ps = this.outbound.settings?.vnext?.[0].address as string;
    }
    this.ps = this.getPs();
  }

  genOutboundFromLink() {
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
      fp,
      sid,
      pbk,
    } = this.shareLinkParseData as VLessType;
    const streamType = type ?? 'tcp';
    this.protocol = 'vless';
    if (!remark) {
      this.genPs();
    } else {
      this.ps = remark;
    }
    // @ts-ignore configuration is complete in a easy way
    this.streamSettings[`${streamType === 'h2' ? 'http' : streamType}Settings`] =
      this.streamSettingsTemplate[`${streamType === 'h2' ? 'http' : streamType}Settings`];
    this.streamSettings.security = security ?? 'none';
    this.streamSettings.network = streamType;
    this.settings = {
      vnext: [
        {
          address: address ?? '',
          users: [
            {
              id: id ?? '',
              level: 0,
              encryption: encryption ?? 'none',
              flow: flow ?? '',
            },
          ],
          port: port ?? 443,
        },
      ],
    };

    this.streamSettings.tlsSettings = {
      serverName: sni ?? '',
      fingerprint: fp ?? '',
    };
    // type:伪装类型（none\http\srtp\utp\wechat-video）
    switch (type) {
      case 'h2':
        // @ts-ignore defined
        this.streamSettings.httpSettings.host = [host];
        // @ts-ignore defined
        this.streamSettings.httpSettings.path = path;
        break;
      case 'ws':
        // @ts-ignore defined
        this.streamSettings.wsSettings.path = path;
        // @ts-ignore defined
        this.streamSettings.wsSettings.headers = {
          host: host ?? '',
        };
        break;
      case 'grpc':
        // @ts-ignore defined
        this.streamSettings.grpcSettings.serviceName = path;
        // @ts-ignore defined
        this.streamSettings.grpcSettings.multiMode = type === 'multi';
        break;
      case 'tcp':
        this.streamSettings.tcpSettings = {
          acceptProxyProtocol: false,
          header: {
            type,
          },
        };
        break;
      case 'kcp':
        this.streamSettings.kcpSettings = {
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
    }
    switch (security) {
      case 'reality':
        this.streamSettings.realitySettings = {
          spiderX: '',
          publicKey: pbk,
          show: true,
          serverName: sni,
          shortId: sid,
          fingerprint: fp,
        };
        break;
      case 'xtls':
        this.streamSettings.xtlsSettings = {
          serverName: address,
          allowInsecure: true,
          fingerprint: fp,
        };
        break;
    }
    this.updateOutbound();
  }

  genStreamSettings(type: 'tcp' | 'kcp' | 'ws' | 'h2' | 'quic' | 'grpc', obj) {
    this.streamSettings[`${type === 'h2' ? 'http' : type}Settings`] = obj;
    this.updateOutbound();
  }

  genShareLink() {
    const scheme = 'vless';
    const remark = this.getPs();
    const { settings, streamSettings } = this.outbound;
    const host = settings?.vnext?.[0].address,
      port = settings?.vnext?.[0].port;
    let id = '';
    const share: VLessType = {};
    if (settings?.vnext?.[0].users.length ?? 0 > 0) {
      id = settings?.vnext?.[0].users[0].id;
      share.level = settings?.vnext?.[0].users[0].level;
      share.flow = settings?.vnext?.[0].users[0].flow;
      share.encryption = settings?.vnext?.[0].users[0].encryption;
    }

    share.type = streamSettings?.network;

    share.security = streamSettings?.security;

    switch (streamSettings?.network) {
      case 'h2':
        if (streamSettings?.httpSettings?.host?.length ?? 0 > 0) {
          share.host = streamSettings?.httpSettings?.host[0];
        }
        share.path = streamSettings?.httpSettings?.path ?? '';
        break;
      case 'ws':
        share.host = streamSettings?.wsSettings?.headers?.host ?? '';
        share.path = streamSettings?.wsSettings?.path ?? '';
        break;
      case 'grpc':
        share.path = streamSettings?.grpcSettings?.serviceName ?? '';
        if (streamSettings?.grpcSettings?.multiMode) {
          share.type = 'multi';
        }
        break;
    }

    switch (streamSettings?.security) {
      case 'reality':
        share.pbk = streamSettings.realitySettings?.publicKey;
        share.fp = streamSettings.realitySettings?.fingerprint;
        share.sid = streamSettings.realitySettings?.shortId;
        share.sni = streamSettings.realitySettings?.serverName;
        break;
      default:
        share.sni = streamSettings?.tlsSettings?.serverName;
        share.fp = streamSettings?.tlsSettings?.fingerprint;
        break;
    }
    const url = new URLSearchParams();
    Object.entries(share).forEach(
      ([key, value]) => key !== 'remark' && url.append(key, String(value)),
    );
    // vless://44efe52b-e143-46b5-a9e7-aadbfd77eb9c@qv2ray.net:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=sni.yahoo.com&fp=chrome&pbk=xxx&sid=88&type=tcp&headerType=none&host=hk.yahoo.com#reality
    return `${scheme}://${id}@${host}:${port}?${url.toString()}#${remark}`;
  }
  initTemplate() {
    const streamType = 'tcp';
    this.protocol = 'vless';
    this.settings = {
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
          port: 443,
        },
      ],
    };
    this.streamSettings.network = streamType;
    this.streamSettings.tcpSettings = this.streamSettingsTemplate.tcpSettings!;
    this.updateOutbound();
  }
}
