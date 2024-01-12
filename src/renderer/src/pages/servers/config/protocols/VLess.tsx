import { TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

import { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';

import { portReg, ipReg, domainReg } from '@renderer/constant';

type formDataType = {
  address: string;
  port: number;
  uuid: string;
  level: number;
  flow: string;
};

const Index = forwardRef((props: any, ref) => {
  const internalRef = useRef(null);
  const { settings } = props.data;
  const { vnext } = settings;
  const { address, users, port } = vnext[0] ?? {};
  const { id, level, flow } = users ? users[0] : {};

  const [formData, setFormData] = useState<formDataType>({
    address,
    port,
    uuid: id,
    level,
    flow,
  });
  const [formError, setFormError] = useState<boolean>(false);

  useEffect(() => {
    const { settings } = props.data;
    const { vnext } = settings;
    const { address, users, port } = vnext[0] ?? {};
    const { id, level, flow } = users ? users[0] : {};
    setFormData({
      address,
      port,
      uuid: id,
      level,
      flow,
    });
  }, [props.data]);

  useEffect(() => {
    const { address, port, uuid, level, flow } = formData;
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
          level,
          encryption: 'none',
          flow,
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
              label="Flow"
              id="fullWidth"
              required
              value={formData.flow}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, flow: event.target.value });
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
      </Grid>
    </Grid>
  );
});

Index.displayName = 'VLess';
export default Index;
