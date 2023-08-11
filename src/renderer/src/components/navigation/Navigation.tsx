import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import { setNavTab } from '../../store/navigationSlice';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import type { RootState } from '../../store/index';
const NavButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
  padding: 'auto 4rem',
  color: 'white',
});
const Navigation = () => {
  const { tabName } = useAppSelector((state: RootState) => state.navTab);
  const dispatch = useAppDispatch();
  return (
    <nav className="rounded-xl bg-blue-dark p-4 dark:bg-blue-400/20">
      <Stack spacing={4} direction="row" className="flex justify-center">
        <NavButton
          className="w-20"
          variant={tabName === 'home' ? 'contained' : 'outlined'}
          onClick={() => dispatch(setNavTab('home'))}
        >
          Home
          <HomeIcon />
        </NavButton>
        <NavButton
          className="w-20"
          variant={tabName === 'servers' ? 'contained' : 'outlined'}
          onClick={() => dispatch(setNavTab('servers'))}
        >
          Servers
          <LinkIcon />
        </NavButton>
        <NavButton
          className="w-20"
          variant={tabName === 'logs' ? 'contained' : 'outlined'}
          onClick={() => dispatch(setNavTab('logs'))}
        >
          Logs
          <LinkIcon />
        </NavButton>
        <NavButton
          className="w-20"
          variant={tabName === 'settings' ? 'contained' : 'outlined'}
          onClick={() => dispatch(setNavTab('settings'))}
          disabled
        >
          Settings
          <LinkIcon />
        </NavButton>
        <NavButton
          className="w-20"
          variant={tabName === 'about' ? 'contained' : 'outlined'}
          onClick={() => dispatch(setNavTab('about'))}
        >
          About
          <SettingsIcon />
        </NavButton>
      </Stack>
    </nav>
  );
};
export default Navigation;
