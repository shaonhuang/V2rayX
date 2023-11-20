import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Button, IconButton } from '@mui/material';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { useAppSelector } from '@renderer/store/hooks';
import { find } from 'lodash';
import { Server, VmessObjConfiguration, EmptyObject } from '@renderer/constant/types';
import ContentPasteOffIcon from '@mui/icons-material/ContentPasteOff';
import { isMac } from '@renderer/constant';

const Index = (): JSX.Element => {
  const [server, setServer] = useState<VmessObjConfiguration | EmptyObject>({});
  const serverState = useAppSelector((state) => state.serversPage.servers);
  const currentServerId = useAppSelector((state) => state.serversPage.currentServerId);
  const [logs, setLogs] = useState<string[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [logType, setLogType] = useState<string>('access');
  const scrollWindow = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useLayoutEffect(() => {
    const server: Server | any = find(serverState, { id: currentServerId });
    // FIXME: type error
    // @ts-ignore
    window.v2rayService.checkService().then((res) => {
      setIsRunning(res);
    });
    setServer(server?.config);
  }, []);
  useEffect(() => {
    if (isRunning) {
      window.electron.electronAPI.ipcRenderer.on('logs:get', (_, data) => {
        setLogs([...data]);
        setDisplayedLogs([]);
      });
      const getLogs = () => {
        window.api.send('logs:get', logType === 'access' ? 'access.log' : 'error.log');
      };
      getLogs();
      const refresh = setInterval(() => {
        getLogs();
      }, 10000);
      return () => {
        clearInterval(refresh);
      };
    }
    return () => {};
  }, [logType, isRunning]);
  useEffect(() => {
    const delay = 600; // Delay between each log in milliseconds

    const displayLogs = () => {
      logs.forEach((log, index) => {
        setTimeout(() => {
          setDisplayedLogs((prevLogs) => [...prevLogs, log]);
        }, index * delay);
      });
    };

    displayLogs();
  }, [logs]);
  useEffect(() => {
    if (scrollWindow?.current) {
      scrollWindow.current.scrollTop = scrollWindow.current.scrollHeight;
    }
  }, [displayedLogs]);

  return (
    <section className="flew-row flex flex-1 items-center justify-around">
      <div
        className={`flex w-full flex-col rounded-xl px-8 py-4 ${
          isMac ? '' : 'bg-white dark:bg-slate-700'
        }`}
      >
        {isRunning && currentServerId ? (
          <div className="py-2">
            <div>
              <p>Log level: {server?.log.loglevel.toUpperCase()}</p>
              <p>
                Log file path: {server?.log[logType === 'access' ? 'access' : 'error']}
                <IconButton
                  color="primary"
                  className=""
                  onClick={() => {
                    window.electron.electronAPI.shell
                      .openPath(server?.log[logType === 'access' ? 'access' : 'error'])
                      .then(() => {
                        // File opened successfully
                        console.log('File opened');
                      })
                      .catch((error) => {
                        // Error occurred while opening the file
                        console.error(error);
                      });
                  }}
                  size="small"
                >
                  <FileOpenIcon className="" fontSize="medium" />
                </IconButton>
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4">
              <Button
                variant={logType === 'access' ? 'contained' : 'outlined'}
                onClick={() => setLogType('access')}
              >
                access log
              </Button>
              <Button
                variant={logType === 'error' ? 'contained' : 'outlined'}
                onClick={() => setLogType('error')}
              >
                error log
              </Button>
            </div>
          </div>
        ) : (
          <></>
        )}
        <div className="m-2">
          {displayedLogs.length >= 1 && currentServerId ? (
            <div>
              <hr />
              <div className="my-2 h-64 overflow-x-hidden overflow-y-scroll" ref={scrollWindow}>
                {displayedLogs.map((log, idx) => (
                  <p
                    key={idx}
                    className={`animate__animated animate__fadeInRight mx-4 my-2 rounded-lg px-4 py-2 ${
                      isMac ? '' : 'bg-slate-100 text-black'
                    }`}
                  >
                    {log}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-l">
              <ContentPasteOffIcon /> Log file is empty
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Index;
