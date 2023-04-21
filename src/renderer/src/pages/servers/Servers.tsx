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
  Backdrop
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Storage, Share, MoreHoriz, Add, Edit, Delete } from '@mui/icons-material';
import AddServerDialog from './components/AddServer';
import hash from 'object-hash';
import * as _ from 'lodash';

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
        <ListItemButton>
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
            e.preventDefault();
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
  console.log(props);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
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
      <span className="inline-flex items-center font-bold w-fit">
        {serverName}
      </span>
      <span className="text-black-dim w-fit justify-self-center">{protocol}</span>
      <span className="text-black-dim w-fit justify-self-center">5M</span>
      <ThemeProvider theme={theme}>
        <IconButton color="primary" className="w-fit justify-self-center">
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
          <MoreOptionsList data={props.data} handleDelete={props.handleDelete} />
        </Popover>
      </ThemeProvider>
    </div>
  );
};

const Servers = () => {
  const [open, setOpen] = useState(false);
  const [loading,setLoading] = useState(false);
  const [seletedServerHash, setSeletedServerHash] = useState<string>(window.electron.store.get('selectedServer') ?? '');
  const [servers, setServers] = useState<Array<JSON>>(
    Object.entries(window.electron.store.get(`servers`)).map((i) => {
      const [key, value] = i;
      value.key = key;
      return value;
    })
  );

  const handleSelectServer = (key: string) => {
    setSeletedServerHash(key);
    window.electron.store.set('selectedServer', key);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  useEffect(()=>{
    if(seletedServerHash !== ''){
      setLoading(true)
      window.v2rayService.stopService()
      window.v2rayService.startService(seletedServerHash)
      console.log('loading')
      setLoading(false)
    }
  },[seletedServerHash])

  const handleClose = (config: JSON) => {
    // console.log(config,'handleClose',typeof config,config.type)
    console.log(config, 'config');
    if (config?.type === 'click') {
      setOpen(false);
      return;
    }
    if (JSON.stringify(config) !== '{}') {
      config = { ...config, key: `server-${hash(config)}` };
      setServers([...servers, config]);
      setOpen(false);
    }
    console.log(servers);
  };

  const handleDeleteItem = (key) => {
    setServers(_.filter(servers, (i) => i.key !== key));
    const configJson = window.electron.store.get(`servers.${key}`);
    // delete configJson.key;
    console.log(configJson, 'configJson', key);
    const hashVal = hash(configJson);
    window.electron.store.delete(`servers.${key}`);
    window.electron.store.set(
      'serversHash',
      _.filter(window.electron.store.get('serversHash'), (i) => i !== key)
    );
    window.electron.store.set(
      'hashCheckList',
      _.filter(window.electron.store.get('hashCheckList'), (i) => i !== hashVal)
    );
    window.serverToFiles.deleteFile(key);
    console.log(key, 'key', hashVal);
    // setServers(servers.filter((i)=>i.key !== newServerHash));
  };
  const handleLoading = ()=>{
    setLoading(true);
  }

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
      <div className="flex flex-col items-center justify-center">
        {!servers.length ? (
          <></>
        ) : (
          servers.map(
            (i, idx) =>
              i && (
                <ServerItem
                  className={seletedServerHash === i.key ? 'bg-sky-200' : 'bg-white'}
                  serverName="New Server"
                  key={idx}
                  data={i}
                  onClick={(e) => {
                    e.preventDefault();
                    if (e.target === e.currentTarget) {
                      handleSelectServer(i.key);
                    }
                  }}
                  handleDelete={handleDeleteItem}
                ></ServerItem>
              )
          )
        )}
      </div>
      <div className="float-left ml-6">
        <Fab color="primary" aria-label="add" onClick={handleClickOpen}>
          <Add />
        </Fab>
      </div>
      <AddServerDialog open={open} onClose={handleClose} />
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
