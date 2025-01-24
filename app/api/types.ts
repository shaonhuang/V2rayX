// export type User = { UserID: string; UserName: string; Password: string };

export interface DashboardData {
  http: { listen: string; port: string }[];
  socks: { listen: string; port: string }[];
  autoLaunch: boolean;
  proxyMode: string;
  v2rayCoreVersion: string;
  autoCheckUpdate: boolean;
}

export interface GeneralSettings {
  allowSystemNotifications: boolean;
  autoStartProxy: boolean;
  dashboardPopWhenStart: boolean;
  applicationLogsFolder: string;
  v2rayLogLevel: 'debug' | 'info' | 'warning' | 'error' | 'none';
  v2rayAccessLogsPath: string;
  v2rayErrorLogsPath: string;
  language: string;
}

export interface Appearance {
  hideTrayBar: boolean;
  font: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Inbound {
  Listen: string;
  Port: number;
  Protocol: string;
  Tag: string;
  Strategy: 'always' | 'random';
  Refresh: number;
  Concurrency: number;
  UserID: string;
  ID: string;
}

export interface BypassDomains {
  BypassDomains: string;
}

export interface PAC {
  PAC: string;
}

export interface EndpointDetail extends Endpoints {
  Protocol: string;
  Network: string;
  Security: string;
}

// 1. Api Table
export interface Api {
  UserID: string; // Foreign key to AppSettings.UserID
  Tag?: string;
}

// 2. AppSettings Table
export interface AppSettings {
  UserID: string;
  AutoLaunch: number;
  AllowSystemNotifications: number;
  AutoStartProxy: number;
  DashboardPopWhenStart: number;
  AppLogsFolder: string;
  AutoDownloadAndInstallUpgrades: number;
  Theme: string;
  CustomStyle: number;
  FollowSystemTheme: number;
  DarkMode: number;
  Font: string;
  HideTrayBar: number;
  EnhancedTrayIcon: string;
  ProxyMode: string;
  BypassDomains: string; // Default: '{"bypass":["127.0.0.1","192.168.0.0/16","10.0.0.0/8","FE80::/64","::1","FD00::/8,","localhost"]}'
  LatencyTestUrl: string;
  LatencyTestTimeout: number;
  Language: string; // Default: 'en'
  PAC: string; // Default PAC string
}

// 3. AppStatus Table
export interface AppStatus {
  ServiceRunningState: number;
  V2rayCoreVersion: string;
  AppVersion: string;
  UserID: string; // Foreign key to AppSettings.UserID
  LoginState: number; // Default: 0
}

// 4. DNS Table
export interface DNS {
  UserID: string; // Foreign key to AppSettings.UserID
  Value: string; // Default: '{"hosts":{"dns.google":"8.8.8.8"}}'
}

// 5. Endpoints Table
export interface Endpoints {
  EndpointID: string;
  Link?: string;
  Remark: string;
  Latency?: string;
  SpeedTestType: string;
  GroupName: string;
  GroupID: string;
  Active: number; // Default: 0
}

// 6. EndpointsGroups Table
export interface EndpointsGroups {
  GroupID: string;
  GroupName: string;
  Remark?: string;
  Link?: string;
  SpeedTestType: string;
  UserID: string; // Foreign key to AppSettings.UserID
}

// 7. GrpcSettings Table
export interface GrpcSettings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  ServiceName?: string;
}

// 8. Http2Settings Table
export interface Http2Settings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  Host: number;
  Path: string; // Default: '/'
  Method: string; // Default: 'PUT'
}

// 9. Hysteria2 Table
export interface Hysteria2 {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  Address: number;
  Port: number;
}

// 10. Hysteria2Settings Table
export interface Hysteria2Settings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  Password: string;
  Type: string;
  UploadSpeed: number; // Default: 50
  DownloadSpeed: number; // Default: 100
  EnableUDP: number; // Default: 0
}

