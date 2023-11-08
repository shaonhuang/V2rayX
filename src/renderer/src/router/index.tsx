import { createHashRouter } from 'react-router-dom';

import GernalSettings from '@renderer/pages/Home';
import Servers from '@renderer/pages/servers/Servers';
import About from '@renderer/pages/About';
import Logs from '@renderer/pages/Logs';

const router = createHashRouter([
  {
    path: '/',
    element: <GernalSettings />,
  },
  {
    path: '/home',
    element: <GernalSettings />,
  },
  {
    path: '/servers',
    element: <Servers />,
  },
  {
    path: '/logs',
    element: <Logs />,
  },
  {
    path: '/about',
    element: <About />,
  },
]);

export default router;
