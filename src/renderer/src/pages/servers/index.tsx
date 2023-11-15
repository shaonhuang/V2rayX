import { useEffect, useState } from 'react';
import { Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import { cloneDeep, findIndex, uniqBy } from 'lodash';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setServersState, setCurrentServerId } from '@store/serversPageSlice';
import ServerItem from './ServerItem';
import store from '@store/index';
import { isMac } from '@renderer/constant';

const Index = (): JSX.Element => {
  const [running, setRunning] = useState(false);
  const serversState = useAppSelector((state) => state.serversPage.servers);
  const currentServerId = useAppSelector((state) => state.serversPage.currentServerId);
  const serviceRunningState = useAppSelector((state) => state.serversPage.serviceRunningState);
  const dispatch = useAppDispatch();

  const handleSelectServer = (id: string) => {
    dispatch(setCurrentServerId(id));
    window.v2rayService.stopService();
    // to refrsh tray icon menu
    window.api.send('v2rayx:service:selected');
  };

  const handleQRItem = () => {};
  const handleLinkItem = (idx: number) => {
    window.clipboard.paste(serversState[idx]?.link);
  };

  const handleDeleteItem = (idx: number) => {
    const newServers = cloneDeep(serversState);
    newServers.splice(idx, 1);
    if (currentServerId === serversState[idx].id) {
      window.v2rayService.stopService();
      dispatch(setCurrentServerId(''));
    }
    dispatch(setServersState(newServers));
    newServers.length === 0 && window.api.send('v2rayx:service:empty');
    // to refrsh tray icon menu
    window.api.send('v2rayx:service:selected');
  };

  const handleAddOpen = () => {
    window.win.create('/servers/add');
    localStorage.setItem('serverAddOrEdit', 'add');
  };
  const handleEditItem = (idx: number) => {
    localStorage.setItem('editObj', JSON.stringify(serversState[idx]));
    localStorage.setItem('editIdx', idx.toString());
    localStorage.setItem('serverAddOrEdit', 'edit');
    window.win.create(`/servers/edit/${idx}`);
  };

  const runService = (idx: number, cmd: boolean) => {};

  useEffect(() => {
    window.api.receive('v2ray:status', (status: boolean) => {
      setRunning(status);
    });
    window.api.receive('v2rayx:server:add/edit:fromMain', (serverItem) => {
      const newServers = cloneDeep(store.getState().serversPage.servers);
      const idxOfItem = parseInt(localStorage.getItem('editIdx') ?? '-1');
      const serverAddOrEdit = localStorage.getItem('serverAddOrEdit');
      if (serverAddOrEdit === 'edit' && idxOfItem > -1) {
        // stop previous proxy service if it's running
        findIndex(newServers, { id: currentServerId }) > -1 && window.v2rayService.stopService();
        newServers.splice(idxOfItem, 1, serverItem);
      } else {
        newServers.push(serverItem);
      }

      dispatch(setServersState(uniqBy(newServers, 'id')));
      // to refrsh tray icon menu
      window.api.send('v2rayx:service:selected');
    });

    // FIXME: type error
    // @ts-ignore
    window.v2rayService.checkService().then((res) => setRunning(res));
  }, []);

  return (
    <section
      className={`flex h-4/5 flex-1 flex-col items-center justify-center overflow-y-scroll ${
        isMac ? '' : 'scroll-bar-none'
      }`}
    >
      <div className="mb-12 flex w-max flex-row gap-8">
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
      <div className="w-full">
        <div className="flex flex-col items-center justify-center text-black dark:text-white">
          {!serversState.length ? (
            <></>
          ) : (
            serversState.map(
              (i, idx) =>
                i && (
                  <ServerItem
                    className={
                      currentServerId === i.id
                        ? 'bg-sky-200/70 dark:bg-sky-700/70'
                        : 'bg-white/50 dark:bg-slate-500/50'
                    }
                    serverName={i.ps}
                    isSeleted={currentServerId === i.id}
                    key={idx}
                    index={idx}
                    running={running}
                    data={i.config}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        handleSelectServer(i.id);
                      }
                    }}
                    handleServiceStatus={runService}
                    handleQR={handleQRItem}
                    handleLink={handleLinkItem}
                    handleDelete={handleDeleteItem}
                    handleEdit={handleEditItem}
                  ></ServerItem>
                ),
            )
          )}
        </div>
        <div className="fixed top-2/3 float-left ml-6">
          <Fab color="primary" aria-label="add" onClick={handleAddOpen}>
            <Add />
          </Fab>
        </div>
      </div>
    </section>
  );
};
export default Index;
