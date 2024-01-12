import { TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

type formDataType = {
  key: string;
  security: string;
  header: Partial<{ type: string }>;
};
const Index = (props: any) => {
  const { key, header, security } = props.data.streamSettings.quicSettings;
  const [formData, setFormData] = useState<formDataType>({
    key: key ?? '',
    security: security ?? 'none',
    header: header ?? { type: 'none' },
  });

  useEffect(() => {
    const { key, header, security } = props.data.streamSettings.quicSettings;
    setFormData({
      key: key ?? '',
      security: security ?? 'none',
      header: header ?? { type: 'none' },
    });
  }, [props.data]);

  useEffect(() => {
    const { key, header, security } = formData;
    props.data.streamSettings.quicSettings = {
      key,
      header,
      security,
    };
  }, [formData]);

  useEffect(() => {}, [formData]);
  return (
    <Grid container spacing={2}>
      <Grid container spacing={2} xs={16}>
        <Grid xs={16}>
          <TextField
            size="small"
            fullWidth
            label="Key"
            id="fullWidth"
            value={formData.key}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, key: event.target.value });
            }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} xs={16}>
        <Grid xs={6}>
          <FormControl fullWidth>
            <InputLabel>Security</InputLabel>
            <Select
              value={formData.security}
              label="Security"
              onChange={(e: SelectChangeEvent) =>
                setFormData({ ...formData, security: e.target.value as string })
              }
            >
              <MenuItem value={'none'}>None</MenuItem>
              <MenuItem value={'aes-128-gcm'}>aes-128-gcm</MenuItem>
              <MenuItem value={'chacha20-poly1305'}>chacha20-poly1305</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid xs={6}>
          <FormControl fullWidth>
            <InputLabel>Header</InputLabel>
            <Select
              value={formData.header.type}
              label="Header"
              onChange={(e: SelectChangeEvent) =>
                setFormData({ ...formData, header: { type: e.target.value as string } })
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
      </Grid>
    </Grid>
  );
};

export default Index;
