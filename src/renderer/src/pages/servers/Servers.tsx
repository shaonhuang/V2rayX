import { BaseSyntheticEvent, useEffect, useState } from 'react';
import {
  Fab,
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Backdrop,
  Chip,
} from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import IosShareIcon from '@mui/icons-material/IosShare';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Storage, Share, MoreHoriz, Add, Edit, Delete } from '@mui/icons-material';
import AddServerDialog from './components/AddServer';
import { find, cloneDeep } from 'lodash';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setServersState, setCurrentServerId } from '@store/serversPageSlice';
import PopoverMenu from '@renderer/components/PopoverMenu';
import { Server, Servers, VmessObjConfiguration } from '@renderer/constant/types';

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

// const Block = (props: any) => (
//   <div className="h-20 w-52 rounded-xl" style={{ backgroundColor: 'white' }}>
//     <p>{props.title}</p>
//   </div>
// );

const ServerItem = (props: any) => {
  const protocol = props.data.outbounds[0].protocol.toUpperCase() ?? 'Vmess';
  return (
    <div
      className={`m-2 grid h-16 w-5/6 items-center rounded-xl ${props.className}`}
      style={{ gridTemplateColumns: '0.5fr 1.5fr 0.5fr 1.5fr 1fr 1fr' }}
      onClick={props.onClick}
    >
      <div className="ml-3 mr-6 inline-flex h-12 w-12 items-center rounded-xl bg-purple-600">
        <Storage style={{}} className="m-auto" />
      </div>
      <span className="inline-flex w-fit items-center font-bold">{props.serverName}</span>
      <span className="w-fit justify-self-center text-black-dim dark:text-white">{protocol}</span>
      {
        // placeholder for data usage status
      }
      {props.isSeleted ? (
        <Chip
          label={props.running ? 'running' : 'stopped'}
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
        <PopoverMenu>
          <Share className="justify-self-center" fontSize="medium" />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                disabled
                onClick={() => {
                  props.handleQR(props.index);
                }}
              >
                <ListItemIcon>
                  <ScreenShareIcon />
                </ListItemIcon>
                <ListItemText primary="Share QR Code" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  props.handleLink(props.index);
                }}
              >
                <ListItemIcon>
                  <IosShareIcon />
                </ListItemIcon>
                <ListItemText primary="Share Link" />
              </ListItemButton>
            </ListItem>
          </List>
        </PopoverMenu>
        <PopoverMenu>
          <MoreHoriz className="justify-self-end" fontSize="large" />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  props.handleEdit(props.index);
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
                onClick={() => {
                  props.handleDelete(props.index);
                }}
              >
                <ListItemIcon>
                  <Delete />
                </ListItemIcon>
                <ListItemText primary="Delete" />
              </ListItemButton>
            </ListItem>
          </List>
        </PopoverMenu>
      </ThemeProvider>
    </div>
  );
};

const Index = (): JSX.Element => {
  const [editIdx, setEditIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<VmessObjConfiguration>({} as VmessObjConfiguration);
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [seletedServer, setSeletedServer] = useState<string>('');
  const serversState = useAppSelector((state) => state.serversPage.servers);
  const currentServerId = useAppSelector((state) => state.serversPage.currentServerId);
  const serviceRunningState = useAppSelector((state) => state.serversPage.serviceRunningState);
  const [servers, setServers] = useState<Servers>([]);
  const dispatch = useAppDispatch();

  const handleSelectServer = (id: string) => {
    setSeletedServer(id);
    dispatch(setCurrentServerId(id));

    // FIXME: logic mess up
    if (serviceRunningState) {
      window.v2rayService.stopService();
      window.v2rayService.startService(find(servers, { id: id })?.config);
    }
    window.v2rayService.stopService();
    // to refrsh tray icon menu
    window.api.send('v2rayx:service:selected');
  };

  const handleAddOpen = () => {
    setOpen(true);
    setDialogType('add');
  };

  const saveToDb = (
    type: 'add' | 'edit',
    serverConfig: VmessObjConfiguration,
    currentLink: string,
  ) => {
    let newServers;
    const newServerItem: Server = {
      id: window.electron.electronAPI.hash(serverConfig),
      ps: serverConfig.other?.ps
        ? serverConfig.other?.ps
        : serverConfig.outbounds[0].settings.vnext[0].address,
      config: serverConfig,
      link: currentLink,
    };
    if (type === 'add') {
      newServers = [...serversState, newServerItem];
    } else {
      newServers = cloneDeep(servers);
      newServers.splice(editIdx, 1, newServerItem);
    }
    dispatch(setServersState(newServers));
    setServers(newServers);
    // to refrsh tray icon menu
    window.api.send('v2rayx:service:selected');
  };

  const handleDialogClose = (
    event: BaseSyntheticEvent,
    configObj: VmessObjConfiguration,
    configLink: string,
  ) => {
    setOpen(false);
    if (!event) {
      saveToDb(dialogType, configObj, configLink);
    }
  };
  const handleQRItem = () => {};
  const handleLinkItem = (idx: number) => {
    window.clipboard.paste(servers[idx]?.link);
  };

  const handleDeleteItem = (idx: number) => {
    const newServers = cloneDeep(servers);
    newServers.splice(idx, 1);
    if (currentServerId === servers[idx].id) {
      window.v2rayService.stopService();
      dispatch(setCurrentServerId(''));
      setSeletedServer('');
    }
    dispatch(setServersState(newServers));
    setServers(newServers);
    newServers.length === 0 && window.api.send('v2rayx:service:empty');
    // to refrsh tray icon menu
    window.api.send('v2rayx:service:selected');
  };
  const handleEditItem = (idx: number) => {
    setEditIdx(idx);
    setOpen(true);
    setDialogType('edit');
    setEdit(servers[idx]?.config);
  };
  const handleLoading = () => {
    setLoading(true);
  };

  useEffect(() => {
    setSeletedServer(currentServerId);
    window.api.receive('v2ray:status', (status: boolean) => {
      setRunning(status);
    });
    // FIXME: type error
    // @ts-ignore
    window.v2rayService.checkService().then((res) => setRunning(res));
    setServers(serversState);
  }, []);

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
                  className={
                    seletedServer === i.id
                      ? 'bg-sky-200 dark:bg-sky-700'
                      : 'bg-white dark:bg-gray-400'
                  }
                  serverName={i.ps}
                  isSeleted={seletedServer === i.id}
                  key={idx}
                  index={idx}
                  running={running}
                  data={i.config}
                  onClick={(e) => {
                    e.preventDefault();
                    if (e.target === e.currentTarget) {
                      handleSelectServer(i.id);
                    }
                  }}
                  handleQR={handleQRItem}
                  handleLink={handleLinkItem}
                  handleDelete={handleDeleteItem}
                  handleEdit={handleEditItem}
                ></ServerItem>
              ),
          )
        )}
      </div>
      <div className="float-left ml-6">
        <Fab color="primary" aria-label="add" onClick={handleAddOpen}>
          <Add />
        </Fab>
      </div>
      <AddServerDialog open={open} type={dialogType} onClose={handleDialogClose} edit={edit} />
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
export default Index;
