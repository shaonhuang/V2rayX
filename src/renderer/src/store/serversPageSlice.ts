import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Servers, VmessObjConfiguration } from '@renderer/constant/types';
import { set, cloneDeep } from 'lodash';
import { emptyVmessV2 } from '@renderer/utils/protocol';

interface ServersPageState {
  serverTemplate?: VmessObjConfiguration;
  currentServerId: string[];
  serviceRunningState: boolean;
  servers: Servers;
  subscriptionServers: {
    string?: Servers;
  };
  subscriptionList: [{ string: string }] | [];
}

export const readFromDb = createAsyncThunk('readFromDb', async () => {
  const state: ServersPageState = {
    servers: [],
    subscriptionServers: {},
    subscriptionList: [],
    currentServerId: [],
    serviceRunningState: false,
    serverTemplate: emptyVmessV2(),
  };
  state.servers = await window.db.read('servers');
  state.currentServerId = await window.db.read('currentServerId');
  state.subscriptionList = await window.db.read('subscriptionList');
  state.subscriptionServers = await window.db.read('subscriptionList');
  return state;
});

const initialState: ServersPageState = {
  servers: [],
  subscriptionServers: {},
  subscriptionList: [],
  currentServerId: [],
  serviceRunningState: false,
  serverTemplate: emptyVmessV2(),
};

const serversPageSlice = createSlice({
  name: 'serversPage',
  initialState,
  reducers: {
    setServerTemplate: (state, action: PayloadAction<Record<string, any>>) => {
      const { key, value } = action.payload;
      state.serverTemplate = set(state.serverTemplate, key, value);
      window.db.write('serverTemplate', cloneDeep(state.serverTemplate));
    },
    setCurrentServerId: (state, action: PayloadAction<string[]>) => {
      state.currentServerId = action.payload;
      window.db.write('currentServerId', action.payload);
    },
    setServersState: (state, action: PayloadAction<any[]>) => {
      state.servers = action.payload;
      window.db.write('servers', action.payload);
    },
    setServiceRunningState: (state, action: PayloadAction<boolean>) => {
      state.serviceRunningState = action.payload;
      window.db.write('serviceRunningState', action.payload);
    },
    setSubscriptionList: (state, action: PayloadAction<[]>) => {
      state.subscriptionList = action.payload;
      window.db.write('subscriptionList', action.payload);
    },
    setSubscriptionServers: (state, action: PayloadAction<Record<string, any>>) => {
      const { key, value } = action.payload;
      state.subscriptionServers = set(state.subscriptionServers, key, value);
      window.db.write('subscriptionServers', cloneDeep(state.subscriptionServers));
    },
    readSubscriptionListFromDB: (state, action: PayloadAction<[]>) => {
      state.subscriptionList = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(readFromDb.fulfilled, (state, action) => {
      state.servers = action.payload.servers;
      state.currentServerId = action.payload.currentServerId;
      state.subscriptionList = action.payload.subscriptionList;
      state.subscriptionServers = action.payload.subscriptionServers;
      state.serverTemplate = action.payload.serverTemplate;
      return state;
    });
  },
});

export const {
  setCurrentServerId,
  setServersState,
  setSubscriptionList,
  setSubscriptionServers,
  setServerTemplate,
  readSubscriptionListFromDB,
} = serversPageSlice.actions;

export default serversPageSlice.reducer;
