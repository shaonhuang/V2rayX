import { VLessType, TrojanType, VMessV2 } from './index';
import {
  Outbound,
  StreamSettings,
  Mux,
  VMessSettings,
  VLessSettings,
  TrojanSettings,
} from '@renderer/constant/types';

export class Protocol {
  protected mux = {
    enabled: false,
    concurrency: 8,
  };
  protected protocol: string = '';
  protected streamSettingsMap = new Map([
    [
      'tcp',
      {
        acceptProxyProtocol: false,
        header: {
          type: 'none',
        },
      },
    ],
    [
      'kcp',
      {
        header: {
          type: '',
        },
        mtu: 1350,
        congestion: false,
        tti: 20,
        uplinkCapacity: 50,
        writeBufferSize: 1,
        readBufferSize: 1,
        downlinkCapacity: 20,
      },
    ],
    [
      'ws',
      {
        path: '',
        headers: {
          host: '',
        },
      },
    ],
    [
      'h2',
      {
        path: '',
        host: [''],
      },
    ],
    [
      'quic',
      {
        key: '',
        header: {
          type: 'utp',
        },
      },
    ],
    [
      'grpc',
      {
        initial_windows_size: 0,
        health_check_timeout: 60,
        multiMode: true,
        idle_timeout: 60,
        serviceName: '',
        permit_without_stream: false,
        user_agent: '',
      },
    ],
    [
      'ds',
      {
        path: '',
      },
    ],
  ]);
  protected streamSettingsTemplate: StreamSettings = {
    tcpSettings: {
      acceptProxyProtocol: false,
      header: {
        type: 'none',
      },
    },
    kcpSettings: {
      header: {
        type: '',
      },
      mtu: 1350,
      congestion: false,
      tti: 20,
      uplinkCapacity: 50,
      writeBufferSize: 1,
      readBufferSize: 1,
      downlinkCapacity: 20,
    },
    httpSettings: {
      path: '',
      host: [''],
    },
    quicSettings: {
      key: '',
      header: {
        type: 'utp',
      },
    },
    dsSettings: {
      path: '',
    },
    grpcSettings: {
      initial_windows_size: 0,
      health_check_timeout: 60,
      multiMode: true,
      idle_timeout: 60,
      serviceName: '',
      permit_without_stream: false,
      user_agent: '',
    },
    wsSettings: {
      path: '',
      headers: {
        host: '',
      },
    },
    realitySettings: {
      spiderX: '',
      publicKey: '',
      show: true,
      serverName: '',
      shortId: '',
      fingerprint: '',
    },
    xtlsSettings: {
      serverName: '',
      allowInsecure: true,
      fingerprint: '',
    },
    tlsSettings: {
      serverName: '',
      allowInsecure: true,
    },
    security: 'none',
    network: 'tcp',
  };
  protected streamSettings = {
    tcpSettings: {},
    kcpSettings: {},
    httpSettings: {},
    quicSettings: {},
    dsSettings: {},
    grpcSettings: {},
    wsSettings: {},
    realitySettings: {},
    xtlsSettings: {},
    tlsSettings: {},
    security: 'none',
    network: '',
  };
  protected tag: string = 'proxy';
  protected settings = {};
  protected shareLinkParseData: VMessV2 | VLessType | TrojanType = {};
  protected link: string = '';
  protected ps: string = '';
  protected outbound: Outbound = {
    mux: this.mux,
    protocol: this.protocol,
    streamSettings: this.streamSettings as StreamSettings,
    tag: this.tag,
    settings: this.settings,
  };
  constructor(shareLink: string) {
    if (
      shareLink.includes('vmess://') ||
      shareLink.includes('vless://') ||
      shareLink.includes('trojan://') ||
      shareLink === ''
    ) {
      this.link = shareLink;
      return this;
    }
    throw new Error('nonsupport protocol type');
  }

  protected updateOutbound() {
    this.outbound = {
      mux: this.mux,
      protocol: this.protocol,
      streamSettings: this.streamSettings as StreamSettings,
      tag: this.tag,
      settings: this.settings,
    };
  }

  getLink() {
    return this.link;
  }
  getPs() {
    return this.ps;
  }
  getOutbound() {
    return this.outbound;
  }

  setShareLinkParseData(data: Partial<VMessV2 & VLessType & TrojanType>) {
    this.shareLinkParseData = data;
  }
  setMux(mux: Mux) {
    this.outbound.mux = mux;
  }
  setTag(tag: string) {
    this.tag = tag;
  }
  setProtocol(protocol: string) {
    this.protocol = protocol;
  }
  setSettings(settings: Partial<VMessSettings & VLessSettings & TrojanSettings>) {
    this.settings = settings;
  }
  setOutbound(outbound: Outbound) {
    this.outbound = outbound;
  }
}
