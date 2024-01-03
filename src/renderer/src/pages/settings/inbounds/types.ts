import { StreamSettingsObject } from '../types';

// Define SniffingObject type
interface SniffingObject {
  enabled: boolean;
  destOverride: string[];
  metadataOnly: boolean;
}

// Define AllocateObject type
interface AllocateObject {
  strategy: string;
  refresh: number;
  concurrency: number;
}

// Define MainConfiguration type
export interface InboundObject {
  listen: string;
  port: number;
  protocol: string;
  settings?: Record<string, any>;
  streamSettings?: StreamSettingsObject;
  tag?: string;
  sniffing?: SniffingObject;
  allocate?: AllocateObject;
}
