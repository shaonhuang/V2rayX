import { useState } from 'react';
import { Button, IconButton, Stack, Container, Paper, Box } from '@mui/material';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { useAppSelector } from '@renderer/store/hooks';

import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from '@renderer/components/InfiniteLogTable';

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
  const v2rayLogsFolder = useAppSelector(
    (state) => state.settingsPage.generalSettings.v2rayLogsFolder,
  );
  const [logType, setLogType] = useState<string>('access');

  const queryFn = async ({ start, size, filters, globalFilter, sorting }) => {
    window.electron.electronAPI.ipcRenderer.send('logs:getAll', {
      path: v2rayLogsFolder.concat('access.log'),
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
      path: v2rayLogsFolder.concat('error.log'),
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
      <Paper>
        <Box className="mt-2 flex w-full flex-col items-center gap-4 p-4">
          <Box>
            {/*<Paper elevation={0} className="mb-2">
              Log level: {server.log.loglevel.toUpperCase()}
            </Paper>*/}
            <Box className="px-4">
              {`Log File Path:   ${v2rayLogsFolder.concat(
                logType === 'access' ? 'access.log' : 'error.log',
              )}`}
              <IconButton
                color="primary"
                className=""
                onClick={() => {
                  window.electron.electronAPI.shell
                    .openPath(
                      v2rayLogsFolder.concat(logType === 'access' ? 'access.log' : 'error.log'),
                    )
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
            </Box>
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
      </Paper>
    </Container>
  );
};

export default Index;
