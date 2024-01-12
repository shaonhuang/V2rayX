import { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  IconButton,
  Accordion,
  Typography,
  InputLabel,
  MenuItem,
  FormControl,
} from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { cloneDeep, debounce, findIndex, uniqBy } from 'lodash';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setServersGroups,
  setCurrentServerId,
  syncServersGroupsFromDB,
  syncFetchedSubscriptionServersFromDB,
  setServiceRunningState,
} from '@store/serversPageSlice';
import ServerItem from './ServerItem';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { ServersGroup } from '@renderer/constant/types';
import { Server } from '@renderer/constant/types';

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  /* backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)', */
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const Index = (props) => {
  const dispatch = useAppDispatch();
  const serversGroups = useAppSelector((state) => state.serversPage.serversGroups);
  const serviceRunningState = useAppSelector((state) => state.serversPage.serviceRunningState);
  const currentServerId = useAppSelector((state) => state.serversPage.currentServerId);
  const [foldList, setFoldList] = useState<boolean[]>(Array(100).fill(false));

  useEffect(() => {
    window.api.receive('v2ray:status', (status: boolean) => {
      dispatch(setServiceRunningState(status));
    });
    window.api.receive('v2rayx:server:add/edit:fromMain', async (server: Server) => {
      const serversGroups = await window.db.read('serversGroups');
      syncServersGroupsFromDB(serversGroups);
      const serverAddOrEdit = localStorage.getItem('serverAddOrEdit');
      if (serverAddOrEdit === 'edit') {
        // stop previous proxy service if it's running
        window.v2rayService.stopService();
        const groupId = server.groupId;
        const idxOfGroup = findIndex(serversGroups, { groupId });
        const idxOfSubServer = findIndex(serversGroups[idxOfGroup].subServers, {
          id: localStorage.getItem('previousEditId'),
        });
        serversGroups[idxOfGroup].subServers[idxOfSubServer] = server;
        dispatch(setServersGroups(serversGroups));
      } else {
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
                  subServers: [server],
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
              subServers: [server],
            },
            ...newServersGroups,
          ];
          idxOfLocalServersItem = 0;
        }
        if (idxOfLocalServersItem > -1) newServersGroups[0].subServers.push(server);
        newServersGroups = newServersGroups.map((i) => {
          const subServers = uniqBy(i.subServers, 'id');
          i.subServers = subServers;
          return i;
        });
        dispatch(setServersGroups(newServersGroups));
      }

      // to refrsh tray icon menu
      window.api.send('v2rayx:service:selected');
    });

    window.api.receive('v2rayx:server:subscription:update:fromMain', async () => {
      const serversGroups = await window.db.read('serversGroups');
      syncFetchedSubscriptionServersFromDB(serversGroups);
      // sort serversGroups make localservers group frist
      const idxOfLocalServersItem = findIndex(serversGroups, { group: 'localservers' });
      const newServersGroups =
        idxOfLocalServersItem > -1
          ? [
              serversGroups[idxOfLocalServersItem],
              ...serversGroups.filter((i) => i.group !== 'localservers'),
            ]
          : serversGroups;
      dispatch(setServersGroups(newServersGroups));
    });
    window.v2rayService.checkService().then((res) => dispatch(setServiceRunningState(res)));
  }, []);

  useEffect(() => {
    if (currentServerId.length > 0 && serversGroups.length > 0) {
      setFoldList(
        serversGroups.map((group) => {
          if (findIndex(group.subServers, { id: currentServerId[0] }) > -1) {
            return true;
          }
          return false;
        }),
      );
    }
  }, [serversGroups]);

  useEffect(
    debounce(() => {
      if (currentServerId.length > 0) {
        // to refrsh tray icon menu
        window.api.send('v2rayx:service:selected');
      }
    }, 200),
    [currentServerId],
  );

  const handleSpeedTypeChange = () => {};

  const handleSelectServer = (id: string) => {
    if (currentServerId.includes(id)) {
      dispatch(setCurrentServerId(currentServerId.filter((i) => i !== id)));
    } else {
      dispatch(setCurrentServerId([id]));
    }
    window.v2rayService.stopService().then(() => {
      window.v2rayService.checkService().then((res) => dispatch(setServiceRunningState(res)));
    });
  };
  const handleEditItem = (groupIdx: string, subServerIdx: string) => {
    localStorage.setItem(
      'editObj',
      JSON.stringify(serversGroups[groupIdx].subServers[subServerIdx]),
    );
    localStorage.setItem('serverAddOrEdit', 'edit');
    window.win.create(
      `/servers/edit/groupId=${groupIdx}&id=${subServerIdx}`,
      {
        title: 'Server Configuration',
        width: 800,
        height: 600,
        show: true,
      },
      { parentName: 'mainWindow', modalStatus: true },
    );
  };
  const handleDeleteItem = (idx: number, cIdx: number) => {
    if (currentServerId.includes(serversGroups[idx].subServers[cIdx].id)) {
      window.v2rayService.stopService();
      dispatch(
        setCurrentServerId(
          currentServerId.filter((i) => i !== serversGroups[idx].subServers[cIdx].id),
        ),
      );
    }
    const newServersGroups = cloneDeep(serversGroups);
    newServersGroups[idx].subServers.splice(cIdx, 1);
    dispatch(setServersGroups(cloneDeep(newServersGroups.filter((i) => i.subServers.length > 0))));
    serversGroups.length === 0 && window.api.send('v2rayx:service:empty');
    // to refrsh tray icon menu
    window.api.send('v2rayx:service:selected');
  };
  const handleLinkItem = (idx: number, cIdx: number) => {
    window.clipboard.paste(serversGroups[idx].subServers[cIdx].link);
    window.notification.send({
      title: 'Clipboard',
      body: `link has pasted to your clipboard: ${serversGroups[idx].subServers[cIdx].link}`,
      silent: false,
    });
  };
  const handleQRItem = (idx: number, cIdx: number) => {
    localStorage.setItem('share-qrcode-link', serversGroups[idx].subServers[cIdx].link);
    window.win.create('/share/qrcode', {
      width: 420,
      height: 420,
      show: true,
    });
  };

  return (
    <Stack className="scroll-bar-none h-full overflow-y-scroll" spacing={2} pb={4}>
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
      {serversGroups.map((group, idx) => {
        return (
          <Box key={idx} className="px-2">
            {group.subServers.length > 0 ? (
              <Accordion
                expanded={foldList[idx]}
                onChange={(event: React.SyntheticEvent, expanded: boolean) => {
                  setFoldList(foldList.with(idx, expanded));
                }}
              >
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
                            const testLatencyGroup = cloneDeep(group);
                            Promise.all(
                              testLatencyGroup.subServers.map(async (i) => {
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
                                i.latency = isNaN(res.result.ave)
                                  ? 'Timeout'
                                  : `${res.result.ave}ms`;
                                return i;
                              }),
                            ).then((group) => {
                              const cloneSub = cloneDeep(serversGroups);
                              cloneSub[idx].subServers = group;
                              dispatch(setServersGroups(cloneSub));
                            });
                          }}
                        >
                          <CachedIcon />
                        </IconButton>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            props.handleCheckDeleteDialog(true, serversGroups[idx].groupId);
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
                  {group.subServers.map(
                    (i, cIdx) =>
                      i && (
                        <ServerItem
                          className={
                            currentServerId.includes(i.id)
                              ? 'bg-sky-200/70 dark:bg-sky-700/70'
                              : 'bg-white/80 dark:bg-slate-500/50'
                          }
                          serverName={i.ps}
                          isSeleted={currentServerId.includes(i.id)}
                          key={cIdx}
                          cIndex={cIdx}
                          index={idx}
                          running={serviceRunningState}
                          latency={i.latency}
                          data={i.outbound}
                          server={i}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              localStorage.setItem('share-qrcode-link', i.link);
                              handleSelectServer(i.id);
                            }
                          }}
                          handleQR={handleQRItem}
                          handleLink={handleLinkItem}
                          handleDelete={handleDeleteItem}
                          handleEdit={handleEditItem}
                        />
                      ),
                  )}
                </AccordionDetails>
              </Accordion>
            ) : (
              <></>
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

export default Index;
