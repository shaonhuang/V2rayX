import * as React from 'react';
import { Button, FormControl, Input, InputAdornment, InputLabel } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ContextMenu from '@renderer/components/ContextMenu';
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Stack,
  OutlinedInput,
  MenuItem,
  Tooltip,
  FormHelperText,
  Container,
} from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import CloseIcon from '@mui/icons-material/Close';
import Grid from '@mui/material/Unstable_Grid2';
import {
  VMess as VMessData,
  VLess as VLessData,
  Trojan as TrojanData,
} from '@renderer/utils/protocol/';
import { cloneDeep, upperFirst } from 'lodash';
import { VMess, VLess, Trojan } from '@renderer/pages/servers/config/protocols';
import { Server } from '@renderer/constant/types';
import { H2, Kcp, Quic, Tcp, Ws, Grpc } from '@renderer/pages/servers/config/stream';
import Security from '@renderer/pages/servers/config/security';

export interface AddServerDialogProps {
  open: boolean;
  type: 'add' | 'edit';
  edit: any;
  onClose: (event, configObj: JSON | any, configLink: string) => void;
}

type formDataType = {
  importStr: string;
  protocol: string;
  network: string;
  server: Server;
  error: boolean[];
};

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

const protocols = ['vmess', 'vless', 'trojan'];
const networks = ['h2', 'kcp', 'quic', 'tcp', 'ws', 'grpc'];

