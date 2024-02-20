import lodash from 'lodash';
import { app } from 'electron';
import { Low } from 'lowdb';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { JSONFile } from 'lowdb/node';
import fs from 'node:fs';
import { defaultData, Data } from './initState';

// Extend Low class with a new `chain` field
class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data');
}

const userData = app.getPath('userData');
const dbPathOld = join(userData, 'lowdb', 'dbv2.json');
const dbPath = join(userData, 'lowdb', 'dbv5.json');
const parentDir = join(userData, 'lowdb');
if (existsSync(dbPathOld)) {
  // Use the unlink method to delete the file
  fs.unlink(dbPathOld, (err) => {
    if (err) {
      console.error(`Error deleting file: ${err}`);
    } else {
      console.log(`${dbPathOld} File deleted successfully`);
    }
  });
}
if (!existsSync(parentDir)) {
  mkdirSync(parentDir);
}
const adapter = new JSONFile<Data>(dbPath);
const db = new LowWithLodash(adapter, defaultData);
export default db;
