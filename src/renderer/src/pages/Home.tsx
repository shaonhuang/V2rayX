import { Checkbox, Stack, Button, Input, FormGroup, FormControlLabel } from '@mui/material';
import { useState } from 'react';
import styled from '@emotion/styled';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { platform, version } from '@renderer/constant/index';

const label = { inputProps: { 'aria-label': 'Checkbox' } };
const ApperanceButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
});
const Title = styled.div(() => ({
  textAlign: 'left',
}));

const GernalSettings = (): JSX.Element => {
  const [selectedServer, setSelectedServer] = useState<string>(
    window.electron.store.get('selectedServer') ?? ''
  );
  const [servers, setServers] = useState<Array<Object>>(window.electron.store.get(`servers`) ?? []);
  const [socksPort, setSocksPort] = useState<number>(
    servers[selectedServer]?.inbounds?.[0]?.port ?? 1080
  );
  const socksCmdPaste =
    platform === 'win32'
      ? `set socks_proxy "socks5://127.0.0.1:${socksPort}"`
      : `export socks_proxy="socks5://127.0.0.1:${socksPort}"`;
  const [httpPort, setHttpPort] = useState<number>(
    servers[selectedServer]?.inbounds?.[1]?.port ?? 1080
  );
  const httpCmdPaste =
    platform === 'win32'
      ? `set http_proxy=http://127.0.0.1:${httpPort}`
      : `export http_proxy="http://127.0.0.1:${httpPort}"`;
  const [autoLaunch, setAutoLaunch] = useState<boolean>(
    window.electron.store.get('autoLaunch') ?? false
  );
  const [proxyMode, setProxyMode] = useState(window.electron.store.get('proxyMode') ?? 'Manual');
  const handleChangePort = (e) => {
    setSocksPort(e.target.value);
  };
  console.log(platform, version);
  return (
    <section className="flex flex-row items-center justify-around">
      <div
        className="grid items-center justify-around gap-x-3 rounded-xl p-9"
        style={{ backgroundColor: 'white', gridTemplateColumns: '1fr 2fr' }}
      >
        <Title>Socks Port</Title>
        <div className="flex w-32 flex-row justify-self-end">
          <Input className="w-24" value={socksPort} onChange={handleChangePort} disabled />
          <IconButton
            color="primary"
            onClick={() => {
              window.clipboard.paste(socksCmdPaste);
            }}
          >
            <ContentCopyIcon />
          </IconButton>
        </div>
        <Title>Http Port</Title>
        <div className="flex w-32 flex-row justify-self-end">
          <Input className="w-24" value={httpPort} onChange={handleChangePort} disabled />
          <IconButton
            color="primary"
            onClick={() => {
              window.clipboard.paste(httpCmdPaste);
            }}
          >
            <ContentCopyIcon />
          </IconButton>
        </div>
        <Title>Startup</Title>
        <span className="justify-self-end">
          <Checkbox
            {...label}
            checked={autoLaunch}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              window.electron.store.set('autoLaunch', event.target.checked);
              setAutoLaunch(event.target.checked);
              window.autoLaunch.change(event.target.checked);
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
            console.log(event.target.value)
          }}
        >
          <FormControlLabel value="PAC" control={<Radio />} disabled label="PAC" />
          <FormControlLabel value="Global" control={<Radio />} label="Global" />
          <FormControlLabel value="Manual" control={<Radio />} label="Manual" />
        </RadioGroup>
        <Title>Menu bar icon</Title>
        <span className="justify-self-end">
          <Checkbox {...label} disabled checked={true} />
        </span>
        <Title>Apperancece</Title>
        <Stack direction="row" spacing={1} className="justify-self-end">
          <ApperanceButton variant="contained">
            <LightModeIcon />
            Light
          </ApperanceButton>
          <ApperanceButton variant="outlined" disabled>
            <DarkModeIcon />
            Dark
          </ApperanceButton>
          <ApperanceButton variant="outlined" disabled>
            <SettingsBrightnessIcon />
            System
          </ApperanceButton>
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
