import { Container, Paper, Stack, Button, Typography, Grid } from '@mui/material';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';
const Index = () => {
  const v2rayConfigure = useAppSelector((state) => state.settingsPage.v2rayConfigure);
  const dispatch = useAppDispatch();
  const [dnsObj, setDnsObj] = useState(v2rayConfigure.dns);
  const defaultDNS = `{
    "hosts": {
      "dns.google": "8.8.8.8"
    }
}`;

  const handleEditorChange = (v) => {
    setDnsObj(v);
  };

  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingX={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">V2ray DNS Json Text</Typography>
          <Typography variant="body1">
            Edit v2ray dns config, which will inject dns item when you start a proxy service.
          </Typography>
          <Button disabled>View Config</Button>
          <Editor
            height="24vh"
            defaultLanguage="json"
            defaultValue={dnsObj}
            value={dnsObj}
            onChange={handleEditorChange}
          />
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid xs={6}>
              <Button
                onClick={() => {
                  setDnsObj(defaultDNS);
                  dispatch(
                    setSettingsPageState({
                      key: 'v2rayConfigure.dns',
                      value: defaultDNS,
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
                  try {
                    JSON.parse(dnsObj);
                    dispatch(
                      setSettingsPageState({
                        key: 'v2rayConfigure.dns',
                        value: dnsObj,
                      }),
                    );
                  } catch (err) {
                    window.notification.send({
                      title: 'Change DNS Error',
                      body: `${dnsObj}
is not JSON format. Please check it`,
                      silent: true,
                    });
                  }
                }}
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Index;
