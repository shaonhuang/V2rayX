import * as React from 'react';
import { Button, FormControl, Input, InputAdornment, InputLabel } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ContextMenu from '@renderer/components/ContextMenu';
import { useEffect, useState, useLayoutEffect } from 'react';
import ReactJson, { ThemeKeys } from '@microlink/react-json-view';
import { isEqual } from 'lodash';
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
import Grid from '@mui/material/Unstable_Grid2';

import { Vmess } from '@renderer/pages/servers/config/protocols';
import { VmessObjConfiguration } from '@renderer/constant/types';
import { Server } from '@renderer/constant/types';
import BaseSettings from '@renderer/pages/servers/config/BaseSettings';
import StreamSettings from '@renderer/pages/servers/config/stream';
import Security from '@renderer/pages/servers/config/security';

import {
  VmessV2,
  isVMessLink,
  isVMessLinkV1,
  parseV1Link,
  parseV2Link,
  parseVmess2config,
  emptyVmessV2,
  fromJson2Vmess2,
  objToV2Link,
} from '@renderer/utils/protocol';
import { isMac } from '@renderer/constant';

export interface AddServerDialogProps {
  open: boolean;
  type: 'add' | 'edit';
  edit: VmessObjConfiguration;
  onClose: (event, configObj: JSON | any, configLink: string) => void;
}

