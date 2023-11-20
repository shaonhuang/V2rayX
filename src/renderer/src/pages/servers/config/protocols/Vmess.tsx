import { FormControl, InputLabel, MenuItem, Select, TextField, OutlinedInput } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';
import { portReg, ipReg, domainReg } from '@renderer/constant';

const algorithmTypes = [
  'auto',
  'aes-256-cfb',
  'aes-128-cfb',
  'chacha20',
  'chacha20-ietf',
  'aes-256-gcm',
  'aes-128-gcm',
];

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

const protocols = ['Vmess'];

type formDataType = {
  address: string;
  port: number;
  uuid: string;
  alterId: number;
  level: number;
  algorithm: string;
};

const Index = (props: any) => {
  const { outbounds } = props.data.server.config;
  const { settings, streamSettings } = outbounds[0];
  const encryption =
    outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]?.security === 'none'
      ? 'auto'
      : outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]?.security;
  const [formData, setFormData] = useState<formDataType>({
    address: settings.vnext[0].address,
    port: settings.vnext[0].port,
    uuid: settings.vnext[0].users[0].id,
    alterId: parseInt(settings.vnext[0].users[0].alterId || 0),
    level: settings.vnext[0].users[0].level,
    algorithm: encryption,
  });
  const [formError, setFormError] = useState<boolean>(false);

  useEffect(() => {
    if (
      !portReg.test(formData.port.toString()) ||
      isNaN(formData.port) ||
      !ipReg.test(formData.address) ||
      !domainReg.test(formData.address)
    ) {
      setFormError(true);
      props.handleError(1, true);
    } else {
      setFormError(false);
      props.handleError(1, false);
    }
    props.data.server.config.outbounds[0].settings.vnext[0].address = formData.address;
    props.data.server.config.outbounds[0].settings.vnext[0].port = formData.port;
    props.data.server.config.outbounds[0].settings.vnext[0].users[0].id = formData.uuid;
    props.data.server.config.outbounds[0].settings.vnext[0].users[0].alterId = formData.alterId;
    props.data.server.config.outbounds[0].settings.vnext[0].users[0].level = formData.level;
    props.data.server.config.outbounds[0].settings.vnext[0].users[0].security =
      formData.algorithm === 'auto' ? 'none' : formData.algorithm;
  }, [formData]);

  return (
    <Grid container spacing={4}>
      <Grid container spacing={2} xs={16}>
        <Grid xs="auto">
          <span className="text-xl">Server Settings</span>
        </Grid>
        <Grid xs={8}></Grid>
        <Grid xs></Grid>
      </Grid>
      <Grid container xs={16}>
        <Grid xs={8}>
          <TextField
            size="small"
            fullWidth
            label="Address"
            id="fullWidth"
            required
            value={formData.address}
            error={formError && !ipReg.test(formData.address) && !domainReg.test(formData.address)}
            helperText={
              formError &&
              !ipReg.test(formData.address) &&
              !domainReg.test(formData.address) &&
              'Address is invalid'
            }
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, address: event.target.value });
            }}
          />
        </Grid>
        <Grid xs>
          <TextField
            id="outlined-number"
            label="Port"
            type="number"
            size="small"
            value={formData.port}
            required
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, port: parseInt(event.target.value) });
            }}
            error={formError && !portReg.test(formData.port.toString())}
            helperText={formError && !portReg.test(formData.port.toString()) && 'Port is invalid'}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid xs={16}>
          <TextField
            size="small"
            fullWidth
            label="UUID"
            id="fullWidth"
            required
            value={formData.uuid}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, uuid: event.target.value });
            }}
          />
        </Grid>
        <Grid container xs={16}>
          <Grid xs={8}>
            <TextField
              size="small"
              fullWidth
              label="Alter Id"
              id="fullWidth"
              type="number"
              required
              value={formData.alterId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, alterId: parseInt(event.target.value || 0) });
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid xs>
            <TextField
              id="outlined-number"
              label="Level"
              type="number"
              size="small"
              disabled
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, level: parseInt(event.target.value) });
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
        <Grid xs={16}>
          <FormControl sx={{ m: 1, width: 300 }} required>
            <InputLabel>Encryption Algorithm</InputLabel>
            <Select
              value={formData.algorithm}
              input={<OutlinedInput label="Algorithm" />}
              MenuProps={MenuProps}
              onChange={(event) => {
                setFormData({ ...formData, algorithm: event.target.value });
              }}
            >
              {algorithmTypes.map((algorithm) => (
                <MenuItem key={algorithm} value={algorithm}>
                  {algorithm}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
