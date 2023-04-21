import { Checkbox, Stack, Button, Input, FormGroup, FormControlLabel } from '@mui/material';
import { useState } from 'react';
import styled from '@emotion/styled';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import ReactECharts from 'echarts-for-react';

const label = { inputProps: { 'aria-label': 'Checkbox' } };
const options = {
  grid: { top: 8, right: 8, bottom: 24, left: 36 },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      smooth: true,
    },
  ],
  tooltip: {
    trigger: 'axis',
  },
};

const ApperanceButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
});
const Title = styled.div(() => ({
  textAlign: 'left',
}));
const gernalSettings = { port: '1087' };
const GernalSettings = () => {
  const [selectedServer, setSelectedServer] = useState<string>(
    window.electron.store.get('selectedServer') ?? ''
  );
  const [servers, setServers] = useState<Object>(window.electron.store.get(`servers`) ?? {});
  const [port, setPort] = useState<number>(servers[selectedServer]?.inbounds?.[0]?.port ?? 1080);
  const handleChangePort = (e) => {
    setPort(e.target.value);
    // const newSelectedServer = servers[selectedServer];
    // newSelectedServer.inbounds[0].port = e.target.value;
  };
  return (
    <section className="flex flex-row items-center justify-around">
      <div
        className="grid items-center justify-around gap-x-3 rounded-xl p-9"
        style={{ backgroundColor: 'white', gridTemplateColumns: '1fr 2fr' }}
      >
        <Title>Port</Title>
        <Input className="w-24 justify-self-end" value={port} onChange={handleChangePort} disabled/>
        <Title>Startup</Title>
        <span className="justify-self-end">
          <Checkbox {...label} disabled />
          Launch V2rayX at Login
        </span>
        <Title>Hotkey</Title>
        <span className="justify-self-end">
          <Checkbox {...label} disabled />
          Launch V2rayX at Login
        </span>
        <Title>Mode</Title>
        <FormGroup row className="justify-self-end">
          <FormControlLabel control={<Checkbox />} disabled label="PAC" />
          <FormControlLabel control={<Checkbox />} disabled label="Global" />
          <FormControlLabel control={<Checkbox defaultChecked />} disabled label="Manual" />
        </FormGroup>
        <Title>Menu bar icon</Title>
        <span className="justify-self-end">
          <Checkbox {...label} disabled />
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
