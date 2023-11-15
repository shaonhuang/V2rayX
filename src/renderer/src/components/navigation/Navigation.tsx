import { useState } from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { isMac } from '@renderer/constant';

const NavButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
  padding: 'auto 4rem',
});
const Navigation = () => {
  const [tabName, setTabName] = useState('home');
  const location = useLocation();
  useEffect(() => {
    if (window.location.hash === '') {
      setTabName('home');
    } else {
      setTabName(window.location.hash.split('/')[2]);
    }
  }, [location]);
  return (
    <nav
      className={`mt-4 rounded-xl p-4 backdrop-blur ${
        isMac ? '' : 'bg-blue-900 dark:bg-blue-500/20'
      }`}
    >
      <Stack spacing={4} direction="row" className="flex justify-center">
        <Link to="/index/home">
          <NavButton className="w-20" variant={tabName === 'home' ? 'contained' : 'outlined'}>
            Home
            <HomeIcon />
          </NavButton>
        </Link>
        <Link to="/index/servers">
          <NavButton className="w-20" variant={tabName === 'servers' ? 'contained' : 'outlined'}>
            Servers
            <LinkIcon />
          </NavButton>
        </Link>

        <Link to="/index/logs">
          <NavButton className="w-20" variant={tabName === 'logs' ? 'contained' : 'outlined'}>
            Logs
            <LinkIcon />
          </NavButton>
        </Link>
        <NavButton
          className="w-20"
          variant={tabName === 'settings' ? 'contained' : 'outlined'}
          disabled
        >
          Settings
          <LinkIcon />
        </NavButton>
        <Link to="/index/about">
          <NavButton className="w-20" variant={tabName === 'about' ? 'contained' : 'outlined'}>
            About
            <SettingsIcon />
          </NavButton>
        </Link>
      </Stack>
    </nav>
  );
};
export default Navigation;