type formDataType = {
  importStr: string;
  mode: string;
  protocol: string;
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

const protocols = ['Vmess'];

const emptyConfig = emptyVmessV2();

const ImportSettings = (props: any) => {
  const data = props.data ?? {};
  const [theme, _] = useState<ThemeKeys>(
    localStorage.theme === 'light' ? 'summerfruit:inverted' : 'summerfruit',
  );
  const [jsonThemes, setJsonThemes] = useState(isMac ? 'google' : theme);
  const jsonEditThemes = [
    'apathy',
    'apathy:inverted',
    'ashes',
    'bespin',
    'brewer',
    'bright:inverted',
    'bright',
    'chalk',
    'codeschool',
    'colors',
    'eighties',
    'embers',
    'flat',
    'google',
    'grayscale',
    'grayscale:inverted',
    'greenscreen',
    'harmonic',
    'hopscotch',
    'isotope',
    'marrakesh',
    'mocha',
    'monokai',
    'ocean',
    'paraiso',
    'pop',
    'railscasts',
    'rjv-default',
    'shapeshifter',
    'shapeshifter:inverted',
    'solarized',
    'summerfruit',
    'summerfruit:inverted',
    'threezerotwofour',
    'tomorrow',
    'tube',
    'twilight',
  ];
  const copyData = (data) => {
    window.clipboard.paste(JSON.stringify(data.src));
  };

  return (
    <section className="mx-4 min-h-[100px] text-left">
      <FormControl sx={{ width: 180 }} className="fixed left-2/3">
        <InputLabel>Editor Theme</InputLabel>
        <Select
          value={jsonThemes}
          input={<OutlinedInput label="Theme" />}
          MenuProps={MenuProps}
          onChange={(event) => {
            setJsonThemes(event.target.value);
          }}
        >
          {jsonEditThemes.map((i) => (
            <MenuItem key={i} value={i}>
              {i}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <ReactJson
        style={isMac ? { padding: '30px', backgroundColor: '#00000000' } : { padding: '30px' }}
        src={data}
        iconStyle="circle"
        theme={jsonThemes}
        collapsed={2}
        collapseStringsAfterLength={20}
        displayObjectSize={true}
        enableClipboard={copyData}
        onEdit={props.handleEdit}
        onAdd={props.handleEdit}
        onDelete={props.handleEdit}
        indentWidth={4}
        displayDataTypes={true}
      />
    </section>
  );
};

const Index = () => {
  const [formData, setFormData] = useState<formDataType>({
    importStr:
      process.env.NODE_ENV === 'development'
        ? 'vmess://eyAidiI6IjIiLCAicHMiOiIiLCAiYWRkIjoiNDUuNzcuNzEuMjAzIiwgInBvcnQiOiI0NDMiLCAiaWQiOiI5YmIwNTAyZS1mYjI2LTQyNWEtODZkNC05YmJhNDQxNjdlNTkiLCAiYWlkIjoiMCIsICJuZXQiOiJ3cyIsICJ0eXBlIjoibm9uZSIsICJob3N0IjoiaGloYWNrZXIuc2hvcCIsICJwYXRoIjoiL1FZQXA3VXpjIiwgInRscyI6InRscyIgfQ=='
        : '',
    mode: 'import',
    protocol: 'Vmess',
    server: {
      id: '',
      ps: '',
      config: emptyConfig as VmessObjConfiguration,
      link: '',
    },
    error: [false, false, false, false],
  });

  const handleImportUrl = () => {
    const importData = formData.importStr;
    // FIXME: fix any
    const vmessObj: VmessV2 | any = isVMessLinkV1(importData)
      ? parseV1Link(importData)
      : parseV2Link(importData);
    setFormData({
      ...formData,
      server: { ...formData.server, config: parseVmess2config(vmessObj) },
      error: [false, false, false, false],
    });
  };

  const handleError = (index: number, error: boolean) => {
    setFormData({
      ...formData,
      error: formData.error.map((e, i) => (i === index ? error : e)),
    });
  };
  const initEdit = () => {
    setFormData({ ...formData, server: JSON.parse(localStorage.getItem('editObj')) });
  };

  useLayoutEffect(() => {
    window.location.hash.includes('edit') && initEdit();
  }, []);

  const handleEditJson = (args: any) => {
    const { updated_src, name, namespace, new_value, existing_value } = args;
    setFormData({ ...formData, server: { ...formData.server, config: updated_src } });
  };

  return (
    <Container
      maxWidth="sm"
      className={`rounded-2xl py-4 pb-8 ${
        isMac ? '' : 'overflow-x-hidden overflow-y-scroll bg-sky-600/30'
      }`}
    >
      <Box sx={{ width: '100%' }} className="py-4 pb-12">
        <Stack spacing={2}>
          <Grid container spacing={2} xs={12}>
            <Grid xs={12}>
              <h1 className="text-xl dark:text-gray-300">Configure Server</h1>
            </Grid>
            <Grid container spacing={4} xs={12}>
              <Grid xs={6}>
                <Button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      mode: 'import',
                    })
                  }
                  variant={formData.mode === 'import' ? 'contained' : 'outlined'}
                >
                  Import
                </Button>
              </Grid>

              <Grid xs={6}>
                <Button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      mode: 'manual',
                    })
                  }
                  variant={formData.mode !== 'import' ? 'contained' : 'outlined'}
                >
                  Manual
                </Button>
              </Grid>
            </Grid>
            {formData.mode === 'import' ? (
              <Grid container spacing={2} xs={12}>
                <Grid container xs={12}>
                  <FormControl
                    variant="standard"
                    className="rounded-xl"
                    id="fullWidth"
                    fullWidth
                    error={formData.importStr !== '' && !isVMessLink(formData.importStr)}
                  >
                    <InputLabel>Url</InputLabel>
                    <Input
                      value={formData.importStr}
                      placeholder="Support Vmess Only"
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
                            disabled={formData.importStr === '' || !isVMessLink(formData.importStr)}
                          >
                            Import
                          </Button>
                        </InputAdornment>
                      }
                    />
                    <FormHelperText id="component-error-text">
                      {formData.importStr !== '' &&
                        !isVMessLink(formData.importStr) &&
                        'Support Vmess Only'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid xs={12}>
                  <ImportSettings data={formData.server.config} handleEdit={handleEditJson} />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid container spacing={2}>
                  <Grid spacing={2}>
                    <BaseSettings data={formData} handleError={handleError} />
                  </Grid>
                  <Grid container spacing={2}>
                    <FormControl sx={{ m: 1, width: 300 }}>
                      <InputLabel>Protocol</InputLabel>
                      <Select
                        value={formData.protocol}
                        input={<OutlinedInput label="Protocol" />}
                        MenuProps={MenuProps}
                        onChange={(event) => {
                          setFormData({ ...formData, protocol: event.target.value });
                        }}
                      >
                        {protocols.map((protocol) => (
                          <MenuItem key={protocol} value={protocol}>
                            {protocol}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid xs={16}>
                  <Vmess data={formData} handleError={handleError} />
                </Grid>
                <Grid xs={16}>
                  <StreamSettings data={formData} handleError={handleError} />
                </Grid>
                <Grid xs={16}>
                  <Security data={formData} handleError={handleError} />
                </Grid>
              </Grid>
            )}
          </Grid>
        </Stack>
      </Box>

      {formData.error.find((b) => b) || isEqual(formData.server.config, emptyConfig) ? (
        <Tooltip title="Not Satisfy Condition">
          <SaveAltIcon color="disabled" />
        </Tooltip>
      ) : (
        <IconButton
          disabled={formData.error.find((b) => b)}
          onClick={() => {
            const { importStr, server } = formData;
            const hash = window.electron.electronAPI.hash(server.config);

            let link = '';
            if (
              isEqual(
                isVMessLinkV1(importStr) ? parseV1Link(importStr) : parseV2Link(importStr),
                fromJson2Vmess2(server.config),
              )
            ) {
              link = importStr;
            } else {
              link = objToV2Link(fromJson2Vmess2(server.config));
            }
            window.api.send(`v2rayx:server:add/edit:toMain`, {
              ...formData.server,
              id: hash,
              ps: server.config.other?.ps
                ? server.config.other?.ps
                : server.config.outbounds[0].settings.vnext[0].address,
              link,
            });
            window.win.close('test');
          }}
        >
          <SaveAltIcon />
        </IconButton>
      )}
    </Container>
  );
};

export default Index;
