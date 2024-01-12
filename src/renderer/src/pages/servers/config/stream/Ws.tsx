import { TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';

type formDataType = {
  host: string;
  path: string;
};
const Index = (props: any) => {
  const { headers, path } = props.data.streamSettings.wsSettings;
  const [formData, setFormData] = useState<formDataType>({
    host: headers?.host ?? '',
    path: path ?? '',
  });

  useEffect(() => {
    const { headers, path } = props.data.streamSettings.wsSettings;
    setFormData({
      host: headers?.host ?? '',
      path: path ?? '',
    });
  }, [props.data]);

  useEffect(() => {
    const { host, path } = formData;
    props.data.streamSettings.wsSettings = {
      path,
      headers: {
        host,
      },
    };
  }, [formData]);
  return (
    <Grid container>
      <Grid container spacing={2} xs={16}>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Host"
            id="fullWidth"
            value={formData.host}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, host: event.target.value });
            }}
          />
        </Grid>
        <Grid xs={6}>
          <TextField
            size="small"
            fullWidth
            label="Path"
            id="fullWidth"
            value={formData.path}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, path: event.target.value });
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Index;
