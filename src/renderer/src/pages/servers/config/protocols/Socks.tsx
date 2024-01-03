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

type formDataType = {
  address: string;
  port: number;
  uuid: string;
  alterId: number;
  level: number;
  algorithm: string;
};

const Index = (props: any) => {
  const { v, ps, add, port, id, aid, net, type, host, path, tls, scy } =
    'getData' in props.data.server.config ? props.data.server.config.getData() : {};
  const encryption = scy === '' ? 'auto' : scy;
  const [formData, setFormData] = useState<formDataType>({
    address: add ?? '',
    port: port ?? 0,
    uuid: id ?? '',
    alterId: parseInt(aid || 0),
    level: 0,
    algorithm: encryption ?? '',
  });
  const [formError, setFormError] = useState<boolean>(false);

  useEffect(() => {
    setFormData({
      address: add ?? '',
      port: port ?? 0,
      uuid: id ?? '',
      alterId: parseInt(aid || 0),
      level: 0,
      algorithm: encryption ?? '',
    });
  }, [v, ps, add, port, id, aid, net, type, host, path, tls, scy]);

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
    props.data.server.config.add = formData.address;
    props.data.server.config.port = formData.port;
    props.data.server.config.id = formData.uuid;
    props.data.server.config.aid = formData.alterId;
    props.data.server.config.level = formData.level;
    props.data.server.config.scy = formData.algorithm === 'auto' ? 'auto' : formData.algorithm;
    console.log(formData);
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
            label="User"
            id="fullWidth"
            required
            value={formData.uuid}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, uuid: event.target.value });
            }}
          />
        </Grid>
        <Grid container xs={16}>
          <Grid xs={16}>
            <TextField
              size="small"
              fullWidth
              label="Password"
              id="fullWidth"
              required
              value={formData.alterId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, alterId: event.target.value });
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
