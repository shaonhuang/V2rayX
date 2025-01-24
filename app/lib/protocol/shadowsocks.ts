import * as _ from 'lodash';
import { Protocol } from './protocol-new';
import { decode } from 'js-base64';

// {
//     "email": "love@v2ray.com",
//     "address": "127.0.0.1",
//     "port": 1234,
//     "method": "加密方式",
//     "password": "密码",
//     "level": 0,
//     "ivCheck": false
// }
// "aes-256-gcm"
// "aes-128-gcm"
// "chacha20-poly1305" 或 "chacha20-ietf-poly1305"
// "none" 或 "plain"
export type ShadowsocksType = {
  password: string;
  address: string;
  port: number;
  method:
    | 'aes-256-gcm'
    | 'aes-128-gcm'
    | 'chacha20-poly1305'
    | 'chacha'
    | 'none'
    | 'plain'
    | 'chacha20-ietf-poly1305';
  tag?: string; // Optional tag for the server
};

//ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTozNlpDSGVhYlVTZktqZlFFdko0SERW@185.242.86.156:54170#%E4%BF%84%E7%BD%97%E6%96%AF+V2CROSS.COM

export class Shadowsocks extends Protocol {
  constructor(link: string) {
    super(link);
    if (/^ss:\/\//i.test(link)) {
      this.shareLinkParseData = this.parseShadowsocks(link);
      this.setProtocol('shadowsocks');
      this.genOutboundFromLink();
      this.genPs();
    } else if (link === '') {
      this.initTemplate();
    } else {
      throw new Error(`Shadowsocks parse error: please check link ${link}`);
    }
  }

  private parseShadowsocks(arg: string): ShadowsocksType {
    // Remove the "ss://" prefix
    let remaining = arg.slice(5);

    // Extract the optional tag after the '#'
    let tag: string | undefined;
    const hashIndex = remaining.indexOf('#');
    if (hashIndex !== -1) {
      tag = decodeURIComponent(remaining.slice(hashIndex + 1));
      remaining = remaining.slice(0, hashIndex);
    }

    // Handle plugin parameters after the '?'
    let plugin: string | undefined;
    const queryIndex = remaining.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = remaining.slice(queryIndex + 1);
      const params = new URLSearchParams(queryString);
      plugin = params.get('plugin');
      remaining = remaining.slice(0, queryIndex);
    }

    let method: string;
    let password: string;
    let address: string;
    let port: number;

    // Check if the remaining part is base64-encoded or in the SIP002 format
    if (/^[A-Za-z0-9+/=]+$/.test(remaining)) {
      // Base64-encoded
      const decodedString = decode(remaining);
      const atIndex = decodedString.lastIndexOf('@');
      if (atIndex === -1) {
        throw new Error('Invalid Shadowsocks link format');
      }

      const methodPassword = decodedString.slice(0, atIndex);
      const addressPort = decodedString.slice(atIndex + 1);

      [method, password] = methodPassword.split(':');
      if (!method || !password) {
        throw new Error('Invalid method or password in Shadowsocks link');
      }

      const [addr, prt] = addressPort.split(':');
      address = addr;
      port = _.parseInt(prt, 10);
    } else {
      // SIP002 format with URL-encoded user info
      const atIndex = remaining.lastIndexOf('@');
      if (atIndex === -1) {
        throw new Error('Invalid Shadowsocks link format');
      }

      const userInfo = remaining.slice(0, atIndex);
      const addressPort = remaining.slice(atIndex + 1);

      const [addr, prt] = addressPort.split(':');
      address = addr;
      port = _.parseInt(prt, 10);

      const decodedUserInfo = decode(userInfo);
      [method, password] = decodedUserInfo.split(':');
      if (!method || !password) {
        throw new Error('Invalid method or password in Shadowsocks link');
      }
    }
    this.updateOutbound();
    return {
      method,
      password,
      address,
      port,
      tag,
      plugin,
    };
  }

  genPs() {
    if (!this.getPs()) {
      this.ps =
        this.shareLinkParseData.tag ||
        this.outbound?.settings?.servers?.[0]?.address ||
        '';
    } else {
      this.ps = this.getPs();
    }
  }

  genOutboundFromLink() {
    const { address, port, password, method, tag, plugin } = this
      .shareLinkParseData as ShadowsocksType;
    this.protocol = 'shadowsocks';
    this.ps = tag || this.genPs();

    this.settings = {
      servers: [
        {
          address,
          port,
          method,
          password,
          plugin: plugin || undefined,
        },
      ],
    };

    // Shadowsocks uses 'tcp' by default; plugin may alter this
    this.streamSettings = {
      network: 'tcp',
      tcpSettings: {
        acceptProxyProtocol: false,
        header: {
          type: 'none',
        },
      },
      security: 'none',
    };

    // Handle plugin options if any
    if (plugin) {
      // Example: plugin options parsing
      // Adjust streamSettings based on the plugin
    }

    this.updateOutbound();
  }

  genStreamSettings(
    type: 'tcp' | 'kcp' | 'ws' | 'h2' | 'quic' | 'grpc',
    obj: any,
  ) {
    const settingKey = `${type === 'h2' ? 'http' : type}Settings`;
    this.streamSettings[settingKey] = obj;
    this.updateOutbound();
  }

  genShareLink() {
    const scheme = 'ss';
    const server = this.outbound.settings?.servers?.[0];

    if (!server) {
      throw new Error('No server configuration found');
    }

    const { address, port, method, password, plugin } = server;
    const tag = encodeURIComponent(this.getPs() || '');

    if (!address || !port || !method || !password) {
      throw new Error('Incomplete server configuration');
    }

    const userInfo = `${method}:${password}`;
    const encodedUserInfo = encodeURIComponent(userInfo);
    const hostPort = `${address}:${port}`;

    let link = `${scheme}://${encodedUserInfo}@${hostPort}`;

    if (plugin) {
      const params = new URLSearchParams();
      params.set('plugin', plugin);
      link += `?${params.toString()}`;
    }

    if (tag) {
      link += `#${tag}`;
    }

    return link;
  }

  initTemplate() {
    this.protocol = 'shadowsocks';
    this.settings = {
      servers: [
        {
          address: '',
          port: 8388,
          method: 'aes-256-gcm',
          password: '',
          plugin: undefined,
        },
      ],
    };

    this.streamSettings = {
      network: 'tcp',
      security: 'none',
    };

    this.updateOutbound();
  }
}
// Failed to update settings due to TypeError: undefined is not an object (evaluating 'protocolFactory.getOutbound().streamSettings.tcpSettings.header').Please contact support.
