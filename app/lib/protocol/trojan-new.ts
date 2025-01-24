import * as _ from 'lodash';
import { Protocol } from './protocol-new';

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
// trojan://telegram-id-directvpn@18.170.134.196:22222?security=tls&alpn=http/1.1&headerType=none&type=tcp&sni=trojan.burgerip.co.uk#🇬🇧GB | 🟢 | trojan | @DirectVPN | 16
// trojan://pass@remote_host:443?flow=xtls-rprx-origin&security=xtls&sni=sni&host=remote_host#trojan
export class Trojan extends Protocol {
  constructor(link: string) {
    super(link);
    if (/^trojan:\/\//i.test(link)) {
      this.shareLinkParseData = this.parseTrojan(link);
      this.setProtocol('trojan');
      this.genOutboundFromLink();
      this.genPs();
      return this;
    } else if (link === '') {
      this.initTemplate();
      return this;
    }
    throw new Error(`Trojan parse error: please check link ${link}`);
  }

  private parseTrojan(arg: string): TrojanType {
    const [address, port] = arg.includes('?')
      ? arg.slice(9).split('?')[0].split(':')
      : arg.slice(9).split('#')[0].split(':');
    const url = new URLSearchParams(arg.slice(8).split('?')[1].split('#')[0]);
    return {
      password: address.split('@')[0],
      address: address.split('@')[1],
      port: _.parseInt(port),
      remark: arg.split('#')[1],
      security: url.get('security') ?? '',
      sni: url.get('sni') ?? '',
      host: url.get('host') ?? '',
      flow: url.get('flow') ?? '',
      fp: url.get('fp') ?? '',
    };
  }
  genPs() {
    if (!this.getPs()) {
      this.ps = this.outbound.settings?.servers?.[0].address ?? '';
    }
    this.ps = this.getPs();
  }

  genOutboundFromLink() {
    const { address, port, password, remark, security, sni, host, flow, fp } =
      this.shareLinkParseData as TrojanType;
    this.protocol = 'trojan';
    if (!remark) {
      this.genPs();
    } else {
      this.ps = remark;
    }
    this.settings = {
      servers: [
        {
          password: password,
          port: Number(port) || 443,
          email: '',
          level: 0,
          flow: flow,
          address: address,
        },
      ],
    };
    this.streamSettings.network = 'tcp';
    this.streamSettings.security = security ?? 'tls';
    switch (this.streamSettings.network) {
      case 'ws':
        this.streamSettings.wsSettings = {
          // path: path,
          headers: {
            host: host,
          },
        };
        break;
      case 'tcp':
        this.streamSettings.tcpSettings = {
          acceptProxyProtocol: false,
          header: {
            type: 'none',
          },
        };
        break;
    }
    switch (security || 'tls') {
      case 'tls':
        this.streamSettings.tlsSettings = {
          allowInsecure: true,
          serverName: sni ?? host ?? '',
          fingerprint: fp ?? 'chrome',
        };

        break;
      case 'xtls':
        this.streamSettings.xtlsSettings = {
          serverName: sni,
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
    const scheme = 'trojan';
    const remark = this.getPs();
    const { settings, streamSettings } = this.outbound;
    const host = settings?.servers?.[0].address;
    const port = settings?.servers?.[0].port;
    const password = settings?.servers?.[0].password;
    const share: TrojanType = {};
    share.flow = settings?.servers?.[0].flow;
    share.security = 'tls';
    share.fp = streamSettings?.tlsSettings?.fingerprint ?? '';
    const url = new URLSearchParams();
    Object.entries(share).forEach(
      ([key, value]) => key !== 'remark' && url.append(key, String(value)),
    );
    // trojan://pass@remote_host:443?flow=xtls-rprx-origin&security=xtls&sni=sni&host=remote_host#trojan
    return `${scheme}://${password}@${host}:${port}?${url.toString()}#${remark}`;
  }
  initTemplate() {
    const streamType = 'tcp';
    this.protocol = 'trojan';
    this.settings = {
      servers: [
        {
          password: '',
          port: 443,
          email: '',
          level: 0,
          flow: '',
          address: '',
        },
      ],
    };
    this.streamSettings.security = 'none';
    this.streamSettings.network = streamType;
    this.streamSettings.tcpSettings = this.streamSettingsTemplate.tcpSettings!;
    this.updateOutbound();
  }
}
