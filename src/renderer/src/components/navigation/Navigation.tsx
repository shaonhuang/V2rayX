import { useState } from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import LogoDevIcon from '@mui/icons-material/LogoDev';
import { Paper } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

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
    <nav className={'mt-4 rounded-xl p-2 backdrop-blur'}>
      <Paper>
        <Stack spacing={4} direction="row" className="flex justify-center" paddingY={2.6}>
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
              <LogoDevIcon />
            </NavButton>
          </Link>
          <Link to="/index/settings">
            <NavButton className="w-20" variant={tabName === 'settings' ? 'contained' : 'outlined'}>
              Settings
              <SettingsIcon />
            </NavButton>
          </Link>
          <Link to="/index/about">
            <NavButton className="w-20" variant={tabName === 'about' ? 'contained' : 'outlined'}>
              About
              <InfoIcon />
            </NavButton>
          </Link>
        </Stack>
      </Paper>
    </nav>
  );
};
export default Navigation;
