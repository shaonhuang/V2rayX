import {
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import IosShareIcon from '@mui/icons-material/IosShare';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Storage, Share, MoreHoriz, Edit, Delete } from '@mui/icons-material';
import PopoverMenu from '@renderer/components/PopoverMenu';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Button from '@mui/material/Button';
import { throttle } from 'lodash';
import { useAppDispatch } from '@renderer/store/hooks';
import { setServiceRunningState } from '@renderer/store/serversPageSlice';

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

const Index = (props: any) => {
  const dispatch = useAppDispatch();
  const protocol = props.data.protocol.toUpperCase();
  const handleSelectServerStop = throttle((e: any) => {
    e.stopPropagation();
    window.v2rayService.stopService().then(() => {
      window.v2rayService.checkService().then((res) => {
        dispatch(setServiceRunningState(res));
      });
    });
  }, 1000);
  const handleSelectServerStart = throttle((e: any) => {
    e.stopPropagation();
    window.v2rayService.startService().then(() => {
      window.v2rayService.checkService().then((res) => {
        dispatch(setServiceRunningState(res));
      });
    });
  }, 1000);

  return (
    <Box
      className={`m-2 grid h-20 items-center rounded-xl ${props.className} border border-gray-50 shadow`}
      style={{ gridTemplateColumns: '0.5fr 2.5fr 1.5fr 0.5fr 1fr' }}
      onClick={props.onClick}
    >
      <div className="ml-3 mr-6 inline-flex h-12 w-12 items-center rounded-xl bg-purple-600">
        <Storage style={{}} className="m-auto" />
      </div>
      <Stack alignItems={'flex-start'}>
        <Typography variant="subtitle1" display="block">
          {props.serverName}
        </Typography>
        <Stack spacing={1} direction="row">
          <Chip color="info" style={{ height: '1rem' }} label={protocol} />
          {props.latency !== '' && (
            <Chip
              color={props.latency !== 'Timeout' ? 'success' : 'error'}
              style={{ height: '1rem' }}
              label={props.latency}
            />
          )}
        </Stack>
      </Stack>

      {
        // placeholder for data usage status
      }
      {props.isSeleted ? (
        <Chip
          classes={{ label: 'cursor-default' }}
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
      {props.isSeleted ? (
        <>
          {props.running ? (
            <Button onClick={handleSelectServerStop}>
              <StopIcon />
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                handleSelectServerStart(e);
              }}
            >
              <PlayArrowIcon />
            </Button>
          )}
        </>
      ) : (
        <div></div>
      )}

      <ThemeProvider theme={theme}>
        <Stack direction="row" spacing={1} justifyContent={'center'} alignItems={'center'} mx={2}>
          <PopoverMenu>
            <Share className="justify-self-center" fontSize="medium" />
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => props.handleQR(props.index, props.cIndex)}>
                  <ListItemIcon>
                    <ScreenShareIcon />
                  </ListItemIcon>
                  <ListItemText primary="Share QR Code" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    props.handleLink(props.index, props.cIndex);
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
                    props.handleEdit(props.index, props.cIndex);
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
                    props.handleDelete(props.index, props.cIndex);
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
        </Stack>
      </ThemeProvider>
    </Box>
  );
};

export default Index;
