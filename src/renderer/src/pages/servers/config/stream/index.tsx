import { FormControl, InputLabel, MenuItem, Select, TextField, OutlinedInput } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';

const networkTypes = ['ws', 'tcp', 'h2', 'kcp', 'mkcp', 'quic', 'domainsocket'];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

type formDataType = {
  network: string;
  host: string;
  path: string;
};
const Index = (props: any) => {
  const { outbounds } = props.data.server.config;
  const { settings, streamSettings } = outbounds[0];
  const [formData, setFormData] = useState<formDataType>({
    network: streamSettings.network || 'ws',
    host: streamSettings.wsSettings.headers.host,
    path: streamSettings.wsSettings.path,
  });

  useEffect(() => {
    props.data.server.config.outbounds[0].streamSettings.network = formData.network;
    props.data.server.config.outbounds[0].streamSettings.wsSettings.headers.host = formData.host;
    props.data.server.config.outbounds[0].streamSettings.wsSettings.path = formData.path;
  }, [formData]);
  return (
    <Grid container>
      <Grid container xs={16} style={{ marginBottom: '1rem' }}>
        <Grid xs="auto">
          <div className="flex h-full flex-col justify-center">
            <span className="text-xl">Stream Setting</span>
          </div>
        </Grid>
        <Grid xs={5}></Grid>
        <Grid xs className="mr-[-3.4rem]">
          <FormControl sx={{ width: 120 }} required>
            <InputLabel>Network</InputLabel>
            <Select
              value={formData.network}
              input={<OutlinedInput label="Network" />}
              MenuProps={MenuProps}
              disabled
              onChange={(event) => {
                setFormData({ ...formData, network: event.target.value });
              }}
            >
              {networkTypes.map((i) => (
                <MenuItem key={i} value={i}>
                  {i}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2} xs={16}>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Host"
            id="fullWidth"
            value={formData.host}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, host: event.target.value });
            }}
          />
        </Grid>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Path"
            id="fullWidth"
            value={formData.path}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, path: event.target.value });
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
