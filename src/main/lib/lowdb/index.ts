import lodash from 'lodash';
import { app } from 'electron';
import { Low } from 'lowdb';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'fs';
import { JSONFile } from 'lowdb/node';
import { Mode } from '@lib/constant/types';

const appVersion = app.getVersion();

type Server = {
  id: number;
  item: JSON;
};

type Settings = {
  appearance: 'system' | 'light' | 'dark';
  proxyMode: Mode;
};

type Data = {
  v2rayInstallStatus: boolean;
  autoLaunch: boolean;
  servers: Server[];
  currentServerId?: string;
  appVersion: string;
  settings: Settings;
  serviceRunningState: boolean;
};

// Extend Low class with a new `chain` field
class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data');
}

const defaultData: Data = {
  v2rayInstallStatus: false,
  autoLaunch: false,
  servers: [],
  currentServerId: '',
  appVersion: appVersion,
  settings: {
    appearance: 'light',
    proxyMode: 'Manual',
  },
  serviceRunningState: false,
};

const userData = app.getPath('userData');
const dbPath = join(userData, 'lowdb', 'db.json');
const parentDir = join(userData, 'lowdb');
if (!existsSync(parentDir)) {
  mkdirSync(parentDir);
}
const adapter = new JSONFile<Data>(dbPath);
const db = new LowWithLodash(adapter, defaultData);
export default db;
// await db.read();

// Instead of db.data use db.chain to access lodash API
// const post = db.chain.get('posts').find({ id: 1 }).value(); // Important: value() must be called to execute chain