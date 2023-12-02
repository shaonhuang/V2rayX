import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Button, IconButton, Stack, Container, Paper, Box } from '@mui/material';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { useAppSelector } from '@renderer/store/hooks';
import { find, isEmpty } from 'lodash';
import { VmessObjConfiguration, EmptyObject } from '@renderer/constant/types';

import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from '@renderer/components/InfiniteTable';

type Log = {
  date: string;
  time: string;
  address: string;
  type: string;
  content: string;
  level: string;
};

const columns: MRT_ColumnDef<Log>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'time',
    header: 'Time',
  },
  {
    accessorKey: 'address',
    header: 'Address',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'content',
    header: 'Content',
  },
  {
    accessorKey: 'level',
    header: 'Level',
  },
];

type ErorLog = {
  date: string;
  time: string;
  type: string;
  content: string;
};

const columnsError: MRT_ColumnDef<ErorLog>[] = [
  {
    accessorKey: 'errorDate',
    header: 'Date',
  },
  {
    accessorKey: 'errorTime',
    header: 'Time',
  },
  {
    accessorKey: 'errorType',
    header: 'Type',
  },
  {
    accessorKey: 'errorContent',
    header: 'Content',
  },
];

const Index = (): JSX.Element => {
  const serverState = useAppSelector((state) => state.serversPage.servers);
  const [server, setServer] = useState<VmessObjConfiguration | EmptyObject>({});
  const currentServerId = useAppSelector((state) => state.serversPage.currentServerId);
  const [logType, setLogType] = useState<string>('access');

  useEffect(() => {
    if (currentServerId !== '') {
      setServer(find(serverState, { id: currentServerId })?.config);
    }
  }, [currentServerId]);

  useEffect(() => {
    // window.location.reload();
  }, [logType]);

  const queryFn = async ({ start, size, filters, globalFilter, sorting }) => {
    window.electron.electronAPI.ipcRenderer.send('logs:getAll', {
      type: 'access.log',
      start,
      size,
      filters,
      globalFilter,
      sorting,
    });
    return new Promise((resolve, reject) => {
      window.electron.electronAPI.ipcRenderer.once('logs:getAll', (_, { data, meta }) => {
        const logs = data;
        return resolve({ data: logs, meta });
      });
    });
  };
  const queryFnError = async ({ start, size, filters, globalFilter, sorting }) => {
    window.electron.electronAPI.ipcRenderer.send('logs:getAllError', {
      type: 'error.log',
      start,
      size,
      filters,
      globalFilter,
      sorting,
    });
    return new Promise((resolve, reject) => {
      window.electron.electronAPI.ipcRenderer.once('logs:getAllError', (_, { data, meta }) => {
        const logs = data;
        return resolve({ data: logs, meta });
      });
    });
  };
  const DataGrid = (props) => {
    return <DataTable columns={props.columns} queryFn={props.queryFn} />;
  };

  return (
    <Container>
      {!isEmpty(server) ? (
        <Box className="flex w-full flex-col items-center gap-4 py-4">
          <Box >
            <Paper elevation={0} className='mb-2'>Log level: {server.log.loglevel.toUpperCase()}</Paper>
            <Paper elevation={0} className='px-4'>
              Log file path: {server.log[logType === 'access' ? 'access' : 'error']}
              <IconButton
                color="primary"
                className=""
                onClick={() => {
                  window.electron.electronAPI.shell
                    .openPath(server.log[logType === 'access' ? 'access' : 'error'])
                    .then(() => {
                      // File opened successfully
                      console.log('File opened');
                    })
                    .catch((error) => {
                      // Error occurred while opening the file
                      console.error(error);
                    });
                }}
                size="small"
              >
                <FileOpenIcon className="" fontSize="medium" />
              </IconButton>
            </Paper>
          </Box>
          <Box className="flex items-center justify-center gap-6">
            <Button
              variant={logType === 'access' ? 'contained' : 'outlined'}
              onClick={() => setLogType('access')}
            >
              access log
            </Button>
            <Button
              variant={logType === 'error' ? 'contained' : 'outlined'}
              onClick={() => setLogType('error')}
            >
              error log
            </Button>
          </Box>
          <Stack sx={{ maxWidth: '100%' }}>
            {logType === 'access' ? (
              <DataGrid columns={columns} queryFn={queryFn} />
            ) : (
              <DataGrid columns={columnsError} queryFn={queryFnError} />
            )}
          </Stack>
        </Box>
      ) : (
        <Box className="flex h-[80vh] w-full flex-col items-center justify-center">
          <Paper className="p-4" elevation={0}>
            Log File is not assigned
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Index;