// 11. Inbounds Table
export interface Inbounds {
  Listen: string;
  Port: number;
  Protocol: string;
  Tag?: string;
  Strategy: 'always' | 'random';
  Refresh: number; // default 5
  Concurrency: number; // default 3
  UserID: string; // Foreign key to AppSettings.UserID
  ID: string;
}

// 12. KcpSettings Table
export interface KcpSettings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  MTU: number; // Default: 1350
  TTI: number; // Default: 50
  UplinkCapacity: number; // Default: 5
  DownlinkCapacity: number; // Default: 20
  Congestion: number; // Default: 0
  ReadBufferSize: number; // Default: 2
  WriteBufferSize: number; // Default: 2
  HeaderType: string; // Default: 'none'
}

// 13. Log Table
export interface Log {
  ErrorPath?: string;
  LogLevel: 'debug' | 'info' | 'warning' | 'error' | 'none';
  AccessPath?: string;
  UserID: string; // Foreign key to AppSettings.UserID
}

// 14. Outbounds Table
export interface Outbounds {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  MuxEnabled: boolean; // Default: false
  MuxConcurrency: number; // Default: 8 (1 ≤ MuxConcurrency ≤ 1024)
  Protocol?: string;
  Tag?: string;
  SendThrough: string; // Default: '0.0.0.0'
}

// 15. Policy Table
export interface Policy {
  UserID: string; // Foreign key to AppSettings.UserID
}

// 16. QuicSettings Table
export interface QuicSettings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  Security: string; // Default: 'none'
  Key?: string;
  HeaderType: string; // Default: 'none'
}

// 17. Shadowsocks Table
export interface Shadowsocks {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  Email?: string;
  Method: string;
  Password: string;
  Level: number; // Default: 0
  Address: string;
  Port: number;
}

// 18. sqlite_master Table (System Table)
export interface SqliteMaster {
  type: string;
  name: string;
  tbl_name: string;
  rootpage: number;
  sql: string;
}

// 19. Stats Table
export interface Stats {
  UserID: string; // Foreign key to AppSettings.UserID
}

// 20. StreamSettings Table
export interface StreamSettings {
  EndpointID: string; // Foreign key to Outbounds.EndpointID
  Security: string;
  Network: string;
}

// 21. TcpSettings Table
export interface TcpSettings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  HeaderType: string; // Default: 'none'
  RequestPath?: string;
  RequestHost?: string;
  Template: string; // JSON string with default value
}

// 22. TlsSettings Table
export interface TlsSettings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  AllowInsecure: number; // Default: 0
  ServerName?: string;
  FingerPrint?: string;
}

// 23. TrojanServers Table
export interface TrojanServers {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  Address: string;
  Port: number;
  Password?: string;
  Email?: number;
  Level?: number;
}

// 24. User Table
export interface User {
  UserID: string;
  UserName: string;
  Password: string;
}

// 27. VmessUsers Table
export interface VmessUsers {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  UUID: string;
  AlterID: number;
  Security: string; // Default: 'auto'
  Level?: number;
  VnextID: string; // Foreign key to VmessVnext.VnextID
}

// 28. VmessVnext Table
export interface VmessVnext {
  VnextID: string;
  Address: string;
  Port: number;
  UserID: string; // Foreign key to AppSettings.UserID
  EndpointID: string; // Foreign key to Endpoints.EndpointID
}

// 29. WsSettings Table
export interface WsSettings {
  EndpointID: string; // Foreign key to Endpoints.EndpointID
  Host: string;
  Path: string; // Default: "/"
}

export interface StreamSettingsTypes {
  WsSettings: WsSettings;
  TcpSettings: TcpSettings;
  KcpSettings: KcpSettings;
  QuicSettings: QuicSettings;
  Http2Settings: Http2Settings;
  GrpcSettings: GrpcSettings;
  Hysteria2Settings: Hysteria2Settings;
}
