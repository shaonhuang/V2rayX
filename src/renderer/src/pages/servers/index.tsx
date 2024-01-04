import { useEffect, useState } from 'react';
import {
  Box,
  Backdrop,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Stack,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  InputLabel,
  MenuItem,
  FormControl,
} from '@mui/material';

import CachedIcon from '@mui/icons-material/Cached';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { cloneDeep, findIndex, uniqBy, debounce } from 'lodash';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import {
  setServersState,
  setCurrentServerId,
  setSubscriptionList,
  readSubscriptionListAndServersGroupsFromDB,
} from '@store/serversPageSlice';
import ServerItem from './ServerItem';
import { Server } from '@renderer/constant/types';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AddLinkIcon from '@mui/icons-material/AddLink';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { VMess, VLess, Trojan } from '@renderer/utils/protocol/';
import { useTheme } from '@mui/material/styles';
import { Subscription, ServersGroup } from '@renderer/constant/types';

const actions = [
  { icon: <DriveFileRenameOutlineIcon />, name: 'Create From Boilerplate' },
  { icon: <QrCodeScannerIcon />, name: 'Scan QR Code From Screen (Upcoming)' },
  { icon: <AddLinkIcon />, name: 'Import From Clipboard' },
  { icon: <SubscriptionsIcon />, name: 'Manage Subscriptions' },
];

const LocalServersAndSubscriptionsServers = (props) => {
  const dispatch = useAppDispatch();
  const subscriptions = props.subscriptions || [];
  const serversGroupSet = [
    {
      remark: 'Local Servers',
      link: '',
      speedTestType: 'icmp',
      requestServers: props.localServers ?? [],
    },
    ...subscriptions,
  ];

  const runService = (idx: number, cmd: boolean) => {};

  // const [loadBalancing, setLoadBalancing] = useState<boolean>(false);
  const handleSpeedTypeChange = () => {};
  // useEffect(() => {
  //   console.log(foldStates);
  // }, [foldStates]);
  return (
    <Stack className="scroll-bar-none h-full overflow-y-scroll" spacing={2}>
      {/*<Paper>
          <Tooltip title="Delete">
            <Box>
              <Switch onChange={(e) => setLoadBalancing(e.target.checked)} />
              Load Balancing
              {loadBalancing ? (
                false ? (
                  <Button>
                    <PlayArrowIcon />
                  </Button>
                ) : (
                  <Button>
                    <StopIcon />
                  </Button>
                )
              ) : (
                <></>
              )}
            </Box>
          </Tooltip>
        </Paper>*/}
      {serversGroupSet.map((group, idx) => {
        return (
          <>
            {group.requestServers.length > 0 ? (
              <Accordion key={idx}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <Box sx={{ width: '100%', flexShrink: 0 }}>
                    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                      <Typography>{group.remark}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <FormControl
                          sx={{ m: 1, minWidth: 140 }}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <InputLabel id="demo-select-small-label">Latency Test Type</InputLabel>
                          <Select
                            labelId="demo-select-small-label"
                            id="demo-select-small"
                            value={group.speedTestType}
                            label="LatencyTestType"
                            disabled
                            onChange={handleSpeedTypeChange}
                          >
                            <MenuItem value={'icmp'}>ICMP</MenuItem>
                            <MenuItem value={'tcp'}>Tcp</MenuItem>
                            <MenuItem value={'connect'}>Connect</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            // setFoldStates(foldStates.with(idx, false));
                            const testLatencyGroup = cloneDeep(group);
                            Promise.all(
                              testLatencyGroup.requestServers.map(async (i) => {
                                // i.outbound
                                const protocol = i.outbound.protocol;
                                let host = '',
                                  port = '';
                                if (protocol === 'vmess' || protocol === 'vless') {
                                  host = i.outbound.settings.vnext[0].address;
                                  port = i.outbound.settings.vnext[0].port;
                                } else if (protocol === 'trojan') {
                                  host = i.outbound.settings.servers[0].address;
                                  port = i.outbound.settings.servers[0].port;
                                }
                                const res = await window.net.tcpPing({ host, port });
                                console.log(res);
                                i.latency = isNaN(res.result.ave)
                                  ? 'Timeout'
                                  : `${res.result.ave}ms`;
                                console.log(i);
                                return i;
                              }),
                            ).then((group) => {
                              if (idx === 0) {
                                dispatch(setServersState(group));
                              } else if (idx >= 1) {
                                const cloneSub = cloneDeep(serversGroupSet);
                                cloneSub[idx].requestServers = group;
                                cloneSub.shift();
                                dispatch(setSubscriptionList(cloneSub as []));
                              }
                            });
                          }}
                        >
                          <CachedIcon />
                        </IconButton>
                        <IconButton
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            props.handleCheckDeleteDialog(true, idx - 1);
                          }}
                        >
                          <DeleteForeverIcon />
                        </IconButton>
                      </Box>
                    </Stack>
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  className="scroll-bar-none"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflowY: 'scroll',
                  }}
                >
                  {group.requestServers.map(
                    (i, cIdx) =>
                      i && (
                        <ServerItem
                          className={
                            props.selectedId.includes(i.id)
                              ? 'bg-sky-200/70 dark:bg-sky-700/70'
                              : 'bg-white/80 dark:bg-slate-500/50'
                          }
                          serverName={i.ps}
                          isSeleted={props.selectedId.includes(i.id)}
                          key={cIdx}
                          cIndex={cIdx}
                          index={idx}
                          running={props.running}
                          latency={i.latency}
                          data={i.outbound}
                          server={i}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              localStorage.setItem('share-qrcode-link', i.link);
                              props.handleSelectServer(i.id);
                            }
                          }}
                          handleServiceStatus={runService}
                          handleQR={props.handleQRItem}
                          handleLink={props.handleLinkItem}
                          handleDelete={props.handleDeleteItem}
                          handleEdit={props.handleEditItem}
                        ></ServerItem>
                      ),
                  )}
                </AccordionDetails>
              </Accordion>
            ) : (
              <></>
            )}
          </>
        );
      })}
    </Stack>
  );
};

