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
  serverName: string;
  allowInsecure: boolean;
  publicKey: string;
  shortId: string;
  fingerprint: string;
};

const Index = (props: any) => {
  const { security } = props.data.streamSettings;
  let serverName, allowInsecure, fingerprint, publicKey, shortId;
  switch (security) {
    case 'none':
      break;
    case 'tls':
      serverName = props.data.streamSettings.tlsSettings.serverName;
      allowInsecure = props.data.streamSettings.tlsSettings.allowInsecure;
      fingerprint = props.data.streamSettings.tlsSettings.fingerprint;
      break;
    case 'xtls':
      serverName = props.data.streamSettings.xtlsSettings.serverName;
      allowInsecure = props.data.streamSettings.xtlsSettings.allowInsecure;
      fingerprint = props.data.streamSettings.xtlsSettings.fingerprint;
      break;
    case 'reality':
      serverName = props.data.streamSettings.realitySettings.serverName;
      allowInsecure = props.data.streamSettings.realitySettings.allowInsecure;
      fingerprint = props.data.streamSettings.realitySettings.fingerprint;
      publicKey = props.data.streamSettings.realitySettings.publicKey;
      shortId = props.data.streamSettings.realitySettings.shortId;
      break;
  }
  const [formData, setFormData] = useState<formDataType>({
    security: security ?? 'none',
    serverName: serverName ?? '',
    allowInsecure: allowInsecure ?? true,
    publicKey: publicKey ?? '',
    shortId: shortId ?? '',
    fingerprint: fingerprint ?? '',
  });

  useEffect(() => {
    const { security } = props.data.streamSettings;
    let serverName, allowInsecure, fingerprint, publicKey, shortId;
    switch (security) {
      case 'none':
        break;
      case 'tls':
        serverName = props.data.streamSettings.tlsSettings.serverName;
        allowInsecure = props.data.streamSettings.tlsSettings.allowInsecure;
        fingerprint = props.data.streamSettings.tlsSettings.fingerprint;
        break;
      case 'xtls':
        serverName = props.data.streamSettings.xtlsSettings.serverName;
        allowInsecure = props.data.streamSettings.xtlsSettings.allowInsecure;
        fingerprint = props.data.streamSettings.xtlsSettings.fingerprint;
        break;
      case 'reality':
        serverName = props.data.streamSettings.realitySettings.serverName;
        allowInsecure = props.data.streamSettings.realitySettings.allowInsecure;
        fingerprint = props.data.streamSettings.realitySettings.fingerprint;
        publicKey = props.data.streamSettings.realitySettings.publicKey;
        shortId = props.data.streamSettings.realitySettings.shortId;
        break;
    }

    setFormData({
      security: security ?? 'none',
      serverName: serverName ?? '',
      allowInsecure: allowInsecure ?? true,
      publicKey: publicKey ?? '',
      shortId: shortId ?? '',
      fingerprint: fingerprint ?? '',
    });
  }, [props.data]);

  useEffect(() => {
    const { serverName, allowInsecure, fingerprint, publicKey, shortId, security } = formData;
    props.data.streamSettings.security = security;
    switch (security) {
      case 'none':
        break;
      case 'tls':
        props.data.streamSettings.tlsSettings = {
          serverName,
          allowInsecure,
          fingerprint,
        };
        break;
      case 'xtls':
        props.data.streamSettings.xtlsSettings = {
          serverName,
          allowInsecure,
          fingerprint,
        };
        break;
      case 'reality':
        props.data.streamSettings.realitySettings = {
          serverName,
          allowInsecure,
          fingerprint,
          publicKey,
          shortId,
          show: true,
          spiderX: '',
        };
        break;
    }
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
              <MenuItem value={'reality'}>reality</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {formData.security !== 'reality' ? (
          <>
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
          </>
        ) : (
          <Grid xs={10}></Grid>
        )}
      </Grid>
      {formData.security !== 'reality' ? (
        <Grid xs={16}>
          <TextField
            size="small"
            fullWidth
            label="Server Name"
            id="fullWidth"
            value={formData.serverName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, serverName: event.target.value });
            }}
          />
        </Grid>
      ) : (
        <>
          <Grid xs={16}>
            <TextField
              size="small"
              fullWidth
              label="Server Name"
              id="fullWidth"
              value={formData.serverName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, serverName: event.target.value });
              }}
            />
          </Grid>
          <Grid xs={16}>
            <TextField
              size="small"
              fullWidth
              label="Public Key"
              id="fullWidth"
              value={formData.publicKey}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, publicKey: event.target.value });
              }}
            />
          </Grid>
          <Grid xs={16}>
            <TextField
              size="small"
              fullWidth
              label="Short Id"
              id="fullWidth"
              value={formData.shortId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, shortId: event.target.value });
              }}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default Index;
