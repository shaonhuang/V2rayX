import { FormControl, InputLabel, MenuItem, OutlinedInput, Select, TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { domainReg, ipReg, portReg } from '@renderer/constant';
import { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';

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

const Index = forwardRef((props: any, ref) => {
  const internalRef = useRef(null);
  const [formData, setFormData] = useState<formDataType>({
    address: '',
    port: 0,
    uuid: '',
    alterId: 0,
    level: 0,
    algorithm: 'auto',
  });
  const [formError, setFormError] = useState<boolean>(false);

  useEffect(() => {
    const { settings } = props.data;
    const { vnext } = settings;
    const { address, users, port } = vnext[0] ?? {};
    const { id, alterId, level } = users ? users[0] : {};
    const userSecurity = users ? users[0].security : {};
    setFormData({
      address: address ?? '',
      port: port ?? 0,
      uuid: id ?? '',
      alterId: alterId ?? 0,
      level: level,
      algorithm: userSecurity === 'none' ? 'auto' : userSecurity ?? 'auto',
    });
  }, [props.data]);

  useEffect(() => {
    const { address, port, uuid, alterId, level, algorithm } = formData;
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
    props.data.settings.vnext[0] = {
      address,
      users: [
        {
          id: uuid,
          alterId: parseInt(alterId),
          level,
          security: algorithm,
        },
      ],
      port: parseInt(port),
    };
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
            />
          </Grid>
          <Grid xs>
            <TextField
              id="outlined-number"
              label="Level"
              type="number"
              size="small"
              disabled
              value={formData.level}
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
});

Index.displayName = 'VMess';

export default Index;
