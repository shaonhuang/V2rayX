import { execAsync } from '@lib/utils';
import { ignoredHosts } from '@lib/constant';

export const unsetProxy = async () => {
  const result = await execAsync('gsettings set org.gnome.system.proxy mode none');
  return result.code === 0;
};

export const setPacProxy = async (url: string) => {
  const autoSet = await execAsync('gsettings set org.gnome.system.proxy mode auto');
  const urlSet = await execAsync(`gsettings set org.gnome.system.proxy autoconfig-url '${url}'`);
  return autoSet.code === 0 && urlSet.code === 0;
};

export const setGlobalProxy = async (host: string, httpPort: number, socksPort: number) => {
  const manualSet = await execAsync('gsettings set org.gnome.system.proxy mode manual');
  const httpHostSet = await execAsync(`gsettings set org.gnome.system.proxy.http host '${host}'`);
  const httpPortSet = await execAsync(`gsettings set org.gnome.system.proxy.http port ${httpPort}`);
  const httpsHostSet = await execAsync(`gsettings set org.gnome.system.proxy.https host '${host}'`);
  const httpsPortSet = await execAsync(
    `gsettings set org.gnome.system.proxy.https port ${httpPort}`
  );
  const socksHostSet = await execAsync(`gsettings set org.gnome.system.proxy.socks host '${host}'`);
  const socksPortSet = await execAsync(
    `gsettings set org.gnome.system.proxy.socks port ${socksPort}`
  );
  const bypassSet = await execAsync(
    `gsettings set org.gnome.system.proxy ignore-hosts "['${ignoredHosts}']"`
  );
  return (
    manualSet.code === 0 &&
    httpHostSet.code === 0 &&
    httpPortSet.code === 0 &&
    httpsHostSet.code === 0 &&
    httpsPortSet.code === 0 &&
    socksHostSet.code === 0 &&
    socksPortSet.code === 0 &&
    bypassSet.code === 0
  );
};
