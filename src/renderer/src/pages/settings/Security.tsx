import { Stack, Box, Paper, Tooltip, Chip, Container, Typography, Button } from '@mui/material';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import { compareVersions } from 'compare-versions';

export const V2rayCoreUpdate = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const v2rayCore = useAppSelector((state) => state.settingsPage.v2rayCore);
  const [newV2rayCoreVersion, setNewV2rayCoreVersion] = useState('v0.0.0');

  const handleUpdate = () => {
    console.log('Update');
  };
  useEffect(() => {
    // window.net
    //   .request('https://api.github.com/repos/v2fly/v2ray-core/releases/latest')
    //   .then((res) => {
    //     const jsonString = Buffer.from(res).toString('utf8');
    //     const parsedData = JSON.parse(jsonString);
    //     setNewV2rayCoreVersion(parsedData.tag_name);
    //   });
  }, []);
  return (
    <Container>
      <Paper>
        <Stack spacing={2} paddingY={4} justifyContent={'center'} alignItems={'center'}>
          <Typography variant="h6">V2ray Core Update</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: '12px' }}>
            <Typography variant="body1" sx={{ alignSelf: 'center' }}>
              Current V2ray Core version:
            </Typography>

            <Tooltip
              title={`V2Ray ${v2rayCore.version} (V2Fly, a community-driven edition of V2Ray.) Custom (go1.21.4 darwin/amd64) A unified platform for anti-censorship.`}
              placement="top"
            >
              <Chip color="info" disabled={false} label={v2rayCore.version} />
            </Tooltip>
          </Box>

          {compareVersions(newV2rayCoreVersion.slice(1), '5.12.1') && false ? (
            <>
              <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                There is new v2ray core: {newV2rayCoreVersion}
              </Typography>
              <Button onClick={() => handleUpdate()} sx={{ width: '260px', alignSelf: 'center' }}>
                Fetch Latest And Install
              </Button>
            </>
          ) : (
            <></>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};
