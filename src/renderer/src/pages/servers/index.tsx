import { useState } from 'react';
import {
  Box,
  Backdrop,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Stack,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
} from '@mui/material';
import { uniqBy, findIndex, cloneDeep } from 'lodash';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setServersGroups } from '@store/serversPageSlice';
import { Subscription } from '@renderer/constant/types';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AddLinkIcon from '@mui/icons-material/AddLink';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { VMess, VLess, Trojan } from '@renderer/utils/protocol';
import { useTheme } from '@mui/material/styles';
import FoldList from './components/FoldList';
import { Server, ServersGroup } from '@renderer/constant/types';

const actions = [
  { icon: <DriveFileRenameOutlineIcon />, name: 'Create From Boilerplate' },
  { icon: <QrCodeScannerIcon />, name: 'Scan QR Code From Screen (Upcoming)' },
  { icon: <AddLinkIcon />, name: 'Import From Clipboard' },
  { icon: <SubscriptionsIcon />, name: 'Manage Subscriptions' },
];

const Index = (): JSX.Element => {
  let deleteItemGroupId = '';
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const serversGroups = useAppSelector((state) => state.serversPage.serversGroups);
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [checkDeleteDialog, setCheckDeleteDialog] = useState(false);
  const [openBackdrop, setOpenBackDrop] = useState(false);

  const handleManageSubscription = () => {
    window.win.create(
      '/manage/subscription',
      {
        title: 'Subscription Management',
        width: 800,
        height: 600,
        show: true,
      },
      {
        parentName: 'mainWindow',
        modalStatus: true,
      },
    );
  };

  const handleImportFrom = (type: string) => {
    if (type === 'clipboard') {
      window.clipboard.read().then((link: string) => {
        const factory = link.includes('vmess://')
          ? new VMess(link)
          : link.includes('vless://')
            ? new VLess(link)
            : link.includes('trojan://')
              ? new Trojan(link)
              : null;
        if (!factory) {
          window.notification.send({
            title: 'Import From Clipboard',
            body: 'Import Server Failed',
            silent: false,
          });
          return;
        }
        const saveItem: Server = {
          id: window.electron.electronAPI.hash(factory.getOutbound()),
          link,
          ps: factory.getPs(),
          latency: '',
          speedTestType: '',
          group: 'localservers',
          groupId: window.electron.electronAPI.hash('localservers', {
            algorithm: 'md5',
          }),
          outbound: factory.getOutbound(),
        };
        let newServersGroups: ServersGroup[] =
          serversGroups.length > 0
            ? cloneDeep(serversGroups)
            : [
                {
                  group: 'localservers',
                  groupId: window.electron.electronAPI.hash('localservers', { algorithm: 'md5' }),
                  remark: 'Local Servers',
                  link: '',
                  speedTestType: 'icmp',
                  subServers: [saveItem],
                },
              ];
        // sort serversGroups make localservers group frist
        let idxOfLocalServersItem = findIndex(newServersGroups, { group: 'localservers' });
        if (idxOfLocalServersItem > -1) {
          newServersGroups = [
            newServersGroups[idxOfLocalServersItem],
            ...newServersGroups.filter((i) => i.group !== 'localservers'),
          ];
        } else {
          newServersGroups = [
            {
              group: 'localservers',
              groupId: window.electron.electronAPI.hash('localservers', { algorithm: 'md5' }),
              remark: 'Local Servers',
              link: '',
              speedTestType: 'icmp',
              subServers: [saveItem],
            },
            ...newServersGroups,
          ];
          idxOfLocalServersItem = 0;
        }
        if (idxOfLocalServersItem > -1) newServersGroups[0].subServers.push(saveItem);
        newServersGroups = newServersGroups.map((i) => {
          const subServers = uniqBy(i.subServers, 'id');
          i.subServers = subServers;
          return i;
        });
        dispatch(setServersGroups(newServersGroups));

        window.notification.send({
          title: 'Import From Clipboard',
          body: 'Import Server Success',
          silent: false,
        });
      });
      return;
    }
    if (type === 'screen') {
      window.app.getQRcodeFromScreenResources();
      return;
    }
    window.win.create(
      '/servers/import',
      {
        width: 800,
        height: 600,
        show: true,
      },
      {
        parentName: 'mainWindow',
        modalStatus: true,
      },
    );
  };

  const handleAddOpen = () => {
    window.win.create(
      '/servers/add',
      {
        title: 'Server Configuration',
        width: 800,
        height: 600,
        show: true,
      },
      { parentName: 'mainWindow', modalStatus: true },
    );
    localStorage.setItem('serverAddOrEdit', 'add');
  };

  return (
    <section
      className={
        'scroll-bar-none mt-[-12px] flex h-4/5 flex-1 flex-col items-center justify-center overflow-y-scroll'
      }
    >
      <div className="mb-12 flex w-max flex-row gap-8">
        {/*
        <Block title="Network Speed"></Block>
        <Block title="Connection"></Block>
        */}
      </div>
      <Stack className="scroll-bar-none h-full w-full overflow-y-scroll">
        <FoldList
          handleCheckDeleteDialog={(v, groudId) => {
            setCheckDeleteDialog(v);
            deleteItemGroupId = groudId;
          }}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Backdrop open={openBackdrop} />
          <SpeedDial
            ariaLabel="SpeedDial tooltip"
            icon={<SpeedDialIcon />}
            sx={{ position: 'fixed', bottom: 66 }}
            onClose={() => setOpenBackDrop(false)}
            onOpen={() => setOpenBackDrop(true)}
            open={openBackdrop}
          >
            {actions.map((action) => (
              <SpeedDialAction
                classes={{ staticTooltipLabel: 'w-max cursor-pointer' }}
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                tooltipOpen
                tooltipPlacement="right"
                onClick={() => {
                  setOpenBackDrop(false);
                  switch (action.name) {
                    case 'Create From Boilerplate':
                      handleAddOpen();
                      break;
                    case 'Scan QR Code From Screen':
                      handleImportFrom('screen');
                      break;
                    case 'Import From Clipboard':
                      handleImportFrom('clipboard');
                      break;
                    case 'Manage Subscriptions':
                      handleManageSubscription();
                      break;
                    default:
                      break;
                  }
                }}
              />
            ))}
          </SpeedDial>
        </Box>
      </Stack>
      <Dialog
        fullScreen={fullScreen}
        open={checkDeleteDialog}
        onClose={() => setCheckDeleteDialog(false)}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">{'Delete subscription item?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure delete this subscription? It would also delete subscription item in
            subscription page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setCheckDeleteDialog(false)}>
            Keep it
          </Button>
          <Button
            onClick={() => {
              const newServersGroup = [...serversGroups];
              newServersGroup.splice(findIndex(newServersGroup, { groupId: deleteItemGroupId }), 1);
              dispatch(setServersGroups(newServersGroup));
              setCheckDeleteDialog(false);
            }}
            autoFocus
          >
            Delete it
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};
export default Index;
