import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { cloneDeep } from 'lodash';
import { useState } from 'react';
import ReactJson from 'react-json-view';
import * as md5 from 'md5'
import { encode, decode } from 'js-base64';

export interface AddServerDialogProps {
  open: boolean;
  onClose: () => void;
}
export interface Settings {
  protocol: string;
  address: string;
  port: string;
  id: string;
  alterId: string;
  level: string;
  encryption: string;
  network: string;
  host: string;
  path: string;
  security: string;
  allowInsecure: boolean;
  tlsServerDomin: string;
}

const theme = createTheme({
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
        },
      },
    },
  },
});

const RoundedButton = styled(Button)({
  borderRadius: '12px',
  backgroundColor: '#7CA4E2',
});

const ImportSettings = (props: any) => {
  const data = props.data ?? {};
  console.log(typeof data)
  return <section className="min-h-[100px] text-left">{
    <ReactJson
      src={data}
      theme="solarized"
      collapsed={false}
      displayObjectSize={true}
      enableClipboard={true}
      indentWidth={4}
      displayDataTypes={true}
      iconStyle='triangle'
    />}</section>;
};
const ManualSettings = () => {
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

  const [settings, setSettings] = useState<Settings>({
    protocol: '',
    address: '',
    port: '',
    id: '',
    alterId: '',
    level: '',
    encryption: '',
    network: '',
    host: '',
    path: '',
    security: '',
    allowInsecure: false,
    tlsServerDomin: '',
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
  return (
    <section className="">
      <div className="mx-6 mb-6 rounded-xl bg-sky-100 px-4 py-6">
        <div className="flex flex-row justify-between">
          <span className="my-auto">Base Settings</span>
          <Button>Settings</Button>
        </div>
        <div className='bg-sky-50 p-3 rounded-xl'>
          <div className="flex flex-row flex-nowrap justify-between py-3">
            <TextField
              className="w-24"
              id="outlined-number"
              label="socket port"
              type="number"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              className="w-24"
              id="outlined-number"
              label="http port"
              type="number"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormGroup className="w-fit">
              <FormControlLabel control={<Checkbox defaultChecked />} label="udp" />
            </FormGroup>
          </div>
          <div>
            <TextField size="small" fullWidth label="DNS" id="fullWidth" />
          </div>
          <div className="flex flex-row flex-nowrap justify-between py-3">
            <FormGroup className="w-fit">
              <FormControlLabel control={<Checkbox defaultChecked />} label="Mux" />
            </FormGroup>
            <input value="8" className="w-24 border-2 border-gray-300 bg-transparent" />
          </div>
        </div>
      </div>
      <div className="mx-6 mb-6 rounded-xl bg-sky-100 px-4 py-6">
        <div className="flex flex-row justify-between">
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
        <div className='bg-sky-50 p-3 rounded-xl'>
          <div className="flex flex-row items-center justify-center py-3">
            <TextField
              id="outlined-basic"
              label="address"
              variant="outlined"
              size="small"
              className="w-[268px]"
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
              value={settings.port}
            />
          </div>
          <div className='mb-3'>
            <TextField size="small" fullWidth label="Id" id="fullWidth" value={settings.id} />
          </div>
          <div className='w-full flex flex-row justify-between mb-3'>
            <TextField
              id="outlined-basic"
              label="alterId"
              variant="outlined"
              size="small"
              className="w-[100px]"
              value={settings.alterId}
            />
            <TextField
              id="outlined-basic"
              label="level"
              variant="outlined"
              size="small"
              className="w-[100px]"
              value={settings.level}
            />
          </div>
          <div className='flex flex-row justify-start m-0'>
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
        <div className="flex flex-row justify-between mb-3">
          <span className='my-auto'>Steam setting</span>
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
        <div className='flex flex-row justify-between bg-sky-50 p-3 rounded-xl'>
          <TextField
            id="outlined-number"
            label="host"
            type="string"
            size="small"
            InputLabelProps={{
              shrink: true,
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
            value={settings.path}
          />
        </div>
      </div>
      <div className='mx-6 mb-6 rounded-xl bg-sky-50 px-4 py-6'>
        <div className='flex flex-row justify-between mb-3'>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="demo-simple-select-autowidth-label">security</InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={settings.security}
              onChange={handleSecurityChange}
              size='small'
              autoWidth
              label="security"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value={'tls'}>tls</MenuItem>
              <MenuItem value={'xtls'}>xtls</MenuItem>
            </Select>
          </FormControl>
          <FormGroup className='w-fit my-auto'>
            <FormControlLabel control={<Checkbox defaultChecked />} label="allow insecuree" />
          </FormGroup>
        </div>
        <TextField
          id="outlined-number"
          label="tls server domin"
          type="string"
          fullWidth
          size='small'
          InputLabelProps={{
            shrink: true,
          }}
          value={settings.tlsServerDomin}
        />
      </div>
    </section >
  );
};

const AddServerDialog = (props: AddServerDialogProps) => {
  const { onClose, open } = props;
  const [mode, setMode] = useState('import');
  const [importData, setImportData] = useState('vmess://eyAidiI6IjIiLCAicHMiOiIiLCAiYWRkIjoiNDUuNzYuMTY4LjI1IiwgInBvcnQiOiI0NDMiLCAiaWQiOiI1NDM3NGNhMi0zMzg4LTRkZjItYTk5OS0wOGJiODFlZWZlZTciLCAiYWlkIjoiMCIsICJuZXQiOiJ3cyIsICJ0eXBlIjoibm9uZSIsICJob3N0IjoiaGloYWNrZXIuc2hvcCIsICJwYXRoIjoiL2hrY0hPeWVFSyIsICJ0bHMiOiJ0bHMiIH0=');
  const [data, setData] = useState({});
  const handleImportUrl = () => {
    setData(JSON.parse(decode(importData.split('://')[1])))
    console.log(window.electron.store.get('serversHash'))
    window.electron.store.setServer(data);
  }
  const handleClose = () => {
    onClose();
  };
  // ipcRenderer.send('serverItem', JSON.stringify(teams));
  return (
    <ThemeProvider theme={theme}>
      <Dialog onClose={handleClose} open={open}>
        <div className="w-[600px]  bg-sky-100 p-6 overflow-x-hidden">
          <DialogTitle className="text-center text-gray-700">
            <span className="">Configure Server</span>
          </DialogTitle>
          <div className="flex flex-col items-center overflow-x-hidden rounded-xl bg-sky-300 p-6">
            <FormControl
              sx={{ m: 1, width: '56ch' }}
              variant="standard"
              className="rounded-xl bg-sky-200 p-3"
            >
              <InputLabel>Url</InputLabel>
              <Input
                value={importData}
                placeholder="Support Vmess Only"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setImportData(event.target.value);
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <Button onClick={() => handleImportUrl()}>Import</Button>
                  </InputAdornment>
                }
              />
            </FormControl>
            <div className="h-auto w-[56ch] rounded-xl bg-sky-200">
              <div className="flex flex-row justify-around gap-2 py-3">
                <RoundedButton onClick={() => setMode('import')}>Import</RoundedButton>
                <RoundedButton onClick={() => setMode('manual')}>Manual</RoundedButton>
              </div>
              <div>{mode === 'import' ? <ImportSettings data={data} /> : <ManualSettings />}</div>
            </div>
          </div>
          <div className=' m-6'>
            <RoundedButton
              className="w-12"
              onClick={() => {
                console.log('Finish');
              }}
            >
              Finish
            </RoundedButton>
          </div>
        </div>
      </Dialog>
    </ThemeProvider>
  );
};
export default AddServerDialog;
