import { useState } from 'react';
import { debounce } from 'lodash';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';

const NavButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
  padding: 'auto 4rem',
  color: 'white',
});
const Navigation = () => {
  const [tabName, setTabName] = useState('home');
  window.addEventListener('hashchange', () => {
    setTabName(window.location.hash.split('/')[1]);
  });
  return (
    <nav className="mt-4 rounded-xl bg-blue-900 p-4 backdrop-blur dark:bg-blue-500/20">
      <Stack spacing={4} direction="row" className="flex justify-center">
        <a href="/#/home">
          <NavButton className="w-20" variant={tabName === 'home' ? 'contained' : 'outlined'}>
            Home
            <HomeIcon />
          </NavButton>
        </a>
        <a href="/#/servers">
          <NavButton className="w-20" variant={tabName === 'servers' ? 'contained' : 'outlined'}>
            Servers
            <LinkIcon />
          </NavButton>
        </a>

        <a href="/#/logs">
          <NavButton className="w-20" variant={tabName === 'logs' ? 'contained' : 'outlined'}>
            Logs
            <LinkIcon />
          </NavButton>
        </a>
        <NavButton
          className="w-20"
          variant={tabName === 'settings' ? 'contained' : 'outlined'}
          disabled
        >
          Settings
          <LinkIcon />
        </NavButton>
        <a href="/#/about">
          <NavButton className="w-20" variant={tabName === 'about' ? 'contained' : 'outlined'}>
            About
            <SettingsIcon />
          </NavButton>
        </a>
      </Stack>
    </nav>
  );
};
export default Navigation;
