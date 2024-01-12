import { TextField } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useState, useEffect } from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

type formDataType = {
  type: string;
  request: string;
  response: string;
};
const Index = (props: any) => {
  const { header } = props.data.streamSettings.tcpSettings;
  const [formData, setFormData] = useState<formDataType>({
    type: header?.type ?? 'none',
    request: '',
    response: '',
  });

  useEffect(() => {
    const { header } = props.data.streamSettings.tcpSettings;
    setFormData({
      type: header?.type ?? 'none',
      request: '',
      response: '',
    });
  }, [props.data]);

  useEffect(() => {
    const { type, request, response } = formData;
    props.data.streamSettings.tcpSettings = {
      header: {
        type,
      },
    };
  }, [formData]);
  return (
    <Grid container spacing={2}>
      <Grid container xs={16}>
        <Grid xs={3}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e: SelectChangeEvent) =>
                setFormData({ ...formData, type: e.target.value as string })
              }
            >
              <MenuItem value={'none'}>None</MenuItem>
              <MenuItem value={'http'}>Http</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {formData.type !== 'none' ? (
        <Grid container spacing={2} xs={16}>
          <Grid xs={16}>
            <TextField
              size="small"
              fullWidth
              label="Request"
              id="fullWidth"
              disabled={formData.type === 'none'}
              value={formData.request}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, request: event.target.value });
              }}
            />
          </Grid>
          <Grid xs={16}>
            <TextField
              size="small"
              fullWidth
              label="Response"
              id="fullWidth"
              disabled={formData.type === 'none'}
              value={formData.response}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, response: event.target.value });
              }}
            />
          </Grid>
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  );
};

export default Index;