const Index = (): JSX.Element => {
  const [running, setRunning] = useState(false);
  const [cacheSelectedId, setCacheSeletedId] = useState<string[]>([]);
  const subscriptionList: Subscription[] = useAppSelector(
    (state) => state.serversPage.subscriptionList,
  );
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [checkDeleteDialog, setCheckDeleteDialog] = useState(false);
  const [deleteItemIdx, setDeleteItemIdx] = useState(1);
  const serversState = useAppSelector((state) => state.serversPage.servers);
  const currentServerId: Array<string> = useAppSelector(
    (state) => state.serversPage.currentServerId,
  );
  const serviceRunningState = useAppSelector((state) => state.serversPage.serviceRunningState);
  //   const [foldStates, setFoldStates] = useState<boolean[]>([
  //   true,
  //   ...Array(subscriptionList.length).fill(false),
  // ]);
  // const [subscriptionsServers, SetSubscriptionsServers] = useState(() => linkToServerObj(example));
  const dispatch = useAppDispatch();

  const [openBackdrop, setOpenBackDrop] = useState(false);

  useEffect(() => {
    console.log('subscriptionList', subscriptionList);
  }, [subscriptionList]);

  const handleSelectServer = (id: string) => {
    if (cacheSelectedId.includes(id)) {
      // dispatch(setCurrentServerId(currentServerId.filter((i) => i !== id)));
      // setCacheSeletedId(cacheSelectedId.filter((i) => i !== id));
    } else {
      // dispatch(setCurrentServerId([...currentServerId, id]));
      // setCacheSeletedId([...cacheSelectedId, id]);
    }
    setCacheSeletedId([id]);
    window.v2rayService.stopService();
  };

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
        const saveItem = {
          id: window.electron.electronAPI.hash(factory.getOutbound()),
          link,
          ps: factory.getPs(),
          latency: '',
          outbound: factory.getOutbound(),
        };

        dispatch(setServersState(uniqBy([...serversState, saveItem], 'id')));

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
  const handleQRItem = (idx: number, cIdx: number) => {
    localStorage.setItem(
      'share-qrcode-link',
      (idx > 0 ? subscriptionList[idx - 1].requestServers[cIdx] : serversState[cIdx]).link,
    );
    window.win.create('/share/qrcode', {
      width: 420,
      height: 420,
      show: true,
    });
  };
  const handleLinkItem = (idx: number, cIdx: number) => {
    window.clipboard.paste(
      (idx > 0 ? subscriptionList[idx - 1].requestServers[cIdx] : serversState[cIdx]).link,
    );
  };

  const handleDeleteItem = (idx: number) => {
    const newServers = cloneDeep(serversState);
    newServers.splice(idx, 1);
    if (cacheSelectedId.includes(serversState[idx].id)) {
      window.v2rayService.stopService();
      // dispatch(setCurrentServerId(currentServerId.filter((i) => i !== serversState[idx].id)));
      setCacheSeletedId(cacheSelectedId);
    }
    dispatch(setServersState(newServers));
    newServers.length === 0 && window.api.send('v2rayx:service:empty');
    // to refrsh tray icon menu
    window.api.send('v2rayx:service:selected');
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
  const handleEditItem = (server: Server) => {
    localStorage.setItem('editObj', JSON.stringify(server));
    localStorage.setItem('editIdx', server.id);
    localStorage.setItem('serverAddOrEdit', 'edit');
    window.win.create(
      `/servers/edit/${server.id}`,
      {
        title: 'Server Configuration',
        width: 800,
        height: 600,
        show: true,
      },
      { parentName: 'mainWindow', modalStatus: true },
    );
  };

  useEffect(() => {
    window.api.receive('v2ray:status', (status: boolean) => {
      setRunning(status);
    });
    window.api.receive('v2rayx:server:add/edit:fromMain', (server: Server) => {
      const newServersState = cloneDeep(serversState);
      const newServersList = cloneDeep(subscriptionList);
      const idxOfItem = { id: localStorage.getItem('editIdx') ?? '' };
      const serversGroup = [
        {
          remark: 'Local Servers',
          link: '',
          speedTestType: 'icmp',
          requestServers: newServersState ?? [],
        },
        ...newServersList,
      ];
      const serverAddOrEdit = localStorage.getItem('serverAddOrEdit');
      if (serverAddOrEdit === 'edit' && idxOfItem.id !== '') {
        // stop previous proxy service if it's running
        // findIndex(newServers, { id: currentServerId }) > -1 &&
        window.v2rayService.stopService();
        // newServers.splice(idxOfItem, 1, serverItem);
        // dispatch(setServersState(uniqBy(newServersState, 'id')));
        const editWhichGroup = -1;
        serversGroup.forEach((i, idx) => {
          const checkIndex = findIndex(i.requestServers, idxOfItem);
          if (checkIndex > -1) {
            if (idx === 0) {
              newServersState.splice(checkIndex, 1, server);
              dispatch(setServersState(uniqBy(newServersState, 'id')));
            } else {
              newServersList[idx - 1].requestServers.splice(checkIndex, 1, server);
              dispatch(setSubscriptionList(newServersList as []));
            }
            console.log(idx, 'group');
          }
        });
      } else {
        newServersState.push(server);
        dispatch(setServersState(uniqBy(newServersState, 'id')));
      }

      // to refrsh tray icon menu
      window.api.send('v2rayx:service:selected');
    });

    window.api.receive('v2rayx:server:subscription:update:fromMain', async () => {
      const subscriptionList: Subscription[] = await window.db.read('subscriptionList');
      const serversGroups: ServersGroup[] = await window.db.read('serversGroups');
      dispatch(
        readSubscriptionListAndServersGroupsFromDB({
          subscriptionList,
          serversGroups,
        }),
      );
    });

    // FIXME: type error
    // @ts-ignore
    window.v2rayService.checkService().then((res) => setRunning(res));
    setRunning(serviceRunningState);
    setCacheSeletedId(currentServerId);
  }, []);

  useEffect(() => {
    setRunning(serviceRunningState);
  }, [serviceRunningState]);

  useEffect(
    debounce(() => {
      if (cacheSelectedId.length > 0) {
        dispatch(setCurrentServerId(cacheSelectedId));
        // to refrsh tray icon menu
        window.api.send('v2rayx:service:selected');
      }
    }, 500),
    [cacheSelectedId],
  );

  return (
    <section
      className={
        'scroll-bar-none flex h-4/5 flex-1 flex-col items-center justify-center overflow-y-scroll'
      }
    >
      <div className="mb-12 flex w-max flex-row gap-8">
        {/*
        <Block title="Network Speed"></Block>
        <Block title="Connection"></Block>
        */}
      </div>
      <Stack className="scroll-bar-none h-full w-full overflow-y-scroll">
        <LocalServersAndSubscriptionsServers
          localServers={serversState}
          subscriptions={subscriptionList}
          selectedId={cacheSelectedId}
          running={running}
          handleQRItem={handleQRItem}
          handleLinkItem={handleLinkItem}
          handleDeleteItem={handleDeleteItem}
          handleEditItem={handleEditItem}
          handleSelectServer={handleSelectServer}
          handleCheckDeleteDialog={(v, idx) => {
            setCheckDeleteDialog(v);
            setDeleteItemIdx(idx);
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
              const list = [...subscriptionList];
              list.splice(deleteItemIdx, 1);
              console.log(list, 'list');
              dispatch(setSubscriptionList(list));
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
