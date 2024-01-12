import { FormControl, InputLabel, MenuItem, Select, TextField, Checkbox } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';

type formDataType = {
  headers: Partial<{
    type: string;
  }>;
  mtu: number;
  congestion: boolean;
  tti: number;
  uplinkCapacity: number;
  downlinkCapacity: number;
  writeBufferSize: number;
  readBufferSize: number;
};
const Index = (props: any) => {
  const {
    headers,
    mtu,
    congestion,
    tti,
    uplinkCapacity,
    downlinkCapacity,
    writeBufferSize,
    readBufferSize,
  } = props.data.streamSettings.kcpSettings;

  const [formData, setFormData] = useState<formDataType>({
    headers: headers ?? {
      type: 'none',
    },
    mtu: mtu ?? 1350,
    congestion: congestion ?? false,
    tti: tti ?? 20,
    uplinkCapacity: uplinkCapacity ?? 50,
    downlinkCapacity: downlinkCapacity ?? 20,
    writeBufferSize: writeBufferSize ?? 1,
    readBufferSize: readBufferSize ?? 1,
  });

  useEffect(() => {
    const {
      headers,
      mtu,
      congestion,
      tti,
      uplinkCapacity,
      downlinkCapacity,
      writeBufferSize,
      readBufferSize,
    } = props.data.streamSettings.kcpSettings;

    setFormData({
      headers: headers ?? {
        type: 'none',
      },
      mtu: mtu ?? 1350,
      congestion: congestion ?? false,
      tti: tti ?? 20,
      uplinkCapacity: uplinkCapacity ?? 50,
      downlinkCapacity: downlinkCapacity ?? 20,
      writeBufferSize: writeBufferSize ?? 1,
      readBufferSize: readBufferSize ?? 1,
    });
  }, [props.data]);

  useEffect(() => {
    const {
      headers,
      mtu,
      congestion,
      tti,
      uplinkCapacity,
      downlinkCapacity,
      writeBufferSize,
      readBufferSize,
    } = formData;
    props.data.streamSettings.kcpSettings = {
      headers,
      mtu,
      congestion,
      tti,
      uplinkCapacity,
      writeBufferSize,
      readBufferSize,
      downlinkCapacity,
    };
  }, [formData]);

  useEffect(() => {
    // props.data.server.config.net = formData.network;
    // props.data.server.config.host = formData.host;
    // props.data.server.config.path = formData.path;
  }, [formData]);
  return (
    <Grid container>
      <Grid container spacing={2} xs={16}>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Mtu"
            id="fullWidth"
            type="number"
            value={formData.mtu}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, mtu: parseInt(event.target.value) });
            }}
          />
        </Grid>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Tti"
            id="fullWidth"
            type="number"
            value={formData.tti}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, tti: parseInt(event.target.value) });
            }}
          />
        </Grid>
        <Grid xs={6}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.headers.type}
              label="Type"
              onChange={(e) =>
                setFormData({ ...formData, headers: { type: e.target.value as string } })
              }
            >
              <MenuItem value={'none'}>None</MenuItem>
              <MenuItem value={'srtp'}>srtp</MenuItem>
              <MenuItem value={'utp'}>utp</MenuItem>
              <MenuItem value={'dtls'}>dtls</MenuItem>
              <MenuItem value={'wireguard'}>wireguard</MenuItem>
              <MenuItem value={'wechat-video'}>wechat-video</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid xs={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Checkbox
            checked={formData.congestion}
            onChange={(e) => setFormData({ ...formData, congestion: e.target.checked })}
          />
          Congestion
        </Grid>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Uplink Capacity"
            id="fullWidth"
            type="number"
            value={formData.uplinkCapacity}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, uplinkCapacity: parseInt(event.target.value) });
            }}
          />
        </Grid>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Downlink Capacity"
            id="fullWidth"
            type="number"
            value={formData.downlinkCapacity}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, downlinkCapacity: parseInt(event.target.value) });
            }}
          />
        </Grid>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Read Buffer Size"
            id="fullWidth"
            type="number"
            value={formData.readBufferSize}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, readBufferSize: parseInt(event.target.value) });
            }}
          />
        </Grid>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Write Buffer Size"
            id="fullWidth"
            type="number"
            value={formData.writeBufferSize}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, writeBufferSize: parseInt(event.target.value) });
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
