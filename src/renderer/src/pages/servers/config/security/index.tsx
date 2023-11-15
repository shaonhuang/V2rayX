import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  OutlinedInput,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';

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
  security: string;
  tlsDomain: string;
  allowInsecure: boolean;
};

const Index = (props: any) => {
  const { outbounds } = props.data.server.config;
  const { streamSettings } = outbounds[0];
  const [formData, setFormData] = useState<formDataType>({
    security: streamSettings.security,
    tlsDomain: streamSettings.tlsSettings.serverName,
    allowInsecure: streamSettings.tlsSettings.allowInsecure,
  });
  const [formError, setFormError] = useState<boolean>(false);

  useEffect(() => {
    props.data.server.config.outbounds[0].streamSettings.security = formData.security;
    props.data.server.config.outbounds[0].streamSettings.tlsSettings.serverName = formData.tlsDomain;
    props.data.server.config.outbounds[0].streamSettings.tlsSettings.allowInsecure =
      formData.allowInsecure;
  }, [formData]);

  return (
    <Grid container spacing={4}>
      <Grid container xs={16}>
        <Grid xs>
          <FormControl sx={{ width: 120 }} required>
            <InputLabel>Security</InputLabel>
            <Select
              value={formData.security}
              input={<OutlinedInput label="Security" />}
              MenuProps={MenuProps}
              onChange={(event) => {
                setFormData({ ...formData, security: event.target.value });
              }}
            >
              <MenuItem value="none">
                <em>None</em>
              </MenuItem>
              <MenuItem value={'tls'}>tls</MenuItem>
              <MenuItem value={'xtls'}>xtls</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid xs={6}></Grid>
        <Grid xs="auto">
          <FormGroup className="w-fit">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.allowInsecure}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, allowInsecure: event.target.checked })
                  }
                />
              }
              label="Allow Insecure"
            />
          </FormGroup>
        </Grid>
      </Grid>
      <Grid xs={16}>
        <TextField
          size="small"
          fullWidth
          label="Tls Server Domain"
          id="fullWidth"
          value={formData.tlsDomain}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFormData({ ...formData, tlsDomain: event.target.value });
          }}
        />
      </Grid>
    </Grid>
  );
};

export default Index;
