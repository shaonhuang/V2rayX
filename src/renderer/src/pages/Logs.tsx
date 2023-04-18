import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import styled from '@emotion/styled';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

const label = { inputProps: { 'aria-label': 'Checkbox' } };

const ApperanceButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
});

const GernalSettings = () => (
  <section>
    <table className="mx-auto">
      <tbody className="flex flex-col">
        <tr>
          <th className="text-right">Port</th>
          <td>
            <Checkbox {...label} />
            Launch V2rayX at Login
          </td>
        </tr>
        <tr>
          <th className="text-right">Startup</th>
          <td>
            <Checkbox {...label} />
            Launch V2rayX at Login
          </td>
        </tr>
        <tr>
          <th className="text-right">Startup</th>
          <td>
            <Checkbox {...label} />
            Launch V2rayX at Login
          </td>
        </tr>

        <tr>
          <th className="text-right">Startup</th>
          <td>
            <Checkbox {...label} />
            Launch V2rayX at Login
          </td>
        </tr>
        <tr>
          <th className="text-right">Menu bar icon</th>
          <td>
            <Checkbox {...label} />
            Show V2rayX in menu bar
          </td>
        </tr>
        <tr>
          <th className="text-right">Apperance</th>
          <td>
            <Stack direction="row" spacing={1}>
              <ApperanceButton variant="text">
                <LightModeIcon />
                Light
              </ApperanceButton>
              <ApperanceButton variant="text">
                <DarkModeIcon />
                Dark
              </ApperanceButton>
              <ApperanceButton variant="text">
                <SettingsBrightnessIcon />
                System
              </ApperanceButton>
            </Stack>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
);
export default GernalSettings;
