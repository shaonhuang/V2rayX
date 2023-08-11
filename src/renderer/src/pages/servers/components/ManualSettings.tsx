import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { cloneDeep } from 'lodash';
import { useState, useEffect } from 'react';

import {
  VmessV1,
  VmessV2,
  isVMessLink,
  isVMessLinkV1,
  isVMessLinkV2,
  parseV1Link,
  parseV2Link,
  parseVmess2config,
  emptyVmessV2,
} from '@renderer/utils/protocol';

export interface Settings {
  protocol: string;
  address: string;
  port: number;
  id: string;
  alterId: number;
  level: number;
  encryption: string;
  network: string;
  host: string;
  path: string;
  security: string;
  allowInsecure: boolean;
  tlsServerDomin: string;
}
export interface BaseSettings {
  socket: number;
  http: number;
  dns: string;
  mux: boolean;
  concurrency: number;
  udp: boolean;
}

const ManualSettings = (props: any) => {
  const protocol = ['vmess', 'vless', 'trojan', 'shadowsocks', 'socks'];
  const algorithm = [
    'auto',
    'aes-256-cfb',
    'aes-128-cfb',
    'chacha20',
    'chacha20-ietf',
    'aes-256-gcm',
    'aes-128-gcm',
  ];
  const network = ['ws', 'tcp', 'h2', 'kcp', 'quic', 'domainsocket'];
  let { inbounds, outbounds } = props.data;
  if (JSON.stringify(props.data) === '{}') {
    inbounds = [];
    outbounds = [];
  }
  const encryption =
    outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]?.security === 'none'
      ? 'auto'
      : outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]?.security;
  const [baseSettings, setBaseSettings] = useState<BaseSettings>({
    socket: inbounds?.[0]?.port ?? 1080,
    http: inbounds?.[1]?.port ?? 1080,
    dns: '',
    mux: outbounds?.[0]?.mux?.enabled ?? false,
    concurrency: outbounds?.[0]?.mux?.concurrency ?? 8,
    udp: false,
  });
  const [settings, setSettings] = useState<Settings>({
    protocol: outbounds?.[0]?.protocol ?? '',
    address: outbounds?.[0]?.settings?.vnext?.[0]?.address ?? '',
    port: outbounds?.[0]?.settings?.vnext?.[0]?.port ?? 1080,
    id: outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]?.id ?? '',
    alterId: outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]?.alterId ?? '',
    level: outbounds?.[0]?.settings?.vnext?.[0]?.users?.[0]?.level ?? 0,
    encryption: encryption ?? '',
    network: outbounds?.[0]?.streamSettings?.network ?? '',
    host: outbounds?.[0]?.streamSettings?.wsSettings?.headers?.host ?? '',
    path: outbounds?.[0]?.streamSettings?.wsSettings?.path ?? '',
    security: outbounds?.[0]?.streamSettings?.security ?? '',
    allowInsecure: outbounds?.[0]?.streamSettings?.tlsSettings?.allowInsecure ?? false,
    tlsServerDomin: outbounds?.[0]?.streamSettings?.tlsSettings?.serverName ?? '',
  });

  const handleProtocolChange = (event: SelectChangeEvent) => {
    setSettings(cloneDeep({ ...settings, protocol: event.target.value }));
  };
  const handleEncryptionChange = (event: SelectChangeEvent) => {
    setSettings(cloneDeep({ ...settings, encryption: event.target.value }));
  };
  const handleNetworkChange = (event: SelectChangeEvent) => {
    setSettings(cloneDeep({ ...settings, network: event.target.value }));
  };
  const handleSecurityChange = (event: SelectChangeEvent) => {
    setSettings(cloneDeep({ ...settings, security: event.target.value }));
  };

  const handleOnChange = (e, type: string, value: string) => {
    switch (type) {
      case 'settings':
        setSettings(
          cloneDeep({
            ...settings,
            [value]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
          })
        );
        break;
      case 'baseSettings':
        setBaseSettings(
          cloneDeep({
            ...baseSettings,
            [value]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
          })
        );
        break;
    }
  };

  const setting2Config = () => {
    const config = Object.keys(props.data).length === 0 ? emptyVmessV2() : cloneDeep(props.data);
    config.inbounds[0].port = baseSettings.socket;
    config.inbounds[1].port = baseSettings.http;
    config.inbounds[0].settings.udp = baseSettings.udp;
    config.outbounds[0].protocol = settings.protocol;
    config.outbounds[0].settings.vnext[0] = {
      ...config.outbounds[0].settings.vnext[0],
      address: settings.address,
      port: settings.port,
    };
    config.outbounds[0].settings.vnext[0].users[0] = {
      ...config.outbounds[0].settings.vnext[0].users[0],
      id: settings.id,
      alterId: settings.alterId,
      level: settings.level,
      security: settings.encryption,
    };
    config.outbounds[0].streamSettings.network = settings.network;
    config.outbounds[0].streamSettings.wsSettings.headers.host = settings.host;
    config.outbounds[0].streamSettings.wsSettings.path = settings.path;
    config.outbounds[0].streamSettings.security = settings.security;
    config.outbounds[0].streamSettings.tlsSettings.allowInsecure = settings.allowInsecure;
    config.outbounds[0].streamSettings.tlsSettings.serverName = settings.tlsServerDomin;
    config.outbounds[0].mux.enabled = baseSettings.mux;
    config.outbounds[0].mux.concurrency = baseSettings.concurrency;
    return config;
  };
  useEffect(() => {
    props.handleDataSave(setting2Config());
  }, [baseSettings, settings]);

  return (
    <section className="">
      <div className="mx-6 mb-6 rounded-xl bg-sky-100 px-4 py-6">
        <div className="mb-3 flex flex-row justify-between">
          <span className="my-auto">Base Settings</span>
          <Button>Settings</Button>
        </div>
        <div className="rounded-xl bg-sky-50 p-3">
          <div className="flex flex-row flex-nowrap justify-between py-3">
            <TextField
              className="w-24"
              id="outlined-number"
              label="socket port"
              type="number"
              size="small"
              error={baseSettings.socket === baseSettings.http}
              helperText={
                baseSettings.socket === baseSettings.http
                  ? 'Incorrect entry. The Socket port and the HTTP port should not be identical'
                  : ''
              }
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'baseSettings', 'socket');
              }}
              InputLabelProps={{
                shrink: true,
              }}
              value={baseSettings.socket}
            />
            <TextField
              className="w-24"
              id="outlined-number"
              label="http port"
              type="number"
              size="small"
              error={baseSettings.socket === baseSettings.http}
              helperText={
                baseSettings.socket === baseSettings.http
                  ? 'Incorrect entry. The Socket port and the HTTP port should not be identical'
                  : ''
              }
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                handleOnChange(event, 'baseSettings', 'http')
              }
              InputLabelProps={{
                shrink: true,
              }}
              value={baseSettings.http}
            />
            <FormGroup className="w-fit">
              <FormControlLabel
                control={
                  <Checkbox
                    value={baseSettings.udp}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      handleOnChange(event, 'baseSettings', 'udp')
                    }
                  />
                }
                label="UDP"
              />
            </FormGroup>
          </div>
          <div>
            <TextField
              size="small"
              fullWidth
              label="DNS"
              id="fullWidth"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'baseSettings', 'dns');
              }}
            />
          </div>
          <div className="flex flex-row flex-nowrap justify-between py-3">
            <FormGroup className="w-fit">
              <FormControlLabel
                control={
                  <Checkbox
                    value={baseSettings.mux}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      handleOnChange(event, 'baseSettings', 'mux');
                    }}
                  />
                }
                label="Mux"
              />
            </FormGroup>
            <TextField
              className="w-24"
              id="outlined-number"
              label="concurrency"
              type="number"
              size="small"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'baseSettings', 'concurrency');
              }}
              InputLabelProps={{
                shrink: true,
              }}
              value={baseSettings.concurrency}
            />
          </div>
        </div>
      </div>
      <div className="mx-6 mb-6 rounded-xl bg-sky-100 px-4 py-6">
        <div className="mb-3 flex flex-row justify-between">
          <span className="my-auto">Server Settings</span>
          <FormControl sx={{ m: 1, minWidth: 100 }}>
            <InputLabel id="demo-simple-select-autowidth-label">Protocol</InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={settings.protocol}
              onChange={handleProtocolChange}
              autoWidth
              size="small"
              label="Protocol"
            >
              {protocol.map((i) => (
                <MenuItem key={i} value={i}>
                  {i}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="rounded-xl bg-sky-50 p-3">
          <div className="flex flex-row items-center justify-center py-3">
            <TextField
              id="outlined-basic"
              label="address"
              variant="outlined"
              size="small"
              className="w-[268px]"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'settings', 'address');
              }}
              value={settings.address}
            />
            <span className="my-auto px-3">:</span>
            <TextField
              id="outlined-basic"
              label="port"
              variant="outlined"
              size="small"
              type="number"
              className="w-[120px]"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'settings', 'port');
              }}
              value={settings.port}
            />
          </div>
          <div className="mb-3">
            <TextField
              size="small"
              fullWidth
              label="Id"
              id="fullWidth"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'settings', 'id');
              }}
              value={settings.id}
            />
          </div>
          <div className="mb-3 flex w-full flex-row justify-between">
            <TextField
              id="outlined-basic"
              label="alterId"
              type="number"
              variant="outlined"
              size="small"
              className="w-[100px]"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'settings', 'alterId');
              }}
              value={settings.alterId}
            />
            <TextField
              id="outlined-basic"
              label="level"
              type="number"
              variant="outlined"
              size="small"
              className="w-[100px]"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                handleOnChange(event, 'settings', 'level');
              }}
              value={settings.level}
            />
          </div>
          <div className="m-0 flex flex-row justify-start">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="demo-simple-select-autowidth-label">Encryption algorithm</InputLabel>
              <Select
                labelId="demo-simple-select-autowidth-label"
                id="demo-simple-select-autowidth"
                value={settings.encryption}
                onChange={handleEncryptionChange}
                autoWidth
                size="small"
                label="Encryption algorithm"
              >
                {algorithm.map((i) => (
                  <MenuItem key={i} value={i}>
                    {i}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
      </div>
      <div className="mx-6 mb-6 rounded-xl bg-sky-100 px-4 py-6">
        <div className="mb-3 flex flex-row justify-between">
          <span className="my-auto">Steam setting</span>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-autowidth-label">network</InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={settings.network}
              onChange={handleNetworkChange}
              autoWidth
              size="small"
              label="Encryption algorithm"
            >
              {network.map((i) => (
                <MenuItem key={i} value={i}>
                  {i}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="flex flex-row justify-between rounded-xl bg-sky-50 p-3">
          <TextField
            id="outlined-number"
            label="host"
            type="string"
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleOnChange(event, 'settings', 'host');
            }}
            value={settings.host}
          />
          <TextField
            id="outlined-number"
            label="path"
            type="string"
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleOnChange(event, 'settings', 'path');
            }}
            value={settings.path}
          />
        </div>
      </div>
      <div className="mx-6 mb-6 rounded-xl bg-sky-50 px-4 py-6">
        <div className="mb-3 flex flex-row justify-between">
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="demo-simple-select-autowidth-label">security</InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={settings.security}
              onChange={handleSecurityChange}
              size="small"
              autoWidth
              label="security"
            >
              <MenuItem value="none">
                <em>None</em>
              </MenuItem>
              <MenuItem value={'tls'}>tls</MenuItem>
              <MenuItem value={'xtls'}>xtls</MenuItem>
            </Select>
          </FormControl>
          <FormGroup className="my-auto w-fit">
            <FormControlLabel
              control={
                <Checkbox
                  value={settings.allowInsecure}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    handleOnChange(event, 'settings', 'allowInsecure')
                  }
                />
              }
              label="allow insecure"
            />
          </FormGroup>
        </div>
        <TextField
          id="outlined-number"
          label="tls server domin"
          type="string"
          fullWidth
          size="small"
          InputLabelProps={{
            shrink: true,
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            handleOnChange(event, 'settings', 'tlsServerDomin');
          }}
          value={settings.tlsServerDomin}
        />
      </div>
    </section>
  );
};

export default ManualSettings;
