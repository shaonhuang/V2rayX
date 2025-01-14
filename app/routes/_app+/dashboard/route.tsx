import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Listbox,
  ListboxItem,
  RadioGroup,
  Radio,
  Checkbox,
  Chip,
} from '@nextui-org/react';
import { motion } from 'framer-motion';
import { useLoaderData, json, useRevalidator } from '@remix-run/react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { invoke } from '@tauri-apps/api/core';
import { queryBypass, queryDashboard, queryPAC, updateAutoLaunch, updateProxyMode } from '~/api';
import { event, window, path } from '@tauri-apps/api';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import { listen } from '@tauri-apps/api/event';
import { checkForAppUpdates } from '~/utils/utils';
import { platform } from '@tauri-apps/plugin-os';

// Format Uptime Function
function formatUptime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Pad with zeros if necessary
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

export const clientLoader = async () => {
  const userID = localStorage.getItem('userID')!;
  const timeSeconds: number = parseInt(await invoke('get_elapsed_time'), 10);
  const dashboardData = await queryDashboard({ userID });
  const bypass = await queryBypass({ userID });
  const pacRules = await queryPAC({ userID });
  return json({ ...dashboardData, timeSeconds, ...bypass, ...pacRules });
};

const Page = () => {
  const userID = localStorage.getItem('userID')!;
  const data = useLoaderData<typeof clientLoader>();
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const currentPlatform = platform();

  // State to manage uptime in seconds
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(data.timeSeconds);

  useEffect(() => {
    // Increment uptime every second
    const interval = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);

    const unlisten = listen<string>('refresh', (event) => {
      if (event.payload === 'dashboard') {
        revalidator.revalidate();
      }
    });
    return () => {
      unlisten.then((f) => f());
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Only proceed if autoCheckUpdate is true
    if (!data.autoCheckUpdate) return;

    const now = Date.now();
    const lastCheckTime = localStorage.getItem('lastCheckTime');
    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

    // If we've never checked, or it's been more than 24 hours:
    if (!lastCheckTime || now - parseInt(lastCheckTime, 10) > ONE_DAY_MS) {
      console.log('Checking for updates (once a day)...');
      checkForAppUpdates(t, false);
      localStorage.setItem('lastCheckTime', now.toString());
    }
  }, [data.autoCheckUpdate, t]);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0.9, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.2,
        scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 },
      }}
    >
      <Card className="min-h-fit py-4">
        <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
          <p className="font-bold uppercase">V2rayX</p>
          <NumberFlowGroup>
            <div
              style={{ fontVariantNumeric: 'tabular-nums', '--number-flow-char-height': '0.85em' }}
              className="~text-3xl/4xl flex items-baseline font-semibold text-default-500"
            >
              <NumberFlow
                prefix="Uptime: "
                value={parseInt(formatUptime(uptimeSeconds).split(':')[0])}
                trend={1}
                format={{ minimumIntegerDigits: 2 }}
              />
              <NumberFlow
                value={parseInt(formatUptime(uptimeSeconds).split(':')[1])}
                prefix=":"
                trend={1}
                digits={{ 1: { max: 5 } }}
                format={{ minimumIntegerDigits: 2 }}
              />
              <NumberFlow
                value={parseInt(formatUptime(uptimeSeconds).split(':')[2])}
                prefix=":"
                trend={1}
                digits={{ 1: { max: 5 } }}
                format={{ minimumIntegerDigits: 2 }}
              />
            </div>
          </NumberFlowGroup>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Listbox aria-label="Actions">
            {/* Socks Port ListboxItem */}
            <ListboxItem key="socks-port" textValue="socks-port">
              <div className="flex flex-row flex-nowrap items-center justify-between text-base">
                <div>Socks {t('Port')}</div>
                <div>
                  {data.socks.map((inbound) => (
                    <Button
                      key={inbound.port}
                      color="success"
                      endContent={<span className="i-feather-copy" />}
                      className="text-base"
                      onPress={async () => {
                        const command =
                          currentPlatform === 'windows'
                            ? `
                            set HTTP_PROXY=socks5://${inbound.listen}:${inbound.port}
                            set HTTPS_PROXY=socks5://${inbound.listen}:${inbound.port}
                            `
                            : `export http_proxy=socks5://${inbound.listen}:${inbound.port};export https_proxy=socks5://${inbound.listen}:${inbound.port};`;
                        await writeText(command);
                        toast.success(`${command} ${t('Command has been pasted to clipboard')}`);
                      }}
                    >
                      {inbound.port}
                    </Button>
                  ))}
                </div>
              </div>
            </ListboxItem>

            {/* Http Port ListboxItem */}
            <ListboxItem key="http-port" textValue="http-port">
              <div className="flex flex-row flex-nowrap items-center justify-between text-base">
                <div>Http {t('Port')}</div>
                <div>
                  {data.http.map((inbound) => (
                    <Button
                      key={inbound.port}
                      color="success"
                      endContent={<span className="i-feather-copy" />}
                      className="text-base"
                      onPress={async () => {
                        const command =
                          currentPlatform === 'windows'
                            ? `set HTTP_PROXY=http://${inbound.listen}:${inbound.port}
                               set HTTPS_PROXY=http://${inbound.listen}:${inbound.port}`
                            : `export http_proxy=http://${inbound.listen}:${inbound.port};export https_proxy=http://${inbound.listen}:${inbound.port};`;
                        await writeText(command);
                        toast.success(`${command} ${t('Command has been pasted to clipboard')}`);
                      }}
                    >
                      {inbound.port}
                    </Button>
                  ))}
                </div>
              </div>
            </ListboxItem>

            {/* Startup ListboxItem */}
            <ListboxItem
              key="startup"
              textValue="startup"
              className="flex flex-row flex-nowrap items-center justify-between"
            >
              <div className="flex flex-row flex-nowrap items-center justify-between text-base">
                <div>{t('Startup')}</div>
                <Checkbox
                  isSelected={data.autoLaunch}
                  onValueChange={async (isSelected) => {
                    await updateAutoLaunch({
                      userID,
                      autoLaunch: isSelected,
                    });
                    revalidator.revalidate();
                  }}
                >
                  {t('Launch V2rayX at Login')}
                </Checkbox>
              </div>
            </ListboxItem>

            {/* v2ray-core ListboxItem */}
            <ListboxItem key="v2ray-core" textValue="v2ray-core">
              <div className="flex flex-row flex-nowrap items-center justify-between text-base">
                <div>{t('v2ray-core')}</div>
                <Chip color="warning" variant="bordered">
                  {data.v2rayCoreVersion}
                </Chip>
              </div>
            </ListboxItem>

            {/* Mode ListboxItem */}
            <ListboxItem key="mode" textValue="mode">
              <div className="flex flex-row flex-nowrap items-center justify-between text-base">
                <div>{t('Mode')}</div>
                <RadioGroup
                  color="primary"
                  value={data.proxyMode}
                  onChange={async (e) => {
                    try {
                      switch (e.target.value) {
                        case 'pac':
                          await invoke('unset_global_proxy');
                          await invoke('setup_pac_proxy', {
                            customRules: data.PAC,
                            httpPort: data.http[0].port,
                            socksPort: data.socks[0].port,
                          });
                          toast.success(t('PAC mode has been enabled'));
                          break;
                        case 'global':
                          await invoke('unset_pac_proxy');
                          await invoke('setup_global_proxy', {
                            host: data.http[0].listen,
                            httpPort: data.http[0].port,
                            socksPort: data.socks[0].port,
                            bypassDomains: JSON.parse(data.BypassDomains).bypass,
                          });
                          toast.success(t('Global mode has been enabled'));
                          break;
                        case 'manual':
                          await invoke('unset_global_proxy');
                          await invoke('unset_pac_proxy');
                          toast.success(t('Manual mode has been enabled'));
                          break;
                      }

                      await updateProxyMode({
                        userID,
                        proxyMode: e.target.value,
                      });
                      await invoke('tray_update', {
                        userId: userID,
                      });
                    } catch (err) {
                      toast.error(err);
                    }
                    revalidator.revalidate();
                  }}
                >
                  <div className="flex flex-row gap-4">
                    <Radio value="pac">{t('PAC mode')}</Radio>
                    <Radio value="global">{t('Global mode')}</Radio>
                    <Radio value="manual">{t('Manual mode')}</Radio>
                  </div>
                </RadioGroup>
              </div>
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default Page;
