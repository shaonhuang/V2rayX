import { execAsync } from '@lib/utils';
import { ignoredHosts_win } from '@main/lib/constant';
import bin from '../../../../resources/bin/win32/x64/sysproxy.exe?asset&asarUnpack';

export const unsetProxy = async () => {
  const result = await execAsync(`${bin} set 1 - -`);
  return result.code === 0;
};

export const setPacProxy = async (url: string) => {
  const autoSet = await execAsync(`${bin} pac ${url}`);
  return autoSet.code === 0;
};

export const setGlobalProxy = async (host: string, httpPort: number, socksPort: number) => {
  const manualSet = await execAsync(`${bin} global ${host}:${httpPort} ${ignoredHosts_win}`);

  return manualSet.code === 0;
};
