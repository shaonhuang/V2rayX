import { useState } from 'react';
import {
  Container,
  Paper,
  Switch,
  Stack,
  TextField,
  Button,
  ButtonGroup,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';
import { set, throttle } from 'lodash';
import { TitleWithTooltip } from './index';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import Editor from '@monaco-editor/react';

export const AppTheme = () => {
  const appearance = useAppSelector((state) => state.settingsPage.appearance);
  const dispatch = useAppDispatch();
  const defaultStyle = JSON.stringify(
    {
      palette: {
        mode: 'light',
        primary: {
          main: '#1976d2',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#9c27b0',
        },
        success: {
          main: '#2e7d32',
        },
      },
      typography: {
        fontFamily: 'Source Sans Pro, sans-serif',
      },
    },
    null,
    2,
  );

  const [tmpCustomStyle, setTmpCustomStyle] = useState(defaultStyle);

  const handleEditorChange = throttle((v) => {
    // FIXME: ugly code for now.
    try {
      JSON.parse(v);
      setTmpCustomStyle(v);
    } catch (error) {
      window.notification.send({
        title: 'Change Style Error',
        body: `${error}
            Please check it`,
        silent: true,
      });
      setTmpCustomStyle(v);
    }
  }, 3000);
  return (
    <Container sx={{ height: '100%' }}>
      <Paper>
        <Stack
          spacing={2}
          paddingY={4}
          justifyContent={'center'}
          alignItems={'center'}
          sx={{ height: '100%' }}
        >
          <Typography variant="h6">Application Theme</Typography>
          {appearance.customStyle ? (
            <Grid container spacing={2} sx={{ width: '100%' }}>
              <TitleWithTooltip title="Enable Custom Theme">
                <IconButton
                  onClick={() => {
                    window.electron.electronAPI.shell.openExternal(
                      'https://zenoo.github.io/mui-theme-creator/',
                    );
                  }}
                >
                  <PsychologyAltIcon />
                </IconButton>
              </TitleWithTooltip>
              <Grid xs={4}>
                <Switch
                  checked={appearance.customStyle}
                  disabled
                  onChange={(event) =>
                    dispatch(
                      setSettingsPageState({
                        key: 'appearance.customStyle',
                        value: event.target.checked,
                      }),
                    )
                  }
                />
              </Grid>
            </Grid>
          ) : (
            <>
              <Typography variant="body1">
                The Folder Path define where v2ray log goes to.Carefully change it.Wrong path may
                result in V2ray Service stop.
              </Typography>
              <Grid container spacing={2} sx={{ width: '100%' }}>
                <TitleWithTooltip title="Theme" />
                <Grid xs={4}>
                  <ButtonGroup
                    variant="contained"
                    aria-label="outlined primary button group"
                    className="ml-[-102px]"
                  >
                    <Button
                      disabled={appearance.customStyle}
                      variant="outlined"
                      onClick={() =>
                        dispatch(
                          setSettingsPageState({
                            key: 'appearance.theme',
                            value: 'default',
                          }),
                        )
                      }
                    >
                      default
                    </Button>
                    <Button
                      disabled={appearance.customStyle || true}
                      variant="outlined"
                      onClick={() =>
                        dispatch(
                          setSettingsPageState({
                            key: 'appearance.theme',
                            value: 'two',
                          }),
                        )
                      }
                    >
                      -
                    </Button>
                    <Button
                      disabled={appearance.customStyle || true}
                      variant="outlined"
                      onClick={() =>
                        dispatch(
                          setSettingsPageState({
                            key: 'appearance.theme',
                            value: 'three',
                          }),
                        )
                      }
                    >
                      -
                    </Button>
                  </ButtonGroup>
                </Grid>
                <TitleWithTooltip title="Enable Custom Theme" />
                <Grid xs={4}>
                  <Tooltip
                    title="This is a configuration of MUI theme,!!! it's auto-save, make sure it is fully
                completed and corrected before you paste your json here. Or it will cause webview
                crush. you can restore it maunally edit database of management.appearance.styleInJson
                (aka it's a json string)"
                  >
                    <Switch
                      checked={appearance.customStyle}
                      onChange={(event) =>
                        dispatch(
                          setSettingsPageState({
                            key: 'appearance.customStyle',
                            value: event.target.checked,
                          }),
                        )
                      }
                    />
                  </Tooltip>
                </Grid>
              </Grid>
            </>
          )}
          {appearance.customStyle ? (
            <>
              <Typography variant="body1">
                Enable Follow Allow you to control dark or light mode.
              </Typography>
              <Editor
                height="26vh"
                defaultLanguage="json"
                value={tmpCustomStyle}
                onChange={handleEditorChange}
              />
              <Grid container xs={12}>
                <Grid xs={6}>
                  <Button
                    onClick={() => {
                      setTmpCustomStyle(defaultStyle);
                      dispatch(
                        setSettingsPageState({
                          key: 'appearance.styleInJson',
                          value: defaultStyle,
                        }),
                      );
                    }}
                  >
                    Restore
                  </Button>
                </Grid>
                <Grid xs={6}>
                  <Button
                    onClick={() => {
                      dispatch(
                        setSettingsPageState({
                          key: 'appearance.styleInJson',
                          value: tmpCustomStyle,
                        }),
                      );
                    }}
                  >
                    Save
                  </Button>
                </Grid>
              </Grid>
            </>
          ) : (
            <></>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export const FollowSystemTheme = () => {
  const appearance = useAppSelector((state) => state.settingsPage.appearance);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Follow System Theme</Typography>
          <Typography variant="body1">
            Enable Follow Allow you to control dark or light mode.
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <TitleWithTooltip title="Follow System Theme" />
            <Grid xs={4}>
              <Switch
                checked={appearance.followSystemTheme}
                onChange={(event) =>
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.followSystemTheme',
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

export const FontFamilies = () => {
  const appearance = useAppSelector((state) => state.settingsPage.appearance);
  const dispatch = useAppDispatch();
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Font Families</Typography>
          <Typography variant="body1">
            The Folder Path define where v2ray log goes to.Carefully change it.Wrong path may result
            in V2ray Service stop.
          </Typography>
          {
            <Grid container spacing={2} sx={{ width: '100%' }}>
              {['•Raleway', '•PTSans', '•Oswald', '•Montserrat', '•Lora', '•Lato'].map((i, idx) => (
                <Grid xs={4} key={idx}>
                  <Typography variant="body2">{i}</Typography>
                </Grid>
              ))}
            </Grid>
          }

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <TextField
              label="Font Name"
              variant="filled"
              fullWidth
              sx={{ marginX: 6 }}
              value={appearance.fontFamily}
              onChange={(e) =>
                dispatch(
                  setSettingsPageState({
                    key: 'appearance.fontFamily',
                    value: e.target.value,
                  }),
                )
              }
            />
            <Grid xs={12}>
              <Button
                onClick={() =>
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.styleInJson',
                      value: JSON.stringify(
                        set(JSON.parse(appearance.styleInJson), 'typography', {
                          fontFamily: appearance.fontFamily,
                        }),
                        null,
                        2,
                      ),
                    }),
                  )
                }
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

export const HideTrayBar = () => {
  const appearance = useAppSelector((state) => state.settingsPage.appearance);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Hide Tray Bar</Typography>
          <Typography variant="body1">
            Enable Follow Allow you to control dark or light mode.
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <TitleWithTooltip title="Hide Tray Bar" />
            <Grid xs={4}>
              <Switch
                checked={appearance.hideTrayBar}
                onChange={(event) =>
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.hideTrayBar',
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

export const TrayProxyGroupStyle = () => {
  return <Container>trayProxyGroupStyle</Container>;
};

export const EnhancedTrayIcon = () => {
  const appearance = useAppSelector((state) => state.settingsPage.appearance);
  const dispatch = useAppDispatch();

  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} paddingX={2} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Enhanced Tray Icon</Typography>
          <Typography variant="body1">
            Now you can replace tray icon (recommend that image size is 16x16)
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }} columns={16}>
            <TextField
              label="Icon (Base64)"
              variant="filled"
              fullWidth
              sx={{ marginX: 6 }}
              multiline
              rows={4}
              value={appearance.enhancedTrayIcon}
              onChange={(e) =>
                dispatch(
                  setSettingsPageState({
                    key: 'appearance.enhancedTrayIcon',
                    value: e.target.value,
                  }),
                )
              }
            />
            <Grid xs={16}>
              <Button
                onClick={() =>
                  dispatch(
                    setSettingsPageState({
                      key: 'appearance.enhancedTrayIcon',
                      value: '',
                    }),
                  )
                }
              >
                Restore it
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};

export const Script = () => {
  return <Container>script</Container>;
};
