import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { set, cloneDeep } from 'lodash';
import { SettingsPageType } from '@renderer/constant/types';

export const readFromDbSettings = createAsyncThunk('readFromDbSettings', async () => {
  const state: SettingsPageType = await window.db.read('management');
  return state;
});

let logsDir = '';
window.api.send('v2rayx:settings:getDefaultLogDir');
window.api.receive('settings:getDefaultLogDir', (path: string) => {
  logsDir = path;
});

const styleInJson = JSON.stringify(
  {
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      },
      success: {
        main: '#2e7d32',
      },
      background: {
        paper: 'rgba(255,255,255,0.8)',
        default: 'rgba(255,255,255,0.8)',
      },
    },
  },
  null,
  2,
);
const defaultHttpInboundObject = {
  listen: '127.0.0.1',
  port: 10871,
  protocol: 'http',
  tag: 'http-inbound',
  allocate: {
    strategy: 'always',
    refresh: 5,
    concurrency: 3,
  },
};

const defaultSocksInboundObject = {
  listen: '127.0.0.1',
  port: 10801,
  protocol: 'socks',
  tag: 'socks-inbound',
  allocate: {
    strategy: 'always',
    refresh: 5,
    concurrency: 3,
  },
};

const initialState: SettingsPageType = {
  v2rayCore: {
    version: '5.12.1',
    isReinstallV2rayPackage: false,
  },
  generalSettings: {
    allowSystemNotification: true,
    autoStartProxy: false,
    dashboardPopWhenStart: true,
    applicationLogsFolder: logsDir,
    v2rayLogsFolder: logsDir,
    automaticUpgrade: {
      visiableUpgradeTip: true,
      autodownloadAndInstall: true,
    },
  },
  appearance: {
    theme: 'default',
    customStyle: false,
    styleInJson: styleInJson,
    followSystemTheme: false,
    fontFamily: '',
    hideTrayBar: false,
    enhancedTrayIcon: '',
  },
  systemProxy: {
    bypassDomains: `bypass:
  - 127.0.0.1
  - 192.168.0.0/16
  - 10.0.0.0/8
  - FE80::/64
  - ::1
  - FD00::/8,
  - localhost`,
    pacSetting: {
      banListUrl: '',
      userRules: '',
    },
  },
  proxies: {
    latencyTest: {
      url: 'http://www.gstatic.com/generate_204',
      timeout: 3000,
    },
  },
  v2rayConfigure: {
    inbounds: [defaultSocksInboundObject, defaultHttpInboundObject],
    dns: `{
    "hosts": {
      "dns.google": "8.8.8.8"
    }
}`,
  },
};

const settingsPageSlice = createSlice({
  name: 'settingsPage',
  initialState,
  reducers: {
    setSettingsPageState: (state, action: PayloadAction<Record<string, any>>) => {
      const { key, value } = action.payload;
      state = set(state, key, value);
      window.db.write('management', cloneDeep(state));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(readFromDbSettings.fulfilled, (state, action) => {
      state = action.payload;
      return state;
    });
  },
});

export const { setSettingsPageState } = settingsPageSlice.actions;

export default settingsPageSlice.reducer;
