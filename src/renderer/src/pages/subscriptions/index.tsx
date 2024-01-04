import { useEffect, useState, forwardRef } from 'react';
import { Stack, Button, IconButton, Container, TextField, Box, lighten } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import CreateIcon from '@mui/icons-material/Create';
import UpdateIcon from '@mui/icons-material/Update';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { findIndex } from 'lodash';
import { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
} from 'material-react-table';
import { useAppDispatch, useAppSelector } from '@renderer/store/hooks';
import { setSubscriptionList } from '@renderer/store/serversPageSlice';
import { Buffer } from 'buffer';
import { decode } from 'js-base64';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import { VMess, VLess, Trojan } from '@renderer/utils/protocol/';
import { find } from 'lodash';
import { ServersGroup, Subscription } from '@renderer/constant/types';

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Index = () => {
  const dispatch = useAppDispatch();
  const subscriptionList = useAppSelector((state) => state.serversPage.subscriptionList);

  const [formData, setFormData] = useState<Subscription>({
    remark: '',
    link: '',
  });

  const [notice, setNotice] = useState({
    status: false,
    type: 'success',
    message: '',
  });

  const [tableData, setTableData] = useState<Subscription[]>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  useEffect(() => {
    setTableData(subscriptionList);
  }, [subscriptionList]);
  const columns = useMemo<MRT_ColumnDef<Subscription>[]>(
    () => [
      {
        accessorKey: 'remark',
        header: 'Remark',
      },
      {
        accessorKey: 'link',
        header: 'Subscription Links',
      },
    ],
    [],
  );

  const getSubscribeServersLink = async (url: string) => {
    let linkArr: string[] = [];
    return window.net.request(url).then((res) => {
      linkArr = decode(Buffer.from(res).toString('utf8')).split('\n');
      linkArr[linkArr.length - 1] === '' && linkArr.pop();
      console.log(linkArr);
      return linkArr;
    });
  };
  const handleSubscriptionLinkRequest = async () => {
    try {
      const groups: ServersGroup[] = [];
      Promise.all(
        Object.entries(rowSelection).map(async ([key, isSelected]) => {
          if (isSelected) {
            const selectItem = find(subscriptionList, { remark: key })!;
            const serversGroup: ServersGroup = {
              groupId: '',
              group: selectItem.remark,
              link: selectItem.link,
              speedTestType: 'icmp',
              subServers: [],
            };
            // TODO: fix type error of subServers
            serversGroup.subServers = (await getSubscribeServersLink(serversGroup.link))
              .map((link) => {
                const protocol = link.includes('vmess')
                  ? 'vmess'
                  : link.includes('vless')
                    ? 'vless'
                    : link.includes('trojan')
                      ? 'trojan'
                      : null;
                if (!protocol)
                  return {
                    link,
                    error: 'parse protocol error',
                  };
                const protocolObj =
                  protocol === 'vmess'
                    ? new VMess(link || {})
                    : protocol === 'vless'
                      ? new VLess(link || {})
                      : new Trojan(link || {});
                return {
                  id: window.electron.electronAPI.hash(protocolObj.getOutbound()),
                  link,
                  ps: protocolObj.getPs(),
                  speedTestType: 'icmp',
                  group: serversGroup.group,
                  groupId: window.electron.electronAPI.hash.MD5(serversGroup.group),
                  latency: '',
                  outbound: protocolObj.getOutbound(),
                };
              })
              .filter((i) => {
                if (i.error !== undefined) {
                  console.error(i.link, i.error);
                  return false;
                }
                return true;
              }) as [];
            groups.push(serversGroup);
          }
        }),
      ).then(() => {
        console.log(groups);
        setNotice({
          status: true,
          message: 'Updating Subscription Servers have been successfully ',
          type: 'success',
        });
        window.api.send('v2rayx:server:subscription:update:toMain', {
          subscriptionList,
          serversGroup: groups,
        });
      });
    } catch (err) {
      setNotice({
        status: true,
        message: 'Updating Subscription Servers have error',
        type: 'error',
      });
      console.error(err);
    }
  };

  const handleNoticeClose = (_: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setNotice({ ...notice, status: false });
  };

  const table = useMaterialReactTable({
    enableRowSelection: true,
    enableColumnActions: false,
    enableFullScreenToggle: false,
    enableHiding: false,
    enableFilters: false,
    enableSorting: false,
    enableBottomToolbar: false,
    enableStickyHeader: true,
    rowPinningDisplayMode: 'select-sticky',
    columns,
    data: tableData,
    muiTableContainerProps: { sx: { maxHeight: '300px' } },
    getRowId: (row) => row.remark,
    muiTableBodyRowProps: ({ row }) => ({
      //implement row selection click events manually
      onClick: () =>
        setRowSelection((prev) => ({
          ...prev,
          [row.id]: !prev[row.id],
        })),
      selected: rowSelection[row.id],
      sx: {
        cursor: 'pointer',
      },
    }),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    renderTopToolbar: ({ table }) => {
      const handleDelete = () => {
        const shouldDelete: string[] = [];
        table.getSelectedRowModel().flatRows.map((row) => {
          shouldDelete.push(row.getValue('remark'));
        });
        setTableData(tableData.filter((item: Subscription) => !shouldDelete.includes(item.remark)));
      };

      return (
        <Box
          sx={(theme) => ({
            backgroundColor: lighten(theme.palette.background.default, 0.05),
            display: 'flex',
            gap: '0.5rem',
            p: '8px',
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
          })}
        >
          <Box>
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                color="error"
                disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
                onClick={handleDelete}
                variant="contained"
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Box>
      );
    },
  });
  return (
    <Container
      maxWidth="sm"
      className="overflow-x-hidden overflow-y-scroll rounded-2xl bg-sky-600/30 py-4 pb-8"
    >
      <IconButton sx={{ position: 'fixed', top: 32, left: 16 }} onClick={() => close()}>
        <CloseIcon />
      </IconButton>
      <Stack sx={{ width: '100%' }}>
        <Stack>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
            <LinkIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
            <TextField
              fullWidth
              label="Url"
              variant="standard"
              required
              value={formData.link}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, link: e.target.value })
              }
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <CreateIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
            <TextField
              label="Alias"
              variant="standard"
              required
              value={formData.remark}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, remark: e.target.value })
              }
            />
            <Box>
              <Button
                onClick={() => setTableData([...tableData, formData])}
                disabled={
                  findIndex(tableData, { remark: formData.remark }) > -1 ||
                  !formData.remark ||
                  !formData.link
                }
                startIcon={<PlaylistAddIcon />}
              >
                Add
              </Button>
            </Box>
          </Box>
        </Stack>
        <MaterialReactTable table={table} />
        <Button
          component="label"
          variant="contained"
          startIcon={<UpdateIcon />}
          onClick={() => handleSubscriptionLinkRequest()}
        >
          Update Servers
        </Button>
      </Stack>
      <Snackbar open={notice.status} autoHideDuration={4000} onClose={handleNoticeClose}>
        <Alert
          onClose={handleNoticeClose}
          severity={notice.type as AlertColor}
          sx={{ width: '100%' }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Index;
