import { Button, Checkbox, FormControlLabel, FormGroup, TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { portReg } from '@renderer/constant';
import { useState, useEffect } from 'react';

type formDataType = {
  socksPort: number;
  httpPort: number;
  udp: boolean;
  dns: string;
  mux: boolean;
  concurrency: number;
};

const Index = (props: any) => {
  const [formData, setFormData] = useState<formDataType>({
    socksPort: parseInt(props.data.server.config.inbounds[0].port) ?? 10801,
    httpPort: parseInt(props.data.server.config.inbounds[1].port) ?? 10871,
    udp: false,
    dns: '',
    mux: false,
    concurrency: 8,
  });
  const [formError, setFormError] = useState<boolean>(false);

  useEffect(() => {
    if (
      !portReg.test(formData.socksPort.toString()) ||
      !portReg.test(formData.httpPort.toString()) ||
      formData.socksPort === formData.httpPort ||
      isNaN(formData.socksPort) ||
      isNaN(formData.httpPort)
    ) {
      setFormError(true);
      props.handleError(0, true);
    } else {
      setFormError(false);
      props.handleError(0, false);
    }
    props.data.server.config.inbounds[0].port = formData.socksPort;
    props.data.server.config.inbounds[1].port = formData.httpPort;
  }, [formData]);

  return (
    <Grid container spacing={4}>
      <Grid container spacing={2} xs={12}>
        <Grid xs="auto">
          <div className="flex h-full flex-col justify-center">
            <span className="text-xl">Base Settings</span>
          </div>
        </Grid>
        <Grid xs={6}></Grid>
        <Grid xs={2}>
          <Button disabled>Settings</Button>
        </Grid>
      </Grid>
      <Grid container xs={16}>
        <Grid xs>
          <TextField
            id="outlined-number"
            label="Socks Port"
            type="number"
            required
            value={formData.socksPort}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, socksPort: parseInt(event.target.value) });
            }}
            error={
              formError &&
              (!portReg.test(formData.socksPort.toString()) ||
                formData.socksPort === formData.httpPort)
            }
            helperText={
              formError &&
              (!portReg.test(formData.socksPort.toString())
                ? 'Port is invalid'
                : 'socks port should be different from http port')
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid xs>
          <TextField
            id="outlined-number"
            label="Http Port"
            type="number"
            required
            value={formData.httpPort}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, httpPort: parseInt(event.target.value) });
            }}
            error={
              formError &&
              (!portReg.test(formData.httpPort.toString()) ||
                formData.socksPort === formData.httpPort)
            }
            helperText={
              formError &&
              (!portReg.test(formData.httpPort.toString())
                ? 'Port is invalid'
                : 'http port should be different from socks port')
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid xs>
          <FormGroup className="w-fit">
            <FormControlLabel
              control={
                <Checkbox
                  disabled
                  value={formData.udp}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      udp: event.target.checked,
                    })
                  }
                />
              }
              label="UDP"
            />
          </FormGroup>
        </Grid>
        <Grid xs={16}>
          <TextField
            size="small"
            label="DNS"
            id="fullWidth"
            fullWidth
            disabled
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, dns: event.target.value });
            }}
          />
        </Grid>
        <Grid container spacing={2} xs={12}>
          <Grid xs={6}>
            <FormGroup className="w-fit">
              <FormControlLabel
                control={
                  <Checkbox
                    value={formData.mux}
                    disabled
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        mux: event.target.checked,
                      })
                    }
                  />
                }
                label="MUX"
              />
            </FormGroup>
          </Grid>
          <Grid xs={6}>
            <TextField
              id="outlined-number"
              label="Concurrency"
              type="number"
              disabled
              style={{ marginRight: '-4rem' }}
              value={formData.concurrency}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, concurrency: parseInt(event.target.value) });
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
};
export default Index;
