import { MenuItemConstructorOptions } from 'electron';
export const template: MenuItemConstructorOptions[] = [
  {
    id: '0',
    label: 'v2ray-core: Off',
  },
  {
    id: '1',
    label: 'Turn v2ray-core On',
    accelerator: 'CmdOrCtrl+t',
  },
  {
    type: 'separator',
  },
  {
    id: '2',
    label: 'View Config.json',
  },
  {
    id: '3',
    label: 'View PAC File',
  },
  {
    id: '4',
    label: 'View Log',
  },
  {
    type: 'separator',
  },
  {
    id: '5',
    label: 'Pac Mode',
    type: 'radio',
  },
  {
    id: '6',
    label: 'Global Mode',
    type: 'radio',
  },
  {
    id: '7',
    label: 'Manual Mode',
    type: 'radio',
  },
  {
    type: 'separator',
  },
  {
    id: '8',
    label: 'Servers...',
  },
  {
    id: '9',
    label: 'Configure...',
    accelerator: 'CmdOrCtrl+c',
  },
  {
    id: '10',
    label: 'Subscriptions...',
  },
  {
    id: '11',
    label: 'PAC Settings...',
  },
  {
    id: '12',
    label: 'Connection Test...',
  },
  {
    type: 'separator',
  },
  {
    id: '13',
    label: 'Import Server From Pasteboard',
  },
  {
    id: '14',
    label: 'Scan QR Code From Screen',
  },
  {
    id: '15',
    label: 'Share Link/QR Code',
  },
  {
    type: 'separator',
  },
  {
    id: '16',
    label: 'Copy HTTP Proxy Shell Command',
    accelerator: 'CmdOrCtrl+e',
  },
  {
    type: 'separator',
  },
  {
    id: '17',
    label: 'Preferences...',
    accelerator: 'CmdOrCtrl+,',
  },
  {
    id: '18',
    label: 'Check for Updates',
  },
  {
    id: '19',
    label: 'Help',
  },
  {
    type: 'separator',
  },
  {
    id: '20',
    label: 'Quit',
    accelerator: 'CmdOrCtrl+q',
  },
];
