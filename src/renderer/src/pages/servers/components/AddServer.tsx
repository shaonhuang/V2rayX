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
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import ReactJson from 'react-json-view';
import * as _ from 'lodash';

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
import ManualSettings from './ManualSettings';

export interface AddServerDialogProps {
  open: boolean;
  type: 'add' | 'edit';
  edit: JSON;
  idx: number;
  onClose: (type: 'add' | 'edit', configObj: JSON) => void;
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
  return (
    <section className="min-h-[100px] text-left">
      {
        <ReactJson
          src={data}
          theme="solarized"
          collapsed={false}
          displayObjectSize={true}
          enableClipboard={true}
          indentWidth={4}
          displayDataTypes={true}
          iconStyle="triangle"
        />
      }
    </section>
  );
};

const AddServerDialog = (props: AddServerDialogProps) => {
  const { onClose, open, type, edit } = props;
  const [errorType, setErrorType] = useState('empty');
  const [openNotice, setNoticeOpen] = React.useState(false);
  const [mode, setMode] = useState('import');
  const [importData, setImportData] = useState(
    process.env.NODE_ENV === 'development'
      ? 'vmess://eyAidiI6IjIiLCAicHMiOiIiLCAiYWRkIjoiNDUuNzYuMTY4LjI1IiwgInBvcnQiOiI0NDMiLCAiaWQiOiI1NDM3NGNhMi0zMzg4LTRkZjItYTk5OS0wOGJiODFlZWZlZTciLCAiYWlkIjoiMCIsICJuZXQiOiJ3cyIsICJ0eXBlIjoibm9uZSIsICJob3N0IjoiaGloYWNrZXIuc2hvcCIsICJwYXRoIjoiL2hrY0hPeWVFSyIsICJ0bHMiOiJ0bHMiIH0='
      : ''
  );
  const [data, setData] = useState(props.type === 'add' ? {} : props.edit);

  const handleImportUrl = () => {
    if (isVMessLink(importData)) {
      const vmessObj: VmessV1 | VmessV2 = isVMessLinkV1(importData)
        ? parseV1Link(importData)
        : parseV2Link(importData);
      setData(parseVmess2config(vmessObj));
      setMode('import');
    } else {
      setErrorType('invalid');
      setImportData('');
      setData({});
      setNoticeOpen(true);
    }
  };

  const hanleConfigChange = (configObj: JSON) => {
    setData(configObj);
  };

  const handleFinish = (vmessObj) => {
    if (JSON.stringify(vmessObj) === '{}') {
      setErrorType('empty');
      setNoticeOpen(true);
      onClose(type, vmessObj);
      return;
    } else if (vmessObj.inbounds[0].port === vmessObj.inbounds[1].port) {
      setErrorType('invalid');
      setNoticeOpen(true);
      return;
    }
    onClose(type, vmessObj);
    setData({});
  };

  const handleNoticeText = (errorType) => {
    switch (errorType) {
      case 'empty':
        return 'Please fill in the form or Import a link';
      case 'invalid':
        return 'Invalid import link';
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
      setData(edit);
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
              <div>
                {mode === 'import' ? (
                  <ImportSettings data={data} />
                ) : (
                  <ManualSettings data={data} handleDataSave={hanleConfigChange} />
                )}
              </div>
            </div>
          </div>
          <div className=" m-6">
            <RoundedButton
              className="w-12"
              onClick={() => {
                handleFinish(data);
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