const Index = () => {
  const vmessRef = useRef(null);
  const vlessRef = useRef(null);
  const trojanRef = useRef(null);

  const [formData, setFormData] = useState<formDataType>({
    importStr:
      process.env.NODE_ENV === 'development'
        ? 'vmess://eyAidiI6IjIiLCAicHMiOiIiLCAiYWRkIjoiNDUuNzcuNzEuMjAzIiwgInBvcnQiOiI0NDMiLCAiaWQiOiI5YmIwNTAyZS1mYjI2LTQyNWEtODZkNC05YmJhNDQxNjdlNTkiLCAiYWlkIjoiMCIsICJuZXQiOiJ3cyIsICJ0eXBlIjoibm9uZSIsICJob3N0IjoiaGloYWNrZXIuc2hvcCIsICJwYXRoIjoiL1FZQXA3VXpjIiwgInRscyI6InRscyIgfQ=='
        : '',
    protocol: 'vmess',
    network: 'tcp',
    server: {
      id: '',
      ps: '',
      link: '',
      outbound: new VMessData({}).getOutbound(),
    },
    error: [false, false, false, false],
  });
  const [outbound, setOutbound] = useState(new VMessData({}).getOutbound());

  const handleImportUrl = () => {
    const importData = formData.importStr;
    // FIXME: fix any
    // TODO: abstract to a class protocol
    let protocolFactory;
    try {
      protocolFactory = importData.includes('vmess')
        ? new VMessData(importData)
        : importData.includes('vless')
          ? new VLessData(importData)
          : importData.includes('trojan')
            ? new TrojanData(importData)
            : null;
    } catch (err) {
      protocolFactory = () => {};
    }
    if (!protocolFactory) return;

    const network = importData.includes('vless')
      ? protocolFactory.getData().type
      : new VMessData(importData).getData().net ?? 'tcp';
    setFormData({
      ...formData,
      protocol: importData.includes('vmess')
        ? 'vmess'
        : importData.includes('vless')
          ? 'vless'
          : 'trojan',
      network,
      server: {
        ...formData.server,
        outbound: protocolFactory.getOutbound(),
        ps: protocolFactory.getPs(),
      },
      error: [false, false, false, false],
    });
    setOutbound(protocolFactory.getOutbound());
  };
  useEffect(() => {
    if (vmessRef.current || vlessRef.current || trojanRef.current) {
      setOutbound(formData.server.outbound);
    }
  }, [vmessRef.current, vlessRef.current, trojanRef.current]);

  const handleError = (index: number, error: boolean) => {
    setFormData({
      ...formData,
      error: formData.error.map((e, i) => (i === index ? error : e)),
    });
  };
  const initEdit = () => {
    const { link, id, ps, outbound } = JSON.parse(localStorage.getItem('editObj'));
    let protocolFactory;
    // TODO:none support socks
    const network = outbound.streamSettings.network;
    const protocolType = outbound.protocol;

    try {
      protocolFactory =
        protocolType === 'vmess'
          ? new VMessData(link)
          : protocolType === 'vless'
            ? new VLessData(link)
            : new TrojanData(link);
    } catch (err) {
      protocolFactory = () => {};
    }
    setFormData({
      ...formData,
      server: {
        id,
        link,
        ps,
        outbound,
      },
      network,
      importStr: link,
      protocol: protocolType,
    });
    setOutbound(outbound);
  };

  useEffect(() => {
    formData.server.outbound.streamSettings.network = formData.network;
    // formData.server.outbound.protocol = formData.protocol;
  }, [formData]);

  useEffect(() => {
    window.location.hash.includes('edit') && initEdit();
  }, []);
  return (
    <Container
      maxWidth="sm"
      className={'overflow-x-hidden overflow-y-scroll rounded-2xl bg-sky-600/30 py-4 pb-8'}
    >
      <IconButton sx={{ position: 'fixed', top: 32, left: 16 }} onClick={() => close()}>
        <CloseIcon />
      </IconButton>
      <Box sx={{ width: '100%' }} className="py-4 pb-12">
        <Stack spacing={2}>
          <Grid container spacing={2} xs={12}>
            <Grid xs={12}>
              <h1 className="text-xl dark:text-gray-300">Configure Server</h1>
            </Grid>
            <Grid container spacing={2} xs={12}>
              <Grid container xs={12}>
                <FormControl
                  variant="standard"
                  className="rounded-xl"
                  id="fullWidth"
                  fullWidth
                  error={
                    formData.importStr !== '' &&
                    ['vmess', 'vless', 'trojan'].includes(formData.importStr.split('://')[0])
                  }
                >
                  <InputLabel>Url</InputLabel>
                  <Input
                    value={formData.importStr}
                    placeholder="Support VMess/VLess/Trojan"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        importStr: event.target.value,
                      })
                    }
                    className="dark:text-gray-300"
                    endAdornment={
                      <InputAdornment position="end">
                        <ContextMenu
                          handleCutImportData={() => {
                            window.clipboard.paste(formData.importStr);
                            setFormData({ ...formData, importStr: '' });
                          }}
                          handleCopyImportData={() => window.clipboard.paste(formData.importStr)}
                          handlePasteImportData={() => {
                            // FIXME: fix any
                            // @ts-ignore
                            window.clipboard.read().then((data: any) => {
                              setFormData({ ...formData, importStr: data });
                            });
                          }}
                        />
                        <Button
                          onClick={handleImportUrl}
                          disabled={
                            formData.importStr === '' ||
                            !['vmess', 'vless', 'trojan'].includes(
                              formData.importStr.split('://')[0],
                            )
                          }
                        >
                          Import
                        </Button>
                      </InputAdornment>
                    }
                  />
                  <FormHelperText id="component-error-text">
                    {formData.importStr !== '' &&
                      !['vmess', 'vless', 'trojan'].includes(formData.importStr.split('://')[0]) &&
                      'Support VMess/VLess/Trojan Only'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid container spacing={2}>
                <Grid container spacing={2} xs={12}>
                  <FormControl sx={{ m: 1, width: 300 }}>
                    <InputLabel>Protocol</InputLabel>
                    <Select
                      value={formData.protocol}
                      input={<OutlinedInput label="Protocol" />}
                      MenuProps={MenuProps}
                      onChange={(event: SelectChangeEvent) => {
                        const protocol = event.target.value;
                        const outbound = (
                          protocol === 'vmess'
                            ? new VMessData(formData.importStr || {})
                            : protocol === 'vless'
                              ? new VLessData(formData.importStr || {})
                              : new TrojanData(formData.importStr || {})
                        ).getOutbound();
                        formData.network = 'tcp';
                        setFormData({
                          ...formData,
                          protocol,
                          server: { ...formData.server, ps: '', outbound },
                        });
                        setOutbound(outbound);
                      }}
                    >
                      {protocols.map((protocol) => (
                        <MenuItem key={protocol} value={protocol}>
                          {upperFirst(protocol)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Grid xs={16}>
                {
                  [
                    <VMess data={outbound} handleError={handleError} key={0} ref={vmessRef} />,
                    <VLess data={outbound} handleError={handleError} key={1} ref={vlessRef} />,
                    <Trojan data={outbound} handleError={handleError} key={2} ref={trojanRef} />,
                    // <Socks data={formData} handleError={handleError} key={3} />,
                  ][protocols.findIndex((v) => formData.protocol === v)]
                }
              </Grid>
              <Grid container xs={16}>
                <Grid xs="auto">
                  <div className="flex h-full flex-col justify-center">
                    <span className="text-xl">Stream Setting</span>
                  </div>
                </Grid>
                <Grid xs={5}></Grid>
                <Grid xs className="mr-[-3.4rem]">
                  <FormControl sx={{ width: 120 }} required>
                    <InputLabel>Network</InputLabel>
                    <Select
                      value={formData.network}
                      input={<OutlinedInput label="Network" />}
                      MenuProps={MenuProps}
                      onChange={(event) => {
                        setFormData({ ...formData, network: event.target.value });
                      }}
                    >
                      {networks.map((i) => (
                        <MenuItem key={i} value={i}>
                          {i}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Grid xs={16}>
                {
                  [
                    <H2 data={formData.server.outbound} handleError={handleError} key={0} />,
                    <Kcp data={formData.server.outbound} handleError={handleError} key={1} />,
                    <Quic data={formData.server.outbound} handleError={handleError} key={2} />,
                    <Tcp data={formData.server.outbound} handleError={handleError} key={3} />,
                    <Ws data={formData.server.outbound} handleError={handleError} key={4} />,
                    <Grpc data={formData.server.outbound} handleError={handleError} key={5} />,
                  ][networks.findIndex((v) => formData.network === v)]
                }
              </Grid>
              <Grid xs={16}>
                <Security data={formData.server.outbound} handleError={handleError} />
              </Grid>
            </Grid>
          </Grid>
        </Stack>
      </Box>

      {formData.error.find((b) => b) ? (
        <Tooltip title="Not Satisfy Condition">
          <SaveAltIcon color="disabled" />
        </Tooltip>
      ) : (
        <IconButton
          disabled={formData.error.find((b) => b)}
          onClick={() => {
            const { importStr, server } = formData;
            const hash = window.electron.electronAPI.hash(server.outbound);
            const link = importStr;
            window.api.send(`v2rayx:server:add/edit:toMain`, {
              id: hash,
              link,
              ps: server.ps,
              outbound: server.outbound,
              latency: '',
            });
            // TODO:
            window.close();
            // window.win.close('');
          }}
        >
          <SaveAltIcon />
        </IconButton>
      )}
    </Container>
  );
};

export default Index;
