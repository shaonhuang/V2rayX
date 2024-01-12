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
import { nightMode } from '@renderer/components/Theme';
import { isLin, platform } from '@renderer/constant';
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks';
import styled from '@emotion/styled';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import Notice from '@renderer/components/Notice';
import { setSettingsPageState, syncProxyMode } from '@renderer/store/settingsPageSlice';
import { Mode } from '@renderer/constant/types';

type HomePageInfo = {
  httpPort: number;
  socksPort: number;
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
  const dispatch = useAppDispatch();
  const v2rayConfigure = useAppSelector((state) => state.settingsPage.v2rayConfigure);
  const appearance = useAppSelector((state) => state.settingsPage.appearance);
  const systemProxy = useAppSelector((state) => state.settingsPage.systemProxy);
  const generalSettings = useAppSelector((state) => state.settingsPage.generalSettings);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [configData, setConfigData] = useState<HomePageInfo>({
    httpPort: 10871,
    socksPort: 10801,
    httpCmdPaste:
      platform === 'win32'
        ? `set http_proxy=http://127.0.0.1:10871`
        : `export http_proxy=http://127.0.0.1:10871;export https_proxy=http://127.0.0.1:10871;`,

    socksCmdPaste: platform === 'win32' ? `set socks_proxy "socks5://127.0.0.1:10801"` : '10801',
  });

  const initConfig = async () => {
    const socksPort = v2rayConfigure.inbounds[0].port ?? 10801;
    const httpPort = v2rayConfigure.inbounds[1].port ?? 10871;
    const httpCmdPaste =
      platform === 'win32'
        ? `set http_proxy=http://127.0.0.1:${httpPort}`
        : `export http_proxy=http://127.0.0.1:${httpPort};export https_proxy=http://127.0.0.1:${httpPort};`;
    const socksCmdPaste =
      platform === 'win32' ? `set socks_proxy "socks5://127.0.0.1:${socksPort}"` : `${socksPort}`;
    (appearance.followSystemTheme ? 'system' : appearance.darkMode ? 'dark' : 'light') ===
      'system' && window.api.send('v2rayx:appearance:system');
    setConfigData({
      socksPort,
      httpPort,
      socksCmdPaste,
      httpCmdPaste,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    initConfig();
    window.api.receive('proxyMode:change', (mode: Mode) => {
      dispatch(syncProxyMode(mode));
    });
    window.api.receive('appearance:system:fromMain', (appearance: string) => {
      localStorage.setItem('theme', appearance);
      nightMode(appearance === 'dark');
    });
  }, []);

  return (
    <section className="flex flex-1 flex-row items-center justify-around">
      <Paper
        className={'grid items-center justify-around gap-x-3 rounded-xl p-9 '}
        style={{
          gridTemplateColumns: '1fr 4fr',
          gridTemplateRows: `${isLin ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)'} ${
            appearance.customStyle ? '' : '2fr'
          }`,
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
                checked={generalSettings.autoLaunch}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  window.autoLaunch.change(event.target.checked);
                  dispatch(
                    setSettingsPageState({
                      key: 'generalSettings.autoLaunch',
                      value: event.target.checked,
                    }),
                  );
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
          value={systemProxy.proxyMode}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            window.proxyMode.change(event.target.value);
            dispatch(
              setSettingsPageState({
                key: 'systemProxy.proxyMode',
                value: event.target.value,
              }),
            );
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
        {appearance.customStyle ? (
          <></>
        ) : (
          <>
            <Title>Appearance</Title>
            <Stack direction="row" spacing={1} className="justify-self-end px-3 pt-2">
              <AppearanceButton
                variant={
                  !appearance.darkMode && !appearance.followSystemTheme ? 'contained' : 'outlined'
                }
                onClick={() => {
                  localStorage.setItem('theme', 'light');
                  nightMode(false);
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.darkMode',
                      value: false,
                    }),
                  );
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.followSystemTheme',
                      value: false,
                    }),
                  );
                }}
              >
                <LightModeIcon />
                Light
              </AppearanceButton>
              <AppearanceButton
                variant={
                  appearance.darkMode && !appearance.followSystemTheme ? 'contained' : 'outlined'
                }
                onClick={() => {
                  localStorage.setItem('theme', 'dark');
                  nightMode(true);
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.darkMode',
                      value: true,
                    }),
                  );
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.followSystemTheme',
                      value: false,
                    }),
                  );
                }}
              >
                <DarkModeIcon />
                Dark
              </AppearanceButton>
              <AppearanceButton
              disabled
                variant={appearance.followSystemTheme ? 'contained' : 'outlined'}
                onClick={() => {
                  window.db.read('settings').then((res) => {
                    window.db.write('settings', { ...res, appearance: 'system' });
                  });
                  window.api.send('v2rayx:appearance:system');
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.followSystemTheme',
                      value: true,
                    }),
                  );
                }}
              >
                <SettingsBrightnessIcon />
                System
              </AppearanceButton>
            </Stack>
          </>
        )}
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
