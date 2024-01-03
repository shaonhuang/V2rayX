import { useState, useEffect } from 'react';
import { Stack, Box, Paper, ListItemButton, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import { V2rayCoreUpdate } from './Security';
import {
  NotificationType,
  SlientStart,
  GUILogFolder,
  V2rayLogsFolder,
  AutomaticUpgrade,
} from './General';
import {
  AppTheme,
  FollowSystemTheme,
  FontFamilies,
  HideTrayBar,
  EnhancedTrayIcon,
} from './Appearance';
import PAC from '@renderer/pages/pac';
import { BypassDomainIPNet } from './SystemProxy';
import { LatencyTest } from './Proxies';
import { DefaultInBounds } from './inbounds';
import DNS from './DNS';

import { flatten } from 'lodash';

type SettingsProps = {
  label: string;
  description?: string;
  icon?: string;
  children?: React.ReactNode;
  element?: React.ReactNode;
  subRows?: SettingsProps[];
};

//nested data is ok, see accessorKeys in ColumnDef below
const data: SettingsProps[] = [
  {
    label: 'Security',
    description: 'Security Settings',
    icon: 'SettingsIcon',
    children: 'Security Settings',
    subRows: [
      {
        label: 'V2ray Core Update',
        element: <V2rayCoreUpdate />,
      },
    ],
  },
  {
    label: 'General',
    description: 'General Settings',
    icon: 'SettingsIcon',
    children: 'General Settings',
    subRows: [
      {
        label: 'Notifications',
        description: 'Set whether to pop-up system-level notifications',
        element: <NotificationType />,
      },
      {
        label: 'Silent Start',
        description: 'Set whether to start silently',
        element: <SlientStart />,
      },
      // {
      //   label: 'Random Controller Port',
      //   description: 'Set whether to use a random controller port',
      //   element: <RandomControllerPort />,
      // },
      // {
      //   label: 'Lightweight Mode',
      //   description: 'Set whether to use lightweight mode',
      //   element: <LightweightMode />,
      // },
      // {
      //   label: 'Run time Format',
      //   description: 'Set whether to use runtime format',
      //   element: <RunTimeFormat />,
      // },
      {
        label: 'Application Log Folder',
        description: 'Set the Application log folder',
        element: <GUILogFolder />,
      },
      {
        label: 'V2ray Data Folder',
        description: 'Set the V2ray data folder',
        element: <V2rayLogsFolder />,
      },
      // {
      //   label: 'Show New Version Icon',
      //   description: 'Set whether to show the new version icon',
      //   element: <ShowNewVersionIcon />,
      // },
      // {
      //   label: 'Automatic Upgrade Settings',
      //   description: 'Set whether to automatically upgrade',
      //   element: <AutomaticUpgrade />,
      // },
    ],
  },
  {
    label: 'Appearance',
    subRows: [
      {
        label: 'Theme',
        description: 'Set the theme',
        element: <AppTheme />,
      },
      {
        label: 'Follow System Theme',
        description: 'Set whether to follow system theme',
        element: <FollowSystemTheme />,
      },
      {
        label: 'Font Families',
        description: 'Set the font family',
        element: <FontFamilies />,
      },
      {
        label: 'Hide Tray Icon',
        description: 'Set whether to hide the tray icon',
        element: <HideTrayBar />,
      },
      // {
      //   label: 'Tray Proxy Groups Style',
      //   description: 'Set the tray proxy group style',
      //   element: <TrayProxyGroupStyle />,
      // },
      {
        label: 'Enhanced Tray Icon',
        description: 'Set whether to use enhanced tray icon',
        element: <EnhancedTrayIcon />,
      },
      // {
      //   label: 'Script',
      //   description: 'Set whether to use script',
      //   element: <Script />,
      // },
    ],
  },
  {
    label: 'System Proxy',
    subRows: [
      {
        label: 'Bypass Domain/IPNet',
        element: <BypassDomainIPNet />,
      },
      // {
      //   label: 'Static Host',
      //   element: <StaticHost />,
      // },
      {
        label: 'PAC Settings',
        element: <PAC />,
      },
    ],
  },
  {
    label: 'Proxies',
    subRows: [
      // {
      //   label: 'Proxy Item Width',
      //   element: <ProxyItemWidth />,
      // },

      {
        label: 'Latency Test',
        element: <LatencyTest />,
      },
    ],
  },
  {
    label: 'V2ray Configure',
    subRows: [
      {
        label: 'Default InBounds',
        element: <DefaultInBounds />,
      },
      // {
      //   label: 'Outbounds',
      //   element: <InterfaceName />,
      // },
      {
        label: 'DNS',
        element: <DNS />,
      },
    ],
  },
  // {
  //   label: 'Shortcuts',
  //   subRows: [],
  // },
];

const Index = () => {
  const pages = flatten(
    data.map(
      (item) =>
        item?.subRows?.map((subItem) => {
          return { label: subItem.label, element: subItem.element };
        }),
    ),
  );
  const [detailLabel, setDetailLabel] = useState(pages[0]?.label ?? '');
  const [buttonStates, setButtonStates] = useState(Array(data.length).fill(true));
  const [state, setState] = useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });
  const toggleDrawer =
    (anchor, open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }

      setState({ ...state, [anchor]: open });
    };
  useEffect(() => {
    console.log(
      flatten(
        data.map(
          (item) =>
            item?.subRows?.map((subItem) => {
              return { label: subItem.label, element: subItem.element };
            }),
        ),
      ),
    );
  }, [buttonStates]);
  return (
    <>
      <Grid container spacing={2} sx={{ py: 2, pl: 2 }}>
        <Grid xs={4} className="h-[68vh] overflow-y-scroll ">
          {data.map((item, index) => {
            return (
              <Box
                key={index}
                sx={{
                  bgcolor: buttonStates[index] ? 'rgba(71, 98, 130, 0.4)' : 'rgba(71, 98, 130, 0.2)',
                  pb: buttonStates[index] ? 2 : 0,
                }}
              >
                <ListItemButton
                  alignItems="flex-start"
                  onClick={() => setButtonStates(buttonStates.with(index, !buttonStates[index]))}
                  sx={{
                    px: 3,
                    pt: 2.5,
                    pb: buttonStates[index] ? 0 : 2.5,
                    '&:hover, &:focus': { '& svg': { opacity: buttonStates[index] ? 1 : 0 } },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 15,
                      fontWeight: 'medium',
                      lineHeight: '20px',
                      mb: '2px',
                    }}
                    secondary="Settings"
                    secondaryTypographyProps={{
                      noWrap: true,
                      fontSize: 12,
                      lineHeight: '16px',
                      color: buttonStates[index] ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.5)',
                    }}
                    sx={{ my: 0 }}
                  />
                  <KeyboardArrowDown
                    sx={{
                      mr: -1,
                      opacity: 0,
                      transform: buttonStates[index] ? 'rotate(-180deg)' : 'rotate(0)',
                      transition: '0.2s',
                    }}
                  />
                </ListItemButton>
                {buttonStates[index] &&
                  (item.subRows ?? []).map((subItem) => (
                    <ListItemButton
                      key={subItem.label}
                      sx={{ py: 0, minHeight: 32, color: 'rgba(255,255,255,.8)' }}
                      onClick={() => setDetailLabel(subItem.label)}
                    >
                      <ListItemText
                        primary={subItem.label}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 'medium' }}
                      />
                    </ListItemButton>
                  ))}
              </Box>
            );
          })}
        </Grid>
        <Grid xs={8}>
          <Stack>{pages.find((item) => item?.label === detailLabel)?.element}</Stack>
        </Grid>
      </Grid>
      {/*<Drawer anchor={anchor} open={state[anchor]} onClose={toggleDrawer(anchor, false)}>
        {list(anchor)}
      </Drawer>*/}
    </>
  );
};
export default Index;
