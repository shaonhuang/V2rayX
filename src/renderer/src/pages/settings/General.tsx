import {
  Container,
  Paper,
  Switch,
  Stack,
  TextField,
  Typography,
  Button,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';

type TitleWithTooltipType = {
  title: string;
  tooltip?: string;
};
const TitleWithTooltip = (props: TitleWithTooltipType) => {
  return (
    <Grid
      xs={8}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <Typography variant="body1">{props.title}</Typography>
      {props?.tooltip ? (
        <Tooltip placement="right" title={props.tooltip}>
          <TipsAndUpdatesIcon />
        </Tooltip>
      ) : (
        <></>
      )}
    </Grid>
  );
};

export const NotificationType = () => {
  const generalSettings = useAppSelector((state) => state.settingsPage.generalSettings);
  const dispatch = useAppDispatch();
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Notification Settings</Typography>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <TitleWithTooltip title="Allow System Notification" tooltip="Enable System Message" />
            <Grid xs={4}>
              <Switch
                checked={generalSettings.allowSystemNotification}
                disabled
                onChange={(event) =>
                  dispatch(
                    setSettingsPageState({
                      key: 'generalSettings.allowSystemNotification',
                      value: event.target.checked,
                    }),
                  )
                }
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};

export const SlientStart = () => {
  const generalSettings = useAppSelector((state) => state.settingsPage.generalSettings);
  const dispatch = useAppDispatch();
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Slient Start Settings</Typography>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <TitleWithTooltip title="Auto-Start Proxy" tooltip="Enable Proxy Service Autostart" />
            <Grid xs={4}>
              <Switch
                checked={generalSettings.autoStartProxy}
                onChange={(event) =>
                  dispatch(
                    setSettingsPageState({
                      key: 'generalSettings.autoStartProxy',
                      value: event.target.checked,
                    }),
                  )
                }
              />
            </Grid>
            <TitleWithTooltip title="Dashboard Pop Up When Started" />
            <Grid xs={4}>
              <Switch
                checked={generalSettings.dashboardPopWhenStart}
                onChange={(event) =>
                  dispatch(
                    setSettingsPageState({
                      key: 'generalSettings.dashboardPopWhenStart',
                      value: event.target.checked,
                    }),
                  )
                }
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};

export const RandomControllerPort = () => {
  return <Container>Random Controller Port</Container>;
};

export const LightweightMode = () => {
  return <Container>Lightweight Mode</Container>;
};

export const RunTimeFormat = () => {
  return <Container>Run Time Format</Container>;
};

export const GUILogFolder = () => {
  const generalSettings = useAppSelector((state) => state.settingsPage.generalSettings);
  const dispatch = useAppDispatch();
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} paddingX={2} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Application Logs Folder</Typography>
          <Typography variant="body1">
            The Applicaion data generates every day with tags on it. You can check it or attach it
            for issue description on Github.
          </Typography>

          <Grid container spacing={2} sx={{ width: '100%' }} columns={16}>
            <TextField
              label="Application Logs Folder (Editable)"
              variant="filled"
              fullWidth
              sx={{ marginX: 6 }}
              value={generalSettings.applicationLogsFolder}
              onChange={(e) =>
                dispatch(
                  setSettingsPageState({
                    key: 'generalSettings.applicationLogsFolder',
                    value: e.target.value,
                  }),
                )
              }
            />
            <Grid xs={8}>
              <Button
                onClick={() =>
                  window.electron.electronAPI.shell.openPath(generalSettings.applicationLogsFolder)
                }
              >
                Open it
              </Button>
            </Grid>
            <Grid xs={8}>
              <Button
                onClick={() => {
                  window.api.send(
                    'v2rayx:settings:setAppLogsDir',
                    generalSettings.applicationLogsFolder,
                  );
                }}
              >
                Save it
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};

export const V2rayLogsFolder = () => {
  const generalSettings = useAppSelector((state) => state.settingsPage.generalSettings);
  const dispatch = useAppDispatch();
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">V2ray Logs Folder</Typography>
          <Typography variant="body1">
            The Folder Path define where v2ray log goes to.Carefully change it.Wrong path may result
            in V2ray Service stop. (Directory need to be finished with / for Unix/Mac , \ for
            Windows)
          </Typography>
          <Typography variant="body2">
            access: {`${generalSettings.v2rayLogsFolder}access.log`}
          </Typography>
          <Typography variant="body2">
            error: {`${generalSettings.v2rayLogsFolder}error.log`}
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }} columns={16}>
            <TextField
              label="V2ray Logs Folder (Editable)"
              variant="filled"
              fullWidth
              sx={{ marginX: 6 }}
              value={generalSettings.v2rayLogsFolder}
              onChange={(e) =>
                dispatch(
                  setSettingsPageState({
                    key: 'generalSettings.v2rayLogsFolder',
                    value: e.target.value,
                  }),
                )
              }
            />
            <Grid xs={8}>
              <Button
                onClick={() =>
                  window.electron.electronAPI.shell.openPath(generalSettings.v2rayLogsFolder)
                }
              >
                Open it
              </Button>
            </Grid>
            <Grid xs={8}>
              <Button onClick={() => {}}>Save it</Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};

export const ShowNewVersionIcon = () => {
  return <Container>Show New Version Icon</Container>;
};

export const AutomaticUpgrade = () => {
  const generalSettings = useAppSelector((state) => state.settingsPage.generalSettings);
  const dispatch = useAppDispatch();
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Automatic Upgrade Settings</Typography>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <TitleWithTooltip title="Visiable Upgrade Tip " />
            <Grid xs={4}>
              <Switch
                checked={generalSettings.automaticUpgrade.visiableUpgradeTip}
                onChange={(event) =>
                  dispatch(
                    setSettingsPageState({
                      key: 'generalSettings.automaticUpgrade.visiableUpgradeTip',
                      value: event.target.checked,
                    }),
                  )
                }
              />
            </Grid>
            <TitleWithTooltip title="Auto-Download And Install" />
            <Grid xs={4}>
              <Switch
                checked={generalSettings.automaticUpgrade.autodownloadAndInstall}
                onChange={(event) =>
                  dispatch(
                    setSettingsPageState({
                      key: 'generalSettings.automaticUpgrade.autodownloadAndInstall',
                      value: event.target.checked,
                    }),
                  )
                }
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};
