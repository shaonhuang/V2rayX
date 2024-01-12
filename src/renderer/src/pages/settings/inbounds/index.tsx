import { Button, Container, Stack, Tab, Box, TextField, Paper } from '@mui/material';
import { useState } from 'react';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { InboundObject } from '@renderer/constant/types';
import Tabs, { tabsClasses } from '@mui/material/Tabs';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { setSettingsPageState } from '@renderer/store/settingsPageSlice';

const defaultHttpInboundObject: InboundObject = {
  listen: '127.0.0.1',
  port: 10871,
  protocol: 'http',
  tag: 'http-inbound',
  allocate: {
    strategy: 'always',
    refresh: 5,
    concurrency: 3,
  },
};

const defaultSocksInboundObject: InboundObject = {
  listen: '127.0.0.1',
  port: 10801,
  protocol: 'socks',
  tag: 'socks-inbound',
  allocate: {
    strategy: 'always',
    refresh: 5,
    concurrency: 3,
  },
};

const zhInBoundsTipURl = 'https://www.v2fly.org/config/inbounds.html';
const enInBoundsTipURL = 'https://www.v2fly.org/en_US/v5/config/inbound.html';

const DefaultInBounds = () => {
  const v2rayConfigure = useAppSelector((state) => state.settingsPage.v2rayConfigure);
  const dispatch = useAppDispatch();
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [inbounds, setInbounds] = useState<InboundObject[]>(
    v2rayConfigure.inbounds || [defaultSocksInboundObject, defaultHttpInboundObject],
  );
  const [formData, setFormData] = useState<InboundObject>(
    v2rayConfigure.inbounds[0] ?? defaultSocksInboundObject,
  );

  const handleChange = (event: React.SyntheticEvent, idx: number) => {
    setCurrentTab(idx);
    setFormData(inbounds[idx]);
  };
  return (
    <Container>
      <Paper>
        <Stack
          spacing={2}
          paddingY={4}
          justifyContent={'center'}
          alignItems={'center'}
          sx={{ height: '100%' }}
        >
          <Box
            sx={{
              flexGrow: 1,
              maxWidth: { xs: 320, sm: 480 },
              bgcolor: 'background.paper',
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons
              aria-label="visible arrows tabs example"
              sx={{
                [`& .${tabsClasses.scrollButtons}`]: {
                  '&.Mui-disabled': { opacity: 0.3 },
                },
              }}
            >
              {inbounds.map((i, idx) => {
                return <Tab label={i?.tag ?? i.protocol} key={idx} />;
              })}
            </Tabs>
          </Box>
          <Box>
            <Button
              onClick={() => {
                const newInbounds = [...inbounds, defaultHttpInboundObject];
                setFormData(defaultHttpInboundObject);
                setInbounds(newInbounds);
                setCurrentTab(newInbounds.length - 1);
              }}
            >
              Add New InBound
            </Button>
            <Button
              disabled={inbounds.length < 3 || currentTab === 0 || currentTab === 1}
              onClick={() => {
                const newInbounds = [...inbounds];
                newInbounds.splice(currentTab, 1);
                setFormData(inbounds[currentTab - 1]);
                setInbounds(newInbounds);
                setCurrentTab(currentTab - 1);
              }}
            >
              Delete This InBound
            </Button>
          </Box>
          <Stack>
            <Box sx={{ width: '100%', display: 'flex' }}>
              <TextField
                label="Listen"
                variant="standard"
                value={formData.listen}
                sx={{ flexGrow: 1 }}
                onChange={(event) => setFormData({ ...formData, listen: event.target.value })}
              />
              <TextField
                id="standard-number"
                value={formData.port}
                label="Port"
                type="number"
                sx={{ flexGrow: 0 }}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                variant="standard"
              />
            </Box>
            <TextField
              label="Protocol"
              variant="standard"
              value={formData.protocol}
              onChange={(event) => setFormData({ ...formData, protocol: event.target.value })}
            />
            <TextField
              label="Tag (optional)"
              variant="standard"
              value={formData.tag}
              onChange={(event) => setFormData({ ...formData, tag: event.target.value })}
            />
          </Stack>
          <Button
            startIcon={<SaveAsIcon />}
            onClick={() => {
              setInbounds(inbounds.with(currentTab, formData));
              dispatch(
                setSettingsPageState({
                  key: 'v2rayConfigure.inbounds',
                  value: inbounds.with(currentTab, formData),
                }),
              );
              // FIXME: async problem with data sync issues
              setTimeout(() => {
                window.v2rayService.updatePort();
              }, 200);
            }}
          >
            Save All
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export { DefaultInBounds };
