import { createHashRouter } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Navigation from '@renderer/components/navigation/Navigation';
import GernalSettings from '@renderer/pages/Home';
import Servers from '@renderer/pages/servers';
import About from '@renderer/pages/About';
import Logs from '@renderer/pages/Logs';
import Settings from '@renderer/pages/settings/';
import QRcode from '@renderer/pages/qrcode';
import Subscriptions from '@renderer/pages/subscriptions';
import PACSettings from '@renderer/pages/pac';
import ConfigPage from '@renderer/pages/servers/config';

const IndexLayout = () => (
  <>
    <Navigation />
    <Outlet />
  </>
);

const router = createHashRouter([
  {
    path: '/',
    element: <IndexLayout />,
    children: [
      {
        path: '/',
        element: <GernalSettings />,
      },
    ],
  },
  {
    path: '/index',
    element: <IndexLayout />,
    children: [
      {
        path: '/index/home',
        element: <GernalSettings />,
      },
      {
        path: '/index/servers',
        element: <Servers />,
      },
      {
        path: '/index/logs',
        element: <Logs />,
      },
      {
        path: '/index/settings',
        element: <Settings />,
      },
      {
        path: '/index/about',
        element: <About />,
      },
    ],
  },
  {
    path: '/servers/*',
    element: <ConfigPage />,
  },
  {
    path: '/share/qrcode',
    element: <QRcode />,
  },
  {
    path: 'manage/subscription',
    element: <Subscriptions />,
  },
  {
    path: 'manage/pac',
    element: <PACSettings />,
  },
]);

export default router;
