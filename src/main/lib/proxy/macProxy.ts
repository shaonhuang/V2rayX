import { execAsync } from '@lib/utils';
import { ignoredHosts } from '@main/lib/constant';

const listNetworkServices = async () => {
  const result = await execAsync('networksetup -listallnetworkservices');
  if (result.code === 0 && result.stdout) {
    const r = result.stdout.split('\n');
    r.shift();
    return r;
  } else {
    return null;
  }
};

export const unsetProxy = async () => {
  const services = await listNetworkServices();
  if (!services) {
    return false;
  }

  const results = await Promise.all(
    services.map(async (service) => {
      const urlHttpUnset = await execAsync(`networksetup -setwebproxystate '${service}' off`);
      const urlHttpsUnset = await execAsync(`networksetup -setsecurewebproxystate '${service}' off`);
      const urlSocksUnset = await execAsync(
        `networksetup -setsocksfirewallproxystate '${service}' off`,
      );
      const pacUnset = await execAsync(`networksetup -setautoproxystate '${service}' off`);
      return (
        urlHttpUnset.code === 0 &&
        urlHttpsUnset.code === 0 &&
        urlSocksUnset.code === 0 &&
        pacUnset.code === 0
      );
    }),
  );

  return results.filter((i) => i === true).length > 0;
};

export const setPacProxy = async (url: string) => {
  const services = await listNetworkServices();
  if (!services) {
    return false;
  }

  const results = await Promise.all(
    services.map(async (service) => {
      const autoSet = await execAsync(`networksetup -setautoproxystate '${service}' on`);
      const urlSet = await execAsync(`networksetup -setautoproxyurl '${service}' '${url}'`);
      return autoSet.code === 0 && urlSet.code === 0;
    }),
  );

  return results.filter((i) => i === true).length > 0;
};

export const setGlobalProxy = async (host: string, httpPort: number, socksPort: number) => {
  const services = await listNetworkServices();
  if (!services) {
    return false;
  }

  const results = await Promise.all(
    services.map(async (service) => {
      const autoSet = await execAsync(`networksetup -setsocksfirewallproxystate '${service}' on`);
      //http networksetup -setwebproxy 'Wi-Fi' '127.0.0.1' '1086'
      //https networksetup -setsecurewebproxy 'Wi-Fi' '127.0.0.1' '1086'
      const urlHttpSet = await execAsync(
        `networksetup -setwebproxy '${service}' '${host}' '${httpPort}'`,
      );
      const urlHttpsSet = await execAsync(
        `networksetup -setsecurewebproxy '${service}' '${host}' '${httpPort}'`,
      );
      const urlSocksSet = await execAsync(
        `networksetup -setsocksfirewallproxy '${service}' '${host}' ${socksPort}`,
      );
      const bypassSet = await execAsync(
        `networksetup -setproxybypassdomains '${service}' '${ignoredHosts}'`,
      );
      return (
        autoSet.code === 0 &&
        urlHttpSet.code === 0 &&
        urlHttpsSet.code === 0 &&
        urlSocksSet.code === 0 &&
        bypassSet.code === 0
      );
    }),
  );

  return results.filter((i) => i === true).length > 0;
};
