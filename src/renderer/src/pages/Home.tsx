import { Checkbox, Stack, Button, Input, FormControlLabel } from '@mui/material';
import { useState, useEffect, useLayoutEffect } from 'react';
import styled from '@emotion/styled';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { nightMode } from '@renderer/components/Theme';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import Notice from '@renderer/components/Notice';
import { platform } from '@renderer/constant';
import { useAppSelector } from '@renderer/store/hooks';
import { find } from 'lodash';

const label = { inputProps: { 'aria-label': 'Checkbox' } };
const AppearanceButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
});
const Title = styled.div(() => ({
  textAlign: 'left',
}));

const GernalSettings = (): JSX.Element => {
  const currentServerId = useAppSelector((state) => state.serversPage.currentServerId);
  const serversState = useAppSelector((state) => state.serversPage.servers);
  const [socksCmdPaste, setSocksCmdPaste] = useState('');
  const [httpCmdPaste, setHttpCmdPaste] = useState('');
  const [socksPort, setSocksPort] = useState<number>(1080);
  const [httpPort, setHttpPort] = useState<number>(1080);
  const [autoLaunch, setAutoLaunch] = useState<boolean>(false);
  const [proxyMode, setProxyMode] = useState('Manual');
  const [appearance, setAppearance] = useState('');

  const handleChangePort = (e) => {
    setSocksPort(e.target.value);
  };

  useLayoutEffect(() => {
    //FIXME: type error
    // @ts-ignore
    const config = find(serversState, { id: currentServerId })?.config;
    const socksPort = parseInt(config?.inbounds?.[0]?.port ?? '1080');
    const httpPort = parseInt(config?.inbounds?.[1]?.port ?? '1080');
    setSocksPort(socksPort);
    setHttpPort(httpPort);
    setSocksCmdPaste(
      platform === 'win32' ? `set socks_proxy "socks5://127.0.0.1:${socksPort}"` : `${socksPort}`,
    );
    setHttpCmdPaste(
      platform === 'win32'
        ? `set http_proxy=http://127.0.0.1:${httpPort}`
        : `export http_proxy=http://127.0.0.1:${httpPort};export https_proxy=http://127.0.0.1:${httpPort};`,
    );
  }, [currentServerId]);

  useEffect(() => {
    window.db.read('settings').then((res) => {
      setProxyMode(res.proxyMode);
      setAppearance(res.appearance);
      res.appearance === 'system' && window.api.send('v2rayx:appearance:system');
    });
    window.db
      .read('autoLaunch')
      .then((res) => setAutoLaunch(res))
      .catch((err) => {
        console.error(err);
      });
    window.api.receive('proxyMode:change', (mode: string) => {
      setProxyMode(mode);
    });
    window.api.receive('appearance:system:fromMain', (appearance: string) => {
      localStorage.setItem('theme', appearance);
      nightMode();
    });
    // To start and refresh Tray menu
    window.v2rayService.checkService();
  }, []);

  return (
    <section className="flex flex-1 flex-row items-center justify-around text-black dark:text-white">
      <div
        className="grid items-center justify-around gap-x-3 rounded-xl bg-white p-9 dark:bg-slate-700"
        style={{ gridTemplateColumns: '1fr 2fr' }}
      >
        <Title>Socks Port</Title>
        <div className="flex w-32 flex-row justify-self-end">
          <Input className="w-24" value={socksPort} onChange={handleChangePort} disabled />
          <Notice message={`${socksCmdPaste} Command has been paste to clipboard`} direction="left">
            <IconButton
              color="primary"
              onClick={() => {
                window.clipboard.paste(socksCmdPaste);
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Notice>
        </div>
        <Title>Http Port</Title>
        <div className="flex w-32 flex-row justify-self-end">
          <Input className="w-24" value={httpPort} onChange={handleChangePort} disabled />
          <Notice message={`${httpCmdPaste} Command has been paste to clipboard`} direction="left">
            <IconButton
              color="primary"
              onClick={() => {
                window.clipboard.paste(httpCmdPaste);
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Notice>
        </div>
        <Title>Startup</Title>
        <span className="justify-self-end">
          <Checkbox
            {...label}
            checked={autoLaunch}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              window.db
                .write('autoLaunch', event.target.checked)
                .then(() => {
                  setAutoLaunch(!event.target.checked);
                  window.autoLaunch.change(!event.target.checked);
                })
                .catch((err) => {
                  console.error(err);
                });
            }}
          />
          Launch V2rayX at Login
        </span>
        {/*
        <Title>Hotkey</Title>
        <span className="justify-self-end">
          <Checkbox {...label} disabled />
          not set yet
        </span>
        */}
        <Title>Mode</Title>
        <RadioGroup
          row
          className="justify-self-end"
          name="row-radio-buttons-group"
          value={proxyMode}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setProxyMode((event.target as HTMLInputElement).value);
            window.proxyMode.change(event.target.value);
            window.db
              .read('settings')
              .then((res) => window.db.write('settings', { ...res, proxyMode: event.target.value }));
          }}
        >
          <FormControlLabel value="PAC" control={<Radio />} label="PAC" />
          <FormControlLabel value="Global" control={<Radio />} label="Global" />
          <FormControlLabel value="Manual" control={<Radio />} label="Manual" />
        </RadioGroup>
        <Title>Appearance</Title>
        <Stack direction="row" spacing={1} className="justify-self-end pt-2">
          <AppearanceButton
            variant={appearance === 'light' ? 'contained' : 'outlined'}
            onClick={() => {
              localStorage.setItem('theme', 'light');
              nightMode();
              window.db.read('settings').then((res) => {
                window.db.write('settings', { ...res, appearance: 'light' });
              });
              setAppearance('light');
            }}
          >
            <LightModeIcon />
            Light
          </AppearanceButton>
          <AppearanceButton
            variant={appearance === 'dark' ? 'contained' : 'outlined'}
            onClick={() => {
              localStorage.setItem('theme', 'dark');
              nightMode();
              window.db.read('settings').then((res) => {
                window.db.write('settings', { ...res, appearance: 'dark' });
              });
              setAppearance('dark');
            }}
          >
            <DarkModeIcon />
            Dark
          </AppearanceButton>
          <AppearanceButton
            variant={appearance === 'system' ? 'contained' : 'outlined'}
            onClick={() => {
              window.db.read('settings').then((res) => {
                window.db.write('settings', { ...res, appearance: 'system' });
              });
              window.api.send('v2rayx:appearance:system');
              setAppearance('system');
            }}
          >
            <SettingsBrightnessIcon />
            System
          </AppearanceButton>
        </Stack>
      </div>
      {/*
    <section style={{ backgroundColor: 'white', width: '500px' }} className="rounded-xl p-8">
      <p className="pb-4 text-xl font-bold text-blue-deep">Today&apos;s useage</p>
      <ReactECharts option={options} />
    </section>
    <Button onClick={() => startV2ray()}>start v2ray</Button>
    <Button onClick={() => stopV2ray()}>stop v2ray</Button>
    */}
    </section>
  );
};
export default GernalSettings;
