import { useState, useLayoutEffect } from 'react';
import { DialogTitle, Dialog, Button, Box } from '@mui/material';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

const InstallDialog = () => {
  const [install, setInstall] = useState(true);
  const [open, setOpen] = useState(true);
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
  useLayoutEffect(() => {
    window.db.read('v2rayInstallStatus').then((status) => setOpen(!status));
    window.api.receive('v2ray:downloadStatus', (status: number) => {
      setProgress(status * 100 > 99 ? 99 : status * 100);
    });
    window.api.receive('v2ray:finishedInstall', (status: boolean) => {
      status ? setProgress(100) : null;
    });
  }, []);
  return (
    <Dialog open={open}>
      <DialogTitle>Setup V2ray Core</DialogTitle>
      {install ? (
        <section className="m-8">
          <Button
            onClick={() => {
              window.api.send('v2ray:install', true);
              setInstall(false);
            }}
          >
            install V2ray-core
          </Button>
          <Button
            onClick={() => window.db.write('v2rayInstallStatus', false).then(() => window.quit())}
          >
            Exit
          </Button>
        </section>
      ) : (
        <section className="m-8 flex flex-col gap-4">
          <div>{progress < 100 ? 'Downloading' : 'Finished'} v2ray-core files</div>
          <Box sx={{ width: '100%' }}>
            <LinearProgressWithLabel value={progress} />
          </Box>
          <div>
            {progress >= 100 ? (
              <Button onClick={() => setOpen(false)}>Install Complete</Button>
            ) : (
              <Button
                onClick={() =>
                  window.db.write('v2rayInstallStatus', false).then(() => window.quit())
                }
              >
                Exit
              </Button>
            )}
          </div>
        </section>
      )}
    </Dialog>
  );
};
export default InstallDialog;
