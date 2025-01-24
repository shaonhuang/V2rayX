import * as _ from 'lodash';
import { Protocol } from './protocol-new';

export interface Hysteria2Type {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: string;
  auth: string;
  alpn: string[];
  sni: string;
  insecure: boolean;
  up_mbps: number;
  down_mbps: number;
  recv_window_conn: number;
  recv_window: number;
  obfs: string;
  disable_mtu_discovery: boolean;
  fast_open: boolean;
  hop_interval: number;
  fragment?: string; // For remarks or tags
}

export class Hysteria2 extends Protocol {
  constructor(link: string) {
    super(link);
    if (/^hysteria2:\/\//i.test(link)) {
      this.shareLinkParseData = this.parseHysteria2(link);
      this.setProtocol('hysteria2');
      this.genOutboundFromLink();
      this.genPs();
    } else if (link === '') {
      this.initTemplate();
    } else {
      throw new Error(`Hysteria2 parse error: please check link ${link}`);
    }
  }

  private parseHysteria2(arg: string): Hysteria2Type {
    // Remove the "hysteria2://" prefix
    const linkWithoutScheme = arg.slice(12);

    // Split into [userinfo@]host[:port][?query][#fragment]
    const [mainPart, ...fragmentParts] = linkWithoutScheme.split('#');
    const fragment = fragmentParts.join('#');
    const [addressPortPart, queryPart] = mainPart.split('?');
    const [userinfoHostPort] = addressPortPart.split('?');

    // Extract userinfo if present
    let userInfo = '';
    let hostPort = '';
    if (userinfoHostPort.includes('@')) {
      [userInfo, hostPort] = userinfoHostPort.split('@');
    } else {
      hostPort = userinfoHostPort;
    }

    // Extract username and password if present
    let username = '';
    let password = '';
    if (userInfo) {
      [username, password] = userInfo.split(':');
    }

    // Extract host and port
    let host = '';
    let port = 443; // Default port
    if (hostPort.includes(':')) {
      [host, port] = hostPort.split(':');
      port = _.parseInt(port, 10);
    } else {
      host = hostPort;
    }

    // Parse query parameters
    const queryParams = new URLSearchParams(queryPart);

    // Build the Hysteria2Type object
    const hysteria2Config: Hysteria2Type = {
      host,
      port,
      username,
      password,
      protocol: queryParams.get('protocol') || 'udp',
      auth: queryParams.get('auth') || '',
      alpn: queryParams.get('alpn')?.split(',') || [],
      sni: queryParams.get('sni') || '',
      insecure: queryParams.get('insecure') === '1',
      up_mbps: parseFloat(queryParams.get('up_mbps') || '10'),
      down_mbps: parseFloat(queryParams.get('down_mbps') || '50'),
      recv_window_conn: _.parseInt(
        queryParams.get('recv_window_conn') || '0',
        10,
      ),
      recv_window: _.parseInt(queryParams.get('recv_window') || '0', 10),
      obfs: queryParams.get('obfs') || '',
      disable_mtu_discovery: queryParams.get('disable_mtu_discovery') === '1',
      fast_open: queryParams.get('fast_open') === '1',
      hop_interval: _.parseInt(queryParams.get('hop_interval') || '0', 10),
      fragment: fragment ? decodeURIComponent(fragment) : undefined,
    };

    return hysteria2Config;
  }

  genPs() {
    // Set 'ps' (remarks) based on the fragment or host
    this.ps = this.shareLinkParseData.fragment || this.shareLinkParseData.host;
  }

  genOutboundFromLink() {
    const config = this.shareLinkParseData as Hysteria2Type;

    this.protocol = 'hysteria2';
    this.ps = config.fragment || this.genPs();

    // Build the outbound settings
    this.settings = {
      servers: [
        {
          address: config.host,
          port: config.port,
          auth_str: config.auth,
          protocol: config.protocol,
          up: config.up_mbps,
          down: config.down_mbps,
          sni: config.sni,
          alpn: config.alpn,
          insecure: config.insecure,
          recv_window_conn: config.recv_window_conn,
          recv_window: config.recv_window,
          obfs: config.obfs,
          disable_mtu_discovery: config.disable_mtu_discovery,
          fast_open: config.fast_open,
          hop_interval: config.hop_interval,
        },
      ],
    };
    this.streamSettings = {
      network: 'hysteria2',
      hysteria2Settings: {
        password: config.auth,
        use_udp_extension: false,
        congestion: {
          type: 'bbr',
          up_mbps: 50,
          down_mbps: 100,
        },
      },
      security: config.sni ? 'tls' : 'none', // Hysteria2 manages its own security
    };
    if (config.sni) {
      this.streamSettings.tlsSettings = {
        serverName: config.sni,
        alpn: ['h2', 'http/1.1'],
        allowInsecure: config.insecure,
      };
    }

    this.updateOutbound();
  }

  genStreamSettings(type: 'hysteria2', obj: any) {
    const settingKey = `${type}Settings`;
    this.streamSettings[settingKey] = obj;
    this.updateOutbound();
  }

  genShareLink() {
    const scheme = 'hysteria2';
    const server = this.outbound.settings?.servers?.[0];

    if (!server) {
      throw new Error('No server configuration found');
    }

    const userInfo = server.auth_str ? `${server.auth_str}@` : '';
    const hostPort = `${server.address}:${server.port}`;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (server.protocol && server.protocol !== 'udp') {
      queryParams.set('protocol', server.protocol);
    }

    if (server.alpn && server.alpn.length > 0) {
      queryParams.set('alpn', server.alpn.join(','));
    }

    if (server.sni) {
      queryParams.set('sni', server.sni);
    }

    if (server.insecure) {
      queryParams.set('insecure', '1');
    }

    if (server.up) {
      queryParams.set('up_mbps', server.up.toString());
    }

    if (server.down) {
      queryParams.set('down_mbps', server.down.toString());
    }

    if (server.recv_window_conn) {
      queryParams.set('recv_window_conn', server.recv_window_conn.toString());
    }

    if (server.recv_window) {
      queryParams.set('recv_window', server.recv_window.toString());
    }

    if (server.obfs) {
      queryParams.set('obfs', server.obfs);
    }

    if (server.disable_mtu_discovery) {
      queryParams.set('disable_mtu_discovery', '1');
    }

    if (server.fast_open) {
      queryParams.set('fast_open', '1');
    }

    if (server.hop_interval) {
      queryParams.set('hop_interval', server.hop_interval.toString());
    }

    // Construct the share link
    const fragment = encodeURIComponent(this.ps || '');
    const queryString = queryParams.toString();
    const shareLink = `${scheme}://${userInfo}${hostPort}${queryString ? '?' + queryString : ''}${fragment ? '#' + fragment : ''}`;

    return shareLink;
  }

  initTemplate() {
    this.protocol = 'hysteria2';
    this.settings = {
      servers: [
        {
          address: '',
          port: 443,
          auth_str: '',
          protocol: 'udp',
          up: 10,
          down: 50,
          sni: '',
          alpn: [],
          insecure: false,
          recv_window_conn: 0,
          recv_window: 0,
          obfs: '',
          disable_mtu_discovery: false,
          fast_open: false,
          hop_interval: 0,
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
