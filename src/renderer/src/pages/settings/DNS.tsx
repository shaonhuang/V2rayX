import { Container, Paper, Stack, Button, Typography } from '@mui/material';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';
import { setServerTemplate } from '@renderer/store/serversPageSlice';
const Index = () => {
  const v2rayConfigure = useAppSelector((state) => state.settingsPage.v2rayConfigure);
  const dispatch = useAppDispatch();
  const [dnsObj, setDnsObj] = useState(v2rayConfigure.dns);

  const handleEditorChange = (v) => {
    console.log(v);
    setDnsObj(v);
  };

  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">Follow System Theme</Typography>
          <Typography variant="body1">V2ray DNS Json Text</Typography>
          <Button disabled>View Config</Button>
          <Editor
            height="24vh"
            defaultLanguage="json"
            defaultValue={dnsObj}
            onChange={handleEditorChange}
          />
          <Button
            disabled
            onClick={() => {
              dispatch(
                setSettingsPageState({
                  key: 'v2rayConfigure.dns',
                  value: dnsObj,
                }),
              );
              dispatch(
                setServerTemplate({
                  key: 'dns',
                  value: JSON.parse(dnsObj),
                }),
              );
            }}
          >
            Save
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Index;
