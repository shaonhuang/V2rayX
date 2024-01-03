import {
  Checkbox,
  Stack,
  Button,
  Input,
  FormControlLabel,
  Radio,
  RadioGroup,
  IconButton,
  Skeleton,
  Paper,
} from '@mui/material';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { nightMode } from '@renderer/components/Theme';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import Notice from '@renderer/components/Notice';
import { isLin, platform } from '@renderer/constant';
import { useAppSelector } from '@renderer/store/hooks';
import { cloneDeep } from 'lodash';

type HomePageInfo = {
  httpPort: number;
  socksPort: number;
  autoLaunch: boolean;
  proxyMode: string;
  appearance: string;
  httpCmdPaste: string;
  socksCmdPaste: string;
};

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
  const currentServerId$ = useAppSelector((state) => state.serversPage.currentServerId);
  const serversState$ = useAppSelector((state) => state.serversPage.servers);
  const v2rayConfigure = useAppSelector((state) => state.settingsPage.v2rayConfigure);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [configData, setConfigData] = useState<HomePageInfo>({
    httpPort: 10871,
    socksPort: 10801,
    autoLaunch: false,
    proxyMode: 'Manual',
    appearance: 'system',
    httpCmdPaste:
      platform === 'win32'
        ? `set http_proxy=http://127.0.0.1:10871`
        : `export http_proxy=http://127.0.0.1:10871;export https_proxy=http://127.0.0.1:10871;`,

    socksCmdPaste: platform === 'win32' ? `set socks_proxy "socks5://127.0.0.1:10801"` : '10801',
  });

  const handleChangeConfig = async () => {
    const autoLaunch = await window.db.read('autoLaunch');
    const { proxyMode, appearance } = await window.db.read('settings');

    const socksPort = v2rayConfigure.inbounds[0].port ?? 10801;
    const httpPort = v2rayConfigure.inbounds[1].port ?? 10871;
    const httpCmdPaste =
      platform === 'win32'
        ? `set http_proxy=http://127.0.0.1:${httpPort}`
        : `export http_proxy=http://127.0.0.1:${httpPort};export https_proxy=http://127.0.0.1:${httpPort};`;
    const socksCmdPaste =
      platform === 'win32' ? `set socks_proxy "socks5://127.0.0.1:${socksPort}"` : `${socksPort}`;
    appearance === 'system' && window.api.send('v2rayx:appearance:system');
    setConfigData(
      cloneDeep({
        ...configData,
        socksPort,
        httpPort,
        socksCmdPaste,
        httpCmdPaste,
        autoLaunch,
        proxyMode,
        appearance,
      }),
    );
    setIsLoading(false);
  };

  useEffect(() => {
    handleChangeConfig();
    window.api.receive('proxyMode:change', (mode: string) => {
      setConfigData({ ...configData, proxyMode: mode });
      window.v2rayService.checkService();
    });
    window.api.receive('appearance:system:fromMain', (appearance: string) => {
      localStorage.setItem('theme', appearance);
      nightMode();
    });
  }, [v2rayConfigure]);

  return (
    <section className="flex flex-1 flex-row items-center justify-around">
      <Paper
        className={'grid items-center justify-around gap-x-3 rounded-xl p-9 '}
        style={{
          gridTemplateColumns: '1fr 4fr',
          gridTemplateRows: `${isLin ? 'repeat(3, 1fr) 2fr' : 'repeat(4, 1fr) 2fr'}`,
        }}
      >
        <Title>Socks Port</Title>
        <div className="flex w-32 flex-row justify-self-end">
          <Input
            className="w-24"
            value={configData.socksPort}
            /* onChange={(e) => setConfigData({ ...configData, socksPort: e.target.value })} */
            disabled
          />
          <Notice
            message={`${configData.socksCmdPaste} Command has been paste to clipboard`}
            direction="left"
          >
            <IconButton
              color="primary"
              onClick={() => {
                window.clipboard.paste(configData.socksCmdPaste);
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Notice>
        </div>
        <Title>Http Port</Title>
        <div className="flex w-32 flex-row justify-self-end">
          <Input
            className="w-24"
            value={configData.httpPort}
            /* onChange={(e) => setConfigData({ ...configData, httpPort: e.target.value })} */
            disabled
          />
          <Notice
            message={`${configData.httpCmdPaste} Command has been paste to clipboard`}
            direction="left"
          >
            <IconButton
              color="primary"
              onClick={() => {
                window.clipboard.paste(configData.httpCmdPaste);
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Notice>
        </div>
        {platform !== 'linux' ? (
          <>
            <Title>Startup</Title>
            <span className="justify-self-end px-3">
              <Checkbox
                {...label}
                checked={configData.autoLaunch}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  window.db
                    .write('autoLaunch', event.target.checked)
                    .then(() => {
                      setConfigData({ ...configData, autoLaunch: !event.target.checked });
                      window.autoLaunch.change(!event.target.checked);
                    })
                    .catch((err) => {
                      console.error(err);
                    });
                }}
              />
              Launch V2rayX at Login
            </span>
          </>
        ) : (
          <></>
        )}

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
          value={configData.proxyMode}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setConfigData({ ...configData, proxyMode: (event.target as HTMLInputElement).value });
            window.proxyMode.change(event.target.value);
            window.db
              .read('settings')
              .then((res) => window.db.write('settings', { ...res, proxyMode: event.target.value }));
          }}
        >
          {isLoading ? (
            <Skeleton variant="rounded" width={246} />
          ) : (
            <>
              <FormControlLabel value="PAC" control={<Radio />} label="PAC" />
              <FormControlLabel value="Global" control={<Radio />} label="Global" />
              <FormControlLabel value="Manual" control={<Radio />} label="Manual" />
            </>
          )}
        </RadioGroup>
        {
          <>
            <Title>Appearance</Title>
            <Stack direction="row" spacing={1} className="justify-self-end px-3 pt-2">
              <AppearanceButton
                variant={configData.appearance === 'light' ? 'contained' : 'outlined'}
                onClick={() => {
                  localStorage.setItem('theme', 'light');
                  nightMode();
                  window.db.read('settings').then((res) => {
                    window.db.write('settings', { ...res, appearance: 'light' });
                  });
                  setConfigData({ ...configData, appearance: 'light' });
                }}
              >
                <LightModeIcon />
                Light
              </AppearanceButton>
              <AppearanceButton
                variant={configData.appearance === 'dark' ? 'contained' : 'outlined'}
                onClick={() => {
                  localStorage.setItem('theme', 'dark');
                  nightMode();
                  window.db.read('settings').then((res) => {
                    window.db.write('settings', { ...res, appearance: 'dark' });
                  });
                  setConfigData({ ...configData, appearance: 'dark' });
                }}
              >
                <DarkModeIcon />
                Dark
              </AppearanceButton>
              <AppearanceButton
                variant={configData.appearance === 'system' ? 'contained' : 'outlined'}
                onClick={() => {
                  window.db.read('settings').then((res) => {
                    window.db.write('settings', { ...res, appearance: 'system' });
                  });
                  window.api.send('v2rayx:appearance:system');
                  setConfigData({ ...configData, appearance: 'system' });
                }}
              >
                <SettingsBrightnessIcon />
                System
              </AppearanceButton>
            </Stack>
          </>
        }
      </Paper>
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
