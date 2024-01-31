import { Container, Paper, Stack, TextField, Typography, Tooltip } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';
import { TitleWithTooltip } from './index';

export const ProxyItemWidth = () => {
  return <Container>proxyItemWidth</Container>;
};

export const LatencyTest = () => {
  const proxies = useAppSelector((state) => state.settingsPage.proxies);
  const dispatch = useAppDispatch();
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Latency Test Settings</Typography>

          <Grid container spacing={2} sx={{ width: '100%' }} columns={16}>
            <TextField
              disabled
              label="Latency Test URL"
              variant="filled"
              fullWidth
              sx={{ marginX: 6 }}
              value={proxies.latencyTest.url}
              onChange={(e) =>
                dispatch(
                  setSettingsPageState({ key: 'proxies.latencyTest.url', value: e.target.value }),
                )
              }
            />
            <TextField
              disabled
              label="Latency Test Timeout"
              variant="filled"
              fullWidth
              sx={{ marginX: 6 }}
              value={proxies.latencyTest.timeout}
              onChange={(e) =>
                dispatch(
                  setSettingsPageState({
                    key: 'proxies.latencyTest.timeout',
                    value: e.target.value,
                  }),
                )
              }
            />
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};

export const LatencyTestInterval = () => {
  return <Container>latencyTestInterval</Container>;
};

export const LatencyTestTimeout = () => {
  return <Container>latencyTestTimeout</Container>;
};
