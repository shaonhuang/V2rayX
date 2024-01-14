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
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';
import { set } from 'lodash';
import { TitleWithTooltipType } from '@renderer/constant/types';

import Editor from '@monaco-editor/react';

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

export const AppTheme = () => {
  const [customStyle, setCustomStyle] = useState(false);
  const appearance = useAppSelector((state) => state.settingsPage.appearance);
  const dispatch = useAppDispatch();

  const handleEditorChange = (v) => {
    try {
      JSON.parse(v);
      dispatch(
        setSettingsPageState({
          key: 'appearance.styleInJson',
          value: v,
        }),
      );
    } catch (error) {
      window.notification.send({
        title: 'Change Theme Error',
        body: `${v}
is not JSON format. Please check it`,
        silent: true,
      });
    }
  };
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
              <TitleWithTooltip title="Enable Custom Theme (JSON)" />
              <Grid xs={4}>
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
                      disabled={appearance.customStyleu}
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
                <TitleWithTooltip title="Enable Custom Theme (JSON)" />
                <Grid xs={4}>
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
                </Grid>
              </Grid>
            </>
          )}
          {appearance.customStyle ? (
            <Editor
              height="40vh"
              defaultLanguage="json"
              defaultValue={appearance.styleInJson}
              onChange={handleEditorChange}
            />
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
