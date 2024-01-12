import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Subscription, ServersGroup } from '@renderer/constant/types';

interface ServersPageState {
  currentServerId: string[];
  serviceRunningState: boolean;
  serversGroups: ServersGroup[];
  subscriptionList: Subscription[];
}

export const readFromDb = createAsyncThunk('readFromDb', async () => {
  const state: ServersPageState = {
    serversGroups: [],
    subscriptionList: [],
    currentServerId: [],
    serviceRunningState: false,
  };
  state.currentServerId = await window.db.read('currentServerId');
  state.subscriptionList = await window.db.read('subscriptionList');
  state.serversGroups = await window.db.read('serversGroups');
  return state;
});

const initialState: ServersPageState = {
  serversGroups: [],
  subscriptionList: [],
  currentServerId: [],
  serviceRunningState: false,
};

const serversPageSlice = createSlice({
  name: 'serversPage',
  initialState,
  reducers: {
    setCurrentServerId: (state, action: PayloadAction<string[]>) => {
      state.currentServerId = action.payload;
      window.db.write('currentServerId', action.payload);
    },
    setServiceRunningState: (state, action: PayloadAction<boolean>) => {
      state.serviceRunningState = action.payload;
      window.db.write('serviceRunningState', action.payload);
    },
    setSubscriptionList: (state, action: PayloadAction<Subscription[]>) => {
      state.subscriptionList = action.payload;
      window.db.write('subscriptionList', action.payload);
    },
    setServersGroups: (state, action: PayloadAction<ServersGroup[]>) => {
      state.serversGroups = action.payload;
      window.db.write('serversGroups', action.payload);
    },
    syncServersGroupsFromDB: (state, action: PayloadAction<ServersGroup[]>) => {
      state.serversGroups = action.payload;
    },
    syncFetchedSubscriptionServersFromDB: (state, action: PayloadAction<ServersGroup[]>) => {
      state.serversGroups = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(readFromDb.fulfilled, (state, action) => {
      state.currentServerId = action.payload.currentServerId;
      state.subscriptionList = action.payload.subscriptionList;
      state.serversGroups = action.payload.serversGroups;
      return state;
    });
  },
});

export const {
  setCurrentServerId,
  setSubscriptionList,
  setServersGroups,
  setServiceRunningState,
  syncServersGroupsFromDB,
  syncFetchedSubscriptionServersFromDB,
} = serversPageSlice.actions;

export default serversPageSlice.reducer;
