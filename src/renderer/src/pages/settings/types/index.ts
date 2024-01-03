// TcpObject
interface TcpObject {
  connectionReuse: boolean;
  header: {
    type: string;
  };
}

// KcpObject
interface KcpObject {
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
}

// WebSocketObject
interface WebSocketObject {
  path: string;
  headers: Record<string, string>;
}

// HttpObject
interface HttpObject {
  host: string[];
  path: string;
  headers: Record<string, string>;
}

// QuicObject
interface QuicObject {
  security: string;
  key: string;
  header: {
    type: string;
  };
}

// DomainSocketObject
interface DomainSocketObject {
  path: string;
}

// GrpcObject
interface GrpcObject {
  serviceName: string;
  multiplex: boolean;
  header: {
    type: string;
  };
}

// SockoptObject
interface SockoptObject {
  mark: number;
  tcpFastOpen: boolean;
  tcpFastOpenQueueLength: number;
  tproxy: 'redirect' | 'tproxy' | 'off';
  tcpKeepAliveInterval: number;
}

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

// TLSObject
interface TLSObject {
  serverName: string;
  alpn: string[];
  allowInsecure: boolean;
  disableSystemRoot: boolean;
  certificates: CertificateObject[];
  verifyClientCertificate: boolean;
  pinnedPeerCertificateChainSha256: string;
}

// CertificateObject
interface CertificateObject {
  usage: 'encipherment' | 'verify' | 'issue' | 'verifyclient';
  certificateFile: string;
  certificate: string[];
  keyFile: string;
  key: string[];
}
