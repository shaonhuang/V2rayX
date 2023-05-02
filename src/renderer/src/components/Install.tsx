import { useState, useEffect } from 'react';
import { DialogTitle, Dialog, Button, Box } from '@mui/material';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

const InstallDialog = (props) => {
  const [open, setOpen] = useState(!window.electron.store.get('v2rayInstallStatus'));

  const [progress, setProgress] = useState(0);
  function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value
          )}%`}</Typography>
        </Box>
      </Box>
    );
  }
  window.api.receive('v2ray:downloadStatus', (status) => {
    setProgress(status * 100 > 99 ? 99 : status * 100);
  });
  window.api.receive('v2ray:unzipStatus', (status) => {
    status ? setProgress(100) : null;
  });

  useEffect(() => {
    window.api.send('v2ray:install', true);
  }, []);
  return (
    <Dialog open={open}>
      <DialogTitle>Setup V2ray Core</DialogTitle>
      <section className="m-8 flex flex-col gap-4">
        <div>{progress < 100 ? '正在下载' : '已经完成安装'}v2ray核心文件</div>
        <Box sx={{ width: '100%' }}>
          <LinearProgressWithLabel value={progress} />
        </Box>
        <div>
          {progress >= 100 ? (
            <Button onClick={() => setOpen(false)}>安装完成</Button>
          ) : (
            <Button
              onClick={() => {
                window.electron.electronAPI.ipcRenderer.invoke('quit-app');
                window.electron.store.set('v2rayInstallStatus', false);
              }}
            >
              退出软件
            </Button>
          )}
        </div>
      </section>
    </Dialog>
  );
};
export default InstallDialog;
