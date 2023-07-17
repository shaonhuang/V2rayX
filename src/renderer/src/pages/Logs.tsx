import { useState, useEffect, useRef } from 'react';
import { cloneDeep } from 'lodash';
import { Button, IconButton } from '@mui/material';
import FileOpenIcon from '@mui/icons-material/FileOpen';

const Index = (): JSX.Element => {
  const [logs, setLogs] = useState<string[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [logType, setLogType] = useState<string>('access');
  const scrollWindow = useRef<HTMLDivElement>(null);
  const server = window.electron.store.get('servers')[window.electron.store.get('selectedServer')];
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    window.v2rayService.checkService().then((res) => {
      setIsRunning(res);
    });
  }, []);
  useEffect(() => {
    if (isRunning) {
      const getLogs = () => {
        window.electron.electronAPI.ipcRenderer.send(
          'logs:get',
          logType === 'access' ? 'access.log' : 'error.log'
        );
        window.electron.electronAPI.ipcRenderer.on('logs:get', (event, data) => {
          setLogs([...data]);
          setDisplayedLogs([]);
        });
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
    <section className="flew-row flex items-center justify-around">
      <div className="flex w-4/5 flex-col rounded-xl bg-white px-8 py-4">
        {isRunning ? (
          <div className='py-2'>
            <div>
              <p>LOG LEVEL: {server?.log.loglevel}</p>
              <p>
                LOG FILE PATH: {server?.log[logType === 'access' ? 'access' : 'error']}
                <IconButton
                  color="primary"
                  className=""
                  onClick={() => {
                    window.electron.electronAPI.shell
                      .openPath(server.log[logType === 'access' ? 'access' : 'error'])
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
                variant={logType === 'access' ? 'contained' : 'text'}
                onClick={() => setLogType('access')}
              >
                access log
              </Button>
              <Button
                variant={logType === 'error' ? 'contained' : 'text'}
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
          {displayedLogs.length >= 1 ? (
            <div>
              <hr />
              <div className="h-64 overflow-x-hidden overflow-y-scroll my-2" ref={scrollWindow}>
                {displayedLogs.map((log, idx) => (
                  <p
                    key={idx}
                    className="animate__animated animate__fadeInRight mx-4 my-2 rounded-lg bg-slate-100 px-4 py-2"
                  >
                    {log}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p>no log output</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Index;
