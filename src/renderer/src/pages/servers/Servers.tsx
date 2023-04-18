import { useState } from 'react';
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
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Storage, Share, MoreHoriz, Add, Edit, Delete } from '@mui/icons-material';
import AddServerDialog from './components/AddServer';

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
const serverData = async () => {
  console.log(window.serverFiles);
  const data = await window.serverFiles.openFile();
  console.log(data);
  return data;
};

const Block = (props: any) => (
  <div className="h-20 w-52 rounded-xl" style={{ backgroundColor: 'white' }}>
    <p>{props.title}</p>
  </div>
);
const MoreOptionsList = () => (
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
      <ListItemButton component="a" href="#simple-list">
        <ListItemIcon>
          <Delete />
        </ListItemIcon>
        <ListItemText primary="Delete" />
      </ListItemButton>
    </ListItem>
  </List>
);
const ServerItem = (props: any) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  console.log(props, 'props')
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  const serverName = 'New Server';
  const protocol = props?.data?.onbounds?.protocol ?? 'Vmess';
  return (
    <div
      className="grid h-16 w-5/6 items-center rounded-xl"
      style={{ backgroundColor: 'white', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}
    >
      <span className="inline-flex items-center font-bold ">
        <div className="ml-3 mr-6 inline-flex h-12 w-12 items-center rounded-xl bg-purple-600">
          <Storage style={{}} className="m-auto" />
        </div>
        {serverName}
      </span>
      <span className="text-black-dim">{protocol}</span>
      <span className="text-black-dim">5M</span>
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
          <MoreOptionsList />
        </Popover>
      </ThemeProvider>
    </div>
  );
};

const Servers = () => {
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState(serverData());
  if (JSON.stringify(tmp) === '{}') {
    // setTmp(serverData());
  }

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <section className="">
      <div className="m-auto mb-12 flex w-max flex-row gap-8">
        <Block title="Network Speed"></Block>
        <Block title="Connection"></Block>
      </div>
      {/*
      <div>
        <Button>import from clipboard</Button>
        <Button>import from screen</Button>
      </div>
      */}
      <div className="flex flex-row justify-center">
        <ServerItem serverName="New Server" data={tmp}></ServerItem>
      </div>
      <div className="float-left ml-6">
        <Fab color="primary" aria-label="add" onClick={handleClickOpen}>
          <Add />
        </Fab>
      </div>
      <AddServerDialog open={open} onClose={handleClose} />
      <Button onClick={() => setTmp(serverData())}>test</Button>
    </section>
  );
};
export default Servers;
