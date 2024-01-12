import { FormControl, InputLabel, MenuItem, Select, TextField, OutlinedInput } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';
import Checkbox from '@mui/material/Checkbox';

type formDataType = {
  serviceName: string;
  userAgent: string;
  multiMode: boolean;
};
const Index = (props: any) => {
  const { serviceName, user_agent, multiMode } = props.data.streamSettings.grpcSettings;

  const [formData, setFormData] = useState<formDataType>({
    serviceName: serviceName ?? '',
    userAgent: user_agent ?? '',
    multiMode: multiMode ?? false,
  });

  useEffect(() => {
    const { serviceName, user_agent, multiMode } = props.data.streamSettings.grpcSettings;
    setFormData({
      serviceName: serviceName ?? '',
      userAgent: user_agent ?? '',
      multiMode: multiMode ?? false,
    });
  }, [props.data]);

  useEffect(() => {
    const { serviceName, userAgent, multiMode } = formData;
    props.data.streamSettings.grpcSettings = {
      initial_windows_size: 0,
      health_check_timeout: 60,
      multiMode,
      idle_timeout: 60,
      serviceName,
      permit_without_stream: false,
      user_agent: userAgent,
    };
  }, [formData]);

  useEffect(() => {}, [formData]);
  return (
    <Grid container>
      <Grid container spacing={2} xs={16}>
        <Grid xs={8}>
          <TextField
            size="small"
            fullWidth
            label="Service Name"
            id="fullWidth"
            value={formData.serviceName}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, serviceName: event.target.value });
            }}
          />
        </Grid>
        <Grid xs={3.7}>
          <Checkbox
            checked={formData.multiMode}
            onChange={(e) => setFormData({ ...formData, multiMode: e.target.checked })}
          />
          Multi-Mode
        </Grid>
        <Grid xs={16}>
          <TextField
            size="small"
            fullWidth
            label="User-Agent"
            id="fullWidth"
            value={formData.userAgent}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, userAgent: event.target.value });
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
