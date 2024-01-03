import { useEffect, useState } from 'react';
import {
  Stack,
  Button,
  IconButton,
  Skeleton,
  Container,
  TextField,
  Box,
  lighten,
  FormControl,
  InputLabel,
  FilledInput,
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';

const Index = () => {
  const [customRules, setCustomRules] = useState(`
! Demo[01] -------------
! *.example.com/*
! > Links will go through proxy:
! >> https://www.example.com
! >> https://image.example.com
! >> https://image.example.com/abcd
!
! Demo[02] -------------
! @@*.example.com/*
! > Links will NOT go through proxy:
! >> https://www.example.com
! >> https://image.example.com
! >> https://image.example.com/abcd
!
! Demo[03] -------------
! ||example.com
! > Links will go through proxy:
! >> http://example.com/abcd
! >> https://example.com
! >> ftp://example.com
!
! Demo[04] -------------
! |https://ab
! > Links will go through proxy:
! >> https://ab.com
! >> https://ab.cn
!
! ab.com|
! > Links will go through proxy:
! >> https://c.ab.com
! >> https://d.ab.com
! >> ftp://d.ab.com
!
! Demo[05] -------------
! The line starts with ! is comment.

! Put user rules line by line in this file.
! See https://adblockplus.org/en/filter-cheatsheet
||githubusercontent.com
||api.github.com
||github.com
||chat.openai.com
||openai.com

||github.io`);
  return (
    <Container sx={{ my: 'auto' }}>
      <Stack spacing={2}>
        <FormControl variant="filled">
          <InputLabel htmlFor="component-filled">GFW List Url</InputLabel>
          <FilledInput
            id="component-filled"
            defaultValue="https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt"
          />
        </FormControl>
        <Button
          variant="contained"
          onClick={async () => {
            const pac = await window.mainConst.get('userPacConf');
            try {
              console.log(pac);
              window.electron.electronAPI.shell.openExternal(`file://${pac}`);
            } catch (err) {}
          }}
        >
          View PAC File
        </Button>
        <TextField
          id="filled-multiline-static"
          label="User Rules"
          multiline
          rows={10}
          value={customRules}
          variant="filled"
        />
        <Button
          variant="contained"
          startIcon={<UpdateIcon />}
          onClick={async () => {
            console.log(customRules);
            const pac = await window.mainConst.get('userPacConf');
            await window.writeToFile.write({ path: pac, content: customRules });
          }}
        >
          Save And Update PAC From Custom List
        </Button>
      </Stack>
    </Container>
  );
};

export default Index;
