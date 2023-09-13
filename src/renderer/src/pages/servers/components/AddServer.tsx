import * as React from 'react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogTitle,
  FormControl,
  Input,
  InputAdornment,
  InputLabel,
  Snackbar,
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContextMenu from '@renderer/components/ContextMenu';
import { useEffect, useState } from 'react';
import ReactJson from 'react-json-view';
import { find, isEqual } from 'lodash';

import {
  VmessV1,
  VmessV2,
  isVMessLink,
  isVMessLinkV1,
  isVMessLinkV2,
  parseV1Link,
  parseV2Link,
  parseVmess2config,
  fromJson2Vmess2,
  objToV2Link,
  emptyVmessV2,
} from '@renderer/utils/protocol';
import ManualSettings from './ManualSettings';
import { useAppSelector } from '@store/hooks';

export interface AddServerDialogProps {
  open: boolean;
  type: 'add' | 'edit';
  edit: JSON;
  onClose: (event, configObj: JSON, configLink: string) => void;
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

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ImportSettings = (props: any) => {
  const data = props.data ?? {};
  const copyData = (data) => {
    window.clipboard.paste(JSON.stringify(data.src));
  };
  return (
    <section className="mx-4 min-h-[100px] text-left">
      {
        <ReactJson
          src={data}
          theme="summerfruit"
          collapsed={false}
          displayObjectSize={true}
          enableClipboard={copyData}
          indentWidth={4}
          displayDataTypes={true}
          iconStyle="triangle"
        />
      }
    </section>
  );
};

const AddServerDialog = (props: AddServerDialogProps) => {
  const template = useAppSelector((state) => state.serversPage.serverTemplate);
  const { onClose, open, type, edit } = props;
  const [errorType, setErrorType] = useState('empty');
  const [openNotice, setNoticeOpen] = React.useState(false);
  const [mode, setMode] = useState('import');
  const [importData, setImportData] = useState(
    process.env.NODE_ENV === 'development'
      ? 'vmess://eyAidiI6IjIiLCAicHMiOiIiLCAiYWRkIjoiNDUuNzcuNzEuMjAzIiwgInBvcnQiOiI0NDMiLCAiaWQiOiI5YmIwNTAyZS1mYjI2LTQyNWEtODZkNC05YmJhNDQxNjdlNTkiLCAiYWlkIjoiMCIsICJuZXQiOiJ3cyIsICJ0eXBlIjoibm9uZSIsICJob3N0IjoiaGloYWNrZXIuc2hvcCIsICJwYXRoIjoiL1FZQXA3VXpjIiwgInRscyI6InRscyIgfQ=='
      : ''
  );
  const [jsonViewData, setJSONViewData] = useState(props.type === 'add' ? template : props.edit);
  const servers = useAppSelector((state) => state.serversPage.servers);

  const handleImportUrl = () => {
    if (isVMessLink(importData)) {
      const vmessObj: VmessV1 | VmessV2 = isVMessLinkV1(importData)
        ? parseV1Link(importData)
        : parseV2Link(importData);
      setJSONViewData(parseVmess2config(vmessObj));
      setMode('import');
    } else {
      setErrorType('invalid');
      setImportData('');
      setJSONViewData({});
      setNoticeOpen(true);
    }
  };
  const handleCut = () => {
    window.clipboard.paste(importData);
    setImportData('');
  };
  const handleCopy = () => {
    window.clipboard.paste(importData);
  };
  const handlePaste = () => {
    window.clipboard.read().then((data) => {
      setImportData(data);
    });
  };

  const handleManualConfigChange = (configObj: JSON) => {
    setJSONViewData(configObj);
  };

  const handleSave = (configObj) => {
    const hash = window.electron.electronAPI.hash(configObj);
    if (JSON.stringify(configObj) === '{}') {
      setErrorType('empty');
      setNoticeOpen(true);
      return;
    } else if (configObj.inbounds[0].port === configObj.inbounds[1].port) {
      setErrorType('invalid');
      setNoticeOpen(true);
      return;
    } else if (find(servers, { id: hash })) {
      setErrorType('repeated');
      setNoticeOpen(true);
      return;
    }
    // TODO: regenerate link through vmessObj
    setJSONViewData({});
    // FIXME: should save Link to const data
    let link = '';
    if (
      importData !== '' &&
      isEqual(
        isVMessLinkV1(importData) ? parseV1Link(importData) : parseV2Link(importData),
        fromJson2Vmess2(configObj)
      )
    ) {
      link = importData;
    } else {
      link = objToV2Link(fromJson2Vmess2(configObj));
    }
    onClose(null, configObj, link);
  };

  const handleNoticeText = (errorType) => {
    switch (errorType) {
      case 'empty':
        return 'Please fill in the form or Import a link';
      case 'invalid':
        return 'Invalid import link';
      case 'repeated':
        return 'Repeated server';
      default:
        return 'error';
    }
  };

  const handleNoticeClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNoticeOpen(false);
  };

  useEffect(() => {
    if (type === 'edit') {
      setJSONViewData(edit);
    }
  }, [type, edit]);
  return (
    <ThemeProvider theme={theme}>
      <Snackbar open={openNotice} autoHideDuration={6000} onClose={handleNoticeClose}>
        <Alert onClose={handleNoticeClose} severity="warning" sx={{ width: '100%' }}>
          {handleNoticeText(errorType)}
        </Alert>
      </Snackbar>
      <Dialog onClose={onClose} open={open}>
        <div className="w-[600px]  overflow-x-hidden bg-sky-100 p-6">
          <DialogTitle className="text-center text-gray-700">
            <span className="">Configure Server</span>
            <IconButton
              aria-label="close"
              onClick={(event) => {
                onClose(event, {}, '');
                setJSONViewData({});
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
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
                    <ContextMenu
                      handleCutImportData={handleCut}
                      handleCopyImportData={handleCopy}
                      handlePasteImportData={handlePaste}
                    />
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
              <div>
                {mode === 'import' ? (
                  <ImportSettings data={jsonViewData} />
                ) : (
                  <ManualSettings data={jsonViewData} handleDataSave={handleManualConfigChange} />
                )}
              </div>
            </div>
          </div>
          <div className=" m-6">
            <RoundedButton
              className="w-12"
              onClick={() => {
                handleSave(jsonViewData);
              }}
            >
              Save
            </RoundedButton>
          </div>
        </div>
      </Dialog>
    </ThemeProvider>
  );
};
export default AddServerDialog;
