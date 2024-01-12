import { FormControl, InputLabel, MenuItem, Select, TextField, OutlinedInput } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

import { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';

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
  level: number;
  password: string;
  flow: string;
};

const Index = forwardRef((props: any, ref) => {
  const internalRef = useRef(null);
  const { settings } = props.data;
  const { servers } = settings;
  const { address, port, level, password, flow } = servers[0] ?? {};

  const [formData, setFormData] = useState<formDataType>({
    address,
    port,
    level,
    password,
    flow,
  });
  const [formError, setFormError] = useState<boolean>(false);

  useEffect(() => {
    const { settings } = props.data;
    const { servers } = settings;
    const { address, port, level, password, flow } = servers[0] ?? {};
    setFormData({
      address,
      port,
      level,
      password,
      flow,
    });
  }, [props.data]);

  useEffect(() => {
    const { address, port, level, password, flow } = formData;
    if (
      !portReg.test(String(port)) ||
      isNaN(port) ||
      !ipReg.test(address) ||
      !domainReg.test(address)
    ) {
      setFormError(true);
      props.handleError(1, true);
    } else {
      setFormError(false);
      props.handleError(1, false);
    }
    props.data.settings.servers = [
      {
        password,
        port: parseInt(port),
        level,
        flow,
        address,
      },
    ];
  }, [formData]);
  useImperativeHandle(ref, () => ({
    current: internalRef.current,
  }));

  return (
    <Grid container spacing={4} ref={internalRef}>
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
            label="Remote Address"
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
            label="Remote Port"
            type="number"
            size="small"
            value={formData.port}
            required
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, port: parseInt(event.target.value) });
            }}
            error={formError && !portReg.test(String(formData.port))}
            helperText={formError && !portReg.test(String(formData.port)) && 'Port is invalid'}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid xs={16}>
          <TextField
            size="small"
            fullWidth
            label="Password"
            id="fullWidth"
            required
            value={formData.password}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, password: event.target.value });
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
});
Index.displayName = 'Trojan';

export default Index;
