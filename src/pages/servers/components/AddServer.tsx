import { useEffect, useState } from 'react';
import {
  Button,
  DialogTitle,
  Dialog,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Input,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import styled from '@emotion/styled';
import ReactJson from 'react-json-view';

export interface AddServerDialogProps {
  open: boolean;
  onClose: () => void;
}
const theme = createTheme({
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
        },
      },
    },
  },
});

const RoundedButton = styled(Button)({
  borderRadius: '12px',
  backgroundColor: '#7CA4E2',
});

const ImportSettings = () => {
  // const [data, setData] = useState({});
  // const serverData = async () => {
  //   let tmpData = await window.serverFiles.openFile();
  //   if (tmpData === null) {
  //     tmpData = {};
  //   }
  //   const data = tmpData;
  //   setData(data);
  //   return data;
  // };
  // useEffect(() => {
  //   serverData();
  // }, [data]);
  const data = {};
  return <section>{<ReactJson src={data} />}</section>;
};
const ManualSettings = () => {
  const [age, setAge] = useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setAge(event.target.value);
  };
  return (
    <section className="overflow-x-hidden">
      <div>
        <div>
          <span>Base Settings</span>
          <Button>Settings</Button>
        </div>
        <div>
          <TextField
            id="outlined-number"
            label="socket port"
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            id="outlined-number"
            label="http port"
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormGroup>
            <FormControlLabel control={<Checkbox defaultChecked />} label="udp" />
          </FormGroup>
        </div>
        <div>
          <TextField fullWidth label="DNS" id="fullWidth" />
        </div>
        <FormGroup>
          <FormControlLabel control={<Checkbox defaultChecked />} label="Mux" />
        </FormGroup>
        <input value="8" />
      </div>
      <div>
        <div>
          <span>Server Settings</span>
          <FormControl sx={{ m: 1, minWidth: 80 }}>
            <InputLabel id="demo-simple-select-autowidth-label">Age</InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={age}
              onChange={handleChange}
              autoWidth
              label="Age"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value={10}>Twenty</MenuItem>
              <MenuItem value={21}>Twenty one</MenuItem>
              <MenuItem value={22}>Twenty one and a half</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div>
          <div>
            <TextField id="outlined-basic" label="address" variant="outlined" />:
            <TextField id="outlined-basic" label="port" variant="outlined" />
          </div>
          <div>
            <TextField id="outlined-basic" label="id" variant="outlined" />
          </div>
          <div>
            <TextField id="outlined-basic" label="alterId" variant="outlined" />
            <TextField id="outlined-basic" label="level" variant="outlined" />
          </div>
          <FormControl sx={{ m: 1, minWidth: 80 }}>
            <InputLabel id="demo-simple-select-autowidth-label">Age</InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={age}
              onChange={handleChange}
              autoWidth
              label="Age"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value={10}>Twenty</MenuItem>
              <MenuItem value={21}>Twenty one</MenuItem>
              <MenuItem value={22}>Twenty one and a half</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
    </section>
  );
};

const AddServerDialog = (props: AddServerDialogProps) => {
  const { onClose, open } = props;
  const [mode, setMode] = useState('import');
  const handleClose = () => {
    onClose();
  };

  return (
    <ThemeProvider theme={theme}>
      <Dialog onClose={handleClose} open={open}>
        <div className="flex h-[450px] w-[600px] flex-col items-center overflow-x-hidden p-6">
          <DialogTitle className="text-center">Configure Server</DialogTitle>
          <FormControl sx={{ m: 1, width: '50ch' }} variant="standard" className="">
            <InputLabel>Url</InputLabel>
            <Input
              endAdornment={
                <InputAdornment position="end">
                  <Button>Import</Button>
                </InputAdornment>
              }
            />
          </FormControl>
          <div className="bg-gray">
            <div className="flex flex-row gap-2">
              <RoundedButton onClick={() => setMode('import')}>Import</RoundedButton>
              <RoundedButton onClick={() => setMode('manual')}>Manual</RoundedButton>
            </div>
            <div>{mode === 'import' ? <ImportSettings /> : <ManualSettings />}</div>
          </div>
        </div>
        <RoundedButton className="w-12">Finish</RoundedButton>
      </Dialog>
    </ThemeProvider>
  );
};
export default AddServerDialog;
