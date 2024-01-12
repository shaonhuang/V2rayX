import { Container, Paper, Stack, Typography, Button, Tooltip, Fade } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';
import Editor from '@monaco-editor/react';

export const BypassDomainIPNet = () => {
  const systemProxy = useAppSelector((state) => state.settingsPage.systemProxy);
  const dispatch = useAppDispatch();
  const handleEditorChange = (e) => {
    dispatch(setSettingsPageState({ key: 'systemProxy.bypassDomains', value: e }));
  };
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">
            Bypass Domain/IPNet
            <Tooltip
              title="Bypass (don't use) the proxy server when visiting certain addresses The interpretation of
            this list is OSdependent and app-dependent. In otherwords, your operating systems
            andapplications may evaluate the rulesdifferently."
              TransitionComponent={Fade}
            >
              <TipsAndUpdatesIcon />
            </Tooltip>
          </Typography>

          <Grid container spacing={2} sx={{ width: '100%' }} columns={16}>
            <Editor
              height="42vh"
              defaultLanguage="yaml"
              defaultValue={systemProxy.bypassDomains}
              onChange={handleEditorChange}
            />
            <Grid xs={8}>
              <Button disabled>Restore it</Button>
            </Grid>
            <Grid xs={8}>
              <Button disabled>Save it</Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};
export const StaticHost = () => {
  return <Container>staticHost</Container>;
};
