import { createHashRouter } from 'react-router-dom';
import { createRoutesFromElements, Route, Outlet, Routes, redirect } from 'react-router-dom';

import Navigation from '@renderer/components/navigation/Navigation';
import GernalSettings from '@renderer/pages/Home';
import Servers from '@renderer/pages/servers';
import About from '@renderer/pages/About';
import Logs from '@renderer/pages/Logs';

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
        path: '/index/about',
        element: <About />,
      },
    ],
  },
  {
    path: '/servers/*',
    element: <ConfigPage />,
  },
]);

export default router;
