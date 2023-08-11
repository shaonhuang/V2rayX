import { useEffect, useState } from 'react';
import {
  Button,
  IconButton,
  Fab,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Backdrop,
  Chip,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Storage, Share, MoreHoriz, Add, Edit, Delete } from '@mui/icons-material';
import AddServerDialog from './components/AddServer';
import { cloneDeep } from 'lodash';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3870CE',
    },
    secondary: {
      main: '#7CA4E2',
    },
  },
});

const Block = (props: any) => (
  <div className="h-20 w-52 rounded-xl" style={{ backgroundColor: 'white' }}>
    <p>{props.title}</p>
  </div>
);
const MoreOptionsList = (props) => {
  const { data } = props;
  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // e.preventDefault();
            props.handleEdit(data.key);
          }}
        >
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          component="a"
          href="#simple-list"
          onClick={(e) => {
            // e.preventDefault();
            props.handleDelete(data.key);
          }}
        >
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </ListItemButton>
      </ListItem>
    </List>
  );
};
const ServerItem = (props: any) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  const serverName = 'New Server';
  const protocol = props.data.outbounds[0].protocol.toUpperCase() ?? 'Vmess';
  return (
    <div
      className={`m-2 grid h-16 w-5/6 items-center rounded-xl ${props.className}`}
      style={{ gridTemplateColumns: '0.5fr 1.5fr 1fr 1fr 1fr 1fr' }}
      onClick={props.onClick}
    >
      <div className="ml-3 mr-6 inline-flex h-12 w-12 items-center rounded-xl bg-purple-600">
        <Storage style={{}} className="m-auto" />
      </div>
      <span className="inline-flex w-fit items-center font-bold">{serverName}</span>
      <span className="w-fit justify-self-center text-black-dim dark:text-white">{protocol}</span>
      {
        // placeholder for data usage status
      }
      {props.seletedServer === props.index ? (
        <Chip
          label={props.running ? 'running' : 'failed'}
          color={props.running ? 'success' : 'error'}
          variant="outlined"
          className="w-3/6 justify-self-center"
        />
      ) : (
        <span className="w-fit justify-self-center text-black-dim"> </span>
      )}
      {
        // <span className="w-fit justify-self-center text-black-dim"> </span>
      }
      <ThemeProvider theme={theme}>
        <IconButton color="primary" className="w-fit justify-self-center" disabled>
          <Share className="justify-self-center" fontSize="medium" />
        </IconButton>
        <IconButton
          color="secondary"
          className="mr justify-self-end"
          style={{ marginRight: '1.2rem' }}
          aria-describedby={id}
          onClick={handleClick}
        >
          <MoreHoriz className="justify-self-end" fontSize="large" />
        </IconButton>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          <MoreOptionsList
            data={props.data}
            handleDelete={props.handleDelete}
            handleEdit={props.handleEdit}
          />
        </Popover>
      </ThemeProvider>
    </div>
  );
};

const Servers = (): JSX.Element => {
  const [editIdx, setEditIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<JSON>({});
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(window.v2rayService.checkService()?? false);
  const [seletedServer, setSeletedServer] = useState<number>(
    window.electron.store.get('selectedServer') ?? -1
  );
  const [servers, setServers] = useState<Array<JSON>>(
    window.electron.store.get(`servers`).map((i, idx) => {
      i.key = idx;
      return i;
    })
  );

  const handleSelectServer = (key: number) => {
    setSeletedServer(key);
    window.electron.store.set('selectedServer', key);
    window.v2rayService.stopService();
    window.v2rayService.startService(window.electron.store.get('servers')[key]);
  };

  const handleAddOpen = () => {
    setOpen(true);
    setDialogType('add');
  };

  useEffect(() => {
    if (seletedServer > -1) {
      setLoading(true);
      // FIXME: service
      window.v2rayService.stopService();
      window.v2rayService.startService(window.electron.store.get('servers')[seletedServer]);
      setRunning(window.v2rayService.checkService());
      setLoading(false);
    }
  }, [seletedServer]);

  const handleClose = function (type: 'add' | 'edit', config: JSON) {
    if (arguments[1] === 'backdropClick' || arguments[1] === 'escapeKeyDown') {
      setOpen(false);
      return;
    }
    if (typeof config === 'object' && JSON.stringify(config) !== '{}') {
      if (type === 'add') {
        window.electron.store.set('servers', [...window.electron.store.get('servers'), config]);
        config = { ...config, key: servers.length };
        setServers([...servers, config]);
        window.v2rayService.stopService();
        window.v2rayService.startService(window.electron.store.get('servers')[seletedServer]);
        // no init service untill selectedServer is choosed
        window.v2rayService.stopService();
      } else {
        const storeServers = window.electron.store.get('servers');
        storeServers.splice(editIdx, 1, config);
        window.electron.store.set('servers', storeServers);
        config = { ...config, key: editIdx };
        servers.splice(editIdx, 1, config);
        setServers(cloneDeep(servers));
        window.v2rayService.stopService();
        window.v2rayService.startService(window.electron.store.get('servers')[seletedServer]);
        // no init service untill selectedServer is choosed
        window.v2rayService.stopService();
      }
      setOpen(false);
    }
  };

  const handleDeleteItem = (key) => {
    servers.splice(key, 1);
    if (
      !window.electron.store.get('servers') ||
      window.electron.store.get('selectedServer') === key
    ) {
      window.v2rayService.stopService();
    }

    if (key === window.electron.store.get('selectedServer')) {
      window.electron.store.set('selectedServer', -1);
      setSeletedServer(-1);
    }
    setServers(
      servers.map((i, idx) => {
        i.key = idx;
        return i;
      })
    );
    window.electron.store.set(
      'servers',
      window.electron.store.get('servers').filter((i, idx) => idx !== key)
    );
  };
  const handleEditItem = (key) => {
    setEditIdx(key);
    setOpen(true);
    setDialogType('edit');
    setEdit(window.electron.store.get('servers')[key]);
  };
  const handleLoading = () => {
    setLoading(true);
  };

  window.electron.electronAPI.ipcRenderer.on('v2ray:status', (event,status: boolean) => {
    console.log(status,'running')
    setRunning(status)
  });

  return (
    <section className="">
      <div className="m-auto mb-12 flex w-max flex-row gap-8">
        {/*
        <Block title="Network Speed"></Block>
        <Block title="Connection"></Block>
        */}
      </div>
      {/*
      <div>
        <Button>import from clipboard</Button>
        <Button>import from screen</Button>
      </div>
      */}
      <div className="flex flex-col items-center justify-center text-black dark:text-white">
        {!servers.length ? (
          <></>
        ) : (
          servers.map(
            (i, idx) =>
              i && (
                <ServerItem
                  className={seletedServer === i.key ? 'bg-sky-200 dark:bg-sky-700' : 'bg-white dark:bg-gray-400'}
                  serverName="New Server"
                  seletedServer={seletedServer}
                  key={idx}
                  index={idx}
                  running={running}
                  data={i}
                  onClick={(e) => {
                    e.preventDefault();
                    if (e.target === e.currentTarget) {
                      handleSelectServer(i.key);
                    }
                  }}
                  handleDelete={handleDeleteItem}
                  handleEdit={handleEditItem}
                ></ServerItem>
              )
          )
        )}
      </div>
      <div className="float-left ml-6">
        <Fab color="primary" aria-label="add" onClick={handleAddOpen}>
          <Add />
        </Fab>
      </div>
      <AddServerDialog open={open} type={dialogType} onClose={handleClose} edit={edit} />
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
        onClick={handleLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </section>
  );
};
export default Servers;
